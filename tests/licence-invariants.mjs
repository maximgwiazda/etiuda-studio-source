/* THE LICENCE SERVICE'S STANDING INVARIANTS (the test architect, 2026-11-12, on Claude alpha's question of 22:35: which leg would
 * have caught the Hydrogen review's B and C). Three properties, each general across the service rather than one per finding:
 *
 *   i1 A REFUSAL WRITES NOTHING. tests/licence-service.mjs is run whole in a child process, every world's database hashed table by
 *      table before and after each call; every answer of 400 or more may change only the bookkeeping a refusal is meant to keep:
 *      the rate limit's hits and the replay record's seen. Anything else a refusal leaves is a finding, listed by route,
 *      status, reason and table. The leg grows with the suite: every refusal any leg of licence-service.mjs provokes is judged.
 *   i2 A DEGENERATE BODY MEETS THE FULL BODY'S GATES. A route's empty or clearing form is refused wherever its full form is, save
 *      for an exception the record names: s91's lapsed lead clearing its own doors. Today: door/set's empty clear on a refunded
 *      licence against its full set.
 *   i3 A STORED VALUE IS JUDGED BY ITS READER'S RULE, and one writer cannot crowd out another. door/set keeps a relay address a
 *      desk will later connect to, so the service's store-time rule and the desk's own must agree on a shared list of samples; and a
 *      co-lead's full set must not push another lead's door out of what a desk is handed.
 *
 * The child is licence-service.mjs itself, loaded through a hook in this file that adds the watch and the three scenarios to its
 * text, at anchors it checks: an anchor missing is "blind", exit 2, never a quiet pass. Plants are off in the child
 * (ETIUDA_PLANTS=off), so only the real run's calls are judged.
 *
 *   node tests/licence-invariants.mjs           exit: the number of failed checks, 2 when blind
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import module from "node:module";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = fileURLToPath(import.meta.url), ROOT = path.resolve(path.dirname(HERE), "..");
const NL = "\n";

/* What a refusal may change, everywhere, and by name where a route's own refusal is meant to. */
const ALWAYS = ["hits", "seen"];
const NAMED = []
  /* A managed installation (decision 49, held for Max's ruling; Claude alpha's edit 2, "The role check is the service's and fails closed"):
     a token of a tenant whose licence follows Entra, without the role its seat needs, frees the seat it would prove (section 11.6, E5:
     "a renewal whose token lost the role frees the seat"), so a person removed in Entra stops counting at once, not a window later. A
     desk's removal so also ends the person's company store on that licence (Argon's second review of the sign-in, finding 6), as seat/free
     and person/withdraw end it: the stores row marked ended, and gone once the relay takes the notice; and its pooled places are named to
     the relay as freed (finding 8). */
  .concat(["signin", "signin/renew", "signin/desk"].map(route => ({ route, status: 403, reason: "no-role", tables: ["seats", "desk_keys", "removals", "stores", "freed_desks"],
    why: "a token without the role frees the seat it proves on a licence whose seats follow Entra, and a desk's removal ends its company store" })))
  /* Studio's sign-in answered "no-licence" makes the person's code where they have none, in the batch that spends the token, as a desk's
     answer of no licence does (the test architect's read of the held integration, erasure part, finding 4: an erasure never leaves a person
     unable to become a customer again, and a payment binds to the code). */
  .concat([{ route: "signin", status: 403, reason: "no-licence", tables: ["persons"],
    why: "a person no licence admits, their trial had, is answered with a code made for them, so they can still be bought for" }]);

/* The reader's rule for a door's relay address (i3) is the desk's own door rule, decision 31 (Claude alpha, 2026-11-12,
   the night decisions of 2026-11-11): a door is kept, offered and knocked only where its address is a relay the build
   trusts, narrower than an invitation's teamChannelOf. It is read from the pinned engine's shell/main.js, signinDoorAddressOk, and
   run here, so the samples carry addresses only and every verdict is the desk's. A pin that predates that rule leaves the address
   half of i3 NOT JUDGED (counted, never passed), and teamChannelOf is not used in its place, being the wrong rule for doors. */
