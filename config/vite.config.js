import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const configDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(configDir, '..')
const clientRoot = resolve(projectRoot, 'client')

export default defineConfig({
  root: clientRoot,
  publicDir: resolve(clientRoot, 'public'),
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: resolve(configDir, 'tailwind.config.js') }),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
