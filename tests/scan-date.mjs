/* THE FIXTURES' SCAN DATE IS THE HOOK'S (2026-10-13).
 *
 *     node tests/scan-date.mjs
 *
 * tools/fixtures/generate.mjs and workbook.mjs run tools/pre-commit over what they write, with
 * ETIUDA_SCAN_OFF set to "today" so that, where the name list is missing, the name half stands down
 * for that one command instead of refusing. The hook takes the variable only when it equals
 * `date +%F` in its own shell, the local date. The tools set it to the UTC date, so wherever the list
 * was missing every fixture was refused from midnight to 02:00 Warsaw time, and every leg that
 * generates fixtures went red (found by a subagent of the lead engineer, 2026-10-13).
 *
 * A LEG THAT FAILS AT ANY HOUR, NOT ONLY AT MIDNIGHT. The two tools run in a lab that holds no
 * name list, once with TZ=AAA-14 and once with TZ=AAA+14, POSIX zones the hook's shell honours.
 * Their local dates are 28 hours apart, so they are never the same date, and at any moment at least
 * one of them differs from the UTC date. A tool that sends the UTC date is refused in that arm; a
 * tool that sends the shell's date is taken in both. sd1 says the lab really is that state; sd2 and
 * sd3 are the two tools; sd4 is the control, the UTC reading put back in a copy of generate.mjs,
 * refused in at least one arm, so sd2's teeth are shown on every run.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ZONES = ["AAA-14", "AAA+14"];

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "studio-scan-date-"));
try {
  const lab = path.join(tmp, "lab");
  fs.mkdirSync(path.join(lab, "tools", "fixtures"), { recursive: true });
  for (const f of ["tools/pre-commit", "tools/fixtures/generate.mjs", "tools/fixtures/workbook.mjs"])
    fs.copyFileSync(path.join(ROOT, f), path.join(lab, f));
  fs.writeFileSync(path.join(lab, ".etiuda-scan-mode"), "no-catalog\n");
  /* Nothing of the caller's git reaches the lab, as in tests/release.mjs: a GIT_DIR, GIT_INDEX_FILE
     or GIT_WORK_TREE inherited from whatever runs this would point the lab's git, and the tools'
     hook, at another repository, which Clément ρ's read showed: a decoy's staged mode file was
     overwritten and the leg still passed. */
  const base = Object.assign({}, process.env);
  for (const k of ["GIT_DIR", "GIT_INDEX_FILE", "GIT_WORK_TREE"]) delete base[k];
  const git = (...a) => spawnSync("git", ["-c", "core.autocrlf=false", ...a], { cwd: lab, encoding: "utf8", env: base });
  git("init", "-q");
  git("add", ".etiuda-scan-mode");
  const listAt = path.join(lab, String(git("rev-parse", "--git-common-dir").stdout).trim(), "etiuda-names");

  const env = zone => Object.assign({}, base, { TZ: zone });
  const shellDate = zone => String(spawnSync("sh", ["-c", "date +%F"], { encoding: "utf8", env: env(zone) }).stdout).trim();
  const utc = new Date().toISOString().slice(0, 10);
  const dates = ZONES.map(shellDate);
  check(!fs.existsSync(listAt) && /^\d{4}-\d\d-\d\d$/.test(dates[0]) && /^\d{4}-\d\d-\d\d$/.test(dates[1])
        && dates[0] !== dates[1] && (dates[0] !== utc || dates[1] !== utc),
    "sd1 the lab holds no name list, and the hook's shell dates under " + ZONES.join(" and ") + " are " + dates.join(" and ")
    + ", never one date, and at least one is not the UTC date " + utc);

  const gen = (file, zone, out) => spawnSync(process.execPath, [file, "--seed", "7", "--rows", "4", "--out", out],
    { cwd: lab, encoding: "utf8", env: env(zone) });
  const book = (zone, out) => spawnSync(process.execPath, ["tools/fixtures/workbook.mjs", "--seed", "11", "--out", out],
    { cwd: lab, encoding: "utf8", env: env(zone) });

  const g = ZONES.map((z, i) => gen("tools/fixtures/generate.mjs", z, path.join(tmp, "gen" + i)));
  check(g.every(r => r.status === 0 && /content scan clean/.test(r.stdout)),
    "sd2 generate.mjs writes and scans clean in both zones with no list: exit " + g.map(r => r.status).join(" and "));

  const w = ZONES.map((z, i) => book(z, path.join(tmp, "book" + i)));
  check(w.every(r => r.status === 0 && /scan clean/.test(r.stdout)),
    "sd3 workbook.mjs writes and scans clean in both zones with no list: exit " + w.map(r => r.status).join(" and "));

  const genSrc = fs.readFileSync(path.join(lab, "tools/fixtures/generate.mjs"), "utf8");
  const NOW = "const today = hookToday(process.env);";
  const old = path.join(lab, "tools/fixtures/generate-utc.mjs");
  fs.writeFileSync(old, genSrc.split(NOW).join("const today = new Date().toISOString().slice(0, 10);"));
  const o = ZONES.map((z, i) => gen("tools/fixtures/generate-utc.mjs", z, path.join(tmp, "old" + i)));
  check(genSrc.split(NOW).length === 2 && o.some(r => r.status === 4 && /needs its list/.test(r.stderr)),
    "sd4 control: with the UTC date put back, generate.mjs is refused in at least one zone for want of the list: exit "
    + o.map(r => r.status).join(" and "));
} finally {
  try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 3 }); } catch (e) { /* held */ }
}

console.log("#counts checks=" + asserted + " failed=" + failed);
console.log("scan-date: " + asserted + " check(s), " + failed + " failure(s)");
process.exit(failed ? 1 : 0);
