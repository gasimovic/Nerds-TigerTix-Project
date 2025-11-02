import React, { useEffect, useState } from "react"; // React library
// Sprint 1 - 4.2
import "./App.css"; // Import CSS
import SpeechToText from "./SpeechToText";

// Main application
/*
Input: None
Output: Rendered App component
*/ 
function App() {
  const [events, setEvents] = useState([]); // hold events
  const [loading, setLoading] = useState(true); // track loading status

  // === Sprint 2: LLM helpers (Task 1) ===
  // Sprint 2 Task 1 (frontend helper state
  const [llmText, setLlmText] = useState("");
  const [llmParsed, setLlmParsed] = useState(null);
  const [llmBusy, setLlmBusy] = useState(false);
  const [llmMsg, setLlmMsg] = useState("");

  // Sprint 2 – Task 1: Parse natural language via /api/llm/parse
  // POST /api/llm/parse — ask the LLM to parse booking intent
  async function llmParse(textOverride) {
    const textToSend = (textOverride ?? llmText);
    setLlmBusy(true); setLlmMsg("");
    try {
      const res = await fetch("http://localhost:7001/api/llm/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend })
      });
      const data = await res.json();
      setLlmParsed(data);
    } catch (e) {
      setLlmMsg("Error contacting LLM service");
    } finally {
      setLlmBusy(false);
    }
  }

  // Sprint 2 – Task 1: Explicit confirmation → POST /api/llm/confirm and refresh events
  // POST /api/llm/confirm — confirm the last proposal (if any)
  async function llmConfirm() {
    try {
      if (!llmParsed?.proposal) {
        setLlmMsg("Nothing to confirm");
        return;
      }
      const res = await fetch("http://localhost:7001/api/llm/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: llmParsed.proposal.eventId,
          quantity: llmParsed.proposal.quantity,
          confirm: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirm failed");
      setLlmMsg(data.message || "Booking confirmed");
      setLlmParsed(null);
      setLlmText("");
      // refresh list after confirmation
      loadEvents();
    } catch (e) {
      setLlmMsg(e.message || "Error confirming booking");
    }
  }

  // Sprint 2 – Option A bridge: if user says "confirm", call llmConfirm() instead of re-parsing
  // if user says "confirm" after a proposal, call /confirm
  async function handleLlmSubmit(e) {
    e.preventDefault();
    const input = llmText;           // capture current text
    setLlmText("");                 // clear the field for next entry

    const cleaned = (input || "").trim().toLowerCase();
    if (
      llmParsed?.requires_confirmation &&
      ["confirm", "yes", "y", "ok", "okay", "go ahead"].includes(cleaned)
    ) {
      llmConfirm();
      return;
    }
    await llmParse(input);           // parse using the text the user just typed
  }

  // === Sprint 1: Client microservice integration (Task 3) ===
  // Load events from the client-service
  /*
  Input: None
  Output: None
  Purpose: Load events from the client-service.
  */
  // Sprint 1 – Task 3: Fetch events list from client service
  const loadEvents = () => {
    setLoading(true); // if loading
    // 3.1
    fetch("http://localhost:6001/api/client/events") // Fetch events from 6001
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Error fetching events:", err)) //error message and log
      .finally(() => setLoading(false)); // stop loading
  };

  // Sprint 1 – Task 3: Load events on mount
  // Load events on component mount
  useEffect(() => {
    loadEvents(); // Load events
  }, []);

  // Sprint 1 – Task 3: Buy button flow (POST /api/client/purchase)
  // Buy 1 ticket for an event by id
  /*
  Input: eventId (ID of the event to buy a ticket for)
  Output: None
  Purpose: Buy 1 ticket for an event by ID.
  */
  const buyTicket = async (eventId) => {
    try { 
      // 3.2
      const res = await fetch("http://localhost:6001/api/client/purchase", { // POST to purchase endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, quantity: 1 }),
      });
      if (!res.ok) { // If response not ok
        const err = await res.json().catch(() => ({})); //parse error message
        throw new Error(err.error || `Purchase failed (${res.status})`); // throw error
      }
      // refresh list after purchase
      await loadEvents();
    } catch (e) {
      alert(e.message);
    }
  };

// Render the app UI
//  Sprint 1 - 4.1
return (
  <main className="App" aria-labelledby="page-title">
    <h1 id="page-title">Clemson Campus Events</h1>
    {loading && <p>Loading…</p>}

    {/*Sprint 2 - Task 1: Text chat UI*/}
    {/* Sprint 2 Task 1: simple text UI to drive parse -> confirm */}
    <section aria-labelledby="llm-title" style={{ margin: "16px 0" }}>
      <h2 id="llm-title">Text Chat Booking</h2>
      <form onSubmit={handleLlmSubmit}>
        <label htmlFor="llm-text">Ask:</label>{" "}
        <input
          id="llm-text"
          value={llmText}
          onChange={(e) => setLlmText(e.target.value)}
          placeholder='e.g., "Book two tickets for Campus Concert"'
          aria-describedby="llm-help"
        />
        <button type="submit" disabled={llmBusy || !llmText.trim()}>Ask</button>
      </form>
      <p id="llm-help" style={{ fontSize: "0.9rem" }}>
      Type <em>confirm</em> to proceed (or click Confirm below).
      </p>

      {/* Show parse result and offer confirmation if required */}
      {llmParsed && (
        <div role="status" aria-live="polite" style={{ marginTop: 8 }}>
          {llmParsed.message && <p>{llmParsed.message}</p>}
          {llmParsed.requires_confirmation && llmParsed.proposal && (
            <button onClick={llmConfirm} disabled={llmBusy} aria-label="Confirm booking">
              Confirm Booking
            </button>
          )}
        </div>
      )}

      {llmMsg && (
        <p role="status" aria-live="polite" style={{ marginTop: 8 }}>{llmMsg}</p>
      )}
    </section>

    {(!events || events.length === 0) ? (
      <p>No events yet.</p>
    ) : (
      <ul>
        <div>
            <div>
        {/* Sprint 2 – Task 2: Voice input (SpeechToText) triggers onConfirmed() to refresh */}
                <SpeechToText onConfirmed={loadEvents} />
            </div>
        </div>
        {/* Sprint 1 – Task 3 & Task 4: Accessible events list + Buy button */}
        {events.map((ev) => {
          const soldOut = Number(ev.tickets_available) <= 0;
          return (
            <li key={ev.id}>
              <article aria-labelledby={`event-${ev.id}-title`}>
                <h2 id={`event-${ev.id}-title`}>{ev.name}</h2>
                <p><strong>Date:</strong> {ev.date}</p>
                <p>
                  <strong>Tickets Available:</strong>{" "}
                  <span aria-live="polite">{ev.tickets_available}</span>
                </p>
                <button
                  onClick={() => buyTicket(ev.id)}
                  disabled={soldOut}
                  aria-label={
                    soldOut
                      ? `${ev.name} is sold out`
                      : `Buy 1 ticket for ${ev.name}`
                  }
                >
                  {soldOut ? "Sold Out" : "Buy Ticket"}
                </button>
              </article>
            </li>
          );
        })}
      </ul>
    )}
  </main>
);
}

export default App;