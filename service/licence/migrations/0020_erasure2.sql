-- Second erasure review (2026-11-15): mark kept payer rows when erasure finishes (finding 8).
ALTER TABLE persons ADD COLUMN erased_at INTEGER NOT NULL DEFAULT 0;
