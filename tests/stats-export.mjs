/* THE STATISTICS EXPORT, ONE WORKBOOK (board 948).
 *
 *     node tests/stats-export.mjs
 *
 * sxw1  the writer in src/stats-book.mjs, called on its own: three sheets, a Polish title
 *       with each of ą, ę, ł, ó, ś, ż, ź, ć, ń, and the counts as numbers.
 * sxw2  a title carrying U+FFFE, which XML forbids: the workbook parses and the
 *       character is gone.
 * sxw3  a lone surrogate gone, a 40,000 character cell capped at 32,767 and the
 *       workbook parses.
 * sxe1  the button on the Statistics view, through the page's call to the shell and the
 *       save, to the file on disk: the rows and counts that view shows for the period.
 * sxe2  the same press, with an error already on the page: the page names the file and
 *       that error is gone.
 * sxe3  a rename refused (directory target or EACCES): the page says the file is open
 *       in another program, not the raw node text, and the temporary file is gone.
 * sxe4  a press whose target sits in a folder this computer may not write in: the page
 *       says so, not that the file is held open and not the raw node text, and nothing
 *       is left in the folder.
 *
 * Both legs read the file back with src/workbook.mjs and with a second reader this tree did
 * not write: Expand-Archive (System.IO.Compression) unpacks a copy named .zip, then sax, a
 * parser already in node_modules, reads every XML part in strict mode. A number cell has no
 * t="s" and no t="inlineStr", and its v is numeric. Where PowerShell is absent the zip layer
 * falls back to src/workbook.mjs and the run says so.
 *
 * THE DECIDING LINE is the number cell in src/stats-book.mjs (plant:sx-num). The plant writes
 * that number as inline text. sxw1 goes red, in a scratch copy, and the line is put back.
 *
 * sxl1  the copywriter's final export sentences, the held-open line and the folder line,
 *       none of them marked as a draft.
 *
 * Node only. No window. STATS_EXPORT_ONLY=sxw1, sxe1 or sxl1 runs that one leg.
 */
import "./reg-stand-on.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { copyPlants } from "./plant-copy.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { denyBinds, WRITE } from "./deny-binds.mjs";

const require = createRequire(import.meta.url);
const sax = require("sax");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "stats-export");
const ONLY = process.env.STATS_EXPORT_ONLY || "";
const LETTERS = ["ą", "ę", "ł", "ó", "ś", "ż", "ź", "ć", "ń"];
const TITLE = "żółć gęślą jaźń";
const PLANT_LINE = "  if (typeof value === \"number\") return '<c r=\"' + ref + '\" t=\"inlineStr\"><is><t>' + num(value) + '</t></is></c>';";

const CT = {
  rels: "application/vnd.openxmlformats-package.relationships+xml",
  xml: "application/xml",
  book: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
  sheet: "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml",
  sst: "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml",
  styles: "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml",
};

let checks = 0;
const failures = [];
let readerNote = "";

function keep(id, cond, why) {
  checks++;
  if (!cond) {
    failures.push(id);
    console.log("FAIL " + id + " " + why);
  }
}

/* ---- the second reader: Expand-Archive, then sax --------------------------------------------- */

const EXPAND_PS1 = [
  "param(",
  "  [Parameter(Mandatory = $true)][string]$Src,",
  "  [Parameter(Mandatory = $true)][string]$Dst",
  ")",
  "Expand-Archive -LiteralPath $Src -DestinationPath $Dst -Force",
  "if (-not $?) { exit 1 }",
  "exit 0",
  "",
].join("\r\n");

function walkFiles(dir, base, into) {
  for (const name of fs.readdirSync(dir)) {
    const at = path.join(dir, name);
    const rel = base ? base + "/" + name : name;
    if (fs.statSync(at).isDirectory()) walkFiles(at, rel, into);
    else into.set(rel.replace(/\\/g, "/"), fs.readFileSync(at));
  }
}

function unpackOwn(file) {
  const { zipEntries, entryBytes } = require("../src/workbook.mjs");
  const buf = fs.readFileSync(file);
  const entries = zipEntries(buf);
  const files = new Map();
  for (const [name, entry] of entries) files.set(name, entryBytes(buf, entry));
  return files;
}

function unpack(file) {
  const dir = path.join(SCRATCH, "unpack-" + crypto.randomBytes(3).toString("hex"));
  fs.mkdirSync(dir, { recursive: true });
  const zip = path.join(dir, "book.zip");
  const out = path.join(dir, "out");
  fs.mkdirSync(out);
  fs.copyFileSync(file, zip);
  const script = path.join(dir, "expand.ps1");
  fs.writeFileSync(script, EXPAND_PS1, "utf8");
  const run = spawnSync("powershell.exe", [
    "-NoProfile", "-NonInteractive", "-File", script, "-Src", zip, "-Dst", out,
  ], { encoding: "utf8", windowsHide: true, timeout: 60000 });
  const absent = run.error && run.error.code === "ENOENT";
  if (absent || run.status === null && run.error) {
    readerNote = "the zip layer was checked by our own code";
    return unpackOwn(file);
  }
  if (run.status !== 0) {
    throw new Error("Expand-Archive failed (" + run.status + "): " + String(run.stderr || run.stdout || "").slice(0, 400));
  }
  const files = new Map();
  walkFiles(out, "", files);
  if (!files.has("[Content_Types].xml")) {
    throw new Error("Expand-Archive wrote no [Content_Types].xml: " + Array.from(files.keys()).join(", "));
  }
  readerNote = "second reader: Expand-Archive";
  return files;
}

function parseXml(xml, what) {
  const parser = sax.parser(true);
  const events = [];
  let failed = null;
  parser.onerror = (err) => { failed = err; };
  parser.onopentag = (node) => events.push({ t: "open", name: node.name, attr: node.attributes || {} });
  parser.ontext = (text) => events.push({ t: "text", text });
  parser.onclosetag = (name) => events.push({ t: "close", name });
  try { parser.write(xml).close(); }
  catch (err) { failed = failed || err; }
  if (failed) throw new Error(what + " is not strict XML: " + (failed.message || failed));
  return events;
}

function textOf(files, name) {
  const buf = files.get(name);
  if (!buf) return null;
  return Buffer.isBuffer(buf) ? buf.toString("utf8") : String(buf);
}

function localName(name) {
  const i = String(name).indexOf(":");
  return i < 0 ? String(name) : String(name).slice(i + 1);
}

