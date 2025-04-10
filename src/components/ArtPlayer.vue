<template>
  <div ref="artRef"></div>
</template>

<script>
import Artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import tw from "artplayer/dist/i18n/zh-tw.js";
import jp from "artplayer/dist/i18n/jp.js";
import { translate } from '@/utils/translate'


export default {
  data() {
    return {
      instance: null,
      lang: "zh-cn",
    };
  },
  watch: {
    videoId: {
      handler(newVal) {
        console.log("监听视频id", newVal);
        this.InitPlayer();
      },
      immediate: true,
    },
  },
  props: {
    videoId: {
      type: String,
      required: true,
    },
  },
  mounted() {
    // this.getSubtitle(videoId);
    // this.InitPlayer();
    this.getLang();
  },
  methods: {
    //初始化播放器
    translate,
    getLang() {
      if (localStorage.getItem("lang") === "zh-TW") {
        this.lang = "tw";
      } else if (localStorage.getItem("lang") === "en_US") {
        this.lang = "en";
      } else if (localStorage.getItem("lang") === "ja_JP") {
        this.lang = "jp";
      } else {
        this.lang = "zh-cn";
      }
      console.log("语言", this.lang);
    },
    InitPlayer() {
      console.log("初始化播放器");
      this.destroyPlayer();
      setTimeout(() => {
        this.instance = new Artplayer({
          // 视频流地址
          url: `/api/api/v1/stream/id/${this.videoId}`,
          // 视频封面地址
          poster: `/api/api/v1/image/id/${this.videoId}`,
          // 字幕
          subtitle: {
            url: `/yzr/getSubtitle?videoId=${this.videoId}`,
            type: "ass",
            encoding: "utf-8",
            escape: true,
            style: {
              // color: "#03A9F4",
              "font-size": "18px",
            },
          },
          i18n: {
            tw: tw,
            jp: jp,
          },
          lang: this.lang,
          //设置
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
          // 视频容器
          container: this.$refs.artRef,
          // 视频id
          id: this.videoId,
          // 音量
          volume: 0.5,
          // 是否是直播
          isLive: false,
          // 是否静音
          muted: false,
          // 是否自动播放
          autoplay: false,
          // 是否支持画中画
          pip: false,
          // 是否自动调整大小
          autoSize: true,
          // 是否自动最小化
          autoMini: false,
          // 是否截图
          screenshot: true,
          // 是否使用QQ
          qq: true,
          // 是否循环播放
          loop: false,
          // 是否翻转
          flip: true,
          // 是否播放速率
          playbackRate: true,
          // 是否保持宽高比
          aspectRatio: true,
          // 是否全屏
          fullscreen: true,
          // 是否全屏Web
          fullscreenWeb: true,
          // 是否字幕偏移
          subtitleOffset: true,
          // 是否迷你进度条
          miniProgressBar: false,
          // 是否互斥
          mutex: true,
          // 是否背景
          backdrop: true,
          // 是否内联播放
          playsInline: true,
          // 是否自动播放
          autoPlayback: true,
          // 是否AirPlay
          airplay: true,
          // 是否快进
          fastForward: true,
          // 是否自动方向
          autoOrientation: true,
          // 是否锁定
          lock: true,
          // 主题颜色
          theme: "#23ade5",
          plugins: [
            artplayerPluginDanmuku({
              ...JSON.parse(localStorage.getItem("danmuku") || "{}"),
              danmuku: `/api/api/v1/comment/id/${this.videoId}`,
              // speed: 10, // 弹幕持续时间，范围在[1 ~ 10]
              // margin: [10, "25%"], // 弹幕上下边距，支持像素数字和百分比
              // opacity: 1, // 弹幕透明度，范围在[0 ~ 1]
              // color: "#FFFFFF", // 默认弹幕颜色，可以被单独弹幕项覆盖
              // mode: 0, // 默认弹幕模式: 0: 滚动，1: 顶部，2: 底部
              // modes: [0, 1, 2], // 弹幕可见的模式
              // fontSize: 20, // 弹幕字体大小，支持像素数字和百分比
              // antiOverlap: true, // 弹幕是否防重叠
              // synchronousPlayback: false, // 是否同步播放速度
              mount: undefined, // 弹幕发射器挂载点, 默认为播放器控制栏中部
              heatmap: true, // 是否开启热力图
              width: 512, // 当播放器宽度小于此值时，弹幕发射器置于播放器底部
              points: [], // 热力图数据
              filter: (danmu) => danmu.text.length <= 100, // 弹幕载入前的过滤器
              beforeVisible: () => true, // 弹幕显示前的过滤器，返回 true 则可以发送
              // visible: true, // 弹幕层是否可见
              emitter: true, // 是否开启弹幕发射器
              maxLength: 200, // 弹幕输入框最大长度, 范围在[1 ~ 1000]
              lockTime: 5, // 输入框锁定时间，范围在[1 ~ 60]
              theme: "dark", // 弹幕主题，支持 dark 和 light，只在自定义挂载时生效
              OPACITY: {}, // 不透明度配置项
              FONT_SIZE: {}, // 弹幕字号配置项
              MARGIN: {}, // 显示区域配置项
              SPEED: {}, // 弹幕速度配置项
              COLOR: [], // 颜色列表配置项
              beforeEmit(danmu) {
                return new Promise((resolve) => {
                  console.log(danmu);
                  setTimeout(() => {
                    resolve(true);
                  }, 1000);
                });
              },
            }),
            // artplayerPluginLibass({
            //   // debug: true,
            //   workerUrl:
            //     "https://unpkg.com/libass-wasm@4.1.0/dist/js/subtitles-octopus-worker.js",
            //   // wasmUrl: 'https://unpkg.com/libass-wasm@4.1.0/dist/js/subtitles-octopus-worker.wasm',
            //   // fallbackFont: "/assets/misc/SourceHanSansCN-Bold.woff2",
            // }),
          ],
          type: "m3u8",
        });
        this.$nextTick(() => {
          this.$emit("get-instance", this.instance);
        });
        this.instance.on("artplayerPluginDanmuku:config", (option) => {
          // 排除不必要的选项，如mount
          const { mount, ...rest } = option;

          // 保存到localStorage
          localStorage.setItem("danmuku", JSON.stringify(rest));
          console.log("保存到localStorage", rest);
          // console.log("保存到localStorage", rest);
        });
      }, 500);
    },

    destroyPlayer() {
      if (this.instance && this.instance.destroy) {
        console.log("销毁播放器");
        this.instance.destroy();
      }
    },
    subtitleChange(item) {
      console.log("字幕", item.switch);
      item.tooltip = item.switch ? this.this.translate("隐藏") : this.translate("显示");
      this.instance.subtitle.show = !item.switch;
      return !item.switch;
    },
  },
  beforeUnmount() {
    this.destroyPlayer();
  },
};
</script>
