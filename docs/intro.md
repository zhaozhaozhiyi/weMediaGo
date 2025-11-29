# WeMediaGo 文档中心

欢迎来到 WeMediaGo 文档中心！这里汇集了项目的所有文档，帮助您快速了解和使用 WeMediaGo 全媒体处理平台。

## 关于 WeMediaGo

WeMediaGo 是一个功能全面的全媒体处理平台，集成了图片、视频、音频三大媒体类型的编辑与处理能力。平台结合了最先进的AI图像修复技术与传统媒体编辑功能，采用现代Web架构设计，包含React前端和FastAPI后端。

## 文档导航

### 📋 产品文档

- **[PRD说明](./prd.md)** - 产品需求文档，包含详细的功能需求、用户故事和验收标准
- **[需求文档](./xuqiu.md)** - 项目需求与开发要求

### 🎨 设计文档

- **[UI说明](./ui-spec.md)** - UI设计规范，包含组件规范、颜色主题、交互规范等

### 💻 技术文档

- **[技术说明](./tech-spec.md)** - 技术架构、功能实现清单、技术选型说明和核心逻辑说明

## 快速开始

### 安装

```bash
pip3 install wemediago
```

### 启动Web界面

```bash
# CPU模式
wemediago start --model=lama --device=cpu --port=8080

# GPU模式
wemediago start --model=lama --device=cuda --port=8080
```

完成！您可以通过访问 http://localhost:8080 在浏览器中开始使用WeMediaGo。

## 相关链接

- [项目主页](https://github.com/Sanster/WeMediaGo) - GitHub 仓库
- [PyPI 包](https://pypi.org/project/wemediago) - Python 包发布

---

**最后更新**: 2024年

**文档维护**: WeMediaGo 团队

