<template>
  <div class="video">
    <div class="videoInfo">
      <el-text size="large" class="title">{{ title }}</el-text>
    </div>
    <div class="playerWrapper">
      <div class="player">
        <Artplayer
          @get-instance="getInstance"
          :videoId="videoId"
          :style="style"
        />
      </div>
    </div>
    <div class="subtitleList" v-if="subtitleList.length > 0">
      <el-text size="default" class="subtitle-title">字幕列表</el-text>
      <el-scrollbar max-height="200px">
        <div class="subtitle-items">
          <div 
            v-for="(subtitle, index) in subtitleList" 
            :key="index"
            class="subtitle-item"
            @click="handleSubtitleClick(subtitle)"
          >
            {{ subtitle }}
          </div>
        </div>
      </el-scrollbar>
    </div>
    <div class="bangumiList">
      <el-text size="default" class="bangumi-title">番剧列表</el-text>
      <BangumiCollapse :AnimeId="AnimeId" :Id="videoId" @getTitle="setTitle" @closePage="closePage"/>
    </div>
  </div>
</template>
<script>
import Artplayer from "@/components/ArtPlayer.vue";
import BangumiCollapse from "@/components/BangumiCollapse/index.vue";
import { getSubtitleList, setSubtitle } from "@/api/yzrServer";
import { ElMessage } from "element-plus";
export default {
  data() {
    return {
      style: {
        width: "100%",
        aspectRatio: "16 / 9",
      },
      videoId: "",
      AnimeId: "",
      bangumiList: [],
      title: "",
      subtitleList: [],
    };
  },
  watch: {
    $route: {
      handler: function (route) {
        this.title = "";
        this.videoId = route.query.videoId;
        this.AnimeId = route.query.AnimeId;
        console.log("watch", this.videoId, this.AnimeId);
        this.fetchSubtitleList();
      },
      immediate: true,
    },
  },
  components: {
    Artplayer,
    BangumiCollapse,
  },
  beforeCreate() {
    console.log("beforeCreate");
  },
  mounted() {
    this.videoId = this.$route.query.videoId;
    this.AnimeId = this.$route.query.AnimeId;
  },
  methods: {
    getInstance(art) {
      console.info("播放器信息", art);
    },
    setTitle(title) {
      this.title = title;
      //设置页面标题
      document.title = title;
    },
    closePage() {
      //关闭当前页面
      console.log("关闭当前页面");
      window.close();
    },
    async fetchSubtitleList() {
      if (!this.videoId) return;
      try {
        const res = await getSubtitleList({ videoId: this.videoId });
        if (res.code === 200) {
          this.subtitleList = res.data;
        }
      } catch (error) {
        console.error("获取字幕列表失败", error);
      }
    },
    async handleSubtitleClick(subtitle) {
      console.log("点击字幕:", subtitle);
      try {
        const res = await setSubtitle({ 
          videoId: this.videoId, 
          subtitle: subtitle 
        });
        if (res.data === true) {
          location.reload();
        } else {
          ElMessage.error("字幕设置失败");
        }
      } catch (error) {
        console.error("设置字幕失败", error);
        ElMessage.error("字幕设置失败");
      }
    },
  },
};
</script>

<style scoped>
.video {
  margin: auto;
  padding-bottom: 40px;
}
.videoInfo {
  width: 60vw;
  margin: 20px auto;
  padding: 20px;
  text-align: center;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.title {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}
.playerWrapper {
  width: 60vw;
  margin: 20px auto;
  padding: 0;
  background-color: transparent;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.player {
  width: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}
.bangumiList {
  width: 60vw;
  margin: 20px auto;
  padding: 15px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
}
.bangumi-title {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}
.subtitleList {
  width: 60vw;
  margin: 20px auto;
  padding: 15px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.subtitle-title {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}
.subtitle-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.subtitle-item {
  padding: 10px 15px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}
.subtitle-item:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  transform: translateX(5px);
}
/* 宽度小于1000px时 */
@media screen and (max-width: 1000px) {
  .videoInfo {
    width: 80vw;
  }
  .playerWrapper {
    width: 80vw;
  }
  .bangumiList {
    width: 80vw;
  }
  .subtitleList {
    width: 80vw;
  }
}

/* 宽度小于767px时 */
@media screen and (max-width: 767px) {
  .videoInfo {
    width: 90vw;
  }
  .playerWrapper {
    width: 90vw;
  }
  .bangumiList {
    width: 90vw;
  }
  .subtitleList {
    width: 90vw;
  }
}
</style>
