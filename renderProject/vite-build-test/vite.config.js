import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 配置檔案現在由 HTML 動態載入，不再需要 inject plugin

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve'
  const isProd = mode === 'production'

  return {
    plugins: [
      react(),
      // 注入模式到 HTML
      {
        name: 'inject-mode',
        transformIndexHtml(html) {
          return html.replace(
            '<script>',
            `<script>window.__VITE_MODE__ = "${mode}";`
          )
        }
      }
    ],
    define: {
      __VITE_MODE__: JSON.stringify(mode),
      __IS_DEV__: isDev,
      __IS_PROD__: isProd
    },
    publicDir: 'public',
    server: {
      host: true // 允許外部訪問
    }
  }
})
