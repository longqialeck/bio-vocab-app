const express = require('express');
const router = express.Router();
const { 
  getAllVocabulary,
  getVocabularyById,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  importVocabulary,
  bulkDeleteVocabulary,
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule
} = require('../controllers/vocabularyController');
const auth = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only csv, xlsx, xls files
    if (!file.originalname.match(/\.(csv|xlsx|xls)$/)) {
      return cb(new Error('Only CSV and Excel files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Vocabulary routes
router.route('/')
  .get(auth.protect, getAllVocabulary)
  .post(auth.protect, auth.admin, createVocabulary);

router.route('/:id')
  .get(auth.protect, getVocabularyById)
  .put(auth.protect, auth.admin, updateVocabulary)
  .delete(auth.protect, auth.admin, deleteVocabulary);

router.post('/import', auth.protect, auth.admin, upload.single('file'), importVocabulary);
router.delete('/bulk', auth.protect, auth.admin, bulkDeleteVocabulary);

// Module routes
router.route('/modules')
  .get(auth.protect, getAllModules)
  .post(auth.protect, auth.admin, createModule);

router.route('/modules/:id')
  .get(auth.protect, getModuleById)
  .put(auth.protect, auth.admin, updateModule)
  .delete(auth.protect, auth.admin, deleteModule);

module.exports = router; 