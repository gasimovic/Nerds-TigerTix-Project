// Data access layer for events in the Admin microservice. 

const { getDb, runAsync, getAsync, allAsync } = require('./db');

// 1.2
async function createEvent({ name, date, totalTickets }) {
  const db = await getDb();
  const sql = `INSERT INTO events (name, date, total_tickets, tickets_available)
               VALUES (?, ?, ?, ?)`;
  const result = await runAsync(db, sql, [name, date, totalTickets, totalTickets]);
  const row = await getAsync(db, 'SELECT * FROM events WHERE id = ?', [result.lastID]);
  return row;
}

async function listEvents() {
  const db = await getDb();
  const rows = await allAsync(db, 'SELECT * FROM events ORDER BY date ASC, id ASC');
  return rows;
}

module.exports = { createEvent, listEvents };