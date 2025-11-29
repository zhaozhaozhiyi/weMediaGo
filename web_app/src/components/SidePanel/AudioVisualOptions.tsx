import { useStore } from "@/lib/states"
import { Label } from "../ui/label"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"

export default function AudioVisualOptions() {
  const audioState = useStore((state) => state.audioState)
  const updateAudioState = useStore((state) => state.updateAudioState)

  const handleVisualizationChange = (value: string) => {
    updateAudioState({
      visualizationType: value as "spectrum" | "waveform2d",
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>可视化类型</Label>
        <RadioGroup
          value={audioState?.visualizationType || "spectrum"}
          onValueChange={handleVisualizationChange}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="spectrum" id="spectrum" />
            <Label htmlFor="spectrum">频谱图</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="waveform2d" id="waveform2d" />
            <Label htmlFor="waveform2d">波形图</Label>
          </div>
        </RadioGroup>
      </div>

      {audioState?.audioInfo && (
        <div className="space-y-2">
          <div>
            <Label className="text-muted-foreground">时长</Label>
            <p className="text-sm">{audioState.audioInfo.duration.toFixed(2)} 秒</p>
          </div>
          <div>
            <Label className="text-muted-foreground">采样率</Label>
            <p className="text-sm">{audioState.audioInfo.sampleRate} Hz</p>
          </div>
          <div>
            <Label className="text-muted-foreground">声道数</Label>
            <p className="text-sm">{audioState.audioInfo.channels}</p>
          </div>
        </div>
      )}
    </div>
  )
}

