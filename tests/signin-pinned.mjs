/* WHAT THE PINNED DESK SIGNS AT SIGN-IN IS WHAT STUDIO'S OWN SERVICE ACCEPTS (the test architect's brief, board 1008).
 *
 *     node tests/signin-pinned.mjs        exit 0 when every check holds, 1 when any fails
 *
 * gate-kind: node
 *
 * THE CRITERION: when Studio's engine pin moves past a change in the bytes the desk signs at sign-in, or the licence service
 * changes what it verifies, this leg goes red before the pin lands. Engine fold 99 (380a2641) made the desk sign a seed line at
 * the end of its sign-in bytes while Studio's service still verified none, and staging refused a fresh desk's sign-in
 * ("signature") with no leg in either tree able to see it.
 *
 * THE DESK'S SIGNER IS READ, NEVER COPIED. The leg slices SIGNIN_DESK_LINE, signinTokenHash, signinDeskBytes and signinDeskBody
 * out of engine/pinned/shell/main.js by name at run time (main.js is an Electron file and is never loaded whole) and evaluates
 * the slice in node's vm with Buffer, node's crypto and a one-line stand-in for signinKnown (the two providers' names). A name
 * that is not found, or a slice that does not compile, is a red check naming it, never a skip.
 *
 * THE SERVICE IS STUDIO'S OWN: service/licence/core.mjs over the stand-in D1, as tests/licence-service.mjs runs it. The service
 * checks the signature before it looks at the ID token, so a body is judged on the signature alone by sending a token the
 * service does not take: "held" is any answer but "signature" and "malformed" (the token was the next thing refused), and a
 * refused signature is the answer "signature". What is outside the signature (the token's verification, the nonce, the seats)
 * is outside this leg.
 *
 *   sp1  the signer is found in the pinned file by name, and its bytes with and without a seed are read from the signer itself
 *   sp2  a renewal (no seed) signed by the pinned signer with a fresh desk key is accepted as far as the signature goes
 *   sp3  a first sign-in (with a seed) signed the same way is accepted as far as the signature goes
 *   sp4  each of those signed by another key is refused "signature"
 *   sp5  each of those with one signature byte altered, and a first sign-in with the token, t or the provider altered after
 *        signing, is refused "signature"
 *   sp6  where the signer signs a seed line: the first sign-in's body with the seed stripped, and with another seed put in, is
 *        refused "signature"; where it signs none: a body carrying a seed the signature does not cover is refused "signature"
 *   sp7  the pinned desk takes each ok answer to signin/desk carrying storeOffer as it takes it without (offerLegs, below)
 *   sp8  a pinned desk holding the store's gate takes the service's offer; NOT RUN while the pin has no storeOffered (offerLegs)
 *
 * PROVED BY MAKING IT FAIL (inline, in a scratch folder the leg makes and removes): plant desk-line changes the desk's line in a
 * scratch copy of the pinned main.js, plant service-order swaps two lines of the service's bytes in a scratch copy of
 * service/licence/requests.mjs, and plant reader-strict makes the copy's answer reader refuse an answer carrying storeOffer; each
 * run of this leg against a copy must exit non-zero with a FAIL line. ETIUDA_PLANTS=off
 * skips them with a NOT RUN line. SIGNIN_PINNED_MAIN and SIGNIN_PINNED_SERVICE name the copies for those child runs.
 *
 * Node only: no window, no Electron, no network, nothing of this machine's profile or registry.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import module from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { standInD1 } from "./d1-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "signin-pinned-legs");
const NL = "\n";
const PINNED_MAIN = process.env.SIGNIN_PINNED_MAIN || path.join(ROOT, "engine", "pinned", "shell", "main.js");
const SERVICE_DIR = process.env.SIGNIN_PINNED_SERVICE || path.join(ROOT, "service", "licence");
const CHILD = !!(process.env.SIGNIN_PINNED_MAIN || process.env.SIGNIN_PINNED_SERVICE);
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 20;

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}

/* The pinned engine's catalog-v2.js is an ES module in a CommonJS folder; the service's worker reads it by its syntax. */
module.registerHooks({
  load(url, context, next) {
    if (/\/engine\/pinned\/src\/modules\/catalog-v2\.js$/.test(url)) {
      const r = next(url, Object.assign({}, context, { format: "module" }));
      return Object.assign({}, r, { format: "module" });
    }
    return next(url, context);
  },
});

