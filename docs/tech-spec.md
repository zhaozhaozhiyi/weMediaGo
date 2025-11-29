# 技术说明

## 技术架构

### 前端技术栈

- **React 18**: 现代React框架，支持并发特性，提供优秀的开发体验
- **TypeScript**: 类型安全，提升代码质量和开发效率
- **Vite**: 快速的构建工具，热更新速度快，开发体验好
- **TailwindCSS**: 实用优先的CSS框架，快速构建现代化UI
- **Radix UI**: 无障碍的UI组件库，提供高质量的基础组件
- **Zustand**: 轻量级状态管理，支持撤销/重做功能
- **react-router-dom**: 路由管理，支持文档中心多页面导航
- **react-markdown**: Markdown渲染，用于文档展示

### 后端技术栈

- **FastAPI**: 现代、快速的Python Web框架，自动生成API文档
- **PyTorch**: 深度学习框架，支持AI模型推理
- **Diffusers**: HuggingFace的扩散模型库，支持Stable Diffusion等模型
- **OpenCV**: 计算机视觉库，用于图像处理
- **WebSocket**: 实时通信支持，用于实时预览

## 功能实现清单

### 核心功能 (P0)

| 功能名称 | 实现状态 | 说明 |
|---------|---------|------|
| 图片裁剪 | ✅ 已完成 | 支持8种预设比例裁剪和自由裁剪，包含裁剪历史记录 |
| 旋转与翻转 | ✅ 已完成 | 支持固定角度旋转、滑块旋转、水平/垂直翻转 |
| 滤镜效果 | ⚠️ 部分完成 | 基础滤镜功能已实现，滤镜叠加和自定义预设部分实现 |
| 文字水印 | ⚠️ 部分完成 | 基础水印功能已实现，平铺模式待完善 |
| 马赛克功能 | ❌ 待实现 | 待实现 |
| 色彩调节 | ✅ 已完成 | 支持亮度、对比度、饱和度、色温调节 |
| 图片压缩 | ✅ 已完成 | 支持压缩率控制和体积预估 |
| AI图像修复 | ✅ 已完成 | 基于LaMa模型的图像修复功能 |

### 扩展功能 (P1)

| 功能名称 | 实现状态 | 说明 |
|---------|---------|------|
| 视频弹幕系统 | ✅ 已完成 | 支持三种弹幕模式（顶部、底部、滚动），包含弹幕回复功能 |
| 音频可视化 | ✅ 已完成 | 支持频谱图和波形图可视化 |
| 视频播放器 | ✅ 已完成 | 支持MP4、WebM格式，包含播放控制 |
| 音频播放器 | ✅ 已完成 | 支持MP3、WAV格式，包含播放控制 |

**图例说明**:
- ✅ 已完成
- ⚠️ 部分完成
- ❌ 待实现

## 技术选型说明

### 前端技术选型

#### React 18
- **选择理由**: 现代React框架，支持并发特性，提供优秀的开发体验
- **优势**: 
  - 支持并发渲染，提升性能
  - 丰富的生态系统
  - 优秀的开发工具支持

#### TypeScript
- **选择理由**: 类型安全，提升代码质量和开发效率
- **优势**:
  - 编译时类型检查，减少运行时错误
  - 更好的IDE支持和代码提示
  - 便于大型项目维护

#### Vite
- **选择理由**: 快速的构建工具，热更新速度快，开发体验好
- **优势**:
  - 基于ESM的快速HMR
  - 使用esbuild预构建依赖
  - 开箱即用的TypeScript支持

#### TailwindCSS
- **选择理由**: 实用优先的CSS框架，快速构建现代化UI
- **优势**:
  - 无需离开HTML即可构建界面
  - 高度可定制
  - 生产环境自动优化

#### Radix UI
- **选择理由**: 无障碍的UI组件库，提供高质量的基础组件
- **优势**:
  - 完全无障碍支持
  - 无样式，可完全自定义
  - 基于React Hooks，易于集成

#### Zustand
- **选择理由**: 轻量级状态管理，支持撤销/重做功能
- **优势**:
  - API简洁，学习成本低
  - 性能优秀
  - 支持中间件（如zundo用于撤销/重做）

### 后端技术选型

#### FastAPI
- **选择理由**: 现代、快速的Python Web框架，自动生成API文档
- **优势**:
  - 基于Python类型提示，自动生成OpenAPI文档
  - 异步支持，性能优秀
  - 易于测试和维护

