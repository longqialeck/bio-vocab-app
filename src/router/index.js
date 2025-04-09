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
    path: '/admin',
    name: 'admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
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
  const isAuthenticated = localStorage.getItem('bioVocabUser')
  const userData = isAuthenticated ? JSON.parse(localStorage.getItem('bioVocabUser')) : null
  const isAdmin = userData?.isAdmin || false
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next({ name: 'login' })
    } else if (to.matched.some(record => record.meta.requiresAdmin) && !isAdmin) {
      next({ name: 'dashboard' }) // Redirect non-admin users
    } else {
      next()
    }
  } else {
    if (isAuthenticated && (to.name === 'login' || to.name === 'splash')) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
  }
})

export default router 