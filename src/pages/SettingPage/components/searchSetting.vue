<template>
  <div class="setting-item">
    <el-text>{{translate("搜索规则")}}</el-text>
    <el-select
      v-model="rule"
      :placeholder="translate('请选择规则')"
      style="max-width: 60%; width: 240px"
      @change="changeSearchRule"
      :no-data-text="translate('暂无规则')"
      :no-match-text="translate('暂无匹配规则')"
    >
      <el-option
        v-for="item in ruleKeyList"
        :key="item.name"
        :label="item.title"
        :value="item.name"
      />
    </el-select>
  </div>
  <div class="setting-item">
    <el-text>{{translate("搜索规则列表")}}</el-text>
    <el-button type="default" @click="handleClick">{{translate("查看")}}</el-button>
  </div>
  <div class="setting-item">
    <el-text>{{translate("搜索头")}}</el-text>
    <el-button type="default" @click="openSearchHeaderDialog">{{translate("编辑")}}</el-button>
  </div>
  <el-dialog
    v-model="searchHeaderDialog"
    :title="translate('搜索头')"
    width="70%"
    destroy-on-close
  >
    <el-input
      v-model="searchHeader"
      :placeholder="translate('请输入搜索头')"
      type="textarea"
      :rows="10"
    />
    <template #footer>
      <el-button @click="searchHeaderDialog = false">{{translate("取消")}}</el-button>
      <el-button type="primary" @click="saveSearchConfig({ closeDialog: true })">{{translate("保存")}}</el-button>
    </template>
  </el-dialog>
  <div class="setting-item">
    <el-text>{{translate("网络代理")}}</el-text>
    <el-switch v-model="proxyEnabled" @change="saveSearchConfig" />
  </div>
  <template v-if="proxyEnabled">
    <div class="setting-item">
      <el-text>{{translate("代理协议")}}</el-text>
      <el-select
        v-model="proxyProtocol"
        :placeholder="translate('请选择代理协议')"
        style="max-width: 60%; width: 240px"
        @change="saveSearchConfig"
      >
        <el-option label="HTTP" value="http" />
        <el-option label="SOCKS5" value="socks5" />
      </el-select>
    </div>
    <div class="setting-item">
      <el-text>{{translate("代理服务器")}}</el-text>
      <el-input
        v-model="proxyHost"
        :placeholder="translate('请输入代理服务器地址')"
        style="max-width: 60%; width: 240px"
        @change="saveSearchConfig"
      />
    </div>
    <div class="setting-item">
      <el-text>{{translate("代理端口")}}</el-text>
      <el-input
        v-model="proxyPort"
        :placeholder="translate('请输入代理端口')"
        style="max-width: 60%; width: 240px"
        type="number"
        @change="saveSearchConfig"
      />
    </div>
    <div class="setting-item">
      <el-text>{{translate("测试代理")}}</el-text>
      <el-button 
        type="default" 
        @click="testProxyConnection"
        :loading="proxyTesting"
      >
        {{translate("测试")}}
      </el-button>
    </div>
    <div v-if="proxyTestResult" class="proxy-test-result">
      <el-alert
        :title="proxyTestResult.success ? translate('测试成功') : translate('测试失败')"
        :type="proxyTestResult.success ? 'success' : 'error'"
        :closable="true"
        @close="proxyTestResult = null"
      >
        <template v-if="proxyTestResult.success">
          {{translate("延迟")}} : {{proxyTestResult.latency}}ms
        </template>
        <template v-else>
          {{proxyTestResult.error}}
        </template>
      </el-alert>
    </div>
  </template>
  <el-dialog
    v-model="dialogVisible"
    width="70%"
    :title="translate('搜索规则列表')"
    @close="handleClose"
    class="rule-list-dialog"
    :fullscreen="isMobile"
  >
    <el-scrollbar :height="isMobile ? '85vh' : '60vh'" ref="scrollbar">
      <div ref="scrollbarContent" class="rule-list">
        <el-card v-if="startAddEditRule" class="rule-card">
          <el-form label-width="120px" class="rule-form" :model="ruleForm">
            <el-form-item :label="translate('规则名称')">
              <el-input
                v-model="ruleForm.title"
                :placeholder="translate('请输入规则名称')"
                prop="title"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('规则ID')">
              <el-input
                v-model="ruleForm.name"
                :placeholder="translate('请输入规则ID')"
                prop="name"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('基础URL')">
              <el-input
                v-model="ruleForm.info.base_url"
                :placeholder="translate('请输入基础URL')"
                prop="base_url"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('RSS路径')">
              <el-input
                v-model="ruleForm.info.rss_path"
                :placeholder="translate('请输入RSS路径')"
                prop="rss_path"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('番剧名称参数')">
              <el-input
                v-model="ruleForm.info.query_params_bangumi_name"
                :placeholder="translate('请输入番剧名称参数')"
                prop="query_params_bangumi_name"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('RSS后缀')">
              <el-input
                v-model="ruleForm.rss_suffix"
                :placeholder="translate('请输入RSS后缀(可选)')"
                prop="rss_suffix"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('提交规则')">
              <el-button type="primary" @click="addRule(ruleForm)"
                >{{translate("提交")}}</el-button
              >
            </el-form-item>
          </el-form>
        </el-card>
        <el-card
          v-for="(item, index) in ruleKeyList"
          :key="index"
          class="rule-card"
        >
          <el-form label-width="120px" class="rule-form">
            <el-form-item :label="translate('规则名称')">
              <el-input
                v-model="item.title"
                :placeholder="translate('请输入规则名称')"
                prop="title"
                :disabled="!isEdit"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('规则ID')">
              <el-input
                v-model="item.name"
                :placeholder="translate('请输入规则ID')"
                prop="name"
                :disabled="!isEdit"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('基础URL')">
              <el-input
                v-model="ruleAllInfo[item.name].base_url"
                :placeholder="translate('请输入基础URL')"
                prop="base_url"
                :disabled="!isEdit"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('RSS路径')">
              <el-input
                v-model="ruleAllInfo[item.name].rss_path"
                :placeholder="translate('请输入RSS路径')"
                prop="rss_path"
                :disabled="!isEdit"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('番剧名称参数')">
              <el-input
                v-model="ruleAllInfo[item.name].query_params_bangumi_name"
                :placeholder="translate('请输入番剧名称参数')"
                prop="query_params_bangumi_name"
                :disabled="!isEdit"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('RSS后缀')">
              <el-input
                v-model="ruleAllInfo[item.name].rss_suffix"
                :placeholder="translate('请输入RSS后缀(可选)')"
                prop="rss_suffix"
                :disabled="!isEdit"
              >
              </el-input>
            </el-form-item>
            <el-form-item :label="translate('操作')" v-if="isEdit">
              <el-button type="primary" @click="editRule(item)">
                {{translate("提交")}}
              </el-button>
              <el-button type="danger" @click="deleteRuleBtnClick(item.name)"
                >{{translate("删除")}}</el-button
              >
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </el-scrollbar>
    <template #footer>
      <el-button type="primary" @click="editBtnClick">
        {{ isEdit ? translate("完成") : translate("编辑") }}
      </el-button>
      <el-button
        :type="startAddEditRule ? 'danger' : 'primary'"
        @click="addBtnClick"
      >
        {{ startAddEditRule ? translate("取消") : translate("新建") }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref, onMounted } from "vue";
