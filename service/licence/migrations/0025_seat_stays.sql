-- WHO STAYS WHEN SEATS IN FORCE FALL BELOW THE SEATED (Claude alpha's ruling of 2026-11-18, the owner's to overturn).
-- One row per chosen staying person (same person key as seats.person) on a licence and seat kind ('lead' or 'desk'), ordered
-- oldest choice first (at ascending). Additive only: no existing table or row changes. Its undo, applied by hand only, is
-- service/licence/undo/0025_seat_stays.sql.
CREATE TABLE IF NOT EXISTS seat_stays (
  licence INTEGER NOT NULL REFERENCES licences (id),
  kind TEXT NOT NULL CHECK (kind IN ('lead', 'desk')),
  person TEXT NOT NULL,
  at INTEGER NOT NULL,
  by TEXT NOT NULL,
  PRIMARY KEY (licence, kind, person)
);
CREATE INDEX IF NOT EXISTS seat_stays_by_licence ON seat_stays (licence, kind, at);
