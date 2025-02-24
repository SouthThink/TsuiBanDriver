# TsuiBanDriver 项目说明文档

## 项目简介
TsuiBanDriver 是一个基于 Vue 3 和 Element Plus 的前端项目，主要用于展示和管理动漫视频内容。项目支持暗黑模式切换、视频播放、弹幕显示等功能。

## 功能特点
- **视频播放**：使用 ArtPlayer 播放器进行视频播放，支持弹幕显示。
- **暗黑模式**：支持亮暗模式切换，提升视觉体验。
- **视频管理**：可以按照不同的分类（如番剧季度、最近更新等）管理视频。
- **搜索功能**：提供搜索番剧的功能，方便用户快速找到想要的视频。

## 目录结构
```
├── jsconfig.json
├── package.json
├── public
├── src
│   ├── api
│   │   ├── dandanPlay.js
│   │   └── download.js
│   ├── App.vue
│   ├── assets
│   ├── components
│   │   ├── ArtPlayer.vue
│   │   ├── BangumiCardRow
│   │   │   └── index.vue
│   │   ├── BangumiCollapse
│   │   │   └── index.vue
│   │   ├── MainPage
│   │   │   └── index.vue
│   │   └── SearchPage
│   │       └── index.vue
│   ├── main.js
│   ├── router
│   │   └── index.js
│   ├── utils
│   │   └── request.js
│   └── views
│       ├── HomeView.vue
│       └── video.vue
└── vite.config.js
```

## 安装与运行
1. 克隆项目到本地：
   ```
   git clone [项目地址]
   ```
2. 进入项目目录：
   ```
   cd TsuiBanDriver
   ```
3. 安装依赖：
   ```
   npm install
   ```
4. 启动项目：
   ```
   npm run dev
   ```

## 依赖说明
- `vue`: Vue.js 是一个用于构建用户界面的渐进式框架。
- `vue-router`: Vue Router 是 Vue.js 的官方路由管理器。
- `element-plus`: 一套为开发者、设计师和产品经理准备的基于 Vue 3.0 的组件库。
- `axios`: 一个基于 promise 的 HTTP 库，用于浏览器和 node.js。
- `artplayer`: 一个轻量、可定制、开源的视频播放器。
- `artplayer-plugin-danmuku`: ArtPlayer 的弹幕插件。
- `artplayer-plugin-libass`: ArtPlayer 的字幕插件。

## 贡献指南
如果您对改进 TsuiBanDriver 项目有任何建议或想要贡献代码，请遵循以下步骤：
1. Fork 项目到您的 GitHub 账户。
2. 创建一个新的分支进行修改。
3. 提交您的更改并创建一个 Pull Request。

## 许可证
本项目采用 MIT 许可证。有关详细信息，请查看 LICENSE 文件。
