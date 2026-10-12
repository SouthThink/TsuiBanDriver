<template>
  <RouterView />

  <!-- 首次进入：要求输入用户名，用于保存观看历史与个性化设置 -->
  <el-dialog
    v-model="showUsernameDialog"
    :title="translate('请输入用户名')"
    width="380px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <p class="username-tip">
      {{ translate("用户名用于保存观看历史与个性化设置，可随时在设置中切换") }}
    </p>
    <el-input
      v-model="nameInput"
      :placeholder="translate('用户名')"
      maxlength="20"
      show-word-limit
      @keyup.enter="confirmUsername"
    />
    <template #footer>
      <el-button
        type="primary"
        :disabled="!nameInput.trim()"
        :loading="saving"
        @click="confirmUsername"
      >
        {{ translate("确定") }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref } from "vue";
import { useDark } from "@vueuse/core";
import { translate } from "@/utils/translate";
import { username, setUsername } from "@/utils/user";
import { pullUserSettings } from "@/utils/userSettings";

useDark();

const showUsernameDialog = ref(!String(username.value || "").trim());
const nameInput = ref("");
const saving = ref(false);

const confirmUsername = async () => {
  const name = nameInput.value.trim();
  if (!name) {
    ElMessage.warning(translate("请输入用户名"));
    return;
  }
  saving.value = true;
  try {
    setUsername(name);
    await pullUserSettings();
    showUsernameDialog.value = false;
    // 设置（如语言）需要重新载入才能全局生效
    window.location.reload();
  } finally {
    saving.value = false;
  }
};
</script>
<style scoped>
.username-tip {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