import {
  addEditRule,
  getRuleInfoList,
  getRuleList,
  deleteRule,
  matchRule,
  getSearchConfig,
  saveSearchConfigApi,
  testProxy,
} from "@/api/yzrServer.js";
import { translate } from '@/utils/translate'
const rule = ref("");
const dialogVisible = ref(false);
const startAddEditRule = ref(false);
const isEdit = ref(false);
const ruleKeyList = ref([]);
const ruleAllInfo = ref({});
const ruleForm = ref({
  name: "",
  title: "",
  info: {
    base_url: "",
    rss_path: "",
    query_params_bangumi_name: "",
  },
});
const scrollbar = ref(null);
const scrollbarContent = ref(null);
const searchHeaderDialog = ref(false);

// 搜索配置相关
const searchHeader = ref("");
const proxyEnabled = ref(false);
const proxyProtocol = ref("http");
const proxyHost = ref("");
const proxyPort = ref("");
const proxyTesting = ref(false);
const proxyTestResult = ref(null);

const openSearchHeaderDialog = () => {
  searchHeaderDialog.value = true;
};

// 获取搜索配置
const loadSearchConfig = () => {
  getSearchConfig({}).then((res) => {
    if (res.code === 200 && res.data) {
      searchHeader.value = res.data.search_header || "";
      proxyEnabled.value = res.data.proxy_enabled || false;
      proxyProtocol.value = res.data.proxy_protocol || "http";
      proxyHost.value = res.data.proxy_host || "";
      proxyPort.value = res.data.proxy_port || "";
    }
  });
};

// 保存搜索配置
const saveSearchConfig = (optionsOrEvent = {}) => {
  const options = typeof optionsOrEvent === "object" ? optionsOrEvent : {};
  saveSearchConfigApi({
    search_header: searchHeader.value,
    proxy_enabled: proxyEnabled.value,
    proxy_protocol: proxyProtocol.value,
    proxy_host: proxyHost.value,
    proxy_port: proxyPort.value,
  }).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: translate("保存成功"),
        type: "success",
      });
      if (options.closeDialog) {
        searchHeaderDialog.value = false;
      }
    } else {
      ElMessage({
        message: res.msg || translate("保存失败"),
        type: "error",
      });
    }
  });
};

