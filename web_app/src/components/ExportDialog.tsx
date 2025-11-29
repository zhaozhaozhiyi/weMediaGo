import { useState, useEffect } from "react"
import { useStore } from "@/lib/states"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { formatFileSize, generateMask, downloadImage } from "@/lib/utils"
import { toast } from "./ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

const QUALITY_OPTIONS = [
  { value: "default", label: "默认质量", quality: 0.92 },
  { value: "high", label: "高质量", quality: 0.98 },
  { value: "low", label: "低质量", quality: 0.75 },
]

const ExportDialog = () => {
  const [exportSettings, updateAppState, settings, imageWidth, imageHeight, lineGroups, file] = useStore((state) => [
    state.exportSettings,
    state.updateAppState,
    state.settings,
    state.imageWidth,
    state.imageHeight,
    state.editorState.lineGroups,
    state.file,
  ])

  const [fileName, setFileName] = useState(exportSettings.exportFileName || "")
  const [selectedQuality, setSelectedQuality] = useState<"default" | "high" | "low">(
    exportSettings.quality || "default"
  )

  const isOpen = exportSettings.showExportDialog ?? false
  const format = exportSettings.exportFormat || "PNG"
  const estimatedSize = exportSettings.estimatedSizeBytes || 0
  const dataUrl = exportSettings.exportDataUrl

  useEffect(() => {
    if (isOpen && exportSettings.exportFileName) {
      setFileName(exportSettings.exportFileName)
    }
  }, [isOpen, exportSettings.exportFileName])

  const handleClose = () => {
    updateAppState({
      exportSettings: {
        ...exportSettings,
        showExportDialog: false,
        exportDataUrl: undefined,
      },
    })
  }

  const handleExport = () => {
    if (!dataUrl || !fileName.trim()) {
      toast({
        variant: "destructive",
        description: "文件名不能为空",
      })
      return
    }

    try {
      // 根据质量选择获取 quality 值
      const qualityOption = QUALITY_OPTIONS.find((opt) => opt.value === selectedQuality)
      const quality = qualityOption?.quality || 0.92

      // 确保文件名包含扩展名
      let finalFileName = fileName.trim()
      const hasExtension = /\.(png|jpg|jpeg|webp)$/i.test(finalFileName)
      if (!hasExtension) {
        // 根据格式添加扩展名
        const ext = format.toLowerCase() === "jpeg" ? "jpg" : format.toLowerCase()
        finalFileName = `${finalFileName}.${ext}`
      }

      // 重新生成带质量的 data URL
      const canvas = document.createElement("canvas")
      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          toast({
            variant: "destructive",
            description: "导出失败，无法创建画布",
          })
          return
        }

        ctx.drawImage(img, 0, 0)
        
        // 根据格式和质量生成 data URL
        let finalDataUrl: string
        const formatLower = format.toLowerCase()
        if (formatLower === "jpeg" || formatLower === "jpg") {
          // JPEG 格式支持质量参数
          finalDataUrl = canvas.toDataURL("image/jpeg", quality)
        } else if (formatLower === "png") {
          // PNG 格式不支持 quality 参数
          // 如果用户选择了低质量，可以转换为 JPEG
          if (selectedQuality === "low") {
            finalDataUrl = canvas.toDataURL("image/jpeg", quality)
            // 更新文件名扩展名
            finalFileName = finalFileName.replace(/\.png$/i, ".jpg")
          } else {
            finalDataUrl = canvas.toDataURL("image/png")
          }
        } else {
          // 其他格式默认使用 PNG
          finalDataUrl = canvas.toDataURL("image/png")
        }

        downloadImage(finalDataUrl, finalFileName)
        
        // 如果启用了 mask 下载，在用户确认导出后再下载 mask
        if (settings.enableDownloadMask && file && imageWidth > 0 && imageHeight > 0 && lineGroups.length > 0) {
          // 延迟一下，避免两个下载同时触发导致浏览器阻止
          setTimeout(() => {
            try {
              let maskFileName = file.name.replace(/(\.[\w\d_-]+)$/i, "_mask$1")
              maskFileName = maskFileName.replace(/\.[^/.]+$/, ".jpg")

              const maskCanvas = generateMask(imageWidth, imageHeight, lineGroups)
              const maskDataUrl = maskCanvas.toDataURL("image/jpeg")
              downloadImage(maskDataUrl, maskFileName)
            } catch (error) {
              console.error("下载 mask 失败:", error)
            }
          }, 300)
        }
        
        toast({
          description: "下载成功",
        })
        handleClose()
      }
      img.onerror = () => {
        toast({
          variant: "destructive",
          description: "导出失败，图片加载错误",
        })
      }
      img.src = dataUrl
    } catch (error) {
      console.error("导出失败:", error)
      toast({
        variant: "destructive",
        description: "导出失败，请重试",
      })
    }
  }

  // 计算预计大小（根据质量调整）
  const getEstimatedSize = () => {
    if (estimatedSize === 0) return "计算中..."
    const qualityOption = QUALITY_OPTIONS.find((opt) => opt.value === selectedQuality)
    if (!qualityOption) return formatFileSize(estimatedSize)
    
    // 简单的估算：质量越低，文件越小
    const sizeMultiplier = qualityOption.quality
    const adjustedSize = estimatedSize * sizeMultiplier
    return formatFileSize(adjustedSize)
  }

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>确认导出</DialogTitle>
          <DialogDescription>
            请确认导出信息，可以修改文件名后再导出
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filename">文件名</Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="请输入文件名"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">格式</div>
              <div className="text-lg">{format}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">预计大小</div>
              <div className="text-lg">{getEstimatedSize()}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="quality">导出质量</Label>
            <Select
              value={selectedQuality}
              onValueChange={(value: "default" | "high" | "low") => {
                setSelectedQuality(value)
                updateAppState({
                  exportSettings: {
                    ...exportSettings,
                    quality: value,
                  },
                })
              }}
            >
              <SelectTrigger id="quality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={!fileName.trim() || !dataUrl}>
            确认导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportDialog

