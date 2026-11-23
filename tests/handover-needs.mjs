/* A RELAY HANDOVER WHOSE OLD KEY IS GONE AFTER THE RELAY HAS TAKEN THE LEAD (board 931, handover 6).
 *
 *     node tests/handover-needs.mjs
 *
 * gate-kind: node
 *
 * The record of a relay handover sitting at step (iii) says the last step still needs the old
 * signing key, and the one line the Desks screen shows is that sentence. A handover still at
 * step (ii), and a folder handover, are not this case.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Relay from "../src/relay.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NL = "\n";
const EXPECTED = 1;
let asserted = 0, failed = 0;

function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}

const ho = {
  kind: "relay", step: "(iii)", team: "t-0123456789abcdef",
  oldKeyFile: "C:/keys/signing-key.old.json", rt: "ab".repeat(16),
};
const fn = Relay.handoverNeedsOldKey;
const got = typeof fn === "function" ? fn(ho) : null;
const said = got && got.said;
const early = typeof fn === "function" ? fn(Object.assign({}, ho, { step: "(ii)" })) : "missing";
const folder = typeof fn === "function" ? fn(Object.assign({}, ho, { kind: "folder" })) : "missing";
const ok = !!got
  && got.handover.step === "(iii)"
  && got.handover.kind === "relay"
  && got.handover.team === ho.team
  && got.handover.oldKeyFile === ho.oldKeyFile
  && /old signing key/.test(String(got.handover.needs || ""))
  && /team file/.test(String(got.handover.needs || ""))
  && said === Relay.HANDOVER_OLD_KEY_SAID
  /* The copywriter's line (2026-11-11, her first draft): the new key leads on the relay, the team file is not yet signed under
     it, and the way back is restoring the old key's backup copy by the Menu's path, after which Studio signs at once (board 984,
     the copywriter's fit d60a996ec). */
  && /new signing key already leads the team/.test(said)
  && /team file is not yet signed under it/.test(said)
  && /Once the old key's backup copy is restored, from the Menu, under Settings, then Signing key, Studio signs the team file and the handover ends\./.test(said)
  && !/at its next start/.test(said)
  && !/Studio cannot finish it/.test(said)
  && !/open Studio again|[Bb]ring the old/.test(said)
  && early === null
  && folder === null;

check(ok, "hn1 a relay handover at step (iii) with the old key gone records what that step still needs, and the Desks screen is given one line");
if (!ok) {
  process.stderr.write("       fn " + typeof fn
    + " needs " + JSON.stringify(got && got.handover && got.handover.needs)
    + " said " + JSON.stringify(said)
    + " early " + JSON.stringify(early)
    + " folder " + JSON.stringify(folder) + NL);
}

process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + NL);
if (asserted !== EXPECTED) {
  process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran" + NL);
  process.exitCode = 2;
} else if (failed) process.exitCode = 1;
