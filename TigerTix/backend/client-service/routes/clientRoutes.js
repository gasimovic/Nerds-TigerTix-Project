
const express = require('express');
const { body } = require('express-validator');
const { listEventsHandler, purchaseHandler } = require('../controllers/clientController');

const router = express.Router();

router.get('/events', listEventsHandler);

const purchaseRules = [
  body('eventId').isInt({ min: 1 }).withMessage('eventId must be a positive integer').toInt(),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1').toInt()
];
router.post('/purchase', ...purchaseRules, purchaseHandler);

function applyClientRoutes(app) {
  app.use('/api/client', router);
}

module.exports = { applyClientRoutes };
