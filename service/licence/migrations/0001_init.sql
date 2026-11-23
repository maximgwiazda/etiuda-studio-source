-- THE LICENCE SERVICE'S D1 (board 936, S4). S5 turns this into migrations and binds it; the statements that DECIDE who
-- holds what (a trial once, a seat, a binding, a release, a code's try) are core.mjs's, each one statement or one batch,
-- and the constraints below are what make them decisions rather than a read and then a write (the test architect's A4).
-- No address, no name and no IP is kept in the clear, the outbox apart (below). A hash of an address, a domain, an IP, a
-- code or a request is HMAC-SHA-256 under the Worker secret HASH_KEY over a line naming what it hashes, so a leaked table
-- cannot be read back by hashing guesses and one kind of hash never stands for another (core.mjs, KEYED HASHES; the test
-- architect's C1 on S4); a purchase key's is plain SHA-256, the key being 160 random bits.

-- A purchase: the key from the receipt and the purchase address, as hashes (an address the staging script wrote, which
-- holds no HASH_KEY, is "unkeyed:" and its plain hash until the service first meets it and keys it); the organisation the licence names; seats
-- (a count, never names: settlement 2); the day its updates end; the instant its relay service is paid until (ms); and
-- whether it was refunded, which a chief's script marks by hand on staging (S5).
CREATE TABLE IF NOT EXISTS licences (
  id INTEGER PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  email_hash TEXT NOT NULL,
  org TEXT NOT NULL CHECK (length(org) > 0),
  seats INTEGER NOT NULL CHECK (seats >= 1),
  updates_until TEXT NOT NULL,
  paid_until INTEGER NOT NULL,
  refunded INTEGER NOT NULL DEFAULT 0 CHECK (refunded IN (0, 1))
);
CREATE INDEX IF NOT EXISTS licences_by_email ON licences (email_hash);

-- A Studio key bound to a licence. A key is bound once, to one licence (the primary key); a licence holds at most its
-- seats times three keys, decided inside the binding statement; seen_at is the key's last quiet check, so the key unseen
-- for longest is the one a full licence releases (the test architect's A1).
CREATE TABLE IF NOT EXISTS bindings (
  lead TEXT PRIMARY KEY,
  licence INTEGER NOT NULL REFERENCES licences (id),
  bound_at INTEGER NOT NULL,
  seen_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bindings_by_licence ON bindings (licence, seen_at);

-- A key a full licence released to bind another, with the instant; at most as many in any 30 days as the licence binds.
-- `token` names the batch that released it, so the batch deletes the binding it released and no other.
CREATE TABLE IF NOT EXISTS releases (
  licence INTEGER NOT NULL,
  lead TEXT NOT NULL,
  at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS releases_by_licence ON releases (licence, at);
CREATE INDEX IF NOT EXISTS releases_by_lead ON releases (lead);

-- A trial: the address's identity hash (one trial per address), the company domain's hash (one per domain; NULL for a
-- public mail provider, which is judged per address alone: the test architect's A2), the lead key it was confirmed for
-- (one trial per key), its start and its end (ms).
CREATE TABLE IF NOT EXISTS trials (
  identity TEXT PRIMARY KEY,
  domain TEXT,
  lead TEXT NOT NULL UNIQUE,
  started INTEGER NOT NULL,
  ends INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS trials_one_per_domain ON trials (domain) WHERE domain IS NOT NULL;

-- An emailed code, as its hash, per address and purpose; it dies at `expires` or after five tries, counted before the
-- comparison, and it is spent by the one statement that deletes it.
CREATE TABLE IF NOT EXISTS codes (
  email_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('activate', 'trial')),
  code_hash TEXT NOT NULL,
  made INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  tries INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email_hash, purpose)
);

-- THE SEAM'S STAND-IN, and the one table that holds an address and a code in the clear: what a sender would send, kept
-- until it is sent. No sender exists (outward, Maxim's), so on staging a chief reads the code here; a row lives no longer
-- than its code.
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY,
  to_addr TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code TEXT,
  made INTEGER NOT NULL
);

-- The team proof keys a lead registered at a quiet check: a desk of the team signs the grant fetch with one.
CREATE TABLE IF NOT EXISTS proofs (
  lead TEXT NOT NULL,
  proof TEXT NOT NULL,
  PRIMARY KEY (lead, proof)
);

-- Rate limits: a count per bucket (a route and an address, a lead or an IP's hash) per hour.
CREATE TABLE IF NOT EXISTS hits (
  bucket TEXT NOT NULL,
  slot INTEGER NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (bucket, slot)
);

-- Signed requests already answered, by the hash of their bytes, kept past the skew so a replay is refused.
CREATE TABLE IF NOT EXISTS seen (
  digest TEXT PRIMARY KEY,
  until INTEGER NOT NULL
);
