const {
  parseHandler,
  confirmHandler,
  listHandler,
} = require('./llmController');
const { validationResult } = require('express-validator');
const {
  listAvailableEvents,
  getEventByNameApprox,
  getEventById,
  confirmBooking,
} = require('../models/bookingModel');
const { parseWithLlm } = require('../services/llm');

jest.mock('express-validator', () => {
  const actual = jest.requireActual('express-validator');
  return {
    ...actual,
    validationResult: jest.fn(),
  };
});

jest.mock('../models/bookingModel', () => ({
  listAvailableEvents: jest.fn(),
  getEventByNameApprox: jest.fn(),
  getEventById: jest.fn(),
  confirmBooking: jest.fn(),
}));

jest.mock('../services/llm', () => ({
  parseWithLlm: jest.fn(),
}));

describe('parseHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: { text: 'Book 2 tickets' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('returns 400 if validation errors exist', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'text is required' }],
    });

    await parseHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'text is required' }] });
  });

  test('handles confirm shortcut with valid proposal', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    req.body = { text: 'confirm', proposal: { eventId: 1, quantity: 2 } };
    getEventById.mockResolvedValue({ id: 1, tickets_available: 5, name: 'Concert' });
    confirmBooking.mockResolvedValue({ event: { id: 1, name: 'Concert' } });

    await parseHandler(req, res, next);

    expect(confirmBooking).toHaveBeenCalledWith({ eventId: 1, quantity: 2 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Booking confirmed', from: 'confirm-in-parse' })
    );
  });

  test('returns 404 if event not found in confirm shortcut', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    req.body = { text: 'confirm', proposal: { eventId: 99, quantity: 1 } };
    getEventById.mockResolvedValue(null);

    await parseHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event not found' });
  });

  test('returns 409 if not enough tickets in confirm shortcut', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    req.body = { text: 'confirm', proposal: { eventId: 1, quantity: 10 } };
    getEventById.mockResolvedValue({ id: 1, tickets_available: 5 });

    await parseHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Not enough tickets available for that quantity' })
    );
  });

  test('returns generic help message if intent not book', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    listAvailableEvents.mockResolvedValue([{ id: 1, name: 'Concert' }]);
    parseWithLlm.mockResolvedValue({ intent: 'other' });

    await parseHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ requires_confirmation: false })
    );
  });

  test('returns booking proposal if event available', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    listAvailableEvents.mockResolvedValue([{ id: 1, name: 'Concert' }]);
    parseWithLlm.mockResolvedValue({ intent: 'book', eventId: 1, quantity: 2 });
    getEventById.mockResolvedValue({ id: 1, name: 'Concert', date: '2025-11-10', tickets_available: 5 });

    await parseHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requires_confirmation: true,
        proposal: expect.objectContaining({ eventId: 1, quantity: 2 }),
      })
    );
  });

  test('returns 404 if event not found when building proposal', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    listAvailableEvents.mockResolvedValue([]);
    parseWithLlm.mockResolvedValue({ intent: 'book', eventId: 99, quantity: 1 });
    getEventById.mockResolvedValue(null);

    await parseHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Event not found' })
    );
  });

  test('returns 409 if not enough tickets when building proposal', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    listAvailableEvents.mockResolvedValue([]);
    parseWithLlm.mockResolvedValue({ intent: 'book', eventId: 1, quantity: 10 });
    getEventById.mockResolvedValue({ id: 1, name: 'Concert', tickets_available: 5 });

    await parseHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Not enough tickets available for that quantity' })
    );
  });
});

describe('confirmHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: { eventId: 1, quantity: 2 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('returns 400 if validation errors exist', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid' }],
    });

    await confirmHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid' }] });
  });

  test('confirms booking and returns 200', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    confirmBooking.mockResolvedValue({ event: { id: 1, name: 'Concert' } });

    await confirmHandler(req, res, next);

    expect(confirmBooking).toHaveBeenCalledWith({ eventId: 1, quantity: 2 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Booking confirmed' })
    );
  });
});

describe('listHandler', () => {
  let res, next;

  beforeEach(() => {
    res = { json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('returns events list', async () => {
    const fakeEvents = [{ id: 1, name: 'Concert' }];
    listAvailableEvents.mockResolvedValue(fakeEvents);

    await listHandler({}, res, next);

    expect(res.json).toHaveBeenCalledWith(fakeEvents);
  });

  test('passes errors to next', async () => {
    const err = new Error('DB error');
    listAvailableEvents.mockRejectedValue(err);

    await listHandler({}, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});