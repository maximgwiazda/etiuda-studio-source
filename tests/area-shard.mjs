/* AN AREA CUT INTO SHARDS (tools/gate-run.mjs ETIUDA_AREA_SHARD and ETIUDA_AREA_DESK_ONLY, as the engine's of 2026-11-17; the
 * hosted machines, .github/workflows/hosted-area.yml, built 2026-11-22 and never run). Node only; it lists plans and runs no gate.
 *
 * gate-kind: node
 *
 *     node tests/area-shard.mjs
 *
 * as1 The shards 1/2 and 2/2 of one area's plan list every command of the whole plan, each exactly once, nothing else, and the
 *     plan is not empty.
 * as2 The same for 1/3, 2/3 and 3/3, so the cover is not a property of two. The plant bracket's two halves are the exception:
 *     each is in every shard (as10).
 * as3 A shard that is not i/n with 1 <= i <= n <= 64 is refused with exit 78 before any plan is made, never read as the whole
 *     area: 9/8, 0/4, 1/65, a/b, 3/0.
 * as4 A gate named in ETIUDA_AREA_DESK_ONLY is said LEFT TO THE DESK and is in no shard's list; a name the plan does not hold is
 *     said "(not in this plan)".
 * as5 A shard's line says it is not an area run and that no green is inherited from it.
 * as6 Unset changes nothing: ETIUDA_AREA_SHARD empty, with ETIUDA_AREA_DESK_ONLY naming a gate of the plan, lists the whole plan
 *     in the same order, with no shard line and nothing left to the desk (the desk's list is read with a shard only).
 * as7 Read as text, since a gate that is red once and green after needs a gate of its own: a shard reruns a red gate once, alone,
 *     names a green rerun a FLAKE, and does not rerun a gate that refused (NO_VERDICT); and runStep takes both variables out of the
 *     environment a gate inherits, so a gate that starts an area of its own gets the whole plan.
 * as8 The workflow, read as text (no YAML package is a dependency here; tests/launch-door.mjs reads gates.yml the same way): it
 *     starts on a push to hosted-test-** alone, its matrix has SHARDS entries, every DESK_ONLY entry is a file of this tree with a
 *     reason line naming it, every script a step runs is a file of this tree, it never sets the window word (WINDOWS_VAR, named in
 *     tests/window-wall.mjs alone, launch-door 7d) or reads a secret, and
 *     its header says it is never run without Claude alpha's word.
 * as9 The workflow writes nothing into the checkout, read as text over the area job: every tee and every > of a step writes under
 *     HOSTED_LOGS, which is set only to a folder of runner.temp, and every path the job uploads is under runner.temp; and a step
 *     "the tree reads clean", after the pin's fetch and before the shard, reads the tree as gate-run's gitTree does (git status
 *     --porcelain, git ls-files -v) and stops. The first hosted run teed shard.log and engine-fetch.log into the checkout,
 *     untracked files this repository does not ignore: every shard read "the tree is not a clean commit" and stopped at its first gate, NO
 *     VERDICT, the tree moved (shard.log, growing while the gate ran).
 * as10 Every shard of 1/3 opens with the plant record (tests/plant-hold.mjs) and closes with its compare, as the whole plan does
 *     (what follows the compare in a shard follows it in the whole plan).
 *     Each shard is a tree of its own, so a compare whose record ran on another machine finds none: cut round-robin, the two
 *     halves fell to neighbouring shards, and the one holding the compare read "chain record missing", red on every run.
 *
 * The base of the plans is three commits back, so the plan holds gates whatever the tree holds; only the cover is judged, not
 * which gates the plan names. ETIUDA_AREA_RESUME=off, so a desk record cannot carry gates out of one listing and not another.
 * The listings after the first run side by side, each about a minute of planning.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { WINDOWS_VAR } from "./window-wall.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = 10;
let checks = 0, failed = 0;
function check(ok, line) { checks++; if (!ok) failed++; console.log((ok ? "  ok   " : "  FAIL ") + line); }

function list(extra) {
  return new Promise(resolve => {
    const env = Object.assign({}, process.env);
    delete env.ETIUDA_AREA_SHARD; delete env.ETIUDA_AREA_DESK_ONLY;
    Object.assign(env, { ETIUDA_AREA_RESUME: "off" }, extra || {});
    const child = spawn(process.execPath, ["tools/gate-run.mjs", "area", "HEAD~3", "--list"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", d => { out += d; });
    child.stderr.on("data", d => { out += d; });
    const wall = setTimeout(() => child.kill(), 300000);
    child.on("close", code => {
      clearTimeout(wall);
      const cmds = out.split(/\r?\n/).filter(l => /^  (node|npm) /.test(l)).map(l => l.replace(/ \([^)]*\)$/, "").trim());
      resolve({ code, out, cmds });
    });
  });
}

/* The plant bracket's two halves (the record that opens a run and the compare that closes it) belong to every shard, since each
   shard is a tree of its own; every other command is in exactly one. */
