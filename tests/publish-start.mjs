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

/* ps2. Publish on a catalog with no team opens that catalog's Team page, which says it publishes nowhere yet and offers Make a team.
   MOVED 2026-11-26 (Max, 00:37: "Retire it."; findings 26, 28 and 32): was the place choice, Where the team meets, defaulting to the relay, with a
   shared folder's picker behind it (ps3, ps4, ps6, ps7, fd4a to fd4c and nf2 retire with it). */
LEGS.ps2 = async () => {
  const calls = [];
  const { page: P, node } = pageOf(makeApi(calls));
  P.S.open = mockProject(null);
  await P.ACTS.publish();
  const main = node("#main").innerHTML;
  const says = /data-no-team/.test(main) && main.indexOf("publishes nowhere yet") >= 0;
  const offers = /data-act="team-new"/.test(main);
  const noPlan = P.S.plan === null && !called(calls, "publishPlan") && P.S.cover === null;
  check(P.S.screen === "projects" && P.S.home === "team" && says && offers && noPlan && called(calls, "desks"),
    "ps2 Publish on a catalog with no team opens its Team page, which says it publishes nowhere yet and offers Make a team, and asks for no plan: screen="
    + P.S.screen + " home=" + P.S.home + " says=" + says + " offers=" + offers + " noPlan=" + noPlan);

  const pl = pageOf(makeApi([]), "pl");
  pl.page.S.open = mockProject(null);
  await pl.page.ACTS.publish();
  const plMain = pl.node("#main").innerHTML;
  check(plMain.indexOf("Ten katalog nie należy do żadnego zespołu") >= 0 && /Utwórz zespół/.test(plMain) && plMain.indexOf("folder") < 0,
    "ps2 the page is Polish, and offers no folder");
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
  { mark: "nf-chans", leg: "nf1", line: '    const chans = [[58, "sync", T("The relay"), T("teammates join by invitation")], [154, "folder", T("A shared folder"), T("teammates share one folder")]];' },
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
