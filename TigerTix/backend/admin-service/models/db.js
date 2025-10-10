//SQLite wrapper 

const sqlite3 = require('sqlite3').verbose(); //verbose mode for  error messages
const path = require('path'); //file path module
const fs = require('fs'); //file system module

let _db = null; //database instance

//gets database instance/creates it if not created
const getDb = async () => {
  if (_db) return _db;
  const dbPath = path.join(__dirname, '..', '..', 'shared-db', 'database.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  _db = new sqlite3.Database(dbPath);
  return _db;
};

//runs SQL command
const runAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve(this); 
  });
});

//gets single row from database
const getAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

//gets all rows from database
const allAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

module.exports = { getDb, runAsync, getAsync, allAsync };