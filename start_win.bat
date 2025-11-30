@echo off
chcp 65001 >nul
title WeMediaGo 一键启动

echo ==========================================
echo   WeMediaGo 一键启动
echo ==========================================
echo.

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM 检查 Python 环境
where python >nul 2>&1
if %errorlevel% neq 0 (
    where python3 >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ 错误: 未找到 Python，请先安装 Python 3.7+
        pause
        exit /b 1
    )
    set PYTHON_CMD=python3
) else (
    set PYTHON_CMD=python
)

REM 检查 Node.js 环境
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

REM 定义端口
set BACKEND_PORT=8080
set FRONTEND_PORT=5173
set DOCS_PORT=3000

echo 正在启动服务...
echo.

REM 启动后端服务（新窗口）
echo 🚀 启动后端服务 (端口 %BACKEND_PORT%)...
start "WeMediaGo 后端服务" cmd /k "%PYTHON_CMD% main.py start --model=lama --device=cpu --port=%BACKEND_PORT%"

REM 等待后端启动
echo    等待后端启动...
timeout /t 5 /nobreak >nul

REM 启动前端服务（新窗口）
echo 🚀 启动前端服务 (端口 %FRONTEND_PORT%)...
start "WeMediaGo 前端服务" cmd /k "cd /d %SCRIPT_DIR%web_app && npm run dev"

REM 等待前端启动
echo    等待前端启动...
timeout /t 5 /nobreak >nul

REM 启动文档中心（新窗口）
echo 🚀 启动文档中心 (端口 %DOCS_PORT%)...
start "WeMediaGo 文档中心" cmd /k "cd /d %SCRIPT_DIR%docs-site && npm start"

REM 等待文档中心启动
echo    等待文档中心启动...
timeout /t 8 /nobreak >nul

echo.
echo ==========================================
echo   ✅ 所有服务已启动！
echo ==========================================
echo.
echo 访问地址：
echo   📱 应用首页:    http://localhost:%FRONTEND_PORT%
echo   🔧 应用后端:    http://localhost:%BACKEND_PORT%
echo   📚 文档中心:    http://localhost:%DOCS_PORT%
echo.
echo 正在打开浏览器首页...
echo.

REM 打开浏览器 - 只打开前端首页
timeout /t 2 /nobreak >nul
start http://localhost:%FRONTEND_PORT%

echo.
echo 💡 提示：
echo   - 服务已在独立命令窗口中运行
echo   - 关闭命令窗口即可停止对应服务
echo   - 从首页可以跳转到应用页面和文档中心
echo.
pause

