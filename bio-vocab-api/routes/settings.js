const express = require('express');
const router = express.Router();
const { 
  getAllSettings, 
  getSettings, 
  updateSettings, 
  resetSettings 
} = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/auth');

// 获取所有设置 - 仅管理员
router.get('/', protect, admin, getAllSettings);

// 获取指定类型的设置 - 仅管理员
router.get('/:type', protect, admin, getSettings);

// 更新设置 - 仅管理员
router.put('/:type', protect, admin, updateSettings);

// 重置设置为默认值 - 仅管理员
router.post('/:type/reset', protect, admin, resetSettings);

module.exports = router; 