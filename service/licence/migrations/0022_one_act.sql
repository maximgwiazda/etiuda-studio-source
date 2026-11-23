-- THE ONE ACT OF ACCEPTANCE (part S2; Max, 2026-11-16 21:14: "I want it to be one seamless step, optimally without any codes to write
-- down or share with other people"; the rulings of 22:15). Two tables and two columns, every one new or NULL on each row kept before this,
-- so no row is lost or changed:
--   asks     a signed-in person asking a lead of a licence (core.mjs ask), one open per person per licence (asks_one_open), 30 days
--            (ASK_DAYS); state open, offered (a lead accepted and it waits for the person's own press, because since asking they came to
--            hold something they did not leave by asking: `held`, what they held when they pressed, as core.mjs holdings names it),
--            accepted or refused; source "org" (asked from their organisation) or "unconfirmed" (an invitation whose address the
--            safeguard could not take, ruled a condition of the build at 22:15).
--   invites  an address a lead typed (core.mjs invite), kept in the clear, lower case, one per address per licence, 30 days
--            (INVITE_DAYS).
--   admitted_by.team  the team an admission placed the person on (a door's team id), so any Studio leading it can complete the place.
--   doors.label       the team's name, the organisation's own words, as its lead's Studio set it, for the leads a newcomer is shown.

CREATE TABLE IF NOT EXISTS asks (
  id TEXT PRIMARY KEY,
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  lead TEXT NOT NULL,
  team TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('desk', 'studio')),
  key TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('org', 'unconfirmed')),
  held TEXT NOT NULL DEFAULT '[]',
  at INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'offered', 'accepted', 'refused')),
  answered_at INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS asks_one_open ON asks (licence, person) WHERE state IN ('open', 'offered');
CREATE INDEX IF NOT EXISTS asks_by_licence ON asks (licence, state, at);
CREATE INDEX IF NOT EXISTS asks_by_person ON asks (person, at);

CREATE TABLE IF NOT EXISTS invites (
  licence INTEGER NOT NULL REFERENCES licences (id),
  address TEXT NOT NULL,
  lead TEXT NOT NULL,
  team TEXT,
  at INTEGER NOT NULL,
  PRIMARY KEY (licence, address)
);
CREATE INDEX IF NOT EXISTS invites_by_address ON invites (address, at);

ALTER TABLE admitted_by ADD COLUMN team TEXT;
ALTER TABLE doors ADD COLUMN label TEXT;
