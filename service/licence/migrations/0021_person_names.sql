-- WHAT THE SERVICE KEEPS OF A PERSON (the one act of acceptance, part S1; option A, Max, 2026-11-16 21:21: "Let's go with A for now.
-- It's simpler and more robust."). Four columns on persons, each NULL or 0 on every row kept before this, so no row is lost or changed:
-- the person's name and address as their provider gave them at their last sign-in or proof, whether the provider vouched the address
-- (Google's email_verified; Microsoft vouches for neither of its address claims), and when a sign-in last wrote them (ms). core.mjs keeps
-- nothing of a person whose seats follow Entra, clears them 30 days after the last sign-in for someone nobody accepted (purgeRetention,
-- NAMES_DAYS) and at erasure (erase.mjs), and they go with the row.

ALTER TABLE persons ADD COLUMN name TEXT;
ALTER TABLE persons ADD COLUMN address TEXT;
ALTER TABLE persons ADD COLUMN vouched INTEGER CHECK (vouched IN (0, 1));
ALTER TABLE persons ADD COLUMN signed_at INTEGER NOT NULL DEFAULT 0;
