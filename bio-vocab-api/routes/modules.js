const express = require('express');
const router = express.Router();
const { 
  getModules, getModule, createModule, updateModule, deleteModule 
} = require('../controllers/moduleController');
const { protect, admin } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getModules)
  .post(protect, admin, createModule);

router
  .route('/:id')
  .get(protect, getModule)
  .put(protect, admin, updateModule)
  .delete(protect, admin, deleteModule);

module.exports = router; 