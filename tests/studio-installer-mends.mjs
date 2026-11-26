/* STUDIO'S HALF OF THE ENGINE'S INSTALLER MENDS (engine 22d3af9c), held without makensis or a window: electron-builder.js,
 * shell/main.js, packaging/installer-pages.nsh and packaging/installer/allusers-folder.nsh, read as text, and the pieces that run
 * replayed in memory or over a temporary folder. The swap, the stage's judge and the walks are the pinned engine's own NSIS, cut
 * into engine/pinned/.installer-hooks.nsh; the engine's tests/installer-mends.mjs replays them. What this leg holds is what Studio
 * must carry for them: the list they read, the words they say, the start that clears the copy set aside, and Studio's own copies.
 *
 *   node tests/studio-installer-mends.mjs     no fixtures, nothing installed or run; exit code is the number of failed checks
 *
 *   sm1 THE INSTALL'S OWN LIST (etiuda-files.ini), which the pinned installer reads from engine 22d3af9c on
 *       a  electron-builder.js writes it after packing and again after signing, Windows only, exactly where the pinned installer
 *          reads it, and what it writes is whole by the pinned engine's own model
 *       b  installList, sliced and run over temporary folders: the pinned writer's list; a pin whose installer reads the list with
 *          no writer fetched refuses the build; a pin that predates the list writes nothing; another platform writes nothing
 *       c  the module list fetches the writer wherever the pinned installer reads the list, and the package leaves it out
 *   sm2 THE COPY SET ASIDE GOES ONCE THE NEW COPY HAS STARTED
 *       a  setAsideDrop, sliced out of shell/main.js and run over a folder in memory: its list's files and the folders they empty
 *          go; a person's file and a junction stay; a folder without the program is not ours
 *       b  it runs once the window is made, after ten seconds, packaged on Windows alone, walked with original-fs
 *       c  it is the pinned engine's byte for byte wherever the pin's shell/main.js carries it
 *   sm3 THE WORDS THE PINNED INSTALLER SAYS: every etiuda* language string the cut or Studio's include names is defined in Polish
 *       and in English for the installer pass, and the two new ones are the copywriter's words, with Etiuda Studio for the program
 *   sm4 AN ALL-USERS INSTALL STARTED ELEVATED
 *       a  Studio's own copy of etiudaOldUserCopy (compiled only while the cut lacks one) leaves the per-user copy to its own
 *          uninstaller at that account's next sign-in, /currentuser /S /KEEP_APP_DATA, and runs nothing of that account's
 *       b  Studio's uninstaller run silent keeps the person's data: only the page's box removes it
 *   sm5 THE ALL-USERS FOLDER WARNING resolves ".." before it trusts a Program Files prefix
 * Each check is followed by its controls: one deciding line changed in memory, which must read red alone. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
let failed = 0, asserted = 0;
function check(ok, line, detail) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line + (detail ? "\n       " + detail : "")); }
}
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n"); } catch (e) { return ""; } };
const CFG = read("electron-builder.js"), MAIN = read("shell/main.js"), PAGES = read("packaging/installer-pages.nsh");
const FOLDER = read("packaging/installer/allusers-folder.nsh"), MODULES = read("tools/engine-modules.txt");
const CUT = read("engine/pinned/.installer-hooks.nsh"), PIN_MAIN = read("engine/pinned/shell/main.js");
const PIN_WRITER = path.join(ROOT, "engine", "pinned", "shell", "install-files.cjs");
const LIST = "etiuda-files.ini";
const readsList = cut => String(cut).indexOf(LIST) > -1;

const macro = (text, name) => (new RegExp("\\n!macro " + name + "(?: [^\\n]*)?\\n([\\s\\S]*?)\\n!macroend").exec("\n" + text) || [])[1] || "";
const code = text => String(text).split("\n").map(l => l.trim()).filter(l => l && !/^[#;]/.test(l));
const lab = fs.mkdtempSync(path.join(os.tmpdir(), "studio-installer-mends-"));
let labN = 0;
const freshDir = () => { const d = path.join(lab, String(labN++)); fs.mkdirSync(d, { recursive: true }); return d; };
/* A small packed folder: the program, a resource and a locale. */
const packed = () => {
  const d = freshDir();
  fs.mkdirSync(path.join(d, "resources")); fs.mkdirSync(path.join(d, "locales"));
  fs.writeFileSync(path.join(d, "Etiuda Studio.exe"), Buffer.alloc(40, 1));
  fs.writeFileSync(path.join(d, "resources", "app.asar"), Buffer.alloc(25, 2));
  fs.writeFileSync(path.join(d, "locales", "pl.pak"), Buffer.alloc(7, 3));
  return d;
};
/* The pinned model, where the pin carries it; otherwise none, and a list is then judged by its own count line alone. */
let MODEL = null;
try { if (fs.existsSync(PIN_WRITER)) MODEL = require(PIN_WRITER); } catch (e) { MODEL = null; }
const sizeIn = root => rel => { try { return fs.statSync(path.join(root, ...rel.split("\\"))).size; } catch (e) { return null; } };

