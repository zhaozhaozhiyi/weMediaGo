export interface Filename {
  name: string
  height: number
  width: number
  ctime: number
  mtime: number
}

export interface PluginInfo {
  name: string
  support_gen_image: boolean
  support_gen_mask: boolean
}

export interface ServerConfig {
  plugins: PluginInfo[]
  modelInfos: ModelInfo[]
  removeBGModel: string
  removeBGModels: string[]
  realesrganModel: string
  realesrganModels: string[]
  interactiveSegModel: string
  interactiveSegModels: string[]
  enableFileManager: boolean
  enableAutoSaving: boolean
  enableControlnet: boolean
  controlnetMethod: string
  disableModelSwitch: boolean
  isDesktop: boolean
  samplers: string[]
}

export interface GenInfo {
  prompt: string
  negative_prompt: string
}

export interface ModelInfo {
  name: string
  path: string
  model_type:
    | "inpaint"
    | "diffusers_sd"
    | "diffusers_sdxl"
    | "diffusers_sd_inpaint"
    | "diffusers_sdxl_inpaint"
    | "diffusers_other"
  support_strength: boolean
  support_outpainting: boolean
  support_controlnet: boolean
  support_brushnet: boolean
  support_powerpaint_v2: boolean
  controlnets: string[]
  brushnets: string[]
  support_lcm_lora: boolean
  need_prompt: boolean
  is_single_file_diffusers: boolean
}

export enum PluginName {
  RemoveBG = "RemoveBG",
  AnimeSeg = "AnimeSeg",
  RealESRGAN = "RealESRGAN",
  GFPGAN = "GFPGAN",
  RestoreFormer = "RestoreFormer",
  InteractiveSeg = "InteractiveSeg",
}

export interface PluginParams {
  upscale: number
}

export enum SortBy {
  NAME = "name",
  CTIME = "ctime",
  MTIME = "mtime",
}

export enum SortOrder {
  DESCENDING = "desc",
  ASCENDING = "asc",
}

export enum LDMSampler {
  ddim = "ddim",
  plms = "plms",
}

