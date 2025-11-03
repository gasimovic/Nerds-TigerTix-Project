const { listEventsHandler, purchaseHandler } = require('./clientController');
const { validationResult } = require('express-validator');
const { listPublicEvents, purchaseTickets } = require('../models/clientModel');

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../models/clientModel', () => ({
  listPublicEvents: jest.fn(),
  purchaseTickets: jest.fn(),
}));

describe('listEventsHandler', () => {
  let res, next;

  beforeEach(() => {
    res = { json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('returns events list', async () => {
    const fakeEvents = [{ id: 1, name: 'Concert' }];
    listPublicEvents.mockResolvedValue(fakeEvents);

    await listEventsHandler({}, res, next);

    expect(listPublicEvents).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeEvents);
  });

  test('passes errors to next', async () => {
    const err = new Error('DB error');
    listPublicEvents.mockRejectedValue(err);

    await listEventsHandler({}, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('purchaseHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: { eventId: 1, quantity: 2 } };
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
      array: () => [{ msg: 'Invalid input' }],
    });

    await purchaseHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
    expect(purchaseTickets).not.toHaveBeenCalled();
  });

  test('purchases tickets and returns 200', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const updatedEvent = { id: 1, tickets_available: 8 };
    purchaseTickets.mockResolvedValue(updatedEvent);

    await purchaseHandler(req, res, next);

    expect(purchaseTickets).toHaveBeenCalledWith({ eventId: 1, quantity: 2 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ticket Reservation Successful',
      event: updatedEvent,
    });
  });

  test('passes errors to next', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const err = new Error('DB error');
    purchaseTickets.mockRejectedValue(err);

    await purchaseHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});