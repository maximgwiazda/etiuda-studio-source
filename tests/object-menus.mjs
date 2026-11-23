/* EVERY OBJECT HAS ITS MENU, AND EVERY TITLE THAT CAN BE RENAMED RENAMES ONE WAY (board 901).
 *
 *     node tests/object-menus.mjs
 *
 * Maxim, 2026-10-15 01:13: "Right click should open a menu that lets rename thing. Perhaps it should apply to other
 * titles that could be renamed?" The page is ui/app.js on the stand-in (tests/page-stand-in.mjs), driven through the
 * listeners it puts on the document, with invented projects written by src/studio.mjs into a scratch folder. The objects
 * are small stand-in nodes that answer closest() and querySelectorAll() as the page asks them; the page never sees a
 * window, so where the menu hangs and what the eye sees are a window run's (the report says which).
 *
 *   om1  a right-click on an object opens its menu: the copies and Show in folder first, a rule, then its acts
 *   om2  the Menu key opens the menu of the object the hand is on, with the hand on its first row
 *   om3  Shift+F10 does the same
 *   om4  Escape shuts the menu and the hand goes back where it was, the object for the keys, the field it was in for
 *        the pointer
 *   om5  in a field, a right-click, the Menu key and Shift+F10 are the field's own, the shell's edit menu
 *   om6  a press anywhere else shuts the menu
 *   om7  the clipboard rows copy from the object they were opened on: a project's path, a card's title, text and id
 *   om8  Show in folder shows the object's own file or folder: a project's folder, an edition's catalog file
 *   om9  a button the object shows is a row of its menu, pressed where it stands
 *   om10 the objects are marked in the screens' own markup: project rows, tabs, card rows, tiles, map nodes, lint rows,
 *        editions, categories and intents, languages, proposals, desks, variables, changes and paths shown as text
 *   rn1  F2 on a project's row puts a field over its name, where it stands
 *   rn2  Enter keeps the name: the folder moves, and the field is text again
 *   rn3  Escape leaves the name as it was: nothing is sent
 *   rn4  the row's menu has Rename, which does what F2 does
 *   rn5  a card's title by F2 on its row: Enter keeps it in the language the row shows, Escape sends nothing
 *   rn6  a project's tab renames in place too
 *   rn7  a desk's name is its own: its menu has no Rename, F2 does nothing, and nothing is sent
 *   rn8  a category's name, a field already: Escape puts back the name it had, Enter keeps the typed one
 *
 * PROVED BY MAKING IT FAIL. Each check is planted red first: the planted source is written over the file, a child runs
 * that one check and must print PLANT-RED, and the file is put back by its sha256 before the next plant (the PLANTS
 * list, and join-live's way). The green run is this process, after every plant.
 *
 * Node only, no window. Exit 0 when every plant bites and every check holds, 1 otherwise.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { plantText } from "./plant-copy.mjs";
import { fileURLToPath } from "node:url";
import * as Studio from "../src/studio.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "object-menus");
/* Set before the first plant. The child runs from this copy, so its ROOT is the copy. */
let tree = null;
const ONLY = process.env.OBJECT_MENUS_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const IDS = ["om1", "om2", "om3", "om4", "om5", "om6", "om7", "om8", "om9", "om10",
  "rn1", "rn2", "rn3", "rn4", "rn5", "rn6", "rn7", "rn8"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function no(id, why) { console.error(id + " " + why); return false; }

/* ---- stand-in nodes ----------------------------------------------------------------------------
 * Enough of an element for the page's own reading of it: attributes, a parent, children, the simple selectors the page
 * hands closest() and querySelectorAll() (a tag, #id, .class, [attr] and [attr="v"], and lists of them), focus. */
let DOC = null;
function matchOne(n, one) {
  const m = /^([a-zA-Z][\w-]*)?((?:#[\w-]+|\.[\w-]+|\[[^\]]+\]|:not\([^)]*\))*)$/.exec(one.trim());
  if (!m) return false;
  if (m[1] && String(n.tagName || "") !== m[1].toUpperCase()) return false;
  return (m[2].match(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:not\([^)]*\)/g) || []).every((p) => {
    if (p[0] === "#") return n.id === p.slice(1);
    if (p[0] === ".") return !!(n.classes && n.classes.has(p.slice(1)));
    if (p.startsWith(":not(")) return !matchOne(n, p.slice(5, -1));
    const a = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(p);
    if (!a) return false;
    const has = n.attrs && Object.prototype.hasOwnProperty.call(n.attrs, a[1]);
    return a[2] === undefined ? has : has && String(n.attrs[a[1]]) === a[2];
  });
}
const matches = (n, sel) => String(sel).split(",").some((one) => matchOne(n, one));
function node(tag, attrs, kids, text) {
  const a = Object.assign({}, attrs || {});
  const n = {
    tagName: String(tag).toUpperCase(), attrs: a, children: [], parentNode: null, id: a.id || "",
    classes: new Set(String(a.class || "").split(/\s+/).filter(Boolean)), textContent: text || "",
    value: a.value != null ? String(a.value) : "", disabled: false, readOnly: false, isConnected: true, isComposing: false,
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? String(this.attrs[k]) : null; },
    hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k); },
    setAttribute(k, v) { this.attrs[k] = String(v); }, removeAttribute(k) { delete this.attrs[k]; },
    closest(sel) { for (let x = this; x; x = x.parentNode) if (x.attrs && matches(x, sel)) return x; return null; },
    matches(sel) { return matches(this, sel); },
    querySelectorAll(sel) {
      const out = [];
      const walk = (x) => x.children.forEach((c) => { if (matches(c, sel)) out.push(c); walk(c); });
      walk(this);
      return out;
    },
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
    focus() { DOC.focused = this; }, blur() {}, select() {},
    getBoundingClientRect() { return { left: 120, top: 240, width: 400, height: 34, right: 520, bottom: 274 }; },
  };
  n.classList = { contains: (c) => n.classes.has(c), add() {}, remove() {}, toggle() {} };
  (kids || []).forEach((k) => { k.parentNode = n; n.children.push(k); });
  return n;
}
/** An event as the page reads one: its target, its keys and what was done to it. */
function ev(type, target, o) {
  return Object.assign({
    type, target, key: "", altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, isComposing: false, button: 0,
    clientX: 300, clientY: 260, defaultPrevented: false, stopped: false, halted: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.stopped = true; },
    stopImmediatePropagation() { this.stopped = true; this.halted = true; },
  }, o || {});
}

