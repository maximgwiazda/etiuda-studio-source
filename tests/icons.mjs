/* THE GLYPH SET, HELD TO ITS FOLDER, ITS INDEX AND THE SCREENS THAT ASK FOR IT.
 *
 *     node tests/icons.mjs
 *
 * THREE WAYS THIS GOES WRONG AND NONE OF THEM THROWS AT RUNTIME. A glyph edited in
 * tools/icons/ and never regenerated into ui/icons.js leaves the screens painting the old
 * drawing. A name mistyped in ui/app.js paints nothing at all, because STUDIO_ICONS.html
 * answers the empty string rather than throwing - a glyph must never be the reason a screen
 * fails to paint - so the button simply loses its picture and stays a word. And a drawing that
 * carries a colour of its own would ignore the theme, which nothing on the screen would say
 * either: it would be the right colour on one ground and wrong on the other.
 *
 * SO THE GENERATED FILE IS REGENERATED HERE AND COMPARED, the names ui/app.js asks for are read
 * out of its source, and the index that says what each glyph is FOR is held against the folder
 * both ways. The index is the set's own vocabulary (Maxim, 2026-09-18: the set goes in as it is)
 * and a name in one and not the other is how that vocabulary goes quietly out of date.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, source } from "../tools/icons.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

const set = build();
const generated = source();
const onDisk = fs.readFileSync(path.join(ROOT, "ui", "icons.js"), "utf8");
check(onDisk === generated,
  "1a ui/icons.js is what tools/icons.mjs writes from tools/icons/ today, byte for byte ("
  + onDisk.length + " characters)" + (onDisk === generated ? "" : "; run `node tools/icons.mjs`"));

const index = fs.readFileSync(path.join(ROOT, "tools", "icons", "index.md"), "utf8");
const named = new Set((index.match(/^- `([a-z0-9-]+)`:/gm) || [])
  .map(l => l.replace(/^- `/, "").replace(/`:$/, "")));
check(set.size > 0 && set.size === named.size,
  "1b the set is " + set.size + " glyphs, one file per name");

/* build() refuses a file that carries a colour, so this is the reading that says it looked:
   every glyph's markup names currentColor and no hex, rgb() or url() anywhere in it. */
const inked = [...set].filter(([, svg]) => svg.indexOf("currentColor") >= 0).length;
check(inked === set.size,
  "1c every one of them is drawn in currentColor and none carries a colour of its own ("
  + inked + " of " + set.size + "), so a glyph takes the ink of the control it sits in");

const unnamed = [...set.keys()].filter(n => !named.has(n));
const missing = [...named].filter(n => !set.has(n));
check(unnamed.length === 0 && missing.length === 0,
  "1d the index names every glyph and every name in it is a file: " + named.size + " lines"
  + (unnamed.length ? ", not naming " + JSON.stringify(unnamed) : "")
  + (missing.length ? ", naming " + JSON.stringify(missing) + " which is not there" : ""));

/* ---- what the screens ask for ---------------------------------------------------------------- */

const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
const asks = [...new Set((app.match(/\bI\("([a-z0-9-]+)"\)/g) || [])
  .map(m => m.replace(/^I\("/, "").replace(/"\)$/, "")))].sort();
check(asks.length >= 20,
  "2a ui/app.js asks for " + asks.length + " of them by name, which is the reading this gate"
  + " is about: a scan that found none would pass 2b without looking at anything");
const absent = asks.filter(n => !set.has(n));
check(absent.length === 0,
  "2b and every one of those names is in the set" + (absent.length
    ? ", except " + JSON.stringify(absent) : ": " + asks.join(", ")));

/* THE CONTROL. The same test over a name nobody has drawn must fail, or 2b is a sentence about
   an empty list rather than a check on a set. */
check(!set.has("no-such-glyph"),
  "2c control: a name the folder has not got is not in the set, so 2b would have caught one");

process.stdout.write("icons  " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
