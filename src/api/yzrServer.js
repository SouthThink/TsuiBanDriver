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

export function deleteAiConfig(data) {
  return request(BASE_URL,{
      method: "post",
      url:"/deleteAiConfig",
      data,
  });
}