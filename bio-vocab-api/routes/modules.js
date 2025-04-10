const express = require('express');
const router = express.Router();
const { 
  getModules, getModuleById, createModule, updateModule, deleteModule,
  getModuleTerms, getModuleStats, importTerms, getVocabularyByModule
} = require('../controllers/moduleController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

console.log('[修改] 模块路由模块已重新加载');

router
  .route('/')
  .get(auth.protect, getModules)
  .post(auth.protect, auth.admin, createModule);

router
  .route('/:id')
  .get(auth.protect, getModuleById)
  .put(auth.protect, auth.admin, updateModule)
  .delete(auth.protect, auth.admin, deleteModule);

// 获取模块下的术语
router
  .route('/:id/terms')
  .get(auth.protect, getModuleTerms);

// 获取模块统计数据
router
  .route('/:id/stats')
  .get(auth.protect, getModuleStats);

// 导入术语到模块
router
  .route('/:id/import')
  .post(auth.protect, auth.admin, upload.single('file'), importTerms);

// 获取模块下的词汇
router
  .route('/:id/vocabulary')
  .get(auth.protect, getVocabularyByModule);

module.exports = router; 