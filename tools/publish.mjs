/* PUBLISH A PROJECT FROM THE COMMAND LINE, until the Studio screens arrive.
 *
 *     node tools/publish.mjs <project folder> [--notes "..."] [--notes-file <f>]
 *                            [--override "..."] [--folder <where the .ec goes>] [--now <ISO>]
 *                            [--key <signing key file>] [--passphrase-file <f>]
 *
 * IT SIGNS ONLY WHEN ASKED, and it refuses rather than publishing unsigned where a key was
 * named and its passphrase was not given: naming a key is saying what this file is for.
 *
 * THE PASSPHRASE NEVER ARRIVES AS AN ARGUMENT. There is no --passphrase, on purpose: an
 * argument list is readable by any other process on the machine for as long as this one runs,
 * and a person's own shell history keeps it afterwards. STUDIO_KEY_PASSPHRASE or a file, and
 * the file is read and nothing more - it is not deleted, because deleting a person's file is
 * not this program's decision to take.
 *
 * A project folder holds `project.json` and `draft.json`. The draft is what the importer wrote
 * (or what the authoring screens will write); the project file carries the id, the name, the
 * revision and the last edition, and this command moves those two forward.
 *
 * IT REFUSES ON A LINT ERROR. `--override` takes a note explaining why this revision goes out
 * anyway; the note is written into the archive beside the catalog and printed at the head of
 * the release notes, so the decision travels with the file rather than living in somebody's
 * memory of an evening. A LANGUAGE AWAITING TEXT IS NOT AN ERROR AND DOES NOT REFUSE (board
 * 510): it is printed, per language, and the release notes carry the same count.
 *
 * EXIT CODES: 0 published, 1 refused by the lint (nothing written), 2 anything else.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publishFull, editionsIn, archivedCatalog } from "../src/publish.mjs";

function die(code, line) { process.stderr.write("publish  " + line + "\n"); process.exit(code); }

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
  if (!args._.length) die(2, "usage: node tools/publish.mjs <project folder> [--notes \"...\"]"
    + " [--notes-file <f>] [--override \"...\"] [--folder <dir>] [--now <ISO>]");
  const project = path.resolve(args._[0]);
  if (!fs.existsSync(project)) die(2, "no project folder at " + project);

  let notes = typeof args.notes === "string" ? args.notes : null;
  if (typeof args["notes-file"] === "string") {
    if (!fs.existsSync(args["notes-file"])) die(2, "no notes file at " + args["notes-file"]);
    notes = fs.readFileSync(args["notes-file"], "utf8");
  }

  if (args.passphrase !== undefined)
    die(2, "there is no --passphrase: an argument list is readable by every process on this"
      + " machine. Use --passphrase-file <f>, or set STUDIO_KEY_PASSPHRASE");
  const key = typeof args.key === "string" ? args.key : null;
  let passphrase = process.env.STUDIO_KEY_PASSPHRASE || null;
  if (typeof args["passphrase-file"] === "string") {
    if (!fs.existsSync(args["passphrase-file"]))
      die(2, "no passphrase file at " + args["passphrase-file"]);
    /* The trailing newline an editor adds is not part of a passphrase anybody typed, and a
       passphrase that fails because of an invisible byte is the least debuggable refusal in
       this program. Inner spaces are kept: they are a person's own choice. */
    passphrase = fs.readFileSync(args["passphrase-file"], "utf8").replace(/\r?\n$/, "");
  }

  const before = editionsIn(project);
  let done;
  try {
    done = await publishFull({
      project,
      folder: typeof args.folder === "string" ? args.folder : project,
      notes,
      override: typeof args.override === "string" ? args.override : null,
      now: typeof args.now === "string" ? args.now : null,
      key, passphrase,
    });
  } catch (e) {
    if (e && e.refusal === "lint") die(1, e.message);
    die(2, e && e.message ? e.message : String(e));
  }

  const say = l => process.stdout.write("publish  " + l + "\n");
  /* The earlier edition by its rev and its date, where its archived catalog gives a rev (board 902, condition 5). */
  const prev = before.length ? before[before.length - 1] : null;
  let prevRev = null;
  try { const c = prev ? archivedCatalog(project, prev) : null; prevRev = c && c.rev != null && Number.isFinite(+c.rev) ? +c.rev : null; }
  catch { prevRev = null; }
  say("rev " + done.rev + " (" + done.edition + ")"
    + (prev ? ", after " + (prevRev == null ? prev : "rev " + prevRev + " (" + prev + ")") : ", the first edition")); /* plant:txrd-rd11-2 */
  say(done.counts.cards + " card(s), " + done.counts.macros + " macro(s), "
    + done.counts.intents + " intent(s), " + done.counts.cats + " category/ies");
  say("lint: " + done.lint.errors.length + " error(s), " + done.lint.warnings.length
    + " warning(s)" + (done.report.override && done.lint.errors.length
      ? " - PUBLISHED OVER THE ERRORS ON AN OVERRIDE NOTE" : ""));
  /* WHAT IT IS AWAITING, PER LANGUAGE, on its own line since 510: the state does not refuse and
     so it has to be said where a refusal would have been read. The counts are the report's. */
  (done.awaiting || []).forEach(a => say("awaiting: " + a.lang
    + (a.cards == null ? "" : ", " + a.cards + " card(s) lacking text")));
  say(done.sig ? "signed " + done.sig.alg + " with key " + done.sig.keyId : "unsigned");
  say("against " + (done.report.previous || "nothing") + ": " + done.report.diff);
  say("wrote " + done.ec);
  /* THE RING IS A FILE THIS COMMAND WROTE AND THE PERSON HAS TO CARRY SOMEWHERE, so it is said
     rather than left to be discovered in a folder listing. */
  if (done.ring) say((done.ring.added ? "ring " : "ring unchanged ") + done.ring.file + ", "
    + done.ring.entries + " entr" + (done.ring.entries === 1 ? "y" : "ies")
    + "; carry it to the desk's catalog folder yourself");
  say("archived " + done.archive);
  say("release notes " + done.releaseNotes);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => die(2, e && e.stack ? e.stack : String(e)));

export { parse };
