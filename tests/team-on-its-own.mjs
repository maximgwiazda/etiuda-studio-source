/* A TEAM IS MADE ON ITS OWN, NOT THROUGH A CATALOG (Max, 2026-11-26 00:54 and 00:30, findings 29 and 31 of the pair of 24 November).
 *
 *     node tests/team-on-its-own.mjs
 *
 * gate-kind: node
 *
 * The specification as ruled: a team is made on its own, and a catalog is put on a team afterwards. Max, 00:54: "I just found out
 * that there's no way to create a team in Studio, if there's no catalog. It's terrible!"; 00:30: "when I was testing Studio by
 * creating a team, it kept asking me about a catalog, as if catalog was a prerequesite for a team creation."
 *
 * ton1  startRelayTeam with no catalog writes a sealed relay team that lists none, into the mirror, and touches no project
 * ton2  undoRelayTeam with no catalog takes that team file and its mirror folder back
 * ton3  through the shell's studio:team-new: a signed-in lead with a relay grant makes a team with no catalog open, the team lists
 *       none, teams.json keeps it, no project is touched; a second press makes a second; past three the limit's sentence refuses
 * ton4  through the shell: a Studio with no signing key refuses in the key's sentence and writes nothing
 * ton5  Team with no team and no catalog in the Library offers Make a team (team-new), and says nothing of a catalog
 * ton6  Team with no team and one catalog offers the same press, and not that catalog's own page (no Publishing row, no folder)
 * ton7  Team with no team and two catalogs asks no question about a catalog: no list of catalogs, no team-start-at
 * ton8  Team with a team offers Make another team with no catalog in the Library, and with every catalog on a team
 * ton9  Make a team opens the team cover with no catalog open, and its press makes the team through teamNew and lands on that team
 * ton10 the Overview with no catalog says no catalog comes first, and offers Make a team
 * ton11 Polish: the same screens say Utwórz zespół and carry no English
 *
 * Publishing in the clear to a plain folder is retired (Max, 2026-11-26 00:37: "Retire it."; 00:40: "Agreed."; findings 26, 28 and 32):
 * ton14 a catalog's own page with no team: Make a team makes one and the page stays the catalog's, listing the new team with a press to put it on
 * ton13 no sentence of the retired folder mechanics stands in ui/app.js or ui/lang.js, and a team's page carries no Publishing switch
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Sign from "../src/sign.mjs";
import * as Team from "../src/team.mjs";
import * as Store from "../src/team-store.mjs";
import * as Relay from "../src/relay.mjs";
import * as Studio from "../src/studio.mjs";
import { clearScratch } from "./scratch.mjs";
import { seatEnv } from "./seated.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-on-its-own");
const nodeRequire = createRequire(import.meta.url);
const NL = "\n";
const PASS = "harbour-lamp-passphrase";
const ONLY = process.env.TEAM_ON_ITS_OWN_ONLY || "";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
async function leg(id, fn) {
  if (ONLY && id !== ONLY) return;
  try { await fn(); }
  catch (err) { check(false, id + " (threw: " + String(err && err.message || err).split(NL)[0].slice(0, 240) + ")"); }
}
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
function snap(dirs) {
  const out = {};
  const walk = (d, rel) => {
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name), r = rel ? rel + "/" + e.name : e.name;
      if (e.isDirectory()) walk(p, r); else out[r] = sha(fs.readFileSync(p));
    }
  };
  for (const [k, d] of Object.entries(dirs)) walk(d, k);
  return JSON.stringify(out);
}
const TEST_VAULT = {
  isEncryptionAvailable: () => true, available: () => true,
  seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t), "utf8").reverse().toString("hex"), "utf8"),
  open: (b) => { const t = Buffer.from(b).toString("utf8"); if (!t.startsWith("sealed:")) throw new Error("not sealed here"); return Buffer.from(t.slice(7), "hex").reverse().toString("utf8"); },
  encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
  decryptString: (b) => { const t = Buffer.from(b).toString("utf8"); if (!t.startsWith("sealed:")) throw new Error("not sealed here"); return Buffer.from(t.slice(7), "hex").reverse().toString("utf8"); },
};

/* A Studio with a signing key and one catalog, and nothing else: no team, no folder. */
async function world(tag) {
  const ud = path.join(SCRATCH, tag);
  clearScratch(ud);
  const projects = path.join(ud, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const keyPath = path.join(ud, Sign.KEY_FILE);
  fs.writeFileSync(keyPath, JSON.stringify(await Sign.makeKeyFile({ passphrase: PASS }), null, 1) + NL);
  const keyDoc = Sign.readKeyFile(keyPath);
  const dir = (await Studio.newProject(projects, "Alpha", [{ code: "en", name: "English" }])).dir;
  const shelf = (await Studio.addTag(dir, "shelf", { en: "General" })).tag.id;
  await Studio.addCard(dir, shelf, "Alpha card", "The answer, in full.");
  return { ud, projects, keyPath, keyDoc, dir, tf: Store.teamsFile(ud) };
}
/* The team a lead's first press makes, as the shell prepares it before the thread is asked. */
function teamKit(w) {
  const rt = Relay.relayId(), teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32);
  Store.keepTeamKey(w.tf, TEST_VAULT, teamId, 1, teamKey);
  const mirror = Store.keepRelay(w.tf, teamId, rt, Relay.RELAY_URL);
  return { rt, teamId, mirror, teamKeys: { [teamId]: { 1: teamKey } } };
}
const startOpts = (w, k) => ({ key: w.keyPath, passphrase: PASS, teamId: k.teamId, rt: k.rt, url: Relay.RELAY_URL, mirror: k.mirror, teamKeys: k.teamKeys, userData: w.ud });

