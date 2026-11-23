/* PLANTED FAULTS IN A SCRATCH COPY, for a suite that runs one leg alone when an environment variable names it.
 *
 *   import { copyPlants } from "./plant-copy.mjs";
 *   copyPlants({ root, self, label, onlyVar, plants: [{ mark, leg, rel, line }], check, skip });
 *
 * Each plant is the line of `rel` that carries the mark plant:<mark> in a comment, replaced by `line` in a scratch copy of the
 * tree (tests/plants-tree.mjs), never in the checkout. The copy's own copy of the suite then runs with `onlyVar` set to the
 * plant's leg and ETIUDA_PLANTS=off, and the plant holds only where that child exits non-zero and prints "FAIL <leg>". The
 * copy's file is put back by its sha256 before the next plant, and once all have run the checkout's src/, shell/ and ui/
 * are held to the sha256 they had before. ETIUDA_PLANTS=off (a merge's area run) skips the phase and counts each plant as
 * skipped through `skip`; the release profile runs with plants on, so the phase still runs there.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { plantsTree, treeSha, dropPlantsTree } from "./plants-tree.mjs";

const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

export function copyPlants({ root, self, label, onlyVar, plants, check, skip, timeout }) {
  if (PLANTS_OFF) {
    for (const p of plants) skip("plant " + p.mark + " turns " + p.leg + " red in a scratch copy (ETIUDA_PLANTS=off)");
    skip("the checkout is unchanged after the scratch-copy plants of " + label + " (ETIUDA_PLANTS=off)");
    return;
  }
  const before = treeSha(root);
  let copy = null;
  try {
    copy = plantsTree(root, label);
    const child = path.join(copy, path.relative(root, self));
    for (const p of plants) {
      const file = path.join(copy, p.rel);
      const buf = fs.readFileSync(file), want = sha(buf), text = buf.toString("utf8");
      const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
      const lines = text.split(nl);
      const tag = "/* plant:" + p.mark + " */";
      const hits = lines.map((l, i) => (l.indexOf(tag) >= 0 ? i : -1)).filter((i) => i >= 0);
      if (hits.length !== 1) { check(false, "plant " + p.mark + " is on " + hits.length + " lines of " + p.rel + ", not one"); continue; }
      lines[hits[0]] = p.line;
      let out = "", status = null;
      try {
        fs.writeFileSync(file, lines.join(nl));
        const run = spawnSync(process.execPath, [child], {
          cwd: copy, encoding: "utf8", timeout: timeout || 180000,
          env: Object.assign({}, process.env, { [onlyVar]: p.leg, ETIUDA_PLANTS: "off" }),
        });
        out = String(run.stdout || "") + String(run.stderr || "");
        status = run.status;
      } finally {
        fs.writeFileSync(file, buf);
      }
      const back = sha(fs.readFileSync(file)) === want;
      const red = status !== 0 && status !== null && out.indexOf("FAIL " + p.leg) >= 0;
      check(red && back, "plant " + p.mark + " turns " + p.leg + " red in a scratch copy, and the copy's " + p.rel
        + " is put back by sha256: red=" + red + " back=" + back + (red ? "" : " status=" + status + " tail=" + out.slice(-300).replace(/\s+/g, " ")));
    }
  } finally {
    if (copy) dropPlantsTree(copy, root);
  }
  check(treeSha(root) === before, "the checkout's src/, shell/ and ui/ are unchanged after the scratch-copy plants of " + label);
}

/* A text substitution kept as it was, anchored to the plant: mark on the line where it starts.
   The mark is not part of the fault. A `from` that already quotes its own mark is applied on that
   line alone. A harness file under tests/ with no mark is still rewritten by its text. */
function stripPlantMarks(s) {
  return s.replace(/[ \t]*\/\* plant:[A-Za-z0-9_-]+ \*\//g, "");
}

export function plantText(text, from, to, rel) {
  if (process.env.ETIUDA_PLANTS === "off") throw new Error("plantText is the plants-on path");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const norm = (s) => (nl === "\n" ? s : s.replace(/\r\n/g, "\n").split("\n").join(nl));
  const needleRaw = norm(from);
  const toNorm = norm(to);
  const where = rel || "the file";
  const own = needleRaw.match(/\/\* plant:([A-Za-z0-9_-]+) \*\//);
  if (own) {
    const mark = "/* plant:" + own[1] + " */";
    const lines = text.split(nl);
    const hits = [];
    for (let i = 0; i < lines.length; i++) if (lines[i].indexOf(mark) >= 0) hits.push(i);
    if (hits.length !== 1) throw new Error("plant " + own[1] + " is on " + hits.length + " lines of " + where);
    const count = lines[hits[0]].split(needleRaw).length - 1;
    if (count !== 1) throw new Error("plant " + own[1] + " substitution matches " + count + " on its line of " + where);
    lines[hits[0]] = lines[hits[0]].split(needleRaw).join(toNorm);
    return lines.join(nl);
  }
  const lines = text.split(nl);
  const bareLines = lines.map(stripPlantMarks);
  const bare = bareLines.join(nl);
  const needle = stripPlantMarks(needleRaw);
  const count = needle.length ? bare.split(needle).length - 1 : 0;
  if (count !== 1) throw new Error(where + " substitution matches " + count);
  const at = bare.indexOf(needle);
  const startLine = bare.slice(0, at).split(nl).length - 1;
  const marks = lines[startLine].match(/\/\* plant:[A-Za-z0-9_-]+ \*\//g) || [];
  const harness = typeof rel === "string" && /(^|\/)tests\//.test(rel.replace(/\\/g, "/"));
  if (marks.length !== 1) {
    if (harness && marks.length === 0) return text.split(needleRaw).join(toNorm);
    throw new Error(where + " target line has " + marks.length + " plant marks");
  }
  /* Marks outside the matched lines stay. The fault is the same bytes text.replace would write
     once the marks on the matched lines are set aside. */
  const off = [0];
  for (let i = 0; i < bareLines.length; i++) off.push(off[i] + bareLines[i].length + nl.length);
  const end = at + needle.length;
  let endLine = startLine;
  const last = end === at ? at : end - 1;
  while (endLine + 1 < bareLines.length && off[endLine + 1] <= last) endLine++;
  const prefix = bare.slice(off[startLine], at);
  const suffix = bare.slice(end, off[endLine] + bareLines[endLine].length);
  const mid = prefix + toNorm + suffix;
  let midLines = mid === "" ? [] : mid.split(nl);
  if (mid.endsWith(nl)) midLines = midLines.slice(0, -1);
  return lines.slice(0, startLine).concat(midLines, lines.slice(endLine + 1)).join(nl);
}
