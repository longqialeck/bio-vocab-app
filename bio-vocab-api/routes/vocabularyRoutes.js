const express = require('express');
const router = express.Router();
const { 
  getAllVocabulary,
  getVocabularyById,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  importVocabulary
} = require('../controllers/vocabularyController');
const auth = require('../middleware/auth');

// Vocabulary routes
router.route('/')
  .get(auth.protect, getAllVocabulary)
  .post(auth.protect, auth.admin, createVocabulary);

router.route('/:id')
  .get(auth.protect, getVocabularyById)
  .put(auth.protect, auth.admin, updateVocabulary)
  .delete(auth.protect, auth.admin, deleteVocabulary);

router.post('/import', auth.protect, auth.admin, importVocabulary);

module.exports = router; 