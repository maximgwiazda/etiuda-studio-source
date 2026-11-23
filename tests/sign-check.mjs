/* THE KEY FILE CHECK, FROM THE COMMAND LINE: node tests/sign-check.mjs [--keep]. Board 927.
 *
 * Maxim made the Etiuda root key with `node tools/sign.mjs make`, its passphrase on paper only, and wants to prove, now and
 * once a year, that the paper still opens the key file without the tool ever showing the key or the passphrase. Claude
 * alpha's spec, boarded on his "Yes, please." (2026-10-20 01:24): `node tools/sign.mjs check --out <file>` opens a key file
 * with its passphrase (STUDIO_KEY_PASSPHRASE or --passphrase-file, as make takes it) and prints only "opens" or "does not
 * open", never the key or the passphrase, and signs nothing.
 *
 * Node only, no window, and every key, passphrase and file here is invented and made under this tree's scratch folder. What
 * it holds:
 *   sc1a  the right passphrase opens: exit 0 and exactly the line "sign  opens", from the environment and from a file
 *         (a trailing line ending dropped, as make drops it), on stdout, with nothing on stderr
 *   sc1b  a wrong passphrase does not open: exit 2 and exactly "sign  does not open", a near miss included
 *   sc1c  a damaged key file does not open: its JSON whole and its sealed part altered, in each of the places a file can be
 *         altered (the sealed bytes, the tag, the salt, a tag too short to be one, a wrap cost no scrypt takes, the keyId the
 *         wrap is bound to), exit 2 and the same line, because a wrong passphrase and a damaged file cannot be told apart
 *   sc1d  a file that is no key file says what is wrong in one line and exits 2, never with a stack and never echoing the
 *         file: absent, empty, not JSON, a key file cut off inside its sealed bytes, another kind, another schema, another
 *         algorithm, no public half, a folder, and the key the operating system keeps, which no passphrase opens
 *   sc1e  an empty or absent passphrase, a missing passphrase file and --passphrase are refused in the very words make refuses
 *         them in, exit 2
 *   sc1f  in every run the output holds neither the passphrase nor the key in any of its spellings nor the sealed bytes, and
 *         no run of 32 hex or base64 characters at all; the scanner is shown to find each of them first
 *   sc1g  it writes nothing and signs nothing: the key folder, the files in it and the working folder are exactly as they
 *         were, and no run asked for another answer than the one it got
 *   sc1h  the header's usage lines and the usage refusal name the command
 *
 * sc1f and sc1g count only runs that answered as they should, so a tool that answers nothing at all cannot pass them.
 *
 * AND THE RELAY GRANT (board 935, slice G3), `node tools/sign.mjs grant --lead <key file> --root <key file> --out <file>`:
 *   sc1i  a good run: exit 0, a grant of exactly the seven fields for the public half read from the lead's key file, 30 days and
 *         a trial's by default, 45 days and paid when asked, verifying under the root it was made with and under no other, a
 *         create over it passing the pinned relay's own judgement, and a grant already at --out replaced (a renewal)
 *   sc1j  a length over 45 days, or none, refused in one line naming the longest, and nothing written
 *   sc1k  an absent or empty passphrase, a passphrase file empty or missing and --passphrase refused in check's own words
 *   sc1l  a lead file that does not read, a root that does not open, --paid with --trial, a missing flag and an --out that is a
 *         key file or any other file that is no grant, each refused in one line with nothing written and no file touched
 *   sc1m  no run prints the passphrase, the root key in any spelling, the sealed bytes or the lead's private half, and no grant
 *         holds one; the key files are as they were
 *   sc1n  the header's usage line, the usage refusal and the missing --out refusal name the command and where Studio reads the grant
 *
 * AND THE DELEGATION (licence service S3), `node tools/sign.mjs delegate --key <service key file> --root <root key file> --may licence,relay-grant
 * --out <file> [--days N] [--staging]`, the root key certifying the licence service's key once a year:
 *   sc1o  a good run: exit 0, a delegation of exactly the seven fields for the public half and id read from the service key's file, the uses as
 *         named, 365 days by default, 366 at the most and 45 under --staging, signed by the root and by no other key, a relay grant signed
 *         under it passing the pinned relay's own judgement (and a create over it), refused under the vendor root and, for a delegation of
 *         the licence alone, for want of relay-grant; a delegation already at --out replaced (a renewal)
 *   sc1p  367 days, 46 under --staging, and a length that is no whole number of days, refused in one line naming the longest, nothing written
 *   sc1q  an unknown use, a repeat, an empty item, another case and a missing --may refused in one line, nothing written
 *   sc1r  a service key that is plain, wrapped by nothing or by a lie, kept by the operating system, unreadable or with an id the relay would
 *         refuse, the root's own key, a root that does not open, an --out that is a key file or any file that is no delegation (left byte for
 *         byte), a missing flag and a refused passphrase, each refused in one line with nothing written and no file touched
 *   sc1s  no run prints the passphrases, either key in any spelling or the sealed bytes, and no delegation holds one; the key files are as they were
 *   sc1t  the header's usage line and the usage refusal name the command
 *   sc1u  a root key file whose key id the relay refuses is refused in one line before it is opened, with --may licence alone, and nothing is written
 *   sc1v  the checkout's pinned engine lacking what a command needs is refused before anything else in one line naming the fix, exit 2, and nothing written
 *
 * AND THE SERVICE'S SECRETS (licence service S7, the test architect's A5), `node tools/sign.mjs secrets --root <root key file> [--staging]`, the one
 * command Maxim runs: the service key made in memory, its delegation signed by the root, a hash key drawn, and each put into the Worker by
 * `wrangler secret put <NAME> --config <toml>` with its value on wrangler's stdin, against a stand-in wrangler that keeps what it was handed:
 *   sc1w  a good run: three puts in order, each exactly `secret put <NAME> --config <toml>` on a pipe; the service key's PKCS#8 opens to the key the
 *         delegation certifies, for both uses, signed by the root, 45 days under --staging, a grant under it passing the pinned relay; the hash key
 *         32 bytes in hex; each run a new service key; each run asks wrangler which secrets the Worker holds, names only
 *   sc1x  the private half and the hash key reach wrangler's stdin and nothing else: never printed in any spelling, never in an argument, the
 *         passphrase never inherited by wrangler, its metrics off, and no file written anywhere
 *   sc1y  each refusal one line with nothing put, and a put wrangler refuses stops the rest, naming what was put and what was not
 *   sc1z  the header's usage line and the usage refusal name the command
 *   sc2a  with --cf-keyring <service>/<user> and --cf-account <id>, the Cloudflare token read from the keyring (a stand-in reader here,
 *         handed in by a driver that imports the tool and runs secrets in its own process) reaches each put in wrangler's environment, with the account, and no argument, no output and no
 *         variable of the process that ran secrets, asked of that very process by a driver that imports the tool
 *   sc2b  an empty, missing or unanswered keyring entry stops the command before anything is made, naming the entry and never a value;
 *         the two options are given together and in their shapes
 *   sc2c  without them, wrangler gets no token from the tool and the keyring is not read
 *   sc2e  a reader named in the environment (STUDIO_KEYRING_READER) is never run (the test architect's E3 on S7)
 *   sc2d  HASH_KEY is kept (the test architect's E1): put only where the Worker holds none, or with --new-hash-key after a warning that
 *         every kept hash stops matching; --keep-hash-key is refused; a Worker wrangler cannot list stops the run with nothing put
 *
 * PROVED BY MAKING IT FAIL: the legs were run on the tree before the command existed (all eight red), and then a plant that
 * makes check print "opens" without calling unlockKey turned sc1b and sc1c red, the file coming back by its sha256. The delegate
 * legs were run before the command existed (all six red), and then each plant marked in tools/sign.mjs was set in turn and the legs
 * run: d3-days (the bound of 366 days) and d3-staging (the bound of 45) turn sc1p red, d3-may (the check that every use is known)
 * turns sc1q red, d3-wrap (the check that the service key is held under a passphrase) turns sc1r red, d3-over (the check that
 * --out holds a delegation) turns sc1r red, and d3-bytes (signing the grant's bytes in place of the delegation's) turns sc1o red. d3-root-id (the root key id checked before the root is opened, the test architect's E3) turns sc1u red.
 * The secrets legs were run before the command existed (all four red), and then each plant marked in tools/sign.mjs: s7-env
 * (wrangler inheriting the passphrase) turns sc1x red, s7-argv (a value handed as an argument) turns sc1w and sc1x red, s7-stop
 * (going on after a put wrangler refused) turns sc1y red, and s7-key (a service key put other than the one delegated) turns sc1w red.
 * The keyring and hash key legs were run before either existed (sc2a, sc2b and sc2d red), and then: cf-env (the token set in the
 * tool's own environment), cf-argv (the token as an argument) and cf-account (no account id) turn sc2a red, cf-empty (an empty entry
 * let through) turns sc2b red, cf-print (the token printed) turns sc2a and sc2b red, e1-keep (HASH_KEY put on every run) and e1-warn
 * (no warning) turn sc2d red, and e1-held (the Worker read as always holding one) turns sc1w, sc1x, sc2a and sc2d red. sc2e was red
 * while tools/wrangler.mjs ran a reader the environment named, and e3-reader (that reader taken from the environment again) turns
 * it red; e1-said (the refused put's old words) turns sc1y red.
 *
 * Exit 0 when every check holds, 1 when any fails, 78 when the suite did not complete.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readKeyFile, unlockKey, osFile, makePair } from "../src/sign.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "sign-check");
const TOOL = path.join(ROOT, "tools", "sign.mjs");
const EXPECTED = 31;
const NL = String.fromCharCode(10);
/* Invented for this gate; the tail is random so that no run can match a word it was not handed. */
const PASS = "orchard lantern hums at noon " + crypto.randomBytes(5).toString("hex");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
/* A leg whose code is not there yet is a red leg and not a crashed file. */
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); }
}
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const put = (p, text) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const json = (v) => JSON.stringify(v, null, 1) + NL;
const clone = (v) => JSON.parse(JSON.stringify(v));
/* One hex digit of a hex string changed, never to the same digit. */
const flip = (hex, at = 10) => hex.slice(0, at) + (hex[at] === "0" ? "1" : "0") + hex.slice(at + 1);

/* Every spelling a secret could be printed in: as it is, upper case, hex, hex upper, base64 and base64url. */
function spellings(secret) {
  const bytes = Buffer.isBuffer(secret) ? secret : Buffer.from(String(secret), "utf8");
  const out = [bytes.toString("hex"), bytes.toString("hex").toUpperCase(), bytes.toString("base64"), bytes.toString("base64url")];
  if (!Buffer.isBuffer(secret)) out.push(String(secret), String(secret).toUpperCase());
  return out.filter((s) => s.length >= 8);
}
/* What a run's output may not hold: the strings it was handed or must not echo, the key and the sealed bytes, and any long
   hex or base64 run once the paths the run was given are taken out (a path is what the person typed, not a secret). */
function leaksOf(text, secrets, paths) {
  let t = String(text);
  for (const p of paths) t = t.split(p).join("");
  const found = secrets.filter((s) => s && t.indexOf(s) >= 0).map((s) => "secret " + s.slice(0, 8) + "...");
  if (/[0-9a-fA-F]{32,}/.test(t)) found.push("a run of 32 or more hex characters");
  if (/[A-Za-z0-9+/_=-]{32,}/.test(t)) found.push("a run of 32 or more base64 characters");
  return found;
}

