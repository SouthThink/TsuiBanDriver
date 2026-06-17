<template>
    <el-select
      v-model="lang"
      style="max-width: 60%; width: 240px"
      @change="changeLanguage"
    >
      <el-option
        v-for="item in langList"
        :key="item.name"
        :label="item.title"
        :value="item.name"
      />
    </el-select>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { translate } from '@/utils/translate'
const lang = ref('zh_CN')
if (localStorage.getItem('lang')) {
  lang.value = localStorage.getItem('lang');
}
const langList = [
  {
    name: 'zh_CN',
    title: '简体中文'
  },
  {
    name: 'zh_TW',
    title: '繁体中文'
  },
  {
    name: 'en_US',
    title: 'English'
  },
  {
    name: 'ja_JP',
    title: '日本語'
  },
]
const changeLanguage = (val: string) => {
    localStorage.setItem('lang', val)
    //刷新页面
    window.location.reload()
}
</script>