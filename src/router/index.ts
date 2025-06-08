import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Home.vue'), // 暂时使用Home组件
    meta: {
      title: '搜索'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - AI导航`
  } else {
    document.title = 'AI导航 - 最全面的AI工具导航平台'
  }
  
  next()
})

export default router 