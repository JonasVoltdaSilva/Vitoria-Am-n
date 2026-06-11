import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // base necessario para o GitHub Pages (github.io/nome-do-repo/)
  base: '/Vitoria-Am-n/',
  server: {
    port: 5173,
    host: true,
  },
})
