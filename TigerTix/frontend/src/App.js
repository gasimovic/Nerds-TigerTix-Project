import React, { useEffect, useState } from "react"; // React library
import "./App.css"; // Import CSS

// Main application 
function App() {
  const [events, setEvents] = useState([]); // hold events
  const [loading, setLoading] = useState(true); // track loading status

  // Load events from the client-service
  const loadEvents = () => {
    setLoading(true); // if loading
    fetch("http://localhost:6001/api/client/events") // Fetch events from 6001
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Error fetching events:", err)) //error message and log
      .finally(() => setLoading(false)); // stop loading
  };

  useEffect(() => {
    loadEvents(); // Load events
  }, []);

  // Buy 1 ticket for an event by id
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
    <div className="App" style={{ padding: 16 }}> 
      <h1>Clemson Campus Events</h1>
      {loading && <p>Loading…</p>}
      {!loading && events.length === 0 && <p>No events yet.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {events.map((event) => (
          <li key={event.id} style={{ marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
            <h3 style={{ margin: "4px 0" }}>{event.name}</h3>
            <div>Date: {event.date}</div>
            <div>Tickets Available: {event.tickets_available}</div>
            <button onClick={() => buyTicket(event.id)} style={{ marginTop: 8 }}>
              Buy Ticket
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;