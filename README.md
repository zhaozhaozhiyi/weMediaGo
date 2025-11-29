本项目是较为完整的项目，包含的前端、后端、模型。

<h1 align="center">WeMediaGo</h1>
<p align="center">AI驱动的全媒体处理平台 - 图片、视频、音频一站式编辑工具</p>

<p align="center">
<a href="https://github.com/Sanster/WeMediaGo">
<img alt="total download" src="https://pepy.tech/badge/wemediago" />
</a>
<a href="https://pypi.org/project/wemediago">
<img alt="version" src="https://img.shields.io/pypi/v/wemediago" />
</a>
<a href="">
<img alt="python version" src="https://img.shields.io/pypi/pyversions/wemediago" />
</a>
</p>

## 🎨 项目概述

WeMediaGo 是一个功能全面的全媒体处理平台，集成了图片、视频、音频三大媒体类型的编辑与处理能力。平台结合了最先进的AI图像修复技术与传统媒体编辑功能，采用现代Web架构设计，包含React前端和FastAPI后端，为自媒体创作者、设计师、视频制作人和内容生产者提供专业级的媒体处理能力。

### 📱 平台定位

WeMediaGo 致力于成为**一站式全媒体处理平台**，覆盖从图片修复、视频弹幕到音频可视化的完整媒体处理工作流。无论是快速修图、视频互动增强，还是音频可视化分析，都能在一个平台上高效完成。

## ✨ 核心功能

### 🤖 AI图像修复

#### LaMa模型
- **LaMa**: 快速准确的物体移除和图像修复
- 模型文件已本地化，无需网络下载
- 支持CPU和GPU加速

### 🖼️ 传统图片编辑功能

#### 裁剪功能
- **预设比例裁剪**: 8种常用比例，适配不同平台
- 3:4（竖版短视频）
- 21:9（电影屏）
- 4:5（小红书封面）
- 1:2（长条图）
- 9:16（抖音封面）
- 1:1（正方形）
- 4:3（常规）
- 16:9（宽屏）
- **自由裁剪**: 自定义裁剪区域，支持拖拽调整
- **实时预览**: 裁剪框内显示当前选中区域的宽高像素值

#### 旋转与翻转
- **固定角度旋转**: 支持90°、180°、270°一键旋转
- **精确角度控制**: 手动输入0-360°任意整数角度
- **滑块旋转**: 拖动滑块实时预览旋转效果
- **旋转重置**: 一键恢复图片初始角度
- **翻转功能**: 支持水平翻转和垂直翻转

#### 滤镜效果
- **12种预设滤镜**: 复古、清新、黑白、高饱和、胶片、日系、冷色调、暖色调、怀旧、柔光、锐化、去雾
- **滤镜叠加**: 最多支持2种滤镜叠加使用
- **强度调节**: 0-100%可调节滤镜强度
- **自定义预设**: 保存常用滤镜组合，最多5个自定义预设
- **实时预览**: 鼠标悬浮即可预览滤镜效果

#### 文字水印
- **文字内容**: 支持最多10个字符的水印文字
- **字体大小**: 12-72px可调节
- **颜色设置**: 支持HEX颜色码和RGB格式输入
- **透明度**: 0-100%可调节
- **旋转角度**: 0-360°可调节
- **位置选择**: 居中、左上、右上、左下、右下、平铺
- **边距控制**: 精确控制水印位置边距
- **背景设置**: 可选背景颜色和透明度
- **平铺模式**: 支持平铺水印，可调节间距和角度

#### 马赛克功能
- **多种选区类型**: 矩形、圆形、自由手绘、多边形
- **颗粒大小**: 1-20px可调节
- **模糊强度**: 0-100%可调节
- **多选区管理**: 支持创建多个马赛克选区，可单独显示/隐藏和删除

#### 色彩调节
- **亮度**: 0-200%可调节
- **对比度**: 0-200%可调节
- **饱和度**: 0-200%可调节
- **色温**: 0-200%可调节，提供冷色/暖色/默认快捷按钮

