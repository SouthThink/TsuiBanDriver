<template>
  <!-- <div v-for="item in videoList">
      <el-button type="primary" :key="item.id" @click="routeToVideo(item)">{{ item.AnimeTitle + item.EpisodeTitle }}</el-button>
    </div> -->
  <div class="bangumi-list">
    <div class="topTool">
      <el-radio-group v-model="nav" class="nav-item">
        <el-radio-button
          v-for="item in navType"
          :key="item.type"
          :value="item.type"
          @click="getVideoList(item.type)"
          size="default"
          class="nav-item-button"
        >
          {{ translate(item.name) }}
        </el-radio-button>
      </el-radio-group>
      <el-input
        v-model="search"
        class="search"
        :placeholder="translate('搜索番剧')"
        clearable
        @input="bangumiSearch"
      />
    </div>
    <el-skeleton :loading="loading" animated :count="3">
      <template #template>
        <div class="bangumi-card">
          <el-skeleton-item class="bangumi-card-title" variant="h3" />
          <el-row :gutter="24">
            <el-col :xs="8" :sm="6" :md="4" :lg="3" v-for="(item, index) in 6" 
            style="padding-left: 5px;padding-right: 5px;">
              <div class="bangumi-item">
                <el-skeleton-item
                  variant="image"
                  style="height: 200px; margin: auto"
                  class="bangumi-item-img"
                />
                <div class="bangumi-item-info">
                  <el-skeleton-item variant="text" class="bangumi-item-title" />
                  <el-skeleton-item variant="text" class="bangumi-item-title" />
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </template>
      <template #default>
        <div
          class="bangumi-card"
          v-for="item in tagList"
          :key="item"
          v-show="videoList[item] !== undefined"
        >
          <el-text class="bangumi-card-title">{{ item }}</el-text>
          <el-row :gutter="24" class="bangumi-card-row">
            <el-col
              :xs="8"
              :sm="6"
              :md="4"
              :lg="3"
              v-for="video in videoList[item]"
              :key="video.Id"
              style="padding-left: 5px;padding-right: 5px;"
            >
              <BangumiCardRow
                @click="showDrawer(video)"
                :imgUrl="'/api' + video.Cover"
                :title="video.Title"
                :rating="video.Rating"
                :episodeWatched="video.EpisodeWatched"
                :episodeTotal="video.EpisodeTotal"
              />
            </el-col>
          </el-row>
        </div>
        <el-empty description="无数据" v-show="tagList.length == 0" />
      </template>
    </el-skeleton>
    <el-drawer
      v-model="showBangumi"
      :title="bangumiTitle"
      direction="rtl"
      :size="size"
    >
      <BangumiCollapse :AnimeId="AnimeId" />
    </el-drawer>
  </div>
</template>

<script>
import { bangumi } from "@/api/dandanPlay";
import BangumiCollapse from "@/components/BangumiCollapse/index.vue";
import BangumiCardRow from "@/components/BangumiCardRow/index.vue";
import "@/components/BangumiCardRow/index.css";
import { translate } from '@/utils/translate'
export default {
  data() {
    return {
      tagList: [],
      videoList: {},
      allVideoList: [],
      loading: true,
      cover: "",
      search: "",
      size: "100%",
      navType: [
        { name: "番剧季度", type: "season" },
        { name: "最近更新", type: "lastupdate" },
        { name: "最近播放", type: "lastplay" },
        { name: "最近添加", type: "lastadd" },
        { name: "名称排序", type: "name" },
        { name: "分类排序", type: "category" },
        { name: "评分排序", type: "rating" },
      ],
      nav: "season",
      showBangumi: false,
      bangumiTitle: "",
      AnimeId: "",
    };
  },
  computed: {
  },
  created() {
    this.getVideoList(this.nav);
    this.size = window.innerWidth > 768 ? "50%" : "100%";
  },
  components: {
    BangumiCollapse,
    BangumiCardRow,
  },
  computed: {},
  methods: {
    translate,
    getVideoList(e) {
      this.loading = true;
      this.videoList = {};
      this.tagList = [];
      bangumi({params:e})
        .then((res) => {
          this.allVideoList = res;
          this.bangumiSearch("");
          this.loading = false;
          // console.log(res, "番剧列表");
        })
        .catch((err) => {
          ElNotification({
            title: "获取番剧列表失败",
            message: err,
            type: "error",
          });
          console.error(err);
          this.loading = false;
        });
    },
    bangumiSearch(e) {
      this.videoList = {};
      this.tagList = [];
      this.allVideoList.forEach((element) => {
        //按照element.GroupName进行分类
        if (element.Title.toLowerCase().indexOf(e.toLowerCase()) != -1) {
          if (!this.videoList[element.GroupName]) {
            this.videoList[element.GroupName] = [];
            this.tagList.push(element.GroupName);
          }
          this.videoList[element.GroupName].push(element);
        }
        if (this.nav == "name") {
          this.tagList.sort();
        }
      });
      console.log(this.videoList);
    },
    showDrawer(e) {
      this.showBangumi = true;
      this.AnimeId = e.AnimeId.toString();
      this.bangumiTitle = e.Title;
    },
  },
};
</script>
<style scoped>
.bangumi-list {
  width: 100%;
}
.topTool {
  display: flex;
  margin: auto;
  justify-content: space-between;
  max-width: 1500px;
  flex-wrap: wrap;
}
.nav-item {
  margin-top: 10px;
  scrollbar-width: none;
  overflow: scroll;
  flex-wrap: nowrap;
}

/* .nav-item-button:deep(.el-radio-button__inner) {
  border-radius: 20px;
  margin-right: 10px;
  border: 1px solid var(--el-border-color);
} */

.search {
  margin-top: 10px;
  max-width: 498px;
}
.bangumi-card-title {
  height: 36px;
  font-size: 1.5em;
  font-weight: bold;
}
.bangumi-card-row {
  margin-top: 6px;
}

.bangumi-card {
  width: 100%;
  max-width: 1500px;
  margin: auto;
  margin-top: 20px;
}
.bangumi-card-item {
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
  cursor: pointer;
}
.bangumi-drawer {
  width: auto;
}
</style>
