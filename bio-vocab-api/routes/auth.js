const express = require('express');
const router = express.Router();
const { loginUser, getCurrentUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);

module.exports = router; 