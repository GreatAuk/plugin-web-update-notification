import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
window.pluginWebUpdateNotice_.onClickDismiss = (version) => {
  alert(version);
};
app.use(router);

app.mount("#app");
