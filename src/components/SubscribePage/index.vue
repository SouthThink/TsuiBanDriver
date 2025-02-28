<template>
  <div class="subscribe-page">
    <el-button-group class="subscribe-button-group">
      <el-button>新建订阅</el-button>
      <!-- <el-button @click="getRssList">刷新列表</el-button> -->
      <!-- <el-button>标为已读</el-button> -->
      <el-button @click="updateAll">更新所有</el-button>
      <el-button>下载器</el-button>
    </el-button-group>
    <el-table :data="tableData" class="subscribe-table">
      <el-table-column type="expand" width="20">
        <template #default="props">
          <el-table :data="props.row.articles" table-layout="auto">
            <el-table-column prop="title" />
            <el-table-column prop="link">
              <template #default="scope">
                <el-tooltip
                  class="box-item"
                  effect="dark"
                  content="直接下载"
                  placement="top-start"
                >
                  <el-button
                    type="primary"
                    :icon="Download"
                    circle
                    @click="download(scope.row)"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column width="36">
        <template #default="scope">
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
          >
            <div v-if="!scope.row.isLoading">
              <el-icon v-if="scope.row.hasError"><Close /></el-icon>
              <el-icon v-else><Check /></el-icon>
            </div>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="订阅列表">
        <template #default="scope">
          <el-text v-if="rssName !== scope.row.title">{{
            scope.row.title
          }}</el-text>
          <el-input
            v-else
            v-model="newName"
            autofocus
            @keyup.enter="reName"
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
              content="刷新"
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
              content="重命名"
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
              content="删除"
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
  </div>
</template>
<script setup>
import { RefreshRight, Edit, Delete, Download } from "@element-plus/icons-vue";
import { getRssItems, removeItem, refreshItem, moveItem } from "@/api/download";
import { ref, onMounted, onUnmounted } from "vue";

const tableData = ref([]);
const tableTempData = ref([]);
const rssName = ref("");
const newName = ref("");

const getRssList = () => {
  getRssItems().then((res) => {
    if (res.code === 200) {
      tableTempData.value = [];
      Object.keys(res.data).forEach((item) => {
        tableTempData.value.push({ ...res.data[item], title: item });
      });
      if (!deepEqual(tableTempData.value, tableData.value)) {
        tableData.value = tableTempData.value;
      }
    } else {
      ElNotification({
        title: "连接失败",
        message: "请检查网络连接",
        type: "warning",
      });
    }
  });
};
//数组对象对比方法
function deepEqual(a, b) {
  if (a === b) return true;
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  )
    return false;
  let keysA = Object.keys(a),
    keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
  }
  return true;
}

const download = (url) => {
  console.log(url);
};

const deleteRss = (row) => {
  console.log(row.title);
  //确认提示
  ElMessageBox.confirm("确定删除该订阅吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    ElNotification({
      title: "正在删除",
      message: row.title,
      type: "info",
    })
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

const updateAll = () => {
  tableData.value.forEach((item) => {
    refresh(item);
    getRssList();
  });
};

const reRssNmae = (row) => {
  newName.value = row.title;
  rssName.value = row.title;
};

const reName = () => {
  console.log(rssName.value);
  console.log(newName.value);
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

// 当页面挂载到DOM上时，每三秒调用一次getRssList方法获取订阅列表，页面从DOM上卸载后销毁计时器
onMounted(() => {
  getRssList();
  const timer = setInterval(getRssList, 3000);
  onUnmounted(() => {
    clearInterval(timer);
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
