<template>
  <div class="setting-item">
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
  <div class="setting-item">
    <el-text>{{ translate("API Key") }}</el-text>
    <el-input
      v-model="chatApiKey"
      :placeholder="translate('请输入API Key')"
      style="max-width: 60%; width: 240px"
      type="password"
      show-password
      @change="saveChatConfig"
    />
  </div>
  <div class="setting-item">
    <el-text>{{ translate("API地址") }}</el-text>
    <el-input
      v-model="chatBaseUrl"
      :placeholder="translate('请输入API地址')"
      style="max-width: 60%; width: 240px"
      @change="saveChatConfig"
    />
  </div>
  <div class="setting-item">
    <el-text>{{ translate("对话模型") }}</el-text>
    <el-input
      v-model="chatModel"
      :placeholder="translate('请输入模型名称')"
      style="max-width: 60%; width: 240px"
      @change="saveChatConfig"
    />
  </div>
</template>

<script setup lang="ts">
import { translate } from "@/utils/translate";
import { ref } from "vue";
import { aiConfig, addEditAiConfig, getAiChatConfig, saveAiChatConfig } from "@/api/yzrServer.js";

const moduel = ref("");
const moduelList = ref([]);
const device = ref("");
const deviceList = ref([]);

const chatApiKey = ref("");
const chatBaseUrl = ref("");
const chatModel = ref("");

const getModuelList = async () => {
  aiConfig().then((res) => {
    moduel.value = res.default_model;
    moduelList.value = res.valid_models;
    device.value = res.default_device;
    deviceList.value = res.valid_devices;
  });
};

const loadChatConfig = async () => {
  getAiChatConfig().then((res) => {
    if (res.code === 200 && res.data) {
      chatApiKey.value = res.data.api_key || "";
      chatBaseUrl.value = res.data.base_url || "";
      chatModel.value = res.data.model || "";
    }
  });
};

getModuelList();
loadChatConfig();

const changeAiConfig = (key) => {
  addEditAiConfig({
    ai_config_key: key,
    ai_config_value: key == "default_model" ? moduel.value : device.value,
  }).then((res) => {});
};

const saveChatConfig = () => {
  saveAiChatConfig({
    api_key: chatApiKey.value,
    base_url: chatBaseUrl.value,
    model: chatModel.value,
  });
};
</script>
<style scoped>
.danmaku-setting {
  width: 200px;
}
</style>
