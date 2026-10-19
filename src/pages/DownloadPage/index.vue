<template>
  <div class="download-page">
    <!-- 全局状态统计 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon is-downloading">
          <el-icon><VideoPlay /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.downloading }}</div>
          <div class="stat-label">{{ translate("下载中") }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon is-seeding">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.seeding }}</div>
          <div class="stat-label">{{ translate("做种中") }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon is-downloading">
          <el-icon><Download /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ formatSpeed(stats.dlspeed) }}</div>
          <div class="stat-label">{{ translate("下载速度") }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon is-uploading">
          <el-icon><Upload /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ formatSpeed(stats.upspeed) }}</div>
          <div class="stat-label">{{ translate("上传速度") }}</div>
        </div>
      </div>
    </div>

    <!-- 搜索与排序 -->
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        :placeholder="translate('搜索文件名或路径')"
        clearable
        class="toolbar-search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div class="toolbar-sort">
        <el-select
          v-model="sortingType"
          class="sort-type"
          @change="sortingList"
        >
          <el-option
            v-for="item in sortingTypeList"
            :key="item.type"
            :label="translate(item.name)"
            :value="item.type"
          />
        </el-select>
        <el-tooltip
          :content="sortingWay ? translate('升序') : translate('降序')"
          effect="dark"
          placement="top"
        >
          <el-button
            class="sort-way"
            :icon="sortingWay ? SortUp : SortDown"
            :disabled="sortingType === 'default'"
            @click="toggleSortWay"
          />
        </el-tooltip>
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="selectedTorrents.length > 0" class="batch-bar">
      <span class="batch-count">
        {{ selectedTorrents.length }} {{ translate("已选择") }}
      </span>
      <div class="batch-actions">
        <el-button size="small" @click="selectAll">
          {{ translate("全选") }}
        </el-button>
        <el-button size="small" @click="clearSelection">
          {{ translate("取消选择") }}
        </el-button>
        <el-button size="small" type="primary" plain @click="batchSetLocation">
          {{ translate("批量移动") }}
        </el-button>
        <el-button size="small" type="danger" plain @click="batchDelete">
          {{ translate("批量删除") }}
        </el-button>
      </div>
    </div>

    <!-- 表格模式 -->
    <div class="download-table" v-if="tOrC === 'table'">
      <el-table
        ref="tableRef"
        border
        :data="filteredTorrents"
        style="width: 100%"
        v-loading="torrents.length === 0 && loading"
        :empty-text="searchQuery ? translate('无搜索结果') : translate('暂无下载任务')"
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
        @row-contextmenu="openContextMenu"
      >
        <el-table-column type="selection" width="46" />
        <el-table-column
          prop="name"
          :label="translate('文件名')"
          min-width="320"
          show-overflow-tooltip
        >
          <template #default="scope">
            <el-text>{{ scope.row.name }}</el-text>
          </template>
        </el-table-column>
        <el-table-column :label="translate('状态')" width="100">
          <template #default="scope">
            <el-tag :type="stateColor(scope.row.state)" size="small" effect="light">
              {{ translate(stateText(scope.row.state)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" :label="translate('下载进度')" width="170">
          <template #default="scope">
            <el-progress
              :percentage="parseFloat((scope.row.progress * 100).toFixed(1))"
              :status="scope.row.progress !== 1 ? '' : 'success'"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column :label="translate('大小')" width="90">
          <template #default="scope">
            {{ fileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="downloaded" :label="translate('已下载')" width="90">
          <template #default="scope">
            {{ fileSize(scope.row.downloaded) }}
          </template>
        </el-table-column>
        <el-table-column prop="dlspeed" :label="translate('速度')" width="95">
          <template #default="scope">
            {{ formatSpeed(scope.row.dlspeed) }}
          </template>
        </el-table-column>
        <el-table-column prop="upspeed" :label="translate('上传')" width="95">
          <template #default="scope">
            {{ formatSpeed(scope.row.upspeed) }}
          </template>
        </el-table-column>
        <el-table-column prop="eta" :label="translate('剩余')" width="100">
          <template #default="scope">
            {{ formatTime(scope.row.eta) }}
          </template>
        </el-table-column>
        <el-table-column prop="num_complete" :label="translate('做种数')" width="90" />
        <el-table-column prop="added_on" :label="translate('添加时间')" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.added_on) }}
          </template>
        </el-table-column>
        <el-table-column prop="completion_on" :label="translate('完成时间')" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.completion_on) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="save_path"
          :label="translate('保存路径')"
          min-width="220"
          show-overflow-tooltip
        />
      </el-table>
    </div>

    <!-- 卡片模式 -->
    <div v-else class="download-card">
      <div
        class="torrent-grid"
        v-loading="torrents.length === 0 && loading"
      >
        <div
          v-for="torrent in filteredTorrents"
          :key="torrent.id"
          class="torrent-card"
          :class="{ 'is-selected': isTorrentSelected(torrent) }"
        >
          <div class="torrent-head">
            <el-checkbox
              v-model="torrent.isSelected"
              class="torrent-check"
              @change="handleCardSelection(torrent)"
            />
            <span class="torrent-name" :title="torrent.name">
              {{ torrent.name }}
            </span>
            <el-tag :type="stateColor(torrent.state)" size="small" effect="light">
              {{ translate(stateText(torrent.state)) }}
            </el-tag>
            <el-dropdown
              trigger="click"
              @command="(index) => runMenuCommand(index, torrent)"
            >
              <el-button
                text
                circle
                size="small"
                :icon="MoreFilled"
                @click.stop
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="(item, index) in visibleMenuActions(torrent)"
                    :key="item.label"
                    :command="index"
                  >
                    <span class="dropdown-action" :class="`is-${item.type}`">
                      <el-icon><component :is="item.icon" /></el-icon>
                      {{ translate(item.label) }}
                    </span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <el-progress
            class="torrent-progress"
            :percentage="parseFloat((torrent.progress * 100).toFixed(1))"
            :status="torrent.progress !== 1 ? '' : 'success'"
            :stroke-width="6"
          />

          <div class="torrent-meta">
            <span class="meta-item">
              <em>{{ translate("大小") }}</em>{{ fileSize(torrent.size) }}
            </span>
            <span class="meta-item">
              <em>{{ translate("已下载") }}</em>{{ fileSize(torrent.downloaded) }}
            </span>
            <span class="meta-item">
              <em>{{ translate("速度") }}</em>{{ formatSpeed(torrent.dlspeed) }}
            </span>
            <span class="meta-item">
              <em>{{ translate("上传") }}</em>{{ formatSpeed(torrent.upspeed) }}
            </span>
            <span class="meta-item">
              <em>{{ translate("剩余") }}</em>{{ formatTime(torrent.eta) }}
            </span>
            <span class="meta-item">
              <em>{{ translate("做种数") }}</em>{{ torrent.num_complete }}
            </span>
          </div>

          <div class="torrent-path" :title="torrent.save_path">
            <el-icon><FolderOpened /></el-icon>
            <span>{{ torrent.save_path }}</span>
          </div>
        </div>
      </div>
      <el-empty
        v-if="!loading && filteredTorrents.length === 0"
        :image-size="90"
        :description="searchQuery ? translate('无搜索结果') : translate('暂无下载任务')"
      />
    </div>

    <!-- 行/卡片右键菜单 -->
    <div
      v-if="contextMenu.visible"
      ref="contextMenuRef"
      class="torrent-context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @contextmenu.prevent
    >
      <el-menu class="right-click-menu">
        <el-menu-item
          v-for="(item, index) in visibleMenuActions(contextMenu.row)"
          :key="item.label"
          :index="String(index)"
        >
          <template #title>
            <el-button
              :type="item.type"
              link
              :icon="item.icon"
              @click="runMenuAction(item, contextMenu.row)"
            >
              {{ translate(item.label) }}
            </el-button>
          </template>
        </el-menu-item>
      </el-menu>
    </div>
  </div>
</template>

<script setup>
import { getDownloadList, deleteTorrents, setLocation, torrentsAction } from "@/api/yzrServer";
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from "vue";
import {
  Delete,
  Edit,
  Search,
  VideoPlay,
  VideoPause,
  TopRight,
  BottomRight,
  CircleCheck,
  Promotion,
  Download,
  Upload,
  MoreFilled,
  FolderOpened,
  SortUp,
  SortDown,
} from "@element-plus/icons-vue";
import {
  fileSize,
  formatDate,
  formatTime,
  formatSpeed,
  stateText,
  mergeObjects,
  stateColor,
} from "@/utils/utils.js";
import { translate } from "@/utils/translate";

const torrents = ref([]);
const tableRef = ref(null);
const selectedTorrents = ref([]);
const searchQuery = ref("");
const filteredTorrents = computed(() => {
  if (!searchQuery.value) {
    return torrents.value;
  }
  const query = searchQuery.value.toLowerCase();
  return torrents.value.filter(
    (torrent) =>
      torrent.name.toLowerCase().includes(query) ||
      torrent.save_path.toLowerCase().includes(query)
  );
});
const timer = ref(null);
const rid = ref(0);
const fetching = ref(false);
const loading = ref(false);

// 顶部统计：按进度区分下载中/做种中，暂停的任务不计入
const stats = computed(() => {
  let downloading = 0;
  let seeding = 0;
  let dlspeed = 0;
  let upspeed = 0;
  torrents.value.forEach((torrent) => {
    if (!isStoppedState(torrent.state)) {
      if (torrent.progress >= 1) seeding += 1;
      else downloading += 1;
    }
    dlspeed += torrent.dlspeed || 0;
    upspeed += torrent.upspeed || 0;
  });
  return { downloading, seeding, dlspeed, upspeed };
});

// 行右键菜单：记录目标行与鼠标位置
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  row: null,
});
const contextMenuRef = ref(null);

