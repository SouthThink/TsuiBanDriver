<template>
  <div class="searchPage">
    <div class="searchBox">
      <el-input
        v-model="input"
        :placeholder="translate('番剧搜索')"
        class="input-with-select"
        :prefix-icon="Search"
        @keyup.enter="searchAllInfoBtn"
      />
    </div>
    <el-skeleton :loading="loading" animated :count="3">
      <template #default>
        <SearchResult
          :data="searchData"
          @select-bangumi="getSubgroupInfoBtn"
        />
      </template>
    </el-skeleton>
    <el-drawer
      v-model="showBangumi"
      :title="translate('字幕组')"
      direction="rtl"
      :size="setSize"
    >
      <el-table
        :data="subtitleGroupList"
        v-loading="subtitleGroupListLoading"
        table-layout="auto"
        :empty-text="translate('未找到字幕组')"
      >
        <el-table-column property="subgroupname" :label="translate('名称')" />
        <!-- /下载按钮 -->
        <el-table-column :label="translate('操作')" width="85">
          <template #default="scope">
            <el-button type="primary" @click="getRssLinkBtn(scope.row)">
              {{ translate("订阅") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>
<script setup>
import { ref, inject, watch } from "vue";
import SearchResult from "@/components/SearchResult/index.vue";
import {
  searchAllInfo,
  addRssLink,
  getSubgroupInfo,
} from "@/api/yzrServer.js";
import { Search } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { setSize } from "@/utils/utils";
import { translate } from "@/utils/translate";

const input = ref("");
const searchQuery = inject("searchQuery");

watch(searchQuery, (val) => {
  if (val) {
    input.value = val;
    searchQuery.value = "";
    const settings = JSON.parse(localStorage.getItem("timeTableSettings") || "{}");
    if (settings.clickAction === "searchAndGo") {
      searchAllInfoBtn();
    }
  }
});

const searchData = ref({ bangumiItem: [], rssItems: [], rssLink: '' });
const loading = ref(false);
const subtitleGroupList = ref([]);
const showBangumi = ref(false);
const subtitleGroupListLoading = ref(false);
const bangumiId = ref(0);

const searchAllInfoBtn = () => {
  loading.value = true;
  searchAllInfo({
    name: input.value,
  })
    .then((res) => {
      if (res.code == 200) {
        let rss = JSON.parse(res.data.rss).rss.channel;
        let items = rss.item;
        if (!Array.isArray(items)) {
          items = [items];
        }
        searchData.value = {
          bangumiItem: res.data.bangumiItem,
          rssItems: items,
          rssLink: rss.link || '',
        };
        loading.value = false;
      } else if (res.code == 404) {
        loading.value = false;
        ElNotification({
          title: translate("搜索失败"),
          message: translate("未找到相关番剧"),
          type: "warning",
        });
      } else {
        loading.value = false;
        ElNotification({
          title: translate("搜索失败"),
          message: translate("请检查网络连接"),
          type: "error",
        });
      }
    })
    .catch((err) => {
      loading.value = false;
      ElNotification({
        title: translate("搜索失败"),
        message: err,
        type: "error",
      });
    });
};

const getSubgroupInfoBtn = (e) => {
  subtitleGroupList.value = [];
  showBangumi.value = true;
  subtitleGroupListLoading.value = true;
  bangumiId.value = e.bangumiId;
  console.log(e);
  getSubgroupInfo({
    bangumiId: bangumiId.value,
  })
    .then((res) => {
      subtitleGroupListLoading.value = false;
      if (res.code === 200) {
        console.log(res);
        subtitleGroupList.value = res.data;
      } else {
        ElNotification({
          title: translate("获取字幕组失败"),
          message: translate("请检查网络连接"),
          type: "error",
        });
      }
    })
    .catch((err) => {
      subtitleGroupListLoading.value = false;
      ElNotification({
        title: translate("获取字幕组失败"),
        message: err,
        type: "error",
      });
    });
};

const getRssLinkBtn = (e) => {
  console.log(e);
  var data = {
    bangumiId: bangumiId.value,
    subgroupId: e.subgroupId.slice(1),
  };
  console.log(data);
  ElNotification({
    title: translate("订阅中"),
    message: translate("请稍等"),
    type: "info",
  });
  addRssLink(data)
    .then((res) => {
      console.log(res);
      if (res.code == 200) {
        ElNotification({
          title: translate("订阅成功"),
          message: translate("请前往订阅列表查看"),
          type: "success",
        });
      } else {
        ElNotification({
          title: translate("订阅失败"),
          message: translate("请检查网络连接"),
          type: "warning",
        });
      }
    })
    .catch((err) => {
      ElNotification({
        title: translate("订阅失败"),
        message: err,
        type: "warning",
      });
    });
};
</script>
<style scoped>
.searchPage {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  flex-wrap: nowrap;
}
.searchBox {
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: center;
}
.input-with-select {
  width: 100%;
  margin-bottom: 20px;
}

.input-with-select:deep(.el-input__wrapper) {
  height: 50px;
  border-radius: 25px;
  border: 0px;
}

.searchBtn {
  background-color: #409eff;
  border: none;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

</style>
