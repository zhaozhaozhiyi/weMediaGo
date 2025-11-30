## WeMediaGos 前端 UI 规范

> 版本：v0.2（基于现有前端代码抽取并更新）  
> 适用范围：`web_app` 前端（Tailwind + Radix + 自定义 UI 组件）

---

## 1. 设计基础

### 1.1 技术与结构

- **样式系统**：Tailwind CSS + `src/globals.css` 自定义设计 Token。
- **组件基座**：Radix UI（`dialog`, `tabs`, `slider`, `popover`, `select`, `switch`, `tooltip` 等）+ 本地封装组件（`src/components/ui/*`）。
- **主题机制**：
  - 默认浅色模式：使用 `:root` 中的 CSS 变量。
  - 深色模式：使用 `.dark` 类切换（Tailwind `darkMode: ["class"]`），通过 `next-themes` 管理，在 `<html>` 标签上添加 `.dark` 类来覆盖一组暗色 Token。

### 1.2 字体与排版

- **基础字体**：
  - `html { font-family: "Inter", "system-ui"; overflow: hidden; }`
  - 支持 `Inter var`（可变字体）：
    - `@supports (font-variation-settings: normal) { html { font-family: "Inter var", "system-ui"; } }`
- **字号层级**（约定）：
  - 页面正文、表单：`text-sm`。
  - 副标题/小标题：`text-base`。
  - Dialog 标题：`text-2xl font-semibold`。
- **字重约定**：
  - 正文：`font-normal`。
  - 按钮/标签：`font-medium`。
  - 标题：`font-semibold`。

### 1.3 圆角与边框

- 全局变量（见 `globals.css`）：
  - `--radius: 0.5rem;`
- Tailwind 映射（见 `tailwind.config.js`）：
  - `rounded-lg` → `var(--radius)`
  - `rounded-md` → `calc(var(--radius) - 2px)`
  - `rounded-sm` → `calc(var(--radius) - 4px)`
- 规范约定：
  - **表单、按钮、Tabs**：`rounded-md`。
  - **卡片、浮层（Dialog 等）**：`rounded-lg`。

### 1.4 间距系统（Spacing）

- **按钮高度**：
  - 默认按钮：`h-9 px-4 py-2`
  - 小号按钮：`h-8 rounded-md px-3 text-xs`
  - 大号按钮：`h-10 rounded-md px-8`
  - 图标按钮：`h-9 w-9`
- **输入框高度**：
  - 普通输入框：`h-8 px-3 py-1`
  - 数值输入框：`h-7 px-1`
- **页面与容器**：
  - Header：`h-[60px] px-6 py-4`，顶部绝对定位。
  - Dialog 内容：`p-6`。
- **元素间距**：
  - 工具栏/按钮组：`gap-1`。
  - 表单项与分组：推荐 `gap-2` / `gap-4`。

---

## 2. 颜色与主题 Token

### 2.1 CSS 变量定义

> 定义位置：`src/globals.css` 的 `@layer base { :root { ... } }` 与 `[data-theme='dark'] { ... }`

- **浅色主题（`:root`）**：
  - **基础**：
    - `--background: 0 0% 100%;`
    - `--foreground: 224 71.4% 4.1%;`
  - **卡片/浮层**：
    - `--card: 0 0% 100%;`
    - `--card-foreground: 224 71.4% 4.1%;`
    - `--popover: 0 0% 100%;`
    - `--popover-foreground: 224 71.4% 4.1%;`
  - **主色（Primary）**：
    - `--primary: 48 100.0% 50.0%;`（明亮黄橙）
    - `--primary-foreground: 210 20% 98%;`
  - **次要色 / 中性色**：
    - `--secondary: 220 14.3% 95.9%;`
    - `--secondary-foreground: 220.9 39.3% 11%;`
    - `--muted: 220 14.3% 95.9%;`
    - `--muted-foreground: 220 8.9% 46.1%;`
    - `--accent: 220 14.3% 95.9%;`
    - `--accent-foreground: 220.9 39.3% 11%;`
  - **错误/危险（Destructive）**：
    - `--destructive: 0 84.2% 60.2%;`
    - `--destructive-foreground: 210 20% 98%;`
  - **线框与焦点**：
    - `--border: 220 13% 91%;`
    - `--input: 220 13% 91%;`
    - `--ring: 224 71.4% 4.1%;`

