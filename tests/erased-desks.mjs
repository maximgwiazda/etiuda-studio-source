/* AN ERASED PERSON'S DESKS LEAVE THE LEAD'S TEAMS (section 13 of the licence design; Claude alpha's ruling of 2026-11-13 22:32: "The
 * lead's Studio takes an erased person's desks off its teams by itself at its next check, with nobody pressing ... and the lead is told
 * once, on Desks, that a person removed their data and their desks left the team, with how many").
 *
 *     node tests/erased-desks.mjs
 *
 * src/erased-desks.mjs is driven with stand-in teams and a stand-in removal; shell/main.js is read as text for its wiring, since the
 * check runs inside the shell. No network, no team file, no window.
 *
 *   ed1  with the lead doing nothing: a check naming a desk takes it off every team this Studio leads that lists it, by the shell's own
 *        removal, from the check the schedule runs, and leaves the Desks screen a count to say
 *   ed2  once: the next check, the desk let back in, takes nothing; a removal that failed is tried again at the next check; the count
 *        is said once
 *   ed3  an ordinary removal is unchanged: no desk named, nothing taken off; the Remove press's code is as it was
 *   ed4  a Studio closed for a week does it at its first check: the first check after a start runs the step, and the step reads no clock
 *   ed5  plants: each guard planted out in a copy turns its leg red; the real files are unchanged
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MODULE = path.join(ROOT, "src", "erased-desks.mjs");
const SHELL = path.join(ROOT, "shell", "main.js");
const SCRATCH = path.join(ROOT, "scratch", "erased-desks-legs");
const EXPECTED = 4 + 7;
/* The Remove press's code (the member-remove handler and removeDeskNow), as it stood before this build (Studio d8259b8e). A deliberate
   change to Remove moves it here in the same commit. Moved at the held integration (Studio f54755c6): main's project wall reads the
   handler's folder through projectDir(dir) in place of String(dir || ""), three times, and nothing else of the block changed. Moved
   again at A-S5 (Studio's shared-folder syncer out): removeDeskNow no longer reads a folder team's share first, waits for a fresh
   listing of it or waits for the share to take the removal, and nothing else of the block changed. */
/* Fold 97: the remove-all piece (si57r) changed the Remove press on purpose (a refused desk no longer stops the rest; REMOVAL_PARTIAL);
   the erased-desks rule stands: nothing of erasing reaches that block. WAS: 98abcc357ece221a9f54c647def195ee1e32b90be075e179ba52119c6b3649b3 */
/* Fold 98: the relay door piece moved the service to after a removal that landed (the unplace pass, waited last), and the code door
   left with the folder join; the erased-desks rule stands: nothing of erasing reaches that block. WAS: 2db00c8af634dbf2d59971a0d6ab843103ced3d1fa7d1668e451783649a09abe */
const REMOVE_SHA = "5c8bfa6e0ee17e66d051b3e0bd978fb2b3ff95a96d6eb22f898b6072ce8ef749";

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const key = label => sha("desk\n" + label);
const K1 = key("one"), K2 = key("two"), K3 = key("three");
const teamsOf = () => [
  { team: "t-aaaaaaaaaaaaaaaa", folder: "A", roster: [{ deskId: "k-1111111111111111", public: K1 }, { deskId: "k-2222222222222222", public: K2 }] },
  { team: "t-bbbbbbbbbbbbbbbb", folder: "B", roster: [{ deskId: "k-1111111111111111", public: K1 }, { deskId: "k-3333333333333333", public: K3 }] },
];
/** A removal standing in for the shell's: records each call; `fail` names members whose removal does not land. */
function remover(fail) {
  const calls = [];
  return { calls, remove: async (team, folder, member) => { calls.push(team + "/" + member); return (fail || []).includes(member) ? { error: "offline" } : { removed: true }; } };
}
/** The shell's text between two anchors, or "" where either is missing. */
function between(text, from, to) {
  const a = text.indexOf(from), b = a < 0 ? -1 : text.indexOf(to, a + from.length);
  return a < 0 || b < 0 ? "" : text.slice(a, b + to.length);
}
const removeBlock = t => { const a = t.indexOf('answer("studio:member-remove"'); const r = t.indexOf("async function removeDeskNow(", a); const e = t.indexOf("\n}\n", r);
  return a < 0 || r < 0 || e < 0 ? "" : t.slice(a, e + 3); };

