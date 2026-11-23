/* THE SAMPLE THE ENGINE SHIPS, AT STUDIO'S PIN (2026-09-25).
 *
 * Three files read "the shipped sample": tests/import.mjs, tests/import-model.mjs and
 * tests/import-oracle.mjs. They read sample-catalog.ec out of ETIUDA_FIXTURES, which was the
 * letters set on the night the engine at Studio's pin began shipping Mirabelka, and nothing
 * compared the two. The sample is not content a fixtures folder must keep out of a tree: it ships,
 * as shell/sample-catalog.ec in the engine at the commit Studio pins. So it is read from there, the
 * way tools/engine-fetch.mjs reads every pinned file (`git cat-file blob` from the engine
 * repository, the sibling checkout first, no end-of-line filter), and a pin move carries the
 * sample with it.
 *
 * NOT ADDED TO tools/engine-modules.txt, because everything that list fetches ships inside
 * Studio's installer (electron-builder.js takes engine/pinned/**), and the sample is a test's
 * input rather than Studio's.
 *
 * shippedSample() writes the bytes to scratch/shipped-sample/sample-catalog.ec (scratch/ is
 * ignored here) and says where. It throws engine-fetch's Refusal where there is no engine
 * repository, no commit or no such file, because a leg that means the shipped sample must not
 * quietly read another one.
 *
 * sampleIsShipped(file) is the leg's question, asked by a second route: the git blob id of the
 * file a test actually read, against the id git gives the path in the pin's tree. */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readPin, engineRepo, hasCommit, resolve, blob, gitText, ROOT, Refusal } from "../tools/engine-fetch.mjs";

export const SAMPLE_IN_ENGINE = "shell/sample-catalog.ec";

function pinned() {
  const { pin } = readPin(path.join(ROOT, "tools", "engine-pin"));
  const repo = engineRepo();
  if (!hasCommit(repo.dir, pin))
    throw new Refusal(4, "the engine repository at " + repo.dir + " has no commit " + pin);
  return { pin, repo };
}

export function shippedSample() {
  const { pin, repo } = pinned();
  const [[, sha]] = resolve(repo.dir, pin, [SAMPLE_IN_ENGINE]);
  const dir = path.join(ROOT, "scratch", "shipped-sample");
  fs.mkdirSync(dir, { recursive: true });
  const at = path.join(dir, "sample-catalog.ec");
  fs.writeFileSync(at, blob(repo.dir, sha));
  return { at, pin, blob: sha, how: repo.how };
}

export function sampleIsShipped(file) {
  const { pin, repo } = pinned();
  const want = gitText(repo.dir, ["rev-parse", pin + ":" + SAMPLE_IN_ENGINE]).out.trim();
  const h = spawnSync("git", ["hash-object", "--no-filters", file], { encoding: "utf8" });
  const got = String(h.stdout || "").trim();
  return { ok: !!file && /^[0-9a-f]{40}$/.test(want) && got === want, got, want, pin: pin.slice(0, 7) };
}
