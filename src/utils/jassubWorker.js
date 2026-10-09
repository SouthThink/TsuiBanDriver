// 自定义 jassub worker 入口。
//
// jassub 的渲染器创建上下文时硬编码了 `desynchronized: true`，该属性在 Windows
// Chrome/Edge 上会与硬件叠加（DirectComposition/MPO）冲突，使字幕画布被合成为
// 不透明黑块盖住视频（jassub issue #70）。这里在 jassub worker 初始化后、真正创建
// 上下文前，把该属性从上下文参数中移除（只牺牲低延迟合成，不影响渲染结果），
// 其余全部逻辑仍由 jassub 自身处理。
//
// 说明：ESM 的 import 会先于本模块主体执行，但 jassub worker 顶层只是定义类并 expose，
// 真正的 getContext 调用发生在收到消息之后，因此此处打补丁的时机是安全的。
const originalGetContext = OffscreenCanvas.prototype.getContext;
OffscreenCanvas.prototype.getContext = function (contextType, options) {
  if (options && options.desynchronized) {
    const { desynchronized, ...rest } = options;
    return originalGetContext.call(this, contextType, rest);
  }
  return originalGetContext.call(this, contextType, options);
};

import "jassub/dist/worker/worker.js";
