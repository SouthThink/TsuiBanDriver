import request from "@/utils/request";

const BASE_URL = '/yzr';

export function searchAllInfo(data) {
  return request(BASE_URL,{
    url: "/searchAllInfo",
    method: "post",
    data,
  });
}

export function addRssLink(data) {
  return request(BASE_URL,{
    url: "/addRssLink",
    method: "post",
    data,
  });
}

export function getSubgroupInfo(data) {
  return request(BASE_URL,{
    url: "/getSubgroupInfo",
    method: "post",
    data,
  });
}

export function getRssItems(params) {
  return request(BASE_URL,{
    url: "/rssItems",
    method: "get",
    params,
  });
}

export function getDownloadList(params) {
  return request(BASE_URL,{
    url: "/downloadList",
    method: "get",
    params,
  });
}

export function removeItem(data) {
  return request(BASE_URL,{
    url: "/removeItem",
    method: "post",
    data,
  });
}

export function refreshItem(data) {
  return request(BASE_URL,{
    url: "/refreshItem",
    method: "post",
    data,
  });
}

export function moveItem(data) {
  return request(BASE_URL,{
    url: "/moveItem",
    method: "post",
    data,
  });
}

export function markAsRead(data) {
  return request(BASE_URL,{
    url: "/markAsRead",
    method: "post",
    data,
  });
}

export function addFeed(data) {
  return request(BASE_URL,{
    url: "/addFeed",
    method: "post",
    data,
  });
}

export function addTorrents(data) {
  return request(BASE_URL,{
    url: "/addTorrents",
    method: "post",
    data,
  });
}

export function deleteTorrents(data) {
  return request(BASE_URL,{
    url: "/deleteTorrents",
    method: "post",
    data,
  });
}

// 种子动作：暂停/启动/强制启动/强制校验/重新汇报
export function torrentsAction(data) {
  return request(BASE_URL,{
    url: "/torrentsAction",
    method: "post",
    data,
  });
}

export function getRssRules(params) {
  return request(BASE_URL,{
    url: "/rssRules",
    method: "get",
    params,
  });
}

export function setRule(data) {
  return request(BASE_URL,{
    url: "/setRule",
    method: "post",
    data:data,
  });
}

export function matchingArticles(params) {
  return request(BASE_URL,{
    url: "/matchingArticles",
    method: "get",
    params,
  });
}

export function removeRule(data) {
  return request(BASE_URL,{
    url: "/removeRule",
    method: "post",
    data,
  });
}

export function setLocation(data) {
  return request(BASE_URL,{
    url: "/setLocation",
    method: "post",
    data,
  });
}

export function matchRule(data) {
  return request(BASE_URL,{
      method: "post",
      url:"/matchRule",
      data,
  });
}

export function getRuleList(params) {
  return request(BASE_URL,{
    url: "/getRuleList",
    method: "get",
    params,
  });
}

export function addEditRule(data) {
  return request(BASE_URL,{
      method: "post",
      url:"/addEditRule",
      data,
  });
}

export function getRuleInfoList(params) {
  return request(BASE_URL,{
    url: "/getRuleInfoList",
    method: "get",
    params,
  });
}

export function deleteRule(data) {
  return request(BASE_URL,{
      method: "post",
      url:"/deleteRule",
      data,
  });
}

export function allVersion(params) {
  return request(BASE_URL,{
    url: "/allVersion",
    method: "get",
    params,
  });
}

export function aiChat(data) {
  return request(BASE_URL,{
    url: "/aiChat",
    method: "post",
    data,
  });
}

export function getAiConversations(params) {
  return request(BASE_URL,{
    url: "/aiConversations",
    method: "get",
    params,
  });
}

export function getAiConversation(params) {
  return request(BASE_URL,{
    url: "/aiConversation",
    method: "get",
    params,
  });
}

export function newAiConversation(data) {
  return request(BASE_URL,{
    url: "/newAiConversation",
    method: "post",
    data,
  });
}

export function deleteAiConversation(data) {
  return request(BASE_URL,{
    url: "/deleteAiConversation",
    method: "post",
    data,
  });
}

export function renameAiConversation(data) {
  return request(BASE_URL,{
    url: "/renameAiConversation",
    method: "post",
    data,
  });
}

export function getAiChatConfig() {
  return request(BASE_URL,{
    url: "/aiChatConfig",
    method: "get",
  });
}

export function saveAiChatConfig(data) {
  return request(BASE_URL,{
    method: "post",
    url: "/saveAiChatConfig",
    data,
  });
}

export function getSearchConfig(params) {
  return request(BASE_URL,{
    url: "/getSearchConfig",
    method: "get",
    params,
  });
}

