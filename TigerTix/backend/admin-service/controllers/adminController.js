// Logic for admin endpoints.

//creates valdation
const { validationResult } = require('express-validator');
const { createEvent, listEvents } = require('../models/adminModel');

//creates event handler
const createEventHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req); //creats errors object
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, date, totalTickets } = req.body; //event details from request body
    const event = await createEvent({ name, date, totalTickets }); // creates event
    res.status(201)
      .location(`/api/admin/events/${event.id}`) //sets id header
      .json({ message: 'Event created', event }); //success message
  } catch (err) {
    if (err && err.message && err.message.includes('UNIQUE')) { //checks for unique constraint error 
      err.status = 400; //bad request
      err.message = 'An event with the same name and date already exists.'; // error message
    }
    next(err);
  }
};

//lists all events
const listEventsHandler = async (_req, res, next) => { //lists all events
  try {
    const events = await listEvents();
    res.json(events);
  } catch (err) {
    next(err);
  }
};

module.exports = { createEventHandler, listEventsHandler };