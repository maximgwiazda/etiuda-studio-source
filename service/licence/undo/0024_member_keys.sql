-- THE UNDO OF migrations/0024_member_keys.sql, kept outside migrations/ so no deploy applies it; run by hand only, with the Worker from
-- before the member mark deployed again, which reads nothing of this table. It drops the table and its index, and nothing else.
DROP INDEX IF EXISTS member_keys_by_person;
DROP TABLE IF EXISTS member_keys;
