# 开发环境设置

## 重要提示

**必须先启动 Docusaurus 服务器，然后才能通过 Vite 代理访问文档！**

## 启动步骤

### 步骤 1: 启动 Docusaurus 服务器（第一个终端）

```bash
cd docs-site
npm start
```

或者使用便捷脚本：

```bash
./docs-site/start-dev.sh
```

等待看到以下输出表示启动成功：
```
[SUCCESS] Docusaurus website is running at: http://localhost:3000/docs/
```

### 步骤 2: 启动主应用服务器（第二个终端）

```bash
cd web_app
npm run dev
```

### 步骤 3: 访问文档中心

- **通过主应用访问**：http://localhost:5173/docs
- **直接访问 Docusaurus**：http://localhost:3000/docs/

## 故障排查

### HTTP 500 错误

如果看到 HTTP 500 错误，通常是因为 Docusaurus 服务器没有运行：

1. **检查 Docusaurus 是否在运行**：
   ```bash
   lsof -ti:3000
   ```
   如果没有输出，说明 Docusaurus 没有运行。

2. **启动 Docusaurus**：
   ```bash
   cd docs-site
   npm start
   ```

3. **检查端口占用**：
   ```bash
   lsof -ti:3000
   ```
   如果有输出但无法访问，可能是端口被其他程序占用。

### 代理错误

如果 Vite 控制台显示代理错误：
- 确保 Docusaurus 在 3000 端口运行
- 检查 `web_app/vite.config.ts` 中的代理配置
- 尝试直接访问 http://localhost:3000/docs/ 确认 Docusaurus 正常工作

### 路径问题

- Docusaurus 的 `baseUrl` 配置为 `/docs/`
- 访问时确保使用 `/docs/` 或 `/docs`（会自动重定向）
- 不要使用 `/docs/index` 或 `/docs/intro` 作为入口

