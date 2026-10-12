import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "element-plus/theme-chalk/dark/css-vars.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { username } from "@/utils/user";
import {
  pullUserSettings,
  schedulePushUserSettings,
  SYNC_KEYS,
} from "@/utils/userSettings";

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(router);

// 个性化设置按用户名同步：浏览器里同步键被写入后，节流上报到后端
const originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = (key, value) => {
  originalSetItem(key, value);
  if (SYNC_KEYS.includes(key)) {
    schedulePushUserSettings();
  }
};

// 已知用户名时先载入该用户的设置（语言等需在挂载前生效），再挂载应用
async function bootstrap() {
  if (username.value) {
    await pullUserSettings();
  }
  app.mount("#app");
}

bootstrap();
