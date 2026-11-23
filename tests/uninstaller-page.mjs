/* THE UNINSTALLER'S FIRST PAGE: where "Remove my data" and its note stand, held without makensis or a window.
 *
 *   node tests/uninstaller-page.mjs     nothing installed or run; exit code is the number of failed checks
 *
 * WHAT A PERSON SAW: on "Removing Etiuda Studio" the checkbox was drawn left of the text column, over the side picture's right edge, on a
 * grey band, and its note was cut to about seventy pixels on grey; and the box could not be clicked at all. In the desk's uninstaller it works.
 *
 * THE CAUSE, read from the script and from MUI2's Welcome.nsh (the cache the build compiles with). The welcome page is an nsDialogs
 * dialog whose controls stand in DIALOG UNITS: the title and text at 120u, 195u wide, the picture 109u wide and 193u tall. The box and
 * its note were made with raw user32::CreateWindowEx, in PIXELS (120, 155, 320 wide), on whichever "#32770" FindWindow met first
 * under the main window, and given neither the page's colours nor nsDialogs' registration. A pixel is not a unit: 120 px is 80u at
 * 100% and falls inside the picture (0 to 109u); the column starts at 120u, which is 180 px. Nothing about the note's width was
 * set against the column either, and the Welcome text label (195u by 130u from 45u) runs on under both. The desk has no such
 * control: it asks on a page of its own (nsDialogs::Create 1018, the box at 0u, the note under it), which is why it works there.
 *
 * THE MEND is the finish page's own way (MUI2 Finish.nsh makes its checkboxes so): ${NSD_CreateCheckbox} and ${NSD_CreateLabel} in
 * units, in the column, on the page's own colours, and the welcome text shortened above them.
 *
 *   uw1 THE CONTROLS ARE MADE BY nsDialogs ON THE WELCOME DIALOG, not by CreateWindowEx on a window found by class
 *   uw2 THEIR RECTANGLES, in units and as pixels at 100%, 125% and 150% display scaling (the base unit scaled with the display), stand
 *       in the text column: left edge the column's, right edge no further than the column's, below the shortened text, above the page's
 *       foot, and nowhere over the picture
 *   uw3 BOTH ARE GIVEN THE PAGE'S OWN TEXT AND BACKGROUND COLOURS, so neither shows as grey
 *   uw4 THE LEAVE STILL READS THE BOX BY BM_GETCHECK, and the data step's only "1" is that (the silent default stays "0", sm4b)
 *   uw5 THE DATA STEP ACTS ON THIS BUILD'S OWN FOLDER AND NO OTHER (a test build must never be able to remove a
 *       shipped Studio's data): every folder the section names is $APPDATA\${APP_PACKAGE_NAME}, which electron-builder sets from the build's own
 *       package name (etiuda-studio, or etiuda-studio-qa for the test build), and no line spells a shipped folder out
 * Each check is followed by its control: one deciding line changed in memory, which must read red alone.
 * ETIUDA_PLANTS=off skips the controls. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLANTS = process.env.ETIUDA_PLANTS !== "off";
let failed = 0, asserted = 0;
function check(ok, line, detail) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line + (detail ? "\n       " + detail : "")); }
}
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n"); } catch (e) { return ""; } };
const PAGES = read("packaging/installer-pages.nsh");
const code = text => String(text).split("\n").map(l => l.trim()).filter(l => l && !/^[#;]/.test(l));

/* MUI2's welcome page, in units (Contrib/Modern UI 2/Pages/Welcome.nsh, NSIS 3.12): the picture 0u..109u by 193u, the title and the
   text 120u from the left and 195u wide, the text from 45u (17u + a 28u title). */
const PAGE = { w: 315, h: 193, pic: { l: 0, r: 109 }, col: { l: 120, r: 315 }, textTop: 45 };
/* The base unit of a 96 dpi dialog in the installer's 8 pt face (6 by 13 px per 4 by 8 units), scaled with the display. */
const px = (u, axis, scale) => u * (axis === "x" ? 6 / 4 : 13 / 8) * (scale / 100);

