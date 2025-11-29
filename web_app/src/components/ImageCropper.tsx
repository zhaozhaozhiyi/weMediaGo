import { useStore } from "@/lib/states"
import { cn, parseAspectRatio, computeCenteredCropRect } from "@/lib/utils"
import React, { useEffect, useState, useRef } from "react"

const DOC_MOVE_OPTS = { capture: true, passive: false }

interface EVData {
  initX: number
  initY: number
  initHeight: number
  initWidth: number
  startResizeX: number
  startResizeY: number
  ord: string
}

interface Props {
  maxHeight: number
  maxWidth: number
  scale: number
  minHeight: number
  minWidth: number
  show: boolean
}

const clamp = (
  newPos: number,
  newLength: number,
  oldPos: number,
  oldLength: number,
  minLength: number,
  maxLength: number
): [number, number] => {
  if (newPos !== oldPos && newLength === oldLength) {
    // 只移动位置，不改变大小
    if (newPos < 0) {
      return [0, oldLength]
    }
    if (newPos + newLength > maxLength) {
      return [maxLength - oldLength, oldLength]
    }
  } else {
    // 改变大小或同时改变位置和大小
    if (newLength < minLength) {
      if (newPos === oldPos) {
        return [newPos, minLength]
      }
      return [newPos + newLength - minLength, minLength]
    }
    if (newPos < 0) {
      return [0, newPos + newLength]
    }
    if (newPos + newLength > maxLength) {
      return [newPos, maxLength - newPos]
    }
  }
  return [newPos, newLength]
}

/**
 * 图片编辑专用的裁剪框组件
 * 与用于 inpainting 的 Cropper 组件不同，这个组件专注于图片裁剪编辑功能
 */