#### 图片压缩
- **三种预设**: 高清晰、平衡、体积优先
- **压缩率控制**: 0-100%可调节
- **大小预估**: 实时显示原图大小和预估压缩后大小
- **格式支持**: JPEG、PNG等常见格式

#### OpenCV处理
- **多种算法**: 支持OpenCV2的各种图像处理算法
- **参数调节**: 可调节处理半径和标志参数

### 🔌 插件生态

可扩展的插件系统，提供额外功能：

#### 分割与遮罩
- **Segment Anything**: 交互式物体分割，支持SAM/SAM2
- **RemoveBG**: 背景移除和前景提取
- **Anime Segmentation**: 专门的动漫角色分割

#### 图像增强
- **RealESRGAN**: 超分辨率放大
- **GFPGAN**: 人脸修复和增强
- **RestoreFormer**: 高级人脸修复

### 🎬 视频处理功能

#### 视频播放与编辑
- **视频播放器**: 支持MP4、WebM等常见视频格式
- **播放控制**: 播放/暂停、进度条拖拽、时间显示
- **视频信息**: 自动解析视频时长、分辨率等元数据

#### 弹幕系统
- **弹幕添加**: 自定义弹幕文字、颜色、字体、滚动速度
- **三种模式**: 顶部固定、底部固定、滚动弹幕
- **弹幕互动**: 支持弹幕回复功能，形成互动链路
- **实时渲染**: 弹幕与视频播放实时同步，流畅的动画效果
- **点击交互**: 点击弹幕可进行回复操作

### 🎵 音频处理功能

#### 音频播放与编辑
- **音频播放器**: 支持MP3、WAV等常见音频格式
- **播放控制**: 播放/暂停、进度条拖拽、时间显示
- **音频解析**: 自动解析音频时长、采样率、声道数等元数据

#### 音频可视化
- **频谱图**: 实时频谱分析，动态显示音频频率分布
- **波形图**: 2D波形可视化，展示音频波形特征
- **实时同步**: 可视化效果与音频播放实时同步
- **进度定位**: 支持进度条拖拽定位，可视化效果随音频片段更新
- **暂停保持**: 暂停时保持当前可视化状态

### 📁 其他功能
- **文件管理器**: 内置文件浏览器，方便图像管理
- **实时处理**: WebSocket通信的实时预览
- **多种输入格式**: 
- 图片: JPEG、PNG、WebP、BMP、TIFF
- 视频: MP4、WebM
- 音频: MP3、WAV
- **高级遮罩**: 画笔工具、自动分割和遮罩编辑
- **批量处理**: 命令行接口，支持多张图片批量处理

## 🚀 快速开始

本项目包含前端、后端和文档中心三个部分。

### 📦 方式一：使用已发布的包（推荐，最简单）

最简单的方式，后端和前端会自动集成在一起启动。

#### 1. 安装

```bash
pip3 install wemediago
```

#### 2. 检查模型文件

确保模型文件存在于项目根目录：
```bash
# 检查 LaMa 模型文件是否存在
ls models/lama/big-lama.pt
```

如果模型文件不存在，需要下载并放置到 `models/lama/big-lama.pt` 位置。
模型下载地址请参考 `models/lama/README.md`。

#### 3. 启动服务

```bash
# CPU模式
wemediago start --model=lama --device=cpu --port=8080

# GPU模式（需要先安装CUDA版本的PyTorch）
# pip3 install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
wemediago start --model=lama --device=cuda --port=8080
```

#### 4. 访问应用

启动成功后，访问 http://localhost:8080 即可使用完整的 WeMediaGo 功能。

**说明：**
- 这种方式会自动启动后端，并将前端构建文件集成在后端服务中
- 所有功能开箱即用，无需额外配置
- 其他插件的模型文件会在首次使用时自动下载到默认目录（`~/.cache`），可通过 `--model-dir` 参数指定下载目录

### 🔧 方式二：开发模式（本地开发）

适用于需要修改代码或进行二次开发的场景。