function attr(node, key) {
  const a = node.attr || {};
  if (a[key] != null) return String(a[key]);
  const found = Object.keys(a).find((k) => k === key || k.endsWith(":" + key));
  return found == null ? "" : String(a[found]);
}

function contentTypes(xml) {
  const events = parseXml(xml, "[Content_Types].xml");
  const defaults = new Map(), overrides = new Map();
  for (const ev of events) {
    if (ev.t !== "open") continue;
    const name = localName(ev.name);
    if (name === "Default") defaults.set(attr(ev, "Extension"), attr(ev, "ContentType"));
    if (name === "Override") overrides.set(attr(ev, "PartName"), attr(ev, "ContentType"));
  }
  return { defaults, overrides };
}

function relationships(xml, what) {
  const events = parseXml(xml, what);
  const out = [];
  for (const ev of events) {
    if (ev.t === "open" && localName(ev.name) === "Relationship") {
      out.push({ id: attr(ev, "Id"), type: attr(ev, "Type"), target: attr(ev, "Target") });
    }
  }
  return out;
}

function resolveTarget(base, target) {
  const t = String(target || "").replace(/\\/g, "/");
  if (t.startsWith("/")) return t.slice(1);
  const parts = (base ? base.split("/") : []).concat(t.split("/"));
  const out = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

function sharedStrings(xml) {
  const events = parseXml(xml, "xl/sharedStrings.xml");
  const list = [];
  let inSi = false, inT = false, buf = "";
  for (const ev of events) {
    const name = localName(ev.name || "");
    if (ev.t === "open" && name === "si") { inSi = true; buf = ""; }
    else if (ev.t === "open" && name === "t" && inSi) inT = true;
    else if (ev.t === "text" && inT) buf += ev.text;
    else if (ev.t === "close" && name === "t") inT = false;
    else if (ev.t === "close" && name === "si") { list.push(buf); inSi = false; }
  }
  return list;
}

function sheetCells(xml, strings) {
  const events = parseXml(xml, "a worksheet");
  const cells = new Map();
  let inC = false, inV = false, inT = false, ref = "", type = "", v = "", inline = "";
  const finish = () => {
    if (!ref) return;
    let kind = "number", value = v;
    if (type === "s") {
      kind = "text";
      const i = parseInt(v, 10);
      value = Number.isInteger(i) && strings[i] != null ? strings[i] : "";
    } else if (type === "inlineStr") {
      kind = "text";
      value = inline;
    } else if (type === "str" || type === "b" || type === "e" || type === "d") {
      kind = "text";
    } else if (!/^-?\d+(\.\d+)?$/.test(v)) {
      kind = "text";
    }
    cells.set(ref, { kind, value, type });
  };
  for (const ev of events) {
    const name = localName(ev.name || "");
    if (ev.t === "open" && name === "c") {
      inC = true; ref = attr(ev, "r"); type = attr(ev, "t"); v = ""; inline = "";
    } else if (ev.t === "open" && name === "v" && inC) inV = true;
    else if (ev.t === "open" && name === "t" && inC) inT = true;
    else if (ev.t === "text" && inV) v += ev.text;
    else if (ev.t === "text" && inT) inline += ev.text;
    else if (ev.t === "close" && name === "v") inV = false;
    else if (ev.t === "close" && name === "t") inT = false;
    else if (ev.t === "close" && name === "c") { finish(); inC = false; }
  }
  return cells;
}

function sheetNames(bookXml) {
  const events = parseXml(bookXml, "xl/workbook.xml");
  const names = [];
  for (const ev of events) {
    if (ev.t === "open" && localName(ev.name) === "sheet") names.push(attr(ev, "name"));
  }
  return names;
}

/** The package as a reader we did not write sees it, or a throw naming the first broken part. */
function readIndependent(file) {
  const files = unpack(file);
  const names = Array.from(files.keys());
  const need = ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels",
    "xl/worksheets/sheet1.xml", "xl/styles.xml", "xl/sharedStrings.xml"];
  const missing = need.filter((n) => !files.has(n));
  if (missing.length) throw new Error("missing parts: " + missing.join(", "));
  for (const name of names) {
    const xml = textOf(files, name);
    if (name.endsWith(".xml") || name.endsWith(".rels") || name === "[Content_Types].xml") parseXml(xml, name);
  }
  const types = contentTypes(textOf(files, "[Content_Types].xml"));
  if (types.overrides.has("/[Content_Types].xml")) throw new Error("[Content_Types].xml overrides itself");
  if (types.defaults.get("rels") !== CT.rels) throw new Error("rels content type " + types.defaults.get("rels"));
  if (types.defaults.get("xml") !== CT.xml) throw new Error("xml content type " + types.defaults.get("xml"));
  if (types.overrides.get("/xl/workbook.xml") !== CT.book) throw new Error("workbook content type");
  if (types.overrides.get("/xl/sharedStrings.xml") !== CT.sst) throw new Error("shared strings content type");
  if (types.overrides.get("/xl/styles.xml") !== CT.styles) throw new Error("styles content type");
  const rootRels = relationships(textOf(files, "_rels/.rels"), "_rels/.rels");
  for (const rel of rootRels) {
    const at = resolveTarget("", rel.target);
    if (!files.has(at)) throw new Error("root relationship " + rel.target + " is missing");
  }
  const bookRels = relationships(textOf(files, "xl/_rels/workbook.xml.rels"), "workbook.xml.rels");
  const sheets = [];
  for (const rel of bookRels) {
    const at = resolveTarget("xl", rel.target);
    if (!files.has(at)) throw new Error("workbook relationship " + rel.target + " is missing");
    if (rel.type.indexOf("/worksheet") >= 0) sheets.push(at);
  }
  sheets.sort();
  for (const at of sheets) {
    const part = "/" + at;
    if (types.overrides.get(part) !== CT.sheet) throw new Error(part + " content type " + types.overrides.get(part));
  }
  for (const [part, type] of types.overrides) {
    const at = part.startsWith("/") ? part.slice(1) : part;
    if (!files.has(at)) throw new Error("content type names " + part + " and the zip has no such part");
    if (!type) throw new Error(part + " has an empty content type");
  }
  const strings = sharedStrings(textOf(files, "xl/sharedStrings.xml"));
  const byName = sheetNames(textOf(files, "xl/workbook.xml"));
  if (byName.length !== sheets.length) throw new Error("workbook names " + byName.length + " sheets, rels have " + sheets.length);
  const grids = new Map();
  sheets.forEach((at, i) => grids.set(byName[i], sheetCells(textOf(files, at), strings)));
  return { names: byName, sheets: grids, selfTyped: !types.overrides.has("/[Content_Types].xml") };
}

