<template>
  <div>
    <el-collapse
      v-model="activeNames"
      v-loading="bangumiList.length == 0"
      class="bangumi-collapse"
    >
      <el-collapse-item
        v-for="(episode, episodeIndex) in bangumiList"
        :key="episodeIndex"
        :name="episodeIndex"
        class="bangumi-collapse-item"
        :class="{ 'is-playing': isCurrentEpisode(episode) }"
        :disabled="episode.LocalMatchedFiles.length === 0"
      >
        <template #title>
          <div class="episode-title">
            <span class="episode-name">{{ episode.EpisodeTitle }}</span>
            <span class="episode-date">{{ formatReadTime(episode.AirDate) }}</span>
            <span
              class="episode-status"
              :class="episode.AirStatus == '1' ? 'is-watched' : 'is-unwatched'"
            >
              {{ episode.AirStatus == "1" ? "已观看" : "未观看" }}
            </span>
          </div>
        </template>
        <div class="episode-files">
          <div
            v-for="(file, fileIndex) in episode.LocalMatchedFiles"
            :key="fileIndex"
            class="episode-file"
          >
            <a
              class="episode-file-name"
              :class="{ 'is-selected': isSelected(file) }"
              :href="videoHref(file)"
              :target="openInNewTab ? '_blank' : null"
              :title="file.Name"
              @click="onClickFile(file, $event)"
            >
              <span class="episode-file-text">{{ file.Name }}</span>
            </a>
            <el-button
              v-if="showRematch"
              class="episode-file-rematch"
              link
              :title="translate('重新识别')"
              @click="openRematch(file)"
            >
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 单个文件识别错误时手动改判作品与剧集 -->
    <RematchDialog
      v-model="rematchVisible"
      :file="rematchTarget"
      @success="onRematchSuccess"
    />
  </div>
</template>
<script>
import { bangumiList } from "@/api/yzrServer";
import { username } from "@/utils/user";
import { translate } from "@/utils/translate";
import RematchDialog from "@/components/RematchDialog/index.vue";
export default {
  data() {
    return {
      activeNames: [],
      bangumiList: [],
      bangumiTitle: "",
      rematchVisible: false,
      rematchTarget: {},
    };
  },
  components: {
    RematchDialog,
  },
  props: {
    AnimeId: {
      type: String,
      default: () => "",
    },
    Id: {
      type: String,
      default: () => "",
    },
    openInNewTab: {
      type: Boolean,
      default: false,
    },
    // 是否显示单个文件的重新识别入口（仅番剧详情页展示，播放页不展示）
    showRematch: {
      type: Boolean,
      default: false,
    },
    // 传入剧集数据时直接渲染，不再请求接口（详情页已经拿到剧集）
    episodes: {
      type: Array,
      default: null,
    },
  },
  watch: {
    AnimeId: {
      handler(newVal) {
        if (newVal === "") {
          return;
        }
        if (this.episodes && this.episodes.length) {
          this.applyEpisodes(this.episodes);
        } else {
          this.showBangumiList(newVal);
        }
      },
      immediate: true,
    },
    // 父组件重新拉取剧集（如单个文件重新识别后）时同步刷新列表
    episodes(newVal) {
      if (newVal && newVal.length) {
        this.applyEpisodes(newVal);
      }
    },
  },
  methods: {
    translate,
    // 打开重新识别弹窗（单个文件识别错误时手动指定作品与剧集）
    openRematch(file) {
      this.rematchTarget = {
        Name: file.Name,
        VideoId: file.Id,
        AnimeId: file.AnimeId || "",
        AnimeTitle: file.AnimeTitle || "",
        EpisodeId: file.EpisodeId || "",
      };
      this.rematchVisible = true;
    },
    // 改判成功：剧集数据由父组件传入时交给父组件重新拉取，否则刷新当前剧集列表
    onRematchSuccess() {
      this.rematchVisible = false;
      if (this.episodes && this.episodes.length) {
        this.$emit("refresh");
        return;
      }
      if (this.AnimeId) {
        this.showBangumiList(this.AnimeId);
      }
    },
    // 渲染剧集列表，并默认展开已有本地文件的剧集
    applyEpisodes(episodes) {
      this.bangumiList = episodes || [];
      this.activeNames = [];
      this.bangumiList.forEach((element, index) => {
        if (element.LocalMatchedFiles.length !== 0) {
          this.activeNames.push(index);
        }
      });
    },
    //时间格式转换成阅读格式
    formatReadTime(inputDate) {
      if (!inputDate) return "";
      const date = new Date(inputDate);

      const year = date.getFullYear().toString().slice(-2); // 获取年份的后两位
      const month = (date.getMonth() + 1).toString(); // 获取月份，注意月份是从0开始的，所以需要+1
      const day = date.getDate().toString(); // 获取日期

      return `${year}/${month}/${day}`;
    },
    // 播放页地址：作为 <a> 的 href，保留可复制链接、右键/中键新开的语义
    videoHref(file) {
      return this.$router.resolve({
        name: "video",
        query: { videoId: file.Id, AnimeId: file.AnimeId },
      }).href;
    },
    // 详情页（openInNewTab）交给 href + target=_blank 由浏览器跳转；
    // 播放页内点击则是切换当前播放的视频，不整页刷新，交给父组件处理
    onClickFile(file, event) {
      if (this.openInNewTab) {
        return;
      }
      event.preventDefault();
      this.$emit("videoChange", {
        videoId: file.Id,
        AnimeId: file.AnimeId,
        title: file.AnimeTitle + " " + file.EpisodeTitle,
      });
    },
    async showBangumiList(e) {
      this.bangumiList = [];
      this.activeNames = [];
      this.bangumiTitle = e.Title;

      try {
        const res = await bangumiList({ params: e, username: username.value });
        this.applyEpisodes((res && res.Episodes) || []);
      } catch {
        // 错误已由 request 统一提示
      }
    },
    isSelected(e) {
      if (e.Id == this.Id) {
        this.$emit("getTitle", e.AnimeTitle + " " + e.EpisodeTitle);
        return true;
      }
      return false;
    },
    // 当前播放的视频是否属于该剧集
    isCurrentEpisode(episode) {
      return episode.LocalMatchedFiles.some((file) => file.Id == this.Id);
    },
  },
};
</script>
<style scoped>
.bangumi-collapse {
  min-height: 100px;
  /* 去掉折叠面板自带的分隔线，改用剧集卡片自身的间距区分 */
  border-top: none;
  border-bottom: none;
}
.bangumi-collapse :deep(.el-collapse-item) {
  margin-bottom: 6px;
}
.bangumi-collapse :deep(.el-collapse-item:last-child) {
  margin-bottom: 0;
}

