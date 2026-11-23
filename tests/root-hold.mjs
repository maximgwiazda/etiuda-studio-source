/* ONE STUDIO HOLDS A SHARED PROJECTS FOLDER AT A TIME (Max, 2026-11-22 21:14, by Claude alpha: two Studios working in one shared
 * projects folder is retired). src/root-hold.cjs is the hold; shell/main.js holdCheck puts it in front of every project verb
 * (tests/shell-guards.mjs section 23 holds that half).
 *
 *     node tests/root-hold.mjs [--keep]
 *
 * THE CRITERION, one sentence for every leg below: a second Studio never works in a projects folder another live Studio holds, and a
 * hold is never a reason to refuse for ever: one left by a Studio that died is taken over by the next look with no step by anyone,
 * and one that cannot be read or replaced is said as that, naming its file, never as "another Studio has it".
 *
 *   rh1 a Studio in a process of its own holds the folder, and a second one finds it held, by whom, and takes nothing
 *   rh2 the holder is killed with no word: the next look takes the hold at once (this computer, the process gone)
 *   rh3 a hold from another computer: kept while its beats are fresh, taken over once they stopped (judged by the folder's own clock)
 *   rh4 a hold that is not a hold (damaged text): held while it is fresh, taken over when old
 *   rh5 a hold that cannot be read (a folder where the file should be) is trouble naming the file, not "another Studio", and nothing
 *       in it is touched; one that cannot be replaced (read-only, Windows) is the same
 *   rh6 a Studio that holds it holds it again (a beat); it lets go of its own file only; a hold taken from it is found at the next beat
 *   rh7 a folder that is not there, or that nobody may write to, holds nothing and says nothing
 *   rh8 only a folder that can be shared has a hold: a synced one, a share, a disk that may be one; the system disk's folder has none
 *   rh9 both sentences have a Polish line
 *   rh10 every leg ran
 *
 * WHAT IT CANNOT SEE, said rather than implied: a real share and a second computer (the other host is a name in the file), and a
 * server whose clock differs from this one's (the age is the folder's own two times, so skew cancels; the leg shows the age comes from the
 * folder, not that skew was met).
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "root-hold");
const EXPECTED = 22;
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const J = JSON.stringify;
const Hold = require("../src/root-hold.cjs");

/* The first Studio, from a process of its own: it takes the hold and stays alive until it is stopped. */
if (process.argv[2] === "--studio") {
  const me = Hold.holder();
  const r = Hold.take(process.argv[3], me);
  process.stdout.write(J({ state: r.state, pid: process.pid, host: me.host }) + String.fromCharCode(10));
  setInterval(() => {}, 1000);                 /* alive until the leg stops it */
  await new Promise(() => {});
}

/* A Studio taking or beating a hold, at a moment all of them agree on, on a disk whose rename is slow (a share): two of them at once, and which
   of them holds it. `slow` is how long this one's rename waits (ms); `id` makes it the Studio whose hold is in the file already. */
if (process.argv[2] === "--racer") {
  const [root, id, slow, at] = process.argv.slice(3);
  if (+slow) {
    const real = fs.renameSync;
    fs.renameSync = function () { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, +slow); return real.apply(this, arguments); };
  }
  const me = Hold.holder();
  if (id) me.id = id;
  while (Date.now() < +at) { /* all of them start together */ }
  const r = Hold.take(root, me);
  process.stdout.write(JSON.stringify({ state: r.state, id: me.id }) + String.fromCharCode(10));
  /* Alive until the leg lets it go: a Studio that has exited is a process gone, and its hold is taken at once (rh2), which is not the race. */
  process.stdin.resume();
  process.stdin.on("end", () => process.exit(0));
  setTimeout(() => process.exit(0), 30000);
  await new Promise(() => {});
}

const HOST_OTHER = "another-computer";
const doc = (o) => J(Object.assign({ kind: "etiuda-studio-hold", id: "someone-else", pid: 4242, host: HOST_OTHER, since: new Date().toISOString(), beat: new Date().toISOString() }, o || {})) + String.fromCharCode(10);
const ago = (file, ms) => { const t = new Date(Date.now() - ms); fs.utimesSync(file, t, t); };

