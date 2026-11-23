-- THE LICENCE SERVICE'S D1 (board 936, S4). S5 turns this into migrations and binds it; the statements that DECIDE who
-- holds what (a trial once, a seat, a binding, a release, a code's try) are core.mjs's, each one statement or one batch,
-- and the constraints below are what make them decisions rather than a read and then a write (the test architect's A4).
-- No IP is kept in the clear, and no address or person's name but a signed-in person's own name and address on persons (option A,
-- 2026-11-16 21:21) and the outbox (below). Kept in the clear: the organisation
-- a licence names (licences.org), an invoice's tag (orders) and each person's random sign-in code. A hash of an address, a
-- domain, an IP, a code or a request is HMAC-SHA-256 under the Worker secret HASH_KEY over a line naming what it hashes, so a
-- leaked table cannot be read back by hashing guesses and one kind of hash never stands for another (core.mjs, KEYED HASHES;
-- the test architect's C1 on S4); a purchase key's is plain SHA-256, the key being 160 random bits.

-- A purchase: the key from the receipt and the purchase address, as hashes (an address the staging script wrote, which
-- holds no HASH_KEY, is "unkeyed:" and its plain hash until the service first meets it and keys it); the organisation the licence names; seats
-- (a count, never names: settlement 2); the day its updates end; the instant its relay service is paid until (ms); and
-- whether it was refunded, which a chief's script marks by hand on staging (S5).
CREATE TABLE IF NOT EXISTS licences (
  id INTEGER PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  email_hash TEXT NOT NULL,
  org TEXT NOT NULL CHECK (length(org) > 0),
  seats INTEGER NOT NULL CHECK (seats >= 1),
  updates_until TEXT NOT NULL,
  paid_until INTEGER NOT NULL,
  refunded INTEGER NOT NULL DEFAULT 0 CHECK (refunded IN (0, 1)),
  -- Sign-in (board 980, stage 1; migrations/0002_signin.sql adds these to a database made before it). `seats` above counts
  -- desk seats, and lead_seats the leads with Studio, counted apart (the 99 and 249 zl prices); trial_ends is a sign-in
  -- trial's end (ms), NULL for a paid licence; trial_unit names what the trial was had by (core.mjs TRIAL_ONCE_PER), kept
  -- after an upgrade so it is had once; grace_days is how long a seat unseen still counts.
  lead_seats INTEGER NOT NULL DEFAULT 1 CHECK (lead_seats >= 1),
  trial_ends INTEGER,
  trial_unit TEXT,
  grace_days INTEGER NOT NULL DEFAULT 30 CHECK (grace_days >= 1),
  -- The licence's owner, a person as seats.person keeps one (migrations/0004_hardening.sql): a sign-in trial's is the person
  -- who started it, a paid licence's the person the attach script's --owner code names. NULL for a purchase-key licence.
  owner TEXT,
  -- A licence for its owner's desks alone (migrations/0005_desks_own.sql): no lead seat, whatever lead_seats holds (its CHECK
  -- cannot be altered in place), and it admits its owner only, found by `owner`, never through admits.
  desk_only INTEGER NOT NULL DEFAULT 0 CHECK (desk_only IN (0, 1)),
  -- Pooled desks allowed (migrations/0017_pooled_desks.sql, set by attach-seats.mjs --non-persistent): only here does a desk's
  -- pooled claim hold one place for the person's pooled desks; elsewhere it is an ordinary desk.
  pooled_ok INTEGER NOT NULL DEFAULT 0 CHECK (pooled_ok IN (0, 1)),
  -- Refund time (ms, migrations/0009_retention.sql): set on refund so retention purges twelve months after refund.
  refunded_at INTEGER,
  -- How far payments other than Paddle's cover the licence (ms, migrations/0010_paddle.sql): written by the attach (an invoice), 0 for
  -- a licence Paddle made, so a refund of one Paddle source recomputes paid_until from what still pays (paddle.mjs).
  invoiced_until INTEGER,
  -- The updates day the same payments cover (YYYY-MM-DD, migrations/0010_paddle.sql), recomputed beside it after such a refund.
  invoiced_updates_until TEXT,
  -- The owner's switch (migrations/0013_team_own.sql): 1 where colleagues' desks are seated by the organisation admission, 0 where
  -- only people admitted by name are (core.mjs deskLicence, licence/set).
  org_desks INTEGER NOT NULL DEFAULT 0 CHECK (org_desks IN (0, 1)),
  -- Who holds its seats (migrations/0014_seat_source.sql): "admit", admission by code, naming and the organisation (core.mjs), or
  -- "entra", the roles the organisation assigns in Microsoft Entra, set only by the attach script's --entra-roles.
  seat_source TEXT NOT NULL DEFAULT 'admit' CHECK (seat_source IN ('admit', 'entra')),
  -- When it turned "entra" (ms, migrations/0014_seat_source.sql): a licence bought on a person's own before then stays theirs (core.mjs ownBefore).
  entra_at INTEGER
);
CREATE INDEX IF NOT EXISTS licences_by_email ON licences (email_hash);
CREATE UNIQUE INDEX IF NOT EXISTS licences_one_trial ON licences (trial_unit) WHERE trial_unit IS NOT NULL;

-- A Studio key bound to a licence. A key is bound once, to one licence (the primary key); a licence holds at most its
-- seats times three keys, decided inside the binding statement; seen_at is the key's last quiet check, so the key unseen
-- for longest is the one a full licence releases (the test architect's A1).
CREATE TABLE IF NOT EXISTS bindings (
  lead TEXT PRIMARY KEY,
  licence INTEGER NOT NULL REFERENCES licences (id),
  bound_at INTEGER NOT NULL,
  seen_at INTEGER NOT NULL,
  -- The lead seat's person the key was bound through by sign-in (seats.person); NULL for a key a purchase key or code bound.
  person TEXT
);
CREATE INDEX IF NOT EXISTS bindings_by_licence ON bindings (licence, seen_at);
-- A lead key that held Entra seats for a team (migrations/0015_entra_keys.sql): given no grant without seats while that licence runs and
-- it is not released, and the signed release once it has ended or is released by hand.
CREATE TABLE IF NOT EXISTS entra_keys (
  lead TEXT PRIMARY KEY,
  licence INTEGER NOT NULL REFERENCES licences (id),
  at INTEGER NOT NULL,
  released INTEGER NOT NULL DEFAULT 0
);
-- A pooled desk the service freed on a licence whose seats follow Entra (migrations/0018_freed_desks.sql): named in that licence's grants
-- for FREED_SPAN_MS, so the relay refuses it outright whatever its certificate or the grace.
CREATE TABLE IF NOT EXISTS freed_desks (
  licence INTEGER NOT NULL REFERENCES licences (id),
  desk_key TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (licence, desk_key)
);
CREATE INDEX IF NOT EXISTS freed_desks_by_at ON freed_desks (at);
CREATE INDEX IF NOT EXISTS bindings_by_person ON bindings (person) WHERE person IS NOT NULL;

-- SIGN-IN (board 980, stage 1). Which organisations a licence admits: a provider's id and the organisation keyed under
-- HASH_KEY (a tenant or a domain, core.mjs KEYED.org, which the admin script learns through admin/org), "person:" and the
-- keyed hash of one person (a personal account is its own organisation, and a licence's owner is admitted so), or
-- "personal" (the lead may forward desks signed in with that provider's personal accounts).
CREATE TABLE IF NOT EXISTS admits (
  licence INTEGER NOT NULL REFERENCES licences (id),
  provider TEXT NOT NULL,
  org TEXT NOT NULL,
  PRIMARY KEY (licence, provider, org)
);
CREATE INDEX IF NOT EXISTS admits_by_org ON admits (provider, org);

-- WHICH LEAD ADMITTED A PERSON BY NAME (decision 27 (a); migrations/0007_admitted_by.sql): one row per lead whose person/admit
-- added or kept a "person:" row in admits, the person and the lead each keyed as seats.person keeps one. A lead's person/withdraw
-- takes away its own row, and the "person:" row goes only when no other lead holding a lead seat on the licence still has one.
CREATE TABLE IF NOT EXISTS admitted_by (
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  lead TEXT NOT NULL,
  -- The team the admission placed the person on, a door's team id (migrations/0022_one_act.sql; core.mjs placeStatements); NULL for one
  -- made before it or by code with none named.
  team TEXT,
  PRIMARY KEY (licence, person, lead)
);

-- WHO MAY HOLD A LEAD SEAT besides the owner (migrations/0013_team_own.sql): each person the owner named, by code, through
-- core.mjs lead/name, at most lead_seats with the owner counted. A tenant's admission seats desks, never leads.
CREATE TABLE IF NOT EXISTS lead_names (
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  named_by TEXT NOT NULL,
  at INTEGER NOT NULL,
  -- The named person's own press (migrations/0026_naming_press.sql; core.mjs lead/accept): accepted_at is their Accept, NULL until it;
  -- blocked_at their Accept that found no lead seat free. A naming moves nobody holding a running trial of their own until accepted.
  accepted_at INTEGER,
  blocked_at INTEGER,
  PRIMARY KEY (licence, person)
);
CREATE INDEX IF NOT EXISTS lead_names_by_person ON lead_names (person);

-- A person's seat, lead or desk, one of each kind per person (the primary key), on the licence it is on now: the person is
-- the keyed hash of the token's (iss, sub), and Entra's tid and oid sit beside it keyed (NULL for another provider); org is
-- the organisation that admitted it. A seat unseen for its licence's grace_days, or unproved for core.mjs PROOF_DAYS, stops
-- counting and stays while its licence lives, deleted with it by the retention purge; one freed or withdrawn goes REMOVAL_DAYS
-- after (removals), and every seat of a person who asks to be erased at once (core.mjs person/erase). proved_at is when the
-- provider last attested the person for this seat, 0 where its lead or the licence's owner freed it; a lead seat's code is its
-- person's pseudonym, random, one per person, kept as long as the seat.
CREATE TABLE IF NOT EXISTS seats (
  kind TEXT NOT NULL CHECK (kind IN ('lead', 'desk')),
  person TEXT NOT NULL,
  licence INTEGER NOT NULL REFERENCES licences (id),
  provider TEXT NOT NULL,
  org TEXT NOT NULL,
  tid TEXT,
  oid TEXT,
  seated_at INTEGER NOT NULL,
  seen_at INTEGER NOT NULL,
  proved_at INTEGER NOT NULL DEFAULT 0,
  code TEXT,
  PRIMARY KEY (kind, person)
);
CREATE INDEX IF NOT EXISTS seats_by_licence ON seats (licence, kind, seen_at);
CREATE UNIQUE INDEX IF NOT EXISTS seats_one_code ON seats (code) WHERE code IS NOT NULL;

-- An invoice the admin script attached (scripts/attach-seats.mjs; migrations/0004_hardening.sql), by its tag, with the run
-- that attached it: every statement of an attach acts only where its own run recorded the tag, so an order run twice
-- raises a licence once.
CREATE TABLE IF NOT EXISTS orders (
  tag TEXT PRIMARY KEY,
  run TEXT NOT NULL,
  at INTEGER NOT NULL,
  -- The year the order's revenue arose (migrations/0016_erase.sql): the attach's --revenue-year for an invoice, else the later of the
  -- order's year and its licence's end year, as its writer sets it. Kept to 31 December of it plus core.mjs ORDER_RETENTION_YEARS.
  revenue_year INTEGER,
  -- The licence this order created or raised (migrations/0016_erase.sql): recorded by every writer after 0016 and backfilled where
  -- licences.key_hash = tag; NULL only for pre-0016 raises or orders whose licence is gone. No FK: licences are purged earlier.
  licence INTEGER,
  -- What a provider's payment paid for, so a refund takes back exactly that (migrations/0029_pay_parts.sql; pay.mjs refund): the
  -- subscription, the payment that began the period it is a part of (its own id where it began one), the lead and desk seats it paid for
  -- (a period's payment its whole count, a rise inside a period what it added), the end it paid to, and 1 once its money went back. NULL
  -- on every order before 0029, on an attach's and on a refund's.
  sub TEXT,
  part_of TEXT,
  lead_added INTEGER,
  desk_added INTEGER,
  ends INTEGER,
  given_back INTEGER
);

-- The desks one person's desk seat is held from (board 980, stage 3; migrations/0003_desk_keys.sql): each desk's public key, as
-- its own sign-in names it, with when it last proved its person. A person holds at most three desks seen within the licence's
-- grace_days (core.mjs DESKS_PER_PERSON), decided inside the one statement that records the desk; a desk unseen longer stops
-- counting, and a seat freed by its lead stops every desk of its person counting; those places go with the freed seat (removals),
-- and any other row stays while its licence lives and goes with it at the retention purge. pooled is 1 for a
-- desk whose last sign-in said its machine policy sets NonPersistent (migrations/0017_pooled_desks.sql): a person's pooled
-- desks hold one place between them, each new one taking it over (core.mjs takeSeat, section 12.2 point 3).
CREATE TABLE IF NOT EXISTS desk_keys (
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  desk_key TEXT NOT NULL,
  seen_at INTEGER NOT NULL,
  pooled INTEGER NOT NULL DEFAULT 0 CHECK (pooled IN (0, 1)),
  PRIMARY KEY (licence, person, desk_key)
);
-- A desk's sign-out frees its place on every licence by its key alone (core.mjs signout/desk; migrations/0006_signout_list.sql).
CREATE INDEX IF NOT EXISTS desk_keys_by_key ON desk_keys (desk_key);

-- A person who has signed in (migrations/0005_desks_own.sql), keyed as seats.person keeps one, with the provider they signed
-- in with and their sign-in code: 16 Crockford symbols, random, made at their first sign-in, lead or desk, and kept until the
-- retention purge finds the row RETENTION_DAYS old with no seat, binding, desk key, ownership or admission naming it. A
-- lead seat's code is its person's. A lead admits a person to its licence by this code (core.mjs person/admit).
CREATE TABLE IF NOT EXISTS persons (
  person TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  made INTEGER NOT NULL,
  erased_at INTEGER NOT NULL DEFAULT 0,
  -- What is kept of the person (migrations/0021_person_names.sql; option A of 2026-11-16 21:21): their name and address as their provider
  -- gave them at the last sign-in or proof, whether the provider vouched the address, and when a sign-in last wrote them (core.mjs identOf).
  -- None on a licence whose seats follow Entra; cleared NAMES_DAYS after signed_at for someone nobody accepted, and at erasure.
  name TEXT,
  address TEXT,
  vouched INTEGER CHECK (vouched IN (0, 1)),
  -- The verified domain of a work account, where its provider gives one (migrations/0027_naming_by_address.sql; core.mjs domainOf): kept and
  -- cleared with the name and the address.
  domain TEXT,
  signed_at INTEGER NOT NULL DEFAULT 0
);

-- The desk keys a person signed in from with a nonce bound to that key, whatever licence admits them: the desk's own renewal
-- is taken only from a key held here for its person (core.mjs signin/desk), and not once its desk signed out (signed_at 0).
-- org is the organisation the person signed in from, keyed as admits keeps it, for a lead's list (core.mjs person/list); NULL
-- for a personal account, which no list shows (migrations/0006_signout_list.sql). A desk freed with its seat goes with it (removals);
-- any other row stays until the retention purge finds it signed RETENTION_DAYS ago and its person held by nothing else.
CREATE TABLE IF NOT EXISTS person_desks (
  person TEXT NOT NULL,
  desk_key TEXT NOT NULL,
  signed_at INTEGER NOT NULL,
  org TEXT,
  PRIMARY KEY (person, desk_key)
);
CREATE INDEX IF NOT EXISTS person_desks_by_key ON person_desks (desk_key);
CREATE INDEX IF NOT EXISTS person_desks_by_org ON person_desks (org, signed_at) WHERE org IS NOT NULL;

-- THE DOORS (board 980, the door-finding; migrations/0008_doors.sql): each relay team a lead's Studio leads while signed in, set by
-- that lead's key through door/set and kept per licence and per lead key, so one lead never touches another's: the team's id, its
-- relay team id (both random, and both needed: the lead admits a request only where it names the team's own id, and the relay
-- knows the team by the other), the relay's address, the lead key's canonical id and the lead's box (its two public keys), and the
-- set's t. No name, member or catalog. A desk the service certifies is handed the doors on its certificate's licence whose lead
-- still leads it (core.mjs doorsOf).
CREATE TABLE IF NOT EXISTS doors (
  licence INTEGER NOT NULL REFERENCES licences (id),
  lead TEXT NOT NULL,
  team TEXT NOT NULL,
  rt TEXT NOT NULL,
  url TEXT NOT NULL,
  key_id TEXT NOT NULL,
  box TEXT NOT NULL,
  at INTEGER NOT NULL,
  -- The team's name, the organisation's own words, as its lead's Studio set it (migrations/0022_one_act.sql): shown to a colleague asking,
  -- with the lead's name, and handed to no desk with the door.
  label TEXT,
  PRIMARY KEY (licence, lead, team)
);
CREATE INDEX IF NOT EXISTS doors_by_licence ON doors (licence);

-- A Studio key released when its person's keys passed core.mjs DEVICES_PER_SEAT (bindPerson), with the instant; kept RELEASE_KEEP_DAYS
-- (30), while the released key's check says it was released, then purged. No statement enforces a monthly cap on releases today.
-- `token` names the batch that released it, so the batch deletes the binding it released and no other.
CREATE TABLE IF NOT EXISTS releases (
  licence INTEGER NOT NULL,
  lead TEXT NOT NULL,
  at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS releases_by_licence ON releases (licence, at);
CREATE INDEX IF NOT EXISTS releases_by_lead ON releases (lead);

-- THE FRONT DOOR'S THREE TABLES (trials, codes, outbox) are written by no route since sign-in became the only way to a
-- seat; trials is read only to ask its keys to sign in, and the retention purge empties codes and outbox.
-- A trial: the address's identity hash (one trial per address), the company domain's hash (one per domain; NULL for a
-- public mail provider, which is judged per address alone: the test architect's A2), the lead key it was confirmed for
-- (one trial per key), its start and its end (ms).
CREATE TABLE IF NOT EXISTS trials (
  identity TEXT PRIMARY KEY,
  domain TEXT,
  lead TEXT NOT NULL UNIQUE,
  started INTEGER NOT NULL,
  ends INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS trials_one_per_domain ON trials (domain) WHERE domain IS NOT NULL;

-- An emailed code, as its hash, per address and purpose; it dies at `expires` or after five tries, counted before the
-- comparison, and it is spent by the one statement that deletes it.
CREATE TABLE IF NOT EXISTS codes (
  email_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('activate', 'trial')),
  code_hash TEXT NOT NULL,
  made INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  tries INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email_hash, purpose)
);

-- THE SEAM'S STAND-IN, and the one table that holds an address and a code in the clear: what a sender would send, kept
-- until it is sent. No sender exists (outward, Maxim's), so on staging a chief reads the code here; a row lives no longer
-- than its code.
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY,
  to_addr TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code TEXT,
  made INTEGER NOT NULL
);

-- The team proof keys a lead registered at a quiet check: a desk of the team signs the grant fetch with one.
CREATE TABLE IF NOT EXISTS proofs (
  lead TEXT NOT NULL,
  proof TEXT NOT NULL,
  PRIMARY KEY (lead, proof)
);

-- Rate limits: a count per bucket (a route and an address, a lead or an IP's hash) per hour.
CREATE TABLE IF NOT EXISTS hits (
  bucket TEXT NOT NULL,
  slot INTEGER NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (bucket, slot)
);

-- Signed requests already answered, by the hash of their bytes, kept past the skew so a replay is refused.
CREATE TABLE IF NOT EXISTS seen (
  digest TEXT PRIMARY KEY,
  until INTEGER NOT NULL
);

-- PAYMENTS (decision 48, one core for every provider; migrations/0010_paddle.sql, then 0011_pay.sql): each notification a provider
-- sent, once per provider and event id, with its outcome ("applied", "once", "recorded", "unknown", "refund-one-source",
-- "zero-total:<discount id>", or "held:<reason>", which writes nothing else; the last three listed for Max); and each subscription's
-- contribution to its licence, by provider: the person who pays (as seats.person keeps one), the lead and desk seats its items hold,
-- the end of its paid period plus the grace, its status as the provider last said it, and the payment that bought that period,
-- which alone a full refund ends.
CREATE TABLE IF NOT EXISTS pay_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  outcome TEXT NOT NULL,
  at INTEGER NOT NULL,
  -- What the route did with it, the subscription it named, and on a held payment alone the person whose code it carried, which that
  -- person's own programs read (migrations/0028_buyer_facts.sql; pay.mjs buyerFacts).
  act TEXT,
  sub TEXT,
  person TEXT,
  PRIMARY KEY (provider, event_id)
);
CREATE INDEX IF NOT EXISTS pay_events_by_at ON pay_events (at);
CREATE INDEX IF NOT EXISTS pay_events_by_person ON pay_events (person, at);
CREATE INDEX IF NOT EXISTS pay_events_by_sub ON pay_events (provider, sub);
CREATE TABLE IF NOT EXISTS pay_subs (
  provider TEXT NOT NULL,
  sub TEXT NOT NULL,
  licence INTEGER NOT NULL REFERENCES licences (id),
  person TEXT NOT NULL,
  lead_seats INTEGER NOT NULL CHECK (lead_seats >= 0),
  seats INTEGER NOT NULL CHECK (seats >= 0),
  paid_until INTEGER NOT NULL,
  status TEXT NOT NULL,
  txn TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (provider, sub)
);
CREATE INDEX IF NOT EXISTS pay_subs_by_licence ON pay_subs (licence);
-- Where a provider names the buyer only at checkout (Stripe's client_reference_id), the subscription's buyer code as the Checkout
-- Session gave it ('' where it gave none), and whether its link was Managed Payments, bound before the first payment is applied.
CREATE TABLE IF NOT EXISTS pay_binds (
  provider TEXT NOT NULL,
  sub TEXT NOT NULL,
  code TEXT NOT NULL,
  managed INTEGER NOT NULL DEFAULT 0 CHECK (managed IN (0, 1)),
  at INTEGER NOT NULL,
  -- The organisation's name typed on the provider's page, within the bound (migrations/0012_pay_org.sql); NULL otherwise.
  org TEXT,
  PRIMARY KEY (provider, sub)
);

-- A PERSON'S RECORDS HAVE A STATED END (section 13; migrations/0016_erase.sql). A seat of a kind on a licence freed or withdrawn, by
-- whom and when (core.mjs removalStamp), its rows there purged REMOVAL_DAYS later; the desks of a person who asked to be erased, by their
-- public keys alone, named to the licence's leads until `until` (core.mjs person/erase, erasedFor); a purge held by Max's own command
-- (scripts/purge-hold.mjs), scope "orders" holding every order.
CREATE TABLE IF NOT EXISTS removals (
  licence INTEGER NOT NULL,
  person TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('lead', 'desk')),
  at INTEGER NOT NULL,
  PRIMARY KEY (licence, person, kind)
);
CREATE INDEX IF NOT EXISTS removals_by_at ON removals (at);
CREATE TABLE IF NOT EXISTS erasures (
  licence INTEGER NOT NULL,
  desk_key TEXT NOT NULL,
  until INTEGER NOT NULL,
  PRIMARY KEY (licence, desk_key)
);
CREATE TABLE IF NOT EXISTS purge_holds (
  scope TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  since INTEGER NOT NULL
);

-- A person's store (migrations/0019_stores.sql): the relay team holding a person's own synced copy, so the service can end it. The person keyed as
-- seats keeps them, their code (as persons keeps it, in the clear) for the store-end notice, the store's lead key S's public half, and
-- the licence of a company store (null for the person's own). An ended row stays only until the relay takes its notice.
CREATE TABLE IF NOT EXISTS stores (
  rt TEXT PRIMARY KEY,
  person TEXT NOT NULL,
  code TEXT NOT NULL,
  lead TEXT NOT NULL,
  licence INTEGER,
  made_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS stores_by_person ON stores (person);

-- THE ONE ACT (migrations/0022_one_act.sql, whose header says what each holds; core.mjs, ask, person/admit and invite).
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

-- A NAMING BY ADDRESS AND ITS CANDIDATES (migrations/0027_naming_by_address.sql, whose header says what each holds; core.mjs lead/invite,
-- lead/accept, lead/confirm). invites.address holds the same keyed hash of an address since 0027, never the address.
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

-- A STUDIO'S MEMBER KEY (migrations/0024_member_keys.sql, whose header says what each holds; core.mjs memberCertificate).
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

-- WHO STAYS WHEN SEATS IN FORCE FALL BELOW THE SEATED (migrations/0025_seat_stays.sql; core.mjs stayingPersons).
CREATE TABLE IF NOT EXISTS seat_stays (
  licence INTEGER NOT NULL REFERENCES licences (id),
  kind TEXT NOT NULL CHECK (kind IN ('lead', 'desk')),
  person TEXT NOT NULL,
  at INTEGER NOT NULL,
  by TEXT NOT NULL,
  PRIMARY KEY (licence, kind, person)
);
CREATE INDEX IF NOT EXISTS seat_stays_by_licence ON seat_stays (licence, kind, at);
