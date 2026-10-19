<template>
  <div class="subscribe-page">
    <div class="subscribe-header">
      <div class="subscribe-summary">
        <div class="subscribe-title-row">
          <h2 class="subscribe-title">{{ translate("订阅列表") }}</h2>
          <span class="subscribe-count">
            {{ feedCount }} {{ translate("个订阅") }}
          </span>
        </div>
        <div class="subscribe-meta">
          <span v-if="unreadCount > 0" class="meta-item is-unread">
            <el-icon><BellFilled /></el-icon>
            {{ unreadCount }} {{ translate("条未读") }}
          </span>
          <span v-else class="meta-item">
            <el-icon><CircleCheck /></el-icon>
            {{ translate("全部已读") }}
          </span>
          <span v-if="timer != null" class="meta-item">
            <span class="pulse-dot" />
            {{ translate("自动刷新中") }}
          </span>
          <el-button
            v-else
            class="auto-refresh-button"
            type="success"
            size="small"
            plain
            :icon="Refresh"
            @click="startRefreshRssList"
          >
            {{ translate("自动刷新") }}
          </el-button>
        </div>
      </div>

      <div class="subscribe-actions">
        <el-button type="primary" :icon="Plus" @click="createRss">
          {{ translate("新建订阅") }}
        </el-button>
        <el-button :icon="RefreshRight" @click="updateAll">
          {{ translate("更新所有") }}
        </el-button>
        <el-button :icon="Download" @click="openDownloadMsgBox">
          {{ translate("RSS下载器") }}
        </el-button>
      </div>
    </div>

    <SubscribeTable
      :data="rssData"
      :loading="loading"
      :show-actions="true"
      @delete="deleteRss"
      @refresh="refresh"
      @rename="reName"
      @mark-read="makeRead"
      @download="download"
    />
    <DownloadMsgBox
      @close="closeDownloadMsgBox"
      :download-visible="downloadVisible"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Plus, Refresh, RefreshRight, Download } from "@element-plus/icons-vue";
import SubscribeTable from "@/components/SubscribeTable/index.vue";
import {
  getRssItems,
  removeItem,
  refreshItem,
  moveItem,
  markAsRead,
  addFeed,
} from "@/api/yzrServer";
import { createDownload } from "@/utils/utils.js";
import DownloadMsgBox from "@/components/DownloadMsgBox/index.vue";
import { translate } from "@/utils/translate";

const rssData = ref({});
const timer = ref(null);
const loading = ref(false);
const downloadVisible = ref(false);

const feedCount = computed(() => Object.keys(rssData.value || {}).length);

const unreadCount = computed(() =>
  Object.values(rssData.value || {}).reduce((total, feed) => {
    const articles = Array.isArray(feed?.articles) ? feed.articles : [];
    return total + articles.filter((article) => !article.isRead).length;
  }, 0)
);

// silent: 后台轮询时静默刷新，不显示"加载中"遮罩，避免界面闪烁
const getRssList = (silent = false) => {
  if (!silent) loading.value = true;
  getRssItems({ withData: true })
    .then((res) => {
      rssData.value = res.data;
    })
    .catch(() => {
      // 错误已由 request 统一提示
      clearInterval(timer.value);
      timer.value = null;
    })
    .finally(() => {
      loading.value = false;
    });
};

const download = (url, row) => {
  makeRead(url, row);
  createDownload(url.torrentURL, url.title);
};

const deleteRss = (row) => {
  ElMessageBox.confirm(translate("确定删除该订阅吗？"), translate("提示"), {
    confirmButtonText: translate("确定"),
    cancelButtonText: translate("取消"),
    type: "warning",
  })
    .then(() => {
      ElNotification({
        title: translate("正在删除"),
        message: row.title,
        type: "info",
      });
      removeItem({ path: row.title })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: translate("提示"),
              message: translate("删除成功"),
              type: "success",
            });
            getRssList();
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
};

const refresh = (row) => {
  row.isLoading = true;
  refreshItem({ itemPath: row.title })
    .then((res) => {
      if (res.code === 200) {
        ElNotification({
          title: translate("正在刷新"),
          message: row.title,
          type: "info",
        });
      }
    })
    .catch(() => {})
    .finally(() => {
      row.isLoading = false;
    });
};

const startRefreshRssList = () => {
  timer.value = setInterval(() => getRssList(true), 3000);
};

const updateAll = () => {
  Object.keys(rssData.value).forEach((key) => {
    refreshItem({ itemPath: key }).catch(() => {});
  });
  getRssList();
};

const reName = (oldName, newName) => {
  ElNotification({
    title: translate("正在重命名"),
    message: oldName,
    type: "info",
  });
  moveItem({ itemPath: oldName, destPath: newName })
    .then((res) => {
      if (res.code === 200) {
        ElNotification({
          title: translate("提示"),
          message: translate("重命名成功"),
          type: "success",
        });
        getRssList();
      }
    })
    .catch(() => {});
};

const createRss = () => {
  ElMessageBox.prompt(translate("请输入订阅链接"), translate("添加订阅"), {
    confirmButtonText: translate("确定"),
    cancelButtonText: translate("取消"),
    inputPattern: /^https?:\/\/.+/,
    inputErrorMessage: translate("请输入正确的订阅链接"),
  })
    .then(({ value }) => {
      ElNotification({
        title: translate("正在添加"),
        message: value,
        type: "info",
      });
      addFeed({ url: value, path: "" })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: translate("提示"),
              message: translate("添加成功"),
              type: "success",
            });
            getRssList();
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
};

const makeRead = (type, row) => {
  // type: '' 表示全部已读，对象表示单个文章
  const articleId = !type ? undefined : typeof type === "object" ? type.title : type;
  markAsRead({ itemPath: row.title, articleId }).catch(() => {});
};

const openDownloadMsgBox = () => {
  downloadVisible.value = true;
};

const closeDownloadMsgBox = () => {
  downloadVisible.value = false;
};

onMounted(() => {
  getRssList();
  downloadVisible.value = false;
  timer.value = setInterval(() => getRssList(true), 3000);
});

onUnmounted(() => {
  clearInterval(timer.value);
});
</script>

<style scoped>
.subscribe-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 4px clamp(8px, 4vw, 48px) 24px;
}

.subscribe-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.subscribe-title-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.subscribe-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 20px;
  line-height: 1.3;
}

.subscribe-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.subscribe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-item.is-unread {
  color: var(--el-color-primary);
}

.auto-refresh-button {
  height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  font-size: 12px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--el-color-success);
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.8);
  }
}

.subscribe-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.subscribe-actions :deep(.el-button) {
  margin-left: 0;
}

@media (max-width: 768px) {
  .subscribe-page {
    padding: 2px 4px 16px;
  }

  .subscribe-header {
    align-items: stretch;
    margin-bottom: 10px;
  }

  .subscribe-title {
    font-size: 17px;
  }

  .subscribe-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    gap: 8px;
  }

  .subscribe-actions :deep(.el-button) {
    width: 100%;
  }

  /* 主操作独占一行，其余操作两列排布 */
  .subscribe-actions :deep(.el-button:first-child) {
    grid-column: 1 / -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-dot {
    animation: none;
  }
}
</style>
