<template>
  <div class="setting-item">
    <el-text>{{ translate("扫描目录") }}</el-text>
    <div class="scan-value">
      <el-text v-if="scanPaths.length" class="scan-summary">
        {{ scanPaths.length }} {{ translate("个目录") }}
      </el-text>
      <el-button type="default" @click="openPathsDialog">{{ translate("编辑") }}</el-button>
    </div>
  </div>

  <div class="setting-item">
    <el-text>{{ translate("扫描黑名单") }}</el-text>
    <div class="scan-value">
      <el-text v-if="scanBlacklist.length" class="scan-summary">
        {{ scanBlacklist.length }} {{ translate("条规则") }}
      </el-text>
      <el-button type="default" @click="openBlacklistDialog">{{ translate("编辑") }}</el-button>
    </div>
  </div>

  <div class="setting-item">
    <el-text>{{ translate("自动扫描") }}</el-text>
    <el-switch v-model="autoScanEnabled" @change="saveAutoScan" />
  </div>

  <div class="setting-item">
    <el-text>{{ translate("扫描周期") }}</el-text>
    <div class="scan-value">
      <el-input-number
        v-model="autoScanInterval"
        :min="1"
        :max="1440"
        :step="10"
        size="small"
        @change="saveAutoScan"
      />
      <el-text class="scan-summary">{{ translate("分钟") }}</el-text>
    </div>
  </div>

  <div class="setting-item">
    <el-text>{{ translate("立即扫描") }}</el-text>
    <div class="scan-value">
      <el-button :loading="scanning === 'fast'" @click="triggerScan('fast')">
        {{ translate("快速扫描") }}
      </el-button>
      <el-button type="primary" :loading="scanning === 'full'" @click="triggerScan('full')">
        {{ translate("完全扫描") }}
      </el-button>
    </div>
  </div>
  <div v-if="scanResult" class="scan-result">
    <el-alert
      :title="scanResult.mode === 'fast' ? translate('快速扫描完成') : translate('完全扫描完成')"
      type="success"
      :closable="true"
      @close="scanResult = null"
    >
      {{ translate("共扫描到") }} {{ scanResult.total_series }} {{ translate("部番剧") }} /
      {{ scanResult.total_files }} {{ translate("个文件") }}，
      {{ translate("黑名单跳过") }} {{ scanResult.skipped }} {{ translate("个") }}
    </el-alert>
  </div>

  <!-- 扫描目录弹窗 -->
  <el-dialog
    v-model="pathsDialogVisible"
    :title="translate('扫描目录')"
    width="600px"
    destroy-on-close
  >
    <div class="scan-list">
      <div v-for="(item, index) in tempPaths" :key="index" class="scan-list-row">
        <el-input
          v-model="tempPaths[index]"
          :placeholder="translate('请输入目录的绝对路径')"
        />
        <el-button link type="danger" @click="tempPaths.splice(index, 1)">
          {{ translate("删除") }}
        </el-button>
      </div>
      <el-button type="primary" plain @click="tempPaths.push('')">
        {{ translate("添加目录") }}
      </el-button>
    </div>
    <template #footer>
      <el-button @click="pathsDialogVisible = false">{{ translate("取消") }}</el-button>
      <el-button type="primary" :loading="savingPaths" @click="savePaths">
        {{ translate("保存") }}
      </el-button>
    </template>
  </el-dialog>

  <!-- 扫描黑名单弹窗 -->
  <el-dialog
    v-model="blacklistDialogVisible"
    :title="translate('扫描黑名单')"
    width="600px"
    destroy-on-close
  >
    <p class="scan-tip">
      {{ translate("支持路径或文件名正则，命中即跳过；例如输入 Sample 可跳过所有样片文件") }}
    </p>
    <div class="scan-list">
      <div v-for="(item, index) in tempBlacklist" :key="index" class="scan-list-row">
        <el-input
          v-model="tempBlacklist[index]"
          :placeholder="translate('请输入路径或文件名的正则')"
        />
        <el-button link type="danger" @click="tempBlacklist.splice(index, 1)">
          {{ translate("删除") }}
        </el-button>
      </div>
      <el-button type="primary" plain @click="tempBlacklist.push('')">
        {{ translate("添加规则") }}
      </el-button>
    </div>
    <template #footer>
      <el-button @click="blacklistDialogVisible = false">{{ translate("取消") }}</el-button>
      <el-button type="primary" :loading="savingBlacklist" @click="saveBlacklist">
        {{ translate("保存") }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { getScanConfig, saveScanConfig, scanLibrary } from "@/api/yzrServer";
import { translate } from "@/utils/translate";

const scanPaths = ref([]);
const scanBlacklist = ref([]);
const autoScanEnabled = ref(true);
const autoScanInterval = ref(30);

const pathsDialogVisible = ref(false);
const blacklistDialogVisible = ref(false);
const tempPaths = ref([]);
const tempBlacklist = ref([]);
const savingPaths = ref(false);
const savingBlacklist = ref(false);

// 当前正在进行的扫描模式（"fast" / "full"），空串表示空闲
const scanning = ref("");
const scanResult = ref(null);

const loadScanConfig = () => {
  getScanConfig()
    .then((res) => {
      if (res.code === 200 && res.data) {
        scanPaths.value = res.data.scan_paths || [];
        scanBlacklist.value = res.data.scan_blacklist || [];
        autoScanEnabled.value = res.data.auto_scan_enabled !== false;
        autoScanInterval.value = res.data.auto_scan_interval || 30;
      }
    })
    .catch(() => {});
};

const openPathsDialog = () => {
  tempPaths.value = [...scanPaths.value];
  if (!tempPaths.value.length) tempPaths.value.push("");
  pathsDialogVisible.value = true;
};

const openBlacklistDialog = () => {
  tempBlacklist.value = [...scanBlacklist.value];
  if (!tempBlacklist.value.length) tempBlacklist.value.push("");
  blacklistDialogVisible.value = true;
};

const cleanList = (list) =>
  list.map((item) => (item || "").trim()).filter((item) => item);

const savePaths = () => {
  savingPaths.value = true;
  saveScanConfig({
    scan_paths: cleanList(tempPaths.value),
    scan_blacklist: scanBlacklist.value,
  })
    .then((res) => {
      if (res.code === 200) {
        scanPaths.value = cleanList(tempPaths.value);
        pathsDialogVisible.value = false;
        ElMessage.success(translate("保存成功"));
      }
    })
    .catch(() => {})
    .finally(() => {
      savingPaths.value = false;
    });
};

const saveBlacklist = () => {
  savingBlacklist.value = true;
  saveScanConfig({
    scan_paths: scanPaths.value,
    scan_blacklist: cleanList(tempBlacklist.value),
  })
    .then((res) => {
      if (res.code === 200) {
        scanBlacklist.value = cleanList(tempBlacklist.value);
        blacklistDialogVisible.value = false;
        ElMessage.success(translate("保存成功"));
      }
    })
    .catch(() => {})
    .finally(() => {
      savingBlacklist.value = false;
    });
};

const saveAutoScan = () => {
  saveScanConfig({
    auto_scan_enabled: autoScanEnabled.value,
    auto_scan_interval: autoScanInterval.value,
  })
    .then((res) => {
      if (res.code === 200) {
        ElMessage.success(translate("保存成功"));
      }
    })
    .catch(() => {});
};

const triggerScan = (mode) => {
  scanning.value = mode;
  scanResult.value = null;
  scanLibrary(mode)
    .then((res) => {
      if (res.code === 200 && res.data) {
        scanResult.value = res.data;
        if (res.data.message) {
          ElMessage.warning(res.data.message);
        }
      }
    })
    .catch(() => {})
    .finally(() => {
      scanning.value = "";
    });
};

onMounted(() => {
  loadScanConfig();
});
</script>

<style scoped>
.scan-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scan-summary {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.scan-result {
  margin-top: 10px;
}

.scan-tip {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.scan-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scan-list-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
