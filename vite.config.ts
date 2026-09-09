import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// serudio.github.io is a user page served from the domain root,
// so the base path is always '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
