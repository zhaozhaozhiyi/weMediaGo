import { useState } from "react"
import { useStore } from "@/lib/states"
import { LabelTitle, RowContainer } from "./LabelTitle"
import { Input } from "../ui/input"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"
import { normalizeRotation } from "@/lib/utils"
import { useToast } from "../ui/use-toast"

const RotateOptions = () => {
  const { toast } = useToast()
  const [
    applyRotation,
    applyFlip,
    isProcessing,
  ] = useStore((state) => [
    state.applyRotation,
    state.applyFlip,
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
      {/* 旋转控制 */}
      <LabelTitle text="旋转" />
      <RowContainer>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => handleRotate(90)} disabled={isProcessing}>
            +90°
          </Button>
          <Button size="sm" onClick={() => handleRotate(-90)} disabled={isProcessing}>
            -90°
          </Button>
          <Button size="sm" onClick={() => handleRotate(180)} disabled={isProcessing}>
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
            disabled={isProcessing}
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
          disabled={isProcessing}
        />
        <Button size="sm" onClick={handleApplyRotation} disabled={isProcessing}>
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
          disabled={isProcessing}
        />
        <span className="w-[40px] text-sm">{rotation}°</span>
      </RowContainer>

      {/* 翻转控制 */}
      <LabelTitle text="翻转" />
      <RowContainer>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleFlipHorizontal} disabled={isProcessing}>
            水平翻转
          </Button>
          <Button size="sm" onClick={handleFlipVertical} disabled={isProcessing}>
            垂直翻转
          </Button>
        </div>
      </RowContainer>
    </div>
  )
}

export default RotateOptions

