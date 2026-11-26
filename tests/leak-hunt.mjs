/* THE SIGNING SECRET, HUNTED STRUCTURALLY RATHER than channel by channel (the test architect's harness item, 2026-10-13).
 *
 *     node tests/leak-hunt.mjs            LEAK_HUNT_KEEP=1 keeps the scratch folder whatever the verdict
 *
 * WHY. The signed publish's legs in tests/shell-guards.mjs (2u, 2v) hunt the secret in the places someone thought of:
 * the plan, the reply, three files of the archive, said lines, stderr, env values that changed, recorded child calls.
 * Each round of review found a channel the last round had not listed. This leg replaces the listing with a fence: the
 * publish runs in a child node process of its own, in a scratch world, and what the child can reach through the channels
 * below is read back and searched whole, so a leak by a route nobody named, within those channels, is found as well as the
 * named ones. What lies outside them is said under WHAT IT CANNOT SEE, and is not claimed. Nothing in tests/shell-guards.mjs
 * is removed by this leg: how the two overlap is the chief of staff's and the lead engineer's to decide.
 *
 * THE CHILD. One node process per scenario, started with an allowlisted environment (the parent's own tokens never
 * reach it), its home, profile and temp folder moved into a fresh scratch folder (USERPROFILE, HOME, APPDATA,
 * LOCALAPPDATA, TEMP, TMP, XDG_*), its working folder a scratch folder too, and a copy of this tree (shell/, src/, ui/,
 * package.json and engine/pinned, copied for real) to run. It loads shell/main.js with ONE stand-in, 'electron', as
 * shell-guards' loadShell has it (a window class, ipcMain.handle recording handlers, safeStorage as the legs' reversible
 * seal, which spells nothing of what it sealed); src/studio-thread.cjs and child_process are the real ones, so the real
 * Worker thread runs and a real grandchild would run. It then asks the shell's own handlers for studio:publish-plan,
 * studio:publish (twice where the scenario signs, for the ring merge and the second edition) and the plan again, with the
 * page's event as ownFrame wants it. No window is opened and the window wall's variable is never read.
 *
 * WHAT IS CAPTURED:
 *   pipes       fd 1 and fd 2 at the pipe, read whole until the child's streams close, so a write from the worker
 *               thread or from a grandchild that inherited them is caught, however it was made; a grandchild that
 *               holds them more than 15 s after the child exits fails lh1e, and the pipes are closed from this side
 *   files       every file under the scratch home, the project folder, the share, the working folder and the tree copy,
 *               read back as raw bytes after the child exits, and their names
 *   file acts   every write, open for writing, rename, copy, removal and folder made, by the child, its worker and any
 *               node grandchild, recorded at the call by tests/leak-hunt-preload.cjs (NODE_OPTIONS --require), so a
 *               transient file (a .tmp sibling, a staging folder) that is gone by the end is searched too; and any such
 *               act whose path lies outside the scratch folders
 *   children    every child_process call's file, argv, whole options and environment, its own or inherited, recorded
 *               at the call by the preload, ESM named imports and import() included (syncBuiltinESMExports); the
 *               pid; and every later write or end on that child's stdin and every send on a fork channel
 *   ipc         every reply the shell's handlers give and every webContents.send or event.reply the stand-in sees,
 *               to the end of the child: the parent waits for the child to exit, never for a timer
 *   electron    every call into the electron stand-in. The stand-in is a recording Proxy, so a member the shell
 *               reaches (dialog, shell, clipboard, safeStorage, anything else) is logged with which needles its
 *               arguments carry
 *   network     net and tls connect, writes on a socket, http and https request and the bodies written to them,
 *               fetch, dgram send, and dns lookup and resolve, each by needle. A socket open is counted even when
 *               the bytes carry nothing
 *   grandchildren the pid of every child process, recorded at the call. After the scenario child exits, the parent
 *               waits for each of those pids to end, or kills a still-running node after a bound, and only then
 *               reads the end state
 *   thread      every message the worker posts back to the main thread
 *   env         the names of the child's environment variables that carry the secret when it exits, and which needles
 *   sealed      the key file's own sealed bytes (the vault blob, or the passphrase file's encrypted private field),
 *               a needle group of their own: allowed in that file and on the vault decrypt call, and nowhere else
 *   capture     the capture itself, which must hold no spelling of the secret: the preload records which needles a
 *               value carries, never the value
 *
 * THE NEEDLES. Each secret, and the private key whatever opened it, is searched as raw bytes, hex, upper hex, base64
 * and base64url (each also as it falls at byte offsets 1 and 2 of a longer stream, so a secret inside a larger base64
 * blob is found); a key's forms are taken over its bytes, a text secret's over its UTF-8 bytes (so the hex text's own
 * base64 is a needle as well as the key's), and a text secret is also searched as its upper case and UTF-16LE: the
 * vault's secret (the PKCS#8 DER in hex), the DER itself, its 32-byte Ed25519 scalar, and a passphrase where the
 * scenario has one (the test architect's product mutation m6 of 2026-10-13, base64 of the hex text written into
 * report.json, went unseen in the scenarios keyed by the vault until then). The legs' four
 * spellings (text, upper case, base64, base64url) are among them. The keys are made here for this run by the tree's own
 * makePair, never a real one, and no spelling is ever printed.
 *
 * THE SCENARIOS, each in a child of its own with a fresh scratch world: a signed publish with the key the operating
 * system keeps (the proxy reader left on, so the one real grandchild of the shell, reg.exe on Windows, is recorded
 * whole), a signed publish with a passphrase key (STUDIO_SIGNING_KEY, STUDIO_KEY_PASSPHRASE), a wrong secret from the
 * vault, a wrong passphrase, a missing key file (where the publish now makes the key: the sense pass of 2026-10-14, finding
 * 9), a key file that is not JSON, a passphrase key file tampered with, a
 * keychain that refuses, and the publisher throwing after the project is read and the key unlocked (the share replaced
 * by a file; project.json's write sibling made a folder, which throws at the publisher's last write, after the signed
 * edition and its ring are in the share).
 *
 *   lh0   the copied engine is the pin tools/engine-pin names; the needle matcher finds every form planted in noise,
 *         a secret inside a longer base64 stream at every offset, and nothing in noise alone
 *   lh1   per scenario: the child ran to its end (status 0, the driver's last line, no FAIL in either stream); the
 *         preload ran in its main thread and its worker and every one saw the scratch home; the secret crossed to the
 *         worker in publishProject where the key opens and not where it does not (the in-band positive control: the
 *         preload's matcher seen to fire on live data in every signed scenario). Each unsigned scenario has its own
 *         in-band positive: a passphrase that is in the child's env, the other key the vault opens, or the sealed
 *         bytes still in the key file
 *   lh2   per scenario: no needle on the pipes, in any file or file name, in any file act, outside the scratch folders,
 *         in any child's argv, options or env, in any reply, send or thread message, in the env at exit, on the
 *         network, on the electron stand-in, in a grandchild's stdin or fork channel, among the sealed bytes outside
 *         the key file, or in the capture. The publish phase starts no child process and opens no socket, and no
 *         child runs from publish-begin until the scenario child exits (the shell's reg.exe runs at load, before it)
 *   lh3   per scenario: the publish did what the scenario says (signed revision 2 with its ring; unsigned, the missing key's
 *         included, which the first publish no longer makes (2026-11-26); refused)
 *   lh4   CONTROLS, in a copy of the signed scenario run with LEAK_PLANT set by this leg alone: one planted leak per
 *         channel kind, each found on its channel where it was planted; the transient file found by the act channel and
 *         absent from the end state; every honest check group of lh2 seen to have something to fail on; and the
 *         capture still clean. The new channels are planted here too: a needle to a listener this control opens on
 *         127.0.0.1 (net and http, and the same for tls, https, fetch, dgram and dns), a call on the electron
 *         stand-in, a grandchild's stdin, a fork send, a detached grandchild that ignores its pipes and writes late,
 *         and the key file's sealed bytes copied into the share
 *   lh5   the real profile, Documents folder and this tree's git status are as they were
 *
 * WHAT IT CANNOT SEE, said so a green is not read for more than it is: a native grandchild (reg.exe, dbus-send) is
 * recorded at the call, but what it then writes is not; an fs call, a spawn or a socket made through process.binding
 * or a native addon bypasses the preload (the end state and the pipes still show results that landed there, and a
 * transient file would be missed); a secret split across two write calls, or two socket writes, is not flagged at the
 * call (the end files and the pipes still hold it whole where those are watched); reads are not recorded; the private
 * KeyObject in memory is not observable, so "the secret is nowhere in memory" is not claimed; an encoding outside the
 * forms above (a cipher, a hash, base32, a reversed string) is not a spelling here; the renderer is not in the picture.
 * Electron here is the recording stand-in, so every call the shell makes on it is watched, and a real Electron
 * binary's own native code is not in this run. A grandchild still holding the pipes 15 s after the child exits fails
 * lh1e and what it would have written later is not read; a grandchild still writing when the reap bound kills it is missed
 * after that kill. http2 is not patched. DNS is recorded at the call; this leg's own dns control does not put the
 * needle in the hostname, because that would ask the machine's resolver. The Linux paths (the keyring bus) run only
 * where the leg runs on Linux. In the missing-key scenario the publish goes out unsigned
 * and makes no key (it made one until 2026-11-26): the scenario hunts the passphrase it was handed. On Linux a passphrase scenario's STUDIO_KEY_PASSPHRASE, which this leg sets, is
 * allowed in the env at exit and in a child's inherited env and counted as information. The sealed bytes are allowed
 * in the key file and as the argument of safeStorage decryptString or encryptString, which is the vault call, and a
 * copy anywhere else is a finding.
 *
 * Node only, no window. Exit 0 when every check holds, 1 when any fails.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { Worker } from "node:worker_threads";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import Module from "node:module";
import { seatEnvSync } from "./seated.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PRELOAD = path.join(HERE, "leak-hunt-preload.cjs");
const SELF = fileURLToPath(import.meta.url);
const COUNT = { asserted: 0, failed: 0 };

/* safeStorage as the legs stand it in: a reversible seal that is no spelling of what it sealed. */
const FAKE_VAULT = {
  isEncryptionAvailable: () => true,
  encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
  decryptString: (b) => { const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8"); },
};
/* A keychain that refuses, as one does when the account cannot reach it. */
const REFUSING_VAULT = {
  isEncryptionAvailable: () => false,
  encryptString: () => { throw new Error("the keychain refused"); },
  decryptString: () => { throw new Error("the keychain refused"); },
};

/* THE ELECTRON STAND-IN AS A RECORDING PROXY. Every call and every property set is handed to the preload,
   which keeps the needle indices and never the bytes. Objects are wrapped; arrays, buffers and promises are not,
   because wrapping those breaks their internal slots. A method keeps the raw object as its receiver, so a method
   pulled off by destructuring still runs on the stand-in. */
function watchElectron(root, leak) {
  const seen = new WeakMap();
  const skip = new Set(["then", "constructor", "toJSON", "prototype", "caller", "arguments"]);
  const isObj = (v) => {
    if (!v || typeof v !== "object") return false;
    if (Array.isArray(v) || Buffer.isBuffer(v) || ArrayBuffer.isView(v)) return false;
    if (v instanceof Date || v instanceof Promise || v instanceof Error || v instanceof Map || v instanceof Set || v instanceof RegExp) return false;
    if (typeof v.then === "function") return false;
    return true;
  };
  const log = (member, args) => { try { leak.electron(member, args); } catch { /* the capture never stops the call */ } };
  const watchReturn = (v, member) => typeof v === "function" ? asFn(v, member, null) : (isObj(v) ? asObj(v, member) : v);
  function asObj(obj, member) {
    if (seen.has(obj)) return seen.get(obj);
    const p = new Proxy(obj, {
      get(t, prop, recv) {
        if (typeof prop === "symbol" || skip.has(prop)) return Reflect.get(t, prop, recv);
        const v = Reflect.get(t, prop, recv);
        const pathName = member ? member + "." + String(prop) : String(prop);
        if (typeof v === "function") return asFn(v, pathName, t);
        if (isObj(v)) return asObj(v, pathName);
        return v;
      },
      set(t, prop, value, recv) {
        log((member ? member + "." : "") + String(prop) + "=", [value]);
        return Reflect.set(t, prop, value, recv);
      },
    });
    seen.set(obj, p);
    return p;
  }
  function asFn(fn, member, thisArg) {
    return new Proxy(fn, {
      apply(_t, th, args) {
        log(member, args);
        const ret = Reflect.apply(fn, thisArg || th, args);
        return watchReturn(ret, member);
      },
      construct(_t, args) {
        log("new " + member, args);
        return watchReturn(Reflect.construct(fn, args), member);
      },
      get(_t, prop, recv) {
        if (prop === "prototype") return fn.prototype;
        if (typeof prop === "symbol" || skip.has(prop)) return Reflect.get(fn, prop, recv);
        const v = Reflect.get(fn, prop, recv);
        const pathName = member + "." + String(prop);
        if (typeof v === "function") return asFn(v, pathName, fn);
        if (isObj(v)) return asObj(v, pathName);
        return v;
      },
    });
  }
  return asObj(root, "");
}

let SCRATCH = null;   // the parent's scratch folder, named on a throw so a broken run can be read (Clement chi's C3)
if (process.env.LEAK_ROLE === "child") await child();
else await parent().catch((e) => {
  /* the hunt itself broke: said as a failure with the counts line, never a stack trace in place of a verdict */
  process.stdout.write("  FAIL the hunt itself threw: " + String(e && e.message || e).slice(0, 300) + "\n");
  if (SCRATCH) process.stdout.write("  info scratch kept at " + SCRATCH + "\n");
  console.log("#counts checks=" + (COUNT.asserted + 1) + " failed=" + (COUNT.failed + 1));
  process.exit(1);
});

/* =================================================================================================================
 * THE CHILD: the publish, in a process of its own. Nothing here prints a secret; what it says goes through the
 * preload's redact. */
async function child() {
  const L = globalThis.__leak;
  const say = (s) => fs.writeSync(1, "driver  " + (L ? L.redact(s) : s) + "\n");
  const fail = (s) => fs.writeSync(2, "  FAIL driver  " + (L ? L.redact(s) : s) + "\n");
  if (!L) { fail("the capture preload did not run in the child"); process.exitCode = 3; return; }
  const TREE = process.env.LEAK_TREE, PROJECTS = process.env.LEAK_PROJECTS, SHARE = process.env.LEAK_SHARE, CAP = process.env.LEAK_CAP;
  const sc = JSON.parse(process.env.LEAK_SCENARIO), plants = JSON.parse(process.env.LEAK_PLANTS || "{}");
  const PLANT = process.env.LEAK_PLANT === "1";
  const UD = path.join(process.env.APPDATA, "etiuda-studio");
  try {
    const S = await import(pathToFileURL(path.join(TREE, "src", "studio.mjs")).href);
    fs.mkdirSync(UD, { recursive: true });
    /* A Studio that works, as a lead's does: signed in under a trial a throwaway root signed (the gate refuses a publish of one that does not). */
    Object.assign(process.env, seatEnvSync(UD, {}));
    /* SETUP, before the publish phase: a project over one card, a share beside it. */
    const made = await S.newProject(PROJECTS, "Signed", [{ code: "en", name: "English" }]);
    const shelf = (await S.addTag(made.dir, "shelf", { en: "General" })).tag.id;
    await S.addCard(made.dir, shelf, "Widuma tosork", "Sarnesk kelbun.");
    fs.mkdirSync(SHARE, { recursive: true });
    await S.setPublishFolder(made.dir, SHARE);
    /* THE PUBLISHER THROWING after the project is read and the key unlocked. */
    if (sc.mutate === "share-file") { fs.rmSync(SHARE, { recursive: true, force: true }); fs.writeFileSync(SHARE, "not a folder\n"); }
    /* writeWhole's sibling for project.json made to refuse: the publisher's last write (src/publish.mjs, the project's own
       record moves last) throws, after the archive, the share's edition and its ring are written. */
    if (sc.mutate === "project-tmp-dir") { /* intercepted in tests/leak-hunt-preload.cjs */ }

    /* ---- the electron stand-in, as tests/shell-guards.mjs loadShell has it, minus its child_process and thread stubs ---- */
    const UI = path.join(TREE, "ui", "index.html");
    const handlers = {}, windows = [];
    const sent = (kind) => (ch, ...a) => L.ipc(kind, ch, a);
    class Win {
      constructor() {
        this.webContents = { id: 1, on() {}, once() {}, send: sent("send"), setWindowOpenHandler() {}, getURL: () => pathToFileURL(UI).href, reload() {}, forcefullyCrashRenderer() {} };
        windows.push(this);
      }
      on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; } close() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
    }
    const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
    const electron = {
      app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
             getPath: (n) => n === "documents" ? path.join(process.env.USERPROFILE, "Documents") : UD, getVersion: () => "0.0.0", getLocale: () => "en-GB",
             requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(), on() {}, quit() {}, exit() {} },
      BrowserWindow: Object.assign(Win, { fromWebContents: () => windows[0] || null, getAllWindows: () => windows }),
      Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
      dialog: { showMessageBox: () => Promise.resolve({ response: 0 }), showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }), showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
      nativeTheme: { themeSource: "system" }, safeStorage: sc.vault === "refuse" ? REFUSING_VAULT : FAKE_VAULT,
      screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
      session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {}, setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
      shell: { openPath: () => Promise.resolve("") }, clipboard: { writeText() {}, readText: () => "" }, ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on() {} },
    };
    const watched = watchElectron(electron, L);
    const load = Module._load;
    Module._load = function (req) { return req === "electron" ? watched : load.apply(this, arguments); };
    try { createRequire(SELF)(path.join(TREE, "shell", "main.js")); } finally { Module._load = load; }
    for (let i = 0; i < 1250 && !windows.length; i++) await new Promise((r) => setTimeout(r, 20));
    if (!windows.length) { fail("the shell made no window"); process.exitCode = 3; return; }
    const wc = windows[0].webContents;
    const event = { senderFrame: { parent: null, url: pathToFileURL(UI).href }, sender: wc, reply: sent("event.reply") };
    const ask = async (ch, ...a) => {
      try { const v = await handlers[ch](event, ...a); L.ipc("reply", ch, v); return v; }
      catch (e) { L.ipc("throw", ch, e); throw e; }
    };

    /* ---- the publish phase ---- */
    L.phase("publish-begin");
    const plan = await ask("studio:publish-plan", made.dir);
    /* THE THREE REFUSALS THE PUBLISH REACHES WITH THE SECRET IN HAND, each its own scenario (the second proof of
       2026-10-13: no scenario drove them, so a leak planted on any of them went unseen): the project gone between the
       plan and the publish (readProject throws before publishProject's try); the archive holding the edition's name as
       a file, which editionsIn does not count as taken, so the publisher's own immutable-archive refusal answers; and,
       for the second publish, the share's file replaced by a catalog of another id (the TAKEN refusal). */
    if (sc.mutate === "project-gone") fs.rmSync(path.join(made.dir, "project.json"));
    if (sc.mutate === "archive-taken") {
      if (!plan || !plan.edition) { fail("the plan named no edition for the archive to hold"); process.exitCode = 3; return; }
      fs.mkdirSync(path.join(made.dir, "archive"), { recursive: true });
      fs.writeFileSync(path.join(made.dir, "archive", String(plan.edition)), "an edition's name, held by a file\n");
    }
    const replies = [];
    for (let i = 0; i < sc.publishes; i++) {
      if (i === 1 && sc.mutate === "share-taken") {
        const ec = fs.readdirSync(SHARE).find((f) => /\.ec$/.test(f));
        if (!ec) { fail("the first publish left no edition in the share to replace"); process.exitCode = 3; return; }
        fs.writeFileSync(path.join(SHARE, ec), JSON.stringify({ id: "another-catalog-entirely" }) + "\n");
      }
      replies.push(await ask("studio:publish", made.dir, { notes: "leak hunt " + (i + 1) }));
    }
    const plan2 = await ask("studio:publish-plan", made.dir);
    L.phase("publish-end");
    /* UNSIGNED IN-BAND. The other key is live only as what the vault opens, which never crosses to the worker, so the
       matcher is shown it here. The value is not written anywhere; the preload keeps the indices. */
    if (sc.key === "os-wrong") {
      try {
        const doc = JSON.parse(fs.readFileSync(path.join(UD, "signing-key.json"), "utf8"));
        const opened = FAKE_VAULT.decryptString(Buffer.from(String(doc.private), "base64"));
        L.saw("opened", opened);
      } catch (e) {
        fail("the opened-secret probe could not run: " + String(e && e.message || e).slice(0, 160));
      }
    }
    const sig = (p) => p && p.signing ? { opens: !!p.signing.opens, keyId: p.signing.keyId || null, unreadable: !!p.signing.unreadable, makes: !!p.signing.makes } : null;
    say("result " + JSON.stringify({ plan: sig(plan), planError: plan && plan.error || null, plan2: sig(plan2), project: made.dir,
      replies: replies.map((r) => ({ error: r && r.error ? String(r.error).slice(0, 240) : null, rev: r && r.rev != null ? r.rev : null, refused: r && r.refused || null, ec: r && r.ec ? path.basename(String(r.ec)) : null })) }));

    if (PLANT) await plant({ TREE, SHARE, PROJECTS, CAP, plants, wc, handlers, ask, say, electron: watched });
  } catch (e) {
    fail("threw: " + String(e && e.stack || e).split("\n").slice(0, 5).join(" | "));
    process.exitCode = 3;
    return;
  }
  say("done");
}

