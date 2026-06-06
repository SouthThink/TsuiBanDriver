<template>
  <div class="timetable-page">
    <div class="topTool">
      <el-text class="season-title">{{ seasonTitle }}</el-text>
      <el-radio-group v-model="nav" class="nav-item">
        <el-radio-button
          v-for="item in navType"
          :key="item.type"
          :value="item.type"
          size="default"
        >
          {{ translate(item.name) }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <el-skeleton :loading="loading" animated :count="3">
      <template #default>
        <div class="timetable-card" v-if="currentDayItems.length > 0">
          <el-row :gutter="12" class="timetable-card-row">
            <el-col
              :xs="8"
              :sm="6"
              :md="4"
              :lg="3"
              v-for="item in currentDayItems"
              :key="item.id"
            >
              <BangumiCardRow
                :imgUrl="item.images?.common || item.images?.medium"
                :title="getTitle(item)"
                :rating="item.rating?.score || 0"
                @click="toSearch(item)"
              />
            </el-col>
          </el-row>
        </div>
        <el-empty v-else :description="translate('暂无数据')" />
      </template>
    </el-skeleton>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { translate, getCurrentLang } from "@/utils/translate";
import axios from "axios";
import BangumiCardRow from "@/components/BangumiCardRow/index.vue";
import "@/components/BangumiCardRow/index.css";

const emit = defineEmits(["go-search"]);

const BGMI_API = "https://api.bgm.tv";
const BGMI_MIRROR_API = "https://bgmapi.anibt.net/";

function getBgmApi() {
  const settings = JSON.parse(localStorage.getItem("timeTableSettings") || "{}");
  return settings.useMirror ? BGMI_MIRROR_API : BGMI_API;
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

const nav = ref(getTodayWeekday());
const loading = ref(true);
const calendarData = ref([]);

onMounted(() => {
  fetchCalendar();
});

async function fetchCalendar() {
  loading.value = true;
  try {
    const { data } = await axios.get(`${getBgmApi()}/calendar`);
    calendarData.value = data;
  } catch (err) {
    console.error("获取时间表失败:", err);
    calendarData.value = [];
  } finally {
    loading.value = false;
  }
}

const currentDayData = computed(() => {
  return calendarData.value.find((day) => day.weekday.id === nav.value);
});

const currentDayTitle = computed(() => {
  return currentDayData.value?.weekday?.cn || "";
});

const currentDayItems = computed(() => {
  return currentDayData.value?.items || [];
});

function getTitle(item) {
  return isChinese.value ? (item.name_cn || item.name) : item.name;
}

function toSearch(item) {
  const name = getTitle(item);
  emit("go-search", name);
}
</script>

<style scoped>
.timetable-page {
  width: 100%;
}

.topTool {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1500px;
  margin: auto;
  padding-bottom: 10px;
  flex-wrap: wrap;
}

.season-title {
  display: block;
  width: 100%;
  margin-top: 14px;
  margin-bottom: 6px;
  font-size: 1.6em;
  font-weight: bold;
}

.nav-item {
  margin-top: 10px;
  scrollbar-width: none;
  overflow-x: auto;
  overflow-y: hidden;
  flex-wrap: nowrap;
  max-width: 100%;
}

.timetable-card-title {
  height: 36px;
  font-size: 1.5em;
  font-weight: bold;
}

.timetable-card-row {
  margin-top: 6px;
}

.timetable-card {
  width: 100%;
  max-width: 1500px;
  margin: auto;
  margin-top: 10px;
}
</style>