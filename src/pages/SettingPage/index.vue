<template>
  <div class="settings-page">
    <!-- 左侧分类导航：点击滚动定位，滚动时自动高亮 -->
    <nav class="settings-nav">
      <button
        v-for="section in settingsSections"
        :key="section.id"
        type="button"
        class="settings-nav-item"
        :class="{ active: activeSection === section.id }"
        @click="scrollToSection(section.id)"
      >
        <el-icon class="settings-nav-icon"><component :is="section.icon" /></el-icon>
        <span class="settings-nav-label">{{ translate(section.label) }}</span>
      </button>
    </nav>

    <!-- 右侧设置内容 -->
    <div ref="contentRef" class="settings-content">
      <section
        v-for="section in settingsSections"
        :key="section.id"
        :ref="(el) => setSectionRef(section.id, el)"
        class="settings-section"
      >
        <header class="settings-section-header">
          <h2 class="settings-section-title">{{ translate(section.label) }}</h2>
          <p class="settings-section-desc">{{ translate(section.desc) }}</p>
        </header>
        <div class="settings-group">
          <component v-for="(comp, index) in section.components" :is="comp" :key="index" />
        </div>
      </section>
      <p class="settings-copyright">{{ translate("网页版权声明") }}</p>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  Brush,
  Calendar,
  ChatDotRound,
  ChatLineSquare,
  Connection,
  InfoFilled,
  Lock,
  Search,
} from "@element-plus/icons-vue";
import { translate } from "@/utils/translate";
import darkSwitch from "./components/darkSwitch.vue";
import language from "./components/language.vue";
import downPageIsTableBtn from "./components/downPageIsTableBtn.vue";
import danmakuSetting from "./components/danmakuSetting.vue";
import timeTableSetting from "./components/timeTableSetting.vue";
import searchSetting from "./components/searchSetting.vue";
import backendSetting from "./components/backendSetting.vue";
import authSetting from "./components/authSetting.vue";
import about from "./components/about.vue";
import aiSetting from "./components/aiSetting.vue";

// 设置页配置：新增一个分类只需在此追加一项，导航与内容会自动生成
// label / desc 为翻译键，components 为该分类下的设置组件（按顺序渲染）
const settingsSections = [
  {
    id: "theme",
    label: "主题设置",
    desc: "外观、语言与下载页展示方式",
    icon: Brush,
    components: [darkSwitch, downPageIsTableBtn, language],
  },
  {
    id: "timetable",
    label: "时间表设置",
    desc: "新番时间表的显示与点击行为",
    icon: Calendar,
    components: [timeTableSetting],
  },
  {
    id: "search",
    label: "搜索设置",
    desc: "搜索规则、请求头与网络代理",
    icon: Search,
    components: [searchSetting],
  },
  {
    id: "ai",
    label: "AI设置",
    desc: "AI 对话的接口与模型配置",
    icon: ChatDotRound,
    components: [aiSetting],
  },
  {
    id: "danmaku",
    label: "弹幕设置",
    desc: "弹幕显示范围、透明度与速度",
    icon: ChatLineSquare,
    components: [danmakuSetting],
  },
  {
    id: "backend",
    label: "后端设置",
    desc: "qBittorrent 与 dandanPlay 连接信息",
    icon: Connection,
    components: [backendSetting],
  },
  {
    id: "auth",
    label: "密码保护",
    desc: "为网页访问设置密码",
    icon: Lock,
    components: [authSetting],
  },
  {
    id: "about",
    label: "关于",
    desc: "版本信息与项目地址",
    icon: InfoFilled,
    components: [about],
  },
];

const activeSection = ref(settingsSections[0].id);
const contentRef = ref(null);
const sectionEls = {};
let scrollParent = null;

const setSectionRef = (id, el) => {
  if (el) sectionEls[id] = el;
  else delete sectionEls[id];
};

const scrollToSection = (id) => {
  const el = sectionEls[id];
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  activeSection.value = id;
};

// 滚动时高亮当前分类：取最后一个顶部已到达容器顶部的分类
const updateActiveSection = () => {
  const containerTop =
    scrollParent && scrollParent !== window ? scrollParent.getBoundingClientRect().top : 0;
  let current = settingsSections[0].id;
  for (const section of settingsSections) {
    const el = sectionEls[section.id];
    if (!el) continue;
    if (el.getBoundingClientRect().top - containerTop <= 40) current = section.id;
    else break;
  }
  activeSection.value = current;
};

// 找到真正滚动的祖先容器（页面内容区由 HomeView 的 .layout-view 滚动）
const resolveScrollParent = (el) => {
  let parent = el?.parentElement;
  while (parent && parent !== document.body) {
    const overflowY = getComputedStyle(parent).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return parent;
    parent = parent.parentElement;
  }
  return window;
};

onMounted(() => {
  scrollParent = resolveScrollParent(contentRef.value);
  const target = scrollParent === window ? window : scrollParent;
  target.addEventListener("scroll", updateActiveSection, { passive: true });
  updateActiveSection();
});

onBeforeUnmount(() => {
  const target = scrollParent === window ? window : scrollParent;
  target?.removeEventListener("scroll", updateActiveSection);
});
</script>

<style scoped>
.settings-page {
  display: flex;
  align-items: flex-start;
  gap: 36px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 4px 4px 32px;
}

/* ---- 左侧分类导航 ---- */
.settings-nav {
  position: sticky;
  top: 0;
  flex-shrink: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.settings-nav-item:hover {
  background: var(--el-fill-color-light);
}

.settings-nav-item.active {
  font-weight: 500;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.settings-nav-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.settings-nav-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---- 右侧设置内容 ---- */
.settings-content {
  flex: 1;
  min-width: 0;
}

.settings-section {
  padding: 24px 0 8px;
  scroll-margin-top: 4px;
}

.settings-section-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.settings-section-desc {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 设置行分组：仅用细分隔线区分，不套卡片 */
.settings-group {
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.settings-copyright {
  display: block;
  margin: 32px 0 0;
  font-size: 12px;
  text-align: center;
  color: var(--el-text-color-placeholder);
}

/* ---- 窄屏：导航改为顶部横向标签栏 ---- */
@media (max-width: 768px) {
  .settings-page {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    /* 左右留白：12px（本页）+ 6px（HomeView 内容区 padding），避免贴边过挤 */
    padding: 0 12px 24px;
  }

  .settings-nav {
    position: sticky;
    top: 0;
    z-index: 5;
    flex-direction: row;
    gap: 6px;
    width: auto;
    /* 抵消上面的左右留白，让标签栏底色铺满整行，同时标签与内容左对齐 */
    margin: 0 -18px;
    padding: 6px 18px;
    overflow-x: auto;
    scrollbar-width: none;
    /* 与页面底色一致，避免内容穿过标签栏 */
    background: var(--color-background);
  }

  .settings-nav::-webkit-scrollbar {
    display: none;
  }

  .settings-nav-item {
    flex-shrink: 0;
    width: auto;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 13px;
  }

  .settings-nav-icon {
    display: none;
  }

  .settings-section {
    padding: 20px 0 4px;
  }

  .settings-section-title {
    font-size: 16px;
  }
}
</style>

<style>
/* 设置行：由各设置组件共用，统一在此定义（子组件无需重复声明） */
.settings-page .setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 52px;
  padding: 10px 2px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.settings-page .setting-item > :first-child {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

@media (max-width: 768px) {
  .settings-page .setting-item {
    gap: 10px;
    min-height: 48px;
  }
}
</style>
