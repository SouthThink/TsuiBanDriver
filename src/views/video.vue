<template>
  <div class="video">
    <div class="videoInfo">
      <el-text size="large" class="title">{{ title }}</el-text>
    </div>
    <div class="player">
      <Artplayer
        @get-instance="getInstance"
        :videoId="videoId"
        :style="style"
      />
    </div>
    <div class="bangumiList">
      <BangumiCollapse :AnimeId="AnimeId" :Id="videoId" @getTitle="setTitle" />
    </div>
  </div>
</template>
<script>
import Artplayer from "@/components/ArtPlayer.vue";
import BangumiCollapse from "@/components/BangumiCollapse/index.vue";
// import { makeHistory } from "@/api/dandanPlay.js";
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
    };
  },
  watch: {
    $route: {
      handler: function (route) {
        this.title = "";
        this.videoId = route.query.videoId;
        this.AnimeId = route.query.AnimeId;
        console.log("watch", this.videoId, this.AnimeId);

        // makeHistory({ id: this.videoId }).then(
        //   (res) => {
        //     console.log(res);
        //   },
        //   (err) => {
        //     console.log(err);
        //   }
        // );
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
  },
};
</script>

<style scoped>
.video {
  margin: auto;
}
.videoInfo {
  width: 60vw;
  height: 100px;
  margin: 0 auto;
  text-align: center;
  line-height: 100px;
  border-bottom: 1px solid #ccc;
}
.title {
  font-size: 24px;
  font-weight: bold;
}
.bangumiList {
  width: 60vw;
  margin: 0 auto;
}
.player {
  width: 60vw;
  position: relative;
}
/* 宽度小于1000px时 */
@media screen and (max-width: 1000px) {
  .videoInfo {
    width: 80vw;
  }
  .bangumiList {
    width: 80vw;
  }
  .player {
    width: 80vw;
  }
}

/* 宽度小于767px时 */
@media screen and (max-width: 767px) {
  .videoInfo {
    width: 90vw;
  }
  .bangumiList {
    width: 90vw;
  }
  .player {
    width: 90vw;
  }
}
</style>
