import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { webUpdateNotice } from 'vite-plugin-web-update-notification'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webUpdateNotice({
      logVersion: true,
      checkInterval: 0.5 * 60 * 1000,
    }),
  ],
})
