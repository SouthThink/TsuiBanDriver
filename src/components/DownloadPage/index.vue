<template>
    <div>
      <el-button type="primary" @click="getDownloadListBtn">
        下载列表获取
      </el-button>
    </div>
</template>
<script setup>
import { getDownloadList } from "@/api/download";

const getDownloadListBtn = async () => {
  let torrents = [];
  const res = await getDownloadList();
  let torrent = res.data.torrents;
  console.log(torrent);
  Object.keys(torrent).forEach((key) => {
    torrents.push(torrent[key]);
  });
  console.log(torrents);
};
</script>
