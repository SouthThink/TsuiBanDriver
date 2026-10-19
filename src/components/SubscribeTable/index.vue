<template>
  <div class="subscribe-table" v-loading="loading">
    <el-empty
      v-if="!loading && tableData.length === 0"
      :description="translate('暂无订阅')"
      :image-size="96"
    />

    <div v-else class="feed-list">
      <div
        v-for="row in tableData"
        :key="row.title"
        class="feed-item"
        :class="{ 'is-expanded': isExpanded(row), 'has-error': row.hasError }"
      >
        <div class="feed-head" @click="toggleExpand(row)">
          <el-tooltip
            :content="translate('全部已读')"
            effect="dark"
            placement="top"
            :show-after="400"
          >
            <el-button
              class="read-toggle"
              circle
              :type="
                row.hasError
                  ? 'danger'
                  : row.unReadNum > 0
                  ? 'primary'
                  : 'success'
              "
              :plain="row.unReadNum === 0 && !row.hasError"
              :loading="row.isLoading"
              @click.stop="$emit('markRead', '', row)"
            >
              <template v-if="!row.isLoading">
                <el-icon v-if="row.hasError"><Close /></el-icon>
                <span v-else-if="row.unReadNum !== 0" class="read-count">
                  {{ row.unReadNum > 99 ? '99+' : row.unReadNum }}
                </span>
                <el-icon v-else><Check /></el-icon>
              </template>
            </el-button>
          </el-tooltip>

          <div class="feed-info">
            <div v-if="editingTitle !== row.title" class="feed-text">
              <div class="feed-title" :title="row.title">{{ row.title }}</div>
              <div class="feed-meta">
                <span>{{ row.articles.length }} {{ translate('个条目') }}</span>
              </div>
            </div>
            <el-input
              v-else
              ref="renameInputRef"
              v-model="editName"
              size="small"
              class="feed-rename"
              @click.stop
              @keyup.enter="confirmRename(row)"
              @blur="cancelRename"
            />
          </div>

          <div v-if="showActions" class="feed-actions" @click.stop>
            <el-tooltip
              :content="translate('刷新')"
              effect="dark"
              placement="top"
              :show-after="400"
            >
              <el-button
                type="primary"
                plain
                circle
                size="small"
                :icon="RefreshRight"
                @click="$emit('refresh', row)"
              />
            </el-tooltip>
            <el-tooltip
              :content="translate('重命名')"
              effect="dark"
              placement="top"
              :show-after="400"
            >
              <el-button
                type="primary"
                plain
                circle
                size="small"
                :icon="Edit"
                @click="startRename(row)"
              />
            </el-tooltip>
            <el-tooltip
              :content="translate('删除')"
              effect="dark"
              placement="top"
              :show-after="400"
            >
              <el-button
                type="danger"
                plain
                circle
                size="small"
                :icon="Delete"
                @click="$emit('delete', row)"
              />
            </el-tooltip>
          </div>

          <el-dropdown
            v-if="showActions"
            class="feed-actions-more"
            trigger="click"
            @command="(command) => handleCommand(command, row)"
            @click.stop
          >
            <el-button circle size="small" :icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="refresh" :icon="RefreshRight">
                  {{ translate('刷新') }}
                </el-dropdown-item>
                <el-dropdown-item command="rename" :icon="Edit">
                  {{ translate('重命名') }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" :icon="Delete" divided>
                  {{ translate('删除') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-icon class="feed-chevron">
            <ArrowRight />
          </el-icon>
        </div>

        <el-collapse-transition>
          <div v-show="isExpanded(row)" class="article-list">
            <div v-if="row.articles.length === 0" class="article-empty">
              {{ translate('暂无数据') }}
            </div>
            <div
              v-for="article in row.articles"
              :key="article.title"
              class="article-item"
              :class="{ 'is-unread': !article.isRead }"
            >
              <span class="article-dot" />
              <span class="article-title" :title="article.title">
                {{ article.title }}
              </span>
              <el-tooltip
                :content="translate('直接下载')"
                effect="dark"
                placement="top"
                :show-after="400"
              >
                <el-button
                  class="article-download"
                  type="primary"
                  :icon="Download"
                  circle
                  size="small"
                  @click.stop="$emit('download', article, row)"
                />
              </el-tooltip>
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick } from 'vue'
import {
  RefreshRight,
  Edit,
  Delete,
  Download,
  MoreFilled,
} from '@element-plus/icons-vue'
import { deepEqual } from '@/utils/utils.js'
import { translate } from '@/utils/translate'

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  showActions: { type: Boolean, default: false },
})

const emit = defineEmits(['delete', 'refresh', 'rename', 'markRead', 'download'])

const editingTitle = ref('')
const editName = ref('')
const tableData = ref([])
const renameInputRef = ref(null)
// 记录展开的订阅源标题，刷新数据后仍保持展开状态
const expandedTitles = reactive(new Set())

const rawData = computed(() => props.data)

// 数据每 3 秒轮询一次：内容未变化时复用原对象，避免整表重建与闪烁
const processData = () => {
  const raw = rawData.value
  if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
    if (tableData.value.length > 0) tableData.value = []
    return
  }

  const prevMap = new Map(tableData.value.map((row) => [row.title, row]))
  const rows = Object.keys(raw)
    .sort()
    .map((item) => {
      const feed = raw[item] || {}
      const articles = Array.isArray(feed.articles) ? feed.articles : []
      return {
        ...feed,
        articles,
        title: item,
        unReadNum: articles.filter((article) => !article.isRead).length,
        // 保留刷新中的状态，避免轮询重建数据时按钮 loading 丢失
        isLoading: prevMap.get(item)?.isLoading ?? false,
      }
    })

  if (deepEqual(rows, tableData.value)) return

  tableData.value = rows.map((row) => {
    const prev = prevMap.get(row.title)
    if (!prev) return { ...row, isLoading: false }
    // isLoading 由父组件在刷新请求期间维护，合并时不覆盖
    const { isLoading, ...rest } = row
    Object.assign(prev, rest)
    return prev
  })

  // 清理已被删除订阅源的展开状态
  const titles = new Set(rows.map((row) => row.title))
  Array.from(expandedTitles).forEach((title) => {
    if (!titles.has(title)) expandedTitles.delete(title)
  })
}

watch(rawData, processData, { immediate: true })

const isExpanded = (row) => expandedTitles.has(row.title)

const toggleExpand = (row) => {
  if (expandedTitles.has(row.title)) {
    expandedTitles.delete(row.title)
  } else {
    expandedTitles.add(row.title)
  }
}

const startRename = async (row) => {
  editName.value = row.title
  editingTitle.value = row.title
  await nextTick()
  // v-for 内的 ref 会收集为数组
  const input = Array.isArray(renameInputRef.value)
    ? renameInputRef.value[0]
    : renameInputRef.value
  input?.focus()
  input?.select()
}

const confirmRename = (row) => {
  if (editName.value && editName.value !== editingTitle.value) {
    emit('rename', editingTitle.value, editName.value)
  }
  cancelRename()
}

const cancelRename = () => {
  editingTitle.value = ''
  editName.value = ''
}

const handleCommand = (command, row) => {
  if (command === 'refresh') emit('refresh', row)
  else if (command === 'rename') startRename(row)
  else if (command === 'delete') emit('delete', row)
}
</script>

<style scoped>
.subscribe-table {
  width: 100%;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feed-item {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background-color: var(--el-bg-color);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.feed-item:hover {
  border-color: var(--el-border-color);
  box-shadow: var(--el-box-shadow-lighter);
}

.feed-item.is-expanded {
  border-color: var(--el-color-primary-light-7);
}

.feed-item.has-error {
  border-color: var(--el-color-danger-light-7);
}

.feed-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
}

.read-toggle {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.read-count {
  font-size: 12px;
  line-height: 1;
}

.feed-info {
  flex: 1;
  min-width: 0;
}

.feed-title {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-meta {
  display: flex;
  gap: 10px;
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.feed-rename {
  max-width: 360px;
}

.feed-actions {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}

.feed-actions-more {
  display: none;
  flex-shrink: 0;
}

.feed-chevron {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  transition: transform 0.25s;
}

.feed-item.is-expanded .feed-chevron {
  transform: rotate(90deg);
}

.article-list {
  padding: 4px 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-lighter);
}

.article-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.article-item:hover {
  background-color: var(--el-fill-color-light);
}

.article-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--el-border-color);
}

.article-item.is-unread .article-dot {
  background-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
}

.article-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-item.is-unread .article-title {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.article-download {
  flex-shrink: 0;
}

.article-empty {
  padding: 16px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 768px) {
  .feed-list {
    gap: 8px;
  }

  .feed-head {
    gap: 10px;
    padding: 10px 12px;
  }

  .read-toggle {
    width: 32px;
    height: 32px;
  }

  .feed-title {
    font-size: 14px;
    line-height: 1.4;
    /* 移动端完整展示订阅名称，不再单行截断 */
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
    word-break: break-word;
  }

  .feed-actions {
    display: none;
  }

  .feed-actions-more {
    display: inline-flex;
  }

  .feed-rename {
    max-width: none;
  }

  .article-list {
    padding: 4px 6px;
  }

  .article-item {
    gap: 8px;
    padding: 7px 6px;
  }

  .article-title {
    display: -webkit-box;
    overflow: hidden;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

@media (hover: none) {
  .feed-item:hover {
    box-shadow: none;
  }
}
</style>
