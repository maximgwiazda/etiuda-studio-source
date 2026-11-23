-- A PERSON'S RECORDS HAVE A STATED END (section 13 of the licence design; Claude alpha's decision 50). removals stamps a person's seat
-- of a kind on a licence when it is freed or withdrawn, and core.mjs purgeRetention takes their rows there REMOVAL_DAYS later;
-- erasures names, for ERASURE_DAYS, the desks of a person who asked to be erased to the leads of each licence they were on; orders
-- gain revenue_year (which the purge counts ORDER_RETENTION_YEARS from) and licence (recorded by every post-0016 writer, backfilled
-- where licences.key_hash = orders.tag, NULL for pre-0016 raises or orders whose licence is gone; no FK because licences are purged
-- RETENTION_DAYS after end while orders stay ORDER_RETENTION_YEARS after revenue_year).
-- Pre-0016 orders.revenue_year rule (Claude alpha's ruling 2, 2026-11-16):
--   1. Where orders.licence matches a paid licence (l.id = orders.licence AND l.trial_ends IS NULL), revenue_year is
--      MAX(year(at), year(l.paid_until)), exact when that licence was never raised to a later year after the order and cautious
--      (never earlier than attach.mjs revenue()) when it was, because pre-0016 paid_until never shrank.
--   2. Where orders.licence is NULL (its licence cannot be known: a pre-0016 raise, or an order with no matching licence row),
--      it takes the latest year any licence's end could give it: MAX(year(at) + 1, MAX(year(paid_until)) over all paid licences
--      currently in licences where trial_ends IS NULL, or 0 if none exists). year(at) + 1 guards a one-year order whose licence
--      was already purged before 0016.
-- purge_holds holds a purge Max alone sets (scripts/purge-hold.mjs). Every seat freed before this, its person not the licence's
-- owner, counts its days from now.

CREATE TABLE IF NOT EXISTS removals (
  licence INTEGER NOT NULL,
  person TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('lead', 'desk')),
  at INTEGER NOT NULL,
  PRIMARY KEY (licence, person, kind)
);
CREATE INDEX IF NOT EXISTS removals_by_at ON removals (at);

CREATE TABLE IF NOT EXISTS erasures (
  licence INTEGER NOT NULL,
  desk_key TEXT NOT NULL,
  until INTEGER NOT NULL,
  PRIMARY KEY (licence, desk_key)
);

CREATE TABLE IF NOT EXISTS purge_holds (
  scope TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  since INTEGER NOT NULL
);

ALTER TABLE orders ADD COLUMN revenue_year INTEGER;
ALTER TABLE orders ADD COLUMN licence INTEGER;
UPDATE orders SET licence = (SELECT l.id FROM licences l WHERE l.key_hash = orders.tag) WHERE licence IS NULL;
UPDATE orders SET revenue_year = MAX(
  CAST(strftime('%Y', at / 1000, 'unixepoch') AS INTEGER) + CASE WHEN EXISTS (SELECT 1 FROM licences l WHERE l.id = orders.licence AND l.trial_ends IS NULL) THEN 0 ELSE 1 END,
  COALESCE(
    (SELECT CAST(strftime('%Y', l.paid_until / 1000, 'unixepoch') AS INTEGER) FROM licences l WHERE l.id = orders.licence AND l.trial_ends IS NULL),
    (SELECT MAX(CAST(strftime('%Y', l.paid_until / 1000, 'unixepoch') AS INTEGER)) FROM licences l WHERE l.trial_ends IS NULL),
    0
  )
) WHERE revenue_year IS NULL; -- plant:backfill-orders-year

INSERT INTO removals (licence, person, kind, at)
  SELECT s.licence, s.person, s.kind, CAST(strftime('%s', 'now') AS INTEGER) * 1000 FROM seats s JOIN licences l ON l.id = s.licence
  WHERE s.proved_at = 0 AND l.owner IS NOT s.person
  ON CONFLICT DO NOTHING;
