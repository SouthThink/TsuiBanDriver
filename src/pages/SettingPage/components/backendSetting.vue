<template>
  <div>
    <!-- qBittorrent 设置 -->
    <div class="setting-item">
      <el-text>qBittorrent</el-text>
      <div class="qb-actions">
        <el-text v-if="qbInfo.version" class="info-text">
          {{translate("版本")}}: {{qbInfo.version}}
        </el-text>
        <el-button type="primary" @click="openQBDialog">
          {{qbInfo.version ? translate("编辑") : translate("设置")}}
        </el-button>
        <el-switch
          v-model="qbInfo.enabled"
          :loading="savingEnabled"
          @change="toggleQbit"
        />
      </div>
    </div>

    <!-- qBittorrent 编辑弹窗 -->
    <el-dialog
      v-model="qbDialogVisible"
      :title="'qBittorrent ' + translate('设置')"
      width="500px"
      destroy-on-close
    >
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <el-form label-width="80px">
          <el-form-item :label="translate('设备IP')">
            <el-input
              v-model="tempQBHost"
              :placeholder="translate('设备IP')"
            />
          </el-form-item>
          <el-form-item :label="translate('端口')">
            <el-input
              v-model="tempQBPort"
              :placeholder="translate('端口')"
              type="number"
            />
          </el-form-item>
          <el-form-item :label="translate('用户名')">
            <el-input
              v-model="tempQBUsername"
              :placeholder="translate('用户名')"
            />
          </el-form-item>
          <el-form-item :label="translate('密码')">
            <el-input
              v-model="tempQBPassword"
              :placeholder="translate('密码')"
              type="password"
              show-password
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="qbDialogVisible = false">{{translate("取消")}}</el-button>
        <el-button type="primary" @click="saveQBConfig" :loading="savingQB">{{translate("保存")}}</el-button>
      </template>
    </el-dialog>

    <!-- dandanPlay 开放 API 凭证 -->
    <div class="setting-item">
      <el-text>dandanPlay</el-text>
      <div class="qb-actions">
        <el-text v-if="ddpInfo.appId" class="info-text">{{translate("已配置")}}</el-text>
        <el-button type="primary" @click="openDdpDialog">
          {{ddpInfo.appId ? translate("编辑") : translate("设置")}}
        </el-button>
      </div>
    </div>
    <el-dialog
      v-model="ddpDialogVisible"
      :title="'dandanPlay ' + translate('设置')"
      width="500px"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="AppId">
          <el-input v-model="tempAppId" placeholder="AppId" />
        </el-form-item>
        <el-form-item label="AppSecret">
          <el-input
            v-model="tempAppSecret"
            :placeholder="ddpInfo.hasSecret ? translate('留空表示不修改') : 'AppSecret'"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ddpDialogVisible = false">{{translate("取消")}}</el-button>
        <el-button type="primary" @click="saveDdpConfig" :loading="savingDdp">{{translate("保存")}}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { translate } from '@/utils/translate';
import { getUrlConfig, saveUrlConfig, getBackendVersions, testBackendConnection } from '@/api/yzrServer';
import { loadBackendStatus } from '@/utils/backendStatus';
import { ElMessage } from 'element-plus';

const savingQB = ref(false);
const savingEnabled = ref(false);
const qbDialogVisible = ref(false);

const tempQBHost = ref('');
const tempQBPort = ref('');
const tempQBUsername = ref('');
const tempQBPassword = ref('');

// dandanPlay 开放 API 凭证（签名模式）
const savingDdp = ref(false);
const ddpDialogVisible = ref(false);
const ddpInfo = ref({ appId: '', hasSecret: false });
const tempAppId = ref('');
const tempAppSecret = ref('');

const qbInfo = ref({
  version: '',
  webApiVersion: '',
  host: '',
  port: '',
  username: '',
  password: '',
  enabled: false,
});

// 加载配置
const loadConfig = async () => {
  try {
    const res = await getUrlConfig();
    if (res.code === 200 && res.data) {
      qbInfo.value.host = res.data.qBittorrent_host || '';
      qbInfo.value.port = res.data.qBittorrent_port || '';
      qbInfo.value.username = res.data.qBittorrent_username || '';
      qbInfo.value.password = res.data.qBittorrent_password || '';
      qbInfo.value.enabled = !!res.data.qBittorrent_enabled;
      ddpInfo.value.appId = res.data.dandanPlay_app_id || '';
      ddpInfo.value.hasSecret = !!res.data.dandanPlay_has_secret;

      tempQBHost.value = qbInfo.value.host;
      tempQBPort.value = qbInfo.value.port;
      tempQBUsername.value = qbInfo.value.username;
      tempQBPassword.value = qbInfo.value.password;

      // 获取版本信息
      await loadVersions();
    }
  } catch {
    // 错误已由 request 统一提示
  }
};

