import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3030,
  },
  plugins: [react()],
  resolve:{
    alias:{
      'src' : resolve(__dirname, './src')
    },
  },
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