const RELAY_SAMPLES = [
  "https://etiuda.dev/relay/v1", "https://etiuda.dev/relay-staging/v1", "https://relay.example.dev", "https://relay.example.dev:8443/teams/",
  "http://etiuda.dev/relay/v1", "https://ETIUDA.dev/relay/v1", "https://etiuda.dev/relay v1", "https://user@etiuda.dev/relay/v1",
  "https://etiuda.dev/relay/v1?x=1", "https://etiuda.dev/" + "a".repeat(300), "https://etiuda.dev/" + "b".repeat(600), "",
];
/* A function's whole text in the pin, from "function <name>(" to its closing brace, or null where it is not there once. */
function pinnedFunction(text, name) {
  const head = "function " + name + "(", at = text.indexOf(head);
  if (at < 0 || text.indexOf(head, at + 1) >= 0) return null;
  for (let i = text.indexOf("{", at), depth = 0; i > 0 && i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return text.slice(at, i + 1);
  }
  return null;
}
/* The desk's door rule from the pin: signinDoorAddressOk with what it reads (teamChannelOf, DOOR_RELAYS), taken from the pin's text
   together and run in a context of their own, so the verdict is the installed desk's code; null where the pin has no such rule yet.
   ETIUDA_INV_PIN_MAIN names another shell/main.js, for proving the reading against a pin not yet moved. A rule present but not
   readable throws, which the leg reports as a failure, never as NOT JUDGED. */
function deskDoorRule() {
  const file = process.env.ETIUDA_INV_PIN_MAIN || path.join(ROOT, "engine", "pinned", "shell", "main.js");
  const text = fs.readFileSync(file, "utf8");
  if (text.indexOf("function signinDoorAddressOk(") < 0) return null;
  const rule = pinnedFunction(text, "signinDoorAddressOk"), chan = pinnedFunction(text, "teamChannelOf");
  const list = /^const DOOR_RELAYS = [^\n]*;$/m.exec(text);
  if (!rule || !chan || !list) throw new Error("the pin's door rule is there but could not be read whole from " + file);
  const ctx = vm.createContext({});
  vm.runInContext(list[0].replace(/^const /, "var ") + NL + chan + NL + rule + NL + "this.rule = signinDoorAddressOk;", ctx);
  if (typeof ctx.rule !== "function") throw new Error("the pin's door rule did not load from " + file);
  return (url) => ctx.rule({ rt: "0123456789abcdef0123456789abcdef", url }, true) === true;
}

