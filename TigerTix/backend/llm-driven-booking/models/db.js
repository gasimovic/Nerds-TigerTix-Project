//In this file:
// Sprint 2 Task 1-Database Transaction Safety 
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let _db = null;
// Get database connection
const getDb = async () => {
  if (_db) return _db;
  const dbPath = path.join(__dirname, '..', '..', 'shared-db', 'database.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  _db = new sqlite3.Database(dbPath);
  return _db;
};
// Run database commands asynchronously
const runAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve(this);
  });
});
const getAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});
const allAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

module.exports = { getDb, runAsync, getAsync, allAsync };