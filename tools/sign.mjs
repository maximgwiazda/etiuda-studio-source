/* THE SIGNING KEY, FROM THE COMMAND LINE. Board 605.
 *
 *     node tools/sign.mjs make --out <file> [--key-id <name>] [--passphrase-file <f>]
 *     node tools/sign.mjs show --out <file>
 *     node tools/sign.mjs ring --out <file> --catalog <id> --ring <file> [--note <text>]
 *     node tools/sign.mjs check --out <file> [--passphrase-file <f>]
 *     node tools/sign.mjs grant --lead <key file> --root <key file> --out <file> [--days N] [--paid|--trial]
 *                              [--passphrase-file <f>]
 *     node tools/sign.mjs delegate --key <service key file> --root <root key file> --may licence,relay-grant --out <file>
 *                              [--days N] [--staging] [--passphrase-file <f>]
 *     node tools/sign.mjs secrets --root <root key file> [--staging] [--days N] [--key-id <name>] [--new-hash-key]
 *                              [--config <wrangler.toml>] [--wrangler <wrangler.js>] [--passphrase-file <f>]
 *                              [--cf-keyring <service>/<user> --cf-account <id>]
 *     node tools/sign.mjs stripe [--staging] [--config <wrangler.toml>] [--wrangler <wrangler.js>]
 *                              [--cf-keyring <service>/<user> --cf-account <id>]
 *     node tools/sign.mjs note --root <root key file> --app desk|studio --serial N --version X.Y.Z --released YYYY-MM-DD
 *                              --url https://etiuda.dev/... --out <file> [--passphrase-file <f>]
 *
 * --out IS REQUIRED AND IS NOT GUESSED. The file Studio reads is `signing-key.json` in Studio's
 * own settings folder, which on Windows is %APPDATA%\etiuda-studio and is Electron's answer
 * rather than a path anything here can compute without starting Electron; STUDIO_SIGNING_KEY
 * names another. Defaulting to the working directory would put a private key wherever the person
 * happened to be standing, and in this tree that is a repository.
 *
 * `make` writes one key file and prints the two things a desk has to be told: the keyId and the
 * public half. It takes any passphrase but an empty one, and then says its strength on stderr in the backup cover's
 * own words, from the cover's own measure (ui/strength.js): a line to read, never a refusal, and never the passphrase
 * (finding 31, Maxim 2026-10-16 07:09). `show` prints them again from an existing file and opens nothing, which is the
 * point of keeping the public half in the clear.
 *
 * `ring` writes the file that tells a desk to trust this key FOR ONE CATALOG, and it is the door
 * for a key that has not published anything yet: a publish writes the entry by itself (board
 * 605), so this is for the manager who knows the catalog id before the first edition, who is
 * writing a ring for a catalog published on another desk, or who is adding the new key of a
 * rotation to a ring that must keep the old one. It opens nothing and needs no passphrase - an
 * entry is the keyId and the public half, both readable in the clear - and it never removes an
 * entry: merging is appending, and taking a key out of a ring is a person's own act on their own
 * copy. docs/signing-keys.md is the procedure.
 *
 * `check` is the yearly proof that the passphrase kept on paper still opens a key file (board 927). It takes the passphrase
 * exactly as `make` does, tries to open the private half, and says "opens" with exit 0 or "does not open" with exit 2,
 * and nothing else: never the key, never the passphrase, never a byte of the sealed part. A wrong passphrase and a file
 * altered since it was made cannot be told apart, because the wrap authenticates the sealed part, so both say "does not
 * open". A file that is absent, or is no key file, says so in one line of this tool's own words, never echoing the file. It
 * writes nothing and signs nothing. The key the operating system keeps has no passphrase and is refused, with that said.
 *
 * `grant` makes the document the Etiuda relay asks for before it makes a team (board 935, slice G3): the root key's signature
 * over the lead's public key, the instant it is issued and the instant it ends, and whether the licence is paid. The lead's
 * public half is read from --lead, a Studio key file, and never typed; the root key file in --root is opened with its
 * passphrase exactly as `check` takes one (STUDIO_KEY_PASSPHRASE or --passphrase-file), and an empty one is refused. --days is
 * how long it holds, 30 unless named and never over 45, the longest the relay accepts whoever signs. --paid or --trial says
 * whether the licence is paid; a grant that names neither is a trial's. The bytes signed are the pinned relay's own
 * (relay/core.cjs grantBytes), so what is written is what the relay and Studio verify. --out is required and is not guessed:
 * Studio reads relay-grant.json in its own settings folder, beside signing-key.json (%APPDATA%\etiuda-studio on Windows), or
 * beside the key file STUDIO_SIGNING_KEY names. A file already at --out is replaced only if it is itself a relay grant, which
 * is how a grant is renewed; any other file, a key file above all, is refused and left as it was. The root's private half is
 * opened for one signature and is never printed, written or put anywhere; the grant holds the lead's public half only.
 *
 * `delegate` makes the document the licence service's key is certified by (licence service S3, board 936): the root key's signature over
 * the service key's id and public half, what the key may do, and the instant the delegation starts and the instant it ends, which the
 * root, kept offline, makes once a year (decisions 2026-10-20 11:51). The service key's public half and id are read from --key, a Studio key file
 * that must be held under a passphrase: the service key's private half becomes a Worker secret, and a key file of it left plain on disk
 * is the leak this refuses. Only its public half is read, and its passphrase is never asked. --may names the uses, a comma list of
 * `licence` and `relay-grant`, at least one and none twice. --days is how long it holds, 365 unless named and never over 366, the
 * longest the relay accepts whoever signs (relay/core.cjs DELEGATION_MAX_MS); with --staging, which is for a staging service key, it is
 * 45 unless named and never over 45. The root key file in --root is opened with its passphrase exactly as `grant` opens it. The bytes signed
 * are the pinned relay's own (relay/core.cjs delegationBytes), and what is made is verified under the root's public half before it is written.
 * --out is required and is not guessed or a key file; a file already there is replaced only if it is itself a delegation, which is how the
 * year's delegation is renewed. The root's private half is opened for one signature and is never printed, written or put anywhere.
 *
 * `secrets` is the one command Maxim runs to give the licence service its three Worker secrets (licence service S7, the test architect's
 * A5 and C1), and the only way the service key's private half is meant to exist: it makes the service key in this process, has the root
 * (--root, opened with its passphrase exactly as `delegate` opens it) sign its delegation for "licence" and "relay-grant", as `delegate`
 * signs one, with the same bounds (--staging: 45 days unless named and never over), draws HASH_KEY, 32 random bytes, and puts SERVICE_KEY
 * (the PKCS#8 in hex), DELEGATION (the JSON) and HASH_KEY each by `wrangler secret put <NAME> --config <toml>`, the value on wrangler's
 * stdin. --config is the licence service's wrangler.toml, this tree's service/licence/wrangler.toml unless named. The private half and
 * the hash key are never printed, written to a file or put in an argument, and wrangler does not inherit the passphrase; a key file of the
 * service key is never made, so there is none to leave plain. HASH_KEY is kept (the test architect's E1): wrangler is asked which
 * secrets the Worker holds, names only, and HASH_KEY is put only where it holds none, or where --new-hash-key asks, after a warning on
 * stderr that every address, domain, code and request the service kept stops matching. `secrets` is run by Maxim himself, never by an
 * agent, since whoever runs it holds the service key's private half (the test architect's A5). wrangler is run by this node, never a shell
 * (tools/wrangler.mjs): the entry script --wrangler names, else npx asking for the pinned version. It prints the key id, the public half
 * and the delegation's window, which a desk may be told. Each run makes a new service key. With --cf-keyring <service>/<user> and --cf-account
 * <id>, wrangler needs no login: the Cloudflare API token is read from that Windows keyring entry (Python's keyring, tools/wrangler.mjs
 * readKeyring, which runs the `python` found on PATH with its keyring module, an assumption of Maxim's terminal; nothing in the
 * environment can name another reader) into this process's memory and handed to each put as CLOUDFLARE_API_TOKEN, with CLOUDFLARE_ACCOUNT_ID, in wrangler's
 * environment alone, never this process's, never printed, written or an argument; an empty or missing entry stops the command before
 * anything is made. Without them, wrangler's own login stands.
 *
 * `stripe` puts Stripe's two secrets into the licence service's Worker (the payment design, B2; Max, 2026-11-13 17:37: "Agreed on
 * Stripe"): STRIPE_WEBHOOK_SECRET and STRIPE_API_KEY, the names service/licence/pay-stripe.mjs reads, from the keyring entries the
 * office's tools/stripe-keep.py keeps, etiuda-stripe/<mode>-webhook-secret and etiuda-stripe/<mode>-restricted-key. With --staging
 * the mode is test and the Worker --config names must be a staging one (its name ends -staging); without it the mode is live and
 * the Worker must not be. Both entries are read through readKeyring and checked against the service's own shapes before anything
 * is put (a whsec_ secret; a restricted key of that mode, rk_test_ or rk_live_, never a secret key), then each is put by `wrangler
 * secret put <NAME> --config <toml>` with the value on wrangler's stdin: never printed, never an argument, never a file. A put
 * wrangler refuses stops the rest and says what was put. --cf-keyring and --cf-account work as for `secrets`. It holds no key of
 * its own and signs nothing, so it asks no passphrase, and the passphrase is taken out of wrangler's environment as for `secrets`.
 *
 * `note` makes the version note a program reads to offer its update (board 991; Max's ruling of 2026-10-06 22:07: "Each program
 * reads a small signed version note (form B) from etiuda.dev"): the root key's signature over the app it is for, a serial that
 * never goes back, the version, its release day and the release page's https address on etiuda.dev, in the format the office
 * keeps and src/update-note.mjs reads. Every bound is checked before
 * the root is opened, the note made is read back under the root's public half by that same reader, and only then written. The
 * root key file in --root is opened with its passphrase exactly as `grant` opens it, for one signature, and is never printed,
 * written or put anywhere. --out is required; a file already there is replaced only if it is itself a version note, and only by
 * one with a higher serial for the same app, so a note that went out cannot be overwritten by an older one by mistake. The
 * note goes to the licence service as the Worker secret NOTE_DESK or NOTE_STUDIO, its JSON on wrangler's stdin:
 * `wrangler secret put NOTE_STUDIO --config service/licence/wrangler.toml < <file>`. Nothing here sends it.
 *
 * THE PASSPHRASE NEVER ARRIVES AS AN ARGUMENT, for the reason tools/publish.mjs gives: an
 * argument list is readable by every other process while this one runs. STUDIO_KEY_PASSPHRASE
 * or a file.
 *
 * IT REFUSES TO WRITE OVER A KEY FILE. There is no --force and there should not be: the private
 * half exists in exactly one place, a catalog signed with it can be verified by nothing else,
 * and a command that could replace it by accident would be a command that could silently orphan
 * every catalog already published. Moving the old file out of the way is a decision a person
 * takes with their own hands.
 *
 * EXIT CODES: 0 done, 2 refused.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { makeKeyFile, readKeyFile, unlockKey, OS_WRAP, KEY_FILE } from "../src/sign.mjs";
import { ringFor, RING_FILE } from "../src/ring.mjs";
import * as Engine from "../src/engine.mjs";
import { readJson, jsonText } from "../src/plain-json.mjs";
import { parse } from "./publish.mjs";
import { wranglerArgv, readKeyring } from "./wrangler.mjs";
import * as Note from "../src/update-note.mjs";

const TREE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function die(line) { process.stderr.write("sign  " + line + "\n"); process.exit(2); }
const say = l => process.stdout.write("sign  " + l + "\n");

function passphraseOf(args) {
  if (args.passphrase !== undefined)
    die("there is no --passphrase: an argument list is readable by every process on this"
      + " machine. Use --passphrase-file <f>, or set STUDIO_KEY_PASSPHRASE");
  if (typeof args["passphrase-file"] === "string") {
    if (!fs.existsSync(args["passphrase-file"]))
      die("no passphrase file at " + args["passphrase-file"]);
    return fs.readFileSync(args["passphrase-file"], "utf8").replace(/\r?\n$/, "");
  }
  return process.env.STUDIO_KEY_PASSPHRASE || "";
}

/* What a file that is no key file is told in. The reader's own sentence where it holds only the path; a fixed one where it
   would echo the file, which is a JSON parser's snippet of its first characters, or a schema or an algorithm as the file
   spelt it. Nothing the file holds reaches the screen. */
