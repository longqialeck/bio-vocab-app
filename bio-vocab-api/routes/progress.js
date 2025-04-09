const express = require('express');
const router = express.Router();
const { 
  getUserProgress, getModuleProgress, updateProgress 
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getUserProgress);

router
  .route('/module/:moduleId')
  .get(protect, getModuleProgress)
  .put(protect, updateProgress);

module.exports = router; 