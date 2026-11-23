/* LICENCE MIGRATIONS OVER A FILLED 0009 DATABASE (the test architect's brief of 2026-11-16).
 *
 *     node tests/licence-migrations.mjs
 *
 * Builds a licence database at migration 0009 with rows in every table, runs 0010 to 0020 in order through the
 * tree's migration order on the stand-in D1, and checks every table's row count, column values, lead_names, removals,
 * orders.revenue_year, explicit revenue_year surviving 0017..0020, final schema equality with schema.sql, and purgeRetention at +31 days. Node only, no network.
 *
 *   m1   row counts: every table that existed at 0009 keeps its row count across 0010..0020
 *   m2   licence columns: invoiced_until and invoiced_updates_until match paid_until and updates_until on paid and
 *        refunded licences and are NULL on trials; org_desks 1, seat_source 'admit', entra_at NULL, pooled_ok 0
 *   m3   lead_names: one row per proved non-owner lead seat on non-trial non-desk-only licences; named_by owner or 'migration'
 *   m4   removals: exact set of proved_at = 0 seats not held by the licence's owner (m9 first variant)
 *   m5   orders.revenue_year satisfies ruling 2: never earlier than attach.mjs revenue(), exact for unraised creating
 *        orders, cautious for raised creating orders (licence end) and unlinked orders (latest paid licence end, else year(at)+1)
 *   m6   explicit revenue_year survives every migration after 0016, including one equal to year(at) + 1; the pre-backfill
 *        year(at) + 1 state is retired because the backfill moved into 0016 where the column is made and no explicit value can yet exist
 *   m7   migrated schema equals service/licence/schema.sql (tables, columns, indexes)
 *   m8   purgeRetention at +31 days removes only stamped seats' rows, nothing of an owner or a proved seat
 *   m9   variant 2 retired: this state needs the managed code to have run before 0016; the deploy applies every migration
 *        and stops on a failed one before it uploads the Worker (tools/staging-licence.sh, steps 2 and 4), and the old
 *        Worker that serves between them has no managed code. First variant kept in m4 and m8.
 *   m10  plants: each guard planted out in a scratch copy turns its target leg red; real service files untouched
 *   m11  every post-0016 writer of orders (attach.mjs create/raise/explicit-year, pay.mjs first/renewal/rise/refund) records
 *        orders.licence, and 0016 backfills orders.licence where licences.key_hash = orders.tag
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { standInD1 } from "./d1-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { purgeRetention, NO_KEY, PERSON, PERSONAL, SEAT_CODE_RE, ORG_DESKS_DEFAULT } from "../service/licence/core.mjs";
import { attachStatements } from "../service/licence/attach.mjs";
import { makePayRoute } from "../service/licence/pay.mjs";

const nodeRequire = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SERVICE = path.join(ROOT, "service", "licence");
const MIG_DIR = path.join(SERVICE, "migrations");
const SCHEMA = fs.readFileSync(path.join(SERVICE, "schema.sql"), "utf8");
const SCRATCH = path.join(ROOT, "scratch", "licence-migrations-legs");
const NL = "\n";
const DAY = 24 * 3600000;
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 10 + 17;
/* The last migration applied on the test service (0010 to 0020 were, 2026-11-17): what m12 calls yesterday's database. */
const APPLIED = "0020";

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  skip " + line + NL);
}

const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const listMigrations = dir => fs.readdirSync(dir).filter(f => /^\d{4}_.*\.sql$/.test(f)).sort();

function shapeOf(db) {
  return db.prepare("SELECT type, name, tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").all()
    .map(r => r.type + " " + r.name + " " + r.tbl_name + (r.type === "table"
      ? " " + JSON.stringify(db.prepare("PRAGMA table_info(\"" + r.name + "\")").all().map(c => [c.name, c.type, c.notnull, c.dflt_value, c.pk]).sort())
      : " " + JSON.stringify(db.prepare("PRAGMA index_info(\"" + r.name + "\")").all().map(c => c.name))
        + " " + JSON.stringify(db.prepare("PRAGMA index_list(\"" + r.tbl_name + "\")").all().filter(i => i.name === r.name).map(i => [i.unique, i.partial]))))
    .join(NL);
}

function schemaShapeOf(sql) {
  const { DatabaseSync } = nodeRequire("node:sqlite");
  const db = new DatabaseSync(":memory:");
  db.exec(sql);
  const out = shapeOf(db);
  db.close();
  return out;
}

function edKey(label) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
  const pub = publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { label, privateKey, pub, sign: bytes => crypto.sign(null, Buffer.from(bytes), privateKey).toString("hex") };
}

async function execStatements(db, stmts) {
  await db.batch(stmts.map(s => db.prepare(s.sql).bind(...s.values)));
}

/** Reference attach.mjs revenue() oracle: runs T1 (creating) then T2 (raising) on a fresh schema.sql DB. */
async function attachRevenueOracle(atT1, endT1, atT2, endT2) {
  const db = standInD1(SCHEMA);
  const owner = "person-oracle-owner", code = "ORAC000000000001";
  db.raw.prepare("INSERT INTO persons (person, provider, code, made) VALUES (?, 'microsoft', ?, ?)").run(owner, code, atT1 - DAY);
  const org = { provider: q => q("microsoft"), org: q => q("org-oracle") };
  const fresh = end => ({
    org: "Acme Tools", seats: q => q(5), leadSeats: q => q(3),
    paidUntil: q => q(end), updatesUntil: q => q(new Date(end).toISOString().slice(0, 10)),
    invoicedUntil: q => q(end), invoicedUpdatesUntil: q => q(new Date(end).toISOString().slice(0, 10)),
    orgDesks: q => q(1),
  });
  const s1 = attachStatements({
    tag: "attach:T1", run: "run-t1", now: atT1, code, deskOnly: false, org,
    raise: q => "seats = seats + 5, paid_until = MAX(paid_until, " + q(endT1) + ")",
    fresh: fresh(endT1), noKey: NO_KEY, personPrefix: PERSON, personal: PERSONAL,
  });
  await execStatements(db, s1.statements);
  const y1 = db.raw.prepare("SELECT revenue_year FROM orders WHERE tag = 'attach:T1'").get().revenue_year;
  const s2 = attachStatements({
    tag: "attach:T2", run: "run-t2", now: atT2, code, deskOnly: false, org,
    raise: q => "seats = seats + 5, paid_until = MAX(paid_until, " + q(endT2) + "), updates_until = MAX(updates_until, " + q(new Date(endT2).toISOString().slice(0, 10)) + ")",
    fresh: fresh(endT2), noKey: NO_KEY, personPrefix: PERSON, personal: PERSONAL,
  });
  await execStatements(db, s2.statements);
  const y2 = db.raw.prepare("SELECT revenue_year FROM orders WHERE tag = 'attach:T2'").get().revenue_year;
  return { t1: y1, t2: y2 };
}

