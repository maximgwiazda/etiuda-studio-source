/* THE SEALED TEAM, STUDIO'S SIDE: the keys it keeps between sessions, the switch on the Desks screen, the lead's plain copy
 * (board 834).
 *
 *     node tests/team-desks.mjs [--keep]
 *
 * 1  src/team-store.mjs keeps each epoch's team key in <userData>/teams.json sealed by the vault it is handed (safeStorage in
 *    the shell; here a stand-in whose seal is not the key's own spelling), never in the clear, and hands back only what the
 *    vault opens; a file it cannot read is never written over.
 * 2  The switch: Sealed makes or puts back this Studio's team at the folder, Plain writes it saying so and lets the project
 *    publish in the clear again; a team file not its own, a wrong passphrase or no signing key changes nothing.
 * 3  The lead exports a plain copy anywhere but into the folder the project publishes to sealed.
 * 4  The Desks screen, as the page paints it on tests/page-stand-in.mjs: the rail row, the roster, the switch and its cover,
 *    and the desks asking to join at the roster's head, admitted by their codes with no cover (step 12's S5; no passphrase
 *    since the key is kept by the operating system, 2026-10-07 20:42).
 * td0b  No switch for reading a catalog the team does not list (board 1014): the team file this Studio writes carries no
 *    `content`, and a handover writes none.
 * td974c16  Through the shell on a relay team, the import press refused, with no ask written, for a teammate on the team's other
 *    catalog and for one on this library's catalog the team does not list (board 974, C16).
 * 2j-2l, 4o-4p  A desk's export, Plain or Sealed (23b-B): the team file's exportsSealed, written and signed by this Studio,
 *    and its row on the screen where Publishing is Sealed.
 * 5  Before the first update (2026-11-01). u2a-u2d: saved data a newer Studio wrote, teams.json and studio.json, is refused
 *    naming the version, never read as an older copy and never written over, and the page says so at boot in the copywriter's
 *    words (updates 2, Studio's half); u2e-u2g: while they stand, every shell act that makes or replaces an identity is refused
 *    in that sentence, user data stay byte for byte and publish's plan makes no key, with u2g the control; u2h: while they stand,
 *    no screen or cover offers an act that makes or replaces an identity, each said as that sentence (the test architect's E1).
 *    p5a-p5b: each member's Etiuda version, read from its own signed statistics answer, on the Desks table (the version policy,
 *    point 5). u2p and p5p prove each guard by its removal in a scratch copy, and are skipped, and counted, under ETIUDA_PLANTS=off.
 * 962t5a-962t5f  A catalog chooses its team (board 962 stage 5, T5): the first team's cover offers a team this Studio leads,
 *    listing only the sealed teams it leads, by their catalogs, connection and count, and never to a catalog with a team; it
 *    names the chosen team's teammates below 2.0.0 and counts the unreported, asking and never refusing; a refusal stays in its
 *    sentence. 962t5d lifts the list's filter and the two version counts in process, and is skipped, and counted, under
 *    ETIUDA_PLANTS=off. 962t5e-962t5f:
 *    a teammate on the team's other catalog said as another catalog of this team, and the Writes to row naming it with no move.
 * fd9  A project with no team and no folder leads its Desks screen with Make a team, the main button, and the plain folder
 *    below it as the secondary way (Argon's first-day review, F9); a folder holding another lead's team keeps the folder line
 *    alone, as it was. Its plants run in a scratch copy (tests/plant-copy.mjs), each child running fd9 alone (TEAM_DESKS_ONLY).
 */
import "./reg-stand-on.mjs";
import { licensedOpts } from "./licensed.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Sign from "../src/sign.mjs";
import * as Team from "../src/team.mjs";
import * as Store from "../src/team-store.mjs";
import * as Relay from "../src/relay.mjs";
import * as Ring from "../src/ring.mjs";
import * as Studio from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { seatEnv } from "./seated.mjs";
import { olderFolderTeam } from "./older-folder-team.mjs"; /* the folder team is made by the fixture, not by Studio (the folder team's removal) */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-desks");
const nodeRequire = createRequire(import.meta.url);
const EXPECTED = 83; /* 86 less td4i, td4j and td4jp, retired with the code door (P2); td4h is rebased */
/* ETIUDA_PLANTS=off (a merge's area run) skips u2p and p5p and counts them toward EXPECTED; the release profile runs with
   plants on, so they still run there. */
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.TEAM_DESKS_ONLY || "";
/* ETIUDA_PLANTS=off (a merge's area run, and this file's own plant children) skips fd9's scratch-copy plants and counts each one
   skipped; the release profile runs with plants on, so they still run there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let skipped = 0;
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + "\n");
}
/* PROVED BY MAKING IT FAIL: TEAM_DESKS_APP=<a copy of ui/app.js> reads that copy for the English page of section 4 instead. */
const source = process.env.TEAM_DESKS_APP ? fs.readFileSync(path.resolve(process.env.TEAM_DESKS_APP), "utf8") : undefined;
const NL = String.fromCharCode(10);

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
/* A leg whose code is not there yet is a red leg and not a crashed file. */
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); }
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const throwsOn = async (fn) => { try { await fn(); return ""; } catch (e) { return String(e && e.message || e); } };
const filesUnder = (dir) => !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
  d.isDirectory() ? filesUnder(path.join(dir, d.name)) : [path.join(dir, d.name)]);
/* A key in any of five spellings, in any file under `dir`, whitespace ignored. */
const spellings = (k) => [k.toString("hex"), k.toString("hex").toUpperCase(), k.toString("base64"), k.toString("base64url"),
  "[" + Array.from(k).join(",") + "]"];
const filesHolding = (dir, k) => filesUnder(dir).filter(f => {
  const t = fs.readFileSync(f, "utf8").replace(/\s+/g, "");
  return spellings(k).some(s => t.indexOf(s) >= 0);
});

/* The vault stood in: AES-256-GCM under a key of this run, so a sealed key is no spelling of itself, and another run's
   vault (another Windows account) opens nothing this one sealed. */
function vaultOf(name) {
  const k = crypto.createHash("sha256").update("vault of " + name).digest();
  return {
    available: () => true,
    seal(text) {
      const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", k, iv);
      return Buffer.concat([iv, c.update(String(text), "utf8"), c.final(), c.getAuthTag()]);
    },
    open(bytes) {
      const b = Buffer.from(bytes), d = crypto.createDecipheriv("aes-256-gcm", k, b.subarray(0, 12));
      d.setAuthTag(b.subarray(b.length - 16));
      return Buffer.concat([d.update(b.subarray(12, b.length - 16)), d.final()]).toString("utf8");
    },
  };
}

/* fd9. THE DESKS SCREEN OF A PROJECT WITH NO TEAM AND NO FOLDER LEADS WITH MAKE A TEAM (the test architect's condition, 2026-11-01
   01:19: "On a project with no team and no folder, Desks leads with Make a team, with the plain folder below it as the secondary
   option."). The page alone, on the stand-in: what the shell answers is set here. */
async function fd9() {
  const { loadPage } = await import("./page-stand-in.mjs");
  const bare = { error: null, folder: null, file: "none", signing: "studio-0123456789abcdef", inside: false, canKeep: true, mark: null,
    restorable: null, requests: [], team: null };
  let answer = bare;
  const api = { desks: async () => JSON.parse(JSON.stringify(answer)) };
  const project = { dir: "C:/Projects/quay", name: "Quay", editions: [], counts: { cards: 0, intents: 0, cats: 0, rv: 0 },
    lint: { errors: 0, warnings: 0, notes: 0, suggestions: 0 }, draft: { langs: [{ code: "en" }], cards: [], rules: [] },
    project: { id: "p-0123456789abcdef", title: "Quay", rev: 0, folder: null, fileName: "quay.ec" } };
  const seen = {};
  for (const lang of ["en", "pl"]) {
    const home = loadPage({ api, uiLang: lang }), P = home.page, T = P.T;
    Object.assign(P.S, { open: JSON.parse(JSON.stringify(project)), projects: [JSON.parse(JSON.stringify(project))],
      screen: "projects", home: "team", teamDir: project.dir, lang: "en", host: { tour: { offered: true } } });
    answer = bare;
    await P.desksLoad();
    const h = home.node("#main").innerHTML;
    const make = h.indexOf('data-act="team-make"'), pick = h.indexOf('data-act="settings-folder"');
    const plain = h.indexOf(T("Without a team, editions can also be published to a plain folder, in the clear: any desk that can read the folder opens them.").replace(/&/g, "&amp;"));
    seen[lang] = {
      first: make >= 0 && pick > make && plain > make && pick > plain,
      main: /<button class="btn solid" data-act="team-make">/.test(h),
      second: !/<button class="btn solid" data-act="settings-folder">/.test(h) && /data-act="settings-folder"/.test(h),
      words: lang === "en" || T("Without a team, editions can also be published to a plain folder, in the clear: any desk that can read the folder opens them.") !== "Without a team, editions can also be published to a plain folder, in the clear: any desk that can read the folder opens them.",
    };
    if (lang === "en") {
      answer = Object.assign({}, bare, { file: "theirs", lead: "87ad0879ac3e9ff6" });
      await P.desksLoad();
      const t = home.node("#main").innerHTML;
      seen.control = { alone: /data-act="settings-folder"/.test(t) && !/data-act="team-make"/.test(t) && t.indexOf("Without a team") < 0 };
    }
  }
  const bad = [];
  for (const l of Object.keys(seen)) for (const k of Object.keys(seen[l])) if (seen[l][k] !== true) bad.push(l + " " + k);
  check(bad.length === 0,
    "fd9 a project with no team and no folder leads its Desks screen with Make a team as the main button, the plain folder below it as"
    + " the secondary way, in English and Polish; a folder holding another lead's team keeps the folder line alone: "
    + (bad.length ? "failing " + JSON.stringify(bad) : "every part holds"));
}
const FD9_PLANTS = [
  { mark: "fd9-lead", leg: "fd9", rel: "ui/app.js", line: "        : false ? '<div class=\"cols\"><div class=\"pane\"><h3 class=\"t\">' + esc(T(\"Who can read what you publish\")) + '</h3><div class=\"sc\">'" },
  { mark: "fd9-solid", leg: "fd9", rel: "ui/app.js", line: "          + (!t ? ' <button class=\"btn sm\" data-act=\"team-make\">' + esc(T(\"Make a team\")) + \"</button>\" : \"\") + \"</div>\"" },
  { mark: "td-plain-two", leg: "962s5c", rel: "src/studio.mjs", line: "  if (false) {" },
  { mark: "team-home-move", leg: "teamHome", rel: "ui/app.js", line: "        + \"\"" },
  { mark: "team-strip-one", leg: "teamHome", rel: "ui/app.js", line: "    if (!teamsList || teamsList.length < 1) return \"\";" },
  { mark: "team-strip-two", leg: "teamHome", rel: "ui/app.js", line: "    return \"\";" },
  { mark: "team-cat-row", leg: "teamHome", rel: "ui/app.js", line: "      + \"\"" },
  { mark: "team-leads-to", leg: "teamHome", rel: "ui/app.js", line: "    \"to-team\": async () => openHomeTeam()," },
  { mark: "team-another-btn", leg: "teamAnother", rel: "ui/app.js", line: "          + \"\"" },
];

/* Team on the home tab, above the catalogs (red first on 414cb5e9):
   - Team is reachable from the home tab with no catalog open
   - a catalog's sidebar has the one row (Goes to {TEAM}) and no Team section
   - one team shows no strip
   - two teams show a strip with both, and a catalog's row leads to ITS team. */
async function teamHome() {
  const { loadPage } = await import("./page-stand-in.mjs");
  const proj1 = { id: "c-harbour", name: "Harbour lamps", dir: "C:/Projects/harbour", rev: 1, counts: { cards: 2 } };
  const proj2 = { id: "c-returns", name: "Returns", dir: "C:/Projects/returns", rev: 1, counts: { cards: 1 } };
  const team1 = { id: "t-1111111111111111", connection: "relay", sealed: true, led: true, leadPrint: "aaaa111122223333",
    catalogs: ["c-harbour"], project: proj1, projects: [proj1],
    teammates: [{ id: "k-1", name: "Ada", kind: "desk", admitted: true }, { id: "k-2", name: "Piotr", kind: "desk", admitted: true }], count: 2 };
  const team2 = { id: "t-2222222222222222", connection: "folder", folder: "C:/share2", sealed: true, led: true, leadPrint: "bbbb111122223333",
    catalogs: ["c-returns"], project: proj2, projects: [proj2],
    teammates: [{ id: "k-3", name: "Ewa", kind: "desk", admitted: true }], count: 1 };
  const factsOf = (t, dir) => ({ error: null, folder: t.connection === "relay" ? "C:/ud/relay/0123456789abcdef0123456789abcdef" : t.folder,
    id: t.project.id, signing: "studio-aaaa111122223333", file: "ours", inside: false, keyHeld: true, canKeep: true,
    team: { id: t.id, epoch: 1, sealed: true, exportsSealed: true, relay: true, leadPrint: t.leadPrint,
      roster: t.teammates.map((m) => ({ id: m.id, name: m.name, own: "", key: "1111222233334444", admitted: true })) },
    requests: [], invites: [] });
  const openOf = (p) => ({ dir: p.dir, name: p.name, id: p.id, editions: ["2026-11-10-01"],
    counts: { cards: 1, intents: 0, cats: 0, rv: 0 }, lint: { errors: 0, warnings: 0, rows: [] },
    draft: { langs: [{ code: "en" }], cards: [], rules: [] }, langs: { rows: [{ code: "en", name: "English" }], commentLang: "en" },
    project: { id: p.id, title: p.name, rev: 1, folder: null, fileName: "cat.ec" } });

  let mockTeams = [team1], mockProjects = [proj1];
  const home = loadPage({ api: {
    projects: async () => ({ root: "C:/Projects", projects: mockProjects }),
    desks: async (d) => JSON.parse(JSON.stringify(d === proj2.dir ? factsOf(team2, d) : factsOf(team1, d))),
    teams: async () => ({ teams: mockTeams }),
    archive: async () => ({ editions: ["2026-11-10-01"] }),
    peopleList: async () => ({ error: null, people: [] }),
    seatNames: async () => ({ error: null, names: {} }),
  }, uiLang: "en", source });
  const P = home.page;

  /* 1. Reachable from the home tab with no catalog open; 1 team shows no strip */
  Object.assign(P.S, { open: null, screen: "projects", home: "overview", projects: mockProjects, teams: mockTeams, teamTab: 0, host: { tour: { offered: true } } });
  P.paint();
  const homeRail = home.node("#rail").innerHTML;
  const teamRailAt = homeRail.indexOf('data-act="home" data-v="team"');
  /* Overview is the rail's first row since 26 November, Team the second, the catalogs' own group (Library) after them. */
  const catGrpAt = homeRail.indexOf("Library"), overviewAt = homeRail.indexOf('data-act="home" data-v="overview"');
  const hasHomeRow = teamRailAt >= 0 && overviewAt >= 0 && overviewAt < teamRailAt && catGrpAt > teamRailAt;
  await P.ACTS.home({ getAttribute: (k) => (k === "data-v" ? "team" : null) });
  await new Promise((r) => setTimeout(r, 30));
  const oneHtml = home.node("#main").innerHTML;
  const noStripForOne = /<h1>Team<\/h1>/.test(oneHtml) && P.S.open === null && P.S.screen === "projects" && P.S.home === "team"
    && !/data-act="team-tab"/.test(oneHtml) && !/class="teams/.test(oneHtml);

  /* 2. Two teams show a strip with both */
  mockTeams = [team1, team2]; mockProjects = [proj1, proj2];
  Object.assign(P.S, { projects: mockProjects, teams: mockTeams, teamTab: 0 });
  P.paint();
  await new Promise((r) => setTimeout(r, 30));
  const twoHtml = home.node("#main").innerHTML;
  const stripTwo = /<h1>Team<\/h1>/.test(twoHtml)
    && /data-act="team-tab"[^>]*data-i="0"[^>]*>.*?Harbour lamps/.test(twoHtml)
    && /data-act="team-tab"[^>]*data-i="1"[^>]*>.*?Returns/.test(twoHtml);

  /* 3. A catalog's sidebar has the one row and no Team section, and leads to ITS team */
  Object.assign(P.S, { open: openOf(proj2), screen: "project", section: "cards", desks: factsOf(team2, proj2.dir), teamTab: 0 });
  P.paint();
  const catRail = home.node("#rail").innerHTML;
  const noDesksSection = !/data-act="section"[^>]*data-v="desks"/.test(catRail) && !/data-v="desks"/.test(catRail);
  const oneRow = /data-act="to-team"/.test(catRail) && /Goes to Returns/.test(catRail) && /1\s*↗/.test(catRail);
  P.S.section = "desks";
  P.paintMain();
  /* the catalog's own screen stands in main (its cards lede), so a render that is blank or lacks the page altogether is not "no Team section" */
  const mainNow = home.node("#main").innerHTML;
  const noSectionInMain = /data-lede="cards"/.test(mainNow) && !/<h1>Team<\/h1>/.test(mainNow);
  if (typeof P.ACTS["to-team"] === "function") await P.ACTS["to-team"]();
  await new Promise((r) => setTimeout(r, 30));
  const ledToTeam2 = typeof P.ACTS["to-team"] === "function" && P.S.screen === "projects" && P.S.home === "team" && P.S.teamTab === 1 && /Ewa/.test(home.node("#main").innerHTML);

  const f = { hasHomeRow, noStripForOne, stripTwo, noDesksSection, oneRow, noSectionInMain, ledToTeam2 };
  check(Object.keys(f).every((k) => f[k]),
    "teamHome Team is on the home tab under Overview and above the catalogs with no chooser for one team, a strip for two, and a catalog's sidebar keeps one row leading to its team: "
    + JSON.stringify(f));
}

/* Make another team... on the home Team screen (Claude alpha's decision of 2026-11-17, from the designer's sheets):
   - it shows with one team and with several, and not with none
   - pressed with no catalog free of a team it says so; with one it goes straight to that catalog's Make a team; with
     several it lists them (Make a team on each, Cancel), and choosing one leads to that catalog's Make a team. */
