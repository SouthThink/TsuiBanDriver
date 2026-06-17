<template>
  <div>
    <!-- qBittorrent 设置 -->
    <div class="setting-item">
      <el-text>qBittorrent</el-text>
      <el-text v-if="qbInfo.version" class="info-text">
        {{qbInfo.host}}:{{qbInfo.port}} | {{translate("版本")}}: {{qbInfo.version}}
      </el-text>
      <el-button type="primary" @click="openQBDialog">
        {{qbInfo.version ? translate("编辑") : translate("设置")}}
      </el-button>
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

    <!-- dandanPlay 设置 -->
    <div class="setting-item">
      <el-text>dandanPlay</el-text>
      <el-text v-if="ddpInfo.version" class="info-text">
        {{ddpInfo.host}}:{{ddpInfo.port}} | {{translate("版本")}}: {{ddpInfo.version}}
      </el-text>
      <el-button type="primary" @click="openDDPDialog">
        {{ddpInfo.version ? translate("编辑") : translate("设置")}}
      </el-button>
    </div>

    <!-- dandanPlay 编辑弹窗 -->
    <el-dialog
      v-model="ddpDialogVisible"
      :title="'dandanPlay ' + translate('设置')"
      width="500px"
      destroy-on-close
    >
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <el-form label-width="80px">
          <el-form-item :label="translate('设备IP')">
            <el-input
              v-model="tempDDPHost"
              :placeholder="translate('设备IP')"
            />
          </el-form-item>
          <el-form-item :label="translate('端口')">
            <el-input
              v-model="tempDDPPort"
              :placeholder="translate('端口')"
              type="number"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="ddpDialogVisible = false">{{translate("取消")}}</el-button>
        <el-button type="primary" @click="saveDDPConfig" :loading="savingDDP">{{translate("保存")}}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { translate } from '@/utils/translate';
import { getUrlConfig, saveUrlConfig, getBackendVersions, testBackendConnection } from '@/api/yzrServer';
import { ElMessage } from 'element-plus';

const savingQB = ref(false);
const savingDDP = ref(false);
const qbDialogVisible = ref(false);
const ddpDialogVisible = ref(false);

const tempQBHost = ref('');
const tempQBPort = ref('');
const tempQBUsername = ref('');
const tempQBPassword = ref('');
const tempDDPHost = ref('');
const tempDDPPort = ref('');

const qbInfo = ref({
  version: '',
  webApiVersion: '',
  host: '',
  port: '',
  username: '',
  password: '',
});

const ddpInfo = ref({
  version: '',
  host: '',
  port: '',
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
      ddpInfo.value.host = res.data.dandanPlay_host || '';
      ddpInfo.value.port = res.data.dandanPlay_port || '';
      
      tempQBHost.value = qbInfo.value.host;
      tempQBPort.value = qbInfo.value.port;
      tempQBUsername.value = qbInfo.value.username;
      tempQBPassword.value = qbInfo.value.password;
      tempDDPHost.value = ddpInfo.value.host;
      tempDDPPort.value = ddpInfo.value.port;
      
      // 获取版本信息
      await loadVersions();
    }
  } catch (error) {
    console.error('加载配置失败:', error);
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
      if (res.data.dandanPlay) {
        ddpInfo.value.version = res.data.dandanPlay;
      }
    }
  } catch (error) {
    console.error('加载版本信息失败:', error);
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

// 打开 dandanPlay 弹窗
const openDDPDialog = () => {
  tempDDPHost.value = ddpInfo.value.host;
  tempDDPPort.value = ddpInfo.value.port;
  ddpDialogVisible.value = true;
};

// 保存 qBittorrent 配置
const saveQBConfig = async () => {
  if (!tempQBHost.value || !tempQBPort.value) {
    ElMessage.error(translate('请输入完整的连接信息'));
    return;
  }
  
  savingQB.value = true;
  try {
    // 先测试连接和账号密码
    const testRes = await testBackendConnection({
      type: 'qBittorrent',
      host: tempQBHost.value,
      port: tempQBPort.value,
      username: tempQBUsername.value,
      password: tempQBPassword.value
    });
    
    if (testRes.code !== 200) {
      ElMessage.error(testRes.msg || translate('连接测试失败'));
      return;
    }
    
    // 连接和账号密码验证成功后保存配置
    const res = await saveUrlConfig({
      qBittorrent_host: tempQBHost.value,
      qBittorrent_port: tempQBPort.value,
      qBittorrent_username: tempQBUsername.value,
      qBittorrent_password: tempQBPassword.value,
      dandanPlay_host: ddpInfo.value.host,
      dandanPlay_port: ddpInfo.value.port,
    });
    
    if (res.code === 200) {
      // 保存成功，立即恢复按钮状态
      savingQB.value = false;
      
      qbInfo.value.host = tempQBHost.value;
      qbInfo.value.port = tempQBPort.value;
      qbInfo.value.username = tempQBUsername.value;
      qbInfo.value.password = tempQBPassword.value;
      qbDialogVisible.value = false;
      ElMessage.success(translate('保存成功'));
      
      // 重新加载版本信息
      await loadVersions();
    } else {
      ElMessage.error(translate('保存失败'));
    }
  } catch (error) {
    const errorMsg = error.response?.data?.msg || error.message || translate('操作失败');
    ElMessage.error(errorMsg);
    console.error('保存失败:', error);
  } finally {
    savingQB.value = false;
  }
};

// 保存 dandanPlay 配置
const saveDDPConfig = async () => {
  if (!tempDDPHost.value || !tempDDPPort.value) {
    ElMessage.error(translate('请输入完整的连接信息'));
    return;
  }
  
  savingDDP.value = true;
  try {
    // 先测试连接
    const testRes = await testBackendConnection({
      type: 'dandanPlay',
      host: tempDDPHost.value,
      port: tempDDPPort.value
    });
    
    if (testRes.code !== 200) {
      ElMessage.error(testRes.msg || translate('连接测试失败'));
      return;
    }
    
    // 连接成功后保存配置
    const res = await saveUrlConfig({
      qBittorrent_host: qbInfo.value.host,
      qBittorrent_port: qbInfo.value.port,
      qBittorrent_username: qbInfo.value.username,
      qBittorrent_password: qbInfo.value.password,
      dandanPlay_host: tempDDPHost.value,
      dandanPlay_port: tempDDPPort.value,
    });
    
    if (res.code === 200) {
      // 保存成功，立即恢复按钮状态
      savingDDP.value = false;
      
      ddpInfo.value.host = tempDDPHost.value;
      ddpInfo.value.port = tempDDPPort.value;
      ddpDialogVisible.value = false;
      ElMessage.success(translate('保存成功'));
      
      // 重新加载版本信息
      await loadVersions();
    } else {
      ElMessage.error(translate('保存失败'));
    }
  } catch (error) {
    const errorMsg = error.response?.data?.msg || error.message || translate('操作失败');
    ElMessage.error(errorMsg);
    console.error('保存失败:', error);
  } finally {
    savingDDP.value = false;
  }
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.info-text {
  margin-right: 15px;
  color: var(--el-text-color-secondary);
}
</style>
