/* ui/app.js run on a stand-in DOM for the legs that have no window (board 834, C07): import { loadPage }. It evaluates a copy of
 * the file with the cards table's DOM building swapped and boot() replaced by a hook; it reads markup and state, never layout,
 * focus or events, and fails loudly where either of its two anchors in the source moves. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const TABLE_FROM = "  function cardsTable(list, x) {";
const BOOT_FROM = "  boot();\n})();";

/** An element that records. Unknown methods are no-ops and unknown properties are undefined. */
function element(sel, doc) {
  const el = {
    __sel: sel, _html: "", attrs: {}, children: [], hidden: false, isConnected: false,
    parentNode: null, nextSibling: null, previousSibling: null, firstChild: null, style: {},
    dataset: {}, className: "", textContent: "", value: "", checked: false,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    removeAttribute(k) { delete this.attrs[k]; },
    hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k); },
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, remove() {},
    appendChild(c) { this.children.push(c); return c; },
    insertAdjacentHTML(pos, h) { (this.inserts = this.inserts || []).push([pos, h]); this._html = pos === "afterbegin" ? h + this._html : this._html + h; },
    querySelector(sel) { return element(sel, doc); }, querySelectorAll() { return []; },
    closest() { return null; }, matches() { return false; }, contains() { return false; },
    getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    scrollIntoView() {},
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); },
    get outerHTML() { return this._html; },
    set outerHTML(v) { this._html = String(v); },
  };
  return el;
}

/* The closure's own names a leg may ask for. A name the source does not have is simply absent, which is
   what lets the same hook read the tree before a change as well as after it. */
