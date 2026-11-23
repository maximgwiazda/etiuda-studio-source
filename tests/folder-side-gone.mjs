/* STUDIO NO LONGER READS THE ENGINE'S SHARED-FOLDER SYNCER OR ITS FOLDER INVITATION (folder removal, Studio's side of P2 and P3;
 * Max, 2026-11-22 15:37, of the shared folder: "remove it, burn it with fire"; and 2026-11-23 09:23 and 09:24: before the first sale
 * nothing is built, held or kept for an older build). The engine's two cuts take out shell/folder/ (the syncer and its worker) and
 * the function `inviteFolder` that the invitation's reader called; the pin moves past them only if Studio asks for neither.
 *
 *     node tests/folder-side-gone.mjs        exit code is the number of failed checks, capped at 63
 *
 * fsg1 no list, reader or leg of Studio names the syncer: tools/engine-modules.txt, tests/shell-shipped.mjs, src/engine.mjs and
 *      tests/desk-listed-stand.mjs say nothing of shell/folder, and the folder checks (folderRules) carry no syncer and no paths
 * fsg2 on a pin with no shell/folder/ at all (a scratch copy of src/ and engine/pinned/ without it), the folder checks, the
 *      invitation's rules, the place rules and the join rules still load, and a relay invitation reads
 * fsg3 the invitation's slice asks for `inviteFolder` (and the two pure place rules and placeKept its reader called for it) only
 *      of a pin that has it: a text with no such function slices, a text with it slices it too
 * fsg4 the place rules hand back what Studio calls and nothing else (placeOf, placeResolve, syncRootsFrom, readSyncRecords,
 *      driveSeen): placeCandidates, placeKept and placeJoin are the pin's own business inside placeResolve
 * and, in a scratch copy, plant:fsg-syncer turns fsg2 red, plant:fsg-invite-folder turns fsg3 red
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const EXPECTED = 7;
const ONLY = process.env.FOLDER_SIDE_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0;
function check(ok, line) { asserted++; if (ok) console.log("  ok   " + line); else { failed++; console.log("  FAIL " + line); } }
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
const only = (id) => !ONLY || ONLY === id;
const LAB = path.join(os.tmpdir(), "etiuda-folder-side-" + crypto.randomBytes(4).toString("hex"));
let exitCode = 0;

try {
  const Engine = await import(pathToFileURL(path.join(ROOT, "src", "engine.mjs")).href);

  /* fsg1 */
  if (only("fsg1")) {
    const named = ["tools/engine-modules.txt", "tests/shell-shipped.mjs", "src/engine.mjs", "tests/desk-listed-stand.mjs"]
      .filter((f) => /shell[\\/]folder|syncer(-worker)?\.cjs|createFolderProgram|folderMirrorOf/.test(fs.readFileSync(path.join(ROOT, f), "utf8")));
    const F = Engine.folderRules();
    check(named.length === 0 && !("syncer" in F) && !("paths" in F) && typeof F.teamWhole === "function" && typeof F.catalogSigValid === "function",
      "fsg1 no list, reader or leg of Studio names the pinned syncer, and folderRules carries the checks (teamWhole, catalogSigValid) with no syncer and no paths: named in "
      + JSON.stringify(named) + ", keys " + JSON.stringify(Object.keys(F)));
  }

  /* fsg2: a pin with no shell/folder. */
  if (only("fsg2")) {
    const tree = path.join(LAB, "tree");
    fs.mkdirSync(path.join(tree, "engine"), { recursive: true });
    fs.cpSync(path.join(ROOT, "src"), path.join(tree, "src"), { recursive: true });
    fs.cpSync(path.join(ROOT, "engine", "pinned"), path.join(tree, "engine", "pinned"), { recursive: true });
    fs.rmSync(path.join(tree, "engine", "pinned", "shell", "folder"), { recursive: true, force: true });
    const child = path.join(LAB, "child.mjs");
    const rt = "a".repeat(32), team = "t-" + "b".repeat(16);
    fs.writeFileSync(child, [
      'import { pathToFileURL } from "node:url";',
      'import path from "node:path";',
      "const E = await import(pathToFileURL(" + JSON.stringify(path.join(tree, "src", "engine.mjs")) + ").href);",
      "const out = {};",
      "const F = E.folderRules(), I = E.inviteRules(), P = E.placeRules(), J = E.joinRules();",
      "out.folder = typeof F.teamWhole === 'function' && typeof F.catalogSigValid === 'function';",
      "out.join = typeof J.joinGenuine === 'function';",
      "out.place = !!P && typeof P.placeResolve === 'function';",
      "const doc = { team: " + JSON.stringify(team) + ", relay: { rt: " + JSON.stringify(rt) + ", url: 'https://etiuda.dev/relay/v1', token: '" + "c".repeat(64)
        + "', inv: '" + "d".repeat(32) + "' }, lead: { keyId: 'k-0123456789abcdef', public: '" + "e".repeat(64) + "', name: 'Lead' }, secret: '" + "f".repeat(32) + "' };",
      "const blob = 'etiuda-join:' + Buffer.from(JSON.stringify(doc)).toString('base64url');",
      "const back = I.inviteRead(blob, false);",
      "out.read = !!back && back.team === doc.team && !!back.relay && back.relay.rt === doc.relay.rt && back.secret === doc.secret;",
      "console.log(JSON.stringify(out));",
    ].join("\n"), "utf8");
    const run = spawnSync(process.execPath, [child], { cwd: tree, encoding: "utf8", timeout: 60000 });
    let got = null;
    try { got = JSON.parse(String(run.stdout || "").trim().split("\n").pop()); } catch (e) { got = null; }
    check(run.status === 0 && !!got && got.folder === true && got.join === true && got.place === true && got.read === true,
      "fsg2 on a pin with no shell/folder, folderRules, inviteRules, placeRules and joinRules load and a relay invitation reads: "
      + (got ? JSON.stringify(got) : "status " + run.status + " " + String(run.stderr || "").split("\n").filter((l) => /Error|Cannot/.test(l)).slice(0, 2).join(" / ").slice(0, 300)));
  }

  /* fsg3: the invitation's slice, over two stand-in texts (a model of a pin's shell, not a copy of the engine's). */
  if (only("fsg3")) {
    const base = [
      "const SEALED_TEAM_RE = /^t-[0-9a-f]{16}$/;",
      "const INVITE_HIDDEN_RE = /[\\u200b]/;",
      "function memberProof(secret, commit) { return 'p'; }",
      "function inviteIdOf(secret) { return 'i'; }",
      "function inviteRelay(r) { return r; }",
      "function teamChannelOf(t) { return null; }",
    ];
    const without = base.concat(["function inviteRead(text) { return { folder: null }; }"]).join("\n");
    const withIt = base.concat([
      "function placeKindOk(k) { return true; }", "function placeSlash(s) { return s; }", "function placeKept(p) { return p; }",
      "function inviteFolder(f) { return 'F:' + f; }",
      "function inviteRead(text) { return { folder: inviteFolder(text) }; }",
    ]).join("\n");
    let a = null, b = null, errA = "", errB = "";
    try { a = Engine.inviteRulesFrom(without, "a stand-in without inviteFolder").inviteRead("x"); } catch (e) { errA = e.message; }
    try { b = Engine.inviteRulesFrom(withIt, "a stand-in with inviteFolder").inviteRead("x"); } catch (e) { errB = e.message; }
    check(!errA && !!a && a.folder === null && !errB && !!b && b.folder === "F:x",
      "fsg3 the invitation's rules slice a text with no inviteFolder, and slice it and the place rules it called from a text that has them: without "
      + (errA || JSON.stringify(a)) + ", with " + (errB || JSON.stringify(b)));
  }

  /* fsg4 */
  if (only("fsg4")) {
    const P = Engine.placeRules();
    const keys = P ? Object.keys(P).filter((k) => k !== "from").sort() : [];
    check(!!P && JSON.stringify(keys) === JSON.stringify(["driveSeen", "placeOf", "placeResolve", "readSyncRecords", "syncRootsFrom"]),
      "fsg4 the place rules hand back what Studio calls (placeOf, placeResolve, syncRootsFrom, readSyncRecords, driveSeen) and no other: " + JSON.stringify(keys));
  }

  /* The two guards, each lifted in a scratch copy. */
  if (!ONLY) copyPlants({
    root: ROOT, self: SELF, label: "folder-side-gone", onlyVar: "FOLDER_SIDE_ONLY", timeout: 180000,
    plants: [
      { mark: "fsg-syncer", leg: "fsg2", rel: "src/engine.mjs", line: "  FOLDER.syncer = require(at(\"shell\", \"folder\", \"syncer.cjs\")); return FOLDER;" },
      { mark: "fsg-invite-folder", leg: "fsg3", rel: "src/engine.mjs", line: "const inviteDeclsFor = (src) => INVITE_DECLS.concat(INVITE_FOLDER_DECLS);" },
    ],
    check, skip: (line) => { asserted++; console.log("  skip " + line + (PLANTS_OFF ? "" : " (plants on, yet skipped)")); },
  });

  if (ONLY) { exitCode = Math.min(failed, 63); }
  else {
    console.log("#counts checks=" + asserted + " skipped=0 failed=" + failed + " expected=" + EXPECTED);
    if (asserted < EXPECTED) { console.log("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran"); exitCode = 78; }
    else {
      console.log(failed ? "  RESULT: FAIL " + failed + " of " + asserted : "  RESULT: ok " + asserted + " check(s)");
      exitCode = Math.min(failed, 63);
    }
  }
} catch (e) {
  console.log("FAIL folder-side-gone threw: " + (e && e.stack ? e.stack : e));
  exitCode = 1;
} finally {
  dropScratch(LAB, "folder-side-gone");
}
process.exit(exitCode);
