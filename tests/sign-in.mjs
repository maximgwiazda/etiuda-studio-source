/* ONE SIGN-IN PATH IN STUDIO (board 980, stage 2).
 *
 *     node tests/sign-in.mjs        exit code is the number of failed checks, capped at 63
 *
 * gate-kind: node
 *
 * THE CRITERION, in Max's words of 2026-11-11 22:14, "I agree!", to Claude alpha's "Sign-in as the only way to hold a paid seat,
 * with Microsoft and Google first": a lead signs in with the work account their organisation already has, in the system's own
 * browser, with PKCE, a state and a nonce, the code caught at a loopback on 127.0.0.1, exchanged through Studio's one door
 * (src/wire.cjs), and the ID token taken to the licence service's `signin` route; the refresh token is kept only sealed.
 *
 * NOTHING HERE REACHES A PROVIDER, OPENS A BROWSER OR STARTS STUDIO. The browser is stood in by a function that reads the page's
 * address and makes the one GET a browser would make to the loopback, at 127.0.0.1 on this machine; the providers' token
 * addresses and the licence service are stood in by Electron's net, replaced as src/wire.cjs loads, which records every
 * address asked; the runtime's own fetch is replaced by one that fails the leg if it is ever called.
 *
 *   si1  the page's address carries PKCE (S256, the challenge the SHA-256 of the verifier), a state, a nonce, the client id,
 *        an openid scope and a loopback redirect at the port the listener got, for each provider; the three secrets are fresh,
 *        and the nonce is bound to the key that will sign (requests.mjs signinNonce of the lead and a fresh seed; the join)
 *   si2  a reply whose state is not this sign-in's is refused before anything else of it is read, and in the whole flow it is
 *        ignored, the sign-in waiting with no token request and nothing sent to the licence service until it is closed
 *   si3  the loopback listens on 127.0.0.1 alone, answers another path 404 without being spent, answers a stray GET of "/" with
 *        no state and one with another state and keeps waiting, ends on the reply carrying its state with the page it was
 *        handed, and is then closed: a second GET finds nothing there; one never answered closes when asked, and its wait
 *        fails; a whole sign-in waits through both strays and completes on the real reply (decision 15 item 4, Argon 5)
 *   si4  the token request goes through the door alone: the whole flow asks Electron's net for the provider's token address
 *        (and, where the tree holds stage 1's signinBytes, the licence service's signin route) and nothing else, never the
 *        runtime's fetch; the form carries the code, the verifier and the redirect, and no secret
 *   si5  the door refuses any other host, plain http, a port, a user, a query on the token address, a fragment, a dot segment
 *        and a form past its bound, before anything is sent; the page for the browser is admitted at the fixed hosts alone
 *   si6  the refresh token is kept only sealed: what the flow hands back is the seal, the raw token is in no line written to
 *        the console or the process's streams during the flow, nor in the page the browser was shown, and the shell's licenceNow,
 *        what the page is handed, names no refresh token
 *   si7  where the system cannot seal (Linux's basic_text, or no keyring), no refresh token is kept, and the next renewal asks
 *        the lead to sign in (renewSignIn "signin-ask" with nothing sent); a key made again asks the lead (planFor "ask"), the
 *        sign-in being bound to its key; a renewal exchanges the sealed token with Microsoft's scopes and posts the refreshed
 *        token, which carries no nonce, to signin/renew signed over signinRenewBytes with no seed, the rotated token sealed in
 *        its place; the service's refusal keeps the seal, a provider that no longer takes the token forgets it
 *   si8  an ID token is read before it goes on: another audience, another issuer, an expired one, a missing or other nonce are
 *        refused; Microsoft's issuer is its tenant's, from the token's own tid; Google's both forms are taken
 *   si9  the signin request is stage 1's interface with the join's seed: provider, idToken, lead, t, seed and the lead's
 *        signature over requests.mjs signinBytes with tokenHash the SHA-256 of the token; in the whole flow the seed sent makes,
 *        with this key, the nonce the token carries
 *   si10 as shipped no client id is configured and nothing is offered; with providers configured they are offered in order; the
 *        shipped configuration holds no secret
 *   si11 the door (ui/app.js on tests/page-stand-in.mjs): one provider's own button per provider offered; a press hands the shell
 *        the provider's name alone, the door says where to finish while it waits, and after a sign-in it is gone for good and
 *        Account says who signed in with; in Polish the words are the table's
 *   si12 a browser that will not open (a false answer or a rejection) is said at once, the loopback closed, nothing asked; the
 *        shell awaits the opening (the join)
 *   si13 Cancel ends a sign-in under way: the shell's stop closes the loopback, the flow ends as cancelled at once, and the
 *        door paints no refusal for it (the join; the door since A5)
 *   si14 the scopes: the first sign-in asks Microsoft openid profile email offline_access and Google openid email profile with no
 *        consent page forced; a renewal asks Microsoft openid profile email offline_access (it asked of nobody the email before)
 *   si15 a check's proof "due" renews quietly and its answer is taken; a failed renewal changes nothing (decision 15 item 1)
 *   si16 a check's "signin" renews, or forgets the seal and asks the lead; a provider not reached forgets nothing; the shell's
 *        check runs afterCheck before taking anything and moves no licence file, so the lead's catalogs stay open
 *   si17 each answer's me and owner are kept; the shell hands the page no code, and Account and the Licence cover draw no code row
 *        and no Copy for one (moved for board 1017; decision 15 (b))
 *   si18 the owner's lead seats listed (seat/list) and freed (seat/free kind lead) through the two channels, in Account, each by
 *        name and address and never a code (moved for board 1017): a Free acts at once, the row saying so by the name the service
 *        gave and the count dropping, a refusal said on the row with its Free kept; anyone else is shown none (decision 15 (b))
 *   si19 a sign-in and a sign-out are held, page and shell, while a newer Studio's saved data stand (Argon 8a)
 *   si20 an ID token's audience is read as the service reads it: the client id, or a list of exactly that one (Argon 8d)
 *   si21 the owner's seat list in Account says once, visibly and always, what a Free does, no Free carrying a title; says why the count stands one
 *        over only when it does; no code row nor its title (moved for board 1017); English and Polish (stage H2 (b) and (c))
 *   si22 with no client ids configured Studio shows no sign-in control at all, no door, Account section, rail line or band button
 *        among them, nor the Team screen's list of people, Admit by sign-in code or a paid act's sentence, asks nothing of the
 *        licence at the start, and its Licence cover draws no way in and no empty form, for a fresh Studio or one activated
 *        before sign-in (Claude alpha's condition 5, night decision 18; board 980, stage 4)
 *   si23 the door stands in place of Overview only with a provider configured, for a Studio nobody signed in to whose door was not
 *        closed; Not now closes it for good through the shell's store, and the rail's Sign in opens it again (night decision 19)
 *   si24 a Studio opened with Not now: the shell gates nothing new, its pause's sentence carries the way to sign in beside it, which
 *        opens the door (night decision 16; Max 2026-11-12 02:16); the page's own paid-act lines are si32's
 *   si25 Settings' Account, first in the list: not signed in, signed in and the service not reached, the last with no amber; Use
 *        another account and Sign out exist nowhere else
 *   si26 Sign out, in the shell itself: what it forgets of licence-service.json and that it keeps the licence file, the relay
 *        grant, desk-seats.json and the names; a key that never held a door sends nothing (si74 the other case), and the page then shows
 *        Studio not signed in
 *   si27 Use another account starts a sign-in with the provider signed in with; Account says where to finish, and Open the
 *        browser again opens the same page through the same door
 *   si28 nothing from the provider is shown: a token's name and addresses reach neither what the flow keeps, nor the shell's
 *        answer to the page, nor any place the page draws the sign-in
 *   si29 no name is kept beside a code any more: the seat-name channels and lead-seat-names.json are gone, a field left sends
 *        nothing, and typed addresses are kept in typed-addresses.json beside the service's handles and in no request (moved for board 1017)
 *   si30 no sign-in state opens a cover, speaks in the status line or draws a dialog, toast, notice or refusal box; each failure
 *        is the heading of the place that asked
 *   si31 "not allowed" is two states, each its own sentence: the provider's organisation-consent refusal at the loopback, apart from
 *        the person cancelling, and the service's no-licence or full; each the door's heading and line (night decision 20 (b))
 *   si32 a paid act on a Studio nobody signed in to, with a provider configured: one sentence and Sign in where Publish stood on the
 *        Team screen, and as the whole of Statistics (read not at all) and of Proposals (night decision 16; the handoff's section 3)
 *   si33 the lead's list of people who signed in, in the Roster between Asking to join and Members, only for a signed-in lead with
 *        someone to show, newest first (the handoff's section 6), on a folder team and on a relay team alike (A4, the standing door);
 *        on a relay team the admitted row says the copywriter's relay case
 *   si34 its Admit sends the row's pseudonym alone and acts at once with no confirmation, the row then admitted, refused or not
 *        reached; nothing is kept beside a code (moved for board 1017)
 *   si35 the client's person/list and person/admit, signed by the lead over requests.mjs's bytes, carrying no name
 *   si36 the shell's two channels: an admission recorded beside the team for the watch, the list without those admitted, no name sent;
 *        Remove marks the person removed, listed again, and Admit writes them afresh
 *   si37 Admit by sign-in code is gone, field, act and words; Invite by email address stands in its place, in Polish too (moved for
 *        board 1017; night decision 20 (c))
 *   si38 nothing from the provider and no dialog, toast or notice on the new places
 *   si39 board 993: the Team screen's tables inside the Roster at every width Studio supports, no word broken (a node budget over
 *        the drawn table and ui/index.html's rules; no window opens here)
 *   si40 the shell's own watch hands a folder team with no live invitation to watchAdmit for a signed-in
 *        lead alone, and an admission by code looks at the team at once (Argon's review of 2026-11-12, finding 1)
 *   si41 Remove marks removed the person of a desk whose seat the lead freed first, or whose certificate ran out (finding 4)
 *   si42 Remove of a desk whose person the lead admitted by code withdraws that admission at the service once, not awaited, owed
 *        and asked again at the next look until answered; Free never withdraws (night decision 22)
 *   si44 Account's Carry on from another computer (A6, the first step): offered only signed in with no signing key; its press is
 *        the Signing key row's own restore through studio:key-restore-pick and studio:key-restore alone, then the projects on a share
 *        through the Library's folder pick; a restore from the row leaves no guide behind
 *   si45 a wrong passphrase leaves everything as it was: the page's cover, field and offer, and the shell's profile byte for byte
 *        (its thread src/studio.mjs, a real backup copy); the right one restores, and neither asks the network anything
 *   si46 the restored row says how many relay teams came back with the copy, as studio:key-restore's answer counts them, or that
 *        its copy carried none, in the teams file, a row skipped at another relay place not counted; never the uncounted sentence;
 *        in Polish the copywriter's words of 2026-11-12
 *   si47 the second step drawn from the start, dimmed with no button and no folder; awake once restored, still naming no folder the
 *        row was not given; picked from the row, the key row's tick and the share's path before its button (the product designer's
 *        edits of 2026-11-12)
 *   si48 the sign-in preview is off by default: ETIUDA_SIGNIN_PREVIEW absent, or anything but "1", and the shell offers what it offers
 *        today and no surface carries the preview's line
 *   si49 inert with real ids: a configured tree, started with the variable, offers both and no preview; a scratch tree whose
 *        Microsoft entry alone has a client id, started with the variable, offers that one alone
 *        and no preview; a press of the other is refused as not offered
 *   si50 in the preview a press of either provider opens no browser, starts no loopback, sends nothing and writes no file (the shell
 *        under its Electron stub, Not now included), answering that sign-in is not set up yet
 *   si51 visibly a preview: the line in the screen itself on the door, the rail's foot, Account and each paid act's sentence, and the
 *        press's line as the place's heading; Polish too
 *   si52 tools/signin-preview.cmd is outside electron-builder's files, and starts the installed Studio, per-user first, then
 *        all-users, with the variable set for it alone (its statements read, never run)
 *   si53 the preview's line as the product designer placed it: "Preview only." in the ink at 600, the rest at the caption's weight;
 *        on the door in the right panel before the providers' caption, nothing in the left column; in Account at the card's measure
 *   si54 with three or four corner discs the Team screen's panes stand one above the other below 2062px
 *   si55 the preview's press says it once, with an ordinary Back, and nothing stopped: no amber, What happens as before
 * DECISION 27 (Claude alpha's, 08:42; his test: "Remove does what a lead would expect of the word, and nothing happens unseen"):
 *   si56 Remove takes a person out of that team alone while they are in another of this lead's teams, by code or by a desk there,
 *        and withdraws this lead's admission only when they are left in none
 *   si57 Remove of a signed-in desk takes every desk of its person on that team off it, a desk not signed in alone; the
 *        confirmation's facts (removalShown) count the computers and say whether the admission goes
 *   si57r that Remove takes every computer of the person off whatever fails on the way: a removal that landed with a reseal owed
 *        goes on to the next computer, one whose removal fails is reported and the next still tried, and the reply counts those left;
 *        a read of the roster again that rejects, or answers no roster, after a landed removal still has the next computer tried
 *   si58 the confirmation is drawn and says which it will be: the computers, the admission withdrawn or kept, the owner told a
 *        co-lead's lead seat is freed, a desk not signed in leaving alone
 * DECISION 29 (b) (Claude alpha's, 13:53):
 *   si59 a lead who is not the owner pressing Remove on a co-lead's desk (seat/list naming their code) takes nothing off the team,
 *        writes nothing, sends no withdrawal, and the cover holds the one line that the co-lead stays; the owner's Remove still works
 * THE SIGN-IN FOLLOW-UPS (Claude gamma's Ubuntu walk, items 1, 2 and 4; the product designer's handoff, section 8):
 *   si67 with a browser call that resolves and opens nothing, the page that pressed is handed the provider's page as the browser is,
 *        the loopback still waiting; Cancel ends it as before; no line written carries the link
 *   si68 the link block stands last in the waiting state on the door and in Account, from the shell's link, and nowhere outside a
 *        wait or in the preview's pressed state; Copy copies the link; Polish too
 *   si69 the link block as the designer placed it: the line in the preview line's form, the field 6 px under it, never wrapping, 16 px
 *        and 460 px on the door, 12 px and 560 px in Account, no box; a click selects all
 *   si70 tools/signin-preview.sh is outside electron-builder's files: the .deb's program unless an AppImage is named, --where starts
 *        nothing, one exec with the variable for that start alone (read, never run)
 *   si71 where the system seals nothing for real, licenceNow says so and Account, signed in, says in one line that the sign-in is
 *        not kept; nothing where it does
 *   si73 the doors the relay runner hands reach the licence service as door/set under the lead's key, each door as handed and
 *        signed over doorSetBytes, the service's answer handed back; the shell hands the runner that setter (board 980, the
 *        door-finding)
 * HYDROGEN'S REVIEW OF 2026-11-12, findings 4 and 5 (Claude alpha's triage of 22:30):
 *   si74 a lead whose key held a standing door signs out: the empty set of doors goes to the licence service at once, under the lead's
 *        key; refused, the sign-out stands and Account says the service was not told (4 (c))
 *   si75 the key's backup copy carries team-people.json and desk-seats.json, sealed; a restore elsewhere fills what that computer lacks
 *        and keeps what it has, so Remove there knows the lead's own admission (4 (b))
 *   si76 Remove of a person on the licence through their organisation or another lead says their seat stays (4 (a))
 *   si77 the shell refuses statistics, the proposal calls and publishing to a team as the page's paidWaits does, with its sentence (5)
 *   si78 every landing the browser is shown after a sign-in, English and Polish: the copywriter's words in the designer's variant A,
 *        one response that fetches nothing, its policy naming its one style element by hash; a refusal's landing by its reason
 *   si79 the loopback answers the sign-in's own reply 303 to a path of its own, holds that path's one GET until landed, serves it
 *        once and closes; strays are answered and the wait goes on
 *   si80 nothing landed within LOOPBACK_LAND_MS: the held GET is the neutral page and the loopback closes
 *   si81 the shell's press, on a configured tree, lands the loopback with how the sign-in ended
 *   si82 Free seat as decision 46 allows: offered to a co-lead only for a person it admitted by code, to the owner for every desk; a
 *        press for anyone else sends nothing and names the owner; the service's not-yours is said the same and the book kept
 *   si83 a lead whose own seat lapsed presses Free seat, of a desk or a lead seat, and is told so (the service's 403 not-lead); the
 *        book keeps the desk seated
 *   si84 a team is its lead's own (decision 47, held for Max's ruling), the client: the seat list's names, teams, unnamed colleagues and
 *        switch kept; lead/name and licence/set signed over their bytes; people's "added" kept; the ask and the switch kept by keepWho
 *   si85 the page: the owner's naming list, the switch, the question asked once as the card under the identity, a colleague's ask, Polish whole
 *   si86 the shell: naming and the switch the owner's alone, asked once per licence, a refusal in its words
 *   si87 an administrator of a licence whose seats follow Entra (decision 49), the client: the role is the service's word alone (section
 *        11.11), never a token's claim; signin's no-role beside admin is followed by a refreshed token's licence/admin with no seed, whose
 *        card is taken only where it says admin; Check now the same; no-role and managed read as themselves (three plants, each red)
 *   si88 the shell: the administrator's state kept, handed and forgotten as a sign-in's is, Check now by licence/admin, the two
 *        refusals in the copywriter's words, a paid act waiting (four plants, each red)
 *   si89 the page: the administrator's Account as the product designer's pictures draw it, nothing to author, buy, try or administer,
 *        the over line only with desks waiting, Polish whole (three plants on the page's source, each red)
 *   si90 a managed tenant's person who also bought a licence of their own (decision 49; Claude alpha, 21:34): the client keeps the cause
 *        each answer gives and clears it on one without; the Seat row says which licence they use and why, English and Polish (a plant)
 *   si95 as shipped no client id is configured and nothing is offered; a configured table offers what it configures, in order (with plants)
 * BOARD 1017 (Max's ruling of 2026-11-22; no code on any screen, a member invited by address):
 *   si104 Account, the owner's leads: each by name and address, the count with what waits, one field for an address or a name from the
 *        licence's teams, Name as lead the one press; no code row and no name-kept-here field
 *   si105 the waiting row (grey) and the confirm row (the mark colour, only for an unvouched candidate), several candidates flagged,
 *        every lead seat taken said with no Add a seat
 *   si106 the Team roster: Invite by email address, on a relay team alone, where Admit by sign-in code stood; invitation links beside it;
 *        the invitation and the unvouched Join waiting under it; a folder team draws no address field and keeps the link
 *   si107 no code on any of Studio's screens, even handed one by an older shell
 *   si108 the shell, the owner's side, against a stubbed service; si109 the member's side, a relay team's confirm and the desk's
 *        knock at that team's door; the shown time of a waiting ask against the service's own lifetime
 *   si110 a work account's verified domain beside the candidate; si111 the named person waiting for the owner's confirmation
 *   si112 a folder team's roster shows no address field and says it shares a folder; a team-less Join shows once, on the first folder team's roster
 *   si113 the refusals of Invite, Withdraw, Confirm and Decline each end in their own words, only Admit's in nobody admitted
 *   si114 a sign-out clears the pseudonym maps of the signed-out account
 *   si115 a refused Withdraw, Decline or Confirm as lead on a naming says its own words, never nobody was named
 *   si116 (board 1017, fold 95's B) the client keeps a list row's team and seated; si117 the shell's people screen keeps a Join on its relay
 *        team, drops one missing or seated false, and takes a removed person back only by a list asked after the service answered the removal
 *   si118 the client keeps every row past 500 that names a team (600 members); si119 withdrawPerson with a team signs it; si120 Remove of a
 *        person still in another of the lead's teams, on a relay team, takes them off that team at the service and marks when it answered
 *   si121 Remove's words say, before the press, that such a person is taken off this team only (Claude alpha's condition, 2026-11-22)
 *   si122 on a relay team a licence withdrawal is joined by the team's unplace; si123 the unplace goes after the relay removal has landed; si124 an unsure
 *        Join elsewhere does not keep the admission (the test architect's read of ff35a9e5, findings 3, 2 and 5)
 *   si125 a removal the thread refuses sends no unplace and owes none; si127 a
 *        service that never answers holds Remove for the unplace's three seconds at most, and Remove does wait for it (the test architect's read of the relay door, D)
 *   si128 a removal that waits (refused as a fork, the relay not holding the move) tells the service of nothing and owes nothing; the person stays as they were
 *
 * si44 to si47's controls (a fault planted in the worktree, the named leg red, restored) are in the lead engineer's report of
 * 2026-11-12 on A6.
 *
 * Its controls, each one fault planted in a scratch copy and the named leg red, are in the lead engineer's report of 2026-11-11
 * (board 980, stage 2); this file carries no plant marks. Its shell legs write only under scratch/sign-in-legs, removed at the end.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { seatEnv } from "./seated.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}

/* ---- the stand-ins -------------------------------------------------------------------------------------------------- */

/* Electron's net, recording each address; `answer(url, init)` answers {status, body}. */
const asked = [];
let answer = () => ({ status: 404, body: "{}" });
const electron = { net: { fetch: async (url, init) => {
  asked.push({ url: String(url), init });
  const a = await answer(String(url), init);
  const bytes = new TextEncoder().encode(a.body);
  return { status: a.status, headers: { get: () => null }, body: new ReadableStream({ start(c) { c.enqueue(bytes); c.close(); } }) };
} } };
const Module = require("node:module"), load = Module._load;
Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
const wire = require(path.join(ROOT, "src", "wire.cjs"));
Module._load = load;
const C = await import(pathToFileURL(path.join(ROOT, "src", "licence-client.mjs")).href);
const Q = await import(pathToFileURL(path.join(ROOT, "service", "licence", "requests.mjs")).href);

/* The runtime's own fetch fails the leg if anything calls it. */
let runtimeFetches = 0;
globalThis.fetch = async () => { runtimeFetches++; throw new Error("the runtime's fetch was called"); };

const b64url = (s) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (claims) => b64url(JSON.stringify({ alg: "RS256", kid: "k1", typ: "JWT" })) + "." + b64url(JSON.stringify(claims)) + "." + b64url("signature");
const NOW = Date.UTC(2026, 10, 11, 21, 0, 0);
const TID = "3f2a8c1e-5b7d-4e9f-a1c3-0d2e4f6a8b9c";
const MS = Object.assign({}, C.SIGN_IN_PROVIDERS[0], { clientId: "11112222-3333-4444-5555-666677778888" });
const GG = Object.assign({}, C.SIGN_IN_PROVIDERS[1], { clientId: "123456789012-harbourlamps.apps.googleusercontent.com" });
const LIST = [MS, GG];
const keys = crypto.generateKeyPairSync("ed25519");
const open = { privateKey: keys.privateKey, public: keys.publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex") };
const RAW_REFRESH = "rt-harbour-lamp-0123456789abcdef-raw-refresh";
/* THE STUDIO'S OWN SEAT CERTIFICATE, as the service now answers it beside a lead's sign-in and renewal (review xi; Max, 2026-11-22 15:37;
   Claude alpha's yes to certificates.studio): the stand-in service hands one for this Studio's key, of the certificate's shape, so these
   legs read the contract as it stands. Its signature is the real service's to make (tests/licence-studio.mjs lsx1, on the real Worker). */
const STUDIO_CERT = { kind: "etiuda-seat-certificate", format: 1, licence: "c".repeat(32), desk: open.public, person: "d".repeat(64), code: "7K3M9QX2RT8VW4ZA",
  issued: NOW - 60000, until: NOW + 30 * 86400000, via: { kind: "etiuda-delegation" }, sig: { alg: "Ed25519", keyId: "licence-service", value: "e".repeat(128) } };
let studioTaken = null, renewTaken = null;
const vaultOn = { available: () => true, seal: (t) => Buffer.from("SEALED:" + Buffer.from(String(t)).reverse().toString("hex")), open: (b) => Buffer.from(String(Buffer.from(b)).slice(7), "hex").reverse().toString() };
/* Linux's basic_text: safeStorage still "seals", under a key written into Chromium itself, and the shell's vault says it is
   not available (shell/main.js noKeyring; tests/shell-guards.mjs 10 holds that), so a seal made anyway would be readable. */
const vaultBasic = { available: () => false, seal: (t) => Buffer.from("BASIC:" + String(t)), open: (b) => String(Buffer.from(b)).slice(6) };

/* The browser: reads the page's address, remembers it, and makes the one GET a browser makes to the redirect. */
function browser(reply) {
  const seen = { url: "", page: "", status: 0 };
  const openPage = (url) => {
    const page = wire.identityAuthorize(url);
    if (!page) return false;
    seen.url = page;
    const q = new URL(page).searchParams;
    const back = reply(q);
    http.get(q.get("redirect_uri") + "/" + back, (res) => {
      let body = ""; seen.status = res.statusCode;
      res.on("data", (d) => { body += d; }); res.on("end", () => { seen.page = body; });
    }).on("error", () => {});
    return true;
  };
  return { openPage, seen };
}
/* The provider's token address and the licence service, as Electron's net answers them. */
function standIn(provider, opts = {}) {
  let nonce = "";
  const setNonce = (n) => { nonce = n; };
  answer = (url, init) => {
    if (url === provider.token) {
      const form = new URLSearchParams(Buffer.from(init.body).toString("utf8"));
      if (form.get("grant_type") === "refresh_token" && opts.refuseRefresh) return { status: 400, body: JSON.stringify({ error: "invalid_grant" }) };
      const claims = { iss: provider.id === "microsoft" ? "https://login.microsoftonline.com/" + TID + "/v2.0" : "https://accounts.google.com",
        aud: provider.clientId, sub: "harbour-lamp-person", tid: TID, oid: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d", exp: Math.floor(NOW / 1000) + 3600,
        iat: Math.floor(NOW / 1000) };
      Object.assign(claims, opts.claims || {});
      if (form.get("grant_type") === "authorization_code") claims.nonce = opts.nonce || nonce;
      return { status: 200, body: JSON.stringify({ token_type: "Bearer", id_token: jwt(claims), refresh_token: opts.rotated || RAW_REFRESH, access_token: "opaque" }) };
    }
    if (/\/licence\/v1\/signin\/renew$/.test(url)) return { status: 200, body: JSON.stringify(opts.renew || { ok: false, reason: "token" }) };
    if (/\/licence\/v1\/signin$/.test(url)) return { status: 200, body: JSON.stringify(opts.service || { ok: false, reason: "no-licence" }) };
    return { status: 404, body: "{}" };
  };
  return setNonce;
}
const pageFor = (kind) => kind === "seat" ? "<p>signed in, close this tab</p>" : "<p>did not finish</p>";
/* A loopback path of the shape the flow makes ("/" and 16 hex). */
const CLEAN = "/" + "ab".repeat(8);
function io(b, extra = {}) {
  return Object.assign({ listen: (p, e, c) => wire.identityListen(p, e, c), openPage: b.openPage, tokenAsk: wire.identityRequest, ask: wire.licenceRequest,
    seal: (t) => C.sealRefresh(vaultOn, t), unseal: (s) => vaultOn.open(Buffer.from(String(s), "base64")), page: pageFor }, extra);
}
const getStatus = (url) => new Promise((resolve) => {
  http.get(url, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode)); }).on("error", (e) => resolve(e.code || "error"));
});

/* ---- si1 ------------------------------------------------------------------------------------------------------------ */
{
  const results = [];
  for (const p of LIST) {
    const a = await C.authorizeRequest(p, 54321, open.public), b = await C.authorizeRequest(p, 54321, open.public);
    const u = new URL(a.url), q = u.searchParams;
    const challenge = crypto.createHash("sha256").update(a.verifier).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    /* The nonce is bound to the key that will sign (the join): requests.mjs signinNonce of the lead and the seed sent beside. */
    const bound = /^[0-9a-f]{64}$/.test(a.seed) && a.nonce === await Q.signinNonce(open.public, a.seed) && a.nonce !== await Q.signinNonce("ab".repeat(32), a.seed);
    results.push(p.id + ":" + [u.origin + u.pathname === p.authorize, q.get("client_id") === p.clientId, q.get("response_type") === "code",
      q.get("code_challenge_method") === "S256", q.get("code_challenge") === challenge, /^[A-Za-z0-9_-]{43}$/.test(a.verifier),
      q.get("state") === a.state && a.state.length >= 43, q.get("nonce") === a.nonce && a.nonce.length >= 43,
      q.get("redirect_uri") === "http://127.0.0.1:54321" && a.redirect === "http://127.0.0.1:54321", (q.get("scope") || "").split(" ")[0] === "openid",
      a.state !== b.state && a.nonce !== b.nonce && a.verifier !== b.verifier && a.seed !== b.seed, !q.has("client_secret"), wire.identityAuthorize(a.url) === a.url, bound].map(Number).join(""));
  }
  check(results.every((r) => /^[a-z]+:1{14}$/.test(r)), "si1 the page's address carries PKCE S256, a state, a nonce bound to the signing key by a fresh seed, the client id, an openid scope and the loopback redirect, fresh each time, and the door admits it: " + results.join(" "));
}

/* ---- si2 ------------------------------------------------------------------------------------------------------------ */
{
  const pending = await C.authorizeRequest(MS, 50000, open.public);
  const wrong = C.loopbackAnswer("?code=c0de&state=" + "x".repeat(43), pending);
  const none = C.loopbackAnswer("?code=c0de", pending);
  const errorWrong = C.loopbackAnswer("?error=access_denied&state=other", pending);
  const right = C.loopbackAnswer("?code=c0de&state=" + pending.state, pending);
  const cancelled = C.loopbackAnswer("?error=access_denied&state=" + pending.state, pending);
  asked.length = 0;
  standIn(MS);
  const b = browser((q) => "?code=c0de&state=" + encodeURIComponent("not-" + q.get("state")));
  /* The reply with another state is ignored and the sign-in keeps waiting (si3); closed after it, it ends as cancelled. */
  let loopNow = null;
  const flow = C.signInFlow(io(b, { listen: async (p, e, c) => { loopNow = await wire.identityListen(p, e, c); return loopNow; } }), MS, open, () => NOW);
  for (let i = 0; i < 100 && !b.seen.status; i++) await new Promise((res) => setTimeout(res, 10));
  if (loopNow) loopNow.close();
  const r = await flow;
  check(wrong.reason === "signin-state" && none.reason === "signin-state" && errorWrong.reason === "signin-state" && right.ok && right.code === "c0de"
    && cancelled.reason === "signin-cancelled" && r.answer.reason === "signin-cancelled" && b.seen.status === 200 && asked.length === 0 && r.refreshSealed === "",
    "si2 a reply with another state, or none, is refused before its code or its error is read, and the flow then asks nothing of the provider or the service: "
    + [wrong.reason, none.reason, errorWrong.reason, right.ok ? "right:ok" : "right:" + right.reason, cancelled.reason, "flow:" + r.answer.reason, "asked:" + asked.length].join(" "));
}

/* ---- si3, the loopback listens until the sign-in's own reply (decision 15 item 4, Argon 5) ---------------------------- */
{
  const getPage = (url) => new Promise((resolve) => {
    http.get(url, (res) => { let body = ""; res.on("data", (d) => { body += d; }); res.on("end", () => resolve({ status: res.statusCode, body, type: res.headers["content-type"], cache: res.headers["cache-control"], location: res.headers.location })); })
      .on("error", (e) => resolve({ status: e.code }));
  });
  const pages = [];
  const loop = await wire.identityListen((q) => { pages.push(q); return "<p>handed page</p>"; }, (q) => new URLSearchParams(q).get("state") === "s1", CLEAN);
  const base = "http://127.0.0.1:" + loop.port;
  let settled = "waiting";
  loop.caught.then((q) => { settled = "caught"; }, () => { settled = "failed"; });
  const other = await getStatus(base + "/favicon.ico");
  const post = await new Promise((resolve) => { const rq = http.request(base + "/?code=a", { method: "POST" }, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode)); }); rq.on("error", (e) => resolve(e.code)); rq.end(); });
  /* A stray GET of "/" with no state, and one with another state, are each answered and leave the loopback waiting. */
  const bare = await getPage(base + "/");
  const wrong = await getPage(base + "/?code=stray&state=s2");
  await new Promise((r) => setTimeout(r, 30));
  const afterStrays = settled;
  const first = await getPage(base + "/?code=c0de&state=s1");
  const got = await loop.caught.catch((e) => "failed:" + e.message);
  loop.land("seat");
  const landed = await getPage(base + CLEAN);
  await new Promise((r) => setTimeout(r, 50));
  const second = await getStatus(base + "/?code=again&state=s1");
  /* A loopback the browser never came back to closes when asked, and its wait fails. */
  const idle = await wire.identityListen(() => "x", () => true, CLEAN);
  const idleBase = "http://127.0.0.1:" + idle.port;
  idle.close();
  const idleWait = await idle.caught.then(() => "settled", () => "failed");
  await new Promise((r) => setTimeout(r, 50));
  const idleAfter = await getStatus(idleBase + "/?code=late");
  /* It listens on the loopback interface alone: the same port asked on another of this machine's addresses finds nothing. */
  const ext = Object.values((await import("node:os")).networkInterfaces()).flat().find((n) => n && n.family === "IPv4" && !n.internal);
  const third = await wire.identityListen(() => "x", () => true, CLEAN);
  const elsewhere = ext ? await getStatus("http://" + ext.address + ":" + third.port + "/?code=x") : "no-other-address";
  third.close(); await third.caught.catch(() => {});
  /* The whole sign-in, its browser sending the two strays first: it waits through both, nothing is asked meanwhile, and the
     real reply then completes it (the service's answer reached). */
  const setNonce = standIn(MS, { service: { ok: false, reason: "no-licence" } });
  asked.length = 0;
  const strays = [];
  const b = { openPage: (url) => {
    const page = wire.identityAuthorize(url);
    if (!page) return false;
    const q = new URL(page).searchParams, redirect = q.get("redirect_uri");
    setNonce(q.get("nonce"));
    (async () => {
      strays.push(await getPage(redirect + "/"));
      strays.push(await getPage(redirect + "/?code=stray&state=" + "x".repeat(43)));
      await new Promise((r) => setTimeout(r, 30));
      strays.push(asked.length);
      strays.push(await getPage(redirect + "/?code=c0de&state=" + encodeURIComponent(q.get("state"))));
    })();
    return true;
  } };
  const flow = await C.signInFlow(io(b), MS, open, () => NOW);
  const flowStrays = strays.slice(0, 2).map((s) => s.status + ":" + (s.body === pageFor("earlier") ? "unfinished-page" : s.body)).join(",");
  check(other === 404 && post === 404 && bare.status === 200 && wrong.status === 200 && afterStrays === "waiting"
    && first.status === 303 && first.location === CLEAN && first.body === "" && /no-store/.test(first.cache || "")
    && landed.status === 200 && landed.body === "<p>handed page</p>" && /text\/html/.test(landed.type || "") && /no-store/.test(landed.cache || "")
    && got === "?code=c0de&state=s1" && pages.length === 3 && second === "ECONNREFUSED" && idleWait === "failed" && idleAfter === "ECONNREFUSED"
    && (elsewhere === "ECONNREFUSED" || elsewhere === "no-other-address" || elsewhere === "EADDRNOTAVAIL")
    && flowStrays === "200:unfinished-page,200:unfinished-page" && strays[2] === 0 && flow.answer.reason === "signin-no-licence",
    "si3 the loopback answers another path or verb 404, answers a stray GET of / with no state and one with another state and keeps"
    + " waiting, ends on the reply carrying its state, answering it 303 to the path it was given, and hands back its query; landed, that"
    + " path is the page it was handed, and it is then closed; an unanswered one closes when asked;"
    + " nothing listens on another address; a whole sign-in waits through both strays, asks nothing meanwhile, and completes on the real reply: "
    + [other, post, bare.status, wrong.status, "after-strays:" + afterStrays, first.status, landed.status, JSON.stringify(got), "pages:" + pages.length, second, idleWait, idleAfter,
      elsewhere, "flow-strays:" + flowStrays, "asked-meanwhile:" + strays[2], "flow:" + flow.answer.reason].join(" "));
}

/* ---- si4 and si6 ------------------------------------------------------------------------------------------------------ */
{
  const written = [];
  const outW = process.stdout.write.bind(process.stdout), errW = process.stderr.write.bind(process.stderr);
  const log = console.log, warn = console.warn, error = console.error;
  const results = [];
  for (const p of LIST) {
    asked.length = 0;
    runtimeFetches = 0;
    const setNonce = standIn(p, { service: { ok: false, reason: "no-licence" } });
    const b = browser((q) => { setNonce(q.get("nonce")); return "?code=c0de-" + p.id + "&state=" + encodeURIComponent(q.get("state")); });
    process.stdout.write = (s, ...a) => { written.push(String(s)); return outW(s, ...a); };
    process.stderr.write = (s, ...a) => { written.push(String(s)); return errW(s, ...a); };
    console.log = (...a) => written.push(a.join(" ")); console.warn = console.log; console.error = console.log;
    let r = null;
    try { r = await C.signInFlow(io(b), p, open, () => NOW); }
    finally { process.stdout.write = outW; process.stderr.write = errW; console.log = log; console.warn = warn; console.error = error; }
    await new Promise((res) => setTimeout(res, 50));
    const tokenAsks = asked.filter((x) => x.url === p.token);
    const form = tokenAsks[0] ? new URLSearchParams(Buffer.from(tokenAsks[0].init.body).toString("utf8")) : new URLSearchParams();
    const wantUrls = typeof Q.signinBytes === "function" ? [p.token, "https://etiuda.dev/licence/v1/signin"] : [p.token];
    results.push({ p: p.id, r, b, form, urls: asked.map((x) => x.url), wantUrls, init: tokenAsks[0] ? tokenAsks[0].init : null });
  }
  const si4 = results.map((x) => x.p + ":" + [JSON.stringify(x.urls) === JSON.stringify(x.wantUrls), x.form.get("grant_type") === "authorization_code",
    x.form.get("code") === "c0de-" + x.p, !!x.form.get("code_verifier") && x.form.get("redirect_uri") === new URL(x.b.seen.url).searchParams.get("redirect_uri"),
    x.form.get("client_id") === LIST.find((p) => p.id === x.p).clientId, !x.form.has("client_secret"),
    !!x.init && x.init.redirect === "error" && x.init.method === "POST"].map(Number).join(""));
  check(results.length === 2 && si4.every((s) => /:1{7}$/.test(s)) && runtimeFetches === 0,
    "si4 the token request goes through the door alone, to the provider's token address (then the licence service's signin where stage 1's bytes are in the tree:"
    + " " + (typeof Q.signinBytes === "function" ? "they are" : "not yet, so nothing is sent there") + "), with the code, the verifier and the redirect, no secret, no redirect followed,"
    + " never the runtime's fetch: " + si4.join(" ") + " runtime:" + runtimeFetches + " | " + results.map((x) => x.urls.join(",")).join(" | "));
  /* si6: the seal is handed back only once the service took the sign-in; here the stand-in service refused, so nothing. Run
     once more with a service that takes it, and read what came back, what was written and the page the browser showed. */
  const sealedNone = results.every((x) => x.r.refreshSealed === "");
  /* Where stage 1's bytes are in the tree, a sign-in the service takes hands back the seal, and the seal opens to the token. */
  let takenSeal = "not-run";
  if (typeof Q.signinBytes === "function") {
    const setNonce = standIn(MS, { service: { ok: true, certificates: { studio: STUDIO_CERT } } });
    const b = browser((q) => { setNonce(q.get("nonce")); return "?code=c0de&state=" + encodeURIComponent(q.get("state")); });
    const r = await C.signInFlow(io(b), MS, open, () => NOW);
    studioTaken = C.keepWho({ by: "signin" }, r.answer);
    takenSeal = r.answer.ok === true && r.refreshSealed && vaultOn.open(Buffer.from(r.refreshSealed, "base64")) === RAW_REFRESH
      && r.refreshSealed.indexOf(RAW_REFRESH) < 0 ? "sealed-on-take" : "WRONG";
  }
  const leaked = written.some((s) => s.indexOf(RAW_REFRESH) >= 0) || results.some((x) => x.b.seen.page.indexOf(RAW_REFRESH) >= 0);
  const sealedTaken = C.sealRefresh(vaultOn, RAW_REFRESH);
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const nowAt = mainText.indexOf("async function licenceNow()"), nowEnd = mainText.indexOf("\n}\n", nowAt);
  const licenceNowBody = nowAt < 0 ? "" : mainText.slice(nowAt, nowEnd);
  const pageText = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8") + fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  check(sealedNone && takenSeal !== "WRONG" && !leaked && sealedTaken !== "" && sealedTaken.indexOf(RAW_REFRESH) < 0 && Buffer.from(sealedTaken, "base64").toString().indexOf(RAW_REFRESH) < 0
    && vaultOn.open(Buffer.from(sealedTaken, "base64")) === RAW_REFRESH && licenceNowBody.length > 200 && !/refresh/i.test(licenceNowBody)
    && !/refreshSealed|refresh_token/.test(pageText) && /seal: \(token\) => C\.sealRefresh\(vault, token\)/.test(mainText),
    "si6 the refresh token is kept only sealed and only once the service took the sign-in, is in no line written during the flow nor in the browser's page,"
    + " and neither licenceNow (what the page is handed) nor the page and its bridge name it: " + [sealedNone ? "none-kept-on-refusal" : "KEPT", "taken:" + takenSeal, leaked ? "LEAKED" : "not-written",
      sealedTaken.indexOf(RAW_REFRESH) < 0 ? "sealed" : "RAW", "licenceNow:" + (/refresh/i.test(licenceNowBody) ? "NAMES-IT" : "silent")].join(" "));
}

/* ---- si5 ------------------------------------------------------------------------------------------------------------ */
{
  const refused = ["https://login.example.com/common/oauth2/v2.0/token", "http://login.microsoftonline.com/common/oauth2/v2.0/token",
    "https://login.microsoftonline.com:8443/common/oauth2/v2.0/token", "https://user@login.microsoftonline.com/common/oauth2/v2.0/token",
    "https://login.microsoftonline.com/common/oauth2/v2.0/token?x=1", "https://login.microsoftonline.com/common/oauth2/v2.0/token#f",
    "https://login.microsoftonline.com/common/../evil/token", "https://login.microsoftonline.com/common/%2e%2e/evil/token",
    "https://LOGIN.microsoftonline.com/common/oauth2/v2.0/token", "https://login.microsoftonline.com.evil.test/token", "https://etiuda.dev/licence/v1/check"];
  asked.length = 0;
  const got = [];
  for (const u of refused) {
    try { await wire.identityRequest(u, Buffer.from("a=b")); got.push("sent"); } catch (e) { got.push(/only at its token address/.test(e.message) ? "refused" : "other"); }
  }
  let big = "";
  try { await wire.identityRequest(MS.token, Buffer.alloc(16385, 97)); big = "sent"; } catch (e) { big = /only at its token address/.test(e.message) ? "refused" : "other"; }
  let notBytes = "";
  try { await wire.identityRequest(MS.token, "a=b"); notBytes = "sent"; } catch (e) { notBytes = /only at its token address/.test(e.message) ? "refused" : "other"; }
  const sentBefore = asked.length;
  answer = () => ({ status: 200, body: "{}" });
  let good = "";
  try { await wire.identityRequest(GG.token, Buffer.from("a=b")); good = asked.length === 1 && asked[0].url === GG.token ? "sent" : "other"; } catch (e) { good = "refused"; }
  const pages = ["https://evil.test/o/oauth2/v2/auth?x=1", "http://accounts.google.com/o/oauth2/v2/auth?x=1", "https://accounts.google.com:444/o/oauth2/v2/auth?x=1",
    "https://accounts.google.com/o/oauth2/v2/auth?x=1#y", "javascript:alert(1)", "file:///C:/Windows/notepad.exe"].map((u) => wire.identityAuthorize(u));
  const goodPage = wire.identityAuthorize("https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=y");
  check(got.every((g) => g === "refused") && big === "refused" && notBytes === "refused" && sentBefore === 0 && good === "sent"
    && pages.every((p) => p === "") && goodPage !== "",
    "si5 the door refuses another host, http, a port, a user, a query, a fragment, a dot segment plain or %2e, a host not in canonical form, a look-alike host,"
    + " the licence address and a form past its bound, sending nothing, and sends to a provider's token address; the browser is handed only a page at the fixed hosts: "
    + got.join(",") + " big:" + big + " string:" + notBytes + " sent-before:" + sentBefore + " good:" + good + " pages:" + pages.map((p) => p ? "OPEN" : "-").join(""));
}

/* ---- si7, the quiet renewal through signin/renew (decision 15 item 1) ------------------------------------------------- */
{
  const ioWith = (vault, extra) => Object.assign({ tokenAsk: wire.identityRequest, ask: wire.licenceRequest, seal: (t) => C.sealRefresh(vault, t),
    unseal: (s) => (vault === vaultBasic ? vault.open(s) : vault.open(Buffer.from(String(s), "base64"))) }, extra || {});
  const basicSeal = C.sealRefresh(vaultBasic, RAW_REFRESH);
  const plannedBasic = C.planFor({ by: "signin", lead: "old-key", checked: 1, tried: 1 }, "new-key", NOW);
  asked.length = 0;
  const renewBasic = await C.renewSignIn(ioWith(vaultBasic), MS, open, basicSeal, () => NOW);
  const askedBasic = asked.length;
  const keptSeal = C.sealRefresh(vaultOn, RAW_REFRESH);
  /* A sign-in is bound to the key that signed it, so a key made again is the lead's to sign in, seal or no seal (the join). */
  const plannedKept = C.planFor({ by: "signin", lead: "old-key", checked: 1, tried: 1, refreshSealed: keptSeal }, "new-key", NOW);
  /* The refreshed token, which carries no nonce, goes to signin/renew signed by this key over signinRenewBytes, with no seed. */
  asked.length = 0;
  standIn(MS, { rotated: "rt-rotated-in-0123456789", renew: { ok: false, reason: "full" } });
  const renew = await C.renewSignIn(ioWith(vaultOn), MS, open, keptSeal, () => NOW);
  const form = asked[0] ? new URLSearchParams(Buffer.from(asked[0].init.body).toString("utf8")) : new URLSearchParams();
  const body = asked[1] ? JSON.parse(Buffer.from(asked[1].init.body).toString("utf8")) : {};
  const tokenHash = body.idToken ? crypto.createHash("sha256").update(body.idToken).digest("hex") : "";
  const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(open.public, "hex")]), format: "der", type: "spki" });
  const verifies = typeof Q.signinRenewBytes === "function" && !!body.sig
    && crypto.verify(null, Buffer.from(Q.signinRenewBytes({ provider: "microsoft", tokenHash, lead: open.public, t: NOW })), pub, Buffer.from(body.sig, "hex"));
  const claims = body.idToken ? JSON.parse(Buffer.from(body.idToken.split(".")[1], "base64url").toString("utf8")) : {};
  const rotated = renew.refreshSealed ? vaultOn.open(Buffer.from(renew.refreshSealed, "base64")) : "";
  const renewAsked = asked.map((x) => x.url);
  /* The service refusing the renewal keeps the seal (afterCheck decides); the provider no longer taking it forgets it. */
  standIn(MS, { renew: { ok: false, reason: "token" } });
  const unbound = await C.renewSignIn(ioWith(vaultOn), MS, open, keptSeal, () => NOW);
  standIn(MS, { refuseRefresh: true });
  asked.length = 0;
  const gone = await C.renewSignIn(ioWith(vaultOn), MS, open, keptSeal, () => NOW);
  const goneAsked = asked.length;
  standIn(MS, { renew: { ok: true, me: "7K3M9QX2RT8VW4ZA", owner: true, certificates: { studio: STUDIO_CERT } } });
  const took = await C.renewSignIn(ioWith(vaultOn), MS, open, keptSeal, () => NOW);
  renewTaken = C.keepWho({ by: "signin" }, took.answer);
  check(basicSeal === "" && plannedBasic === "ask" && renewBasic.answer.reason === "signin-ask" && askedBasic === 0 && plannedKept === "ask"
    && renewAsked.length === 2 && renewAsked[0] === MS.token && /\/licence\/v1\/signin\/renew$/.test(renewAsked[1])
    && form.get("grant_type") === "refresh_token" && form.get("refresh_token") === RAW_REFRESH && form.get("scope") === "openid profile email offline_access" && !form.has("client_secret")
    && JSON.stringify(Object.keys(body).sort()) === JSON.stringify(["idToken", "lead", "provider", "sig", "t"]) && body.provider === "microsoft" && body.lead === open.public
    && body.t === NOW && verifies && claims.nonce === undefined && rotated === "rt-rotated-in-0123456789" && renew.answer.reason === "signin-full"
    && unbound.answer.reason === "signin-token" && unbound.refreshSealed === keptSeal && gone.answer.reason === "signin-ask" && gone.refreshSealed === "" && goneAsked === 1
    && took.answer.ok === true && took.answer.me === "7K3M9QX2RT8VW4ZA",
    "si7 basic_text keeps no refresh token and the next renewal asks the lead (nothing sent); a key made again asks the lead; a renewal exchanges the"
    + " sealed token with Microsoft's scopes and posts the nonce-less token to signin/renew, signed over signinRenewBytes, no seed, sealing the rotated token;"
    + " the service's refusal keeps the seal, a provider that no longer takes it forgets it: " + [JSON.stringify(basicSeal), plannedBasic, renewBasic.answer.reason,
      "asked:" + askedBasic, plannedKept, renewAsked.map((u) => u.replace(/^https:\/\/[^/]+/, "")).join(","), form.get("scope"), Object.keys(body).sort().join(","),
      verifies ? "verifies" : "DOES-NOT-VERIFY", rotated ? "rotated-sealed" : "no-rotation", renew.answer.reason, unbound.answer.reason, gone.answer.reason, took.answer.ok].join(" "));
}

/* ---- si7c: the Studio's own certificate, as the stand-in service now answers it ----------------------------------- */
check(!!studioTaken && !!studioTaken.seatCerts && !!studioTaken.seatCerts.studio && studioTaken.seatCerts.studio.desk === open.public
  && !!renewTaken && !!renewTaken.seatCerts && !!renewTaken.seatCerts.studio && renewTaken.seatCerts.studio.desk === open.public,
  "si7c the stand-in service's sign-in and renewal answer the Studio's own seat certificate for this key (review xi), and the client keeps"
  + " it, on which the gate rests: " + JSON.stringify([studioTaken && Object.keys(studioTaken.seatCerts || {}), renewTaken && Object.keys(renewTaken.seatCerts || {})]));

/* ---- si8 ------------------------------------------------------------------------------------------------------------ */
{
  const pending = { nonce: "n-0123456789abcdef0123456789abcdef0123456789a" };
  const base = { aud: MS.clientId, iss: "https://login.microsoftonline.com/" + TID + "/v2.0", tid: TID, sub: "s", exp: Math.floor(NOW / 1000) + 3600, nonce: pending.nonce };
  const res = (claims, status = 200, extra = {}) => ({ status, bytes: Buffer.from(JSON.stringify(Object.assign({ id_token: jwt(claims), refresh_token: "r" }, extra))) });
  const cases = {
    good: C.tokensOf(res(base), MS, pending, NOW).ok,
    audience: C.tokensOf(res(Object.assign({}, base, { aud: "00000003-0000-0000-c000-000000000000" })), MS, pending, NOW).reason,
    issuer: C.tokensOf(res(Object.assign({}, base, { iss: "https://login.microsoftonline.com/" + "0".repeat(8) + "-0000-0000-0000-" + "0".repeat(12) + "/v2.0" })), MS, pending, NOW).reason,
    template: C.tokensOf(res(Object.assign({}, base, { iss: "https://login.microsoftonline.com/{tenantid}/v2.0", tid: "{tenantid}" })), MS, pending, NOW).reason,
    expired: C.tokensOf(res(Object.assign({}, base, { exp: Math.floor(NOW / 1000) - 3600 })), MS, pending, NOW).reason,
    noNonce: C.tokensOf(res(Object.assign({}, base, { nonce: undefined })), MS, pending, NOW).reason,
    otherNonce: C.tokensOf(res(Object.assign({}, base, { nonce: "other" })), MS, pending, NOW).reason,
    refreshNoNonce: C.tokensOf(res(Object.assign({}, base, { nonce: undefined })), MS, null, NOW).ok,
    googleFull: C.tokensOf(res({ aud: GG.clientId, iss: "https://accounts.google.com", sub: "g", exp: base.exp, nonce: pending.nonce }), GG, pending, NOW).ok,
    googleBare: C.tokensOf(res({ aud: GG.clientId, iss: "accounts.google.com", sub: "g", exp: base.exp, nonce: pending.nonce }), GG, pending, NOW).ok,
    googleAsMs: C.tokensOf(res({ aud: GG.clientId, iss: "https://accounts.google.com", sub: "g", exp: base.exp, nonce: pending.nonce }), MS, pending, NOW).reason,
    refused: C.tokensOf({ status: 400, bytes: Buffer.from('{"error":"invalid_grant"}') }, MS, pending, NOW).reason,
    noToken: C.tokensOf({ status: 200, bytes: Buffer.from('{"access_token":"a"}') }, MS, pending, NOW).reason,
  };
  check(cases.good === true && cases.audience === "signin-token" && cases.issuer === "signin-token" && cases.template === "signin-token" && cases.expired === "signin-token"
    && cases.noNonce === "signin-token" && cases.otherNonce === "signin-token" && cases.refreshNoNonce === true && cases.googleFull === true && cases.googleBare === true
    && cases.googleAsMs === "signin-token" && cases.refused === "signin-expired" && cases.noToken === "signin-refused",
    "si8 an ID token is read before it goes on: " + Object.entries(cases).map(([k, v]) => k + "=" + v).join(" "));
}

/* ---- si9 ------------------------------------------------------------------------------------------------------------ */
{
  const sent = [];
  const ask = async (route, bytes) => { sent.push({ route, body: JSON.parse(Buffer.from(bytes).toString("utf8")) }); return { status: 200, bytes: Buffer.from('{"ok":false,"reason":"full"}') }; };
  const token = jwt({ aud: MS.clientId, sub: "s" }), seed = "7a".repeat(32);
  const a = await C.signIn(ask, open, "microsoft", token, NOW, seed);
  const b = sent[0] ? sent[0].body : {};
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(open.public, "hex")]), format: "der", type: "spki" });
  /* The seed is inside the signed bytes, their last line (review 2's finding 12): the signature holds over those and not over the seedless ones. */
  const verifies = !!b.sig && crypto.verify(null, Buffer.from(Q.signinBytes({ provider: "microsoft", tokenHash, lead: open.public, t: NOW, seed })), pub, Buffer.from(b.sig, "hex"))
    && !crypto.verify(null, Buffer.from(Q.signinBytes({ provider: "microsoft", tokenHash, lead: open.public, t: NOW })), pub, Buffer.from(b.sig, "hex"));
  /* The whole flow's request: the seed sent beside the token is the one whose nonce the token carries, made from this key. */
  const setNonce = standIn(MS, { service: { ok: false, reason: "no-licence" } });
  const br = browser((q) => { setNonce(q.get("nonce")); return "?code=c0de&state=" + encodeURIComponent(q.get("state")); });
  asked.length = 0;
  await C.signInFlow(io(br), MS, open, () => NOW);
  const sentIn = asked.find((x) => /\/signin$/.test(x.url));
  const flowBody = sentIn ? JSON.parse(Buffer.from(sentIn.init.body).toString("utf8")) : {};
  const claims = flowBody.idToken ? JSON.parse(Buffer.from(flowBody.idToken.split(".")[1], "base64url").toString("utf8")) : {};
  const flowBound = !!flowBody.seed && claims.nonce === await Q.signinNonce(open.public, flowBody.seed);
  check(sent.length === 1 && sent[0].route === "signin" && JSON.stringify(Object.keys(b).sort()) === JSON.stringify(["idToken", "lead", "provider", "seed", "sig", "t"])
    && b.provider === "microsoft" && b.idToken === token && b.lead === open.public && b.t === NOW && b.seed === seed && verifies && a.reason === "signin-full" && flowBound,
    "si9 the signin request is stage 1's interface with the join's seed, signed over signinBytes with the token's SHA-256, and in the whole flow the seed sent"
    + " makes, with this key, the nonce the token carries: " + [sent.length, sent[0] && sent[0].route, Object.keys(b).sort().join(","), verifies ? "verifies" : "DOES-NOT-VERIFY",
      a.reason, flowBound ? "flow-bound" : "FLOW-NOT-BOUND"].join(" "));
}

/* ---- si10 ----------------------------------------------------------------------------------------------------------- */
{
  const shipped = C.signInProviders();
  const none = C.signInProviders([Object.assign({}, MS, { clientId: "" }), Object.assign({}, GG, { clientId: "" })]);
  const some = C.signInProviders(LIST).map((p) => p.id);
  const hostsHeld = C.SIGN_IN_PROVIDERS.every((p) => wire.IDENTITY_HOSTS.indexOf(new URL(p.authorize).hostname) >= 0 && wire.IDENTITY_HOSTS.indexOf(new URL(p.token).hostname) >= 0);
  check(none.length === 0 && some.join(",") === "microsoft,google" && C.providerOf("google", LIST) === GG && C.providerOf("other", LIST) === null
    && shipped.length === 0 && C.SIGN_IN_PROVIDERS.length === 2 && C.SIGN_IN_PROVIDERS.map((p) => p.id).join() === "microsoft,google"
    && C.SIGN_IN_PROVIDERS.every((p) => p.clientId === "") && C.providerOf("microsoft") === null
    && C.SIGN_IN_PROVIDERS.every((p) => p.clientSecret === "") && hostsHeld && C.SIGN_IN_PROVIDERS.every((p) => Object.isFrozen(p)),
    "si10 as shipped no client id is configured and nothing is offered; with both configured both are, each provider's addresses are at"
    + " the door's hosts, and the configuration holds no secret:"
    + " shipped offers " + (shipped.map((p) => p.id).join(",") || "none") + "; configured " + some.join(","));
}

/* ---- the page's sign-in on tests/page-stand-in.mjs: the door, Settings' Account, the rail and the band (board 980) -------- */
const { loadPage: pageOn } = await import("./page-stand-in.mjs");
const APP = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
/* A leg that throws on a tree without what it reads fails as itself rather than ending the file. */
async function leg(name, fn) {
  try { await fn(); } catch (e) { check(false, name + " could not run: " + String(e && e.message || e).split("\n")[0]); }
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const plainText = (h) => String(h || "").replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]*>/g, " ").replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ");
const OFFERED = ["microsoft", "google"];
const SIGNED_CODE = "7K3M9QX2RT8VW4ZA", OTHER_CODE = "ZZZZ0000YYYY1111", FREE_CODE = "MNPQRSTV23456789";
/** Whether any of this file's sign-in codes is in `h`, in any spacing or case (board 1017: none is on a screen). Its own list, since the legs
 *  that read it run before some of the constants are made. */
function codeIn(h) {
  const flat = String(h || "").replace(/\s+/g, "").toUpperCase();
  return ["7K3M9QX2RT8VW4ZA", "ZZZZ0000YYYY1111", "MNPQRSTV23456789", "7K3MQ9TV2XRBHN4W", "D9FA4KXM7RWC3TPB", "PQRS2345TVWX6789"]
    .some((c) => flat.indexOf(c) >= 0);
}
const HELD0 = { licence: { status: "none", trial: null, unusable: null }, grant: null, by: null, checked: null, keyChanged: false, hasKey: true,
  signing: { keyId: "", problem: null }, signIn: OFFERED, provider: null, signinAsk: false, signinCode: null, signinOwner: false };
const SIGNED = Object.assign({}, HELD0, { licence: { status: "active", org: "Kappa Tools", seats: 2, trial: null, unusable: null }, by: "signin",
  provider: "microsoft", signinCode: SIGNED_CODE, signinOwner: false, checked: "2026-11-11", checkedAt: Date.UTC(2026, 10, 11, 13, 2), unanswered: false });
/** Studio's page over `held`, what studio:licence answers, started as boot starts it: who is signed in read first where sign-in is
 *  offered, then the first paint on Overview. Every channel call is kept in `calls` as "name" or "name:arg,arg". */
async function studio(held, o = {}) {
  const calls = [];
  const api = { signing: () => Promise.resolve({ error: null, signing: { keyId: "", problem: null } }),
    licence: () => Promise.resolve(Object.assign({ error: null }, JSON.parse(JSON.stringify(held)))),
    signinDoorClose: () => Promise.resolve({ error: null, closed: true }),
    licenceSeats: () => Promise.resolve({ error: null, seats: [], counts: null }),
    seatNames: () => Promise.resolve({ error: null, names: {} }),
    copy: () => Promise.resolve({ copied: true }) };
  Object.assign(api, o.api || {});
  for (const k of Object.keys(api)) { const fn = api[k]; api[k] = (...a) => { calls.push(k + (a.length ? ":" + a.map(String).join(",") : "")); return fn(...a); }; }
  const home = pageOn({ api, uiLang: o.lang || "en", source: o.source || APP });
  const P = home.page;
  const get = (n) => { try { return P.__get(n); } catch { return null; } };
  P.S.host = Object.assign({ version: "0.1.0", tour: { offered: true }, langs: [], signing: { keyId: "", problem: null },
    signIn: Array.isArray(held.signIn) ? held.signIn : [], signinDoor: false }, o.host || {});
  P.S.screen = "projects";
  if (get("signInLoad")) await get("signInLoad")();
  P.paint();
  const sx = () => { P.S.screen = "settings"; P.S.sx = { sec: "account", q: "" }; const f = get("settingsPageHtml"); return f ? f() : ""; };
  const home2 = () => { P.S.screen = "projects"; P.paint(); return home.node("#main").innerHTML; };
  const press = (act, attrs) => (P.ACTS[act] ? P.ACTS[act]({ getAttribute: (k) => (attrs && attrs[k] !== undefined ? attrs[k] : null) })
    : Promise.resolve("no act " + act));
  return { P, home, calls, get, main: () => home.node("#main").innerHTML, rail: () => home.node("#rail").innerHTML, sx, home2, press };
}
/* The shell itself, shell/main.js under a stub of Electron as tests/licence-studio.mjs loads it: no window, and Electron's net is
   this file's own recorder, so any request it made would be in `asked`. Its profile is a fresh folder of its own. */
const A5_SCRATCH = path.join(ROOT, "scratch", "sign-in-legs");
let shells = 0;
clearScratch(A5_SCRATCH);
async function shellOn(o = {}) {
  const Module = require("node:module"), ud = path.join(A5_SCRATCH, "profile-" + (++shells));
  fs.mkdirSync(ud, { recursive: true });
  /* A Studio that works, as a lead's does (the gate refuses every closed channel of one that does not): signed in under a trial a
     throwaway root signed. `o.stopped` leaves the profile bare, and a leg that writes licence-service.json itself puts its own state. */
  const seated = o.stopped === true ? {} : await seatEnv(ud, true, o.env);
  const handlers = {}, opened = [];
  class Win {
    constructor() { this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {}, getURL: () => "", reload() {} }; }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; } isMinimized() { return false; }
    close() {} focus() {} restore() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const stub = Object.assign({}, electron, {
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} }, getPath: () => ud, getVersion: () => "0.0.0",
      getLocale: () => "en-GB", requestSingleInstanceLock: () => true, whenReady: () => new Promise(() => {}), on() {}, quit() {}, exit() {}, isPackaged: false },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => null, getAllWindows: () => [] }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) }, dialog: {},
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false }, clipboard: { writeText() {} },
    safeStorage: o.storage || { isEncryptionAvailable: () => true, encryptString: (s) => Buffer.from(s), decryptString: (b) => String(b) },
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} }, session: { defaultSession: {} },
    shell: { openExternal: async (u) => { opened.push(String(u)); }, openPath: async () => "", trashItem: async () => {} },
    ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on() {} },
  });
  /* `o.env` sets more variables for the shell's start alone (null removes one), and `o.root` loads another tree's shell.
     The legs' catalog is TEAM_DIR, a child of that folder. A directory the page names is read only when it is a child of
     the projects root, so the root is that folder unless a leg names another. */
  const extra = Object.assign({ ETIUDA_SIGNIN_PREVIEW: null, STUDIO_PROJECTS: path.dirname(TEAM_DIR) }, seated, o.env || {});
  const was = { o: process.env.STUDIO_TEST_OFFSCREEN, p: process.env.STUDIO_NO_PROXY_SERVER };
  for (const k of Object.keys(extra)) was["env:" + k] = process.env[k];
  process.env.STUDIO_TEST_OFFSCREEN = "1"; process.env.STUDIO_NO_PROXY_SERVER = "off";
  for (const [k, v] of Object.entries(extra)) { if (v === null) delete process.env[k]; else process.env[k] = v; }
  const root = o.root || ROOT, main = path.join(root, "shell", "main.js"), load = Module._load;
  Module._load = function (req) {
    if (req === "electron") return stub;
    if (/studio-thread\.cjs$/.test(req)) return { call: o.thread || (() => Promise.resolve({})) };
    return load.apply(this, arguments);
  };
  let mod = null;
  try { delete require.cache[main]; mod = require(main); } finally { Module._load = load; }
  /* `o.sender` stands for the asking page's webContents (e.sender), `o.storage` for safeStorage. */
  const ev ={ senderFrame: { parent: null, url: pathToFileURL(path.join(root, "ui", "index.html")).href }, sender: o.sender };
  const ask = async (ch, ...a) => { if (!handlers[ch]) throw new Error("no channel " + ch); return handlers[ch](ev, ...a); };
  const file = (name) => path.join(ud, name);
  const done = () => { for (const [k, v] of [["STUDIO_TEST_OFFSCREEN", was.o], ["STUDIO_NO_PROXY_SERVER", was.p],
    ...Object.keys(extra).map((k) => [k, was["env:" + k]])]) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v; } };
  return { ud, ask, file, opened, handlers, done, mod };
}

/** A scratch copy of the tree as shellOn loads it, its src/licence-client.mjs holding Microsoft's client id `ms` and Google's `g` in
 *  place of the shipped (empty) ones: {tree, planted}, planted false where the table does not hold both once. */
function treeWithIds(name, ms, g) {
  const tree = path.join(A5_SCRATCH, name);
  for (const d of ["shell", "src", "ui", path.join("service", "licence"), path.join("engine", "pinned")]) fs.cpSync(path.join(ROOT, d), path.join(tree, d), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "package.json"), path.join(tree, "package.json"));
  const at = path.join(tree, "src", "licence-client.mjs"), text = fs.readFileSync(at, "utf8"), ids = { microsoft: ms, google: g };
  const re = /(Object\.freeze\(\{ id: "(microsoft|google)", issuer: "[^"]*", clientId: )"[^"]*"/g;
  const planted = (text.match(re) || []).length === 2;
  if (planted) fs.writeFileSync(at, text.replace(re, (m, head, id) => head + JSON.stringify(ids[id])));
  return { tree, planted };
}

/* ---- si11, the door's sign-in ---------------------------------------------------------------------------------------- */
await leg("si11", async () => {
  let release = null;
  const answered = Object.assign({ error: null }, SIGNED);
  const s = await studio(HELD0, { api: { licenceSignIn: () => new Promise((r) => { release = () => r(answered); }) } });
  const before = s.main();
  const pressed = s.press("lic-signin", { "data-v": "microsoft" });
  await tick();
  const waiting = s.main();
  if (release) release();
  await pressed;
  const after = s.main(), acct = s.sx();
  const pl = await studio(HELD0, { lang: "pl" });
  const plText = plainText(pl.main());
  const parts = {
    door: /data-signin-door/.test(before) && /data-act="lic-signin" data-v="microsoft"[^>]*>[\s\S]*?<span>Sign in with Microsoft<\/span>/.test(before)
      && /data-act="lic-signin" data-v="google"[^>]*>[\s\S]*?<span>Sign in with Google<\/span>/.test(before) && !/data-act="door-later"/.test(before),
    nameAlone: JSON.stringify(s.calls.filter((c) => /^licenceSignIn/.test(c))) === '["licenceSignIn:microsoft"]',
    waits: plainText(waiting).indexOf("Finish signing in in the browser") >= 0 && plainText(waiting).indexOf("Waiting for Microsoft; Studio carries on by itself") >= 0
      && /<li class="done">[^<]*<\/li><li class="now">/.test(waiting),
    after: !/data-signin-door/.test(after) && plainText(acct).indexOf("Signed in with Microsoft") >= 0,
    polish: plText.indexOf("Etiuda Studio zaczyna się od zalogowania.") >= 0 && plText.indexOf("Zaloguj się za pomocą konta Microsoft") >= 0
      && !/Sign in|Not now|Nie teraz|What happens/.test(plText),
  };
  check(Object.values(parts).every(Boolean),
    "si11 the door draws one provider's own button per provider offered, a press hands the shell the provider's name alone, the door says where to finish"
    + " while it waits, and after the sign-in the door is gone for good and Account says who signed in with; in Polish its words are the table's: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si12, a browser that will not open (the join; the test architect's small edit) -------------------------------- */
{
  const runs = {};
  for (const [name, openPage] of [["false", () => false], ["rejects", () => Promise.reject(new Error("no handler for https"))],
    ["resolves-false", async () => false]]) {
    let port = 0;
    asked.length = 0;
    const started = Date.now();
    const r = await C.signInFlow(io({ openPage }, { listen: async (p, e, c) => { const loop = await wire.identityListen(p, e, c); port = loop.port; return loop; } }), MS, open, () => NOW);
    await new Promise((res) => setTimeout(res, 30));
    runs[name] = { reason: r.answer.reason, ms: Date.now() - started, after: await getStatus("http://127.0.0.1:" + port + "/?code=late"), asked: asked.length };
  }
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  check(Object.values(runs).every((x) => x.reason === "signin-browser" && x.ms < 2000 && x.after === "ECONNREFUSED" && x.asked === 0)
    && /async function openSignInPage\(url\) \{[^}]*try \{ await shell\.openExternal\(authorize\); \} catch \{ return false; \}/.test(mainText),
    "si12 a browser that will not open, by a false answer or a rejection, is said at once as signin-browser, the loopback closed and nothing asked; the shell awaits"
    + " the opening and refuses on its rejection: " + Object.entries(runs).map(([k, x]) => k + ":" + x.reason + "/" + x.ms + "ms/" + x.after).join(" "));
}

/* ---- si13, Cancel ends a sign-in under way (the join; the test architect's small edit; the door since board 980's A5) ---- */
await leg("si13", async () => {
  let loopNow = null, port = 0;
  asked.length = 0;
  const started = Date.now();
  const flow = C.signInFlow(io({ openPage: () => true }, { listen: async (p, e, c) => { loopNow = await wire.identityListen(p, e, c); port = loopNow.port; return loopNow; } }), MS, open, () => NOW);
  await new Promise((res) => setTimeout(res, 50));
  loopNow.close();
  const r = await flow;
  const after = await getStatus("http://127.0.0.1:" + port + "/?code=late");
  const flowAsked = asked.length;
  /* The page: the door's Cancel while a sign-in waits asks the shell to stop it, and the cancel it ends in paints no refusal. */
  let release = null;
  const s = await studio(HELD0, { api: {
    licenceSignIn: () => new Promise((res) => { release = () => res({ error: "cancelled", said: { frame: "x", vars: {}, why: "signin-cancelled" } }); }),
    licenceSignInStop: () => { if (release) release(); return Promise.resolve({ error: null, stopped: true }); } } });
  const press = s.press("lic-signin", { "data-v": "microsoft" });
  await tick();
  const waiting = s.main();
  await s.press("signin-stop");
  /* A Cancel that does not stop the sign-in leaves the press waiting: a second is long enough to say so. */
  await Promise.race([press, new Promise((res) => setTimeout(res, 1000))]);
  const back = s.main();
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const stopAt = mainText.indexOf('answer("studio:licence-signin-stop"');
  const calls = s.calls.filter((c) => /^licenceSignIn/.test(c));
  check(r.answer.reason === "signin-cancelled" && Date.now() - started < 2000 && after === "ECONNREFUSED" && flowAsked === 0
    && /data-act="signin-stop"/.test(waiting) && JSON.stringify(calls) === '["licenceSignIn:microsoft","licenceSignInStop"]'
    && /data-signin-door/.test(back) && !/data-signin-fact/.test(back) && /data-act="lic-signin" data-v="google"/.test(back) && !s.P.S.signing && !s.P.S.signFail
    && stopAt > 0 && /if \(signInLoop\) signInLoop\.close\(\);/.test(mainText.slice(stopAt, stopAt + 300)),
    "si13 Cancel ends a sign-in under way: the loopback closed, the flow ends at once as signin-cancelled with nothing asked, the door's Cancel asks the shell"
    + " to stop it and the cancel paints no refusal, the door back as it was, and the shell's stop closes the loopback: "
    + [r.answer.reason, after, JSON.stringify(calls), /data-signin-door/.test(back) ? "door" : "NO-DOOR"].join(" "));
});

/* ---- si14, the scopes (decision 15 item 6) ------------------------------------------------------------------------- */
{
  const ms = C.SIGN_IN_PROVIDERS.find((p) => p.id === "microsoft"), gg = C.SIGN_IN_PROVIDERS.find((p) => p.id === "google");
  const mq = new URL((await C.authorizeRequest(MS, 54321, open.public)).url).searchParams;
  const gq = new URL((await C.authorizeRequest(GG, 54321, open.public)).url).searchParams;
  const clientText = fs.readFileSync(path.join(ROOT, "src", "licence-client.mjs"), "utf8");
  
  check(ms.scope === "openid profile email offline_access" && ms.refreshScope === "openid profile email offline_access" && C.GOOGLE_HD_NEEDS_EMAIL === undefined
    && gg.scope === "openid email profile" && gg.refreshScope === "" && mq.get("scope") === "openid profile email offline_access" && gq.get("scope") === "openid email profile"
    && gq.get("prompt") === "select_account" && gq.get("access_type") === null && !/GOOGLE_HD_NEEDS_EMAIL/.test(clientText),
    "si14 the first sign-in asks Microsoft for openid profile email offline_access and Google for openid email profile with no consent page forced; a renewal asks Microsoft"
    + " openid profile email offline_access and Google nothing: microsoft=" + JSON.stringify(ms.scope) + "/" + JSON.stringify(ms.refreshScope)
    + " google=" + JSON.stringify(gg.scope) + " prompt=" + gq.get("prompt") + " access_type=" + gq.get("access_type"));
}

/* ---- si15 and si16, the check's proof as afterCheck answers it (decision 15 item 1) --------------------------------- */
const CODE1 = "7K3M9QX2RT8VW4ZA", CODE2 = "0123456789ABCDEF", CODE3 = "ZZZZ0000YYYY1111", CODE4 = "MNPQRSTV23456789";
const vaultIo = (extra) => Object.assign({ tokenAsk: wire.identityRequest, ask: wire.licenceRequest, seal: (t) => C.sealRefresh(vaultOn, t),
  unseal: (s) => vaultOn.open(Buffer.from(String(s), "base64")) }, extra || {});
const afterOf = async (a, st, extra) => {
  try { return await C.afterCheck(vaultIo(extra), MS, a, st, open, () => NOW); } catch (e) { return { answer: { ok: false, reason: "threw:" + e.message }, state: null }; }
};
{
  const seal = C.sealRefresh(vaultOn, RAW_REFRESH);
  const st = { by: "signin", provider: "microsoft", lead: open.public, checked: NOW - 1000, tried: NOW - 1000, refreshSealed: seal, signinCode: CODE1, signinOwner: true };
  const due = { ok: true, proof: "due", me: CODE1, owner: true, licence: { kind: "stand-in" } };
  asked.length = 0;
  standIn(MS, { rotated: "rt-rotated-due", renew: { ok: true, me: CODE1, owner: false, licence: { kind: "renewed" } } });
  const renewed = await afterOf(due, st);
  const renewedAsked = asked.map((x) => x.url.replace(/^https:\/\/[^/]+/, ""));
  /* A renewal that fails while the proof is only due changes nothing: the check's own answer is taken, the state as it was. */
  standIn(MS, { refuseRefresh: true });
  const refusedP = await afterOf(due, st);
  standIn(MS, { renew: { ok: false, reason: "token" } });
  const refusedS = await afterOf(due, st);
  /* No proof asked: nothing is sent, and who the answer names is kept. */
  asked.length = 0;
  const plain = await afterOf({ ok: true, me: CODE2, owner: false }, st);
  const plainAsked = asked.length;
  /* A Studio activated by a key is not a sign-in's: its answer is passed through and nothing is sent. */
  const byKey = await afterOf(due, { by: "key", lead: open.public });
  const byKeyAsked = asked.length;
  const same = (x) => !!x.state && JSON.stringify(x.state) === JSON.stringify(st);
  check(renewed.answer.ok === true && renewed.answer.licence && renewed.answer.licence.kind === "renewed" && renewedAsked.join(",") === MS.token.replace(/^https:\/\/[^/]+/, "") + ",/licence/v1/signin/renew"
    && !!renewed.state && vaultOn.open(Buffer.from(renewed.state.refreshSealed, "base64")) === "rt-rotated-due" && renewed.state.signinOwner === false && renewed.state.signinAsk === undefined
    && refusedP.answer === due && same(refusedP) && refusedS.answer === due && same(refusedS)
    && plain.answer.me === CODE2 && plainAsked === 0 && !!plain.state && plain.state.signinCode === CODE2 && plain.state.signinOwner === false && plain.state.refreshSealed === seal
    && byKey.answer === due && byKeyAsked === 0 && !!byKey.state && byKey.state.signinAsk === undefined,
    "si15 a check answering proof \"due\" renews quietly through signin/renew and its answer is taken, the rotated seal and who it names kept; a failed renewal,"
    + " the provider's or the service's, changes nothing and the check's own answer is taken; no proof asked sends nothing; a key's activation is passed through: "
    + [renewed.answer.ok, renewedAsked.join(","), refusedP.answer === due ? "check-taken" : "WRONG:" + refusedP.answer.reason, same(refusedP) ? "unchanged" : "CHANGED",
      refusedS.answer === due ? "check-taken" : "WRONG", same(refusedS) ? "unchanged" : "CHANGED", "plain-asked:" + plainAsked, "by-key-asked:" + byKeyAsked].join(" "));
}
{
  const seal = C.sealRefresh(vaultOn, RAW_REFRESH);
  const st = { by: "signin", provider: "microsoft", lead: open.public, checked: NOW - 1000, tried: NOW - 1000, refreshSealed: seal, signinCode: CODE1, signinOwner: true, signinAsk: true };
  const lapsed = { ok: false, reason: "signin" };
  standIn(MS, { renew: { ok: true, me: CODE1, owner: true, licence: { kind: "renewed" } } });
  const renewed = await afterOf(lapsed, st);
  /* Where the provider or the service will not renew, or no seal is kept, the seal is forgotten and the cover asks the lead. */
  const asksOf = (x) => !!x.state && x.answer.reason === "signin-ask" && x.state.signinAsk === true && x.state.refreshSealed === undefined
    && x.state.by === "signin" && x.state.provider === "microsoft" && x.state.signinCode === CODE1;
  standIn(MS, { refuseRefresh: true });
  const providerNo = await afterOf(lapsed, st);
  standIn(MS, { renew: { ok: false, reason: "signin" } });
  const serviceNo = await afterOf(lapsed, st);
  asked.length = 0;
  const noSeal = await afterOf(lapsed, Object.assign({}, st, { refreshSealed: undefined }));
  const noSealAsked = asked.length;
  /* A provider not reached is asked again at the next check: nothing is forgotten. */
  const unreached = await afterOf(lapsed, st, { tokenAsk: async () => { throw new Error("offline"); } });
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const stepAt = mainText.indexOf("async function licenceStep("), stepEnd = mainText.indexOf("\n}\n", stepAt);
  const step = stepAt < 0 ? "" : mainText.slice(stepAt, stepEnd);
  const callAt = step.indexOf("C.afterCheck("), refusedAt = step.indexOf("if (!a || a.ok !== true) {"), takeAt = step.indexOf("C.take(");
  check(renewed.answer.ok === true && !!renewed.state && renewed.state.signinAsk === undefined && asksOf(providerNo) && asksOf(serviceNo) && asksOf(noSeal) && noSealAsked === 0
    && unreached.answer.reason === "unreached" && !!unreached.state && unreached.state.refreshSealed === seal
    && callAt > 0 && refusedAt > callAt && takeAt > refusedAt && !/renameSync|unlinkSync|rmSync|licenceFile/.test(step) && mainText.indexOf("async function quietSignIn(") < 0,
    "si16 a check answering \"signin\" renews quietly and clears the ask; where the provider or the service will not, or no seal is kept (nothing sent), the seal"
    + " is forgotten and the cover asks the lead; a provider not reached forgets nothing; the shell's check runs afterCheck before taking anything and moves no"
    + " licence file: " + [renewed.answer.ok, providerNo.answer.reason, serviceNo.answer.reason, noSeal.answer.reason, "no-seal-asked:" + noSealAsked, unreached.answer.reason,
      "order:" + [callAt, refusedAt, takeAt].join("<")].join(" "));
}

/* ---- si17, the sign-in's code kept and shown in Account, in four groups, copied without the spaces (decision 15 (b)) ---- */
await leg("si17", async () => {
  let kept = null, malformed = null, refused = null;
  try {
    kept = C.keepWho({ by: "signin" }, { ok: true, me: CODE1, owner: true });
    malformed = C.keepWho(kept, { ok: true, me: "not-a-code", owner: "yes" });
    refused = C.keepWho(kept, { ok: false, reason: "signin", me: CODE2, owner: false });
  } catch { kept = null; }
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const actAt = mainText.indexOf("async function licenceAct("), actEnd = mainText.indexOf("\n}\n", actAt), act = mainText.slice(actAt, actEnd);
  const nowAt = mainText.indexOf("async function licenceNow()"), nowEnd = mainText.indexOf("\n}\n", nowAt), now = mainText.slice(nowAt, nowEnd);
  const en = await studio(SIGNED), acct = en.sx();
  const copyAct = typeof en.P.ACTS["lic-code-copy"];
  const pl = await studio(SIGNED, { lang: "pl" }), plText = plainText(pl.sx());
  const none = await studio(HELD0), noneAcct = none.sx();
  /* The Licence cover keeps the licence and the key and no longer draws the sign-in's code. */
  await en.P.ACTS.licence();
  const cover = en.home.node("#dlg").innerHTML;
  const row = (/<div class="sx-row"[^>]*data-signin-code>[\s\S]*?<\/div><\/div>/.exec(acct) || [""])[0];
  check(!!kept && kept.signinCode === CODE1 && kept.signinOwner === true && malformed.signinCode === CODE1 && malformed.signinOwner === true
    && refused.signinCode === CODE1 && refused.signinOwner === true
    && /Object\.assign\(next, C\.keepWho\(\{\}, a\)\);/.test(act) && /delete next\.signinCode;/.test(act) && !/signinCode:/.test(now)
    && !row && copyAct === "undefined" && !/7K3M ?9QX2|lic-code-copy|Your sign-in code/.test(acct)
    && plText.indexOf("Kod logowania") < 0 && plText.indexOf("7K3M 9QX2 RT8V W4ZA") < 0 && !/data-signin-code/.test(noneAcct) && !/data-signin-code/.test(cover),
    /* Moved for board 1017. Old: "Account shows the code in the mono face in four groups of four with a Copy that copies it without the spaces, in
       both languages"; new: the shell keeps the code to itself and hands the page none, and Account draws no code row and no Copy for it. */
    "si17 every answer's me and owner are kept (a malformed one or a refusal's is not), a sign-in keeps them and any other activation clears them;"
    + " the shell hands the page no code, and Account draws no code row and no Copy for one, in both languages (moved for board 1017); nothing is"
    + " drawn without a sign-in, and the Licence cover draws none: "
    + [kept ? kept.signinCode : "NO-keepWho", row ? "row" : "NO-ROW", "copied:" + JSON.stringify(en.calls.filter((c) => /^copy/.test(c))),
      /data-signin-code/.test(cover) ? "ON-COVER" : "off-cover"].join(" "));
});

/* ---- si18, the owner's lead seats, listed and freed, in Account (decision 15 (b)) ------------------------------------- */
await leg("si18", async () => {
  const sent = [];
  const answers = [{ status: 200, body: { ok: true, seats: [{ code: CODE1, seen: "2026-11-11", proved: "2026-11-10", you: true }, { code: "bad code", proved: "2026-11-01" },
    { code: CODE3, seen: "2026-11-09", proved: "2026-11-01", you: false }], counts: { lead: { held: 2, of: 3 } } } },
    { status: 404, body: { ok: false, reason: "no-seat" } }, { status: 200, body: { ok: true, freed: "lead" } }];
  const ask = async (route, bytes) => { sent.push({ route, body: JSON.parse(Buffer.from(bytes).toString("utf8")) }); const a = answers.shift(); return { status: a.status, bytes: Buffer.from(JSON.stringify(a.body)) }; };
  let listed = null, refusedList = null, freed = null;
  try {
    listed = await C.seatList(ask, open, NOW);
    refusedList = await C.seatList(ask, open, NOW + 1);
    freed = await C.freeSeat(ask, open, "lead", CODE3, NOW + 2);
  } catch { listed = null; }
  const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(open.public, "hex")]), format: "der", type: "spki" });
  const b0 = sent[0] ? sent[0].body : {}, b2 = sent[2] ? sent[2].body : {};
  const listSigned = typeof Q.seatListBytes === "function" && !!b0.sig && crypto.verify(null, Buffer.from(Q.seatListBytes({ lead: open.public, t: NOW })), pub, Buffer.from(b0.sig, "hex"));
  const freeSigned = !!b2.sig && crypto.verify(null, Buffer.from(Q.seatFreeBytes({ kind: "lead", person: CODE3, lead: open.public, t: NOW + 2 })), pub, Buffer.from(b2.sig, "hex"));
  /* Account: the owner sees each lead seat and frees one at once; the row then says it was freed, by the name written beside it,
     and the count drops; a refusal keeps the seat's Free and says what happened on its row; anyone else asks nothing. */
  /* Moved for board 1017: old "each seat by its code, freed by its code, the freed row by the name written beside the code"; new: each seat by the
     person's pseudonym, its name and address shown, freed by the pseudonym (the shell sends the code), the freed row by the name the service gave. */
  const S1 = "f1".repeat(32), S3 = "f3".repeat(32), S4 = "f4".repeat(32);
  const SEATS = [{ person: S1, name: "Marta Nowak", seen: "2026-11-11", proved: "2026-11-10", you: true },
    { person: S3, name: "Jan", address: "jan@example.com", seen: "2026-11-09", proved: "2026-11-01", you: false },
    { person: S4, seen: null, proved: null, you: false }];
  const ownerHeld = Object.assign({}, SIGNED, { signinCode: CODE1, signinOwner: true });
  const owner = await studio(ownerHeld, { api: {
    licenceSeats: () => Promise.resolve({ error: null, seats: SEATS, counts: { lead: { held: 2, of: 3 } } }),
    licenceSeatFree: (key) => Promise.resolve({ error: null, seats: SEATS.map((x) => (x.person === key ? Object.assign({}, x, { proved: null }) : x)),
      counts: { lead: { held: 1, of: 3 } } }) } });
  const before = owner.sx();
  await owner.press("lic-seat-free", { "data-v": S3 });
  const after = owner.sx();
  const calls = owner.calls.filter((c) => /^licenceSeat/.test(c));
  const refusing = await studio(ownerHeld, { api: {
    licenceSeats: () => Promise.resolve({ error: null, seats: SEATS, counts: { lead: { held: 2, of: 3 } } }),
    licenceSeatFree: () => Promise.resolve({ error: "x", said: { frame: "That seat is no longer on this licence, or this Studio does not own the licence, so nothing was changed.", vars: {} } }) } });
  await refusing.press("lic-seat-free", { "data-v": S3 });
  const refusedHtml = refusing.sx();
  const freeOf = (h, code) => new RegExp('data-act="lic-seat-free" data-v="' + code + '"').test(h);
  const other = await studio(Object.assign({}, ownerHeld, { signinOwner: false }), { api: { licenceSeats: () => Promise.resolve({ error: null, seats: SEATS }) } });
  const otherHtml = other.sx(), otherCalls = other.calls.filter((c) => /^licenceSeats/.test(c));
  const pagePart = JSON.stringify(calls) === JSON.stringify(["licenceSeats", "licenceSeatFree:" + S3]) && /data-lead-seats/.test(before)
    && plainText(before).indexOf("2 of 3 in use") >= 0 && /<b>Jan<\/b><span class="ad">jan@example\.com<\/span>/.test(before) && !codeIn(before)
    && !freeOf(before, S1) && freeOf(before, S3) && !freeOf(before, S4) && !freeOf(after, S3)
    && plainText(after).indexOf("Seat freed just now. Jan can take a seat again by signing in, while one is free.") >= 0 && plainText(after).indexOf("1 of 3 in use") >= 0
    && freeOf(refusedHtml, S3) && /data-seat-refused>That seat is no longer on this licence/.test(refusedHtml) && !refusing.P.S.cover
    && otherCalls.length === 0 && !/data-lead-seats/.test(otherHtml);
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const preload = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  const seatsAt = mainText.indexOf("async function leadSeatsNow()"), seatsBody = mainText.slice(seatsAt, mainText.indexOf("\n}\n", seatsAt));
  check(!!listed && listed.ok === true && listed.seats.length === 2 && listed.seats[0].code === CODE1 && listed.seats[0].you === true && listed.seats[1].code === CODE3
    && refusedList.ok === false && refusedList.reason === "no-seat" && freed.ok === true
    && sent.map((s) => s.route).join(",") === "seat/list,seat/list,seat/free" && JSON.stringify(Object.keys(b0).sort()) === '["lead","sig","t"]' && listSigned
    && b2.kind === "lead" && b2.person === CODE3 && freeSigned
    && pagePart
    && /answer\("studio:licence-seats"/.test(mainText) && /answer\("studio:licence-seat-free"/.test(mainText)
    && /if \(st\.by !== "signin" \|\| st\.signinOwner !== true\) return \{ seats: \[\] \};/.test(seatsBody) && seatsBody.indexOf("signinOwner") < seatsBody.indexOf("leadOpen(")
    && /licenceSeats: \(\) => ipcRenderer\.invoke\("studio:licence-seats"\)/.test(preload) && /licenceSeatFree: \(person\) => ipcRenderer\.invoke\("studio:licence-seat-free", person\)/.test(preload),
    "si18 the owner's lead seats are listed from seat/list (signed over seatListBytes, a malformed code dropped) and one freed by seat/free kind lead with its code;"
    + " Account shows the owner each by name and address with a Free on another's seat still proved (moved for board 1017: by pseudonym, never a code), a press"
    + " frees it at once and the row says so by the name the service gave,"
    + " the count dropping; a refusal keeps the Free and is said on the row; anyone else asks nothing and is shown none: " + [listed ? listed.seats.map((x) => x.code).join("+") : "NO-seatList", sent.map((s) => s.route).join(","), listSigned ? "list-signed" : "LIST-UNSIGNED",
      "calls:" + JSON.stringify(calls), "other-calls:" + otherCalls.length, pagePart ? "page" : "PAGE-FAILS"].join(" "));
});

/* ---- si19, a sign-in held while a newer Studio's data stand (Argon 8a) ---------------------------------------------- */
{
  const { loadPage } = await import("./page-stand-in.mjs");
  const source = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const home = loadPage({ api: { signing: () => Promise.resolve({ error: null, signing: { keyId: "", problem: null } }) }, uiLang: "en", source });
  const P = home.page;
  P.S.host = { version: "0.1.0", tour: { offered: true }, langs: [], signing: { keyId: "", problem: null }, savedNewer: { version: "9.9.9" } };
  const held = P.__get("newerHeld");
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const shellSet = mainText.slice(mainText.indexOf("const HELD_BY_NEWER = new Set("), mainText.indexOf("]);", mainText.indexOf("const HELD_BY_NEWER = new Set(")));
  check(held("lic-signin") === true && held("key-make") === true && held("lic-check") === false && shellSet.indexOf('"studio:licence-signin"') > 0
    && held("acct-signout") === true && shellSet.indexOf('"studio:licence-signout"') > 0,
    "si19 while a newer Studio's saved data stand, the page holds a sign-in press and a sign-out as it holds a key made, and the shell holds their"
    + " channels: page "
    + held("lic-signin") + ", shell " + (shellSet.indexOf('"studio:licence-signin"') > 0));
}

/* ---- si20, the audience read as the service reads it (Argon 8d) ---------------------------------------------------- */
{
  const pending = { nonce: "n-0123456789abcdef0123456789abcdef0123456789a" };
  const base = { iss: "https://login.microsoftonline.com/" + TID + "/v2.0", tid: TID, sub: "s", exp: Math.floor(NOW / 1000) + 3600, nonce: pending.nonce };
  const res = (aud) => ({ status: 200, bytes: Buffer.from(JSON.stringify({ id_token: jwt(Object.assign({}, base, { aud })), refresh_token: "r" })) });
  const read = (aud) => { const r = C.tokensOf(res(aud), MS, pending, NOW); return r.ok ? "ok" : r.reason; };
  const cases = { string: read(MS.clientId), one: read([MS.clientId]), two: read([MS.clientId, "other"]), twoAfter: read(["other", MS.clientId]), other: read(["other"]), empty: read([]) };
  check(cases.string === "ok" && cases.one === "ok" && cases.two === "signin-token" && cases.twoAfter === "signin-token" && cases.other === "signin-token" && cases.empty === "signin-token",
    "si20 an ID token's audience is the client id, or a list of exactly that one, as the service reads it: " + Object.entries(cases).map(([k, v]) => k + "=" + v).join(" "));
}

/* ---- si21, the seat list says what a Free does and why the count can stand one over (stage H2 (b) and (c)) ------------ */
await leg("si21", async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const source = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const FREES = "Freeing a seat is immediate and asks nothing more. That Studio is signed out at its next check; its catalogs and teams stay where they are, and the seat is free for another account.";
  const OVER = "The licence's owner always keeps a lead seat, even when every seat bought is taken, so this list can show one more than were bought.";
  const CODE_TITLE = "Named in an order paid by invoice, so the licence it pays for comes to this sign-in.";
  const REFUSAL = "That seat is no longer on this licence, or this Studio does not own the licence, so nothing was changed.";
  const proved = [{ person: "f1".repeat(32), seen: "2026-11-11", proved: "2026-11-10", you: true }, { person: "f3".repeat(32), seen: "2026-11-09", proved: "2026-11-01", you: false }];
  const allFreed = [{ person: "f3".repeat(32), seen: null, proved: null, you: false }];
  const ownerHeld = Object.assign({}, SIGNED, { signinCode: CODE1, signinOwner: true });
  const cover = async (seats, counts, lang) => {
    const s = await studio(ownerHeld, { lang: lang || "en", api: { licenceSeats: () => Promise.resolve({ error: null, seats, counts }) } });
    return s.sx();
  };
  const unesc = (h) => String(h).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const saidOf = (h, mark) => { const m = new RegExp("<p class=\"si-under\" " + mark + ">([^<]*)</p>").exec(h); return m ? unesc(m[1]) : null; };
  const titles = (h) => Array.from(h.matchAll(/data-act="lic-seat-free"[^>]*title="([^"]*)"/g), (m) => unesc(m[1]));
  const within = await cover(proved, { lead: { held: 2, of: 3 } });
  const over = await cover(proved, { lead: { held: 4, of: 3 } });
  const none = await cover(allFreed, { lead: { held: 0, of: 3 } });
  const pl = await cover(proved, { lead: { held: 4, of: 3 } }, "pl");

  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"), langText = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const plFrees = "Zwolnienie miejsca działa od razu i o nic więcej nie pyta. Tamto Studio zostanie wylogowane przy najbliższym sprawdzeniu; jego katalogi i zespoły zostają na miejscu, a miejsce jest wolne dla innego konta.";
  const plOver = "Osoba, do której należy licencja, zawsze zachowuje miejsce lidera, nawet gdy wszystkie kupione miejsca są zajęte, więc ta lista może pokazywać o jedno więcej, niż kupiono.";
  const parts = {
    visible: saidOf(within, "data-seat-free-said") === FREES,
    once: (within.match(/data-seat-free-said/g) || []).length === 1,
    /* The copywriter's final words: the line under the list, always, in place of each Free's title. */
    untitled: titles(within).length === 0 && /data-act="lic-seat-free"/.test(within),
    alwaysSaid: saidOf(none, "data-seat-free-said") === FREES,
    overSaid: saidOf(over, "data-seat-over") === OVER,
    withinNotOver: saidOf(within, "data-seat-over") === null,
    /* Moved for board 1017. Old: "the code carries its title"; new: there is no code row, so neither it nor its title is drawn. */
    codeGone: !/data-signin-code/.test(within) && unesc(within).indexOf(CODE_TITLE) < 0,
    polish: saidOf(pl, "data-seat-free-said") === plFrees && saidOf(pl, "data-seat-over") === plOver,
    refusal: mainText.indexOf("\"lead-seat-none\": \"" + REFUSAL + "\"") >= 0 && langText.indexOf("\"" + REFUSAL + "\":") >= 0,
  };
  check(Object.values(parts).every(Boolean),
    "si21 under the owner's seat list what a Free does is said once, visibly and always, and no Free carries a title (the copywriter's final words); the owner's seat above"
    + " the count bought is said only when it stands so; no code row nor its title (moved for board 1017); both in Polish too, a seat \"miejsce\": "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* The Team screen's fixtures, for si22 and si31 to si39. */
const TEAM_DIR = "C:\\studio\\harbour", TEAM_ID = "t-4e0f7a91c2d3b5e6";
const ADA = "7K3MQ9TV2XRBHN4W", DORA = "D9FA4KXM7RWC3TPB", KIT = "PQRS2345TVWX6789";
const PERSON_ADA = "a1".repeat(32), PERSON_KIT = "c3".repeat(32);
/* What a provider would have known, handed to the page beside each row as a careless shell might: none of it may be drawn. */
const LEAKED = { name: "Ada Lovelace", email: "ada.lovelace@kappa-tools.example", upn: "ada@kappa-tools.example" };
const teamFacts = (o) => Object.assign({ error: null, folder: "C:\\share\\north-quay", mark: null, signing: "k1", file: "ours", reason: "", inside: false,
  keyHeld: true, canKeep: true, restorable: null, requests: [], invites: [], autoAdmit: false, keyOpens: true,
  team: { id: TEAM_ID, epoch: 1, sealed: true, lists: true, exportsSealed: false, relay: true, roster: [
    { id: "k-e5c80a17b2e4d856", name: "Ewa", own: "", key: "e5c80a17b2e4d856", admitted: true, kind: "desk", door: "invitation" },
    { id: "k-7d0355e1c95b7f13", name: "Anna (evenings)", own: "Anna K.", key: "7d0355e1c95b7f13", admitted: true, kind: "desk", door: "auto" }] } }, o || {});
/* Moved for board 1017: the shell hands the page each person by pseudonym, never a code, with the name and address the service keeps once they
   are added; the token's own fields (LEAKED's address and principal name) are never among them. */
const PERSON_DORA = "b2".repeat(32);
const PEOPLE = [{ person: PERSON_ADA, signedIn: "2026-11-11", name: "Ada", address: "ada@example.com", email: LEAKED.email, upn: LEAKED.upn },
  { person: PERSON_DORA, signedIn: "2026-11-09", added: false }];
/** The Team screen of a catalog on a folder team, over `held` (what studio:licence answers), read on the way in as the section is. */
async function teamOn(held, o = {}) {
  const api = Object.assign({ desks: () => Promise.resolve(JSON.parse(JSON.stringify(o.facts || teamFacts()))),
    peopleList: () => Promise.resolve({ error: null, people: JSON.parse(JSON.stringify(o.people || PEOPLE)) }),
    seatNames: () => Promise.resolve({ error: null, names: o.names || {} }),
    stats: () => Promise.resolve({ error: null, folder: null, head: [], rows: [], refused: [] }),
    proposals: () => Promise.resolve({ error: null, proposals: [] }),
    projects: () => Promise.resolve({ error: null, root: "C:\\studio", projects: [] }) }, o.api || {});
  const s = await studio(held, { lang: o.lang, source: o.source, host: Object.assign({ signinDoor: true }, o.host || {}), api });
  Object.assign(s.P.S, { open: { dir: TEAM_DIR, draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: o.editions || [],
    project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } }, screen: "projects", home: "team", teamDir: TEAM_DIR, q: "" });
  await s.P.desksLoad();
  return s;
}
const UNSIGNED = Object.assign({}, HELD0), RELAY_AT = "C:\\studio-data\\relay\\" + "0f".repeat(16);

/* ---- si22, with no client ids configured no sign-in control is drawn (Claude alpha's condition 5, night decision 18) ------- */
await leg("si22", async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const source = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  /* No client id configured: every provider without one, so nothing is offered, and the shell's cover, started on a copy of the tree
     with no client id (as shipped), hands the page that empty list. */
  const offered = C.signInProviders(C.SIGN_IN_PROVIDERS.map((p) => Object.assign({}, p, { clientId: "" }))).map((p) => p.id);
  const bareTree = treeWithIds("tree-bare-si22", "", "");
  /* The cover and the host take what is offered from one place, signInOffer, whose configured answer is the providers with a client id. */
  const shellOffers = /return \{ signIn: C\.signInProviders\(\)\.map\(\(p\) => p\.id\) \};/.test(mainText)
    && (mainText.match(/^ {2,4}\.\.\.\(await signInOffer\(\)\),$/gm) || []).length === 2;
  /* The cover for a lead never activated and for one activated by key before sign-in, each with what the shell then says: no
     sign-in control of any kind is drawn, no way in and no form, and what is held is still said. */
  const NONE = { licence: { status: "none", trial: null, unusable: null }, grant: null, by: null, checked: null, keyChanged: false, hasKey: true,
    signing: { keyId: "", problem: null }, signIn: offered, provider: null, signinAsk: false, signinCode: null, signinOwner: false };
  const KEYED = Object.assign({}, NONE, { licence: { status: "active", org: "Kappa Tools", seats: 2, trial: null, unusable: null }, by: "key", checked: "2026-11-11",
    signinMoved: true });
  const calls = [];
  const cover = async (held) => {
    const api = { signing: () => Promise.resolve({ error: null, signing: { keyId: "", problem: null } }),
      licence: () => Promise.resolve(Object.assign({ error: null }, JSON.parse(JSON.stringify(held)))),
      licenceSeats: () => { calls.push("seats"); return Promise.resolve({ error: null, seats: [] }); } };
    const home = loadPage({ api, uiLang: "en", source });
    home.page.S.host = { version: "0.1.0", tour: { offered: true }, langs: [], signing: { keyId: "", problem: null } };
    home.page.paint();
    await home.page.ACTS.licence();
    return home.node("#dlg").innerHTML;
  };
  const fresh = await cover(NONE), keyed = await cover(KEYED);
  const SIGN_IN_MARKS = /data-signin|data-act="lic-signin"|data-signin-code|data-lead-seats|data-signin-ask|data-act="lic-seat-free"|data-act="lic-code-copy"/;
  /* A Studio activated by key before sign-in: its check's body is the check's, and an answered check passes through, no provider asked. */
  const sent = [];
  const ask = async (route, bytes) => { sent.push({ route, body: JSON.parse(Buffer.from(bytes).toString("utf8")) }); return { status: 200, bytes: Buffer.from(JSON.stringify({ ok: true, licence: null, grant: null })) }; };
  await C.quietCheck(ask, open, NOW + 1);
  const b1 = sent[0] ? sent[0].body : {};
  const after = await C.afterCheck({ tokenAsk: () => { throw new Error("no provider is asked for a key"); } }, null, { ok: true, licence: null, grant: null },
    { by: "key", lead: open.public }, open, () => NOW);
  const noWayIn = (h) => !/data-lic-signin|data-act="door-open"|<input|class="btn solid"/.test(h);
  const parts = {
    noneOffered: offered.length === 0 && shellOffers && bareTree.planted,
    freshNone: !SIGN_IN_MARKS.test(fresh) && noWayIn(fresh),
    keyedNone: !SIGN_IN_MARKS.test(keyed) && noWayIn(keyed) && keyed.indexOf("Kappa Tools") >= 0,
    noSeatsAsked: calls.indexOf("seats") < 0,
    checkBody: sent.map((s) => s.route).join(",") === "check" && JSON.stringify(Object.keys(b1).sort()) === '["lead","sig","t"]',
    keyCheckUntouched: !!after && after.answer && after.answer.ok === true && JSON.stringify(after.state) === JSON.stringify({ by: "key", lead: open.public }),
  };
  /* And none of the person's own sign-in either (A5): with nothing offered, no door in place of Overview, no Account section in
     Settings, no line at the rail's foot, no band button, no Sign in beside a paused act, and nothing asked of the licence at the
     start; the shell's host hands the page the shipped, empty list. */
  const bare = await studio(NONE, { host: { signIn: offered } });
  const bareHome = bare.main(), bareRail = bare.rail();
  bare.P.S.err = { frame: "The trial ended on {DATE}. Publishing, statistics and proposals are paused until a licence is bought; editing, checks and export stay open. Signing in then brings the licence here.",
    vars: { DATE: "2026-11-01" }, why: "paused" };
  const bareSx = bare.sx();
  const btnAcct = bare.home.node("#btnAcct");
  let hostSaid = null;
  const sh = await shellOn({ root: bareTree.tree });
  try { const h = await sh.ask("studio:host"); hostSaid = h ? JSON.stringify(h.signIn) : null; } finally { sh.done(); }
  /* Nor on the Team screen, Statistics or Proposals: no list of people, no Admit by sign-in code, no paid act's sentence, the first
     publish's line and Publish as today and the statistics read, for a fresh Studio and for one whose record still says signin. */
  const teamScreens = [];
  for (const held of [NONE, Object.assign({}, NONE, { by: "signin", provider: "microsoft", signinCode: SIGNED_CODE })]) {
    const tm = await teamOn(held, { host: { signIn: offered } });
    const team = tm.main();
    tm.P.S.section = "stats"; await tm.get("statsLoad")();
    const stats = tm.main();
    tm.P.S.section = "proposals"; tm.get("paintProposals")();
    teamScreens.push({ team, stats, props: tm.main(), calls: tm.calls });
  }
  Object.assign(parts, {
    noTeamSignIn: teamScreens.every((x) => !/data-people|data-person-code-row|data-act="person-admit|data-signin-paid|data-act="door-open"/.test(x.team + x.stats + x.props)
      && /data-first-publish[^>]*>[^<]*<button class="btn solid" data-act="publish">/.test(x.team)
      && x.calls.filter((c) => /^stats/.test(c)).length === 1 && !x.calls.some((c) => /^peopleList|^personAdmit/.test(c))),
    noDoor: !/data-signin-door/.test(bareHome) && !/data-signin-foot/.test(bareRail),
    noAccount: !/data-v="account"/.test(bareSx) && !/data-signin-account|data-act="acct-signout"|Use another account/.test(bareSx),
    noBeside: /data-err/.test(bareSx) && !/data-act="door-open"/.test(bareSx),
    noBand: btnAcct.hidden === true || btnAcct.hidden === undefined || btnAcct.getAttribute("hidden") !== null,
    nothingAskedAtStart: bare.calls.indexOf("licence") < 0,
    hostEmpty: hostSaid === "[]" && shellOffers,
  });
  check(Object.values(parts).every(Boolean),
    "si22 with no client ids configured Studio shows no sign-in control at all (no provider button, code, seats, Free or renewal line, for a fresh Studio or one"
    + " activated by key; no door, Account section, rail line, band button or Sign in beside a pause, no list of people, Admit by sign-in code or paid act's"
    + " sentence on the Team screen, Statistics or Proposals, and nothing asked at the start), its Licence cover no way in and no form, and"
    + " a Studio activated by key before sign-in checks with the check's body and is renewed by nothing: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " offered=" + JSON.stringify(offered));
});

/* ---- si23, the door: drawn only with a provider configured, whenever Studio does not work, with no Not now (S-3) ------------- */
await leg("si23", async () => {
  const fresh = await studio(HELD0);
  const door = fresh.main(), doorRail = fresh.rail();
  const closedHost = await studio(HELD0, { host: { signinDoor: true } });
  const signed = await studio(SIGNED);
  const none = await studio(Object.assign({}, HELD0, { signIn: [] }));
  /* The shell still keeps its signinDoor store/channel intact for callers that read it. */
  const sh = await shellOn();
  let first = null, said = null, after = null, store = {};
  try {
    first = (await sh.ask("studio:host")).signinDoor;
    said = await sh.ask("studio:signin-door");
    after = (await sh.ask("studio:host")).signinDoor;
    store = JSON.parse(fs.readFileSync(sh.file("studio.json"), "utf8"));
  } finally { sh.done(); }
  const parts = {
    shown: /data-signin-door/.test(door) && !/data-signin-foot/.test(doorRail),
    noNotNow: !/data-act="door-later"/.test(door) && !fresh.P.ACTS["door-later"],
    alwaysStands: /data-signin-door/.test(closedHost.main()) && !/data-signin-foot/.test(closedHost.rail()),
    signedNoDoor: !/data-signin-door/.test(signed.main()) && !/data-signin-foot/.test(signed.rail()),
    noneNoDoor: !/data-signin-door/.test(none.main()) && !/data-signin-foot/.test(none.rail()),
    shellKeeps: first === false && said && said.closed === true && after === true && store.signinDoor === "closed",
  };
  check(Object.values(parts).every(Boolean),
    "si23 the door stands in place of Overview whenever a provider is configured and Studio does not work, with no Not now and ignoring host.signinDoor; signed in or no provider, none: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si24, no paidWaits or Not now evaluation wording on the door or screens (S-3) ------------------------------------------ */
await leg("si24", async () => {
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const pauseAt = mainText.indexOf("async function notPaused()"), pause = mainText.slice(pauseAt, mainText.indexOf("\n}\n", pauseAt));
  const PAUSED = { frame: "The trial ended on {DATE}. Publishing, statistics and proposals are paused until a licence is bought; editing, checks and export stay open. Signing in then brings the licence here.",
    vars: { DATE: "2026-11-01" }, why: "paused" };
  const later = await studio(HELD0, { host: { signinDoor: true } });
  later.P.S.err = PAUSED;
  const beside = later.sx();
  later.P.S.err = Object.assign({}, PAUSED, { why: undefined });
  const otherErr = later.sx();
  const signed = await studio(SIGNED);
  signed.P.S.err = PAUSED;
  const signedSx = signed.sx();
  later.P.S.err = PAUSED;
  later.P.S.screen = "projects";
  await later.press("door-open");
  const doorText = plainText((await studio(HELD0)).main());
  const parts = {
    pauseMarked: pauseAt > 0 && /paused\.said\.why = "paused";/.test(pause) && !/signin|readServiceState|signinDoor/.test(pause),
    nothingNewGated: (mainText.match(/signinDoor/g) || []).length === 4,
    besideThePause: /data-err>[^<]*paused[^<]*<button class="btn sm" data-act="door-open">Sign in<\/button>/.test(beside),
    onlyThePause: !/data-act="door-open"/.test(otherErr) && !/data-act="door-open"/.test(signedSx),
    opensTheDoor: /data-signin-door/.test(later.main()) && !later.P.S.err && !later.P.S.cover,
    noEvalLine: doorText.indexOf("Without signing in you can look round") < 0 && doorText.indexOf("Etiuda Studio starts with a sign-in.") >= 0,
  };
  check(Object.values(parts).every(Boolean),
    "si24 the door carries S1 wording with no evaluation look-around sentence, and signInBeside stays beside a paused error: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si25, Settings' Account: signed in, not signed in, the service not reached ------------------------------------------ */
await leg("si25", async () => {
  const unsigned = (await studio(HELD0, { host: { signinDoor: true } })).sx();
  const signedS = await studio(SIGNED), signed = signedS.sx();
  const offline = (await studio(Object.assign({}, SIGNED, { unanswered: true }))).sx();
  const checking = await studio(SIGNED, { api: { licenceCheck: () => Promise.resolve({ error: "x", said: { frame: "The licence service could not be reached, so nothing was changed. Try again later.", vars: {}, why: "unreached" } }) } });
  await checking.press("acct-check");
  const checked = checking.sx();
  const nav = (/<nav class="sx-nav"[\s\S]*?<\/nav>/.exec(signed) || [""])[0];
  const firstSec = (/data-act="sx-sec" data-v="([a-z]+)"/.exec(nav) || [])[1];
  const t = { unsigned: plainText(unsigned), signed: plainText(signed), offline: plainText(offline), checked: plainText(checked) };
  /* "Use another account" and "Sign out" exist nowhere but Account: not on the door in any state, the rail, the band's panel or the Licence cover. */
  const elsewhere = [];
  const fails = [["unreached", "x"], ["signin-full", "x"], ["signin-refused", "x"], ["signin-token", "x"]];
  for (const [why] of fails) {
    const d = await studio(HELD0, { api: { licenceSignIn: () => Promise.resolve({ error: "x", said: { frame: "The sign-in did not finish, so nothing was changed.", vars: {}, why } }) } });
    await d.press("lic-signin", { "data-v": "microsoft" });
    elsewhere.push(d.main(), d.rail());
  }
  signedS.P.S.screen = "projects"; signedS.P.paint();
  const pop = signedS.get("acctPopHtml") ? signedS.get("acctPopHtml")() : "";
  await signedS.P.ACTS.licence();
  elsewhere.push(signedS.rail(), pop, signedS.home.node("#dlg").innerHTML);
  const parts = {
    first: firstSec === "account",
    unsigned: t.unsigned.indexOf("Not signed in") >= 0 && /class="si-provs row"/.test(unsigned) && /data-v="microsoft"/.test(unsigned) && /data-v="google"/.test(unsigned)
      && t.unsigned.indexOf("Microsoft: a work, school or personal account.") >= 0 && !/data-signin-code|data-row="seat"|data-row="checked"|data-act="acct-signout"/.test(unsigned),
    signed: t.signed.indexOf("Signed in with Microsoft") >= 0 && /data-other>Use another account</.test(signed) && /data-act="acct-signout">Sign out</.test(signed)
      && !/data-signin-code/.test(signed) && !codeIn(signed) && t.signed.indexOf("Etiuda Studio, lead seat") >= 0 && /data-act="acct-check"/.test(signed)
      && t.signed.indexOf("service not reached") < 0,
    offline: t.offline.indexOf("Signed in with Microsoft · service not reached just now") >= 0 && /si-av off/.test(offline)
      && t.offline.indexOf("The sign-in service cannot be reached just now. Studio keeps working with the catalogs it has.") >= 0
      && !/si-dot|data-signin-fact/.test(offline),
    checkNowUnreached: t.checked.indexOf("service not reached just now") >= 0 && !/si-dot|data-signin-fact/.test(checked) && !checking.P.S.cover,
    nowhereElse: elsewhere.every((h) => !/Use another account|acct-signout|Sign out/.test(h)),
  };
  check(Object.values(parts).every(Boolean),
    "si25 Account is first in Settings: not signed in, the providers' buttons side by side; signed in, who with, Use another account and Sign out,"
    + " the seat and the last check, and no code (moved for board 1017; old: \"the code\"); the service not reached, said calmly with no amber; and its two acts exist nowhere else: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si26, Sign out: what it forgets and what it keeps -------------------------------------------------------------------- */
await leg("si26", async () => {
  const sh = await shellOn();
  const STATE = { by: "signin", provider: "microsoft", refreshSealed: "c2VhbGVk", signinCode: CODE1, signinOwner: true, signinOrg: TID, signinAsk: true,
    signinSeed: "7a".repeat(32), lead: open.public, checked: NOW, tried: NOW };
  const KEEP = { "etiuda-studio-license.js": "licence bytes as the service signed them\n", "relay-grant.json": "{\"grant\":1}\n",
    "desk-seats.json": "{\"team\":{}}\n", "lead-seat-names.json": "{\"" + CODE3 + "\":\"Jan\"}\n" };
  let answer = null, left = {}, kept = {}, keyBefore = "", keyAfter = "";
  asked.length = 0;
  try {
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify(STATE));
    for (const [n, v] of Object.entries(KEEP)) fs.writeFileSync(sh.file(n), v);
    answer = await sh.ask("studio:licence-signout");
    left = JSON.parse(fs.readFileSync(sh.file("licence-service.json"), "utf8"));
    for (const n of Object.keys(KEEP)) kept[n] = fs.existsSync(sh.file(n)) ? fs.readFileSync(sh.file(n), "utf8") : null;
  } finally { sh.done(); }
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const outAt = mainText.indexOf('answer("studio:licence-signout"'), out = mainText.slice(outAt, mainText.indexOf("\n}));", outAt));
  /* The page: Sign out asks the shell once, and Studio is then not signed in, its rail's foot back and the band's button gone. */
  const s = await studio(SIGNED, { api: { licenceSignOut: () => Promise.resolve(Object.assign({ error: null }, HELD0)) } });
  await s.press("acct-signout");
  const acct = plainText(s.sx());
  const home = (s.P.S.screen = "projects", s.P.paint(), s.main());
  const parts = {
    forgets: ["by", "provider", "refreshSealed", "signinCode", "signinOwner", "signinOrg", "signinAsk", "signinSeed"].every((k) => !(k in left)),
    keepsState: left.lead === open.public && left.checked === NOW && left.tried === NOW,
    keepsFiles: Object.entries(KEEP).every(([n, v]) => kept[n] === v),
    /* Moved for board 1017: old "the answer's signinCode null"; new: the answer carries no signinCode at all. */
    answers: !!answer && !answer.error && answer.by === null && answer.provider === null && !("signinCode" in answer),
    sendsNothing: asked.length === 0 && outAt > 0 && !/unlink|rmSync|rename|trashItem|licenceFile|wire\./.test(out),
    page: s.calls.filter((c) => c === "licenceSignOut").length === 1 && acct.indexOf("Not signed in") >= 0 && /data-signin-door/.test(home)
      && s.home.node("#btnAcct").hidden === true,
  };
  check(Object.values(parts).every(Boolean),
    "si26 Sign out forgets how this Studio signed in, the provider, the sealed refresh token, the code, the ownership, the organisation and any ask to sign"
    + " in again, and keeps the licence file, the relay grant, desk-seats.json, the names beside lead seats and the key's state; it sends nothing, and the"
    + " page then shows Studio not signed in: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " left=" + Object.keys(left).join(","));
});

/* ---- si27, Use another account starts a sign-in --------------------------------------------------------------------------- */
await leg("si27", async () => {
  let release = null;
  const s = await studio(SIGNED, { api: { licenceSignIn: () => new Promise((r) => { release = () => r(Object.assign({ error: null }, SIGNED, { signinCode: CODE2 })); }),
    licenceSignInAgain: () => Promise.resolve({ error: null, opened: true }) } });
  const before = s.sx();
  const other = /<button class="btn sm" data-act="lic-signin" data-v="([a-z]+)" data-other>Use another account<\/button>/.exec(before);
  const pressed = s.press("lic-signin", { "data-v": other ? other[1] : "" });
  await tick();
  const waiting = s.sx();
  await s.press("signin-again");
  if (release) release();
  await pressed;
  const after = plainText(s.sx());
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const againAt = mainText.indexOf('answer("studio:licence-signin-again"'), again = mainText.slice(againAt, mainText.indexOf("\n}));", againAt));
  const openAt = mainText.indexOf("async function openSignInPage(url)"), opener = mainText.slice(openAt, mainText.indexOf("\n}\n", openAt));
  const parts = {
    starts: !!other && other[1] === "microsoft" && s.calls.filter((c) => /^licenceSignIn:/.test(c)).join() === "licenceSignIn:microsoft",
    waits: plainText(waiting).indexOf("Finish signing in in the browser") >= 0 && /data-act="signin-stop"/.test(waiting) && /data-act="signin-again"/.test(waiting),
    again: s.calls.indexOf("licenceSignInAgain") >= 0 && againAt > 0 && /return \{ opened: await openSignInPage\(signInOpened\) \};/.test(again)
      /* Moved for board 1020: old "three openExternal calls in the shell"; new: four, Buy's (tests/no-model.mjs 5z4) beside the maker's,
         the release page's and this one. */
      && /if \(!signInLoop \|\| !signInOpened\) return \{ opened: false \};/.test(again) && (mainText.match(/openExternal\(/g) || []).length === 4
      && /const authorize = wire\.identityAuthorize\(url\);\n\s*if \(!authorize\) return false;\n\s*signInOpened = url;/.test(opener),
    /* Moved for board 1017: old "the new account's code is then shown"; new: the new sign-in is taken and no code is shown. */
    takes: after.indexOf("0123 4567 89AB CDEF") < 0 && after.indexOf("Signed in with Microsoft") >= 0 && !s.P.S.signing && !s.P.S.cover,
  };
  check(Object.values(parts).every(Boolean),
    "si27 Use another account starts a sign-in with the provider signed in with, whose page asks which account; Account says where to finish while it waits,"
    + " with Cancel and Open the browser again, which opens only the page the door admitted; the new sign-in is then taken, no code shown: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si28, nothing from the provider in any page text ---------------------------------------------------------------------- */
await leg("si28", async () => {
  const NAME = "Ada Nowak-Harbourlamp", EMAIL = "ada.nowak@harbourlamp.example", UPN = "anowak@harbourlamp.example";
  const setNonce = standIn(MS, { service: { ok: true, me: CODE1, owner: false, licence: null, grant: null },
    claims: { name: NAME, email: EMAIL, preferred_username: UPN, given_name: "Ada", family_name: "Nowak-Harbourlamp" } });
  const br = browser((q) => { setNonce(q.get("nonce")); return "?code=c0de&state=" + encodeURIComponent(q.get("state")); });
  asked.length = 0;
  const r = await C.signInFlow(io(br), MS, open, () => NOW);
  const sentIn = asked.find((x) => /\/signin$/.test(x.url));
  const tokenCarried = !!sentIn && Buffer.from(JSON.parse(Buffer.from(sentIn.init.body).toString("utf8")).idToken.split(".")[1], "base64url").toString("utf8").indexOf(EMAIL) >= 0;
  const keptState = C.keepWho({ by: "signin", provider: "microsoft" }, r.answer);
  const leaks = (h) => [NAME, EMAIL, UPN, "Harbourlamp", "harbourlamp"].some((x) => String(h).indexOf(x) >= 0);
  /* The shell's answer to the page picks its fields: a state file holding a name and an address hands neither on. */
  const sh = await shellOn();
  let licence = null;
  try {
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1, name: NAME, email: EMAIL, upn: UPN }));
    licence = await sh.ask("studio:licence");
  } finally { sh.done(); }
  /* The page fed an answer that carries them anyway shows neither, anywhere it draws the sign-in. */
  const fed = Object.assign({}, SIGNED, { signinOwner: true, name: NAME, email: EMAIL, upn: UPN, displayName: NAME, account: EMAIL });
  /* Moved for board 1017: the owner's list shows the name and address the licence service keeps of each lead (its seat/list), and nothing of the
     sign-in's own token; the seat here carries none, so nothing of the token may appear. */
  const s = await studio(fed, { api: { licenceSeats: () => Promise.resolve({ error: null, seats: [{ person: "f1".repeat(32), proved: "2026-11-10", you: true }], counts: null }) } });
  const shown = [s.sx(), s.get("acctPopHtml") ? s.get("acctPopHtml")() : "", (s.P.S.screen = "projects", s.P.paint(), s.main()), s.rail()];
  const unsignedFed = await studio(Object.assign({}, HELD0, { name: NAME, email: EMAIL }));
  shown.push(unsignedFed.main(), unsignedFed.sx());
  const parts = {
    flowKeepsNone: r.answer && r.answer.ok === true && tokenCarried && !leaks(JSON.stringify(r)) && !leaks(JSON.stringify(keptState)),
    shellHandsNone: !!licence && !licence.error && !leaks(JSON.stringify(licence)),
    pageShowsNone: shown.every((h) => !leaks(h)) && shown[0].indexOf("Signed in with Microsoft") >= 0,
  };
  check(Object.values(parts).every(Boolean),
    "si28 nothing from the provider is shown: a token carrying a name and addresses goes to the licence service as the token, and the flow, what is kept,"
    + " the shell's answer to the page and every place the page draws the sign-in hold none of them, only the provider's name (no code, board 1017): "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si29, a name beside a code, kept on this computer and in no request -------------------------------------------------- */
await leg("si29", async () => {
  /* MOVED FOR BOARD 1017. Old: "a name the owner writes beside a lead seat's code is kept in lead-seat-names.json, one line of at most 80
     characters; no request carries it, and the page hands it to that channel alone". New: no name is written beside a code any more (each lead is
     shown by the name and address the service keeps); what this Studio keeps is the address it typed, beside the handle the service answered, in
     typed-addresses.json, on this computer alone: the old channels are gone, no request names the file, and a field left sends nothing. */
  const sh = await shellOn();
  let gone = false;
  try { gone = !sh.handlers["studio:seat-name"] && !sh.handlers["studio:seat-names"]; } finally { sh.done(); }
  const s = await studio(Object.assign({}, SIGNED, { signinOwner: true }), { api: {
    licenceSeats: () => Promise.resolve({ error: null, seats: [{ person: "f1".repeat(32), proved: "2026-11-10", you: true }, { person: "f3".repeat(32), proved: "2026-11-01", named: true }], counts: null }) } });
  s.sx();
  const change = s.home.doc.heard.filter((h) => h.type === "change");
  const target = { value: "Jan", getAttribute: (k) => (k === "data-seat-name" ? CODE3 : null), closest: () => null };
  for (const h of change) { try { h.fn({ target }); } catch { /* another listener's own reading */ } }
  await tick();
  const reqText = ["src/licence-client.mjs", "src/wire.cjs", "service/licence/requests.mjs"].map((x) => fs.readFileSync(path.join(ROOT, x), "utf8")).join("\n");
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"), preload = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  const parts = {
    channelsGone: gone && !/seatName/.test(preload) && mainText.indexOf("lead-seat-names.json") < 0,
    typedLocal: (mainText.match(/typedAt\(\)/g) || []).length === 4 && !/typed-addresses|lead-seat-names/.test(reqText),
    pageSends: !s.calls.some((c) => c.indexOf("Jan") >= 0) && s.calls.indexOf("licenceSeats") >= 0,
  };
  check(Object.values(parts).every(Boolean),
    "si29 (moved for board 1017) no name is kept beside a code any more: the seat-name channels and lead-seat-names.json are gone, a field left sends nothing,"
    + " and the addresses this Studio typed are kept in typed-addresses.json beside the service's handles and in no request: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si30, no dialog, toast or notice box in any sign-in state -------------------------------------------------------------- */
await leg("si30", async () => {
  const BOXED = /role="(?:dialog|alertdialog|alert)"|class="[^"]*\b(?:toast|notice|si-note|banner|sec-box|pw-refuse)\b|data-err/;
  const states = [];
  const said = (why) => ({ error: "x", said: { frame: "The sign-in did not finish, so nothing was changed. Try again.", vars: {}, why } });
  for (const why of ["unreached", "signin-full", "signin-refused", "signin-browser", "signin-token"]) {
    const d = await studio(HELD0, { api: { licenceSignIn: () => Promise.resolve(said(why)) } });
    await d.press("lic-signin", { "data-v": "google" });
    states.push(["door " + why, d.main(), d.P.S.cover, d.home.node("#said").textContent]);
    const a = await studio(HELD0, { host: { signinDoor: true }, api: { licenceSignIn: () => Promise.resolve(said(why)) } });
    a.sx();
    await a.press("lic-signin", { "data-v": "microsoft" });
    states.push(["account " + why, a.sx(), a.P.S.cover, a.home.node("#said").textContent]);
  }
  let release = null;
  const w = await studio(HELD0, { api: { licenceSignIn: () => new Promise((r) => { release = r; }) } });
  const wp = w.press("lic-signin", { "data-v": "microsoft" });
  await tick();
  states.push(["door waiting", w.main(), w.P.S.cover, ""]);
  if (release) release({ error: "x", said: { frame: "x", vars: {}, why: "signin-cancelled" } });
  await wp;
  for (const [name, held] of [["signed", SIGNED], ["offline", Object.assign({}, SIGNED, { unanswered: true })], ["ask", Object.assign({}, SIGNED, { signinAsk: true })],
    ["owner", Object.assign({}, SIGNED, { signinOwner: true })], ["unsigned", HELD0]]) {
    const s = await studio(held, { host: { signinDoor: true }, api: { licenceSeats: () => Promise.resolve({ error: null, seats: [{ code: CODE1, proved: "2026-11-10", you: true }, { code: CODE3, proved: "2026-11-01" }], counts: { lead: { held: 2, of: 3 } } }) } });
    states.push(["account " + name, s.sx(), s.P.S.cover, ""], ["rail " + name, (s.P.S.screen = "project", s.P.S.open = { dir: TEAM_DIR, project: { rev: 0 }, draft: { langs: [], cards: [] }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 }, editions: [], langs: { rows: [] } }, s.P.paint(), s.rail()), s.P.S.cover, ""],
      ["panel " + name, s.get("acctPopHtml") ? s.get("acctPopHtml")() : "NO-PANEL", s.P.S.cover, ""]);
  }
  const boxed = states.filter(([, h, cover, line]) => BOXED.test(String(h).replace(/<p class="lede">[\s\S]*?<\/p>/g, "")) || !!cover || /did not finish/.test(line || ""));
  const facts = states.filter(([n]) => / (unreached|signin-full|signin-refused)$/.test(n)).every(([, h]) => /data-signin-fact/.test(h));
  check(boxed.length === 0 && facts && states.length === 26 && states.every(([, h]) => h && h !== "NO-PANEL"),
    "si30 no sign-in state opens a cover, says itself in the status line or draws a dialog, a toast, a notice or a refusal box; each failure is the heading"
    + " of the place that asked: " + states.length + " states, boxed " + JSON.stringify(boxed.map((x) => x[0])) + (facts ? "" : " FACTS-NOT-HEADINGS"));
});

/* ---- si31 to si39: the screens' last round (board 980; night decisions 16, 19 and 20; the copywriter's final words), and board
   993's reach on the Team screen. The Team screen is ui/app.js's paintDesks on tests/page-stand-in.mjs over a folder team this
   Studio leads; the service is stood in by the shapes person/list and person/admit answer. ------------------------------------ */

/* ---- si31, "not allowed" is two states, each its own sentence, and neither is a cancel (night decision 20 (b)) ------------- */
await leg("si31", async () => {
  const pending = { state: "st-31" };
  const reason = (q) => C.loopbackAnswer("?state=st-31&" + q, pending).reason;
  const loop = {
    consent: reason("error=consent_required"), policy: reason("error=admin_policy_enforced"),
    denied65001: reason("error=access_denied&error_description=" + encodeURIComponent("AADSTS65001: The user or administrator has not consented")),
    other90094: reason("error=invalid_request&error_description=" + encodeURIComponent("AADSTS90094: Admin consent is required")),
    d65004: reason("error=access_denied&error_description=AADSTS65004"), d90095: reason("error=access_denied&error_description=AADSTS90095"),
    cancel: reason("error=access_denied"), refused: reason("error=server_error"), stranger: C.loopbackAnswer("?state=other&error=consent_required", pending).reason,
  };
  const svc = async (status, body) => C.signIn(async () => ({ status, bytes: Buffer.from(JSON.stringify(body)) }), open, "microsoft", jwt({ sub: "x" }), NOW, "ab".repeat(32));
  const noLicence = (await svc(403, { ok: false, reason: "no-licence" })).reason, full = (await svc(409, { ok: false, reason: "full" })).reason;
  const said = (why, frame) => ({ error: "x", said: { frame, vars: {}, why } });
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"), langText = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const frameOf = (k) => { const m = new RegExp('"' + k + '": "([^"]*)"').exec(mainText); return m ? m[1] : ""; };
  const door = async (why, lang) => {
    const d = await studio(HELD0, { lang, api: { licenceSignIn: () => Promise.resolve(said(why, frameOf(why) || "x")) } });
    await d.press("lic-signin", { "data-v": "microsoft" });
    const h = d.main(), m = /<h2 data-signin-fact>([^<]*)<\/h2><p class="lede">([^<]*)<\/p>/.exec(h);
    return { h, head: m ? plainText(m[1]).trim() : "", line: m ? plainText(m[2]).trim() : "", stop: (/<li class="stop">/.exec(h) ? h.slice(0, h.indexOf('<li class="stop">')).split("<li").length - 1 : -1) };
  };
  const org = await door("signin-org"), lic = await door("signin-no-licence"), fl = await door("signin-full"), cn = await door("signin-cancelled");
  const plOrg = await door("signin-org", "pl");
  const parts = {
    loopback: loop.consent === "signin-org" && loop.policy === "signin-org" && loop.denied65001 === "signin-org" && loop.other90094 === "signin-org"
      && loop.d65004 === "signin-cancelled" && loop.d90095 === "signin-org" && loop.cancel === "signin-cancelled" && loop.refused === "signin-refused"
      && loop.stranger === "signin-state",
    service: noLicence === "signin-no-licence" && full === "signin-full",
    orgDrawn: org.head === "This account's organisation has not allowed Etiuda at its sign-in provider."
      && org.line === "Its IT department can allow it; another account can be used meanwhile." && org.stop === 1,
    serviceDrawn: lic.head === "No Etiuda licence has a seat for this account."
      /* Moved for board 1017: the copywriter's line of 2026-11-22 in place of the one before, which named no code but no address either. */
      && lic.line === "The sign-in worked. A licence bought by this account, or a lead naming or inviting it by its email address, gives it a seat; another account can be used meanwhile."
      && lic.stop === 2 && fl.head === "This licence has no free lead seat." && fl.stop === 2,
    apart: new Set([org.head, lic.head, fl.head]).size === 3,
    cancelQuiet: !/data-signin-fact/.test(cn.h) && /data-signin-door/.test(cn.h),
    polish: plOrg.head === "Organizacja tego konta nie dopuściła Etiudy u swojego dostawcy logowania." && plOrg.line === "Może to zmienić jej dział IT; do tego czasu można użyć innego konta.",
    shellSays: ["signin-org", "signin-no-licence", "signin-full"].every((k) => frameOf(k) && langText.indexOf('"' + frameOf(k) + '":') >= 0)
      && frameOf("signin-org") !== frameOf("signin-no-licence") && frameOf("signin-org") !== frameOf("signin-cancelled"),
  };
  check(Object.values(parts).every(Boolean),
    "si31 \"not allowed\" is two states with a sentence each: the provider's organisation-consent refusal (consent_required, admin_policy_enforced,"
    + " or a description naming AADSTS65001, 90094 or 90095) is signin-org, apart from a plain cancel, AADSTS65004 (the person declining consent) among the cancels, and the service's no-licence and full are"
    + " the other; each drawn as the door's own heading and line, the org's stopped at the choosing step, a cancel drawing none; Polish too: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ")
    + (Object.values(parts).every(Boolean) ? "" : " " + JSON.stringify({ loop, org: [org.head, org.line, org.stop], lic: [lic.head, lic.line, lic.stop], full: [fl.head, fl.stop] })));
});

/* ---- si32, paidWaits evaluation lines removed from Team, Statistics and Proposals (S-3) ------------------------------------ */
await leg("si32", async () => {
  const screens = async (held, o) => {
    const s = await teamOn(held, o);
    s.get("paintTeams")();
    const team = s.main();
    s.P.S.screen = "project"; s.P.S.section = "cards"; s.P.paint();
    const rail = s.rail();
    s.P.S.section = "stats";
    await s.get("statsLoad")();
    const stats = s.main(), statsAsked = s.calls.filter((c) => /^stats/.test(c)).length;
    s.P.S.section = "proposals"; s.P.S.rv = s.P.S.rv || null;
    s.get("paintProposals")();
    const props = s.main();
    return { s, team, rail, stats, props, statsAsked };
  };
  const un = await screens(UNSIGNED), signed = await screens(SIGNED);
  const none = await screens(Object.assign({}, UNSIGNED, { signIn: [] }), { host: { signIn: [] } });
  await un.s.press("door-open");
  const parts = {
    noPaidWaits: !un.s.get("paidWaits") && !un.s.get("paidHtml") && !/data-signin-paid/.test(un.team + un.stats + un.props),
    teamHasPublish: /data-first-publish/.test(un.team) && /data-first-publish/.test(signed.team),
    statsCallsThrough: un.statsAsked === 1 && signed.statsAsked === 1,
    opensDoor: un.s.P.S.signDoor === "open" && /data-signin-door/.test(un.s.main()),
    catalogRail: /data-signin-foot[\s\S]*data-act="door-open"/.test(un.rail) && !/data-signin-foot/.test(signed.rail + none.rail),
    notOffered: !/data-signin-paid/.test(none.team + none.stats + none.props) && /data-first-publish[^>]*>[^<]*<button class="btn solid" data-act="publish">/.test(none.team),
  };
  check(Object.values(parts).every(Boolean),
    "si32 paidWaits and paidHtml evaluation screens are gone from Team, Statistics and Proposals; door-open still opens the door and the catalog rail keeps the sign-in foot when unsigned: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si33, the lead's list: shown only to a signed-in lead with someone to show, between Asking to join and Members ---------- */
await leg("si33", async () => {
  const s = await teamOn(SIGNED);
  const h = s.main(), t = plainText(h);
  const ask = h.indexOf("Asking to join"), list = h.indexOf("data-people"), byCode = h.indexOf("data-person-invite-row"), members = h.indexOf(">Members<");
  const rows = Array.from(h.matchAll(/<div class="si-prow" data-person="([^"]+)">/g), (m) => m[1]);
  const empty = await teamOn(SIGNED, { people: [] });
  const unsigned = await teamOn(UNSIGNED);
  const relay = await teamOn(SIGNED, { facts: teamFacts({ folder: RELAY_AT }) });
  const relayHtml = relay.main(), onRelayPage = relay.get("onRelay") ? relay.get("onRelay")(RELAY_AT) : null;
  const relayRows = Array.from(relayHtml.matchAll(/<div class="si-prow" data-person="([^"]+)">/g), (m) => m[1]);
  const relayIn = await teamOn(SIGNED, { facts: teamFacts({ folder: RELAY_AT }),
    api: { personAdmit: (...a) => Promise.resolve({ error: null, admitted: a[1] }) } });
  await relayIn.press("person-admit", { "data-v": PERSON_ADA });
  const relayGot = plainText(relayIn.main());
  const pl = await teamOn(SIGNED, { lang: "pl" });
  const plText = plainText(pl.main());
  const parts = {
    placed: ask > 0 && list > ask && byCode > list && members > byCode,
    rows: JSON.stringify(rows) === JSON.stringify([PERSON_ADA, PERSON_DORA]),
    eachRow: !codeIn(h) && new RegExp('data-person="' + PERSON_ADA + '">[\\s\\S]*?<b>Ada</b><span class="ad">ada@example\\.com</span>[\\s\\S]*?signed in 11 Nov[\\s\\S]*?<button class="btn sm solid" data-act="person-admit" data-v="' + PERSON_ADA + '">Admit').test(h)
      && new RegExp('data-person="' + PERSON_DORA + '">[\\s\\S]*?not added yet[\\s\\S]*?signed in 9 Nov</span><button class="btn sm" data-act="person-admit" data-v="' + PERSON_DORA + '">Admit').test(h),
    label: t.indexOf("People of your organisation who signed in") >= 0 && t.indexOf("Invite by email address") >= 0 && t.indexOf("Admit by sign-in code") < 0,
    askedOnce: s.calls.filter((c) => /^peopleList/.test(c)).length === 1 && s.calls.indexOf("peopleList:" + TEAM_DIR) >= 0,
    emptyNoList: !/data-people/.test(empty.main()) && /data-person-invite-row/.test(empty.main()),
    unsignedNone: !/data-people|data-person-invite-row|data-act="person-admit/.test(unsigned.main()) && !unsigned.calls.some((c) => /^peopleList/.test(c)),
    relayShown: onRelayPage === true && /data-people/.test(relayHtml) && /data-person-invite-row/.test(relayHtml)
      && JSON.stringify(relayRows) === JSON.stringify([PERSON_ADA, PERSON_DORA]) && relay.calls.filter((c) => /^peopleList/.test(c)).length === 1,
    relayAdmitted: relayGot.indexOf("Admitted to the licence. On the relay, each new computer Ada uses still joins by an invitation.") >= 0
      && relayGot.indexOf("Admitted. The catalog reaches every computer") < 0,
    polish: plText.indexOf("Osoby z organizacji, które się zalogowały") >= 0 && plText.indexOf("Zaproś adresem e-mail") >= 0
      && new RegExp('data-act="person-admit" data-v="' + PERSON_ADA + '">Przyjmij<').test(pl.main()) && plText.indexOf("logowanie 11 lis") >= 0,
  };
  check(Object.values(parts).every(Boolean),
    "si33 the lead's list of people who signed in is drawn in the Roster between Asking to join and Members, for a signed-in lead on a folder team with"
    + " someone to show, in the order the shell gave (newest first, its Admit the solid one), each row (moved for board 1017: old \"the code in fours, a"
    + " name field kept on this computer\") the name and address the service gave, the day and Admit, never a code; with nobody to show only Invite by"
    + " email address (old: Admit by sign-in code); unsigned nothing, and nothing asked; on a relay team the same, its admitted row the copywriter's relay case: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si34, Admit acts at once; the row says admitted, refused or not reached; the name stays on this computer --------------- */
await leg("si34", async () => {
  const REFUSED = "Admitting people needs this Studio signed in and this catalog shared with a team, so nobody was admitted.";
  const UNREACHED = "The licence service could not be reached, so nothing was changed. Try again later.";
  let answerNext = null;
  const s = await teamOn(SIGNED, { api: {
    personAdmit: (...a) => Promise.resolve(answerNext ? answerNext(...a) : { error: null, admitted: a[1] }) } });
  await s.press("person-admit", { "data-v": PERSON_ADA });
  const admitted = s.main();
  answerNext = () => ({ error: "x", said: { frame: REFUSED, vars: {}, why: "person-lead" } });
  await s.press("person-admit", { "data-v": PERSON_DORA });
  const refused = s.main();
  answerNext = () => ({ error: "x", said: { frame: UNREACHED, vars: {}, why: "unreached" } });
  await s.press("person-admit", { "data-v": PERSON_DORA });
  const unreached = s.main();
  /* Moved for board 1017: no name is typed beside a code any more; a field left sends nothing. */
  const target = { value: "Dora", getAttribute: (k) => (k === "data-seat-name" ? DORA : null), closest: () => null };
  for (const hd of s.home.doc.heard.filter((x) => x.type === "change")) { try { hd.fn({ target }); } catch { /* another listener's own reading */ } }
  await tick();
  const named = s.calls.filter((c) => /Dora|Ada\b/.test(c));
  const unnamed = await teamOn(SIGNED, { api: { personAdmit: (...a) => Promise.resolve({ error: null, admitted: a[1] }) } });
  await unnamed.press("person-admit", { "data-v": PERSON_DORA });
  const rowOf = (h, code) => { const i = h.indexOf('data-person="' + code + '"'); return i < 0 ? "" : h.slice(i, h.indexOf('data-person="', i + 20) > 0 ? h.indexOf('data-person="', i + 20) : h.indexOf("data-person-invite-row", i)); };
  const parts = {
    sent: s.calls.filter((c) => /^personAdmit/.test(c))[0] === "personAdmit:" + TEAM_DIR + "," + PERSON_ADA + ",list",
    noConfirm: !s.P.S.cover && !/role="dialog"/.test(admitted),
    admittedRow: /data-person-admitted/.test(rowOf(admitted, PERSON_ADA)) && plainText(rowOf(admitted, PERSON_ADA)).indexOf("Admitted to the licence. On the relay, each new computer Ada uses still joins by an invitation.") >= 0
      && !new RegExp('data-act="person-admit" data-v="' + PERSON_ADA + '"').test(admitted),
    thisAccount: plainText(unnamed.main()).indexOf("Admitted to the licence. On the relay, each new computer this account uses still joins by an invitation.") >= 0,
    refusedRow: new RegExp('data-act="person-admit" data-v="' + PERSON_DORA + '"').test(rowOf(refused, PERSON_DORA)) && plainText(rowOf(refused, PERSON_DORA)).indexOf(REFUSED) >= 0,
    unreachedRow: new RegExp('data-act="person-admit" data-v="' + PERSON_DORA + '"').test(rowOf(unreached, PERSON_DORA)) && plainText(rowOf(unreached, PERSON_DORA)).indexOf(UNREACHED) >= 0
      && plainText(rowOf(unreached, PERSON_DORA)).indexOf(REFUSED) < 0,
    nothingNamed: named.length === 0,
  };
  check(Object.values(parts).every(Boolean),
    "si34 Admit sends the row's pseudonym alone (moved for board 1017; old: its code) and acts at once with no confirmation; the row then says admitted by"
    + " the name the service gave (or \"this account\"), or keeps its Admit and says the refusal or that the service was not reached; nothing is written"
    + " beside a code any more (old: a name reached the seat names' channel): "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si35, the client's two requests: person/list and person/admit, signed by the lead, carrying no name -------------------- */
await leg("si35", async () => {
  const sent = [];
  let reply = { status: 200, body: { ok: true, people: [] } };
  const ask = async (route, bytes) => { sent.push({ route, body: JSON.parse(Buffer.from(bytes).toString("utf8")) }); return { status: reply.status, bytes: Buffer.from(JSON.stringify(reply.body)) }; };
  const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(open.public, "hex")]), format: "der", type: "spki" });
  const verify = (bytes, sig) => crypto.verify(null, Buffer.from(bytes), pub, Buffer.from(String(sig), "hex"));
  reply = { status: 200, body: { ok: true, people: [{ code: DORA, person: "b2".repeat(32), signedIn: "2026-11-09" }, Object.assign({ code: ADA, person: PERSON_ADA, signedIn: "2026-11-11" }, LEAKED),
    { code: "not a code", person: PERSON_KIT, signedIn: "2026-11-10" }, { code: KIT, person: "short", signedIn: "2026-11-10" }] } };
  const listed = await C.listPeople(ask, open, NOW);
  const lb = sent[0] ? sent[0].body : {};
  reply = { status: 200, body: { ok: true, admitted: KIT, person: PERSON_KIT } };
  const took = await C.admitPerson(ask, open, " pqrs-2345 tvwx 6789 ", NOW + 1);
  const ab = sent[1] ? sent[1].body : {};
  reply = { status: 404, body: { ok: false, reason: "no-seat" } };
  const no = await C.admitPerson(ask, open, KIT, NOW + 2);
  const before = sent.length;
  const shape = await C.admitPerson(ask, open, "Ada Lovelace", NOW + 3);
  const afterShape = sent.length;
  reply = { status: 404, body: { ok: false, reason: "no-seat" } };
  const listNo = await C.listPeople(ask, open, NOW + 4);
  const parts = {
    listBody: sent[0] && sent[0].route === "person/list" && JSON.stringify(Object.keys(lb).sort()) === '["lead","sig","t"]' && lb.lead === open.public && lb.t === NOW
      && verify(Q.personListBytes({ lead: open.public, t: NOW }), lb.sig),
    /* Moved for board 1017: old keys code, person and day; new also the name the service gives (an added person's), the token's address and
       principal name never kept. */
    newestFirst: listed.ok === true && JSON.stringify(listed.people.map((p) => p.code)) === JSON.stringify([ADA, DORA])
      && JSON.stringify(Object.keys(listed.people[0]).sort()) === '["code","name","person","signedIn"]',
    admitBody: sent[1] && sent[1].route === "person/admit" && JSON.stringify(Object.keys(ab).sort()) === '["code","lead","sig","t"]' && ab.code === KIT
      && verify(Q.personAdmitBytes({ code: KIT, lead: open.public, t: NOW + 1 }), ab.sig),
    admitAnswer: took.ok === true && took.admitted === KIT && took.person === PERSON_KIT,
    refusal: no.ok === false && no.reason === "no-seat" && listNo.ok === false && listNo.reason === "no-seat",
    notACode: shape.ok === false && shape.reason === "no-seat" && afterShape === before,
    noName: !sent.some((x) => /Lovelace|kappa-tools|@/.test(JSON.stringify(x.body))),
  };
  check(Object.values(parts).every(Boolean),
    "si35 listPeople posts person/list {lead, t, sig} over personListBytes and keeps code, person and day, newest first; admitPerson posts person/admit"
    + " {code, lead, t, sig} over personAdmitBytes, the code typed in any spacing or case made its 16 symbols, and something else no code sends nothing;"
    + " a refusal passes through; no body carries a name or address: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si36, the shell's two channels: the admission recorded beside the team, the list without those admitted, no name sent -- */
await leg("si36", async () => {
  const DESK_ADA = "k-ada0ada0ada0ada0";
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [{ id: DESK_ADA }] } }
    : verb === "removeMember" ? { removed: true, team: { id: TEAM_ID, epoch: 1 } } : {});
  const sh = await shellOn({ thread });
  const was = answer;
  const bodies = [];
  let admitReply = { ok: true, admitted: ADA, person: PERSON_ADA };
  answer = (url, init) => {
    const body = init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : null;
    bodies.push({ url, body });
    if (/\/person\/list$/.test(url)) return { status: 200, body: JSON.stringify({ ok: true, people: [
      { code: ADA, person: PERSON_ADA, signedIn: "2026-11-11" }, { code: DORA, person: "b2".repeat(32), signedIn: "2026-11-09" }] }) };
    if (/\/person\/admit$/.test(url)) return { status: admitReply.ok ? 200 : 404, body: JSON.stringify(admitReply) };
    return { status: 404, body: "{}" };
  };
  let unsignedList = null, before = null, took = null, after = null, refusedTyped = null, refusedList = null, kept = null, sentUnsigned = 0, afterRemove = null;
  let listedAgain = null, admittedAgain = null;
  try {
    await sh.ask("studio:key-make");
    fs.rmSync(sh.file("licence-service.json"), { force: true });
    /* The seat's licence the root signed works for anyone since review xi (Max, 2026-11-22 15:37), so it is set aside for this ask. */
    const seatFile = sh.file("etiuda-studio-license.js"), seatAway = seatFile + ".away";
    if (fs.existsSync(seatFile)) fs.renameSync(seatFile, seatAway);
    unsignedList = await sh.ask("studio:people-list", TEAM_DIR);
    if (fs.existsSync(seatAway)) fs.renameSync(seatAway, seatFile);
    sentUnsigned = bodies.length;
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
    before = await sh.ask("studio:people-list", TEAM_DIR);
    took = await sh.ask("studio:person-admit", TEAM_DIR, PERSON_ADA, "list");
    after = await sh.ask("studio:people-list", TEAM_DIR);
    kept = JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8"));
    admitReply = { ok: false, reason: "no-seat" };
    refusedTyped = await sh.ask("studio:person-admit", TEAM_DIR, KIT, "typed");
    refusedList = await sh.ask("studio:person-admit", TEAM_DIR, "b2".repeat(32), "list");
    /* Remove in Members undoes the admission: the removed desk's person, as the seat book heard its certificate, is marked removed,
       listed again, and admitted again only by the lead's Admit, which writes the entry afresh. */
    fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: { [DESK_ADA]: { state: "seated", seat: PERSON_ADA } } } }));
    await sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_ADA, true);
    afterRemove = JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8"));
    fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({}));
    listedAgain = await sh.ask("studio:people-list", TEAM_DIR);
    admitReply = { ok: true, admitted: ADA, person: PERSON_ADA };
    await sh.ask("studio:person-admit", TEAM_DIR, PERSON_ADA, "list");
    admittedAgain = JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8"));
  } finally { answer = was; sh.done(); }
  /* Moved for board 1017: the page is handed pseudonyms and days, never a code. */
  const codes = (r) => (r && Array.isArray(r.people) ? r.people.map((p) => p.person) : null);
  const parts = {
    unsignedAsksNothing: !!unsignedList && !!unsignedList.said && unsignedList.said.why === "stopped" && sentUnsigned === 0,
    listed: JSON.stringify(codes(before)) === JSON.stringify([PERSON_ADA, "b2".repeat(32)]) && before.people.every((p) => JSON.stringify(Object.keys(p).sort()) === '["person","signedIn"]')
      && !codeIn(JSON.stringify(before)),
    recorded: !!took && took.admitted === PERSON_ADA && !!kept[TEAM_ID] && !!kept[TEAM_ID][PERSON_ADA] && kept[TEAM_ID][PERSON_ADA].code === ADA,
    listedWithout: JSON.stringify(codes(after)) === JSON.stringify(["b2".repeat(32)]),
    /* Moved for board 1017: old "a typed code no account has is refused in its own sentence"; new: nothing is typed, and a code handed in where a
       pseudonym belongs is refused as the list's, nothing sent. */
    typedRefused: !!refusedTyped && refusedTyped.said && refusedTyped.said.why === "person-lead",
    listRefused: !!refusedList && refusedList.said && refusedList.said.why === "person-lead",
    removeUndoes: !!afterRemove && !!afterRemove[TEAM_ID] && !!afterRemove[TEAM_ID][PERSON_ADA] && Number.isFinite(afterRemove[TEAM_ID][PERSON_ADA].removed),
    listedAgain: JSON.stringify(codes(listedAgain)) === JSON.stringify([PERSON_ADA, "b2".repeat(32)]),
    admittedAgain: !!admittedAgain && !!admittedAgain[TEAM_ID] && !!admittedAgain[TEAM_ID][PERSON_ADA] && admittedAgain[TEAM_ID][PERSON_ADA].removed === undefined,
    noName: bodies.length > 0 && !bodies.some((b) => /Lovelace/.test(JSON.stringify(b.body))),
  };
  check(Object.values(parts).every(Boolean),
    "si36 the shell lists the people for a signed-in lead alone (a Studio nobody signed in to refuses the ask as a stop and sends nothing; was: answered an empty list), hands the page pseudonyms and days, records an admission as the"
    + " person's pseudonym under the team in team-people.json and lists them no more, Remove in Members marking them removed, listed again until Admit"
    + " writes them afresh; a refusal is the list's (moved for board 1017: the page hands pseudonyms, never codes, and is handed no code); no request"
    + " carries a name: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(refusedTyped && refusedTyped.said));
});

/* ---- si37, Admit by sign-in code, the way a personal account reaches a lead (night decision 20 (c)) ------------------------ */
await leg("si37", async () => {
  /* MOVED FOR BOARD 1017. Old: "Admit by sign-in code takes the code a person gives, in any spacing or case, through the same admission as the list;
     admitted, the field empties and says so; refused, the code stays; her placeholder, in Polish too". New: there is no Admit by sign-in code; Invite
     by email address stands in its place, the copywriter's placeholder and heading in both languages, and no code field or act is drawn. */
  const s = await teamOn(SIGNED, { people: [] });
  const h = s.main();
  const pl = await teamOn(SIGNED, { lang: "pl", people: [] });
  const plH = pl.main();
  const parts = {
    gone: !/data-person-code|person-admit-code|Admit by sign-in code|the code the person gives/.test(h) && typeof s.P.ACTS["person-admit-code"] === "undefined",
    inPlace: /data-person-invite-row/.test(h) && /data-person-invite [^>]*placeholder="a colleague(?:&#39;|')s email address"/.test(h),
    polish: /placeholder="adres e-mail osoby z zespołu"/.test(plH) && plainText(plH).indexOf("Zaproś adresem e-mail") >= 0 && plainText(plH).indexOf("Przyjmij po kodzie logowania") < 0,
  };
  check(Object.values(parts).every(Boolean),
    "si37 (moved for board 1017) Admit by sign-in code is gone, field, act and words; Invite by email address stands in its place with the copywriter's"
    + " placeholder, in Polish too: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si38, nothing from the provider and no box, on the new places ------------------------------------------------------------ */
await leg("si38", async () => {
  const BOXED = /role="(?:dialog|alertdialog|alert)"|class="[^"]*\b(?:toast|notice|si-note|banner|sec-box|pw-refuse|alert)\b|data-err/;
  const states = [];
  const s = await teamOn(SIGNED, { api: { personAdmit: (...a) => Promise.resolve(a[1] === PERSON_ADA ? { error: null, admitted: a[1] }
    : { error: "x", said: { frame: "Admitting people needs this Studio signed in and this catalog shared with a team, so nobody was admitted.", vars: {}, why: "person-lead" } }) } });
  states.push(["list", s.main(), s.P.S.cover]);
  await s.press("person-admit", { "data-v": PERSON_ADA });
  states.push(["admitted", s.main(), s.P.S.cover]);
  await s.press("person-admit", { "data-v": PERSON_DORA });
  states.push(["refused", s.main(), s.P.S.cover]);
  /* Moved for board 1017: the typed state is Invite by email address's, with what is not an address. */
  s.home.node("#main input[data-person-invite]").value = KIT;
  await s.press("person-invite");
  states.push(["typed refused", s.main(), s.P.S.cover]);
  const un = await teamOn(UNSIGNED);
  un.get("paintTeams")();
  states.push(["paid team", un.main(), un.P.S.cover]);
  un.P.S.screen = "project"; un.P.S.section = "stats"; await un.get("statsLoad")();
  states.push(["paid stats", un.main(), un.P.S.cover]);
  /* Moved for board 1017: the name and address the service keeps of an added person are shown by design; the token's own (LEAKED's) never. */
  const leaks = states.filter(([, h]) => /Lovelace|kappa-tools|Microsoft|Google/.test(plainText(h)) || codeIn(h));
  const boxed = states.filter(([, h, cover]) => BOXED.test(String(h)) || !!cover);
  check(leaks.length === 0 && boxed.length === 0 && states.length === 6,
    "si38 on the Team screen's list, its admitted, refused and typed rows and the paid acts, nothing of the sign-in's token, no provider's name and no code"
    + " reaches the page text (moved for board 1017: the service's name and address of an added person are shown), and"
    + " no state opens a cover or draws a dialog, toast, notice or alert: leaks " + JSON.stringify(leaks.map((x) => x[0])) + " boxed " + JSON.stringify(boxed.map((x) => x[0])));
});

/* ---- si39, board 993: the Members table holds every column and act inside its pane at every width, no word broken -----------
   No window opens here, so this is the nearest node check, not a measurement in Chromium: the Team screen as paintDesks draws it,
   English and Polish, every way a teammate came and every seat state; each column's narrowest width is its longest unbreakable run
   (a word, a button whole, a key's disc and one group of four, the code field) at deliberately wide advances (sans 0.6em, mono 0.62em,
   the headings' capitals 0.72em plus their spacing), plus the cell's padding; and the pane's width at each window width is read from
   ui/index.html's own rules: the rail, the gutters, and where .team-cols puts the Roster beside its neighbour. */
await leg("si39", async () => {
  const css = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  const two = /@media \(min-width:(\d+)px\)\{ \.cols\.team-cols\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)\} \}/.exec(css);
  const one = /\.cols\.team-cols\{grid-template-columns:minmax\(0,1fr\)\}/.test(css);
  const nameRule = /#main table\.desks td:nth-child\(1\)\{([^}]*)\}/.exec(css);
  const breaksName = !nameRule || /break-all|anywhere/.test(nameRule[1]) || /#main table\.desks td:nth-child\(1\),/.test(css);
  const wraps = /#main \.team-cols table\.desks \.ksig,#main \.team-cols table\.desks \.ksig \.mono,#main \.team-cols table\.desks th\{white-space:normal\}/.test(css);
  /* The designer's two edits of 04:42: the key never breaks (its cell nowrap, so it is measured whole below), and two panes only
     from 1900px. */
  const keyWhole = /#main \.team-cols table\.desks td\.kcell,#main \.team-cols table\.desks td\.kcell \.ksig,#main \.team-cols table\.desks td\.kcell \.ksig \.mono\{white-space:nowrap\}/.test(css);
  const SANS = 0.6, MONO = 0.62, PAD = 28;
  const runW = (text, size, k) => text.length * size * k;
  const seatStates = ["seated", "freed", "full", "desks", "no-licence", "none"];
  const doors = ["invitation", "auto", "code", "folder", ""];
  const roster = [];
  doors.forEach((door, i) => roster.push({ id: "k-" + String(i).repeat(16), name: ["Anna (evenings)", "Grzegorz Brzęczyszczykiewicz", "Ewa", "Ola", "Jan"][i],
    own: i === 0 ? "Anna K." : "", key: String(i).repeat(16), admitted: i % 2 === 0, kind: "desk", door, version: i === 1 ? "2.0.0" : "", below: i === 1 }));
  const seats = { signedIn: true, desks: Object.fromEntries(roster.map((r, i) => [r.id, { state: seatStates[i % seatStates.length], held: i % 2 === 0 }])) };
  const need = {};
  for (const lang of ["en", "pl"]) {
    const s = await teamOn(SIGNED, { lang, people: [], facts: teamFacts({ seats, requests: [{ id: "k-9b12e0040c71b2e4", name: "Ola", asked: "2026-10-04T09:20:00.000Z", state: "ready", kind: "desk", door: "folder" }],
      team: { id: TEAM_ID, epoch: 1, sealed: true, relay: true, roster } }) });
    const h = s.main();
    for (const [which, tableAt] of [["members", h.indexOf("<table", h.indexOf("data-person-invite-row"))], ["asks", h.indexOf("<table")]]) {
      const table = h.slice(tableAt, h.indexOf("</table>", tableAt));
      const cols = [];
      for (const row of table.split(/<tr[^>]*>/).slice(1)) {
        Array.from(row.matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/g)).forEach((m, c) => {
          let cell = m[2].replace(/<svg[\s\S]*?<\/svg>/g, ""), w = 0;
          cell = cell.replace(/<button[^>]*>([\s\S]*?)<\/button>/g, (x, inner) => { w = Math.max(w, runW(plainText(inner).trim(), 12.5, SANS) + 22); return " "; });
          cell = cell.replace(/<span class="ksig">[\s\S]*?<span class="mono">([^<]*)<\/span><\/span>/g, (x, key) => { w = Math.max(w, 22 + 9 + (keyWhole ? runW(key, 14, MONO) : Math.max(...key.split(" ").map((g) => runW(g, 14, MONO))))); return " "; });
          cell = cell.replace(/<input class="code[^>]*>/g, () => { w = Math.max(w, 175); return " "; });
          const head = m[1] === "th";
          for (const word of plainText(cell).split(" ").filter(Boolean)) w = Math.max(w, head ? word.length * (11.5 * 0.72 + 0.6) : runW(word, 13.5, SANS));
          cols[c] = Math.max(cols[c] || 0, w + PAD);
        });
      }
      const sum = cols.reduce((a, b) => a + b, 0);
      need[which] = Math.max(need[which] || 0, sum);
    }
  }
  const at = (W) => {
    const main = W - (W >= 1100 ? 232 : 0) - 2 * 14;
    const pane = two && W >= Number(two[1]) ? (main - 14) / 2 : main;
    return pane - 2 - PAD;
  };
  const widths = [900, 1100, 1280, two ? Number(two[1]) - 1 : 1499, two ? Number(two[1]) : 1500, 1920];
  const short = widths.filter((W) => at(W) < Math.max(need.members, need.asks));
  /* The band's panel says the seat as Account's Seat row does, never the provider again (the designer's edit of 04:42). */
  const appSrc = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const bandSeat = appSrc.indexOf("{PROVIDER} · lead seat") < 0 && (appSrc.match(/T\("Etiuda Studio, lead seat"\)/g) || []).length >= 2;
  check(one && !!two && two[1] === "1900" && keyWhole && bandSeat && !breaksName && wraps && short.length === 0,
    "si39 (board 993; a node budget, not a window measure) the Team screen's Members and Asking to join tables need " + Math.round(need.members) + "px and "
    + Math.round(need.asks) + "px at their narrowest, every word whole, and the Roster's content width holds them at " + widths.join(", ") + "px ("
    + widths.map((W) => Math.round(at(W))).join(", ") + "px), the panes side by side only from " + (two ? two[1] : "?") + "px; no break-all on a name:"
    + " one=" + one + " two=" + !!two + " keyWhole=" + keyWhole + " bandSeat=" + bandSeat + " nameWhole=" + !breaksName + " wraps=" + wraps + " short=" + JSON.stringify(short));
});

/* ---- si40, the shell's own watch asks the thread to let in a known person's desk for a signed-in lead (Argon's review 1) ---- */
await leg("si40", async () => {
  const calls = [];
  const thread = (verb, ...a) => { calls.push([verb].concat(a));
    return Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [] } }
      : verb === "watchAdmit" ? { folder: a[0], team: { id: TEAM_ID, epoch: 1 }, admitted: [], skipped: [], spent: [] } : {}); };
  const sh = await shellOn({ thread });
  const share = path.join(A5_SCRATCH, "share-si40");
  fs.mkdirSync(share, { recursive: true });
  const asks = () => calls.filter((c) => c[0] === "watchAdmit" && path.resolve(String(c[1])) === path.resolve(share));
  const drain = async () => { for (let i = 0; i < 400; i++) { const w = sh.mod.teamWatchNow(); if (w) await w; else { await new Promise((r) => setTimeout(r, 25)); if (!sh.mod.teamWatchNow()) return; } } };
  const was = answer;
  answer = (url) => (/\/person\/admit$/.test(url) ? { status: 200, body: JSON.stringify({ ok: true, admitted: ADA, person: PERSON_ADA }) }
    : /\/person\/list$/.test(url) ? { status: 200, body: JSON.stringify({ ok: true, people: [{ code: ADA, person: PERSON_ADA, signedIn: "2026-11-11" }] }) } : { status: 404, body: "{}" });
  let unsigned = -1, signed = -1, handed = null, beforeAdmit = -1, afterAdmit = -1, took = null;
  try {
    await sh.ask("studio:key-make");
    fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams",
      /* On the relay (was: a team kept for a shared folder, which the watch no longer looks at; the folder team's removal). */
      teams: { [TEAM_ID]: { keys: {}, folder: path.resolve(share), relay: { rt: "4d".repeat(16), url: "https://etiuda.dev" } } } }));
    await sh.mod.watchOnce(share); await drain();
    unsigned = asks().length;
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1, licenceRef: "ab".repeat(16) }));
    await sh.mod.watchOnce(share); await drain();
    signed = asks().length;
    const last = asks().pop();
    handed = last ? last[4] : null;
    /* Moved for board 1017: the admission is the list's, by the pseudonym it gave (the shell sends the code); none is typed. */
    await sh.ask("studio:people-list", TEAM_DIR);
    beforeAdmit = asks().length;
    took = await sh.ask("studio:person-admit", TEAM_DIR, PERSON_ADA, "list");
    await drain();
    afterAdmit = asks().length;
  } finally {
    answer = was;
    sh.done();
  }
  const parts = {
    unsignedLeft: unsigned === 0,
    signedAsks: signed === 1 && !!handed && handed.userData === sh.ud && handed.seatRef === undefined,
    admitLooks: !!took && took.admitted === PERSON_ADA && afterAdmit === beforeAdmit + 1,
  };
  check(Object.values(parts).every(Boolean),
    "si40 through the shell's own watch (watchOnce, under the stub of Electron): a folder team with no live invitation is not handed"
    + " to the thread's watchAdmit for a Studio nobody signed in to, and is for a signed-in lead, so a known person's desk or one admitted by code is let in;"
    + " an admission by code looks at the team at once: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ")
    + " " + JSON.stringify([unsigned, signed, beforeAdmit, afterAdmit]));
});

/* ---- si41, Remove forgets an admission whose desk's seat was freed or ran out (Argon's review 4) ------------------------------ */
await leg("si41", async () => {
  const DESK_ADA = "k-ada0ada0ada0ada0", DESK_KIT = "k-c3c3c3c3c3c3c3c3";
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [{ id: DESK_ADA }, { id: DESK_KIT }] } }
    : verb === "removeMember" ? { removed: true, team: { id: TEAM_ID, epoch: 1 } } : {});
  const sh = await shellOn({ thread });
  let afterFreed = null, afterRunOut = null;
  try {
    await sh.ask("studio:key-make");
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
    fs.writeFileSync(sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_ADA]: { code: ADA, at: 1 }, [PERSON_KIT]: { code: KIT, at: 1 } } }));
    fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: {
      [DESK_ADA]: { state: "freed", seat: "", code: "", until: 0, freed: { seat: PERSON_ADA, at: 2 }, last: PERSON_ADA },
      [DESK_KIT]: { state: "expired", seat: "", code: "", until: 0, last: PERSON_KIT } } } }));
    await sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_ADA, true);
    afterFreed = JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8"));
    await sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_KIT, true);
    afterRunOut = JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8"));
  } finally { sh.done(); }
  const mine = (all) => (all && all[TEAM_ID]) || {};
  const gone = (e) => !!e && Number.isFinite(e.removed);
  const parts = { freedForgotten: !!afterFreed && gone(mine(afterFreed)[PERSON_ADA]) && !!mine(afterFreed)[PERSON_KIT] && !gone(mine(afterFreed)[PERSON_KIT]),
    runOutForgotten: !!afterRunOut && gone(mine(afterRunOut)[PERSON_KIT]) };
  check(Object.values(parts).every(Boolean),
    "si41 Remove in Members marks removed the person of the removed desk when the lead freed its seat first, or its certificate ran out,"
    + " the seat book still knowing whose the desk was: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si42, Remove withdraws an admission by code at the service, and Free never does (night decision 22) ----------------- */
await leg("si42", async () => {
  const DESK_ADA = "k-ada0ada0ada0ada0", DESK_KIT = "k-c3c3c3c3c3c3c3c3";
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [{ id: DESK_ADA }, { id: DESK_KIT }] } }
    : verb === "removeMember" ? { removed: true, team: { id: TEAM_ID, epoch: 1 } } : {});
  const sh = await shellOn({ thread });
  const settle = async () => { for (let i = 0; i < 200; i++) {
    const w = sh.mod.withdrawNow ? sh.mod.withdrawNow() : null;
    if (w) await w; else { await new Promise((r) => setTimeout(r, 10)); if (!(sh.mod.withdrawNow && sh.mod.withdrawNow())) return; } } };
  const was = answer, sent = [];
  let reply = { status: 503, body: '{"ok":false,"reason":"unavailable"}' }, release = null, held = null;
  answer = async (url, init) => {
    const route = String(url).replace(/^.*\/v1\//, "");
    sent.push({ route, body: init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : null });
    if (route === "person/withdraw") { if (held) await held; return reply; }
    if (route === "seat/free") return { status: 200, body: '{"ok":true,"freed":"desk"}' };
    return { status: 404, body: "{}" };
  };
  const withdraws = () => sent.filter((x) => x.route === "person/withdraw");
  const people = () => JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8"))[TEAM_ID] || {};
  let freeSent = -1, freeWithdraws = -1, removed = null, whileHeld = -1, owedAfterMiss = null, afterLook = null, again = -1, body = null, signed = false;
  try {
    await sh.ask("studio:key-make");
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
    fs.writeFileSync(sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_ADA]: { code: ADA, at: 1 }, [PERSON_KIT]: { code: KIT, at: 1 } } }));
    fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: {
      [DESK_ADA]: { state: "seated", seat: PERSON_ADA, code: ADA, until: NOW + 86400000, last: PERSON_ADA },
      [DESK_KIT]: { state: "seated", seat: PERSON_KIT, code: KIT, until: NOW + 86400000, last: PERSON_KIT } } } }));
    /* Free only releases the seat: seat/free, and no withdrawal. What the Desks screen reads after it is not this leg's. */
    try { await sh.ask("studio:seat-free", TEAM_DIR, DESK_KIT); } catch { /* the stand-in thread answers the screen's read with nothing */ }
    await settle();
    freeSent = sent.filter((x) => x.route === "seat/free").length;
    freeWithdraws = withdraws().length;
    /* Remove returns while the service has not answered, the person marked removed with the withdrawal owed. */
    held = new Promise((r) => { release = r; });
    removed = await sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_ADA, true);
    for (let i = 0; i < 200 && withdraws().length === 0; i++) await new Promise((r) => setTimeout(r, 10));
    whileHeld = withdraws().length;
    body = withdraws()[0] ? withdraws()[0].body : null;
    if (body) {
      const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(String(body.lead), "hex")]), format: "der", type: "spki" });
      signed = !!Q.personWithdrawBytes && crypto.verify(null, Buffer.from(Q.personWithdrawBytes({ person: body.person, lead: body.lead, t: body.t })), pub, Buffer.from(String(body.sig), "hex"));
    }
    held = null;
    if (release) release();
    await settle();
    owedAfterMiss = people()[PERSON_ADA];
    /* The next look asks again, and an answer clears what was owed; a look after that asks nothing. */
    reply = { status: 200, body: '{"ok":true}' };
    try { await sh.mod.watchOnce(); } catch { /* no team is watched here; the look's withdrawal is what is read */ }
    await settle();
    afterLook = people()[PERSON_ADA];
    try { await sh.mod.watchOnce(); } catch { /* as above */ }
    await settle();
    again = withdraws().length;
  } finally {
    if (release) release();
    answer = was;
    sh.done();
  }
  const parts = {
    freeNever: freeSent === 1 && freeWithdraws === 0,
    removeOnce: !!removed && removed.removed === true && whileHeld === 1 && !!body && body.person === PERSON_ADA
      && JSON.stringify(Object.keys(body).sort()) === '["lead","person","sig","t"]' && signed,
    owedKept: !!owedAfterMiss && Number.isFinite(owedAfterMiss.removed) && owedAfterMiss.withdraw === true,
    nextLook: !!afterLook && Number.isFinite(afterLook.removed) && afterLook.withdraw === undefined && again === 2
      && withdraws().every((x) => x.body && x.body.person === PERSON_ADA),
  };
  check(Object.values(parts).every(Boolean),
    "si42 Remove of a desk whose person the lead admitted by code withdraws the admission at the service once (person/withdraw, the person's"
    + " pseudonym, signed over personWithdrawBytes), without waiting for it; not reached, it stays owed and the next look asks again; Free sends"
    + " seat/free and never a withdrawal: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify([freeSent, freeWithdraws, whileHeld, again]));
});

/* ---- si56 to si58, Remove does what a lead would expect of the word (decision 27) ---------------------------------------------- */
/* Claude alpha's test: "Remove does what a lead would expect of the word, and nothing happens unseen." A signed-in lead with two
   folder teams, both in its teams file, the person's desks known by the seat book and their admissions by team-people.json, the
   service stood in: (a) the admission is withdrawn only when the person is left in none of this lead's teams. */
const TEAM2_ID = "t-5f1a8b02d3e4c6f7", TEAM2_DIR = "C:\\studio\\quay";
const DESK_ADA1 = "k-ada1ada1ada1ada1", DESK_ADA2 = "k-ada2ada2ada2ada2", DESK_KIT1 = "k-c3c1c3c1c3c1c3c1", DESK_KIT2 = "k-c3c2c3c2c3c2c3c2";
const DESK_DORA = "k-d0d0d0d0d0d0d0d0";
const seatedAs = (person, code) => ({ state: "seated", seat: person, code, until: NOW + 86400000, last: person });
/* `fail`, where given, is asked at each removal (its number from 1, the team, the desk) and answers an Error or nothing. An Error
   with `landed` set stands for a removal whose team file landed and whose reseal then failed: the desk is off the roster and the
   removal rejects as src/studio.mjs removeMember throws, `team` as {id, epoch} and no roster. Any other Error leaves the roster.
   `reread`, where given, answers the first teamFacts after such a landed removal, the shell's read of the roster again: "reject"
   rejects it, "no-roster" answers the team with no roster; every later read answers as usual. */
async function removeWorld(rosters, fail, reread) {
  const roster = (team) => (rosters[team] || []).map((id) => ({ id }));
  const removed = [];
  let rereadDue = false;
  const thread = (verb, dir, a2, a3, a4) => {
    const team = String(dir) === TEAM2_DIR ? TEAM2_ID : TEAM_ID;
    if (verb === "teamFacts" && rereadDue) {
      rereadDue = false;
      if (reread === "reject") return Promise.reject(Object.assign(new Error("EBUSY: resource busy or locked, open 'etiuda-team.json'"), { code: "EBUSY" }));
      return Promise.resolve({ team: { id: team, epoch: 1 + removed.length } });
    }
    if (verb === "teamFacts") return Promise.resolve({ team: { id: team, epoch: 1, roster: roster(team) } });
    if (verb === "removeMember") {
      removed.push([a3, a4]);
      const err = fail ? fail(removed.length, a3, a4) : null;
      if (err && !err.landed) return Promise.reject(err);
      rosters[a3] = (rosters[a3] || []).filter((x) => x !== a4);
      if (err) rereadDue = !!reread;
      if (err) return Promise.reject(Object.assign(err, { removed: a4, team: { id: a3, epoch: 1 + removed.length } }));
      return Promise.resolve({ removed: a4, team: { id: a3, epoch: 1 + removed.length, roster: roster(a3) } });
    }
    return Promise.resolve({});
  };
  /* The teams are on the relay and no relay is reached here: the catch-up counts as run and the move as held (a Remove on a relay team
     waits otherwise, and the service is told only of a removal that stands). Was: a Remove went ahead and told the service at once. */
  const sh = await shellOn({ thread, env: { STUDIO_TEST_RELAY_CAUGHT_UP: "1" } });
  const shares = [path.join(A5_SCRATCH, "share-d27-" + shells + "-a"), path.join(A5_SCRATCH, "share-d27-" + shells + "-b")];
  shares.forEach((s) => fs.mkdirSync(s, { recursive: true }));
  await sh.ask("studio:key-make");
  fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
  fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: {
    /* Both on the relay (was: two teams kept for a shared folder, which the shell no longer counts among the teams it watches). */
    [TEAM_ID]: { keys: {}, folder: path.resolve(shares[0]), relay: { rt: "4e".repeat(16), url: "https://etiuda.dev" }, autoAdmit: false },
    [TEAM2_ID]: { keys: {}, folder: path.resolve(shares[1]), relay: { rt: "4f".repeat(16), url: "https://etiuda.dev" }, autoAdmit: false } } }));
  const settle = async () => { for (let i = 0; i < 200; i++) {
    const w = sh.mod.withdrawNow ? sh.mod.withdrawNow() : null;
    if (w) await w; else { await new Promise((r) => setTimeout(r, 10)); if (!(sh.mod.withdrawNow && sh.mod.withdrawNow())) return; } } };
  const stop = () => { sh.done(); };
  return { sh, removed, settle, stop, people: () => JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8")) };
}
await leg("si56", async () => {
  const was = answer, sent = [];
  answer = async (url, init) => {
    const route = String(url).replace(/^.*\/v1\//, "");
    sent.push({ route, body: init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : null });
    return route === "person/withdraw" ? { status: 200, body: '{"ok":true}' } : { status: 404, body: "{}" };
  };
  /* The two teams are on the relay, where a Remove also asks the service to take the person off that team alone (the unplace: a
     person/withdraw carrying the team, sent before the relay removal and again by the pass after it). So the withdrawal of the lead's
     admission is the call with no team, and the unplace the call with one. */
  const withdrawn = () => sent.filter((x) => x.route === "person/withdraw" && x.body && x.body.team === undefined).map((x) => x.body.person);
  const unplaced = (team) => sent.filter((x) => x.route === "person/withdraw" && x.body && x.body.team === team).map((x) => x.body.person);
  const w = await removeWorld({ [TEAM_ID]: [DESK_ADA1, DESK_KIT1], [TEAM2_ID]: [DESK_ADA2, DESK_KIT2] });
  let firstTeam = null, afterFirst = null, lastTeam = null, kitOut = null;
  try {
    /* Ada admitted by code to both teams; Kit admitted by code to the first, and on the second by a desk the watch let in. */
    fs.writeFileSync(w.sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_ADA]: { code: ADA, at: 1 }, [PERSON_KIT]: { code: KIT, at: 1 } },
      [TEAM2_ID]: { [PERSON_ADA]: { code: ADA, at: 1 } } }));
    fs.writeFileSync(w.sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: { [DESK_ADA1]: seatedAs(PERSON_ADA, ADA), [DESK_KIT1]: seatedAs(PERSON_KIT, KIT) } },
      [TEAM2_ID]: { desks: { [DESK_ADA2]: seatedAs(PERSON_ADA, ADA), [DESK_KIT2]: seatedAs(PERSON_KIT, KIT) } } }));
    await w.sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_ADA1, true);
    await w.settle();
    firstTeam = w.people()[TEAM_ID][PERSON_ADA];
    afterFirst = withdrawn().slice();
    await w.sh.ask("studio:member-remove", TEAM2_DIR, TEAM2_ID, DESK_ADA2, true);
    await w.settle();
    lastTeam = w.people()[TEAM2_ID][PERSON_ADA];
    await w.sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_KIT1, true);
    await w.settle();
    kitOut = w.people()[TEAM_ID][PERSON_KIT];
  } finally { answer = was; w.stop(); }
  const gone = (e) => !!e && Number.isFinite(e.removed);
  const parts = {
    stillInAnother: gone(firstTeam) && firstTeam.withdraw === undefined && afterFirst.length === 0,
    leftInNone: gone(lastTeam) && JSON.stringify(withdrawn().slice(0, 1)) === JSON.stringify([PERSON_ADA]),
    byDeskElsewhere: gone(kitOut) && kitOut.withdraw === undefined && withdrawn().filter((p) => p === PERSON_KIT).length === 0,
    /* Moved for the relay: a person left on another team is taken off this one alone at the service. */
    unplacedHere: unplaced(TEAM_ID).includes(PERSON_ADA) && unplaced(TEAM_ID).includes(PERSON_KIT) && unplaced(TEAM2_ID).includes(PERSON_ADA),
  };
  check(Object.values(parts).every(Boolean),
    "si56 Remove takes a person out of that team alone while they are in another of this lead's teams, admitted there by code or on it"
    + " by a desk, and withdraws this lead's admission at the service only when they are left in none, asking it on each Remove to take them off"
    + " that relay team alone: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(withdrawn().map((p) => p.slice(0, 4))));
});
/* (b) Remove of a signed-in desk takes off every desk of its person on that team, and the confirmation's facts count them; a desk
   whose person is not known goes alone. */
await leg("si57", async () => {
  const was = answer;
  answer = async () => ({ status: 404, body: "{}" });
  const w = await removeWorld({ [TEAM_ID]: [DESK_ADA1, DESK_ADA2, DESK_KIT1, DESK_DORA], [TEAM2_ID]: [DESK_KIT2] });
  let shown = null, afterAda = null, afterDora = null;
  try {
    fs.writeFileSync(w.sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_ADA]: { code: ADA, at: 1 }, [PERSON_KIT]: { code: KIT, at: 1 } } }));
    fs.writeFileSync(w.sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: { [DESK_ADA1]: seatedAs(PERSON_ADA, ADA),
      [DESK_ADA2]: { state: "freed", seat: "", code: "", until: 0, freed: { seat: PERSON_ADA, at: 2 }, last: PERSON_ADA },
      [DESK_KIT1]: seatedAs(PERSON_KIT, KIT), [DESK_DORA]: { state: "none", seat: "", code: "", until: 0 } } },
      [TEAM2_ID]: { desks: { [DESK_KIT2]: seatedAs(PERSON_KIT, KIT) } } }));
    shown = w.sh.mod.removalShownNow ? await w.sh.mod.removalShownNow(TEAM_ID, [DESK_ADA1, DESK_ADA2, DESK_KIT1, DESK_DORA].map((id) => ({ id }))) : null;
    await w.sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_ADA1, true);
    await w.settle();
    afterAda = w.removed.slice();
    await w.sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_DORA, true);
    afterDora = w.removed.slice();
  } finally { answer = was; w.stop(); }
  const parts = {
    /* Moved for board 1017: old facts carried each person's code; new: the code stays in the shell, the page told only whether they lead. */
    counted: !!shown && JSON.stringify(shown[DESK_ADA1]) === JSON.stringify({ computers: 2, scope: "licence", lead: null })
      && shown[DESK_ADA2] && shown[DESK_ADA2].computers === 2 && !("code" in shown[DESK_ADA2])
      && JSON.stringify(shown[DESK_KIT1]) === JSON.stringify({ computers: 1, scope: "kept", lead: null, unplace: true }) && shown[DESK_DORA] === undefined,
    allTheirs: JSON.stringify(afterAda) === JSON.stringify([[TEAM_ID, DESK_ADA1], [TEAM_ID, DESK_ADA2]]),
    aloneUnsigned: !!afterDora && afterDora.length === 3 && JSON.stringify(afterDora[2]) === JSON.stringify([TEAM_ID, DESK_DORA]),
  };
  check(Object.values(parts).every(Boolean),
    "si57 Remove of a signed-in desk takes every desk of its person on that team off it, one removal each, its seat freed or held; a desk"
    + " not signed in goes alone; the confirmation's facts count the person's computers there and say whether this lead's admission goes:"
    + " " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify([shown, afterAda, afterDora]).slice(0, 400));
});
/* (b) whatever fails on the way (tau 2 of the Grok review of 2026-11-22, verified A by the test architect's junior w): a removal whose
   team file landed and whose reseal then failed is a removal, so the person's next computer still comes off; a computer whose own
   removal fails is reported, never a reason to skip the one after it, and the reply says how many are still on the team. */
const DESK_ADA3 = "k-ada3ada3ada3ada3";
const SI57R_PARTIAL = "This teammate is still on the team: some of their computers could not be taken off. Still on the team: {N}. Remove tries them again.";
await leg("si57r", async () => {
  const was = answer;
  answer = async () => ({ status: 404, body: "{}" });
  const OWED = "{NAME} is off the team. One catalog, {FILE}, has not yet been sealed again for the team as it now stands. Studio tries again each time it checks the team's folder, and at its next start, so it finishes by itself while Studio is open.";
  const owedErr = () => Object.assign(new Error("EBUSY: resource busy or locked, open 'harbour-lamps.ec'"),
    { code: "EBUSY", landed: true, resealOwed: "harbour-lamps.ec", said: { frame: OWED, vars: { NAME: "Ada", FILE: "harbour-lamps.ec" } } });
  const books = (ids) => {
    const desks = {};
    ids.forEach((id) => { desks[id] = seatedAs(PERSON_ADA, ADA); });
    desks[DESK_KIT1] = seatedAs(PERSON_KIT, KIT);
    return JSON.stringify({ [TEAM_ID]: { desks } });
  };
  const run = async (ids, fail, reread) => {
    const rosters = { [TEAM_ID]: ids.concat([DESK_KIT1]) };
    const w = await removeWorld(rosters, fail, reread);
    try {
      fs.writeFileSync(w.sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_ADA]: { code: ADA, at: 1 } } }));
      fs.writeFileSync(w.sh.file("desk-seats.json"), books(ids));
      const r = await w.sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, ids[0], true);
      await w.settle();
      return { r, removed: w.removed.map((x) => x[1]), left: rosters[TEAM_ID].slice() };
    } finally { w.stop(); }
  };
  let owed = null, partial = null, rereadFails = null, rereadBare = null;
  try {
    /* The first computer's removal lands and its reseal fails; the second's goes through. */
    owed = await run([DESK_ADA1, DESK_ADA2], (n) => (n === 1 ? owedErr() : null));
    /* Three computers: the first lands with a reseal owed, the second's team file is refused (nothing landed), the third goes through. */
    partial = await run([DESK_ADA1, DESK_ADA2, DESK_ADA3], (n) => (n === 1 ? owedErr()
      : n === 2 ? Object.assign(new Error("EBUSY: resource busy or locked, open 'etiuda-team.json'"), { code: "EBUSY" }) : null));
    /* The first computer's removal lands with a reseal owed, and the shell's read of the roster again then rejects, or answers the team
       with no roster: neither can say the second computer is off, so its removal is still tried (the test architect's read of ed5b77ac). */
    rereadFails = await run([DESK_ADA1, DESK_ADA2], (n) => (n === 1 ? owedErr() : null), "reject");
    rereadBare = await run([DESK_ADA1, DESK_ADA2], (n) => (n === 1 ? owedErr() : null), "no-roster");
  } finally { answer = was; }
  const said = partial && partial.r && partial.r.said;
  const parts = {
    bothOff: !!owed && JSON.stringify(owed.removed) === JSON.stringify([DESK_ADA1, DESK_ADA2])
      && JSON.stringify(owed.left) === JSON.stringify([DESK_KIT1]),
    doneSaid: !!owed && !!owed.r && !owed.r.error && !owed.r.stillOn && owed.r.removed === DESK_ADA2,
    nextTried: !!partial && JSON.stringify(partial.removed) === JSON.stringify([DESK_ADA1, DESK_ADA2, DESK_ADA3])
      && JSON.stringify(partial.left) === JSON.stringify([DESK_ADA2, DESK_KIT1]),
    partialSaid: !!partial && !!partial.r && JSON.stringify(partial.r.stillOn) === JSON.stringify([DESK_ADA2]) && !!partial.r.error
      && !!said && said.frame === SI57R_PARTIAL && !!said.vars && said.vars.N === 1,
    rereadFails: !!rereadFails && JSON.stringify(rereadFails.removed) === JSON.stringify([DESK_ADA1, DESK_ADA2])
      && JSON.stringify(rereadFails.left) === JSON.stringify([DESK_KIT1]),
    rereadBare: !!rereadBare && JSON.stringify(rereadBare.removed) === JSON.stringify([DESK_ADA1, DESK_ADA2])
      && JSON.stringify(rereadBare.left) === JSON.stringify([DESK_KIT1]),
  };
  check(Object.values(parts).every(Boolean),
    "si57r Remove of a person takes every computer of theirs off the team whatever fails on the way: a removal that landed with a reseal"
    + " owed goes on to the next, a computer whose removal fails is reported and the next still tried, and the reply says how many"
    + " are still on it: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " "
    + JSON.stringify([owed && owed.removed, owed && owed.left, partial && partial.removed, partial && partial.left,
      partial && partial.r && { stillOn: partial.r.stillOn, said: partial.r.said, error: partial.r.error },
      rereadFails && rereadFails.removed, rereadBare && rereadBare.removed]).slice(0, 700));
});
/* The confirmation is drawn and names which it will be: the computers, the admission withdrawn or kept, the owner's line on a
   co-lead's lead seat, and a desk not signed in leaving alone. */
await leg("si58", async () => {
  const OWNER_SEATS = [{ code: SIGNED_CODE, you: true }, { code: KIT, you: false }];
  const drawn = async (held, removal, member) => {
    const s = await studio(held, { api: { licenceSeats: () => Promise.resolve({ error: null, seats: OWNER_SEATS, counts: null }) } });
    const roster = [{ id: DESK_ADA1, name: "Ada" }, { id: DESK_ADA2, name: "Ada" }, { id: DESK_KIT1, name: "Kit" }, { id: DESK_DORA, name: "Dora" }];
    Object.assign(s.P.S, { open: { dir: TEAM_DIR }, cover: "team", teamWant: "remove", memberGoing: member, memberName: "",
      desks: { team: { id: TEAM_ID, epoch: 1, sealed: true, relay: true, roster }, seats: { signedIn: true, desks: {}, removal } } });
    const f = s.get("teamCoverHtml");
    return f ? plainText(f()) : "";
  };
  /* Moved for board 1017: old each person's code, the owner's page finding a co-lead's among its seats; new: the page is told only whether the
     person holds a lead seat (lead, from the shell's seat list), never their code. */
  const removal = { [DESK_ADA1]: { computers: 2, scope: "licence" }, [DESK_ADA2]: { computers: 2, scope: "licence" },
    [DESK_KIT1]: { computers: 1, scope: "licence" } };
  const ada = await drawn(SIGNED, removal, DESK_ADA1);
  const kept = await drawn(SIGNED, Object.assign({}, removal, { [DESK_KIT1]: { computers: 1, scope: "kept" } }), DESK_KIT1);
  const coLeadOwner = await drawn(Object.assign({}, SIGNED, { signinOwner: true }), Object.assign({}, removal, { [DESK_KIT1]: { computers: 1, scope: "licence", lead: true } }), DESK_KIT1);
  const coLeadNot = await drawn(SIGNED, removal, DESK_KIT1);
  const dora = await drawn(SIGNED, removal, DESK_DORA);
  const parts = {
    computers: ada.indexOf("Ada leaves the team on all their computers in it at once. Computers leaving: 2.") >= 0,
    withdrawn: ada.indexOf("Ada is in none of this Studio's other teams, so your admission of them to the licence is withdrawn too, until you admit them again.") >= 0
      && ada.indexOf("lead seat") < 0,
    kept: kept.indexOf("Kit leaves the team on their one computer in it.") >= 0 && kept.indexOf("Kit is still in another of this Studio's teams, so your admission of them to the licence stays.") >= 0
      && kept.indexOf("withdrawn") < 0,
    leadSeat: coLeadOwner.indexOf("Kit's lead seat on the licence is freed too.") >= 0 && coLeadNot.indexOf("lead seat") < 0,
    unsigned: dora.indexOf("That desk is not signed in, so only it leaves the team.") >= 0 && dora.indexOf("computers") < 0,
  };
  check(Object.values(parts).every(Boolean),
    "si58 the Remove confirmation says which it will be: how many of the person's computers leave, whether this lead's admission is withdrawn"
    + " or stays, the owner told a co-lead's lead seat is freed, and a desk not signed in leaving alone: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " || " + ada.slice(0, 300));
});

/* ---- si59, a lead stays (decision 29 (b)) ------------------------------------------------------------------------------------- */
/* Claude alpha's words: "A lead who is not the owner cannot remove another lead, from the team or the licence: the screen says the
   co-lead stays and that only the licence's owner can take a lead out, and it does nothing else." seat/list names Kit's code as
   holding a lead seat; a Studio that is not the owner presses Remove on Kit's desk, then the owner's does. */
await leg("si59", async () => {
  const LEAD_LINE = "This teammate holds a lead seat on the licence, so they stay on the team. Only the licence's owner can remove a lead from a team.";
  const was = answer, sent = [];
  answer = async (url, init) => {
    const route = String(url).replace(/^.*\/v1\//, "");
    sent.push(route);
    if (route === "seat/list") return { status: 200, body: JSON.stringify({ ok: true, seats: [{ code: CODE1, you: true }, { code: KIT, you: false }] }) };
    return route === "person/withdraw" ? { status: 200, body: '{"ok":true}' } : { status: 404, body: "{}" };
  };
  const run = async (owner) => {
    const w = await removeWorld({ [TEAM_ID]: [DESK_KIT1, DESK_ADA1] });
    try {
      fs.writeFileSync(w.sh.file("licence-service.json"), JSON.stringify(Object.assign({ by: "signin", provider: "microsoft", signinCode: CODE1 }, owner ? { signinOwner: true } : {})));
      fs.writeFileSync(w.sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_KIT]: { code: KIT, at: 1 } } }));
      fs.writeFileSync(w.sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: { [DESK_KIT1]: seatedAs(PERSON_KIT, KIT), [DESK_ADA1]: seatedAs(PERSON_ADA, ADA) } } }));
      const before = [fs.readFileSync(w.sh.file("team-people.json"), "utf8"), fs.readFileSync(w.sh.file("desk-seats.json"), "utf8")];
      sent.length = 0;
      const shown = w.sh.mod.removalShownNow ? await w.sh.mod.removalShownNow(TEAM_ID, [{ id: DESK_KIT1 }, { id: DESK_ADA1 }]) : null;
      const r = await w.sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_KIT1, true);
      await w.settle();
      const after = [fs.readFileSync(w.sh.file("team-people.json"), "utf8"), fs.readFileSync(w.sh.file("desk-seats.json"), "utf8")];
      return { shown, r, removed: w.removed.slice(), sent: sent.slice(), same: before[0] === after[0] && before[1] === after[1] };
    } finally { w.stop(); }
  };
  let co = null, own = null;
  try { co = await run(false); own = await run(true); } finally { answer = was; }
  const saidOf = (r) => (r && r.said && (r.said.frame || r.said.text)) || (r && r.error) || "";
  /* The page: the one line in the confirmation's place, and no Remove to press; the owner's cover is the confirmation. */
  const drawn = async (held, member) => {
    const s = await studio(held, { api: { licenceSeats: () => Promise.resolve({ error: null, seats: [{ code: KIT, you: false }], counts: null }) } });
    Object.assign(s.P.S, { open: { dir: TEAM_DIR }, cover: "team", teamWant: "remove", memberGoing: member, memberName: "",
      desks: { team: { id: TEAM_ID, epoch: 1, sealed: true, relay: true, roster: [{ id: DESK_KIT1, name: "Kit" }] },
        seats: { signedIn: true, desks: {}, removal: { [DESK_KIT1]: { computers: 1, scope: "licence", code: KIT, lead: true } } } } });
    const f = s.get("teamCoverHtml");
    return f ? f() : "";
  };
  const coPage = await drawn(SIGNED, DESK_KIT1), ownPage = await drawn(Object.assign({}, SIGNED, { signinOwner: true }), DESK_KIT1);
  const parts = {
    known: !!co && !!co.shown && co.shown[DESK_KIT1] && co.shown[DESK_KIT1].lead === true && co.shown[DESK_ADA1].lead === false,
    nothingDone: !!co && !!co.r && !!co.r.error && saidOf(co.r) === LEAD_LINE && co.removed.length === 0 && co.same
      && !co.sent.includes("person/withdraw"),
    ownerWorks: !!own && !!own.r && !own.r.error && JSON.stringify(own.removed) === JSON.stringify([[TEAM_ID, DESK_KIT1]]) && own.sent.includes("person/withdraw"),
    pageLine: plainText(coPage).indexOf(LEAD_LINE) >= 0 && !/data-act="do-member-remove"/.test(coPage) && !/data-removal/.test(coPage),
    ownerPage: /data-act="do-member-remove"/.test(ownPage) && plainText(ownPage).indexOf("Kit's lead seat on the licence is freed too.") >= 0
      && plainText(ownPage).indexOf(LEAD_LINE) < 0,
  };
  check(Object.values(parts).every(Boolean),
    "si59 a lead who is not the owner pressing Remove on a co-lead's desk takes nothing off the team, writes nothing and sends no withdrawal,"
    + " and is told the co-lead stays in the confirmation's place; the owner's Remove still takes the co-lead off and withdraws: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify([co && saidOf(co.r), co && co.sent, own && own.sent, own && own.r && own.r.error]).slice(0, 400));
});

/* ---- si44 and si45, Carry on from another computer (A6, the first step) --------------------------------------------------------- */
const NO_KEY = { keyId: "", problem: null };
const KEY_BACK = { keyId: "studio-9a3a782d7f8ff25b", print: "9a3a782d7f8ff25b", kept: "os", problem: null,
  backup: { keyId: "studio-9a3a782d7f8ff25b", made: "2026-11-12", where: "E:\\", restored: true } };
const COPY_AT = "E:\\etiuda-studio-key-9a3a782d.json";
/** A signed-in Studio with no key whose restore channels answer as the shell does; `restored` is studio:key-restore's answer. */
const carryStudio = (restored, host, lang) => studio(SIGNED, { lang, host: Object.assign({ signing: NO_KEY }, host || {}), api: {
  keyRestorePick: () => Promise.resolve({ error: null, file: COPY_AT, keyId: KEY_BACK.keyId, print: KEY_BACK.print }),
  keyRestore: () => Promise.resolve(JSON.parse(JSON.stringify(restored))),
  pickRoot: () => Promise.resolve({ error: null, root: "S:\\Catalogs", projects: [], made: true }) } });
await leg("si44", async () => {
  const group = (h) => (/<div class="sx-group"><div class="si-sh" data-carry-on>[\s\S]*?<\/div><\/div><\/div>/.exec(h) || [""])[0];
  const offers = (h) => /data-carry-on/.test(h) && /data-act="acct-carry-key"/.test(h);
  const unsigned = (await studio(HELD0, { host: { signinDoor: true } })).sx();
  const keyed = (await studio(SIGNED, { host: { signing: KEY_BACK } })).sx();
  const unreadable = (await studio(SIGNED, { host: { signing: { keyId: "", problem: "x", name: "signing-key.json" } } })).sx();
  const noProvider = (await studio(Object.assign({}, SIGNED, { signIn: [] }), { host: { signing: NO_KEY } })).sx();
  const s = await carryStudio(Object.assign({ error: null }, KEY_BACK));
  const offered = s.sx(), before = s.calls.length;
  await s.press("acct-carry-key");
  const cover = s.home.node("#dlg").innerHTML;
  s.home.node("#keyPass").value = "its words";
  await s.press("do-key-restore");
  const restored = s.sx(), afterRestore = s.calls.slice(before);
  await s.press("acct-carry-root");
  const opened = s.sx(), afterOpen = s.calls.slice(before);
  /* The same restore from the Signing key row, not from Account, leaves no group behind: the guide is Account's own. */
  const row = await carryStudio(Object.assign({ error: null }, KEY_BACK));
  row.sx();
  await row.press("key-restore");
  row.home.node("#keyPass").value = "its words";
  await row.press("do-key-restore");
  const fromRow = row.sx();
  const g = { offered: plainText(group(offered)), restored: plainText(group(restored)), opened: plainText(group(opened)) };
  const parts = {
    onlySignedWithNoKey: offers(offered) && !/data-carry-on/.test(unsigned) && !/data-carry-on/.test(keyed) && !/data-carry-on/.test(unreadable)
      && !/data-carry-on/.test(noProvider),
    offer: g.offered.indexOf("Carry on from another computer") >= 0 && g.offered.indexOf("Choose the backup copy…") >= 0
      && !/data-act="acct-carry-root"/.test(offered),
    sameCover: s.P.S.keyWant === "restore" && /data-act="do-key-restore"/.test(cover) && plainText(cover).indexOf("9a3a 782d 7f8f f25b") >= 0,
    sameChannels: JSON.stringify(afterRestore) === JSON.stringify(["keyRestorePick:Restore the signing key,Signing key", "keyRestore:" + COPY_AT + ",its words"]),
    stepTwo: !s.P.S.cover && !/data-act="acct-carry-key"/.test(restored) && /data-row="carry-projects"[\s\S]*data-act="acct-carry-root"/.test(group(restored))
      && g.restored.indexOf("9a3a 782d 7f8f f25b") >= 0,
    projects: JSON.stringify(afterOpen.slice(afterRestore.length)) === JSON.stringify(["pickRoot:Open a folder"]) && g.opened.indexOf("S:\\Catalogs") >= 0,
    accountOnly: !/data-carry-on/.test(fromRow) && row.P.S.host.signing.keyId === KEY_BACK.keyId,
  };
  check(Object.values(parts).every(Boolean),
    "si44 Account offers Carry on from another computer only signed in with no signing key (not before sign-in, not with a key or an unreadable key"
    + " file, not with no provider); its press is the Signing key row's own restore, the same cover and only the channels studio:key-restore-pick and"
    + " studio:key-restore, and then the projects on a share through the Library's own folder pick; a restore from the row leaves no guide: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " calls=" + JSON.stringify(afterOpen));
});
await leg("si45", async () => {
  /* The page: the shell's refusal of a wrong passphrase keeps the cover with its sentence and the offer as it was. */
  const said = { frame: "The passphrase does not open this copy. Nothing was changed.", vars: {} };
  const s = await carryStudio({ error: "x", said });
  s.sx();
  await s.press("acct-carry-key");
  s.home.node("#keyPass").value = "not its words";
  await s.press("do-key-restore");
  const dlg = plainText(s.home.node("#dlg").innerHTML), acct = s.sx();
  /* The shell under its stub of Electron, its thread src/studio.mjs itself: a real backup copy, a wrong passphrase, then the right one. */
  const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
  const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
  const WORDS = "a lantern on the quay at dusk";
  const pair = await Sg.makePair(), copy = path.join(A5_SCRATCH, "si45-copy.json");
  fs.mkdirSync(A5_SCRATCH, { recursive: true });
  fs.writeFileSync(copy, JSON.stringify(Sg.passphraseFile(pair, WORDS), null, 1));
  const sh = await shellOn({ thread: (verb, ...a) => Promise.resolve().then(() => St[verb](...a)) });
  const snap = (dir) => { const out = {}; const walk = (d) => { for (const n of fs.readdirSync(d)) { const f = path.join(d, n);
    if (fs.statSync(f).isDirectory()) walk(f); else out[path.relative(dir, f)] = fs.readFileSync(f).toString("base64"); } }; walk(dir); return out; };
  const was = process.env.STUDIO_TEST_RESTORE;
  process.env.STUDIO_TEST_RESTORE = copy;
  let pick = null, wrong = null, right = null, beforeWrong = {}, afterWrong = {}, keyAfter = null, netWrong = -1, netRight = -1, storeAfter = "";
  asked.length = 0;
  try {
    /* A signed-in Studio's profile with no key: its settings, its sign-in and its teams, each a file the right restore writes or reads. */
    fs.writeFileSync(sh.file("studio.json"), JSON.stringify({ uiLang: "en" }) + "\n");
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }) + "\n");
    fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: {} }) + "\n");
    pick = await sh.ask("studio:key-restore-pick", "Restore the signing key", "Signing key");
    beforeWrong = snap(sh.ud);
    wrong = await sh.ask("studio:key-restore", pick && pick.file, "not " + WORDS);
    afterWrong = snap(sh.ud);
    netWrong = asked.length;
    right = await sh.ask("studio:key-restore", pick && pick.file, WORDS);
    netRight = asked.length;
    try { keyAfter = Sg.readKeyFile(path.join(sh.ud, "signing-key.json")); } catch { keyAfter = null; }
    try { storeAfter = fs.readFileSync(sh.file("studio.json"), "utf8"); } catch { storeAfter = ""; }
  } finally {
    if (was === undefined) delete process.env.STUDIO_TEST_RESTORE; else process.env.STUDIO_TEST_RESTORE = was;
    sh.done();
  }
  const parts = {
    pageCover: s.P.S.cover === "key" && dlg.indexOf("The passphrase does not open this copy. Nothing was changed.") >= 0
      && s.home.node("#keyPass").value === "",
    pageAsWas: s.P.S.host.signing.keyId === "" && /data-act="acct-carry-key"/.test(acct) && !/data-act="acct-carry-root"/.test(acct) && s.P.S.carryOn !== "restored",
    shellRefuses: !!pick && pick.keyId === pair.keyId && !!wrong && !!wrong.error && /does not open this copy/.test(JSON.stringify(wrong)),
    shellAsWas: Object.keys(beforeWrong).length >= 3 && JSON.stringify(afterWrong) === JSON.stringify(beforeWrong) && !("signing-key.json" in afterWrong),
    rightRestores: !!right && !right.error && !!keyAfter && keyAfter.public === pair.public && keyAfter.kept === "os" && /"keyBackup"/.test(storeAfter),
    noNetwork: netWrong === 0 && netRight === 0,
  };
  check(Object.values(parts).every(Boolean),
    "si45 a wrong passphrase leaves everything as it was: the page keeps the restore cover with the shell's sentence, the field emptied, no key and the"
    + " offer standing; the shell (its thread src/studio.mjs, a real backup copy) refuses it with every file of its profile byte for byte as before and"
    + " no key written; the right passphrase then restores the key, kept by the system, and neither asks the network anything: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " files=" + Object.keys(afterWrong).join(","));
});

/* ---- si46, the restored row says how many relay teams came back with the copy, or none ------------------------------------------- */
await leg("si46", async () => {
  /* The page, on the shell's answer: two teams, one, none, and an answer that names no count, which is said as none. */
  const rowSaid = async (carried, lang) => {
    const s = await carryStudio(Object.assign({ error: null }, KEY_BACK, carried === undefined ? {} : { carried }), null, lang);
    const offer = plainText(s.sx());
    await s.press("acct-carry-key");
    s.home.node("#keyPass").value = "its words";
    await s.press("do-key-restore");
    const after = s.sx();
    return Object.assign(new String(plainText((/<div class="sx-row" data-row="carry-key">[\s\S]*?<\/div><\/div>/.exec(after) || [""])[0])),
      { offer, after: plainText(after) });
  };
  const two = String(await rowSaid({ relays: 2 })), one = String(await rowSaid({ relays: 1 })), none = String(await rowSaid({ relays: 0 }));
  const unsaid = String(await rowSaid(undefined));
  /* In Polish, the copywriter's words of 2026-11-12, offer and both counts. */
  const plTwo = await rowSaid({ relays: 2 }, "pl"), plNone = String(await rowSaid({ relays: 0 }, "pl"));
  /* The shell, its thread src/studio.mjs: a copy that carried no relay team answers 0; one whose opened copy carries one relay row
     answers 1, the team then kept in teams.json. Electron's net is the file's recorder; the leg reads the count, not the sync. */
  const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
  const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
  const WORDS = "a lantern on the quay at dusk", TEAM = "t-" + "4e".repeat(8), RT = "5f".repeat(16);
  const pair = await Sg.makePair(), copy = path.join(A5_SCRATCH, "si46-copy.json");
  fs.mkdirSync(A5_SCRATCH, { recursive: true });
  fs.writeFileSync(copy, JSON.stringify(Sg.passphraseFile(pair, WORDS), null, 1));
  const restoreWith = async (extra, teamsHeld) => {
    const sh = await shellOn({ thread: (verb, ...a) => Promise.resolve().then(() => {
      const v = St[verb](...a);
      return verb === "openBackup" && extra ? Object.assign(v, extra) : v;
    }) });
    const was = process.env.STUDIO_TEST_RESTORE;
    process.env.STUDIO_TEST_RESTORE = copy;
    try {
      fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: teamsHeld || {} }) + "\n");
      const pick = await sh.ask("studio:key-restore-pick", "Restore the signing key", "Signing key");
      const r = await sh.ask("studio:key-restore", pick && pick.file, WORDS);
      let teams = "";
      try { teams = fs.readFileSync(sh.file("teams.json"), "utf8"); } catch { teams = ""; }
      return { r, teams };
    } finally {
      if (was === undefined) delete process.env.STUDIO_TEST_RESTORE; else process.env.STUDIO_TEST_RESTORE = was;
      sh.done();
    }
  };
  const plain = await restoreWith(null);
  const ROW = [{ team: TEAM, rt: RT, epoch: 1, key: crypto.randomBytes(32) }];
  const withRelay = await restoreWith({ relays: ROW });
  /* The same row where this computer already holds that team at another relay place: relaysBack skips it, so it is not counted. */
  const skipped = await restoreWith({ relays: ROW }, { [TEAM]: { keys: {}, relay: { rt: "6a".repeat(16), url: "https://relay.example/" } } });
  const UNCOUNTED = "Restored here, with the relay teams its copy carried.";
  const parts = {
    two: two.indexOf("Restored here, with the relay teams its copy carried: 2.") >= 0,
    one: one.indexOf("Restored here, with the relay teams its copy carried: 1.") >= 0,
    none: none.indexOf("Restored here. Its copy carried no relay team.") >= 0 && none.indexOf("its copy carried:") < 0,
    unsaidIsNone: unsaid.indexOf("Restored here. Its copy carried no relay team.") >= 0,
    neverUncounted: [two, one, none, unsaid].every((t) => t.indexOf(UNCOUNTED) < 0 && t.indexOf("with any relay teams") < 0) && /9a3a 782d 7f8f f25b/.test(two),
    polish: plTwo.offer.indexOf("Praca z innego komputera") >= 0 && plTwo.offer.indexOf("Wybierz kopię zapasową…") >= 0
      && String(plTwo).indexOf("Przywrócony tutaj, razem z zespołami na przekaźniku zapisanymi w kopii: 2.") >= 0
      && plTwo.after.indexOf("Projekty w udziale sieciowym") >= 0 && plTwo.after.indexOf("Otwórz folder…") >= 0
      && plNone.indexOf("Przywrócony tutaj. Kopia nie zawierała żadnego zespołu na przekaźniku.") >= 0
      && !/Carry on from another computer|Restored here|Projects on a share/.test(plTwo.offer + plTwo.after),
    shellNone: !!plain.r && !plain.r.error && !!plain.r.carried && plain.r.carried.relays === 0,
    shellOne: !!withRelay.r && !withRelay.r.error && !!withRelay.r.carried && withRelay.r.carried.relays === 1 && withRelay.teams.indexOf(TEAM) >= 0,
    shellSkipped: !!skipped.r && !skipped.r.error && !!skipped.r.carried && skipped.r.carried.relays === 0,
  };
  check(Object.values(parts).every(Boolean),
    "si46 the restored row in Carry on from another computer says how many relay teams came back with the copy, as studio:key-restore counts them in"
    + " the teams file (0 for a copy that carried none, 1 for one whose relay row was kept, 0 for a row skipped at another place), or that its copy"
    + " carried none, never the uncounted sentence; in Polish the copywriter's words: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify({ two, none, plain: plain.r && plain.r.carried,
      one: withRelay.r && withRelay.r.carried, skipped: skipped.r && skipped.r.carried }));
});

/* ---- si47, both steps from the start, and the share's row takes no folder it was not given (the product designer's edits) ------- */
await leg("si47", async () => {
  const rowOf = (h, k) => (new RegExp('<div class="sx-row[^"]*" data-row="' + k + '">[\\s\\S]*?</div></div>').exec(h) || [""])[0];
  const glyph = (row) => (/<svg[\s\S]*?<\/svg>/.exec(row) || [""])[0];
  const LIBRARY = "D:\\Library of this computer";
  const s = await carryStudio(Object.assign({ error: null }, KEY_BACK));
  s.P.S.root = LIBRARY;
  const offered = s.sx();
  await s.press("acct-carry-key");
  s.home.node("#keyPass").value = "its words";
  await s.press("do-key-restore");
  const restored = s.sx();
  await s.press("acct-carry-root");
  const picked = s.sx();
  const o = rowOf(offered, "carry-projects"), r = rowOf(restored, "carry-projects"), p = rowOf(picked, "carry-projects"), key = rowOf(picked, "carry-key");
  const css = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  /* The waiting row's class, read from the row, has the one rule that dims its label and no other: a class some other rule already
     styles would bring that rule's look too (si-wait, the sign-in's own waiting line, was the near miss). */
  const dim = (/class="sx-row ([a-z-]+)" data-row="carry-projects"/.exec(o) || [])[1] || "";
  const rulesOf = (c) => (css.match(new RegExp("\\." + c + "(?![\\w-])", "g")) || []).length;
  const parts = {
    drawnAtStart: !!dim && plainText(o).indexOf("Projects on a share") >= 0 && !/<button/.test(o) && o.indexOf(LIBRARY) < 0
      && css.indexOf(".sx-row." + dim + " .t b{color:var(--dim)}") >= 0 && rulesOf(dim) === 1,
    wakes: /class="sx-row" data-row="carry-projects"/.test(r) && /data-act="acct-carry-root"/.test(r) && r.indexOf(LIBRARY) < 0 && r.indexOf("S:\\Catalogs") < 0
      && glyph(r) !== glyph(rowOf(restored, "carry-key")),
    pickedTick: glyph(p) === glyph(key) && glyph(key) !== "" && /<span class="mono sx-val">S:\\Catalogs<\/span><button[^>]*data-act="acct-carry-root"/.test(p),
  };
  check(Object.values(parts).every(Boolean),
    "si47 Carry on from another computer draws its second step from the start, dimmed with no button and no folder; restored, it wakes with its button and"
    + " still names no folder, though the Library has one; picked from the row, it takes the key row's tick with the share's path before its button: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si48 to si52, the sign-in preview: Max's eye on the sign-in screens before any provider has a client id (Claude alpha's yes
   of 2026-11-12 08:44, with his two conditions: one double-click, and "the 'not set up yet' state must be visibly a preview ... and
   it must not survive into anything a customer gets: off by default with a leg, as you say, and the leg also proves the switch does
   nothing in a build where real client ids exist"). The words are the copywriter's (2026-11-12,
   in the office). ------------------------------------------------------------------------------------------------------------ */
const PREVIEW_LINE = "Preview only. Sign-in is not set up yet, so nothing here is sent.";
const PREVIEW_PRESSED = "Sign-in is not set up yet, so nothing was sent. This is a preview.";
const PREVIEW_LINE_PL = "Tylko podgląd. Logowanie nie jest jeszcze uruchomione, więc nic stąd nie zostanie wysłane.";
const PREVIEW_PRESSED_PL = "Logowanie nie jest jeszcze uruchomione, więc nic nie wysłano. To tylko podgląd.";
const PREVIEW_HOST = { signinPreview: true };
const PREVIEW_REFUSAL = { error: PREVIEW_PRESSED, said: { frame: PREVIEW_PRESSED, vars: {}, why: "signin-preview" } };
/** The shell's host and licence answers, as [offered, preview] each, under ETIUDA_SIGNIN_PREVIEW `v` (null: absent). */
async function previewAsked(v, o = {}) {
  const sh = await shellOn(Object.assign({ env: { ETIUDA_SIGNIN_PREVIEW: v } }, o));
  try {
    const h = await sh.ask("studio:host"), l = await sh.ask("studio:licence");
    return JSON.stringify([h.signIn, !!h.signinPreview, l.signIn, !!l.signinPreview]);
  } finally { sh.done(); }
}

/* ---- si48, off by default: absent, or anything but "1", the providers offered and every surface are today's ---------------- */
await leg("si48", async () => {
  const shell = {};
  const bareTree = treeWithIds("tree-bare-si48", "", "");
  for (const [name, v] of [["absent", null], ["zero", "0"], ["word", "yes"], ["spaced", " 1"], ["on", "1"]]) shell[name] = await previewAsked(v, { root: bareTree.tree });
  const today = '[[],false,[],false]';
  /* The page with providers configured and no preview: the door, the rail's foot, Account and a paid act, none carrying the line. */
  const fresh = await studio(HELD0);
  const door = fresh.main();
  fresh.P.S.screen = "project";
  fresh.P.S.open = { dir: TEAM_DIR, project: { rev: 0 }, draft: { langs: [], cards: [] }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 }, editions: [], langs: { rows: [] } };
  fresh.P.paint();
  const rail = fresh.rail(), acct = fresh.sx();
  const bare = await studio(Object.assign({}, HELD0, { signIn: [] }), { host: { signIn: [] } });
  const off = door + rail + acct + bare.main() + bare.rail() + bare.sx();
  const on = await studio(HELD0, { host: PREVIEW_HOST });
  const parts = {
    shellOff: bareTree.planted && ["absent", "zero", "word", "spaced"].every((k) => shell[k] === today),
    shellOnDiffers: shell.on === '[["microsoft","google"],true,["microsoft","google"],true]',
    pageOff: !/data-signin-preview/.test(off) && plainText(off).indexOf(PREVIEW_LINE) < 0 && /data-signin-door/.test(door) && /data-signin-foot/.test(rail)
      && /data-signin-account/.test(acct),
    pageOnDiffers: /data-signin-preview/.test(on.main()),
  };
  check(Object.values(parts).every(Boolean),
    "si48 the preview is off by default: with ETIUDA_SIGNIN_PREVIEW absent, \"0\", \"yes\" or \" 1\" the shell offers what it offers today and every"
    + " surface is drawn without the preview's line; \"1\" alone turns it on: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(shell));
});

/* ---- si49, inert with real ids: a tree whose Microsoft entry has a client id, the variable set, offers that one and no preview -- */
await leg("si49", async () => {
  const { tree, planted: once } = treeWithIds("tree-with-id", MS.clientId, "");
  const { tree: bothTree, planted: bothOnce } = treeWithIds("tree-with-both-si49", MS.clientId, GG.clientId);
  const shipped = await previewAsked("1");
  const both = await previewAsked("1", { root: bothTree });
  let host = null, lic = null, pressed = null;
  asked.length = 0;
  const sh = await shellOn({ root: tree, env: { ETIUDA_SIGNIN_PREVIEW: "1" } });
  try {
    host = await sh.ask("studio:host");
    lic = await sh.ask("studio:licence");
    pressed = await sh.ask("studio:licence-signin", "google");
  } finally { sh.done(); }
  const EMPTY = [Object.assign({}, MS, { clientId: "" }), Object.assign({}, GG, { clientId: "" })];
  const pure = [C.signInPreview(true, LIST), C.signInPreview(true, [MS, EMPTY[1]]), C.signInPreview(true, EMPTY), C.signInPreview(false, EMPTY), C.signInPreview("1", EMPTY)];
  const parts = {
    planted: once && bothOnce,
    shipped: shipped === '[["microsoft","google"],true,["microsoft","google"],true]',
    both: both === '[["microsoft","google"],false,["microsoft","google"],false]',
    host: !!host && JSON.stringify(host.signIn) === '["microsoft"]' && !host.signinPreview,
    licence: !!lic && JSON.stringify(lic.signIn) === '["microsoft"]' && !lic.signinPreview,
    press: !!pressed && !!pressed.said && pressed.said.why !== "signin-preview" && pressed.said.frame === "That sign-in provider is not offered by this Studio, so nothing was changed."
      && asked.length === 0,
    pure: JSON.stringify(pure) === "[false,false,true,false,false]",
  };
  check(Object.values(parts).every(Boolean),
    "si49 the switch is inert where a provider has a client id: the tree as shipped, started with ETIUDA_SIGNIN_PREVIEW=1, offers the preview; a tree with"
    + " both client ids, started with ETIUDA_SIGNIN_PREVIEW=1, offers both and no preview; a tree whose Microsoft entry alone carries one, started with ETIUDA_SIGNIN_PREVIEW=1, offers"
    + " Microsoft alone with no preview, and a press of Google is refused as not offered, nothing sent; signInPreview stands only when asked and none is"
    + " configured: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify({ pure, host: host && host.signIn, said: pressed && pressed.said }));
});

/* ---- si50, nothing reaches out: in the preview a press opens no browser, starts no loopback, sends nothing and writes nothing -- */
await leg("si50", async () => {
  const listFiles = (dir) => {
    const out = {};
    const walk = (d) => { for (const n of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name);
      if (n.isDirectory()) walk(p); else { const st = fs.statSync(p); out[path.relative(dir, p)] = st.size + ":" + st.mtimeMs; }
    } };
    walk(dir);
    return JSON.stringify(out);
  };
  const realListen = wire.identityListen;
  let listens = 0, host = null, before = "", after = "", door = null, stop = null, again = null;
  const presses = [];
  const bareTree = treeWithIds("tree-bare-si50", "", "");
  const sh = await shellOn({ root: bareTree.tree, env: { ETIUDA_SIGNIN_PREVIEW: "1" } });
  wire.identityListen = (...a) => { listens++; return realListen(...a); };
  asked.length = 0; runtimeFetches = 0;
  try {
    host = await sh.ask("studio:host");
    await sh.ask("studio:licence");
    before = listFiles(sh.ud);
    for (const id of ["microsoft", "google"]) presses.push(await sh.ask("studio:licence-signin", id));
    door = await sh.ask("studio:signin-door");
    stop = await sh.ask("studio:licence-signin-stop");
    again = await sh.ask("studio:licence-signin-again");
    after = listFiles(sh.ud);
  } finally { wire.identityListen = realListen; sh.done(); }
  const parts = {
    offered: !!host && JSON.stringify(host.signIn) === '["microsoft","google"]' && host.signinPreview === true,
    refused: presses.length === 2 && presses.every((p) => p && p.said && p.said.why === "signin-preview" && p.said.frame === PREVIEW_PRESSED),
    noBrowser: sh.opened.length === 0 && !!again && again.opened === false,
    noLoopback: listens === 0 && !!stop && stop.stopped === false,
    nothingSent: asked.length === 0 && runtimeFetches === 0,
    nothingWritten: before !== "" && before === after && !!door && door.closed === true,
  };
  check(Object.values(parts).every(Boolean),
    "si50 in the preview a press of either provider is answered that sign-in is not set up yet, with no browser opened, no loopback started, no request"
    + " sent and no file written in Studio's folder, Not now included: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ")
    + " " + JSON.stringify({ said: presses.map((p) => p && p.said), listens, asked: asked.length, opened: sh.opened.length }));
});

/* ---- si51, visibly a preview: the line in the screen itself on every sign-in surface drawn, and the press's line in its place -- */
await leg("si51", async () => {
  const has = (h) => /data-signin-preview/.test(h) && plainText(h).indexOf(PREVIEW_LINE) >= 0;
  const d = await studio(HELD0, { host: PREVIEW_HOST, api: { licenceSignIn: () => Promise.resolve(JSON.parse(JSON.stringify(PREVIEW_REFUSAL))) } });
  const door = d.main();
  await d.press("lic-signin", { "data-v": "google" });
  const pressed = d.main();
  const head = (/<h2 data-signin-fact>([^<]*)<\/h2>/.exec(pressed) || [])[1] || "";
  const a = await studio(HELD0, { host: Object.assign({ signinDoor: true }, PREVIEW_HOST), api: { licenceSignIn: () => Promise.resolve(JSON.parse(JSON.stringify(PREVIEW_REFUSAL))) } });
  const acct = a.sx();
  await a.press("lic-signin", { "data-v": "microsoft" });
  const acctPressed = a.sx();
  const tm = await teamOn(UNSIGNED, { host: PREVIEW_HOST });
  tm.P.S.screen = "project"; tm.P.paint();
  const teamRail = tm.rail();
  const pl = await studio(HELD0, { lang: "pl", host: PREVIEW_HOST, api: { licenceSignIn: () => Promise.resolve(JSON.parse(JSON.stringify(PREVIEW_REFUSAL))) } });
  const plDoor = plainText(pl.main());
  await pl.press("lic-signin", { "data-v": "microsoft" });
  const plHead = plainText((/<h2 data-signin-fact>([^<]*)<\/h2>/.exec(pl.main()) || [])[1] || "").trim();
  const parts = {
    door: has(door) && !/data-signin-preview/.test(pressed),
    pressed: plainText(head).trim() === PREVIEW_PRESSED && plainText(pressed).indexOf("The sign-in did not finish") < 0,
    rail: has(teamRail),
    account: has(acct) && !/data-signin-preview/.test(acctPressed) && /<b data-signin-fact>Sign-in is not set up yet, so nothing was sent\. This is a preview\.<\/b>/.test(acctPressed),
    polish: plDoor.indexOf(PREVIEW_LINE_PL) >= 0 && plHead === PREVIEW_PRESSED_PL && plDoor.indexOf(PREVIEW_LINE) < 0,
  };
  check(Object.values(parts).every(Boolean),
    "si51 the preview is visibly a preview: its line stands in the screen itself on the door, the rail's foot, Account and each paid act's sentence, and a"
    + " press shows the line that nothing was sent as the place's heading; Polish too: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ")
    + " " + JSON.stringify({ head, plHead }));
});

/* ---- si52, not shipped: the double-click is outside the packaged files, and starts the installed Studio with the variable alone -- */
await leg("si52", async () => {
  const { minimatch } = require("minimatch");
  const cfgAt = path.join(ROOT, "electron-builder.js");
  delete require.cache[cfgAt];
  const cfg = require(cfgAt);
  /* electron-builder's files: in order, a pattern including and a "!" pattern excluding what it matches. */
  const shipped = (p) => { let inc = false; for (const pat of cfg.files) { const neg = pat.startsWith("!"); if (minimatch(p, neg ? pat.slice(1) : pat, { dot: true })) inc = !neg; } return inc; };
  const cmdAt = path.join(ROOT, "tools", "signin-preview.cmd");
  const text = fs.existsSync(cmdAt) ? fs.readFileSync(cmdAt, "utf8") : "";
  /* Read, never run: run, it would start the installed Studio. Its statements in this order, the variable set once and only for
     the process it starts (no setx, no registry), and one start. */
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^rem\b/i.test(l) && l !== "@echo off");
  const ORDER = ["setlocal", 'set "EXE=%LOCALAPPDATA%\\Programs\\Etiuda Studio\\Etiuda Studio.exe"',
    'if not exist "%EXE%" set "EXE=%ProgramFiles%\\Etiuda Studio\\Etiuda Studio.exe"', 'if not exist "%EXE%" exit /b 1',
    'if /i "%~1"=="--where" exit /b 0', 'set "ETIUDA_SIGNIN_PREVIEW=1"', 'start "" "%EXE%"', "endlocal"];
  const at = ORDER.map((s) => lines.indexOf(s));
  const parts = {
    exists: !!text,
    notShipped: !shipped("tools/signin-preview.cmd"),
    matcherHasTeeth: shipped("src/licence-client.mjs") && shipped("ui/app.js") && shipped("shell/main.js") && !shipped("engine/pinned/shell/main.js") && !shipped("tools/package.mjs"),
    order: at.every((i, k) => i >= 0 && (k === 0 || i > at[k - 1])),
    oneStart: lines.filter((l) => /(^|[&|(]\s*)start\s/i.test(l)).length === 1 && lines.filter((l) => /ETIUDA_SIGNIN_PREVIEW/.test(l)).length === 1
      && !lines.some((l) => /\b(setx|reg)\b/i.test(l)),
  };
  check(Object.values(parts).every(Boolean),
    "si52 tools/signin-preview.cmd is outside electron-builder's files (the matcher includes src, ui and the shell and excludes what the list excludes),"
    + " starts the installed Studio, per-user first, then all-users, and sets ETIUDA_SIGNIN_PREVIEW=1 for that start alone: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(at));
});

/* ---- si53, the preview's line as the product designer placed it (her edits to the built screens, 2026-11-12) -------------- */
await leg("si53", async () => {
  const LINE = /<p class="si-cap si-preview" data-signin-preview><b>Preview only\.<\/b> <span>Sign-in is not set up yet, so nothing here is sent\.<\/span><\/p>/;
  const d = await studio(HELD0, { host: PREVIEW_HOST, api: { licenceSignIn: () => Promise.resolve(JSON.parse(JSON.stringify(PREVIEW_REFUSAL))) } });
  const door = d.main();
  await d.press("lic-signin", { "data-v": "google" });
  const pressed = d.main();
  const a = await studio(HELD0, { host: Object.assign({ signinDoor: true }, PREVIEW_HOST) });
  const acct = a.sx();
  const pl = await studio(HELD0, { lang: "pl", host: PREVIEW_HOST });
  const left = (h) => { const m = /<div class="l">([\s\S]*?)<div class="r">/.exec(h); return m ? m[1] : null; };
  const right = (h) => { const at = h.indexOf('<div class="r">'); return at < 0 ? "" : h.slice(at); };
  const r = right(door), pr = right(pressed);
  const css = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8").replace(/\s+/g, " ");
  const has = (rule) => css.indexOf(rule) >= 0;
  const parts = {
    form: LINE.test(door) && LINE.test(acct)
      && /<b>Tylko podgląd\.<\/b> <span>Logowanie nie jest jeszcze uruchomione, więc nic stąd nie zostanie wysłane\.<\/span>/.test(pl.main()),
    leftEmpty: left(door) !== null && !/data-signin-preview/.test(left(door)) && left(pressed) !== null && !/data-signin-preview/.test(left(pressed)),
    rightOrder: /<p class="lede">[^<]*<\/p><p class="si-cap si-preview" data-signin-preview>[\s\S]*?<\/p><p class="si-cap">Microsoft: /.test(r)
      && r.indexOf("data-signin-preview") < r.indexOf('class="si-provs'),
    pressedAlone: /<h2 data-signin-fact>[^<]*<\/h2><div class="si-acts"/.test(pr) && !/data-signin-preview/.test(pr),
    acctBeforeButtons: /<div><p class="si-cap si-preview" data-signin-preview>[\s\S]*?<\/p><div class="si-provs row">/.test(acct),
    look: has(".si-cap.si-preview b{color:var(--ink);font-weight:600}") && !/\.si-cap\.si-preview\{[^}]*font-weight:600/.test(css),
    doorSpace: has("#main .si-door .r .lede + .si-cap.si-preview{margin:12px 0 10px}") && has("#main .si-door .r .si-preview + .si-cap{margin:0 0 10px}"),
    acctMeasure: has(".sx-row.si-top .si-preview{max-width:none;margin:10px 0 10px}"),
  };
  check(Object.values(parts).every(Boolean),
    "si53 the preview's line is one line in the caption's size, \"Preview only.\" in the ink at 600 and the rest at the caption's own weight; on the door it"
    + " stands in the right panel between its line and the providers' caption (under the heading after a press), 12 px above and 10 px below, nothing in"
    + " the left column; in Account before the buttons at the card's full measure, 10 px below: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si54, the Team screen's panes stand one above the other to 2008, 2062 or 2116px where the corner's discs take 186, 240 or 294px ------- */
await leg("si54", async () => {
  const css = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8").replace(/\s+/g, " ");
  /* The gutter is --disc-room: 186, 240 or 294px with three, four or five discs (Import, Publish and New card always stand; Review and the
     backup disc come and go), against the 78px of the one disc the two-pane split at 1900px was measured with: it needs 108, 162 or 216px
     more window, so the panes stay stacked to 2008, 2062 or 2116px. */
  const stacked = css.indexOf("@media (min-width:1900px) and (max-width:2007.98px){ body:is([data-discs=\"3\"],[data-discs=\"4\"],[data-discs=\"5\"]) .cols.team-cols{grid-template-columns:minmax(0,1fr)} }") >= 0
    && css.indexOf("@media (min-width:1900px) and (max-width:2061.98px){ body:is([data-discs=\"4\"],[data-discs=\"5\"]) .cols.team-cols{grid-template-columns:minmax(0,1fr)} }") >= 0
    && css.indexOf("@media (min-width:1900px) and (max-width:2115.98px){ body[data-discs=\"5\"] .cols.team-cols{grid-template-columns:minmax(0,1fr)} }") >= 0;
  const rooms = ["3", "4", "5"].map((n) => { const m = new RegExp('body\\[data-discs="' + n + '"\\]\\{--disc-room:(\\d+)px\\}').exec(css); return m ? Number(m[1]) : NaN; });
  const enough = [2008, 2062, 2116].every((w, i) => 1900 + (rooms[i] - 78) <= w);
  check(stacked && enough, "si54 with three, four or five corner discs the Team screen's panes stand one above the other below 2008, 2062 and 2116px, the 1900px split"
    + " being measured with one disc's 78px: stacked=" + stacked + " rooms=" + JSON.stringify(rooms) + " enough=" + enough);
});

/* ---- si55, the preview's press: its heading says it once, its way on is Back, and nothing stopped (the designer's second shots) -- */
await leg("si55", async () => {
  const press = async (lang, host) => {
    const s = await studio(HELD0, { lang, host: Object.assign({}, PREVIEW_HOST, host || {}), api: { licenceSignIn: () => Promise.resolve(JSON.parse(JSON.stringify(PREVIEW_REFUSAL))) } });
    await s.press("lic-signin", { "data-v": "microsoft" });
    return s;
  };
  const d = await press("en"), door = d.main();
  const left = (/<div class="l">([\s\S]*?)<div class="r">/.exec(door) || [])[1] || "";
  const right = door.slice(Math.max(0, door.indexOf('<div class="r">')));
  await d.press("door-open");
  const back = d.main();
  const a = await studio(HELD0, { lang: "en", host: Object.assign({ signinDoor: true }, PREVIEW_HOST), api: { licenceSignIn: () => Promise.resolve(JSON.parse(JSON.stringify(PREVIEW_REFUSAL))) } });
  a.sx();
  await a.press("lic-signin", { "data-v": "microsoft" });
  const acct = a.sx();
  const pl = await press("pl"), plMain = pl.main(), plRight = plMain.slice(Math.max(0, plMain.indexOf('<div class="r">')));
  const parts = {
    once: !/data-signin-preview/.test(door) && plainText(door).split("This is a preview.").length === 2,
    back: /<div class="si-acts" style="margin-top:0"><button class="btn sm" data-act="door-open">Back<\/button><\/div>/.test(right) && !/Try again|class="btn sm solid"/.test(right),
    backToChoice: /data-act="lic-signin" data-v="google"/.test(back) && !/data-signin-fact/.test(back) && /data-signin-preview/.test(back),
    nothingStopped: /<p class="si-h">What happens<\/p>/.test(left) && !/class="(stop|done|now)"/.test(left) && !/Where it stopped/.test(left),
    acctOnce: !/data-signin-preview/.test(acct) && !/si-dot/.test(acct) && /<b data-signin-fact>Sign-in is not set up yet, so nothing was sent\. This is a preview\.<\/b>/.test(acct),
    polish: /data-act="door-open">Wstecz<\/button>/.test(plRight),
  };
  check(Object.values(parts).every(Boolean), "si55 the preview's press says it once, in its heading, with no preview line under it, on the door and in Account; its one act is"
    + " an ordinary Back to the providers; the left column stays What happens with plain numbers and Account draws no amber dot, since nothing stopped: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si60 to si66: Google's client secret (board 980, port of desk's ds13) ------------------------------------------- */
const STAND_IN = "stand-in-not-a-secret";
const SECRET_VAR = "ETIUDA_GOOGLE_CLIENT_SECRET";
const formOf = (buf) => new URLSearchParams(buf.toString());

/* si60: The tree holds no secret: the provider table's clientSecret is "" and a configured table offers none */
await leg("si60", async () => {
  const providers = C.SIGN_IN_PROVIDERS || [];
  const ids = providers.map((p) => p.id);
  const tableEmpty = ids.length === 2 && providers.every((p) => Object.prototype.hasOwnProperty.call(p, "clientSecret") && p.clientSecret === "");
  const offered = C.signInProviders(LIST);
  const offeredEmpty = offered.length === 2 && offered.every((p) => p.clientSecret === "");
  check(tableEmpty && offeredEmpty,
    "si60 the tree holds no client secret: every provider's clientSecret is \"\" and a configured table offers none: "
    + JSON.stringify({ tableEmpty, offeredEmpty, providers: providers.map((p) => ({ id: p.id, secret: p.clientSecret })) }));
});

/* si61: Sent only when present: code exchange and refresh carry client_secret with stand-in set, and not without.
   THE STAND-IN LOOPBACK ANSWERS WHEN THE BROWSER HAS BEEN SENT, as si63's does: `caught` settles with the reply the stand-in browser
   made in openPage. It once settled on a 5 ms timer started at listen, which raced signInFlow's work between listen and openPage; under
   load the timer won and the flow saw no code (flowOk=false askedHasSecret=false, 2026-11-22). laggedOk holds it with the browser late. */
await leg("si61", async () => {
  const pending = { redirect: "http://127.0.0.1:50000", verifier: "v".repeat(43) };
  const G_SECRET = Object.assign({}, GG, { clientSecret: STAND_IN });
  const code = formOf(C.codeForm(G_SECRET, pending, "c1")), refresh = formOf(C.refreshForm(G_SECRET, "rt"));
  const plainCode = C.codeForm(GG, pending, "c1").toString(), plainRefresh = C.refreshForm(GG, "rt").toString();
  const emptyCode = C.codeForm(Object.assign({}, GG, { clientSecret: "" }), pending, "c1").toString();
  const wantCode = new URLSearchParams({ client_id: GG.clientId, grant_type: "authorization_code", code: "c1",
    redirect_uri: pending.redirect, code_verifier: pending.verifier }).toString();
  const wantRefresh = new URLSearchParams(Object.assign({ client_id: GG.clientId, grant_type: "refresh_token", refresh_token: "rt" },
    GG.refreshScope ? { scope: GG.refreshScope } : {})).toString();

  const offered = C.signInProviders(LIST, { google: STAND_IN, microsoft: STAND_IN });
  const byTable = C.signInProviders([Object.assign({}, GG, { clientSecret: STAND_IN + "-table" })], { google: STAND_IN });

  /* `lag` delays the stand-in browser by that many ms, standing in for a loaded machine between listen and openPage (si63's
     lesson of 2026-11-13): the flow must come back the same whatever the lag. */
  const flow = async (lag) => {
    let asked = null, authorizeUrl = "", reply = null;
    const io = {
      openPage: async (url) => {
        if (lag) await new Promise((r) => setTimeout(r, lag));
        authorizeUrl = url;
        const q = new URL(url).searchParams;
        io.loopQ = "?state=" + encodeURIComponent(q.get("state")) + "&code=abc";
        if (reply) reply(io.loopQ);
        return true;
      },
      tokenAsk: async (url, form) => {
        asked = formOf(form);
        return { status: 200, bytes: Buffer.from(JSON.stringify({ id_token: jwt({ iss: GG.issuer, aud: GG.clientId, exp: Math.floor(NOW / 1000) + 3600, nonce: io.nonce }) })) };
      },
      listen: async () => {
        const caught = new Promise((a) => { reply = a; });
        return { port: 49999, caught, close: () => {} };
      },
      ask: async () => ({ status: 200, bytes: Buffer.from(JSON.stringify({ ok: true })) }),
      seal: () => "",
      page: () => "",
      rand: (n) => Buffer.alloc(n, 1),
    };
    const pendingReq = await C.authorizeRequest(offered.find((p) => p.id === "google"), 49999, open.public, io.rand);
    io.nonce = pendingReq.nonce;
    const got = await C.signInFlow(io, offered.find((p) => p.id === "google"), open, () => NOW);
    return { got, asked, authorizeUrl };
  };
  const { got, asked, authorizeUrl } = await flow(0);
  const lagged = await flow(30);

  const parts = {
    codeHasSecret: code.get("client_secret") === STAND_IN,
    refreshHasSecret: refresh.get("client_secret") === STAND_IN,
    codeVerifier: code.get("code_verifier") === pending.verifier,
    plainCodeMatch: plainCode === wantCode,
    plainRefreshMatch: plainRefresh === wantRefresh,
    emptyCodeMatch: emptyCode === wantCode,
    googleGetsSecret: offered.find((p) => p.id === "google").clientSecret === STAND_IN,
    msNoSecret: offered.find((p) => p.id === "microsoft").clientSecret === "",
    byTableWins: byTable[0].clientSecret === STAND_IN + "-table",
    flowOk: got.answer && got.answer.ok === true,
    askedHasSecret: !!asked && asked.get("client_secret") === STAND_IN,
    authorizeNoSecret: authorizeUrl.indexOf(STAND_IN) < 0,
    laggedOk: !!lagged.got.answer && lagged.got.answer.ok === true && !!lagged.asked && lagged.asked.get("client_secret") === STAND_IN,
  };
  check(Object.values(parts).every(Boolean),
    "si61 client_secret goes with Google's code exchange and refresh only where a secret is present, and without one every byte is as before: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* si62: Package file read: {format: 1, google} gives Google's secret; anything else gives none */
await leg("si62", async () => {
  if (typeof C.signinSecretRead !== "function") {
    check(false, "si62 C.signinSecretRead is not a function");
    return;
  }
  const r = (t) => C.signinSecretRead(t);
  const ok = r(JSON.stringify({ format: 1, google: STAND_IN }));
  const spaced = "has a space", short = "short";
  const parts = {
    file: C.SIGNIN_SECRET_FILE === "signin-secret.json",
    okGoogle: ok.google === STAND_IN,
    okKeys: Object.keys(ok).join() === "google",
    noSpaced: Object.keys(r(JSON.stringify({ format: 1, google: spaced }))).length === 0,
    noShort: Object.keys(r(JSON.stringify({ format: 1, google: short }))).length === 0,
    noFmt2: Object.keys(r(JSON.stringify({ format: 2, google: STAND_IN }))).length === 0,
    noMs: Object.keys(r(JSON.stringify({ format: 1, microsoft: STAND_IN }))).length === 0,
    noEmpty: Object.keys(r("")).length === 0,
    noGarbage: Object.keys(r("not json")).length === 0,
    noArray: Object.keys(r("[]")).length === 0,
    shippedNoSecret: C.SIGN_IN_PROVIDERS.length === 2 && C.SIGN_IN_PROVIDERS.every((p) => p.clientSecret === "") && C.signInProviders().length === 0,
    defaultNoSecret: C.signInProviders(LIST).find((p) => p.id === "google").clientSecret === "",
  };
  check(Object.values(parts).every(Boolean),
    "si62 the package's signin-secret.json gives Google's secret where it is {format: 1, google} of a secret's shape, and nothing else: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* si63: Never logged: stand-in secret in token forms and in no log, report, service body or outcome.
   THE STAND-IN LOOPBACK ANSWERS WHEN THE BROWSER HAS BEEN SENT, as a real one does: its `caught` settles with the reply the stand-in
   browser made in openPage. It once settled on a 5 ms timer started at listen, which raced signInFlow's own work between listen and
   openPage (authorizeRequest's keys and signature): on a loaded machine the timer won, the reply was empty, and the flow ended with
   no token form, so si63 went red at random (2 of 6 runs on the fold's tree, 2026-11-13). si63p plants that lag and holds both
   shapes: the timer's red every time, this one green. `lag` delays the stand-in browser by that many ms; `shape` "timer" is the
   old stand-in, kept only for si63p. */
async function si63Run(shape, lag) {
  const said = [], saved = {};
  for (const m of ["log", "error", "warn", "info", "debug"]) {
    saved[m] = console[m];
    console[m] = (...a) => { said.push(a.map(String).join(" ")); };
  }
  const forms = [], posted = [], urls = [];
  let first = null, renewed = null;
  const G_SECRET = Object.assign({}, GG, { clientSecret: STAND_IN });
  try {
    let reply = null;
    const io = {
      listen: async () => {
        let yes; const caught = new Promise((a) => { yes = a; });
        if (shape === "timer") setTimeout(() => yes(io.loopQ), 5);
        else reply = yes;
        return { port: 49998, caught, close: () => {} };
      },
      openPage: async (url) => {
        if (lag) await new Promise((r) => setTimeout(r, lag));
        const q = new URL(url).searchParams;
        io.loopQ = "?state=" + encodeURIComponent(q.get("state")) + "&code=abc";
        io.nonce = q.get("nonce");
        if (reply) reply(io.loopQ);
        return true;
      },
      tokenAsk: async (url, form) => {
        urls.push(url);
        forms.push(form.toString());
        return { status: 200, bytes: Buffer.from(JSON.stringify({ id_token: jwt({ iss: GG.issuer, aud: GG.clientId, exp: Math.floor(NOW / 1000) + 3600, nonce: io.nonce }), refresh_token: "rt-1" })) };
      },
      ask: async (route, bytes) => {
        posted.push(bytes.toString("utf8"));
        return { status: 200, bytes: Buffer.from(JSON.stringify({ ok: true })) };
      },
      seal: (t) => t ? "SEALED:" + t : "",
      unseal: (x) => String(x || "").replace(/^SEALED:/, ""),
      page: () => "",
      rand: (n) => Buffer.alloc(n, 2),
    };
    first = await C.signInFlow(io, G_SECRET, open, () => NOW);
    io.nonce = undefined;
    renewed = await C.renewSignIn(io, G_SECRET, open, "SEALED:rt-1", () => NOW);
  } finally {
    for (const m of Object.keys(saved)) console[m] = saved[m];
  }
  const bodies = posted.map((b) => Object.keys(JSON.parse(b)).sort().join());
  const prints = (fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8")
    + fs.readFileSync(path.join(ROOT, "src", "licence-client.mjs"), "utf8")).split("\n")
    .filter((l) => /console\.(log|error|warn|info|debug)\(/.test(l));
  const parts = {
    formsLength: forms.length === 2,
    formsHaveSecret: forms.length === 2 && forms.every((f) => formOf(f).get("client_secret") === STAND_IN),
    urlsGoogleToken: urls.every((u) => u === "https://oauth2.googleapis.com/token"),
    postedLength: posted.length === 2,
    serviceBodiesUnchanged: bodies.join("|") === "idToken,lead,provider,seed,sig,t|idToken,lead,provider,sig,t",
    firstOk: first && first.answer && first.answer.ok === true,
    renewedOk: renewed && renewed.answer && renewed.answer.ok === true,
    printsClean: !prints.some((l) => /client_secret|clientSecret|signinPacked/i.test(l)),
    secretNotLeaked: [said.join("\n"), posted.join("\n"), JSON.stringify(first), JSON.stringify(renewed)].every((t) => t.indexOf(STAND_IN) < 0),
  };
  return parts;
}
await leg("si63", async () => {
  const parts = await si63Run("reply", 0);
  check(Object.values(parts).every(Boolean),
    "si63 the stand-in secret is in the token forms and in no printed line, no licence service body (whose names are unchanged), no kept file, no outcome: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* si63p, the plant on si63's race: the stand-in browser 30 ms late, as a loaded machine makes it. The old timer stand-in loses the
   race every time (no token form), and si63's own stand-in, which settles on the reply, still passes. */
await leg("si63p", async () => {
  const timer = await si63Run("timer", 30), replyShape = await si63Run("reply", 30);
  const parts = { timerRed: timer.formsLength === false && timer.firstOk !== true, replyGreen: Object.values(replyShape).every(Boolean) };
  check(Object.values(parts).every(Boolean),
    "si63p a 30 ms lag before the stand-in browser's reply turns the old 5 ms timer stand-in red and leaves si63's reply-settled stand-in green: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* si64: The shell reads the package's file once at start, installed, beside the asar, and from no variable, IPC or page */
await leg("si64", async () => {
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const reads = mainText.split("\n").filter((l) => /SIGNIN_SECRET_FILE/.test(l) && /readFileSync/.test(l));
  const parts = {
    readsOnce: reads.length === 1,
    pattern: reads.length === 1 && /^if \((?:PACKAGED|INSTALLED)\) \{ try \{ signinPacked = signinSecretRead\(fs\.readFileSync\(path\.join\(String\(process\.resourcesPath \|\| ""\), SIGNIN_SECRET_FILE\), "utf8"\)\); \}/.test(reads[0].trim()),
    /* A development tree's one other assignment, from ETIUDA_GOOGLE_CLIENT_SECRET in the else of the packaged read, is
       tests/signin-lab.mjs sl6's (the sign-in lab seam, 2026-11-12); installed, only the file's. */
    assignOnce: (mainText.replace(/^else \{ const lab = require\(path\.join\(ROOT, "src", "signin-lab\.cjs"\)\); const g = lab\.devGoogleSecret\([^\n]*\n/m, "")
      .match(/(?<!let )signinPacked = /g) || []).length === 1,
    noEnvRead: !new RegExp("process\\.env\\b[^\\n]*" + SECRET_VAR).test(mainText),
    noIpc: !/ipcMain\.(on|handle)\([^\n]*secret/i.test(mainText),
  };
  check(Object.values(parts).every(Boolean),
    "si64 the shell reads the package's file once at start, installed, beside the asar, and from no variable, IPC or page: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " reads=" + reads.length);
});

/* si65: The package step: writes nothing and says absent without the variable, writes the file and says present with it, never the value; the file is git-ignored and copied only when set */
await leg("si65", async () => {
  let STEP = null;
  try { STEP = require(path.join(ROOT, "tools", "signin-secret.cjs")); } catch { STEP = null; }
  if (!STEP) {
    check(false, "si65 tools/signin-secret.cjs could not be loaded");
    return;
  }
  const lab = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-signin-secret-"));
  try {
    const out = path.join(lab, "dist"), at = STEP.signinSecretAt(out);
    const absent = STEP.signinSecretStep({}, out);
    const wroteNothing = !fs.existsSync(at) && !fs.existsSync(path.dirname(at));
    const present = STEP.signinSecretStep({ [SECRET_VAR]: STAND_IN }, out);
    const text = fs.existsSync(at) ? fs.readFileSync(at, "utf8") : "";
    let readBack = "";
    try { readBack = JSON.parse(text).google; } catch {}
    const stale = STEP.signinSecretStep({ [SECRET_VAR]: "" }, out);
    const spaced = "has a space";
    let refused = "";
    try { STEP.signinSecretStep({ [SECRET_VAR]: spaced }, out); } catch (e) { refused = String(e && e.message); }
    const res = path.join(lab, "resources");
    fs.mkdirSync(res);
    const sumAbsent = STEP.signinSecretSummary(res);
    fs.writeFileSync(path.join(res, STEP.SIGNIN_SECRET_FILE), text);
    const sumPresent = STEP.signinSecretSummary(res);

    const cfgWith = (v) => {
      const env = Object.assign({}, process.env, { ETIUDA_STUDIO_DIST: out });
      delete env[SECRET_VAR];
      if (v !== null) env[SECRET_VAR] = v;
      const r = spawnSync(process.execPath, ["-e", "const c = require(\"./electron-builder.js\"); process.stdout.write(JSON.stringify([c.win.extraResources, c.linux.extraResources]))"],
        { cwd: ROOT, env, encoding: "utf8" });
      try { return JSON.parse(r.stdout); } catch { return null; }
    };
    const off = cfgWith(null), on = cfgWith(STAND_IN);
    const entry = { from: at, to: STEP.SIGNIN_SECRET_FILE };
    const J = JSON.stringify;
    const ignored = (p) => spawnSync("git", ["check-ignore", "-q", p], { cwd: ROOT }).status === 0;

    const parts = {
      varName: STEP.SIGNIN_SECRET_VAR === SECRET_VAR,
      fileName: STEP.SIGNIN_SECRET_FILE === "signin-secret.json",
      absentStep: absent === "Google sign-in secret: absent",
      wroteNothing,
      presentStep: present === "Google sign-in secret: present",
      readBack: readBack === STAND_IN,
      staleStep: stale === "Google sign-in secret: absent" && !fs.existsSync(at),
      badShapeRefused: !!refused && refused.indexOf(spaced) < 0 && !fs.existsSync(at),
      summaryAbsent: sumAbsent === "Google sign-in secret: absent",
      summaryPresent: sumPresent === "Google sign-in secret: present",
      winMatches: !!off && !!on && J(on[0]) === J(off[0].concat([entry])),
      linuxMatches: !!off && !!on && J(on[1]) === J(off[1].concat([entry])),
      offClean: !J(off).includes(STEP.SIGNIN_SECRET_FILE),
      onClean: !J(on).includes(STAND_IN),
      fileIgnored: ignored("dist/.signin/" + STEP.SIGNIN_SECRET_FILE) || ignored(".signin/" + STEP.SIGNIN_SECRET_FILE),
      toolNotIgnored: !ignored("tools/signin-secret.cjs"),
    };
    check(Object.values(parts).every(Boolean),
      "si65 the package step writes nothing and says absent without the variable, writes the file and says present with it, never the value; the file is git-ignored and copied only when set: "
      + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
  } finally {
    fs.rmSync(lab, { recursive: true, force: true });
  }
});

/* si66: No tracked file carries a client secret's prefix or a client secret written as a value */
await leg("si66", async () => {
  const ls = spawnSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const files = ls.status === 0 ? ls.stdout.split("\0").filter(Boolean) : [];
  const SECRET_SHAPES = [
    new RegExp("GOC" + "SPX-[A-Za-z0-9_-]{8,}"),
    /\b(?:client_secret|clientSecret|ETIUDA_GOOGLE_CLIENT_SECRET)\b["']?\s*[:=]\s*["']([^"'\s]+)["']/g
  ];
  function secretsIn(text) {
    const hits = [];
    if (SECRET_SHAPES[0].test(text)) hits.push("prefix");
    for (const m of text.matchAll(SECRET_SHAPES[1])) {
      if (m[1] !== STAND_IN && m[1] !== "") hits.push("value");
    }
    return hits;
  }
  const found = [];
  for (const f of files) {
    let text = "";
    try { text = fs.readFileSync(path.join(ROOT, f), "latin1"); } catch { continue; }
    if (secretsIn(text).length) found.push(f);
  }
  const q = "\"";
  const controls = [
    ["GOC", "SPX-", "x".repeat(12)].join(""),
    "clientSecret: " + q + "x".repeat(12) + q,
    "client_secret=" + q + "y".repeat(12) + q,
    SECRET_VAR + "=" + q + "z".repeat(12) + q
  ];
  const parts = {
    filesCount: files.length > 100,
    foundNone: found.length === 0,
    controlsFound: controls.every((c) => secretsIn(c).length > 0),
    standInIgnored: secretsIn("clientSecret: " + q + STAND_IN + q).length === 0,
    emptyIgnored: secretsIn("clientSecret: " + q + q).length === 0,
  };
  check(Object.values(parts).every(Boolean),
    "si66 no tracked file carries a client secret's prefix or a client secret written as a value, the search shown to find both: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ")
    + (found.length ? " (found in: " + found.join(", ") + ")" : ""));
});

/* ---- si67 to si71: the sign-in follow-ups (Claude gamma's Ubuntu walk; the product designer's handoff, section 8) ----------- */
const LINK_LINE = "Browser did not open? Paste this link into a browser on this computer.";
const LINK_LINE_PL = "Przeglądarka się nie otworzyła? Łącze można wkleić w przeglądarkę na tym komputerze.";
const LINK_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=c1&state=s1&nonce=n1";
const UNKEPT_LINE = "No keyring is open on this computer, so the sign-in is not kept: each renewal asks for it again.";

/* ---- si67, the shell hands the page that pressed the provider's page as the browser is handed it, and the wait goes on --------- */
await leg("si67", async () => {
  const { tree, planted: once } = treeWithIds("tree-link", MS.clientId, "");
  const sent = [];
  const sender = { isDestroyed: () => false, send: (ch, v) => { sent.push([ch, v]); } };
  const lines = [], keep = {};
  for (const k of ["log", "error", "warn", "info"]) { keep[k] = console[k]; console[k] = (...a) => { lines.push(a.map(String).join(" ")); }; }
  const writes = { o: process.stdout.write, e: process.stderr.write };
  process.stdout.write = (c) => { lines.push(String(c)); return true; };
  process.stderr.write = (c) => { lines.push(String(c)); return true; };
  asked.length = 0; runtimeFetches = 0;
  let settled = false, waited = false, stop = null, ended = null, opened = [];
  const sh = await shellOn({ root: tree, sender });
  try {
    const press = sh.ask("studio:licence-signin", "microsoft");
    press.then(() => { settled = true; }, () => { settled = true; });
    for (let i = 0; i < 100 && !sh.opened.length; i++) await new Promise((r) => setTimeout(r, 20));
    await new Promise((r) => setTimeout(r, 300));
    waited = !settled;
    opened = sh.opened.slice();
    stop = await sh.ask("studio:licence-signin-stop");
    ended = await Promise.race([press, new Promise((r) => setTimeout(() => r("still waiting"), 3000))]);
  } finally {
    sh.done();
    for (const k of Object.keys(keep)) console[k] = keep[k];
    process.stdout.write = writes.o; process.stderr.write = writes.e;
  }
  const url = opened[0] || "", state = url ? new URL(url).searchParams.get("state") : "";
  const wireText = fs.readFileSync(path.join(ROOT, "src", "wire.cjs"), "utf8");
  const parts = {
    planted: once,
    handed: opened.length === 1 && /^https:\/\/login\.microsoftonline\.com\/common\/oauth2\/v2\.0\/authorize\?/.test(url),
    told: JSON.stringify(sent) === JSON.stringify([["studio:signin-link", url]]),
    waits: waited && /const LOOPBACK_WAIT_MS = 300000;/.test(wireText),
    cancel: !!stop && stop.stopped === true && !!ended && typeof ended === "object" && !!ended.said && ended.said.why === "signin-cancelled",
    nothingSent: asked.length === 0 && runtimeFetches === 0,
    neverLogged: !!state && !lines.some((l) => l.indexOf(url) >= 0 || l.indexOf(state) >= 0),
  };
  check(Object.values(parts).every(Boolean),
    "si67 with a browser call that resolves and opens nothing, the page that pressed is handed the provider's page as the browser is (studio:signin-link),"
    + " the loopback still waiting its five minutes; Cancel ends it as cancelled; nothing is asked and no line written carries the link: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify({ sent: sent.map((x) => x[0]), opened: opened.length, ended: ended && ended.said ? ended.said.why : ended }));
});

/* ---- si68, the block in the waiting state on the door and in Account, from the shell's link, and nowhere else ---------------- */
await leg("si68", async () => {
  const pending = () => { let release = null; const p = new Promise((r) => { release = () => r({ error: "cancelled", said: { frame: "x", vars: {}, why: "signin-cancelled" } }); }); return { p, release: () => release() }; };
  const field = '<input class="field si-link-f" readonly spellcheck="false" autocomplete="off" data-act="signin-link-select" aria-label="Paste this link into a browser on this computer." value="'
    + LINK_URL.replace(/&/g, "&amp;") + '"><button class="btn sm si-copy" data-act="signin-link-copy">';
  const w1 = pending();
  const d = await studio(HELD0, { api: { licenceSignIn: () => w1.p } });
  const press = d.press("lic-signin", { "data-v": "microsoft" });
  await tick();
  const before = d.main();
  d.get("signInLinkTook")(LINK_URL);
  const door = d.main();
  await d.press("signin-link-copy");
  w1.release(); await press;
  const after = d.main();
  d.get("signInLinkTook")(LINK_URL);
  const outside = d.main();
  const w2 = pending();
  const a = await studio(HELD0, { host: { signinDoor: true }, api: { licenceSignIn: () => w2.p } });
  a.sx();
  const aPress = a.press("lic-signin", { "data-v": "google" });
  await tick();
  a.get("signInLinkTook")(LINK_URL);
  const acct = a.sx();
  w2.release(); await aPress;
  const pv = await studio(HELD0, { host: PREVIEW_HOST, api: { licenceSignIn: () => Promise.resolve(JSON.parse(JSON.stringify(PREVIEW_REFUSAL))) } });
  await pv.press("lic-signin", { "data-v": "microsoft" });
  pv.get("signInLinkTook")(LINK_URL);
  const pressed = pv.main();
  const w3 = pending();
  const pl = await studio(HELD0, { lang: "pl", api: { licenceSignIn: () => w3.p } });
  const plPress = pl.press("lic-signin", { "data-v": "microsoft" });
  await tick();
  pl.get("signInLinkTook")(LINK_URL);
  const plDoor = plainText(pl.main()).replace(/&amp;/g, "&");
  w3.release(); await plPress;
  const preload = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  const parts = {
    notBefore: /data-signin-door/.test(before) && !/data-signin-link/.test(before),
    door: /data-act="signin-stop">Cancel<\/button><\/div><div class="si-link" data-signin-link>/.test(door) && door.indexOf(field) > 0
      && plainText(door).indexOf(LINK_LINE) >= 0,
    copied: d.calls.indexOf("copy:" + LINK_URL) >= 0,
    leaves: !/data-signin-link/.test(after) && !/data-signin-link/.test(outside),
    account: /data-act="signin-stop">Cancel<\/button><\/span><div class="si-link" data-signin-link>/.test(acct) && acct.indexOf(field) > 0,
    notPressed: !/data-signin-link/.test(pressed),
    polish: plDoor.indexOf(LINK_LINE_PL) >= 0,
    wired: /if \(API\.onSignInLink\) API\.onSignInLink\(signInLinkTook\);/.test(APP) && /onSignInLink: \(fn\) => ipcRenderer\.on\("studio:signin-link"/.test(preload),
  };
  check(Object.values(parts).every(Boolean),
    "si68 the sign-in link stands last in the waiting state, on the door after its acts and in Account after Cancel, from the shell's link; nowhere"
    + " outside a wait or in the preview's pressed state; its Copy copies the link; Polish too: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si69, as the product designer placed it --------------------------------------------------------------------------------- */
await leg("si69", async () => {
  const css = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  const rule = (sel) => { const at = css.indexOf("\n" + sel + "{"); return at < 0 ? "" : css.slice(at + sel.length + 2, css.indexOf("}", at)); };
  const s = await studio(HELD0);
  let selected = 0;
  await s.P.ACTS["signin-link-select"]({ select() { selected++; } });
  const html = s.get("signInLinkHtml")({ link: LINK_URL }), none = s.get("signInLinkHtml")({});
  const parts = {
    form: /^<div class="si-link" data-signin-link><p class="si-cap"><b>Browser did not open\?<\/b> <span>Paste this link into a browser on this computer\.<\/span><\/p><div class="si-link-row"><input [^>]*readonly[^>]*><button/.test(html)
      && none === "",
    line: rule(".si-link .si-cap b") === "color:var(--ink);font-weight:600" && /^margin:0;/.test(rule(".si-link .si-cap")),
    field: /margin-top:6px/.test(rule(".si-link-row")) && /flex:1 1 auto;min-width:0/.test(rule("input.field.si-link-f")) && /white-space:nowrap/.test(rule("input.field.si-link-f"))
      && /font:400 12\.5px var\(--mono\)/.test(rule("input.field.si-link-f")) && /color:var\(--dim\)/.test(rule("input.field.si-link-f")),
    door: rule("#main .si-door .r .si-link") === "margin-top:16px;max-width:460px",
    account: rule(".sx-row.si-top .si-link") === "flex:1 1 100%;margin-top:-2px" && /gap:14px 20px/.test(rule(".sx-row.si-top"))
      && rule(".sx-row.si-top input.field.si-link-f") === "max-width:560px",
    noBox: !/color|background|border|box-shadow/.test(rule(".si-link")) && !/<svg|<img/.test(html.replace(/<button[\s\S]*<\/button>/, "")),
    selects: selected === 1,
  };
  check(Object.values(parts).every(Boolean),
    "si69 the sign-in link as the designer placed it: the line in the preview line's form, the field 6 px under it taking the width left, never wrapping,"
    + " mono at the caption's size; 16 px under the door's acts at 460 px, 12 px under Account's with the field at most 560 px; no box; a click selects all: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si70, Linux's preview launcher: not shipped, and starts the installed Studio with the variable alone ------------------- */
await leg("si70", async () => {
  const { minimatch } = require("minimatch");
  const cfgAt = path.join(ROOT, "electron-builder.js");
  delete require.cache[cfgAt];
  const cfg = require(cfgAt);
  const shipped = (p) => { let inc = false; for (const pat of cfg.files) { const neg = pat.startsWith("!"); if (minimatch(p, neg ? pat.slice(1) : pat, { dot: true })) inc = !neg; } return inc; };
  const at = path.join(ROOT, "tools", "signin-preview.sh"), text = fs.existsSync(at) ? fs.readFileSync(at, "utf8") : "";
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !/^#/.test(l));
  const ORDER = ["set -u", 'if [ "${1:-}" = "--where" ]; then where=1; shift; fi', 'exe="${1:-/opt/Etiuda Studio/etiuda-studio}"', 'if [ ! -x "$exe" ]; then', "exit 1",
    'if [ "$where" = 1 ]; then echo "$exe"; exit 0; fi', "if pgrep -x etiuda-studio >/dev/null 2>&1; then", "exit 1", 'ETIUDA_SIGNIN_PREVIEW=1 exec "$exe"'];
  let from = -1;
  const inOrder = ORDER.every((s) => { const i = lines.indexOf(s, from + 1); if (i < 0) return false; from = i; return true; });
  const parts = {
    exists: !!text && /^#!\/bin\/sh\n/.test(text) && text.indexOf("\r") < 0,
    notShipped: !shipped("tools/signin-preview.sh") && shipped("shell/main.js") && !shipped("tools/package.mjs"),
    order: inOrder && lines[lines.length - 1] === 'ETIUDA_SIGNIN_PREVIEW=1 exec "$exe"',
    oneStart: lines.filter((l) => /\bexec\b/.test(l)).length === 1 && lines.filter((l) => /ETIUDA_SIGNIN_PREVIEW/.test(l)).length === 1
      && !lines.some((l) => /\b(export|setx|reg|gsettings|xdg-open)\b/.test(l)),
  };
  check(Object.values(parts).every(Boolean),
    "si70 tools/signin-preview.sh is outside electron-builder's files, starts the installed .deb's Studio unless an AppImage is named, --where printing it"
    + " before anything starts, and sets ETIUDA_SIGNIN_PREVIEW=1 for that one exec alone: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si71, no keyring: licenceNow says whether the system seals for real, and Account says so in one line ------------------- */
await leg("si71", async () => {
  const shellKeeps = async (storage) => { const sh = await shellOn({ storage }); try { return (await sh.ask("studio:licence")).signinKeeps; } finally { sh.done(); } };
  const real = await shellKeeps(undefined), none = await shellKeeps({ isEncryptionAvailable: () => false, encryptString: (s) => Buffer.from(s), decryptString: (b) => String(b) });
  const acctOf = async (held) => (await studio(held, { host: { signinDoor: true } })).sx();
  const unkept = await acctOf(Object.assign({}, SIGNED, { signinKeeps: false })), kept = await acctOf(Object.assign({}, SIGNED, { signinKeeps: true }));
  const absent = await acctOf(SIGNED), before = await acctOf(Object.assign({}, HELD0, { signinKeeps: false }));
  const parts = {
    shell: real === true && none === false,
    said: /data-signin-unkept/.test(unkept) && plainText(unkept).indexOf(UNKEPT_LINE) >= 0,
    quiet: !/data-signin-unkept/.test(kept) && !/data-signin-unkept/.test(absent) && !/data-signin-unkept/.test(before),
  };
  check(Object.values(parts).every(Boolean),
    "si71 where the system seals nothing for real, licenceNow says signinKeeps false and Account, signed in, says in one line that the sign-in is not kept;"
    + " nothing where it seals or before a sign-in: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify({ real, none }));
});

/* ---- si72, "Copied" on screen (the product designer's edit to the built block): the code's Copy and the link's are one button,
   its two labels stacked in one cell so it keeps the wider width; a copy the shell took turns it to "Copied" for COPIED_MS, then
   back; one it did not take leaves it; the screen reader's "Copied." as before; Polish "Skopiowano". ------------------------------ */
await leg("si72", async () => {
  /* Moved for board 1017: old "the sign-in code's Copy and the link's"; new: the code's Copy is gone (no code on any screen), and the link's Copy alone
     reads Copied for COPIED_MS, a copy not taken leaving it. */
  const s = await studio(SIGNED, { host: { signinDoor: true } });
  const acct = s.sx();
  const html = s.get("signInCopyBtn")("signin-link-copy");
  const pl = (await studio(SIGNED, { lang: "pl", host: { signinDoor: true } })).get("signInCopyBtn")("signin-link-copy");
  const el = () => { const set = new Set(); return { set, getAttribute: () => null, classList: { add: (c) => set.add(c), remove: (c) => set.delete(c) } }; };
  const refused = el();
  const r = await studio(HELD0, { api: { licenceSignIn: () => new Promise(() => {}), copy: () => Promise.resolve({ copied: false }) } });
  r.press("lic-signin", { "data-v": "microsoft" });
  await tick();
  r.get("signInLinkTook")(LINK_URL);
  await r.P.ACTS["signin-link-copy"](refused);
  const w = await studio(HELD0, { api: { licenceSignIn: () => new Promise(() => {}) } });
  w.press("lic-signin", { "data-v": "microsoft" });
  await tick();
  w.get("signInLinkTook")(LINK_URL);
  const link = el();
  await w.P.ACTS["signin-link-copy"](link);
  const linkDuring = link.set.has("done");
  const said = w.home.node("#said") ? w.home.node("#said").textContent : "";
  await new Promise((res) => setTimeout(res, (s.get("COPIED_MS") || 0) + 80));
  const css = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  const rule = (sel) => { const at = css.indexOf("\n" + sel + "{"); return at < 0 ? null : css.slice(at + sel.length + 2, css.indexOf("}", at)); };
  const BTN = /^<button class="btn sm si-copy" data-act="signin-link-copy"><svg[\s\S]*?<\/svg><span class="si-copy-l"><span>Copy<\/span><span>Copied<\/span><\/span><\/button>$/;
  const parts = {
    button: BTN.test(html) && !/lic-code-copy/.test(acct) && typeof s.P.ACTS["lic-code-copy"] === "undefined" && w.main().indexOf('data-act="signin-link-copy"><svg') > 0
      && /<span class="si-copy-l"><span>Kopiuj<\/span><span>Skopiowano<\/span><\/span>/.test(pl),
    swaps: s.get("COPIED_MS") === 1500 && linkDuring && said === "Copied." && !refused.set.has("done"),
    returns: !link.set.has("done"),
    width: rule(".si-copy-l") === "display:inline-grid;justify-items:center" && rule(".si-copy-l>span") === "grid-area:1/1"
      && rule(".si-copy-l>span+span,.si-copy.done .si-copy-l>span:first-child") === "visibility:hidden" && rule(".si-copy.done .si-copy-l>span+span") === "visibility:visible",
  };
  check(Object.values(parts).every(Boolean),
    "si72 (moved for board 1017: the code's Copy is gone) the link's Copy reads Copied for COPIED_MS after a copy the shell took, then Copy, holding the wider label's width;"
    + " a copy not taken leaves it; the screen reader's Copied. as before; Polish too: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si73, the doors at the licence service (board 980, the door-finding) ------------------------------------------------- */
await leg("si73", async () => {
  const sh = await shellOn({});
  const was = answer, sent = [];
  answer = async (url, init) => {
    const route = String(url).replace(/^.*\/v1\//, "");
    sent.push({ route, body: init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : null });
    return route === "door/set" ? { status: 200, body: '{"ok":true,"doors":1}' } : { status: 404, body: "{}" };
  };
  let got = null, signed = false, body = null;
  const door = { team: "t-" + "9b".repeat(8), rt: "7a".repeat(16), url: "https://relay.etiuda.dev", keyId: "", box: "8c".repeat(32) };
  try {
    await sh.ask("studio:key-make");
    got = sh.mod.serviceDoorsSet ? await sh.mod.serviceDoorsSet([door]) : null;
    body = (sent.find((x) => x.route === "door/set") || {}).body || null;
    if (body) {
      const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(String(body.lead), "hex")]), format: "der", type: "spki" });
      signed = !!Q.doorSetBytes && crypto.verify(null, Buffer.from(Q.doorSetBytes({ lead: body.lead, t: body.t, doors: body.doors })), pub, Buffer.from(String(body.sig), "hex"));
    }
  } finally {
    answer = was;
    sh.done();
  }
  const src = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const at = src.indexOf("relayRunner = (await relayLib()).relayRunner({");
  const block = at < 0 ? "" : src.slice(at, src.indexOf("});", at));
  const parts = {
    sent: !!body && JSON.stringify(Object.keys(body).sort()) === '["doors","lead","sig","t"]' && Array.isArray(body.doors) && body.doors.length === 1
      && JSON.stringify(body.doors[0]) === JSON.stringify(door) && signed,
    answered: !!got && got.ok === true && got.doors === 1,
    wired: /\n\s*serviceDoors: \(doors\) => serviceDoorsSet\(doors\),/.test(block),
  };
  check(Object.values(parts).every(Boolean),
    "si73 the runner's doors reach the licence service as door/set under the lead's key, each door as handed and signed over doorSetBytes,"
    + " the answer handed back; the shell hands the runner that setter: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si74 to si77, Hydrogen's review of 2026-11-12,
   findings 4 and 5, on Claude alpha's triage of 22:30 ------------------------------------------------------------------------------ */

/* si74, finding 4 (c): a lead whose key held a standing door signs out, and the licence service is told at once by the empty set of
   doors (door/set, signed under the lead's key), not left handing the lead's teams out until the proof lapses; refused, the sign-out
   still stands and says so; a key that never held a door sends nothing (si26). */
await leg("si74", async () => {
  const run = async (status) => {
    const sh = await shellOn({ env: { STUDIO_TEST_RELAY_SYNC: "none" } });
    const was = answer, sent = [];
    answer = async (url, init) => {
      const route = String(url).replace(/^.*\/v1\//, "");
      sent.push({ route, body: init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : null });
      return route === "door/set" ? { status, body: status === 200 ? '{"ok":true,"doors":0}' : '{"ok":false,"reason":"unreached"}' } : { status: 404, body: "{}" };
    };
    let out = null, left = {}, pub = "";
    try {
      await sh.ask("studio:key-make");
      pub = JSON.parse(fs.readFileSync(sh.file("signing-key.json"), "utf8")).public || "";
      fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1, licenceRef: "5e".repeat(16) }));
      fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: { [TEAM_ID]: { relay: {
        rt: "6d".repeat(16), url: "https://etiuda.dev/relay/v1/", created: true, door: pub + ":" + "5e".repeat(16) } } } }) + "\n");
      out = await sh.ask("studio:licence-signout");
      left = JSON.parse(fs.readFileSync(sh.file("licence-service.json"), "utf8"));
    } finally { answer = was; sh.done(); }
    const body = (sent.find((x) => x.route === "door/set") || {}).body || null;
    let signed = false;
    if (body) {
      const key = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(String(body.lead), "hex")]), format: "der", type: "spki" });
      signed = crypto.verify(null, Buffer.from(Q.doorSetBytes({ lead: body.lead, t: body.t, doors: body.doors })), key, Buffer.from(String(body.sig), "hex"));
    }
    return { out, left, body, signed, pub, routes: sent.map((x) => x.route) };
  };
  const took = await run(200), refused = await run(503);
  const line = "Signed out here. The licence service could not be told yet, so new computers on this licence may still find this Studio's relay teams until Studio next reaches it.";
  const page = await studio(Object.assign({}, HELD0, { doorsLeft: true })), quiet = await studio(HELD0);
  const pl = await studio(Object.assign({}, HELD0, { doorsLeft: true }), { lang: "pl" });
  const parts = {
    sent: !!took.body && JSON.stringify(took.body.doors) === "[]" && took.body.lead === took.pub && took.signed && JSON.stringify(took.routes) === '["door/set"]',
    signedOut: !("by" in took.left) && !("by" in refused.left) && !!took.out && !took.out.error && took.out.by === null,
    quietWhenTaken: !!took.out && took.out.doorsLeft !== true,
    saidWhenRefused: !!refused.out && !refused.out.error && refused.out.doorsLeft === true && !!refused.body,
    page: plainText(page.sx()).indexOf(line) >= 0 && plainText(quiet.sx()).indexOf(line) < 0 && /data-signout-doors/.test(page.sx()),
    polish: plainText(pl.sx()).indexOf("Usługi licencji nie udało się jeszcze powiadomić") >= 0 && plainText(pl.sx()).indexOf(line) < 0,
  };
  check(Object.values(parts).every(Boolean),
    "si74 a lead whose key held a standing door signs out and the licence service is handed the empty set of doors under the lead's key, at once;"
    + " refused, the sign-out stands and Account says the service was not told; English and Polish: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " routes=" + took.routes.join(","));
});

/* si75, finding 4 (b): the key's backup copy carries the lead's books of people and seats (team-people.json, desk-seats.json), sealed,
   and a restore on another computer brings them back, filling what that computer lacks and keeping what it has; so a Remove there
   knows its own admission (removalShown's scope "licence") and withdraws it at the service. */
await leg("si75", async () => {
  const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
  const thread = (verb, ...a) => Promise.resolve().then(() => St[verb](...a));
  const WORDS = "a ferry bell over still water";
  const P = "a1".repeat(32), PQ = "b2".repeat(32), DESK = "k-f4f4f4f4f4f4f4f4";
  const PEOPLE = { [TEAM_ID]: { [P]: { code: ADA, at: NOW }, [PQ]: { code: KIT, at: NOW, removed: NOW + 5 } } };
  const SEATS = { [TEAM_ID]: { desks: { [DESK]: { state: "seated", seat: P, code: ADA, until: NOW + 86400000, last: P } } } };
  const copy = path.join(A5_SCRATCH, "si75-copy.json");
  fs.mkdirSync(A5_SCRATCH, { recursive: true });
  const was = { b: process.env.STUDIO_TEST_BACKUP, r: process.env.STUDIO_TEST_RESTORE };
  const first = await shellOn({ thread });
  let made = null, copyText = "";
  try {
    process.env.STUDIO_TEST_BACKUP = copy;
    fs.writeFileSync(first.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: {} }) + "\n");
    await first.ask("studio:key-make");
    fs.writeFileSync(first.file("team-people.json"), JSON.stringify(PEOPLE));
    fs.writeFileSync(first.file("desk-seats.json"), JSON.stringify(SEATS));
    made = await first.ask("studio:key-backup", WORDS, "A backup copy of the signing key", "Signing key");
    copyText = fs.existsSync(copy) ? fs.readFileSync(copy, "utf8") : "";
  } finally { first.done(); }
  /* The second computer: signed in, no key, and an entry of its own for Kit, made here after the copy, which the restore keeps. */
  const HERE = { [TEAM_ID]: { [PQ]: { code: KIT, at: NOW + 9 } } };
  const second = await shellOn({ thread, env: { STUDIO_TEST_RELAY_SYNC: "none" } });
  const sentWas = answer;
  answer = async () => ({ status: 404, body: "{}" });
  let restored = null, people = {}, seats = {}, removal = null;
  try {
    process.env.STUDIO_TEST_RESTORE = copy;
    fs.writeFileSync(second.file("studio.json"), JSON.stringify({ uiLang: "en" }) + "\n");
    fs.writeFileSync(second.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }) + "\n");
    fs.writeFileSync(second.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: {} }) + "\n");
    fs.writeFileSync(second.file("team-people.json"), JSON.stringify(HERE));
    const pick = await second.ask("studio:key-restore-pick", "Restore the signing key", "Signing key");
    restored = await second.ask("studio:key-restore", pick && pick.file, WORDS);
    try { people = JSON.parse(fs.readFileSync(second.file("team-people.json"), "utf8")); } catch { people = {}; }
    try { seats = JSON.parse(fs.readFileSync(second.file("desk-seats.json"), "utf8")); } catch { seats = {}; }
    removal = second.mod.removalShownNow ? await second.mod.removalShownNow(TEAM_ID, [{ id: DESK }]) : null;
  } finally {
    answer = sentWas;
    for (const [k, v] of [["STUDIO_TEST_BACKUP", was.b], ["STUDIO_TEST_RESTORE", was.r]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    second.done();
  }
  const parts = {
    sealed: !!made && !made.error && /"people":\s*\{\s*"v": 1/.test(copyText) && copyText.indexOf(P) < 0 && copyText.indexOf(ADA) < 0,
    restored: !!restored && !restored.error,
    filled: !!people[TEAM_ID] && JSON.stringify(people[TEAM_ID][P]) === JSON.stringify(PEOPLE[TEAM_ID][P])
      && !!seats[TEAM_ID] && JSON.stringify(seats[TEAM_ID].desks[DESK]) === JSON.stringify(SEATS[TEAM_ID].desks[DESK]),
    keptHere: !!people[TEAM_ID] && JSON.stringify(people[TEAM_ID][PQ]) === JSON.stringify(HERE[TEAM_ID][PQ]),
    ownAdmission: !!removal && !!removal[DESK] && removal[DESK].scope === "licence" && !("code" in removal[DESK]),
  };
  check(Object.values(parts).every(Boolean),
    "si75 the key's backup copy carries the lead's books of people and seats, sealed; restored on another computer they fill what it lacks and keep"
    + " what it has, and Remove there knows the admission as this lead's own: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ")
    + " removal=" + JSON.stringify(removal));
});

/* si76, finding 4 (a): Remove of a person who is on the licence through their organisation or another lead, not by this lead's
   admission (removalShown's scope "team"), says what Remove means there: their seat stays, they leave this team. */
await leg("si76", async () => {
  const drawn = async (lang) => {
    const s = await studio(SIGNED, lang ? { lang } : {});
    const roster = [{ id: DESK_ADA1, name: "Ada" }];
    Object.assign(s.P.S, { open: { dir: TEAM_DIR }, cover: "team", teamWant: "remove", memberGoing: DESK_ADA1, memberName: "",
      desks: { team: { id: TEAM_ID, epoch: 1, sealed: true, relay: true, roster }, seats: { signedIn: true, desks: {}, removal: { [DESK_ADA1]: { computers: 1, scope: "team", code: ADA } } } } });
    const f = s.get("teamCoverHtml");
    return f ? plainText(f()) : "";
  };
  const en = await drawn(""), pl = await drawn("pl");
  const parts = {
    said: en.indexOf("Ada holds a seat through their organisation or another lead, not your admission, so the seat stays and they can still sign in."
      + " They leave this team, and return to it only if you admit them again.") >= 0,
    computers: en.indexOf("Ada leaves the team on their one computer in it.") >= 0 && en.indexOf("withdrawn") < 0,
    polish: pl.indexOf("Ada ma miejsce w licencji dzięki swojej organizacji albo innemu liderowi") >= 0,
  };
  check(Object.values(parts).every(Boolean),
    "si76 Remove of a person on the licence through their organisation or another lead says their seat stays and they leave this team; Polish too: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " || " + en.slice(0, 300));
});

/* si77, finding 5, now the gate's (Max, 2026-11-17 19:35: "sign in first, one 14 day trial, nothing before it"): the shell refuses reading
   statistics, the three proposal calls, a flag's answer and publishing, with a catalog that has a team or none, as a stop, nothing reaching
   the thread, for every Studio that does not work: nobody signed in with a provider offered, one offering none, one activated by a purchase
   key; a Studio signed in under a trial answers them. It was: the page's sentences of paidWaits marked as the pause, for a Studio activated
   by no way, with the activated and the provider-less not held. */
await leg("si77", async () => {
  const run = async (env, state, facts, root, stopped) => {
    const calls = [];
    const thread = (verb) => { calls.push(verb); return Promise.resolve(verb === "teamFacts" ? facts : verb === "publishProject" ? { refused: "x" } : {}); };
    const sh = await shellOn({ thread, env, root, stopped });
    const said = {};
    try {
      if (state) fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify(state));
      said.stats = await sh.ask("studio:stats", TEAM_DIR);
      said.proposals = await sh.ask("studio:proposals", TEAM_DIR);
      said.open = await sh.ask("studio:proposal-open", TEAM_DIR, "p.json", "en");
      said.decide = await sh.ask("studio:proposal-decide", TEAM_DIR, "p.json", {}, "", null);
      said.flag = await sh.ask("studio:flag-keep", TEAM_DIR, "c1");
      said.publish = await sh.ask("studio:publish", TEAM_DIR, {});
    } finally { sh.done(); }
    return { said, calls };
  };
  const stopped = (r) => !!r && !!r.error && !!r.said && r.said.why === "stopped";
  const allStopped = (x) => Object.values(x.said).every(stopped);
  const READ = /statsFor|listProposals|openProposal|decideProposal|flagKeep|publishProject/;
  const PREVIEW = { ETIUDA_SIGNIN_PREVIEW: "1" };
  const team = { team: { id: TEAM_ID } };
  const waits = await run(PREVIEW, null, team, undefined, true);
  const noTeam = await run(PREVIEW, null, { team: null }, undefined, true);
  /* With no licence of the root's, which works for anyone since review xi (Max, 2026-11-22 15:37); it was seated with one. */
  const byKey = await run(PREVIEW, { by: "key" }, team, undefined, true);
  /* Offering no provider: a copy of the tree with the shipped client ids taken out. */
  const bareTree = treeWithIds("tree-bare-si77", "", "");
  const offered = await run({}, null, team, bareTree.tree, true);
  const signed = await run(PREVIEW, null, team);
  const parts = {
    stats: stopped(waits.said.stats),
    proposals: ["proposals", "open", "decide"].every((k) => stopped(waits.said[k])),
    flag: stopped(waits.said.flag),
    publish: stopped(waits.said.publish),
    readNothing: !waits.calls.some((v) => READ.test(v)),
    noTeamPublishes: allStopped(noTeam) && noTeam.calls.indexOf("publishProject") < 0,
    activated: allStopped(byKey) && !byKey.calls.some((v) => READ.test(v)),
    noProvider: bareTree.planted && allStopped(offered) && !offered.calls.some((v) => READ.test(v)),
    signedIn: !Object.values(signed.said).some(stopped) && signed.calls.indexOf("statsFor") >= 0,
  };
  check(Object.values(parts).every(Boolean),
    "si77 the shell refuses, as a stop and with nothing read, statistics, the three proposal calls, a flag's answer and publishing for a Studio nobody"
    + " signed in to, with a team or none, for one offering no provider and for one activated before sign-in, and answers them for one signed in under a trial"
    + " (was: refused in the page's wait sentences marked as the pause, a catalog with no team still publishing, and the activated and the provider-less not held): "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " stats=" + JSON.stringify(waits.said.stats).slice(0, 200));
});

/* ---- si78 to si81, the page the browser lands on (Max, 2026-11-13 03:21: "I really dislike the barebones response website that
   appears upon signing in."): the reply answered 303 to a path of its own, that path held until Studio knows how it ended -------- */
/* The copywriter's words, written here from her brief and the designer's gen.mjs W (Studio's name, the Polish declined), not taken
   from the shell's table, so the two are checked against each other: [headline, line, tab]. */
const LAND = {
  en: {
    seat: ["Signed in", "This Studio holds its lead seat. Etiuda Studio carries on by itself; this tab can be closed.", "Signed in"],
    noseat: ["Signed in, no seat yet", "Etiuda Studio shows why, and what comes next. This tab can be closed.", "No seat yet"],
    back: ["The sign-in is back with Etiuda Studio", "Etiuda Studio finishes it and shows the result. This tab can be closed.", "Sign-in received"],
    appfail: ["The sign-in could not be finished", "Etiuda Studio shows why. This tab can be closed.", "Not finished"],
    org: ["Not allowed by this organisation", "Its IT department can allow it; meanwhile another account can be tried. This tab can be closed.", "Not allowed"],
    cancelled: ["The sign-in was cancelled", "Nothing was changed. This tab can be closed; signing in can wait until it suits.", "Cancelled"],
    earlier: ["This tab is from an earlier sign-in", "It was not used, and nothing was changed. This tab can be closed.", "An earlier sign-in"],
    foot: "Shown by Etiuda Studio on this computer; this page itself sends nothing anywhere." },
  pl: {
    seat: ["Zalogowano", "To Studio ma już miejsce lidera. Etiuda Studio sama przechodzi dalej; tę kartę można zamknąć.", "Zalogowano"],
    noseat: ["Zalogowano, jeszcze bez miejsca", "Etiuda Studio pokazuje, dlaczego i co dalej. Tę kartę można zamknąć.", "Jeszcze bez miejsca"],
    back: ["Logowanie wróciło do Etiudy Studio", "Etiuda Studio je dokończy i pokaże wynik. Tę kartę można zamknąć.", "Logowanie odebrane"],
    appfail: ["Nie udało się dokończyć logowania", "Etiuda Studio pokazuje, dlaczego. Tę kartę można zamknąć.", "Nie dokończono"],
    org: ["Organizacja nie dopuściła Etiudy", "Może to zmienić jej dział IT. Tymczasem w Etiudzie Studio można użyć innego konta; tę kartę można zamknąć.", "Bez zgody organizacji"],
    cancelled: ["Logowanie anulowano", "Nic się nie zmieniło. Tę kartę można zamknąć; z logowaniem można poczekać do dogodnej chwili.", "Anulowano"],
    earlier: ["To karta wcześniejszego logowania", "Nie została użyta i nic się nie zmieniło. Tę kartę można zamknąć.", "Wcześniejsze logowanie"],
    foot: "Tę stronę wyświetla Etiuda Studio na tym komputerze; sama strona niczego nie wysyła." },
};
const LAND_KINDS = Object.keys(LAND.en).filter((k) => k !== "foot");
/* One GET read whole, {status, headers, body}, or {status: <error code>}; never longer than `ms`. */
const getWhole = (url, ms = 12000) => new Promise((resolve) => {
  const rq = http.get(url, (res) => { let body = ""; res.setEncoding("utf8"); res.on("data", (d) => { body += d; }); res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body })); });
  rq.on("error", (e) => resolve({ status: e.code || "error", headers: {}, body: "" }));
  rq.setTimeout(ms, () => rq.destroy(Object.assign(new Error("no answer"), { code: "TIMEOUT" })));
});
/* Whether `page` is the landing for `kind` in `lang`: its headline in the h1, its line, its tab title before Studio's name, its foot. */
const landIs = (page, kind, lang) => {
  const w = LAND[lang][kind], t = String(page).replace(/&lt;/g, "<").replace(/&amp;/g, "&");
  return !!w && t.indexOf("<h1>" + w[0] + "</h1>") > 0 && t.indexOf("<p>" + w[1] + "</p>") > 0 && t.indexOf("<title>" + w[2] + " · Etiuda Studio</title>") > 0
    && t.indexOf("<footer>" + LAND[lang].foot + "</footer>") > 0 && t.indexOf('<html lang="' + lang + '">') > 0;
};
/* The policy served beside a page: nothing fetched, framed or run, the page's own style element alone, by its hash. */
const policyHolds = (csp, page) => {
  const m = /<style>([\s\S]*?)<\/style>/.exec(String(page));
  const h = m ? "'sha256-" + crypto.createHash("sha256").update(m[1], "utf8").digest("base64") + "'" : "none";
  return typeof csp === "string" && csp.indexOf("default-src 'none'; style-src " + h + ";") === 0 && !/unsafe|script-src|\*/.test(csp) && /frame-ancestors 'none'/.test(csp);
};
/* One response that fetches nothing: the mark's symbol and its mask once, every id once, the mark drawn twice by reference, the icon
   data: and nothing else that would make the browser ask for anything. */
const fetchesNothing = (page) => {
  const ids = [...page.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]), once = (re) => (page.match(re) || []).length === 1;
  const refs = [...page.matchAll(/(?:href|xlink:href)="([^"]*)"|url\(([^)]*)\)/g)].map((m) => m[1] || m[2]);
  return once(/<symbol id="m" /g) && once(/<mask /g) && once(/<mask id="[^"]+"/g) && new Set(ids).size === ids.length && (page.match(/<use href="#m"\/>/g) || []).length === 2
    && refs.every((r) => r === "data:," || (r.charAt(0) === "#" && ids.indexOf(r.slice(1)) >= 0)) && once(/<link /g) && once(/<link rel="icon" href="data:,">/g)
    && !/<(script|img|iframe|object|embed|image|audio|video|source|base)\b/i.test(page) && !/\ssrc=|\sstyle=|@import|https?:/i.test(page)
    && page.length > 60000 && page.length < 100000;
};
/* ---- si78, every landing's page: the copywriter's words in both languages, the designer's variant A whole, one response ---------- */
await leg("si78", async () => {
  const sh = await shellOn();
  let mod = null;
  try { mod = sh.mod; } finally { sh.done(); }
  const bad = [];
  for (const lang of ["en", "pl"]) for (const k of LAND_KINDS) {
    const r = mod.signInLandingHtml(k, lang);
    if (!r || !landIs(r.body, k, lang) || !policyHolds(r.policy, r.body) || !fetchesNothing(r.body) || /[‐-―‘-‟… ]/.test(r.body)) bad.push(lang + ":" + k);
  }
  const unknown = mod.signInLandingHtml("nothing-known", "de");
  const kinds = [[{ ok: false, reason: "signin-cancelled" }, "cancelled"], [{ ok: false, reason: "signin-org" }, "org"], [{ ok: false, reason: "signin-no-licence" }, "appfail"],
    [{ ok: false, reason: "signin-full" }, "appfail"], [{ ok: false, reason: "signin-refused" }, "appfail"], [{ ok: false, reason: "signin-expired" }, "appfail"],
    [{ ok: false, reason: "unreached" }, "appfail"], [{ ok: true }, "appfail"], [null, "appfail"]];
  const wrong = kinds.filter(([a, k]) => mod.signInLanding(a) !== k).map(([a, k]) => k + ":" + mod.signInLanding(a));
  const parts = { pages: bad.length === 0 && LAND_KINDS.length === 7, unknown: landIs(unknown.body, "appfail", "en"), kinds: wrong.length === 0 };
  check(Object.values(parts).every(Boolean),
    "si78 every landing in English and Polish is the copywriter's headline, line, tab title and foot in the designer's variant A, one response that fetches"
    + " nothing (the mark's symbol and mask once, drawn twice), its policy naming its one style element by hash; an unknown kind is could-not-finish; a"
    + " refusal lands cancelled, the organisation's or could-not-finish: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ")
    + (bad.length ? " pages " + bad.join(",") : "") + (wrong.length ? " kinds " + wrong.join(",") : ""));
});
/* ---- si79, the loopback alone: 303 to its path, that path held until landed, served once, closed; strays answered ----------- */
await leg("si79", async () => {
  const loop = await wire.identityListen((kind) => "<p>" + kind + "</p>", (q) => new URLSearchParams(q).get("state") === "s9", CLEAN);
  const base = "http://127.0.0.1:" + loop.port;
  let settled = false;
  loop.caught.then(() => { settled = true; }, () => { settled = true; });
  const stray = await getWhole(base + "/?state=other&code=x");
  await new Promise((r) => setTimeout(r, 30));
  const waiting = !settled;
  const back = await getWhole(base + "/?code=c0de-secret&state=s9");
  const got = await loop.caught.catch(() => null);
  const again = await getWhole(base + "/?code=c0de-secret&state=s9"), withQuery = await getWhole(base + CLEAN + "?code=x"), guess = await getWhole(base + "/" + "0".repeat(16));
  let firstDone = false;
  const first = getWhole(base + CLEAN).then((r) => { firstDone = true; return r; });
  await new Promise((r) => setTimeout(r, 80));
  const held = !firstDone;
  const second = await getWhole(base + CLEAN);
  loop.land("cancelled");
  loop.land("seat");
  const one = await first;
  await new Promise((r) => setTimeout(r, 50));
  const after = await getStatus(base + "/?code=late");
  let refused = "";
  await wire.identityListen(() => "x", () => true, "/not-a-path").then(() => { refused = "listened"; }, (e) => { refused = e.message; });
  const at = String(back.headers.location || "");
  const parts = {
    stray: stray.status === 200 && stray.body === "<p>earlier</p>" && waiting && stray.headers["content-security-policy"] === "default-src 'none'",
    redirect: back.status === 303 && at === CLEAN && back.body === "" && at.indexOf("c0de") < 0 && at.indexOf("s9") < 0 && back.headers["cache-control"] === "no-store"
      && back.headers["referrer-policy"] === "no-referrer" && got === "?code=c0de-secret&state=s9",
    others: again.status === 404 && withQuery.status === 404 && guess.status === 404,
    held: held && second.status === 404 && one.status === 200 && one.body === "<p>cancelled</p>" && one.headers["cache-control"] === "no-store",
    closed: after === "ECONNREFUSED", path: /path of its own/.test(refused),
  };
  check(Object.values(parts).every(Boolean),
    "si79 a stray is answered the earlier tab's page and the wait goes on; the reply carrying the state is answered 303 to the path it was given, nothing of"
    + " the code or the state in it; another GET of /, the path with a query or another path is 404; the path's GET is held until landed, a second is 404,"
    + " the first gets the landing once and the loopback closes; a path not of the shape is refused before listening: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});
/* ---- si80, the cap: nothing landed in LOOPBACK_LAND_MS, the held GET is answered the neutral page and the loopback closes ------ */
await leg("si80", async () => {
  const loop = await wire.identityListen((kind) => "<p>" + kind + "</p>", (q) => new URLSearchParams(q).get("state") === "s8", CLEAN);
  const base = "http://127.0.0.1:" + loop.port;
  const back = await getWhole(base + "/?code=c&state=s8");
  const t0 = Date.now(), page = await getWhole(base + CLEAN), took = Date.now() - t0;
  loop.land("seat");
  await new Promise((r) => setTimeout(r, 50));
  const after = await getStatus(base + "/?code=late");
  const wireText = fs.readFileSync(path.join(ROOT, "src", "wire.cjs"), "utf8");
  check(back.status === 303 && page.status === 200 && page.body === "<p>back</p>" && took >= 7000 && took < 11000 && after === "ECONNREFUSED"
    && /\nconst LOOPBACK_LAND_MS = 8000;\n/.test(wireText),
    "si80 nothing landed within LOOPBACK_LAND_MS (8 s): the held GET is answered the neutral page, a landing after is nothing and the loopback closes: "
    + [back.status, page.status, page.body, took + "ms", after].join(" "));
});
/* ---- si81, the shell's press lands the loopback: a configured tree, the browser stood in, the provider and the service by net ---- */
await leg("si81", async () => {
  const { tree, planted: once } = treeWithIds("tree-landing", MS.clientId, "");
  const sh = await shellOn({ root: tree });
  const runs = {};
  try {
    await sh.ask("studio:key-make");
    for (const [name, reply] of [["refused", (st) => "code=c0de&state=" + encodeURIComponent(st)], ["cancelled", (st) => "error=access_denied&state=" + encodeURIComponent(st)],
      ["org", (st) => "error=consent_required&state=" + encodeURIComponent(st)]]) {
      /* The shell reads its own clock, so the token is issued now. */
      const setNonce = standIn(MS, { service: { ok: false, reason: "no-licence" }, claims: { iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 } });
      const seen = sh.opened.length;
      const press = sh.ask("studio:licence-signin", "microsoft");
      for (let i = 0; i < 200 && sh.opened.length === seen; i++) await new Promise((r) => setTimeout(r, 10));
      const q = new URL(sh.opened[seen] || "https://x.invalid/").searchParams, redirect = q.get("redirect_uri") || "http://127.0.0.1:1";
      setNonce(q.get("nonce"));
      const back = await getWhole(redirect + "/?" + reply(q.get("state") || ""));
      const page = await getWhole(redirect + String(back.headers.location || "/none"));
      const said = await press;
      runs[name] = { back: back.status, at: String(back.headers.location || ""), page, why: said && said.said ? said.said.why : "" };
    }
  } finally { sh.done(); }
  const ok = (r, kind, why) => !!r && r.back === 303 && /^\/[0-9a-f]{16}$/.test(r.at) && r.page.status === 200 && landIs(r.page.body, kind, "en")
    && policyHolds(r.page.headers["content-security-policy"], r.page.body) && r.why === why;
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const parts = { planted: once, refused: ok(runs.refused, "appfail", "signin-no-licence"), cancelled: ok(runs.cancelled, "cancelled", "signin-cancelled"),
    org: ok(runs.org, "org", "signin-org"),
    seat: /\}, \(\) => kept, provider\.id\)\.then\(\(v\) => \{ land\(v && v\.by === "admin" \? "back" : "seat"\); return v; \}, \(err\) => \{ land\(signInLanding\(flowed, managedHere\(\)\)\); throw err; \}\)/.test(mainText) };
  check(Object.values(parts).every(Boolean),
    "si81 the shell's press lands the loopback with how the sign-in ended: the service's refusal could-not-finish, the person's Cancel and the organisation's"
    + " refusal at the provider each their own page, under the page's policy, after a 303 to the loopback's own path; a sign-in taken lands the seat: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(Object.fromEntries(Object.entries(runs).map(([k, r]) => [k, [r.back, r.at, r.page.status, r.why]]))));
});

/* ---- si82, Free seat as decision 46 allows (Claude alpha's, under Max's delegation of 2026-11-13 14:56; his word of 15:34: "a press
   the service refused must read as refused, with the owner named as the one to ask") ------------------------------------------- */
await leg("si82", async () => {
  const DESK_ADA = "k-ada0ada0ada0ada0", DESK_KIT = "k-c3c3c3c3c3c3c3c3", DESK_ORG = "k-d4d4d4d4d4d4d4d4";
  const PERSON_ORG = "d4".repeat(32), ORGC = "D9FA4KXM7RWC3TPB";
  const SAID = "This Studio may not free this seat, so nothing was changed. The licence's owner can free it.";
  const thread = (verb) => Promise.resolve(verb === "teamFacts"
    ? { team: { id: TEAM_ID, epoch: 1, roster: [{ id: DESK_ADA }, { id: DESK_KIT }, { id: DESK_ORG }] } } : {});
  /* The service as a co-lead meets it: a person another lead admitted is answered as the service at 87d04b66 answered such a free
     (404 no-seat, which a shell reads as a seat already gone), an organisation's member this lead also admitted by code as the
     service answers now (403 not-yours), and its own guest freed. */
  const scenario = async (root) => {
    const sh = await shellOn({ thread, root });
    const was = answer, sent = [];
    answer = async (url, init) => {
      const route = String(url).replace(/^.*\/v1\//, "");
      const body = init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : {};
      sent.push({ route, person: body.person });
      if (route !== "seat/free") return { status: 404, body: "{}" };
      if (body.person === PERSON_ADA) return { status: 404, body: '{"ok":false,"reason":"no-seat"}' };
      if (body.person === PERSON_ORG) return { status: 403, body: '{"ok":false,"reason":"not-yours"}' };
      return { status: 200, body: '{"ok":true,"freed":"desk"}' };
    };
    const seated = (seat, code) => ({ state: "seated", seat, code, until: NOW + 86400000, last: seat });
    const book = () => (JSON.parse(fs.readFileSync(sh.file("desk-seats.json"), "utf8"))[TEAM_ID] || {}).desks || {};
    const press = async (desk) => { try { return await sh.ask("studio:seat-free", TEAM_DIR, desk); } catch (e) { return { threw: String(e && e.message) }; } };
    const frees = () => sent.filter((x) => x.route === "seat/free").map((x) => x.person);
    const out = {};
    let adaAfter = "";
    try {
      await sh.ask("studio:key-make");
      const state = (owner) => fs.writeFileSync(sh.file("licence-service.json"),
        JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1, signinOwner: owner }));
      state(false);
      fs.writeFileSync(sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_KIT]: { code: KIT, at: 1 }, [PERSON_ORG]: { code: ORGC, at: 1 } } }));
      fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: {
        [DESK_ADA]: seated(PERSON_ADA, ADA), [DESK_KIT]: seated(PERSON_KIT, KIT), [DESK_ORG]: seated(PERSON_ORG, ORGC) } } }));
      const shown = sh.mod.seatsShownNow ? await sh.mod.seatsShownNow(TEAM_ID) : null;
      const free = (d) => !!shown && !!shown.desks[d] && shown.desks[d].free;
      out.shownCoLead = !!shown && free(DESK_ADA) === false && free(DESK_KIT) === true && free(DESK_ORG) === true;
      const ada = await press(DESK_ADA);
      adaAfter = book()[DESK_ADA].state + (book()[DESK_ADA].seat ? "+seat" : "");
      out.otherTeams = frees().length === 0 && book()[DESK_ADA].seat === PERSON_ADA && book()[DESK_ADA].state === "seated"
        && JSON.stringify(ada).includes(SAID);
      const org = await press(DESK_ORG);
      out.refusedSaid = frees().join() === PERSON_ORG && book()[DESK_ORG].seat === PERSON_ORG && book()[DESK_ORG].state === "seated"
        && JSON.stringify(org).includes(SAID);
      await press(DESK_KIT);
      out.ownGuest = frees().join() === PERSON_ORG + "," + PERSON_KIT && !book()[DESK_KIT].seat;
      state(true);
      const ownerShown = sh.mod.seatsShownNow ? await sh.mod.seatsShownNow(TEAM_ID) : null;
      out.shownOwner = !!ownerShown && ownerShown.desks[DESK_ADA].free === true && ownerShown.desks[DESK_ORG].free === true;
      const before = frees().length;
      fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: { [DESK_ADA]: seated(PERSON_ADA, ADA) } } }));
      answer = async (url, init) => { const route = String(url).replace(/^.*\/v1\//, ""); sent.push({ route, person: init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")).person : "" });
        return route === "seat/free" ? { status: 200, body: '{"ok":true,"freed":"desk"}' } : { status: 404, body: "{}" }; };
      await press(DESK_ADA);
      out.ownerFrees = frees().length === before + 1 && !book()[DESK_ADA].seat;
    } finally { answer = was; sh.done(); }
    return { out, adaAfter };
  };
  const { out: real, adaAfter } = await scenario(undefined);
  /* Each plant in a copy of the tree turns its part red: the press asked of a person this lead did not admit, the button offered
     for every seat, the service's refusal not read as the lead's own sentence. */
  const PLANTS_82 = [
    ["s46-free-ask", "shell/main.js", ' && !admittedHere(entry.seat, readTeamPeople())) throw R.refuse(licenceSaid("seat-owner")); /* plant:s46-free-ask */', ") {}", "otherTeams"],
    ["s46-free-shown", "shell/main.js", "free: !!desks[d].seat && (owner || admittedHere(desks[d].seat, people)) }; /* plant:s46-free-shown */", "free: !!desks[d].seat };", "shownCoLead"],
    ["s46-free-refused", "src/licence-client.mjs", '"not-yours": "seat-owner" }); /* plant:s46-free-refused */', '});', "refusedSaid"],
  ];
  /* ETIUDA_PLANTS=off (a merge's area run) leaves the three copies unmade and says so; the release profile plants them. */
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  for (const [name, file, from, to, part] of PLANTS_OFF ? [] : PLANTS_82) {
    const tree = path.join(A5_SCRATCH, "tree-" + name);
    for (const d of ["shell", "src", "ui", path.join("service", "licence"), path.join("engine", "pinned")]) fs.cpSync(path.join(ROOT, d), path.join(tree, d), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "package.json"), path.join(tree, "package.json"));
    const at = path.join(tree, file), text = fs.readFileSync(at, "utf8");
    if (text.split(from).length !== 2) { planted[name] = "anchor"; continue; }
    fs.writeFileSync(at, text.replace(from, () => to));
    const r = (await scenario(tree)).out;
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si82 Free seat as decision 46 allows: offered to a lead who does not own the licence only for a person it admitted by code, to the owner"
    + " for every desk; a press for anyone else sends nothing and says the owner can free it; a refusal from the service (not-yours) is said"
    + " the same and leaves the seat book as it was; the lead's own guest and the owner's press are freed as before: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " another team's desk after the co-lead's press: " + adaAfter + " " + JSON.stringify(planted));
});

/* ---- si83, a lead whose own seat lapsed is told the seat was not freed (the test architect's read of 364b2572): the service's
   403 not-lead, about the asker alone, said as such, and the seat book left as it was; the owner's Free of a lead seat the same ---- */
await leg("si83", async () => {
  const DESK_ADA = "k-ada0ada0ada0ada0";
  const LAPSED = "This Studio no longer holds a lead seat on the licence, so nothing was changed. Signing in again, under Account, takes one again where the licence still has one for this account.";
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [{ id: DESK_ADA }] } } : {});
  const scenario = async (root) => {
    const sh = await shellOn({ thread, root });
    const was = answer, sent = [];
    answer = async (url) => {
      const route = String(url).replace(/^.*\/v1\//, "");
      sent.push(route);
      return route === "seat/free" ? { status: 403, body: '{"ok":false,"reason":"not-lead"}' }
        : route === "seat/list" ? { status: 200, body: JSON.stringify({ ok: true, seats: [{ code: CODE3, person: "f3".repeat(32), you: false, named: true }], counts: null }) }
        : { status: 404, body: "{}" };
    };
    const press = async (ch, ...a) => { try { return await sh.ask(ch, ...a); } catch (e) { return { threw: String(e && e.message) }; } };
    const out = {};
    let deskAfter = "";
    try {
      await sh.ask("studio:key-make");
      /* The Studio still believes it owns the licence (its last check), so nothing stops the press before the service. */
      fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1, signinOwner: true }));
      fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: {
        [DESK_ADA]: { state: "seated", seat: PERSON_ADA, code: ADA, until: NOW + 86400000, last: PERSON_ADA } } } }));
      const desk = await press("studio:seat-free", TEAM_DIR, DESK_ADA);
      const book = (JSON.parse(fs.readFileSync(sh.file("desk-seats.json"), "utf8"))[TEAM_ID] || {}).desks || {};
      deskAfter = book[DESK_ADA].state + (book[DESK_ADA].seat ? "+seat" : "");
      out.desk = sent.filter((r) => r === "seat/free").length === 1 && book[DESK_ADA].seat === PERSON_ADA && book[DESK_ADA].state === "seated"
        && JSON.stringify(desk).includes(LAPSED);
      /* Moved for board 1017: the seat is named by the pseudonym the seat list gave; the shell sends its code. */
      await press("studio:licence-seats");
      const lead = await press("studio:licence-seat-free", "f3".repeat(32));
      out.leadSeat = sent.filter((r) => r === "seat/free").length === 2 && JSON.stringify(lead).includes(LAPSED);
    } finally { answer = was; sh.done(); }
    return { out, deskAfter };
  };
  const { out: real, deskAfter } = await scenario(undefined);
  /* The sentence taken out of the shell's table, in a copy of the tree, turns both parts red (the line read as "not reached"). */
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  let planted = PLANTS_OFF ? "skipped" : "";
  if (!PLANTS_OFF) {
    const tree = path.join(A5_SCRATCH, "tree-s46-not-lead");
    for (const d of ["shell", "src", "ui", path.join("service", "licence"), path.join("engine", "pinned")]) fs.cpSync(path.join(ROOT, d), path.join(tree, d), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "package.json"), path.join(tree, "package.json"));
    const at = path.join(tree, "shell", "main.js"), text = fs.readFileSync(at, "utf8");
    const line = '  "not-lead": "' + LAPSED + '", /* plant:s46-not-lead */\n';
    if (text.split(line).length !== 2) planted = "anchor";
    else {
      fs.writeFileSync(at, text.replace(line, () => ""));
      const r = (await scenario(tree)).out;
      planted = r.desk === false && r.leadSeat === false ? "red" : "held";
    }
  }
  const parts = Object.assign({}, real, { plant: PLANTS_OFF || planted === "red" });
  check(Object.values(parts).every(Boolean),
    "si83 a lead whose own seat lapsed presses Free seat and is told the seat was not freed (the service's 403 not-lead, said in its own"
    + " sentence), the desk still seated in the book; the owner's Free of a lead seat says the same: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " the desk after the press: " + deskAfter + " plant " + planted);
});

/* ---- si90, the sealed refresh token: a file of its own, which Reset and Remove my data take, and Sign out always forgets --------- */
await leg("si90", async () => {
  const TOKEN = "signin-token.json";
  const run = async (root) => {
    const sh = await shellOn(root ? { root } : {});
    const out = {};
    asked.length = 0;
    try {
      fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", refreshSealed: "c2VhbGVk", signinCode: CODE1,
        lead: open.public, checked: NOW, tried: NOW }));
      await sh.ask("studio:licence");
      const st = JSON.parse(fs.readFileSync(sh.file("licence-service.json"), "utf8"));
      const tok = fs.existsSync(sh.file(TOKEN)) ? JSON.parse(fs.readFileSync(sh.file(TOKEN), "utf8")) : null;
      out.moved = !("refreshSealed" in st) && st.by === "signin" && !!tok && tok.refreshSealed === "c2VhbGVk";
      await sh.ask("studio:licence-signout");
      out.signedOut = !fs.existsSync(sh.file(TOKEN)) && !("refreshSealed" in JSON.parse(fs.readFileSync(sh.file("licence-service.json"), "utf8")));
      fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "key", lead: open.public, checked: NOW, tried: NOW }));
      fs.writeFileSync(sh.file(TOKEN), JSON.stringify({ refreshSealed: "c3RyYXk=" }));
      await sh.ask("studio:licence-signout");
      const after = JSON.parse(fs.readFileSync(sh.file("licence-service.json"), "utf8"));
      out.stray = !fs.existsSync(sh.file(TOKEN)) && after.by === "key";
      const nsh = fs.readFileSync(path.join(root || ROOT, "packaging", "installer-pages.nsh"), "utf8");
      out.keepLists = sh.mod.isResetStudioKept(TOKEN) === false && sh.mod.isResetStudioKept("licence-service.json") === true
        && nsh.indexOf('"' + TOKEN + '"') < 0 && nsh.indexOf('$R2 != "licence-service.json"') > 0;
      out.sendsNothing = asked.length === 0;
    } finally { sh.done(); }
    return out;
  };
  const real = await run(null);
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = {};
  if (!PLANTS_OFF) {
    for (const [mark, part] of [["token-apart", "moved"], ["signout-token", "stray"]]) {
      const tree = path.join(A5_SCRATCH, "tree-si90-" + mark);
      for (const d of ["shell", "src", "ui", "packaging", path.join("service", "licence"), path.join("engine", "pinned")]) fs.cpSync(path.join(ROOT, d), path.join(tree, d), { recursive: true });
      fs.copyFileSync(path.join(ROOT, "package.json"), path.join(tree, "package.json"));
      const at = path.join(tree, "shell", "main.js"), lines = fs.readFileSync(at, "utf8").split("\n");
      const hits = lines.map((l, i) => (l.indexOf("/* plant:" + mark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
      if (hits.length !== 1) { planted[mark] = "on " + hits.length + " lines"; continue; }
      lines.splice(hits[0], 1);
      fs.writeFileSync(at, lines.join("\n"));
      planted[mark] = (await run(tree))[part] === false ? "red" : "held";
    }
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si90 the sealed refresh token lives in signin-token.json, moved out of an older licence-service.json at the first read; Sign out removes it,"
    + " and removes a stray one beside a Studio activated by its key, keeping how it was activated; neither Reset's keep list nor the uninstaller's"
    + " names it, while both keep licence-service.json; nothing is sent: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ")
    + " plants " + JSON.stringify(planted));
});

/* ---- si91, the door's mark carries no line (the product owner's note on the door's left half, 2026-11-15) ---------------------------------- */
await leg("si91", async () => {
  const css = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  /* The door's mark is a span of the class mk, and the import marker's rules draw a wavy swash under .mk as a background image; the door
     must unset that image and the padding it sits in, for the span at rest and under the pointer. The band's mark and the About's head
     (markHtml() outside the door) are not in a .mk, so they are not touched. */
  const holds = (text) => {
    const rule = /\.si-door \.mk,\.si-door \.mk:hover\{([^}]*)\}/.exec(text);
    const own = /'<div class="l"><span class="mk">' \+ markHtml\(\)/.test(APP);
    return !!rule && /(^|;)background:none(;|$)/.test(rule[1]) && /(^|;)padding-bottom:0(;|$)/.test(rule[1]) && own;
  };
  const real = holds(css);
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  let planted = "NOT RUN";
  if (!PLANTS_OFF) {
    const lines = css.split("\n"), at = lines.findIndex((l) => l.indexOf("/* plant:door-mark-line */") >= 0);
    if (at < 0) planted = "anchor";
    else { lines[at] = ".si-door .mk,.si-door .mk:hover{width:52px;height:52px;color:var(--mark);margin-bottom:26px}"; planted = holds(lines.join("\n")) ? "held" : "red"; }
  } else console.log("  NOT RUN si91 plant: the rule's two declarations taken out turn the check red (ETIUDA_PLANTS=off)");
  check(real && (PLANTS_OFF || planted === "red"), "si91 the door's mark, a span of the class mk, draws no line: the door unsets the marker's swash image and its padding, at rest and under the pointer,"
    + " and the span is the door's own; plant " + planted);
});

/* ---- si84 to si86: a team is its lead's own (board 1000; Claude alpha's decision 47, held for Max's ruling) --------------------- */
await leg("si84", async () => {
  const sent = [];
  const answers = [
    { ok: true, seats: [{ code: CODE1, seen: "2026-11-11", proved: "2026-11-10", you: true, named: true, team: 4 }, { code: CODE3, seen: null, proved: null, you: false, named: true, team: 0 }],
      counts: { lead: { held: 1, of: 3 } }, orgDesks: false, unnamed: [{ code: CODE4, seen: "2026-11-09" }, { code: "bad", seen: "2026-11-09" }] },
    { ok: true, named: CODE4 }, { ok: false, reason: "full" }, { ok: true, orgDesks: true },
    { ok: true, people: [{ code: CODE3, person: "ab".repeat(32), signedIn: "2026-11-10", added: false }, { code: CODE4, person: "cd".repeat(32), signedIn: "2026-11-09" }] },
  ];
  const ask = async (route, bytes) => { sent.push({ route, body: JSON.parse(Buffer.from(bytes).toString("utf8")) }); return { status: 200, bytes: Buffer.from(JSON.stringify(answers.shift())) }; };
  const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(open.public, "hex")]), format: "der", type: "spki" });
  const verified = (bytes, sig) => !!sig && crypto.verify(null, Buffer.from(bytes), pub, Buffer.from(sig, "hex"));
  let list = null, named = null, full = null, set = null, people = null, bad = null;
  try {
    list = await C.seatList(ask, open, NOW);
    named = await C.nameLead(ask, open, "mnpq-rstv 2345 6789", NOW + 1);
    full = await C.nameLead(ask, open, CODE3, NOW + 2);
    set = await C.setOrgDesks(ask, open, true, NOW + 3);
    people = await C.listPeople(ask, open, NOW + 4);
    bad = await C.nameLead(ask, open, "not a code", NOW + 5);
  } catch { list = null; }
  const b = (i) => (sent[i] ? sent[i].body : {});
  const parts = {
    list: !!list && list.ok === true && list.orgDesks === false && list.seats[0].named === true && list.seats[0].team === 4 && list.seats[1].team === 0
      && list.unnamed.length === 1 && list.unnamed[0].code === CODE4 && list.unnamed[0].seen === "2026-11-09",
    name: !!named && named.ok === true && b(1).code === CODE4 && JSON.stringify(Object.keys(b(1)).sort()) === '["code","lead","sig","t"]'
      && typeof Q.leadNameBytes === "function" && verified(Q.leadNameBytes({ code: CODE4, lead: open.public, t: NOW + 1 }), b(1).sig)
      && !!full && full.ok === false && full.reason === "full",
    set: !!set && set.ok === true && b(3).orgDesks === true && JSON.stringify(Object.keys(b(3)).sort()) === '["lead","orgDesks","sig","t"]'
      && typeof Q.licenceSetBytes === "function" && verified(Q.licenceSetBytes({ orgDesks: true, lead: open.public, t: NOW + 3 }), b(3).sig),
    added: !!people && people.ok === true && people.people.find((p) => p.code === CODE3).added === false && people.people.find((p) => p.code === CODE4).added === undefined,
    unsent: !!bad && bad.ok === false && sent.length === 5 && sent.map((s) => s.route).join() === "seat/list,lead/name,lead/name,licence/set,person/list",
    keep: C.keepWho({}, { ok: true, me: CODE1, owner: false, ask: "owner" }).signinAskOwner === true
      && C.keepWho({ signinAskOwner: true }, { ok: true, me: CODE1, owner: false }).signinAskOwner === undefined
      && C.keepWho({}, { ok: true, me: CODE1, owner: true, orgDesks: false }).orgDesks === false
      && C.keepWho({ orgDesks: true }, { ok: true, me: CODE1, owner: false, orgDesks: true }).orgDesks === undefined,
  };
  check(Object.values(parts).every(Boolean),
    "si84 the client: the owner's seat list keeps who is named, each team's size, the colleagues ready to name and the switch; lead/name and"
    + " licence/set are each signed over requests.mjs's bytes and carry exactly their fields, a typed code read in any grouping and one not a"
    + " code sending nothing; the list of people keeps whether each is added; an answer's ask and the owner's switch are kept as said: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

await leg("si85", async () => {
  /* The product designer's design of 2026-11-13 (etiuda-own-team-2026-11-13/handoff.md), its words placeholders. */
  /* Moved for board 1017: old seats and colleagues by code, a name written beside a code; new: by the person's pseudonym, with the name and
     address the service gives, a colleague named by pseudonym (lead/pick). */
  const P1 = "f1".repeat(32), P3 = "f3".repeat(32), P2 = "f2".repeat(32), PU = "f4".repeat(32), PV = "f5".repeat(32);
  const SEATS = [{ person: P1, name: "Marta", seen: "2026-11-11", proved: "2026-11-10", you: true, named: true, team: 3 },
    { person: P3, name: "Jan", address: "jan@example.com", seen: "2026-11-09", proved: "2026-11-01", you: false, named: true, team: 1, namedAt: "2026-11-09" },
    { person: P2, seen: null, proved: null, you: false, named: true, team: 0 }];
  const UNNAMED = [{ person: PU, seen: "2026-11-09" }, { person: PV, seen: "2026-11-08" }];
  const COUNTS = (of) => ({ lead: { held: 2, of }, desk: { held: 4, of: 30 } });
  const ownerHeld = Object.assign({}, SIGNED, { signinCode: CODE1, signinOwner: true, orgDesks: false, orgDesksAsk: false });
  const seats = (of) => () => Promise.resolve({ error: null, seats: SEATS, counts: COUNTS(of), unnamed: UNNAMED, orgDesks: false });
  const owner = await studio(ownerHeld, { api: { licenceSeats: seats(4),
    licenceNamePerson: (person) => Promise.resolve({ error: null, seats: SEATS.concat([{ person, seen: null, proved: null, you: false, named: true, team: 0 }]), counts: COUNTS(4), unnamed: [] }),
    licenceSwitch: (on) => Promise.resolve(Object.assign({ error: null }, ownerHeld, { orgDesks: on === true, seatsNow: { seats: SEATS, counts: COUNTS(4), unnamed: UNNAMED } })) } });
  const before = owner.sx(), text = plainText(before);
  await owner.press("lic-name", { "data-v": PU });
  await owner.press("lic-switch", { "data-v": "on" });
  const has = (h, re) => re.test(h);
  const owned = {
    leads: text.indexOf("Leads on this licence") >= 0 && text.indexOf("named: 3 of 4") >= 0 && has(before, /data-lead-name-row/)
      && has(before, /data-lead-team>desks on their team:[\s\u00a0]1</) && has(before, /data-lead-named>/)
      && has(before, new RegExp('data-act="lic-seat-free" data-v="' + P3 + '">Remove as lead<')) && !has(before, new RegExp('data-act="lic-seat-free" data-v="' + P1 + '"'))
      && !codeIn(before),
    unnamed: has(before, /data-unnamed/) && has(before, new RegExp('class="btn sm solid" data-act="lic-name" data-v="' + PU + '"'))
      && text.indexOf("Naming takes a free lead seat.") >= 0,
    desks: has(before, /data-desk-seats/) && text.indexOf("in use: 4 of 30") >= 0 && text.indexOf("yours: 3 · Jan: 1") >= 0,
    choice: has(before, /data-org-desks/) && has(before, /class="sx-row si-radio on" role="radio" aria-checked="true" tabindex="0" data-act="lic-switch" data-v="off"/)
      && text.indexOf("Changing this keeps everyone already seated.") >= 0 && text.indexOf("Etiuda Studio, lead seat · owner") >= 0,
    pressed: owner.calls.includes("licenceNamePerson:" + PU) && owner.calls.includes("licenceSwitch:true") && owner.P.S.lic.orgDesks === true,
  };
  /* No lead seat free: no row to name by code, no press on a colleague, and the line says why. */
  const full = await studio(ownerHeld, { api: { licenceSeats: seats(3) } });
  const fullSx = full.sx();
  owned.full = !/data-lead-name-row/.test(fullSx) && !/data-act="lic-name"/.test(fullSx) && plainText(fullSx).indexOf("Every lead seat is taken, so naming can wait until one is free.") >= 0;
  /* Asked once: the card second on the page with the service's answer chosen, the choice of two not drawn below it; a pick moves the
     radio and Keep it so keeps it, after which the card is gone and the choice stands in its group. */
  const asking = await studio(Object.assign({}, ownerHeld, { orgDesksAsk: true }), { api: { licenceSeats: seats(4),
    licenceSwitch: (on) => Promise.resolve(Object.assign({ error: null }, ownerHeld, { orgDesks: on === true, orgDesksAsk: false })) } });
  const asked = asking.sx();
  await asking.press("switch-pick", { "data-v": "on" });
  const picked = asking.sx(), callsAtPick = asking.calls.slice();
  await asking.press("switch-ask", {});
  const answered = asking.sx();
  const groups = (h) => h.split('<div class="sx-group">').length - 1;
  const once = {
    card: /class="sx-card si-ask"/.test(asked) && asked.indexOf('class="sx-card si-ask"') < asked.indexOf('data-row="seat"') && !/data-org-desks/.test(asked)
      && /aria-checked="true" tabindex="0" data-act="switch-pick" data-v="off"/.test(asked) && plainText(asked).indexOf("The licence has arrived. Lead seats: 4. Desk seats: 30.") >= 0
      && /data-act="switch-ask">Keep this choice</.test(asked),
    pick: /aria-checked="true" tabindex="0" data-act="switch-pick" data-v="on"/.test(picked) && !callsAtPick.some((c) => /^licenceSwitch/.test(c)),
    kept: asking.calls.includes("licenceSwitch:true") && !/si-ask/.test(answered) && /data-org-desks/.test(answered) && groups(answered) === groups(asked),
    overview: !/data-switch-ask|si-ask/.test(asking.home2()),
  };
  /* A colleague on a trial of their own; a named lead, its own team. */
  const member = await studio(Object.assign({}, SIGNED, { signinCode: CODE3, signinOwner: false, signinAskOwner: true,
    licence: { status: "trial", trial: { until: "2026-11-27", ends: NOW + 14 * 86400000 }, unusable: null } }));
  const memberSx = member.sx();
  const lead = await studio(Object.assign({}, SIGNED, { signinCode: CODE3, signinOwner: false }), { api: {
    licenceTeam: () => Promise.resolve({ error: null, team: 5, owner: CODE1, desks: { held: 18, of: 30 } }) } });
  const leadSx = lead.sx(), leadText = plainText(leadSx);
  const others = {
    member: /data-ask-owner/.test(memberSx) && plainText(memberSx).indexOf("Trial, day ") >= 0 && plainText(memberSx).indexOf("Etiuda Studio's own fourteen days, until") >= 0
      && plainText(memberSx).indexOf("Its owner can name this account a lead") >= 0
      && !member.calls.some((c) => /^licenceTeam|^licenceSeats/.test(c)),
    /* Moved for board 1017: old "a named lead's own team with the owner's code"; new: with no code. */
    lead: /data-lead-team-group/.test(leadSx) && !codeIn(leadSx) && leadText.indexOf("desks seated: 5") >= 0
      && leadText.indexOf("desk seats in use: 18 of 30") >= 0
      && /data-row="lead-by"[\s\S]*?<div class="c"><\/div><\/div>/.test(leadSx) && !/data-row="lead-by"[^]*?si-copy[^]*?data-row="lead-team"/.test(leadSx) && !/data-org-desks|data-lead-name-row|data-unnamed|si-ask/.test(leadSx),
  };
  const pl = await studio(ownerHeld, { lang: "pl", api: { licenceSeats: seats(4) } });
  const plText = plainText(pl.sx());
  const polish = plText.indexOf("Kto może zająć miejsce dla stanowiska") >= 0 && plText.indexOf("Wskaż jako lidera") >= 0
    && plText.indexOf("stanowiska w zespole: 1") >= 0 && plText.indexOf("Usuń z liderów") >= 0 && plText.indexOf("właściciel") < 0 && plText.indexOf("Who may take") < 0 && plText.indexOf("Leads on") < 0;
  const parts = Object.assign({}, owned, once, others, { polish });
  check(Object.values(parts).every(Boolean),
    "si85 Account to the product designer's design: the owner's leads by name and address, each team's size and when named, Unname, one row naming"
    + " (moved for board 1017: by address or a name from the teams, old: by code) while"
    + " a lead seat is free; the colleagues on a trial of their own, the newest's press solid, none drawn with no seat free; the desk seats by"
    + " team; the choice of two acting at once; the question asked once as the card under the identity, the choice not drawn below it until"
    + " kept; a colleague's trial and whom to ask; a named lead's own team, no code (old: with the owner's code); Polish whole: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

await leg("si86", async () => {
  const sh = await shellOn({});
  const was = answer, sent = [];
  const out = {};
  try {
    await sh.ask("studio:key-make");
    const state = (o) => fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify(Object.assign({ by: "signin", provider: "microsoft", signinCode: CODE1 }, o)));
    const REF = "ab".repeat(16);
    answer = async (url, init) => {
      const route = String(url).replace(/^.*\/v1\//, ""), body = init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : {};
      sent.push({ route, body });
      if (route === "licence/set") return { status: 200, body: JSON.stringify({ ok: true, orgDesks: body.orgDesks }) };
      if (route === "lead/invite") return { status: 409, body: '{"ok":false,"reason":"full"}' };
      return { status: 404, body: "{}" };
    };
    /* What the shell sent besides the seat list it reads back after an act. */
    const acts = () => sent.filter((x) => x.route !== "seat/list");
    const refusedOf = async (fn) => { try { const r = await fn(); return r && r.error ? JSON.stringify(r) : ""; } catch (e) { return String(e && e.message || e); } };
    state({ signinOwner: false, orgDesks: true, licenceRef: REF });
    const lead = await sh.ask("studio:licence");
    out.leadNone = lead.orgDesks === null && lead.orgDesksAsk === false
      && (await refusedOf(() => sh.ask("studio:licence-switch", true))).length > 0 && (await refusedOf(() => sh.ask("studio:licence-name-address", "kit@example.com"))).length > 0
      && acts().length === 0;
    state({ signinOwner: true, orgDesks: false, licenceRef: REF, signinAskOwner: false });
    const ownerNow = await sh.ask("studio:licence");
    out.ask = ownerNow.orgDesks === false && ownerNow.orgDesksAsk === true;
    const kept = await sh.ask("studio:licence-switch", false);
    out.keptSendsNothing = acts().length === 0 && kept.orgDesksAsk === false && JSON.parse(fs.readFileSync(sh.file("licence-service.json"), "utf8")).orgDesksAsked === REF;
    const on = await sh.ask("studio:licence-switch", true);
    out.on = acts().length === 1 && acts()[0].route === "licence/set" && acts()[0].body.orgDesks === true && on.orgDesks === true;
    /* Moved for board 1017: old the naming by code (lead/name); new by address (lead/invite), the same refusal. */
    const full = await refusedOf(() => sh.ask("studio:licence-name-address", "kit@example.com"));
    out.full = acts().length === 2 && acts()[1].route === "lead/invite" && full.indexOf("Every lead seat on the licence is taken, so nobody was named.") >= 0;
    state({ signinOwner: false, signinAskOwner: true });
    out.member = (await sh.ask("studio:licence")).signinAskOwner === true;
  } finally { answer = was; sh.done(); }
  check(Object.values(out).every(Boolean),
    "si86 the shell: naming and the switch are the owner's alone, anyone else refused with nothing sent; the switch is asked once per"
    + " licence, kept off sending nothing and on sending licence/set; a full licence's refusal said in its words; a colleague's ask passed"
    + " to the page: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si87 to si89: the administrator of a licence whose seats follow Microsoft Entra (decision 49, held for Max's ruling) ---------
   Claude alpha's criterion: "a large company's IT decides, in tools it already uses and without touching each computer, who may use
   Etiuda, in which role and with which account, and an ordinary user on a managed computer is shown nothing to buy, try, switch or
   administer". An administrator holds no seat: Studio asks licence/admin for the licence's card and shows it, and nothing else. */
const ADMIN_CARD = { ok: true, admin: true, org: "Harbour Lamps", seats: { lead: { held: 9, of: 12 }, desk: { held: 268, of: 300 } }, waiting: { desk: 0 },
  paidUntil: "2027-11-30", updatesUntil: "2027-11-30" };
const ROTATED_REFRESH = "rt-harbour-lamp-rotated-0123456789abcdef";
const ROLE_A = "Etiuda.Admin", ROLE_L = "Etiuda.Lead";
/* A copy of the tree for a plant: in each [file, from, to], `from` replaced by `to`; null where a `from` is not there exactly once. */
function plantedTree(name, edits) {
  const tree = path.join(A5_SCRATCH, "tree-" + name);
  for (const d of ["shell", "src", "ui", path.join("service", "licence"), path.join("engine", "pinned")]) fs.cpSync(path.join(ROOT, d), path.join(tree, d), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "package.json"), path.join(tree, "package.json"));
  for (const [file, from, to] of edits) {
    const at = path.join(tree, file), text = fs.readFileSync(at, "utf8");
    if (text.split(from).length !== 2) return null;
    fs.writeFileSync(at, text.replace(from, () => to));
  }
  return tree;
}
/* The provider's token address and the licence service for an administrator: the code's token carries `roles` and the nonce the
   page was sent, a refreshed one `refreshRoles` and none; licence/admin and signin answer as asked. Every request is kept in `sent`. */
function adminStandIn(o = {}) {
  const sent = [];
  let nonce = "";
  answer = (url, init) => {
    if (url === MS.token) {
      const refresh = new URLSearchParams(Buffer.from(init.body).toString("utf8")).get("grant_type") === "refresh_token";
      sent.push({ route: refresh ? "token:refresh" : "token:code" });
      if (refresh && o.refuseRefresh) return { status: 400, body: JSON.stringify({ error: "invalid_grant" }) };
      const at = Math.floor((o.now ? o.now() : NOW) / 1000);
      const claims = { iss: "https://login.microsoftonline.com/" + TID + "/v2.0", aud: MS.clientId, sub: "harbour-lamp-admin", tid: TID,
        oid: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d", exp: at + 3600, iat: at };
      const roles = refresh ? o.refreshRoles : o.roles;
      if (roles) claims.roles = roles;
      if (!refresh) claims.nonce = nonce;
      return { status: 200, body: JSON.stringify({ token_type: "Bearer", id_token: jwt(claims), refresh_token: refresh ? ROTATED_REFRESH : RAW_REFRESH, access_token: "opaque" }) };
    }
    const route = String(url).replace(/^.*\/v1\//, ""), body = init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : {};
    sent.push({ route, body });
    const a = o[route];
    if (a) return typeof a === "function" ? a(body) : { status: a.ok === true ? 200 : 403, body: JSON.stringify(a) };
    return { status: 404, body: "{}" };
  };
  return { sent, setNonce: (n) => { nonce = n; }, routes: () => sent.map((x) => x.route) };
}
const sealOf = (t) => C.sealRefresh(vaultOn, t);
const sigHolds = (body) => crypto.verify(null, Buffer.from(Q.licenceAdminBytes({ provider: body.provider, tokenHash: crypto.createHash("sha256").update(body.idToken).digest("hex"),
  lead: body.lead, t: body.t, seed: body.seed })), keys.publicKey, Buffer.from(String(body.sig), "hex")); /* a first sign-in's seed signed, a refreshed token's none */

await leg("si87", async () => {
  const scenario = async (CC) => {
    const out = {};
    const flow = async (o) => {
      const st = adminStandIn(o);
      const b = browser((q) => { st.setNonce(q.get("nonce")); return "?code=c0de&state=" + encodeURIComponent(q.get("state")); });
      const r = await CC.signInFlow(io(b), MS, open, () => NOW);
      return { r, st, nonce: new URL(b.seen.url || "https://x.invalid/").searchParams.get("nonce") };
    };
    /* Roles a token carries are never read here (section 11.11: they ride the service's own access token, opaque to a client): a token
       claiming the Administrator's role goes to signin like any other, and only the service's answer sends Studio to the card. */
    const a = await flow({ roles: [ROLE_A], signin: { ok: false, reason: "no-role" }, "licence/admin": ADMIN_CARD });
    out.idRolesUnread = a.st.routes().join() === "token:code,signin" && a.r.admin !== true && a.r.answer.reason === "signin-no-role";
    /* Lead and Administrator both: a lead's sign-in, as before. */
    const l = await flow({ roles: [ROLE_A, ROLE_L], signin: { ok: false, reason: "no-licence" } });
    out.lead = l.st.routes().join() === "token:code,signin" && l.r.admin !== true;
    /* signin's no-role beside admin: a refreshed token, with no seed, asks for the card; the rotated refresh token is kept. */
    const n = await flow({ refreshRoles: [ROLE_A], signin: { ok: false, reason: "no-role", admin: true }, "licence/admin": ADMIN_CARD });
    const nb = (n.st.sent.find((x) => x.route === "licence/admin") || {}).body || {};
    out.afterNoRole = n.st.routes().join() === "token:code,signin,token:refresh,licence/admin" && !("seed" in nb) && sigHolds(nb)
      && n.r.admin === true && n.r.answer.card.org === "Harbour Lamps" && n.r.answer.card.seats.desk.of === 300 && n.r.org === ""
      && n.r.refreshSealed === sealOf(ROTATED_REFRESH);
    /* A card the service does not say is an administrator's is no card. */
    const u = await flow({ refreshRoles: [ROLE_A], signin: { ok: false, reason: "no-role", admin: true }, "licence/admin": Object.assign({}, ADMIN_CARD, { admin: undefined }) });
    out.adminSaid = u.r.admin !== true && u.r.answer.ok !== true;
    /* No role at all: the copywriter's refusal, nothing more asked. */
    const z = await flow({ signin: { ok: false, reason: "no-role" } });
    out.noRole = z.r.answer.reason === "signin-no-role" && z.st.routes().join() === "token:code,signin" && z.r.refreshSealed === "";
    /* Check now: the sealed token refreshed and licence/admin asked with no seed; the card kept, the rotated seal with it. */
    const st0 = { by: "admin", provider: "microsoft", lead: open.public, refreshSealed: sealOf(RAW_REFRESH) };
    const ck = adminStandIn({ refreshRoles: [ROLE_A], "licence/admin": Object.assign({}, ADMIN_CARD, { waiting: { desk: 12 } }) });
    const c1 = await CC.adminCheck(vaultIo(), MS, st0, open, () => NOW);
    const cb = (ck.sent.find((x) => x.route === "licence/admin") || {}).body || {};
    out.check = ck.routes().join() === "token:refresh,licence/admin" && !("seed" in cb) && c1.answer.ok === true
      && c1.state.adminCard.waiting.desk === 12 && c1.state.refreshSealed === sealOf(ROTATED_REFRESH) && c1.state.by === "admin";
    adminStandIn({ refreshRoles: [], "licence/admin": { ok: false, reason: "no-role" } });
    const c2 = await CC.adminCheck(vaultIo(), MS, st0, open, () => NOW);
    adminStandIn({ refuseRefresh: true });
    const c3 = await CC.adminCheck(vaultIo(), MS, st0, open, () => NOW);
    out.checkRefused = c2.answer.reason === "signin-no-role" && c2.state.refreshSealed && c3.answer.reason === "signin-ask"
      && c3.state.signinAsk === true && !("refreshSealed" in c3.state);
    /* A person, list or seat act on a managed licence: the service's "managed", read as such. */
    adminStandIn({ "seat/free": { ok: false, reason: "managed" } });
    out.managed = (await CC.freeSeat(wire.licenceRequest, open, "desk", "ab".repeat(32), NOW)).reason === "managed";
    return out;
  };
  const real = await scenario(C);
  /* Each plant in a copy of the tree turns its part red: an Administrator sent to signin, no-role not said as the copywriter's, and
     signin's no-role beside admin not followed by the card. */
  const PLANTS_87 = [
    ["admin-said", "const card = a.admin === true ? adminCard(a) : null; /* plant:admin-said */", "const card = adminCard(a);", "adminSaid"],
    ["admin-no-role", ', "no-role": "signin-no-role" }); /* plant:admin-no-role */', " });", "noRole"],
    ["admin-after-no-role", 'answer.admin === true && refreshToken) { /* plant:admin-after-no-role */', "answer.admin === 7) {", "afterNoRole"],
  ];
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  for (const [name, from, to, part] of PLANTS_OFF ? [] : PLANTS_87) {
    const tree = plantedTree(name, [[path.join("src", "licence-client.mjs"), from, to]]);
    if (!tree) { planted[name] = "anchor"; continue; }
    const r = await scenario(await import(pathToFileURL(path.join(tree, "src", "licence-client.mjs")).href));
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si87 the client: a token's own roles claim is never read, so it signs in as any token does; Lead and Admin sign in as a lead; signin's"
    + " no-role beside admin is followed by a refreshed token's licence/admin with no seed, signed over licenceAdminBytes, its card taken only"
    + " where the service says admin; no role is signin-no-role; Check now refreshes and posts licence/admin with no seed, a provider"
    + " that no longer takes the token asks for a sign-in; managed read as itself: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ")
    + " " + JSON.stringify(planted));
});

await leg("si88", async () => {
  const scenario = async (root) => {
    const sh = await shellOn({ root });
    const out = {}, was = answer;
    try {
      await sh.ask("studio:key-make");
      /* The seat's licence the root signed works for anyone since review xi (Max, 2026-11-22 15:37): taken out, so the administrator's
         own standing is what is judged. */
      fs.rmSync(sh.file("etiuda-studio-license.js"), { force: true });
      /* The state as the shell's readServiceState shows it: licence-service.json, with the sealed refresh token read from the file of its
         own the shell keeps it in since si90 (signin-token.json), so "kept" and "forgotten" judge the token wherever it is written. */
      const state = () => {
        const s = fs.existsSync(sh.file("licence-service.json")) ? JSON.parse(fs.readFileSync(sh.file("licence-service.json"), "utf8")) : {};
        const t = fs.existsSync(sh.file("signin-token.json")) ? JSON.parse(fs.readFileSync(sh.file("signin-token.json"), "utf8")) : {};
        return typeof t.refreshSealed === "string" ? Object.assign(s, { refreshSealed: t.refreshSealed }) : s;
      };
      /* The press, the browser stood in: the shell reads its own clock, so the tokens are issued now. */
      /* The service, not the token, says this is an administrator: signin's no-role beside admin, then the card by a refreshed token. */
      const st = adminStandIn({ roles: [ROLE_A], refreshRoles: [ROLE_A], now: Date.now, signin: { ok: false, reason: "no-role", admin: true }, "licence/admin": ADMIN_CARD });
      const seen = sh.opened.length;
      const press = sh.ask("studio:licence-signin", "microsoft").catch((e) => ({ threw: String(e && e.message || e) }));
      for (let i = 0; i < 200 && sh.opened.length === seen; i++) await new Promise((r) => setTimeout(r, 10));
      const q = new URL(sh.opened[seen] || "https://x.invalid/").searchParams, redirect = q.get("redirect_uri") || "http://127.0.0.1:1";
      st.setNonce(q.get("nonce"));
      const back = await getWhole(redirect + "/?code=c0de&state=" + encodeURIComponent(q.get("state") || ""));
      const page = await getWhole(redirect + String(back.headers.location || "/none"));
      const v = await press;
      const s1 = state();
      out.signin = st.routes().join() === "token:code,signin,token:refresh,licence/admin" && v.by === "admin" && v.provider === "microsoft" && !!v.admin
        && v.admin.org === "Harbour Lamps" && v.admin.seats.lead.of === 12 && v.admin.waiting.desk === 0 && v.admin.paidUntil === "2027-11-30"
        && !!v.took && v.took.admin === "kept" && s1.by === "admin" && typeof s1.refreshSealed === "string" && s1.refreshSealed.length > 0
        && !!s1.adminCard && !("signinCode" in s1) && JSON.stringify(v).indexOf(RAW_REFRESH) < 0 && JSON.stringify(v).indexOf("refreshSealed") < 0;
      out.landing = page.status === 200 && landIs(page.body, "back", "en");
      /* A paid act is refused as a stop for an administrator, who holds no seat and so does not work, as for a Studio nobody signed in to
         (was: it waited for sign-in in the page's sentence). */
      const wait = await sh.ask("studio:proposals", "x").then((x) => JSON.stringify(x), (e) => String(e && e.message || e) + JSON.stringify((e && e.said) || {}));
      out.waits = wait.indexOf('"why":"stopped"') >= 0;
      /* Check now: licence/admin with no seed by a refreshed token, the card replaced. */
      const ck =adminStandIn({ refreshRoles: [ROLE_A], now: Date.now, "licence/admin": Object.assign({}, ADMIN_CARD, { waiting: { desk: 12 } }) });
      const v2 = await sh.ask("studio:licence-check").catch((e) => ({ threw: String(e && e.message || e) }));
      const cb = (ck.sent.find((x) => x.route === "licence/admin") || {}).body || {};
      out.check = ck.routes().filter((r) => r !== "door/set").join() === "token:refresh,licence/admin" && !("seed" in cb)
        && !!v2.admin && v2.admin.waiting.desk === 12 && state().adminCard.waiting.desk === 12;
      /* Its refusal in the copywriter's words. */
      adminStandIn({ refreshRoles: [], now: Date.now, "licence/admin": { ok: false, reason: "no-role" } });
      const no = await sh.ask("studio:licence-check").then((x) => JSON.stringify(x), (e) => String(e && e.message || e));
      out.noRoleSaid = no.indexOf("This account has no Etiuda role in its organisation, so it holds no seat. Its IT department assigns the roles.") >= 0;
      /* Sign out forgets the administrator's sign-in and its card, and sends nothing. */
      const so = adminStandIn({});
      const v3 = await sh.ask("studio:licence-signout");
      const s3 = state();
      out.signout = so.sent.length === 0 && v3.by === null && v3.admin === null && v3.provider === null
        && !["by", "provider", "refreshSealed", "adminCard"].some((k) => k in s3);
      /* A person, list or seat act refused on a managed licence: the copywriter's words. */
      fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1, signinOwner: true, orgDesks: false }));
      adminStandIn({ "licence/set": { ok: false, reason: "managed" } });
      const m = await sh.ask("studio:licence-switch", true).then((x) => JSON.stringify(x), (e) => String(e && e.message || e));
      out.managedSaid = m.indexOf("Seats on this licence follow the roles the organisation's IT department assigns, so nothing was changed here.") >= 0;
    } finally { answer = was; sh.done(); }
    return out;
  };
  /* A configured tree, as si81's: Microsoft with the stand-in's client id in place of the one it ships with (or none). */
  const lcText = fs.readFileSync(path.join(ROOT, "src", "licence-client.mjs"), "utf8");
  const at0 = lcText.indexOf('Object.freeze({ id: "microsoft", issuer: "'), at1 = at0 < 0 ? -1 : lcText.indexOf('clientId: "', at0), at2 = at1 < 0 ? -1 : lcText.indexOf('",', at1 + 11);
  const anchor = at2 < 0 ? "MICROSOFT ENTRY NOT FOUND" : lcText.slice(at0, at2 + 2);
  const configured = at2 < 0 ? anchor : lcText.slice(at0, at1) + 'clientId: "' + MS.clientId + '",';
  const tree = plantedTree("admin-shell", [[path.join("src", "licence-client.mjs"), anchor, configured]]);
  const real = tree ? await scenario(tree) : { configured: false };
  /* Each plant in a configured copy turns its part red: the card taken as a licence, Check now sent to check, Sign out leaving it. */
  /* plant:admin-waits is no longer proved here: the line it guards (signInWaitsNow's exception for an administrator) is reached by no channel,
     for the gate refuses an administrator's paid act first. The mark stays in shell/main.js, which the plant guard keeps. */
  const PLANTS_88 = [
    ["admin-act", 'if (way === "signin" && a.admin === true && a.card) { /* plant:admin-act */', "if (false) {", "signin"],
    ["admin-step", 'if (st.by === "admin") { /* plant:admin-step */', "if (false) {", "check"],
    ["admin-signout", 'if (st.by === "signin" || st.by === "admin") for (const k of SIGNED_IN_STATE) delete next[k]; /* plant:admin-signout */', 'if (st.by === "signin") for (const k of SIGNED_IN_STATE) delete next[k];', "signout"],
  ];
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  for (const [name, from, to, part] of PLANTS_OFF ? [] : PLANTS_88) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to], [path.join("src", "licence-client.mjs"), anchor, configured]]);
    if (!t) { planted[name] = "anchor"; continue; }
    const r = await scenario(t);
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si88 the shell: an Administrator's sign-in keeps by admin, the provider, the sealed refresh token and the card, hands the page the card and"
    + " no token or seal, takes no seat (signin's no-role beside admin, then licence/admin) and lands the browser on the neutral page; a paid act is refused as a stop (was: waits for sign-in); Check now refreshes and asks licence/admin with"
    + " no seed, its no-role said in the copywriter's words; Sign out forgets it all and sends nothing; a managed licence's refusal said in"
    + " her words: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

await leg("si89", async () => {
  const card = (waiting) => ({ provider: "microsoft", org: "Harbour Lamps", seats: { lead: { held: 9, of: 12 }, desk: { held: waiting ? 300 : 268, of: 300 } },
    waiting: { desk: waiting }, paidUntil: "2027-11-30", updatesUntil: "2027-11-30" });
  const held = (waiting) => Object.assign({}, HELD0, { by: "admin", provider: "microsoft", admin: card(waiting), checked: "2026-11-11",
    checkedAt: Date.UTC(2026, 10, 11, 13, 2), unanswered: false });
  const scenario = async (source) => {
    const out = {};
    const s = await studio(held(0), { source, api: { licenceSignOut: () => Promise.resolve(Object.assign({ error: null }, HELD0)) } });
    const html = s.sx(), text = plainText(html);
    const has = (w) => text.indexOf(w) >= 0;
    out.view = ["Signed in with Microsoft", "Managed by your organisation",
      "Harbour Lamps decides who uses Etiuda Studio here, and with which account. Its IT department can change that.",
      "Sign-in", "Microsoft · work accounts of Harbour Lamps", "Seat", "No seat",
      "This account administers the licence and writes no catalogs, so it holds no seat.", "Last checked", "Check now", "The licence",
      "Lead seats", "For the people who keep the wording, in Etiuda Studio.", "in use: 9 of 12", "Desk seats", "For the agents, on their desks.",
      "in use: 268 of 300", "Paid until", "Newer versions until", "30 Nov 2027", "Who holds a seat", "Roles in Microsoft Entra",
      "Agent, Lead and Administrator are assigned in your organisation's Entra, not here. A person taken off there loses the seat within a week at most."].every(has)
      && (html.match(/data-locked/g) || []).length === 2 && (text.match(/Set by your organisation/g) || []).length === 2
      && /data-row="signin-by"[\s\S]*?data-row="seat"[\s\S]*?data-row="checked"[\s\S]*?data-admin-licence[\s\S]*?data-row="lic-lead"[\s\S]*?data-row="lic-desk"[\s\S]*?data-row="lic-paid"[\s\S]*?data-row="lic-updates"[\s\S]*?data-row="lic-who"/.test(html);
    /* Nothing to author, buy, try or administer: no code, no Carry on, no owner's or lead's group, no held list, no trial, no Buy. */
    out.nothingElse = !/data-signin-code|data-carry-on|data-lead-seats|data-unnamed|data-desk-seats|data-org-desks|data-lead-team-group|data-ask-owner|si-ask|data-admin-over/.test(html)
      && !/\bBuy\b|\btrial\b|Payments not yet matched|Carry on|Your sign-in code|Etiuda Studio, lead seat/i.test(text);
    /* The rest of Studio: door stands with S5 administrator words, no "Not signed in" at the rail's foot. */
    out.waits = !!s.get("studioDoorState") && !s.get("paidWaits") && /data-signin-door/.test(s.home2())
      && plainText(s.home2()).indexOf("This account manages the licence but has no seat on it.") >= 0 && !/data-signin-foot/.test(s.rail());
    /* More assigned than bought: the desk seats' small line is the fact, with the amber dot, and only then. */
    const o = await studio(held(12), { source });
    const oh = o.sx(), desk = (/data-row="lic-desk"[\s\S]*?<\/div><\/div>/.exec(oh) || [""])[0];
    out.over = /data-admin-over><span class="si-dot"><\/span>/.test(desk) && plainText(desk).indexOf("assigned beyond those bought: 12. They are seated as seats come free.") >= 0
      && plainText(desk).indexOf("in use: 300 of 300") >= 0 && plainText(desk).indexOf("For the agents") < 0 && (oh.match(/si-dot/g) || []).length === 1;
    out.noOver = !/si-dot/.test(html);
    /* Polish, whole. */
    const pl = await studio(held(12), { source, lang: "pl" });
    const pt = plainText(pl.sx());
    out.polish = ["Zalogowano przez Microsoft", "Zarządzane przez organizację", "Organizacja Harbour Lamps decyduje, kto korzysta tu z Etiudy Studio i jakim kontem.",
      "Logowanie", "Microsoft · konta służbowe organizacji Harbour Lamps", "Ustawione przez organizację", "Miejsce w licencji", "Bez miejsca w licencji",
      "To konto administruje licencją i nie pisze katalogów, więc nie zajmuje miejsca.", "Licencja", "Miejsca liderów", "zajęte: 9 z 12", "Miejsca dla stanowisk",
      "przydzielone ponad kupione: 12. Te osoby dostaną miejsce, gdy któreś się zwolni.", "Opłacona do", "Nowsze wersje do", "30 lis 2027", "Kto zajmuje miejsce",
      "Role w Microsoft Entra", "Role Agent, Lead i Administrator przydziela się w Entra organizacji, nie tutaj."].every((w) => pt.indexOf(w) >= 0)
      && !/Lead seats|Desk seats|Paid until|Managed by|No seat|in use:/.test(pt);
    /* The sign-in's fact for a token with no Etiuda role, both languages. */
    const fact = s.get("signInFact"), pfact = pl.get("signInFact");
    out.noRole = !!fact && fact({ why: "signin-no-role" }).join(" ") === "This account has no Etiuda role in its organisation, so it holds no seat. Its IT department assigns the roles."
      && !!pfact && pfact({ why: "signin-no-role" }).join(" ") === "To konto nie ma w swojej organizacji żadnej roli w Etiudzie, więc nie zajmuje miejsca w licencji. Role przydziela dział IT organizacji.";
    /* Sign out: the shell's answer replaces the administrator's state, and Account says nobody is signed in. */
    await s.press("acct-signout");
    const after = plainText(s.sx());
    out.signout = s.calls.indexOf("licenceSignOut") >= 0 && after.indexOf("Not signed in") >= 0 && after.indexOf("The licence") < 0 && after.indexOf("No seat") < 0;
    return out;
  };
  const real = await scenario(undefined);
  /* Each plant on the page's source turns its part red: the over line drawn for none, the administrator's groups not drawn, and the
     paid acts not waiting for an administrator. */
  const PLANTS_89 = [
    ["admin-over", "const over = c.waiting && Number(c.waiting.desk) > 0 ? Number(c.waiting.desk) : 0; /* plant:admin-over */", "const over = Number(c.waiting.desk) + 1;", "noOver"],
    ["admin-groups", "if (adminIn()) return groups.concat([{ rows: adminRowsHtml() }, adminLicenceGroup()]); /* plant:admin-groups */", "", "view"],
  ];
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  for (const [name, from, to, part] of PLANTS_OFF ? [] : PLANTS_89) {
    if (APP.split(from).length !== 2) { planted[name] = "anchor"; continue; }
    const r = await scenario(APP.replace(from, () => to));
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si89 the page: the administrator's Account as the product designer's pictures draw it, who is signed in and that the organisation decides,"
    + " the sign-in and who holds a seat locked, No seat and why, the last check, the licence's seats, dates and roles; nothing to author, buy,"
    + " try or administer, no Carry on and no held list; the paid acts wait and no door stands; more assigned than bought said with the amber"
    + " dot and only then; Polish whole; no role in both languages; Sign out back to Not signed in: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

await leg("si92", async () => {
  const scenario = async (CC) => {
    const k1 = CC.keepWho({ by: "signin" }, { ok: true, managed: true, cause: "own-licence" });
    const k2 = CC.keepWho(k1, { ok: true, managed: true, cause: "assigned" });
    const k3 = CC.keepWho(k2, { ok: true });
    return { keep: k1.signinCause === "own-licence" && k2.signinCause === "assigned" && !("signinCause" in k3) };
  };
  const real = await scenario(C);
  const OWN = "Your organisation's licence follows the roles its IT department assigns, and this account has none, so it keeps its seat on the licence bought before.";
  const ASG = "Your organisation has given this account a role, so it uses the organisation's licence; its seat on the licence bought before is not used meanwhile.";
  const seatOf = (html) => plainText((/data-row="seat"[\s\S]*?<\/div><\/div>/.exec(html) || [""])[0]);
  const own = await studio(Object.assign({}, SIGNED, { signinCause: "own-licence" })), asg = await studio(Object.assign({}, SIGNED, { signinCause: "assigned" }));
  const plain = await studio(SIGNED), pl = await studio(Object.assign({}, SIGNED, { signinCause: "own-licence" }), { lang: "pl" });
  real.page = seatOf(own.sx()).indexOf(OWN) >= 0 && seatOf(asg.sx()).indexOf(ASG) >= 0 && seatOf(plain.sx()).indexOf("Held by this account, on up to three computers.") >= 0
    && seatOf(pl.sx()).indexOf("zachowuje miejsce w licencji kupionej wcześniej") >= 0;
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  let planted = "skipped";
  if (!PLANTS_OFF) {
    const tree = plantedTree("keep-cause", [[path.join("src", "licence-client.mjs"),
      'if (a.managed === true && (a.cause === "own-licence" || a.cause === "assigned")) next.signinCause = a.cause; else delete next.signinCause; /* plant:keep-cause */',
      "delete next.signinCause;"]]);
    planted = !tree ? "anchor" : (await scenario(await import(pathToFileURL(path.join(tree, "src", "licence-client.mjs")).href))).keep === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || planted === "red" });
  check(Object.values(parts).every(Boolean),
    "si92 a managed tenant's person who also bought a licence of their own: the client keeps the cause each answer gives and clears it on one"
    + " without; the Seat row says which licence they use and why, in English and Polish, and an ordinary seat's line stands: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " plant " + planted);
});

/* ---- si93, a person refused for want of a seat sees their own sign-in code (the licence service's no-licence answer carries it,
   aaedb9d1; the copywriter's words of 2026-11-16) ------------------------------ */
await leg("si93", async () => {
  const CODE = "7K3M9QX2RT8VW4ZA", SHOWN = "7K3M 9QX2 RT8V W4ZA";
  /* The copywriter's words of 2026-11-22 (2026-11-22, "Replaced", 3586), byte for byte. */
  const NEW_EN = "The sign-in worked. A licence bought by this account, or a lead naming or inviting it by its email address, gives it a seat; another account can be used meanwhile.";
  const NEW_PL = "Logowanie się powiodło. Miejsce daje licencja kupiona na to konto albo wskazanie lub zaproszenie od lidera na adres e-mail tego konta; tymczasem można użyć innego konta.";
  const idTree = (name, edit) => {
    const { tree, planted } = treeWithIds(name, MS.clientId, "");
    if (!planted) return null;
    if (edit) {
      const at = path.join(tree, edit[0]), text = fs.readFileSync(at, "utf8");
      if (text.split(edit[1]).length !== 2) return null;
      fs.writeFileSync(at, text.replace(edit[1], () => edit[2]));
    }
    return tree;
  };
  /* MOVED FOR BOARD 1017 (no screen shows a code). Old: "the answer's code kept on this one refusal and only in the seat code's shape"; new: the
     answer's code is kept on no refusal, the reason read as before.
     MOVED AGAIN FOR BOARD 1020 (Claudius's ruling of 2026-11-22: after a refusal no-licence, Buy with that answer's code). Old: "kept on no
     refusal"; new: carried on this one refusal, and only in the seat code's shape, for Buy alone (src/buy-path.cjs noLicenceKept); the shell
     still hands the page no code and no screen draws one (the shell and page parts below, unchanged). */
  const clientPart = async (CC) => {
    const svc = async (status, body) => CC.signIn(async () => ({ status, bytes: Buffer.from(JSON.stringify(body)) }), open, "microsoft", jwt({ sub: "x" }), NOW, "ab".repeat(32));
    const good = await svc(403, { ok: false, reason: "no-licence", me: CODE });
    const none = await svc(403, { ok: false, reason: "no-licence" });
    const other = await svc(409, { ok: false, reason: "full", me: CODE });
    const bad = await svc(403, { ok: false, reason: "no-licence", me: CODE.toLowerCase() });
    return good.reason === "signin-no-licence" && good.me === CODE && none.me === undefined && other.me === undefined && bad.me === undefined;
  };
  /* Old: "a press answered no-licence hands the page the code in its refusal, and only a code of that shape"; new: it hands the page no code,
     whatever the answer carried, its sentence the same either way. */
  let shellSeen = null;
  const shellPart = async (root) => {
    const out = {};
    const sh = await shellOn({ root });
    try {
      await sh.ask("studio:key-make");
      for (const [name, service] of [["with", { ok: false, reason: "no-licence", me: CODE }], ["none", { ok: false, reason: "no-licence" }],
        ["bad", { ok: false, reason: "no-licence", me: CODE.toLowerCase() }]]) {
        const setNonce = standIn(MS, { service, claims: { iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 } });
        const seen = sh.opened.length;
        const press = sh.ask("studio:licence-signin", "microsoft");
        for (let i = 0; i < 200 && sh.opened.length === seen; i++) await new Promise((r) => setTimeout(r, 10));
        const q = new URL(sh.opened[seen] || "https://x.invalid/").searchParams, redirect = q.get("redirect_uri") || "http://127.0.0.1:1";
        setNonce(q.get("nonce"));
        const back = await getWhole(redirect + "/?code=c0de&state=" + encodeURIComponent(q.get("state") || ""));
        await getWhole(redirect + String(back.headers.location || "/none"));
        out[name] = await press;
      }
    } finally { sh.done(); }
    const said = (r) => (r && r.said) || {};
    shellSeen = Object.fromEntries(Object.entries(out).map(([k, r]) => [k, [said(r).why || (r && r.error) || null, "code" in said(r)]]));
    return said(out.with).why === "signin-no-licence" && !("code" in said(out.with)) && !JSON.stringify(out.with).includes(CODE)
      && said(out.none).why === "signin-no-licence" && !("code" in said(out.none))
      && said(out.bad).why === "signin-no-licence" && !("code" in said(out.bad)) && !JSON.stringify(out.bad).includes(CODE.toLowerCase())
      && said(out.with).frame === said(out.none).frame;
  };
  /* Old: "the second line as the copywriter wrote it with a code, in both languages; as it was without"; new: the copywriter's line of 2026-11-22
     (words-name-by-address-studio, the one replacing 3586) in both languages, a code handed by an older shell never drawn. */
  const pagePart = async (source) => {
    const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const frame = (/"signin-no-licence": "([^"]*)"/.exec(mainText) || [])[1] || "x";
    const door = async (lang, said) => {
      const d = await studio(HELD0, { lang, source, api: { licenceSignIn: () => Promise.resolve({ error: "x", said: Object.assign({ frame, vars: {}, why: "signin-no-licence" }, said) }) } });
      await d.press("lic-signin", { "data-v": "microsoft" });
      const m = /<h2 data-signin-fact>([^<]*)<\/h2><p class="lede">([^<]*)<\/p>/.exec(d.main());
      return { head: m ? plainText(m[1]).trim() : "", line: m ? plainText(m[2]).trim() : "" };
    };
    const [en, pl, enNone, plNone, enBad] = [await door("en", { code: CODE }), await door("pl", { code: CODE }), await door("en", {}), await door("pl", {}), await door("en", { code: undefined })];
    return en.head === "No Etiuda licence has a seat for this account." && en.line === NEW_EN && en.line.indexOf(SHOWN) < 0
      && pl.head === "Żadna licencja Etiudy nie ma miejsca dla tego konta." && pl.line === NEW_PL && pl.line.indexOf(SHOWN) < 0
      && enNone.line === NEW_EN && plNone.line === NEW_PL && enBad.line === NEW_EN && enNone.head === en.head;
  };
  const real = { client: await clientPart(C), shell: await shellPart(idTree("tree-si93-real")), page: await pagePart(APP) };
  const realSeen = shellSeen;
  /* Each plant in a copy of the tree turns its part red. */
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  if (!PLANTS_OFF) {
    const cp = (n, e) => idTree("tree-si93-" + n, e);
    /* Each plant puts the code back where it went, and its part turns red. */
    const kept = cp("kept", [path.join("src", "licence-client.mjs"), "  if (json.admin === true) no.admin = true;\n", "  if (json.admin === true) no.admin = true;\n  if (typeof json.me === \"string\") no.me = json.me;\n"]);
    planted.kept = !kept ? "anchor" : (await clientPart(await import(pathToFileURL(path.join(kept, "src", "licence-client.mjs")).href + "?si93kept"))) === false ? "red" : "held";
    /* The shell's plant carries the client's with it, since the shell can hand on only what the client kept. */
    const said = cp("said", [path.join("shell", "main.js"), "    refused.said.why = String((a && a.reason) || \"unreached\");\n", "    refused.said.why = String((a && a.reason) || \"unreached\");\n    if (a && a.me) refused.said.code = a.me;\n"]);
    if (said) { const at = path.join(said, "src", "licence-client.mjs"), t = fs.readFileSync(at, "utf8");
      fs.writeFileSync(at, t.replace("  if (json.admin === true) no.admin = true;\n", () => "  if (json.admin === true) no.admin = true;\n  if (typeof json.me === \"string\") no.me = json.me;\n")); }
    planted.said = !said ? "anchor" : (await shellPart(said)) === false ? "red" : "held";
    const shown = cp("shown", [path.join("ui", "app.js"), 'T("The sign-in worked. A licence bought by this account, or a lead naming or inviting it by its email address, gives it a seat; another account can be used meanwhile.")];',
      'T("The sign-in worked. A licence bought by this account, or a lead naming or inviting it by its email address, gives it a seat; another account can be used meanwhile.") + (f.said && f.said.code ? " " + f.said.code : "")];']);
    planted.shown = !shown ? "anchor" : (await pagePart(fs.readFileSync(path.join(shown, "ui", "app.js"), "utf8"))) === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si93 (moved for board 1017, and for board 1020) a person refused for want of a seat is shown no sign-in code: the client carries the answer's code on that refusal alone, in its shape, for Buy; the shell hands"
    + " the page none, and the refusal's second line is the copywriter's line of 2026-11-22 in English and in Polish, a code from an older shell never"
    + " drawn: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted) + " " + JSON.stringify({ shellSeen: realSeen }));
});

/* ---- si94, Review while nobody has signed in: the copywriter's words of 2026-11-16,
   held here as constants copied byte for byte from her file, which is not in Studio's tree ---------------------------------------------------------- */
await leg("si94", async () => {
  const W = {
    headEn: "Review", headPl: "Przegląd",
    sentEn: "Proposals and flags from desks wait for sign-in.", sentPl: "Propozycje i zgłoszenia ze stanowisk czekają na logowanie.",
    propEn: "Taking proposals waits for sign-in.", propPl: "Przyjmowanie propozycji czeka na logowanie.",
    flagEn: "Answering flags waits for sign-in.", flagPl: "Odpowiadanie na zgłoszenia czeka na logowanie.",
    afterEn: "Everything else in this catalog works without it.",
  };
  const langText = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const pairIn = (en, pl) => langText.indexOf(JSON.stringify(en) + ":\n      " + JSON.stringify(pl)) >= 0 || langText.indexOf(JSON.stringify(en) + ": " + JSON.stringify(pl)) >= 0;
  /* The page: Review no longer paints a paid-waits placeholder (S-3 removed paidWaits/paidHtml; the gate refuses in the shell). */
  const pagePart = async (source) => {
    const s = await teamOn(UNSIGNED, { source });
    s.P.S.section = "proposals"; s.P.S.rv = s.P.S.rv || null;
    s.get("paintProposals")();
    return !/data-signin-paid/.test(s.main());
  };
  /* The shell: a flag's answer refused with her flag sentence, a proposal's three calls with the unchanged one; the thread is asked of neither. */
  const shellPart = async (root) => {
    const calls = [];
    const thread = (verb) => { calls.push(verb); return Promise.resolve({}); };
    const sh = await shellOn({ thread, env: { ETIUDA_SIGNIN_PREVIEW: "1" }, root, stopped: true });
    const said = {};
    try {
      said.flag = await sh.ask("studio:flag-keep", TEAM_DIR, "c1");
      said.proposals = await sh.ask("studio:proposals", TEAM_DIR);
      said.open = await sh.ask("studio:proposal-open", TEAM_DIR, "p.json", "en");
      said.decide = await sh.ask("studio:proposal-decide", TEAM_DIR, "p.json", {}, "", null);
    } finally { sh.done(); }
    /* Refused as a stop now (the gate); it was refused in her flag sentence and the proposals' sentence marked as the pause. */
    const held = (r) => !!r && !!r.error && !!r.said && r.said.why === "stopped";
    return held(said.flag) && ["proposals", "open", "decide"].every((k) => held(said[k])) && !calls.some((v) => /flagKeep|listProposals|openProposal|decideProposal/.test(v));
  };
  const real = { page: await pagePart(APP), shell: await shellPart(undefined),
    polish: pairIn(W.flagEn, W.flagPl) && pairIn(W.propEn, W.propPl) && /\n    "Review": "Przegląd",/.test(langText) };
  const parts = Object.assign({}, real);
  check(Object.values(parts).every(Boolean),
    "si94 Review no longer draws a paid-waits placeholder (the gate refuses in the shell); the shell still refuses flag and proposals as a stop and the Polish keys remain in ui/lang.js: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si95, as shipped no client id is configured and nothing is offered; a configured table offers what it configures, in order -- */
await leg("si95", async () => {
  const scenario = async (CC, root) => {
    const tableEmpty = Array.isArray(CC.SIGN_IN_PROVIDERS) && CC.SIGN_IN_PROVIDERS.length === 2
      && CC.SIGN_IN_PROVIDERS.every((p) => p.clientId === "" && p.clientSecret === "");
    const shippedOffered = CC.signInProviders().map((p) => p.id);
    const shippedNone = shippedOffered.length === 0 && CC.providerOf("microsoft") === null && CC.providerOf("google") === null
      && CC.PROVIDERS_NOW === CC.SIGN_IN_PROVIDERS;
    const calls = [];
    const thread = (verb) => { calls.push(verb); return Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID } } : verb === "publishProject" ? { refused: "x" } : {}); };
    const sh = await shellOn({ root, thread, stopped: true });
    let shellNone = false, actsNotWaiting = false, hostSignIn = [], licSignIn = [];
    try {
      const h = await sh.ask("studio:host"), l = await sh.ask("studio:licence");
      hostSignIn = h.signIn || [];
      licSignIn = l.signIn || [];
      shellNone = Array.isArray(h.signIn) && h.signIn.length === 0 && !h.signinPreview
        && Array.isArray(l.signIn) && l.signIn.length === 0 && !l.signinPreview;
      const stats = await sh.ask("studio:stats", TEAM_DIR);
      const proposals = await sh.ask("studio:proposals", TEAM_DIR);
      const flag = await sh.ask("studio:flag-keep", TEAM_DIR, "c1");
      const publish = await sh.ask("studio:publish", TEAM_DIR, {});
      /* Nothing offered and nobody signed in: the acts are refused as a stop, never as a wait for a sign-in that cannot be had, and
         nothing reaches the thread (was: not held at all, statistics read). */
      actsNotWaiting = [stats, proposals, flag, publish].every((r) => !!r && !!r.said && r.said.why === "stopped")
        && calls.indexOf("statsFor") < 0;
    } finally { sh.done(); }
    const pageNone = await studio(Object.assign({}, HELD0, { signIn: licSignIn }), { host: { signIn: hostSignIn } });
    const doorStateFn = pageNone.get("studioDoorState");
    const pageQuiet = !/data-signin-door/.test(pageNone.main()) && !/data-signin-foot/.test(pageNone.rail())
      && !/data-signin-account/.test(pageNone.sx()) && !pageNone.get("paidWaits") && !!doorStateFn && doorStateFn().state === "none";
    const both = CC.signInProviders([MS, GG]), reversed = CC.signInProviders([GG, MS]);
    const msOnly = CC.signInProviders([MS, Object.assign({}, GG, { clientId: "" })]);
    const ggOnly = CC.signInProviders([Object.assign({}, MS, { clientId: "" }), GG]);
    const sameShape = (got, base) => got.id === base.id && got.issuer === base.issuer && got.authorize === base.authorize
      && got.token === base.token && got.scope === base.scope && got.refreshScope === base.refreshScope
      && JSON.stringify(got.extra) === JSON.stringify(base.extra);
    const configuredOrder = both.map((p) => p.id).join() === "microsoft,google"
      && reversed.map((p) => p.id).join() === "google,microsoft"
      && msOnly.map((p) => p.id).join() === "microsoft"
      && ggOnly.map((p) => p.id).join() === "google"
      && sameShape(both[0], CC.SIGN_IN_PROVIDERS[0])
      && sameShape(both[1], CC.SIGN_IN_PROVIDERS[1])
      && both[0].clientId === MS.clientId
      && both[1].clientId === GG.clientId;
    return { shippedEmpty: tableEmpty && shippedNone, shellNone, actsNotWaiting, pageQuiet, configuredOrder };
  };
  const real = await scenario(C, ROOT);
  const { tree: cfgTree, planted: cfgPlanted } = treeWithIds("tree-si95-cfg", MS.clientId, GG.clientId);
  const { tree: oneTree, planted: onePlanted } = treeWithIds("tree-si95-one", "", GG.clientId);
  let cfgShell = false;
  if (cfgPlanted && onePlanted) {
    const s2 = await shellOn({ root: cfgTree }), s1 = await shellOn({ root: oneTree });
    try {
      const h2 = await s2.ask("studio:host"), h1 = await s1.ask("studio:host");
      cfgShell = JSON.stringify(h2.signIn) === '["microsoft","google"]' && JSON.stringify(h1.signIn) === '["google"]';
    } finally { s2.done(); s1.done(); }
  }
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  if (!PLANTS_OFF) {
    const tId = plantedTree("si95-shipped-id", [[path.join("src", "licence-client.mjs"),
      'clientId: "", clientSecret: "", service: "", /* plant:shipped-empty-ms */',
      'clientId: "11112222-3333-4444-5555-666677778888", clientSecret: "", service: "",']]);
    if (!tId) planted.shippedId = "anchor";
    else {
      const rId = await scenario(await import(pathToFileURL(path.join(tId, "src", "licence-client.mjs")).href + "?si95id"), tId);
      planted.shippedId = Object.values(rId).every(Boolean) ? "held" : "red";
    }
    const tFilter = plantedTree("si95-filter", [[path.join("src", "licence-client.mjs"),
      'typeof p.clientId === "string" && p.clientId !== "") /* plant:sign-in-filter */',
      'typeof p.clientId === "string")']]);
    if (!tFilter) planted.filter = "anchor";
    else {
      const rF = await scenario(await import(pathToFileURL(path.join(tFilter, "src", "licence-client.mjs")).href + "?si95flt"), tFilter);
      planted.filter = Object.values(rF).every(Boolean) ? "held" : "red";
    }
  }
  const parts = Object.assign({}, real, { cfgShell, plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si95 as shipped no client id is configured and nothing is offered, and a Studio nobody signed in to is refused its acts as a stop (was: not held); a configured table offers what it configures, in order: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

/* ---- si96, listPeople keeps reduction and stays (dropping malformed shapes) and seatStay signs seat/stay over Q.seatStayBytes ---- */
await leg("si96", async () => {
  const scenario = async (CL) => {
    const sent = [];
    let reply = { status: 200, body: { ok: true, people: [] } };
    const ask = async (route, bytes) => { sent.push({ route, body: JSON.parse(Buffer.from(bytes).toString("utf8")) }); return { status: reply.status, bytes: Buffer.from(JSON.stringify(reply.body)) }; };
    const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(open.public, "hex")]), format: "der", type: "spki" });
    const verify = (bytes, sig) => !!sig && crypto.verify(null, Buffer.from(bytes), pub, Buffer.from(String(sig), "hex"));
    const basePeople = [
      { code: ADA, person: PERSON_ADA, signedIn: "2026-11-11", stays: true },
      { code: DORA, person: "b2".repeat(32), signedIn: "2026-11-09", stays: false },
      { code: KIT, person: PERSON_KIT, signedIn: "2026-11-08", stays: "yes" },
    ];
    reply = { status: 200, body: { ok: true, people: basePeople, reduction: { at: "2026-12-01", seats: 2, seated: 4 } } };
    const good = await CL.listPeople(ask, open, NOW);
    const badSamples = [
      "wrong-type",
      [],
      { at: "2026-12-01", seats: -1, seated: 2 },
      { at: "2026-12-01", seats: 1, seated: -2 },
      { at: "2026-12-01", seats: 1.5, seated: 2 },
      { at: "not-a-day", seats: 1, seated: 2 },
      { at: "2026-02-30", seats: 1, seated: 2 },
    ];
    const dropped = [];
    for (const bad of badSamples) {
      reply = { status: 200, body: { ok: true, people: basePeople, reduction: bad } };
      const r = await CL.listPeople(ask, open, NOW);
      dropped.push(r.ok === true && r.reduction === undefined);
    }
    reply = { status: 200, body: { ok: true, kind: "desk", stays: 2 } };
    const staySent = typeof CL.seatStay === "function" ? await CL.seatStay(ask, open, "desk", [PERSON_KIT, PERSON_ADA], NOW + 1) : null;
    const sb = sent.find((x) => x.route === "seat/stay");
    const cleared = typeof CL.seatStay === "function" ? await CL.seatStay(ask, open, "desk", [], NOW + 2) : null;
    const cb = sent.filter((x) => x.route === "seat/stay")[1];
    const beforeBad = sent.length;
    const badHex = typeof CL.seatStay === "function" ? await CL.seatStay(ask, open, "desk", ["not-hex"], NOW + 3) : null;
    const dupHex = typeof CL.seatStay === "function" ? await CL.seatStay(ask, open, "desk", [PERSON_ADA, PERSON_ADA], NOW + 4) : null;
    const afterBad = sent.length;
    reply = { status: 409, body: { ok: false, reason: "full" } };
    const refused = typeof CL.seatStay === "function" ? await CL.seatStay(ask, open, "desk", [PERSON_ADA], NOW + 5) : null;
    return {
      goodReduction: !!good && good.ok === true && JSON.stringify(good.reduction) === JSON.stringify({ at: "2026-12-01", seats: 2, seated: 4 }),
      staysKept: !!good && good.people[0].stays === true && good.people[1].stays === false && good.people[2].stays === undefined,
      malformedDropped: dropped.length === badSamples.length && dropped.every(Boolean),
      stayBody: !!staySent && staySent.ok === true && !!sb && sb.body.kind === "desk"
        && JSON.stringify(sb.body.persons) === JSON.stringify([PERSON_KIT, PERSON_ADA])
        && JSON.stringify(Object.keys(sb.body).sort()) === '["kind","lead","persons","sig","t"]'
        && verify(Q.seatStayBytes({ kind: "desk", persons: [PERSON_KIT, PERSON_ADA], lead: open.public, t: NOW + 1 }), sb.body.sig),
      stayClear: !!cleared && cleared.ok === true && !!cb && JSON.stringify(cb.body.persons) === "[]"
        && verify(Q.seatStayBytes({ kind: "desk", persons: [], lead: open.public, t: NOW + 2 }), cb.body.sig),
      stayInvalidUnsent: !!badHex && badHex.ok === false && !!dupHex && dupHex.ok === false && afterBad === beforeBad,
      stayRefused: !!refused && refused.ok === false && refused.reason === "full",
    };
  };
  const real = await scenario(C);
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  const plants = [
    ["seat-team-client-reduction", "if (!validDay(r.at)) return null; /* plant:seat-team-client-reduction */", "if (typeof r.at !== \"string\") return null;", "malformedDropped"],
    ["seat-team-client-stays", "typeof x.stays === \"boolean\" ? { stays: x.stays } : {} /* plant:seat-team-client-stays */", "{}", "staysKept"],
    ["seat-team-client-stay", "Q.seatStayBytes({ kind: k, persons: list, lead, t }) /* plant:seat-team-client-stay */", "Q.seatStayBytes({ kind: k, persons: list.slice().sort(), lead, t })", "stayBody"],
  ];
  for (const [name, from, to, part] of PLANTS_OFF ? [] : plants) {
    const t = plantedTree(name, [[path.join("src", "licence-client.mjs"), from, to]]);
    if (!t) { planted[name] = "anchor"; continue; }
    const r = await scenario(await import(pathToFileURL(path.join(t, "src", "licence-client.mjs")).href + "?" + name));
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si96 listPeople keeps well-formed reduction and boolean stays while dropping malformed reduction (type, negative count, bad day) and non-boolean stays;"
    + " seatStay signs seat/stay over Q.seatStayBytes in choice order: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

/* ---- si97, shell studio:people-list hands {reduction, people[].stays} and studio:seat-stay signs seat/stay and maps refusals ---- */
await leg("si97", async () => {
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [] } } : {});
  const scenario = async (root) => {
    const sh = await shellOn({ thread, root });
    const was = answer, sent = [];
    let listReply = { ok: true, people: [
      { code: ADA, person: PERSON_ADA, signedIn: "2026-11-11", stays: true },
      { code: KIT, person: PERSON_KIT, signedIn: "2026-11-10", stays: false },
      { code: DORA, person: "b2".repeat(32), signedIn: "2026-11-09", stays: false },
    ], reduction: { at: "2026-12-01", seats: 1, seated: 2 } };
    let stayReply = { status: 200, body: { ok: true, kind: "desk", stays: 1 } };
    answer = async (url, init) => {
      const route = String(url).replace(/^.*\/v1\//, "");
      const body = init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : {};
      sent.push({ route, body });
      if (route === "person/list") return { status: 200, body: JSON.stringify(listReply) };
      if (route === "seat/stay") return { status: stayReply.status, body: JSON.stringify(stayReply.body) };
      return { status: 404, body: "{}" };
    };
    const out = {};
    try {
      await sh.ask("studio:key-make");
      fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: ADA, signinOwner: true }));
      fs.writeFileSync(sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_ADA]: { code: ADA, at: 1 }, [PERSON_KIT]: { code: KIT, at: 1 } } }));
      const listed = await sh.ask("studio:people-list", TEAM_DIR);
      const adaRow = listed && listed.people && listed.people.find((p) => p.person === PERSON_ADA);
      const kitRow = listed && listed.people && listed.people.find((p) => p.person === PERSON_KIT);
      const doraRow = listed && listed.people && listed.people.find((p) => p.person === PERSON_DORA);
      out.listRed = !!listed && JSON.stringify(listed.reduction) === JSON.stringify({ at: "2026-12-01", seats: 1, seated: 2 })
        /* Moved for board 1017: old "no pseudonym on the row" (the page keyed rows by code); new: the row is the pseudonym's, no code, the
           owner's own marked. */
        && !!adaRow && adaRow.stays === true && adaRow.seated === true && adaRow.owner === true && !("code" in adaRow)
        && !!kitRow && kitRow.stays === false && kitRow.seated === true
        && !!doraRow && doraRow.stays === false && doraRow.seated === undefined;
      listReply = { ok: true, people: [{ code: ADA, person: PERSON_ADA, signedIn: "2026-11-11" }, { code: DORA, person: "b2".repeat(32), signedIn: "2026-11-09" }] };
      const plain = await sh.ask("studio:people-list", TEAM_DIR);
      out.noRedFilters = !!plain && plain.reduction === undefined && JSON.stringify(plain.people.map((p) => p.person)) === JSON.stringify([PERSON_DORA]);
      const saved = await sh.ask("studio:seat-stay", TEAM_DIR, [PERSON_KIT, PERSON_ADA]);
      const sb = sent.find((x) => x.route === "seat/stay");
      const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(sh.mod ? sh.file("licence-service.json") && sb.body.lead : sb.body.lead, "hex")]), format: "der", type: "spki" });
      out.staySent = !!saved && saved.stays === 1 && !!sb && sb.body.kind === "desk"
        && JSON.stringify(sb.body.persons) === JSON.stringify([PERSON_KIT, PERSON_ADA])
        && crypto.verify(null, Buffer.from(Q.seatStayBytes({ kind: "desk", persons: [PERSON_KIT, PERSON_ADA], lead: sb.body.lead, t: sb.body.t })), pub, Buffer.from(String(sb.body.sig), "hex"));
      stayReply = { status: 409, body: { ok: false, reason: "full" } };
      const refFull = await sh.ask("studio:seat-stay", TEAM_DIR, [PERSON_ADA]);
      stayReply = { status: 404, body: { ok: false, reason: "no-seat" } };
      const refNone = await sh.ask("studio:seat-stay", TEAM_DIR, [PERSON_ADA]);
      stayReply = { status: 403, body: { ok: false, reason: "not-lead" } };
      const refLead = await sh.ask("studio:seat-stay", TEAM_DIR, [PERSON_ADA]);
      out.refusals = !!refFull && !!refFull.said && refFull.said.frame === "More people are chosen than the licence will have seats for, so nothing was changed."
        && !!refNone && !!refNone.said && refNone.said.frame === "One of the people chosen no longer holds a seat on this licence, so nothing was changed."
        && !!refLead && !!refLead.said && refLead.said.frame.indexOf("no longer holds a lead seat") >= 0;
    } finally { answer = was; sh.done(); }
    return out;
  };
  const real = await scenario(undefined);
  const preload = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  const preloadOk = /seatStay:\s*\(dir,\s*codes\)\s*=>\s*ipcRenderer\.invoke\("studio:seat-stay",\s*dir,\s*codes\)/.test(preload);
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  const plants = [
    ["seat-team-shell-list", "return Object.assign({ people: rows, invites, confirms, relay: !!relayId }, red ? { reduction: red } : {}, staysKept.length ? { staysKept } : {}); /* plant:seat-team-shell-list */", "return { people: rows, invites, confirms };", "listRed"],
    ["seat-team-shell-stay", "if (!a || a.ok !== true) throw R.refuse(licenceSaid(a && (C.STAY_REFUSED[a.reason] || a.reason))); /* plant:seat-team-shell-stay */", "if (!a || a.ok !== true) throw R.refuse(licenceSaid(\"unreached\"));", "refusals"],
  ];
  for (const [name, from, to, part] of PLANTS_OFF ? [] : plants) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to]]);
    if (!t) { planted[name] = "anchor"; continue; }
    const r = await scenario(t);
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { preloadOk, plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si97 studio:people-list hands the page {reduction, people[].stays} keeping seated people during a reduction and filtering as before without one;"
    + " studio:seat-stay signs seat/stay for the chosen persons and maps refusals through licenceSaid: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

/* ---- si98, Team screen shows reduction line, staying tags, owner locked staying, co-lead and owner controls and save ---- */
await leg("si98", async () => {
  const OWNER = Object.assign({}, SIGNED, { signinOwner: true, signinCode: ADA });
  const COLEAD = Object.assign({}, SIGNED, { signinOwner: false, signinCode: "ZZZZ0000YYYY1111" });
  const RED = { at: "2026-12-01", seats: 2, seated: 3 };
  const RED_PEOPLE = [
    { person: PERSON_ADA, owner: true, signedIn: "2026-11-11", stays: true, seated: true },
    { person: PERSON_DORA, signedIn: "2026-11-10", stays: true, seated: true },
    { person: PERSON_KIT, signedIn: "2026-11-09", stays: false, seated: true },
  ];
  const scenario = async (source) => {
    const none = await teamOn(OWNER, { source });
    const noneH = none.main();
    let stayReply = { error: null, stays: 1 };
    const own = await teamOn(OWNER, { source, api: {
      peopleList: () => Promise.resolve({ error: null, reduction: RED, people: JSON.parse(JSON.stringify(RED_PEOPLE)) }),
      seatStay: () => Promise.resolve(stayReply),
    } });
    const ownH = own.main();
    const rowOf = (h, code) => { const i = h.indexOf('data-person="' + code + '"'); return i < 0 ? "" : h.slice(i, h.indexOf('data-person="', i + 20) > 0 ? h.indexOf('data-person="', i + 20) : h.indexOf("data-person-invite-row", i)); };
    const adaR = rowOf(ownH, PERSON_ADA), doraR = rowOf(ownH, PERSON_DORA), kitR = rowOf(ownH, PERSON_KIT);
    await own.press("person-stay", { "data-v": PERSON_DORA });
    await own.press("person-stay", { "data-v": PERSON_KIT });
    await own.press("seat-stay-save");
    const savedH = own.main();
    stayReply = { error: "x", said: { frame: "More people are chosen than the licence will have seats for, so nothing was changed.", vars: {} } };
    await own.press("seat-stay-save");
    const refusedH = own.main();
    const co = await teamOn(COLEAD, { source, api: {
      peopleList: () => Promise.resolve({ error: null, reduction: RED, people: JSON.parse(JSON.stringify(RED_PEOPLE.slice(1))) }),
      seatStay: () => Promise.resolve({ error: null, stays: 1 }),
    } });
    const coH = co.main();
    await co.press("person-stay", { "data-v": PERSON_DORA });
    await co.press("seat-stay-save");
    return {
      noReductionNothingNew: !/data-people-reduction|data-person-stays|data-act="person-stay"|data-act="seat-stay-save"/.test(noneH),
      reductionLine: /data-people-reduction/.test(ownH) && plainText(ownH).indexOf("From 1 Dec, seats on this licence: 2. Seated now: 3.") >= 0,
      ownerRowLocked: /data-person-stays/.test(adaR) && !/data-act="person-stay"/.test(adaR) && !/data-act="person-admit"/.test(adaR),
      defaultMarked: /data-person-stays/.test(doraR) && new RegExp('data-act="person-stay"[^>]*data-v="' + PERSON_DORA + '"').test(doraR) && /aria-checked="true"/.test(doraR)
        && !/data-person-stays/.test(kitR) && new RegExp('data-act="person-stay"[^>]*data-v="' + PERSON_KIT + '"').test(kitR) && /aria-checked="false"/.test(kitR),
      savedChoice: own.calls.indexOf("seatStay:" + TEAM_DIR + "," + PERSON_KIT) >= 0 && /data-seat-stay-saved/.test(savedH)
        && /data-person-stays/.test(rowOf(savedH, PERSON_KIT)) && !/data-person-stays/.test(rowOf(savedH, PERSON_DORA)),
      refusalShown: /data-seat-stay-refused/.test(refusedH) && plainText(refusedH).indexOf("More people are chosen than the licence will have seats for, so nothing was changed.") >= 0,
      coLeadCanChange: /data-people-reduction/.test(coH) && /data-act="person-stay"/.test(coH) && /data-act="seat-stay-save"/.test(coH)
        && co.calls.indexOf("seatStay:" + TEAM_DIR + ",") >= 0,
    };
  };
  const real = await scenario(APP);
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  const plants = [
    ["seat-team-ui-line", "const redLine = red ? '<p class=\"n\" data-people-reduction>' /* plant:seat-team-ui-line */", "const redLine = false ? '<p class=\"n\" data-people-reduction>'", "reductionLine"],
    ["seat-team-ui-owner", "const isOwner = (p) => p.owner === true; /* plant:seat-team-ui-owner */", "const isOwner = () => false;", "ownerRowLocked"],
    ["seat-team-ui-save", "const r = await API.seatStay(dir, chosen); /* plant:seat-team-ui-save */", "const r = null;", "savedChoice"],
  ];
  for (const [name, from, to, part] of PLANTS_OFF ? [] : plants) {
    const t = plantedTree(name, [[path.join("ui", "app.js"), from, to]]);
    if (!t) { planted[name] = "anchor"; continue; }
    const r = await scenario(fs.readFileSync(path.join(t, "ui", "app.js"), "utf8"));
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si98 Team screen shows reduction line with DATE/COUNT/SEATED only when reduction is present, marks staying rows, keeps owner staying with no control,"
    + " lets owner and co-lead toggle and save through seat/stay: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

/* ---- si99, listPeople keeps waiting: true and drops any other value (piece d) ---- */
await leg("si99", async () => {
  const scenario = async (CL) => {
    const body = {
      ok: true,
      people: [
        { code: ADA, person: PERSON_ADA, signedIn: "2026-11-11", waiting: true },
        { code: DORA, person: "b2".repeat(32), signedIn: "2026-11-10", waiting: false },
        { code: KIT, person: PERSON_KIT, signedIn: "2026-11-09", waiting: "yes" },
      ],
    };
    const ask = async () => ({ status: 200, bytes: Buffer.from(JSON.stringify(body)) });
    const r = await CL.listPeople(ask, open, NOW);
    return {
      keptTrue: !!r && r.ok === true && r.people[0] && r.people[0].waiting === true,
      droppedOther: !!r && r.ok === true && r.people[1] && !("waiting" in r.people[1]) && r.people[2] && !("waiting" in r.people[2]),
    };
  };
  const real = await scenario(C);
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  const plants = [
    ["seat-wait-client", "x.waiting === true ? { waiting: true } : {} /* plant:seat-wait-client */", "{}", "keptTrue"],
  ];
  for (const [name, from, to, part] of PLANTS_OFF ? [] : plants) {
    const t = plantedTree(name, [[path.join("src", "licence-client.mjs"), from, to]]);
    if (!t) { planted[name] = "anchor"; continue; }
    const r = await scenario(await import(pathToFileURL(path.join(t, "src", "licence-client.mjs")).href + "?" + name));
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si99 listPeople keeps waiting: true and drops any other value: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

/* ---- si100, shell studio:people-list passes waiting: true through (piece d) ---- */
await leg("si100", async () => {
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [] } } : {});
  const scenario = async (root) => {
    const sh = await shellOn({ thread, root });
    const was = answer;
    answer = async (url) => {
      const route = String(url).replace(/^.*\/v1\//, "");
      if (route === "person/list") {
        return {
          status: 200,
          body: JSON.stringify({
            ok: true,
            people: [
              { code: ADA, person: PERSON_ADA, signedIn: "2026-11-11", waiting: true, added: false },
              { code: DORA, person: "b2".repeat(32), signedIn: "2026-11-10", waiting: false },
              { code: KIT, person: PERSON_KIT, signedIn: "2026-11-09", waiting: "yes" },
            ],
          }),
        };
      }
      return { status: 404, body: "{}" };
    };
    try {
      await sh.ask("studio:key-make");
      fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
      const listed = await sh.ask("studio:people-list", TEAM_DIR);
      const adaRow = listed && listed.people && listed.people.find((p) => p.person === PERSON_ADA);
      const doraRow = listed && listed.people && listed.people.find((p) => p.person === PERSON_DORA);
      const kitRow = listed && listed.people && listed.people.find((p) => p.person === PERSON_KIT);
      return {
        passedTrue: !!adaRow && adaRow.waiting === true && adaRow.added === false,
        droppedOther: !!doraRow && !("waiting" in doraRow) && !!kitRow && !("waiting" in kitRow),
      };
    } finally { answer = was; sh.done(); }
  };
  const real = await scenario(undefined);
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  const plants = [
    ["seat-wait-shell-list", "p.waiting === true ? { waiting: true } : {} /* plant:seat-wait-shell-list */", "{}", "passedTrue"],
  ];
  for (const [name, from, to, part] of PLANTS_OFF ? [] : plants) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to]]);
    if (!t) { planted[name] = "anchor"; continue; }
    const r = await scenario(t);
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si100 studio:people-list passes waiting: true through and drops other values: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

/* ---- si101, Team screen shows waiting tag per waiting row, both tags when also not added, and keeps Add a seat undrawn while it leads nowhere (piece d) ---- */
await leg("si101", async () => {
  const OWNER = Object.assign({}, SIGNED, { signinOwner: true, signinCode: CODE1 });
  const WAIT_PEOPLE = [
    { person: PERSON_ADA, signedIn: "2026-11-11" },
    { person: PERSON_DORA, signedIn: "2026-11-10", waiting: true, added: false },
    { person: PERSON_KIT, signedIn: "2026-11-09", waiting: true },
  ];
  const rowOf = (h, code) => { const i = h.indexOf('data-person="' + code + '"'); return i < 0 ? "" : h.slice(i, h.indexOf('data-person="', i + 20) > 0 ? h.indexOf('data-person="', i + 20) : h.indexOf("data-person-invite-row", i)); };
  const scenario = async (source) => {
    const none = await teamOn(OWNER, { source });
    const noneH = none.main();
    const wait = await teamOn(OWNER, { source, people: WAIT_PEOPLE });
    const waitH = wait.main();
    const adaR = rowOf(waitH, PERSON_ADA), doraR = rowOf(waitH, PERSON_DORA), kitR = rowOf(waitH, PERSON_KIT);
    return {
      noneNothingNew: !/data-person-waiting|data-seat-add-placeholder|seat-add-placeholder/.test(noneH),
      nonWaitingRowQuiet: !/data-person-waiting/.test(adaR) && !/data-seat-add-placeholder/.test(adaR),
      bothTags: /data-person-not-added/.test(doraR) && /data-person-waiting/.test(doraR) && plainText(doraR).indexOf("waiting for a free seat") >= 0,
      secondRowTagOnly: /data-person-waiting/.test(kitR) && plainText(kitR).indexOf("waiting for a free seat") >= 0,
      noAddWhileNowhere: !/data-seat-add-placeholder|seat-add-placeholder|Add a seat/.test(waitH) && typeof wait.P.ACTS["seat-add-placeholder"] !== "function",
    };
  };
  const real = await scenario(APP);
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  const plants = [
    ["seat-wait-ui-tag", "const waitTag = p.waiting === true ? '<span class=\"tag\" data-person-waiting>' + esc(T(\"waiting for a free seat\")) + \"</span>\" : \"\"; /* plant:seat-wait-ui-tag */", "const waitTag = \"\";", "bothTags"],
    ["seat-wait-ui-add", "const addSeatCtrl = \"\"; /* plant:seat-wait-ui-add */", "const addSeatCtrl = '<button class=\"btn sm\" data-seat-add-placeholder>Add a seat…</button>';", "noAddWhileNowhere"],
  ];
  for (const [name, from, to, part] of PLANTS_OFF ? [] : plants) {
    const t = plantedTree(name, [[path.join("ui", "app.js"), from, to]]);
    if (!t) { planted[name] = "anchor"; continue; }
    const r = await scenario(fs.readFileSync(path.join(t, "ui", "app.js"), "utf8"));
    planted[name] = r[part] === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si101 Team screen shows waiting tag per waiting row, both tags when also not added, and keeps Add a seat undrawn while it leads nowhere: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

/* ---- si102, Save sends the kept choice for chosen persons not shown on screen as well ---- */
await leg("si102", async () => {
  const HIDDEN = "cc".repeat(32);
  const clientScenario = async (CL) => {
    const ask = async () => ({ status: 200, bytes: Buffer.from(JSON.stringify({
      ok: true,
      people: [{ code: ADA, person: PERSON_ADA, signedIn: "2026-11-11", stays: false }],
      reduction: { at: "2026-12-01", seats: 2, seated: 3 },
      staysKept: [HIDDEN, "not-hex", PERSON_ADA, HIDDEN],
    })) });
    const r = await CL.listPeople(ask, open, NOW);
    return { kept: !!r && r.ok === true && Array.isArray(r.staysKept) && JSON.stringify(r.staysKept) === JSON.stringify([HIDDEN]) };
  };
  const shellScenario = async (root) => {
    const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [] } } : {});
    const sh = await shellOn({ thread, root });
    const was = answer, sent = [];
    answer = async (url, init) => {
      const route = String(url).replace(/^.*\/v1\//, "");
      const body = init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : {};
      sent.push({ route, body });
      if (route === "person/list") return { status: 200, body: JSON.stringify({
        ok: true,
        people: [{ code: KIT, person: PERSON_KIT, signedIn: "2026-11-10", stays: false }],
        reduction: { at: "2026-12-01", seats: 2, seated: 3 },
        staysKept: [HIDDEN],
      }) };
      if (route === "seat/stay") return { status: 200, body: JSON.stringify({ ok: true, kind: "desk", stays: 2 }) };
      return { status: 404, body: "{}" };
    };
    try {
      await sh.ask("studio:key-make");
      fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: ADA, signinOwner: true }));
      const listed = await sh.ask("studio:people-list", TEAM_DIR);
      const saved = await sh.ask("studio:seat-stay", TEAM_DIR, [HIDDEN, PERSON_KIT]);
      const sb = sent.find((x) => x.route === "seat/stay");
      return {
        shellPassedKept: !!listed && Array.isArray(listed.staysKept) && JSON.stringify(listed.staysKept) === JSON.stringify([HIDDEN]),
        shellSentKept: !!saved && saved.stays === 2 && !!sb && JSON.stringify(sb.body.persons) === JSON.stringify([HIDDEN, PERSON_KIT]),
      };
    } finally { answer = was; sh.done(); }
  };
  const uiScenario = async (source) => {
    const OWNER = Object.assign({}, SIGNED, { signinOwner: true, signinCode: ADA });
    const RED = { at: "2026-12-01", seats: 2, seated: 4 };
    const RED_PEOPLE = [
      { person: PERSON_ADA, owner: true, signedIn: "2026-11-11", stays: true, seated: true },
      { person: PERSON_DORA, signedIn: "2026-11-10", stays: false, seated: true },
      { person: PERSON_KIT, signedIn: "2026-11-09", stays: false, seated: true },
    ];
    let sentStay = null;
    const own = await teamOn(OWNER, { source, api: {
      peopleList: () => Promise.resolve({ error: null, reduction: RED, people: JSON.parse(JSON.stringify(RED_PEOPLE)), staysKept: [HIDDEN] }),
      seatStay: (_dir, codes) => { sentStay = codes; return Promise.resolve({ error: null, stays: codes.length }); },
    } });
    await own.press("person-stay", { "data-v": PERSON_KIT });
    await own.press("seat-stay-save");
    return {
      uiSentKept: Array.isArray(sentStay) && sentStay.indexOf(HIDDEN) >= 0 && sentStay.indexOf(PERSON_KIT) >= 0,
    };
  };
  const real = Object.assign({}, await clientScenario(C), await shellScenario(undefined), await uiScenario(APP));
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
  const planted = PLANTS_OFF ? { off: "skipped" } : {};
  if (!PLANTS_OFF) {
    const tc = plantedTree("seat-team-client-kept", [[path.join("src", "licence-client.mjs"),
      "const staysKept = reduction ? [...keptSet].filter((p) => !shown.has(p)) : []; /* plant:seat-team-client-kept */",
      "const staysKept = [];"]]);
    if (!tc) planted.client = "anchor";
    else planted.client = (await clientScenario(await import(pathToFileURL(path.join(tc, "src", "licence-client.mjs")).href + "?kept"))).kept === false ? "red" : "held";
    const ts = plantedTree("seat-team-shell-kept", [[path.join("shell", "main.js"),
      "const staysKept = red && Array.isArray(a.staysKept) ? a.staysKept.filter((p) => typeof p === \"string\" && /^[0-9a-f]{64}$/.test(p)) : []; /* plant:seat-team-shell-kept */",
      "const staysKept = [];"]]);
    if (!ts) planted.shell = "anchor";
    else planted.shell = (await shellScenario(ts)).shellPassedKept === false ? "red" : "held";
    const tu = plantedTree("seat-team-ui-kept", [[path.join("ui", "app.js"),
      "const chosen = kept.concat(shown); /* plant:seat-team-ui-kept */",
      "const chosen = shown;"]]);
    if (!tu) planted.ui = "anchor";
    else planted.ui = (await uiScenario(fs.readFileSync(path.join(tu, "ui", "app.js"), "utf8"))).uiSentKept === false ? "red" : "held";
  }
  const parts = Object.assign({}, real, { plants: PLANTS_OFF || Object.values(planted).every((v) => v === "red") });
  check(Object.values(parts).every(Boolean),
    "si102 Save sends the kept choice for chosen persons not shown on screen as well: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" ") + " " + JSON.stringify(planted));
});

/* ---- si103, the lowered seat count reads as the copywriter wrote it, in both languages, refusals and the line on the rest included (piece c, d) ---- */
await leg("si103", async () => {
  const OWNER = Object.assign({}, SIGNED, { signinOwner: true, signinCode: ADA });
  const RED = { at: "2026-12-01", seats: 2, seated: 3 };
  const RED_PEOPLE = [
    { person: PERSON_ADA, owner: true, signedIn: "2026-11-11", stays: true, seated: true },
    { person: PERSON_DORA, signedIn: "2026-11-10", stays: true, seated: true },
    { person: PERSON_KIT, signedIn: "2026-11-09", stays: false, seated: true },
  ];
  const WAIT_PEOPLE = [
    { person: PERSON_ADA, signedIn: "2026-11-11" },
    { person: PERSON_DORA, signedIn: "2026-11-10", waiting: true, added: false },
  ];
  const WORDS = {
    en: {
      line: "From {DATE}, seats on this licence: 2. Seated now: 3.",
      stays: "stays", keeps: "Keeps a seat", save: "Save who stays", saved: "Who stays is saved.",
      full: "More people are chosen than the licence will have seats for, so nothing was changed.",
      none: "One of the people chosen no longer holds a seat on this licence, so nothing was changed.",
      waiting: "waiting for a free seat",
      rest: "From {DATE}, the seats of those not chosen are not renewed: each of their desks and Studios works until its last confirmation runs out, then stops.",
      add: "Add a seat…",
    },
    pl: {
      line: "Od {DATE} miejsca w tej licencji: 2. Zajęte teraz: 3.",
      stays: "zostaje", keeps: "Zachowuje miejsce", save: "Zapisz, kto zostaje", saved: "Zapisano, kto zostaje.",
      full: "Wybrano więcej osób, niż licencja będzie mieć miejsc, więc nic nie zostało zmienione.",
      none: "Jedna z wybranych osób nie ma już miejsca w tej licencji, więc nic nie zostało zmienione.",
      waiting: "czeka na wolne miejsce",
      rest: "Od {DATE} miejsca osób niewybranych nie są odnawiane: każde ich stanowisko i Studio działa do wygaśnięcia ostatniego potwierdzenia, a potem się zatrzymuje.",
      add: "Dodaj miejsce…",
    },
  };
  const FRAMES = {
    full: "More people are chosen than the licence will have seats for, so nothing was changed.",
    none: "One of the people chosen no longer holds a seat on this licence, so nothing was changed.",
  };
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withDate = (tpl) => new RegExp(reEsc(tpl).replace("\\{DATE\\}", "(.{3,12}?)"));
  const rowOf = (h, code) => { const i = h.indexOf('data-person="' + code + '"'); return i < 0 ? "" : h.slice(i, h.indexOf('data-person="', i + 20) > 0 ? h.indexOf('data-person="', i + 20) : h.indexOf("data-person-invite-row", i)); };
  const scenario = async (source, lang) => {
    const W = WORDS[lang];
    let stayReply = { error: null, stays: 1 };
    const own = await teamOn(OWNER, { lang, source, api: {
      peopleList: () => Promise.resolve({ error: null, reduction: RED, people: JSON.parse(JSON.stringify(RED_PEOPLE)) }),
      seatStay: () => Promise.resolve(stayReply),
    } });
    const ownH = own.main(), ownT = plainText(ownH);
    const adaT = plainText(rowOf(ownH, PERSON_ADA)), kitT = plainText(rowOf(ownH, PERSON_KIT));
    await own.press("person-stay", { "data-v": PERSON_KIT });
    await own.press("seat-stay-save");
    const savedT = plainText(own.main());
    stayReply = { error: "x", said: { frame: FRAMES.full, vars: {}, why: "full" } };
    await own.press("seat-stay-save");
    const fullT = plainText(own.main());
    stayReply = { error: "x", said: { frame: FRAMES.none, vars: {}, why: "none" } };
    await own.press("seat-stay-save");
    const noneT = plainText(own.main());
    const none = await teamOn(OWNER, { lang, source });
    const noneH = none.main(), noneNoT = plainText(noneH);
    const wait = await teamOn(OWNER, { lang, source, people: WAIT_PEOPLE });
    const waitH = wait.main();
    const lineM = ownT.match(withDate(W.line)), restM = ownT.match(withDate(W.rest));
    return {
      line: !!lineM,
      stays: adaT.indexOf(W.stays) >= 0,
      keeps: kitT.indexOf(W.keeps) >= 0,
      save: ownT.indexOf(W.save) >= 0,
      saved: savedT.indexOf(W.saved) >= 0,
      full: fullT.indexOf(W.full) >= 0,
      none: noneT.indexOf(W.none) >= 0,
      waiting: plainText(waitH).indexOf(W.waiting) >= 0,
      rest: !!restM && !!lineM && restM[1] === lineM[1] && /data-people-reduction-rest/.test(ownH)
        && ownH.indexOf("data-people-reduction-rest") > ownH.indexOf("data-people-reduction>"),
      restOnlyComing: !/data-people-reduction-rest/.test(noneH) && !withDate(W.rest).test(noneNoT),
      noAdd: !/Add a seat|Dodaj miejsce|data-seat-add-placeholder/.test(ownH + waitH + noneH),
    };
  };
  const en = await scenario(APP, "en"), pl = await scenario(APP, "pl");
  const parts = {};
  for (const k of Object.keys(en)) { parts["en." + k] = en[k]; parts["pl." + k] = pl[k]; }
  const shellText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"), langText = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  parts.shellFrames = shellText.indexOf('"stay-full": "' + FRAMES.full + '"') >= 0 && shellText.indexOf('"stay-none": "' + FRAMES.none + '"') >= 0;
  parts.langRows = [WORDS.pl.line.replace("2.", "{COUNT}.").replace("3.", "{SEATED}."), WORDS.pl.stays, WORDS.pl.keeps, WORDS.pl.save, WORDS.pl.saved, WORDS.pl.full, WORDS.pl.none, WORDS.pl.waiting, WORDS.pl.rest]
    .every((v) => langText.indexOf('"' + v.replace("{DATE}", "{DATE}") + '"') >= 0);
  check(Object.values(parts).every(Boolean),
    "si103 the lowered seat count, the two refusals, the waiting tag and the line on the rest read as the copywriter wrote them in both languages; the line on the rest shows only during a coming reduction; Add a seat stays undrawn: "
    + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* THE NAMED PERSON'S OWN PRESS (board 1011; the product designer's sheet .words-in/naming.png, the copywriter's third piece): the account
   button's violet bubble, once per naming, Accept moves nothing but at the press; Not now, Escape or a press elsewhere leave the naming as a row
   under Seat in Account, whose Accept... opens it again; with no lead seat free the same bubble says so with one button, Done. The words are
   the copywriter's, in both languages. */
await leg("NB1", async () => {
  const NAMING = { by: "Jan Kowalski", org: "Harbour & Co", until: "2026-11-27", key: "100", state: "ask" };
  const held = Object.assign({}, SIGNED, { signinCode: CODE3, signinOwner: false, naming: NAMING,
    licence: { status: "trial", trial: { until: "2026-11-27", ends: NOW + 9 * 86400000 }, unusable: null } });
  const moved = Object.assign({}, SIGNED, { signinCode: CODE3, naming: null });
  /* The whole leg over a page source: its five readings, each true or false. A plant is the same run over a source with one deciding line changed. */
  const run = async (source) => {
    const scene = async (lang, accept) => {
      const s = await studio(held, { lang, source, api: { licenceAccept: accept || (() => Promise.resolve(Object.assign({ error: null, namingResult: "ok" }, moved))) } });
      const shown = () => { const f = s.get("namingBubbleHtml"); return f && s.P.S.namingStep ? plainText(f()) : ""; };
      return { s, shown, step: () => s.P.S.namingStep || null, row: () => plainText(s.sx()) };
    };
    const sent = (x) => x.s.calls.filter((c) => /^licenceAccept/.test(c));
    const en = await scene("en");
    const asked = en.shown(), rowBefore = en.row();
    const a = en.step() === "ask" && asked.indexOf("Jan Kowalski has named this account a lead") >= 0 && asked.indexOf("On Harbour & Co's Etiuda licence; a team is made afterwards, with Make a team.") >= 0
      && asked.indexOf("Accept, and this Studio moves now onto the licence's paid lead seat; its own trial, until 27 Nov, is set aside. Projects stay exactly as they are.") >= 0
      && /Not now[\s\S]*Accept/.test(asked) && rowBefore.indexOf("Named a lead by") < 0 && sent(en).length === 0;
    await en.s.press("naming-notnow", {});
    const after = en.row();
    const notNow = en.step() === null && sent(en).length === 0 && after.indexOf("Named a lead by Jan Kowalski") >= 0
      && after.indexOf("On Harbour & Co's licence. Accepting moves this Studio onto its paid lead seat and sets the trial aside; projects stay as they are.") >= 0
      && after.indexOf("Accept…") >= 0 && /data-act="naming-open"/.test(en.s.sx());
    await en.s.press("naming-open", {});
    const bb = notNow && en.step() === "ask";
    await en.s.press("naming-accept", {});
    const c = en.s.calls.includes("licenceAccept") && en.step() === null && en.row().indexOf("Named a lead by") < 0 && en.s.P.S.lic.naming === null;
    const full = await scene("en", () => Promise.resolve(Object.assign({ error: null, namingResult: "full" }, held)));
    await full.s.press("naming-accept", {});
    const noSeat = full.shown();
    const fullOk = full.step() === "full" && noSeat.indexOf("No lead seat is free on that licence now") >= 0
      && noSeat.indexOf("Every lead seat on Harbour & Co's licence is taken, so nothing changed: this Studio stays on its own trial, until 27 Nov.") >= 0
      && noSeat.indexOf("Jan Kowalski is told the seat could not be taken. When one is free, this asks again.") >= 0 && noSeat.indexOf("Done") >= 0 && noSeat.indexOf("Accept") < 0;
    await full.s.press("naming-done", {});
    const d = fullOk && full.step() === null && full.row().indexOf("Named a lead by Jan Kowalski") >= 0;
    const pl = await scene("pl");
    const plAsked = pl.shown();
    const e = plAsked.indexOf("Jan Kowalski wskazuje to konto jako lidera") >= 0 && plAsked.indexOf("Licencja Etiudy organizacji Harbour & Co; zespół tworzy się potem przyciskiem Utwórz zespół.") >= 0
      && plAsked.indexOf("Nie teraz") >= 0 && plAsked.indexOf("Przyjmij") >= 0;
    return { NB1a: a, NB1b: bb, NB1c: c, NB1d: d, NB1e: e };
  };
  const real = await run(APP);
  check(real.NB1a, "NB1a a naming the check found is asked once from the account button: who named them, on which licence, what Accept moves and what it does not, Not now"
    + " and Accept, and nothing is sent until a press");
  check(real.NB1b, "NB1b Not now sends nothing and leaves the naming as a row under Seat in Account, in the Seat row's own form, whose Accept... opens the bubble again");
  check(real.NB1c, "NB1c Accept is sent at the press and, once taken, the bubble and the row are gone");
  check(real.NB1d, "NB1d Accept with no lead seat free turns the same bubble into what happened, with one button, Done; the row stays");
  check(real.NB1e, "NB1e the bubble reads as the copywriter wrote it in Polish");
  /* Each deciding line changed alone turns the checks it decides red (the order is the plant's own). */
  const PLANTS = [
    { name: "nb-once", reds: ["NB1b"], from: "if (seen === n.key) { S.namingSeen = seen; return; }", to: "if (false) { S.namingSeen = seen; return; }" },
    { name: "nb-row", reds: ["NB1b", "NB1d"], from: "if (!n || S.namingStep) return null;", to: "return null;" },
    { name: "nb-sent", reds: ["NB1c"], from: "const r = await API.licenceAccept();", to: "const r = Object.assign({ error: null, namingResult: \"ok\" }, { naming: null });" },
    { name: "nb-full", reds: ["NB1d"], from: "if (r.namingResult === \"full\" && r.naming)", to: "if (false)" },
    { name: "nb-open", reds: ["NB1b"], from: "\"naming-open\": () => { if (!S.lic || !S.lic.naming) return; S.namingStep = \"ask\"; namingMount(); paint(); },", to: "\"naming-open\": () => {}," },
  ];
  for (const p of PLANTS) {
    if (process.env.ETIUDA_PLANTS === "off") { console.log("  skip nb plant " + p.name + " (ETIUDA_PLANTS=off)"); continue; }
    if (APP.split(p.from).length !== 2) { check(false, "NB1 plant " + p.name + " could not be placed in the page's source"); continue; }
    const got = await run(APP.replace(p.from, () => p.to));
    check(p.reds.every((id) => got[id] === false), "NB1 plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(got));
  }
});

/* ---- BOARD 1017, PIECES 2 AND 3: STUDIO NAMES A LEAD AND INVITES A MEMBER BY EMAIL ADDRESS, AND NO SIGN-IN CODE IS ON ANY SCREEN ------
   Max's rulings in decisions.md 669 and 676 (2026-11-20 22:16, "I definitely agree."; 2026-11-22 02:12, "Yes, remove it please."); the
   criterion is Claude alpha's reading of the product designer's sheet of 2026-11-22 (name-by-address.png); the words are the copywriter's
  (2026-11-22). The service's routes are core.mjs's (board 1017 piece 1).
   si104 Account, the owner's leads: each by name and address, the count with what waits, one field for an address or a name from the
          licence's teams with the matches offered as typed, Name as lead the one press (a pick names that person, an address names the
          address, anything else is said and sends nothing), no code row and no name-kept-here field
   si105 the waiting row (grey): the address, when, waiting for their next sign-in, Withdraw, and the line that no mail is sent; the confirm
          row (the mark colour), only for an unvouched candidate: who, the provider's line and its three facts, Decline and Confirm as lead;
          several candidates on one naming flagged; every lead seat taken while a naming waits said, with no Add a seat
   si106 the Team roster: Invite by email address where Admit by sign-in code stood, invitation links one press away, Invite sending the
          address alone, the invitation and the unvouched Join waiting under it with Withdraw, Decline and Confirm and admit, the desk seats
          taken said; the people by name and address, never a code
   si107 no code on any of Studio's screens: Account (owner, lead, a colleague's ask, colleagues to name), the account pop-over, the
          sign-in's refusal and the Team screen draw none, even handed one by an older shell; the page, preload and words hold no place for one
   si108 the shell, the owner's side, against a stubbed service: a naming by address sent as lead/invite and kept by its handle with
          what was typed, the seat list handed with pseudonyms and the typed address and no code, Free by pseudonym sent by code, Confirm and
          Withdraw by handle, a non-address sending nothing, a handle no longer listed forgotten
   si109 the shell, the member's side: an invitation sent with the team's relay id and kept by handle, the list by pseudonym with its
          invitations and its unvouched Joins (a vouched ask not among them), Admit by pseudonym sent by code, Confirm and admit, Decline and
          Withdraw sent as person/admit by ask, ask/refuse and invite/withdraw */
const H_ZOFIA = "1a".repeat(16), H_PIOTR = "2b".repeat(16), H_MAREK = "3c".repeat(16), ASK_PIOTR = "4d".repeat(16);
const P_OWN = "e0".repeat(32), P_JAN = "e1".repeat(32), P_PIOTR = "e2".repeat(32), P_EWA = "e3".repeat(32), P_TOM = "e4".repeat(32), P_OLA = "e5".repeat(32);
const DAY_MS = 86400000, JUST = Date.now() - 120000;
const OWNER_1017 = Object.assign({}, SIGNED, { signinCode: CODE1, signinOwner: true, orgDesks: false, orgDesksAsk: false });
const PIOTR = { person: P_PIOTR, name: "Piotr Zielinski", provider: "microsoft", account: "personal", at: JUST };
const seats1017 = (o = {}) => ({ error: null,
  seats: [{ person: P_OWN, name: "Marta Nowak", address: "marta.nowak@example.com", you: true, named: true, proved: "2026-11-03", seen: "2026-11-03", team: 4 },
    { person: P_JAN, name: "Jan Kowalski", address: "jan.kowalski@example.com", you: false, named: true, proved: "2026-11-09", seen: "2026-11-09", namedAt: "2026-11-09", team: 6 }],
  counts: o.counts || { lead: { held: 2, of: 5 }, desk: { held: 10, of: 20 } },
  namings: o.namings || [{ naming: H_ZOFIA, until: JUST + 30 * DAY_MS, at: JUST, address: "zofia.wisniewska@example.com", candidates: [] },
    { naming: H_PIOTR, until: JUST + 30 * DAY_MS, at: JUST, address: "piotr.zielinski@example.com", candidates: [PIOTR] }],
  unnamed: [{ person: P_TOM, seen: "2026-11-20" }], orgDesks: false,
  people: [{ person: P_EWA, name: "Ewa Lis", address: "ewa.lis@example.com" }, { person: P_OLA, name: "Ola Nowicka", address: "ola@example.com" }] });
/** The owner's Account on `source`, the seat list `seats` answered for every act. */
async function owner1017(source, seats, lang) {
  const answerSeats = () => Promise.resolve(JSON.parse(JSON.stringify(seats)));
  return studio(OWNER_1017, { source, lang, host: { signinDoor: true }, api: { licenceSeats: answerSeats, licenceNameAddress: answerSeats, licenceNamePerson: answerSeats,
    licenceNamingWithdraw: answerSeats, licenceConfirm: answerSeats, licenceSeatFree: answerSeats } });
}

async function run1017(source) {
  const out = {};
  /* si104 */
  const s = await owner1017(source, seats1017());
  const acct = s.sx(), t = plainText(acct);
  const leadsAt = acct.indexOf("data-lead-seats"), fieldAt = acct.indexOf("data-lead-name-field");
  out.si104a = /data-lead-seat="e0e0[^"]*"[\s\S]*?<b>Marta Nowak<\/b><span class="ad">marta\.nowak@example\.com<\/span>/.test(acct)
    && /data-lead-seat="e1e1[^"]*"[\s\S]*?<b>Jan Kowalski<\/b><span class="ad">jan\.kowalski@example\.com<\/span>/.test(acct)
    && t.indexOf("named: 2 of 5 · waiting: 2") >= 0 && leadsAt > 0 && fieldAt > leadsAt
    && /placeholder="email address, or a name from your teams"/.test(acct) && (acct.match(/data-act="lic-name-go"/g) || []).length === 1
    && !/data-signin-code|data-seat-name|name, kept on this computer|Your sign-in code/.test(acct);
  s.P.S.licNameTyped = "ew";
  const typing = s.sx();
  const sug = /data-lead-sug-list[\s\S]*?On your teams[\s\S]*?data-act="lic-name-pick" data-v="e3e3[^"]*"[\s\S]*?Ewa Lis/.test(typing)
    && !/data-v="e5e5/.test(typing) && plainText(typing).indexOf('"ew" is not an email address yet') >= 0;
  /* The field as the browser holds it: what the pick filled in, then what is typed. */
  const field = s.home.node("#main input[data-lead-name-field]");
  await s.press("lic-name-pick", { "data-v": P_EWA });
  field.value = s.P.S.licNameTyped;
  await s.press("lic-name-go");
  const picked = s.calls.filter((c) => /^licenceName/.test(c));
  field.value = "  new.lead@example.com ";
  await s.press("lic-name-go");
  field.value = "nonsense";
  await s.press("lic-name-go");
  const named = s.calls.filter((c) => /^licenceName/.test(c));
  out.si104b = sug && JSON.stringify(picked) === JSON.stringify(["licenceNamePerson:" + P_EWA])
    && JSON.stringify(named) === JSON.stringify(["licenceNamePerson:" + P_EWA, "licenceNameAddress:new.lead@example.com"])
    && plainText(s.sx()).indexOf('"nonsense" is not an email address yet') >= 0;
  /* si105 */
  const w = await owner1017(source, seats1017());
  const wa = w.sx();
  const waitRow = (/<div class="sx-row si-seat si-wait" data-lead-waiting="1a1a[^"]*">[\s\S]*?<\/div><\/div><\/div>/.exec(wa) || [""])[0];
  const confirmRows = wa.match(/class="sx-row si-seat si-confirm"/g) || [];
  const confirmRow = (/<div class="sx-row si-seat si-confirm" data-lead-confirm="2b2b[^"]*">[\s\S]*?<\/div><\/div>/.exec(wa) || [""])[0];
  const cText = plainText(confirmRow), wText = plainText(waitRow);
  out.si105a = wText.indexOf("zofia.wisniewska@example.com · named today,") >= 0 && wText.indexOf("waiting for their Accept") >= 0
    && /data-act="lic-naming-withdraw" data-v="1a1a[^"]*">Withdraw</.test(waitRow)
    && wText.indexOf("No mail is sent. The person meets the naming the next time they sign in to Studio with this address, and accepts it there; tell them yourself if you like.") >= 0;
  out.si105b = confirmRows.length === 1 && cText.indexOf("Piotr Zielinski") >= 0 && cText.indexOf("piotr.zielinski@example.com") >= 0 && cText.indexOf("accepted today,") >= 0
    && cText.indexOf("waits for you to confirm") >= 0
    && cText.indexOf("Microsoft does not vouch for this address, so the seat is taken only once you confirm this is the colleague you named. What Microsoft says of the account:") >= 0
    && cText.indexOf("Name Piotr Zielinski") >= 0 && cText.indexOf("Signed in with Microsoft") >= 0 && cText.indexOf("Account personal, not an organisation's") >= 0
    && /data-act="lic-naming-withdraw" data-v="2b2b[^"]*">Decline<\/button><button class="btn sm solid" data-act="lic-confirm" data-v="2b2b[^"]*" data-p="e2e2[^"]*">Confirm as lead</.test(confirmRow)
    && !/data-lead-several|data-lead-full|Add a seat/.test(wa);
  await w.press("lic-naming-withdraw", { "data-v": H_ZOFIA });
  await w.press("lic-confirm", { "data-v": H_PIOTR, "data-p": P_PIOTR });
  out.si105c = JSON.stringify(w.calls.filter((c) => /^licence(NamingWithdraw|Confirm)/.test(c))) === JSON.stringify(["licenceNamingWithdraw:" + H_ZOFIA, "licenceConfirm:" + H_PIOTR + "," + P_PIOTR]);
  const two = await owner1017(source, seats1017({ counts: { lead: { held: 4, of: 4 }, desk: { held: 10, of: 20 } },
    namings: [{ naming: H_PIOTR, until: JUST + 30 * DAY_MS, at: JUST, address: "piotr.zielinski@example.com",
      candidates: [PIOTR, { person: P_TOM, name: "P. Zielinski", provider: "microsoft", account: "work", at: JUST }] }] }));
  const tw = two.sx();
  out.si105d = (tw.match(/data-lead-several/g) || []).length === 2 && plainText(tw).indexOf("Account an organisation's") >= 0
    && plainText(tw).indexOf("Every lead seat on this licence is taken, so a person's Accept waits until one is free or a seat is added.") >= 0 && !/Add a seat/.test(tw);
  const vouched = await owner1017(source, seats1017({ namings: [{ naming: H_ZOFIA, until: JUST + 30 * DAY_MS, at: JUST, address: "zofia.wisniewska@example.com", candidates: [] }] }));
  out.si105e = !/si-confirm/.test(vouched.sx()) && /si-wait/.test(vouched.sx());
  const pl = await owner1017(source, seats1017(), "pl");
  const plt = plainText(pl.sx());
  out.si105f = plt.indexOf("wskazani: 2 z 5 · czekają: 2") >= 0 && plt.indexOf("czeka na przyjęcie przez tę osobę") >= 0 && plt.indexOf("Potwierdź jako lidera") >= 0
    && plt.indexOf("Microsoft nie poświadcza tego adresu") >= 0 && plt.indexOf("Konto: osobiste, nie organizacji") >= 0 && plt.indexOf("Wycofaj") >= 0;
  /* si106 */
  const peopleAnswer = { error: null, people: [{ person: P_TOM, signedIn: "2026-11-20", added: false }, { person: P_OLA, name: "Ola Nowicka", address: "ola@example.com", signedIn: "2026-11-14" }],
    invites: [{ invite: H_MAREK, address: "marek.nowicki@example.com", at: JUST, until: JUST + 30 * DAY_MS }],
    confirms: [{ ask: ASK_PIOTR, person: P_PIOTR, name: "Piotr Zielinski", address: "piotr.zielinski@example.com", provider: "microsoft", account: "personal", at: JUST }], relay: true };
  const ok = () => Promise.resolve({ error: null });
  const r = await teamOn(Object.assign({}, SIGNED, { signinCode: CODE3 }), { source, api: { peopleList: () => Promise.resolve(JSON.parse(JSON.stringify(peopleAnswer))),
    licenceTeam: () => Promise.resolve({ error: null, team: 2, owner: true, desks: { held: 5, of: 5 } }),
    personInvite: ok, personInviteWithdraw: ok, personConfirm: ok, personDecline: ok } });
  const h = r.main(), ht = plainText(h);
  const pAt = h.indexOf("data-people"), invAt = h.indexOf("data-person-invite-row"), waitAt = h.indexOf("data-invited-waiting"), memAt = h.indexOf(">Members<");
  const conf = (/<div class="si-prow si-confirm" data-person-confirm="4d4d[^"]*">[\s\S]*?<\/div><\/div>/.exec(h) || [""])[0];
  out.si106a = pAt > 0 && invAt > pAt && waitAt > invAt && memAt > waitAt && !/data-person-code-row|Admit by sign-in code|data-seat-name/.test(h)
    && ht.indexOf("Invite by email address") >= 0 && /placeholder="a colleague&#39;s email address"|placeholder="a colleague's email address"/.test(h)
    && /data-act="person-invite">Invite<\/button>/.test(h) && ht.indexOf("Someone with no address to type?") >= 0 && /data-act="invite-new">Invite a teammate…</.test(h)
    && /<b>Ola Nowicka<\/b><span class="ad">ola@example\.com<\/span>/.test(h) && /data-person="e4e4[^"]*"/.test(h);
  out.si106b = /class="si-prow si-wait" data-person-invited="3c3c/.test(h) && ht.indexOf("marek.nowicki@example.com · invited today,") >= 0
    && ht.indexOf("No mail is sent. Their desk shows the invitation the next time it signs in with this address, with one Join; tell them yourself if you like.") >= 0
    && plainText(conf).indexOf("Microsoft does not vouch for this address, so their desk joins only once you confirm this is the person you invited.") >= 0
    && /data-act="person-decline" data-v="4d4d[^"]*">Decline<\/button><button class="btn sm solid" data-act="person-confirm" data-v="4d4d[^"]*">Confirm and admit</.test(conf)
    && (h.match(/si-confirm/g) || []).length === 1
    && ht.indexOf("Every desk seat on this licence is taken, so a person's Join waits until one is free or a seat is added.") >= 0;
  const box = r.home.node("#main input[data-person-invite]");
  box.value = "nonsense";
  await r.press("person-invite");
  const hinted = plainText(r.main()).indexOf('"nonsense" is not an email address yet') >= 0;
  box.value = " new.member@example.com ";
  await r.press("person-invite");
  await r.press("person-invite-withdraw", { "data-v": H_MAREK });
  await r.press("person-confirm", { "data-v": ASK_PIOTR });
  await r.press("person-decline", { "data-v": ASK_PIOTR });
  const acts = r.calls.filter((c) => /^person(Invite|Confirm|Decline)/.test(c));
  out.si106c = hinted && JSON.stringify(acts) === JSON.stringify(["personInvite:" + TEAM_DIR + ",new.member@example.com", "personInviteWithdraw:" + TEAM_DIR + "," + H_MAREK,
    "personConfirm:" + TEAM_DIR + "," + ASK_PIOTR, "personDecline:" + TEAM_DIR + "," + ASK_PIOTR]) && r.calls.filter((c) => /^peopleList/.test(c)).length === 5;
  /* si106d: the roster's waiting row for a member invited by address says "waiting for their Join", and Polish says its twin; the old
     "waiting for their next sign-in" is nowhere, on the page or in the words (2026-11-22, was "waiting for their next sign-in"). */
  const rPl = await teamOn(Object.assign({}, SIGNED, { signinCode: CODE3 }), { source, lang: "pl", api: { peopleList: () => Promise.resolve(JSON.parse(JSON.stringify(peopleAnswer))),
    licenceTeam: () => Promise.resolve({ error: null, team: 2, owner: true, desks: { held: 5, of: 5 } }), personInvite: ok, personInviteWithdraw: ok, personConfirm: ok, personDecline: ok } });
  const joinRow = (x) => (/<div class="si-prow si-wait" data-person-invited="3c3c[^"]*">[\s\S]*?<span class="si-state">[^<]*<\/span>/.exec(x) || [""])[0];
  const langSrc = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  out.si106d = />waiting for their Join</.test(joinRow(h)) && />czeka, aż ta osoba dołączy</.test(joinRow(rPl.main()))
    && ht.indexOf("waiting for their next sign-in") < 0 && plainText(rPl.main()).indexOf("czeka na najbliższe logowanie tej osoby") < 0
    && source.indexOf("waiting for their next sign-in") < 0 && langSrc.indexOf("waiting for their next sign-in") < 0;
  /* si112 (page): a team that shares a folder draws no address field and no Invite, says so in one line, and keeps the link. */
  const sharedAnswer = Object.assign(JSON.parse(JSON.stringify(peopleAnswer)), { relay: false });
  const sharedPage = await teamOn(Object.assign({}, SIGNED, { signinCode: CODE3 }), { source, api: { peopleList: () => Promise.resolve(JSON.parse(JSON.stringify(sharedAnswer))),
    licenceTeam: () => Promise.resolve({ error: null, team: 2, owner: true, desks: { held: 5, of: 5 } }), personInvite: ok, personInviteWithdraw: ok, personConfirm: ok, personDecline: ok } });
  /* A team at a shared folder is held (the folder team's removal): the facts say it is not on the relay, so the page draws the one line and
     no address field, no Invite, no roster and no people (was: no address field, one line to invite with a link, and the link and any invitation
     waiting kept). */
  const heldPage = await teamOn(Object.assign({}, SIGNED, { signinCode: CODE3 }), { source, facts: teamFacts({ team: Object.assign({}, teamFacts().team, { relay: false }) }),
    api: { peopleList: () => Promise.resolve(JSON.parse(JSON.stringify(sharedAnswer))), personInvite: ok, personInviteWithdraw: ok, personConfirm: ok, personDecline: ok } });
  const sharedHtml = heldPage.main(), sharedText = plainText(sharedHtml);
  out.si112a = !/data-person-invite[ =>]|data-act="person-invite"/.test(sharedHtml) && !/<input[^>]*si-addr/.test(sharedHtml) && sharedText.indexOf("Invite by email address") < 0
    && !/data-act="invite-new"/.test(sharedHtml) && !/data-person-invited/.test(sharedHtml) && sharedText.indexOf("This team works from a shared folder, so a teammate is invited with a link to it.") < 0
    && /data-held-folder/.test(sharedHtml) && sharedText.split("works through a shared folder, which Etiuda Studio no longer follows").length === 2
    && !/Asking to join|Members/.test(sharedText);
  /* si107: an older shell's code handed to every place, and none drawn */
  const OLD = Object.assign({}, OWNER_1017, { signinCode: CODE1, signinAskOwner: false });
  const o = await owner1017(source, Object.assign(seats1017(), { seats: seats1017().seats.map((x, i) => Object.assign({ code: [CODE2, CODE3][i] }, x)),
    unnamed: [{ person: P_TOM, code: CODE4, seen: "2026-11-20" }] }));
  const ownerAcct = o.sx();
  o.P.S.acctPop = true; const pop = o.get("acctPopHtml") ? o.get("acctPopHtml")() : "";
  const lead = await studio(Object.assign({}, SIGNED, { signinCode: CODE3, signinOwner: false }), { source, api: { licenceTeam: () => Promise.resolve({ error: null, team: 3, owner: CODE1, desks: { held: 2, of: 9 } }) } });
  const asking = await studio(Object.assign({}, SIGNED, { signinCode: CODE3, signinOwner: false, signinAskOwner: true }), { source });
  const fact = o.get("signInFact") ? o.get("signInFact")({ why: "signin-no-licence", said: { code: CODE1 } }).join(" ") : "";
  const askText = plainText(asking.sx());
  out.si107a = !codeIn(ownerAcct) && !codeIn(pop) && !codeIn(lead.sx()) && !codeIn(asking.sx()) && !codeIn(fact) && !codeIn(h) && ownerAcct.length > 2000 && pop.length > 50
    && askText.indexOf("The licence's owner names it by this account's email address, and this Studio then asks before moving to the organisation's licence. Until then it sees no team but its own.") >= 0;
  void OLD;
  /* si110: a work account's verified domain beside the candidate, and the several flag from the service's counts. */
  const dom = await owner1017(source, seats1017({ namings: [{ naming: H_PIOTR, until: JUST + 30 * DAY_MS, at: JUST, address: "piotr.zielinski@example.com", claimed: 2,
    candidates: [{ person: P_PIOTR, name: "Piotr Zielinski", provider: "microsoft", account: "work", domain: "kappa-tools.example", at: JUST }] }] }));
  const dh = dom.sx(), dRow = (/data-lead-confirm="2b2b[^"]*">[\s\S]*?<\/div><\/div>/.exec(dh) || [""])[0];
  const pers = await owner1017(source, seats1017({ namings: [{ naming: H_PIOTR, until: JUST + 30 * DAY_MS, at: JUST, address: "piotr.zielinski@example.com", claimed: 1,
    candidates: [{ person: P_PIOTR, name: "Piotr Zielinski", provider: "microsoft", account: "personal", domain: "kappa-tools.example", at: JUST }] }] }));
  const ph = pers.sx();
  const memberAnswer = JSON.parse(JSON.stringify(peopleAnswer));
  memberAnswer.confirms[0] = Object.assign(memberAnswer.confirms[0], { account: "work", domain: "harbour.example", claimants: 2 });
  const mt = await teamOn(Object.assign({}, SIGNED, { signinCode: CODE3 }), { source, api: { peopleList: () => Promise.resolve(JSON.parse(JSON.stringify(memberAnswer))) } });
  const mh = mt.main();
  out.si110 = /<span>kappa-tools\.example<\/span>/.test(dRow) && /data-lead-several/.test(dRow) && plainText(dRow).indexOf("Account an organisation's") >= 0
    && !/kappa-tools\.example/.test(ph) && !/data-lead-several/.test(ph)
    && /<span>harbour\.example<\/span>/.test(mh) && /data-person-several/.test(mh)
    && plainText(mh).indexOf("More than one person accepted this invitation, so confirm only the person you invited.") >= 0
    && !/data-person-several/.test(h);
  /* si111: the named person waiting for the owner's confirmation: the row keeps its label, loses Accept, says it waits, and the line. */
  const waitN = { by: "Marta Nowak", org: "Harbour", until: null, key: "k-1017", state: "confirm" };
  const wp = await studio(Object.assign({}, SIGNED, { signinCode: CODE3, signinOwner: false, naming: waitN }), { source });
  const wa2 = wp.sx(), wt = plainText(wa2), wRow = (/data-row="naming"[\s\S]*?<\/div><\/div>/.exec(wa2) || [""])[0];
  const askN = Object.assign({}, waitN, { state: "ask" });
  const ap = await studio(Object.assign({}, SIGNED, { signinCode: CODE3, signinOwner: false, naming: askN }), { source,
    api: { licenceAccept: () => Promise.resolve(Object.assign({ error: null, namingResult: "confirm" }, SIGNED, { naming: waitN })) } });
  ap.P.S.namingStep = "ask";
  await ap.press("naming-accept");
  const said = ap.home.node("#said") ? ap.home.node("#said").textContent : "";
  const plw = await studio(Object.assign({}, SIGNED, { signinCode: CODE3, signinOwner: false, naming: waitN }), { source, lang: "pl" });
  const w111 = { label: wt.indexOf("Named a lead by Marta Nowak") >= 0, state: /data-naming-confirm>waiting for the owner to confirm</.test(wRow) && !/data-act="naming-open"|>Accept…</.test(wRow),
    line: wt.indexOf("Accepted. Microsoft does not vouch for this account's address, so Marta Nowak confirms it next; this Studio then moves onto the paid lead seat by itself. Nothing is needed here meanwhile.") >= 0,
    toast: !wp.P.S.namingStep && said.indexOf("Accepted; Marta Nowak confirms it next.") >= 0 && ap.P.S.namingStep !== "full",
    polish: plainText(plw.sx()).indexOf("czeka na potwierdzenie przez osobę, do której należy licencja") >= 0 };
  out.si111 = Object.values(w111).every(Boolean) ? true : JSON.stringify(w111);
  return out;
}

await leg("si104", async () => {
  const real = await run1017(APP);
  const has = (k) => real[k] === true;
  check(has("si104a") && has("si104b"),
    "si104 Account, the owner's leads: each by name and address, the count with what waits, one field for an address or a name from the licence's teams,"
    + " matches offered as typed with the not-an-address line, Name as lead the one press (a pick names that person by pseudonym, an address names the"
    + " address trimmed, anything else said and nothing sent); no code row and no name field: " + JSON.stringify({ a: real.si104a, b: real.si104b }));
  check(["si105a", "si105b", "si105c", "si105d", "si105e", "si105f"].every(has),
    "si105 the waiting row (grey): address, when, waiting for their next sign-in, Withdraw, no mail sent; the confirm row (the mark colour) only for an unvouched"
    + " candidate: who, the provider's line, its three facts, Decline and Confirm as lead, each press sent by handle and pseudonym; several candidates flagged;"
    + " every lead seat taken said with no Add a seat; Polish whole: " + JSON.stringify(["a", "b", "c", "d", "e", "f"].map((x) => real["si105" + x])));
  check(["si106a", "si106b", "si106c", "si106d"].every(has),
    "si106 the Team roster: Invite by email address where Admit by sign-in code stood, invitation links beside it, the invitation and the unvouched Join waiting"
    + " under it in the sheet's order with Withdraw, Decline and Confirm and admit, the desk seats taken said; Invite sends the address alone, trimmed, a"
    + " non-address said and nothing sent; the people by name and address: " + JSON.stringify(["a", "b", "c", "d"].map((x) => real["si106" + x])));
  /* si107's source half: no place for a code in the page, preload or words. */
  const preload = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8"), lang = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const nowAt = mainText.indexOf("async function licenceNow(");
  const srcClean = !/signinCode|codeShown|lic-code-copy|person-admit-code|data-signin-code|data-person-code|data-lead-name-code|sign-in code|data-seat-name/.test(APP)
    && !/seatName|licenceName:/.test(preload) && !/sign-in code|kod logowania|kodzie logowania/i.test(lang)
    && nowAt > 0 && !/signinCode:/.test(mainText.slice(nowAt, mainText.indexOf("\n}\n", nowAt))) && !/said\.code/.test(mainText);
  check(has("si107a") && srcClean,
    "si107 no code on any of Studio's screens: the owner's Account, a lead's, a colleague's ask, the colleagues to name, the account pop-over, the sign-in's"
    + " refusal and the Team screen draw none even when an older shell hands one, and the colleague's line names the address; the page, preload, words and"
    + " the shell's answer to the page hold no place for one: " + JSON.stringify({ page: real.si107a, source: srcClean }));
  check(has("si112a"),
    "si112 (page) a team at a shared folder is held: it draws the one line that it no longer syncs, and no address field, no Invite, no roster and no people"
    + " (was: no address field, one line to invite with a link, and the link and any invitation already waiting kept); a relay team (si106) keeps the field: " + real.si112a);
  check(has("si110"),
    "si110 a work account's verified domain stands beside the candidate as what its provider says, on the owner's Confirm row and the lead's (a personal"
    + " account's never), and the several flag follows the service's counts, claimed on a naming and claimants on an invitation, in the copywriter's"
    + " words for each: " + real.si110);
  check(real.si111 === true,
    "si111 the named person whose Accept made them a candidate: Account's row keeps its label, loses Accept, reads waiting for the owner to confirm,"
    + " with the copywriter's line; Accept answered so closes the bubble with her toast, never the full licence's; Polish too: " + real.si111);
  /* Each deciding line changed alone turns its checks red. */
  const PLANTS_1017 = [
    { name: "nba-domain", reds: ["si110"], from: 'c.account === "work" && c.domain ? c.domain : ""].filter(Boolean);', to: '""].filter(Boolean);' },
    { name: "nba-claimed", reds: ["si110"], from: "const claimed = Number.isInteger(n.claimed) && n.claimed > 0 ? n.claimed : cands.length;", to: "const claimed = cands.length;" },
    { name: "nba-claimants", reds: ["si110"], from: "(Number(c.claimants) > 1 ?", to: "(false ?" },
    { name: "nba-wait-row", reds: ["si111"], from: '    if (n.state === "confirm") return sxRow(', to: '    if (false) return sxRow(' },
    { name: "nba-wait-toast", reds: ["si111"], from: '      if (r.namingResult === "confirm") tell(', to: '      if (false) tell(' },
    { name: "nba-confirm-colour", reds: ["si105b"], from: 'rows.push(row(n.naming, "si-confirm",', to: 'rows.push(row(n.naming, "si-wait",' },
    { name: "nba-pick", reds: ["si104b"], from: "const pick = S.licNamePick && S.licNamePick.name === typed ? S.licNamePick : null;", to: "const pick = null;" },
    { name: "nba-not-address", reds: ["si104b"], from: "if (!pick && !addressShaped(typed)) { S.licNameSaid = null; paint(); return; }", to: "" },
    { name: "nba-full", reds: ["si105d"], from: "const full = namings.length && Number.isFinite(held)", to: "const full = false && Number.isFinite(held)" },
    { name: "nba-several", reds: ["si105d"], from: "const several = claimed > 1 ?", to: "const several = false ?" },
    { name: "nba-invite-address", reds: ["si106c"], from: "if (!addressShaped(typed)) { S.piSaid = { dir, hint: typed.trim() }; paint(); return; }", to: "" },
    { name: "nba-folder-field", reds: ["si112a"], from: "const folderTeam = !!P && P.relay === false;", to: "const folderTeam = false;" },
    { name: "nba-invite-rows", reds: ["si106b"], from: "    S.people.confirms = r && !r.error && Array.isArray(r.confirms) ? r.confirms : [];\n", to: "" },
    { name: "nba-join-word", reds: ["si106d"], from: 'esc(T("waiting for their Join"))', to: 'esc(T("waiting for their next sign-in"))' },
    { name: "nba-ask-line", reds: ["si107a"], from: 'T("The licence\'s owner names it by this account\'s email address,', to: 'T("The licence\'s owner names it by this account\'s sign-in code,' },
  ];
  for (const p of PLANTS_1017) {
    if (process.env.ETIUDA_PLANTS === "off") { console.log("  skip si104 plant " + p.name + " (ETIUDA_PLANTS=off)"); continue; }
    if (APP.split(p.from).length !== 2) { check(false, "si104 plant " + p.name + " could not be placed in the page's source"); continue; }
    const got = await run1017(APP.replace(p.from, () => p.to));
    check(p.reds.every((id) => got[id] !== true), "si104 plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(got));
  }
});

/* The shell under its Electron stub, the licence service stood in: a route's answer by `routes[route]`, every request kept. */
async function shell1017(o, steps) {
  const sh = await shellOn(o);
  const was = answer, sent = [];
  try {
    await sh.ask("studio:key-make");
    answer = async (url, init) => {
      const route = String(url).replace(/^.*\/v1\//, ""), body = init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : {};
      sent.push({ route, body });
      const a = o.routes[route];
      if (!a) return { status: 404, body: "{}" };
      const v = typeof a === "function" ? a(body) : a;
      return { status: v.ok === false ? 409 : 200, body: JSON.stringify(v) };
    };
    return await steps(sh, sent);
  } finally { answer = was; sh.done(); }
}
const refusedText = async (fn) => { try { const r = await fn(); return r && r.error ? JSON.stringify(r) : ""; } catch (e) { return String(e && e.message || e); } };

const run108 = async (root) => {
  let namings = [{ naming: H_ZOFIA, until: Date.now() + 30 * DAY_MS, candidates: [] },
    { naming: H_PIOTR, until: Date.now() + 30 * DAY_MS, candidates: [{ person: P_PIOTR, name: "Piotr Zielinski", provider: "microsoft", account: "personal", at: JUST }] }];
  const routes = {
    "seat/list": () => ({ ok: true, seats: [{ code: CODE1, person: P_OWN, name: "Marta Nowak", address: "marta.nowak@example.com", seen: "2026-11-03", proved: "2026-11-03", you: true, named: true, team: 4 },
      { code: CODE2, person: P_JAN, name: "Jan Kowalski", address: "jan.kowalski@example.com", seen: "2026-11-09", proved: "2026-11-09", you: false, named: true, team: 6, namedAt: "2026-11-09" }],
      counts: { lead: { held: 2, of: 4 }, desk: { held: 10, of: 20 } }, unnamed: [{ code: CODE4, person: P_TOM, seen: "2026-11-20" }], orgDesks: false, namings }),
    "person/list": { ok: true, people: [{ code: CODE3, person: P_EWA, signedIn: "2026-11-20", name: "Ewa Lis", address: "ewa.lis@example.com" }], asks: [], invites: [] },
    "lead/invite": { ok: true, naming: H_ZOFIA, until: Date.now() + 30 * DAY_MS },
    "lead/confirm": { ok: true, named: P_PIOTR }, "lead/withdraw": { ok: true }, "lead/pick": { ok: true, named: P_EWA },
    "seat/free": { ok: true, freed: "lead", seats: { lead: { held: 1, of: 4 } } },
    "lead/accept": { ok: true, accepted: false, reason: "confirm" },
  };
  return shell1017({ routes, root }, async (sh, sent) => {
    const r = {};
    const acts = () => sent.filter((x) => x.route !== "seat/list" && x.route !== "person/list");
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1, signinOwner: true, orgDesks: false }));
    const lic = await sh.ask("studio:licence");
    r.licence = !("signinCode" in lic) && !JSON.stringify(lic).includes(CODE1);
    const named = await sh.ask("studio:licence-name-address", "  zofia.wisniewska@example.com ");
    let typed = { lead: {} };
    try { typed = JSON.parse(fs.readFileSync(sh.file("typed-addresses.json"), "utf8")); } catch { /* none kept: the part says so */ }
    r.named = acts().length === 1 && acts()[0].route === "lead/invite" && acts()[0].body.address === "zofia.wisniewska@example.com"
      && JSON.stringify(Object.keys(acts()[0].body).sort()) === '["address","lead","sig","t"]'
      && typed.lead[H_ZOFIA] && typed.lead[H_ZOFIA].address === "zofia.wisniewska@example.com";
    r.list = Array.isArray(named.namings) && named.namings.length === 2 && named.namings[0].address === "zofia.wisniewska@example.com" && named.namings[1].address === null
      && named.namings[1].candidates[0].name === "Piotr Zielinski" && named.seats.length === 2 && named.seats.every((x) => !("code" in x)) && named.seats[1].address === "jan.kowalski@example.com"
      && named.unnamed[0].person === P_TOM && named.people[0].person === P_EWA && named.people[0].name === "Ewa Lis" && !codeIn(JSON.stringify(named));
    await sh.ask("studio:licence-seat-free", P_JAN);
    r.free = acts()[1] && acts()[1].route === "seat/free" && acts()[1].body.kind === "lead" && acts()[1].body.person === CODE2;
    await sh.ask("studio:licence-candidate-confirm", H_PIOTR, P_PIOTR);
    await sh.ask("studio:licence-naming-withdraw", H_ZOFIA);
    await sh.ask("studio:licence-name-person", P_EWA);
    r.acts = acts()[2] && acts()[2].route === "lead/confirm" && acts()[2].body.naming === H_PIOTR && acts()[2].body.person === P_PIOTR
      && acts()[3] && acts()[3].route === "lead/withdraw" && acts()[3].body.naming === H_ZOFIA
      && acts()[4] && acts()[4].route === "lead/pick" && acts()[4].body.person === P_EWA;
    const n0 = acts().length;
    const bad = await refusedText(() => sh.ask("studio:licence-name-address", "nonsense"));
    r.notAddress = acts().length === n0 && bad.indexOf("That is not an email address, so nobody was named.") >= 0;
    namings = [];
    await sh.ask("studio:licence-seats");
    let left = null;
    try { left = JSON.parse(fs.readFileSync(sh.file("typed-addresses.json"), "utf8")).lead; } catch { left = null; }
    r.forgotten = JSON.stringify(left) === "{}";
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1, signinOwner: false }));
    const n1 = acts().length;
    r.ownerAlone = (await refusedText(() => sh.ask("studio:licence-name-address", "x@example.com"))).length > 0 && acts().length === n1;
    /* The named person whose Accept made them a candidate (an unvouched address) is not told the licence is full. */
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE3, signinOwner: false,
      signinNaming: { by: "Marta Nowak", org: "Harbour", trialEnds: Date.now() + 5 * DAY_MS, key: "k-1017", state: "ask" } }));
    const acc = await sh.ask("studio:licence-accept");
    r.confirmNotFull = !!acc && !acc.error && acc.namingResult === "confirm";
    /* The waiting state as the check brings it: kept by the client, a naming with no trial of the person's own included, and handed to the page. */
    const kept = C.keepWho({ by: "signin" }, { ok: true, me: CODE3, naming: { by: "Marta Nowak", org: "Harbour", trialEnds: null, key: "k-1017", state: "confirm" } });
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify(Object.assign({ provider: "microsoft" }, kept)));
    const lic2 = await sh.ask("studio:licence");
    r.waitHanded = !!kept.signinNaming && kept.signinNaming.state === "confirm" && !!lic2.naming && lic2.naming.state === "confirm" && lic2.naming.until === null;
    return r;
  });
};
await leg("si108", async () => {
  const out = await run108(ROOT);
  /* Each deciding line of the shell changed alone, in a copy of the tree, turns its part red. */
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) for (const [name, from, to, part] of [
    ["nba-shell-code", "const seats = a.seats.filter((x) => x.person).map((x) => { const y = Object.assign({}, x); delete y.code; return y; });", "const seats = a.seats;", "list"],
    ["nba-shell-typed", "  keepTyped(\"lead\", a.naming, { address: typed, at: Date.now() });\n", "", "named"],
    ["nba-shell-confirm", "namingResult = a.reason === \"confirm\" ? \"confirm\" : \"full\";", "namingResult = \"full\";", "confirmNotFull"],
    ["nba-shell-wait", 'state: st.signinNaming.state === "blocked" ? "blocked" : st.signinNaming.state === "confirm" ? "confirm" : "ask" } : null,', 'state: st.signinNaming.state === "blocked" ? "blocked" : "ask" } : null,', "waitHanded"],
    ["nba-shell-free", "const c = leadCodes.get(String(person == null ? \"\" : person)) || \"\";", "const c = String(person == null ? \"\" : person);", "free"],
  ]) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to]]);
    planted[name] = !t ? "anchor" : !(await run108(t))[part] ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si108 the shell, the owner's side: the licence handed to the page carries no code; a naming by address is sent as lead/invite, the address trimmed and"
    + " alone, and kept by its handle in typed-addresses.json; the seat list reaches the page with pseudonyms, names, addresses and the typed address beside its"
    + " naming, and no code; Free by pseudonym is sent by the seat's code; Confirm, Withdraw and a pick by handle and pseudonym; a non-address sends nothing;"
    + " a handle no longer listed is forgotten; anyone but the owner sends nothing; a named person's Accept that made them a candidate is not the full"
    + " licence's answer: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

/* The service's own lifetime of an ask, read from its source, so a shell that shows an ask's date against another one fails here (board 1017, D1). */
const ASK_DAYS_SERVICE = Number((/const ASK_DAYS = (\d+)/.exec(fs.readFileSync(path.join(ROOT, "service", "licence", "core.mjs"), "utf8")) || [])[1]);
const ASK_MADE = Date.now() - 2 * DAY_MS;
/* A relay team's row in the teams file: what makes the shell offer its lead an invitation by address. */
const relayRow = (team, extra) => ({ [team]: Object.assign({ relay: { rt: "6d".repeat(16), url: "https://etiuda.dev/relay/v1/", created: true } }, extra || {}) });
const run109 = async (root) => {
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [] } } : {});
  let invites = [{ invite: H_MAREK, team: TEAM_ID, until: Date.now() + 30 * DAY_MS }];
  const routes = {
    "person/list": () => ({ ok: true, people: [{ code: ADA, person: PERSON_ADA, signedIn: "2026-11-11", added: false }],
      asks: [{ ask: ASK_PIOTR, person: P_PIOTR, name: "Piotr Zielinski", address: "piotr.zielinski@example.com", vouched: false, provider: "microsoft", account: "personal",
        source: "unconfirmed", kind: "desk", team: TEAM_ID, until: ASK_MADE + ASK_DAYS_SERVICE * DAY_MS },
      { ask: "5e".repeat(16), person: P_OLA, name: "Ola Nowicka", address: "ola@example.com", vouched: true, provider: "google", account: "work", source: "org", kind: "desk", team: TEAM_ID, until: Date.now() + 7 * DAY_MS }],
      invites }),
    "invite": { ok: true, invite: H_MAREK, until: Date.now() + 30 * DAY_MS },
    "person/admit": { ok: true, admitted: ADA, person: PERSON_ADA }, "ask/refuse": { ok: true }, "invite/withdraw": { ok: true },
  };
  return shell1017({ thread, routes, root }, async (sh, sent) => {
    const r = {};
    const acts = () => sent.filter((x) => x.route !== "person/list" && x.route !== "seat/list");
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
    fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: relayRow(TEAM_ID) }) + "\n");
    await sh.ask("studio:person-invite", TEAM_DIR, " marek.nowicki@example.com ");
    const typed = JSON.parse(fs.readFileSync(sh.file("typed-addresses.json"), "utf8"));
    r.invited = acts().length === 1 && acts()[0].route === "invite" && acts()[0].body.address === "marek.nowicki@example.com" && acts()[0].body.team === TEAM_ID
      && typed.desk[H_MAREK] && typed.desk[H_MAREK].address === "marek.nowicki@example.com" && typed.desk[H_MAREK].team === TEAM_ID;
    const list = await sh.ask("studio:people-list", TEAM_DIR);
    r.list = list.people.length === 1 && list.people[0].person === PERSON_ADA && !("code" in list.people[0]) && !codeIn(JSON.stringify(list))
      && list.invites.length === 1 && list.invites[0].invite === H_MAREK && list.invites[0].address === "marek.nowicki@example.com"
      && list.confirms.length === 1 && list.confirms[0].ask === ASK_PIOTR && list.confirms[0].name === "Piotr Zielinski" && list.confirms[0].account === "personal"
      && list.relay === true && ASK_DAYS_SERVICE === 30 && list.confirms[0].at === ASK_MADE;
    await sh.ask("studio:person-admit", TEAM_DIR, PERSON_ADA, "list");
    r.admit = acts()[1] && acts()[1].route === "person/admit" && acts()[1].body.code === ADA;
    await sh.ask("studio:person-confirm", TEAM_DIR, ASK_PIOTR);
    await sh.ask("studio:person-decline", TEAM_DIR, ASK_PIOTR);
    await sh.ask("studio:person-invite-withdraw", TEAM_DIR, H_MAREK);
    r.acts = acts()[2] && acts()[2].route === "person/admit" && acts()[2].body.ask === ASK_PIOTR && acts()[2].body.team === TEAM_ID && !("code" in acts()[2].body)
      && acts()[3] && acts()[3].route === "ask/refuse" && acts()[3].body.ask === ASK_PIOTR
      && acts()[4] && acts()[4].route === "invite/withdraw" && acts()[4].body.invite === H_MAREK && !("address" in acts()[4].body);
    const n0 = acts().length;
    r.notAddress = (await refusedText(() => sh.ask("studio:person-invite", TEAM_DIR, "nonsense"))).length > 0 && acts().length === n0;
    invites = [];
    await sh.ask("studio:people-list", TEAM_DIR);
    r.forgotten = JSON.stringify(JSON.parse(fs.readFileSync(sh.file("typed-addresses.json"), "utf8")).desk) === "{}";
    return r;
  });
};
await leg("si109", async () => {
  const out = await run109(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) for (const [name, from, to, part] of [
    ["nba-shell-unvouched", "x.source === \"unconfirmed\" && x.kind === \"desk\" && (relayId ?", "x.kind === \"desk\" && (relayId ?", "list"],
    ["nba-shell-ask-days", "const ASK_SHOWN_MS = 30 * 86400000;", "const ASK_SHOWN_MS = 7 * 86400000;", "list"],
    ["nba-shell-admit", "codeOfPerson.get(String(code == null ? \"\" : code)) || \"\"", "String(code == null ? \"\" : code)", "admit"],
    ["nba-shell-relay", "  const a = await C.invitePerson(wire.licenceRequest, open, typed, relayId, Date.now());", "  const a = await C.invitePerson(wire.licenceRequest, open, typed, undefined, Date.now());", "invited"],
  ]) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to]]);
    planted[name] = !t ? "anchor" : !(await run109(t))[part] ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si109 the shell, the member's side: an invitation is sent with the address alone, trimmed, and the team's relay id, and kept by its handle; the list reaches"
    + " the page by pseudonym with no code, its invitations with the typed address and its unvouched Joins with what the provider says (a vouched ask not among"
    + " them); Admit by pseudonym is sent by code; Confirm and admit, Decline and Withdraw go as person/admit by ask, ask/refuse and invite/withdraw by handle;"
    + " a non-address sends nothing; a handle no longer listed is forgotten: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

/* si112 to si114, board 1017 (the test architect's read): a team that shares a folder, the refusals of each press, a sign-out's maps. */
const F1_ID = "t-1f1f1f1f1f1f1f1f", F2_ID = "t-2f2f2f2f2f2f2f2f", R_ID = "t-3a3a3a3a3a3a3a3a";
const F1_DIR = TEAM_DIR, F2_DIR = TEAM_DIR + "-two", R_DIR = TEAM_DIR + "-relay";
const ASK_FREE = "6f".repeat(16), ASK_REL = "7a".repeat(16);
const run112 = async (root) => {
  /* A catalog folder named for a team's id holds no team: a team with no catalog is reached by its id as the place (tib, tests/team-on-its-own.mjs), never through a folder. */
  const thread = (verb, home) => Promise.resolve(verb !== "teamFacts" || path.basename(String(home)) === R_ID ? {}
    : { team: { id: path.resolve(String(home)) === path.resolve(F1_DIR) ? F1_ID : path.resolve(String(home)) === path.resolve(F2_DIR) ? F2_ID : R_ID, epoch: 1, roster: [] } });
  const ask = (id, team) => ({ ask: id, person: P_PIOTR, name: "Piotr Zielinski", address: "piotr.zielinski@example.com", vouched: false, provider: "microsoft", account: "personal",
    source: "unconfirmed", kind: "desk", team, until: ASK_MADE + ASK_DAYS_SERVICE * DAY_MS });
  const routes = { "person/list": () => ({ ok: true, people: [], asks: [ask(ASK_FREE, null), ask(ASK_REL, R_ID)], invites: [] }), "invite": { ok: true, invite: H_MAREK, until: Date.now() + 30 * DAY_MS } };
  return shell1017({ thread, routes, root }, async (sh, sent) => {
    const r = {};
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
    fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: Object.assign({
      [F1_ID]: { keys: {}, folder: path.resolve(F1_DIR) }, [F2_ID]: { keys: {}, folder: path.resolve(F2_DIR) } }, relayRow(R_ID)) }) + "\n");
    const n0 = sent.length;
    const said = await refusedText(() => sh.ask("studio:person-invite", F1_DIR, "new.member@example.com"));
    r.folderInvite = said.indexOf("This team works from a shared folder, so a teammate is invited with a link") >= 0 && sent.slice(n0).every((x) => x.route !== "invite");
    const l1 = await sh.ask("studio:people-list", F1_DIR), l2 = await sh.ask("studio:people-list", F2_DIR), lr = await sh.ask("studio:people-list", R_DIR);
    r.relayFlag = l1.relay === false && l2.relay === false && lr.relay === true;
    /* A Join with no team is shown on no team now (was: once, on the first folder team by id; the folder team is removed, and the Join is no relay team's). */
    r.once = l1.confirms.length === 0 && l2.confirms.length === 0;
    r.relayOwn = lr.confirms.length === 1 && lr.confirms[0].ask === ASK_REL && !l1.confirms.some((c) => c.ask === ASK_REL) && !l2.confirms.some((c) => c.ask === ASK_REL);
    await sh.ask("studio:person-invite", R_DIR, "new.member@example.com");
    const inv = sent.filter((x) => x.route === "invite");
    r.relayInvite = inv.length === 1 && inv[0].body.team === R_ID;
    /* A team with no catalog is the place by its id: the invitation and the list are for that team, no catalog read. */
    await sh.ask("studio:person-invite", R_ID, "second.member@example.com");
    const byId = sent.filter((x) => x.route === "invite");
    r.byTeamId = byId.length === 2 && byId[1].body.team === R_ID && byId[1].body.address === "second.member@example.com";
    const lid = await sh.ask("studio:people-list", R_ID);
    r.listByTeamId = lid.relay === true && lid.confirms.length === 1 && lid.confirms[0].ask === ASK_REL;
    return r;
  });
};
await leg("si112", async () => {
  const out = await run112(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) for (const [name, from, to, part] of [
    ["nba-folder-invite", '  if (!relayId) throw R.refuse(licenceSaid("person-invite-folder")); /* plant:invite-folder */\n', "", "folderInvite"],
    ["nba-relay-row", "return K.relayTeams(await teamsAt()).some((t) => t.team === teamId) ? teamId : null;", "return teamId;", "relayFlag"],
    ["nba-people-place", "  const tp = await teamPlaceOf(home); /* a team with no catalog is named by its own id */\n  if (tp) return tp.team;\n", "", "byTeamId"],
  ]) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to]]);
    planted[name] = !t ? "anchor" : !(await run112(t))[part] ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si112 (shell) a team that shares a folder (no relay row in the teams file) is not invited by address, nothing is sent and the refusal says to invite with a link;"
    + " the list says relay or not; a Join with no team shows on no folder team (was: once, on the first by id); a relay team shows its own alone and is invited with"
    + " its relay id: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

const run113 = async (root) => {
  const routes = {};
  return shell1017({ routes, root }, async (sh, sent) => {
    const r = {};
    /* Not signed in: each press refuses before anything is sent, in its own ending. */
    const inv = await refusedText(() => sh.ask("studio:person-invite", TEAM_DIR, "new.member@example.com"));
    const wd = await refusedText(() => sh.ask("studio:person-invite-withdraw", TEAM_DIR, H_MAREK));
    const cf = await refusedText(() => sh.ask("studio:person-confirm", TEAM_DIR, ASK_PIOTR));
    const dc = await refusedText(() => sh.ask("studio:person-decline", TEAM_DIR, ASK_PIOTR));
    const ad = await refusedText(() => sh.ask("studio:person-admit", TEAM_DIR, P_TOM, "list"));
    r.invite = inv.indexOf("so nobody was invited.") >= 0; r.withdraw = wd.indexOf("so the invitation still stands.") >= 0;
    r.confirm = cf.indexOf("so nobody was confirmed.") >= 0; r.decline = dc.indexOf("so the request still waits.") >= 0;
    r.admit = ad.indexOf("so nobody was admitted.") >= 0 && [inv, wd, cf, dc].every((t) => t.indexOf("nobody was admitted") < 0);
    /* A handle that is not one: the press's own ending too, before the service is asked. */
    const wb = await refusedText(() => sh.ask("studio:person-invite-withdraw", TEAM_DIR, "zz"));
    const cb = await refusedText(() => sh.ask("studio:person-confirm", TEAM_DIR, "zz"));
    const db = await refusedText(() => sh.ask("studio:person-decline", TEAM_DIR, "zz"));
    r.withdrawBad = wb.indexOf("so the invitation still stands.") >= 0; r.confirmBad = cb.indexOf("so nobody was confirmed.") >= 0;
    r.declineBad = db.indexOf("so the request still waits.") >= 0;
    r.nothingSent = sent.length === 0;
    return r;
  });
};
await leg("si113", async () => {
  const out = await run113(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) for (const [name, from, to, part] of [
    ["nba-end-shared", '  const st = readServiceState(), none = "person-lead-" + act;', '  const st = readServiceState(), none = "person-lead";', "invite"],
    ["nba-end-withdraw", 'throw R.refuse(licenceSaid("person-lead-withdraw"));\n  const { open } = await teamActReady(R, project, "withdraw");', 'throw R.refuse(licenceSaid("person-lead"));\n  const { open } = await teamActReady(R, project, "withdraw");', "withdrawBad"],
    ["nba-end-confirm", 'throw R.refuse(licenceSaid("person-lead-confirm"));\n  const { open, relayId }', 'throw R.refuse(licenceSaid("person-lead"));\n  const { open, relayId }', "confirmBad"],
    ["nba-end-decline", 'throw R.refuse(licenceSaid("person-lead-decline"));\n  const { open } = await teamActReady(R, project, "decline");', 'throw R.refuse(licenceSaid("person-lead"));\n  const { open } = await teamActReady(R, project, "decline");', "declineBad"],
  ]) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to]]);
    planted[name] = !t ? "anchor" : !(await run113(t))[part] ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si113 the refusals of Invite, Withdraw, Confirm and Decline each end in their own words (nobody invited, the invitation still stands, nobody confirmed, the request"
    + " still waits) and only Admit's ends in nobody admitted; nothing is sent: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

const run114 = async (root) => {
  const routes = {
    "seat/list": () => ({ ok: true, seats: [{ code: CODE1, person: P_OWN, seen: "2026-11-03", proved: "2026-11-03", you: true, named: true, team: 4 },
      { code: CODE2, person: P_JAN, name: "Jan Kowalski", address: "jan.kowalski@example.com", seen: "2026-11-09", proved: "2026-11-09", you: false, named: true, team: 6 }],
      counts: { lead: { held: 2, of: 4 }, desk: { held: 10, of: 20 } }, unnamed: [], orgDesks: false, namings: [] }),
    "person/list": { ok: true, people: [{ code: ADA, person: PERSON_ADA, signedIn: "2026-11-11" }], asks: [], invites: [] },
    "person/admit": { ok: true, admitted: ADA, person: PERSON_ADA }, "seat/free": { ok: true, freed: "lead", seats: { lead: { held: 1, of: 4 } } },
  };
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [] } } : {});
  return shell1017({ routes, thread, root }, async (sh, sent) => {
    const r = {};
    const owner = { by: "signin", provider: "microsoft", signinCode: CODE1, signinOwner: true, orgDesks: false };
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify(owner));
    await sh.ask("studio:licence-seats");
    await sh.ask("studio:people-list", TEAM_DIR);
    await sh.ask("studio:licence-signout");
    /* Another account signs in on the same Studio, with no restart, and presses on a screen still painted with the earlier account's pseudonyms. */
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify(owner));
    const n0 = sent.length;
    await refusedText(() => sh.ask("studio:licence-seat-free", P_JAN));
    await refusedText(() => sh.ask("studio:person-admit", TEAM_DIR, PERSON_ADA, "list"));
    const after = sent.slice(n0);
    r.leadCodes = !after.some((x) => x.route === "seat/free" && x.body.person === CODE2);
    r.codeOfPerson = !after.some((x) => x.route === "person/admit" && x.body.code === ADA);
    r.sawBefore = sent.slice(0, sent.length - after.length).some((x) => x.route === "person/list");
    return r;
  });
};
await leg("si114", async () => {
  const out = await run114(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) for (const [name, from, to, part] of [
    ["nba-signout-leadcodes", "leadCodes.clear(); peopleByCode.clear(); codeOfPerson.clear(); /* plant:signout-maps */", "peopleByCode.clear(); codeOfPerson.clear();", "leadCodes"],
    ["nba-signout-codeofperson", "leadCodes.clear(); peopleByCode.clear(); codeOfPerson.clear(); /* plant:signout-maps */", "leadCodes.clear(); peopleByCode.clear();", "codeOfPerson"],
  ]) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to]]);
    planted[name] = !t ? "anchor" : !(await run114(t))[part] ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si114 a sign-out clears the pseudonym maps: after another account signs in on the same Studio, a press on an earlier account's pseudonym sends no seat/free and no"
    + " person/admit with the earlier code: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

const run115 = async (root) => {
  let reason = "no-seat";
  const routes = { "seat/list": () => ({ ok: true, seats: [{ code: CODE1, person: P_OWN, seen: "2026-11-03", proved: "2026-11-03", you: true, named: true, team: 4 }],
      counts: { lead: { held: 1, of: 4 }, desk: { held: 1, of: 4 } }, unnamed: [], orgDesks: false, namings: [] }),
    "person/list": { ok: true, people: [], asks: [], invites: [] },
    "lead/withdraw": () => ({ ok: false, reason }), "lead/confirm": () => ({ ok: false, reason }) };
  return shell1017({ routes, root }, async (sh) => {
    const r = {};
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1, signinOwner: true, orgDesks: false }));
    const W = "The naming could not be withdrawn, so nothing has changed.", C = "This person could not be confirmed as lead, so nothing has changed.";
    const wd = await refusedText(() => sh.ask("studio:licence-naming-withdraw", H_ZOFIA));
    const cf = await refusedText(() => sh.ask("studio:licence-candidate-confirm", H_PIOTR, P_PIOTR));
    r.withdraw = wd.indexOf(W) >= 0 && wd.indexOf("nobody was named") < 0;
    r.confirm = cf.indexOf(C) >= 0 && cf.indexOf("nobody was named") < 0;
    const wb = await refusedText(() => sh.ask("studio:licence-naming-withdraw", "zz"));
    const cb = await refusedText(() => sh.ask("studio:licence-candidate-confirm", "zz", "zz"));
    r.badHandles = wb.indexOf(W) >= 0 && cb.indexOf(C) >= 0;
    reason = "full";
    const cfull = await refusedText(() => sh.ask("studio:licence-candidate-confirm", H_PIOTR, P_PIOTR));
    r.confirmFull = cfull.indexOf("Every lead seat on the licence is taken, so nobody was named.") >= 0;
    return r;
  });
};
await leg("si115", async () => {
  const out = await run115(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) for (const [name, from, to, part] of [
    ["nba-withdraw-own", 'throw ownerNamingRefused(R, a, "naming-withdraw-none");', "throw ownerNamingRefused(R, a);", "withdraw"],
    ["nba-confirm-own", 'throw ownerNamingRefused(R, a, "lead-confirm-none");', "throw ownerNamingRefused(R, a);", "confirm"],
    ["nba-confirm-full", 'a && a.reason === "full" && own !== "naming-withdraw-none" ? "lead-name-full" : own', 'own', "confirmFull"],
    ["nba-withdraw-bad", 'throw R.refuse(licenceSaid("naming-withdraw-none"));', 'throw R.refuse(licenceSaid("lead-name-none"));', "badHandles"],
  ]) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to]]);
    planted[name] = !t ? "anchor" : !(await run115(t))[part] ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si115 a refused Withdraw or Decline on a naming and a refused Confirm as lead each say their own words (nothing has changed), never nobody was named; Confirm's full keeps"
    + " the full licence's sentence: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si116 and si117, board 1017's B: the list's team and seat, kept by the client and by the shell for the watch's door -------- */
const JD_OTHER = "t-0f0f0f0f0f0f0f0f";
const run116 = async (CL) => {
  const ask = async () => ({ status: 200, bytes: Buffer.from(JSON.stringify({ ok: true, people: [
    { code: ADA, person: PERSON_ADA, signedIn: "2026-11-21", team: TEAM_ID, seated: true },
    { code: KIT, person: PERSON_KIT, signedIn: "2026-11-20", team: TEAM_ID, seated: "yes" },
    { code: DORA, person: "b2".repeat(32), signedIn: "2026-11-19", team: "not a team", seated: true },
    { code: CODE3, person: "d4".repeat(32), signedIn: "2026-11-18", team: null }] })) });
  const got = await CL.listPeople(ask, open, NOW);
  const by = (p) => (got.people || []).find((x) => x.person === p) || {};
  return { kept: by(PERSON_ADA).team === TEAM_ID && by(PERSON_ADA).seated === true,
    notTrue: by(PERSON_KIT).team === TEAM_ID && by(PERSON_KIT).seated === false,
    bad: !("team" in by("b2".repeat(32))) && !("seated" in by("b2".repeat(32))) && !("team" in by("d4".repeat(32))) && !("seated" in by("d4".repeat(32))) };
};
await leg("si116", async () => {
  const out = await run116(C);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) {
    const t = plantedTree("jd-client-team", [[path.join("src", "licence-client.mjs"),
      'TEAM_RE.test(String(x.team)) ? { team: x.team, seated: x.seated === true } : {} /* plant:jd-client-team */', "{}"]]);
    planted["jd-client-team"] = !t ? "anchor" : !(await run116(await import(pathToFileURL(path.join(t, "src", "licence-client.mjs")).href + "?jd"))).kept ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si116 listPeople keeps each row's team where it is a team id, and beside it seated, true only where the service says true; a malformed or null team"
    + " is kept as neither: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});
const run117 = async (root) => {
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [] } } : {});
  const P_JO = "e5".repeat(32), P_FEN = "f6".repeat(32), P_OLI = "a7".repeat(32), P_REM = "b8".repeat(32), P_BACK = "c9".repeat(32), P_GONE = "d0".repeat(32);
  const P_LATE = "1e".repeat(32);
  const REMOVED = Date.now() - 60000, ACKED = Date.now() - 30000;
  const routes = { "person/list": () => ({ ok: true, people: [
    { code: ADA, person: P_JO, signedIn: "2026-11-21", added: true, team: TEAM_ID, seated: true },
    { code: CODE2, person: P_REM, signedIn: "2026-11-21", added: true, team: TEAM_ID, seated: true },
    { code: CODE4, person: P_BACK, signedIn: "2026-11-21", added: true, team: TEAM_ID, seated: true },
    { code: CODE3, person: P_LATE, signedIn: "2026-11-21", added: true, team: TEAM_ID, seated: true },
    { code: KIT, person: P_FEN, signedIn: "2026-11-20", added: true, team: TEAM_ID, seated: false },
    { code: DORA, person: P_OLI, signedIn: "2026-11-19", added: true, team: JD_OTHER, seated: true }], asks: [], invites: [] }) };
  return shell1017({ thread, routes, root }, async (sh) => {
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
    fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: relayRow(TEAM_ID) }) + "\n");
    fs.writeFileSync(sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [P_FEN]: { via: "join", at: 1 }, [P_GONE]: { via: "join", at: 1 },
      [P_REM]: { via: "join", at: 1, removed: REMOVED, unplace: true }, [P_BACK]: { via: "join", at: 1, removed: REMOVED, ackAt: ACKED },
      [P_LATE]: { via: "join", at: 1, removed: REMOVED, ackAt: Date.now() + 60000 } } }));
    await sh.ask("studio:people-list", TEAM_DIR);
    let kept = {};
    try { kept = JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8")); } catch { kept = {}; }
    const mine = kept[TEAM_ID] || {};
    return { kept: !!mine[P_JO] && mine[P_JO].via === "join" && !mine[P_FEN] && !mine[P_OLI] && !kept[JD_OTHER],
      absent: !mine[P_GONE],
      removed: !!mine[P_REM] && mine[P_REM].removed === REMOVED && !!mine[P_LATE] && mine[P_LATE].removed === REMOVED
        && !!mine[P_BACK] && !("removed" in mine[P_BACK]) && mine[P_BACK].via === "join" };
  });
};
await leg("si117", async () => {
  const out = await run117(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) {
    const t = plantedTree("jd-shell-screen", [[path.join("shell", "main.js"), "  if (await relayIdOf(teamId)) await joinedKept(teamId, a.people, listAt);", "  void joinedKept;"]]);
    planted["jd-shell-screen"] = !t ? "anchor" : !(await run117(t)).kept ? "red" : "held";
    const t2 = plantedTree("jd-shell-pass", [[path.join("shell", "main.js"), "  const next = (await deskSeatLib()).joinedPeople(readTeamPeople(), teamId, people, at); /* plant:jd-shell-pass */", "  const next = null;"]]);
    planted["jd-shell-pass"] = !t2 ? "anchor" : !(await run117(t2)).kept ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si117 the shell's people screen on a relay team keeps in team-people.json each person the list shows added, seated and on this team, as a Join; a kept"
    + " Join now listed seated false, or missing from the list, goes; one on the lead's other team is kept on neither; a person the lead removed stays"
    + " removed while the service has not answered the removal, or answered it after the list was asked, and is taken back by a list asked after the"
    + " service's answer: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si118 to si120, the test architect's read of ec990251: a large lead, and a Remove that holds on the lead's other computer ---- */
const run118 = async (CL) => {
  const code = (i) => Array.from(crypto.createHash("sha256").update("si118\n" + i).digest(), (b) => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[b & 31]).slice(0, 16).join("");
  const person = (i) => crypto.createHash("sha256").update("si118-person\n" + i).digest("hex");
  const rows = [];
  for (let i = 0; i < 600; i++) rows.push({ code: code(i), person: person(i), signedIn: "2026-11-20", added: true, team: TEAM_ID, seated: true });
  for (let i = 600; i < 650; i++) rows.push({ code: code(i), person: person(i), signedIn: "2026-11-19", added: false, team: null });
  const ask = async () => ({ status: 200, bytes: Buffer.from(JSON.stringify({ ok: true, people: rows })) });
  const got = await CL.listPeople(ask, open, NOW);
  const onTeam = (got.people || []).filter((p) => p.team === TEAM_ID && p.seated === true).length;
  return { all600: onTeam === 600, noTeamCapped: (got.people || []).length === 600 };
};
await leg("si118", async () => {
  const out = await run118(C);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) {
    const t = plantedTree("jd-client-past-500", [[path.join("src", "licence-client.mjs"),
      "const valid = valid0.slice(0, 500).concat(valid0.slice(500).filter((x) => TEAM_RE.test(String(x.team)))); /* plant:jd-client-past-500 */", "const valid = valid0.slice(0, 500);"]]);
    planted["jd-client-past-500"] = !t ? "anchor" : !(await run118(await import(pathToFileURL(path.join(t, "src", "licence-client.mjs")).href + "?si118"))).all600 ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si118 a large lead: of 600 members on a team and 50 rows naming none, listPeople keeps all 600 members, past the first 500, and caps the rest at 500"
    + " in all: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});
await leg("si119", async () => {
  const sent = [];
  const ask = async (route, bytes) => { sent.push({ route, body: JSON.parse(Buffer.from(bytes).toString("utf8")) }); return { status: 200, bytes: Buffer.from('{"ok":true}') }; };
  const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(open.public, "hex")]), format: "der", type: "spki" });
  const verify = (bytes, sig) => crypto.verify(null, Buffer.from(bytes), pub, Buffer.from(String(sig), "hex"));
  const plain = await C.withdrawPerson(ask, open, PERSON_KIT, NOW);
  const off = await C.withdrawPerson(ask, open, PERSON_KIT, NOW + 1, TEAM_ID);
  const n = sent.length;
  const bad = await C.withdrawPerson(ask, open, PERSON_KIT, NOW + 2, "not a team");
  const a = sent[0] ? sent[0].body : {}, b = sent[1] ? sent[1].body : {};
  const parts = {
    plain: plain.ok === true && JSON.stringify(Object.keys(a).sort()) === '["lead","person","sig","t"]' && verify(Q.personWithdrawBytes({ person: PERSON_KIT, lead: open.public, t: NOW }), a.sig),
    team: off.ok === true && JSON.stringify(Object.keys(b).sort()) === '["lead","person","sig","t","team"]' && b.team === TEAM_ID
      && verify(Q.personWithdrawBytes({ person: PERSON_KIT, team: TEAM_ID, lead: open.public, t: NOW + 1 }), b.sig)
      && !verify(Q.personWithdrawBytes({ person: PERSON_KIT, lead: open.public, t: NOW + 1 }), b.sig),
    badSendsNothing: bad.ok === false && sent.length === n,
  };
  check(Object.values(parts).every(Boolean),
    "si119 withdrawPerson with a relay team's id posts person/withdraw {person, team, lead, t, sig}, the team signed in its own line; without one, the"
    + " body and bytes as before; another team value sends nothing: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});
const run120 = async (root) => {
  const DESK_KIT = "k-c3c3c3c3c3c3c3c3", OTHER = "t-5a5a5a5a5a5a5a5a";
  const thread = (verb) => Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [{ id: DESK_KIT }] } }
    : verb === "removeMember" ? { removed: true, team: { id: TEAM_ID, epoch: 1 } } : {});
  /* No relay is reached here: the catch-up counts as run, so the Remove goes ahead in step (a removal waits otherwise, Claude alpha's
     ruling of 2026-11-23 00:37). */
  const sh = await shellOn({ thread, root, env: { STUDIO_TEST_RELAY_CAUGHT_UP: "1" } });
  const was = answer, sent = [];
  answer = async (url, init) => {
    const route = String(url).replace(/^.*\/v1\//, "");
    sent.push({ route, body: init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : null });
    return route === "person/withdraw" ? { status: 200, body: '{"ok":true}' } : { status: 404, body: "{}" };
  };
  const settle = async () => { for (let i = 0; i < 200; i++) {
    const w = sh.mod.withdrawNow ? sh.mod.withdrawNow() : null;
    if (w) await w; else { await new Promise((r) => setTimeout(r, 10)); if (!(sh.mod.withdrawNow && sh.mod.withdrawNow())) return; } } };
  let before = 0, after = null, body = null, teamSends = 0;
  try {
    await sh.ask("studio:key-make");
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
    fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: Object.assign(relayRow(TEAM_ID), relayRow(OTHER, {})) }) + "\n");
    fs.writeFileSync(sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_KIT]: { via: "join", at: 1 } }, [OTHER]: { [PERSON_KIT]: { code: KIT, at: 1 } } }));
    fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: {
      [DESK_KIT]: { state: "seated", seat: PERSON_KIT, code: KIT, until: NOW + 86400000, last: PERSON_KIT } } } }));
    before = Date.now();
    await sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK_KIT, true);
    await settle();
    try { await sh.mod.watchOnce(); } catch { /* the look's withdrawal is what is read */ }
    await settle();
    after = (JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8"))[TEAM_ID] || {})[PERSON_KIT] || null;
    const w = sent.filter((x) => x.route === "person/withdraw");
    teamSends = w.filter((x) => x.body && x.body.team === TEAM_ID).length;
    body = w.length ? w[w.length - 1].body : null;
  } finally { answer = was; sh.done(); }
  let signed = false;
  if (body) {
    const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(String(body.lead), "hex")]), format: "der", type: "spki" });
    signed = crypto.verify(null, Buffer.from(Q.personWithdrawBytes({ person: body.person, team: body.team, lead: body.lead, t: body.t })), pub, Buffer.from(String(body.sig), "hex"));
  }
  /* MOVED twice. The read of ff35a9e5, finding 2: the unplace also went once before the relay removal, so the pass after it was the second
     (teamSends >= 2). The read of the relay door, D: it goes only once the removal has landed, and the pass that sends it is started at once and
     waited on, so that pass is the one send (teamSends >= 1). */
  return { sent: !!body && body.person === PERSON_KIT && body.team === TEAM_ID && signed && teamSends >= 1,
    acked: !!after && Number.isFinite(after.removed) && after.unplace === undefined && after.withdraw === undefined && Number.isFinite(after.ackAt) && after.ackAt >= before };
};
await leg("si120", async () => {
  const out = await run120(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) for (const [name, from, to, part] of [
    ["jd-shell-unplace", "  const unplace = !!(await relayIdOf(teamId)); /* plant:jd-shell-unplace */", "  const unplace = false;", "sent"],
    ["jd-shell-unplace-send", "    const a = await C.withdrawPerson(wire.licenceRequest, open, p, Date.now(), id); /* plant:jd-shell-unplace-send */", "    const a = await C.withdrawPerson(wire.licenceRequest, open, p, Date.now());", "sent"],
  ]) {
    const t = plantedTree(name, [[path.join("shell", "main.js"), from, to]]);
    planted[name] = !t ? "anchor" : !(await run120(t))[part] ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si120 Remove of a person still in another of the lead's teams, on a relay team, asks the service to take them off that team alone (person/withdraw"
    + " with the team, signed), and the answer marks when (ackAt), nothing left owed: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si121, Claude alpha's condition 2 on person/withdraw's team (2026-11-22): Remove's words say, before the press, which it will be ---- */
const run121 = async (app, root) => {
  const UNPLACE = "Kit is taken off this team only, wherever you lead it from; their place in their other team stays. They come back to this team only by joining it again or by your admitting them.";
  const drawn = async (removal) => {
    const s = await studio(SIGNED, { source: app, api: { licenceSeats: () => Promise.resolve({ error: null, seats: [], counts: null }) } });
    Object.assign(s.P.S, { open: { dir: TEAM_DIR }, cover: "team", teamWant: "remove", memberGoing: DESK_KIT1, memberName: "",
      desks: { team: { id: TEAM_ID, epoch: 1, sealed: true, roster: [{ id: DESK_KIT1, name: "Kit" }] }, seats: { signedIn: true, desks: {}, removal: { [DESK_KIT1]: removal } } } });
    const f = s.get("teamCoverHtml");
    return f ? plainText(f()) : "";
  };
  const relayKept = await drawn({ computers: 1, scope: "kept", unplace: true });
  const folderKept = await drawn({ computers: 1, scope: "kept" });
  const licence = await drawn({ computers: 1, scope: "licence" });
  /* And the shell says which, as forgetAdmitted will do it: on a relay team, a person still in another team is taken off this one (unplace). */
  const OTHER = "t-5a5a5a5a5a5a5a5a";
  const sh = await shellOn({ root });
  let relayShown = null, folderShown = null;
  try {
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
    fs.writeFileSync(sh.file("team-people.json"), JSON.stringify({ [TEAM_ID]: { [PERSON_KIT]: { code: KIT, at: 1 } }, [OTHER]: { [PERSON_KIT]: { code: KIT, at: 1 } } }));
    fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: { [DESK_KIT1]: { state: "seated", seat: PERSON_KIT, code: KIT, until: NOW + 86400000, last: PERSON_KIT } } } }));
    fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: Object.assign(relayRow(TEAM_ID), relayRow(OTHER)) }) + "\n");
    relayShown = sh.mod.removalShownNow ? await sh.mod.removalShownNow(TEAM_ID, [{ id: DESK_KIT1 }]) : null;
    fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: relayRow(OTHER) }) + "\n");
    folderShown = sh.mod.removalShownNow ? await sh.mod.removalShownNow(TEAM_ID, [{ id: DESK_KIT1 }]) : null;
  } finally { sh.done(); }
  return {
    relayKeptSays: relayKept.indexOf(UNPLACE) >= 0 && relayKept.indexOf("withdrawn") < 0,
    folderKeptNot: folderKept.indexOf("taken off this team only") < 0,
    licenceNot: licence.indexOf("taken off this team only") < 0 && licence.indexOf("withdrawn") >= 0,
    polish: (() => { const L = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8"); const k = '{NAME} is taken off this team only, wherever you lead it from; their place in their other team stays. They come back to this team only by joining it again or by your admitting them.'; const at = L.indexOf(JSON.stringify(k));
      return at >= 0 && /^\s*:\s*"[^"]+"/.test(L.slice(at + JSON.stringify(k).length)); })(),
    shellRelay: !!relayShown && !!relayShown[DESK_KIT1] && relayShown[DESK_KIT1].scope === "kept" && relayShown[DESK_KIT1].unplace === true,
    shellFolder: !!folderShown && !!folderShown[DESK_KIT1] && !folderShown[DESK_KIT1].unplace,
  };
};
await leg("si121", async () => {
  const parts = await run121(APP, ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) {
    const UI_FROM = "    const unplace = rm.scope === \"kept\" && rm.unplace === true /* plant:jd-ui-unplace */";
    planted["jd-ui-unplace"] = APP.split(UI_FROM).length !== 2 ? "anchor"
      : !(await run121(APP.split(UI_FROM).join("    const unplace = false"), ROOT)).relayKeptSays ? "red" : "held";
    const t = plantedTree("jd-shell-says-unplace", [[path.join("shell", "main.js"), "scope === \"kept\" && relay ? { unplace: true } : {}); /* plant:jd-shell-says-unplace */", "{});"]]);
    planted["jd-shell-says-unplace"] = !t ? "anchor" : !(await run121(APP, t)).shellRelay ? "red" : "held";
  }
  parts.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  parts.planted = JSON.stringify(planted);
  check(Object.values(parts).every(Boolean),
    "si121 before the lead presses Remove, the words say which it will be: on a relay team, a person still in another team is taken off this team only"
    + " (the shell says unplace as forgetAdmitted will do it), in English and Polish; a folder team's says nothing of it, and one in no other team still"
    + " says withdrawn: " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si122 to si124, the test architect's read of ff35a9e5: findings 3, 2 and 5 ---------------------------------------------------------- */
/* A Remove on relay team TEAM_ID of Kit's desk, the service and the thread stood in; `people` is team-people.json; the withdrawals sent, in order,
   each with how many removals the thread had been asked for when it went, and Kit's entry after the pass. */
const removeKit = async (root, people, o = {}) => {
  const DESK = "k-c3c3c3c3c3c3c3c3", OTHER = "t-5a5a5a5a5a5a5a5a";
  let removals = 0;
  /* `o.refuses`: the thread refuses the removal as it does for a desk not on the roster or a team file it cannot write (a throw that did not
     land); `o.hangs`: the service never answers a withdrawal; `o.took` and `o.answer` come back filled with how long Remove took and what it said. */
  const thread = (verb) => { if (verb === "removeMember") removals++;
    if (verb === "removeMember" && o.refuses) return Promise.reject(new Error("This member is not on the team's list, so nothing changed."));
    return Promise.resolve(verb === "teamFacts" ? { team: { id: TEAM_ID, epoch: 1, roster: [{ id: DESK }] } } : verb === "removeMember" ? { removed: true, team: { id: TEAM_ID, epoch: 1 } } : {}); };
  /* As run120: the catch-up counts as run, so the Remove goes ahead in step; `o.env` may change that (si128's "race"). */
  const sh = await shellOn({ thread, root, env: Object.assign({ STUDIO_TEST_RELAY_CAUGHT_UP: "1" }, o.env || {}) });
  const was = answer, sent = [];
  answer = async (url, init) => {
    const route = String(url).replace(/^.*\/v1\//, "");
    const body = init && init.body ? JSON.parse(Buffer.from(init.body).toString("utf8")) : null;
    if (route === "person/withdraw") sent.push({ team: body && body.team, person: body && body.person, removals });
    if (route === "person/withdraw" && o.hangs) return new Promise(() => {});
    return route === "person/withdraw" ? { status: 200, body: '{"ok":true}' } : { status: 404, body: "{}" };
  };
  const settle = async () => { for (let i = 0; i < 200; i++) {
    const w = sh.mod.withdrawNow ? sh.mod.withdrawNow() : null;
    if (w) await w; else { await new Promise((r) => setTimeout(r, 10)); if (!(sh.mod.withdrawNow && sh.mod.withdrawNow())) return; } } };
  let after = null, scope = null;
  try {
    await sh.ask("studio:key-make");
    fs.writeFileSync(sh.file("licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", signinCode: CODE1 }));
    fs.writeFileSync(sh.file("teams.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: Object.assign(relayRow(TEAM_ID), relayRow(OTHER)) }) + "\n");
    fs.writeFileSync(sh.file("team-people.json"), JSON.stringify(people(OTHER)));
    fs.writeFileSync(sh.file("desk-seats.json"), JSON.stringify({ [TEAM_ID]: { desks: { [DESK]: { state: "seated", seat: PERSON_KIT, code: KIT, until: NOW + 86400000, last: PERSON_KIT } } } }));
    const shown = sh.mod.removalShownNow ? await sh.mod.removalShownNow(TEAM_ID, [{ id: DESK }]) : null;
    scope = shown && shown[DESK] ? shown[DESK].scope : null;
    const began = Date.now();
    const said = await sh.ask("studio:member-remove", TEAM_DIR, TEAM_ID, DESK, true);
    o.took = Date.now() - began;
    o.answer = said;
    if (!o.hangs) {
      await settle();
      try { await sh.mod.watchOnce(); } catch { /* the look's withdrawal is what is read */ }
      await settle();
    }
    after = (JSON.parse(fs.readFileSync(sh.file("team-people.json"), "utf8"))[TEAM_ID] || {})[PERSON_KIT] || null;
  } finally { answer = was; sh.done(); }
  return { sent, after, scope };
};
const plain122 = (OTHER) => ({ [TEAM_ID]: { [PERSON_KIT]: { code: KIT, at: 1 } } });
const run122 = async (root) => {
  const r = await removeKit(root, plain122);
  /* The pass after the removal sends both (the early unplace, si123, is apart). */
  return { both: r.sent.some((x) => x.team === undefined && x.person === PERSON_KIT) && r.sent.some((x) => x.team === TEAM_ID && x.person === PERSON_KIT && x.removals >= 1),
    acked: !!r.after && Number.isFinite(r.after.ackAt) && r.after.withdraw === undefined && r.after.unplace === undefined };
};
await leg("si122", async () => {
  const out = await run122(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) {
    /* The deciding line is forgetAdmitted's: the unplace owed on a relay team whether or not the licence withdrawal is. */
    const t = plantedTree("jd-shell-unplace-always", [[path.join("shell", "main.js"), "  const unplace = !!(await relayIdOf(teamId)); /* plant:jd-shell-unplace */", "  const unplace = !owed && !!(await relayIdOf(teamId));"]]);
    planted["jd-shell-unplace-always"] = !t ? "anchor" : !(await run122(t)).both ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si122 on a relay team, a Remove that withdraws the person from the licence also takes them off the team at the service, so a withdrawal the service"
    + " keeps (an owner, a co-lead) still leaves no placement; both answered, nothing is owed: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});
/* MOVED (the test architect's read of the relay door, D). Old: "si123 on a relay team, the person is taken off the team at the service before the relay
   removal is asked for". New: after the removal has landed, never before it, so a removal that does not land (si125) unplaces nobody; that it is
   told before Remove answers, and for how long at most, is si127. */
const run123 = async (root) => {
  const r = await removeKit(root, plain122);
  const first = r.sent.find((x) => x.team === TEAM_ID);
  return { after: !!first && first.removals >= 1, answeredOnce: !!r.after && Number.isFinite(r.after.ackAt) && r.after.unplace === undefined };
};
await leg("si123", async () => {
  const out = await run123(ROOT);
  check(Object.values(out).every(Boolean),
    "si123 on a relay team, the person is taken off the team at the service after the relay removal has landed, and nothing is left owed: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});
const run124 = async (root) => {
  const unsure = await removeKit(root, (OTHER) => ({ [TEAM_ID]: { [PERSON_KIT]: { code: KIT, at: 1 } }, [OTHER]: { [PERSON_KIT]: { via: "join", at: 1, unsure: true } } }));
  const sure = await removeKit(root, (OTHER) => ({ [TEAM_ID]: { [PERSON_KIT]: { code: KIT, at: 1 } }, [OTHER]: { [PERSON_KIT]: { via: "join", at: 1 } } }));
  return { unsureIsNoTeam: unsure.scope === "licence" && unsure.sent.some((x) => x.team === undefined), sureIsATeam: sure.scope === "kept" && !sure.sent.some((x) => x.team === undefined) };
};
await leg("si124", async () => {
  const out = await run124(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) {
    const t = plantedTree("jd-shell-unsure", [[path.join("shell", "main.js"), "    if (e && typeof e === \"object\" && !Number.isFinite(e.removed) && !(e.via === \"join\" && e.unsure === true)) return true; /* plant:jd-shell-unsure */",
      "    if (e && typeof e === \"object\" && !Number.isFinite(e.removed)) return true;"]]);
    planted["jd-shell-unsure"] = !t ? "anchor" : !(await run124(t)).unsureIsNoTeam ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si124 a Join in another team that no read naming that team has confirmed (unsure) is no team the person is still in: Remove withdraws them from the"
    + " licence, as it does where they are in no other team; a confirmed one still keeps the admission: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si125 and si127, the test architect's read of the relay door (D): an unplace never outlives a failed removal ------------------------- */
/* Kit's entry as the people file held it before the Remove, for the leg below to read back unchanged. */
const KIT_ENTRY = { code: KIT, at: 1 };
const run125 = async (root) => {
  const o = { refuses: true };
  const r = await removeKit(root, plain122, o);
  return { refused: !!(o.answer && o.answer.error), nothingSent: r.sent.length === 0,
    entryKept: !!r.after && JSON.stringify(r.after) === JSON.stringify(KIT_ENTRY) };
};
await leg("si125", async () => {
  const out = await run125(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) {
    /* The deciding line is the call before the removal: put back where it was, the person is unplaced although the removal did not land. */
    const t = plantedTree("jd-shell-landed", [[path.join("shell", "main.js"), "    let r;\n    try {\n      r = await thread.call(\"removeMember\"", "    await forgetAdmitted(named, who);\n    await withdrawOwed();\n    let r;\n    try {\n      r = await thread.call(\"removeMember\""]]);
    planted["jd-shell-landed"] = !t ? "anchor" : !(await run125(t)).nothingSent ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).every(Boolean),
    "si125 on a relay team, a removal the thread refuses (a desk no longer on the roster, a team file that cannot be written) leaves the person"
    + " on the team at the service too: nothing is sent, nothing is owed, Kit's entry as it was: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});
/* The ceiling: a service that never answers holds Remove for UNPLACE_WAIT_MS and no longer. */
const run127 = async (root) => {
  const o = { hangs: true };
  await removeKit(root, plain122, o);
  return { waited: o.took >= 2800, notLonger: o.took <= 6000, landed: !!(o.answer && !o.answer.error && o.answer.removed !== false), took: o.took };
};
await leg("si127", async () => {
  const out = await run127(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) {
    /* The ceiling is the race against the timer: with a longer timer Remove waits on the service far past three seconds. */
    const t = plantedTree("jd-shell-ceiling", [[path.join("shell", "main.js"), "stop = setTimeout(res, UNPLACE_WAIT_MS); })]); /* plant:jd-shell-first */", "stop = setTimeout(res, 15000); })]); /* plant:jd-shell-first */"]]);
    planted["jd-shell-ceiling"] = !t ? "anchor" : !(await run127(t)).notLonger ? "red" : "held";
    /* And that Remove waits for the unplace at all: with the awaited call taken out, the pass alone tells the service, unawaited. */
    const t2 = plantedTree("jd-shell-first", [[path.join("shell", "main.js"), "      await Promise.race([told, new Promise((res) => { stop = setTimeout(res, UNPLACE_WAIT_MS); })]); /* plant:jd-shell-first */", "      void told;"]]);
    planted["jd-shell-first"] = !t2 ? "anchor" : !(await run127(t2)).waited ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).filter((v) => typeof v === "boolean").every(Boolean),
    "si127 a service that never answers holds Remove for the unplace's three seconds and no longer, and the removal stands: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

/* ---- si128, fold 100: the unplace and the removal that waits compose --------------------------------------------------------------------- */
/* Main's unplace is told only of a removal that landed; the removals piece's first press on a relay team stands only once the relay holds the
   move. A press the relay refuses (a fork) is a removal that waits, applied again by keysAndRemovals: until then the person is still on the team,
   so the service is told nothing and nothing is owed. The control is si122 and si123, the same press with the move held. */
const run128 = async (root) => {
  const o = { env: { STUDIO_TEST_RELAY_CAUGHT_UP: "race", STUDIO_MOVE_SETTLE_MS: "50" } };
  const r = await removeKit(root, plain122, o);
  return { waits: !!o.answer && o.answer.removed === null && o.answer.pending === "k-c3c3c3c3c3c3c3c3", nothingSent: r.sent.length === 0,
    entryKept: !!r.after && JSON.stringify(r.after) === JSON.stringify(KIT_ENTRY) };
};
await leg("si128", async () => {
  const out = await run128(ROOT);
  const planted = process.env.ETIUDA_PLANTS === "off" ? { off: "skipped" } : {};
  if (!planted.off) {
    /* The deciding line: told whenever the thread says removed, as before the race, the person is unplaced although the removal waits. */
    const t = plantedTree("jd-shell-race", [[path.join("shell", "main.js"), "    if (r && r.removed && !racing) { /* plant:jd-shell-race */", "    if (r && r.removed) {"]]);
    planted["jd-shell-race"] = !t ? "anchor" : !(await run128(t)).nothingSent ? "red" : "held";
  }
  out.plants = !!planted.off || Object.values(planted).every((v) => v === "red");
  out.planted = JSON.stringify(planted);
  check(Object.values(out).filter((v) => typeof v === "boolean").every(Boolean),
    "si128 on a relay team, a removal the relay does not hold (refused as a fork) waits and tells the service of nothing: the reply says it waits, nothing is sent"
    + " and Kit's entry is as it was: " + Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
});

dropScratch(A5_SCRATCH, "sign-in");
console.log("sign-in: " + asserted + " assertion(s), " + failed + " failure(s)");
process.exit(Math.min(failed, 63));
