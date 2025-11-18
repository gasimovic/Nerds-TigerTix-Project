// routes/authRoutes.js
const express = require('express');
const {
  registerValidators,
  loginValidators,
  registerHandler,
  loginHandler,
  profileHandler
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerValidators, registerHandler);

// POST /api/auth/login
router.post('/login', loginValidators, loginHandler);

// GET /api/auth/profile (protected)
router.get('/profile', authMiddleware, profileHandler);

function applyAuthRoutes(app) {
  app.use('/api/auth', router);
}

module.exports = { applyAuthRoutes };