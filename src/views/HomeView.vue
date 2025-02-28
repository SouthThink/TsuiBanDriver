x
<template>
  <el-tabs v-model="activeName" class="tabs" @tab-click="" type="border-card">
    <el-tab-pane label="番剧" name="first">
      <HomePage />
    </el-tab-pane>
    <el-tab-pane label="搜索" name="second" class="secondPage">
      <SearchPage />
    </el-tab-pane>
    <el-tab-pane label="订阅" name="third">
      <SubscribePage />
    </el-tab-pane>
    <el-tab-pane label="下载" name="fourth"></el-tab-pane>
    <el-tab-pane label="设置" name="fifth"></el-tab-pane>
  </el-tabs>
</template>
<script setup>
import { ref } from "vue";
import HomePage from "@/components/MainPage/index.vue";
import SearchPage from "@/components/SearchPage/index.vue";
import SubscribePage from "@/components/SubscribePage/index.vue";
const activeName = ref("first");
</script>
<style scoped>
/* tabs撑满屏幕宽度 */
.secondPage {
  display: flex;
  height: 100%;
  justify-content: center;
}
.tabs {
  width: 100vw;
  height: 100vh;
}
.tabs:deep(.el-tabs__content) {
  overflow: scroll;
  /* 隐藏滚动条 */
  scrollbar-width: none;
}
</style>
<style>
:root {
  --el-bg-color-overlay: #e5eaf3;
}
</style>