- **深色主题（`.dark`）**：
  - 背景整体为深灰蓝系（Night Theme 风格）：
    - `--background: 220 25% 4%;`
    - `--foreground: 0 0% 98%;`
  - 卡片/浮层/中性色：
    - `--card: 220 28% 6%;`
    - `--card-foreground: 210 20% 98%;`
    - `--popover: 220 25% 4%;`
    - `--popover-foreground: 0 0% 98%;`
    - `--secondary: 220 20% 12%;`
    - `--secondary-foreground: 0 0% 98%;`
    - `--muted: 220 18% 14%;`
    - `--muted-foreground: 220 10% 65%;`
    - `--accent: 220 20% 12%;`
    - `--accent-foreground: 0 0% 98%;`
  - 主色 `--primary` 与浅色主题一致（保持品牌统一）：
    - `--primary: 48 100.0% 50.0%;`
    - `--primary-foreground: 220.9 39.3% 11%;`（深色主题下使用深色文字以保持对比度）
  - 错误/危险：
    - `--destructive: 0 62.8% 30.6%;`
    - `--destructive-foreground: 0 85.7% 97.3%;`
  - 边框与输入：
    - `--border: 220 18% 20%;`
    - `--input: 220 18% 20%;`
    - `--ring: 220 25% 70%;`

### 2.2 Tailwind 映射与使用

> 定义位置：`tailwind.config.js` → `theme.extend.colors`

- **颜色别名**：
  - `bg-background` / `text-foreground`
  - `border-border` / `border-input`
  - `bg-primary` / `text-primary-foreground`
  - `bg-secondary` / `text-secondary-foreground`
  - `bg-muted` / `text-muted-foreground`
  - `bg-accent` / `text-accent-foreground`
  - `bg-card` / `text-card-foreground`
  - `bg-popover` / `text-popover-foreground`
- **使用规范**：
  - 页面背景：`body` 使用 `bg-background text-foreground`。
  - 主操作按钮：`bg-primary text-primary-foreground`。
  - 次要按钮 / 轻量块：`bg-secondary`, `bg-muted`。
  - 选中高亮：`bg-accent`, `text-accent-foreground`。
  - 错误/警告：`bg-destructive`, `text-destructive-foreground`。

---

## 3. 交互与无障碍

### 3.1 焦点状态

- 统一使用 Tailwind 的 `focus-visible` 规范：
  - `focus-visible:outline-none`
  - `focus-visible:ring-1 focus-visible:ring-ring`
  - 对需要明显焦点环的组件可加：
    - `focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background`
- 适用组件：`Button`, `Input`, `TabsTrigger`, `DialogClose`, `SliderThumb` 等。

### 3.2 禁用态

- 统一禁用样式：
  - `disabled:pointer-events-none disabled:opacity-50`
- 适用场景：
  - 处理中/不可用的按钮与输入。
  - 不可用的 Tab、Slider 等控件：
    - `data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50`

### 3.3 动画与过渡

- 使用 `tailwindcss-animate` 插件。
- 常见模式：
  - 打开/关闭：
    - `data-[state=open]:animate-in`
    - `data-[state=closed]:animate-out`
  - 常配合：
    - `fade-in-0`, `fade-out-0`
    - `zoom-in-95`, `zoom-out-95`
    - `slide-in-from-left-1/2` 等。

### 3.4 快捷键干扰控制

- 在 `Input` 组件中统一处理（见 `components/ui/input.tsx`）：
  - `onFocus`：全局 `disableShortCuts: true`
  - `onBlur`：全局 `disableShortCuts: false`
- 规范要求：
  - 所有会接收键盘输入的控件（文本、数字、搜索）**必须复用**该 Input/NumberInput，而非直接使用原生 `<input>`，以避免与画布快捷键冲突。

---

## 4. 通用 UI 组件规范

> 所有通用组件统一放在 `src/components/ui/` 下，推荐在业务代码中只使用这些封装。

### 4.1 Button 系列

- 定义位置：`src/components/ui/button.tsx`
- **基础样式**：
  - `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50`
- **Variant（语义）**：
  - `default`：主操作
    - `bg-primary text-primary-foreground shadow hover:bg-primary/90`
  - `destructive`：危险操作
    - `bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90`
  - `outline`：次级操作 / 附属功能
    - `border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground`
  - `secondary`：辅助操作
    - `bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80`
  - `ghost`：极轻量操作（常用于图标按钮）
    - `hover:bg-accent hover:text-accent-foreground`
  - `link`：文字链接样式
    - `text-primary underline-offset-4 hover:underline`
