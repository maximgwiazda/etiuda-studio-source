/* settle-note: settleOn's unmet bound is seen, not fatal (the test architect's read, 2026-11-03 11:39).
 *   sn1  a stand-in page whose condition never holds: settleOn returns { met: false } at its bound, never throws
 *   sn2  it prints one line, NOTE settleOn unmet <file:line> <condition>, naming this file and the condition
 *   sn3  a condition that holds returns { met: true } and prints nothing
 * Node only. No window. */
import { settleOn } from "./press.mjs";

let failed = 0, asserted = 0;
const check = (ok, what) => { asserted++; if (!ok) failed++; process.stdout.write((ok ? "  ok   " : "  FAIL ") + what + "\n"); };
const heard = [];
const write = process.stdout.write.bind(process.stdout);
const listen = () => { heard.length = 0; process.stdout.write = (s) => { heard.push(String(s)); return true; }; };
const stop = () => { process.stdout.write = write; };

const never = { evaluate: async () => false };
listen();
let r = null, threw = false;
try { r = await settleOn(never, "document.querySelector('#never')", { bound: 120 }); } catch (e) { threw = true; }
stop();
check(!threw && r && r.met === false && r.ms >= 120, "sn1 a condition that never holds returns met:false at the bound, without throwing");
const notes = heard.filter((l) => l.indexOf("NOTE settleOn unmet ") === 0);
check(notes.length === 1 && /settle-note\.mjs:\d+ /.test(notes[0]) && notes[0].indexOf("document.querySelector('#never')") > 0,
  "sn2 one NOTE line names this file and line, and the condition");

const ready = { evaluate: async () => true };
listen();
const r2 = await settleOn(ready, "true", { bound: 120 });
stop();
check(r2.met === true && heard.length === 0, "sn3 a condition that holds returns met:true and prints nothing");

process.stdout.write("settle-note  " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
