<template>
  <div class="video-page">
    <div class="video-layout">
      <!-- 播放区 -->
      <div class="main-column">
        <div class="player-wrapper">
          <div class="player">
            <Artplayer
              @get-instance="getInstance"
              :videoId="videoId"
              :style="style"
            />
          </div>
        </div>

        <div class="video-info" v-if="title">
          <span class="video-title">{{ title }}</span>
        </div>

        <section class="panel" v-if="subtitleList.length > 0">
          <div class="panel-header">
            <span class="panel-title">字幕列表</span>
          </div>
          <el-scrollbar class="panel-scroll">
            <div class="subtitle-items">
              <div
                v-for="(subtitle, index) in subtitleList"
                :key="index"
                class="subtitle-item"
                @click="handleSubtitleClick(subtitle)"
              >
                <el-icon class="subtitle-item-icon"><Document /></el-icon>
                <span class="subtitle-item-text">{{ subtitle }}</span>
              </div>
            </div>
          </el-scrollbar>
        </section>
      </div>

      <!-- 选集侧栏 -->
      <aside class="side-column">
        <section class="panel bangumi-panel">
          <div class="panel-header">
            <span class="panel-title">番剧列表</span>
          </div>
          <el-scrollbar class="bangumi-scroll">
            <BangumiCollapse
              :AnimeId="AnimeId"
              :Id="videoId"
              :openInNewTab="false"
              @getTitle="setTitle"
              @closePage="closePage"
              @videoChange="handleVideoChange"
            />
          </el-scrollbar>
        </section>
      </aside>
    </div>
  </div>
</template>
<script>
import Artplayer from "@/components/ArtPlayer.vue";
import BangumiCollapse from "@/components/BangumiCollapse/index.vue";
import { getSubtitleList, setSubtitle } from "@/api/yzrServer";
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
      console.log("关闭当前页面");
      window.close();
    },
    handleVideoChange(data) {
      console.log("切换视频:", data);

      this.videoId = data.videoId;
      this.AnimeId = data.AnimeId;
      this.title = data.title;
      document.title = data.title;

      this.$router.replace({
        name: "video",
        query: { videoId: data.videoId, AnimeId: data.AnimeId },
      });

      this.fetchSubtitleList();
    },
    async fetchSubtitleList() {
      if (!this.videoId) return;
      try {
        const res = await getSubtitleList({ videoId: this.videoId });
        if (res.code === 200) {
          this.subtitleList = res.data;
        }
      } catch {
        // 错误已由 request 统一提示
      }
    },
    async handleSubtitleClick(subtitle) {
      console.log("点击字幕:", subtitle);
      try {
        const res = await setSubtitle({
          videoId: this.videoId,
          subtitle: subtitle,
        });
        if (res.data === true) {
          location.reload();
        }
      } catch {
        // 错误已由 request 统一提示
      }
    },
  },
};
</script>

<style scoped>
.video-page {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background-color: var(--el-bg-color-page);
}

.video-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: 20px;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* 播放器 */
.player-wrapper {
  width: 100%;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.player {
  width: 100%;
  position: relative;
}

/* 标题 */
.video-info {
  min-width: 0;
  padding: 0 4px;
}

.video-title {
  display: block;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

/* 面板 */
.panel {
  padding: 16px;
  box-sizing: border-box;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* el-scrollbar 的 max-height 必须作用在内部 wrap 上：
   根节点是 height:100% + overflow:hidden，限制根节点只会裁切内容而无法滚动 */
.panel-scroll :deep(.el-scrollbar__wrap) {
  max-height: 220px;
}

/* 字幕列表 */
.subtitle-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
  padding-right: 4px;
}

.subtitle-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 9px 12px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  background-color: var(--el-fill-color-light);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s, border-color 0.2s;
}

.subtitle-item:hover {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.subtitle-item-icon {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.subtitle-item-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 选集侧栏 */
.side-column {
  position: sticky;
  top: 20px;
  min-width: 0;
}

.bangumi-panel {
  display: flex;
  flex-direction: column;
}

/* 剧集列表固定撑满可视高度，集数不足时也保持整块面板高度 */
.bangumi-scroll :deep(.el-scrollbar__wrap) {
  height: calc(100vh - 120px);
}

/* 中等屏幕：侧栏收窄 */
@media screen and (max-width: 1200px) {
  .video-layout {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}

/* 平板：单列布局，选集移至播放器下方 */
@media screen and (max-width: 1000px) {
  .video-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .side-column {
    position: static;
  }

  .bangumi-scroll :deep(.el-scrollbar__wrap) {
    height: 420px;
  }
}

/* 手机：播放器通栏，减少留白 */
@media screen and (max-width: 767px) {
  .video-page {
    padding: 0 0 24px;
  }

  .video-layout,
  .main-column {
    gap: 12px;
  }

  .player-wrapper {
    border-radius: 0;
    box-shadow: none;
  }

  .video-info,
  .panel {
    margin: 0 12px;
  }

  .video-title {
    font-size: 16px;
  }

  .panel {
    padding: 12px;
  }

  .panel-scroll :deep(.el-scrollbar__wrap) {
    max-height: 180px;
  }

  .bangumi-scroll :deep(.el-scrollbar__wrap) {
    height: 360px;
  }

  .subtitle-items {
    grid-template-columns: 1fr;
  }
}
</style>
