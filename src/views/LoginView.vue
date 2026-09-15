<template>
  <div class="login-page">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <el-icon size="20"><Lock /></el-icon>
          <el-text size="large">{{ translate("密码保护") }}</el-text>
        </div>
      </template>
      <div class="login-body">
        <el-text type="info" size="small">
          {{ translate("请输入访问密码") }}
        </el-text>
        <el-input
          v-model="password"
          type="password"
          show-password
          clearable
          :placeholder="translate('请输入访问密码')"
          @keyup.enter="handleLogin"
        />
        <el-text v-if="errorMsg" type="danger" size="small">{{ errorMsg }}</el-text>
        <el-button
          type="primary"
          class="login-button"
          :loading="loading"
          @click="handleLogin"
        >
          {{ translate("登录") }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { authLogin, getAuthStatus } from "@/api/yzrServer";
import { setAuthToken } from "@/utils/auth";
import { translate } from "@/utils/translate";

const route = useRoute();
const router = useRouter();

const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

const redirectTo = () => route.query.redirect || "/";

const goHome = () => {
  router.replace(redirectTo());
};

// 密码保护已关闭或已登录时，直接进入主页
onMounted(async () => {
  try {
    const res = await getAuthStatus();
    if (!res.data.enabled || res.data.authenticated) {
      goHome();
    }
  } catch {
    // 后端不可用时停留在登录页
  }
});

const handleLogin = async () => {
  if (!password.value) {
    errorMsg.value = translate("密码不能为空");
    return;
  }
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await authLogin({ password: password.value });
    setAuthToken(res.data && res.data.token);
    ElMessage.success(translate("登录成功"));
    goHome();
  } catch (err) {
    // wretch 对非 2xx 响应抛出的是 WretchError，状态码在 status 上
    const code = err.code || err.status;
    errorMsg.value = code === 401 ? translate("密码错误") : translate("网络错误");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 360px;
}

.login-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-button {
  width: 100%;
}
</style>
