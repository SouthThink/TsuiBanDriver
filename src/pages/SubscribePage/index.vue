<template>
  <div class="subscribe-page">
    <el-button-group class="subscribe-button-group">
      <el-button @click="startRefreshRssList" v-if="timer == null">
        {{translate("刷新列表")}}
      </el-button>
      <el-button @click="createRss">{{translate("新建订阅")}}</el-button>
      <el-button @click="updateAll">{{translate("更新所有")}}</el-button>
      <el-button @click="openDownloadMsgBox">{{translate("RSS下载器")}}</el-button>
    </el-button-group>
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
    <DownloadMsgBox @close="closeDownloadMsgBox" :download-visible="downloadVisible" />
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from "vue";
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
import { translate } from '@/utils/translate'

const rssData = ref({});
const timer = ref(null);
const loading = ref(false);
const downloadVisible = ref(false);

const getRssList = () => {
  loading.value = true;
  getRssItems({ withData: true })
    .then((res) => {
      loading.value = false;
      if (res.code === 200) {
        rssData.value = res.data;
      } else {
        ElNotification({
          title: translate("订阅列表请求失败"),
          message: translate("请检查网络连接"),
          type: "warning",
        });
        clearInterval(timer.value);
        timer.value = null;
      }
    })
    .catch((err) => {
      loading.value = false;
      ElNotification({
        title: translate("订阅列表请求错误"),
        message: err,
        type: "error",
      });
      clearInterval(timer.value);
      timer.value = null;
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
      removeItem({ path: row.title }).then((res) => {
        if (res.code === 200) {
          ElNotification({
            title: translate("提示"),
            message: translate("删除成功"),
            type: "success",
          });
          getRssList();
        } else {
          ElNotification({
            title: translate("提示"),
            message: translate("删除失败"),
            type: "error",
          });
        }
      });
    })
    .catch(() => {});
};

const refresh = (row) => {
  row.isLoading = true;
  refreshItem({ itemPath: row.title }).then((res) => {
    if (res.code === 200) {
      ElNotification({
        title: translate("正在刷新"),
        message: row.title,
        type: "info",
      });
    } else {
      ElNotification({
        title: translate("提示"),
        message: translate("刷新失败"),
        type: "error",
      });
    }
  });
};

const startRefreshRssList = () => {
  timer.value = setInterval(getRssList, 3000);
};

const updateAll = () => {
  Object.keys(rssData.value).forEach((key) => {
    refreshItem({ itemPath: key }).then(() => {});
  });
  getRssList();
};

const reName = (oldName, newName) => {
  ElNotification({
    title: translate("正在重命名"),
    message: oldName,
    type: "info",
  });
  moveItem({ itemPath: oldName, destPath: newName }).then((res) => {
    if (res.code === 200) {
      ElNotification({
        title: translate("提示"),
        message: translate("重命名成功"),
        type: "success",
      });
      getRssList();
    } else {
      ElNotification({
        title: translate("提示"),
        message: translate("重命名失败"),
        type: "error",
      });
    }
  });
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
      addFeed({ url: value, path: "" }).then((res) => {
        if (res.code === 200) {
          ElNotification({
            title: translate("提示"),
            message: translate("添加成功"),
            type: "success",
          });
          getRssList();
        } else {
          ElNotification({
            title: translate("提示"),
            message: translate("添加失败"),
            type: "error",
          });
        }
      });
    })
    .catch(() => {});
};

const makeRead = (type, row) => {
  // type: '' 表示全部已读，对象表示单个文章
  const articleId = !type ? undefined : (typeof type === 'object' ? type.title : type);
  markAsRead({ itemPath: row.title, articleId });
};

const openDownloadMsgBox = () => {
  downloadVisible.value = true;
}

const closeDownloadMsgBox = () => {
  downloadVisible.value = false;
}

onMounted(() => {
  getRssList();
  downloadVisible.value = false;
  timer.value = setInterval(getRssList, 3000);
  onUnmounted(() => {
    clearInterval(timer.value);
  });
});
</script>
<style scoped>
.subscribe-page {
  padding-left: 10%;
  padding-right: 10%;
}

@media (max-width: 768px) {
  .subscribe-page {
    padding: 0;
  }
}

.subscribe-button-group {
  display: flex;
  margin-bottom: 10px;
}
</style>
