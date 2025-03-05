<template>
  <div class="download-msg-box">
    <el-dialog
      v-model="downloadVisibled"
      width="80%"
      title="下载"
      @close="close"
      draggable
    >
      <el-container>
        <el-aside width="15%">
          <el-menu
            default-active="0"
            @select="handleMenuSelect"
            v-if="ruleNameList.length > 0"
          >
            <el-menu-item
              v-for="(item, index) in ruleNameList"
              :key="index"
              :index="item"
            >
              <template #title>
                <el-icon v-if="ruleInfo[item].enabled"><CircleCheck /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                <span>{{ item }}</span>
              </template>
            </el-menu-item>
            <el-menu-item index="新建规则">
              <template #title>
                <el-icon><CirclePlus /></el-icon>
                <span>新建规则</span>
              </template>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main class="main">
          <el-scrollbar>
            <el-card class="set-rule-card">
              <template #header>
                <el-text>规则定义</el-text>
              </template>
              <el-form
                :model="ruleData"
                label-width="auto"
                label-position="left"
              >
                <el-form-item label="启用规则">
                  <el-switch v-model="ruleData.enabled" />
                </el-form-item>
                <el-form-item label="使用正则表达式">
                  <el-switch v-model="ruleData.useRegex" />
                </el-form-item>
                <el-form-item label="必须包含:">
                  <el-input v-model="ruleData.mustContain" />
                </el-form-item>
                <el-form-item label="不能包含:">
                  <el-input v-model="ruleData.mustNotContain" />
                </el-form-item>
                <el-form-item label="集数过滤:">
                  <el-input v-model="ruleData.episodeFilter" />
                </el-form-item>
                <el-form-item label="使用智能剧集过滤器">
                  <el-switch v-model="ruleData.smartFilter" />
                </el-form-item>
                <el-divider />
                <!-- <el-form-item label="保存到其他目录">
                  <el-switch v-model="ruleData.enabled" />
                </el-form-item> -->
                <el-form-item label="保存路径：">
                  <el-input v-model="ruleData.savePath" />
                </el-form-item>
              </el-form>
            </el-card>
            <el-card class="set-rule-card">
              <template #header>
                <el-text>对以下订阅源应用规则</el-text>
              </template>
              <el-table
                :data="SubscribeList"
                @select="select"
                @selection-change="handleSelectionChange"
                :show-header="false"
                ref="tableRef"
                empty-text="没有订阅源"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="url">
                  <template #default="scope">
                    <el-text line-clamp="1" truncated>{{
                      scope.row.title
                    }}</el-text>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            <el-card class="set-rule-card">
              <template #header>
                <el-text>操作</el-text>
              </template>
              <el-button type="primary" @click="saveRuleBtn">保存</el-button>
              <el-button type="danger" @click="removeRuleBtn">删除</el-button>
            </el-card>
          </el-scrollbar>
        </el-main>
        <el-aside v-if="selectRssList.length > 0" class="aside" width="40%">
          <el-card class="set-rule-card">
            <template #header>
              <el-text>匹配的种子</el-text>
            </template>
            <el-scrollbar height="100%">
              <el-table
                :data="matchingArticlesList"
                :show-header="false"
                v-loading="matchingArticlesListLoading"
                class="matchingArticlesList"
                empty-text="没有匹配的种子"
              >
                <el-table-column>
                  <template #default="scope">
                    <el-text line-clamp="1" truncated>{{ scope.row }}</el-text>
                  </template>
                </el-table-column>
              </el-table>
            </el-scrollbar>
          </el-card>
        </el-aside>
      </el-container>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, watch } from "vue";
import {
  getRssRules,
  setRule,
  getRssItems,
  matchingArticles,
  removeRule,
} from "@/api/download";
import {
  CirclePlus,
  Edit,
  CircleCheck,
  CircleClose,
} from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";