#### 步骤1：环境准备

**前置要求：**
- Python 3.7+
- Node.js 18+ ([下载地址](https://nodejs.org/en))
- pip 包管理器

#### 步骤2：克隆项目

```bash
git clone https://github.com/Sanster/WeMediaGo.git
cd WeMediaGo
```

#### 步骤3：启动后端服务 ⚠️ 必须先启动后端

**3.1 检查模型文件**

确保模型文件存在于项目根目录：
```bash
# 检查 LaMa 模型文件是否存在
ls models/lama/big-lama.pt
```

如果模型文件不存在，需要下载并放置到 `models/lama/big-lama.pt` 位置。
模型下载地址请参考 `models/lama/README.md`。

**3.2 安装Python依赖**

```bash
pip install -r requirements.txt
```

**3.3 启动后端服务**

打开第一个终端窗口，执行：

```bash
# CPU模式
python3 main.py start --model=lama --device=cpu --port=8080

# GPU模式
python3 main.py start --model=lama --device=cuda --port=8080
```

**等待后端启动完成**，看到类似以下输出表示后端已成功启动：
```
INFO: Uvicorn running on http://127.0.0.1:8080 (Press CTRL+C to quit)
```

> ⚠️ **重要**：后端启动后，请保持这个终端窗口运行，不要关闭。后端需要持续运行才能提供API服务。

**后端服务信息：**
- 服务地址：http://localhost:8080
- API文档：http://localhost:8080/docs （自动生成的 Swagger 文档）
- WebSocket：支持实时通信

**模型目录说明：**
- 核心模型（LaMa）位于项目根目录：`models/lama/big-lama.pt`
- 其他插件模型默认下载到：`~/.cache` 目录
- 可通过 `--model-dir` 参数指定其他插件的模型下载目录

#### 步骤4：启动前端服务 ⚠️ 后端启动后再启动前端

**4.1 打开新的终端窗口**

保持后端服务在第一个终端运行，打开第二个终端窗口。

**4.2 进入前端目录并安装依赖**

```bash
cd web_app
npm install
```

> **注意**：`npm install` 只需要在首次运行或更新依赖时执行。

**4.3 配置后端地址**

在 `web_app` 目录中创建 `.env.local` 文件，配置后端服务地址：

```bash
# 方法1：使用命令行创建
echo "VITE_BACKEND=http://127.0.0.1:8080" > .env.local

# 方法2：手动创建文件
# 在 web_app 目录下创建 .env.local 文件，内容如下：
# VITE_BACKEND=http://127.0.0.1:8080
```

> ⚠️ **重要**：如果不配置后端地址，前端将无法连接到后端API，所有功能都无法使用。

**如果后端运行在不同地址：**
```bash
# 例如后端运行在 192.168.1.100:8080
VITE_BACKEND=http://192.168.1.100:8080

# 或者后端运行在其他端口
VITE_BACKEND=http://127.0.0.1:3000
```

**4.4 启动前端开发服务器**

```bash
npm run dev
```

前端开发服务器将在 `http://localhost:5173` 启动，支持热更新（HMR）。

#### 步骤5：访问应用

启动成功后，在浏览器中访问：

- **前端界面（推荐）**: http://localhost:5173 - 完整的用户界面
- **后端API**: http://localhost:8080 - API服务
- **API文档**: http://localhost:8080/docs - Swagger API文档

#### 步骤6：验证服务运行状态

**检查后端是否正常运行：**
- 访问 http://localhost:8080/docs，应该能看到 Swagger API 文档页面
- 或者访问 http://localhost:8080/api/v1/server-config，应该能返回JSON配置

**检查前端是否正常连接后端：**
- 打开浏览器开发者工具（F12）
- 查看 Console 标签，不应该有 API 连接错误
- 如果看到连接错误，请检查后端是否已启动，以及 `.env.local` 配置是否正确

#### 启动顺序总结

```
1. 启动后端 → 2. 等待后端启动完成 → 3. 启动前端 → 4. 访问 http://localhost:5173
(终端1) (看到 Uvicorn running) (终端2)
```

> 💡 **提示**：两个服务需要同时运行。关闭任何一个都会影响功能使用。

#### 构建生产版本

如果需要构建前端生产版本并集成到后端：

```bash
cd web_app
npm run build
cp -r dist/ ../iopaint/web_app
```

### 🎨 单独启动前端（仅用于UI开发）

**适用场景**：只进行前端UI开发、样式调整、组件调试等，不需要实际功能运行。

> ⚠️ **注意**：这种方式启动的前端只能查看界面，无法使用任何需要后端API的功能。

#### 前置要求

- Node.js 18+ ([下载地址](https://nodejs.org/en))
- **后端服务必须已启动**（如果希望查看界面效果，虽然功能不可用）

#### 快速开始

```bash
# 1. 进入前端目录
cd web_app

# 2. 安装依赖（首次运行）
npm install

# 3. 配置后端地址（如果后端已启动，用于避免API错误）
echo "VITE_BACKEND=http://127.0.0.1:8080" > .env.local

# 4. 启动前端开发服务器
npm run dev
```

#### 访问前端

启动成功后，访问：http://localhost:5173

**前端开发命令：**

```bash
cd web_app

npm run dev # 启动开发服务器（支持热更新）
npm run build # 构建生产版本
npm run lint # 代码检查
npm run preview # 预览生产构建
```

**注意事项：**
- ✅ 可以查看 Landing 页面和界面布局
- ✅ 支持热更新，修改代码后自动刷新
- ⚠️ 如果后端未启动，调用API时会报错（不影响界面显示）
- ⚠️ 实际功能（图片处理、文件上传等）需要后端支持才能使用

#### 安装

```bash
pip3 install wemediago
```

#### 启动完整服务

```bash
# CPU模式
wemediago start --model=lama --device=cpu --port=8080

# GPU模式（需要先安装CUDA版本的PyTorch）
# pip3 install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
wemediago start --model=lama --device=cuda --port=8080
```

### 📚 文档中心

项目文档位于 `docs/` 目录，包含以下文档：

- `PRD.md` - 产品需求文档
- `ui-spec.md` - UI组件、主题与布局规范
- `xuqiu.md` - 需求文档

**查看文档的方式：**

1. **直接查看Markdown文件**：使用任何 Markdown 阅读器（如 VS Code、Typora、Obsidian 等）打开 `docs/` 目录下的文件

2. **使用在线Markdown查看器**：将 Markdown 文件内容复制到在线查看器中查看

3. **GitHub/GitLab预览**：如果在 GitHub/GitLab 等平台查看，平台会自动渲染 Markdown

### 🔌 启用插件

```bash
# 启用交互式分割插件
wemediago start --enable-interactive-seg --interactive-seg-device=cuda

# 启用背景移除插件
wemediago start --enable-remove-bg

# 启用超分辨率插件
wemediago start --enable-realesrgan
```

### 📦 批量处理

```bash
wemediago run --model=lama --device=cpu \
--image=/path/to/image_folder \
--mask=/path/to/mask_folder \
--output=output_dir
```

`--image` 是包含输入图像的文件夹，`--mask` 是包含相应遮罩图像的文件夹。
当 `--mask` 是遮罩文件的路径时，所有图像将使用此遮罩进行处理。

## 📦 打包与分发

### 使用 PyInstaller 打包

WeMediaGo 支持使用 PyInstaller 打包为独立的可执行文件，方便在没有 Python 环境的机器上运行。

#### 前置要求

1. **Python 3.7+** 环境
2. **Node.js 18+** (用于构建前端)
3. **所有依赖已安装** (`pip install -r requirements.txt`)
4. **PyInstaller** (`pip install pyinstaller`)

#### 本地构建

**Windows:**

```bash
scripts\build_local.bat
```

**macOS/Linux:**

```bash
chmod +x scripts/build_local.sh
./scripts/build_local.sh
```

构建完成后，可执行文件位于 `dist/wemediago/` 目录。

#### 手动构建步骤

1. **构建前端**:
   ```bash
   cd web_app
   npm install
   npm run build
   # 复制构建文件到后端目录
   cp -r dist/* ../iopaint/web_app/  # Linux/macOS
   # 或
   xcopy /E /I /Y dist\* ..\iopaint\web_app\  # Windows
   ```

2. **使用 PyInstaller 打包**:
   ```bash
   pyinstaller wemediago.spec --clean --noconfirm
   ```

#### PyInstaller 配置文件

项目根目录的 `wemediago.spec` 文件包含了完整的打包配置：
- 入口点：`main.py`
- 包含前端静态文件
- 包含所有必需的 Python 模块
- 自动处理隐藏导入

如需自定义，可以编辑 `wemediago.spec` 文件。

### 使用 GitHub Actions 自动构建

项目已配置 GitHub Actions 工作流，可以自动为 Windows、macOS 和 Linux 构建可执行文件。

#### 触发构建

**方式1：推送版本标签**

```bash
git tag v1.0.0
git push origin v1.0.0
```

**方式2：手动触发**

1. 在 GitHub 仓库页面，进入 **Actions** 标签
2. 选择 **Build Executables** 工作流
3. 点击 **Run workflow**
4. 输入版本号并运行

#### 构建产物

构建完成后，可以在以下位置找到构建产物：

- **GitHub Actions Artifacts**: 在 Actions 页面下载各个平台的构建文件
- **GitHub Release**: 如果推送了版本标签，会自动创建 Release 并上传所有平台的可执行文件

#### 构建产物格式

- **Windows**: `wemediago-windows-{version}.zip`
- **macOS**: `wemediago-macos-{version}.zip` (包含 .app 文件)
- **Linux**: `wemediago-linux-{version}.tar.gz`

#### 使用构建产物

1. 下载对应平台的可执行文件
2. 解压到任意目录
3. 运行可执行文件（Windows: `wemediago.exe`, macOS: `wemediago.app`, Linux: `./wemediago`）
4. 首次运行会自动下载所需的模型文件

> **注意**：
> - 可执行文件体积较大（包含 Python 解释器和所有依赖）
> - 首次启动可能需要一些时间
> - 模型文件需要单独下载，不会包含在可执行文件中

## 🛠️ 开发指南

### 开发模式说明

在开发模式下：
- **前端**：修改代码后会自动更新（热更新）
- **后端**：修改Python代码后需要重启服务
- **调试**：前端使用 Vite 的开发服务器，后端使用 FastAPI 的调试模式

### 常见开发命令

```bash
# 前端开发
cd web_app
npm run dev # 启动开发服务器
npm run build # 构建生产版本
npm run lint # 代码检查
npm run preview # 预览生产构建

# 后端开发
python3 main.py start --model lama --port 8080 # 启动后端
pip install -r requirements.txt # 安装依赖
pip install -r requirements-dev.txt # 安装开发依赖
```

### 📁 项目结构

```
WeMediaGo/
├── iopaint/ # 后端核心代码
│ ├── model/ # AI模型实现
│ ├── plugins/ # 插件系统
│ ├── api.py # FastAPI接口
│ ├── cli.py # 命令行接口
│ └── ...
├── web_app/ # 前端React应用
│ ├── src/
│ │ ├── components/ # React组件
│ │ │ ├── SidePanel/ # 侧边栏功能面板
│ │ │ └── ...
│ │ ├── hooks/ # 自定义Hook
│ │ └── lib/ # 工具函数和状态管理
│ └── ...
├── docker/ # Docker配置
└── requirements.txt # Python依赖
```

### 🔧 技术栈详解

#### 前端技术栈
- **React 18**: 现代React框架，支持并发特性
- **TypeScript**: 类型安全的JavaScript超集
- **Vite**: 快速的构建工具和开发服务器
- **TailwindCSS**: 实用优先的CSS框架
- **Radix UI**: 无障碍的UI组件库
- **Zustand**: 轻量级状态管理，支持撤销/重做

#### 后端技术栈
- **FastAPI**: 现代、快速的Python Web框架

## 💡 使用案例

### 图像修复
- **水印移除**: 快速移除图片中的水印和Logo
- **物体移除**: 删除不需要的人物或物体
- **缺陷修复**: 修复照片中的划痕、污渍等缺陷
- **背景清理**: 清理复杂的背景元素


### 社交媒体适配
- **平台适配**: 快速裁剪图片到适合不同社交媒体的比例
- **滤镜美化**: 应用预设滤镜，快速美化图片
- **水印保护**: 添加自定义水印，保护原创内容
- **批量处理**: 批量处理大量照片，提高工作效率

### 批量处理
- **照片整理**: 批量处理大量照片，移除水印或缺陷
- **内容审核**: 批量移除不适宜的内容
- **产品图片**: 电商产品图片的背景清理和美化

### 视频编辑
- **弹幕互动**: 为视频添加互动弹幕，增强观众参与度
- **视频标注**: 使用弹幕功能为视频添加说明和标注
- **互动内容**: 创建支持弹幕回复的互动视频内容

### 音频分析
- **音频可视化**: 通过频谱图和波形图分析音频特征
- **音频编辑**: 快速定位音频片段，进行精确编辑
- **音频分析**: 查看音频采样率、声道数等技术参数

## ❓ 常见问题

### 安装问题
**Q: 如何在不同平台上安装WeMediaGo？**
A: 
- Windows: 使用pip install wemediago
- Linux: pip install wemediago 或使用Docker
- macOS: pip install wemediago 或使用Homebrew
- Apple Silicon: 支持M1/M2芯片，自动优化性能

**Q: GPU内存不足怎么办？**
A: 
- 使用CPU模式: `--device=cpu`
- 降低图像分辨率
- 使用更轻量的模型如LaMa
- 启用内存优化选项

### 使用问题
**Q: 模型下载失败怎么办？**
A: 
- 检查网络连接
- 使用国内镜像源
- 手动下载模型到指定目录
- 使用 `--model-dir` 指定模型目录

**Q: 处理速度很慢怎么办？**
A: 
- 确保使用GPU加速: `--device=cuda`
- 使用更快的模型如LaMa
### 功能问题
**Q: 如何获得更好的修复效果？**
A: 
- 使用精确的遮罩
- 选择合适的模型
- 调整模型参数
- 使用多个模型组合

**Q: 支持哪些图像格式？**
A: 支持JPEG、PNG、WebP、BMP、TIFF等常见格式

**Q: 如何保存滤镜预设？**
A: 
- 选择并应用滤镜后，点击"保存预设"按钮
- 输入预设名称即可保存
- 最多可保存5个自定义预设

**Q: 水印可以平铺吗？**
A: 
- 可以，选择"平铺"位置模式
- 可调节平铺间距和角度
- 适合需要大面积水印保护的场景

## 📝 更新日志

### 主要功能

#### 图片处理
- ✅ AI图像修复
- ✅ 裁剪功能（8种预设比例 + 自由裁剪）
- ✅ 旋转与翻转（固定角度 + 精确控制）
- ✅ 滤镜效果（12种预设 + 叠加 + 自定义）
- ✅ 文字水印（完整配置选项）
- ✅ 马赛克功能（多种选区类型）
- ✅ 色彩调节（亮度、对比度、饱和度、色温）
- ✅ 图片压缩（三种预设 + 可调节压缩率）
- ✅ OpenCV处理
- ✅ 插件系统（分割、增强等）

#### 视频处理
- ✅ 视频播放器（支持MP4、WebM格式）
- ✅ 弹幕系统（自定义样式、三种模式）
- ✅ 弹幕互动（支持回复功能）

#### 音频处理
- ✅ 音频播放器（支持MP3、WAV格式）
- ✅ 音频可视化（频谱图、波形图）
- ✅ 音频信息解析（时长、采样率、声道数）


