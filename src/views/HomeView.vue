<template>
  <div class="layout">
    <div v-if="showAside" class="layout-aside">
      <SideMenu />
    </div>
    <el-drawer
      v-if="isNarrow"
      v-model="drawerVisible"
      direction="ltr"
      size="200px"
      :with-header="false"
      style="--el-drawer-padding-primary: 0"
    >
      <SideMenu />
    </el-drawer>

    <div class="layout-body">
      <div class="layout-header">
        <el-button text :icon="toggleIcon" @click="toggleAside" />
        <el-text size="large" class="layout-title">{{ pageTitle }}</el-text>
      </div>
      <div class="layout-view">
        <RouterView />
      </div>
    </div>

    <!-- 窄屏遮罩，点击关闭抽屉 -->
    <div v-if="isNarrow && drawerVisible" class="layout-mask" @click="drawerVisible = false" />
  </div>
</template>
<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useMediaQuery } from "@vueuse/core";
import { Menu, Expand, Fold } from "@element-plus/icons-vue";
import SideMenu from "@/components/SideMenu/index.vue";
import { menuItems } from "@/utils/menu";
import { translate } from "@/utils/translate";

const route = useRoute();
const isNarrow = useMediaQuery("(max-width: 768px)");
const drawerVisible = ref(false);
const asideVisible = ref(true);

const showAside = computed(() => !isNarrow.value && asideVisible.value);

const toggleIcon = computed(() => {
  if (isNarrow.value) return Menu;
  return asideVisible.value ? Fold : Expand;
});

const pageTitle = computed(() => {
  const item = menuItems.find((menu) => menu.path === route.path);
  return item ? translate(item.label) : "";
});

const toggleAside = () => {
  if (isNarrow.value) {
    drawerVisible.value = true;
  } else {
    asideVisible.value = !asideVisible.value;
  }
};

// 窄屏下点击菜单跳转后关闭抽屉
watch(
  () => route.path,
  () => {
    drawerVisible.value = false;
  }
);
</script>
<style scoped>
.layout {
  position: fixed;
  inset: 0;
  display: flex;
}

.layout-aside {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color);
}

.layout-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.layout-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 8px;
  border-bottom: 1px solid var(--el-border-color);
}

.layout-title {
  font-weight: bold;
}

.layout-view {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px;
}

.layout-mask {
  position: fixed;
  inset: 0;
  z-index: 1999;
  background: rgba(0, 0, 0, 0.4);
}

/* 窄屏适配，减少左右留白让内容更宽更好读 */
@media (max-width: 768px) {
  .layout-header {
    height: 44px;
    padding: 0 6px;
  }

  .layout-view {
    padding: 6px;
  }
}
</style>
<style>
:root {
  --el-bg-color-overlay: #e5eaf3;
}
</style>
