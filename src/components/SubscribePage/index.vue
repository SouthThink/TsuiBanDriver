<template>
  <div class="subscribe-page">
    <el-button-group class="subscribe-button-group">
      <el-button @click="startRefreshRssList" v-if="timer == null">
        {{translate("刷新列表")}}
      </el-button>
      <el-button @click="createRss">{{translate("新建订阅")}}</el-button>
      <!-- <el-button>标为已读</el-button> -->
      <el-button @click="updateAll">{{translate("更新所有")}}</el-button>
      <el-button @click="openDownloadMsgBox">{{translate("RSS下载器")}}</el-button>
    </el-button-group>
    <el-table :data="tableData" class="subscribe-table" v-loading="tableData.length === 0 && loading" :empty-text="translate('暂无订阅')">
      <el-table-column type="expand" width="20">
        <template #default="props">
          <el-table :data="props.row.articles" table-layout="auto">
            <el-table-column>
              <template #default="scope">
                <el-checkbox v-model="scope.row.isRead" disabled />
              </template>
            </el-table-column>
            <el-table-column prop="title">
              <template #default="scope">
                <el-text :type="scope.row.isRead ? '' : 'primary'">
                  {{ scope.row.title }}
                </el-text>
              </template>
            </el-table-column>
            <el-table-column prop="link">
              <template #default="scope">
                <el-tooltip
                  class="box-item"
                  effect="dark"
                  :content="translate('直接下载')"
                  placement="top-start"
                >
                  <el-button
                    type="primary"
                    :icon="Download"
                    circle
                    @click="download(scope.row, props.row)"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column width="36">
        <template #default="scope">
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="translate('全部已读')"
            placement="top-start"
          >
            <el-button
              circle
              :loading="scope.row.isLoading"
              :type="
                scope.row.isLoading
                  ? ''
                  : scope.row.hasError
                  ? 'danger'
                  : 'success'
              "
              size="small"
              @click="makeRead('', scope.row)"
            >
              <div v-if="!scope.row.isLoading">
                <el-icon v-if="scope.row.hasError"><Close /></el-icon>
                <el-text v-else-if="scope.row.unReadNum !== 0">
                  {{ scope.row.unReadNum }}
                </el-text>
                <el-icon v-else><Check /></el-icon>
              </div>
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="title" :label="translate('订阅列表')">
        <template #default="scope">
          <el-text v-if="rssName !== scope.row.title">{{
            scope.row.title
          }}</el-text>
          <el-input
            v-else
            v-model="newName"
            autofocus
            @keyup.enter="reName(scope.row)"
            @blur="notReName"
          />
        </template>
      </el-table-column>
      <el-table-column class="subscribe-table-operation" width="150">
        <template #default="scope">
          <el-button-group class="subscribe-table-button-group">
            <el-tooltip
              class="box-item"
              effect="dark"
              :content="translate('刷新')"
              placement="top-start"
            >
              <el-button
                type="primary"
                :icon="RefreshRight"
                @click="refresh(scope.row)"
              />
            </el-tooltip>
            <el-tooltip
              class="box-item"
              effect="dark"
              :content="translate('重命名')"
              placement="top-start"
            >
              <el-button
                type="primary"
                :icon="Edit"
                @click="reRssNmae(scope.row)"
              />
            </el-tooltip>

            <el-tooltip
              class="box-item"
              effect="dark"
              :content="translate('删除')"
              placement="top-start"
            >
              <el-button
                type="danger"
                :icon="Delete"
                @click="deleteRss(scope.row)"
              />
            </el-tooltip>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    <DownloadMsgBox @close="closeDownloadMsgBox" :download-visible="downloadVisible" />
  </div>
</template>
<script setup>
import { RefreshRight, Edit, Delete, Download } from "@element-plus/icons-vue";
import {
  getRssItems,
  removeItem,
  refreshItem,
  moveItem,
  markAsRead,
  addFeed,
} from "@/api/yzrServer";
import { ref, onMounted, onUnmounted } from "vue";
import { createDownload, deepEqual } from "@/utils/utils.js";
import DownloadMsgBox from "@/components/DownloadMsgBox/index.vue";
import { translate } from '@/utils/translate'

const tableData = ref([]);
const tableTempData = ref([]);
const rssName = ref("");
const newName = ref("");
const timer = ref(null);
const loading = ref(false);
const downloadVisible = ref(false);

