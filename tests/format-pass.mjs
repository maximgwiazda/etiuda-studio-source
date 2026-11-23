/* THE FORMAT PASS, STUDIO'S HALF (board 834, step 5): Studio reads, lints, diffs, signs and keeps
 * the engine's one format revision, the six fields and the key it now carries whole.
 *
 *     node tests/format-pass.mjs [--keep]
 *
 * THE CLAIM IS ONE SENTENCE AND THE LEGS SPLIT IT. A desk loads a catalog and writes it back; the
 * engine at the pin carries every card key and header key it does not name, so the file comes
 * back with nothing missing and Studio's review has nothing to propose. The engine before the
 * pass dropped them, and then every card of every desk file proposed to delete `src`. Section 6
 * is that claim, run with the engine at the pin (nothing proposed) and with the engine at
 * BEFORE (six rows proposed): the second arm is the instrument's own positive control.
 *
 * WHICH ENGINE IS READ, AND HOW. The pin's catalog-v2.js is imported whole as a data: URL, as
 * tests/desk-emitter.mjs does for the statistics emitter (the module imports nothing, and a
 * .js file under a commonjs package cannot be imported by path). BEFORE is read out of the
 * engine's object database by git cat-file, never from a working tree.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { publishFull, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { reviewProposal, NEVER } from "../src/review.mjs";
import { HEADER_FIELDS, readCatalogDocument } from "../src/diff.mjs";
import { DESK_FILE_HEADER } from "../src/format-fields.mjs";
import { makeKeyFile, readKeyFile, unlockKey, signCatalog } from "../src/sign.mjs";
import { saveCard, openProject } from "../src/studio.mjs";
import { engineRepo, gitText, blob, readPin } from "../tools/engine-fetch.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "format-pass");
const CLOCK = "2026-10-01T09:00:00";
const BEFORE = "65784a5";    /* the engine's main before the format pass */
const PASS = "a passphrase nobody uses twice";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const clone = (v) => JSON.parse(JSON.stringify(v));
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* A declared list out of the engine's own text, by its name; empty where the pin has none, so
   that a pin before the revision is a red leg and not a crash. */
function declared(src, name) {
  const m = new RegExp("const " + name + "=(\\[[^\\]]*\\]);").exec(src);
  return m ? JSON.parse(m[1].replace(/\s+/g, " ")) : [];
}

/* WHICH ENGINE FIELD IS ACCOUNTED FOR HERE, and how. A header field the engine names is either
   compared by the diff, never offered, the document's structure, or left on purpose with a
   reason; one that is none of the four is a field this Studio has not decided about, and the
   pin move that brought it is red until somebody does. */
const STRUCTURE = ["format", "kind", "tags", "cards"];
const LEFT = { notes: "C08 compares and publishes them (step 9)",
               name: "the format has no catalog name since 2026-09-28 18:34" };
function unaccounted(headNamed, o) {
  const x = o || {};
  const compared = x.compared || HEADER_FIELDS, never = x.never || NEVER;
  return headNamed.filter(k => compared.indexOf(k) < 0 && !never.has(k)
    && STRUCTURE.indexOf(k) < 0 && !(k in LEFT));
}

