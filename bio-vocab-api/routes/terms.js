const express = require('express');
const router = express.Router();
const { 
  getTerms, getTerm, createTerm, updateTerm, deleteTerm, importTerms 
} = require('../controllers/termController');
const { parseFile } = require('../controllers/importController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router
  .route('/module/:moduleId')
  .get(protect, getTerms);

router
  .route('/parse')
  .post(protect, admin, upload.single('file'), parseFile);

router
  .route('/import')
  .post(protect, admin, importTerms);

router
  .route('/')
  .post(protect, admin, createTerm);

router
  .route('/:id')
  .get(protect, getTerm)
  .put(protect, admin, updateTerm)
  .delete(protect, admin, deleteTerm);

module.exports = router; 