/* The checker's runs: each in a working folder of its own, with no passphrase in the environment unless it is handed one. */
const runs = [];
function runTool(args, o = {}) {
  const env = Object.assign({}, process.env);
  delete env.STUDIO_KEY_PASSPHRASE;
  if (o.pass !== undefined) env.STUDIO_KEY_PASSPHRASE = o.pass;
  const tool = o.tool || TOOL;
  const r = spawnSync(process.execPath, [tool, ...args], { cwd: o.cwd, encoding: "utf8", env });
  return { status: r.status, stdout: String(r.stdout), stderr: String(r.stderr) };
}
function checkRun(name, want, file, o = {}) {
  const args = ["check", "--out", file].concat(o.args || []);
  const got = Object.assign(runTool(args, { cwd: LAB, pass: o.pass }), { name, want,
    handed: [o.pass, o.handed].concat(o.handedAll || []).filter((x) => typeof x === "string" && x), keep: o.keep || [],
    paths: [file].concat(o.paths || []) });
  runs.push(got);
  return got;
}

let LAB = "";
async function main(argv) {
  clearScratch(SCRATCH);
  const KEYS = path.join(SCRATCH, "keys"), PFS = path.join(SCRATCH, "passfiles"), MAKE = path.join(SCRATCH, "make-refused");
  LAB = path.join(SCRATCH, "lab");
  for (const d of [KEYS, PFS, MAKE, LAB]) fs.mkdirSync(d, { recursive: true });

  /* The key under test is made the way Maxim's was, by the tool's own make, then read back by the library for its bytes. */
  const keyAt = path.join(KEYS, "root-key.json");
  const made = runTool(["make", "--out", keyAt], { cwd: LAB, pass: PASS });
  if (made.status !== 0) process.stderr.write("  setup: make said " + made.stderr.slice(0, 200) + NL);
  const read = readKeyFile(keyAt), doc = read.doc, w = doc.wrap;
  const der = unlockKey(read, PASS).privateKey.export({ type: "pkcs8", format: "der" });
  const secrets = [].concat(spellings(PASS), spellings(der), spellings(der.subarray(-32)), spellings(Buffer.from(doc.private, "hex")),
    spellings(Buffer.from(w.tag, "hex")), spellings(Buffer.from(w.salt, "hex")), spellings(Buffer.from(w.iv, "hex")),
    [doc.private, doc.private.slice(0, 16), doc.private.slice(-16), w.tag, w.salt, w.iv]);

  /* ---- the files the runs read ------------------------------------------------------------------------------------ */
  const passFile = put(path.join(PFS, "pass-lf.txt"), PASS + NL);
  const passCrlf = put(path.join(PFS, "pass-crlf.txt"), PASS + "\r\n");
  const passEmpty = put(path.join(PFS, "pass-empty.txt"), "");
  const passMissing = path.join(PFS, "pass-missing.txt");
  const damaged = [];
  const damage = (name, mutate) => {
    const d = clone(doc); mutate(d);
    damaged.push([name, put(path.join(KEYS, "damaged-" + name + ".json"), json(d))]);
  };
  damage("sealed-bytes", (d) => { d.private = flip(d.private); });
  damage("tag", (d) => { d.wrap.tag = flip(d.wrap.tag); });
  damage("salt", (d) => { d.wrap.salt = flip(d.wrap.salt); });
  damage("short-tag", (d) => { d.wrap.tag = "ab"; });
  damage("empty-sealed", (d) => { d.private = ""; });
  damage("odd-sealed", (d) => { d.private = d.private.slice(0, -3); });
  damage("scrypt-cost", (d) => { d.wrap.N = 3; });
  damage("key-id", (d) => { d.keyId = "studio-0000000000000000"; });
  const marker = "QQQQ-not-a-secret-QQQQ", mark8 = marker.slice(0, 8);
  fs.mkdirSync(path.join(KEYS, "a-folder.json"));
  const unkeyed = [
    ["missing", path.join(KEYS, "no-such-key.json"), /^sign  no key file at /, []],
    ["empty", put(path.join(KEYS, "empty.json"), ""), /^sign  .*is not JSON/, []],
    ["not-json", put(path.join(KEYS, "not-json.json"), marker + " is not json at all" + NL), /^sign  .*is not JSON/, [mark8]],
    ["cut-off", put(path.join(KEYS, "cut-off.json"), json(doc).slice(0, json(doc).indexOf('"private"') + 60)), /^sign  .*is not JSON/,
      [doc.private.slice(0, 12)]],
    ["null", put(path.join(KEYS, "null.json"), "null" + NL), /^sign  .*is not an Etiuda Studio signing key/, []],
    ["other-kind", put(path.join(KEYS, "other-kind.json"), json({ kind: "something-else-" + marker, schema: 1 })),
      /^sign  .*is not an Etiuda Studio signing key/, [mark8]],
    ["other-schema", put(path.join(KEYS, "other-schema.json"), json(Object.assign(clone(doc), { schema: marker }))), /^sign  /, [mark8]],
    ["other-alg", put(path.join(KEYS, "other-alg.json"), json(Object.assign(clone(doc), { alg: doc.private }))), /^sign  /,
      [doc.private.slice(0, 12)]],
    ["no-public", put(path.join(KEYS, "no-public.json"), json(Object.assign(clone(doc), { public: marker }))), /^sign  /, [mark8]],
    ["a-folder", path.join(KEYS, "a-folder.json"), /^sign  /, []],
  ];
  /* The key the operating system keeps: its sealed part is only what a vault sealed, and no passphrase is its key. */
  const pair = await makePair();
  const vaultKey = put(path.join(KEYS, "vault-key.json"), json(osFile(pair, Buffer.from("sealed:" + pair.der, "utf8"))));
  secrets.push(...spellings(Buffer.from(pair.der, "hex")), pair.der);

  /* The state of the key folder and the working folder before any check runs, to be compared after the last. */
  const snap = (dir) => fs.readdirSync(dir, { withFileTypes: true }).map((e) => {
    const p = path.join(dir, e.name), s = fs.statSync(p);
    return e.isDirectory() ? e.name + "/" : [e.name, s.size, Math.round(s.mtimeMs), sha(p)].join(" ");
  }).sort().join(NL);
  const before = { keys: snap(KEYS), lab: snap(LAB), passfiles: snap(PFS), make: snap(MAKE) };

  /* ---- the runs --------------------------------------------------------------------------------------------------- */
  const opens = checkRun("opens, from the environment", 0, keyAt, { pass: PASS });
  const opensFile = checkRun("opens, from a file", 0, keyAt, { args: ["--passphrase-file", passFile], paths: [passFile] });
  const opensCrlf = checkRun("opens, from a file ending CRLF", 0, keyAt, { args: ["--passphrase-file", passCrlf], paths: [passCrlf] });
  const wrongs = [["a wrong passphrase", PASS + "!"], ["a near miss in case", PASS.toUpperCase()],
    ["another passphrase", "kettle-quince-harbour-" + crypto.randomBytes(4).toString("hex")],
    ["the passphrase with a space after it", PASS + " "]]
    .map(([name, pass]) => checkRun(name, 2, keyAt, { pass }));
  const damagedRuns = damaged.map(([name, file]) => checkRun("damaged: " + name, 2, file, { pass: PASS }));
  const unkeyedRuns = unkeyed.map(([name, file, , keep]) => checkRun("no key file: " + name, 2, file, { pass: PASS, keep }));
  const vaultRuns = [checkRun("the operating system's key, with a passphrase", 2, vaultKey, { pass: PASS }),
    checkRun("the operating system's key, with its own secret as passphrase", 2, vaultKey, { pass: pair.der, handed: pair.der })];

  /* A refusal is compared with make's, which is given the same arguments and a path where it has nothing to refuse first. */
  const refusals = [
    ["no passphrase at all", { args: [], pass: undefined }],
    ["an empty passphrase in the environment", { args: [], pass: "" }],
    ["an empty passphrase file", { args: ["--passphrase-file", passEmpty], pass: undefined }],
    ["a passphrase file that is not there", { args: ["--passphrase-file", passMissing], pass: undefined }],
    ["--passphrase with a value", { args: ["--passphrase", PASS], pass: undefined }],
    ["--passphrase beside the right environment", { args: ["--passphrase", PASS], pass: PASS }],
    ["--passphrase alone", { args: ["--passphrase"], pass: PASS }],
  ].map(([name, a], i) => {
    const mine = checkRun("refused: " + name, 2, keyAt, { args: a.args, pass: a.pass, handed: a.args[0] === "--passphrase" && a.args[1] !== undefined ? a.args[1] : "",
      paths: a.args.filter((x) => /\.txt$/.test(x)) });
    const theirs = runTool(["make", "--out", path.join(MAKE, "refused-" + i + ".json")].concat(a.args), { cwd: LAB, pass: a.pass });
    return { name, mine, theirs };
  });

  const after = { keys: snap(KEYS), lab: snap(LAB), passfiles: snap(PFS), make: snap(MAKE) };
  const answered = runs.filter((r) => r.status === r.want);
  const lineOnly = (r, line) => r.status === r.want && r.stdout === "" && r.stderr === "sign  " + line + NL;
  const oneLine = (r) => r.status === 2 && r.stdout === "" && /^sign  [^\n]+\n$/.test(r.stderr)
    && !/\n\s+at |Error|node:internal|\.mjs:\d+/.test(r.stderr);
  const show = (r) => "       " + r.name + ": exit " + r.status + ", stdout " + JSON.stringify(r.stdout.slice(0, 60))
    + ", stderr " + JSON.stringify(r.stderr.slice(0, 90)) + NL;

  /* ---- the legs --------------------------------------------------------------------------------------------------- */
  await leg("sc1a the right passphrase opens: exit 0, stdout exactly \"sign  opens\", nothing on stderr, from the environment, from"
    + " a file and from a file ending CRLF", async () => {
    [opens, opensFile, opensCrlf].forEach((r) => process.stdout.write(show(r)));
    return [opens, opensFile, opensCrlf].every((r) => r.status === 0 && r.stdout === "sign  opens" + NL && r.stderr === "");
  });
  await leg("sc1b a wrong passphrase does not open: exit 2 and exactly \"sign  does not open\", for a wrong one, one off in case,"
    + " another altogether and the right one with a space after it", async () => {
    wrongs.forEach((r) => process.stdout.write(show(r)));
    return wrongs.length === 4 && wrongs.every((r) => lineOnly(r, "does not open"));
  });
  await leg("sc1c a damaged key file, its JSON whole and its sealed part altered, does not open even under the right passphrase:"
    + " exit 2 and the same line, for the sealed bytes, the tag, the salt, a tag too short, an empty and a short sealed part, a"
    + " wrap cost scrypt takes none of and an edited keyId", async () => {
    damagedRuns.forEach((r) => process.stdout.write(show(r)));
    return damagedRuns.length === 8 && damagedRuns.every((r) => lineOnly(r, "does not open"));
  });
  await leg("sc1d a file that is no key file is said in one line and exits 2, never a stack, and the line says what is wrong and"
    + " echoes none of the file: absent, empty, not JSON, cut off inside the sealed bytes, null, another kind, schema and algorithm,"
    + " no public half, a folder; the key the operating system keeps says it has no passphrase", async () => {
    unkeyedRuns.concat(vaultRuns).forEach((r) => process.stdout.write(show(r)));
    const said = unkeyedRuns.every((r, i) => oneLine(r) && unkeyed[i][2].test(r.stderr)
      && unkeyed[i][3].every((m) => (r.stdout + r.stderr).indexOf(m) < 0));
    const vault = vaultRuns.every((r) => oneLine(r) && /operating system/.test(r.stderr) && /passphrase/.test(r.stderr)
      && !/does not open|^sign  opens/.test(r.stderr));
    return unkeyedRuns.length === 10 && said && vault;
  });
  await leg("sc1e an absent or empty passphrase, an empty or missing passphrase file and --passphrase are refused as make refuses"
    + " them: exit 2, make's sentence word for word", async () => {
    refusals.forEach((x) => process.stdout.write(show(x.mine)));
    return refusals.length === 7 && refusals.every((x) => x.mine.status === 2 && x.theirs.status === 2 && x.mine.stdout === ""
      && x.theirs.stderr.length > 0 && x.mine.stderr === x.theirs.stderr && oneLine(x.mine));
  });
  await leg("sc1f in every run the output holds neither the passphrase it was handed nor the key in any spelling nor the sealed"
    + " bytes nor any run of 32 hex or base64 characters; the scanner finds each of those first, and finds nothing in a plain answer",
    async () => {
    const control = [PASS, spellings(der)[0], spellings(der.subarray(-32))[2], doc.private, "ab".repeat(32), "A".repeat(40)];
    const finds = control.every((c) => leaksOf("sign  opens " + c + NL, secrets, []).length > 0)
      && leaksOf("sign  opens" + NL, secrets, []).length === 0
      && leaksOf("sign  no key file at " + keyAt + NL, secrets, [keyAt]).length === 0;
    const bad = runs.map((r) => [r.name, leaksOf(r.stdout + r.stderr, secrets.concat(r.handed, r.keep), r.paths)])
      .filter(([, f]) => f.length);
    bad.forEach(([n, f]) => process.stdout.write("       " + n + " leaks " + f.join(", ") + NL));
    process.stdout.write("       " + runs.length + " run(s) scanned, " + answered.length + " answered as they should, " + bad.length
      + " leaking" + NL);
    return finds && bad.length === 0 && answered.length === runs.length && runs.length === 3 + 4 + 8 + 10 + 2 + 7;
  });
  await leg("sc1g it writes nothing and signs nothing: the key folder with every file's size, time and sha256, the passphrase files,"
    + " the working folder and the folder make was refused in are exactly as before the first run and empty where they were empty,"
    + " after the same runs", async () => {
    const same = ["keys", "lab", "passfiles", "make"].filter((k) => before[k] === after[k]);
    process.stdout.write("       unchanged: " + same.join(", ") + "; key file sha256 " + sha(keyAt).slice(0, 12) + NL);
    return same.length === 4 && before.lab === "" && before.make === "" && after.make === "" && answered.length === runs.length
      && opens.stdout === "sign  opens" + NL;
  });
  await leg("sc1h the header's usage lines and the usage refusal name the command: \"check --out <file>\" in both, and a command that"
    + " is none of the four exits 2 with the usage", async () => {
    const src = fs.readFileSync(TOOL, "utf8");
    const head = src.slice(0, src.indexOf("*/"));
    const bad = runTool(["bogus", "--out", keyAt], { cwd: LAB, pass: PASS });
    const none = runTool([], { cwd: LAB, pass: PASS });
    return /^ \*     node tools\/sign\.mjs check --out <file>/m.test(head)
      && [bad, none].every((r) => r.status === 2 && /^sign  usage: /.test(r.stderr) && r.stderr.indexOf("check --out <file>") > 0
        && r.stderr.split(NL).filter(Boolean).length === 1);
  });


  /* ---- the relay grant (board 935, slice G3): node tools/sign.mjs grant ------------------------------------------------ */
  const C = Engine.relayRules().core, DAY = 24 * 60 * 60 * 1000;
  const GK = path.join(SCRATCH, "grant-keys"), GO = path.join(SCRATCH, "grants");
  for (const d of [GK, GO]) fs.mkdirSync(d, { recursive: true });
  const leadAt = path.join(GK, "lead-key.json");
  const leadMade = runTool(["make", "--out", leadAt], { cwd: LAB, pass: PASS });
  if (leadMade.status !== 0) process.stderr.write("  setup: make said " + leadMade.stderr.slice(0, 200) + NL);
  const leadRead = readKeyFile(leadAt), rootRead = readKeyFile(keyAt), vendorRoot = C.ROOT_PUB;
  const grantArgs = (out, more) => ["grant", "--lead", leadAt, "--root", keyAt, "--out", out].concat(more || []);
  const grantRun = (out, more, o) => runTool(grantArgs(out, more), Object.assign({ cwd: LAB, pass: PASS }, o || {}));
  const grantOf = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
  const keyShaBefore = [sha(leadAt), sha(keyAt)];
  const NOTE = "sign  note: this root key is not the vendor root the relay trusts, so the grant holds only under another root" + NL;
  /* What a grant run may print: the lead's public half, which is the grant's subject and no secret, and the paths it was handed. */
  const grantSecrets = secrets.concat(spellings(Buffer.from(unlockKey(leadRead, PASS).privateKey.export({ type: "pkcs8", format: "der" }))));
  const grantLeaks = (text, paths) => {
    const t = String(text).split(leadRead.public).join("");
    return leaksOf(t, grantSecrets, paths);
  };
  const allGrantRuns = [];
  const noted = (name, r, paths) => { allGrantRuns.push({ name, r, paths: paths || [] }); return r; };

  await leg("sc1i a good run writes the grant and prints no secret: exit 0, the file holds exactly the seven fields, the lead's public half read from its key"
    + " file, 30 days and a trial's by default, 45 days and paid when asked, the root's signature verifying under the root it was made with and under no"
    + " other, and a create over it passes the relay's own judgement; a grant already at --out is replaced", async () => {
    const out1 = path.join(GO, "default.json"), out2 = path.join(GO, "paid-45.json"), out3 = path.join(GO, "trial-1.json");
    const t0 = Date.now();
    const r1 = noted("default", grantRun(out1, [])), r2 = noted("paid, 45 days", grantRun(out2, ["--paid", "--days", "45"]));
    const r3 = noted("trial, 1 day, from a file", runTool(grantArgs(out3, ["--trial", "--days", "1", "--passphrase-file", passFile]), { cwd: LAB }));
    const t1 = Date.now();
    [r1, r2, r3].forEach((r) => process.stdout.write(show({ name: "grant", status: r.status, stdout: r.stdout, stderr: r.stderr })));
    const ran = [r1, r2, r3].every((r) => r.status === 0 && r.stderr === NOTE && /^sign  wrote /.test(r.stdout));
    const g1 = grantOf(out1), g2 = grantOf(out2), g3 = grantOf(out3);
    const shaped = (g) => Object.keys(g).sort().join() === "format,issued,kind,lead,paid,sig,until" && g.kind === "etiuda-relay-grant" && g.format === 1
      && g.lead === leadRead.public && Object.keys(g.sig).sort().join() === "alg,keyId,value" && g.sig.alg === "ed25519" && g.sig.keyId === rootRead.keyId;
    const span = (g, days) => g.until - g.issued === days * DAY;
    const fresh = (g) => g.issued >= t0 && g.issued <= t1;
    const holds = (g) => C.grantOk(g, leadRead.public, g.issued + 1000, [rootRead.public]) && !C.grantOk(g, leadRead.public, g.issued + 1000)
      && !C.grantOk(g, rootRead.public, g.issued + 1000, [rootRead.public]) && !C.grantOk(g, leadRead.public, g.until, [rootRead.public]);
    /* The relay's own judgement of a create over it, signed by the lead's key. */
    const open = unlockKey(leadRead, PASS), rt = "00112233445566778899aabbccddeeff", t = g1.issued + 1000;
    const body = { rt, lead: { keyId: leadRead.keyId, pub: leadRead.public }, t, grant: g1,
      sig: crypto.sign(null, C.create2Bytes(rt, leadRead.keyId, t, g1), open.privateKey).toString("hex") };
    const judged = C.judgeCreate(rt, body, t, [rootRead.public]);
    const refusedByVendor = C.judgeCreate(rt, body, t).ok !== true;
    /* Renewal: a second run into the same file replaces the grant, which is itself a relay grant. */
    const again = noted("renewal", grantRun(out1, ["--paid"]));
    const g1b = again.status === 0 ? grantOf(out1) : null;
    return ran && shaped(g1) && shaped(g2) && shaped(g3) && span(g1, 30) && span(g2, 45) && span(g3, 1)
      && g1.paid === false && g2.paid === true && g3.paid === false && [g1, g2, g3].every(fresh) && [g1, g2, g3].every(holds)
      && judged.ok === true && refusedByVendor && !!g1b && g1b.paid === true && shaped(g1b) && g1b.issued >= g1.issued;
  });
  await leg("sc1j a length over the longest the relay accepts, or none, is refused, whoever signs: 46 days, 100, 0, a fraction, a word, a negative, none given"
    + " for the flag; exit 2 in one line that names the longest, and nothing is written", async () => {
    const bad = ["46", "100", "99999", "0", "3.5", "abc", "-1", "1e1", ""];
    const runs2 = bad.map((d, i) => { const out = path.join(GO, "days-" + i + ".json"); return [d, out, noted("days " + JSON.stringify(d), grantRun(out, ["--days", d]))]; });
    const bare = path.join(GO, "days-bare.json");
    runs2.push(["(no value)", bare, noted("days with no value", grantRun(bare, ["--days"]))]);
    runs2.forEach(([d, , r]) => process.stdout.write(show({ name: "--days " + d, status: r.status, stdout: r.stdout, stderr: r.stderr })));
    const oneLine2 = (r) => r.status === 2 && r.stdout === "" && /^sign  [^\n]+\n$/.test(r.stderr) && !/\n\s+at |Error|node:internal|\.mjs:\d+/.test(r.stderr);
    const over = runs2.filter(([d]) => ["46", "100", "99999"].indexOf(d) >= 0);
    return runs2.length === 10 && runs2.every(([, out, r]) => oneLine2(r) && !fs.existsSync(out))
      && over.every(([, , r]) => /at most 45 days/.test(r.stderr)) && runs2.every(([, , r]) => /45/.test(r.stderr));
  });
  await leg("sc1k an absent or empty passphrase, an empty or missing passphrase file and --passphrase are refused as check refuses them, in its words,"
    + " exit 2, and nothing is written", async () => {
    const cases = [["no passphrase at all", [], undefined], ["an empty passphrase in the environment", [], ""],
      ["an empty passphrase file", ["--passphrase-file", passEmpty], undefined], ["a passphrase file that is not there", ["--passphrase-file", passMissing], undefined],
      ["--passphrase with a value", ["--passphrase", PASS], undefined], ["--passphrase alone", ["--passphrase"], PASS]];
    const got = cases.map(([name, more, pass], i) => {
      const out = path.join(GO, "pass-" + i + ".json");
      const mine = noted("passphrase: " + name, grantRun(out, more, { pass }), [passEmpty, passMissing]);
      const theirs = runTool(["check", "--out", keyAt].concat(more), { cwd: LAB, pass });
      return { name, mine, theirs, out };
    });
    got.forEach((x) => process.stdout.write(show({ name: x.name, status: x.mine.status, stdout: x.mine.stdout, stderr: x.mine.stderr })));
    return got.length === 6 && got.every((x) => x.mine.status === 2 && x.theirs.status === 2 && x.mine.stdout === "" && x.mine.stderr.length > 0
      && x.mine.stderr === x.theirs.stderr && !fs.existsSync(x.out));
  });
  await leg("sc1l a lead file that does not read, a root that does not open, the flags that cannot be given together and an --out that is no grant are each"
    + " refused in one line of the tool's own words, exit 2, with nothing written and no key file or other file touched", async () => {
    const plain = path.join(GO, "plain.json"), notGrant = put(path.join(GO, "other.json"), json({ kind: "something-else", n: 1 }));
    const notGrantSha = sha(notGrant), flipped = put(path.join(GK, "flipped.json"), json(Object.assign(clone(rootRead.doc), { private: flip(rootRead.doc.private) })));
    const lead = (file, name, re, keep) => {
      const out = path.join(GO, "lead-" + name + ".json");
      const r = noted("lead: " + name, runTool(["grant", "--lead", file, "--root", keyAt, "--out", out], { cwd: LAB, pass: PASS }), [file]);
      return { name, r, out, ok: re.test(r.stderr) && !fs.existsSync(out) && (keep || []).every((m) => (r.stdout + r.stderr).indexOf(m) < 0) };
    };
    const marker = "QQQQ-not-a-secret-QQQQ";
    const leads = [lead(path.join(GK, "no-such-lead.json"), "absent", /^sign  no key file at /),
      lead(put(path.join(GK, "lead-not-json.json"), marker + " is not json"), "not json", /^sign  .*is not JSON/, [marker.slice(0, 8)]),
      lead(put(path.join(GK, "lead-other-kind.json"), json({ kind: "something-else-" + marker, schema: 1 })), "another kind", /^sign  .*is not an Etiuda Studio signing key/, [marker.slice(0, 8)]),
      lead(put(path.join(GK, "lead-no-public.json"), json(Object.assign(clone(leadRead.doc), { public: marker }))), "no public half", /^sign  /, [marker.slice(0, 8)]),
      lead(path.join(SCRATCH, "grant-keys"), "a folder", /^sign  /)];
    const roots = [["absent", path.join(GK, "no-such-root.json"), /^sign  no key file at /],
      ["not a passphrase key", vaultKey, /operating system/], ["altered", flipped, /does not open/]]
      .map(([name, file, re]) => {
        const out = path.join(GO, "root-" + name.replace(/ /g, "-") + ".json");
        const r = noted("root: " + name, runTool(["grant", "--lead", leadAt, "--root", file, "--out", out], { cwd: LAB, pass: PASS }), [file]);
        return { name, r, out, ok: re.test(r.stderr) && !fs.existsSync(out) };
      });
    const wrong = noted("root: wrong passphrase", grantRun(path.join(GO, "wrong.json"), [], { pass: PASS + "!" }));
    const both = noted("--paid and --trial", grantRun(plain, ["--paid", "--trial"]));
    const valued = noted("--paid with a value", grantRun(plain, ["--paid", "yes"]));
    const missing = ["--out", "--lead", "--root"].map((flag) => {
      const a = grantArgs(plain); const i = a.indexOf(flag); a.splice(i, 2);
      return noted("no " + flag, runTool(a, { cwd: LAB, pass: PASS }));
    });
    /* --out at a file that is not a relay grant: a key file above all, or any other file, is left as it was. */
    const overKey = noted("--out is the lead's key file", runTool(["grant", "--lead", leadAt, "--root", keyAt, "--out", leadAt], { cwd: LAB, pass: PASS }));
    const overRoot = noted("--out is the root's key file", runTool(["grant", "--lead", leadAt, "--root", keyAt, "--out", keyAt], { cwd: LAB, pass: PASS }));
    const overOther = noted("--out holds another file", grantRun(notGrant, []));
    const overCopy = put(path.join(GO, "key-copy.json"), fs.readFileSync(leadAt, "utf8"));
    const overCopyRun = noted("--out holds a copy of a key file", grantRun(overCopy, []));
    const one = (r) => r.status === 2 && r.stdout === "" && /^sign  [^\n]+\n$/.test(r.stderr) && !/\n\s+at |Error|node:internal|\.mjs:\d+/.test(r.stderr);
    const all = leads.concat(roots).map((x) => x.r).concat([wrong, both, valued], missing, [overKey, overRoot, overOther, overCopyRun]);
    all.forEach((r, i) => process.stdout.write("       refusal " + (i + 1) + ": exit " + r.status + ", " + JSON.stringify(r.stderr.slice(0, 90)) + NL));
    return all.every(one) && leads.every((x) => x.ok) && roots.every((x) => x.ok) && /does not open/.test(wrong.stderr) && !fs.existsSync(path.join(GO, "wrong.json"))
      && /not both|and not both/.test(both.stderr) && /takes no value/.test(valued.stderr) && missing.every((r, i) => r.stderr.indexOf(["--out", "--lead", "--root"][i]) >= 0)
      && !fs.existsSync(plain) && sha(notGrant) === notGrantSha && sha(overCopy) === sha(leadAt) && /not a relay grant/.test(overOther.stderr)
      && /not a relay grant/.test(overCopyRun.stderr) && /not a key file/.test(overKey.stderr) && /not a key file/.test(overRoot.stderr)
      && sha(leadAt) === keyShaBefore[0] && sha(keyAt) === keyShaBefore[1];
  });
  await leg("sc1m in every grant run, good or refused, the output holds neither the passphrase nor the root key in any spelling nor the sealed bytes nor the"
    + " lead's private half nor any run of 32 hex or base64 characters but the lead's public half, and the grants written hold no secret either; the scanner is"
    + " shown to find each first; the key files are as they were", async () => {
    const control = [PASS, spellings(der)[0], spellings(der.subarray(-32))[2], doc.private, "ab".repeat(32), "A".repeat(40)];
    const finds = control.every((c) => grantLeaks("sign  wrote " + c + NL, []).length > 0)
      && grantLeaks("sign  lead     " + leadRead.public + NL, []).length === 0 && grantLeaks("sign  paid     no, a trial" + NL, []).length === 0;
    const bad = allGrantRuns.map((x) => [x.name, grantLeaks(x.r.stdout + x.r.stderr, x.paths.concat([GO, GK, keyAt, leadAt]))]).filter(([, f]) => f.length);
    bad.forEach(([n, f]) => process.stdout.write("       " + n + " leaks " + f.join(", ") + NL));
    const written = fs.readdirSync(GO).filter((n) => /^(default|paid-45|trial-1)\.json$/.test(n)).map((n) => fs.readFileSync(path.join(GO, n), "utf8"));
    const fileLeaks = written.filter((text) => grantSecrets.some((s) => s && text.indexOf(s) >= 0));
    process.stdout.write("       " + allGrantRuns.length + " grant run(s) scanned, " + bad.length + " leaking, " + written.length + " grant(s) written, " + fileLeaks.length + " holding a secret" + NL);
    return finds && bad.length === 0 && allGrantRuns.length >= 30 && written.length === 3 && fileLeaks.length === 0
      && sha(leadAt) === keyShaBefore[0] && sha(keyAt) === keyShaBefore[1];
  });
  await leg("sc1n the header's usage lines, the usage refusal and the refusal for a missing --out name the grant command and say where Studio reads the grant: relay-grant.json in"
    + " its settings folder, beside signing-key.json", async () => {
    const src = fs.readFileSync(TOOL, "utf8"), head = src.slice(0, src.indexOf("*/"));
    const bad = runTool(["bogus"], { cwd: LAB, pass: PASS });
    const noOut = runTool(["grant", "--lead", leadAt, "--root", keyAt], { cwd: LAB, pass: PASS });
    const line = (r) => r.status === 2 && r.stdout === "" && /^sign  [^\n]+\n$/.test(r.stderr);
    return /^ \*     node tools\/sign\.mjs grant --lead <key file> --root <key file> --out <file>/m.test(head)
      && /relay-grant\.json in its own settings folder, beside signing-key\.json/.test(head.replace(/\s*\n \*\s*/g, " "))
      && line(bad) && bad.stderr.indexOf("grant --lead <key file> --root <key file> --out <file>") > 0
      && line(noOut) && /relay-grant\.json/.test(noOut.stderr) && /signing-key\.json/.test(noOut.stderr);
  });

  /* ---- the delegation (licence service S3): node tools/sign.mjs delegate ---------------------------------------------- */
  const DK = path.join(SCRATCH, "delegate-keys"), DD = path.join(SCRATCH, "delegations");
  for (const d of [DK, DD]) fs.mkdirSync(d, { recursive: true });
  /* The service key is held under a passphrase of its own, which the tool is never given: it reads the public half alone. */
  const SVC = "copper heron waits by the weir " + crypto.randomBytes(5).toString("hex");
  const svcAt = path.join(DK, "service-key.json");
  const svcMade = runTool(["make", "--out", svcAt], { cwd: LAB, pass: SVC });
  if (svcMade.status !== 0) process.stderr.write("  setup: make said " + svcMade.stderr.slice(0, 200) + NL);
  const svcRead = readKeyFile(svcAt), svcOpen = unlockKey(svcRead, SVC);
  const svcDer = svcOpen.privateKey.export({ type: "pkcs8", format: "der" });
  const svcSecrets = [].concat(spellings(SVC), spellings(svcDer), spellings(svcDer.subarray(-32)), spellings(Buffer.from(svcRead.doc.private, "hex")),
    [svcRead.doc.private, svcRead.doc.private.slice(0, 16), svcRead.doc.wrap.tag, svcRead.doc.wrap.salt, svcRead.doc.wrap.iv]);
  const delegateSecrets = secrets.concat(svcSecrets);
  const leadOpen = unlockKey(leadRead, PASS);
  const dKeyShas = [sha(svcAt), sha(keyAt), sha(leadAt)];
  const dNOTE = "sign  note: this root key is not the vendor root the relay trusts, so the delegation holds only under another root" + NL;
  const dArgs = (out, o) => {
    const x = Object.assign({ key: svcAt, root: keyAt, may: "licence,relay-grant", more: [] }, o || {});
    const a = ["delegate", "--key", x.key, "--root", x.root, "--out", out];
    if (x.may !== null) a.push("--may", x.may);
    return a.concat(x.more);
  };
  const dRun = (out, o, env) => runTool(dArgs(out, o), Object.assign({ cwd: LAB, pass: PASS }, env || {}));
  const dOf = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
  const allDelegateRuns = [];
  const dNoted = (name, r, paths) => { allDelegateRuns.push({ name, r, paths: paths || [] }); return r; };
  const SPKI = Buffer.from("302a300506032b6570032100", "hex");
  const signedBy = (d, pub) => {
    try {
      return crypto.verify(null, C.delegationBytes(d), crypto.createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(pub, "hex")]), format: "der", type: "spki" }),
        Buffer.from(d.sig.value, "hex"));
    } catch { return false; }
  };
  /* A relay grant for the lead, signed by the service key and naming the delegation: what the licence service will make. */
  const grantUnder = (d) => {
    const issued = d.from, g = { kind: "etiuda-relay-grant", format: 1, lead: leadRead.public, issued, until: Math.min(d.until, issued + 30 * DAY), paid: true,
      sig: { alg: "ed25519", keyId: svcRead.keyId, value: "" }, via: d };
    g.sig.value = crypto.sign(null, C.grantBytes(g), svcOpen.privateKey).toString("hex");
    return g;
  };
  const dOneLine = (r) => r.status === 2 && r.stdout === "" && /^sign  [^\n]+\n$/.test(r.stderr) && !/\n\s+at |Error|node:internal|\.mjs:\d+/.test(r.stderr);
  const isoOf = (ms) => new Date(ms).toISOString();

  await leg("sc1o a good run writes a delegation the pinned relay accepts: exit 0, the file holds exactly the seven fields, the service key's id and public half read from its"
    + " key file, the uses as named, 365 days by default, 366 at the most and 45 under --staging, signed by the root and by no other key, a relay grant signed under it passing"
    + " the pinned relay's own judgement (and a create over it), refused under the vendor root and for a delegation of the licence alone; a delegation at --out is replaced", async () => {
    const at = (n) => path.join(DD, n + ".json");
    const t0 = Date.now();
    const cases = [
      ["default", at("default"), {}, 365, ["licence", "relay-grant"]],
      ["the longest, uses in another order", at("longest"), { may: "relay-grant,licence", more: ["--days", "366"] }, 366, ["relay-grant", "licence"]],
      ["the licence alone", at("licence-only"), { may: "licence", more: ["--days", "30"] }, 30, ["licence"]],
      ["staging", at("staging"), { more: ["--staging"] }, 45, ["licence", "relay-grant"]],
      ["staging, 1 day, passphrase from a file", at("staging-1"), { may: "relay-grant", more: ["--staging", "--days", "1", "--passphrase-file", passFile] }, 1, ["relay-grant"]],
    ];
    const runsD = cases.map(([name, out, opt]) => dNoted("delegate " + name, dRun(out, opt, name.indexOf("file") >= 0 ? { pass: undefined } : {}), [out, passFile]));
    const t1 = Date.now();
    runsD.forEach((r, i) => process.stdout.write(show({ name: "delegate " + cases[i][0], status: r.status, stdout: r.stdout, stderr: r.stderr })));
    if (!runsD.every((r) => r.status === 0)) return false;
    const docs = cases.map(([, out]) => dOf(out));
    const shaped = (d, c) => Object.keys(d).sort().join() === "format,from,key,kind,may,sig,until" && d.kind === "etiuda-delegation" && d.format === 1
      && Object.keys(d.key).sort().join() === "id,pub" && d.key.id === svcRead.keyId && d.key.pub === svcRead.public
      && Array.isArray(d.may) && d.may.join() === c[4].join() && Object.keys(d.sig).sort().join() === "alg,keyId,value" && d.sig.alg === "ed25519" && d.sig.keyId === rootRead.keyId;
    const spanned = (d, c) => d.until - d.from === c[3] * DAY && d.until - d.from <= C.DELEGATION_MAX_MS && d.from >= t0 && d.from <= t1;
    const signed = (d) => signedBy(d, rootRead.public) && !signedBy(d, svcRead.public) && !signedBy(d, leadRead.public);
    const said = runsD.every((r, i) => {
      const d = docs[i], days = cases[i][3];
      return r.stderr === dNOTE && r.stdout === ["sign  wrote " + cases[i][1], "sign  keyId    " + svcRead.keyId, "sign  may      " + cases[i][4].join(","),
        "sign  from     " + isoOf(d.from), "sign  until    " + isoOf(d.until) + " (" + days + " day" + (days === 1 ? "" : "s") + ")"].join(NL) + NL;
    });
    const rt = "00112233445566778899aabbccddeeff";
    const accepted = docs.every((d, i) => {
      if (cases[i][4].indexOf("relay-grant") < 0) return true;
      const g = grantUnder(d), t = g.issued + 1000;
      const body = { rt, lead: { keyId: leadRead.keyId, pub: leadRead.public }, t, grant: g,
        sig: crypto.sign(null, C.create2Bytes(rt, leadRead.keyId, t, g), leadOpen.privateKey).toString("hex") };
      return C.grantOk(g, leadRead.public, t, [rootRead.public]) && C.judgeCreate(rt, body, t, [rootRead.public]).ok === true
        && C.grantWhy(g, leadRead.public, t) === "via-signature" && C.judgeCreate(rt, body, t).ok !== true;
    });
    const licenceOnly = C.grantWhy(grantUnder(docs[2]), leadRead.public, docs[2].from + 1000, [rootRead.public]) === "via-may";
    /* S1's shape: kind, exactly the fields, the uses (known, no repeat, at least one), and a span inside the bound. */
    const s1 = docs.every((d) => d.kind === "etiuda-delegation" && Object.keys(d).length === 7 && d.may.length >= 1 && new Set(d.may).size === d.may.length
      && d.may.every((m) => m === "licence" || m === "relay-grant") && d.until > d.from && d.until - d.from <= 366 * DAY);
    /* Renewal: a second run into the same file replaces the delegation, which is itself one. */
    const renewed = dNoted("delegate renewal", dRun(cases[0][1], { more: ["--days", "100"] }), [cases[0][1]]);
    const d2 = renewed.status === 0 ? dOf(cases[0][1]) : null;
    return said && docs.every((d, i) => shaped(d, cases[i]) && spanned(d, cases[i]) && signed(d)) && accepted && licenceOnly && s1
      && !!d2 && shaped(d2, [0, 0, 0, 100, ["licence", "relay-grant"]]) && d2.until - d2.from === 100 * DAY && d2.from >= docs[0].from;
  });
  await leg("sc1p a delegation longer than the bound is refused: 367 days or more, and over 45 under --staging, or a length that is no whole number of days, or none; exit 2 in one"
    + " line that names the longest, and nothing is written", async () => {
    const list = [];
    const add = (name, more, re) => { const out = path.join(DD, "days-" + list.length + ".json"); list.push([name, out, dNoted("days: " + name, dRun(out, { more }), []), re]); };
    for (const d of ["367", "1000", "99999"]) add(d, ["--days", d], /at most 366 days/);
    for (const d of ["46", "100", "366"]) add("staging " + d, ["--staging", "--days", d], /at most 45 days/);
    add("367 before --staging", ["--days", "367", "--staging"], /at most 45 days/);
    for (const d of ["0", "3.5", "abc", "-1", "1e1"]) add(d, ["--days", d], /from 1 to 366/);
    for (const d of ["0", "abc"]) add("staging " + d, ["--staging", "--days", d], /from 1 to 45/);
    add("(no value)", ["--days"], /from 1 to 366/);
    add("staging (no value)", ["--staging", "--days"], /from 1 to 45/);
    add("--staging with a value", ["--staging", "yes"], /--staging takes no value/);
    list.forEach(([n, , r]) => process.stdout.write(show({ name: "--days " + n, status: r.status, stdout: r.stdout, stderr: r.stderr })));
    return list.length === 17 && list.every(([, out, r, re]) => dOneLine(r) && re.test(r.stderr) && !fs.existsSync(out));
  });
  await leg("sc1q the uses are named and known: an unknown use, a repeat, an empty item, another case, a space and a missing --may are each refused in one line that names --may,"
    + " exit 2, and nothing is written", async () => {
    const list = [];
    const add = (name, may, more) => { const out = path.join(DD, "may-" + list.length + ".json"); list.push([name, out, dNoted("may: " + name, dRun(out, { may, more: more || [] }), [])]); };
    for (const m of ["frobnicate", "licence,frobnicate", "relay-grant,admin", "licence,licence", "relay-grant,licence,relay-grant", "licence,", ",licence", "Licence", "licence, relay-grant",
      "licence;relay-grant", "all", "relay"]) add(m, m);
    add("(no value)", null, ["--may"]);
    add("(not given)", null);
    list.forEach(([n, , r]) => process.stdout.write(show({ name: "--may " + n, status: r.status, stdout: r.stdout, stderr: r.stderr })));
    return list.length === 14 && list.every(([, out, r]) => dOneLine(r) && /--may/.test(r.stderr) && !fs.existsSync(out));
  });
  await leg("sc1r a delegation is made only for a service key held under a passphrase, and never over or from the wrong file: a plain key, one whose wrap is none, missing or a lie, the key the"
    + " operating system keeps, a key file that does not read, an id the relay would refuse, the root's own key, a root that does not open or is the wrong passphrase, an --out that is a key"
    + " file or any other file that is no delegation, and a missing flag are each refused in one line, exit 2, nothing written and no file touched", async () => {
    const out = (n) => path.join(DD, "r-" + n + ".json");
    const plainDer = svcDer.toString("hex"), svcDoc = svcRead.doc;
    const mk = (name, mutate) => { const d = clone(svcDoc); mutate(d); return put(path.join(DK, name + ".json"), json(d)); };
    const flippedRoot = put(path.join(DK, "root-flipped.json"), json(Object.assign(clone(rootRead.doc), { private: flip(rootRead.doc.private) })));
    const marker = "QQQQ-not-a-secret-QQQQ";
    const keys = [
      ["a plain key, no wrap", mk("plain", (d) => { delete d.wrap; d.private = plainDer; }), /held under a passphrase/],
      ["a wrap that is none", mk("wrap-none", (d) => { d.wrap = { kdf: "none" }; d.private = plainDer; }), /held under a passphrase/],
      ["a wrap that claims a passphrase over a private half in the clear", mk("wrap-lie", (d) => { d.private = plainDer; }), /held under a passphrase/],
      ["a wrap with no salt", mk("wrap-no-salt", (d) => { delete d.wrap.salt; }), /held under a passphrase/],
      ["no wrap over the sealed bytes", mk("wrap-gone", (d) => { delete d.wrap; }), /held under a passphrase/],
      ["the key the operating system keeps", vaultKey, /operating system/],
      ["an id the relay would refuse", mk("bad-id", (d) => { d.keyId = "Not An Id"; }), /not an id the relay accepts/],
      ["the root's own key", keyAt, /same key|root key/],
      ["absent", path.join(DK, "no-such-service.json"), /^sign  no key file at /],
      ["not JSON", put(path.join(DK, "service-not-json.json"), marker + " is not json"), /^sign  .*is not JSON/],
      ["another kind", put(path.join(DK, "service-other-kind.json"), json({ kind: "something-else-" + marker, schema: 1 })), /^sign  .*is not an Etiuda Studio signing key/],
      ["a folder", DK, /^sign  /],
    ];
    const keyRuns = keys.map(([name, file, re], i) => {
      const o = out("key-" + i);
      const r = dNoted("key: " + name, dRun(o, { key: file }), [file]);
      return { name, r, o, ok: re.test(r.stderr) && !fs.existsSync(o) && (r.stdout + r.stderr).indexOf(marker.slice(0, 8)) < 0 };
    });
    const roots = [["absent", path.join(DK, "no-such-root.json"), /^sign  no key file at /], ["not a passphrase key", vaultKey, /operating system/],
      ["altered", flippedRoot, /does not open/]].map(([name, file, re], i) => {
      const o = out("root-" + i);
      const r = dNoted("root: " + name, dRun(o, { root: file }), [file]);
      return { name, r, o, ok: re.test(r.stderr) && !fs.existsSync(o) };
    });
    const wrong = dNoted("root: wrong passphrase", dRun(out("wrong"), {}, { pass: PASS + "!" }));
    /* An --out that is a key file, or a file that is no delegation, is left as it was: a key file above all. */
    const notDelegation = put(path.join(DD, "other.json"), json({ kind: "something-else", n: 1 }));
    const aGrant = put(path.join(DD, "a-grant.json"), json({ kind: "etiuda-relay-grant", format: 1 }));
    const keyCopy = put(path.join(DD, "key-copy.json"), fs.readFileSync(svcAt, "utf8"));
    const notJson = put(path.join(DD, "not-json.json"), "not json at all" + NL);
    const aFolder = path.join(DD, "a-folder.json"); fs.mkdirSync(aFolder, { recursive: true });
    const kept = [notDelegation, aGrant, keyCopy, notJson].map((f) => [f, sha(f)]);
    const overSvc = dNoted("--out is the service key file", dRun(svcAt, {}), [svcAt]), overRoot = dNoted("--out is the root key file", dRun(keyAt, {}), [keyAt]);
    const overs = [notDelegation, aGrant, keyCopy, notJson, aFolder].map((f) => dNoted("--out holds " + path.basename(f), dRun(f, {}), [f]));
    const missing = ["--out", "--key", "--root", "--may"].map((flag) => {
      const a = dArgs(out("missing")), i = a.indexOf(flag); a.splice(i, 2);
      return dNoted("no " + flag, runTool(a, { cwd: LAB, pass: PASS }));
    });
    /* The passphrase is refused in check's own words. */
    const cases = [["no passphrase at all", [], undefined], ["an empty passphrase in the environment", [], ""], ["an empty passphrase file", ["--passphrase-file", passEmpty], undefined],
      ["a passphrase file that is not there", ["--passphrase-file", passMissing], undefined], ["--passphrase with a value", ["--passphrase", PASS], undefined]];
    const said = cases.map(([name, more, pass], i) => {
      const o = out("pass-" + i), mine = dNoted("passphrase: " + name, dRun(o, { more }, { pass }), [passEmpty, passMissing]);
      const theirs = runTool(["check", "--out", keyAt].concat(more), { cwd: LAB, pass });
      return { name, mine, theirs, o };
    });
    const all = keyRuns.map((x) => x.r).concat(roots.map((x) => x.r), [wrong, overSvc, overRoot], overs, missing, said.map((x) => x.mine));
    all.forEach((r, i) => process.stdout.write("       refusal " + (i + 1) + ": exit " + r.status + ", " + JSON.stringify(r.stderr.slice(0, 90)) + NL));
    return all.every(dOneLine) && keyRuns.every((x) => x.ok) && roots.every((x) => x.ok) && /does not open/.test(wrong.stderr) && !fs.existsSync(out("wrong"))
      && /not a key file/.test(overSvc.stderr) && /not a key file/.test(overRoot.stderr) && overs.every((r) => /not a delegation/.test(r.stderr))
      && kept.every(([f, s]) => sha(f) === s) && fs.statSync(aFolder).isDirectory()
      && missing.every((r, i) => r.stderr.indexOf(["--out", "--key", "--root", "--may"][i]) >= 0 && !fs.existsSync(out("missing")))
      && said.every((x) => x.theirs.status === 2 && x.mine.stderr === x.theirs.stderr && !fs.existsSync(x.o))
      && sha(svcAt) === dKeyShas[0] && sha(keyAt) === dKeyShas[1] && sha(leadAt) === dKeyShas[2];
  });
  await leg("sc1s in every delegate run, good or refused, the output holds neither the passphrase nor the root key nor the service key in any spelling nor the sealed bytes nor any run of 32 hex"
    + " or base64 characters, and the delegations written hold no secret either; the scanner is shown to find each first; the key files are as they were", async () => {
    const control = [PASS, SVC, spellings(der)[0], spellings(svcDer)[0], spellings(svcDer.subarray(-32))[2], doc.private, svcRead.doc.private, "ab".repeat(32), "A".repeat(40)];
    const finds = control.every((c) => leaksOf("sign  wrote " + c + NL, delegateSecrets, []).length > 0)
      && leaksOf("sign  keyId   " + svcRead.keyId + NL, delegateSecrets, []).length === 0 && leaksOf("sign  may     licence,relay-grant" + NL, delegateSecrets, []).length === 0;
    const bad = allDelegateRuns.map((x) => [x.name, leaksOf(x.r.stdout + x.r.stderr, delegateSecrets, x.paths.concat([DD, DK, GK, keyAt, leadAt, svcAt]))]).filter(([, f]) => f.length);
    bad.forEach(([n, f]) => process.stdout.write("       " + n + " leaks " + f.join(", ") + NL));
    const written = fs.readdirSync(DD).filter((n) => /^(default|longest|licence-only|staging|staging-1)\.json$/.test(n)).map((n) => fs.readFileSync(path.join(DD, n), "utf8"));
    const fileLeaks = written.filter((text) => delegateSecrets.some((s) => s && text.indexOf(s) >= 0));
    process.stdout.write("       " + allDelegateRuns.length + " delegate run(s) scanned, " + bad.length + " leaking, " + written.length + " delegation(s) written, " + fileLeaks.length + " holding a secret" + NL);
    return finds && bad.length === 0 && allDelegateRuns.length >= 60 && written.length === 5 && fileLeaks.length === 0
      && sha(svcAt) === dKeyShas[0] && sha(keyAt) === dKeyShas[1] && sha(leadAt) === dKeyShas[2];
  });
  await leg("sc1t the header's usage lines, the usage refusal and the refusal for a missing --out name the delegate command", async () => {
    const src = fs.readFileSync(TOOL, "utf8"), head = src.slice(0, src.indexOf("*/"));
    const bad = runTool(["bogus"], { cwd: LAB, pass: PASS });
    const noOut = runTool(["delegate", "--key", svcAt, "--root", keyAt, "--may", "licence"], { cwd: LAB, pass: PASS });
    const usage = "delegate --key <service key file> --root <root key file> --may licence,relay-grant --out <file>";
    const line = (r) => r.status === 2 && r.stdout === "" && /^sign  [^\n]+\n$/.test(r.stderr);
    return head.indexOf(" *     node tools/sign.mjs " + usage) >= 0 && /--days N\] \[--staging\]/.test(head.replace(/\s*\n \*\s*/g, " "))
      && line(bad) && bad.stderr.indexOf(usage) > 0 && line(noOut) && /--out/.test(noOut.stderr);
  });

  /* The test architect's E3 on S3: a root key file whose key id the relay would refuse is refused before it is opened, for every
     use, the licence's alone included, where the grant check that would have caught it does not run; nothing is written. */
  await leg("sc1u a root key file whose key id the relay refuses is refused in one line before it is opened, with --may licence alone, and nothing is written", async () => {
    const badRoot = path.join(DK, "root-bad-id.json"), out = path.join(DD, "bad-root-id.json");
    fs.writeFileSync(badRoot, JSON.stringify(Object.assign({}, JSON.parse(fs.readFileSync(keyAt, "utf8")), { keyId: "Root Key!" }), null, 1) + NL);
    const r = dNoted("delegate bad root id", dRun(out, { root: badRoot, may: "licence" }), [out, badRoot]);
    process.stdout.write(show({ name: "delegate bad root id", status: r.status, stdout: r.stdout, stderr: r.stderr }));
    return dOneLine(r) && /not an id the relay accepts/.test(r.stderr) && !fs.existsSync(out);
  });

  /* The criterion: when the pinned engine in this checkout lacks what a command needs, the command says so in one line,
     names the fix, and writes nothing. */
  await leg("sc1v the checkout's pinned engine lacking what a command needs is refused before anything else in one line, naming the fix, and nothing is written", async () => {
    const STALE = path.join(SCRATCH, "stale-pin");
    fs.mkdirSync(STALE, { recursive: true });
    for (const d of ["tools", "src", path.join("engine", "pinned")]) {
      fs.cpSync(path.join(ROOT, d), path.join(STALE, d), { recursive: true });
    }
    fs.copyFileSync(path.join(ROOT, "package.json"), path.join(STALE, "package.json"));
    const staleCore = path.join(STALE, "engine", "pinned", "relay", "core.cjs");
    fs.writeFileSync(staleCore, fs.readFileSync(staleCore, "utf8").replace(/\bgrantBytes,\s*/g, "").replace(/\bdelegationBytes,\s*/g, ""));
    const staleTool = path.join(STALE, "tools", "sign.mjs");
    const staleGrantOut = path.join(GO, "stale-grant.json");
    const staleDelegateOut = path.join(DD, "stale-delegate.json");
    const rGrant = runTool(["grant", "--lead", leadAt, "--root", keyAt, "--out", staleGrantOut], { cwd: LAB, pass: PASS, tool: staleTool });
    const rDelegate = runTool(["delegate", "--key", svcAt, "--root", keyAt, "--may", "licence,relay-grant", "--out", staleDelegateOut], { cwd: LAB, pass: PASS, tool: staleTool });
    [rGrant, rDelegate].forEach((r, i) => process.stdout.write(show({ name: "stale pin " + (i === 0 ? "grant" : "delegate"), status: r.status, stdout: r.stdout, stderr: r.stderr })));
    const want = "sign  the engine this checkout has pinned is older than this command: run node tools/engine-fetch.mjs" + NL;
    return rGrant.status === 2 && rGrant.stdout === "" && rGrant.stderr === want && !fs.existsSync(staleGrantOut)
      && rDelegate.status === 2 && rDelegate.stdout === "" && rDelegate.stderr === want && !fs.existsSync(staleDelegateOut);
  });

  /* ---- the service's secrets (licence service S7, the test architect's A5): node tools/sign.mjs secrets ------------------ */
  /* wrangler is a stand-in here: a script that keeps, in a folder of its own outside the working folder, what each run of it
     was handed (its arguments, its stdin, whether its stdin was a pipe, and two things of its environment), and answers as
     wrangler does. STANDIN_FAIL_AT makes the run of that number fail. Nothing reaches Cloudflare. */
  const SK = path.join(SCRATCH, "secrets-capture"), SW = path.join(SCRATCH, "secrets-wrangler");
  for (const d of [SK, SW]) fs.mkdirSync(d, { recursive: true });
  const standIn = put(path.join(SW, "wrangler.mjs"), [
    "import fs from \"node:fs\"; import path from \"node:path\"; import crypto from \"node:crypto\";",
    "const cfSha = process.env.CLOUDFLARE_API_TOKEN === undefined ? null : crypto.createHash(\"sha256\").update(process.env.CLOUDFLARE_API_TOKEN).digest(\"hex\");",
    "const dir = process.env.STANDIN_CAPTURE; let input = \"\";",
    "process.stdin.setEncoding(\"utf8\"); process.stdin.on(\"data\", (d) => { input += d; });",
    "const seen = { argv: process.argv.slice(2), pass: Object.prototype.hasOwnProperty.call(process.env, \"STUDIO_KEY_PASSPHRASE\"),",
    "  metrics: process.env.WRANGLER_SEND_METRICS, cf: cfSha, account: process.env.CLOUDFLARE_ACCOUNT_ID === undefined ? null : process.env.CLOUDFLARE_ACCOUNT_ID };",
    "if (process.argv[3] === \"list\") {",
    "  fs.writeFileSync(path.join(dir, \"list-\" + fs.readdirSync(dir).filter((f) => f.startsWith(\"list\")).length + \".json\"), JSON.stringify(seen));",
    "  if (process.env.STANDIN_LIST_FAIL) { process.stderr.write(\"stand-in: not found\\n\"); process.exit(1); }",
    "  process.stdout.write(JSON.stringify(String(process.env.STANDIN_SECRETS || \"\").split(\",\").filter(Boolean).map((name) => ({ name, type: \"secret_text\" })), null, \"  \") + \"\\n\");",
    "  process.exit(0);",
    "}",
    "process.stdin.on(\"end\", () => {",
    "  const n = fs.readdirSync(dir).filter((f) => !f.startsWith(\"list\")).length;",
    "  fs.writeFileSync(path.join(dir, String(n).padStart(3, \"0\") + \".json\"), JSON.stringify({ argv: process.argv.slice(2), stdin: input,",
    "    tty: !!process.stdin.isTTY, pass: Object.prototype.hasOwnProperty.call(process.env, \"STUDIO_KEY_PASSPHRASE\"), metrics: process.env.WRANGLER_SEND_METRICS,",
    "    cf: cfSha, account: process.env.CLOUDFLARE_ACCOUNT_ID === undefined ? null : process.env.CLOUDFLARE_ACCOUNT_ID }));",
    "  if (String(n) === String(process.env.STANDIN_FAIL_AT)) { process.stderr.write(\"stand-in: no such account\\n\"); process.exit(1); }",
    "  process.stdout.write(\"Success! Uploaded secret \" + process.argv[4] + \"\\n\");",
    "});", ""].join(NL));
  const toml = path.join(ROOT, "service", "licence", "wrangler.toml");
  let sRun = 0;
  const secretsRun = (more, o) => {
    const cap = path.join(SK, "run-" + (++sRun));
    fs.mkdirSync(cap, { recursive: true });
    const env = Object.assign({}, process.env, { STANDIN_CAPTURE: cap });
    delete env.STUDIO_KEY_PASSPHRASE;
    delete env.STANDIN_FAIL_AT;
    delete env.STANDIN_LIST_FAIL;
    env.STANDIN_SECRETS = o && o.held !== undefined ? o.held : "";
    if (o && o.listFail) env.STANDIN_LIST_FAIL = "1";
    for (const k of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_KEY", "CLOUDFLARE_EMAIL", "STUDIO_KEYRING_READER"]) delete env[k];
    /* A keyring stand-in is handed in-process (the test architect's E3): a run with one goes through the driver. */
    const ring = o && o.keyring !== undefined ? put(path.join(cap + "-ring.json"), JSON.stringify(o.keyring)) : null;
    if (!o || o.pass === undefined) env.STUDIO_KEY_PASSPHRASE = PASS;
    else if (o.pass !== null) env.STUDIO_KEY_PASSPHRASE = o.pass;
    if (o && o.failAt !== undefined) env.STANDIN_FAIL_AT = String(o.failAt);
    /* The test architect's E3 on S7: a reader named in the environment, which secrets must never run. PATH is emptied for this
       run, so the real Python reader cannot start either, and the real keyring is never opened. */
    if (o && o.envReader) {
      for (const k of Object.keys(env)) if (/^path$/i.test(k)) delete env[k];
      Object.assign(env, { PATH: "", STUDIO_KEYRING_READER: readerAt, STANDIN_KEYRING_FILE: put(path.join(cap + "-ring.json"), JSON.stringify(o.envReader)),
        STANDIN_KEYRING_LOG: path.join(cap + "-ring.log") });
    }
    const root = o && o.root !== undefined ? o.root : keyAt;
    const args = ["secrets"].concat(root ? ["--root", root] : [], ["--wrangler", standIn], more || []);
    const r = spawnSync(process.execPath, ring ? [driverAt, TOOL, (o && o.driver) || "-", ring, path.join(cap + "-ring.log")].concat(args) : [TOOL].concat(args),
      { cwd: LAB, encoding: "utf8", env });
    const files = fs.readdirSync(cap).sort();
    const puts = files.filter((n) => !n.startsWith("list")).map((n) => JSON.parse(fs.readFileSync(path.join(cap, n), "utf8")));
    const lists = files.filter((n) => n.startsWith("list")).map((n) => JSON.parse(fs.readFileSync(path.join(cap, n), "utf8")));
    const ringLog = path.join(cap + "-ring.log");
    const reads = fs.existsSync(ringLog) ? fs.readFileSync(ringLog, "utf8").split(NL).filter(Boolean).map((l) => JSON.parse(l)) : [];
    return { status: r.status, stdout: String(r.stdout), stderr: String(r.stderr), puts, lists, args, reads };
  };
  /* A keyring stand-in for sc2e alone, the one a reader named in the environment would run: it answers from a JSON file the leg
     wrote, keyed "<service>/<user>", and logs the arguments it was handed. secrets must never run it. */
  const readerAt = put(path.join(SW, "keyring.mjs"), [
    "import fs from \"node:fs\";",
    "const [service, user] = process.argv.slice(2);",
    "fs.appendFileSync(process.env.STANDIN_KEYRING_LOG, JSON.stringify([service, user]) + \"\\n\");",
    "const map = JSON.parse(fs.readFileSync(process.env.STANDIN_KEYRING_FILE, \"utf8\"));",
    "const v = map[service + \"/\" + user];",
    "if (v === false) { process.stderr.write(\"stand-in keyring: no backend\\n\"); process.exit(1); }",
    "process.stdout.write(typeof v === \"string\" ? v + \"\\n\" : \"\");", ""].join(NL));
  /* The driver: the tool imported and secrets run in this very process, with a keyring stand-in handed in as a function (the
     test architect's E3), which answers from the leg's JSON file keyed "<service>/<user>", logs what it was asked, and answers
     as a keyring that did not start for an entry mapped to false; the real keyring is never opened. Then the parent's own
     environment: whether any variable holds the token (by its sha256, so the driver never holds it) or a Cloudflare name. */
  const driverAt = put(path.join(SW, "driver.mjs"), [
    "import crypto from \"node:crypto\"; import path from \"node:path\"; import { pathToFileURL } from \"node:url\";",
    "import fs from \"node:fs\";",
    "const [tool, tokenSha, ringFile, ringLog, ...args] = process.argv.slice(2);",
    "const reader = (service, user) => {",
    "  fs.appendFileSync(ringLog, JSON.stringify([service, user]) + \"\\n\");",
    "  const v = JSON.parse(fs.readFileSync(ringFile, \"utf8\"))[service + \"/\" + user];",
    "  return v === false ? { status: 1, stdout: \"\" } : { status: 0, stdout: typeof v === \"string\" ? v + \"\\n\" : \"\" };",
    "};",
    "const sign = await import(pathToFileURL(tool).href);",
    "const { parse } = await import(pathToFileURL(path.join(path.dirname(tool), \"publish.mjs\")).href);",
    "await sign.secretsMain(parse(args), { keyringReader: reader });",
    "const sha = (v) => crypto.createHash(\"sha256\").update(String(v)).digest(\"hex\");",
    "const clean = !(\"CLOUDFLARE_API_TOKEN\" in process.env) && !(\"CLOUDFLARE_ACCOUNT_ID\" in process.env) && Object.values(process.env).every((v) => sha(v) !== tokenSha);",
    "process.stdout.write(\"parent-env \" + (clean ? \"clean\" : \"HOLDS IT\") + \"\\n\");", ""].join(NL));
  const rulesIsId = (id) => Engine.relayRules().blob.isId(id);
  const putOf = (r, name) => r.puts.find((p) => p.argv[2] === name);
  const sSnap = () => [LAB, DK, GK, KEYS].map((d) => fs.readdirSync(d).sort().map((n) => {
    const p = path.join(d, n), s = fs.statSync(p);
    return s.isDirectory() ? n + "/" : n + " " + sha(p);
  }).join(",")).join(NL);
  const sBefore = sSnap();
  /* A first run, on a Worker that holds no secret; a second, on one that holds all three; and one asking for a new hash key. */
  const ALL = "SERVICE_KEY,DELEGATION,HASH_KEY";
  const good = secretsRun(["--staging"]), again = secretsRun(["--staging", "--config", toml], { held: ALL });
  const fresh = secretsRun(["--staging", "--new-hash-key"], { held: ALL });
  [good, again, fresh].forEach((r, i) => process.stdout.write(show({ name: "secrets " + ["first", "again", "new-hash-key"][i], status: r.status, stdout: r.stdout, stderr: r.stderr })));
  const WARNING = "sign  WARNING: --new-hash-key replaces the Worker's HASH_KEY.";
  /* What each good run put, opened as the Worker opens it. */
  const opened = (r) => {
    const sk = putOf(r, "SERVICE_KEY"), dj = putOf(r, "DELEGATION"), hk = putOf(r, "HASH_KEY");
    let key = null, pub = null, d = null;
    try { key = crypto.createPrivateKey({ key: Buffer.from(sk.stdin, "hex"), format: "der", type: "pkcs8" });
      pub = crypto.createPublicKey(key).export({ type: "spki", format: "der" }).subarray(-32).toString("hex"); } catch { key = null; }
    try { d = JSON.parse(dj.stdin); } catch { d = null; }
    return { sk, dj, hk, key, pub, d };
  };

  await leg("sc1w secrets makes the service key, its delegation and the hash key and puts each with wrangler secret put, its value on wrangler's stdin:"
    + " exit 0; three puts in order, each run as exactly `secret put <NAME> --config <the service's wrangler.toml>` on a pipe; SERVICE_KEY the PKCS#8 of an"
    + " Ed25519 key in hex whose public half DELEGATION certifies, for licence and relay-grant, signed by the root and by no other key, 45 days under"
    + " --staging, a grant under it passing the pinned relay's own judgement; HASH_KEY 32 bytes in hex; each run a new service key; each run first"
    + " asks wrangler `secret list --config <toml> --format json`, names only", async () => {
    if (good.status !== 0 || again.status !== 0 || fresh.status !== 0) return false;
    const a = opened(good), b = opened(again);
    const order = [good, fresh].every((r) => r.puts.map((p) => p.argv[2]).join() === "SERVICE_KEY,DELEGATION,HASH_KEY");
    const argvExact = [good, again, fresh].every((r) => r.puts.every((p) => p.argv.length === 5 && p.argv[0] === "secret" && p.argv[1] === "put"
      && p.argv[3] === "--config" && path.resolve(p.argv[4]) === toml && p.tty === false)
      && r.lists.length === 1 && r.lists[0].argv.length === 6 && r.lists[0].argv.slice(0, 3).join() === "secret,list,--config"
      && path.resolve(r.lists[0].argv[3]) === toml && r.lists[0].argv.slice(4).join() === "--format,json");
    const certified = [a, b].every((x) => !!x.key && !!x.d && x.d.key.pub === x.pub && x.d.may.join() === "licence,relay-grant"
      && x.d.until - x.d.from === 45 * DAY && signedBy(x.d, rootRead.public) && !signedBy(x.d, x.pub) && rulesIsId(x.d.key.id) && x.d.key.id === x.d.key.id.toLowerCase());
    const grantOk = [a, b].every((x) => {
      const g = { kind: "etiuda-relay-grant", format: 1, lead: leadRead.public, issued: x.d.from + 1000, until: x.d.from + 30 * DAY, paid: true,
        sig: { alg: "ed25519", keyId: x.d.key.id, value: "" }, via: x.d };
      g.sig.value = crypto.sign(null, C.grantBytes(g), x.key).toString("hex");
      return C.grantWhy(g, leadRead.public, g.issued + 1000, [rootRead.public]) === null;
    });
    const f = opened(fresh);
    const hashed = [a, f].every((x) => /^[0-9a-f]{64}$/.test(x.hk.stdin));
    const anew = a.pub !== b.pub && b.pub !== f.pub && a.hk.stdin !== f.hk.stdin;
    process.stdout.write("       order " + order + ", argv " + argvExact + ", certified " + certified + ", grant " + grantOk + ", hash " + hashed + ", new " + anew + NL);
    return order && argvExact && certified && grantOk && hashed && anew;
  });

  await leg("sc1x the private half and the hash key reach wrangler's stdin and nothing else: no run prints them, the root key or the passphrase in any spelling"
    + " (wrangler's own output included), no put's arguments hold one, no put inherits the passphrase and every put has wrangler's metrics off, and no file"
    + " is written: the working folder and the key folders are as they were", async () => {
    const runsS = [good, again, fresh];
    const opens = [good, fresh].map(opened);
    const theirs = [].concat(...opens.map((x) => {
      const der = x.key.export({ type: "pkcs8", format: "der" });
      return [].concat(spellings(der), spellings(der.subarray(-32)), spellings(Buffer.from(x.hk.stdin, "hex")), [x.sk.stdin, x.hk.stdin]);
    }), spellings(opened(again).key.export({ type: "pkcs8", format: "der" })));
    const all = secrets.concat(theirs);
    const pubs = opens.map((x) => x.pub).concat([opened(again).pub, rootRead.public]);
    const scrub = (t) => pubs.reduce((acc, p) => acc.split(p).join(""), String(t));
    const printed = runsS.map((r) => leaksOf(scrub(r.stdout + r.stderr), all, [LAB, keyAt, standIn, toml, SCRATCH])).filter((f) => f.length);
    const inArgs = runsS.some((r) => r.puts.some((p) => all.some((s) => p.argv.join(" ").indexOf(s) >= 0)));
    const env = runsS.every((r) => r.puts.concat(r.lists).every((p) => p.pass === false && p.metrics === "false"));
    const controls = leaksOf("sign  " + opens[0].sk.stdin + NL, all, []).length > 0 && leaksOf("sign  " + opens[0].hk.stdin + NL, all, []).length > 0;
    process.stdout.write("       " + runsS.length + " run(s) scanned, " + printed.length + " printing a secret, args " + (inArgs ? "hold" : "hold no") + " secret, env " + env + NL);
    return controls && printed.length === 0 && !inArgs && env && sSnap() === sBefore;
  });

  await leg("sc1y each refusal is one line with nothing put: no --root, an --out or a --key (secrets writes no file and makes its own key), a root that does"
    + " not open, no passphrase, the key the operating system keeps as root, 46 days under --staging, a --config that is not there; and a put wrangler"
    + " refuses stops the rest, naming what was put and what was not", async () => {
    const refusedNone = [
      ["no root", secretsRun(["--staging"], { root: "" })],
      ["--out", secretsRun(["--staging", "--out", path.join(SCRATCH, "nowhere.json")])],
      ["--key", secretsRun(["--staging", "--key", svcAt])],
      ["wrong passphrase", secretsRun(["--staging"], { pass: PASS + "!" })],
      ["no passphrase", secretsRun(["--staging"], { pass: null })],
      ["os-kept root", secretsRun(["--staging"], { root: vaultKey })],
      ["46 days", secretsRun(["--staging", "--days", "46"])],
      ["no config", secretsRun(["--staging", "--config", path.join(SCRATCH, "no-such.toml")])],
    ];
    const first = secretsRun(["--staging"], { failAt: 0 }), second = secretsRun(["--staging"], { failAt: 1 });
    refusedNone.concat([["fails first", first], ["fails second", second]]).forEach(([n, r]) => process.stdout.write(show({ name: "secrets " + n, status: r.status, stdout: r.stdout, stderr: r.stderr })));
    const lastLine = (r) => r.stderr.split(NL).filter(Boolean).pop() || "";
    const none = refusedNone.every(([, r]) => r.status === 2 && r.stdout === "" && /^sign  [^\n]+\n$/.test(r.stderr) && r.puts.length === 0);
    /* The test architect's E1 on S7, its tail: the line says what was put and what was not, that a run again is safe for the hash
       key, and that it makes a new service key and delegation; nothing it cannot keep. */
    const said = (r) => /safe for the hash key/.test(lastLine(r)) && /new service key and delegation/.test(lastLine(r)) && !/runs whole/.test(lastLine(r));
    const stops = first.status === 2 && first.puts.length === 1 && /did not put SERVICE_KEY/.test(lastLine(first)) && /nothing was put/.test(lastLine(first))
      && /holds what it held before/.test(lastLine(first)) && said(first)
      && second.status === 2 && second.puts.length === 2 && /put SERVICE_KEY; not put DELEGATION, HASH_KEY/.test(lastLine(second))
      && /answers unavailable/.test(lastLine(second)) && said(second) && !/HASH_KEY was put/.test(second.stderr);
    return none && stops && sSnap() === sBefore;
  });


  /* ---- secrets without a wrangler login: the Cloudflare token from the keyring, to wrangler's environment alone ---------- */
  const CF_TOKEN = "cf-test-" + crypto.randomBytes(20).toString("hex"), CF_ACCOUNT = crypto.randomBytes(16).toString("hex");
  const tokenSha = crypto.createHash("sha256").update(CF_TOKEN).digest("hex");
  const cfArgs = ["--staging", "--cf-keyring", "argos-test/token", "--cf-account", CF_ACCOUNT];
  const viaRing = secretsRun(cfArgs, { keyring: { "argos-test/token": CF_TOKEN }, driver: tokenSha });
  const viaDriver = secretsRun(cfArgs, { keyring: { "argos-test/token": CF_TOKEN }, driver: tokenSha });
  [viaRing, viaDriver].forEach((r, i) => process.stdout.write(show({ name: "secrets with the keyring" + (i ? ", in the driver" : ""), status: r.status, stdout: r.stdout, stderr: r.stderr })));

  await leg("sc2a with --cf-keyring <service>/<user> and --cf-account <id>, the token read from the keyring reaches every put in wrangler's environment as"
    + " CLOUDFLARE_API_TOKEN, with CLOUDFLARE_ACCOUNT_ID, and nowhere else: the keyring read with the service and the user as its arguments, the token in"
    + " no put's arguments, in no output in any spelling, and in no variable of the process that ran secrets once it is done", async () => {
    const tokSpell = spellings(CF_TOKEN).concat([CF_TOKEN.slice(8, 28)]);
    const runsK = [viaRing, viaDriver];
    const reached = runsK.every((r) => r.status === 0 && r.puts.length === 3 && r.puts.concat(r.lists).every((p) => p.cf === tokenSha && p.account === CF_ACCOUNT) && r.lists.length === 1);
    const asked = runsK.every((r) => r.reads.length === 1 && r.reads[0].join("/") === "argos-test/token");
    const inArgs = runsK.some((r) => r.puts.concat(r.lists).some((p) => tokSpell.some((t) => p.argv.join(" ").indexOf(t) >= 0)));
    const printed = runsK.some((r) => tokSpell.some((t) => (r.stdout + r.stderr).indexOf(t) >= 0));
    const parentClean = /^parent-env clean$/m.test(viaDriver.stdout);
    process.stdout.write("       reached " + reached + ", asked " + asked + ", in args " + inArgs + ", printed " + printed + ", parent " + (parentClean ? "clean" : "not clean") + NL);
    return reached && asked && !inArgs && !printed && parentClean && sSnap() === sBefore;
  });

  await leg("sc2b an empty or missing keyring entry, or a keyring that does not answer, stops secrets before anything is made or put, in one line naming the"
    + " entry and never a value; --cf-keyring without --cf-account, the other way round, or either of the wrong shape is refused the same way", async () => {
    const ringOf = (v) => ({ "argos-test/token": v });
    const cases = [
      ["empty", secretsRun(cfArgs, { keyring: ringOf("") }), /argos-test\/token is empty/],
      ["missing", secretsRun(cfArgs, { keyring: {} }), /argos-test\/token is empty/],
      ["whitespace", secretsRun(cfArgs, { keyring: ringOf("  ") }), /argos-test\/token is empty/],
      ["no answer", secretsRun(cfArgs, { keyring: ringOf(false) }), /argos-test\/token could not be read/],
      ["keyring alone", secretsRun(["--staging", "--cf-keyring", "argos-test/token"], { keyring: ringOf(CF_TOKEN) }), /--cf-account/],
      ["account alone", secretsRun(["--staging", "--cf-account", CF_ACCOUNT], { keyring: ringOf(CF_TOKEN) }), /--cf-keyring/],
      ["no user", secretsRun(["--staging", "--cf-keyring", "argos-test", "--cf-account", CF_ACCOUNT], { keyring: ringOf(CF_TOKEN) }), /<service>\/<user>/],
      ["bad account", secretsRun(["--staging", "--cf-keyring", "argos-test/token", "--cf-account", "not-an-account"], { keyring: ringOf(CF_TOKEN) }), /--cf-account/],
    ];
    cases.forEach(([n, r]) => process.stdout.write(show({ name: "secrets " + n, status: r.status, stdout: r.stdout, stderr: r.stderr })));
    const ok = cases.every(([, r, re]) => r.status === 2 && r.stdout === "" && /^sign  [^\n]+\n$/.test(r.stderr) && re.test(r.stderr)
      && r.puts.length === 0 && r.stderr.indexOf(CF_TOKEN) < 0);
    const early = cases.slice(0, 4).every(([, r]) => !/keyId|public/.test(r.stdout + r.stderr));
    return ok && early && sSnap() === sBefore;
  });

  await leg("sc2c without --cf-keyring the tool hands wrangler no token of its own: the puts see no CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID, and"
    + " the keyring is never read, so wrangler's own login stands", async () => {
    const noRing = secretsRun(["--staging"], { keyring: { "argos-test/token": CF_TOKEN } });
    return good.status === 0 && good.puts.concat(good.lists).every((p) => p.cf === null && p.account === null) && good.reads.length === 0
      && noRing.status === 0 && noRing.puts.concat(noRing.lists).every((p) => p.cf === null && p.account === null) && noRing.reads.length === 0;
  });

  await leg("sc2e a keyring reader named in the environment (STUDIO_KEYRING_READER) is never run: with it set to a stand-in that would hand over a"
    + " token, secrets reads the keyring only by Python's keyring, which this run cannot start, so it stops in one line naming the entry, with nothing"
    + " made or put and the stand-in never run", async () => {
    const r = secretsRun(cfArgs, { envReader: { "argos-test/token": CF_TOKEN } });
    process.stdout.write(show({ name: "secrets with a reader in the environment", status: r.status, stdout: r.stdout, stderr: r.stderr }));
    return r.status === 2 && r.stdout === "" && /argos-test\/token could not be read/.test(r.stderr) && r.reads.length === 0 && r.puts.length === 0
      && r.lists.length === 0 && r.stderr.indexOf(CF_TOKEN) < 0;
  });

  /* The test architect's E1 on S7: the hash key is kept. */
  const firstOnly = secretsRun(["--staging"], { held: "SERVICE_KEY,DELEGATION" });
  const keepRefused = secretsRun(["--staging", "--keep-hash-key"], { held: ALL });
  const listFails = secretsRun(["--staging"], { held: ALL, listFail: true });
  await leg("sc2d HASH_KEY is kept: a run on a Worker holding one puts SERVICE_KEY and DELEGATION only, says the hash key was kept and warns of nothing;"
    + " a run on a Worker holding none puts all three; --new-hash-key puts all three after a warning on stderr that every kept hash stops matching;"
    + " --keep-hash-key is refused; and a Worker wrangler cannot list stops the run with nothing put", async () => {
    [firstOnly, keepRefused, listFails].forEach((r, i) => process.stdout.write(show({ name: "secrets " + ["no hash key held", "--keep-hash-key", "list fails"][i], status: r.status, stdout: r.stdout, stderr: r.stderr })));
    const names = (r) => r.puts.map((p) => p.argv[2]).join();
    const kept = again.status === 0 && names(again) === "SERVICE_KEY,DELEGATION" && /HASH_KEY was kept/.test(again.stdout) && again.stderr.indexOf("WARNING") < 0;
    const first = good.status === 0 && names(good) === ALL && firstOnly.status === 0 && names(firstOnly) === ALL && good.stderr.indexOf("WARNING") < 0
      && firstOnly.stderr.indexOf("WARNING") < 0;
    const renewed = fresh.status === 0 && names(fresh) === ALL && fresh.stderr.indexOf(WARNING) >= 0 && /stops matching/.test(fresh.stderr);
    const refused = keepRefused.status === 2 && keepRefused.puts.length === 0 && /--new-hash-key/.test(keepRefused.stderr)
      && listFails.status === 2 && listFails.puts.length === 0 && /which secrets the Worker holds/.test(listFails.stderr) && /nothing was made or put/.test(listFails.stderr);
    process.stdout.write("       kept " + kept + ", first " + first + ", renewed " + renewed + ", refused " + refused + NL);
    return kept && first && renewed && refused;
  });

  await leg("sc1z the header's usage line and the usage refusal name the secrets command", async () => {
    const src = fs.readFileSync(TOOL, "utf8"), head = src.slice(0, src.indexOf("*/"));
    const bad = runTool(["bogus"], { cwd: LAB, pass: PASS });
    const usage = "secrets --root <root key file>";
    return head.indexOf(" *     node tools/sign.mjs " + usage) >= 0 && bad.status === 2 && bad.stderr.indexOf(usage) > 0;
  });

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "sign-check");
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + NL);
  if (asserted !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran" + NL);
    return 78;
  }
  process.stdout.write(NL + "sign-check  " + asserted + " assertion(s), " + failed + " failure(s)" + NL);
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(c => process.exit(c), e => {
  process.stderr.write(String(e && e.stack || e) + NL); process.exit(2);
});
