import {
  Brush,
  Crop,
  Grid3x3,
  Sparkles,
  Type,
  Palette,
  FileDown,
  RotateCw,
} from "lucide-react"
import { useStore } from "@/lib/states"
import { cn } from "@/lib/utils"

type MainToolId =
  | "brush"
  | "crop"
  | "rotate"
  | "mosaic"
  | "filter"
  | "watermark"
  | "colorAdjust"
  | "compress"

const TOOL_ITEMS: {
  id: MainToolId
  label: string
  description?: string
  icon: React.ReactNode
}[] = [
  {
    id: "brush",
    label: "画笔",

    icon: <Brush className="w-4 h-4" />,
  },
  {
    id: "crop",
    label: "裁剪",
    icon: <Crop className="w-4 h-4" />,
  },
  {
    id: "rotate",
    label: "旋转",
    icon: <RotateCw className="w-4 h-4" />,
  },
  {
    id: "mosaic",
    label: "马赛克",
    icon: <Grid3x3 className="w-4 h-4" />,
  },
  {
    id: "filter",
    label: "滤镜",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: "watermark",
    label: "水印",
    icon: <Type className="w-4 h-4" />,
  },
  {
    id: "colorAdjust",
    label: "调色",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    id: "compress",
    label: "压缩",
    icon: <FileDown className="w-4 h-4" />,
  },
]

const MainToolbar = () => {
  const [file, settings, updateSettings] = useStore((state) => [
    state.file,
    state.settings,
    state.updateSettings,
  ])

  // 如果没有文件，不显示工具栏
  if (!file) {
    return null
  }

  const activeTool: MainToolId = settings.showCropPanel
    ? "crop"
    : settings.showRotate
      ? "rotate"
      : settings.showMosaic
        ? "mosaic"
        : settings.showFilter
          ? "filter"
          : settings.showWatermarkPanel
            ? "watermark"
            : settings.showColorAdjust
              ? "colorAdjust"
              : settings.showCompress
                ? "compress"
                : "brush"

  const handleSelectTool = (tool: MainToolId) => {
    // 互斥工具：画笔、裁剪、马赛克、滤镜、水印
    // 可共存工具：色彩调节、压缩优化
    switch (tool) {
      case "brush":
        updateSettings({
          showCropPanel: false,
          showCropper: false,
          showRotate: false,
          showMosaic: false,
          showFilter: false,
          showWatermarkPanel: false,
          showWatermark: false,
          showColorAdjust: false,
          showCompress: false,
        })
        break
      case "crop":
        updateSettings({
          showCropPanel: true,
          showCropper: true,
          showRotate: false,
          showMosaic: false,
          showFilter: false,
          showWatermarkPanel: false,
          showWatermark: false,
        })
        break
      case "rotate":
        updateSettings({
          showRotate: true,
          showCropPanel: false,
          showCropper: false,
          showMosaic: false,
          showFilter: false,
          showWatermarkPanel: false,
          showWatermark: false,
        })
        break
      case "mosaic":
        updateSettings({
          showCropPanel: false,
          showCropper: false,
          showRotate: false,
          showMosaic: true,
          showFilter: false,
          showWatermarkPanel: false,
          showWatermark: false,
        })
        break
      case "filter":
        updateSettings({
          showCropPanel: false,
          showCropper: false,
          showRotate: false,
          showMosaic: false,
          showFilter: true,
          showWatermarkPanel: false,
          showWatermark: false,
        })
        break
      case "watermark":
        updateSettings({
          showCropPanel: false,
          showCropper: false,
          showRotate: false,
          showMosaic: false,
          showFilter: false,
          showWatermarkPanel: true,
          // 注意：不修改 showWatermark，让用户通过面板内开关控制
        })
        break
      case "colorAdjust":
        // 如果当前显示裁剪面板，需要先关闭它，然后再切换调色状态
        if (settings.showCropPanel) {
          updateSettings({
            showCropPanel: false,
            showColorAdjust: true,
          })
        } else if (settings.showColorAdjust) {
          // 如果已激活，则关闭
          updateSettings({
            showColorAdjust: false,
          })
        } else {
          // 如果未激活，则关闭互斥工具并激活调色
          updateSettings({
            showCropPanel: false,
            showCropper: false,
            showRotate: false,
            showMosaic: false,
            showFilter: false,
            showWatermarkPanel: false,
            showWatermark: false,
            showCompress: false, // 关闭压缩面板
            showColorAdjust: true,
          })
        }
        break
      case "compress":
        if (settings.showCompress) {
          // 如果已激活，则关闭
          updateSettings({
            showCompress: false,
          })
        } else {
          // 如果未激活，则关闭互斥工具并激活压缩
          updateSettings({
            showCropPanel: false,
            showCropper: false,
            showRotate: false,
            showMosaic: false,
            showFilter: false,
            showWatermarkPanel: false,
            showWatermark: false,
            showColorAdjust: false, // 关闭调色面板
            showCompress: true,
          })
        }
        break
      default:
        break
    }
  }

  return (
    <div className="fixed left-0 top-[60px] z-30 h-[calc(100vh-60px)] flex items-center pointer-events-none">
      <div className="ml-4 flex flex-col gap-2 rounded-2xl border border-border bg-background/80 px-2 py-3 shadow-lg pointer-events-auto">
        {TOOL_ITEMS.map((tool) => {
          const isActive = activeTool === tool.id
          return (
            <button
              key={tool.id}
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                isActive && "bg-primary text-primary-foreground hover:bg-primary"
              )}
              onClick={() => handleSelectTool(tool.id)}
            >
              <div className="flex items-center justify-center">
                {tool.icon}
              </div>
              <span className="leading-none">{tool.label}</span>
              {tool.description && (
                <span className="text-[10px] opacity-80">
                  {tool.description}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MainToolbar


