import { persist } from "zustand/middleware"
import { shallow } from "zustand/shallow"
import { immer } from "zustand/middleware/immer"
import { castDraft } from "immer"
import { createWithEqualityFn } from "zustand/traditional"
import {
  AdjustMaskOperate,
  CV2Flag,
  ExtenderDirection,
  LDMSampler,
  Line,
  LineGroup,
  ModelInfo,
  MosaicSelection,
  PluginParams,
  Point,
  PowerPaintTask,
  ServerConfig,
  Size,
  SortBy,
  SortOrder,
  CropState,
  FilterPreset,
  WatermarkConfig,
  CompressionSettings,
  CropAspectPreset,
  ExportSettings,
  MediaType,
  DanmakuInstance,
  VideoState,
  AudioState,
} from "./types"
import {
  BRUSH_COLOR,
  DEFAULT_BRUSH_SIZE,
  DEFAULT_NEGATIVE_PROMPT,
  MAX_BRUSH_SIZE,
  MODEL_TYPE_INPAINT,
  PAINT_BY_EXAMPLE,
} from "./const"
import {
  blobToImage,
  canvasToImage,
  dataURItoBlob,
  generateMask,
  loadImage,
  srcToFile,
  computeCenteredCropRect,
  parseAspectRatio,
  rotateImage,
  flipImage,
  cropImage,
} from "./utils"
import inpaint, { getGenInfo, postAdjustMask, runPlugin } from "./api"
import { toast } from "@/components/ui/use-toast"

type FileManagerState = {
  sortBy: SortBy
  sortOrder: SortOrder
  layout: "rows" | "masonry"
  searchText: string
  inputDirectory: string
  outputDirectory: string
}

type CropperState = {
  x: number
  y: number
  width: number
  height: number
}

export type Settings = {
  model: ModelInfo
  enableDownloadMask: boolean
  enableManualInpainting: boolean
  enableUploadMask: boolean
  enableAutoExtractPrompt: boolean
  showCropper: boolean
  showExtender: boolean
  extenderDirection: ExtenderDirection

  // Brush settings
  brushMode: "normal" | "erase" | "repair"
  brushColor: string
  brushOpacity: number
  brushHardness: number

  // Tool activation states
  showMosaic: boolean
  showFilter: boolean
  showWatermark: boolean
  showWatermarkPanel: boolean
  showColorAdjust: boolean
  showCompress: boolean
  showRotate: boolean
  showCropPanel: boolean // 控制裁剪面板的显示，与 showCropper（控制画布裁剪框）分离

  // Color adjustment values
  brightness: number
  contrast: number
  saturation: number
  colorTemperature: number

  // Mosaic selection drawing state
  mosaicShapeType: "rect" | "circle" | "freehand" | "polygon"
  mosaicGrainSize: number
  mosaicIntensity: number

  // For LDM
  ldmSteps: number
  ldmSampler: LDMSampler

  // For ZITS
  zitsWireframe: boolean

  // For OpenCV2
  cv2Radius: number
  cv2Flag: CV2Flag

  // For Diffusion moel
  prompt: string
  negativePrompt: string
  seed: number
  seedFixed: boolean

  // For SD
  sdMaskBlur: number
  sdStrength: number
  sdSteps: number
  sdGuidanceScale: number
  sdSampler: string
  sdMatchHistograms: boolean
  sdScale: number

  // Pix2Pix
  p2pImageGuidanceScale: number

  // ControlNet
  enableControlnet: boolean
  controlnetConditioningScale: number
  controlnetMethod: string

  // BrushNet
  enableBrushNet: boolean
  brushnetMethod: string
  brushnetConditioningScale: number

  enableLCMLora: boolean

  // PowerPaint
  enablePowerPaintV2: boolean
  powerpaintTask: PowerPaintTask

  // AdjustMask
  adjustMaskKernelSize: number

  // Video and Audio settings
  showDanmaku: boolean
  showDanmakuPanel: boolean
  showAudioVisual: boolean
}

type InteractiveSegState = {
  isInteractiveSeg: boolean
  tmpInteractiveSegMask: HTMLImageElement | null
  clicks: number[][]
}

type EditorState = {
  baseBrushSize: number
  brushSizeScale: number
  renders: HTMLImageElement[]
  lineGroups: LineGroup[]
  lastLineGroup: LineGroup
  curLineGroup: LineGroup

  // mask from interactive-seg or other segmentation models
  extraMasks: HTMLImageElement[]
  prevExtraMasks: HTMLImageElement[]

  temporaryMasks: HTMLImageElement[]
  // redo 相关
  redoRenders: HTMLImageElement[]
  redoCurLines: Line[]
  redoLineGroups: LineGroup[]
}

type AppState = {
  file: File | null
  paintByExampleFile: File | null
  customMask: File | null
  imageHeight: number
  imageWidth: number
  isInpainting: boolean
  isPluginRunning: boolean
  isAdjustingMask: boolean
  windowSize: Size
  editorState: EditorState
  disableShortCuts: boolean

  interactiveSegState: InteractiveSegState
  fileManagerState: FileManagerState

  cropperState: CropperState
  extenderState: CropperState
  isCropperExtenderResizing: boolean

  // 图片编辑增强相关状态（裁剪 / 滤镜 / 马赛克 / 水印 / 压缩）
  imageCropState: CropState
  filterPresets: FilterPreset[]
  activeFilterPresetIds: string[] // 支持最多2种滤镜叠加
  previewFilterId?: string // 悬浮预览的滤镜ID（临时，不影响实际状态）
  mosaicSelections: MosaicSelection[]
  watermarkConfig: WatermarkConfig
  compressionSettings: CompressionSettings
  exportSettings: ExportSettings

  // Video and Audio states
  activeMediaType: MediaType
  videoState: VideoState | null
  audioState: AudioState | null
  danmakus: DanmakuInstance[]

  serverConfig: ServerConfig

  settings: Settings
}