/* THE POSITIVE CONTROLS: one planted leak per channel kind, each with the spelling the parent chose for it (LEAK_PLANTS
   names a needle by index, never by its bytes), each marked so the parent can say where it was found. */
async function plant(o) {
  const n = JSON.parse(fs.readFileSync(path.join(o.CAP, "needles.json"), "utf8")), mask = Buffer.from(n.mask, "hex");
  const needle = (name) => { const b = Buffer.from(n.needles[o.plants[name]], "hex"); for (let i = 0; i < b.length; i++) b[i] ^= mask[i % mask.length]; return b; };
  const req = createRequire(SELF), cp = req("node:child_process");
  const mark = (m, b) => Buffer.concat([Buffer.from(m + " "), b, Buffer.from("\n")]);
  const TEMP = os.tmpdir(), CWD = process.cwd();
  fs.writeSync(1, mark("planted-stdout", needle("stdout")));
  process.stderr.write(mark("planted-stderr", needle("stderr")));
  /* the worker: its fd 1 and a message it posts back */
  const w = new Worker("const { parentPort, workerData } = require('node:worker_threads'); const fs = require('node:fs'); const b = Buffer.from(workerData.b);"
    + " fs.writeSync(1, Buffer.concat([Buffer.from('planted-worker '), b, Buffer.from([10])])); parentPort.postMessage({ back: b });",
    { eval: true, workerData: { b: needle("worker") } });
  w.on("message", () => {});
  await new Promise((r) => w.on("exit", r));
  fs.writeFileSync(path.join(o.SHARE, "planted-share.txt"), mark("x", needle("share-file")));
  fs.writeFileSync(path.join(o.PROJECTS, "planted-project.txt"), mark("x", needle("project-file")));
  fs.writeFileSync(path.join(TEMP, "planted-home.bin"), Buffer.concat([crypto.randomBytes(7), needle("home-raw"), crypto.randomBytes(5)]));
  fs.writeFileSync(path.join(CWD, "planted-cwd.txt"), mark("x", needle("cwd-file")));
  fs.writeFileSync(path.join(o.TREE, "planted-tree.txt"), mark("x", needle("tree-file")));
  const tr = path.join(o.PROJECTS, "planted-transient.tmp");
  fs.writeFileSync(tr, mark("x", needle("transient"))); fs.unlinkSync(tr);
  fs.writeFileSync(path.join(o.SHARE, needle("file-name").toString("latin1") + ".txt"), "x\n");
  /* grandchildren: argv, own env, options, an ESM named import, an import(), an inherited env, and one that writes */
  cp.spawnSync(process.execPath, ["-e", "0", "planted-argv", needle("argv").toString("latin1")]);
  cp.spawnSync(process.execPath, ["-e", "0", "planted-env"], { env: Object.assign({}, process.env, { PLANTED: needle("env").toString("latin1") }) });
  cp.spawnSync(process.execPath, ["-e", "0", "planted-options"], { input: needle("options") });
  spawnSync(process.execPath, ["-e", "0", "planted-esm", needle("esm").toString("latin1")]);
  (await import("node:child_process")).execFileSync(process.execPath, ["-e", "0", "planted-dynamic", needle("dynamic").toString("latin1")]);
  process.env.PLANTED_INHERIT = needle("inherit").toString("latin1");
  cp.spawnSync(process.execPath, ["-e", "0", "planted-inherit"]);
  delete process.env.PLANTED_INHERIT;
  cp.spawnSync(process.execPath, ["-e", "const fs = require('fs'), p = require('path'); const n = JSON.parse(fs.readFileSync(p.join(process.env.LEAK_CAP, 'needles.json'), 'utf8'));"
    + " const m = Buffer.from(n.mask, 'hex'), b = Buffer.from(n.needles[+process.env.LEAK_GC], 'hex'); for (let i = 0; i < b.length; i++) b[i] ^= m[i % m.length];"
    + " fs.writeSync(1, Buffer.concat([Buffer.from('planted-grandchild '), b, Buffer.from([10])])); fs.writeFileSync(p.join(require('os').tmpdir(), 'planted-grandchild.txt'), b);", "planted-grandchild"],
    { env: Object.assign({}, process.env, { LEAK_GC: String(o.plants.grandchild) }), stdio: ["ignore", "inherit", "inherit"] });
  /* a grandchild that outlives the driver and writes to the stdout it inherited about a second later: the parent must
     read until the streams close, not stop at the child's exit (Clement chi's C8; his arm H2 showed that loss is silent).
     Detached, because on Windows libuv puts every other child in a job that dies with its parent (measured 2026-10-13:
     undetached, it never wrote). */
  const lateKid = cp.spawn(process.execPath, ["-e", "setTimeout(() => { const fs = require('fs'), p = require('path'); const n = JSON.parse(fs.readFileSync(p.join(process.env.LEAK_CAP, 'needles.json'), 'utf8'));"
    + " const m = Buffer.from(n.mask, 'hex'), b = Buffer.from(n.needles[+process.env.LEAK_GC], 'hex'); for (let i = 0; i < b.length; i++) b[i] ^= m[i % m.length];"
    + " fs.writeSync(1, Buffer.concat([Buffer.from('planted-late-grandchild '), b, Buffer.from([10])])); }, 1000);", "planted-late-grandchild"],
    { env: Object.assign({}, process.env, { LEAK_GC: String(o.plants["late-grandchild"]) }), stdio: ["ignore", "inherit", "inherit"], detached: true, windowsHide: true });
  lateKid.on("error", (e) => o.say("planted handle late kid " + String(e && (e.code || e.message) || e)));
  lateKid.unref();
  if (process.env.LEAK_BYSTANDER) fs.appendFileSync(path.join(o.CAP, "events-bystander.ndjson"),
    JSON.stringify({ ev: "child-pid", pid: +process.env.LEAK_BYSTANDER, parent: process.pid, op: "spawn", at: Date.now() }) + "\n");
  /* ---- C5 to C7: one plant per new channel, each on 127.0.0.1 or on the stand-in, never a real network ---- */
  const net = req("node:net"), tls = req("node:tls"), http = req("node:http"), https = req("node:https");
  const dgram = req("node:dgram"), dns = req("node:dns");
  const listen = (srv) => new Promise((resolve, reject) => { srv.once("error", reject); srv.listen(0, "127.0.0.1", () => resolve(srv.address().port)); });
  const stop = (srv) => new Promise((resolve) => { try { srv.close(() => resolve()); } catch { resolve(); } });
  {
    const tcp = net.createServer((s) => { s.on("error", () => {}); s.resume(); });
    const port = await listen(tcp);
    await new Promise((resolve, reject) => {
      const sock = net.connect({ port, host: "127.0.0.1", planted: needle("net").toString("latin1"), note: "planted-net" });
      sock.on("error", reject);
      sock.on("connect", () => { sock.write(mark("planted-net", needle("net"))); sock.end(); });
      sock.on("close", resolve);
    });
    await stop(tcp);
  }
  {
    const web = http.createServer((rq, rs) => { rq.on("error", () => {}); rq.resume(); rs.end("ok"); });
    const port = await listen(web);
    await new Promise((resolve, reject) => {
      const r = http.request({ host: "127.0.0.1", port, method: "POST", path: "/planted-http" }, (rs) => { rs.resume(); rs.on("end", resolve); });
      r.on("error", reject);
      r.end(mark("planted-http", needle("http")));
    });
    await new Promise((resolve) => {
      const r = https.request({ host: "127.0.0.1", port, method: "POST", path: "/planted-https", rejectUnauthorized: false, timeout: 400 }, () => {});
      r.on("error", () => resolve());
      r.on("timeout", () => { r.destroy(); resolve(); });
      r.end(mark("planted-https", needle("https")));
      setTimeout(resolve, 400);
    });
    await fetch("http://127.0.0.1:" + port + "/planted-fetch", { method: "POST", body: mark("planted-fetch", needle("fetch")) });
    await stop(web);
  }
  {
    const udp = dgram.createSocket("udp4");
    await new Promise((resolve, reject) => { udp.once("error", reject); udp.bind(0, "127.0.0.1", resolve); });
    const sender = dgram.createSocket("udp4");
    await new Promise((resolve, reject) => {
      sender.once("error", reject);
      sender.send(mark("planted-dgram", needle("dgram")), udp.address().port, "127.0.0.1", () => { sender.close(); udp.close(); resolve(); });
    });
  }
  await new Promise((resolve) => {
    const sock = tls.connect({ host: "127.0.0.1", port: 1, rejectUnauthorized: false, planted: needle("tls").toString("latin1"), note: "planted-tls" }, () => {});
    const done = () => { try { sock.destroy(); } catch { /* already closed */ } resolve(); };
    sock.on("error", done);
    setTimeout(done, 300);
  });
  /* DNS: the needle sits on an option lookup does not put on the wire. The hostname stays 127.0.0.1, which is numeric.
     resolve is called with a rejected rrtype so it throws before any query. */
  await new Promise((resolve, reject) => dns.lookup("127.0.0.1", { family: 4, note: "planted-dns", planted: needle("dns").toString("latin1") }, (err) => err ? reject(err) : resolve()));
  try { dns.resolve("127.0.0.1", "NOPE", needle("dns-resolve").toString("latin1"), "planted-dns-resolve"); } catch { /* invalid rrtype, before any query */ }
  try { await dns.promises.lookup("127.0.0.1", { family: 4, note: "planted-dns", planted: needle("dns").toString("latin1") }); } catch { /* numeric lookup has no network */ }
  /* electron: an existing member, so the call really enters the stand-in. The detail carries the needle. */
  await o.electron.dialog.showMessageBox({ title: "planted-electron", detail: needle("electron").toString("latin1") });
  o.electron.clipboard.writeText(needle("electron").toString("latin1"));
  /* grandchild stdin, write and end, and a fork channel send */
  /* THE PLANTED GRANDCHILDREN END ON WHAT THEY WERE SENT, NOT ON A CLOCK, AND NONE OF THEM CAN END THE DRIVER (the rerun of
     2026-10-16). The stdin kid used to exit 400 ms after it started; a driver held off its event loop past that (an idle or
     loaded desk) then made its queued write to a closed pipe, and the EPIPE, with no listener, ended the driver with status 1
     before its late send. Now the kid exits on its stdin's end, the fork on its message, each with a fallback far past any
     wait, and every planted handle's error is said as a driver line rather than thrown. What each one carries is captured
     at the call by the preload, so the plants mean what they meant. */
  const said = (what) => (e) => o.say("planted handle " + what + " " + String(e && (e.code || e.message) || e));
  const inKid = cp.spawn(process.execPath, ["-e", "process.stdin.on('end', () => process.exit(0)); process.stdin.resume(); setTimeout(() => process.exit(0), 30000);", "planted-stdin"], { stdio: ["pipe", "ignore", "ignore"], windowsHide: true });
  inKid.on("error", said("stdin kid"));
  inKid.stdin.on("error", said("stdin kid's pipe"));
  inKid.stdin.write(mark("planted-stdin", needle("stdin")));
  inKid.stdin.end(mark("planted-stdin-end", needle("stdin-end")));
  const forkScript = path.join(CWD, "planted-fork-child.cjs");
  fs.writeFileSync(forkScript, "process.on('message', () => process.exit(0)); setTimeout(() => process.exit(0), 30000);\n");
  const forked = cp.fork(forkScript, ["planted-fork"], { stdio: ["ignore", "ignore", "ignore", "ipc"], windowsHide: true });
  forked.on("error", said("fork"));
  forked.send(mark("planted-fork", needle("fork")).toString("latin1"));
  /* a detached grandchild whose pipes are ignored, writing a needle a moment later into the share. The parent's pipe
     close does not wait for it; the pid reap does. Detached, because on Windows any other child dies with this one. */
  const ignored = cp.spawn(process.execPath, ["-e", "setTimeout(() => { const fs = require('fs'), p = require('path'); const n = JSON.parse(fs.readFileSync(p.join(process.env.LEAK_CAP, 'needles.json'), 'utf8'));"
    + " const m = Buffer.from(n.mask, 'hex'), b = Buffer.from(n.needles[+process.env.LEAK_GC], 'hex'); for (let i = 0; i < b.length; i++) b[i] ^= m[i % m.length];"
    + " fs.writeFileSync(p.join(process.env.LEAK_LATE_DIR, 'planted-ignored-pipes.txt'), Buffer.concat([Buffer.from('planted-ignored-pipes '), b, Buffer.from([10])])); process.exit(0); }, 2500);", "planted-ignored-pipes"],
    { env: Object.assign({}, process.env, { LEAK_GC: String(o.plants["ignored-pipes"]), LEAK_LATE_DIR: o.SHARE }), stdio: "ignore", detached: true, windowsHide: true });
  ignored.on("error", said("ignored-pipes kid"));
  ignored.unref();
  /* the key file's sealed private field, copied into the share. It is not a spelling of the opened secret. */
  {
    const keyPath = path.join(process.env.APPDATA, "etiuda-studio", "signing-key.json");
    const doc = JSON.parse(fs.readFileSync(keyPath, "utf8"));
    fs.writeFileSync(path.join(o.SHARE, "planted-sealed.txt"), "planted-sealed " + String(doc.private) + "\n");
  }
  /* ipc: a handler's reply, and a send made late, after the driver's last line */
  o.handlers["planted:reply"] = () => ({ x: needle("reply").toString("latin1") });
  await o.ask("planted:reply");
  process.env.PLANTED_EXIT = needle("exit-env").toString("latin1");
  setTimeout(() => { o.wc.send("planted:late", { x: needle("send").toString("latin1") }); o.say("late send made"); }, 400);
}