function cell(book, sheet, ref) {
  const grid = book.sheets.get(sheet);
  return grid ? grid.get(ref) || null : null;
}

function ours(file) {
  const { readWorkbook } = require("../src/workbook.mjs");
  return readWorkbook(fs.readFileSync(file));
}

function ourCell(wb, sheet, ref) {
  const s = wb.sheets.find((x) => x.name === sheet);
  return s ? s.cells.find((c) => c.ref === ref) || null : null;
}

function missingLetters(text) {
  return LETTERS.filter((ch) => String(text).indexOf(ch) < 0);
}

/* ---- sxw1, the writer on its own -------------------------------------------------------------- */

async function legWriter() {
  let writeStatsBook = null;
  try {
    ({ writeStatsBook } = await import(pathToFileURL(path.join(ROOT, "src", "stats-book.mjs")).href));
  } catch (err) {
    keep("sxw1", false, "the writer is not there: " + (err && err.message ? err.message.split("\n")[0] : err));
    return;
  }
  if (typeof writeStatsBook !== "function") {
    keep("sxw1", false, "src/stats-book.mjs does not export writeStatsBook");
    return;
  }
  fs.mkdirSync(SCRATCH, { recursive: true });
  const file = path.join(SCRATCH, "unit.xlsx");
  writeStatsBook(file, {
    sheets: [
      { name: "Cards", rows: [
        ["Title", "Category", "Copies in the period", "Copies, PL"],
        [TITLE, "Półka", 4, null],
        ["Druga karta", "Półka", 2, null],
        ["Wszystkie karty", "", null, 9],
      ] },
      { name: "Searches that found nothing", rows: [["Count"], [3]] },
      { name: "Intents", rows: [["Intent", "Times asked"], ["pytanie o gęś", 5]] },
    ],
  });
  let indie = null, wb = null, broke = "";
  try { indie = readIndependent(file); wb = ours(file); }
  catch (err) { broke = err && err.message ? err.message : String(err); }
  keep("sxw1", !broke, "the second reader refused the book: " + broke);
  if (broke) return;
  keep("sxw1", indie.names.length === 3 && indie.names[0] === "Cards"
    && indie.names[1] === "Searches that found nothing" && indie.names[2] === "Intents",
    "sheets " + JSON.stringify(indie.names));
  const title = cell(indie, "Cards", "A2");
  keep("sxw1", title && title.kind === "text" && title.value === TITLE && missingLetters(title.value).length === 0,
    "Polish title " + JSON.stringify(title) + (title ? " missing " + missingLetters(title.value).join(" ") : ""));
  const wantNum = [["Cards", "C2", "4"], ["Cards", "C3", "2"], ["Cards", "D4", "9"],
    ["Searches that found nothing", "A2", "3"], ["Intents", "B2", "5"]];
  for (const [sheet, ref, value] of wantNum) {
    const got = cell(indie, sheet, ref);
    const home = ourCell(wb, sheet, ref);
    keep("sxw1", got && got.kind === "number" && got.value === value && got.type !== "s" && got.type !== "inlineStr"
      && home && home.kind === "number" && home.value === value,
      ref + " on " + sheet + " second=" + JSON.stringify(got) + " ours=" + JSON.stringify(home && { kind: home.kind, value: home.value }));
  }
  keep("sxw1", !cell(indie, "Cards", "D2") && !cell(indie, "Cards", "D3"),
    "a card row carried a language total");
  const nines = [];
  for (const [name, grid] of indie.sheets) {
    for (const [ref, c] of grid) if (c.value === "9") nines.push(name + "!" + ref + ":" + c.kind);
  }
  keep("sxw1", nines.length === 1 && nines[0] === "Cards!D4:number", "where 9 sits: " + nines.join(", "));
  keep("sxw1", indie.selfTyped === true, "[Content_Types].xml named itself as an override");
  const marked = "karta\uFFFEdruga";
  const markedFile = path.join(SCRATCH, "marked.xlsx");
  writeStatsBook(markedFile, { sheets: [{ name: "Cards", rows: [[marked]] }] });
  let markedBook = null, markedBroke = "";
  try { markedBook = readIndependent(markedFile); }
  catch (err) { markedBroke = err && err.message ? err.message : String(err); }
  const markedCell = markedBook ? cell(markedBook, "Cards", "A1") : null;
  const markedXml = markedBroke ? "" : textOf(unpack(markedFile), "xl/sharedStrings.xml");
  const forbidden = markedXml.indexOf("\uFFFE") >= 0 || markedXml.indexOf("\uFFFF") >= 0;
  keep("sxw2", !markedBroke && markedCell && markedCell.kind === "text" && markedCell.value === "kartadruga" && !forbidden,
    "a title carrying U+FFFE: " + (markedBroke || JSON.stringify(markedCell)) + " still in the part " + forbidden);
  const surrRaw = "karta\uD800druga";
  const longRaw = "x".repeat(40000);
  const capFile = path.join(SCRATCH, "capped.xlsx");
  writeStatsBook(capFile, { sheets: [{ name: "Cards", rows: [[surrRaw, longRaw]] }] });
  let capBook = null, capBroke = "";
  try { capBook = readIndependent(capFile); }
  catch (err) { capBroke = err && err.message ? err.message : String(err); }
  const surrCell = capBook ? cell(capBook, "Cards", "A1") : null;
  const longCell = capBook ? cell(capBook, "Cards", "B1") : null;
  const capXml = capBroke ? "" : textOf(unpack(capFile), "xl/sharedStrings.xml");
  const surrForbidden = /[\uD800-\uDFFF]/.test(capXml.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ""));
  keep("sxw3", !capBroke
    && surrCell && surrCell.kind === "text" && surrCell.value === "kartadruga" && surrCell.value.indexOf("\uD800") < 0
    && longCell && longCell.kind === "text" && longCell.value.length === 32767
    && !surrForbidden,
    "lone surrogate gone, 40,000 char cell capped at 32,767 and workbook parses: "
    + (capBroke || ("surr=" + (surrCell && surrCell.value) + " len=" + (longCell && longCell.value.length))));
}

/* ---- the shell, stood in, so the page's call is the one the button makes --------------------- */

