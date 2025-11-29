import { useState } from "react"
import { 
  Sparkles, 
  Scissors, 
  Palette, 
  Image as ImageIcon, 
  Zap, 
  Download,
  Code,
  ArrowRight,
  CheckCircle2,
  Layers,
  Camera,
  Brush,
  Filter,
  Type,
  FileDown,
  Video,
  Music,
  BookOpen
} from "lucide-react"
import { Button } from "./ui/button"

interface LandingProps {
  onGetStarted: () => void
}

const Landing = ({ onGetStarted }: LandingProps) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  const features = [
    {
      id: 1,
      title: "AI 图像修复",
      description: "基于 LaMa、MAT、ZITS 等先进模型，快速移除水印、物体和缺陷",
      icon: Sparkles,
      color: "from-yellow-400 to-yellow-600",
      examples: ["水印移除", "物体移除", "缺陷修复", "背景清理"]
    },
    {
      id: 2,
      title: "智能裁剪",
      description: "8种预设比例，适配不同社交媒体平台，支持自由裁剪",
      icon: Scissors,
      color: "from-blue-500 to-cyan-500",
      examples: ["3:4 竖版短视频", "4:5 小红书封面", "9:16 抖音封面", "16:9 宽屏"]
    },
    {
      id: 3,
      title: "滤镜效果",
      description: "12种预设滤镜，支持叠加和自定义预设，实时预览",
      icon: Filter,
      color: "from-orange-500 to-red-500",
      examples: ["复古", "清新", "胶片", "日系"]
    },
    {
      id: 4,
      title: "文字水印",
      description: "灵活的水印配置，支持位置、样式、平铺等多种选项",
      icon: Type,
      color: "from-green-500 to-emerald-500",
      examples: ["自定义位置", "颜色透明度", "背景设置", "平铺模式"]
    },
    {
      id: 5,
      title: "色彩调节",
      description: "精确控制亮度、对比度、饱和度、色温，打造完美视觉效果",
      icon: Palette,
      color: "from-pink-500 to-rose-500",
      examples: ["亮度调节", "对比度增强", "饱和度优化", "色温调整"]
    },
    {
      id: 6,
      title: "图片压缩",
      description: "智能压缩算法，在保持质量的同时大幅减小文件体积",
      icon: FileDown,
      color: "from-indigo-500 to-purple-500",
      examples: ["高清晰模式", "平衡模式", "体积优先", "实时预览"]
    },
    {
      id: 7,
      title: "视频弹幕",
      description: "为视频添加互动弹幕，支持自定义样式和回复功能",
      icon: Video,
      color: "from-red-500 to-orange-500",
      examples: ["自定义弹幕", "三种模式", "弹幕回复", "实时渲染"]
    },
    {
      id: 8,
      title: "音频可视化",
      description: "频谱图和波形图可视化，实时同步音频播放",
      icon: Music,
      color: "from-teal-500 to-cyan-500",
      examples: ["频谱分析", "波形显示", "实时同步", "进度定位"]
    }
  ]

  const plugins = [
    {
      name: "Segment Anything",
      description: "交互式物体分割",
      icon: Layers
    },
    {
      name: "RealESRGAN",
      description: "超分辨率放大",
      icon: Zap
    },
    {
      name: "GFPGAN",
      description: "人脸修复增强",
      icon: Camera
    },
    {
      name: "RemoveBG",
      description: "背景移除",
      icon: ImageIcon
    }
  ]

  const codeExample = `# 安装 WeMediaGo
pip3 install wemediago

# 启动 Web 界面（CPU 模式）
wemediago start --model=lama --device=cpu --port=8080

# GPU 模式（需要 CUDA）
wemediago start --model=lama --device=cuda --port=8080

# 访问 http://localhost:8080 开始使用`

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI 驱动的全媒体处理平台
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6">
              WeMediaGo
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
              图片、视频、音频一站式编辑工具
              <br />
              <span className="text-slate-500">为自媒体创作者、设计师、视频制作人和内容生产者提供专业级全媒体处理能力</span>
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 min-w-fit whitespace-nowrap bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg shadow-yellow-500/50"
                onClick={onGetStarted}
              >
                立即开始
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 min-w-fit whitespace-nowrap border-2 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => {
                  const element = document.getElementById('features')
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                了解更多
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 min-w-fit whitespace-nowrap border-2 flex items-center bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => {
                  window.open('/docs', '_blank')
                }}
              >
                <BookOpen className="mr-2 w-5 h-5 flex-shrink-0" />
                文档中心
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              强大的功能集合
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              从 AI 图像修复到视频弹幕互动，从音频可视化到传统编辑，满足您的所有媒体处理需求
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  className="group relative p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {feature.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {feature.examples.map((example, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Plugins Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              可扩展的插件生态
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              丰富的插件系统，为您的图像处理工作流提供更多可能性
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plugins.map((plugin, index) => {
              const Icon = plugin.icon
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg"
                >
                  <Icon className="w-8 h-8 text-yellow-600 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {plugin.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {plugin.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-300 text-sm font-medium mb-6">
              <Code className="w-4 h-4" />
              快速开始
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              几行代码即可开始
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              简单的安装步骤，强大的功能体验
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-slate-400 ml-4">Terminal</span>
              </div>
              <pre className="p-6 overflow-x-auto">
                <code className="text-sm text-slate-300 font-mono">
                  {codeExample}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              适用场景
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              无论您是自媒体创作者、设计师、视频制作人还是内容生产者，WeMediaGo 都能满足您的全媒体处理需求
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100">
              <div className="w-12 h-12 rounded-xl bg-yellow-600 flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                图像修复
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>快速移除图片中的水印和 Logo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>删除不需要的人物或物体</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>修复照片中的划痕、污渍等缺陷</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                <Brush className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                创意编辑
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>用 AI 生成的新物体替换原有物体</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>智能扩展图像边界，增加画面内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>在图像中添加自然融合的文本</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                社交媒体适配
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>快速裁剪图片到适合不同社交媒体的比例</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>应用预设滤镜，快速美化图片</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>批量处理大量照片，提高工作效率</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                视频互动增强
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>为视频添加互动弹幕，增强观众参与度</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>支持弹幕回复功能，形成互动链路</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>自定义弹幕样式，适配不同视频风格</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100">
              <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                音频可视化分析
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span>通过频谱图和波形图分析音频特征</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span>实时同步可视化效果，精确定位音频片段</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span>查看音频技术参数，辅助音频编辑</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-yellow-500 to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-xl text-yellow-100 mb-8">
            立即体验 WeMediaGo，让 AI 为您的全媒体处理带来无限可能
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-white text-yellow-600 hover:bg-slate-100 shadow-lg"
            onClick={onGetStarted}
          >
            免费开始使用
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-sm">
              © 2025 WeMediaGo. 让 AI 为您的全媒体处理带来无限可能！
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing

