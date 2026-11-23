-- THE UNDO OF migrations/0028_buyer_facts.sql, kept outside migrations/ so no deploy applies it; run by hand only, with the Worker from
-- before it deployed again, which reads none of the three columns. It drops the two indexes and the three columns, and nothing else.
DROP INDEX IF EXISTS pay_events_by_sub;
DROP INDEX IF EXISTS pay_events_by_person;
ALTER TABLE pay_events DROP COLUMN person;
ALTER TABLE pay_events DROP COLUMN sub;
ALTER TABLE pay_events DROP COLUMN act;