try {
  /* ---- sm1a: the hooks, as electron-builder calls them ---- */
  const hooked = cfgText => /\n\s*afterPack: async context => installList\(context\),\n/.test(cfgText)
    && /\n\s*afterSign: async context => installList\(context\),\n/.test(cfgText);
  let ran = { ok: false };
  try {
    const cfg = require(path.join(ROOT, "electron-builder.js"));
    const linux = packed(), win = packed(), win2 = packed();
    await cfg.afterPack({ electronPlatformName: "linux", appOutDir: linux });
    await cfg.afterPack({ electronPlatformName: "win32", appOutDir: win });
    await cfg.afterSign({ electronPlatformName: "win32", appOutDir: win2 });
    const wrote = d => fs.existsSync(path.join(d, LIST));
    const whole = d => !wrote(d) || (MODEL ? MODEL.stageProblems(fs.readFileSync(path.join(d, LIST), "utf8"), sizeIn(d)).length === 0 : false);
    const want = readsList(CUT);
    ran = { ok: !wrote(linux) && wrote(win) === want && wrote(win2) === want && whole(win) && whole(win2), linux: wrote(linux),
      afterPack: wrote(win), afterSign: wrote(win2), want, whole: whole(win) && whole(win2) };
  } catch (e) { ran = { ok: false, why: e.message }; }
  check(hooked(CFG) && ran.ok, "sm1a electron-builder.js writes " + LIST + " after packing and again after signing, Windows only, wherever"
    + " the pinned installer reads it (" + (readsList(CUT) ? "this pin does, and the list is whole by the pin's own model" : "this pin"
    + " predates it, so nothing is written") + ")", JSON.stringify(ran));
  check(!hooked(CFG.replace(/\n\s*afterSign: async context => installList\(context\),\n/, "\n")),
    "sm1a control: the list written before signing alone, its sizes then stale once the program is signed, reads red");

  /* ---- sm1b: installList itself, over temporary folders ---- */
  const sliceList = cfgText => (/\nfunction installList\(context, pinned\) \{\n[\s\S]*?\n\}\n/.exec(cfgText) || [""])[0];
  const lists = cfgText => {
    const src = sliceList(cfgText);
    if (!src) return { ok: false, why: "no installList" };
    const name = (/\nconst LIST_NAME = "([^"]+)";\n/.exec(cfgText) || [])[1];
    if (name !== LIST) return { ok: false, why: "LIST_NAME is " + JSON.stringify(name) };
    const installList = new Function("fs", "path", "require", "__dirname", "LIST_NAME", src + "\nreturn installList;")(fs, path, require, ROOT, name);
    const pinned = (writer, cutText) => {
      const d = freshDir();
      fs.mkdirSync(path.join(d, "shell"));
      if (writer) fs.writeFileSync(path.join(d, "shell", "install-files.cjs"), writer);
      fs.writeFileSync(path.join(d, ".installer-hooks.nsh"), cutText);
      return d;
    };
    const STAND_IN = "module.exports = { writeManifest: root => { require('node:fs').writeFileSync(require('node:path').join(root, '"
      + LIST + "'), 'count=3\\r\\n'); return 3; } };\n";
    const out = {};
    const a = packed();
    out.writer = installList({ electronPlatformName: "win32", appOutDir: a }, pinned(STAND_IN, "!define ETIUDA_FILES \"" + LIST + "\"\n")) === 3
      && fs.readFileSync(path.join(a, LIST), "utf8") === "count=3\r\n";
    if (MODEL) {
      const r = packed();
      installList({ electronPlatformName: "win32", appOutDir: r }, path.join(ROOT, "engine", "pinned"));
      const text = fs.readFileSync(path.join(r, LIST), "utf8");
      fs.unlinkSync(path.join(r, "locales", "pl.pak"));
      out.real = MODEL.stageProblems(text, sizeIn(r)).length === 1;
    } else out.real = true;
    const b = packed();
    try { installList({ electronPlatformName: "win32", appOutDir: b }, pinned("", "  !define ETIUDA_FILES \"" + LIST + "\"\n")); out.refused = false; }
    catch (e) { out.refused = /tools\/engine-modules\.txt/.test(e.message) && !fs.existsSync(path.join(b, LIST)); }
    const c = packed();
    out.predates = !installList({ electronPlatformName: "win32", appOutDir: c }, pinned("", "!define ETIUDA_ASIDE_SUFFIX \".setup-previous\"\n"))
      && !fs.existsSync(path.join(c, LIST));
    const e = packed();
    out.linux = !installList({ electronPlatformName: "linux", appOutDir: e }, pinned(STAND_IN, LIST)) && !fs.existsSync(path.join(e, LIST));
    return { ok: out.writer && out.real && out.refused && out.predates && out.linux, ...out };
  };
  /* A throw where none is wanted reads as a case that did not hold, never as the leg's end. */
  const listsOr = cfgText => { try { return lists(cfgText); } catch (e) { return { ok: false, why: e.message }; } };
  const l1 = listsOr(CFG);
  check(l1.ok, "sm1b installList writes the pinned writer's list" + (MODEL ? " (this pin's own, whose model then misses a file taken out)" : "")
    + "; a pin whose installer reads the list with no writer fetched refuses the build, naming the module list; a pin that predates the"
    + " list, or another platform, writes nothing", JSON.stringify(l1));
  check(!listsOr(CFG.replace(/throw new Error\(LIST_NAME \+ ": the pinned installer reads it/, "return \"\"; if (false) throw new Error(LIST_NAME + \": the pinned installer reads it")).ok,
    "sm1b control: a pin whose installer reads the list, built with no list, as every update would then be refused as short, reads red");
  check(!listsOr(CFG.replace("  if (context.electronPlatformName !== \"win32\") return \"\";\n", "")).ok,
    "sm1b control: the list written into a Linux package reads red");

  /* ---- sm1c: the writer is fetched wherever the pinned installer reads the list, and never shipped ---- */
  const fetchedAndKept = (cut, modules, cfgText) => {
    const listed = modules.split("\n").map(l => l.trim()).indexOf("shell/install-files.cjs") > -1;
    const out = /\n\s*"!engine\/pinned\/shell\/install-files\.cjs",\n/.test(cfgText);
    return { ok: (!readsList(cut) || listed) && out, listed, out };
  };
  const f1 = fetchedAndKept(CUT, MODULES, CFG);
  check(f1.ok, "sm1c tools/engine-modules.txt fetches shell/install-files.cjs wherever the pinned installer reads " + LIST + " ("
    + (readsList(CUT) ? "this pin does" : "this pin does not, so the line joins the list with the pin that does") + "), and the package"
    + " leaves the build's writer out of the asar", JSON.stringify(f1));
  check(!fetchedAndKept("Var etiudaWalkIni\n!define ETIUDA_FILES \"" + LIST + "\"\n", MODULES.split("shell/install-files.cjs").join("# gone"), CFG).ok,
    "sm1c control: a pin whose installer reads the list, with the writer not fetched, reads red");
  check(!fetchedAndKept(CUT, MODULES, CFG.replace(/\n\s*"!engine\/pinned\/shell\/install-files\.cjs",/, "")).ok,
    "sm1c control: the writer packed into the asar a customer installs reads red");

  /* ---- sm2: the copy set aside, dropped by its list once Studio has started ---- */
  const sliceDrop = main => (/\nasync function setAsideDrop\(fsp, join, aside, own, exe\) \{\n[\s\S]*?\n\}\n/.exec(main) || [""])[0];
  function memFs(files, dirs, links) {
    const W = path.win32, fail = () => Promise.reject(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    const thru = p => { for (const [l, t] of links) if (p.startsWith(l + "\\")) return t + p.slice(l.length); return p; };
    const under = q => [...dirs, ...files.keys(), ...links.keys()].filter(x => W.dirname(x) === q);
    return {
      lstat: async p => { if (links.has(p)) return { isDirectory: () => false, isSymbolicLink: () => true }; const q = thru(p);
        if (dirs.has(q)) return { isDirectory: () => true, isSymbolicLink: () => false };
        if (files.has(q)) return { isDirectory: () => false, isSymbolicLink: () => false }; return fail(); },
      readFile: async p => { const q = thru(p); return files.has(q) ? files.get(q) : fail(); },
      readdir: async p => { const q = links.has(p) ? links.get(p) : thru(p); if (!dirs.has(q)) return fail(); return under(q).map(x => W.basename(x)); },
      unlink: async p => { const q = thru(p); if (!files.has(q)) return fail(); files.delete(q); },
      rmdir: async p => { const q = thru(p); if (!dirs.has(q) || under(q).length) return fail(); dirs.delete(q); },
    };
  }
  const ini = (files, dirs, extra) => ["[files]", ...Object.entries(files).map(([k, v]) => k + "=" + v), ...(extra || []), "[dirs]",
    ...dirs.map(d => d + "=1"), "[list]", ...Object.keys(files).map((k, i) => i + "=" + k), "[end]", "count=" + Object.keys(files).length, ""].join("\r\n");
  const EXE = "Etiuda Studio.exe", A = "C:\\S.setup-previous", O = "C:\\S";
  const OLD_LIST = ini({ [EXE]: 9, "resources\\app.asar": 5, "locales\\pl.pak": 2, "kit\\a.dll": 4 }, ["kit", "locales", "resources"],
    ["Uninstall Etiuda Studio.exe=installer", LIST + "=installer"]);
  const NEW_LIST = ini({ [EXE]: 10, "resources\\app.asar": 6, "locales\\pl.pak": 3, "collide.txt": 7 }, ["locales", "resources"]);
  const drops = async main => {
    const src = sliceDrop(main);
    if (!src) return { ok: false, why: "no setAsideDrop" };
    const drop = new Function(src + "\nreturn setAsideDrop;")();
    const W = path.win32;
    const files = new Map([[A + "\\" + EXE, ""], [A + "\\" + LIST, OLD_LIST], [A + "\\resources\\app.asar", ""], [A + "\\locales\\pl.pak", ""],
      [A + "\\collide.txt", ""], [A + "\\Uninstall Etiuda Studio.exe", ""], ["C:\\X\\a.dll", ""], [O + "\\" + LIST, NEW_LIST]]);
    const dirs = new Set([A, A + "\\resources", A + "\\locales", "C:\\X", O]);
    const links = new Map([[A + "\\kit", "C:\\X"]]);
    const said = await drop(memFs(files, dirs, links), W.join, A, O, EXE);
    const gone = [EXE, LIST, "resources\\app.asar", "locales\\pl.pak", "Uninstall Etiuda Studio.exe"].every(r => !files.has(A + "\\" + r))
      && !dirs.has(A + "\\locales") && !dirs.has(A + "\\resources");
    const kept = files.has(A + "\\collide.txt") && files.has("C:\\X\\a.dll") && links.has(A + "\\kit") && said === "kept";
    const f2 = new Map([[A + "\\" + EXE, ""], [A + "\\resources\\old.bin", ""], [A + "\\mine.txt", ""], [O + "\\" + LIST, NEW_LIST]]);
    const said2 = await drop(memFs(f2, new Set([A, A + "\\resources", O]), new Map()), W.join, A, O, EXE);
    const wide = said2 === "kept" && !f2.has(A + "\\" + EXE) && !f2.has(A + "\\resources\\old.bin") && f2.has(A + "\\mine.txt");
    const f3 = new Map([[A + "\\mine.txt", ""], [O + "\\" + LIST, NEW_LIST]]);
    const said3 = await drop(memFs(f3, new Set([A, O]), new Map()), W.join, A, O, EXE);
    const notOurs = said3 === "none" && f3.has(A + "\\mine.txt");
    const f4 = new Map([[A + "\\" + EXE, ""], [A + "\\" + LIST, OLD_LIST]]);
    const said4 = await drop(memFs(f4, new Set([A, O]), new Map()), W.join, A, O, EXE);
    return { ok: gone && kept && wide && notOurs && said4 === "gone", gone, kept, wide, notOurs, all: said4 };
  };
  const d1 = await drops(MAIN).catch(e => ({ ok: false, why: e.message }));
  check(d1.ok, "sm2a Studio's start drops the copy set aside by its own list, or the newer list with resources and locales whole: listed"
    + " files and the folders they empty go, a person's file and a junction (its target untouched) stay, and a folder without the"
    + " program is not ours", JSON.stringify(d1));
  const d2 = await drops(MAIN.replace(" || !(await fsp.lstat(join(aside, exe)).catch(() => null))) return \"none\";", ") return \"none\";")).catch(() => ({ ok: false }));
  check(!d2.ok, "sm2a control: a folder of that name without the program taken as ours reads red");
  const d3 = await drops(MAIN.replace("else if (listed.files.has(key) || whole(key)) await fsp.unlink(p)", "else await fsp.unlink(p)")).catch(() => ({ ok: false }));
  check(!d3.ok, "sm2a control: every file in the copy set aside deleted, a sweep, reads red");

  const armed = main => /\n\s*const win = createWindow\(\);\n\s*const asideAt = app\.isPackaged \? setTimeout\(dropSetAside, 10000\) : null;[^\n]*\n\s*if \(asideAt && asideAt\.unref\) asideAt\.unref\(\);\n/.test(main)
    && /\nfunction dropSetAside\(\) \{\n\s*if \(process\.platform !== "win32" \|\| !app\.isPackaged\) return;\n\s*const own = path\.dirname\(process\.execPath\);\n(?:\s*\/\*[\s\S]*?\*\/\n)?\s*let ofs = fs;\n\s*try \{ ofs = require\("original-fs"\); \} catch \{ ofs = fs; \}\n\s*setAsideDrop\(ofs\.promises, path\.join, own \+ "\.setup-previous", own, path\.basename\(process\.execPath\)\)\.catch\(\(\) => \{\}\);\n\}\n/.test(main);
  check(armed(MAIN), "sm2b it runs ten seconds after the window is made, packaged on Windows alone, over <folder>.setup-previous beside"
    + " the running program, walked with original-fs, which sees resources\\app.asar as the file it is, and a failure is silent");
  check(!armed(MAIN.replace("if (process.platform !== \"win32\" || !app.isPackaged) return;", "if (process.platform !== \"win32\") return;")),
    "sm2b control: a run from the tree, beside the developer's own checkout, dropping a folder there reads red");
  check(!armed(MAIN.replace("setAsideDrop(ofs.promises, path.join", "setAsideDrop(fs.promises, path.join")),
    "sm2b control: the walk with Electron's node:fs, which reads app.asar as a folder and never unlinks it, keeping the copy aside for good, reads red");

  const heldToPin = (studio, pinned) => !pinned ? { ok: !!studio, held: false } : { ok: studio === pinned, held: true };
  const h1 = heldToPin(sliceDrop(MAIN), sliceDrop(PIN_MAIN));
  check(h1.ok, "sm2c setAsideDrop is the pinned engine's byte for byte wherever the pin's shell/main.js carries it ("
    + (h1.held ? "this pin does" : "this pin predates it, so Studio's stands alone until it does") + ")", JSON.stringify(h1));
  const one = sliceDrop(MAIN).replace("return \"none\";", "return \"nonE\";");
  check(!heldToPin(sliceDrop(MAIN), one).ok, "sm2c control: a pinned function one character apart reads red");

  /* ---- sm3: the words ---- */
  const turnLang = nsh => (/\n!macro TurnLang ID\n([\s\S]*?)\n!macroend/.exec("\n" + nsh) || [])[1] || "";
  const defined = (nsh, branch) => {
    const lang = turnLang(nsh), pl = lang.indexOf("!if ${ID} == 1045"), other = lang.indexOf("\n  !else\n", pl);
    const part = branch === "pl" ? lang.slice(pl, other) : lang.slice(other);
    const names = new Map();
    let guard = "";
    for (const raw of part.split("\n")) {
      const l = raw.trim();
      if (/^!ifndef BUILD_UNINSTALLER$/.test(l)) guard = "installer";
      else if (/^!ifdef BUILD_UNINSTALLER$/.test(l)) guard = "uninstaller";
      else if (/^!endif$/.test(l)) guard = "";
      const m = /^LangString (\w+) \$\{ID\} "([^"\n]*)"(.*)$/.exec(l);
      if (m && guard !== "uninstaller") names.set(m[1], { text: m[2], tail: m[3].trim() });
    }
    return names;
  };
  const named = text => [...new Set((String(text).match(/\$\((etiuda\w+)\)/g) || []).map(s => s.slice(2, -1)))];
  /* The copywriter's words, with Etiuda Studio for the program; the Polish puts „program” before the name, so it takes no
     ending. */
  const WORDS_TAIL = "; the copywriter's words";
  const NEW_WORDS = {
    etiudaOldCopyGoes: {
      pl: "Program Etiuda Studio jest zainstalowany dla wszystkich użytkowników. Wcześniejsza kopia tylko dla tego konta zostanie usunięta przy jego następnym logowaniu do Windows; dane konta zostają.",
      en: "Etiuda Studio is installed for all users. The copy installed earlier for this account alone is removed at its next Windows sign-in; the account's data stays." },
    etiudaFolderNotOurs: {
      pl: "Nie zainstalowano programu Etiuda Studio: w folderze $etiudaBase są już inne pliki. Program instaluje się tylko w pustym folderze albo w miejsce swojej wcześniejszej kopii, więc wystarczy uruchomić instalator ponownie i wybrać inny folder.",
      en: "Etiuda Studio was not installed: $etiudaBase already holds other files. It installs only into an empty folder or over an earlier copy of itself, so run the installer again and choose another folder." },
  };
  const says = (nsh, cut) => {
    const pl = defined(nsh, "pl"), en = defined(nsh, "en");
    const wanted = [...new Set(named(cut).concat(named(nsh)).concat(Object.keys(NEW_WORDS)))];
    const missing = wanted.filter(n => !pl.has(n) || !en.has(n));
    const wrong = Object.entries(NEW_WORDS).filter(([n, w]) => !pl.has(n) || !en.has(n) || pl.get(n).text !== w.pl || en.get(n).text !== w.en
      || pl.get(n).tail !== WORDS_TAIL || en.get(n).tail !== WORDS_TAIL).map(([n]) => n);
    return { ok: !missing.length && !wrong.length, missing, wrong, wanted: wanted.length };
  };
  const s1 = says(PAGES, CUT);
  check(s1.ok, "sm3a every etiuda* language string the pinned cut or Studio's include names is defined in Polish and in English for the"
    + " installer pass, and etiudaOldCopyGoes and etiudaFolderNotOurs are the copywriter's words with Etiuda Studio for the program, each marked as hers",
    JSON.stringify(s1));
  check(!says(PAGES.replace(/\n\s*LangString etiudaFolderNotOurs \$\{ID\} "Nie zainstalowano[^\n]*/, ""), CUT).ok,
    "sm3a control: the Polish refusal gone, makensis then failing on a pin that names it, reads red");
  check(!says(PAGES.split("Etiuda Studio was not installed").join("Etiuda was not installed"), CUT).ok,
    "sm3a control: the desk's sentence in place of Studio's reads red");
  check(!says(PAGES, CUT + "\n    MessageBox MB_OK \"$(etiudaSomethingNew)\"\n").ok,
    "sm3a control: a pin naming a string Studio does not define reads red");

  /* ---- sm4a: Studio's own copy of etiudaOldUserCopy ---- */
  const RUNONCE = "WriteRegStr HKCU \"Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce\" \"${APP_ID}.per-user-copy\" \"$R9 /currentuser /S /KEEP_APP_DATA\"";
  const leftToItsOwner = nsh => {
    const m = code(macro(nsh, "etiudaOldUserCopy"));
    const rest = m.slice(m.lastIndexOf("${Else}"));
    const cond = rest.indexOf("${If} $R9 != \"\""), w = rest.indexOf(RUNONCE);
    const said = rest.indexOf("StrCpy $etiudaFinishText \"$(etiudaOldCopyGoes)\"");
    const runsNothing = rest.length > 0 && !rest.some(l => /uninstallOldVersion|ExecWait|\bExec\b|ExecShell|nsExec/.test(l));
    return { ok: m.length > 0 && cond > -1 && w > cond && said > cond && runsNothing, cond, w, said, runsNothing };
  };
  const o1 = leftToItsOwner(PAGES);
  check(o1.ok, "sm4a Studio's own etiudaOldUserCopy, started elevated, leaves the per-user copy HKCU names to its own uninstaller at that"
    + " account's next sign-in (HKCU RunOnce, /currentuser /S /KEEP_APP_DATA), runs nothing of that account's, and the finish page says so",
    JSON.stringify(o1));
  check(!leftToItsOwner(PAGES.replace(/\n\s*WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce"[^\n]*/, "")).ok,
    "sm4a control: the copy left registered with nothing to remove it, as before, reads red");
  check(!leftToItsOwner(PAGES.replace("$R9 /currentuser /S /KEEP_APP_DATA", "$R9 /S /KEEP_APP_DATA")).ok,
    "sm4a control: the line without /currentuser, which beside the new all-users copy takes the all-users branch and asks to elevate, reads red");

  /* ---- sm4b: the silent uninstall keeps the data ---- */
  const keeps = nsh => {
    const init = code(macro(nsh, "customUnInit")), sec = code(macro(nsh, "studioRemoveUserDataSection"));
    const ones = (nsh.match(/StrCpy \$UnRemoveData "1"/g) || []).length;
    const box = /\n\s*SendMessage \$UnRemoveCheckbox 0x00F0 0 0 \$0 # BM_GETCHECK\n\s*\$\{If\} \$0 == 1\n\s*StrCpy \$UnRemoveData "1"\n/.test(nsh);
    return { ok: init.indexOf("StrCpy $UnRemoveData \"0\"") > -1 && ones === 1 && box && sec.indexOf("${If} $UnRemoveData == \"1\"") > -1, ones, box };
  };
  const k1 = keeps(PAGES);
  check(k1.ok, "sm4b Studio's uninstaller run silent, as the sign-in's line runs it, keeps the person's data: the data step runs only on"
    + " the page's box, never by default", JSON.stringify(k1));
  check(!keeps(PAGES.replace("StrCpy $UnRemoveData \"0\"", "StrCpy $UnRemoveData \"1\"")).ok,
    "sm4b control: the data removed by default, a silent uninstall then taking it, reads red");

  /* ---- sm5: ".." resolved before the Program Files prefix ---- */
  const resolvesFirst = text => {
    const leave = code((/Function etiudaFolderLeave\n([\s\S]*?)FunctionEnd/.exec(text) || [])[1] || "");
    const full = leave.indexOf("System::Call 'kernel32::GetFullPathNameW(w r0, i ${NSIS_MAX_STRLEN}, w .r1, i 0) i .r2'");
    const take = leave.indexOf("StrCpy $0 $1", full), prefix = leave.indexOf("StrLen $3 $PROGRAMFILES64");
    const guard = full > -1 && leave[full + 1] === "${If} $2 > 0" && leave[full + 2] === "${AndIf} $2 < ${NSIS_MAX_STRLEN}" && leave[full + 3] === "StrCpy $0 $1";
    const named = leave.indexOf("StrCpy $0 \"$0\\${APP_FILENAME}\"");
    return { ok: full > named && named > -1 && guard && take > full && prefix > take, full, take, prefix, guard };
  };
  const pf = "C:\\Program Files", given = "C:\\Program Files\\..\\Users\\Public\\Etiuda Studio", resolved = path.win32.resolve(given);
  const why = given.startsWith(pf + "\\") && !resolved.startsWith(pf + "\\");
  const r5 = resolvesFirst(FOLDER);
  check(r5.ok && why, "sm5a the all-users folder warning resolves the path as Windows will (GetFullPathNameW) before the Program Files"
    + " prefix is trusted: " + JSON.stringify(given) + " resolves to " + JSON.stringify(resolved) + ", outside it", JSON.stringify(r5));
  check(!resolvesFirst(FOLDER.replace(/\n\s*System::Call 'kernel32::GetFullPathNameW[^\n]*/, "")).ok,
    "sm5a control: the raw string's prefix trusted again reads red");
} catch (e) {
  check(false, "the leg ran to its end", e && e.stack || String(e));
} finally {
  fs.rmSync(lab, { recursive: true, force: true });
}

const EXPECTED = 27;
if (asserted !== EXPECTED) { failed++; console.log("  FAIL ran " + asserted + " checks, expected " + EXPECTED); }
console.log("\n#counts checks=" + asserted + " failed=" + failed + " notRun=0");
console.log("studio-installer-mends " + (failed ? failed + " failure(s)" : "passed " + asserted + " check(s)"));
process.exit(Math.min(failed, 63));