// ---- the shell, under a stub electron (as tests/team-choose.mjs loadShell) -------------------------------------------------------
async function loadShell(ud, thread, more) {
  const Module = nodeRequire("node:module");
  const main = path.join(ROOT, "shell", "main.js"), ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, windows: [], clip: [] };
  class Win {
    constructor() { this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {}, getURL: () => pathToFileURL(ui).href }; got.windows.push(this); }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; } isMinimized() { return false; }
    close() {} focus() {} restore() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }
  const electron = {
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} }, getPath: () => ud, getVersion: () => "0.0.0",
      getLocale: () => "en-GB", requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(), on() {}, quit() {}, exit() {} },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }), showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false }, clipboard: { writeText: (t) => { got.clip.push(String(t)); } }, safeStorage: TEST_VAULT,
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({}), on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {},
      setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: () => Promise.reject(new Error("network forbidden")) },
  };
  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = { execFileSync: () => "", execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }), execFile: () => quiet, spawn: () => quiet, exec: () => quiet, fork: () => quiet };
  const env = Object.assign({ STUDIO_NO_PROXY_SERVER: "off", STUDIO_TEST_OFFSCREEN: "1", STUDIO_KEY_PASSPHRASE: PASS,
    STUDIO_PROJECTS: path.join(ud, "projects"), STUDIO_SIGNING_KEY: path.join(ud, Sign.KEY_FILE), STUDIO_TEST_RELAY_SYNC: "none" }, more || {});
  const was = {};
  Object.assign(env, await seatEnv(ud, true, (more || {})), (more || {}));
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }
  const load = Module._load, before = new Set(Object.keys(nodeRequire.cache));
  const dropCache = () => { delete nodeRequire.cache[main]; for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k]; };
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return { call: async (verb, ...a) => thread(verb, ...a) };
    return load.apply(this, arguments);
  };
  const restore = () => { Module._load = load; dropCache(); for (const k of Object.keys(was)) { if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k]; } };
  try {
    dropCache();
    const shell = nodeRequire(main);
    const event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: got.windows[0] && got.windows[0].webContents };
    return { shell, clip: got.clip, has: (ch) => typeof got.handlers[ch] === "function",
      ask: async (ch, ...a) => { const fn = got.handlers[ch]; if (!fn) throw new Error("no handler for " + ch); return fn(event, ...a); },
      done: async () => { try { if (shell.endRelay) await Promise.race([shell.endRelay(), new Promise((r) => setTimeout(r, 3000))]); } catch { /* exit stops it */ } restore(); } };
  } catch (err) { restore(); throw err; }
}
const studioThread = (verb, ...a) => { if (typeof Studio[verb] === "function") return Studio[verb](...a); throw new Error("no verb " + verb); };
const said = (r) => JSON.stringify(r || "");

// ---- the legs ----------------------------------------------------------------------------------------------------------------------
await leg("ton1", async () => {
  const w = await world("ton1"), k = teamKit(w);
  const project = fs.readFileSync(path.join(w.dir, "project.json"), "utf8"), tree = snap({ dir: w.dir });
  const r = await Studio.startRelayTeam(null, startOpts(w, k));
  const held = (await Team.heldTeam(k.mirror, { key: w.keyPath })).team;
  const ok = !!held && held.id === k.teamId && Array.isArray(held.catalogs) && held.catalogs.length === 0 && held.sealed === true
    && !!held.channel && held.channel.kind === "relay" && held.channel.rt === k.rt
    && !!r && !!r.team && r.team.id === k.teamId && snap({ dir: w.dir }) === tree && fs.readFileSync(path.join(w.dir, "project.json"), "utf8") === project;
  if (!ok) process.stderr.write("ton1 " + said({ held: held && { id: held.id, catalogs: held.catalogs, sealed: held.sealed, channel: held.channel }, reply: r && r.team && r.team.id }) + NL);
  check(ok, "ton1 startRelayTeam with no catalog writes a sealed relay team that lists none into the mirror, and no project is touched");
});

await leg("ton2", async () => {
  const w = await world("ton2"), k = teamKit(w);
  await Studio.startRelayTeam(null, startOpts(w, k));
  const had = fs.existsSync(Team.teamPath(k.mirror));
  const r = await Studio.undoRelayTeam(null, { teamId: k.teamId, rt: k.rt, mirror: k.mirror, folder: null, teamKeys: k.teamKeys });
  const ok = had && !!r && r.undone === true && !fs.existsSync(Team.teamPath(k.mirror)) && !fs.existsSync(k.mirror);
  if (!ok) process.stderr.write("ton2 " + said({ had, r, file: fs.existsSync(Team.teamPath(k.mirror)), dir: fs.existsSync(k.mirror) }) + NL);
  check(ok, "ton2 undoRelayTeam with no catalog takes the team file and the mirror folder back");
});

