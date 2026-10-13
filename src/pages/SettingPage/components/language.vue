<template>
  <div class="setting-item">
    <el-text>{{ translate("语言") }}</el-text>
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
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { translate } from '@/utils/translate'
import { pushUserSettings } from '@/utils/userSettings'
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
const changeLanguage = async (val: string) => {
    localStorage.setItem('lang', val)
    // 立刻同步到后端：节流上报会被下面的刷新打断，否则刷新后拉取旧设置会覆盖本次选择
    await pushUserSettings()
    //刷新页面
    window.location.reload()
}
</script>