// 测试代理连接
const testProxyConnection = () => {
  if (!proxyHost.value || !proxyPort.value) {
    ElMessage({
      message: translate("请输入代理服务器和端口"),
      type: "warning",
    });
    return;
  }

  proxyTesting.value = true;
  proxyTestResult.value = null;

  testProxy({
    proxy_protocol: proxyProtocol.value,
    proxy_host: proxyHost.value,
    proxy_port: proxyPort.value,
  }).then((res) => {
    proxyTesting.value = false;
    
    if (res.code === 200 && res.data && res.data.success) {
      proxyTestResult.value = {
        success: true,
        latency: res.data.latency,
      };
      ElMessage({
        message: `${translate("测试成功")} - ${res.data.latency}ms`,
        type: "success",
      });
    } else if (res.data) {
      proxyTestResult.value = {
        success: false,
        error: res.data.error || translate("测试失败"),
      };
      ElMessage({
        message: proxyTestResult.value.error,
        type: "error",
      });
    } else {
      proxyTestResult.value = {
        success: false,
        error: res.msg || translate("测试失败"),
      };
      ElMessage({
        message: translate("测试失败"),
        type: "error",
      });
    }
  }).catch((error) => {
    proxyTesting.value = false;
    proxyTestResult.value = {
      success: false,
      error: `${translate("网络错误")}: ${error.message}`,
    };
    ElMessage({
      message: translate("网络错误"),
      type: "error",
    });
  });
};

onMounted(() => {
  loadSearchConfig();
});

//当屏幕宽度为768px以下时，dialog的宽度为100%
const isMobile = ref(false);
if (window.innerWidth <= 768) {
  isMobile.value = true;
}

const changeSearchRule = (e) => {
  console.log(e);
  matchRule({ rule_name: e }).then((res) => {
    // console.log(res, "修改规则结果");
    if (res.code === 200) {
      ElMessage({
        message: translate("修改成功"),
        type: "success",
      });
    } else {
      ElMessage({
        message: res.msg,
        type: "error",
      });
    }
  });
};

const getRuleListFun = () => {
  getRuleList({}).then((res) => {
    getRuleInfoList({}).then((res1) => {
      ruleAllInfo.value = res1.data;
      ruleKeyList.value = res.data.rule_list;
      rule.value = res.data.used_rule.name;
      // console.log(res, "搜索规则列表");
    });
  });
};

getRuleListFun();

const addRule = (data) => {
  if(data.name === "" || data.title === ""){
    ElNotification({
      message: translate("规则名称和规则ID不能为空"),
      type: "error",
      title: translate("提示"),
    });
    return;
  }
  if (data.info.base_url === "" || data.info.rss_path === "" || data.info.query_params_bangumi_name === "") {
    ElNotification({
      message: translate("基础URL、RSS路径和番剧名称参数不能为空"),
      type: "error",
      title: translate("提示"),
    });
    return;
  }
  startAddEditRule.value = false;
  addEditRule(data).then((res) => {
    // console.log(res, "添加规则结果");
    ElNotification({
      message: res.msg,
      type: res.code === 200 ? "success" : "error",
      title: translate("提示"),
    });
    getRuleListFun();
    scrollToBottom();
  });
};

const addBtnClick = () => {
  scrollToTop();
  startAddEditRule.value = !startAddEditRule.value;
  ruleForm.value = {
    name: "",
    title: "",
    info: {
      base_url: "",
      rss_path: "",
      query_params_bangumi_name: "",
      rss_suffix: "",
    },
  };
};

const editRule = (info) => {
  info.info = ruleAllInfo.value[info.name];
  isEdit.value = false;
  // console.log(info, "编辑规则");
  addRule(info);
};

const editBtnClick = () => {
  isEdit.value = !isEdit.value;
};

const deleteRuleBtnClick = (name) => {
  isEdit.value = false;
  deleteRule({ name }).then((res) => {
    // console.log(res, "删除规则结果");
    ElNotification({
      message: res.msg,
      type: res.code === 200 ? "success" : "error",
      title: "提示",
    });
    getRuleListFun();
  });
};

const scrollToBottom = () => {
  scrollbar.value.setScrollTop(scrollbarContent.value.scrollHeight);
};

const scrollToTop = () => {
  scrollbar.value.setScrollTop(0);
};

const handleClose = () => {
  dialogVisible.value = false;
  startAddEditRule.value = false;
};
const handleClick = () => {
  dialogVisible.value = true;
};
</script>
<style scoped>
.rule-list-dialog {
  height: 80vh;
}

.rule-card {
  margin-bottom: 10px;
  width: 100%;
}

.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
}

.proxy-test-result {
  margin-top: 10px;
  margin-left: 10px;
  margin-right: 10px;
}

@media (max-width: 768px) {
  .rule-list-dialog {
    height: 100%;
  }
}
</style>