/** Seed a 0009 database with rows in every one of its 17 tables. */
function seed0009(db, now) {
  const old = now - 5 * DAY;
  const AT_T1 = Date.UTC(2025, 0, 15, 12, 0, 0);
  const END_T1 = Date.UTC(2025, 11, 31, 23, 59, 59);
  const AT_T2 = Date.UTC(2025, 5, 1, 12, 0, 0);
  const END_L1 = Date.UTC(2029, 5, 1, 23, 59, 59);
  const END_L6 = Date.UTC(2031, 5, 1, 23, 59, 59);
  const PAID_FUTURE = now + 400 * DAY;
  const UPD_FUTURE = new Date(PAID_FUTURE).toISOString().slice(0, 10);
  const UPD_L1 = "2029-06-01";
  const UPD_L6 = "2031-06-01";

  const P = {
    owner: "p-owner",
    colead: "p-colead",
    freedLead: "p-freed-lead",
    deskProved: "p-desk-proved",
    deskFreed: "p-desk-freed",
    trial: "p-trial",
    refundedOwner: "p-refunded-owner",
    keyLead: "p-key-lead",
    keyFreed: "p-key-freed",
    deskOnlyOwner: "p-deskonly-owner",
  };
  const CODES = {
    owner: "AAAA000000000001",
    colead: "BBBB000000000002",
    freedLead: "CCCC000000000003",
    deskProved: "DDDD000000000004",
    deskFreed: "EEEE000000000005",
    trial: "FFFF000000000006",
    refundedOwner: "GGGG000000000007",
    keyLead: "HHHH000000000008",
    keyFreed: "JJJJ000000000009",
    deskOnlyOwner: "KKKK000000000010",
  };

  /* 1. licences: paid (created by T1, raised by T2), trial, refunded, key-bought (no owner), desk-only, later-end paid (T6) */
  const insLic = db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, refunded, lead_seats, trial_ends, trial_unit, grace_days, owner, desk_only, refunded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 30, ?, ?, ?)");
  const l1 = Number(insLic.run("attach:T1", NO_KEY, "Acme Tools", 10, UPD_L1, END_L1, 0, 3, null, null, P.owner, 0, null).lastInsertRowid);
  const l2 = Number(insLic.run("signin:trial-2", NO_KEY, "Trial", 30, "2026-12-31", 0, 0, 1, now + 14 * DAY, P.trial, P.trial, 0, null).lastInsertRowid);
  const l3 = Number(insLic.run("attach:T_REF", NO_KEY, "Refunded Co", 5, UPD_FUTURE, PAID_FUTURE, 1, 2, null, null, P.refundedOwner, 0, now - 5 * DAY).lastInsertRowid);
  const l4 = Number(insLic.run(sha("purchase-key-l4"), sha("buyer@example.com"), "Key Co", 5, UPD_FUTURE, PAID_FUTURE, 0, 3, null, null, null, 0, null).lastInsertRowid);
  const l5 = Number(insLic.run("attach:T_DO", NO_KEY, "Solo", 2, UPD_FUTURE, PAID_FUTURE, 0, 1, null, null, P.deskOnlyOwner, 1, null).lastInsertRowid);
  const l6 = Number(insLic.run("attach:T6", NO_KEY, "Far Co", 4, UPD_L6, END_L6, 0, 2, null, null, null, 0, null).lastInsertRowid);

  /* 2. orders: T1 creating L1, T2 raising L1, T_REF creating L3, T_DO creating L5, T6 creating L6, T_ORPHAN with no licence */
  const insOrd = db.raw.prepare("INSERT INTO orders (tag, run, at) VALUES (?, ?, ?)");
  insOrd.run("attach:T1", "run-t1", AT_T1);
  insOrd.run("attach:T2", "run-t2", AT_T2);
  insOrd.run("attach:T_REF", "run-ref", AT_T1);
  insOrd.run("attach:T_DO", "run-do", AT_T1);
  insOrd.run("attach:T6", "run-t6", AT_T1);
  insOrd.run("attach:T_ORPHAN", "run-orp", AT_T1);

  /* 3. persons */
  const insPer = db.raw.prepare("INSERT INTO persons (person, provider, code, made) VALUES (?, 'microsoft', ?, ?)");
  for (const k of Object.keys(P)) insPer.run(P[k], CODES[k], old);

  /* 4. admits & 5. admitted_by */
  const insAdm = db.raw.prepare("INSERT INTO admits (licence, provider, org) VALUES (?, 'microsoft', ?)");
  insAdm.run(l1, "org-l1");
  insAdm.run(l1, PERSON + P.owner);
  insAdm.run(l1, PERSON + P.deskProved);
  insAdm.run(l1, PERSON + P.deskFreed);
  insAdm.run(l2, P.trial);
  insAdm.run(l3, "org-l3");
  insAdm.run(l3, PERSON + P.refundedOwner);
  insAdm.run(l4, "org-l4");
  db.raw.prepare("INSERT INTO admitted_by (licence, person, lead) VALUES (?, ?, ?)").run(l1, P.deskProved, P.owner);
  db.raw.prepare("INSERT INTO admitted_by (licence, person, lead) VALUES (?, ?, ?)").run(l1, P.deskFreed, P.owner);

  /* 6. seats: proved and freed of both kinds, plus owner's unproved seat on L3 */
  const insSeat = db.raw.prepare("INSERT INTO seats (kind, person, licence, provider, org, seated_at, seen_at, proved_at, code) VALUES (?, ?, ?, 'microsoft', ?, ?, ?, ?, ?)");
  insSeat.run("lead", P.owner, l1, "org-l1", old, old, old, CODES.owner);
  insSeat.run("lead", P.colead, l1, "org-l1", old, old, old, CODES.colead);
  insSeat.run("lead", P.freedLead, l1, "org-l1", old, 0, 0, CODES.freedLead);
  insSeat.run("desk", P.deskProved, l1, PERSON + P.deskProved, old, old, old, null);
  insSeat.run("desk", P.deskFreed, l1, PERSON + P.deskFreed, old, 0, 0, null);
  insSeat.run("lead", P.trial, l2, P.trial, old, old, old, CODES.trial);
  insSeat.run("lead", P.refundedOwner, l3, "org-l3", old, 0, 0, CODES.refundedOwner);
  insSeat.run("lead", P.keyLead, l4, "org-l4", old, old, old, CODES.keyLead);
  insSeat.run("lead", P.keyFreed, l4, "org-l4", old, 0, 0, CODES.keyFreed);
  insSeat.run("desk", P.deskOnlyOwner, l5, PERSON + P.deskOnlyOwner, old, old, old, null);

  /* 7. bindings */
  const insBind = db.raw.prepare("INSERT INTO bindings (lead, licence, bound_at, seen_at, person) VALUES (?, ?, ?, ?, ?)");
  const kOwner = sha("lead-owner"), kColead = sha("lead-colead"), kFreed = sha("lead-freed");
  const kTrial = sha("lead-trial"), kRef = sha("lead-ref"), kKeyLead = sha("lead-key"), kKeyAnon = sha("lead-key-anon"), kKeyFreed = sha("lead-key-freed");
  insBind.run(kOwner, l1, old, old, P.owner);
  insBind.run(kColead, l1, old, old, P.colead);
  insBind.run(kFreed, l1, old, old, P.freedLead);
  insBind.run(kTrial, l2, old, old, P.trial);
  insBind.run(kRef, l3, old, old, P.refundedOwner);
  insBind.run(kKeyLead, l4, old, old, P.keyLead);
  insBind.run(kKeyAnon, l4, old, old, null);
  insBind.run(kKeyFreed, l4, old, old, P.keyFreed);

  /* 8. desk_keys & 9. person_desks */
  const insDk = db.raw.prepare("INSERT INTO desk_keys (licence, person, desk_key, seen_at) VALUES (?, ?, ?, ?)");
  insDk.run(l1, P.deskProved, "dk-proved", old);
  insDk.run(l1, P.deskFreed, "dk-freed", old);
  insDk.run(l5, P.deskOnlyOwner, "dk-do", old);
  const insPd = db.raw.prepare("INSERT INTO person_desks (person, desk_key, signed_at, org) VALUES (?, ?, ?, ?)");
  insPd.run(P.deskProved, "dk-proved", old, "org-l1");
  insPd.run(P.deskFreed, "dk-freed", old, "org-l1");
  insPd.run(P.deskOnlyOwner, "dk-do", old, null);

  /* 10. doors */
  const insDoor = db.raw.prepare("INSERT INTO doors (licence, lead, team, rt, url, key_id, box, at) VALUES (?, ?, ?, ?, 'https://etiuda.dev/relay/v1', 'studio-1234', ?, ?)");
  insDoor.run(l1, kColead, "t-colead", sha("rt-colead").slice(0, 32), sha("box-colead"), old);
  insDoor.run(l1, kFreed, "t-freed", sha("rt-freed").slice(0, 32), sha("box-freed"), old);

  /* 11. releases, 12. trials, 13. codes, 14. outbox, 15. proofs, 16. hits, 17. seen */
  db.raw.prepare("INSERT INTO releases (licence, lead, at, token) VALUES (?, ?, ?, ?)").run(l1, sha("rel-lead"), old, "tok-1");
  db.raw.prepare("INSERT INTO trials (identity, domain, lead, started, ends) VALUES (?, ?, ?, ?, ?)").run(sha("id-trial"), sha("dom-trial"), sha("trial-lead"), old, now + 14 * DAY);
  db.raw.prepare("INSERT INTO codes (email_hash, purpose, code_hash, made, expires, tries) VALUES (?, 'activate', ?, ?, ?, 0)").run(sha("e-code"), sha("c-hash"), old, now + DAY);
  db.raw.prepare("INSERT INTO outbox (to_addr, purpose, code, made) VALUES ('test@example.com', 'activate', '123456', ?)").run(old);
  const insProof = db.raw.prepare("INSERT INTO proofs (lead, proof) VALUES (?, ?)");
  insProof.run(kColead, sha("proof-colead"));
  insProof.run(kFreed, sha("proof-freed"));
  db.raw.prepare("INSERT INTO hits (bucket, slot, n) VALUES ('check:ip', 1, 1)").run();
  db.raw.prepare("INSERT INTO seen (digest, until) VALUES (?, ?)").run(sha("seen-1"), now + DAY);

  return { P, CODES, AT_T1, END_T1, AT_T2, END_L1, END_L6, PAID_FUTURE, licences: { l1, l2, l3, l4, l5, l6 }, keys: { kOwner, kColead, kFreed, kKeyLead, kKeyFreed } };
}

