// 版本号在构建时由 vite.config.js 计算并通过 define 注入为固定字面量
export function getVersion() {
  return __APP_VERSION__;
}