#### PyTorch
- **选择理由**: 深度学习框架，支持AI模型推理
- **优势**:
  - 动态计算图，灵活性强
  - 丰富的预训练模型
  - 良好的GPU支持

#### Diffusers
- **选择理由**: HuggingFace的扩散模型库，支持Stable Diffusion等模型
- **优势**:
  - 统一的API接口
  - 支持多种扩散模型
  - 活跃的社区支持

#### OpenCV
- **选择理由**: 计算机视觉库，用于图像处理
- **优势**:
  - 功能强大的图像处理算法
  - 跨平台支持
  - 丰富的文档和示例

## 核心逻辑说明

### 图片裁剪实现

图片裁剪功能通过以下方式实现：

1. **裁剪状态管理**：使用 Zustand 管理裁剪状态，包括裁剪框位置、比例预设、历史记录等
   - `imageCropState`: 存储当前裁剪框的矩形区域和比例
   - `cropHistory`: 记录最近5次裁剪操作，支持撤销/重做

2. **预设比例切换**：当用户选择预设比例时
   - 计算目标比例对应的裁剪框尺寸
   - 保持裁剪框居中，自动适配图片尺寸
   - 更新 `imageCropState.aspectRatio` 状态

3. **自由裁剪**：用户可以通过拖拽调整裁剪框
   - 支持拖拽边缘/角点缩放
   - 支持拖拽框内区域平移
   - 实时显示裁剪区域的宽高像素值

4. **应用裁剪**：调用 `applyCrop()` 函数
   - 获取当前裁剪框的矩形区域
   - 使用 Canvas API 裁剪图片
   - 更新编辑器状态，将裁剪后的图片作为新的渲染层
   - 记录到裁剪历史栈中

#### 前端算法计算逻辑

**居中裁剪算法** (`computeCenteredCropRect`):

```typescript
// 计算居中裁剪区域
const imageRatio = imgW / imgH
let cropW = imgW, cropH = imgH

if (imageRatio > aspectRatio) {
  // 图片太"宽"，以高度为基准裁剪宽度
  cropH = imgH
  cropW = Math.round(cropH * aspectRatio)
} else {
  // 图片太"高"，以宽度为基准裁剪高度
  cropW = imgW
  cropH = Math.round(cropW / aspectRatio)
}

// 计算居中位置
const x = Math.round((imgW - cropW) / 2)
const y = Math.round((imgH - cropH) / 2)
```

**裁剪执行算法** (`cropImage`):

```typescript
// 使用 Canvas drawImage 的9参数版本进行裁剪
ctx.drawImage(
  image,
  rect.x, rect.y, rect.width, rect.height,  // 源图像区域
  0, 0, rect.width, rect.height              // 目标画布区域
)
```

### 图片旋转实现

图片旋转功能通过 Canvas 变换实现：

1. **旋转角度管理**：
   - 支持固定角度旋转（90°、180°、270°）
   - 支持滑块精确控制（0-360°）
   - 支持手动输入角度值

2. **旋转应用**：调用 `applyRotation(angle)` 函数
   - 获取当前渲染的图片（或原图）
   - 使用 Canvas API 的 `rotate()` 和 `translate()` 进行旋转变换
   - 计算旋转后的画布尺寸，确保图片完整显示
   - 将旋转后的图片转换为新的渲染层

3. **状态更新**：
   - 更新图片尺寸（旋转后宽高可能互换）
   - 更新编辑器状态，添加新的渲染层
   - 重置画笔和遮罩状态

#### 前端算法计算逻辑

**旋转后画布尺寸计算** (`rotateImage`):

```typescript
// 将角度转换为弧度
const radians = (angle * Math.PI) / 180

// 计算旋转后的画布尺寸（确保图片完整显示）
const cos = Math.abs(Math.cos(radians))
const sin = Math.abs(Math.sin(radians))
const newWidth = Math.round(image.width * cos + image.height * sin)
const newHeight = Math.round(image.width * sin + image.height * cos)

// 旋转变换矩阵
ctx.translate(newWidth / 2, newHeight / 2)  // 移动到画布中心
ctx.rotate(radians)                          // 旋转
ctx.translate(-image.width / 2, -image.height / 2)  // 移回原点
```

**角度归一化算法** (`normalizeRotation`):

```typescript
// 将角度归一化到 [0, 360) 区间
function normalizeRotation(angle: number): number {
  if (!Number.isFinite(angle)) return 0
  let normalized = angle % 360
  if (normalized < 0) normalized += 360
  return normalized
}
```

