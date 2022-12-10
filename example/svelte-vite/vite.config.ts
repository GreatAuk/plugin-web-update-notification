import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { webUpdateNotice } from '@plugin-web-update-notification/vite'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), webUpdateNotice({
    locale: 'zh_TW',
  })],
})
