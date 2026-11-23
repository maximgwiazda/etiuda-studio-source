-- THE PERSON'S OWN SIGN-IN (board 980; Claude alpha's night decision 18): what schema.sql now holds, added to a database
-- 0004_hardening.sql left. Each lead seat's code becomes its person's, kept in persons; a desk-only licence is marked by a column
-- of its own, since SQLite cannot alter lead_seats' CHECK in place; the desks a person signed in from start empty, so a desk
-- forwarded by its lead before this signs in once by itself before its renewal is taken.
-- tests/licence-service.mjs s49 holds 0001 to 0005 to schema.sql's tables, columns and indexes.
ALTER TABLE licences ADD COLUMN desk_only INTEGER NOT NULL DEFAULT 0 CHECK (desk_only IN (0, 1));

CREATE TABLE IF NOT EXISTS persons (
  person TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  made INTEGER NOT NULL
);
INSERT INTO persons (person, provider, code, made) SELECT person, provider, code, seated_at FROM seats
  WHERE kind = 'lead' AND code IS NOT NULL ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS person_desks (
  person TEXT NOT NULL,
  desk_key TEXT NOT NULL,
  signed_at INTEGER NOT NULL,
  PRIMARY KEY (person, desk_key)
);
