<template>
  <div class="setting-item">
    <el-text>{{translate("使用Bangumi镜像")}}</el-text>
    <el-switch v-model="useMirror" @change="saveSetting" />
  </div>
  <div class="setting-item">
    <el-text>{{translate("点击番剧时行为")}}</el-text>
    <el-select
      v-model="clickAction"
      @change="saveSetting"
      style="max-width: 60%; width: 240px"
    >
      <el-option :label="translate('跳转搜索页面并搜索')" value="searchAndGo" />
      <el-option :label="translate('跳转搜索页面')" value="searchOnly" />
      <el-option :label="translate('打开番剧详情') + translate('（未完成）')" value="openDetail" disabled />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { translate } from "@/utils/translate";

var timeTableSettings = JSON.parse(localStorage.getItem("timeTableSettings"));
if (!timeTableSettings) {
  timeTableSettings = {
    useMirror: false,
    clickAction: "searchAndGo",
  };
  localStorage.setItem("timeTableSettings", JSON.stringify(timeTableSettings));
} else if (!timeTableSettings.clickAction) {
  timeTableSettings.clickAction = "searchAndGo";
  localStorage.setItem("timeTableSettings", JSON.stringify(timeTableSettings));
}

const useMirror = ref(timeTableSettings.useMirror);
const clickAction = ref(timeTableSettings.clickAction);

const saveSetting = () => {
  timeTableSettings.useMirror = useMirror.value;
  timeTableSettings.clickAction = clickAction.value;
  localStorage.setItem("timeTableSettings", JSON.stringify(timeTableSettings));
};
</script>
