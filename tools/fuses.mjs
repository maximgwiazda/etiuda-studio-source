/* WHAT A BUILT BINARY'S FUSES SAY, against what electron-builder.js asks for.
 *
 *     node tools/fuses.mjs <path to Etiuda Studio.exe>
 *
 * electron-builder flips the fuses from `electronFuses`; this reads them back out of the file, so
 * a build whose binary disagrees is refused by tools/package.mjs rather than shipped. Exit 0 when
 * every fuse asked for is as asked, 1 with one line per difference, 2 when the file cannot be read
 * or has no wire. The refusals of two wires, of an empty ask and of a missing program are the
 * engine's tools/fuses.mjs (board 858, H3); tests/shell-guards.mjs 4 holds them here. */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/** The fuses electron-builder.js asks for, by electron-builder's own names. */
export function wantedFuses() {
  return Object.assign({}, require("../electron-builder.js").electronFuses || {});
}

/** One line per fuse in `want` that the binary at `exe` does not carry as asked; [] when all do.
 *  Throws where the file carries no fuse wire at all. A binary holding more than one wire is refused
 *  with one line, since the library reads the first and the program may run on another, and an ask
 *  of no fuses is refused, since it would pass every binary. */
export async function fuseProblems(exe, want) {
  if (!want || !Object.keys(want).length) return ["electron-builder.js asks for no fuse, so there is nothing to read the program against"];
  const { getCurrentFuseWire, FuseV1Options } = require("@electron/fuses");
  const { SENTINEL } = require("@electron/fuses/dist/constants");   // not exported by the package's index
  const bytes = await readFile(exe);
  let blocks = 0;
  for (let at = bytes.indexOf(SENTINEL); at > -1; at = bytes.indexOf(SENTINEL, at + 1)) blocks++;
  if (blocks > 1) return ["the program holds " + blocks + " fuse blocks where one is expected, so which one it runs on is not known"];
  const wire = await getCurrentFuseWire(exe);
  const out = [];
  for (const [name, on] of Object.entries(want)) {
    const at = FuseV1Options[name.charAt(0).toUpperCase() + name.slice(1)];
    if (at === undefined) { out.push(name + " is not a fuse @electron/fuses knows"); continue; }
    const is = wire[at] === 49 ? true : wire[at] === 48 ? false : null;
    if (is !== on) out.push(name + " is " + (is === null ? "not in the wire" : is ? "on" : "off")
      + " where electron-builder.js asks for it " + (on ? "on" : "off"));
  }
  return out;
}

/** The packaging step's question of the program it has just written. A program that is not there or
 *  cannot be read is a reason to refuse and never a pass: a build whose program is not where the step
 *  looks would otherwise ship with no fuse read at all. */
export async function packagedFuseProblems(exe, want) {
  const ask = want || wantedFuses();
  if (!existsSync(exe)) return [exe + " is not there, so no fuse was read from it"];
  try { return await fuseProblems(exe, ask); }
  catch (e) { return [exe + ": " + ((e && e.message) || e)]; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const exe = process.argv[2];
  const want = wantedFuses();
  fuseProblems(exe, want).then(bad => {
    for (const line of bad) console.error("fuses: " + exe + ": " + line);
    if (!bad.length) console.log("fuses: " + exe + " carries all " + Object.keys(want).length + " as asked");
    process.exit(bad.length ? 1 : 0);
  }, e => { console.error("fuses: " + exe + ": " + ((e && e.message) || e)); process.exit(2); });
}
