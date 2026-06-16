<template>
  <div class="result" v-if="resultList.length > 0 || rssItems.length > 0">
    <el-row :gutter="24" class="bangumi-card-row">
      <el-col
        :xs="colNum"
        :sm="colNum"
        :md="colNum"
        :lg="colNum"
        v-for="video in resultList"
        :key="video.Id"
      >
        <BangumiCardRow
          :imgUrl="video.img"
          :title="video.title"
          @click="$emit('selectBangumi', video)"
        />
      </el-col>
    </el-row>

    <div class="table" v-if="rssItems.length > 0">
      <el-table :data="currentPageData">
        <el-table-column property="title" :label="translate('标题')" />
        <el-table-column :label="translate('操作')" width="85" align="center">
          <template #header>
            <el-button type="primary" @click="addSearchRss" style="white-space: nowrap">
              {{ translate("订阅") }}
            </el-button>
          </template>
          <template #default="scope">
            <el-button
              type="primary"
              :icon="Download"
              circle
              @click="handleCreateDownload(scope.row)"
            />
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="rssItems.length"
        class="pagination"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Download } from '@element-plus/icons-vue'
import BangumiCardRow from '@/components/BangumiCardRow/index.vue'
import { createDownload } from '@/utils/utils.js'
import { translate } from '@/utils/translate'
import { addFeed } from '@/api/yzrServer.js'
import { ElNotification } from 'element-plus'

const props = defineProps({
  data: { type: Object, default: () => ({ bangumiItem: [], rssItems: [], rssLink: '' }) },
})

defineEmits(['selectBangumi'])

const currentPage = ref(1)
const pageSize = ref(10)

const resultList = computed(() => props.data.bangumiItem || [])
const rssItems = computed(() => props.data.rssItems || [])

const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = currentPage.value * pageSize.value
  return rssItems.value.slice(start, end)
})

const colNum = computed(() => {
  const map = { 4: 6, 3: 8, 2: 12, 1: 24 }
  return map[resultList.value.length] || 6
})

const handleSizeChange = (newSize) => { pageSize.value = newSize }
const handleCurrentChange = (newPage) => { currentPage.value = newPage }

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
      } else {
        ElNotification({ title: translate("提示"), message: translate("添加失败"), type: "error" })
      }
    })
    .catch((err) => {
      ElNotification({ title: translate("添加失败"), message: err, type: "error" })
    })
}
</script>

<style scoped>
.result {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
}
.bangumi-card-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: start;
  margin: 0 -10px;
  max-width: 600px;
}
.table {
  width: 90%;
  margin-top: 20px;
}
.table:deep(.el-table td.el-table__cell div) {
  white-space: nowrap;
}
.pagination {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
@media (max-width: 768px) {
  .table {
    width: 100%;
    margin-top: 20px;
  }
}
</style>
