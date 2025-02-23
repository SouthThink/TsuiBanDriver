<template>
  <div class="video">
    <div class="videoInfo">
      <h1>视频信息</h1>
    </div>
    <div class="player">
      <Artplayer
        @get-instance="getInstance"
        :videoId="videoId"
        :style="style"
      />
      <!-- <text-player :style="style" /> -->
    </div>
    <div class="bangumiList">
      <BangumiCollapse :AnimeId="AnimeId" :Id="videoId"/>
    </div>
  </div>
</template>
<script>
import Artplayer from "@/components/ArtPlayer.vue";
import BangumiCollapse from "@/components/BangumiCollapse/index.vue";
import TextPlayer from '@/components/textPlayer.vue';
export default {
  data() {
    return {
      style: {
        width: "60vw",
        aspectRatio: "16 / 9",
      },
      videoId: "",
      AnimeId: "",
      bangumiList: [],
    };
  },
  watch: {
    $route: {
      handler: function (route) {
        this.videoId = route.query.videoId;
        this.AnimeId = route.query.AnimeId;
        console.log("watch", this.videoId, this.AnimeId);
      },
      immediate: true,
    },
  },
  components: {
    Artplayer,
    BangumiCollapse,
    TextPlayer,
  },
  beforeCreate() {
    console.log("beforeCreate");
  },
  mounted() {
    console.log("mounted", this.$route.query.videoId);
    console.log("mounted", this.$route.query.AnimeId);
    this.videoId = this.$route.query.videoId;
    this.AnimeId = this.$route.query.AnimeId;
  },
  methods: {
    getInstance(art) {
      console.info("播放器信息", art);
    },
  },
};
</script>

<style scoped>
.videoInfo {
  width: 60vw;
  height: 100px;
  margin: 0 auto;
  text-align: center;
  line-height: 100px;
  border-bottom: 1px solid #ccc;
}
.bangumiList {
  width: 60vw;
  margin: 0 auto;
}
.player {
  width: 60vw;
  position: relative;
}
</style>
