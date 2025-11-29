#!/bin/bash
# IOPaint 模型下载进度监控脚本

echo "=== IOPaint 模型下载进度监控 ==="
echo "按 Ctrl+C 退出"
echo ""

while true; do
    clear
    echo "=== IOPaint 模型下载进度监控 ==="
    echo "当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    echo "📦 模型文件状态:"
    files=$(ls -lh ~/.cache/torch/hub/checkpoints/big-lama.pt* 2>/dev/null)
    if [ -n "$files" ]; then
        echo "$files" | while read line; do
            size=$(echo "$line" | awk '{print $5}')
            file=$(echo "$line" | awk '{print $9}')
            if [[ "$file" == *.partial ]]; then
                echo "  ⏳ 下载中: $size - $(basename $file)"
            else
                echo "  ✅ 完成: $size - $(basename $file)"
            fi
        done
        # 计算总大小
        total_size=$(du -sh ~/.cache/torch/hub/checkpoints/big-lama.pt* 2>/dev/null | awk '{print $1}')
        echo "  总大小: $total_size / 目标: ~196M"
    else
        echo "  ⏳ 等待下载开始..."
    fi
    
    echo ""
    echo "🖥️  服务进程状态:"
    process=$(ps aux | grep -E "[p]ython.*main.py" | head -1)
    if [ -n "$process" ]; then
        pid=$(echo "$process" | awk '{print $2}')
        cpu=$(echo "$process" | awk '{print $3}')
        mem=$(echo "$process" | awk '{print $4}')
        echo "  ✅ 运行中 - PID: $pid  CPU: ${cpu}%  MEM: ${mem}%"
    else
        echo "  ❌ 服务未运行"
    fi
    
    echo ""
    echo "🌐 服务访问:"
    if curl -s -m 1 http://localhost:8080 > /dev/null 2>&1; then
        echo "  ✅ 服务已就绪 - http://localhost:8080"
    else
        echo "  ⏳ 服务初始化中..."
    fi
    
    echo ""
    echo "按 Ctrl+C 退出监控"
    sleep 3
done


