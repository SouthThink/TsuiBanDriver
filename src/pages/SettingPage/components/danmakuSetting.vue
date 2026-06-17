<template>
  <div class="setting-item">
    <!-- 设置会在第一次观看视频后生成 -->
    <el-text>{{translate("弹幕开关")}}</el-text>
    <el-switch v-model="visible" @change="saveSetting('visible')" />
  </div>
  <div class="setting-item">
    <!-- 设置会在第一次观看视频后生成 -->
    <el-text>{{translate("显示的弹幕类型")}}</el-text>
    <el-checkbox-group v-model="modes" @change="saveSetting('modes')" size="small">
      <el-checkbox-button :value="0">{{translate("滚动")}}</el-checkbox-button>
      <el-checkbox-button :value="1">{{translate("顶部")}}</el-checkbox-button>
      <el-checkbox-button :value="2">{{translate("底部")}}</el-checkbox-button>
    </el-checkbox-group>
  </div>
  <div class="setting-item">
    <!-- 设置会在第一次观看视频后生成 -->
    <el-text>{{translate("同步视频速度")}}</el-text>
    <el-switch
      v-model="synchronousPlayback"
      @change="saveSetting('synchronousPlayback')"
    />
  </div>

  <div class="setting-item">
    <el-text>{{translate("防弹幕重叠")}}</el-text>
    <el-switch v-model="antiOverlap" @change="saveSetting('antiOverlap')" />
  </div>
  <div class="setting-item">
    <el-text>{{translate("不透明度")}}</el-text>
    <el-slider
      v-model="opacity"
      :max="1"
      :step="0.01"
      show-inputze="small"
      class="danmaku-setting"
      @change="saveSetting('opacity')"
    />
  </div>
  <div class="setting-item">
    <el-text>{{translate("显示区域")}}</el-text>
    <el-slider
      v-model="margin"
      size="small"
      :min="25"
      :step="25"
      class="danmaku-setting"
      :marks="marginMarks"
      :show-tooltip="false"
      @change="saveSetting('margin')"
    />
  </div>
  <div class="setting-item">
    <el-text>{{translate("弹幕字号")}}</el-text>
    <el-slider
      v-model="fontSize"
      :min="12"
      :max="120"
      size="small"
      class="danmaku-setting"
      @change="saveSetting('fontSize')"
    />
  </div>
  <div class="setting-item">
    <el-text>{{translate("弹幕速度")}}</el-text>
    <el-slider
      v-model="speed"
      size="small"
      :step="25"
      class="danmaku-setting"
      :marks="speedMarks"
      :show-tooltip="false"
      @change="saveSetting('speed')"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { translate } from "@/utils/translate";
interface Mark {
  style: CSSProperties;
  label: string;
}
type Marks = Record<number, Mark | string>;
var danmuku = JSON.parse(localStorage.getItem("danmuku"));
if (!danmuku) {
  danmuku = {
    visible: true,
    modes: [0, 1, 2],
    synchronousPlayback: true,
    antiOverlap: true,
    opacity: 1,
    margin: [0, 75],
    fontSize: 25,
    speed: 10,
  };
  localStorage.setItem("danmuku", JSON.stringify(danmuku));
}
const visible = ref(danmuku.visible);
const modes = ref(danmuku.modes);
const synchronousPlayback = ref(danmuku.synchronousPlayback);
const antiOverlap = ref(danmuku.antiOverlap);
const opacity = ref(danmuku.opacity);
const marginMap = {
  25: "75%",
  50: "50%",
  75: "25%",
  100: 10,
  "75%": 25,
  "50%": 50,
  "25%": 75,
  "10": 100,
};
const margin = ref(marginMap[danmuku.margin[1]]);
const marginMarks = reactive<Marks>({
  25: "1/4",
  50: translate("半屏"),
  75: "3/4",
  100: translate("全屏"),
});
const fontSize = ref(danmuku.fontSize);
const speedMap = {
  10: 0,
  7.5: 25,
  5: 50,
  2.5: 75,
  1: 100,
};
const speedMapReverse = {
  0: 10,
  25: 7.5,
  50: 5,
  75: 2.5,
  100: 1,
};
const speedMarks = reactive<Marks>({
  0: translate("极慢"),
  25: "",
  50: translate("适中"),
  75: "",
  100: translate("极快"),
});
const speed = ref(speedMap[danmuku.speed]);

const saveSetting = (event) => {
//   console.log(event, eval(event)._value);
  if (event == "margin") {
    danmuku.margin[1] = marginMap[margin.value];
  } else if (event == "speed") {
    danmuku.speed = speedMapReverse[speed.value];
  } else {
    danmuku[event] = eval(event)._value;
  };
  // console.log(danmuku);
  localStorage.setItem("danmuku", JSON.stringify(danmuku));
};
</script>
<style scoped>
.danmaku-setting {
  width: 200px;
}
</style>
