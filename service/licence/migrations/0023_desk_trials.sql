-- TWO TRIALS PER PERSON (board 1011; Max, 2026-11-17 13:20: "14 dayd trial should be separate for desk and for studio"). A desk's own trial
-- is had under the unit "desk:" and the person (core.mjs DESK_TRIAL), Studio's under "person:" as before. A desk-only trial kept under
-- "person:", running or ended, moves to "desk:", so its person's Studio sign-in starts Studio's own trial instead of meeting the unit taken,
-- and the desk trial stays had once. Rows only, and only those: no table, column or index changes, so schema.sql is as it was.
-- Applied before the Worker that reads "desk:" is deployed. Its undo, applied by hand only, is service/licence/undo/0023_desk_trials.sql.

UPDATE licences SET trial_unit = 'desk:' || substr(trial_unit, 8)
  WHERE desk_only = 1 AND trial_ends IS NOT NULL AND substr(trial_unit, 1, 7) = 'person:';
