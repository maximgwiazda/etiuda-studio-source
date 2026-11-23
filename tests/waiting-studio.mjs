/* THE NOTIFICATIONS, WAITING PROPOSALS AND REQUESTS, BADGE, AND TRAY ROWS FOR STUDIO.
 *
 * gate-kind: node
 *
 *   node tests/waiting-studio.mjs
 *
 * Runs in bare node with Electron stand-ins.
 * British English, no em or en dashes.
 */
import "./reg-stand-on.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { clearScratch, dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nodeRequire = createRequire(import.meta.url);

let checks = 0, failed = 0;
function check(ok, what) {
  checks++;
  if (ok) {
    console.log("  ok   " + what);
  } else {
    failed++;
    console.log("  FAIL " + what);
  }
}

function makeFakeElectron() {
  const notifications = [];
  class FakeNotification {
    constructor(opts) {
      this.opts = opts;
      this.shown = false;
      this._handlers = {};
      notifications.push(this);
    }
    on(event, handler) {
      this._handlers[event] = handler;
      return this;
    }
    show() {
      this.shown = true;
    }
    click() {
      if (this._handlers.click) this._handlers.click();
    }
  }

  const fakeApp = {
    _appUserModelId: null,
    setAppUserModelId(id) {
      this._appUserModelId = id;
    },
  };

  return {
    app: fakeApp,
    Notification: FakeNotification,
    _notifications: notifications,
  };
}

/* Every file under `root`, by sha256. A new file and a changed file both show. */
function treeBytes(root) {
  const out = {};
  const walk = (dir) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const ent of entries) {
      const at = path.join(dir, ent.name);
      const rel = path.relative(root, at).split(path.sep).join("/");
      if (ent.isDirectory()) walk(at);
      else if (ent.isFile()) out[rel] = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex");
    }
  };
  walk(root);
  return out;
}

/* The shell, with the single-instance lock refused so whenReady does not run. The leg calls the waiting check itself. */
function loadWaitingShell(ud, projectsDir) {
  const Module = nodeRequire("node:module");
  const main = path.join(ROOT, "shell", "main.js");
  const noop = () => {};
  const electron = {
    app: {
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud,
      getVersion: () => "0.0.0",
      getLocale: () => "en-GB",
      requestSingleInstanceLock: () => false,
      whenReady: () => new Promise(noop),
      on() {},
      quit() {},
      exit() {},
    },
    BrowserWindow: function Win() {},
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    Notification: function Note() {},
    Tray: function T() {},
    clipboard: { writeText() {} },
    dialog: {},
    nativeImage: { createFromPath: () => null },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    safeStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (s) => Buffer.from(String(s)),
      decryptString: (b) => Buffer.from(b).toString("utf8"),
    },
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({}), on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {},
      setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle() {}, on() {} },
  };
  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = {
    execFileSync: () => "", execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => quiet, spawn: () => quiet, exec: () => quiet, fork: () => quiet,
  };
  const env = {
    STUDIO_NO_PROXY_SERVER: "off",
    STUDIO_TEST_OFFSCREEN: "1",
    STUDIO_PROJECTS: projectsDir,
  };
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }
  const load = Module._load;
  const before = new Set(Object.keys(nodeRequire.cache));
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    return load.apply(this, arguments);
  };
  const dropCache = () => {
    delete nodeRequire.cache[main];
    for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k];
  };
  const restore = () => {
    Module._load = load;
    dropCache();
    for (const k of Object.keys(was)) {
      if (was[k] === undefined) delete process.env[k];
      else process.env[k] = was[k];
    }
  };
  let mod = null;
  try {
    dropCache();
    mod = nodeRequire(main);
  } catch (e) {
    restore();
    throw e;
  }
  return {
    check: () => (mod && typeof mod.checkWaitingSafe === "function" ? mod.checkWaitingSafe() : Promise.reject(new Error("no waiting check"))),
    done: async () => {
      try { if (mod && typeof mod.endRelay === "function") await mod.endRelay(); } catch { /* already down */ }
      restore();
    },
  };
}

