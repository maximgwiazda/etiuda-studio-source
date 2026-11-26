/* THE MAIN BUTTON IS PUBLISH FROM THE FIRST EDIT (board 938, condition U1).
 *
 *     node tests/publish-start.mjs
 *
 *   ps1  Publish is the main action button, a disc in the corner, on a project with no place.
 *   ps2  Publish there opens the place choice (Where the team meets), defaulting to the relay.
 *   ps3  The folder answer alone opens the picker. The relay publishes there. Cancelling, and a
 *        refused folder, leave the edit unpublished and say nothing false.
 *   ps4  A project on a real folder keeps it: the choice defaults to that folder, a relay mirror
 *        does not count as one, and nothing moves a real folder unless the lead chooses the relay.
 *        Sealing an existing real folder that Publish opened continues into Publish.
 *   ps5  The tour's Publish step finds #discPublish on a project with no place.
 *   ps6  Switching project while the relay answer is still out clears publishPlace, so a later
 *        folder pick in the other project does not open Publish.
 *   fd4  In evaluation with no relay licence and a provider offered, the relay's team cover offers signing in (Argon's
 *        first-day review, F4; board 980, stage 4): its sentence and the door's Sign in, which opens the door and sends nothing;
 *        a licensed Studio, the shared folder, and a Studio with no provider offered press Seal as before; Publish's place
 *        choice offers it too. Its plants run in a scratch copy (tests/plant-copy.mjs), after the in-place plants below.
 *
 * Each plant: line in ui/app.js is removed here. The leg it guards goes red, and the file is put
 * back by sha256. The child runs one leg and does not plant again.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const APP_PATH = path.join(ROOT, "ui", "app.js");
const ONLY = process.env.PUBLISH_START_ONLY || "";

const MIRROR = "C:/etiuda/relay/" + "ab".repeat(16);
const REAL = "C:/Share/real-team";
const CHOSEN = "C:/Share/chosen-team";

/* ETIUDA_PLANTS=off (a merge's area run, and this file's own plant children) skips the plants phase and counts each plant
   it would have run; the release profile runs with plants on, so the phase still runs there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + "\n");
}

function mockProject(folder) {
  return {
    dir: "C:/Projects/test-project",
    name: "Test Project",
    editions: [],
    counts: { cards: 0, intents: 0, cats: 0, rv: 0 },
    lint: { errors: 0, warnings: 0, notes: 0, suggestions: 0 },
    draft: { langs: [{ code: "en", name: "English" }], cards: [], rules: [] },
    project: { id: "p-0123456789abcdef", title: "Test Project", rev: 0, folder: folder || null, fileName: "test.ec" },
  };
}

function noTeam(folder) {
  return {
    folder: folder || null, signing: "test-key", file: "none", inside: false, team: null,
    requests: [], canKeep: true, mark: null, restorable: null,
  };
}

const PLAN = {
  rev: 0, next: 1, name: "Test Project", edition: "2026-10-28a", after: "2026-10-28b", was: "",
  editions: 0, published: "", folder: REAL, fileName: "test.ec", fileFixed: true,
  where: { folder: REAL, local: false, cloud: "", exists: true, writable: true },
  lint: { errors: 0, warnings: 0, suggestions: 0, notes: 0, rows: [] },
  changes: { first: true, groups: [] },
  strip: { first: true, groups: [] },
  awaiting: [], langs: ["en"],
  signing: { keyId: "test-key", print: "0123456789abcdef", opens: true },
};

function makeApi(calls, overrides, more) {
  const o = overrides || {};
  const base = {
    publishPlan: async (d) => { calls.push(["publishPlan", d]); return o.publishPlan ? o.publishPlan(d) : PLAN; },
    desks: async (d) => { calls.push(["desks", d]); return o.desks ? o.desks(d) : noTeam(null); },
    teamRelay: async (d) => { calls.push(["teamRelay", d]); return o.teamRelay ? o.teamRelay(d) : { ok: true, signing: { keyId: "test-key" } }; },
    pickFolder: async (title) => { calls.push(["pickFolder", title]); return o.pickFolder ? o.pickFolder(title) : { folder: CHOSEN }; },
    setFolder: async (d, fo) => {
      calls.push(["setFolder", d, fo]);
      return o.setFolder ? o.setFolder(d, fo) : { folder: fo, check: { exists: true, writable: true, local: false, cloud: "" } };
    },
    teamSealed: async (d, sealed, fresh) => {
      calls.push(["teamSealed", d, sealed, fresh]);
      return o.teamSealed ? o.teamSealed(d, sealed, fresh) : { ok: true, signing: { keyId: "test-key" } };
    },
    reveal: async () => null,
  };
  Object.assign(base, more || {});
  return new Proxy(base, { get: (t, k) => (k in t ? t[k] : async () => null) });
}

function pageOf(api, lang) {
  const loaded = loadPage({ api, uiLang: lang || "en" });
  const P = loaded.page;
  P.S.host = { langs: { builtIn: ["en", "pl"], endonyms: { en: "English", pl: "Polski" } }, tour: { offered: true } };
  P.S.screen = "project";
  P.S.section = "cards";
  P.S.lang = lang || "en";
  return loaded;
}

const vOf = (v) => ({ getAttribute: (k) => (k === "data-v" ? v : null) });
const called = (calls, name) => calls.some((c) => c[0] === name);

const LEGS = {};

/* ps1. Publish is the main action button on a project with no place: since 26 November a filled disc in the corner (it was the toolbar
   row's filled button), saying the rev it makes, and no button asks for the folder. */
