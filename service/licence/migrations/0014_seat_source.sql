-- A MANAGED INSTALLATION (decision 49, held for Max's ruling; section 11 of the lead engineer's design of 2026-11-13). Who holds a
-- licence's seats: "admit", as every licence before this does (admission by code, the owner's naming and switch), or "entra", the app
-- roles the organisation's administrator assigns in Microsoft Entra and the ID token carries (core.mjs, ENTRA_PROOF_DAYS). Only
-- scripts/attach-seats.mjs --entra-roles sets "entra", on an invoiced licence of a Microsoft tenant; nothing self-serve does.

ALTER TABLE licences ADD COLUMN seat_source TEXT NOT NULL DEFAULT 'admit' CHECK (seat_source IN ('admit', 'entra'));
-- When it turned "entra" (ms), by the attach that turned it: a licence its tenant's person bought on their own before then stays theirs
-- while their token carries no role (Claude alpha, 2026-11-13 21:34, "Nobody loses what they paid for"; core.mjs ownBefore).
ALTER TABLE licences ADD COLUMN entra_at INTEGER;
