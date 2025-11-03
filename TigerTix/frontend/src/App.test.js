import '@testing-library/jest-dom';
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = jest.fn();
  global.alert = jest.fn();
});

describe("App integration tests", () => {
  test("loads and displays events", async () => {
    // Mock GET events
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Campus Concert", date: "2025-11-10", tickets_available: 5 },
      ],
    });

    render(<App />);

    // Loading indicator
    expect(screen.getByText(/Loading/)).toBeInTheDocument();

    // Event shows up
    const eventHeading = await screen.findByRole("heading", { name: "Campus Concert" });
    expect(eventHeading).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Buy 1 ticket/ })).toBeEnabled();
  });

  test("buyTicket success refreshes events", async () => {
    // First load
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: "Concert", date: "2025-11-10", tickets_available: 5 }],
      })
      // Purchase call
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      // Refresh load
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: "Concert", date: "2025-11-10", tickets_available: 4 }],
      });

    render(<App />);
    const buyBtn = await screen.findByRole("button", { name: /Buy 1 ticket/ });
    await userEvent.click(buyBtn);

    // After refresh, tickets_available updated
    await screen.findByText("4");
  });

  test('buyTicket error shows alert', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 99, name: 'Bad Event', date: '2025-11-10', tickets_available: 1 }],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Purchase failed' }),
      });

    render(<App />);

    const btn = await screen.findByRole('button', { name: /Buy 1 ticket for Bad Event/i });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Purchase failed');
    });
  });
});

describe("LLM unit-like tests", () => {
  test("submitting text triggers parse and shows proposal", async () => {
    // Initial events load
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      // Parse call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Proposal created",
          requires_confirmation: true,
          proposal: { eventId: 1, quantity: 2 },
        }),
      });

    render(<App />);
    const input = screen.getByLabelText("Ask:");
    await userEvent.type(input, "Book two tickets");
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));

    await waitFor(() => {
      expect(screen.getByText(/Proposal created/)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Confirm booking/ })).toBeInTheDocument();
  });
});