// Backend service for handling client-related operations

const { validationResult } = require('express-validator'); // For input validation
const { listPublicEvents, purchaseTickets } = require('../models/clientModel'); // Adjust the path as necessary

// Handler to list all public events
const listEventsHandler = async (_req, res, next) => {
  try {
    const events = await listPublicEvents(); // Fetch public events from model
    res.json(events); // Send events as JSON response
  } catch (err) { // Error handling
    next(err);
  }
};

// Handler to purchase tickets
const purchaseHandler = async (req, res, next) => { // Validates input
  try { // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // 400 Bad Request for validation errors
    }
    const { eventId, quantity } = req.body; // Extract eventId and quantity from request body
    const updated = await purchaseTickets({ eventId, quantity }); // Attempt to purchase tickets via model
    res.status(200).json({ message: 'Ticket Reservation Successful', event: updated }); // Success response
  } catch (err) { // Error handling
    next(err);
  }
};

module.exports = { listEventsHandler, purchaseHandler };
