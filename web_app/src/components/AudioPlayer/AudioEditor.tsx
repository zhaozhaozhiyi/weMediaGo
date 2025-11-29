import AudioPlayer from "./AudioPlayer"

interface AudioEditorProps {
  file: File
}

export default function AudioEditor({ file }: AudioEditorProps) {
  return (
    <div className="flex w-screen h-screen justify-start items-end pr-[320px]">
      <div className="w-full h-full max-w-[calc(100vw-320px)] max-h-[calc(100vh-60px)]">
        <AudioPlayer file={file} />
      </div>
    </div>
  )
}