// 在表格行或卡片上右击时打开该行的菜单
const openContextMenu = async (row, column, event) => {
  event.preventDefault(); // 屏蔽浏览器默认右键菜单
  contextMenu.row = row;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.visible = true;
  await nextTick();
  // 靠近窗口边缘时向内收，避免菜单超出可视区域
  const menu = contextMenuRef.value;
  if (!menu) return;
  contextMenu.x = Math.max(
    8,
    Math.min(contextMenu.x, window.innerWidth - menu.offsetWidth - 8)
  );
  contextMenu.y = Math.max(
    8,
    Math.min(contextMenu.y, window.innerHeight - menu.offsetHeight - 8)
  );
};

const closeContextMenu = () => {
  contextMenu.visible = false;
};

// 在表格行以外的位置右键时关闭菜单
const handleGlobalContextMenu = (event) => {
  if (event.target?.closest?.(".el-table__row")) return;
  closeContextMenu();
};

// 暂停/停止状态（qBittorrent 5.0 起 pausedDL/pausedUP 改名为 stoppedDL/stoppedUP）
const isStoppedState = (state) =>
  ["pausedDL", "pausedUP", "stoppedDL", "stoppedUP"].includes(state);
// 强制状态（forcedDL / forcedUP / forcedMetaDL）
const isForcedState = (state) =>
  typeof state === "string" && state.startsWith("forced");

