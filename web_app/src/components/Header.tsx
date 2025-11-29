import { PlayIcon } from "@radix-ui/react-icons"
import { useState, useEffect } from "react"
import { IconButton, ImageUploadButton } from "@/components/ui/button"
import Shortcuts from "@/components/Shortcuts"
import { useImage } from "@/hooks/useImage"

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import PromptInput from "./PromptInput"
import { RotateCw, Image, Upload, Video, Music, BookOpen } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import FileManager, { MASK_TAB } from "./FileManager"
import { getMediaBlob, getMediaFile } from "@/lib/api"
import { useStore } from "@/lib/states"
import SettingsDialog from "./Settings"
import { cn, fileToImage, getMediaType } from "@/lib/utils"
import { useToast } from "./ui/use-toast"
import ThemeToggle from "./ThemeToggle"
import type { MediaType } from "@/lib/types"

const Header = () => {
  const [
    file,
    customMask,
    isInpainting,
    serverConfig,
    runMannually,
    enableUploadMask,
    model,
    setFile,
    setCustomFile,
    runInpainting,
    showPrevMask,
    hidePrevMask,
    imageHeight,
    imageWidth,
    handleFileManagerMaskSelect,
    activeMediaType,
    setActiveMediaType,
  ] = useStore((state) => [
    state.file,
    state.customMask,
    state.isInpainting,
    state.serverConfig,
    state.runMannually(),
    state.settings.enableUploadMask,
    state.settings.model,
    state.setFile,
    state.setCustomFile,
    state.runInpainting,
    state.showPrevMask,
    state.hidePrevMask,
    state.imageHeight,
    state.imageWidth,
    state.handleFileManagerMaskSelect,
    state.activeMediaType,
    state.setActiveMediaType,
  ])

  const { toast } = useToast()
  const [maskImage, maskImageLoaded] = useImage(customMask)
  const [openMaskPopover, setOpenMaskPopover] = useState(false)

  // 根据文件类型自动切换 Tab
  useEffect(() => {
    if (file) {
      const mediaType = getMediaType(file)
      setActiveMediaType(mediaType)
    }
  }, [file, setActiveMediaType])

  const handleRerunLastMask = () => {
    runInpainting()
  }

  const onRerunMouseEnter = () => {
    showPrevMask()
  }

  const onRerunMouseLeave = () => {
    hidePrevMask()
  }

  const handleOnPhotoClick = async (tab: string, filename: string) => {
    try {
      if (tab === MASK_TAB) {
        const maskBlob = await getMediaBlob(tab, filename)
        handleFileManagerMaskSelect(maskBlob)
      } else {
        const newFile = await getMediaFile(tab, filename)
        setFile(newFile)
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        description: e.message ? e.message : e.toString(),
      })
      return
    }
  }

  return (
    <header className="h-[60px] px-6 py-4 absolute top-[0] flex justify-between items-center w-full z-20 border-b backdrop-filter backdrop-blur-md bg-background/70">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="WeMediaGo Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-semibold text-foreground">WeMediaGo</span>
        </div>
        <div className="h-6 w-px bg-border" />
        <Tabs
          value={activeMediaType}
          onValueChange={(value) => setActiveMediaType(value as MediaType)}
          className="flex-shrink-0"
        >
          <TabsList className="grid w-[240px] grid-cols-3">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              图片
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              视频
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              音频
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-1">
          {serverConfig.enableFileManager ? (
            <FileManager photoWidth={512} onPhotoClick={handleOnPhotoClick} />
          ) : (
            <></>
          )}

        <ImageUploadButton
          disabled={isInpainting}
          tooltip="上传媒体文件"
          accept="image/*,video/*,audio/*"
          onFileUpload={(file) => {
            // 验证文件类型
            const isMedia = file.type.match("(image|video|audio).*")
            if (!isMedia) {
              toast({
                variant: "destructive",
                description: "不支持的文件类型，请上传图片、视频或音频文件",
              })
              return
            }
            // 检查文件大小
            const maxSize = file.type.startsWith("image/") ? 20 * 1024 * 1024 : 100 * 1024 * 1024
            if (file.size > maxSize) {
              toast({
                variant: "destructive",
                description: "文件过大",
              })
              return
            }
            setFile(file)
          }}
        >
          <Upload />
        </ImageUploadButton>

        <div
          className={cn([
            "flex items-center gap-1",
            file && enableUploadMask ? "visible" : "hidden",
          ])}
        >
          <ImageUploadButton
            disabled={isInpainting}
            tooltip="上传自定义遮罩"
            onFileUpload={async (file) => {
              let newCustomMask: HTMLImageElement | null = null
              try {
                newCustomMask = await fileToImage(file)
              } catch (e: any) {
                toast({
                  variant: "destructive",
                  description: e.message ? e.message : e.toString(),
                })
                return
              }
              if (
                newCustomMask.naturalHeight !== imageHeight ||
                newCustomMask.naturalWidth !== imageWidth
              ) {
                toast({
                  variant: "destructive",
                  description: `遮罩尺寸必须与图片一致：${imageWidth}x${imageHeight}`,
                })
                return
              }

              setCustomFile(file)
              if (!runMannually) {
                runInpainting()
              }
            }}
          >
            <Upload />
          </ImageUploadButton>

          {customMask ? (
            <Popover open={openMaskPopover}>
              <PopoverTrigger
                className="btn-primary side-panel-trigger"
                onMouseEnter={() => setOpenMaskPopover(true)}
                onMouseLeave={() => setOpenMaskPopover(false)}
                style={{
                  visibility: customMask ? "visible" : "hidden",
                  outline: "none",
                }}
                onClick={() => {
                  if (customMask) {
                  }
                }}
              >
                <IconButton tooltip="运行自定义遮罩">
                  <PlayIcon />
                </IconButton>
              </PopoverTrigger>
              <PopoverContent>
                {maskImageLoaded ? (
                  <img src={maskImage.src} alt="自定义遮罩" />
                ) : (
                  <></>
                )}
              </PopoverContent>
            </Popover>
          ) : (
            <></>
          )}
        </div>

        {file && !model.need_prompt ? (
          <IconButton
            disabled={isInpainting}
            tooltip="重新应用上一次遮罩"
            onClick={handleRerunLastMask}
            onMouseEnter={onRerunMouseEnter}
            onMouseLeave={onRerunMouseLeave}
          >
            <RotateCw />
          </IconButton>
        ) : (
          <></>
        )}
        </div>
      </div>

      {model.need_prompt ? <PromptInput /> : <></>}

      <div className="flex gap-1">
        <IconButton
          tooltip="文档中心"
          onClick={() => {
            window.open('/docs', '_blank')
          }}
        >
          <BookOpen />
        </IconButton>
        <ThemeToggle />
        <Shortcuts />
        {serverConfig.disableModelSwitch ? <></> : <SettingsDialog />}
      </div>
    </header>
  )
}

export default Header
