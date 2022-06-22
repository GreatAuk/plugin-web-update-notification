import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { webUpdateNotice } from 'vite-plugin-web-update-notification'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), webUpdateNotice()],
})
