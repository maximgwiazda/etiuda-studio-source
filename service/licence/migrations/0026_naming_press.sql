-- THE NAMED PERSON'S OWN PRESS (board 1011; Claude alpha's decision of 2026-11-17 13:16, "until Studio has a press for a naming, which
-- replaces it"). A naming moves nobody by itself: a person holding a running trial of their own is moved onto the licence's lead seat only
-- when they press Accept in their own Studio (core.mjs lead/accept). `accepted_at` is that press (NULL until it), and `blocked_at` the press
-- that found no lead seat free, which the owner reads and which asks the person again once a seat is free. Every naming made before this
-- migration is marked accepted at the instant it was named, so nobody already placed by one is changed. Its undo, applied by hand only, is
-- service/licence/undo/0026_naming_press.sql.
ALTER TABLE lead_names ADD COLUMN accepted_at INTEGER;
ALTER TABLE lead_names ADD COLUMN blocked_at INTEGER;
UPDATE lead_names SET accepted_at = at;
