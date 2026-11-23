/* A dragged tile's neighbours and its drop move with transform. The drop's frames
 * carry no left and no top, and the neighbours' positions are read before any of
 * them is written.
 *
 *     node tests/shelf-drop.mjs
 *
 * Node only, no window. The drop frames are the page's own function, run on numbers.
 * The neighbour pass is read as text: the reads finish before the glide starts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");

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

const dropSrc = extractFn(app, "shvDropFrames");
const upSrc = extractFn(app, "shvUp");
const flipSrc = extractFn(app, "flipFrom");
check(!!dropSrc, "d1 shvDropFrames is in ui/app.js");
check(!!upSrc && !!flipSrc, "d2 shvUp and flipFrom are in ui/app.js");

const shvDropFrames = dropSrc ? new Function("return (" + dropSrc + ")")() : null;
if (shvDropFrames) {
  const frames = shvDropFrames(10, 20, 40, 55);
  const keys = new Set(frames.flatMap((f) => Object.keys(f)));
  check(!keys.has("left") && !keys.has("top") && !keys.has("width") && keys.has("transform"),
    "d3 the drop's frames have no left, top or width: " + [...keys].join(" "));
  check(frames.length === 2 && /rotate\(-1\.6deg\)/.test(frames[0].transform) && /scale\(1\.035\)/.test(frames[0].transform)
        && /translate\(0px,\s*0px\)/.test(frames[0].transform),
    "d4 the drop starts where the hand left it, still tilted");
  check(/translate\(30px,\s*35px\)/.test(frames[1].transform) && !/rotate/.test(frames[1].transform),
    "d5 the drop ends on the gap, flat: " + frames[1].transform);
  const back = shvDropFrames(80, 90, 50, 40);
  check(/translate\(-30px,\s*-50px\)/.test(back[1].transform),
    "d6 a gap up and to the left is the same kind of move: " + back[1].transform);
} else {
  check(false, "d3 the drop's frames have no left, top or width");
  check(false, "d4 the drop starts where the hand left it, still tilted");
  check(false, "d5 the drop ends on the gap, flat");
  check(false, "d6 a gap up and to the left is the same kind of move");
}

check(!!upSrc && /shvDropFrames\(/.test(upSrc) && /tier\("move", 180\) \+ 60/.test(upSrc)
      && /fill:\s*"forwards"/.test(upSrc) && /fade:\s*false/.test(upSrc)
      && !/left\s*:/.test(upSrc) && !/top\s*:/.test(upSrc),
  "d7 shvUp plays those frames for the move tier plus 60ms, and hands the glide no left or top");

if (flipSrc) {
  const writeAt = flipSrc.indexOf("moves.forEach");
  const pushAt = flipSrc.indexOf("moves.push");
  const animAt = flipSrc.indexOf("glideAnim");
  check(pushAt > 0 && writeAt > pushAt && animAt > writeAt && !/glideAnim/.test(flipSrc.slice(0, writeAt)),
    "d8 flipFrom reads every neighbour before it writes any transform");
  check(/transform:\s*"translate\(/.test(flipSrc) && !/left\s*:/.test(flipSrc) && !/top\s*:/.test(flipSrc),
    "d9 a neighbour's glide is a transform, with no left or top");
} else {
  check(false, "d8 flipFrom reads every neighbour before it writes any transform");
  check(false, "d9 a neighbour's glide is a transform, with no left or top");
}

console.log(legs + " leg(s), " + failures + " failure(s)");
process.exit(failures ? 1 : 0);