type AppAction = {
  updateAppState: (newState: Partial<AppState>) => void
  setFile: (file: File) => Promise<void>
  setCustomFile: (file: File) => void
  setIsInpainting: (newValue: boolean) => void
  getIsProcessing: () => boolean
  setBaseBrushSize: (newValue: number) => void
  decreaseBaseBrushSize: () => void
  increaseBaseBrushSize: () => void
  getBrushSize: () => number
  setImageSize: (width: number, height: number) => void

  applyCropPreset: (preset: CropAspectPreset) => void

  isSD: () => boolean

  setCropperX: (newValue: number) => void
  setCropperY: (newValue: number) => void
  setCropperWidth: (newValue: number) => void
  setCropperHeight: (newValue: number) => void

  setExtenderX: (newValue: number) => void
  setExtenderY: (newValue: number) => void
  setExtenderWidth: (newValue: number) => void
  setExtenderHeight: (newValue: number) => void

  setIsCropperExtenderResizing: (newValue: boolean) => void
  updateExtenderDirection: (newValue: ExtenderDirection) => void
  resetExtender: (width: number, height: number) => void
  updateExtenderByBuiltIn: (direction: ExtenderDirection, scale: number) => void

  setServerConfig: (newValue: ServerConfig) => void
  setSeed: (newValue: number) => void
  updateSettings: (newSettings: Partial<Settings>) => void

  // 互斥
  updateEnablePowerPaintV2: (newValue: boolean) => void
  updateEnableBrushNet: (newValue: boolean) => void
  updateEnableControlnet: (newValue: boolean) => void
  updateLCMLora: (newValue: boolean) => void

  setModel: (newModel: ModelInfo) => void
  updateFileManagerState: (newState: Partial<FileManagerState>) => void
  updateInteractiveSegState: (newState: Partial<InteractiveSegState>) => void
  resetInteractiveSegState: () => void
  handleInteractiveSegAccept: () => void
  handleFileManagerMaskSelect: (blob: Blob) => Promise<void>
  showPromptInput: () => boolean

  runInpainting: () => Promise<void>
  showPrevMask: () => Promise<void>
  hidePrevMask: () => void
  runRenderablePlugin: (
    genMask: boolean,
    pluginName: string,
    params?: PluginParams
  ) => Promise<void>

  // EditorState
  getCurrentTargetFile: () => Promise<File>
  updateEditorState: (newState: Partial<EditorState>) => void
  runMannually: () => boolean
  handleCanvasMouseDown: (point: Point) => void
  handleCanvasMouseMove: (point: Point) => void
  cleanCurLineGroup: () => void
  resetRedoState: () => void
  undo: () => void
  redo: () => void
  undoDisabled: () => boolean
  redoDisabled: () => boolean

  adjustMask: (operate: AdjustMaskOperate) => Promise<void>
  clearMask: () => void

  // 图像变换操作
  applyRotation: (angle: number) => Promise<void>
  applyFlip: (horizontal: boolean, vertical: boolean) => Promise<void>
  applyCrop: () => Promise<void>
  undoCrop: () => void
  redoCrop: () => void
  canUndoCrop: () => boolean
  canRedoCrop: () => boolean

  // 马赛克选区管理
  addMosaicSelection: (selection: MosaicSelection) => void
  updateMosaicSelection: (id: string, updates: Partial<MosaicSelection>) => void
  removeMosaicSelection: (id: string) => void
  clearMosaicSelections: () => void

  // 水印配置管理
  updateWatermarkConfig: (updates: Partial<WatermarkConfig>) => void

  // Video and Audio actions
  setActiveMediaType: (type: MediaType) => void
  addDanmaku: (danmaku: DanmakuInstance) => void
  removeDanmaku: (id: string) => void
  updateVideoState: (partial: Partial<VideoState>) => void
  updateAudioState: (partial: Partial<AudioState>) => void
}

