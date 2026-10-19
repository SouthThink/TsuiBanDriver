<template>
  <el-dialog
    v-model="downloadVisibled"
    :width="isMobile ? '100%' : 'min(1100px, 94vw)'"
    :fullscreen="isMobile"
    :title="translate('RSS下载器')"
    class="rule-dialog"
    draggable
    @close="close"
  >
    <div class="rule-layout">
      <aside class="rule-sidebar">
        <div class="sidebar-head">{{ translate("规则列表") }}</div>
        <div class="rule-list">
          <button
            v-for="item in ruleNameList"
            :key="item"
            type="button"
            class="rule-item"
            :class="{ active: selectRuleName === item }"
            @click="selectRule(item)"
          >
            <el-icon
              class="rule-state"
              :class="{ enabled: ruleInfo[item]?.enabled }"
            >
              <CircleCheck v-if="ruleInfo[item]?.enabled" />
              <CircleClose v-else />
            </el-icon>
            <span class="rule-name" :title="item">{{ item }}</span>
            <span v-if="ruleInfo[item]?.enabled" class="rule-badge">
              {{ translate("已启用") }}
            </span>
          </button>
          <el-empty
            v-if="ruleNameList.length === 0"
            :image-size="56"
            :description="translate('暂无规则')"
          />
        </div>
        <el-button class="rule-add" :icon="Plus" @click="createRule">
          {{ translate("新建规则") }}
        </el-button>
      </aside>

      <main class="rule-main">
        <div v-if="!selectRuleName" class="rule-placeholder">
          <el-empty :image-size="90" :description="translate('请选择规则')" />
          <el-button type="primary" :icon="Plus" @click="createRule">
            {{ translate("新建规则") }}
          </el-button>
        </div>

        <template v-else>
          <div class="rule-main-head">
            <div class="head-info">
              <span class="rule-title" :title="selectRuleName">
                {{ selectRuleName }}
              </span>
              <el-tag
                :type="ruleData.enabled ? 'success' : 'info'"
                size="small"
                effect="light"
              >
                {{ ruleData.enabled ? translate("已启用") : translate("未启用") }}
              </el-tag>
            </div>
            <el-switch
              v-model="ruleData.enabled"
              :active-text="translate('启用规则')"
            />
          </div>

          <el-scrollbar class="rule-body">
            <section class="rule-section">
              <div class="section-head">
                <span class="section-title">{{ translate("匹配条件") }}</span>
              </div>
              <el-form :model="ruleData" label-position="top" class="rule-form">
                <div class="form-grid">
                  <el-form-item :label="translate('必须包含')">
                    <el-input
                      v-model="ruleData.mustContain"
                      clearable
                      :placeholder="translate('必须包含')"
                    />
                  </el-form-item>
                  <el-form-item :label="translate('不能包含')">
                    <el-input
                      v-model="ruleData.mustNotContain"
                      clearable
                      :placeholder="translate('不能包含')"
                    />
                  </el-form-item>
                  <el-form-item :label="translate('集数过滤')">
                    <el-input
                      v-model="ruleData.episodeFilter"
                      clearable
                      :placeholder="translate('集数过滤')"
                    />
                  </el-form-item>
                </div>
                <div class="switch-row">
                  <el-form-item :label="translate('使用正则表达式')">
                    <el-switch v-model="ruleData.useRegex" />
                  </el-form-item>
                  <el-form-item :label="translate('使用智能剧集过滤器')">
                    <el-switch v-model="ruleData.smartFilter" />
                  </el-form-item>
                </div>
              </el-form>
            </section>

            <section class="rule-section">
              <div class="section-head">
                <span class="section-title">{{ translate("下载设置") }}</span>
              </div>
              <el-form :model="ruleData" label-position="top" class="rule-form">
                <el-form-item :label="translate('保存路径')">
                  <el-input
                    v-model="ruleData.torrentParams.save_path"
                    clearable
                    :placeholder="translate('保存路径')"
                  />
                </el-form-item>
              </el-form>
            </section>

            <section class="rule-section">
              <div class="section-head">
                <span class="section-title">
                  {{ translate("对以下订阅源应用规则") }}
                </span>
                <span class="section-count">
                  {{ selectRssList.length }}/{{ SubscribeList.length }}
                </span>
              </div>
              <el-empty
                v-if="SubscribeList.length === 0"
                :image-size="56"
                :description="translate('没有订阅源')"
              />
              <el-checkbox-group
                v-else
                v-model="ruleData.affectedFeeds"
                class="source-list"
                @change="handleFeedsChange"
              >
                <el-checkbox
                  v-for="item in SubscribeList"
                  :key="item.url"
                  :value="item.url"
                  class="source-item"
                >
                  <span class="source-text">
                    <span class="source-name">{{ item.title }}</span>
                    <span class="source-url">{{ item.url }}</span>
                  </span>
                </el-checkbox>
              </el-checkbox-group>
            </section>

            <section
              v-if="selectRssList.length > 0"
              class="rule-section"
            >
              <div class="section-head">
                <span class="section-title">{{ translate("匹配的种子") }}</span>
                <span class="section-count">{{ matchingArticlesList.length }}</span>
              </div>
              <div class="matching-list" v-loading="matchingArticlesListLoading">
                <el-empty
                  v-if="!matchingArticlesListLoading && matchingArticlesList.length === 0"
                  :image-size="56"
                  :description="translate('没有匹配的种子')"
                />
                <div
                  v-for="(name, index) in matchingArticlesList"
                  :key="index"
                  class="matching-item"
                >
                  <el-icon><Document /></el-icon>
                  <span :title="name">{{ name }}</span>
                </div>
              </div>
            </section>
          </el-scrollbar>

          <div class="rule-footer">
            <el-button
              type="danger"
              plain
              :icon="Delete"
              @click="removeRuleBtn"
            >
              {{ translate("删除") }}
            </el-button>
            <div class="footer-right">
              <el-button @click="close">{{ translate("取消") }}</el-button>
              <el-button type="primary" @click="saveRuleBtn">
                {{ translate("保存") }}
              </el-button>
            </div>
          </div>
        </template>
      </main>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { Plus, Delete } from "@element-plus/icons-vue";
