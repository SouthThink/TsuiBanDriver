<template>
  <div class="setting-item" v-for="(item, index) in aboutList" :key="index">
    <el-text>{{ item.name }}</el-text>
    <el-link :href="item.href">{{ item.value }}</el-link>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { getVersion } from "@/utils/version.js";
const aboutList = ref([
    { name: "版本号", value: getVersion() },
    { name: "作者", value: "@SouthThink" },
    { name: "邮箱", value: "south_think@qq.com" },
    { name: "项目地址", value: "TsuiBanDriver", href: "https://github.com/SouthThink/TsuiBanDriver" },
    { name: "开源协议", value: "CC BY-NC 4.0", href: "https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans" },
]);

</script>