function unreadable(e, out) {
  const m = String(e && e.message || "");
  if (/ is not JSON: /.test(m)) return "the key file at " + out + " is not JSON, so it is not a key file";
  if (/ is not an Etiuda Studio signing key$/.test(m) || / has no 32-byte public half$/.test(m)) return m;
  if (/ is schema /.test(m)) return "the key file at " + out + " is a schema this Studio does not read";
  if (/ names algorithm /.test(m)) return "the key file at " + out + " names an algorithm this Studio does not sign with";
  return "the file at " + out + " could not be read as a key file";
}

/* THE RELAY GRANT (board 935, slice G3). Every refusal is one line of this tool's own words and exits 2; nothing is written
   before the last of them has passed. */
const GRANT_DAYS_DEFAULT = 30, DAY_MS = 24 * 60 * 60 * 1000;
function needCore(C, fns, consts) {
  if (!C || !fns.every(f => typeof C[f] === "function") || !consts.every(c => C[c] !== undefined))
    die("the engine this checkout has pinned is older than this command: run node tools/engine-fetch.mjs");
}
async function grantMain(args) {
  const C = Engine.relayRules().core;
  needCore(C, ["grantBytes", "grantOk"], ["GRANT_MAX_MS", "ROOT_PUB"]);
  const maxDays = Math.floor(C.GRANT_MAX_MS / DAY_MS);
  if (typeof args.out !== "string")
    die("--out <file> is required: Studio reads relay-grant.json in its own settings folder, beside signing-key.json"
      + " (%APPDATA%" + String.fromCharCode(92) + "etiuda-studio on Windows), or beside the key file STUDIO_SIGNING_KEY points at");
  if (typeof args.lead !== "string") die("--lead <file> is required: the Studio key file whose public half the grant is for");
  if (typeof args.root !== "string") die("--root <file> is required: the root key file that signs the grant");
  if (args.paid !== undefined && args.paid !== true) die("--paid takes no value");
  if (args.trial !== undefined && args.trial !== true) die("--trial takes no value");
  if (args.paid === true && args.trial === true) die("a grant is for a paid licence or for a trial, and not both: give --paid or --trial");
  let days = GRANT_DAYS_DEFAULT;
  if (args.days !== undefined) {
    if (typeof args.days !== "string" || !/^[0-9]+$/.test(args.days))
      die("--days is a whole number of days from 1 to " + maxDays);
    days = Number(args.days);
    if (days < 1) die("--days is a whole number of days from 1 to " + maxDays);
    if (days > maxDays) die("a grant holds for at most " + maxDays + " days, whoever signs it, and --days " + days + " is more"); /* plant:g3-days */
  }
  const out = path.resolve(args.out), leadAt = path.resolve(args.lead), rootAt = path.resolve(args.root);
  if (out === leadAt || out === rootAt) die("--out is the file the grant is written to, and is not a key file");
  let lead, root;
  try { lead = readKeyFile(leadAt); } catch (e) { die(unreadable(e, leadAt)); }
  if (!lead) die("no key file at " + leadAt);
  let passphrase;
  try { passphrase = passphraseOf(args); }
  catch (e) { die("the passphrase file at " + args["passphrase-file"] + " could not be read"); }
  if (!passphrase) die("a signing key needs a passphrase: --passphrase-file <f>, or STUDIO_KEY_PASSPHRASE"); /* plant:g3-passphrase */
  try { root = readKeyFile(rootAt); } catch (e) { die(unreadable(e, rootAt)); }
  if (!root) die("no key file at " + rootAt);
  if (root.kept === OS_WRAP)
    die("the key file at " + rootAt + " is the one the operating system keeps and has no passphrase; the root key is a passphrase key");
  let open;
  try { open = unlockKey(root, passphrase); } catch (e) { die("the root key file at " + rootAt + " does not open: the passphrase is wrong, or the file has been altered"); }
  /* An existing file at --out is replaced only if it is itself a relay grant, which is how a grant is renewed. */
  if (fs.existsSync(out)) {
    let held = null;
    try { held = readJson(out); } catch { held = null; }
    if (!held || typeof held !== "object" || held.kind !== "etiuda-relay-grant") /* plant:g3-over */
      die("there is already a file at " + out + " that is not a relay grant; move it aside yourself if you mean to replace it");
  }
  const issued = Date.now(), paid = args.paid === true;
  const grant = { kind: "etiuda-relay-grant", format: 1, lead: lead.public, issued, until: issued + days * DAY_MS, paid,
    sig: { alg: "ed25519", keyId: root.keyId, value: "" } };
  grant.sig.value = crypto.sign(null, C.grantBytes(grant), open.privateKey).toString("hex"); /* plant:g3-bytes */
  if (!C.grantOk(grant, lead.public, issued, [root.public])) die("the grant made does not verify under the root key, so nothing was written");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, jsonText(grant), "utf8");
  say("wrote " + out);
  say("lead     " + lead.public);
  say("until    " + new Date(grant.until).toISOString() + " (" + days + " day" + (days === 1 ? "" : "s") + ")");
  say("paid     " + (paid ? "yes" : "no, a trial"));
  if (root.public !== C.ROOT_PUB)
    process.stderr.write("sign  note: this root key is not the vendor root the relay trusts, so the grant holds only under another root\n");
}

