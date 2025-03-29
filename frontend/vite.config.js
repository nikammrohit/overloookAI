import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for Electron
  build: {
    outDir: 'dist', // Output directory for the build
    emptyOutDir: true, // Clears the output directory before building
  },
})
