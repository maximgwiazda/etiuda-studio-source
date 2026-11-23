/* A shell that does not start is a red line and exit 1. The wall stays exit 78.
   The door's two start sentences are the ones that take that line; a page that never
   finished, and a window with no page, are later faults and stay where they were. */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { shellStartFailure } from "./shell-door.mjs";
import { envWithoutWindowWord } from "./window-wall.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

let failed = 0;
function check(cond, line) {
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

const portMsg = "the window never wrote a debugging port into its own user-data folder within 20 s";
const answerMsg = "the window recorded port 9 and then did not answer on it";
check(shellStartFailure(new Error(portMsg)) === portMsg
  && shellStartFailure(new Error(answerMsg)) === answerMsg
  && shellStartFailure(new Error("opened a window that never published window.STUDIO_READY")) === ""
  && shellStartFailure(new Error("connected to the window and it has no page")) === "",
  "only a missing debugging port is a shell that did not start");

const dieSrc = "import { shellDidNotStart } from " + JSON.stringify(pathToFileURL(path.join(HERE, "shell-door.mjs")).href) + ";\n"
  + "shellDidNotStart(\"port closed\\nsecond line\");\n";
const die = spawnSync(process.execPath, ["--input-type=module", "-e", dieSrc], { encoding: "utf8" });
const dieLines = String(die.stdout || "").split(/\r?\n/).filter(Boolean);
check(die.status === 1 && dieLines.length === 1 && dieLines[0] === "SHELL DID NOT START: port closed second line",
  "a shell that does not start exits 1 with one line: exit " + die.status + " " + JSON.stringify(dieLines));

const wallDir = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-shell-start-"));
const wallFile = path.join(wallDir, "wall.mjs");
fs.writeFileSync(wallFile, [
  "const wall = (await import(" + JSON.stringify(pathToFileURL(path.join(HERE, "window-wall.mjs")).href) + "))['window' + 'Wall'];",
  "wall('tests/shell-did-not-start.mjs');",
  "",
].join("\n"));
const wallEnv = envWithoutWindowWord(process.env);
const wall = spawnSync(process.execPath, [wallFile], { encoding: "utf8", env: wallEnv });
const wallOut = String(wall.stdout || "") + String(wall.stderr || "");
check(wall.status === 78 && wallOut.indexOf("SHELL DID NOT START") < 0 && wallOut.indexOf("SUITE DID NOT COMPLETE") >= 0,
  "the window wall still exits 78 and does not say the shell failed to start: exit " + wall.status);

const doorHref = JSON.stringify(pathToFileURL(path.join(HERE, "shell-door.mjs")).href);
const lab = path.join(wallDir, "lab");
fs.mkdirSync(lab);
const standFile = path.join(wallDir, "stand.mjs");
fs.writeFileSync(standFile, [
  "import { shellDidNotStart } from " + doorHref + ";",
  "import fs from 'node:fs';",
  "const lab = process.argv[2];",
  "try {",
  "  shellDidNotStart('the window recorded port 9 and then did not answer on it');",
  "} finally {",
  "  try { fs.rmSync(lab, { recursive: true, force: true }); } catch (e) {}",
  "  console.log('#counts checks=0 failed=0');",
  "  const door = await import(" + doorHref + ");",
  "  const marked = typeof door.shellStartFailed === 'function' && door.shellStartFailed();",
  "  process.exit(marked ? 1 : 78);",
  "}",
  "",
].join("\n"));
const stood = spawnSync(process.execPath, [standFile, lab], { encoding: "utf8", timeout: 20000 });
const stoodOut = String(stood.stdout || "");
const labGone = !fs.existsSync(lab);
check(stood.status === 1 && labGone && stoodOut.indexOf("#counts ") >= 0 && stoodOut.indexOf("SHELL DID NOT START:") >= 0,
  "a stand-in whose shell never answers leaves no temp folder, prints its counts and exits 1: exit "
  + stood.status + ", gone " + labGone + ", " + JSON.stringify(stoodOut.trim().slice(0, 400)));

const caughtFile = path.join(wallDir, "caught.mjs");
fs.writeFileSync(caughtFile, [
  "import { shellDidNotStart } from " + doorHref + ";",
  "try {",
  "  shellDidNotStart('the window recorded port 9 and then did not answer on it');",
  "} catch (e) {",
  "  process.exit(2);",
  "}",
  "",
].join("\n"));
const caught = spawnSync(process.execPath, [caughtFile], { encoding: "utf8", timeout: 20000 });
const caughtOut = String(caught.stdout || "");
check(caught.status === 1 && caughtOut.indexOf("SHELL DID NOT START: the window recorded port 9 and then did not answer on it") >= 0,
  "a caller whose catch exits 2 still ends at 1 when the shell did not start: exit " + caught.status
  + " " + JSON.stringify(caughtOut.trim().slice(0, 200)));

try { fs.rmSync(wallDir, { recursive: true, force: true }); } catch (e) { /* the temp folder can wait */ }
process.stdout.write("shell-did-not-start: " + (failed ? failed + " failure(s)" : "ok") + "\n");
process.exit(failed ? 1 : 0);
