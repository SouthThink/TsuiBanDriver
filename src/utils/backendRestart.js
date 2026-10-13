// 后端重启入口的解锁状态：在「关于」里连续点击后端版本号 10 次后，
// 「后端设置」里才会出现重启按钮，避免普通用户误触
import { ref } from "vue";

const UNLOCK_CLICKS = 10;

export const restartUnlocked = ref(false);

let clicks = 0;

export function countVersionClick() {
  if (restartUnlocked.value) return;
  clicks += 1;
  if (clicks >= UNLOCK_CLICKS) restartUnlocked.value = true;
}
