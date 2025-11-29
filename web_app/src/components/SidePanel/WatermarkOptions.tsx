import { useState, useEffect } from "react"
import { useStore } from "@/lib/states"
import { LabelTitle, RowContainer } from "./LabelTitle"
import { Input, NumberInput } from "../ui/input"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { toast } from "../ui/use-toast"

const WATERMARK_POSITIONS = [
  { id: "center", label: "居中" },
  { id: "top-left", label: "左上" },
  { id: "top-right", label: "右上" },
  { id: "bottom-left", label: "左下" },
  { id: "bottom-right", label: "右下" },
  { id: "tiled", label: "平铺" },
]

// RGB 转十六进制
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
}

// 十六进制转 RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

const WatermarkOptions = () => {
  const [settings, watermarkConfig, updateSettings, updateWatermarkConfig] = useStore((state) => [
    state.settings,
    state.watermarkConfig,
    state.updateSettings,
    state.updateWatermarkConfig,
  ])

  const [textInput, setTextInput] = useState(watermarkConfig.text)
  const [rgbInput, setRgbInput] = useState("")
  const [showRgbInput, setShowRgbInput] = useState(false)

  // 同步 textInput 与 watermarkConfig.text
  useEffect(() => {
    setTextInput(watermarkConfig.text)
  }, [watermarkConfig.text])

  // 处理文字输入，带超限提示
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value
    setTextInput(newText)

    if (newText.length > 10) {
      toast({
        variant: "destructive",
        description: "文字过长，请精简（最多10字符）",
      })
      const trimmedText = newText.slice(0, 10)
      setTextInput(trimmedText)
      updateWatermarkConfig({ text: trimmedText })
    } else {
      updateWatermarkConfig({ text: newText })
    }
  }

  // 处理 RGB 输入
  const handleRgbInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRgbInput(value)

    // 匹配 RGB 格式：rgb(255,0,0) 或 255,0,0
    const rgbMatch = value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgbMatch) {
      const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1])))
      const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2])))
      const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3])))
      const hex = rgbToHex(r, g, b)
      updateWatermarkConfig({ color: hex })
    }
  }

  // 获取当前颜色的 RGB 值用于显示
  const currentRgb = hexToRgb(watermarkConfig.color)
  const rgbDisplay = currentRgb
    ? `${currentRgb.r},${currentRgb.g},${currentRgb.b}`
    : ""

  // 根据位置显示不同的边距标签
  const getMarginLabel = () => {
    if (watermarkConfig.position === "tiled") {
      return "平铺间距"
    }
    switch (watermarkConfig.position) {
      case "top-left":
        return "距左/距上"
      case "top-right":
        return "距右/距上"
      case "bottom-left":
        return "距左/距下"
      case "bottom-right":
        return "距右/距下"
      case "center":
        return "边距"
      default:
        return "边距"
    }
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      <RowContainer>
        <LabelTitle text="启用水印" />
        <Switch
          checked={settings.showWatermark}
          onCheckedChange={(checked) => {
            updateSettings({ showWatermark: checked })
          }}
        />
      </RowContainer>

      {settings.showWatermark && (
        <>
          <LabelTitle text="水印文字" />
      <RowContainer>
        <Input
          type="text"
          value={textInput}
          onChange={handleTextChange}
          placeholder="输入水印文字（最多10字符）"
          className="w-full"
        />
      </RowContainer>

      <LabelTitle text="字体大小" />
      <RowContainer>
        <Slider
          className="w-[180px]"
          min={12}
          max={72}
          step={1}
          value={[watermarkConfig.fontSize]}
          onValueChange={(vals) => {
            updateWatermarkConfig({ fontSize: vals[0] })
          }}
        />
        <NumberInput
          className="w-[50px] rounded-full"
          numberValue={watermarkConfig.fontSize}
          allowFloat={false}
          onNumberValueChange={(val) => {
            updateWatermarkConfig({ fontSize: Math.max(12, Math.min(72, val)) })
          }}
        />
        <span className="text-sm text-muted-foreground">px</span>
      </RowContainer>

      <LabelTitle text="颜色" />
      <RowContainer>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={watermarkConfig.color}
            onChange={(e) => {
              updateWatermarkConfig({ color: e.target.value })
            }}
            className="w-[100px] h-8"
          />
          <Input
            type="text"
            value={watermarkConfig.color}
            onChange={(e) => {
              updateWatermarkConfig({ color: e.target.value })
            }}
            className="w-[100px]"
            placeholder="#000000"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowRgbInput(!showRgbInput)}
          >
            RGB
          </Button>
        </div>
      </RowContainer>

      {showRgbInput && (
        <RowContainer>
          <Input
            type="text"
            value={rgbInput || rgbDisplay}
            onChange={handleRgbInput}
            placeholder="RGB(255,0,0) 或 255,0,0"
            className="w-full"
          />
        </RowContainer>
      )}

      <LabelTitle text="透明度" />
      <RowContainer>
        <Slider
          className="w-[180px]"
          min={0}
          max={100}
          step={1}
          value={[watermarkConfig.opacity * 100]}
          onValueChange={(vals) => {
            updateWatermarkConfig({ opacity: vals[0] / 100 })
          }}
        />
        <NumberInput
          className="w-[50px] rounded-full"
          numberValue={watermarkConfig.opacity * 100}
          allowFloat={false}
          onNumberValueChange={(val) => {
            updateWatermarkConfig({ opacity: val / 100 })
          }}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </RowContainer>

      <LabelTitle text="旋转角度" />
      <RowContainer>
        <Slider
          className="w-[180px]"
          min={0}
          max={360}
          step={1}
          value={[watermarkConfig.rotation]}
          onValueChange={(vals) => {
            updateWatermarkConfig({ rotation: vals[0] })
          }}
        />
        <NumberInput
          className="w-[50px] rounded-full"
          numberValue={watermarkConfig.rotation}
          allowFloat={false}
          onNumberValueChange={(val) => {
            updateWatermarkConfig({
              rotation: ((val % 360) + 360) % 360, // 确保在 0-360 范围内
            })
          }}
        />
        <span className="text-sm text-muted-foreground">°</span>
      </RowContainer>

      <LabelTitle text="位置" />
      <RowContainer>
        <div className="flex flex-wrap gap-2">
          {WATERMARK_POSITIONS.map((pos) => (
            <Button
              key={pos.id}
              type="button"
              size="sm"
              variant={
                watermarkConfig.position === pos.id
                  ? "default"
                  : "outline"
              }
              onClick={() => {
                updateWatermarkConfig({ position: pos.id as any })
              }}
            >
              {pos.label}
            </Button>
          ))}
        </div>
      </RowContainer>

      {watermarkConfig.position !== "tiled" && (
        <>
          <LabelTitle text={getMarginLabel()} />
          <RowContainer>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">
                  {watermarkConfig.position.includes("left")
                    ? "距左"
                    : watermarkConfig.position.includes("right")
                      ? "距右"
                      : "水平"}
                </span>
                <Slider
                  className="flex-1"
                  min={10}
                  max={50}
                  step={1}
                  value={[watermarkConfig.marginX]}
                  onValueChange={(vals) => {
                    updateWatermarkConfig({ marginX: vals[0] })
                  }}
                />
                <NumberInput
                  className="w-[50px] rounded-full"
                  numberValue={watermarkConfig.marginX}
                  allowFloat={false}
                  onNumberValueChange={(val) => {
                    updateWatermarkConfig({
                      marginX: Math.max(10, Math.min(50, val)),
                    })
                  }}
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">
                  {watermarkConfig.position.includes("top")
                    ? "距上"
                    : watermarkConfig.position.includes("bottom")
                      ? "距下"
                      : "垂直"}
                </span>
                <Slider
                  className="flex-1"
                  min={10}
                  max={50}
                  step={1}
                  value={[watermarkConfig.marginY]}
                  onValueChange={(vals) => {
                    updateWatermarkConfig({ marginY: vals[0] })
                  }}
                />
                <NumberInput
                  className="w-[50px] rounded-full"
                  numberValue={watermarkConfig.marginY}
                  allowFloat={false}
                  onNumberValueChange={(val) => {
                    updateWatermarkConfig({
                      marginY: Math.max(10, Math.min(50, val)),
                    })
                  }}
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            </div>
          </RowContainer>
        </>
      )}

      {watermarkConfig.position === "tiled" && (
        <>
          <LabelTitle text="平铺间距" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={50}
              max={300}
              step={10}
              value={[watermarkConfig.tileSpacing]}
              onValueChange={(vals) => {
                updateWatermarkConfig({ tileSpacing: vals[0] })
              }}
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={watermarkConfig.tileSpacing}
              allowFloat={false}
              onNumberValueChange={(val) => {
                updateWatermarkConfig({
                  tileSpacing: Math.max(50, Math.min(300, val)),
                })
              }}
            />
            <span className="text-sm text-muted-foreground">px</span>
          </RowContainer>

          <LabelTitle text="平铺角度" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={-45}
              max={45}
              step={5}
              value={[watermarkConfig.tileAngle]}
              onValueChange={(vals) => {
                updateWatermarkConfig({ tileAngle: vals[0] })
              }}
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={watermarkConfig.tileAngle}
              allowFloat={false}
              onNumberValueChange={(val) => {
                updateWatermarkConfig({
                  tileAngle: Math.max(-45, Math.min(45, val)),
                })
              }}
            />
            <span className="text-sm text-muted-foreground">°</span>
          </RowContainer>
        </>
      )}

      <RowContainer>
        <LabelTitle text="显示背景" />
        <Switch
          checked={watermarkConfig.showBackground}
          onCheckedChange={(checked) => {
            updateWatermarkConfig({ showBackground: checked })
          }}
        />
      </RowContainer>

      {watermarkConfig.showBackground && (
        <>
          <LabelTitle text="背景颜色" />
          <RowContainer>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={watermarkConfig.backgroundColor}
                onChange={(e) => {
                  updateWatermarkConfig({ backgroundColor: e.target.value })
                }}
                className="w-[100px] h-8"
              />
              <Input
                type="text"
                value={watermarkConfig.backgroundColor}
                onChange={(e) => {
                  updateWatermarkConfig({ backgroundColor: e.target.value })
                }}
                className="w-[100px]"
                placeholder="#FFFFFF"
              />
            </div>
          </RowContainer>

          <LabelTitle text="背景透明度" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={0}
              max={100}
              step={1}
              value={[watermarkConfig.backgroundOpacity * 100]}
              onValueChange={(vals) => {
                updateWatermarkConfig({ backgroundOpacity: vals[0] / 100 })
              }}
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={watermarkConfig.backgroundOpacity * 100}
              allowFloat={false}
              onNumberValueChange={(val) => {
                updateWatermarkConfig({ backgroundOpacity: val / 100 })
              }}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </RowContainer>
        </>
      )}
        </>
      )}
    </div>
  )
}

export default WatermarkOptions
