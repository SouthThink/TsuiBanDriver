<template>
  <div class="setting-page">
    <el-card class="setting-card">
      <template #header>
        <el-text size="large">主题设置</el-text>
      </template>
      <div class="setting-item">
        <el-text>深色模式</el-text>
        <dark-switch />
      </div>
      <div class="setting-item">
        <el-text>下载页面样式</el-text>
        <down-page-is-table-btn />
      </div>
    </el-card>
    <el-card class="setting-card">
      <template #header>
        <el-text size="large">搜索设置</el-text>
      </template>
        <searchSetting />
    </el-card>
    <el-card class="setting-card">
      <template #header>
        <el-text size="large">弹幕设置</el-text>
      </template>
      <danmaku-setting />
    </el-card>
    <el-card class="setting-card">
      <template #header>
        <el-text size="large">关于</el-text>
      </template>
      <about/>
    </el-card>
  </div>
</template>
<script setup>
import darkSwitch from "./components/darkSwitch.vue";
import downPageIsTableBtn from "./components/downPageIsTableBtn.vue";
import danmakuSetting from "./components/danmakuSetting.vue";
import searchSetting from "./components/searchSetting.vue";
import about from "./components/about.vue";
</script>
<style scoped>
.setting-card:deep(.el-card__header) {
  padding: 10px;
}

.setting-card:deep(.el-card__body) {
  padding: 10px;
}
</style>
<style>
.setting-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
  margin-bottom: 5px;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 10px;
  height: 40px;
}

.setting-item:hover {
  /* 加深颜色 */
  background-color: var(--item-hover);
}

.setting-card {
  margin-bottom: 10px;
  width: 70%;
}

@media (max-width: 768px) {
  .setting-card {
    width: 100%;
  }
}
</style>