async function main(argv) {
  clearScratch(SCRATCH);
  let asserted = 0, failed = 0, skipped = 0;
  const check = (cond, line) => {
    asserted++;
    if (cond) process.stdout.write("  ok   " + line + String.fromCharCode(10));
    else { failed++; process.stdout.write("  FAIL " + line + String.fromCharCode(10)); }
  };
  const skip = (line) => { skipped++; process.stdout.write("  skip " + line + String.fromCharCode(10)); };
  const fresh = (name) => { const d = path.join(SCRATCH, name); fs.mkdirSync(d, { recursive: true }); return d; };
  const me = Hold.holder();

  /* ---- 1 and 2 ---- */
  {
    const root = fresh("two");
    const first = spawn(process.execPath, [SELF, "--studio", root], { stdio: ["ignore", "pipe", "inherit"], windowsHide: true });
    const said = await new Promise((res) => first.stdout.once("data", (d) => res(JSON.parse(String(d)))));
    const file = Hold.holdAt(root);
    const second = Hold.take(root, me);
    Hold.drop(root, me);
    check(said.state === "mine" && second.state === "other" && second.by && second.by.pid === said.pid && fs.existsSync(file),
      "rh1 a Studio in a process of its own holds the folder; a second one finds it held, by pid " + said.pid + ", takes nothing and removes nothing: " + J({ said, second }));
    await new Promise((res) => { first.on("close", res); first.kill(); });
    const t0 = Date.now();
    const after = Hold.take(root, me);
    check(after.state === "mine" && Date.now() - t0 < 2000 && JSON.parse(fs.readFileSync(file, "utf8")).id === me.id,
      "rh2 the holder killed with no word, the next look takes the hold at once, with no step by anyone: " + J({ after, ms: Date.now() - t0 }));
    Hold.drop(root, me);
    check(!fs.existsSync(file), "rh2b a Studio that quits lets go: its file is gone");
  }

  /* ---- 3 ---- */
  {
    const root = fresh("away");
    const file = Hold.holdAt(root);
    fs.writeFileSync(file, doc());
    const kept = Hold.take(root, me);
    ago(file, 120000);
    const old = Hold.take(root, me);
    check(kept.state === "other" && kept.by.host === HOST_OTHER && old.state === "mine" && JSON.parse(fs.readFileSync(file, "utf8")).id === me.id,
      "rh3 a hold from another computer is kept while its beats are fresh and taken over once they stopped (two minutes): " + J({ kept: kept.state, old: old.state }));
    const probes = fs.readdirSync(root).filter((n) => /probe/.test(n));
    check(probes.length === 0, "rh3b the age is judged against a probe made in the folder, and the probe is not left behind: " + J(probes));
    Hold.drop(root, me);
  }

  /* ---- 4 ---- */
  {
    const root = fresh("damaged");
    const file = Hold.holdAt(root);
    fs.writeFileSync(file, "{ this is not a hold");
    const freshOne = Hold.take(root, me);
    ago(file, 120000);
    const oldOne = Hold.take(root, me);
    check(freshOne.state === "other" && oldOne.state === "mine",
      "rh4 a hold that is damaged text is held while it is fresh and taken over when old: " + J({ fresh: freshOne.state, old: oldOne.state }));
    Hold.drop(root, me);
  }

  /* ---- 5 ---- */
  {
    const root = fresh("trouble");
    const file = Hold.holdAt(root);
    fs.mkdirSync(file);
    fs.writeFileSync(path.join(file, "inside"), "x");
    const r = Hold.take(root, me);
    check(r.state === "trouble" && r.file === file && fs.existsSync(path.join(file, "inside")) && r.state !== "other",
      "rh5 a folder where the hold file should be is trouble naming the file, not another Studio, and nothing in it is touched: " + J(r));
    fs.rmSync(path.join(file, "inside"));
    fs.rmdirSync(file);
    if (process.platform === "win32") {
      const root2 = fresh("readonly");
      const f2 = Hold.holdAt(root2);
      fs.writeFileSync(f2, doc());
      ago(f2, 120000);
      fs.chmodSync(f2, 0o444);
      const r2 = Hold.take(root2, me);
      fs.chmodSync(f2, 0o666);
      check(r2.state === "trouble" && r2.file === f2,
        "rh5b an old hold that cannot be replaced (read-only) is trouble naming the file: " + J(r2));
    } else skip("rh5b a read-only hold file is replaced by a rename on this system, so there is no such case here");
  }

  /* ---- 6 ---- */
  {
    const root = fresh("mine");
    const file = Hold.holdAt(root);
    const a = Hold.take(root, me), b = Hold.take(root, me);
    fs.writeFileSync(file, doc({ id: "took-it" }));
    Hold.drop(root, me);
    const stays = fs.existsSync(file);
    const lost = Hold.take(root, me);
    check(a.state === "mine" && b.state === "mine" && stays && lost.state === "other",
      "rh6 holding it again is a beat; letting go removes only its own file; a hold another Studio took from it is found at the next beat: " + J({ a: a.state, b: b.state, stays, lost: lost.state }));
  }

  /* ---- 7 ---- */
  {
    const none = Hold.take(path.join(SCRATCH, "not-there"), me);
    check(none.state === "free", "rh7 a folder that is not there holds nothing and refuses nothing: " + J(none));
  }

  /* ---- 8 ---- */
  {
    const share = Hold.needed("//server/share/projects"), sync = Hold.needed("C:/Users/x/OneDrive/Studio"), other = Hold.needed("D:/Studio"),
      docs = Hold.needed("C:/Users/x/Documents/Etiuda Studio"), tmp = Hold.needed(os.tmpdir());
    check(share && sync && other && !docs && !tmp,
      "rh8 a share, a synced folder and another disk can be shared and have a hold; a folder on the system disk has none: " + J({ share, sync, other, docs, tmp }));
  }

  /* ---- 11 and 12: TWO STUDIOS TAKE ONE HOLD AT THE SAME MOMENT ON A SLOW DISK, and exactly one has it ---- */
  {
    const race = async (root, specs) => {
      const at = Date.now() + 2500;
      const procs = [];
      const kids = specs.map((sp) => new Promise((res) => {
        const c = spawn(process.execPath, [SELF, "--racer", root, sp.id || "", String(sp.slow || 0), String(at)], { stdio: ["pipe", "pipe", "inherit"], windowsHide: true });
        procs.push(c);
        let out = "";
        c.stdout.on("data", (d) => { out += d; if (out.indexOf(String.fromCharCode(10)) >= 0) { let v = null; try { v = JSON.parse(out.trim()); } catch { /* shown below */ } res(v); } });
        c.on("close", () => res(null));
      }));
      const got = await Promise.all(kids);
      await Promise.all(procs.map((c) => new Promise((res) => { c.on("close", res); c.stdin.end(); })));
      return got;
    };
    const mineIn = (root) => { try { return JSON.parse(fs.readFileSync(Hold.holdAt(root), "utf8")).id; } catch { return null; } };
    const tries = [];
    for (let i = 0; i < 3; i++) {
      const root = fresh("race-" + i);
      fs.writeFileSync(Hold.holdAt(root), doc({ id: "dead-one" }));
      ago(Hold.holdAt(root), 120000);
      const got = await race(root, [{}, { slow: 150 }]);
      tries.push({ states: got.map((g) => g && g.state), ids: got.map((g) => g && g.id), file: mineIn(root) });
    }
    check(tries.every((t) => t.states.filter((x) => x === "mine").length === 1 && t.states.filter((x) => x === "other").length === 1
                              && t.ids[t.states.indexOf("mine")] === t.file),
      "rh11 two Studios taking one stale hold at the same moment, one on a slow disk (its rename waits 150 ms), never both hold it: exactly one is told it has it, and it is the one named in the file: " + J(tries));
    const beats = [];
    for (let i = 0; i < 3; i++) {
      const root = fresh("beat-race-" + i);
      fs.writeFileSync(Hold.holdAt(root), doc({ id: "owner", host: os.hostname(), pid: process.pid }));
      ago(Hold.holdAt(root), 120000);
      const got = await race(root, [{ id: "owner", slow: 150 }, {}]);
      beats.push({ states: got.map((g) => g && g.state), file: mineIn(root), ids: got.map((g) => g && g.id) });
    }
    check(beats.every((t) => t.states.filter((x) => x === "mine").length === 1 && t.ids[t.states.indexOf("mine")] === t.file),
      "rh12 a Studio refreshing its own hold (a laptop waking after 45 s, its beat slow) while another takes it over: exactly one holds it afterwards, never both: " + J(beats));
  }

  /* ---- 9 ---- */
  {
    const pl = loadPage({ api: {}, uiLang: "pl" }).page;
    const a = "Etiuda Studio on {COMPUTER} already has {ROOT} open, and one Studio works in a projects folder at a time, so nothing was opened from it here. Quit Studio on {COMPUTER}, or choose another projects folder, then try again.";
    const b = "Studio cannot tell whether another copy has {ROOT} open, because it cannot read or replace {FILE}, so nothing was opened from it. Once that file is deleted, try again.";
    check(pl.T(a) !== a && pl.T(b) !== b && /\{ROOT\}/.test(pl.T(a)) && /\{FILE\}/.test(pl.T(b)),
      "rh9 both sentences have a Polish line that keeps its places: " + J([pl.T(a).slice(0, 30), pl.T(b).slice(0, 30)]));
  }

  copyPlants({
    root: ROOT, self: SELF, label: "root-hold", onlyVar: "ROOT_HOLD_ONLY", check, skip, timeout: 240000,
    plants: [
      { mark: "rh-live", leg: "rh2", rel: "src/root-hold.cjs", line: "  if (false) return false;" },
      { mark: "rh-age", leg: "rh3", rel: "src/root-hold.cjs", line: "  return true;" },
      { mark: "rh-trouble", leg: "rh5", rel: "src/root-hold.cjs", line: "      if (!e || e.code !== \"ENOENT\") return { state: \"other\", by: null };" },
      { mark: "rh-other", leg: "rh1", rel: "src/root-hold.cjs", line: "    if (false) return { state: \"other\", by: byOf(d) };" },
      { mark: "rh-cas-take", leg: "rh11", rel: "src/root-hold.cjs", line: "    try { writeWhole(file, textOf(me)); }" },
      { mark: "rh-cas-beat", leg: "rh12", rel: "src/root-hold.cjs", line: "      try { writeWhole(file, textOf(me)); }" },
    ],
  });

  check(asserted + skipped + 1 === EXPECTED,
    "rh10 every leg ran: " + (asserted + skipped + 1) + " of " + EXPECTED + (skipped ? ", " + skipped + " skipped" : ""));
  process.stdout.write("root-hold: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + String.fromCharCode(10));
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + String.fromCharCode(10));
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "root-hold");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stdout.write("  FAIL tests/root-hold.mjs threw: " + (e && e.stack || e) + String.fromCharCode(10));
  process.exit(1);
});
