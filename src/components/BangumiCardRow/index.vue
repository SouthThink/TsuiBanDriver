<template>
  <div class="bangumi-item">
    <div class="bangumi-item-cover">
      <el-image :src="imgUrl" fit="cover" class="bangumi-item-img"> </el-image>
      <div class="bangumi-item-score" v-if="rating !== 0">
        <el-icon><StarFilled /></el-icon>
        <el-text style="color: white">{{ rating }}</el-text>
      </div>
      <div class="bangumi-item-watched" v-if="episodeWatched !== 0">
        <el-icon><Clock /></el-icon>
        <el-text
          truncated
          style="color: white"
          v-if="episodeWatched != episodeTotal"
        >
          {{ translate("已看") + episodeWatched + translate("话") }}
        </el-text>
        <el-text style="color: white" v-else>{{
          translate("已看到最新")
        }}</el-text>
      </div>
    </div>
    <div class="bangumi-item-info">
      <el-text line-clamp="2" class="bangumi-item-title">
        {{ title }}
      </el-text>
    </div>
  </div>
</template>
<script setup>
import { onMounted } from "vue";
import { translate } from "@/utils/translate";

const props = defineProps({
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
});

onMounted(() => {
  // console.log(props.rating);
});
</script>
<style src="./index.css"></style>
