import request from "@/utils/request";

const BASE_URL = '/api';

export function welcome(params) {
  return request(BASE_URL,{
    url: "/api/v1/welcome",
    method: "get",
    params,
  });
}

export function library(params) {
  return request(BASE_URL,{
    url: "/api/v1/library",
    method: "get",
    params,
  });
}

export function bangumi(params) {
  return request(BASE_URL,{
    url: "/api/v1/library/v2/bangumi/list/nav:" + params,
    method: "get",
  });
}

export function bangumiList(params) {
  return request(BASE_URL,{
    url: "/api/v1/library/v2/bangumi/details/" + params,
    method: "get",
  });
}

export function subtitle(params) {
  return request("/web1",{
    url: "/subtitle/" + params + "/ass",
    method: "get",
  });
}
