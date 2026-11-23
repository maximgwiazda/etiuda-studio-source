/* HOW THIS TREE RUNS WRANGLER (board 936, S7): the argument list for one wrangler command, run by this very node and never
 * through a shell.
 *
 *     import { wranglerArgv, WRANGLER_VERSION } from "./wrangler.mjs";
 *     const argv = wranglerArgv(["secret", "put", "HASH_KEY", "--config", toml], { wrangler });
 *     child_process.spawnSync(process.execPath, argv, ...);
 *
 * Studio carries no wrangler of its own (package.json names none), so a command runs either the wrangler entry script a
 * caller names (`wrangler`, a path to wrangler's bin/wrangler.js, which the legs use for a stand-in) or npm's own npx script
 * beside this node, asking for exactly WRANGLER_VERSION, the version on the office's desk on 2026-10-25. Node, not a shell:
 * since node 18.20.2 a .cmd file is run only through a shell, and a shell is one more place an argument is read again. No
 * argument here ever holds a secret; a secret reaches wrangler on its stdin (tools/sign.mjs secrets).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const WRANGLER_VERSION = "4.151.0";

/** npm's npx script beside the node running this, on Windows and on Linux or macOS alike; null where there is none. */
export function npxScript() {
  const bin = path.dirname(process.execPath);
  for (const at of [path.join(bin, "node_modules", "npm", "bin", "npx-cli.js"),
    path.join(bin, "..", "lib", "node_modules", "npm", "bin", "npx-cli.js")]) if (fs.existsSync(at)) return at;
  return null;
}

/* A SECRET FROM THE WINDOWS KEYRING, read the way the office's own tools read one: Python's keyring, keyring.get_password
   (service, user). The service and the user reach the script as its arguments, never inside its code, and the value comes
   back on its stdout into this process's memory alone: never printed, never in an environment, never an argument. The
   reader is a parameter and nothing else (the test architect's E3 on S7): nothing in the environment can name another, since
   whatever reads the entry decides whose Cloudflare account the service's secrets are put into. A leg hands a stand-in in its
   own process, so no test ever opens the real keyring. `python` is the one found on PATH, with its keyring module. */
const KEYRING_PY = "import sys, keyring\nv = keyring.get_password(sys.argv[1], sys.argv[2])\nsys.stdout.write((v or '').strip())\n";

/** Python's keyring, asked for `service`/`user`: spawnSync's answer, its stdout the value. */
export function pythonKeyring(service, user) {
  const env = Object.assign({}, process.env);
  delete env.STUDIO_KEY_PASSPHRASE;
  return spawnSync("python", ["-c", KEYRING_PY, service, user], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env, windowsHide: true, timeout: 30000 });
}

/** {value} for the keyring entry `service`/`user` (an empty string where it is empty or missing), or {error}, a sentence
 *  that names the entry and never a value. `reader(service, user)` answers as spawnSync does ({status, stdout, error}); it is
 *  Python's keyring unless a caller in this very process hands another. */
export function readKeyring(service, user, reader) {
  const r = (typeof reader === "function" ? reader : pythonKeyring)(service, user); /* plant:e3-reader */
  if (r.error || r.status !== 0)
    return { error: "the keyring entry " + service + "/" + user + " could not be read: Python's keyring did not answer"
      + (r.error ? " (" + r.error.code + ")" : " (exit " + r.status + ")") };
  return { value: String(r.stdout || "").trim() };
}

/** The argument list for `process.execPath` that runs wrangler with `args`: the named entry script, else npx asking for
 *  WRANGLER_VERSION. Throws, in a sentence, where neither can be found. */
export function wranglerArgv(args, o) {
  const opts = o || {};
  if (typeof opts.wrangler === "string") {
    if (!fs.existsSync(opts.wrangler)) throw new Error("there is no wrangler entry script at " + opts.wrangler);
    return [path.resolve(opts.wrangler)].concat(args);
  }
  const npx = npxScript();
  if (!npx) throw new Error("npm's npx is not beside this node; name wrangler's bin/wrangler.js with --wrangler <file>");
  return [npx, "--yes", "wrangler@" + WRANGLER_VERSION].concat(args);
}
