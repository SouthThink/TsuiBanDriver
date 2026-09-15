import {
  HomeFilled,
  Calendar,
  Search,
  Star,
  Download,
  ChatDotRound,
  Setting,
} from "@element-plus/icons-vue";

// 侧边栏菜单配置，path 与路由路径一致，label 同时作为翻译键
export const mainMenuItems = [
  { path: "/", label: "番剧", icon: HomeFilled },
  { path: "/timetable", label: "时间表", icon: Calendar },
  { path: "/search", label: "搜索", icon: Search },
  { path: "/subscribe", label: "订阅", icon: Star },
  { path: "/download", label: "下载", icon: Download },
  { path: "/ai", label: "AI对话", icon: ChatDotRound },
];

// 固定在侧边栏底部的菜单项
export const bottomMenuItems = [
  { path: "/settings", label: "设置", icon: Setting },
];

export const menuItems = [...mainMenuItems, ...bottomMenuItems];
