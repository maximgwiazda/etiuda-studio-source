-- THE UNDO OF migrations/0029_pay_parts.sql, kept outside migrations/ so no deploy applies it; run by hand only, with the Worker from
-- before it deployed again, which reads none of the six columns. It drops the six columns, and nothing else.
ALTER TABLE orders DROP COLUMN given_back;
ALTER TABLE orders DROP COLUMN ends;
ALTER TABLE orders DROP COLUMN desk_added;
ALTER TABLE orders DROP COLUMN lead_added;
ALTER TABLE orders DROP COLUMN part_of;
ALTER TABLE orders DROP COLUMN sub;
