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

export function aiSubtitle(params) {
  return request(BASE_URL,{
    url: "/aiSubtitle",
    method: "get",
    params,
  });

}export function aiConfig(params) {
  return request(BASE_URL,{
    url: "/aiConfig",
    method: "get",
    params,
  });
}
export function addEditAiConfig(data) {
  return request(BASE_URL,{
      method: "post",
      url:"/addEditAiConfig",
      data,
  });
}

export function aiChat(data) {
  return request(BASE_URL,{
    url: "/aiChat",
    method: "post",
    data,
  });
}

export function deleteAiConfig(data) {
  return request(BASE_URL,{
      method: "post",
      url:"/deleteAiConfig",
      data,
  });
}

export function getSubtitleList(params) {
  return request(BASE_URL,{
    url: "/getSubtitleList",
    method: "get",
    params,
  });
}

export function setSubtitle(params) {
  return request(BASE_URL,{
    url: "/setSubtitle",
    method: "get",
    params,
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