const ImageCropper = (props: Props) => {
  const { minHeight, minWidth, maxHeight, maxWidth, scale, show } = props

  const [
    imageWidth,
    imageHeight,
    { x, y, width, height },
    setX,
    setY,
    setWidth,
    setHeight,
    imageCropState,
    setIsCropperExtenderResizing,
  ] = useStore((state) => [
    state.imageWidth,
    state.imageHeight,
    state.cropperState,
    state.setCropperX,
    state.setCropperY,
    state.setCropperWidth,
    state.setCropperHeight,
    state.imageCropState,
    state.setIsCropperExtenderResizing,
  ])

  const [isMoving, setIsMoving] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMovingRef = useRef(false)
  const isResizingRef = useRef(false)
  
  // 同步 ref 和 state
  useEffect(() => {
    isMovingRef.current = isMoving
    isResizingRef.current = isResizing
  }, [isMoving, isResizing])

  // 初始化裁剪框：当图片加载时，设置裁剪框为全图大小或居中显示
  useEffect(() => {
    if (imageWidth > 0 && imageHeight > 0 && show && (width === 0 || height === 0)) {
      // 如果 imageCropState.rect 已经有值，优先使用它
      if (imageCropState.rect.width > 0 && imageCropState.rect.height > 0) {
        setX(imageCropState.rect.x)
        setY(imageCropState.rect.y)
        setWidth(imageCropState.rect.width)
        setHeight(imageCropState.rect.height)
      } else {
        // 否则初始化为居中，大小为图片的 80%
        const initialWidth = Math.min(imageWidth * 0.8, imageWidth)
        const initialHeight = Math.min(imageHeight * 0.8, imageHeight)
        setX((imageWidth - initialWidth) / 2)
        setY((imageHeight - initialHeight) / 2)
        setWidth(initialWidth)
        setHeight(initialHeight)
      }
    }
  }, [imageWidth, imageHeight, show, width, height, imageCropState.rect, setX, setY, setWidth, setHeight])

  // 当预设比例改变时，自动调整裁剪框（只在用户主动选择比例时触发，不在移动/调整时触发）
  const prevAspectRatioRef = useRef(imageCropState.aspectRatio)
  
  useEffect(() => {
    // 如果用户正在交互，不自动调整
    if (isResizing || isMoving) {
      return
    }
    
    if (
      show &&
      imageCropState.aspectRatio !== prevAspectRatioRef.current &&
      imageWidth > 0 &&
      imageHeight > 0
    ) {
      if (imageCropState.aspectRatio === "free") {
        // 当选择自由裁剪时，使用 imageCropState.rect 的值同步裁剪框
        const rect = imageCropState.rect
        if (rect.width > 0 && rect.height > 0) {
          setX(rect.x)
          setY(rect.y)
          setWidth(rect.width)
          setHeight(rect.height)
        }
      } else {
        // 当选择预设比例时，计算居中裁剪框
        const ratio = parseAspectRatio(imageCropState.aspectRatio)
        if (ratio) {
          const rect = computeCenteredCropRect(
            { width: imageWidth, height: imageHeight },
            ratio
          )
          setX(rect.x)
          setY(rect.y)
          setWidth(rect.width)
          setHeight(rect.height)
        }
      }
      prevAspectRatioRef.current = imageCropState.aspectRatio
    }
  }, [imageCropState.aspectRatio, imageCropState.rect, imageWidth, imageHeight, show, isResizing, isMoving, setX, setY, setWidth, setHeight])

  const [evData, setEVData] = useState<EVData>({
    initX: 0,
    initY: 0,
    initHeight: 0,
    initWidth: 0,
    startResizeX: 0,
    startResizeY: 0,
    ord: "",
  })
  
  // 使用 ref 存储最新的值，避免闭包问题
  const evDataRef = useRef(evData)
  const scaleRef = useRef(scale)
  const xRef = useRef(x)
  const yRef = useRef(y)
  const widthRef = useRef(width)
  const heightRef = useRef(height)
  const imageCropStateRef = useRef(imageCropState)
  
  useEffect(() => {
    evDataRef.current = evData
    scaleRef.current = scale
    xRef.current = x
    yRef.current = y
    widthRef.current = width
    heightRef.current = height
    imageCropStateRef.current = imageCropState
  }, [evData, scale, x, y, width, height, imageCropState])

  const clampLeftRight = (newX: number, newWidth: number) => {
    return clamp(newX, newWidth, x, width, minWidth, maxWidth)
  }

  const clampTopBottom = (newY: number, newHeight: number) => {
    return clamp(newY, newHeight, y, height, minHeight, maxHeight)
  }

  const onPointerMove = (e: PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const currentEvData = evDataRef.current
    const currentScale = scaleRef.current
    const curX = e.clientX
    const curY = e.clientY

    // 计算偏移量（考虑缩放）
    const offsetY = Math.round((curY - currentEvData.startResizeY) / currentScale)
    const offsetX = Math.round((curX - currentEvData.startResizeX) / currentScale)

    const currentX = xRef.current
    const currentY = yRef.current
    const currentWidth = widthRef.current
    const currentHeight = heightRef.current

    const moveTop = () => {
      const newHeight = currentEvData.initHeight - offsetY
      const newY = currentEvData.initY + offsetY
      const [clampedY, clampedHeight] = clampTopBottom(newY, newHeight)
      setHeight(clampedHeight)
      setY(clampedY)
    }

    const moveBottom = () => {
      const newHeight = currentEvData.initHeight + offsetY
      const [clampedY, clampedHeight] = clampTopBottom(currentEvData.initY, newHeight)
      setHeight(clampedHeight)
      setY(clampedY)
    }

    const moveLeft = () => {
      const newWidth = currentEvData.initWidth - offsetX
      const newX = currentEvData.initX + offsetX
      const [clampedX, clampedWidth] = clampLeftRight(newX, newWidth)
      setWidth(clampedWidth)
      setX(clampedX)
    }

    const moveRight = () => {
      const newWidth = currentEvData.initWidth + offsetX
      const [clampedX, clampedWidth] = clampLeftRight(currentEvData.initX, newWidth)
      setWidth(clampedWidth)
      setX(clampedX)
    }

    // 保持比例调整（当有预设比例时）
    const adjustWithAspectRatio = (
      newWidth: number,
      newHeight: number,
      ord: string
    ) => {
      const ratio = parseAspectRatio(imageCropState.aspectRatio)
      if (!ratio || imageCropState.aspectRatio === "free") {
        return { width: newWidth, height: newHeight }
      }

      // 根据拖拽方向决定以哪个维度为基准
      const isHorizontalDrag = ord.includes("left") || ord.includes("right")
      const isVerticalDrag = ord.includes("top") || ord.includes("bottom")

      if (isHorizontalDrag && !isVerticalDrag) {
        // 水平方向拖拽，以宽度为基准
        newHeight = newWidth / ratio
      } else if (isVerticalDrag && !isHorizontalDrag) {
        // 垂直方向拖拽，以高度为基准
        newWidth = newHeight * ratio
      } else {
        // 角点拖拽，选择较小的变化量
        const widthChange = Math.abs(newWidth - evData.initWidth)
        const heightChange = Math.abs(newHeight - evData.initHeight)
        if (widthChange > heightChange) {
          newHeight = newWidth / ratio
        } else {
          newWidth = newHeight * ratio
        }
      }

      return { width: newWidth, height: newHeight }
    }

    if (isResizing) {
      const currentImageCropState = imageCropStateRef.current
      const ratio = parseAspectRatio(currentImageCropState.aspectRatio)
      const shouldMaintainRatio = ratio && currentImageCropState.aspectRatio !== "free"

      switch (currentEvData.ord) {
        case "topleft": {
          if (shouldMaintainRatio) {
            const deltaX = offsetX
            const deltaY = offsetY
            const delta = Math.min(Math.abs(deltaX), Math.abs(deltaY))
            const signX = deltaX > 0 ? 1 : -1
            const signY = deltaY > 0 ? 1 : -1
            const newWidth = currentEvData.initWidth - signX * delta * ratio
            const newHeight = currentEvData.initHeight - signY * delta
            const newX = currentEvData.initX + signX * delta * ratio
            const newY = currentEvData.initY + signY * delta
            const [clampedX, clampedW] = clampLeftRight(newX, newWidth)
            const [clampedY, clampedH] = clampTopBottom(newY, newHeight)
            setX(clampedX)
            setY(clampedY)
            setWidth(clampedW)
            setHeight(clampedH)
          } else {
            moveTop()
            moveLeft()
          }
          break
        }
        case "topright": {
          if (shouldMaintainRatio) {
            const deltaX = evData.initX + evData.initWidth + offsetX - (evData.initX + evData.initWidth)
            const deltaY = evData.initY + offsetY - evData.initY
            const delta = Math.min(Math.abs(deltaX), Math.abs(deltaY))
            const signX = deltaX > 0 ? 1 : -1
            const signY = deltaY > 0 ? 1 : -1
            const newWidth = evData.initWidth + signX * delta * ratio
            const newHeight = evData.initHeight - signY * delta
            const newY = evData.initY + signY * delta
            const [clampedX, clampedW] = clampLeftRight(evData.initX, newWidth)
            const [clampedY, clampedH] = clampTopBottom(newY, newHeight)
            setX(clampedX)
            setY(clampedY)
            setWidth(clampedW)
            setHeight(clampedH)
          } else {
            moveTop()
            moveRight()
          }
          break
        }
        case "bottomleft": {
          if (shouldMaintainRatio) {
            const deltaX = evData.initX + offsetX - evData.initX
            const deltaY = evData.initY + evData.initHeight + offsetY - (evData.initY + evData.initHeight)
            const delta = Math.min(Math.abs(deltaX), Math.abs(deltaY))
            const signX = deltaX > 0 ? 1 : -1
            const signY = deltaY > 0 ? 1 : -1
            const newWidth = evData.initWidth - signX * delta * ratio
            const newHeight = evData.initHeight + signY * delta
            const newX = evData.initX + signX * delta * ratio
            const [clampedX, clampedW] = clampLeftRight(newX, newWidth)
            const [clampedY, clampedH] = clampTopBottom(evData.initY, newHeight)
            setX(clampedX)
            setY(clampedY)
            setWidth(clampedW)
            setHeight(clampedH)
          } else {
            moveBottom()
            moveLeft()
          }
          break
        }
        case "bottomright": {
          if (shouldMaintainRatio) {
            const deltaX = evData.initX + evData.initWidth + offsetX - (evData.initX + evData.initWidth)
            const deltaY = evData.initY + evData.initHeight + offsetY - (evData.initY + evData.initHeight)
            const delta = Math.min(Math.abs(deltaX), Math.abs(deltaY))
            const signX = deltaX > 0 ? 1 : -1
            const signY = deltaY > 0 ? 1 : -1
            const newWidth = evData.initWidth + signX * delta * ratio
            const newHeight = evData.initHeight + signY * delta
            const [clampedX, clampedW] = clampLeftRight(evData.initX, newWidth)
            const [clampedY, clampedH] = clampTopBottom(evData.initY, newHeight)
            setX(clampedX)
            setY(clampedY)
            setWidth(clampedW)
            setHeight(clampedH)
          } else {
            moveBottom()
            moveRight()
          }
          break
        }
        case "top": {
          moveTop()
          if (shouldMaintainRatio) {
            const newWidth = height * ratio!
            const [clampedX, clampedW] = clampLeftRight(x, newWidth)
            setX(clampedX)
            setWidth(clampedW)
          }
          break
        }
        case "right": {
          moveRight()
          if (shouldMaintainRatio) {
            const newHeight = width / ratio!
            const [clampedY, clampedH] = clampTopBottom(y, newHeight)
            setY(clampedY)
            setHeight(clampedH)
          }
          break
        }
        case "bottom": {
          moveBottom()
          if (shouldMaintainRatio) {
            const newWidth = height * ratio!
            const [clampedX, clampedW] = clampLeftRight(x, newWidth)
            setX(clampedX)
            setWidth(clampedW)
          }
          break
        }
        case "left": {
          moveLeft()
          if (shouldMaintainRatio) {
            const newHeight = width / ratio!
            const [clampedY, clampedH] = clampTopBottom(y, newHeight)
            setY(clampedY)
            setHeight(clampedH)
          }
          break
        }
        default:
          break
      }
    }

    if (isMoving) {
      const currentEvData = evDataRef.current
      const newX = currentEvData.initX + offsetX
      const newY = currentEvData.initY + offsetY
      const [clampedX, clampedWidth] = clampLeftRight(newX, currentEvData.initWidth)
      const [clampedY, clampedHeight] = clampTopBottom(newY, currentEvData.initHeight)
      setWidth(clampedWidth)
      setHeight(clampedHeight)
      setX(clampedX)
      setY(clampedY)
    }
  }

  const onPointerDone = () => {
    if (isResizing) {
      setIsResizing(false)
      setIsCropperExtenderResizing(false)
    }
    if (isMoving) {
      setIsMoving(false)
    }
  }

  useEffect(() => {
    if (isResizing || isMoving) {
      setIsCropperExtenderResizing(true)
      
      // 使用最新的 ref 值创建事件处理函数
      const handleMove = (e: PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // 直接调用函数，使用 ref 中的最新值
        const currentEvData = evDataRef.current
        const currentScale = scaleRef.current
        const curX = e.clientX
        const curY = e.clientY

        const offsetY = Math.round((curY - currentEvData.startResizeY) / currentScale)
        const offsetX = Math.round((curX - currentEvData.startResizeX) / currentScale)
        
        // 使用 ref 检查当前状态
        if (isResizingRef.current) {
          // 调整大小 - 调用原来的 onPointerMove 逻辑
          onPointerMove(e)
        } else if (isMovingRef.current) {
          // 移动逻辑
          const newX = currentEvData.initX + offsetX
          const newY = currentEvData.initY + offsetY
          const currentX = xRef.current
          const currentY = yRef.current
          const currentWidth = widthRef.current
          const currentHeight = heightRef.current
          
          const [clampedX, clampedWidth] = clampLeftRight(newX, currentEvData.initWidth)
          const [clampedY, clampedHeight] = clampTopBottom(newY, currentEvData.initHeight)
          setWidth(clampedWidth)
          setHeight(clampedHeight)
          setX(clampedX)
          setY(clampedY)
        }
      }
      
      const handleDone = () => {
        if (isResizing) {
          setIsResizing(false)
          setIsCropperExtenderResizing(false)
        }
        if (isMoving) {
          setIsMoving(false)
        }
      }
      
      document.addEventListener("pointermove", handleMove, DOC_MOVE_OPTS)
      document.addEventListener("pointerup", handleDone, DOC_MOVE_OPTS)
      document.addEventListener("pointercancel", handleDone, DOC_MOVE_OPTS)
      return () => {
        document.removeEventListener("pointermove", handleMove, DOC_MOVE_OPTS)
        document.removeEventListener("pointerup", handleDone, DOC_MOVE_OPTS)
        document.removeEventListener("pointercancel", handleDone, DOC_MOVE_OPTS)
        setIsCropperExtenderResizing(false)
      }
    }
  }, [isResizing, isMoving])

  const onCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const { ord } = (e.target as HTMLElement).dataset
    if (ord) {
      setIsResizing(true)
      setEVData({
        initX: x,
        initY: y,
        initHeight: height,
        initWidth: width,
        startResizeX: e.clientX,
        startResizeY: e.clientY,
        ord,
      })
    }
  }

  const createDragHandle = (
    cursor: string,
    side1: string,
    side2: string,
    position: { top?: string; bottom?: string; left?: string; right?: string }
  ) => {
    const handleSize = 12
    const halfSize = handleSize / 2

    return (
      <div
        className={cn(
          "absolute z-[5] pointer-events-auto",
          "w-3 h-3 rounded-full",
          "bg-primary border-2 border-background",
          "hover:scale-125 transition-transform",
          cursor
        )}
        style={{
          ...position,
          transform: `translate(-${halfSize}px, -${halfSize}px) scale(${1 / scale})`,
        }}
        data-ord={side1 + side2}
        aria-label={`${side1}${side2} resize handle`}
        role="button"
        tabIndex={-1}
      />
    )
  }

  const createCropSelection = () => {
    return (
      <div
        onFocus={() => {}}
        onPointerDown={onCropPointerDown}
        className="absolute inset-0"
      >
        {/* 边缘拖拽区域 */}
        <div
          className="absolute top-0 left-0 w-full cursor-ns-resize h-3 -mt-1.5"
          data-ord="top"
        />
        <div
          className="absolute top-0 right-0 h-full cursor-ew-resize w-3 -mr-1.5"
          data-ord="right"
        />
        <div
          className="absolute bottom-0 left-0 w-full cursor-ns-resize h-3 -mb-1.5"
          data-ord="bottom"
        />
        <div
          className="absolute top-0 left-0 h-full cursor-ew-resize w-3 -ml-1.5"
          data-ord="left"
        />

        {/* 角点拖拽手柄 */}
        {createDragHandle("cursor-nw-resize", "top", "left", {
          top: "0",
          left: "0",
        })}
        {createDragHandle("cursor-ne-resize", "top", "right", {
          top: "0",
          right: "0",
        })}
        {createDragHandle("cursor-sw-resize", "bottom", "left", {
          bottom: "0",
          left: "0",
        })}
        {createDragHandle("cursor-se-resize", "bottom", "right", {
          bottom: "0",
          right: "0",
        })}
      </div>
    )
  }

  const onInfoBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMoving(true)
    setEVData({
      initX: x,
      initY: y,
      initHeight: height,
      initWidth: width,
      startResizeX: e.clientX,
      startResizeY: e.clientY,
      ord: "",
    })
  }

  const createInfoBar = () => {
    return (
      <div
        className={cn(
          "absolute top-2 left-2",
          "px-3 py-1.5 rounded-md",
          "bg-background/90 backdrop-blur-sm",
          "border border-primary/20",
          "text-sm font-medium text-foreground",
          "shadow-lg",
          "pointer-events-auto cursor-move",
          "z-[6]"
        )}
        style={{
          transform: `scale(${1 / scale})`,
          transformOrigin: "top left",
        }}
        onPointerDown={onInfoBarPointerDown}
      >
        <div className="flex items-center gap-2">
          <span>
            {Math.round(width)} × {Math.round(height)}
          </span>
          {imageCropState.aspectRatio !== "free" && (
            <span className="text-xs text-muted-foreground">
              {imageCropState.aspectRatio}
            </span>
          )}
        </div>
      </div>
    )
  }

  const createBorder = () => {
    return (
      <div
        className={cn(
          "absolute inset-0",
          "border-2 border-primary",
          "shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]",
          "z-[3]"
        )}
        style={{
          boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5), inset 0 0 0 2px hsl(var(--primary))`,
        }}
      />
    )
  }

  const createGrid = () => {
    // 三分线网格
    return (
      <div className="absolute inset-0 pointer-events-none z-[4]">
        <div className="absolute top-1/3 left-0 right-0 h-px bg-primary/30" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-primary/30" />
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-primary/30" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-primary/30" />
      </div>
    )
  }

  if (!show || imageWidth === 0 || imageHeight === 0) {
    return null
  }

  return (
    <div 
      ref={containerRef}
      className="absolute h-full w-full overflow-hidden pointer-events-none z-[10]"
    >
      <div
        className="relative pointer-events-none z-[10]"
        style={{
          height: `${height}px`,
          width: `${width}px`,
          left: `${x}px`,
          top: `${y}px`,
          boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {createBorder()}
        {createGrid()}
        {createInfoBar()}
        {createCropSelection()}
      </div>
    </div>
  )
}

export default ImageCropper