/* ---- the world -------------------------------------------------------------------------------- */
const wire = (p) => Promise.resolve(p)
  .then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch((e) => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));

async function world(name) {
  const base = path.join(SCRATCH, name + "-" + process.pid + "-" + crypto.randomBytes(3).toString("hex"));
  const root = path.join(base, "projects");
  fs.mkdirSync(root, { recursive: true });
  const langs = [{ code: "en" }, { code: "pl" }];
  const lamps = await Studio.newProject(root, "Harbour lamps", langs);
  const ropes = await Studio.newProject(root, "Quay ropes", langs);
  const shelf = (await Studio.addTag(lamps.dir, "shelf", { en: "Docks", pl: "Doki" })).tag.id;
  const card = (await Studio.addCard(lamps.dir, shelf, "Wharf lantern", "The lantern on the north wharf is lit at dusk.")).card;
  const calls = [];
  const said = (verb) => (...a) => { calls.push([verb].concat(a)); };
  const api = {
    newProject: (n, l, o) => wire(Studio.newProject(root, n, l, o)),
    open: (d) => { said("open")(d); return wire(Studio.openProject(d)); },
    projects: () => wire(Studio.listProjects(root)),
    proposals: (d) => wire(Studio.listProposals(d)),
    saveCard: (d, i, p) => { said("saveCard")(d, i, p); return wire(Studio.saveCard(d, i, p)); },
    renameTag: (d, i, t) => { said("renameTag")(d, i, t); return wire(Studio.renameTag(d, i, t)); },
    renameProject: (d, n) => { said("renameProject")(d, n); return wire(Studio.renameProject(d, n)); },
    saveFacts: (d, t) => wire(Studio.saveFacts(d, t)),
    discardUntouched: (d) => wire(Studio.discardUntouched(d)),
    findPlaces: (d) => wire(Studio.findPlaces(d, { q: "" })),
    cardHistory: (d, i) => wire(Studio.cardHistory(d, i)),
    copy: (t) => { said("copy")(t); return Promise.resolve({ error: null, copied: true }); },
    show: (p) => { said("show")(p); return Promise.resolve({ error: null, shown: p }); },
    removeProject: (d) => { said("removeProject")(d); return Promise.resolve({ error: null, removed: true, dir: d }); },
  };
  const pg = loadPage({ api, uiLang: "en" });
  const P = pg.page;
  DOC = pg.doc;
  P.S.host = { tour: { offered: true }, langs: Studio.builtLangs() };
  /* The object's menu hangs in the page's own #ctxMenu: its first row and the box itself take the hand here. */
  const box = pg.node("#ctxMenu");
  Object.assign(box, { id: "ctxMenu", tagName: "DIV", classes: new Set(["menu-list", "ctx-menu"]), parentNode: null });
  const firstRow = node("button", { role: "menuitem", "data-act": "ctx-item", "data-v": "0" });
  firstRow.parentNode = box;
  box.querySelector = () => firstRow;
  box.focus = () => { DOC.focused = box; };
  const listed = await Studio.listProjects(root);
  Object.assign(P.S, { projects: listed.projects, root, screen: "projects", home: "library", pfilter: "all", q: "", err: null });
  /** The page's listeners for one event, the capture ones first, as a browser runs them at the document. */
  function fire(type, e) {
    const all = pg.doc.heard.filter((h) => h.type === type);
    const out = [];
    for (const h of all.filter((x) => x.capture).concat(all.filter((x) => !x.capture))) {
      if (e.halted || (e.stopped && !h.capture)) break;
      const r = h.fn(e);
      if (typeof r === "string" && r) out.push(r);
    }
    return out;
  }
  const rowOf = (dir) => node("tr", { "data-ctx": "project", "data-where": "row", "data-act": "open", "data-dir": dir, tabindex: "0" },
    [node("td", { class: "t-title" }, [node("span", { class: "pn", "data-proj": dir })]), node("td", {})]);
  const saids = () => ((P.S.ctx && P.S.ctx.items) || []).map((i) => (i === "-" ? "-" : i.said));
  /** Presses the menu row that says `said`, as a click on it would. */
  async function press(said) {
    const at = saids().indexOf(said);
    if (at < 0) return false;
    P.ACTS["ctx-item"](node("button", { "data-act": "ctx-item", "data-v": String(at) }));
    await sleep(30);
    return true;
  }
  return { base, root, lamps, ropes, shelf, card, calls, api, pg, P, box, firstRow, fire, rowOf, saids, press };
}
const count = (calls, verb) => calls.filter((c) => c[0] === verb).length;

