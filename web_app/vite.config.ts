import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import react from "@vitejs/plugin-react"
import { defineConfig, Plugin } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 自定义插件：处理路径别名并添加文件扩展名
function aliasPlugin(): Plugin {
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".json"]
  const srcDir = path.resolve(__dirname, "./src")

  return {
    name: "alias-resolver",
    enforce: "pre", // 确保在其他插件之前运行
    resolveId(id, importer) {
      // 处理 @/ 开头的路径别名，或者已经被 resolve.alias 解析过的路径
      let relativePath: string
      let basePath: string

      if (id.startsWith("@/")) {
        relativePath = id.replace(/^@\//, "")
        basePath = path.resolve(srcDir, relativePath)
      } else if (id.startsWith(srcDir + "/")) {
        // 如果已经是绝对路径（被 alias 解析后），提取相对路径
        relativePath = path.relative(srcDir, id).replace(/\\/g, "/")
        basePath = id
      } else {
        return null
      }

      // 如果路径已经包含扩展名，先检查原始路径
      const hasExtension = extensions.some((ext) => id.endsWith(ext))
      if (hasExtension) {
        try {
          if (fs.existsSync(basePath)) {
            const stats = fs.statSync(basePath)
            if (stats.isFile()) {
              return basePath
            }
          }
        } catch (err) {
          // 忽略错误，继续尝试
        }
      }

      // 尝试添加各种扩展名（优先尝试 .ts 和 .tsx）
      const priorityExts = [".ts", ".tsx", ".js", ".jsx"]
      const otherExts = extensions.filter((ext) => !priorityExts.includes(ext))
      const orderedExts = [...priorityExts, ...otherExts]

      for (const ext of orderedExts) {
        const filePath = basePath + ext
        try {
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath)
            if (stats.isFile()) {
              // 返回绝对路径，使用 path.normalize 确保路径格式正确
              const normalizedPath = path.normalize(filePath)
              // 确保路径使用正确的分隔符（在 Windows 上可能有问题）
              return normalizedPath.replace(/\\/g, "/")
            }
          }
        } catch (err) {
          // 忽略文件系统错误，继续尝试下一个扩展名
          continue
        }
      }

      // 尝试作为目录查找 index 文件
      try {
        if (fs.existsSync(basePath)) {
          const stats = fs.statSync(basePath)
          if (stats.isDirectory()) {
            for (const ext of extensions) {
              const indexPath = path.join(basePath, `index${ext}`)
              if (fs.existsSync(indexPath)) {
                const indexStats = fs.statSync(indexPath)
                if (indexStats.isFile()) {
                  return path.normalize(indexPath).replace(/\\/g, "/")
                }
              }
            }
          }
        }
      } catch (err) {
        // 忽略错误
      }

      // 如果都找不到，返回 null 让 Vite 尝试其他解析方式
      // 不要抛出错误，因为可能有其他插件或配置能够处理
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
