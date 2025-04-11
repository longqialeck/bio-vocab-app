const express = require('express');
const router = express.Router();
const { 
  getUsers, createUser, updateUser, deleteUser, resetPassword, unlockAccount, getMe, getDashboardStats
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// 获取当前登录用户
router.route('/me').get(protect, getMe);

// 获取管理员仪表盘统计数据
router.route('/dashboard/stats').get(protect, admin, getDashboardStats);

router
  .route('/')
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);

router
  .route('/:id')
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

// 重置密码路由
router.route('/:id/reset-password')
  .post(protect, admin, resetPassword);

// 解锁账户路由
router.route('/:id/unlock')
  .post(protect, admin, unlockAccount);

module.exports = router; 