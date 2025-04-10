import request from "@/utils/request";

const BASE_URL = "/yzr";

export function welcome(params) {
  return request(BASE_URL, {
    url: "/welcome",
    method: "get",
    params,
  });
}

export function library(params) {
  return request(BASE_URL, {
    url: "/library",
    method: "get",
    params,
  });
}

export function bangumi(params) {
  return request(BASE_URL, {
    url: "/bangumi",
    method: "get",
    params,
  });
}

export function bangumiList(params) {
  return request(BASE_URL, {
    url: "/bangumiList",
    method: "get",
    params,
  });
}

export function makeHistory(params) {
  return request(BASE_URL, {
    url: "/makeHistory",
    method: "get",
    params,
  });
}
