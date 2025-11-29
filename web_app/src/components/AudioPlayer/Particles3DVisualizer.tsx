import { useRef, useEffect, useState } from "react"

interface Particles3DVisualizerProps {
  analyser: AnalyserNode | null
  isPlaying: boolean
  width?: number
  height?: number
}

export default function Particles3DVisualizer({
  analyser,
  isPlaying,
  width,
  height,
}: Particles3DVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const particlesRef = useRef<Float32Array | null>(null)
  const bufferRef = useRef<WebGLBuffer | null>(null)
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

  // 初始化 WebGL
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    if (!gl) {
      console.error("WebGL not supported")
      return
    }

    glRef.current = gl

    // 顶点着色器源码
    const vertexShaderSource = `
      attribute vec3 a_position;
      attribute vec3 a_velocity;
      attribute float a_size;
      attribute vec3 a_color;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_audioIntensity;
      
      varying vec3 v_color;
      varying float v_size;
      
      void main() {
        // 根据音频强度调整粒子位置
        vec3 position = a_position + a_velocity * u_time * (0.5 + u_audioIntensity * 0.5);
        
        // 将3D坐标转换为2D屏幕坐标
        vec2 clipSpace = position.xy / u_resolution * 2.0 - 1.0;
        clipSpace.y *= -1.0; // 翻转Y轴
        
        // 根据音频强度调整粒子大小
        float size = a_size * (1.0 + u_audioIntensity * 2.0);
        
        gl_Position = vec4(clipSpace, position.z * 0.01, 1.0);
        gl_PointSize = size;
        
        v_color = a_color;
        v_size = size;
      }
    `

    // 片段着色器源码
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec3 v_color;
      varying float v_size;
      
      void main() {
        // 计算距离中心的距离，用于创建圆形粒子
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        if (dist > 0.5) {
          discard;
        }
        
        // 创建渐变效果
        float alpha = 1.0 - dist * 2.0;
        alpha = pow(alpha, 2.0);
        
        gl_FragColor = vec4(v_color, alpha);
      }
    `

    // 创建着色器
    function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    // 创建程序
    function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
      const program = gl.createProgram()
      if (!program) return null
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
      }
      return program
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) return

    const program = createProgram(gl, vertexShader, fragmentShader)
    if (!program) return

    programRef.current = program

    // 创建粒子数据
    const particleCount = 2000
    const particles = new Float32Array(particleCount * 10) // 每个粒子: position(3) + velocity(3) + size(1) + color(3)

    for (let i = 0; i < particleCount; i++) {
      const i10 = i * 10
      // 初始位置（随机分布在3D空间中）
      particles[i10 + 0] = (Math.random() - 0.5) * canvasSize.width
      particles[i10 + 1] = (Math.random() - 0.5) * canvasSize.height
      particles[i10 + 2] = (Math.random() - 0.5) * 1000
      
      // 速度
      particles[i10 + 3] = (Math.random() - 0.5) * 2
      particles[i10 + 4] = (Math.random() - 0.5) * 2
      particles[i10 + 5] = (Math.random() - 0.5) * 2
      
      // 大小
      particles[i10 + 6] = Math.random() * 3 + 1
      
      // 颜色（根据位置生成渐变色）
      const hue = (i / particleCount) * 360
      const r = Math.sin((hue * Math.PI) / 180) * 0.5 + 0.5
      const g = Math.sin(((hue + 120) * Math.PI) / 180) * 0.5 + 0.5
      const b = Math.sin(((hue + 240) * Math.PI) / 180) * 0.5 + 0.5
      particles[i10 + 7] = r
      particles[i10 + 8] = g
      particles[i10 + 9] = b
    }

    particlesRef.current = particles

    // 创建缓冲区
    const buffer = gl.createBuffer()
    if (!buffer) return
    bufferRef.current = buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW)

    // 设置属性
    const positionLocation = gl.getAttribLocation(program, "a_position")
    const velocityLocation = gl.getAttribLocation(program, "a_velocity")
    const sizeLocation = gl.getAttribLocation(program, "a_size")
    const colorLocation = gl.getAttribLocation(program, "a_color")

    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 40, 0)
    gl.enableVertexAttribArray(velocityLocation)
    gl.vertexAttribPointer(velocityLocation, 3, gl.FLOAT, false, 40, 12)
    gl.enableVertexAttribArray(sizeLocation)
    gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 40, 24)
    gl.enableVertexAttribArray(colorLocation)
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 40, 28)

    // 清理
    return () => {
      if (buffer) gl.deleteBuffer(buffer)
      if (vertexShader) gl.deleteShader(vertexShader)
      if (fragmentShader) gl.deleteShader(fragmentShader)
      if (program) gl.deleteProgram(program)
    }
  }, [canvasSize])

  // 渲染循环
  useEffect(() => {
    if (!glRef.current || !programRef.current || !analyser || !particlesRef.current || !bufferRef.current) {
      console.log("[Particles3DVisualizer] Missing required refs:", {
        hasGL: !!glRef.current,
        hasProgram: !!programRef.current,
        hasAnalyser: !!analyser,
        hasParticles: !!particlesRef.current,
        hasBuffer: !!bufferRef.current,
      })
      return
    }

    const gl = glRef.current
    const program = programRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    console.log("[Particles3DVisualizer] Starting render loop, bufferLength:", bufferLength)

    let startTime = Date.now()
    let pausedTime = 0
    let lastPauseTime = 0

    const render = () => {
      if (!gl || !program || !analyser || !particlesRef.current || !bufferRef.current) return

      try {
        // 获取音频数据
        analyser.getByteFrequencyData(dataArray)
      
      // 计算音频强度（使用多个频段的平均值）
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const audioIntensity = sum / (bufferLength * 255)

      // 计算时间（暂停时保持时间不变）
      let currentTime
      if (isPlaying) {
        if (lastPauseTime > 0) {
          pausedTime += Date.now() - lastPauseTime
          lastPauseTime = 0
        }
        currentTime = (Date.now() - startTime - pausedTime) / 1000
      } else {
        if (lastPauseTime === 0) {
          lastPauseTime = Date.now()
        }
        currentTime = (lastPauseTime - startTime - pausedTime) / 1000
      }

      // 设置视口
      gl.viewport(0, 0, canvasSize.width, canvasSize.height)

      // 清除画布
      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      // 使用程序
      gl.useProgram(program)

      // 更新粒子位置（根据音频强度）
      const particles = particlesRef.current
      if (particles) {
        for (let i = 0; i < particles.length / 10; i++) {
          const i10 = i * 10
          // 根据音频强度调整粒子位置
          const intensity = audioIntensity * 2
          particles[i10 + 0] += particles[i10 + 3] * (1 + intensity)
          particles[i10 + 1] += particles[i10 + 4] * (1 + intensity)
          particles[i10 + 2] += particles[i10 + 5] * (1 + intensity)

          // 边界检测和重置
          if (Math.abs(particles[i10 + 0]) > canvasSize.width / 2) {
            particles[i10 + 0] = (Math.random() - 0.5) * canvasSize.width
          }
          if (Math.abs(particles[i10 + 1]) > canvasSize.height / 2) {
            particles[i10 + 1] = (Math.random() - 0.5) * canvasSize.height
          }
          if (Math.abs(particles[i10 + 2]) > 500) {
            particles[i10 + 2] = (Math.random() - 0.5) * 1000
          }
        }

        // 更新缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, particles)
      }

      // 设置uniform
      const timeLocation = gl.getUniformLocation(program, "u_time")
      const resolutionLocation = gl.getUniformLocation(program, "u_resolution")
      const audioIntensityLocation = gl.getUniformLocation(program, "u_audioIntensity")

      if (timeLocation) gl.uniform1f(timeLocation, currentTime)
      if (resolutionLocation) gl.uniform2f(resolutionLocation, canvasSize.width, canvasSize.height)
      if (audioIntensityLocation) gl.uniform1f(audioIntensityLocation, audioIntensity)

      // 启用混合
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

      // 绘制
      if (particlesRef.current) {
        gl.drawArrays(gl.POINTS, 0, particlesRef.current.length / 10)
      }

      animationFrameRef.current = requestAnimationFrame(render)
      } catch (error) {
        console.error("[Particles3DVisualizer] Render error:", error)
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
      <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="w-full h-full" />
    </div>
  )
}

