import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: set base to your repo name
// e.g., if repo is https://github.com/user/agentic-cpq-platform
// base should be '/agentic-cpq-platform/'
export default defineConfig({
  base: '/agentic-cpq-platform/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