function loadShell(ud, envExtra) {
  const Module = require("node:module");
  const main = path.join(ROOT, "shell", "main.js");
  const ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, said: [] };
  class Win {
    constructor() {
      this.webContents = {
        id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {},
        getURL: () => pathToFileURL(ui).href,
      };
    }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; }
    loadFile() {} show() {} showInactive() {} setMinimumSize() {} close() {} focus() {} restore() {}
  }
  const electron = {
    app: {
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud, getVersion: () => "0.0.0", getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(),
      on() {}, quit() {}, exit() {},
    },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => null, getAllWindows: () => [] }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: {
      showMessageBox: () => Promise.resolve({ response: 0 }),
      showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }),
    },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} },
    safeStorage: {
      isEncryptionAvailable: () => true, available: () => true,
      seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t), "utf8").toString("hex")),
      open: (b) => Buffer.from(Buffer.from(b).toString("utf8").slice(7), "hex").toString("utf8"),
      encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").toString("hex")),
      decryptString: (b) => Buffer.from(Buffer.from(b).toString("utf8").slice(7), "hex").toString("utf8"),
    },
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({}), on() {}, removeListener() {} },
    session: { defaultSession: {
      setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {},
      setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {},
    } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: () => Promise.reject(new Error("network forbidden")) },
  };
  const thread = { call: async (verb, ...args) => {
    const Studio = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    if (typeof Studio[verb] !== "function") throw new Error("studio verb " + verb + " is not there");
    return Studio[verb](...args);
  } };
  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = {
    execFileSync: () => "", execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => quiet, spawn: () => quiet, exec: () => quiet, fork: () => quiet,
  };
  const env = Object.assign({
    STUDIO_NO_PROXY_SERVER: "off", STUDIO_TEST_OFFSCREEN: "1",
  }, envExtra || {});
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }
  const load = Module._load;
  const write = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, enc, cb) => { got.said.push(String(chunk)); return true; };
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(String(req))) return thread;
    return load.apply(this, arguments);
  };
  const before = new Set(Object.keys(require.cache));
  let mod = null;
  try {
    delete require.cache[main];
    mod = require(main);
  } catch (err) {
    Module._load = load;
    process.stderr.write = write;
    throw err;
  }
  got.done = async () => {
    try { if (mod && mod.endRelay) await mod.endRelay(); } catch { /* already down */ }
    Module._load = load;
    process.stderr.write = write;
    for (const k of Object.keys(require.cache)) if (!before.has(k)) delete require.cache[k];
    delete require.cache[main];
    for (const k of Object.keys(was)) {
      if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k];
    }
  };
  got.ask = async (ch, ...args) => {
    const fn = got.handlers[ch];
    if (!fn) return { error: "no handler " + ch };
    const event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: { id: 1 } };
    try { return await fn(event, ...args); }
    catch (err) { return { error: String(err && err.message || err) }; }
  };
  return got;
}

/* ---- sxe1, the button through the shell to the file ------------------------------------------ */

