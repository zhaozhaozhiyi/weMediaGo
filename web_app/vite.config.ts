import path from "path"
import { fileURLToPath } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 自定义插件：确保路径别名正确解析文件扩展名
const resolveAliasPlugin = () => {
  return {
    name: "resolve-alias-extensions",
    enforce: "pre", // 确保在其他解析器之前运行
    resolveId(source, importer) {
      // 只处理以 @/ 开头的路径
      if (source.startsWith("@/")) {
        const relativePath = source.replace("@/", "")
        const srcPath = path.resolve(__dirname, "./src", relativePath)
        
        // 尝试不同的扩展名
        const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts"]
        for (const ext of extensions) {
          const fullPath = srcPath + ext
          try {
            if (fs.existsSync(fullPath)) {
              return fullPath
            }
          } catch (e) {
            // 忽略错误，继续尝试下一个扩展名
          }
        }
        
        // 如果文件存在但没有扩展名（目录）
        try {
          if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
            const indexFiles = ["index.ts", "index.tsx", "index.js", "index.jsx"]
            for (const indexFile of indexFiles) {
              const indexPath = path.join(srcPath, indexFile)
              if (fs.existsSync(indexPath)) {
                return indexPath
              }
            }
          }
        } catch (e) {
          // 忽略错误
        }
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [
    resolveAliasPlugin(),
    react({
      jsxRuntime: "automatic",
    }),
  ],
  resolve: {
    // 移除别名配置，由插件处理
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".json"],
    preserveSymlinks: false,
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  server: {
    proxy: {
      '/docs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true, // 支持 WebSocket（如果需要）
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Docusaurus proxy error:', err);
            console.log('请确保 Docusaurus 服务器正在运行: cd docs-site && npm start');
          });
        },
      },
    },
  },
})
