<template>
  <div class="setting-page">
    <el-card class="setting-card">
      <template #header>
        <el-text size="large">{{translate("主题设置")}}</el-text>
      </template>
      <div class="setting-item">
        <el-text>{{translate("深色模式")}}</el-text>
        <dark-switch />
      </div>
      <div class="setting-item">
        <el-text>{{translate("下载页面样式")}}</el-text>
        <down-page-is-table-btn />
      </div>
      <div class="setting-item">
        <el-text>{{translate("语言")}}</el-text>
        <language/>
      </div>
    </el-card>
    <el-card class="setting-card">
      <template #header>
        <el-text size="large">{{translate("搜索设置")}}</el-text>
      </template>
        <searchSetting />
    </el-card>
    <el-card class="setting-card">
      <template #header>
        <el-text size="large">{{translate("AI设置")}}</el-text>
      </template>
      <ai-setting />
    </el-card>
    <el-card class="setting-card">
      <template #header>
        <el-text size="large">{{translate("弹幕设置")}}</el-text>
      </template>
      <danmaku-setting />
    </el-card>
    <el-card class="setting-card">
      <template #header>
        <el-text size="large">{{translate("关于")}}</el-text>
      </template>
      <about/>
    </el-card>
    <el-text type="info" size="small" class="copyright">
      {{translate("网页版权声明")}}
    </el-text>
  </div>
</template>
<script setup>
import darkSwitch from "./components/darkSwitch.vue";
import language from "./components/language.vue";
import downPageIsTableBtn from "./components/downPageIsTableBtn.vue";
import danmakuSetting from "./components/danmakuSetting.vue";
import searchSetting from "./components/searchSetting.vue";
import about from "./components/about.vue";
import aiSetting from "./components/aiSetting.vue";
import { translate } from '@/utils/translate'
</script>
<style scoped>
.setting-card:deep(.el-card__header) {
  padding: 10px;
}

.setting-card:deep(.el-card__body) {
  padding: 10px;
}

.copyright {
  text-align: center;
  padding: 10px;
  width: 100%;
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
