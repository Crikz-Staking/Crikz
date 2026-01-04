import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 2000,
    target: 'esnext',
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore specific warnings from the 'ox' dependency
        if (warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('node_modules/ox')) {
          return;
        }
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', '@xenova/transformers']
  }
})