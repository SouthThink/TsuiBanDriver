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
import { loadPlayRecord, savePlayRecord, savePlayRecordBeacon } from '@/utils/playHistory';

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
      // 已载入播放器的弹幕信息（{videoId, count}），用于判断后台拉到新弹幕时才重载
      danmukuLoaded: null,
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
  },
  mounted() {
    this.getLang();
    this.detectMobile();
    this.initPlayer();
    // 关闭标签页 / 刷新 / 跳转外部链接时保存播放进度
    window.addEventListener("pagehide", this.saveOnPageLeave);
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
        danmuku: () => this.fetchDanmuku(videoId),
        ...userSettings,
      };
    },

    // 拉取该视频的弹幕（后端按本地文件 ID 找到对应弹幕库）：
    // 有缓存先用缓存立即播放，同时后台再拉一次，拉到新弹幕才重新载入
    async fetchDanmuku(videoId) {
      const result = await this.requestDanmuku(videoId, false);
      this.danmukuLoaded = { videoId, count: result.items.length };
      if (result.cached) {
        this.refreshDanmuku(videoId);
      }
      return result.items;
    },

    // 后台重新拉取弹幕（与缓存合并由后端完成），只有弹幕变多时才替换播放器里的弹幕，
    // 避免每次打开视频都清空重放一遍弹幕层
    async refreshDanmuku(videoId) {
      const result = await this.requestDanmuku(videoId, true);
      const loaded = this.danmukuLoaded;
      if (!result.items.length || !loaded || loaded.videoId !== videoId) return;
      if (result.items.length <= loaded.count) return;
      // 合并结果已包含原弹幕，直接整体替换（load 带参数是追加，必须走无参重载）
      this.applyDanmuku(videoId, result.items);
    },

    // 用合并后的弹幕整体替换播放器里的弹幕
    // （load 带参数是往队列追加，必须改弹幕源后用无参 load 触发清空重载）
    applyDanmuku(videoId, items) {
      const plugin =
        this.instance &&
        this.instance.plugins &&
        this.instance.plugins.artplayerPluginDanmuku;
      if (!plugin || typeof plugin.load !== "function") return;
      this.danmukuLoaded = { videoId, count: items.length };
      // plugin.option 是只读 getter，只能改它返回对象的属性
      plugin.option.danmuku = items;
      Promise.resolve(plugin.load()).catch((error) => {
        console.error("[danmuku] 重新载入弹幕失败:", error);
      });
    },

    // 请求 /yzr/comment；refresh 为 true 时要求后端重新拉取并与缓存合并
    async requestDanmuku(videoId, refresh) {
      try {
        const query = new URLSearchParams({ videoId });
        if (refresh) {
          query.set("refresh", "1");
        }
        const res = await fetch(`/yzr/comment?${query.toString()}`);
        if (!res.ok) {
          return { items: [], cached: false };
        }
        const data = await res.json();
        return {
          items: data.code === 200 && Array.isArray(data.data) ? data.data : [],
          cached: res.headers.get("X-Danmaku-Cached") === "1",
        };
      } catch (error) {
        console.error("[danmuku] 获取弹幕失败:", error);
        return { items: [], cached: false };
      }
    },
    
    // 打开/切换视频即视为已观看，并恢复上次播放进度
    async onVideoOpened() {
      const videoId = this.currentVideoId;
      const record = await loadPlayRecord(videoId);
      // 请求期间可能已切换到别的视频
      if (videoId !== this.currentVideoId) return;
      // 标记已观看：沿用已保存的进度，避免开播瞬间把进度覆盖成 0；
      // 写入后通知父组件刷新选集列表，让「已观看」状态立即一致
      this.reportHistory(record).then(() => this.$emit("history-updated"));
      this.applyResumePosition(record);
    },

    // 上报播放进度：progress 传入时直接沿用（打开时用于标记已观看，不覆盖已有进度），
    // 否则取播放器当前进度（切换集数 / 销毁 / 离开页面时使用）
    reportHistory(progress) {
      const video = this.instance && this.instance.video;
      if (!this.currentVideoId) return Promise.resolve();
      if (!video && !progress) return Promise.resolve();
      const position = progress
        ? Number(progress.position) || 0
        : video.currentTime || 0;
      const duration = progress
        ? Number(progress.duration) || 0
        : video.duration || 0;
      return savePlayRecord({
        videoId: this.currentVideoId,
        position,
        duration,
      });
    },

    // 离开页面（关闭标签页 / 刷新 / 跳转外部链接）时兜底保存播放进度：
    // 用 sendBeacon 保证请求在页面卸载时也能正常发出
    saveOnPageLeave() {
      const video = this.instance && this.instance.video;
      if (!video || !this.currentVideoId) return;
      savePlayRecordBeacon({
        videoId: this.currentVideoId,
        position: video.currentTime || 0,
        duration: video.duration || 0,
      });
    },

    // 恢复上次进度并跳转；接近结尾（视为已看完）则从头播放
    applyResumePosition(record) {
      if (!record || !this.instance || !this.instance.video) return;

      const position = Number(record.position) || 0;
      const duration = Number(record.duration) || 0;
      if (position < 5) return;
      if (duration && position > duration - 15) return;

      const video = this.instance.video;
      const seek = () => {
        try {
          video.currentTime = position;
        } catch (error) {
          console.error("恢复播放进度失败:", error);
        }
      };
      if (video.readyState >= 1) {
        seek();
      } else {
        this.instance.once("video:loadedmetadata", seek);
      }
    },

    initPlayer() {
      if (this.instance) {
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
        
        this.onVideoOpened();
        
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
          this.getVideoUrls(newVideoId).then(urls => {
            this.createPlayer(urls);
          });
        });
        return;
      }
      
      // 切换集数前先保存当前集进度（此时 currentVideoId 仍指向前一集）
      this.reportHistory();

      this.currentVideoId = newVideoId;
      
      this.getVideoUrls(newVideoId).then(urls => {
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
              // 换弹幕源后走无参 load：带参数是往队列追加，会把上一集的弹幕留在里面
              danmukuPlugin.option.danmuku = () => this.fetchDanmuku(newVideoId);
              danmukuPlugin.load();
            }
          }
          
          // 切换视频后同样记为已观看并恢复该集进度
          this.onVideoOpened();
          
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
      // 销毁前记录最终播放进度
      this.reportHistory();
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
    
    // 获取播放所需资源：视频流、封面、进度条预览、字幕与字体，
    // 全部只传视频 ID，由后端从本地番剧库反查路径
    async getVideoUrls(videoId) {
      const videoQuery = new URLSearchParams({ videoId }).toString();
      try {
        // 视频流地址由前端直接拼接：后端 /videoStream 按 videoId 直读本地文件，
        // 浏览器会自动补上当前 host，因此局域网与外网访问都能正常播放
        const streamUrl = `/yzr/videoStream?${videoQuery}`;
        const posterUrl = `/yzr/poster?${videoQuery}`;
        const thumbnails = await this.getThumbnails(videoQuery);
        const subtitles = await this.getSubtitleList(videoId);
        const fonts = await this.loadExternalFonts(videoId);
        
        return { streamUrl, posterUrl, thumbnails, subtitles, fonts };
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
    async getThumbnails(videoQuery) {
      try {
        const res = await fetch(`/yzr/thumbnails?${videoQuery}`);
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
    async getSubtitleList(videoId) {
      try {
        const res = await fetch(`/yzr/getSubtitleList?${new URLSearchParams({ videoId })}`);
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
    async loadExternalFonts(videoId) {
      try {
        const data = await getFontList({ videoId });
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
    window.removeEventListener("pagehide", this.saveOnPageLeave);
    this.destroyPlayer();
  },
};
</script>

<style scoped>
.player:deep(.art-state) {
  opacity: 0 !important;
}
</style>
