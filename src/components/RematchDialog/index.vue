<template>
  <el-dialog
    v-model="visible"
    :title="translate('重新识别')"
    width="680px"
    :fullscreen="isMobile"
    destroy-on-close
  >
    <div class="rematch-file" :title="file.Name">{{ file.Name }}</div>

    <el-tabs v-model="activeTab" class="rematch-tabs" @tab-change="onTabChange">
      <el-tab-pane :label="translate('本地已识别')" name="local">
        <el-input
          v-model="localKeyword"
          :placeholder="translate('搜索番剧')"
          clearable
          @input="onLocalSearch"
        />
      </el-tab-pane>
      <el-tab-pane :label="translate('在线搜索')" name="online">
        <el-input
          v-model="onlineKeyword"
          :placeholder="translate('搜索番剧')"
          clearable
          @input="onOnlineSearch"
        />
      </el-tab-pane>
    </el-tabs>

    <div class="rematch-body" v-loading="loading || applying">
      <!-- 已打开作品：选择剧集 -->
      <template v-if="currentAnime">
        <div class="rematch-subhead">
          <el-button link @click="backToList">
            <el-icon><ArrowLeft /></el-icon>
            {{ translate("返回") }}
          </el-button>
          <span class="rematch-subhead-title" :title="currentAnime.Title">
            {{ currentAnime.Title }}
          </span>
        </div>
        <el-scrollbar height="300px">
          <div class="rematch-list">
            <div
              v-for="episode in episodes"
              :key="episode.EpisodeId"
              class="rematch-episode"
              :class="{ 'is-current': isCurrentEpisode(episode) }"
              @click="apply(episode)"
            >
              <span class="rematch-episode-number">{{ episode.EpisodeNumber }}</span>
              <span class="rematch-episode-title">{{ episode.EpisodeTitle }}</span>
              <span v-if="isCurrentEpisode(episode)" class="rematch-episode-current">
                {{ translate("当前剧集") }}
              </span>
              <span class="rematch-episode-date">{{ formatAirDate(episode.AirDate) }}</span>
            </div>
            <el-empty
              v-if="!loading && episodes.length === 0"
              :description="translate('该作品暂无剧集')"
            />
          </div>
        </el-scrollbar>
      </template>

      <!-- 作品列表 -->
      <template v-else>
        <el-scrollbar height="300px">
          <div class="rematch-list">
            <div
              v-for="anime in animeList"
              :key="anime.AnimeId"
              class="rematch-anime"
              @click="openAnime(anime)"
            >
              <el-image :src="anime.ImageUrl" fit="cover" class="rematch-anime-cover">
                <template #error>
                  <div class="rematch-anime-empty">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="rematch-anime-info">
                <span class="rematch-anime-title" :title="anime.Title">{{ anime.Title }}</span>
                <span class="rematch-anime-meta">
                  <span v-if="anime.TypeDescription">{{ anime.TypeDescription }}</span>
                  <span v-if="anime.Rating">{{ anime.Rating }}</span>
                </span>
              </div>
            </div>
            <el-empty v-if="!loading && animeList.length === 0" :description="emptyText" />
          </div>
        </el-scrollbar>
      </template>
    </div>
  </el-dialog>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import { ArrowLeft, Picture } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { animeEpisodes, localBangumi, rematchFile, searchAnime } from "@/api/yzrServer";
import { translate } from "@/utils/translate";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  // 待改判的文件：{ Name, VideoId, AnimeId, AnimeTitle, EpisodeId }
  file: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(["update:modelValue", "success"]);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isMobile = ref(window.innerWidth <= 768);
const activeTab = ref("local");
const localKeyword = ref("");
const onlineKeyword = ref("");
const localList = ref([]);
const onlineList = ref([]);
const currentAnime = ref(null);
const episodes = ref([]);
const loading = ref(false);
const applying = ref(false);
let searchTimer = null;

const animeList = computed(() =>
  activeTab.value === "local" ? localList.value : onlineList.value
);
const emptyText = computed(() => {
  if (activeTab.value === "online" && !onlineKeyword.value.trim()) {
    return translate("请输入关键字搜索");
  }
  return translate("未找到作品");
});

