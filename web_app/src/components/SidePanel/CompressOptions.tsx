import { useState, useMemo } from "react"
import { useStore } from "@/lib/states"
import { LabelTitle, RowContainer } from "./LabelTitle"
import { NumberInput } from "../ui/input"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"
import { estimateCompressedSizeBytes, formatFileSize } from "@/lib/utils"

const COMPRESS_PRESETS = [
  { id: "high-quality", label: "高清晰", range: [10, 30] },
  { id: "balanced", label: "平衡", range: [30, 60] },
  { id: "size-first", label: "体积优先", range: [70, 100] },
]

const CompressOptions = () => {
  const [compressionSettings, updateAppState] = useStore(
    (state) => [
      state.compressionSettings,
      state.updateAppState,
    ]
  )

  const [compressRatio, setCompressRatio] = useState(
    compressionSettings.ratio * 100
  )

  // 计算预估压缩后大小
  const estimatedSize = useMemo(() => {
    if (!compressionSettings.originalSizeBytes) return 0
    return estimateCompressedSizeBytes(
      compressionSettings.originalSizeBytes,
      compressionSettings
    )
  }, [compressionSettings.originalSizeBytes, compressionSettings.ratio])

  // 更新压缩率时同步更新preset（如果不在对应范围内）
  const updateCompressRatio = (newRatio: number) => {
    setCompressRatio(newRatio)
    const ratioPercent = newRatio / 100
    
    // 检查是否在某个预设范围内
    let newPreset = compressionSettings.preset
    for (const preset of COMPRESS_PRESETS) {
      if (newRatio >= preset.range[0] && newRatio <= preset.range[1]) {
        newPreset = preset.id as any
        break
      }
    }
    
    updateAppState({
      compressionSettings: {
        ...compressionSettings,
        ratio: ratioPercent,
        preset: newPreset,
      },
    })
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      <LabelTitle text="压缩档次" />
      <RowContainer>
        <div className="flex flex-wrap gap-2">
          {COMPRESS_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={
                compressionSettings.preset === preset.id
                  ? "default"
                  : "outline"
              }
              onClick={() => {
                const midValue = (preset.range[0] + preset.range[1]) / 2
                updateCompressRatio(midValue)
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </RowContainer>

      <LabelTitle text="压缩率" />
      <RowContainer>
        <div className="flex items-center gap-2">
          <Slider
            className="w-[180px]"
            min={0}
            max={100}
            step={1}
            value={[compressRatio]}
            onValueChange={(vals) => {
              updateCompressRatio(vals[0])
            }}
          />
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              当前压缩率：
            </span>
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={compressRatio}
              allowFloat={false}
              onNumberValueChange={(val) => {
                updateCompressRatio(val)
              }}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      </RowContainer>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        {compressionSettings.originalSizeBytes ? (
          <>
            <div>原图大小: {formatFileSize(compressionSettings.originalSizeBytes)}</div>
            <div>
              预估压缩后大小: {estimatedSize > 0 ? formatFileSize(estimatedSize) : "计算中..."}
            </div>
          </>
        ) : (
          <div>未加载图片</div>
        )}
      </div>

      <RowContainer>
        <Button
          size="sm"
          variant="default"
          className="w-full"
          onClick={() => {
            // 应用压缩逻辑将在Editor中实现
            updateAppState({
              compressionSettings: {
                ...compressionSettings,
                showCompressionDialog: true,
              },
            })
          }}
          disabled={!compressionSettings.originalSizeBytes}
        >
          应用压缩
        </Button>
      </RowContainer>
    </div>
  )
}

export default CompressOptions