/* ---- the checks -------------------------------------------------------------------------------- */
const CHECKS = {
  async om1() {
    const w = await world("om1");
    const row = w.rowOf(w.lamps.dir), cell = row.children[0];
    const e = ev("contextmenu", cell);
    w.fire("contextmenu", e);
    const s = w.saids();
    const want = ["Copy the name", "Copy the path", "Show in folder", "-", "Open", "Rename", "Move to the Recycle Bin"];
    if (!w.P.S.ctx || w.P.S.ctx.kind !== "project") return no("om1", "no project menu: " + JSON.stringify(w.P.S.ctx));
    if (!e.defaultPrevented) return no("om1", "the browser's own menu was not held back");
    if (JSON.stringify(s) !== JSON.stringify(want)) return no("om1", "rows " + JSON.stringify(s));
    if (w.box.hidden !== false || !/data-act="ctx-item"/.test(w.box.innerHTML)) return no("om1", "the list was not painted");
    if (w.pg.doc.focused !== w.box) return no("om1", "a pointer's menu takes the hand into the list");
    return true;
  },
  async om2() {
    const w = await world("om2");
    const row = w.rowOf(w.ropes.dir);
    row.focus();
    const e = ev("keydown", row, { key: "ContextMenu" });
    w.fire("keydown", e);
    if (!w.P.S.ctx || w.P.S.ctx.kind !== "project") return no("om2", "the Menu key opened nothing");
    if (!e.defaultPrevented) return no("om2", "the key went on to the shell");
    if (w.pg.doc.focused !== w.firstRow) return no("om2", "the hand is not on the first row");
    return true;
  },
  async om3() {
    const w = await world("om3");
    const row = w.rowOf(w.ropes.dir);
    row.focus();
    const e = ev("keydown", row, { key: "F10", shiftKey: true });
    w.fire("keydown", e);
    if (!w.P.S.ctx || w.P.S.ctx.kind !== "project") return no("om3", "Shift+F10 opened nothing");
    if (w.pg.doc.focused !== w.firstRow) return no("om3", "the hand is not on the first row");
    return true;
  },
  async om4() {
    const w = await world("om4");
    const row = w.rowOf(w.lamps.dir);
    row.focus();
    w.fire("keydown", ev("keydown", row, { key: "ContextMenu" }));
    const esc = ev("keydown", w.firstRow, { key: "Escape" });
    w.fire("keydown", esc);
    if (w.P.S.ctx) return no("om4", "Escape left the menu open");
    if (w.box.hidden !== true) return no("om4", "the list is still shown");
    if (w.pg.doc.focused !== row) return no("om4", "the hand did not go back to the row");
    /* by the pointer, from a field elsewhere: the hand goes back to the field */
    const field = node("input", { id: "q" });
    field.focus();
    w.fire("contextmenu", ev("contextmenu", w.rowOf(w.ropes.dir).children[0]));
    w.fire("keydown", ev("keydown", w.box, { key: "Escape" }));
    if (w.P.S.ctx || w.pg.doc.focused !== field) return no("om4", "a pointer's menu did not hand the hand back to the field");
    /* Tab shuts it too, and hands the hand back */
    row.focus();
    w.fire("keydown", ev("keydown", row, { key: "ContextMenu" }));
    const tab = ev("keydown", w.firstRow, { key: "Tab" });
    w.fire("keydown", tab);
    if (w.P.S.ctx || w.pg.doc.focused !== row || !tab.defaultPrevented) return no("om4", "Tab did not shut and hand back");
    return true;
  },
  async om5() {
    const w = await world("om5");
    const row = w.rowOf(w.lamps.dir);
    const input = node("input", { "data-proj": w.lamps.dir });
    row.children[0].children.push(input); input.parentNode = row.children[0];
    const e1 = ev("contextmenu", input);
    w.fire("contextmenu", e1);
    input.focus();
    const e2 = ev("keydown", input, { key: "ContextMenu" });
    w.fire("keydown", e2);
    const e3 = ev("keydown", input, { key: "F10", shiftKey: true });
    w.fire("keydown", e3);
    if (w.P.S.ctx) return no("om5", "a field opened an object's menu");
    if (e1.defaultPrevented || e2.defaultPrevented || e3.defaultPrevented) return no("om5", "the field's own menu was held back");
    return true;
  },
  async om6() {
    const w = await world("om6");
    w.fire("contextmenu", ev("contextmenu", w.rowOf(w.lamps.dir).children[0]));
    if (!w.P.S.ctx) return no("om6", "no menu to shut");
    w.fire("click", ev("click", node("div", { class: "pad" })));
    if (w.P.S.ctx || w.box.hidden !== true) return no("om6", "a press elsewhere left the menu open");
    return true;
  },
  async om7() {
    const w = await world("om7");
    w.fire("contextmenu", ev("contextmenu", w.rowOf(w.ropes.dir).children[0]));
    await w.press("Copy the path");
    const path1 = w.calls.filter((c) => c[0] === "copy").map((c) => c[1]);
    if (path1.length !== 1 || path1[0] !== w.ropes.dir) return no("om7", "Copy the path copied " + JSON.stringify(path1));
    w.fire("contextmenu", ev("contextmenu", w.rowOf(w.lamps.dir).children[0]));
    await w.press("Copy the name");
    await w.P.openDir(w.lamps.dir);
    const cardRow = node("tr", { "data-ctx": "card", "data-where": "card", "data-act": "pick", "data-id": w.card.id });
    w.fire("contextmenu", ev("contextmenu", cardRow));
    const kinds = w.saids();
    await w.press("Copy the title");
    w.fire("contextmenu", ev("contextmenu", cardRow));
    await w.press("Copy the text");
    w.fire("contextmenu", ev("contextmenu", cardRow));
    await w.press("Copy the id");
    const got = w.calls.filter((c) => c[0] === "copy").map((c) => c[1]);
    const want = [w.ropes.dir, "Harbour lamps", "Wharf lantern", "The lantern on the north wharf is lit at dusk.", w.card.id];
    if (JSON.stringify(got) !== JSON.stringify(want)) return no("om7", "copied " + JSON.stringify(got) + " rows " + JSON.stringify(kinds));
    if (kinds.indexOf("Show in folder") >= 0) return no("om7", "a card is no file, yet its menu offers Show in folder");
    return true;
  },
  async om8() {
    const w = await world("om8");
    w.fire("contextmenu", ev("contextmenu", w.rowOf(w.ropes.dir).children[0]));
    await w.press("Show in folder");
    await w.P.openDir(w.lamps.dir);
    const file = path.join(w.lamps.dir, "archive", "2026-10-15-quay", "catalog.ec");
    w.P.S.arch = { editions: [{ edition: "2026-10-15-quay", file }] };
    const ed = node("tr", { "data-ctx": "edition", "data-act": "arch-pick", "data-e": "2026-10-15-quay" });
    w.fire("contextmenu", ev("contextmenu", ed));
    await w.press("Show in folder");
    const shown = w.calls.filter((c) => c[0] === "show").map((c) => c[1]);
    if (JSON.stringify(shown) !== JSON.stringify([w.ropes.dir, file])) return no("om8", "shown " + JSON.stringify(shown));
    return true;
  },
  async om9() {
    const w = await world("om9");
    await w.P.openDir(w.lamps.dir);
    w.P.S.section = "lint";
    const jump = node("button", { class: "btn sm", "data-act": "jump", "data-id": w.card.id, "data-sec": "cards", "data-fld": "title", "data-l": "pl" }, [], "Jump to it");
    const lint = node("tr", { "data-ctx": "finding", "data-id": w.card.id }, [
      node("td", { class: "t-title" }, [], "the Polish title is missing"), node("td", {}, [jump])]);
    w.fire("contextmenu", ev("contextmenu", lint.children[0]));
    const s = w.saids();
    if (s.indexOf("Jump to it") < 0 || s.indexOf("Copy the finding") !== 0) return no("om9", "rows " + JSON.stringify(s));
    await w.press("Jump to it");
    if (w.P.S.section !== "cards" || w.P.S.sel !== w.card.id) return no("om9", "the row's own Jump did not run: " + w.P.S.section + " " + w.P.S.sel);
    return true;
  },
  async om10() {
    const w = await world("om10");
    const P = w.P;
    Object.assign(P.S.projects[0], { folder: path.join(w.base, "share"), fileName: "harbour-lamps.ec", published: "2026-10-15T08:00:00.000Z" });
    P.S.home = "library";
    P.paintProjects();
    const projects = w.pg.node("#main").innerHTML;
    await P.openDir(w.lamps.dir);
    const c = P.__get("cardById")(w.card.id);
    const tabs = w.pg.node("#tabs").innerHTML;
    const row = P.rowHtml(c);
    const tile = P.tileHtml(c, "", { langs: ["en", "pl"] });
    let nodeHtml = "";
    try { nodeHtml = P.pathsCanvasHtml(P.pathsModel(w.card.id)); } catch (e) { nodeHtml = "threw " + e.message; }
    P.S.lfilter = "all";
    P.S.open.lint = { rows: [{ severity: "warning", what: "a line", where: "Wharf lantern", why: "", go: { id: w.card.id, section: "cards", field: "title", lang: "pl" } }],
      errors: 0, warnings: 1, awaiting: 0, suggestions: 0 };
    P.S.lintAs = "list";
    P.paintLint();
    const lint = w.pg.node("#main").innerHTML;
    P.S.arch = { editions: [{ edition: "2026-10-15-quay", rev: 1, counts: { cards: 1 }, notes: "" }] };
    P.paintArchive();
    const arch = w.pg.node("#main").innerHTML;
    P.S.q = "";
    P.__get("paintTags")("shelf", "Categories");
    const tagsHtml = w.pg.node("#main").innerHTML;
    const langRow = P.__get("langRowHtml")({ code: "pl", name: "Polski", primary: false, cards: 1, intents: 0, cats: 1, readable: true }, { of: { cards: 1, intents: 0, cats: 1 }, reads: "en, pl" }, 2);
    P.S.rv = { list: [{ name: "desk-a.ec", file: path.join(w.base, "share", "desk-a.ec"), ok: true, proposes: {}, pending: 1 }], inbox: path.join(w.base, "share") };
    P.paintProposalList();
    const props = w.pg.node("#main").innerHTML;
    const vr = P.__get("vrRow")("PAX", true);
    const chg = P.__get("chgRowHtml")({ n: 1, at: "2026-10-15T09:00:00.000Z", facts: true, cards: [] });
    const marks = {
      "project rows": (projects.match(/<tr[^>]*data-ctx="project"[^>]*data-where="row"[^>]*data-act="open"/g) || []).length === 2,
      "tabs": /data-ctx="project" data-where="tab"/.test(tabs),
      "card rows": /data-ctx="card" data-where="card"/.test(row),
      "tiles": /data-ctx="card" data-where="tile"/.test(tile),
      "map nodes": /data-ctx="card" data-where="node"/.test(nodeHtml),
      "lint rows": /<tr data-ctx="finding" data-id="/.test(lint),
      "lint rows by kind": /<tr class="bk-row" data-ctx="finding" data-id="/.test(P.__get("bkRowHtml")({ card: w.card.id, lang: "en", phrase: "by Friday", where: "" })),
      "editions": /data-ctx="edition" data-act="arch-pick"/.test(arch),
      "categories": /<tr data-ctx="tag" data-id="/.test(tagsHtml),
      "languages": /data-ctx="lang" data-v="pl"/.test(langRow),
      "proposals": /data-ctx="proposal" data-file="/.test(props),
      "the inbox path": /data-ctx="path" data-path="/.test(props),
      "variables": /data-ctx="variable"/.test(vr),
      "changes": /data-ctx="change"/.test(chg),
      "the catalog's path": (() => {
        const menu = P.ctxItems({
          getAttribute(k) {
            if (k === "data-ctx") return "project";
            if (k === "data-dir") return w.lamps.dir;
            if (k === "data-where") return "row";
            return null;
          },
          querySelectorAll() { return []; },
        }).map((it) => it && it.said).filter(Boolean);
        return menu.indexOf("Copy the path") >= 0 && menu.indexOf("Show in folder") >= 0 && !/data-ctx="path"/.test(projects);
      })(),
    };
    /* the desks' rows, from the Desks screen's own painter over an invented roster */
    P.S.desks = { folder: path.join(w.base, "share"), team: { relay: true, roster: [{ id: "k-8q", name: "Mira Quay", key: "8q2f", admitted: true }], sealed: false, epoch: 1 },
      requests: [], signing: null, invites: [] };
    try { P.paintDesks(); } catch (e) { /* the screen's other halves need more than this roster */ }
    const desks = w.pg.node("#main").innerHTML;
    marks.desks = /data-ctx="desk" data-name="Mira Quay"/.test(desks);
    marks["the team's folder"] = /data-ctx="path" data-path="/.test(desks);
    const missing = Object.keys(marks).filter((k) => !marks[k]);
    if (missing.length) return no("om10", "not marked: " + missing.join(", "));
    return true;
  },
  async rn1() {
    const w = await world("rn1");
    const row = w.rowOf(w.lamps.dir);
    row.focus();
    const e = ev("keydown", row, { key: "F2" });
    w.fire("keydown", e);
    const html = w.pg.node("#main").innerHTML;
    if (!w.P.S.naming || w.P.S.naming.where !== "row" || w.P.S.naming.key !== w.lamps.dir) return no("rn1", "F2 started nothing: " + JSON.stringify(w.P.S.naming));
    if (!e.defaultPrevented) return no("rn1", "F2 went on");
    if (!/<input class="field naming" data-naming data-proj="[^"]*Harbour lamps" value="Harbour lamps"/.test(html)) return no("rn1", "no field over the name");
    return true;
  },
  async rn2() {
    const w = await world("rn2");
    const row = w.rowOf(w.lamps.dir);
    row.focus();
    w.fire("keydown", ev("keydown", row, { key: "F2" }));
    const field = node("input", { "data-proj": w.lamps.dir, "data-naming": "" });
    field.value = "Harbour lights";
    w.fire("input", ev("input", field));
    w.fire("keydown", ev("keydown", field, { key: "Enter" }));
    await sleep(200);
    const moved = path.join(w.root, "Harbour lights");
    if (count(w.calls, "renameProject") !== 1) return no("rn2", "sent " + count(w.calls, "renameProject") + " times");
    if (!fs.existsSync(moved) || fs.existsSync(w.lamps.dir)) return no("rn2", "the folder did not move");
    if (w.P.S.naming) return no("rn2", "the field stayed after Enter");
    return true;
  },
  async rn3() {
    const w = await world("rn3");
    const row = w.rowOf(w.lamps.dir);
    row.focus();
    w.fire("keydown", ev("keydown", row, { key: "F2" }));
    const field = node("input", { "data-proj": w.lamps.dir, "data-naming": "" });
    field.value = "Lamps of the harbour";
    w.fire("input", ev("input", field));
    const esc = ev("keydown", field, { key: "Escape" });
    w.fire("keydown", esc);
    await sleep(150);
    if (count(w.calls, "renameProject") !== 0) return no("rn3", "Escape sent the name");
    if (!fs.existsSync(w.lamps.dir)) return no("rn3", "the folder moved");
    if (w.P.S.naming) return no("rn3", "the field stayed after Escape");
    /* Escape with nothing typed leaves too */
    row.focus();
    w.fire("keydown", ev("keydown", row, { key: "F2" }));
    const same = node("input", { "data-proj": w.lamps.dir, "data-naming": "" });
    same.value = "Harbour lamps";
    w.fire("keydown", ev("keydown", same, { key: "Escape" }));
    if (w.P.S.naming) return no("rn3", "Escape over an untouched name left the field");
    return true;
  },
  async rn4() {
    const w = await world("rn4");
    w.fire("contextmenu", ev("contextmenu", w.rowOf(w.ropes.dir).children[0]));
    await w.press("Rename");
    if (!w.P.S.naming || w.P.S.naming.where !== "row" || w.P.S.naming.key !== w.ropes.dir) return no("rn4", "Rename started nothing");
    return true;
  },
  async rn5() {
    const w = await world("rn5");
    await w.P.openDir(w.lamps.dir);
    const P = w.P;
    const row = node("tr", { "data-ctx": "card", "data-where": "card", "data-act": "pick", "data-id": w.card.id, tabindex: "0" });
    row.focus();
    w.fire("keydown", ev("keydown", row, { key: "F2" }));
    if (!P.S.naming || P.S.naming.where !== "card") return no("rn5", "F2 on a card's row started nothing");
    const c = P.__get("cardById")(w.card.id);
    if (!/data-naming data-rename="card" data-id="[^"]+" data-l="en" value="Wharf lantern"/.test(P.rowHtml(c))) return no("rn5", "no field in the row");
    const field = node("input", { "data-rename": "card", "data-id": w.card.id, "data-l": "en", "data-naming": "" });
    field.value = "North wharf lantern";
    w.fire("keydown", ev("keydown", field, { key: "Enter" }));
    await sleep(300);
    const saves = w.calls.filter((x) => x[0] === "saveCard");
    if (saves.length !== 1 || JSON.stringify(saves[0][3]) !== JSON.stringify({ title: { en: "North wharf lantern" } })) return no("rn5", "saved " + JSON.stringify(saves));
    if (P.S.naming) return no("rn5", "the field stayed after Enter");
    row.focus();
    w.fire("keydown", ev("keydown", row, { key: "F2" }));
    const again = node("input", { "data-rename": "card", "data-id": w.card.id, "data-l": "en", "data-naming": "" });
    again.value = "Something else";
    w.fire("keydown", ev("keydown", again, { key: "Escape" }));
    await sleep(450);
    if (w.calls.filter((x) => x[0] === "saveCard").length !== 1) return no("rn5", "Escape sent the title");
    if (P.S.naming) return no("rn5", "the field stayed after Escape");
    /* A bilingual card renamed in the second language keeps the first language's title byte for byte */
    c.title = { en: "North wharf lantern", pl: "Latarnia nabrzeżna" };
    P.S.lang = "pl";
    row.focus();
    w.fire("keydown", ev("keydown", row, { key: "F2" }));
    if (!/data-naming data-rename="card" data-id="[^"]+" data-l="pl" value="Latarnia nabrzeżna"/.test(P.rowHtml(c))) return no("rn5", "no Polish field in the row");
    const plField = node("input", { "data-rename": "card", "data-id": w.card.id, "data-l": "pl", "data-naming": "" });
    plField.value = "Latarnia północna";
    w.fire("keydown", ev("keydown", plField, { key: "Enter" }));
    await sleep(300);
    const plSaves = w.calls.filter((x) => x[0] === "saveCard");
    const lastSave = plSaves[plSaves.length - 1];
    if (!lastSave || JSON.stringify(lastSave[3]) !== JSON.stringify({ title: { pl: "Latarnia północna" } })) return no("rn5", "saved " + JSON.stringify(lastSave));
    if (c.title.en !== "North wharf lantern") return no("rn5", "English title changed: " + c.title.en);
    if (c.title.pl !== "Latarnia północna") return no("rn5", "Polish title not updated: " + c.title.pl);
    return true;
  },
  async rn6() {
    const w = await world("rn6");
    await w.P.openDir(w.lamps.dir);
    const tab = node("span", { "data-ctx": "project", "data-where": "tab", "data-act": "to-project", "data-dir": w.lamps.dir, tabindex: "0" });
    tab.focus();
    w.fire("keydown", ev("keydown", tab, { key: "F2" }));
    const html = w.pg.node("#tabs").innerHTML;
    if (!w.P.S.naming || w.P.S.naming.where !== "tab") return no("rn6", "F2 on a tab started nothing");
    if (!/data-where="tab" data-act="to-project" data-dir="[^"]*" tabindex="0"><input class="field naming" data-naming data-proj=/.test(html)) return no("rn6", "no field on the tab");
    return true;
  },
  async rn7() {
    const w = await world("rn7");
    const desk = node("tr", { "data-ctx": "desk", "data-name": "Mira Quay", "data-key": "8q2f", tabindex: "0" },
      [node("td", {}, [], "Mira Quay"), node("td", {}, [node("button", { "data-act": "member-remove", "data-id": "k-8q" }, [], "Remove")])]);
    desk.focus();
    const e = ev("keydown", desk, { key: "F2" });
    w.fire("keydown", e);
    w.fire("contextmenu", ev("contextmenu", desk.children[0]));
    const s = w.saids();
    if (w.P.S.naming || e.defaultPrevented) return no("rn7", "F2 renamed a desk: " + JSON.stringify(w.P.S.naming));
    if (s.indexOf("Rename") >= 0) return no("rn7", "a desk's menu offers Rename: " + JSON.stringify(s));
    if (s.indexOf("Copy the name") !== 0 || s.indexOf("Remove") < 0) return no("rn7", "rows " + JSON.stringify(s));
    if (count(w.calls, "renameProject") || count(w.calls, "renameTag") || count(w.calls, "saveCard")) return no("rn7", "something was sent");
    return true;
  },
  async rn8() {
    const w = await world("rn8");
    await w.P.openDir(w.lamps.dir);
    w.P.S.section = "categories";
    const row = node("tr", { "data-ctx": "tag", "data-id": w.shelf, tabindex: "0" });
    row.focus();
    const f2 = ev("keydown", row, { key: "F2" });
    w.fire("keydown", f2);
    if (!f2.defaultPrevented) return no("rn8", "F2 on a category did nothing");
    const field = node("input", { "data-tag": w.shelf, "data-l": "en" });
    field.value = "Docks";
    w.fire("focusin", ev("focusin", field));
    field.value = "Dockside";
    w.fire("input", ev("input", field));
    const esc = ev("keydown", field, { key: "Escape" });
    w.fire("keydown", esc);
    await sleep(500);
    const label = () => ((JSON.parse(fs.readFileSync(path.join(w.lamps.dir, DRAFT_FILE), "utf8")).tags || [])
      .find((t) => t.id === w.shelf) || { label: {} }).label.en;
    if (field.value !== "Docks" || label() !== "Docks") return no("rn8", "Escape left " + JSON.stringify(field.value) + " on screen, " + label() + " on disk");
    field.value = "Dockside";
    w.fire("input", ev("input", field));
    w.fire("keydown", ev("keydown", field, { key: "Enter" }));
    await sleep(80);
    if (label() !== "Dockside") return no("rn8", "Enter did not keep the name at once: " + label());
    return true;
  },
};

