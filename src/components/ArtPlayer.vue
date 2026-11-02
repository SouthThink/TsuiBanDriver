<template>
  <div ref="artRef" class="player"></div>
</template>

<script>
import { markRaw } from "vue";
import Artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import tw from "artplayer/i18n/zh-tw";
import { translate } from '@/utils/translate';
import artplayerPluginJassub from '@/utils/artplayerPluginJassub';
import { getFontList } from '@/api/yzrServer';
import { loadPlayRecord, savePlayRecord, savePlayRecordBeacon } from '@/utils/playHistory';

// 空字幕：切换到无字幕视频时用于清空已加载的字幕轨道
const EMPTY_SUBTITLE_URL = "data:text/vtt;base64," + btoa("WEBVTT\n\n");

// 需要 libass（jassub）渲染的字幕类型：内置渲染会把 ass 转成 vtt 丢失样式
const ASS_TYPES = ["ass", "ssa"];

// 项目语言 → Artplayer 语言；Artplayer 没有对应语言（如日语）时统一回退英语
const ART_LANG_MAP = {
  zh_CN: "zh-cn",
  zh_TW: "tw",
  en_US: "en",
};

// 移动端手势开关的浏览器持久化键（Artplayer 只自动保存音量、面板位置等内置状态，
// 不会保存自定义 settings 项的开关状态，需自行存储）
const GESTURE_SEEK_KEY = "playerGestureSeek";
const GESTURE_FAST_FORWARD_KEY = "playerGestureFastForward";

// 长按快进的触发时长（Artplayer 默认 1000ms）。关闭长按快进时改为定时器上限（约 24.8 天），
// 让长按始终不触发——Artplayer 只在创建播放器时读取 fastForward 选项，只能这样运行期关闭
const DEFAULT_FAST_FORWARD_TIME = Artplayer.FAST_FORWARD_TIME;
const FAST_FORWARD_DISABLED_TIME = 2 ** 31 - 1;

// 左右拖拽的容错死区（px）：横向拖动没超过这个距离不触发拖拽
const GESTURE_DEAD_ZONE = 16;

// 字幕偏移范围：[当前值, 最小值, 最大值, 步长]（单位为秒）
const SUBTITLE_OFFSET_RANGE = [0, -30, 30, 0.1];

// 字幕字号范围：[当前值, 最小值, 最大值, 步长]（单位 px）
const SUBTITLE_FONT_SIZE_RANGE = [18, 12, 48, 1];
const DEFAULT_SUBTITLE_FONT_SIZE = 18;

// 字幕相关设置项的名字：按需从设置面板增删（没字幕就不显示开关，字幕关闭就不显示偏移和字号）
const SUBTITLE_SWITCH_NAME = "subtitle-switch";
const SUBTITLE_FONT_SIZE_NAME = "subtitle-font-size";
const SUBTITLE_OFFSET_NAME = "subtitle-offset";

// 弹幕字号、字幕字号完全由浏览器持久化，不参与后端同步（手机和电脑的字号需求不同）
const DANMAKU_FONT_SIZE_KEY = "danmakuFontSize";
const SUBTITLE_FONT_SIZE_KEY = "subtitleFontSize";

// 电脑端长按 →（右方向键）触发倍速的等待时长（ms）
const KEY_LONG_PRESS_TIME = 500;

// 音量/进度拖动中心提示：无操作后停留时长（ms）
const CENTER_TOAST_HIDE_TIME = 500;

// 中心提示图标
const ICON_VOLUME = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12zM14 3.2v2.06a7 7 0 0 1 0 13.48v2.06a9 9 0 0 0 0-17.6z"/></svg>';
const ICON_VOLUME_MUTE = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm18.4 1.6L19 8.2l-2.4 2.4-2.4-2.4-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4 2.4-2.4 2.4 2.4 1.4-1.4-2.4-2.4 2.4-2.4z"/></svg>';
const ICON_SEEK = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.75-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';

// libass 没有字号配置项，只能按比例改写 ASS 样式表里的 Fontsize 后重建轨道。
// 只处理 [V4+ Styles] / [V4 Styles] 段落，其余内容原样保留。
function scaleAssFontSize(content, ratio) {
  if (!content || !Number.isFinite(ratio) || ratio === 1) return content;

  const lines = content.split(/\r?\n/);
  let inStyles = false;
  let fontSizeIndex = 2;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();

    if (/^\[.*\]$/.test(trimmed)) {
      inStyles = /^\[V4\+?\s*Styles\]$/i.test(trimmed);
      continue;
    }
    if (!inStyles) continue;

    if (/^Format\s*:/i.test(trimmed)) {
      const fields = trimmed.slice(trimmed.indexOf(":") + 1).split(",");
      const found = fields.findIndex(
        (field) => field.trim().toLowerCase() === "fontsize"
      );
      if (found !== -1) fontSizeIndex = found;
      continue;
    }

    if (/^Style\s*:/i.test(trimmed)) {
      const colon = line.indexOf(":");
      const fields = line.slice(colon + 1).split(",");
      const fontSize = Number.parseFloat(fields[fontSizeIndex]);
      if (!Number.isFinite(fontSize)) continue;
      fields[fontSizeIndex] = (fontSize * ratio).toFixed(1);
      lines[index] = `${line.slice(0, colon + 1)}${fields.join(",")}`;
    }
  }

  return lines.join("\n");
}

