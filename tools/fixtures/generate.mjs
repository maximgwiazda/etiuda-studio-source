/* A MACRO PILE THAT IS NOBODY'S. An imported pile is customer content from its first byte, so
 * no real export may ever enter a tree here; what the importer is tested against is made by
 * this file, from a number, out of invented words.
 *
 *     node tools/fixtures/generate.mjs --seed 7 [--rows 40] [--out <dir>] [--all]
 *          [--shape macros-actions|folders-responses|csv-columns|templates-list|macros-list]
 *          [--missing-second-language] [--platform-placeholders] [--near-duplicates]
 *          [--wrong-encoding] [--orphan-category] [--duplicate-id] [--no-scan]
 *
 * DETERMINISTIC BY CONSTRUCTION. One seed and one set of options give one set of bytes: the
 * generator is committed, its output is not, and a test that wants a pile makes it rather than
 * carrying it. Nothing in the output is dated, because a timestamp is the usual way a
 * "deterministic" generator stops being one.
 *
 * THE UGLY CASES ARE THE POINT. A generator that only makes well-formed rows tests the happy
 * path of an importer whose whole job is the unhappy one. Each fault is opt-in, each is
 * recorded in manifest.json with the rows it touched, and that manifest is the oracle: a test
 * asserts what the importer found against what was planted, never against the importer's own
 * opinion of the file.
 *
 * WHAT THE WORDS ARE. An invented syllabary, no employer's name and no wording from any real
 * catalog. The content scan is run over everything written, and the run refuses to leave
 * output that fails it.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");

/* ---- the seeded stream --------------------------------------------------------------------- */

/* mulberry32: thirty-two bits of state, one multiply and three shifts, and the same sequence on
   every machine that has 32-bit integer arithmetic - which is the property Math.random cannot
   offer at any price. */
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- an invented vocabulary ------------------------------------------------------------------ */

const SYL_A = ["vor", "plas", "imb", "kren", "tos", "wid", "glem", "norv", "zub", "farl",
               "mirq", "ust", "grel", "dov", "sarn", "elq", "brum", "thel", "ondr", "fys"];
const SYL_B = ["an", "il", "eth", "or", "uma", "esk", "ondo", "ira", "ux", "alt",
               "enne", "oss", "ib", "arn", "ule", "ynt", "ave", "ork", "iss", "ud"];

function word(r) { return pick(r, SYL_A) + pick(r, SYL_B); }
function pick(r, list) { return list[Math.floor(r() * list.length)]; }
function title(r, n) {
  const w = [];
  for (let i = 0; i < n; i++) w.push(word(r));
  return w.join(" ").replace(/^./, c => c.toUpperCase());
}
function sentence(r, n) { return title(r, n) + "."; }

/* ---- CSV, by the book ------------------------------------------------------------------------ */

/* RFC 4180: a field carrying a comma, a quote or a newline is quoted and its quotes doubled.
   Written out here rather than reached for from a package, because the importer under test has
   to meet the awkward field and this is where the awkward field is made. */
