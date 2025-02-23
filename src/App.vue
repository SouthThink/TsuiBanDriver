<template>
    <el-switch
    v-model="isDark"
    inline-prompt
    active-color="var(--el-fill-color-dark)"
    inactive-color="var(--el-color-primary)"
    active-text="暗"
    inactive-text="亮"
    :active-action-icon="Moon"
    :inactive-action-icon="Sunny"
    class="dark-switch"
    @change="toggleDark"
  />
  <RouterView />
</template>
<script setup>
import { useDark, useToggle } from "@vueuse/core";
import { Moon, Sunny } from '@element-plus/icons-vue'

const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>
<style scoped>
.dark-switch {
  position: absolute;
  right: 10px;
  top: 5px;
  z-index: 1;
}
</style>
