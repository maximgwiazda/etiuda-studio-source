/* THE LEAD'S ONE SIGNING KEY IS NEVER LOST (Grok's review 27 of Studio's signing key, 2026-11-15).
 *
 * gate-kind: node
 *
 *     node tests/key-keep.mjs
 *
 * shell/main.js under a stub of the electron module and of the thread, as tests/shell-guards.mjs loads it (the loader below is
 * that file's, cut to what these legs ask): its own scratch user-data folder per leg, a reversible stand-in vault and never this
 * computer's keyring, every child process recorded and none started, the thread Studio's own verbs.
 *   kk2  setting a key aside writes the aside copy whole first, and the new key over the old in one rename, so a seal that fails
 *        leaves the old key in the slot and no step ever leaves the slot empty
 *   kk1  a restore over a passphrase-wrapped key of another public half copies that key aside first, still under its passphrase,
 *        and names it among the old signing keys; the same key's passphrase file is replaced as before (the control)
 *   kk5  a key handed out to sign while the store refuses its mark is held as spent for the run; kk5b, the mark written, it stays spent at the next start
 *   kk3  a backup whose lead box does not open under its key leaves that box off, and a box in the slot that opens is kept
 *   kk8  a reset keeps a backup saved in the settings folder under the save dialog's own name, and the store's note of it
 *   kk7  the key file and a backup are written owner-only where the system honours the mode
 *   kk4  while no keyring holds the seal, the signing row says so, in the copywriter's words
 *   kk9  the restore and backup covers say review 27's other three lines, in the copywriter's words
 * Each leg's fix is lifted in a copy of the tree (kkP), which turns that leg red; ETIUDA_PLANTS=off skips the copies.
 */
import "./reg-stand-on.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module, { createRequire, syncBuiltinESMExports } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dropScratch } from "./scratch.mjs";
import { seatEnv } from "./seated.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const require = createRequire(import.meta.url);
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-key-keep-"));

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }
const settle = () => new Promise((r) => setTimeout(r, 20));

/* safeStorage stood in: a reversible seal that is not the key's own spelling. `failSeal` makes the next seals throw. */
function vaultStand(o) {
  const v = {
    failSeal: false,
    isEncryptionAvailable: () => true,
    encryptString: (s) => { if (v.failSeal) throw new Error("the stand-in vault refused this seal");
      return Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"); },
    decryptString: (b) => { const t = Buffer.from(b).toString("utf8");
      if (!t.startsWith("sealed:")) throw new Error("not sealed here");
      return Buffer.from(t.slice(7), "hex").reverse().toString("utf8"); },
  };
  return Object.assign(v, o || {});
}

/* One load of a shell/main.js (`opts.main`, the checkout's by default) with its own user-data folder. */
async function loadShell(name, o) {
  const opts = o || {};
  const ud = path.join(SCRATCH, name);
  fs.mkdirSync(ud, { recursive: true });
  if (opts.store) fs.writeFileSync(path.join(ud, "studio.json"), JSON.stringify(opts.store));
  const main = opts.main || path.join(ROOT, "shell", "main.js"), ui = path.join(path.dirname(main), "..", "ui", "index.html");
  const got = { handlers: {}, windows: [], logged: [], ud, vault: opts.safeStorage || vaultStand() };
  const bag = (into) => (t, fn) => { (into[t] = into[t] || []).push(fn); };
  class Win {
    constructor() { this.wcOn = {}; this.winOn = {};
      this.webContents = { id: 1, on: bag(this.wcOn), once: bag(this.wcOn), send() {}, setWindowOpenHandler() {}, getURL: () => pathToFileURL(ui).href,
        reload() {}, forcefullyCrashRenderer() {} };
      got.windows.push(this); }
    on(t, fn) { bag(this.winOn)(t, fn); } once(t, fn) { bag(this.winOn)(t, fn); }
    isDestroyed() { return false; } isMaximized() { return false; } close() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} }, getPath: () => ud, getVersion: () => "0.0.0",
      getLocale: () => "en-GB", requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(), on() {}, quit() {}, exit() {} },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }), showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system" }, clipboard: { writeText() {} }, safeStorage: got.vault,
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {},
      setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.reject(new Error("no Recycle Bin in this leg")) },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
  };
  const thread = { call: (verb, ...a) => (opts.thread ? opts.thread(verb, ...a) : Promise.resolve({ verb })) };
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not): opts.works false leaves it bare. */
  const env = Object.assign({ STUDIO_TEST_OFFSCREEN: "", XDG_CURRENT_DESKTOP: "GNOME" }, await seatEnv(ud, opts.works === undefined ? true : opts.works, opts.env), opts.env || {});
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; if (env[k] === null) delete process.env[k]; else process.env[k] = env[k]; }
  /* Every child call answers empty and none is started: the proxy's reg tool and the keyring's bus are never this machine's. */
  const quietChild = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const noop = (...a) => { const cb = a.find((x) => typeof x === "function"); if (cb) cb(null, "", ""); return quietChild; };
  const cp = { execFileSync: () => { throw new Error("no child in this leg"); }, execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: noop, spawn: () => quietChild, exec: noop, fork: () => quietChild };
  const builtinCp = process.getBuiltinModule("node:child_process");
  const childNames = Object.keys(cp), childWas = {};
  for (const n of childNames) { childWas[n] = builtinCp[n]; builtinCp[n] = cp[n]; }
  syncBuiltinESMExports();
  const load = Module._load, outWrite = process.stdout.write, errWrite = process.stderr.write, errWas = console.error;
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return load.apply(this, arguments);
  };
  const quiet = (s) => { got.logged.push(String(s)); return true; };
  process.stderr.write = quiet;
  console.error = (...a) => { got.logged.push(a.map(String).join(" ")); };
  try {
    delete require.cache[main];
    got.mod = require(main);
    for (let i = 0; i < 1250 && !got.windows.length; i++) await settle();
  } finally { process.stdout.write = outWrite; }
  got.done = () => {
    Module._load = load;
    process.stderr.write = errWrite;
    console.error = errWas;
    for (const n of childNames) builtinCp[n] = childWas[n];
    syncBuiltinESMExports();
    for (const k of Object.keys(was)) { if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k]; }
  };
  got.event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: got.windows[0] && got.windows[0].webContents };
  got.ask = (ch, ...a) => got.handlers[ch](got.event, ...a);
  return got;
}

