import { useStore } from "@/lib/states"
import { LabelTitle, RowContainer } from "./LabelTitle"
import { NumberInput } from "../ui/input"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"

const ColorAdjustOptions = () => {
  const [settings, updateSettings] = useStore((state) => [
    state.settings,
    state.updateSettings,
  ])

  return (
    <div className="flex flex-col gap-4 mt-4">
      <LabelTitle text="亮度" />
      <RowContainer>
        <Slider
          className="w-[180px]"
          min={0}
          max={200}
          step={1}
          value={[settings.brightness]}
          onValueChange={(vals) => updateSettings({ brightness: vals[0] })}
        />
        <NumberInput
          className="w-[50px] rounded-full"
          numberValue={settings.brightness}
          allowFloat={false}
          onNumberValueChange={(val) => updateSettings({ brightness: val })}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </RowContainer>

      <LabelTitle text="对比度" />
      <RowContainer>
        <Slider
          className="w-[180px]"
          min={0}
          max={200}
          step={1}
          value={[settings.contrast]}
          onValueChange={(vals) => updateSettings({ contrast: vals[0] })}
        />
        <NumberInput
          className="w-[50px] rounded-full"
          numberValue={settings.contrast}
          allowFloat={false}
          onNumberValueChange={(val) => updateSettings({ contrast: val })}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </RowContainer>

      <LabelTitle text="饱和度" />
      <RowContainer>
        <Slider
          className="w-[180px]"
          min={0}
          max={200}
          step={1}
          value={[settings.saturation]}
          onValueChange={(vals) => updateSettings({ saturation: vals[0] })}
        />
        <NumberInput
          className="w-[50px] rounded-full"
          numberValue={settings.saturation}
          allowFloat={false}
          onNumberValueChange={(val) => updateSettings({ saturation: val })}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </RowContainer>

      <LabelTitle text="色温" />
      <RowContainer>
        <Slider
          className="w-[180px]"
          min={0}
          max={200}
          step={1}
          value={[settings.colorTemperature]}
          onValueChange={(vals) => updateSettings({ colorTemperature: vals[0] })}
        />
        <NumberInput
          className="w-[50px] rounded-full"
          numberValue={settings.colorTemperature}
          allowFloat={false}
          onNumberValueChange={(val) => updateSettings({ colorTemperature: val })}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </RowContainer>

      <RowContainer>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              updateSettings({ colorTemperature: 80 })
            }}
          >
            冷色
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              updateSettings({ colorTemperature: 120 })
            }}
          >
            暖色
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              updateSettings({ colorTemperature: 100 })
            }}
          >
            默认
          </Button>
        </div>
      </RowContainer>

      <RowContainer>
        <Button
          size="sm"
          variant="default"
          className="w-full"
          onClick={() => {
            // 应用色彩调节逻辑（Phase 2 实现）
          }}
        >
          应用调节
        </Button>
      </RowContainer>
    </div>
  )
}

export default ColorAdjustOptions

