const { registerHandler, loginHandler, profileHandler } = require('./authController');
const { findUserByEmail, createUser, getUserById } = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../models/userModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('registerHandler (unit)', () => {

    it('returns 409 if email already exists', async () => {
      const req = { body: { email: 'test@example.com', password: 'secret123' } };
      const res = mockResponse();

      findUserByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });

      // Fake validation passes
      const { validationResult } = require('express-validator');
      jest.spyOn(validationResult, 'apply').mockReturnValue({ isEmpty: () => true });

      await registerHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('creates user and returns 201', async () => {
      const req = { body: { email: 'new@example.com', password: 'secret123' } };
      const res = mockResponse();

      findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedpw');
      createUser.mockResolvedValue({ id: 42, email: 'new@example.com' });

      const { validationResult } = require('express-validator');
      jest.spyOn(validationResult, 'apply').mockReturnValue({ isEmpty: () => true });

      await registerHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered',
        user: { id: 42, email: 'new@example.com' }
      });
    });
  });



  describe('loginHandler (integration-ish)', () => {
    it('returns 401 if user not found', async () => {
      const req = { body: { email: 'missing@example.com', password: 'pw' } };
      const res = mockResponse();

      findUserByEmail.mockResolvedValue(null);

      const { validationResult } = require('express-validator');
      jest.spyOn(validationResult, 'apply').mockReturnValue({ isEmpty: () => true });

      await loginHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 if password mismatch', async () => {
      const req = { body: { email: 'test@example.com', password: 'wrongpw' } };
      const res = mockResponse();

      findUserByEmail.mockResolvedValue({ id: 1, email: 'test@example.com', password_hash: 'hashedpw' });
      bcrypt.compare.mockResolvedValue(false);

      const { validationResult } = require('express-validator');
      jest.spyOn(validationResult, 'apply').mockReturnValue({ isEmpty: () => true });

      await loginHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns token and user on success', async () => {
      const req = { body: { email: 'test@example.com', password: 'pw' } };
      const res = mockResponse();

      findUserByEmail.mockResolvedValue({ id: 1, email: 'test@example.com', password_hash: 'hashedpw' });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake.jwt.token');

      const { validationResult } = require('express-validator');
      jest.spyOn(validationResult, 'apply').mockReturnValue({ isEmpty: () => true });

      await loginHandler(req, res);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'fake.jwt.token',
        user: { id: 1, email: 'test@example.com' }
      });
    });
  });

  describe('profileHandler (integration)', () => {
    it('returns 404 if user not found', async () => {
      const req = { user: { id: 99 } };
      const res = mockResponse();

      getUserById.mockResolvedValue(null);

      await profileHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns user profile if found', async () => {
      const req = { user: { id: 1 } };
      const res = mockResponse();

      getUserById.mockResolvedValue({ id: 1, email: 'test@example.com', created_at: '2025-01-01' });

      await profileHandler(req, res);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        email: 'test@example.com',
        created_at: '2025-01-01'
      });
    });
  });
});