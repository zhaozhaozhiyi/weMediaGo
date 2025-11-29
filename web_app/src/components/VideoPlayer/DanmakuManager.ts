import { DanmakuInstance, DanmakuConfig, DanmakuMode } from "@/lib/types"

export class DanmakuManager {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private videoWidth: number
  private videoHeight: number
  private danmakus: Map<string, DanmakuInstance> = new Map()
  private trackMap: Map<number, DanmakuInstance[]> = new Map() // 按时间组织
  private activeDanmakus: Set<string> = new Set()

  // 滚动弹幕轨道管理（避免重叠）
  private scrollTracks: Map<number, DanmakuInstance | null> = new Map() // trackId -> danmaku | null
  private trackHeight: number = 40 // 每行弹幕高度（含间距）
  private maxTracks: number = 0
  
  // 缓存可见弹幕列表，避免每帧重新计算
  private cachedVisibleDanmakus: DanmakuInstance[] = []
  private cacheDirty: boolean = true

  constructor(canvas: HTMLCanvasElement, videoWidth: number, videoHeight: number) {
    this.canvas = canvas
    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("Failed to get canvas context")
    }
    this.ctx = context
    this.videoWidth = videoWidth
    this.videoHeight = videoHeight
    this.maxTracks = Math.floor(videoHeight / this.trackHeight)