await leg("ton3", async () => {
  const w = await world("ton3");
  const kit = nodeRequire(path.join(ROOT, "engine", "pinned", "relay", "test", "grant-kit.cjs"));
  fs.writeFileSync(path.join(w.ud, "relay-grant.json"), JSON.stringify(kit.grantFor(w.keyDoc.public, Date.now()), null, 1) + NL);
  const sh = await loadShell(w.ud, studioThread, { STUDIO_RELAY_ROOT: kit.ROOT.pub });
  try {
    const out = {};
    const project = fs.readFileSync(path.join(w.dir, "project.json"), "utf8");
    out.handler = sh.has("studio:team-new");
    if (!out.handler) { check(false, "ton3 the shell answers studio:team-new: " + said(out)); return; }
    const r1 = await sh.ask("studio:team-new");
    const rows = () => Store.relayTeams(w.tf);
    out.first = !!r1 && !r1.error && r1.created === true && r1.relay === true && !!r1.team && rows().length === 1;
    const row = rows()[0];
    const held = row ? (await Team.heldTeam(row.folder, { key: w.keyPath })).team : null;
    out.empty = !!held && held.catalogs.length === 0 && held.sealed === true && held.id === (row && row.team);
    out.kept = !!row && Store.keptTeam(w.tf, row.team) && Store.keptTeam(w.tf, row.team).sealed === true;
    out.project = fs.readFileSync(path.join(w.dir, "project.json"), "utf8") === project;
    const r2 = await sh.ask("studio:team-new"), r3 = await sh.ask("studio:team-new");
    out.three = !!r2 && !r2.error && !!r3 && !r3.error && rows().length === 3;
    const r4 = await sh.ask("studio:team-new");
    out.limit = !!r4 && !!r4.error && said(r4).indexOf(Store.REFUSAL_TEAMS_LIMIT.slice(0, 40)) >= 0 && rows().length === 3;
    const ok = Object.values(out).every((v) => v === true);
    if (!ok) process.stderr.write("ton3 " + said(out) + " first=" + said(r1) + NL);
    check(ok, "ton3 through the shell, a lead makes a team with no catalog: it lists none, teams.json keeps it, no project moves, a second and third are made, the fourth is refused by the limit's sentence");
  } finally { await sh.done(); }
});

await leg("ton4", async () => {
  const w = await world("ton4");
  fs.unlinkSync(w.keyPath);
  const sh = await loadShell(w.ud, studioThread);
  try {
    if (!sh.has("studio:team-new")) { check(false, "ton4 the shell answers studio:team-new"); return; }
    /* The seat's own service record is written as the shell starts and as it answers; what the press may write is a team, a key and a mirror. */
    const before = snap({ projects: w.projects });
    const r = await sh.ask("studio:team-new");
    const ok = !!r && !!r.error && said(r).indexOf("signing key") >= 0 && snap({ projects: w.projects }) === before
      && !fs.existsSync(w.tf) && Store.relayTeams(w.tf).length === 0;
    if (!ok) process.stderr.write("ton4 " + said(r) + NL);
    check(ok, "ton4 with no signing key the press is refused in the key's sentence and writes no team, key or mirror");
  } finally { await sh.done(); }
});

await leg("ton13", async () => {
  const text = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8") + fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const RETIRED = ["Without a team, editions can also be published to a plain folder", "Choose the folder your team reads from",
    "publishes nowhere until it is given a team or a folder", "Plain: any desk that reads this folder can open it.", "Where the team meets",
    "Give this folder its catalog files in the clear", "Seal what this folder is given", "Start a new team in this folder",
    /* the pass over the retired folder mechanics, 2026-11-26: the key the first publish made, the control the folder sentences named, the folder team's own caption */
    "Publishing makes this Studio's signing key and signs the edition with it", "Studio made its signing key, and signs every edition with it from now on.",
    "Change folder beside Writes to chooses", "choose the folder the team reads from first", "Publishing needs the folder the team reads from",
    "The edition is in the team's folder.", "This catalog has a team already, so no other was started."];
  const standing = RETIRED.filter((s) => text.indexOf(s) >= 0);
  /* The control: a sentence that stands is found by the same search. */
  const control = text.indexOf("This studio leads no team yet.".replace("studio", "Studio")) >= 0 && text.indexOf("Make a team") >= 0;
  const { loadPage } = await import("./page-stand-in.mjs");
  const facts = { error: null, folder: "C:/ud/relay/" + "a".repeat(32), file: "ours", signing: "studio-aaaa111122223333", inside: false, keyHeld: true, canKeep: true,
    team: { id: "t-0123456789abcdef", epoch: 1, sealed: true, exportsSealed: true, relay: true, leadPrint: "aaaa111122223333", roster: [] }, requests: [], invites: [] };
  const seen = {};
  for (const lang of ["en", "pl"]) {
    const home = loadPage({ api: { desks: async () => JSON.parse(JSON.stringify(facts)), teams: async () => ({ teams: [] }) }, uiLang: lang });
    const P = home.page;
    Object.assign(P.S, { open: { dir: "C:\\h", name: "H", editions: [], project: { sealedTeam: "t-0123456789abcdef", folder: facts.folder } }, screen: "projects", home: "team",
      teamDir: "C:\\h", desks: JSON.parse(JSON.stringify(facts)), host: { tour: { offered: true } } });
    P.paintMain();
    const h = home.node("#main").innerHTML;
    seen[lang] = !/data-act="team-seal"|data-act="settings-folder"|data-act="team-fresh"/.test(h) && !/aria-checked[^>]*data-act="team-seal"/.test(h);
  }
  const ok = standing.length === 0 && control && seen.en && seen.pl;
  if (!ok) process.stderr.write("ton13 " + said({ standing, control, seen }) + NL);
  check(ok, "ton13 no sentence of the retired folder mechanics stands in ui/app.js or ui/lang.js, and a team's page carries no Publishing switch, in both languages"
    + " (the control: a sentence that stands is found by the same search)");
});