function csvField(v) {
  const s = String(v == null ? "" : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csv(rows) {
  return rows.map(r => r.map(csvField).join(",")).join("\r\n") + "\r\n";
}

const COLUMNS = ["id", "category", "title_en", "title_pl", "body_en", "body_pl", "note_en",
                 "intents", "role"];

/* ---- the pile --------------------------------------------------------------------------------- */

const PLATFORM_TOKENS = ["{{customer.name}}", "{{ticket.id}}", "{{agent.first_name}}",
                         "%%requester_name%%", "$(agent.name)"];

function generate(opts) {
  const r = rng(opts.seed);
  const nCats = Math.max(3, Math.min(12, Math.round(opts.rows / 6) + 2));
  const cats = [];
  for (let i = 0; i < nCats; i++) cats.push({ key: "cat-" + word(r), label: title(r, 1) });
  const nIntents = Math.max(2, Math.min(10, Math.round(opts.rows / 8) + 1));
  const intents = [];
  for (let i = 0; i < nIntents; i++) intents.push(title(r, 2));

  const planted = { missingSecondLanguage: [], platformPlaceholders: [], nearDuplicates: [],
                    orphanCategory: [], duplicateId: [], wrongEncoding: [] };
  const rows = [];
  for (let i = 0; i < opts.rows; i++) {
    const cat = cats[Math.floor(r() * cats.length)];
    const id = "row-" + String(i + 1).padStart(4, "0") + "-" + word(r);
    rows.push({
      id: id, category: cat.key,
      title_en: title(r, 2), title_pl: title(r, 2),
      body_en: sentence(r, 6) + "\n" + sentence(r, 5),
      body_pl: sentence(r, 6) + "\n" + sentence(r, 5),
      note_en: r() < 0.3 ? sentence(r, 4) : "",
      intents: intents.filter(() => r() < 0.25).join(";"),
      role: r() < 0.5 ? "{ROLE}" : "",
    });
  }

  /* Each fault below names the rows it touched by id, so a test asserts on the plant rather
     than on a count that a second fault could also explain. */
  const every = (n, fn) => { for (let i = n - 1; i < rows.length; i += n) fn(rows[i], i); };

  if (opts.missingSecondLanguage)
    every(5, row => { row.title_pl = ""; row.body_pl = ""; planted.missingSecondLanguage.push(row.id); });

  if (opts.platformPlaceholders)
    every(4, (row, i) => {
      const tok = PLATFORM_TOKENS[i % PLATFORM_TOKENS.length];
      row.body_en = row.body_en.replace(".", " " + tok + ".");
      if (row.body_pl) row.body_pl = row.body_pl.replace(".", " " + tok + ".");
      planted.platformPlaceholders.push({ id: row.id, token: tok });
    });

  /* A near duplicate, not a duplicate: one letter of the title and one word of the body. The
     rule it exercises has a threshold rather than an answer, so the distance is stated here
     and the test draws a curve through it. */
  if (opts.nearDuplicates)
    every(7, (row, i) => {
      const twin = Object.assign({}, row);
      twin.id = row.id + "-echo";
      twin.title_en = row.title_en.slice(0, -1) + "e";
      twin.body_en = row.body_en.replace(/\S+$/, word(r) + ".");
      rows.splice(i + 1, 0, twin);
      planted.nearDuplicates.push({ of: row.id, twin: twin.id, titleEdits: 1 });
    });

  if (opts.orphanCategory) {
    const row = rows[Math.min(2, rows.length - 1)];
    row.category = "cat-" + word(r) + "-nowhere";
    planted.orphanCategory.push({ id: row.id, category: row.category });
  }

  if (opts.duplicateId && rows.length > 3) {
    rows[3].id = rows[1].id;
    planted.duplicateId.push({ id: rows[1].id, rows: [rows[1].id, rows[3].id] });
  }

  return { rows, cats, intents, planted };
}

/* ---- writing it out ---------------------------------------------------------------------------- */

/* One file in the wrong encoding, and it has to be wrong in a way a reader can detect: the
   bytes below are valid windows-1252 and are NOT valid UTF-8, so a reader that assumes UTF-8
   gets replacement characters rather than a clean read of the wrong letters. */
const MIS_ENCODED_LETTERS = "óéàü";

function write(dir, made, opts) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  const put = (name, text, enc) => {
    const p = path.join(dir, name);
    fs.writeFileSync(p, Buffer.from(text, enc || "utf8"));
    files.push(name);
  };

  put("categories.csv", csv([["key", "label"]].concat(made.cats.map(c => [c.key, c.label]))));
  put("intents.csv", csv([["clause_en"]].concat(made.intents.map(c => [c]))));
  put("macros.csv", csv([COLUMNS].concat(made.rows.map(row => COLUMNS.map(c => row[c])))));

  if (opts.wrongEncoding) {
    const some = made.rows.slice(0, Math.min(5, made.rows.length)).map(row => {
      const c = Object.assign({}, row);
      c.title_en = c.title_en + " " + MIS_ENCODED_LETTERS;
      return COLUMNS.map(k => c[k]);
    });
    put("macros-cp1252.csv", csv([COLUMNS].concat(some)), "latin1");
    made.planted.wrongEncoding.push({ file: "macros-cp1252.csv", encoding: "windows-1252",
      rows: some.length, letters: MIS_ENCODED_LETTERS });
  }

  /* THE ORACLE, and it is written before the importer exists on purpose. What a test asserts
     against is what was planted here, never what the importer says it found. */
  const manifest = {
    kind: "etiuda-studio-fixture", schema: 1,
    seed: opts.seed, rows: made.rows.length, options: opts.options,
    columns: COLUMNS,
    categories: made.cats.map(c => c.key),
    intents: made.intents.length,
    counts: {
      rows: made.rows.length,
      ids: new Set(made.rows.map(r => r.id)).size,
      withSecondLanguage: made.rows.filter(r => String(r.body_pl).trim()).length,
      categoriesUsed: new Set(made.rows.map(r => r.category)).size,
    },
    planted: made.planted,
    files: files.slice(),
  };
  fs.writeFileSync(path.join(dir, "manifest.json"),
    JSON.stringify(manifest, null, 1) + "\n", "utf8");
  files.push("manifest.json");
  return { files, manifest };
}

/* ---- the same pile, in a source-shape envelope ---------------------------------------------- */

/* Planted after generate() so the seed stream is the one the CSV path already uses.
   Moustache tokens the importer's verdict already covers, in the form each shape writes. */
const SHAPES = ["macros-actions", "folders-responses", "csv-columns", "templates-list",
                "macros-list"];
const SHAPE_TOKEN = {
  "macros-actions": "{{ticket.id}}",
  "folders-responses": "{{ticket.agent.name}}",
  "csv-columns": "{{user.name}}",
  "templates-list": "{{recipient.first_name}}",
  "macros-list": "{{ticket.customer.firstname}}",
};
const CSV_COLUMNS_HEADERS = ["id", "name", "body_plain_text",
                             "visibility", "created_at", "updated_at"];

function asHtml(text) {
  const esc = String(text == null ? "" : text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return "<p>" + esc.replace(/\n/g, "</p><p>") + "</p>";
}

function plantShape(rows, token) {
  const planted = [];
  const out = rows.map((row, i) => {
    if (i % 4 !== 3) return row;
    const next = Object.assign({}, row);
    next.body_en = String(row.body_en).replace(".", " " + token + ".");
    planted.push({ id: row.id, token: token });
    return next;
  });
  return { rows: out, planted: planted };
}

function asMacrosActions(rows) {
  return { macros: rows.map((row, i) => ({
    id: row.id,
    title: row.category + "::" + row.title_en,
    active: true,
    position: i + 1,
    description: row.note_en || "",
    actions: [{ field: "comment_value", value: row.body_en }],
  })) };
}

function asFoldersResponses(rows) {
  const folders = [];
  const at = new Map();
  rows.forEach(row => {
    if (!at.has(row.category)) {
      at.set(row.category, folders.length);
      folders.push({ id: row.category, name: row.category, canned_responses: [] });
    }
    const folder = folders[at.get(row.category)];
    folder.canned_responses.push({
      id: row.id,
      title: row.title_en,
      folder_id: folder.id,
      content: row.body_en,
      content_html: asHtml(row.body_en),
      attachments: [],
    });
  });
  return { folders: folders };
}

function asCsvColumns(rows) {
  return csv([CSV_COLUMNS_HEADERS].concat(rows.map(row => [
    row.id, row.title_en, row.body_en, "Everyone", "", "",
  ])));
}

function asTemplatesList(rows) {
  return { templates: rows.map(row => ({
    _links: { related: { parent_folder: row.category } },
    id: row.id,
    name: row.title_en,
    subject: "",
    body: row.body_en,
    attachments: [],
    is_available_for_all_inboxes: true,
    inbox_ids: [],
  })) };
}

function asMacrosList(rows) {
  return { macros: rows.map(row => ({
    id: row.id,
    external_id: null,
    name: row.title_en,
    intent: null,
    language: null,
    usage: 0,
    actions: [{
      arguments: { body_html: asHtml(row.body_en), body_text: row.body_en },
      description: "",
      name: "setResponseText",
      title: "",
      type: "user",
    }],
    uri: "",
  })) };
}

function writeShape(dir, made, opts) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  const putJson = (name, obj) => {
    fs.writeFileSync(path.join(dir, name), JSON.stringify(obj, null, 1) + "\n", "utf8");
    files.push(name);
  };
  const plantedRows = plantShape(made.rows, SHAPE_TOKEN[opts.shape]);
  let payload, shelves;
  if (opts.shape === "macros-actions") {
    payload = asMacrosActions(plantedRows.rows);
    putJson("macros.json", payload);
    shelves = payload.macros.map(m => {
      const raw = String(m.title);
      const cut = raw.lastIndexOf("::");
      return cut < 0 ? "" : raw.slice(0, cut);
    });
  } else if (opts.shape === "folders-responses") {
    payload = asFoldersResponses(plantedRows.rows);
    putJson("canned_response_folders.json", payload);
    shelves = payload.folders.map(f => f.name);
  } else if (opts.shape === "csv-columns") {
    fs.writeFileSync(path.join(dir, "macros.csv"), asCsvColumns(plantedRows.rows), "utf8");
    files.push("macros.csv");
    shelves = [];
  } else if (opts.shape === "templates-list") {
    payload = asTemplatesList(plantedRows.rows);
    putJson("templates.json", payload);
    shelves = payload.templates.map(t => {
      const link = t._links && t._links.related && t._links.related.parent_folder;
      if (link != null && String(link) !== "") {
        const s = String(link);
        const cut = s.lastIndexOf("/");
        return cut < 0 ? s : s.slice(cut + 1);
      }
      return t.folder_id == null ? "" : String(t.folder_id);
    });
  } else {
    payload = asMacrosList(plantedRows.rows);
    putJson("macros.json", payload);
    shelves = [];
  }
  const nCats = shelves.length ? new Set(shelves).size : 1;
  const manifest = {
    kind: "etiuda-studio-fixture", schema: 1,
    seed: opts.seed, shape: opts.shape, rows: plantedRows.rows.length,
    options: opts.options,
    counts: {
      rows: plantedRows.rows.length,
      categories: nCats,
      withPlaceholder: plantedRows.planted.length,
    },
    planted: { placeholders: plantedRows.planted },
    files: files.slice(),
  };
  fs.writeFileSync(path.join(dir, "manifest.json"),
    JSON.stringify(manifest, null, 1) + "\n", "utf8");
  files.push("manifest.json");
  return { files: files, manifest: manifest };
}

/* ---- the content scan over what was written ------------------------------------------------- */

/* THE GUARD RUNS OVER THE OUTPUT, not only over the tree. A lexicon that grows a real word one
   day is exactly the way invented content stops being invented, and nothing else would see it.
   The quote half of the scan needs a catalog beside the engine and this repository never holds
   one, so it stands down and this says so every run rather than going quiet (board item 435).
   The name half is the half that matters here and it runs. */
/* THE DATE THE HOOK COMPARES (2026-10-13). tools/pre-commit takes ETIUDA_SCAN_OFF only when it
   equals `date +%F` in its own shell, the local date as that shell sees it. This took the UTC
   date, so wherever the list was missing (a fresh clone, the cloud, a branch older than the list
   moving to git's common directory) every fixture was refused from midnight to 02:00 Warsaw time
   (found by a subagent of the lead engineer). Node cannot stand in for the shell, because the two
   read TZ differently: under TZ=AAA-14 the shell moves fourteen hours ahead while Node reads the zone
   as UTC, and Git's own shell reads TZ=Europe/Warsaw as GMT where Node honours it (measured on the
   desk, 2026-10-13). So the shell is asked, with the environment the hook will get. */
function hookToday(env) {
  const r = spawnSync("sh", ["-c", "date +%F"], { encoding: "utf8", env: env || process.env });
  return String(r.stdout || "").trim();
}

function scan(dir, files) {
  const hook = path.join(ROOT, "tools", "pre-commit");
  if (!fs.existsSync(hook)) return { ran: false, why: "no tools/pre-commit at " + hook };
  const today = hookToday(process.env);
  const bad = [];
  for (const name of files) {
    const r = spawnSync("sh", [hook, path.join(dir, name)],
      { encoding: "utf8", cwd: ROOT, env: Object.assign({}, process.env, { ETIUDA_SCAN_OFF: today }) });
    if (r.status !== 0) bad.push(name + ": " + String(r.stdout || r.stderr || "").trim());
  }
  return { ran: true, files: files.length, bad };
}

/* ---- main ------------------------------------------------------------------------------------ */

const FAULTS = ["missing-second-language", "platform-placeholders", "near-duplicates",
                "wrong-encoding", "orphan-category", "duplicate-id"];
const camel = s => s.replace(/-([a-z])/g, (m, c) => c.toUpperCase());

function parse(argv) {
  const arg = (name, dflt) => {
    const i = argv.indexOf(name);
    return i > -1 && argv[i + 1] != null ? argv[i + 1] : dflt;
  };
  const seed = Number(arg("--seed", ""));
  if (!Number.isInteger(seed))
    fail("--seed wants a whole number; a fixture nobody can make again is not a fixture");
  const rows = Number(arg("--rows", "40"));
  if (!Number.isInteger(rows) || rows < 1) fail("--rows wants a whole number of rows, at least 1");
  const all = argv.includes("--all");
  const opts = { seed, rows, options: {}, scan: !argv.includes("--no-scan") };
  for (const f of FAULTS) {
    const on = all || argv.includes("--" + f);
    opts[camel(f)] = on;
    opts.options[f] = on;
  }
  opts.out = path.resolve(arg("--out", path.join(ROOT, "scratch", "fixtures", "seed-" + seed)));
  const shape = arg("--shape", "");
  if (shape && !SHAPES.includes(shape))
    fail("--shape wants " + SHAPES.join(" or ") + ", got " + JSON.stringify(shape));
  opts.shape = shape || null;
  const unknown = argv.filter(a => a.startsWith("--")
    && !["--all", "--no-scan", "--seed", "--rows", "--out", "--shape"].includes(a)
    && !FAULTS.includes(a.slice(2)));
  if (unknown.length) fail("unknown option(s): " + unknown.join(", "));
  return opts;
}
function fail(line) { process.stderr.write("fixtures: " + line + "\n"); process.exit(2); }

function main(argv) {
  const opts = parse(argv);
  const made = generate(opts);
  const w = opts.shape ? writeShape(opts.out, made, opts) : write(opts.out, made, opts);
  process.stdout.write("fixtures: seed " + opts.seed + ", " + made.rows.length + " row(s) over "
    + made.cats.length + " category key(s) and " + made.intents.length + " intent clause(s), "
    + w.files.length + " file(s) into " + opts.out
    + (opts.shape ? ", shape " + opts.shape : "") + "\n");
  const on = FAULTS.filter(f => opts[camel(f)]);
  process.stdout.write("fixtures: faults planted: " + (on.length ? on.join(", ") : "none") + "\n");
  if (opts.scan) {
    const s = scan(opts.out, w.files);
    if (!s.ran) { process.stderr.write("fixtures: the content scan did NOT run - " + s.why + "\n"); process.exit(3); }
    if (s.bad.length) {
      s.bad.forEach(b => process.stderr.write("fixtures: FAIL content scan - " + b + "\n"));
      fs.rmSync(opts.out, { recursive: true, force: true });
      process.stderr.write("fixtures: output removed; a fixture the scan refuses is not written\n");
      process.exit(4);
    }
    process.stdout.write("fixtures: content scan clean over " + s.files
      + " file(s), name half only (the quote half needs a catalog this repository never holds)\n");
  } else {
    process.stdout.write("fixtures: content scan NOT RUN (--no-scan)\n");
  }
}

export { rng, generate, write, writeShape, csv, csvField, COLUMNS, FAULTS, parse, hookToday };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2));
