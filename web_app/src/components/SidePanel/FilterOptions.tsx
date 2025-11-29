import { useState, useEffect, useCallback } from "react"
import { useStore } from "@/lib/states"
import { LabelTitle, RowContainer } from "./LabelTitle"
import { Input, NumberInput } from "../ui/input"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog"
import { toast } from "../ui/use-toast"
import { X, Edit2, Trash2 } from "lucide-react"
import type { FilterPreset } from "@/lib/types"

const FILTER_PRESETS = [
  { id: "vintage", name: "复古" },
  { id: "fresh", name: "清新" },
  { id: "blackwhite", name: "黑白" },
  { id: "highsaturation", name: "高饱和" },
  { id: "film", name: "胶片" },
  { id: "japanese", name: "日系" },
  { id: "cool", name: "冷色调" },
  { id: "warm", name: "暖色调" },
  { id: "nostalgic", name: "怀旧" },
  { id: "softlight", name: "柔光" },
  { id: "sharpen", name: "锐化" },
  { id: "defog", name: "去雾" },
]

const MAX_CUSTOM_PRESETS = 5

const FilterOptions = () => {
  const [settings, filterPresets, activeFilterPresetIds, updateSettings, updateAppState] = useStore((state) => [
    state.settings,
    state.filterPresets,
    state.activeFilterPresetIds,
    state.updateSettings,
    state.updateAppState,
  ])

  // 当前选中的滤镜ID（用于显示强度调节）
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null)
  // 当前滤镜的强度（用于实时预览）
  const [filterStrengths, setFilterStrengths] = useState<Record<string, number>>({})
  // 悬浮预览的滤镜ID（临时预览，不影响实际状态）
  const [hoverFilterId, setHoverFilterId] = useState<string | null>(null)
  // 保存预设对话框
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  // 重命名对话框
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingPreset, setRenamingPreset] = useState<FilterPreset | null>(null)
  const [renameValue, setRenameValue] = useState("")

  // 初始化强度值
  useEffect(() => {
    const strengths: Record<string, number> = {}
    activeFilterPresetIds.forEach((presetId) => {
      const preset = filterPresets.find((p) => p.id === presetId)
      if (preset) {
        strengths[preset.name] = preset.strength * 100
      }
    })
    setFilterStrengths(strengths)
  }, [activeFilterPresetIds, filterPresets])

  // 获取当前激活的滤镜预设
  const getActivePresets = useCallback(() => {
    return activeFilterPresetIds
      .map((id) => filterPresets.find((p) => p.id === id))
      .filter((p): p is FilterPreset => p !== undefined)
  }, [activeFilterPresetIds, filterPresets])

  // 创建或更新临时预设
  const createOrUpdateTempPreset = useCallback((filterId: string, strength: number) => {
    const existingPreset = filterPresets.find(
      (p) => p.id.startsWith("temp-") && p.name === filterId
    )
    
    if (existingPreset) {
      // 更新现有临时预设
      const updatedPresets = filterPresets.map((p) =>
        p.id === existingPreset.id ? { ...p, strength: strength / 100 } : p
      )
      updateAppState({ filterPresets: updatedPresets })
      return existingPreset.id
    } else {
      // 创建新临时预设
      const tempPreset: FilterPreset = {
        id: `temp-${filterId}-${Date.now()}`,
        name: filterId,
        strength: strength / 100,
        isCustom: false,
        createdAt: Date.now(),
      }
      updateAppState({
        filterPresets: [...filterPresets, tempPreset],
      })
      return tempPreset.id
    }
  }, [filterPresets, updateAppState])

  // 应用滤镜（点击时）
  const handleFilterClick = useCallback((filterId: string) => {
    const strength = filterStrengths[filterId] ?? 100
    
    // 检查是否已激活
    const existingPreset = filterPresets.find(
      (p) => p.name === filterId && activeFilterPresetIds.includes(p.id)
    )

    if (existingPreset) {
      // 如果已激活，取消激活
      const newIds = activeFilterPresetIds.filter((id) => id !== existingPreset.id)
      updateAppState({ activeFilterPresetIds: newIds })
      setSelectedFilterId(null)
    } else {
      // 如果未激活，检查是否可以添加（最多2种）
      if (activeFilterPresetIds.length >= 2) {
        toast({
          variant: "destructive",
          description: "最多只能叠加2种滤镜",
        })
        return
      }

      // 创建或获取预设
      const presetId = createOrUpdateTempPreset(filterId, strength)
      updateAppState({
        activeFilterPresetIds: [...activeFilterPresetIds, presetId],
      })
      setSelectedFilterId(filterId)
    }
  }, [filterStrengths, filterPresets, activeFilterPresetIds, createOrUpdateTempPreset, updateAppState])

  // 实时更新强度（滑块调节时）
  const handleStrengthChange = useCallback((filterId: string, strength: number) => {
    setFilterStrengths((prev) => ({ ...prev, [filterId]: strength }))
    
    // 实时更新预设强度
    const preset = filterPresets.find(
      (p) => p.name === filterId && activeFilterPresetIds.includes(p.id)
    )
    if (preset) {
      const updatedPresets = filterPresets.map((p) =>
        p.id === preset.id ? { ...p, strength: strength / 100 } : p
      )
      updateAppState({ filterPresets: updatedPresets })
    }
  }, [filterPresets, activeFilterPresetIds, updateAppState])

  // 移除滤镜
  const handleRemoveFilter = useCallback((presetId: string) => {
    const newIds = activeFilterPresetIds.filter((id) => id !== presetId)
    updateAppState({ activeFilterPresetIds: newIds })
    
    // 如果移除的是当前选中的，清除选中状态
    const preset = filterPresets.find((p) => p.id === presetId)
    if (preset && selectedFilterId === preset.name) {
      setSelectedFilterId(null)
    }
  }, [activeFilterPresetIds, filterPresets, selectedFilterId, updateAppState])

  // 保存预设
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) {
      toast({
        variant: "destructive",
        description: "请输入预设名称",
      })
      return
    }

    const customPresets = filterPresets.filter((p) => p.isCustom)
    if (customPresets.length >= MAX_CUSTOM_PRESETS) {
      toast({
        variant: "destructive",
        description: `最多只能保存${MAX_CUSTOM_PRESETS}个自定义预设`,
      })
      return
    }

    // 获取当前激活的滤镜配置
    const activePresets = getActivePresets()
    if (activePresets.length === 0) {
      toast({
        variant: "destructive",
        description: "请先选择滤镜",
      })
      return
    }

    // 创建自定义预设（保存当前所有激活滤镜的配置）
    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: presetName.trim(),
      strength: activePresets[0].strength, // 主滤镜强度
      isCustom: true,
      createdAt: Date.now(),
      config: {
        filterIds: activePresets.map((p) => p.name).join(","),
        strengths: JSON.stringify(activePresets.map((p) => ({ id: p.name, strength: p.strength }))),
      },
    }

    updateAppState({
      filterPresets: [...filterPresets, newPreset],
    })
    setSaveDialogOpen(false)
    setPresetName("")
    toast({
      description: "预设已保存",
    })
  }, [presetName, filterPresets, getActivePresets, updateAppState])

  // 应用预设
  const handleApplyPreset = useCallback((preset: FilterPreset) => {
    if (!preset.config?.filterIds) {
      // 单个滤镜预设
      const presetId = createOrUpdateTempPreset(preset.name, preset.strength * 100)
      updateAppState({
        activeFilterPresetIds: [presetId],
      })
    } else {
      // 多滤镜预设
      const filterIds = preset.config.filterIds.split(",")
      const strengths = JSON.parse(preset.config.strengths || "[]")
      const newIds: string[] = []
      
      filterIds.forEach((filterId: string, index: number) => {
        const strength = strengths[index]?.strength ?? preset.strength
        const presetId = createOrUpdateTempPreset(filterId, strength * 100)
        newIds.push(presetId)
      })
      
      updateAppState({
        activeFilterPresetIds: newIds,
      })
    }
  }, [createOrUpdateTempPreset, updateAppState])

  // 删除预设
  const handleDeletePreset = useCallback((presetId: string) => {
    const newPresets = filterPresets.filter((p) => p.id !== presetId)
    // 如果删除的是激活的预设，也要从激活列表中移除
    const newIds = activeFilterPresetIds.filter((id) => id !== presetId)
    updateAppState({
      filterPresets: newPresets,
      activeFilterPresetIds: newIds,
    })
    toast({
      description: "预设已删除",
    })
  }, [filterPresets, activeFilterPresetIds, updateAppState])

  // 重命名预设
  const handleRenamePreset = useCallback(() => {
    if (!renamingPreset || !renameValue.trim()) {
      return
    }

    const updatedPresets = filterPresets.map((p) =>
      p.id === renamingPreset.id
        ? { ...p, name: renameValue.trim() }
        : p
    )
    updateAppState({ filterPresets: updatedPresets })
    setRenameDialogOpen(false)
    setRenamingPreset(null)
    setRenameValue("")
    toast({
      description: "预设已重命名",
    })
  }, [renamingPreset, renameValue, filterPresets, updateAppState])

  // 获取自定义预设列表
  const customPresets = filterPresets.filter((p) => p.isCustom)

  // 获取当前激活的滤镜名称
  const activePresets = getActivePresets()
  const activeFilterNames = activePresets.map((p) => {
    const filter = FILTER_PRESETS.find((f) => f.id === p.name)
    return filter?.name || p.name
  })

  return (
    <div className="flex flex-col gap-4 mt-4">
      <LabelTitle text="滤镜预设" />
      <RowContainer>
        <div className="flex flex-wrap gap-2">
          {FILTER_PRESETS.map((filter) => {
            const isActive = activePresets.some((p) => p.name === filter.id)
            return (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                onMouseEnter={() => {
                  setHoverFilterId(filter.id)
                  updateAppState({ previewFilterId: filter.id })
                }}
                onMouseLeave={() => {
                  setHoverFilterId(null)
                  updateAppState({ previewFilterId: undefined })
                }}
                onClick={() => {
                  handleFilterClick(filter.id)
                  setSelectedFilterId(filter.id)
                }}
              >
                {filter.name}
              </Button>
            )
          })}
        </div>
      </RowContainer>

      {/* 叠加状态显示 */}
      {activePresets.length > 0 && (
        <>
          <LabelTitle text="已叠加滤镜" />
          <div className="flex flex-col gap-2">
            {activePresets.map((preset) => {
              const filter = FILTER_PRESETS.find((f) => f.id === preset.name)
              return (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <span className="text-sm">{filter?.name || preset.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFilter(preset.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
            {activePresets.length === 2 && (
              <div className="text-xs text-muted-foreground">
                已叠加 {activeFilterNames.join(" + ")}
              </div>
            )}
          </div>
        </>
      )}

      {/* 强度调节 */}
      {selectedFilterId && activePresets.some((p) => p.name === selectedFilterId) && (
        <>
          <LabelTitle text="滤镜强度" />
          <RowContainer>
            <Slider
              className="w-[180px]"
              min={0}
              max={100}
              step={1}
              value={[filterStrengths[selectedFilterId] ?? 100]}
              onValueChange={(vals) => handleStrengthChange(selectedFilterId, vals[0])}
            />
            <NumberInput
              className="w-[50px] rounded-full"
              numberValue={filterStrengths[selectedFilterId] ?? 100}
              allowFloat={false}
              onNumberValueChange={(val) => handleStrengthChange(selectedFilterId, val)}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </RowContainer>
        </>
      )}

      {/* 保存预设按钮 */}
      {activePresets.length > 0 && (
        <RowContainer>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setSaveDialogOpen(true)}
            disabled={customPresets.length >= MAX_CUSTOM_PRESETS}
          >
            保存预设
          </Button>
        </RowContainer>
      )}

      {/* 自定义预设列表 */}
      <LabelTitle text="自定义预设" />
      {customPresets.length === 0 ? (
        <div className="text-sm text-muted-foreground">暂无自定义预设</div>
      ) : (
        <div className="flex flex-col gap-2">
          {customPresets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleApplyPreset(preset)}
            >
              <span className="text-sm font-medium">{preset.name}</span>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRenamingPreset(preset)
                    setRenameValue(preset.name)
                    setRenameDialogOpen(true)
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeletePreset(preset.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 保存预设对话框 */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存预设</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">预设名称</label>
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="例如：小红书风格"
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSavePreset()
                  }
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              当前滤镜：{activeFilterNames.join(" + ")}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSavePreset}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重命名对话框 */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名预设</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">预设名称</label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="输入新名称"
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenamePreset()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRenamePreset}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FilterOptions
