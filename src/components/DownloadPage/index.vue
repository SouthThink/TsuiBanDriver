<template>
  <div class="download-page">
    <div class="download-table" v-if="tOrC == 'table'">
      <el-table
        :data="torrents"
        style="width: 100%"
        v-loading="torrents.length === 0 && loading"
        empty-text="暂无下载任务"
        allow-drag-last-column
      >
        <el-table-column
          fixed
          prop="name"
          label="文件名"
          width="550"
          show-overflow-tooltip
        >
          <template #default="scope">
            <el-popover placement="bottom" trigger="click">
              <template #reference>
                <el-text>{{ scope.row.name }}</el-text>
              </template>
              <el-menu class="right-click-menu">
                <el-menu-item index="1">
                  <template #title>
                    <el-button
                      type="danger"
                      link
                      :icon="Delete"
                      @click="removeTorrent(scope.row)"
                    >
                      删除种子
                    </el-button>
                  </template>
                </el-menu-item>
                <el-menu-item index="2">
                  <template #title>
                    <el-button
                      type="primary"
                      link
                      :icon="Edit"
                      @click="setLocationBtn(scope.row)"
                    >
                      移动位置
                    </el-button>
                  </template>
                </el-menu-item>
              </el-menu>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column
          prop="save_path"
          label="保存路径"
          width="250"
          sortable
        />
        <el-table-column prop="added_on" label="添加时间" width="130" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.added_on) }}
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="下载进度" width="180" sortable>
          <template #default="scope">
            <el-progress
              :percentage="parseFloat((scope.row.progress * 100).toFixed(1))"
              :status="scope.row.progress !== 1 ? '' : 'success'"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
          <template #default="scope">
            <el-tag :type="stateColor(scope.row.state)">
              {{ stateText(scope.row.state) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="80">
          <template #default="scope">
            {{ fileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="downloaded" label="已下载" width="80">
          <template #default="scope">
            {{ fileSize(scope.row.downloaded) }}
          </template>
        </el-table-column>
        <el-table-column prop="dlspeed" label="速度" width="80">
          <template #default="scope">
            {{ formatSpeed(scope.row.dlspeed) }}
          </template>
        </el-table-column>
        <el-table-column prop="eta" label="剩余" sortable width="100">
          <template #default="scope">
            {{ formatTime(scope.row.eta) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="completion_on"
          label="完成时间"
          width="130"
          sortable
        >
          <template #default="scope">
            {{ formatDate(scope.row.completion_on) }}
          </template>
        </el-table-column>
        <el-table-column prop="num_complete" label="做种数" />
      </el-table>
    </div>
    <div class="download-card" v-else v-loading="torrents.length === 0 && loading">
      <el-row :gutter="10">
        <el-col
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          v-for="torrent in torrents"
          :key="torrent.id"
        >
          <el-card class="box-card">
            <template #header>
              <el-text line-clamp="1">{{ torrent.name }}</el-text>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="保存路径"
                ><el-text line-clamp="1">{{
                  torrent.save_path
                }}</el-text></el-descriptions-item
              >
              <el-descriptions-item label="添加时间">{{
                formatDate(torrent.added_on)
              }}</el-descriptions-item>
              <el-descriptions-item label="下载进度">
                <el-progress
                  :percentage="parseFloat((torrent.progress * 100).toFixed(1))"
                  :status="torrent.progress !== 1 ? '' : 'success'"
                />
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="stateColor(torrent.state)">
                  {{ stateText(torrent.state) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="大小">{{
                fileSize(torrent.size)
              }}</el-descriptions-item>
              <el-descriptions-item label="已下载">{{
                fileSize(torrent.downloaded)
              }}</el-descriptions-item>
              <el-descriptions-item label="速度">{{
                formatSpeed(torrent.dlspeed)
              }}</el-descriptions-item>
              <el-descriptions-item label="剩余">{{
                formatTime(torrent.eta)
              }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script setup>
import { getDownloadList, deleteTorrents, setLocation } from "@/api/download";
import { ref, onMounted, onUnmounted } from "vue";
import { Delete, Edit } from "@element-plus/icons-vue";
import {
  fileSize,
  formatDate,
  formatTime,
  formatSpeed,
  stateText,
  mergeObjects,
  stateColor,
} from "@/utils/utils.js";

const torrents = ref([]);
const timer = ref(null);
const rid = ref(0);
const rid2 = ref(null);
const loading = ref(false);
const tOrC = ref('table');
var resData = {};

const getDownloadListBtn = () => {
  loading.value = true;
  if (rid.value === rid2.value) return;
  rid2.value = rid.value;
  getDownloadList({ rid: rid.value })
    .then((res) => {
      loading.value = false;
      if (rid.value === 0) {
        resData = res.data;
      } else {
        resData = mergeObjects(resData, res.data);
      }
      // console.log(resData);
      rid.value = resData.rid;
      torrents.value = [];
      let torrent = resData.torrents;
      // console.log(torrent);
      Object.keys(torrent).forEach((key) => {
        torrents.value.push(torrent[key]);
      });
      // console.log(torrents.value);
    })
    .catch((err) => {
      loading.value = false;
      ElNotification({
        title: "下载列表请求错误",
        message: err,
        type: "error",
      });
      clearInterval(timer.value);
      timer.value = null; // 清除定时器
    });
};

const removeTorrent = async (id) => {
  console.log(id.infohash_v1);
  //弹出确认弹窗，并且询问是否连文件一起删除
  ElMessageBox.confirm("是否删除该种子和文件？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    deleteTorrents({ hashes: id.infohash_v1, deleteFiles: true })
      .then((res) => {
        if (res.code === 200) {
          ElNotification({
            title: "成功",
            message: "删除成功",
            type: "success",
          });
          rid.value = 0;
        } else {
          ElNotification({
            title: "失败",
            message: res.msg,
            type: "error",
          });
        }
      })
      .catch((err) => {
        ElNotification({
          title: "失败",
          message: err,
          type: "error",
        });
      });
  });
  // const res = await deleteTorrents(id);
  // if (res.code === 200) {
  //   getDownloadListBtn();
  // }
};

const setLocationBtn = (row) => {
  console.log(row.save_path);
  console.log(row.infohash_v1);
  console.log(row);
  ElMessageBox.prompt(`当前:${row.save_path}`, "移动位置", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /\S/,
    inputErrorMessage: "地址路径不能为空",
  })
    .then(({ value }) => {
      ElNotification({
        title: "正在修改",
        message: value,
        type: "info",
      });
      setLocation({ location: value, hashes: row.infohash_v1 })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: "成功",
              message: "修改成功",
              type: "success",
            });
          } else {
            ElNotification({
              title: "移动失败",
              message: res.msg,
              type: "error",
            });
          }
        })
        .catch((err) => {
          ElNotification({
            title: "移动失败",
            message: err,
            type: "error",
          });
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

onMounted(() => {
  getDownloadListBtn();
  timer.value = setInterval(getDownloadListBtn, 3000);
  onUnmounted(() => {
    clearInterval(timer.value);
  });
  tOrC.value = localStorage.getItem("downPageType");
  // console.log(tOrC.value);
});
</script>
<style scoped>
.download-table:deep(.el-table td.el-table__cell div) {
  white-space: nowrap;
  font-size: 12px;
}
.download-table:deep(.el-table .el-table__cell) {
  padding: 0;
}
.right-click-menu {
  border: 0;
}

.right-click-menu:deep(.el-menu-item) {
  padding: 0 !important;
  height: 30px;
}

.box-card {
  /* width: 400px; */
  margin-bottom: 10px;
}
.box-card:deep(.el-card__header) {
  padding: 8px 10px 2px 10px;
}

.box-card:deep(.el-descriptions__label) {
  width: 80px;
}
</style>
