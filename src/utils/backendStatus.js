// 后端能力状态：是否已绑定 qBittorrent
// 未绑定时前端隐藏「订阅」「下载」页面，并在搜索页隐藏订阅/下载入口
import { ref } from "vue";
import { getBackendStatus } from "@/api/yzrServer";

export const qBittorrentEnabled = ref(false);

// 仅在后端成功返回后置为已加载；后端不可用时不缓存，便于恢复后重试
let loaded = false;
let pending = null;

export function loadBackendStatus(force = false) {
  if (loaded && !force) return Promise.resolve(qBittorrentEnabled.value);
  if (pending && !force) return pending;

  pending = getBackendStatus()
    .then((res) => {
      qBittorrentEnabled.value = !!(res && res.data && res.data.qBittorrent);
      loaded = true;
      return qBittorrentEnabled.value;
    })
    .catch(() => {
      // 后端不可用时按未绑定处理，避免误展示 qBittorrent 功能
      qBittorrentEnabled.value = false;
      return false;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}