async function runLegs(migDir, checkFn, mods) {
  const attachFn = (mods && mods.attachStatements) || attachStatements;
  const makePayFn = (mods && mods.makePayRoute) || makePayRoute;
  const migs = listMigrations(migDir);
  const pre = migs.filter(f => f < "0010");
  const post = migs.filter(f => f >= "0010");
  const now = Date.now();

  /* ---- Main 0009 -> 0020 database ---- */
  const db = standInD1("");
  for (const f of pre) db.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  const seed = seed0009(db, now);
  const tables0009 = db.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
  const countsBefore = Object.fromEntries(tables0009.map(t => [t, db.raw.prepare("SELECT COUNT(*) AS n FROM \"" + t + "\"").get().n]));

  for (const f of post) db.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  const countsAfter = Object.fromEntries(tables0009.map(t => [t, db.raw.prepare("SELECT COUNT(*) AS n FROM \"" + t + "\"").get().n]));

  /* m1: row counts preserved */
  const lost = tables0009.filter(t => countsBefore[t] !== countsAfter[t] || countsBefore[t] < 1);
  checkFn(tables0009.length === 17 && lost.length === 0,
    "m1 every table at 0009 (" + tables0009.length + " tables) keeps its row count across 0010..0020: " + JSON.stringify({ lost, countsBefore, countsAfter }));

  /* m2: licence columns */
  const lics = db.raw.prepare("SELECT id, trial_ends, paid_until, updates_until, invoiced_until, invoiced_updates_until, org_desks, seat_source, entra_at, pooled_ok FROM licences ORDER BY id").all();
  const colsOk = lics.length === 6 && lics.every(l => {
    const isTrial = l.trial_ends !== null;
    const invOk = isTrial ? (l.invoiced_until === null && l.invoiced_updates_until === null)
      : (l.invoiced_until === l.paid_until && l.invoiced_updates_until === l.updates_until);
    return invOk && l.org_desks === 1 && l.seat_source === "admit" && l.entra_at === null && l.pooled_ok === 0;
  });
  const dks = db.raw.prepare("SELECT pooled FROM desk_keys").all();
  checkFn(colsOk && dks.length === 3 && dks.every(d => d.pooled === 0),
    "m2 licence columns (invoiced_until, invoiced_updates_until, org_desks, seat_source, entra_at, pooled_ok) and desk_keys.pooled: " + JSON.stringify(lics));

  /* m3: lead_names */
  const ln = db.raw.prepare("SELECT licence, person, named_by FROM lead_names ORDER BY licence, person").all()
    .map(r => r.licence + ":" + r.person + ":" + r.named_by);
  const expLn = [
    seed.licences.l1 + ":" + seed.P.colead + ":" + seed.P.owner,
    seed.licences.l4 + ":" + seed.P.keyLead + ":migration",
  ].sort();
  checkFn(JSON.stringify(ln) === JSON.stringify(expLn),
    "m3 lead_names holds exactly proved non-owner lead seats on non-trial non-desk-only licences: got=" + JSON.stringify(ln) + " expected=" + JSON.stringify(expLn));

  /* m4: removals */
  const rems = db.raw.prepare("SELECT licence, person, kind FROM removals ORDER BY licence, person, kind").all()
    .map(r => r.licence + ":" + r.person + ":" + r.kind);
  const expRems = [
    seed.licences.l1 + ":" + seed.P.deskFreed + ":desk",
    seed.licences.l1 + ":" + seed.P.freedLead + ":lead",
    seed.licences.l4 + ":" + seed.P.keyFreed + ":lead",
  ].sort();
  checkFn(JSON.stringify(rems) === JSON.stringify(expRems),
    "m4 removals is exactly proved_at = 0 seats not held by the licence's owner: got=" + JSON.stringify(rems) + " expected=" + JSON.stringify(expRems));

  /* m5: orders.revenue_year satisfies ruling 2: never earlier than attach.mjs revenue(), exact for unraised creating
     orders, cautious for raised creating orders (the licence's own paid_until) and for orders whose licence cannot be
     known (MAX(year(at) + 1, latest paid licence end in licences)). */
  const oracle = await attachRevenueOracle(seed.AT_T1, seed.END_T1, seed.AT_T2, seed.END_L1);
  const oracleRef = (await attachRevenueOracle(seed.AT_T1, seed.PAID_FUTURE, seed.AT_T1, seed.PAID_FUTURE)).t1;
  const oracle6 = (await attachRevenueOracle(seed.AT_T1, seed.END_L6, seed.AT_T1, seed.END_L6)).t1;
  const gotYears = Object.fromEntries(db.raw.prepare("SELECT tag, revenue_year FROM orders").all().map(r => [r.tag, r.revenue_year]));
  const dbOrphanOnly = standInD1("");
  for (const f of pre) dbOrphanOnly.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  dbOrphanOnly.raw.prepare("INSERT INTO orders (tag, run, at) VALUES ('attach:T_ONLY', 'run-only', ?)").run(seed.AT_T1);
  for (const f of post) dbOrphanOnly.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  const gotOnly = dbOrphanOnly.raw.prepare("SELECT revenue_year FROM orders WHERE tag = 'attach:T_ONLY'").get().revenue_year;
  const expMaxAll = Math.max(new Date(seed.AT_T2).getUTCFullYear() + 1, oracle6);
  const m5Ok = gotYears["attach:T_REF"] === oracleRef
    && gotYears["attach:T_DO"] === oracleRef
    && gotYears["attach:T6"] === oracle6
    && gotYears["attach:T1"] >= oracle.t1 && gotYears["attach:T1"] === new Date(seed.END_L1).getUTCFullYear()
    && gotYears["attach:T2"] >= oracle.t2 && gotYears["attach:T2"] === expMaxAll
    && gotYears["attach:T_ORPHAN"] === expMaxAll
    && gotOnly === new Date(seed.AT_T1).getUTCFullYear() + 1;
  checkFn(m5Ok,
    "m5 orders.revenue_year satisfies ruling 2 (exact where unraised, cautious where raised or unlinked, year(at)+1 with no licences): "
    + JSON.stringify({ gotYears, gotOnly, oracle: { t1: oracle.t1, t2: oracle.t2, ref: oracleRef, l6: oracle6, maxAll: expMaxAll } }));

  /* m6: explicit revenue_year survives every migration after 0016, including one equal to year(at) + 1.
     Retired: the pre-backfill state where an explicit year equal to year(at) + 1 existed before the backfill, because
     the backfill now runs in 0016_erase.sql where the column is made and no explicit value can yet exist on any
     database that will ever exist; 0020_erasure2.sql keeps only erased_at. */
  const dbExp = standInD1("");
  for (const f of migs.filter(x => x < "0017")) dbExp.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  const at25 = Date.UTC(2025, 2, 1), paid29 = Date.UTC(2029, 5, 1);
  dbExp.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until) VALUES ('attach:EXP_DIFF', ?, 'Exp Co', 2, '2029-06-01', ?)").run(NO_KEY, paid29);
  dbExp.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until) VALUES ('attach:EXP_Y1', ?, 'Exp Co 2', 2, '2029-06-01', ?)").run(NO_KEY, paid29);
  dbExp.raw.prepare("INSERT INTO orders (tag, run, at, revenue_year) VALUES ('attach:EXP_DIFF', 'r1', ?, 2024)").run(at25);
  dbExp.raw.prepare("INSERT INTO orders (tag, run, at, revenue_year) VALUES ('attach:EXP_Y1', 'r2', ?, 2026)").run(at25);
  for (const f of migs.filter(x => x >= "0017")) dbExp.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  const expDiff = dbExp.raw.prepare("SELECT revenue_year FROM orders WHERE tag = 'attach:EXP_DIFF'").get().revenue_year;
  const expY1 = dbExp.raw.prepare("SELECT revenue_year FROM orders WHERE tag = 'attach:EXP_Y1'").get().revenue_year;
  checkFn(expDiff === 2024 && expY1 === 2026,
    "m6 explicit revenue_year survives every migration after 0016 (0017..0020), including year(at) + 1: got=" + JSON.stringify({ expDiff, expY1 }) + " expected=[2024,2026]");

  /* m7: final schema equals schema.sql */
  checkFn(shapeOf(db.raw) === schemaShapeOf(SCHEMA),
    "m7 final migrated database schema equals service/licence/schema.sql");

  /* m8: purgeRetention at +31 days removes only stamped seats' rows, nothing of an owner or a proved seat */
  await purgeRetention(db, now + 31 * DAY);
  const hasSeat = (kind, p) => !!db.raw.prepare("SELECT 1 FROM seats WHERE kind = ? AND person = ?").get(kind, p);
  const hasPer = p => !!db.raw.prepare("SELECT 1 FROM persons WHERE person = ?").get(p);
  const hasBind = k => !!db.raw.prepare("SELECT 1 FROM bindings WHERE lead = ?").get(k);
  const hasDoor = k => !!db.raw.prepare("SELECT 1 FROM doors WHERE lead = ?").get(k);
  const hasDk = (l, p) => !!db.raw.prepare("SELECT 1 FROM desk_keys WHERE licence = ? AND person = ?").get(l, p);
  const hasPd = p => !!db.raw.prepare("SELECT 1 FROM person_desks WHERE person = ?").get(p);
  const hasAdmit = (l, p) => !!db.raw.prepare("SELECT 1 FROM admits WHERE licence = ? AND org = ?").get(l, PERSON + p);
  const hasAdmBy = (l, p) => !!db.raw.prepare("SELECT 1 FROM admitted_by WHERE licence = ? AND person = ?").get(l, p);
  const remLeft = db.raw.prepare("SELECT COUNT(*) AS n FROM removals").get().n;
  const freedGone = !hasSeat("lead", seed.P.freedLead) && !hasBind(seed.keys.kFreed) && !hasDoor(seed.keys.kFreed) && !hasPer(seed.P.freedLead)
    && !hasSeat("desk", seed.P.deskFreed) && !hasDk(seed.licences.l1, seed.P.deskFreed) && !hasPd(seed.P.deskFreed)
    && !hasAdmit(seed.licences.l1, seed.P.deskFreed) && !hasAdmBy(seed.licences.l1, seed.P.deskFreed) && !hasPer(seed.P.deskFreed)
    && !hasSeat("lead", seed.P.keyFreed) && !hasBind(seed.keys.kKeyFreed) && !hasPer(seed.P.keyFreed)
    && remLeft === 0;
  const keptIntact = hasSeat("lead", seed.P.owner) && hasBind(seed.keys.kOwner) && hasAdmit(seed.licences.l1, seed.P.owner) && hasPer(seed.P.owner)
    && hasSeat("lead", seed.P.colead) && hasBind(seed.keys.kColead) && hasDoor(seed.keys.kColead) && hasPer(seed.P.colead)
    && hasSeat("desk", seed.P.deskProved) && hasDk(seed.licences.l1, seed.P.deskProved) && hasPd(seed.P.deskProved)
    && hasAdmit(seed.licences.l1, seed.P.deskProved) && hasAdmBy(seed.licences.l1, seed.P.deskProved) && hasPer(seed.P.deskProved)
    && hasSeat("lead", seed.P.refundedOwner) && hasPer(seed.P.refundedOwner) && hasAdmit(seed.licences.l3, seed.P.refundedOwner)
    && hasSeat("lead", seed.P.keyLead) && hasBind(seed.keys.kKeyLead) && hasPer(seed.P.keyLead)
    && hasSeat("lead", seed.P.trial) && hasPer(seed.P.trial)
    && hasSeat("desk", seed.P.deskOnlyOwner) && hasDk(seed.licences.l5, seed.P.deskOnlyOwner) && hasPer(seed.P.deskOnlyOwner);
  checkFn(freedGone && keptIntact,
    "m8 purgeRetention at +31 days removes only stamped freed seats' rows and keeps all owner and proved seats' rows: "
    + JSON.stringify({ freedGone, keptIntact, remLeft }));

  /* m9 variant 2 retired (the test architect's ruling 1, 2026-11-16): this state needs the managed code to have run
     before 0016; the deploy applies every migration and stops on a failed one before it uploads the Worker
     (tools/staging-licence.sh, steps 2 and 4), and the old Worker that serves between them has no managed code.
     The first variant (a 0009 database migrated 0010..0020, where proved_at = 0 non-owner seats are stamped and owner
     unproved seats are kept) stays covered by m4 and m8. */

  /* m11: every post-0016 writer of orders records orders.licence, and 0016 backfills orders.licence where key_hash matches */
  const dbPreLinks = Object.fromEntries(
    db.raw.prepare("SELECT tag, licence FROM orders").all().map(r => [r.tag, r.licence])
  );
  const preLinksOk = dbPreLinks["attach:T1"] === seed.licences.l1
    && dbPreLinks["attach:T_REF"] === seed.licences.l3
    && dbPreLinks["attach:T_DO"] === seed.licences.l5
    && dbPreLinks["attach:T6"] === seed.licences.l6
    && dbPreLinks["attach:T2"] === null
    && dbPreLinks["attach:T_ORPHAN"] === null;
  const dbW = standInD1("");
  for (const f of migs) dbW.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  const wOwner1 = "p-w-owner-1", wCode1 = "WRT1000000000001";
  const wOwner2 = "p-w-owner-2", wCode2 = "WRT2000000000002";
  const wPayOwner = "p-w-pay", wPayCode = "WPAY000000000003";
  dbW.raw.prepare("INSERT INTO persons (person, provider, code, made) VALUES (?, 'microsoft', ?, ?), (?, 'microsoft', ?, ?), (?, 'microsoft', ?, ?)")
    .run(wOwner1, wCode1, now - DAY, wOwner2, wCode2, now - DAY, wPayOwner, wPayCode, now - DAY);
  const mkFresh = (orgName, end) => ({
    org: orgName, seats: q => q(4), leadSeats: q => q(2),
    paidUntil: q => q(end), updatesUntil: q => q(new Date(end).toISOString().slice(0, 10)),
    invoicedUntil: q => q(end), invoicedUpdatesUntil: q => q(new Date(end).toISOString().slice(0, 10)),
    orgDesks: q => q(1),
  });
  const endW = now + 400 * DAY;
  await execStatements(dbW, attachFn({
    tag: "attach:W_CREATE", run: "w1", now, code: wCode1, deskOnly: false,
    org: { provider: q => q("microsoft"), org: q => q("org-w1") },
    raise: q => "seats = seats + 2, paid_until = MAX(paid_until, " + q(endW) + ")",
    fresh: mkFresh("W1 Co", endW), noKey: NO_KEY, personPrefix: PERSON, personal: PERSONAL,
  }).statements);
  await execStatements(dbW, attachFn({
    tag: "attach:W_RAISE", run: "w2", now: now + 1000, code: wCode1, deskOnly: false,
    org: { provider: q => q("microsoft"), org: q => q("org-w1") },
    raise: q => "seats = seats + 3, paid_until = MAX(paid_until, " + q(endW + 30 * DAY) + ")",
    fresh: mkFresh("W1 Co", endW + 30 * DAY), noKey: NO_KEY, personPrefix: PERSON, personal: PERSONAL,
  }).statements);
  await execStatements(dbW, attachFn({
    tag: "attach:W_REV", run: "w3", now, revenueYear: 2028, code: wCode2, deskOnly: false,
    org: { provider: q => q("microsoft"), org: q => q("org-w2") },
    raise: q => "seats = seats + 2",
    fresh: mkFresh("W2 Co", endW), noKey: NO_KEY, personPrefix: PERSON, personal: PERSONAL,
  }).statements);
  const lW1 = dbW.raw.prepare("SELECT id FROM licences WHERE key_hash = 'attach:W_CREATE'").get().id;
  const lW2 = dbW.raw.prepare("SELECT id FROM licences WHERE key_hash = 'attach:W_REV'").get().id;
  let payStep = 0;
  const payEvents = {
    "evt_1": { act: "payment", id: "txn_1", payment: { subscription: "sub_w1", status: "active", origin: "first", periodEnd: endW, code: wPayCode, org: "Pay Co", items: [{ price: "pri_l", quantity: 1 }, { price: "pri_d", quantity: 2 }], billed: [{ price: "pri_l", quantity: 1 }, { price: "pri_d", quantity: 2 }], applied: "applied" } },
    "evt_2": { act: "payment", id: "txn_2", payment: { subscription: "sub_w1", status: "active", origin: "renewal", periodEnd: endW + 365 * DAY, code: wPayCode, items: [{ price: "pri_l", quantity: 1 }, { price: "pri_d", quantity: 2 }], billed: [{ price: "pri_l", quantity: 1 }, { price: "pri_d", quantity: 2 }], applied: "applied" } },
    "evt_3": { act: "payment", id: "txn_3", payment: { subscription: "sub_w1", status: "active", origin: "rise", periodEnd: endW + 365 * DAY, code: wPayCode, items: [{ price: "pri_l", quantity: 2 }, { price: "pri_d", quantity: 3 }], billed: [{ price: "pri_l", quantity: 1 }, { price: "pri_d", quantity: 1 }], applied: "applied" } },
    "evt_4": { act: "refund", id: "adj_4", refund: { subscription: "sub_w1", payment: "txn_2", origin: "renewal" } },
  };
  const stubPay = {
    name: "stub",
    config: () => ({ prices: new Map([["pri_l", "lead"], ["pri_d", "desk"]]) }),
    signatureOf: () => ({ t: Math.floor(now / 1000) }),
    verify: async () => true,
    eventOf: raw => JSON.parse(new TextDecoder().decode(raw)),
    classify: ev => ({ act: payEvents[ev.id].act, id: payEvents[ev.id].id }),
    readPayment: async (_io, _cfg, id) => Object.values(payEvents).find(e => e.id === id).payment,
    readSubscription: async () => ({ status: "active" }),
    readRefund: async (_io, _cfg, id) => Object.values(payEvents).find(e => e.id === id).refund,
  };
  const payRoute = makePayFn({
    clock: () => now + (++payStep) * 1000,
    fetch: async () => { throw new Error("offline"); },
    consts: { NO_KEY, PERSON, PERSONAL, SEAT_CODE_RE, ORG_DESKS_DEFAULT },
    providers: { stub: stubPay },
  });
  for (const eid of ["evt_1", "evt_2", "evt_3", "evt_4"]) {
    const res = await payRoute(new Request("https://licence.test/licence/v1/pay/stub", {
      method: "POST",
      body: JSON.stringify({ id: eid, type: payEvents[eid].act, occurred: new Date(now).toISOString() }),
    }), { PAY_PROVIDERS: "stub", DB: dbW }, "stub");
    if (res.status !== 200) throw new Error("stub pay " + eid + " failed: " + res.status + " " + await res.text());
  }
  const lPay = dbW.raw.prepare("SELECT id FROM licences WHERE key_hash = 'stub:txn_1'").get().id;
  const wOrders = Object.fromEntries(dbW.raw.prepare("SELECT tag, licence FROM orders").all().map(r => [r.tag, r.licence]));
  const postLinksOk = wOrders["attach:W_CREATE"] === lW1
    && wOrders["attach:W_RAISE"] === lW1
    && wOrders["attach:W_REV"] === lW2
    && wOrders["stub:txn_1"] === lPay
    && wOrders["stub:txn_2"] === lPay
    && wOrders["stub:txn_3"] === lPay
    && wOrders["stub:adj_4"] === lPay;
  checkFn(preLinksOk && postLinksOk,
    "m11 every writer of orders records orders.licence and 0016 backfills creating orders: "
    + JSON.stringify({ preLinksOk, postLinksOk, dbPreLinks, wOrders }));

  /* m12: YESTERDAY'S DATA TAKES WHAT CAME AFTER (the one act's brief, 2026-11-17: a migration "an existing database takes without losing a
     row"). A database at APPLIED, the last migration on the test service, filled as m1's is and with every persons column set, takes every
     migration after it: each table keeps every row with every value it held, and each column the later migrations add reads NULL, or 0 where
     its default says so, on every row kept from before: nothing is said of anyone that a later sign-in did not write. */
  const dbY = standInD1("");
  for (const f of pre) dbY.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  seed0009(dbY, now);
  for (const f of migs.filter(x => x >= "0010" && x <= APPLIED + "~")) dbY.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  dbY.raw.prepare("UPDATE persons SET erased_at = ? WHERE person = ?").run(now - DAY, "p-trial");
  const tablesY = dbY.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
  const colsY = Object.fromEntries(tablesY.map(tb => [tb, dbY.raw.prepare("PRAGMA table_info(\"" + tb + "\")").all().map(c => c.name)]));
  const rowsOf = (tb, cols) => JSON.stringify(dbY.raw.prepare("SELECT " + cols.map(c => "\"" + c + "\"").join(", ") + " FROM \"" + tb + "\" ORDER BY rowid").all());
  const yesterday = Object.fromEntries(tablesY.map(tb => [tb, rowsOf(tb, colsY[tb])]));
  const later = migs.filter(x => x > APPLIED + "~");
  for (const f of later) dbY.raw.exec(fs.readFileSync(path.join(migDir, f), "utf8"));
  const changed = tablesY.filter(tb => rowsOf(tb, colsY[tb]) !== yesterday[tb]);
  const added = [];
  for (const tb of tablesY) for (const c of dbY.raw.prepare("PRAGMA table_info(\"" + tb + "\")").all()) {
    if (colsY[tb].includes(c.name)) continue;
    /* The one stated exception (the naming press, 0026): a naming made before the press took effect at once, so 0026 marks it accepted
       at its own time; accepted_at equal to the row's `at` says nothing a sign-in did not, and any other value is still a fault. */
    const keep = tb === "lead_names" && c.name === "accepted_at" ? " AND \"accepted_at\" IS NOT \"at\"" : "";
    const off = dbY.raw.prepare("SELECT COUNT(*) AS n FROM \"" + tb + "\" WHERE \"" + c.name + "\" IS NOT NULL AND \"" + c.name + "\" IS NOT 0" + keep).get().n;
    added.push(tb + "." + c.name + (off ? " (" + off + " rows not NULL or 0)" : ""));
  }
  const filled = tablesY.filter(tb => JSON.parse(yesterday[tb]).length > 0).length;
  checkFn(later.length > 0 && changed.length === 0 && added.length > 0 && added.every(a => !a.includes("rows not")) && filled >= 17,
    "m12 a database holding yesterday's data (at " + APPLIED + ", " + filled + " tables filled) takes " + later.join(", ") + " without a row lost or a"
    + " value changed, every column added reading NULL or 0: " + JSON.stringify({ changed, added }));
}