export function saveSearchConfigApi(data) {
  return request(BASE_URL,{
    method: "post",
    url:"/saveSearchConfig",
    data,
  });
}

export function testProxy(data) {
  return request(BASE_URL,{
    method: "post",
    url:"/testProxy",
    data,
  });
}

export function getUrlConfig() {
  return request(BASE_URL,{
    method: "get",
    url:"/getUrlConfig",
  });
}

export function saveUrlConfig(data) {
  return request(BASE_URL,{
    method: "post",
    url:"/saveUrlConfig",
    data,
  });
}

// 用户数据：观看历史与个性化设置（按用户名）；高频调用加 silent，失败不弹提示
export function getUserData(params) {
  return request(BASE_URL,{
    url: "/getUserData",
    method: "get",
    params,
    silent: true,
  });
}

export function getHistory(params) {
  return request(BASE_URL,{
    url: "/getHistory",
    method: "get",
    params,
    silent: true,
  });
}

export function saveHistory(data) {
  return request(BASE_URL,{
    url: "/saveHistory",
    method: "post",
    data,
    silent: true,
  });
}

export function saveUserSettings(data) {
  return request(BASE_URL,{
    url: "/saveUserSettings",
    method: "post",
    data,
    silent: true,
  });
}

export function getBackendStatus() {
  return request(BASE_URL,{
    url: "/getBackendStatus",
    method: "get",
  });
}

export function getScanConfig() {
  return request(BASE_URL,{
    url: "/getScanConfig",
    method: "get",
  });
}

export function saveScanConfig(data) {
  return request(BASE_URL,{
    url: "/saveScanConfig",
    method: "post",
    data,
  });
}

// 立刻触发一次媒体库扫描，mode 为 "fast"（快速）或 "full"（完全）
export function scanLibrary(mode = "full") {
  return request(BASE_URL,{
    url: "/scanLibrary",
    method: "post",
    data: { mode },
  });
}

export function getBackendVersions(params) {
  return request(BASE_URL,{
    url: "/getBackendVersions",
    method: "get",
    params,
  });
}
export function testBackendConnection(data) {
  return request(BASE_URL,{
    url: "/testBackendConnection",
    method: "post",
    data,
  });
}

export function bangumiProxy(subpath, config = {}) {
  const safePath = subpath.replace(/^\/+/, "");
  return request(BASE_URL,{
    url: `/proxy/${safePath}`,
    method: (config.method || "get").toLowerCase(),
    params: config.params,
    data: config.data,
  });
}

export function searchBangumi(params) {
  return request(BASE_URL,{
    url: "/bangumi/search",
    method: "get",
    params,
  });
}

export function bangumiList(params) {
  return request(BASE_URL,{
    url: "/bangumiList",
    method: "get",
    params,
  });
}

// 番剧详情页：animeId（本地番剧）与 bgmId（时间表）二选一
export function bangumiDetail(params) {
  return request(BASE_URL,{
    url: "/bangumiDetail",
    method: "get",
    params,
  });
}

// 手动重新识别：本地番剧库中已识别的作品
export function localBangumi(params) {
  return request(BASE_URL,{
    url: "/localBangumi",
    method: "get",
    params,
  });
}

// 手动重新识别：在弹弹play 上搜索番剧
export function searchAnime(params) {
  return request(BASE_URL,{
    url: "/searchAnime",
    method: "get",
    params,
  });
}

// 手动重新识别：某个作品的剧集列表
export function animeEpisodes(params) {
  return request(BASE_URL,{
    url: "/animeEpisodes",
    method: "get",
    params,
  });
}

// 手动重新识别：把指定文件改判到某个作品与剧集
export function rematchFile(data) {
  return request(BASE_URL,{
    url: "/rematchFile",
    method: "post",
    data,
  });
}

// 字幕组随片外挂字体（视频同目录 / fonts 子目录），供前端 ASS 渲染器加载
export function getFontList(params) {
  return request(BASE_URL,{
    url: "/getFontList",
    method: "get",
    params,
  });
}

export function getAuthStatus() {
  return request(BASE_URL,{
    url: "/authStatus",
    method: "get",
  });
}

export function authLogin(data) {
  return request(BASE_URL,{
    url: "/authLogin",
    method: "post",
    data,
  });
}

export function getAuthConfig() {
  return request(BASE_URL,{
    url: "/getAuthConfig",
    method: "get",
  });
}

export function saveAuthConfig(data) {
  return request(BASE_URL,{
    url: "/saveAuthConfig",
    method: "post",
    data,
  });
}