async function legPage() {
  const appJs = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  if (appJs.indexOf('data-act="stats-export"') < 0) {
    keep("sxe1", false, "the Statistics view has no export button");
    return;
  }
  const Studio = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
  const Engine = await import(pathToFileURL(path.join(ROOT, "src", "engine.mjs")).href);
  const { makeKeyFile } = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
  const { newTeam, withDesk, writeTeam } = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
  const { jsonText } = await import(pathToFileURL(path.join(ROOT, "src", "plain-json.mjs")).href);
  const { loadPage } = await import("./page-stand-in.mjs");

  const pass = "harbour-gate-pass";
  const base = path.join(SCRATCH, "e2e");
  clearScratch(base);
  fs.mkdirSync(base, { recursive: true });
  const projects = path.join(base, "projects");
  const share = path.join(base, "share");
  fs.mkdirSync(projects, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await Studio.newProject(projects, "Harbour", [{ code: "pl", name: "polski" }]);
  const shelf = (await Studio.addTag(made.dir, "shelf", { pl: "Półka" })).tag.id;
  const intent = (await Studio.addTag(made.dir, "request", { pl: "pytanie o gęś" })).tag.id;
  const first = (await Studio.addCard(made.dir, shelf, TITLE, "Opis pierwszej karty.")).card.id;
  const second = (await Studio.addCard(made.dir, shelf, "Druga karta", "Opis drugiej karty.")).card.id;
  const third = (await Studio.addCard(made.dir, shelf, "Trzecia karta", "Opis trzeciej karty.")).card.id;
  await Studio.setPublishFolder(made.dir, share);
  const keyAt = path.join(base, "lead-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: pass }), null, 1) + "\n");
  const pkcs8 = Buffer.from("302e020100300506032b657004220420", "hex");
  const priv = crypto.createPrivateKey({ key: Buffer.concat([pkcs8, Buffer.alloc(32, 0xaa)]), format: "der", type: "pkcs8" });
  const pub = crypto.createPublicKey(priv).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const deskId = "k-" + crypto.createHash("sha256").update(Buffer.from(pub, "hex")).digest("hex").slice(0, 16);
  const lead = JSON.parse(fs.readFileSync(keyAt, "utf8"));
  let team = newTeam({ catalogs: ["harbour"], lead: { keyId: lead.keyId, public: lead.public } });
  team = withDesk(team, { id: deskId, key: pub, box: crypto.randomBytes(32).toString("hex") }, "Lampa");
  const wrote = await writeTeam(share, team, { key: keyAt, passphrase: pass });
  const body = {
    format: 1, kind: "etiuda-desk-stats", desk: "Lampa", engine: "test",
    period: { from: "2026-10-01", to: "2026-10-07" }, sync: "2026-10-07 09:00",
    cards: [{ id: first, n: 4, at: "2026-10-03" }, { id: second, n: 2, at: "2026-10-04" }],
    intents: [{ id: intent, n: 5 }], misses: 3, langs: { pl: 9 }, since: "2026-10-01", pairs: [],
    catalog: { id: "harbour", rev: 1 }, hash: "h-harbour",
  };
  const signed = Object.assign({}, body, { sig: { alg: "Ed25519", keyId: deskId } });
  signed.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(signed), priv).toString("hex");
  const env = Engine.statsRules().sealStatsLead(wrote.team.lead.box, wrote.team.id, wrote.team.lead.keyId, deskId, JSON.stringify(signed));
  fs.mkdirSync(path.join(share, "desks", deskId), { recursive: true });
  fs.writeFileSync(path.join(share, "desks", deskId, "stats.estat"), jsonText(env));
  const now = new Date(2026, 9, 15, 12, 0, 0);
  await Studio.setStatsSpan(made.dir, "range-2026-10-01-2026-10-07", { key: keyAt, passphrase: pass, now });
  const facts = await Studio.statsFor(made.dir, { key: keyAt, passphrase: pass, now });
  const opened = await Studio.openProject(made.dir);
  const out = path.join(base, "harbour.xlsx");
  let shell = null;
  try {
    shell = loadShell(path.join(base, "ud"), {
      STUDIO_PROJECTS: projects, STUDIO_TEST_STATS: out, STUDIO_SIGNING_KEY: keyAt, STUDIO_KEY_PASSPHRASE: pass,
    });
    const asked = [];
    const api = {
      statsExportPick: async (title, name, kind) => {
        asked.push({ title, name, kind });
        return shell.ask("studio:stats-export-pick", title, name, kind);
      },
      statsExport: async (dir, file, words) => shell.ask("studio:stats-export", dir, file, words),
    };
    const home = loadPage({ api, uiLang: "pl" });
    const S = home.page.S;
    S.open = opened;
    S.stats = facts;
    S.uiLang = "pl";
    S.lang = "pl";
    S.screen = "project";
    S.section = "stats";
    S.err = null;
    let painted = "";
    try {
      home.page.paintStats();
      painted = home.node("#main").innerHTML;
    } catch (err) {
      keep("sxe1", false, "paintStats threw: " + (err && err.stack ? err.stack.split("\n")[0] : err));
      return;
    }
    keep("sxe1", painted.indexOf("Eksportuj do Excela\u2026") >= 0, "the button is not on the painted view");
    keep("sxe1", painted.indexOf(TITLE) >= 0, "the painted view does not show the Polish title");
    if (!home.page.ACTS || typeof home.page.ACTS["stats-export"] !== "function") {
      keep("sxe1", false, "the page has no stats-export act");
      return;
    }
    S.err = "the earlier export failed";
    home.page.paintStats();
    const beforePress = home.node("#main").innerHTML;
    keep("sxe2", beforePress.indexOf("the earlier export failed") >= 0,
      "the planted error was not on the page before the press");
    await home.page.ACTS["stats-export"]();
    const afterPress = home.node("#main").innerHTML;
    keep("sxe2", afterPress.indexOf(out) >= 0 && afterPress.indexOf("the earlier export failed") < 0
      && S.err == null && S.sent === out,
      "after the press the page names " + JSON.stringify(S.sent) + " err " + JSON.stringify(S.err)
      + " path on the page " + (afterPress.indexOf(out) >= 0)
      + " earlier error still on the page " + (afterPress.indexOf("the earlier export failed") >= 0));
    const pick = asked[0] || {};
    keep("sxe1", pick.title === "Eksportuj statystyki" && pick.kind === "Skoroszyt programu Excel"
      && typeof pick.name === "string" && pick.name.indexOf("statystyki") >= 0 && pick.name.endsWith(".xlsx")
      && facts.days && pick.name.indexOf(facts.days.from) >= 0 && pick.name.indexOf(facts.days.to) >= 0,
      "dialog " + JSON.stringify(pick) + " days " + JSON.stringify(facts.days));
    keep("sxe1", fs.existsSync(out), "no workbook was written; shell said " + gotTail(shell));
    if (!fs.existsSync(out)) return;
    let indie = null, wb = null, broke = "";
    try { indie = readIndependent(out); wb = ours(out); }
    catch (err) { broke = err && err.message ? err.message : String(err); }
    keep("sxe1", !broke, "the second reader refused the export: " + broke);
    if (broke) return;
    keep("sxe1", JSON.stringify(indie.names) === JSON.stringify(["Karty", "Wyszukiwania bez wyniku", "Intencje"]),
      "sheet names " + JSON.stringify(indie.names));
    const headOf = (sheet, ref) => {
      const c = cell(indie, sheet, ref);
      return c ? c.value : "";
    };
    keep("sxe1", headOf("Karty", "C1") === "Stan" && headOf("Karty", "D1") === "Skopiowania w okresie"
      && headOf("Karty", "E1") === "Skopiowania, PL"
      && headOf("Karty", "A5") === "Wszystkie karty"
      && headOf("Wyszukiwania bez wyniku", "A1") === "Wyszukiwania w okresie"
      && headOf("Intencje", "B1") === "Ile razy pytano",
      "column heads " + JSON.stringify({
        status: headOf("Karty", "C1"), copies: headOf("Karty", "D1"), lang: headOf("Karty", "E1"), totals: headOf("Karty", "A5"),
        searches: headOf("Wyszukiwania bez wyniku", "A1"), times: headOf("Intencje", "B1"),
      }));
    const every = facts.views.top.every;
    keep("sxe1", every.length === 2 && Number(every[0][2]) === 4 && Number(every[1][2]) === 2
      && every[0][1] === TITLE,
      "the view's ranking " + JSON.stringify(every));
    const a2 = cell(indie, "Karty", "A2");
    const c2 = cell(indie, "Karty", "D2");
    const c3 = cell(indie, "Karty", "D3");
    const c4 = cell(indie, "Karty", "D4");
    keep("sxe1", a2 && a2.value === TITLE && missingLetters(a2.value).length === 0
      && c2 && c2.kind === "number" && c2.value === "4"
      && c3 && c3.kind === "number" && c3.value === "2"
      && c4 && c4.kind === "number" && c4.value === "0",
      "card rows " + JSON.stringify([a2, c2, c3, c4]));
    keep("sxe1", cell(indie, "Karty", "A4") && cell(indie, "Karty", "A4").value === "Trzecia karta",
      "the unused card was left out or reordered: " + JSON.stringify(cell(indie, "Karty", "A4")));
    const misses = cell(indie, "Wyszukiwania bez wyniku", "A2");
    const times = cell(indie, "Intencje", "B2");
    const clause = cell(indie, "Intencje", "A2");
    const total = cell(indie, "Karty", "E5");
    keep("sxe1", misses && misses.kind === "number" && misses.value === String(facts.views.team.misses)
      && facts.views.team.misses === 3
      && clause && clause.value === "pytanie o gęś"
      && times && times.kind === "number" && times.value === "5"
      && total && total.kind === "number" && total.value === "9"
      && !cell(indie, "Karty", "E2") && !cell(indie, "Karty", "E3") && !cell(indie, "Karty", "E4"),
      "counts " + JSON.stringify({ misses, clause, times, total, team: facts.views.team }));
    const homeC2 = ourCell(wb, "Karty", "D2");
    const homeD5 = ourCell(wb, "Karty", "E5");
    keep("sxe1", homeC2 && homeC2.kind === "number" && homeC2.value === "4"
      && homeD5 && homeD5.kind === "number" && homeD5.value === "9",
      "our reader " + JSON.stringify([homeC2 && homeC2.kind, homeC2 && homeC2.value, homeD5 && homeD5.kind, homeD5 && homeD5.value]));
    const nines = [];
    for (const [name, grid] of indie.sheets) {
      for (const [ref, c] of grid) if (c.value === "9") nines.push(name + "!" + ref);
    }
    keep("sxe1", nines.length === 1 && nines[0] === "Karty!E5" && third === third,
      "the language total sits " + nines.join(", "));
    void third;
    fs.rmSync(out);
    fs.mkdirSync(out);
    await home.page.ACTS["stats-export"]();
    const heldPage = home.node("#main").innerHTML;
    const writing = fs.readdirSync(base).filter((name) => name.indexOf(".writing") >= 0);
    const frame = S.err && typeof S.err === "object" ? String(S.err.frame || "") : String(S.err || "");
    keep("sxe3", frame.indexOf("{F}") >= 0
      && heldPage.indexOf("wystarczy wyeksportować ponownie") >= 0
      && heldPage.indexOf(out) >= 0
      && heldPage.indexOf("EPERM") < 0
      && heldPage.indexOf(".writing") < 0
      && writing.length === 0
      && S.sent === "",
      "held open: frame " + JSON.stringify(frame).slice(0, 200)
      + " writing left " + writing.join(",")
      + " sent " + JSON.stringify(S.sent)
      + " EPERM on the page " + (heldPage.indexOf("EPERM") >= 0)
      + " temporary name on the page " + (heldPage.indexOf(".writing") >= 0));
    fs.rmdirSync(out);
    const realRename = fs.renameSync;
    try {
      fs.renameSync = (from, to) => {
        const e = new Error("EACCES: permission denied, rename '" + from + "' -> '" + to + "'");
        e.code = "EACCES";
        e.errno = -13;
        e.syscall = "rename";
        throw e;
      };
      await home.page.ACTS["stats-export"]();
      const accesPage = home.node("#main").innerHTML;
      const accesWriting = fs.readdirSync(base).filter((name) => name.indexOf(".writing") >= 0);
      const accesFrame = S.err && typeof S.err === "object" ? String(S.err.frame || "") : String(S.err || "");
      keep("sxe3", accesFrame.indexOf("{F}") >= 0
        && accesPage.indexOf("wystarczy wyeksportować ponownie") >= 0
        && accesPage.indexOf(out) >= 0
        && accesPage.indexOf("EACCES") < 0
        && accesPage.indexOf(".writing") < 0
        && accesWriting.length === 0
        && S.sent === "",
        "held open on EACCES: frame " + JSON.stringify(accesFrame).slice(0, 200)
        + " writing left " + accesWriting.join(",")
        + " sent " + JSON.stringify(S.sent)
        + " EACCES on the page " + (accesPage.indexOf("EACCES") >= 0)
        + " temporary name on the page " + (accesPage.indexOf(".writing") >= 0));
    } finally {
      fs.renameSync = realRename;
    }
    const sealed = path.join(base, "sealed");
    fs.mkdirSync(sealed);
    const user = os.userInfo().username;
    /* Where a deny of (W) does not stop this account, the folder is not sealed and the press simply writes: said, not counted. */
    const sealBinds = denyBinds(base, user, ["(W)"], WRITE);
    if (!sealBinds.binds) console.log("SKIP sxe4 a press whose target sits in a folder this computer may not write in: " + sealBinds.why);
    else {
    const sealedFile = path.join(sealed, "harbour.xlsx");
    let denyStatus = -1;
    let folderPage = "";
    let folderFrame = "";
    let folderThrew = "";
    try {
      if (process.platform === "win32") {
        const denied = spawnSync("icacls", [sealed, "/deny", user + ":(W)"], { encoding: "utf8", windowsHide: true });
        denyStatus = denied ? denied.status : 1;
      } else {
        fs.chmodSync(sealed, 0o555);
        denyStatus = 0;
      }
      if (denyStatus === 0) {
        process.env.STUDIO_TEST_STATS = sealedFile;
        await home.page.ACTS["stats-export"]();
        folderPage = home.node("#main").innerHTML;
        folderFrame = S.err && typeof S.err === "object" ? String(S.err.frame || "") : String(S.err || "");
      }
    } catch (err) {
      folderThrew = err && err.message ? err.message : String(err);
    } finally {
      /* The deny comes off before the folder is read or removed, or the scratch stays. */
      if (process.platform === "win32") {
        spawnSync("icacls", [sealed, "/remove:d", user], { encoding: "utf8", windowsHide: true });
      } else {
        try { fs.chmodSync(sealed, 0o755); } catch { /* the mode is put back as far as it will go */ }
      }
    }
    let sealedLeft = [];
    let sealedRead = "";
    try { sealedLeft = fs.readdirSync(sealed); }
    catch (err) { sealedRead = err && err.code ? err.code : String(err); }
    let acl = "";
    if (process.platform === "win32") {
      const listed = spawnSync("icacls", [sealed], { encoding: "utf8", windowsHide: true });
      acl = String(listed && listed.stdout || "") + String(listed && listed.stderr || "");
      console.log("sxe4 icacls after restore:\n" + acl.trimEnd());
    }
    const folderLine = "Ten komputer nie może zapisywać w tym folderze, więc nic nie zapisano."
      + " Wystarczy wybrać inny, na przykład Dokumenty, i wyeksportować ponownie.";
    keep("sxe4", denyStatus === 0 && !folderThrew && !sealedRead
      && folderFrame.indexOf("This computer may not write in that folder") >= 0
      && folderPage.indexOf(folderLine) >= 0
      && folderPage.indexOf("wystarczy wyeksportować ponownie") < 0
      && folderPage.indexOf("otwarty w innym programie") < 0
      && folderPage.indexOf("EPERM") < 0
      && folderPage.indexOf(".writing") < 0
      && sealedLeft.length === 0
      && S.sent === ""
      && (process.platform !== "win32" || (acl.indexOf("(DENY)") < 0 && acl.indexOf("Successfully processed") >= 0)),
      "folder: frame " + JSON.stringify(folderFrame).slice(0, 240)
      + " left " + sealedLeft.join(",")
      + " read " + sealedRead
      + " sent " + JSON.stringify(S.sent)
      + " deny " + denyStatus
      + " threw " + folderThrew
      + " EPERM " + (folderPage.indexOf("EPERM") >= 0)
      + " held " + (folderPage.indexOf("wystarczy wyeksportować ponownie") >= 0)
      + " open " + (folderPage.indexOf("otwarty w innym programie") >= 0));
    }
  } finally {
    if (shell) await shell.done();
  }
}

/* ---- sxe8, copies across two periods and a retired card ------------------------------------- */

async function legPeriodTotalsAndRetired() {
  const Studio = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
  const Engine = await import(pathToFileURL(path.join(ROOT, "src", "engine.mjs")).href);
  const { makeKeyFile } = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
  const { newTeam, withDesk, writeTeam } = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
  const { jsonText } = await import(pathToFileURL(path.join(ROOT, "src", "plain-json.mjs")).href);

  const pass = "period-gate-pass";
  const base = path.join(SCRATCH, "leg8");
  clearScratch(base);
  fs.mkdirSync(base, { recursive: true });
  const projects = path.join(base, "projects");
  const share = path.join(base, "share");
  fs.mkdirSync(projects, { recursive: true });
  fs.mkdirSync(share, { recursive: true });

  const made = await Studio.newProject(projects, "Inventory", [{ code: "en", name: "English" }]);
  const shelf = (await Studio.addTag(made.dir, "shelf", { en: "Warehouse" })).tag.id;
  const first = (await Studio.addCard(made.dir, shelf, "First cargo guide", "First cargo description.")).card.id;
  const second = (await Studio.addCard(made.dir, shelf, "Second cargo guide", "Second cargo description.")).card.id;
  const retired = (await Studio.addCard(made.dir, shelf, "Retired cargo guide", "Retired cargo description.")).card.id;
  await Studio.retireCard(made.dir, retired);
  /* A card retired since the period began but copied in it: it keeps its row, marked retired in Status. */
  const withdrawn = (await Studio.addCard(made.dir, shelf, "Withdrawn cargo guide", "Withdrawn cargo description.")).card.id;
  await Studio.retireCard(made.dir, withdrawn);
  await Studio.setPublishFolder(made.dir, share);

  const keyAt = path.join(base, "lead-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: pass }), null, 1) + "\n");

  const pkcs8 = Buffer.from("302e020100300506032b657004220420", "hex");
  const priv1 = crypto.createPrivateKey({ key: Buffer.concat([pkcs8, Buffer.alloc(32, 0x11)]), format: "der", type: "pkcs8" });
  const pub1 = crypto.createPublicKey(priv1).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const deskId1 = "k-" + crypto.createHash("sha256").update(Buffer.from(pub1, "hex")).digest("hex").slice(0, 16);

  const priv2 = crypto.createPrivateKey({ key: Buffer.concat([pkcs8, Buffer.alloc(32, 0x22)]), format: "der", type: "pkcs8" });
  const pub2 = crypto.createPublicKey(priv2).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const deskId2 = "k-" + crypto.createHash("sha256").update(Buffer.from(pub2, "hex")).digest("hex").slice(0, 16);

  const lead = JSON.parse(fs.readFileSync(keyAt, "utf8"));
  let team = newTeam({ catalogs: ["inventory"], lead: { keyId: lead.keyId, public: lead.public } });
  team = withDesk(team, { id: deskId1, key: pub1, box: crypto.randomBytes(32).toString("hex") }, "Crane");
  team = withDesk(team, { id: deskId2, key: pub2, box: crypto.randomBytes(32).toString("hex") }, "Forklift");
  const wrote = await writeTeam(share, team, { key: keyAt, passphrase: pass });

  /* Desk 1 reported in an earlier period: 10 copies of first card, 10 en copies */
  const body1 = {
    format: 1, kind: "etiuda-desk-stats", desk: "Crane", engine: "test",
    period: { from: "2026-08-01", to: "2026-08-31" }, sync: "2026-08-31 18:00",
    cards: [{ id: first, n: 10, at: "2026-08-15" }],
    intents: [], misses: 0, langs: { en: 10 }, pairs: [],
    catalog: { id: "inventory", rev: 1 }, hash: "h-inventory",
  };
  const signed1 = Object.assign({}, body1, { sig: { alg: "Ed25519", keyId: deskId1 } });
  signed1.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(signed1), priv1).toString("hex");
  const env1 = Engine.statsRules().sealStatsLead(wrote.team.lead.box, wrote.team.id, wrote.team.lead.keyId, deskId1, JSON.stringify(signed1));
  fs.mkdirSync(path.join(share, "desks", deskId1), { recursive: true });
  fs.writeFileSync(path.join(share, "desks", deskId1, "stats.estat"), jsonText(env1));

  /* Desk 2 reported in the current period: 3 copies of first card and 1 of the withdrawn card, 4 en copies */
  const body2 = {
    format: 1, kind: "etiuda-desk-stats", desk: "Forklift", engine: "test",
    period: { from: "2026-10-01", to: "2026-10-07" }, since: "2026-10-01", sync: "2026-10-07 12:00",
    cards: [{ id: first, n: 3, at: "2026-10-04" }, { id: withdrawn, n: 1, at: "2026-10-05" }],
    intents: [], misses: 0, langs: { en: 4 }, pairs: [],
    catalog: { id: "inventory", rev: 1 }, hash: "h-inventory",
  };
  const signed2 = Object.assign({}, body2, { sig: { alg: "Ed25519", keyId: deskId2 } });
  signed2.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(signed2), priv2).toString("hex");
  const env2 = Engine.statsRules().sealStatsLead(wrote.team.lead.box, wrote.team.id, wrote.team.lead.keyId, deskId2, JSON.stringify(signed2));
  fs.mkdirSync(path.join(share, "desks", deskId2), { recursive: true });
  fs.writeFileSync(path.join(share, "desks", deskId2, "stats.estat"), jsonText(env2));

  const now = new Date(2026, 9, 15, 12, 0, 0);
  await Studio.setStatsSpan(made.dir, "range-2026-10-01-2026-10-07", { key: keyAt, passphrase: pass, now });
  const out = path.join(base, "inventory.xlsx");
  const words = {
    cards: "Cards", searches: "Searches", intents: "Intents",
    title: "Card", category: "Category", status: "Status", retired: "Retired", copies: "Copies in the period",
    copiesLang: "Copies, {LANG}", count: "Count", intent: "Intent",
    times: "Times", totals: "All cards", lang: "en",
  };
  await Studio.exportStatsBook(made.dir, out, words, { key: keyAt, passphrase: pass, now });

  const indie = readIndependent(out);
  const grid = indie.sheets.get("Cards");

  /* 1. Retired card is omitted from the Cards sheet and is not a zero row */
  let retiredFound = false;
  for (const [ref, c] of grid) {
    if (c.value === "Retired cargo guide") retiredFound = true;
  }
  keep("sxe8", !retiredFound, "retired card is not a row in the workbook");

  /* 1b. A retired card copied in the period keeps its row, Status "Retired" and its copies; a live card's Status is empty */
  let wRow = 0;
  for (const [ref, c] of grid) if (c.value === "Withdrawn cargo guide" && /^A[0-9]+$/.test(ref)) wRow = Number(ref.slice(1));
  const wStatus = wRow ? cell(indie, "Cards", "C" + wRow) : null, wCopies = wRow ? cell(indie, "Cards", "D" + wRow) : null;
  const liveStatus = cell(indie, "Cards", "C2"), statusHead = cell(indie, "Cards", "C1");
  keep("sxe8", wRow > 0 && wStatus && wStatus.value === "Retired" && wCopies && wCopies.kind === "number" && wCopies.value === "1"
    && statusHead && statusHead.value === "Status" && (!liveStatus || liveStatus.value === ""),
    "a retired card copied in the period keeps its row marked Retired with its copies, under Status: "
    + JSON.stringify({ wRow, wStatus, wCopies, liveStatus, statusHead }));

  /* 2. All cards row carries the period's copy total (4) in column D, after Status */
  const totalsLabel = cell(indie, "Cards", "A5");
  const periodCopies = cell(indie, "Cards", "D5");
  keep("sxe8", totalsLabel && totalsLabel.value === "All cards"
    && periodCopies && periodCopies.kind === "number" && periodCopies.value === "4",
    "All cards row carries period copy total 4: " + JSON.stringify(periodCopies));

  /* 3. All cards row carries the period's language total (4, not all-time 14) in column E */
  const langCopies = cell(indie, "Cards", "E5");
  keep("sxe8", langCopies && langCopies.kind === "number" && langCopies.value === "4",
    "All cards row language total equals period total 4 (not all-time 14): " + JSON.stringify(langCopies));
}