import {
  getRssRules,
  setRule,
  getRssItems,
  matchingArticles,
  removeRule,
} from "@/api/yzrServer";
import { translate } from "@/utils/translate";
import { ElMessageBox } from "element-plus";

const isMobile = useMediaQuery("(max-width: 768px)");

const ruleNameList = ref([]);
const ruleInfo = ref({});
const SubscribeList = ref([]);
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

// 规则的完整默认结构：后端返回的规则可能缺字段，读取时统一补全
const createEmptyRule = () => ({
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
  torrentParams: {
    save_path: "", // 保存路径
    use_auto_tmm: false, // 是否使用自动命名规则
  },
});

const normalizeRule = (def = {}) => ({
  ...createEmptyRule(),
  ...def,
  previouslyMatchedEpisodes: def.previouslyMatchedEpisodes || [],
  affectedFeeds: Array.isArray(def.affectedFeeds) ? def.affectedFeeds : [],
  torrentParams: {
    save_path: "",
    use_auto_tmm: false,
    ...(def.torrentParams || {}),
  },
});

const ruleData = ref(createEmptyRule());

const selectRssList = computed(() => {
  const feeds = Array.isArray(ruleData.value.affectedFeeds)
    ? ruleData.value.affectedFeeds
    : [];
  return SubscribeList.value.filter((item) => feeds.includes(item.url));
});

const close = () => {
  emit("close", false);
};

watch(
  () => props.downloadVisible,
  async (newVal) => {
    if (!newVal) {
      downloadVisibled.value = false;
      return;
    }
    resetAll();
    downloadVisibled.value = true;
    await Promise.all([getRules(), getSubscribeList()]);
    // 打开时默认选中第一条规则，避免右侧空白
    if (!selectRuleName.value && ruleNameList.value.length > 0) {
      selectRule(ruleNameList.value[0]);
    }
  }
);

