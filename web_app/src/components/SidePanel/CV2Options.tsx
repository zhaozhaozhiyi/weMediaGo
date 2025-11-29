import { useState } from "react"
import { useStore } from "@/lib/states"
import { LabelTitle, RowContainer } from "./LabelTitle"
import { Input } from "../ui/input"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { CropAspectPreset } from "@/lib/types"
import { normalizeRotation } from "@/lib/utils"
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

const CV2Options = () => {
  const { toast } = useToast()
  const [
    settings,
    imageCropState,
    applyCropPreset,
    updateSettings,
    applyRotation,
    applyFlip,
    applyCrop,
    isProcessing,
  ] = useStore((state) => [
    state.settings,
    state.imageCropState,
    state.applyCropPreset,
    state.updateSettings,
    state.applyRotation,
    state.applyFlip,
    state.applyCrop,
    state.getIsProcessing(),
  ])

  const [rotation, setRotation] = useState(0)
  const [rotationInput, setRotationInput] = useState("0")

  const handleRotate = async (angle: number) => {
    const currentRotation = normalizeRotation(rotation + angle)
    setRotation(currentRotation)
    await applyRotation(angle)
  }

  const handleApplyRotation = async () => {
    const angle = parseInt(rotationInput)
    if (isNaN(angle) || angle < 0 || angle > 360) {
      toast({
        variant: "destructive",
        description: "请输入 0-360 之间的整数角度",
      })
      return
    }
    const diffAngle = normalizeRotation(angle - rotation)
    await applyRotation(diffAngle)
    setRotation(angle)
  }

  const handleRotateSlider = async (value: number) => {
    const diffAngle = normalizeRotation(value - rotation)
    setRotation(value)
    await applyRotation(diffAngle)
  }

  const handleFlipHorizontal = () => {
    applyFlip(true, false)
  }

  const handleFlipVertical = () => {
    applyFlip(false, true)
  }

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
            if (value) {
              updateSettings({ showExtender: false })
            }
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
                    // 选择自由裁剪时，自动启用裁剪框
                    if (!settings.showCropper) {
                      updateSettings({ showCropper: true })
                      updateSettings({ showExtender: false })
                    }
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
                      // 选择预设比例时，自动启用裁剪框
                      if (!settings.showCropper) {
                        updateSettings({ showCropper: true })
                        updateSettings({ showExtender: false })
                      }
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

        {/* 旋转控制 */}
        <LabelTitle text="旋转" />
        <RowContainer>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => handleRotate(90)}>
              +90°
            </Button>
            <Button size="sm" onClick={() => handleRotate(-90)}>
              -90°
            </Button>
            <Button size="sm" onClick={() => handleRotate(180)}>
              180°
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await applyRotation(-rotation)
                setRotation(0)
                setRotationInput("0")
              }}
            >
              重置
            </Button>
          </div>
        </RowContainer>

        {/* 角度输入 */}
        <RowContainer>
          <LabelTitle text="角度" />
          <Input
            value={rotationInput}
            onChange={(e) => setRotationInput(e.target.value)}
            className="w-[80px]"
            type="number"
            min={0}
            max={360}
          />
          <Button size="sm" onClick={handleApplyRotation}>
            应用
          </Button>
        </RowContainer>

        {/* 旋转滑块 */}
        <RowContainer>
          <LabelTitle text="旋转滑块" />
          <Slider
            className="w-[120px]"
            value={[rotation]}
            onValueChange={([value]) => {
              setRotationInput(value.toString())
              handleRotateSlider(value)
            }}
            min={0}
            max={360}
            step={1}
          />
          <span className="w-[40px] text-sm">{rotation}°</span>
        </RowContainer>

        {/* 翻转控制 */}
        <LabelTitle text="翻转" />
        <RowContainer>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleFlipHorizontal}>
              水平翻转
            </Button>
            <Button size="sm" onClick={handleFlipVertical}>
              垂直翻转
            </Button>
          </div>
        </RowContainer>
    </div>
  )
}

export default CV2Options
