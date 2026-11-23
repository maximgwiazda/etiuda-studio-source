-- A DESK'S SIGN-OUT AND THE LEAD'S LIST (board 980; Claude alpha's night decision 20): what schema.sql now holds, added to a
-- database 0005_desks_own.sql left. A desk signed in before this has no organisation kept until its next interactive sign-in,
-- so no lead's list shows its person until then.
-- tests/licence-service.mjs s49 holds 0001 to 0006 to schema.sql's tables, columns and indexes.
ALTER TABLE person_desks ADD COLUMN org TEXT;
CREATE INDEX IF NOT EXISTS person_desks_by_key ON person_desks (desk_key);
CREATE INDEX IF NOT EXISTS person_desks_by_org ON person_desks (org, signed_at) WHERE org IS NOT NULL;
CREATE INDEX IF NOT EXISTS desk_keys_by_key ON desk_keys (desk_key);
