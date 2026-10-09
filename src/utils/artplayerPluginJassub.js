import JASSUB from "jassub";
// 显式引入 worker / wasm 资源，交给 Vite 产出正确的资源地址，
// 避免依赖 jassub 内部基于 import.meta.url 的默认解析（预打包后会失效）。
// worker 使用自定义入口（去掉 Windows 上会导致画布变黑的 desynchronized，见该文件注释）
import workerUrl from "@/utils/jassubWorker.js?worker&url";
import wasmUrl from "jassub/dist/wasm/jassub-worker.wasm?url";
import modernWasmUrl from "jassub/dist/wasm/jassub-worker-modern.wasm?url";

// ASS 渲染层在播放器内的层级：位于视频之上、播放控件之下
const CANVAS_Z_INDEX = 20;

// 内置兜底中文字体（public/fonts 下，Noto Sans SC 400 子集）。
// 注意：libass 是按“字体文件内部的 family 名”匹配字体的，该文件的 family 名是
// "Noto Sans SC Thin"。libass 的默认字体（defaultFont）必须能在 availableFonts 里
// 解析到，否则它选不到任何字体、会直接跳过整条字幕事件（表现为画布一片空白）。
const DEFAULT_FONT_FAMILY = "Noto Sans SC Thin";
const DEFAULT_FONT_URL = "/fonts/noto-sans-sc-400.woff2";

/**
 * ArtPlayer 的 ASS/SSA 字幕插件（基于 jassub/libass 渲染）
 *
 * 对齐 artplayer.org 的 artplayer-plugin-jassub 示例，但适配项目已安装的 jassub v2：
 * v2 移除了 _canvasParent，canvas 直接插在 video 之后，故层级改在 canvas 上设置。
 * 由调用方通过 subContent 传入后端 /yzr/getSubtitle 返回的原始 ass 文本，
 * 避免 Artplayer 内置字幕把 ass 转成 vtt 而丢失样式、定位与特效。
 *
 * 字体加载顺序：字幕组随片提供的外挂字体（option.fonts）优先，其后追加内置中文字体，
 * 并把 defaultFont 指向它；样式里匹配不到的字体族会回退到默认字体。
 *
 * @param {object} option jassub 初始化参数（subUrl / subContent / fonts 等）
 * @returns {(art: import('artplayer').default) => { name: string, instance: JASSUB }}
 */
export default function artplayerPluginJassub(option = {}) {
  const { fonts: externalFonts = [], ...rest } = option;
  return (art) => {
    const instance = new JASSUB({
      video: art.video,
      workerUrl,
      wasmUrl,
      modernWasmUrl,
      availableFonts: { [DEFAULT_FONT_FAMILY.toLowerCase()]: DEFAULT_FONT_URL },
      defaultFont: DEFAULT_FONT_FAMILY,
      ...rest,
      // 外挂字体在前、内置兜底字体在后（直接全部预载，避免首帧无字体）
      fonts: [...externalFonts, DEFAULT_FONT_URL],
    });
    instance._canvas.style.zIndex = CANVAS_Z_INDEX;
    art.on("destroy", () => instance.destroy());
    return {
      name: "artplayerPluginJassub",
      instance,
    };
  };
}
