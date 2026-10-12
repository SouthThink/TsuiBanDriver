// 当前用户名：持久化在浏览器本地，用于按用户保存观看历史与个性化设置
import { ref } from "vue";

const USERNAME_KEY = "username";

export const username = ref(localStorage.getItem(USERNAME_KEY) || "");

export function hasUsername() {
  return !!String(username.value || "").trim();
}

export function setUsername(name) {
  const value = String(name || "").trim();
  username.value = value;
  if (value) {
    localStorage.setItem(USERNAME_KEY, value);
  } else {
    localStorage.removeItem(USERNAME_KEY);
  }
  return value;
}
