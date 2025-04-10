import request from "@/utils/request";

const BASE_URL = "/yzr";


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
