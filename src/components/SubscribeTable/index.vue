<template>
  <el-table
    :data="tableData"
    class="subscribe-table"
    v-loading="loading"
    :empty-text="translate('暂无订阅')"
  >
    <el-table-column type="expand" width="20">
      <template #default="props">
        <el-table :data="props.row.articles" table-layout="auto">
          <el-table-column>
            <template #default="scope">
              <el-checkbox v-model="scope.row.isRead" disabled />
            </template>
          </el-table-column>
          <el-table-column prop="title">
            <template #default="scope">
              <el-text :type="scope.row.isRead ? '' : 'primary'">
                {{ scope.row.title }}
              </el-text>
            </template>
          </el-table-column>
          <el-table-column prop="link">
            <template #default="scope">
              <el-tooltip
                class="box-item"
                effect="dark"
                :content="translate('直接下载')"
                placement="top-start"
              >
                <el-button
                  type="primary"
                  :icon="Download"
                  circle
                  @click="$emit('download', scope.row, props.row)"
                />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-table-column>
    <el-table-column width="36">
      <template #default="scope">
        <el-tooltip
          class="box-item"
          effect="dark"
          :content="translate('全部已读')"
          placement="top-start"
        >
          <el-button
            circle
            :loading="scope.row.isLoading"
            :type="
              scope.row.isLoading
                ? ''
                : scope.row.hasError
                ? 'danger'
                : 'success'
            "
            size="small"
            @click="$emit('markRead', '', scope.row)"
          >
            <div v-if="!scope.row.isLoading">
              <el-icon v-if="scope.row.hasError"><Close /></el-icon>
              <el-text v-else-if="scope.row.unReadNum !== 0">
                {{ scope.row.unReadNum }}
              </el-text>
              <el-icon v-else><Check /></el-icon>
            </div>
          </el-button>
        </el-tooltip>
      </template>
    </el-table-column>
    <el-table-column prop="title" :label="translate('订阅列表')">
      <template #default="scope">
        <el-text v-if="editingTitle !== scope.row.title">{{
          scope.row.title
        }}</el-text>
        <el-input
          v-else
          v-model="editName"
          autofocus
          @keyup.enter="confirmRename(scope.row)"
          @blur="cancelRename"
        />
      </template>
    </el-table-column>
    <el-table-column v-if="showActions" class="subscribe-table-operation" width="150">
      <template #default="scope">
        <el-button-group class="subscribe-table-button-group">
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="translate('刷新')"
            placement="top-start"
          >
            <el-button
              type="primary"
              :icon="RefreshRight"
              @click="$emit('refresh', scope.row)"
            />
          </el-tooltip>
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="translate('重命名')"
            placement="top-start"
          >
            <el-button
              type="primary"
              :icon="Edit"
              @click="startRename(scope.row)"
            />
          </el-tooltip>
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="translate('删除')"
            placement="top-start"
          >
            <el-button
              type="danger"
              :icon="Delete"
              @click="$emit('delete', scope.row)"
            />
          </el-tooltip>
        </el-button-group>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { RefreshRight, Edit, Delete, Download } from '@element-plus/icons-vue'
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
const cachedRaw = ref(null)

const rawData = computed(() => props.data)

const processData = () => {
  const raw = rawData.value
  if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
    if (tableData.value.length > 0) tableData.value = []
    return
  }

  const keys = Object.keys(raw).sort().join(',')
  if (cachedRaw.value === keys) return
  cachedRaw.value = keys

  const rows = []
  Object.keys(raw).forEach((item) => {
    const feed = raw[item]
    let unReadNum = 0
    if (feed.articles) {
      unReadNum = feed.articles.length
      feed.articles.forEach((article) => {
        if (article.isRead !== undefined && article.isRead !== null && article.isRead) {
          unReadNum--
        }
      })
    }
    rows.push({ ...feed, title: item, unReadNum })
  })

  if (!deepEqual(rows, tableData.value)) {
    tableData.value = rows
  }
}

watch(rawData, processData, { immediate: true })

const startRename = (row) => {
  editName.value = row.title
  editingTitle.value = row.title
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
</script>

<style scoped>
.subscribe-table-button-group {
  display: flex;
  justify-content: flex-end;
}
</style>
