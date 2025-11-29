import { useRef, useEffect, useState, useCallback } from "react"
import { DanmakuManager } from "./DanmakuManager"
import { DanmakuConfig, DanmakuInstance } from "@/lib/types"
import { useStore } from "@/lib/states"
import { formatTime, generateDanmakuId } from "@/lib/utils"
import { Play, Pause } from "lucide-react"
import { Button } from "../ui/button"

interface VideoPlayerProps {
  file: File
}

export default function VideoPlayer({ file }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const danmakuManagerRef = useRef<DanmakuManager | null>(null)
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const videoUrlRef = useRef<string | null>(null) // 存储视频 URL

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [selectedDanmaku, setSelectedDanmaku] = useState<DanmakuInstance | null>(null)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)

  // 从store获取弹幕配置和状态
  const danmakus = useStore((state) => state.danmakus)
  const addDanmaku = useStore((state) => state.addDanmaku)
  const updateVideoState = useStore((state) => state.updateVideoState)
  const hasDefaultDanmakuRef = useRef<string | null>(null) // 使用文件标识来跟踪是否已添加默认弹幕

  // 文件URL缓存（避免重复创建相同文件的URL）
  const fileUrlCacheRef = useRef<Map<string, { url: string; timestamp: number }>>(new Map())
  const CACHE_EXPIRY = 5 * 60 * 1000 // 5分钟缓存

  // 创建和管理视频 URL（优化：使用缓存）
  useEffect(() => {
    if (!file) return

    setIsLoading(true)
    setLoadProgress(0)
    setError(null)
    setIsPlaying(false)
    setCurrentTime(0)

    // 生成文件唯一标识
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`
    const cached = fileUrlCacheRef.current.get(fileKey)

    // 检查缓存是否有效
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      videoUrlRef.current = cached.url
      setIsLoading(false)
      return
    }

    // 清理旧的 URL（如果不是缓存的）
    if (videoUrlRef.current && !Array.from(fileUrlCacheRef.current.values()).some(c => c.url === videoUrlRef.current)) {
      URL.revokeObjectURL(videoUrlRef.current)
    }

    // 创建新的 URL
    try {
      const url = URL.createObjectURL(file)
      videoUrlRef.current = url
      
      // 更新缓存
      fileUrlCacheRef.current.set(fileKey, { url, timestamp: Date.now() })
      
      // 清理过期缓存
      const now = Date.now()
      for (const [key, value] of fileUrlCacheRef.current.entries()) {
        if (now - value.timestamp > CACHE_EXPIRY) {
          URL.revokeObjectURL(value.url)
          fileUrlCacheRef.current.delete(key)
        }
      }

      setIsLoading(false)
    } catch (err: any) {
      console.error("[VideoPlayer] Failed to create object URL:", err)
      setError(`无法创建视频 URL: ${err.message || "未知错误"}`)
      videoUrlRef.current = null
      setIsLoading(false)
    }

    return () => {
      // 组件卸载时不立即清理URL（保留在缓存中）
      // 只有在缓存过期时才会清理
    }
  }, [file])

  // 初始化弹幕管理器（优化：减少重复初始化）
  useEffect(() => {
    const videoUrl = videoUrlRef.current
    if (!canvasRef.current || !videoRef.current || !videoUrl || isLoading) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // 重置标记（文件变化时）
    const fileId = `${file.name}-${file.size}-${file.lastModified}`
    const isNewFile = hasDefaultDanmakuRef.current !== fileId

    let timeoutId: NodeJS.Timeout | null = null
    let metadataLoaded = false

    const handleLoadedMetadata = () => {
      if (metadataLoaded) return // 防止重复执行
      metadataLoaded = true

      // 清除超时定时器
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      const width = video.videoWidth
      const height = video.videoHeight
      
      // 检查视频尺寸是否有效
      if (width === 0 || height === 0) {
        setError("视频尺寸无效，可能是文件损坏或不支持的格式")
        setIsLoading(false)
        return
      }

      // 只在需要时重新创建弹幕管理器（文件变化或尺寸变化）
      if (!danmakuManagerRef.current || isNewFile) {
        danmakuManagerRef.current = new DanmakuManager(canvas, width, height)
        console.log("[VideoPlayer] DanmakuManager initialized", width, height)
        
        // 重置 prevDanmakusRef，确保下次同步时能正确识别新增弹幕
        prevDanmakusRef.current = new Map()
        
        // 如果已有弹幕，立即同步（处理视频加载前添加的弹幕）
        if (danmakus.length > 0) {
          console.log("[VideoPlayer] Syncing existing danmakus after initialization:", danmakus.length)
          const currentTime = video.currentTime || 0
          danmakus.forEach((danmaku) => {
            try {
              danmakuManagerRef.current?.addDanmaku(danmaku.config, danmaku.parentId, danmaku.id, currentTime)
            } catch (error) {
              console.error("[VideoPlayer] Failed to sync danmaku:", error, danmaku)
            }
          })
          // 更新 prevDanmakusRef，避免重复添加
          prevDanmakusRef.current = new Map(danmakus.map((d) => [d.id, d]))
        }
      }

      setDuration(video.duration)
      updateVideoState({
        file,
        duration: video.duration,
        currentTime: 0,
        isPlaying: false,
        volume: video.volume,
      })
      setError(null)
      setIsLoading(false)

      // 延迟添加默认弹幕，避免阻塞主流程
      if (isNewFile) {
        setTimeout(() => {
          if (hasDefaultDanmakuRef.current !== fileId) {
            const defaultDanmaku: DanmakuInstance = {
              id: generateDanmakuId(),
              config: {
                text: "weMediaGo牛逼",
                color: "#FFFFFF",
                fontSize: 24,
                fontFamily: "Arial",
                speed: 100,
                mode: "scroll",
                startTime: 0,
              },
              x: 0,
              y: 0,
              width: 0,
              height: 0,
              isVisible: true,
            }
            addDanmaku(defaultDanmaku)
            hasDefaultDanmakuRef.current = fileId
          }
        }, 100) // 延迟100ms，不阻塞UI
      }
    }

    // 设置超时检查（10秒）
    timeoutId = setTimeout(() => {
      if (video.readyState < 1 && !metadataLoaded) {
        setError("视频加载超时，请检查文件格式是否支持（支持 MP4、WebM 等格式）")
        setIsLoading(false)
      }
    }, 10000)

    // 如果视频已经加载了元数据，立即执行
    if (video.readyState >= 1) {
      handleLoadedMetadata()
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      if (isNewFile) {
        danmakuManagerRef.current?.clear()
      }
    }
  }, [file, updateVideoState, addDanmaku, isLoading])

  // 监听弹幕变化并同步到弹幕管理器（增量更新）
  const prevDanmakusRef = useRef<Map<string, DanmakuInstance>>(new Map())
  
  useEffect(() => {
    if (!danmakuManagerRef.current) {
      console.log("[VideoPlayer] DanmakuManager not ready, skipping sync")
      return
    }

    const currentMap = new Map(danmakus.map((d) => [d.id, d]))
    const prevMap = prevDanmakusRef.current

    // 如果是首次加载（prevMap为空），直接添加所有弹幕
    if (prevMap.size === 0 && currentMap.size > 0) {
      console.log("[VideoPlayer] Initial load, adding all danmakus:", currentMap.size)
      const currentTime = videoRef.current?.currentTime || 0
      currentMap.forEach((danmaku) => {
        danmakuManagerRef.current?.addDanmaku(danmaku.config, danmaku.parentId, danmaku.id, currentTime)
      })
      prevDanmakusRef.current = currentMap
      return
    }

    // 找出新增和修改的弹幕
    const toAdd: DanmakuInstance[] = []
    const toUpdate: DanmakuInstance[] = []
    
    currentMap.forEach((danmaku, id) => {
      const prev = prevMap.get(id)
      if (!prev) {
        // 新增的弹幕
        toAdd.push(danmaku)
      } else if (
        prev.config.text !== danmaku.config.text ||
        prev.config.color !== danmaku.config.color ||
        prev.config.fontSize !== danmaku.config.fontSize ||
        prev.config.fontFamily !== danmaku.config.fontFamily ||
        prev.config.speed !== danmaku.config.speed ||
        prev.config.mode !== danmaku.config.mode ||
        prev.config.startTime !== danmaku.config.startTime ||
        prev.config.duration !== danmaku.config.duration ||
        prev.parentId !== danmaku.parentId
      ) {
        // 配置有变化的弹幕
        toUpdate.push(danmaku)
      }
    })

    // 找出删除的弹幕
    const toRemove: string[] = []
    prevMap.forEach((_, id) => {
      if (!currentMap.has(id)) {
        toRemove.push(id)
      }
    })

    // 执行增量更新
    if (toRemove.length > 0) {
      console.log("[VideoPlayer] Removing danmakus:", toRemove.length)
      toRemove.forEach((id) => {
        danmakuManagerRef.current?.removeDanmaku(id)
      })
    }

    if (toUpdate.length > 0) {
      console.log("[VideoPlayer] Updating danmakus:", toUpdate.length)
      const currentTime = videoRef.current?.currentTime || 0
      toUpdate.forEach((danmaku) => {
        danmakuManagerRef.current?.removeDanmaku(danmaku.id)
        danmakuManagerRef.current?.addDanmaku(danmaku.config, danmaku.parentId, danmaku.id, currentTime)
      })
    }

    if (toAdd.length > 0) {
      console.log("[VideoPlayer] Adding new danmakus:", toAdd.length, toAdd.map(d => d.config.text))
      const currentTime = videoRef.current?.currentTime || 0
      toAdd.forEach((danmaku) => {
        try {
          danmakuManagerRef.current?.addDanmaku(danmaku.config, danmaku.parentId, danmaku.id, currentTime)
        } catch (error) {
          console.error("[VideoPlayer] Failed to add danmaku:", error, danmaku)
        }
      })
    }

    // 更新引用
    prevDanmakusRef.current = currentMap
  }, [danmakus])

  // 动画循环（优化：只在视频加载完成后启动）
  useEffect(() => {
    if (isLoading || !videoRef.current || !danmakuManagerRef.current) return

    const animate = (timestamp: number) => {
      if (!videoRef.current || !danmakuManagerRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      const video = videoRef.current
      const currentTime = video.currentTime
      const deltaTime = (timestamp - lastTimeRef.current) / 1000 // 转换为秒
      lastTimeRef.current = timestamp

      // 更新弹幕（不在这里更新currentTime，由handleTimeUpdate处理）
      danmakuManagerRef.current.update(currentTime, deltaTime)
      danmakuManagerRef.current.render()

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isLoading])

  // 视频事件处理（优化：节流更新）
  const timeUpdateThrottleRef = useRef<number>(0)
  const THROTTLE_INTERVAL = 100 // 100ms更新一次

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    
    const now = Date.now()
    if (now - timeUpdateThrottleRef.current < THROTTLE_INTERVAL) return
    timeUpdateThrottleRef.current = now

    const currentTime = videoRef.current.currentTime
    setCurrentTime(currentTime)
    updateVideoState({ currentTime })
  }, [updateVideoState])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      updateVideoState({ duration: videoRef.current.duration })
    }
  }, [updateVideoState])

  const handlePlay = useCallback(async () => {
    if (!videoRef.current) {
      setError("视频元素未就绪")
      return
    }

    try {
      await videoRef.current.play()
      setIsPlaying(true)
      updateVideoState({ isPlaying: true })
      setError(null) // 清除之前的错误
    } catch (error: any) {
      console.error("[VideoPlayer] Failed to play video:", error)
      const errorMsg = error.message || "未知错误"
      setError(`播放失败: ${errorMsg}`)
      setIsPlaying(false)
      updateVideoState({ isPlaying: false })
    }
  }, [updateVideoState])

  const handlePause = useCallback(() => {
    if (!videoRef.current) return

    try {
      videoRef.current.pause()
      setIsPlaying(false)
      updateVideoState({ isPlaying: false })
    } catch (error: any) {
      console.error("[VideoPlayer] Failed to pause video:", error)
    }
  }, [updateVideoState])

  // 弹幕点击检测（修复：坐标转换）
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !danmakuManagerRef.current || !videoRef.current) return

      const canvas = canvasRef.current
      const video = videoRef.current
      const rect = canvas.getBoundingClientRect()
      
      // 获取点击位置相对于canvas的坐标
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      
      // 计算视频在canvas中的实际显示区域（考虑object-contain）
      const canvasAspect = rect.width / rect.height
      const videoAspect = video.videoWidth / video.videoHeight
      
      let videoX: number, videoY: number
      
      if (canvasAspect > videoAspect) {
        // canvas更宽，视频上下有黑边
        const videoDisplayHeight = rect.height
        const videoDisplayWidth = videoDisplayHeight * videoAspect
        const offsetX = (rect.width - videoDisplayWidth) / 2
        
        videoX = ((clickX - offsetX) / videoDisplayWidth) * video.videoWidth
        videoY = (clickY / videoDisplayHeight) * video.videoHeight
      } else {
        // canvas更高，视频左右有黑边
        const videoDisplayWidth = rect.width
        const videoDisplayHeight = videoDisplayWidth / videoAspect
        const offsetY = (rect.height - videoDisplayHeight) / 2
        
        videoX = (clickX / videoDisplayWidth) * video.videoWidth
        videoY = ((clickY - offsetY) / videoDisplayHeight) * video.videoHeight
      }
      
      // 检查坐标是否在视频范围内
      if (videoX >= 0 && videoX <= video.videoWidth && videoY >= 0 && videoY <= video.videoHeight) {
        const danmaku = danmakuManagerRef.current.getDanmakuAt(videoX, videoY)
        if (danmaku) {
          setSelectedDanmaku(danmaku)
          setShowReplyInput(true)
        }
      }
    },
    []
  )

  // 添加弹幕（用于回复功能）
  const handleAddDanmaku = useCallback(
    (config: DanmakuConfig, parentId?: string) => {
      if (!videoRef.current) return

      // 如果是回复弹幕，startTime应该和父弹幕相同（已在config中设置）
      // 如果不是回复，使用当前时间
      const startTime = config.startTime ?? videoRef.current.currentTime

      const instance: DanmakuInstance = {
        id: generateDanmakuId(),
        config: { ...config, startTime },
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        parentId,
        replies: [],
        isVisible: true,
      }

      addDanmaku(instance)
    },
    [addDanmaku]
  )

  // 处理回复（修复：继承父弹幕配置）
  const handleReply = useCallback(() => {
    if (!selectedDanmaku || !replyText.trim()) return

    // 继承父弹幕的配置，但使用较小的字体和不同的颜色以示区别
    const config: DanmakuConfig = {
      text: replyText,
      color: selectedDanmaku.config.color === "#FFFFFF" ? "#FFD700" : selectedDanmaku.config.color, // 如果父弹幕是白色，回复用金色
      fontSize: Math.max(16, selectedDanmaku.config.fontSize - 4), // 比父弹幕小4px，最小16px
      fontFamily: selectedDanmaku.config.fontFamily,
      speed: selectedDanmaku.config.speed,
      mode: selectedDanmaku.config.mode, // 继承父弹幕的模式
      startTime: selectedDanmaku.config.startTime, // 使用父弹幕的startTime，确保跟随
      duration: selectedDanmaku.config.duration, // 继承持续时间
    }

    handleAddDanmaku(config, selectedDanmaku.id)
    setReplyText("")
    setShowReplyInput(false)
    setSelectedDanmaku(null)
  }, [selectedDanmaku, replyText, handleAddDanmaku])

  return (
    <div className="relative w-full h-full flex flex-col bg-background">
      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg m-4 text-red-600">
          {error}
        </div>
      )}

      <div className="relative flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
        {(!videoUrlRef.current || isLoading) && file && (
          <div className="flex flex-col items-center justify-center h-full text-white gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p>正在加载视频...</p>
            {loadProgress > 0 && (
              <div className="w-64">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs mt-1 text-center">{Math.round(loadProgress)}%</p>
              </div>
            )}
          </div>
        )}
        {videoUrlRef.current && (
          <video
            ref={videoRef}
            src={videoUrlRef.current}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onError={(e) => {
              console.error("[VideoPlayer] Video error:", e)
              const video = e.currentTarget
              const error = video.error
              if (error) {
                let errorMsg = "视频加载失败: "
                switch (error.code) {
                  case error.MEDIA_ERR_ABORTED:
                    errorMsg += "播放被中止"
                    break
                  case error.MEDIA_ERR_NETWORK:
                    errorMsg += "网络错误"
                    break
                  case error.MEDIA_ERR_DECODE:
                    errorMsg += "解码错误"
                    break
                  case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMsg += "不支持的格式"
                    break
                  default:
                    errorMsg += error.message || "未知错误"
                }
                console.error("Video error code:", error.code, "message:", error.message)
                setError(errorMsg)
              }
            }}
            onLoadStart={() => {
              console.log("[VideoPlayer] Video load started")
              setError(null) // 开始加载时清除错误
            }}
            onCanPlay={() => {
              console.log("[VideoPlayer] Video can play")
              setError(null)
              setIsLoading(false)
            }}
            onWaiting={() => {
              console.log("[VideoPlayer] Video waiting for data")
              setIsLoading(true)
            }}
            onProgress={(e) => {
              if (e.currentTarget.buffered.length > 0) {
                const buffered = e.currentTarget.buffered.end(0)
                const duration = e.currentTarget.duration
                if (duration > 0) {
                  const progress = (buffered / duration) * 100
                  setLoadProgress(progress)
                }
              }
            }}
            onLoadedData={() => {
              setIsLoading(false)
            }}
            controls={false}
            playsInline
            preload="metadata"
          />
        )}

        {/* 弹幕层 */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-auto"
          onClick={handleCanvasClick}
          style={{ zIndex: 10 }}
        />

        {/* 弹幕选择提示 */}
        {selectedDanmaku && showReplyInput && (
          <div className="absolute top-4 right-4 bg-background/90 p-4 rounded shadow-lg z-20 min-w-[200px] border">
            <p className="text-sm mb-2 font-semibold">回复弹幕</p>
            <p className="text-xs mb-3 text-gray-400 truncate">原弹幕: {selectedDanmaku.config.text}</p>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && replyText.trim()) {
                  handleReply()
                } else if (e.key === "Escape") {
                  setShowReplyInput(false)
                  setSelectedDanmaku(null)
                }
              }}
              placeholder="输入回复内容（最多10字）"
              className="w-full px-2 py-1 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={10}
              autoFocus
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleReply} 
                size="sm"
                disabled={!replyText.trim()}
              >
                回复
              </Button>
              <Button
                onClick={() => {
                  setShowReplyInput(false)
                  setSelectedDanmaku(null)
                  setReplyText("")
                }}
                size="sm"
                variant="outline"
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 播放控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 z-30">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => {
            if (videoRef.current) {
              videoRef.current.currentTime = parseFloat(e.target.value)
            }
          }}
          className="w-full mb-2"
        />
        <div className="flex justify-between items-center text-white text-sm">
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={isPlaying ? handlePause : handlePlay}
              size="sm"
              variant="outline"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