// ---- the page ------------------------------------------------------------------------------------------------------------------
const { loadPage } = await import("./page-stand-in.mjs");
const lib = (name) => ({ dir: "C:\\catalogs\\" + name, name, id: "c-" + name.toLowerCase(), counts: { cards: 0 }, rev: 0 });
const actsIn = (html) => [...String(html).matchAll(/data-act="([^"]+)"/g)].map((m) => m[1]);
const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
const textOf = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]);
const wait = () => new Promise((r) => setTimeout(r, 30));
function teamNamed(id, catalogs) {
  return { id, sealed: true, led: true, connection: "relay", teammates: [], catalogs: catalogs || [], projects: [],
    relay: { url: "https://relay.etiuda.test/relay/v1", rt: "0123456789abcdef0123456789abcdef" } };
}
async function homeTeam(projects, teams, more) {
  const calls = [];
  let current = teams.slice();
  const api = Object.assign({
    teams: async () => ({ teams: current }), projects: async () => ({ root: "C:\\Projects", projects }),
    desks: async () => ({ error: null, folder: null, mark: null, signing: "", file: "none", reason: "", inside: false, keyHeld: false, canKeep: true, restorable: null, requests: [], team: null }),
    licence: async () => ({}), followState: async () => ({ follow: null }),
    teamNew: async () => { calls.push("teamNew"); const t = teamNamed("t-0123456789abcdef"); current = current.concat([t]); return { created: true, relay: true, team: { id: t.id } }; },
  }, (more && more.api) || {});
  const home = loadPage({ uiLang: (more && more.uiLang) || "en", api });
  const P = home.page;
  Object.assign(P.S, { screen: "projects", home: "overview", projects, teams: current, teamTab: 0, teamPickDir: "", teamDir: "", desks: null, desksLoadedFor: "",
    open: null, host: { tour: { offered: true } } });
  await P.ACTS.home({ getAttribute: (k) => (k === "data-v" ? "team" : null) }); await wait();
  return { P, main: () => home.node("#main").innerHTML, calls, home };
}

await leg("ton5", async () => {
  const h = await homeTeam([], []);
  const html = h.main(), acts = actsIn(html), text = textOf(html);
  const ok = acts.indexOf("team-new") >= 0 && /Make a team/.test(text) && !/catalog/i.test(text.replace(/Library/g, ""));
  if (!ok) process.stderr.write("ton5 " + said({ acts, text: text.replace(/\s+/g, " ").slice(0, 300) }) + NL);
  check(ok, "ton5 Team with no team and no catalog offers Make a team, and says nothing of a catalog");
});

await leg("ton6", async () => {
  const h = await homeTeam([lib("Lantern")], []);
  const html = h.main(), acts = actsIn(html), text = textOf(html);
  const ok = acts.indexOf("team-new") >= 0 && acts.indexOf("team-make") < 0 && acts.indexOf("team-seal") < 0 && acts.indexOf("settings-folder") < 0
    && !/Publishing|plain folder|folder/i.test(text) && h.P.S.teamPickDir === "";
  if (!ok) process.stderr.write("ton6 " + said({ acts, text: text.replace(/\s+/g, " ").slice(0, 300) }) + NL);
  check(ok, "ton6 Team with no team and one catalog offers Make a team on its own, not that catalog's page with a Publishing row and a folder");
});

await leg("ton7", async () => {
  const h = await homeTeam([lib("Lantern"), lib("Beacon")], []);
  const html = h.main(), acts = actsIn(html), text = textOf(html);
  const ok = acts.indexOf("team-new") >= 0 && acts.indexOf("team-start-at") < 0 && !/Which catalog/.test(text);
  if (!ok) process.stderr.write("ton7 " + said({ acts, text: text.replace(/\s+/g, " ").slice(0, 300) }) + NL);
  check(ok, "ton7 Team with no team and two catalogs asks no question about a catalog");
});

await leg("ton8", async () => {
  const none = await homeTeam([], [teamNamed("t-aaaaaaaaaaaaaaaa")]);
  const held = await homeTeam([Object.assign(lib("Lantern"), { id: "c-lantern" })], [Object.assign(teamNamed("t-bbbbbbbbbbbbbbbb", ["c-lantern"]), { projects: [{ id: "c-lantern", dir: "C:\\catalogs\\Lantern", name: "Lantern" }] })]);
  const press = async (h) => { await h.P.ACTS["team-new"](); await wait(); return h; };
  const a = actsIn(none.main()), b = actsIn(held.main());
  await press(none);
  const opened = none.P.S.cover === "team" && none.P.S.teamWant === "new";
  const ok = a.indexOf("team-new") >= 0 && b.indexOf("team-new") >= 0 && a.indexOf("team-another") < 0 && b.indexOf("team-another") < 0 && opened
    && !/Every catalog in the Library has a team already|no catalog in the Library/i.test(textOf(none.main()));
  if (!ok) process.stderr.write("ton8 " + said({ a, b, cover: none.P.S.cover, want: none.P.S.teamWant }) + NL);
  check(ok, "ton8 Team with a team offers Make another team with no catalog in the Library and with every catalog on a team, and the press opens the cover");
});

