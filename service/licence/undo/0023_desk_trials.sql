-- THE UNDO OF migrations/0023_desk_trials.sql, kept outside migrations/ so no deploy applies it; run by hand only, with the Worker from before
-- the two trials deployed again. A desk-only trial under "desk:" goes back under "person:", the unit that Worker reads for both programs,
-- where no row holds that unit: a person who has since started Studio's trial under it keeps their desk trial under "desk:", which that
-- Worker never starts again and still finds by its owner, since the unique index licences_one_trial allows one row per unit. Exact for every
-- row 0023 moved while no Studio trial of the same person has been started since.

UPDATE licences SET trial_unit = 'person:' || substr(trial_unit, 6)
  WHERE desk_only = 1 AND trial_ends IS NOT NULL AND substr(trial_unit, 1, 5) = 'desk:'
  AND NOT EXISTS (SELECT 1 FROM licences o WHERE o.trial_unit = 'person:' || substr(licences.trial_unit, 6));