const BRACKET = /^node tests\/(plant-hold\.mjs|plant-hold\.mjs --compare|plant-compare\.mjs)$/;
function cover(whole, parts) {
  const seen = new Map();
  for (const p of parts) for (const c of p.cmds) seen.set(c, (seen.get(c) || 0) + 1);
  const missing = whole.cmds.filter(c => !seen.has(c));
  const twice = [...seen].filter(([c, n]) => n !== (BRACKET.test(c) ? parts.length : 1)).map(([c]) => c);
  const extra = [...seen.keys()].filter(c => !whole.cmds.includes(c));
  return { ok: whole.code === 0 && whole.cmds.length > 0 && parts.every(p => p.code === 0) && !missing.length && !twice.length && !extra.length,
    said: "whole " + whole.cmds.length + ", shards " + parts.map(p => p.cmds.length).join("+") + ", missing " + missing.length
      + ", twice " + twice.length + ", extra " + extra.length };
}

const whole = await list();
const one = whole.cmds.find(c => /^node tests\/[^ ]+$/.test(c));
const file = one ? one.slice("node ".length) : "";
const BAD = ["9/8", "0/4", "1/65", "a/b", "3/0"];
const [halves, thirds, bad, desk, unset] = await Promise.all([
  Promise.all([1, 2].map(i => list({ ETIUDA_AREA_SHARD: i + "/2" }))),
  Promise.all([1, 2, 3].map(i => list({ ETIUDA_AREA_SHARD: i + "/3" }))),
  Promise.all(BAD.map(v => list({ ETIUDA_AREA_SHARD: v }).then(r => ({ v, r })))),
  list({ ETIUDA_AREA_SHARD: "1/1", ETIUDA_AREA_DESK_ONLY: file + ",tests/no-such-leg.mjs" }),
  list({ ETIUDA_AREA_SHARD: "", ETIUDA_AREA_DESK_ONLY: file }),
]);

{ const c = cover(whole, halves); check(c.ok, "as1 the shards 1/2 and 2/2 list every command of the whole plan exactly once, the plant bracket in each: " + c.said); }
{ const c = cover(whole, thirds); check(c.ok, "as2 the shards 1/3, 2/3 and 3/3 list every command of the whole plan exactly once, the plant bracket in each: " + c.said); }
{
  /* Closes as the whole plan does: what follows the compare in a shard follows it in the whole plan too (a window gate's node arm
     is placed after the bracket there, and stays after it). */
  const opener = whole.cmds[0], closer = whole.cmds.find(c => BRACKET.test(c) && c !== opener);
  const after = new Set(closer ? whole.cmds.slice(whole.cmds.indexOf(closer) + 1) : []);
  const bracketed = !!opener && BRACKET.test(opener) && !!closer;
  const each = thirds.map(p => {
    const k = p.cmds.indexOf(closer);
    return p.cmds[0] === opener && k > 1 && p.cmds.slice(1, k).every(c => !after.has(c)) && p.cmds.slice(k + 1).every(c => after.has(c));
  });
  check(bracketed && each.every(Boolean), "as10 every shard opens with the plant record and closes with its compare, as the whole plan does ("
    + opener + " ... " + closer + "): " + each.map((v, k) => (k + 1) + "/3 " + (v ? "bracketed" : "NOT bracketed")).join(", "));
}
{
  const refused = bad.filter(b => b.r.code === 78 && /want i\/n/.test(b.r.out) && b.r.cmds.length === 0 && !/gate-run area: base /.test(b.r.out)).map(b => b.v);
  check(refused.length === bad.length, "as3 a shard not i/n with 1 <= i <= n <= 64 is refused with exit 78 before any plan, never the whole area: refused "
    + refused.join(", ") + " of " + BAD.join(", ") + " (exits " + bad.map(b => b.r.code).join(", ") + ")");
}
{
  /* A file may stand in the plan more than once (tests/plant-hold.mjs, and again with --compare); the desk takes every command of it. */
  const ofFile = c => c === one || c.startsWith(one + " ");
  const held = whole.cmds.filter(ofFile).length;
  const r = desk;
  check(!!file && r.code === 0 && r.out.includes("LEFT TO THE DESK " + file + "\n") && !r.cmds.some(ofFile)
    && r.out.includes("LEFT TO THE DESK tests/no-such-leg.mjs (not in this plan)") && r.cmds.length === whole.cmds.length - held,
    "as4 a gate left to the desk is said and listed in no shard, every command of it, a stale name said as such: " + file + " ("
    + held + " command(s)), listed " + r.cmds.length + " of " + whole.cmds.length);
}
check(/shard 1\/2: \d+ of \d+ gate\(s\); not an area run, and no green is inherited from it/.test(halves[0].out),
  "as5 a shard's line says it is not an area run and that no green is inherited from it");