LEGS.ps1 = async () => {
  const { page: P, node } = pageOf(makeApi([]));
  P.S.open = mockProject(null);
  P.paintChrome();
  P.paintDiscs();
  const chrome = node("#chrome").innerHTML;
  const disc = node("#discPublish");
  const said = disc.attrs["aria-label"] || "";
  const hasPublish = /Publish/.test(said) && said.indexOf("rev" + String.fromCharCode(160) + "1") >= 0 && /<svg/.test(disc.innerHTML) && !/data-act="publish"/.test(chrome);
  const noFolderBtn = !/data-act="settings-folder"/.test(chrome);
  check(hasPublish && noFolderBtn,
    "ps1 Publish is the main action button, a disc, on a project with no place: hasPublish=" + hasPublish + " noFolderBtn=" + noFolderBtn + " said=" + said);
};

/* ps2. Publish there opens the same place choice the Desks screen asks, defaulting to the relay. */
LEGS.ps2 = async () => {
  const calls = [];
  const { page: P, node } = pageOf(makeApi(calls));
  P.S.open = mockProject(null);
  await P.ACTS.publish();
  const dlg = node("#dlg").innerHTML;
  const asks = dlg.indexOf("Where the team meets") >= 0;
  const relayOn = dlg.indexOf('aria-checked="true" data-act="team-where" data-v="relay"') >= 0;
  const noPlan = P.S.plan === null && !called(calls, "publishPlan");
  check(P.S.cover === "team" && P.S.teamWant === "sealed" && P.S.teamWhere === "relay" && P.S.publishPlace === true
    && asks && relayOn && noPlan && P.S.err === null,
    "ps2 Publish on a project with no place opens the place choice, defaulting to the relay: cover=" + P.S.cover
    + " where=" + P.S.teamWhere + " publishPlace=" + P.S.publishPlace + " asks=" + asks + " relayOn=" + relayOn + " noPlan=" + noPlan);

  const pl = pageOf(makeApi([]), "pl");
  pl.page.S.open = mockProject(null);
  await pl.page.ACTS.publish();
  const plDlg = pl.node("#dlg").innerHTML;
  check(plDlg.indexOf("Gdzie spotyka się zespół") >= 0 && plDlg.indexOf("przekaźnik Etiudy") >= 0
    && plDlg.indexOf("wspólny folder") < 0,
    "ps2 the place choice reuses the Desks screen's Polish sentences and offers no shared folder (was: also offered a shared folder, 2026-11-20)");
};

