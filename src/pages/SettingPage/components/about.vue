<template>
  <!-- 直接渲染为设置行，与其它设置分类保持一致的分隔线样式 -->
  <template v-for="(item, index) in aboutList" :key="index">
    <div class="setting-item" v-if="item.name !== '分割线'">
      <el-text>{{ translate(item.name) }}</el-text>
      <!-- <el-link :href="item.href">{{ item.value }}</el-link> -->
      <el-link @click="onValueClick(item)">{{ item.value }}</el-link>
    </div>
  </template>
</template>
<script setup>
import { ref } from "vue";
import { getVersion } from "@/utils/version.js";
import { countVersionClick } from "@/utils/backendRestart.js";
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
]);
const aboutList = ref(JSON.parse(localStorage.getItem("aboutList")));

allVersion()
  .then((res) => {
    originList.value = originList.value.concat(res.data.app_info);
    aboutList.value = originList.value;
    localStorage.setItem("aboutList", JSON.stringify(originList.value));
  })
  .catch(() => {});

// 后端版本号兼作隐藏入口：连续点击 10 次后，「后端设置」里解锁重启按钮
const onValueClick = (item) => {
  if (item.name === "后端版本") {
    countVersionClick();
    return;
  }
  if (item.href) window.open(item.href, "_blank");
};
</script>
