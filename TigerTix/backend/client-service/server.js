// Backend service for handling client-related operations

const express = require('express'); // Express framework for building web servers
const cors = require('cors'); // Enables CORS

const { applyClientRoutes } = require('./routes/clientRoutes'); // Import client routes
const { ensureSchema } = require('./setup'); // Function to ensure the database schema is set up

const app = express();// Initialize an Express application
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); //Parse JSON request bodies


// Health check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'client' }));

applyClientRoutes(app); // Apply client-related routes to the app 

// 404 handler for unmatched routes
app.use((req, res) => {
  // Return 404 for unknown routes
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Global error handler
app.use((err, _req, res, _next) => { 
  console.error('Unhandled error:', err); // Log the error for debugging
  // Return error response
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});


const PORT = process.env.PORT || 6001; // Use port 6001

/*
Input: None
Output: None
Purpose: Ensure the database schema is set up, then start the server.
*/
ensureSchema() //ensure the database schema is set up
  .then(() => {
    app.listen(PORT, () => { // Start the server
      // log server start message
      console.log(`Client service listening on http://localhost:${PORT}`);
    });
  })
  .catch((e) => { // Handle errors during schema setup
    console.error('Failed to init schema:', e); // Log the error
    process.exit(1); // Exit the process with failure
  });
