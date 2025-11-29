import { useStore } from "@/lib/states"
import { LabelTitle, RowContainer } from "./LabelTitle"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { CropAspectPreset } from "@/lib/types"
import { useToast } from "../ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

const CROP_PRESETS: { id: CropAspectPreset; label: string; tooltip: string }[] = [
  { id: "3:4", label: "3:4", tooltip: "3:4-竖版短视频" },
  { id: "21:9", label: "21:9", tooltip: "21:9-电影屏" },
  { id: "4:5", label: "4:5", tooltip: "4:5-小红书封面" },
  { id: "1:2", label: "1:2", tooltip: "1:2-长条图" },
  { id: "9:16", label: "9:16", tooltip: "9:16-抖音封面" },
  { id: "1:1", label: "1:1", tooltip: "1:1-正方形" },
  { id: "4:3", label: "4:3", tooltip: "4:3-常规" },
  { id: "16:9", label: "16:9", tooltip: "16:9-宽屏" },
]

const CropOptions = () => {
  const { toast } = useToast()
  const [
    settings,
    imageCropState,
    applyCropPreset,
    updateSettings,
    applyCrop,
    isProcessing,
  ] = useStore((state) => [
    state.settings,
    state.imageCropState,
    state.applyCropPreset,
    state.updateSettings,
    state.applyCrop,
    state.getIsProcessing(),
  ])

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* 裁剪框开关 */}
      <RowContainer>
        <LabelTitle
          text="裁剪框"
          toolTip="启用裁剪框，可以在画布上调整裁剪区域"
        />
        <Switch
          id="cropper"
          checked={settings.showCropper}
          onCheckedChange={(value) => {
            updateSettings({ showCropper: value })
          }}
        />
      </RowContainer>

      <LabelTitle text="裁剪预设" />
      <RowContainer>
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    imageCropState.aspectRatio === "free"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => {
                    applyCropPreset("free")
                  }}
                >
                  自由
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>自由裁剪-自定义裁剪区域</p>
              </TooltipContent>
            </Tooltip>
            {CROP_PRESETS.map((preset) => (
              <Tooltip key={preset.id}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      imageCropState.aspectRatio === preset.id
                        ? "default"
                        : "outline"
                    }
                    onClick={() => {
                      applyCropPreset(preset.id)
                    }}
                  >
                    {preset.label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{preset.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </RowContainer>

      {/* 应用裁剪按钮 */}
      <RowContainer>
        <Button
          size="sm"
          onClick={async () => {
            if (!settings.showCropper) {
              toast({
                variant: "destructive",
                description: "请先启用裁剪框",
              })
              return
            }
            await applyCrop()
            toast({
              description: "裁剪已应用",
            })
          }}
          disabled={!settings.showCropper || isProcessing}
          variant="default"
          className="w-full"
        >
          应用裁剪
        </Button>
      </RowContainer>
    </div>
  )
}

export default CropOptions

