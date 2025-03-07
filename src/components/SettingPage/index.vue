<template>
  <div class="setting-page">
    <el-card>
      <template #header>
        <el-text size="large">主题设置</el-text>
      </template>
      <div class="setting-item">
        <el-text>深色模式</el-text>
        <dark-switch />
      </div>
    </el-card>
  </div>
</template>
<script setup>
import darkSwitch from "./components/darkSwitch.vue";
</script>
<style scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