/* ps3. The folder answer alone opens the picker. Relay publishes. Cancel says nothing false. */
LEGS.ps3 = async () => {
  let relayed = false;
  const callsA = [];
  const { page: PA } = pageOf(makeApi(callsA, {
    desks: async () => (relayed
      ? { folder: MIRROR, signing: "test-key", file: "ours", inside: false, team: { id: "t-relay", sealed: true, roster: [] }, requests: [], canKeep: true, mark: null, restorable: null }
      : noTeam(null)),
    teamRelay: async () => { relayed = true; return { ok: true, signing: { keyId: "test-key" } }; },
  }));
  PA.S.open = mockProject(null);
  await PA.ACTS.publish();
  check(PA.S.cover === "team" && PA.S.publishPlace === true && PA.S.teamWhere === "relay",
    "ps3a Publish opened the team cover on the relay");
  await PA.ACTS["do-team-seal"]();
  check(called(callsA, "teamRelay") && !called(callsA, "pickFolder") && PA.S.publishPlace === false
    && PA.S.cover === "publish" && PA.S.plan !== null && PA.S.open.project.folder === MIRROR,
    "ps3a the relay answer calls teamRelay, never the picker, and the publish plan opens on the mirror: relay="
    + called(callsA, "teamRelay") + " pick=" + called(callsA, "pickFolder") + " cover=" + PA.S.cover
    + " folder=" + PA.S.open.project.folder);

  const callsB = [];
  const { page: PB } = pageOf(makeApi(callsB));
  PB.S.open = mockProject(null);
  await PB.ACTS.publish();
  await PB.ACTS["settings-folder"]();
  check(called(callsB, "pickFolder") && !called(callsB, "teamRelay") && PB.S.publishPlace === false
    && PB.S.cover === "publish" && PB.S.plan !== null && PB.S.open.project.folder === CHOSEN && PB.S.err === null,
    "ps3b the plain folder's own pick (no longer a cover answer) opens the picker, then the publish plan: pick=" + called(callsB, "pickFolder")
    + " relay=" + called(callsB, "teamRelay") + " cover=" + PB.S.cover + " folder=" + PB.S.open.project.folder);

  const callsC = [];
  const { page: PC } = pageOf(makeApi(callsC));
  PC.S.open = mockProject(null);
  await PC.ACTS.publish();
  PC.ACTS["cover-close"]();
  check(PC.S.publishPlace === false && PC.S.cover === null && PC.S.plan === null && !called(callsC, "publishPlan")
    && PC.S.err === null && PC.S.open.project.folder == null,
    "ps3c closing the choice leaves the edit unpublished and says nothing: publishPlace=" + PC.S.publishPlace
    + " cover=" + PC.S.cover + " err=" + PC.S.err);

  const callsD = [];
  const { page: PD } = pageOf(makeApi(callsD, { pickFolder: async () => null }));
  PD.S.open = mockProject(null);
  await PD.ACTS.publish();
  await PD.ACTS["settings-folder"]();
  check(called(callsD, "pickFolder") && !called(callsD, "teamRelay") && !called(callsD, "publishPlan")
    && PD.S.publishPlace === false && PD.S.plan === null && PD.S.err === null && PD.S.open.project.folder == null,
    "ps3d cancelling the picker leaves the edit unpublished and says nothing: publishPlace=" + PD.S.publishPlace
    + " err=" + PD.S.err + " plan=" + PD.S.plan);

  const callsE = [];
  const { page: PE } = pageOf(makeApi(callsE, { setFolder: async () => ({ error: "refused" }) }));
  PE.S.open = mockProject(null);
  await PE.ACTS.publish();
  let threw = null;
  try { await PE.ACTS["settings-folder"](); } catch (e) { threw = (e && e.message) || String(e); }
  check(!threw && called(callsE, "pickFolder") && !called(callsE, "publishPlan") && PE.S.publishPlace === false
    && PE.S.plan === null && !!PE.S.err && PE.S.open.project.folder == null,
    "ps3e a refused folder is said and not published: publishPlace=" + PE.S.publishPlace + " err=" + PE.S.err
    + " threw=" + threw);
};

/* ps4. A project already on a real folder is offered the relay like any other (the owner, 2026-11-17 19:02: folder teams are removed).
   It was: the choice defaulted to that folder and sealed there. Re-aimed 2026-11-20. */
