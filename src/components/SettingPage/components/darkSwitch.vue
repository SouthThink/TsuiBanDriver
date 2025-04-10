<template>
    <el-switch
      v-model="isDark"
      inline-prompt
      active-color="var(--el-fill-color-dark)"
      inactive-color="var(--el-color-primary)"
      :active-text="translate('暗')"
      :inactive-text="translate('亮')"
      :active-action-icon="Moon"
      :inactive-action-icon="Sunny"
      class="dark-switch"
      @change="toggleDark"
    />
</template>
<script setup>
import { useDark, useToggle } from "@vueuse/core";
import { Moon, Sunny } from "@element-plus/icons-vue";
import { translate } from "@/utils/translate";

const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>
<style scoped>
.dark-switch {
  z-index: 1;
}
</style>
