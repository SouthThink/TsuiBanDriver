<template>
  <el-radio-group v-model="downPageIsTable" @change="changeDownPageIsTable" size="small">
    <el-radio-button :label="translate('表格')" value="table" />
    <el-radio-button :label="translate('卡片')" value="card" />
  </el-radio-group>
</template>

<script setup>
import { ref } from "vue";
import { translate } from "@/utils/translate";
import { isMobile } from "@/utils/utils";

const downPageIsTable = ref();

const changeDownPageIsTable = (val) => {
  localStorage.setItem("downPageType", val);
};

// console.log(isMobile.value);

if (localStorage.getItem("downPageType") === null) {
  if(isMobile.value){
    changeDownPageIsTable("card");
  } else {
    changeDownPageIsTable("table");
  }
}

downPageIsTable.value = localStorage.getItem("downPageType");


</script>

<style></style>
