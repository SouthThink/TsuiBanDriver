import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://100.123.128.116:8888",
        // target: 'http://192.168.10.37:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/yzr": {
        target: "http://191.0.0.17:5000",
        // target: "http://192.168.10.37:5000",
        // target: "http://100.123.128.116:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yzr/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