/* THE DELEGATION (licence service S3, board 936). Every refusal is one line of this tool's own words and exits 2; nothing is written
   before the last of them has passed. */
const DELEGATION_DAYS_DEFAULT = 365, DELEGATION_STAGING_DAYS = 45, DELEGATION_USES = ["licence", "relay-grant"];
const SPKI_ED25519 = Buffer.from("302a300506032b6570032100", "hex");
const HEX = /^[0-9a-f]+$/;

/* A key file whose private half is sealed under a passphrase: a wrap of the scrypt and AES-GCM kind src/sign.mjs writes, with its salt, its
   nonce and its tag, over bytes that are not themselves a private key. A file that only says it is wrapped, over a private half in the clear,
   is the leak this exists to stop. */
function wrappedUnderPassphrase(doc) {
  const w = doc && doc.wrap;
  if (!w || typeof w !== "object" || Array.isArray(w) || w.kdf !== "scrypt" || w.cipher !== "aes-256-gcm") return false;
  if (!["salt", "iv", "tag"].every(k => typeof w[k] === "string" && HEX.test(w[k]))) return false;
  if (typeof doc.private !== "string" || !HEX.test(doc.private)) return false;
  try { crypto.createPrivateKey({ key: Buffer.from(doc.private, "hex"), format: "der", type: "pkcs8" }); return false; } catch { return true; }
}

/* The delegation holds under the root: the root's signature over the bytes the pinned relay checks, and, where it lets the key sign relay
   grants, the pinned relay's own judgement of a grant that names it, which reaches the grant's own signature only when every check of the
   delegation (its kind and shape, its uses, its window and its span) has passed. */