await leg("ton9", async () => {
  const h = await homeTeam([], []);
  await h.P.ACTS["team-new"](); await wait();
  const cover = h.P.teamCoverHtml ? h.P.teamCoverHtml() : "";
  const acts = actsIn(cover), text = textOf(cover);
  const shown = h.P.S.cover === "team" && h.P.S.teamWant === "new" && acts.indexOf("do-team-new") >= 0 && /Start a team on the Etiuda relay/.test(text)
    && acts.indexOf("team-where") < 0 && acts.indexOf("do-team-seal") < 0 && !/catalog/i.test(text);
  await h.P.ACTS["do-team-new"](); await wait(); await wait();
  const landed = h.calls.length === 1 && h.calls[0] === "teamNew" && h.P.S.cover === null && (h.P.S.teams || []).length === 1 && h.P.S.teamTab === 0
    && /data-team="t-0123456789abcdef"/.test(h.main()) && actsIn(h.main()).indexOf("team-add-catalog") >= 0;
  if (!(shown && landed)) process.stderr.write("ton9 " + said({ shown, landed, cover: h.P.S.cover, calls: h.calls, acts: actsIn(h.main()) }) + NL);
  check(shown && landed, "ton9 Make a team opens the team cover with no catalog open, its press makes the team through teamNew and lands on that team, which offers Add a catalog");
});

await leg("ton10", async () => {
  const h = await homeTeam([], []);
  h.P.S.home = "overview"; h.P.paintProjects();
  const text = textOf(h.main()), acts = actsIn(h.main());
  const ok = !/a catalog comes first/i.test(text) && (acts.indexOf("to-teams") >= 0 || acts.indexOf("team-new") >= 0) && /Make a team/.test(text);
  if (!ok) process.stderr.write("ton10 " + said({ acts, text: text.replace(/\s+/g, " ").slice(0, 400) }) + NL);
  check(ok, "ton10 the Overview with no catalog does not say a catalog comes first and offers Make a team");
});

await leg("ton11", async () => {
  const h = await homeTeam([lib("Lantern")], [], { uiLang: "pl" });
  const text = textOf(h.main()), acts = actsIn(h.main());
  await h.P.ACTS["team-new"](); await wait();
  const cover = textOf(h.P.teamCoverHtml());
  const ok = acts.indexOf("team-new") >= 0 && /Utwórz zespół/.test(text) && !/Make a team/.test(text) && /zespół/i.test(cover) && !/Start a team/.test(cover);
  if (!ok) process.stderr.write("ton11 " + said({ acts, text: text.replace(/\s+/g, " ").slice(0, 300), cover: cover.replace(/\s+/g, " ").slice(0, 300) }) + NL);
  check(ok, "ton11 Polish: Team and the cover say Utwórz zespół and carry no English");
});

await leg("ton14", async () => {
  const dir = "C:\\catalogs\\Lantern";
  const h = await homeTeam([lib("Lantern")], [], {});
  Object.assign(h.P.S, { teamPickDir: dir, teamDir: dir });
  await h.P.desksLoad(dir); await wait();
  const before = h.main();
  await h.P.ACTS["team-new"](); await wait();
  await h.P.ACTS["do-team-new"](); await wait(); await wait();
  const after = h.main();
  const ok = /data-no-team/.test(before) && !/team-add-pick/.test(before) && /data-no-team/.test(after) && /data-act="team-add-pick"[^>]*data-team="t-0123456789abcdef"/.test(after)
    && h.P.S.cover === null && h.calls.length === 1;
  if (!ok) process.stderr.write("ton14 " + said({ before: textOf(before).slice(0, 200), after: textOf(after).slice(0, 300), cover: h.P.S.cover, calls: h.calls }) + NL);
  check(ok, "ton14 a catalog's own page with no team: Make a team makes one, and the page stays the catalog's, listing the new team with a press to put it on");
});

/* AN INVITATION BELONGS TO THE TEAM, NOT TO A CATALOG (the ruling of 2026-11-26 07:21 on finding 29: inviting a teammate was keyed to a catalog,
   so an empty team showed Add a catalog first). A team with no catalog is invited to by its own place, the team's id, where a catalog's place
   was its folder: the same blob a desk reads (team, relay, lead, secret), made from the team file the mirror holds. */
