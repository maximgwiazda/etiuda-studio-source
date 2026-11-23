/* A SHARE FILE PAST THE DESK'S TEAM-FILE CAP IS NOT READ (board 931, condition 8).
 *
 *     node tests/share-cap.mjs
 *
 * gate-kind: node
 *
 * The pinned shell measures a team file and leaves it unread past 1 MiB. Studio's reader of that
 * file, a conflict sibling, the openings file and a desk's request does the same: one byte over
 * is never read, and a file of exactly 1 MiB is.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Team from "../src/team.mjs";
import * as Join from "../src/join.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NL = "\n";
const CAP = 1024 * 1024;
const EXPECTED = 2;
let asserted = 0, failed = 0;

function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}

function fnBody(src, name) {
  const at = src.indexOf("function " + name + "(");
  if (at < 0) return "";
  const rest = src.slice(at);
  const n = rest.slice(1).search(/\nfunction |\nasync function /);
  return n < 0 ? rest : rest.slice(0, n + 1);
}

const realRead = fs.readFileSync.bind(fs);
const shell = realRead(path.join(ROOT, "shell", "main.js"), "utf8");
const relaySrc = realRead(path.join(ROOT, "src", "relay.mjs"), "utf8");
const teamSrc = realRead(path.join(ROOT, "src", "team.mjs"), "utf8");
const joinSrc = realRead(path.join(ROOT, "src", "join.mjs"), "utf8");

const TEAM_NAME = Engine.teamRules().V2_TEAM_FILE;
const JOINS_NAME = Engine.joinRules().JOINS_NAME;
const DESK = "k-0123456789abcdef";
const stub = { id: "t-0123456789abcdef", epoch: 1, roster: [], lead: { keyId: "lead", public: "ab".repeat(32) } };

function place(dir, bytes) {
  fs.mkdirSync(path.join(dir, "desks", DESK), { recursive: true });
  const files = [
    path.join(dir, TEAM_NAME),
    path.join(dir, TEAM_NAME.replace(/\.json$/i, " (1).json")),
    path.join(dir, JOINS_NAME),
    path.join(dir, "desks", DESK, "join.json"),
  ];
  for (const f of files) fs.writeFileSync(f, bytes);
  return files.map((f) => path.resolve(f));
}

const overDir = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-share-cap-over-"));
const fitDir = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-share-cap-fit-"));
const dirPlace = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-share-cap-dir-"));
fs.mkdirSync(path.join(dirPlace, TEAM_NAME));
const overFiles = place(overDir, Buffer.alloc(CAP + 1, 0x78));
const fitFiles = place(fitDir, Buffer.alloc(CAP, 0x78));
const seen = [];
fs.readFileSync = (p, ...rest) => {
  const abs = path.resolve(String(p));
  if (abs.startsWith(path.resolve(overDir) + path.sep) || abs.startsWith(path.resolve(fitDir) + path.sep) || abs.startsWith(path.resolve(dirPlace) + path.sep)) seen.push(abs);
  return realRead(p, ...rest);
};
/* readWithin reads through one descriptor (the test architect's edit of 931, 2026-11-11), so a read is also a readSync on
   a descriptor opened on one of these files; an open that is refused before any byte is read stays unread. */
const realOpen = fs.openSync.bind(fs);
const realReadSync = fs.readSync.bind(fs);
const realClose = fs.closeSync.bind(fs);
const fdPath = new Map();
const watched = (abs) => [overDir, fitDir, dirPlace].some((d) => abs.startsWith(path.resolve(d) + path.sep));
fs.openSync = (p, ...rest) => {
  const fd = realOpen(p, ...rest);
  const abs = path.resolve(String(p));
  if (watched(abs)) fdPath.set(fd, abs);
  return fd;
};
fs.readSync = (fd, ...rest) => {
  const abs = fdPath.get(fd);
  if (abs && seen.indexOf(abs) < 0) seen.push(abs);
  return realReadSync(fd, ...rest);
};
fs.closeSync = (fd) => { fdPath.delete(fd); return realClose(fd); };

let thrown = "";
let dirCode = "none";
try {
  await Team.readTeam(overDir);
  await Team.readTeam(fitDir);
  Join.listJoins(overDir, stub);
  Join.listJoins(fitDir, stub);
  try { await Team.readTeam(dirPlace); dirCode = "read"; }
  catch (e) { dirCode = e && e.code ? e.code : "throw"; }
} catch (e) {
  thrown = String(e && e.message || e);
} finally {
  fs.readFileSync = realRead;
  fs.openSync = realOpen;
  fs.readSync = realReadSync;
  fs.closeSync = realClose;
  fs.rmSync(overDir, { recursive: true, force: true });
  fs.rmSync(fitDir, { recursive: true, force: true });
  fs.rmSync(dirPlace, { recursive: true, force: true });
}

const readOf = (files) => files.filter((f) => seen.indexOf(f) >= 0);
const overRead = readOf(overFiles);
const fitMissed = fitFiles.filter((f) => seen.indexOf(f) < 0);
const readTeamBody = fnBody(teamSrc, "readTeam");
const closeBody = fnBody(joinSrc, "closeRequest");
const leadBody = fnBody(relaySrc, "mirrorLead");
const epochBody = fnBody(relaySrc, "mirrorEpoch");
const sentBody = fnBody(shell, "relayTeamSent");
const editionBody = fnBody(shell, "relayHoldsEdition");
const readers = readTeamBody.includes("readWithin(") && !readTeamBody.includes("readFileSync")
  && closeBody.includes("readWithin(") && !closeBody.includes("readFileSync")
  && leadBody.includes("teamFileText(") && !leadBody.includes("readFileSync")
  && epochBody.includes("teamFileText(") && !epochBody.includes("readFileSync")
  && sentBody.includes("readWithin(path.join(row.folder, \"etiuda-team.json\"),")
  && editionBody.includes("readWithin(teamPath,");
const ok = overRead.length === 0 && fitMissed.length === 0 && readers && !thrown;

check(ok, "sc1 a team file, its conflict copy, the openings file and a join request are unread past 1 MiB and read at 1 MiB");
if (!ok) {
  process.stderr.write("       over " + JSON.stringify(overRead.map((f) => path.basename(f)))
    + " missed " + JSON.stringify(fitMissed.map((f) => path.basename(f)))
    + " readers " + readers
    + " thrown " + JSON.stringify(thrown) + NL);
}
const dirRead = seen.indexOf(path.resolve(dirPlace, TEAM_NAME)) >= 0;
const dirOk = dirCode === "EISDIR" && !dirRead && !thrown;
check(dirOk, "sc2 a directory standing in for the team file is refused unread");
if (!dirOk) process.stderr.write("       dir " + dirCode + " read " + dirRead + NL);

process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + NL);
if (asserted !== EXPECTED) {
  process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran" + NL);
  process.exitCode = 2;
} else if (failed) process.exitCode = 1;
