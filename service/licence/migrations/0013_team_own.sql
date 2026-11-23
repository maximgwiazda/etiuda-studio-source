-- A TEAM IS ITS LEAD'S OWN (board 1000; decision 47, held for Max's ruling). A lead seat goes only to the owner and to a person the
-- owner named (lead_names, core.mjs lead/name); the owner's switch, org_desks, says whether colleagues' desks are seated by the
-- organisation admission (1) or only people admitted by name are (0, the default core.mjs ORG_DESKS_DEFAULT writes on a licence
-- the attach or a payment makes). A licence kept before this keeps today's rule (1), and every lead seat held on a paid licence
-- today and not freed is named by its owner, so nobody loses a seat.

CREATE TABLE IF NOT EXISTS lead_names (
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  named_by TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (licence, person)
);
CREATE INDEX IF NOT EXISTS lead_names_by_person ON lead_names (person);

ALTER TABLE licences ADD COLUMN org_desks INTEGER NOT NULL DEFAULT 0 CHECK (org_desks IN (0, 1));
UPDATE licences SET org_desks = 1;

INSERT INTO lead_names (licence, person, named_by, at)
  SELECT s.licence, s.person, COALESCE(l.owner, 'migration'), CAST(strftime('%s', 'now') AS INTEGER) * 1000 FROM seats s JOIN licences l ON l.id = s.licence
  WHERE s.kind = 'lead' AND s.proved_at > 0 AND l.trial_ends IS NULL AND l.desk_only = 0 AND l.owner IS NOT s.person
  ON CONFLICT DO NOTHING;