/* ---- the plants ----------------------------------------------------------------------------------
 * [check, file, the text as it stands, the text that puts the old behaviour back]. */
const PLANTS = [
  ["om1", "ui/app.js", '  document.addEventListener("contextmenu", ctxMouse);\n', ""],
  ["om2", "ui/app.js", 'e.key === "ContextMenu" || (e.key === "F10"', 'false || (e.key === "F10"'],
  ["om3", "ui/app.js", '(e.key === "F10" && e.shiftKey && !e.ctrlKey', '(false && e.shiftKey && !e.ctrlKey'],
  ["om4", "ui/app.js", "    if (box) { box.hidden = true; box.innerHTML = \"\"; }\n    if (!keyed) return;", "    if (box) { box.hidden = true; box.innerHTML = \"\"; }\n    return;"],
  ["om5", "ui/app.js", "const el = S.cover || S.tour != null || inField(t) ? null : ctxAt(t);", "const el = S.cover || S.tour != null ? null : ctxAt(t);"],
  ["om6", "ui/app.js", '    if (S.ctx && !el && !e.target.closest("#ctxMenu")) ctxShow(false);\n', ""],
  ["om7", "ui/app.js", ".map((c) => ctxRow(c[0], I(\"copy\"), () => ctxCopy(c[1])))", ".map((c) => ctxRow(c[0], I(\"copy\"), () => ctxCopy(own.copy[0][1])))"],
  ["om8", "ui/app.js", "      .concat(own.place ? [ctxRow(T(\"Show in folder\"), I(\"folder\"), () => ctxReveal(own.place))] : []);", "      .concat([]);"],
  ["om9", "ui/app.js", "const all = own.own === false ? acts : acts.concat(ctxHarvest(el, acts));", "const all = acts;"],
  ["om10", "ui/app.js", "' data-ctx=\"card\" data-where=\"node\" data-act=\"paths-pick\"", "' data-act=\"paths-pick\""],
  ["rn1", "ui/app.js", '  document.addEventListener("keydown", objectKey);\n', ""],
  ["rn2", "ui/app.js", "    if (inPlace) nameEnd(true, kept === \"commit\" ? t.value : undefined);\n", ""],
  ["rn3", "ui/app.js", "if (!(projPending && projPending.dir === dir) && !dirty && !inPlace) return \"\";", "if (!(projPending && projPending.dir === dir) && !dirty) return \"\";"],
  ["rn4", "ui/app.js", "if (rename) acts.push(ctxRow(T(\"Rename\"), I(\"rename\"), rename, keyLabel(\"rename\", \"F2\"))); /* plant:txom-rn4 */", "if (false) acts.push(ctxRow(T(\"Rename\"), I(\"rename\"), rename, keyLabel(\"rename\", \"F2\"))); /* plant:txom-rn4 */"],
  ["rn5", "ui/app.js", "      + '<td class=\"t-title\">' + (naming(\"card\", c.id) ? cardNameField(c) : esc(titleShown(c)))", "      + '<td class=\"t-title\">' + esc(titleShown(c))"],
  ["rn6", "ui/app.js", "        + esc(t.dir) + '\" tabindex=\"0\">' + (naming(\"tab\", t.dir)", "        + esc(t.dir) + '\" tabindex=\"0\">' + (false"],
  ["rn7", "ui/app.js", "      return { copy: [[T(\"Copy the name\"), el.getAttribute(\"data-name\") || \"\"], [T(\"Copy the key\"), el.getAttribute(\"data-key\") || \"\"]] };",
    "      return { copy: [[T(\"Copy the name\"), el.getAttribute(\"data-name\") || \"\"], [T(\"Copy the key\"), el.getAttribute(\"data-key\") || \"\"]],\n        rename: () => nameStart(\"row\", el.getAttribute(\"data-name\")), acts: [ctxRow(T(\"Rename\"), \"\", () => nameStart(\"row\", el.getAttribute(\"data-name\")))] };"],
  ["rn8", "ui/app.js", "    if (was == null || String(t.value) === was) return \"\";\n", "    return \"\";\n"],
];

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function plantOnce(id, rel, from, to) {
  const file = path.join(tree, rel);
  const buf = fs.readFileSync(file);
  const was = sha(buf);
  const text = buf.toString("utf8");
  const next = plantText(text, from, to, rel);
  let child = null;
  try {
    fs.writeFileSync(file, next, "utf8");
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
      cwd: tree, env: Object.assign({}, process.env, { OBJECT_MENUS_ONLY: id, ETIUDA_PLANTS: "off" }),
      encoding: "utf8", timeout: 120000 });
  } finally {
    fs.writeFileSync(file, buf);
    if (sha(fs.readFileSync(file)) !== was) throw new Error(id + " restore mismatch in " + rel);
  }
  const red = !!(child && child.status === 1 && String(child.stdout || "").includes("PLANT-RED"));
  if (!red) {
    console.error(id + " plant did not bite: status " + (child && child.status));
    console.error(String((child && child.stdout) || "") + String((child && child.stderr) || ""));
  }
  return red;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const planted = IDS.every((id) => PLANTS.some((p) => p[0] === id));
  if (!planted) {
    console.log("FAIL a check with no plant");
    dropScratch(SCRATCH, "object-menus");
    process.exit(1);
  }
  /* ETIUDA_PLANTS=off (a merge's area run) skips the plants phase and counts it as the one check it is.
     The byte-for-byte check is part of that phase. */
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy, and the checkout's sha256 is unchanged after it (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const shas = ["ui/app.js"].map((rel) => sha(fs.readFileSync(path.join(ROOT, rel))));
    let red = 0;
    let held = false;
    let same = false;
    try {
      tree = plantsTree(ROOT, "object-menus");
      for (const [id, rel, from, to] of PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
      same = ["ui/app.js"].every((rel, i) => sha(fs.readFileSync(path.join(ROOT, rel))) === shas[i]);
      console.log((same ? "ok   " : "FAIL ") + "the planted file is byte for byte as it was (sha256)");
    } finally {
      dropPlantsTree(tree, ROOT);
    }
    if (red !== PLANTS.length || !held || !same) {
      dropScratch(SCRATCH, "object-menus");
      process.exit(1);
    }
  }
  let n = 0;
  for (const id of IDS) {
    let ok = false;
    try { ok = await CHECKS[id](); }
    catch (e) { console.error(id + " " + ((e && e.stack) || e)); ok = false; }
    console.log((ok ? "ok   " : "FAIL ") + id);
    if (ok) n++;
  }
  console.log("object-menus " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1) + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  dropScratch(SCRATCH, "object-menus");
  process.exit(n === IDS.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  fs.mkdirSync(SCRATCH, { recursive: true });
  Promise.resolve(fn()).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  }).catch((e) => {
    console.error((e && e.stack) || e);
    process.exit(2);
  });
} else {
  main().catch((e) => {
    console.error((e && e.stack) || e);
    try { dropScratch(SCRATCH, "object-menus"); } catch { /* the verdict is the error above */ }
    process.exit(1);
  });
}
