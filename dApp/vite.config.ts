// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
  ],
  // If you are deploying to a subdirectory, 'base: "./"' is crucial, but for dev, 
  // keeping it simple is best. Ensure no absolute path is breaking the link.
})