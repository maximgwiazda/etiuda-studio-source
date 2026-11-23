-- Payments (the Paddle design of 2026-11-13, B1; core.mjs hands POST <API_PREFIX>paddle to paddle.mjs). Each notification Paddle
-- sent, once, with what became of it ("held:<reason>", which writes nothing else, "refund-one-source" and "zero-total:<discount id>" are listed for Max); and what each subscription contributes to its licence,
-- so a licence's seats are those attached by hand plus each subscription's, and a cancel or a refund takes off its own alone.

-- How far payments other than Paddle's cover each licence: until now every paid licence's date came from an invoice or a purchase.
ALTER TABLE licences ADD COLUMN invoiced_until INTEGER;
ALTER TABLE licences ADD COLUMN invoiced_updates_until TEXT;
UPDATE licences SET invoiced_until = paid_until, invoiced_updates_until = updates_until WHERE trial_ends IS NULL;

CREATE TABLE IF NOT EXISTS paddle_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  outcome TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS paddle_events_by_at ON paddle_events (at);

CREATE TABLE IF NOT EXISTS paddle_subs (
  sub TEXT PRIMARY KEY,
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  lead_seats INTEGER NOT NULL CHECK (lead_seats >= 0),
  seats INTEGER NOT NULL CHECK (seats >= 0),
  paid_until INTEGER NOT NULL,
  status TEXT NOT NULL,
  txn TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS paddle_subs_by_licence ON paddle_subs (licence);