/* ---- the desk's signer, sliced from the pinned file by name -------------------------------------------------------- */

function sliceFunction(text, name) {
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex(l => l.startsWith("function " + name + "("));
  if (at < 0) throw new Error("function " + name + " is not in the pinned shell/main.js");
  if (/\}\s*$/.test(lines[at]) && lines[at].split("{").length === lines[at].split("}").length) return lines[at];
  for (let i = at + 1; i < lines.length; i++) if (lines[i] === "}") return lines.slice(at, i + 1).join(NL);
  throw new Error("function " + name + " has no closing brace at column 0 in the pinned shell/main.js");
}
function sliceConst(text, name) {
  const m = text.match(new RegExp("^const " + name + " = [^\\n]*;\\s*$", "m"));
  if (!m) throw new Error("const " + name + " is not in the pinned shell/main.js");
  return m[0];
}
function pinnedSigner(file) {
  const text = fs.readFileSync(file, "utf8");
  const src = [sliceConst(text, "SIGNIN_DESK_LINE"), sliceFunction(text, "signinTokenHash"), sliceFunction(text, "signinDeskBytes"),
    sliceFunction(text, "signinDeskBody"), "({ signinDeskBytes, signinDeskBody, SIGNIN_DESK_LINE })"].join(NL);
  const ctx = { Buffer, crypto, Number,
    signinKnown: id => (id === "microsoft" || id === "google" ? {} : null) /* the one stand-in: which provider names the desk knows */ };
  return vm.runInNewContext(src, ctx, { filename: "pinned-signin-slice.js" });
}

/* ---- keys and the service world ------------------------------------------------------------------------------------ */

