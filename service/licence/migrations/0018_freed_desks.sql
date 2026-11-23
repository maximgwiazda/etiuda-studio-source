-- THE POOLED DESKS FREED (decision 49, option (b) with (d); Claude alpha's ruling of 2026-11-14): a pooled desk whose place the
-- service freed on a licence whose seats follow Entra, by its key, and when. A licence's grants name its rows newest first, at most
-- FREED_MAX, and the relay refuses each named desk outright whatever its certificate or the 72-hour grace (relay/core.cjs seatGate). A
-- row older than FREED_SPAN_MS (the longest such a desk's certificate runs, and the grace after it) goes at the next grant; a desk
-- seated again is no longer named. The writer of a row is section 12's pooled replacement (σ‴'s takeSeat, plant:pooled-free), which
-- records the keys it frees in the same batch once the two branches meet.
-- Numbered 0018 because 0016 is the erasure's and 0017 the pooled desks' (studio-managed-policy-2026-11-13), so the branches land in
-- any order.
CREATE TABLE IF NOT EXISTS freed_desks (
  licence INTEGER NOT NULL REFERENCES licences (id),
  desk_key TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (licence, desk_key)
);
CREATE INDEX IF NOT EXISTS freed_desks_by_at ON freed_desks (at);
