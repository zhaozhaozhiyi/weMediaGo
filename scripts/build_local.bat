@echo off
REM 本地构建脚本 - Windows版本

setlocal enabledelayedexpansion

echo =========================================
echo WeMediaGo 本地构建脚本 - Windows
echo =========================================

REM 检查Python环境
echo 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Python
    exit /b 1
)

REM 检查是否已安装PyInstaller
echo 检查PyInstaller...
python -c "import PyInstaller" >nul 2>&1
if errorlevel 1 (
    echo 正在安装PyInstaller...
    pip install pyinstaller
)

REM 构建前端
echo 构建前端...
cd web_app
if not exist "node_modules" (
    echo 安装前端依赖...
    call npm install
)
call npm run build

REM 复制前端文件到后端目录
echo 复制前端构建文件...
xcopy /E /I /Y dist\* ..\iopaint\web_app\

cd ..

REM 构建可执行文件
echo 使用PyInstaller构建可执行文件...
pyinstaller wemediago.spec --clean --noconfirm

echo =========================================
echo 构建完成！
echo 可执行文件位于: dist\wemediago\
echo =========================================

pause