const TIB_TEAM = "t-0123456789abcdef";
async function bareTeam(tag) {
  const w = await world(tag);
  const kit = nodeRequire(path.join(ROOT, "engine", "pinned", "relay", "test", "grant-kit.cjs"));
  fs.writeFileSync(path.join(w.ud, "relay-grant.json"), JSON.stringify(kit.grantFor(w.keyDoc.public, Date.now()), null, 1) + NL);
  const sh = await loadShell(w.ud, studioThread, { STUDIO_RELAY_ROOT: kit.ROOT.pub });
  const made = await sh.ask("studio:team-new");
  const row = Store.relayTeams(w.tf)[0];
  return { w, sh, made, row, teamId: row && row.team };
}
await leg("tib1", async () => {
  const b = await bareTeam("tib1");
  try {
    const out = {};
    out.team = !!b.teamId && !b.made.error;
    const before = fs.readFileSync(path.join(b.w.dir, "project.json"), "utf8");
    const r = out.team ? await b.sh.ask("studio:desks", b.teamId) : null;
    out.read = !!r && !r.error && r.file === "ours" && !!r.team && r.team.id === b.teamId && Array.isArray(r.team.roster) && r.team.roster.length === 0
      && Array.isArray(r.invites) && r.invites.length === 0;
    out.project = fs.readFileSync(path.join(b.w.dir, "project.json"), "utf8") === before;
    const ok = Object.values(out).every((v) => v === true);
    if (!ok) process.stderr.write("tib1 " + said(out) + " desks=" + said(r).slice(0, 300) + NL);
    check(ok, "tib1 studio:desks answers a team with no catalog by its id: the team file this Studio leads, its roster and its invitations, and no project is read");
  } finally { await b.sh.done(); }
});