function delegationHolds(C, d, rootPub) {
  let signed = false;
  try {
    signed = crypto.verify(null, C.delegationBytes(d), crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(rootPub, "hex")]), format: "der", type: "spki" }),
      Buffer.from(d.sig.value, "hex"));
  } catch { signed = false; }
  if (!signed) return false;
  if (d.may.indexOf("relay-grant") < 0) return true;
  const grant = { kind: "etiuda-relay-grant", format: 1, lead: d.key.pub, issued: d.from, until: d.from + 1000, paid: false,
    sig: { alg: "ed25519", keyId: d.key.id, value: "0".repeat(128) }, via: d };
  return C.grantWhy(grant, d.key.pub, d.from, [rootPub]) === "signature";
}

async function delegateMain(args) {
  const rules = Engine.relayRules(), C = rules.core;
  needCore(C, ["delegationBytes", "grantWhy"], ["DELEGATION_MAX_MS", "ROOT_PUB"]);
  if (!rules.blob || typeof rules.blob.isId !== "function")
    die("the engine this checkout has pinned is older than this command: run node tools/engine-fetch.mjs");
  const maxDays = Math.floor(C.DELEGATION_MAX_MS / DAY_MS);
  if (typeof args.out !== "string")
    die("--out <file> is required: the delegation goes where the licence service reads it, and the tool does not guess a place for it");
  if (typeof args.key !== "string") die("--key <file> is required: the service key file whose public half the delegation certifies");
  if (typeof args.root !== "string") die("--root <file> is required: the root key file that signs the delegation");
  if (args.staging !== undefined && args.staging !== true) die("--staging takes no value");
  const staging = args.staging === true, longest = staging ? DELEGATION_STAGING_DAYS : maxDays;
  if (typeof args.may !== "string")
    die("--may <uses> is required: a comma list of what the key may do, from " + DELEGATION_USES.join(" and "));
  const may = args.may.split(",");
  if (!may.every(m => DELEGATION_USES.indexOf(m) > -1)) /* plant:d3-may */
    die("--may names a use this tool does not know: it is a comma list of " + DELEGATION_USES.join(" and ") + ", in lower case, with no space");
  if (new Set(may).size !== may.length) die("--may names a use twice");
  let days = staging ? DELEGATION_STAGING_DAYS : DELEGATION_DAYS_DEFAULT;
  if (args.days !== undefined) {
    if (typeof args.days !== "string" || !/^[0-9]+$/.test(args.days))
      die("--days is a whole number of days from 1 to " + longest);
    days = Number(args.days);
    if (days < 1) die("--days is a whole number of days from 1 to " + longest);
    if (!staging && days > maxDays) die("a delegation holds for at most " + maxDays + " days, whoever signs it, and --days " + days + " is more"); /* plant:d3-days */
    if (staging && days > DELEGATION_STAGING_DAYS) die("a staging service key's delegation holds for at most " + DELEGATION_STAGING_DAYS + " days, and --days " + days + " is more"); /* plant:d3-staging */
  }
  const out = path.resolve(args.out), keyAt = path.resolve(args.key), rootAt = path.resolve(args.root);
  if (out === keyAt || out === rootAt) die("--out is the file the delegation is written to, and is not a key file");
  let service, root;
  try { service = readKeyFile(keyAt); } catch (e) { die(unreadable(e, keyAt)); }
  if (!service) die("no key file at " + keyAt);
  if (service.kept === OS_WRAP)
    die("the key file at " + keyAt + " is the one the operating system keeps and has no passphrase; the service key's private half becomes a Worker secret,"
      + " so a delegation is made only for a key held under a passphrase");
  if (!wrappedUnderPassphrase(service.doc)) /* plant:d3-wrap */
    die("the key file at " + keyAt + " is not held under a passphrase; the service key's private half becomes a Worker secret, and a plain file of it on disk"
      + " is the leak this refuses, so a delegation is made only for a key held under a passphrase");
  if (!rules.blob.isId(service.keyId)) die("the key id in " + keyAt + " is not an id the relay accepts");
  let passphrase;
  try { passphrase = passphraseOf(args); }
  catch (e) { die("the passphrase file at " + args["passphrase-file"] + " could not be read"); }
  if (!passphrase) die("a signing key needs a passphrase: --passphrase-file <f>, or STUDIO_KEY_PASSPHRASE");
  try { root = readKeyFile(rootAt); } catch (e) { die(unreadable(e, rootAt)); }
  if (!root) die("no key file at " + rootAt);
  if (root.kept === OS_WRAP)
    die("the key file at " + rootAt + " is the one the operating system keeps and has no passphrase; the root key is a passphrase key");
  if (!rules.blob.isId(root.keyId)) die("the key id in " + rootAt + " is not an id the relay accepts, so a delegation it signed would be refused"); /* plant:d3-root-id */
  if (root.public === service.public) die("--key and --root are the same key: a delegation is for a service key other than the root key");
  let open;
  try { open = unlockKey(root, passphrase); } catch (e) { die("the root key file at " + rootAt + " does not open: the passphrase is wrong, or the file has been altered"); }
  /* An existing file at --out is replaced only if it is itself a delegation, which is how the year's delegation is renewed. */
  if (fs.existsSync(out)) {
    let held = null;
    try { held = readJson(out); } catch { held = null; }
    if (!held || typeof held !== "object" || held.kind !== "etiuda-delegation") /* plant:d3-over */
      die("there is already a file at " + out + " that is not a delegation; move it aside yourself if you mean to replace it");
  }
  const from = Date.now();
  const delegation = { kind: "etiuda-delegation", format: 1, key: { id: service.keyId, pub: service.public }, may, from, until: from + days * DAY_MS,
    sig: { alg: "ed25519", keyId: root.keyId, value: "" } };
  delegation.sig.value = crypto.sign(null, C.delegationBytes(delegation), open.privateKey).toString("hex"); /* plant:d3-bytes */
  if (!delegationHolds(C, delegation, root.public)) die("the delegation made does not verify under the root key, so nothing was written");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, jsonText(delegation), "utf8");
  say("wrote " + out);
  say("keyId    " + service.keyId);
  say("may      " + may.join(","));
  say("from     " + new Date(delegation.from).toISOString());
  say("until    " + new Date(delegation.until).toISOString() + " (" + days + " day" + (days === 1 ? "" : "s") + ")");
  if (root.public !== C.ROOT_PUB)
    process.stderr.write("sign  note: this root key is not the vendor root the relay trusts, so the delegation holds only under another root\n");
}

