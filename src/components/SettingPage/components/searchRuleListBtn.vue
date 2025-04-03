<template>
  <el-button type="default" @click="handleClick">查看</el-button>
  <el-dialog
    v-model="dialogVisible"
    width="50%"
    title="搜索规则列表"
    @close="handleClose"
    class="rule-list-dialog"
  >
    <el-scrollbar height="50vh">
      <el-card v-if="startAddEditRule" class="rule-card">
        <el-form label-width="120px" class="rule-form" :model="ruleForm">
          <el-form-item label="规则名称">
            <el-input
              v-model="ruleForm.title"
              placeholder="请输入规则名称"
              prop="title"
            >
            </el-input>
          </el-form-item>
          <el-form-item label="规则ID">
            <el-input
              v-model="ruleForm.name"
              placeholder="请输入规则ID"
              prop="name"
            >
            </el-input>
          </el-form-item>
          <el-form-item label="基础URL">
            <el-input
              v-model="ruleForm.info.base_url"
              placeholder="请输入基础URL"
              prop="base_url"
            >
            </el-input>
          </el-form-item>
          <el-form-item label="RSS路径">
            <el-input
              v-model="ruleForm.info.rss_path"
              placeholder="请输入RSS路径"
              prop="rss_path"
            >
            </el-input>
          </el-form-item>
          <el-form-item label="番剧名称参数">
            <el-input
              v-model="ruleForm.info.query_params_bangumi_name"
              placeholder="请输入番剧名称参数"
              prop="query_params_bangumi_name"
            >
            </el-input>
          </el-form-item>
          <el-form-item label="提交规则">
            <el-button type="primary" @click="addRule">提交</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      <el-card
        v-for="(item, index) in ruleKeyList"
        :key="index"
        class="rule-card"
      >
        <el-form label-width="120px" class="rule-form">
          <el-form-item label="规则名称">
            <el-input
              v-model="item.title"
              placeholder="请输入规则名称"
              prop="title"
              disabled
            >
            </el-input>
          </el-form-item>
          <el-form-item label="规则ID">
            <el-input
              v-model="item.name"
              placeholder="请输入规则ID"
              prop="name"
              disabled
            >
            </el-input>
          </el-form-item>
          <el-form-item label="基础URL">
            <el-input
              v-model="ruleAllInfo[item.name].base_url"
              placeholder="请输入基础URL"
              prop="base_url"
              disabled
            >
            </el-input>
          </el-form-item>
          <el-form-item label="RSS路径">
            <el-input
              v-model="ruleAllInfo[item.name].rss_path"
              placeholder="请输入RSS路径"
              prop="rss_path"
              disabled
            >
            </el-input>
          </el-form-item>
          <el-form-item label="番剧名称参数">
            <el-input
              v-model="ruleAllInfo[item.name].query_params_bangumi_name"
              placeholder="请输入番剧名称参数"
              prop="query_params_bangumi_name"
              disabled
            >
            </el-input>
          </el-form-item>
        </el-form>
      </el-card>
    </el-scrollbar>

    <template #footer>
      <el-button type="primary" @click="startAddEditRule = true" v-if="!startAddEditRule">
        新增
      </el-button>
        <el-button type="danger" @click="startAddEditRule = false" v-else>
            取消
        </el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref } from "vue";
import { addEditRule, getRuleInfoList, getRuleList } from "@/api/download.js";
const dialogVisible = ref(false);
const startAddEditRule = ref(false);
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

const getRuleListFun = () => {
  getRuleInfoList({}).then((res) => {
    console.log(res, "搜索规则列表");
    ruleAllInfo.value = res.data;
  });
  getRuleList({}).then((res) => {
    ruleKeyList.value = res.data.rule_list;
  });
};

getRuleListFun();

const addRule = () => {
  addEditRule(ruleForm.value).then((res) => {
    console.log(res, "添加规则结果");
  });
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
  max-height: 80vh;
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
</style>
