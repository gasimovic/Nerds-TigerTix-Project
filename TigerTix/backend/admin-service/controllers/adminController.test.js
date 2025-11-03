const { createEventHandler, listEventsHandler } = require('./adminController');
const { validationResult } = require('express-validator');
const { createEvent, listEvents } = require('../models/adminModel');

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../models/adminModel', () => ({
  createEvent: jest.fn(),
  listEvents: jest.fn(),
}));

describe('createEventHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: { name: 'Test Event', date: '2025-11-10', totalTickets: 100 } };
    res = {
      status: jest.fn().mockReturnThis(),
      location: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('returns 400 if validation errors exist', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Name is required' }],
    });

    await createEventHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Name is required' }] });
    expect(createEvent).not.toHaveBeenCalled();
  });

  test('creates event and returns 201 with location header', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const fakeEvent = { id: 1, name: 'Test Event', date: '2025-11-10', totalTickets: 100 };
    createEvent.mockResolvedValue(fakeEvent);

    await createEventHandler(req, res, next);

    expect(createEvent).toHaveBeenCalledWith({
      name: 'Test Event',
      date: '2025-11-10',
      totalTickets: 100,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.location).toHaveBeenCalledWith('/api/admin/events/1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Event created', event: fakeEvent });
  });

  test('handles unique constraint error gracefully', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const err = new Error('SQLITE_CONSTRAINT: UNIQUE failed');
    createEvent.mockRejectedValue(err);

    await createEventHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: 'An event with the same name and date already exists.',
      })
    );
  });

  test('passes other errors to next', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const err = new Error('Database down');
    createEvent.mockRejectedValue(err);

    await createEventHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('listEventsHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = { json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('returns events list', async () => {
    const fakeEvents = [{ id: 1, name: 'Event A' }];
    listEvents.mockResolvedValue(fakeEvents);

    await listEventsHandler(req, res, next);

    expect(listEvents).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeEvents);
  });

  test('passes errors to next', async () => {
    const err = new Error('DB error');
    listEvents.mockRejectedValue(err);

    await listEventsHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});