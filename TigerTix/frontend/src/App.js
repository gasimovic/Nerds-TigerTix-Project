import React, { useEffect, useState } from "react"; // React library
import "./App.css"; // Import CSS

// Main application
/*
Input: None
Output: Rendered App component
*/ 
function App() {
  const [events, setEvents] = useState([]); // hold events
  const [loading, setLoading] = useState(true); // track loading status

  // Load events from the client-service
  /*
  Input: None
  Output: None
  Purpose: Load events from the client-service.
  */
  const loadEvents = () => {
    setLoading(true); // if loading
    fetch("http://localhost:6001/api/client/events") // Fetch events from 6001
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Error fetching events:", err)) //error message and log
      .finally(() => setLoading(false)); // stop loading
  };

  // Load events on component mount
  useEffect(() => {
    loadEvents(); // Load events
  }, []);

  // Buy 1 ticket for an event by id
  /*
  Input: eventId (ID of the event to buy a ticket for)
  Output: None
  Purpose: Buy 1 ticket for an event by ID.
  */
  const buyTicket = async (eventId) => {
    try { 
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
return (
  <main className="App" aria-labelledby="page-title">
    <h1 id="page-title">Clemson Campus Events</h1>

    {(!events || events.length === 0) ? (
      <p>No events yet.</p>
    ) : (
      <ul>
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