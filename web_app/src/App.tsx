import { useCallback, useEffect, useRef, useState } from "react"

import useInputImage from "@/hooks/useInputImage"
import { keepGUIAlive, getMediaType } from "@/lib/utils"
import { getServerConfig } from "@/lib/api"
import Header from "@/components/Header"
import Workspace from "@/components/Workspace"
import Landing from "@/components/Landing"
import { Toaster } from "./components/ui/toaster"
import { useStore } from "./lib/states"
import { useWindowSize } from "react-use"

const SUPPORTED_FILE_TYPE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
]
function Home() {
  const [file, updateAppState, setServerConfig, setFile, setActiveMediaType] = useStore((state) => [
    state.file,
    state.updateAppState,
    state.setServerConfig,
    state.setFile,
    state.setActiveMediaType,
  ])
  // 检查 URL 参数，如果存在 start=true，则跳过 Landing 页面
  const urlParams = new URLSearchParams(window.location.search)
  const shouldSkipLanding = urlParams.get('start') === 'true'
  const [showLanding, setShowLanding] = useState(!shouldSkipLanding)

  const userInputImage = useInputImage()

  const windowSize = useWindowSize()

  useEffect(() => {
    if (userInputImage) {
      setFile(userInputImage)
      setShowLanding(false)
    }
  }, [userInputImage, setFile])

  useEffect(() => {
    if (file) {
      setShowLanding(false)
    }
  }, [file])

  // 根据是否显示 Landing 页面来控制页面滚动
  useEffect(() => {
    if (showLanding && !file) {
      // 显示 Landing 页面时，允许滚动
      document.documentElement.style.overflow = 'auto'
      document.body.style.overflow = 'auto'
    } else {
      // 显示主编辑界面时，保持原有设置（overflow: hidden）
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    }
    // 清理函数：组件卸载时恢复
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [showLanding, file])

  useEffect(() => {
    updateAppState({ windowSize })
  }, [windowSize])

  useEffect(() => {
    const fetchServerConfig = async () => {
      const serverConfig = await getServerConfig()
      setServerConfig(serverConfig)
      if (serverConfig.isDesktop) {
        // Keeping GUI Window Open
        keepGUIAlive()
      }
    }
    fetchServerConfig()
  }, [])

  const dragCounter = useRef(0)

  const handleDrag = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDragIn = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current += 1
  }, [])

  const handleDragOut = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current > 0) return
  }, [])

  const handleDrop = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      if (event.dataTransfer.files.length > 1) {
        // setToastState({
        //   open: true,
        //   desc: "Please drag and drop only one file",
        //   state: "error",
        //   duration: 3000,
        // })
      } else {
        const dragFile = event.dataTransfer.files[0]
        const fileType = dragFile.type
        // 支持所有媒体类型
        if (SUPPORTED_FILE_TYPE.some(type => fileType.includes(type.split('/')[1])) || 
            fileType.startsWith('image/') || 
            fileType.startsWith('video/') || 
            fileType.startsWith('audio/')) {
          setFile(dragFile)
          // 根据文件类型自动切换 Tab
          const mediaType = getMediaType(dragFile)
          setActiveMediaType(mediaType)
        }
      }
      event.dataTransfer.clearData()
    }
  }, [setFile, setActiveMediaType])

  const onPaste = useCallback((event: any) => {
    // TODO: when sd side panel open, ctrl+v not work
    // https://htmldom.dev/paste-an-image-from-the-clipboard/
    if (!event.clipboardData) {
      return
    }
    const clipboardItems = event.clipboardData.items
    const items: DataTransferItem[] = [].slice
      .call(clipboardItems)
      .filter((item: DataTransferItem) => {
        // Filter the image items only
        return item.type.indexOf("image") !== -1
      })

    if (items.length === 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    // TODO: add confirm dialog

    const item = items[0]
    // Get the blob of image
    const blob = item.getAsFile()
    if (blob) {
      setFile(blob)
    }
  }, [])

  useEffect(() => {
    window.addEventListener("dragenter", handleDragIn)
    window.addEventListener("dragleave", handleDragOut)
    window.addEventListener("dragover", handleDrag)
    window.addEventListener("drop", handleDrop)
    window.addEventListener("paste", onPaste)
    return function cleanUp() {
      window.removeEventListener("dragenter", handleDragIn)
      window.removeEventListener("dragleave", handleDragOut)
      window.removeEventListener("dragover", handleDrag)
      window.removeEventListener("drop", handleDrop)
      window.removeEventListener("paste", onPaste)
    }
  })

  const handleGetStarted = () => {
    // 在新窗口打开应用
    const currentUrl = window.location.origin + window.location.pathname
    window.open(`${currentUrl}?start=true`, '_blank')
  }

  // 如果 URL 参数包含 start=true，自动触发文件选择
  useEffect(() => {
    if (shouldSkipLanding && !file) {
      // 延迟一下确保组件完全渲染
      const timer = setTimeout(() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*,video/*,audio/*'
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement
          const selectedFile = target.files?.[0]
          if (selectedFile) {
            setFile(selectedFile)
            const mediaType = getMediaType(selectedFile)
            setActiveMediaType(mediaType)
          }
        }
        input.click()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [shouldSkipLanding, file, setFile, setActiveMediaType])

  // 如果显示 Landing 页面，不显示主应用界面
  if (showLanding && !file) {
    return (
      <>
        <Toaster />
        <Landing onGetStarted={handleGetStarted} />
      </>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between w-full bg-[radial-gradient(circle_at_1px_1px,_#8e8e8e8e_1px,_transparent_0)] [background-size:20px_20px] bg-repeat">
      <Toaster />
      <Header />
      <Workspace />
    </main>
  )
}

export default Home
