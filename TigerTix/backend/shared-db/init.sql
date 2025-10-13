
-- Events created by the Admin microservice
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,                        -- ISO 8601 format for example: (2025-10-10) 
  total_tickets INTEGER NOT NULL CHECK (total_tickets >= 0),
  tickets_available INTEGER NOT NULL CHECK (tickets_available >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, date)                         -- no duplicate events with same name and date
);
