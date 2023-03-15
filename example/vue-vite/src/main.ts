import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(router);

app.mount("#app");

document.body.addEventListener("plugin_web_update_notice", (e) => {
  const { version, options } = e.detail;
  console.log("[12]-main.ts", version, options);
  alert("system update");
});
