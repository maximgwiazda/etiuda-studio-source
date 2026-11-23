/* A JOIN REQUEST REACHES THE LEAD AS IT IS WRITTEN (sense pass, finding 8).
 *
 *     node tests/join-live.mjs
 *
 * The live desks watch reports desks/<id>/join.json as it reports the two catalog files. That
 * report takes the same admission the focus pass and the five-minute pass already make, and the
 * Desks page repaints from it, with no focus and no wait for WATCH_MS. When fs.watch cannot arm,
 * one line names the folder and the error, and a second arm of that folder says nothing again.
 *
 * Each check is planted red first: the child runs that one check against the planted source and
 * must print PLANT-RED, and the source is put back by its sha256 before the next plant. The green
 * run is this process, which loaded the modules before any plant.
 */
import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { plantText } from "./plant-copy.mjs";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Use from "../src/catalog-use.mjs";
import * as Studio from "../src/studio.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { newTeam, withRecovery, writeTeam, heldTeam, withChannel } from "../src/team.mjs";
import { WATCH_MS } from "../src/team-watch.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH = path.join(ROOT, "scratch", "join-live");
const SELF = fileURLToPath(import.meta.url);
/* Set before the first plant. The child runs from this copy, so its ROOT is the copy. */
let tree = null;
const ONLY = process.env.JOIN_LIVE_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const PASS = "quay-gate-passphrase";
const DESK_NAME = "Mira Quay";
const IDS = ["8jla", "8jlb", "8jlc", "8jld"];

const ENT = { "&#39;": "'", "&quot;": "\"", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
function textOf(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]).replace(/\s+/g, " ").trim();
}
function no(id, why) {
  console.error(id + " " + why);
  return false;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* A genuine request proving a live invitation, the shape admitWaiting lets in when the watch sees it. */
function writeJoin(share, teamId, inv) {
  const J = Engine.joinRules();
  const raw = (k) => k.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const pair = crypto.generateKeyPairSync("ed25519");
  const pub = raw(pair.publicKey);
  const id = J.branchIdOf(pub);
  const box = raw(crypto.generateKeyPairSync("x25519").publicKey);
  const nonce = crypto.randomBytes(32).toString("hex");
  const commit = J.joinCommit(teamId, pub, box, nonce);
  const doc = {
    format: 1, kind: J.JOIN_KIND, team: teamId,
    desk: { id, key: pub, box, name: DESK_NAME },
    date: "2026-10-15T09:40:00.000Z", commit,
  };
  if (inv) doc.invite = { id: inv.id, proof: Engine.inviteRules().memberProof(inv.secret, commit) };
  doc.sig = { alg: "Ed25519", keyId: id };
  doc.sig.value = crypto.sign(null, J.joinSignedBytes(doc), pair.privateKey).toString("hex");
  const dir = path.join(share, "desks", id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "join.json"), JSON.stringify(doc));
  return id;
}

