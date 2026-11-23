/* THE LAUNCH AND THE EMPTY PROJECTS SCREEN'S MARK (Maxim, 2026-10-08 17:53, of the desk's mark at C and D: "Let's go with it,
 * option firmer line!"; the launch of 00:38 and 01:12; the empty screen of 00:28: "I really don't think "New project" and
 * "Import catalog" buttons have a place under it, considering that the same buttons are clearly present above it to the right.").
 *
 *     node tests/launch-mark.mjs
 *
 * Node only, no window: the page's code runs on tests/page-stand-in.mjs, and the mark itself is the pinned engine's
 * src/modules/launch-mark.js, whose timing, landing and quiet drawing the engine's test.js holds. Claims, one section each:
 *   1  the empty Projects screen names its folder under the mark's place, without New project and Import catalog, which the
 *      chrome above it keeps; the folder-missing twin keeps Change folder
 *   2  that screen stands the mark over its block on Studio's quiet switch, and a screen with projects asks for none
 *   3  each start of Studio stands the launch before it asks its host anything: over the work area, on Studio's quiet switch,
 *      held by a cover, with the screen's search taking a first key; its work is ready only once the first screen is
 *      painted; an engine that cannot be imported leaves the work shown
 *   4  the mark Studio imports is the pin's file, at the firmer line
 *   7  one clock (Maxim, 2026-10-08 19:25, of the empty screen's mark and the corner logo: "used to be synchronized"; 19:29
 *      "Yes, please!"): the band's mark turns on the pin's fifth.js clock on Studio's quiet switch, the empty screen's mark
 *      and the launch are given that clock's phase, and the About and the status bar keep the band's mark standing; the
 *      system's switch turned off again reaches the band's mark (7f)
 * The window legs that read the same things are named in the report that carries this file; none is run here.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import * as Engine from "../src/engine.mjs";
import * as Studio from "../src/studio.mjs";
import { readCatalogDocument } from "../src/diff.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 25;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const settle = (ms) => new Promise((r) => setTimeout(r, ms || 10));
const thrown = [];
process.on("unhandledRejection", (e) => { thrown.push(String(e && e.stack || e).slice(0, 300)); });

/* A name the page lacks throws: such a hook is skipped, so a tree without the launch fails its legs rather than the file. */
const put = (pg, n, v) => { try { pg.__set(n, v); } catch (e) { /* absent in this source */ } };
const take = (pg, n) => { try { return pg.__get(n); } catch (e) { return () => undefined; } };
/** A class list that keeps what is put on it: the stand-in's own is a no-op. */
function classes() {
  const set = new Set();
  return { set, add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c), toggle() {} };
}
/** The page with a launch module of the leg's own, recording what Studio asks of it. */
function withMark(opts) {
  const P = loadPage(opts || {});
  const asked = [];
  const fake = {
    launchMark: (o) => { asked.push(["launch", o]); return {}; },
    syncLaunchMark: (host, o) => asked.push(["sync", host, o])
  };
  put(P.page, "launchModule", () => Promise.resolve(fake));
  P.doc.body.classList = classes();
  return { P, asked, fake };
}
const blockOf = (html) => { const m = /<div class="(?:dashed )?none">/.exec(html); return m ? html.slice(m.index) : ""; };

