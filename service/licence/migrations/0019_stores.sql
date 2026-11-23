-- A PERSON'S STORE (section 14.12): the relay team holding a person's own synced copy, so the service can end it. The person keyed as
-- seats keeps them, their code (as persons keeps it, in the clear) for the store-end notice, the store's lead key S's public half, and
-- the licence of a company store (null for the person's own). An ended row stays only until the relay takes its notice.
-- Numbered 0019 after the pooled desks' freed list (0018).
CREATE TABLE IF NOT EXISTS stores (
  rt TEXT PRIMARY KEY,
  person TEXT NOT NULL,
  code TEXT NOT NULL,
  lead TEXT NOT NULL,
  licence INTEGER,
  made_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS stores_by_person ON stores (person);
