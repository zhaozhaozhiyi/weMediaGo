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
import { formatFileSize } from "@/lib/utils"

const CompressionDialog = () => {
  const [compressionSettings, updateSettings] = useStore((state) => [
    state.compressionSettings,
    state.updateSettings,
  ])

  const isOpen = compressionSettings.showCompressionDialog ?? false
  const originalSize = compressionSettings.originalSizeBytes ?? 0
  const compressedSize = compressionSettings.compressedSizeBytes ?? 0
  const compressionRatio =
    originalSize > 0
      ? ((1 - compressedSize / originalSize) * 100).toFixed(0)
      : "0"

  const handleClose = () => {
    updateSettings({
      compressionSettings: {
        ...compressionSettings,
        showCompressionDialog: false,
      },
    })
  }

  const handleRecompress = () => {
    // 关闭弹窗，让用户重新调整压缩率
    handleClose()
  }

  const handleConfirmExport = async () => {
    if (!compressionSettings.compressedBlob) {
      return
    }

    try {
      // 创建下载链接
      const url = URL.createObjectURL(compressionSettings.compressedBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `compressed_${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // 关闭弹窗
      handleClose()

      // 可以在这里添加成功提示
    } catch (error) {
      console.error("导出失败:", error)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>压缩前后对比</DialogTitle>
          <DialogDescription>
            查看压缩效果，确认后导出或重新压缩
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">原图大小</div>
              <div className="text-lg">{formatFileSize(originalSize)}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">压缩后大小</div>
              <div className="text-lg">{formatFileSize(compressedSize)}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="text-sm font-medium">压缩率</div>
            <div className="text-2xl font-bold">{compressionRatio}%</div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleRecompress}>
            重新压缩
          </Button>
          <Button onClick={handleConfirmExport} disabled={!compressionSettings.compressedBlob}>
            确认导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CompressionDialog

