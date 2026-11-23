-- AN ADMISSION EACH LEAD'S OWN (decision 27 (a), Claude alpha's, 2026-11-11 08:42 and 08:44): what schema.sql now holds, added to
-- a database 0006_signout_list.sql left. An admission by name made before this has no lead recorded beside it, and any lead of
-- the licence withdraws it, as before.
-- tests/licence-service.mjs s49 holds 0001 to 0007 to schema.sql's tables, columns and indexes.
CREATE TABLE IF NOT EXISTS admitted_by (
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  lead TEXT NOT NULL,
  PRIMARY KEY (licence, person, lead)
);