const PLANTS = [
  { name: "invoiced-backfill", reds: ["m2"], file: "0010_paddle.sql",
    from: "UPDATE licences SET invoiced_until = paid_until, invoiced_updates_until = updates_until WHERE trial_ends IS NULL;", to: "" },
  { name: "invoiced-trials-null", reds: ["m2"], file: "0010_paddle.sql",
    from: "WHERE trial_ends IS NULL;", to: ";" },
  { name: "org-desks-one", reds: ["m2"], file: "0013_team_own.sql",
    from: "UPDATE licences SET org_desks = 1;", to: "" },
  { name: "lead-names-backfill", reds: ["m3"], file: "0013_team_own.sql",
    from: "INSERT INTO lead_names (licence, person, named_by, at)\n  SELECT s.licence, s.person, COALESCE(l.owner, 'migration'), CAST(strftime('%s', 'now') AS INTEGER) * 1000 FROM seats s JOIN licences l ON l.id = s.licence\n  WHERE s.kind = 'lead' AND s.proved_at > 0 AND l.trial_ends IS NULL AND l.desk_only = 0 AND l.owner IS NOT s.person\n  ON CONFLICT DO NOTHING;", to: "" },
  { name: "lead-names-skip-owner", reds: ["m3"], file: "0013_team_own.sql",
    from: " AND l.owner IS NOT s.person", to: "" },
  { name: "removals-backfill", reds: ["m4", "m8"], file: "0016_erase.sql",
    from: "INSERT INTO removals (licence, person, kind, at)\n  SELECT s.licence, s.person, s.kind, CAST(strftime('%s', 'now') AS INTEGER) * 1000 FROM seats s JOIN licences l ON l.id = s.licence\n  WHERE s.proved_at = 0 AND l.owner IS NOT s.person\n  ON CONFLICT DO NOTHING;", to: "" },
  { name: "removals-skip-owner", reds: ["m4", "m8"], file: "0016_erase.sql",
    from: " AND l.owner IS NOT s.person", to: "" },
  { name: "orders-backfill-year", reds: ["m5"], file: "0016_erase.sql",
    from: `UPDATE orders SET revenue_year = MAX(\n  CAST(strftime('%Y', at / 1000, 'unixepoch') AS INTEGER) + CASE WHEN EXISTS (SELECT 1 FROM licences l WHERE l.id = orders.licence AND l.trial_ends IS NULL) THEN 0 ELSE 1 END,\n  COALESCE(\n    (SELECT CAST(strftime('%Y', l.paid_until / 1000, 'unixepoch') AS INTEGER) FROM licences l WHERE l.id = orders.licence AND l.trial_ends IS NULL),\n    (SELECT MAX(CAST(strftime('%Y', l.paid_until / 1000, 'unixepoch') AS INTEGER)) FROM licences l WHERE l.trial_ends IS NULL),\n    0\n  )\n) WHERE revenue_year IS NULL;`,
    to: "UPDATE orders SET revenue_year = CAST(strftime('%Y', at / 1000, 'unixepoch') AS INTEGER) + 1 WHERE revenue_year IS NULL;" },
  { name: "orders-backfill-max-all", reds: ["m5"], file: "0016_erase.sql",
    from: "    (SELECT MAX(CAST(strftime('%Y', l.paid_until / 1000, 'unixepoch') AS INTEGER)) FROM licences l WHERE l.trial_ends IS NULL),\n",
    to: "" },
  { name: "orders-backfill-licence", reds: ["m11"], file: "0016_erase.sql",
    from: "UPDATE orders SET licence = (SELECT l.id FROM licences l WHERE l.key_hash = orders.tag) WHERE licence IS NULL;",
    to: "" },
  { name: "erasure2-no-orders-overwrite", reds: ["m6"], file: "0020_erasure2.sql",
    from: "ALTER TABLE persons ADD COLUMN erased_at INTEGER NOT NULL DEFAULT 0;",
    to: "ALTER TABLE persons ADD COLUMN erased_at INTEGER NOT NULL DEFAULT 0;\nUPDATE orders SET revenue_year = 2029 WHERE revenue_year = CAST(strftime('%Y', at / 1000, 'unixepoch') AS INTEGER) + 1;" },
  { name: "attach-orders-licence", reds: ["m11"], file: "attach.mjs",
    from: "const orderLicence = () => [statement(q => \"UPDATE orders SET licence = \" + L(q) + \" WHERE tag = \" + q(o.tag) + \" AND run = \" + q(o.run) + \" AND licence IS NULL\")];",
    to: "const orderLicence = () => [];" },
  { name: "pay-renewal-orders-licence", reds: ["m11"], file: "pay.mjs",
    from: "statement(q => \"INSERT INTO orders (tag, run, at, licence) SELECT \" + q(k.tag) + \", \" + q(k.run) + \", \" + q(now) + \", \" + R(q, \"licence\")",
    to: "statement(q => \"INSERT INTO orders (tag, run, at) SELECT \" + q(k.tag) + \", \" + q(k.run) + \", \" + q(now)" },
  /* The one act's S1 (0021_person_names.sql): a migration that drops yesterday's rows, or marks every kept person vouched. */
  { name: "names-keep-rows", reds: ["m1", "m12"], file: "0021_person_names.sql",
    from: "ALTER TABLE persons ADD COLUMN name TEXT;", to: "DELETE FROM persons; ALTER TABLE persons ADD COLUMN name TEXT;" },
  { name: "names-vouched-null", reds: ["m12"], file: "0021_person_names.sql",
    from: "ALTER TABLE persons ADD COLUMN vouched INTEGER CHECK (vouched IN (0, 1));", to: "ALTER TABLE persons ADD COLUMN vouched INTEGER DEFAULT 1 CHECK (vouched IN (0, 1)); UPDATE persons SET vouched = 1;" },
  { name: "pay-refund-orders-licence", reds: ["m11"], file: "pay.mjs",
    from: "statement(q => \"INSERT INTO orders (tag, run, at, licence) SELECT \" + q(tag) + \", \" + q(run) + \", \" + q(now) + \", \" + L(q)",
    to: "statement(q => \"INSERT INTO orders (tag, run, at) SELECT \" + q(tag) + \", \" + q(run) + \", \" + q(now)" },
];