LEGS.ps4 = async () => {
  const callsA = [];
  const { page: PA, node: nodeA } = pageOf(makeApi(callsA, { desks: async () => noTeam(null) }));
  PA.landOn(mockProject(REAL));
  check(PA.S.teamWhere === "relay",
    "ps4a landing on a real folder no longer defaults the team choice to that folder: " + PA.S.teamWhere);
  PA.S.screen = "projects";
  PA.S.home = "team";
  PA.S.teamDir = PA.S.open.dir;
  await PA.desksLoad();
  PA.ACTS["team-seal"](vOf("sealed"));
  const dlgA = nodeA("#dlg").innerHTML;
  const relayOn = dlgA.indexOf('aria-checked="true" data-act="team-where" data-v="relay"') >= 0;
  const noFolderOffer = dlgA.indexOf('data-v="folder"') < 0 && dlgA.indexOf("Choose the folder your team reads from") < 0
    && dlgA.indexOf("Seal what this folder is given") < 0;
  check(PA.S.teamWhere === "relay" && relayOn && noFolderOffer,
    "ps4b the Desks cover on a real folder offers the relay and no folder: where=" + PA.S.teamWhere
    + " relayOn=" + relayOn + " noFolderOffer=" + noFolderOffer);
  await PA.ACTS["do-team-seal"]();
  check(called(callsA, "teamRelay") && !called(callsA, "teamSealed") && !called(callsA, "pickFolder"),
    "ps4c the press makes the relay team and seals nothing in the folder: sealed=" + called(callsA, "teamSealed")
    + " relay=" + called(callsA, "teamRelay") + " pick=" + called(callsA, "pickFolder"));

  const { page: PE } = pageOf(makeApi([], { desks: async () => noTeam(null) }));
  PE.landOn(mockProject(MIRROR));
  check(PE.S.teamWhere === "relay",
    "ps4e a relay mirror is not a real folder, and the choice is the relay: " + PE.S.teamWhere);

  const callsH = [];
  const { page: PH } = pageOf(makeApi(callsH, { desks: async () => noTeam(REAL) }));
  PH.S.open = mockProject(null);
  PH.S.desks = noTeam(REAL);
  await PH.ACTS.publish();
  check(PH.S.cover === "team" && PH.S.teamWhere === "relay" && PH.S.publishPlace === true,
    "ps4h Publish on an empty project folder, with a real Desks folder, offers the relay: where=" + PH.S.teamWhere);
  await PH.ACTS["do-team-seal"]();
  check(called(callsH, "teamRelay") && !called(callsH, "teamSealed") && !called(callsH, "pickFolder")
    && called(callsH, "publishPlan") && PH.S.publishPlace === false && PH.S.cover === "publish" && PH.S.plan !== null,
    "ps4h the relay answer continues into Publish: relay=" + called(callsH, "teamRelay") + " sealed="
    + called(callsH, "teamSealed") + " plan=" + called(callsH, "publishPlan") + " cover=" + PH.S.cover
    + " publishPlace=" + PH.S.publishPlace);

  /* A team already held at that folder, the project's own folder not yet set: the cover seals it and Publish continues. */
  const callsI = [];
  const held = () => ({ folder: REAL, signing: "test-key", file: "ours", inside: false, team: { id: "t-held", sealed: false, roster: [] },
    requests: [], canKeep: true, mark: null, restorable: null });
  const { page: PI } = pageOf(makeApi(callsI, { desks: async () => held() }));
  PI.S.open = mockProject(null);
  PI.S.desks = held();
  await PI.ACTS.publish();
  await PI.ACTS["do-team-seal"]();
  check(PI.S.cover === "publish" && PI.S.publishPlace === false && PI.S.plan !== null && called(callsI, "teamSealed")
    && !called(callsI, "teamRelay") && PI.S.open.project.folder === REAL,
    "ps4i a team already held at a folder is sealed there and Publish continues: cover=" + PI.S.cover
    + " publishPlace=" + PI.S.publishPlace + " sealed=" + called(callsI, "teamSealed") + " folder=" + PI.S.open.project.folder);
};

