<template>
  <div class="searchBox">
    <el-input
      v-model="input"
      placeholder="请输入内容"
      class="input-with-select"
    ></el-input>
    <el-button @click="searchAllInfoBtn" class="searchBtn">搜索</el-button>
  </div>
  <div class="result">
    <el-row :gutter="24" class="bangumi-card-row">
      <el-col
        :xs="8"
        :sm="6"
        :md="4"
        :lg="3"
        v-for="video in resultList"
        :key="video.Id"
      >
        <BangumiCardRow
          :imgUrl="video.img"
          :title="video.title"
        />
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import BangumiCardRow from "@/components/BangumiCardRow/index.vue";
import { searchAllInfo } from "@/api/download.js";
import { ref } from "vue";

const input = ref("");
const resultList = ref([]);

const searchAllInfoBtn = () => {
  searchAllInfo({
    name: input.value,
  }).then((res) => {
    console.log(res);
    resultList.value = res.data;
  });
};
</script>
<style scoped>
.input-with-select {
  width: 400px;
  margin: 20px;
}

.searchBtn {
  margin: 20px;
}
</style>
