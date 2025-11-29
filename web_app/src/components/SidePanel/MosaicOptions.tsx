import { useStore } from "@/lib/states"
import { LabelTitle, RowContainer } from "./LabelTitle"
import { Input, NumberInput } from "../ui/input"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"
import { MosaicShapeType } from "@/lib/types"

const MOSAIC_SHAPES: { id: MosaicShapeType; label: string }[] = [
  { id: "rect", label: "矩形" },
  { id: "circle", label: "圆形" },
  { id: "freehand", label: "自由手绘" },
  { id: "polygon", label: "多边形" },
]

const MosaicOptions = () => {
  const [
    settings,
    mosaicSelections,
    updateSettings,
    updateMosaicSelection,
    removeMosaicSelection,
  ] = useStore((state) => [
    state.settings,
    state.mosaicSelections,
    state.updateSettings,
    state.updateMosaicSelection,
    state.removeMosaicSelection,
  ])

  return (
    <div className="flex flex-col gap-4 mt-4">
      <LabelTitle text="选区类型" />
      <RowContainer>
        <div className="flex flex-wrap gap-2">
          {MOSAIC_SHAPES.map((shape) => (
            <Button
              key={shape.id}
              type="button"
              size="sm"
              variant={
                settings.mosaicShapeType === shape.id ? "default" : "outline"
              }
              onClick={() => updateSettings({ mosaicShapeType: shape.id })}
            >
              {shape.label}
            </Button>
          ))}
        </div>
      </RowContainer>

      <LabelTitle text="颗粒大小" />
      <RowContainer>
        <Slider
          className="w-[180px]"
          min={1}
          max={20}
          step={1}
          value={[settings.mosaicGrainSize]}
          onValueChange={(vals) => updateSettings({ mosaicGrainSize: vals[0] })}
        />
        <NumberInput
          className="w-[50px] rounded-full"
          numberValue={settings.mosaicGrainSize}
          allowFloat={false}
          onNumberValueChange={(val) => updateSettings({ mosaicGrainSize: val })}
        />
        <span className="text-sm text-muted-foreground">px</span>
      </RowContainer>

      <LabelTitle text="模糊强度" />
      <RowContainer>
        <Slider
          className="w-[180px]"
          min={0}
          max={100}
          step={1}
          value={[settings.mosaicIntensity]}
          onValueChange={(vals) => updateSettings({ mosaicIntensity: vals[0] })}
        />
        <NumberInput
          className="w-[50px] rounded-full"
          numberValue={settings.mosaicIntensity}
          allowFloat={false}
          onNumberValueChange={(val) => updateSettings({ mosaicIntensity: val })}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </RowContainer>

      <LabelTitle text="已创建选区" />
      {mosaicSelections.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          暂无选区，在画布上绘制选区
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mosaicSelections.map((selection) => (
            <div
              key={selection.id}
              className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {selection.shapeType === "rect"
                    ? "矩形"
                    : selection.shapeType === "circle"
                      ? "圆形"
                      : selection.shapeType === "freehand"
                        ? "自由手绘"
                        : "多边形"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(selection.bounds.width)} ×{" "}
                  {Math.round(selection.bounds.height)}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    updateMosaicSelection(selection.id, {
                      visible: !selection.visible,
                    })
                  }}
                >
                  {selection.visible ? "隐藏" : "显示"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-destructive"
                  onClick={() => {
                    removeMosaicSelection(selection.id)
                  }}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MosaicOptions

