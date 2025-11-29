# WeMediaGo 文档中心

这是 WeMediaGo 项目的文档中心，使用 Docusaurus 构建。

## 开发

### 启动开发服务器

```bash
npm start
```

文档将在 http://localhost:3000 启动。

### 构建

```bash
npm run build
```

构建产物将输出到 `build/` 目录。

### 本地预览构建结果

```bash
npm run serve
```

## 集成说明

### 开发环境

文档中心已配置为通过 Vite 代理集成到主应用：

1. 启动 Docusaurus 开发服务器：
   ```bash
   cd docs-site
   npm start
   ```

2. 启动主应用开发服务器：
   ```bash
   cd web_app
   npm run dev
   ```

3. 通过主应用访问文档：
   - 访问 http://localhost:5173/docs 即可查看文档中心

### 生产环境

构建文档中心：

```bash
cd docs-site
npm run build
```

构建产物在 `docs-site/build/` 目录，可以：
- 部署到静态文件服务器
- 通过反向代理集成到主应用
- 复制到主应用的 `dist/docs/` 目录

## 文档结构

文档源文件位于项目根目录的 `docs/` 目录：

- `intro.md` - 文档中心首页
- `prd.md` - PRD 说明
- `ui-spec.md` - UI 说明
- `tech-spec.md` - 技术说明

## 配置

主要配置文件：
- `docusaurus.config.ts` - Docusaurus 主配置
- `sidebars.ts` - 侧边栏配置
- `src/css/custom.css` - 自定义样式
