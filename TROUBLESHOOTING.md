# 连接错误解决方案

## 错误现象

```
GET http://127.0.0.1:8080/socket.io/?EIO=4&transport=polling&t=... net::ERR_CONNECTION_REFUSED
GET http://127.0.0.1:8080/api/v1/server-config net::ERR_CONNECTION_REFUSED
```

## 问题原因

前端正在尝试连接到后端服务器 `http://127.0.0.1:8080`，但后端服务器没有运行。

## 解决步骤

### 1. 启动后端服务器

**在项目根目录打开一个新的终端窗口**，运行：

```bash
# CPU 模式
python3 main.py start --model=lama --device=cpu --port=8080

# 或者 GPU 模式（如果有 GPU）
python3 main.py start --model=lama --device=cuda --port=8080
```

**等待后端启动完成**，你会看到类似以下输出：

```
INFO:     Uvicorn running on http://127.0.0.1:8080 (Press CTRL+C to quit)
```

> ⚠️ **重要**：保持这个终端窗口运行，不要关闭。后端需要持续运行才能提供 API 服务。

### 2. 验证后端已启动

在浏览器中访问以下地址验证后端是否正常运行：

- **API 文档**: http://localhost:8080/docs
- **服务器配置**: http://localhost:8080/api/v1/server-config

如果能看到 API 文档页面或返回 JSON 配置，说明后端已成功启动。

### 3. 刷新前端页面

后端启动后，刷新前端页面（F5 或 Cmd+R），连接错误应该消失。

## 当前配置状态

✅ 前端环境变量配置正确（`.env.local` 已设置）
✅ Python 环境可用
✅ 模型文件存在

❌ 后端服务器未运行

## 启动顺序

```
1. 启动后端服务器（终端 1）
   ↓
2. 等待看到 "Uvicorn running on http://127.0.0.1:8080"
   ↓
3. 启动前端服务器（终端 2，如果还没有启动）
   ↓
4. 访问 http://localhost:5173
```

## 其他可能的问题

### 如果后端启动失败

检查以下几点：

1. **Python 依赖是否已安装**：
   ```bash
   pip install -r requirements.txt
   ```

2. **端口 8080 是否被占用**：
   ```bash
   lsof -i :8080
   ```
   如果端口被占用，可以修改端口：
   ```bash
   python3 main.py start --model=lama --device=cpu --port=8081
   ```
   然后更新 `.env.local`：
   ```
   VITE_BACKEND=http://127.0.0.1:8081
   ```

3. **模型文件是否正确**：
   ```bash
   ls -lh models/lama/big-lama.pt
   ```

### 如果仍然无法连接

1. 检查防火墙设置
2. 确认 `.env.local` 中的地址与后端实际运行的地址一致
3. 查看浏览器控制台是否有其他错误信息
4. 查看后端终端是否有错误日志

