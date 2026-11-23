/* AN ICON ON EVERY KIND OF TAB IN STUDIO'S STRIP (Maxim, board 1019 (10): only the Settings tab has an icon). The decision,
 * direction A of the product designer's sheet: the home tab a house, a catalog tab the set's own book, Settings its gear,
 * Maintenance a wrench instead of the gear it shared.
 *
 *     node tests/tab-icons.mjs
 *
 * Node only, on the page stand-in: the band's markup. What the eye sees at 1440 (the fit) is the window's.
 *   tic1 the home tab (Overview, Team or Library) wears the house, before its name
 *   tic2 every catalog tab wears the book, before its name
 *   tic3 the Settings tab wears the gear and the Maintenance tab the wrench, which is not the gear
 *   tic4 the glyph sits at the tab's own size, 15 px, and 6 px from the name
 *   tic5 the revision on a tab that is not open is the quieter form
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const APP = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
const CSS = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
const BOOT = "  boot();\n})();";
let failures = 0, legs = 0;
function check(ok, what) { legs++; if (!ok) failures++; console.log((ok ? "  ok   " : "  FAIL ") + what); }

const source = APP.replace(BOOT, '  window.__more = {};\n  ["paintTabs"].forEach((n) => { try { window.__more[n] = eval(n); } catch (e) {} });\n' + BOOT);
const h = loadPage({ api: null, uiLang: "en", source });
const S = h.page.S, ICONS = h.sandbox.STUDIO_ICONS;
const dirs = ["C:\p\Alpha", "C:\p\Beta", "C:\p\Gamma"];
Object.assign(S, { screen: "project", screens: ["settings", "maintenance"], screenAt: {},
  tabs: dirs.map((dir, i) => ({ dir, name: "Cat" + i, rev: i })), open: { dir: dirs[0], name: "Cat0", project: { rev: 0 } } });
h.page.paintTabs();
const band = h.node("#tabs").innerHTML;
const tab = (re) => { const m = re.exec(band); return m ? m[0] : ""; };
const home = tab(/<span[^>]*data-act="to-projects"[\s\S]*?<\/span>/);
const cats = band.split('data-act="to-project"').slice(1).map((s) => s.slice(0, s.indexOf('<span class="x"')));
const set = tab(/<span[^>]*data-v="settings"[\s\S]*?<span class="nm">/);
const mnt = tab(/<span[^>]*data-v="maintenance"[\s\S]*?<span class="nm">/);
const g = (n) => ICONS.html(n);
check(home.indexOf(g("home")) > 0 && home.indexOf(g("home")) < home.indexOf("Overview"), "tic1 the home tab wears the house before its name");
check(cats.length === 3 && cats.every((c) => c.indexOf(g("catalog")) >= 0 && c.indexOf(g("catalog")) < c.indexOf('class="nm"')),
  "tic2 each of the three catalog tabs wears the book before its name");
check(set.indexOf(g("settings")) > 0 && mnt.indexOf(g("maintenance")) > 0 && g("maintenance") !== g("settings") && mnt.indexOf(g("settings")) < 0,
  "tic3 Settings wears the gear, Maintenance the wrench and not the gear");
check(/\.tab\.screen>\.ic,\.tab\.ico>\.ic\{width:15px;height:15px;margin-right:-2px/.test(CSS), "tic4 15 px glyph, 6 px to the name (8 px gap less 2)");
check(/\.tab:not\(\.on\) \.rev\{[^}]*opacity:\.5/.test(CSS), "tic5 an unselected tab's revision is the quieter form");
console.log("#counts checks=" + legs + " failures=" + failures);
process.exit(failures ? 1 : 0);