// 菜单操作：delete/setLocation 走专用接口，其余动作经 /torrentsAction 透传给 qBittorrent
// visible 控制互斥项：暂停↔启动、强制启动↔取消强制，只显示当前该做的那个
const menuActions = [
  { action: "resume", label: "启动", icon: VideoPlay, type: "primary", visible: (row) => isStoppedState(row?.state) },
  { action: "pause", label: "暂停", icon: VideoPause, type: "warning", visible: (row) => !isStoppedState(row?.state) },
  { action: "forceStart", label: "强制启动", icon: TopRight, type: "success", value: "true", visible: (row) => !isForcedState(row?.state) },
  { action: "forceStart", label: "取消强制", icon: BottomRight, type: "info", value: "false", visible: (row) => isForcedState(row?.state) },
  { action: "recheck", label: "检查文件", icon: CircleCheck, type: "primary" },
  { action: "reannounce", label: "更新Tracker", icon: Promotion, type: "primary" },
  { action: "setLocation", label: "移动位置", icon: Edit, type: "primary" },
  { action: "delete", label: "删除种子", icon: Delete, type: "danger" },
];

// 按行状态过滤掉互斥项
const visibleMenuActions = (row) =>
  menuActions.filter((item) => !item.visible || item.visible(row));

// 卡片下拉菜单：command 为当前可见菜单的索引
const runMenuCommand = (index, row) => {
  const item = visibleMenuActions(row)[index];
  if (item) runMenuAction(item, row);
};

