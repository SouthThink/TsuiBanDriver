<template>
  <div>
    <el-collapse
      v-model="activeNames"
      v-loading="bangumiList.length == 0"
      class="bangumi-collapse"
      @change="handleChange"
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
            <el-button
              class="episode-file-name"
              :type="isSelected(file)"
              :title="file.Name"
              text
              @click="routeToVideo(file)"
            >
              <span class="episode-file-text">{{ file.Name }}</span>
            </el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script>
import { bangumiList } from "@/api/yzrServer";
export default {
  data() {
    return {
      activeNames: [],
      bangumiList: [],
      bangumiTitle: "",
    };
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
  },
  watch: {
    AnimeId: {
      handler(newVal) {
        if (newVal !== "") {
          this.showBangumiList(newVal);
        }
      },
      immediate: true,
    },
    Id: {
      handler(newVal) {
        console.log("新的视频id", newVal);
      },
    },
  },
  methods: {
    //时间格式转换成阅读格式
    formatReadTime(inputDate) {
      if (!inputDate) return "";
      const date = new Date(inputDate);

      const year = date.getFullYear().toString().slice(-2); // 获取年份的后两位
      const month = (date.getMonth() + 1).toString(); // 获取月份，注意月份是从0开始的，所以需要+1
      const day = date.getDate().toString(); // 获取日期

      return `${year}/${month}/${day}`;
    },
    handleChange(e) {
      //   console.log(e);
    },
    routeToVideo(e) {
      console.log("点击的视频存放在", e.Path);

      if (this.openInNewTab) {
        const route = this.$router.resolve({
          name: "video",
          query: { videoId: e.Id, AnimeId: e.AnimeId },
        });
        window.open(route.href, "_blank");
      } else {
        this.$emit("videoChange", {
          videoId: e.Id,
          AnimeId: e.AnimeId,
          title: e.AnimeTitle + " " + e.EpisodeTitle,
        });
      }
    },
    async showBangumiList(e) {
      this.bangumiList = [];
      this.activeNames = [];
      this.bangumiTitle = e.Title;

      try {
        const res = await bangumiList({ params: e });
        console.log("返回的集数", res);
        this.bangumiList = (res && res.Episodes) || [];
        // console.log(this.bangumiList);
        // 已有本地文件的剧集默认展开
        this.bangumiList.forEach((element, index) => {
          if (element.LocalMatchedFiles.length !== 0) {
            this.activeNames.push(index);
          }
        });
      } catch {
        // 错误已由 request 统一提示
      }
    },
    isSelected(e) {
      if (e.Id == this.Id) {
        this.$emit("getTitle", e.AnimeTitle + " " + e.EpisodeTitle);
        console.log(e);
        return "primary";
      } else {
        return "default";
      }
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
.episode-file :deep(.el-button + .el-button) {
  margin-left: 0;
}
.episode-file .episode-file-name {
  flex: 1;
  min-width: 0;
  height: auto;
  min-height: 28px;
  padding: 4px 8px;
  justify-content: flex-start;
  /* 按钮默认居中，这里显式左对齐 */
  text-align: left;
  border-radius: 6px;
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
.episode-file :deep(.episode-file-name.el-button--primary) {
  font-weight: 600;
  background-color: var(--el-color-primary-light-9);
}
.episode-file :deep(.episode-file-name.el-button--primary:hover) {
  background-color: var(--el-color-primary-light-8);
}
</style>
