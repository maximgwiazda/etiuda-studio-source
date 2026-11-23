-- A STUDIO'S MEMBER KEY (the addendum on the member certificate; Claude alpha's decisions of 2026-11-17, Max's to overturn). One row per
-- Studio key (lead) and person: the member key standing for it (member), when that key was set (set_at, for the change's span), the
-- latest end of a certificate issued for it (until) and of the one key it replaced (was_until), so a person's live member keys are
-- counted from these rows alone (core.mjs memberCertificate). Not a column on bindings: a binding goes at its release while its
-- certificates live on, and a row here stays until both ends have passed (purgeRetention), or the person is erased.
-- A new table only, so no row kept before this changes. Numbered 0024 after the two trials (0023). Its undo, applied by hand only,
-- is service/licence/undo/0024_member_keys.sql.
CREATE TABLE IF NOT EXISTS member_keys (
  lead TEXT NOT NULL,
  person TEXT NOT NULL,
  member TEXT NOT NULL,
  set_at INTEGER NOT NULL,
  until INTEGER NOT NULL,
  was_until INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lead, person)
);
CREATE INDEX IF NOT EXISTS member_keys_by_person ON member_keys (person, until);
