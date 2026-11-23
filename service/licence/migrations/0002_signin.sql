-- SIGN-IN (board 980, stage 1): what schema.sql now holds, added to a database 0001_init.sql made. A licence row and a binding
-- kept before it stay as they were: lead_seats 1, no trial, a grace of 30 days, and no person behind a binding.
-- tests/licence-service.mjs s49 holds 0001 then 0002 to schema.sql's tables, columns and indexes.
ALTER TABLE licences ADD COLUMN lead_seats INTEGER NOT NULL DEFAULT 1 CHECK (lead_seats >= 1);
ALTER TABLE licences ADD COLUMN trial_ends INTEGER;
ALTER TABLE licences ADD COLUMN trial_unit TEXT;
ALTER TABLE licences ADD COLUMN grace_days INTEGER NOT NULL DEFAULT 30 CHECK (grace_days >= 1);
CREATE UNIQUE INDEX IF NOT EXISTS licences_one_trial ON licences (trial_unit) WHERE trial_unit IS NOT NULL;

ALTER TABLE bindings ADD COLUMN person TEXT;
CREATE INDEX IF NOT EXISTS bindings_by_person ON bindings (person) WHERE person IS NOT NULL;

CREATE TABLE IF NOT EXISTS admits (
  licence INTEGER NOT NULL REFERENCES licences (id),
  provider TEXT NOT NULL,
  org TEXT NOT NULL,
  PRIMARY KEY (licence, provider, org)
);
CREATE INDEX IF NOT EXISTS admits_by_org ON admits (provider, org);

CREATE TABLE IF NOT EXISTS seats (
  kind TEXT NOT NULL CHECK (kind IN ('lead', 'desk')),
  person TEXT NOT NULL,
  licence INTEGER NOT NULL REFERENCES licences (id),
  provider TEXT NOT NULL,
  org TEXT NOT NULL,
  tid TEXT,
  oid TEXT,
  seated_at INTEGER NOT NULL,
  seen_at INTEGER NOT NULL,
  PRIMARY KEY (kind, person)
);
CREATE INDEX IF NOT EXISTS seats_by_licence ON seats (licence, kind, seen_at);
