/* A STUDIO THAT WORKS, AS A LEAD'S DOES, FOR A LEG THAT LOADS THE SHELL (the gate; Max 2026-11-17 19:35, of Studio: "sign in first,
 * one 14 day trial, nothing before it"). A Studio nobody signed in to, or one with no licence it can use, answers every closed channel
 * in a sentence marked as a stop, so a leg that asks one of those puts its profile in the state a lead's is in first: a licence
 * file signed by a throwaway root, STUDIO_VENDOR_KEY naming that root, and licence-service.json as a sign-in leaves it.
 *
 *     const env = await seatEnv(userDataFolder, true, legEnv);   // writes the two files; the environment to add to the shell's
 *     await seatEnv(userDataFolder, "ended", legEnv);            // the same with the trial ended in January: signed in, and stopped
 *     await seatEnv(userDataFolder, false);                      // takes them out, so the same profile opens stopped
 *
 * A leg that has written licence-service.json or the licence file before it loads keeps what it wrote, whatever it is; the seat fills in only what is absent.
 * A leg that names a licence file of its own (STUDIO_LICENSE_FILE or STUDIO_LICENCE_FILE in legEnv) has that file hold the licence,
 * and the returned environment names no file. A leg whose own root the shell already trusts (STUDIO_VENDOR_KEY in legEnv) hands that
 * root's private half as signWith, and the licence is signed by it, the leg's environment left as it is. The trial runs seven more
 * days. An installed copy cannot be seated: it ignores every variable that moves a trust root (tests/shell-guards.mjs section 6), and
 * a leg that asks one stands its gate open in the copy (standGateOpen) instead. Node builtins only.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const SEAT = { pair: crypto.generateKeyPairSync("ed25519"), text: null, ended: null };

export const SEAT_ROOT = SEAT.pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");

/* A service state the leg already wrote (a sign-in with more fields than the seat's two, an activation by key or address) is kept as it is:
   the seat writes one only where there is none. */
function signedAlready(service) { return fs.existsSync(service); }
/* A licence file the leg left empty (section 6 plants an empty one to see the shell take its path) is as good as none. */
function absent(file) { try { return fs.statSync(file).size === 0; } catch { return true; } }

export async function seatEnv(ud, works, legEnv, signWith) {
  const own = (legEnv && (legEnv.STUDIO_LICENSE_FILE || legEnv.STUDIO_LICENCE_FILE)) || "";
  const service = path.join(ud, "licence-service.json"), file = own || path.join(ud, "etiuda-studio-license.js");
  if (!works) { fs.rmSync(service, { force: true }); fs.rmSync(file, { force: true }); return {}; }
  const L = await import(pathToFileURL(path.join(SRC, "licence.mjs")).href);
  const theirs = !!(legEnv && legEnv.STUDIO_VENDOR_KEY && signWith);
  const made = async (issued, ends) => "window.E_LICENSE = " + JSON.stringify(
    await L.createTestTrialLicence({ issued, ends }, theirs ? signWith : SEAT.pair.privateKey, theirs ? "etiuda-root" : "test-root"), null, 1) + ";\n";
  const day = new Date().toISOString().slice(0, 10), over = Date.now() + 7 * 86400000;
  let text = null;
  if (works === "ended") text = SEAT.ended || (SEAT.ended = await made("2026-01-01", Date.parse("2026-01-15T00:00:00Z")));
  else text = theirs ? await made(day, over) : (SEAT.text || (SEAT.text = await made(day, over)));
  fs.mkdirSync(ud, { recursive: true });
  if (!signedAlready(service)) fs.writeFileSync(service, JSON.stringify({ by: "signin", provider: "microsoft" }));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (works === "ended" || absent(file)) fs.writeFileSync(file, text);
  return { ...(theirs ? {} : { STUDIO_VENDOR_KEY: SEAT_ROOT }), ...(own ? {} : { STUDIO_LICENSE_FILE: file, STUDIO_LICENCE_FILE: null }) };
}

/* A copy of the shell (a folder named app.asar) whose gate answers true: for a leg about something else that asks it a closed channel. */
export function standGateOpen(main) {
  const text = fs.readFileSync(main, "utf8"), at = "async function worksNow() {";
  if (text.split(at).length !== 2) throw new Error("the copy has no one worksNow to stand open: " + main);
  fs.writeFileSync(main, text.replace(at, () => "async function worksNow() { return true; }\nasync function worksNowJudged() {"));
}

/* The same for a leg whose shell loader is not async: a running trial (the throwaway root's, whatever the leg's), written at once. */
const LIC = await import(pathToFileURL(path.join(SRC, "licence.mjs")).href);
const NOW_TEXT = "window.E_LICENSE = " + JSON.stringify(await LIC.createTestTrialLicence(
  { issued: new Date().toISOString().slice(0, 10), ends: Date.now() + 7 * 86400000 }, SEAT.pair.privateKey, "test-root"), null, 1) + ";\n";
export function seatEnvSync(ud, legEnv) {
  const own = (legEnv && (legEnv.STUDIO_LICENSE_FILE || legEnv.STUDIO_LICENCE_FILE)) || "";
  const file = own || path.join(ud, "etiuda-studio-license.js");
  fs.mkdirSync(ud, { recursive: true });
  if (!signedAlready(path.join(ud, "licence-service.json"))) fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (absent(file)) fs.writeFileSync(file, NOW_TEXT);
  return { STUDIO_VENDOR_KEY: SEAT_ROOT, ...(own ? {} : { STUDIO_LICENSE_FILE: file, STUDIO_LICENCE_FILE: null }) };
}