/* A copy of the tree with `swaps` ([file, from, to]) made, for a plant; its shell's path and its own Studio verbs. */
async function plantedTree(name, swaps) {
  const at = path.join(SCRATCH, name);
  for (const d of ["shell", "src", "ui", "engine/pinned", "packaging"]) fs.cpSync(path.join(ROOT, d), path.join(at, d), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "package.json"), path.join(at, "package.json"));
  for (const [file, from, to] of swaps) {
    const p = path.join(at, file), text = fs.readFileSync(p, "utf8");
    if (text.split(from).length !== 2) throw new Error("plant anchor not in " + file + " once: " + from.slice(0, 60));
    fs.writeFileSync(p, text.replace(from, to));
  }
  const St = await import(pathToFileURL(path.join(at, "src", "studio.mjs")).href);
  return { main: path.join(at, "shell", "main.js"), St, Sg: await import(pathToFileURL(path.join(at, "src", "sign.mjs")).href) };
}

const LEGS = {};
const PLANTS = [];

async function main() {
  const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
  const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
  const here = { main: path.join(ROOT, "shell", "main.js"), St, Sg };
  const readKey = (at) => { try { return fs.existsSync(at) ? Sg.readKeyFile(at) : null; } catch { return null; } };
  const keyAt = (ud) => Sg.defaultKeyFile(ud);
  const ctx = { St, Sg, here, readKey, keyAt, loadShell, vaultStand, SCRATCH, fs, path, crypto };

  for (const [id, leg] of Object.entries(LEGS)) {
    let r = null;
    try { r = await leg(here, ctx, id); } catch (e) { r = { ok: false, said: "threw " + String(e && e.stack || e).split("\n").slice(0, 3).join(" / ") }; }
    check(!!r && r.ok, id + " " + (r && r.line ? r.line : "") + ": " + (r ? r.said : ""));
  }
  if (PLANTS_OFF) for (const p of PLANTS) skip(p.id + " lifting " + p.mark + " turns " + p.leg + " red (ETIUDA_PLANTS=off)");
  else {
    for (const p of PLANTS) {
      let r = null, why = "";
      try { const tree = await plantedTree("plant-" + p.id, p.swaps); r = await LEGS[p.leg](tree, ctx, p.id); }
      catch (e) { why = String(e && e.message || e); r = /plant anchor not in/.test(why) ? { ok: true, said: why } : { ok: false, said: why }; }
      check(!!r && !r.ok, p.id + " lifting " + p.mark + " turns " + p.leg + " red: " + (r ? r.said : why));
    }
  }
}