/* ---- the hook: licence-service.mjs with the watch and the scenarios added ----------------------------------------------- */
function transform(src) {
  const blind = [];
  const once = (a, b) => { if (src.split(a).length !== 2) { blind.push(a.slice(0, 70)); return; } src = src.replace(a, b); };
  once("let ipN = 0;", `let ipN = 0;
const INV = globalThis.__licenceInvariantsStore;
`);
  once("    DELEGATION: JSON.stringify(opts.delegation || DELEGATION), HASH_KEY: hashKey, PROVIDERS: TEST_PROVIDERS }, opts.env || {});",
    "    DELEGATION: JSON.stringify(opts.delegation || DELEGATION), HASH_KEY: hashKey, PROVIDERS: TEST_PROVIDERS }, opts.env || {});");
  once(`      const res = await service.fetch(new Request((co.base || "https://licence.test") + (co.prefix || "/licence/v1/") + route + (co.query || ""), init), env);
      const text = await res.text();`,
    `      let pre = INV.snap(db), preSeats = INV.seats(db), preLeft = INV.leftState(db), preInv = INV.invState(db, env.HASH_KEY);
      const act = { overlapped: INV.active > 0, leg: INV.leg };
      act.rebase = () => { pre = INV.snap(db); preSeats = INV.seats(db); preLeft = INV.leftState(db); preInv = INV.invState(db, env.HASH_KEY); };
      INV.active++; if (INV.cur) INV.cur.overlapped = true; const was = INV.cur; INV.cur = act;
      let res;
      try { res = await service.fetch(new Request((co.base || "https://licence.test") + (co.prefix || "/licence/v1/") + route + (co.query || ""), init), env); }
      finally { INV.active--; INV.cur = was; }
      const text = await res.text();
      let said = null; try { said = JSON.parse(text); } catch {}
      const named = res.status < 400 && !!said && said.ok === true && typeof said.reason === "string" && said.reason !== "";
      if (res.status >= 400 || named) { const post = INV.snap(db);
        INV.rows.push({ route, status: res.status, reason: (said && said.reason) || "", wait: named, tables: Object.keys(post).filter(k => post[k] !== pre[k]),
          took: named ? INV.took(preSeats, INV.seats(db)) : [], left: named ? INV.left(preLeft, INV.leftState(db)) : [], overlapped: act.overlapped,
          taken: named ? INV.taken(preInv, INV.invState(db, env.HASH_KEY)) : false, leg: act.leg }); }`);
  /* THE LEG THE CALL CAME FROM, named in a finding's line, so a red points at its scene. */
  once("  const leg = async (id, fn) => {\n    try { await fn(); }", "  const leg = async (id, fn) => {\n    try { INV.leg = id; await fn(); }");
  /* OA12'S INJECTED ACT (the test architect, 2026-11-18 18:08, on i1w): the leg makes its race by a write of its own inside the sign-in's call,
     after the invitation's read (a refund by raw SQL, or a withdrawal through another call, which marks the call overlapped and sets it aside);
     the watch's baseline for that call is taken again after the act, so only what the sign-in itself writes from there is judged. A write
     the sign-in makes to licences after that point is still caught (the plant inv-wait-touches-licences shows it). */
  /* Every leg that injects an act this way (OA12 and AN12, at the Join since board 1017): each such line, at least one. */
  const every = (x, y) => { if (src.split(x).length < 2) { blind.push(x.slice(0, 70)); return; } src = src.split(x).join(y); };
  every("if (!done && r) { done = true; await act(); } return r; };", "if (!done && r) { done = true; await act(); if (INV.cur && INV.cur.rebase) INV.cur.rebase(); } return r; };");
  once("  try { await legs(real, check); } finally { globalThis.fetch = realFetch; }",
    `  try { await legs(real, check);
    await globalThis.__licenceInvariants(real, { world, attach, signin, setDoors, doorFor, deskSignin, onTeams, msToken, handed, doorLines, newKey, TENANT_A, MS, DAY });
  } finally { globalThis.fetch = realFetch; }`);
  return { src, blind };
}

async function scenarios(K, h) {
  const out = {};
  /* i2: door/set's empty clear and its full set, on a licence refunded after the lead set a door. */
  {
    const w = h.world(K);
    const lic = await h.attach(w, { tenant: h.TENANT_A, leadSeats: 3, seats: 9, order: "INV-I2" });
    const lead = h.newKey();
    await h.signin(w, lead, h.MS, h.msToken(w, { sub: "inv-i2-lead" }));
    const kept = await h.setDoors(w, lead, [h.doorFor(lead, "inv-i2-a")]);
    w.db.raw.prepare("UPDATE licences SET refunded = 1 WHERE id = ?").run(lic.id);
    const full = await h.setDoors(w, lead, [h.doorFor(lead, "inv-i2-b")]);
    const empty = await h.setDoors(w, lead, []);
    const rows = w.db.raw.prepare("SELECT COUNT(*) AS n FROM doors").get().n;
    out.i2 = { kept: kept.status, full: full.status, fullReason: full.body && full.body.reason || full.text.slice(0, 40), empty: empty.status,
      emptyReason: empty.body && (empty.body.reason || (empty.body.ok ? "ok" : "")) || empty.text.slice(0, 40), rowsAfter: rows };
  }
  /* i3a: each relay sample set as a door, one per set, and whether the service kept it. */
  {
    const w = h.world(K);
    await h.attach(w, { tenant: h.TENANT_A, leadSeats: 3, seats: 9, order: "INV-I3A" });
    const lead = h.newKey();
    await h.signin(w, lead, h.MS, h.msToken(w, { sub: "inv-i3a-lead" }));
    out.i3a = [];
    let n = 0;
    for (const url of RELAY_SAMPLES) {
      const r = await h.setDoors(w, lead, [h.doorFor(lead, "inv-i3a-" + (++n), { url })]);
      out.i3a.push({ url, kept: r.status === 200 && !!(r.body && r.body.ok) });
    }
  }
  /* i3b: one co-lead's door, then another's full set of DOORS_PER_LEAD; is the first still handed to a desk? */
  {
    const w = h.world(K);
    await h.attach(w, { tenant: h.TENANT_A, leadSeats: 3, seats: 9, order: "INV-I3B" });
    const l1 = h.newKey(), l2 = h.newKey();
    await h.signin(w, l1, h.MS, h.msToken(w, { sub: "inv-i3b-l1" }));
    await h.signin(w, l2, h.MS, h.msToken(w, { sub: "inv-i3b-l2" }));
    const lone = h.doorFor(l1, "inv-i3b-lone");
    const a = await h.setDoors(w, l1, [lone]);
    const many = Array.from({ length: K.core.DOORS_PER_LEAD || 16 }, (_, i) => h.doorFor(l2, "inv-i3b-" + i));
    const b = await h.setDoors(w, l2, many);
    /* A desk on both leads' teams, each having admitted its person by code (a team is its lead's own: a desk is handed its own teams' doors). */
    const m = h.onTeams ? await h.onTeams(w, [l1, l2], () => h.msToken(w, { sub: "inv-i3b-member" }), "inv-i3b-d")
      : await h.deskSignin(w, h.msToken(w, { sub: "inv-i3b-member" }), { desk: "inv-i3b-d" });
    const got = h.handed(m) || [];
    out.i3b = { set1: a.status, set2: b.status, handed: got.length, loneHanded: got.indexOf(h.doorLines([lone], l1)[0]) > -1 };
  }
  globalThis.__licenceInvariantsStore.scenarios = out;
}

