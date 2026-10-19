<template>
  <div class="result" v-if="resultList.length > 0 || rssItems.length > 0">
    <section v-if="resultList.length > 0" class="result-section">
      <div class="section-head">
        <span class="section-title">{{ translate("番剧") }}</span>
        <span class="section-count">{{ resultList.length }}</span>
      </div>
      <div class="bangumi-grid">
        <BangumiCardRow
          v-for="video in resultList"
          :key="video.Id"
          :imgUrl="video.img"
          :title="video.title"
          @click="$emit('selectBangumi', video)"
        />
      </div>
    </section>

    <section v-if="rssItems.length > 0" class="result-section">
      <div class="section-head">
        <span class="section-title">{{ translate("搜索结果") }}</span>
        <span class="section-count">{{ rssItems.length }}</span>
        <div class="section-actions">
          <el-button
            v-if="qBittorrentEnabled"
            type="primary"
            plain
            size="small"
            @click="addSearchRss"
          >
            {{ translate("订阅") }}
          </el-button>
        </div>
      </div>
      <div class="rss-list">
        <div
          v-for="(item, index) in currentPageData"
          :key="item.guid?.['#text'] || item.link || index"
          class="rss-item"
        >
          <span class="rss-index">
            {{ (currentPage - 1) * pageSize + index + 1 }}
          </span>
          <span class="rss-title" :title="item.title">{{ item.title }}</span>
          <el-tooltip
            v-if="qBittorrentEnabled"
            :content="translate('直接下载')"
            effect="dark"
            placement="top"
            :show-after="400"
          >
            <el-button
              type="primary"
              :icon="Download"
              circle
              size="small"
              @click="handleCreateDownload(item)"
            />
          </el-tooltip>
        </div>
      </div>
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="rssItems.length"
        layout="prev, pager, next"
        background
        hide-on-single-page
        class="pagination"
      />
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Download } from '@element-plus/icons-vue'
import BangumiCardRow from '@/components/BangumiCardRow/index.vue'
import { createDownload } from '@/utils/utils.js'
import { translate } from '@/utils/translate'
import { addFeed } from '@/api/yzrServer.js'
import { ElNotification } from 'element-plus'
import { qBittorrentEnabled } from '@/utils/backendStatus'

const props = defineProps({
  data: { type: Object, default: () => ({ bangumiItem: [], rssItems: [], rssLink: '' }) },
})

defineEmits(['selectBangumi'])

const currentPage = ref(1)
const pageSize = 10

const resultList = computed(() => props.data.bangumiItem || [])
const rssItems = computed(() => props.data.rssItems || [])

const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = currentPage.value * pageSize
  return rssItems.value.slice(start, end)
})

// 新的搜索结果返回后回到第一页
watch(
  () => props.data,
  () => {
    currentPage.value = 1
  }
)

const handleCreateDownload = (row) => {
  createDownload(row.enclosure['@url'], row.description)
}

const addSearchRss = () => {
  const rssLink = props.data.rssLink || ''
  if (!rssLink) return
  ElNotification({ title: translate("正在订阅"), message: rssLink, type: "info" })
  addFeed({ url: rssLink, path: "" })
    .then((res) => {
      if (res.code === 200) {
        ElNotification({ title: translate("提示"), message: translate("添加成功"), type: "success" })
      }
    })
    .catch(() => {})
}
</script>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
}

.result-section {
  width: 100%;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.section-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 15px;
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

.section-actions {
  margin-left: auto;
}

.bangumi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.bangumi-grid :deep(.bangumi-item) {
  margin-top: 0;
}

.rss-list {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background-color: var(--el-bg-color);
}

.rss-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  transition: background-color 0.2s;
}

.rss-item + .rss-item {
  border-top: 1px solid var(--el-border-color-lighter);
}

.rss-item:hover {
  background-color: var(--el-fill-color-light);
}

.rss-index {
  flex-shrink: 0;
  width: 22px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.rss-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  justify-content: center;
  margin-top: 14px;
}

@media (max-width: 768px) {
  .result {
    gap: 18px;
  }

  .bangumi-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }

  .rss-item {
    padding: 10px;
  }

  .rss-title {
    display: -webkit-box;
    overflow: hidden;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .pagination {
    margin-top: 10px;
  }
}
</style>
