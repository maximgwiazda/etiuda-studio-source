-- THE DESKS A PERSON'S DESK SEAT IS HELD FROM (board 980, stage 3): what schema.sql now holds, added to a database 0002_signin.sql
-- left. Nothing kept before it changes: a desk seat already held has no desk recorded until its lead next forwards it.
-- tests/licence-service.mjs s49 holds 0001, 0002 and 0003 to schema.sql's tables, columns and indexes.
CREATE TABLE IF NOT EXISTS desk_keys (
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  desk_key TEXT NOT NULL,
  seen_at INTEGER NOT NULL,
  PRIMARY KEY (licence, person, desk_key)
);
