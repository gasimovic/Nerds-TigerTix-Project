/****
 * server.js
 * Express server for the TigerTix Admin microservice.
 * Responsibilities:
 *  - Initialize the shared SQLite DB schema on boot
 *  - Expose REST endpoints for creating and (optionally) listing events
 *
 * Runs on port 5001 by default.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const { applyAdminRoutes } = require('./routes/adminRoutes');
const { ensureSchema } = require('./setup');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'admin' }));

// Mount admin routes (prefix /api/admin)
applyAdminRoutes(app);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});


const PORT = process.env.PORT || 5001;

/*
Input: None
Output: None
Purpose: Ensure the database schema is set up, then start the server.
*/ 
ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Admin service listening on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Failed to init schema:', e);
    process.exit(1);
  });
