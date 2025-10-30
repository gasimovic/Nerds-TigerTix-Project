//In this file:
// Sprint 2 Task 1-Database Transaction Safety

const { getDb, runAsync, getAsync, allAsync } = require('./db');

// List events with tickets available
async function listAvailableEvents() {
  const db = await getDb();
  return allAsync(
    db,
    `SELECT id, name, date, total_tickets, tickets_available
     FROM events
     WHERE tickets_available > 0
     ORDER BY date ASC, id ASC`
  );
}

async function getEventByNameApprox(name) {
  const db = await getDb();
  // contains match to find events
  return getAsync(
    db,
    `SELECT * FROM events WHERE lower(name) LIKE ? ORDER BY date ASC, id ASC LIMIT 1`,
    [`%${String(name || '').toLowerCase()}%`]
  );
}
// Get event by ID
async function getEventById(id) {
  const db = await getDb();
  return getAsync(db, `SELECT * FROM events WHERE id = ?`, [id]);
}
// Confirm a booking
async function confirmBooking({ eventId, quantity }) { //confirms booking
  const db = await getDb(); //get database connection

  // booking steps and fallbacks
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        await runAsync(db, 'BEGIN IMMEDIATE TRANSACTION'); //lock db for writing
        const event = await getAsync(db, 'SELECT * FROM events WHERE id = ?', [eventId]); //get event details
        if (!event) { // if event exists
          await runAsync(db, 'ROLLBACK'); //if not, rollback
          const err = new Error('Event not found'); //error handling
          err.status = 404; // 404 not found
          return reject(err); //return error
        }
        if (event.tickets_available < quantity) { //check ticket availability
          await runAsync(db, 'ROLLBACK'); //rollback if not enough tickets
          const err = new Error('Not enough tickets available'); //error handling
          err.status = 409; // 409 conflict
          return reject(err); //return error
        }

        // update tickets_available
        const upd = await runAsync(
          db,
          `UPDATE events
             SET tickets_available = tickets_available - ?
           WHERE id = ? AND tickets_available >= ?`,
          [quantity, eventId, quantity]
        );
        if (upd.changes === 0) { // if update was successful
          await runAsync(db, 'ROLLBACK'); //rollback if not
          const err = new Error('Concurrent update—try again'); //error handling
          err.status = 409; //409 conflict
          return reject(err); //return error
        }

        // insert booking record
        await runAsync(
          db,
          `INSERT INTO bookings (event_id, quantity) VALUES (?, ?)`,
          [eventId, quantity]
        );

        // Sprint 2 Task 1 - Database Transaction Safety 
        await runAsync(db, 'COMMIT'); //commit transaction
        const updated = await getAsync(db, 'SELECT * FROM events WHERE id = ?', [eventId]); //get updated event details
        resolve({ event: updated }); //return updated event
      } catch (e) { 
        try { await runAsync(db, 'ROLLBACK'); } catch {} //attempt rollback on error
        reject(e); //return error
      }
    });
  });
}

module.exports = {
  listAvailableEvents,
  getEventByNameApprox,
  getEventById,
  confirmBooking
};