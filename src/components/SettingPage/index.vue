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
        <el-text size="large">弹幕设置</el-text>
      </template>
      <danmaku-setting />
    </el-card>
  </div>
</template>
<script setup>
import darkSwitch from "./components/darkSwitch.vue";
import downPageIsTableBtn from "./components/downPageIsTableBtn.vue";
import danmakuSetting from "./components/danmakuSetting.vue";
</script>
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
  margin: 10px;
  height: 40px;
}

.setting-card {
  margin-bottom: 10px;
  width: 70%;
}

.setting-card:deep(.el-card__header) {
  padding: 8px 10px 2px 10px;
}

@media (max-width: 768px) {
  .setting-card{
    width: 100%;
  }
}
</style>