/* THIS LEG'S PLANTS (i1w's teeth), each named alone: LICENCE_INVARIANTS_PLANT=<name> node tests/licence-invariants.mjs, expected red on i1w.
   inv-admit-without-invite: a wait that takes an invitation writes its admission but leaves the invitation row, so admits and admitted_by
   change with no invites row gone; the widening must not cover it. inv-wait-touches-licences: every wait's batch writes licences where one
   is refunded, which OA12b's call meets after its injected refund; the rebased baseline must still catch it. */
const INV_PLANTS = [
  { name: "inv-admit-without-invite", from: 'q => "DELETE FROM invites WHERE licence = " + q(inv.licence) + " AND address = " + q(inv.address) + " AND " + held(q)',
    to: 'q => "DELETE FROM invites WHERE 0 AND licence = " + q(inv.licence) + " AND address = " + q(inv.address) + " AND " + held(q)' },
  { name: "inv-wait-touches-licences", from: 'const base = [c.db.prepare("DELETE FROM seen WHERE until < ?1").bind(c.now), personRow(c.db, s, c.now, spend.digest)]',
    to: 'const base = [c.db.prepare("DELETE FROM seen WHERE until < ?1").bind(c.now), c.db.prepare("UPDATE licences SET grace_days = grace_days + 1 WHERE refunded = 1"), personRow(c.db, s, c.now, spend.digest)]' },
];