/* ---- kk2: SETTING THE KEY ASIDE NEVER EMPTIES THE SLOT (review 27, finding 2) ------------------------------------------- */
LEGS.kk2 = async (tree, ctx, id) => {
  const { fs, path } = ctx;
  const realThread = (verb, ...a) => tree.St[verb](...a);
  const seeded = async (name) => {
    const ud = path.join(ctx.SCRATCH, id + "-" + name), at = ctx.keyAt(ud), vault = ctx.vaultStand(), pair = await tree.Sg.makePair();
    fs.mkdirSync(ud, { recursive: true });
    fs.writeFileSync(at, JSON.stringify(tree.Sg.osFile(pair, vault.encryptString(pair.der)), null, 1) + "\n");
    return { ud, at, vault, pair, bytes: fs.readFileSync(at) };
  };
  /* A seal that fails while the new key is made: the slot still holds the old key, byte for byte. */
  const a = await seeded("seal-fails");
  const sa = await ctx.loadShell(path.basename(a.ud), { safeStorage: a.vault, thread: realThread, main: tree.main });
  a.vault.failSeal = true;
  const refused = await sa.ask("studio:key-aside");
  sa.done();
  const kept = fs.existsSync(a.at) && Buffer.compare(fs.readFileSync(a.at), a.bytes) === 0;
  /* A set-aside that succeeds, watched: the slot is never unlinked, and when the new key is renamed over it, the aside copy is
     already there whole. */
  const b = await seeded("watched");
  const sb = await ctx.loadShell(path.basename(b.ud), { safeStorage: b.vault, thread: realThread, main: tree.main });
  const ops = [], realRename = fs.renameSync, realUnlink = fs.unlinkSync;
  const slot = path.resolve(b.at);
  const asideWhole = () => fs.readdirSync(path.dirname(slot)).filter((n) => /^signing-key\.old-.*\.json$/.test(n))
    .some((n) => Buffer.compare(fs.readFileSync(path.join(path.dirname(slot), n)), b.bytes) === 0);
  fs.renameSync = function (from, to) { if (path.resolve(String(to)) === slot) ops.push("over:" + (asideWhole() ? "aside-whole" : "NO-ASIDE")); if (path.resolve(String(from)) === slot) ops.push("moved-out"); return realRename.apply(this, arguments); };
  fs.unlinkSync = function (p) { if (path.resolve(String(p)) === slot) ops.push("unlinked"); return realUnlink.apply(this, arguments); };
  let made = null;
  try { made = await sb.ask("studio:key-aside"); } finally { fs.renameSync = realRename; fs.unlinkSync = realUnlink; sb.done(); }
  const now = ctx.readKey(b.at), store = (() => { try { return JSON.parse(fs.readFileSync(path.join(b.ud, "studio.json"), "utf8")); } catch { return {}; } })();
  const named = (store.oldSigningKeys || []).find((k) => k.public === b.pair.public);
  const asideOk = !!named && fs.existsSync(named.file) && Buffer.compare(fs.readFileSync(named.file), b.bytes) === 0;
  const ok = !!refused && !!refused.error && kept && !!made && !made.error && !!now && now.kept === "os" && now.public !== b.pair.public
    && asideOk && ops.length >= 1 && ops.every((o) => o === "over:aside-whole");
  return { ok, line: "setting the key aside writes the aside copy whole before the new key goes over the old in one rename: a seal that fails leaves the old key in the slot, and the slot is never moved out or unlinked",
    said: JSON.stringify({ sealFails: { refused: !!(refused && refused.error), kept }, watched: { ops, newKey: !!now && now.public !== b.pair.public, asideOk } }) };
};
PLANTS.push({ id: "kkp2", leg: "kk2", mark: "plant:k27-aside-copy", swaps: [["shell/main.js", "    writeWhole(asidePath, bytes, { mode: OWNER_ONLY }); /* plant:k27-aside-copy */", "    fs.copyFileSync(at, asidePath); fs.unlinkSync(at);"]] });

