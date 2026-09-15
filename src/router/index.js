import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getAuthStatus } from '@/api/yzrServer'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
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
    if (!enabled || authenticated) return true
    return { name: 'login', query: { redirect: to.fullPath } }
  } catch {
    // 后端不可用时不做拦截，避免页面完全无法访问
    return true
  }
})

export default router
