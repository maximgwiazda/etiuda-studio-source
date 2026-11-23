/* Imported first by every Studio leg that loads shell/main.js (tests/reg-stand-held.mjs holds the list): installs tests/reg-stand.cjs
 * over node:child_process before anything else loads, so src/ai-policy.cjs's reg query never reaches this computer's registry. One
 * instance per process; a leg that scripts a policy imports `regStand` and calls its setPolicy. A reg call that went past the
 * stand-in fails the leg at its exit, whatever the leg's own count said. */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const regStand = require("./reg-stand.cjs").regStand(require("node:child_process"));
export const { queryText } = require("./reg-stand.cjs");
process.on("exit", () => {
  if (regStand.held()) return; /* plant:rs-exit */
  console.log("  FAIL reg-stand: a reg call reached this computer's registry (" + regStand.said() + ")");
  process.exitCode = process.exitCode || 1;
});
