<template>
  <div class="bangumi-page">
    <div class="library-toolbar">
      <el-radio-group
        v-model="nav"
        class="nav-tabs"
        @change="onNavChange"
      >
        <el-radio-button
          v-for="item in navType"
          :key="item.type"
          :value="item.type"
        >
          {{ translate(item.name) }}
        </el-radio-button>
      </el-radio-group>
      <el-input
        v-model="search"
        class="library-search"
        :prefix-icon="Search"
        :placeholder="translate('搜索番剧')"
        clearable
        @input="onSearchInput"
      />
    </div>

    <div v-if="loading" class="skeleton-wrap">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item
            variant="h3"
            style="width: 140px; height: 22px; margin-bottom: 12px"
          />
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
      <section
        v-for="group in groups"
        :key="group.name"
        class="bangumi-section"
      >
        <header class="section-head">
          <h3 class="section-title">{{ group.name }}</h3>
          <span class="section-count">{{ group.items.length }}</span>
        </header>
        <div class="bangumi-grid">
          <BangumiCardRow
            v-for="video in group.items"
            :key="video.AnimeId"
            :imgUrl="getImageUrl(video.Cover)"
            :title="video.Title"
            :rating="video.Rating"
            :episodeWatched="video.EpisodeWatched"
            :episodeTotal="video.EpisodeTotal"
            :episodeLatest="video.EpisodeLatest"
            @click="openDetail(video)"
          />
        </div>
      </section>

      <el-empty
        v-if="groups.length === 0"
        :image-size="100"
        :description="translate('暂无数据')"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { Search } from "@element-plus/icons-vue";
import BangumiCardRow from "@/components/BangumiCardRow/index.vue";
import "@/components/BangumiCardRow/index.css";
import { translate } from "@/utils/translate";
import { searchBangumi } from "@/api/yzrServer";
import { username } from "@/utils/user";

const router = useRouter();

const navType = [
  { name: "番剧季度", type: "season" },
  { name: "最近播放", type: "lastplay" },
  { name: "最近更新", type: "lastupdate" },
  { name: "最近添加", type: "lastadd" },
  { name: "名称排序", type: "name" },
  { name: "分类排序", type: "category" },
  { name: "评分排序", type: "rating" },
];

const nav = ref("season");
const search = ref("");
const loading = ref(true);
const groups = ref([]);
let searchTimer = null;

const groupByGroupName = (data) => {
  const map = new Map();
  data.forEach((element) => {
    if (!map.has(element.GroupName)) {
      map.set(element.GroupName, []);
    }
    map.get(element.GroupName).push(element);
  });
  const list = Array.from(map, ([name, items]) => ({ name, items }));
  if (nav.value === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  groups.value = list;
};

const loadList = async (keyword = "") => {
  loading.value = true;
  try {
    const res = await searchBangumi({
      params: nav.value,
      keyword,
      username: username.value,
    });
    groupByGroupName((res && res.data) || []);
  } catch {
    // 错误已由 request 统一提示
  } finally {
    loading.value = false;
  }
};

// 切换分类时保留当前搜索词
const onNavChange = () => {
  clearTimeout(searchTimer);
  loadList(search.value.trim());
};

const onSearchInput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadList(search.value.trim()), 300);
};

onMounted(() => {
  loadList();
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
});

// 卡片点击进入番剧详情页
const openDetail = (video) => {
  router.push({
    name: "animeDetail",
    query: { animeId: video.AnimeId.toString() },
  });
};

const getImageUrl = (cover) => {
  if (!cover) return "";
  try {
    const queryIndex = cover.indexOf("?");
    if (queryIndex === -1) return cover;
    const queryString = cover.substring(queryIndex + 1);
    const params = new URLSearchParams(queryString);
    const url = params.get("url");
    return url ? decodeURIComponent(url) : cover;
  } catch {
    return cover;
  }
};
</script>

<style scoped>
.bangumi-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 4px clamp(4px, 2.5vw, 28px) 32px;
}

.library-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.nav-tabs {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  flex-wrap: nowrap;
  scrollbar-width: none;
}

.nav-tabs::-webkit-scrollbar {
  display: none;
}

.library-search {
  flex: 1;
  min-width: 180px;
  max-width: 320px;
  margin-left: auto;
}

.bangumi-section {
  margin-top: 18px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.section-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 16px;
}

.section-count {
  min-width: 20px;
  padding: 0 7px;
  border-radius: 10px;
  background-color: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 20px;
  text-align: center;
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
  .bangumi-page {
    padding: 2px 4px 24px;
  }

  .library-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .library-search {
    max-width: none;
    margin-left: 0;
  }

  .bangumi-section {
    margin-top: 14px;
  }

  .section-title {
    font-size: 15px;
  }

  .bangumi-grid {
    grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
    gap: 8px;
  }
}
</style>
