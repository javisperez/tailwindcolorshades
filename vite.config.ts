import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import icons from 'unplugin-icons/vite'
import pagesAnalytics from 'pages-analytics/vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/tailwindcolorshades/' : '/',
  plugins: [
    vue(),
    tailwindcss(),
    icons({
      autoInstall: true
    }),
    // Adds the analytics snippet at deploy time, using ANALYTICS_ID from the environment
    pagesAnalytics()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
