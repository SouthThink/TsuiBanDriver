<template>
  <div class="setting-item">
    <el-text>{{translate("使用Bangumi镜像")}}</el-text>
    <el-switch v-model="useMirror" @change="saveSetting" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { translate } from "@/utils/translate";

var timeTableSettings = JSON.parse(localStorage.getItem("timeTableSettings"));
if (!timeTableSettings) {
  timeTableSettings = {
    useMirror: false,
  };
  localStorage.setItem("timeTableSettings", JSON.stringify(timeTableSettings));
}

const useMirror = ref(timeTableSettings.useMirror);

const saveSetting = () => {
  timeTableSettings.useMirror = useMirror.value;
  localStorage.setItem("timeTableSettings", JSON.stringify(timeTableSettings));
};
</script>
