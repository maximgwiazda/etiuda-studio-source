-- One payment core for every provider (Claude alpha's decision 48, 2026-11-13): 0010's Paddle tables become the provider-neutral
-- pay_events and pay_subs, each keyed by provider and its own id, since two providers' ids may share a shape. Every row 0010 kept is
-- Paddle's.

CREATE TABLE IF NOT EXISTS pay_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  outcome TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (provider, event_id)
);
INSERT INTO pay_events (provider, event_id, type, occurred_at, outcome, at) SELECT 'paddle', event_id, type, occurred_at, outcome, at FROM paddle_events;
DROP TABLE paddle_events;
CREATE INDEX IF NOT EXISTS pay_events_by_at ON pay_events (at);

CREATE TABLE IF NOT EXISTS pay_subs (
  provider TEXT NOT NULL,
  sub TEXT NOT NULL,
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  lead_seats INTEGER NOT NULL CHECK (lead_seats >= 0),
  seats INTEGER NOT NULL CHECK (seats >= 0),
  paid_until INTEGER NOT NULL,
  status TEXT NOT NULL,
  txn TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (provider, sub)
);
INSERT INTO pay_subs (provider, sub, licence, person, lead_seats, seats, paid_until, status, txn, updated_at)
  SELECT 'paddle', sub, licence, person, lead_seats, seats, paid_until, status, txn, updated_at FROM paddle_subs;
DROP TABLE paddle_subs;
CREATE INDEX IF NOT EXISTS pay_subs_by_licence ON pay_subs (licence);

-- Where a provider names the buyer only at checkout (Stripe's client_reference_id), the subscription's buyer code as the Checkout
-- Session gave it ('' where it gave none), and whether its link was Managed Payments, bound before the first payment is applied.
CREATE TABLE IF NOT EXISTS pay_binds (
  provider TEXT NOT NULL,
  sub TEXT NOT NULL,
  code TEXT NOT NULL,
  managed INTEGER NOT NULL DEFAULT 0 CHECK (managed IN (0, 1)),
  at INTEGER NOT NULL,
  PRIMARY KEY (provider, sub)
);
