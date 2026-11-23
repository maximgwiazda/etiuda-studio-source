/* THE AUDIT PACK, AT THE COMMAND LINE. Board 606 and 607; the rule is at the head of src/audit.mjs.
 *
 *     node tools/audit.mjs <project folder> [--edition <e>] [--key <key file>]
 *     node tools/audit.mjs <project folder> --pack <out folder> [--edition <e>] [--key <key file>]
 *     node tools/audit.mjs --verify <pack folder>
 *
 * With no flag it prints the edition's own account of itself: the counts, then one line per
 * card saying how it got there, who decided it and when. `--pack` writes the folder an auditor is
 * sent. `--verify` reads such a folder and nothing else, and repeats the two checks a stranger
 * would repeat, which is the whole point of the folder existing.
 *
 * THE EDITION DEFAULTS TO THE NEWEST ONE ARCHIVED, because that is what somebody asking "what did
 * we publish" means, and naming one is one flag away.
 *
 * THE KEY FILE IS READ FOR ITS PUBLIC HALF ALONE and never opened; STUDIO_SIGNING_KEY is where
 * the shell keeps it and is honoured here so that the two doors answer about the same key. With
 * no key at hand the signature's state is the engine's own `unknown`, which says there is a
 * signature and nothing here to check it against - a different thing from `none`.
 *
 * EXIT CODES: 0 read, written, or verified whole; 1 a pack that did NOT verify, which is a
 * finding rather than a fault of this program; 2 anything that stopped the run.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditFor, writePack, verifyPack, howWord } from "../src/audit.mjs";
import { editionsIn, ARCHIVE } from "../src/publish.mjs";

function die(line) { process.stderr.write("audit  " + line + "\n"); process.exit(2); }
const say = line => process.stdout.write("audit  " + line + "\n");

function flag(argv, name) {
  const i = argv.indexOf(name);
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
}

function pad(s, n) { const t = String(s == null ? "" : s); return t + " ".repeat(Math.max(0, n - t.length)); }

async function main(argv) {
  const verifyAt = flag(argv, "--verify");
  if (verifyAt) {
    const r = await verifyPack(verifyAt);
    say("pack   " + r.folder);
    say("file   " + r.catalog.name + ", " + r.catalog.bytes + " bytes, edition "
      + (r.edition || "unnamed"));
    say("hash   " + (r.hash.ok ? "recomputes" : "DOES NOT RECOMPUTE") + ": stored "
      + r.hash.stored + ", recomputed " + r.hash.recomputed);
    say("sig    " + (!r.signature.present ? "none: the catalog was published unsigned"
      : r.signature.state + ", key " + r.signature.keyId
        + (r.signature.publicKey ? "" : " (no public-key.txt in the pack)")
        + (r.signature.detachedAgrees === false
          ? "; the detached .sig does NOT match the one inside the catalog" : "")));
    say("rule   " + r.signature.rule);
    say(r.ok ? "VERIFIED" : "NOT VERIFIED");
    process.exit(r.ok ? 0 : 1);
  }

  const rest = argv.filter(a => !a.startsWith("--"));
  const dir = rest[0];
  if (!dir) die("usage: node tools/audit.mjs <project folder> [--edition <e>]"
    + " [--pack <out folder>] [--key <key file>]  |  node tools/audit.mjs --verify <pack folder>");
  if (!fs.existsSync(dir)) die("nothing at " + dir);

  const have = editionsIn(dir);
  if (!have.length) die("the archive at " + path.join(path.resolve(dir), ARCHIVE)
    + " holds no edition; a pack is made of something that was published");
  const edition = flag(argv, "--edition") || have[have.length - 1];
  if (!have.includes(edition)) die("no edition " + edition + " in the archive; it has "
    + have.join(", "));
  const keyFile = flag(argv, "--key") || process.env.STUDIO_SIGNING_KEY || null;

  const pack = await auditFor(dir, edition, { keyFile });
  const out = flag(argv, "--pack");
  if (out) {
    const w = await writePack(dir, edition, out, { keyFile, pack });
    say("wrote  " + w.folder);
    w.files.forEach(f => say("  " + pad(f.name, 34) + pad(f.bytes, 9) + " bytes"));
    process.exit(0);
  }

  say(pack.name + ", " + (pack.rev == null ? "edition " + pack.edition : "rev " + pack.rev + " (" + pack.edition + ")")
    + (pack.previous ? ", after " + (pack.previousRev == null ? pack.previous : "rev " + pack.previousRev + " (" + pack.previous + ")") /* plant:txrd-rd11 */
      : ", the first edition"));
  say("hash   " + (pack.catalog.ok ? "recomputes" : "DOES NOT RECOMPUTE: " + pack.catalog.recomputed)
    + "  " + pack.catalog.hash);
  say("sig    " + (pack.signature.present
    ? pack.signature.alg + ", key " + pack.signature.keyId + ", " + pack.signature.state
    : "none: published unsigned"));
  say(pack.counts.cards + " card(s): " + pack.counts.accepted + " accepted, "
    + pack.counts.written + " written here, " + pack.counts.unchanged + " unchanged ("
    + pack.counts.unchangedAccepted + " accepted there, " + pack.counts.unchangedWritten
    + " written there), " + pack.counts.unaccounted + " unaccounted for");
  pack.editions.filter(e => !e.record).forEach(e =>
    say("note   edition " + e.edition + " has no acceptance record, so nothing that came in"
      + " with it can be accounted for"));
  pack.editions.filter(e => e.agrees === false).forEach(e =>
    say("note   edition " + e.edition + "'s record and its archived catalogs disagree about"
      + " which cards changed"));
  process.stdout.write("\n");
  pack.cards.forEach(c => process.stdout.write("  " + pad(c.id, 26) + pad(howWord(c), 46)
    + pad(c.by == null ? "-" : c.by, 18) + (c.at || "") + "\n"));
  process.stdout.write("\n");
  pack.limits.forEach(l => say("limit  " + l));
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => die(e && e.stack ? e.stack : String(e)));
