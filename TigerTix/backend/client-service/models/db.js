// Backend service for handling database operations using SQLite

const sqlite3 = require('sqlite3').verbose(); // Enable verbose mode for detailed error messages
const path = require('path'); // Built-in Node.js module for handling file paths
const fs = require('fs'); // Built-in Node.js module for file system operations

let _db = null;

// Function to get or create the database connection
const getDb = async () => {
  if (_db) return _db; // Return existing connection if already created
  const dbPath = path.join(__dirname, '..', '..', 'shared-db', 'database.sqlite'); // Define the path to the database file
  fs.mkdirSync(path.dirname(dbPath), { recursive: true }); // Ensure the directory exists
  _db = new sqlite3.Database(dbPath); // Create a new database connection
  return _db; // Return the new connection
};

// Function to close the database connection
const runAsync = (db, sql, params = []) => new Promise((resolve, reject) => { 
  db.run(sql, params, function (err) { // Use function() to access 'this'
    if (err) return reject(err); // Reject the promise on error
    resolve(this); // Resolve with the statement context
  });
});

// Function to get a single row from the database
const getAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

// Function to get all rows from the database
const allAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

module.exports = { getDb, runAsync, getAsync, allAsync };