export enum CV2Flag {
  INPAINT_NS = "INPAINT_NS",
  INPAINT_TELEA = "INPAINT_TELEA",
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export interface Line {
  size?: number
  pts: Point[]
}

export type LineGroup = Array<Line>

export interface Size {
  width: number
  height: number
}

export enum ExtenderDirection {
  x = "x",
  y = "y",
  xy = "xy",
}

export enum PowerPaintTask {
  text_guided = "text-guided",
  shape_guided = "shape-guided",
  context_aware = "context-aware",
  object_remove = "object-remove",
  outpainting = "outpainting",
}

export type AdjustMaskOperate = "expand" | "shrink" | "reverse"

// === Image editing specific types (crop / filters / mosaic / watermark / compression) ===

export type CropAspectPreset =
  | "3:4"
  | "21:9"
  | "4:5"
  | "1:2"
  | "9:16"
  | "1:1"
  | "4:3"
  | "16:9"
  | "free"

export interface CropHistoryEntry {
  rect: Rect
  aspectRatio: CropAspectPreset
  createdAt: number
}

// NOTE: this is separate from the legacy `cropperState` used by inpainting/extender，
// 专门为图片编辑裁剪流程提供状态（包括历史栈等），避免与现有逻辑耦合过深。
export interface CropState {
  rect: Rect
  aspectRatio: CropAspectPreset
  history: CropHistoryEntry[]
  redoHistory: CropHistoryEntry[]
  maxHistory: number
}

export type MosaicShapeType = "rect" | "circle" | "freehand" | "polygon"

export interface MosaicSelection {
  id: string
  shapeType: MosaicShapeType
  /** 以图片坐标系为基准的矩形包围盒 */
  bounds: Rect
  /** 对于自由绘制/多边形类型，使用点集合描述形状 */
  points?: Point[]
  /** 马赛克颗粒大小，越大越粗糙 */
  grainSize: number
  /** 模糊强度或像素化强度，0-1 或 0-100 由 UI 控制 */
  intensity: number
  /** 是否在当前预览中显示（用于暂时隐藏但不删除） */
  visible: boolean
}

export interface FilterPreset {
  id: string
  /** 展示名称（例如 “复古”、“柔光”） */
  name: string
  /** 滤镜主强度，范围推荐 0~1 */
  strength: number
  /** 可选的附加参数（例如色温/对比度等），具体由实现解释 */
  config?: Record<string, number>
  /** 是否为用户自定义预设 */
  isCustom: boolean
  createdAt: number
}

export type WatermarkPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "tiled"

export interface WatermarkConfig {
  text: string
  /** CSS-like color string 或 hsl token key */
  color: string
  /** 0–1 不透明度 */
  opacity: number
  position: WatermarkPosition
  /** px 级别的内边距，用于离边缘保持一点距离（统一边距，向后兼容） */
  margin: number
  /** 水平边距（距左或距右），单位 px */
  marginX: number
  /** 垂直边距（距上或距下），单位 px */
  marginY: number
  /** 是否绘制背景块（如半透明矩形） */
  showBackground: boolean
  /** 背景颜色，同样使用 CSS-like 字符串或 token */
  backgroundColor: string
  /** 背景不透明度，0–1 */
  backgroundOpacity: number
  /** 是否对整张图平铺水印 */
  tiled: boolean
  /** 平铺间距（仅当 tiled 为 true 时有效），单位 px */
  tileSpacing: number
  /** 平铺角度（仅当 tiled 为 true 时有效），单位度 */
  tileAngle: number
  /** 字体大小，单位 px */
  fontSize: number
  /** 文字旋转角度（0-360度），适用于所有位置 */
  rotation: number
}

export type CompressionPreset = "high-quality" | "balanced" | "size-first"

export interface CompressionSettings {
  /** 目标压缩率，例如 0.3 表示压到原图 30% 左右体积 */
  ratio: number
  /** 当前选择的快捷档位 */
  preset: CompressionPreset
  /** 原始文件大小（字节），可选，用于做体积预估 */
  originalSizeBytes?: number
  /** 如果用户给出期望上限（字节），体积预估逻辑可以据此进行 clamp */
  targetMaxBytes?: number
  /** 压缩后的blob，用于对比弹窗 */
  compressedBlob?: Blob
  /** 压缩后的大小（字节） */
  compressedSizeBytes?: number
  /** 是否显示压缩对比弹窗 */
  showCompressionDialog?: boolean
}

export type ExportQuality = "default" | "high" | "low"

export interface ExportSettings {
  /** 导出质量：默认质量、高质量、低质量 */
  quality: ExportQuality
  /** 是否显示导出确认对话框 */
  showExportDialog?: boolean
  /** 导出文件名 */
  exportFileName?: string
  /** 导出格式 */
  exportFormat?: string
  /** 预计文件大小（字节） */
  estimatedSizeBytes?: number
  /** 导出用的 canvas data URL */
  exportDataUrl?: string
}

// === Video and Audio types ===

export type MediaType = "image" | "video" | "audio"

export type DanmakuMode = "top" | "bottom" | "scroll"

export interface DanmakuConfig {
  text: string
  color: string
  fontSize: number
  fontFamily: string
  speed: number // 滚动速度（像素/秒）
  mode: DanmakuMode
  startTime: number // 开始时间（秒）
  duration?: number // 持续时间（秒，仅用于固定模式）
}

export interface DanmakuInstance {
  id: string
  config: DanmakuConfig
  x: number // 当前X坐标
  y: number // 当前Y坐标
  width: number // 弹幕宽度
  height: number // 弹幕高度
  parentId?: string // 父弹幕ID（用于回复）
  replies?: DanmakuInstance[] // 子弹幕列表
  isVisible: boolean // 是否可见
}

export interface VideoState {
  file: File | null
  duration: number
  currentTime: number
  isPlaying: boolean
  volume: number
  danmakus: DanmakuInstance[]
}

export interface AudioInfo {
  duration: number
  sampleRate: number
  channels: number
  bitrate?: number
}

export interface AudioState {
  file: File | null
  duration: number
  currentTime: number
  isPlaying: boolean
  volume: number
  audioBuffer: AudioBuffer | null
  visualizationType: "spectrum" | "waveform2d" | "particles3d"
  audioInfo: AudioInfo | null
}
