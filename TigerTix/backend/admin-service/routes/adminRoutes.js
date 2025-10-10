// Route declarations for the Admin microservice.

const express = require('express');
const { body } = require('express-validator');
const { createEventHandler, listEventsHandler } = require('../controllers/adminController');

const router = express.Router();

const createEventRules = [
  body('name')
    .isString().withMessage('name must be a string')
    .trim().isLength({ min: 3, max: 100 }).withMessage('name must be 3-100 chars'),
  body('date')
    .isISO8601().withMessage('date must be a valid ISO 8601 date (YYYY-MM-DD)'),
  body('totalTickets')
    .isInt({ min: 0 }).withMessage('totalTickets must be an integer ≥ 0')
    .toInt()
];

router.post('/events', ...createEventRules, createEventHandler);
router.get('/events', listEventsHandler);

function applyAdminRoutes(app) {
  app.use('/api/admin', router);
}

module.exports = { applyAdminRoutes };