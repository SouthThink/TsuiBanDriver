// 个性化设置按用户名同步到后端
// 进入网页时拉取该用户的设置写回浏览器；浏览器里这些键变更后节流上报
import { username } from "@/utils/user";
import { getUserData, saveUserSettings } from "@/api/yzrServer";

// 需要同步的设置键，值保持浏览器里的原始字符串
// 语言 / 弹幕设置 / 时间表设置；下载页展示方式（downPageType）按需求留在浏览器
export const SYNC_KEYS = ["lang", "danmuku", "timeTableSettings"];

let pushTimer = null;

function collectLocalSettings() {
  const settings = {};
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      settings[key] = raw;
    }
  }
  return settings;
}

function applySettings(settings) {
  for (const key of SYNC_KEYS) {
    if (settings && settings[key] !== undefined) {
      localStorage.setItem(key, settings[key]);
    }
  }
}

// 把浏览器现有设置同步到后端（新用户首次进入时用于初始化服务器数据）
export function pushUserSettings() {
  if (!username.value) return Promise.resolve();
  return saveUserSettings({
    username: username.value,
    settings: collectLocalSettings(),
  }).catch(() => {});
}

// 设置变更后节流上报，避免拖动滑块时频繁请求
export function schedulePushUserSettings() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushUserSettings();
  }, 1000);
}

// 进入网页时载入该用户设置：服务器已有设置则覆盖浏览器，没有则用浏览器现有设置初始化
export async function pullUserSettings() {
  if (!username.value) return;
  try {
    const res = await getUserData({ username: username.value });
    const settings = (res && res.data && res.data.settings) || {};
    if (Object.keys(settings).length === 0) {
      await pushUserSettings();
    } else {
      applySettings(settings);
    }
  } catch {
    // 后端不可用时保持浏览器内设置，不阻塞页面
  }
}
