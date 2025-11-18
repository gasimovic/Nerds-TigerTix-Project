// models/userModel.js
const { getDb, runAsync, getAsync } = require('./db');

async function ensureUserTable() {
  const db = await getDb();
  await runAsync(
    db,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );
}

// Create a new user (email must be unique)
async function createUser(email, passwordHash) {
  const db = await getDb();
  await ensureUserTable();
  await runAsync(
    db,
    `INSERT INTO users (email, password_hash) VALUES (?, ?)`,
    [email, passwordHash]
  );
  return findUserByEmail(email);
}

async function findUserByEmail(email) {
  const db = await getDb();
  await ensureUserTable();
  return getAsync(db, `SELECT * FROM users WHERE email = ?`, [email]);
}

async function getUserById(id) {
  const db = await getDb();
  await ensureUserTable();
  return getAsync(db, `SELECT * FROM users WHERE id = ?`, [id]);
}

module.exports = {
  ensureUserTable,
  createUser,
  findUserByEmail,
  getUserById
};