const NAMES = ["S", "ACTS", "T", "C", "rowHtml", "viewBar", "editorHtml", "cardActs", "retBox", "histHtml",
  "histRow", "histFor", "histPaint", "paintUndo", "paintCardHist", "paintCards", "paintArchive",
  "paintRail", "paint", "paintMain", "tookCard", "stripOf", "inView", "errText", "noteText", "saidText", "cardById", "flush",
  "queueSave", "unUndo", "retChip", "cardTail", "tableHtml",
  /* bulk upkeep (board 834, step 10, C09) */
  "tickCell", "tickFrom", "visibleCards", "paintBulk", "bulkSaid", "tookBulk", "findCounts", "findSaid", "findStrip", "findTable",
  "findBodyPaint", "paintFind", "sheetPane", "sheetTable", "paintImportAffordance", "headHtml",
  /* the review queue's desk rows (board 834, step 8) */
  "rvOpened", "rvState", "paintProposalList",
  /* the tabs as the open projects, and the edits a tab's leaving sends first */
  "landOn", "openDir", "closeTab", "tabKey", "restoreTabs", "keepTabs", "paintTabs",
  "queueTagSave", "queueProjectSave", "queueFacts",
  "projectNameKey", "projectNameLeave", "commitProjectName", "cancelProjectName",
  /* the Desks screen and its cover (board 834, the sealed team) */
  "paintDesks", "desksLoad", "teamMoved", "teamCoverHtml", "paintCoverOnly", "confirmKey",
  /* saved data a newer Studio wrote, said at boot (updates 2, tests/team-desks.mjs) */
  "savedNewerAsk",
  /* an unfinished reset said at the start (tests/reset-studio.mjs rs14) */
  "resetUnfinishedAsk",
  /* the signing key, its backup disc and Review's ring (K4 to K8, G1; tests/studio-key.mjs) */
  "keyHtml", "signingRowHtml", "keyCoverHtml", "keyLinesHtml", "paintDiscs", "ringDisc",
  "followedRowHtml", "followChanged", "followJoinCoverHtml", "followLeaveCoverHtml", "settingsPageHtml", "sxPageHtml",
  /* the commitment mark and the cards that follow (board 814, step 11, S3b) */
  "commitHtml", "nextHtml", "nextFound", "nextFoundHtml", "nextKey", "nextMove", "setNext", "tookLinks", "markOf",
  "likelyFor", "edHead",
  /* assigned intents as chips and search picker (board 960) */
  "intentHtml", "intentFound", "intentFoundHtml", "intentKey", "intentAdd", "intentRemove", "focusFinding",
  /* a path's end dismissed, the team's candidates in the editor and titles in the shown language (S3e-2, S3c carves) */
  "endMeant", "linkersOf", "teamHtml", "teamRead", "titleShown",
  /* the unconnected Overview map laid out from its words (board 994) */
  "noneHtml", "noneGeom", "noneLay", "fitNone", "famGuess", "famFit",
  /* the Paths map (board 814, step 11, S3c) */
  "PM", "pm", "pmEnds", "pathsModel", "pathsStarts", "pathsReach", "pathsTeam", "pathsCanvasHtml", "pathsPanelHtml",
  "paintPaths", "pathsWalk", "pathsKey", "pathsLink",
  /* the lint list's suggestions and the publish cover that counts them (board 814, S3e) */
  "paintLint", "coverHtml", "ruleSaid",
  /* the card editor's placeholder chips */
  "chipsFor",
  /* the Menu's list, the About and the status bar (2026-10-06, tests/studio-about.mjs) */
  "run", "menuHtml", "paintMenu", "menuShow", "aboutCoverHtml", "clearCoverHtml", "keyRemoveCoverHtml", "agreementHtml", "saveState",
  "statusLeftHtml", "statusRightHtml", "paintStatus", "flushFacts",
  /* the maximise button and the tour as the desk's (tests/follow-desk.mjs) */
  "winMaxSay",
  /* the Variables page and a card using variables (board 845, tests/variables-page.mjs) */
  "paintVariables", "vrInput", "vrValue", "vrFacts", "vrWordsOf", "vrWordsHtml", "vrInsHtml", "vrInsTake", "vrInlineHtml",
  "vrMoveRule", "flushVars", "vrPut", "vrDef", "vrCat", "vrTest", "vrNameSaid", "VR_OWN", "VR_TEST",
  /* projects as places (board 862, tests/places.mjs) */
  "placesOpen", "placesShut", "placesClose", "placeGo", "placeMake", "placesKey", "placesGrid", "placesPaint", "placeMeta", "faceOf",
  /* a file dropped on the window (board 862, tests/drop.mjs) */
  "dropTake", "veilShow", "dropOpen", "wizStart", "wizDoors", "paintFoot",
  /* an edit read as one (board 862; the rows one at a time went with board 1016 item 7, tests/triage.mjs) */
  "editHtml",
  /* review in place (board 862, tests/review-in-place.mjs) */
  "rvRow", "rvAsideHtml", "inboxBase", "inboxTook", "arriveShow", "arriveHide",
  /* the counts line a save rewrites (the test architect's read of vision-alpha, E5; tests/drop.mjs dr8c) */
  "touchRail", "ledeText",
  /* the statistics read three ways (board 862, tests/stats-words.mjs) */
  "paintStats", "statsLoad", "statsView", "statsViewOf", "monthRows", "statsPaths",
  "spanBandKey", "spanBandRelease", "statsSpanBand",
  /* Claudia γ's vision ideas (board 862, tests/vision-gamma.mjs) */
  "paintChrome", "paintShelves", "shelvesHtml", "shelfRows", "tileHtml", "shvMoveTo", "touchRow",
  "mgNext", "mgSlot", "mgField", "mgMirror", "mgPaint", "bkGroups", "bkHtml", "bkRepaint",
  "onTicked", "trayChip", "chgLoad", "chgLine", "paintChanges", "chgUndo",
  /* F8 under the places overlay (the night merge of vision-alpha and vision-gamma) */
  "mgKey",
  /* the object menus, the rename in place and a project to the Recycle Bin (board 901, tests/object-menus.mjs) */
  "CTX_KINDS", "ctxItems", "ctxOpen", "ctxShow", "ctxMouse", "ctxKey", "objectKey", "ctxCopy", "ctxReveal",
  "nameStart", "nameEnd", "nameText", "cardNameKey", "cardNameLeave", "fieldNameIn", "fieldNameKey",
  "projectRemove", "removeCommit", "listedProjects", "recentOf", "paintProjects", "paintUndo", "paintTeams",
  /* the licence cover (board 936, S6, tests/licence-page.mjs) */
  "licenceCoverHtml", "licenceTook", "licenceSaid", "paintCover",
  /* where a team on the relay stands (board 935, G2 on Studio's side, tests/relay-studio.mjs g2s legs) */
  "lapseSaid", "relayLapseAsk", "relayLapseCoverHtml", "relayLapseSeen",
  /* a catalog named by its rev and its dated edition (board 902, tests/rev-dated.mjs) */
  "rvFacts", "prMapOpts", "paintAudit", "paintProjectSettings",
  /* what the import mapping will make, said as it is chosen (tests/number-bound.mjs) */
  "wizMakes",
  /* the published file name's edit in Settings (board 960, item 4, tests/open-tabs.mjs ot10) */
  "fileNameKey", "fileNameTyping",
  /* the screen tabs and Settings in one (board 965, S1, tests/screen-tabs.mjs) */
  "settingsPageHtml", "sxPageHtml", "namingBubbleHtml", "namingOffer", "screenOpen", "screenClose", "bandTabs",
  /* the keyboard shortcuts registry (board 965, S4, tests/keyboard-shortcuts.mjs) */
  "StudioKeys",
  /* two findings of the mended window legs (tests/windowleg-finds.mjs) */
  "stkCardHtml", "sxKeysRows"];

