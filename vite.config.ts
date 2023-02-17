import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3030,
  },
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: Infinity,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        rune: resolve(__dirname, 'rune.html')
      }
    }
  }
})
