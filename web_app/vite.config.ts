import path from "path"
import { fileURLToPath } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    tsconfigPaths({
      // 明确指定根目录和配置文件
      root: __dirname,
      projects: [path.resolve(__dirname, "./tsconfig.json")],
    }),
    react({
      jsxRuntime: "automatic",
    }),
  ],
  resolve: {
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
