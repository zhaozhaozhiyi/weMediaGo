import { type ClassValue, clsx } from "clsx"
import { SyntheticEvent } from "react"
import { twMerge } from "tailwind-merge"
import {
  LineGroup,
  Size,
  Rect,
  CompressionSettings,
  MosaicSelection,
  Point,
  WatermarkConfig,
  MediaType,
} from "./types"
import { BRUSH_COLOR } from "./const"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function keepGUIAlive() {
  async function getRequest(url = "") {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-cache",
    })
    return response.json()
  }

  const keepAliveServer = () => {
    const url = document.location
    const route = "/flaskwebgui-keep-server-alive"
    getRequest(url + route).then((data) => {
      return data
    })
  }

  const intervalRequest = 3 * 1000
  keepAliveServer()
  setInterval(keepAliveServer, intervalRequest)
}

export function dataURItoBlob(dataURI: string) {
  const mime = dataURI.split(",")[0].split(":")[1].split(";")[0]
  const binary = atob(dataURI.split(",")[1])
  const array = []
  for (let i = 0; i < binary.length; i += 1) {
    array.push(binary.charCodeAt(i))
  }
  return new Blob([new Uint8Array(array)], { type: mime })
}

export function loadImage(image: HTMLImageElement, src: string) {
  return new Promise((resolve, reject) => {
    const initSRC = image.src
    const img = image
    img.onload = resolve
    img.onerror = (err) => {
      img.src = initSRC
      reject(err)
    }
    img.src = src
  })
}

export async function blobToImage(blob: Blob) {
  const dataURL = URL.createObjectURL(blob)
  const newImage = new Image()
  await loadImage(newImage, dataURL)
  return newImage
}

export function canvasToImage(
  canvas: HTMLCanvasElement
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.addEventListener("load", () => {
      resolve(image)
    })

    image.addEventListener("error", (error) => {
      reject(new Error("Failed to convert canvas to image"))
    })

    image.src = canvas.toDataURL()
  })
}

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        resolve(image)
      }
      image.onerror = () => {
        reject("无法加载图像。")
      }
      image.src = reader.result as string
    }
    reader.onerror = () => {
      reject("无法读取文件。")
    }
    reader.readAsDataURL(file)
  })
}

export function srcToFile(src: string, fileName: string, mimeType: string) {
  return fetch(src)
    .then(function (res) {
      return res.arrayBuffer()
    })
    .then(function (buf) {
      return new File([buf], fileName, { type: mimeType })
    })
}

export async function askWritePermission() {
  try {
    // The clipboard-write permission is granted automatically to pages
    // when they are the active tab. So it's not required, but it's more safe.
    const { state } = await navigator.permissions.query({
      name: "clipboard-write" as PermissionName,
    })
    return state === "granted"
  } catch (error) {
    // Browser compatibility / Security error (ONLY HTTPS) ...
    return false
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string): Promise<any> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(async (d) => {
      if (d) {
        resolve(d)
      } else {
        reject(new Error("Expected toBlob() to be defined"))
      }
    }, mime)
  )
}

const setToClipboard = async (blob: any) => {
  const data = [new ClipboardItem({ [blob.type]: blob })]
  await navigator.clipboard.write(data)
}

export function isRightClick(ev: SyntheticEvent) {
  const mouseEvent = ev.nativeEvent as MouseEvent
  return mouseEvent.button === 2
}

export function isMidClick(ev: SyntheticEvent) {
  const mouseEvent = ev.nativeEvent as MouseEvent
  return mouseEvent.button === 1
}

export async function copyCanvasImage(canvas: HTMLCanvasElement) {
  const blob = await canvasToBlob(canvas, "image/png")
  try {
    await setToClipboard(blob)
  } catch {
    console.log("Copy image failed!")
  }
}

export function downloadImage(uri: string, name: string) {
  const link = document.createElement("a")
  link.href = uri
  link.download = name

  // this is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  )

  setTimeout(() => {
    // For Firefox it is necessary to delay revoking the ObjectURL
    // window.URL.revokeObjectURL(base64)
    link.remove()
  }, 100)
}

