const express = require('express');
const router = express.Router();
const { 
  getModules, getModuleById, createModule, updateModule, deleteModule,
  getModuleTerms, getModuleStats, importTerms, getVocabularyByModule
} = require('../controllers/moduleController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// 设置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

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
  .post(auth.protect, auth.admin, upload.single('file'), (req, res) => {
    req.body.moduleId = req.params.id;
    importTerms(req, res);
  });

// 获取模块下的词汇
router
  .route('/:id/vocabulary')
  .get(auth.protect, getVocabularyByModule);

module.exports = router; 