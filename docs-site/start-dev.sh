#!/bin/bash

# 启动 Docusaurus 开发服务器的脚本

echo "正在启动 Docusaurus 文档中心..."
echo "文档将在 http://localhost:3000/docs/ 启动"
echo ""
echo "提示："
echo "1. 保持此终端窗口打开"
echo "2. 在另一个终端运行: cd web_app && npm run dev"
echo "3. 然后访问: http://localhost:5173/docs"
echo ""

cd "$(dirname "$0")"
npm start