check(unset.code === 0 && JSON.stringify(unset.cmds) === JSON.stringify(whole.cmds) && !/gate-run area: shard /.test(unset.out) && !/LEFT TO THE DESK/.test(unset.out),
  "as6 an empty ETIUDA_AREA_SHARD, the desk's list set beside it, lists the whole plan in order with no shard line and nothing left out: "
  + unset.cmds.length + " of " + whole.cmds.length);
{
  const src = fs.readFileSync(path.join(ROOT, "tools", "gate-run.mjs"), "utf8");
  const rerun = /if \(res\.exit !== 0 && shard && res\.exit !== NO_VERDICT\) \{[\s\S]{0,400}await runStep\(step, customEnv\)[\s\S]{0,300}gate-run: FLAKE /.test(src);
  const step = src.slice(src.indexOf("function runStep("), src.indexOf("function runStep(") + 900);
  const kept = /const env = Object\.assign\([^\n]*\);\s*(\/\*[^]*?\*\/\s*)?delete env\.ETIUDA_AREA_SHARD;\s*delete env\.ETIUDA_AREA_DESK_ONLY;/.test(step);
  check(rerun && kept, "as7 (as text) a red gate of a shard is rerun once and a green rerun named a FLAKE, a refusal not rerun: " + rerun
    + "; runStep keeps the two variables from a gate: " + kept);
}
{
  const yml = fs.readFileSync(path.join(ROOT, ".github", "workflows", "hosted-area.yml"), "utf8");
  const said = [];
  /* The triggers are a push to hosted-test-** and the dispatch tools/publish-tree.mjs makes on the public repository for a tree it pushed
     (one input, the private commit it came from, 2026-11-23); no pull request, schedule or tag, and no other dispatch input. Was: a push to
     hosted-test-** alone, and workflow_dispatch refused. */
  const onBlock = /\non:\n  push:\n    branches: \['hosted-test-\*\*'\]\n(?:  #[^\n]*\n)*  workflow_dispatch:\n    inputs:\n      private_sha:\n(?:        [a-z_]+: [^\n]*\n)+\n/;
  const onText = yml.replace(/\r\n/g, "\n");
  const on = onBlock.test(onText) && !/pull_request|schedule:|\n  push:\n    tags/.test(yml) && (onText.match(/workflow_dispatch/g) || []).length === 1;
  if (!on) said.push("trigger");
  const shards = Number((/^  SHARDS: (\d+)\s*$/m.exec(yml) || [])[1]);
  const matrix = ((/^ +shard: \[([0-9, ]+)\]\s*$/m.exec(yml) || [])[1] || "").split(",").map(x => Number(x.trim())).filter(Boolean);
  if (!(shards > 0 && matrix.length === shards && matrix.every((v, k) => v === k + 1))) said.push("matrix " + JSON.stringify(matrix) + " for SHARDS " + shards);
  const desk = ((/^  DESK_ONLY: (.*)$/m.exec(yml) || [])[1] || "").split(",").map(x => x.trim()).filter(Boolean);
  const comments = yml.split(/\r?\n/).filter(l => /^\s*#/.test(l)).join("\n");
  for (const f of desk) {
    if (!fs.existsSync(path.join(ROOT, f))) said.push("DESK_ONLY " + f + " is not a file of this tree");
    if (!new RegExp("#\\s+" + f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ": \\S").test(comments)) said.push("DESK_ONLY " + f + " has no reason line");
  }
  const scripts = [...yml.matchAll(/\bnode ((?:tools|tests)\/[A-Za-z0-9_./-]+\.(?:mjs|js|cjs))/g)].map(m => m[1]);
  const steps = yml.split(/\r?\n/).filter(l => !/^\s*#/.test(l)).join("\n");
  const ran = [...steps.matchAll(/\bnode ((?:tools|tests)\/[A-Za-z0-9_./-]+\.(?:mjs|js|cjs))/g)].map(m => m[1]);
  for (const s of new Set(scripts)) if (!fs.existsSync(path.join(ROOT, s))) said.push("names " + s + ", which is not a file of this tree");
  if (!ran.length) said.push("no step runs a script, so the reader is blind");
  if (steps.includes(WINDOWS_VAR) || /secrets\.|ETIUDA_FIXTURES:/.test(steps)) said.push("sets " + WINDOWS_VAR + ", ETIUDA_FIXTURES or reads a secret");
  if (!/^# NEVER RUN WITHOUT CLAUDE ALPHA'S WORD\./m.test(yml)) said.push("the header does not say it is never run without Claude alpha's word");
  check(!said.length, "as8 the workflow starts on hosted-test-** or the publish tool's one dispatch alone, " + matrix.length + " shards for SHARDS " + shards + ", DESK_ONLY "
    + (desk.join(", ") || "empty") + " each a file with its reason, " + new Set(ran).size + " script(s) run each a file of this tree, no window, fixture"
    + " or secret, never run without Claude alpha's word" + (said.length ? ": " + said.join("; ") : ""));
}
{
  const yml = fs.readFileSync(path.join(ROOT, ".github", "workflows", "hosted-area.yml"), "utf8").replace(/\r\n/g, "\n");
  const said = [];
  const from = yml.indexOf("\n  area:\n"), to = yml.indexOf("\n  joined:\n");
  const code = from < 0 ? "" : yml.slice(from, to > from ? to : undefined).split("\n").filter(l => !/^\s*#/.test(l)).join("\n");
  if (!code.length) said.push("no area job to read, so the reader is blind");
  const sets = [...code.matchAll(/^\s+HOSTED_LOGS: (.*)$/gm)].map(m => m[1].trim());
  if (!sets.length) said.push("HOSTED_LOGS is never set");
  for (const v of sets) if (!/^\$\{\{ runner\.temp \}\}[\\/]\S+$/.test(v)) said.push("HOSTED_LOGS set to " + v + ", not a folder of runner.temp");
  const logVar = /^\s+log="\$HOSTED_LOGS\/[^"\s]+"\s*$/m.test(code);
  const inLogs = t => /^"\$HOSTED_LOGS\//.test(t) || (logVar && t === '"$log"') || t === "/dev/null";
  const targets = [...code.matchAll(/\btee\s+(?:-a\s+)?(\S+)/g)].map(m => m[1])
    .concat([...code.matchAll(/(?<![0-9&>=])>{1,2}\s*([^\s;|&)]+)/g)].map(m => m[1]));
  for (const t of targets) if (!inLogs(t)) said.push("writes " + t + " into the checkout");
  if (!targets.length) said.push("no tee or > found, so the reader is blind");
  const uploads = [];
  for (const m of code.matchAll(/^(\s+)path: ?(\|)?(.*)$/gm)) {
    if (!m[2]) { uploads.push(m[3].trim()); continue; }
    for (const l of code.slice(m.index + m[0].length + 1).split("\n")) {
      if (!l.trim() || l.length - l.trimStart().length <= m[1].length) break;
      uploads.push(l.trim());
    }
  }
  if (!uploads.length) said.push("no upload path found, so the reader is blind");
  for (const u of uploads) if (!/^\$\{\{ runner\.temp \}\}/.test(u)) said.push("uploads " + u + ", a path of the checkout");
  const at = n => code.indexOf("- name: " + n + "\n");
  const fetch = at("the pin, from the public engine remote"), clean = at("the tree reads clean"), shard = at("the shard");
  const cleanStep = clean >= 0 ? code.slice(clean, shard > clean ? shard : undefined) : "";
  if (!(fetch >= 0 && clean > fetch && shard > clean)) said.push("no step \"the tree reads clean\" between the fetch and the shard");
  else if (!/status --porcelain --untracked-files=normal/.test(cleanStep) || !/ls-files -v/.test(cleanStep) || !/\bexit 1\b/.test(cleanStep))
    said.push("the clean step does not read the tree as gitTree does, or does not stop");
  check(!said.length, "as9 the area job writes nothing into the checkout (" + targets.length + " tee or > target(s) under HOSTED_LOGS, "
    + uploads.length + " upload path(s) under runner.temp), and the tree is read clean after the fetch and before the shard"
    + (said.length ? ": " + said.join("; ") : ""));
}
console.log("#counts checks=" + checks + " failed=" + failed + " expected=" + EXPECTED);
console.log(failed ? "RESULT: FAIL " + failed + " of " + checks : "RESULT: ok " + checks + " check(s)");
process.exit(failed ? 1 : checks === EXPECTED ? 0 : 78);
