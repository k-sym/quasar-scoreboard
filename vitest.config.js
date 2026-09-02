import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
      stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url))
    }
  },
  test: {
    environment: './test/vite-client-env.js',
    setupFiles: ['./test/setup.js']
  }
})
