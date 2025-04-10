<template>
  <div class="about-container" v-for="(item, index) in aboutList" :key="index">
    <div class="setting-item" v-if="item.name !== '分割线'">
      <el-text>{{ translate(item.name) }}</el-text>
      <el-link :href="item.href">{{ item.value }}</el-link>
    </div>
    <el-divider v-else />
  </div>
</template>
<script setup>
import { ref } from "vue";
import { getVersion } from "@/utils/version.js";
import { allVersion } from "@/api/yzrServer";
import { translate } from "@/utils/translate";
const originList = ref([
  { name: "前端版本", value: getVersion() },
  { name: "作者", value: "@SouthThink", href: "https://github.com/SouthThink" },
  { name: "邮箱", value: "south_think@qq.com" },
  {
    name: "项目地址",
    value: "TsuiBanDriver",
    href: "https://github.com/SouthThink/TsuiBanDriver",
  },
  {
    name: "开源协议",
    value: "CC BY-NC 4.0",
    href: "https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans",
  },
  { name: "分割线" },
]);
const dandanPlayVersion = ref("0.0.0");
const aboutList = ref(JSON.parse(localStorage.getItem("aboutList")));

allVersion().then((res) => {
  originList.value = originList.value.concat(res.data.app_info);
  aboutList.value = originList.value;
  localStorage.setItem("aboutList", JSON.stringify(originList.value));
});
</script>
<style lang="css" scoped>
.about-container:deep(.el-divider) {
  margin: 0;
}
</style>