    // 设置canvas尺寸
    canvas.width = videoWidth
    canvas.height = videoHeight
  }

  /**
   * 添加弹幕
   * @param config 弹幕配置
   * @param parentId 父弹幕ID（用于回复）
   * @param id 可选：指定弹幕ID（用于增量更新时保持ID一致）
   * @param currentTime 当前视频时间（用于立即激活符合条件的弹幕）
   */
  addDanmaku(config: DanmakuConfig, parentId?: string, id?: string, currentTime?: number): string {
    const danmakuId = id || `danmaku_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 如果弹幕已存在，先移除
    if (this.danmakus.has(danmakuId)) {
      this.removeDanmaku(danmakuId)
    }

    // 测量文字宽度
    this.ctx.font = `${config.fontSize}px ${config.fontFamily}`
    const metrics = this.ctx.measureText(config.text)
    const width = metrics.width
    const height = config.fontSize

    // 计算初始位置
    let x = 0
    let y = 0

    if (config.mode === "scroll") {
      x = this.videoWidth // 从右侧进入
      y = this.allocateScrollTrack(height) * this.trackHeight + height
    } else if (config.mode === "top") {
      x = (this.videoWidth - width) / 2 // 居中
      y = this.allocateFixedTrack("top", height)
    } else if (config.mode === "bottom") {
      x = (this.videoWidth - width) / 2
      y = this.videoHeight - this.allocateFixedTrack("bottom", height) - height
    }

    const instance: DanmakuInstance = {
      id: danmakuId,
      config,
      x,
      y,
      width,
      height,
      parentId,
      replies: [],
      isVisible: true,
    }

    this.danmakus.set(danmakuId, instance)
    this.cacheDirty = true

    // 按时间组织
    const startTime = Math.floor(config.startTime)
    if (!this.trackMap.has(startTime)) {
      this.trackMap.set(startTime, [])
    }
    this.trackMap.get(startTime)!.push(instance)

    // 如果是回复，关联到父弹幕
    if (parentId) {
      const parent = this.danmakus.get(parentId)
      if (parent) {
        if (!parent.replies) parent.replies = []
        // 检查是否已存在（避免重复添加）
        if (!parent.replies.find(r => r.id === danmakuId)) {
          parent.replies.push(instance)
        }
      }
      // 子弹幕应该立即激活（如果父弹幕已激活）
      if (parent && this.activeDanmakus.has(parent.id)) {
        this.activeDanmakus.add(danmakuId)
        this.cacheDirty = true
      }
    }

    // 如果提供了当前时间，检查是否应该立即激活弹幕
    if (currentTime !== undefined) {
      if (
        currentTime >= config.startTime &&
        (!config.duration || currentTime <= config.startTime + config.duration)
      ) {
        this.activeDanmakus.add(danmakuId)
        this.cacheDirty = true
      }
    }

    return danmakuId
  }

  /**
   * 为滚动弹幕分配轨道（避免重叠）
   */
  private allocateScrollTrack(height: number): number {
    // 查找可用轨道
    for (let track = 0; track < this.maxTracks; track++) {
      const existing = this.scrollTracks.get(track)
      if (!existing) {
        this.scrollTracks.set(track, null) // 占位
        this.cacheDirty = true
        return track
      }

      // 检查是否已离开屏幕
      if (existing && existing.x + existing.width < 0) {
        this.scrollTracks.set(track, null)
        this.cacheDirty = true
        return track
      }
    }

    // 如果没有可用轨道，随机选择一个
    this.cacheDirty = true
    return Math.floor(Math.random() * this.maxTracks)
  }

  /**
   * 为固定弹幕分配位置（顶部/底部）
   */
  private allocateFixedTrack(mode: "top" | "bottom", height: number): number {
    // 简化实现：按顺序排列
    const existing = Array.from(this.danmakus.values())
      .filter((d) => d.config.mode === mode && d.isVisible)
      .sort((a, b) => a.y - b.y)

    if (existing.length === 0) {
      return mode === "top" ? 10 : 10
    }

    // 找到最后一个弹幕的底部位置
    const last = existing[existing.length - 1]
    return last.y + last.height + 10 // 10px间距
  }

  /**
   * 更新弹幕位置（每帧调用）
   */
  update(currentTime: number, deltaTime: number) {
    // 激活当前时间段的弹幕（检查当前时间前后1秒范围内的弹幕，确保不会遗漏）
    const timeKey = Math.floor(currentTime)
    const timeKeysToCheck = [timeKey - 1, timeKey, timeKey + 1]
    
    timeKeysToCheck.forEach((key) => {
      const danmakusToActivate = this.trackMap.get(key) || []
      danmakusToActivate.forEach((d) => {
        if (
          currentTime >= d.config.startTime &&
          (!d.config.duration || currentTime <= d.config.startTime + d.config.duration)
        ) {
          this.activeDanmakus.add(d.id)
          
          // 如果是父弹幕被激活，同时激活所有子弹幕
          if (d.replies && d.replies.length > 0) {
            d.replies.forEach((reply) => {
              if (
                currentTime >= reply.config.startTime &&
                (!reply.config.duration || currentTime <= reply.config.startTime + reply.config.duration)
              ) {
                this.activeDanmakus.add(reply.id)
              }
            })
          }
        }
      })
    })
    
    // 额外检查：遍历所有弹幕，确保没有遗漏（用于处理刚添加的弹幕）
    this.danmakus.forEach((d) => {
      if (
        currentTime >= d.config.startTime &&
        (!d.config.duration || currentTime <= d.config.startTime + d.config.duration) &&
        !this.activeDanmakus.has(d.id)
      ) {
        this.activeDanmakus.add(d.id)
        this.cacheDirty = true
      }
    })

    // 收集需要移除的弹幕ID
    const toRemove: string[] = []

    // 更新所有活跃弹幕
    this.activeDanmakus.forEach((id) => {
      const danmaku = this.danmakus.get(id)
      if (!danmaku) {
        toRemove.push(id)
        return
      }

      // 检查是否超出时间范围
      if (currentTime < danmaku.config.startTime) {
        danmaku.isVisible = false
        toRemove.push(id)
        return
      }

      if (
        danmaku.config.duration &&
        currentTime > danmaku.config.startTime + danmaku.config.duration
      ) {
        danmaku.isVisible = false
        toRemove.push(id)
        return
      }

      // 更新滚动弹幕位置
      if (danmaku.config.mode === "scroll") {
        danmaku.x -= danmaku.config.speed * deltaTime

        // 如果离开屏幕，标记为不可见
        if (danmaku.x + danmaku.width < 0) {
          danmaku.isVisible = false
          toRemove.push(id)

          // 释放轨道
          const track = Math.floor(danmaku.y / this.trackHeight)
          this.scrollTracks.delete(track)
        }
      }

      // 更新子弹幕位置（跟随父弹幕）
      if (danmaku.parentId) {
        const parent = this.danmakus.get(danmaku.parentId)
        if (parent && parent.isVisible && this.activeDanmakus.has(parent.id)) {
          // 子弹幕跟随父弹幕的位置
          if (parent.config.mode === "scroll") {
            // 滚动模式：子弹幕在父弹幕下方
            danmaku.x = parent.x
            danmaku.y = parent.y + parent.height + 5
          } else if (parent.config.mode === "top") {
            // 顶部固定：子弹幕在父弹幕下方
            danmaku.x = parent.x
            danmaku.y = parent.y + parent.height + 5
          } else if (parent.config.mode === "bottom") {
            // 底部固定：子弹幕在父弹幕上方
            danmaku.x = parent.x
            danmaku.y = parent.y - danmaku.height - 5
          }
          danmaku.isVisible = true
        } else {
          // 父弹幕不可见，子弹幕也不可见
          danmaku.isVisible = false
          toRemove.push(id)
        }
      }
    })

    // 批量移除过期弹幕
    if (toRemove.length > 0) {
      toRemove.forEach((id) => this.activeDanmakus.delete(id))
      this.cacheDirty = true
    }

    // 清理过期的trackMap条目（保留当前时间前后5秒的数据）
    const cleanupBefore = timeKey - 5
    for (const [time, danmakus] of this.trackMap.entries()) {
      if (time < cleanupBefore) {
        // 检查这些弹幕是否都已过期
        const allExpired = danmakus.every((d) => {
          const endTime = d.config.startTime + (d.config.duration || 10)
          return currentTime > endTime
        })
        if (allExpired) {
          this.trackMap.delete(time)
        }
      }
    }
  }

  /**
   * 渲染所有可见弹幕
   */
  render() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.videoWidth, this.videoHeight)

    // 如果缓存失效，重新计算可见弹幕列表
    if (this.cacheDirty) {
      this.cachedVisibleDanmakus = Array.from(this.danmakus.values())
        .filter((d) => d.isVisible && this.activeDanmakus.has(d.id))
        .sort((a, b) => {
          // 有父弹幕的排在后面
          if (a.parentId && !b.parentId) return 1
          if (!a.parentId && b.parentId) return -1
          return 0
        })
      this.cacheDirty = false
    }

    // 渲染缓存的可见弹幕列表
    this.cachedVisibleDanmakus.forEach((danmaku) => {
      // 再次检查可见性（因为位置可能已更新）
      if (danmaku.isVisible && this.activeDanmakus.has(danmaku.id)) {
        this.renderDanmaku(danmaku)
      }
    })
  }

  /**
   * 渲染单个弹幕
   */
  private renderDanmaku(danmaku: DanmakuInstance) {
    const { config, x, y, width, height } = danmaku

    this.ctx.save()

    // 设置字体
    this.ctx.font = `${config.fontSize}px ${config.fontFamily}`
    this.ctx.fillStyle = config.color
    this.ctx.textBaseline = "top"

    // 绘制文字
    this.ctx.fillText(config.text, x, y)

    // 如果是回复，绘制连接线（可选）
    if (danmaku.parentId) {
      const parent = this.danmakus.get(danmaku.parentId)
      if (parent && parent.isVisible) {
        this.ctx.strokeStyle = config.color
        this.ctx.lineWidth = 1
        this.ctx.beginPath()
        this.ctx.moveTo(parent.x + parent.width / 2, parent.y + parent.height)
        this.ctx.lineTo(danmaku.x + danmaku.width / 2, danmaku.y)
        this.ctx.stroke()
      }
    }

    this.ctx.restore()
  }

  /**
   * 获取指定位置的弹幕（用于点击检测）
   * 优化：只检查可见的活跃弹幕，按从后到前的顺序（后添加的在上层）
   */
  getDanmakuAt(x: number, y: number): DanmakuInstance | null {
    // 使用缓存的可见弹幕列表，按添加顺序倒序检查（后添加的在前面）
    const visibleList = this.cachedVisibleDanmakus.length > 0 
      ? this.cachedVisibleDanmakus 
      : Array.from(this.danmakus.values()).filter(
          (d) => d.isVisible && this.activeDanmakus.has(d.id)
        )
    
    // 从后往前检查，后添加的弹幕在上层
    for (let i = visibleList.length - 1; i >= 0; i--) {
      const danmaku = visibleList[i]
      if (
        x >= danmaku.x &&
        x <= danmaku.x + danmaku.width &&
        y >= danmaku.y &&
        y <= danmaku.y + danmaku.height
      ) {
        return danmaku
      }
    }
    return null
  }

  /**
   * 清除所有弹幕
   */
  clear() {
    this.danmakus.clear()
    this.trackMap.clear()
    this.activeDanmakus.clear()
    this.scrollTracks.clear()
    this.cachedVisibleDanmakus = []
    this.cacheDirty = true
    this.ctx.clearRect(0, 0, this.videoWidth, this.videoHeight)
  }
  
  /**
   * 移除指定弹幕
   */
  removeDanmaku(id: string): boolean {
    const danmaku = this.danmakus.get(id)
    if (!danmaku) return false
    
    // 从trackMap中移除
    const startTime = Math.floor(danmaku.config.startTime)
    const timeList = this.trackMap.get(startTime)
    if (timeList) {
      const index = timeList.findIndex((d) => d.id === id)
      if (index !== -1) {
        timeList.splice(index, 1)
        if (timeList.length === 0) {
          this.trackMap.delete(startTime)
        }
      }
    }
    
    // 从其他集合中移除
    this.danmakus.delete(id)
    this.activeDanmakus.delete(id)
    this.cacheDirty = true
    
    // 如果是滚动弹幕，释放轨道
    if (danmaku.config.mode === "scroll") {
      const track = Math.floor(danmaku.y / this.trackHeight)
      this.scrollTracks.delete(track)
    }
    
    return true
  }
}

