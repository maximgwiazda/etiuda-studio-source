-- SIGN-IN HARDENED (board 980, stage H; Claude alpha's decision 15): what schema.sql now holds, added to a database 0003_desk_keys.sql
-- left. A seat kept before it counts as proved when it was last seen, so nobody is asked to sign in again at once; its code is
-- made at its person's next sign-in or quiet check. A licence kept before it has no owner.
-- The admits rows of a tenant or a domain made before it hold the organisation's plain hash, which the service no longer reads:
-- they were made on staging only, and nobody holds one, so those organisations are attached again by scripts/attach-seats.mjs.
-- tests/licence-service.mjs s49 holds 0001 to 0004 to schema.sql's tables, columns and indexes.
ALTER TABLE seats ADD COLUMN proved_at INTEGER NOT NULL DEFAULT 0;
UPDATE seats SET proved_at = seen_at;
ALTER TABLE seats ADD COLUMN code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS seats_one_code ON seats (code) WHERE code IS NOT NULL;

ALTER TABLE licences ADD COLUMN owner TEXT;

CREATE TABLE IF NOT EXISTS orders (
  tag TEXT PRIMARY KEY,
  run TEXT NOT NULL,
  at INTEGER NOT NULL
);