const ruleNameList = ref([]);
const ruleInfo = ref({});
const ruleData = ref({
  enabled: false, // 是否启用
  mustContain: "", // 必须包含
  mustNotContain: "", // 不能包含
  useRegex: false, // 使用正则
  episodeFilter: "", // 集数过滤
  smartFilter: false, // 智能过滤
  previouslyMatchedEpisodes: [], // 之前匹配的集数
  affectedFeeds: [], // 影响的订阅源
  ignoreDays: 0, // 忽略天数
  lastMatch: "", // 最后匹配
  addPaused: false, // 暂停模式下添加匹配的种子
  assignedCategory: "", // 指定类别
  savePath: "", // 保存路径
});
const tableRef = ref(null);
const SubscribeList = ref([]);
const selectRssList = ref([]);
const selectRuleName = ref("");
const matchingArticlesList = ref([]);
const matchingArticlesListLoading = ref(false);
const props = defineProps({
  downloadVisible: {
    type: Boolean,
    default: false,
  },
});
const downloadVisibled = ref(false);
const emit = defineEmits(["close"]);
const close = () => {
  emit("close", false);
};

watch(
  () => props.downloadVisible,
  (newVal) => {
    resetAll();
    downloadVisibled.value = newVal;
    getRules();
    getSubscribeList();
  }
);

//重置全部变量
const resetAll = () => {
  ruleNameList.value = [];
  ruleInfo.value = {};
  ruleData.value = {
    enabled: false, // 是否启用
    mustContain: "", // 必须包含
    mustNotContain: "", // 不能包含
    useRegex: false, // 使用正则
    episodeFilter: "", // 集数过滤
    smartFilter: false, // 智能过滤
    previouslyMatchedEpisodes: [], // 之前匹配的集数
    affectedFeeds: [], // 影响的订阅源
    ignoreDays: 0, // 忽略天数
    lastMatch: "", // 最后匹配
    addPaused: false, // 暂停模式下添加匹配的种子
    assignedCategory: "", // 指定类别
    savePath: "", // 保存路径
  };
  selectRssList.value = [];
  selectRuleName.value = "";
  matchingArticlesList.value = [];
  matchingArticlesListLoading.value = false;
  SubscribeList.value = [];
};

const getSubscribeList = () => {
  getRssItems({})
    .then((res) => {
      if (res.code === 200) {
        Object.keys(res.data).forEach((key) => {
          SubscribeList.value.push({ ...res.data[key], title: key });
        });
      } else {
        ElNotification({
          title: "订阅列表请求失败",
          message: "请检查网络连接",
          type: "warning",
        });
      }
    })
    .catch((err) => {
      ElNotification({
        title: "订阅列表请求错误",
        message: err,
        type: "error",
      });
    });
};

const handleSelectionChange = (val) => {
  if (val.length > 0) {
    selectRssList.value = val;
    ruleData.affectedFeeds = val.map((item) => item.url);
    console.log(ruleData.affectedFeeds);
    console.log(selectRuleName.value, "选中规则名称");
    console.log(selectRssList.value, "选中订阅列表");
    getMatchingArticles();
  }
};

