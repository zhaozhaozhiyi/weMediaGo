import path from "path"
import { fileURLToPath } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 插件：确保路径别名正确解析文件扩展名
function aliasPlugin() {
  const resolvedPaths = new Map<string, string>()
  const srcPath = path.resolve(__dirname, "./src")
  
  return {
    name: "alias-resolver",
    enforce: "pre",
    resolveId(id, importer) {
      let targetPath: string | null = null
      
      // 处理 @/ 开头的路径
      if (id.startsWith("@/")) {
        targetPath = path.resolve(__dirname, "./src", id.replace("@/", ""))
      }
      // 处理已经通过 alias 解析但缺少扩展名的路径
      else if (id.startsWith(srcPath) && !path.extname(id)) {
        targetPath = id
      }
      
      if (targetPath) {
        // 检查缓存
        if (resolvedPaths.has(id)) {
          return resolvedPaths.get(id)!
        }
        
        // 尝试不同的扩展名
        const extensions = [".ts", ".tsx", ".js", ".jsx", ".json"]
        for (const ext of extensions) {
          const fullPath = targetPath + ext
          try {
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
              // 返回绝对路径，确保包含扩展名
              const resolved = path.resolve(fullPath)
              resolvedPaths.set(id, resolved)
              return resolved
            }
          } catch (e) {
            // 忽略错误
          }
        }
        
        // 尝试目录索引文件
        try {
          if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
            for (const ext of extensions) {
              const indexPath = path.join(targetPath, `index${ext}`)
              if (fs.existsSync(indexPath)) {
                const resolved = path.resolve(indexPath)
                resolvedPaths.set(id, resolved)
                return resolved
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
    // 完全由插件处理路径别名，不在这里配置
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