async function engineFrom(src, tag) {
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64")
    + "#" + tag);
}

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();
  const pinned = readPin(path.join(ROOT, "tools", "engine-pin")).pin;
  const pinSrc = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules",
    "catalog-v2.js"), "utf8");
  const repo = engineRepo({}).dir;

  /* ---- 1. THE PIN CARRIES THE REVISION ------------------------------------------------------ */

  const cardNamed = declared(pinSrc, "V2_CARD_NAMED"), headNamed = declared(pinSrc, "V2_HEAD_NAMED");
  const NEW_CARD = ["retired", "next", "commits"], NEW_HEAD = ["notes", "grew", "desk"];
  check(NEW_CARD.every(k => cardNamed.indexOf(k) >= 0) && NEW_HEAD.every(k => headNamed.indexOf(k) >= 0),
    "fp1a the pinned engine " + pinned.slice(0, 7) + " names the three card fields and the three"
    + " header fields of the revision");

  /* ---- 2. EVERY HEADER FIELD THE ENGINE NAMES IS ACCOUNTED FOR ----------------------------------- */

  check(unaccounted(headNamed).length === 0,
    "fp2c every header field the engine names is compared, never offered, structure or left on"
    + " purpose with a reason: " + JSON.stringify(unaccounted(headNamed)) + " unaccounted");
  const withoutDesk = new Set(Array.from(NEVER).filter(k => DESK_FILE_HEADER.indexOf(k) < 0));
  const withoutAnswered = new Set(Array.from(NEVER).filter(k => k !== "answered"));
  check(unaccounted(headNamed.concat(["aNewField"])).join() === "aNewField"
        && unaccounted(headNamed, { never: withoutDesk }).join() === DESK_FILE_HEADER.join()
        && unaccounted(headNamed, { never: withoutAnswered }).join() === "answered",
    "fp2d CONTROL: a field the engine adds, a NEVER without the desk-file fields, and a NEVER"
    + " without `answered` are each named by the same check");
  check(DESK_FILE_HEADER.every(k => NEVER.has(k) && headNamed.indexOf(k) >= 0
          && HEADER_FIELDS.indexOf(k) < 0),
    "fp2e `grew` and `desk` are in review's NEVER, named by the engine, and not among the header"
    + " fields the diff compares");

  /* ---- 3. THE LINT SAYS EACH RULE, THROUGH THE ENGINE'S OWN LINT ----------------------------- */

  const out = path.join(SCRATCH, "pile");
  const gen = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", "31", "--rows",
    "14", "--out", out], { cwd: ROOT, encoding: "utf8" });
  if (gen.status !== 0) throw new Error("the generator refused: " + (gen.stderr || gen.stdout));
  const made = await importCsv({ file: path.join(out, "macros.csv"), id: "fmt-pass", name: "fmt-pass" });
  const cat = made.catalog;
  const ids = cat.cards.map(c => c.id);
  const primary = cat.langs[0].code;
  const hex = (c, n) => c.repeat(n);
  /* Every new field once, the converter's `src`, and one unknown key on a card and in the header
     (a field a newer build adds). `grew` and `desk` are a desk file's and so are not here. */
  cat.cards[0].retired = true;
  cat.cards[1].commits = true;
  cat.cards[2].next = [{ to: ids[3] }, { to: ids[4], label: "later" }];
  cat.cards[2].src = "the old file, line 4";
  cat.cards[3].future = { a: [1, 2] };
  cat.notes = { [primary]: "a note for the desks" };
  cat.futureHead = "x";
  const withHash = (d) => { delete d.hash; d.hash = F.contentHash(d); return d; };
  withHash(cat);

  const { lintCatalog } = Engine.lint();
  const clean = lintCatalog(cat);
  check(clean.errors.length === 0 && clean.warnings.length === 0,
    "fp3a a catalog holding every field of the revision, `src` and two unknown keys lints clean: "
    + clean.errors.length + " error(s), " + clean.warnings.length + " warning(s)");
  const bad = (name, edit, want) => {
    const d = clone(cat); edit(d); withHash(d);
    const lines = lintCatalog(d).errors;
    check(lines.some(l => want.test(l)),
      "fp3" + name + " the engine's lint says it: " + JSON.stringify(lines.find(l => want.test(l)) || lines));
  };
  bad("b retired is not true or absent", d => { d.cards[0].retired = "yes"; }, /retired is "yes"/);
  bad("c commits is not true or absent", d => { d.cards[1].commits = 1; }, /commits is 1/);
  bad("d next names no card", d => { d.cards[2].next = [{ to: "c-gone" }]; }, /next\[0\] names c-gone/);
  bad("e next names its own card", d => { d.cards[2].next = [{ to: ids[2] }]; }, /next\[0\]/);
  bad("f next repeats a card", d => { d.cards[2].next = [{ to: ids[3] }, { to: ids[3] }]; },
    /next\[1\]/);
  bad("g notes code undeclared", d => { d.notes = { zz: "x" }; }, /notes\.zz/);
  bad("h grew malformed", d => { d.grew = { id: "BAD", rev: 1, sha: "sha256:00" }; }, /grew\.sha/);
  bad("i desk malformed", d => { d.desk = { id: "k-123", name: "x", key: "00", box: "00" }; },
    /desk\.id/);

  /* A refused publish is Studio's own door to the same rule, and it writes nothing. */
  const dangling = clone(cat);
  dangling.cards[2].next = [{ to: "c-gone" }];
  withHash(dangling);
  const project = (name, doc) => {
    const dir = path.join(SCRATCH, name); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(doc, null, 1) + "\n");
    fs.writeFileSync(path.join(dir, PROJECT_FILE),
      JSON.stringify({ id: doc.id, rev: 0, edition: "" }, null, 1) + "\n");
    return dir;
  };
  const refusedDir = project("refused", dangling), refusedOut = path.join(SCRATCH, "refused-out");
  let refusal = "";
  try { await publishFull({ project: refusedDir, folder: refusedOut, notes: "x", now: CLOCK }); }
  catch (e) { refusal = String(e && e.message); }
  check(/c-gone/.test(refusal) && !fs.existsSync(refusedOut),
    "fp3j a draft whose `next` names a card that is not there is refused at publish and no folder"
    + " is written: " + JSON.stringify(refusal.slice(0, 80)));

  /* ---- 4. STUDIO KEEPS THEM: SAVE, PUBLISH, SIGN --------------------------------------------- */

  const dir = project("head", cat);
  const kept = (doc) => ({
    card: ids.slice(0, 4).map(i => doc.cards.find(c => c.id === i))
      .map(c => ({ id: c.id, retired: c.retired, commits: c.commits, next: c.next, src: c.src,
                   future: c.future })),
    head: { notes: doc.notes, futureHead: doc.futureHead } });
  const was = kept(cat);
  await saveCard(dir, ids[2], { title: { [primary]: "A title typed at the desk" } });
  const saved = readJson(path.join(dir, DRAFT_FILE));
  check(same(kept(saved), was) && saved.cards[2].title[primary] === "A title typed at the desk",
    "fp4a saving one card's title leaves every field of the revision, `src` and the unknown keys"
    + " as they were, on the card and in the header");
  /* The header `notes` reaches an edition as the lead's note for it; one the draft carries is not republished (14i). */
  const pub = await publishFull({ project: dir, folder: path.join(SCRATCH, "pub"), notes: "one",
                                  leadNotes: clone(cat.notes), now: CLOCK });
  const published = readCatalogDocument(pub.ec);
  check(same(kept(published), was),
    "fp4b the published file carries them all, byte for byte as the draft held them, its notes given as the lead's note");

  const keyAt = path.join(SCRATCH, "signing-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const open = unlockKey(readKeyFile(keyAt), PASS);
  const V = Engine.sigRules();
  const ring = { [published.id]: { [open.keyId]: open.public } };
  const signed = await signCatalog(published, { privateKey: open.privateKey, keyId: open.keyId });
  check(await V.v2SigState(signed, ring) === V.states.valid,
    "fp4c a catalog holding every field signs and verifies valid through the engine's own"
    + " v2SigState");
  const flips = {
    "a card's `next` order": d => { d.cards[2].next.reverse(); },
    "a card's `retired`": d => { delete d.cards[0].retired; },
    "a card's `commits`": d => { delete d.cards[1].commits; },
    "a card's `src`": d => { d.cards[2].src += "."; },
    "an unknown card key": d => { d.cards[3].future.a.push(3); },
    "the header `notes`": d => { d.notes[primary] += "."; },
    "an unknown header key": d => { d.futureHead = "y"; },
  };
  const unseen = [];
  for (const [what, edit] of Object.entries(flips)) {
    const d = clone(signed); edit(d);
    if (await V.v2SigState(d, ring) !== V.states.invalid) unseen.push(what);
  }
  check(unseen.length === 0,
    "fp4d changing any one of " + Object.keys(flips).length + " fields of the revision turns the"
    + " signature invalid: " + unseen.length + " went unseen " + JSON.stringify(unseen));

  /* ---- 5. THE DIFF'S ROWS ------------------------------------------------------------------- */

  const rowsOf = async (name, edit, rules) => {
    const prop = clone(published); edit(prop);
    prop.modified = true; withHash(prop);
    const file = path.join(SCRATCH, name + ".ec");
    fs.writeFileSync(file, JSON.stringify(prop, null, 1) + "\n");
    return reviewProposal({ project: dir, file, rules: rules || [], write: false });
  };
  const key = (id, f) => "card:" + id + ":" + f;
  const r5a = await rowsOf("next-reordered", d => { d.cards[2].next.reverse(); });
  check(r5a.changes.length === 1 && r5a.changes[0].key === key(ids[2], "next")
        && same(r5a.changes[0].from, published.cards[2].next)
        && same(r5a.changes[0].to, clone(published.cards[2].next).reverse()),
    "fp5a reordering a card's `next` is ONE row at `next`, the whole list on each side:"
    + " " + JSON.stringify(r5a.changes.map(c => c.key)));
  const r5b = await rowsOf("next-gained", d => { d.cards[5].next = [{ to: ids[6] }]; });
  check(r5b.changes.length === 1 && r5b.changes[0].key === key(ids[5], "next")
        && r5b.changes[0].from === undefined && same(r5b.changes[0].to, [{ to: ids[6] }]),
    "fp5b a card gaining a `next` is one row from nothing to the list");
  const r5c = await rowsOf("flags", d => { delete d.cards[0].retired; delete d.cards[1].commits;
                                          d.cards[7].retired = true; });
  check(r5c.changes.map(c => c.key).sort().join() === [key(ids[0], "retired"), key(ids[1], "commits"),
        key(ids[7], "retired")].sort().join(),
    "fp5c `retired` and `commits` row like any other field, one row per card and flag");
  const r5d = await rowsOf("carried", d => { d.cards[2].src = "elsewhere"; d.cards[3].future = null; });
  check(r5d.changes.map(c => c.key).sort().join() === [key(ids[2], "src"), key(ids[3], "future")]
          .sort().join(),
    "fp5d a changed `src` and a changed unknown card key are rows, since Studio compares every key");
  const accepted = await (async () => {
    const copy = path.join(SCRATCH, "accept");
    fs.cpSync(dir, copy, { recursive: true });
    const prop = clone(published); prop.cards[2].next = [{ to: ids[9] }]; prop.modified = true;
    withHash(prop);
    const file = path.join(SCRATCH, "accept.ec");
    fs.writeFileSync(file, JSON.stringify(prop, null, 1) + "\n");
    return reviewProposal({ project: copy, file, rules: [{ verb: "accept", pattern: "*" }],
                            from: "desk C", write: true });
  })();
  check(accepted.ok && accepted.catalog && same(accepted.catalog.cards[2].next, [{ to: ids[9] }])
        && accepted.catalog.cards[2].src === cat.cards[2].src,
    "fp5e accepting a `next` row lands the whole list in the draft and leaves the card's `src`");

  /* ---- 6. A DESK'S ROUND TRIP PROPOSES NOTHING ----------------------------------------------- */

  const deskFile = async (E, tag, extra) => {
    const rt = E.catalogToV2(E.catalogFromV2(clone(published)));
    const prop = clone(rt);
    prop.id = published.id; prop.rev = published.rev; prop.modified = true;
    if (extra) extra(prop);
    withHash(prop);
    const file = path.join(SCRATCH, "desk-" + tag + ".ec");
    fs.writeFileSync(file, JSON.stringify(prop, null, 1) + "\n");
    return { prop, seen: await reviewProposal({ project: dir, file, rules: [], write: false }) };
  };
  const Now = await engineFrom(pinSrc, "pinned");
  const now = await deskFile(Now, "pinned");
  const present = ["retired", "commits", "next", "src", "future"].every(f =>
    now.prop.cards.some(c => c[f] !== undefined)) && !!now.prop.notes && !!now.prop.futureHead;
  check(now.seen.ok && now.seen.changes.length === 0 && present,
    "fp6a the pinned engine's load and export of the published file carries all of it and Studio's"
    + " review proposes nothing: " + now.seen.changes.length + " row(s)");

  const oldSha = gitText(repo, ["rev-parse", BEFORE + ":src/modules/catalog-v2.js"]).out.trim();
  const Old = await engineFrom(blob(repo, oldSha).toString("utf8"), "before");
  const before = await deskFile(Old, "before");
  const lost = [key(ids[0], "retired"), key(ids[1], "commits"), key(ids[2], "next"),
                key(ids[2], "src"), key(ids[3], "future"), "header:minEngine"].sort();
  check(before.seen.ok && same(before.seen.changes.map(c => c.key).sort(), lost),
    "fp6b CONTROL, the planted positive: the engine at " + BEFORE + ", which dropped what it did"
    + " not name, makes the same round trip and the same review proposes exactly " + lost.length
    + " rows: " + JSON.stringify(before.seen.changes.map(c => c.key.replace(/^card:row-\d+-/, ""))));

  const grew = { id: published.id, rev: 3, sha: "sha256:" + hex("a", 64) };
  const deskBlock = { id: "k-" + hex("b", 16), name: "Desk 4", key: hex("c", 64), box: hex("d", 64) };
  const marked = await deskFile(Now, "marked", p => { p.grew = grew; p.desk = deskBlock; });
  check(marked.prop.grew && marked.prop.desk && marked.seen.ok && marked.seen.changes.length === 0
        && lintCatalog(marked.prop).errors.length === 0,
    "fp6c a desk file whose header holds `grew` and `desk` lints clean and offers nothing: "
    + marked.seen.changes.length + " row(s)");

  /* ---- 7. THE FILL-IN FIELDS ARE GONE, AND A DRAFT THAT HOLDS THEM STILL OPENS -------------- */

  /* Studio reads no `fields` key: no page, no door, no rule taken from the pin, and neither the diff nor the
     review queue names it. Read from the source, since an absence has no behaviour to drive. */
  const src7 = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
  const studioSrc = fs.readdirSync(path.join(ROOT, "src")).filter(n => n.endsWith(".mjs"))
    .map(n => src7(path.join("src", n))).join(" ");
  const app7 = src7("ui/app.js");
  const named7 = {
    diff: HEADER_FIELDS.indexOf("fields") >= 0, review: NEVER.has("fields"),
    engineRules: typeof Engine.fillFieldRules === "function",
    doors: (src7("shell/main.js") + src7("shell/preload.js")).indexOf("studio:field") >= 0,
    page: ["railRow(" + JSON.stringify("fields"), "data-fld-", "fld-new"].some(w => app7.indexOf(w) >= 0),
    screen: src7("ui/lang.js").indexOf(" fields: [],") >= 0,
    draft: (studioSrc + app7).indexOf("draft.fields") >= 0,
  };
  check(Object.keys(named7).every(k => !named7[k]),
    "fp7a Studio names no fill-in fields: no diff or review row, no rule from the pin, no door, no page, no"
    + " screen, no draft key read: " + JSON.stringify(Object.keys(named7).filter(k => named7[k])));
  /* The four text clauses above read an absence, and a spelling that moved reads the same. Each has a
     sibling spelling of a feature that is here, searched in the same text, so that a silence means the text was read. */
  const sibling7 = {
    doors: (src7("shell/main.js") + src7("shell/preload.js")).indexOf("studio:card") >= 0,
    page: ["railRow(" + JSON.stringify("cards"), 'data-fld="', "tag-new"].every(w => app7.indexOf(w) >= 0),
    screen: src7("ui/lang.js").indexOf(" tags: [],") >= 0,
    draft: (studioSrc + app7).indexOf("draft.cards") >= 0,
  };
  check(Object.keys(sibling7).every(k => sibling7[k]),
    "fp7c CONTROL: each text clause of fp7a has a sibling spelling that is found in the same text: "
    + JSON.stringify(Object.keys(sibling7).filter(k => !sibling7[k])) + " not found");
  const older = clone(cat);
  older.fields = [{ id: "f1", label: { [primary]: "order number" }, kind: "text" }];
  older.cards[5].body[primary] = String(older.cards[5].body[primary]) + " {order number}";
  withHash(older);
  const olderDir = project("older", older);
  let opened7 = null, said7 = "";
  try { opened7 = await openProject(olderDir); } catch (e) { said7 = String(e && e.message); }
  await saveCard(olderDir, ids[6], { title: { [primary]: "Retitled in a later Studio" } });
  const olderPub = await publishFull({ project: olderDir, folder: path.join(SCRATCH, "older-pub"), notes: "one",
                                       now: CLOCK });
  const olderOut = readCatalogDocument(olderPub.ec);
  const carried7 = { opened: !!opened7, draftKey: same(readJson(path.join(olderDir, DRAFT_FILE)).fields, older.fields),
    publishedKey: same(olderOut.fields, older.fields),
    brace: olderOut.cards[5].body[primary] === older.cards[5].body[primary] };
  check(Object.keys(carried7).every(k => carried7[k]),
    "fp7b a draft an older Studio wrote with `fields` opens, takes a save and publishes, the key and the"
    + " brace carried as written: " + JSON.stringify(carried7) + (opened7 ? "" : " REFUSED " + JSON.stringify(said7.slice(0, 80))));

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "format-pass");
  process.stdout.write("\nformat-pass  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(c => process.exit(c), e => {
  process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2);
});
