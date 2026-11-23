-- THE UNDO OF migrations/0026_naming_press.sql, kept outside migrations/ so no deploy applies it; run by hand only, with the Worker from
-- before the press deployed again, which reads neither column. It drops the two columns, and nothing else.
ALTER TABLE lead_names DROP COLUMN blocked_at;
ALTER TABLE lead_names DROP COLUMN accepted_at;
