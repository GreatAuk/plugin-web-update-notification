# Custom Notification Text

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      notificationProps: {
        title: "system update",
        description: "System update, please refresh the page",
        buttonText: "refresh",
      },
    }),
  ],
});
```

