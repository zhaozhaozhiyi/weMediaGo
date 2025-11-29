import { useRef, useEffect, useState } from "react"

interface SpectrumVisualizerProps {
  analyser: AnalyserNode | null
  isPlaying: boolean
  width?: number
  height?: number
}

export default function SpectrumVisualizer({
  analyser,
  isPlaying,
  width,
  height,
}: SpectrumVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 })

  // 响应式调整画布尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const newWidth = width || rect.width || 800
        const newHeight = height || rect.height || 400
        // 确保尺寸有效
        if (newWidth > 0 && newHeight > 0) {
          setCanvasSize({ width: newWidth, height: newHeight })
        } else {
          // 如果尺寸无效，使用默认值
          setCanvasSize({ width: 800, height: 400 })
        }
      } else {
        // 容器不存在时使用默认值
        setCanvasSize({ width: 800, height: 400 })
      }
    }

    // 立即更新一次
    updateSize()
    
    // 延迟一下再更新，确保容器已渲染
    const timeoutId = setTimeout(updateSize, 100)

    const resizeObserver = window.ResizeObserver
      ? new ResizeObserver(updateSize)
      : null

    if (containerRef.current && resizeObserver) {
      resizeObserver.observe(containerRef.current)
    } else {
      window.addEventListener("resize", updateSize)
    }

    return () => {
      clearTimeout(timeoutId)
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else {
        window.removeEventListener("resize", updateSize)
      }
    }
  }, [width, height])

  useEffect(() => {
    if (!canvasRef.current || !analyser) {
      console.log("[SpectrumVisualizer] Missing canvas or analyser:", {
        hasCanvas: !!canvasRef.current,
        hasAnalyser: !!analyser,
      })
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.error("[SpectrumVisualizer] Failed to get 2D context")
      return
    }

    const { width: w, height: h } = canvasSize
    if (w <= 0 || h <= 0) {
      console.warn("[SpectrumVisualizer] Invalid canvas size:", { w, h })
      return
    }

    canvas.width = w
    canvas.height = h

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    console.log("[SpectrumVisualizer] Starting render loop, bufferLength:", bufferLength, "canvasSize:", { w, h })

    const render = () => {
      if (!analyser || !canvasRef.current) {
        return
      }

      try {
        analyser.getByteFrequencyData(dataArray)

        ctx.clearRect(0, 0, w, h)
        ctx.fillStyle = "rgb(0, 0, 0)"
        ctx.fillRect(0, 0, w, h)

        const barWidth = (w / bufferLength) * 2.5
        let barHeight
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * h

          const r = barHeight + 25
          const g = 250 - barHeight
          const b = 50

          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(x, h - barHeight, barWidth, barHeight)

          x += barWidth + 1
        }

        animationFrameRef.current = requestAnimationFrame(render)
      } catch (error) {
        console.error("[SpectrumVisualizer] Render error:", error)
      }
    }

    render()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
    }
  }, [analyser, isPlaying, canvasSize])

  if (!analyser) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <p>频谱分析器未初始化</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

