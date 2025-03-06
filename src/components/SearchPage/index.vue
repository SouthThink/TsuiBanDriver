<template>
  <div class="searchPage">
    <div class="searchBox">
      <el-input
        v-model="input"
        placeholder="番剧搜索"
        class="input-with-select"
        :prefix-icon="Search"
        @keyup.enter="searchAllInfoBtn"
      />
    </div>
    <el-skeleton :loading="loading" animated :count="3">
      <template #template> </template>
      <template #default>
        <div
          class="result"
          v-if="resultList.length > 0 || rssItem.item.length > 0"
        >
          <el-row :gutter="24" class="bangumi-card-row" :loading="true">
            <el-col
              :xs="colNum+2"
              :sm="colNum"
              :md="colNum"
              :lg="colNum"
              v-for="video in resultList"
              :key="video.Id"
            >
              <BangumiCardRow
                :imgUrl="video.img"
                :title="video.title"
                @click="getSubgroupInfoBtn(video)"
              />
            </el-col>
          </el-row>

          <div class="table">
            <el-table :data="currentPageData">
              <el-table-column property="title" label="标题" />
              <el-table-column label="操作" width="85">
                <template #header>
                  <el-button
                    type="primary"
                    @click="addSearchRss"
                    style="white-space: nowrap"
                  >
                    订阅
                  </el-button>
                </template>
                <template #default="scope">
                  <el-button
                    type="primary"
                    :icon="Download"
                    circle
                    @click="
                      createDownload(
                        scope.row.enclosure['@url'],
                        scope.row.description
                      )
                    "
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="currentPage"
              :page-size="pageSize"
              layout="prev, pager, next"
              :total="rssItem.item.length"
              class="pagination"
            />
          </div>
        </div>
      </template>
    </el-skeleton>
    <el-drawer v-model="showBangumi" title="字幕组" direction="rtl" size="50%">
      <el-table
        :data="subtitleGroupList"
        v-loading="subtitleGroupListLoading"
        table-layout="auto"
        empty-text="未找到字幕组"
      >
        <el-table-column property="subgroupname" label="名称" />
        <!-- /下载按钮 -->
        <el-table-column label="操作" width="85">
          <template #default="scope">
            <el-button type="primary" @click="getRssLinkBtn(scope.row)">
              订阅
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>
<script setup>
import { Download } from "@element-plus/icons-vue";
import BangumiCardRow from "@/components/BangumiCardRow/index.vue";
import "element-plus/dist/index.css";
import "@/components/BangumiCardRow/index.css";
import {
  searchAllInfo,
  addRssLink,
  getSubgroupInfo,
  addFeed,
  addTorrents,
} from "@/api/download.js";
import { Search } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { ref, computed } from "vue";
import { createDownload } from "@/utils/utils.js";

const input = ref("");
const resultList = ref([]);
const rssItem = ref({ item: [] });
const loading = ref(false);
const subtitleGroupList = ref([]);
const showBangumi = ref(false);
const subtitleGroupListLoading = ref(false);
const bangumiId = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = currentPage.value * pageSize.value;
  return rssItem.value.item.slice(start, end);
});

const colNum = computed(() => {
  const lengthToValueMap = { 4: 6, 3: 8, 2: 12, 1: 24 };
  return lengthToValueMap[resultList.value.length];
});

const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
};

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage;
};

const addSearchRss = () => {
  console.log("订阅", rssItem.value.link);
  ElNotification({
    title: "正在订阅",
    message: rssItem.value.link,
    type: "info",
  });
  addFeed({ url: rssItem.value.link, path: "" })
    .then((res) => {
      if (res.code === 200) {
        ElNotification({
          title: "添加成功",
          message: "添加成功",
          type: "success",
        });
      } else {
        ElNotification({
          title: "添加失败",
          message: "添加失败",
          type: "error",
        });
      }
    })
    .catch((err) => {
      ElNotification({
        title: "添加失败",
        message: err,
        type: "error",
      });
    });
};

const searchAllInfoBtn = () => {
  loading.value = true;
  searchAllInfo({
    name: input.value,
  })
    .then((res) => {
      if (res.code == 200) {
        resultList.value = res.data.bangumiItem;
        //将字符串解析为json
        rssItem.value = JSON.parse(res.data.rss).rss.channel;
        if (!Array.isArray(rssItem.value.item)) {
          rssItem.value.item = [rssItem.value.item];
        }
        // console.log(rssItem.value.item);
        loading.value = false;
      } else if (res.code == 404) {
        loading.value = false;
        ElNotification({
          title: "搜索失败",
          message: "未找到相关番剧",
          type: "warning",
        });
      } else {
        loading.value = false;
        ElNotification({
          title: "搜索失败",
          message: "请检查网络连接",
          type: "error",
        });
      }
    })
    .catch((err) => {
      loading.value = false;
      ElNotification({
        title: "搜索失败",
        message: err,
        type: "error",
      });
    });
};

const getSubgroupInfoBtn = (e) => {
  subtitleGroupList.value = [];
  showBangumi.value = true;
  subtitleGroupListLoading.value = true;
  bangumiId.value = e.bangumiId;
  console.log(e);
  getSubgroupInfo({
    bangumiId: bangumiId.value,
  })
    .then((res) => {
      if (res.code === 200) {
        console.log(res);
        subtitleGroupList.value = res.data;
      } else {
        subtitleGroupListLoading.value = false;
        ElNotification({
          title: "获取字幕组失败",
          message: "请检查网络连接",
          type: "error",
        });
      }
    })
    .catch((err) => {
      subtitleGroupListLoading.value = false;
      ElNotification({
        title: "获取字幕组失败",
        message: err,
        type: "error",
      });
    });
};

const getRssLinkBtn = (e) => {
  console.log(e);
  var data = {
    bangumiId: bangumiId.value,
    subgroupId: e.subgroupId.slice(1),
  };
  console.log(data);
  ElNotification({
    title: "订阅中",
    message: "请稍等",
    type: "info",
  });
  addRssLink(data)
    .then((res) => {
      console.log(res);
      if (res.code == 200) {
        ElNotification({
          title: "订阅成功",
          message: "请前往订阅列表查看",
          type: "success",
        });
      } else {
        ElNotification({
          title: "订阅失败",
          message: "请检查网络连接",
          type: "warning",
        });
      }
    })
    .catch((err) => {
      ElNotification({
        title: "订阅失败",
        message: err,
        type: "warning",
      });
    });
};
</script>
<style scoped>
.searchPage {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  flex-wrap: nowrap;
}
.searchBox {
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: center;
}
.input-with-select {
  width: 100%;
  margin-bottom: 20px;
}

.input-with-select:deep(.el-input__wrapper) {
  height: 50px;
  border-radius: 25px;
  border: 0px;
}

.searchBtn {
  background-color: #409eff;
  border: none;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.result {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
}

.bangumi-card-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: start;
  margin: 0 -10px;
  max-width: 600px;
}

.table {
  width: 90%;
  margin-top: 20px;
}

.table:deep(.el-table td.el-table__cell div) {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .table {
    width: 100%;
    margin-top: 20px;
  }
}

.pagination {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
</style>
