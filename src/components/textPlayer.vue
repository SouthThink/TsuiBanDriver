<template>
    <div>
      <div ref="playerContainer" style="width: 100%; height: 100%"></div>
      <select 
        v-model="selectedSubtitle" 
        @change="changeSubtitle" 
        v-if="subtitles.length"
      >
        <option value="-1">关闭字幕</option>
        <option v-for="(sub, index) in subtitles" :key="index" :value="index">
          {{ sub.label }}
        </option>
      </select>
    </div>
  </template>
  
  <script>
  import ArtPlayer from "artplayer";
  
  export default {
    data() {
      return {
        instance: null,
        subtitles: [],
        selectedSubtitle: -1,
      };
    },
    mounted() {
      this.instance = new ArtPlayer({
        container: this.$refs.playerContainer,
        url: "/api/api/v1/stream/id/12c6bc63-b440-41b9-88a8-2e64b373242f",
        pip: true,
        fullscreen: true,
        subtitle: {
          url: "",
        },
        setting: true,
        plugins: [
          (art) => {
            art.on("ready", () => {
                console.log(art);
              // 使用 art.elements.video 替代 art.template.$video
              const video = art.template.$video;
              
              // 初始化时立即更新字幕列表
              this.updateSubtitles(video);
  
              // 监听轨道变化（部分浏览器需要）
              video.textTracks.onaddtrack = () => this.updateSubtitles(video);
            });
          },
        ],
      });
    },
    methods: {
      updateSubtitles(video) {
        const tracks = Array.from(video.textTracks || []);
        console.log(tracks,video);
        this.subtitles = tracks
          .filter((track) => track.kind === "subtitles")
          .map((track) => ({
            label: track.label || `字幕 ${track.language || track.id}`,
            track: track,
          }));
          console.log(this.subtitles);
      },
      changeSubtitle() {
        this.subtitles.forEach((sub, index) => {
          sub.track.mode = index === this.selectedSubtitle ? "showing" : "hidden";
        });
      },
    },
    beforeDestroy() {
      if (this.instance) {
        this.instance.destroy();
      }
    },
  };
  </script>