/* ---- kk1: A RESTORE NEVER TAKES THE PLACE OF A PASSPHRASE KEY OF ANOTHER PUBLIC HALF UNKEPT (review 27, finding 1) ---------- */
LEGS.kk1 = async (tree, ctx, id) => {
  const { fs, path } = ctx;
  const realThread = (verb, ...a) => tree.St[verb](...a);
  const run = async (name, slotPair, copyPair) => {
    const ud = path.join(ctx.SCRATCH, id + "-" + name), at = ctx.keyAt(ud), copy = path.join(ctx.SCRATCH, id + "-" + name + "-copy.json");
    fs.mkdirSync(ud, { recursive: true });
    fs.writeFileSync(at, JSON.stringify(tree.Sg.passphraseFile(slotPair, "the passphrase in the slot"), null, 1) + "\n");
    fs.writeFileSync(copy, JSON.stringify(tree.Sg.passphraseFile(copyPair, "the copy's passphrase"), null, 1) + "\n");
    const before = fs.readFileSync(at);
    const s = await ctx.loadShell(path.basename(ud), { env: { STUDIO_TEST_RESTORE: copy }, thread: realThread, main: tree.main });
    const pick = await s.ask("studio:key-restore-pick", "t", "k");
    const back = await s.ask("studio:key-restore", pick && pick.file, "the copy's passphrase");
    s.done();
    const now = ctx.readKey(at), store = (() => { try { return JSON.parse(fs.readFileSync(path.join(ud, "studio.json"), "utf8")); } catch { return {}; } })();
    const asides = fs.readdirSync(ud).filter((n) => /^signing-key\..+\.json$/.test(n)).map((n) => path.join(ud, n));
    const keptAside = asides.find((p) => Buffer.compare(fs.readFileSync(p), before) === 0) || null;
    const named = (store.oldSigningKeys || []).some((k) => k.public === slotPair.public && k.file === keptAside);
    return { restored: !!back && !back.error && !!now && now.kept === "os" && now.public === copyPair.public, keptAside: !!keptAside, named,
      opens: !!keptAside && (() => { try { return !!tree.Sg.unlockKey(tree.Sg.readKeyFile(keptAside), "the passphrase in the slot"); } catch { return false; } })(),
      asides: asides.length };
  };
  const a = await tree.Sg.makePair(), b = await tree.Sg.makePair();
  const other = await run("other", a, b), same = await run("same", a, a);
  const ok = other.restored && other.keptAside && other.named && other.opens && same.restored && same.asides === 0;
  return { ok, line: "a restore over a passphrase-wrapped key of another public half copies that key aside first, still under its own passphrase, and names it among the old signing keys; CONTROL: the same key's passphrase file is replaced as before, with nothing set aside",
    said: JSON.stringify({ other, same }) };
};
PLANTS.push({ id: "kkp1", leg: "kk1", mark: "plant:k27-pass-aside", swaps: [["shell/main.js", "    if (have && have.kept !== S.OS_WRAP && have.public !== pair.public) { /* plant:k27-pass-aside */", "    if (false) {"]] });

/* ---- kk5: A "HAS SIGNED" MARK THAT CANNOT BE WRITTEN STILL COUNTS (review 27, finding 5) ----------------------------------- */
LEGS.kk5 = async (tree, ctx, id) => {
  const { fs, path } = ctx;
  const realThread = (verb, ...a) => tree.St[verb](...a);
  const ud = path.join(ctx.SCRATCH, id + "-ud"), at = ctx.keyAt(ud), vault = ctx.vaultStand();
  const copy = path.join(ctx.SCRATCH, id + "-copy.json"), backup = path.join(ctx.SCRATCH, id + "-backup.json");
  fs.writeFileSync(copy, JSON.stringify(tree.Sg.passphraseFile(await tree.Sg.makePair(), "another key's passphrase"), null, 1) + "\n");
  const s = await ctx.loadShell(path.basename(ud), { safeStorage: vault, thread: realThread, main: tree.main,
    env: { STUDIO_TEST_RESTORE: copy, STUDIO_TEST_BACKUP: backup } });
  let made = null, signed = null, pick = null, over = null;
  try {
    made = await s.ask("studio:key-make");
    /* A newer Studio's saved data: this one leaves studio.json untouched, so the mark the next signature writes is refused. */
    const storeAt = path.join(ud, "studio.json"), doc = JSON.parse(fs.readFileSync(storeAt, "utf8"));
    fs.writeFileSync(storeAt, JSON.stringify(Object.assign({}, doc, { format: 99, writtenBy: "99.0.0" }), null, 1));
    signed = await s.ask("studio:key-backup", "a backup passphrase", "t", "k");
    /* The refusal passes (the newer Studio's data gone again), as a full disc or a locked file clears: the mark stays unwritten. */
    fs.writeFileSync(storeAt, JSON.stringify(Object.assign(doc, { format: 1, writtenBy: undefined }), null, 1));
    pick = await s.ask("studio:key-restore-pick", "t", "k");
    over = await s.ask("studio:key-restore", pick && pick.file, "another key's passphrase");
  } finally { s.done(); }
  const now = ctx.readKey(at);
  const marked = (() => { try { return JSON.parse(fs.readFileSync(path.join(ud, "studio.json"), "utf8")).keyMade; } catch { return null; } })();
  const ok = !!made && !made.error && !!signed && !signed.error && !!marked && marked.used !== true
    && !!over && over.error === "This Studio keeps another signing key, so the copy was not restored." && !!now && now.public === made.public;
  return { ok, line: "a key made here that signed while its mark could not be saved is still one that signed: a backup of another key is refused over it, the key kept",
    said: JSON.stringify({ made: !!made && !made.error, signed: !!signed && !signed.error, markSaved: !!marked && marked.used === true,
      restore: over ? (over.error || "restored") : null, kept: !!now && !!made && now.public === made.public }) };
};
PLANTS.push({ id: "kkp5", leg: "kk5", mark: "plant:k27-spent-here", swaps: [["shell/main.js", "  if (keySpentHere.has(have.public)) return false; /* plant:k27-spent-here */", ""]] });
/* kk5b, the store's mark across runs: a key made here signs and its mark is written; at the next start (a fresh load of the shell,
   so nothing of the last run is held in memory) a backup of another key is still refused over it. This is plant:k10-used's
   leg since kk5 (licence-studio's ls14 signs and restores in one run, where keySpentHere already refuses). */
