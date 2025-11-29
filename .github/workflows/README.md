# GitHub Actions 构建说明

本项目使用 GitHub Actions 自动为 macOS 和 Windows 平台构建可执行文件。

## 触发构建

### 方式1：推送版本标签（推荐）

推送以 `v` 开头的版本标签会自动触发构建并创建 Release：

```bash
git tag v1.0.0
git push origin v1.0.0
```

这将会：
- 在 macOS 和 Windows 上并行构建
- 构建完成后自动创建 GitHub Release
- 将两个平台的可执行文件上传到 Release

### 方式2：手动触发

1. 在 GitHub 仓库页面，进入 **Actions** 标签
2. 选择 **Build Executables** 工作流
3. 点击 **Run workflow**
4. 选择分支（通常是 `main` 或 `master`）
5. 输入版本号（可选，默认为 `dev`）
6. 点击 **Run workflow**

手动触发构建的产物将作为 Artifacts 保存，不会自动创建 Release。

## 构建产物

### Artifacts

构建完成后，可以在 Actions 页面下载 Artifacts：
- `wemediago-macos`: macOS 版本的压缩包
- `wemediago-windows`: Windows 版本的压缩包

Artifacts 会保留 30 天。

### Release

如果通过标签触发构建，会自动创建 Release，包含：
- `wemediago-macos-{version}.zip`: macOS 版本
- `wemediago-windows-{version}.zip`: Windows 版本

## 构建流程

1. **安装依赖**
   - Python 3.10
   - Node.js 18
   - Python 包（requirements.txt）
   - PyInstaller

2. **构建前端**
   - 安装前端依赖（npm ci）
   - 构建前端（npm run build）
   - 复制构建文件到后端目录

3. **打包可执行文件**
   - 使用 PyInstaller 打包
   - 生成平台特定的可执行文件

4. **打包发布**
   - 将可执行文件目录压缩为 zip
   - 上传到 Artifacts 或 Release

## 使用构建产物

### macOS

1. 下载 `wemediago-macos-{version}.zip`
2. 解压到任意目录
3. 运行 `wemediago` 可执行文件

### Windows

1. 下载 `wemediago-windows-{version}.zip`
2. 解压到任意目录
3. 运行 `wemediago.exe`

## 注意事项

- 首次运行可能需要下载模型文件
- 可执行文件体积较大（包含 Python 解释器和所有依赖）
- 首次启动可能需要一些时间
- 模型文件不会包含在可执行文件中，需要首次运行时下载

## 本地构建

如果需要本地构建，可以使用项目中的脚本：

**macOS/Linux:**
```bash
chmod +x scripts/build_local.sh
./scripts/build_local.sh
```

**Windows:**
```cmd
scripts\build_local.bat
```

本地构建的产物位于 `dist/wemediago/` 目录。