/* =================================================================================================================
 * THE PARENT */
async function parent() {
  const { dropScratch } = await import(pathToFileURL(path.join(HERE, "scratch.mjs")).href);
  const check = (cond, line) => { COUNT.asserted++; if (cond) process.stdout.write("  ok   " + line + "\n"); else { COUNT.failed++; process.stdout.write("  FAIL " + line + "\n"); } };
  const info = (line) => process.stdout.write("  info " + line + "\n");
  const t0 = Date.now();
  const lower = (p) => process.platform === "win32" ? String(p).toLowerCase() : String(p);
  const under = (p, roots) => { const x = lower(path.resolve(p)); return roots.some((r) => { const y = lower(path.resolve(r)); return x === y || x.startsWith(y + path.sep); }); };
  const isKeyFile = (rel) => /(^|\/)(signing-key|passphrase-key)\.json$/.test(String(rel).split(path.sep).join("/"));
  const pidAlive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return !!(e && e.code === "EPERM"); } };
  const pidIsNode = (pid) => {
    try {
      const exe = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tasklist.exe");
      const out = execFileSync(exe, ["/FI", "PID eq " + pid, "/FO", "CSV", "/NH"], { encoding: "utf8", windowsHide: true, timeout: 8000 });
      if (/No tasks/i.test(out)) return false;
      if (/node\.exe/i.test(out)) return true;
      return false;
    } catch { return true; }
  };
  /* WHETHER A PID IS STILL THE PROCESS RECORDED (Claude alpha's condition, 2026-10-13 03:40). This laptop runs many seats'
     node processes, and a pid freed by a grandchild can be reused by another seat's test or tool within seconds, so the
     reap kills only a process whose parent is the one that spawned it and whose creation lies within 10 s of the record,
     read with Win32_Process, the reader tools/stray-check.sh uses. Anything else, or anything unreadable, is spared and
     reported. Off Windows the parent is read from /proc; a detached grandchild there is re-parented when its parent
     exits, so it is spared rather than killed, which errs towards leaving a process and never towards killing a stranger. */
  const stillRecorded = (rec) => {
    try {
      if (process.platform === "win32") {
        const ps = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
        const out = String(execFileSync(ps, ["-NoProfile", "-NonInteractive", "-Command", "$p = Get-CimInstance Win32_Process -Filter 'ProcessId=" + Number(rec.pid) + "'; if ($p) { '' + $p.ParentProcessId + ' ' + $p.CreationDate.ToUniversalTime().ToString('o') }"],
          { encoding: "utf8", windowsHide: true, timeout: 15000 })).trim();
        const m = /^(\d+) (\S+)$/.exec(out);
        if (!m) return { same: false, why: out ? "unreadable" : "gone" };
        const parentOk = +m[1] === Number(rec.parent), born = Date.parse(m[2]), timeOk = Math.abs(born - Number(rec.at)) <= 10000;
        return { same: parentOk && timeOk, why: (parentOk ? "" : "parent " + m[1] + " not " + rec.parent) + (timeOk ? "" : (parentOk ? "" : ", ") + "born " + Math.round((born - Number(rec.at)) / 1000) + " s from the record") };
      }
      const st = fs.readFileSync("/proc/" + Number(rec.pid) + "/stat", "utf8");
      const ppid = +st.slice(st.lastIndexOf(")") + 2).split(" ")[1];
      return { same: ppid === Number(rec.parent), why: ppid === Number(rec.parent) ? "" : "parent " + ppid + " not " + rec.parent };
    } catch (e) { return { same: false, why: "unreadable" }; }
  };
  /* Grandchildren recorded by pid. The child's stdio close does not wait for one whose pipes were ignored. */
  const reapGrandchildren = async (cap, selfPid) => {
    const recs = new Map();
    let names = [];
    try { names = fs.readdirSync(cap); } catch { return; }
    for (const f of names) if (/^events-.*\.ndjson$/.test(f)) {
      for (const l of fs.readFileSync(path.join(cap, f), "utf8").split("\n")) {
        if (!l) continue;
        let e; try { e = JSON.parse(l); } catch { continue; }
        if (e && e.ev === "child-pid" && e.pid && e.pid !== selfPid && e.pid !== process.pid) recs.set(e.pid, e);
      }
    }
    const bound = 5000;
    const spared = [];
    await Promise.all(Array.from(recs.values()).map(async (rec) => {
      const pid = rec.pid;
      const t0 = Date.now();
      while (pidAlive(pid)) {
        if (Date.now() - t0 >= bound) {
          if (pidIsNode(pid)) {
            const id = stillRecorded(rec);
            if (id.same) { try { process.kill(pid); } catch { /* already gone */ } }
            else spared.push({ pid, why: id.why || "not the process recorded" });
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 40));
      }
    }));
    return spared;
  };

  /* ---- lh0: the pin, and the matcher on its own ---- */
  const pinFile = path.join(ROOT, "engine", "pinned", ".engine-pin.json");
  const want = (/ENGINE_PIN=(\w+)/.exec(fs.readFileSync(path.join(ROOT, "tools", "engine-pin"), "utf8")) || [])[1];
  const pin = fs.existsSync(pinFile) ? JSON.parse(fs.readFileSync(pinFile, "utf8")).pin : null;
  check(!!want && pin === want, "lh0a the engine under engine/pinned is the pin tools/engine-pin names (" + String(pin).slice(0, 7) + ")");
  if (!pin) { finish(); return; }
  {
    const b = crypto.randomBytes(48), t = crypto.randomBytes(48).toString("base64url");
    const ns = formsOf("x", b, null).concat(formsOf("xt", Buffer.from(b.toString("hex")), b.toString("hex"))).concat(formsOf("p", Buffer.from(t), t));
    const missed = ns.filter((x) => !scan(Buffer.concat([crypto.randomBytes(31), x.bytes, crypto.randomBytes(17)]), ns).has(ns.indexOf(x)));
    check(missed.length === 0, "lh0b the matcher finds each of the " + ns.length + " forms of a 48-byte key and a text secret planted in noise (" + missed.length + " missed)");
    let inB64 = 0, shots = 0;
    for (const enc of ["base64", "base64url"]) for (let k = 0; k < 6; k++) {
      shots++;
      const stream = Buffer.from(Buffer.concat([crypto.randomBytes(k), b, crypto.randomBytes(5)]).toString(enc));
      if (scan(stream, ns).size > 0) inB64++;
    }
    check(inB64 === shots, "lh0c a key inside a longer base64 or base64url stream is found at every byte offset 0 to 5 (" + inB64 + " of " + shots + ")");
    const noise = crypto.randomBytes(1 << 16);
    check(scan(noise, ns).size === 0, "lh0d 64 KiB of noise holds none of the forms (a matcher that finds everything would pass lh4 and fail here)");
  }

  /* ---- the scratch: one tree copy, one world per scenario ---- */
  const BASE = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-leak-hunt-"));
  SCRATCH = BASE;
  const TREE = path.join(BASE, "tree");
  /* What the package ships (electron-builder.js files): service/licence/requests.mjs included, which src/licence-client.mjs imports,
     and which the shell's publish now reaches through the sign-in wait (Hydrogen's finding 5: signInWaitsNow reads signInOffer).
     Without it the tree held less than an installed Studio, and every publish here failed to load that module. */
  for (const p of ["shell", "src", "ui", "package.json", path.join("engine", "pinned"), path.join("service", "licence", "requests.mjs")]) fs.cpSync(path.join(ROOT, p), path.join(TREE, p), { recursive: true });
  const Sg = await import(pathToFileURL(path.join(TREE, "src", "sign.mjs")).href);

  const realCanary = () => {
    const stat = (p) => { try { const s = fs.statSync(p); return s.isDirectory() ? "dir:" + fs.readdirSync(p).length + ":" + s.mtimeMs : "file:" + s.size + ":" + s.mtimeMs; } catch { return "absent"; } };
    const g = spawnSync("git", ["-C", ROOT, "status", "--porcelain=v1", "--ignored"], { encoding: "utf8" });
    const ad = process.env.APPDATA || path.join(os.homedir(), ".config"), la = process.env.LOCALAPPDATA || path.join(os.homedir(), ".local");
    return JSON.stringify([stat(path.join(ad, "etiuda-studio")), stat(path.join(ad, "Etiuda Studio")), stat(path.join(la, "etiuda-studio")),
      stat(path.join(os.homedir(), "Documents", "Etiuda Studio")), g.status === 0 ? crypto.createHash("sha256").update(g.stdout).digest("hex") : "git-unavailable"]);
  };
  const canaryBefore = realCanary();

  const SCENARIOS = [
    { name: "signed-os", key: "os", vault: "ok", proxy: true, publishes: 2, expect: "signed" },
    { name: "signed-passphrase", key: "passphrase", vault: "ok", publishes: 1, expect: "signed" },
    { name: "wrong-secret-os", key: "os-wrong", vault: "ok", publishes: 1, expect: "unsigned" },
    { name: "wrong-passphrase", key: "passphrase-wrong", vault: "ok", publishes: 1, expect: "unsigned" },
    { name: "key-missing", key: "missing", vault: "ok", publishes: 1, expect: "unsigned" }, /* was expect "made": the first publish made the key, retired 2026-11-26 */
    { name: "key-not-json", key: "os-not-json", vault: "ok", publishes: 1, expect: "unsigned" },
    { name: "key-tampered", key: "passphrase-tampered", vault: "ok", publishes: 1, expect: "unsigned" },
    { name: "keychain-refuses", key: "os", vault: "refuse", publishes: 1, expect: "unsigned" },
    { name: "throws-at-share", key: "os", vault: "ok", publishes: 1, mutate: "share-file", expect: "error" },
    { name: "throws-late", key: "os", vault: "ok", publishes: 1, mutate: "project-tmp-dir", expect: "error" },
    { name: "project-gone", key: "os", vault: "ok", publishes: 1, mutate: "project-gone", expect: "error" },
    { name: "archive-taken", key: "os", vault: "ok", publishes: 1, mutate: "archive-taken", expect: "error" },
    { name: "share-taken", key: "os", vault: "ok", publishes: 2, mutate: "share-taken", expect: "error" },
    { name: "planted", key: "os", vault: "ok", publishes: 1, expect: "signed", plant: true },
  ];
  /* Which spelling each control plants: every form kind is used at least once across them. */
  const PLANTS = {
    stdout: "the DER as hex", stderr: "the DER as base64 at offset 1", worker: "the DER as upper hex",
    "share-file": "the scalar as base64url", "project-file": "the DER as base64url at offset 2", "home-raw": "the DER as raw bytes",
    "cwd-file": "the vault's secret (the DER in hex) as UTF-16LE text", "tree-file": "the scalar as base64 at offset 2", transient: "the scalar as upper hex",
    "file-name": "the scalar as hex", argv: "the DER as base64", env: "the scalar as base64url at offset 1", options: "the scalar as raw bytes",
    esm: "the DER as base64url", dynamic: "the scalar as base64", inherit: "the scalar as hex",
    grandchild: "the DER as base64 at offset 2", reply: "the scalar as base64url at offset 2", send: "the DER as base64url at offset 1",
    "exit-env": "the scalar as base64 at offset 1", "late-grandchild": "the scalar as base64url",
    net: "the vault's secret (the DER in hex) as text", connect: "the vault's secret (the DER in hex) as text",
    http: "the vault's secret (the DER in hex) as upper-case text",
    https: "the vault's secret (the DER in hex) as hex", fetch: "the vault's secret (the DER in hex) as base64",
    dgram: "the vault's secret (the DER in hex) as base64url", dns: "the vault's secret (the DER in hex) as raw bytes",
    "dns-resolve": "the vault's secret (the DER in hex) as upper hex", tls: "the vault's secret (the DER in hex) as base64 at offset 1",
    electron: "the vault's secret (the DER in hex) as base64 at offset 2", stdin: "the vault's secret (the DER in hex) as base64url at offset 1",
    "stdin-end": "the vault's secret (the DER in hex) as base64url at offset 2",
    /* same bytes as net and http, found on different channels: fork's send and the late ignored-pipes file */
    fork: "the vault's secret (the DER in hex) as text", "ignored-pipes": "the vault's secret (the DER in hex) as upper-case text",
  };

  /* Each new refusal scenario's reach probe: the words of the refusal it drives, and which publish answers it. */
  const REACH = {
    "project-gone": [/^no project\.json in /, 0],
    "archive-taken": [/the archive already holds/, 0],
    "share-taken": [/which is another catalog/, 1],
  };
  const groups = {};   // honest check groups that ever had something to fail on, from the planted run
  for (const sc of SCENARIOS) {
    const W = path.join(BASE, sc.name);
    const D = (...p) => path.join(W, ...p);
    for (const d of ["home/AppData/Roaming/etiuda-studio", "home/AppData/Local/Temp", "home/Documents", "project", "share", "capture", "cwd"]) fs.mkdirSync(D(d), { recursive: true });
    const UD = D("home/AppData/Roaming/etiuda-studio");

    /* the keys, made here for this run, and their needles */
    const needles = [], env = {}, allowEnv = [];
    let sealedDoc = null;
    const keyNeedles = (pair) => {
      const der = Buffer.from(pair.der, "hex");
      const scalar = Buffer.from(crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" }).export({ format: "jwk" }).d, "base64url");
      if (scalar.length !== 32 || !der.subarray(-32).equals(scalar)) throw new Error("the DER does not end in its 32-byte scalar; the needles would be wrong");
      return formsOf("the DER", der, null).concat(formsOf("the vault's secret (the DER in hex)", Buffer.from(pair.der, "utf8"), pair.der), formsOf("the scalar", scalar, null));
    };
    const passphrase = () => crypto.randomBytes(48).toString("base64url");
    const writeKey = (at, doc) => fs.writeFileSync(at, JSON.stringify(doc, null, 1) + "\n");
    const defaultAt = path.join(UD, "signing-key.json");
    if (sc.key === "os" || sc.key === "os-not-json") {
      const pair = await Sg.makePair();
      needles.push(...keyNeedles(pair));
      sealedDoc = Sg.osFile(pair, FAKE_VAULT.encryptString(pair.der));
      writeKey(defaultAt, sealedDoc);
      if (sc.key === "os-not-json") { const b = fs.readFileSync(defaultAt); fs.writeFileSync(defaultAt, b.subarray(0, Math.floor(b.length * 0.6))); }
    } else if (sc.key === "os-wrong") {
      const a = await Sg.makePair(), b = await Sg.makePair();
      needles.push(...keyNeedles(a), ...keyNeedles(b).map((x) => ({ label: "the other key's " + x.label.replace(/^the /, ""), bytes: x.bytes })));
      sealedDoc = Sg.osFile(a, FAKE_VAULT.encryptString(b.der));
      writeKey(defaultAt, sealedDoc);
    } else if (/^passphrase/.test(sc.key)) {
      const pair = await Sg.makePair(), p = passphrase(), at = path.join(UD, "passphrase-key.json");
      needles.push(...keyNeedles(pair), ...formsOf("the passphrase", Buffer.from(p), p));
      const doc = Sg.passphraseFile(pair, p);
      if (sc.key === "passphrase-tampered") { const h = Buffer.from(doc.private, "hex"); h[0] ^= 0xff; doc.private = h.toString("hex"); }
      sealedDoc = doc;
      writeKey(at, doc);
      let given = p;
      if (sc.key === "passphrase-wrong") { given = passphrase(); needles.push(...formsOf("the wrong passphrase", Buffer.from(given), given)); }
      Object.assign(env, { STUDIO_SIGNING_KEY: at, STUDIO_KEY_PASSPHRASE: given });
      allowEnv.push("STUDIO_KEY_PASSPHRASE");
    } else if (sc.key === "missing") {
      const p = passphrase();
      needles.push(...formsOf("the passphrase", Buffer.from(p), p));
      Object.assign(env, { STUDIO_SIGNING_KEY: path.join(UD, "absent-key.json"), STUDIO_KEY_PASSPHRASE: p });
      allowEnv.push("STUDIO_KEY_PASSPHRASE");
    }
    const NEEDLES = dedupe(needles);
    /* The sealed bytes are a second list. For a file this leg truncated, the full field is no longer on disk, so the
       longest prefix the broken file still holds is a needle too and the in-band check can see it there. */
    let SEALED = dedupe(sealedDoc ? sealedOf(sealedDoc) : []);
    if (sc.key === "os-not-json" && sealedDoc && sealedDoc.private) {
      const cut = fs.readFileSync(defaultAt);
      let keep = String(sealedDoc.private);
      while (keep.length > 24 && cut.indexOf(Buffer.from(keep)) < 0) keep = keep.slice(0, -1);
      if (keep.length >= 24 && cut.indexOf(Buffer.from(keep)) >= 0)
        SEALED = SEALED.concat([{ label: "the vault blob as text still in the broken file", labels: ["the vault blob as text still in the broken file"], bytes: Buffer.from(keep) }]);
    }
    const mask = crypto.randomBytes(32);
    const xor = (x) => Buffer.from(x.bytes.map((c, i) => c ^ mask[i % mask.length])).toString("hex");
    fs.writeFileSync(D("capture", "needles.json"), JSON.stringify({ mask: mask.toString("hex"), needles: NEEDLES.map(xor), sealed: SEALED.map(xor) }));
    const plantIx = {};
    if (sc.plant) for (const [k, label] of Object.entries(PLANTS)) {
      const i = NEEDLES.findIndex((x) => x.labels.includes(label));
      if (i < 0) throw new Error("no needle is labelled " + JSON.stringify(label) + "; the control table is wrong");
      plantIx[k] = i;
    }

    /* the child's world: an allowlisted environment, nothing of the parent's own */
    const KEEP = ["SystemRoot", "SYSTEMROOT", "windir", "PATH", "Path", "PATHEXT", "COMSPEC", "ComSpec", "OS", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE",
      "PROCESSOR_IDENTIFIER", "PROCESSOR_LEVEL", "PROCESSOR_REVISION", "ProgramFiles", "ProgramFiles(x86)", "ProgramW6432", "ProgramData", "SystemDrive",
      "USERNAME", "USER", "LOGNAME", "COMPUTERNAME", "LANG", "TZ"];
    const cenv = {};
    for (const k of KEEP) if (process.env[k] !== undefined) cenv[k] = process.env[k];
    const HOME = D("home");
    Object.assign(cenv, {
      USERPROFILE: HOME, HOME, HOMEDRIVE: path.parse(HOME).root.replace(/[\\/]$/, ""), HOMEPATH: HOME.slice(path.parse(HOME).root.length - 1),
      APPDATA: D("home/AppData/Roaming"), LOCALAPPDATA: D("home/AppData/Local"), TEMP: D("home/AppData/Local/Temp"), TMP: D("home/AppData/Local/Temp"), TMPDIR: D("home/AppData/Local/Temp"),
      XDG_CONFIG_HOME: D("home/.config"), XDG_DATA_HOME: D("home/.local/share"), XDG_CACHE_HOME: D("home/.cache"), XDG_RUNTIME_DIR: D("home/.run"),
      NODE_OPTIONS: "--require " + JSON.stringify(PRELOAD.split(path.sep).join("/")),
      LEAK_ROLE: "child", LEAK_CAP: D("capture"), LEAK_TREE: TREE, LEAK_PROJECTS: D("project"), LEAK_SHARE: D("share"),
      LEAK_SCENARIO: JSON.stringify(sc), LEAK_PLANTS: JSON.stringify(plantIx), LEAK_PLANT: sc.plant ? "1" : "0",
      STUDIO_PROJECTS: D("project"),
    }, sc.proxy ? {} : { STUDIO_NO_PROXY_SERVER: "off" }, env);

    /* the tree, by stat, before; the rest is read whole after */
    const treeBefore = statTree(TREE);
    const chunks = { out: [], err: [] };
    const started = Date.now();
    let heldPipes = false;   // a grandchild held the inherited pipes past the grace after the child exited (lh1e)
    let exitSignal = null;   // the signal the child ended on, said by lh1a beside its status
    let spared = [];         // recorded pids the reap left alone because they were no longer the process recorded
    /* THE CONTROL FOR THAT: a live process of this leg's own that the child records as its grandchild, which the
       reap must spare because its parent is this leg, not the child. Started for the planted scenario only. */
    const bystander = sc.plant ? spawn(process.execPath, ["-e", "setTimeout(() => {}, 60000);", "leak-hunt-bystander"], { detached: true, stdio: "ignore", windowsHide: true }) : null;
    if (bystander) { bystander.unref(); cenv.LEAK_BYSTANDER = String(bystander.pid); }
    const code = await new Promise((resolve) => {
      const c = spawn(process.execPath, [SELF], { cwd: D("cwd"), env: cenv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
      c.stdout.on("data", (b) => chunks.out.push(b)); c.stderr.on("data", (b) => chunks.err.push(b));
      const timer = setTimeout(() => { c.kill(); }, 90000);
      /* THE CLOSING WAIT IS BOUNDED (Clement delta's K2): once the child has exited, a grandchild that holds the inherited
         pipes gets 15 s, then the pipes are closed from this side and lh1e fails, rather than the leg hanging for ever. */
      let grace = null;
      c.on("exit", () => { grace = setTimeout(() => { heldPipes = true; c.stdout.destroy(); c.stderr.destroy(); }, 15000); });
      c.on("error", (e) => { clearTimeout(timer); resolve("spawn error " + e.code); });
      /* 'close', not 'exit': the streams have ended, so whatever the worker or a grandchild wrote is in */
      c.on("close", (cd, sig) => {
        exitSignal = sig || null;
        clearTimeout(timer); clearTimeout(grace);
        const status = cd === null ? "signal " + sig : cd;
        reapGrandchildren(D("capture"), c.pid).then((sp) => { spared = sp || []; resolve(status); }, () => resolve(status));
      });
    });
    const ms = Date.now() - started;
    const stdout = Buffer.concat(chunks.out), stderr = Buffer.concat(chunks.err);
    const outText = stdout.toString("latin1"), errText = stderr.toString("latin1");

    /* ---- the hunt ---- */
    const F = [];   // findings: { channel, where, hits }
    const add = (channel, where, hits) => { if (hits && hits.size !== 0 && hits.length !== 0) F.push({ channel, where, hits: Array.from(hits) }); };
    for (const [name, buf] of [["stdout", stdout], ["stderr", stderr]]) {
      for (const [where, hits] of byLine(buf, NEEDLES)) add(name, where, hits);
      for (const [where, hits] of byLine(buf, SEALED)) add("sealed-" + name, where, hits);
    }
    const roots = { home: D("home"), project: D("project"), share: D("share"), cwd: D("cwd") };
    let sealedInKey = 0;
    for (const [rn, root] of Object.entries(roots)) for (const f of listFiles(root)) {
      const buf = fs.readFileSync(f.abs), where = rn + "/" + markOf(f.rel);
      add("file", where, scan(buf, NEEDLES));
      add("file-name", where, scan(Buffer.from(f.rel), NEEDLES));
      if (isKeyFile(f.rel)) sealedInKey += scan(buf, SEALED).size;
      else add("sealed-file", where, scan(buf, SEALED));
    }
    const treeAfter = statTree(TREE), treeChanged = [];
    for (const [rel, s] of Object.entries(treeAfter)) if (treeBefore[rel] !== s) treeChanged.push(rel);
    for (const rel of Object.keys(treeBefore)) if (!(rel in treeAfter)) treeChanged.push(rel);
    for (const rel of treeChanged) {
      const abs = path.join(TREE, rel);
      if (fs.existsSync(abs)) {
        const buf = fs.readFileSync(abs);
        add("file", "tree/" + markOf(rel), scan(buf, NEEDLES));
        add("sealed-file", "tree/" + markOf(rel), scan(buf, SEALED));
      }
      add("file-name", "tree/" + markOf(rel), scan(Buffer.from(rel), NEEDLES));
    }
    const capHits = new Set();
    let sealedCap = false;
    for (const f of listFiles(D("capture"))) {
      const buf = fs.readFileSync(f.abs);
      for (const i of scan(buf, NEEDLES)) capHits.add(i);
      if (scan(buf, SEALED).size) sealedCap = true;
    }
    add("capture", "capture", capHits);
    if (sealedCap) F.push({ channel: "capture", where: "capture", hits: ["sealed"] });

    const events = [];
    for (const f of fs.readdirSync(D("capture"))) if (/^events-.*\.ndjson$/.test(f)) for (const l of fs.readFileSync(D("capture", f), "utf8").split("\n")) if (l) { try { events.push(JSON.parse(l)); } catch { /* a torn last line */ } }
    events.sort((a, b) => a.at - b.at);
    const cwdOf = {};
    for (const e of events) if (e.ev === "boot" && !(e.pid in cwdOf)) cwdOf[e.pid] = e.cwd;
    const allowed = [roots.home, roots.project, roots.share, roots.cwd, D("capture")];
    let ops = 0, kids = [];
    for (const e of events) {
      if (e.ev === "fs" || (e.ev === "fd-write" && !["stdout", "stderr"].includes(e.target))) {
        ops++;
        const where = e.op + " " + (e.paths || [e.target]).map((p) => p === "<carries>" ? p : markOf(path.relative(W, path.resolve(cwdOf[e.pid] || W, String(p))))).join(" -> ");
        add("file-act", where + " (pid " + e.pid + ")", new Set((e.data && e.data.hits) || []));
        const keyAct = (e.paths || []).some((p) => p !== "<carries>" && isKeyFile(p)) || isKeyFile(e.target || "");
        if (!keyAct && e.data && e.data.sealed && e.data.sealed.length) add("sealed-act", where + " (pid " + e.pid + ")", new Set(e.data.sealed));
        if ((e.paths || []).includes("<carries>") || e.target === "<carries>") F.push({ channel: "file-act", where: e.op + " of a path that carries a needle", hits: ["name"] });
        for (const p of e.paths || []) if (p !== "<carries>" && !under(path.resolve(cwdOf[e.pid] || W, String(p)), allowed))
          F.push({ channel: "outside", where: e.op + " " + markOf(String(p)), hits: ["path"] });
      }
      if (e.ev === "fd-write" && ["stdout", "stderr"].includes(e.target)) add("fd-" + e.target, "write by pid " + e.pid + " thread " + e.tid, new Set((e.data && e.data.hits) || []));
      if (e.ev === "child") {
        kids.push(e);
        const tag = (e.argv || []).find((a) => /^planted-/.test(a)) || path.basename(String(e.file));
        add("child-argv", e.op + " " + tag, new Set([...(e.fileHits || []), ...(e.argvHits || [])]));
        add("child-options", e.op + " " + tag, new Set(e.optionsHits || []));
        const carry = (e.envCarry || []).filter((k) => !allowEnv.includes(k));
        if (carry.length) F.push({ channel: e.envOwn ? "child-env" : "child-env-inherited", where: e.op + " " + tag + " " + carry.join(","), hits: carry });
        if (e.sealed && e.sealed.length) add("sealed-child", e.op + " " + tag, new Set(e.sealed));
      }
      if (e.ev === "child-stdin" || e.ev === "child-send") {
        const where = [e.mark, e.op, e.pid ? "pid " + e.pid : ""].filter(Boolean).join(" ");
        add(e.ev, where, new Set(e.hits || []));
        if (e.sealed && e.sealed.length) add("sealed-" + e.ev, where, new Set(e.sealed));
      }
      if (e.ev === "net") {
        const where = [e.mark, e.op, e.where].filter(Boolean).join(" ");
        if (e.hits && e.hits.length) add("net-" + e.op, where, new Set(e.hits));
        if (e.sealed && e.sealed.length) add("sealed-net", e.op + " " + where, new Set(e.sealed));
      }
      if (e.ev === "electron") {
        add("electron", String(e.member || ""), new Set(e.hits || []));
        if (e.sealed && e.sealed.length && !/safeStorage\.(decryptString|encryptString)/.test(String(e.member || "")))
          add("sealed-electron", String(e.member || ""), new Set(e.sealed));
      }
      if (e.ev === "ipc") {
        add("ipc-" + e.kind, e.channel, new Set(e.hits || []));
        if (e.sealed && e.sealed.length) add("sealed-ipc", e.channel, new Set(e.sealed));
      }
      if (e.ev === "post-back") add("thread-back", "pid " + e.pid + " thread " + e.tid, new Set(e.hits || []));
      if (e.ev === "exit") {
        const carry = (e.envCarry || []).filter((k) => !allowEnv.includes(k));
        if (carry.length) F.push({ channel: "exit-env", where: carry.join(","), hits: carry });
        if (e.sealed && e.sealed.length) add("sealed-exit", "pid " + e.pid, new Set(e.sealed));
      }
    }

    /* ---- lh1: the child ran, the capture ran, and publishProject carried the secret exactly where the key opens ---- */
    const P = sc.name.padEnd(18);
    const lines = outText.split("\n");
    const result = (() => { const l = lines.find((x) => x.startsWith("driver  result ")); try { return l ? JSON.parse(l.slice(15)) : null; } catch { return null; } })();
    const failLines = (outText + "\n" + errText).split("\n").filter((l) => /FAIL/.test(l)).length;
    const done = lines.includes("driver  done"), late = lines.includes("driver  late send made");
    if (spared.length && !sc.plant) info(sc.name + " the reap spared " + spared.length + " recorded pid(s) no longer the process recorded: " + spared.map((x) => x.pid + " (" + x.why + ")").join(", "));
    if (bystander) {
      const alive = pidAlive(bystander.pid), named = spared.find((x) => x.pid === bystander.pid);
      check(alive && !!named, P + "lh4 CONTROL a recorded pid that is no longer the process recorded is spared and reported: the leg's own bystander is " + (alive ? "alive" : "KILLED") + (named ? " (" + named.why + ")" : ", not reported"));
      try { process.kill(bystander.pid); } catch { /* gone */ }
    }
    check(!heldPipes, P + "lh1e the child's pipes closed within 15 s of its exit (a grandchild holding them fails here instead of hanging the leg)");
    /* A RED NAMES ITS CAUSE IN ITS OWN LINE (the rerun of 2026-10-16: status 1 and nothing else said). The child's stderr,
       less the planted lines its own controls write there, redacted of every needle and sealed value, with the signal. */
    const ranToEnd = code === 0 && done && failLines === 0 && (!sc.plant || late);
    const errLines = errText.split(/\r?\n/).filter((l) => l.trim() && !/^\s*planted-/.test(l));
    const errAt = errLines.findIndex((l) => /Error\b|Unhandled|uncaught/i.test(l));
    const errTail = (errAt < 0 ? errLines.slice(-8)
      : errLines.slice(errAt, errAt + 3).concat(errLines.slice(errAt + 3).filter((l) => /^\s*(code|errno|syscall|signal):/.test(l)))).join(" | ");
    const why = ranToEnd ? "" : "; signal " + (exitSignal || "none") + ", its stderr ends: "
      + JSON.stringify(redactAll(errTail, NEEDLES.concat(SEALED)).replace(/[^\x20-\x7e|]/g, "?").slice(-900) || "(nothing)");
    check(ranToEnd, P + "lh1a the child ran to its end: status " + code + " in " + ms + " ms, its last line said" + (done ? "" : " NOT") + (sc.plant ? ", the late send" + (late ? "" : " NOT") + " made" : "") + ", " + failLines + " FAIL line(s) over both streams" + why);
    if (failLines) process.stdout.write(redactAll((outText + "\n" + errText).split("\n").filter((l) => /FAIL|threw/.test(l)).slice(0, 4).join("\n"), NEEDLES.concat(SEALED)).replace(/^/gm, "         ") + "\n");
    const boots = events.filter((e) => e.ev === "boot"), mainBoot = boots.filter((b) => b.main && b.argv && b.argv.some((a) => /leak-hunt\.mjs$/.test(a)));
    const tids = new Set(events.filter((e) => mainBoot.length && e.pid === mainBoot[0].pid).map((e) => e.tid));
    const inHome = boots.every((b) => under(b.home, [HOME]) && under(b.tmp, [HOME]) && under(b.userprofile, [HOME]) && under(b.appdata, [HOME]) && b.needles === NEEDLES.length && b.sealed === SEALED.length);
    check(mainBoot.length === 1 && tids.size >= 2 && inHome, P + "lh1b the preload ran in the child's main thread and its worker (" + tids.size + " thread(s), " + new Set(boots.map((b) => b.pid)).size + " process(es)) and all " + boots.length + " boot(s) saw the scratch home, the " + NEEDLES.length + " needles and the " + SEALED.length + " sealed");
    const begin = events.find((e) => e.ev === "phase" && e.name === "publish-begin"), end = events.find((e) => e.ev === "phase" && e.name === "publish-end");
    const inPhase = (e) => begin && end && e.at >= begin.at && e.at <= end.at;
    const posts = events.filter((e) => e.ev === "post" && inPhase(e));
    const pubCarries = posts.filter((p) => p.verb === "publishProject" && p.hits.length).length, pubAll = posts.filter((p) => p.verb === "publishProject").length;
    const opensWanted = sc.expect === "signed" || sc.expect === "error";
    check(pubAll === sc.publishes && (opensWanted ? pubCarries === pubAll : pubCarries === 0),
      P + "lh1c publishProject carried the secret in " + pubCarries + " of " + pubAll + " message(s), " + (opensWanted ? "every one, as the key opens" : "none, as the key does not open") + " (the publish phase's other thread messages are listed, not judged: " + summarise(posts.map((p) => p.verb + (p.hits.length ? "*" : ""))) + "; * carries)");
    if (sc.expect === "unsigned") {
      let ok = false, how = "";
      const mainPid = mainBoot.length ? mainBoot[0].pid : null;
      if (sc.key === "passphrase-wrong" || sc.key === "missing" || sc.key === "passphrase-tampered") {
        const wantLabel = sc.key === "passphrase-wrong" ? "the wrong passphrase as text" : "the passphrase as text";
        const ix = NEEDLES.findIndex((n) => n.labels.includes(wantLabel));
        const got = events.some((e) => e.ev === "exit" && e.pid === mainPid && (e.envHits || []).includes(ix));
        ok = ix >= 0 && got;
        how = "the env at exit carries " + wantLabel;
      } else if (sc.key === "os-wrong") {
        const ix = events.filter((e) => e.ev === "saw" && e.name === "opened").flatMap((e) => e.hits || []);
        ok = ix.some((i) => NEEDLES[i] && /^the other key's /.test(NEEDLES[i].label));
        how = "the vault's opened secret is the other key (" + ix.length + " form(s) matched)";
      } else {
        ok = sealedInKey > 0;
        how = "the key file carries its sealed bytes (" + sealedInKey + " form(s))";
      }
      check(ok, P + "lh1d the matcher fires on this scenario's own live secret (" + how + ")");
    }

    /* ---- lh2: nowhere else ---- */
    const of = (re) => F.filter((f) => re.test(f.channel));
    const labelOf = (f, h) => typeof h !== "number" ? h : (String(f.channel).startsWith("sealed") ? (SEALED[h] && SEALED[h].label) : (NEEDLES[h] && NEEDLES[h].label));
    const show = (fs_) => fs_.length ? ": " + fs_.slice(0, 4).map((f) => f.channel + " " + f.where + " [" + f.hits.map((h) => labelOf(f, h)).join("; ") + "]").join(" | ") : "";
    const G = [
      ["pipes", /^(stdout|stderr|fd-stdout|fd-stderr)$/, "on fd 1 or fd 2 (" + stdout.length + " + " + stderr.length + " bytes at the pipe, and every descriptor write the preload saw)"],
      ["files", /^(file|file-name)$/, "in any file or file name left under the home, project, share, working folder or tree (" + Object.values(roots).reduce((n, r) => n + listFiles(r).length, 0) + " file(s) read whole, " + treeChanged.length + " tree file(s) changed)"],
      ["file acts", /^file-act$/, "in any file act at the call, transient files included (" + ops + " act(s))"],
      ["outside", /^outside$/, "in any file act outside the scratch home, project, share, working and capture folders"],
      ["children", /^child-(argv|options|env)/, "in any child's file, argv, options or env (" + kids.length + " child call(s): " + summarise(kids.map((k) => k.op + " " + path.basename(String(k.file)))) + ")"],
      ["grandchild io", /^(child-stdin|child-send)$/, "written to a grandchild's stdin or fork channel after the call (" + events.filter((e) => e.ev === "child-stdin" || e.ev === "child-send").length + " write(s))"],
      ["network", /^net-/, "on a socket, request, fetch, datagram or dns call (" + events.filter((e) => e.ev === "net").length + " net act(s))"],
      ["electron", /^electron$/, "in any call on the electron stand-in (" + events.filter((e) => e.ev === "electron").length + " call(s))"],
      ["sealed", /^sealed-/, "among the key file's sealed bytes outside that file and the vault call (" + SEALED.length + " sealed form(s); " + sealedInKey + " in the key file)"],
      ["ipc and thread", /^(ipc-|thread-back)/, "in any reply, send, event.reply or message the worker posts back (" + events.filter((e) => e.ev === "ipc").length + " ipc, " + events.filter((e) => e.ev === "post-back").length + " back)"],
      ["env at exit", /^exit-env$/, "in the environment at exit (" + events.filter((e) => e.ev === "exit").length + " exit(s))" + (allowEnv.length ? "; " + allowEnv.join(",") + " is this leg's own and allowed" : "")],
      ["capture", /^capture$/, "in the capture itself (" + listFiles(D("capture")).length + " file(s), needles.json included, masked)"],
    ];
    for (const [g, re, what] of G) {
      const hit = of(re);
      if (hit.length) groups[g] = (groups[g] || 0) + (sc.plant ? 1 : 0);
      if (!sc.plant || g === "capture") check(hit.length === 0, P + "lh2 no needle " + what + show(hit));
    }
    if (!sc.plant) {
      const fromPublish = kids.filter((k) => begin && k.at >= begin.at);
      check(fromPublish.length === 0, P + "lh2 the publish phase starts no child process, and none from publish-begin until the child exits (" + fromPublish.length + (fromPublish.length ? ": " + summarise(fromPublish.map((k) => k.op + " " + path.basename(String(k.file)))) : "") + "; shell-load reg.exe excepted)");
      const sockets = events.filter((e) => e.ev === "net" && e.socket && inPhase(e));
      check(sockets.length === 0, P + "lh2 the publish phase opens no socket (" + sockets.length + (sockets.length ? ": " + summarise(sockets.map((s) => s.op)) : "") + ")");
      if (sc.proxy && process.platform === "win32") {
        const reg = kids.filter((k) => /reg(\.exe)?$/i.test(String(k.file)));
        check(reg.length >= 1 && reg.every((k) => Array.isArray(k.argv) && k.argv.length > 0 && k.options && k.env && Object.keys(k.env).length > 5),
          P + "lh2 the shell's one grandchild, the proxy reader's reg.exe (answered by tests/reg-stand.cjs), was recorded whole at load: " + reg.length + " call(s), argv " + (reg[0] ? reg[0].argv.length : 0) + " item(s), options " + (reg[0] && reg[0].options ? Object.keys(reg[0].options).length : 0) + " key(s), env " + (reg[0] ? Object.keys(reg[0].env).length : 0) + " variable(s), " + (reg[0] && reg[0].envOwn ? "its own" : "inherited"));
      }
    }

    /* ---- lh3: the publish did what the scenario says ---- */
    const shareFiles = fs.statSync(D("share")).isDirectory() ? listFiles(D("share")).map((f) => f.rel) : [];
    const ec = shareFiles.find((f) => /\.ec$/.test(f));
    const doc = ec ? JSON.parse(fs.readFileSync(D("share", ec), "utf8")) : null;
    const reps = result ? result.replies : [];
    if (sc.expect === "signed") {
      const ok = result && result.plan && result.plan.opens && reps.length === sc.publishes && reps.every((r, i) => r.error === null && r.rev === i + 1)
        && doc && doc.sig && doc.sig.keyId === result.plan.keyId && doc.rev === sc.publishes && shareFiles.some((f) => /ring\.json$/.test(f));
      check(!!ok, P + "lh3 signed: the plan opens the key, " + reps.length + " publish(es) answered revs " + reps.map((r) => r.rev).join(",") + " with no error, the share's edition is revision " + (doc && doc.rev) + " signed by the plan's key (" + !!(doc && doc.sig) + "), its ring beside it");
    } else if (sc.expect === "unsigned") {
      const ok = result && result.plan && !result.plan.opens && reps.every((r) => r.error === null && r.rev === 1) && doc && !doc.sig;
      check(!!ok, P + "lh3 unsigned: the plan says the key does not open (keyId " + !!(result && result.plan && result.plan.keyId) + ", unreadable " + !!(result && result.plan && result.plan.unreadable) + "), the publish answered rev " + reps.map((r) => r.rev).join(",") + " with no error, and the share's edition carries no signature (" + !!(doc && doc.sig) + ")");
    } else if (REACH[sc.mutate]) {
      /* the reach probe: the refusal the scenario exists to drive is the one the reply carries */
      const [wantText, at] = REACH[sc.mutate];
      const hit = reps[at] || {}, before = reps.slice(0, at);
      const ok = result && result.plan && result.plan.opens && reps.length === sc.publishes && before.every((r, i) => r.error === null && r.rev === i + 1)
        && !!hit.error && wantText.test(hit.error) && (sc.mutate === "share-taken" ? !!(doc && doc.id === "another-catalog-entirely" && !doc.sig) : !doc);
      check(!!ok, P + "lh3 refused at its own branch with the secret in hand: the plan opens the key, publish " + (at + 1) + " answered "
        + (hit.error ? JSON.stringify(hit.error.replace(/[A-Za-z]:[\\/][^ ]*|\/[^ ]*\/[^ ]*/g, "<path>").slice(0, 110)) : "no error")
        + " (wanted " + wantText + "), and the share holds " + (sc.mutate === "share-taken" ? "the other catalog, untouched" : "no edition"));
    } else {
      const late = sc.mutate === "project-tmp-dir", ring = shareFiles.some((f) => /ring\.json$/.test(f));
      const ok = result && result.plan && result.plan.opens && reps.length === 1 && reps[0].error && (late ? !!(doc && doc.sig) && ring : !doc);
      check(!!ok, P + "lh3 refused after the project was read and the key opened: the plan opens the key, the publish answered an error ("
        + (reps[0] && reps[0].error ? reps[0].error.replace(/[A-Za-z]:[\\/][^ ]*|\/[^ ]*\/[^ ]*/g, "<path>").slice(0, 120) : "none") + "), "
        + (late ? "thrown at the last write, after the signed edition (" + !!(doc && doc.sig) + ") and its ring (" + ring + ") were in the share"
                : "thrown before any edition reached the share (" + !doc + ")"));
    }

    /* ---- lh4: the controls ---- */
    if (sc.plant) {
      const want = {
        stdout: ["stdout", "planted-stdout"], stderr: ["stderr", "planted-stderr"], worker: ["stdout", "planted-worker"],
        "share-file": ["file", "share/planted-share.txt"], "project-file": ["file", "project/planted-project.txt"], "home-raw": ["file", "planted-home.bin"],
        "cwd-file": ["file", "cwd/planted-cwd.txt"], "tree-file": ["file", "tree/planted-tree.txt"], transient: ["file-act", "planted-transient.tmp"],
        "file-name": ["file-name", "share/"], argv: ["child-argv", "planted-argv"], env: ["child-env", "planted-env"], options: ["child-options", "planted-options"],
        esm: ["child-argv", "planted-esm"], dynamic: ["child-argv", "planted-dynamic"], inherit: ["child-env-inherited", "planted-inherit"],
        grandchild: ["stdout", "planted-grandchild"], "late-grandchild": ["stdout", "planted-late-grandchild"], reply: ["ipc-reply", "planted:reply"], send: ["ipc-send", "planted:late"], "exit-env": ["exit-env", "PLANTED_EXIT"],
        net: ["net-socket.write", "planted-net"], connect: ["net-connect", "planted-net"], http: ["net-http.end", "planted-http"], https: ["net-https.end", "planted-https"],
        fetch: ["net-fetch", "planted-fetch"], dgram: ["net-dgram.send", "planted-dgram"], dns: ["net-dns.lookup", "planted-dns"],
        "dns-resolve": ["net-dns.resolve", "planted-dns-resolve"], tls: ["net-tls.connect", "planted-tls"],
        electron: ["electron", "planted-electron"], stdin: ["child-stdin", "planted-stdin"], "stdin-end": ["child-stdin", "planted-stdin-end"],
        fork: ["child-send", "planted-fork"], "ignored-pipes": ["file", "planted-ignored-pipes"],
      };
      for (const [k, [ch, at]] of Object.entries(want)) {
        const ix = plantIx[k];
        const found = F.filter((f) => f.channel === ch && f.where.includes(at) && (f.hits.includes(ix) || typeof f.hits[0] === "string"));
        check(found.length > 0, P + "lh4 CONTROL " + k + ": " + NEEDLES[ix].label + " planted for " + ch + " is found there (" + (found[0] ? found[0].where : "not found") + ")");
      }
      const transientEnd = F.some((f) => f.channel === "file" && f.where.includes("planted-transient"));
      const gcPid = events.find((e) => e.ev === "boot" && e.argv && e.argv.includes("planted-grandchild"));
      const gcAct = gcPid && F.some((f) => f.channel === "file-act" && f.where.includes("planted-grandchild.txt") && f.where.includes("pid " + gcPid.pid));
      check(!transientEnd && !!gcAct, P + "lh4 CONTROL the act channel sees what the end state cannot: the transient file is absent at the end (" + !transientEnd + "), and the grandchild's own write was recorded by the preload inside the grandchild (" + !!gcAct + ")");
      check(F.some((f) => f.channel === "outside" && f.where.includes("planted-tree")), P + "lh4 CONTROL a write into the tree copy is also an act outside the scratch folders");
      check(F.some((f) => f.channel === "thread-back"), P + "lh4 CONTROL a worker posting the secret back is found (" + F.filter((f) => f.channel === "thread-back").length + ")");
      const sealedFound = F.filter((f) => f.channel === "sealed-file" && String(f.where).includes("planted-sealed"));
      check(sealedFound.length > 0, P + "lh4 CONTROL sealed: the key file's sealed bytes copied into the share are found there (" + (sealedFound[0] ? sealedFound[0].where : "not found") + ")");
      const sealedAct = F.filter((f) => f.channel === "sealed-act" && String(f.where).includes("planted-sealed"));
      check(sealedAct.length > 0, P + "lh4 CONTROL sealed at the call: the preload's sealed matcher names the sealed write (" + (sealedAct[0] ? sealedAct[0].where : "not found") + ")");
      const honest = G.map((g) => g[0]).filter((g) => g !== "capture");
      const blind = honest.filter((g) => !groups[g]);
      check(blind.length === 0, P + "lh4 CONTROL every honest group of lh2 had something to fail on in this run (" + (honest.length - blind.length) + " of " + honest.length + (blind.length ? "; blind: " + blind.join(", ") : "") + ")");
    }
    if (process.env.LEAK_HUNT_VERBOSE) info(sc.name + " findings: " + F.length + show(F));
  }

  /* ---- lh5: the real machine ---- */
  check(realCanary() === canaryBefore, "lh5 the real profile, LOCALAPPDATA's and Documents' Studio folders and this tree's git status are as they were");
  if (COUNT.failed || process.env.LEAK_HUNT_KEEP) info("scratch kept at " + BASE);
  else dropScratch(BASE, "leak-hunt");
  info("wall clock " + (Date.now() - t0) + " ms");
  finish();

  function finish() {
    console.log("#counts checks=" + COUNT.asserted + " failed=" + COUNT.failed);
    process.exit(COUNT.failed ? 1 : 0);
  }
}

/* ---- needles and their search ---- */
/** Every form a secret's bytes are searched in: raw, hex, upper hex, base64 and base64url (each also as it falls at byte
 *  offsets 1 and 2 of a longer stream: the groups wholly made of the secret's bytes), and for a text secret its text,
 *  upper case and UTF-16LE. */
/** The key file's sealed private field: the vault blob for a key the operating system keeps, the ciphertext for a passphrase key. */
function sealedOf(doc) {
  if (!doc || doc.private == null) return [];
  const text = String(doc.private);
  const osWrap = doc.wrap && doc.wrap.kdf === "os";
  let raw = Buffer.alloc(0);
  try { raw = Buffer.from(text, osWrap ? "base64" : "hex"); } catch { raw = Buffer.alloc(0); }
  return formsOf(osWrap ? "the vault blob" : "the encrypted private field", raw, text);
}
function formsOf(label, bytes, text) {
  const out = [];
  const put = (form, b) => { if (b && b.length >= 12) out.push({ label: label + " as " + form, bytes: Buffer.from(b) }); };
  if (text != null) { put("text", Buffer.from(text, "utf8")); put("upper-case text", Buffer.from(text.toUpperCase(), "utf8")); put("UTF-16LE text", Buffer.from(text, "utf16le")); }
  put("raw bytes", bytes);
  put("hex", Buffer.from(bytes.toString("hex")));
  put("upper hex", Buffer.from(bytes.toString("hex").toUpperCase()));
  for (const enc of ["base64", "base64url"]) for (let k = 0; k < 3; k++) {
    const all = Buffer.concat([Buffer.alloc(k), bytes]).toString(enc), full = Math.floor((k + bytes.length) / 3) * 4;
    put(enc + (k ? " at offset " + k : ""), Buffer.from(all.slice(k ? 4 : 0, full)));
  }
  return out;
}
/** One needle per distinct byte string, the first label kept. */
/** One needle per distinct byte string, the first label printed and every label kept: two forms can coincide by chance
 *  (a base64 run with no + or / is its base64url too), so a control asks for its form by any of the labels. */
function dedupe(ns) {
  const at = new Map(), out = [];
  for (const n of ns) {
    const h = n.bytes.toString("hex");
    if (at.has(h)) at.get(h).labels.push(n.label);
    else { const x = { label: n.label, labels: [n.label], bytes: n.bytes }; at.set(h, x); out.push(x); }
  }
  return out;
}
function scan(buf, ns) { const s = new Set(); ns.forEach((n, i) => { if (buf.indexOf(n.bytes) >= 0) s.add(i); }); return s; }
/** Hits in a stream, attributed to the line they start in, named by the line's planted- marker where it has one. */
function byLine(buf, ns) {
  const at = new Map();
  ns.forEach((n, i) => {
    for (let p = buf.indexOf(n.bytes); p >= 0; p = buf.indexOf(n.bytes, p + 1)) {
      const start = buf.lastIndexOf(10, p - 1) + 1, head = buf.subarray(start, Math.min(start + 40, p)).toString("latin1");
      const m = /^planted-[a-z-]+/.exec(head), where = m ? m[0] : "line at byte " + start;
      if (!at.has(where)) at.set(where, new Set());
      at.get(where).add(i);
    }
  });
  return at;
}
function redactAll(t, ns) { let b = Buffer.from(t, "latin1"); for (const n of ns) for (let p = b.indexOf(n.bytes); p >= 0; p = b.indexOf(n.bytes)) b = Buffer.concat([b.subarray(0, p), Buffer.from("<needle>"), b.subarray(p + n.bytes.length)]); return b.toString("latin1"); }
/** A path as the report may print it: a long hex or base64 run is never printed whole. */
function markOf(rel) { return String(rel).split(path.sep).join("/").replace(/[A-Za-z0-9+_=-]{40,}/g, "<long name>"); }
function listFiles(root, base = root, acc = []) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return acc;
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) listFiles(p, base, acc); else acc.push({ abs: p, rel: path.relative(base, p) });
  }
  return acc;
}
function statTree(root) { const o = {}; for (const f of listFiles(root)) { const s = fs.statSync(f.abs); o[f.rel] = s.size + ":" + s.mtimeMs; } return o; }
function summarise(xs) { const c = new Map(); for (const x of xs) c.set(x, (c.get(x) || 0) + 1); return Array.from(c).map(([k, n]) => n > 1 ? k + " x" + n : k).join(", ") || "none"; }