/* ps6. A project switch drops the flag, so the next project's folder pick does not publish. */
LEGS.ps6 = async () => {
  const other = mockProject(null);
  other.dir = "C:/Projects/other-project";
  other.name = "Other Project";
  other.project = Object.assign({}, other.project, { id: "p-fedcba9876543210", title: "Other Project" });
  const calls = [];
  let page = null;
  const loaded = pageOf(makeApi(calls, {
    teamRelay: async () => {
      page.landOn(other);
      return { ok: true, signing: { keyId: "test-key" } };
    },
  }));
  page = loaded.page;
  page.S.open = mockProject(null);
  await page.ACTS.publish();
  check(page.S.publishPlace === true && page.S.cover === "team",
    "ps6 Publish on a project with no place raises the flag: publishPlace=" + page.S.publishPlace
    + " cover=" + page.S.cover);
  await page.ACTS["do-team-seal"]();
  check(page.S.open.dir === other.dir && page.S.publishPlace === false && page.S.cover !== "publish"
    && !called(calls, "publishPlan"),
    "ps6 switching project while the relay call is pending clears the flag and does not publish: dir="
    + page.S.open.dir + " publishPlace=" + page.S.publishPlace + " cover=" + page.S.cover
    + " plan=" + called(calls, "publishPlan"));
  await page.ACTS["settings-folder"]();
  check(called(calls, "setFolder") && !called(calls, "publishPlan") && page.S.cover !== "publish"
    && page.S.publishPlace === false,
    "ps6 a later folder pick in the other project does not open Publish: set=" + called(calls, "setFolder")
    + " plan=" + called(calls, "publishPlan") + " cover=" + page.S.cover
    + " publishPlace=" + page.S.publishPlace);
};

/* ps5. The tour's Publish step has its target once the main button is Publish: the action button, #discPublish. */
LEGS.ps5 = async () => {
  const { page: P, doc } = pageOf(makeApi([]));
  P.S.open = mockProject(null);
  P.paintChrome();
  P.paintDiscs();
  const orig = doc.querySelector.bind(doc);
  doc.querySelector = (sel) => {
    if (sel === "#discPublish") return /Publish/.test(orig(sel).attrs["aria-label"] || "") ? orig(sel) : null;
    return orig(sel);
  };
  const TOUR = P.__get("TOUR");
  const step = TOUR.find((s) => s.key === "publish");
  const src = step ? Function.prototype.toString.call(step.sel) : "";
  check(!!step && src.indexOf("#discPublish") >= 0,
    "ps5 the tour's Publish step points at #discPublish");
  const target = step ? step.sel() : null;
  check(target !== null,
    "ps5 the tour's Publish step finds its target on a project with no place: " + (target ? "found" : "null"));
};

/* fd4. IN EVALUATION THE RELAY'S COVER OFFERS SIGNING IN (Argon's first-day review, F4; the test architect's condition, 2026-11-01
   01:19: "In evaluation, Start a team on the relay offers the trial that makes the key and the grant, instead of two refusals one
   after the other."; a first sign-in starts the trial since board 980, stage 4). The licence read is the shell's studio:licence. */
const EVAL = { licence: { status: "none", paused: false }, grant: null, hasKey: false, relayTeams: [] };
const HELD = { licence: { status: "active", paused: false }, grant: { until: "2026-12-01", paid: true }, hasKey: true, relayTeams: [] };
function trialApi(calls, lic, o) {
  const extra = o || {};
  let took = false;
  return makeApi(calls, Object.assign({
    desks: async () => (took ? { folder: MIRROR, signing: "test-key", file: "ours", inside: false, team: { id: "t-relay", sealed: true, roster: [] }, requests: [], canKeep: true, mark: null, restorable: null }
      : noTeam(null)),
    teamRelay: async () => { took = true; return { ok: true }; },
  }, extra), {
    licence: async () => { calls.push(["licence"]); return JSON.parse(JSON.stringify(lic)); },
  });
}
/* The page over trialApi with the providers the shell offers at boot (S.host.signIn); none where `offered` is false. */
function trialPage(calls, lic, lang, offered) {
  const loaded = pageOf(trialApi(calls, lic), lang);
  if (offered !== false) loaded.page.S.host.signIn = ["microsoft", "google"];
  return loaded;
}

