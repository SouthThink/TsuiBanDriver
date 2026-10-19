<template>
  <div class="timetable-page">
    <h2 class="season-title">{{ seasonTitle }}</h2>

    <div ref="dayBarRef" class="day-bar">
      <button
        v-for="day in navType"
        :key="day.type"
        type="button"
        class="day-chip"
        :class="{
          active: nav === day.type,
          today: day.type === todayWeekday,
        }"
        @click="nav = day.type"
      >
        <span class="day-name">{{ translate(day.name) }}</span>
        <span v-if="day.type === todayWeekday" class="today-dot" />
        <span class="day-count">{{ dayCounts[day.type] || 0 }}</span>
      </button>
    </div>

    <div v-if="loading" class="skeleton-wrap">
      <el-skeleton animated>
        <template #template>
          <div class="bangumi-grid">
            <div v-for="n in 12" :key="n" class="skeleton-card">
              <el-skeleton-item variant="image" class="skeleton-poster" />
              <el-skeleton-item
                variant="text"
                style="width: 80%; margin-top: 8px"
              />
              <el-skeleton-item
                variant="text"
                style="width: 45%; margin-top: 6px"
              />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <template v-else>
      <div v-if="currentDayItems.length > 0" class="bangumi-grid">
        <BangumiCardRow
          v-for="item in currentDayItems"
          :key="item.id"
          :imgUrl="item.images?.common || item.images?.medium"
          :title="getTitle(item)"
          :rating="item.rating?.score || 0"
          @click="onClickItem(item)"
        />
      </div>
      <el-empty
        v-else
        :image-size="100"
        :description="translate('暂无数据')"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useRouter } from "vue-router";
import { translate, getCurrentLang } from "@/utils/translate";
import { bangumiProxy } from "@/api/yzrServer";
import BangumiCardRow from "@/components/BangumiCardRow/index.vue";
import "@/components/BangumiCardRow/index.css";

const router = useRouter();

function getUseMirror() {
  const settings = JSON.parse(localStorage.getItem("timeTableSettings") || "{}");
  return settings.useMirror || false;
}

function getClickAction() {
  const settings = JSON.parse(localStorage.getItem("timeTableSettings") || "{}");
  return settings.clickAction || "openDetail";
}

const navType = [
  { name: "星期一", type: 1 },
  { name: "星期二", type: 2 },
  { name: "星期三", type: 3 },
  { name: "星期四", type: 4 },
  { name: "星期五", type: 5 },
  { name: "星期六", type: 6 },
  { name: "星期日", type: 7 },
];

const seasonTitle = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const seasonKey = month <= 3 ? '冬季' : month <= 6 ? '春季' : month <= 9 ? '夏季' : '秋季';
  return `${year}${translate('年')}${translate(seasonKey)}${translate('新番')}`;
});

const isChinese = computed(() => {
  return getCurrentLang().startsWith('zh');
});

function getTodayWeekday() {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 7 : jsDay; // API: 1=Mon, 7=Sun
}

const todayWeekday = getTodayWeekday();
const nav = ref(todayWeekday);
const loading = ref(true);
const calendarData = ref([]);
const dayBarRef = ref(null);

const dayCounts = computed(() => {
  const counts = {};
  calendarData.value.forEach((day) => {
    counts[day.weekday.id] = day.items?.length || 0;
  });
  return counts;
});

// 数据加载后把当前选中/今天滚到日期栏中间，移动端也能直接看到
const scrollActiveDayIntoView = () => {
  nextTick(() => {
    const bar = dayBarRef.value;
    if (!bar) return;
    const active = bar.querySelector(".day-chip.active");
    if (!active) return;
    const target =
      active.offsetLeft - bar.clientWidth / 2 + active.offsetWidth / 2;
    bar.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  });
};

watch(nav, scrollActiveDayIntoView);

onMounted(() => {
  fetchCalendar();
  scrollActiveDayIntoView();
});

async function fetchCalendar() {
  loading.value = true;
  try {
    const res = await bangumiProxy("calendar", { params: { useMirror: getUseMirror() } });
    if (res.code === 200) {
      calendarData.value = res.data;
    }
  } catch {
    // 错误已由 request 统一提示
    calendarData.value = [];
  } finally {
    loading.value = false;
    scrollActiveDayIntoView();
  }
}

const currentDayData = computed(() => {
  return calendarData.value.find((day) => day.weekday.id === nav.value);
});

const currentDayItems = computed(() => {
  return currentDayData.value?.items || [];
});

function getTitle(item) {
  return isChinese.value ? (item.name_cn || item.name) : item.name;
}

// 按时间表设置决定点击行为：进详情页 / 跳搜索页
function onClickItem(item) {
  if (getClickAction() === "openDetail") {
    router.push({ name: "animeDetail", query: { bgmId: item.id } });
    return;
  }
  router.push({ name: "search", query: { q: getTitle(item) } });
}
</script>

<style scoped>
.timetable-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 4px clamp(4px, 2.5vw, 28px) 32px;
}

.season-title {
  margin: 6px 0 2px;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: clamp(18px, 2.4vw, 24px);
}

.day-bar {
  display: flex;
  gap: 8px;
  padding: 10px 0 14px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.day-bar::-webkit-scrollbar {
  display: none;
}

.day-chip {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;
}

.day-chip:hover {
  border-color: var(--el-border-color);
  background-color: var(--el-fill-color-light);
}

.day-chip.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.today-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
}

.day-count {
  min-width: 18px;
  padding: 0 6px;
  border-radius: 9px;
  background-color: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 17px;
  text-align: center;
}

.day-chip.active .day-count {
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

.bangumi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.bangumi-grid :deep(.bangumi-item) {
  margin-top: 0;
}

.skeleton-card {
  min-width: 0;
}

.skeleton-poster {
  width: 100%;
  aspect-ratio: 2 / 3;
  max-height: 200px;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .timetable-page {
    padding: 2px 4px 24px;
  }

  .day-chip {
    padding: 6px 11px;
    font-size: 12px;
  }

  .bangumi-grid {
    grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
    gap: 8px;
  }
}
</style>