const SVC_FILES = ["attach.mjs", "pay.mjs"];

async function runPlant(p) {
  const dir = path.join(SCRATCH, "plant-" + p.name);
  const migDir = path.join(dir, "migrations");
  fs.mkdirSync(migDir, { recursive: true });
  let matched = false;
  for (const f of listMigrations(MIG_DIR)) {
    let text = fs.readFileSync(path.join(MIG_DIR, f), "utf8");
    if (f === p.file) {
      const norm = text.replace(/\r\n/g, "\n");
      const n = norm.split(p.from).length - 1;
      if (n !== 1) throw new Error("plant " + p.name + ": target found " + n + " times in " + f);
      text = norm.split(p.from).join(p.to);
      matched = true;
    }
    fs.writeFileSync(path.join(migDir, f), text);
  }
  for (const f of SVC_FILES) {
    let text = fs.readFileSync(path.join(SERVICE, f), "utf8");
    if (f === p.file) {
      const norm = text.replace(/\r\n/g, "\n");
      const n = norm.split(p.from).length - 1;
      if (n !== 1) throw new Error("plant " + p.name + ": target found " + n + " times in " + f);
      text = norm.split(p.from).join(p.to);
      matched = true;
    }
    fs.writeFileSync(path.join(dir, f), text);
  }
  if (!matched) throw new Error("plant " + p.name + ": file not found " + p.file);
  const plantedAttach = (await import(pathToFileURL(path.join(dir, "attach.mjs")).href)).attachStatements;
  const plantedPay = (await import(pathToFileURL(path.join(dir, "pay.mjs")).href)).makePayRoute;
  const seen = [];
  await runLegs(migDir, (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); }, { attachStatements: plantedAttach, makePayRoute: plantedPay });
  return seen;
}

