import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// GitHub Pages project site base. Override with VITE_BASE_PATH (e.g. "/" for custom domain).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/VILLAFUERTE_CHARLOTTE_PORTFOLIO/'

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
  }
})

