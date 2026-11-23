/* THE TEAM FILE'S REVISION AND CHANNEL (board 900, the relay's step 1).
 *
 *     node tests/team-rev.mjs [--keep]
 *
 * THE CLAIM. writeTeam signs `rev`, one higher than the team file it replaces, a file written before revisions counting as
 * 0 and a new epoch counting on, and `channel`, the folder unless withChannel names a relay, whose ring then rides inside
 * the signed file; a channel a desk would not read is refused and nothing is written. What it writes reads whole by the
 * pinned engine's team reader and by the pinned desk's own teamWhole, sliced from its shell. A file of this Studio's own
 * team put back on the share below the floor kept for it at that epoch is refused by heldTeam and said, by the Desks
 * screen's facts and by the switch, and nothing is written over it; the floor outlives the process that kept it. A file
 * whose epoch is below the kept floor is older in the same way, the key number named as below, and a file at the floor's
 * epoch or above is read as today. A plant that puts the old comparison back turns that leg red, and the file comes back
 * by its sha256. A kept copy below the floor, put back by Sealed where the share's file has gone, is refused by writeTeam itself,
 * wherever the team comes from (board 929): the switch says the team file is older and nothing is written, as with an epoch
 * below the floor; a kept copy at the floor's rev, and a newer epoch, are written at the next rev, and a plant that lifts the
 * check turns those legs red; a file of this Studio's own whose rev is not a whole number is refused and said. A file with
 * no revision and no floor kept is held as before. A lead-signed file at a newer epoch with no rev raises the floor to that epoch
 * at rev 0 and never deletes it (board 931, condition 6): the old epoch's file put back after it is still older, held by
 * heldTeam and signed from by nobody, and a plant that puts the deletion back turns that leg red.
 *
 * Invented teams, keys and catalogs only.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile, readKeyFile, unlockKey, signDocument, signCatalog } from "../src/sign.mjs";
import { HEAD_NAME, headOf } from "../src/relay.mjs";
import { writeSpan } from "../src/stats.mjs";
import { writeWhole } from "../src/whole-write.cjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { seatEnv } from "./seated.mjs";
import { olderFolderTeam } from "./older-folder-team.mjs"; /* the folder team is made by the fixture, not by Studio (the folder team's removal) */

const nodeRequire = createRequire(import.meta.url);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
/* Set before the first plant. The child runs from this copy, so its ROOT is the copy. */
let tree = null;
let before = null;
/* The plant's child has its own scratch, so it never clears the scratch this process is already using. */
const ONLY = process.env.TEAM_REV_ONLY === "1";
const SCRATCH = path.join(ROOT, "scratch", ONLY ? "team-rev-plant" : "team-rev");
/* The child skips the checkout check, so its tally stays 20. */
const EXPECTED = ONLY ? 32 : 33;
const NL = String.fromCharCode(10);
const PASS = "a passphrase for the lead's key in this gate";

/* ETIUDA_PLANTS=off (a merge's area run) runs no plant. The pure plant legs, tr2i and tr2k, and the checkout check after the
   plants phase are skipped and counted toward EXPECTED. Legs tr2f and tr3b to tr3g each pair a plant with their own claim
   in one check: under it their plant half is not run, as in the plant's own child (TEAM_REV_ONLY), and their claim is still
   checked. The release profile runs with plants on, so every plant still runs there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const PLANTS_RUN = !ONLY && !PLANTS_OFF;
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + NL);
}
/* A leg whose code is not there yet is a red leg and not a crashed file. */
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); }
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const throwsOn = async (fn) => { try { await fn(); return ""; } catch (e) { return String(e && e.message || e); } };
const caught = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };

/* A whole file at epoch 1, rev 4, after a floor kept at epoch 2, rev 3. The rev is higher, so only the epoch is below.
   The file at that floor, and a file at the next epoch, are read as today. */
async function epochBelowFloor(T, dir, keyAt, lead, open) {
  fs.mkdirSync(dir, { recursive: true });
  const id = "t-" + crypto.randomBytes(8).toString("hex");
  const file = path.join(dir, "etiuda-team.json");
  const sign = async (epoch, rev) => {
    const doc = { format: 1, kind: "etiuda-team", id, catalogs: ["lamp-board"],
      lead, sealed: false, exportsSealed: false, epoch, roster: [], rev, channel: { kind: "folder" } };
    fs.writeFileSync(file, JSON.stringify(await signDocument(doc, { privateKey: open.privateKey, keyId: open.keyId }), null, 1) + NL);
  };
  await sign(2, 3);
  const high = await T.heldTeam(dir, { key: keyAt });
  const floor = T.revFloor(keyAt, id, lead.public);
  await sign(1, 4);
  const before = sha(file);
  const low = await T.heldTeam(dir, { key: keyAt });
  const putBack = sha(file) === before;
  const floorAfter = T.revFloor(keyAt, id, lead.public);
  const said = low.reason.indexOf("key number 1, below 2 at rev 4") >= 0
    && low.reason.indexOf("for team " + id) >= 0
    && low.reason.indexOf("put back on the share and nothing in it is used") >= 0;
  await sign(2, 3);
  const atFloor = await T.heldTeam(dir, { key: keyAt });
  await sign(3, 1);
  const above = await T.heldTeam(dir, { key: keyAt });
  return {
    ok: !!high.team && high.team.epoch === 2 && JSON.stringify(floor) === JSON.stringify({ epoch: 2, rev: 3 })
      && low.team === null && low.older === true && said && putBack
      && JSON.stringify(floorAfter) === JSON.stringify({ epoch: 2, rev: 3 })
      && !!atFloor.team && atFloor.reason === "" && atFloor.older !== true && atFloor.team.epoch === 2 && atFloor.team.rev === 3
      && !!above.team && above.reason === "" && above.older !== true && above.team.epoch === 3 && above.team.rev === 1,
    low, floor, floorAfter, putBack
  };
}

/* Lifts the epoch comparison back to the same-epoch line and runs this file in a child. The child must fail tr2f, and
   this file is put back by its sha256 before the caller goes on. */
function plantEpoch() {
  const at = path.join(tree, "src", "team.mjs");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:tr2f */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0]] = "  const older = !!floor && rev !== null && floor.epoch === t.epoch && rev < floor.rev;";
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL tr2f") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("low held") >= 0 || l.indexOf("#counts") >= 0)
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* Lifts writeTeam's floor check (the line marked plant:tr2i, whose throw then guards nothing) and runs this file in a child.
   The child must fail tr2d and tr2g, and src/team.mjs is put back by its sha256 before the caller goes on. */
function plantFloor() {
  const at = path.join(tree, "src", "team.mjs");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:tr2i */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0]] = "  if (false)";
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL tr2d") >= 0 && said.indexOf("FAIL tr2g") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr2") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* Puts back the old raise, which deleted the floor where a newer epoch's file has no rev (the line marked plant:tr2j), and runs this
   file in a child. The child must fail tr2j, and src/team.mjs is put back by its sha256 before the caller goes on. */
function plantRaise() {
  const at = path.join(tree, "src", "team.mjs");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:tr2j */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0]] = "  if (rev) byKey[lead] = { epoch: team.epoch, rev }; else delete byKey[lead];";
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL tr2j") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr2") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* Lifts handoverTeam's re-signing of editions, head and stats-span (marked plant:handover-resign) and runs this file in a child.
   The child must fail tr3b, and src/studio.mjs is put back by its sha256 before the caller goes on. */
function plantHandoverResign() {
  const at = path.join(tree, "src", "studio.mjs");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:handover-resign */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0] + 1] = "  if (false) {";
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL tr3b") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr3") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* Lifts handoverTeam's rebinding of recovery and leadBook (marked plant:handover-rebind) and runs this file in a child.
   The child must fail tr3c, and src/studio.mjs is put back by its sha256 before the caller goes on. */
function plantHandoverRebind() {
  const at = path.join(tree, "src", "studio.mjs");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:handover-rebind */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0] + 1] = "  if (false) {";
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL tr3c") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr3") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* THE LEAD BOX FOLLOWS THE HANDOVER'S REASON (Max's ruling of 2026-11-01 06:13). Replaces the line after `marker` in
   src/studio.mjs with `line` and runs this file in a child, which must fail `leg`; the file is put back by its sha256. */
function plantLeadBox(marker, line, legId) {
  const at = path.join(tree, "src", "studio.mjs");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* " + marker + " */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0] + 1] = line;
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL " + legId) >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr3") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* THE STATISTICS BOX FOLLOWS THE KEY: as plantLeadBox, in `rel` (src/team.mjs or src/sign.mjs). */
function plantIn(rel, marker, line, legId) {
  const at = path.join(tree, rel);
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* " + marker + " */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0] + 1] = line;
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL " + legId) >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr3") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* Lifts withHandover's cycle and length bounds (marked plant:handover-cycle-bound) and runs this file in a child.
   The child must fail tr3d, and src/team.mjs is put back by its sha256 before the caller goes on. */
function plantHandoverCycleBound() {
  const at = path.join(tree, "src", "team.mjs");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:handover-cycle-bound */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0] + 1] = "  if (false) {";
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL tr3d") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr3") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* Lifts findOldKey's reading of oldSigningKeys record from the store (marked plant:find-old-key-record)
   and runs this file in a child. The child must fail tr3e, and shell/main.js is put back by its sha256 before the caller goes on. */
function plantFindOldKeyRecord() {
  const at = path.join(tree, "shell", "main.js");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:find-old-key-record */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0] + 1] = "  if (false) {";
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL tr3e") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr3") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* Lifts handover's preservation of plain teams (marked plant:handover-preserve-plain)
   and runs this file in a child. The child must fail tr3f, and shell/main.js is put back by its sha256 before the caller goes on. */