### 滤镜效果实现

滤镜系统通过像素级处理实现：

1. **滤镜类型**：支持13种预设滤镜
   - 复古、清新、黑白、高饱和、胶片、日系、冷色调、暖色调、怀旧、柔光、锐化、去雾

2. **滤镜应用流程**：
   - 获取图片的 ImageData（像素数据）
   - 遍历每个像素，应用滤镜算法
   - 根据强度参数混合原图和滤镜结果
   - 将处理后的数据写回 Canvas

3. **滤镜叠加**：支持同时叠加2种滤镜
   - 先应用第一种滤镜
   - 再在结果上应用第二种滤镜
   - 分别控制两种滤镜的强度

#### 前端算法计算逻辑

**滤镜强度混合算法**:

```typescript
// 保存原图数据
const originalData = new Uint8ClampedArray(originalImageData.data)

// 应用滤镜算法（修改 data 数组）
// ... 滤镜处理 ...

// 根据强度混合原图和滤镜结果
const strengthFactor = strength / 100
for (let i = 0; i < data.length; i += 4) {
  data[i] = Math.floor(
    data[i] * strengthFactor + originalData[i] * (1 - strengthFactor)
  )
  // 同样处理 g, b 通道
}
```

**具体滤镜算法示例**:

1. **复古滤镜**:

```typescript
// 降低饱和度，增加暖色调
const gray = r * 0.299 + g * 0.587 + b * 0.114  // 灰度值
data[i] = Math.min(255, gray * 0.7 + r * 0.3 + 20)    // 增加红色
data[i + 1] = Math.min(255, gray * 0.7 + g * 0.3 + 10)
data[i + 2] = Math.min(255, gray * 0.7 + b * 0.3)
```

2. **锐化滤镜**（使用卷积核）:

```typescript
const kernel = [
  0, -1, 0,
  -1, 5, -1,
  0, -1, 0
]
// 对每个像素应用3x3卷积核
for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    let r = 0, g = 0, b = 0
    for (let ky = -1; ky <= 1; ky++) {
      for (let kx = -1; kx <= 1; kx++) {
        const idx = ((y + ky) * width + (x + kx)) * 4
        const k = kernel[(ky + 1) * 3 + (kx + 1)]
        r += tempData[idx] * k
        // ... g, b 同样处理
      }
    }
    data[(y * width + x) * 4] = Math.max(0, Math.min(255, r))
  }
}
```

### 色彩调节实现

色彩调节通过像素级算法实现：

1. **调节参数**：
   - 亮度：0-200%（100%为原图）
   - 对比度：0-200%（100%为原图）
   - 饱和度：0-200%（100%为原图，0%为黑白）
   - 色温：0-200%（100%为原图，小于100%偏冷，大于100%偏暖）

2. **处理流程**：
   - 遍历每个像素的 RGB 值
   - 依次应用亮度、对比度、饱和度、色温调节
   - 确保值在 [0, 255] 范围内

#### 前端算法计算逻辑

**色彩调节算法** (`applyColorAdjust`):

```typescript
const brightnessFactor = brightness / 100
const contrastFactor = contrast / 100
const saturationFactor = saturation / 100
const tempFactor = colorTemperature / 100

for (let i = 0; i < data.length; i += 4) {
  let r = data[i], g = data[i + 1], b = data[i + 2]

  // 1. 亮度调节（线性乘法）
  r = r * brightnessFactor
  g = g * brightnessFactor
  b = b * brightnessFactor

  // 2. 对比度调节（以128为中心点）
  r = (r - 128) * contrastFactor + 128
  g = (g - 128) * contrastFactor + 128
  b = (b - 128) * contrastFactor + 128

  // 3. 饱和度调节（基于灰度值）
  const gray = r * 0.299 + g * 0.587 + b * 0.114  // RGB转灰度
  r = gray + (r - gray) * saturationFactor
  g = gray + (g - gray) * saturationFactor
  b = gray + (b - gray) * saturationFactor

  // 4. 色温调节
  if (tempFactor < 1) {
    // 冷色：减少红色，增加蓝色
    r = r * (1 - (1 - tempFactor) * 0.2)
    b = b * (1 + (1 - tempFactor) * 0.3)
  } else {
    // 暖色：增加红色，减少蓝色
    r = r * (1 + (tempFactor - 1) * 0.3)
    b = b * (1 - (tempFactor - 1) * 0.2)
  }

  // 限制在有效范围内
  data[i] = Math.max(0, Math.min(255, r))
  data[i + 1] = Math.max(0, Math.min(255, g))
  data[i + 2] = Math.max(0, Math.min(255, b))
}
```

