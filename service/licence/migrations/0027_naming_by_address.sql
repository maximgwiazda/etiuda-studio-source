-- A LEAD NAMED BY ADDRESS, WITH THE SAFEGUARD (board 1017; Max's ruling of 2026-11-20 22:16, "I definitely agree.", to a naming by email address
-- and the named person's own Accept with no code; Claude alpha's word of 2026-11-22 00:57, the criterion: "nobody is ever seated, as a lead or
-- on a desk, on the strength of an address the provider does not vouch", and rule 5: "The address is not kept in clear for thirty days if a
-- keyed hash can do the matching"). Two tables, new, and two kinds of row that the code since this migration can no longer read:
--   lead_invites     an address the licence's owner named to a lead seat (core.mjs lead/invite), kept as a keyed hash of the
--                    service's fold of it (core.mjs addressKeyed), never the address; one per address per licence; INVITE_DAYS.
--   lead_candidates  a person who pressed Accept on a naming whose address their provider did not vouch (core.mjs lead/accept), waiting for
--                    the owner's confirmation (lead/confirm), with their provider and account kind ("work" or "personal"), which the owner
--                    is shown beside their name. Gone with the naming.
--   invites.address  holds the same keyed hash from now on. An invitation kept before this migration holds an address in the clear, which
--                    no sign-in can match any more; it is deleted here rather than kept in the clear for the rest of its INVITE_DAYS.
--   asks             an open ask marked unconfirmed was written by a sign-in, the person pressing nothing; the code now writes one only at
--                    the person's own Join press (core.mjs askOrTake), so one written before is deleted here: it would show a lead a
--                    person's name they never agreed to send. The person's next Join writes it again, by their own press.
-- No client called invite, ask or person/admit by ask before this migration (board 1017's read of 2026-11-22), so both deletions are
-- expected to touch no row. Its undo, applied by hand only, is service/licence/undo/0027_naming_by_address.sql; the deleted rows are not
-- restored by it.
-- persons.domain is the verified domain of a work account, where its provider gives one (Microsoft only beside xms_edov true, Google its hd),
-- kept and cleared with the name and the address, so an owner or a lead tells apart two people who claim one address (Claude alpha's word of
-- 2026-11-22, carried by Claudius).
ALTER TABLE persons ADD COLUMN domain TEXT;
DELETE FROM invites WHERE NOT (length(address) = 64 AND address NOT GLOB '*[^0-9a-f]*');
DELETE FROM asks WHERE source = 'unconfirmed' AND state = 'open';

CREATE TABLE IF NOT EXISTS lead_invites (
  licence INTEGER NOT NULL REFERENCES licences (id),
  address TEXT NOT NULL,
  named_by TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (licence, address)
);
CREATE INDEX IF NOT EXISTS lead_invites_by_address ON lead_invites (address, at);

CREATE TABLE IF NOT EXISTS lead_candidates (
  licence INTEGER NOT NULL REFERENCES licences (id),
  address TEXT NOT NULL,
  person TEXT NOT NULL,
  provider TEXT NOT NULL,
  account TEXT NOT NULL CHECK (account IN ('work', 'personal')),
  at INTEGER NOT NULL,
  PRIMARY KEY (licence, address, person)
);
CREATE INDEX IF NOT EXISTS lead_candidates_by_person ON lead_candidates (person);
