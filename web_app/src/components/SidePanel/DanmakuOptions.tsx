import { useState, useEffect, useRef } from "react"
import { useStore } from "@/lib/states"
import { DanmakuConfig, DanmakuMode } from "@/lib/types"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Slider } from "../ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { generateDanmakuId } from "@/lib/utils"
import { toast } from "../ui/use-toast"

export default function DanmakuOptions() {
  const [config, setConfig] = useState<DanmakuConfig>({
    text: "weMediaGo牛逼",
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Arial",
    speed: 100,
    mode: "scroll",
    startTime: 0,
  })

  const addDanmaku = useStore((state) => state.addDanmaku)
  const videoState = useStore((state) => state.videoState)
  
  // 使用 ref 存储上一次的整数秒数，只在秒数变化时更新
  const lastSecondRef = useRef<number>(0)
  const [currentTime, setCurrentTime] = useState(0)
  
  useEffect(() => {
    const time = videoState?.currentTime || 0
    const currentSecond = Math.floor(time)
    if (currentSecond !== lastSecondRef.current) {
      lastSecondRef.current = currentSecond
      setCurrentTime(time)
    }
  }, [videoState?.currentTime])

  const handleAdd = () => {
    if (!config.text.trim()) {
      toast({
        variant: "destructive",
        description: "弹幕内容不能为空",
      })
      return
    }

    // 检查视频是否已加载
    if (!videoState || !videoState.duration || videoState.duration === 0) {
      toast({
        variant: "destructive",
        description: "请等待视频加载完成后再添加弹幕",
      })
      return
    }

    const id = generateDanmakuId()
    const danmakuInstance = {
      id,
      config: {
        ...config,
        startTime: currentTime,
      },
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      isVisible: true,
    }

    console.log("[DanmakuOptions] Adding danmaku:", danmakuInstance.config.text, "at time:", currentTime)
    addDanmaku(danmakuInstance)

    toast({
      description: "弹幕添加成功",
    })

    // 重置表单
    setConfig({
      ...config,
      text: "",
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>弹幕文字</Label>
        <Input
          value={config.text}
          onChange={(e) => setConfig({ ...config, text: e.target.value })}
          placeholder="输入弹幕内容（最多10字）"
          maxLength={10}
        />
      </div>

      <div>
        <Label>颜色</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={config.color}
            onChange={(e) => setConfig({ ...config, color: e.target.value })}
            className="w-20"
          />
          <Input
            value={config.color}
            onChange={(e) => setConfig({ ...config, color: e.target.value })}
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      <div>
        <Label>字体大小: {config.fontSize}px</Label>
        <Slider
          value={[config.fontSize]}
          onValueChange={([value]) => setConfig({ ...config, fontSize: value })}
          min={12}
          max={72}
          step={1}
        />
      </div>

      <div>
        <Label>字体</Label>
        <Select
          value={config.fontFamily}
          onValueChange={(value) => setConfig({ ...config, fontFamily: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="SimHei">黑体</SelectItem>
            <SelectItem value="SimSun">宋体</SelectItem>
            <SelectItem value="Microsoft YaHei">微软雅黑</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>滚动速度: {config.speed}px/s</Label>
        <Slider
          value={[config.speed]}
          onValueChange={([value]) => setConfig({ ...config, speed: value })}
          min={50}
          max={300}
          step={10}
        />
      </div>

      <div>
        <Label>显示模式</Label>
        <Select
          value={config.mode}
          onValueChange={(value: DanmakuMode) => setConfig({ ...config, mode: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scroll">滚动</SelectItem>
            <SelectItem value="top">顶部固定</SelectItem>
            <SelectItem value="bottom">底部固定</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.mode !== "scroll" && (
        <div>
          <Label>持续时间（秒）</Label>
          <Input
            type="number"
            value={config.duration || 3}
            onChange={(e) =>
              setConfig({ ...config, duration: parseFloat(e.target.value) })
            }
            min={1}
            max={10}
          />
        </div>
      )}

      <Button 
        onClick={handleAdd} 
        className="w-full"
        disabled={!videoState || !videoState.duration || videoState.duration === 0}
      >
        添加弹幕
      </Button>
      {(!videoState || !videoState.duration || videoState.duration === 0) && (
        <p className="text-xs text-muted-foreground text-center">
          请等待视频加载完成
        </p>
      )}
    </div>
  )
}