const showBody = nsh => {
  const m = /\n\s*Function un\.TurnUnWelcomeShow\n([\s\S]*?)\n\s*FunctionEnd\n/.exec("\n" + nsh);
  return m ? m[1] : "";
};
const unitsRect = (body, macro, into) => {
  const m = new RegExp("\\$\\{NSD_Create" + macro + "\\} (\\d+)u (\\d+)u (\\d+)u (\\d+)u \"\\$\\(RemoveData\\w+\\)\"\\n\\s*Pop \\$" + into + "\\b").exec(body);
  return m ? { l: +m[1], t: +m[2], w: +m[3], h: +m[4], r: +m[1] + +m[3], b: +m[2] + +m[4] } : null;
};
/* The welcome text label, shortened: the rectangle given in units to MapDialogRect, then moved with MoveWindow. */
const textRect = body => {
  const m = /System::Call '\*\(i (\d+), i (\d+), i (\d+), i (\d+)\) p \.r(\d)'\n\s*System::Call 'user32::MapDialogRect\(p \$mui\.WelcomePage, p r\5\)'/.exec(body);
  const moved = /user32::MoveWindow\(p \$mui\.WelcomePage\.Text, i r\d, i r\d, i r\d, i r\d, i 1\)/.test(body);
  return m && moved ? { l: +m[1], t: +m[2], r: +m[3], b: +m[4] } : null;
};

function model(nsh) {
  const body = showBody(nsh), lines = code(body).join("\n");
  const cb = unitsRect(lines, "Checkbox", "UnRemoveCheckbox"), note = unitsRect(lines, "Label", "UnRemoveLabel");
  const text = textRect(lines);
  const colours = name => new RegExp("SetCtlColors \\$" + name + " \"\\$\\{MUI_TEXTCOLOR\\}\" \"\\$\\{MUI_BGCOLOR\\}\"").test(lines);
  return { body, lines, cb, note, text, raw: /CreateWindowEx|FindWindow/.test(lines),
           cbColours: colours("UnRemoveCheckbox"), noteColours: colours("UnRemoveLabel") };
}

/* uw1 */
const made = m => !!(m.cb && m.note) && !m.raw && !!m.body;
/* uw2: every scale. A rectangle is {l,t,r,b} in units; the picture and the column are the page's. */
function placed(m) {
  if (!m.cb || !m.note || !m.text) return { ok: false, why: "a control or the shortened text is not made in units" };
  const bad = [];
  for (const scale of [100, 125, 150]) {
    const X = u => Math.round(px(u, "x", scale)), Y = u => Math.round(px(u, "y", scale));
    const col = { l: X(PAGE.col.l), r: X(PAGE.col.r) }, pic = { r: X(PAGE.pic.r) }, foot = Y(PAGE.h);
    const textBottom = Y(m.text.b);
    for (const [name, c] of [["box", m.cb], ["note", m.note]]) {
      const l = X(c.l), r = X(c.r), t = Y(c.t), b = Y(c.b);
      if (l !== col.l) bad.push(scale + "% " + name + " left " + l + " is not the column's " + col.l);
      if (r > col.r) bad.push(scale + "% " + name + " right " + r + " passes the column's " + col.r);
      if (l < pic.r) bad.push(scale + "% " + name + " over the picture (" + l + " < " + pic.r + ")");
      if (t < textBottom) bad.push(scale + "% " + name + " top " + t + " is inside the welcome text (ends " + textBottom + ")");
      if (b > foot) bad.push(scale + "% " + name + " bottom " + b + " passes the page's foot " + foot);
    }
    if (m.note.t < m.cb.b) bad.push(scale + "% the note starts above the box's foot");
  }
  /* The welcome text keeps the column and starts where MUI put it. */
  if (m.text.l !== PAGE.col.l || m.text.r !== PAGE.col.r || m.text.t !== PAGE.textTop) bad.push("the shortened text is not MUI's column and top");
  return { ok: bad.length === 0, why: bad.slice(0, 4).join("; ") };
}

const base = model(PAGES);
check(made(base), "uw1 the box and its note are made by nsDialogs (${NSD_CreateCheckbox}, ${NSD_CreateLabel}) on the welcome dialog, in units, and"
  + " nothing in the page's show function calls CreateWindowEx or FindWindow", JSON.stringify({ cb: base.cb, note: base.note, raw: base.raw }));
const p2 = placed(base);
check(p2.ok, "uw2 at 100%, 125% and 150% the box and the note stand in the text column (left edge its, right edge no further, below the shortened"
  + " welcome text, above the page's foot, clear of the picture)", p2.why);
check(base.cbColours && base.noteColours, "uw3 the box and the note take the page's own text and background colours (MUI_TEXTCOLOR on MUI_BGCOLOR), so neither is grey",
  JSON.stringify({ box: base.cbColours, note: base.noteColours }));
