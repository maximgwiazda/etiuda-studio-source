/* STUDIO OFFERS THE PROVIDERS' SIGN-IN BUTTONS ONLY AT THE DOOR AND IN ACCOUNT (board 1016, item 4; Max, 2026-11-20 14:53:
 * "I agree with 3, 4, and 8", the shortlist's 5: "the door and Account, every other place one line that opens the door").
 *
 *     node tests/sign-in-places.mjs
 *
 * Source scan of ui/app.js, by function: signInButtons( is called only from the door's and Account's functions, and the
 * signed-in re-ask ("Sign in again below.") is written once, for Account and the administrator's card alike. Every other
 * place is a line whose one button is data-act="door-open" (the rail foot, signInBeside, the licence cover's row, the
 * door's Back), which this leg also holds by counting the provider presses outside those functions: none.
 * Checks sp1 to sp4, EXPECTED below.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8").split("\n");
const EXPECTED = 4;
let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
/** The name of the 2-space-indented function a line sits in. */
const fnAt = (i) => { for (let k = i; k >= 0; k--) { const m = /^  (?:async )?function ([A-Za-z0-9_]+)/.exec(src[k]); if (m) return m[1]; } return ""; };
const callers = (re) => [...new Set(src.map((l, i) => (re.test(l) && !/^\s*(?:\/\*|\*|\/\/)/.test(l) && !/^  function /.test(l) ? fnAt(i) : null)).filter(Boolean))].sort();
const OK = ["acctReaskHtml", "acctTopHtml", "doorHtml"];

const btnCallers = callers(/signInButtons\(/);
check(btnCallers.every((f) => OK.indexOf(f) >= 0) && btnCallers.indexOf("doorHtml") >= 0 && btnCallers.indexOf("acctTopHtml") >= 0,
  "sp1 the provider buttons are drawn only by the door and Account's functions: " + btnCallers.join(","));
const press = callers(/data-act="lic-signin"/);
check(press.every((f) => ["signInButtons", "acctTopHtml", "doorHtml"].indexOf(f) >= 0),
  "sp2 a provider is pressed only from the buttons' own function, the door's and Account's Use another account: " + press.join(","));
const again = src.filter((l) => /Sign in again below\./.test(l)).length;
check(again === 1, "sp3 the signed-in re-ask is written once, for Account and the administrator's card: " + again);
const asks = callers(/acctReaskHtml\(/);
check(asks.indexOf("acctTopHtml") >= 0 && asks.indexOf("adminTopHtml") >= 0,
  "sp4 both Account's card and the administrator's card draw it through the one helper: " + asks.join(","));

process.stdout.write("sign-in-places: " + asserted + " asserted, " + failed + " failed\n");
if (failed || asserted !== EXPECTED) { process.stderr.write("EXPECTED " + EXPECTED + "\n"); process.exit(1); }