function installHook() {
  const store = { rows: [], active: 0, cur: null, scenarios: null, blind: [] };
  store.snap = (db) => {
    const o = {};
    for (const { name } of db.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all()) {
      o[name] = crypto.createHash("sha256").update(JSON.stringify(db.raw.prepare("SELECT * FROM \"" + name + "\"").all())).digest("hex");
    }
    return o;
  };
  /* THE SEATS A CALL LEAVES COUNTED (i1w-seat): a seat counts only with both its seen and its proved instant set (every free in the
     service zeroes both, and seatCounts reads neither at 0), so a wait takes a seat exactly where a row comes out of the call with both set
     and either differing from what it went in with. A wait proving a freed seat again leaves seen_at at 0, and a release zeroes both; a
     wait's write is judged by what it means and not by the table (the test architect, 2026-11-15, on Claudius's ask). */
  store.seats = (db) => {
    const o = {};
    for (const r of db.raw.prepare("SELECT kind, person, licence, seen_at, proved_at FROM seats").all()) o[r.kind + "|" + r.person] = r;
    return o;
  };
  store.took = (pre, post) => Object.keys(post).filter((k) => {
    const a = pre[k], b = post[k];
    if (!(b.seen_at > 0 && b.proved_at > 0)) return false;
    return !a || a.seen_at !== b.seen_at || a.proved_at !== b.proved_at || a.licence !== b.licence;
  }).map((k) => k.split("|")[0]);
  /* WHAT A WAIT MAY WRITE FOR A REMOVAL (the test architect's E1 on b2803b8a): a wait by a person the company no longer assigns comes after
     their removal from its licence (tests/licence-service.mjs Q13b), so removals and stores rows may change only for a (licence, person)
     whose desk seat on a licence following Entra went from seen to unseen in that call, and freed_desks rows only for that person's keys
     held there before the call. Anything else such a row says is named. */
  /* A table or column a base tree (E6's) has not yet reads as empty: nothing of it can change there. */
  const rowsOr = (db, sql) => { try { return db.raw.prepare(sql).all(); } catch { return []; } };
  store.leftState = (db) => ({
    seats: rowsOr(db, "SELECT s.person, s.licence, s.seen_at, l.seat_source AS source FROM seats s JOIN licences l ON l.id = s.licence WHERE s.kind = 'desk'"),
    keys: rowsOr(db, "SELECT licence, person, desk_key FROM desk_keys"),
    removals: rowsOr(db, "SELECT * FROM removals"),
    stores: rowsOr(db, "SELECT * FROM stores"),
    freed: rowsOr(db, "SELECT * FROM freed_desks"),
  });
  store.left = (pre, post) => {
    const before = new Map(pre.seats.map((r) => [r.person, r]));
    const gone = new Set(post.seats.filter((r) => { const a = before.get(r.person);
      return r.source === "entra" && !!a && a.licence === r.licence && a.seen_at > 0 && r.seen_at === 0; }).map((r) => r.licence + "|" + r.person));
    const changed = (a, b, key) => { const was = new Map(a.map((r) => [key(r), JSON.stringify(r)])), now = new Map(b.map((r) => [key(r), JSON.stringify(r)]));
      return [...new Set([...was.keys(), ...now.keys()])].filter((k) => was.get(k) !== now.get(k)).map((k) => JSON.parse(now.get(k) || was.get(k))); };
    const off = [];
    for (const r of changed(pre.removals, post.removals, (x) => x.licence + "|" + x.person + "|" + x.kind)) if (!gone.has(r.licence + "|" + r.person)) off.push("removals " + r.licence);
    for (const r of changed(pre.stores, post.stores, (x) => x.rt)) if (!gone.has(r.licence + "|" + r.person)) off.push("stores " + String(r.rt).slice(0, 6));
    for (const r of changed(pre.freed, post.freed, (x) => x.licence + "|" + x.desk_key))
      if (!pre.keys.some((k) => k.licence === r.licence && k.desk_key === r.desk_key && gone.has(k.licence + "|" + k.person))) off.push("freed_desks " + r.licence);
    return off;
  };
  /* WHAT A WAIT MAY WRITE FOR AN INVITATION IT TOOK (the test architect's conditions of 2026-11-18 18:08, on finding 16's ruling, Claude
     alpha's words: "a person invited by email to a full team and diverted to their own trial has the admission written, so the invitation's
     press seats them when room comes"): admits, admitted_by and invites rows may change in a wait only where that same call's own diff took
     an invitation away, and only for the person whose kept address it was, on that invitation's licence. Keyed on the rows the call changed,
     never on anything a leg says. */
  /* An invitation keeps its address as a keyed hash since board 1017 (core.mjs addressKeyed: HMAC-SHA-256 under the world's HASH_KEY of
     "etiuda-licence-address", a newline and the address in lower case), so a person's kept address is compared in that form. */
  const keyedAddr = (hashKey, a) => crypto.createHmac("sha256", Buffer.from(String(hashKey), "hex")).update("etiuda-licence-address\n" + String(a).toLowerCase()).digest("hex");
  store.invState = (db, hashKey) => ({
    invites: rowsOr(db, "SELECT licence, address FROM invites"),
    admits: rowsOr(db, "SELECT licence, org FROM admits"),
    by: rowsOr(db, "SELECT licence, person, lead, team FROM admitted_by"),
    addr: Object.fromEntries(rowsOr(db, "SELECT person, address FROM persons WHERE address IS NOT NULL").map((r) => [r.person, keyedAddr(hashKey, r.address)])),
  });
  store.taken = (pre, post) => {
    const diff = (a, b, key) => { const was = new Set(a.map(key)), now = new Set(b.map(key));
      return { gone: a.filter((r) => !now.has(key(r))), came: b.filter((r) => !was.has(key(r))) }; };
    const inv = diff(pre.invites, post.invites, (r) => r.licence + "|" + r.address);
    if (!inv.gone.length || inv.came.length) return false;
    const ownAddr = (person) => post.addr[person] || pre.addr[person];
    const tookFor = (licence, person) => inv.gone.some((g) => g.licence === licence && !!ownAddr(person) && g.address === ownAddr(person));
    if (!inv.gone.every((g) => Object.keys(post.addr).some((p) => post.addr[p] === g.address))) return false;
    const ad = diff(pre.admits, post.admits, (r) => r.licence + "|" + r.org), by = diff(pre.by, post.by, (r) => [r.licence, r.person, r.lead, r.team].join("|"));
    const PERSON = "person:";
    return ad.gone.concat(ad.came).every((r) => String(r.org).startsWith(PERSON) && tookFor(r.licence, String(r.org).slice(PERSON.length)))
      && by.gone.concat(by.came).every((r) => tookFor(r.licence, r.person));
  };
  globalThis.__licenceInvariantsStore = store;
  globalThis.__licenceInvariants = scenarios;
  const target = pathToFileURL(path.join(ROOT, "tests", "licence-service.mjs")).href;
  /* A PLANT OF THIS LEG'S OWN, named alone by LICENCE_INVARIANTS_PLANT, changes one line of the service the child loads, to show a rule of
     i1w has teeth; an anchor not met once is blind. */
  const plant = INV_PLANTS.find((p) => p.name === process.env.LICENCE_INVARIANTS_PLANT);
  if (process.env.LICENCE_INVARIANTS_PLANT && !plant) store.blind.push("no plant named " + process.env.LICENCE_INVARIANTS_PLANT);
  const coreUrl = pathToFileURL(path.join(ROOT, "service", "licence", "core.mjs")).href;
  module.registerHooks({ load(url, context, next) {
    const r = next(url, context);
    if (plant && url === coreUrl) {
      const text = String(r.source);
      if (text.split(plant.from).length !== 2) { store.blind.push("plant " + plant.name + ": its line is not in core.mjs once"); return r; }
      return Object.assign({}, r, { source: text.split(plant.from).join(plant.to) });
    }
    if (url !== target) return r;
    const t = transform(String(r.source));
    store.blind = store.blind.concat(t.blind);
    return Object.assign({}, r, { source: t.src });
  } });
  process.on("exit", () => {
    try { fs.writeFileSync(process.env.LICENCE_INVARIANTS_OUT, JSON.stringify({ rows: store.rows, scenarios: store.scenarios, blind: store.blind })); } catch { /* the parent says blind */ }
  });
}

