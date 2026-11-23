/* THE SIGNING KEY'S ACTS HAVE ONE HOME IN SETTINGS, AND THE CORNER'S BUTTON (board 1016, item 5; Max, 2026-11-20 14:53:
 * "I agree with 3, 4, and 8", the shortlist's 6: "the corner button and one home in Settings, the other places say the
 * state and link there").
 *
 *     node tests/key-places.mjs
 *
 * Source scan of ui/app.js, by function. Make, restore and back up are pressed from the Settings row (signingRowHtml, with
 * keyLinesHtml and keyMakeActs, which only it calls), from the corner's disc and the landing's one-time nudge, and from the
 * covers those open; the team screen (desksBodyHtml) and the publish cover (coverHtml) say the state and offer one press,
 * "Signing key settings" (key-settings), which opens Settings at Teams and keys. Account's Carry on from another computer
 * is its own job (the key and then the share), and stays. Checks kp1 to kp6, EXPECTED below.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8").split("\n");
const EXPECTED = 6;
let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const fnAt = (i) => { for (let k = i; k >= 0; k--) { const m = /^  (?:async )?function ([A-Za-z0-9_]+)/.exec(src[k]); if (m) return m[1]; } return ""; };
const code = (l) => !/^\s*(?:\/\*|\*|\/\/)/.test(l);
const inFns = (re) => [...new Set(src.map((l, i) => (re.test(l) && code(l) && !/^  function keyMakeActs/.test(l) ? fnAt(i) : null)).filter(Boolean))].sort();

const mk = inFns(/keyMakeActs\(/);
check(mk.join(",") === "signingRowHtml", "kp1 keyMakeActs, which holds Make and Restore, is drawn only by the Settings row: " + mk.join(","));
const lit = inFns(/data-act="key-(make|restore|backup)"/);
check(lit.every((f) => ["keyMakeActs", "keyLinesHtml", "signingRowHtml", "keyCoverHtml", "prLanded"].indexOf(f) >= 0),
  "kp2 no other function writes a press of Make, Restore or Back up (the team screen and the publish cover are not among them): " + lit.join(","));
const lines = src.filter((l, i) => /keyLinesHtml\(/.test(l) && code(l) && fnAt(i) === "desksBodyHtml");
check(lines.length === 1 && /keyLinesHtml\(S\.host\.signing, true, true\)/.test(lines[0]),
  "kp3 the team screen's key line is drawn with no press of its own: " + lines.length);
const link = [...new Set(src.map((l, i) => (/keySettingsBtn()/.test(l) && code(l) && !/^  const keySettingsBtn/.test(l) && !/linkOnly ? /.test(l) ? fnAt(i) : null)).filter(Boolean))];
check(link.indexOf("desksBodyHtml") >= 0 && link.indexOf("coverHtml") >= 0,
  "kp4 the team screen and the publish cover each carry the one link to Settings: " + link.join(","));

const h = loadPage({ api: {}, uiLang: "en" }), P = h.page;
let opened = 0;
P.ACTS.settings = async () => { opened++; };
P.S.sx = { sec: "all", q: "x" };
if (P.ACTS["key-settings"]) await P.ACTS["key-settings"]();
check(opened === 1 && P.S.sx.sec === "teams" && P.S.sx.q === "", "kp5 the link opens Settings at Teams and keys: " + JSON.stringify([opened, P.S.sx]));
const pl = loadPage({ api: {}, uiLang: "pl" });
check(fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8").indexOf('"Signing key settings": "') > 0 && !!pl,
  "kp6 the link's words have their Polish pair");

process.stdout.write("key-places: " + asserted + " asserted, " + failed + " failed\n");
if (failed || asserted !== EXPECTED) { process.stderr.write("EXPECTED " + EXPECTED + "\n"); process.exit(1); }
