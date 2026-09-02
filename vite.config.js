import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  test: {
    // e2e/ belongs to Playwright; Vitest only runs the unit suites.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
