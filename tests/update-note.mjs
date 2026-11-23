/* THE UPDATE OFFER, STUDIO'S HALF (board 991): node tests/update-note.mjs
 *
 * Max's ruling of 2026-10-06 22:07: "Each program reads a small signed version note (form B) from etiuda.dev and offers the
 * update itself". The note's format is the office's file, which the
 * desk verifies against too; src/update-note.mjs reads it, src/wire.cjs fetches it, shell/main.js keeps it and ui/app.js shows
 * it where the product designer placed it (2026-11-11 17:35), in the copywriter's words of that day.
 *
 * Every key here is a stand-in each run makes, passed in where the root's public half is read; nothing is fetched, no window
 * opens and Studio is not started. Electron's net is a stand-in that records what it was asked.
 *
 *   un1  a note the stand-in root signed is taken and offered: the version, the release day, its page, the strip shown
 *   un2  each of these is refused, its reason named, and shows nothing: another key's signature, another app's note, a page
 *        not https or not on etiuda.dev (another host, a longer host, a port, a user, a query, a fragment, a dot segment, a
 *        percent sign, an empty segment, past 200 characters), a body over 1024 bytes (the same note at 1024 is taken), a
 *        byte outside printable ASCII, a body that is not JSON or not an object, a key more or less, and every field out of
 *        its bounds
 *   un3  the serial never goes back: the same note again changes nothing; a lower serial, or the same serial with another
 *        field, is refused and the kept note stands; a higher one is taken
 *   un4  a kept note is read again with its signature: one edited by hand is dropped, and nothing is offered
 *   un5  Later puts the strip off for seven days, to the millisecond; a newer version shows at once; the status bar's mark
 *        and About ignore the put-off
 *   un6  the running version equal to the offered one, or above it, offers nothing, and About says it is the newest
 *   un7  About says it could not check when the latest look failed and no note is kept: the service unreached, a status not
 *        200, a refused note; a kept note offering stands through a failed look
 *   un8  no other signed document replays as a note: the root's signature over a revoked keys' list, a delegation and a
 *        licence, carried into a note's fields, is refused; the signed bytes are the format file's seven lines exactly
 *   un9  the release page opened is only ever the kept note's, admitted again: any address but https://etiuda.dev/... is ""
 *   un10 src/wire.cjs asks one GET of https://etiuda.dev/licence/v1/note/studio, with no body and no redirect followed, and a
 *        body over 1024 bytes throws
 *   un11 the offline command signs a note with a stand-in root that the reader takes under that root; it refuses a field out
 *        of bounds before asking for the passphrase, and a note over a newer or another app's note
 *   un12 the shell looks a minute in and then hourly beside the licence check, clears both timers wherever the licence's
 *        are cleared, keeps the note beside the store and opens only releasePage's answer; the preload hands four doors
 *   un13 the page: the Overview strip above the number cards with See what's new and Later, in English and Polish; the
 *        status bar's mark beside the version; About's rows; Later and See what's new call the shell, with no address;
 *        with no answer from the shell, nothing anywhere
 *   un14 plants: each guarding line, changed in a scratch copy, turns its leg red (ETIUDA_PLANTS=off skips them)
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { plantText } from "./plant-copy.mjs";
import { loadPage } from "./page-stand-in.mjs";
import * as L from "../src/licence.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "update-note-legs");
const require = createRequire(import.meta.url);
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 52;

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }

const DAY = 24 * 3600 * 1000, NOW = Date.UTC(2026, 10, 11, 18, 0, 0);
const pair = () => {
  const k = crypto.generateKeyPairSync("ed25519");
  return { privateKey: k.privateKey, pub: k.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex") };
};
const ROOTK = pair(), OTHER = pair();
const BASE = { app: "studio", serial: 5, version: "0.2.0", released: "2026-12-01", url: "https://etiuda.dev/studio/0.2.0/" };

/** The legs over one copy of src/update-note.mjs (the real one, or a planted copy), told to `ck`. */
async function legs(U, ck) {
  const leg = async (id, fn) => { try { await fn(); } catch (e) { ck(false, id + " threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e)); } };
  const note = (f, key) => U.makeNote(Object.assign({}, BASE, f || {}), (key || ROOTK).privateKey, "etiuda-root");
  /* A note's text with any field set to anything, re-signed by `key` over the line form whatever the field holds, so a refusal
     is the field's and never the signature's. */
  const forged = (edit, key) => {
    const n = JSON.parse(JSON.stringify(note()));
    edit(n);
    try { n.sig.value = crypto.sign(null, U.noteBytes(n), (key || ROOTK).privateKey).toString("hex"); } catch { /* left as it was */ }
    return JSON.stringify(n);
  };
  const read = (body, app) => U.readNote(body, app || "studio", ROOTK.pub);
  const lookWith = (state, answer, running) => U.look({ app: "studio", root: ROOTK.pub, now: NOW, state,
    running,
    get: async () => { if (answer instanceof Error) throw answer; return answer; } });
  const ok200 = (text) => ({ status: 200, bytes: Buffer.from(text, "utf8") });

  await leg("un1", async () => {
    const got = await lookWith({}, ok200(JSON.stringify(note())));
    const offer = U.offerOf(got.state, "0.1.0", NOW, "studio", ROOTK.pub);
    ck(got.why === null && offer && offer.version === "0.2.0" && offer.released === "2026-12-01" && offer.url === BASE.url && offer.strip === true,
      "un1 a note the stand-in root signed is taken and offered, the strip shown: " + JSON.stringify(offer));
  });

  await leg("un2", async () => {
    const cases = [
      ["another key", JSON.stringify(note({}, OTHER)), "signature"],
      ["another app's note", JSON.stringify(note({ app: "desk" })), "other-app"],
      ["http", forged((n) => { n.url = "http://etiuda.dev/studio/"; }), "url"],
      ["another host", forged((n) => { n.url = "https://example.com/studio/"; }), "url"],
      ["a longer host", forged((n) => { n.url = "https://etiuda.dev.example.com/studio/"; }), "url"],
      ["a port", forged((n) => { n.url = "https://etiuda.dev:8443/studio/"; }), "url"],
      ["a user", forged((n) => { n.url = "https://me@etiuda.dev/studio/"; }), "url"],
      ["a query", forged((n) => { n.url = "https://etiuda.dev/studio/?x=1"; }), "url"],
      ["a fragment", forged((n) => { n.url = "https://etiuda.dev/studio/#x"; }), "url"],
      ["a dot segment", forged((n) => { n.url = "https://etiuda.dev/studio/../x"; }), "url"],
      ["a percent sign", forged((n) => { n.url = "https://etiuda.dev/%2e%2e/x"; }), "url"],
      ["an empty segment", forged((n) => { n.url = "https://etiuda.dev//x"; }), "url"],
      ["the bare host", forged((n) => { n.url = "https://etiuda.dev/"; }), "url"],
      ["past 200 characters", forged((n) => { n.url = "https://etiuda.dev/" + ["a".repeat(60), "b".repeat(60), "c".repeat(60)].join("/"); }), "url"],
      ["not JSON", "{\"kind\":", "json"],
      ["an array", "[1,2]", "not-object"],
      ["a key more", forged((n) => { n.extra = 1; }), "fields"],
      ["a key less", forged((n) => { delete n.released; }), "fields"],
      ["a byte outside ASCII", JSON.stringify(note()).replace("etiuda-root", "etiuda-röot"), "bytes"],
      ["a BOM", "﻿" + JSON.stringify(note()), "bytes"],
      ["another kind", forged((n) => { n.kind = "etiuda-revocations"; }), "kind"],
      ["format 2", forged((n) => { n.format = 2; }), "format"],
      ["app linux", forged((n) => { n.app = "linux"; }), "app"],
      ["serial 0", forged((n) => { n.serial = 0; }), "serial"],
      ["serial past 999999999", forged((n) => { n.serial = 1000000000; }), "serial"],
      ["serial 1.5", forged((n) => { n.serial = 1.5; }), "serial"],
      ["serial as text", forged((n) => { n.serial = "5"; }), "serial"],
      ["version 01.0.0", forged((n) => { n.version = "01.0.0"; }), "version"],
      ["version 1.0", forged((n) => { n.version = "1.0"; }), "version"],
      ["version 1.0.0-beta", forged((n) => { n.version = "1.0.0-beta"; }), "version"],
      ["version 1000.0.0", forged((n) => { n.version = "1000.0.0"; }), "version"],
      ["released 2026-02-30", forged((n) => { n.released = "2026-02-30"; }), "released"],
      ["released 2019-12-31", forged((n) => { n.released = "2019-12-31"; }), "released"],
      ["sig alg Ed448", forged((n) => { n.sig.alg = "ed448"; }), "sig-shape"],
      ["sig keyId upper case", forged((n) => { n.sig.keyId = "Etiuda-Root"; }), "sig-shape"],
      ["sig with a key more", forged((n) => { n.sig.extra = 1; }), "sig-shape"],
      ["sig value short", JSON.stringify(Object.assign(note(), { sig: { alg: "ed25519", keyId: "etiuda-root", value: "ab" } })), "sig-shape"],
    ];
    const off = [];
    for (const [what, body, why] of cases) {
      const r = read(body);
      const got = await lookWith({}, ok200(body));
      const shows = U.offerOf(got.state, "0.1.0", NOW, "studio", ROOTK.pub);
      if (r.ok || r.why !== why || shows || got.state.note) off.push(what + " (" + (r.ok ? "taken" : r.why) + (shows ? ", offered" : "") + ")");
    }
    ck(off.length === 0, "un2a each of " + cases.length + " notes out of bounds or not the root's is refused for its own reason and shows nothing"
      + (off.length ? "; OFF: " + off.join(", ") : ""));
    const at = (n) => { const t = JSON.stringify(note()); return t + " ".repeat(n - Buffer.byteLength(t)); };
    const at1024 = read(at(1024)), at1025 = read(at(1025));
    ck(at1024.ok === true && at1025.ok === false && at1025.why === "size",
      "un2b the same note padded to 1024 bytes is taken and to 1025 refused as too large: " + at1024.ok + " " + at1025.why);
  });

  await leg("un3", async () => {
    const kept = (await lookWith({}, ok200(JSON.stringify(note())))).state;
    const same = await lookWith(kept, ok200(JSON.stringify(note())));
    const lower = await lookWith(kept, ok200(JSON.stringify(note({ serial: 4, version: "0.9.0" }))));
    const conflict = await lookWith(kept, ok200(JSON.stringify(note({ version: "0.3.0" }))));
    const higher = await lookWith(kept, ok200(JSON.stringify(note({ serial: 6, version: "0.1.5" }))));
    const v = (s) => (s.note ? s.note.serial + "/" + s.note.version : "none");
    ck(same.why === null && v(same.state) === "5/0.2.0", "un3a the same note again changes nothing: " + same.why + " " + v(same.state));
    ck(lower.why === "older" && v(lower.state) === "5/0.2.0" && U.offerOf(lower.state, "0.1.0", NOW, "studio", ROOTK.pub).version === "0.2.0",
      "un3b a lower serial is refused, even offering a newer version, and the kept note's offer stands: " + lower.why + " " + v(lower.state));
    ck(conflict.why === "conflict" && v(conflict.state) === "5/0.2.0", "un3c the same serial with another field is refused and the kept note stands: " + conflict.why);
    ck(higher.why === null && v(higher.state) === "6/0.1.5" && U.offerOf(higher.state, "0.1.0", NOW, "studio", ROOTK.pub).version === "0.1.5",
      "un3d a higher serial is taken whatever version it names, so a withdrawn release can be withdrawn: " + v(higher.state));
    const fresh = await lookWith({}, ok200(JSON.stringify(note({ serial: 1 }))));
    ck(fresh.why === null && v(fresh.state) === "1/0.2.0", "un3e with nothing kept, any serial is taken");
  });

  await leg("un4", async () => {
    const kept = (await lookWith({}, ok200(JSON.stringify(note())))).state;
    const edited = JSON.parse(JSON.stringify(kept));
    edited.note.version = "9.9.9";
    const bad = U.keptOf(edited, "studio", ROOTK.pub);
    ck(bad.note === null && U.offerOf(edited, "0.1.0", NOW, "studio", ROOTK.pub) === null && U.keptOf(kept, "studio", ROOTK.pub).note !== null,
      "un4 a kept note edited by hand is dropped and nothing is offered; the note as kept still reads");
  });

  await leg("un5", async () => {
    const kept = (await lookWith({}, ok200(JSON.stringify(note())))).state;
    const later = U.putOff(kept, "0.1.0", NOW, "studio", ROOTK.pub);
    const at = (t, s, run) => U.offerOf(s || later, run || "0.1.0", t, "studio", ROOTK.pub);
    ck(later.putOff && later.putOff.version === "0.2.0" && later.putOff.until === NOW + 7 * DAY && U.PUT_OFF_MS === 7 * DAY,
      "un5a Later keeps the offered version and seven days from now: " + JSON.stringify(later.putOff));
    ck(at(NOW).strip === false && at(NOW + 7 * DAY - 1).strip === false && at(NOW + 7 * DAY).strip === true,
      "un5b the strip is put off until the seventh day, to the millisecond, and back at it");
    ck(at(NOW + DAY) && at(NOW + DAY).version === "0.2.0" && U.aboutOf(later, "0.1.0", NOW + DAY, "studio", ROOTK.pub).said === "offer",
      "un5c while put off, the offer still stands for the status bar's mark and About");
    const newer = (await lookWith(later, ok200(JSON.stringify(note({ serial: 6, version: "0.3.0" }))))).state;
    ck(at(NOW + DAY, newer).strip === true && at(NOW + DAY, newer).version === "0.3.0",
      "un5d a still newer version shows at once, through the put-off of the one before");
  });

  await leg("un6", async () => {
    const kept = (await lookWith({}, ok200(JSON.stringify(note())))).state;
    ck(U.offerOf(kept, "0.2.0", NOW, "studio", ROOTK.pub) === null && U.offerOf(kept, "0.10.0", NOW, "studio", ROOTK.pub) === null
      && U.offerOf(kept, "0.1.9", NOW, "studio", ROOTK.pub) !== null && U.aboutOf(kept, "0.2.0", NOW, "studio", ROOTK.pub).said === "newest",
      "un6 the running version equal to the offered one, or above it by number and not by text (0.10.0), offers nothing, and About says the newest");
  });

  await leg("un7", async () => {
    const unreached = await lookWith({}, new Error("down"));
    const notThere = await lookWith({}, { status: 404, bytes: Buffer.alloc(0) });
    const refused = await lookWith({}, ok200(JSON.stringify(note({}, OTHER))));
    const said = (g) => U.aboutOf(g.state, "0.1.0", NOW, "studio", ROOTK.pub).said;
    ck(unreached.why === "unreached" && notThere.why === "status" && refused.why === "signature"
      && [unreached, notThere, refused].every((g) => said(g) === "unchecked" && U.offerOf(g.state, "0.1.0", NOW, "studio", ROOTK.pub) === null),
      "un7a the service unreached, a status not 200 and a refused note: nothing offered, and About says it could not check");
    const kept = (await lookWith({}, ok200(JSON.stringify(note())))).state;
    const after = await lookWith(kept, new Error("down"));
    ck(U.aboutOf(after.state, "0.1.0", NOW, "studio", ROOTK.pub).said === "offer" && after.state.note.serial === 5,
      "un7b a kept note's offer stands through a failed look");
    const older = await lookWith(kept, ok200(JSON.stringify(note({ serial: 4, version: "0.1.5" }))), "0.1.0");
    ck(older.why === "older" && older.state.looked && older.state.looked.read === false && older.state.note.serial === 5,
      "un7c an older genuine note after a newer kept one is a failed look");
    const below = await lookWith({}, ok200(JSON.stringify(note({ serial: 1, version: "0.1.0" }))), "0.2.0");
    const again = await lookWith(below.state, ok200(JSON.stringify(note({ serial: 1, version: "0.1.0" }))), "0.2.0");
    const saidBelow = U.aboutOf(below.state, "0.2.0", NOW, "studio", ROOTK.pub).said;
    const saidAgain = U.aboutOf(again.state, "0.2.0", NOW, "studio", ROOTK.pub).said;
    ck(below.state.looked && below.state.looked.read === false && saidBelow === "unchecked"
      && again.state.looked && again.state.looked.read === false && saidAgain === "unchecked",
      "un7d with nothing kept, a note below the running version is a failed look, and so is the same note looked at again once kept");
    /* un7f: with the running version passed, as the shell always passes it, a look that read no note (down, 404, refused)
       answers a failed look and never throws; the production route answers 404 until it is deployed. */
    let threw = "";
    const tries = [];
    for (const answer of [new Error("down"), { status: 404, bytes: Buffer.alloc(0) }, ok200(JSON.stringify(note({}, OTHER)))]) {
      try { tries.push(await lookWith({}, answer, "0.1.0")); } catch (e) { threw = String(e && e.message || e); }
    }
    ck(!threw && tries.length === 3 && tries.every((g) => g.state.looked && g.state.looked.read === false),
      "un7f a look with the running version that read no note (down, 404, refused) is a failed look and never throws" + (threw ? ": " + threw : ""));
    const newer = await lookWith({}, ok200(JSON.stringify(note({ serial: 2, version: "0.2.0" }))), "0.1.0");
    const offNewer = U.offerOf(newer.state, "0.1.0", NOW, "studio", ROOTK.pub);
    const saidNewer = U.aboutOf(newer.state, "0.1.0", NOW, "studio", ROOTK.pub).said;
    ck(newer.why === null && newer.state.looked && newer.state.looked.read === true && offNewer && offNewer.version === "0.2.0" && saidNewer === "offer",
      "un7e the control: a newer note is a successful look and is offered");
  });

  await leg("un8", async () => {
    const lines = Buffer.from("etiuda-update-note\n1\nstudio\n5\n0.2.0\n2026-12-01\nhttps://etiuda.dev/studio/0.2.0/", "utf8");
    ck(U.noteBytes(note()).equals(lines), "un8a the signed bytes are the format file's seven lines, the note's own line first");
    const rev = L.createTestRevocations({ serial: 5, keys: [OTHER.pub] }, ROOTK.privateKey, "etiuda-root");
    const del = L.createTestDelegation({ key: { id: "svc-1", pub: OTHER.pub }, may: ["licence"], from: NOW, until: NOW + DAY },
      ROOTK.privateKey, "etiuda-root");
    const lic = await L.createTestLicence({ org: "Kappa Tools", seats: 1, updatesUntil: "2027-11-11" }, ROOTK.privateKey, "etiuda-root");
    const replayed = [rev, del, lic].map((d) => { const n = JSON.parse(JSON.stringify(note())); n.sig.value = d.sig.value; return read(JSON.stringify(n)); });
    ck(replayed.every((r) => !r.ok && r.why === "signature"),
      "un8b the root's signature over a revoked keys' list, a delegation and a licence, carried into a note, is refused: "
      + replayed.map((r) => r.why).join(" "));
  });

  await leg("un9", async () => {
    const bad = ["https://example.com/x", "http://etiuda.dev/x", "https://etiuda.dev/x?y", "javascript:alert(1)", "", null];
    ck(U.releasePage({ url: BASE.url }) === BASE.url && bad.every((u) => U.releasePage({ url: u }) === "") && U.releasePage(null) === "",
      "un9 the release page is the offer's own https://etiuda.dev/ address, and anything else is nothing to open");
  });
}

/* ---- un10: the one GET, through a stand-in of electron's net --------------------------------------------------------- */
async function wireLegs(at, ck) {
  const Module = require("node:module"), load = Module._load, seen = [];
  let answer = Buffer.from("{}");
  const electron = { net: { fetch: async (url, init) => { seen.push({ url: String(url), init }); return { status: 200, headers: { get: () => null },
    body: new ReadableStream({ start(c) { c.enqueue(new Uint8Array(answer)); c.close(); } }) }; } } };
  Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
  const was = process.env.ETIUDA_LICENCE_ORIGIN;
  delete process.env.ETIUDA_LICENCE_ORIGIN;
  try {
    delete require.cache[require.resolve(at)];
    const wire = require(at);
    const got = await wire.licenceNote();
    const one = seen[0] || { init: {} };
    ck(seen.length === 1 && one.url === "https://etiuda.dev/licence/v1/note/studio" && one.init.method === "GET"
      && one.init.body === undefined && one.init.redirect === "error" && one.init.cache === "no-store" && got.status === 200,
      "un10a one GET of https://etiuda.dev/licence/v1/note/studio, no body, no redirect followed, nothing cached: " + JSON.stringify(seen.map((s) => s.url)));
    answer = Buffer.alloc(1025, 0x20);
    let threw = "";
    try { await wire.licenceNote(); } catch (e) { threw = String(e && e.message); }
    answer = Buffer.alloc(1024, 0x20);
    const full = await wire.licenceNote();
    ck(/more than 1024 bytes/.test(threw) && full.bytes.length === 1024 && wire.NOTE_MAX === 1024,
      "un10b an answer over 1024 bytes throws and one of 1024 is read: " + JSON.stringify(threw));
  } finally {
    Module._load = load;
    try { delete require.cache[require.resolve(at)]; } catch { /* already gone */ }
    if (was !== undefined) process.env.ETIUDA_LICENCE_ORIGIN = was;
  }
}

/* ---- un11: the offline command, with a stand-in root in scratch ------------------------------------------------------ */
function signLegs(U, ck) {
  const dir = path.join(SCRATCH, "sign");
  fs.mkdirSync(dir, { recursive: true });
  const env = Object.assign({}, process.env, { STUDIO_KEY_PASSPHRASE: "a stand-in passphrase for leg un11" });
  const run = (args, e) => spawnSync(process.execPath, [path.join(ROOT, "tools", "sign.mjs")].concat(args), { cwd: ROOT, env: e || env, encoding: "utf8", timeout: 60000 });
  const root = path.join(dir, "root.json"), out = path.join(dir, "note.json");
  const made = run(["make", "--out", root, "--key-id", "etiuda-root"]);
  const pub = JSON.parse(fs.readFileSync(root, "utf8")).public;
  const args = (f) => ["note", "--root", root, "--app", f.app || "studio", "--serial", String(f.serial || 3), "--version", f.version || "0.2.0",
    "--released", f.released || "2026-12-01", "--url", f.url || "https://etiuda.dev/studio/0.2.0/", "--out", f.out || out];
  const signed = run(args({}));
  const back = fs.existsSync(out) ? U.readNote(fs.readFileSync(out), "studio", pub) : { ok: false, why: "no file" };
  ck(made.status === 0 && signed.status === 0 && back.ok && back.note.serial === 3 && back.note.version === "0.2.0"
    && /wrangler secret put NOTE_STUDIO/.test(signed.stdout) && signed.stdout.indexOf(env.STUDIO_KEY_PASSPHRASE) < 0,
    "un11a the command signs a note the reader takes under the stand-in root, and says how to put it: " + signed.status + " " + back.why);
  const noPass = Object.assign({}, env); delete noPass.STUDIO_KEY_PASSPHRASE;
  const early = run(args({ released: "2026-02-30", out: path.join(dir, "n2.json") }), noPass);
  const http = run(args({ url: "http://etiuda.dev/x", out: path.join(dir, "n3.json") }));
  ck(early.status === 2 && /release day/.test(early.stderr) && http.status === 2 && !fs.existsSync(path.join(dir, "n2.json")) && !fs.existsSync(path.join(dir, "n3.json")),
    "un11b a field out of bounds is refused before the passphrase is asked, and nothing is written: " + early.stderr.trim().slice(0, 80));
  const before = fs.readFileSync(out, "utf8");
  const older = run(args({ serial: 2 })), other = run(args({ app: "desk", serial: 9 })), newer = run(args({ serial: 4 }));
  ck(older.status === 2 && other.status === 2 && newer.status === 0 && before !== fs.readFileSync(out, "utf8")
    && U.readNote(fs.readFileSync(out), "studio", pub).note.serial === 4,
    "un11c a note replaces only an older one for the same app: a lower serial and another app's are refused, a higher one replaces it");
  const padFile = path.join(dir, "pad.mjs");
  fs.writeFileSync(padFile, [
    'const orig = JSON.stringify;',
    'JSON.stringify = function (val) {',
    '  const s = orig.apply(this, arguments);',
    '  if (val && typeof val === "object" && val.kind === "etiuda-update-note" && process.env.PAD_TO) {',
    '    const n = Number(process.env.PAD_TO);',
    '    if (s.length < n) return s + " ".repeat(n - s.length);',
    '  }',
    '  return s;',
    '};',
  ].join("\n"));
  const out1024 = path.join(dir, "note1024.json"), out1023 = path.join(dir, "note1023.json");
  const runPad = (target, outFile) => run(args({ out: outFile, serial: 5 }), Object.assign({}, env, {
    PAD_TO: String(target),
    NODE_OPTIONS: "--import " + pathToFileURL(padFile).href,
  }));
  const at1024 = runPad(1024, out1024);
  const at1023 = runPad(1023, out1023);
  const back1023 = fs.existsSync(out1023) ? U.readNote(fs.readFileSync(out1023), "studio", pub) : { ok: false, why: "no file" };
  ck(at1024.status === 2 && !fs.existsSync(out1024) && at1023.status === 0 && fs.existsSync(out1023) && back1023.ok,
    "un11d a note whose JSON is exactly 1024 bytes is refused by the signing command before anything is written; one of 1023 is written, and the written file passes the reader");
}

/* ---- un12: the shell and the preload, read as text ------------------------------------------------------------------- */
function shellLegs(ck) {
  const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const pre = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  const count = (t, s) => t.split(s).length - 1;
  ck(/const NOTE_FIRST_MS = 60000;/.test(main) && /const NOTE_TICK_MS = 3600000;/.test(main) && /armLicenceCheck\(\);\n\s*armNoteCheck\(\);/.test(main),
    "un12a the shell looks a minute in and then hourly, armed beside the licence check");
  ck(count(main, "clearArmed(licenceTick, clearInterval); licenceTick = null;") === count(main, "clearArmed(noteTick, clearInterval); noteTick = null;")
    && count(main, "clearArmed(noteFirst, clearTimeout); noteFirst = null;") === 3,
    "un12b both note timers are cleared wherever the licence's are (quit and both resets)");
  ck(/path\.join\(app\.getPath\("userData"\), "update-note\.json"\)/.test(main) && count(main, "shell.openExternal(page)") === 1
    && /const page = U\.releasePage\(U\.offerOf\(readUpdateState\(\)/.test(main) && /get: \(\) => wire\.licenceNote\(\)/.test(main),
    "un12c the note is kept beside the store, fetched by wire.cjs's one GET, and the one page opened is releasePage's answer");
  ck(/update: \(\) => ipcRenderer\.invoke\("studio:update"\)/.test(pre) && /updateLater: \(\) => ipcRenderer\.invoke\("studio:update-later"\)/.test(pre)
    && /updateOpen: \(\) => ipcRenderer\.send\("studio:update-open"\)/.test(pre) && /onUpdate: \(fn\) => ipcRenderer\.on\("studio:update-looked", \(_e, v\) => fn\(v\)\)/.test(pre),
    "un12d the preload hands the page what stands, Later, the page by name with no address, and the shell's word that a look ended");
  /* un12e: machine policy turns the look off (StudioNoUpdateCheck, Claude α's decision 10 of 2026-11-11): the look returns
     before it asks the service, and what stands offers nothing. */
  const once = main.slice(main.indexOf("function noteOnce() {"), main.indexOf("function armNoteCheck() {"));
  const now = main.slice(main.indexOf("async function updateNow() {"), main.indexOf("function noteOnce() {"));
  const off = "noUpdateNow(U)";
  const reader = main.slice(main.indexOf("function noUpdateNow(U) {"), main.indexOf("function armNoteCheck() {"));
  ck(once.indexOf(off) > 0 && once.indexOf(off) < once.indexOf("U.look(") && now.indexOf(off) > 0 && /offer: !off && a\.offer/.test(now)
    && reader.indexOf("U.noUpdateFrom(aiPolicyText())") > 0 && /const NO_UPDATE_READ_MS = 600000;/.test(main),
    "un12e under machine policy's StudioNoUpdateCheck the look returns before it asks the service, and what stands offers nothing");
  /* un12f: a failed write of update-note.json is caught, and the page is still told the look ended */
  const writeCatch = /try\s*\{\s*writeUpdateState\(got\.state\);\s*\}\s*catch/.test(once);
  const toldAfter = once.indexOf('webContents.send("studio:update-looked")') > once.indexOf("writeUpdateState");
  ck(writeCatch && toldAfter,
    "un12f a write that throws leaves the previous state, and the page still hears the look ended");
}

/* ---- un15: StudioNoUpdateCheck read from reg query's text --------------------------------------------------------- */
function policyLegs(U, ck) {
  const KEY = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda";
  const q = (...rows) => ["", KEY, ...rows.map(([n, t, v]) => "    " + n + "    " + t + "    " + v), ""].join("\r\n");
  const cases = [
    ["", false, "no key"],
    [q(), false, "the key with no value"],
    [q(["StudioNoUpdateCheck", "REG_DWORD", "0x1"]), true, "a DWORD of 1"],
    [q(["StudioNoUpdateCheck", "REG_DWORD", "0x0"]), false, "a DWORD of 0"],
    [q(["StudioNoUpdateCheck", "REG_SZ", "1"]), true, "the string 1"],
    [q(["StudioNoUpdateCheck", "REG_SZ", "0"]), false, "the string 0"],
    [q(["studionoupdatecheck", "REG_DWORD", "0x7"]), true, "the name in lower case"],
    [q(["DeskNoUpdateCheck", "REG_DWORD", "0x1"]), false, "the desk's own value"],
    [q(["AiModel", "REG_SZ", "m"]) + "\r\n" + KEY + "\\Sub\r\n    StudioNoUpdateCheck    REG_DWORD    0x1\r\n", false, "a subkey's value"],
  ];
  const wrong = cases.filter(([t, want]) => (typeof U.noUpdateFrom === "function" ? U.noUpdateFrom(t) : undefined) !== want).map(c => c[2]);
  ck(wrong.length === 0, "un15 StudioNoUpdateCheck turns the look off for anything but 0, the key's own value alone: "
    + (wrong.join(", ") || "nine cases as they should be"));
}

/* ---- un13: the page on the stand-in DOM ------------------------------------------------------------------------------ */
const text = (h) => String(h || "").replace(/<[^>]*>/g, " ").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
async function pageLegs(ck) {
  const calls = [];
  const pageWith = (update, lang, noApi) => {
    const api = noApi ? {} : {
      update: () => Promise.resolve(update),
      updateLater: () => { calls.push(["later"]); return Promise.resolve(Object.assign({}, update, { offer: update.offer ? Object.assign({}, update.offer, { strip: false }) : null })); },
      updateOpen: (...a) => { calls.push(["open"].concat(a)); },
    };
    const home = loadPage({ api, uiLang: lang || "en" });
    const P = home.page;
    P.S.host = { version: "0.1.0", tour: { offered: true }, langs: [], signing: { keyId: "", problem: null } };
    if (!noApi) P.S.update = update;
    P.S.projects = [{ dir: "C:/stand-in/a", name: "A", counts: { cards: 3 }, editions: 1 }];
    P.paint();
    return { home, P };
  };
  const OFFER = { running: "0.1.0", about: "offer", offer: { version: "0.2.0", strip: true } };
  const en = pageWith(OFFER);
  const main = en.home.node("#main").innerHTML;
  const strip = (/<div class="up-strip">(.*?)<\/div>/.exec(main) || [])[1] || "";
  ck(text(strip) === "Etiuda Studio 0.2.0 is available See what's new Later" && /data-act="update-open" title="Opens the page of this release"/.test(strip)
    && /data-act="update-later">Later</.test(strip) && main.indexOf('class="lede"') >= 0
    && main.indexOf('class="lede"') < main.indexOf('<div class="up-strip">') && main.indexOf('<div class="tiles">') > main.indexOf('<div class="up-strip">'),
    "un13a Overview's strip, under the lede and above the number cards: the version, See what's new with its hover, Later: " + JSON.stringify(text(strip)));
  const bar = text(en.P.statusRightHtml());
  ck(/Etiuda Studio 0\.1\.0 0\.2\.0 available · Made by Stardust/.test(bar) && /class="sb-up" data-act="update-open"/.test(en.P.statusRightHtml()),
    "un13b the status bar's quiet mark beside the version, an ordinary button that opens the page: " + JSON.stringify(bar));
  en.P.ACTS.about();
  const about = text(en.home.node("#dlg").innerHTML);
  ck(/Version This version: 0\.1\.0 Newest available: 0\.2\.0 See what's new/.test(about),
    "un13c About: this version and the newest one above each other, and See what's new");
  en.P.ACTS["update-open"]();
  await en.P.ACTS["update-later"]();
  const after = en.home.node("#main").innerHTML;
  ck(calls.length === 2 && calls[0].length === 1 && calls[0][0] === "open" && calls[1][0] === "later"
    && after.indexOf("up-strip") < 0 && /0\.2\.0 available/.test(text(en.P.statusRightHtml())),
    "un13d See what's new asks the shell by name, with no address; Later asks the shell, the strip goes and the status bar's mark stays: " + JSON.stringify(calls));
  const pl = pageWith(OFFER, "pl");
  const plStrip = text((/<div class="up-strip">(.*?)<\/div>/.exec(pl.home.node("#main").innerHTML) || [])[1]);
  ck(plStrip === "Dostępna jest nowa wersja Etiudy Studio: 0.2.0 Co nowego Później" && /dostępna 0\.2\.0/.test(text(pl.P.statusRightHtml())),
    "un13e in Polish, the copywriter's words: " + JSON.stringify(plStrip));
  const newest = pageWith({ running: "0.1.0", about: "newest", offer: null }), unchecked = pageWith({ running: "0.1.0", about: "unchecked", offer: null });
  newest.P.ACTS.about(); unchecked.P.ACTS.about();
  ck(newest.home.node("#main").innerHTML.indexOf("up-strip") < 0 && text(newest.P.statusRightHtml()).indexOf("available") < 0
    && /This is the newest version\./.test(text(newest.home.node("#dlg").innerHTML))
    && /Whether a newer version exists could not be checked just now\. This one works as it is\./.test(text(unchecked.home.node("#dlg").innerHTML)),
    "un13f no offer: no strip, no mark, and About says the newest, or that it could not check");
  const none = pageWith(null, "en", true);
  none.P.ACTS.about();
  const dlg = text(none.home.node("#dlg").innerHTML);
  ck(none.home.node("#main").innerHTML.indexOf("up-strip") < 0 && text(none.P.statusRightHtml()) === "Etiuda Studio 0.1.0 · Made by Stardust"
    && dlg.indexOf("newest") < 0 && dlg.indexOf("could not be checked") < 0,
    "un13g with no answer from the shell, nothing anywhere");
}

async function main() {
  clearScratch(SCRATCH);
  const U = await import(pathToFileURL(path.join(ROOT, "src", "update-note.mjs")).href);
  await legs(U, check);
  await wireLegs(path.join(ROOT, "src", "wire.cjs"), check);
  signLegs(U, check);
  shellLegs(check);
  policyLegs(U, check);
  await pageLegs(check);

  /* un14: plants, each in a scratch copy of the one file it changes */
  const PLANTS = [
    { name: "un-app", file: "src/update-note.mjs", reds: ["un2a"], from: "if (n.app !== app) return \"other-app\"; /* plant:un-app */", to: "" },
    { name: "un-url", file: "src/update-note.mjs", reds: ["un2a"], from: "|| !URL_RE.test(n.url)) return \"url\"; /* plant:un-url */", to: ") return \"url\";" },
    { name: "un-sig", file: "src/update-note.mjs", reds: ["un2a", "un8b"], from: "return crypto.verify(null, noteBytes(n), key, Buffer.from(n.sig.value, \"hex\")); /* plant:un-sig */", to: "return true;" },
    { name: "un-size", file: "src/update-note.mjs", reds: ["un2b"], from: "if (bytes.length > NOTE_MAX) return { ok: false, why: \"size\" }; /* plant:un-size */", to: "" },
    { name: "un-serial", file: "src/update-note.mjs", reds: ["un3b"], from: "if (next.serial < kept.serial) return { take: false, why: \"older\" }; /* plant:un-serial */", to: "" },
    { name: "un-equal", file: "src/update-note.mjs", reds: ["un6"], from: "if (c === null || c <= 0) return null; /* plant:un-equal */", to: "if (c === null || c < 0) return null;" },
    { name: "un-putoff", file: "src/update-note.mjs", reds: ["un5d"], from: "const putOffNow = !!p && p.version === kept.note.version && Number(now) < p.until; /* plant:un-putoff */", to: "const putOffNow = !!p && Number(now) < p.until;" },
    { name: "un-putoff-edge", file: "src/update-note.mjs", reds: ["un5b"], from: "const putOffNow = !!p && p.version === kept.note.version && Number(now) < p.until; /* plant:un-putoff */", to: "const putOffNow = !!p && p.version === kept.note.version && Number(now) <= p.until;" },
    { name: "wire-cap", file: "src/wire.cjs", reds: ["un10b"], from: "if (cap && size > cap) { stop.abort(); throw new Error(what + \" answered more than \" + cap + \" bytes\"); } /* plant:wire-cap */", to: "" },
  ];
  for (const p of PLANTS) {
    if (PLANTS_OFF) { skip("un14 plant " + p.name + " turns " + p.reds.join(" and ") + " red (ETIUDA_PLANTS=off)"); continue; }
    const seen = [];
    const ck = (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); };
    try {
      const real = fs.readFileSync(path.join(ROOT, p.file), "utf8");
      const dir = path.join(SCRATCH, "plant-" + p.name, "src");
      fs.mkdirSync(dir, { recursive: true });
      const at = path.join(dir, path.basename(p.file));
      fs.writeFileSync(at, plantText(real, p.from, p.to, p.file));
      if (p.file === "src/wire.cjs") await wireLegs(at, ck);
      else await legs(await import(pathToFileURL(at).href), ck);
    } catch (e) { seen.push("broken: " + e.message); }
    check(p.reds.every((id) => seen.includes(id)) && !seen.some((s) => s.startsWith("broken")),
      "un14 plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(seen));
  }

  dropScratch(SCRATCH, "update-note");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran\n");
    return 78;
  }
  process.stdout.write("update-note  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  return Math.min(failed, 77);
}

main().then((c) => process.exit(c), (e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); });