const sha = b => crypto.createHash("sha256").update(b).digest("hex");
function keyFrom(privateKey) {
  const pub = crypto.createPublicKey(privateKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { pub, privateKey, der: privateKey.export({ type: "pkcs8", format: "der" }).toString("hex"),
    sign: bytes => crypto.sign(null, Buffer.from(bytes), privateKey).toString("hex") };
}
const newKey = () => keyFrom(crypto.generateKeyPairSync("ed25519").privateKey);
const T0 = Date.UTC(2026, 10, 16, 9, 0, 0), DAY = 86400000;

const W = await import(pathToFileURL(path.join(ROOT, "service", "licence", "worker.mjs")).href);
const C = await import(pathToFileURL(path.join(SERVICE_DIR, "core.mjs")).href);
const L = await import("../src/licence.mjs");
const SCHEMA = fs.readFileSync(path.join(SERVICE_DIR, "schema.sql"), "utf8");

const ROOTK = newKey(), SERVICEK = newKey();
const DELEGATION = L.createTestDelegation({ key: { id: "studio-" + sha(Buffer.from(SERVICEK.pub, "hex")).slice(0, 16), pub: SERVICEK.pub },
  may: ["licence", "relay-grant"], from: T0 - 10 * DAY, until: T0 + 300 * DAY }, ROOTK.privateKey, "etiuda-root-test");
const PROVIDERS = JSON.stringify([{ id: "microsoft", clientId: "00001111-aaaa-2222-bbbb-3333cccc4444" },
  { id: "google", clientId: "123456789012-a1b2c3d4e5f6g7h8.apps.googleusercontent.com" }]);
let ipN = 0;
function world() {
  const clock = { now: T0 }, db = standInD1(SCHEMA);
  const service = C.makeService({ rules: W.RULES, roots: [ROOTK.pub], clock: () => clock.now,
    fetch: async () => { throw new Error("no leg reaches the network"); } });
  const env = { DB: db, SERVICE_KEY: SERVICEK.der, DELEGATION: JSON.stringify(DELEGATION), HASH_KEY: crypto.randomBytes(32).toString("hex"), PROVIDERS };
  return async body => {
    const res = await service.fetch(new Request("https://licence.test/licence/v1/signin/desk", { method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113." + ((++ipN % 250) + 1) + "-" + ipN }, body: JSON.stringify(body) }), env);
    const text = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch { parsed = null; }
    return { status: res.status, reason: parsed && parsed.reason, text };
  };
}
const said = r => r.status + " " + (r.reason || r.text.slice(0, 60));
/* The signature held when the service went on to the token (which this world does not take): anything but "signature" or malformed. */
const held = r => r.reason !== "signature" && r.status !== 400;
const refused = r => r.reason === "signature";

/* ---- the legs ------------------------------------------------------------------------------------------------------ */

async function legs() {
  let S = null;
  try { S = pinnedSigner(PINNED_MAIN); } catch (e) { check(false, "sp1 the desk's signer is read from the pinned shell/main.js by name: " + e.message); return; }
  const call = world();
  const desk = newKey(), other = newKey();
  const provider = "microsoft", seed = crypto.randomBytes(32).toString("hex"), seed2 = crypto.randomBytes(32).toString("hex");
  let n = 0;
  const tok = () => "stand-in-token-" + (++n);
  const make = (k, token, s) => S.signinDeskBody(provider, token, desk.pub, s, T0, k.sign);

  /* what the signer signs: its bytes with and without a seed, as the signer itself produces them */
  const bytesOf = s => S.signinDeskBytes({ provider, tokenHash: sha("x"), desk: desk.pub, t: T0, seed: s });
  const seedLine = Buffer.compare(bytesOf(seed), bytesOf("")) !== 0;
  check(typeof S.SIGNIN_DESK_LINE === "string" && bytesOf("").toString("utf8").startsWith(S.SIGNIN_DESK_LINE + NL),
    "sp1 the desk's signer is read from the pinned shell/main.js by name, and its bytes begin with its own line");
  process.stdout.write("  note the pinned signer " + (seedLine ? "signs a seed line" : "signs no seed line") + " (read from its bytes with and without a seed)" + NL);

  const renewal = make(desk, tok(), "");
  const first = make(desk, tok(), seed);
  check(!!renewal && !("seed" in renewal), "sp1 the pinned signer makes a renewal's body with no seed");
  check(!!first && first.seed === seed, "sp1 the pinned signer makes a first sign-in's body carrying the seed");
  if (!renewal || !first) return;
  const r2 = await call(renewal);
  check(held(r2), "sp2 a renewal signed by the pinned signer is accepted by the service as far as the signature goes: " + said(r2));
  const r3 = await call(first);
  check(held(r3), "sp3 a first sign-in with a seed signed by the pinned signer is accepted as far as the signature goes: " + said(r3));

  for (const [name, s] of [["renewal", ""], ["first sign-in", seed]]) {
    const r = await call(make(other, tok(), s));
    check(refused(r), "sp4 a " + name + " signed by another key is refused \"signature\": " + said(r));
  }
  for (const [name, s] of [["renewal", ""], ["first sign-in", seed]]) {
    const b = make(desk, tok(), s);
    const flip = Object.assign({}, b, { sig: (b.sig[0] === "0" ? "1" : "0") + b.sig.slice(1) });
    const r = await call(flip);
    check(refused(r), "sp5 a " + name + " with one signature byte altered is refused \"signature\": " + said(r));
  }
  {
    const b = make(desk, tok(), seed);
    const alt = {
      "the token": Object.assign({}, b, { idToken: b.idToken + "x" }),
      "t": Object.assign({}, b, { t: b.t + 1 }),
      "the provider": Object.assign({}, b, { provider: "google" }),
    };
    for (const [what, body] of Object.entries(alt)) {
      const r = await call(body);
      check(refused(r), "sp5 a first sign-in with " + what + " altered after signing is refused \"signature\": " + said(r));
    }
  }
  const b = make(desk, tok(), seed);
  const stripped = Object.assign({}, b); delete stripped.seed;
  const swapped = Object.assign({}, b, { seed: seed2 });
  const rs = await call(stripped), rw = await call(swapped);
  if (seedLine) {
    check(refused(rs), "sp6 the pinned signer signs a seed line: the first sign-in's body with the seed stripped is refused \"signature\": " + said(rs));
    check(refused(rw), "sp6 the pinned signer signs a seed line: the body with another seed put in is refused \"signature\": " + said(rw));
  } else {
    /* No seed line in the pin's bytes: a seed in the body is outside the signature. Which way the service takes it is said, not
       judged here: refused, it reads a seed as signed (and sp3 is then the red that shows the split); past the signature, it ignores
       an unsigned seed, the residual of review 2's finding 12 that closes when both halves of the seed-signed pair land. A fresh body,
       so the answer is not the replay guard's for the one just sent. */
    const fresh = Object.assign({}, make(desk, tok(), seed), { seed: seed2 }), rf = await call(fresh);
    check(!/malformed/.test(said(rf)), "sp6 the pinned signer signs no seed line: a seed outside the signature is "
      + (refused(rf) ? "refused, so the service reads seeds as signed" : "taken past the signature, so the service ignores an unsigned seed (review 2 finding 12's residual)") + ": " + said(rf));
    check(true, "sp6 (no seed line, so no stripped-seed case: the body with no seed is the renewal)");
  }
}

/* ---- the store's offer, as the pinned desk reads it ----------------------------------------------------------------- */
/* The service says it offers a person's store by "storeOffer": true at the top level of each ok answer to signin/desk (core.mjs,
   storeOffer; the desk's gate, engine e6648abe, reads it in signinAnswerBody as j.storeOffer === true). The answers are the record of
   what the service sends, tests/fixtures/signin-answers.json, which tests/licence-service.mjs s110a and s110b hold to core.mjs; each ok
   signin/desk case is read by the pinned desk's own signinAnswerBody, sliced by name. Its helpers for a certificate and its doors
   (signinCertOk, signinDoorsOk, signinDoorsSigned) are stood in, the same stand-in on both reads of a case, so two reads differ by the
   field alone; a pin that has signinManagedOf has it sliced too.
     sp7  a desk that does not know the field (or does) takes each ok answer carrying it as it takes the same answer without it, the
          field apart: the answer is never refused or read differently for it
     sp8  a pinned desk that holds the gate (its shell/main.js has storeOffered) takes this service's offer: every ok case of the record
          carries storeOffer true, and the pinned reader reads it as offered and the same answer without it as not; NOT RUN, and counted
          so, while the pinned shell/main.js has no storeOffered, so the pin's move to the gate turns it on by itself */
const ANSWERS = process.env.SIGNIN_PINNED_ANSWERS || path.join(ROOT, "tests", "fixtures", "signin-answers.json");
function pinnedReader(file) {
  const text = fs.readFileSync(file, "utf8");
  const parts = [sliceConst(text, "SIGNIN_CODE"), sliceFunction(text, "signinAnswerBody")];
  if (/^function signinManagedOf\(/m.test(text)) parts.push(sliceFunction(text, "signinManagedOf"));
  /* From engine fold 123 the reader names the account's holding and trials (signinHoldingOf, signinTrialsOf, signinWordsOf: the desk's licence line). */
  if (/^const SIGNIN_HOLDING_ON = /m.test(text)) parts.push(sliceConst(text, "SIGNIN_HOLDING_ON"));
  for (const fn of ["signinHoldingOf", "signinTrialsOf", "signinWordsOf"])
    if (new RegExp("^function " + fn + "\\(", "m").test(text)) parts.push(sliceFunction(text, fn));
  /* From the pin that reads the leads a Join waits on and what the person pays or has held (engine d93cacaf, board 1020), and the
     invitations waiting for the person (engine fold 131, board 1017: signinInvitedOf, signinInvitedWords): their helpers and constants,
     sliced where the pin has them (a constant's line may carry a trailing plant mark). */
  for (const c of ["SIGNIN_ASKED_MAX", "signinAskedWords", "SIGNIN_INVITED_MAX", "signinInvitedWords", "SIGNIN_PAY_PROVIDERS", "SIGNIN_HELD_KINDS", "SIGNIN_PORTAL"]) {
    const m = text.match(new RegExp("^const " + c + " = [^\\n]*;(?:\\s*/\\*[^\\n]*\\*/)?\\s*$", "m"));
    if (m) parts.push(m[0]);
  }
  for (const fn of ["signinAskedOf", "signinAskedWords", "signinInvitedOf", "signinBuyOf", "signinBuyKept", "signinHeldOk", "signinPaysOk"])
    if (new RegExp("^function " + fn + "\\(", "m").test(text)) parts.push(sliceFunction(text, fn));
  parts.push("({ signinAnswerBody })");
  const ctx = { Buffer, JSON, String, Array, Object,
    /* the stand-ins: a certificate taken, the doors as given, none signed */
    signinCertOk: () => true, signinDoorsOk: d => (Array.isArray(d) ? d : []), signinDoorsSigned: () => false };
  return { read: vm.runInNewContext(parts.join(NL), ctx, { filename: "pinned-answer-slice.js" }).signinAnswerBody,
    gate: /^function storeOffered\(/m.test(text) };
}
function offerLegs() {
  let R = null, record = null;
  try { R = pinnedReader(PINNED_MAIN); } catch (e) {
    check(false, "sp7 the desk's answer reader is read from the pinned shell/main.js by name: " + e.message);
    check(false, "sp8 (the reader was not read)");
    return;
  }
  try { record = JSON.parse(fs.readFileSync(ANSWERS, "utf8")); } catch { record = null; }
  const oks = (record && Array.isArray(record.cases) ? record.cases : [])
    .filter(c => c.route === "signin/desk" && c.status === 200 && c.body && c.body.ok === true);
  const res = b => ({ status: 200, bytes: Buffer.from(JSON.stringify(b), "utf8") });
  const deskOf = b => (b.certificate && typeof b.certificate.desk === "string" ? b.certificate.desk : "0".repeat(64));
  const without = b => { const x = Object.assign({}, b); delete x.storeOffer; return x; };
  const apart = a => { const x = Object.assign({}, a); delete x.storeOffer; return JSON.stringify(x); };
  const rows = oks.map(c => {
    const bare = without(c.body), offered = Object.assign({}, bare, { storeOffer: true });
    const a = R.read(res(bare), deskOf(bare), null), b = R.read(res(offered), deskOf(bare), null);
    return { case: c.case, same: !!a && a.ok === true && !!b && b.ok === true && apart(a) === apart(b), a, b, recorded: c.body.storeOffer };
  });
  const differ = rows.filter(r => !r.same).map(r => r.case);
  check(oks.length >= 10 && differ.length === 0,
    "sp7 the pinned desk (" + (R.gate ? "holding the store's gate" : "which does not know storeOffer") + ") takes each of the record's " + oks.length
    + " ok signin/desk answers carrying storeOffer true as it takes the same answer without it, the field apart"
    + (differ.length ? "; read differently or refused: " + differ.join(" ") : ""));
  if (!R.gate) {
    process.stdout.write("  NOT RUN  sp8 a pinned desk holding the store's gate takes this service's offer: the pinned shell/main.js has no storeOffered"
      + " (the gate is engine e6648abe's), so the pin's move to it runs this" + NL);
    skipped++;
    return;
  }
  const unoffered = rows.filter(r => r.recorded !== true).map(r => r.case);
  const misread = rows.filter(r => !(r.b && r.b.storeOffer === true && r.a && r.a.storeOffer !== true)).map(r => r.case);
  check(oks.length >= 10 && unoffered.length === 0 && misread.length === 0,
    "sp8 the pinned desk holds the store's gate and takes this service's offer: each of the record's " + oks.length + " ok signin/desk answers"
    + " carries storeOffer true and is read as offered, and without it as not"
    + (unoffered.length ? "; recorded without the offer: " + unoffered.join(" ") : "") + (misread.length ? "; read otherwise: " + misread.join(" ") : ""));
}

/* ---- the plants, inline --------------------------------------------------------------------------------------------- */

function plant(name, rel, base, from, to, envVar) {
  const dir = path.join(SCRATCH, "plant-" + name);
  fs.mkdirSync(dir, { recursive: true });
  const text = fs.readFileSync(base, "utf8");
  const n = text.split(from).length - 1;
  if (n !== 1) { check(false, "plant " + name + ": the text it changes is in " + path.basename(base) + " " + n + " times, not once"); return; }
  const file = path.join(dir, rel);
  fs.writeFileSync(file, text.split(from).join(to));
  const env = Object.assign({}, process.env, { ETIUDA_PLANTS: "off" });
  if (envVar === "SIGNIN_PINNED_SERVICE") {
    /* Every module of the service beside the planted one: core.mjs imports pay*.mjs and erase.mjs since the held line. */
    for (const f of fs.readdirSync(SERVICE_DIR).filter(n => /\.(mjs|sql)$/.test(n) && n !== rel)) fs.copyFileSync(path.join(SERVICE_DIR, f), path.join(dir, f));
    env[envVar] = dir;
  } else env[envVar] = file;
  const run = spawnSync(process.execPath, [SELF], { cwd: ROOT, encoding: "utf8", env, timeout: 120000 });
  const out = String(run.stdout || "") + String(run.stderr || "");
  const red = run.status !== 0 && /FAIL sp\d/.test(out);
  check(red, "plant " + name + " turns this leg red in a scratch copy: status=" + run.status + " fails=" + (out.match(/FAIL sp\d/g) || []).length);
}

async function main() {
  if (!CHILD) clearScratch(SCRATCH);
  await legs();
  offerLegs();
  if (!CHILD) {
    const mine = () => [sha(fs.readFileSync(PINNED_MAIN)), sha(fs.readFileSync(path.join(SERVICE_DIR, "requests.mjs")))].join();
    const before = mine();
    if (PLANTS_OFF) {
      process.stdout.write("  NOT RUN  plant desk-line (ETIUDA_PLANTS=off)" + NL + "  NOT RUN  plant service-order (ETIUDA_PLANTS=off)" + NL
        + "  NOT RUN  plant reader-strict (ETIUDA_PLANTS=off)" + NL
        + "  NOT RUN  the pinned main.js and requests.mjs are unchanged after the plants (ETIUDA_PLANTS=off)" + NL);
      skipped += 4;
    } else {
      plant("desk-line", "main.js", PINNED_MAIN, 'const SIGNIN_DESK_LINE = "etiuda-licence-signin-desk";', 'const SIGNIN_DESK_LINE = "etiuda-licence-signin-desk-2";', "SIGNIN_PINNED_MAIN");
      plant("service-order", "requests.mjs", path.join(SERVICE_DIR, "requests.mjs"), "lines(DOMAINS.signinDesk, [provider, tokenHash, desk, t].concat(seedLine(seed)));", "lines(DOMAINS.signinDesk, [provider, desk, tokenHash, t].concat(seedLine(seed)));", "SIGNIN_PINNED_SERVICE");
      /* A desk reader that refuses an answer for carrying the field: sp7 must go red. */
      plant("reader-strict", "main.js", PINNED_MAIN, 'if (!j || typeof j !== "object" || Array.isArray(j)) return { ok: false, reason: "unreached" };',
        'if (!j || typeof j !== "object" || Array.isArray(j) || "storeOffer" in j) return { ok: false, reason: "unreached" };', "SIGNIN_PINNED_MAIN");
      check(before === mine(), "the pinned main.js and the service's requests.mjs are byte for byte as before the plants");
    }
  }
  if (!CHILD) dropScratch(SCRATCH, "signin-pinned");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
  if (!CHILD && asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
    return 78;
  }
  process.stdout.write(NL + "signin-pinned  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
  return Math.min(failed, 77);
}
main().then(c => process.exit(c), e => { process.stderr.write(String(e && e.stack || e) + NL); process.exit(2); });
