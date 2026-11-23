/* A shelf that folds or opens glides without animating width, and the spine marks are
 * written after every spine has been read.
 *
 *     node tests/shelf-fold.mjs
 *
 * Node only, no window. The frames are the page's own function, run on numbers. The spine
 * pass is the page's own function, run on elements that record each read and each write.
 * The call site is read as text: the settle still asks for the resize tier, and it does
 * not hand a width key to the glide.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
const sheet = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");

let legs = 0, failures = 0;
function check(ok, what) {
  legs++;
  if (!ok) failures++;
  console.log((ok ? "  ok   " : "  FAIL ") + what);
}

function extractFn(src, name) {
  const start = src.indexOf("function " + name + "(");
  if (start < 0) return null;
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

const foldSrc = extractFn(app, "shvFoldFrames");
const cutSrc = extractFn(app, "shvSpineCut");
const settleSrc = extractFn(app, "shvSettle");
const paintSrc = extractFn(app, "paintShelves");
check(!!foldSrc, "f1 shvFoldFrames is in ui/app.js");
check(!!cutSrc, "f2 shvSpineCut is in ui/app.js");

const shvFoldFrames = foldSrc ? new Function("return (" + foldSrc + ")")() : null;
const shvSpineCut = cutSrc ? new Function("return (" + cutSrc + ")")() : null;

if (shvFoldFrames) {
  const frames = shvFoldFrames(120, 236, 40);
  const all = frames.outer.concat(frames.inner);
  const keys = new Set(all.flatMap((f) => Object.keys(f)));
  check(!keys.has("width") && !keys.has("left") && !keys.has("top"),
    "f3 a fold's frames have no width, left or top: " + [...keys].join(" "));
  check(frames.outer.length === frames.inner.length && frames.outer.length >= 2
        && frames.outer[0].offset === 0 && frames.outer[frames.outer.length - 1].offset === 1,
    "f4 the glide has a start and an end");
  const scaleOf = (t) => {
    const m = /scaleX\(([^)]+)\)/.exec(t);
    return m ? +m[1] : NaN;
  };
  const products = frames.outer.map((f, i) => scaleOf(f.transform) * scaleOf(frames.inner[i].transform));
  const worst = products.reduce((m, n) => Math.max(m, Math.abs(n - 1)), 0);
  check(products.every((n) => Math.abs(n - 1) < 1e-9),
    "f5 at every sample the words' counter-scale cancels the frame: worst " + worst);
  check(Math.abs(scaleOf(frames.outer[0].transform) - 236 / 40) < 1e-9
        && Math.abs(scaleOf(frames.outer[frames.outer.length - 1].transform) - 1) < 1e-9,
    "f6 the frame starts at the old width and ends at the new one");
  check(/translateX\(120px\)/.test(frames.outer[0].transform)
        && /translateX\(0px\)/.test(frames.outer[frames.outer.length - 1].transform),
    "f7 a shelf that also shifted starts at that shift and ends at rest");
  const open = shvFoldFrames(0, 40, 236);
  check(Math.abs(scaleOf(open.outer[0].transform) - 40 / 236) < 1e-9
        && Math.abs(scaleOf(open.outer[0].transform) * scaleOf(open.inner[0].transform) - 1) < 1e-9,
    "f8 an opening shelf starts at its old width on the same terms");
} else {
  check(false, "f3 a fold's frames have no width, left or top");
  check(false, "f4 the glide has a start and an end");
  check(false, "f5 at every sample the words' counter-scale cancels the frame");
  check(false, "f6 the frame starts at the old width and ends at the new one");
  check(false, "f7 a shelf that also shifted starts at that shift and ends at rest");
  check(false, "f8 an opening shelf starts at its old width on the same terms");
}

if (shvSpineCut) {
  const log = [];
  const spine = (scroll, client) => ({
    get scrollHeight() { log.push("read"); return scroll; },
    parentElement: { get clientHeight() { log.push("read"); return client; } },
    classList: { toggle(name, on) { log.push("write"); this.cut = name === "cut" && !!on; } },
  });
  const rows = [spine(200, 80), spine(10, 80), spine(100, 50)];
  shvSpineCut(rows);
  const firstWrite = log.indexOf("write");
  check(firstWrite > 0 && log.slice(0, firstWrite).every((x) => x === "read")
        && log.slice(firstWrite).every((x) => x === "write") && log.filter((x) => x === "write").length === 3,
    "f9 every spine is read before any class is written: " + log.join(" "));
  check(rows[0].classList.cut === true && rows[1].classList.cut === false && rows[2].classList.cut === true,
    "f10 a spine is marked only when its text overruns the shelf");
} else {
  check(false, "f9 every spine is read before any class is written");
  check(false, "f10 a spine is marked only when its text overruns the shelf");
}

check(!!settleSrc && /shvFoldFrames\(/.test(settleSrc) && /tier\("resize", 200\)/.test(settleSrc)
      && !/width\s*:/.test(settleSrc),
  "f11 shvSettle glides a fold through shvFoldFrames at the resize tier, with no width key");
check(!!paintSrc && /shvSpineCut\(/.test(paintSrc) && !/scrollHeight/.test(paintSrc),
  "f12 paintShelves marks spines through shvSpineCut and does not read them itself");
check(/\.shelf\{[^}]*transform-origin:\s*left center/.test(sheet),
  "f13 the shelf's frame scales from its left edge");

console.log(legs + " leg(s), " + failures + " failure(s)");
process.exit(failures ? 1 : 0);