LEGS.fd4a = async () => {
  const seen = {};
  for (const lang of ["en", "pl"]) {
    const calls = [];
    const { page: P, node } = trialPage(calls, EVAL, lang);
    P.S.open = mockProject(null);
    P.S.screen = "projects";
    P.S.home = "team";
    P.S.teamDir = P.S.open.dir;
    P.S.desks = noTeam(null);
    await P.ACTS["team-seal"](vOf("sealed"));
    const dlg = node("#dlg").innerHTML, T = P.T;
    seen[lang] = {
      noTrialLine: dlg.indexOf("fourteen-day trial") < 0 && dlg.indexOf("czternastodniowy okres próbny") < 0,
      noDoorOpen: !/data-act="door-open"/.test(dlg),
      seal: dlg.indexOf('data-act="do-team-seal"') >= 0,
      noFolderOffer: dlg.indexOf('data-act="team-where" data-v="folder"') < 0,
    };
  }
  const bad = [];
  for (const l of Object.keys(seen)) for (const k of Object.keys(seen[l])) if (seen[l][k] !== true) bad.push(l + " " + k);
  check(bad.length === 0,
    "fd4a team cover no longer offers signing in for a trial (S-3 removed teamTrialWanted): "
    + (bad.length ? "failing " + JSON.stringify(bad) : "every part holds"));
};

LEGS.fd4b = async () => {
  const calls = [];
  const { page: P } = trialPage(calls, EVAL);
  P.S.open = mockProject(null);
  P.S.screen = "projects";
  P.S.home = "team";
  P.S.teamDir = P.S.open.dir;
  P.S.desks = noTeam(null);
  await P.ACTS["team-seal"](vOf("sealed"));
  await P.ACTS["door-open"]();
  const asked = calls.map((c) => c[0]).filter((c) => c !== "licence" && c !== "desks" && c !== "teams");
  check(P.S.cover === null && P.S.signDoor === "open" && !called(calls, "teamRelay"),
    "fd4b Sign in closes the team cover and opens the door, starting no team: cover=" + P.S.cover + " door=" + P.S.signDoor
    + " asked=" + JSON.stringify(asked));
};

/* ps7. The first Publish cover once said what a shared folder costs, under Where the team meets, on both segments (Claudette,
   2026-11-10). The folder is gone (the owner, 2026-11-17 19:02), so the line is gone: the relay stays the default with its press,
   in both languages, and the cover says nothing of a folder's cost. Re-aimed 2026-11-20. */
const FOLDER_COST = "A shared folder needs no licence and no email: each publish writes the edition into it as a file, and any folder on this computer will do.";
LEGS.ps7 = async () => {
  const seen = {};
  for (const lang of ["en", "pl"]) {
    const { page: P, node } = trialPage([], EVAL, lang);
    P.S.open = mockProject(null);
    await P.ACTS.publish();
    const relay = node("#dlg").innerHTML;
    seen[lang] = {
      noCost: relay.indexOf(P.T(FOLDER_COST)) < 0 && relay.indexOf("data-folder-cost") < 0,
      relayDefault: relay.indexOf('aria-checked="true" data-act="team-where" data-v="relay"') >= 0,
      relayPress: /data-act="do-team-seal"/.test(relay),
    };
  }
  const bad = [];
  for (const l of Object.keys(seen)) for (const k of Object.keys(seen[l])) if (seen[l][k] !== true) bad.push(l + " " + k);
  check(bad.length === 0,
    "ps7 the first Publish cover says nothing of a shared folder's cost, and the relay stays the default with its press, in both languages: "
    + (bad.length ? "failing " + JSON.stringify(bad) : "every part holds"));
};

/* nf1. THE OWNER'S RULING OF 2026-11-17 19:02 ("Agreed, let's remove it."): no screen offers to make a team that meets in a shared
   folder. nf1 is Overview's empty state: the map draws the relay as its one channel. */
