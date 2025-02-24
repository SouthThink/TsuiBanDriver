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
        :title="item.EpisodeTitle"
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
      bangumiList(e).then((res) => {
        // console.log("返回的集数", res);
        this.bangumiList = res.Episodes;
        // console.log(this.bangumiList);
        this.bangumiList.forEach((element, index) => {
          if (element.LocalMatchedFiles.length !== 0) {
            this.activeNames.push(index);
          }
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
  flex-direction: row;
  flex-wrap: wrap;
}
.bangumi-collapse-item-button:deep(.el-button) {
  margin: 0;
}
</style>
