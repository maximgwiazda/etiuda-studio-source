/* THE REVIEW QUEUE FROM THE COMMAND LINE, until the Studio screens arrive. Course node 9.
 *
 *     node tools/review.mjs <project folder> <exported file>
 *          [--from "..."] [--note "..."]
 *          [--decisions <file>] [--accept <key>] [--reject <key>]
 *          [--accept-all] [--reject-all] [--again] [--dry-run] [--paths] [--now <ISO>]
 *
 * With no decision at all it prints the queue and writes nothing, which is what reviewing a
 * proposal starts as: read it, then decide it. `--accept` and `--reject` take a key as printed,
 * may be repeated, and accept a `*` anywhere in the key; a decisions file holds the same words,
 * one rule per line, and the LAST rule that matches a key is the one that decides it. Flags are
 * read after the file, so `--decisions all-no.txt --accept card+:c-thing` means what it looks
 * like.
 *
 * `--from` is the attribution and it is not optional for a decision. An accepted change is
 * somebody's edit landing in the catalog the owner will publish under their own name, and a
 * record of that edit with no name on it is worth very little a month later.
 *
 * EXIT CODES: 0 nothing is waiting for a decision, 1 changes are pending, 2 the file could not
 * be read or is not a proposal against this project.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reviewProposal, parseDecisions, changeLine, REVIEW_LOG, putAway,
         DECIDED } from "../src/review.mjs";

function die(code, line) { process.stderr.write("review  " + line + "\n"); process.exit(code); }
const say = l => process.stdout.write("review  " + l + "\n");

/** The flag parser of tools/publish.mjs, plus repetition: --accept twice means two keys. */
function parse(argv) {
  const out = { _: [], accept: [], reject: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const name = a.slice(2);
    const value = (argv[i + 1] && !argv[i + 1].startsWith("--")) ? argv[++i] : true;
    if (name === "accept" || name === "reject") {
      if (value === true) throw new Error("--" + name + " wants a key");
      out[name].push({ verb: name, pattern: value, order: out.accept.length + out.reject.length });
    } else out[name] = value;
  }
  return out;
}

async function main(argv) {
  let args;
  try { args = parse(argv); } catch (e) { die(2, e.message); }
  if (args._.length < 2)
    die(2, "usage: node tools/review.mjs <project folder> <exported file> [--from \"...\"]"
      + " [--decisions <file>] [--accept <key>] [--reject <key>] [--accept-all] [--dry-run]");
  const project = path.resolve(args._[0]), file = path.resolve(args._[1]);
  if (!fs.existsSync(project)) die(2, "no project folder at " + project);
  if (!fs.existsSync(file)) die(2, "no file at " + file);

  /* The rules, in the order they were given: the decisions file first, then the flags, because
     a flag on the command line is the later thought. */
  let rules = [];
  if (typeof args.decisions === "string") {
    if (!fs.existsSync(args.decisions)) die(2, "no decisions file at " + args.decisions);
    try { rules = parseDecisions(fs.readFileSync(args.decisions, "utf8")); }
    catch (e) { die(2, e.message); }
  }
  if (args["reject-all"] === true) rules.push({ verb: "reject", pattern: "*" });
  if (args["accept-all"] === true) rules.push({ verb: "accept", pattern: "*" });
  args.accept.concat(args.reject).sort((a, b) => a.order - b.order)
    .forEach(r => rules.push({ verb: r.verb, pattern: r.pattern }));

  let r;
  try {
    r = await reviewProposal({
      project, file, rules,
      from: typeof args.from === "string" ? args.from : null,
      note: typeof args.note === "string" ? args.note : null,
      again: args.again === true,
      now: typeof args.now === "string" ? args.now : null,
      write: args["dry-run"] !== true,
    });
  } catch (e) { die(2, e && e.message ? e.message : String(e)); }

  /* The screen has a field for the attribution; here it is a flag, so the flag is named. */
  if (!r.ok) die(2, r.refusal + (r.said && /attributable/.test(r.said.frame) ? " (--from)" : ""));

  const values = args.paths !== true;
  say(path.basename(file) + " against " + path.basename(r.draftAt) + ": " + r.changes.length
    + " change(s) in the proposal");
  /* THE ENGLISH, which is what a note's `message` is and has always been: the frames the page
     says in Polish (board 539) changed how a note travels and not one word of what this prints. */
  r.notes.forEach(n => say("note: " + n.message));
  if (r.known.length) say(r.known.length + " decided in an earlier review and not offered again"
    + " (--again to reopen them)");

  const show = (list, label) => {
    if (!list.length) return;
    process.stdout.write("  " + label + "\n");
    list.forEach(c => process.stdout.write("    " + changeLine(c, { values }) + "\n"));
  };
  show(r.pending, "waiting for a decision:");
  show(r.accepted, "accepted:");
  show(r.rejected, "rejected:");

  if (r.applied.length) say(r.applied.length + " change(s) landed in " + r.draftAt);
  r.skipped.forEach(s => say("skipped " + s.key + ": " + s.why));
  if (r.wrote.length) say("wrote " + r.wrote.map(w => path.basename(w)).join(", "));
  else say("nothing was written" + (args["dry-run"] === true ? " (--dry-run)" : ""));
  if (r.entry) say("recorded in " + REVIEW_LOG + " as " + r.entry.from);
  /* A FILE IN THIS PROJECT'S INBOX WITH NOTHING LEFT WAITING IS PUT AWAY, as the screen's Land
     puts it away (sense pass 2026-09-22, item 19), so the two doors leave the same folders. */
  const at = path.resolve(file), home = path.resolve(project);
  if (r.entry && !r.pending.length && path.dirname(at) === path.join(home, "inbox")
      && fs.existsSync(at)) {
    say("nothing left waiting, so put away in " + DECIDED + "/ as "
      + path.basename(putAway(home, at)));
  }

  process.exit(r.pending.length ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => die(2, e && e.stack ? e.stack : String(e)));

export { parse };
