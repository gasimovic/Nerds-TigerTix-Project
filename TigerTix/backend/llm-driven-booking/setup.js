//Sprint 2 - Task 1
const { getDb, runAsync } = require('./models/db');

async function ensureSchema() {
  const db = await getDb();
  await runAsync(
    db,
    `CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );
}

module.exports = { ensureSchema };