/* Cloudflare's token, where the keyring holds it (--cf-keyring <service>/<user> --cf-account <id>): read into this process's memory
   before anything is made or put, and handed to wrangler in its environment alone; null without the two options, so wrangler's own
   login stands. `nothing` ends each refusal, saying what the command had not yet done. Used by `secrets` and `stripe`. */
function cloudflareFrom(args, keyringReader, nothing) {
  const ring = args["cf-keyring"], account = args["cf-account"];
  if (ring !== undefined && account === undefined) die("--cf-keyring needs --cf-account <id>, the Cloudflare account the token is for");
  if (account !== undefined && ring === undefined) die("--cf-account needs --cf-keyring <service>/<user>, the keyring entry holding the token");
  if (ring === undefined) return null;
  const m = typeof ring === "string" ? /^([^/\s]+)\/([^/\s]+)$/.exec(ring) : null;
  if (!m) die("--cf-keyring is <service>/<user>, the keyring entry holding the Cloudflare token");
  if (typeof account !== "string" || !/^[0-9a-f]{32}$/.test(account)) die("--cf-account is a Cloudflare account id, 32 hex characters");
  const got = readKeyring(m[1], m[2], keyringReader);
  if (got.error) die(got.error + "; " + nothing);
  if (!got.value) die("the keyring entry " + m[1] + "/" + m[2] + " is empty or missing, so there is no Cloudflare token; " + nothing); /* plant:cf-empty */
  return { CLOUDFLARE_API_TOKEN: got.value, CLOUDFLARE_ACCOUNT_ID: account }; /* plant:cf-account */
}

/* wrangler's environment for every call a command makes: the passphrase taken out, metrics off, and the keyring's token where one
   was read. Never process.env: only this copy. */
function wranglerEnv(cloudflare) {
  const env = Object.assign({}, process.env, { WRANGLER_SEND_METRICS: "false" });
  delete env.STUDIO_KEY_PASSPHRASE; /* plant:s7-env */
  if (cloudflare) {
    delete env.CLOUDFLARE_API_KEY; delete env.CLOUDFLARE_EMAIL;
    Object.assign(env, cloudflare); /* plant:cf-env */
  }
  return env;
}

/* THE SERVICE'S SECRETS (licence service S7, the test architect's A5 and C1). Every refusal before the first put is one line of this tool's
   own words and exits 2, with nothing put; a put wrangler refuses stops the rest and says what was put and what was not. Nothing is written
   to disk, and the service key's private half and the hash key are handed to wrangler on its stdin and nowhere else: never printed, never an
   argument, never a file, and the passphrase is taken out of the environment wrangler inherits. */
