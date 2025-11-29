import { useState } from "react"
import useResolution from "@/hooks/useResolution"
import { Image, Video, Music } from "lucide-react"
import type { MediaType } from "@/lib/types"

type FileSelectProps = {
  onSelection: (file: File) => void
  mediaType?: MediaType
}

export default function FileSelect(props: FileSelectProps) {
  const { onSelection, mediaType = "image" } = props

  const [uploadElemId] = useState(`file-upload-${Math.random().toString()}`)

  const resolution = useResolution()

  function onFileSelected(file: File) {
    if (!file) {
      return
    }
    // 根据 mediaType 过滤文件类型
    let isMedia = false
    if (mediaType === "image") {
      isMedia = file.type.startsWith("image/")
    } else if (mediaType === "video") {
      isMedia = file.type.startsWith("video/")
    } else if (mediaType === "audio") {
      isMedia = file.type.startsWith("audio/")
    } else {
      // 默认支持所有媒体类型
      isMedia = file.type.match("(image|video|audio).*") !== null
    }

    if (!isMedia) {
      alert(`请选择${mediaType === "image" ? "图片" : mediaType === "video" ? "视频" : "音频"}文件`)
      return
    }

    try {
      // Check if file is larger than 20mb (for images) or 100mb (for video/audio)
      const maxSize = file.type.startsWith("image/") ? 20 * 1024 * 1024 : 100 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error("文件过大")
      }
      onSelection(file)
    } catch (e) {
      // eslint-disable-next-line
      alert(`错误：${(e as any).message}`)
    }
  }

  const getAcceptType = () => {
    switch (mediaType) {
      case "image":
        return "image/*"
      case "video":
        return "video/*"
      case "audio":
        return "audio/*"
      default:
        return "image/*,video/*,audio/*"
    }
  }

  const getMediaTypeLabel = () => {
    switch (mediaType) {
      case "image":
        return "图片"
      case "video":
        return "视频"
      case "audio":
        return "音频"
      default:
        return "媒体"
    }
  }

  const getMediaIcon = () => {
    switch (mediaType) {
      case "image":
        return <Image className="w-12 h-12" />
      case "video":
        return <Video className="w-12 h-12" />
      case "audio":
        return <Music className="w-12 h-12" />
      default:
        return <Image className="w-12 h-12" />
    }
  }

  return (
    <div className="absolute flex w-screen h-screen justify-center items-center pointer-events-none">
      <label
        htmlFor={uploadElemId}
        className="grid bg-background border-[2px] border-dashed rounded-lg min-w-[600px] hover:bg-yellow-400/30 hover:border-primary pointer-events-auto"
      >
        <div
          className="grid p-16 w-full h-full"
          onDragOver={(ev) => {
            ev.stopPropagation()
            ev.preventDefault()
          }}
        >
          <input
            className="hidden"
            id={uploadElemId}
            name={uploadElemId}
            type="file"
            onChange={(ev) => {
              const file = ev.currentTarget.files?.[0]
              if (file) {
                onFileSelected(file)
              }
            }}
            accept={getAcceptType()}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="text-muted-foreground">
              {getMediaIcon()}
            </div>
            <p className="text-center text-lg">
              {resolution === "desktop"
                ? `点击此处或拖拽${getMediaTypeLabel()}文件`
                : `点此选择${getMediaTypeLabel()}文件`}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              支持 {mediaType === "image" ? "JPG、PNG、WebP 等图片格式" : 
                     mediaType === "video" ? "MP4、WebM 等视频格式" : 
                     "MP3、WAV 等音频格式"}
            </p>
          </div>
        </div>
      </label>
    </div>
  )
}
