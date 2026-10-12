<template>
  <div class="setting-item">
    <el-text>{{ translate("用户名") }}</el-text>
    <div class="user-actions">
      <el-text class="user-name">{{ username || translate("未设置") }}</el-text>
      <el-button type="default" @click="openDialog">{{ translate("切换") }}</el-button>
    </div>
  </div>

  <el-dialog
    v-model="dialogVisible"
    :title="translate('切换用户名')"
    width="420px"
    destroy-on-close
  >
    <el-input
      v-model="nameInput"
      :placeholder="translate('用户名')"
      maxlength="20"
      show-word-limit
      @keyup.enter="confirm"
    />
    <template #footer>
      <el-button @click="dialogVisible = false">{{ translate("取消") }}</el-button>
      <el-button
        type="primary"
        :disabled="!nameInput.trim()"
        :loading="saving"
        @click="confirm"
      >
        {{ translate("确定") }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref } from "vue";
import { translate } from "@/utils/translate";
import { username, setUsername } from "@/utils/user";
import { pullUserSettings } from "@/utils/userSettings";

const dialogVisible = ref(false);
const nameInput = ref("");
const saving = ref(false);

const openDialog = () => {
  nameInput.value = username.value || "";
  dialogVisible.value = true;
};

const confirm = async () => {
  const name = nameInput.value.trim();
  if (!name) return;
  saving.value = true;
  try {
    setUsername(name);
    await pullUserSettings();
    dialogVisible.value = false;
    window.location.reload();
  } finally {
    saving.value = false;
  }
};
</script>
<style scoped>
.user-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.user-tip {
  margin: 0;
  padding: 6px 2px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
</style>
