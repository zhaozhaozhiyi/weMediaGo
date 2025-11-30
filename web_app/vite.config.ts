import path from "path"
import { fileURLToPath } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 插件：确保路径别名正确解析文件扩展名
function aliasPlugin() {
  return {
    name: "alias-resolver",
    enforce: "pre",
    resolveId(id, importer) {
      if (id.startsWith("@/")) {
        const relativePath = id.replace("@/", "")
        const basePath = path.resolve(__dirname, "./src", relativePath)
        
        // 尝试不同的扩展名
        const extensions = [".ts", ".tsx", ".js", ".jsx"]
        for (const ext of extensions) {
          const fullPath = basePath + ext
          try {
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
              // 返回绝对路径
              return path.resolve(fullPath)
            }
          } catch (e) {
            // 忽略错误
          }
        }
        
        // 尝试目录索引文件
        try {
          if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
            for (const ext of extensions) {
              const indexPath = path.join(basePath, `index${ext}`)
              if (fs.existsSync(indexPath)) {
                return path.resolve(indexPath)
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
    aliasPlugin(),
    react({
      jsxRuntime: "automatic",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
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
