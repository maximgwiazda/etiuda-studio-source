-- A LEAD KEY THAT HELD ENTRA SEATS FOR A TEAM (decision 49, option (b); the test architect's hole of 2026-11-13): the key, the licence
-- whose seats its grants last carried, when, and whether Max released its teams by hand (scripts/release-seats.mjs). While that
-- licence runs (not refunded, paid until after now) and it is not released, the key is given no grant without seats; once the licence
-- ends, or it is released, its grants carry the signed release instead, which alone lifts a team's gate at the relay. A grant with
-- seats again sets released back to 0. The row stays.

CREATE TABLE IF NOT EXISTS entra_keys (
  lead TEXT PRIMARY KEY,
  licence INTEGER NOT NULL REFERENCES licences (id),
  at INTEGER NOT NULL,
  released INTEGER NOT NULL DEFAULT 0
);