const handleMenuSelect = (index) => {
  if (index !== "新建规则") {
    matchingArticlesList.value = [];
    selectRssList.value = [];
    selectRuleName.value = index;
    tableRef.value.clearSelection();
    // console.log(index);
    ruleData.value = ruleInfo.value[index];
    // console.log(ruleData.value);
    // console.log(ruleData.value.affectedFeeds);
    ruleData.value.affectedFeeds.forEach((item) => {
      //判断item字符串是否否存在于SubscribeList中的url字段中
      const index1 = SubscribeList.value.findIndex((obj) => obj.url === item);
      // console.log(index1);
      if (index1 !== -1) {
        tableRef.value.toggleRowSelection(SubscribeList.value[index1], true);
        // console.log(SubscribeList.value[index1]);
      }
    });
  } else {
    // 弹出输入框询问规则名称
    ElMessageBox.prompt("请输入规则名称", "新建规则", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /\S/,
      inputErrorMessage: "规则名称不能为空",
    }).then(({ value }) => {
      ElNotification({
        //正在新建
        title: "正在新建",
        message: "请稍后",
        type: "info",
      });
      setRule({
        ruleName: value,
        ruleDef: {
          enabled: false, // 是否启用
          mustContain: "", // 必须包含
          mustNotContain: "", // 不能包含
          useRegex: false, // 使用正则
          episodeFilter: "", // 集数过滤
          smartFilter: false, // 智能过滤
          previouslyMatchedEpisodes: [], // 之前匹配的集数
          affectedFeeds: [], // 影响的订阅源
          ignoreDays: 0, // 忽略天数
          lastMatch: "", // 最后匹配
          addPaused: false, // 暂停模式下添加匹配的种子
          assignedCategory: "", // 指定类别
          savePath: "", // 保存路径
        },
      })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: "新建成功",
              message: "请前往规则管理页面查看",
              type: "success",
            });
            resetAll();
            getRules();
          } else {
            ElNotification({
              title: "新建失败",
              message: res.code,
              type: "error",
            });
          }
        })
        .catch((err) => {
          ElNotification({
            title: "新建失败",
            message: err,
            type: "error",
          });
        });
    });
  }
};

const getRules = () => {
  getRssRules().then((res) => {
    ruleNameList.value = Object.keys(res.data);
    ruleInfo.value = res.data;
    // console.log(ruleNameList.value);
    // console.log(res.data);
  });
};

const getMatchingArticles = () => {
  matchingArticlesList.value = [];
  matchingArticlesListLoading.value = true;
  matchingArticles({ ruleName: selectRuleName.value })
    .then((res) => {
      console.log(res);
      selectRssList.value.forEach((item) => {
        matchingArticlesList.value.push(...res.data[item.title]);
      });
      matchingArticlesListLoading.value = false;
    })
    .catch((err) => {
      matchingArticlesListLoading.value = false;
      // ElNotification({
      //   title: "匹配文章请求错误",
      //   message: err,
      //   type: "error",
      // });
    });
};

const removeRuleBtn = () => {
  ElMessageBox.confirm("将永久删除该规则, 是否继续?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    ElNotification({
      title: "正在删除",
      message: "请稍后",
      type: "info",
    });
    removeRule({ ruleName: selectRuleName.value }).then((res) => {
      if (res.code === 200) {
        ElNotification({
          title: "删除成功",
          message: "请前往规则管理页面查看",
          type: "success",
        });
        resetAll();
        getRules();
      } else {
        ElNotification({
          title: "删除失败",
          message: res.code,
          type: "error",
        });
      }
    });
  });
};

const saveRuleBtn = () => {
  ElNotification({
    title: "正在保存",
    message: "请稍后",
    type: "info",
  });
  setRule({
    ruleName: selectRuleName.value,
    ruleDef: ruleData.value,
  })
    .then((res) => {
      if (res.code === 200) {
        ElNotification({
          title: "保存成功",
          message: "请前往规则管理页面查看",
          type: "success",
        });
        getRules();
      } else {
        ElNotification({
          title: "保存失败",
          message: res.code,
          type: "error",
        });
      }
    })
    .catch((err) => {
      ElNotification({
        title: "保存失败",
        message: err,
        type: "error",
      });
    });
};

const select = (key) => {
  console.log(key);
};
</script>
<style scoped>
.download-msg-box {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.main {
  padding-top: 0;
  height: 600px;
}

.aside {
  padding-top: 0;
  height: 600px;
}

.set-rule-card {
  margin-bottom: 10px;
}

.set-rule-card:deep(.el-card__header) {
  padding: 2px 10px;
}

.matchingArticlesList {
}
</style>
