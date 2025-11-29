import { useStore } from "@/lib/states"
import { Separator } from "../ui/separator"
import { ScrollArea } from "../ui/scroll-area"
import { RowContainer } from "./LabelTitle"
import { CV2, LDM, MODEL_TYPE_INPAINT } from "@/lib/const"
import LDMOptions from "./LDMOptions"
import DiffusionOptions from "./DiffusionOptions"
import CropOptions from "./CropOptions"
import RotateOptions from "./RotateOptions"
import BrushOptions from "./BrushOptions"
import MosaicOptions from "./MosaicOptions"
import FilterOptions from "./FilterOptions"
import WatermarkOptions from "./WatermarkOptions"
import ColorAdjustOptions from "./ColorAdjustOptions"
import CompressOptions from "./CompressOptions"
import DanmakuOptions from "./DanmakuOptions"
import AudioVisualOptions from "./AudioVisualOptions"

const SidePanel = () => {
  const [file, settings, activeMediaType] = useStore((state) => [
    state.file,
    state.settings,
    state.activeMediaType,
  ])

  // 如果没有文件，不显示面板
  if (!file) {
    return null
  }

  // 在图片模式下，检查是否有任何工具被选中
  // 如果没有工具被选中，默认显示画笔工具（这是默认状态）
  // 对于视频和音频模式，始终显示

  const getToolTitle = () => {
    if (activeMediaType === "video") return "弹幕设置"
    if (activeMediaType === "audio") return "音频可视化"
    if (settings.showCropPanel) return "裁剪"
    if (settings.showRotate) return "旋转"
    if (settings.showMosaic) return "马赛克"
    if (settings.showFilter) return "滤镜"
    if (settings.showWatermarkPanel) return "文字水印"
    if (settings.showColorAdjust) return "色彩调节"
    if (settings.showCompress) return "压缩优化"
    return "画笔"
  }

  const renderSidePanelOptions = () => {
    // 根据媒体类型显示不同面板
    if (activeMediaType === "video") {
      return <DanmakuOptions />
    }
    if (activeMediaType === "audio") {
      return <AudioVisualOptions />
    }

    // 图片编辑工具优先级：互斥工具（裁剪、旋转、马赛克、滤镜、水印）> 可共存工具（色彩调节、压缩优化）> 画笔（默认）
    // 互斥工具优先
    if (settings.showCropPanel) {
      return <CropOptions />
    }
    if (settings.showRotate) {
      return <RotateOptions />
    }
    if (settings.showMosaic) {
      return <MosaicOptions />
    }
    if (settings.showFilter) {
      return <FilterOptions />
    }
    if (settings.showWatermarkPanel) {
      return <WatermarkOptions />
    }
    // 如果没有互斥工具激活，检查可共存工具
    if (settings.showColorAdjust) {
      return <ColorAdjustOptions />
    }
    if (settings.showCompress) {
      return <CompressOptions />
    }
    // 默认显示画笔工具配置（当没有其他工具激活时）
    return <BrushOptions />
  }

  // 移除调试日志以避免控制台输出过多

  return (
    <div className="fixed top-[60px] right-0 z-50 h-[calc(100vh-60px)] w-[320px] border-l border-border bg-background px-3 pt-2 pb-4 shadow-lg flex flex-col">
      <RowContainer>
        <div className="overflow-hidden mr-2 text-sm font-medium text-primary">
          {getToolTitle()}
        </div>
      </RowContainer>
      <Separator className="my-2" />
      <ScrollArea className="flex-1 min-h-0">
        {renderSidePanelOptions()}
      </ScrollArea>
    </div>
  )
}

export default SidePanel
