/* THE ENGINE'S BUBBLE, FROM THE PINNED FILE INTO THIS PAGE'S ONE <style>.
 *
 *   node tools/bubble-css.mjs            splices engine/pinned/engine/bubble.css into ui/index.html
 *   node tools/bubble-css.mjs --check    prints the disagreement and exits 1 if the two differ
 *
 * WHY A SPLICE AND NOT A <link>, weighed 2026-09-21 and the choice the engine's E1 left to this
 * tree. Both work; the splice was taken for three reasons and one of them is not tidiness.
 *
 *   1. THE SHEET'S OWN RULE. ui/index.html's first comment says one <style> and nothing
 *      injecting CSS at runtime, "the engine's habit and for the engine's reason: a sheet a test
 *      can read off the disk is a sheet a test can hold still". A second stylesheet makes the
 *      page's cascade two files whose equal-specificity ties are settled by source order, and
 *      every gate in this tree that reads the sheet off the disk would then be reading half of
 *      it without saying so.
 *   2. THE CSP STAYS AT `default-src 'none'`. A <link> is fetched under style-src, which this
 *      page sets to 'unsafe-inline' alone, so linking costs `'self'` on style-src for the life
 *      of the program to buy one file. The splice costs nothing: the bytes are already inline.
 *      (Measured in the engineer's own note at ui/app.js: the pinned module IMPORTS fine from
 *      the packaged asar under script-src 'self'; it is the stylesheet half, and only that half,
 *      that style-src-elem refuses. So the JS and the CSS are not one decision.)
 *   3. THE GATE IS STRONGER. A link proves the file resolved; this proves the bytes in the page
 *      equal the bytes of the pin, which is the claim that actually matters when the pin moves.
 *
 * WHAT IT COSTS is one chore: after `node tools/engine-fetch.mjs` at a new pin, run this. That is
 * the chore the pin already imposes and tests/tour.mjs refuses a page that has skipped it, so it
 * is a loud chore rather than a silent one.
 *
 * NOTHING BETWEEN THE MARKERS IS EDITED HERE. The family is defined in the engine's
 * src/template.html, published by its tools/build.mjs, fetched by tools/engine-fetch.mjs and
 * copied in by this. Four hands and not one of them writes a rule.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FROM = path.join(ROOT, "engine", "pinned", "engine", "bubble.css");
const TO = path.join(ROOT, "ui", "index.html");

/* The markers are whole lines and are matched as whole lines, so a mention of one in a comment
   elsewhere in the sheet cannot be mistaken for the region's edge. */
const OPEN = "/* >>> THE ENGINE'S BUBBLE, SPLICED BY tools/bubble-css.mjs - DO NOT EDIT HERE <<< */";
const SHUT = "/* >>> END OF THE ENGINE'S BUBBLE <<< */";

/** The pinned file's bytes as text, LF, with no trailing blank line of its own. */
export function source() {
  if (!fs.existsSync(FROM))
    throw new Error("no " + path.relative(ROOT, FROM).split(path.sep).join("/")
      + "; run node tools/engine-fetch.mjs (the pin must carry engine/bubble.css)");
  return fs.readFileSync(FROM, "utf8").split("\r\n").join("\n").replace(/\n+$/, "");
}

/** Where the region is in a page, asserted to be there exactly once. */
export function region(html) {
  const lines = String(html).split("\n");
  const at = (m) => {
    const hits = [];
    lines.forEach((l, i) => { if (l === m) hits.push(i); });
    if (hits.length !== 1)
      throw new Error("ui/index.html carries the marker " + JSON.stringify(m.slice(0, 40))
        + " " + hits.length + " time(s) as a line of its own, wanted exactly 1");
    return hits[0];
  };
  const a = at(OPEN), b = at(SHUT);
  if (b <= a) throw new Error("the bubble's closing marker is above its opening one");
  return { lines, a, b, held: lines.slice(a + 1, b).join("\n") };
}

/** The page as it should stand, with the pinned bytes between the markers. */
export function spliced(html) {
  const { lines, a, b } = region(html);
  return lines.slice(0, a + 1).concat(source().split("\n"), lines.slice(b)).join("\n");
}

function main(argv) {
  const html = fs.readFileSync(TO, "utf8");
  const want = spliced(html);
  const check = argv.indexOf("--check") >= 0;
  const held = region(html).held, from = source();
  if (want === html) {
    process.stdout.write("bubble-css: ui/index.html holds the pin's "
      + Buffer.byteLength(from) + " bytes, " + from.split("\n").length + " line(s)\n");
    return 0;
  }
  if (check) {
    process.stderr.write("bubble-css: the page and the pinned file disagree - "
      + Buffer.byteLength(held) + " byte(s) in ui/index.html against "
      + Buffer.byteLength(from) + " in engine/pinned/engine/bubble.css;"
      + " run node tools/bubble-css.mjs\n");
    return 1;
  }
  fs.writeFileSync(TO, want, "utf8");
  process.stdout.write("bubble-css: wrote " + Buffer.byteLength(from) + " byte(s) of the pin's"
    + " bubble.css into ui/index.html\n");
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  process.exit(main(process.argv.slice(2)));

export { OPEN, SHUT, FROM, TO };
