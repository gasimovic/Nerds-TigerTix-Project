
//In this File:
// Sprint 2 Task1- Natural-Language Event Query & Booking -Endpoint Setup
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { applyLlmRoutes } = require('./routes/llmRoutes');
const { ensureSchema } = require('./setup');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/llm/hello', (_req, res) => res.json({ message: 'Hello from LLM booking service' })); // greeting endpoint

applyLlmRoutes(app);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.originalUrl }));

// error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' }); // return error response
});

const PORT = process.env.PORT || 7001; //port to 7001

// Initialize schema and start server
ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`LLM booking service listening on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Failed to init schema:', e);
    process.exit(1);
  });