const defaultValues: AppState = {
  file: null,
  paintByExampleFile: null,
  customMask: null,
  imageHeight: 0,
  imageWidth: 0,
  isInpainting: false,
  isPluginRunning: false,
  isAdjustingMask: false,
  disableShortCuts: false,

  windowSize: {
    height: 600,
    width: 800,
  },
  editorState: {
    baseBrushSize: DEFAULT_BRUSH_SIZE,
    brushSizeScale: 1,
    renders: [],
    extraMasks: [],
    prevExtraMasks: [],
    temporaryMasks: [],
    lineGroups: [],
    lastLineGroup: [],
    curLineGroup: [],
    redoRenders: [],
    redoCurLines: [],
    redoLineGroups: [],
  },

  interactiveSegState: {
    isInteractiveSeg: false,
    tmpInteractiveSegMask: null,
    clicks: [],
  },

  cropperState: {
    x: 0,
    y: 0,
    width: 512,
    height: 512,
  },
  extenderState: {
    x: 0,
    y: 0,
    width: 512,
    height: 512,
  },
  isCropperExtenderResizing: false,

  imageCropState: {
    rect: {
      x: 0,
      y: 0,
      width: 512,
      height: 512,
    },
    aspectRatio: "free",
    history: [],
    redoHistory: [],
    maxHistory: 5,
  },
  filterPresets: [],
  activeFilterPresetIds: [],
  previewFilterId: undefined,
  mosaicSelections: [],
  watermarkConfig: {
    text: "weMediaGo",
    color: "hsl(var(--foreground))",
    opacity: 0.8,
    position: "tiled",
    margin: 16,
    marginX: 20,
    marginY: 15,
    showBackground: false,
    backgroundColor: "hsl(var(--background))",
    backgroundOpacity: 0.6,
    tiled: true,
    tileSpacing: 100,
    tileAngle: 45,
    fontSize: 18,
    rotation: 45,
  },
  compressionSettings: {
    ratio: 0.6,
    preset: "balanced",
    originalSizeBytes: undefined,
    targetMaxBytes: undefined,
    compressedBlob: undefined,
    compressedSizeBytes: undefined,
    showCompressionDialog: false,
  },
  exportSettings: {
    quality: "default",
    showExportDialog: false,
    exportFileName: undefined,
    exportFormat: undefined,
    estimatedSizeBytes: undefined,
    exportDataUrl: undefined,
  },
  activeMediaType: "image" as MediaType,
  videoState: null,
  audioState: null,
  danmakus: [],

  fileManagerState: {
    sortBy: SortBy.CTIME,
    sortOrder: SortOrder.DESCENDING,
    layout: "masonry",
    searchText: "",
    inputDirectory: "",
    outputDirectory: "",
  },
  serverConfig: {
    plugins: [],
    modelInfos: [],
    removeBGModel: "briaai/RMBG-1.4",
    removeBGModels: [],
    realesrganModel: "realesr-general-x4v3",
    realesrganModels: [],
    interactiveSegModel: "vit_b",
    interactiveSegModels: [],
    enableFileManager: false,
    enableAutoSaving: false,
    enableControlnet: false,
    controlnetMethod: "lllyasviel/control_v11p_sd15_canny",
    disableModelSwitch: false,
    isDesktop: false,
    samplers: ["DPM++ 2M SDE Karras"],
  },
  settings: {
    model: {
      name: "lama",
      path: "lama",
      model_type: "inpaint",
      support_controlnet: false,
      support_brushnet: false,
      support_strength: false,
      support_outpainting: false,
      support_powerpaint_v2: false,
      controlnets: [],
      brushnets: [],
      support_lcm_lora: false,
      is_single_file_diffusers: false,
      need_prompt: false,
    },
    showCropper: false,
    showExtender: false,
    extenderDirection: ExtenderDirection.xy,
    brushMode: "erase",
    brushColor: "#000000",
    brushOpacity: 100,
    brushHardness: 50,
    showMosaic: false,
    showFilter: false,
    showWatermark: false,
    showWatermarkPanel: false,
    showColorAdjust: false,
    showCompress: false,
    showRotate: false,
    showCropPanel: false,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    colorTemperature: 0,
    mosaicShapeType: "rect",
    mosaicGrainSize: 10,
    mosaicIntensity: 50,
    enableDownloadMask: true,
    enableManualInpainting: true,
    enableUploadMask: false,
    enableAutoExtractPrompt: true,
    ldmSteps: 30,
    ldmSampler: LDMSampler.ddim,
    zitsWireframe: true,
    cv2Radius: 5,
    cv2Flag: CV2Flag.INPAINT_NS,
    prompt: "",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    seed: 42,
    seedFixed: false,
    sdMaskBlur: 12,
    sdStrength: 1.0,
    sdSteps: 50,
    sdGuidanceScale: 7.5,
    sdSampler: "DPM++ 2M",
    sdMatchHistograms: false,
    sdScale: 1.0,
    p2pImageGuidanceScale: 1.5,
    enableControlnet: false,
    controlnetMethod: "lllyasviel/control_v11p_sd15_canny",
    controlnetConditioningScale: 0.4,
    enableBrushNet: false,
    brushnetMethod: "random_mask",
    brushnetConditioningScale: 1.0,
    enableLCMLora: false,
    enablePowerPaintV2: false,
    powerpaintTask: PowerPaintTask.text_guided,
    adjustMaskKernelSize: 12,
    showDanmaku: false,
    showDanmakuPanel: false,
    showAudioVisual: false,
  },
}