export function mouseXY(ev: SyntheticEvent) {
    const mouseEvent = ev.nativeEvent as MouseEvent
    // Handle mask drawing coordinate on mobile/tablet devices
    if ('touches' in ev) {
        const rect = (ev.target as HTMLCanvasElement).getBoundingClientRect();
        const touches = ev.touches as (Touch & { target: HTMLCanvasElement })[]
        const touch = touches[0]
        return {
            x: (touch.clientX - rect.x) / rect.width * touch.target.offsetWidth,
            y: (touch.clientY - rect.y) / rect.height * touch.target.offsetHeight,
        }
    }
    return {x: mouseEvent.offsetX, y: mouseEvent.offsetY}
}

export function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: LineGroup,
  color = BRUSH_COLOR
) {
  ctx.strokeStyle = color
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  lines.forEach((line) => {
    if (!line?.pts.length || !line.size) {
      return
    }
    ctx.lineWidth = line.size
    ctx.beginPath()
    ctx.moveTo(line.pts[0].x, line.pts[0].y)
    line.pts.forEach((pt) => ctx.lineTo(pt.x, pt.y))
    ctx.stroke()
  })
}

export const generateMask = (
  imageWidth: number,
  imageHeight: number,
  lineGroups: LineGroup[],
  maskImages: HTMLImageElement[] = [],
  lineGroupsColor: string = "white"
): HTMLCanvasElement => {
  const maskCanvas = document.createElement("canvas")
  maskCanvas.width = imageWidth
  maskCanvas.height = imageHeight
  const ctx = maskCanvas.getContext("2d")
  if (!ctx) {
    throw new Error("could not retrieve mask canvas")
  }

  maskImages.forEach((maskImage) => {
    ctx.drawImage(maskImage, 0, 0, imageWidth, imageHeight)
  })

  lineGroups.forEach((lineGroup) => {
    drawLines(ctx, lineGroup, lineGroupsColor)
  })

  return maskCanvas
}

export const convertToBase64 = (fileOrBlob: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target?.result as string
      resolve(base64String)
    }
    reader.onerror = (error) => {
      reject(error)
    }
    reader.readAsDataURL(fileOrBlob)
  })
}

// === Helper utilities for image editing pipeline (crop / rotation / compression) ===

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

export function parseAspectRatio(ratio: string): number | null {
  const parts = ratio.split(":")
  if (parts.length !== 2) return null
  const w = Number(parts[0])
  const h = Number(parts[1])
  if (!Number.isFinite(w) || !Number.isFinite(h) || h === 0) return null
  return w / h
}

/**
 * 根据图片尺寸与目标宽高比计算裁剪区域，使其居中显示。
 */
export function computeCenteredCropRect(
  imageSize: Size,
  aspectRatio: number
): Rect {
  const { width: imgW, height: imgH } = imageSize
  if (!imgW || !imgH || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return { x: 0, y: 0, width: imgW, height: imgH }
  }

  const imageRatio = imgW / imgH
  let cropW = imgW
  let cropH = imgH

  if (imageRatio > aspectRatio) {
    // 图片太“宽”，以高度为基准裁剪宽度
    cropH = imgH
    cropW = Math.round(cropH * aspectRatio)
  } else {
    // 图片太“高”，以宽度为基准裁剪高度
    cropW = imgW
    cropH = Math.round(cropW / aspectRatio)
  }

  const x = Math.round((imgW - cropW) / 2)
  const y = Math.round((imgH - cropH) / 2)

  return { x, y, width: cropW, height: cropH }
}

/**
 * 归一化角度到 [0, 360) 区间，用于旋转逻辑与展示。
 */
export function normalizeRotation(angle: number): number {
  if (!Number.isFinite(angle)) return 0
  let a = angle % 360
  if (a < 0) a += 360
  return a
}