async function main() {
  clearScratch(SCRATCH);
  const migFiles = listMigrations(MIG_DIR);
  const watched = migFiles.map(f => ["migrations/" + f, path.join(MIG_DIR, f)]).concat(SVC_FILES.map(f => [f, path.join(SERVICE, f)]));
  const before = Object.fromEntries(watched.map(([k, p]) => [k, sha(fs.readFileSync(p))]));
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("no leg reaches the network"); };
  try {
    await runLegs(MIG_DIR, check);
    for (const p of PLANTS) {
      if (PLANTS_OFF) { skip("m10 plant " + p.name + " turns " + p.reds.join(" and ") + " red (ETIUDA_PLANTS=off)"); continue; }
      let seen = [];
      try { seen = await runPlant(p); } catch (e) { seen = ["broken: " + e.message]; }
      check(p.reds.every(id => seen.includes(id)) && !seen.some(s => s.startsWith("broken")),
        "m10 plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(seen));
    }
  } finally { globalThis.fetch = realFetch; }

  const after = Object.fromEntries(watched.map(([k, p]) => [k, sha(fs.readFileSync(p))]));
  if (PLANTS_OFF) skip("m10z service and migration files are byte for byte unchanged after plants (ETIUDA_PLANTS=off)");
  else check(watched.every(([k]) => before[k] === after[k]), "m10z service and migration files are byte for byte unchanged after plants");

  dropScratch(SCRATCH, "licence-migrations");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + " plants=" + PLANTS.length + NL);
  if (asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
    return 78;
  }
  process.stdout.write(NL + "licence-migrations  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
  return Math.min(failed, 77);
}

main().then(c => process.exit(c), e => { process.stderr.write(String(e && e.stack || e) + NL); process.exit(2); });