async function run() {
  /* ws1: src/waiting.mjs exists and exports waiting helpers */
  const waitingPath = path.join(ROOT, "src", "waiting.mjs");
  const waitingExists = fs.existsSync(waitingPath);
  check(waitingExists, "ws1a src/waiting.mjs exists");

  if (!waitingExists) {
    console.log("  FAIL remaining checks blocked: src/waiting.mjs does not exist yet");
    console.log("\n#counts checks=" + checks + " failures=" + (failed + 18));
    process.exit(1);
  }

  const waitingMod = await import("../src/waiting.mjs");
  const {
    countWaiting,
    checkWaiting,
    formatWaitingWord,
    WAITING_WORDS,
  } = waitingMod;

  check(typeof countWaiting === "function", "ws1b countWaiting is exported as a function");
  check(typeof checkWaiting === "function", "ws1c checkWaiting is exported as a function");

  /* Mock data for catalogs, proposals, and requests */
  const catalog1 = { dir: "/catalogs/cat1", name: "Harbourlight Insurance" };
  const catalog2 = { dir: "/catalogs/cat2", name: "Northwind Bikes" };
  const projects = [catalog1, catalog2];

  const proposalsFor = {
    "/catalogs/cat1": {
      inbox: "/catalogs/cat1/inbox",
      proposals: [
        {
          file: "/catalogs/cat1/inbox/p1.ec",
          name: "Anna",
          ok: true,
          pending: 3,
          desk: { id: "desk-anna", name: "Anna" },
          proposes: { changes: 3, cards: 1 },
        },
      ],
    },
    "/catalogs/cat2": {
      inbox: "/catalogs/cat2/inbox",
      proposals: [
        {
          file: "/catalogs/cat2/inbox/p2.ec",
          name: "Marta",
          ok: true,
          pending: 1,
          desk: { id: "desk-marta", name: "Marta" },
          proposes: { changes: 0, cards: 2 },
        },
        {
          file: "/catalogs/cat2/inbox/p3-decided.ec",
          name: "Piotr",
          ok: true,
          pending: 0,
          desk: { id: "desk-piotr", name: "Piotr" },
          proposes: { changes: 1, cards: 0 },
        },
      ],
    },
  };

  const desksForMap = {
    "/catalogs/cat1": {
      team: {
        id: "team-alpha",
        name: "Harbourlight Team",
        roster: [
          { desk: { id: "desk-anna", name: "Anna" }, name: "Anna", id: "desk-anna", rosterName: "Anna" },
        ],
      },
      requests: [
        { id: "desk-req-1", name: "Tomasz", state: "asks" },
      ],
    },
    "/catalogs/cat2": {
      team: {
        id: "team-beta",
        name: "Northwind Team",
        roster: [
          { desk: { id: "desk-marta", name: "Marta" }, name: "Marta", id: "desk-marta", rosterName: "Marta" },
          { desk: { id: "desk-piotr", name: "Piotr" }, name: "Piotr", id: "desk-piotr", rosterName: "Piotr" },
        ],
      },
      requests: [],
    },
  };

  const listProposals = async (dir) => proposalsFor[dir] || { inbox: "", proposals: [] };
  const desksFor = async (dir) => desksForMap[dir] || { team: null, requests: [] };

  /* Leg 4: the badge count equals the Proposals and Team screens counts */
  const counts = await countWaiting({ projects, listProposals, desksFor, licencePaused: false });
  check(counts.proposalsWaiting === 2, "ws4a proposals count matches waiting proposals with pending > 0 (2)");
  check(counts.requestsWaiting === 1, "ws4b requests count matches waiting requests (1)");
  check(counts.totalWaiting === 3, "ws4c total badge count equals proposals plus requests (3)");

  /* Leg 5: nothing toasts while the licence pauses proposals */
  const fakeElec5 = makeFakeElectron();
  const store5 = { told: [] };
  const resPaused = await checkWaiting({
    electron: fakeElec5,
    projects,
    listProposals,
    desksFor,
    licencePaused: true,
    store: store5,
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElec5._notifications.length === 0, "ws5a nothing toasts while licence pauses proposals");

  /* Leg 1: a new proposal toasts once, across a restart too */
  const fakeElec1 = makeFakeElectron();
  let savedStore = { told: [] };
  const writeStore = (s) => { savedStore = JSON.parse(JSON.stringify(s)); };

  const res1 = await checkWaiting({
    electron: fakeElec1,
    projects: [catalog1],
    listProposals,
    desksFor: async () => ({ team: desksForMap["/catalogs/cat1"].team, requests: [] }),
    licencePaused: false,
    store: savedStore,
    writeStore,
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });

  check(fakeElec1._notifications.length === 1, "ws1d new proposal toasts once");
  const notif1 = fakeElec1._notifications[0];
  check(notif1.opts.title === "Anna sent a proposal", "ws1e proposal toast title matches row 184");
  check(notif1.opts.body === "Harbourlight Insurance. Changed cards: 3 · new cards: 1.",
    "ws1f proposal toast body matches row 185");
  check(Array.isArray(savedStore.told) && savedStore.told.includes("/catalogs/cat1/inbox/p1.ec"),
    "ws1g proposal id is recorded in store");

  /* Second run: proposal is already told, should not toast again */
  const fakeElec1b = makeFakeElectron();
  await checkWaiting({
    electron: fakeElec1b,
    projects: [catalog1],
    listProposals,
    desksFor: async () => ({ team: null, requests: [] }),
    licencePaused: false,
    store: savedStore,
    writeStore,
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElec1b._notifications.length === 0, "ws1h proposal does not toast again on second run");

  /* Across restart: fresh store object with the saved told array */
  const restartStore = JSON.parse(JSON.stringify(savedStore));
  const fakeElecRestart = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecRestart,
    projects: [catalog1],
    listProposals,
    desksFor: async () => ({ team: null, requests: [] }),
    licencePaused: false,
    store: restartStore,
    writeStore,
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElecRestart._notifications.length === 0, "ws1i proposal does not toast again across restart");

  /* Leg 2: a new request the same (toasts once, across restart too) */
  const fakeElec2 = makeFakeElectron();
  let savedStore2 = { told: [] };
  const writeStore2 = (s) => { savedStore2 = JSON.parse(JSON.stringify(s)); };

  await checkWaiting({
    electron: fakeElec2,
    projects: [catalog1],
    listProposals: async () => ({ inbox: "", proposals: [] }),
    desksFor,
    licencePaused: false,
    store: savedStore2,
    writeStore: writeStore2,
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });

  check(fakeElec2._notifications.length === 1, "ws2a new request toasts once");
  const notif2 = fakeElec2._notifications[0];
  check(notif2.opts.title === "Tomasz asks to join Harbourlight Team", "ws2b request toast title matches row 186");
  check(notif2.opts.body === "It waits on the Team screen.", "ws2c request toast body matches row 187");
  check(savedStore2.told.some((id) => id.includes("desk-req-1")), "ws2d request id is recorded in store");

  const fakeElec2b = makeFakeElectron();
  await checkWaiting({
    electron: fakeElec2b,
    projects: [catalog1],
    listProposals: async () => ({ inbox: "", proposals: [] }),
    desksFor,
    licencePaused: false,
    store: savedStore2,
    writeStore: writeStore2,
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElec2b._notifications.length === 0, "ws2e request does not toast again on second run");

  /* Leg 3: each switch silences its kind */
  const fakeElecSilenced = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecSilenced,
    projects,
    listProposals,
    desksFor,
    licencePaused: false,
    store: { trayNotes: false, told: [] },
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElecSilenced._notifications.length === 0, "ws3a trayNotes=false silences all notifications");

  const fakeElecNoProp = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecNoProp,
    projects,
    listProposals,
    desksFor,
    licencePaused: false,
    store: { notifyProposals: false, notifyRequests: true, told: [] },
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElecNoProp._notifications.length === 1 && fakeElecNoProp._notifications[0].opts.title.includes("asks to join"),
    "ws3b notifyProposals=false silences proposals while request toasts");

  const fakeElecNoReq = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecNoReq,
    projects,
    listProposals,
    desksFor,
    licencePaused: false,
    store: { notifyProposals: true, notifyRequests: false, told: [] },
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElecNoReq._notifications.length === 2 && fakeElecNoReq._notifications.every((n) => n.opts.title.includes("sent a proposal")),
    "ws3c notifyRequests=false silences requests while proposals toast");

  /* Leg 6: a click opens the item */
  let openTarget = null;
  const fakeElecClick = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecClick,
    projects: [catalog1],
    listProposals,
    desksFor: async () => ({ team: null, requests: [] }),
    licencePaused: false,
    store: { told: [] },
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    onOpenItem: (target) => { openTarget = target; },
    lang: "en",
  });
  check(fakeElecClick._notifications.length === 1, "ws6a notification created for click test");
  fakeElecClick._notifications[0].click();
  check(openTarget && openTarget.where === "proposals" && openTarget.dir === catalog1.dir,
    "ws6b proposal click opens proposals for that catalog");

  let openTargetReq = null;
  const fakeElecClickReq = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecClickReq,
    projects: [catalog1],
    listProposals: async () => ({ inbox: "", proposals: [] }),
    desksFor,
    licencePaused: false,
    store: { told: [] },
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    onOpenItem: (target) => { openTargetReq = target; },
    lang: "en",
  });
  check(fakeElecClickReq._notifications.length === 1, "ws6c request notification created for click test");
  fakeElecClickReq._notifications[0].click();
  check(openTargetReq && openTargetReq.where === "desks" && openTargetReq.dir === catalog1.dir,
    "ws6d request click opens desks (Team screen) for that catalog");

  /* Leg 7: pre-rendered tray badge icons committed under packaging/tray/ */
  const trayBadgesScript = path.join(ROOT, "tools", "tray-badges.mjs");
  check(fs.existsSync(trayBadgesScript), "ws7a tools/tray-badges.mjs exists beside ico-png.mjs");

  const badgeLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "9+"];
  for (const label of badgeLabels) {
    const icoPath = path.join(ROOT, "packaging", "tray", `tray-${label}.ico`);
    const pngPath = path.join(ROOT, "packaging", "tray", `tray-${label}.png`);
    check(fs.existsSync(icoPath) && fs.existsSync(pngPath),
      `ws7b pre-rendered badge ${label} exists as .ico and .png in packaging/tray/`);
  }

  /* Polish words check */
  const langText = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  check(langText.includes("Powiadomienia od Etiudy Studio, także gdy okno programu jest zamknięte."),
    "ws8a ui/lang.js contains Notifications hint in Polish");
  check(langText.includes("Licznik na ikonie w zasobniku"),
    "ws8b ui/lang.js contains tray badge label in Polish");
  check(langText.includes("Ile spraw czeka na odpowiedź."),
    "ws8c ui/lang.js contains tray badge hint in Polish");
  check(langText.includes("Powiadamiaj, gdy"),
    "ws8d ui/lang.js contains Tell me when in Polish");
  check(langText.includes("Członek zespołu wysyła propozycję"),
    "ws8e ui/lang.js contains proposal switch in Polish");
  check(langText.includes("Ktoś prosi o dołączenie do zespołu"),
    "ws8f ui/lang.js contains request switch in Polish");
  check(langText.includes("Czekające propozycje: {N}"),
    "ws8g ui/lang.js contains tray proposals waiting in Polish");
  check(langText.includes("Czekające prośby o dołączenie: {N}"),
    "ws8h ui/lang.js contains tray requests waiting in Polish");
  check(langText.includes("Etiuda Studio: czeka: {N}"),
    "ws8i ui/lang.js contains tray tooltip waiting in Polish");
  check(langText.includes("Propozycja od członka zespołu: {NAME}"),
    "ws8j ui/lang.js contains proposal notification title in Polish");
  check(langText.includes("{CATALOG}. Zmienione karty: {C} · nowe karty: {N}."),
    "ws8k ui/lang.js contains proposal notification body in Polish");
  check(langText.includes("Prośba o dołączenie do zespołu {TEAM}: {NAME}"),
    "ws8l ui/lang.js contains request notification title in Polish");
  check(langText.includes("Czeka na ekranie Zespół."),
    "ws8m ui/lang.js contains request notification body in Polish");
  check(langText.includes("Nowa propozycja od członka zespołu"),
    "ws8n ui/lang.js contains nameless proposal toast title in Polish");

  /* Settings UI check */
  const appText = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  check(appText.includes("set-notifications") && appText.includes("set-tray-badge")
    && appText.includes("set-notify-proposals") && appText.includes("set-notify-requests"),
    "ws9a ui/app.js handles all 4 notification toggle actions");

  /* Leg 10: a proposal from a verified desk whose roster name is X toasts X even when the file's own origin names something else */
  const fakeElecLeg1 = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecLeg1,
    projects: [catalog1],
    listProposals: async () => ({
      inbox: "/catalogs/cat1/inbox",
      proposals: [
        {
          file: "/catalogs/cat1/desks/desk-anna/p-origin-other.ec",
          name: "OriginOther.ec",
          ok: true,
          pending: 1,
          desk: { id: "desk-anna", name: "Something Else Entirely" },
          proposes: { changes: 1, cards: 0 },
        },
      ],
    }),
    desksFor: async () => ({
      team: {
        id: "team-alpha",
        name: "Harbourlight Team",
        roster: [
          { desk: { id: "desk-anna", name: "Something Else Entirely" }, name: "Anna Roster", id: "desk-anna", rosterName: "Anna Roster" },
        ],
      },
      requests: [],
    }),
    licencePaused: false,
    store: { told: [] },
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElecLeg1._notifications.length === 1 && fakeElecLeg1._notifications[0].opts.title === "Anna Roster sent a proposal",
    "ws10a verified desk toasts roster name X even when file origin names something else");

  /* Leg 11: an unverified inbox file whose name and origin carry any text toasts the nameless title and none of that text */
  const fakeElecLeg2 = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecLeg2,
    projects: [catalog1],
    listProposals: async () => ({
      inbox: "/catalogs/cat1/inbox",
      proposals: [
        {
          file: "/catalogs/cat1/inbox/unverified-inbox-file.ec",
          name: "Attacker Injected Name",
          ok: true,
          pending: 1,
          desk: null,
          proposes: { changes: 2, cards: 0 },
        },
      ],
    }),
    desksFor: async () => ({
      team: {
        id: "team-alpha",
        name: "Harbourlight Team",
        roster: [],
      },
      requests: [],
    }),
    licencePaused: false,
    store: { told: [] },
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElecLeg2._notifications.length === 1
    && fakeElecLeg2._notifications[0].opts.title === "A teammate sent a proposal"
    && !fakeElecLeg2._notifications[0].opts.title.includes("Attacker Injected Name")
    && !fakeElecLeg2._notifications[0].opts.body.includes("Attacker Injected Name"),
    "ws11a unverified inbox file toasts nameless title and none of the text it brought");

  const fakeElecLeg2Pl = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecLeg2Pl,
    projects: [catalog1],
    listProposals: async () => ({
      inbox: "/catalogs/cat1/inbox",
      proposals: [
        {
          file: "/catalogs/cat1/inbox/unverified-inbox-file.ec",
          name: "Injected Text",
          ok: true,
          pending: 1,
          desk: null,
          proposes: { changes: 1, cards: 0 },
        },
      ],
    }),
    desksFor: async () => ({
      team: { id: "team-alpha", name: "Harbourlight Team", roster: [] },
      requests: [],
    }),
    licencePaused: false,
    store: { told: [] },
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "pl",
  });
  check(fakeElecLeg2Pl._notifications.length === 1
    && fakeElecLeg2Pl._notifications[0].opts.title === "Nowa propozycja od członka zespołu",
    "ws11b unverified inbox file toasts nameless title in Polish");

  /* Leg 12: a verified desk the roster does not name toasts the nameless title */
  const fakeElecLeg3 = makeFakeElectron();
  await checkWaiting({
    electron: fakeElecLeg3,
    projects: [catalog1],
    listProposals: async () => ({
      inbox: "/catalogs/cat1/inbox",
      proposals: [
        {
          file: "/catalogs/cat1/desks/desk-anon/p-anon.ec",
          name: "Anonymous Desk Proposal",
          ok: true,
          pending: 1,
          desk: { id: "desk-anon", name: "Desk Anon Self Name" },
          proposes: { changes: 1, cards: 0 },
        },
      ],
    }),
    desksFor: async () => ({
      team: {
        id: "team-alpha",
        name: "Harbourlight Team",
        roster: [
          { desk: { id: "desk-anon", name: "Desk Anon Self Name" }, name: "", id: "desk-anon", rosterName: "" },
        ],
      },
      requests: [],
    }),
    licencePaused: false,
    store: { told: [] },
    writeStore: () => {},
    windowState: { isVisible: true, isMinimized: false, isFocused: false },
    lang: "en",
  });
  check(fakeElecLeg3._notifications.length === 1 && fakeElecLeg3._notifications[0].opts.title === "A teammate sent a proposal",
    "ws12a verified desk without roster name toasts nameless title");

  /* ws13: a newer Studio's teams.json and no signing key. The waiting check is a reader here and leaves every file. */
  {
    const scratch = path.join(ROOT, "scratch", "waiting-studio-ws13");
    const ud = path.join(scratch, "ud");
    const projectsDir = path.join(scratch, "projects");
    clearScratch(scratch);
    fs.mkdirSync(ud, { recursive: true });
    fs.mkdirSync(projectsDir, { recursive: true });
    const teams = { format: 2, writtenBy: "2.3.0", kind: "etiuda-studio-teams", teams: {} };
    fs.writeFileSync(path.join(ud, "teams.json"), JSON.stringify(teams, null, 1) + "\n");
    const before = treeBytes(ud);
    let sh = null;
    let threw = "";
    try {
      sh = loadWaitingShell(ud, projectsDir);
      await sh.check();
    } catch (e) {
      threw = String(e && e.message || e);
    } finally {
      if (sh) await sh.done();
    }
    const after = treeBytes(ud);
    const same = JSON.stringify(before) === JSON.stringify(after);
    check(same && !threw, "ws13 a waiting check on a newer teams.json and no key leaves every file byte for byte"
      + (threw ? " threw " + threw.slice(0, 160) : "")
      + (same ? "" : " " + JSON.stringify(before) + " -> " + JSON.stringify(after)));
    dropScratch(scratch, "waiting-studio");
  }

  /* Leg 14: an arrival while focused is not marked told and toasts once unfocused */
  {
    const fakeElec14 = makeFakeElectron();
    let savedStore14 = { told: [] };
    const writeStore14 = (s) => { savedStore14 = JSON.parse(JSON.stringify(s)); };
    await checkWaiting({
      electron: fakeElec14,
      projects: [catalog1],
      listProposals,
      desksFor: async () => ({ team: desksForMap["/catalogs/cat1"].team, requests: [] }),
      licencePaused: false,
      store: savedStore14,
      writeStore: writeStore14,
      windowState: { isVisible: true, isMinimized: false, isFocused: true },
      lang: "en",
    });
    check(fakeElec14._notifications.length === 0, "ws14a no toast while focused in front");
    check(!savedStore14.told.includes("/catalogs/cat1/inbox/p1.ec"), "ws14b arrival while focused is not marked told");

    const fakeElec14b = makeFakeElectron();
    await checkWaiting({
      electron: fakeElec14b,
      projects: [catalog1],
      listProposals,
      desksFor: async () => ({ team: desksForMap["/catalogs/cat1"].team, requests: [] }),
      licencePaused: false,
      store: savedStore14,
      writeStore: writeStore14,
      windowState: { isVisible: true, isMinimized: false, isFocused: false },
      lang: "en",
    });
    check(fakeElec14b._notifications.length === 1, "ws14c arrival toasts once window is no longer in front");
    check(savedStore14.told.includes("/catalogs/cat1/inbox/p1.ec"), "ws14d arrival is marked told after being toasted");
  }

  /* Leg 15: store save made while check awaited is not overwritten */
  {
    let liveStore = { theme: "light", told: [] };
    const fakeElec15 = makeFakeElectron();
    await checkWaiting({
      electron: fakeElec15,
      projects: [catalog1],
      listProposals: async (dir) => {
        liveStore.theme = "dark";
        return proposalsFor[dir];
      },
      desksFor: async () => ({ team: null, requests: [] }),
      licencePaused: false,
      readStore: () => liveStore,
      store: liveStore,
      writeStore: (next) => {
        liveStore = Object.assign({}, liveStore, { told: next.told });
      },
      windowState: { isVisible: true, isMinimized: false, isFocused: false },
      lang: "en",
    });
    check(liveStore.theme === "dark", "ws15a store save made during await is not overwritten by waiting check");
  }

  console.log("\n#counts checks=" + checks + " failures=" + failed);
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error("waiting-studio error: " + (err && err.message));
  process.exit(1);
});
