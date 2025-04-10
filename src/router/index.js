import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'splash',
    component: () => import('../views/SplashView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/modules',
    name: 'modules',
    component: () => import('../views/ModulesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/study/:moduleId/:termId',
    name: 'study',
    component: () => import('../views/StudyView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user-profile',
    name: 'user-profile',
    component: () => import('../views/UserProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:moduleId',
    name: 'quiz',
    component: () => import('../views/QuizView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/comprehensive-quiz',
    name: 'comprehensive-quiz',
    component: () => import('../views/ComprehensiveQuizView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-home',
        redirect: { name: 'admin-dashboard' }
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../views/admin/AdminDashboard.vue'),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../views/admin/UserManagement.vue'),
      },
      {
        path: 'vocabulary',
        name: 'admin-vocabulary',
        component: () => import('../views/admin/VocabularyManagement.vue'),
      },
      {
        path: 'progress',
        name: 'admin-progress',
        component: () => import('../views/admin/ProgressManagement.vue'),
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('../views/admin/SystemSettings.vue'),
      },
      {
        path: 'stats',
        name: 'admin-stats',
        component: () => import('../views/admin/DataStatistics.vue'),
      },
      {
        path: 'logs',
        name: 'admin-logs',
        component: () => import('../views/admin/SystemLogs.vue'),
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  // 从localStorage获取token和用户信息
  const token = localStorage.getItem('token')
  const userDataStr = localStorage.getItem('bioVocabUser')
  const isAuthenticated = !!(token && userDataStr)
  
  let userData = null
  let isAdmin = false
  
  if (isAuthenticated && userDataStr) {
    try {
      userData = JSON.parse(userDataStr)
      isAdmin = userData?.isAdmin || false
    } catch (error) {
      console.error('解析用户数据失败:', error)
      // 清除损坏的数据
      localStorage.removeItem('bioVocabUser')
    }
  }
  
  console.log('路由导航检查:', { 
    path: to.path,
    name: to.name, 
    fromName: from?.name, 
    isAuthenticated,
    hasToken: !!token,
    hasUserData: !!userDataStr,
    isAdmin
  });
  
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      console.log('需要认证但未登录，导航到登录页');
      next({ name: 'login' })
    } else if (to.matched.some(record => record.meta.requiresAdmin) && !isAdmin) {
      console.log('需要管理员权限，但用户不是管理员，导航到仪表盘');
      next({ name: 'dashboard' }) // Redirect non-admin users
    } else {
      console.log('用户已认证且权限充足，允许访问:', to.name);
      next()
    }
  } else {
    // 对于公共页面
    if (isAuthenticated && (to.name === 'login' || to.name === 'splash')) {
      console.log('用户已认证，从公共页面导航到仪表盘');
      if (isAdmin && to.query.admin) {
        next({ name: 'admin' })
      } else {
        next({ name: 'dashboard' })
      }
    } else {
      console.log('允许访问公共页面:', to.name);
      next()
    }
  }
})

export default router 