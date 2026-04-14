<template>
  <div ref="artRef" class="player"></div>
</template>

<script>
import Artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import tw from "artplayer/dist/i18n/zh-tw.js";
import { translate } from '@/utils/translate';

export default {
  data() {
    return {
      instance: null,
      lang: "zh-cn",
      isMobile: false,
      currentVideoId: "",
    };
  },
  watch: {
    videoId: {
      handler(newVal, oldVal) {
        console.log("视频ID变化:", oldVal, "->", newVal);
        if (newVal && newVal !== oldVal) {
          this.switchVideo(newVal);
        }
      },
    },
  },
  props: {
    videoId: {
      type: String,
      required: true,
    },
  },
  mounted() {
    this.getLang();
    this.detectMobile();
    this.initPlayer();
  },
  methods: {
    translate,
    detectMobile() {
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log("移动端检测:", this.isMobile);
    },
    getLang() {
      if (localStorage.getItem("lang") === "zh-TW") {
        this.lang = "tw";
      } else if (localStorage.getItem("lang") === "en_US") {
        this.lang = "en";
      } else if (localStorage.getItem("lang") === "ja_JP") {
        this.lang = "en";
      } else {
        this.lang = "zh-cn";
      }
    },
    
    getDanmukuConfig(videoId) {
      const danmukuUrl = `/yzr/comment?videoId=${videoId}`;
      
      const baseConfig = {
        visible: true,
        modes: [0, 1, 2],
        heatmap: true,
        emitter: true,
        speed: 15,
        maxLength: 50,
        antiOverlap: true,
        synchronousPlayback: false,
        opacity: 1,
        margin: [0, 75],
        fontSize: 25,
      };
      
      const savedConfig = JSON.parse(localStorage.getItem("danmuku") || "{}");
      const userSettings = {
        visible: savedConfig.visible !== undefined ? savedConfig.visible : baseConfig.visible,
        modes: savedConfig.modes !== undefined ? savedConfig.modes : baseConfig.modes,
        heatmap: savedConfig.heatmap !== undefined ? savedConfig.heatmap : baseConfig.heatmap,
        emitter: savedConfig.emitter !== undefined ? savedConfig.emitter : baseConfig.emitter,
        speed: savedConfig.speed !== undefined ? savedConfig.speed : baseConfig.speed,
        maxLength: savedConfig.maxLength !== undefined ? savedConfig.maxLength : baseConfig.maxLength,
        antiOverlap: savedConfig.antiOverlap !== undefined ? savedConfig.antiOverlap : baseConfig.antiOverlap,
        synchronousPlayback: savedConfig.synchronousPlayback !== undefined ? savedConfig.synchronousPlayback : baseConfig.synchronousPlayback,
        opacity: savedConfig.opacity !== undefined ? savedConfig.opacity : baseConfig.opacity,
        margin: savedConfig.margin !== undefined ? savedConfig.margin : baseConfig.margin,
        fontSize: savedConfig.fontSize !== undefined ? savedConfig.fontSize : baseConfig.fontSize,
      };
      
      if (this.isMobile) {
        userSettings.heatmap = false;
        userSettings.emitter = false;
      }
      
      return {
        danmuku: danmukuUrl,
        ...userSettings,
      };
    },
    
    initPlayer() {
      console.log("初始化播放器:", this.videoId);
      
      if (this.instance) {
        console.log("播放器已存在，直接返回");
        return;
      }
      
      this.currentVideoId = this.videoId;
      
      this.$nextTick(() => {
        this.getVideoUrls(this.videoId).then(urls => {
          this.createPlayer(urls);
        });
      });
    },
    
    createPlayer(urls) {
      const that = this;
      const danmukuConfig = this.getDanmukuConfig(this.videoId);
      
      try {
        this.instance = new Artplayer({
          url: urls.streamUrl,
          poster: urls.posterUrl,
          subtitle: {
            url: `/yzr/getSubtitle?videoId=${this.videoId}`,
            type: "ass",
            encoding: "utf-8",
            escape: true,
            style: {
              "font-size": "18px",
            },
          },
          i18n: {
            tw: tw,
          },
          lang: this.lang,
          setting: true,
          settings: [
            {
              html: this.translate("字幕"),
              tooltip: this.translate("显示"),
              icon: '<img width="22" heigth="22" src="/img/subtitle.svg">',
              switch: true,
              onSwitch: this.subtitleChange,
            },
          ],
          container: this.$refs.artRef,
          id: this.videoId,
          volume: 0.5,
          isLive: false,
          muted: false,
          autoplay: false,
          pip: false,
          autoSize: true,
          autoMini: false,
          screenshot: true,
          qq: true,
          loop: false,
          flip: true,
          playbackRate: true,
          aspectRatio: true,
          fullscreen: true,
          fullscreenWeb: true,
          subtitleOffset: true,
          miniProgressBar: false,
          mutex: true,
          backdrop: true,
          playsInline: true,
          gesture: true,
          autoPlayback: true,
          airplay: true,
          fastForward: true,
          autoOrientation: true,
          lock: true,
          theme: "#23ade5",
          plugins: [
            artplayerPluginDanmuku(danmukuConfig),
          ],
          type: "m3u8",
        });
        
        this.$emit("get-instance", this.instance);
        
        this.instance.on("artplayerPluginDanmuku:config", (option) => {
          if (!this.isMobile) {
            const { mount, danmuku, ...rest } = option;
            localStorage.setItem("danmuku", JSON.stringify(rest));
          }
        });
        
        this.instance.on("error", (error) => {
          console.error("播放器错误:", error);
        });
        
        console.log("播放器创建成功");
        
      } catch (error) {
        console.error("创建播放器失败:", error);
        ElMessage.error("播放器初始化失败");
      }
    },
    
    switchVideo(newVideoId) {
      if (!this.instance) {
        console.log("播放器实例不存在，创建新实例");
        this.currentVideoId = newVideoId;
        this.$nextTick(() => {
          this.getVideoUrls(newVideoId).then(urls => {
            this.createPlayer(urls);
          });
        });
        return;
      }
      
      console.log("切换视频:", this.currentVideoId, "->", newVideoId);
      this.currentVideoId = newVideoId;
      
      this.getVideoUrls(newVideoId).then(urls => {
        const newSubtitle = `/yzr/getSubtitle?videoId=${newVideoId}`;
        const newDanmuku = `/yzr/comment?videoId=${newVideoId}`;
        
        try {
          this.instance.url = urls.streamUrl;
          this.instance.poster = urls.posterUrl;
          
          if (this.instance.subtitle) {
            this.instance.subtitle.url = newSubtitle;
          }
          
          if (this.instance.plugins && this.instance.plugins.artplayerPluginDanmuku) {
            const danmukuPlugin = this.instance.plugins.artplayerPluginDanmuku;
            if (typeof danmukuPlugin.load === 'function') {
              danmukuPlugin.load(newDanmuku);
            }
          }
          
          console.log("视频切换成功");
          
        } catch (error) {
          console.error("切换视频失败:", error);
          console.log("重新创建播放器");
          this.destroyPlayer();
          this.$nextTick(() => {
            this.createPlayer(urls);
          });
        }
      });
    },
    
    subtitleChange(item) {
      item.tooltip = item.switch ? this.translate("隐藏") : this.translate("显示");
      this.instance.subtitle.show = !item.switch;
      return !item.switch;
    },
    
    destroyPlayer() {
      if (this.instance) {
        try {
          console.log("销毁播放器");
          
          if (this.instance.video) {
            this.instance.video.pause();
            this.instance.video.src = '';
            this.instance.video.load();
          }
          
          if (typeof this.instance.destroy === 'function') {
            this.instance.destroy();
          }
          
          this.instance = null;
          
        } catch (error) {
          console.error("销毁播放器失败:", error);
          this.instance = null;
        }
      }
      
      if (this.$refs.artRef) {
        this.$refs.artRef.innerHTML = '';
      }
    },
    
    async getVideoUrls(videoId) {
      try {
        const streamRes = await fetch(`/yzr/stream?videoId=${videoId}`);
        
        console.log('[getVideoUrls] Stream响应状态:', streamRes.status);
        
        if (!streamRes.ok) {
          console.error('[getVideoUrls] 获取视频流失败:', streamRes.status);
          throw new Error(`获取视频流失败: ${streamRes.status}`);
        }
        
        const streamData = await streamRes.json();
        console.log('[getVideoUrls] Stream URL:', streamData.url);
        
        return {
          streamUrl: streamData.url,
          posterUrl: `/api/api/v1/image/id/${videoId}`
        };
      } catch (error) {
        console.error('获取视频URL失败:', error);
        ElMessage.error('获取视频信息失败: ' + error.message);
        return {
          streamUrl: '',
          posterUrl: ''
        };
      }
    },
  },
  
  beforeUnmount() {
    this.destroyPlayer();
  },
};
</script>

<style scoped>
.player:deep(.art-state) {
  opacity: 0 !important;
}
</style>
