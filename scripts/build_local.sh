#!/bin/bash
# 本地构建脚本 - 用于在本地使用PyInstaller构建可执行文件

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "========================================="
echo "WeMediaGo 本地构建脚本"
echo "========================================="

# 检查Python环境
echo "检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 python3"
    exit 1
fi

# 检查是否已安装PyInstaller
echo "检查PyInstaller..."
if ! python3 -c "import PyInstaller" 2>/dev/null; then
    echo "正在安装PyInstaller..."
    pip3 install pyinstaller
fi

# 构建前端
echo "构建前端..."
cd web_app
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi
npm run build

# 复制前端文件到后端目录
echo "复制前端构建文件..."
cp -r dist/* ../iopaint/web_app/
cd "$PROJECT_ROOT"

# 构建可执行文件
echo "使用PyInstaller构建可执行文件..."
pyinstaller wemediago.spec --clean --noconfirm

echo "========================================="
echo "构建完成！"
echo "可执行文件位于: dist/wemediago/"
echo "========================================="

