#!/bin/bash

# WeMediaGo 一键启动脚本 (macOS/Linux)
# 启动后端、前端和文档中心，并自动打开浏览器

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  WeMediaGo 一键启动"
echo "=========================================="
echo ""

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3，请先安装 Python 3.7+"
    exit 1
fi

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 node，请先安装 Node.js 18+"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 定义端口
BACKEND_PORT=8080
FRONTEND_PORT=5173
DOCS_PORT=3000

# 函数：检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 检查端口是否被占用
if check_port $BACKEND_PORT; then
    echo "⚠️  警告: 端口 $BACKEND_PORT 已被占用，后端可能已在运行"
fi
if check_port $FRONTEND_PORT; then
    echo "⚠️  警告: 端口 $FRONTEND_PORT 已被占用，前端可能已在运行"
fi
if check_port $DOCS_PORT; then
    echo "⚠️  警告: 端口 $DOCS_PORT 已被占用，文档中心可能已在运行"
fi

echo ""
echo "正在启动服务..."
echo ""

# 启动后端服务（新终端窗口）
echo "🚀 启动后端服务 (端口 $BACKEND_PORT)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR' && python3 main.py start --model=lama --device=cpu --port=$BACKEND_PORT\"" 2>/dev/null || {
    # 如果 osascript 失败，尝试使用 gnome-terminal (Linux)
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$SCRIPT_DIR' && python3 main.py start --model=lama --device=cpu --port=$BACKEND_PORT; exec bash"
    else
        # 后台运行
        python3 main.py start --model=lama --device=cpu --port=$BACKEND_PORT > /tmp/wemediago_backend.log 2>&1 &
        BACKEND_PID=$!
        echo "   后端 PID: $BACKEND_PID"
    fi
}

# 等待后端启动
echo "   等待后端启动..."
sleep 5

# 启动前端服务（新终端窗口）
echo "🚀 启动前端服务 (端口 $FRONTEND_PORT)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/web_app' && npm run dev\"" 2>/dev/null || {
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$SCRIPT_DIR/web_app' && npm run dev; exec bash"
    else
        cd web_app
        npm run dev > /tmp/wemediago_frontend.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        echo "   前端 PID: $FRONTEND_PID"
    fi
}

# 等待前端启动
echo "   等待前端启动..."
sleep 5

# 启动文档中心（新终端窗口）
echo "🚀 启动文档中心 (端口 $DOCS_PORT)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/docs-site' && npm start\"" 2>/dev/null || {
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$SCRIPT_DIR/docs-site' && npm start; exec bash"
    else
        cd docs-site
        npm start > /tmp/wemediago_docs.log 2>&1 &
        DOCS_PID=$!
        cd ..
        echo "   文档中心 PID: $DOCS_PID"
    fi
}

# 等待文档中心启动
echo "   等待文档中心启动..."
sleep 8

echo ""
echo "=========================================="
echo "  ✅ 所有服务已启动！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  📱 应用首页:    http://localhost:$FRONTEND_PORT"
echo "  🔧 应用后端:    http://localhost:$BACKEND_PORT"
echo "  📚 文档中心:    http://localhost:$DOCS_PORT"
echo ""
echo "正在打开浏览器首页..."
echo ""

# 打开浏览器 - 只打开前端首页
sleep 2
open "http://localhost:$FRONTEND_PORT" 2>/dev/null || xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "请手动打开浏览器访问: http://localhost:$FRONTEND_PORT"

echo ""
echo "💡 提示："
echo "  - 服务已在独立终端窗口中运行"
echo "  - 关闭终端窗口即可停止对应服务"
echo "  - 从首页可以跳转到应用页面和文档中心"
echo ""