async function legs(E, shellText) {
  const out = {};
  /* ed1 */
  {
    const R = remover();
    const r = await E.takeOffErased([K1], { done: [], teams: async () => teamsOf(), remove: R.remove });
    const step = between(shellText, "async function licenceStep(", "\n}\n");
    const wired = /const got = await C\.take\(a, [^\n]*\n[\s\S]*if \(Array\.isArray\(a\.erased\)\) await erasedStep\(a\.erased\);/.test(step);
    const erased = between(shellText, "async function erasedStep(", "\n}\n");
    const usesRemove = /takeOffErased\(erased, \{[\s\S]*remove: \(team, dir, member\) => teamAct\(team, \(\) => removeDeskNow\(dir, team, member\)\)/.test(erased)
      && /cur\.erasedLeft = E\.leftAfter\(cur\.erasedLeft, r\.left\);/.test(erased);
    const told = /const told = \(await erasedLib\(\)\)\.leftTaken\(readStore\(\)\.erasedLeft, withLicence\.team\.id\);\n\s*if \(told\.count\) \{[^\n]*withHit\.erasedLeft = told\.count; \}/.test(shellText);
    out.ed1 = R.calls.join() === "t-aaaaaaaaaaaaaaaa/k-1111111111111111,t-bbbbbbbbbbbbbbbb/k-1111111111111111"
      && JSON.stringify(r.left) === JSON.stringify({ "t-aaaaaaaaaaaaaaaa": 1, "t-bbbbbbbbbbbbbbbb": 1 }) && r.done.length === 2 && wired && usesRemove && told;
    check(out.ed1, "ed1 with the lead doing nothing, a check naming a desk takes it off both teams that list it, by the shell's removal, from the"
      + " quiet check's own step, and leaves the Desks screen a count: " + JSON.stringify({ calls: R.calls, left: r.left, wired, usesRemove, told }));
  }
  /* ed2 */
  {
    const R = remover(["k-1111111111111111"]);
    const first = await E.takeOffErased([K1, K3], { done: [], teams: async () => teamsOf(), remove: R.remove });
    const R2 = remover();
    const second = await E.takeOffErased([K1, K3], { done: first.done, teams: async () => teamsOf(), remove: R2.remove });
    const R3 = remover();
    const third = await E.takeOffErased([K1, K3], { done: second.done, teams: async () => teamsOf(), remove: R3.remove });
    const held = E.leftAfter(E.leftAfter({}, first.left), second.left);
    const once = E.leftTaken(held, "t-bbbbbbbbbbbbbbbb"), again = E.leftTaken(once.rest, "t-bbbbbbbbbbbbbbbb");
    out.ed2 = JSON.stringify(first.left) === JSON.stringify({ "t-bbbbbbbbbbbbbbbb": 1 })
      && R2.calls.join() === "t-aaaaaaaaaaaaaaaa/k-1111111111111111,t-bbbbbbbbbbbbbbbb/k-1111111111111111" && R3.calls.length === 0
      && once.count === 2 && again.count === 0 && JSON.stringify(once.rest) === JSON.stringify({ "t-aaaaaaaaaaaaaaaa": 1 });
    check(out.ed2, "ed2 once: a removal that did not land is tried at the next check, one that landed is not made again though the desk is listed"
      + " again, and the Desks screen's count is said once: " + JSON.stringify({ first: R.calls, second: R2.calls, third: R3.calls, once, again }));
  }
  /* ed3 */
  {
    const R = remover();
    const none = await E.takeOffErased(undefined, { done: ["t-aaaaaaaaaaaaaaaa:" + K2], teams: async () => teamsOf(), remove: R.remove });
    const empty = await E.takeOffErased([], { done: [], teams: async () => teamsOf(), remove: R.remove });
    const block = removeBlock(shellText);
    out.ed3 = R.calls.length === 0 && none.done.length === 0 && empty.done.length === 0 && sha(block) === REMOVE_SHA && block.indexOf("erased") < 0;
    check(out.ed3, "ed3 an ordinary removal is unchanged: with no desk named nothing is taken off, and the Remove press's code is the one it was: "
      + JSON.stringify({ calls: R.calls.length, remove: sha(block).slice(0, 12) }));
  }
  /* ed4 */
  {
    const arm = between(shellText, "function armLicenceCheck() {", "\n}\n");
    const first = /setTimeout\(\(\) => \{ licenceOnce\(false\); \}, LICENCE_FIRST_MS\)/.test(arm);
    const src = fs.readFileSync(MODULE, "utf8");
    const clockless = !/Date\.now|new Date|performance\.now/.test(src);
    out.ed4 = first && clockless;
    check(out.ed4, "ed4 a Studio closed for a week does it at its first check: the first check after a start runs the step (the service names the"
      + " desks for thirty days), and the step reads no clock: " + JSON.stringify({ first, clockless }));
  }
  return out;
}

async function main() {
  const shellText = fs.readFileSync(SHELL, "utf8");
  const before = [sha(fs.readFileSync(MODULE)), sha(shellText)];
  await legs(await import(pathToFileURL(MODULE).href), shellText);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const modText = fs.readFileSync(MODULE, "utf8");
  const PLANTS = [
    ["module", "erased-once", "if (want.has(pub) && !was.has(mark))", "if (want.has(pub))", "ed2"],
    ["module", "erased-landed", "    if (!reply || reply.error || reply.removed !== true) continue; /* plant:erased-landed */\n", "", "ed2"],
    ["module", "erased-told-once", "  delete rest[team]; /* plant:erased-told-once */\n", "", "ed2"],
    ["shell", "erased-step", "  if (Array.isArray(a.erased)) await erasedStep(a.erased); /* plant:erased-step */\n", "", "ed1"],
    ["shell", "erased-kept", "    cur.erasedLeft = E.leftAfter(cur.erasedLeft, r.left); /* plant:erased-kept */\n", "", "ed1"],
    ["shell", "erased-told", "withHit.erasedLeft = told.count; } /* plant:erased-told */", "} /* told nothing */", "ed1"],
    ["shell", "remove-changed", "    let reply = await removeDeskNow(project, named, first);", "    let reply = await removeDeskNow(project, named, first, true);", "ed3"],
  ];
  let n = 0;
  /* Under ETIUDA_PLANTS=off the plants are not run, as every inline plant proof here (tests/plant-hold.mjs pk-off). */
  /* Each plant not run is a skip counted toward EXPECTED, so the file reads complete under ETIUDA_PLANTS=off (4 checks and 7 skips)
     as with plants (11 checks); one check(true) in their place made it 5 of 11 and exit 78 (Claudius theta'''', 2026-11-14). */
  if (process.env.ETIUDA_PLANTS === "off") for (const p of PLANTS) { skipped++; process.stdout.write("  SKIP ed5 plant " + p[1] + " (ETIUDA_PLANTS=off)\n"); }
  for (const [where, name, from, to, leg] of process.env.ETIUDA_PLANTS === "off" ? [] : PLANTS) {
    const text = where === "module" ? modText : shellText;
    let turned = false, why = "";
    if (text.split(from).length !== 2) why = "the planted line is not there once";
    else {
      const edited = text.split(from).join(to);
      let E = await import(pathToFileURL(MODULE).href), shell = shellText;
      if (where === "module") {
        const at = path.join(SCRATCH, "plant-" + (++n) + ".mjs");
        fs.writeFileSync(at, edited);
        E = await import(pathToFileURL(at).href);
      } else shell = edited;
      const quiet = { write: process.stdout.write.bind(process.stdout), err: process.stderr.write.bind(process.stderr) };
      const counts = [asserted, failed];
      process.stdout.write = () => true; process.stderr.write = () => true;
      try { const got = await legs(E, shell); turned = got[leg] === false; } catch (e) { why = String(e && e.message || e); }
      finally { process.stdout.write = quiet.write; process.stderr.write = quiet.err; asserted = counts[0]; failed = counts[1]; }
    }
    check(turned, "ed5 plant " + name + " turns " + leg + " red" + (why ? ": " + why : ""));
  }
  const after = [sha(fs.readFileSync(MODULE)), sha(fs.readFileSync(SHELL, "utf8"))];
  try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch { /* the leg's own scratch */ }
  if (after.join() !== before.join()) check(false, "ed5z the real files changed during the plants");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted + skipped !== EXPECTED) { process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + "\n"); process.exit(78); }
  process.stdout.write("erased-desks: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main().catch(e => { process.stderr.write("erased-desks: REFUSED " + (e && e.stack ? e.stack : e) + "\n"); process.exit(1); });