/* 剧集卡片 */
.bangumi-collapse :deep(.el-collapse-item__header) {
  position: relative;
  padding: 0 8px;
  border-bottom: none;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.bangumi-collapse :deep(.el-collapse-item__header:hover) {
  background-color: var(--el-fill-color-light);
}
.bangumi-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}
.bangumi-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}
.bangumi-collapse :deep(.el-collapse-item__arrow) {
  color: var(--el-text-color-secondary);
}

/* 当前播放的剧集 */
.bangumi-collapse-item.is-playing :deep(.el-collapse-item__header) {
  background-color: var(--el-color-primary-light-9);
}
.bangumi-collapse-item.is-playing :deep(.el-collapse-item__header)::before {
  content: "";
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background-color: var(--el-color-primary);
}
.bangumi-collapse-item.is-playing .episode-name {
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 剧集行的 header 实际是 <button>，UA 默认 text-align: center 会被标题继承 */
.bangumi-collapse-item:deep(.el-collapse-item__header) {
  text-align: left;
  cursor: pointer;
  min-width: 0;
}
.bangumi-collapse :deep(.el-collapse-item.is-disabled) .el-collapse-item__header {
  cursor: default;
}
.bangumi-collapse :deep(.el-collapse-item.is-disabled) .el-collapse-item__arrow {
  visibility: hidden;
}

/* 剧集标题行：标题 + 放送日期 + 观看状态 */
.bangumi-collapse-item .episode-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.bangumi-collapse-item .episode-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}
.bangumi-collapse-item .episode-date {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.bangumi-collapse-item .episode-status {
  flex-shrink: 0;
  padding: 1px 6px;
  font-size: 12px;
  line-height: 18px;
  border-radius: 4px;
}
.bangumi-collapse-item .episode-status.is-watched {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}
.bangumi-collapse-item .episode-status.is-unwatched {
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color);
}

/* 剧集下的文件列表 */
.episode-files {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.episode-file {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.episode-file .episode-file-name {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--el-text-color-primary);
  text-decoration: none;
  cursor: pointer;
  background-color: var(--el-fill-color-light);
}
.episode-file .episode-file-name:hover {
  background-color: var(--el-fill-color);
}
/* 文件名最多两行，超出省略，完整名称见 title 提示 */
.episode-file .episode-file-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.4;
  text-align: left;
  white-space: normal;
  word-break: break-word;
}
/* 当前播放的文件 */
.episode-file .episode-file-name.is-selected {
  font-weight: 600;
  background-color: var(--el-color-primary-light-9);
}
.episode-file .episode-file-name.is-selected:hover {
  background-color: var(--el-color-primary-light-8);
}
/* 重新识别：识别错误时手动指定作品与剧集 */
.episode-file .episode-file-rematch {
  flex-shrink: 0;
  padding: 4px;
  color: var(--el-text-color-secondary);
}
.episode-file .episode-file-rematch:hover {
  color: var(--el-color-primary);
}
</style>