const runMenuAction = (item, row) => {
  closeContextMenu();
  if (!item || !row) return;
  if (item.action === "delete") return removeTorrent(row);
  if (item.action === "setLocation") return setLocationBtn(row);
  const data = { action: item.action, hashes: row.infohash_v1 };
  // 强制启动/取消强制是同一个接口（setForceStart），靠 value 区分
  if (item.value !== undefined) data.value = item.value;
  torrentsAction(data)
    .then((res) => {
      if (res.code === 200) {
        ElNotification({
          title: translate(item.label),
          message: translate("操作成功"),
          type: "success",
        });
        rid.value = 0;
      }
    })
    .catch(() => {});
};

const tOrC = ref("table");
const sortingType = ref("default");
const sortingTypeList = [
  { name: "默认", type: "default" },
  { name: "名称", type: "name" },
  { name: "路径", type: "save_path" },
  { name: "大小", type: "size" },
  { name: "时间", type: "added_on" },
  { name: "进度", type: "progress" },
];
const sortingWay = ref(false);
var resData = {};

const handleSelectionChange = (selection) => {
  selectedTorrents.value = selection;
};

const handleCardSelection = (torrent) => {
  if (torrent.isSelected) {
    if (!selectedTorrents.value.find((t) => t.infohash_v1 === torrent.infohash_v1)) {
      selectedTorrents.value.push(torrent);
    }
  } else {
    selectedTorrents.value = selectedTorrents.value.filter(
      (t) => t.infohash_v1 !== torrent.infohash_v1
    );
  }
};

const isTorrentSelected = (torrent) => {
  return selectedTorrents.value.some((t) => t.infohash_v1 === torrent.infohash_v1);
};

const selectAll = () => {
  if (tOrC.value === "table" && tableRef.value) {
    tableRef.value.clearSelection();
    filteredTorrents.value.forEach((torrent) => {
      tableRef.value.toggleRowSelection(torrent, true);
    });
    return;
  }
  selectedTorrents.value = [];
  filteredTorrents.value.forEach((torrent) => {
    torrent.isSelected = true;
    selectedTorrents.value.push(torrent);
  });
};

const clearSelection = () => {
  if (tOrC.value === "table" && tableRef.value) {
    tableRef.value.clearSelection();
  }
  torrents.value.forEach((torrent) => {
    torrent.isSelected = false;
  });
  selectedTorrents.value = [];
};

const getRowClassName = ({ row }) => {
  if (isTorrentSelected(row)) {
    return "selected-row";
  }
  return "";
};

const batchDelete = () => {
  if (selectedTorrents.value.length === 0) return;

  ElMessageBox.confirm(
    `${translate("是否删除选中的")}${selectedTorrents.value.length}${translate("个种子和文件？")}`,
    translate("提示"),
    {
      confirmButtonText: translate("确定"),
      cancelButtonText: translate("取消"),
      type: "warning",
    }
  )
    .then(() => {
      const hashes = selectedTorrents.value.map((t) => t.infohash_v1).join("|");
      deleteTorrents({ hashes, deleteFiles: true })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: translate("成功"),
              message: translate("批量删除成功"),
              type: "success",
            });
            clearSelection();
            rid.value = 0;
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
};

const batchSetLocation = () => {
  if (selectedTorrents.value.length === 0) return;

  const hashes = selectedTorrents.value.map((t) => t.infohash_v1).join("|");
  const defaultLocation = selectedTorrents.value[0].save_path;

  ElMessageBox.prompt(
    translate("批量移动位置"),
    {
      confirmButtonText: translate("确定"),
      cancelButtonText: translate("取消"),
      inputPattern: /\S/,
      inputErrorMessage: translate("地址路径不能为空"),
      inputValue: defaultLocation,
    }
  )
    .then(({ value }) => {
      ElNotification({
        title: translate("正在修改"),
        message: value,
        type: "info",
      });
      setLocation({ location: value, hashes })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: translate("成功"),
              message: translate("批量移动成功"),
              type: "success",
            });
            clearSelection();
            rid.value = 0;
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
};