const SECRET_NAMES = ["SERVICE_KEY", "DELEGATION", "HASH_KEY"];
export async function secretsMain(args, o) {
  /* `o.keyringReader` is for a leg's driver, which imports this file and hands it in; nothing in the environment names one (E3). */
  const keyringReader = o && typeof o.keyringReader === "function" ? o.keyringReader : undefined;
  const rules = Engine.relayRules(), C = rules.core;
  needCore(C, ["delegationBytes", "grantWhy"], ["DELEGATION_MAX_MS", "ROOT_PUB"]);
  if (!rules.blob || typeof rules.blob.isId !== "function")
    die("the engine this checkout has pinned is older than this command: run node tools/engine-fetch.mjs");
  const maxDays = Math.floor(C.DELEGATION_MAX_MS / DAY_MS);
  if (args.out !== undefined)
    die("secrets writes no file: the service key's private half goes only into the Worker's secrets, so there is no --out");
  if (args.key !== undefined)
    die("secrets makes the service key itself and takes no key file, so the private half is never on disk; there is no --key");
  if (typeof args.root !== "string" || !args.root) die("--root <file> is required: the root key file that signs the service key's delegation");
  if (args.staging !== undefined && args.staging !== true) die("--staging takes no value");
  if (args["keep-hash-key"] !== undefined)
    die("there is no --keep-hash-key: the Worker's HASH_KEY is kept unless --new-hash-key asks for a new one");
  if (args["new-hash-key"] !== undefined && args["new-hash-key"] !== true) die("--new-hash-key takes no value");
  const staging = args.staging === true, longest = staging ? DELEGATION_STAGING_DAYS : maxDays;
  let days = staging ? DELEGATION_STAGING_DAYS : DELEGATION_DAYS_DEFAULT;
  if (args.days !== undefined) {
    if (typeof args.days !== "string" || !/^[0-9]+$/.test(args.days) || Number(args.days) < 1)
      die("--days is a whole number of days from 1 to " + longest);
    days = Number(args.days);
    if (days > longest) die((staging ? "a staging service key's delegation holds for at most " : "a delegation holds for at most ") + longest
      + " days, and --days " + days + " is more");
  }
  const config = path.resolve(typeof args.config === "string" ? args.config : path.join(TREE, "service", "licence", "wrangler.toml"));
  if (!fs.existsSync(config) || !fs.statSync(config).isFile())
    die("there is no wrangler configuration at " + config + ": --config names the licence service's wrangler.toml");
  let wranglerAt;
  try { wranglerAt = wranglerArgv([], { wrangler: typeof args.wrangler === "string" ? args.wrangler : undefined }); } catch (e) { die(e.message); }
  const env = wranglerEnv(cloudflareFrom(args, keyringReader, "nothing was made or put"));
  const rootAt = path.resolve(args.root);
  let passphrase;
  try { passphrase = passphraseOf(args); }
  catch (e) { die("the passphrase file at " + args["passphrase-file"] + " could not be read"); }
  if (!passphrase) die("a signing key needs a passphrase: --passphrase-file <f>, or STUDIO_KEY_PASSPHRASE");
  let root;
  try { root = readKeyFile(rootAt); } catch (e) { die(unreadable(e, rootAt)); }
  if (!root) die("no key file at " + rootAt);
  if (root.kept === OS_WRAP)
    die("the key file at " + rootAt + " is the one the operating system keeps and has no passphrase; the root key is a passphrase key");
  if (!rules.blob.isId(root.keyId)) die("the key id in " + rootAt + " is not an id the relay accepts, so a delegation it signed would be refused");
  let open;
  try { open = unlockKey(root, passphrase); } catch (e) { die("the root key file at " + rootAt + " does not open: the passphrase is wrong, or the file has been altered"); }

  /* THE HASH KEY IS KEPT (the test architect's E1 on S7): every address, domain, code and request the service has kept is hashed
     under it, so a new one unmatches them all. wrangler is asked which secrets the Worker holds, names only, and HASH_KEY is put
     only where it holds none, or where --new-hash-key asks, after a warning that says what that costs. */
  let held;
  const listed = spawnSync(process.execPath, wranglerAt.concat(["secret", "list", "--config", config, "--format", "json"]),
    { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8", env, windowsHide: true });
  try { held = listed.status === 0 ? JSON.parse(String(listed.stdout).slice(String(listed.stdout).indexOf("["))).map(x => x.name) : null; }
  catch { held = null; }
  if (!Array.isArray(held))
    die("wrangler could not say which secrets the Worker holds" + (listed.error ? " (" + listed.error.code + ")" : " (exit " + listed.status + ")")
      + ", so nothing was made or put: deploy the Worker first, and check wrangler's login or --cf-keyring");
  const hashHeld = held.includes("HASH_KEY"); /* plant:e1-held */
  const putHash = !hashHeld || args["new-hash-key"] === true; /* plant:e1-keep */

  /* The service key, made here and held only in this process. */
  const pair = crypto.generateKeyPairSync("ed25519");
  const pub = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const keyId = typeof args["key-id"] === "string" ? args["key-id"]
    : "licence-" + (staging ? "staging-" : "") + crypto.createHash("sha256").update(Buffer.from(pub, "hex")).digest("hex").slice(0, 12);
  if (!rules.blob.isId(keyId)) die("--key-id is not an id the relay accepts: lower case letters, digits and hyphens");
  if (pub === root.public) die("the service key came out as the root key, which cannot happen; nothing was put");
  const from = Date.now();
  const delegation = { kind: "etiuda-delegation", format: 1, key: { id: keyId, pub }, may: DELEGATION_USES.slice(), from, until: from + days * DAY_MS,
    sig: { alg: "ed25519", keyId: root.keyId, value: "" } };
  delegation.sig.value = crypto.sign(null, C.delegationBytes(delegation), open.privateKey).toString("hex");
  if (!delegationHolds(C, delegation, root.public)) die("the delegation made does not verify under the root key, so nothing was put");
  const values = {
    SERVICE_KEY: () => pair.privateKey.export({ type: "pkcs8", format: "der" }).toString("hex"), /* plant:s7-key */
    DELEGATION: () => JSON.stringify(delegation),
    HASH_KEY: () => crypto.randomBytes(32).toString("hex"),
  };
  const names = SECRET_NAMES.filter(n => n !== "HASH_KEY" || putHash);
  if (putHash && hashHeld) /* plant:e1-warn */
    process.stderr.write("sign  WARNING: --new-hash-key replaces the Worker's HASH_KEY. Every address, domain, code and request the service has kept"
      + " is hashed under the old one and stops matching: a buyer activating by email is refused, and a trial already had can be had again.\n");

  /* Each put: wrangler run by this node, its arguments the secret's name and the configuration and nothing else, the value on its stdin. */
  const done = [];
  for (const name of names) {
    const r = spawnSync(process.execPath, wranglerAt.concat(["secret", "put", name, "--config", config]), /* plant:s7-argv */
      { input: values[name](), stdio: ["pipe", "inherit", "inherit"], env, windowsHide: true });
    if (r.status !== 0) { /* plant:s7-stop */
      const rest = names.slice(names.indexOf(name) + 1);
      /* What was put and what was not, what the Worker does now, and what a run again does: nothing it cannot keep (E1 on S7). */
      die("wrangler did not put " + name + (r.error ? " (" + r.error.code + ")" : " (exit " + r.status + ")") + ": " /* plant:e1-said */
        + (done.length ? "put " + done.join(", ") + "; not put " + [name].concat(rest).join(", ")
          + ", so the Worker's service key and delegation may not match, and while they do not it answers unavailable"
          : "nothing was put, and the Worker holds what it held before")
        + (putHash ? "" : "; its HASH_KEY was kept")
        + ". Running this command again" + (args["new-hash-key"] === true ? " without --new-hash-key" : "")
        + " is safe for the hash key, which it puts only where the Worker holds none,"
        + " and it makes a new service key and delegation");
    }
    done.push(name);
  }
  say("put      " + done.join(", ") + " to the Worker in " + config + (putHash ? "" : "; its HASH_KEY was kept"));
  say("keyId    " + keyId);
  say("public   " + pub);
  say("from     " + new Date(delegation.from).toISOString());
  say("until    " + new Date(delegation.until).toISOString() + " (" + days + " day" + (days === 1 ? "" : "s") + ")");
  if (root.public !== C.ROOT_PUB)
    process.stderr.write("sign  note: this root key is not the vendor root the relay trusts, so the delegation holds only under another root\n");
}

/* STRIPE'S TWO SECRETS (the payment design, B2; Max, 2026-11-13 17:37: "Agreed on Stripe"). Every refusal before the first put is one
   line of this tool's own words and exits 2, with nothing put; a refusal of the arguments or of the Worker comes before any entry is
   read. The values are read into this process's memory, judged against the service's own shapes (pay-stripe.mjs judgeConfig, so a
   value put here is one the Worker takes; tests/stripe-secrets.mjs ss2 holds the two together), and handed to wrangler on its stdin
   and nowhere else. */
const STRIPE_RING = "etiuda-stripe";
const STRIPE_PUTS = [["STRIPE_WEBHOOK_SECRET", "webhook-secret"], ["STRIPE_API_KEY", "restricted-key"]];
const STRIPE_HOOK_SHAPE = /^whsec_[\x21-\x7e]{8,200}$/, STRIPE_KEY_SHAPE = /^rk_(test|live)_[A-Za-z0-9]{10,240}$/;
export async function stripeMain(args, o) {
  /* `o.keyringReader` is for a leg's driver, which imports this file and hands it in; nothing in the environment names one (E3). */
  const keyringReader = o && typeof o.keyringReader === "function" ? o.keyringReader : undefined;
  if (args.out !== undefined) die("stripe writes no file: the two secrets go only into the Worker's secrets, so there is no --out");
  if (args.staging !== undefined && args.staging !== true) die("--staging takes no value");
  const staging = args.staging === true, mode = staging ? "test" : "live";
  const config = path.resolve(typeof args.config === "string" ? args.config : path.join(TREE, "service", "licence", "wrangler.toml"));
  if (!fs.existsSync(config) || !fs.statSync(config).isFile())
    die("there is no wrangler configuration at " + config + ": --config names the licence service's wrangler.toml");
  const named = /^name\s*=\s*"([^"]+)"/m.exec(fs.readFileSync(config, "utf8"));
  if (!named) die("the wrangler configuration at " + config + " names no Worker, so nothing was read or put");
  if (/-staging$/.test(named[1]) !== staging) /* plant:stripe-mode */
    die(staging ? "--staging puts Stripe's test-mode secrets, and " + named[1] + " in " + config + " is not a staging Worker; nothing was read or put"
      : named[1] + " in " + config + " is the staging Worker, which takes Stripe's test-mode secrets: add --staging; nothing was read or put");
  let wranglerAt;
  try { wranglerAt = wranglerArgv([], { wrangler: typeof args.wrangler === "string" ? args.wrangler : undefined }); } catch (e) { die(e.message); }
  const env = wranglerEnv(cloudflareFrom(args, keyringReader, "nothing was read or put"));
  const values = {};
  for (const [name, entry] of STRIPE_PUTS) {
    const user = mode + "-" + entry, got = readKeyring(STRIPE_RING, user, keyringReader);
    if (got.error) die(got.error + "; nothing was put");
    if (!got.value) die("the keyring entry " + STRIPE_RING + "/" + user + " is empty or missing: keep it with the office's tools/stripe-keep.py store " + mode
      + "; nothing was put");
    values[name] = got.value;
  }
  const hook = values.STRIPE_WEBHOOK_SECRET, key = values.STRIPE_API_KEY, keyMode = (STRIPE_KEY_SHAPE.exec(key) || [])[1];
  if (!STRIPE_HOOK_SHAPE.test(hook)) /* plant:stripe-shape */
    die("the keyring entry " + STRIPE_RING + "/" + mode + "-webhook-secret is not a signing secret (whsec_ and 8 to 200 printable characters); nothing was put");
  if (/^sk_/.test(key))
    die("the keyring entry " + STRIPE_RING + "/" + mode + "-restricted-key is a secret key, which can write; the Worker reads with a restricted key (rk_"
      + mode + "_); nothing was put");
  if (!keyMode)
    die("the keyring entry " + STRIPE_RING + "/" + mode + "-restricted-key is not a restricted key (rk_" + mode + "_ and 10 to 240 letters and digits); nothing was put");
  if (keyMode !== mode)
    die("the keyring entry " + STRIPE_RING + "/" + mode + "-restricted-key is a " + keyMode + " key, and this run puts Stripe's " + mode + " mode; nothing was put");

  /* Each put: wrangler run by this node, its arguments the secret's name and the configuration and nothing else, the value on its stdin. */
  const done = [];
  for (const [name] of STRIPE_PUTS) {
    const r = spawnSync(process.execPath, wranglerAt.concat(["secret", "put", name, "--config", config]), /* plant:stripe-stdin */
      { input: values[name], stdio: ["pipe", "inherit", "inherit"], env, windowsHide: true });
    if (r.status !== 0) /* plant:stripe-stop */
      die("wrangler did not put " + name + (r.error ? " (" + r.error.code + ")" : " (exit " + r.status + ")") + ": "
        + (done.length ? "put " + done.join(", ") + "; not put " + STRIPE_PUTS.slice(done.length).map(([n]) => n).join(", ")
          + ", so the Worker holds this run's " + done.join(", ") + " beside what it held before" : "nothing was put")
        + ". Running this command again puts both");
    done.push(name);
  }
  say("put      " + done.join(", ") + " to " + named[1] + " in " + config + ", Stripe's " + mode + " mode, from the keyring's "
    + STRIPE_RING + "/" + mode + "-*");
}

