// Backend service for setting up the database schema

const fs = require('fs'); // Built-in Node.js module for file system operations
const path = require('path'); // Built-in Node.js module for handling file paths
const { getDb } = require('./models/db'); // Import the getDb function to access the database

// Function to ensure the database schema is set up
/*Input: None
Output: None
Purpose: Ensure the database schema is set up.
*/
const ensureSchema = async () => {
  const db = await getDb(); // Get the database connection
   // Path to the SQL initialization file
  const initSqlPath = path.join(__dirname, '..', 'shared-db', 'init.sql');
  if (fs.existsSync(initSqlPath)) { // Check if the SQL file exists
    const sql = fs.readFileSync(initSqlPath, 'utf-8'); // Read the SQL file content
    // Execute the SQL commands to set up the schema
    await new Promise((resolve, reject) => db.exec(sql, (err) => err ? reject(err) : resolve()));
  }
};

module.exports = { ensureSchema };