async function checkLive() {
  const base = path.join(SCRATCH, "8jla-" + process.pid + "-" + crypto.randomBytes(3).toString("hex"));
  const share0 = path.join(base, "share");
  const home = path.join(base, "projects");
  fs.mkdirSync(share0, { recursive: true });
  fs.mkdirSync(path.join(share0, "desks"), { recursive: true });
  const keyAt = path.join(base, "lead-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  const teamKey = crypto.randomBytes(32);
  let team = newTeam({ catalogs: ["quay-lamps"], lead: { keyId: lead.keyId, public: lead.public } });
  /* On the relay (was: a team kept for a shared folder, which Studio no longer admits at; the folder team's removal). */
  team = withChannel(team, { kind: "relay", rt: "7e".repeat(16), url: "https://etiuda.dev" }, { format: 1, kind: "etiuda-ring", keys: [] });
  team = withRecovery(team, teamKey, PASS);
  team = (await writeTeam(share0, team, { key: keyAt, passphrase: PASS })).team;
  const invSecret = crypto.randomBytes(16).toString("hex");
  const invId = Engine.inviteRules().inviteIdOf(invSecret);
  const invites = { [invId]: { id: invId, team: team.id, secret: invSecret, made: "2026-10-15T09:00:00.000Z", expires: "2099-01-01T00:00:00.000Z", state: "live" } };
  const made = await Studio.newProject(home, "Quay lamps", ["en"]);
  const proj = made && made.dir ? made.dir : made;
  await Studio.setPublishFolder(proj, share0);
  const open = JSON.parse(JSON.stringify(await Studio.openProject(proj)));
  const { loadPage } = await import("./page-stand-in.mjs");
  let reads = 0;
  const api = {
    desks: async () => {
      reads++;
      const r = await Studio.desksFor(proj, keyAt);
      return Object.assign(r, { keyHeld: true, canKeep: true, keyOpens: true, invites: [] });
    },
  };
  const homePage = loadPage({ api, uiLang: "en" });
  const page = homePage.page;
  page.S.host = { tour: { offered: true } };
  Object.assign(page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
  await page.desksLoad();
  const before = textOf(homePage.node("#main").innerHTML);
  if (before.includes(DESK_NAME)) return no("8jla", "name already on the page");
  const share = page.S.desks && page.S.desks.folder;
  if (!share) return no("8jla", "the page has no folder");
  let landed = false, cause = "", admitted = null, boom = null, done = null, watch = null;
  const armedAt = Date.now();
  try {
    watch = Use.watchFolder(share, (ids, detail) => {
      Use.routeWatch(detail, () => {
        if (done) return;
        cause = "watch";
        done = (async () => {
          admitted = await Studio.watchAdmit(share, keyAt, PASS, { teamKeys: { [team.id]: { 1: teamKey } }, invites });
          page.teamMoved(share);
        })().catch((e) => { boom = e; });
      }, () => { landed = true; });
    }, { settle: 40 });
    const deskId = writeJoin(share, team.id, { id: invId, secret: invSecret });
    const until = Date.now() + 25000;
    while (Date.now() < until && !done) await sleep(40);
    if (done) await done;
    const paintUntil = Date.now() + 25000;
    let after = textOf(homePage.node("#main").innerHTML);
    while (Date.now() < paintUntil && !after.includes(DESK_NAME)) {
      await sleep(40);
      after = textOf(homePage.node("#main").innerHTML);
    }
    const waited = Date.now() - armedAt;
    const membersAt = after.indexOf("Members");
    const nameAt = after.indexOf(DESK_NAME);
    const askingAt = after.indexOf("Asking to join");
    const held = (await heldTeam(share, { key: keyAt })).team;
    const onRoster = !!(held && (held.roster || []).some((e) => e && e.desk && e.desk.id === deskId && e.door === "invitation" && e.wrap));
    const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const wired = shell.includes("Use.routeWatch(detail, () => { teamWatch(\"\"); }, () => { onUseMoved(key); })");
    const pageOk = askingAt >= 0 && membersAt > askingAt && nameAt > membersAt && after.includes("by invitation");
    const soon = waited < WATCH_MS && waited < 15000;
    const ok = onRoster && pageOk && cause === "watch" && !landed && soon && wired && !boom
      && admitted && admitted.admitted && admitted.admitted.join() === deskId && reads >= 2;
    if (!ok) return no("8jla", JSON.stringify({
      onRoster, pageOk, cause, landed, waited, wired, reads, boom: boom && String(boom.message || boom),
      admitted: admitted && admitted.admitted, nameAt, membersAt, askingAt,
    }));
    return true;
  } finally { if (watch) watch.close(); }
}

function checkArm() {
  const folder = path.join(SCRATCH, "8jlb");
  const lines = [];
  const prev = process.stderr.write;
  process.stderr.write = (chunk, enc, cb) => {
    lines.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    const done = typeof enc === "function" ? enc : cb;
    if (typeof done === "function") done();
    return true;
  };
  let a = null, b = null;
  try {
    a = Use.watchFolder(folder, () => {}, {});
    b = Use.watchFolder(folder, () => {}, {});
  } finally {
    process.stderr.write = prev;
    if (a) a.close();
    if (b) b.close();
  }
  const resolved = path.resolve(folder);
  const hits = lines.filter((l) => l.includes("the desk watch could not arm on " + resolved) && /ENOENT|no such file/i.test(l));
  if (hits.length !== 1) return no("8jlb", JSON.stringify({ hits: hits.length, lines }));
  return true;
}

/* Lines written to stderr while `fn` runs, kept rather than printed. */
async function quietly(fn) {
  const lines = [];
  const prev = process.stderr.write;
  process.stderr.write = (chunk, enc, cb) => {
    lines.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    const done = typeof enc === "function" ? enc : cb;
    if (typeof done === "function") done();
    return true;
  };
  try { return { value: await fn(), lines }; } finally { process.stderr.write = prev; }
}

/* A REQUEST INTO A TEAM FOLDER WITH NO desks/ IS REPORTED WITH NO FOCUS, PASS OR SCREEN READ (the test architect's
   condition on 0ac5d3c, and his four points on 27444a8). The watch is armed once, on a folder no desk has asked to
   join, and never again by this leg's hand: the request that makes desks/ is reported, not taken as the baseline,
   and so is one written after desks/ went away and came back. A folder that is not there at all arms nothing and is
   dropped, so the shell's pass arms it again; and the shell's pass both drops and arms again. */
async function checkRearm() {
  const base = path.join(SCRATCH, "8jlc-" + process.pid);
  const folder = path.join(base, "team");
  fs.mkdirSync(folder, { recursive: true });
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const heard = [];
  const seen = async (id) => {
    const until = Date.now() + 15000;
    while (Date.now() < until) { if (heard.some((j) => j.indexOf(id) >= 0)) return true; await sleep(40); }
    return false;
  };
  const run = await quietly(async () => {
    const h = Use.watchFolder(folder, (ids, detail) => { heard.push(detail && detail.join ? detail.join.slice() : []); }, { settle: 40 });
    const away = Use.watchFolder(path.join(base, "away"), () => {}, {});
    try {
      const armedEmpty = h.armed() === true;
      const awayMap = new Map([["away", away]]);
      const awayDropped = Use.dropUnarmed(awayMap).length === 1 && awayMap.size === 0;
      const teamMap = new Map([["team", h]]);
      const teamKept = Use.dropUnarmed(teamMap).length === 0 && teamMap.size === 1;
      const t0 = Date.now();
      const first = writeJoin(folder, teamId);
      const firstHeard = await seen(first);
      const firstMs = Date.now() - t0;
      fs.rmSync(path.join(folder, "desks"), { recursive: true, force: true });
      await sleep(400);
      const second = writeJoin(folder, teamId);
      const secondHeard = await seen(second);
      return { armedEmpty, awayDropped, teamKept, firstHeard, firstMs, secondHeard };
    } finally { h.close(); away.close(); }
  });
  const r = run.value;
  const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const keepsArmed = shell.includes("if (h.armed()) useWatchers.set(key, h); else h.close();");
  /* The plant mark sits on the brace line. The pass still awaits the rearm. */
  const passArms = /async function watchOnce\(force\) \{(?:\s*\/\* plant:[A-Za-z0-9_-]+ \*\/)?\s*await rearmUseWatches\(\);/.test(shell);
  const rearmAt = shell.indexOf("async function rearmUseWatches() {");
  const rearmBody = rearmAt >= 0 ? shell.slice(rearmAt, shell.indexOf("\n}\n", rearmAt)) : "";
  const dropAt = rearmBody.indexOf("Use.dropUnarmed(useWatchers);");
  const reArms = dropAt >= 0 && rearmBody.indexOf("armCatalogWatches();", dropAt) > dropAt;
  const ok = r.armedEmpty && r.awayDropped && r.teamKept && r.firstHeard && r.firstMs < 15000 && r.secondHeard
    && keepsArmed && passArms && reArms;
  if (!ok) return no("8jlc", JSON.stringify(Object.assign({}, r, { keepsArmed, passArms, reArms })));
  return true;
}

/* A WATCHER THAT STOPS ON AN ERROR SAYS SO, ONCE PER FOLDER (the test architect's point 2 on 27444a8), and a handle
   whose every watcher has stopped reads as not armed, so the shell's pass takes it. fs.watch is stood in for, so the
   error can be raised on the watcher itself. */
async function checkStop() {
  const folder = path.join(SCRATCH, "8jld-" + process.pid);
  fs.mkdirSync(path.join(folder, "desks"), { recursive: true });
  const made = [];
  const stub = (p) => {
    const w = new EventEmitter();
    w.at = path.resolve(p);
    w.closed = false;
    w.close = () => { w.closed = true; };
    made.push(w);
    return w;
  };
  const run = await quietly(async () => {
    const h = Use.watchFolder(folder, () => {}, { watch: stub });
    const desksW = made.find((w) => path.basename(w.at) === "desks");
    const rootW = made.find((w) => path.basename(w.at) !== "desks");
    const before = h.armed();
    if (desksW) { desksW.emit("error", new Error("planted stop")); desksW.emit("error", new Error("planted again")); }
    const afterOne = h.armed();
    if (rootW) rootW.emit("error", new Error("planted root stop"));
    const afterBoth = h.armed();
    h.close();
    return { made: made.length, before, afterOne, afterBoth, closed: made.every((w) => w.closed) };
  });
  const resolved = path.resolve(folder);
  const stops = run.lines.filter((l) => l.indexOf("studio  the desk watch stopped on " + resolved + ": ") === 0);
  const r = run.value;
  const ok = r.made === 2 && r.before === true && r.afterOne === true && r.afterBoth === false && r.closed
    && stops.length === 1 && stops[0].indexOf("planted stop") > 0;
  if (!ok) return no("8jld", JSON.stringify(Object.assign({}, r, { stops })));
  return true;
}

const CHECKS = { "8jla": checkLive, "8jlb": checkArm, "8jlc": checkRearm, "8jld": checkStop };

const PLANTS = [
  ["8jla", "src/catalog-use.mjs", '["in-use.ec", "catalog-answer.ec", "join.json", "stats.estat"]', '["in-use.ec", "catalog-answer.ec", "stats.estat"]'],
  ["8jla", "src/catalog-use.mjs", "if (detail && Array.isArray(detail.join) && detail.join.length)", "if (false && detail && Array.isArray(detail.join) && detail.join.length)"],
  ["8jla", "shell/main.js", "Use.routeWatch(detail, () => { teamWatch(\"\"); }, () => { onUseMoved(key); })", "onUseMoved(key)"],
  ["8jlb", "src/catalog-use.mjs", "if (!watcher && !rootWatcher) logArmFailure(folder, rootErr);", ""],
  ["8jlb", "src/catalog-use.mjs", "if (armLogged.has(at)) return;", "if (false && armLogged.has(at)) return;"],
  ["8jlc", "src/catalog-use.mjs", "if (there && !watcher) armDesks(true);", "if (false) armDesks(true);"],
  ["8jlc", "src/catalog-use.mjs", "if (late) schedule();", "if (late) scan(false);"],
  ["8jlc", "src/catalog-use.mjs", "if (h && typeof h.armed === \"function\" && h.armed()) continue;", "continue;"],
  ["8jlc", "shell/main.js", "if (h.armed()) useWatchers.set(key, h); else h.close();", "useWatchers.set(key, h);"],
  ["8jlc", "shell/main.js", "async function watchOnce(force) {\n  await rearmUseWatches();\n", "async function watchOnce(force) {\n"],
  ["8jlc", "shell/main.js", "    Use.dropUnarmed(useWatchers);\n    armCatalogWatches();\n", "    Use.dropUnarmed(useWatchers);\n"],
  ["8jld", "src/catalog-use.mjs", "      watcher = null;\n      logWatchStop(folder, err);", "      watcher = null;"],
  ["8jld", "src/catalog-use.mjs", "if (stopLogged.has(at)) return;", "if (false && stopLogged.has(at)) return;"],
];

function plantOnce(id, rel, from, to) {
  const file = path.join(tree, rel);
  const buf = fs.readFileSync(file);
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const text = buf.toString("utf8");
  const next = plantText(text, from, to, rel);
  let child = null;
  try {
    fs.writeFileSync(file, next, "utf8");
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
      cwd: tree,
      env: Object.assign({}, process.env, { JOIN_LIVE_ONLY: id, ETIUDA_PLANTS: "off" }),
      encoding: "utf8",
      timeout: 90000,
    });
  } finally {
    fs.writeFileSync(file, buf);
    const back = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    if (back !== sha) throw new Error(id + " restore mismatch");
  }
  const red = !!(child && child.status === 1 && String(child.stdout || "").includes("PLANT-RED"));
  if (!red) {
    console.error(id + " plant did not bite status=" + (child && child.status) + " signal=" + (child && child.signal));
    console.error(String(child && child.stdout || ""));
    console.error(String(child && child.stderr || ""));
  }
  return red;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  /* ETIUDA_PLANTS=off (a merge's area run) skips the plants phase and counts it as the one check it is. */
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy, and the checkout's sha256 is unchanged after it (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    let red = 0;
    let held = false;
    try {
      tree = plantsTree(ROOT, "join-live");
      for (const [id, rel, from, to] of PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
    } finally {
      dropPlantsTree(tree, ROOT);
    }
    if (red !== PLANTS.length || !held) {
      dropScratch(SCRATCH, "join-live");
      process.exit(1);
    }
  }
  let n = 0;
  for (const id of IDS) {
    let ok = false;
    try { ok = await CHECKS[id](); }
    catch (e) { console.error(id + " " + (e && e.stack || e)); ok = false; }
    console.log((ok ? "ok   " : "FAIL ") + id);
    if (ok) n++;
  }
  console.log("join-live " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1) + (PLANTS_OFF ? ", 1 skipped" : ""));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  dropScratch(SCRATCH, "join-live");
  process.exit(n === IDS.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  Promise.resolve(fn()).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  }).catch((e) => {
    console.error(e && e.stack || e);
    process.exit(2);
  });
} else {
  main().catch((e) => {
    console.error(e && e.stack || e);
    try { dropScratch(SCRATCH, "join-live"); } catch { /* the verdict is the error above */ }
    process.exit(1);
  });
}
