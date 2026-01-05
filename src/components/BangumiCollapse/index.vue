<template>
  <div>
    <el-collapse
      v-model="activeNames"
      v-loading="bangumiList.length == 0"
      class="bangumi-collapse"
      @change="handleChange"
    >
      <el-collapse-item
        v-for="(item, index) in bangumiList"
        :key="index"
        :name="index"
        class="bangumi-collapse-item"
        disabled
      >
        <template #title>
          <span
            class="bangumi-title-text"
            :class="{ 'unwatched-title': item.AirStatus != '1' }"
          >
            {{ item.EpisodeTitle }} {{ formatReadTime(item.AirDate) }} {{ item.AirStatus == '1' ? '已观看' : '未观看' }}
          </span>
        </template>
        <div class="bangumi-collapse-item-button">
          <div
            class="bangumi-collapse-item-button-team"
            v-for="(item, index) in item.LocalMatchedFiles"
            :key="index"
          >
            <el-button small text @click="aiSubtitleBtn(item)">
              <el-icon><More /></el-icon>
            </el-button>
            <el-button
              @click="routeToVideo(item)"
              text
              :type="isSelected(item)"
            >
              {{ item.Name }}
            </el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script>
import { bangumiList } from "@/api/dandanPlay";
import { aiSubtitle } from "@/api/yzrServer";
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
      // if (this.$route.path == "/video") {
      //   this.showBangumiList(this.AnimeId);
      //   this.$router.push({
      //     name: "video",
      //     query: { videoId: e.Id, AnimeId: e.AnimeId },
      //   });
      // } else {
      //   const route = this.$router.resolve({
      //     name: "video",
      //     query: { videoId: e.Id, AnimeId: e.AnimeId },
      //   });
      //   window.open(route.href, "_blank");
      // }
      if (this.$route.path == "/video") {
        this.$emit("closePage");
      }
      const route = this.$router.resolve({
        name: "video",
        query: { videoId: e.Id, AnimeId: e.AnimeId },
      });
      window.open(route.href, "_blank");
    },
    showBangumiList(e) {
      this.bangumiList = [];
      this.activeNames = [];
      this.bangumiTitle = e.Title;
      bangumiList({ params: e })
        .then((res) => {
          console.log("返回的集数", res);
          this.bangumiList = res.Episodes;
          // console.log(this.bangumiList);
          this.bangumiList.forEach((element, index) => {
            if (element.LocalMatchedFiles.length !== 0) {
              this.activeNames.push(index);
            }
          });
          // 确保在 DOM 更新后设置未观看标题颜色（覆盖可能的样式冲突）
          this.$nextTick(() => {
            this.updateUnwatchedColors();
          });
        })
        .catch((err) => {
          ElNotification({
            title: "获取番剧集数失败",
            message: err,
            type: "error",
          });
        });
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
    aiSubtitleBtn(e) {
      ElMessageBox.confirm(
        "开始AI生成字幕？（这将可能会消耗大量时间）",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(() => {
          aiSubtitle({ video_path: e.Path })
            .then((res) => {
              console.log("返回", res);
              ElNotification({
                title: "获取字幕成功",
                message: res.msg,
                type: "success",
              });
            })
            .catch((err) => {
              ElNotification({
                title: "获取字幕失败",
                message: err,
                type: "error",
              });
            });
        })
        .catch(() => {
          ElMessage({
            type: "info",
            message: "已取消",
          });
        });
    },
    updateUnwatchedColors() {
      try {
        const isDark = document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
        const els = this.$el.querySelectorAll('.unwatched-title');
        els.forEach((el) => {
          const color = isDark ? '#ffffff' : '#000000';
          // 使用 setProperty 的 priority 参数设置为 'important'，覆盖其它样式
          el.style.setProperty('color', color, 'important');
        });
      } catch (err) {
        // 忽略在服务端渲染或没有 DOM 时的错误
        // console.warn('updateUnwatchedColors error', err);
      }
    },
  },
};
</script>
<style scoped>
.bangumi-collapse {
  min-height: 100px;
}
.bangumi-collapse-item {
  /* 防止换行 */
  word-break: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bangumi-collapse-item:deep(.el-collapse-item__header) {
  cursor: default;
}
.bangumi-collapse-item-button {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: flex-start;
}
.bangumi-collapse-item-button:deep(.el-button) {
  margin: 0;
}

.bangumi-title-text {
  display: inline-block;
  max-width: calc(100% - 40px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 未观看：默认浅色模式为纯黑，暗色模式（项目使用 html.dark）为纯白 */
.bangumi-collapse .unwatched-title,
.unwatched-title {
  color: #000 !important;
}

/* 如果项目使用 html.dark 切换暗色主题，则在该类下显示白色 */
html.dark .bangumi-collapse .unwatched-title,
html.dark .unwatched-title {
  color: #fff !important;
}

/* 保留对 prefers-color-scheme 的兼容性（系统主题优先） */
@media (prefers-color-scheme: dark) {
  .bangumi-collapse .unwatched-title,
  .unwatched-title {
    color: #fff !important;
  }
}
</style>
