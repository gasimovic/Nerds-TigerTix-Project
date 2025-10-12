/**
 * setup.js
 * Initializes the shared SQLite schema (runs at server boot).
 */
const fs = require('fs');
const path = require('path');
const { getDb } = require('./models/db');

/*
Input: None
Output: None
Purpose: Ensure the database schema is set up.
*/
const ensureSchema = async () => {
  const db = await getDb();
  const initSqlPath = path.join(__dirname, '..', 'shared-db', 'init.sql');
  const sql = fs.readFileSync(initSqlPath, 'utf-8');
  await new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
};

module.exports = { ensureSchema };