// 加载版本信息
const loadVersions = async () => {
  try {
    const res = await getBackendVersions();
    if (res.code === 200 && res.data) {
      if (res.data.qBittorrent) {
        qbInfo.value.version = res.data.qBittorrent;
      }
      if (res.data.qBittorrentWebApi) {
        qbInfo.value.webApiVersion = res.data.qBittorrentWebApi;
      }
    }
  } catch {
    // 错误已由 request 统一提示
  }
};

// 打开 qBittorrent 弹窗
const openQBDialog = () => {
  tempQBHost.value = qbInfo.value.host;
  tempQBPort.value = qbInfo.value.port;
  tempQBUsername.value = qbInfo.value.username;
  tempQBPassword.value = qbInfo.value.password;
  qbDialogVisible.value = true;
};

// 保存 qBittorrent 配置
const saveQBConfig = async () => {
  if (!tempQBHost.value || !tempQBPort.value) {
    ElMessage.error(translate('请输入完整的连接信息'));
    return;
  }

  savingQB.value = true;
  try {
    // 先测试连接和账号密码（失败会由 request 统一提示并 reject）
    await testBackendConnection({
      type: 'qBittorrent',
      host: tempQBHost.value,
      port: tempQBPort.value,
      username: tempQBUsername.value,
      password: tempQBPassword.value
    });

    // 连接和账号密码验证成功后保存配置，并自动绑定 qBittorrent
    const res = await saveUrlConfig({
      qBittorrent_host: tempQBHost.value,
      qBittorrent_port: tempQBPort.value,
      qBittorrent_username: tempQBUsername.value,
      qBittorrent_password: tempQBPassword.value,
      qBittorrent_enabled: true,
    });

    if (res.code === 200) {
      // 保存成功，立即恢复按钮状态
      savingQB.value = false;

      qbInfo.value.host = tempQBHost.value;
      qbInfo.value.port = tempQBPort.value;
      qbInfo.value.username = tempQBUsername.value;
      qbInfo.value.password = tempQBPassword.value;
      qbInfo.value.enabled = true;
      qbDialogVisible.value = false;
      ElMessage.success(translate('保存成功'));

      await loadBackendStatus(true);
      // 重新加载版本信息
      await loadVersions();
    }
  } catch {
    // 错误已由 request 统一提示
  } finally {
    savingQB.value = false;
  }
};

// 绑定/解绑 qBittorrent：解绑后前端隐藏订阅、下载相关功能
const toggleQbit = async (val) => {
  savingEnabled.value = true;
  try {
    const res = await saveUrlConfig({
      qBittorrent_host: qbInfo.value.host,
      qBittorrent_port: qbInfo.value.port,
      qBittorrent_username: qbInfo.value.username,
      qBittorrent_password: qbInfo.value.password,
      qBittorrent_enabled: val,
    });

    if (res.code === 200) {
      ElMessage.success(translate('保存成功'));
      await loadBackendStatus(true);
    }
  } catch {
    // 失败时回滚开关状态，避免与后端不一致
    qbInfo.value.enabled = !val;
  } finally {
    savingEnabled.value = false;
  }
};

// 打开 dandanPlay 凭证弹窗
const openDdpDialog = () => {
  tempAppId.value = ddpInfo.value.appId;
  tempAppSecret.value = '';
  ddpDialogVisible.value = true;
};

// 保存 dandanPlay 凭证：密钥留空表示不修改
const saveDdpConfig = async () => {
  const appId = tempAppId.value.trim();
  if (!appId) {
    ElMessage.error(translate('请输入 AppId'));
    return;
  }
  savingDdp.value = true;
  try {
    const payload = { dandanPlay_app_id: appId };
    const secret = tempAppSecret.value.trim();
    if (secret) payload.dandanPlay_app_secret = secret;

    const res = await saveUrlConfig(payload);
    if (res.code === 200) {
      ddpInfo.value.appId = appId;
      if (secret) ddpInfo.value.hasSecret = true;
      ddpDialogVisible.value = false;
      ElMessage.success(translate('保存成功'));
    }
  } catch {
    // 错误已由 request 统一提示
  } finally {
    savingDdp.value = false;
  }
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.qb-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-text {
  color: var(--el-text-color-secondary);
}

.qb-tip {
  margin: 0;
  padding: 6px 2px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
</style>