function plantHandoverPreservePlain() {
  const at = path.join(tree, "shell", "main.js");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:handover-preserve-plain */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length >= 1) {
    for (const h of hits) {
      lines[h + 1] = "  const sealed = true;";
    }
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL tr3f") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr3") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

/* Lifts handoverTeam's carry of rev floor to the old key (marked plant:handover-rev-carry) and runs this file in a child.
   The child must fail tr3g, and src/studio.mjs is put back by its sha256 before the caller goes on. */
function plantHandoverRevCarry() {
  const at = path.join(tree, "src", "studio.mjs");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:handover-rev-carry */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0] + 1] = "  if (false) {";
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL tr3g") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL tr3") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

function plantResealTwoCatalogs() {
  const at = path.join(tree, "src", "studio.mjs");
  const was = fs.readFileSync(at);
  const wantSha = crypto.createHash("sha256").update(was).digest("hex");
  const text = was.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf("/* plant:tr-two-catalogs-reseal */") >= 0) hits.push(i);
  let red = false, back = false, detail = "";
  if (hits.length === 1) {
    lines[hits[0]] = "  /* plant:tr-two-catalogs-reseal */ for (const list of [Array.from(groups.values())[0]]) {";
    fs.writeFileSync(at, lines.join(nl));
    let child = null;
    try {
      child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
        cwd: tree, encoding: "utf8", timeout: 120000,
        env: Object.assign({}, process.env, { TEAM_REV_ONLY: "1" })
      });
      const said = String(child && child.stderr || "") + String(child && child.stdout || "");
      red = said.indexOf("FAIL 962s6k") >= 0;
      detail = said.split(NL).filter(l => l.indexOf("FAIL 962s6k") >= 0 || l.indexOf("#counts") >= 0).map(l => l.slice(0, 40))
        .join(" | ").slice(0, 240);
    } finally {
      fs.writeFileSync(at, was);
    }
    back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === wantSha;
  }
  return { hits: hits.length, red, back, sha: wantSha, detail };
}

async function loadShellHelper(ud) {
  const nodeRequire = createRequire(import.meta.url);
  const Module = nodeRequire("node:module");
  const main = path.join(ROOT, "shell", "main.js");
  const ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, windows: [] };

  class Win {
    constructor() {
      this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {}, getURL: () => pathToFileURL(ui).href };
      got.windows.push(this);
    }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; }
    isMinimized() { return false; } close() {} focus() {} restore() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }

  const electron = {
    app: {
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: (p) => p === "userData" ? ud : (p === "documents" ? ud : path.join(ud, p)),
      getVersion: () => "0.0.0",
      getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true,
      whenReady: () => Promise.resolve(),
      on() {}, quit() {}, exit() {}
    },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }), showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }), showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} },
    safeStorage: { isEncryptionAvailable: () => true, encryptString: (s) => Buffer.from(s), decryptString: (b) => b.toString() },
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({}), on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {}, setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: () => Promise.reject(new Error("network forbidden")) }
  };

  const thread = {
    call: async (verb, ...a) => {
      const S = await import("../src/studio.mjs");
      if (typeof S[verb] === "function") return S[verb](...a);
      throw new Error("studio verb " + verb + " not implemented");
    }
  };

  const cp = {
    execFileSync: () => "", execSync: () => "",
    spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => ({ on() {}, unref() {} }), spawn: () => ({ on() {}, unref() {} }),
    fork: () => ({ on() {}, unref() {} })
  };

  const env = {
    STUDIO_NO_PROXY_SERVER: "off",
    STUDIO_TEST_OFFSCREEN: "1",
    STUDIO_KEY_PASSPHRASE: "passphrase",
    STUDIO_PROJECTS: path.join(ud, "projects")
  };
  /* A Studio that works, as a lead's does (the gate keeps its watch from one that does not). */
  Object.assign(env, await seatEnv(ud, true, env), env);
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }

  const load = Module._load;
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return load.apply(this, arguments);
  };

  delete nodeRequire.cache[main];
  const mod = nodeRequire(main);

  got.event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: got.windows[0] && got.windows[0].webContents };
  got.ask = async (ch, ...a) => {
    if (!got.handlers[ch]) return { error: "no handler for " + ch };
    try {
      return await got.handlers[ch](got.event, ...a);
    } catch (e) {
      return { error: String(e && e.message || e), said: e && e.said };
    }
  };

  const cleanup = () => {
    Module._load = load;
    delete nodeRequire.cache[main];
    for (const k of Object.keys(was)) {
      if (was[k] === undefined) delete process.env[k];
      else process.env[k] = was[k];
    }
  };

  return { got, mod, cleanup };
}

/* The pinned desk's own test of a team file, cut from the pinned shell as tests/catalog-use.mjs cuts its ask rule. */
function lineOf(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0 || src.indexOf(marker, at + marker.length) >= 0) throw new Error("slice " + marker);
  const end = src.indexOf(NL, at);
  return src.slice(src.lastIndexOf(NL, at) + 1, end < 0 ? src.length : end).trim();
}
function fnOf(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0 || src.indexOf(marker, at + marker.length) >= 0) throw new Error("slice " + marker);
  let depth = 0, started = false, str = "";
  for (let i = at; i < src.length; i++) {
    const c = src[i];
    if (str) { if (c === "\\") { i++; continue; } if (c === str) str = ""; continue; }
    if (c === "\"" || c === "'") { str = c; continue; }
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return src.slice(at, i + 1); }
  }
  throw new Error("unclosed " + marker);
}
function deskWhole() {
  const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
  const body = [lineOf(src, "const SPKI_ED25519 ="), lineOf(src, "const SEALED_TEAM_RE ="), fnOf(src, "function canonJson("),
    fnOf(src, "function signedBytesOf("), fnOf(src, "function teamWhole("), "return teamWhole;"].join(NL);
  return new Function("crypto", "Buffer", body)(crypto, Buffer);
}

async function main(argv) {
  try {
    return await runTeamRev(argv);
  } finally {
    if (tree) {
      const { dropPlantsTree } = await import("./plants-tree.mjs");
      dropPlantsTree(tree, ROOT);
    }
  }
}

