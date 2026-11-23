-- THE UNDO OF migrations/0025_seat_stays.sql, kept outside migrations/ so no deploy applies it; run by hand only, with the Worker from
-- before seat stays deployed again, which reads nothing of this table. It drops the table and its index, and nothing else.
DROP INDEX IF EXISTS seat_stays_by_licence;
DROP TABLE IF EXISTS seat_stays;
