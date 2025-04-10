<template>
  <el-radio-group v-model="downPageIsTable" @change="changeDownPageIsTable">
    <el-radio-button :label="translate('表格')" value="table" />
    <el-radio-button :label="translate('卡片')" value="card" />
  </el-radio-group>
</template>

<script setup>
import { ref } from "vue";
import { translate } from "@/utils/translate";

const downPageIsTable = ref();

if (localStorage.getItem("downPageType") === null) {
  localStorage.setItem("downPageType", "table");
}

downPageIsTable.value = localStorage.getItem("downPageType") || "table";

const changeDownPageIsTable = (val) => {
  localStorage.setItem("downPageType", val);
};
</script>

<style></style>
