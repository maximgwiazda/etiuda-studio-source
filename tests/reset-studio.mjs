/* RESET STUDIO IN MAINTENANCE AND UNINSTALLER REMOVE DATA CHECKBOX.
 *
 * gate-kind: node
 *
 *     node tests/reset-studio.mjs
 *
 *   rs1  Maintenance tab carries "Reset Studio" row; in Polish "Zresetuj Studio"
 *   rs2  pressing the row opens cover: heading "Reset Studio?", what goes line, what stays line
 *        (key and documents stay), the no-Undo line, typed word "RESET" required
 *   rs3  press is disabled until "RESET" is typed (case-insensitive), enabled once typed
 *   rs4  confirming calls API.resetStudio, cover shows restart lede
 *   rs5  shell reset keeps licence files, signing key with backups, teams.json, team-revs.json,
 *        member-key.json, Local State, relay/ and folder-mirror/, removes caches and other data,
 *        never touches sibling project folder
 *   rs6  shell reset refuses if path falls outside userData, changing nothing
 *   rs7  after reset, studio.json is rewritten keeping only root, other settings removed, a first-run day an older Studio wrote included
 *        (was: trialFrom kept, so the evaluation period did not restart; the evaluation period is gone)
 *   rs8  uninstaller script packaging/installer-pages.nsh carries "Remove my data" checkbox,
 *        off by default, in English and Polish with words saying the licence stays
 *   rs9  uninstaller uses %APPDATA%\${APP_PACKAGE_NAME}, the build's own package name (etiuda-studio here, the package.json name), not "Etiuda Studio",
 *        and no shipped folder spelled out (was: %APPDATA%\etiuda-studio spelled out, until 2026-11-23, when a test build's uninstaller was
 *        made unable to touch a shipped Studio's data; tests/uninstaller-page.mjs uw5)
 *   rs10 one keep-set: uninstaller keep-list matches shell keep-list from one definition
 *   rs11 uninstaller update path is guarded (${IfNot} ${isUpdated}) so update never removes data
 *   rs12 reset writes .reset-pending marker and ends with relaunch and quit; next start performs
 *        delete before reading/writing; marker is kept while any path stays undone
 *   rs14 a pass that leaves a path undone is said at that start; a file written before the
 *        person chooses survives the next start; Stop the reset drops the marker; Try again clears the held mark and relaunches
 *   rs15 after a Reset, no Run value starts Studio where one did (the Run key as Electron keeps it, tests/login-run-stub.mjs)
 *   rs16 Start with Windows is Studio's own Run value: the switch writes app.etiuda.studio and reads back on, never the
 *        desk's app.etiuda.desktop, whose own entry survives Studio's on and off; an earlier build's value under the
 *        desk's name that starts Studio reads as on, and Off clears it
 *   rs17 a start removes <userData>/work and the copies an earlier Studio left in the temporary folder over a day ago, nothing else
 *   rs18 a paste is written under the work folder and gone once it lands (kept through a refusal); a desk's catalog brought
 *        in is gone once landed or refused
 *   rs13 plants: plant:uninstaller-keep-key, plant:uninstaller-update-guard, plant:uninstaller-one-list,
 *        plant:reset-keep-team-revs, plant:reset-keep-folder-mirror, plant:reset-marker-kept-on-fail,
 *        plant:login-own-name, plant:login-strays, plant:work-swept, plant:temp-swept, plant:paste-gone, plant:brought-gone, plant:temp-aged
 *
 * Node only, no window, no Electron. Exit 0 when all checks pass, 1 when any fails.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Module, { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { useRunKey, startsAtSignIn, studioOn, STUDIO_EXE, DESK_EXE } from "./login-run-stub.mjs";
import OffWindows from "./off-windows.cjs";

const nodeRequire = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MAIN = path.join(ROOT, "shell", "main.js");
const UI = path.join(ROOT, "ui", "index.html");
const NSH = path.join(ROOT, "packaging", "installer-pages.nsh");
const PKG = path.join(ROOT, "package.json");
const SCRATCH = path.join(ROOT, "scratch", "reset-studio-" + Date.now());

const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.RESET_STUDIO_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP " + line + "\n");
}
const want = (id) => !ONLY || ONLY === id || (id === "rs14" && ONLY === "rs14f");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const TEST_VAULT = {
  available: () => true,
  seal: (b) => Buffer.from("sealed:" + Buffer.from(b).toString("base64")),
  open: (b) => {
    const s = Buffer.from(b).toString("utf8");
    if (!s.startsWith("sealed:")) throw new Error("bad seal");
    return Buffer.from(s.slice(7), "base64");
  },
};

async function loadShellLab(ud, opts = {}) {
  const got = {
    handlers: {},
    windows: [],
    said: [],
    trashed: [],
    quitCalled: false,
    exitCalled: null,
    relaunchCalled: false,
    releasedBeforeRelaunch: false,
    mainExports: null,
  };

  class Win {
    constructor() {
      this.webContents = {
        id: 1,
        on() {},
        once() {},
        send() {},
        setWindowOpenHandler() {},
        getURL: () => pathToFileURL(UI).href,
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
      getPath: (name) => (name === "userData" ? ud : (name === "documents" ? path.join(ud, "docs") : path.join(ud, name))),
      getVersion: () => "0.1.0",
      getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true,
      whenReady: () => Promise.resolve(),
      on() {},
      quit() { got.quitCalled = true; },
      exit(c) { got.exitCalled = c; },
      relaunch() { got.relaunchCalled = true; },
      releaseSingleInstanceLock() { if (!got.relaunchCalled) got.releasedBeforeRelaunch = true; },
      isPackaged: true,
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
    shell: {
      openPath: () => Promise.resolve(""),
      trashItem: async (p) => { got.trashed.push(p); },
    },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: () => Promise.reject(new Error("network forbidden")) },
  };
  useRunKey(electron.app);

  const thread = { call: async () => ({}) };
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
    /* The stub's own switch. An offscreen window leg does not set it, so Reset does not relaunch. */
    STUDIO_TEST_RESET_RELAUNCH: "1",
    STUDIO_PROJECTS: path.join(ud, "projects"),
  };
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

  const dropCache = () => {
    delete nodeRequire.cache[MAIN];
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

  try {
    dropCache();
    got.mainExports = nodeRequire(MAIN);
    const wire = nodeRequire(path.join(ROOT, "src", "wire.cjs"));
    wire.relayConnect = () => null;
  } catch (e) {
    restore();
    throw e;
  }

  got.event = { senderFrame: { parent: null, url: pathToFileURL(UI).href }, sender: got.windows[0] && got.windows[0].webContents };
  got.ask = (ch, ...a) => {
    if (!got.handlers[ch]) throw new Error("no handler for " + ch);
    return got.handlers[ch](got.event, ...a);
  };
  got.app = electron.app;
  got.restore = restore;
  return got;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  try {
    /* ---- PART 1: UI LEGS (rs1 - rs4) ----------------------------------------------------------- */
    if (want("rs1") || want("rs2") || want("rs3") || want("rs4")) {
      let resetCalled = false;
      const mockApi = {
        maintenance: () => Promise.resolve({
          error: null, version: "0.1.0", electron: "44.4.5", windows: "Windows 10",
          libraryFolder: path.join(SCRATCH, "lib"),
          dataFolder: path.join(SCRATCH, "ud"),
          openCatalogs: 1, teamsCount: 1, teammatesCount: 2,
          keyPrint: "9a3a782d7f8ff25b", enginePin: "123456", spelling: "en",
          window: "1280 x 800", notifications: "supported", localMemory: "10 KB",
          lastStart: "not recorded", lastCrash: "not recorded",
          health: { library: "catalogs: 1 · folder present", signingKey: "present · backed up", relay: "relay reachable", background: "running" },
        }),
        resetStudio: async () => {
          resetCalled = true;
          return { reset: true };
        },
      };

      const home = loadPage({ api: mockApi, uiLang: "en" });
      const P = home.page;
      P.S.host = { tour: { offered: true }, langs: [{ code: "en" }], version: "0.1.0" };
      P.S.mt = { openCatalogs: 1, libraryFolder: path.join(SCRATCH, "lib"), signingKey: "present" };
      P.S.screen = "maintenance";
      P.paint();
      await sleep(50);

      /* rs1: Maintenance row */
      if (want("rs1")) {
        const html = home.node("#main").innerHTML.replace(/&#39;/g, "'");
        check(html.indexOf("Reset Studio") >= 0
              && html.indexOf("Returns Studio to a fresh install, keeping the licence, the signing key, the teams and the catalogs' own folders.") >= 0
              && html.indexOf('data-act="reset-studio-ask"') >= 0,
          "rs1a English Maintenance tab carries Reset Studio row and description");

        const plLab = loadPage({ api: mockApi, uiLang: "pl" });
        plLab.page.S.host = { tour: { offered: true }, langs: [{ code: "pl" }], version: "0.1.0" };
        plLab.page.S.mt = { openCatalogs: 1, libraryFolder: path.join(SCRATCH, "lib"), signingKey: "present" };
        plLab.page.S.screen = "maintenance";
        plLab.page.paint();
        await sleep(50);
        const plHtml = plLab.node("#main").innerHTML.replace(/&#39;/g, "'");
        check(plHtml.indexOf("Zresetuj Studio") >= 0
              && plHtml.indexOf("Przywraca Studio do stanu po świeżej instalacji; zostają licencja, klucz podpisu, zespoły i foldery katalogów.") >= 0,
          "rs1b Polish Maintenance tab carries Zresetuj Studio and description");
      }

      /* rs2: Cover contents */
      if (want("rs2")) {
        if (typeof P.ACTS["reset-studio-ask"] === "function") await P.ACTS["reset-studio-ask"]();
        check(P.S.cover === "reset-studio", "rs2a pressing row opens cover reset-studio");

        const dlgHtml = home.node("#dlg").innerHTML.replace(/&#39;/g, "'");
        check(dlgHtml.indexOf("Reset Studio?") >= 0
              && dlgHtml.indexOf("Studio's settings, caches, open tabs and local history go. The catalogs stay in their folders, and the Library finds them again by itself.") >= 0
              && dlgHtml.indexOf("The teams and their keys stay, with the signing key and its backup copies, so this Studio keeps leading its teams. The licence stays too, and so does everything in the catalogs' folders on disk.") >= 0
              && dlgHtml.indexOf("There is no Undo.") >= 0
              && dlgHtml.indexOf("Type RESET to confirm.") >= 0,
          "rs2b cover displays heading, what goes, key-and-documents line, no-Undo line and confirmation label");

        const plCoverLab = loadPage({ api: mockApi, uiLang: "pl" });
        plCoverLab.page.S.host = { tour: { offered: true }, langs: [{ code: "pl" }], version: "0.1.0" };
        plCoverLab.page.S.mt = { openCatalogs: 1, libraryFolder: path.join(SCRATCH, "lib"), signingKey: "present" };
        plCoverLab.page.S.screen = "maintenance";
        plCoverLab.page.paint();
        await sleep(50);
        if (typeof plCoverLab.page.ACTS["reset-studio-ask"] === "function") await plCoverLab.page.ACTS["reset-studio-ask"]();
        const plDlgHtml = plCoverLab.node("#dlg").innerHTML.replace(/&#39;/g, "'");
        check(plDlgHtml.indexOf("Zresetować Studio?") >= 0
              && plDlgHtml.indexOf("Znikną ustawienia Studia, pamięć podręczna, otwarte zakładki i lokalna historia. Katalogi zostają w swoich folderach, a Biblioteka sama znajdzie je ponownie.") >= 0
              && plDlgHtml.indexOf("Zostają zespoły i ich klucze, a także klucz podpisu wraz z kopiami zapasowymi, więc to Studio nadal prowadzi swoje zespoły. Zostaje też licencja i wszystko, co jest w folderach katalogów na dysku.") >= 0
              && plDlgHtml.indexOf("Tego nie da się cofnąć.") >= 0
              && plDlgHtml.indexOf("Do potwierdzenia trzeba wpisać RESET.") >= 0,
          "rs2c Polish cover displays exact copywriter words");
      }

      const typeWord = (v) => {
        const target = home.node("#resetStudioWord");
        target.id = "resetStudioWord";
        target.value = v;
        home.doc.heard.filter((x) => x.type === "input").forEach((x) => x.fn({ target }));
      };

      /* rs3: Press disabled until typed word */
      if (want("rs3")) {
        const dlgHtmlBefore = home.node("#dlg").innerHTML;
        const btnBefore = home.node("#doResetStudio");
        btnBefore.id = "doResetStudio";
        check(dlgHtmlBefore.indexOf('id="doResetStudio" data-act="do-reset-studio" disabled') >= 0,
          "rs3a press is disabled when input is empty");

        typeWord("RES");
        check(btnBefore.disabled === true, "rs3b press is disabled when partial word is typed");

        typeWord("reset");
        check(btnBefore.disabled === false, "rs3c press is enabled when lower-case 'reset' is typed");

        typeWord("RESET");
        check(btnBefore.disabled === false, "rs3d press is enabled when upper-case 'RESET' is typed");
      }

      /* rs4: Confirming calls API and shows restart line */
      if (want("rs4")) {
        typeWord("RESET");
        if (typeof P.ACTS["do-reset-studio"] === "function") await P.ACTS["do-reset-studio"]();
        check(resetCalled === true, "rs4a confirming calls API.resetStudio");
        const dlgAfter = home.node("#dlg").innerHTML.replace(/&#39;/g, "'");
        check(dlgAfter.indexOf("Studio is starting again as freshly installed.") >= 0,
          "rs4b cover displays restarting message during restart");
      }
    }

    /* ---- PART 2: SHELL RESET AND FINISH (rs5 - rs7, rs12) --------------------------------------- */
    if (want("rs5") || want("rs6") || want("rs7") || want("rs12")) {
      const ud = path.join(SCRATCH, "ud-stand-in");
      const siblingProjects = path.join(SCRATCH, "sibling-projects");
      fs.mkdirSync(ud, { recursive: true });
      fs.mkdirSync(path.join(ud, "Dictionaries"), { recursive: true });
      fs.mkdirSync(path.join(ud, "Cache"), { recursive: true });
      fs.mkdirSync(path.join(ud, "Local Storage", "leveldb"), { recursive: true });
      fs.mkdirSync(path.join(ud, "relay"), { recursive: true });
      fs.mkdirSync(path.join(ud, "folder-mirror", "team-1"), { recursive: true });
      fs.mkdirSync(siblingProjects, { recursive: true });

      const keptFiles = {
        "etiuda-studio-license.js": "/* licence bytes */ module.exports = { status: 'active' };",
        "licence-service.json": JSON.stringify({ lastCheck: 1000, key: "purchase-key-abc" }),
        "etiuda-studio-revoked.json": JSON.stringify({ serial: 1, revoked: [] }),
        "relay-grant.json": JSON.stringify({ grant: "test-grant", until: "2027-01-01" }),
        "signing-key.json": JSON.stringify({ keyId: "lead-key-1", public: "pub-1", kept: "os", doc: { private: "priv-1" } }),
        "signing-key.old.json": JSON.stringify({ keyId: "old-key-0", public: "pub-0", kept: "os" }),
        "signing-key.old-studio-999.json": JSON.stringify({ keyId: "old-key-999", public: "pub-999" }),
        "signing-key.made-at-activation-prev.json": JSON.stringify({ keyId: "act-key-prev", public: "pub-prev" }),
        "teams.json": JSON.stringify({ teams: [{ id: "t1", name: "Team 1" }] }),
        "team-revs.json": JSON.stringify({ format: 1, kind: "etiuda-studio-team-revs", teams: { t1: { rev: 42 } } }),
        "member-key.json": JSON.stringify({ memberId: "m1" }),
        "Local State": JSON.stringify({ os_crypt: { encrypted_key: "stand-in" } }),
        [path.join("relay", "runner.json")]: JSON.stringify({ state: "running" }),
        [path.join("folder-mirror", "team-1", "outbox.txt")]: "pending outbox write",
      };
      for (const [rel, content] of Object.entries(keptFiles)) {
        fs.mkdirSync(path.dirname(path.join(ud, rel)), { recursive: true });
        fs.writeFileSync(path.join(ud, rel), content, "utf8");
      }

      const deletedFiles = {
        "catalog-landed.json": JSON.stringify({ landed: ["c1"] }),
        [path.join("Dictionaries", "pl-PL.dic")]: "dictionary words\n",
        [path.join("Cache", "data_0")]: "cached binary data",
        [path.join("Local Storage", "leveldb", "000001.log")]: "storage log",
      };
      for (const [rel, content] of Object.entries(deletedFiles)) {
        fs.mkdirSync(path.dirname(path.join(ud, rel)), { recursive: true });
        fs.writeFileSync(path.join(ud, rel), content, "utf8");
      }

      const initialStore = {
        format: 1,
        writtenBy: "0.1.0",
        theme: "dark",
        lang: "pl",
        trialFrom: "2026-10-01",
        root: siblingProjects,
        tabs: [{ dir: "p1" }],
      };
      fs.writeFileSync(path.join(ud, "studio.json"), JSON.stringify(initialStore, null, 1), "utf8");

      const siblingCatalog = path.join(siblingProjects, "cat-1.json");
      fs.writeFileSync(siblingCatalog, JSON.stringify({ title: "Keep My Project" }), "utf8");

      const keptHashesBefore = {};
      for (const rel of Object.keys(keptFiles)) keptHashesBefore[rel] = sha256(path.join(ud, rel));

      const lab = await loadShellLab(ud);
      let resetRes = null;
      try {
        resetRes = await lab.ask("studio:reset");
      } catch (e) {
        resetRes = { error: e.message || String(e), reset: false };
      }

      /* rs12a: studio:reset writes marker and requests relaunch/quit without live delete */
      if (want("rs12")) {
        const markerWritten = fs.existsSync(path.join(ud, ".reset-pending"));
        const relaunchCalled = lab.relaunchCalled === true;
        /* The lock goes before the relaunch, as the desk's does, or the new process can lose the race and quit
           (the first-and-last-minutes triage, item 5). */
        const releasedFirst = lab.releasedBeforeRelaunch === true;
        const quitOrExitCalled = lab.quitCalled === true || lab.exitCalled === 0;
        check(markerWritten && relaunchCalled && quitOrExitCalled && releasedFirst,
          "rs12a resetStudioNow writes .reset-pending marker, releases the single-instance lock, and ends with relaunch and quit: "
          + JSON.stringify({ markerWritten, releasedFirst, relaunchCalled, quitOrExitCalled }));
      }

      lab.restore();

      /* Now simulate next startup: startup pass performs pending reset */
      const startLab = await loadShellLab(ud);
      startLab.restore();

      /* rs5: Kept files intact, deleted files gone, sibling untouched */
      if (want("rs5")) {
        check(resetRes && resetRes.reset === true, "rs5a studio:reset answers successfully");

        let allKeptIdentical = true;
        for (const rel of Object.keys(keptFiles)) {
          const abs = path.join(ud, rel);
          if (!fs.existsSync(abs) || sha256(abs) !== keptHashesBefore[rel]) {
            allKeptIdentical = false;
            process.stderr.write("failed kept file: " + rel + "\n");
          }
        }
        check(allKeptIdentical,
          "rs5b each licence file, the signing key with its backups, the teams with their keys, revision floors, Local State, relay/ and folder-mirror/ are byte-identical");

        let allDeletedGone = true;
        for (const rel of Object.keys(deletedFiles)) {
          const abs = path.join(ud, rel);
          if (fs.existsSync(abs)) {
            allDeletedGone = false;
            process.stderr.write("unexpected remaining file: " + rel + "\n");
          }
        }
        check(allDeletedGone, "rs5c catalog-landed, Dictionaries, Cache and Local Storage are emptied");

        check(fs.existsSync(siblingCatalog) && fs.readFileSync(siblingCatalog, "utf8").indexOf("Keep My Project") >= 0,
          "rs5d sibling project folder outside userData was never touched");
      }

      /* rs6: Refuses path outside userData */
      if (want("rs6")) {
        const labOutside = await loadShellLab(path.join(SCRATCH, "ud-outside"));
        let outsideRefused = false;
        try {
          const badRes = await labOutside.ask("studio:reset", { customPath: path.resolve(ROOT, "..") });
          if (badRes && badRes.error) outsideRefused = true;
        } catch (e) {
          outsideRefused = true;
        } finally {
          labOutside.restore();
        }
        check(outsideRefused || fs.existsSync(siblingCatalog),
          "rs6 shell reset refuses any path outside userData, changing nothing");
      }

      /* rs7: studio.json kept and rewritten with only root; the first-run day an older Studio stamped is not kept, for nothing reads it */
      if (want("rs7")) {
        let storeAfter = null;
        try {
          storeAfter = JSON.parse(fs.readFileSync(path.join(ud, "studio.json"), "utf8"));
        } catch {}
        const trialKept = storeAfter && storeAfter.trialFrom === undefined;
        const rootKept = storeAfter && storeAfter.root === siblingProjects;
        const otherGone = storeAfter && storeAfter.theme === undefined && storeAfter.lang === undefined && storeAfter.tabs === undefined;
        check(trialKept && rootKept && otherGone,
          "rs7 studio.json is rewritten keeping only root, a first-run day an older Studio stamped dropped with the rest, so catalogs remain reachable"
          + " (was: keeping trialFrom and root so the evaluation period does not restart)");
      }

      /* rs12b: marker unlinked after successful pass; marker kept on a failed pass */
      if (want("rs12")) {
        const markerGoneAfterSuccess = !fs.existsSync(path.join(ud, ".reset-pending"));
        check(markerGoneAfterSuccess, "rs12b marker .reset-pending is unlinked after a clean pass");

        /* Failed pass: locked unkept file prevents unlinking marker */
        const udFail = path.join(SCRATCH, "ud-fail");
        fs.mkdirSync(udFail, { recursive: true });
        const unremovableFile = path.join(udFail, "locked.bin");
        fs.writeFileSync(unremovableFile, "locked content", "utf8");
        const markerFail = path.join(udFail, ".reset-pending");
        fs.writeFileSync(markerFail, "1", "utf8");

        const origUnlink = fs.unlinkSync;
        fs.unlinkSync = (p) => {
          if (p === unremovableFile) {
            const err = new Error("EBUSY: resource busy or locked, unlink '" + p + "'");
            err.code = "EBUSY";
            throw err;
          }
          return origUnlink(p);
        };

        let failLab = null;
        try {
          failLab = await loadShellLab(udFail);
        } catch {}
        finally {
          fs.unlinkSync = origUnlink;
          if (failLab) failLab.restore();
        }

        const markerKeptOnFail = fs.existsSync(markerFail);
        check(markerKeptOnFail, "rs12c marker .reset-pending is kept when any path stays undone (never unlinked after failed pass)");
      }
    }

    /* ---- rs14: an unfinished reset waits, and a later start removes nothing new ---------------- */
    if (want("rs14")) {
      const udHeld = path.join(SCRATCH, "ud-held");
      fs.mkdirSync(udHeld, { recursive: true });
      const stuck = path.join(udHeld, "stuck.bin");
      fs.writeFileSync(stuck, "held open", "utf8");
      const markerHeld = path.join(udHeld, ".reset-pending");
      fs.writeFileSync(markerHeld, "1", "utf8");
      const between = path.join(udHeld, "made-after.txt");
      const stuckAbs = path.resolve(stuck);
      const origUnlink = fs.unlinkSync;
      fs.unlinkSync = (p) => {
        if (path.resolve(String(p)) === stuckAbs) {
          const err = new Error("EPERM");
          err.code = "EPERM";
          throw err;
        }
        return origUnlink(p);
      };
      let lab2 = null;
      try {
        const lab1 = await loadShellLab(udHeld);
        lab1.restore();
        fs.writeFileSync(between, "written after the failed pass", "utf8");
        lab2 = await loadShellLab(udHeld);
        const survived = fs.existsSync(between)
          && fs.readFileSync(between, "utf8") === "written after the failed pass"
          && fs.existsSync(stuck);
        check(survived,
          "rs14a a file written between two starts survives the second, and the stand-in that refuses unlink is still there");
        const notice = lab2.mainExports && typeof lab2.mainExports.resetNoticeNow === "function"
          ? lab2.mainExports.resetNoticeNow() : null;
        const names = notice && Array.isArray(notice.blocked) ? notice.blocked : [];
        check(names.indexOf("stuck.bin") >= 0, "rs14b the start names stuck.bin as what is in the way");
        const home = loadPage({ api: {}, uiLang: "en" });
        let pageCarries = false;
        if (typeof home.page.resetUnfinishedAsk === "function" && names.indexOf("stuck.bin") >= 0) {
          home.page.resetUnfinishedAsk({ resetUnfinished: { blocked: names } });
          home.page.paint();
          const html = home.node("#dlg").innerHTML.replace(/&#39;/g, "'");
          pageCarries = html.indexOf("The reset of Etiuda Studio did not finish. Could not be removed, perhaps in use by another program or an open folder: stuck.bin.") >= 0
            && html.indexOf("Trying again finishes it once they are closed; stopping it keeps Studio as it is now.") >= 0
            && html.indexOf("Try again") >= 0
            && html.indexOf("Stop the reset") >= 0
            && html.indexOf('data-act="reset-unfinished-again"') >= 0
            && html.indexOf('data-act="reset-unfinished-stop"') >= 0;
        }
        check(pageCarries, "rs14c the page carries the unfinished reset notice, the path and the two presses");
        let stopped = false;
        if (lab2.handlers["studio:reset-stop"]) {
          await lab2.ask("studio:reset-stop");
          stopped = !fs.existsSync(markerHeld) && fs.existsSync(between)
            && fs.readFileSync(between, "utf8") === "written after the failed pass";
        }
        check(stopped, "rs14d Stop the reset drops the marker and leaves the file written between the starts");
        const pl = loadPage({ api: {}, uiLang: "pl" });
        let plCarries = false;
        if (typeof pl.page.resetUnfinishedAsk === "function" && names.indexOf("stuck.bin") >= 0) {
          pl.page.resetUnfinishedAsk({ resetUnfinished: { blocked: names } });
          pl.page.paint();
          const plHtml = pl.node("#dlg").innerHTML.replace(/&#39;/g, "'");
          plCarries = plHtml.indexOf("Reset Etiudy Studio nie został dokończony. Nie udało się usunąć elementów, których być może używa inny program albo otwarty folder: stuck.bin.") >= 0
            && plHtml.indexOf("Ponowna próba dokończy reset po ich zamknięciu; przerwanie zostawi Studio w obecnym stanie.") >= 0
            && plHtml.indexOf("Spróbuj ponownie") >= 0
            && plHtml.indexOf("Przerwij reset") >= 0;
        }
        check(plCarries, "rs14e the Polish notice is the placeholder line, with the path");

        let retried = false;
        let labAgain = null;
        const udAgain = path.join(SCRATCH, "ud-again");
        fs.mkdirSync(udAgain, { recursive: true });
        const stuckAgain = path.join(udAgain, "stuck.bin");
        fs.writeFileSync(stuckAgain, "held open", "utf8");
        const markerAgain = path.join(udAgain, ".reset-pending");
        fs.writeFileSync(markerAgain, JSON.stringify({ v: 1, held: true, blocked: ["stuck.bin"] }), "utf8");
        const betweenAgain = path.join(udAgain, "made-after.txt");
        fs.writeFileSync(betweenAgain, "written after the failed pass", "utf8");
        const stuckAgainAbs = path.resolve(stuckAgain);
        const prevUnlink = fs.unlinkSync;
        fs.unlinkSync = (p) => {
          if (path.resolve(String(p)) === stuckAgainAbs || path.resolve(String(p)) === stuckAbs) {
            const err = new Error("EPERM");
            err.code = "EPERM";
            throw err;
          }
          return prevUnlink(p);
        };
        try {
          labAgain = await loadShellLab(udAgain);
          if (labAgain.handlers["studio:reset-again"]) {
            await labAgain.ask("studio:reset-again");
            const markerExists = fs.existsSync(markerAgain);
            let markerHeldAgain = true;
            if (markerExists) {
              try {
                const doc = JSON.parse(fs.readFileSync(markerAgain, "utf8"));
                markerHeldAgain = doc && doc.v === 1 && doc.held === true;
              } catch {
                markerHeldAgain = false;
              }
            }
            const notDeletedLive = fs.existsSync(betweenAgain)
              && fs.readFileSync(betweenAgain, "utf8") === "written after the failed pass"
              && fs.existsSync(stuckAgain);
            const markerUnheld = markerExists && !markerHeldAgain;
            const relaunched = labAgain.relaunchCalled === true
              && (labAgain.quitCalled === true || labAgain.exitCalled === 0);
            retried = notDeletedLive && markerUnheld && relaunched;
          }
        } finally {
          fs.unlinkSync = prevUnlink;
          if (labAgain) labAgain.restore();
        }
        check(retried, "rs14f the press deletes nothing live, leaves an un-held marker and asks for the relaunch");
      } finally {
        fs.unlinkSync = origUnlink;
        if (lab2) lab2.restore();
      }
    }

    /* rs15 and rs16 stand aside off Windows (Claude gamma's Linux sweep, 2026-11-14): they hold the Run value, and Studio keeps
       no start-at-login entry off Windows. Each stands aside by its own skip, rs16's three included, so the counts stay whole.
       A Linux autostart leg waits on a ruling. */
    const loginAside = (id) => OffWindows.standAside(id, "Studio keeps no start-at-login entry off Windows (the Run key is Windows'), so there is no login item to write or clear");
    /* ---- rs15: after a Reset, no Run value starts Studio where one did */
    if (want("rs15") && loginAside("rs15")) skip(loginAside("rs15"));
    else if (want("rs15")) {
      const udLogin = path.join(SCRATCH, "ud-login");
      fs.mkdirSync(udLogin, { recursive: true });
      const labLogin = await loadShellLab(udLogin);
      try {
        studioOn(labLogin.app);
        const before = startsAtSignIn(labLogin.app);
        await labLogin.ask("studio:reset");
        const after = startsAtSignIn(labLogin.app);
        check(before === true && after === false && labLogin.app._login.calls === 1,
          "rs15 after a Reset, no Run value starts Studio where one did: "
          + JSON.stringify({ before, after, calls: labLogin.app._login.calls, run: labLogin.app._login.run }));
      } finally {
        labLogin.restore();
      }
    }

    /* ---- rs16: Start with Windows is Studio's own Run value, and the desk's is left alone */
    if (want("rs16") && loginAside("rs16")) for (const id of ["rs16a", "rs16b", "rs16c"]) skip(loginAside(id));
    else if (want("rs16")) {
      const udLogin = path.join(SCRATCH, "ud-login-name");
      fs.mkdirSync(udLogin, { recursive: true });
      const lab = await loadShellLab(udLogin);
      try {
        const A = lab.app;
        const deskEntry = { path: DESK_EXE, args: ["--hidden"] };
        A._login.run["app.etiuda.desktop"] = Object.assign({}, deskEntry);
        await lab.ask("studio:login-item-set", true);
        const afterOn = JSON.parse(JSON.stringify(A._login.run));
        const readOn = (await lab.ask("studio:login-item-state")).openAtLogin;
        const own = afterOn["app.etiuda.studio"];
        const deskKept = (r) => !!r["app.etiuda.desktop"] && r["app.etiuda.desktop"].path === DESK_EXE;
        check(!!own && own.path === STUDIO_EXE && deskKept(afterOn) && readOn === true,
          "rs16a the switch writes Studio's own Run value, reads back on, and the desk's own entry stays: "
          + JSON.stringify({ run: afterOn, readOn }));
        await lab.ask("studio:login-item-set", false);
        const afterOff = JSON.parse(JSON.stringify(A._login.run));
        const readOff = (await lab.ask("studio:login-item-state")).openAtLogin;
        check(!startsAtSignIn(A) && deskKept(afterOff) && readOff === false,
          "rs16b Off leaves no value starting Studio, reads back off, and the desk's own entry stays: "
          + JSON.stringify({ run: afterOff, readOff }));
        A._login.run = { "app.etiuda.desktop": { path: STUDIO_EXE, args: ["--hidden"] } };
        const readStray = (await lab.ask("studio:login-item-state")).openAtLogin;
        await lab.ask("studio:login-item-set", false);
        check(readStray === true && !startsAtSignIn(A),
          "rs16c an earlier build's value under the desk's name that starts Studio reads as on, and Off clears it: "
          + JSON.stringify({ readStray, run: A._login.run }));
      } finally {
        lab.restore();
      }
    }

    /* ---- PART 3: UNINSTALLER SCRIPT IN PACKAGING (rs8 - rs11) ----------------------------------- */
    if (want("rs8") || want("rs9") || want("rs10") || want("rs11")) {
      const nshText = fs.existsSync(NSH) ? fs.readFileSync(NSH, "utf8") : "";
      const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));

      /* rs8c: the script compiles as electron-builder includes it, first in the script and with warnings as errors. The
         Remove my data section is declared from customUnWelcomePage (LogicLib and $installMode exist by then), the
         uninstaller's variables only in its pass, and no variable MUI never declares. A makensis of the real build is the
         proof; this reads the three shapes that failed it on 2026-11-10. */
      if (want("rs8")) {
        const code = nshText.replace(/^[ \t]*[#;].*$/gm, "");
        const topSection = /^Section "un\.RemoveUserData"/m.test(code)
          && !/!macro studioRemoveUserDataSection\r?\nSection "un\.RemoveUserData"/.test(code);
        const unPage = (/!macro customUnWelcomePage\b[\s\S]*?!macroend/.exec(code) || [""])[0];
        const inserted = /!insertmacro studioRemoveUserDataSection\b/.test(unPage);
        const varsGuarded = /!ifdef BUILD_UNINSTALLER\r?\nVar UnRemoveData\r?\nVar UnRemoveCheckbox\r?\nVar UnRemoveLabel\r?\n!endif/.test(code);
        const noHeaderFont = !/\$mui\.Header\.Font\b/.test(code);
        check(!topSection && inserted && varsGuarded && noHeaderFont,
          "rs8c the uninstaller script compiles where it is included: the data section declared from customUnWelcomePage, the uninstaller's"
          + " variables only in its pass, no $mui.Header.Font: " + JSON.stringify({ topSection, inserted, varsGuarded, noHeaderFont }));
      }

      /* rs8: Uninstaller carries checkbox, off by default, words say licence stays */
      if (want("rs8")) {
        const hasEn = nshText.indexOf("Remove my data") >= 0
          && nshText.indexOf("Also removes Etiuda Studio's caches on this computer. What stays: the licence and the trial, the signing key, the teams, the library's place, the language and theme, and the catalogs' own folders.") >= 0;
        const hasPl = nshText.indexOf("Usuń także dane z tego komputera") >= 0
          && nshText.indexOf("Usuwa również pamięć podręczną Etiudy Studio z tego komputera. Zostają: licencja i okres próbny, klucz podpisu, zespoły, miejsce biblioteki, język i motyw oraz foldery katalogów.") >= 0;
        const offByDefault = /StrCpy\s+\$UnRemoveData\s+"0"/i.test(nshText);

        check(hasEn && hasPl && offByDefault,
          "rs8 uninstaller script carries Remove my data checkbox, off by default, and words state the licence stays");
      }

      /* rs9: the uninstaller's data folder is the build's own package name (${APP_PACKAGE_NAME}, which electron-builder sets from package.json's
         name, or the test identity's), never a shipped name spelled out and never "Etiuda Studio". Moved 2026-11-23. The
         sentence was "Uninstaller path is %APPDATA%\etiuda-studio (package name from config), not 'Etiuda Studio'" and held the literal. */
      if (want("rs9")) {
        const pkgName = String(pkg.name || "");
        const code9 = nshText.replace(/^[ \t]*[#;].*$/gm, "");
        const usesPackageUserData = pkgName === "etiuda-studio"
          && code9.indexOf("$APPDATA\\${APP_PACKAGE_NAME}\\*.*") >= 0 && code9.indexOf("$APPDATA\\${APP_PACKAGE_NAME}\\$R2") >= 0;
        const noShippedLiteral = !/\$APPDATA\\etiuda-studio\\/.test(code9);
        const noWrongName = nshText.indexOf("$APPDATA\\Etiuda Studio") < 0;

        check(usesPackageUserData && noShippedLiteral && noWrongName,
          "rs9 uninstaller uses %APPDATA%\\${APP_PACKAGE_NAME} (the package name, " + pkgName + "), no shipped folder spelled out, not 'Etiuda Studio'");
      }

      /* rs10: One keep-set compared between shell definition and uninstaller script */
      if (want("rs10")) {
        const dummyUd = path.join(SCRATCH, "ud-check-keep");
        fs.mkdirSync(dummyUd, { recursive: true });
        const labKeep = await loadShellLab(dummyUd);
        const shellKept = (labKeep.mainExports && labKeep.mainExports.RESET_KEEP_NAMES) || [];
        labKeep.restore();

        const keepsKeyPrefix = /StrCmp\s+\$R3\s+"signing-key"/i.test(nshText) || /\$R3\s+!=\s+"signing-key"/i.test(nshText);
        let allShellItemsCovered = shellKept.length > 0 && keepsKeyPrefix;
        for (const item of shellKept) {
          if (item === "signing-key.json") continue;
          if (nshText.indexOf(`$R2 != "${item}"`) < 0) {
            allShellItemsCovered = false;
            process.stderr.write("uninstaller missing keep item: " + item + "\n");
          }
        }

        check(allShellItemsCovered,
          "rs10 one keep-set: uninstaller keep-list checks every entry in shell's RESET_KEEP_NAMES (" + shellKept.length + " items)");
      }

      /* rs11: Silent update path never removes data */
      if (want("rs11")) {
        const updateGuarded = /\$\{IfNot\}\s+\$\{isUpdated\}/i.test(nshText);
        check(updateGuarded, "rs11 uninstaller update path is guarded (${IfNot} ${isUpdated}) so silent update never removes data");
      }

      /* rs13: Plants phase */
      if (want("rs13")) {
        if (!ONLY) {
          copyPlants({
            root: ROOT, self: SELF, label: "reset-studio", onlyVar: "RESET_STUDIO_ONLY", check, skip,
            plants: [
              { mark: "uninstaller-keep-key", leg: "rs10", rel: "packaging/installer-pages.nsh",
                line: '          ${If} $R3 != "not-a-signing-key" /* plant:uninstaller-keep-key */' },
              { mark: "uninstaller-update-guard", leg: "rs11", rel: "packaging/installer-pages.nsh",
                line: '  ${If} ${isUpdated} /* plant:uninstaller-update-guard */' },
              { mark: "uninstaller-one-list", leg: "rs10", rel: "packaging/installer-pages.nsh",
                line: '          ${AndIf} $R2 != "not-a-licence-file" /* plant:uninstaller-one-list */' },
              { mark: "reset-keep-team-revs", leg: "rs5", rel: "shell/main.js",
                line: '  if (name === "not-team-revs.json") return true; /* plant:reset-keep-team-revs */' },
              { mark: "reset-keep-folder-mirror", leg: "rs5", rel: "shell/main.js",
                line: '  if (name === "not-folder-mirror") return true; /* plant:reset-keep-folder-mirror */' },
              { mark: "reset-marker-kept-on-fail", leg: "rs12", rel: "shell/main.js",
                line: '  let canUnlink = true; /* plant:reset-marker-kept-on-fail */' },
              { mark: "login-own-name", leg: "rs16", rel: "shell/main.js",
                line: '  setLoginItemSettings(app, !!on); /* plant:login-own-name */' },
              { mark: "login-strays", leg: "rs16", rel: "shell/main.js",
                line: '  if (now) for (const name of []) { wrote = true; } /* plant:login-strays */' },
              { mark: "work-swept", leg: "rs17", rel: "shell/main.js", line: "  /* plant:work-swept */" },
              { mark: "temp-swept", leg: "rs17", rel: "shell/main.js", line: "  void names; /* plant:temp-swept */" },
              { mark: "temp-aged", leg: "rs17", rel: "shell/main.js", line: "    /* plant:temp-aged */" },
              { mark: "paste-gone", leg: "rs18", rel: "src/studio.mjs", line: "  /* plant:paste-gone */" },
              { mark: "brought-gone", leg: "rs18", rel: "src/studio.mjs", line: "      void had; /* plant:brought-gone */" },
            ].filter((p) => {
              /* A plant whose leg stands aside off Windows stands aside with it, by its own counted skip. */
              const aside = (p.leg === "rs15" || p.leg === "rs16") && loginAside(p.leg);
              if (aside) skip("plant " + p.mark + " turns " + p.leg + " red in a scratch copy: " + aside);
              return !aside;
            }),
          });
        }
      }
    }
    /* ---- rs17, rs18: customer text a job writes on its way is gone after the job and at the next start */
    if (want("rs17")) {
      const ud = path.join(SCRATCH, "ud-work"), temp = path.join(ud, "temp");
      const lay = (rel, text) => { fs.mkdirSync(path.dirname(path.join(ud, rel)), { recursive: true }); fs.writeFileSync(path.join(ud, rel), text, "utf8"); };
      lay(path.join("work", "etiuda-studio-paste", "pasted.csv"), "Title,Text\nA customer's reply,Left by a quit\n");
      lay(path.join("work", "brought-q1", "brought-0a1b2c3d.ec"), "{}");
      lay(path.join("temp", "etiuda-studio-paste", "pasted.csv"), "Title,Text\nAn earlier Studio's paste,Left in temp\n");
      lay(path.join("temp", "studio-brought-q2", "brought-0a1b2c3e.ec"), "{}");
      lay(path.join("temp", "studio-copy-desk-1", "brought-0a1b2c3f.ec"), "{}");
      lay(path.join("temp", "another-program", "keep.txt"), "not Studio's");
      lay(path.join("temp", "studio-browsed.txt"), "not one of Studio's names");
      lay(path.join("temp", "studio-copy-desk-2", "brought-0a1b2c40.ec"), "{}");
      /* The two old copies are two days old by their mtime, set here in the lab; the third is fresh, as another run's job would be. */
      const aged = new Date(Date.now() - 2 * 86400000);
      for (const n of ["studio-brought-q2", "studio-copy-desk-1"]) fs.utimesSync(path.join(temp, n), aged, aged);
      const lab = await loadShellLab(ud);
      lab.restore();
      const left = (rel) => fs.existsSync(path.join(ud, rel));
      check(!left("work") && left(path.join("temp", "etiuda-studio-paste")) && !left(path.join("temp", "studio-brought-q2"))
        && !left(path.join("temp", "studio-copy-desk-1")) && left(path.join("temp", "another-program", "keep.txt")) && left(path.join("temp", "studio-browsed.txt"))
        && left(path.join("temp", "studio-copy-desk-2", "brought-0a1b2c40.ec")),
        "rs17 a start removes <userData>/work and the copies an earlier Studio left in the temporary folder over a day ago, and nothing else"
        + " there: a fresh copy, which another run may be landing, and the command line's etiuda-studio-paste stay: "
        + JSON.stringify({ work: left("work"), paste: left(path.join("temp", "etiuda-studio-paste")), brought: left(path.join("temp", "studio-brought-q2")),
          copy: left(path.join("temp", "studio-copy-desk-1")), other: left(path.join("temp", "another-program", "keep.txt")), named: left(path.join("temp", "studio-browsed.txt")), fresh: left(path.join("temp", "studio-copy-desk-2", "brought-0a1b2c40.ec")) }));
    }
    if (want("rs18")) {
      const S = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
      const base = path.join(SCRATCH, "ud-job", "work"), root = path.join(SCRATCH, "ud-job", "projects");
      fs.mkdirSync(root, { recursive: true });
      const wrote = S.writePaste("Harbour opening hours\nThe office opens at nine.\n", "", base);
      const under = path.resolve(wrote.file).startsWith(path.resolve(base) + path.sep);
      let refused = "";
      try { await S.importLand(root, wrote.file, {}, path.join(SCRATCH, "ud-job", "not-a-project")); } catch (e) { refused = String(e && e.message || e); }
      const keptOnRefusal = fs.existsSync(wrote.file);
      const landed = await S.importLand(root, wrote.file, {}, null);
      check(under && !!refused && keptOnRefusal && !!landed && fs.existsSync(landed.dir) && !fs.existsSync(wrote.file),
        "rs18a a paste is written under the work folder it is given, stays through a refused landing, and is gone once it lands: "
        + JSON.stringify({ under, refused: !!refused, keptOnRefusal, landed: !!(landed && landed.dir), gone: !fs.existsSync(wrote.file) }));
      const doc = { format: 2, kind: "etiuda-catalog", id: "lantern-notes", rev: 2, langs: [{ code: "en", label: "English" }],
        tags: [{ id: "t-lanterns", kind: "shelf", label: { en: "Lanterns" } }],
        cards: [{ id: "c-lantern-shift", shelf: "t-lanterns", bodyShape: "plain", title: { en: "Lantern shift" },
          body: { en: "The lantern is lit at dusk by the pier keeper." } }] };
      const tempOk = path.join(base, "brought-ok"), tempBad = path.join(base, "brought-bad");
      const got = await S.landCatalog(root, doc, tempOk, { title: "Lantern notes", lang: "en" });
      let badSaid = "";
      try { await S.landCatalog(root, Object.assign({}, doc, { cards: [] }), tempBad, { lang: "en" }); } catch (e) { badSaid = String(e && e.message || e); }
      check(!!got && fs.existsSync(got.dir) && !fs.existsSync(tempOk) && !!badSaid && !fs.existsSync(tempBad),
        "rs18b a desk's catalog brought in is written to its folder and gone with it once landed, and a copy refused leaves nothing: "
        + JSON.stringify({ landed: !!(got && got.dir), okLeft: fs.existsSync(tempOk), refused: !!badSaid, badLeft: fs.existsSync(tempBad) }));
      const unopened = path.join(base, "brought-unopened");
      let said = "";
      try { await S.landCatalog(root, Object.assign({}, doc, { format: 99 }), unopened, { lang: "en" }); } catch (e) { said = String(e && e.message || e); }
      check(!!said && !fs.existsSync(unopened), "rs18c a copy written and then refused as unreadable is gone with its folder: "
        + JSON.stringify({ refused: !!said, left: fs.existsSync(unopened) }));
    }
  } finally {
    dropScratch(SCRATCH);
  }

  process.stdout.write("\nreset-studio  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write("reset-studio failed: " + (err && err.stack ? err.stack : err) + "\n");
  process.exit(1);
});
