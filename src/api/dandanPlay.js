import request from "@/utils/request";

export function welcome(data) {
  return request({
    url: "/api/v1/welcome",
    method: "get",
    data,
  });
}

export function library(data) {
  return request({
    url: "/api/v1/library",
    method: "get",
    data,
  });
}

export function subtitle(data) {
  return request({
    url: "/api/v1/subtitle/info/" + data,
    method: "get"
  });
}


export function bangumi(data) {
  return request({
    url: "/api/v1/library/v2/bangumi/list/nav:" + data,
    method: "get",
  });
}

export function bangumiList(data) {
  return request({
    url: "/api/v1/library/v2/bangumi/details/" + data,
    method: "get",
  });
}
