/* THE DESKS' STATISTICS, FROM THE COMMAND LINE, OPENED WITH THE LEAD'S BOX.
 *
 *     node tools/stats-read.mjs <project folder> --key <signing key file> [--passphrase-file <f>]
 *
 * THE ANSWER IS src/studio.mjs statsFor's, the one the Statistics section paints: the project's own
 * folder, the team this key leads there, and each roster desk's desks/<branch id>/stats.estat opened
 * with the lead's box and counted only where the roster's key for that folder signed it. This file is
 * the printing and the exit code and nothing else, so the table a script reads and the table a person
 * reads are one table and not two that agree; tests/stats-screen.mjs holds the two doors to it.
 *
 * WHAT IT PRINTS, in blocks separated by a blank line: the desks' table (src/stats.mjs HEAD and
 * rowOf), the team's figures and the four aggregate views (viewBlocks), and last the roster desks
 * with no new figures, by their roster names, as the screen names them. A desk's row carries its
 * edition and its declared period, never its counts or its sync (ruling of 2026-09-23 02:08).
 *
 * THE PASSPHRASE NEVER ARRIVES AS AN ARGUMENT, as in tools/publish.mjs: STUDIO_KEY_PASSPHRASE or
 * --passphrase-file. A key this computer's keyring keeps opens only inside Studio.
 *
 * IT WRITES ONE FILE, AS THE SCREEN DOES: where no stats-span.json verifies under this key, statsFor
 * writes the rolling thirty days, signed, so the desks count a period the lead chose.
 *
 * EXIT: 0 printed, 1 an answer refused for keys outside the ruled nouns (its two lines on stderr),
 * 2 usage, no key, a key that does not open, no team this key leads in the project's folder, or a
 * read that threw. A team with no live answers prints the header and what the views could not see,
 * which is the ordinary state, not an error.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { statsFor } from "../src/studio.mjs";
import { readKeyFile, OS_WRAP } from "../src/sign.mjs";
import { blockLines } from "../src/stats.mjs";

const USAGE = "usage: node tools/stats-read.mjs <project folder> --key <signing key file>"
  + " [--passphrase-file <f>]";

function die(code, line) { process.stderr.write("stats-read  " + line + "\n"); process.exit(code); }

function parse(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) out[a.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith("--"))
      ? argv[++i] : true;
    else out._.push(a);
  }
  return out;
}

async function main(argv) {
  const args = parse(argv);
  if (!args._.length) die(2, USAGE);
  const project = path.resolve(args._[0]);
  if (args.passphrase !== undefined)
    die(2, "there is no --passphrase: an argument list is readable by every process on this"
      + " machine. Use --passphrase-file <f>, or set STUDIO_KEY_PASSPHRASE");
  if (typeof args.key !== "string")
    die(2, "the answers are sealed to the lead's box, which opens with the lead's signing key: --key <file>");
  let read = null;
  try { read = readKeyFile(args.key); } catch (e) { die(2, e && e.message ? e.message : String(e)); }
  if (!read) die(2, "no signing key at " + path.resolve(args.key));
  if (read.kept === OS_WRAP)
    die(2, "this signing key is kept by this computer's keyring and opens only inside Studio");
  let passphrase = process.env.STUDIO_KEY_PASSPHRASE || "";
  if (typeof args["passphrase-file"] === "string") {
    if (!fs.existsSync(args["passphrase-file"]))
      die(2, "no passphrase file at " + args["passphrase-file"]);
    passphrase = fs.readFileSync(args["passphrase-file"], "utf8").replace(/\r?\n$/, "");
  }
  if (!passphrase) die(2, "the signing key needs its passphrase: --passphrase-file <f>, or STUDIO_KEY_PASSPHRASE");

  let got;
  try { got = await statsFor(project, { key: read.file, passphrase }); }
  catch (e) { die(2, e && e.message ? e.message : String(e)); }
  if (!got.folder) die(2, "the project at " + project + " has no folder yet, so no desk has answered it");
  if (got.refusal) die(2, got.refusal);
  /* statsFor answers with an empty head only where the key opened and no team it leads is in the folder. */
  if (!got.head.length) die(2, "no team this key leads is in " + got.folder + ", so nothing opens");
  if (got.refused.length) {
    for (const r of got.refused) for (const line of r.lines) process.stderr.write("stats-read  " + line + "\n");
    process.exit(1);
  }
  const lines = [got.head.join("\t")].concat(got.rows.map((r) => r.cells.join("\t")));
  (got.blocks || []).forEach((b) => {
    lines.push("");
    blockLines(b).forEach((l) => lines.push(l));
  });
  lines.push("");
  lines.push("no new figures: " + got.quiet.length);
  got.quiet.forEach((q) => lines.push(q.desk));
  process.stdout.write(lines.join("\n") + "\n");
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch((e) => die(2, e && e.stack ? e.stack : String(e)));
