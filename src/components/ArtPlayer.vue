<template>
  <div ref="artRef" class="player"></div>
</template>

<script>
import Artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import tw from "artplayer/dist/i18n/zh-tw.js";
import { translate } from '@/utils/translate';

// 空字幕：切换到无字幕视频时用于清空已加载的字幕轨道
const EMPTY_SUBTITLE_URL = "data:text/vtt;base64," + btoa("WEBVTT\n\n");

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
    videoPath: {
      type: String,
      default: "",
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
      if (this.instance) {
        return;
      }
      
      this.currentVideoId = this.videoId;
      
      this.$nextTick(() => {
        this.getVideoUrls(this.videoId, this.videoPath).then(urls => {
          this.createPlayer(urls);
        });
      });
    },
    
    createPlayer(urls) {
      const danmukuConfig = this.getDanmukuConfig(this.videoId);
      
      try {
        const options = {
          url: urls.streamUrl,
          poster: urls.posterUrl,
          subtitle: this.buildSubtitleOption(urls.subtitles[0]),
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
        };
        
        if (urls.thumbnails) {
          options.thumbnails = urls.thumbnails;
        }
        
        this.instance = new Artplayer(options);
        
        this.$emit("get-instance", this.instance);
        this.$emit("subtitle-list", urls.subtitles);
        
        this.instance.on("artplayerPluginDanmuku:config", (option) => {
          if (!this.isMobile) {
            const { mount, danmuku, ...rest } = option;
            localStorage.setItem("danmuku", JSON.stringify(rest));
          }
        });
        
        this.instance.on("error", (error) => {
          console.error("播放器错误:", error);
        });
        
      } catch (error) {
        console.error("创建播放器失败:", error);
        ElMessage.error("播放器初始化失败");
      }
    },
    
    switchVideo(newVideoId) {
      if (!this.instance) {
        this.currentVideoId = newVideoId;
        this.$nextTick(() => {
          this.getVideoUrls(newVideoId, this.videoPath).then(urls => {
            this.createPlayer(urls);
          });
        });
        return;
      }
      
      this.currentVideoId = newVideoId;
      
      this.getVideoUrls(newVideoId, this.videoPath).then(urls => {
        const newDanmuku = `/yzr/comment?videoId=${newVideoId}`;
        
        try {
          this.instance.url = urls.streamUrl;
          this.instance.poster = urls.posterUrl;
          
          if (urls.thumbnails) {
            this.instance.thumbnails = urls.thumbnails;
          }
          
          this.applySubtitle(urls.subtitles[0]);
          this.$emit("subtitle-list", urls.subtitles);
          
          if (this.instance.plugins && this.instance.plugins.artplayerPluginDanmuku) {
            const danmukuPlugin = this.instance.plugins.artplayerPluginDanmuku;
            if (typeof danmukuPlugin.load === 'function') {
              danmukuPlugin.load(newDanmuku);
            }
          }
          
        } catch (error) {
          console.error("切换视频失败:", error);
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
    
    async getVideoUrls(videoId, path) {
      try {
        const query = new URLSearchParams({ videoId });
        if (path) {
          query.set("path", path);
        }
        const streamRes = await fetch(`/yzr/stream?${query.toString()}`);
        
        if (!streamRes.ok) {
          console.error('[getVideoUrls] 获取视频流失败:', streamRes.status);
          throw new Error(`获取视频流失败: ${streamRes.status}`);
        }
        
        const streamData = await streamRes.json();
        
        // 后端返回相对地址（本地文件直读 / 回退代理），浏览器会自动补上当前访问的 host，
        // 因此局域网与外网访问都能正常播放
        // 封面与进度条预览缩略图均由后端用 ffmpeg 从本地视频生成
        const pathQuery = new URLSearchParams({ path }).toString();
        const posterUrl = path
          ? `/yzr/poster?${pathQuery}`
          : `/api/api/v1/image/id/${videoId}`;
        const thumbnails = path ? await this.getThumbnails(pathQuery) : null;
        // 字幕列表（外挂 + 内封）同样由后端从本地获取
        const subtitles = path ? await this.getSubtitleList(path) : [];
        
        return {
          streamUrl: streamData.url,
          posterUrl,
          thumbnails,
          subtitles
        };
      } catch (error) {
        console.error('获取视频URL失败:', error);
        ElMessage.error('获取视频信息失败: ' + error.message);
        return {
          streamUrl: '',
          posterUrl: '',
          thumbnails: null,
          subtitles: []
        };
      }
    },
    
    // 获取进度条预览缩略图的布局信息（精灵图 + 网格参数）
    async getThumbnails(pathQuery) {
      try {
        const res = await fetch(`/yzr/thumbnails?${pathQuery}`);
        if (!res.ok) {
          console.error('[getThumbnails] 获取缩略图信息失败:', res.status);
          return null;
        }
        const data = await res.json();
        if (data.code !== 200 || !data.data) {
          return null;
        }
        const { url, number, column, width, height } = data.data;
        return { url, number, column, width, height };
      } catch (error) {
        console.error('[getThumbnails] 获取缩略图信息异常:', error);
        return null;
      }
    },
    
    // 获取本地字幕列表（外挂 + 内封）
    async getSubtitleList(path) {
      try {
        const res = await fetch(`/yzr/getSubtitleList?${new URLSearchParams({ path })}`);
        if (!res.ok) {
          return [];
        }
        const data = await res.json();
        return (data.code === 200 && Array.isArray(data.data)) ? data.data : [];
      } catch (error) {
        console.error('[getSubtitleList] 获取字幕列表异常:', error);
        return [];
      }
    },
    
    // 构造播放器字幕配置（item 为空表示无字幕）
    buildSubtitleOption(item) {
      return {
        url: item ? item.url : "",
        type: item ? item.type : "",
        name: item ? item.name : "",
        encoding: "utf-8",
        escape: true,
        style: {
          "font-size": "18px",
        },
      };
    },
    
    // 应用字幕（免刷新）：notify 为 true 时显示切换提示
    applySubtitle(item, notify = false) {
      if (!this.instance || !this.instance.subtitle) return;
      const url = item ? item.url : EMPTY_SUBTITLE_URL;
      const option = { type: item ? item.type : "vtt" };
      if (notify && item) {
        option.name = item.name;
      }
      // 加载失败时播放器内部已弹出提示，这里仅避免未处理的 Promise 拒绝
      this.instance.subtitle.switch(url, option).catch(() => {});
    },
    
    // 供父组件调用：切换到指定字幕
    switchSubtitle(item) {
      this.applySubtitle(item, true);
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