const getDownloadListBtn = () => {
  // 上一次请求还没结束时跳过本次轮询，避免请求堆积
  if (fetching.value) return;
  fetching.value = true;
  loading.value = true;
  getDownloadList({ rid: rid.value })
    .then((res) => {
      if (rid.value === 0) {
        resData = res.data;
      } else {
        resData = mergeObjects(resData, res.data);
      }
      rid.value = resData.rid;
      const selectedHashes = selectedTorrents.value.map((t) => t.infohash_v1);
      torrents.value = [];
      let torrent = resData.torrents;
      Object.keys(torrent).forEach((key) => {
        const torrentItem = torrent[key];
        torrentItem.isSelected = selectedHashes.includes(torrentItem.infohash_v1);
        torrents.value.push(torrentItem);
      });
      sortingList(sortingType.value);
      nextTick(() => {
        if (tableRef.value && tOrC.value === "table") {
          const selectedItems = torrents.value.filter((t) =>
            selectedHashes.includes(t.infohash_v1)
          );
          selectedItems.forEach((item) => {
            tableRef.value.toggleRowSelection(item, true);
          });
        }
      });
    })
    .catch(() => {
      // 错误已由 request 统一提示
      clearInterval(timer.value);
      timer.value = null; // 清除定时器
    })
    .finally(() => {
      loading.value = false;
      fetching.value = false;
    });
};

const removeTorrent = async (id) => {
  ElMessageBox.confirm(
    translate("是否删除该种子和文件？"),
    translate("提示"),
    {
      confirmButtonText: translate("确定"),
      cancelButtonText: translate("取消"),
      type: "warning",
    }
  )
    .then(() => {
      deleteTorrents({ hashes: id.infohash_v1, deleteFiles: true })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: translate("成功"),
              message: translate("删除成功"),
              type: "success",
            });
            rid.value = 0;
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
};

const setLocationBtn = (row) => {
  ElMessageBox.prompt(translate("移动位置"), {
    confirmButtonText: translate("确定"),
    cancelButtonText: translate("取消"),
    inputPattern: /\S/,
    inputErrorMessage: translate("地址路径不能为空"),
    inputValue: row.save_path,
  })
    .then(({ value }) => {
      ElNotification({
        title: translate("正在修改"),
        message: value,
        type: "info",
      });
      setLocation({ location: value, hashes: row.infohash_v1 })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: translate("成功"),
              message: translate("修改成功"),
              type: "success",
            });
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
};

const sortingList = () => {
  if (sortingType.value === "default") return;
  if (sortingType.value === "save_path" || sortingType.value === "name") {
    torrents.value = torrents.value.sort((a, b) => {
      return sortingWay.value
        ? a[sortingType.value].localeCompare(b[sortingType.value])
        : b[sortingType.value].localeCompare(a[sortingType.value]);
    });
  } else {
    torrents.value = torrents.value.sort((a, b) => {
      return sortingWay.value
        ? a[sortingType.value] - b[sortingType.value]
        : b[sortingType.value] - a[sortingType.value];
    });
  }
};

const toggleSortWay = () => {
  sortingWay.value = !sortingWay.value;
  sortingList();
};

// 点击其他位置、滚动或改变窗口大小时关闭右键菜单
onMounted(() => {
  document.addEventListener("click", closeContextMenu);
  document.addEventListener("contextmenu", handleGlobalContextMenu);
  window.addEventListener("resize", closeContextMenu);
  window.addEventListener("scroll", closeContextMenu, true);
});

onUnmounted(() => {
  document.removeEventListener("click", closeContextMenu);
  document.removeEventListener("contextmenu", handleGlobalContextMenu);
  window.removeEventListener("resize", closeContextMenu);
  window.removeEventListener("scroll", closeContextMenu, true);
});