async function loadLocal(keyword) {
  loading.value = true;
  try {
    const res = await localBangumi({ keyword });
    localList.value = (res && res.data) || [];
  } catch {
    // 错误已由 request 统一提示
    localList.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadOnline(keyword) {
  loading.value = true;
  try {
    const res = await searchAnime({ keyword });
    onlineList.value = (res && res.data) || [];
  } catch {
    // 错误已由 request 统一提示
    onlineList.value = [];
  } finally {
    loading.value = false;
  }
}

// 关键字变化后延迟请求，避免逐字调用接口；同时回到作品列表
function scheduleSearch(run, keyword) {
  clearTimeout(searchTimer);
  backToList();
  searchTimer = setTimeout(() => run(keyword), 300);
}

function onLocalSearch() {
  scheduleSearch(loadLocal, localKeyword.value.trim());
}

function onOnlineSearch() {
  const keyword = onlineKeyword.value.trim();
  if (!keyword) {
    clearTimeout(searchTimer);
    onlineList.value = [];
    backToList();
    return;
  }
  scheduleSearch(loadOnline, keyword);
}

function onTabChange() {
  backToList();
}

async function openAnime(anime) {
  currentAnime.value = anime;
  episodes.value = [];
  loading.value = true;
  try {
    const res = await animeEpisodes({ animeId: anime.AnimeId });
    episodes.value = (res && res.data) || [];
  } catch {
    // 错误已由 request 统一提示
    episodes.value = [];
  } finally {
    loading.value = false;
  }
}

function backToList() {
  currentAnime.value = null;
  episodes.value = [];
}

// 该剧集是否就是文件当前识别到的剧集
function isCurrentEpisode(episode) {
  return !!props.file.EpisodeId && String(episode.EpisodeId) === String(props.file.EpisodeId);
}

// 放送日期只精确到天（接口返回形如 2023-04-19T00:00:00）
function formatAirDate(value) {
  return String(value || "").split("T")[0];
}

// 选中剧集即写入改判结果：更新识别记录并同步番剧库
async function apply(episode) {
  if (applying.value) return;
  applying.value = true;
  try {
    const res = await rematchFile({
      videoId: props.file.VideoId,
      animeId: currentAnime.value.AnimeId,
      episodeId: episode.EpisodeId,
    });
    if (res && res.code === 200) {
      ElMessage.success(translate("修改成功"));
      visible.value = false;
      emit("success", res.data);
    }
  } catch {
    // 错误已由 request 统一提示
  } finally {
    applying.value = false;
  }
}

watch(visible, (value) => {
  if (!value) return;
  activeTab.value = "local";
  localKeyword.value = "";
  onlineKeyword.value = "";
  onlineList.value = [];
  backToList();
  loadLocal("");
  // 已识别过的文件：直接打开当前所属作品的剧集列表，并标出当前剧集
  if (props.file.AnimeId && props.file.EpisodeId) {
    openAnime({
      AnimeId: props.file.AnimeId,
      Title: props.file.AnimeTitle || "",
    });
  }
});
</script>
<style scoped>
.rematch-file {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
}

.rematch-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.rematch-body {
  margin-top: 12px;
  min-height: 300px;
}

.rematch-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 6px;
}

/* 作品条目 */
.rematch-anime {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.rematch-anime:hover {
  background-color: var(--el-fill-color-light);
}

.rematch-anime-cover,
.rematch-anime-empty {
  flex-shrink: 0;
  width: 48px;
  height: 66px;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--el-fill-color);
}

.rematch-anime-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
}

.rematch-anime-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rematch-anime-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.rematch-anime-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 作品已打开：标题与返回 */
.rematch-subhead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  min-width: 0;
}

.rematch-subhead-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 剧集条目 */
.rematch-episode {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.rematch-episode:hover {
  background-color: var(--el-fill-color-light);
}

.rematch-episode-number {
  flex-shrink: 0;
  width: 28px;
  font-size: 13px;
  text-align: right;
  color: var(--el-text-color-secondary);
}

.rematch-episode-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.rematch-episode-date {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 文件当前识别到的剧集 */
.rematch-episode.is-current {
  background-color: var(--el-color-primary-light-9);
}

.rematch-episode.is-current:hover {
  background-color: var(--el-color-primary-light-8);
}

.rematch-episode.is-current .rematch-episode-title {
  font-weight: 600;
  color: var(--el-color-primary);
}

.rematch-episode-current {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-8);
}
</style>
