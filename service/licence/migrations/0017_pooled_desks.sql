-- POOLED DESKS (decision 49, section 12.2 point 3): what schema.sql now holds, added to a database 0009_retention.sql left. A desk
-- on a non-persistent virtual desktop makes a new key each morning; its sign-in says so, and the person's pooled desks then hold
-- one place among their three between them. Every desk kept before this is an ordinary one.
-- Numbered 0017 because 0010 to 0014 are the service branch's (studio-managed-service-2026-11-13), 0015 the relay seats' and 0016 the
-- erasure's, so the branches land in any order.
-- tests/licence-service.mjs s49 holds 0001 to 0009 and 0017 to schema.sql's tables, columns and indexes.
ALTER TABLE desk_keys ADD COLUMN pooled INTEGER NOT NULL DEFAULT 0 CHECK (pooled IN (0, 1));
-- A desk's pooled claim is honoured only on a licence its attach allowed (attach-seats.mjs --non-persistent): elsewhere it is an
-- ordinary desk, so the claim cannot lift the per-person cap. Every licence kept before this allows none.
ALTER TABLE licences ADD COLUMN pooled_ok INTEGER NOT NULL DEFAULT 0 CHECK (pooled_ok IN (0, 1));
