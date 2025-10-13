// Backend service for handling client-related operations

const { getDb, runAsync, getAsync, allAsync } = require('./db'); // Adjust the path as necessary

// List all public events
async function listPublicEvents() {
  const db = await getDb();
  return await allAsync(db, `SELECT id, name, date, total_tickets, tickets_available
                             FROM events ORDER BY date ASC, id ASC`);
}

// Get event by ID
async function getEventById(id) {
  const db = await getDb(); // Ensures db is initialized
  return await getAsync(db, 'SELECT * FROM events WHERE id = ?', [id]); // Returns undefined if not found
}

// Purchase tickets for an event
async function purchaseTickets({ eventId, quantity }) {
  const db = await getDb(); // Ensures db is initialized

  // Check if event exists
  const event = await getAsync(db, 'SELECT * FROM events WHERE id = ?', [eventId]); // Returns undefined if not found
  if (!event) { // If event does not exist
    const err = new Error('Event not found'); // 404 Not Found
    err.status = 404;
    throw err; //throw error
  }

  // Check if enough tickets are available and update atomically
  // 2.2
  const result = await runAsync(db, // 30-33 sqlite commands to update tickets
    `UPDATE events
     SET tickets_available = tickets_available - ?
     WHERE id = ? AND tickets_available >= ?`,
    [quantity, eventId, quantity]
  );

  // If no rows were updated, not enough tickets were available
  if (result.changes === 0) {
    const err = new Error('Not enough tickets available');
    err.status = 409;
    throw err;
  }

  // Return the updated event details
  const updated = await getAsync(db, 'SELECT * FROM events WHERE id = ?', [eventId]);
  return updated;
}

module.exports = { listPublicEvents, getEventById, purchaseTickets };
