/**
 * Controller: LLM parse + confirmation booking flow
 */
// Sprint 2 Task 1 
const { body, validationResult } = require('express-validator');
const {
  listAvailableEvents,
  getEventByNameApprox,
  getEventById,
  confirmBooking
} = require('../models/bookingModel');
const { parseWithLlm } = require('../services/llm');

// Export validators and handlers
const parseValidators = [
  body('text').isString().isLength({ min: 1 }).withMessage('text is required'),
  body('proposal').optional().isObject(),
  body('proposal.eventId').optional().isInt({ min: 1 }),
  body('proposal.quantity').optional().isInt({ min: 1 })
];
//confirmation validators
const confirmValidators = [
  body('eventId').isInt({ min: 1 }).toInt(),
  body('quantity').isInt({ min: 1 }).toInt(),
  body('confirm').equals('true').withMessage('confirm must be true as a string or boolean').optional({ values: 'falsy' })
];

// Natural language parse handler
async function parseHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    // get available events
    const { text } = req.body;

    // Convenience: if user says "confirm" and a prior proposal is provided, book here
    const { proposal } = req.body;
    const confirmWords = /^(confirm|yes|y|ok|okay|go ahead)$/i;
    if (confirmWords.test(String(text)) && proposal?.eventId && proposal?.quantity) {
      const target = await getEventById(Number(proposal.eventId));
      if (!target) return res.status(404).json({ error: 'Event not found' });

      if (target.tickets_available < Number(proposal.quantity)) {
        return res.status(409).json({
          error: 'Not enough tickets available for that quantity',
          available: target.tickets_available
        });
      }

      const result = await confirmBooking({
        eventId: Number(proposal.eventId),
        quantity: Number(proposal.quantity)
      });

      return res.status(200).json({
        message: 'Booking confirmed',
        event: result.event,
        from: 'confirm-in-parse'
      });
    }

    const events = await listAvailableEvents();
    const parsed = await parseWithLlm(text, events);
    // resolve event ID if missing
    let resolved = { ...parsed };
    if (!resolved.eventId && resolved.eventName) {
      const ev = await getEventByNameApprox(resolved.eventName);
      if (ev) { resolved.eventId = ev.id; resolved.eventName = ev.name; }
    }
    // decide next steps
    if (resolved.intent !== 'book' || !resolved.eventId) {
      return res.status(200).json({
        message: "I can help you book tickets. Please say, e.g., 'Book two tickets for Jazz Night.'",
        parsed: resolved,
        requires_confirmation: false
      });
    }

    // Build a booking proposal 
    const target = await getEventById(resolved.eventId); // get event details
    if (!target) return res.status(404).json({ error: 'Event not found', parsed: resolved }); // event not found

    // check ticket availability
    if (target.tickets_available < resolved.quantity) {
      return res.status(409).json({ //409 conflict if not enough tickets
        error: 'Not enough tickets available for that quantity', // error message
        parsed: resolved, // parsed result
        available: target.tickets_available// available tickets
      });
    }
    // return booking proposal
    return res.status(200).json({
      message: `Confirm booking ${resolved.quantity} ticket(s) for "${target.name}" on ${target.date}?`, // confirmation message
      proposal: { eventId: target.id, eventName: target.name, quantity: resolved.quantity },// booking proposal
      requires_confirmation: true// confirmation required
    });
  } catch (e) { next(e); }
}

// Sprint 2 Task 1 - Booking Confirmation 
// Confirm booking handler
async function confirmHandler(req, res, next) {
  try {
    const errors = validationResult(req); // validate request
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); // return errors if any

    // perform booking
    const { eventId, quantity } = req.body;
    const result = await confirmBooking({ eventId, quantity });
    return res.status(200).json({ // return success response
      message: 'Booking confirmed', // confirmation message
      event: result.event 
    });
  } catch (e) { next(e); }
}

// List available events
async function listHandler(_req, res, next) {
  try {
    const events = await listAvailableEvents();
    res.json(events);
  } catch (e) { next(e); }
}

module.exports = {
  parseValidators,
  confirmValidators,
  parseHandler,
  confirmHandler,
  listHandler
};