- **Size（尺寸）**：
  - `default`: `h-9 px-4 py-2`
  - `sm`: `h-8 rounded-md px-3 text-xs`
  - `lg`: `h-10 rounded-md px-8`
  - `icon`: `h-9 w-9`
- **扩展组件**：
  - `IconButton`：
    - 图标专用按钮，默认 `variant="ghost" size="icon"`，配合 Tooltip。
    - 内部包裹 `.icon-button-icon-wrapper`，统一图标 `stroke-width`。
  - `ImageUploadButton`：
    - 图片上传按钮，封装隐藏的 `<Input type="file">` 和 `IconButton`。
    - 规范：所有图片文件上传入口应统一使用该组件。

### 4.2 Input & NumberInput & Textarea

- 定义位置：`src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`
- **Input 基础样式**：
  - `flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`
  - `autoComplete="off"`, `tabIndex={-1}`。
  - **快捷键控制**：在 `onFocus` 时设置全局 `disableShortCuts: true`，`onBlur` 时恢复，避免与画布快捷键冲突。
- **NumberInput**：
  - 仅允许数字或小数（可通过 `allowFloat` 控制）。
  - 受控组件：通过 `numberValue` 和 `onNumberValueChange` 进行双向绑定。
  - 额外样式：
    - `className={cn("text-center h-7 px-1", className)}`
- **Textarea**：
  - 多行文本输入，样式：
    - `flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 overflow-auto`
  - 同样具备快捷键控制机制（`onFocus`/`onBlur`）。
  - `tabIndex={-1}`。
- 使用规范：
  - 通用文本/搜索输入：`Input`。
  - 参数/数值输入（如半径、比例、强度）：`NumberInput`。
  - 多行文本、描述、提示等：`Textarea`。

### 4.3 Tabs（选项卡）

- 定义位置：`src/components/ui/tabs.tsx`
- **TabsList**：
  - `inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground`
- **TabsTrigger**：
  - `inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow`
