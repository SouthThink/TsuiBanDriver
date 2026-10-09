<template>
  <div ref="artRef" class="player"></div>
</template>

<script>
import Artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import tw from "artplayer/dist/i18n/zh-tw.js";
import { translate } from '@/utils/translate';
import artplayerPluginJassub from '@/utils/artplayerPluginJassub';
import { getFontList } from '@/api/yzrServer';

// 空字幕：切换到无字幕视频时用于清空已加载的字幕轨道
const EMPTY_SUBTITLE_URL = "data:text/vtt;base64," + btoa("WEBVTT\n\n");

// 需要 libass（jassub）渲染的字幕类型：内置渲染会把 ass 转成 vtt 丢失样式
const ASS_TYPES = ["ass", "ssa"];

export default {
  data() {
    return {
      instance: null,
      jassub: null,
      externalFonts: [],
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
      this.externalFonts = urls.fonts || [];
      // 首个字幕：ass 交给 jassub，其余（srt/vtt）交给内置渲染
      const firstSubtitle = urls.subtitles[0];
      const builtinSubtitle = firstSubtitle && !ASS_TYPES.includes(firstSubtitle.type)
        ? firstSubtitle
        : null;

      try {
        const options = {
          url: urls.streamUrl,
          poster: urls.posterUrl,
          subtitle: this.buildSubtitleOption(builtinSubtitle),
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
        
        // 首个字幕为 ass 时用 jassub 渲染（内置会把 ass 转成 vtt）
        if (firstSubtitle && ASS_TYPES.includes(firstSubtitle.type)) {
          this.applySubtitle(firstSubtitle);
        }
        
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
        this.externalFonts = urls.fonts || [];
        // 重建 ASS 渲染器，以便加载新视频目录下的字幕组字体
        this.resetJassub();
        
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
      const visible = !item.switch;
      item.tooltip = visible ? this.translate("隐藏") : this.translate("显示");
      this.instance.subtitle.show = visible;
      // ass 由 jassub 渲染，需同步控制其画布显隐
      this.setJassubVisible(visible);
      return visible;
    },
    
    destroyPlayer() {
      this.resetJassub();
      
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
        // 字幕组随片提供的外挂字体（同目录 / fonts 子目录），供 ASS 渲染使用
        const fonts = path ? await this.loadExternalFonts(path) : [];
        
        return {
          streamUrl: streamData.url,
          posterUrl,
          thumbnails,
          subtitles,
          fonts
        };
      } catch (error) {
        console.error('获取视频URL失败:', error);
        ElMessage.error('获取视频信息失败: ' + error.message);
        return {
          streamUrl: '',
          posterUrl: '',
          thumbnails: null,
          subtitles: [],
          fonts: []
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
    
    // 获取字幕组随片提供的外挂字体地址（同目录 / fonts 子目录）
    // 失败或无字体时返回空数组，由插件回退到内置中文字体
    async loadExternalFonts(path) {
      try {
        const data = await getFontList({ path });
        if (!data || data.code !== 200 || !Array.isArray(data.data)) {
          return [];
        }
        return data.data.map((item) => item.url).filter(Boolean);
      } catch {
        return [];
      }
    },
    
    // 构造内置字幕配置（仅 vtt/srt；ass 交给 jassub，不能进入内置以免被转成 vtt）
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
    // ass/ssa 交给 jassub（libass）原生渲染，其余交给 Artplayer 内置
    applySubtitle(item, notify = false) {
      if (!this.instance) return;
      if (item && ASS_TYPES.includes(item.type)) {
        this.applyAssSubtitle(item, notify);
        return;
      }
      this.releaseJassub();
      this.applyBuiltinSubtitle(item, notify);
    },
    
    // srt/vtt（或无字幕）走 Artplayer 内置字幕
    applyBuiltinSubtitle(item, notify = false) {
      if (!this.instance || !this.instance.subtitle) return;
      const url = item ? item.url : EMPTY_SUBTITLE_URL;
      const option = { type: item ? item.type : "vtt" };
      if (notify && item) {
        option.name = item.name;
      }
      // 加载失败时播放器内部已弹出提示，这里仅避免未处理的 Promise 拒绝
      this.instance.subtitle.switch(url, option).catch(() => {});
    },
    
    // ass/ssa 走 jassub：拉取后端 /yzr/getSubtitle 返回的原始 ass 文本，
    // 交给 libass 渲染，避免内置 assToVtt 造成的样式丢失
    async applyAssSubtitle(item, notify = false) {
      try {
        const res = await fetch(item.url);
        if (!res.ok) {
          console.error("[jassub] 获取 ASS 字幕失败:", res.status);
          ElMessage.error(this.translate("获取字幕内容失败"));
          return;
        }
        const content = await res.text();
        
        // 关闭内置字幕轨道，避免两套渲染同时显示
        this.applyBuiltinSubtitle(null);
        
        if (this.jassub) {
          // 复用已有 jassub 实例，仅替换字幕轨道
          await this.jassub.ready;
          await this.jassub.renderer.setTrack(content);
          await this.jassub.resize(true);
        } else {
          this.jassub = artplayerPluginJassub({
            subContent: content,
            fonts: this.externalFonts,
          })(this.instance).instance;
        }
        this.setJassubVisible(true);
        
        if (notify) {
          this.instance.notice.show = `${this.instance.i18n.get("Switch Subtitle")}: ${item.name}`;
        }
      } catch (error) {
        console.error("[jassub] 渲染 ASS 字幕失败:", error);
        ElMessage.error(this.translate("获取字幕内容失败"));
      }
    },
    
    // 释放 jassub 当前轨道并隐藏画布（保留 worker，切回 ass 时复用）
    releaseJassub() {
      if (!this.jassub) return;
      this.setJassubVisible(false);
      Promise.resolve(this.jassub.ready)
        .then(() => this.jassub && this.jassub.renderer.freeTrack())
        .catch(() => {});
    },
    
    // 销毁 jassub 实例（切换视频时重建，以便重新加载新视频目录下的字体）
    resetJassub() {
      if (!this.jassub) return;
      try {
        this.jassub.destroy();
      } catch (error) {
        console.error("销毁 ASS 渲染器失败:", error);
      }
      this.jassub = null;
    },
    
    // 控制 jassub 渲染画布的显隐
    setJassubVisible(visible) {
      if (this.jassub && this.jassub._canvas) {
        this.jassub._canvas.style.display = visible ? "block" : "none";
      }
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
