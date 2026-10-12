import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MainPage from '@/pages/MainPage/index.vue'
import TimeTablePage from '@/pages/TimeTablePage/index.vue'
import SearchPage from '@/pages/SearchPage/index.vue'
import SubscribePage from '@/pages/SubscribePage/index.vue'
import DownloadPage from '@/pages/DownloadPage/index.vue'
import AIChatPage from '@/pages/AIChatPage/index.vue'
import SettingPage from '@/pages/SettingPage/index.vue'
import AnimeDetailPage from '@/pages/AnimeDetailPage/index.vue'
import { getAuthStatus } from '@/api/yzrServer'
import { loadBackendStatus, qBittorrentEnabled } from '@/utils/backendStatus'

// 仅在已绑定 qBittorrent 时才能访问的页面
const QBIT_ONLY_ROUTES = ['subscribe', 'download']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 侧边栏布局，各功能页作为子路由渲染在其内容区
      path: '/',
      component: HomeView,
      children: [
        {
          path: '',
          name: 'home',
          component: MainPage,
        },
        {
          path: 'timetable',
          name: 'timetable',
          component: TimeTablePage,
        },
        {
          path: 'search',
          name: 'search',
          component: SearchPage,
        },
        {
          path: 'subscribe',
          name: 'subscribe',
          component: SubscribePage,
        },
        {
          path: 'download',
          name: 'download',
          component: DownloadPage,
        },
        {
          path: 'ai',
          name: 'ai',
          component: AIChatPage,
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingPage,
        },
        {
          // 番剧详情页：?animeId=（本地番剧）或 ?bgmId=（时间表）
          path: 'anime',
          name: 'animeDetail',
          component: AnimeDetailPage,
        },
      ],
    },
    {
      path: '/video',
      name: 'video',
      component: () => import('@/views/video.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
  ],
})

// 未通过密码验证时统一跳转到登录页
router.beforeEach(async (to) => {
  if (to.name === 'login') return true
  try {
    const res = await getAuthStatus()
    const { enabled, authenticated } = res.data
    if (enabled && !authenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  } catch {
    // 后端不可用时不做拦截，避免页面完全无法访问
    return true
  }

  // 未绑定 qBittorrent 时禁止进入订阅、下载页
  await loadBackendStatus()
  if (QBIT_ONLY_ROUTES.includes(to.name) && !qBittorrentEnabled.value) {
    return { name: 'home' }
  }
  return true
})

export default router
