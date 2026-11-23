/* WHETHER A DENY BINDS THE ACCOUNT RUNNING THE TEST.
 *
 * A leg that seals a folder with an icacls deny ACE for the running account, and then asks Studio to
 * write, list or remove there, proves something only if that deny stops the account at all. On an
 * account whose token lets it past a deny (an administrator holding backup or restore rights, as a
 * hosted build machine's account may), the folder is not sealed, Studio's write simply succeeds, and
 * the leg would be red for the machine's reason, not Studio's.
 *
 * denyBinds(parent, user, aces, act) makes a fresh folder of its own under `parent`, denies `user`
 * each of `aces` there (icacls's own spellings, such as "(W)", "(RD)", "(OI)(IO)(D)"), and tries
 * `act(folder)` with plain node fs, nothing of Studio's. The deny binds when `act` throws. The deny
 * comes off and the folder goes before the answer is returned. Off Windows the answer is always
 * { binds: true }, since the legs seal with the file mode there.
 *
 * A leg that gets { binds: false } says SKIP with `why` and does not count the check; it never
 * passes it. Where the deny binds, as on the desk, the leg runs unchanged. */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PROBES = ["probe-written", "probe-removed"];

export function denyBinds(parent, user, aces, act) {
  if (process.platform !== "win32") return { binds: true, why: "" };
  const at = fs.mkdtempSync(path.join(parent, "deny-probe-"));
  const args = [at];
  for (const a of aces) args.push("/deny", user + ":" + a);
  let put = null, acted = false, code = "";
  try {
    put = spawnSync("icacls", args, { encoding: "utf8", windowsHide: true });
    if (put.status === 0) {
      try { act(at, PROBES); acted = true; }
      catch (e) { code = (e && e.code) || String(e); }
    }
  } finally {
    spawnSync("icacls", [at, "/remove:d", user], { encoding: "utf8", windowsHide: true });
    for (const n of PROBES) { try { fs.unlinkSync(path.join(at, n)); } catch { /* not made, or made and gone */ } }
    try { fs.rmdirSync(at); } catch { /* left for the leg's own scratch drop */ }
  }
  if (!put || put.status !== 0) {
    return { binds: false, why: "icacls could not deny " + aces.join(" ") + " to " + user + " (exit " + (put ? put.status : "none") + ")" };
  }
  if (acted) {
    return { binds: false, why: "a deny of " + aces.join(" ") + " to " + user + " does not stop that account on this machine"
      + " (plain node fs did what the deny forbids), so a folder sealed this way is not sealed here" };
  }
  return { binds: true, why: "", code };
}

/* The three acts the legs seal against: a file written in the folder, the folder listed, and a file
   made in it then removed. */
export const WRITE = (d, names) => fs.writeFileSync(path.join(d, names[0]), "x");
export const LIST = (d) => fs.readdirSync(d);
export const REMOVE = (d, names) => {
  const f = path.join(d, names[1]);
  fs.writeFileSync(f, "x");
  fs.unlinkSync(f);
};
