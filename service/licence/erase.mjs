/* ONE PERSON'S RECORDS, ERASED AT THEIR OWN ASK (section 13 of the licence design; Claude alpha's decision 50: "a person removed from
 * a licence, or who asks, has what the service and the relay keep about them gone within a stated number of days, nothing a paying
 * licence needs to count its seats is broken by it, and the papers can say the number truthfully"). core.mjs person/erase binds
 * these on D1 for the person a fresh ID token proves; scripts/erase-person.mjs renders the same statements as text for a person who
 * can no longer sign in, named by their code. One list, so the route and the hand script can never erase two ways.
 *
 *     const list = eraseStatements({ person, now, until })   // person: q => SQL naming the keyed person; until: the relay keep's end
 *
 * In order, every licence at once: the person's desks named for each licence they held a place on (erasures, desk public keys and
 * nothing else, so the leads' Studios take them off their relay teams); the people they admitted handed to the licence's owner, as
 * an owner's unnaming hands a lead's team (core.mjs unnamed), so nobody else's seat moves; their admissions, their name as a lead and
 * the owner's mark on another's name; their Studio keys' doors, proofs, ended member keys and bindings; their desks' places, their seats, their
 * staying choices (seat_stays: who stays when seats in force fall below the seated, the Grok review beta's D5 of 2026-11-22), their
 * removal stamps and their held desks; their Studio keys on an Entra licence (entra_keys) and their desks named as freed (freed_desks); their ownership of a licence, the licence staying live and counted with no owner until the
 * vendor names one; a payment binding of theirs that never paid, and the name typed on one that pays; their name on a held payment's
 * notice; their asks and every invitation to
 * their address (the one act); and their own row last, since the hand script finds the person
 * through it. WHAT STAYS, and why: a licence's trial_unit (a trial is once per person), and the person's row and payment binding
 * while a subscription they pay stands in pay_subs, since its renewals are matched to them (pay.mjs knownSubscription); each ends
 * by purgeRetention's own rule; and a member key (member_keys) whose certificate, replaced key or seven-day change span has not ended, since it counts the
 * person's live member keys and the change's span, kept keyed and nameless until all three ends pass (purgeRetention) and named in the
 * erase answer's stays (core.mjs person/erase). The row that stays holds the keyed person, the provider, the code and the dates, never their name,
 * address or vouched mark, which go in the same batch whether the row stays or not.
 */
import { statement } from "./attach.mjs";

const PERSON_PREFIX = "person:";
const MEMBER_CHANGE_DAYS = 7, MEMBER_CHANGE_MS = MEMBER_CHANGE_DAYS * 86400000;

