import React, { useEffect, useState } from "react"; // React library
// Sprint 1 - 4.2
import "./App.css"; // Import CSS
import SpeechToText from "./SpeechToText";

// === Sprint 4: Environment-based API base URLs (frontend deployment ready) ===
const CLIENT_API_BASE =
  process.env.REACT_APP_CLIENT_API_BASE || "http://localhost:6001";
const LLM_API_BASE =
  process.env.REACT_APP_LLM_API_BASE || "http://localhost:7001";
const AUTH_API_BASE =
  process.env.REACT_APP_AUTH_API_BASE || "http://localhost:9001";

// Main application
/*
Input: None
Output: Rendered App component
*/ 
function App() {
  const [events, setEvents] = useState([]); // hold events
  const [loading, setLoading] = useState(true); // track loading status
  // === Sprint 3: Auth state (in-memory JWT) ===
  const [authToken, setAuthToken] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

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
      const res = await fetch(`${LLM_API_BASE}/api/llm/parse`, {
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
      const res = await fetch(`${LLM_API_BASE}/api/llm/confirm`, {
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

  // === Sprint 3: User Authentication (Task 1) ===
  // Register new user via user-authentication service
  async function handleRegister(e) {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch(`${AUTH_API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Show a clearer message when registration fails (e.g., password too short)
        setAuthError("Password must be at least 6 characters");
        return;
      }
      // Optionally auto-fill login email and clear password
      setLoginEmail(registerEmail);
      setRegisterPassword("");
      alert("Registration successful. You can now log in.");
    } catch (err) {
      setAuthError("Registration error");
    }
  }

  // Login and store token in memory
  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Login failed");
        return;
      }
      setAuthToken(data.token);
      setCurrentUserEmail(data.user.email);
      setLoginPassword("");
    } catch (err) {
      setAuthError("Login error");
    }
  }

  function handleLogout() {
    setAuthToken(null);
    setCurrentUserEmail(null);
    setAuthError("");
    setLoginEmail("");
    setLoginPassword("");
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
    fetch(`${CLIENT_API_BASE}/api/client/events`) // Fetch events from client service
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
      const res = await fetch(`${CLIENT_API_BASE}/api/client/purchase`, { // POST to purchase endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ eventId, quantity: 1 }),
      });
      if (!res.ok) { // If response not ok
        const err = await res.json().catch(() => ({})); //parse error message
        if (res.status === 401) {
          alert("Session expired or not logged in. Please log in again.");
          handleLogout();
        }
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
    {/* === Sprint 3: Auth UI (in-memory JWT) === */}
    <section
      aria-labelledby="auth-heading"
      style={{
        border: "1px solid #ddd",
        padding: "12px",
        marginBottom: "16px",
        borderRadius: "8px",
      }}
    >
      <h2 id="auth-heading">Account</h2>

      {currentUserEmail ? (
        <>
          <p>
            Logged in as <strong>{currentUserEmail}</strong>
          </p>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <div className="auth-forms">
          {/* Login form */}
          <form onSubmit={handleLogin}>
            <h3>Login</h3>
            <div>
              <label htmlFor="login-email">Email:</label>{" "}
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="login-password">Password:</label>{" "}
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Login</button>
          </form>

          {/* Register form */}
          <form onSubmit={handleRegister}>
            <h3>Register</h3>
            <div>
              <label htmlFor="register-email">Email:</label>{" "}
              <input
                id="register-email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="register-password">Password:</label>{" "}
              <input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Register</button>
          </form>
        </div>
      )}

      {authError && (
        <p role="alert" style={{ color: "red", marginTop: "8px" }}>
          {authError}
        </p>
      )}
    </section>
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