await leg("tib2", async () => {
  const b = await bareTeam("tib2");
  try {
    const out = {};
    const made = b.teamId ? await b.sh.ask("studio:invite-make", b.teamId, "Mira Lantern", "Ada Harbour") : null;
    const id = made && made.invited;
    out.made = !!made && !made.error && typeof id === "string" && Array.isArray(made.invites) && made.invites.some((i) => i.id === id && i.relay === true && i.person === "Ada Harbour");
    out.clip = b.sh.clip.length === 1 && /^https:\/\/etiuda\.dev\/join#/.test(b.sh.clip[0]);
    /* The blob is the shape the desk reads, with nothing added and no folder (src/invite.mjs). */
    const payload = out.clip ? b.sh.clip[0].split("#")[1] : "";
    let doc = null;
    try { doc = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { doc = null; }
    const keys = doc ? Object.keys(doc).sort().join(",") : "";
    out.shape = !!doc && /^(lead,relay,secret,team|lead,relay,secret,signin,team)$/.test(keys) && doc.team === b.teamId && doc.relay.rt === b.row.rt
      && doc.lead.keyId === b.w.keyDoc.keyId && doc.lead.public === b.w.keyDoc.public && doc.lead.name === "Mira Lantern";
    const Eng = await import("../src/engine.mjs");
    const read = doc ? Eng.inviteRules().inviteRead("etiuda-join:" + payload, process.platform !== "win32") : null;
    out.desk = !!read && read.team === b.teamId && !!read.relay && read.relay.rt === b.row.rt && (read.folder === undefined || read.folder === "");
    const again = id ? await b.sh.ask("studio:invite-copy", b.teamId, id, "text") : null;
    out.copy = !!again && !again.error && again.copied === id && again.as === "text" && b.sh.clip.length === 2 && /^etiuda-join:/.test(b.sh.clip[1]);
    const gone = await b.sh.ask("studio:invite-cancel", b.teamId, "0".repeat(32));
    out.cancel = !!gone && !!gone.error && /ended/.test(said(gone));
    const listed = await b.sh.ask("studio:desks", b.teamId);
    out.listed = !!listed && Array.isArray(listed.invites) && listed.invites.length === 1 && listed.invites[0].id === id;
    const ok = Object.values(out).every((v) => v === true);
    if (!ok) process.stderr.write("tib2 " + said(out) + " made=" + said(made).slice(0, 300) + NL);
    check(ok, "tib2 an invitation is made, copied and found again by the team's id with no catalog: the blob is the desk's own shape (team, relay, lead, secret; no folder) and the desk's reader reads it back");
  } finally { await b.sh.done(); }
});

const tibFacts = (invites) => ({ error: null, folder: "C:/ud/relay/" + "0123456789abcdef".repeat(2), file: "ours", signing: "studio-aaaa111122223333", inside: false, keyHeld: true, canKeep: true,
  relay: true, team: { id: TIB_TEAM, epoch: 1, sealed: true, exportsSealed: true, relay: true, leadPrint: "aaaa111122223333", roster: [] }, requests: [], invites });
const tibInvite = (id, person) => ({ id, name: "Mira Lantern", person, made: "2026-11-26T08:00:00.000Z", expires: "2026-12-03T08:00:00.000Z", relay: true, used: null, pendingMove: false });
async function bareHome(more, lang) {
  const facts = tibFacts([]), calls = [];
  const api = Object.assign({
    desks: async (d) => { calls.push(["desks", d]); return JSON.parse(JSON.stringify(facts)); },
    inviteMake: async (d, name, person) => {
      calls.push(["inviteMake", d, name, person]);
      facts.invites = facts.invites.concat([tibInvite("a1".repeat(16), person || "")]);
      return Object.assign(JSON.parse(JSON.stringify(facts)), { invited: "a1".repeat(16) });
    },
    peopleList: async (d) => { calls.push(["peopleList", d]); return { people: [], invites: [{ invite: "b2".repeat(16), address: "ada@example.com", at: Date.now() }], confirms: [], relay: true }; },
    personInvite: async (d, address) => { calls.push(["personInvite", d, address]); return { invite: "b2".repeat(16) }; },
  }, (more && more.api) || {});
  const h = await homeTeam([], [teamNamed(TIB_TEAM)], { api, uiLang: lang || "en" });
  return Object.assign(h, { facts, callsIn: calls });
}
await leg("tib3", async () => {
  const h = await bareHome();
  const html = h.main(), acts = actsIn(html), text = textOf(html);
  const out = {};
  out.place = h.callsIn.some((c) => c[0] === "desks" && c[1] === TIB_TEAM);
  /* Old sentence beside new: the empty team said "Invite a teammate is offered here once the team holds a catalog, so an empty team starts with
     Add a catalog to this team."; it now offers the press itself, with no catalog and no sentence of one first. */
  out.offered = acts.indexOf("invite-new") >= 0 && !/offered here once the team holds a catalog/.test(text);
  out.catalogStillOffered = acts.indexOf("team-add-catalog") >= 0;
  out.noCatalogBound = acts.indexOf("publish") < 0 && acts.indexOf("arch-export") < 0 && acts.indexOf("policy-save") < 0 && acts.indexOf("team-sharing") < 0;
  const first = html.indexOf('data-act="invite-new"'), second = html.indexOf('data-act="team-add-catalog"');
  out.firstAsked = first >= 0 && second >= 0 && first < second;
  await h.P.ACTS["invite-new"](); await wait();
  out.cover = h.P.S.cover === "team" && h.P.S.teamWant === "invite";
  await h.P.ACTS["do-invite"](); await wait(); await wait();
  const made = h.callsIn.find((c) => c[0] === "inviteMake");
  out.made = !!made && made[1] === TIB_TEAM && h.P.S.cover === null && /data-invite="a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1"/.test(h.main());
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tib3 " + said(out) + " acts=" + said(acts) + " text=" + text.replace(/\s+/g, " ").slice(0, 300) + NL);
  check(ok, "tib3 a team with no catalog offers Invite a teammate itself, before Add a catalog and with no sentence of a catalog first; the press makes the invitation for the team's id and its row is listed");
});

await leg("tib4", async () => {
  const h = await bareHome({ api: {} });
  Object.assign(h.P.S, { lic: { by: "signin", provider: "microsoft", signIn: ["microsoft"] } });
  h.P.S.desks = null; h.P.S.desksLoadedFor = ""; h.P.S.people = null;
  await h.P.desksLoad(); await wait(); await wait();
  const html = h.main(), out = {};
  out.row = /data-person-invite-row/.test(html) && /data-person-invited="b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2"/.test(html);
  out.listed = h.callsIn.some((c) => c[0] === "peopleList" && c[1] === TIB_TEAM);
  h.home.node("#main input[data-person-invite]").value = "ada@example.com";
  await h.P.ACTS["person-invite"](); await wait(); await wait();
  const sent = h.callsIn.find((c) => c[0] === "personInvite");
  out.sent = !!sent && sent[1] === TIB_TEAM && sent[2] === "ada@example.com";
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tib4 " + said(out) + NL);
  check(ok, "tib4 signed in, a team with no catalog invites by email address: the field is drawn, the list is read for the team's id and the press sends the address for it");
});

await leg("tib5", async () => {
  const h = await bareHome({}, "pl");
  const html = h.main(), text = textOf(html), acts = actsIn(html);
  const ok = acts.indexOf("invite-new") >= 0 && /Zaproś/.test(text) && !/Invite a teammate|Invitations|Each invitation/.test(text);
  if (!ok) process.stderr.write("tib5 " + said({ acts, text: text.replace(/\s+/g, " ").slice(0, 400) }) + NL);
  check(ok, "tib5 Polish: a team with no catalog offers Zaproś and carries none of the English");
});

/* A team with no catalog moves to a new key by its id, as a used invitation's cancel does (the thread's moveEpoch, which reads its team at the mirror). */
await leg("tib6", async () => {
  const b = await bareTeam("tib6");
  try {
    const keys = Store.teamKeysOf(b.w.tf, TEST_VAULT), out = {};
    out.keys = !!b.teamId && !!keys[b.teamId] && !!keys[b.teamId][1];
    const moved = out.keys ? await Studio.moveTeamKey(b.row.folder, b.w.keyPath, b.teamId, PASS,
      { confirm: true, atFolder: b.row.folder, teamKeys: keys, userData: b.w.ud, teamsFile: b.w.tf }).catch((e) => ({ threw: String(e && e.message || e) })) : null;
    out.moved = !!moved && moved.moved === true && moved.epoch === 2 && !!moved.team && moved.team.id === b.teamId && !moved.threw;
    const ok = Object.values(out).every((v) => v === true);
    if (!ok) process.stderr.write("tib6 " + said(out) + " moved=" + said(moved).slice(0, 300) + NL);
    check(ok, "tib6 a team with no catalog moves to a new key by its id: the thread reads its team at the mirror, the key number goes from 1 to 2 and the reply is the team's own read");
  } finally { await b.sh.done(); }
});

/* THE TEAM'S ID IS A NAME UNDER THE PROJECTS ROOT AND NOTHING ELSE: a page's string is confined by projectDir before the id is read from it, and the
   mirror comes from teams.json, never from the page (the test architect's hold on 333e11fc, ipc-coerce ic2). A path outside the projects root that
   ends in a real team's id, a name that climbs out of it, and an id no team has are each refused by every verb, and nothing is made. */
await leg("tib7", async () => {
  const b = await bareTeam("tib7");
  try {
    const out = {};
    const outside = path.join(b.w.ud, "elsewhere", String(b.teamId)), climbing = path.join(b.w.projects, "..", String(b.teamId)), unknown = "t-" + "0".repeat(16);
    const refused = (r) => !!r && !!r.error;
    for (const [label, place] of [["outside", outside], ["climbing", climbing], ["unknown", unknown]]) {
      const got = [await b.sh.ask("studio:desks", place), await b.sh.ask("studio:invite-make", place, "Mira Lantern", "Ada Harbour"),
        await b.sh.ask("studio:invite-copy", place, "0".repeat(32), "text"), await b.sh.ask("studio:invite-cancel", place, "0".repeat(32))];
      out[label] = got.every(refused);
    }
    out.nothingMade = b.sh.clip.length === 0 && Store.invitesOf(b.w.tf, b.teamId).length === 0;
    /* The control: the id itself, which tib1 and tib2 read and make by. */
    const control = await b.sh.ask("studio:desks", b.teamId);
    out.control = !!control && !control.error && control.file === "ours";
    const ok = Object.values(out).every((v) => v === true);
    if (!ok) process.stderr.write("tib7 " + said(out) + NL);
    check(ok, "tib7 a path outside the projects root ending in a real team's id, a name that climbs out of it and an id no team has are refused by desks, invite-make, invite-copy and invite-cancel, and nothing is made (the control: the id itself reads)");
  } finally { await b.sh.done(); }
});

/* Each plant is the line carrying its mark, replaced in a scratch copy; the copy's own run of the one leg must go red (tests/plant-copy.mjs). */
const PLANTS = [
  { mark: "ton-own", leg: "ton1", rel: "src/studio.mjs", line: "  const opts = o || {}, own = false, home = path.resolve(dir);" },
  /* ton-shell-own retired 2026-11-26 with studio:team-relay: it lifted the shell's reading of "no catalog" into "a catalog", and the shell reads no catalog now (the line is gone; the mark stays as a comment in shell/main.js). */
  { mark: "ton-empty", leg: "ton5", rel: "ui/app.js", line: "        + \"</div>\";" },
  { mark: "ton-open", leg: "ton8", rel: "ui/app.js", line: "      S.err = null; paint();" },
  { mark: "ton-cover", leg: "ton9", rel: "ui/app.js", line: "        + \"</div>\";" },
  { mark: "ton-pick-stay", leg: "ton14", rel: "ui/app.js", line: "        if (false) await desksLoad(S.teamPickDir);" },
  { mark: "ton-overview", leg: "ton10", rel: "ui/app.js", line: "      + \"</div>\");" },
  /* An invitation belongs to the team: the deciding line of each side, changed alone. */
  { mark: "tib-place-shape", leg: "tib1", rel: "shell/main.js", line: "  if (true) return null;" },
  { mark: "tib-desks-folder", leg: "tib1", rel: "shell/main.js", line: "  const facts = await withKept(await thread.call(\"teamFacts\", tp.folder, withHere({ key: await keyFileNow(), invites: await inviteBook()," },
  { mark: "tib-confine-make", leg: "tib7", rel: "shell/main.js", line: "  const P = await placeFor(dir);" },
  { mark: "tib-make-at", leg: "tib2", rel: "shell/main.js", line: "  const target = Object.assign(await thread.call(\"inviteTarget\", P.thread, await keyFileNow(), withHere()), { signin: await signinHintNow() });" },
  { mark: "tib-held-at", leg: "tib2", rel: "src/studio.mjs", line: "  if (false) {" },
  { mark: "tib-facts-own", leg: "tib1", rel: "src/studio.mjs", line: "  const own = false;" },
  { mark: "tib-desks-at", leg: "tib6", rel: "src/studio.mjs", line: "    passphrase: opts.passphrase });" },
  { mark: "tib-place-dir", leg: "tib3", rel: "ui/app.js", line: "      return ps[0] ? ps[0].dir : \"\";" },
  { mark: "tib-bare", leg: "tib3", rel: "ui/app.js", line: "  const teamBare = () => false;" },
  { mark: "tib-bare-page", leg: "tib3", rel: "ui/app.js", line: "        ? '<div class=\"teams-screen\">' + teamSummaryHtml(curTeam) + teamReceivesHtml(curTeam) + \"</div>\"" },
  { mark: "tib-bare-body", leg: "tib3", rel: "ui/app.js", line: "    if (false) {" },
];
if (!ONLY) {
  const { copyPlants } = await import("./plant-copy.mjs");
  const skip = (line) => process.stdout.write("  SKIP " + line + NL);
  copyPlants({ root: ROOT, self: fileURLToPath(import.meta.url), label: "team-on-its-own", onlyVar: "TEAM_ON_ITS_OWN_ONLY", plants: PLANTS, check, skip });
}

process.stdout.write("team-on-its-own: asserted " + asserted + ", failed " + failed + NL);
process.exit(failed ? 1 : 0);
