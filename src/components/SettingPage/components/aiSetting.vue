<template>
  <div class="setting-item">
    <!-- 设置会在第一次观看视频后生成 -->
    <el-text>{{ translate("模型选择") }}</el-text>
    <el-select
      v-model="moduel"
      :placeholder="translate('请选择模型')"
      style="max-width: 60%; width: 240px"
      @change="changeAiConfig('default_model')"
      :no-data-text="translate('暂无模型')"
      :no-match-text="translate('暂无匹配模型')"
    >
      <el-option
        v-for="item in moduelList"
        :key="item"
        :label="item"
        :value="item"
      />
    </el-select>
  </div>
  <div class="setting-item">
    <!-- 设置会在第一次观看视频后生成 -->
    <el-text>{{ translate("运行硬件选择") }}</el-text>
    <el-select
      v-model="device"
      :placeholder="translate('请选择硬件')"
      style="max-width: 60%; width: 240px"
      @change="changeAiConfig('default_device')"
      :no-data-text="translate('暂无可选硬件')"
      :no-match-text="translate('暂无匹配硬件')"
    >
      <el-option
        v-for="item in deviceList"
        :key="item"
        :label="item"
        :value="item"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { translate } from "@/utils/translate";
import { ref } from "vue";
import { aiConfig,addEditAiConfig } from "@/api/yzrServer.js";

const moduel = ref("");
const moduelList = ref([]);
const device = ref("");
const deviceList = ref([]);
const getModuelList = async () => {
  aiConfig().then((res) => {
    moduel.value = res.default_model;
    moduelList.value = res.valid_models;
    device.value = res.default_device;
    deviceList.value = res.valid_devices;
    console.log(res, "获取默认模型"); // 获取默认模型
  });
};
console.log(moduelList.value, "获取模型列表");
getModuelList();
const changeAiConfig = (key) => {
    
  addEditAiConfig({
    ai_config_key: key,
    ai_config_value: key == "default_model" ? moduel.value : device.value,
  }).then((res) => {
    console.log(res, "修改默认模型");
  });
};
</script>
<style scoped>
.danmaku-setting {
  width: 200px;
}
</style>