export default {
  data() {
    return {
      instance: null,
      jassub: null,
      externalFonts: [],
      lang: "zh-cn",
      isMobile: false,
      // 移动端手势开关（播放器设置面板），分别控制左右拖拽快进与长按快进
      gestureSeekEnabled: true,
      gestureFastForwardEnabled: true,
      // 手势守卫：touchstart 记录拖拽起点，touchmove 按需拦截（见 bindGestureGuard）
      gestureStart: null,
      gestureStartPoint: null,
      gestureGuard: null,
      // 电脑端长按 → 快进：计时器、按下前的倍速、keyup 监听
      keyFastForwardTimer: null,
      keyFastForwardRate: null,
      keyFastForwardKeyUp: null,
      // 暂停时自动隐藏控制栏的计时器
      controlHideTimer: null,
      // 鼠标滚轮调音量的监听函数
      wheelVolumeHandler: null,
      // 音量/进度拖动中心提示：DOM 引用与隐藏计时器
      centerToastEl: null,
      centerToastIconEl: null,
      centerToastTextEl: null,
      centerToastInnerEl: null,
      centerToastTimer: null,
      // 字幕：当前视频是否有字幕（决定「字幕」开关是否显示）、字幕是否显示（决定「字幕偏移」是否显示）
      hasSubtitle: false,
      subtitleVisible: true,
      // 当前字幕偏移（秒），作为唯一来源：srt/vtt 写进内置轨道，ass 写进 jassub 的 timeOffset
      subtitleOffset: 0,
      // 字幕字号（px），只保存在浏览器，不参与后端同步
      subtitleFontSize: DEFAULT_SUBTITLE_FONT_SIZE,
      // ASS 原始文本与字号重建轨道用的节流计时器
      assSource: "",
      assScaleTimer: null,
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
    this.initGestureSettings();
    this.subtitleFontSize = this.getStoredSubtitleFontSize();
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
      const projectLang = localStorage.getItem("lang") || "zh_CN";
      // 与项目语言保持一致，Artplayer 缺少对应语言时回退英语
      this.lang = ART_LANG_MAP[projectLang] || "en";
    },
    
    getDanmukuConfig(videoId) {
      const baseConfig = {
        visible: true,
        modes: [0, 1, 2],
        heatmap: true,
        speed: 15,
        antiOverlap: true,
        synchronousPlayback: false,
        opacity: 1,
        margin: [0, 75],
        fontSize: 25,
      };
      
      const savedConfig = JSON.parse(localStorage.getItem("danmuku") || "{}");
      // 弹幕字号只在本设备生效，优先读独立键；旧数据仍可能放在 danmuku.fontSize 里
      const storedFontSize = Number(localStorage.getItem(DANMAKU_FONT_SIZE_KEY));
      const fontSize =
        Number.isFinite(storedFontSize) && storedFontSize > 0
          ? storedFontSize
          : savedConfig.fontSize !== undefined
            ? savedConfig.fontSize
            : baseConfig.fontSize;
      const userSettings = {
        visible: savedConfig.visible !== undefined ? savedConfig.visible : baseConfig.visible,
        modes: savedConfig.modes !== undefined ? savedConfig.modes : baseConfig.modes,
        heatmap: savedConfig.heatmap !== undefined ? savedConfig.heatmap : baseConfig.heatmap,
        speed: savedConfig.speed !== undefined ? savedConfig.speed : baseConfig.speed,
        antiOverlap: savedConfig.antiOverlap !== undefined ? savedConfig.antiOverlap : baseConfig.antiOverlap,
        synchronousPlayback: savedConfig.synchronousPlayback !== undefined ? savedConfig.synchronousPlayback : baseConfig.synchronousPlayback,
        opacity: savedConfig.opacity !== undefined ? savedConfig.opacity : baseConfig.opacity,
        margin: savedConfig.margin !== undefined ? savedConfig.margin : baseConfig.margin,
        fontSize,
      };
      
      if (this.isMobile) {
        userSettings.heatmap = false;
      }
      
      return {
        danmuku: () => this.fetchDanmuku(videoId),
        // 不显示弹幕发送框
        emitter: false,
        ...userSettings,
      };
    },

    // 保存播放器里修改过的弹幕设置：字号写入独立键，其余写入 danmuku。
    // 必须排除 mount / danmuku（函数或数组）以及按设备计算的 heatmap
    saveDanmukuConfig(option) {
      if (!option) return;
      const { mount, danmuku, points, heatmap, fontSize, ...rest } = option;
      const settings = JSON.stringify(rest);
      if (localStorage.getItem("danmuku") !== settings) {
        localStorage.setItem("danmuku", settings);
      }
      if (fontSize !== undefined) {
        const value = String(fontSize);
        if (localStorage.getItem(DANMAKU_FONT_SIZE_KEY) !== value) {
          localStorage.setItem(DANMAKU_FONT_SIZE_KEY, value);
        }
      }
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
      this.hasSubtitle = urls.subtitles.length > 0;
      // 首个字幕：ass 交给 jassub，其余（srt/vtt）交给内置渲染
      const firstSubtitle = urls.subtitles[0];
      const builtinSubtitle = firstSubtitle && !ASS_TYPES.includes(firstSubtitle.type)
        ? firstSubtitle
        : null;
      // 手势开关只作用于手机端，桌面端不显示
      const gestureSettings = this.isMobile
        ? [
            {
              html: this.translate("拖拽快进"),
              tooltip: this.gestureSeekEnabled ? this.translate("开启") : this.translate("关闭"),
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48"><path fill="#ffffff" d="M10 24l10-8v6h8v4h-8v6z"/><path fill="#ffffff" d="M38 24l-10-8v6h-8v4h8v6z"/></svg>',
              switch: this.gestureSeekEnabled,
              onSwitch: this.gestureSeekChange,
            },
            {
              html: this.translate("长按快进"),
              tooltip: this.gestureFastForwardEnabled ? this.translate("开启") : this.translate("关闭"),
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48"><path fill="#ffffff" d="M8 12l16 12-16 12z"/><path fill="#ffffff" d="M24 12l16 12-16 12z"/></svg>',
              switch: this.gestureFastForwardEnabled,
              onSwitch: this.gestureFastForwardChange,
            },
          ]
        : [];

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
          // 字幕相关设置项（开关/偏移）按当前视频是否有字幕在创建后动态增删，见 syncSubtitleSettings
          settings: gestureSettings,
          container: this.$refs.artRef,
          id: this.videoId,
          volume: 0.5,
          isLive: false,
          muted: false,
          autoplay: false,
          pip: false,
          // 关闭 autoSize：播放器高度保持容器（16:9）的高度，视频居中留黑边（见样式里的 object-fit: contain）
          autoSize: false,
          autoMini: false,
          screenshot: true,
          qq: true,
          loop: false,
          flip: true,
          playbackRate: true,
          aspectRatio: true,
          fullscreen: true,
          fullscreenWeb: true,
          // 关闭内置字幕偏移项：改用自己实现的 ±30s 版本（见 buildSubtitleOffsetSetting）
          subtitleOffset: false,
          miniProgressBar: false,
          mutex: true,
          backdrop: true,
          playsInline: true,
          // 左右拖拽快进 / 长按快进都固定开启，实际是否生效由各自的开关在运行期控制
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
        
        // 播放器实例不要被 Vue 响应式代理：Artplayer 的 plugins 上有不可配置属性，
        // 代理后读取插件会直接抛错（表现为换集时弹幕设置丢失、播放器被重建）
        this.instance = markRaw(new Artplayer(options));
        // 应用浏览器里保存的字幕字号（内置字幕写 CSS 变量，ASS 在载入轨道时按比例缩放）
        this.applySubtitleFontSize(this.subtitleFontSize, false);
        this.syncSubtitleSettings();
        this.bindGestureGuard();
        this.bindKeyFastForward();
        this.bindControlAutoHide();
        this.bindCenterToast();
        this.bindWheelVolume();
        
        this.$emit("get-instance", this.instance);
        this.$emit("subtitle-list", urls.subtitles);
        
        // 播放器设置面板里改动的弹幕设置立即持久化（手机端同样需要保存）
        this.instance.on("artplayerPluginDanmuku:config", (option) => {
          this.saveDanmukuConfig(option);
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

      // 同时把播放器里改过的弹幕设置存下来，换集后继续沿用
      if (this.instance.plugins && this.instance.plugins.artplayerPluginDanmuku) {
        this.saveDanmukuConfig(this.instance.plugins.artplayerPluginDanmuku.option);
      }

      this.currentVideoId = newVideoId;
      
      this.getVideoUrls(newVideoId).then(urls => {
        this.externalFonts = urls.fonts || [];
        // 换集后字幕数量可能变化，同步改设置面板里的字幕相关项
        this.hasSubtitle = urls.subtitles.length > 0;
        this.syncSubtitleSettings();
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
              // 换集后按浏览器里保存的设置重建配置，避免弹幕设置回到上一次的旧值
              const nextConfig = this.getDanmukuConfig(newVideoId);
              const { danmuku, ...settings } = nextConfig;
              danmukuPlugin.config(settings);
              // 换弹幕源后走无参 load：带参数是往队列追加，会把上一集的弹幕留在里面
              danmukuPlugin.option.danmuku = danmuku;
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
      this.subtitleVisible = visible;
      this.instance.subtitle.show = visible;
      // ass 由 jassub 渲染，需同步控制其画布显隐
      this.setJassubVisible(visible);
      // 字幕关闭后不再显示字幕偏移
      this.syncSubtitleSettings();
      return visible;
    },
    
    // 读取手势开关的浏览器持久化值（默认开启）
    initGestureSettings() {
      this.gestureSeekEnabled = localStorage.getItem(GESTURE_SEEK_KEY) !== "0";
      this.gestureFastForwardEnabled = localStorage.getItem(GESTURE_FAST_FORWARD_KEY) !== "0";
      this.applyFastForwardTime();
    },
    
    // 长按快进关闭时把触发时长改为定时器上限，让长按始终不触发（它是 Artplayer 的公开静态量）
    applyFastForwardTime() {
      Artplayer.FAST_FORWARD_TIME = this.gestureFastForwardEnabled
        ? DEFAULT_FAST_FORWARD_TIME
        : FAST_FORWARD_DISABLED_TIME;
    },
    
    // 左右拖拽快进开关：切换后立即生效并持久化
    gestureSeekChange(item) {
      const enabled = !item.switch;
      item.tooltip = enabled ? this.translate("开启") : this.translate("关闭");
      this.gestureSeekEnabled = enabled;
      localStorage.setItem(GESTURE_SEEK_KEY, enabled ? "1" : "0");
      return enabled;
    },
    
    // 长按快进开关：切换后立即生效并持久化
    gestureFastForwardChange(item) {
      const enabled = !item.switch;
      item.tooltip = enabled ? this.translate("开启") : this.translate("关闭");
      this.gestureFastForwardEnabled = enabled;
      localStorage.setItem(GESTURE_FAST_FORWARD_KEY, enabled ? "1" : "0");
      this.applyFastForwardTime();
      return enabled;
    },
    
    // 左右拖拽快进的生效方式：Artplayer 只在创建播放器时按 gesture 选项绑定触摸监听，
    // 运行期改 option 不生效，因此在播放器根节点用捕获阶段拦截「落在 video 上」的 touchmove。
    // 拖拽的 seek 就在 touchmove 里，被拦截后即不再响应；长按快进挂在 touchstart 上，
    // 单击播放/暂停走 click 事件，进度条拖动走进度条元素，均不受影响。
    // 拦截时机：开关关闭、位移还没拖出容错死区。
    bindGestureGuard() {
      if (!this.instance) return;
      const { $player, $video } = this.instance.template;
      // 捕获阶段记下落在 video 上的拖拽起点，用于判断是否还在死区内
      this.gestureStart = (event) => {
        const touch = event.target === $video ? event.touches[0] : null;
        this.gestureStartPoint = touch ? { x: touch.pageX, y: touch.pageY } : null;
      };
      this.gestureGuard = (event) => {
        if (event.target !== $video) return;
        if (!this.gestureSeekEnabled || this.inGestureDeadZone(event)) {
          event.stopPropagation();
        }
      };
      $player.addEventListener("touchstart", this.gestureStart, true);
      $player.addEventListener("touchmove", this.gestureGuard, true);
    },
    
    // 横向位移是否还在容错死区内（没拖够距离就不触发拖拽）
    inGestureDeadZone(event) {
      const start = this.gestureStartPoint;
      const touch = event.touches[0];
      if (!start || !touch) return false;
      return Math.abs(touch.pageX - start.x) < GESTURE_DEAD_ZONE;
    },
    
    // 暂停时也自动隐藏控制栏：Artplayer 只在 timeupdate（仅播放中触发）里隐藏，
    // 暂停后进度条会一直停留。这里在暂停后按同样的等待时长主动隐藏，
    // 鼠标移动 / 悬停控制栏 / 操作设置面板时重新计时，继续播放后交还给 Artplayer
    bindControlAutoHide() {
      if (!this.instance) return;
      const art = this.instance;
      const schedule = () => {
        clearTimeout(this.controlHideTimer);
        this.controlHideTimer = setTimeout(() => {
          this.controlHideTimer = null;
          if (art.playing || art.video.ended || !art.controls.show) return;
          // 正在操作设置/控制栏或输入时保持显示，稍后再判断
          if (art.setting.show || art.controls.isHover || art.isInput) {
            schedule();
            return;
          }
          art.controls.show = false;
        }, Artplayer.CONTROL_HIDE_TIME);
      };
      art.on("video:pause", schedule);
      art.on("video:play", () => clearTimeout(this.controlHideTimer));
      // 控制栏每次显示（鼠标移动、点击暂停等）都重新计时
      art.on("control", (show) => {
        if (show && !art.playing) schedule();
      });
    },
    
    unbindControlAutoHide() {
      clearTimeout(this.controlHideTimer);
      this.controlHideTimer = null;
    },
    
    // 音量调整 / 进度拖动提示：Artplayer 默认在左上角显示 notice，
    // 这里改为视频中心提示（半透明圆角），并在无操作 0.5s 后隐藏
    bindCenterToast() {
      if (!this.instance) return;
      const art = this.instance;
      const $player = art.template.$player;
      
      const $toast = document.createElement("div");
      $toast.className = "art-center-toast";
      const $inner = document.createElement("div");
      $inner.className = "art-center-toast-inner";
      const $icon = document.createElement("span");
      $icon.className = "art-center-toast-icon";
      const $text = document.createElement("span");
      $text.className = "art-center-toast-text";
      $inner.appendChild($icon);
      $inner.appendChild($text);
      $toast.appendChild($inner);
      $player.appendChild($toast);
      
      this.centerToastEl = $toast;
      this.centerToastIconEl = $icon;
      this.centerToastTextEl = $text;
      this.centerToastInnerEl = $inner;
      
      // 拦截 Artplayer 的 notice：音量与跳转提示改为中心提示，其余提示保持原样。
      // 音量提示格式固定为「Volume: 50」，跳转提示格式固定为「00:10 / 01:00」
      const notice = art.notice;
      const noticeDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(notice), "show");
      const volumePrefix = `${art.i18n.get("Volume")}: `;
      const playText = art.i18n.get("Play");
      const pauseText = art.i18n.get("Pause");
      const seekPattern = /^\d{2}:\d{2}(?::\d{2})? \/ \d{2}:\d{2}(?::\d{2})?$/;
      Object.defineProperty(notice, "show", {
        configurable: true,
        get: () => noticeDescriptor.get.call(notice),
        set: (msg) => {
          if (typeof msg === "string") {
            if (msg.startsWith(volumePrefix)) {
              noticeDescriptor.set.call(notice, "");
              this.showVolumeToast();
              return;
            }
            if (msg === playText || msg === pauseText) {
              noticeDescriptor.set.call(notice, "");
              // 图标表示切换后的状态：开始播放显示暂停键，暂停显示播放键
              this.showCenterToast(msg === playText ? ICON_PAUSE : ICON_PLAY, "", true);
              return;
            }
            if (seekPattern.test(msg)) {
              noticeDescriptor.set.call(notice, "");
              this.showCenterToast(ICON_SEEK, msg);
              return;
            }
          }
          noticeDescriptor.set.call(notice, msg);
        },
      });
      
      // 静音切换本身不产生 notice，单独监听
      art.on("muted", () => this.showVolumeToast());
    },
    
    // iconOnly 为 true 时只显示图标、不显示背景（用于播放/暂停提示）
    showCenterToast(icon, text, iconOnly = false) {
      if (!this.centerToastEl) return;
      this.centerToastIconEl.innerHTML = icon;
      this.centerToastTextEl.textContent = text;
      this.centerToastTextEl.style.display = iconOnly ? "none" : "";
      this.centerToastInnerEl.classList.toggle("art-center-toast-icon-only", iconOnly);
      this.centerToastEl.classList.add("art-center-toast-show");
      clearTimeout(this.centerToastTimer);
      this.centerToastTimer = setTimeout(() => {
        this.centerToastTimer = null;
        if (this.centerToastEl) this.centerToastEl.classList.remove("art-center-toast-show");
      }, CENTER_TOAST_HIDE_TIME);
    },
    
    showVolumeToast() {
      if (!this.instance) return;
      const muted = this.instance.muted || this.instance.volume === 0;
      const text = muted
        ? this.instance.i18n.get("Mute")
        : `${Math.round(this.instance.volume * 100)}%`;
      this.showCenterToast(muted ? ICON_VOLUME_MUTE : ICON_VOLUME, text);
    },
    
    unbindCenterToast() {
      clearTimeout(this.centerToastTimer);
      this.centerToastTimer = null;
      if (this.centerToastEl && this.centerToastEl.parentNode) {
        this.centerToastEl.parentNode.removeChild(this.centerToastEl);
      }
      this.centerToastEl = null;
      this.centerToastIconEl = null;
      this.centerToastTextEl = null;
      this.centerToastInnerEl = null;
    },
    
    // 鼠标滚轮在播放器上滚动时调整音量；设置面板等可滚动区域不拦截
    bindWheelVolume() {
      if (!this.instance) return;
      const art = this.instance;
      const { $player } = art.template;
      this.wheelVolumeHandler = (event) => {
        if (event.deltaY === 0) return;
        if (event.target.closest?.(".art-settings, .art-contextmenus, .art-selector-list, .art-volume-panel")) return;
        event.preventDefault();
        if (art.muted) art.muted = false;
        const step = event.deltaY < 0 ? Artplayer.VOLUME_STEP : -Artplayer.VOLUME_STEP;
        const volume = Math.min(1, Math.max(0, art.volume + step));
        if (volume !== art.volume) art.volume = volume;
      };
      $player.addEventListener("wheel", this.wheelVolumeHandler, { passive: false });
    },
    
    unbindWheelVolume() {
      if (this.instance && this.wheelVolumeHandler) {
        this.instance.template.$player.removeEventListener("wheel", this.wheelVolumeHandler);
      }
      this.wheelVolumeHandler = null;
    },
    
    // 电脑端：接管 →（右方向键）—— 松开时若不足 0.5s 视为短按（快进 5s），达到 0.5s 则进入 3 倍速、
    // 松开还原。走 art.hotkey 的 remove/add，可复用 Artplayer 的焦点、输入框判断和 preventDefault；
    // 按住时的按键重复（event.repeat）直接忽略，避免连发。
    bindKeyFastForward() {
      if (this.isMobile || !this.instance) return;
      const art = this.instance;
      for (const handler of [...(art.hotkey.keys.ArrowRight || [])]) {
        art.hotkey.remove("ArrowRight", handler);
      }
      art.hotkey.add("ArrowRight", (event) => {
        if (event.repeat) return;
        this.keyFastForwardTimer = setTimeout(() => {
          // 到 0.5s 还没松开：进入倍速（keyFastForwardTimer 置空用于区分长按与短按）
          this.keyFastForwardTimer = null;
          this.keyFastForwardRate = art.playbackRate;
          art.playbackRate = Artplayer.FAST_FORWARD_VALUE;
        }, KEY_LONG_PRESS_TIME);
      });
      // keyup 不在 Artplayer 的事件里，松开时自己收尾
      this.keyFastForwardKeyUp = (event) => {
        if (event.code === "ArrowRight") this.endKeyFastForward();
      };
      document.addEventListener("keyup", this.keyFastForwardKeyUp, true);
    },
    
    // 松开 →：不足 0.5s 按短按处理（此时才快进），达到 0.5s 则只把倍速还原；
    // seek 为 false 时用于解绑/销毁，只清理状态不触发快进
    endKeyFastForward(seek = true) {
      if (this.keyFastForwardTimer) {
        clearTimeout(this.keyFastForwardTimer);
        this.keyFastForwardTimer = null;
        if (seek && this.instance) this.instance.forward = Artplayer.SEEK_STEP;
        return;
      }
      if (this.keyFastForwardRate !== null) {
        if (this.instance) this.instance.playbackRate = this.keyFastForwardRate;
        this.keyFastForwardRate = null;
      }
    },
    
    // 解绑电脑端长按快进的键盘监听
    unbindKeyFastForward() {
      if (this.keyFastForwardKeyUp) {
        document.removeEventListener("keyup", this.keyFastForwardKeyUp, true);
        this.keyFastForwardKeyUp = null;
      }
      this.endKeyFastForward(false);
    },
    
    destroyPlayer() {
      // 销毁前记录最终播放进度
      this.reportHistory();
      this.resetJassub();
      this.unbindKeyFastForward();
      this.unbindControlAutoHide();
      this.unbindCenterToast();
      this.unbindWheelVolume();
      
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
      // 手势守卫绑在播放器根节点上，随播放器 DOM 一起销毁，这里只清掉引用
      this.gestureStart = null;
      this.gestureStartPoint = null;
      this.gestureGuard = null;
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
    
    // 字幕相关设置项的显示规则：当前视频有字幕才显示「字幕」开关，
    // 字幕显示时才显示「字幕字号」与「字幕偏移」
    syncSubtitleSettings() {
      if (!this.instance) return;
      this.syncSetting(SUBTITLE_SWITCH_NAME, this.hasSubtitle, () =>
        this.buildSubtitleSwitchSetting()
      );
      this.syncSetting(
        SUBTITLE_FONT_SIZE_NAME,
        this.hasSubtitle && this.subtitleVisible,
        () => this.buildSubtitleFontSizeSetting()
      );
      this.syncSetting(
        SUBTITLE_OFFSET_NAME,
        this.hasSubtitle && this.subtitleVisible,
        () => this.buildSubtitleOffsetSetting()
      );
    },
    
    // 让设置项按需存在：需要且没有就新建加入（追加在面板末尾），不需要就移出面板。
    // Artplayer 没有隐藏设置项的接口，只能增删；每次重建对象，避免把 Artplayer 的设置项存进响应式数据
    syncSetting(name, visible, build) {
      const art = this.instance;
      const exists = !!art.setting.find(name);
      if (visible === exists) return;
      if (exists) {
        art.setting.remove(name);
      } else {
        art.setting.add(build());
      }
    },
    
    // 字幕开关设置项
    buildSubtitleSwitchSetting() {
      return {
        name: SUBTITLE_SWITCH_NAME,
        html: this.translate("字幕"),
        tooltip: this.subtitleVisible ? this.translate("显示") : this.translate("隐藏"),
        icon: '<img width="22" heigth="22" src="/img/subtitle.svg">',
        switch: this.subtitleVisible,
        onSwitch: this.subtitleChange,
      };
    },
    
    // 字幕字号设置项（只保存在浏览器，不参与后端同步）
    buildSubtitleFontSizeSetting() {
      return {
        name: SUBTITLE_FONT_SIZE_NAME,
        html: this.translate("字幕字号"),
        tooltip: `${this.subtitleFontSize}px`,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48"><path fill="#ffffff" d="M9 40 21 10h6l12 30h-6.2l-3-8H18.2l-3 8zm10.8-13h9.4L24.5 13z"/><path fill="#ffffff" d="M32 32h6v8h-6z"/></svg>',
        range: [this.subtitleFontSize, ...SUBTITLE_FONT_SIZE_RANGE.slice(1)],
        onChange: (item) => {
          this.applySubtitleFontSize(item.range[0]);
          return `${item.range[0]}px`;
        },
      };
    },

    // 读取浏览器里保存的字幕字号
    getStoredSubtitleFontSize() {
      const saved = Number(localStorage.getItem(SUBTITLE_FONT_SIZE_KEY));
      if (Number.isFinite(saved) && saved > 0) {
        return Math.min(
          Math.max(Math.round(saved), SUBTITLE_FONT_SIZE_RANGE[1]),
          SUBTITLE_FONT_SIZE_RANGE[2]
        );
      }
      return DEFAULT_SUBTITLE_FONT_SIZE;
    },

    // 应用字幕字号：内置字幕写 CSS 变量，ASS 需要按比例改写样式后重建轨道。
    // persist 为 false 时只应用不写浏览器（初始化时使用）
    applySubtitleFontSize(size, persist = true) {
      const value = Math.min(
        Math.max(Math.round(Number(size) || DEFAULT_SUBTITLE_FONT_SIZE), SUBTITLE_FONT_SIZE_RANGE[1]),
        SUBTITLE_FONT_SIZE_RANGE[2]
      );
      this.subtitleFontSize = value;
      if (persist) {
        localStorage.setItem(SUBTITLE_FONT_SIZE_KEY, String(value));
      }
      if (this.instance) {
        this.instance.cssVar("--art-subtitle-font-size", `${value}px`);
      }
      this.scheduleAssFontScale();
    },

    // 拖动滑块时不用每一帧都重建 ASS 轨道，停一下再重绘
    scheduleAssFontScale() {
      if (!this.jassub || !this.assSource) return;
      clearTimeout(this.assScaleTimer);
      this.assScaleTimer = setTimeout(() => {
        this.assScaleTimer = null;
        this.applyAssFontScale();
      }, 150);
    },

    // 用缓存的 ASS 原文按当前字号重建轨道（比例以默认字号为 1 倍）
    applyAssFontScale() {
      const jassub = this.jassub;
      if (!jassub || !this.assSource) return;
      const content = scaleAssFontSize(
        this.assSource,
        this.subtitleFontSize / DEFAULT_SUBTITLE_FONT_SIZE
      );
      // 重建轨道后重新套用字幕偏移
      jassub.timeOffset = this.subtitleOffset;
      Promise.resolve(jassub.ready)
        .then(() => jassub.renderer.setTrack(content))
        .then(() => jassub.resize(true))
        .catch((error) => {
          console.error("[jassub] 更新字幕字号失败:", error);
        });
    },
    
    // 字幕偏移设置项：Artplayer 内置项固定 ±10s，这里自己建一个 ±30s 的
    buildSubtitleOffsetSetting() {
      return {
        name: SUBTITLE_OFFSET_NAME,
        html: this.translate("字幕偏移"),
        tooltip: `${this.subtitleOffset}s`,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48"><path fill="#ffffff" fill-rule="evenodd" d="M24 6a18 18 0 1 1 0 36 18 18 0 0 1 0-36zM24 12a12 12 0 1 0 0 24 12 12 0 0 0 0-24z"/><path fill="#ffffff" d="M22 14h4v10h7v4h-11z"/></svg>',
        range: [this.subtitleOffset, ...SUBTITLE_OFFSET_RANGE.slice(1)],
        onChange: (item) => {
          this.applySubtitleOffset(item.range[0]);
          return `${item.range[0]}s`;
        },
      };
    },
    
    // 应用字幕偏移（秒）。Artplayer 的 subtitleOffset setter 把值夹在 ±10s，所以这里自己实现：
    // 内置轨道（srt/vtt）直接重算每条 cue 的时间，ass 交给 jassub（它每帧按 mediaTime + timeOffset 渲染）
    applySubtitleOffset(value, notify = true) {
      this.subtitleOffset = value;
      const art = this.instance;
      if (!art) return;
      const track = art.template.$track;
      const cues = art.subtitle ? art.subtitle.cues : [];
      if (track && cues.length) {
        track.offset = value;
        for (const cue of cues) {
          cue.originalStartTime = cue.originalStartTime ?? cue.startTime;
          cue.originalEndTime = cue.originalEndTime ?? cue.endTime;
          cue.startTime = Math.min(Math.max(cue.originalStartTime + value, 0), art.duration);
          cue.endTime = Math.min(Math.max(cue.originalEndTime + value, 0), art.duration);
        }
        art.subtitle.update();
      }
      if (this.jassub) {
        this.jassub.timeOffset = value;
        // 暂停时不会自动出帧，手动重绘一次让偏移立刻可见
        Promise.resolve(this.jassub.ready)
          .then(() => this.jassub.resize(true))
          .catch(() => {});
      }
      if (notify) art.notice.show = `${this.translate("字幕偏移")}: ${value}s`;
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
          // 用 CSS 变量承载字号，播放器设置里的「字幕字号」改的是同一个变量
          "font-size": "var(--art-subtitle-font-size)",
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
      // 切到内置字幕 / 无字幕时释放 ASS 轨道和缓存的原文
      this.assSource = "";
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
      // 加载失败时播放器内部已弹出提示，这里仅避免未处理的 Promise 拒绝；
      // 换轨道后 cue 时间回到原生值，加载完再套用当前的字幕偏移
      this.instance.subtitle
        .switch(url, option)
        .then(() => {
          if (this.subtitleOffset) this.applySubtitleOffset(this.subtitleOffset, false);
        })
        .catch(() => {});
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
        
        // 内容复核：接口可能按扩展名把非 ASS 的文件标成 ass（发布组把 SRT 存成 .ass 很常见），
        // 这种文本交给 libass 会直接解析失败并把渲染器搞坏，这里改回内置渲染
        const contentType = this.detectSubtitleType(content);
        if (contentType !== "ass") {
          console.warn(`[jassub] 该字幕内容实际是 ${contentType}，改走内置渲染:`, item.name);
          this.assSource = "";
          this.releaseJassub();
          this.applyBuiltinSubtitle({ ...item, type: contentType }, notify);
          return;
        }
        
        // 缓存原文：调整字幕字号时据此按比例重建轨道
        this.assSource = content;
        const scaledContent = scaleAssFontSize(
          content,
          this.subtitleFontSize / DEFAULT_SUBTITLE_FONT_SIZE
        );
        
        // 关闭内置字幕轨道，避免两套渲染同时显示
        this.applyBuiltinSubtitle(null);
        
        if (this.jassub) {
          // 复用已有 jassub 实例，仅替换字幕轨道
          await this.jassub.ready;
          await this.jassub.renderer.setTrack(scaledContent);
          await this.jassub.resize(true);
        } else {
          this.jassub = markRaw(
            artplayerPluginJassub({
              subContent: scaledContent,
              fonts: this.externalFonts,
            })(this.instance).instance
          );
        }
        // 换轨道后套用当前的字幕偏移（jassub 每帧按 mediaTime + timeOffset 渲染）
        this.jassub.timeOffset = this.subtitleOffset;
        this.setJassubVisible(true);
        
        if (notify) {
          this.instance.notice.show = `${this.instance.i18n.get("Switch Subtitle")}: ${item.name}`;
        }
      } catch (error) {
        console.error("[jassub] 渲染 ASS 字幕失败:", error);
        // 销毁失败的实例：否则它会被后续 ass 字幕一直复用，一次失败拖垮全部
        this.resetJassub();
        ElMessage.error(this.translate("获取字幕内容失败"));
      }
    },
    
    // 按内容判断字幕格式（ass / srt / vtt）
    detectSubtitleType(content) {
      const head = content.slice(0, 4096).replace(/^\uFEFF/, "").trimStart();
      if (head.startsWith("WEBVTT")) return "vtt";
      if (/\[Script Info\]|\[Events\]/i.test(head)) return "ass";
      return "srt";
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
      clearTimeout(this.assScaleTimer);
      this.assScaleTimer = null;
      this.assSource = "";
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

<style>
/* 内置字幕默认字体：HarmonyOS Sans SC 完整版（与 ASS/SSA 的 jassub 渲染共用同一份字体文件，
   解决默认字体缺字问题）。优先用本机已安装的同名字体，没有才下载 webfont */
@font-face {
  font-family: "HarmonyOS Sans SC";
  src:
    local("HarmonyOS Sans SC"),
    local("HarmonyOS_Sans_SC"),
    url("/fonts/harmonyos-sans-sc-regular.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

/* 视频按原比例居中显示：Artplayer 默认 object-fit: fill 会把视频拉伸变形；
   配合上面的 autoSize: false，播放器高度固定为容器高度（16:9），宽幅片源上下留黑边。
   注意：网页全屏时 Artplayer 会把播放器移到 body 下，scoped 样式会失效，因此这里用全局样式 */
.art-video-player .art-video {
  object-fit: contain;
}

.art-video-player .art-subtitle {
  font-family:
    "HarmonyOS Sans SC",
    "Microsoft YaHei",
    "PingFang SC",
    "Noto Sans SC",
    sans-serif;
}

/* 弹幕热力图：插件把热力图（高度 100px）的底部贴在进度条容器上沿，
   而容器有 --art-progress-top-gap（默认 10px）的顶部内边距，导致两者之间出现 10px 空隙。
   这里把热力图下移该内边距的距离，使其底部与进度条贴合 */
.art-video-player .art-bottom .art-progress .art-control-heatmap {
  top: calc(var(--art-progress-top-gap) - 100px) !important;
}

/* 音量调整 / 进度拖动提示：视频中心显示，半透明圆角，类似 B 站 */
.art-video-player .art-center-toast {
  position: absolute;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease, visibility 0.15s ease;
}

.art-video-player .art-center-toast-show {
  opacity: 1;
  visibility: visible;
}

.art-video-player .art-center-toast-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 96px;
  padding: 12px 20px;
  border-radius: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* 播放/暂停提示：只显示图标，不显示背景 */
.art-video-player .art-center-toast-inner.art-center-toast-icon-only {
  justify-content: center;
  width: auto;
  height: auto;
  min-width: 0;
  padding: 0;
  border-radius: 0;
  background-color: transparent;
  backdrop-filter: none;
}

.art-video-player .art-center-toast-icon-only .art-center-toast-icon {
  width: 28px;
  height: 28px;
}

.art-video-player .art-center-toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
}

.art-video-player .art-center-toast-icon svg {
  width: 100%;
  height: 100%;
}
</style>