function gotTail(shell) {
  return (shell && shell.said ? shell.said.join(" ") : "").replace(/\s+/g, " ").slice(-300);
}

/* The copywriter's final pairs. A draft mark in the 80 characters before the key is still a draft. */
const FINAL_PAIRS = [
  ["Export to Excel\u2026", "Eksportuj do Excela\u2026"],
  ["Export the statistics", "Eksportuj statystyki"],
  ["Excel workbook", "Skoroszyt programu Excel"],
  ["{PROJECT}, statistics {FROM} to {TO}.xlsx", "{PROJECT}, statystyki od {FROM} do {TO}.xlsx"],
  ["{PROJECT}, statistics.xlsx", "{PROJECT}, statystyki.xlsx"],
  ["Copies in the period", "Skopiowania w okresie"],
  ["Copies, {LANG}", "Skopiowania, {LANG}"],
  ["Searches in the period", "Wyszukiwania w okresie"],
  ["Times asked", "Ile razy pytano"],
  ["All cards", "Wszystkie karty"],
];
const HELD_OPEN = "Another program holds {F} open, so nothing was written and the file stays as it was. Once it is closed there, export again.";
const HELD_PL = "Plik {F} jest otwarty w innym programie, więc nic nie zapisano, a plik pozostał bez zmian. Po zamknięciu go tam wystarczy wyeksportować ponownie.";
const FOLDER_EN = "This computer may not write in that folder, so nothing was written. Pick another, such as Documents, and export again.";
const FOLDER_PL = "Ten komputer nie może zapisywać w tym folderze, więc nic nie zapisano. Wystarczy wybrać inny, na przykład Dokumenty, i wyeksportować ponownie.";

