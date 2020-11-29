import { createApp } from "vue";
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";

import "./assets/css/tailwind.css";

createApp(App)
  .use(router)
  .mount("#app");