const getRssList = () => {
  loading.value = true;
  getRssItems({ withData: true })
    .then((res) => {
      loading.value = false;
      if (res.code === 200) {
        tableTempData.value = [];
        Object.keys(res.data).forEach((item) => {
          var unReadNum = res.data[item].articles.length;
          res.data[item].articles.forEach((article) => {
            if (
              article.isRead !== undefined &&
              article.isRead !== null &&
              article.isRead
            ) {
              unReadNum--;
            }
          });
          tableTempData.value.push({
            ...res.data[item],
            title: item,
            unReadNum: unReadNum,
          });
        });
        if (!deepEqual(tableTempData.value, tableData.value)) {
          tableData.value = tableTempData.value;
        }
      } else {
        ElNotification({
          title: "订阅列表请求失败",
          message: "请检查网络连接",
          type: "warning",
        });
        clearInterval(timer.value);
        timer.value = null; // 清除定时器
      }
    })
    .catch((err) => {
      loading.value = false;
      ElNotification({
        title: "订阅列表请求错误",
        message: err,
        type: "error",
      });
      clearInterval(timer.value);
      timer.value = null; // 清除定时器
    });
};

const download = (url, row) => {
  console.log(url);
  makeRead(url, row);
  createDownload(url.torrentURL, url.title);
};

const deleteRss = (row) => {
  console.log(row.title);
  //确认提示
  ElMessageBox.confirm("确定删除该订阅吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      ElNotification({
        title: "正在删除",
        message: row.title,
        type: "info",
      });
      removeItem({ path: row.title }).then((res) => {
        if (res.code === 200) {
          ElNotification({
            title: "删除成功",
            message: "删除成功",
            type: "success",
          });
          getRssList();
        } else {
          ElNotification({
            title: "删除失败",
            message: "删除失败",
            type: "error",
          });
        }
      });
    })
    .catch(() => {
      console.log("取消删除");
    });
};
//刷新列表
const refresh = (row) => {
  console.log(row.title);
  row.isLoading = true;
  refreshItem({ itemPath: row.title }).then((res) => {
    if (res.code === 200) {
      ElNotification({
        title: "正在刷新",
        message: row.title,
        type: "info",
      });
    } else {
      ElNotification({
        title: "刷新失败",
        message: "刷新失败",
        type: "error",
      });
    }
  });
};

const startRefreshRssList = () => {
  timer.value = setInterval(getRssList, 3000);
};

const updateAll = () => {
  tableData.value.forEach((item) => {
    refresh(item);
  });
  getRssList();
};

const reRssNmae = (row) => {
  newName.value = row.title;
  rssName.value = row.title;
};

const reName = (row) => {
  // console.log(rssName.value);
  // console.log(newName.value);
  // console.log(row);
  // console.log(row.isTrusted);
  // console.log(row.title);
  ElNotification({
    title: "正在重命名",
    message: rssName.value,
    type: "info",
  });
  moveItem({ itemPath: rssName.value, destPath: newName.value }).then((res) => {
    if (res.code === 200) {
      ElNotification({
        title: "重命名成功",
        message: "重命名成功",
        type: "success",
      });
      row.title = newName.value;
      getRssList();
      notReName();
    } else {
      ElNotification({
        title: "重命名失败",
        message: "重命名失败",
        type: "error",
      });
    }
  });
};

const notReName = () => {
  newName.value = "";
  rssName.value = "";
};

const createRss = () => {
  //弹出弹窗，中间是输入框，标题是请输入订阅链接
  ElMessageBox.prompt(translate("请输入订阅链接"), translate("添加订阅"), {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
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
            title: translate("添加成功"),
            message: translate("添加成功"),
            type: "success",
          });
          getRssList();
        } else {
          ElNotification({
            title: translate("添加失败"),
            message: translate("添加失败"),
            type: "error",
          });
        }
      });
    })
    .catch(() => {
      console.log("取消添加");
    });
};

const makeRead = (row, props) => {
  // row.isRead = true;
  markAsRead({ itemPath: props.title, articleId: row.title });
};

const openDownloadMsgBox = () => {
  downloadVisible.value = false;
  downloadVisible.value = true;
}

const closeDownloadMsgBox = () => {
  downloadVisible.value = false;
}

// 当页面挂载到DOM上时，每三秒调用一次getRssList方法获取订阅列表，页面从DOM上卸载后销毁计时器
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
.subscribe-table-button-group {
  display: flex;
  justify-content: flex-end;
}
</style>
