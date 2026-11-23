/* KEYBOARD SHORTCUTS REGISTRY AND SETTINGS PAGE: node tests/keyboard-shortcuts.mjs [--keep].
 *
 * gate-kind: node
 *
 * Board 965, run S4 of the Settings plan (office brief settings-965-967-969-plan-2026-11-08.md).
 * Studio's Keyboard shortcuts page from a registry of every Studio key in ui/keys.js.
 *
 *   ks1  Keyboard shortcuts is listed in Settings; in Polish Skróty klawiszowe; lede and glyph
 *   ks2  the list names Rename F2 and Maintenance Ctrl+Shift+M, each with the "new key" chip
 *   ks3  the list includes the other Studio shortcuts (Places, Find and replace, Undo, tabs, steps, next replies, back a level)
 *   ks4  the page note: "Any shortcut can be changed, as on Etiuda." (Polish: "Każdy skrót można zmienić, tak jak w Etiudzie.")
 *   ks5  search filters shortcut rows by title and hint across sections
 *   ks6  every key in the list fires its act through the registry
 *   ks7  a key not in the registry fires nothing new
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
const SCRATCH = path.join(ROOT, "scratch", "keyboard-shortcuts");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

const keyEv = (k, opts) => Object.assign({
  key: k, code: "", ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
  target: { closest() { return null; }, tagName: "BODY" }, defaultPrevented: false,
  preventDefault() { this.defaultPrevented = true; },
  stopPropagation() {},
}, opts || {});

async function run() {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "root");
  fs.mkdirSync(root, { recursive: true });

  const calls = [];
  const fakeApi = {
    root() { return root; },
    projects: async () => ({ error: null, root, projects: [] }),
    read() { return { error: null, catalog: { cards: [], tags: [], intents: [] } }; },
    zoom(how) { calls.push("zoom:" + how); },
    maintenance: async () => ({ error: null, readings: {} }),
  };

  const { page, doc, sandbox } = loadPage({ api: fakeApi });

  /* ks0: StudioKeys registry exists */
  check(sandbox.StudioKeys && typeof sandbox.StudioKeys.matchKey === "function" && Array.isArray(sandbox.StudioKeys.SHORTCUTS),
    "ks0 StudioKeys registry exists and exports matchKey and SHORTCUTS");

  /* Wait for page boot */
  page.screenOpen("settings");
  page.S.sx = { sec: "keys", q: "" };
  page.paintMain();

  const mainHtml = doc.querySelector("#main").innerHTML;

  /* ks1: Keyboard shortcuts listed in Settings */
  const navLink = /data-act="sx-sec"[^>]*data-v="keys"|data-v="keys"[^>]*data-act="sx-sec"/.test(mainHtml);
  const hasNavText = /Keyboard shortcuts/.test(mainHtml);
  check(navLink && hasNavText, "ks1a Keyboard shortcuts listed in settings nav");

  const { page: plPage, doc: plDoc } = loadPage({ api: fakeApi, uiLang: "pl" });
  plPage.screenOpen("settings");
  plPage.S.sx = { sec: "keys", q: "" };
  plPage.paintMain();
  const plMainHtml = plDoc.querySelector("#main").innerHTML;
  check(/Skróty klawiszowe/.test(plMainHtml), "ks1b in Polish nav says Skróty klawiszowe");

  /* ks1c: every shortcut names a glyph the icon set has. A name the set lacks draws nothing, so the row loses its icon column and its
     text falls into that column, one word to a line: "Next tab" and "Previous tab" did, asking for "tab", until 2026-11-16. */
  const iconSet = sandbox.STUDIO_ICONS || (sandbox.window && sandbox.window.STUDIO_ICONS);
  const noGlyph = sandbox.StudioKeys.SHORTCUTS
    .filter((d) => !iconSet || iconSet.html(d.glyph || "keyboard") === "")
    .map((d) => d.id + " asks for " + JSON.stringify(d.glyph || "keyboard"));
  check(!!iconSet && noGlyph.length === 0, "ks1c every shortcut's glyph is in the icon set"
    + (noGlyph.length ? ": " + noGlyph.join("; ") : " (" + sandbox.StudioKeys.SHORTCUTS.length + " shortcuts)"));

  /* ks1d: a row never shows the same chord twice. Zoom in, Zoom out and Reset zoom each have a second chord on the number pad, and
     both read "Ctrl++" (and so on) until 2026-11-16; the number pad's now says "Num". */
  const K = sandbox.StudioKeys;
  const twins = K.SHORTCUTS.filter((d) => d.def && d.def2 && K.formatChord(d.def, d) === K.formatChord(d.def2, d))
    .map((d) => d.id + " shows " + JSON.stringify(K.formatChord(d.def, d)) + " twice");
  const pads = K.SHORTCUTS.filter((d) => d.def2 && /^Numpad/.test(d.def2.code || "")).map((d) => K.formatChord(d.def2, d));
  check(twins.length === 0 && pads.length === 3 && pads.join(", ") === "Ctrl+Num +, Ctrl+Num -, Ctrl+Num 0",
    "ks1d no row shows the same chord twice, and a number pad's chord names the number pad: "
    + (twins.length ? twins.join("; ") : pads.join(", ")));

  /* ks2: list names Rename F2 and Maintenance Ctrl+Shift+M, each with "new key" chip */
  const hasRename = /data-row="rename"/.test(mainHtml) && /F2/.test(mainHtml);
  const hasMaintenance = /data-row="maintenance"/.test(mainHtml) && /Ctrl\+Shift\+M/.test(mainHtml);
  const renameNewKey = /data-row="rename"[\s\S]*?new key/.test(mainHtml);
  const maintNewKey = /data-row="maintenance"[\s\S]*?new key/.test(mainHtml);
  check(hasRename && hasMaintenance && renameNewKey && maintNewKey,
    "ks2 Rename F2 and Maintenance Ctrl+Shift+M with new key chip are listed");

  /* ks3: other Studio shortcuts listed */
  const hasPlaces = /data-row="places"/.test(mainHtml) && /Ctrl\+Up/.test(mainHtml);
  const hasFind = /data-row="find"/.test(mainHtml) && /Ctrl\+H/.test(mainHtml);
  const hasUndo = /data-row="undo"/.test(mainHtml) && /Ctrl\+Z/.test(mainHtml);
  const hasTabs = /data-row="tab-next"/.test(mainHtml) || /data-row="tabNext"/.test(mainHtml);
  const hasFindings = /data-row="findings"/.test(mainHtml) && /F8/.test(mainHtml);
  check(hasPlaces && hasFind && hasUndo && hasTabs && hasFindings,
    "ks3 Places, Find, Undo, tabs, findings are present in the list");

  /* ks4: page note (Finding 3: lede must not promise every shortcut can be changed) */
  const enNote = /A shortcut can be changed to an F key or a combination with Ctrl or Alt, since keys needed for typing stay with typing\./.test(mainHtml);
  check(enNote, "ks4a English page note does not promise every shortcut can be changed");

  /* ks5: search filters shortcut rows */
  page.S.sx.q = "Rename";
  page.paintMain();
  const searchedRenameHtml = doc.querySelector("#main").innerHTML;
  const findRenameRow = /data-row="rename"/.test(searchedRenameHtml);
  const hideUndoRow = !/data-row="undo"/.test(searchedRenameHtml);
  check(findRenameRow && hideUndoRow, "ks5 search for Rename shows Rename row and hides Undo");

  /* Reset search */
  page.S.sx.q = "";
  page.paintMain();

  /* ks6: every key in the list fires its act through the registry */
  let renameFired = false;
  const fakeElem = {
    getAttribute(k) { return k === "data-ctx" ? "project" : null; },
    closest(sel) { return sel && sel.indexOf("data-ctx") >= 0 ? this : null; },
    matches(sel) { return !!(sel && sel.indexOf("data-ctx") >= 0); },
  };
  page.CTX_KINDS.project = () => ({ rename: () => { renameFired = true; }, del: () => {} });
  const f2Ev = keyEv("F2", { code: "F2", target: fakeElem });

  let askedRename = false;
  if (sandbox.StudioKeys && sandbox.StudioKeys.matchKey) {
    const origMatch = sandbox.StudioKeys.matchKey;
    sandbox.StudioKeys.matchKey = (e, id) => {
      if (id === "rename") askedRename = true;
      return origMatch.call(sandbox.StudioKeys, e, id);
    };
  }
  const objectKeyRes = page.objectKey(f2Ev);
  check(renameFired && objectKeyRes === "rename" && askedRename, "ks6a F2 fires rename through registry in objectKey");

  /* Maintenance through tabKey */
  let askedMaint = false;
  if (sandbox.StudioKeys && sandbox.StudioKeys.matchKey) {
    const origMatch = sandbox.StudioKeys.matchKey;
    sandbox.StudioKeys.matchKey = (e, id) => {
      if (id === "maintenance") askedMaint = true;
      return origMatch.call(sandbox.StudioKeys, e, id);
    };
  }
  const maintEv = keyEv("m", { code: "KeyM", ctrlKey: true, shiftKey: true });
  const tabKeyRes = page.tabKey(maintEv);
  check(tabKeyRes === "maintenance" && page.S.screen === "maintenance" && askedMaint,
    "ks6b Ctrl+Shift+M opens maintenance tab through registry in tabKey");

  /* Close tab through tabKey */
  let askedClose = false;
  if (sandbox.StudioKeys && sandbox.StudioKeys.matchKey) {
    const origMatch = sandbox.StudioKeys.matchKey;
    sandbox.StudioKeys.matchKey = (e, id) => {
      if (id === "tabClose") askedClose = true;
      return origMatch.call(sandbox.StudioKeys, e, id);
    };
  }
  page.S.screen = "settings";
  page.S.screens = ["settings"];
  const closeEv = keyEv("w", { code: "KeyW", ctrlKey: true });
  const closeRes = page.tabKey(closeEv);
  check(closeRes === "close" && askedClose, "ks6c Ctrl+W closes screen tab through registry in tabKey");
  await new Promise((r) => setTimeout(r, 20));

  /* Walk findings through mgKey */
  let askedFindings = false;
  if (sandbox.StudioKeys && sandbox.StudioKeys.matchKey) {
    const origMatch = sandbox.StudioKeys.matchKey;
    sandbox.StudioKeys.matchKey = (e, id) => {
      if (id === "findings") askedFindings = true;
      return origMatch.call(sandbox.StudioKeys, e, id);
    };
  }
  let mgNextCalled = false;
  page.__set("mgNext", () => { mgNextCalled = true; });
  page.S.open = { project: { rev: 0 } };
  page.S.screen = "project";
  page.S.cover = null;
  page.S.tour = null;
  page.S.wiz = null;
  page.S.places = null;
  const f8Ev = keyEv("F8", { code: "F8" });
  page.mgKey(f8Ev);
  check(mgNextCalled && askedFindings, "ks6d F8 walks findings in margin through registry in mgKey");

  /* ks7: unassigned key fires nothing */
  renameFired = false;
  const f3Ev = keyEv("F3", { code: "F3", target: fakeElem });
  const f3Res = page.objectKey(f3Ev);
  check(!renameFired && f3Res === "", "ks7a F3 does not fire rename");

  mgNextCalled = false;
  const f9Ev = keyEv("F9", { code: "F9" });
  page.mgKey(f9Ev);
  check(!mgNextCalled, "ks7b F9 does not walk findings in mgKey");

  /* ks8: a rebound chord fires, the old one does not */
  check(typeof sandbox.StudioKeys.scTake === "function", "ks8a StudioKeys.scTake exists");
  sandbox.StudioKeys.scTake("rename", 1, { code: "F3", key: "F3", ctrl: 0, alt: 0, shift: 0, meta: 0 });
  renameFired = false;
  const f3ReboundRes = page.objectKey(f3Ev);
  check(renameFired && f3ReboundRes === "rename", "ks8b rebound chord F3 fires rename in objectKey");

  renameFired = false;
  const f2OldRes = page.objectKey(f2Ev);
  check(!renameFired && f2OldRes === "", "ks8c old chord F2 no longer fires rename");

  /* ks9: a chord has one owner and a clash is said */
  // Rebind rename to F8, which is findings' default chord
  mgNextCalled = false;
  renameFired = false;
  const clash = sandbox.StudioKeys.scTake("rename", 1, { code: "F8", key: "F8", ctrl: 0, alt: 0, shift: 0, meta: 0 });
  check(clash && clash.id === "findings", "ks9a clash with previous owner findings is reported");

  const f8RenameEv = keyEv("F8", { code: "F8", target: fakeElem });
  const f8RenameRes = page.objectKey(f8RenameEv);
  check(renameFired && f8RenameRes === "rename", "ks9b new owner rename fires on F8");

  page.mgKey(f8Ev);
  check(!mgNextCalled, "ks9c previous owner findings does not fire on stolen chord F8");

  /* ks10: Reset shortcuts restores defaults */
  check(typeof sandbox.StudioKeys.resetShortcuts === "function", "ks10a StudioKeys.resetShortcuts exists");
  sandbox.StudioKeys.resetShortcuts();

  renameFired = false;
  const f2RestoredRes = page.objectKey(f2Ev);
  check(renameFired && f2RestoredRes === "rename", "ks10b default chord F2 fires rename after reset");

  renameFired = false;
  const f3AfterResetRes = page.objectKey(f3Ev);
  check(!renameFired && f3AfterResetRes === "", "ks10c rebound chord F3 no longer fires rename after reset");

  mgNextCalled = false;
  page.mgKey(f8Ev);
  check(mgNextCalled, "ks10d default chord F8 fires findings again after reset");

  /* ks11: stored chords survive a restart */
  const storedOverrides = { rename: { code: "F3", key: "F3", ctrl: 0, alt: 0, shift: 0, meta: 0 } };
  const { page: restartPage, sandbox: restartBox } = loadPage({
    api: Object.assign({}, fakeApi, {
      host: async () => ({ version: "1.0.0", shortcuts: storedOverrides }),
    }),
  });
  restartPage.screenOpen("settings");
  restartPage.S.sx = { sec: "keys", q: "" };
  if (restartBox.StudioKeys && typeof restartBox.StudioKeys.loadShortcuts === "function") {
    restartBox.StudioKeys.loadShortcuts(storedOverrides);
  }
  let restartRenameFired = false;
  restartPage.CTX_KINDS.project = () => ({ rename: () => { restartRenameFired = true; }, del: () => {} });
  const restartF3Res = restartPage.objectKey(keyEv("F3", { code: "F3", target: fakeElem }));
  const restartF2Res = restartPage.objectKey(keyEv("F2", { code: "F2", target: fakeElem }));
  check(restartRenameFired && restartF3Res === "rename" && restartF2Res === "",
    "ks11 stored chords survive a restart");

  /* ks12: UI press to record, Escape cancel, key capture and Reset shortcuts */
  let savedApiChords = null;
  const uiApi = Object.assign({}, fakeApi, {
    shortcuts: async (raw) => { savedApiChords = raw; },
  });
  const { page: uiPage, doc: uiDoc, sandbox: uiBox } = loadPage({ api: uiApi });
  uiPage.screenOpen("settings");
  uiPage.S.sx = { sec: "keys", q: "" };
  uiPage.paintMain();

  const bindBtn = {
    getAttribute(k) {
      if (k === "data-bind") return "rename";
      if (k === "data-slot") return "1";
      return null;
    },
  };
  uiPage.ACTS["sc-bind"](bindBtn);
  check(uiBox.StudioKeys.captureState().id === "rename", "ks12a sc-bind click sets capture state on rename");

  // Dispatch Escape to cancel
  const escEv = keyEv("Escape", { code: "Escape" });
  uiDoc.heard.forEach((h) => { if (h.type === "keydown") h.fn(escEv); });
  check(uiBox.StudioKeys.captureState().id === null, "ks12b Escape cancels capture");

  // Re-enter capture and press F3
  uiPage.ACTS["sc-bind"](bindBtn);
  const pressF3Ev = keyEv("F3", { code: "F3" });
  uiDoc.heard.forEach((h) => { if (h.type === "keydown") h.fn(pressF3Ev); });
  check(uiBox.StudioKeys.captureState().id === null && savedApiChords && savedApiChords.rename,
    "ks12c recording F3 stores override and sends to API");

  // Click Reset shortcuts
  await uiPage.ACTS["reset-shortcuts"]();
  check(savedApiChords && Object.keys(savedApiChords).length === 0,
    "ks12d Reset shortcuts clears stored overrides via API");

  /* ks13: field keys refused during recording (board 965, S4b condition) */
  const refusedCases = [
    { name: "letter k", ev: keyEv("k", { code: "KeyK" }), keyStr: "K" },
    { name: "digit 5", ev: keyEv("5", { code: "Digit5" }), keyStr: "5" },
    { name: "Shift+letter K", ev: keyEv("K", { code: "KeyK", shiftKey: true }), keyStr: "Shift+K" },
    { name: "Space", ev: keyEv(" ", { code: "Space" }), keyStr: "Space" },
    { name: "Enter", ev: keyEv("Enter", { code: "Enter" }), keyStr: "Enter" },
    { name: "Tab", ev: keyEv("Tab", { code: "Tab" }), keyStr: "Tab" },
    { name: "Delete", ev: keyEv("Delete", { code: "Delete" }), keyStr: "Delete" },
    { name: "Ctrl+A", ev: keyEv("a", { code: "KeyA", ctrlKey: true }), keyStr: "Ctrl+A" },
    { name: "Ctrl+C", ev: keyEv("c", { code: "KeyC", ctrlKey: true }), keyStr: "Ctrl+C" },
    { name: "Ctrl+V", ev: keyEv("v", { code: "KeyV", ctrlKey: true }), keyStr: "Ctrl+V" },
    { name: "Ctrl+X", ev: keyEv("x", { code: "KeyX", ctrlKey: true }), keyStr: "Ctrl+X" },
    { name: "Ctrl+Y", ev: keyEv("y", { code: "KeyY", ctrlKey: true }), keyStr: "Ctrl+Y" },
    { name: "Ctrl+Z", ev: keyEv("z", { code: "KeyZ", ctrlKey: true }), keyStr: "Ctrl+Z" },
  ];

  for (const rc of refusedCases) {
    savedApiChords = null;
    uiPage.ACTS["sc-bind"](bindBtn);
    uiDoc.heard.forEach((h) => { if (h.type === "keydown") h.fn(rc.ev); });
    const chordNow = uiBox.StudioKeys.scChord("rename");
    const said = uiDoc.querySelector("#said") ? uiDoc.querySelector("#said").textContent : "";
    const expectedLine = rc.keyStr + " is needed for typing, so it cannot be a shortcut, and nothing was changed. An F key, or a combination with Ctrl or Alt, will do.";
    const refusedOk = chordNow && chordNow.code === "F2" && !savedApiChords && said.replace(/\u00a0/g, " ") === expectedLine;
    check(refusedOk, "ks13 refused chord " + rc.name + " (" + rc.keyStr + ") is refused with nothing rebound, nothing stored, and refusal line said");
  }

  // Polish refusal wording test
  const { page: plUiPage, doc: plUiDoc, sandbox: plUiBox } = loadPage({ api: uiApi, uiLang: "pl" });
  plUiPage.screenOpen("settings");
  plUiPage.S.sx = { sec: "keys", q: "" };
  plUiPage.paintMain();
  plUiPage.ACTS["sc-bind"](bindBtn);
  const plEv = keyEv("k", { code: "KeyK" });
  plUiDoc.heard.forEach((h) => { if (h.type === "keydown") h.fn(plEv); });
  const plSaid = plUiDoc.querySelector("#said") ? plUiDoc.querySelector("#said").textContent : "";
  const plExpectedLine = "K jest potrzebny do pisania, więc nie może być skrótem, i nic nie zmieniono. Można wybrać klawisz F albo połączenie z Ctrl lub Alt.";
  check(plSaid === plExpectedLine, "ks13 Polish refusal line matches copywriter words exactly");

  // Free chords are taken
  savedApiChords = null;
  uiPage.ACTS["sc-bind"](bindBtn);
  const f9TestEv = keyEv("F9", { code: "F9" });
  uiDoc.heard.forEach((h) => { if (h.type === "keydown") h.fn(f9TestEv); });
  check(uiBox.StudioKeys.scChord("rename").code === "F9" && savedApiChords && savedApiChords.rename && savedApiChords.rename.code === "F9",
    "ks14a free chord F-key (F9) is taken and stored");

  savedApiChords = null;
  uiPage.ACTS["sc-bind"](bindBtn);
  const ctrlAltKEv = keyEv("k", { code: "KeyK", ctrlKey: true, altKey: true });
  uiDoc.heard.forEach((h) => { if (h.type === "keydown") h.fn(ctrlAltKEv); });
  check(!(uiBox.StudioKeys.scChord("rename").code === "KeyK" && uiBox.StudioKeys.scChord("rename").alt === 1) && !savedApiChords,
    "ks14b Ctrl+Alt+K is AltGr typing on a Polish layout, so it is refused and nothing is stored");

  savedApiChords = null;
  uiPage.ACTS["sc-bind"](bindBtn);
  const ctrlShiftKEv = keyEv("k", { code: "KeyK", ctrlKey: true, shiftKey: true });
  uiDoc.heard.forEach((h) => { if (h.type === "keydown") h.fn(ctrlShiftKEv); });
  check(uiBox.StudioKeys.scChord("rename").code === "KeyK" && uiBox.StudioKeys.scChord("rename").ctrl === 1 && uiBox.StudioKeys.scChord("rename").shift === 1 && savedApiChords && savedApiChords.rename,
    "ks14c free chord Ctrl+Shift+K is taken and stored");

  // Reset shortcuts restores defaults, and defaults using Delete and Backspace still fire
  await uiPage.ACTS["reset-shortcuts"]();
  check(uiBox.StudioKeys.scChord("rename").code === "F2", "ks15a rename reset to F2");
  check(uiBox.StudioKeys.scChord("pathsBack").code === "Backspace", "ks15b pathsBack default is Backspace");
  check(uiBox.StudioKeys.scChord("nextRemove").code === "Delete", "ks15c nextRemove default is Delete");

  const bsEv = keyEv("Backspace", { code: "Backspace" });
  const delEv = keyEv("Delete", { code: "Delete" });
  check(uiBox.StudioKeys.matchKey(bsEv, "pathsBack"), "ks15d default Backspace fires pathsBack after reset");
  check(uiBox.StudioKeys.matchKey(delEv, "nextRemove"), "ks15e default Delete fires nextRemove after reset");

  // ks15f to ks15k: one rule with the desk (board 967). Unmodified Backspace and Delete are typing keys, refused with
  // nothing changed; Ctrl+Backspace or Ctrl+Delete puts slot 1 back to its default and clears slot 2.
  const bindBtn2 = {
    getAttribute(k) { return k === "data-bind" ? "rename" : k === "data-slot" ? "2" : null; }
  };
  const press = (btn, ev) => { uiPage.ACTS["sc-bind"](btn); uiDoc.heard.forEach((h) => { if (h.type === "keydown") h.fn(ev); }); };
  const F3 = { code: "F3", key: "F3", ctrl: 0, alt: 0, shift: 0, meta: 0 }, F4 = { code: "F4", key: "F4", ctrl: 0, alt: 0, shift: 0, meta: 0 };
  const plainDel = keyEv("Delete", { code: "Delete" });
  for (const [name, ev] of [["Backspace", bsEv], ["Delete", plainDel]]) {
    uiBox.StudioKeys.scTake("rename", 1, F3); uiBox.StudioKeys.scTake("rename", 2, F4);
    press(bindBtn, ev);
    const s1 = uiBox.StudioKeys.scChord("rename").code;
    press(bindBtn2, ev);
    const s2 = uiBox.StudioKeys.scChord2("rename").code;
    check(s1 === "F3" && s2 === "F4", "ks15f unmodified " + name + " is refused as a typing key in both slots, nothing changed: " + s1 + " " + s2);
  }
  for (const [name, ev] of [["Ctrl+Backspace", keyEv("Backspace", { code: "Backspace", ctrlKey: true })], ["Ctrl+Delete", keyEv("Delete", { code: "Delete", ctrlKey: true })]]) {
    uiBox.StudioKeys.scTake("rename", 1, F3); uiBox.StudioKeys.scTake("rename", 2, F4);
    press(bindBtn, ev);
    const s1 = uiBox.StudioKeys.scChord("rename").code;
    press(bindBtn2, ev);
    const c2 = uiBox.StudioKeys.scChord2("rename");
    check(s1 === "F2" && (!c2 || (!c2.code && !c2.key)), "ks15g " + name + " restores slot 1's default and clears slot 2: " + s1 + " " + JSON.stringify(c2 && c2.code));
  }

  // ks16: Finding 8 control labels reflect rebound chords
  // Rebind Maintenance to Ctrl+Shift+K
  uiBox.StudioKeys.scTake("maintenance", 1, { code: "KeyK", key: "k", ctrl: 1, alt: 0, shift: 1, meta: 0 });
  uiPage.screenOpen("settings");
  uiPage.paintMain();
  const mainHtmlNow = (uiDoc.querySelector("#main") || {})._html || "";
  const footMatch = (mainHtmlNow.match(/<div class="sx-foot">([\s\S]*?)<\/div>/) || [])[1] || "";
  check(footMatch.indexOf("Ctrl+Shift+K") >= 0, "ks16a Settings footer shows rebound Maintenance chord Ctrl+Shift+K");
  check(footMatch.indexOf("new key") === -1, "ks16b Settings footer removes 'new key' chip when Maintenance is rebound");

  const footDefaultMatch = (mainHtml.match(/<div class="sx-foot">([\s\S]*?)<\/div>/) || [])[1] || "";
  check(footDefaultMatch.indexOf("new key") === -1 && footDefaultMatch.indexOf("chip") === -1,
    "ks16d Settings footer has no new key chip beside Maintenance at default shortcut, rail does not overflow");

  // Rebind Find to Ctrl+F
  uiBox.StudioKeys.scTake("find", 1, { code: "KeyF", key: "f", ctrl: 1, alt: 0, shift: 0, meta: 0 });
  uiPage.S.open = { dir: "cat1", project: { id: "p1", rev: 1 } };
  uiPage.S.screen = "project";
  uiPage.S.section = "cards";
  uiPage.paintChrome();
  const chromeHtml = (uiDoc.querySelector("#chrome") || {})._html || "";
  check(chromeHtml.indexOf("Ctrl+F") >= 0, "ks16c Find button title reflects rebound chord Ctrl+F");

  // Rebind Undo to Ctrl+U
  uiBox.StudioKeys.scTake("undo", 1, { code: "KeyU", key: "u", ctrl: 1, alt: 0, shift: 0, meta: 0 });
  uiPage.S.screen = "projects";
  uiPage.S.clearedMemory = true;
  uiPage.paintUndo();
  const undoHtml = (uiDoc.querySelector("#undo") || {})._html || "";
  check(undoHtml.indexOf("Ctrl+U") >= 0, "ks16d Undo bar reflects rebound chord Ctrl+U");
  uiPage.S.clearedMemory = false;

  // Rebind Rename to F3
  uiBox.StudioKeys.scTake("rename", 1, { code: "F3", key: "F3", ctrl: 0, alt: 0, shift: 0, meta: 0 });
  const ctxItems = uiPage.CTX_KINDS.project(fakeElem);
  const renameAct = ctxItems && ctxItems.acts && ctxItems.acts.find(a => a.said === "Rename");
  check(renameAct && renameAct.key === "F3", "ks16e Project context menu reflects rebound Rename chord F3");

  // Rebind Places to Ctrl+Down
  uiBox.StudioKeys.scTake("places", 1, { code: "ArrowDown", key: "ArrowDown", ctrl: 1, alt: 0, shift: 0, meta: 0 });
  uiPage.paint();
  const placesBtn = uiDoc.querySelector("#btnPlaces");
  check(placesBtn && (placesBtn.title || placesBtn.getAttribute("title") || "").indexOf("Ctrl+Down") >= 0,
    "ks16f Places tooltip reflects rebound Places chord Ctrl+Down");

  if (!process.argv.includes("--keep")) {
    dropScratch(SCRATCH);
  }

  process.stdout.write("\n" + asserted + " checks, " + failed + " failures\n");
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
