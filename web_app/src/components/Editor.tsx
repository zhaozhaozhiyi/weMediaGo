import { SyntheticEvent, useCallback, useEffect, useRef, useState } from "react"
import { CursorArrowRaysIcon } from "@heroicons/react/24/outline"
import { useToast } from "@/components/ui/use-toast"
import {
  ReactZoomPanPinchContentRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch"
import { useKeyPressEvent } from "react-use"
import { downloadToOutput, runPlugin } from "@/lib/api"
import { IconButton } from "@/components/ui/button"
import {
  askWritePermission,
  cn,
  copyCanvasImage,
  drawLines,
  isMidClick,
  isRightClick,
  mouseXY,
  srcToFile,
  applyMosaic,
  applyFilter,
  applyWatermark,
  applyColorAdjust,
  compressImage,
} from "@/lib/utils"
import { Eye, Redo, Undo, Expand, Download } from "lucide-react"
import { useImage } from "@/hooks/useImage"
import { Slider } from "./ui/slider"
import { NumberInput } from "./ui/input"
import { PluginName, MosaicSelection, Rect } from "@/lib/types"
import { useStore } from "@/lib/states"
import Cropper from "./Cropper"
import ImageCropper from "./ImageCropper"
import { InteractiveSegPoints } from "./InteractiveSeg"
import useHotKey from "@/hooks/useHotkey"
import {
  MAX_BRUSH_SIZE,
  MIN_BRUSH_SIZE,
  SHORTCUT_KEY_CHANGE_BRUSH_SIZE,
} from "@/lib/const"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import ExportDialog from "./ExportDialog"

const TOOLBAR_HEIGHT = 200
const COMPARE_SLIDER_DURATION_MS = 300

interface EditorProps {
  file: File
}

export default function Editor(props: EditorProps) {
  const { file } = props
  const { toast } = useToast()

  const [
    disableShortCuts,
    windowSize,
    isInpainting,
    imageWidth,
    imageHeight,
    settings,
    enableAutoSaving,
    setImageSize,
    setBaseBrushSize,
    interactiveSegState,
    updateInteractiveSegState,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    undo,
    redo,
    undoDisabled,
    redoDisabled,
    isProcessing,
    updateAppState,
    runMannually,
    runInpainting,
    isCropperExtenderResizing,
    decreaseBaseBrushSize,
    increaseBaseBrushSize,
    undoCrop,
    redoCrop,
    canUndoCrop,
    canRedoCrop,
  ] = useStore((state) => [
    state.disableShortCuts,
    state.windowSize,
    state.isInpainting,
    state.imageWidth,
    state.imageHeight,
    state.settings,
    state.serverConfig.enableAutoSaving,
    state.setImageSize,
    state.setBaseBrushSize,
    state.interactiveSegState,
    state.updateInteractiveSegState,
    state.handleCanvasMouseDown,
    state.handleCanvasMouseMove,
    state.undo,
    state.redo,
    state.undoDisabled(),
    state.redoDisabled(),
    state.getIsProcessing(),
    state.updateAppState,
    state.runMannually(),
    state.runInpainting,
    state.isCropperExtenderResizing,
    state.decreaseBaseBrushSize,
    state.increaseBaseBrushSize,
    state.undoCrop,
    state.redoCrop,
    state.canUndoCrop(),
    state.canRedoCrop(),
  ])
  const baseBrushSize = useStore((state) => state.editorState.baseBrushSize)
  const brushSize = useStore((state) => state.getBrushSize())
  const renders = useStore((state) => state.editorState.renders)
  const extraMasks = useStore((state) => state.editorState.extraMasks)
  const temporaryMasks = useStore((state) => state.editorState.temporaryMasks)
  const lineGroups = useStore((state) => state.editorState.lineGroups)
  const curLineGroup = useStore((state) => state.editorState.curLineGroup)
  const mosaicSelections = useStore((state) => state.mosaicSelections)
  const filterPresets = useStore((state) => state.filterPresets)
  const activeFilterPresetIds = useStore((state) => state.activeFilterPresetIds)
  const previewFilterId = useStore((state) => state.previewFilterId)
  const watermarkConfig = useStore((state) => state.watermarkConfig)
  const addMosaicSelection = useStore((state) => state.addMosaicSelection)
  const compressionSettings = useStore((state) => state.compressionSettings)
  const exportSettings = useStore((state) => state.exportSettings)

  // Local State
  const [showOriginal, setShowOriginal] = useState(false)
  const [original, isOriginalLoaded] = useImage(file)
  const [context, setContext] = useState<CanvasRenderingContext2D>()
  const [imageContext, setImageContext] = useState<CanvasRenderingContext2D>()
  const [brushContext, setBrushContext] = useState<CanvasRenderingContext2D>() // 普通画笔绘制层
  const [brushHistory, setBrushHistory] = useState<ImageData[]>([]) // 普通画笔历史（用于撤销）
  const [brushRedoHistory, setBrushRedoHistory] = useState<ImageData[]>([]) // 普通画笔重做历史
  const [lastBrushPoint, setLastBrushPoint] = useState<{ x: number; y: number } | null>(null) // 上一个画笔点（用于避免路径重叠）
  const [{ x, y }, setCoords] = useState({ x: -1, y: -1 })
  const [showBrush, setShowBrush] = useState(false)
  const [showRefBrush, setShowRefBrush] = useState(false)
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [isPanningDragging, setIsPanningDragging] = useState<boolean>(false)

  const [scale, setScale] = useState<number>(1)
  const [panned, setPanned] = useState<boolean>(false)
  const [minScale, setMinScale] = useState<number>(1.0)
  const windowCenterX = windowSize.width / 2
  const windowCenterY = windowSize.height / 2
  const viewportRef = useRef<ReactZoomPanPinchContentRef | null>(null)
  // Indicates that the image has been loaded and is centered on first load
  const [initialCentered, setInitialCentered] = useState(false)

  const [isDraging, setIsDraging] = useState(false)

  const [sliderPos, setSliderPos] = useState<number>(0)
  const [isChangingBrushSizeByWheel, setIsChangingBrushSizeByWheel] =
    useState<boolean>(false)
  
  // 缩放控制相关状态
  const [zoomRatio, setZoomRatio] = useState<number>(1.0) // 相对于原图的缩放倍数（0.1-5.0）
  const [showZoomLimitAlert, setShowZoomLimitAlert] = useState<boolean>(false)
  const [zoomLimitMessage, setZoomLimitMessage] = useState<string>("")

  // 马赛克选区绘制状态
  const [mosaicDrawing, setMosaicDrawing] = useState<{
    shapeType: "rect" | "circle" | "freehand" | "polygon"
    startPoint: { x: number; y: number } | null
    currentPoints: { x: number; y: number }[]
    isDrawing: boolean
  }>({
    shapeType: "rect",
    startPoint: null,
    currentPoints: [],
    isDrawing: false,
  })

  const hadDrawSomething = useCallback(() => {
    return curLineGroup.length !== 0
  }, [curLineGroup])

  // 应用各种效果（色彩调节、滤镜、马赛克、水印）
  const applyEffects = useCallback(async () => {
    if (!isOriginalLoaded || imageWidth === 0 || imageHeight === 0) {
      return null
    }

    const render = renders.length === 0 ? original : renders[renders.length - 1]
    let processedCanvas: HTMLCanvasElement | HTMLImageElement = render

    // 1. 应用色彩调节（如果启用）
    if (settings.showColorAdjust) {
      processedCanvas = applyColorAdjust(
        processedCanvas,
        settings.brightness ?? 100,
        settings.contrast ?? 100,
        settings.saturation ?? 100,
        settings.colorTemperature ?? 100
      )
    }

    // 2. 应用滤镜（如果启用，支持最多2种滤镜叠加）
    if (settings.showFilter) {
      // 优先使用预览滤镜（悬浮预览）
      if (previewFilterId) {
        const previewPreset = filterPresets.find((p) => p.name === previewFilterId)
        if (previewPreset) {
          processedCanvas = applyFilter(processedCanvas, previewFilterId, previewPreset.strength * 100)
        } else {
          // 如果没有预设，使用默认强度
          processedCanvas = applyFilter(processedCanvas, previewFilterId, 100)
        }
      } else if (activeFilterPresetIds.length > 0) {
        // 应用实际激活的滤镜
        for (const presetId of activeFilterPresetIds) {
          const preset = filterPresets.find((p) => p.id === presetId)
          if (preset) {
            // preset.name 是滤镜 ID（如 "vintage"），需要转换为实际的滤镜 ID
            processedCanvas = applyFilter(processedCanvas, preset.name, preset.strength * 100)
          }
        }
      }
    }

    // 3. 应用马赛克（如果启用）
    if (settings.showMosaic && mosaicSelections.length > 0) {
      processedCanvas = applyMosaic(processedCanvas, mosaicSelections)
    }

    // 4. 应用水印（如果启用且有水印文字）
    if (settings.showWatermark && watermarkConfig.text && watermarkConfig.text.trim().length > 0) {
      processedCanvas = applyWatermark(processedCanvas, watermarkConfig)
    }

    return processedCanvas
  }, [
    isOriginalLoaded,
    imageWidth,
    imageHeight,
    renders,
    original,
    settings.showColorAdjust,
    settings.brightness,
    settings.contrast,
    settings.saturation,
    settings.colorTemperature,
    settings.showFilter,
    settings.showMosaic,
    settings.showWatermark,
    activeFilterPresetIds,
    previewFilterId,
    filterPresets,
    mosaicSelections,
    watermarkConfig,
  ])

  useEffect(() => {
    if (
      !imageContext ||
      !isOriginalLoaded ||
      imageWidth === 0 ||
      imageHeight === 0
    ) {
      return
    }

    const updateImage = async () => {
      const render = renders.length === 0 ? original : renders[renders.length - 1]
      imageContext.canvas.width = imageWidth
      imageContext.canvas.height = imageHeight

      imageContext.clearRect(
        0,
        0,
        imageContext.canvas.width,
        imageContext.canvas.height
      )

      // 应用各种效果
      const processedCanvas = await applyEffects()
      if (processedCanvas) {
        imageContext.drawImage(processedCanvas, 0, 0, imageWidth, imageHeight)
      } else {
        imageContext.drawImage(render, 0, 0, imageWidth, imageHeight)
      }

      // 叠加普通画笔绘制层
      if (brushContext) {
        imageContext.drawImage(brushContext.canvas, 0, 0)
      }
    }

    updateImage()
  }, [
    renders,
    original,
    isOriginalLoaded,
    imageContext,
    brushContext,
    imageHeight,
    imageWidth,
    applyEffects,
  ])

  useEffect(() => {
    if (
      !context ||
      !isOriginalLoaded ||
      imageWidth === 0 ||
      imageHeight === 0
    ) {
      return
    }
    context.canvas.width = imageWidth
    context.canvas.height = imageHeight
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    temporaryMasks.forEach((maskImage) => {
      context.drawImage(maskImage, 0, 0, imageWidth, imageHeight)
    })
    extraMasks.forEach((maskImage) => {
      context.drawImage(maskImage, 0, 0, imageWidth, imageHeight)
    })

    if (
      interactiveSegState.isInteractiveSeg &&
      interactiveSegState.tmpInteractiveSegMask
    ) {
      context.drawImage(
        interactiveSegState.tmpInteractiveSegMask,
        0,
        0,
        imageWidth,
        imageHeight
      )
    }
    // 只在非普通画笔模式下绘制 mask 线条
    if (settings.brushMode !== "normal") {
      drawLines(context, curLineGroup)
    }

    // 绘制马赛克选区预览
    if (settings.showMosaic) {
      context.strokeStyle = "#ffcc00"
      context.lineWidth = 2
      context.setLineDash([5, 5])

      // 绘制已创建的选区
      mosaicSelections.forEach((selection) => {
        if (!selection.visible) return
        const { bounds, shapeType, points } = selection

        if (shapeType === "rect") {
          context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
        } else if (shapeType === "circle") {
          const centerX = bounds.x + bounds.width / 2
          const centerY = bounds.y + bounds.height / 2
          const radiusX = bounds.width / 2
          const radiusY = bounds.height / 2
          context.beginPath()
          context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          context.stroke()
        } else if (points && points.length >= 2) {
          // 自由手绘或多边形
          context.beginPath()
          context.moveTo(points[0].x, points[0].y)
          for (let i = 1; i < points.length; i++) {
            context.lineTo(points[i].x, points[i].y)
          }
          if (shapeType === "polygon" || shapeType === "freehand") {
            context.closePath()
          }
          context.stroke()
        }
      })

      // 绘制正在绘制的选区
      if (mosaicDrawing.isDrawing && mosaicDrawing.startPoint) {
        const { shapeType, startPoint, currentPoints } = mosaicDrawing
        if (currentPoints.length >= 2) {
          const xs = [startPoint.x, ...currentPoints.map((p) => p.x)]
          const ys = [startPoint.y, ...currentPoints.map((p) => p.y)]
          const minX = Math.min(...xs)
          const maxX = Math.max(...xs)
          const minY = Math.min(...ys)
          const maxY = Math.max(...ys)

          if (shapeType === "rect") {
            context.strokeRect(minX, minY, maxX - minX, maxY - minY)
          } else if (shapeType === "circle") {
            const centerX = (minX + maxX) / 2
            const centerY = (minY + maxY) / 2
            const radiusX = (maxX - minX) / 2
            const radiusY = (maxY - minY) / 2
            context.beginPath()
            context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
            context.stroke()
          } else if (shapeType === "freehand" && currentPoints.length >= 2) {
            context.beginPath()
            context.moveTo(startPoint.x, startPoint.y)
            currentPoints.forEach((p) => context.lineTo(p.x, p.y))
            context.stroke()
          }
        }
      }

      // 绘制多边形选区的顶点
      if (settings.mosaicShapeType === "polygon" && mosaicDrawing.currentPoints.length > 0) {
        context.fillStyle = "#ffcc00"
        context.strokeStyle = "#ffcc00"
        context.lineWidth = 1
        context.setLineDash([])
        mosaicDrawing.currentPoints.forEach((point) => {
          context.beginPath()
          context.arc(point.x, point.y, 4, 0, 2 * Math.PI)
          context.fill()
        })
        // 绘制连线
        if (mosaicDrawing.currentPoints.length > 1) {
          context.beginPath()
          context.moveTo(mosaicDrawing.currentPoints[0].x, mosaicDrawing.currentPoints[0].y)
          for (let i = 1; i < mosaicDrawing.currentPoints.length; i++) {
            context.lineTo(mosaicDrawing.currentPoints[i].x, mosaicDrawing.currentPoints[i].y)
          }
          context.stroke()
        }
      }

      context.setLineDash([])
    }
  }, [
    temporaryMasks,
    extraMasks,
    isOriginalLoaded,
    interactiveSegState,
    context,
    curLineGroup,
    imageHeight,
    imageWidth,
    settings.brushMode,
    settings.showMosaic,
    settings.mosaicShapeType,
    mosaicSelections,
    mosaicDrawing,
  ])

  // 同步 brushContext 尺寸（保存内容避免清除）
  useEffect(() => {
    if (brushContext && imageWidth > 0 && imageHeight > 0) {
      const canvas = brushContext.canvas
      const oldWidth = canvas.width
      const oldHeight = canvas.height
      
      // 如果尺寸没有变化，不需要重新设置
      if (oldWidth === imageWidth && oldHeight === imageHeight) {
        return
      }
      
      // 保存当前内容
      const imageData = oldWidth > 0 && oldHeight > 0 
        ? brushContext.getImageData(0, 0, oldWidth, oldHeight)
        : null
      
      // 设置新尺寸
      canvas.width = imageWidth
      canvas.height = imageHeight
      
      // 恢复内容（如果有）
      if (imageData) {
        // 如果尺寸变化，需要缩放内容
        if (oldWidth !== imageWidth || oldHeight !== imageHeight) {
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = oldWidth
          tempCanvas.height = oldHeight
          const tempCtx = tempCanvas.getContext("2d")
          if (tempCtx && imageData) {
            tempCtx.putImageData(imageData, 0, 0)
            brushContext.drawImage(tempCanvas, 0, 0, imageWidth, imageHeight)
          }
        } else {
          brushContext.putImageData(imageData, 0, 0)
        }
      }
    }
  }, [brushContext, imageWidth, imageHeight])

  // 将 hex 颜色转换为 rgba（带透明度）
  const hexToRgba = useCallback((hex: string, opacity: number): string => {
    // 移除 # 符号
    let cleanHex = hex.replace('#', '')
    
    // 处理 3 位 hex 颜色（如 #fff）
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('')
    }
    
    // 解析 RGB 值
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    
    // 返回 rgba 字符串
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
  }, [])

  // 设置画笔样式的辅助函数
  const setBrushStyle = useCallback((ctx: CanvasRenderingContext2D) => {
    // 使用 globalAlpha 来设置透明度（这是最可靠的方法）
    ctx.globalAlpha = settings.brushOpacity / 100
    ctx.strokeStyle = settings.brushColor
    ctx.lineWidth = brushSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    
    // 实现画笔硬度：使用 shadowBlur
    // 硬度 0 = 完全柔和（高 shadowBlur），硬度 100 = 完全硬（无 shadowBlur）
    const hardness = settings.brushHardness ?? 50
    if (hardness < 100) {
      // 只有当硬度小于 100 时才使用 shadowBlur
      const shadowBlur = (100 - hardness) / 100 * (brushSize * 0.5) // 最大模糊为画笔大小的一半
      ctx.shadowBlur = shadowBlur
      ctx.shadowColor = settings.brushColor
    } else {
      // 硬度为 100 时，不使用 shadow（完全硬的边缘）
      ctx.shadowBlur = 0
      ctx.shadowColor = "transparent"
    }
  }, [settings.brushOpacity, settings.brushColor, settings.brushHardness, brushSize])

  // 保存画笔状态到历史（用于撤销）
  const saveBrushState = useCallback(() => {
    if (brushContext && imageWidth > 0 && imageHeight > 0) {
      const imageData = brushContext.getImageData(0, 0, imageWidth, imageHeight)
      setBrushHistory((prev) => [...prev, imageData])
      // 清除重做历史（新的操作会覆盖重做历史）
      setBrushRedoHistory([])
    }
  }, [brushContext, imageWidth, imageHeight])

  // 恢复画笔状态
  const restoreBrushState = useCallback((imageData: ImageData | null) => {
    if (brushContext && imageData) {
      brushContext.clearRect(0, 0, imageWidth, imageHeight)
      brushContext.putImageData(imageData, 0, 0)
      // 更新 imageContext 显示
      if (imageContext) {
        const render = renders.length === 0 ? original : renders[renders.length - 1]
        imageContext.clearRect(0, 0, imageWidth, imageHeight)
        imageContext.drawImage(render, 0, 0, imageWidth, imageHeight)
        imageContext.drawImage(brushContext.canvas, 0, 0)
      }
    }
  }, [brushContext, imageContext, imageWidth, imageHeight, renders, original])

  // 检查是否有画笔内容
  const hasBrushContent = useCallback(() => {
    if (!brushContext || imageWidth === 0 || imageHeight === 0) {
      return false
    }
    const imageData = brushContext.getImageData(0, 0, imageWidth, imageHeight)
    // 检查是否有非透明像素
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) {
        return true
      }
    }
    return false
  }, [brushContext, imageWidth, imageHeight])

  const getCurrentRender = useCallback(async () => {
    let targetFile = file
    if (renders.length > 0) {
      const lastRender = renders[renders.length - 1]
      targetFile = await srcToFile(lastRender.currentSrc, file.name, file.type)
    }
    return targetFile
  }, [file, renders])

  const hadRunInpainting = () => {
    return renders.length !== 0
  }

  const getCurrentWidthHeight = useCallback(() => {
    let width = 512
    let height = 512
    if (!isOriginalLoaded) {
      return [width, height]
    }
    if (renders.length === 0) {
      width = original.naturalWidth
      height = original.naturalHeight
    } else if (renders.length !== 0) {
      width = renders[renders.length - 1].width
      height = renders[renders.length - 1].height
    }

    return [width, height]
  }, [original, isOriginalLoaded, renders])

  // Draw once the original image is loaded
  useEffect(() => {
    if (!isOriginalLoaded) {
      return
    }

    const [width, height] = getCurrentWidthHeight()
    if (width !== imageWidth || height !== imageHeight) {
      setImageSize(width, height)
    }

    const rW = windowSize.width / width
    const rH = (windowSize.height - TOOLBAR_HEIGHT) / height

    let s = 1.0
    if (rW < 1 || rH < 1) {
      s = Math.min(rW, rH)
    }
    setMinScale(s)
    setScale(s)
    setZoomRatio(1.0) // 初始缩放倍数为1.0

    console.log(
      `[on file load] image size: ${width}x${height}, scale: ${s}, initialCentered: ${initialCentered}`
    )

    if (context?.canvas) {
      console.log("[on file load] set canvas size")
      if (width != context.canvas.width) {
        context.canvas.width = width
      }
      if (height != context.canvas.height) {
        context.canvas.height = height
      }
    }

    if (!initialCentered) {
      // 防止每次擦除以后图片 zoom 还原
      viewportRef.current?.centerView(s, 1)
      console.log("[on file load] centerView")
      setInitialCentered(true)
    }

    // 设置原始文件大小到压缩设置中
    if (file && file.size > 0) {
      updateAppState({
        compressionSettings: {
          ...compressionSettings,
          originalSizeBytes: file.size,
        },
      })
    }
  }, [
    viewportRef,
    imageHeight,
    file,
    compressionSettings,
    updateAppState,
    imageWidth,
    original,
    isOriginalLoaded,
    windowSize,
    initialCentered,
    getCurrentWidthHeight,
  ])

  useEffect(() => {
    console.log("[useEffect] centerView")
    // render 改变尺寸以后，undo/redo 重新 center
    viewportRef?.current?.centerView(minScale, 1)
  }, [imageHeight, imageWidth, viewportRef, minScale])

  // Zoom reset
  const resetZoom = useCallback(() => {
    if (!minScale || !windowSize) {
      return
    }
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }
    const offsetX = (windowSize.width - imageWidth * minScale) / 2
    const offsetY = (windowSize.height - imageHeight * minScale) / 2
    viewport.setTransform(offsetX, offsetY, minScale, 200, "easeOutQuad")
    if (viewport.instance.transformState.scale) {
      viewport.instance.transformState.scale = minScale
    }

    setScale(minScale)
    setZoomRatio(1.0) // 重置缩放倍数为1.0
    setPanned(false)
  }, [
    viewportRef,
    windowSize,
    imageHeight,
    imageWidth,
    windowSize.height,
    minScale,
  ])

  useEffect(() => {
    window.addEventListener("resize", () => {
      resetZoom()
    })
    return () => {
      window.removeEventListener("resize", () => {
        resetZoom()
      })
    }
  }, [windowSize, resetZoom])

  const handleEscPressed = () => {
    if (isProcessing) {
      return
    }

    if (isDraging) {
      setIsDraging(false)
    } else {
      resetZoom()
    }
  }

  useHotKey("Escape", handleEscPressed, [
    isDraging,
    isInpainting,
    resetZoom,
    // drawOnCurrentRender,
  ])

  const onMouseMove = (ev: SyntheticEvent) => {
    const mouseEvent = ev.nativeEvent as MouseEvent
    setCoords({ x: mouseEvent.pageX, y: mouseEvent.pageY })
  }

  const onMouseDrag = (ev: SyntheticEvent) => {
    if (isProcessing) {
      return
    }

    if (interactiveSegState.isInteractiveSeg) {
      return
    }
    if (isPanning) {
      return
    }
    if (!isDraging && !mosaicDrawing.isDrawing) {
      return
    }

    // 马赛克选区绘制
    if (settings.showMosaic && mosaicDrawing.isDrawing) {
      const point = mouseXY(ev)
      if (mosaicDrawing.shapeType === "freehand") {
        // 自由手绘：持续添加点
        setMosaicDrawing((prev) => ({
          ...prev,
          currentPoints: [...prev.currentPoints, point],
        }))
      } else if (mosaicDrawing.shapeType === "rect" || mosaicDrawing.shapeType === "circle") {
        // 矩形、圆形：更新当前点（保持起始点，更新结束点）
        if (mosaicDrawing.startPoint) {
          setMosaicDrawing((prev) => ({
            ...prev,
            currentPoints: [prev.startPoint!, point],
          }))
        }
      }
      return
    }

    // 检查是否允许画笔绘制（只有在画笔面板激活时）
    if (!canDrawWithBrush()) {
      return
    }

    if (settings.brushMode === "normal" && brushContext) {
      // 普通画笔模式：实时绘制
      const point = mouseXY(ev)
      
      // 重新设置画笔样式（包括透明度、颜色、大小、硬度等）
      setBrushStyle(brushContext)
      
      // 只绘制新的路径段，避免重绘整个路径导致透明度叠加
      if (lastBrushPoint) {
        // 从上一个点到当前点绘制新段
        brushContext.beginPath()
        brushContext.moveTo(lastBrushPoint.x, lastBrushPoint.y)
        brushContext.lineTo(point.x, point.y)
        brushContext.stroke()
      }
      
      // 更新上一个点
      setLastBrushPoint(point)
      
      // 更新 imageContext 显示
      if (imageContext) {
        const render = renders.length === 0 ? original : renders[renders.length - 1]
        imageContext.clearRect(0, 0, imageWidth, imageHeight)
        imageContext.drawImage(render, 0, 0, imageWidth, imageHeight)
        imageContext.drawImage(brushContext.canvas, 0, 0)
      }
    } else {
      // 其他模式：使用现有逻辑
      if (curLineGroup.length === 0) {
        return
      }
      handleCanvasMouseMove(mouseXY(ev))
    }
  }

  const runInteractiveSeg = async (newClicks: number[][]) => {
    updateAppState({ isPluginRunning: true })
    const targetFile = await getCurrentRender()
    try {
      const res = await runPlugin(
        true,
        PluginName.InteractiveSeg,
        targetFile,
        undefined,
        newClicks
      )
      const { blob } = res
      const img = new Image()
      img.onload = () => {
        updateInteractiveSegState({ tmpInteractiveSegMask: img })
      }
      img.src = blob
    } catch (e: any) {
      toast({
        variant: "destructive",
        description: e.message ? e.message : e.toString(),
      })
    }
    updateAppState({ isPluginRunning: false })
  }

  const onPointerUp = (ev: SyntheticEvent) => {
    if (isMidClick(ev)) {
      setIsPanning(false)
      return
    }
    if (interactiveSegState.isInteractiveSeg) {
      return
    }
    if (isPanning) {
      return
    }
    if (!original.src) {
      return
    }
    if (isInpainting) {
      return
    }

    // 马赛克选区绘制完成（多边形除外，它在 onCanvasMouseUp 中处理）
    if (
      settings.showMosaic &&
      mosaicDrawing.isDrawing &&
      settings.mosaicShapeType !== "polygon"
    ) {
      const { shapeType, startPoint, currentPoints } = mosaicDrawing
      if (startPoint && currentPoints.length >= 1) {
        // 计算包围盒
        let allPoints: { x: number; y: number }[]
        if (shapeType === "freehand") {
          allPoints = [startPoint, ...currentPoints]
        } else {
          // 矩形、圆形：使用起始点和当前点
          allPoints = [startPoint, currentPoints[currentPoints.length - 1]]
        }

        const xs = allPoints.map((p) => p.x)
        const ys = allPoints.map((p) => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)

        // 确保宽度和高度至少为 1
        const bounds: Rect = {
          x: minX,
          y: minY,
          width: Math.max(1, maxX - minX),
          height: Math.max(1, maxY - minY),
        }

        // 创建选区
        const selection: MosaicSelection = {
          id: `mosaic-${Date.now()}-${Math.random()}`,
          shapeType,
          bounds,
          points: shapeType === "freehand" ? [startPoint, ...currentPoints] : undefined,
          grainSize: settings.mosaicGrainSize,
          intensity: settings.mosaicIntensity,
          visible: true,
        }

        addMosaicSelection(selection)
      }

      // 重置绘制状态
      setMosaicDrawing({
        shapeType: "rect",
        startPoint: null,
        currentPoints: [],
        isDrawing: false,
      })
      setIsDraging(false)
      return
    }

    if (!isDraging) {
      return
    }

    // 检查是否允许画笔绘制（只有在画笔面板激活时）
    // 如果用户在绘制过程中切换了工具，这里会阻止完成绘制
    if (!canDrawWithBrush()) {
      setIsDraging(false)
      setLastBrushPoint(null)
      return
    }

    if (settings.brushMode === "normal") {
      // 普通画笔模式：结束绘制，重置上一个点
      setIsDraging(false)
      setLastBrushPoint(null) // 重置，这样下次绘制时不会连接到上一次的结束点
    } else {
      // 去水印和修复模式：使用现有逻辑
      if (!hadDrawSomething()) {
        return
      }
      const canvas = context?.canvas
      if (!canvas) {
        return
      }
      if (runMannually) {
        setIsDraging(false)
      } else {
        runInpainting()
      }
    }
  }

  const onCanvasMouseUp = (ev: SyntheticEvent) => {
    if (interactiveSegState.isInteractiveSeg) {
      const xy = mouseXY(ev)
      const newClicks: number[][] = [...interactiveSegState.clicks]
      if (isRightClick(ev)) {
        newClicks.push([xy.x, xy.y, 0, newClicks.length])
      } else {
        newClicks.push([xy.x, xy.y, 1, newClicks.length])
      }
      runInteractiveSeg(newClicks)
      updateInteractiveSegState({ clicks: newClicks })
      return
    }

    // 多边形选区：双击第一个点完成
    if (
      settings.showMosaic &&
      settings.mosaicShapeType === "polygon" &&
      mosaicDrawing.currentPoints.length >= 3
    ) {
      const xy = mouseXY(ev)
      const firstPoint = mosaicDrawing.currentPoints[0]
      const distance = Math.sqrt(
        Math.pow(xy.x - firstPoint.x, 2) + Math.pow(xy.y - firstPoint.y, 2)
      )
      if (distance < 10) {
        // 闭合多边形
        const xs = mosaicDrawing.currentPoints.map((p) => p.x)
        const ys = mosaicDrawing.currentPoints.map((p) => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)

        const bounds: Rect = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        }

        const selection: MosaicSelection = {
          id: `mosaic-${Date.now()}-${Math.random()}`,
          shapeType: "polygon",
          bounds,
          points: mosaicDrawing.currentPoints,
          grainSize: settings.mosaicGrainSize,
          intensity: settings.mosaicIntensity,
          visible: true,
        }

        addMosaicSelection(selection)
        setMosaicDrawing({
          shapeType: "rect",
          startPoint: null,
          currentPoints: [],
          isDrawing: false,
        })
      }
    }
  }

  const onMouseDown = (ev: SyntheticEvent) => {
    if (isProcessing) {
      return
    }
    if (interactiveSegState.isInteractiveSeg) {
      return
    }
    if (isPanning) {
      return
    }
    if (!isOriginalLoaded) {
      return
    }
    const canvas = context?.canvas
    if (!canvas) {
      return
    }

    if (isRightClick(ev)) {
      return
    }

    if (isMidClick(ev)) {
      setIsPanning(true)
      return
    }

    // 马赛克选区绘制模式
    if (settings.showMosaic) {
      const point = mouseXY(ev)
      if (settings.mosaicShapeType === "polygon") {
        // 多边形：点击添加顶点
        setMosaicDrawing((prev) => ({
          ...prev,
          currentPoints: [...prev.currentPoints, point],
        }))
      } else {
        // 矩形、圆形、自由手绘：开始绘制
        setMosaicDrawing({
          shapeType: settings.mosaicShapeType,
          startPoint: point,
          currentPoints: [point],
          isDrawing: true,
        })
        setIsDraging(true)
      }
      return
    }

    // 检查是否允许画笔绘制（只有在画笔面板激活时）
    if (!canDrawWithBrush()) {
      return
    }

    // 根据画笔模式执行不同逻辑
    if (settings.brushMode === "normal") {
      // 普通画笔模式：绘制彩色线条
      if (brushContext) {
        // 只在开始新的绘制操作时保存状态（用于撤销）
        if (!isDraging) {
          saveBrushState()
        }
        setIsDraging(true)
        const point = mouseXY(ev)
        // 设置画笔样式
        setBrushStyle(brushContext)
        brushContext.beginPath()
        brushContext.moveTo(point.x, point.y)
        // 立即绘制一个点（处理点击不拖动的情况）
        brushContext.lineTo(point.x, point.y)
        brushContext.stroke()
        // 更新 imageContext 显示
        if (imageContext) {
          const render = renders.length === 0 ? original : renders[renders.length - 1]
          imageContext.clearRect(0, 0, imageWidth, imageHeight)
          imageContext.drawImage(render, 0, 0, imageWidth, imageHeight)
          imageContext.drawImage(brushContext.canvas, 0, 0)
        }
      }
    } else if (settings.brushMode === "erase") {
      // 去水印模式：使用现有逻辑
      setIsDraging(true)
      handleCanvasMouseDown(mouseXY(ev))
    } else if (settings.brushMode === "repair") {
      // 修复画笔模式：使用 inpainting 逻辑（Phase 2 实现）
      setIsDraging(true)
      handleCanvasMouseDown(mouseXY(ev))
      // TODO: 修复模式会复用 inpainting，但需要特殊标记
    } else {
      // 默认使用去水印逻辑
      setIsDraging(true)
      handleCanvasMouseDown(mouseXY(ev))
    }
  }

  const handleUndo = (keyboardEvent: KeyboardEvent | SyntheticEvent) => {
    keyboardEvent.preventDefault()
    // 如果裁剪框显示，优先处理裁剪撤销
    if (settings.showCropper) {
      if (canUndoCrop) {
        undoCrop()
      }
      return
    }
    // 如果是普通画笔模式，处理画笔撤销
    if (settings.brushMode === "normal" && brushHistory.length > 0) {
      const currentState = brushContext?.getImageData(0, 0, imageWidth, imageHeight)
      if (currentState) {
        // 保存当前状态到重做历史
        setBrushRedoHistory((prev) => [currentState, ...prev])
      }
      // 恢复上一个状态
      const previousState = brushHistory[brushHistory.length - 1]
      setBrushHistory((prev) => prev.slice(0, -1))
      restoreBrushState(previousState)
    } else {
      // 其他模式使用原有的撤销逻辑
      undo()
    }
  }
  useHotKey("meta+z,ctrl+z", handleUndo)

  const handleRedo = (keyboardEvent: KeyboardEvent | SyntheticEvent) => {
    keyboardEvent.preventDefault()
    // 如果裁剪框显示，优先处理裁剪重做
    if (settings.showCropper) {
      if (canRedoCrop) {
        redoCrop()
      }
      return
    }
    // 如果是普通画笔模式，处理画笔重做
    if (settings.brushMode === "normal" && brushRedoHistory.length > 0) {
      const currentState = brushContext?.getImageData(0, 0, imageWidth, imageHeight)
      if (currentState) {
        // 保存当前状态到撤销历史
        setBrushHistory((prev) => [...prev, currentState])
      }
      // 恢复重做状态
      const redoState = brushRedoHistory[0]
      setBrushRedoHistory((prev) => prev.slice(1))
      restoreBrushState(redoState)
    } else {
      // 其他模式使用原有的重做逻辑
      redo()
    }
  }
  useHotKey("shift+ctrl+z,shift+meta+z", handleRedo)

  useKeyPressEvent(
    "Tab",
    (ev) => {
      ev?.preventDefault()
      ev?.stopPropagation()
      if (hadRunInpainting()) {
        setShowOriginal(() => {
          window.setTimeout(() => {
            setSliderPos(100)
          }, 10)
          return true
        })
      }
    },
    (ev) => {
      ev?.preventDefault()
      ev?.stopPropagation()
      if (hadRunInpainting()) {
        window.setTimeout(() => {
          setSliderPos(0)
        }, 10)
        window.setTimeout(() => {
          setShowOriginal(false)
        }, COMPARE_SLIDER_DURATION_MS)
      }
    }
  )

  const download = useCallback(async () => {
    if (file === undefined) {
      return
    }
    
    // 确保图片已加载
    const render = renders.length === 0 ? original : renders[renders.length - 1]
    if (!render) {
      toast({
        variant: "destructive",
        description: "图片尚未加载完成，请稍候再试",
      })
      return
    }
    
    // 检查图片是否已加载完成
    if (render instanceof HTMLImageElement) {
      if (!render.complete || !render.naturalWidth || !render.naturalHeight) {
        toast({
          variant: "destructive",
          description: "图片尚未加载完成，请稍候再试",
        })
        return
      }
    }
    
    // 获取实际图片尺寸
    const actualWidth = render instanceof HTMLImageElement ? render.naturalWidth : (render as HTMLCanvasElement).width
    const actualHeight = render instanceof HTMLImageElement ? render.naturalHeight : (render as HTMLCanvasElement).height
    
    // 如果imageWidth/imageHeight为0，使用实际图片尺寸
    const finalWidth = imageWidth > 0 ? imageWidth : actualWidth
    const finalHeight = imageHeight > 0 ? imageHeight : actualHeight
    
    // 创建临时 canvas 用于合并图像和画笔内容
    const finalCanvas = document.createElement("canvas")
    finalCanvas.width = finalWidth
    finalCanvas.height = finalHeight
    const finalCtx = finalCanvas.getContext("2d", { willReadFrequently: false })
    
    if (!finalCtx) {
      return
    }
    
    // 先填充白色背景（避免透明区域显示为黑色）
    finalCtx.fillStyle = "#FFFFFF"
    finalCtx.fillRect(0, 0, finalWidth, finalHeight)
    
    // 应用所有效果（包括色彩调节、滤镜、马赛克、水印）
    const processedCanvas = await applyEffects()
    if (processedCanvas) {
      // 如果 processedCanvas 是 Image，需要先绘制到临时 canvas
      if (processedCanvas instanceof HTMLImageElement) {
        // 确保图片已加载
        if (!processedCanvas.complete || !processedCanvas.naturalWidth || !processedCanvas.naturalHeight) {
          await new Promise((resolve, reject) => {
            processedCanvas.onload = resolve
            processedCanvas.onerror = reject
            // 如果已经加载完成，立即resolve
            if (processedCanvas.complete && processedCanvas.naturalWidth && processedCanvas.naturalHeight) {
              resolve(null)
            }
          })
        }
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = finalWidth
        tempCanvas.height = finalHeight
        const tempCtx = tempCanvas.getContext("2d")
        if (tempCtx) {
          tempCtx.drawImage(processedCanvas, 0, 0, finalWidth, finalHeight)
          finalCtx.drawImage(tempCanvas, 0, 0)
        }
      } else {
        finalCtx.drawImage(processedCanvas, 0, 0, finalWidth, finalHeight)
      }
    } else {
      // 如果没有效果，直接绘制基础图像
      finalCtx.drawImage(render, 0, 0, finalWidth, finalHeight)
    }
    
    // 叠加画笔内容
    if (brushContext && brushContext.canvas) {
      finalCtx.drawImage(brushContext.canvas, 0, 0)
    }
    
    const name = file.name.replace(/(\.[\w\d_-]+)$/i, "_cleanup$1")
    
    if (enableAutoSaving) {
      try {
        // 将 canvas 转换为 Image 对象
        const finalImage = new Image()
        finalImage.src = finalCanvas.toDataURL()
        await new Promise((resolve, reject) => {
          finalImage.onload = resolve
          finalImage.onerror = reject
        })
        
        await downloadToOutput(
          finalImage,
          file.name,
          file.type
        )
        toast({
          description: "Save image success",
        })
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: e.message ? e.message : e.toString(),
        })
      }
      return
    }

    // 准备导出数据
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const isJpeg = fileExtension === 'jpg' || fileExtension === 'jpeg'
    const format = isJpeg ? 'JPEG' : 'PNG'
    
    // 使用 PNG 格式生成 data URL（无损，用于估算和后续质量调整）
    // PNG 格式可以保证质量，后续在 ExportDialog 中可以根据质量选择转换为 JPEG
    const defaultDataUrl = finalCanvas.toDataURL("image/png")
    
    // 估算文件大小（基于 data URL 长度，base64 编码大约增加 33% 大小）
    // 实际大小约为 base64 字符串长度的 3/4
    // 对于 JPEG 格式，实际大小会更小，但这里用 PNG 大小作为上限估算
    const estimatedSize = Math.round((defaultDataUrl.length * 3) / 4)
    
    // 显示导出确认对话框
    updateAppState({
      exportSettings: {
        ...exportSettings,
        showExportDialog: true,
        exportFileName: name,
        exportFormat: format,
        estimatedSizeBytes: estimatedSize,
        exportDataUrl: defaultDataUrl,
      },
    })
    
    // 注意：mask 下载已移至 ExportDialog 中，在用户确认导出后再执行
  }, [
    file,
    enableAutoSaving,
    renders,
    original,
    settings,
    imageHeight,
    imageWidth,
    lineGroups,
    brushContext,
    applyEffects,
  ])

  useHotKey("meta+s,ctrl+s", download)

  // 压缩逻辑：当showCompressionDialog为true时执行压缩
  useEffect(() => {
    if (!compressionSettings.showCompressionDialog) {
      return
    }

    if (!isOriginalLoaded || imageWidth === 0 || imageHeight === 0) {
        toast({
          variant: "destructive",
          description: "图片未加载完成，无法压缩",
        })
        updateAppState({
          compressionSettings: {
            ...compressionSettings,
            showCompressionDialog: false,
          },
        })
      return
    }

    const performCompression = async () => {
      try {
        // 创建最终canvas（包含所有效果）
        const finalCanvas = document.createElement("canvas")
        finalCanvas.width = imageWidth
        finalCanvas.height = imageHeight
        const finalCtx = finalCanvas.getContext("2d")

        if (!finalCtx) {
          throw new Error("无法创建canvas上下文")
        }

        // 应用所有效果
        const processedCanvas = await applyEffects()
        if (processedCanvas) {
          if (processedCanvas instanceof HTMLImageElement) {
            const tempCanvas = document.createElement("canvas")
            tempCanvas.width = imageWidth
            tempCanvas.height = imageHeight
            const tempCtx = tempCanvas.getContext("2d")
            if (tempCtx) {
              tempCtx.drawImage(processedCanvas, 0, 0, imageWidth, imageHeight)
              finalCtx.drawImage(tempCanvas, 0, 0)
            }
          } else {
            finalCtx.drawImage(processedCanvas, 0, 0, imageWidth, imageHeight)
          }
        } else {
          const render = renders.length === 0 ? original : renders[renders.length - 1]
          finalCtx.drawImage(render, 0, 0, imageWidth, imageHeight)
        }

        // 叠加画笔内容
        if (brushContext && brushContext.canvas) {
          finalCtx.drawImage(brushContext.canvas, 0, 0)
        }

        // 执行压缩
        const quality = compressionSettings.ratio * 100
        const compressedBlob = await compressImage(finalCanvas, quality)
        const compressedSizeBytes = compressedBlob.size

        // 更新状态
        updateAppState({
          compressionSettings: {
            ...compressionSettings,
            compressedBlob,
            compressedSizeBytes,
            // 保持showCompressionDialog为true，显示对比弹窗
          },
        })
      } catch (error: any) {
        console.error("压缩失败:", error)
        toast({
          variant: "destructive",
          description: error.message || "压缩失败，请重试",
        })
        updateAppState({
          compressionSettings: {
            ...compressionSettings,
            showCompressionDialog: false,
          },
        })
      }
    }

    performCompression()
  }, [
    compressionSettings.showCompressionDialog,
    isOriginalLoaded,
    imageWidth,
    imageHeight,
    compressionSettings.ratio,
    applyEffects,
    renders,
    original,
    brushContext,
    updateAppState,
    toast,
  ])

  // 判断是否允许画笔绘制（只有在画笔面板激活时）
  const canDrawWithBrush = useCallback(() => {
    // 只在画笔相关模式下允许绘制（normal, erase, repair）
    const isBrushMode = settings.brushMode === "normal" || 
                        settings.brushMode === "erase" || 
                        settings.brushMode === "repair"
    
    // 如果其他工具激活，不允许画笔绘制
    if (settings.showCropper || 
        settings.showMosaic || 
        settings.showFilter || 
        settings.showWatermark || 
        settings.showColorAdjust || 
        settings.showCompress) {
      return false
    }
    
    return isBrushMode
  }, [settings.brushMode, settings.showCropper, settings.showMosaic, 
      settings.showFilter, settings.showWatermark, settings.showColorAdjust, settings.showCompress])

  // 判断是否应该显示画笔光标
  const shouldShowBrush = useCallback(() => {
    return canDrawWithBrush()
  }, [canDrawWithBrush])

  const toggleShowBrush = (newState: boolean) => {
    // 只有在应该显示画笔光标的情况下才显示
    if (newState && !shouldShowBrush()) {
      return
    }
    if (newState !== showBrush && !isPanning && !isCropperExtenderResizing) {
      setShowBrush(newState)
    }
  }

  // 当工具状态变化时，如果当前显示画笔光标但不应该显示，则隐藏它
  useEffect(() => {
    if (showBrush && !shouldShowBrush()) {
      setShowBrush(false)
    }
  }, [showBrush, shouldShowBrush])

  const getCursor = useCallback(() => {
    if (isProcessing) {
      return "default"
    }
    if (isPanning) {
      return isPanningDragging ? "grabbing" : "grab"
    }
    // 马赛克模式下使用十字光标
    if (settings.showMosaic) {
      return "crosshair"
    }
    if (showBrush && shouldShowBrush()) {
      return "none"
    }
    return undefined
  }, [showBrush, shouldShowBrush, isPanning, isProcessing, isPanningDragging, settings.showMosaic])

  useHotKey(
    "[",
    () => {
      decreaseBaseBrushSize()
    },
    [decreaseBaseBrushSize]
  )

  useHotKey(
    "]",
    () => {
      increaseBaseBrushSize()
    },
    [increaseBaseBrushSize]
  )

  // Manual Inpainting Hotkey
  useHotKey(
    "shift+r",
    () => {
      if (runMannually && hadDrawSomething()) {
        runInpainting()
      }
    },
    [runMannually, runInpainting, hadDrawSomething]
  )

  useHotKey(
    "ctrl+c,meta+c",
    async () => {
      const hasPermission = await askWritePermission()
      if (hasPermission && renders.length > 0) {
        if (context?.canvas) {
          await copyCanvasImage(context?.canvas)
          toast({
            title: "Copy inpainting result to clipboard",
          })
        }
      }
    },
    [renders, context]
  )

  // Toggle clean/zoom tool on spacebar.
  useKeyPressEvent(
    " ",
    (ev) => {
      if (!disableShortCuts) {
        ev?.preventDefault()
        ev?.stopPropagation()
        setShowBrush(false)
        setIsPanning(true)
      }
    },
    (ev) => {
      if (!disableShortCuts) {
        ev?.preventDefault()
        ev?.stopPropagation()
        setShowBrush(true)
        setIsPanning(false)
        setIsPanningDragging(false)
      }
    }
  )

  // Track panning drag state with mouse events
  useEffect(() => {
    if (!isPanning) {
      setIsPanningDragging(false)
      return
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Only set dragging for left mouse button (button === 0)
      if (isPanning && e.button === 0) {
        setIsPanningDragging(true)
      }
    }

    const handleMouseUp = () => {
      setIsPanningDragging(false)
    }

    const handleMouseLeave = () => {
      setIsPanningDragging(false)
    }

    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [isPanning])

  useEffect(() => {
    const handleKeyUp = (ev: KeyboardEvent) => {
      if (ev.key === SHORTCUT_KEY_CHANGE_BRUSH_SIZE) {
        setIsChangingBrushSizeByWheel(false)
      }
    }

    const handleBlur = () => {
      setIsChangingBrushSizeByWheel(false)
    }

    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur)
    }
  }, [])

  useKeyPressEvent(
    SHORTCUT_KEY_CHANGE_BRUSH_SIZE,
    (ev) => {
      if (!disableShortCuts) {
        ev?.preventDefault()
        ev?.stopPropagation()
        setIsChangingBrushSizeByWheel(true)
      }
    },
    (ev) => {
      if (!disableShortCuts) {
        ev?.preventDefault()
        ev?.stopPropagation()
        setIsChangingBrushSizeByWheel(false)
      }
    }
  )

  const getCurScale = (): number => {
    let s = minScale
    if (viewportRef.current?.instance?.transformState.scale !== undefined) {
      s = viewportRef.current?.instance?.transformState.scale
    }
    return s!
  }

  // 检查缩放边界限制
  const checkZoomLimits = useCallback((targetRatio: number): { valid: boolean; message: string } => {
    if (imageWidth === 0 || imageHeight === 0) {
      return { valid: true, message: "" }
    }

    const targetWidth = imageWidth * targetRatio
    const targetHeight = imageHeight * targetRatio

    // 检查最小尺寸限制（100×100px）
    if (targetWidth < 100 || targetHeight < 100) {
      return {
        valid: false,
        message: `缩放后图片尺寸不能小于100×100px。当前尺寸：${Math.round(targetWidth)}×${Math.round(targetHeight)}px`
      }
    }

    // 检查最大尺寸限制（5倍原图）
    if (targetRatio > 5.0) {
      return {
        valid: false,
        message: `缩放倍数不能超过5.0倍。当前倍数：${targetRatio.toFixed(1)}倍`
      }
    }

    // 检查最小倍数限制（0.1倍）
    if (targetRatio < 0.1) {
      return {
        valid: false,
        message: `缩放倍数不能小于0.1倍。当前倍数：${targetRatio.toFixed(1)}倍`
      }
    }

    return { valid: true, message: "" }
  }, [imageWidth, imageHeight])

  // 应用缩放倍数
  const applyZoomRatio = useCallback((targetRatio: number) => {
    const check = checkZoomLimits(targetRatio)
    if (!check.valid) {
      setZoomLimitMessage(check.message)
      setShowZoomLimitAlert(true)
      return
    }

    if (minScale === 0 || !viewportRef.current) return

    const targetScale = minScale * targetRatio
    const viewport = viewportRef.current

    // 获取当前视图中心点
    const centerX = windowSize.width / 2
    const centerY = windowSize.height / 2

    // 计算缩放后的位置
    const offsetX = centerX - (imageWidth * targetScale) / 2
    const offsetY = centerY - (imageHeight * targetScale) / 2

    viewport.setTransform(offsetX, offsetY, targetScale, 200, "easeOutQuad")
    setScale(targetScale)
    setZoomRatio(targetRatio)
  }, [minScale, imageWidth, imageHeight, windowSize, checkZoomLimits])

  const getBrushStyle = (_x: number, _y: number) => {
    const curScale = getCurScale()
    return {
      width: `${brushSize * curScale}px`,
      height: `${brushSize * curScale}px`,
      left: `${_x}px`,
      top: `${_y}px`,
      transform: "translate(-50%, -50%)",
    }
  }

  const renderBrush = (style: any) => {
    // 使用画笔设置的颜色和透明度
    const brushColor = settings.brushMode === "normal" ? settings.brushColor : "#ffcc00"
    const brushOpacity = settings.brushMode === "normal" ? settings.brushOpacity / 100 : 0.73
    const borderColor = hexToRgba(brushColor, 100)
    const bgColor = hexToRgba(brushColor, brushOpacity * 100)
    
    return (
      <div
        className="absolute rounded-[50%] border-[1px] border-[solid] pointer-events-none"
        style={{
          ...style,
          borderColor: borderColor,
          backgroundColor: bgColor,
        }}
      />
    )
  }

  const handleSliderChange = (value: number) => {
    setBaseBrushSize(value)

    if (!showRefBrush) {
      setShowRefBrush(true)
      window.setTimeout(() => {
        setShowRefBrush(false)
      }, 10000)
    }
  }

  const renderInteractiveSegCursor = () => {
    return (
      <div
        className="absolute h-[20px] w-[20px] pointer-events-none rounded-[50%] bg-[rgba(21,_215,_121,_0.936)] [box-shadow:0_0_0_0_rgba(21,_215,_121,_0.936)] animate-pulse"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <CursorArrowRaysIcon />
      </div>
    )
  }

  const renderCanvas = () => {
    return (
      <TransformWrapper
        ref={(r) => {
          if (r) {
            viewportRef.current = r
          }
        }}
        panning={{ disabled: !isPanning, velocityDisabled: true }}
        wheel={{ step: 0.1, wheelDisabled: isChangingBrushSizeByWheel }}
        centerZoomedOut
        alignmentAnimation={{ disabled: true }}
        centerOnInit
        limitToBounds={false}
        doubleClick={{ disabled: true }}
        initialScale={minScale}
        minScale={minScale * 0.3}
        onPanning={() => {
          if (!panned) {
            setPanned(true)
          }
        }}
        onZoom={(ref) => {
          const newScale = ref.state.scale
          setScale(newScale)
          
          // 更新缩放倍数并检查边界
          if (minScale > 0) {
            const newRatio = newScale / minScale
            const clampedRatio = Math.max(0.1, Math.min(5.0, newRatio))
            
            // 检查边界限制
            const check = checkZoomLimits(clampedRatio)
            if (!check.valid) {
              // 显示提示
              setZoomLimitMessage(check.message)
              setShowZoomLimitAlert(true)
              
              // 如果超出限制，恢复到有效范围
              const minRatio = Math.max(0.1, 100 / Math.max(imageWidth, imageHeight))
              const maxRatio = 5.0
              const finalRatio = Math.max(minRatio, Math.min(maxRatio, clampedRatio))
              
              // 延迟应用有效缩放，避免循环调用
              setTimeout(() => {
                applyZoomRatio(finalRatio)
              }, 0)
            } else {
              setZoomRatio(clampedRatio)
            }
          }
        }}
      >
        <TransformComponent
          contentStyle={{
            visibility: initialCentered ? "visible" : "hidden",
          }}
        >
          <div className="grid [grid-template-areas:'editor-content'] gap-y-4">
            <canvas
              className="[grid-area:editor-content]"
              style={{
                clipPath: `inset(0 ${sliderPos}% 0 0)`,
                transition: `clip-path ${COMPARE_SLIDER_DURATION_MS}ms`,
              }}
              ref={(r) => {
                if (r && !imageContext) {
                  const ctx = r.getContext("2d")
                  if (ctx) {
                    setImageContext(ctx)
                  }
                }
              }}
            />
            {/* 普通画笔绘制层（隐藏，仅用于绘制） */}
            <canvas
              className="[grid-area:editor-content]"
              style={{ display: "none" }}
              ref={(r) => {
                if (r && !brushContext) {
                  const ctx = r.getContext("2d")
                  if (ctx) {
                    ctx.canvas.width = imageWidth || 512
                    ctx.canvas.height = imageHeight || 512
                    setBrushContext(ctx)
                  }
                }
              }}
            />
            <canvas
              className={cn(
                "[grid-area:editor-content]",
                isProcessing
                  ? "pointer-events-none animate-pulse duration-600"
                  : ""
              )}
              style={{
                cursor: getCursor(),
                clipPath: `inset(0 ${sliderPos}% 0 0)`,
                transition: `clip-path ${COMPARE_SLIDER_DURATION_MS}ms`,
              }}
              onContextMenu={(e) => {
                e.preventDefault()
              }}
              onMouseOver={() => {
                toggleShowBrush(true)
                setShowRefBrush(false)
              }}
              onFocus={() => toggleShowBrush(true)}
              onMouseLeave={() => toggleShowBrush(false)}
              onMouseDown={onMouseDown}
              onMouseUp={onCanvasMouseUp}
              onMouseMove={onMouseDrag}
              onTouchStart={onMouseDown}
              onTouchEnd={onCanvasMouseUp}
              onTouchMove={onMouseDrag}
              ref={(r) => {
                if (r && !context) {
                  const ctx = r.getContext("2d")
                  if (ctx) {
                    setContext(ctx)
                  }
                }
              }}
            />
            <div
              className="[grid-area:editor-content] pointer-events-none grid [grid-template-areas:'original-image-content']"
              style={{
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
              }}
            >
              {showOriginal && (
                <>
                  <div
                    className="[grid-area:original-image-content] z-10 bg-primary h-full w-[6px] justify-self-end"
                    style={{
                      marginRight: `${sliderPos}%`,
                      transition: `margin-right ${COMPARE_SLIDER_DURATION_MS}ms`,
                    }}
                  />
                  <img
                    className="[grid-area:original-image-content]"
                    src={original.src}
                    alt="original"
                    style={{
                      width: `${imageWidth}px`,
                      height: `${imageHeight}px`,
                    }}
                  />
                </>
              )}
            </div>
          </div>

          <Cropper
            maxHeight={imageHeight}
            maxWidth={imageWidth}
            minHeight={Math.min(512, imageHeight)}
            minWidth={Math.min(512, imageWidth)}
            scale={getCurScale()}
            show={settings.showCropper}
          />

          {/* 图片编辑专用的裁剪框 - 不受模型类型限制 */}
          <ImageCropper
            maxHeight={imageHeight}
            maxWidth={imageWidth}
            minHeight={Math.min(100, imageHeight)}
            minWidth={Math.min(100, imageWidth)}
            scale={getCurScale()}
            show={settings.showCropper}
          />

          {interactiveSegState.isInteractiveSeg ? (
            <InteractiveSegPoints />
          ) : (
            <></>
          )}
        </TransformComponent>
      </TransformWrapper>
    )
  }

  const handleScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    // deltaY 是垂直滚动增量，正值表示向下滚动，负值表示向上滚动
    // deltaX 是水平滚动增量，正值表示向右滚动，负值表示向左滚动
    if (!isChangingBrushSizeByWheel) {
      return
    }

    const { deltaY } = event
    // console.log(`水平滚动增量: ${deltaX}, 垂直滚动增量: ${deltaY}`)
    if (deltaY > 0) {
      increaseBaseBrushSize()
    } else if (deltaY < 0) {
      decreaseBaseBrushSize()
    }
  }

  return (
    <div
      className="flex w-screen h-screen justify-center items-center"
      aria-hidden="true"
      onMouseMove={onMouseMove}
      onMouseUp={onPointerUp}
      onWheel={handleScroll}
    >
      {renderCanvas()}
      {showBrush &&
        shouldShowBrush() &&
        !isInpainting &&
        !isPanning &&
        (interactiveSegState.isInteractiveSeg
          ? renderInteractiveSegCursor()
          : renderBrush(getBrushStyle(x, y)))}

      {showRefBrush && renderBrush(getBrushStyle(windowCenterX, windowCenterY))}

      <div className="fixed flex bottom-5 border px-4 py-2 rounded-[3rem] gap-8 items-center justify-center backdrop-filter backdrop-blur-md bg-background/70">
        <Slider
          className="w-48"
          defaultValue={[50]}
          min={MIN_BRUSH_SIZE}
          max={MAX_BRUSH_SIZE}
          step={1}
          tabIndex={-1}
          value={[baseBrushSize]}
          onValueChange={(vals) => handleSliderChange(vals[0])}
          onClick={() => setShowRefBrush(false)}
        />
        {/* 缩放控制 */}
        {isOriginalLoaded && imageWidth > 0 && imageHeight > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">缩放</span>
            <Slider
              className="w-32"
              min={0.1}
              max={5.0}
              step={0.1}
              value={[zoomRatio]}
              onValueChange={(vals) => {
                const newRatio = Math.max(0.1, Math.min(5.0, vals[0]))
                applyZoomRatio(newRatio)
              }}
            />
            <NumberInput
              className="w-16 rounded-full"
              numberValue={zoomRatio}
              allowFloat={true}
              onNumberValueChange={(val) => {
                const newRatio = Math.max(0.1, Math.min(5.0, val))
                applyZoomRatio(newRatio)
              }}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">倍</span>
          </div>
        )}
        <div className="flex gap-2">
          <IconButton
            tooltip="Reset zoom & pan"
            disabled={scale === minScale && panned === false}
            onClick={resetZoom}
          >
            <Expand />
          </IconButton>
          <IconButton
            tooltip="Undo"
            onClick={handleUndo}
            disabled={
              settings.showCropper
                ? !canUndoCrop
                : settings.brushMode === "normal"
                ? brushHistory.length === 0
                : undoDisabled
            }
          >
            <Undo />
          </IconButton>
          <IconButton
            tooltip="Redo"
            onClick={handleRedo}
            disabled={
              settings.showCropper
                ? !canRedoCrop
                : settings.brushMode === "normal"
                ? brushRedoHistory.length === 0
                : redoDisabled
            }
          >
            <Redo />
          </IconButton>
          <IconButton
            tooltip="Show original image"
            onPointerDown={(ev) => {
              ev.preventDefault()
              setShowOriginal(() => {
                window.setTimeout(() => {
                  setSliderPos(100)
                }, 10)
                return true
              })
            }}
            onPointerUp={() => {
              window.setTimeout(() => {
                // 防止快速点击 show original image 按钮时图片消失
                setSliderPos(0)
              }, 10)

              window.setTimeout(() => {
                setShowOriginal(false)
              }, COMPARE_SLIDER_DURATION_MS)
            }}
            disabled={renders.length === 0}
          >
            <Eye />
          </IconButton>
          <IconButton
            tooltip="Save Image"
            disabled={!renders.length && !hasBrushContent()}
            onClick={download}
          >
            <Download />
          </IconButton>
        </div>
      </div>

      {/* 缩放限制提示弹窗 */}
      <AlertDialog open={showZoomLimitAlert} onOpenChange={setShowZoomLimitAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>缩放限制</AlertDialogTitle>
            <AlertDialogDescription>{zoomLimitMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowZoomLimitAlert(false)}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 导出确认对话框 */}
      <ExportDialog />
    </div>
  )
}