/* THE VERSION NOTE (board 991). Every refusal is one line of this tool's own words and exits 2; nothing is written before the
   last of them has passed, and the root is opened only once every field is known to be one the readers take. */
async function noteMain(args) {
  const C = Engine.relayRules().core;
  needCore(C, [], ["ROOT_PUB"]);
  if (typeof args.out !== "string") die("--out <file> is required: the note is written there, and put as the Worker secret NOTE_DESK or NOTE_STUDIO from it");
  if (typeof args.root !== "string") die("--root <file> is required: the root key file that signs the note");
  if (args.app !== "desk" && args.app !== "studio") die("--app is desk or studio: a note offers one program's update, and the other refuses it");
  if (typeof args.serial !== "string" || !/^[1-9][0-9]{0,8}$/.test(args.serial))
    die("--serial is a whole number from 1 to " + Note.SERIAL_MAX + ", higher than the last note's for this app: a reader takes no note older than one it has seen");
  if (typeof args.version !== "string" || !Note.VERSION_RE.test(args.version))
    die("--version is three whole numbers from 0 to 999 with no leading zeros, such as 2.0.1");
  if (typeof args.released !== "string") die("--released is the release day, YYYY-MM-DD");
  if (typeof args.url !== "string" || args.url.length > Note.URL_MAX || !Note.URL_RE.test(args.url))
    die("--url is the release page, https://etiuda.dev/ and a path of letters, digits, dots, hyphens and underscores,"
      + " with no query, no fragment and at most " + Note.URL_MAX + " characters");
  const fields = { app: args.app, serial: Number(args.serial), version: args.version, released: args.released, url: args.url };
  const fieldsSaid = Note.fieldsWhy(fields);
  if (fieldsSaid) die(fieldsSaid);
  const out = path.resolve(args.out), rootAt = path.resolve(args.root);
  if (out === rootAt) die("--out is the file the note is written to, and is not a key file");
  /* An existing file at --out is replaced only by a newer note for the same app. */
  if (fs.existsSync(out)) {
    let held = null;
    try { held = readJson(out); } catch { held = null; }
    if (!held || typeof held !== "object" || held.kind !== Note.NOTE_KIND)
      die("there is already a file at " + out + " that is not a version note; move it aside yourself if you mean to replace it");
    if (held.app !== fields.app || !(Number(held.serial) < fields.serial))
      die("the note at " + out + " is for " + JSON.stringify(held.app) + " with serial " + JSON.stringify(held.serial)
        + "; a note replaces only an older one for the same app, so give a higher --serial or another --out");
  }
  let passphrase;
  try { passphrase = passphraseOf(args); }
  catch (e) { die("the passphrase file at " + args["passphrase-file"] + " could not be read"); }
  if (!passphrase) die("a signing key needs a passphrase: --passphrase-file <f>, or STUDIO_KEY_PASSPHRASE");
  let root;
  try { root = readKeyFile(rootAt); } catch (e) { die(unreadable(e, rootAt)); }
  if (!root) die("no key file at " + rootAt);
  if (root.kept === OS_WRAP)
    die("the key file at " + rootAt + " is the one the operating system keeps and has no passphrase; the root key is a passphrase key");
  let open;
  try { open = unlockKey(root, passphrase); } catch (e) { die("the root key file at " + rootAt + " does not open: the passphrase is wrong, or the file has been altered"); }
  let note;
  try { note = Note.makeNote(fields, open.privateKey, root.keyId || "etiuda-root"); }
  catch (e) { die(e.message); }
  const written = JSON.stringify(note) + "\n";
  const back = Note.readNote(written, fields.app, root.public);
  if (!back.ok) die("the note made is not read back under the root key (" + back.why + "), so nothing was written");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, written, "utf8");
  say("wrote " + out);
  say("app      " + note.app);
  say("serial   " + note.serial);
  say("version  " + note.version + ", released " + note.released);
  say("page     " + note.url);
  say("put it with: wrangler secret put " + (note.app === "desk" ? "NOTE_DESK" : "NOTE_STUDIO") + " --config service/licence/wrangler.toml < " + out);
  if (root.public !== C.ROOT_PUB)
    process.stderr.write("sign  note: this root key is not the vendor root the programs trust, so the note holds only under another root\n");
}

