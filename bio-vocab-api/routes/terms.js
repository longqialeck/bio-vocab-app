const express = require('express');
const router = express.Router();
const { 
  getTerms, getTermById, createTerm, updateTerm, deleteTerm, importTerms 
} = require('../controllers/termController');
const { parseFile } = require('../controllers/importController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
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
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

router
  .route('/module/:moduleId')
  .get(auth.protect, getTerms);

router
  .route('/parse')
  .post(auth.protect, auth.admin, upload.single('file'), parseFile);

router
  .route('/import')
  .post(auth.protect, auth.admin, importTerms);

router
  .route('/')
  .post(auth.protect, auth.admin, createTerm);

router
  .route('/:id')
  .get(auth.protect, getTermById)
  .put(auth.protect, auth.admin, updateTerm)
  .delete(auth.protect, auth.admin, deleteTerm);

module.exports = router; 