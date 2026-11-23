/* A LICENCE A PAYING LEAD HOLDS, FOR A LEG THAT PUBLISHES THROUGH THE NODE MODULES (Max, 2026-11-17 20:41: a paid licence that ends stops
 * Studio, so there is no period of use without one). A publish with no licence file refuses, so a leg that publishes and says nothing of
 * licences puts one beside it first:
 *
 *     import "./licensed-env.mjs";                       // the whole process: STUDIO_LICENSE_FILE and STUDIO_VENDOR_KEY, which a
 *                                                         // development tree honours (src/licence.mjs contextFor, src/publish.mjs licenceFileFor)
 *     import { licensedOpts } from "./licensed.mjs";     // one call: publishProject(dir, { ...(await licensedOpts()), notes })
 *
 * The licence is paid (updates until 2099), signed by a throwaway root made here and written under scratch/. A paid file has no end and
 * reads the same on any clock a leg sets (tests/licence-handling.mjs 16b), which is why it is not a trial. Node builtins and
 * src/licence.mjs only.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let made = null;

/** { licenceFile, trustedKey }: the options publishFull and publishProject take for a licence this process signed. */
export async function licensedOpts() {
  if (made) return made;
  const L = await import(pathToFileURL(path.join(ROOT, "src", "licence.mjs")).href);
  const pair = crypto.generateKeyPairSync("ed25519");
  const doc = await L.createTestLicence({ org: "Test Org", seats: 1, issued: "2026-01-01", updatesUntil: "2099-01-01" }, pair.privateKey, "test-root");
  const dir = path.join(ROOT, "scratch", "licensed-" + process.pid);
  fs.mkdirSync(dir, { recursive: true });
  const licenceFile = path.join(dir, "etiuda-studio-license.js");
  fs.writeFileSync(licenceFile, "window.E_LICENSE = " + JSON.stringify(doc, null, 1) + ";\n");
  made = { licenceFile, trustedKey: pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex") };
  return made;
}
