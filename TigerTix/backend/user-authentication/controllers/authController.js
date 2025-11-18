// controllers/authController.js
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  createUser,
  findUserByEmail,
  getUserById
} = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Validators
const registerValidators = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const loginValidators = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().isLength({ min: 1 }).withMessage('Password required')
];

async function registerHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await createUser(email, hash);

    return res.status(201).json({
      message: 'User registered',
      user: { id: user.id, email: user.email }
    });
  } catch (e) {
    console.error('Register error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function loginHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 30-minute token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (e) {
    console.error('Login error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// GET /profile (example protected route)
async function profileHandler(req, res) {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });
  } catch (e) {
    console.error('Profile error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  registerValidators,
  loginValidators,
  registerHandler,
  loginHandler,
  profileHandler
};