- **TabsContent**：
  - `mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- 使用建议：
  - 用于编辑模式、工具栏类型等**同一层级模式切换**。
  - Trigger 文案尽量简短，避免换行。

### 4.4 Dialog（弹窗）

- 定义位置：`src/components/ui/dialog.tsx`
- **Overlay**：
  - `fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0`
- **Content**：
  - 居中：`fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`
  - 宽度：`w-full max-w-lg`
  - 布局：`flex flex-col gap-4 border bg-background p-6 shadow-lg sm:rounded-lg`
  - 动画：配合 `zoom-in-95`、`slide-in` 等数据态动画。
- **Header / Footer / Title / Description**：
  - `DialogHeader`: `flex flex-col space-y-1.5 text-center sm:text-left`
  - `DialogFooter`: `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`
  - `DialogTitle`: `text-2xl font-semibold leading-none tracking-tight`
  - `DialogDescription`: `text-sm text-muted-foreground`
- 使用建议：
  - 模型设置、导出确认、破坏性操作等使用 Dialog。
  - 主按钮放在右下，使用 `variant="default"`；取消/关闭为 `secondary` 或 `outline`。

### 4.5 Slider（滑块）

- 定义位置：`src/components/ui/slider.tsx`
- **样式**：
  - Root：`relative flex w-full touch-none select-none items-center`
  - Track：`relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50`
  - Range：`absolute h-full bg-primary`
  - Thumb：`block h-4 w-4 rounded-full border border-primary/60 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[disabled]:cursor-not-allowed`
- 使用建议：
  - 连续值控制（缩放、透明度、亮度、对比度等）统一使用该组件。
  - 建议与 `NumberInput` 搭配，支持精确输入。

### 4.6 Select（选择器）

- 定义位置：`src/components/ui/select.tsx`
- **SelectTrigger**：
  - `flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent pl-2 pr-1 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50`
  - 内置图标：`CaretSortIcon`（右侧下拉箭头）。
- **SelectContent**：
  - `relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md` + 动画类。
  - 支持 `position="popper"` 定位。
- **SelectItem**：
  - `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50`
  - 选中时显示 `CheckIcon`。
- 使用建议：
  - 下拉选择场景（模型选择、预设选择等）统一使用该组件。

### 4.7 Switch（开关）

- 定义位置：`src/components/ui/switch.tsx`
- **样式**：
  - Root：`peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input`
  - Thumb：`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0`
- 使用建议：
  - 布尔值开关（启用/禁用功能）统一使用该组件。

### 4.8 Popover（弹出层）

- 定义位置：`src/components/ui/popover.tsx`
- **PopoverContent**：
  - `z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none` + 动画类。
  - 默认 `align="center"`, `sideOffset={4}`。
- 使用建议：
  - 悬停提示、上下文菜单、轻量信息展示等场景。

### 4.9 Sheet（侧边栏抽屉）

- 定义位置：`src/components/ui/sheet.tsx`
- **SheetContent**：
  - 基础：`fixed gap-4 bg-background p-6 shadow-lg transition ease-in-out`
  - 支持 `side` 变体：`top`, `bottom`, `left`, `right`（默认 `right`）。
  - 右侧抽屉：`inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm` + 滑入动画。
- **SheetHeader / SheetFooter**：
  - 布局与 `DialogHeader` / `DialogFooter` 一致。
- **SheetTitle / SheetDescription**：
  - `SheetTitle`: `text-lg font-semibold text-foreground`
  - `SheetDescription`: `text-sm text-muted-foreground`
- 使用建议：
  - 侧边栏面板、设置面板等场景使用。

### 4.10 Tooltip（工具提示）

- 定义位置：`src/components/ui/tooltip.tsx`
- **TooltipContent**：
  - `z-[100] border overflow-hidden rounded-md bg-background text-foreground px-3 py-1.5 text-xs` + 动画类。
  - 默认 `sideOffset={4}`。
- **TooltipProvider**：
  - 需要在应用根节点包裹 `TooltipProvider`。
- 使用建议：
  - 按钮、图标等元素的悬停提示统一使用该组件。
  - 与 `IconButton` 结合使用，提供无障碍说明。

### 4.11 Progress（进度条）

- 定义位置：`src/components/ui/progress.tsx`
- **样式**：
  - Root：`relative h-2 w-full overflow-hidden rounded-full bg-primary/20`
  - Indicator：`h-full w-full flex-1 bg-primary transition-all`
- 使用建议：
  - 处理进度、加载进度等场景统一使用该组件。

### 4.12 Label（标签）

- 定义位置：`src/components/ui/label.tsx`
- **样式**：
  - `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none`
- 使用建议：
  - 表单标签、输入框标签等场景统一使用该组件。

### 4.13 Toast（提示消息）

- 定义位置：`src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`
- **Toast**：
  - 基础：`group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all` + 滑动动画。
  - Variant：
    - `default`: `border bg-background text-foreground`
    - `destructive`: `border-destructive bg-destructive text-destructive-foreground`
- **ToastViewport**：
  - `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]`
- **ToastTitle / ToastDescription**：
  - `ToastTitle`: `text-sm font-semibold [&+div]:text-xs`
  - `ToastDescription`: `text-sm opacity-90`
- 使用建议：
  - 成功提示、错误提示、操作反馈等场景统一使用 `useToast` Hook 调用。

---

## 5. 布局与页面结构

### 5.1 Header 区域

- 定义位置：`src/components/Header.tsx`
- 样式：
  - `h-[60px] px-6 py-4 absolute top-[0] flex justify-between items-center w-full z-20 border-b backdrop-filter backdrop-blur-md bg-background/70`
- 结构：
  - 左：
    - Logo 与标题（WeMediaGo）。
    - 媒体类型切换 Tabs（图片/视频/音频）。
    - 分隔符。
    - 文件管理器（如启用）。
    - 媒体文件上传按钮（`ImageUploadButton`，支持 `image/*,video/*,audio/*`）。
    - 自定义 Mask 上传及预览（条件显示）。
    - 重新应用上一次遮罩按钮（条件显示）。
  - 中：根据当前模型是否需要 Prompt 决定是否展示 `PromptInput`。
  - 右：
    - 文档中心按钮（`BookOpen` 图标）。
    - `ThemeToggle`（主题切换）。
    - `Shortcuts`（快捷键帮助）。
    - `SettingsDialog`（模型/插件配置，如未禁用模型切换）。

### 5.2 全局样式约定

- `body`：
  - `@apply bg-background text-foreground;`
- 第三方组件适配：
  - `react-photo-album`：
    - 外层：`padding: 8px;`
    - 图片：`border-radius: 8px;`，hover 时有 `transform: scale(1.03); border: 1px solid var(--border);`
  - `react-transform-wrapper`：
    - `display: grid !important; width: 100% !important; height: 100% !important;` 保证画布区域填满。
- 特殊样式类：
  - `.icon-button-icon-wrapper svg { stroke-width: 1px; }`：统一图标按钮内的图标线条宽度。
  - `.bg-grid-slate-100`：网格背景图案，用于画布或预览区域。

---

## 6. 命名与使用规范

### 6.1 目录与命名

- 页面/布局级组件：`src/components/Workspace.tsx`, `Header.tsx`, `Landing.tsx` 等。
- 功能组件：`Cropper`, `Editor`, `Extender`, `InteractiveSeg`, `Plugins`, `Settings`, `FileManager`, `PromptInput`, `Shortcuts`, `ThemeToggle` 等。
- 业务组件目录：
  - `SidePanel/`：侧边栏面板组件（`BrushOptions`, `DiffusionOptions`, `CropOptions` 等）。
  - `AudioPlayer/`：音频播放器相关组件。
  - `VideoPlayer/`：视频播放器相关组件。
- 通用 UI 组件：统一在 `src/components/ui/` 下维护。

### 6.2 推荐实践

- **优先复用 UI 组件**：新功能优先从 `ui/` 中选用或扩展组件，而不是业务组件内重新堆 Tailwind 类。
- **保持 Token 一致**：新增颜色、圆角、间距时，优先扩展 `globals.css` / `tailwind.config.js`，避免硬编码。
- **交互一致性**：
  - 所有受焦点影响的控件遵循统一焦点环样式。
  - 禁用态统一使用 `disabled:pointer-events-none disabled:opacity-50`。
  - 输入类组件统一通过 `Input` / `NumberInput` / `Textarea` 控制全局快捷键状态。
  - 所有交互元素统一使用 `tabIndex={-1}` 以控制键盘导航行为。
- **主题切换**：
  - 使用 `ThemeToggle` 组件或 `next-themes` 的 `useTheme` Hook 进行主题管理。
  - 深色模式通过 `.dark` 类在 `<html>` 标签上切换。
- **图标与按钮**：
  - 图标按钮统一使用 `IconButton` 组件，配合 `Tooltip` 提供无障碍说明。
  - 文件上传统一使用 `ImageUploadButton` 组件（支持自定义 `accept` 属性）。

---

## 7. 组件清单

### 7.1 已实现的基础 UI 组件

以下组件位于 `src/components/ui/` 目录：

- **表单类**：`Input`, `NumberInput`, `Textarea`, `Select`, `Switch`, `Label`, `Form`
- **按钮类**：`Button`, `IconButton`, `ImageUploadButton`, `Toggle`
- **布局类**：`Tabs`, `Separator`, `ScrollArea`
- **浮层类**：`Dialog`, `Sheet`, `Popover`, `Tooltip`, `AlertDialog`, `DropdownMenu`, `ContextMenu`
- **反馈类**：`Toast`, `Progress`
- **其他**：`Accordion`, `RadioGroup`

### 7.2 组件依赖关系

- `Button` → `Tooltip`（`IconButton` 内部使用）
- `Toast` → 需要在应用根节点添加 `<Toaster />` 组件
- `Tooltip` → 需要在应用根节点添加 `<TooltipProvider />`
- `Form` → `Label`、`Input` 等表单组件

## 8. 后续迭代建议

1. **组件文档化**：为每个 `ui/*` 组件补充 Storybook 或简单的示例页面，对应到此文档的章节。
2. **状态设计**：为按钮、输入、Slider 等补充 Hover/Active/Focus/Loading 等状态的可视稿。
3. **尺寸体系**：在 PRD 中补充「组件尺寸表」，与本规范中列出的高度/间距对齐。
4. **主题扩展**：后续如有品牌升级，可在不改 Tailwind 类名的情况下，只通过修改 `:root` / `.dark` 中的 Token 完成换肤。
5. **无障碍性**：补充键盘导航、屏幕阅读器支持等无障碍特性的使用规范。
6. **响应式设计**：补充移动端、平板端的布局和交互适配规范。



