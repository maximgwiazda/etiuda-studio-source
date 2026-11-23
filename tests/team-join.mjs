/* THE LEAD'S CODE DOOR IS GONE (folder removal P2; board 1017: "no sign-in code is shown, typed or sent anywhere"; Max, 2026-11-22 15:37, of
 * the shared folder: "remove it, burn it with fire").
 *
 *     node tests/team-join.mjs        exit code is the number of failed checks, capped at 63
 *
 * This file once drove the lead's side of a desk asking to join by a shared folder: Open the request (tj3), the six digits the desk showed (tj4),
 * the code typed with its space (tj5 to tj11, tj13, tj15, tj16, tjW), the file of openings the lead signed (tjS1 to tjS4, tjR), Admit all (tj13),
 * the refusal read by the desk (tj12), the old request of a removed member (tj17, tj18) and the screen's rows (tj2 to tj2c, tjK, tj14). All of it
 * held the folder's join, which the desk no longer reads or writes (engine fold P2: no desk reads a file of openings, a code or a request made in
 * a share), so it is retired whole, each id by its old sentence in the commit that did it. What it holds now is that the door stays gone, from the
 * sources Studio ships, and tests/team-desks.mjs td4h holds what the screen draws in its place.
 *
 * ids: tjg1 the join module and the thread's exports; tjg2 the shell's verbs; tjg3 the page; tjg4 the words; tjg5 the pin's slices and the
 * invitation Studio makes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = 5;
let asserted = 0, failed = 0;
function check(ok, line) { asserted++; if (ok) console.log("  ok   " + line); else { failed++; console.log("  FAIL " + line); } }
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");

const Join = await import(pathToFileURL(path.join(ROOT, "src", "join.mjs")).href);
const Studio = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
const gone = ["openJoin", "admitByCode", "settleJoins", "openDeskJoin", "admitDesks"];
check(gone.every(n => !(n in Join) && !(n in Studio)) && typeof Join.listJoins === "function" && typeof Join.admitWaiting === "function"
  && typeof Join.relayAsk === "function" && typeof Studio.refuseDeskJoin === "function",
  "tjg1 no join module and no thread verb opens a request or admits by a code, and the watch's admission, the listing, the relay's read and the refusal stand: present "
  + JSON.stringify(gone.filter(n => n in Join || n in Studio)));

const SHELL = read("shell", "main.js"), PRELOAD = read("shell", "preload.js");
check(!/studio:desk-open|studio:desk-admit|"openDeskJoin"|"admitDesks"/.test(SHELL) && !/deskOpen|deskAdmit|desk-open|desk-admit/.test(PRELOAD)
  && /studio:desk-refuse/.test(SHELL) && /deskRefuse/.test(PRELOAD),
  "tjg2 the shell answers no desk-open and no desk-admit and the preload hands the page neither, and Refuse is still answered");

const APP = read("ui", "app.js"), INDEX = read("ui", "index.html");
const left = ["stk-code", "stkCode", "data-code", "desk-admit", "desk-open", "deskTyped", "deskAsk(", "dkTyped", "doorJoin", "deskAdmit", "deskOpen"]
  .filter(w => APP.indexOf(w) >= 0);
check(left.length === 0 && INDEX.indexOf("stk-code") < 0 && !/kind: "join"/.test(APP),
  "tjg3 the page has no code field on the Desks screen, none on the Review stack, no join card, no Admit, no Open the request and no state kept for what was typed: left " + JSON.stringify(left));

const LANG = read("ui", "lang.js");
const words = ["Open the request", "The code the agent reads out", "Admit all", "Waiting for the teammate to answer", "by request, with its code",
  "Type the code the teammate's desk shows, then Enter to admit", "Every teammate asks to join again and is let in by its code.",
  "A colleague who signs in on a desk is shown a code, and a lead adds them by it on the Team screen.", "The code does not match this teammate's."];
const said = words.filter(w => LANG.indexOf(JSON.stringify(w) + ":") >= 0 || APP.indexOf(JSON.stringify(w)) >= 0);
check(said.length === 0 && LANG.indexOf("A colleague who signs in on a desk waits for a lead to add them, by email address or from the Team screen's list.\":") >= 0
  && LANG.indexOf("Every teammate is invited to the new team again.\":") >= 0,
  "tjg4 no line of the code door is in the page or its table, and the two lines that said it untrue are rewritten in both languages (placeholder words, for the copywriter): said " + JSON.stringify(said));

const Engine = await import(pathToFileURL(path.join(ROOT, "src", "engine.mjs")).href);
const Invite = await import(pathToFileURL(path.join(ROOT, "src", "invite.mjs")).href);
const ENGINE_SRC = read("src", "engine.mjs");
const sliced = ["function joinCode(", "function inviteCode("].filter(d => ENGINE_SRC.indexOf('"' + d + '"') >= 0);
let invRules = null, joinRules = null;
try { invRules = Engine.inviteRules(); joinRules = Engine.joinRules(); } catch { /* a pin that does not slice is its own leg's */ }
const made = typeof Invite.makeInvite === "function" ? null : "no makeInvite";
check(sliced.length === 0 && !!invRules && !("inviteCode" in invRules) && !!joinRules && !("joinCode" in joinRules) && made === null
  && !/inviteCode\(/.test(read("src", "invite.mjs")),
  "tjg5 Studio slices neither joinCode nor inviteCode out of the pinned engine, and the invitation it makes carries no check code: still sliced " + JSON.stringify(sliced));

console.log("#counts checks=" + asserted + " skipped=0 failed=" + failed + " expected=" + EXPECTED);
if (asserted < EXPECTED) { console.log("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran"); process.exit(78); }
console.log(failed ? "  RESULT: FAIL " + failed + " of " + asserted : "  RESULT: ok " + asserted + " check(s)");
process.exit(Math.min(failed, 63));
