import { useStore } from "@/lib/states"
import { LabelTitle, RowContainer } from "./LabelTitle"
import { Input, NumberInput } from "../ui/input"
import { Slider } from "../ui/slider"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Button } from "../ui/button"
import { CV2Flag } from "@/lib/types"
import { MIN_BRUSH_SIZE, MAX_BRUSH_SIZE, MODEL_TYPE_INPAINT } from "@/lib/const"
import { Eraser } from "lucide-react"
import { useCallback } from "react"

const BrushOptions = () => {
  const [
    settings,
    baseBrushSize,
    setBaseBrushSize,
    updateSettings,
    runInpainting,
    isProcessing,
    curLineGroup,
    extraMasks,
  ] = useStore(
    (state) => [
      state.settings,
      state.editorState.baseBrushSize,
      state.setBaseBrushSize,
      state.updateSettings,
      state.runInpainting,
      state.getIsProcessing(),
      state.editorState.curLineGroup,
      state.editorState.extraMasks,
    ]
  )

  const hadDrawSomething = useCallback(() => {
    return curLineGroup.length !== 0
  }, [curLineGroup])

  // 判断是否应该显示应用按钮
  const shouldShowApplyButton =
    settings.enableManualInpainting &&
    settings.model.model_type === MODEL_TYPE_INPAINT &&
    (settings.brushMode === "erase" || settings.brushMode === "repair")

  return (
    <div className="flex flex-col gap-4 mt-4">
      <Tabs
        value={settings.brushMode}
        onValueChange={(value) => {
          updateSettings({
            brushMode: value as "normal" | "erase" | "repair",
          })
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="normal">普通画笔</TabsTrigger>
          <TabsTrigger value="erase">去水印</TabsTrigger>
          <TabsTrigger value="repair">修复</TabsTrigger>
        </TabsList>

        {/* 普通画笔模式 */}
        <TabsContent value="normal" className="mt-4">
          <LabelTitle text="颜色" />
          <RowContainer>
            <Input
              type="color"
              value={settings.brushColor}
              onChange={(e) =>
                updateSettings({ brushColor: e.target.value })
              }
              className="w-[160px] h-8"
            />
            <Input
              type="text"
              value={settings.brushColor}
              onChange={(e) =>
                updateSettings({ brushColor: e.target.value })
              }
              className="w-[100px]"
              placeholder="#000000"
            />
          </RowContainer>

          <LabelTitle text="笔刷大小" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={MIN_BRUSH_SIZE}
              max={MAX_BRUSH_SIZE}
              step={1}
              value={[baseBrushSize]}
              onValueChange={(vals) => setBaseBrushSize(vals[0])}
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={baseBrushSize}
              allowFloat={false}
              onNumberValueChange={(val) => setBaseBrushSize(val)}
            />
          </RowContainer>

          <LabelTitle text="不透明度" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={0}
              max={100}
              step={1}
              value={[settings.brushOpacity]}
              onValueChange={(vals) =>
                updateSettings({ brushOpacity: vals[0] })
              }
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={settings.brushOpacity ?? 100}
              allowFloat={false}
              onNumberValueChange={(val) =>
                updateSettings({ brushOpacity: val })
              }
            />
            <span className="text-sm text-muted-foreground">%</span>
          </RowContainer>

          <LabelTitle text="硬度" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={0}
              max={100}
              step={1}
              value={[settings.brushHardness]}
              onValueChange={(vals) =>
                updateSettings({ brushHardness: vals[0] })
              }
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={settings.brushHardness ?? 50}
              allowFloat={false}
              onNumberValueChange={(val) =>
                updateSettings({ brushHardness: val })
              }
            />
            <span className="text-sm text-muted-foreground">%</span>
          </RowContainer>
        </TabsContent>

        {/* 去水印模式 */}
        <TabsContent value="erase" className="mt-4">
          <RowContainer>
            <LabelTitle
              text="CV2 标志"
              url="https://docs.opencv.org/4.8.0/d7/d8b/group__photo__inpaint.html#gga8002a65f5a3328fbf15df81b842d3c3ca892824c38e258feb5e72f308a358d52e"
            />
            <Select
              value={settings.cv2Flag as string}
              onValueChange={(value) => {
                const flag = value as CV2Flag
                updateSettings({ cv2Flag: flag })
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="选择 CV2 标志" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {Object.values(CV2Flag).map((flag) => (
                    <SelectItem key={flag as string} value={flag as string}>
                      {flag as string}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </RowContainer>
          <LabelTitle
            text="CV2 半径"
            url="https://docs.opencv.org/4.8.0/d7/d8b/group__photo__inpaint.html#gga8002a65f5a3328fbf15df81b842d3c3ca892824c38e258feb5e72f308a358d52e"
          />
          <RowContainer>
            <Slider
              className="w-[180px]"
              defaultValue={[5]}
              min={1}
              max={100}
              step={1}
              value={[Math.floor(settings.cv2Radius)]}
              onValueChange={(vals) => updateSettings({ cv2Radius: vals[0] })}
            />
            <NumberInput
              id="cv2-radius"
              className="w-[50px] rounded-full"
              numberValue={settings.cv2Radius ?? 5}
              allowFloat={false}
              onNumberValueChange={(val) => {
                updateSettings({ cv2Radius: val })
              }}
            />
          </RowContainer>

          <LabelTitle text="笔刷大小" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={MIN_BRUSH_SIZE}
              max={MAX_BRUSH_SIZE}
              step={1}
              value={[baseBrushSize]}
              onValueChange={(vals) => setBaseBrushSize(vals[0])}
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={baseBrushSize}
              allowFloat={false}
              onNumberValueChange={(val) => setBaseBrushSize(val)}
            />
          </RowContainer>

          {shouldShowApplyButton && (
            <div className="mt-4">
              <Button
                className="w-full"
                disabled={isProcessing || (!hadDrawSomething() && extraMasks.length === 0)}
                onClick={() => {
                  runInpainting()
                }}
              >
                <Eraser className="w-4 h-4 mr-2" />
                应用擦除去水印
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 修复画笔模式 */}
        <TabsContent value="repair" className="mt-4">
          <LabelTitle text="修复算法" />
          <RowContainer>
            <Select
              value={settings.model.name}
              onValueChange={(value) => {
                // 这里可以扩展为选择不同的修复算法
                // 暂时使用当前模型
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="选择算法" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value={settings.model.name}>
                    {settings.model.name}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </RowContainer>

          <LabelTitle text="笔刷大小" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={MIN_BRUSH_SIZE}
              max={MAX_BRUSH_SIZE}
              step={1}
              value={[baseBrushSize]}
              onValueChange={(vals) => setBaseBrushSize(vals[0])}
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={baseBrushSize}
              allowFloat={false}
              onNumberValueChange={(val) => setBaseBrushSize(val)}
            />
          </RowContainer>

          <LabelTitle text="强度" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={0}
              max={100}
              step={1}
              value={[Math.floor(settings.sdStrength * 100)]}
              onValueChange={(vals) =>
                updateSettings({ sdStrength: vals[0] / 100 })
              }
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={Math.floor((settings.sdStrength ?? 1.0) * 100)}
              allowFloat={false}
              onNumberValueChange={(val) =>
                updateSettings({ sdStrength: val / 100 })
              }
            />
            <span className="text-sm text-muted-foreground">%</span>
          </RowContainer>

          {shouldShowApplyButton && (
            <div className="mt-4">
              <Button
                className="w-full"
                disabled={isProcessing || (!hadDrawSomething() && extraMasks.length === 0)}
                onClick={() => {
                  runInpainting()
                }}
              >
                <Eraser className="w-4 h-4 mr-2" />
                应用修复
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BrushOptions

