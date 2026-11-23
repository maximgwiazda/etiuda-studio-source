/* A PROJECT'S NAME IS WRITTEN ONCE, WHEN THE FIELD IS LEFT (desktop polish, 2026-10-12).
 *
 *     node tests/rename-once.mjs
 *
 * The name used to be sent 350 ms after every pause, so the folder on disk moved while the name was still being
 * typed. It is still a live field. Enter and leaving the field send it; Escape puts the saved name back and sends
 * nothing. A pause sends nothing. Opening the project while a rename is already on its way waits for that rename
 * and opens the folder it moved to.
 *
 *   rn1  the key and the leaving are the page's own listeners
 *   rn2  half a second after a keystroke, nothing has been sent and the name is still pending
 *   rn3  Enter sends it once: the folder moves and the record follows
 *   rn4  Escape puts the saved name back, sends nothing, and does not close a cover
 *   rn5  leaving the field sends it
 *   rn6  an empty name is not sent: Enter restores the saved name
 *   rn7  a read-only name, the field of a project that will not read, is left alone
 *   rn8  Shift+Enter does not send
 *   rn9  opening the project while the rename is still in flight opens the folder it moved to
 *   rn10 the saved name typed again is not sent
 *   rn13 with a project open, Enter in another row's name on the Projects screen renames that row's project, and
 *        the open project keeps its name and its folder
 *   rn14 the status bar says "draft saved" while a name waits for Enter, and "saving the draft…" only while it is on
 *        its way
 *   rn12 every leg ran
 *
 * PROVED BY MAKING IT FAIL: RENAME_ONCE_APP=<a copy of ui/app.js> reads that copy. The report of the build that
 * added this file says which part was taken out.
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
const SCRATCH = path.join(ROOT, "scratch", "rename-once");
const EXPECTED = 14;
const source = process.env.RENAME_ONCE_APP ? fs.readFileSync(path.resolve(process.env.RENAME_ONCE_APP), "utf8") : undefined;

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
const read = (dir, f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return null; } };

function field(dir, value, extra) {
  return Object.assign({
    tagName: "INPUT", id: "", value, readOnly: false, disabled: false,
    getAttribute(k) { return k === "data-proj" ? dir : null; },
    setAttribute() {},
    closest() { return null; },
  }, extra || {});
}
function keyEvent(key, target, extra) {
  return Object.assign({
    key, target, altKey: false, metaKey: false, ctrlKey: false, shiftKey: false, isComposing: false,
    defaultPrevented: false, stopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() {},
    stopImmediatePropagation() { this.stopped = true; },
  }, extra || {});
}

async function main() {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const langs = [{ code: "en" }, { code: "pl" }];
  const pause = await S.newProject(root, "Pause name", langs);
  const held = await S.newProject(root, "Held name", langs);
  const race = await S.newProject(root, "Race name", langs);
  const openOne = await S.newProject(root, "Open one", langs);
  const other = await S.newProject(root, "Other one", langs);

  const calls = [];
  const opened = [];
  let delayNext = 0;
  const api = {
    newProject: (n, l, o) => wire(S.newProject(root, n, l, o)),
    open: (d) => { opened.push(d); return wire(S.openProject(d)); },
    projects: () => wire(S.listProjects(root)),
    proposals: (d) => wire(S.listProposals(d)),
    saveCard: (d, i, p) => wire(S.saveCard(d, i, p)),
    findPlaces: (d) => wire(S.findPlaces(d, { q: "parcels" })),
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    renameTag: (d, i, t) => wire(S.renameTag(d, i, t)),
    renameProject: (d, n) => {
      calls.push(n);
      const go = () => wire(S.renameProject(d, n));
      if (!delayNext) return go();
      const ms = delayNext;
      delayNext = 0;
      return sleep(ms).then(go);
    },
    saveFacts: (d, t) => wire(S.saveFacts(d, t)),
    discardUntouched: (d) => wire(S.discardUntouched(d)),
  };
  const home = loadPage({ api, uiLang: "en", source });
  const P = home.page;
  P.S.host = { tour: { offered: true }, langs: S.builtLangs() };
  const pending = () => P.__get("projPending");
  function fire(type, ev) {
    let out = "";
    for (const h of home.doc.heard) {
      if (h.type !== type) continue;
      const r = h.fn(ev);
      if (typeof r === "string" && r) out = r;
      if (ev.stopped) break;
    }
    return out;
  }
  const typeName = (dir, value, extra) => {
    const f = field(dir, value, extra);
    fire("input", { target: f });
    return f;
  };
  const named = (dir) => (read(dir, "project.json") || {}).displayName || "";

  const keys = home.doc.heard.filter((h) => h.type === "keydown").map((h) => h.fn);
  const leaves = home.doc.heard.filter((h) => h.type === "focusout").map((h) => h.fn);
  check(typeof P.projectNameKey === "function" && keys.indexOf(P.projectNameKey) >= 0,
    "rn1a Enter and Escape on the name are the page's own key listener");
  check(typeof P.projectNameLeave === "function" && leaves.indexOf(P.projectNameLeave) >= 0,
    "rn1b leaving the name is the page's own focus listener");

  /* ---- 2. A PAUSE SENDS NOTHING -------------------------------------------------------------- */
  await P.openDir(pause.dir);
  const n2 = calls.length;
  typeName(pause.dir, "Pause name typed");
  await sleep(480);
  check(calls.length === n2 && fs.existsSync(pause.dir) && named(pause.dir) === "Pause name"
      && pending() && pending().dir === pause.dir && pending().name === "Pause name typed",
    "rn2 half a second after the keystroke the folder is unmoved and the name is still pending: "
    + calls.slice(n2).join("|") + ", pending " + JSON.stringify(pending()));
  P.__set("projPending", null);

  /* ---- 3. ENTER SENDS IT ONCE ---------------------------------------------------------------- */
  await P.openDir(held.dir);
  const n3 = calls.length;
  const f3 = typeName(held.dir, "Held renamed");
  const k3 = fire("keydown", keyEvent("Enter", f3));
  await sleep(50);
  const moved3 = path.join(root, "Held renamed");
  check(k3 === "commit" && calls.length === n3 + 1 && calls[n3] === "Held renamed"
      && !fs.existsSync(held.dir) && named(moved3) === "Held renamed" && !pending(),
    "rn3 Enter sends the name once and the folder follows it: " + k3 + ", calls " + calls.slice(n3).join("|")
    + ", pending " + JSON.stringify(pending()));

  /* ---- 4. ESCAPE PUTS THE SAVED NAME BACK ---------------------------------------------------- */
  P.S.cover = "lang";
  const n4 = calls.length;
  const f4 = typeName(moved3, "Held renamed again");
  const k4 = fire("keydown", keyEvent("Escape", f4));
  await sleep(480);
  check(k4 === "cancel" && f4.value === "Held renamed" && !pending() && calls.length === n4
      && named(moved3) === "Held renamed" && P.S.cover === "lang",
    "rn4 Escape restores the saved name, sends nothing, and leaves the cover up: " + k4
    + ", value " + JSON.stringify(f4.value) + ", cover " + P.S.cover + ", calls " + calls.slice(n4).join("|"));
  P.S.cover = null;

  /* ---- 5. LEAVING THE FIELD SENDS IT --------------------------------------------------------- */
  const n5 = calls.length;
  const f5 = typeName(moved3, "Held renamed twice");
  const k5 = fire("focusout", { target: f5, stopped: false });
  await sleep(50);
  const moved5 = path.join(root, "Held renamed twice");
  check(k5 === "commit" && calls.length === n5 + 1 && !fs.existsSync(moved3) && named(moved5) === "Held renamed twice",
    "rn5 leaving the field sends the name and the folder follows it: " + k5 + ", calls " + calls.slice(n5).join("|"));

  /* ---- 6. AN EMPTY NAME IS PUT BACK ---------------------------------------------------------- */
  const n6 = calls.length;
  const f6 = typeName(moved5, "   ");
  const k6 = fire("keydown", keyEvent("Enter", f6));
  await sleep(40);
  check(k6 === "cancel" && f6.value === "Held renamed twice" && !pending() && calls.length === n6
      && named(moved5) === "Held renamed twice",
    "rn6 Enter on an empty name restores the saved one and sends nothing: " + k6
    + ", value " + JSON.stringify(f6.value) + ", calls " + calls.slice(n6).join("|"));

  /* ---- 7. A READ-ONLY NAME IS LEFT ALONE ----------------------------------------------------- */
  const n7 = calls.length;
  const f7 = typeName(moved5, "Should not send", { readOnly: true });
  const k7 = fire("keydown", keyEvent("Enter", f7));
  await sleep(40);
  check(k7 === "" && !pending() && calls.length === n7 && f7.value === "Should not send",
    "rn7 a read-only name takes neither the keystroke nor Enter: " + JSON.stringify(k7)
    + ", pending " + JSON.stringify(pending()) + ", calls " + calls.slice(n7).join("|"));

  /* ---- 8. SHIFT+ENTER DOES NOT SEND ---------------------------------------------------------- */
  const n8 = calls.length;
  const f8 = typeName(moved5, "Shifted name");
  const k8 = fire("keydown", keyEvent("Enter", f8, { shiftKey: true }));
  check(k8 === "" && calls.length === n8 && pending() && pending().name === "Shifted name",
    "rn8 Shift+Enter leaves the name pending and unsent: " + JSON.stringify(k8) + ", calls " + calls.slice(n8).join("|"));
  fire("keydown", keyEvent("Escape", f8));

  /* ---- 9. A RENAME ALREADY ON ITS WAY IS THE FOLDER THAT OPENS ------------------------------- */
  await P.openDir(race.dir);
  delayNext = 250;
  const n9 = calls.length;
  const at9 = opened.length;
  const f9 = typeName(race.dir, "Race won");
  fire("keydown", keyEvent("Enter", f9));
  const start9 = Date.now();
  while (calls.length === n9 && Date.now() - start9 < 800) await sleep(20);
  const open9 = P.openDir(race.dir);
  await open9;
  await sleep(300);
  const went = opened[at9];
  check(calls.length >= n9 + 1 && went && went !== race.dir && fs.existsSync(went)
      && named(went) === "Race won" && !fs.existsSync(race.dir),
    "rn9 the open that arrives while the rename is in flight opens the folder it moved to: "
    + JSON.stringify(went) + ", calls " + calls.slice(n9).join("|"));
  delayNext = 0;

  /* ---- 10. THE SAVED NAME AGAIN IS NOT A RENAME ---------------------------------------------- */
  const home10 = went && fs.existsSync(went) ? went : race.dir;
  if (fs.existsSync(home10)) await P.openDir(home10);
  const n10 = calls.length;
  const saved10 = named(home10);
  const f10 = typeName(home10, saved10);
  const k10 = fire("focusout", { target: f10, stopped: false });
  await sleep(40);
  check(k10 === "same" && calls.length === n10 && !pending() && named(home10) === saved10,
    "rn10 leaving a field that still says the saved name sends nothing: " + JSON.stringify(k10)
    + ", calls " + calls.slice(n10).join("|"));

  /* ---- 13. ANOTHER ROW'S NAME RENAMES THAT ROW'S PROJECT (the test architect's x2, his condition 3 of 2026-10-13) ----
     On the Projects screen every row is a name field. With one project open, a name typed into another row and sent
     with Enter renames that row's project. The open one keeps its name and its folder: renaming it instead would move
     the wrong folder. */
  await P.openDir(openOne.dir);
  P.S.projects = (await wire(S.listProjects(root))).projects || [];
  P.S.screen = "projects";
  const n13 = calls.length;
  const f13 = typeName(other.dir, "Other renamed");
  const k13 = fire("keydown", keyEvent("Enter", f13));
  await sleep(60);
  const moved13 = path.join(root, "Other renamed");
  check(k13 === "commit" && calls.length === n13 + 1 && calls[n13] === "Other renamed"
      && !fs.existsSync(other.dir) && named(moved13) === "Other renamed"
      && fs.existsSync(openOne.dir) && named(openOne.dir) === "Open one"
      && !!P.S.open && P.S.open.dir === openOne.dir && P.S.open.name === "Open one" && !pending(),
    "rn13 with a project open, Enter in another row's name renames that row's project and leaves the open one alone: "
    + k13 + ", calls " + calls.slice(n13).join("|") + ", the open one " + JSON.stringify(named(openOne.dir))
    + " at " + JSON.stringify(P.S.open && path.basename(P.S.open.dir)));

  /* ---- 14. THE BAR SAYS SAVING ONLY WHILE THE NAME IS ON ITS WAY (the test architect's read, passed on by Claude α) ----
     A name waiting for Enter, or for its field to be left, is not a write, and no timer will send it: the bar keeps
     saying "draft saved". From Enter until the folder has moved it says "saving the draft…", then "draft saved". */
  P.S.screen = "project";
  const bar = () => String(P.statusLeftHtml() || "");
  const st0 = P.saveState();
  const f14 = typeName(openOne.dir, "Open renamed");
  await sleep(100);
  const st1 = P.saveState(), bar1 = bar(), waiting = pending();
  delayNext = 200;
  const n14 = calls.length;
  fire("keydown", keyEvent("Enter", f14));
  const start14 = Date.now();
  while (calls.length === n14 && Date.now() - start14 < 800) await sleep(10);
  const st2 = P.saveState(), bar2 = bar();
  await sleep(400);
  const st3 = P.saveState(), bar3 = bar();
  delayNext = 0;
  check(st0 === "saved" && st1 === "saved" && /draft saved/.test(bar1) && !/saving/.test(bar1)
      && !!waiting && waiting.name === "Open renamed"
      && st2 === "saving" && /saving the draft/.test(bar2) && st3 === "saved" && /draft saved/.test(bar3)
      && named(path.join(root, "Open renamed")) === "Open renamed",
    "rn14 the bar says \"draft saved\" while a name waits for Enter, \"saving the draft…\" while it is on its way, then"
    + " \"draft saved\": " + JSON.stringify([st0, st1, st2, st3]));

  check(asserted + 1 === EXPECTED, "rn12 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
  process.stdout.write("rename-once: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  dropScratch(SCRATCH, "rename-once");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write("  FAIL tests/rename-once.mjs threw: " + (e && e.stack || e) + "\n");
  dropScratch(SCRATCH, "rename-once");
  process.exit(1);
});
