// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { applyAuthRoutes } = require('./routes/authRoutes');
const { ensureUserTable } = require('./models/userModel');

const app = express();

app.use(cors()); 
app.use(express.json());

app.get('/api/auth/health', (_req, res) => {
  res.json({ status: 'ok' });
});

applyAuthRoutes(app);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});


const PORT = process.env.PORT || 9001;

ensureUserTable()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`User-authentication service listening on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Failed to init user table:', e);
    process.exit(1);
  });