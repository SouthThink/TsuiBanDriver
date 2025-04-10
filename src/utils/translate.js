import zh_CN from '../lang/zh_CN.js';
import zh_TW from '../lang/zh_TW.js';
import en_US from '../lang/en_US.js';
import ja_JP from '../lang/ja_JP.js';

const languages = {
  zh_CN: zh_CN,
  zh_TW: zh_TW,
  en_US: en_US,
  ja_JP: ja_JP,
}

let currentLang = 'zh_CN';
// // 当前语言
if (localStorage.getItem('lang')) {
  currentLang = localStorage.getItem('lang');
} else {
  localStorage.setItem('lang', currentLang);
}

// 获取翻译
export function translate(key) {
  const translations = languages[currentLang];
  return translations[key] || key;
}

