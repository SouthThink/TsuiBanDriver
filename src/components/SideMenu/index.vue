<template>
  <div class="side-menu">
    <el-menu :default-active="route.path" :router="true" class="menu-main">
      <el-menu-item v-for="item in mainMenuItems" :key="item.path" :index="item.path">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ translate(item.label) }}</span>
      </el-menu-item>
    </el-menu>
    <el-menu :default-active="route.path" :router="true" class="menu-bottom">
      <el-menu-item v-for="item in bottomMenuItems" :key="item.path" :index="item.path">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ translate(item.label) }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { mainMenuItems, bottomMenuItems } from "@/utils/menu";
import { translate } from "@/utils/translate";

const route = useRoute();
</script>

<style scoped>
.side-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.menu-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-right: none;
}

.menu-bottom {
  border-right: none;
  border-top: 1px solid var(--el-border-color);
}
</style>
