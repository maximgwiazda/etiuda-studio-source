-- THE DOORS (board 980, the door-finding; Max, 2026-11-12 18:46 and 18:57): what schema.sql now holds, added to a database
-- 0007_admitted_by.sql left. Per licence and per lead key, each relay team's door: its team id and relay team id, the relay's
-- address, and the lead's two public keys (the signing key by its canonical id, and the box), stamped with the set's t.
-- tests/licence-service.mjs s49 holds 0001 to 0008 to schema.sql's tables, columns and indexes.
CREATE TABLE IF NOT EXISTS doors (
  licence INTEGER NOT NULL REFERENCES licences (id),
  lead TEXT NOT NULL,
  team TEXT NOT NULL,
  rt TEXT NOT NULL,
  url TEXT NOT NULL,
  key_id TEXT NOT NULL,
  box TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (licence, lead, team)
);
CREATE INDEX IF NOT EXISTS doors_by_licence ON doors (licence);
