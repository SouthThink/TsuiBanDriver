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

// export function getRssItems(params) {
//   return request(BASE_URL,{
//     url: "/getItems",
//     method: "get",
//     params,
//   });
// }

export function getRssItems(params) {
  return request(BASE_URL,{
    url: "/everything",
    method: "get",
    params: {
      url: "rss/items",
      ...params,
    },
  });
}

export function getDownloadList(params) {
  return request(BASE_URL,{
    url: "/everything",
    method: "get",
    params: {
      url: "sync/maindata",
      ...params,
    },
  });
}

// export function removeItem(data) {
//   return request(BASE_URL,{
//     url: "/removeItem",
//     method: "post",
//     data,
//   });
// }

export function removeItem(data) {
  return request(BASE_URL,{
    url: "/everything",
    method: "post",
    data:{
      data: data,
      url:"rss/removeItem"
    },
  });
}

// export function refreshItem(data) {
//   return request(BASE_URL,{
//     url: "/refreshItem",
//     method: "post",
//     data,
//   });
// }

export function refreshItem(data) {
  return request(BASE_URL,{
    url: "/everything",
    method: "post",
    data:{
      data: data,
      url:"rss/refreshItem"
    },
  });
}

// export function moveItem(data) {
//   return request(BASE_URL,{
//     url: "/moveItem",
//     method: "post",
//     data,
//   });
// }

export function moveItem(data) {
  return request(BASE_URL,{
    url: "/everything",
    method: "post",
    data:{
      data: data,
      url:"rss/moveItem"
    },
  });
}

export function markAsRead(data) {
  return request(BASE_URL,{
    url: "/everything",
    method: "post",
    data:{
      data: data,
      url:"rss/markAsRead"
    },
  });
}

export function addFeed(data) {
  return request(BASE_URL,{
    url: "/everything",
    method: "post",
    data:{
      data: data,
      url:"rss/addFeed"
    },
  });
}

export function addTorrents(data) {
  return request(BASE_URL,{
    url: "/everything",
    method: "post",
    data:{
      data: data,
      url:"torrents/add"
    },
  });
}

export function deleteTorrents(data) {
  return request(BASE_URL,{
    url: "/everything",
    method: "post",
    data:{
      data: data,
      url:"torrents/delete"
    },
  });
}

export function getRssRules(params) {
  return request(BASE_URL,{
    url: "/everything",
    method: "get",
    params:{
      ...params,
      url:"rss/rules"
    },
  });
}

// export function setRule(data) {
//   return request(BASE_URL,{
//     url: "/everything",
//     method: "post",
//     data:{
//       data: data,
//       url:"rss/setRule"
//     },
//   });
// }

export function setRule(data) {
  return request(BASE_URL,{
    url: "/setRule",
    method: "post",
    data:data,
  });
}

export function matchingArticles(params) {
  return request(BASE_URL,{
    url: "/everything",
    method: "get",
    params:{
      ...params,
      url:"rss/matchingArticles"
    },
  });
}

export function removeRule(data) {
  return request(BASE_URL,{
    url: "/everything",
    method: "post",
    data:{
      data: data,
      url:"rss/removeRule"
    },
  });
}

export function setLocation(data) {
  return request(BASE_URL,{
    url: "/everything",
    method: "post",
    data:{
      data: data,
      url:"torrents/setLocation"
    },
  });
}