LEGS.nf1 = async () => {
  const seen = {};
  for (const lang of ["en", "pl"]) {
    const { page: P, node } = pageOf(makeApi([]), lang);
    P.S.screen = "projects"; P.S.projects = []; P.S.teams = [];
    P.paintProjects();
    const html = node("#main").innerHTML;
    const folds = (html.match(/class="dm-fold/g) || []).length, desks = (html.match(/class="dm-desk/g) || []).length;
    const curves = (html.match(/class="dm-e/g) || []).length;
    seen[lang] = {
      relay: html.indexOf(P.T("The relay")) >= 0 && html.indexOf(P.T("teammates join by invitation")) >= 0,
      noFolderWords: html.indexOf(P.T("A shared folder")) < 0 && html.indexOf(P.T("teammates share one folder")) < 0,
      oneChannel: folds === 2 && curves === 3 && desks === 2,
    };
  }
  const bad = [];
  for (const l of Object.keys(seen)) for (const k of Object.keys(seen[l])) if (seen[l][k] !== true) bad.push(l + " " + k);
  check(bad.length === 0,
    "nf1 Overview's empty state draws the relay as its one channel and no shared folder, in both languages: "
    + (bad.length ? "failing " + JSON.stringify(bad) : "every part holds"));
};

/* nf2. The first-team cover offers the relay alone (and a team this Studio leads where one is held): no folder segment, no cost
   line, and a forced "folder" answer, or a project that already sits on a real folder, still ends on the relay. */
LEGS.nf2 = async () => {
  const seen = {};
  for (const lang of ["en", "pl"]) {
    const { page: P, node } = pageOf(makeApi([]), lang);
    P.S.open = mockProject(null);
    await P.ACTS.publish();
    const dlg = node("#dlg").innerHTML;
    const said = P.T("A shared folder needs no licence and no email: each publish writes the edition into it as a file, and any folder on this computer will do.");
    await P.ACTS["team-where"](vOf("folder"));
    const forced = node("#dlg").innerHTML;
    seen[lang] = {
      noSegment: dlg.indexOf('data-v="folder"') < 0 && dlg.indexOf(P.T("a shared folder")) < 0,
      noCost: dlg.indexOf("data-folder-cost") < 0 && dlg.indexOf(said) < 0,
      relayOn: dlg.indexOf('aria-checked="true" data-act="team-where" data-v="relay"') >= 0,
      forcedStays: P.S.teamWhere === "relay" && forced.indexOf('aria-checked="true" data-act="team-where" data-v="relay"') >= 0
        && forced.indexOf("data-folder-cost") < 0,
    };
  }
  const callsF = [];
  const { page: PF } = pageOf(makeApi(callsF));
  PF.S.open = mockProject(null);
  PF.S.desks = noTeam(null);
  PF.ACTS["team-seal"](vOf("sealed"));
  PF.S.teamWhere = "folder";            /* forced, as no click can now do */
  await PF.ACTS["do-team-seal"]();
  seen.forced = { relayPress: called(callsF, "teamRelay") && !called(callsF, "teamSealed") && !called(callsF, "pickFolder") };
  const callsG = [];
  const { page: PG } = pageOf(makeApi(callsG, { desks: async () => noTeam(REAL) }));
  PG.landOn(mockProject(REAL));
  seen.real = { relayDefault: PG.S.teamWhere === "relay" };
  const bad = [];
  for (const l of Object.keys(seen)) for (const k of Object.keys(seen[l])) if (seen[l][k] !== true) bad.push(l + " " + k);
  check(bad.length === 0,
    "nf2 the first-team cover offers no shared folder: no segment, no cost line, a forced folder answer ends on the relay, and a real folder"
    + " does not default to it: " + (bad.length ? "failing " + JSON.stringify(bad) : "every part holds"));
};

LEGS.fd4c = async () => {
  const calls = [];
  const { page: P, node } = trialPage(calls, EVAL);
  P.S.open = mockProject(null);
  await P.ACTS.publish();
  const dlg = node("#dlg").innerHTML;
  check(P.S.cover === "team" && P.S.publishPlace === true && dlg.indexOf('data-act="do-team-seal"') >= 0
    && !/data-act="door-open"/.test(dlg),
    "fd4c Publish on a project with no place opens the place choice with Seal (no trial offer): cover=" + P.S.cover);
};

const PLANTS = [
  {
    mark: "u1-publish-btn", leg: "ps1",
    line: '    discBtn($("#discPublish"), I("folder"), T("Choose the folder your team reads from"), true);',
  },
  {
    mark: "u1-publish-btn", leg: "ps5",
    line: '    discBtn($("#discPublish"), I("folder"), T("Choose the folder your team reads from"), true);',
  },
  { mark: "u1-publish-place", leg: "ps2", line: "      if (false) {" },
  { mark: "u1-relay-publish", leg: "ps3", line: "      await Promise.resolve();" },
  { mark: "u1-folder-publish", leg: "ps3", line: "        await Promise.resolve();" },
  { mark: "u1-pick-cancel", leg: "ps3", line: "        if (false) S.publishPlace = false;" },
  {
    mark: "u1-set-fail", leg: "ps3",
    line: '      if (!set || set.error) { if (false) S.publishPlace = false; S.err = errOf(set); paintMain(); return; }',
  },
  { mark: "u1-place-clear", leg: "ps4", line: "        if (false) S.publishPlace = false;" },
  { mark: "u1-seal-publish", leg: "ps4", line: "        await Promise.resolve();" },
  { mark: "u1-open-clear", leg: "ps6", line: "    if (false) S.publishPlace = false;" },
  { mark: "nf-chans", leg: "nf1", line: '    const chans = [[58, "sync", T("The relay"), T("teammates join by invitation")], [154, "folder", T("A shared folder"), T("teammates share one folder")]];' },
  { mark: "nf-seg", leg: "nf2", line: "      + '<div class=\"row2\">' + seg(\"team-where\", [[\"relay\", relayName()], [\"folder\", T(\"a shared folder\")]]" },
  { mark: "nf-handler", leg: "nf2", line: '      S.teamWhere = v === "folder" ? "folder" : v === "team" && chooseTeams().length ? "team" : "relay"; S.err = null; paintCover();' },
  { mark: "rs926-route", leg: "nf2", line: "      if (false) return teamOnRelay(dir);" },
  { mark: "nf-default", leg: "ps2", line: '        S.teamWhere = "folder";' },
];

/* fd4's plants retired with teamTrialWanted in S-3. */
const COPY_PLANTS = [];

function runPlantsPhase() {
  const was = fs.readFileSync(APP_PATH);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  for (const p of PLANTS) {
    const lines = text.split(nl);
    const hit = lines.findIndex((l) => l.indexOf("/* plant:" + p.mark + " */") >= 0);
    if (hit < 0) { check(false, "plant " + p.mark + " not found"); continue; }
    lines[hit] = p.line;
    fs.writeFileSync(APP_PATH, lines.join(nl));
    let red = false, back = false, detail = "";
    try {
      const child = spawnSync(process.execPath, [SELF], {
        cwd: ROOT, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { PUBLISH_START_ONLY: p.leg, ETIUDA_PLANTS: "off" }),
      });
      const out = String(child.stdout || "") + String(child.stderr || "");
      red = child.status !== 0 && out.indexOf("FAIL " + p.leg) >= 0;
      if (!red) detail = " status=" + child.status + " tail=" + out.slice(-400).replace(/\s+/g, " ");
    } finally {
      fs.writeFileSync(APP_PATH, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(APP_PATH)).digest("hex") === wantSha;
    check(red && back, "plant " + p.mark + " turns " + p.leg + " red and restores by sha256: red=" + red + " back=" + back + detail);
  }
}

async function main() {
  if (ONLY) {
    try {
      if (LEGS[ONLY]) await LEGS[ONLY]();
      else check(false, "unknown leg: " + ONLY);
    } catch (e) {
      check(false, ONLY + " threw: " + ((e && e.stack) || e));
    }
  } else {
    for (const name of Object.keys(LEGS)) {
      try { await LEGS[name](); }
      catch (e) { check(false, name + " threw: " + ((e && e.stack) || e)); }
    }
    if (!PLANTS_OFF) runPlantsPhase();
    else for (const p of PLANTS) skip("plant " + p.mark + " turns " + p.leg + " red and restores by sha256 (ETIUDA_PLANTS=off)");
    copyPlants({ root: ROOT, self: SELF, label: "publish-start", onlyVar: "PUBLISH_START_ONLY", plants: COPY_PLANTS, check, skip });
  }
  console.log("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("harness error: " + ((e && e.stack) || e));
  process.exit(1);
});
