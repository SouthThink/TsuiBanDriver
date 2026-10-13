<template>
  <div>
    <!-- qBittorrent 设置：绑定状态由连接是否成功决定（未绑定即视为关），不提供手动开关 -->
    <div class="setting-item">
      <el-text>qBittorrent</el-text>
      <div class="qb-actions">
        <el-text v-if="qbInfo.version" class="info-text">
          {{translate("版本")}}: {{qbInfo.version}}
        </el-text>
        <el-button type="primary" @click="openQBDialog">
          {{qbInfo.version ? translate("编辑") : translate("设置")}}
        </el-button>
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

    <!-- 重启后端：在「关于」中连续点击后端版本号 10 次后显示 -->
    <div class="setting-item" v-if="restartUnlocked">
      <el-text>{{translate("重启后端")}}</el-text>
      <el-button type="warning" :loading="restarting" @click="handleRestart">
        {{translate("重启")}}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { translate } from '@/utils/translate';
import { getUrlConfig, saveUrlConfig, getBackendVersions, testBackendConnection, restartBackend } from '@/api/yzrServer';
import { loadBackendStatus } from '@/utils/backendStatus';
import { restartUnlocked } from '@/utils/backendRestart';
import { ElMessage, ElMessageBox } from 'element-plus';

const savingQB = ref(false);
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

// 加载 qBittorrent 版本信息
// 版本由后端实时探测：能连通才有版本，为空即视为未绑定（关）
const loadVersions = async () => {
  try {
    const res = await getBackendVersions();
    if (res.code === 200 && res.data) {
      qbInfo.value.version = res.data.qBittorrent || '';
      qbInfo.value.webApiVersion = res.data.qBittorrentWebApi || '';
    }
  } catch {
    // 错误已由 request 统一提示；探测失败视为未连通
    qbInfo.value.version = '';
    qbInfo.value.webApiVersion = '';
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

// 保存 qBittorrent 配置（绑定状态只在此时确定）
// - 内容全空：视为解绑，保存空配置并关闭绑定
// - 有内容：先测试连接，连不上则不保存
// - 连接成功：保存配置，并自动把 qBittorrent 置为开启
const saveQBConfig = async () => {
  const host = tempQBHost.value.trim();
  const port = String(tempQBPort.value || '').trim();
  const username = tempQBUsername.value.trim();
  const password = tempQBPassword.value;

  if (!host && !port && !username && !password) {
    // 内容全空：直接当作关闭
    savingQB.value = true;
    try {
      const res = await saveUrlConfig({
        qBittorrent_host: '',
        qBittorrent_port: '',
        qBittorrent_username: '',
        qBittorrent_password: '',
        qBittorrent_enabled: false,
      });
      if (res.code === 200) {
        qbInfo.value.host = '';
        qbInfo.value.port = '';
        qbInfo.value.username = '';
        qbInfo.value.password = '';
        qbDialogVisible.value = false;
        ElMessage.success(translate('保存成功'));
        await loadBackendStatus(true);
        await loadVersions();
      }
    } catch {
      // 错误已由 request 统一提示
    } finally {
      savingQB.value = false;
    }
    return;
  }

  if (!host || !port) {
    ElMessage.error(translate('请输入完整的连接信息'));
    return;
  }

  savingQB.value = true;
  try {
    // 先测试连接和账号密码（失败会由 request 统一提示并 reject，不保存）
    await testBackendConnection({
      type: 'qBittorrent',
      host,
      port,
      username,
      password
    });

    // 连接成功才保存配置，并自动绑定 qBittorrent
    const res = await saveUrlConfig({
      qBittorrent_host: host,
      qBittorrent_port: port,
      qBittorrent_username: username,
      qBittorrent_password: password,
      qBittorrent_enabled: true,
    });

    if (res.code === 200) {
      qbInfo.value.host = host;
      qbInfo.value.port = port;
      qbInfo.value.username = username;
      qbInfo.value.password = password;
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

// 重启后端：后端启动新进程并退出旧进程，用于让改动生效或恢复异常状态
const restarting = ref(false);

const handleRestart = async () => {
  try {
    await ElMessageBox.confirm(
      translate('重启后连接会短暂中断，需要重新加载页面，确定要重启后端吗？'),
      translate('重启后端'),
      {
        type: 'warning',
        confirmButtonText: translate('确定'),
        cancelButtonText: translate('取消'),
      }
    );
  } catch {
    return; // 用户取消
  }

  restarting.value = true;
  try {
    await restartBackend();
    ElMessage.success(translate('后端正在重启，稍后请刷新页面'));
  } catch {
    // 错误已由 request 统一提示
  } finally {
    restarting.value = false;
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
