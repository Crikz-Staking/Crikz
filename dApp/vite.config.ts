import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // This is the critical fix for IPFS/Web3 Domains
  // It ensures all script and style paths start with "./" instead of "/"
  base: './', 

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // Ensures assets are organized predictably
    assetsDir: 'assets',
    // Prevents issues with large files in decentralized storage
    chunkSizeWarningLimit: 1000,
  }
})