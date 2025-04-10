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
import { ref } from "vue";
import {
  addEditRule,
  getRuleInfoList,
  getRuleList,
  deleteRule,
  matchRule,
} from "@/api/download.js";
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

@media (max-width: 768px) {
  .rule-list-dialog {
    height: 100%;
  }
}
</style>