export const useStore = createWithEqualityFn<AppState & AppAction>()(
  persist(
    immer((set, get) => ({
      ...defaultValues,

      showPrevMask: async () => {
        if (get().settings.showExtender) {
          return
        }
        const { lastLineGroup, curLineGroup, prevExtraMasks, extraMasks } =
          get().editorState
        if (curLineGroup.length !== 0 || extraMasks.length !== 0) {
          return
        }
        const { imageWidth, imageHeight } = get()

        const maskCanvas = generateMask(
          imageWidth,
          imageHeight,
          [lastLineGroup],
          prevExtraMasks,
          BRUSH_COLOR
        )
        try {
          const maskImage = await canvasToImage(maskCanvas)
          set((state) => {
            state.editorState.temporaryMasks.push(castDraft(maskImage))
          })
        } catch (e) {
          // Silently handle errors when showing previous mask
          // This can happen if the canvas is invalid or image conversion fails
          if (e instanceof Error) {
            console.error("Failed to show previous mask:", e.message)
          } else {
            console.error("Failed to show previous mask:", e)
          }
          return
        }
      },
      hidePrevMask: () => {
        set((state) => {
          state.editorState.temporaryMasks = []
        })
      },

      getCurrentTargetFile: async (): Promise<File> => {
        const file = get().file! // 一定是在 file 加载了以后才可能调用这个函数
        const renders = get().editorState.renders

        let targetFile = file
        if (renders.length > 0) {
          const lastRender = renders[renders.length - 1]
          targetFile = await srcToFile(
            lastRender.currentSrc,
            file.name,
            file.type
          )
        }
        return targetFile
      },

      runInpainting: async () => {
        const {
          isInpainting,
          file,
          paintByExampleFile,
          imageWidth,
          imageHeight,
          settings,
          cropperState,
          extenderState,
        } = get()
        if (isInpainting || file === null) {
          return
        }
        if (
          get().settings.model.support_outpainting &&
          settings.showExtender &&
          extenderState.x === 0 &&
          extenderState.y === 0 &&
          extenderState.height === imageHeight &&
          extenderState.width === imageWidth
        ) {
          return
        }

        const {
          lastLineGroup,
          curLineGroup,
          lineGroups,
          renders,
          prevExtraMasks,
          extraMasks,
        } = get().editorState

        const useLastLineGroup =
          curLineGroup.length === 0 &&
          extraMasks.length === 0 &&
          !settings.showExtender

        // useLastLineGroup 的影响
        // 1. 使用上一次的 mask
        // 2. 结果替换当前 render
        let maskImages: HTMLImageElement[] = []
        let maskLineGroup: LineGroup = []
        if (useLastLineGroup === true) {
          maskLineGroup = lastLineGroup
          maskImages = prevExtraMasks
        } else {
          maskLineGroup = curLineGroup
          maskImages = extraMasks
        }

        if (
          maskLineGroup.length === 0 &&
          maskImages === null &&
          !settings.showExtender
        ) {
          toast({
            variant: "destructive",
            description: "Please draw mask on picture",
          })
          return
        }

        const newLineGroups = [...lineGroups, maskLineGroup]

        set((state) => {
          state.isInpainting = true
        })

        let targetFile = file
        if (useLastLineGroup === true) {
          // renders.length == 1 还是用原来的
          if (renders.length > 1) {
            const lastRender = renders[renders.length - 2]
            targetFile = await srcToFile(
              lastRender.currentSrc,
              file.name,
              file.type
            )
          }
        } else if (renders.length > 0) {
          const lastRender = renders[renders.length - 1]
          targetFile = await srcToFile(
            lastRender.currentSrc,
            file.name,
            file.type
          )
        }

        const maskCanvas = generateMask(
          imageWidth,
          imageHeight,
          [maskLineGroup],
          maskImages,
          BRUSH_COLOR
        )
        if (useLastLineGroup) {
          const temporaryMask = await canvasToImage(maskCanvas)
          set((state) => {
            state.editorState.temporaryMasks = castDraft([temporaryMask])
          })
        }

        try {
          const res = await inpaint(
            targetFile,
            settings,
            cropperState,
            extenderState,
            dataURItoBlob(maskCanvas.toDataURL()),
            paintByExampleFile
          )

          const { blob, seed } = res
          if (seed) {
            get().setSeed(parseInt(seed, 10))
          }
          const newRender = new Image()
          await loadImage(newRender, blob)
          const newRenders = [...renders, newRender]
          get().setImageSize(newRender.width, newRender.height)
          get().updateEditorState({
            renders: newRenders,
            lineGroups: newLineGroups,
            lastLineGroup: maskLineGroup,
            curLineGroup: [],
            extraMasks: [],
            prevExtraMasks: maskImages,
          })
        } catch (e: any) {
          toast({
            variant: "destructive",
            description: e.message ? e.message : e.toString(),
          })
        }

        get().resetRedoState()
        set((state) => {
          state.isInpainting = false
          state.editorState.temporaryMasks = []
        })
      },

      runRenderablePlugin: async (
        genMask: boolean,
        pluginName: string,
        params: PluginParams = { upscale: 1 }
      ) => {
        const { renders, lineGroups } = get().editorState
        set((state) => {
          state.isPluginRunning = true
        })

        try {
          const start = new Date()
          const targetFile = await get().getCurrentTargetFile()
          const res = await runPlugin(
            genMask,
            pluginName,
            targetFile,
            params.upscale
          )
          const { blob } = res

          if (!genMask) {
            const newRender = new Image()
            await loadImage(newRender, blob)
            get().setImageSize(newRender.width, newRender.height)
            const newRenders = [...renders, newRender]
            const newLineGroups = [...lineGroups, []]
            get().updateEditorState({
              renders: newRenders,
              lineGroups: newLineGroups,
            })
          } else {
            const newMask = new Image()
            await loadImage(newMask, blob)
            set((state) => {
              state.editorState.extraMasks.push(castDraft(newMask))
            })
          }
          const end = new Date()
          const time = end.getTime() - start.getTime()
          toast({
            description: `Run ${pluginName} successfully in ${time / 1000}s`,
          })
        } catch (e: any) {
          toast({
            variant: "destructive",
            description: e.message ? e.message : e.toString(),
          })
        }
        set((state) => {
          state.isPluginRunning = false
        })
      },

      // Edirot State //
      updateEditorState: (newState: Partial<EditorState>) => {
        set((state) => {
          state.editorState = castDraft({ ...state.editorState, ...newState })
        })
      },

      cleanCurLineGroup: () => {
        get().updateEditorState({ curLineGroup: [] })
      },

      handleCanvasMouseDown: (point: Point) => {
        let lineGroup: LineGroup = []
        const state = get()
        if (state.runMannually()) {
          lineGroup = [...state.editorState.curLineGroup]
        }
        lineGroup.push({ size: state.getBrushSize(), pts: [point] })
        set((state) => {
          state.editorState.curLineGroup = lineGroup
        })
      },

      handleCanvasMouseMove: (point: Point) => {
        set((state) => {
          const curLineGroup = state.editorState.curLineGroup
          if (curLineGroup.length) {
            curLineGroup[curLineGroup.length - 1].pts.push(point)
          }
        })
      },

      runMannually: (): boolean => {
        const state = get()
        return (
          state.settings.enableManualInpainting ||
          state.settings.model.model_type !== MODEL_TYPE_INPAINT
        )
      },

      getIsProcessing: (): boolean => {
        return (
          get().isInpainting || get().isPluginRunning || get().isAdjustingMask
        )
      },

      isSD: (): boolean => {
        return get().settings.model.model_type !== MODEL_TYPE_INPAINT
      },

      // undo/redo

      undoDisabled: (): boolean => {
        const editorState = get().editorState
        if (editorState.renders.length > 0) {
          return false
        }
        if (get().runMannually()) {
          if (editorState.curLineGroup.length === 0) {
            return true
          }
        } else if (editorState.renders.length === 0) {
          return true
        }
        return false
      },

      undo: () => {
        if (
          get().runMannually() &&
          get().editorState.curLineGroup.length !== 0
        ) {
          // undoStroke
          set((state) => {
            const editorState = state.editorState
            if (editorState.curLineGroup.length === 0) {
              return
            }
            editorState.lastLineGroup = []
            const lastLine = editorState.curLineGroup.pop()!
            editorState.redoCurLines.push(lastLine)
          })
        } else {
          set((state) => {
            const editorState = state.editorState
            if (
              editorState.renders.length === 0 ||
              editorState.lineGroups.length === 0
            ) {
              return
            }
            const lastLineGroup = editorState.lineGroups.pop()!
            editorState.redoLineGroups.push(lastLineGroup)
            editorState.redoCurLines = []
            editorState.curLineGroup = []

            const lastRender = editorState.renders.pop()!
            editorState.redoRenders.push(lastRender)
          })
        }
      },

      redoDisabled: (): boolean => {
        const editorState = get().editorState
        if (editorState.redoRenders.length > 0) {
          return false
        }
        if (get().runMannually()) {
          if (editorState.redoCurLines.length === 0) {
            return true
          }
        } else if (editorState.redoRenders.length === 0) {
          return true
        }
        return false
      },

      redo: () => {
        if (
          get().runMannually() &&
          get().editorState.redoCurLines.length !== 0
        ) {
          set((state) => {
            const editorState = state.editorState
            if (editorState.redoCurLines.length === 0) {
              return
            }
            const line = editorState.redoCurLines.pop()!
            editorState.curLineGroup.push(line)
          })
        } else {
          set((state) => {
            const editorState = state.editorState
            if (
              editorState.redoRenders.length === 0 ||
              editorState.redoLineGroups.length === 0
            ) {
              return
            }
            const lastLineGroup = editorState.redoLineGroups.pop()!
            editorState.lineGroups.push(lastLineGroup)
            editorState.curLineGroup = []

            const lastRender = editorState.redoRenders.pop()!
            editorState.renders.push(lastRender)
          })
        }
      },

      resetRedoState: () => {
        set((state) => {
          state.editorState.redoCurLines = []
          state.editorState.redoLineGroups = []
          state.editorState.redoRenders = []
        })
      },

      //****//

      updateAppState: (newState: Partial<AppState>) => {
        set(() => newState)
      },

      getBrushSize: (): number => {
        return (
          get().editorState.baseBrushSize * get().editorState.brushSizeScale
        )
      },

      showPromptInput: (): boolean => {
        const model = get().settings.model
        return (
          model.model_type !== MODEL_TYPE_INPAINT &&
          model.name !== PAINT_BY_EXAMPLE
        )
      },

      setServerConfig: (newValue: ServerConfig) => {
        set((state) => {
          state.serverConfig = newValue
          state.settings.enableControlnet = newValue.enableControlnet
          state.settings.controlnetMethod = newValue.controlnetMethod
        })
      },

      updateSettings: (newSettings: Partial<Settings>) => {
        set((state) => {
          state.settings = {
            ...state.settings,
            ...newSettings,
          }
        })
      },

      updateEnablePowerPaintV2: (newValue: boolean) => {
        get().updateSettings({ enablePowerPaintV2: newValue })
        if (newValue) {
          get().updateSettings({
            enableBrushNet: false,
            enableControlnet: false,
            enableLCMLora: false,
          })
        }
      },

      updateEnableBrushNet: (newValue: boolean) => {
        get().updateSettings({ enableBrushNet: newValue })
        if (newValue) {
          get().updateSettings({
            enablePowerPaintV2: false,
            enableControlnet: false,
            enableLCMLora: false,
          })
        }
      },

      updateEnableControlnet(newValue) {
        get().updateSettings({ enableControlnet: newValue })
        if (newValue) {
          get().updateSettings({
            enablePowerPaintV2: false,
            enableBrushNet: false,
          })
        }
      },

      updateLCMLora(newValue) {
        get().updateSettings({ enableLCMLora: newValue })
        if (newValue) {
          get().updateSettings({
            enablePowerPaintV2: false,
            enableBrushNet: false,
          })
        }
      },

      setModel: (newModel: ModelInfo) => {
        set((state) => {
          state.settings.model = newModel

          if (
            newModel.support_controlnet &&
            !newModel.controlnets.includes(state.settings.controlnetMethod)
          ) {
            state.settings.controlnetMethod = newModel.controlnets[0]
          }
        })
      },

      updateFileManagerState: (newState: Partial<FileManagerState>) => {
        set((state) => {
          state.fileManagerState = {
            ...state.fileManagerState,
            ...newState,
          }
        })
      },

      updateInteractiveSegState: (newState: Partial<InteractiveSegState>) => {
        set((state) => {
          return {
            ...state,
            interactiveSegState: {
              ...state.interactiveSegState,
              ...newState,
            },
          }
        })
      },

      resetInteractiveSegState: () => {
        get().updateInteractiveSegState(defaultValues.interactiveSegState)
      },

      handleInteractiveSegAccept: () => {
        set((state) => {
          if (state.interactiveSegState.tmpInteractiveSegMask) {
            state.editorState.extraMasks.push(
              castDraft(state.interactiveSegState.tmpInteractiveSegMask)
            )
          }
          state.interactiveSegState = castDraft({
            ...defaultValues.interactiveSegState,
          })
        })
      },

      handleFileManagerMaskSelect: async (blob: Blob) => {
        const newMask = new Image()

        await loadImage(newMask, URL.createObjectURL(blob))
        set((state) => {
          state.editorState.extraMasks.push(castDraft(newMask))
        })
        get().runInpainting()
      },

      setIsInpainting: (newValue: boolean) =>
        set((state) => {
          state.isInpainting = newValue
        }),

      setFile: async (file: File) => {
        // 只在图片模式下且启用自动提取提示时才调用 getGenInfo
        if (get().settings.enableAutoExtractPrompt && file.type.startsWith("image/")) {
          try {
            const res = await getGenInfo(file)
            if (res.prompt) {
              set((state) => {
                state.settings.prompt = res.prompt
              })
            }
            if (res.negative_prompt) {
              set((state) => {
                state.settings.negativePrompt = res.negative_prompt
              })
            }
          } catch (e: any) {
            // 静默失败，不显示错误提示（可能是非图片文件）
            console.warn("Failed to get gen info:", e)
          }
        }
        set((state) => {
          state.file = file
          state.interactiveSegState = castDraft(
            defaultValues.interactiveSegState
          )
          state.editorState = castDraft(defaultValues.editorState)
          state.cropperState = defaultValues.cropperState
        })
      },

      setCustomFile: (file: File) =>
        set((state) => {
          state.customMask = file
        }),

      setBaseBrushSize: (newValue: number) =>
        set((state) => {
          state.editorState.baseBrushSize = newValue
        }),

      decreaseBaseBrushSize: () => {
        const baseBrushSize = get().editorState.baseBrushSize
        let newBrushSize = baseBrushSize
        if (baseBrushSize > 10) {
          newBrushSize = baseBrushSize - 10
        }
        if (baseBrushSize <= 10 && baseBrushSize > 0) {
          newBrushSize = baseBrushSize - 3
        }
        get().setBaseBrushSize(newBrushSize)
      },

      increaseBaseBrushSize: () => {
        const baseBrushSize = get().editorState.baseBrushSize
        const newBrushSize = Math.min(baseBrushSize + 10, MAX_BRUSH_SIZE)
        get().setBaseBrushSize(newBrushSize)
      },

      setImageSize: (width: number, height: number) => {
        // 根据图片尺寸调整 brushSize 的 scale
        set((state) => {
          state.imageWidth = width
          state.imageHeight = height
          state.editorState.brushSizeScale =
            Math.max(Math.min(width, height), 512) / 512
        })
        get().resetExtender(width, height)
      },

      applyCropPreset: (preset: CropAspectPreset) => {
        set((state) => {
          const { imageWidth, imageHeight } = state
          if (!imageWidth || !imageHeight) {
            return
          }

          // 先把当前裁剪状态记录进历史
          const prevRect = state.imageCropState.rect
          const prevAspect = state.imageCropState.aspectRatio
          if (prevRect.width > 0 && prevRect.height > 0) {
            const historyEntry = {
              rect: { ...prevRect },
              aspectRatio: prevAspect,
              createdAt: Date.now(),
            }
            const nextHistory = [
              historyEntry,
              ...state.imageCropState.history,
            ].slice(0, state.imageCropState.maxHistory)
            state.imageCropState.history = nextHistory
          }

          // 计算新的裁剪框
          let rect = {
            x: 0,
            y: 0,
            width: imageWidth,
            height: imageHeight,
          }
          if (preset !== "free") {
            const ratio = parseAspectRatio(preset)
            if (ratio) {
              rect = computeCenteredCropRect(
                { width: imageWidth, height: imageHeight },
                ratio
              )
            }
          }

          // 更新全局裁剪状态与旧的 cropperState，保持与现有 Cropper 兼容
          state.imageCropState.rect = rect
          state.imageCropState.aspectRatio = preset
          state.cropperState.x = rect.x
          state.cropperState.y = rect.y
          state.cropperState.width = rect.width
          state.cropperState.height = rect.height
        })
      },

      setCropperX: (newValue: number) =>
        set((state) => {
          state.cropperState.x = newValue
        }),

      setCropperY: (newValue: number) =>
        set((state) => {
          state.cropperState.y = newValue
        }),

      setCropperWidth: (newValue: number) =>
        set((state) => {
          state.cropperState.width = newValue
        }),

      setCropperHeight: (newValue: number) =>
        set((state) => {
          state.cropperState.height = newValue
        }),

      setExtenderX: (newValue: number) =>
        set((state) => {
          state.extenderState.x = newValue
        }),

      setExtenderY: (newValue: number) =>
        set((state) => {
          state.extenderState.y = newValue
        }),

      setExtenderWidth: (newValue: number) =>
        set((state) => {
          state.extenderState.width = newValue
        }),

      setExtenderHeight: (newValue: number) =>
        set((state) => {
          state.extenderState.height = newValue
        }),

      setIsCropperExtenderResizing: (newValue: boolean) =>
        set((state) => {
          state.isCropperExtenderResizing = newValue
        }),

      updateExtenderDirection: (newValue: ExtenderDirection) => {
        console.log(
          `updateExtenderDirection: ${JSON.stringify(get().extenderState)}`
        )
        set((state) => {
          state.settings.extenderDirection = newValue
          state.extenderState.x = 0
          state.extenderState.y = 0
          state.extenderState.width = state.imageWidth
          state.extenderState.height = state.imageHeight
        })
        get().updateExtenderByBuiltIn(newValue, 1.5)
      },

      updateExtenderByBuiltIn: (
        direction: ExtenderDirection,
        scale: number
      ) => {
        const newExtenderState = { ...defaultValues.extenderState }
        let { x, y, width, height } = newExtenderState
        const { imageWidth, imageHeight } = get()
        width = imageWidth
        height = imageHeight

        switch (direction) {
          case ExtenderDirection.x:
            x = -Math.ceil((imageWidth * (scale - 1)) / 2)
            width = Math.ceil(imageWidth * scale)
            break
          case ExtenderDirection.y:
            y = -Math.ceil((imageHeight * (scale - 1)) / 2)
            height = Math.ceil(imageHeight * scale)
            break
          case ExtenderDirection.xy:
            x = -Math.ceil((imageWidth * (scale - 1)) / 2)
            y = -Math.ceil((imageHeight * (scale - 1)) / 2)
            width = Math.ceil(imageWidth * scale)
            height = Math.ceil(imageHeight * scale)
            break
          default:
            break
        }

        set((state) => {
          state.extenderState.x = x
          state.extenderState.y = y
          state.extenderState.width = width
          state.extenderState.height = height
        })
      },

      resetExtender: (width: number, height: number) => {
        set((state) => {
          state.extenderState.x = 0
          state.extenderState.y = 0
          state.extenderState.width = width
          state.extenderState.height = height
        })
      },

      setSeed: (newValue: number) =>
        set((state) => {
          state.settings.seed = newValue
        }),

      adjustMask: async (operate: AdjustMaskOperate) => {
        const { imageWidth, imageHeight } = get()
        const { curLineGroup, extraMasks } = get().editorState
        const { adjustMaskKernelSize } = get().settings
        if (curLineGroup.length === 0 && extraMasks.length === 0) {
          return
        }

        set((state) => {
          state.isAdjustingMask = true
        })

        const maskCanvas = generateMask(
          imageWidth,
          imageHeight,
          [curLineGroup],
          extraMasks,
          BRUSH_COLOR
        )
        const maskBlob = dataURItoBlob(maskCanvas.toDataURL())
        const newMaskBlob = await postAdjustMask(
          maskBlob,
          operate,
          adjustMaskKernelSize
        )
        const newMask = await blobToImage(newMaskBlob)

        // TODO: currently ignore stroke undo/redo
        set((state) => {
          state.editorState.extraMasks = [castDraft(newMask)]
          state.editorState.curLineGroup = []
        })

        set((state) => {
          state.isAdjustingMask = false
        })
      },
      clearMask: () => {
        set((state) => {
          state.editorState.extraMasks = []
          state.editorState.curLineGroup = []
        })
      },

      // 图像变换操作
      applyRotation: async (angle: number) => {
        const state = get()
        const { renders, lineGroups } = state.editorState
        const original = state.file

        if (!original) return

        try {
          // 获取当前图像
          let sourceImage: HTMLImageElement
          if (renders.length > 0) {
            sourceImage = renders[renders.length - 1]
          } else {
            const img = new Image()
            await loadImage(img, URL.createObjectURL(original))
            sourceImage = img
          }

          // 应用旋转
          const rotatedCanvas = rotateImage(sourceImage, angle)
          const newRender = await canvasToImage(rotatedCanvas)

          // 更新状态
          const newRenders = [...renders, newRender]
          const newLineGroups = [...lineGroups, []]

          get().setImageSize(newRender.width, newRender.height)
          get().updateEditorState({
            renders: newRenders,
            lineGroups: newLineGroups,
          })
          get().resetRedoState()
        } catch (error: any) {
          toast({
            variant: "destructive",
            description: `旋转失败: ${error?.message || error}`,
          })
        }
      },

      applyFlip: async (horizontal: boolean, vertical: boolean) => {
        const state = get()
        const { renders, lineGroups } = state.editorState
        const original = state.file

        if (!original) return

        try {
          // 获取当前图像
          let sourceImage: HTMLImageElement
          if (renders.length > 0) {
            sourceImage = renders[renders.length - 1]
          } else {
            const img = new Image()
            await loadImage(img, URL.createObjectURL(original))
            sourceImage = img
          }

          // 应用翻转
          const flippedCanvas = flipImage(sourceImage, horizontal, vertical)
          const newRender = await canvasToImage(flippedCanvas)

          // 更新状态
          const newRenders = [...renders, newRender]
          const newLineGroups = [...lineGroups, []]

          get().setImageSize(newRender.width, newRender.height)
          get().updateEditorState({
            renders: newRenders,
            lineGroups: newLineGroups,
          })
          get().resetRedoState()
        } catch (error: any) {
          toast({
            variant: "destructive",
            description: `翻转失败: ${error?.message || error}`,
          })
        }
      },

      applyCrop: async () => {
        const state = get()
        const { renders, lineGroups } = state.editorState
        const { cropperState, imageCropState } = state
        const original = state.file

        if (!original) return

        try {
          // 获取当前图像
          let sourceImage: HTMLImageElement
          if (renders.length > 0) {
            sourceImage = renders[renders.length - 1]
          } else {
            const img = new Image()
            await loadImage(img, URL.createObjectURL(original))
            sourceImage = img
          }

          // 应用裁剪
          const cropRect = {
            x: cropperState.x,
            y: cropperState.y,
            width: cropperState.width,
            height: cropperState.height,
          }
          const croppedCanvas = cropImage(sourceImage, cropRect)
          const newRender = await canvasToImage(croppedCanvas)

          // 记录裁剪历史
          const historyEntry = {
            rect: { ...imageCropState.rect },
            aspectRatio: imageCropState.aspectRatio,
            createdAt: Date.now(),
          }

          // 更新状态
          const newRenders = [...renders, newRender]
          const newLineGroups = [...lineGroups, []]

          set((state) => {
            state.imageCropState.history = [
              historyEntry,
              ...state.imageCropState.history,
            ].slice(0, state.imageCropState.maxHistory)
            state.imageCropState.rect = cropRect
            state.imageCropState.redoHistory = []
          })

          get().setImageSize(newRender.width, newRender.height)
          get().updateEditorState({
            renders: newRenders,
            lineGroups: newLineGroups,
          })
          get().resetRedoState()
        } catch (error: any) {
          toast({
            variant: "destructive",
            description: `裁剪失败: ${error?.message || error}`,
          })
        }
      },

      undoCrop: () => {
        const { imageCropState } = get()
        if (imageCropState.history.length === 0) return

        const currentState = {
          rect: { ...imageCropState.rect },
          aspectRatio: imageCropState.aspectRatio,
          createdAt: Date.now(),
        }

        const prevState = imageCropState.history[0]

        set((state) => {
          state.imageCropState.rect = prevState.rect
          state.imageCropState.aspectRatio = prevState.aspectRatio
          state.imageCropState.history = imageCropState.history.slice(1)
          state.imageCropState.redoHistory = [
            currentState,
            ...(state.imageCropState.redoHistory || []),
          ]
          // 同步到 cropperState
          state.cropperState.x = prevState.rect.x
          state.cropperState.y = prevState.rect.y
          state.cropperState.width = prevState.rect.width
          state.cropperState.height = prevState.rect.height
        })
      },

      redoCrop: () => {
        const { imageCropState } = get()
        const redoHistory = imageCropState.redoHistory || []
        if (redoHistory.length === 0) return

        const currentState = {
          rect: { ...imageCropState.rect },
          aspectRatio: imageCropState.aspectRatio,
          createdAt: Date.now(),
        }

        const nextState = redoHistory[0]

        set((state) => {
          state.imageCropState.rect = nextState.rect
          state.imageCropState.aspectRatio = nextState.aspectRatio
          state.imageCropState.history = [currentState, ...imageCropState.history]
          state.imageCropState.redoHistory = redoHistory.slice(1)
          // 同步到 cropperState
          state.cropperState.x = nextState.rect.x
          state.cropperState.y = nextState.rect.y
          state.cropperState.width = nextState.rect.width
          state.cropperState.height = nextState.rect.height
        })
      },

      canUndoCrop: () => {
        return get().imageCropState.history.length > 0
      },

      canRedoCrop: () => {
        return (get().imageCropState.redoHistory?.length || 0) > 0
      },

      // 马赛克选区管理
      addMosaicSelection: (selection: MosaicSelection) => {
        set((state) => {
          state.mosaicSelections.push(castDraft(selection))
        })
      },

      updateMosaicSelection: (id: string, updates: Partial<MosaicSelection>) => {
        set((state) => {
          const index = state.mosaicSelections.findIndex((s) => s.id === id)
          if (index !== -1) {
            state.mosaicSelections[index] = castDraft({
              ...state.mosaicSelections[index],
              ...updates,
            })
          }
        })
      },

      removeMosaicSelection: (id: string) => {
        set((state) => {
          state.mosaicSelections = state.mosaicSelections.filter(
            (s) => s.id !== id
          )
        })
      },

      clearMosaicSelections: () => {
        set((state) => {
          state.mosaicSelections = []
        })
      },

      // 水印配置管理
      updateWatermarkConfig: (updates: Partial<WatermarkConfig>) => {
        set((state) => {
          state.watermarkConfig = castDraft({
            ...state.watermarkConfig,
            ...updates,
          })
        })
      },

      // Video and Audio actions
      setActiveMediaType: (type: MediaType) => {
        set((state) => {
          state.activeMediaType = type
        })
      },

      addDanmaku: (danmaku: DanmakuInstance) => {
        set((state) => {
          state.danmakus.push(castDraft(danmaku))
        })
      },

      removeDanmaku: (id: string) => {
        set((state) => {
          state.danmakus = state.danmakus.filter((d) => d.id !== id)
        })
      },

      updateVideoState: (partial: Partial<VideoState>) => {
        set((state) => {
          if (state.videoState) {
            state.videoState = castDraft({
              ...state.videoState,
              ...partial,
            })
          } else {
            state.videoState = castDraft({
              file: null,
              duration: 0,
              currentTime: 0,
              isPlaying: false,
              volume: 1,
              danmakus: [],
              ...partial,
            })
          }
        })
      },

      updateAudioState: (partial: Partial<AudioState>) => {
        set((state) => {
          if (state.audioState) {
            state.audioState = castDraft({
              ...state.audioState,
              ...partial,
            })
          } else {
            state.audioState = castDraft({
              file: null,
              duration: 0,
              currentTime: 0,
              isPlaying: false,
              volume: 1,
              audioBuffer: null,
              visualizationType: "spectrum",
              audioInfo: null,
              ...partial,
            })
          }
        })
      },
    })),
    {
      name: "ZUSTAND_STATE", // name of the item in the storage (must be unique)
      version: 2,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) =>
            ["fileManagerState", "settings"].includes(key)
          )
        ),
    }
  ),
  shallow
)
