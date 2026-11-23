/* STUDIO MAINTENANCE TAB AND HEALTH STRIP: node tests/maintenance-tab.mjs [--keep].
 *
 * gate-kind: node
 *
 * Board 967, run S2 of the Settings plan (office brief settings-965-967-969-plan-2026-11-08.md).
 * Studio's Maintenance tab in the screen tab mechanism, opened by Ctrl+Shift+M, the Settings
 * nav foot and the About section row.
 *
 *   mt1  Ctrl+Shift+M opens a tab named Maintenance; in Polish Konserwacja; a second press
 *        fronts it; the nav foot and About row open it; Done closes it back to the tab before
 *   mt2  F2 still renames
 *   mt3  a failing reading prints "unavailable"
 *   mt4  Copy report produces content-free English text: holds no catalog name, person's name
 *        or library path
 *   mt5  Re-read the library reloads as a start does
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "maintenance-tab");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const el = (attrs) => ({
  getAttribute: (k) => (attrs[k] == null ? null : attrs[k]),
  closest: (sel) => (sel && sel.indexOf("data-ctx") >= 0 && attrs["data-ctx"] ? el(attrs) : null),
  matches: (sel) => !!(attrs["data-ctx"]),
});
const has = (fn) => typeof fn === "function";
const key = (k, o) => Object.assign({ key: k, code: "", ctrlKey: true, shiftKey: false, altKey: false, metaKey: false,
  prevented: false, preventDefault() { this.prevented = true; } }, o || {});
const text = (h) => String(h || "").replace(/<[^>]*>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

function band(html) {
  const out = [];
  const re = /<span class="(tab[^"]*)"([^>]*)>([\s\S]*?)(?=<span class="tab|<\/div>|$)/g;
  for (let m; (m = re.exec(html));) {
    const a = (s, k) => (new RegExp(" " + k + '="([^"]*)"').exec(s) || [])[1] || null;
    out.push({ cls: m[1], act: a(m[2], "data-act"), dir: a(m[2], "data-dir"), v: a(m[2], "data-v"),
      on: a(m[2], "aria-current") === "page", said: text(m[3]), x: (/<span class="x"([^>]*)>/.exec(m[3]) || [])[1] || "" });
  }
  return out;
}

const sampleSign = { file: "C:\\ud\\signing-key.json", name: "signing-key.json", keyId: "studio-9a3a782d7f8ff25b", public: "",
  print: "9a3a782d7f8ff25b", kept: "os", backup: { where: "C:\\backup", made: "2026-11-01" }, admitted: 3, problem: null };

function pageOver(root, uiLang, overrides = {}) {
  const calls = [], writes = [];
  let copiedText = "";
  const api = Object.assign({
    newProject: (n, l, o) => { calls.push("newProject"); return wire(S.newProject(root, n, l, o)); },
    open: (d) => { calls.push("open:" + path.basename(d)); return wire(S.openProject(d)); },
    projects: () => { calls.push("projects"); return wire(S.listProjects(root)); },
    proposals: (d) => wire(S.listProposals(d)),
    saveCard: (d, i, p) => wire(S.saveCard(d, i, p)),
    tabs: (v) => { writes.push(JSON.parse(JSON.stringify(v))); return Promise.resolve({ error: null }); },
    signing: () => Promise.resolve({ error: null, signing: sampleSign }),
    licence: () => Promise.resolve({ error: null, licence: { status: "none" } }),
    copy: (txt) => { calls.push("copy"); copiedText = txt; return Promise.resolve({ error: null }); },
    maintenance: () => Promise.resolve({
      error: null,
      version: "0.1.0",
      electron: "44.4.5",
      windows: "Windows 10.0.22631",
      libraryFolder: root,
      dataFolder: "C:\\Users\\alice\\AppData\\Roaming\\Etiuda Studio",
      openCatalogs: 1,
      teamsCount: 2,
      teammatesCount: 5,
      keyPrint: sampleSign.print,
      enginePin: "ed671fc23517621fde06962b41002520464a9d2a",
      spelling: "en-US, pl",
      window: "1280 x 880 (maximised)",
      notifications: "supported",
      localMemory: "12 KB",
      lastStart: "not recorded",
      lastCrash: "not recorded",
      health: {
        library: "present",
        catCount: 1,
        signingKey: "present · backed up",
        relay: "relay reachable",
        background: "running",
        lastStart: "not recorded",
        lastCrash: "not recorded",
      },
    }),
  }, overrides.api || {});

  const home = loadPage({ api, uiLang });
  const P = home.page;
  P.S.host = { tour: { offered: true }, langs: S.builtLangs(), version: "0.1.0", signing: sampleSign };
  const tabs = () => { P.paint(); return band(home.node("#tabs").innerHTML); };
  async function press(act, attrs) {
    if (!P.ACTS[act]) return false;
    try { await P.ACTS[act](el(Object.assign({ "data-act": act }, attrs || {}))); } catch (e) { P.__threw = e; return false; }
    await sleep(40);
    return true;
  }
  const tk = (k, o) => { const e = key(k, o); const did = has(P.tabKey) ? P.tabKey(e) : ""; return { did, e }; };
  const getCopied = () => copiedText;
  return { P, home, calls, writes, tabs, press, tk, getCopied };
}

async function main() {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const L = [{ code: "en" }, { code: "pl" }];
  const secretCatalogName = "SecretCatalogAlpha";
  const cat = await S.newProject(root, secretCatalogName, L);

  const { P, home, calls, tabs, press, tk, getCopied } = pageOver(root, "en");
  P.S.projects = S.listProjects(root).projects;
  await press("to-projects");
  await press("open", { "data-dir": cat.dir });

  /* ---- 1. Ctrl+Shift+M OPENS A TAB NAMED MAINTENANCE ------------------------------------------ */
  const res = tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  const b1 = tabs();
  const mtTab = b1.find((t) => t.v === "maintenance");
  check(mtTab && mtTab.said === "Maintenance" && mtTab.on && P.S.screen === "maintenance",
    "mt1a Ctrl+Shift+M opens a tab named Maintenance: " + (mtTab ? mtTab.said : "none"));

  /* Second press fronts it */
  await press("to-project", { "data-dir": cat.dir });
  check(P.S.screen === "project", "mt1b back on catalog tab");
  tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  const b2 = tabs();
  const mtTab2 = b2.filter((t) => t.v === "maintenance");
  check(mtTab2.length === 1 && mtTab2[0].on && P.S.screen === "maintenance",
    "mt1c second Ctrl+Shift+M fronts existing Maintenance tab: " + mtTab2.length);

  /* Polish title */
  const pl = pageOver(root, "pl");
  pl.tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  const plTab = pl.tabs().find((t) => t.v === "maintenance");
  check(plTab && plTab.said === "Konserwacja" && pl.P.S.screen === "maintenance",
    "mt1d in Polish the tab says Konserwacja: " + (plTab ? plTab.said : "none"));

  /* Nav foot and About row open it */
  await press("settings");
  check(P.S.screen === "settings", "mt1e on Settings tab");
  await press("to-screen", { "data-v": "maintenance" });
  check(P.S.screen === "maintenance", "mt1f nav foot / to-screen opens Maintenance from Settings");

  const mtHtml = home.node("#main").innerHTML;
  check(mtHtml.indexOf("mt-strip") >= 0
        && mtHtml.indexOf("Library") >= 0
        && mtHtml.indexOf("Signing key") >= 0
        && mtHtml.indexOf("Relay") >= 0
        && mtHtml.indexOf("Background work") >= 0
        && mtHtml.indexOf("Last start") >= 0
        && mtHtml.indexOf("Last crash") >= 0
        && mtHtml.indexOf("not recorded") >= 0,
    "mt1g health strip renders six tiles: Library, Signing key, Relay, Background work, Last start, Last crash");

  /* Done closes it back to previous tab */
  await press("close-screen", { "data-v": "maintenance" });
  check(P.S.screen === "settings", "mt1h Done closes Maintenance back to Settings: " + P.S.screen);

  /* ---- 2. F2 STILL RENAMES --------------------------------------------------------------------- */
  await press("to-project", { "data-dir": P.S.tabs[0].dir });
  const tabEl = el({ "data-ctx": "project", "data-where": "tab", "data-dir": P.S.tabs[0].dir });
  const f2Key = { key: "F2", target: tabEl, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, preventDefault() { this.defaultPrevented = true; } };
  const didRename = has(P.objectKey) ? P.objectKey(f2Key) : "";
  check(didRename === "rename" || !!(P.S.naming && P.S.naming.where === "tab") || !!f2Key.defaultPrevented,
    "mt2 F2 still renames: " + didRename);

  /* ---- 3. A FAILING READING PRINTS 'unavailable' ----------------------------------------------- */
  const broken = pageOver(root, "en", {
    api: {
      maintenance: () => Promise.resolve({
        error: "failed",
        version: null,
        electron: null,
        windows: null,
        libraryFolder: null,
        dataFolder: null,
        openCatalogs: null,
        teamsCount: null,
        teammatesCount: null,
        keyPrint: null,
        enginePin: null,
        spelling: null,
        window: null,
        notifications: null,
        localMemory: null,
        lastStart: null,
        lastCrash: null,
        health: null,
      }),
    },
  });
  broken.tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  await sleep(60);
  const mainHtml = broken.home.node("#main").innerHTML;
  check(mainHtml.indexOf("unavailable") >= 0, "mt3 a failing reading prints 'unavailable'");

  /* ---- 4. REPORT HOLDS NO CATALOG NAME, PERSON'S NAME OR LIBRARY PATH -------------------------- */
  const secretPerson = "Alice Smith";
  const secretLibraryPath = "C:\\secret\\library\\path";
  const reportLab = pageOver(secretLibraryPath, "en", {
    api: {
      maintenance: () => Promise.resolve({
        error: null,
        version: "0.1.0",
        electron: "44.4.5",
        windows: "Windows 10.0.22631",
        libraryFolder: secretLibraryPath,
        dataFolder: "C:\\Users\\" + secretPerson + "\\AppData\\Roaming\\Etiuda Studio",
        openCatalogs: 1,
        teamsCount: 1,
        teammatesCount: 2,
        keyPrint: sampleSign.print,
        enginePin: "ed671fc23517",
        spelling: "en-US",
        window: "1280 x 880",
        notifications: "supported",
        localMemory: "10 KB",
        lastStart: "not recorded",
        lastCrash: "not recorded",
        health: {
          library: "present",
          catCount: 1,
          signingKey: "present · backed up",
          relay: "relay reachable",
          background: "running",
          lastStart: "not recorded",
          lastCrash: "not recorded",
        },
      }),
    },
  });
  reportLab.tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  await sleep(60);
  await reportLab.press("copy-report");
  const reportText = reportLab.getCopied();
  check(reportText.length > 0
        && reportText.indexOf(secretCatalogName) === -1
        && reportText.indexOf(secretPerson) === -1
        && reportText.indexOf(secretLibraryPath) === -1
        && reportText.indexOf("Etiuda Studio") >= 0
        && reportText.indexOf("- Last start: not recorded") >= 0
        && reportText.indexOf("- Last crash: not recorded") >= 0,
    "mt4 report holds no catalog name, person's name or library path");

  /* ---- 5. RE-READ THE LIBRARY RELOADS AS A START DOES ------------------------------------------ */
  calls.length = 0;
  tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  await press("reread-library");
  check(calls.indexOf("projects") >= 0, "mt5 Re-read the library calls API.projects as a start does: " + JSON.stringify(calls));
  /* mt5b: the open catalog is read again and taken, not left as it was (the action called a function defined nowhere,
     and its try swallowed the error; found by Claudius θ′, 2026-11-11). */
  calls.length = 0;
  const before = P.S.open;
  if (before) before.staleMark = true;
  await press("reread-library");
  check(!!before && calls.indexOf("open:" + path.basename(cat.dir)) >= 0 && !!P.S.open && P.S.open !== before && !P.S.open.staleMark
    && P.S.open.dir === before.dir,
    "mt5b Re-read the library opens the open catalog again and takes what it read: " + JSON.stringify(calls));

  /* ---- 6. POLISH MAINTENANCE TAB AND REPORT FOLLOW PAGE LANGUAGE (finding 9) ------------------- */
  const plLab = pageOver(secretLibraryPath, "pl", {
    api: {
      maintenance: () => Promise.resolve({
        error: null,
        version: "0.1.0",
        electron: "44.4.5",
        windows: "Windows 10.0.22631",
        libraryFolder: secretLibraryPath,
        dataFolder: "C:\\Users\\" + secretPerson + "\\AppData\\Roaming\\Etiuda Studio",
        openCatalogs: 1,
        teamsCount: 1,
        teammatesCount: 2,
        keyPrint: sampleSign.print,
        enginePin: "ed671fc23517",
        spelling: "en-US",
        window: "1280 x 880 (maximised)",
        notifications: "supported",
        localMemory: "10 KB",
        lastStart: "not recorded",
        lastCrash: "not recorded",
        health: {
          library: "present",
          catCount: 1,
          signingKey: "present · backed up",
          relay: "relay reachable",
          background: "running",
          lastStart: "not recorded",
          lastCrash: "not recorded",
        },
      }),
    },
  });
  plLab.tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  await sleep(60);
  await plLab.press("copy-report");
  const plReportText = plLab.getCopied();
  check(plReportText.length > 0
        && plReportText.indexOf("Odczyty:") >= 0
        && plReportText.indexOf("- Ostatnie uruchomienie: nierejestrowane") >= 0
        && plReportText.indexOf("- Ostatnia awaria: nierejestrowane") >= 0
        && plReportText.indexOf("- Przekaźnik: przekaźnik osiągalny") >= 0
        && plReportText.indexOf("- Biblioteka:") >= 0
        && plReportText.indexOf("folder jest") >= 0,
    "mt6 in Polish copy report translates readings, labels and health status");

  const plMainHtml = plLab.home.node("#main").innerHTML;
  check(plMainHtml.indexOf("Ostatnie uruchomienie") >= 0
        && plMainHtml.indexOf("nierejestrowane") >= 0
        && plMainHtml.indexOf("przekaźnik osiągalny") >= 0
        && plMainHtml.indexOf("otwarte katalogi") >= 0
        && plMainHtml.indexOf("folder danych") >= 0,
    "mt7 in Polish maintenance page renders Polish readings and strip tiles");

  /* ---- 7. Ctrl+Shift+M OPENS MAINTENANCE WHILE COVER OR TOUR IS UP (Finding 10) ---- */
  home.doc.getElementById = (id) => home.doc.querySelector("#" + id);
  await press("to-project", { "data-dir": cat.dir });
  check(P.S.screen === "project", "mt8 setup back on catalog");
  P.S.cover = "card";
  const dlg = home.doc.querySelector("#dlg");
  if (dlg) dlg.querySelectorAll = () => [{ id: "cardTitle", value: "Card Under Maint" }];

  const coverMaint = tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  check(coverMaint.did === "maintenance" && P.S.screen === "maintenance",
    "mt8a Ctrl+Shift+M opens maintenance while a pop-up cover is up: " + coverMaint.did);
  const catTab = P.S.tabs.find((t) => t.dir === cat.dir);
  check(catTab && catTab.place && catTab.place.cover && catTab.place.cover.kind === "card"
        && catTab.place.cover.typed && catTab.place.cover.typed.cardTitle === "Card Under Maint",
    "mt8b pop-up cover and typed text parked in tab place on opening maintenance");

  await press("to-project", { "data-dir": cat.dir });
  P.S.tour = 0;
  const tourMaint = tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  check(tourMaint.did === "maintenance" && P.S.screen === "maintenance" && P.S.tour == null,
    "mt8c Ctrl+Shift+M closes tour and opens maintenance while tour is up: " + tourMaint.did);

  /* mt9. THE LIBRARY TILE COUNTS THE LIBRARY. openCatalogs is the open tabs, and it stays on the
     readings row that names them. catCount is how many catalogs the library holds. libraryFolder is
     the path Studio would use, and it is set even when that folder is not there, so the tile reads
     health.library for present or missing. */
  const nb = String.fromCharCode(160);
  const catalogsLine = (n, state) => "catalogs:" + nb + n + " · folder " + state;
  const libTileOf = (html) => {
    const m = /mt-tile-k">Library<\/span><span class="mt-tile-v">([^<]*)</.exec(html);
    return m ? m[1] : "";
  };
  const openRowOf = (html) => {
    const m = /mt-row"><span class="k">open catalogs<\/span><span class="v">([^<]*)</.exec(html);
    return m ? m[1] : "";
  };
  const mtPayload = (healthLibrary, catCount, openCatalogs) => ({
    error: null,
    version: "0.1.0",
    electron: "44.4.5",
    windows: "Windows 10.0.22631",
    libraryFolder: secretLibraryPath,
    dataFolder: "C:\\Users\\alice\\AppData\\Roaming\\Etiuda Studio",
    openCatalogs,
    teamsCount: 2,
    teammatesCount: 5,
    keyPrint: sampleSign.print,
    enginePin: "ed671fc23517",
    spelling: "en-US, pl",
    window: "1280 x 880",
    notifications: "supported",
    localMemory: "12 KB",
    lastStart: "not recorded",
    lastCrash: "not recorded",
    health: {
      library: healthLibrary,
      catCount,
      signingKey: "present · backed up",
      relay: "relay reachable",
      background: "running",
      lastStart: "not recorded",
      lastCrash: "not recorded",
    },
  });
  const counted = pageOver(secretLibraryPath, "en", {
    api: { maintenance: () => Promise.resolve(mtPayload("present", 4, 1)) },
  });
  counted.tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  await sleep(60);
  const countedHtml = counted.home.node("#main").innerHTML;
  check(libTileOf(countedHtml) === catalogsLine(4, "present") && openRowOf(countedHtml) === "1",
    "mt9a the Library tile counts the library's catalogs and the readings row keeps the open tabs: "
    + JSON.stringify([libTileOf(countedHtml), openRowOf(countedHtml)]));

  const gone = pageOver(secretLibraryPath, "en", {
    api: { maintenance: () => Promise.resolve(mtPayload("missing", 0, 2)) },
  });
  gone.tk("M", { ctrlKey: true, shiftKey: true, code: "KeyM" });
  await sleep(60);
  await gone.press("copy-report");
  const goneHtml = gone.home.node("#main").innerHTML;
  const goneReport = gone.getCopied();
  check(libTileOf(goneHtml) === catalogsLine(0, "missing") && openRowOf(goneHtml) === "2"
        && goneReport.indexOf("- Library: " + catalogsLine(0, "missing")) >= 0
        && goneReport.indexOf("- open catalogs: 2") >= 0
        && goneReport.indexOf(secretLibraryPath) < 0,
    "mt9b a folder that is not there says folder missing even though libraryFolder is a path: "
    + JSON.stringify([libTileOf(goneHtml), openRowOf(goneHtml), goneReport.indexOf("folder missing")]));

  process.stdout.write("\nmaintenance-tab  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write("maintenance-tab failed: " + (err && err.stack ? err.stack : err) + "\n");
  process.exit(1);
});
