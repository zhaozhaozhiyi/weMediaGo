import { useEffect, useState, useRef } from "react"
import Editor from "./Editor"
import VideoEditor from "./VideoPlayer/VideoEditor"
import AudioEditor from "./AudioPlayer/AudioEditor"
import FileSelect from "./FileSelect"
import { currentModel } from "@/lib/api"
import { useStore } from "@/lib/states"
import { getMediaType } from "@/lib/utils"
import ImageSize from "./ImageSize"
import Plugins from "./Plugins"
import { InteractiveSeg } from "./InteractiveSeg"
import SidePanel from "./SidePanel"
import DiffusionProgress from "./DiffusionProgress"
import MainToolbar from "./MainToolbar"
import CompressionDialog from "./CompressionDialog"

const Workspace = () => {
  const [file, activeMediaType, updateSettings, setFile, setActiveMediaType] = useStore((state) => [
    state.file,
    state.activeMediaType,
    state.updateSettings,
    state.setFile,
    state.setActiveMediaType,
  ])
  const [defaultVideoFile, setDefaultVideoFile] = useState<File | null>(null)
  const [defaultAudioFile, setDefaultAudioFile] = useState<File | null>(null)
  const initializedImageModeRef = useRef(false)

  // 加载默认媒体文件
  useEffect(() => {
    const loadDefaultFiles = async () => {
      // 加载默认视频 - 使用 Vite 的静态资源导入
      try {
        const videoUrl = new URL("../assets/video.mp4", import.meta.url).href
        const videoResponse = await fetch(videoUrl)
        if (videoResponse.ok) {
          const videoBlob = await videoResponse.blob()
          const videoFile = new File([videoBlob], "video.mp4", { type: "video/mp4" })
          setDefaultVideoFile(videoFile)
        }
      } catch (error) {
        console.error("Failed to load default video:", error)
      }

      // 加载默认音频 - 使用 Vite 的静态资源导入
      try {
        const audioUrl = new URL("../assets/demo.mp3", import.meta.url).href
        const audioResponse = await fetch(audioUrl)
        if (audioResponse.ok) {
          const audioBlob = await audioResponse.blob()
          const audioFile = new File([audioBlob], "demo.mp3", { type: "audio/mpeg" })
          setDefaultAudioFile(audioFile)
        }
      } catch (error) {
        console.error("Failed to load default audio:", error)
      }
    }

    loadDefaultFiles()
  }, [])

  // 当切换到视频/音频 Tab 且没有对应文件时，自动加载默认文件
  useEffect(() => {
    const fileMediaType = file ? getMediaType(file) : null
    
    if (activeMediaType === "video") {
      // 如果没有文件或文件类型不匹配，使用默认视频
      if ((!file || fileMediaType !== "video") && defaultVideoFile) {
        setFile(defaultVideoFile)
      }
    } else if (activeMediaType === "audio") {
      // 如果没有文件或文件类型不匹配，使用默认音频
      if ((!file || fileMediaType !== "audio") && defaultAudioFile) {
        setFile(defaultAudioFile)
      }
    }
  }, [activeMediaType, file, defaultVideoFile, defaultAudioFile, setFile])

  useEffect(() => {
    // 只在图片模式下获取模型信息
    if (activeMediaType === "image") {
      const fetchCurrentModel = async () => {
        const model = await currentModel()
        updateSettings({ model })
      }
      fetchCurrentModel()
      
      // 只在首次进入图片模式时初始化工具状态，避免无限循环
      if (!initializedImageModeRef.current) {
        initializedImageModeRef.current = true
        // 获取当前状态，确保所有工具都关闭（默认显示画笔）
        const currentState = useStore.getState()
        const hasAnyToolActive = 
          currentState.settings.showCropPanel ||
          currentState.settings.showRotate ||
          currentState.settings.showMosaic ||
          currentState.settings.showFilter ||
          currentState.settings.showWatermarkPanel ||
          currentState.settings.showColorAdjust ||
          currentState.settings.showCompress
        
        // 如果没有任何工具激活，确保所有工具都关闭（默认显示画笔）
        if (!hasAnyToolActive) {
          updateSettings({
            showCropPanel: false,
            showCropper: false,
            showRotate: false,
            showMosaic: false,
            showFilter: false,
            showWatermarkPanel: false,
            showWatermark: false,
            showColorAdjust: false,
            showCompress: false,
          })
        }
      }
    } else {
      // 切换到其他模式时重置标志
      initializedImageModeRef.current = false
    }
  }, [activeMediaType, updateSettings])

  // 检查当前文件类型是否匹配 activeMediaType
  const fileMediaType = file ? getMediaType(file) : null
  const hasMatchingFile = file && fileMediaType === activeMediaType

  // 如果没有匹配的文件，显示上传引导
  if (!hasMatchingFile) {
    return (
      <>
        <SidePanel />
        <FileSelect
          onSelection={async (f) => {
            setFile(f)
            // 根据文件类型自动切换 Tab
            const mediaType = getMediaType(f)
            setActiveMediaType(mediaType)
          }}
          mediaType={activeMediaType}
        />
      </>
    )
  }

  // 根据媒体类型渲染不同编辑器
  switch (activeMediaType) {
    case "image":
      return (
        <>
          <MainToolbar />
          <div className="flex gap-3 absolute top-[68px] left-[24px] items-center">
            <Plugins />
            <ImageSize />
          </div>
          <InteractiveSeg />
          <DiffusionProgress />
          <SidePanel />
          <CompressionDialog />
          <Editor file={file} />
        </>
      )
    case "video":
      return (
        <>
          <SidePanel />
          <VideoEditor file={file} />
        </>
      )
    case "audio":
      return (
        <>
          <SidePanel />
          <AudioEditor file={file} />
        </>
      )
    default:
      return null
  }
}

export default Workspace
