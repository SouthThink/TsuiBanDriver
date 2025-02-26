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
        <div class="result" v-if="resultList.length > 0">
          <el-row :gutter="12" class="bangumi-card-row" :loading="true">
            <el-col
              :xs="8"
              :sm="6"
              :md="6"
              :lg="6"
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
        </div>
      </template>
    </el-skeleton>
    <el-drawer v-model="showBangumi" title="字幕组" direction="rtl" size="50%">
      <el-table :data="subtitleGroupList" v-loading="subtitleGroupList.length === 0">
        <el-table-column property="subgroupname" label="名称" />
        <!-- /下载按钮 -->
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="primary" @click="getRSSLinkBtn(scope.row)"
              >下载</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>
<script setup>
import BangumiCardRow from "@/components/BangumiCardRow/index.vue";
import "element-plus/dist/index.css";
import "@/components/BangumiCardRow/index.css";
import { searchAllInfo, getRSSLink, getSubgroupInfo } from "@/api/download.js";
import { Search } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { ref } from "vue";

const input = ref("");
const resultList = ref([]);
const loading = ref(false);
const subtitleGroupList = ref([]);
const showBangumi = ref(false);
const bangumiId = ref(0);

const searchAllInfoBtn = () => {
  loading.value = true;
  searchAllInfo({
    name: input.value,
  })
    .then((res) => {
      console.log(res);
      if (res.code == 200) {
        resultList.value = res.data;
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
          type: "warning",
        });
      }
    })
    .catch((err) => {
      loading.value = false;
      ElNotification({
        title: "搜索失败",
        message: "请检查网络连接",
        type: "warning",
      });
    });
};

const getSubgroupInfoBtn = (e) => {
  subtitleGroupList.value = [];
  showBangumi.value = true;
  bangumiId.value = e.bangumiId;
  console.log(e);
  getSubgroupInfo({
    bangumiId: bangumiId.value,
  })
    .then((res) => {
      console.log(res);
      subtitleGroupList.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getRSSLinkBtn = (e) => {
  console.log(bangumiId.value,e.subgroupid);
};
</script>
<style scoped>
.searchPage {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  flex-wrap: nowrap;
}
.searchBox {
  width: 100%;
  display: flex;
  justify-content: center;
}
.input-with-select {
  width: 600px;
  margin-bottom: 100px;
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
  margin-bottom: 100px;
  box-sizing: border-box;
}

.bangumi-card-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: start;
  margin: 0 -10px;
}
</style>
