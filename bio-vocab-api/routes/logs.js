const express = require('express');
const router = express.Router();
const { getLogs, clearLogs, exportLogs } = require('../controllers/logController');
const { protect, admin } = require('../middleware/auth');

// 获取日志列表 - 需要管理员权限
router.get('/', protect, admin, getLogs);

// 清空日志 - 需要管理员权限
router.delete('/', protect, admin, clearLogs);

// 导出日志 - 需要管理员权限
router.get('/export', protect, admin, exportLogs);

module.exports = router; 