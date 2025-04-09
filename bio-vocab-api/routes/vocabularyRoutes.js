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
const { protect, admin } = require('../middleware/authMiddleware');
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
  .get(protect, getAllVocabulary)
  .post(protect, admin, createVocabulary);

router.route('/:id')
  .get(protect, getVocabularyById)
  .put(protect, admin, updateVocabulary)
  .delete(protect, admin, deleteVocabulary);

router.post('/import', protect, admin, upload.single('file'), importVocabulary);
router.delete('/bulk', protect, admin, bulkDeleteVocabulary);

// Module routes
router.route('/modules')
  .get(protect, getAllModules)
  .post(protect, admin, createModule);

router.route('/modules/:id')
  .get(protect, getModuleById)
  .put(protect, admin, updateModule)
  .delete(protect, admin, deleteModule);

module.exports = router; 