// 重置全部变量
const resetAll = () => {
  ruleNameList.value = [];
  ruleInfo.value = {};
  ruleData.value = createEmptyRule();
  selectRuleName.value = "";
  matchingArticlesList.value = [];
  matchingArticlesListLoading.value = false;
  SubscribeList.value = [];
};

const getSubscribeList = () =>
  getRssItems({})
    .then((res) => {
      if (res.code === 200 && res.data && typeof res.data === "object") {
        SubscribeList.value = Object.keys(res.data).map((key) => ({
          ...res.data[key],
          title: key,
        }));
      }
    })
    .catch(() => {});

const selectRule = (name) => {
  matchingArticlesList.value = [];
  selectRuleName.value = name;
  ruleData.value = normalizeRule(ruleInfo.value[name]);
  if (ruleData.value.affectedFeeds.length > 0) getMatchingArticles();
};

const handleFeedsChange = () => {
  if (ruleData.value.affectedFeeds.length > 0) getMatchingArticles();
  else matchingArticlesList.value = [];
};

const createRule = () => {
  ElMessageBox.prompt(translate("请输入规则名称"), translate("新建规则"), {
    confirmButtonText: translate("确定"),
    cancelButtonText: translate("取消"),
    inputPattern: /\S/,
    inputErrorMessage: translate("规则名称不能为空"),
  })
    .then(({ value }) => {
      ElNotification({
        title: translate("正在新建"),
        message: translate("请稍等"),
        type: "info",
      });
      setRule({ ruleName: value, ruleDef: createEmptyRule() })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: translate("提示"),
              message: translate("新建成功"),
              type: "success",
            });
            getRules().then(() => {
              if (ruleNameList.value.includes(value)) selectRule(value);
            });
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
};

const getRules = () =>
  getRssRules()
    .then((res) => {
      if (res && res.data && typeof res.data === "object") {
        ruleNameList.value = Object.keys(res.data);
        ruleInfo.value = res.data;
      } else {
        ruleNameList.value = [];
        ruleInfo.value = {};
      }
    })
    .catch(() => {
      ruleNameList.value = [];
      ruleInfo.value = {};
    });

const getMatchingArticles = () => {
  if (!selectRuleName.value || selectRssList.value.length === 0) {
    matchingArticlesList.value = [];
    return;
  }
  matchingArticlesListLoading.value = true;
  matchingArticles({
    ruleName: selectRuleName.value,
  })
    .then((res) => {
      const data = res.data || {};
      const list = [];
      selectRssList.value.forEach((item) => {
        if (Array.isArray(data[item.title])) {
          list.push(...data[item.title]);
        }
      });
      matchingArticlesList.value = list;
    })
    .catch(() => {
      // 错误已由 request 统一提示
    })
    .finally(() => {
      matchingArticlesListLoading.value = false;
    });
};

