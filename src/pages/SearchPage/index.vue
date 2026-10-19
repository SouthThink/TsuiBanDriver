<template>
  <div class="search-page">
    <div class="search-hero">
      <h2 class="search-hero-title">{{ translate("番剧搜索") }}</h2>
      <div class="search-bar">
        <el-input
          v-model="input"
          size="large"
          :placeholder="translate('番剧搜索')"
          :prefix-icon="Search"
          clearable
          @keyup.enter="searchAllInfoBtn"
        >
          <template #append>
            <el-button
              type="primary"
              :icon="Search"
              :loading="loading"
              @click="searchAllInfoBtn"
            >
              {{ translate("搜索") }}
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div v-if="loading" class="skeleton-grid">
      <el-skeleton v-for="item in 8" :key="item" animated>
        <template #template>
          <el-skeleton-item variant="image" class="skeleton-poster" />
          <el-skeleton-item
            variant="text"
            style="width: 80%; margin-top: 10px"
          />
          <el-skeleton-item
            variant="text"
            style="width: 45%; margin-top: 6px"
          />
        </template>
      </el-skeleton>
    </div>

    <template v-else>
      <SearchResult
        v-if="hasSearched && !isEmptyResult"
        :data="searchData"
        @select-bangumi="getSubgroupInfoBtn"
      />
      <el-empty
        v-else
        class="search-empty"
        :image-size="100"
        :description="
          hasSearched ? translate('无搜索结果') : translate('请输入关键字搜索')
        "
      />
    </template>

    <el-drawer
      v-model="showBangumi"
      :title="drawerTitle"
      direction="rtl"
      :size="isMobile ? '100%' : '420px'"
    >
      <div class="subgroup-list" v-loading="subtitleGroupListLoading">
        <div
          v-for="group in subtitleGroupList"
          :key="group.subgroupId"
          class="subgroup-item"
        >
          <span class="subgroup-name" :title="group.subgroupname">
            {{ group.subgroupname }}
          </span>
          <el-button
            v-if="qBittorrentEnabled"
            type="primary"
            plain
            size="small"
            @click="getRssLinkBtn(group)"
          >
            {{ translate("订阅") }}
          </el-button>
        </div>
        <el-empty
          v-if="!subtitleGroupListLoading && subtitleGroupList.length === 0"
          :image-size="72"
          :description="translate('未找到字幕组')"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useMediaQuery } from "@vueuse/core";
import SearchResult from "@/components/SearchResult/index.vue";
import {
  searchAllInfo,
  addRssLink,
  getSubgroupInfo,
} from "@/api/yzrServer.js";
import { Search } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { translate } from "@/utils/translate";
import { qBittorrentEnabled } from "@/utils/backendStatus";

const route = useRoute();
const isMobile = useMediaQuery("(max-width: 768px)");

const input = ref("");
const searchData = ref({ bangumiItem: [], rssItems: [], rssLink: "" });
const loading = ref(false);
const hasSearched = ref(false);
const subtitleGroupList = ref([]);
const showBangumi = ref(false);
const subtitleGroupListLoading = ref(false);
const bangumiId = ref(0);
const selectedBangumiTitle = ref("");

const isEmptyResult = computed(
  () =>
    (searchData.value.bangumiItem || []).length === 0 &&
    (searchData.value.rssItems || []).length === 0
);

const drawerTitle = computed(() =>
  selectedBangumiTitle.value
    ? `${translate("字幕组")} · ${selectedBangumiTitle.value}`
    : translate("字幕组")
);

const searchAllInfoBtn = () => {
  const keyword = input.value.trim();
  if (!keyword) {
    ElMessage.warning(translate("请输入关键字搜索"));
    return;
  }
  loading.value = true;
  hasSearched.value = true;
  searchData.value = { bangumiItem: [], rssItems: [], rssLink: "" };
  searchAllInfo({ name: keyword })
    .then((res) => {
      let rssItems = [];
      let rssLink = "";
      try {
        const rss = JSON.parse(res.data.rss).rss.channel;
        rssItems = Array.isArray(rss.item) ? rss.item : [rss.item];
        rssLink = rss.link || "";
      } catch {
        // 部分资源站返回的 RSS 结构不完整，仅展示番剧结果
      }
      searchData.value = {
        bangumiItem: res.data.bangumiItem || [],
        rssItems,
        rssLink,
      };
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
};

// 从时间表跳转过来时通过地址栏参数带入番剧名，按时间表设置决定是否直接搜索
watch(
  () => route.query.q,
  (val) => {
    if (!val) return;
    input.value = val;
    const settings = JSON.parse(localStorage.getItem("timeTableSettings") || "{}");
    if (settings.clickAction === "searchAndGo") {
      searchAllInfoBtn();
    }
  },
  { immediate: true }
);

const getSubgroupInfoBtn = (e) => {
  subtitleGroupList.value = [];
  selectedBangumiTitle.value = e.title || "";
  showBangumi.value = true;
  subtitleGroupListLoading.value = true;
  bangumiId.value = e.bangumiId;
  getSubgroupInfo({ bangumiId: bangumiId.value })
    .then((res) => {
      subtitleGroupList.value = res.data || [];
    })
    .catch(() => {})
    .finally(() => {
      subtitleGroupListLoading.value = false;
    });
};

const getRssLinkBtn = (e) => {
  const data = {
    bangumiId: bangumiId.value,
    subgroupId: e.subgroupId.slice(1),
  };
  ElNotification({
    title: translate("订阅中"),
    message: translate("请稍等"),
    type: "info",
  });
  addRssLink(data)
    .then((res) => {
      if (res.code == 200) {
        ElNotification({
          title: translate("订阅成功"),
          message: translate("请前往订阅列表查看"),
          type: "success",
        });
      }
    })
    .catch(() => {});
};
</script>

<style scoped>
.search-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 clamp(8px, 4vw, 48px) 32px;
}

.search-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(24px, 7vh, 72px) 0 clamp(18px, 4vh, 32px);
  text-align: center;
}

.search-hero-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: clamp(20px, 3vw, 26px);
  letter-spacing: 0.02em;
}

.search-bar {
  width: 100%;
  max-width: 640px;
  margin-top: 16px;
}

.search-bar :deep(.el-input__wrapper) {
  padding-left: 14px;
  border-radius: 12px 0 0 12px;
}

.search-bar :deep(.el-input-group__append) {
  padding: 0 18px;
  border-color: var(--el-color-primary);
  border-radius: 0 12px 12px 0;
  background-color: var(--el-color-primary);
}

.search-bar :deep(.el-input-group__append .el-button) {
  color: #fff;
}

.search-empty {
  padding: 24px 0 40px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.skeleton-poster {
  width: 100%;
  aspect-ratio: 2 / 3;
  max-height: 200px;
  border-radius: 10px;
}

.subgroup-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 160px;
}

.subgroup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.subgroup-item:hover {
  border-color: var(--el-border-color);
  background-color: var(--el-fill-color-lighter);
}

.subgroup-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .search-page {
    padding: 0 4px 24px;
  }

  .search-hero {
    padding: 18px 0 14px;
  }

  .search-hero-title {
    font-size: 18px;
  }

  .search-bar {
    margin-top: 12px;
  }

  .search-bar :deep(.el-input-group__append) {
    padding: 0 14px;
  }

  .skeleton-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }
}
</style>
