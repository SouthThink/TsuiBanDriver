<template>
  <div class="setting-item">
    <el-text>{{ translate("密码保护") }}</el-text>
    <el-switch v-model="authEnabled" @change="saveConfig" />
  </div>
  <div class="setting-item">
    <el-text>{{ translate("访问密码") }}</el-text>
    <el-input
      v-model="password"
      :placeholder="translate('请输入访问密码')"
      style="max-width: 60%; width: 240px"
      type="password"
      show-password
      :disabled="!authEnabled"
      @change="saveConfig"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { translate } from "@/utils/translate";
import { getAuthConfig, saveAuthConfig } from "@/api/yzrServer";
import { setAuthToken } from "@/utils/auth";

const authEnabled = ref(false);
const password = ref("");

const loadConfig = async () => {
  try {
    const res = await getAuthConfig();
    if (res.code === 200 && res.data) {
      authEnabled.value = !!res.data.auth_enabled;
      password.value = res.data.auth_password || "";
    }
  } catch {
    // 错误已由 request 统一提示
  }
};

const saveConfig = async () => {
  if (authEnabled.value && !password.value) {
    ElMessage.error(translate("密码不能为空"));
    await loadConfig();
    return;
  }
  try {
    const res = await saveAuthConfig({
      auth_enabled: authEnabled.value,
      auth_password: password.value,
    });
    // 密码变更后旧令牌失效，使用后端返回的新令牌保持登录状态
    setAuthToken(res.data && res.data.token);
    ElMessage.success(translate("保存成功"));
  } catch {
    // 错误已由 request 统一提示
    await loadConfig();
  }
};

onMounted(loadConfig);
</script>