/* ---- the parent: one child, then the three judgements ---------------------------------------------------------------------- */
async function parent() {
  let checks = 0, failed = 0;
  const check = (ok, line) => { checks++; if (!ok) failed++; process.stdout.write((ok ? "  ok   " : "  FAIL ") + line + NL); };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-licence-invariants-"));
  const outFile = path.join(dir, "out.json");
  const env = Object.assign({}, process.env, { LICENCE_INVARIANTS_HOOK: "1", LICENCE_INVARIANTS_OUT: outFile, ETIUDA_PLANTS: "off" });
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, ["--import", pathToFileURL(HERE).href, path.join("tests", "licence-service.mjs")], { cwd: ROOT, env, windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d; });
    p.on("close", (c) => { if (c && c !== 0) process.stdout.write("  (licence-service.mjs itself exited " + c + ": " + err.split(/\r?\n/).filter((l) => /FAIL|Error/.test(l)).slice(0, 3).join(" | ") + ")" + NL); resolve(c); });
  });
  let got = null;
  try { got = JSON.parse(fs.readFileSync(outFile, "utf8")); } catch { got = null; }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* scratch */ }
  if (!got || got.blind.length || !got.scenarios || !got.rows.length) {
    process.stdout.write("  BLIND " + (!got ? "no result from the child (exit " + code + ")" : got.blind.length ? "anchors not in licence-service.mjs: " + got.blind.join(" | ")
      : !got.scenarios ? "the scenarios did not run" : "no refusal was watched") + NL);
    process.stdout.write("#counts checks=" + checks + " failed=" + failed + " blind=1" + NL);
    return 2;
  }

  /* i1 */
  let notJudgedW = 0;
  const allowed = (r) => r.tables.filter((t) => ALWAYS.indexOf(t) < 0 && !NAMED.some((n) => n.route === r.route && n.status === r.status
    && (n.reason === undefined || n.reason === r.reason) && n.tables.indexOf(t) > -1));
  const judged = got.rows.filter((r) => !r.overlapped && !r.wait);
  const bad = judged.filter((r) => allowed(r).length);
  const groups = new Map();
  for (const r of bad) { const k = r.route + " " + r.status + " " + r.reason + " -> " + allowed(r).join(","); groups.set(k, (groups.get(k) || 0) + 1); }
  check(judged.length >= 100 && bad.length === 0, "i1 a refusal writes nothing beyond the rate limit and the replay record: "
    + judged.length + " refusals judged (" + (got.rows.length - judged.length) + " overlapping calls set aside), " + bad.length + " wrote more"
    + (bad.length ? ": " + [...groups].map(([k, n]) => n + "x " + k).join("; ") : ""));
  check(judged.some((r) => r.tables.indexOf("hits") > -1), "i1 control: the watch sees writes at all (refusals counting a rate-limit hit are seen as such)");

  /* i1w: a named wait (decision 32, Claude alpha, 2026-11-12 23:12: a desk's sign-in when the licence has no free seat succeeds as a
     state of its own: the person proved, the token spent, the desk theirs, and the next quiet renewal seats it). Every answer that is
     ok and carries a reason is such a state; it writes the person, the person's desk and the spent token (the replay record), and
     never a seat. Since Argon's second review of the sign-in (findings 5 and 10) a wait may also write seats and desk_keys without taking a
     seat: a freed seat of the person's, proved again by the fresh sign-in yet left unseen and so counted by nobody (tests/licence-service.mjs
     Q10a holds it unseen), and, for a person the company assigned, their seats before the turn released in the same batch (Q5e). And, since
     the Grok re-review of that mend (finding 1), a wait on their own licence by a person the company no longer assigns comes after their
     removal from the company's licence, which writes removals, freed_desks and stores, as a no-role does (tests/licence-service.mjs Q13b):
     admitted only where they serve that removal (store.left, the test architect's E1). */
  const WAIT_ROWS = ["persons", "person_desks", "seen", "hits", "seats", "desk_keys", "removals", "freed_desks", "stores"];
  /* Since board 1017 (Claude alpha's word of 2026-11-22: "Join is the only way. Nobody is put on a team or a licence at sign-in by another
     person's act alone") no sign-in takes an invitation, so a wait never writes admits, admitted_by or invites: the allowance finding 16's ruling
     gave a wait that took one (R12, 7166b357) is gone, and the control below now holds that none did (store.taken still reads the call's rows). */
  const TAKEN_ROWS = [];
  /* And, since the named person's own press (board 1011), an Accept that found no lead seat free is answered ok with the reason "full" and writes the
     naming's own mark beside the replay record: lead_names (blocked_at), which is how the owner reads that the seat could not be taken and how the
     person is asked again once one is free. It writes no seat and moves nobody. */
  /* And, since board 1017, an Accept of a naming by address whose address the provider did not vouch is answered ok with the reason "confirm" and
     writes the person's candidacy (lead_candidates), which the owner confirms; it writes no seat and moves nobody. */
  const mayWrite = (r, t) => WAIT_ROWS.indexOf(t) > -1 || (r.taken === true && TAKEN_ROWS.indexOf(t) > -1) || (r.route === "lead/accept" && t === "lead_names")
    || (r.route === "lead/accept" && r.reason === "confirm" && t === "lead_candidates");
  const waits = got.rows.filter((r) => r.wait && !r.overlapped);
  if (!waits.length) { notJudgedW = 1; process.stdout.write("  NOT JUDGED i1w a named wait writes the person, the desk and the spent token and no seat: no answer was a named wait (ok with a reason) on this tree" + NL); }
  else {
    /* At most the person and the person's desk, since a repeat wait (a renewal while still waiting, a person returning) finds them already
       held exactly as a wait writes them; always the spent token. */
    const off = waits.filter((r) => r.tables.some((t) => !mayWrite(r, t)) || r.tables.indexOf("seen") < 0 || (r.took || []).length > 0 || (r.left || []).length > 0);
    check(off.length === 0, "i1w a named wait writes the person, the person's desk and the spent token, a freed seat proved again or a release, and for a person removed"
      + " from a licence following Entra only that removal's rows; it leaves no seat counted that was not: " + waits.length + " wait(s) judged ("
      + [...new Set(waits.map((r) => r.route + " " + r.reason))].join(", ") + ")" + (off.length ? "; off: " + off.map((r) => (r.leg ? r.leg + ": " : "") + r.route + " " + r.reason + " -> " + r.tables.join(",")
      + ((r.took || []).length ? " took a " + r.took.join(" and a ") + " seat" : "") + ((r.left || []).length ? " wrote " + r.left.join(", ") + " for no removal of its own" : "")).join("; ") : ""));
    check(waits.some((r) => r.tables.indexOf("removals") > -1), "i1w control: a wait that writes removals for its own removal is among those judged, so the removal rule is not judging nothing: "
      + waits.filter((r) => r.tables.indexOf("removals") > -1).length + " of " + waits.length);
    check(waits.some((r) => r.tables.indexOf("seats") > -1), "i1w control: a wait that writes the seats table is among those judged, so the seat rule is not judging nothing: "
      + waits.filter((r) => r.tables.indexOf("seats") > -1).length + " of " + waits.length);
    check(!waits.some((r) => r.taken === true), "i1w no wait took an invitation (board 1017: Join is the only way): "
      + waits.filter((r) => r.taken === true).length + " of " + waits.length);
  }

  /* i2 */
  const s = got.scenarios;
  check(s.i2.kept === 200 && s.i2.full >= 400 && s.i2.empty >= 400,
    "i2 door/set's empty clear meets the full set's gates: on a refunded licence the full set is refused (" + s.i2.full + " " + s.i2.fullReason
    + ") and so is the empty clear (" + s.i2.empty + " " + s.i2.emptyReason + "), rows " + s.i2.rowsAfter + " (s91's lapsed clear is the named exception)");

  /* i3 */
  let notJudged = 0;
  const short = (u) => (u.length > 60 ? u.slice(0, 40) + "…(" + u.length + ")" : u || "(empty)");
  const rule = deskDoorRule();
  if (rule === null) {
    notJudged++;
    process.stdout.write("  NOT JUDGED i3 door/set's relay addresses against the desk's door rule: the pin predates decision 31's signinDoorAddressOk;"
      + " what the service keeps today: " + s.i3a.filter((x) => x.kept).map((x) => short(x.url)).join(", ") + NL);
  } else {
    /* The production Worker against an installed desk (packed): what door/set kept is exactly what that desk's rule takes. A staging
       Worker against an unpackaged desk is s98d's, on the shared samples file. */
    const wrong = s.i3a.filter((x) => x.kept !== rule(x.url)).map((x) => short(x.url) + (x.kept ? " kept, the desk refuses" : " refused, the desk takes"));
    const kept = s.i3a.filter((x) => x.kept).length;
    check(s.i3a.length === RELAY_SAMPLES.length && kept > 0 && kept < s.i3a.length && wrong.length === 0,
      "i3 door/set keeps exactly the relay addresses an installed desk's door rule takes (the pin's signinDoorAddressOk, run as pinned), on "
      + s.i3a.length + " samples, " + kept + " kept: wrong on " + JSON.stringify(wrong));
  }
  check(s.i3b.set1 === 200 && s.i3b.set2 === 200 && s.i3b.loneHanded,
    "i3 one co-lead's full set does not push another lead's door out of what a desk is handed: " + JSON.stringify(s.i3b));

  process.stdout.write("#counts checks=" + checks + " failed=" + failed + " notJudged=" + (notJudged + notJudgedW) + NL);
  return Math.min(failed, 77);
}

if (process.env.LICENCE_INVARIANTS_HOOK === "1") installHook();
else if (process.argv[1] && path.resolve(process.argv[1]) === HERE) {
  parent().then((c) => process.exit(c), (e) => { process.stdout.write("  FAIL the leg threw: " + (e && e.stack || e) + NL); process.exit(1); });
}
