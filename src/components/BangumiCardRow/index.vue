<template>
  <div class="bangumi-item">
    <div class="bangumi-item-cover">
      <el-image :src="imgUrl" fit="cover" class="bangumi-item-img">
        <template #error>
          <div class="bangumi-item-cover-empty">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      <div class="bangumi-item-score" v-if="rating !== 0">
        <el-icon><StarFilled /></el-icon>
        <el-text>{{ rating }}</el-text>
      </div>
      <!-- 扫描发现新内容时提示，点开番剧后消失 -->
      <div class="bangumi-item-new" v-if="isNew">{{ translate("新") }}</div>
    </div>
    <div class="bangumi-item-info">
      <div class="bangumi-item-title">{{ title }}</div>
      <div class="bangumi-item-episode" v-if="episodeLatest > 0 || episodeWatched > 0">
        <span v-if="episodeLatest > 0">{{ translate("全") + episodeLatest + translate("话") }}</span>
        <span v-if="episodeWatched > 0">{{ translate("看到") + episodeWatched + translate("话") }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { translate } from "@/utils/translate";

defineProps({
  imgUrl: String,
  title: String,
  rating: {
    type: Number,
    default: 0,
  },
  episodeWatched: {
    type: Number,
    default: 0,
  },
  episodeTotal: {
    type: Number,
    default: 0,
  },
  // 本地已有文件对应的最新集号（第二行展示「全 N 话」），0 表示不显示
  episodeLatest: {
    type: Number,
    default: 0,
  },
  // 是否有扫描发现的新内容（未被用户读过的「新」标签）
  isNew: {
    type: Boolean,
    default: false,
  },
});
</script>
<style src="./index.css"></style>
