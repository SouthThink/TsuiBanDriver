<template>
  <div class="bangumi-item">
    <div class="bangumi-item-cover">
      <el-image
        :src="imgUrl"
        fit="cover"
        class="bangumi-item-img"
      >
      </el-image>
      <div class="bangumi-item-score" v-if="rating !== 0">
        <el-icon><StarFilled /></el-icon>
        <el-text style="color: white">{{ rating }}</el-text>
      </div>
      <div class="bangumi-item-watched" v-if="episodeWatched !== 0">
        <el-icon><Clock /></el-icon>
        <el-text
          style="color: white"
          v-if="episodeWatched != episodeTotal"
          >已看到第{{ episodeWatched }}话</el-text
        >
        <el-text style="color: white" v-else>已看到最新</el-text>
      </div>
    </div>
    <div class="bangumi-item-info">
      <el-text line-clamp="2" truncated class="bangumi-item-title">
        {{ title }}
      </el-text>
    </div>
  </div>
</template>
<script setup>
import {onMounted} from "vue";

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
  console.log(props.rating);
});

</script>
<style scoped>
.bangumi-item {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 10px;
}
.bangumi-item:hover {
  /* 放大且加阴影 */
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(70, 70, 70, 0.3);
}
.bangumi-item-cover {
  padding: 0px;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 5px;
  position: relative;
}
.bangumi-item-img {
  border-radius: 5px;
  width: 100%;
  height: 100%;
}
.bangumi-item-score {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.25rem;
  border-radius: 10px 0 0 0;
  display: flex;
  align-items: center;
  color: white;
}
.bangumi-item-watched {
  position: absolute;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.25rem;
  border-radius: 10px 0 0 0;
  display: flex;
  align-items: center;
  color: white;
}

.bangumi-item-info {
  margin: 0.25rem;
}
.bangumi-item-title {
  height: 50px;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: normal;
}
</style>
