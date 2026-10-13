import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

const pkg = createRequire(import.meta.url)("./package.json");

// 版本号格式：1.[已并入主干的远程分支数].[提交次数]
// 在构建时计算，并通过 define 文本化成固定字面量写入产物，运行时不依赖 git
function resolveVersion() {
  const git = (cmd) =>
    execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  try {
    const mergedBranches = git("git branch -r --merged main")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(
        (line) => line && !line.includes("->") && !/\/(main|master)$/.test(line),
      );
    return `1.${mergedBranches.length}.${git("git rev-list --count HEAD")}`;
  } catch {
    // 非 git 环境（如直接下载源码包）退回到 package.json 中的版本
    return pkg.version;
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(resolveVersion()),
  },
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
      "/yzr": {
        // target: "http://191.0.0.17:5000",
        target: "http://192.168.10.37:5000",
        // target: "http://100.123.128.116:5000",
        // target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yzr/, ""),
      },
    },
    port: 3000,
  },
  // jassub 的 worker 会拆出多个 chunk，默认的 iife 输出不支持代码分割，必须用 ES 模块
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
