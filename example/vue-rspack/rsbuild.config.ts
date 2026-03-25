import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import { WebUpdateNotificationPlugin } from '@plugin-web-update-notification/rspack';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginVue()],
  tools: {
    rspack: {
      plugins: [
        new WebUpdateNotificationPlugin({
          logVersion: true,
          checkInterval: 0.5 * 60 * 1000,
          notificationProps: {
            title: '📢  system update',
            description: 'System update, please refresh the page',
            buttonText: 'refresh',
            dismissButtonText: 'dismiss',
          },
        }),
      ],
    },
  },
});
