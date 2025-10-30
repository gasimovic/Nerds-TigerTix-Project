
// Routes for LLM-driven booking

const express = require('express'); // for booking confirmation
const {
  parseValidators,
  confirmValidators,
  parseHandler,
  confirmHandler,
  listHandler
} = require('../controllers/llmController');

const router = express.Router();
// Show available events
router.get('/events', listHandler);
// Natural-language parse (no booking yet)
router.post('/parse', parseValidators, parseHandler);
// Confirm booking (transaction safe)
router.post('/confirm', confirmValidators, confirmHandler);

// Apply routes to app
function applyLlmRoutes(app) {
  app.use('/api/llm', router);
}

module.exports = { applyLlmRoutes };