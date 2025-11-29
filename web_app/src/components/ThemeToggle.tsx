import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { Button } from "./ui/button"

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 避免 hydration 不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    console.log("切换主题:", newTheme) // 调试用
    setTheme(newTheme)
  }

  if (!mounted) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" disabled>
            <Sun className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>切换主题</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  const isDark = theme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="cursor-pointer bg-background"
        >
          <div className="icon-button-icon-wrapper">
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{isDark ? "切换到浅色模式" : "切换到深色模式"}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default ThemeToggle

