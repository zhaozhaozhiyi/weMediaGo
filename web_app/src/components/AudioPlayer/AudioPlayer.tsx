import { useRef, useEffect, useState, useCallback } from "react"
import { useStore } from "@/lib/states"
import { formatTime } from "@/lib/utils"
import SpectrumVisualizer from "./SpectrumVisualizer"
import WaveformVisualizer from "./WaveformVisualizer"
import Particles3DVisualizer from "./Particles3DVisualizer"
import { Play, Pause } from "lucide-react"
import { Button } from "../ui/button"

interface AudioPlayerProps {
  file: File
}

export default function AudioPlayer({ file }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const isInitializedRef = useRef(false) // 防止重复初始化
  const audioUrlRef = useRef<string | null>(null) // 存储音频 URL

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioInfo, setAudioInfo] = useState<{
    duration: number
    sampleRate: number
    channels: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const audioState = useStore((state) => state.audioState)
  const updateAudioState = useStore((state) => state.updateAudioState)
  const visualizationType = audioState?.visualizationType || "spectrum"

  // 创建和管理音频 URL
  useEffect(() => {
    if (file) {
      // 清理旧的 URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      // 创建新的 URL
      audioUrlRef.current = URL.createObjectURL(file)
      console.log("[AudioPlayer] Created audio URL:", audioUrlRef.current, "for file:", file.name, file.type)
    }

    return () => {
      // 组件卸载时清理 URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
    }
  }, [file])

  // 创建 AudioContext 和 analyser（文件变化时重新创建）
  useEffect(() => {
    if (!file) return

    let isMounted = true

    // 清理旧的资源
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect()
      } catch (e) {
        // 忽略断开连接错误
      }
      sourceRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {})
    }

    try {
      console.log("[AudioPlayer] Creating AudioContext and analyser for file:", file.name)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContextClass()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256

      if (!isMounted) {
        audioContext.close().catch(() => {})
        return
      }

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      isInitializedRef.current = true

      console.log("[AudioPlayer] AudioContext and analyser created, state:", audioContext.state)
    } catch (err: any) {
      console.error("[AudioPlayer] Failed to create AudioContext:", err)
      setError(`初始化音频失败: ${err.message || "未知错误"}`)
    }

    return () => {
      isMounted = false
    }
  }, [file]) // 文件变化时重新创建

  // 连接 audio 元素到 AudioContext（当 audio 元素准备好时）
  useEffect(() => {
    if (!file || !audioUrlRef.current) {
      return
    }

    // 使用轮询检查 audio 元素和 AudioContext 是否准备好
    let attemptCount = 0
    const maxAttempts = 50 // 最多尝试 2.5 秒（50 * 50ms）
    let timeoutId: NodeJS.Timeout | null = null
    let isMounted = true

    const tryConnect = async () => {
      if (!isMounted) return

      // 检查所有必要的引用
      if (!audioRef.current || !audioContextRef.current || !analyserRef.current) {
        attemptCount++
        if (attemptCount < maxAttempts) {
          timeoutId = setTimeout(tryConnect, 50)
        } else {
          console.warn("[AudioPlayer] Audio element or context not ready after max attempts")
        }
        return
      }

      // 如果已经连接过，先断开
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect()
        } catch (e) {
          // 忽略错误
        }
        sourceRef.current = null
      }

      const audio = audioRef.current
      const audioContext = audioContextRef.current
      const analyser = analyserRef.current

      // 确保 AudioContext 处于运行状态
      if (audioContext.state === "suspended") {
        try {
          await audioContext.resume()
          console.log("[AudioPlayer] AudioContext resumed")
        } catch (err) {
          console.error("[AudioPlayer] Failed to resume AudioContext:", err)
        }
      }

      try {
        console.log("[AudioPlayer] Connecting audio element to AudioContext, state:", audioContext.state)
        const source = audioContext.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioContext.destination)

        if (!isMounted) {
          try {
            source.disconnect()
          } catch (e) {}
          return
        }

        sourceRef.current = source
        console.log("[AudioPlayer] Audio element connected successfully")
      } catch (err: any) {
        if (err.message && err.message.includes("already connected")) {
          console.warn("[AudioPlayer] Audio element already connected, reconnecting...")
          // 尝试重新连接
          try {
            const source = audioContext.createMediaElementSource(audio)
            source.connect(analyser)
            analyser.connect(audioContext.destination)
            sourceRef.current = source
            console.log("[AudioPlayer] Reconnected successfully")
          } catch (reconnectErr: any) {
            console.error("[AudioPlayer] Reconnection failed:", reconnectErr)
            setError(`连接音频失败: ${reconnectErr.message || "未知错误"}`)
          }
        } else {
          console.error("[AudioPlayer] Failed to connect audio element:", err)
          setError(`连接音频失败: ${err.message || "未知错误"}`)
        }
      }
    }

    // 延迟一下确保 audio 元素已经创建
    timeoutId = setTimeout(tryConnect, 100)

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [file]) // 当文件变化时重新连接

  // 解析音频文件获取AudioBuffer（与 AudioContext 创建分离，可以并行进行）
  useEffect(() => {
    if (!file) return

    let isMounted = true

    console.log("[AudioPlayer] Starting to decode audio file...")
    file
      .arrayBuffer()
      .then((buffer) => {
        if (!isMounted) return null
        console.log("[AudioPlayer] Audio file loaded, size:", buffer.byteLength)
        
        // 使用现有的 AudioContext 或创建新的临时上下文来解码
        const context = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)()
        return context.decodeAudioData(buffer.slice(0))
      })
      .then((decoded) => {
        if (!isMounted || !decoded) return
        console.log("[AudioPlayer] Audio decoded successfully:", {
          duration: decoded.duration,
          sampleRate: decoded.sampleRate,
          channels: decoded.numberOfChannels,
        })
        setAudioBuffer(decoded)
        setAudioInfo({
          duration: decoded.duration,
          sampleRate: decoded.sampleRate,
          channels: decoded.numberOfChannels,
        })
        // 保持当前的播放状态和可视化类型，不要重置
        updateAudioState({
          file,
          duration: decoded.duration,
          currentTime: audioRef.current?.currentTime || audioState?.currentTime || 0,
          isPlaying: audioState?.isPlaying ?? false,
          volume: audioState?.volume ?? 1,
          audioBuffer: decoded,
          visualizationType: audioState?.visualizationType || visualizationType,
          audioInfo: {
            duration: decoded.duration,
            sampleRate: decoded.sampleRate,
            channels: decoded.numberOfChannels,
          },
        })
        setError(null)
      })
      .catch((error) => {
        if (!isMounted) return
        console.error("[AudioPlayer] Failed to decode audio:", error)
        setError(`无法解码音频文件: ${error.message || "未知错误"}`)
      })

    return () => {
      isMounted = false
    }
  }, [file, updateAudioState, audioState, visualizationType])

  // 清理资源（组件卸载时）
  useEffect(() => {
    return () => {
      console.log("[AudioPlayer] Cleaning up audio context")
      // 清理资源
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect()
        } catch (e) {
          // 忽略断开连接错误
        }
        sourceRef.current = null
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect()
        } catch (e) {
          // 忽略断开连接错误
        }
        analyserRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {
          // 忽略关闭错误
        })
        audioContextRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [])

  // 播放控制
  const handlePlay = useCallback(async () => {
    if (!audioRef.current) {
      console.warn("[AudioPlayer] Audio element not available")
      return
    }

    try {
      // 确保 AudioContext 和连接都已准备好
      if (!audioContextRef.current || !analyserRef.current || !sourceRef.current) {
        console.warn("[AudioPlayer] AudioContext or analyser not ready, waiting...")
        // 等待一下再重试
        setTimeout(() => handlePlay(), 100)
        return
      }

      // 如果 AudioContext 被暂停，需要恢复
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume()
        console.log("[AudioPlayer] AudioContext resumed, state:", audioContextRef.current.state)
      }

      // 如果音频已播放完毕，重置到开始位置
      if (audioRef.current.ended || audioRef.current.currentTime >= duration) {
        audioRef.current.currentTime = 0
        setCurrentTime(0)
        updateAudioState({ currentTime: 0 })
      }

      // 播放音频（处理 Promise）
      await audioRef.current.play()
      setIsPlaying(true)
      updateAudioState({ isPlaying: true })
      setError(null) // 清除之前的错误
      console.log("[AudioPlayer] Audio playing, AudioContext state:", audioContextRef.current.state)
    } catch (error: any) {
      console.error("[AudioPlayer] Failed to play audio:", error)
      const errorMsg = error.message || "未知错误"
      setError(`播放失败: ${errorMsg}`)
      setIsPlaying(false)
      updateAudioState({ isPlaying: false })
    }
  }, [updateAudioState, duration])

  const handlePause = useCallback(() => {
    if (!audioRef.current) return
    
    try {
      audioRef.current.pause()
      setIsPlaying(false)
      updateAudioState({ isPlaying: false })
    } catch (error: any) {
      console.error("[AudioPlayer] Failed to pause audio:", error)
    }
  }, [updateAudioState])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime
      setCurrentTime(currentTime)
      updateAudioState({ currentTime })
    }
  }, [updateAudioState])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      updateAudioState({ duration: audioRef.current.duration })
    }
  }, [updateAudioState])

  const handleSeek = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time
        setCurrentTime(time)
        updateAudioState({ currentTime: time })
      }
    },
    [updateAudioState]
  )

  // 如果文件变化，清理状态
  useEffect(() => {
    setError(null)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    setAudioBuffer(null)
    setAudioInfo(null)
  }, [file])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg m-4 text-red-600">
          {error}
        </div>
      )}

      {/* 可视化区域 */}
      <div className="flex-1 relative bg-black min-h-[400px] rounded-t-lg overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full text-white">
            <p>无法加载音频可视化: {error}</p>
          </div>
        ) : visualizationType === "spectrum" ? (
          analyserRef.current ? (
            <SpectrumVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>正在初始化频谱分析器...</p>
            </div>
          )
        ) : visualizationType === "waveform2d" ? (
          audioBuffer ? (
            <WaveformVisualizer
              audioBuffer={audioBuffer}
              currentTime={currentTime}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>正在加载音频数据...</p>
            </div>
          )
        ) : visualizationType === "particles3d" ? (
          analyserRef.current ? (
            <Particles3DVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>正在初始化3D粒子系统...</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <p>请选择可视化类型</p>
          </div>
        )}
      </div>

      {/* 播放控制 */}
      <div className="p-4 bg-gray-900 text-white rounded-b-lg">
        {/* 可视化类型切换 */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => {
              // 只更新可视化类型，不影响播放状态
              updateAudioState({ visualizationType: "spectrum" })
            }}
            variant={visualizationType === "spectrum" ? "default" : "outline"}
            size="sm"
          >
            频谱图
          </Button>
          <Button
            onClick={() => {
              // 只更新可视化类型，不影响播放状态
              updateAudioState({ visualizationType: "waveform2d" })
            }}
            variant={visualizationType === "waveform2d" ? "default" : "outline"}
            size="sm"
          >
            波形图
          </Button>
          <Button
            onClick={() => {
              // 只更新可视化类型，不影响播放状态
              updateAudioState({ visualizationType: "particles3d" })
            }}
            variant={visualizationType === "particles3d" ? "default" : "outline"}
            size="sm"
          >
            3D粒子
          </Button>
        </div>

        {/* 进度条 */}
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="w-full mb-2"
        />

        {/* 时间显示 */}
        <div className="flex justify-between text-sm mb-2">
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {audioInfo && (
            <span>
              采样率: {audioInfo.sampleRate}Hz | 声道: {audioInfo.channels}
            </span>
          )}
        </div>

        {/* 播放控制按钮 */}
        <div className="flex gap-2">
          <Button onClick={isPlaying ? handlePause : handlePlay} size="sm">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {audioUrlRef.current && (
        <audio
          ref={audioRef}
          src={audioUrlRef.current}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={(e) => {
            console.error("[AudioPlayer] Audio error:", e)
            const audio = e.currentTarget
            const error = audio.error
            if (error) {
              let errorMsg = "音频加载失败: "
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
              console.error("Audio error code:", error.code, "message:", error.message)
              setError(errorMsg)
            }
          }}
          onLoadStart={() => console.log("[AudioPlayer] Audio load started")}
          onCanPlay={() => console.log("[AudioPlayer] Audio can play")}
          onWaiting={() => console.log("[AudioPlayer] Audio waiting for data")}
          onEnded={() => {
            setIsPlaying(false)
            updateAudioState({ isPlaying: false, currentTime: 0 })
            // 重置到开始位置，以便重新播放
            if (audioRef.current) {
              audioRef.current.currentTime = 0
            }
          }}
          preload="auto"
        />
      )}
    </div>
  )
}

