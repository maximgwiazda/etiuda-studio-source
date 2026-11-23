-- THE UNDO OF migrations/0027_naming_by_address.sql, kept outside migrations/ so no deploy applies it; run by hand only, with the Worker from
-- before it deployed again, which reads neither table. It drops the two tables and the persons.domain column, and nothing else. The rows 0027 deleted (invitations
-- holding an address in the clear, and open asks a sign-in wrote unconfirmed) are not restored; an invitation the newer Worker kept holds a
-- keyed hash, which the older Worker reads as an address no sign-in matches, so it waits out its days.
ALTER TABLE persons DROP COLUMN domain;
DROP TABLE IF EXISTS lead_candidates;
DROP TABLE IF EXISTS lead_invites;