/**
 * 格式化文件大小，自动选择 KB 或 MB 单位
 * @param bytes 文件大小（字节）
 * @returns 格式化后的字符串，如 "2.4MB" 或 "960KB"
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 KB"
  if (bytes < 1024 * 1024) {
    // 小于 1MB，显示为 KB
    return `${(bytes / 1024).toFixed(2)} KB`
  } else {
    // 大于等于 1MB，显示为 MB
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}

/**
 * 依据压缩设置与原始体积进行简单体积预估，方便在 UI 中展示"预计大小"。
 * 这里不关心具体编码细节，只做线性近似与上限裁剪。
 */
export function estimateCompressedSizeBytes(
  originalBytes: number,
  settings: CompressionSettings
): number {
  if (!originalBytes || originalBytes <= 0) return 0
  const base = clamp(settings.ratio, 0.05, 1) * originalBytes
  if (settings.targetMaxBytes && settings.targetMaxBytes > 0) {
    return Math.min(base, settings.targetMaxBytes)
  }
  return base
}

/**
 * 旋转图像并返回新的 canvas
 */
export function rotateImage(
  image: HTMLImageElement,
  angle: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  // 将角度转换为弧度
  const radians = (angle * Math.PI) / 180

  // 计算旋转后的画布尺寸
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  const newWidth = Math.round(image.width * cos + image.height * sin)
  const newHeight = Math.round(image.width * sin + image.height * cos)

  canvas.width = newWidth
  canvas.height = newHeight

  // 移动到画布中心
  ctx.translate(newWidth / 2, newHeight / 2)
  ctx.rotate(radians)
  ctx.translate(-image.width / 2, -image.height / 2)

  // 绘制图像
  ctx.drawImage(image, 0, 0)

  return canvas
}

/**
 * 翻转图像并返回新的 canvas
 */
export function flipImage(
  image: HTMLImageElement,
  horizontal: boolean,
  vertical: boolean
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  canvas.width = image.width
  canvas.height = image.height

  // 应用翻转变换
  ctx.translate(
    horizontal ? image.width : 0,
    vertical ? image.height : 0
  )
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1)
  ctx.drawImage(image, 0, 0)

  return canvas
}

/**
 * 裁剪图像并返回新的 canvas
 */
export function cropImage(
  image: HTMLImageElement,
  rect: Rect
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  canvas.width = rect.width
  canvas.height = rect.height

  // 从源图像中裁剪指定区域
  ctx.drawImage(
    image,
    rect.x, rect.y, rect.width, rect.height, // 源图像区域
    0, 0, rect.width, rect.height // 目标画布区域
  )

  return canvas
}

/**
 * 检查点是否在选区内
 */
function isPointInSelection(
  x: number,
  y: number,
  selection: MosaicSelection
): boolean {
  const { shapeType, bounds, points } = selection

  // 先检查是否在包围盒内
  if (
    x < bounds.x ||
    x > bounds.x + bounds.width ||
    y < bounds.y ||
    y > bounds.y + bounds.height
  ) {
    return false
  }

  switch (shapeType) {
    case "rect":
      return true
    case "circle": {
      const centerX = bounds.x + bounds.width / 2
      const centerY = bounds.y + bounds.height / 2
      const radiusX = bounds.width / 2
      const radiusY = bounds.height / 2
      const dx = (x - centerX) / radiusX
      const dy = (y - centerY) / radiusY
      return dx * dx + dy * dy <= 1
    }
    case "freehand":
    case "polygon": {
      if (!points || points.length < 3) return false
      // 使用射线法判断点是否在多边形内
      let inside = false
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x
        const yi = points[i].y
        const xj = points[j].x
        const yj = points[j].y
        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
        if (intersect) inside = !inside
      }
      return inside
    }
    default:
      return false
  }
}

/**
 * 应用马赛克效果到图片
 */
