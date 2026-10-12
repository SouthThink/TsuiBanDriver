// 播放历史：打开播放页记为已观看，并保存 / 恢复播放进度（按用户 + 视频 ID）
import { username } from "@/utils/user";
import { getHistory, saveHistory } from "@/api/yzrServer";

// 读取某个视频的历史记录（用于续播），无记录返回 null
export async function loadPlayRecord(videoId) {
  if (!username.value || !videoId) return null;
  try {
    const res = await getHistory({ username: username.value, videoId });
    const record = res && res.data;
    return record && Object.keys(record).length ? record : null;
  } catch {
    return null;
  }
}

// 上报播放记录（静默失败，不打扰播放），返回 Promise 便于调用方在写入后刷新
// 后端只保存 animeId → 集数 → 进度/时间，videoId 仅用于定位所属剧集
export function savePlayRecord({ videoId, position, duration }) {
  if (!username.value || !videoId) return Promise.resolve();
  return saveHistory({
    username: username.value,
    videoId,
    position: position || 0,
    duration: duration || 0,
  }).catch(() => {});
}

// 页面即将卸载（关闭标签页 / 刷新 / 跳转外部链接）时兜底上报：
// 普通 fetch 会被浏览器在卸载时中断，sendBeacon 由浏览器保证发出
export function savePlayRecordBeacon({ videoId, position, duration }) {
  if (!username.value || !videoId || !navigator.sendBeacon) return false;
  const body = new Blob(
    [
      JSON.stringify({
        username: username.value,
        videoId,
        position: position || 0,
        duration: duration || 0,
      }),
    ],
    { type: "application/json" }
  );
  return navigator.sendBeacon("/yzr/saveHistory", body);
}
