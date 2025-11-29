import { useRef, useEffect, useState } from "react"

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null
  currentTime: number
  width?: number
  height?: number
}

export default function WaveformVisualizer({
  audioBuffer,
  currentTime,
  width,
  height,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 })
  const waveformDataRef = useRef<Float32Array | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // 响应式调整画布尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const newWidth = width || rect.width || 800
        const newHeight = height || rect.height || 400
        if (newWidth > 0 && newHeight > 0) {
          setCanvasSize({ width: newWidth, height: newHeight })
        }
      }
    }

    // 初始设置
    updateSize()

    // 使用 ResizeObserver 监听容器尺寸变化
    if (containerRef.current && window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(updateSize)
      resizeObserverRef.current.observe(containerRef.current)
    } else {
      // 降级到 window resize 事件
      window.addEventListener("resize", updateSize)
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      } else {
        window.removeEventListener("resize", updateSize)
      }
    }
  }, [width, height])

  // 预处理音频数据（降采样以提高性能）
  useEffect(() => {
    if (!audioBuffer) {
      waveformDataRef.current = null
      return
    }

    const channelData = audioBuffer.getChannelData(0)
    const targetSamples = canvasSize.width
    const samplesPerPixel = Math.ceil(channelData.length / targetSamples)
    const processedData = new Float32Array(targetSamples)

    // 对每个像素位置，计算该区域的最大和最小值（用于绘制上下对称的波形）
    for (let i = 0; i < targetSamples; i++) {
      const start = Math.floor(i * samplesPerPixel)
      const end = Math.min(start + samplesPerPixel, channelData.length)
      
      let max = 0
      let min = 0
      for (let j = start; j < end; j++) {
        const value = channelData[j]
        if (value > max) max = value
        if (value < min) min = value
      }
      // 存储最大绝对值，用于绘制
      processedData[i] = Math.max(Math.abs(max), Math.abs(min))
    }

    waveformDataRef.current = processedData
  }, [audioBuffer, canvasSize.width])

  // 绘制波形
  useEffect(() => {
    if (!canvasRef.current || !audioBuffer || !waveformDataRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width: w, height: h } = canvasSize
    canvas.width = w
    canvas.height = h

    // 清除画布
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, w, h)

    const waveformData = waveformDataRef.current
    const centerY = h / 2

    // 绘制网格线
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 1
    // 水平中心线
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(w, centerY)
    ctx.stroke()

    // 绘制波形（上下对称）
    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 2
    ctx.beginPath()

    const stepX = w / waveformData.length

    for (let i = 0; i < waveformData.length; i++) {
      const x = i * stepX
      const amplitude = waveformData[i] * centerY * 0.8 // 0.8 是为了留出一些边距
      const topY = centerY - amplitude
      const bottomY = centerY + amplitude

      if (i === 0) {
        ctx.moveTo(x, topY)
      } else {
        ctx.lineTo(x, topY)
      }
    }

    // 绘制下半部分
    for (let i = waveformData.length - 1; i >= 0; i--) {
      const x = i * stepX
      const amplitude = waveformData[i] * centerY * 0.8
      const bottomY = centerY + amplitude
      ctx.lineTo(x, bottomY)
    }

    ctx.closePath()
    ctx.stroke()

    // 填充波形区域（半透明）
    ctx.fillStyle = "rgba(0, 255, 0, 0.2)"
    ctx.fill()

    // 绘制当前播放位置指示器
    const progress = currentTime / audioBuffer.duration
    const currentX = progress * w

    ctx.strokeStyle = "#ff0000"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(currentX, 0)
    ctx.lineTo(currentX, h)
    ctx.stroke()

    // 在指示器上方绘制一个小三角形
    ctx.fillStyle = "#ff0000"
    ctx.beginPath()
    ctx.moveTo(currentX, 0)
    ctx.lineTo(currentX - 6, 12)
    ctx.lineTo(currentX + 6, 12)
    ctx.closePath()
    ctx.fill()

    // 绘制时间标签
    ctx.fillStyle = "#ffffff"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    const timeText = `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`
    ctx.fillText(timeText, currentX, h - 5)
  }, [audioBuffer, currentTime, canvasSize])

  if (!audioBuffer) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <p>正在加载音频数据...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

