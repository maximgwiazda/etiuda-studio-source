/* LIVE STATISTICS OPEN WITH THE LEAD'S BOX. A plain file under stats/ is not read. A file sealed
 * under the team key is not a row. An off-roster desk is not counted.
 *
 *     node tests/stats-sealed.mjs
 *
 * No window: the reader, the command line's door, and the Statistics screen on tests/page-stand-in.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { jsonText } from "../src/plain-json.mjs";
import { readStats, readStatsAll, rowOf } from "../src/stats.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "stats-sealed");
const EXPECTED = 6;
const TEAM = "t-" + "14".repeat(8);
const KEY_ID = "lead-harbour";
const A = "k-a11ce0a11ce0a111";
const B = "k-b22df0b22df0b222";
const QUIET = "No new figures from Harbour since -.";
const QUIET_PL = "Stanowisko Harbour: brak nowych danych od -.";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split("\n")[0].slice(0, 180) + ")"); }
}
function estat(desk, rev) {
  return {
    format: 1, kind: "etiuda-desk-stats", desk, engine: "test",
    period: { from: "2026-10-01", to: "2026-10-07" }, sync: "2026-10-07",
    cards: [{ id: "c-harbour", n: 1, at: "2026-10-03" }], intents: [], misses: 0,
    langs: { en: 1 }, since: "2026-10-01", pairs: [],
    catalog: { id: "c-north-lamp", rev }, hash: "h-harbour",
  };
}
function boxPair() {
  const pair = crypto.generateKeyPairSync("x25519");
  return {
    public: pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex"),
    secretKey: pair.privateKey,
  };
}
function writePlain(dir, name, obj) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), JSON.stringify(obj));
}
function writeSealed(dir, deskId, box, obj) {
  fs.mkdirSync(dir, { recursive: true });
  const env = Engine.statsRules().sealStatsLead(box, TEAM, KEY_ID, deskId, JSON.stringify(obj));
  fs.writeFileSync(path.join(dir, "stats.estat"), jsonText(env));
}
function writeTeamKey(dir, obj) {
  fs.mkdirSync(dir, { recursive: true });
  const env = Engine.sealRules().sealCatalog(crypto.randomBytes(32), TEAM, 1, JSON.stringify(obj));
  fs.writeFileSync(path.join(dir, "stats.estat"), jsonText(env));
}
const textOf = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

async function main() {
  clearScratch(SCRATCH);
  const box = boxPair();
  const open = (doc, id) => Engine.statsRules().openStatsSealed(box.secretKey, doc, id);
  const plain = estat("plain-harbour", 2);
  const share = path.join(SCRATCH, "share");
  writePlain(path.join(share, "stats"), "plain.estat", plain);
  writeSealed(path.join(share, "desks", A), A, box.public, estat("Harbour lamp", 3));
  writeTeamKey(path.join(share, "desks", B), estat("Shut lamp", 5));
  const opts = { roster: [A, B], open };

  await leg("ss1 a plain file under stats/ is not a row, and a folder with no desks/ is empty", async () => {
    const only = path.join(SCRATCH, "plain-only");
    writePlain(path.join(only, "stats"), "plain.estat", plain);
    const a = readStats(only), b = await readStatsAll(only);
    return a.rows.length === 0 && a.refused.length === 0 && (a.quiet || []).length === 0 && a.live.n === 0
      && b.rows.length === 0 && b.live.n === 0;
  });

  await leg("ss2 a file sealed to the lead's box opens to the same row the plain form would", async () => {
    const a = readStats(share, opts), b = await readStatsAll(share, opts);
    const row = a.rows.find(r => r.name === A);
    const twin = b.rows.find(r => r.name === A);
    const want = rowOf(estat("Harbour lamp", 3));
    return !!row && rowOf(row.data) === want && !!twin && rowOf(twin.data) === want
      && a.live.n === 1 && !a.refused.some(r => r.name === A);
  });

  await leg("ss3 a file sealed under the team key is not a row and not a refusal", async () => {
    const a = readStats(share, opts);
    return !a.rows.some(r => r.name === B) && !a.refused.some(r => r.name === B)
      && a.quiet.some(q => q.desk === B);
  });

  await leg("ss4 an off-roster desk is not counted", async () => {
    const off = "k-dddddddddddddddd";
    const folder = path.join(SCRATCH, "off");
    writeSealed(path.join(folder, "desks", off), off, box.public, estat("Off lamp", 4));
    writeSealed(path.join(folder, "desks", A), A, box.public, estat("Harbour lamp", 3));
    const got = readStats(folder, { roster: [A], open });
    const names = got.rows.map(r => r.name).concat(got.quiet.map(q => q.desk), got.refused.map(r => r.name));
    return got.rows.length === 1 && got.rows[0].name === A && got.live.n === 1 && names.indexOf(off) < 0;
  });

  /* The command line opens with the lead's key and nothing else; what it prints with one is tests/stats-read.mjs. */
  await leg("ss5 the command line without the lead's key prints no row, old or sealed, names --key and exits 2", async () => {
    const folder = path.join(SCRATCH, "cli");
    writePlain(path.join(folder, "stats"), "plain.estat", plain);
    writeSealed(path.join(folder, "desks", A), A, box.public, estat("Harbour lamp", 3));
    const r = spawnSync(process.execPath, [path.join(ROOT, "tools", "stats-read.mjs"), folder], { encoding: "utf8" });
    const out = String(r.stdout), err = String(r.stderr);
    return r.status === 2 && out === "" && err.indexOf("--key") >= 0
      && err.indexOf("plain-harbour") < 0 && err.indexOf("Harbour lamp") < 0;
  });

  await leg("ss6 the Statistics screen names a quiet desk and has no Ask desks control", async () => {
    const { loadPage } = await import("./page-stand-in.mjs");
    const home = loadPage({ api: {}, uiLang: "en" });
    const P = home.page;
    const where = "C:\\harbour";
    const stats = {
      folder: "C:\\share", head: ["desk"], rows: [{ name: A, cells: ["Harbour lamp"] }],
      refused: [], quiet: [{ desk: "Harbour", since: "-" }],
      live: { n: 1, time: "2026-10-07" }, span: "rolling-30",
      days: { from: "2026-09-17", to: "2026-10-15" },
    };
    P.S.open = { dir: where, editions: [] };
    P.S.screen = "project";
    P.S.section = "stats";
    P.S.stats = stats;
    const views = ["words", "figures", "every"].map((v) => {
      P.statsViewOf.set(where, v);
      P.paintStats();
      return home.node("#main").innerHTML;
    });
    const pl = loadPage({ api: {}, uiLang: "pl" });
    pl.page.S.open = { dir: where, editions: [] };
    pl.page.S.screen = "project";
    pl.page.S.section = "stats";
    pl.page.S.stats = stats;
    pl.page.statsViewOf.set(where, "figures");
    pl.page.paintStats();
    const polish = textOf(pl.node("#main").innerHTML);
    const empty = loadPage({ api: {}, uiLang: "en" });
    empty.page.S.open = { dir: where, editions: [] };
    empty.page.S.screen = "project";
    empty.page.S.section = "stats";
    empty.page.S.stats = { folder: "C:\\share", head: [], rows: [], refused: [], quiet: [], live: { n: 0, time: "-" } };
    empty.page.statsViewOf.set(where, "figures");
    empty.page.paintStats();
    const bare = empty.node("#main").innerHTML;
    return views.every(t => textOf(t).indexOf(QUIET) >= 0 && t.indexOf("ask-desks") < 0 && t.indexOf("sealed for epoch") < 0)
      && polish.indexOf(QUIET_PL) >= 0 && polish.indexOf("sealed for epoch") < 0
      && textOf(bare).indexOf("No new figures") < 0 && bare.indexOf("ask-desks") < 0
      && textOf(bare).indexOf("sealed for epoch") < 0 && textOf(bare).indexOf("unopened") < 0;
  });

  if (process.argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "stats-sealed");
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran\n");
    return 78;
  }
  process.stdout.write("stats-sealed  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  return failed ? 1 : 0;
}

main().then(c => process.exit(c), e => {
  process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2);
});