async function teamAnother() {
  const { loadPage } = await import("./page-stand-in.mjs");
  const mk = (id, name, dir) => ({ id, name, dir, rev: 1, counts: { cards: 1 } });
  const p1 = mk("c-harbour", "Harbour lamps", "C:/Projects/harbour"), p2 = mk("c-returns", "Returns", "C:/Projects/returns");
  const p3 = mk("c-quay", "Quay ropes", "C:/Projects/quay"), p4 = mk("c-pier", "Pier lights", "C:/Projects/pier");
  const teamOf = (id, p, conn) => ({ id, connection: conn, folder: conn === "folder" ? "C:/share-" + id : undefined, sealed: true, led: true,
    leadPrint: "aaaa111122223333", catalogs: [p.id], project: p, projects: [p],
    teammates: [{ id: "k-" + id, name: "Ada", kind: "desk", admitted: true }], count: 1 });
  const t1 = teamOf("t-1111111111111111", p1, "relay"), t2 = teamOf("t-2222222222222222", p2, "folder");
  let teams = [t1], projects = [p1];
  const bare = { error: null, folder: null, file: "none", signing: "studio-aaaa111122223333", inside: false, keyHeld: false, canKeep: true,
    team: null, requests: [], invites: [] };
  const withTeam = (t) => ({ error: null, folder: "C:/ud/relay/0123456789abcdef0123456789abcdef", file: "ours", signing: "studio-aaaa111122223333",
    inside: false, keyHeld: true, canKeep: true, team: { id: t.id, epoch: 1, sealed: true, exportsSealed: true, relay: true, leadPrint: t.leadPrint,
      roster: t.teammates.map((m) => ({ id: m.id, name: m.name, own: "", key: "1111222233334444", admitted: true })) }, requests: [], invites: [] });
  const home = loadPage({ api: {
    projects: async () => ({ root: "C:/Projects", projects }),
    teams: async () => ({ teams }),
    desks: async (d) => JSON.parse(JSON.stringify([t1, t2].some((t) => t.project.dir === d) ? withTeam([t1, t2].find((t) => t.project.dir === d)) : bare)),
    archive: async () => ({ editions: [] }),
    peopleList: async () => ({ error: null, people: [] }),
    seatNames: async () => ({ error: null, names: {} }),
  }, uiLang: "en", source });
  const P = home.page, wait = () => new Promise((r) => setTimeout(r, 30));
  const main = () => home.node("#main").innerHTML;
  const offered = () => /data-act="team-another"/.test(main());
  const show = async () => { Object.assign(P.S, { open: null, screen: "projects", home: "overview", projects, teams, teamTab: 0, teamPickDir: "", teamDir: "",
    desks: null, desksLoadedFor: "", host: { tour: { offered: true } } });
    await P.ACTS.home({ getAttribute: (k) => (k === "data-v" ? "team" : null) }); await wait(); };
  const press = async () => { await P.ACTS["team-another"](); await wait(); };

  await show(); const one = offered();
  teams = [t1, t2]; projects = [p1, p2]; await show(); const several = offered();
  teams = []; projects = [p3]; await show(); const none = !offered();
  teams = [t1]; projects = [p1]; await show(); await press();
  const allHave = /Every catalog in the Library has a team already\./.test(main()) && !/data-act="team-make"/.test(main());
  projects = [p1, p3]; await show(); await press();
  const straight = P.S.teamPickDir === p3.dir && /data-act="team-make"/.test(main()) && !/data-act="team-start-at"/.test(main());
  projects = [p1, p3, p4]; await show(); await press();
  const listed = /Which catalog does the team start with\?/.test(main()) && (main().match(/data-act="team-start-at"/g) || []).length === 2
    && /data-act="team-another-cancel"/.test(main()) && !/data-act="team-make"/.test(main());
  await P.ACTS["team-start-at"]({ getAttribute: (k) => (k === "data-dir" ? p4.dir : null) }); await wait();
  const led = P.S.screen === "projects" && P.S.home === "team" && P.S.teamPickDir === p4.dir && /data-act="team-make"/.test(main());

  const f = { one, several, none, allHave, straight, listed, led };
  check(Object.keys(f).every((k) => f[k]),
    "teamAnother Make another team... shows on Team with one team and with several and not with none; pressed it says when every catalog has a team, goes straight to the one that has none, or lists them, and a choice leads to that catalog's Make a team: "
    + JSON.stringify(f));
}

/* Settings' Writes-to row speaks of the open catalog's team after another team's tab of Team was visited. */
async function teamLapse() {
  const { loadPage } = await import("./page-stand-in.mjs");
  const mk = (id, name, dir) => ({ id, name, dir, rev: 1, counts: { cards: 1 } });
  const p1 = mk("c-harbour", "Harbour lamps", "C:/Projects/harbour"), p2 = mk("c-returns", "Returns", "C:/Projects/returns");
  const teamOf = (id, p) => ({ id, connection: "folder", folder: "C:/share-" + id, sealed: true, led: true, leadPrint: "aaaa111122223333",
    catalogs: [p.id], project: p, projects: [p], teammates: [], count: 0 });
  const t1 = teamOf("t-1111111111111111", p1), t2 = teamOf("t-2222222222222222", p2);
  const byDir = (d) => (d === p1.dir ? [t1, p1] : [t2, p2]);
  const factsOf = (d) => { const [t] = byDir(d); return { error: null, folder: t.folder, file: "ours", signing: "studio-aaaa111122223333", inside: false,
    keyHeld: true, canKeep: true, team: { id: t.id, epoch: 1, sealed: true, relay: true, roster: [] }, requests: [], invites: [] }; };
  const openOf = (d) => { const [t, p] = byDir(d); return { dir: p.dir, name: p.name, id: p.id, editions: [], counts: { cards: 1, intents: 0, cats: 0, rv: 0 },
    lint: { errors: 0, warnings: 0, rows: [] }, draft: { langs: [{ code: "en" }], cards: [], rules: [] },
    langs: { rows: [{ code: "en", name: "English", primary: true, counts: { cards: 1, bodies: 1 }, cards: 1, bodies: 1, held: 0 }], commentLang: "en", primary: "en", of: { cards: 1, bodies: 1 } },
    project: { id: p.id, title: p.name, rev: 1, folder: t.folder } }; };
  const api = new Proxy({
    projects: async () => ({ root: "C:/Projects", projects: [p1, p2] }), teams: async () => ({ teams: [t1, t2] }),
    open: async (d) => JSON.parse(JSON.stringify(openOf(d))), desks: async (d) => JSON.parse(JSON.stringify(factsOf(d))),
    archive: async () => ({ editions: [] }), peopleList: async () => ({ error: null, people: [] }), seatNames: async () => ({ error: null, names: {} }),
  }, { get: (t, k) => (k in t ? t[k] : async () => ({ error: "stand-in" })) });
  const home = loadPage({ api, uiLang: "en", source });
  const P = home.page, wait = () => new Promise((r) => setTimeout(r, 40));
  const at = (k, v) => ({ getAttribute: (n) => (n === k ? v : null) });
  Object.assign(P.S, { host: { tour: { offered: true } }, teams: [t1, t2], projects: [p1, p2], teamTab: 0 });
  /* the question: a catalog of team one open, team two's tab of Team visited, back to the catalog, Settings */
  await P.ACTS["to-project"](at("data-dir", p1.dir)); await wait();
  await P.ACTS["to-team"](); await wait();
  await P.ACTS["team-tab"](at("data-i", "1")); await wait();
  const visited = P.S.desks && P.S.desks.team && P.S.desks.team.id === t2.id;
  await P.ACTS["to-project"](at("data-dir", p1.dir)); await wait();
  P.S.section = "settings"; P.paint(); await wait();
  const settings = home.node("#main").innerHTML;
  const speaksOfOpen = !!visited && P.S.screen === "project" && P.S.desks && P.S.desks.team && P.S.desks.team.id === t1.id
    && P.S.desksLoadedFor === p1.dir && settings.indexOf(t1.folder) >= 0;
  const f = { visited: !!visited, speaksOfOpen };
  check(f.visited && f.speaksOfOpen,
    "teamLapse Settings' Writes-to row speaks of the open catalog's team after another team's tab was visited: "
    + JSON.stringify(Object.assign(f, { desksFor: P.S.desksLoadedFor, team: P.S.desks && P.S.desks.team && P.S.desks.team.id })));
}

async function leg962s5c() {
  const root = path.join(SCRATCH, "962s5c-" + crypto.randomBytes(4).toString("hex"));
  fs.mkdirSync(root, { recursive: true });
  const keyAt5 = path.join(root, "lead-key.json");
  const PASS5 = "passphrase-for-962s5c";
  const { makeKeyFile } = await import("../src/sign.mjs");
  const leadKey = await makeKeyFile({ passphrase: PASS5 });
  fs.writeFileSync(keyAt5, JSON.stringify(leadKey, null, 1) + "\n");
  const projects5 = path.join(root, "projects"), share5 = path.join(root, "share");
  fs.mkdirSync(projects5, { recursive: true });
  fs.mkdirSync(share5, { recursive: true });
  const Smod = await import("../src/studio.mjs");
  const Tmod = await import("../src/team.mjs");
  const dir5 = (await Smod.newProject(projects5, "Plain two", [{ code: "en", name: "English" }])).dir;
  const draft5 = JSON.parse(fs.readFileSync(path.join(dir5, "draft.json"), "utf8"));
  Smod.setPublishFolder(dir5, share5);
  const teamId5 = "t-" + crypto.randomBytes(8).toString("hex");
  const teamDoc5 = Tmod.newTeam({
    id: teamId5,
    catalogs: [draft5.id, "cat-second"],
    lead: { keyId: leadKey.keyId, public: leadKey.public },
    sealed: true,
    exportsSealed: true,
    channel: { kind: "folder" },
  });
  await Tmod.writeTeam(share5, teamDoc5, { key: keyAt5, passphrase: PASS5 });
  const projJson5 = JSON.parse(fs.readFileSync(path.join(dir5, "project.json"), "utf8"));
  projJson5.sealedTeam = teamId5;
  fs.writeFileSync(path.join(dir5, "project.json"), JSON.stringify(projJson5, null, 1) + "\n");
  let refused = false;
  try {
    await Smod.setTeamSealed(dir5, false, { key: keyAt5, passphrase: PASS5 });
  } catch (e) {
    refused = /more than one catalog/i.test(String(e && e.message || e));
  }
  const held = await Tmod.heldTeam(share5, { key: keyAt5 });
  const mark = JSON.parse(fs.readFileSync(path.join(dir5, "project.json"), "utf8")).sealedTeam;
  return refused && !!held.team && held.team.sealed === true && held.team.catalogs.length === 2 && mark === teamId5;
}

const TEAM_NAME = "etiuda-team.json";
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
function newTestKey() {
  const privateKey = crypto.generateKeyPairSync("ed25519").privateKey;
  const pub = crypto.createPublicKey(privateKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { pub, id: "studio-" + sha(Buffer.from(pub, "hex")).slice(0, 16), privateKey };
}
const ROOTK = newTestKey();
const TEST_VAULT = {
  isEncryptionAvailable: () => true,
  available: () => true,
  seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t), "utf8").reverse().toString("hex"), "utf8"),
  open: (b) => {
    const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
  },
  encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
  decryptString: (b) => {
    const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
  },
};
function validGrantFor(pub) {
  const now = Date.now();
  const g = {
    kind: "etiuda-relay-grant",
    format: 1,
    lead: pub,
    issued: now,
    until: now + 30 * 24 * 3600 * 1000,
    paid: true,
    sig: { alg: "ed25519", keyId: ROOTK.id, value: "" },
  };
  const bytes = Engine.relayRules().core.grantBytes(g);
  g.sig.value = crypto.sign(null, bytes, ROOTK.privateKey).toString("hex");
  return g;
}
async function loadShellForMove(ud, mockRelay, projects) {
  const Module = nodeRequire("node:module");
  const main = path.join(ROOT, "shell", "main.js");
  const ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, windows: [], said: [], calls: [] };

  class Win {
    constructor() {
      this.webContents = {
        id: 1,
        on() {},
        once() {},
        send() {},
        setWindowOpenHandler() {},
        getURL: () => pathToFileURL(ui).href,
      };
      got.windows.push(this);
    }
    on() {}
    once() {}
    isDestroyed() { return false; }
    isMaximized() { return false; }
    isMinimized() { return false; }
    close() {}
    focus() {}
    restore() {}
    loadFile() {}
    show() {}
    showInactive() {}
    setMinimumSize() {}
  }

  const electron = {
    app: {
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud,
      getVersion: () => "0.0.0",
      getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true,
      whenReady: () => Promise.resolve(),
      on() {},
      quit() {},
      exit() {},
    },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: {
      showMessageBox: () => Promise.resolve({ response: 0 }),
      showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }),
    },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} },
    safeStorage: TEST_VAULT,
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({}), on() {}, removeListener() {} },
    session: {
      defaultSession: {
        setPermissionRequestHandler() {},
        setPermissionCheckHandler() {},
        setDevicePermissionHandler() {},
        setSpellCheckerLanguages() {},
        setSpellCheckerDictionaryDownloadURL() {},
        setSpellCheckerEnabled() {},
      },
    },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: () => Promise.reject(new Error("network forbidden")) },
  };

  const thread = {
    call: async (verb, ...a) => {
      if (typeof Studio[verb] === "function") return Studio[verb](...a);
      throw new Error("studio verb " + verb + " not implemented");
    },
  };

  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = {
    execFileSync: () => "",
    execSync: () => "",
    spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => quiet,
    spawn: () => quiet,
    exec: () => quiet,
    fork: () => quiet,
  };

  const env = {
    STUDIO_NO_PROXY_SERVER: "off",
    STUDIO_TEST_OFFSCREEN: "1",
    STUDIO_VENDOR_KEY: ROOTK.pub,
    STUDIO_RELAY_ROOT: ROOTK.pub,
    STUDIO_KEY_PASSPHRASE: "passphrase",
    STUDIO_PROJECTS: projects || path.join(ud, "projects"),
  };
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not). */
  Object.assign(env, await seatEnv(ud, true, env), env);
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }

  delete nodeRequire.cache[nodeRequire.resolve(path.join(ROOT, "src", "wire.cjs"))];
  const load = Module._load, write = process.stderr.write, before = new Set(Object.keys(nodeRequire.cache));

  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return load.apply(this, arguments);
  };

  process.stderr.write = (s) => {
    const line = String(s);
    if (/^studio {2}/.test(line)) {
      const trimmed = line.trim();
      got.said.push(trimmed);
      const withoutPrefix = trimmed.replace(/^studio\s+/, "");
      if (withoutPrefix !== trimmed) got.said.push(withoutPrefix);
      return true;
    }
    return write.call(process.stderr, s);
  };

  const dropCache = () => {
    delete nodeRequire.cache[main];
    for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k];
  };

  const restore = () => {
    Module._load = load;
    process.stderr.write = write;
    dropCache();
    for (const k of Object.keys(was)) {
      if (was[k] === undefined) delete process.env[k];
      else process.env[k] = was[k];
    }
  };

  let activeMockRelay = mockRelay;
  let exportsMain = null;
  try {
    dropCache();
    exportsMain = nodeRequire(main);
    const wire = nodeRequire(path.join(ROOT, "src", "wire.cjs"));
    wire.relayConnect = () => null;
    const defaultRelay = (method, url) => {
      if (/\/hello$/.test(url)) {
        return {
          status: 200,
          bytes: Buffer.from(JSON.stringify({ ok: true, challenge: "0123456789abcdef0123456789abcdef" })),
          header: () => null,
        };
      }
      if (/\/session$/.test(url)) {
        return {
          status: 200,
          bytes: Buffer.from(JSON.stringify({
            ok: true,
            session: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            invite: false,
          })),
          header: () => null,
        };
      }
      if (/\/since\/\d+$/.test(url)) {
        return { status: 200, bytes: Buffer.from(JSON.stringify([])), header: () => null };
      }
      return { status: 200, bytes: Buffer.from(JSON.stringify({ ok: true })), header: () => null };
    };

    wire.relayRequest = async (method, url, headers, body) => {
      got.calls.push({ method, url, headers, body });
      if (activeMockRelay) {
        const res = await activeMockRelay(method, url, headers, body);
        if (res) {
          try {
            if (/\/hello$/.test(url) && res.status === 200 && (!res.bytes || !JSON.parse(res.bytes.toString()).challenge)) {
              return defaultRelay(method, url);
            }
            if (/\/session$/.test(url) && res.status === 200 && (!res.bytes || !JSON.parse(res.bytes.toString()).session)) {
              return defaultRelay(method, url);
            }
            if (/\/since\/\d+$/.test(url) && res.status === 200 && (!res.bytes || !Array.isArray(JSON.parse(res.bytes.toString())))) {
              return defaultRelay(method, url);
            }
          } catch {}
          return res;
        }
      }
      return defaultRelay(method, url);
    };
    got.sync = async (askTaken) => {
      if (exportsMain && typeof exportsMain.relaySync === "function") {
        return exportsMain.relaySync(askTaken);
      }
    };
    got.relayRunnerNow = exportsMain && exportsMain.relayRunnerNow ? exportsMain.relayRunnerNow : () => null;
    got.setMockRelay = (fn) => { activeMockRelay = fn; };
  } catch (e) {
    restore();
    throw e;
  }

  got.event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: got.windows[0] && got.windows[0].webContents };
  got.ask = async (ch, ...a) => {
    if (!got.handlers[ch]) return { error: "no handler for " + ch };
    try {
      return await got.handlers[ch](got.event, ...a);
    } catch (e) {
      return { error: String(e && e.message || e), said: e && e.said };
    }
  };
  got.done = async () => {
    try {
      if (exportsMain && typeof exportsMain.endRelay === "function") {
        await Promise.race([exportsMain.endRelay(), new Promise((resolve) => setTimeout(resolve, 3000))]);
      }
    } catch { /* stopping */ }
    restore();
  };
  return got;
}
async function makeTestWorld(name, opts) {
  const o = opts || {};
  const ud = path.join(SCRATCH, name);
  clearScratch(ud);
  fs.mkdirSync(ud, { recursive: true });

  const keyPath = path.join(ud, Sign.KEY_FILE);
  const leadDoc = await Sign.makeKeyFile({ passphrase: "passphrase" });
  fs.writeFileSync(keyPath, JSON.stringify(leadDoc, null, 1) + "\n");
  const keyDoc = Sign.readKeyFile(keyPath);

  if (o.grant !== false) {
    const grant = validGrantFor(keyDoc.public);
    fs.writeFileSync(Relay.grantFileOf(keyPath), JSON.stringify(grant, null, 1) + "\n");
  }

  const projDir = path.join(ud, "projects", "proj1");
  fs.mkdirSync(projDir, { recursive: true });
  fs.mkdirSync(path.join(projDir, "archive"), { recursive: true });

  const teamId = o.teamId || "t-1122334455667788";
  const teamKey = o.teamKey || crypto.randomBytes(32);
  const epoch = o.epoch || 1;
  const roster = o.roster || [];
  const catalogs = o.catalogs || [o.catalog || "cat1"];
  const rt = o.rt || Relay.relayId();

  const tf = Store.teamsFile(ud);
  const mirror = Store.keepRelay(tf, teamId, rt, Relay.RELAY_URL);
  fs.mkdirSync(mirror, { recursive: true });

  const draft = {
    id: "cat1",
    schema: 1,
    title: { en: "Test Catalog" },
    languages: ["en"],
    primary: "en",
  };
  fs.writeFileSync(path.join(projDir, "draft.json"), JSON.stringify(draft, null, 1) + "\n");

  const projectJson = {
    folder: mirror,
    sealedTeam: teamId,
    draft: "draft.json",
    relay: { rt, url: Relay.RELAY_URL, lead: keyDoc.public },
    rev: 1,
  };
  fs.writeFileSync(path.join(projDir, "project.json"), JSON.stringify(projectJson, null, 1) + "\n");

  let initialTeam = Team.newTeam({
    id: teamId,
    catalogs,
    lead: { keyId: keyDoc.keyId, public: keyDoc.public },
    sealed: true,
    exportsSealed: true,
  });
  if (epoch > 1) {
    initialTeam.epoch = epoch;
  }
  for (const m of roster) {
    initialTeam = Team.withDesk(initialTeam, m, m.name);
    const entry = initialTeam.roster.find((x) => x && x.desk && x.desk.id === m.id);
    if (entry) {
      entry.wrap = Engine.hpkeRules().wrapTeamKey(teamKey, m.box, teamId, epoch, m.id);
    }
  }
  const ringDoc = o.ringDoc || { format: Ring.RING_FORMAT, kind: Ring.RING_KIND, keys: [{ catalog: "cat1", keyId: keyDoc.keyId, public: keyDoc.public }] };
  const teamWithRelay = Team.withChannel(initialTeam, { kind: "relay", rt, url: Relay.RELAY_URL }, ringDoc);
  const writtenTeam = await Team.writeTeam(mirror, teamWithRelay, { key: keyPath, passphrase: "passphrase" });
  fs.writeFileSync(path.join(mirror, Relay.RING_FILE), JSON.stringify(ringDoc, null, 1) + "\n");

  Store.keepTeamKey(tf, TEST_VAULT, teamId, epoch, teamKey);
  Store.chooseSealed(tf, teamId, true, mirror, writtenTeam.written);
  Store.markRelay(tf, teamId, { created: true, lead: keyDoc.public });

  return { ud, projDir, mirror, teamId, teamKey, epoch, roster, keyDoc, writtenTeam, tf, rt };
}
/* td974c16: THE IMPORT PRESS REFUSED FOR A CATALOG THIS STUDIO HAS ALREADY (board 974, C16), through the shell on a relay team's
   mirror. Re-aimed from tests/folder-mirror-studio.mjs 974c16 and 974c16b when Studio's shared-folder syncer went (A-S5): how the
   row is classed is tests/catalog-use.mjs 962s5w and 962s6e, and how the page says it is 962t5e and 962t5f here; this holds the
   shell's studio:catalog-import refusing both kinds with no ask written, which nothing else held. */