async function runTeamRev(argv) {
  if (PLANTS_OFF && !ONLY) {
    process.stdout.write("team-rev: plants not run (ETIUDA_PLANTS=off): tr2i, tr2k and the checkout check skipped; the plant"
      + " halves of tr2f and tr3b to tr3i not run, their own claims checked" + NL);
  }
  clearScratch(SCRATCH);
  const SHARE = path.join(SCRATCH, "share");
  fs.mkdirSync(SHARE, { recursive: true });
  const R = Engine.teamRules();
  let T = null, S = null;
  try { T = await import("../src/team.mjs"); S = await import("../src/studio.mjs"); } catch (e) { process.stderr.write(String(e) + NL); }
  const keyAt = path.join(SCRATCH, "lead-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + NL);
  const LEAD = { keyId: lead.keyId, public: lead.public };
  const teamAt = path.join(SHARE, "etiuda-team.json");
  const onShare = () => readJson(teamAt);
  const write = (team) => T.writeTeam(SHARE, team, { key: keyAt, passphrase: PASS });
  const held = async () => (await T.heldTeam(SHARE, { key: keyAt })).team;
  const RT = "fedcba9876543210fedcba9876543210";
  const RELAY = { kind: "relay", rt: RT, url: "https://relay.lamp.test/relay/v1" };
  const RING = { format: 1, kind: "etiuda-ring", keys: [{ catalog: "lamp-board", keyId: lead.keyId, alg: "Ed25519", public: lead.public }] };

  /* ---- 1. what writeTeam writes ------------------------------------------------------------------------------------ */
  let teamId = "";
  await leg("tr1a writeTeam signs rev 1 on a new team and one higher at each write after, a new epoch counting on, with the"
    + " folder's channel and no ring (red where no rev or channel is written)", async () => {
    await write(T.newTeam({ catalogs: ["lamp-board"], lead: LEAD }));
    const one = onShare();
    teamId = one.id;
    await write(T.withExportsSealed(await held(), true));
    const two = onShare();
    const next = await T.newEpoch(await held(), { key: keyAt });
    await write(next.team);
    const three = onShare();
    process.stdout.write("       revs " + [one.rev, two.rev, three.rev].join(",") + ", epochs " + [one.epoch, two.epoch, three.epoch].join(",")
      + ", channel " + JSON.stringify(three.channel) + NL);
    return one.rev === 1 && two.rev === 2 && three.rev === 3 && three.epoch === 2
      && [one, two, three].every(d => JSON.stringify(d.channel) === JSON.stringify({ kind: "folder" }) && d.ring === undefined);
  });

  const legacyAt = path.join(SCRATCH, "legacy");
  fs.mkdirSync(legacyAt, { recursive: true });
  let legacyBytes = "";
  await leg("tr1b a team file written before revisions counts as rev 0: it is held as before, and the write that replaces"
    + " it signs rev 1 (red where the old file's absence of a rev is not read as 0)", async () => {
    const open = unlockKey(readKeyFile(keyAt), PASS);
    const doc = { format: 1, kind: "etiuda-team", id: "t-" + crypto.randomBytes(8).toString("hex"), catalogs: ["lamp-board"],
      lead: LEAD, sealed: false, exportsSealed: false, epoch: 1, roster: [] };
    legacyBytes = JSON.stringify(await signDocument(doc, { privateKey: open.privateKey, keyId: open.keyId }), null, 1) + NL;
    fs.writeFileSync(path.join(legacyAt, "etiuda-team.json"), legacyBytes);
    const h = await T.heldTeam(legacyAt, { key: keyAt });
    await T.writeTeam(legacyAt, h.team, { key: keyAt, passphrase: PASS });
    const after = readJson(path.join(legacyAt, "etiuda-team.json"));
    return !!h.team && h.reason === "" && h.team.rev === undefined && after.rev === 1;
  });

  let relayBytes = "";
  await leg("tr1c withChannel names a relay by its id and https address and the ring rides inside the signed file; back on"
    + " the folder the ring goes; a channel a desk would not read, or a relay with no ring, is refused and nothing is written",
    async () => {
    await write(T.withChannel(await held(), RELAY, RING));
    relayBytes = fs.readFileSync(teamAt, "utf8");
    const relay = onShare();
    const before = sha(teamAt);
    const refusals = [];
    for (const bad of [{ kind: "relay", rt: RT, url: "http://relay.lamp.test/relay/v1" }, { kind: "relay", rt: "x", url: RELAY.url },
      { kind: "pigeon" }]) refusals.push(await throwsOn(async () => write(T.withChannel(await held(), bad, RING))));
    refusals.push(await throwsOn(async () => write(T.withChannel(T.withChannel(await held(), { kind: "folder" }), RELAY))));
    const unchanged = sha(teamAt) === before;
    await write(T.withChannel(await held(), { kind: "folder" }));
    const back = onShare();
    process.stdout.write("       relay rev " + relay.rev + ", back rev " + back.rev + ", refusals " + refusals.filter(Boolean).length + NL);
    return JSON.stringify(relay.channel) === JSON.stringify(RELAY) && JSON.stringify(relay.ring) === JSON.stringify(RING)
      && refusals.every(r => /channel|ring/.test(r)) && unchanged
      && JSON.stringify(back.channel) === JSON.stringify({ kind: "folder" }) && back.ring === undefined && back.rev === relay.rev + 1;
  });

  await leg("tr1d what writeTeam writes, its rev and channel on the folder and on the relay, reads whole by the pinned engine's"
    + " team reader with no problem, keeps rev, channel and ring as written, verifies under the lead's key, and is whole to the"
    + " pinned desk's own teamWhole", async () => {
    const whole = deskWhole();
    const ok = async (text) => {
      const r = R.v2TeamRead(text), doc = JSON.parse(text);
      return Number.isSafeInteger(doc.rev) && doc.rev >= 1 && !!doc.channel
        && !!r.team && !r.problems.length && await R.v2TeamSigState(r.team) === R.states.valid && whole(doc) === true
        && r.team.rev === doc.rev && JSON.stringify(r.team.channel) === JSON.stringify(doc.channel)
        && JSON.stringify(r.team.ring) === JSON.stringify(doc.ring);
    };
    const tampered = JSON.parse(relayBytes);
    tampered.rev = tampered.rev + 1;
    return await ok(fs.readFileSync(teamAt, "utf8")) && await ok(relayBytes) && whole(tampered) === false;
  });

  /* ---- 2. an older file of this Studio's own team put back on the share ------------------------------------------------ */
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const dir = (await S.newProject(projects, "Team rev", [{ code: "en", name: "English" }])).dir;
  const shelf = ((await S.addTag(dir, "shelf", { en: "General" })).tag).id;
  await S.addCard(dir, shelf, "Card a", "The a answer, in full.");
  S.setPublishFolder(dir, SHARE);
  const olderBytes = fs.readFileSync(teamAt, "utf8");
  await write(T.withExportsSealed(await held(), false));
  const newerBytes = fs.readFileSync(teamAt, "utf8");
  const olderRev = JSON.parse(olderBytes).rev, newerRev = JSON.parse(newerBytes).rev, epoch = JSON.parse(newerBytes).epoch;
  fs.writeFileSync(teamAt, olderBytes);

  await leg("tr2a an older file of this Studio's own team put back at the same epoch is refused by heldTeam, which says it"
    + " is older and by how much (red where it is held)", async () => {
    const h = await T.heldTeam(SHARE, { key: keyAt });
    process.stdout.write("       " + JSON.stringify(h.reason.slice(0, 160)) + NL);
    return olderRev < newerRev && h.team === null && h.older === true
      && h.reason.indexOf("rev " + olderRev + ", below " + newerRev + " at key number " + epoch) >= 0;
  });
  await leg("tr2b the Desks screen's facts say the folder's file is older, not another lead's, and the switch, Sealed, Plain"
    + " or a new team, writes nothing over it and says why (red where it is taken for another lead's or written over)",
    async () => {
    const f = await S.teamFacts(dir, { key: keyAt });
    const before = sha(teamAt), said = [];
    said.push(await throwsOn(() => S.setTeamSealed(dir, true, { key: keyAt, passphrase: PASS })));
    said.push(await throwsOn(() => S.setTeamSealed(dir, false, { key: keyAt, passphrase: PASS })));
    said.push(await throwsOn(() => S.setTeamSealed(dir, true, { key: keyAt, passphrase: PASS, fresh: true,
      teamId: "t-" + crypto.randomBytes(8).toString("hex") })));
    process.stdout.write("       facts " + f.file + ", " + JSON.stringify(said[0].slice(0, 120)) + NL);
    return f.file === "older" && /older/.test(f.reason) && said.every(s => /is older than one this Studio has already seen/.test(s))
      && sha(teamAt) === before;
  });
  await leg("tr2c the floor outlives the process that kept it: a second node process refuses the same file, and the floor"
    + " beside the key file names the team, the lead's key, the epoch and the rev", async () => {
    const code = "import(" + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href) + ").then(async T => {"
      + " const h = await T.heldTeam(" + JSON.stringify(SHARE) + ", { key: " + JSON.stringify(keyAt) + " });"
      + " process.stdout.write(JSON.stringify({ held: !!h.team, older: h.older === true })); });";
    const r = spawnSync(process.execPath, ["-e", code], { encoding: "utf8", timeout: 60000 });
    const floor = T.revFloor(keyAt, teamId, LEAD.public), kept = readJson(T.revsFile(keyAt));
    process.stdout.write("       child " + String(r.stdout).trim() + ", floor " + JSON.stringify(floor) + NL);
    return r.status === 0 && String(r.stdout).trim() === JSON.stringify({ held: false, older: true })
      && JSON.stringify(floor) === JSON.stringify({ epoch, rev: newerRev })
      && JSON.stringify(kept.teams[teamId][LEAD.public]) === JSON.stringify({ epoch, rev: newerRev });
  });
  await leg("tr2C THE CONTROL: the newer file put back is held again, and a team file with no revision is held as before"
    + " under the same key where no floor is kept beside it", async () => {
    fs.writeFileSync(teamAt, newerBytes);
    const h = await T.heldTeam(SHARE, { key: keyAt });
    fs.writeFileSync(path.join(legacyAt, "etiuda-team.json"), legacyBytes);
    const fresh = path.join(SCRATCH, "fresh-key");
    fs.mkdirSync(fresh, { recursive: true });
    const freshKey = path.join(fresh, "lead-key.json");
    fs.copyFileSync(keyAt, freshKey);
    const noFloor = await T.heldTeam(legacyAt, { key: freshKey });
    return !!h.team && h.team.rev === newerRev && !!noFloor.team && noFloor.reason === "" && noFloor.team.rev === undefined;
  });

  await leg("tr2d a kept copy below the floor at the floor's epoch, put back by Sealed where the share's file has gone, is refused"
    + " by writeTeam itself, handed in directly or through the switch: the older sentence is said, nothing is written and the floor"
    + " stays (red where the kept copy is signed again at a rev above the floor)", async () => {
    const floor = T.revFloor(keyAt, teamId, LEAD.public), kept = JSON.parse(olderBytes);
    fs.renameSync(teamAt, path.join(SCRATCH, "gone-team.json"));
    const copy = await T.heldCopy(kept, { key: keyAt });
    const direct = await caught(() => T.writeTeam(SHARE, copy.team, { key: keyAt, passphrase: PASS }));
    const said = await throwsOn(() => S.setTeamSealed(dir, true, { key: keyAt, passphrase: PASS, kept }));
    process.stdout.write("       kept rev " + kept.rev + ", floor " + JSON.stringify(floor) + ", said " + JSON.stringify(said.slice(0, 100)) + NL);
    return !!floor && kept.rev < floor.rev && kept.epoch === floor.epoch && !!copy.team && !!direct && direct.older === true
      && /nothing was written/.test(direct.message)
      /* Through the switch the kept copy of a team at a folder is refused before the floor is asked (was: the older sentence, said by writeTeam; tr2g holds that on the relay). */
      && /makes a team on the Etiuda relay, not in a shared folder/.test(said)
      && !fs.existsSync(teamAt) && JSON.stringify(T.revFloor(keyAt, teamId, LEAD.public)) === JSON.stringify(floor);
  });

  await leg("tr2e a file of this Studio's own, whole under its key, whose rev is not a whole number is refused by heldTeam,"
    + " which says so (red where it is held)", async () => {
    const at = path.join(SCRATCH, "odd-rev");
    fs.mkdirSync(at, { recursive: true });
    const open = unlockKey(readKeyFile(keyAt), PASS), said = [];
    for (const rev of [1.5, "4", -1]) {
      const doc = { format: 1, kind: "etiuda-team", id: "t-" + crypto.randomBytes(8).toString("hex"), catalogs: ["lamp-board"],
        lead: LEAD, sealed: false, exportsSealed: false, epoch: 1, roster: [], rev, channel: { kind: "folder" } };
      fs.writeFileSync(path.join(at, "etiuda-team.json"),
        JSON.stringify(await signDocument(doc, { privateKey: open.privateKey, keyId: open.keyId }), null, 1) + NL);
      const read = await T.readTeam(at), h = await T.heldTeam(at, { key: keyAt });
      said.push(read.valid && h.team === null && /rev is not a whole number/.test(h.reason));
    }
    process.stdout.write("       refused and said: " + said.join(",") + NL);
    return said.every(Boolean);
  });

  await leg("tr2f a team file whose epoch is below the kept floor is older, as a lower rev at the same epoch is: put back,"
    + " nothing used, and the key number named as below; a file at the floor's epoch or above is read as today;"
    + " a plant that lifts the comparison goes red and src/team.mjs comes back by sha256 (red where a lower epoch is held)",
    async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantEpoch();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const open = unlockKey(readKeyFile(keyAt), PASS);
    const r = await epochBelowFloor(T, path.join(SCRATCH, "low-epoch"), keyAt, LEAD, open);
    process.stdout.write("       low held " + !!r.low.team + ", older " + (r.low.older === true) + ", "
      + JSON.stringify(String(r.low.reason).slice(0, 180)) + NL);
    return planted.hits === 1 && planted.red && planted.back && r.ok;
  });

  /* THE TEST ARCHITECT'S SCENE (board 929): a floor at epoch 2, a kept copy at epoch 1 and the share's team file deleted. */
  const sceneRoot = path.join(SCRATCH, "floor-scene"), sceneShare = path.join(sceneRoot, "share");
  const sceneAt = path.join(sceneShare, "etiuda-team.json");
  let sc = null;
  await leg("tr2g a floor at epoch 2, a kept copy at epoch 1 and the share's team file deleted: Sealed, handed the kept copy,"
    + " writes nothing and says the team file is older, and so does writeTeam handed the copy directly; the floor stays"
    + " (red where the epoch 1 copy is signed again at the next rev)", async () => {
    fs.mkdirSync(sceneShare, { recursive: true });
    const d = (await S.newProject(path.join(sceneRoot, "projects"), "Floor scene", [{ code: "en", name: "English" }])).dir;
    S.setPublishFolder(d, sceneShare);
    const tid = "t-" + crypto.randomBytes(8).toString("hex");
    const one = JSON.parse(JSON.stringify((await olderFolderTeam(d, { key: keyAt, passphrase: PASS, teamId: tid, relay: true })).written));
    const next = await T.newEpoch((await T.heldTeam(sceneShare, { key: keyAt })).team, { key: keyAt });
    await T.writeTeam(sceneShare, next.team, { key: keyAt, passphrase: PASS });
    const two = readJson(sceneAt), floor = T.revFloor(keyAt, tid, LEAD.public);
    fs.renameSync(sceneAt, path.join(sceneRoot, "gone-team.json"));
    sc = { d, tid, one, two };
    const copy = await T.heldCopy(one, { key: keyAt });
    const direct = await caught(() => T.writeTeam(sceneShare, copy.team, { key: keyAt, passphrase: PASS }));
    const said = await throwsOn(() => S.setTeamSealed(d, true, { key: keyAt, passphrase: PASS, kept: one }));
    process.stdout.write("       kept epoch " + one.epoch + " rev " + one.rev + ", floor " + JSON.stringify(floor) + ", said "
      + JSON.stringify(said.slice(0, 100)) + NL);
    return one.epoch === 1 && two.epoch === 2 && JSON.stringify(floor) === JSON.stringify({ epoch: 2, rev: two.rev })
      && !!copy.team && !!direct && direct.older === true && /nothing was written/.test(direct.message)
      && /is older than one this Studio has already seen, so it is left as it is/.test(said) && !fs.existsSync(sceneAt)
      && JSON.stringify(T.revFloor(keyAt, tid, LEAD.public)) === JSON.stringify(floor);
  });

  await leg("tr2h a kept copy at the floor's rev is written at the next rev, and a newer epoch above the floor after it: the"
    + " floor refuses only what is below it", async () => {
    const floor = T.revFloor(keyAt, sc.tid, LEAD.public);
    const r = await S.setTeamSealed(sc.d, true, { key: keyAt, passphrase: PASS, kept: sc.two });
    const now = readJson(sceneAt);
    const next = await T.newEpoch((await T.heldTeam(sceneShare, { key: keyAt })).team, { key: keyAt });
    await T.writeTeam(sceneShare, next.team, { key: keyAt, passphrase: PASS });
    const three = readJson(sceneAt);
    process.stdout.write("       at floor " + JSON.stringify(floor) + ", written rev " + now.rev + ", next epoch " + three.epoch
      + " rev " + three.rev + NL);
    return sc.two.rev === floor.rev && now.epoch === 2 && now.rev === floor.rev + 1 && !!r.written && r.written.rev === now.rev
      && three.epoch === 3 && three.rev === now.rev + 1
      && JSON.stringify(T.revFloor(keyAt, sc.tid, LEAD.public)) === JSON.stringify({ epoch: 3, rev: three.rev });
  });

  if (PLANTS_OFF) skip("tr2i a plant that lifts writeTeam's floor check goes red on tr2d and tr2g, and src/team.mjs comes back by sha256"
    + " (red where the floor is checked nowhere but in heldTeam) (ETIUDA_PLANTS=off)");
  else await leg("tr2i a plant that lifts writeTeam's floor check goes red on tr2d and tr2g, and src/team.mjs comes back by sha256"
    + " (red where the floor is checked nowhere but in heldTeam)", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (!ONLY) {
      planted = plantFloor();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    return planted.hits === 1 && planted.red && planted.back;
  });

  /* BOARD 931 CONDITION (6), Studio's half: a lead-signed file at a newer epoch with no rev raises the floor to that epoch at
     rev 0 and does not delete it, so the old epoch's file put back on the share is still older. */
  await leg("tr2j a floor at epoch 1 rev 3, then the lead's file at epoch 2 with no rev, then the old epoch 1 file put back on the"
    + " share: the floor is raised to epoch 2 at rev 0, not deleted, so heldTeam refuses the old file as older and writeTeam handed it"
    + " signs nothing; a later file at epoch 2 with a rev raises the floor as before (red where the floor is deleted)", async () => {
    const at = path.join(SCRATCH, "newer-no-rev");
    fs.mkdirSync(at, { recursive: true });
    const open = unlockKey(readKeyFile(keyAt), PASS), id = "t-" + crypto.randomBytes(8).toString("hex");
    const file = path.join(at, "etiuda-team.json");
    const sign = async (epoch, rev) => {
      const doc = { format: 1, kind: "etiuda-team", id, catalogs: ["lamp-board"], lead: LEAD, sealed: false, exportsSealed: false,
        epoch, roster: [] };
      if (rev !== undefined) { doc.rev = rev; doc.channel = { kind: "folder" }; }
      const signed = await signDocument(doc, { privateKey: open.privateKey, keyId: open.keyId });
      fs.writeFileSync(file, JSON.stringify(signed, null, 1) + NL);
      return signed;
    };
    const old = await sign(1, 3);
    const first = await T.heldTeam(at, { key: keyAt }), floorOne = T.revFloor(keyAt, id, LEAD.public);
    await sign(2);
    const newer = await T.heldTeam(at, { key: keyAt }), floorTwo = T.revFloor(keyAt, id, LEAD.public);
    await sign(1, 3);
    const back = sha(file);
    const low = await T.heldTeam(at, { key: keyAt });
    const copy = await T.heldCopy(JSON.parse(JSON.stringify(old)), { key: keyAt });
    const direct = await caught(() => T.writeTeam(at, copy.team, { key: keyAt, passphrase: PASS }));
    const untouched = sha(file) === back;
    await sign(2, 1);
    const later = await T.heldTeam(at, { key: keyAt }), floorLater = T.revFloor(keyAt, id, LEAD.public);
    process.stdout.write("       floors " + [floorOne, floorTwo, floorLater].map(f => JSON.stringify(f)).join(" ")
      + ", old file held " + !!low.team + ", older " + (low.older === true) + ", direct write " + (direct ? "refused" : "signed") + NL);
    return !!first.team && JSON.stringify(floorOne) === JSON.stringify({ epoch: 1, rev: 3 })
      && !!newer.team && newer.team.epoch === 2 && newer.team.rev === undefined && JSON.stringify(floorTwo) === JSON.stringify({ epoch: 2, rev: 0 })
      && low.team === null && low.older === true && /key number 1, below 2 at rev 3/.test(low.reason)
      && !!copy.team && !!direct && direct.older === true && /nothing was written/.test(direct.message) && untouched
      && !!later.team && later.team.rev === 1 && JSON.stringify(floorLater) === JSON.stringify({ epoch: 2, rev: 1 });
  });

  await leg("tr3a leg a: a handover on a folder team: the team file carries one genuine step and the new lead, epoch unchanged, rev raised, engine's handedTo accepts it, and ring gains new key entry beside old entry", async () => {
    const dir = path.join(SCRATCH, "folder-handover");
    fs.mkdirSync(dir, { recursive: true });
    const oldKeyDoc = await makeKeyFile({ passphrase: PASS });
    const newKeyDoc = await makeKeyFile({ passphrase: PASS });
    const oldKeyPath = path.join(dir, "old-key.json");
    const newKeyPath = path.join(dir, "new-key.json");
    fs.writeFileSync(oldKeyPath, JSON.stringify(oldKeyDoc, null, 1) + NL);
    fs.writeFileSync(newKeyPath, JSON.stringify(newKeyDoc, null, 1) + NL);
    const oldOpen = unlockKey(readKeyFile(oldKeyPath), PASS);
    const newOpen = unlockKey(readKeyFile(newKeyPath), PASS);
    const teamId = "t-" + crypto.randomBytes(8).toString("hex");
    const catId = "handover-cat";
    const team0 = T.newTeam({ id: teamId, catalogs: [catId], lead: { keyId: oldOpen.keyId, public: oldOpen.public }, sealed: true, exportsSealed: false });
    await T.writeTeam(dir, team0, { key: oldKeyPath, passphrase: PASS });
    const ringFile = path.join(dir, "etiuda-ring.json");
    const Rng = await import("../src/ring.mjs");
    Rng.addToRing(ringFile, await Rng.entryFor(readKeyFile(oldKeyPath), catId));

    const beforeTeam = (await T.readTeam(dir)).team;
    const oldEpoch = beforeTeam.epoch, oldRev = beforeTeam.rev;

    /* Handover on the folder team */
    await S.handoverTeam(dir, { key: newKeyPath, passphrase: PASS, oldKey: oldKeyPath, oldPassphrase: PASS, folder: dir });

    const afterRead = await T.readTeam(dir);
    const after = afterRead.team;
    const blob = Engine.relayRules().blob;
    const handoverList = Array.isArray(after && after.handover) ? after.handover : [];
    const step0 = handoverList[0];
    const ringDoc = Rng.readRingFile(ringFile).doc;
    const keysInRing = ringDoc.keys.map(k => k.public);

    return afterRead.valid === true
      && after.lead.public === newOpen.public
      && after.lead.keyId === newOpen.keyId
      && after.epoch === oldEpoch
      && after.rev === oldRev + 1
      && handoverList.length === 1
      && blob.handoverGenuine(step0, teamId, oldOpen) === true
      && blob.handedTo(after, oldOpen) === true
      && keysInRing.includes(oldOpen.public)
      && keysInRing.includes(newOpen.public);
  });

  await leg("tr3b leg b: after a handover, files signed by the old key are refused by the desk; the handover re-signs every current edition, the head and stats-span under the new key, so a desk opens the current edition right after handover", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantHandoverResign();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const dir = path.join(SCRATCH, "folder-handover-resign");
    fs.mkdirSync(dir, { recursive: true });
    const oldKeyDoc = await makeKeyFile({ passphrase: PASS });
    const newKeyDoc = await makeKeyFile({ passphrase: PASS });
    const oldKeyPath = path.join(dir, "old-key.json");
    const newKeyPath = path.join(dir, "new-key.json");
    fs.writeFileSync(oldKeyPath, JSON.stringify(oldKeyDoc, null, 1) + NL);
    fs.writeFileSync(newKeyPath, JSON.stringify(newKeyDoc, null, 1) + NL);
    const oldOpen = unlockKey(readKeyFile(oldKeyPath), PASS);
    const newOpen = unlockKey(readKeyFile(newKeyPath), PASS);
    const teamId = "t-" + crypto.randomBytes(8).toString("hex");
    const catId = "handover-cat-resign";
    const team0 = T.newTeam({ id: teamId, catalogs: [catId], lead: { keyId: oldOpen.keyId, public: oldOpen.public }, sealed: false, exportsSealed: false });
    await T.writeTeam(dir, team0, { key: oldKeyPath, passphrase: PASS });
    const ringFile = path.join(dir, "etiuda-ring.json");
    const Rng = await import("../src/ring.mjs");
    Rng.addToRing(ringFile, await Rng.entryFor(readKeyFile(oldKeyPath), catId));

    /* A catalog edition signed under old key */
    const catDoc = {
      format: 2, kind: "etiuda-catalog", id: catId, name: "Handover Resign Cat", rev: 1, date: "2026-10-30",
      cards: [{ id: "c1", text: "hello" }]
    };
    const signedCat = await signCatalog(catDoc, { privateKey: oldOpen.privateKey, keyId: oldOpen.keyId });
    const ecFile = path.join(dir, catId + "-1-2026-10-30.ec");
    fs.writeFileSync(ecFile, JSON.stringify(signedCat, null, 1) + NL);

    /* etiuda-head.json and stats-span.json signed under old key */
    writeSpan(dir, "rolling-30", oldOpen);
    const headDoc0 = headOf(oldOpen, team0, Date.now(), [{ catalog: catId, rev: 1, edition: "2026-10-30", published: "2026-10-30" }]);
    writeWhole(path.join(dir, HEAD_NAME), JSON.stringify(headDoc0, null, 1) + NL);

    /* Desk setup pointing to this share */
    const deskUd = path.join(SCRATCH, "desk-ud-tr3b");
    fs.mkdirSync(deskUd, { recursive: true });
    fs.writeFileSync(path.join(deskUd, "desk.json"), JSON.stringify({ kind: "etiuda-desk", schema: 1, keys: { eCatalogFolder: dir, eUiLang: "en" } }) + NL);
    const noop = () => {};
    const inert = new Proxy(function () {}, { get: () => inert, set: () => true, apply: () => undefined });
    /* commandLine carries hasSwitch and removeSwitch: the desk calls hasSwitch on Linux alone (its keyring choice), so a
       stub without it threw there and tr3b read red for the leg, not the product (Claude gamma's Linux sweep, 2026-11-14). */
    const electron = {
      app: { getPath: () => deskUd, setPath: noop, requestSingleInstanceLock: () => false, quit: noop, on: noop, getVersion: () => "0.0.0", whenReady: () => new Promise(noop), commandLine: { appendSwitch: noop, hasSwitch: () => false, removeSwitch: noop } },
      ipcMain: { on: noop, handle: noop },
      BrowserWindow: inert, Menu: inert, dialog: inert, net: inert, protocol: inert, session: inert, shell: inert,
      screen: inert, systemPreferences: inert, nativeTheme: { themeSource: "system" },
      safeStorage: { isEncryptionAvailable: () => false, encryptString: s => s, decryptString: s => s },
      powerMonitor: inert
    };
    const deskSrc = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
    const deskApi = new Function("require", "__dirname", "__filename", "module", "exports", "console",
      deskSrc + "\nreturn { readCatalog };")(
      n => n === "electron" ? electron : nodeRequire(n),
      path.join(ROOT, "engine", "pinned", "shell"),
      path.join(ROOT, "engine", "pinned", "shell", "main.js"),
      { exports: {} }, {}, { log: noop, error: noop, warn: noop, info: noop }
    );

    /* A desk on a folder team reads the local mirror its syncer keeps of the share (the engine's board 945 stage 3 (b), in the pin
       since bfa4cb5f); no syncer runs in this stand-in, so the share's top-level files are copied there before each read, as the
       syncer's listing would bring them. */
    const mirrorNow = () => {
      const mirror = path.join(deskUd, "folder-mirror", teamId);
      fs.mkdirSync(mirror, { recursive: true });
      for (const n of fs.readdirSync(dir)) {
        const from = path.join(dir, n);
        if (fs.statSync(from).isFile()) fs.copyFileSync(from, path.join(mirror, n));
      }
    };
    mirrorNow();
    const openBefore = deskApi.readCatalog();
    if (!openBefore) return false;

    /* Handover on the folder team */
    await S.handoverTeam(dir, { key: newKeyPath, passphrase: PASS, oldKey: oldKeyPath, oldPassphrase: PASS, folder: dir });

    mirrorNow();
    const openAfter = deskApi.readCatalog();
    const headAfter = JSON.parse(fs.readFileSync(path.join(dir, HEAD_NAME), "utf8"));
    const spanAfter = JSON.parse(fs.readFileSync(path.join(dir, "stats-span.json"), "utf8"));

    return planted.hits === 1 && planted.red && planted.back
      && !!openAfter
      && JSON.parse(openAfter).id === catId
      && headAfter.sig && headAfter.sig.keyId === newOpen.keyId
      && spanAfter.sig && spanAfter.sig.keyId === newOpen.keyId;
  });

  await leg("tr3c leg c: handoverTeam rebinds to the new key: a fresh box for the new lead, and recovery and leadBook resealed under the new key's recovery passphrase, so the recovery copy and the book open with the new key alone", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantHandoverRebind();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const dir = path.join(SCRATCH, "folder-handover-rebind");
    fs.mkdirSync(dir, { recursive: true });
    const oldKeyDoc = await makeKeyFile({ passphrase: PASS });
    const newKeyDoc = await makeKeyFile({ passphrase: PASS });
    const oldKeyPath = path.join(dir, "old-key.json");
    const newKeyPath = path.join(dir, "new-key.json");
    fs.writeFileSync(oldKeyPath, JSON.stringify(oldKeyDoc, null, 1) + NL);
    fs.writeFileSync(newKeyPath, JSON.stringify(newKeyDoc, null, 1) + NL);
    const oldOpen = unlockKey(readKeyFile(oldKeyPath), PASS);
    const newOpen = unlockKey(readKeyFile(newKeyPath), PASS);
    const Sign = await import("../src/sign.mjs");
    const LeadBook = await import("../src/lead-book.mjs");

    const oldBox = Sign.ensureLeadBox(readKeyFile(oldKeyPath), oldOpen);
    const oldRec = Sign.recoverySecret(oldOpen);
    const newRec = Sign.recoverySecret(newOpen);
    const teamId = "t-" + crypto.randomBytes(8).toString("hex");
    const teamKey = crypto.randomBytes(32);

    let team0 = T.newTeam({ id: teamId, catalogs: ["handover-cat-rebind"], lead: { keyId: oldOpen.keyId, public: oldOpen.public, box: oldBox.public }, sealed: true, exportsSealed: false });
    team0 = T.withRecovery(team0, teamKey, oldRec);
    team0 = LeadBook.sealLeadBook(team0, oldRec, { v: 1, invites: {}, removed: {}, handled: [], unopened: [] });
    await T.writeTeam(dir, team0, { key: oldKeyPath, passphrase: PASS });

    /* Handover on the folder team */
    await S.handoverTeam(dir, { key: newKeyPath, passphrase: PASS, oldKey: oldKeyPath, oldPassphrase: PASS, folder: dir });

    const afterRead = await T.readTeam(dir);
    const after = afterRead.team;

    const recNew = T.openRecovery(after, newRec);
    const recOld = T.openRecovery(after, oldRec);
    const bookNew = LeadBook.openLeadBook(after, newRec);
    const bookOld = LeadBook.openLeadBook(after, oldRec);

    return planted.hits === 1 && planted.red && planted.back
      && !!after.lead.box && after.lead.box !== oldBox.public
      && !!recNew && recNew.equals(teamKey) && recOld === null
      && !!bookNew && bookNew.v === 1 && bookOld === null;
  });

  /* THE LEAD BOX FOLLOWS THE HANDOVER'S REASON (Max's ruling of 2026-11-01 06:13): a folder team with one admitted desk and one
     named but not yet admitted, its old key carrying a box, handed to a new key with no box for `reason`. */
  const leadBoxScene = async (tag, reason) => {
    const dir = path.join(SCRATCH, "folder-handover-" + tag);
    fs.mkdirSync(dir, { recursive: true });
    const oldKeyPath = path.join(dir, "old-key.json"), newKeyPath = path.join(dir, "new-key.json");
    fs.writeFileSync(oldKeyPath, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + NL);
    fs.writeFileSync(newKeyPath, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + NL);
    const Sign = await import("../src/sign.mjs");
    const oldOpen = unlockKey(readKeyFile(oldKeyPath), PASS);
    const oldBox = Sign.ensureLeadBox(readKeyFile(oldKeyPath), oldOpen);
    const teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32);
    const deskOf = () => {
      const pub = crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
      const box = crypto.generateKeyPairSync("x25519").publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
      return { id: Engine.deskRules().branchIdOf(pub), key: pub, box };
    };
    const inDesk = deskOf(), named = deskOf();
    let team0 = T.newTeam({ id: teamId, catalogs: ["lead-box-" + tag], lead: { keyId: oldOpen.keyId, public: oldOpen.public, box: oldBox.public }, sealed: true, exportsSealed: false });
    team0 = T.withRecovery(team0, teamKey, Sign.recoverySecret(oldOpen));
    team0 = T.withDesk(T.withDesk(team0, inDesk, "Quay desk"), named, "Shed desk");
    team0.roster.find(e => e.desk.id === inDesk.id).wrap = Engine.hpkeRules().wrapTeamKey(teamKey, inDesk.box, teamId, team0.epoch, inDesk.id);
    await T.writeTeam(dir, team0, { key: oldKeyPath, passphrase: PASS });
    const r = await S.handoverTeam(dir, { key: newKeyPath, passphrase: PASS, oldKey: oldKeyPath, oldPassphrase: PASS, folder: dir, reason });
    const after = (await T.readTeam(dir)).team;
    const newRead = readKeyFile(newKeyPath), newOpen = unlockKey(newRead, PASS);
    const newBox = Sign.openLeadBox(newRead, newOpen);
    return { r, after, oldBox, newBox, inDesk, named };
  };
  await leg("tr3h leg h: a handover for a new computer keeps the team's lead box: the new key file carries the old key's box, sealed"
    + " under its own seed, and the team file names it as the new lead's box, so a desk away across the handover and a later key"
    + " change still finds its copy", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantLeadBox("plant:lead-box-keep", "  if (false) {", "tr3h");
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const x = await leadBoxScene("keep", "new-computer");
    return planted.hits === 1 && planted.red && planted.back
      && x.r.box === "kept" && !!x.newBox && x.newBox.public === x.oldBox.public && x.after.lead.box === x.oldBox.public;
  });
  await leg("tr3i leg i: a handover for a key that may be in other hands gives the new key a box of its own, which the team file"
    + " names, and says which desks were admitted at the handover, the desk named but not admitted left out", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantLeadBox("plant:lead-box-why", "  const keepBox = true;", "tr3i");
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const x = await leadBoxScene("fresh", "other-hands");
    return planted.hits === 1 && planted.red && planted.back
      && x.r.box === "fresh" && !!x.newBox && x.newBox.public !== x.oldBox.public && x.after.lead.box === x.newBox.public
      && Array.isArray(x.r.desks) && x.r.desks.length === 1 && x.r.desks[0] === x.inDesk.id;
  });
  /* THE STATISTICS BOX (lead.stats), which follows the signing key: a desk seals its answer to the box the team file names for
     statistics, else to the lead's box (the engine's statsSeal, its own legs stats-live 930i to 930k); here, as that desk seals. */
  const statsScene = async (tag, reason) => {
    const x = await leadBoxScene(tag, reason || "new-computer");
    const Sign = await import("../src/sign.mjs");
    const dir = path.join(SCRATCH, "folder-handover-" + tag);
    const oldRead = readKeyFile(path.join(dir, "old-key.json")), newRead = readKeyFile(path.join(dir, "new-key.json"));
    const oldOpen = unlockKey(oldRead, PASS), newOpen = unlockKey(newRead, PASS);
    const desk = crypto.generateKeyPairSync("ed25519");
    const deskPub = desk.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex"), deskId = Engine.deskRules().branchIdOf(deskPub);
    const sealedTo = x.after.lead.stats || x.after.lead.box;
    const env = Engine.statsRules().sealStatsLead(sealedTo, x.after.id, x.after.lead.keyId, deskId, JSON.stringify({ format: 1, kind: "etiuda-statistics", engine: "test" }));
    const opens = keys => keys.some(k => Engine.statsRules().openStatsSealed(k, env, deskId) != null);
    /* A Studio from before the statistics box opens with the lead's box alone, and names none. */
    const keysOf = (r, o) => (Sign.statsKeysOf ? Sign.statsKeysOf(r, o) : [Sign.openLeadBox(r, o)].filter(Boolean).map(b => b.secretKey));
    const statsOf = o => (Sign.statsBoxOf ? Sign.statsBoxOf(o).public : "");
    return { x, sealedTo, newStats: statsOf(newOpen), oldStats: statsOf(oldOpen), newOpens: opens(keysOf(newRead, newOpen)), oldOpens: opens(keysOf(oldRead, oldOpen)) };
  };
  await leg("tr3k leg k: a team handed on for a new computer keeps sending statistics, to the new key's statistics box: the team file"
    + " names it beside the lead's box it kept, and the new key opens what a desk seals to it", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantIn("src/team.mjs", "plant:stats-box-named", "  void 0;", "tr3k");
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const y = await statsScene("stats-k");
    process.stdout.write("       named " + (y.x.after.lead.stats ? (y.x.after.lead.stats === y.newStats ? "the new key's" : "another") : "none")
      + ", lead box " + (y.x.after.lead.box === y.x.oldBox.public ? "kept" : "new") + ", the new key opens " + y.newOpens + NL);
    return planted.hits === 1 && planted.red && planted.back
      && y.x.after.lead.box === y.x.oldBox.public && y.x.after.lead.stats === y.newStats && y.newStats !== y.oldStats && y.sealedTo === y.newStats && y.newOpens;
  });
  await leg("tr3l leg l: after that handover the old key opens nothing a desk seals: not by the lead's box it shared, nor by its own"
    + " statistics box", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantIn("src/sign.mjs", "plant:stats-box-seed", "  const raw = Buffer.alloc(32, 7);", "tr3l");
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const y = await statsScene("stats-l");
    process.stdout.write("       the old key opens " + y.oldOpens + NL);
    return planted.hits === 1 && planted.red && planted.back && y.newOpens && !y.oldOpens;
  });
  /* The X25519 form of an Ed25519 public key, u = (1 + y) / (1 - y) mod 2^255 - 19, from the curve's definition: the statistics box
     must not be it, since the signing key is kept apart from sealing. */
  const montOf = (pubHex) => {
    const P = (1n << 255n) - 19n, b = Buffer.from(pubHex, "hex").reverse();
    b[0] &= 0x7f;
    const y = BigInt("0x" + b.toString("hex"));
    let r = 1n, x = (1n - y + P) % P, e = P - 2n;
    while (e > 0n) { if (e & 1n) r = r * x % P; x = x * x % P; e >>= 1n; }
    return Buffer.from(((1n + y) * r % P).toString(16).padStart(64, "0"), "hex").reverse().toString("hex");
  };
  await leg("tr3m leg m: in each handover Studio has, for a new computer and to a key that may be in other hands, the team file names"
    + " the new key's statistics box and never the former lead's", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantIn("src/team.mjs", "plant:stats-box-named", "  void 0;", "tr3m");
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const ys = [await statsScene("stats-m1", "new-computer"), await statsScene("stats-m2", "other-hands")];
    const said = ys.map(y => (y.x.after.lead.stats === y.newStats ? "the new key's" : y.x.after.lead.stats === y.oldStats ? "the former lead's" : y.x.after.lead.stats ? "another" : "none"));
    process.stdout.write("       new computer: " + said[0] + "; other hands: " + said[1] + NL);
    return planted.hits === 1 && planted.red && planted.back
      && ys.every(y => !!y.newStats && y.x.after.lead.stats === y.newStats && y.x.after.lead.stats !== y.oldStats);
  });
  await leg("tr3n leg n: the statistics box a team file names is not the X25519 form of the lead's signing key, which stays a key for"
    + " signing alone, in each handover", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantIn("src/sign.mjs", "plant:stats-box-seed", "  const raw = crypto.createHash(\"sha512\").update(seed).digest().subarray(0, 32);", "tr3n");
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const ys = [await statsScene("stats-n1", "new-computer"), await statsScene("stats-n2", "other-hands")];
    const apart = ys.map(y => !!y.x.after.lead.stats && y.x.after.lead.stats !== montOf(y.x.after.lead.public));
    process.stdout.write("       kept apart from the signing key: new computer " + apart[0] + ", other hands " + apart[1] + NL);
    return planted.hits === 1 && planted.red && planted.back && apart.every(Boolean);
  });
  await leg("tr3o leg o: a signing key whose private half does not export as Node's 48-byte PKCS8 is refused, and no statistics box or"
    + " recovery secret is derived from it", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantIn("src/sign.mjs", "plant:seed-shape", "  void 0;", "tr3o");
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const Sign = await import("../src/sign.mjs");
    const real = crypto.generateKeyPairSync("ed25519").privateKey;
    const longer = { privateKey: { export: () => Buffer.concat([real.export({ type: "pkcs8", format: "der" }), Buffer.from([0])]) } };
    const refused = fn => { try { fn(); return false; } catch (e) { return true; } };
    const r = { box: refused(() => Sign.statsBoxOf(longer)), recovery: refused(() => Sign.recoverySecret(longer)),
      plain: !refused(() => Sign.statsBoxOf({ privateKey: real })) && !refused(() => Sign.recoverySecret({ privateKey: real })) };
    process.stdout.write("       49 bytes: box refused " + r.box + ", recovery refused " + r.recovery + "; 48 bytes derive " + r.plain + NL);
    return planted.hits === 1 && planted.red && planted.back && r.box && r.recovery && r.plain;
  });
  await leg("tr3j leg j: a handover for a new computer to a key that already carries a box of its own is refused in the copywriter's"
    + " words, and neither the team file nor the new key file changes", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantLeadBox("plant:lb-used-key", "      if (false) throw 0;", "tr3j");
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const USED = "This new signing key has already been used elsewhere, so this team's keys cannot move under it, and nothing was changed.";
    const dir = path.join(SCRATCH, "folder-handover-used");
    fs.mkdirSync(dir, { recursive: true });
    const oldKeyPath = path.join(dir, "old-key.json"), newKeyPath = path.join(dir, "new-key.json");
    fs.writeFileSync(oldKeyPath, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + NL);
    fs.writeFileSync(newKeyPath, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + NL);
    const Sign = await import("../src/sign.mjs");
    const oldOpen = unlockKey(readKeyFile(oldKeyPath), PASS);
    const oldBox = Sign.ensureLeadBox(readKeyFile(oldKeyPath), oldOpen);
    Sign.ensureLeadBox(readKeyFile(newKeyPath), unlockKey(readKeyFile(newKeyPath), PASS));
    const teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32);
    let team0 = T.newTeam({ id: teamId, catalogs: ["lead-box-used"], lead: { keyId: oldOpen.keyId, public: oldOpen.public, box: oldBox.public }, sealed: true, exportsSealed: false });
    team0 = T.withRecovery(team0, teamKey, Sign.recoverySecret(oldOpen));
    await T.writeTeam(dir, team0, { key: oldKeyPath, passphrase: PASS });
    const teamFile = path.join(dir, "etiuda-team.json");
    const teamBefore = fs.readFileSync(teamFile), keyBefore = fs.readFileSync(newKeyPath);
    let said = "";
    try { await S.handoverTeam(dir, { key: newKeyPath, passphrase: PASS, oldKey: oldKeyPath, oldPassphrase: PASS, folder: dir, reason: "new-computer" }); }
    catch (e) { said = String(e && e.message || e); }
    return planted.hits === 1 && planted.red && planted.back
      && said.indexOf(USED) === 0 && fs.readFileSync(teamFile).equals(teamBefore) && fs.readFileSync(newKeyPath).equals(keyBefore);
  });

  await leg("tr3d leg d: withHandover refuses a handover to a key already in the chain (K1 to K2 to K1) and bounds the chain to 8 steps (limit plus one is refused), with copywriter refusal words", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantHandoverCycleBound();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    const k = (n) => ({ keyId: "key-" + n, public: "pub-" + n });
    const step = (from, to) => ({
      format: 1, kind: "etiuda-team-handover", team: "t-0123456789abcdef",
      from: { keyId: from.keyId, public: from.public },
      to: { keyId: to.keyId, public: to.public },
      sig: { alg: "Ed25519", keyId: from.keyId, value: "00" }
    });
    const base = T.newTeam({ id: "t-0123456789abcdef", catalogs: ["test-cat"], lead: k(1), sealed: false, exportsSealed: false });

    /* 1. Cycle test: K1 -> K2, then K2 -> K1 refused */
    const team1 = T.withHandover(base, step(k(1), k(2)), k(2));
    const cycleSaid = await throwsOn(() => T.withHandover(team1, step(k(2), k(1)), k(1)));

    /* 2. Limit test: 8 steps accepted, 9th (limit plus one) refused */
    let teamChain = base;
    for (let i = 1; i <= 8; i++) {
      teamChain = T.withHandover(teamChain, step(k(i), k(i + 1)), k(i + 1));
    }
    const limitSaid = await throwsOn(() => T.withHandover(teamChain, step(k(9), k(10)), k(10)));

    return planted.hits === 1 && planted.red && planted.back
      && /already been led by that signing key|cannot return to a key already in the chain/i.test(cycleSaid)
      && /8 times, the most a team can be|limit of 8/i.test(limitSaid);
  });

  await leg("tr3e leg e: Studio offers 'set this signing key aside and make a new one' itself, recording it in store, and findOldKey reads that record and un-prefixed keys rather than matching 'old' in a file name", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantFindOldKeyRecord();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }

    const testUd = path.join(SCRATCH, "row5-shell");
    fs.rmSync(testUd, { recursive: true, force: true });
    fs.mkdirSync(testUd, { recursive: true });

    const { got, mod, cleanup } = await loadShellHelper(testUd);
    try {
      /* 1. Make first key */
      const key1 = await got.ask("studio:key-make");
      if (!key1 || key1.error || !key1.keyId) return false;

      /* 2. Set key aside and make a new one */
      const key2 = await got.ask("studio:key-aside");
      if (!key2 || key2.error || !key2.keyId || key2.keyId === key1.keyId) return false;

      /* Verify store has oldSigningKeys record */
      const storeDoc = JSON.parse(fs.readFileSync(path.join(testUd, "studio.json"), "utf8"));
      if (!Array.isArray(storeDoc.oldSigningKeys) || !storeDoc.oldSigningKeys.some(e => e.public === key1.public)) return false;

      /* 3. findOldKey reads the recorded old key */
      const foundOld = await mod.findOldKey(key1.public);
      if (!foundOld || !foundOld.read || foundOld.read.public !== key1.public) return false;

      /* Test that findOldKey finds a key recorded in store.oldSigningKeys even outside dir */
      const otherDir = path.join(testUd, "other-folder");
      fs.mkdirSync(otherDir, { recursive: true });
      const customKeyPath = path.join(otherDir, "custom-saved-key.json");
      const customDoc = await makeKeyFile({ passphrase: "passphrase" });
      fs.writeFileSync(customKeyPath, JSON.stringify(customDoc, null, 1) + "\n");
      const curStore = JSON.parse(fs.readFileSync(path.join(testUd, "studio.json"), "utf8"));
      curStore.oldSigningKeys.push({ file: customKeyPath, keyId: customDoc.keyId, public: customDoc.public });
      fs.writeFileSync(path.join(testUd, "studio.json"), JSON.stringify(curStore, null, 1) + "\n");

      const foundRecorded = await mod.findOldKey(customDoc.public);
      if (!foundRecorded || !foundRecorded.read || foundRecorded.read.public !== customDoc.public) return false;

      /* 4. Test finding key without 'old' in filename (e.g. activation key or renamed key) */
      const nonOldPath = path.join(testUd, "signing-key.made-at-activation-prev.json");
      const key3Doc = await makeKeyFile({ passphrase: "passphrase" });
      fs.writeFileSync(nonOldPath, JSON.stringify(key3Doc, null, 1) + "\n");
      const foundNonOld = await mod.findOldKey(key3Doc.public);
      if (!foundNonOld || !foundNonOld.read || foundNonOld.read.public !== key3Doc.public) return false;

      /* 5. Verify UI strings and handlers */
      const langSrc = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
      if (!langSrc.includes("Set this key aside and make a new one")) return false;

      return planted.hits === 1 && planted.red && planted.back;
    } finally {
      cleanup();
    }
  });

  await leg("tr3f leg f: handing over a plain folder team keeps it plain (sealed: false preserved in teams.json rather than flipped to true)", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantHandoverPreservePlain();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }

    const testUd = path.join(SCRATCH, "row6-shell");
    fs.rmSync(testUd, { recursive: true, force: true });
    fs.mkdirSync(testUd, { recursive: true });

    const { got, mod, cleanup } = await loadShellHelper(testUd);
    try {
      /* 1. Make first key */
      const key1 = await got.ask("studio:key-make");
      if (!key1 || key1.error || !key1.keyId) return false;

      /* 2. Setup a project and a plain folder team (sealed: false) */
      const shareDir = path.join(testUd, "plain-share");
      fs.mkdirSync(shareDir, { recursive: true });

      const S = await import("../src/studio.mjs");
      const proj = await S.newProject(path.join(testUd, "projects"), "Plain Project", [{ code: "en", name: "English" }]);
      const projDir = proj.dir;
      S.setPublishFolder(projDir, shareDir);

      const tid = "t-" + crypto.randomBytes(8).toString("hex");
      const K = await import("../src/team-store.mjs");
      const at = K.teamsFile(testUd);

      /* Create plain team in shareDir */
      const teamDoc = T.newTeam({
        id: tid,
        catalogs: ["cat-plain"],
        lead: { keyId: key1.keyId, public: key1.public },
        sealed: false,
        exportsSealed: false
      });
      const Sgn = await import("../src/sign.mjs");
      const k1Read = Sgn.readKeyFile(key1.file);
      const k1Secret = Buffer.from(k1Read.doc.private, "base64").toString("utf8");
      const written = (await T.writeTeam(shareDir, teamDoc, { key: key1.file, passphrase: k1Secret })).team;
      K.chooseSealed(at, tid, false, shareDir, written);
      if (K.keptTeam(at, tid).sealed !== false) return false;

      /* 3. Set key aside and make new key */
      const key2 = await got.ask("studio:key-aside");
      if (!key2 || key2.error || !key2.keyId) return false;

      /* 4. Hand over the plain team */
      const hoRes = await got.ask("studio:team-handover", projDir);
      if (!hoRes || hoRes.error) return false;

      /* 5. Check that teams.json kept the team plain (sealed: false) */
      const keptAfter = K.keptTeam(at, tid);
      if (!keptAfter || keptAfter.sealed !== false) return false;

      return planted.hits >= 1 && planted.red && planted.back;
    } finally {
      cleanup();
    }
  });

  await leg("tr3g leg g: rev and epoch floors are keyed by the team id, not by lead.public or leadKeyId, and carry over at a genuine handover, so an older team file cannot come back across a handover; a pre-handover team file is refused afterwards", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantHandoverRevCarry();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }

    const dir = path.join(SCRATCH, "folder-handover-floor");
    const oldDir = path.join(dir, "old-key");
    const newDir = path.join(dir, "new-key");
    fs.mkdirSync(oldDir, { recursive: true });
    fs.mkdirSync(newDir, { recursive: true });
    const oldKeyDoc = await makeKeyFile({ passphrase: PASS });
    const newKeyDoc = await makeKeyFile({ passphrase: PASS });
    const oldKeyPath = path.join(oldDir, "old-key.json");
    const newKeyPath = path.join(newDir, "new-key.json");
    fs.writeFileSync(oldKeyPath, JSON.stringify(oldKeyDoc, null, 1) + NL);
    fs.writeFileSync(newKeyPath, JSON.stringify(newKeyDoc, null, 1) + NL);
    const oldOpen = unlockKey(readKeyFile(oldKeyPath), PASS);
    const newOpen = unlockKey(readKeyFile(newKeyPath), PASS);
    const teamId = "t-" + crypto.randomBytes(8).toString("hex");

    /* 1. Create team under old key, write at rev 1, then rev 2 */
    const teamDoc = T.newTeam({
      id: teamId,
      catalogs: ["lamp-board"],
      lead: { keyId: oldOpen.keyId, public: oldOpen.public },
      sealed: false,
      exportsSealed: false
    });
    const w1 = (await T.writeTeam(dir, teamDoc, { key: oldKeyPath, passphrase: PASS })).team;
    const w2 = (await T.writeTeam(dir, w1, { key: oldKeyPath, passphrase: PASS })).team;
    if (w2.rev !== 2) return false;

    /* Save pre-handover file bytes and copy */
    const preHandoverFile = path.join(dir, "etiuda-team.json");
    const preHandoverBytes = fs.readFileSync(preHandoverFile, "utf8");
    const preHandoverCopy = await T.heldCopy(JSON.parse(preHandoverBytes), { key: oldKeyPath });

    /* 2. Hand over to new key: rev advances to 3 */
    const ho = await S.handoverTeam(dir, {
      folder: dir,
      oldKey: oldKeyPath,
      oldPassphrase: PASS,
      key: newKeyPath,
      passphrase: PASS
    });
    if (!ho || !ho.written || ho.written.rev !== 3) return false;

    /* Verify floors under both keys are at least rev 3 */
    const floorNew = T.revFloor(newKeyPath, teamId, newOpen.public);
    const floorOld = T.revFloor(oldKeyPath, teamId, oldOpen.public);
    if (!floorNew || floorNew.rev !== 3 || !floorOld || floorOld.rev !== 3) return false;

    /* 3. Pre-handover file (at rev 2) is put back onto the share */
    fs.writeFileSync(preHandoverFile, preHandoverBytes);

    /* 4. heldTeam under old key refuses it as older */
    const lowOld = await T.heldTeam(dir, { key: oldKeyPath });
    if (lowOld.team !== null || lowOld.older !== true || !/below 3/.test(lowOld.reason)) return false;

    /* 5. writeTeam with pre-handover copy throws older: true */
    const direct = await caught(() => T.writeTeam(dir, preHandoverCopy.team, { key: oldKeyPath, passphrase: PASS }));
    if (!direct || direct.older !== true) return false;

    /* 6. An older rev (rev 1 or 2) under new key is also refused by writeTeam */
    const doc2 = JSON.parse(JSON.stringify(ho.written));
    doc2.rev = 2;
    delete doc2.sig;
    const signed2 = await signDocument(doc2, { privateKey: newOpen.privateKey, keyId: newOpen.keyId });
    const copy2 = await T.heldCopy(signed2, { key: newKeyPath });
    const directNew = await caught(() => T.writeTeam(dir, copy2.team, { key: newKeyPath, passphrase: PASS }));
    if (!directNew || directNew.older !== true) return false;

    return planted.hits >= 1 && planted.red && planted.back;
  });

  await leg("962s6k a removal on a two-catalog team reseals both catalogs' newest editions", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (PLANTS_RUN) {
      if (tree == null) {
        const plants = await import("./plants-tree.mjs");
        before = plants.treeSha(ROOT);
        tree = plants.plantsTree(ROOT, "team-rev");
      }
      planted = plantResealTwoCatalogs();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }

    const dir = path.join(SCRATCH, "folder-two-cat-remove");
    fs.mkdirSync(dir, { recursive: true });
    const keyDoc = await makeKeyFile({ passphrase: PASS });
    const keyPath = path.join(dir, "lead-key.json");
    fs.writeFileSync(keyPath, JSON.stringify(keyDoc, null, 1) + NL);
    const keyOpen = unlockKey(readKeyFile(keyPath), PASS);
    const teamId = "t-" + crypto.randomBytes(8).toString("hex");
    const epoch1Key = crypto.randomBytes(32);
    const epoch2Key = crypto.randomBytes(32);
    const deskOf = () => {
      const pub = crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
      const box = crypto.generateKeyPairSync("x25519").publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
      return { id: Engine.deskRules().branchIdOf(pub), key: pub, box };
    };
    const deskAlice = deskOf();
    const deskBob = deskOf();

    let team = T.newTeam({
      id: teamId,
      catalogs: ["cat1", "cat2"],
      lead: { keyId: keyOpen.keyId, public: keyOpen.public },
      sealed: true,
      exportsSealed: true,
    });
    team.epoch = 1;
    team = T.withDesk(team, deskAlice, "Alice");
    team = T.withDesk(team, deskBob, "Bob");
    const Srules = Engine.sealRules();
    team.roster[0].wrap = Engine.hpkeRules().wrapTeamKey(epoch1Key, deskAlice.box, teamId, 1, deskAlice.id);
    team.roster[1].wrap = Engine.hpkeRules().wrapTeamKey(epoch1Key, deskBob.box, teamId, 1, deskBob.id);
    await T.writeTeam(dir, team, { key: keyPath, passphrase: PASS });

    /* Write two catalogs at epoch 1 */
    const cat1Data = JSON.stringify({ id: "cat1", rev: 1, date: "2026-11-09T01:00:00Z" });
    const cat2Data = JSON.stringify({ id: "cat2", rev: 1, date: "2026-11-09T01:00:00Z" });
    fs.writeFileSync(path.join(dir, "cat1-1.ec"), JSON.stringify(Srules.sealCatalog(epoch1Key, teamId, 1, cat1Data)));
    fs.writeFileSync(path.join(dir, "cat2-1.ec"), JSON.stringify(Srules.sealCatalog(epoch1Key, teamId, 1, cat2Data)));

    const projDir = path.join(dir, "proj");
    fs.mkdirSync(projDir, { recursive: true });
    fs.writeFileSync(path.join(projDir, "project.json"), JSON.stringify({ folder: dir, sealedTeam: teamId, draft: "draft.json" }));
    fs.writeFileSync(path.join(projDir, "draft.json"), JSON.stringify({ id: "cat1" }));

    const r = await S.removeMember(projDir, keyPath, teamId, deskBob.id, PASS, {
      confirm: true,
      teamKeys: { [teamId]: { 1: epoch1Key } },
      nextKey: epoch2Key,
      nextEpoch: 2
    });

    const file1 = JSON.parse(fs.readFileSync(path.join(dir, "cat1-1.ec"), "utf8"));
    const file2 = JSON.parse(fs.readFileSync(path.join(dir, "cat2-1.ec"), "utf8"));
    const open1 = Srules.openSealed(epoch2Key, file1);
    const open2 = Srules.openSealed(epoch2Key, file2);
    const noOld1 = Srules.openSealed(epoch1Key, file1) == null;
    const noOld2 = Srules.openSealed(epoch1Key, file2) == null;

    return planted.hits >= 1 && planted.red && planted.back
      && r && r.epoch === 2 && Array.isArray(r.resealed) && r.resealed.length === 2
      && file1.epoch === 2 && file2.epoch === 2
      && open1 !== null && open2 !== null
      && JSON.parse(open1).id === "cat1" && JSON.parse(open2).id === "cat2"
      && noOld1 && noOld2;
  });

  if (PLANTS_OFF) skip("tr2k a plant that puts back the deletion of the floor at a newer epoch with no rev goes red on tr2j, and src/team.mjs comes"
    + " back by sha256 (red where the floor is raised nowhere but by a rev) (ETIUDA_PLANTS=off)");
  else await leg("tr2k a plant that puts back the deletion of the floor at a newer epoch with no rev goes red on tr2j, and src/team.mjs comes"
    + " back by sha256 (red where the floor is raised nowhere but by a rev)", async () => {
    let planted = { hits: 1, red: true, back: true, sha: "", detail: "" };
    if (!ONLY) {
      planted = plantRaise();
      process.stdout.write("       plant hits " + planted.hits + ", red " + planted.red + ", sha256 back " + planted.back
        + " " + planted.sha + (planted.detail ? " | " + planted.detail : "") + NL);
    }
    return planted.hits === 1 && planted.red && planted.back;
  });

  if (!ONLY && PLANTS_OFF) {
    skip("the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase (ETIUDA_PLANTS=off)");
  } else if (!ONLY) {
    const { treeSha } = await import("./plants-tree.mjs");
    check(treeSha(ROOT) === before, "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
  }
  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, ONLY ? "team-rev-plant" : "team-rev");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
  if (asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
    return 78;
  }
  process.stdout.write(NL + "team-rev  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(c => process.exit(c), e => {
  process.stderr.write(String(e && e.stack || e) + NL); process.exit(2);
});