export function applyMosaic(
  image: HTMLImageElement | HTMLCanvasElement,
  selections: MosaicSelection[]
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  const width =
    image instanceof HTMLImageElement ? image.naturalWidth : image.width
  const height =
    image instanceof HTMLImageElement ? image.naturalHeight : image.height

  canvas.width = width
  canvas.height = height

  // 先绘制原图
  ctx.drawImage(image, 0, 0, width, height)

  // 对每个选区应用马赛克
  selections
    .filter((sel) => sel.visible)
    .forEach((selection) => {
      const { bounds, grainSize, intensity } = selection
      const imageData = ctx.getImageData(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
      )
      const data = imageData.data

      // 马赛克处理：将区域分成 grainSize x grainSize 的块
      const blockSize = Math.max(1, grainSize)
      for (let y = 0; y < bounds.height; y += blockSize) {
        for (let x = 0; x < bounds.width; x += blockSize) {
          // 计算当前块的平均颜色
          let r = 0,
            g = 0,
            b = 0,
            a = 0,
            count = 0

          for (let dy = 0; dy < blockSize && y + dy < bounds.height; dy++) {
            for (let dx = 0; dx < blockSize && x + dx < bounds.width; dx++) {
              const px = x + dx
              const py = y + dy
              // 检查点是否在选区内
              if (
                isPointInSelection(
                  bounds.x + px,
                  bounds.y + py,
                  selection
                )
              ) {
                const idx = (py * bounds.width + px) * 4
                r += data[idx]
                g += data[idx + 1]
                b += data[idx + 2]
                a += data[idx + 3]
                count++
              }
            }
          }

          if (count > 0) {
            r = Math.floor(r / count)
            g = Math.floor(g / count)
            b = Math.floor(b / count)
            a = Math.floor(a / count)

            // 应用模糊强度
            const blurFactor = intensity / 100
            const originalR = r
            const originalG = g
            const originalB = b

            // 将块内所有像素设置为平均颜色
            for (let dy = 0; dy < blockSize && y + dy < bounds.height; dy++) {
              for (let dx = 0; dx < blockSize && x + dx < bounds.width; dx++) {
                const px = x + dx
                const py = y + dy
                if (
                  isPointInSelection(
                    bounds.x + px,
                    bounds.y + py,
                    selection
                  )
                ) {
                  const idx = (py * bounds.width + px) * 4
                  // 混合原色和平均色
                  data[idx] = Math.floor(
                    originalR * (1 - blurFactor) + r * blurFactor
                  )
                  data[idx + 1] = Math.floor(
                    originalG * (1 - blurFactor) + g * blurFactor
                  )
                  data[idx + 2] = Math.floor(
                    originalB * (1 - blurFactor) + b * blurFactor
                  )
                  data[idx + 3] = a
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, bounds.x, bounds.y)
    })

  return canvas
}

/**
 * 应用滤镜效果到图片
 */
export function applyFilter(
  image: HTMLImageElement | HTMLCanvasElement,
  filterId: string,
  strength: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  const width =
    image instanceof HTMLImageElement ? image.naturalWidth : image.width
  const height =
    image instanceof HTMLImageElement ? image.naturalHeight : image.height

  canvas.width = width
  canvas.height = height
  ctx.drawImage(image, 0, 0, width, height)

  // 先保存原图数据，用于强度混合
  const originalImageData = ctx.getImageData(0, 0, width, height)
  const originalData = new Uint8ClampedArray(originalImageData.data)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const strengthFactor = strength / 100

  // 应用滤镜
  switch (filterId) {
    case "vintage": {
      // 复古：降低饱和度，增加暖色调
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const gray = r * 0.299 + g * 0.587 + b * 0.114
        data[i] = Math.min(255, gray * 0.7 + r * 0.3 + 20)
        data[i + 1] = Math.min(255, gray * 0.7 + g * 0.3 + 10)
        data[i + 2] = Math.min(255, gray * 0.7 + b * 0.3)
      }
      break
    }
    case "fresh": {
      // 清新：提高亮度，降低对比度
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1 + 10)
        data[i + 1] = Math.min(255, data[i + 1] * 1.1 + 10)
        data[i + 2] = Math.min(255, data[i + 2] * 1.1 + 10)
      }
      break
    }
    case "blackwhite": {
      // 黑白
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        data[i] = gray
        data[i + 1] = gray
        data[i + 2] = gray
      }
      break
    }
    case "highsaturation": {
      // 高饱和：增强色彩饱和度
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const gray = r * 0.299 + g * 0.587 + b * 0.114
        data[i] = Math.min(255, gray + (r - gray) * 1.5)
        data[i + 1] = Math.min(255, gray + (g - gray) * 1.5)
        data[i + 2] = Math.min(255, gray + (b - gray) * 1.5)
      }
      break
    }
    case "film": {
      // 胶片：模拟胶卷质感，增加颗粒感和对比度
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // 增加对比度
        const contrast = 1.2
        const rContrast = ((r / 255 - 0.5) * contrast + 0.5) * 255
        const gContrast = ((g / 255 - 0.5) * contrast + 0.5) * 255
        const bContrast = ((b / 255 - 0.5) * contrast + 0.5) * 255
        // 轻微降低饱和度，增加暖色调
        const gray = rContrast * 0.299 + gContrast * 0.587 + bContrast * 0.114
        data[i] = Math.max(0, Math.min(255, gray * 0.85 + rContrast * 0.15 + 5))
        data[i + 1] = Math.max(0, Math.min(255, gray * 0.85 + gContrast * 0.15 + 3))
        data[i + 2] = Math.max(0, Math.min(255, gray * 0.85 + bContrast * 0.15))
      }
      break
    }
    case "japanese": {
      // 日系：低饱和、高亮度
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const gray = r * 0.299 + g * 0.587 + b * 0.114
        // 降低饱和度，提高亮度
        const saturation = 0.6
        const brightness = 1.15
        data[i] = Math.min(255, (gray + (r - gray) * saturation) * brightness)
        data[i + 1] = Math.min(255, (gray + (g - gray) * saturation) * brightness)
        data[i + 2] = Math.min(255, (gray + (b - gray) * saturation) * brightness)
      }
      break
    }
    case "cool": {
      // 冷色调：偏蓝绿
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, data[i] - 10)
        data[i + 1] = Math.min(255, data[i + 1] + 5)
        data[i + 2] = Math.min(255, data[i + 2] + 15)
      }
      break
    }
    case "warm": {
      // 暖色调：偏红黄
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + 15)
        data[i + 1] = Math.min(255, data[i + 1] + 10)
        data[i + 2] = Math.max(0, data[i + 2] - 5)
      }
      break
    }
    case "nostalgic": {
      // 怀旧：泛黄复古
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // 增加黄色调，降低饱和度
        const gray = r * 0.299 + g * 0.587 + b * 0.114
        data[i] = Math.min(255, gray * 0.6 + r * 0.4 + 25)
        data[i + 1] = Math.min(255, gray * 0.6 + g * 0.4 + 20)
        data[i + 2] = Math.max(0, gray * 0.6 + b * 0.4 - 10)
      }
      break
    }
    case "softlight": {
      // 柔光：降低对比度，增加亮度
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // 降低对比度（向中间值靠拢）
        const contrast = 0.7
        const rSoft = ((r / 255 - 0.5) * contrast + 0.5) * 255
        const gSoft = ((g / 255 - 0.5) * contrast + 0.5) * 255
        const bSoft = ((b / 255 - 0.5) * contrast + 0.5) * 255
        // 增加亮度
        const brightness = 1.1
        data[i] = Math.min(255, rSoft * brightness + 8)
        data[i + 1] = Math.min(255, gSoft * brightness + 8)
        data[i + 2] = Math.min(255, bSoft * brightness + 8)
      }
      break
    }
    case "sharpen": {
      // 锐化：使用卷积核增强边缘
      const tempData = new Uint8ClampedArray(data)
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ]
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let r = 0, g = 0, b = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4
              const k = kernel[(ky + 1) * 3 + (kx + 1)]
              r += tempData[idx] * k
              g += tempData[idx + 1] * k
              b += tempData[idx + 2] * k
            }
          }
          const idx = (y * width + x) * 4
          data[idx] = Math.max(0, Math.min(255, r))
          data[idx + 1] = Math.max(0, Math.min(255, g))
          data[idx + 2] = Math.max(0, Math.min(255, b))
        }
      }
      break
    }
    case "defog": {
      // 去雾：提升清晰度，减少朦胧感
      const tempData = new Uint8ClampedArray(data)
      // 使用去雾算法：增强对比度和饱和度
      for (let i = 0; i < data.length; i += 4) {
        const r = tempData[i]
        const g = tempData[i + 1]
        const b = tempData[i + 2]
        // 计算最小通道值（雾的估计）
        const minChannel = Math.min(r, g, b)
        // 去雾：增强对比度
        const contrast = 1.3
        const rDefog = ((r / 255 - 0.5) * contrast + 0.5) * 255
        const gDefog = ((g / 255 - 0.5) * contrast + 0.5) * 255
        const bDefog = ((b / 255 - 0.5) * contrast + 0.5) * 255
        // 增强饱和度
        const gray = rDefog * 0.299 + gDefog * 0.587 + bDefog * 0.114
        const saturation = 1.2
        data[i] = Math.max(0, Math.min(255, gray + (rDefog - gray) * saturation))
        data[i + 1] = Math.max(0, Math.min(255, gray + (gDefog - gray) * saturation))
        data[i + 2] = Math.max(0, Math.min(255, gray + (bDefog - gray) * saturation))
      }
      break
    }
    default: {
      // 未知滤镜，不做处理
      break
    }
  }

  // 应用强度：将滤镜结果与原图混合
  if (strengthFactor < 1) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(data[i] * strengthFactor + originalData[i] * (1 - strengthFactor))
      data[i + 1] = Math.floor(data[i + 1] * strengthFactor + originalData[i + 1] * (1 - strengthFactor))
      data[i + 2] = Math.floor(data[i + 2] * strengthFactor + originalData[i + 2] * (1 - strengthFactor))
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * 应用色彩调节
 */