async function td974c16() {
  await leg("td974c16 through the shell on a relay team, a teammate on the team's other catalog, and one on this library's catalog"
    + " the team does not list, are each refused at the import press with no ask written", async () => {
    const w = await makeTestWorld("td974c16");
    const keyPath = path.join(w.ud, Sign.KEY_FILE);
    const pair = crypto.generateKeyPairSync("ed25519");
    const key = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    const box = crypto.generateKeyPairSync("x25519").publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    const desk = { id: Engine.joinRules().branchIdOf(key), key, box, name: "Quay desk" };
    const north = await Studio.newProject(path.join(w.ud, "projects"), "North Quay", [{ code: "en", name: "English" }]);
    const south = await Studio.newProject(path.join(w.ud, "projects"), "South Quay", [{ code: "en", name: "English" }]);
    const held = (await Team.heldTeam(w.mirror, { key: keyPath })).team;
    let t = Team.withDesk(Team.withCatalog(held, north.draft.id, { catalog: north.draft.id, keyId: w.keyDoc.keyId, public: w.keyDoc.public }),
      desk, desk.name);
    t.roster.find((x) => x && x.desk && x.desk.id === desk.id).wrap = Engine.hpkeRules().wrapTeamKey(w.teamKey, box, w.teamId, w.epoch, desk.id);
    const written = (await Team.writeTeam(w.mirror, t, { key: keyPath, passphrase: "passphrase" })).team;
    Store.chooseSealed(w.tf, w.teamId, true, w.mirror, written);
    const inUse = (catalog) => {
      const doc = { format: 1, kind: "etiuda-in-use", desk: { id: desk.id, key, box, name: desk.name }, at: "2026-04-02T08:15:00.000Z",
        catalog: { id: catalog.id, rev: 2, sha256: "sha256:" + "cc".repeat(32), signer: "", source: "file", title: catalog.title },
        sig: { alg: "Ed25519", keyId: desk.id } };
      doc.sig.value = crypto.sign(null, Engine.deskRules().branchSignedBytes(doc), pair.privateKey).toString("hex");
      fs.mkdirSync(path.join(w.mirror, "desks", desk.id), { recursive: true });
      fs.writeFileSync(path.join(w.mirror, "desks", desk.id, "in-use.ec"),
        JSON.stringify(Engine.sealRules().sealCatalog(w.teamKey, w.teamId, w.epoch, JSON.stringify(doc))) + "\n");
    };
    const asked = () => fs.existsSync(path.join(w.mirror, "catalog-asks", desk.id + ".json"));
    const refused = (r) => /not using a catalog this Studio can ask for/.test(String(r && (r.error || "")));
    const out = {};
    const sh = await loadShellForMove(w.ud, undefined, path.dirname(w.projDir));
    try {
      inUse({ id: north.draft.id, title: north.name });
      const onTeam = await sh.ask("studio:catalog-import", w.projDir, desk.id);
      out.team = refused(onTeam) && !asked() ? true : JSON.stringify(onTeam && onTeam.error || onTeam).slice(0, 160);
      inUse({ id: south.draft.id, title: south.name });
      const inLibrary = await sh.ask("studio:catalog-import", w.projDir, desk.id);
      out.library = refused(inLibrary) && !asked() ? true : JSON.stringify(inLibrary && inLibrary.error || inLibrary).slice(0, 160);
      /* THE CONTROL: the same desk on a catalog this Studio does not have is read off the roster and asked for as any other is (board
         1014, no switch), so the two refusals above are the rows' own and not a desk the press could not find. */
      inUse({ id: "elsewhere-" + crypto.randomBytes(4).toString("hex"), title: "Elsewhere" });
      const other = await sh.ask("studio:catalog-import", w.projDir, desk.id);
      out.control = !(other && other.error) && asked() ? true : JSON.stringify(other && other.error || other).slice(0, 160);
    } finally { await sh.done(); }
    const ok = out.team === true && out.library === true && out.control === true;
    if (!ok) process.stdout.write("       " + JSON.stringify(out) + "\n");
    return ok;
  });
}
/* u2e, u2f, u2g: while saved data a newer Studio wrote stand (the test architect's E1, 2026-11-01). */
const Saved = nodeRequire(path.join(ROOT, "src", "saved-format.cjs"));
const NEWER_DOC = { format: 2, writtenBy: "2.3.0" };
/** Every file directly in user data, by sha256: the key folder, which holds the teams file too. */
function keyFolderNow(ud) {
  const o = {};
  for (const n of fs.readdirSync(ud).sort()) {
    const p = path.join(ud, n);
    if (fs.statSync(p).isFile()) o[n] = sha(fs.readFileSync(p));
  }
  return JSON.stringify(o);
}
/** A world with no signing key and a project with a shared folder no team holds yet, both outside user data.
 *  The shell that opens it passes the catalog's parent as its projects root, since it lists only a direct child. */