/* ---- 1 and 2: the empty Projects screen ---- */
{
  const { P, asked, fake } = withMark();
  const S = P.page.S;
  put(P.page, "launchLM", fake);
  S.screen = "projects"; S.projects = []; S.root = "C:\\Projects"; S.rootMissing = false; S.q = "";
  take(P.page, "paintProjects")();
  const html = P.node("#main").innerHTML, block = blockOf(html);
  check(block.indexOf('<div class="e-fifth-spot"></div>') >= 0 && /Catalogs are kept in/.test(block),
    "1a the empty screen names its folder under the mark's place");
  const acts = (block.match(/data-act="[^"]+"/g) || []);
  check(acts.join() === 'data-act="new",data-act="bring",data-act="sample-open"'
        && block.indexOf('class="btn solid" data-act="new"') >= 0
        && block.indexOf('class="btn" data-act="bring"') >= 0
        && block.indexOf('class="btn" data-act="sample-open"') >= 0
        && block.indexOf('data-act="sample-open"') < block.indexOf("Catalogs are kept in"),
    "1b the empty block shows New catalog (solid), Bring in your replies, and the plain sample press above the folder line: " + JSON.stringify(acts));
  S.home = "library";
  take(P.page, "paintProjects")();
  const libEmpty = blockOf(P.node("#main").innerHTML);
  const libActs = (libEmpty.match(/data-act="[^"]+"/g) || []);
  check(libActs.join() === 'data-act="new",data-act="bring",data-act="sample-open"',
    "1c and Library shows the same two rows when no project exists: " + JSON.stringify(libActs));
  S.home = "overview";
  take(P.page, "paintProjects")();
  S.rootMissing = true;
  take(P.page, "paintProjects")();
  const missing = blockOf(P.node("#main").innerHTML);
  check(/is not there yet/.test(missing) && (missing.match(/data-act="[^"]+"/g) || []).join() === 'data-act="new",data-act="bring",data-act="sample-open",data-act="pick-root"',
    "1d the folder-missing twin keeps Change folder below the folder line: " + JSON.stringify(missing.match(/data-act="[^"]+"/g)));
  P.page.paintChrome();
  P.page.paintRail();
  const chrome = P.node("#chrome").innerHTML;
  const rail = P.node("#rail").innerHTML;
  check(/data-act="new"/.test(chrome) && !/data-act="bring"/.test(chrome) && !/data-act="pick-root"/.test(chrome)
        && /data-act="bring"/.test(rail) && /data-act="pick-root"/.test(rail) && /id="q"/.test(chrome),
    "1E CONTROL: the chrome above it keeps New catalog beside Search catalogs and the rail holds Bring in your replies and Open a folder");

  const syncs = asked.filter((a) => a[0] === "sync");
  check(syncs.length === 4 && syncs.every((a) => a[1] === P.node("#main .projects>.none")),
    "2a each paint of the empty screen stands the mark over its block: " + syncs.length + " ask(s)");
  check(syncs.length > 0 && syncs.every((a) => a[2] && a[2].still === take(P.page, "motionOff")),
    "2b on Studio's quiet switch, html.e-still or the system's reduced motion");
  asked.length = 0;
  S.projects = [{ dir: "C:\\Projects\\a", name: "a", counts: { cards: 3 }, rev: 0 }];
  take(P.page, "paintProjects")();
  const ovWithProj = blockOf(P.node("#main").innerHTML);
  S.home = "library";
  take(P.page, "paintProjects")();
  const libWithProj = blockOf(P.node("#main").innerHTML);
  check(asked.length === 2 && asked.every((a) => a[0] === "sync" && a[1] === null)
        && ovWithProj === "" && libWithProj === "",
    "2C CONTROL: once a project exists neither Overview nor Library shows the block or its rows");

  /* ---- 1f & 1g: the sample press wording (EN + PL) and landing through the catalog-file road ---- */
  {
    const EN_LABEL = "Open the sample catalog";
    const PL_LABEL = "Otwórz przykładowy katalog";
    const EN_LINE = "A made-up shop's catalog in English and Polish, the same one the desk has, to look round in. It opens as a catalog of your own, to change, rename, publish or remove like any other.";
    const PL_LINE = "Katalog wymyślonego sklepu po angielsku i po polsku, ten sam, który ma stanowisko, do swobodnego przejrzenia. Otwiera się jak własny katalog: można go zmieniać, zmienić mu nazwę, opublikować albo usunąć jak każdy inny.";
    const enP = loadPage({ uiLang: "en" }), plP = loadPage({ uiLang: "pl" });
    check(enP.sandbox.STUDIO_T.T(EN_LABEL) === EN_LABEL && plP.sandbox.STUDIO_T.T(EN_LABEL) === PL_LABEL
          && enP.sandbox.STUDIO_T.T(EN_LINE) === EN_LINE && plP.sandbox.STUDIO_T.T(EN_LINE) === PL_LINE,
      "1f the sample press's label and sentence match the copywriter's bytes in English and Polish");

    const sampleAt = Engine.sampleCatalog();
    const doc = readCatalogDocument(sampleAt);
    const wantCards = (doc.cards || []).length, wantTags = (doc.tags || []).length;
    const labRoot = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-launch-mark-sample-"));
    try {
      const api = {
        projects: async () => Studio.listProjects(labRoot),
        samplePick: async () => ({ error: null, file: sampleAt }),
        upgradePlan: async (file) => Studio.upgradePlan(labRoot, file),
        upgradeLand: async (file, name) => Studio.upgradeLand(labRoot, file, name),
        proposals: async () => ({ error: "stand-in" }),
      };
      const G = loadPage({ api, uiLang: "en" });
      G.page.S.host = { tour: { offered: true }, langs: Studio.builtLangs() };
      G.page.S.root = labRoot;
      G.page.S.projects = [];
      G.page.S.screen = "projects";
      G.page.paintProjects();
      await G.page.ACTS["sample-open"]();
      const onCover = G.page.S.cover === "upgrade" && G.page.S.up && G.page.S.up.counts.cards === wantCards;
      await G.page.ACTS["do-upgrade"]();
      const landed = G.page.S.open;
      const listed = Studio.listProjects(labRoot).projects;
      const gotTags = landed && landed.draft && Array.isArray(landed.draft.tags) ? landed.draft.tags.length : 0;
      check(onCover && !!landed && landed.counts && landed.counts.cards === wantCards && gotTags === wantTags
            && listed.length === 1 && G.page.S.screen === "project",
        "1g pressing Open the sample catalog shows the upgrade cover and lands a project with the fetched file's cards and tags ("
        + wantCards + " cards, " + wantTags + " tags)");
    } finally { fs.rmSync(labRoot, { recursive: true, force: true }); }
  }
}

/* ---- 3: the launch at each start ---- */
{
  const order = [];
  let readyAt = null;
  const api = { host: async () => { order.push("host"); return { theme: "light", tabs: [] }; } };
  const { P, asked } = withMark({ api });
  const pg = P.page;
  put(pg, "launchModule", () => { order.push("launch"); return Promise.resolve({ launchMark: (o) => { asked.push(["launch", o]); o.ready.then(() => { readyAt = order.length; }); return {}; },
    syncLaunchMark: () => {} }); });
  put(pg, "varsLoad", () => Promise.resolve(null));
  put(pg, "loadProjects", async () => { order.push("projects"); });
  put(pg, "restoreTabs", async () => false);
  put(pg, "paint", () => { order.push("paint"); });
  put(pg, "tourInvitePaint", () => {});
  put(pg, "chooseLang", () => {});
  const boot = take(pg, "boot");
  const running = boot();
  check(P.doc.body.classList.contains("e-launch") && order[0] === "launch",
    "3a the launch stands, the work hidden, before Studio asks its host anything: " + JSON.stringify(order));
  await running; await settle();
  const o = (asked.find((a) => a[0] === "launch") || [])[1] || {};
  check(o.app === "studio" && o.region === P.node(".work") && o.still === take(pg, "motionOff"),
    "3b over the work area, in Studio's ink, on Studio's quiet switch");
  const scrim = P.node("#scrim");
  scrim.hidden = true; const open = o.covered && o.covered();
  scrim.hidden = false; const shut = o.covered && o.covered();
  check(open === false && shut === true, "3c a cover over Studio holds the arrival: " + open + ", " + shut);
  check(o.focus && o.focus() === P.node("#q"), "3d the screen's search takes a first key");
  check(JSON.stringify(order) === JSON.stringify(["launch", "host", "projects", "paint"]) && readyAt === 4,
    "3e its work is ready only once the first screen is painted: " + JSON.stringify(order) + ", ready after " + readyAt);

  const F = loadPage({ api });
  F.doc.body.classList = classes();
  put(F.page, "launchModule", () => Promise.reject(new Error("no engine")));
  take(F.page, "launchStart")(Promise.resolve());
  const during = F.doc.body.classList.contains("e-launch");
  await settle();
  check(during && !F.doc.body.classList.contains("e-launch"),
    "3F CONTROL: an engine that cannot be imported leaves the work shown");
}

/* ---- 4: the file Studio imports ---- */
{
  const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const clockAt = /import\("(\.\.\/engine\/pinned\/src\/modules\/fifth\.js)"\)/.exec(app);
  const clock = clockAt && path.join(ROOT, "ui", clockAt[1]);
  const csrc = clock && fs.existsSync(clock) ? fs.readFileSync(clock, "utf8") : "";
  check(!!csrc && !/^import /m.test(csrc) && /export\s*\{[^}]*\bfifthPhase\b[^}]*\bwireFifth\b/.test(csrc),
    "4b and the pin's fifth.js for its clock, which imports nothing either: " + (clockAt ? clockAt[1] : "no import"));
}

/* ---- 7: one clock for the band, the empty screen's mark and the launch ---- */
{
  const { P, asked } = withMark();
  const wired = [], clock = { fifthPhase: () => 0.5, wireFifth: (o) => wired.push(o) };
  // the clock arrives after the mark's module, so a launch that did not wait for it would land on its own
  put(P.page, "clockModule", () => new Promise((r) => setTimeout(() => r(clock), 20)));
  const band = P.node("#band .brand svg.mark");
  band.outerHTML = '<svg class="mark"><path d="standing"/></svg>';
  const S = P.page.S, motionOff = take(P.page, "motionOff");
  S.screen = "projects"; S.projects = []; S.root = "C:\\Projects"; S.rootMissing = false; S.q = "";
  take(P.page, "paintProjects")(); await settle(40);
  take(P.page, "paintProjects")(); await settle(40);
  take(P.page, "launchStart")(Promise.resolve()); await settle(40);
  const syncs = asked.filter((a) => a[0] === "sync"), launch = (asked.find((a) => a[0] === "launch") || [])[1] || {};
  /* One clock turns the band: Studio's corner where the opening module offers it (the opening hands over into it), else
     the pin's; never both, which wrote the one path from two loops (the launch review, item 7). */
  const owner = take(P.page, "bandOwner"), bandClock = take(P.page, "bandClock");
  const oneClock = owner === "corner" ? wired.length === 0 : owner === "pin" ? wired.length === 1 && wired[0].still === motionOff : false;
  check(oneClock && typeof bandClock === "function",
    "7a the band's mark is turned by one clock, with Studio's quiet switch: " + JSON.stringify(owner) + ", " + wired.length + " pin wiring(s)");
  check(syncs.length === 2 && syncs.every((a) => a[2] && a[2].phase === bandClock && a[2].still === motionOff),
    "7b the empty Projects screen's mark is given the band's own clock, on each paint: " + syncs.length + " ask(s)");
  check(launch.phase === bandClock && launch.still === motionOff, "7c and so is the launch");
  band.outerHTML = '<svg class="mark"><path d="turned"/></svg>';
  const about = take(P.page, "markHtml")(), status = String(take(P.page, "statusRightHtml")());
  check(/d="standing"/.test(about) && !/turned/.test(about) && /d="standing"/.test(status) && !/turned/.test(status),
    "7d the About's head and the status bar keep the band's mark as it stands, while the band's own turns");

  const N = withMark();
  put(N.P.page, "clockModule", () => Promise.reject(new Error("no clock")));
  N.P.node("#band .brand svg.mark").outerHTML = '<svg class="mark"><path d="live"/></svg>';
  Object.assign(N.P.page.S, { screen: "projects", projects: [], root: "C:\\Projects", rootMissing: false, q: "" });
  take(N.P.page, "paintProjects")(); await settle();
  take(N.P.page, "launchStart")(Promise.resolve()); await settle();
  const nSync = (N.asked.find((a) => a[0] === "sync") || [])[2] || {}, nLaunch = (N.asked.find((a) => a[0] === "launch") || [])[1];
  check(!!nLaunch && !("phase" in nLaunch) && nSync.still === take(N.P.page, "motionOff") && !("phase" in nSync)
    && /d="live"/.test(take(N.P.page, "markHtml")()),
    "7E CONTROL: a clock that cannot load leaves the band standing and its mark as it is, and the launch and the empty screen on their own");
}

/* ---- 7f: the system's switch, turned off again, gives the band's mark a word (wireFifth hears a root class) ---- */
{
  // a window opened under the switch, then the switch turned off, on, off: the root's class changes at every flip
  const Q = withMark(), heard = [], set = new Set(), words = [], mq = { matches: true, addEventListener: (t, f) => heard.push([t, f]) };
  Q.P.sandbox.matchMedia = () => mq;
  Q.P.doc.documentElement.classList = { add() {}, remove() {}, contains: (c) => set.has(c),
    toggle: (c, on) => { const was = set.has(c); if (on) set.add(c); else set.delete(c); if (was !== set.has(c)) words.push(on); } };
  put(Q.P.page, "clockModule", () => Promise.resolve({ fifthPhase: () => 0.5, wireFifth() {} }));
  Q.P.node("#band .brand svg.mark").outerHTML = '<svg class="mark"><path d="standing"/></svg>';
  take(Q.P.page, "launchStart")(Promise.resolve()); await settle();
  const flips = heard.filter((h) => h[0] === "change");
  [false, true, false].forEach((m) => { mq.matches = m; flips.forEach((h) => h[1]()); });
  check(flips.length >= 1 && JSON.stringify(words) === "[true,false,true,false]",
    "7f the system's quiet switch reaches the root as a changed class at the start and at every flip, so the band turns again when it is turned off: " + JSON.stringify(words));
}

check(thrown.length === 0, "5 nothing the page ran threw on the stand-in" + (thrown.length ? ": " + thrown.join(" | ") : ""));
check(asserted + 1 === EXPECTED, "6 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
process.stdout.write("launch-mark: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
