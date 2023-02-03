import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { webUpdateNotice } from "@plugin-web-update-notification/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      versionType: "git_commit_hash",
      logVersion: true,
      checkInterval: 0.5 * 60 * 1000,
      notificationProps: {
        title: "📢  system update",
        description: "System update, please refresh the page",
        buttonText: "refresh",
        dismissButtonText: "dismiss",
      },
      notificationConfig: {
        primaryColor: "red",
        secondaryColor: "blue",
        placement: "topRight",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