async function worldNoKey(name) {
  const ud = path.join(SCRATCH, name), work = path.join(SCRATCH, name + "-work"), share = path.join(work, "share");
  clearScratch(ud);
  clearScratch(work);
  fs.mkdirSync(ud, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const dir = (await Studio.newProject(path.join(work, "projects"), "Held", [{ code: "en", name: "English" }])).dir;
  await Studio.setPublishFolder(dir, share);
  return { ud, dir, share };
}
function makeNewer(ud, which) {
  if (which === "store") {
    fs.writeFileSync(path.join(ud, "studio.json"), JSON.stringify(Object.assign({ theme: "dark" }, NEWER_DOC), null, 1) + "\n");
    return;
  }
  const at = Store.teamsFile(ud);
  let doc = { kind: "etiuda-studio-teams", teams: {} };
  try { doc = JSON.parse(fs.readFileSync(at, "utf8")); } catch { /* none yet */ }
  fs.writeFileSync(at, JSON.stringify(Object.assign(doc, NEWER_DOC), null, 1) + "\n");
}
const saidNewer = (res) => !!(res && res.error && res.said && res.said.frame === Saved.NEWER_SAID
  && res.said.vars && res.said.vars.VERSION === "2.3.0");
/* World A holds a key and a relay team; world B holds no key and a project with no team. */
const HELD_A = [
  ["studio:key-aside", () => []],
  ["studio:key-restore-pick", () => ["Restore the signing key", "Signing key"]],
  ["studio:key-restore", (w) => [path.join(w.ud, "copy.json"), "passphrase"]],
  ["studio:team-handover", (w) => [w.projDir]],
  ["studio:licence-signout", () => []],
  ["studio:member-remove", (w) => [w.projDir, w.teamId, "k-0123456789abcdef", true]],
  ["studio:invite-cancel", (w) => [w.projDir, "i-0123456789abcdef", true]],
];
const HELD_B = [
  ["studio:key-make", () => []],
  ["studio:team-sealed", (w) => [w.dir, true, false]],
  ["studio:team-relay", (w) => [w.dir]],
  ["studio:licence-signin", () => ["microsoft"]],
];
async function heldWorld(w, list, out) {
  const sh = await loadShellForMove(w.ud, undefined, w.dir ? path.dirname(w.dir) : undefined);
  try {
    /* The plan first, since it notes the day the evaluation period counts from, and the relay's own sync settled, since it keeps
       its state in the teams file: neither is an act this leg is about. */
    if (w.dir) {
      const plan = await sh.ask("studio:publish-plan", w.dir);
      if (!plan || plan.error || !plan.signing || plan.signing.makes) out.push("publish-plan " + JSON.stringify(plan && (plan.signing || plan.error)).slice(0, 160));
    }
    await sh.sync();
    const runner = sh.relayRunnerNow();
    if (runner && typeof runner.idle === "function") await runner.idle();
    const teamFileNow = () => (w.mirror && fs.existsSync(path.join(w.mirror, TEAM_NAME)) ? sha(fs.readFileSync(path.join(w.mirror, TEAM_NAME))) : "");
    const before = keyFolderNow(w.ud) + "|team " + teamFileNow();
    for (const [ch, args] of list) {
      const res = await sh.ask(ch, ...args(w));
      if (!saidNewer(res)) out.push(ch + " answered " + JSON.stringify(res && (res.said || res.error || res)).slice(0, 160));
    }
    const after = keyFolderNow(w.ud) + "|team " + teamFileNow();
    if (after !== before) out.push("user data changed: " + before + " -> " + after);
  } finally {
    await sh.done();
  }
}
async function heldAll(which) {
  const out = [];
  const a = await makeTestWorld("u2e-" + which + "-a");
  makeNewer(a.ud, which);
  await heldWorld(a, HELD_A, out);
  const b = await worldNoKey("u2e-" + which + "-b");
  makeNewer(b.ud, which);
  await heldWorld(b, HELD_B, out);
  if (out.length) process.stdout.write("       " + out.join("\n       ") + NL);
  return out.length === 0 && !fs.existsSync(path.join(b.ud, Sign.KEY_FILE));
}
async function u2gCheck() {
  const b = await worldNoKey("u2g");
  const sh = await loadShellForMove(b.ud, undefined, path.dirname(b.dir));
  try {
    const plan = await sh.ask("studio:publish-plan", b.dir);
    const res = await sh.ask("studio:key-make");
    const kept = Sign.readKeyFile(path.join(b.ud, Sign.KEY_FILE));
    return !!(plan && plan.signing && plan.signing.makes === true && res && !res.error && kept && kept.public);
  } finally {
    await sh.done();
  }
}
const u2eRedIn = (c) => {
  const child = spawnSync(process.execPath, [path.join(c, "tests", "team-desks.mjs")], {
    cwd: c,
    encoding: "utf8",
    timeout: 120000,
    env: Object.assign({}, process.env, { TEAM_DESKS_ONLY: "u2e", ETIUDA_PLANTS: "off" }),
  });
  const said = String(child.stdout || "") + String(child.stderr || "");
  return child.status !== 0 && said.indexOf("FAIL u2e") >= 0;
};
const SHELL_U2_PLANTS = [
  ["u2p", "shell/main.js", "u2-hold-shell", (c) => u2eRedIn(c)],
  ["u2p", "shell/main.js", "u2-hold-sealed", (c) => u2eRedIn(c)],
  ["u2p", "shell/main.js", "u2-hold-first", (c) => u2eRedIn(c)],
];
const SHELL_U2_REMOVE = {
  "u2-hold-shell": () => "",
  "u2-hold-sealed": () => "",
  "u2-hold-first": () => "",
};

async function main(argv) {
  if (ONLY) {
    if (ONLY === "fd9") { try { await fd9(); } catch (e) { check(false, "fd9 threw: " + String(e && e.message || e).slice(0, 200)); } }
    else if (ONLY === "962s5c") { try { const ok = await leg962s5c(); check(ok, "962s5c Plain refused with two"); } catch (e) { check(false, "962s5c threw: " + String(e && e.message || e).slice(0, 200)); } }
    else if (ONLY === "teamHome") { try { await teamHome(); } catch (e) { check(false, "teamHome threw: " + String(e && e.message || e).slice(0, 200)); } }
    else if (ONLY === "teamOutside") { try { await teamOutside(); } catch (e) { check(false, "teamOutside threw: " + String(e && e.message || e).slice(0, 200)); } }
    else if (ONLY === "teamLapse") { try { await teamLapse(); } catch (e) { check(false, "teamLapse threw: " + String(e && e.stack || e).slice(0, 600)); } }
    else if (ONLY === "teamAnother") { try { await teamAnother(); } catch (e) { check(false, "teamAnother threw: " + String(e && e.message || e).slice(0, 200)); } }
    else if (ONLY === "td974c16") { try { await td974c16(); } catch (e) { check(false, "td974c16 threw: " + String(e && e.message || e).slice(0, 200)); } }
    else if (ONLY === "u2e") {
      await leg("u2e with a studio.json a newer Studio wrote, every act that makes or replaces an identity is refused in the saved-data"
        + " sentence naming 2.3.0, the key folder and the teams file stay byte for byte, and a publish's plan makes no key (red where"
        + " any act runs)", async () => heldAll("store"));
    } else if (ONLY === "u2f") {
      await leg("u2f the same with a teams.json a newer Studio wrote", async () => heldAll("teams"));
    } else if (ONLY === "u2g") {
      await leg("u2g THE CONTROL: with no newer file, a publish's plan says the key will be made and Make a signing key makes it",
        u2gCheck);
    } else if (SHELL_U2_REMOVE[ONLY]) {
      const guard = SHELL_U2_PLANTS.find((g) => g[2] === ONLY);
      const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
      const before = treeSha(ROOT), copy = plantsTree(ROOT, "team-desks-" + ONLY);
      let said = "";
      try {
        const at5 = path.join(copy, guard[1]), buf = fs.readFileSync(at5), want = sha(buf);
        const lines = buf.toString("utf8").split("\n"), mark = "plant:" + ONLY + " ";
        const hits = lines.filter((l) => l.indexOf(mark) >= 0).length;
        fs.writeFileSync(at5, lines.map((l) => (l.indexOf(mark) >= 0 ? SHELL_U2_REMOVE[ONLY](l) : l)).join("\n"));
        let bit = false;
        try { bit = hits === 1 && await guard[3](copy); } catch { bit = hits === 1; }
        fs.writeFileSync(at5, buf);
        const back = sha(fs.readFileSync(at5)) === want;
        said = ONLY + (hits === 1 && bit && back ? " red" : " DID NOT BITE (" + hits + " mark, back " + back + ")");
      } finally { dropPlantsTree(copy, ROOT); }
      check(/ red$/.test(said) && treeSha(ROOT) === before, "plant " + ONLY + " turns u2e red in a scratch copy: " + said);
    } else check(false, "unknown leg " + ONLY);
    process.stdout.write("#counts checks=" + asserted + " failed=" + failed + "\n");
    return failed ? 1 : 0;
  }
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const K = await import("../src/team-store.mjs").catch(() => ({}));
  const ud = path.join(SCRATCH, "user-data"), TEAM = "t-" + crypto.randomBytes(8).toString("hex");
  fs.mkdirSync(ud, { recursive: true });
  const at = K.teamsFile ? K.teamsFile(ud) : path.join(ud, "teams.json");
  const vault = vaultOf("this account"), key1 = crypto.randomBytes(32), key2 = crypto.randomBytes(32);

  /* ---- 1. The keys between sessions ---------------------------------------------------------------- */
  await leg("td1a a team key kept for an epoch is in teams.json under user data, in none of five spellings, and the same"
    + " vault opens it back byte for byte (red where there is no store, or it keeps the key in the clear)", async () => {
    K.keepTeamKey(at, vault, TEAM, 1, key1);
    K.keepTeamKey(at, vault, TEAM, 2, key2);
    const back = K.teamKeysOf(at, vault);
    return fs.existsSync(at) && path.dirname(at) === path.resolve(ud) && filesHolding(ud, key1).length === 0
      && filesHolding(ud, key2).length === 0 && Buffer.from(back[TEAM][1]).equals(key1) && Buffer.from(back[TEAM][2]).equals(key2);
  });
  await leg("td1b a key sealed by another account's vault is handed to nobody and stays in the file", async () => {
    const other = K.teamKeysOf(at, vaultOf("another account"));
    return Object.keys(other).length === 0 && JSON.parse(fs.readFileSync(at, "utf8")).teams[TEAM].keys[1];
  });
  await leg("td1c where the vault cannot seal, no key is kept and the file is unchanged (red where a key is written some"
    + " other way)", async () => {
    const before = fs.readFileSync(at, "utf8"), k3 = crypto.randomBytes(32);
    const said = await throwsOn(() => K.keepTeamKey(at, Object.assign({}, vault, { available: () => false }), TEAM, 3, k3));
    return /cannot keep a key sealed/.test(said) && fs.readFileSync(at, "utf8") === before && filesHolding(ud, k3).length === 0;
  });
  await leg("td1d an epoch's key never changes: another key for epoch 2 is refused and the file is unchanged; the same key"
    + " again is taken", async () => {
    const before = fs.readFileSync(at, "utf8");
    const said = await throwsOn(() => K.keepTeamKey(at, vault, TEAM, 2, crypto.randomBytes(32)));
    const again = await throwsOn(() => K.keepTeamKey(at, vault, TEAM, 2, key2));
    return /already keeps a different key under the same number/.test(said) && again === "" && Buffer.from(K.teamKeysOf(at, vault)[TEAM][2]).equals(key2)
      && JSON.parse(fs.readFileSync(at, "utf8")).teams[TEAM].keys[1] === JSON.parse(before).teams[TEAM].keys[1];
  });
  await leg("td1e a teams.json that does not read is refused for a write and left byte for byte, and read for a publish as"
    + " holding no key (red where it is written over, losing every team it names)", async () => {
    const bad = path.join(SCRATCH, "bad", "teams.json");
    fs.mkdirSync(path.dirname(bad), { recursive: true });
    fs.writeFileSync(bad, "{ not json");
    const said = await throwsOn(() => K.keepTeamKey(bad, vault, TEAM, 1, key1));
    const said2 = await throwsOn(() => K.chooseSealed(bad, TEAM, false, ud));
    return /left as it is/.test(said) && /left as it is/.test(said2) && fs.readFileSync(bad, "utf8") === "{ not json"
      && JSON.stringify(K.teamKeysOf(bad, vault)) === "{}" && K.unsealedOf(bad).length === 0;
  });
  await leg("td1f the lead's Plain is kept per team and read back as the teams that are unsealed; Sealed takes it back",
    async () => {
      K.chooseSealed(at, TEAM, false, ud);
      const plain = K.unsealedOf(at).join();
      K.chooseSealed(at, TEAM, true, ud);
      return plain === TEAM && K.unsealedOf(at).length === 0 && K.keptTeam(at, TEAM).sealed === true
        && JSON.stringify(K.keptTeam(at, TEAM).epochs) === "[1,2]";
    });
  await leg("td1A THE CONTROL: the scan finds a key written into the store in the clear, so td1a's nought is a reading",
    async () => {
      const planted = path.join(SCRATCH, "planted");
      fs.mkdirSync(planted, { recursive: true });
      fs.writeFileSync(path.join(planted, "teams.json"), JSON.stringify({ keys: { 1: key1.toString("base64") } }, null, 1));
      return filesHolding(planted, key1).length === 1;
    });

  /* ---- 2. The switch: the verbs behind the Desks screen ----------------------------------------------------------- */
  const S = await import("../src/studio.mjs");
  const T = await import("../src/team.mjs");
  const { publishFull, editionsIn, ARCHIVE, CATALOG_IN_ARCHIVE } = await import("../src/publish.mjs");
  const { makeKeyFile } = await import("../src/sign.mjs");
  const PASS = "a passphrase for the lead's key in this gate";
  const projects = path.join(SCRATCH, "projects"), SHARE = path.join(SCRATCH, "share");
  fs.mkdirSync(projects, { recursive: true });
  const dir = (await S.newProject(projects, "Team desks", [{ code: "en", name: "English" }])).dir;
  const shelf = ((await S.addTag(dir, "shelf", { en: "General" })).tag).id;
  const card = (await S.addCard(dir, shelf, "Card a", "The a answer, in full.")).card.id;
  S.setPublishFolder(dir, SHARE);
  await S.publishProject(dir, { folder: SHARE, now: "2026-10-01T09:00:00.000Z", ...(await licensedOpts()) });
  const catId = readJson(path.join(dir, "draft.json")).id;
  const keyAt = path.join(SCRATCH, "lead-key.json"), otherAt = path.join(SCRATCH, "other-key.json");
  const lead = await makeKeyFile({ passphrase: PASS }), other = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  fs.writeFileSync(otherAt, JSON.stringify(other, null, 1) + "\n");
  const teamAt = path.join(SHARE, "etiuda-team.json");
  const NEW = "t-" + crypto.randomBytes(8).toString("hex"), NK = crypto.randomBytes(32);
  const sameFile = async (fn, why) => {
    const before = fs.existsSync(teamAt) ? fs.readFileSync(teamAt, "utf8") : null;
    const said = await throwsOn(fn);
    process.stdout.write("       refused: " + JSON.stringify(said.slice(0, 140)) + "\n");
    return why.test(said) && (fs.existsSync(teamAt) ? fs.readFileSync(teamAt, "utf8") : null) === before;
  };
  let written = null;

  await leg("td2A THE CONTROL: before any team, the folder's facts say there is no team file, and name this Studio's key",
    async () => {
      const f = await S.teamFacts(dir, { key: keyAt });
      return f.file === "none" && !f.team && f.signing === lead.keyId && f.folder === path.resolve(SHARE) && f.id === catId;
    });
  await leg("td2a a team on the relay, standing as Sealed once made it (was: Sealed on a folder with no team writes one; the verb refuses that now, team-seal fh4) is whole under this Studio's key: sealed, desks' exports sealed, this"
    + " catalog listed, epoch 1, nobody on the roster, under the id its key was kept by (red where there is no switch)",
    async () => {
      const r = await olderFolderTeam(dir, { key: keyAt, passphrase: PASS, teamId: NEW, relay: true }); /* on the relay (was: made by the switch at a plain folder, which Studio no longer does) */
      written = r.written;
      const held = await T.heldTeam(SHARE, { key: keyAt }), f = await S.teamFacts(dir, { key: keyAt });
      return r.created && !!held.team && held.team.id === NEW && held.team.sealed === true && held.team.exportsSealed === true
        && JSON.stringify(held.team.catalogs) === JSON.stringify([catId]) && held.team.epoch === 1 && held.team.roster.length === 0
        && f.file === "ours" && f.team.sealed === true && f.team.id === NEW;
    });
  await leg("td2b and the next publish, handed the key kept for the team, writes the share's copy sealed and marks the project",
    async () => {
      const r = await publishFull({ project: dir, folder: SHARE, leadKey: keyAt, teamKeys: { [NEW]: { 1: NK } },
        now: "2026-10-02T09:00:00.000Z", ...(await licensedOpts()) });
      return r.sealed && r.sealed.team === NEW && readJson(r.ec).kind === "etiuda-sealed"
        && readJson(path.join(dir, "project.json")).sealedTeam === NEW;
    });
  await leg("td2c a wrong passphrase changes nothing (red where the file is written unsigned or the switch moves)", async () =>
    await sameFile(() => S.setTeamSealed(dir, false, { key: keyAt, passphrase: "not it" }), /passphrase/)
    && readJson(path.join(dir, "project.json")).sealedTeam === NEW);
  await leg("td2d a team file at the folder that is not this Studio's own is left byte for byte (red where it is signed over)",
    async () => {
      const ours = fs.readFileSync(teamAt, "utf8");
      const theirs = T.newTeam({ catalogs: [catId], lead: { keyId: other.keyId, public: other.public }, sealed: true });
      await T.writeTeam(SHARE, theirs, { key: otherAt, passphrase: PASS });
      const ok = await sameFile(() => S.setTeamSealed(dir, false, { key: keyAt, passphrase: PASS }), /not this Studio.s own/)
        && (await S.teamFacts(dir, { key: keyAt })).file === "theirs";
      fs.writeFileSync(teamAt, ours);
      return ok;
    });
  await leg("td2e with no signing key the switch writes nothing and says why", async () =>
    await sameFile(() => S.setTeamSealed(dir, false, { key: path.join(SCRATCH, "no-key.json"), passphrase: PASS }),
      /signing key/));
  await leg("td2f Sealed is refused while the project is kept inside the folder it publishes to, and no team file is made"
    + " there (the test architect's smaller condition; red where a team is made)", async () => {
    const share2 = path.join(SCRATCH, "share-2"), inside = path.join(share2, "project-here");
    fs.mkdirSync(share2, { recursive: true });
    fs.cpSync(dir, inside, { recursive: true });
    S.setPublishFolder(inside, share2);
    const said = await throwsOn(() => S.setTeamSealed(inside, true, { key: keyAt, passphrase: PASS,
      teamId: "t-" + crypto.randomBytes(8).toString("hex") }));
    return /kept inside/.test(said) && !fs.existsSync(path.join(share2, "etiuda-team.json"));
  });
  await leg("962s5c Plain refused with two", () => leg962s5c());
  await leg("td2g Plain writes this Studio's team saying not sealed and makes the project forget it sealed, so the next"
    + " publish handed the lead's Plain goes out in the clear (red where the mark stays and the publish is refused)",
    async () => {
      const r = await S.setTeamSealed(dir, false, { key: keyAt, passphrase: PASS });
      const held = await T.heldTeam(SHARE, { key: keyAt }), mark = readJson(path.join(dir, "project.json")).sealedTeam;
      const p = await publishFull({ project: dir, folder: SHARE, leadKey: keyAt, teamKeys: { [NEW]: { 1: NK } },
        unsealed: [NEW], now: "2026-10-03T09:00:00.000Z", ...(await licensedOpts()) });
      written = r.written;
      return !!held.team && held.team.sealed === false && held.team.id === NEW && mark === undefined
        && !p.sealed && readJson(p.ec).id === catId;
    });
  await leg("td2h with the team file taken off the share, Sealed puts back the copy this Studio kept: the same team and"
    + " epoch, whole under its key, sealed again (red where a new team is made or nothing is written)", async () => {
    fs.rmSync(teamAt);
    const r = await S.setTeamSealed(dir, true, { key: keyAt, passphrase: PASS, kept: written });
    const held = await T.heldTeam(SHARE, { key: keyAt });
    return !r.created && !!held.team && held.team.id === NEW && held.team.epoch === 1 && held.team.sealed === true;
  });
  /* A DESK'S EXPORT (23b-B): the team file the switch put back above, sealed, its exports sealed as a new team's are. */
  const teamNow = async () => (await T.heldTeam(SHARE, { key: keyAt })).team;
  await leg("td2j Plain for a desk's export writes this Studio's team file whole under its key saying exports are not sealed,"
    + " its rev one higher and every other field as it was, and answers the screen's facts with it (red where there is no such"
    + " verb)", async () => {
    const was = await teamNow();
    const r = await S.setTeamExports(dir, keyAt, false, PASS);
    const now = await teamNow(), strip = (t) => {
      const o = JSON.parse(JSON.stringify(t)); delete o.sig; delete o.exportsSealed; delete o.rev; return o;
    };
    return !!was && was.exportsSealed === true && was.sealed === true && !!now && now.exportsSealed === false
      && Number.isInteger(was.rev) && now.rev === was.rev + 1
      && JSON.stringify(strip(now)) === JSON.stringify(strip(was)) && r.file === "ours" && r.team.exportsSealed === false
      && r.team.sealed === true && !!r.written && r.written.exportsSealed === false;
  });
  await leg("td2k and Sealed writes it back saying they are", async () => {
    const r = await S.setTeamExports(dir, keyAt, true, PASS);
    const now = await teamNow();
    return !!now && now.exportsSealed === true && now.sealed === true && r.team.exportsSealed === true;
  });
  await leg("td2l a wrong passphrase, or none, changes nothing, and neither does a team file that is not this Studio's own",
    async () => {
      const a = await sameFile(() => S.setTeamExports(dir, keyAt, false, "not it"), /did not open/);
      const b = await sameFile(() => S.setTeamExports(dir, keyAt, false, ""), /did not open/);
      const ours = fs.readFileSync(teamAt, "utf8");
      const theirs = T.newTeam({ catalogs: [catId], lead: { keyId: other.keyId, public: other.public }, sealed: true });
      await T.writeTeam(SHARE, theirs, { key: otherAt, passphrase: PASS });
      const c = await sameFile(() => S.setTeamExports(dir, keyAt, false, PASS), /nothing was written/);
      fs.writeFileSync(teamAt, ours);
      return a && b && c && (await teamNow()).exportsSealed === true;
    });

  /* NO SWITCH FOR READING A CATALOG THE TEAM DOES NOT LIST (board 1014): the lead sees a member's catalog unless the member marked it
     Private, so the team file this Studio writes carries no `content` field at all, after the verbs above and after a handover. */
  await leg("td0b the team file this Studio writes carries no content switch, and a handover writes none", async () => {
    const held = await teamNow();
    const out = T.withHandover(held, { format: 1, kind: "etiuda-team-handover", team: held.id,
      to: { keyId: other.keyId, public: other.public } }, { keyId: other.keyId, public: other.public });
    const raw = JSON.parse(fs.readFileSync(teamAt, "utf8"));
    return !("content" in held) && !("content" in raw) && !("content" in out) && !("withContent" in T) && !("setTeamContent" in S);
  });

  /* ONCE THE LEAD HAS CHOSEN SEALED, NOT ONCE A SEALED PUBLISH HAS SUCCEEDED (the test architect's read of this build): a
     project that never published, switched to Sealed, whose team file then leaves the share. Each pass a fresh project and
     share, so the share holding no .ec is a reading of this publish alone. */
  const sealedThenPublish = async (n, drop) => {
    const root = path.join(SCRATCH, "fresh-" + n), share = path.join(root, "share"), tid = "t-" + crypto.randomBytes(8).toString("hex");
    const d = (await S.newProject(path.join(root, "projects"), "Sealed first", [{ code: "en", name: "English" }])).dir;
    const tag = ((await S.addTag(d, "shelf", { en: "General" })).tag).id;
    await S.addCard(d, tag, "Card b", "The b answer, in full.");
    fs.mkdirSync(share, { recursive: true });
    S.setPublishFolder(d, share);
    await olderFolderTeam(d, { key: keyAt, passphrase: PASS, teamId: tid, relay: true });
    const mark = readJson(path.join(d, "project.json")).sealedTeam;
    if (drop) fs.rmSync(path.join(share, "etiuda-team.json"));
    let r = null;
    const said = await throwsOn(async () => { r = await publishFull({ project: d, folder: share, leadKey: keyAt,
      teamKeys: { [tid]: { 1: crypto.randomBytes(32) } }, now: "2026-10-04T08:00:00.000Z", ...(await licensedOpts()) }); });
    if (said) process.stdout.write("       refused: " + JSON.stringify(said.slice(0, 140)) + "\n");
    return { tid, mark, said, r, ecs: fs.readdirSync(share).filter(f => f.endsWith(".ec")) };
  };
  await leg("td2B THE CONTROL: a project that never published, switched to Sealed, publishes sealed with the key kept for the"
    + " team", async () => {
    const o = await sealedThenPublish(1, false);
    return !o.said && !!o.r && !!o.r.sealed && o.r.sealed.team === o.tid && o.ecs.length === 1
      && readJson(o.r.ec).kind === "etiuda-sealed";
  });
  await leg("td2i Sealed marks the project at once, so with the team file taken off the share before any publish the first"
    + " publish is refused and the share holds no .ec (red where the mark waits for a sealed publish and the catalog goes out"
    + " in the clear)", async () => {
    const o = await sealedThenPublish(2, true);
    return o.mark === o.tid && /holds no team file now/.test(o.said) && !o.r && o.ecs.length === 0;
  });

  /* ---- 3. The lead's plain copy ------------------------------------------------------------------------------------ */
  await publishFull({ project: dir, folder: SHARE, leadKey: keyAt, teamKeys: { [NEW]: { 1: NK } }, now: "2026-10-04T09:00:00.000Z", ...(await licensedOpts()) });
  const lastEd = editionsIn(dir).slice(-1)[0], archivedAt = path.join(dir, ARCHIVE, lastEd, CATALOG_IN_ARCHIVE);
  await leg("td3A THE CONTROL: the lead exports the newest edition out of the folder as a plain copy, byte for byte the"
    + " archive's, though the share's copy is sealed", async () => {
    const to = path.join(SCRATCH, "out", "plain.ec");
    fs.mkdirSync(path.dirname(to), { recursive: true });
    S.exportEdition(dir, lastEd, to);
    return readJson(path.join(SHARE, fs.readdirSync(SHARE).find(n => n.endsWith(".ec")))).kind === "etiuda-sealed"
      && fs.readFileSync(to, "utf8") === fs.readFileSync(archivedAt, "utf8") && readJson(to).id === catId;
  });
  await leg("td3a a plain copy exported into the folder the project publishes to sealed is refused and nothing is written"
    + " (red where the catalog lands on the share in the clear)", async () => {
    const to = path.join(SHARE, "copy.ec");
    const said = await throwsOn(() => S.exportEdition(dir, lastEd, to));
    return /publishes sealed/.test(said) && !fs.existsSync(to);
  });

  /* ---- 4. The Desks screen, as the page paints it ------------------------------------------------------------------ */
  const { loadPage } = await import("./page-stand-in.mjs");
  const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
  const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m])
    .replace(/\s+/g, " ").trim();
  const asked = [];
  /* A desk's key as the roster gives it: the 16 hex of its id, which the desk itself prints (G1). */
  const facts = (o) => Object.assign({ error: null, folder: "C:\\share", id: catId, mark: null, signing: lead.keyId, file: "ours",
    reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [],
    team: { id: NEW, epoch: 3, sealed: true, lists: true, exportsSealed: true, relay: true, roster: [
      { id: "k-e5c80a17b2e4d856", name: "Ewa's desk", own: "", key: "e5c80a17b2e4d856", admitted: true },
      { id: "k-7d0355e1c95b7f13", name: "Anna (evenings)", own: "Anna K.", key: "7d0355e1c95b7f13", admitted: false }] } }, o || {});
  let answer = facts();
  const ASKS = { id: "k-9b12e0040c71b2e4", name: "Ola", key: "9b12e004" + "0".repeat(56), asked: "2026-10-04T09:20:00.000Z", state: "asks" };
  const READY = Object.assign({}, ASKS, { id: "k-3f9a0c71b2e4d856", state: "ready" }),
    SPENT = Object.assign({}, ASKS, { id: "k-81d0e6a4c95b7f13", state: "spent" });
  let admitAnswer = facts(), sealAnswer = { error: null, team: null }, removeAnswer = facts();
  const api = {
    desks: async (d) => { asked.push(["desks", d]); return JSON.parse(JSON.stringify(answer)); },
    teamSealed: async (...a) => { asked.push(["teamSealed", ...a]); return JSON.parse(JSON.stringify(sealAnswer)); },
    teamRelay: async (...a) => { asked.push(["teamRelay", ...a]); return JSON.parse(JSON.stringify(sealAnswer)); },
    memberRemove: async (...a) => { asked.push(["memberRemove", ...a]); return JSON.parse(JSON.stringify(removeAnswer)); },
    teamExports: async (...a) => { asked.push(["teamExports", ...a]); return JSON.parse(JSON.stringify(expAnswer)); },
    teamSharing: async (...a) => { asked.push(["teamSharing", ...a]); return JSON.parse(JSON.stringify(shareAnswer)); },
    teamLeave: async (...a) => { asked.push(["teamLeave", ...a]); return JSON.parse(JSON.stringify(leaveAnswer)); },
    teamMoveCatalog: async (...a) => { asked.push(["teamMoveCatalog", ...a]); return JSON.parse(JSON.stringify(moveAnswer)); },
  };
  let shareAnswer = facts(), expAnswer = facts(), leaveAnswer = { error: null }, moveAnswer = { error: null };
  const home = loadPage({ api, uiLang: "en", source });
  const P = home.page;
  const open = JSON.parse(JSON.stringify(await S.openProject(dir)));
  Object.assign(P.S, { open, projects: [{ id: catId, name: open.name, dir: open.dir, editions: open.editions, rev: open.project.rev }],
    screen: "projects", home: "team", teamDir: open.dir, lang: "en", host: { tour: { offered: true } } });
  const mainHtml = () => home.node("#main").innerHTML;
  await leg("td4a the rail carries Overview first on the home tab and Team under it, its number the desks asking to join, and the"
    + " screen reads the folder on the way in (red where there is no Team screen)", async () => {
    answer = facts({ requests: [ASKS] });
    await P.desksLoad();
    const rail = home.node("#rail").innerHTML;
    const i = rail.indexOf('data-v="team"'), j = rail.indexOf('data-v="overview"');
    return i > 0 && j >= 0 && j < i && /data-v="team"[^>]*><span class="rl">.*?Team<\/span><span class="num">1</.test(rail)
      && asked.some(a => a[0] === "desks" && a[1] === open.dir);
  });
  await leg("td4b the screen names the folder, lists the roster by the names the lead gave with each desk's own beneath and"
    + " its key in fours after a desk's disc, and beside it Publishing as Sealed, a plain copy of the newest edition and the"
    + " team key's epoch", async () => {
    answer = facts();
    await P.desksLoad();
    const h = mainHtml(), t = text(h);
    return /<h1>Team<\/h1>/.test(h) && h.indexOf("C:\\share") >= 0
      && /Ewa.*?e5c8 0a17 b2e4 d856 admitted/.test(t) && /Anna \(evenings\) its own name: Anna K\. 7d03 55e1 c95b 7f13 named/.test(t)
      && (h.match(/class="kdisc desk" role="img" aria-label="A teammate&#39;s key"/g) || []).length === 2
      && /aria-checked="true" data-act="team-seal" data-v="sealed"/.test(h)
      && h.indexOf('data-act="arch-export" data-e="' + lastEd + '"') >= 0
      && /Team key held by this Studio; made new when a member was removed/.test(t) && !/epoch/i.test(t);
  });
  await leg("td4c where the switch cannot work it is not offered and the row says why: a team file not this Studio's own,"
    + " and no signing key, where the row makes one or restores one in place (K5)", async () => {
    answer = facts({ file: "theirs", team: null });
    await P.desksLoad();
    const a = mainHtml();
    answer = facts({ signing: "" });
    await P.desksLoad();
    const b = mainHtml();
    answer = facts();
    await P.desksLoad();
    return !/data-act="team-seal"/.test(a) && /is not this Studio.s own/.test(text(a)) && !/data-act="team-fresh"/.test(a)
      && !/data-act="team-seal"/.test(b) && /there is none yet/.test(text(b))
      && !/data-act="key-restore"|data-act="key-make"/.test(b) && /data-act="key-settings"/.test(b) /* MOVED (board 1016, item 5): old, Restore and Make were drawn here; new, the one link to Settings */
      && /data-act="team-seal"/.test(mainHtml());
  });
  await leg("td4d a sealed team with nobody admitted says that no desk can open what is published until one is", async () => {
    answer = facts({ team: Object.assign({}, facts().team, { roster: [] }) });
    await P.desksLoad();
    const ok = /No teammate can open what is published here until one is admitted\./.test(text(mainHtml()))
      && /No teammate is on the roster yet\./.test(text(mainHtml()));
    answer = facts();
    await P.desksLoad();
    return ok;
  });
  await leg("td4e pressing Plain opens the switch's cover, which asks for no passphrase, and changes nothing yet; pressing"
    + " what is already chosen opens nothing", async () => {
    P.ACTS["team-seal"]({ getAttribute: () => "sealed" });
    const none = P.S.cover;
    P.ACTS["team-seal"]({ getAttribute: () => "plain" });
    const dlg = home.node("#dlg").innerHTML;
    return none === null && P.S.cover === "team" && !/type="password"/.test(dlg) && /data-act="do-team-seal"/.test(dlg)
      && /Give this folder its catalog files in the clear/.test(text(dlg)) && !asked.some(a => a[0] === "teamSealed");
  });
  await leg("td4f the cover's button sends Plain and nothing typed, closes and reads the folder again", async () => {
    const n = asked.filter(a => a[0] === "desks").length;
    await P.ACTS["do-team-seal"]();
    const sent = asked.find(a => a[0] === "teamSealed");
    return !!sent && sent[1] === open.dir && sent[2] === false && sent[3] === false && sent.length === 4
      && P.S.cover === null && asked.filter(a => a[0] === "desks").length === n + 1;
  });
  await leg("td4g on a Polish desk the screen is Polish: its words come from the table and none is left in English", async () => {
    const pl = loadPage({ api, uiLang: "pl" }), Q = pl.page;
    Object.assign(Q.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    await Q.desksLoad();
    const t = text(pl.node("#main").innerHTML);
    return /Zespół/.test(t) && /Zapieczętowane/.test(t) && /Lista członków zespołu/.test(t) && /Klucz zespołu jest w tym Studiu; wymieniony po usunięciu członka zespołu/.test(t) && !/epok/i.test(t)
      && !/Sealed|Roster|Team key|its own name/.test(t);
  });

  /* td4h to td4j: the desks asking to join (step 12's S5) on the same screen as the switch, as Claudia's picture 4b has them:
     rows at the head of the roster, each with the control its state allows, and Admit sending the code at once, with no
     cover (Claudia's finding, taken 2026-10-07 21:19). The stand-in's querySelectorAll answers nothing, so the code typed in
     a row is stood in here. */
  /* P2: td4h held "a desk asking to join is a row at the head of the roster with the control its state allows: Open the request, the code field
     with Admit, or Open again where its answer is to an opening no longer held; Refuse on each, its key the desk's own print, and Admit all only
     where two rows are ready"; and td4i, td4j and td4jp held the code door's presses and their Polish. The code door is gone, so td4h is
     rebased: every request, whatever it once said of itself, is a row with the desk's name, when it asked, its own print, and Refuse alone. */
  await leg("td4h a desk asking to join is a row at the head of the roster with its name, when it asked, the desk's own print and Refuse, and nothing to type: no"
    + " Open the request, no code field, no Admit and no Admit all, whatever state the request once had", async () => {
    answer = facts({ requests: [ASKS, READY, SPENT] });
    await P.desksLoad();
    const h = mainHtml(), t = text(h);
    const a = h.indexOf('data-id="' + ASKS.id + '"'), r = h.indexOf('data-id="' + READY.id + '"'), s = h.indexOf('data-id="' + SPENT.id + '"');
    const one = a > 0 && r > a && s > r && h.indexOf("e5c8 0a17") > s
      && (h.match(/data-act="desk-refuse"/g) || []).length === 3 && /Ola asked 2026-10-04 09:20/.test(t)
      && /9b12 e004 0c71 b2e4/.test(t)
      && !/desk-open|desk-admit|data-code|Open the request|Admit all|code the agent reads out/.test(h);
    answer = facts({ requests: [READY, Object.assign({}, READY, { id: "k-c2475be09a1f6d38", name: "Iga" })] });
    await P.desksLoad();
    return one && !/desk-admit-all/.test(mainHtml());
  });
  await leg("td4k the lead's key shows beside the team key in fours and lower case after Studio's disc, as the desk prints it"
    + " for its agent to compare, and only where there is a team this Studio leads", async () => {
    answer = facts({ team: Object.assign({}, facts().team, { leadPrint: "8a3f91c02b7ed104" }) });
    await P.desksLoad();
    const shownHtml = mainHtml(), shown = text(shownHtml);
    answer = facts({ file: "none", team: null });
    await P.desksLoad();
    const none = text(mainHtml());
    answer = facts();
    await P.desksLoad();
    return /Team key held by this Studio; made new when a member was removed Signing key 8a3f 91c0 2b7e d104/.test(shown)
      && /class="kdisc" role="img" aria-label="Studio&#39;s signing key"/.test(shownHtml) && !/Signing key/.test(none);
  });

  /* td4l, td4m: P2 and K8. The team key's recovery copy opens with the signing key, so the sealed team's row says only
     whether the key has its backup copy; a computer with no key restores before it makes one where the team trusts one. */
  const withTeam = (o, k) => facts(Object.assign({ team: Object.assign({}, facts().team, o) }, k || {}));
  await leg("td4l a sealed team, with the key made here, shows If this computer is lost with the key's backup line and no"
    + " recovery passphrase anywhere; a plain team shows no such row", async () => {
    const seen = async (a) => { answer = a; await P.desksLoad(); return mainHtml(); };
    const hostWas = P.S.host;
    P.S.host = Object.assign({}, hostWas || {}, { signing: { keyId: lead.keyId, print: "8a3f91c02b7ed104", kept: "os", backup: null, admitted: 1, problem: null } });
    const none = await seen(withTeam({}));
    P.S.host.signing.backup = { keyId: lead.keyId, made: "2026-10-08", where: "E:\\" };
    const made = await seen(withTeam({}));
    const plain = await seen(withTeam({ sealed: false }));
    P.S.host = hostWas;
    answer = facts();
    await P.desksLoad();
    /* The relay's sentence (was: "The team comes back with the signing key's backup copy. There is nothing else to keep.", the shared folder's;
       a team at a folder is held with one line now, and the Team screen is the relay's). */
    return /If this computer is lost The key's backup copy brings back the signing key and the team's place on the relay, but not the team's files kept there\. A backup copy brings it to another computer\. Signing key settings/.test(text(none))
      /* MOVED (board 1016, item 5): old, Make a backup copy and Make another were pressed here; new, each line carries the one link to Settings. */
      && !/data-act="key-backup"/.test(none + made) && /data-act="key-settings"/.test(none) && /A backup copy is in E:\\, made 2026-10-08\. Signing key settings/.test(text(made))
      && !/If this computer is lost/.test(text(plain)) && !/[Rr]ecovery passphrase|team-recovery/.test(none + made + plain);
  });
  await leg("td4m with no key here and a team in the folder trusting one, the row names that key after Studio's disc and"
    + " offers Restore first and a new key second with its cost; with a key here and the team another key's, it offers a"
    + " new team, whose cover, on the relay (was: a shared folder), says every teammate is invited again and sends the new team with nothing typed", async () => {
    answer = facts({ signing: "", lead: "9a3a782d7f8ff25b", file: "theirs", team: null });
    await P.desksLoad();
    const lost = mainHtml();
    answer = facts({ lead: "9a3a782d7f8ff25b", file: "theirs", team: null });
    await P.desksLoad();
    const theirs = mainHtml();
    P.ACTS["team-fresh"]();
    /* The cover asks where the new team meets (board 926); since 2026-11-20 the relay is its one place, and this leg is the relay's (was the shared folder's). */
    const dlg = home.node("#dlg").innerHTML;
    sealAnswer = { error: null, team: null };
    await P.ACTS["do-team-seal"]();
    const sent = asked.filter(a => a[0] === "teamRelay").pop();
    answer = facts();
    await P.desksLoad();
    const ti = text(lost);
    const f = { names: /The team in this folder trusts the signing key 9a3a 782d 7f8f f25b ?, and it is not on this computer\./.test(ti),
      restoreFirst: !/data-act="key-restore"|data-act="key-make"/.test(lost) && /data-act="key-settings"/.test(lost), /* MOVED (board 1016, item 5): old, Restore first and Make second here; new, the one link to Settings */
      cost: /No backup copy\? A new key works too, and every teammate is let in again\. Signing key settings/.test(ti),
      disc: /aria-label="Studio&#39;s signing key"/.test(lost), noSwitch: !/data-act="team-seal"/.test(lost),
      fresh: /data-act="team-fresh"/.test(theirs), says: /Every teammate is invited to the new team again\./.test(text(dlg)),
      noField: !/type="password"/.test(dlg), sent: !!sent && sent[1] === open.dir, closed: P.S.cover === null };
    const ok = Object.keys(f).every(k => f[k]);
    if (!ok) process.stderr.write("  td4m " + JSON.stringify(f) + "\n");
    return ok;
  });

  /* td4o, td4p: a desk's export, Plain or Sealed (23b-B). */
  await leg("td4o a sealed team shows A desk's export with the team file's word chosen and its line beneath; a plain team, or"
    + " a folder whose switch cannot work, shows no such row (red where the row is not there)", async () => {
    const seen = async (a) => { answer = a; await P.desksLoad(); return mainHtml(); };
    const sealedExp = await seen(withTeam({ exportsSealed: true })), plainExp = await seen(withTeam({ exportsSealed: false }));
    const plainTeam = await seen(withTeam({ sealed: false })), theirs = await seen(facts({ file: "theirs", team: null }));
    answer = facts();
    await P.desksLoad();
    return /aria-checked="true" data-act="team-exports" data-v="sealed"/.test(sealedExp)
      && /aria-checked="true" data-act="team-exports" data-v="plain"/.test(plainExp)
      && /A desk's export Plain Sealed Plain, an exported file opens anywhere. Sealed, it opens only inside the team./.test(text(sealedExp))
      && !/team-exports/.test(plainTeam) && !/team-exports/.test(theirs);
  });
  await leg("td4p pressing Plain opens the switch's cover with no passphrase and sends nothing; pressing what is chosen opens"
    + " nothing; the cover's button sends Plain alone, closes and shows what came back", async () => {
    answer = withTeam({ exportsSealed: true });
    await P.desksLoad();
    P.S.cover = null;
    P.ACTS["team-exports"]({ getAttribute: () => "sealed" });
    const none = P.S.cover;
    P.ACTS["team-exports"]({ getAttribute: () => "plain" });
    const dlg = home.node("#dlg").innerHTML, quiet = !asked.some(a => a[0] === "teamExports");
    expAnswer = withTeam({ exportsSealed: false });
    await P.ACTS["do-team-exports"]();
    const sent = asked.find(a => a[0] === "teamExports"), after = mainHtml();
    answer = facts(); expAnswer = facts();
    await P.desksLoad();
    return none === null && /Let a desk export in the clear/.test(text(dlg)) && !/type="password"/.test(dlg)
      && /data-act="do-team-exports"/.test(dlg) && quiet && !!sent && sent[1] === open.dir && sent[2] === false
      && sent.length === 3 && P.S.cover === null && /aria-checked="true" data-act="team-exports" data-v="plain"/.test(after);
  });

  /* 1013sw2 to 1013sw4: the lead's switch for sharing cards (board 1013, piece 6), on a relay team only. */
  const RELAY_AT = "C:/ud/relay/0123456789abcdef0123456789abcdef";
  const LINE_EN = "Members can share single cards of their own with named teammates, who keep or decline them. Turned off, no desk can share a new card; cards already kept, or already waiting, stay.";
  const PEND_OFF_EN = "Off here; the desks stop offering it once the next publish reaches them.", PEND_ON_EN = "On here; the desks offer it once the next publish reaches them.";
  await leg("1013sw2 a relay team this Studio leads shows Sharing cards between teammates, On chosen where the team file says nothing and Off"
    + " where it says off, with the copywriter's line beneath; a team on a folder, or one that is not this Studio's, shows no such row", async () => {
    const seen = async (a) => { answer = a; await P.desksLoad(); return mainHtml(); };
    const on = await seen(withTeam({}, { folder: RELAY_AT })), off = await seen(withTeam({ sharing: "off" }, { folder: RELAY_AT }));
    const folder = await seen(withTeam({ sharing: "off" })), theirs = await seen(facts({ file: "theirs", team: null, folder: RELAY_AT }));
    answer = facts();
    await P.desksLoad();
    return /aria-checked="true" data-act="team-sharing" data-v="on"/.test(on) && /aria-checked="true" data-act="team-sharing" data-v="off"/.test(off)
      && /Sharing cards between teammates Off On /.test(text(on)) && text(on).indexOf(LINE_EN) > 0
      && !/team-sharing/.test(folder) && !/team-sharing/.test(theirs);
  });
  await leg("1013sw3 pressing Off sends the one word off and nothing else, shows what came back, and pressing what is chosen sends nothing", async () => {
    answer = withTeam({}, { folder: RELAY_AT });
    await P.desksLoad();
    const before = asked.filter(a => a[0] === "teamSharing").length;
    await P.ACTS["team-sharing"]({ getAttribute: () => "on" });
    const quiet = asked.filter(a => a[0] === "teamSharing").length === before;
    shareAnswer = withTeam({ sharing: "off" }, { folder: RELAY_AT });
    await P.ACTS["team-sharing"]({ getAttribute: () => "off" });
    const sent = asked.filter(a => a[0] === "teamSharing").pop(), after = mainHtml();
    shareAnswer = withTeam({}, { folder: RELAY_AT });
    await P.ACTS["team-sharing"]({ getAttribute: () => "on" });
    const back = asked.filter(a => a[0] === "teamSharing").pop(), onAgain = mainHtml();
    answer = facts();
    await P.desksLoad();
    return quiet && !!sent && sent.length === 3 && sent[1] === open.dir && sent[2] === false && P.S.cover === null
      && /aria-checked="true" data-act="team-sharing" data-v="off"/.test(after)
      && !!back && back[2] === true && /aria-checked="true" data-act="team-sharing" data-v="on"/.test(onAgain);
  });
  await leg("1013sw4 the line for the change not yet on the relay is shown for the state chosen, in English and in Polish, and not once the relay holds the file", async () => {
    const seen = async (Pg, node, a) => { answer = a; await Pg.desksLoad(); return text(node.innerHTML); };
    const offW = withTeam({ sharing: "off" }, { folder: RELAY_AT, teamUnsent: true }), onW = withTeam({}, { folder: RELAY_AT, teamUnsent: true });
    const offDone = withTeam({ sharing: "off" }, { folder: RELAY_AT });
    const eOff = await seen(P, home.node("#main"), offW), eOn = await seen(P, home.node("#main"), onW), eDone = await seen(P, home.node("#main"), offDone);
    const pl = loadPage({ api, uiLang: "pl" }), Q = pl.page;
    Object.assign(Q.S, { open, screen: "projects", home: "team", teamDir: open.dir, host: P.S.host });
    const pOff = await seen(Q, pl.node("#main"), offW), pOn = await seen(Q, pl.node("#main"), onW);
    answer = facts();
    await P.desksLoad();
    return eOff.indexOf(PEND_OFF_EN) > 0 && eOff.indexOf(PEND_ON_EN) < 0 && eOn.indexOf(PEND_ON_EN) > 0 && eOn.indexOf(PEND_OFF_EN) < 0
      && eDone.indexOf(PEND_OFF_EN) < 0 && eDone.indexOf(PEND_ON_EN) < 0
      && pOff.indexOf("Udostępnianie kart w zespole") > 0
      && pOff.indexOf("Wyłączone tutaj; stanowiska przestaną to oferować, gdy dotrze do nich następna publikacja.") > 0
      && pOn.indexOf("Włączone tutaj; stanowiska zaczną to oferować, gdy dotrze do nich następna publikacja.") > 0;
  });

  /* td4n: the verb's own refusal. The cover's error path is a clause of its own (the read of the team carves, G7): a path
     that closed the cover silently would leave every leg above green and the person with no word of why nothing changed. */
  await leg("td4n a refusal from the switch's verb keeps the cover open and says why; the switch stays where it was", async () => {
    answer = facts();
    await P.desksLoad();
    P.ACTS["team-seal"]({ getAttribute: () => "plain" });
    sealAnswer = { error: "The signing key did not open on this computer, so nothing was written." };
    await P.ACTS["do-team-seal"]();
    const dlg = text(home.node("#dlg").innerHTML), still = P.S.cover, row = mainHtml();
    sealAnswer = { error: null, team: null };
    P.S.cover = null; P.S.err = null; P.S.teamWant = "";
    await P.desksLoad();
    return still === "team" && /The signing key did not open on this computer, so nothing was written\./.test(dlg)
      && /aria-checked="true" data-act="team-seal" data-v="sealed"/.test(row);
  });

  /* td4q to td4s: removing a member (board 885, S1). The button is on every roster row, desk or Studio alike, and not
     on a row that is only asking to join. The first press opens the one line and sends nothing; the confirm sends the
     team and the member and no key. */
  const EWA = "k-e5c80a17b2e4d856", ANNA = "k-7d0355e1c95b7f13";
  await leg("td4q Remove is on every roster row, a desk and a Studio alike, and not on a desk that is only asking; the"
    + " first press opens the one line, asks for no passphrase, and sends nothing", async () => {
    const roster = facts().team.roster.map((r, i) => Object.assign({}, r, { kind: i === 0 ? "desk" : "studio" }));
    answer = facts({ requests: [ASKS], team: Object.assign({}, facts().team, { roster }) });
    await P.desksLoad();
    const h = mainHtml();
    const before = asked.filter(a => a[0] === "memberRemove").length;
    P.ACTS["member-remove"]({ getAttribute: () => EWA });
    const dlg = home.node("#dlg").innerHTML;
    return (h.match(/data-act="member-remove"/g) || []).length === 2
      && h.indexOf('data-act="member-remove" data-id="' + EWA + '"') > 0
      && h.indexOf('data-act="member-remove" data-id="' + ANNA + '"') > 0
      && h.indexOf('data-act="member-remove" data-id="' + ASKS.id + '"') < 0
      && asked.filter(a => a[0] === "memberRemove").length === before
      && /Removal works only from now on: Ewa's desk keeps the editions already received and gets no new ones\./.test(text(dlg))
      && !/type="password"/.test(dlg) && /data-act="do-member-remove"/.test(dlg);
  });
  await leg("td4r the confirm sends the team and the member and nothing else, Cancel sends nothing, and a refusal or an"
    + " unconfirmed answer keeps the cover open", async () => {
    P.S.cover = null; P.S.teamWant = ""; P.S.memberGoing = ""; P.S.err = null;
    answer = facts();
    await P.desksLoad();
    const n = asked.filter(a => a[0] === "memberRemove").length;
    P.ACTS["member-remove"]({ getAttribute: () => EWA });
    P.ACTS["cover-close"]();
    await P.ACTS["do-member-remove"]();
    const afterCancel = asked.filter(a => a[0] === "memberRemove").length === n;
    P.ACTS["member-remove"]({ getAttribute: () => EWA });
    const back = facts();
    back.team = Object.assign({}, back.team, { epoch: 4, roster: back.team.roster.filter(r => r.id !== EWA) });
    back.removed = EWA;
    removeAnswer = back;
    await P.ACTS["do-member-remove"]();
    const sent = asked.filter(a => a[0] === "memberRemove").slice(-1)[0];
    const noKey = !!sent && sent.length === 5 && sent[1] === open.dir && sent[2] === NEW && sent[3] === EWA
      && sent[4] === true && !sent.some(x => x && typeof x === "object");
    P.ACTS["member-remove"]({ getAttribute: () => ANNA });
    removeAnswer = { removed: false, refused: "not confirmed",
      said: { frame: "Nobody was removed, as the removal was not confirmed.", vars: {} } };
    await P.ACTS["do-member-remove"]();
    const kept = P.S.cover === "team" && /Nobody was removed, as the removal was not confirmed\./.test(text(home.node("#dlg").innerHTML));
    removeAnswer = { error: "The signing key did not open on this computer, so nothing was written." };
    await P.ACTS["do-member-remove"]();
    const keptErr = P.S.cover === "team"
      && /The signing key did not open on this computer, so nothing was written\./.test(text(home.node("#dlg").innerHTML));
    P.S.cover = null; P.S.teamWant = ""; P.S.memberGoing = ""; P.S.err = null;
    return afterCancel && noKey && /Ewa's desk is no longer on the team\./.test(text(mainHtml())) && kept && keptErr;
  });
  await leg("td4s on a Polish desk the line before the confirm is Polish, and the English sentence is not on the cover", async () => {
    const pl = loadPage({ api, uiLang: "pl" }), Q = pl.page;
    Object.assign(Q.S, { open, screen: "projects", home: "team", teamDir: open.dir, desks: facts() });
    Q.ACTS["member-remove"]({ getAttribute: () => EWA });
    const t = text(pl.node("#dlg").innerHTML);
    return /Usunięcie działa tylko na przyszłość: Ewa's desk zachowuje otrzymane już wydania, ale nie dostanie żadnego nowego\./.test(t)
      && t.indexOf("Removal works only from now on") < 0;
  });
  /* td4t, td4u: the cover's sentence follows the team's mode (sense pass finding 4). A plain team writes its editions in
     the clear and removal reseals nothing (src/studio.mjs editionsToReseal), so the cover may not promise "no new ones"
     there: it says who can still read them and offers the existing seal switch, whose own cover then asks. */
  const PLAIN_EN = "This team publishes in the clear, so new editions stay readable to anyone who can read this folder, Ewa's desk"
    + " included. Removed, and with publishing sealed, Ewa's desk gets no new ones.";
  await leg("td4t on a plain team the removal cover says new editions stay readable to anyone who can read the folder, the"
    + " removed desk included, promises no forward cut, and offers Publish sealed, which opens the seal switch's own cover and"
    + " sends nothing; on a sealed team the cover keeps its forward-only sentence and offers no seal", async () => {
    P.S.cover = null; P.S.teamWant = ""; P.S.memberGoing = ""; P.S.err = null;
    answer = withTeam({ sealed: false });
    await P.desksLoad();
    const n = asked.filter(a => a[0] === "memberRemove" || a[0] === "teamSealed").length;
    P.ACTS["member-remove"]({ getAttribute: () => EWA });
    const plain = home.node("#dlg").innerHTML;
    P.ACTS["team-seal"]({ getAttribute: () => "sealed" });
    const sealCover = home.node("#dlg").innerHTML, wantNow = P.S.teamWant;
    const quiet = asked.filter(a => a[0] === "memberRemove" || a[0] === "teamSealed").length === n;
    P.S.cover = null; P.S.teamWant = ""; P.S.memberGoing = ""; P.S.err = null;
    answer = facts();
    await P.desksLoad();
    P.ACTS["member-remove"]({ getAttribute: () => EWA });
    const sealed = home.node("#dlg").innerHTML;
    P.S.cover = null; P.S.teamWant = ""; P.S.memberGoing = ""; P.S.err = null;
    const f = { says: text(plain).indexOf(PLAIN_EN) >= 0, noPromise: !/Removal works only from now on/.test(text(plain)),
      offer: /data-act="team-seal" data-v="sealed"/.test(plain) && /Publish sealed…/.test(text(plain)),
      remove: /data-act="do-member-remove"/.test(plain), opens: wantNow === "sealed" && /Seal what this folder is given/.test(text(sealCover)),
      quiet, sealedSays: /Removal works only from now on: Ewa's desk keeps the editions already received and gets no new ones\./.test(text(sealed)),
      sealedNoOffer: !/data-act="team-seal"/.test(sealed) && text(sealed).indexOf(PLAIN_EN) < 0 };
    const ok = Object.keys(f).every(k => f[k]);
    if (!ok) process.stderr.write("  td4t " + JSON.stringify(f) + "\n");
    return ok;
  });
  await leg("td4v on a plain team where the seal switch cannot work (the folder inside the project, no signing key, a team file"
    + " not this Studio's) the removal cover still says new editions stay readable and offers no Publish sealed", async () => {
    const seen = [withTeam({ sealed: false }, { inside: true }), withTeam({ sealed: false }, { signing: "" }),
      withTeam({ sealed: false }, { file: "theirs" })].map((d) => {
      P.S.cover = null; P.S.teamWant = ""; P.S.memberGoing = ""; P.S.err = null;
      P.S.desks = d;
      P.ACTS["member-remove"]({ getAttribute: () => EWA });
      return home.node("#dlg").innerHTML;
    });
    P.S.cover = null; P.S.teamWant = ""; P.S.memberGoing = ""; P.S.err = null;
    answer = facts();
    await P.desksLoad();
    const f = seen.map((h) => !/data-act="team-seal"/.test(h) && text(h).indexOf(PLAIN_EN) >= 0 && /data-act="do-member-remove"/.test(h));
    if (!f.every(Boolean)) process.stderr.write("  td4v " + JSON.stringify(f) + "\n");
    return f.every(Boolean);
  });
  await leg("td4u on a Polish desk the plain team's removal cover is Polish, offer included, and no English is left on it", async () => {
    const pl = loadPage({ api, uiLang: "pl" }), Q = pl.page;
    Object.assign(Q.S, { open, screen: "projects", home: "team", teamDir: open.dir, desks: withTeam({ sealed: false }) });
    Q.ACTS["member-remove"]({ getAttribute: () => EWA });
    const t = text(pl.node("#dlg").innerHTML);
    return t.indexOf("Ten zespół publikuje jawnie, więc nowe wydania odczyta każdy, kto ma dostęp do tego folderu, także Ewa's desk."
        + " Po usunięciu i przejściu na publikowanie zapieczętowane Ewa's desk nie odczyta już nowych wydań.") >= 0
      && /Publikuj zapieczętowane…/.test(t) && t.indexOf("publishes in the clear") < 0 && t.indexOf("Publish sealed") < 0
      && t.indexOf("Usunięcie działa tylko na przyszłość") < 0;
  });

  /* td4w: a visible button "Make a team" when there is no team (make-team-entry). */
  await leg("td4w on the Desks screen with no team, a visible button Make a team opens the team cover, and on a Polish desk"
    + " says Utwórz zespół; with a team the button is not shown; the relay is the cover's default (was: this project's real folder, until 2026-11-20)", async () => {
    P.S.cover = null; P.S.teamWant = ""; P.S.err = null;
    answer = facts({ file: "none", team: null });
    await P.desksLoad();
    const hNoTeam = mainHtml(), tNoTeam = text(hNoTeam);
    const hasBtn = /data-act="team-make"/.test(hNoTeam) && /Make a team/.test(tNoTeam)
      && /data-act="team-seal"/.test(hNoTeam);
    answer = facts();
    await P.desksLoad();
    const hTeam = mainHtml();
    const noBtnWithTeam = !/data-act="team-make"/.test(hTeam);
    const pl = loadPage({ api, uiLang: "pl" }), Q = pl.page;
    Object.assign(Q.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    answer = facts({ file: "none", team: null });
    await Q.desksLoad();
    const plHtml = pl.node("#main").innerHTML, plText = text(plHtml);
    const plOk = /data-act="team-make"/.test(plHtml) && /Utwórz zespół/.test(plText)
      && !/Make a team/.test(plText);
    P.S.cover = null; P.S.teamWant = ""; P.S.err = null;
    answer = facts({ file: "none", team: null });
    await P.desksLoad();
    P.ACTS["team-make"]();
    const coverOpened = P.S.cover === "team" && P.S.teamWhere === "relay";
    const dlg = home.node("#dlg").innerHTML;
    const dlgOk = /data-act="do-team-seal"/.test(dlg)
      && /Editions travel through the Etiuda relay sealed/.test(text(dlg))
      && !/Seal what this folder is given/.test(text(dlg))
      && /aria-checked="true" data-act="team-where" data-v="relay"/.test(dlg) && !/data-v="folder"/.test(dlg);
    P.S.cover = null; P.S.teamWant = ""; P.S.err = null;
    answer = facts();
    await P.desksLoad();
    return hasBtn && noBtnWithTeam && plOk && coverOpened && dlgOk;
  });

  /* td4x: a relay team says the key's backup brings the team's place back. A folder team keeps the older sentence.
     Main's td4w is a later leg (Make a team), so this check does not reuse that id. */
  await leg("td4x a relay team, with the key made here, says the key's backup copy brings the team's place on the relay"
    + " back and not its files, in English and in Polish; a team at a shared folder shows the one held line and neither sentence (was: it kept the older sentence)", async () => {
    const RELAY_EN = "The key's backup copy brings back the signing key and the team's place on the relay, but not the team's files kept there.";
    const RELAY_PL = "Kopia zapasowa klucza przywraca klucz podpisu i miejsce zespołu w przekaźniku, ale nie pliki zespołu, które tam są.";
    const OLD_EN = "The team comes back with the signing key's backup copy. There is nothing else to keep.";
    const seen = async (a) => { answer = a; await P.desksLoad(); return text(mainHtml()); };
    const hostWas = P.S.host;
    P.S.host = Object.assign({}, hostWas || {}, { signing: { keyId: lead.keyId, print: "8a3f91c02b7ed104", kept: "os", backup: null, admitted: 1, problem: null } });
    const relay = await seen(withTeam({ relay: true }));
    /* A team at a shared folder: the facts say it is not on the relay (relay: false), so the page holds it with the one line. */
    const folder = await seen(withTeam({ relay: false }));
    const pl = loadPage({ api, uiLang: "pl" }), Q = pl.page;
    Object.assign(Q.S, { open, screen: "projects", home: "team", teamDir: open.dir, host: P.S.host });
    answer = withTeam({ relay: true });
    await Q.desksLoad();
    const plRelay = text(pl.node("#main").innerHTML);
    answer = withTeam({ relay: false });
    await Q.desksLoad();
    const plFolder = text(pl.node("#main").innerHTML);
    P.S.host = hostWas;
    answer = facts();
    await P.desksLoad();
    const HELD_EN = "works through a shared folder, which Etiuda Studio no longer follows";
    const HELD_PL = "korzysta ze wspólnego folderu, którego Etiuda Studio już nie obsługuje";
    return relay.indexOf(RELAY_EN) >= 0 && relay.indexOf(OLD_EN) < 0
      && folder.split(HELD_EN).length === 2 && folder.indexOf(RELAY_EN) < 0 && folder.indexOf(OLD_EN) < 0
      && plRelay.indexOf(RELAY_PL) >= 0 && plRelay.indexOf(OLD_EN) < 0
      && plFolder.split(HELD_PL).length === 2 && plFolder.indexOf(RELAY_PL) < 0 && plFolder.indexOf("Zespół wróci razem z kopią zapasową klucza podpisu.") < 0;
  });

  /* 962t5a to 962t5d: A CATALOG CHOOSES ITS TEAM, THE COVER (board 962 stage 5, T5). The cover where a team is first made offers a
     third place, a team this Studio leads, listing only the sealed teams the reader marks as led by this Studio's key, each named
     by its catalogs, its connection and its count; a catalog with a team is never offered it. The chosen team's teammates below
     2.0.0 are named and the admitted ones that never reported are counted, and the press still goes, as the lead's confirm. A
     refusal stays on the cover in its sentence. The teams are the reader's (studio:teams), handed to the page here as data. */
  const t5Mate = (id, name, version, admitted) => ({ id, name, kind: "desk", admitted: admitted !== false, version, catalog: null });
  /* On the relay (was: connection "folder", a shared folder; the shared-folder team is removed and a held one is never offered). */
  const T5_FOLDER = { id: "t-00000000000000a1", connection: "relay", relay: { rt: "q", url: "https://etiuda.dev" }, sealed: true, led: true, catalogs: ["c-a", "c-b"],
    projects: [{ id: "c-a", name: "Harbour Lights", dir: "C:\\lib\\a", rev: 3 }, { id: "c-b", name: "North Quay", dir: "C:\\lib\\b", rev: 1 }],
    project: { id: "c-a", name: "Harbour Lights", dir: "C:\\lib\\a", rev: 3 },
    teammates: [t5Mate("k-1", "Ewa", "1.16.7"), t5Mate("k-2", "Jan", "2.0.0-dev"), t5Mate("k-3", "Ola", ""), t5Mate("k-4", "Piotr", "", false)], count: 4 };
  const T5_RELAY = { id: "t-00000000000000d4", connection: "relay", relay: { rt: "r", url: "https://etiuda.dev" }, sealed: true, led: true,
    catalogs: ["c-d"], projects: [{ id: "c-d", name: "Lantern Book", dir: "C:\\lib\\d", rev: 2 }], project: { id: "c-d", name: "Lantern Book", dir: "C:\\lib\\d", rev: 2 },
    teammates: [t5Mate("k-5", "Iga", "2.0.0")], count: 1 };
  const T5_PLAIN = { id: "t-00000000000000b2", connection: "folder", folder: "C:\\plain", sealed: false, led: true, catalogs: ["c-p"],
    projects: [{ id: "c-p", name: "Plain Ledger", dir: "C:\\lib\\p", rev: 1 }], project: null, teammates: [], count: 0 };
  const T5_THEIRS = { id: "t-00000000000000c3", connection: "folder", folder: "C:\\theirs", sealed: true, led: false, catalogs: ["c-t"],
    projects: [{ id: "c-t", name: "Borrowed Atlas", dir: "C:\\lib\\t", rev: 1 }], project: null, teammates: [], count: 0 };
  const T5_ALL = [T5_FOLDER, T5_PLAIN, T5_THEIRS, T5_RELAY];
  const chooseAsked = () => asked.filter((a) => a[0] === "teamChoose");
  let chooseAnswer = { error: null, folder: "C:\\quay", team: { id: T5_FOLDER.id }, carried: true, relay: false };
  api.teamChoose = async (...a) => { asked.push(["teamChoose", ...a]); return JSON.parse(JSON.stringify(chooseAnswer)); };
  /* The first-team cover, as Make a team opens it, with `teams` as the reader gave them; `page` is the stand-in to paint on. */
  const t5Open = async (pg, teams, desksAnswer) => {
    const Q = pg.page;
    Q.S.cover = null; Q.S.teamWant = ""; Q.S.err = null; Q.S.teamChosen = "";
    Q.S.teamPickDir = open.dir;
    answer = desksAnswer || facts({ file: "none", team: null });
    await Q.desksLoad();
    Q.S.teams = JSON.parse(JSON.stringify(teams));
    Q.ACTS["team-make"]();
    return pg.node("#dlg").innerHTML;
  };
  const t5Close = async () => { P.S.cover = null; P.S.teamWant = ""; P.S.err = null; P.S.teamChosen = ""; P.S.teamPickDir = ""; P.S.teams = []; answer = facts(); await P.desksLoad(); };
  /* What 962t5a reads, from a page: the third choice offered, and what choosing it lists. */
  const t5Listed = async (pg) => {
    const Q = pg.page;
    const offered = await t5Open(pg, T5_ALL);
    Q.ACTS["team-where"]({ getAttribute: () => "team" });
    const dlg = pg.node("#dlg").innerHTML, t = text(dlg);
    const picks = (dlg.match(/data-act="team-pick" data-v="(t-[0-9a-f]+)"/g) || []).map((m) => m.replace(/.*data-v="|"$/g, ""));
    return { offered, dlg, t, picks };
  };
  await leg("962t5a the first team's cover offers a third place, a team this Studio leads, listing only the sealed teams this"
    + " Studio leads, each by its catalogs' names, its connection and its count; absent for a catalog with a team and where no such"
    + " team is kept; the press sends the project and the chosen team", async () => {
    const L = await t5Listed(home);
    const third = /data-act="team-where" data-v="team"/.test(L.offered) && /data-act="team-where" data-v="relay"/.test(L.offered)
      && !/data-act="team-where" data-v="folder"/.test(L.offered);
    const only = L.picks.length === 2 && L.picks.indexOf(T5_FOLDER.id) >= 0 && L.picks.indexOf(T5_RELAY.id) >= 0;
    const named = /Harbour Lights/.test(L.t) && /North Quay/.test(L.t) && /4 teammates/.test(L.t) && !/a shared folder/.test(L.t)
      && /Lantern Book/.test(L.t) && (L.t.match(/the Etiuda relay/g) || []).length >= 2 && /1 teammate\b/.test(L.t)
      && !/Plain Ledger|Borrowed Atlas/.test(L.t);
    P.ACTS["team-pick"]({ getAttribute: () => T5_RELAY.id });
    const before = chooseAsked().length;
    await P.ACTS["do-team-choose"]();
    const sent = chooseAsked().slice(before);
    const pressed = sent.length === 1 && sent[0][1] === open.dir && sent[0][2] === T5_RELAY.id && P.S.cover === null;
    /* Absent: a catalog with a team (Sealed's own cover and Plain's), and a library whose only teams are Plain or another key's. */
    answer = facts();
    await P.desksLoad();
    P.S.teams = JSON.parse(JSON.stringify(T5_ALL));
    Object.assign(P.S, { cover: "team", teamWant: "plain", err: null });
    const withTeamPlain = String(P.teamCoverHtml());
    Object.assign(P.S, { teamWant: "sealed" });
    const withTeamSealed = String(P.teamCoverHtml());
    const noneKept = await t5Open(home, [T5_PLAIN, T5_THEIRS]);
    const absent = !/data-v="team"|team-pick/.test(withTeamPlain) && !/data-v="team"|team-pick/.test(withTeamSealed)
      && !/data-v="team"/.test(noneKept) && /data-act="team-where" data-v="relay"/.test(noneKept) && !/data-v="folder"/.test(noneKept);
    await t5Close();
    const f = { third, only, named, pressed, absent };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("  962t5a " + JSON.stringify(Object.assign(f, { picks: L.picks, sent, text: String(L.t).slice(0, 600) })) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });
  await leg("962t5b the chosen team's teammates below 2.0.0 are named with their version and the admitted ones that never reported"
    + " are counted, the press reading as a confirm and never refused; a team all on 2.0.0 says neither", async () => {
    await t5Open(home, T5_ALL);
    P.ACTS["team-where"]({ getAttribute: () => "team" });
    P.ACTS["team-pick"]({ getAttribute: () => T5_FOLDER.id });
    const old = home.node("#dlg").innerHTML, to = text(old);
    P.ACTS["team-pick"]({ getAttribute: () => T5_RELAY.id });
    const fine = home.node("#dlg").innerHTML, tf = text(fine);
    await t5Close();
    const f = { names: /Ewa \(1\.16\.7\)/.test(to) && !/Jan \(/.test(to) && !/Piotr/.test(to),
      counts: /1 teammate has not reported its version yet/.test(to),
      confirm: /data-act="do-team-choose"[^>]*>[^<]*Add it all the same/.test(old) && !/data-act="do-team-choose"[^>]*disabled/.test(old),
      quiet: !/older than 2\.0\.0|not reported/.test(tf) && /data-act="do-team-choose"[^>]*>[^<]*Add to this team/.test(fine) };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("  962t5b " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });
  await leg("962t5c a refused press keeps the cover open with the refusal's own sentence, and changes nothing on the page", async () => {
    const SAID = "This Studio does not lead that team as a sealed one, so the catalog did not join it. Nothing was changed.";
    await t5Open(home, T5_ALL);
    P.ACTS["team-where"]({ getAttribute: () => "team" });
    P.ACTS["team-pick"]({ getAttribute: () => T5_FOLDER.id });
    chooseAnswer = { error: SAID };
    await P.ACTS["do-team-choose"]();
    const dlg = home.node("#dlg").innerHTML;
    const ok = P.S.cover === "team" && text(dlg).indexOf(SAID) >= 0 && /data-act="do-team-choose"/.test(dlg);
    chooseAnswer = { error: null, folder: "C:\\quay", team: { id: T5_FOLDER.id }, carried: true, relay: false };
    await t5Close();
    return ok;
  });
  /* 962t5d: each guard proved by its removal, in process: the page read from a copy of ui/app.js with that one line lifted, and the
     clause of 962t5a or 962t5b it guards turning red. */
  if (PLANTS_OFF) skip("962t5d the third choice's filter and the cover's two version counts lifted, each turns its clause red (ETIUDA_PLANTS=off)");
  else await leg("962t5d CONTROL: plant:t5-only-led lifted lists the Plain team and another key's (962t5a red); plant:t5-below lifted"
    + " names no older desk and plant:t5-unreported lifted counts no unreported one (962t5b red)", async () => {
    const liftedPage = (mark, line) => {
      const src = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8").split(NL);
      const at = src.map((l, i) => (l.indexOf("/* plant:" + mark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
      if (at.length !== 1) return null;
      src[at[0]] = line + " /* plant:" + mark + " */";
      const pg = loadPage({ api, uiLang: "en", source: src.join(NL) });
      Object.assign(pg.page.S, { open: JSON.parse(JSON.stringify(open)), screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
      return pg;
    };
    const oldCover = async (pg) => {
      await t5Open(pg, T5_ALL);
      pg.page.ACTS["team-where"]({ getAttribute: () => "team" });
      pg.page.ACTS["team-pick"]({ getAttribute: () => T5_FOLDER.id });
      return text(pg.node("#dlg").innerHTML);
    };
    const a = liftedPage("t5-only-led", "  const chooseTeams = () => (S.teams || []).filter((t) => t && !t.unreadable);");
    const b = liftedPage("t5-below", "    const below = [];");
    const c = liftedPage("t5-unreported", "    const unreported = 0;");
    if (!a || !b || !c) return false;
    const L = await t5Listed(a);
    const listsAll = L.picks.length === 4 && L.picks.indexOf(T5_PLAIN.id) >= 0 && L.picks.indexOf(T5_THEIRS.id) >= 0;
    const noOld = !/Ewa \(1\.16\.7\)/.test(await oldCover(b));
    const noCount = !/has not reported its version yet/.test(await oldCover(c));
    answer = facts();
    const f = { listsAll, noOld, noCount };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("  962t5d " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });
  /* 962t5e, 962t5f: a team of two catalogs on the catalog's own screens. A teammate on the team's other catalog is that catalog,
     said by its name and rev and not as "another catalog"; the Writes to row of Catalog details names the other catalog and offers
     no move, which T1 refuses for a team of more than one; a team of one catalog keeps its move. */
  await leg("962t5e the Desks screen says a teammate on the team's other catalog uses another catalog of this team by its name and rev, never"
    + " another catalog, with no import; a catalog the team does not list keeps its words", async () => {
    answer = facts({ uses: [{ id: "k-e5c80a17b2e4d856", kind: "team", n: "2", rev: 2, title: "North Quay", importable: false },
      { id: "k-7d0355e1c95b7f13", kind: "other", title: "Borrowed Atlas", importable: true }] });
    await P.desksLoad();
    const t = text(mainHtml()), h = mainHtml();
    answer = facts();
    await P.desksLoad();
    const f = { team: /another catalog of this team: North Quay, rev 2/.test(t) && !/another catalog: North Quay/.test(t),
      other: /another catalog: Borrowed Atlas/.test(t), oneImport: (h.match(/data-act="catalog-import"/g) || []).length === 1 };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("  962t5e " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });

  await leg("962s6u3d on the catalog's screens: Catalog details Team row shows Moving to {TEAM} with its two presses and"
    + " Part way off {TEAM} with Finish taking off; a refusal shows its sentence; the Desks screen's library kind shows"
    + " {CATALOG}, on {TEAM} and {CATALOG}, on no team; in both languages", async () => {
    P.setLang = (l) => { home.sandbox.STUDIO_T.force(l); P.S.uiLang = l; P.S.lang = l; };
    const was = { teams: P.S.teams, project: P.S.open.project, section: P.S.section, lang: P.S.lang, name: P.S.open.name };
    const TID1 = "t-00000000000000a1", TID2 = "t-00000000000000a2";
    const team1 = { id: TID1, connection: "folder", folder: "C:\\quay", sealed: true, led: true,
      leadPrint: "aaaa111122223333", catalogs: [catId], projects: [{ id: catId, name: "Harbour Lights", dir: open.dir, rev: 3 }],
      teammates: [], count: 0 };
    const team2 = { id: TID2, connection: "relay", folder: "", relay: { rt: "rt-2", url: "etiuda.dev" }, sealed: true, led: true,
      leadPrint: "bbbb111122223333", catalogs: ["c-other"], projects: [{ id: "c-other", name: "Lantern Book", dir: "C:\\lib\\b", rev: 1 }],
      teammates: [], count: 0 };

    P.S.teams = [team1, team2];
    P.S.open.name = "Harbour Lights";
    P.S.open.project = Object.assign({}, P.S.open.project, { name: "Harbour Lights", sealedTeam: TID1 });

    // 1. Moving state
    P.S.open.project.moving = { from: TID1, to: TID2 };
    P.paintProjectSettings();
    const movHtmlEn = mainHtml();
    const movRowEn = /Moving to Lantern Book/.test(movHtmlEn)
      && /data-act="team-move-finish"/.test(movHtmlEn) && /Finish the move/.test(movHtmlEn)
      && /data-act="team-move-back"/.test(movHtmlEn) && /Put it back on Harbour Lights/.test(movHtmlEn);

    // Press Finish the move
    const beforeMove = asked.filter((a) => a[0] === "teamMoveCatalog").length;
    await P.ACTS["team-move-finish"]();
    const sentFinish = asked.filter((a) => a[0] === "teamMoveCatalog").slice(beforeMove);
    const finishOk = sentFinish.length === 1 && sentFinish[0][1] === open.dir && sentFinish[0][2] === TID2;

    // Press Put it back on {TEAM}
    await P.ACTS["team-move-back"]();
    const sentBack = asked.filter((a) => a[0] === "teamMoveCatalog").slice(beforeMove + 1);
    const backOk = sentBack.length === 1 && sentBack[0][1] === open.dir && sentBack[0][2] === TID1;

    // Refusal shows its sentence
    const REF_MOVE = "The catalog is off its old team, and that team's place has not yet taken the change, so for now it is on no team. Finish the move completes it.";
    moveAnswer = { error: REF_MOVE };
    await P.ACTS["team-move-finish"]();
    const movRefOk = text(mainHtml()).indexOf(REF_MOVE) >= 0;
    moveAnswer = { error: null };

    // Moving state in Polish
    P.setLang("pl");
    P.paintProjectSettings();
    const movHtmlPl = mainHtml();
    const movRowPl = /W trakcie przenoszenia do zespołu Lantern Book/.test(movHtmlPl)
      && /Dokończ przenoszenie/.test(movHtmlPl)
      && /Przywróć do zespołu Harbour Lights/.test(movHtmlPl);
    P.setLang("en");

    // 2. Part way off state
    // Project names team1, but team1 no longer lists catId
    const team1NoCat = Object.assign({}, team1, { catalogs: [], projects: [] });
    P.S.teams = [team1NoCat, team2];
    delete P.S.open.project.moving;
    P.S.open.project.sealedTeam = TID1;
    P.paintProjectSettings();
    const partHtmlEn = mainHtml();
    const partRowEn = /Part way off Harbour Lights/.test(partHtmlEn)
      && /data-act="team-leave-finish"/.test(partHtmlEn) && /Finish taking off/.test(partHtmlEn);

    const beforeLeave = asked.filter((a) => a[0] === "teamLeave").length;
    await P.ACTS["team-leave-finish"]();
    const sentLeave = asked.filter((a) => a[0] === "teamLeave").slice(beforeLeave);
    const leaveOk = sentLeave.length === 1 && sentLeave[0][1] === open.dir;

    // Part way off in Polish
    P.setLang("pl");
    P.paintProjectSettings();
    const partHtmlPl = mainHtml();
    const partRowPl = /W trakcie odłączania od zespołu Harbour Lights/.test(partHtmlPl)
      && /Dokończ odłączanie/.test(partHtmlPl);
    P.setLang("en");

    // 3. Normal on team: has Take off and Move
    P.S.teams = [team1, team2];
    P.S.open.project.sealedTeam = TID1;
    P.paintProjectSettings();
    const normHtmlEn = mainHtml();
    const normEn = /Take off this team/.test(normHtmlEn) && /Move to another team…/.test(normHtmlEn);
    P.setLang("pl");
    P.paintProjectSettings();
    const normHtmlPl = mainHtml();
    const normPl = /Odłącz od tego zespołu/.test(normHtmlPl) && /Przenieś do innego zespołu…/.test(normHtmlPl);
    P.setLang("en");

    // 4. Desks screen: library kind saying
    const uOnTeam = { id: "k-e5c80a17b2e4d856", name: "Ewa's desk", kind: "library", title: "North Quay" };
    answer = facts({ uses: [uOnTeam] });
    // Catalog is on team2 (Lantern Book)
    const team2WithNorth = Object.assign({}, team2, {
      catalogs: ["c-other", "c-north"],
      projects: [{ id: "c-other", name: "Lantern Book", dir: "C:\\lib\\b", rev: 1 }, { id: "c-north", name: "North Quay", dir: "C:\\lib\\nq", rev: 2 }]
    });
    P.S.teams = [team1, team2WithNorth];
    await P.desksLoad();
    P.paintDesks();
    const libTeamEn = text(mainHtml()).indexOf("North Quay, on Lantern Book") >= 0;

    P.setLang("pl");
    P.paintDesks();
    const libTeamPl = text(mainHtml()).indexOf("North Quay, w zespole Lantern Book") >= 0;
    P.setLang("en");

    // Catalog on no team
    P.S.teams = [team1, team2]; // team2 does not have North Quay
    await P.desksLoad();
    P.paintDesks();
    const libNoTeamEn = text(mainHtml()).indexOf("North Quay, on no team") >= 0;

    P.setLang("pl");
    P.paintDesks();
    const libNoTeamPl = text(mainHtml()).indexOf("North Quay, poza zespołami") >= 0;
    P.setLang("en");

    P.S.teams = was.teams; P.S.open.project = was.project; P.S.open.name = was.name; P.S.section = was.section;
    answer = facts();
    await P.desksLoad();

    const f = {
      movRowEn, finishOk, backOk, movRefOk, movRowPl,
      partRowEn, leaveOk, partRowPl, normEn, normPl,
      libTeamEn, libTeamPl, libNoTeamEn, libNoTeamPl
    };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("  962s6u3d " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });

  /* ---- 5. Before the first update (2026-11-01) ------------------------------------------------------------------- */
  const { createRequire } = await import("node:module");
  const req = createRequire(import.meta.url);
  const U5 = path.join(SCRATCH, "u5");
  fs.mkdirSync(U5, { recursive: true });
  const fresh = (name) => { const d = path.join(U5, name + "-" + crypto.randomBytes(3).toString("hex")); fs.mkdirSync(d, { recursive: true }); return d; };
  const NEWER = { format: 2, writtenBy: "2.3.0" };

  /* u2a: teams.json a newer Studio wrote. Every write is refused naming the version, the file stays byte for byte, and no key
     is read out of it for a publish: no older copy stands in for it. */
  const u2a = async (Km) => {
    const at5 = path.join(fresh("u2a"), "teams.json");
    const t5 = "t-" + crypto.randomBytes(8).toString("hex");
    const text5 = JSON.stringify(Object.assign({ kind: "etiuda-studio-teams", teams: { [t5]: { keys: {}, sealed: true } } }, NEWER), null, 1) + "\n";
    fs.writeFileSync(at5, text5);
    const said1 = await throwsOn(() => Km.keepTeamKey(at5, vault, t5, 1, key1));
    const said2 = await throwsOn(() => Km.chooseSealed(at5, t5, false, ud));
    const newer = typeof Km.teamsNewer === "function" ? Km.teamsNewer(at5) : null;
    return /written by Etiuda Studio 2\.3\.0 or newer/.test(said1) && /2\.3\.0 or newer/.test(said2)
      && fs.readFileSync(at5, "utf8") === text5 && JSON.stringify(Km.teamKeysOf(at5, vault)) === "{}" && Km.unsealedOf(at5).length === 0
      && !!newer && newer.format === 2 && newer.version === "2.3.0";
  };
  await leg("u2a a teams.json written by a newer Studio (format 2, writtenBy 2.3.0) is refused for every write naming Etiuda Studio"
    + " 2.3.0, left byte for byte, and read for a publish as holding no key (red where it is written over or read as this format)",
    async () => u2a(K));

  /* u2b: studio.json the same way, through src/saved-format.cjs: a newer store reads as nothing and is never written over; a
     store of this format, or one an older Studio wrote with no format, reads whole and is written back stamped. */
  const u2b = async (Sv) => {
    const d5 = fresh("u2b"), at5 = path.join(d5, "studio.json");
    const text5 = JSON.stringify(Object.assign({ root: "C:\\elsewhere", theme: "dark", trialFrom: "2030-01-01" }, NEWER), null, 1) + "\n";
    fs.writeFileSync(at5, text5);
    const read5 = Sv.readSaved(at5);
    const wrote5 = Sv.writeSaved(at5, { theme: "light" }, (f, t) => fs.writeFileSync(f, t), "0.1.0");
    const old5 = path.join(d5, "older.json");
    fs.writeFileSync(old5, JSON.stringify({ root: "C:\\projects", theme: "dark" }, null, 1) + "\n");
    const readOld = Sv.readSaved(old5);
    const wroteOld = Sv.writeSaved(old5, Object.assign({}, readOld.doc, { lang: "pl" }), (f, t) => fs.writeFileSync(f, t), "0.1.0");
    const back = JSON.parse(fs.readFileSync(old5, "utf8"));
    return JSON.stringify(read5.doc) === "{}" && read5.newer && read5.newer.format === 2 && read5.newer.version === "2.3.0"
      && wrote5 === false && fs.readFileSync(at5, "utf8") === text5
      && readOld.newer === null && readOld.doc.root === "C:\\projects" && wroteOld === true
      && back.format === 1 && back.writtenBy === "0.1.0" && back.lang === "pl" && back.root === "C:\\projects";
  };
  await leg("u2b a studio.json written by a newer Studio reads as nothing, names 2.3.0, and a write leaves it byte for byte; one with"
    + " no format reads whole and is written back stamped format 1 and this Studio's version (red where the newer store is read"
    + " or written over)", async () => u2b(req("../src/saved-format.cjs")));

  await leg("u2c the shell reads and writes its store only through src/saved-format.cjs, a teams.json write is stamped format 1 and"
    + " this Studio's version, and the host tells the page at boot", async () => {
    const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
    const kept = readJson(at);
    return /function readStore\(\) \{\s*return Saved\.readSaved\(storeAt\(\)\)\.doc;\s*\}/.test(main)
      && /return Saved\.writeSaved\(storeAt\(\), next, writeWhole,/.test(main) && /savedNewer: await savedNewerNow\(\),/.test(main)
      && kept.format === 1 && kept.writtenBy === pkg;
  });

  /* u2d: the page at boot, in the copywriter's words, with the version and without it, and in Polish. */
  const u2d = async (src) => {
    const coverOf = (lang, newer) => {
      const h = loadPage({ api: {}, uiLang: lang, source: src }), Q = h.page;
      Q.S.host = { savedNewer: newer };
      Q.S.cover = null;
      Q.savedNewerAsk(Q.S.host);
      if (Q.S.cover !== "saved-newer") return "";
      Q.paintCoverOnly();
      return text(h.node("#dlg").innerHTML);
    };
    const en = coverOf("en", { format: 2, version: "2.3.0" }), bare = coverOf("en", { format: 2, version: "" });
    const pl = coverOf("pl", { format: 2, version: "2.3.0" }), none = loadPage({ api: {}, uiLang: "en", source: src }).page;
    none.S.cover = null;
    none.savedNewerAsk({ savedNewer: null });
    return en.indexOf("This Studio's saved data were written by Etiuda Studio 2.3.0 or newer, so this version leaves them untouched."
        + " Installing Etiuda Studio 2.3.0 or newer opens them as they were.") >= 0
      && bare.indexOf("written by a newer Etiuda Studio") >= 0 && bare.indexOf("2.3.0") < 0
      && pl.indexOf("Dane tego Studia zapisało Etiuda Studio w wersji 2.3.0 lub nowszej") >= 0 && none.S.cover === null;
  };
  await leg("u2d at boot the page says it in the copywriter's words, naming 2.3.0, without a number where the file names none, and"
    + " in Polish; with nothing newer no cover opens (red where the page says nothing)", async () => u2d(source));

  await leg("u2e with a studio.json a newer Studio wrote, every act that makes or replaces an identity is refused in the saved-data"
    + " sentence naming 2.3.0, the key folder and the teams file stay byte for byte, and a publish's plan makes no key (red where"
    + " any act runs)", async () => heldAll("store"));
  await leg("u2f the same with a teams.json a newer Studio wrote", async () => heldAll("teams"));
  await leg("u2g THE CONTROL: with no newer file, a publish's plan says the key will be made and Make a signing key makes it",
    u2gCheck);

  /* u2h: while they stand, the page offers no act that makes or replaces an identity (the test architect's E1, 2026-11-01):
     Settings' key row (on the Settings tab since board 965), the Desks screen in each state that offers one, the team's covers, the key's restore and the Licence
     cover, painted with and without a newer file. The control must show every act, so the nought is a reading; and a press that
     reaches one anyway asks the shell for nothing and is answered in the sentence. */
  const HELD_ACTS = ["key-make", "key-aside", "key-restore", "do-key-restore", "team-make", "team-fresh", "team-handover",
    "do-team-handover", "team-seal", "do-team-seal"];
  const LINE = "This Studio's saved data were written by Etiuda Studio 2.3.0 or newer, so this version leaves them untouched."
    + " Installing Etiuda Studio 2.3.0 or newer opens them as they were.";
  const u2h = async (src) => {
    const RELAY = "C:\\Users\\lead\\AppData\\Roaming\\Etiuda Studio\\relay\\" + "a".repeat(32);
    const desksStates = [
      facts({ signing: null, lead: "0123456789abcdef", team: null, file: "theirs" }),
      facts({ file: "theirs", lead: "0123456789abcdef", canHandover: true, team: null }),
      facts({ file: "none", team: null }),
      facts({ folder: RELAY }),
      facts(),
    ];
    const OS_KEY = { keyId: lead.keyId, print: "0123456789abcdef", kept: "os", backup: null };
    const paintAll = async (newer) => {
      const views = [], acts = [];
      let shellAsked = 0, di = 0;
      const api5 = { desks: async () => JSON.parse(JSON.stringify(desksStates[Math.min(di, desksStates.length - 1)])),
        keyMake: async () => { shellAsked++; return {}; } };
      const h = loadPage({ api: api5, uiLang: "en", source: src }), Q = h.page;
      const host = (signing) => { Q.S.host = { savedNewer: newer, signing, theme: "system" }; };
      for (let i = 0; i < desksStates.length; i++) {
        di = i;
        host({ keyId: "" });
        Object.assign(Q.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en", cover: null });
        await Q.desksLoad();
        views.push(h.node("#main").innerHTML);
      }
      const cover = (name, set) => { Object.assign(Q.S, { cover: name, err: null }, set || {}); Q.paintCoverOnly(); views.push(h.node("#dlg").innerHTML); };
      /* Settings' key row, on the Settings tab's Teams and keys page since board 965 (S1) */
      const settingsTab = () => { Object.assign(Q.S, { screen: "settings", cover: null, err: null }); if (Q.S.sx) Q.S.sx.sec = "teams"; Q.paintMain(); views.push(h.node("#main").innerHTML); };
      for (const sign of [{ keyId: "" }, OS_KEY, Object.assign({}, OS_KEY, { kept: "passphrase" })]) { host(sign); settingsTab(); }
      host(OS_KEY);
      Q.S.desks = JSON.parse(JSON.stringify(facts({ file: "none", team: null })));
      cover("team", { teamWant: "sealed", teamWhere: "folder" });
      Q.S.desks = JSON.parse(JSON.stringify(facts()));
      cover("team", { teamWant: "handover" });
      cover("key", { keyWant: "restore", keyCopy: { file: "C:\\copy.json", print: "0123456789abcdef" }, keyBoxless: false });
      /* The Licence cover's way to a seat, the door's Sign in, stands only where no newer file does. */
      cover("licence", { lic: { licence: { status: "none" }, signIn: ["microsoft"], signinMoved: true } });
      cover(null);
      /* The Sealed and Plain switch is held only where no team stands: the first three Desks views. */
      views.forEach((v, i) => (String(v).match(/data-act="[\w-]+"/g) || []).map((m) => m.slice(10, -1))
        .forEach((a) => { if (a !== "team-seal" || i < 3) acts.push(a); }));
      Q.S.cover = null;
      Q.run({ getAttribute: (k) => (k === "data-act" ? "key-make" : null) });
      await new Promise((r) => setTimeout(r, 0));
      return { views, acts, shellAsked, said: h.node("#said").textContent, fields: views.join("").indexOf("data-lic-signin") >= 0 };
    };
    const off = await paintAll(null), on = await paintAll({ format: 2, version: "2.3.0", said: {} });
    const missing = HELD_ACTS.filter((a) => off.acts.indexOf(a) < 0), shown = HELD_ACTS.filter((a) => on.acts.indexOf(a) >= 0);
    const lined = on.views.filter((v, i) => HELD_ACTS.some((a) => (a !== "team-seal" || i < 3) && (off.views[i] || "").indexOf('data-act="' + a + '"') >= 0)
      && text(v).indexOf(LINE) < 0).length;
    process.stdout.write("       held acts the control did not show: " + JSON.stringify(missing) + "; shown under a newer file: "
      + JSON.stringify(shown) + "; views without the line: " + lined + "; the press asked the shell " + on.shellAsked + " time(s)\n");
    return missing.length === 0 && shown.length === 0 && lined === 0 && off.fields && !on.fields
      && on.acts.indexOf("key-backup") >= 0 && on.shellAsked === 0 && on.said === LINE && off.shellAsked === 1;
  };
  await leg("u2h while saved data a newer Studio wrote stand, no screen or cover offers an act that makes or replaces an identity,"
    + " each is said as the copywriter's sentence where it stood, the backup copy stays, and a press reaching one asks the shell"
    + " for nothing (red where any is offered)", async () => u2h(source));

  /* p5a: each member's Etiuda version, from its own signed statistics answer through the Desks screen's read. */
  const PK8 = Buffer.from("302e020100300506032b657004220420", "hex");
  const pairOf5 = (fill) => {
    const priv = crypto.createPrivateKey({ key: Buffer.concat([PK8, Buffer.alloc(32, fill)]), format: "der", type: "pkcs8" });
    const k = crypto.createPublicKey(priv).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    return { id: "k-" + crypto.createHash("sha256").update(Buffer.from(k, "hex")).digest("hex").slice(0, 16), key: k, priv };
  };
  const [DA, DB, DC, DD] = [pairOf5(0x51), pairOf5(0x52), pairOf5(0x53), pairOf5(0x54)];
  const p5 = fresh("p5"), p5share = path.join(p5, "share");
  fs.mkdirSync(p5share, { recursive: true });
  const p5dir = (await S.newProject(path.join(p5, "projects"), "Versions", [{ code: "en", name: "English" }])).dir;
  await S.setPublishFolder(p5dir, p5share);
  const p5key = path.join(p5, "lead-key.json");
  fs.writeFileSync(p5key, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const p5lead = readJson(p5key);
  let p5team = T.newTeam({ catalogs: [readJson(path.join(p5dir, "draft.json")).id], lead: { keyId: p5lead.keyId, public: p5lead.public } });
  for (const [d5, n5] of [[DA, "Up to date"], [DB, "Forged"], [DC, "Older"], [DD, "Silent"]])
    p5team = T.withDesk(p5team, { id: d5.id, key: d5.key, box: crypto.randomBytes(32).toString("hex") }, n5);
  const p5wrote = (await T.writeTeam(p5share, p5team, { key: p5key, passphrase: PASS })).team;
  const StatsE = (await import("../src/engine.mjs")).statsRules();
  const answer5 = (desk, engine, by) => {
    const body = { format: 1, kind: "etiuda-statistics", desk: desk.id, engine, period: { from: "2026-10-01", to: "2026-10-31" },
      sync: "2026-10-31 09:00", cards: [], intents: [], misses: 0, langs: {}, sig: { alg: "Ed25519", keyId: desk.id } };
    body.sig.value = crypto.sign(null, StatsE.statsAnswerSignedBytes(body), (by || desk).priv).toString("hex");
    const env = StatsE.sealStatsLead(p5wrote.lead.box, p5wrote.id, p5wrote.lead.keyId, desk.id, JSON.stringify(body));
    fs.mkdirSync(path.join(p5share, "desks", desk.id), { recursive: true });
    fs.writeFileSync(path.join(p5share, "desks", desk.id, "stats.estat"), JSON.stringify(env, null, 1) + "\n");
  };
  answer5(DA, "2.0.0");
  answer5(DB, "2.0.0", DA);
  answer5(DC, "1.9.0");
  const p5a = async (Sm) => {
    const f = await Sm.desksFor(p5dir, p5key, { passphrase: PASS });
    const by = {};
    ((f.team && f.team.roster) || []).forEach((r) => { by[r.name] = r; });
    const shut = await Sm.desksFor(p5dir, p5key, {});
    process.stdout.write("       versions " + JSON.stringify(Object.keys(by).map((k) => [k, by[k].version, by[k].below])) + "\n");
    return f.minEngine === "2.0.0" && by["Up to date"] && by["Up to date"].version === "2.0.0" && by["Up to date"].below === false
      && by.Forged && by.Forged.version === "" && by.Older && by.Older.version === "1.9.0" && by.Older.below === true
      && by.Silent && by.Silent.version === "" && by.Silent.below === false
      && ((shut.team && shut.team.roster) || []).every((r) => r.version === "");
  };
  await leg("p5a the Desks screen's read gives each member the Etiuda version its own signed statistics answer reports, none for an"
    + " answer another desk's key signed or no answer, marks a desk below the next edition's minEngine, and reads nothing without"
    + " the lead's secret (red where a version is not read, or is taken from an answer the desk did not sign)", async () => p5a(S));

  const p5b = async (src) => {
    const roster5 = [{ id: DA.id, name: "Up to date", own: "", key: DA.id.slice(2), admitted: true, version: "2.0.0", below: false },
      { id: DD.id, name: "Silent", own: "", key: DD.id.slice(2), admitted: true, version: "", below: false }];
    const paint5 = async (lang) => {
      const h = loadPage({ api: { desks: async () => JSON.parse(JSON.stringify(facts({ team: Object.assign({}, facts().team, { roster: roster5 }) }))) },
        uiLang: lang, source: src }), Q = h.page;
      Object.assign(Q.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang });
      await Q.desksLoad();
      return h.node("#main").innerHTML;
    };
    const en = await paint5("en"), pl = await paint5("pl");
    return /<th>Etiuda version<\/th>/.test(en) && /<span class="mono">2\.0\.0<\/span>/.test(en) && text(en).indexOf("not reported yet") >= 0
      && /<th>Wersja Etiudy<\/th>/.test(pl) && text(pl).indexOf("jeszcze nie podana") >= 0;
  };
  await leg("p5b the Desks table has a column for each member's Etiuda version, the version where the desk reported one and"
    + " not reported yet where it has not, in English and in Polish (red where the column is not there)", async () => p5b(source));

  /* u2p and p5p: each guard removed in a scratch copy of the tree, the leg it holds run against the copy and red, the copy's
     sha256 put back, and this checkout unchanged. */
  const GUARDS = [
    ["u2p", "src/saved-format.cjs", "u2-newer", async (c) => !(await u2b(req(path.join(c, "src", "saved-format.cjs"))))],
    ["u2p", "src/saved-format.cjs", "u2-store-read", async (c) => !(await u2b(req(path.join(c, "src", "saved-format.cjs"))))],
    ["u2p", "src/saved-format.cjs", "u2-store-write", async (c) => !(await u2b(req(path.join(c, "src", "saved-format.cjs"))))],
    ["u2p", "src/team-store.mjs", "u2-teams-newer", async (c) => !(await u2a(await import(pathToFileURL(path.join(c, "src", "team-store.mjs")).href)))],
    ["u2p", "ui/app.js", "u2-page", async (c) => !(await u2d(fs.readFileSync(path.join(c, "ui", "app.js"), "utf8")))],
    ["u2p", "ui/app.js", "u2-hold-page", async (c) => !(await u2h(fs.readFileSync(path.join(c, "ui", "app.js"), "utf8")))],
    ["u2p", "ui/app.js", "u2-hold-act", async (c) => !(await u2h(fs.readFileSync(path.join(c, "ui", "app.js"), "utf8")))],
    ["u2p", "ui/app.js", "u2-hold-licence", async (c) => !(await u2h(fs.readFileSync(path.join(c, "ui", "app.js"), "utf8")))],
    ...SHELL_U2_PLANTS,
    ["p5p", "src/studio.mjs", "p5-version-genuine", async (c) => !(await p5a(await import(pathToFileURL(path.join(c, "src", "studio.mjs")).href)))],
    ["p5p", "src/studio.mjs", "p5-version-row", async (c) => !(await p5a(await import(pathToFileURL(path.join(c, "src", "studio.mjs")).href)))],
    ["p5p", "ui/app.js", "p5-page-version", async (c) => !(await p5b(fs.readFileSync(path.join(c, "ui", "app.js"), "utf8")))],
  ];
  /* What each removal leaves: the guarding line gone, or its test made one that never holds. */
  const REMOVE = Object.assign({
    "u2-newer": (l) => l.replace(/if \(typeof doc\.format[^;]*;/, "return null;"),
    "u2-store-read": () => "",
    "u2-store-write": () => "",
    "u2-teams-newer": () => "",
    "u2-page": () => "",
    "u2-hold-page": () => "",
    "u2-hold-act": () => "",
    "u2-hold-licence": (l) => l.replace("(newerStands() ?", "(false ?"),
    "p5-version-genuine": () => "",
    "p5-version-row": (l) => l.replace(/version: [^/]*,/, "version: \"\","),
    "p5-page-version": (l) => l.replace("(r.version ?", "(false ?"),
  }, SHELL_U2_REMOVE);
  for (const id of ["u2p", "p5p"]) {
    const mine = GUARDS.filter((g) => g[0] === id);
    if (PLANTS_OFF) { asserted++; process.stdout.write("  SKIP  " + id + " (plants off), counted\n"); continue; }
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT), said = [];
    for (const [, rel, tag, red] of mine) {
      const copy = plantsTree(ROOT, "team-desks-" + tag);
      try {
        const at5 = path.join(copy, rel), buf = fs.readFileSync(at5), want = crypto.createHash("sha256").update(buf).digest("hex");
        const lines = buf.toString("utf8").split("\n"), mark = "plant:" + tag + " ";
        const hits = lines.filter((l) => l.indexOf(mark) >= 0).length;
        fs.writeFileSync(at5, lines.map((l) => (l.indexOf(mark) >= 0 ? REMOVE[tag](l) : l)).join("\n"));
        let bit = false;
        try { bit = hits === 1 && await red(copy); } catch (e) { bit = hits === 1; }
        fs.writeFileSync(at5, buf);
        const back = crypto.createHash("sha256").update(fs.readFileSync(at5)).digest("hex") === want;
        said.push(tag + (hits === 1 && bit && back ? " red" : " DID NOT BITE (" + hits + " mark, back " + back + ")"));
      } finally { dropPlantsTree(copy, ROOT); }
    }
    check(said.every((x) => / red$/.test(x)) && treeSha(ROOT) === before,
      id + " each guard removed in a scratch copy turns its leg red, the copy put back by its sha256, this checkout unchanged: " + said.join(", "));
  }
  await fd9();
  await teamHome();
  await teamAnother();
  await td974c16();
  await teamLapse();
  copyPlants({ root: ROOT, self: SELF, label: "team-desks", onlyVar: "TEAM_DESKS_ONLY", plants: FD9_PLANTS, check, skip });

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "team-desks");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran\n");
    return 78;
  }
  process.stdout.write("\nteam-desks  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(c => process.exit(c), e => {
  process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2);
});