export function loadPage({ api, uiLang, source, vars } = {}) {
  let app = source != null ? source : fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  if (app.split(TABLE_FROM).length !== 2) throw new Error("page stand-in: the cards table's builder has moved");
  if (!app.endsWith(BOOT_FROM + "\n") && !app.endsWith(BOOT_FROM))
    throw new Error("page stand-in: the closing boot() has moved");
  app = app.replace(TABLE_FROM, () => `  function cardsTable(list, x) {
    const t = document.createElement("table");
    t.__rows = list.map((c) => rowHtml(c, x));
    (window.__tables = window.__tables || []).push(t);
    return t;
  }
  function cardsTableReal(list, x) {`);
  app = app.slice(0, app.lastIndexOf(BOOT_FROM)) + `  window.__page = {};
  ${JSON.stringify(NAMES)}.forEach((n) => { try { window.__page[n] = eval(n); } catch (e) { /* absent in this source */ } });
  window.__page.__set = (n, v) => { eval(n + " = v"); };
  window.__page.__get = (n) => eval(n);
})();
`;

  const nodes = new Map();
  const doc = {
    body: element("body"), documentElement: element("html"),
    querySelector(sel) { if (doc.absent && doc.absent.has(sel)) return null; if (!nodes.has(sel)) nodes.set(sel, element(sel, doc)); return nodes.get(sel); },
    querySelectorAll() { return []; },
    createElement(tag) { const e = element(tag, doc); e.tagName = tag.toUpperCase(); return e; },
    /* What the page puts on the document is kept, so a leg can dispatch to it, in capture order where the page asked for
       capture; `focused` stands in for the focus. */
    heard: [], focused: null,
    addEventListener(type, fn, opt) { doc.heard.push({ type, fn, capture: opt === true || !!(opt && opt.capture) }); }, removeEventListener() {},
    get activeElement() { return doc.focused || doc.body; },
  };
  const calls = [];
  /* The window's own listeners are kept too (a leg can call the close, beforeunload), as the document's are. */
  const heardWindow = [];
  const sandbox = {
    document: doc, console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    /* The stack's answers rest on a clock (STK.flight); an import into a project ends at the stack since board 1016 item 7. */
    performance: { now: () => Date.now() }, queueMicrotask,
    CSS: { escape: (s) => String(s) },
    heardWindow, addEventListener(type, fn) { heardWindow.push({ type, fn }); }, removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    requestAnimationFrame: (f) => setTimeout(f, 0),
    innerWidth: 1280, innerHeight: 880, NodeFilter: {},
    ResizeObserver: class { observe() {} disconnect() {} },
    IntersectionObserver: class { observe() {} disconnect() {} },
    MutationObserver: class { observe() {} disconnect() {} takeRecords() { return []; } },
    STUDIO: api || null,
    STUDIO_VARS: vars || null,
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  for (const f of ["lang.js", "icons.js", "strength.js", "opening.js", "keys.js"])
    vm.runInContext(fs.readFileSync(path.join(ROOT, "ui", f), "utf8"), sandbox, { filename: f });
  if (uiLang) sandbox.STUDIO_T.force(uiLang);
  vm.runInContext(app, sandbox, { filename: "ui/app.js (stand-in copy)" });
  return { page: sandbox.__page, doc, node: (sel) => doc.querySelector(sel), calls, sandbox };
}
