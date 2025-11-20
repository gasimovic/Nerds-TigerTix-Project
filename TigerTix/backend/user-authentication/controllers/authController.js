const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  createUser,
  findUserByEmail,
  getUserById
} = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Controller: User authentication (registration, login, profile)
 */
// Sprint 3 Task 1

// Validators
/**
 * Sprint 3 Task 1:
 * Validation rules for user registration (email + min 6-char password).
 */
const registerValidators = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

/**
 * Sprint 3 Task 1:
 * Validation rules for user login (email + non-empty password).
 */
const loginValidators = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().isLength({ min: 1 }).withMessage('Password required')
];

/**
 * Sprint 3 Task 1:
 * Handle user registration: validate input, check for existing account,
 * hash the password, and create a new user record.
 */
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

/**
 * Sprint 3 Task 1:
 * Handle user login: validate input, verify credentials, and
 * return a signed JWT (30-minute expiry) on success.
 */
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

/**
 * Sprint 3 Task 1:
 * Example protected route: return the current user's profile
 * using the user id attached by auth middleware.
 */
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
