x
<template>
  <el-tabs v-model="activeName" class="tabs" type="border-card" @tab-click="clickTab">
    <el-tab-pane :label="translate('番剧')" name="first">
      <HomePage />
    </el-tab-pane>
    <el-tab-pane :label="translate('搜索')" name="second" class="secondPage">
      <SearchPage />
    </el-tab-pane>
    <el-tab-pane :label="translate('订阅')" name="third">
      <SubscribePage v-if="activeName === 'third'" />
    </el-tab-pane>
    <el-tab-pane :label="translate('下载')" name="fourth">
      <DownloadPage v-if="activeName === 'fourth'" />
    </el-tab-pane>
    <el-tab-pane :label="translate('设置')" name="fifth">
      <SettingPage />
    </el-tab-pane>
  </el-tabs>
</template>
<script setup>
import { ref } from "vue";
import HomePage from "@/components/MainPage/index.vue";
import SearchPage from "@/components/SearchPage/index.vue";
import SettingPage from "@/components/SettingPage/index.vue";
import DownloadPage from "@/components/DownloadPage/index.vue";
import SubscribePage from "@/components/SubscribePage/index.vue";
import { translate } from '@/utils/translate'
const activeName = ref("first");
if (localStorage.getItem("activeName")) {
  activeName.value = localStorage.getItem("activeName");
}

const clickTab = () => {
  localStorage.setItem("activeName", activeName.value);
}
</script>
<style scoped>
/* tabs撑满屏幕宽度 */
.secondPage {
  display: flex;
  /* height: 100%; */
  justify-content: center;
}
.tabs {
  width: 100vw;
  height: 100vh;
}
.tabs:deep(.el-tabs__content) {
  overflow: auto;
  /* 隐藏滚动条 */
  /* scrollbar-width: none; */
}
</style>
<style>
:root {
  --el-bg-color-overlay: #e5eaf3;
}
</style>