LEGS.kk5b = async (tree, ctx, id) => {
  const { fs, path } = ctx;
  const realThread = (verb, ...a) => tree.St[verb](...a);
  const name = id + "-ud", ud = path.join(ctx.SCRATCH, name), at = ctx.keyAt(ud), vault = ctx.vaultStand();
  const copy = path.join(ctx.SCRATCH, id + "-copy.json"), backup = path.join(ctx.SCRATCH, id + "-backup.json");
  fs.writeFileSync(copy, JSON.stringify(tree.Sg.passphraseFile(await tree.Sg.makePair(), "another key's passphrase"), null, 1) + "\n");
  const opts = { safeStorage: vault, thread: realThread, main: tree.main, env: { STUDIO_TEST_RESTORE: copy, STUDIO_TEST_BACKUP: backup } };
  const first = await ctx.loadShell(name, opts);
  let made = null, signed = null;
  try { made = await first.ask("studio:key-make"); signed = await first.ask("studio:key-backup", "a backup passphrase", "t", "k"); }
  finally { first.done(); }
  const marked = (() => { try { return JSON.parse(fs.readFileSync(path.join(ud, "studio.json"), "utf8")).keyMade; } catch { return null; } })();
  const next = await ctx.loadShell(name, opts);
  let over = null;
  try { const pick = await next.ask("studio:key-restore-pick", "t", "k"); over = await next.ask("studio:key-restore", pick && pick.file, "another key's passphrase"); }
  finally { next.done(); }
  const now = ctx.readKey(at);
  const ok = !!made && !made.error && !!signed && !signed.error && !!marked && marked.used === true
    && !!over && over.error === "This Studio keeps another signing key, so the copy was not restored." && !!now && now.public === made.public;
  return { ok, line: "a key made here whose mark of having signed was written stays at the next start: a backup of another key is refused over it",
    said: JSON.stringify({ markSaved: !!marked && marked.used === true, restore: over ? (over.error || "restored") : null, kept: !!now && !!made && now.public === made.public }) };
};
PLANTS.push({ id: "kkp5b", leg: "kk5b", mark: "plant:k10-used", swaps: [["shell/main.js", "  if (m.used === true) return false; /* plant:k10-used */", ""]] });

/* ---- kk3: A BACKUP'S LEAD BOX THAT DOES NOT OPEN NEVER TAKES THE PLACE OF ONE THAT DOES (review 27, finding 3) --------------- */
LEGS.kk3 = async (tree, ctx, id) => {
  const { fs, path } = ctx;
  const S = tree.Sg, realThread = (verb, ...a) => tree.St[verb](...a);
  const ud = path.join(ctx.SCRATCH, id + "-ud"), at = ctx.keyAt(ud), vault = ctx.vaultStand();
  const PW = "the copy's passphrase", pair = await S.makePair();
  /* A backup of this key once the first team write gave it its box, then that box's ciphertext changed by one hex character. */
  const good = path.join(ctx.SCRATCH, id + "-good.json"), copy = path.join(ctx.SCRATCH, id + "-copy.json");
  fs.writeFileSync(good, JSON.stringify(S.passphraseFile(pair, PW), null, 1) + "\n");
  S.ensureLeadBox(S.readKeyFile(good), S.unlockKey(S.readKeyFile(good), PW));
  const goodDoc = JSON.parse(fs.readFileSync(good, "utf8")), box = goodDoc.box;
  const flipped = JSON.parse(JSON.stringify(goodDoc));
  flipped.box.ct = (flipped.box.ct[0] === "0" ? "1" : "0") + flipped.box.ct.slice(1);
  fs.writeFileSync(copy, JSON.stringify(flipped, null, 1) + "\n");
  /* The slot: the same key, kept under this sign-in, with the box that opens. */
  fs.mkdirSync(ud, { recursive: true });
  fs.writeFileSync(at, JSON.stringify(Object.assign(S.osFile(pair, vault.encryptString(pair.der)), { box }), null, 1) + "\n");
  const s = await ctx.loadShell(path.basename(ud), { safeStorage: vault, thread: realThread, main: tree.main, env: { STUDIO_TEST_RESTORE: copy } });
  let back = null;
  try { const pick = await s.ask("studio:key-restore-pick", "t", "k"); back = await s.ask("studio:key-restore", pick && pick.file, PW); }
  finally { s.done(); }
  const now = ctx.readKey(at), kept = !!now && !!now.doc && JSON.stringify(now.doc.box) === JSON.stringify(box);
  let writes = false;
  try { S.ensureLeadBox(now, S.unlockKey({ wrap: { kdf: S.OS_WRAP }, keyId: pair.keyId, public: pair.public }, pair.der)); writes = true; } catch { writes = false; }
  const ok = !!back && !back.error && kept && writes && back.boxDropped === true;
  return { ok, line: "a backup whose lead box does not open under its key restores the key and leaves that box off, the box in the slot that opens kept, so the next team write goes on; the reply says the copy's box was left off",
    said: JSON.stringify({ restored: !!back && !back.error, boxKept: kept, teamWrites: writes, said: !!back && back.boxDropped === true }) };
};
PLANTS.push({ id: "kkp3", leg: "kk3", mark: "plant:k27-box-opens", swaps: [["src/studio.mjs", "  if (pair.box && !boxOpens(opened, pair.box)) { delete pair.box; pair.boxDropped = true; } /* plant:k27-box-opens */", ""]] });