export function applyColorAdjust(
  image: HTMLImageElement | HTMLCanvasElement,
  brightness: number,
  contrast: number,
  saturation: number,
  colorTemperature: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  const width =
    image instanceof HTMLImageElement ? image.naturalWidth : image.width
  const height =
    image instanceof HTMLImageElement ? image.naturalHeight : image.height

  canvas.width = width
  canvas.height = height
  ctx.drawImage(image, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // 添加默认值处理，确保参数有效
  const brightnessValue = brightness ?? 100
  const contrastValue = contrast ?? 100
  const saturationValue = saturation ?? 100
  const colorTemperatureValue = colorTemperature ?? 100

  const brightnessFactor = brightnessValue / 100
  const contrastFactor = contrastValue / 100
  const saturationFactor = saturationValue / 100
  const tempFactor = colorTemperatureValue / 100

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // 亮度调节
    r = r * brightnessFactor
    g = g * brightnessFactor
    b = b * brightnessFactor

    // 对比度调节
    r = (r - 128) * contrastFactor + 128
    g = (g - 128) * contrastFactor + 128
    b = (b - 128) * contrastFactor + 128

    // 饱和度调节
    const gray = r * 0.299 + g * 0.587 + b * 0.114
    r = gray + (r - gray) * saturationFactor
    g = gray + (g - gray) * saturationFactor
    b = gray + (b - gray) * saturationFactor

    // 色温调节
    if (tempFactor < 1) {
      // 冷色
      r = r * (1 - (1 - tempFactor) * 0.2)
      b = b * (1 + (1 - tempFactor) * 0.3)
    } else {
      // 暖色
      r = r * (1 + (tempFactor - 1) * 0.3)
      b = b * (1 - (tempFactor - 1) * 0.2)
    }

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * 应用文字水印
 */
export function applyWatermark(
  image: HTMLImageElement | HTMLCanvasElement,
  config: WatermarkConfig
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  const width =
    image instanceof HTMLImageElement ? image.naturalWidth : image.width
  const height =
    image instanceof HTMLImageElement ? image.naturalHeight : image.height

  canvas.width = width
  canvas.height = height
  ctx.drawImage(image, 0, 0, width, height)

  if (!config.text) return canvas

  ctx.font = `${config.fontSize}px Arial`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  const metrics = ctx.measureText(config.text)
  const textWidth = metrics.width
  const textHeight = config.fontSize

  // 绘制单个水印的函数
  const drawWatermark = (x: number, y: number) => {
    // 绘制背景
    if (config.showBackground) {
      const bgPadding = 8
      ctx.fillStyle = config.backgroundColor
      ctx.globalAlpha = config.backgroundOpacity
      ctx.fillRect(
        x - textWidth / 2 - bgPadding,
        y - textHeight / 2 - bgPadding,
        textWidth + bgPadding * 2,
        textHeight + bgPadding * 2
      )
    }

    // 绘制文字
    ctx.fillStyle = config.color
    ctx.globalAlpha = config.opacity
    ctx.fillText(config.text, x, y)
  }

  // 平铺模式
  if (config.position === "tiled") {
    const spacing = config.tileSpacing || 100
    const angle = (config.tileAngle || 0) * (Math.PI / 180)

    // 计算旋转后的文本尺寸
    const cos = Math.abs(Math.cos(angle))
    const sin = Math.abs(Math.sin(angle))
    const rotatedWidth = textWidth * cos + textHeight * sin
    const rotatedHeight = textWidth * sin + textHeight * cos

    // 计算平铺网格
    const stepX = rotatedWidth + spacing
    const stepY = rotatedHeight + spacing

    // 保存上下文状态
    ctx.save()

    // 绘制平铺水印
    for (let y = stepY / 2; y < height + stepY; y += stepY) {
      for (let x = stepX / 2; x < width + stepX; x += stepX) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        drawWatermark(0, 0)
        ctx.restore()
      }
    }

    ctx.restore()
  } else {
    // 固定位置模式
    let x = width / 2
    let y = height / 2

    // 使用 marginX 和 marginY，如果没有则使用 margin（向后兼容）
    const marginX = config.marginX ?? config.margin ?? 16
    const marginY = config.marginY ?? config.margin ?? 16

    // 计算位置
    switch (config.position) {
      case "top-left":
        x = marginX + textWidth / 2
        y = marginY + textHeight / 2
        break
      case "top-right":
        x = width - marginX - textWidth / 2
        y = marginY + textHeight / 2
        break
      case "bottom-left":
        x = marginX + textWidth / 2
        y = height - marginY - textHeight / 2
        break
      case "bottom-right":
        x = width - marginX - textWidth / 2
        y = height - marginY - textHeight / 2
        break
      case "center":
      default:
        x = width / 2
        y = height / 2
        break
    }

    // 如果设置了旋转角度，应用旋转
    const rotation = config.rotation || 0
    if (rotation !== 0) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((rotation * Math.PI) / 180)
      drawWatermark(0, 0)
      ctx.restore()
    } else {
      drawWatermark(x, y)
    }
  }

  return canvas
}

/**
 * 压缩图片
 */
export function compressImage(
  image: HTMLImageElement | HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    const width =
      image instanceof HTMLImageElement ? image.naturalWidth : image.width
    const height =
      image instanceof HTMLImageElement ? image.naturalHeight : image.height

    canvas.width = width
    canvas.height = height
    ctx.drawImage(image, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to compress image"))
        }
      },
      "image/jpeg",
      quality / 100
    )
  })
}

/**
 * 根据文件类型返回媒体类型
 */
export function getMediaType(file: File): MediaType {
  if (file.type.startsWith("image/")) {
    return "image"
  } else if (file.type.startsWith("video/")) {
    return "video"
  } else if (file.type.startsWith("audio/")) {
    return "audio"
  }
  return "image" // 默认返回图片
}

/**
 * 格式化时间为 MM:SS 格式
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

/**
 * 生成唯一弹幕ID
 */
export function generateDanmakuId(): string {
  return `danmaku_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 测量文字宽度
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  ctx: CanvasRenderingContext2D
): number {
  ctx.font = `${fontSize}px ${fontFamily}`
  return ctx.measureText(text).width
}