const leaves = nsh => {
  const leave = code((/Function un\.TurnUnWelcomeLeave\n([\s\S]*?)\n\s*FunctionEnd/.exec(nsh) || [])[1] || "");
  const ones = (nsh.match(/StrCpy \$UnRemoveData "1"/g) || []).length;
  return leave.indexOf("SendMessage $UnRemoveCheckbox 0x00F0 0 0 $0 # BM_GETCHECK") > -1 && ones === 1;
};
check(leaves(PAGES), "uw4 the leave reads the box with BM_GETCHECK, and that is the only place the data step is set to 1");

/* uw5 */
const ownFolder = nsh => {
  const sec = code((/\n!macro studioRemoveUserDataSection\n([\s\S]*?)\n!macroend/.exec("\n" + nsh) || [])[1] || "").join("\n");
  const own = (sec.match(/\$APPDATA\\\$\{APP_PACKAGE_NAME\}\\/g) || []).length;
  const literal = (sec.match(/\$APPDATA\\[A-Za-z]/g) || []).length;
  return { ok: own === 4 && literal === 0, own, literal };
};
check(ownFolder(PAGES).ok, "uw5 the Remove my data section reaches only $APPDATA\\${APP_PACKAGE_NAME} (four places, no shipped folder spelled out), so a test build's"
  + " uninstaller never touches a shipped Studio's data", JSON.stringify(ownFolder(PAGES)));

if (PLANTS) {
  const sub = (text, from, to) => { const n = text.split(from).length - 1; return n === 1 ? text.replace(from, to) : null; };
  const must = (text, from, to) => { const r = sub(text, from, to); if (r === null) throw new Error("the control's anchor is not found exactly once: " + from.slice(0, 60)); return r; };
  const gone = (what, ok, line) => check(ok === false, line);
  try {
    /* uw1 controls: the box back as a raw window in pixels. */
    const raw = must(PAGES, "${NSD_CreateCheckbox} 120u", "System::Call 'user32::CreateWindowEx(i 0, t \"BUTTON\"' ${NSD_CreateCheckbox} 120u");
    gone("uw1", made(model(raw)), "uw1 control: a CreateWindowEx left in the show function reads red");
    /* uw2 controls: the box moved left into the picture; widened past the column; the shortened text taller than the box's top. */
    const left = must(PAGES, "${NSD_CreateCheckbox} 120u", "${NSD_CreateCheckbox} 80u");
    gone("uw2", placed(model(left)).ok, "uw2 control: the box at 80u, under the picture's edge, reads red");
    const wide = must(PAGES, "${NSD_CreateLabel} 120u 124u 195u", "${NSD_CreateLabel} 120u 124u 260u");
    gone("uw2", placed(model(wide)).ok, "uw2 control: the note wider than the column reads red");
    const tall = must(PAGES, "System::Call '*(i 120, i 45, i 315, i 105) p .r1'", "System::Call '*(i 120, i 45, i 315, i 175) p .r1'");
    gone("uw2", placed(model(tall)).ok, "uw2 control: the welcome text left tall over the box reads red");
    const low = must(PAGES, "${NSD_CreateLabel} 120u 124u 195u 60u", "${NSD_CreateLabel} 120u 124u 195u 80u");
    gone("uw2", placed(model(low)).ok, "uw2 control: the note running past the page's foot reads red");
    /* uw3 control: the note left on the system colours. */
    const grey = must(PAGES, "SetCtlColors $UnRemoveLabel", "SetWindowTheme_ $UnRemoveLabel");
    gone("uw3", model(grey).noteColours, "uw3 control: the note with no colours given reads red");
    /* uw5 control: one place spelled out as the shipped folder. */
    gone("uw5", ownFolder(must(PAGES, 'Push "$APPDATA\\${APP_PACKAGE_NAME}\\$R2"', 'Push "$APPDATA\\etiuda-studio\\$R2"')).ok, "uw5 control: one folder spelled out as the shipped name reads red");
    /* uw4 control: the box read by a state that is not BM_GETCHECK. */
    gone("uw4", leaves(must(PAGES, "0x00F0 0 0 $0 # BM_GETCHECK", "0x00F1 0 0 $0 # BM_GETSTATE")), "uw4 control: the leave reading another message reads red");
  } catch (e) {
    check(false, "the controls could not be set up: " + e.message);
  }
} else console.log("  (controls skipped: ETIUDA_PLANTS=off)");

console.log((failed ? failed + " FAILED of " : "passed ") + asserted + " check(s)");
process.exit(Math.min(failed, 63));