/* ---- kk8: A RESET KEEPS A BACKUP SAVED BESIDE THE SETTINGS UNDER THE DIALOG'S OWN NAME (review 27, finding 8) --------------- */
LEGS.kk8 = async (tree, ctx, id) => {
  const { fs, path } = ctx;
  const s = await ctx.loadShell(id + "-shell", { main: tree.main });
  s.done();
  const ud = path.join(ctx.SCRATCH, id + "-ud");
  fs.mkdirSync(ud, { recursive: true });
  const backupName = "etiuda-studio-key-0a1b2c3d.json", note = { keyId: "studio-0a1b2c3d4e5f6a7b", made: "2026-11-15", where: ud };
  fs.writeFileSync(path.join(ud, backupName), "{\"kind\":\"etiuda-signing-key\"}\n");
  fs.writeFileSync(path.join(ud, "signing-key.json"), "{\"kind\":\"etiuda-signing-key\"}\n");
  fs.writeFileSync(path.join(ud, "stray.txt"), "a file the reset takes\n");
  fs.writeFileSync(path.join(ud, "studio.json"), JSON.stringify({ format: 1, trialFrom: "2026-10-01", root: ud, theme: "dark", keyBackup: note }, null, 1));
  let r = null;
  try { r = s.mod.resetStudioUserData(ud); } catch (e) { r = { error: String(e && e.message || e) }; }
  const store = (() => { try { return JSON.parse(fs.readFileSync(path.join(ud, "studio.json"), "utf8")); } catch { return {}; } })();
  const nsh = fs.readFileSync(path.join(path.dirname(tree.main), "..", "packaging", "installer-pages.nsh"), "utf8");
  const uninstallerKeeps = /StrCpy \$R4 \$R2 17[\s\S]{0,400}\$R4 != "etiuda-studio-key"/.test(nsh);
  const ok = !!r && r.ok === true && fs.existsSync(path.join(ud, backupName)) && !fs.existsSync(path.join(ud, "stray.txt"))
    && JSON.stringify(store.keyBackup) === JSON.stringify(note) && store.theme === undefined && s.mod.isResetStudioKept(backupName) === true
    && uninstallerKeeps;
  return { ok, line: "a reset keeps a backup saved in the settings folder under the save dialog's own name, and the store's note of where the backup is, as the uninstaller's Remove my data keeps it; a stray file and other settings still go",
    said: JSON.stringify({ reset: r, backupKept: fs.existsSync(path.join(ud, backupName)), strayGone: !fs.existsSync(path.join(ud, "stray.txt")),
      noteKept: JSON.stringify(store.keyBackup) === JSON.stringify(note), uninstallerKeeps }) };
};
PLANTS.push({ id: "kkp8", leg: "kk8", mark: "plant:k27-keep-backup", swaps: [["shell/main.js", "  if (/^etiuda-studio-key-.*\\.json$/i.test(name)) return true; /* plant:k27-keep-backup */", ""]] });

/* ---- kk7: THE KEY FILE AND A BACKUP ARE WRITTEN OWNER-ONLY (review 27, finding 7) -------------------------------------------
   The sibling each is written through is opened with mode 0o600, which the rename carries to the file. Windows decides who reads a
   file by its folder's access list, not by this mode, so there the open's mode is what is read; elsewhere the file's own mode too. */
