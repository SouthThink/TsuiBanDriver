<template>
  <div class="anime-detail" v-loading="loading">
    <template v-if="detail">
      <div class="detail-header">
        <div class="detail-cover">
          <el-image :src="detail.Cover" fit="cover" class="detail-cover-img">
            <template #error>
              <div class="detail-cover-empty">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
        <div class="detail-info">
          <div class="detail-title">{{ detail.Title }}</div>
          <div class="detail-rating">
            <el-tag v-if="detail.TypeDescription" size="small" type="info">
              {{ detail.TypeDescription }}
            </el-tag>
            <span class="detail-score" v-if="detail.Rating">
              <el-icon><StarFilled /></el-icon>
              <el-text>{{ detail.Rating }}</el-text>
            </span>
          </div>
          <div class="detail-tags" v-if="detail.Tags.length > 0">
            <el-tag v-for="tag in detail.Tags" :key="tag" size="small" effect="plain">
              {{ tag }}
            </el-tag>
          </div>
          <div class="detail-section" v-if="detail.Summary">
            <div class="detail-section-title">{{ translate("简介") }}</div>
            <div class="detail-text">{{ detail.Summary }}</div>
          </div>
        </div>
      </div>

      <div class="detail-section" v-if="detail.Comment">
        <div class="detail-section-title">{{ translate("评论") }}</div>
        <div class="detail-text">{{ detail.Comment }}</div>
      </div>

      <!-- 仅在本地番剧库中命中该番剧（存在本地剧集）时展示 -->
      <div class="detail-section" v-if="detail.Episodes.length > 0">
        <div class="detail-section-title">{{ translate("本地剧集") }}</div>
        <BangumiCollapse
          :AnimeId="detail.AnimeId"
          :episodes="detail.Episodes"
          :openInNewTab="true"
          :showRematch="true"
          @refresh="fetchDetail"
        />
      </div>
    </template>
    <el-empty v-else-if="!loading" :description="translate('暂无数据')" />
  </div>
</template>
<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Picture, StarFilled } from "@element-plus/icons-vue";
import BangumiCollapse from "@/components/BangumiCollapse/index.vue";
import { bangumiDetail } from "@/api/yzrServer";
import { translate } from "@/utils/translate";
import { username } from "@/utils/user";

const route = useRoute();
const loading = ref(true);
const detail = ref(null);

async function fetchDetail() {
  const animeId = route.query.animeId || "";
  const bgmId = route.query.bgmId || "";
  if (!animeId && !bgmId) {
    detail.value = null;
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const res = await bangumiDetail({ animeId, bgmId, username: username.value });
    detail.value = (res && res.data) || null;
  } catch {
    // 错误已由 request 统一提示
    detail.value = null;
  } finally {
    loading.value = false;
  }
}

watch(() => [route.query.animeId, route.query.bgmId], fetchDetail, {
  immediate: true,
});
</script>
<style scoped>
.anime-detail {
  width: 100%;
  max-width: 1500px;
  margin: auto;
  min-height: 200px;
}

.detail-header {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.detail-cover {
  width: 200px;
  flex-shrink: 0;
}

.detail-cover-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  overflow: hidden;
}

.detail-cover-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
}

.detail-info {
  flex: 1;
  min-width: 240px;
}

.detail-title {
  font-size: 1.6em;
  font-weight: bold;
  line-height: 1.3;
}

.detail-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.detail-score {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border-radius: 4px;
  color: #ff9900;
  background-color: var(--el-fill-color-light);
}

.detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.detail-section {
  margin-top: 14px;
}

.detail-section-title {
  margin-bottom: 6px;
  font-size: 1.1em;
  font-weight: bold;
}

.detail-text {
  line-height: 1.7;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .detail-cover {
    width: 120px;
  }
}
</style>
