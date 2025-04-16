## 项目简介
TsuiBanDriver 是一个基于 Vue 3 和 Element Plus 的前端项目，主要用于一站式完成搜索、下载、识别、观看番剧的功能。项目支持弹幕显示功能。


## 功能特点
- **视频播放**：使用 ArtPlayer 播放器进行视频播放，支持弹幕显示。
- **番剧搜索**：提供番剧搜索功能，方便用户快速找到想要的番剧。
- **添加规则**：支持用户自定义添加rss订阅源网站，可以使用自己喜欢的网站。
- **视频下载**：支持番剧的下载功能，用户可以将喜欢的番剧下载到本地。
- **番剧识别**：通过调用番剧识别 API，可以识别番剧的名称、分类等信息。
- **弹幕显示**：支持自动识别网络弹幕，给你无别于视频网站的追番体验。

## 依赖说明
- `vue`: Vue.js 是一个用于构建用户界面的渐进式框架。
- `element-plus`: 一套为开发者、设计师和产品经理准备的基于 Vue 3.0 的组件库。
- `axios`: 一个基于 promise 的 HTTP 库，用于浏览器和 node.js。
- `artplayer`: 一个轻量、可定制、开源的视频播放器。
- `artplayer-plugin-danmuku`: ArtPlayer 的弹幕插件。
- [`server-for-TsuiBanDriver`](https://github.com/DoubleEnd/server_for_TsuiBanDriver): 后端服务，用于处理添加规则，番剧搜索、等功能。
- `qBittorrent`: 一个开源的 BitTorrent 客户端，用于下载和分享文件。
- `dandanPlay`: 一个专注于番剧网络识别、获取弹幕的全功能播放器。用于识别番剧名称、分类等信息并获取弹幕。

## 安装与运行
### 方法1
1. 克隆项目到本地：
   ```
   git clone https://github.com/SouthThink/TsuiBanDriver.git
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
### 方法2
1. 克隆项目到本地：
   ```
   git clone https://github.com/SouthThink/TsuiBanDriver.git
   ```
2. 进入项目目录：
   ```
   cd TsuiBanDriver
   ```
3. 安装依赖：
   ```
   npm install
   ```
4. 构建项目：
   ```
   npm run build 
   ```
5. 配置nginx.conf:
   ```
   server {
       listen       8086;
       //可自定义端口
       server_name  tsuiban;

       location / {
           root   html/dist;
           index  index.html index.htm;
           try_files $uri $uri/ /index.html;
       }

		location ^~ /api {
			proxy_pass http://127.0.0.1:8888/;
         //dandanPlay开放的api接口
		}
		
        location ^~ /yzr {
			proxy_pass http://127.0.0.1:5000/;
         //server-for-TsuiBanDriver开放的api接口
		}

    }
   ```



## 许可证
本项目采用 AGPL-3.0 许可证。有关详细信息，请查看 LICENSE 文件。

---