LEGS.kk7 = async (tree, ctx, id) => {
  const { fs, path } = ctx;
  const realThread = (verb, ...a) => tree.St[verb](...a);
  const ud = path.join(ctx.SCRATCH, id + "-ud"), at = ctx.keyAt(ud), backup = path.join(ctx.SCRATCH, id + "-backup.json");
  const s = await ctx.loadShell(path.basename(ud), { thread: realThread, main: tree.main, env: { STUDIO_TEST_BACKUP: backup } });
  const opened = [], realOpen = fs.openSync;
  fs.openSync = function (p, flags, mode) { opened.push({ p: String(p), mode }); return realOpen.apply(this, arguments); };
  let made = null, saved = null;
  try { made = await s.ask("studio:key-make"); saved = await s.ask("studio:key-backup", "a backup passphrase", "t", "k"); }
  finally { fs.openSync = realOpen; s.done(); }
  const modeFor = (target) => { const o = opened.filter((x) => path.basename(x.p).startsWith(path.basename(target) + ".")).pop(); return o ? o.mode : "none"; };
  const posix = process.platform !== "win32";
  const fileMode = (p) => { try { return fs.statSync(p).mode & 0o777; } catch { return -1; } };
  const keyMode = modeFor(at), backupMode = modeFor(backup);
  const ok = !!made && !made.error && !!saved && !saved.error && keyMode === 0o600 && backupMode === 0o600
    && (!posix || (fileMode(at) === 0o600 && fileMode(backup) === 0o600));
  return { ok, line: "the key file and a backup copy are written through a sibling opened owner-only (0o600), and on a system that honours the mode the files are owner-only",
    said: JSON.stringify({ keyOpenMode: typeof keyMode === "number" ? keyMode.toString(8) : String(keyMode), backupOpenMode: typeof backupMode === "number" ? backupMode.toString(8) : String(backupMode),
      posix, keyFileMode: posix ? fileMode(at).toString(8) : "n/a", backupFileMode: posix ? fileMode(backup).toString(8) : "n/a" }) };
};
PLANTS.push({ id: "kkp7", leg: "kk7", mark: "plant:k27-owner-only", swaps: [["src/whole-write.cjs", "    fd = fs.openSync(tmp, \"w\", mode); /* plant:k27-owner-only */", "    fd = fs.openSync(tmp, \"w\");"]] });

/* ---- kk4: A KEY SEALED WITH NO KEYRING IS SAID IN THE SIGNING ROW (review 27, finding 4) ---------------------------------- */
/* The copywriter's line for the row (Claudette, 2026-11-15), in place of Studio's refusal sentence for a key it cannot keep. */
const NO_KEYRING_SIGNING = "This signing key is sealed without a keyring, so anyone who copies Studio's settings folder can open it. Installing GNOME Keyring or KDE Wallet, signing in again and making a new key keeps it under your sign-in.";
LEGS.kk4 = async (tree, ctx, id) => {
  const { fs, path } = ctx;
  const { loadPage } = await import("./page-stand-in.mjs");
  const ui = path.join(path.dirname(tree.main), "..", "ui");
  const source = fs.readFileSync(path.join(ui, "app.js"), "utf8");
  const plText = (() => { const m = fs.readFileSync(path.join(ui, "lang.js"), "utf8").split(JSON.stringify(NO_KEYRING_SIGNING) + ": ")[1]; return m ? JSON.parse(m.slice(0, m.indexOf("\",") + 1)) : ""; })();
  const made = (o) => Object.assign({ file: "C:\\ud\\signing-key.json", name: "signing-key.json", keyId: "studio-9a3a782d7f8ff25b",
    public: "", print: "9a3a782d7f8ff25b", kept: "os", backup: null, admitted: 0, problem: null }, o || {});
  const text = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const rowIn = (lang, sign) => { const P = loadPage({ api: {}, uiLang: lang, source }).page; P.S.host = { signing: sign }; return text(P.signingRowHtml()); };
  const basic = rowIn("en", made({ noKeyring: true, canKeep: false })), plain = rowIn("en", made()), pl = rowIn("pl", made({ noKeyring: true, canKeep: false }));
  const ok = basic.includes(NO_KEYRING_SIGNING) && !basic.includes("nothing asks for a passphrase")
    && plain.includes("Made. This computer keeps it under your sign-in") && !plain.includes(NO_KEYRING_SIGNING)
    && !!plText && pl.includes(plText);
  return { ok, line: "while no keyring holds the signing key's seal, the signing row says so in the copywriter's words, in English and in Polish, and no longer says the sign-in keeps it; CONTROL: a key the sign-in keeps reads as before",
    said: JSON.stringify({ basicSays: basic.includes(NO_KEYRING_SIGNING), basicClaimsKept: basic.includes("nothing asks for a passphrase"), plainAsBefore: plain.includes("Made. This computer keeps it under your sign-in"), polish: !!plText && pl.includes(plText) }) };
};
PLANTS.push({ id: "kkp4", leg: "kk4", mark: "plant:k27-no-keyring-row", swaps: [["ui/app.js", "    if (!backupOnly && sign.noKeyring) return line(false, T(\"" + NO_KEYRING_SIGNING + "\")) /* plant:k27-no-keyring-row */", "    if (false) return line(false, \"\")"]] });