### 弹幕渲染实现

弹幕系统通过 Canvas 渲染实现，核心逻辑如下：

1. **弹幕管理器 (DanmakuManager)**：
   - 使用 Map 存储所有弹幕实例，以弹幕ID为key
   - 使用 `trackMap` 按时间组织弹幕，便于快速查找当前时间段的弹幕
   - 使用 `scrollTracks` 管理滚动弹幕的轨道，避免重叠

2. **弹幕添加**：
   - 根据弹幕模式（顶部/底部/滚动）计算初始位置
   - 滚动弹幕从右侧进入，自动分配轨道避免重叠
   - 固定弹幕居中显示，自动计算垂直位置避免重叠
   - 测量文字宽度，计算弹幕尺寸

3. **弹幕更新**：每帧调用 `update()` 方法
   - 激活当前时间段的弹幕
   - 更新滚动弹幕的x坐标（根据速度和时间差）
   - 更新子弹幕位置（跟随父弹幕）
   - 移除已过期的弹幕

4. **弹幕渲染**：调用 `render()` 方法
   - 使用缓存的可见弹幕列表，提升性能
   - 遍历所有可见弹幕，使用 Canvas API 绘制
   - 绘制文字、背景、连接线（回复弹幕）

#### 前端算法计算逻辑

**弹幕位置计算**:

```typescript
// 测量文字宽度
ctx.font = `${fontSize}px ${fontFamily}`
const metrics = ctx.measureText(text)
const width = metrics.width
const height = fontSize

// 滚动弹幕：从右侧进入
if (mode === "scroll") {
  x = videoWidth  // 从右侧进入
  y = allocateScrollTrack(height) * trackHeight + height
}

// 固定弹幕：居中显示
if (mode === "top" || mode === "bottom") {
  x = (videoWidth - width) / 2  // 水平居中
  y = mode === "top" 
    ? allocateFixedTrack("top", height)
    : videoHeight - allocateFixedTrack("bottom", height) - height
}
```

**轨道分配算法**（避免重叠）:

```typescript
// 滚动弹幕轨道分配
allocateScrollTrack(danmakuHeight: number): number {
  const maxTracks = Math.floor(videoHeight / trackHeight)
  
  // 查找可用轨道
  for (let track = 0; track < maxTracks; track++) {
    const existing = scrollTracks.get(track)
    if (!existing || !existing.isVisible) {
      scrollTracks.set(track, danmaku)
      return track
    }
  }
  
  // 如果没有可用轨道，使用最旧的轨道
  return 0
}
```

**弹幕位置更新算法**:

```typescript
// 滚动弹幕位置更新
if (mode === "scroll") {
  danmaku.x -= speed * deltaTime  // 向左移动
  
  // 检查是否移出屏幕
  if (danmaku.x + danmaku.width < 0) {
    danmaku.isVisible = false
    // 释放轨道
    const track = Math.floor(danmaku.y / trackHeight)
    scrollTracks.set(track, null)
  }
}

// 子弹幕位置更新（跟随父弹幕）
if (danmaku.parentId) {
  const parent = danmakus.get(danmaku.parentId)
  if (parent && parent.isVisible) {
    danmaku.x = parent.x
    danmaku.y = parent.y + parent.height + 5  // 在父弹幕下方5px
  } else {
    danmaku.isVisible = false
  }
}
```

## 开发指南

### 环境准备

#### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

#### 后端开发

```bash
# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python main.py start --model lama --port 8080
```

### 项目结构

```
WeMediaGo/
├── iopaint/                 # 后端核心代码
│   ├── model/              # AI模型实现
│   ├── plugins/            # 插件系统
│   ├── api.py              # FastAPI接口
│   └── ...
├── web_app/                # 前端React应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── hooks/          # 自定义Hook
│   │   └── lib/            # 工具函数和状态管理
│   └── ...
└── docs/                   # 文档目录
```

### 核心功能模块

1. **模型管理器** (`model_manager.py`): 负责AI模型的加载和切换
2. **插件系统** (`plugins/`): 可扩展的插件架构
3. **文件管理器** (`file_manager/`): 图像文件的浏览和管理
4. **API接口** (`api.py`): RESTful API和WebSocket接口
5. **前端状态管理** (`lib/states.ts`): 统一的状态管理，支持撤销/重做

---

**最后更新**: 2024年