function legWords() {
  const lang = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const draftBefore = (at) => at >= 0 && lang.slice(Math.max(0, at - 80), at).indexOf("/* draft words: copywriter */") >= 0;
  for (const [en, pl] of FINAL_PAIRS) {
    const at = lang.indexOf('"' + en + '"');
    const near = at < 0 ? "" : lang.slice(at, at + 500);
    keep("sxl1", at >= 0 && !draftBefore(at) && near.indexOf('"' + pl + '"') >= 0,
      en + " at " + at + " still a draft " + draftBefore(at) + " polish " + (near.indexOf('"' + pl + '"') >= 0));
  }
  const heldAt = lang.indexOf('"' + HELD_OPEN + '"');
  const heldNear = heldAt < 0 ? "" : lang.slice(heldAt, heldAt + 800).replace(/"\s*\+\s*"/g, "");
  keep("sxl1", heldAt >= 0 && !draftBefore(heldAt) && heldNear.indexOf(HELD_PL) >= 0,
    "held-open at " + heldAt + " still a draft " + draftBefore(heldAt) + " full Polish " + (heldNear.indexOf(HELD_PL) >= 0));
  const folderAt = lang.indexOf('"' + FOLDER_EN + '"');
  const folderNear = folderAt < 0 ? "" : lang.slice(folderAt, folderAt + 800).replace(/"\s*\+\s*"/g, "");
  keep("sxl1", folderAt >= 0 && !draftBefore(folderAt) && folderNear.indexOf(FOLDER_PL) >= 0,
    "folder line at " + folderAt + " still a draft " + draftBefore(folderAt) + " Polish " + (folderNear.indexOf(FOLDER_PL) >= 0));
}

async function main() {
  if (!ONLY || ONLY === "sxl1") legWords();
  if (!ONLY || ONLY === "sxw1") await legWriter();
  if (!ONLY || ONLY === "sxe1") await legPage();
  if (!ONLY || ONLY === "sxe8") await legPeriodTotalsAndRetired();
  if (!ONLY && fs.existsSync(path.join(ROOT, "src", "stats-book.mjs"))) {
    copyPlants({
      root: ROOT, self: SELF, label: "stats-export", onlyVar: "STATS_EXPORT_ONLY",
      plants: [{ mark: "sx-num", leg: "sxw1", rel: "src/stats-book.mjs", line: PLANT_LINE }],
      check: (ok, line) => keep("sxw1", ok, line),
      skip: (line) => keep("sxw1", true, line),
    });
  }
  console.log("stats-export: " + checks + " check(s), " + failures.length + " failure(s)");
  if (readerNote) console.log(readerNote);
  dropScratch(SCRATCH, "stats-export");
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.log("FAIL sxw1 the leg threw: " + (err && err.stack || err));
  try { dropScratch(SCRATCH, "stats-export"); } catch { /* the verdict is the throw */ }
  process.exit(1);
});
