// models/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let _db = null;

async function getDb() {
  if (_db) return _db;
  const dbPath = path.join(__dirname, '..', '..', 'shared-db', 'database.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  _db = new sqlite3.Database(dbPath);
  return _db;
}

function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

module.exports = { getDb, runAsync, getAsync };