function eraseStatements(o) {
  const P = o.person;
  const leads = q => "SELECT lead FROM bindings WHERE person = " + P(q);
  /* A desk key is a computer's, and two people may sign in from one (Grok's review 3 of erasure, finding 1; head of the office's ruling):
     where another person has a desk_keys row for it on that licence, signed out or not, it is theirs too, so it is neither named to
     that licence's leads nor taken off its freed list; a held-back row (until = 0) waits in erasures until the last other person's row
     for that computer on that licence goes. */
  const nobodyElse = (q, l, k) => "NOT EXISTS (SELECT 1 FROM desk_keys o WHERE o.licence = " + l + " AND o.desk_key = " + k + " AND o.person <> " + P(q) + ")"; /* plant:erase-shared */
  return [
    /* Each desk to the leads of the licence it held a place on (desk_keys, signed out or freed included), and to no other (Grok's review 3
       of erasure, finding 2): a licence the person was only admitted to never had that computer on its teams, and a key placed on no
       licence was on none. */
    statement(q => "INSERT INTO erasures (licence, desk_key, until) SELECT m.licence, m.desk_key, " + q(o.until) + " FROM desk_keys m WHERE m.person = " + P(q)
      + " AND " + nobodyElse(q, "m.licence", "m.desk_key") /* plant:erase-pairs */
      + " ON CONFLICT (licence, desk_key) DO UPDATE SET until = MAX(erasures.until, excluded.until)"), /* plant:erase-relay */
    statement(q => "INSERT INTO erasures (licence, desk_key, until) SELECT m.licence, m.desk_key, 0 FROM desk_keys m WHERE m.person = " + P(q)
      + " AND NOT " + nobodyElse(q, "m.licence", "m.desk_key") /* plant:erase-shared-hold */
      + " ON CONFLICT (licence, desk_key) DO NOTHING"),
    statement(q => "UPDATE OR IGNORE admitted_by SET lead = (SELECT owner FROM licences WHERE id = admitted_by.licence) WHERE lead = " + P(q)
      + " AND EXISTS (SELECT 1 FROM licences WHERE id = admitted_by.licence AND owner IS NOT NULL AND owner <> " + P(q) + ")"), /* plant:erase-team-kept */
    statement(q => "DELETE FROM admitted_by WHERE person = " + P(q) + " OR lead = " + P(q)),
    statement(q => "UPDATE lead_names SET named_by = 'erased' WHERE named_by = " + P(q)),
    statement(q => "DELETE FROM lead_names WHERE person = " + P(q)),
    statement(q => "DELETE FROM admits WHERE org = " + q(PERSON_PREFIX) + " || " + P(q)),
    statement(q => "DELETE FROM doors WHERE lead IN (" + leads(q) + ")"),
    statement(q => "DELETE FROM proofs WHERE lead IN (" + leads(q) + ")"),
    /* Where the managed half and the relay seats met this (the integration of 2026-11-14): the person's Studio keys on an Entra licence,
       and their pooled desks named as freed, both read through what the statements below take away. */
    statement(q => "DELETE FROM entra_keys WHERE lead IN (" + leads(q) + ")"), /* plant:erase-entra-keys */
    /* Only a row of a licence the person held that key on: the freed list has no person, so a key alone would reach every licence. */
    statement(q => "DELETE FROM freed_desks WHERE EXISTS (SELECT 1 FROM desk_keys m WHERE m.person = " + P(q) + " AND m.licence = freed_desks.licence "
      + "AND m.desk_key = freed_desks.desk_key) AND " + nobodyElse(q, "freed_desks.licence", "freed_desks.desk_key")), /* plant:erase-freed */
    statement(q => "UPDATE stores SET ended_at = " + q(o.now) + " WHERE ended_at = 0 AND person = " + P(q)), /* plant:erase-stores */
    statement(q => "DELETE FROM member_keys WHERE person = " + P(q) + " AND until <= " + q(o.now) + " AND was_until <= " + q(o.now) + " AND set_at + " + q(MEMBER_CHANGE_MS) + " <= " + q(o.now)), /* plant:erase-member-keys */
    statement(q => "DELETE FROM bindings WHERE person = " + P(q)),
    statement(q => "DELETE FROM desk_keys WHERE person = " + P(q)),
    statement(q => "DELETE FROM seats WHERE person = " + P(q)), /* plant:erase-seats */
    statement(q => "DELETE FROM seat_stays WHERE person = " + P(q)), /* plant:erase-stays */
    /* A staying choice they made for others stays, its maker blanked as erased, as lead_names.named_by is (the test architect's F6). */
    statement(q => "UPDATE seat_stays SET by = 'erased' WHERE by = " + P(q)), /* plant:erase-stays-by */
    statement(q => "DELETE FROM removals WHERE person = " + P(q)),
    statement(q => "DELETE FROM person_desks WHERE person = " + P(q)),
    statement(q => "UPDATE licences SET owner = NULL WHERE owner = " + P(q)), /* plant:erase-owner */
    /* A binding kept for a subscription the person pays keeps its code, which renewals are matched by, and not the organisation's name
       typed at checkout: it named the licence at the first payment and nothing reads it after (Grok's review 3 of erasure, finding 6). */
    statement(q => "UPDATE pay_binds SET org = NULL WHERE code = (SELECT code FROM persons WHERE person = " + P(q) + ")"), /* plant:erase-pay-org */
    statement(q => "DELETE FROM pay_binds WHERE code = (SELECT code FROM persons WHERE person = " + P(q) + ") "
      + "AND NOT EXISTS (SELECT 1 FROM pay_subs s WHERE s.provider = pay_binds.provider AND s.sub = pay_binds.sub)"), /* plant:erase-pay-binds */
    /* A held payment's notice names the buyer for their own programs (pay.mjs buyerFacts; board 1020): the notice stays for Max's list and
       its own cut, naming nobody. */
    statement(q => "UPDATE pay_events SET person = NULL WHERE person = " + P(q)), /* plant:erase-pay-events */
    /* The one act's (asks and invitations; the design's 2.3: "Their asks are deleted, and any invitation addressed to their address"): every
       invitation to their address, read before the address goes below; the invitations they made and the asks naming them handed to the
       licence's owner, as the people they admitted are, else gone; every ask of theirs. */
    /* By the address as an invitation keeps it, a keyed hash of the service's fold of it (core.mjs addressKeyed; board 1017's rule 5), which the
       route hands as o.addressKey. The hand script holds no HASH_KEY and reads nothing before it renders, so its fallback, SQL's lower() of
       the address, matches no keyed hash; given the person's address (--address, the Grok review beta's D5 of 2026-11-22) it asks the
       service's admin/address under the root to remove those to it, which answers counts alone. Without that, an invitation or a naming
       to the person's address waits out its INVITE_DAYS, and holds no name or address meanwhile. */
    statement(q => "DELETE FROM invites WHERE address = " + (o.addressKey ? q(o.addressKey) : "(SELECT lower(address) FROM persons WHERE person = " + P(q) + ")")), /* plant:erase-invited */
    statement(q => "DELETE FROM lead_candidates WHERE person = " + P(q) + (o.addressKey ? " OR address = " + q(o.addressKey) : "")), /* plant:erase-candidates */
    statement(q => "DELETE FROM lead_candidates WHERE (licence, address) IN (SELECT licence, address FROM lead_invites WHERE named_by = " + P(q) + ")"),
    statement(q => "DELETE FROM lead_invites WHERE named_by = " + P(q) + (o.addressKey ? " OR address = " + q(o.addressKey) : "")), /* plant:erase-namings */
    statement(q => "UPDATE invites SET lead = (SELECT owner FROM licences WHERE id = invites.licence) WHERE lead = " + P(q)
      + " AND EXISTS (SELECT 1 FROM licences WHERE id = invites.licence AND owner IS NOT NULL AND owner <> " + P(q) + ")"),
    statement(q => "DELETE FROM invites WHERE lead = " + P(q)),
    statement(q => "UPDATE asks SET lead = (SELECT owner FROM licences WHERE id = asks.licence) WHERE lead = " + P(q)
      + " AND EXISTS (SELECT 1 FROM licences WHERE id = asks.licence AND owner IS NOT NULL AND owner <> " + P(q) + ")"),
    statement(q => "DELETE FROM asks WHERE person = " + P(q) + " OR lead = " + P(q)), /* plant:erase-asks */
    /* What is kept of the person (option A of 2026-11-16 21:21: name, address, vouched mark) goes first, so a row kept for a payer below holds
       none of it: "what stays" never holds a name or an address. */
    statement(q => "UPDATE persons SET name = NULL, address = NULL, vouched = NULL WHERE person = " + P(q)), /* plant:erase-name */
    statement(q => "UPDATE persons SET domain = NULL WHERE person = " + P(q)), /* plant:erase-domain */
    statement(q => "DELETE FROM persons WHERE person = " + P(q) + " AND person NOT IN (SELECT person FROM pay_subs)"), /* plant:erase-payer-kept */
    /* The run's stamp on a row that stays (a payer's): the hand script names its person only where this stamp is earlier than its own run,
       so a finished run's text names nobody again and a later ask always does (scripts/erase-person.mjs). Nothing else reads it. */
    statement(q => "UPDATE persons SET erased_at = " + q(o.now) + " WHERE person = " + P(q)), /* plant:erase-marker */
  ];
}

export { eraseStatements, MEMBER_CHANGE_DAYS, MEMBER_CHANGE_MS };