async function main(argv) {
  const args = parse(argv);
  const what = args._[0] || "";
  if (what !== "make" && what !== "show" && what !== "ring" && what !== "check" && what !== "grant" && what !== "delegate" && what !== "secrets" && what !== "stripe" && what !== "note")
    die("usage: node tools/sign.mjs make --out <file> [--key-id <name>]"
      + " [--passphrase-file <f>]   |   node tools/sign.mjs show --out <file>"
      + "   |   node tools/sign.mjs ring --out <file> --catalog <id> --ring <file>"
      + "   |   node tools/sign.mjs check --out <file> [--passphrase-file <f>]"
      + "   |   node tools/sign.mjs grant --lead <key file> --root <key file> --out <file> [--days N] [--paid|--trial]"
      + " [--passphrase-file <f>]"
      + "   |   node tools/sign.mjs delegate --key <service key file> --root <root key file> --may licence,relay-grant --out <file>"
      + " [--days N] [--staging] [--passphrase-file <f>]"
      + "   |   node tools/sign.mjs secrets --root <root key file> [--staging] [--days N] [--key-id <name>] [--new-hash-key]"
      + " [--config <wrangler.toml>] [--wrangler <wrangler.js>] [--passphrase-file <f>] [--cf-keyring <service>/<user> --cf-account <id>]"
      + "   |   node tools/sign.mjs stripe [--staging] [--config <wrangler.toml>] [--wrangler <wrangler.js>]"
      + " [--cf-keyring <service>/<user> --cf-account <id>]"
      + "   |   node tools/sign.mjs note --root <root key file> --app desk|studio --serial N --version X.Y.Z --released YYYY-MM-DD"
      + " --url https://etiuda.dev/... --out <file> [--passphrase-file <f>]");
  if (what === "grant") return grantMain(args);
  if (what === "note") return noteMain(args);
  if (what === "secrets") return secretsMain(args);
  if (what === "stripe") return stripeMain(args);
  if (what === "delegate") return delegateMain(args);
  if (typeof args.out !== "string")
    die("--out <file> is required: the key file Studio reads is " + KEY_FILE + " in its own"
      + " settings folder (%APPDATA%" + String.fromCharCode(92) + "etiuda-studio on Windows), or"
      + " wherever STUDIO_SIGNING_KEY points");
  const out = path.resolve(args.out);

  if (what === "ring") {
    if (typeof args.catalog !== "string")
      die("--catalog <id> is required: an entry binds this key to ONE catalog id, the id that"
        + " catalog declares, and a key listed for one catalog says nothing about another");
    if (typeof args.ring !== "string")
      die("--ring <file> is required: it is the ring the entry goes into, which belongs beside"
        + " the catalogs in the folder a desk reads (" + RING_FILE + ")");
    let read;
    try { read = readKeyFile(out); } catch (e) { die(e.message); }
    if (!read) die("no key file at " + out);
    let got;
    try {
      got = await ringFor({ key: read, catalog: args.catalog, file: path.resolve(args.ring),
                            note: typeof args.note === "string" ? args.note : null });
    } catch (e) { die(e.message); }
    say(got.added ? got.why : "nothing to do: " + got.why);
    say("ring     " + got.file);
    say("catalog  " + args.catalog);
    say("keyId    " + read.keyId);
    say("entries  " + got.entries);
    say("a desk outside a team reads the ring in its catalog folder, where Studio publishes; a desk in a"
      + " team trusts its pinned lead and needs no ring");
    return;
  }

  if (what === "show") {
    let read;
    try { read = readKeyFile(out); } catch (e) { die(e.message); }
    if (!read) die("no key file at " + out);
    say("key file " + read.file);
    say("keyId    " + read.keyId);
    say("public   " + read.public);
    say("a desk outside a team trusts this key when its ring holds that keyId against that public half");
    return;
  }

  if (what === "check") {
    let passphrase;
    try { passphrase = passphraseOf(args); }
    catch (e) { die("the passphrase file at " + args["passphrase-file"] + " could not be read"); }
    if (!passphrase)
      die("a signing key needs a passphrase: --passphrase-file <f>, or STUDIO_KEY_PASSPHRASE");
    let read;
    try { read = readKeyFile(out); } catch (e) { die(unreadable(e, out)); }
    if (!read) die("no key file at " + out);
    if (read.kept === OS_WRAP)
      die("the key file at " + out + " is the one the operating system keeps and has no passphrase; check opens a"
        + " passphrase copy of the key, the backup");
    try { unlockKey(read, passphrase); } catch (e) { die("does not open"); }
    say("opens");
    return;
  }

  if (fs.existsSync(out))
    die("there is already a key file at " + out + "; move it aside yourself if you mean to"
      + " replace it. A catalog signed with the old key can be verified with nothing else");
  const passphrase = passphraseOf(args);
  if (!passphrase)
    die("a signing key needs a passphrase: --passphrase-file <f>, or STUDIO_KEY_PASSPHRASE");

  let doc;
  try {
    doc = await makeKeyFile({ passphrase,
      keyId: typeof args["key-id"] === "string" ? args["key-id"] : null });
  } catch (e) { die(e.message); }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(doc, null, 1) + "\n", "utf8");
  say("wrote " + out);
  say("keyId    " + doc.keyId);
  say("public   " + doc.public);
  say("the passphrase is not stored and cannot be recovered from this file");
  const strength = createRequire(import.meta.url)("../ui/strength.js");
  process.stderr.write("sign  " + strength.SAID[strength.keyStrength(passphrase)] + "\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => die(e && e.stack ? e.stack : String(e)));