const removeRuleBtn = () => {
  ElMessageBox.confirm(translate("将永久删除该规则, 是否继续?"), translate("提示"), {
    confirmButtonText: translate("确定"),
    cancelButtonText: translate("取消"),
    type: "warning",
  })
    .then(() => {
      ElNotification({
        title: translate("正在删除"),
        message: translate("请稍等"),
        type: "info",
      });
      removeRule({ ruleName: selectRuleName.value })
        .then((res) => {
          if (res.code === 200) {
            ElNotification({
              title: translate("提示"),
              message: translate("删除成功"),
              type: "success",
            });
            selectRuleName.value = "";
            ruleData.value = createEmptyRule();
            matchingArticlesList.value = [];
            getRules().then(() => {
              if (ruleNameList.value.length > 0) {
                selectRule(ruleNameList.value[0]);
              }
            });
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
};

const saveRuleBtn = () => {
  if (!selectRuleName.value) return;
  ElNotification({
    title: translate("正在保存"),
    message: translate("请稍等"),
    type: "info",
  });
  setRule({
    ruleName: selectRuleName.value,
    ruleDef: ruleData.value,
  })
    .then((res) => {
      if (res.code === 200) {
        ElNotification({
          title: translate("提示"),
          message: translate("保存成功"),
          type: "success",
        });
        getRules();
        getMatchingArticles();
      }
    })
    .catch(() => {});
};
</script>

<style scoped>
.rule-layout {
  display: flex;
  gap: 14px;
  height: min(68vh, 620px);
}

.rule-sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 8px;
  width: 220px;
  min-height: 0;
  padding-right: 12px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.sidebar-head {
  padding: 0 6px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.rule-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
}

.rule-list::-webkit-scrollbar {
  display: none;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.rule-item:hover {
  background-color: var(--el-fill-color-light);
}

.rule-item.active {
  border-color: var(--el-color-primary-light-7);
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.rule-state {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.rule-state.enabled {
  color: var(--el-color-success);
}

.rule-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-badge {
  flex-shrink: 0;
  color: var(--el-color-success);
  font-size: 11px;
}

.rule-add {
  flex-shrink: 0;
  width: 100%;
}

.rule-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.rule-placeholder {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.rule-main-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.head-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.rule-title {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-body {
  flex: 1;
  min-height: 0;
  margin-top: 8px;
}

.rule-section {
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background-color: var(--el-bg-color);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.section-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 13px;
}

.section-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.rule-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.rule-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.rule-form :deep(.el-form-item__label) {
  padding-bottom: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 12px;
}

.switch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0 32px;
}

.source-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.source-item {
  display: flex;
  align-items: center;
  height: auto;
  margin-right: 0 !important;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.source-item:hover {
  border-color: var(--el-border-color);
}

.source-item.is-checked {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.source-item :deep(.el-checkbox__label) {
  flex: 1;
  min-width: 0;
}

.source-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.source-name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-weight: 500;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-url {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matching-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
}

.matching-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.matching-item:hover {
  background-color: var(--el-fill-color-light);
}

.matching-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matching-item .el-icon {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.rule-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 2px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.footer-right {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .rule-layout {
    flex-direction: column;
    gap: 8px;
    height: calc(100vh - 108px);
    height: calc(100dvh - 108px);
  }

  .rule-sidebar {
    flex-direction: row;
    align-items: center;
    width: 100%;
    padding: 0 0 8px;
    border-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .sidebar-head {
    display: none;
  }

  .rule-list {
    flex: 1;
    flex-direction: row;
    gap: 6px;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
  }

  .rule-item {
    width: auto;
    min-width: max-content;
    padding: 6px 10px;
  }

  .rule-badge {
    display: none;
  }

  .rule-item.active {
    min-width: max-content;
  }

  .rule-add {
    width: auto;
    margin-top: 0;
    align-self: center;
  }

  .rule-main-head {
    flex-wrap: wrap;
    gap: 8px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .switch-row {
    flex-direction: column;
    gap: 0;
  }

  .source-list {
    grid-template-columns: 1fr;
  }

  .matching-list {
    max-height: 160px;
  }

  .rule-footer {
    padding-bottom: 8px;
  }
}

@media (max-width: 400px) {
  .rule-footer :deep(.el-button) {
    padding: 8px 12px;
  }
}
</style>

<style>
/* 弹窗本体被 teleport 到 body，内部尺寸与内边距需用全局样式调整 */
.rule-dialog.el-dialog {
  border-radius: 12px;
}

.rule-dialog .el-dialog__header {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.rule-dialog .el-dialog__body {
  padding: 12px 16px 0;
}

.rule-dialog.is-fullscreen {
  border-radius: 0;
}

@media (max-width: 768px) {
  .rule-dialog .el-dialog__body {
    padding: 8px;
  }
}
</style>