/* ---- kk9: THE COVERS SAY REVIEW 27'S THREE OTHER LINES, IN THE COPYWRITER'S WORDS, ENGLISH AND POLISH ------------------------ */
const K27_WORDS = {
  differ: "This copy holds a different signing key from the one in place. The one in place is set aside on this computer, not lost, and can be restored again.",
  dropped: "The copy's key for the desks' figures would not open, so it was left out, and the one already here stays.",
  offline: "Anyone who can read this copy can try passphrases against it, so a long passphrase keeps it safe.",
};
LEGS.kk9 = async (tree, ctx, id) => {
  const { fs, path } = ctx;
  const { loadPage } = await import("./page-stand-in.mjs");
  const ui = path.join(path.dirname(tree.main), "..", "ui");
  const source = fs.readFileSync(path.join(ui, "app.js"), "utf8"), langText = fs.readFileSync(path.join(ui, "lang.js"), "utf8");
  const pl = (en) => { const m = langText.split(JSON.stringify(en) + ": ")[1]; return m ? JSON.parse(m.slice(0, m.indexOf("\",") + 1)) : ""; };
  const text = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const sign = (o) => Object.assign({ keyId: "studio-9a3a782d7f8ff25b", print: "9a3a782d7f8ff25b", kept: "os", backup: null, problem: null }, o || {});
  const cover = (lang, set) => { const P = loadPage({ api: {}, uiLang: lang, source }).page; P.S.cover = "key"; Object.assign(P.S, set); return text(P.keyCoverHtml()); };
  const restore = (here, copyPrint) => ({ keyWant: "restore", keyCopy: { file: "E:\\copy.json", print: copyPrint }, host: { signing: here } });
  const out = {};
  for (const lang of ["en", "pl"]) {
    const say = (en) => (lang === "en" ? en : pl(en));
    const differ = say(K27_WORDS.differ), dropped = say(K27_WORDS.dropped), offline = say(K27_WORDS.offline);
    out[lang] = {
      differs: !!differ && cover(lang, restore(sign({ kept: "passphrase" }), "1111222233334444")).includes(differ),
      samePrintQuiet: !cover(lang, restore(sign({ kept: "passphrase" }), "9a3a782d7f8ff25b")).includes(differ),
      osKeyQuiet: !cover(lang, restore(sign({ kept: "os" }), "1111222233334444")).includes(differ),
      dropped: !!dropped && cover(lang, { keyWant: "restore", keyBoxDropped: true, keyBoxless: false, host: { signing: sign() } }).includes(dropped),
      boxlessAlone: !cover(lang, { keyWant: "restore", keyBoxDropped: false, keyBoxless: true, host: { signing: sign() } }).includes(dropped),
      offline: !!offline && cover(lang, { keyWant: "backup", host: { signing: sign() } }).includes(offline),
    };
  }
  const ok = Object.values(out).every((o) => Object.values(o).every((v) => v === true));
  return { ok, line: "the restore cover says the copy holds another key and the one in place is set aside, where a passphrase key of another print is in place (not for the same print, nor an operating-system key); the restore's answer says a copy's key for the desks' figures was left out (boxDropped); the backup cover says anyone who reads the copy can try passphrases; each in the copywriter's English and Polish",
    said: JSON.stringify(out) };
};
PLANTS.push({ id: "kkp9", leg: "kk9", mark: "plant:k27-prints-differ", swaps: [["ui/app.js", "(here && here.keyId && here.kept !== \"os\"", "(false && here"]] });
PLANTS.push({ id: "kkp9b", leg: "kk9", mark: "plant:k27-box-dropped-said", swaps: [["ui/app.js", "      + (S.keyBoxDropped ? '<p class=\"lede\">' + esc(T(\"" + K27_WORDS.dropped.replace(/'/g, "'") + "\")) + \"</p>\" : \"\") /* plant:k27-box-dropped-said */", "      + \"\""]] });

/* LEGS-HERE */
await main();
dropScratch(SCRATCH, "key-keep");
const expected = Object.keys(LEGS).length + PLANTS.length;
process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + expected + "\n");
if (asserted + skipped !== expected || expected === 0) { process.stdout.write("  FAIL the run made " + (asserted + skipped) + " of " + expected + " checks\n"); failed++; }
process.stdout.write(failed ? "key-keep: " + failed + " failed\n" : "key-keep: all " + asserted + " passed\n");
process.exit(Math.min(failed, 63));
