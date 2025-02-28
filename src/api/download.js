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
    url: "/getItems",
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