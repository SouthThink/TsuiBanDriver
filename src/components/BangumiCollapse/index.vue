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
        :title="item.EpisodeTitle + ' ' + formatReadTime(item.AirDate)"
        class="bangumi-collapse-item"
        disabled
      >
        <div class="bangumi-collapse-item-button">
          <el-button
            v-for="(item, index) in item.LocalMatchedFiles"
            :key="index"
            @click="routeToVideo(item)"
            text
            :type="isSelected(item)"
          >
            {{ item.Name }}
          </el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script>
import { bangumiList } from "@/api/dandanPlay";
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
      if (this.$route.path == "/video") {
        this.$router.push({
          name: "video",
          query: { videoId: e.Id, AnimeId: e.AnimeId },
        });
      } else {
        const route = this.$router.resolve({
          name: "video",
          query: { videoId: e.Id, AnimeId: e.AnimeId },
        });
        window.open(route.href, "_blank");
      }
    },
    showBangumiList(e) {
      this.bangumiList = [];
      this.activeNames = [];
      this.bangumiTitle = e.Title;
      bangumiList({params:e})
        .then((res) => {
          console.log("返回的集数", res);
          this.bangumiList = res.Episodes;
          // console.log(this.bangumiList);
          this.bangumiList.forEach((element, index) => {
            if (element.LocalMatchedFiles.length !== 0) {
              this.activeNames.push(index);
            }
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
</style>
