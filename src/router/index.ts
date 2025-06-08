import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout/index.vue'),
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: {
          title: '首页',
          keepAlive: true
        }
      },
      {
        path: '/category/:id?',
        name: 'Category',
        component: () => import('@/views/Category.vue'),
        meta: {
          title: '分类',
          keepAlive: true
        }
      },
      {
        path: '/search',
        name: 'Search',
        component: () => import('@/views/Search.vue'),
        meta: {
          title: '搜索',
          keepAlive: false
        }
      }
    ]
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Layout/index.vue'),
    redirect: '/admin/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/Admin/Dashboard.vue'),
        meta: {
          title: '管理面板',
          requiresAuth: true
        }
      },
      {
        path: '/admin/categories',
        name: 'AdminCategories',
        component: () => import('@/views/Admin/CategoryManage.vue'),
        meta: {
          title: '分类管理',
          requiresAuth: true
        }
      },
      {
        path: '/admin/navigations',
        name: 'AdminNavigations',
        component: () => import('@/views/Admin/NavigationManage.vue'),
        meta: {
          title: '导航管理',
          requiresAuth: true
        }
      },
      {
        path: '/admin/settings',
        name: 'AdminSettings',
        component: () => import('@/views/Admin/Settings.vue'),
        meta: {
          title: '系统设置',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Error/404.vue'),
    meta: {
      title: '页面未找到'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  NProgress.start()
  
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - AI导航`
  } else {
    document.title = 'AI导航 - 最全面的AI工具导航平台'
  }
  
  // 检查是否需要认证
  if (to.meta?.requiresAuth) {
    // TODO: 实现认证逻辑
    // const isAuthenticated = checkAuth()
    // if (!isAuthenticated) {
    //   next('/login')
    //   return
    // }
  }
  
  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router 