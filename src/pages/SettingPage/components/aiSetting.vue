<template>
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
import { getAiChatConfig, saveAiChatConfig } from "@/api/yzrServer.js";

const chatApiKey = ref("");
const chatBaseUrl = ref("");
const chatModel = ref("");

const loadChatConfig = async () => {
  getAiChatConfig().then((res) => {
    if (res.code === 200 && res.data) {
      chatApiKey.value = res.data.api_key || "";
      chatBaseUrl.value = res.data.base_url || "";
      chatModel.value = res.data.model || "";
    }
  }).catch(() => {});
};

loadChatConfig();

const saveChatConfig = () => {
  saveAiChatConfig({
    api_key: chatApiKey.value,
    base_url: chatBaseUrl.value,
    model: chatModel.value,
  }).catch(() => {});
};
</script>
<style scoped>
.danmaku-setting {
  width: 200px;
}
</style>