onMounted(() => {
  getDownloadListBtn();
  timer.value = setInterval(getDownloadListBtn, 3000);
  tOrC.value =
    localStorage.getItem("downPageType") ||
    (window.innerWidth <= 768 ? "card" : "table");
});

onUnmounted(() => {
  clearInterval(timer.value);
});
</script>

<style scoped>
.download-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 4px clamp(4px, 2.5vw, 28px) 28px;
}

/* 状态统计 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background-color: var(--el-bg-color);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  font-size: 17px;
}

.stat-icon.is-downloading {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.stat-icon.is-seeding {
  color: var(--el-color-success);
  background-color: var(--el-color-success-light-9);
}

.stat-icon.is-uploading {
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
}

.stat-info {
  min-width: 0;
}

.stat-value {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 17px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.toolbar-search {
  flex: 1;
  min-width: 0;
}

.toolbar-sort {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}

.sort-type {
  width: 120px;
}

.sort-way :deep(.el-icon) {
  font-size: 16px;
}

/* 批量操作 */
.batch-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding: 8px 12px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 10px;
  background-color: var(--el-color-primary-light-9);
}

.batch-count {
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 13px;
}

.batch-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: auto;
}

.batch-actions :deep(.el-button) {
  margin-left: 0;
}

/* 表格模式 */
.download-table:deep(.el-table td.el-table__cell div) {
  white-space: nowrap;
  font-size: 12px;
}

.download-table:deep(.el-table .el-table__cell) {
  padding: 6px;
}

.download-table:deep(.el-table th.el-table__cell) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.download-table:deep(.el-table__body tr.selected-row > td) {
  background-color: var(--el-color-primary-light-9) !important;
}

.download-table:deep(.el-table__body tr:hover.selected-row > td) {
  background-color: var(--el-color-primary-light-8) !important;
}

/* 卡片模式 */
.torrent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  min-height: 80px;
}

.torrent-card {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background-color: var(--el-bg-color);
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background-color 0.2s;
}

.torrent-card:hover {
  border-color: var(--el-border-color);
  box-shadow: var(--el-box-shadow-lighter);
}

.torrent-card.is-selected {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.torrent-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.torrent-check {
  flex-shrink: 0;
  margin-right: 0;
}

.torrent-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.torrent-progress {
  margin: 10px 0 8px;
}

.torrent-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px 10px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.meta-item em {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-style: normal;
}

.torrent-path {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.torrent-path span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.torrent-path .el-icon {
  flex-shrink: 0;
}

/* 卡片下拉菜单：沿用右键菜单的动作配色 */
.dropdown-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dropdown-action.is-primary {
  color: var(--el-color-primary);
}

.dropdown-action.is-warning {
  color: var(--el-color-warning);
}

.dropdown-action.is-success {
  color: var(--el-color-success);
}

.dropdown-action.is-info {
  color: var(--el-color-info);
}

.dropdown-action.is-danger {
  color: var(--el-color-danger);
}

/* 右键菜单 */
.torrent-context-menu {
  position: fixed;
  z-index: 3000;
  padding: 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background-color: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
}

.right-click-menu {
  border: 0;
}

.right-click-menu:deep(.el-menu-item) {
  /* 右侧留一点空，避免最长一项的文字贴住菜单边缘 */
  padding: 0 12px 0 0 !important;
  height: 30px;
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .torrent-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .download-page {
    padding: 2px 4px 20px;
  }

  .stat-card {
    padding: 9px 12px;
  }

  .stat-value {
    font-size: 15px;
  }

  .toolbar {
    flex-wrap: wrap;
  }

  .toolbar-search {
    flex: 1 1 100%;
  }

  .toolbar-sort {
    width: 100%;
  }

  .sort-type {
    flex: 1;
    width: auto;
  }

  .batch-bar {
    position: sticky;
    bottom: 0;
    z-index: 20;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-bottom: 8px;
    box-shadow: var(--el-box-shadow-light);
  }

  .batch-actions {
    margin-left: 0;
  }

  .batch-actions :deep(.el-button) {
    flex: 1;
  }

  .torrent-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .torrent-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
