/* THE COUNTING PERIOD (board 559). The days spanCounted names are the pinned engine's spanPeriod
 * on one clock. Each preset and a dragged range is written under the lead's key and read back as
 * that token. The band paints the six presets, tints the one in force, greys one that reaches
 * back before counting began, and a key moves a handle by a day or a week. An answer is left out
 * only when it counts a different period, and the note says that. A rolling period that ends on
 * an earlier day still counts. A press that does not move an end writes nothing.
 *
 *     node tests/stats-span.mjs
 *
 * ETIUDA_PLANTS=off skips the plant and counts it as the one check it is. The plant turns the
 * mismatch guard off in a scratch copy, and that copy's 559o must then fail.
 */
import "./reg-stand-on.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as Studio from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import * as Stats from "../src/stats.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { newTeam, withDesk, writeTeam } from "../src/team.mjs";
import { jsonText } from "../src/plain-json.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = path.join(HERE, "stats-span.mjs");
const SCRATCH = path.join(ROOT, "scratch", "stats-span");
const PASS = "span-gate-pass";
const ONLY = process.env.SPAN_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const DAY = new Date(2026, 3, 15, 12, 0, 0);
const JAN = new Date(2026, 0, 15, 12, 0, 0);
const SPAN_TOKENS = ["rolling-1", "rolling-7", "rolling-30", "rolling-90", "rolling-365", "rolling-400",
  "this-month", "last-month", "range-2026-04-01-2026-04-10", "range-2020-01-01-2030-01-01",
  "range-2020-01-01-2020-02-01", "range-2030-01-01-2030-02-01", "rolling-0", "rolling-01", "rolling-401",
  "range-2026-02-30-2026-03-01", "range-2026-04-10-2026-04-01", "nope", ""];
const PKCS8 = Buffer.from("302e020100300506032b657004220420", "hex");

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  if (ONLY && line.indexOf(ONLY) !== 0) return;
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  skip " + line + "\n");
}
const said = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
  .replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

function sliceAt(src, marker) {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error("the pinned shell has no " + marker);
  const isFn = marker.startsWith("function");
  let par = 0, brk = 0, brc = 0, saw = false;
  for (let k = i; k < src.length; k++) {
    const ch = src[k];
    if (ch === "(") par++;
    else if (ch === ")") par--;
    else if (ch === "[") brk++;
    else if (ch === "]") brk--;
    else if (ch === "{") { brc++; saw = true; }
    else if (ch === "}") {
      brc--;
      if (isFn && saw && !par && !brk && !brc) return src.slice(i, k + 1);
    } else if (ch === ";" && !isFn && !par && !brk && !brc) return src.slice(i, k + 1);
  }
  throw new Error("could not cut " + marker);
}
function engineSpan() {
  const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
  const body = ["function channelYmd(", "function statsShiftYmd(", "const SPAN_DAYS_KEPT =",
    "function ymdReal(", "function spanShape(", "function spanPeriod("].map((m) => sliceAt(src, m)).join("\n");
  return new Function(body + "\nreturn { spanPeriod: spanPeriod, spanShape: spanShape };")();
}
function sameDays(a, b) {
  const left = a && a.from ? a : null;
  const right = b && b.from ? b : null;
  return JSON.stringify(left) === JSON.stringify(right);
}
function pair(fill) {
  const priv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8, Buffer.alloc(32, fill)]), format: "der", type: "pkcs8" });
  const key = crypto.createPublicKey(priv).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { id: "k-" + crypto.createHash("sha256").update(Buffer.from(key, "hex")).digest("hex").slice(0, 16), key, priv };
}
function seal(share, team, who, obj) {
  const inner = Object.assign({}, obj, { sig: { alg: "Ed25519", keyId: who.id } });
  inner.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(inner), who.priv).toString("hex");
  const env = Engine.statsRules().sealStatsLead(team.lead.box, team.id, team.lead.keyId, who.id, JSON.stringify(inner));
  const dir = path.join(share, "desks", who.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "stats.estat"), jsonText(env));
}
async function led(name) {
  const base = path.join(SCRATCH, name);
  const root = path.join(base, "projects");
  const share = path.join(base, "share");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await Studio.newProject(root, "Span lamps", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  await Studio.setPublishFolder(made.dir, share);
  const keyAt = path.join(base, "lead-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  const team = newTeam({ catalogs: ["span-lamps"], lead: { keyId: lead.keyId, public: lead.public } });
  return { dir: made.dir, share, keyAt, lead, team };
}
const opt = (g, now) => ({ key: g.keyAt, passphrase: PASS, now: now || DAY });

function daysLeg() {
  const engine = engineSpan();
  const bad = [];
  for (const token of SPAN_TOKENS) {
    const want = engine.spanPeriod(token, DAY);
    const got = Stats.spanCounted(token, DAY);
    if (!sameDays(got, want)) bad.push(token + " studio " + JSON.stringify(got) + " engine " + JSON.stringify(want));
  }
  const janWant = engine.spanPeriod("last-month", JAN);
  const janGot = Stats.spanCounted("last-month", JAN);
  if (!sameDays(janGot, janWant)) bad.push("last-month in January studio " + JSON.stringify(janGot) + " engine " + JSON.stringify(janWant));
  check(bad.length === 0 && janWant && janWant.from === "2025-12-01" && janWant.to === "2025-12-31"
    && engine.spanPeriod("rolling-7", DAY).from === "2026-04-09"
    && engine.spanPeriod("range-2020-01-01-2030-01-01", DAY).from === "2025-03-12",
    "559a every token's days match the pinned engine on 15 April 2026, and last month in January is December: "
    + (bad.join("; ") || "the list"));
  const kept = typeof Stats.spanKept === "function"
    ? ["rolling-7", "last-month", "range-2026-04-01-2026-04-10"].every((t) => Stats.spanKept(t) === t)
      && Stats.spanKept("rolling-401") === "" && Stats.spanKept("nope") === "" && Stats.spanKept(null) === ""
    : false;
  check(kept, "559a spanKept keeps a token the grammar accepts and nothing else");
}

async function writeLeg() {
  const g = await led("write");
  const wrote = await writeTeam(g.share, g.team, opt(g));
  const lead = { keyId: g.lead.keyId, public: g.lead.public };
  const R = Engine.statsRules();
  const presets = ["rolling-7", "rolling-30", "this-month", "last-month", "rolling-90", "rolling-365"];
  const wrong = [];
  for (const token of presets) {
    const set = await Studio.setStatsSpan(g.dir, token, opt(g));
    const back = await Studio.statsFor(g.dir, opt(g));
    const doc = R.spanDocument(fs.readFileSync(path.join(g.share, "stats-span.json"), "utf8"));
    const days = Stats.spanCounted(token, DAY);
    if (!(set && set.span === token && back.span === token && doc && doc.span === token && R.spanGenuine(doc, lead)
      && back.days && days && back.days.from === days.from && back.days.to === days.to))
      wrong.push(token + " set " + (set && set.span) + " back " + (back && back.span) + " doc " + (doc && doc.span));
  }
  check(wrong.length === 0, "559w each preset is written, signed, and read back as itself: " + (wrong.join("; ") || "the six"));
  const home = loadPage({
    api: {
      setStatsSpan: (d, span) => Studio.setStatsSpan(d, span, opt(g)).then((v) => Object.assign({ error: null }, v)),
      stats: (d) => Studio.statsFor(d, opt(g)).then((v) => Object.assign({ error: null }, v)),
    },
    uiLang: "en",
  });
  const P = home.page;
  const open = await Studio.openProject(g.dir);
  Object.assign(P.S, { open, screen: "project", section: "stats", stats: await Studio.statsFor(g.dir, opt(g)) });
  const released = typeof P.spanBandRelease === "function"
    ? await P.spanBandRelease("2026-04-01", "2026-04-10") : null;
  const dragged = R.spanDocument(fs.readFileSync(path.join(g.share, "stats-span.json"), "utf8"));
  const again = await Studio.statsFor(g.dir, opt(g));
  check(!!(released && dragged && dragged.span === "range-2026-04-01-2026-04-10" && R.spanGenuine(dragged, lead)
    && again.span === "range-2026-04-01-2026-04-10"),
    "559w a dragged span writes range-2026-04-01-2026-04-10, signed, and the read keeps it: "
    + JSON.stringify(dragged && dragged.span));
  void wrote;
}

function bandLeg() {
  const first = "2026-04-01", today = "2026-04-15";
  const presets = typeof Stats.spanPresetRows === "function" ? Stats.spanPresetRows(DAY, first) : [];
  const home = loadPage({ api: {}, uiLang: "en" });
  const P = home.page;
  P.S.open = { dir: "C:\\span", editions: [], draft: { langs: [{ code: "en", name: "English" }] } };
  P.S.screen = "project";
  P.S.section = "stats";
  P.S.stats = {
    folder: "C:\\share", head: [], rows: [], refused: [], quiet: [],
    live: { n: 0, time: "-" }, span: "rolling-7",
    days: Stats.spanCounted("rolling-7", DAY),
    spanTrack: { first, today }, spanPresets: presets,
  };
  let html = "";
  try { P.paintStats(); html = home.node("#main").innerHTML; }
  catch (e) { check(false, "559b the band threw: " + String(e && e.message || e).split("\n")[0]); return; }
  const buttons = html.match(/data-act="stats-span"/g) || [];
  const tinted = /class="on"[^>]*data-v="rolling-7"/.test(html);
  const grey = /data-v="rolling-90"[^>]*disabled/.test(html)
    && html.indexOf("This period reaches back before counting began on 1 April.") >= 0;
  const once = (said(html).match(/Counted from /g) || []).length;
  check(presets.length === 6 && buttons.length === 6 && tinted && grey && once === 1
    && html.indexOf('id="statsSpan"') >= 0,
    "559b six presets, Last 7 days tinted, Last 90 days greyed with the date, and the days said once: "
    + JSON.stringify({ presets: presets.length, buttons: buttons.length, tinted, grey, once }));
  const stepped = typeof P.spanBandKey === "function" ? P.spanBandKey("from", "ArrowLeft") : null;
  const week = stepped ? P.spanBandKey("from", "PageDown") : null;
  const after = home.node("#main").innerHTML;
  check(stepped && stepped.from === "2026-04-08" && week && week.from === "2026-04-01"
    && /data-from="2026-04-01"/.test(after),
    "559k ArrowLeft moves the first day back one and PageDown a week: "
    + JSON.stringify([stepped && stepped.from, week && week.from]));
  const pl = loadPage({ api: {}, uiLang: "pl" });
  Object.assign(pl.page.S, { open: P.S.open, screen: "project", section: "stats", stats: P.S.stats, spanHold: null });
  pl.page.paintStats();
  const ph = pl.node("#main").innerHTML;
  check(ph.indexOf("Ostatnie 7 dni") >= 0 && ph.indexOf("Poprzedni miesiąc") >= 0
    && ph.indexOf("Ostatnie 12 miesięcy") >= 0
    && ph.indexOf("Ten okres sięga wcześniej niż początek liczenia, 1 kwietnia.") >= 0
    && said(ph).indexOf("Last 7 days") < 0,
    "559b the same band in Polish, with the greyed preset's date: " + (ph.indexOf("Ostatnie 90 dni") >= 0));
}

async function omitLeg() {
  const g = await led("omit");
  const match = pair(0x41), old = pair(0x42), other = pair(0x43);
  let team = withDesk(g.team, { id: match.id, key: match.key, box: crypto.randomBytes(32).toString("hex") }, "Lamp match");
  team = withDesk(team, { id: old.id, key: old.key, box: crypto.randomBytes(32).toString("hex") }, "Lamp old");
  team = withDesk(team, { id: other.id, key: other.key, box: crypto.randomBytes(32).toString("hex") }, "Wick old");
  const wrote = await writeTeam(g.share, team, opt(g));
  const days = Stats.spanCounted("rolling-7", DAY);
  const answer = (desk, period, n) => ({
    format: 1, kind: "etiuda-statistics", desk, engine: "test",
    period, sync: "2026-04-15 09:00",
    cards: [{ id: "c-span", n, at: "2026-04-10" }],
    intents: [], misses: 0, langs: { en: n }, since: period.from, pairs: [],
    catalog: { id: "span-lamps", rev: 1 }, hash: "h-span",
  });
  seal(g.share, wrote.team, match, answer("Lamp match", days, 4));
  seal(g.share, wrote.team, old, answer("Lamp old", { from: "2026-04-01", to: "2026-04-15" }, 9));
  seal(g.share, wrote.team, other, answer("Wick old", { from: "2026-03-01", to: "2026-03-31" }, 8));
  await Studio.setStatsSpan(g.dir, "rolling-7", opt(g));
  const got = await Studio.statsFor(g.dir, opt(g));
  const uses = got.views && got.views.team ? got.views.team.uses : null;
  const names = got.spanOmit || [];
  const home = loadPage({ api: {}, uiLang: "en" });
  Object.assign(home.page.S, {
    open: { dir: g.dir, editions: [], draft: { langs: [{ code: "en", name: "English" }] } },
    screen: "project", section: "stats", stats: got,
  });
  home.page.paintStats();
  const en = said(home.node("#main").innerHTML);
  const pl = loadPage({ api: {}, uiLang: "pl" });
  Object.assign(pl.page.S, home.page.S);
  pl.page.paintStats();
  const po = said(pl.node("#main").innerHTML);
  const named = names.join(", ");
  check(uses === 4 && names.length === 2
    && en.indexOf("These teammates answered for a different period, so their figures are left out of this one:") >= 0
    && en.indexOf("older Etiuda") < 0
    && en.indexOf(named) >= 0 && en.indexOf("Lamp match") < 0
    && po.indexOf("Odpowiedzi tych członków zespołu dotyczą innego okresu, więc ich liczby nie są uwzględniane w tym okresie:") >= 0
    && po.indexOf("starsza Etiuda") < 0 && po.indexOf(named) >= 0,
    "559o a mismatched answer is left out and both teammates are named, in English and in Polish: uses "
    + uses + " names " + JSON.stringify(names) + " en " + (en.indexOf("different period") >= 0));
  const one = await led("omit-one");
  const stay = pair(0x51), gone = pair(0x52);
  let oneTeam = withDesk(one.team, { id: stay.id, key: stay.key, box: crypto.randomBytes(32).toString("hex") }, "Lamp stay");
  oneTeam = withDesk(oneTeam, { id: gone.id, key: gone.key, box: crypto.randomBytes(32).toString("hex") }, "Lamp gone");
  const oneWrote = await writeTeam(one.share, oneTeam, opt(one));
  seal(one.share, oneWrote.team, stay, answer("Lamp stay", days, 4));
  seal(one.share, oneWrote.team, gone, answer("Lamp gone", Stats.spanCounted("rolling-30", DAY), 9));
  await Studio.setStatsSpan(one.dir, "rolling-7", opt(one));
  const oneGot = await Studio.statsFor(one.dir, opt(one));
  const oneUses = oneGot.views && oneGot.views.team ? oneGot.views.team.uses : null;
  const oneNames = oneGot.spanOmit || [];
  const oneHome = loadPage({ api: {}, uiLang: "en" });
  Object.assign(oneHome.page.S, {
    open: { dir: one.dir, editions: [], draft: { langs: [{ code: "en", name: "English" }] } },
    screen: "project", section: "stats", stats: oneGot,
  });
  oneHome.page.paintStats();
  const oneEn = said(oneHome.node("#main").innerHTML);
  const onePl = loadPage({ api: {}, uiLang: "pl" });
  Object.assign(onePl.page.S, oneHome.page.S);
  onePl.page.paintStats();
  const onePo = said(onePl.node("#main").innerHTML);
  check(oneUses === 4 && oneNames.length === 1 && oneNames[0] === "Lamp gone"
    && oneEn.indexOf("Lamp gone answered for a different period, so its figures are left out of this one.") >= 0
    && oneEn.indexOf("older Etiuda") < 0
    && onePo.indexOf("Odpowiedź członka zespołu Lamp gone dotyczy innego okresu, więc jego liczby nie są uwzględniane w tym okresie.") >= 0
    && onePo.indexOf("starsza Etiuda") < 0
    && (oneGot.rows || []).length === 2,
    "559m a matched answer counts, the other period is named once, and its row stays in the table: uses "
    + oneUses + " " + JSON.stringify(oneNames));
}

/* A rolling-30 that ends yesterday is the same period. A rolling-7 under that span is not, and the
   note names the period, not a version. */
async function staleLeg() {
  const g = await led("stale");
  const fresh = pair(0x61), yesterday = pair(0x62), week = pair(0x63);
  let team = withDesk(g.team, { id: fresh.id, key: fresh.key, box: crypto.randomBytes(32).toString("hex") }, "Lamp fresh");
  team = withDesk(team, { id: yesterday.id, key: yesterday.key, box: crypto.randomBytes(32).toString("hex") }, "Lamp yesterday");
  team = withDesk(team, { id: week.id, key: week.key, box: crypto.randomBytes(32).toString("hex") }, "Lamp week");
  const wrote = await writeTeam(g.share, team, opt(g));
  const days = Stats.spanCounted("rolling-30", DAY);
  const yDays = Stats.spanCounted("rolling-30", new Date(2026, 3, 14, 12, 0, 0));
  const weekDays = Stats.spanCounted("rolling-7", DAY);
  const answer = (desk, period, n) => ({
    format: 1, kind: "etiuda-statistics", desk, engine: "test",
    period, sync: "2026-04-15 09:00",
    cards: [{ id: "c-span", n, at: "2026-04-10" }],
    intents: [], misses: 0, langs: { en: n }, since: period.from, pairs: [],
    catalog: { id: "span-lamps", rev: 1 }, hash: "h-span",
  });
  seal(g.share, wrote.team, fresh, answer("Lamp fresh", days, 4));
  seal(g.share, wrote.team, yesterday, answer("Lamp yesterday", yDays, 5));
  seal(g.share, wrote.team, week, answer("Lamp week", weekDays, 9));
  await Studio.setStatsSpan(g.dir, "rolling-30", opt(g));
  const got = await Studio.statsFor(g.dir, opt(g));
  const uses = got.views && got.views.team ? got.views.team.uses : null;
  const names = got.spanOmit || [];
  const home = loadPage({ api: {}, uiLang: "en" });
  Object.assign(home.page.S, {
    open: { dir: g.dir, editions: [], draft: { langs: [{ code: "en", name: "English" }] } },
    screen: "project", section: "stats", stats: got,
  });
  home.page.paintStats();
  const en = said(home.node("#main").innerHTML);
  const pl = loadPage({ api: {}, uiLang: "pl" });
  Object.assign(pl.page.S, home.page.S);
  pl.page.paintStats();
  const po = said(pl.node("#main").innerHTML);
  const counted = uses === 9 && names.length === 1 && names[0] === "Lamp week"
    && (got.rows || []).length === 3;
  const note = en.indexOf("Lamp week answered for a different period, so its figures are left out of this one.") >= 0
    && en.indexOf("older Etiuda") < 0 && en.indexOf("Lamp yesterday") < 0 && en.indexOf("Lamp fresh") < 0
    && po.indexOf("Odpowiedź członka zespołu Lamp week dotyczy innego okresu, więc jego liczby nie są uwzględniane w tym okresie.") >= 0
    && po.indexOf("starsza Etiuda") < 0;
  check(counted && note,
    "559p a rolling-30 that ends yesterday counts, and a rolling-7 is left out with the period named: uses "
    + uses + " names " + JSON.stringify(names) + " en " + (en.indexOf("different period") >= 0)
    + " pl " + (po.indexOf("inny okres") >= 0));
}

function fire(doc, type, ev) {
  for (const h of doc.heard) if (h.type === type) h.fn(ev);
}
function bandTarget(kind, side, track) {
  const el = {
    getAttribute(k) { return k === "data-h" ? side : null; },
    closest(sel) {
      const s = String(sel);
      if (s.indexOf("sp-track") >= 0) return track;
      if (s.indexOf("sp-h") >= 0) return kind === "handle" ? el : null;
      if (s.indexOf("sp-fill") >= 0) return kind === "fill" ? el : null;
      return null;
    },
  };
  return el;
}

/* A press, and Home or End on the day already there, write nothing. A drag still writes a range. */
async function pressLeg() {
  const g = await led("press");
  await writeTeam(g.share, g.team, opt(g));
  await Studio.setStatsSpan(g.dir, "rolling-30", opt(g));
  const days = Stats.spanCounted("rolling-30", DAY);
  let wrote = null;
  let pending = Promise.resolve();
  const home = loadPage({
    api: {
      setStatsSpan: (d, span) => {
        wrote = span;
        const p = Studio.setStatsSpan(d, span, opt(g)).then((v) => Object.assign({ error: null }, v));
        pending = p;
        return p;
      },
      stats: (d) => Studio.statsFor(d, opt(g)).then((v) => Object.assign({ error: null }, v)),
    },
    uiLang: "en",
  });
  const P = home.page;
  const open = await Studio.openProject(g.dir);
  const track = {
    getBoundingClientRect() { return { left: 0, top: 0, width: 2900, height: 24, right: 2900, bottom: 24 }; },
    setPointerCapture() {},
  };
  const arm = async () => {
    wrote = null;
    await Studio.setStatsSpan(g.dir, "rolling-30", opt(g));
    const stats = await Studio.statsFor(g.dir, opt(g));
    stats.spanTrack = { first: days.from, today: days.to };
    Object.assign(P.S, { open, screen: "project", section: "stats", stats, spanHold: null });
  };
  const token = async () => {
    await pending;
    const back = await Studio.statsFor(g.dir, opt(g));
    return back && back.span;
  };
  const down = (kind, side, x) => fire(home.doc, "pointerdown", {
    target: bandTarget(kind, side, track), clientX: x, clientY: 8, pointerId: 1, button: 0,
  });
  const up = () => fire(home.doc, "pointerup", {
    target: bandTarget("handle", "from", track), clientX: 0, clientY: 8, pointerId: 1, button: 0, type: "pointerup",
  });
  await arm();
  down("handle", "from", 2900);
  up();
  const handleSpan = await token();
  check(wrote == null && handleSpan === "rolling-30",
    "559h a press on a handle and a release with no move writes nothing and leaves rolling-30: "
    + JSON.stringify(wrote) + " " + handleSpan);
  await arm();
  down("fill", "from", 1450);
  up();
  const fillSpan = await token();
  check(wrote == null && fillSpan === "rolling-30",
    "559h a press on the fill and a release with no move writes nothing and leaves rolling-30: "
    + JSON.stringify(wrote) + " " + fillSpan);
  await arm();
  const homed = P.spanBandKey("from", "Home");
  if (P.S.spanHold && P.S.spanHold.live) await P.spanBandRelease(P.S.spanHold.from, P.S.spanHold.to);
  const homeSpan = await token();
  check(homed == null && wrote == null && homeSpan === "rolling-30",
    "559h Home at the first day already there writes nothing: "
    + JSON.stringify(homed) + " " + JSON.stringify(wrote) + " " + homeSpan);
  await arm();
  const ended = P.spanBandKey("to", "End");
  if (P.S.spanHold && P.S.spanHold.live) await P.spanBandRelease(P.S.spanHold.from, P.S.spanHold.to);
  const endSpan = await token();
  check(ended == null && wrote == null && endSpan === "rolling-30",
    "559h End at the last day already there writes nothing: "
    + JSON.stringify(ended) + " " + JSON.stringify(wrote) + " " + endSpan);
  await arm();
  down("handle", "to", 2900);
  fire(home.doc, "pointermove", {
    target: bandTarget("handle", "to", track), clientX: 0, clientY: 8, pointerId: 1, button: 0,
  });
  up();
  const dragged = await token();
  const lead = { keyId: g.lead.keyId, public: g.lead.public };
  const doc = Engine.statsRules().spanDocument(fs.readFileSync(path.join(g.share, "stats-span.json"), "utf8"));
  check(typeof dragged === "string" && dragged.indexOf("range-") === 0 && dragged !== "rolling-30"
    && doc && doc.span === dragged && Engine.statsRules().spanGenuine(doc, lead),
    "559h a drag of the last day writes a range: " + JSON.stringify(dragged));
}

/* The shell's token and the pinned spanShape, on 559a's whole list, valid and invalid. */
function shellSpanTokenFn() {
  const src = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const parts = [];
  if (src.indexOf("function studioSpanYmdReal(") >= 0) parts.push(sliceAt(src, "function studioSpanYmdReal("));
  parts.push(sliceAt(src, "function studioSpanToken("));
  const shellRequire = createRequire(path.join(ROOT, "shell", "main.js"));
  return new Function("require", parts.join("\n") + "\nreturn studioSpanToken;")(shellRequire);
}
function shellLeg() {
  const engine = engineSpan();
  const tok = shellSpanTokenFn();
  const bad = [];
  for (const token of SPAN_TOKENS) {
    const shaped = engine.spanShape(token);
    let kept = null;
    try { kept = tok(token); }
    catch (e) { bad.push(JSON.stringify(token) + " threw " + String(e && e.message || e).split("\n")[0]); continue; }
    const want = shaped ? token : "";
    if (kept !== want) bad.push(JSON.stringify(token) + " shell " + JSON.stringify(kept) + " engine " + (shaped ? "kept" : "refused"));
  }
  check(bad.length === 0 && typeof Engine.statsRules().spanShape === "function",
    "559s studioSpanToken agrees with the pinned spanShape on every token: " + (bad.join("; ") || "the list"));
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  if (!ONLY || ONLY === "559a") {
    try { daysLeg(); }
    catch (e) { check(false, "559a the day comparison threw: " + String(e && e.stack || e).split("\n")[0]); }
  }
  if (!ONLY || ONLY === "559w") {
    try { await writeLeg(); }
    catch (e) { check(false, "559w the write threw: " + String(e && e.stack || e).split("\n")[0]); }
  }
  if (!ONLY || ONLY === "559b" || ONLY === "559k") {
    try { bandLeg(); }
    catch (e) { check(false, "559b the band threw: " + String(e && e.stack || e).split("\n")[0]); }
  }
  if (!ONLY || ONLY === "559o" || ONLY === "559m") {
    try { await omitLeg(); }
    catch (e) { check(false, "559o the mismatch threw: " + String(e && e.stack || e).split("\n")[0]); }
  }
  if (!ONLY || ONLY === "559p") {
    try { await staleLeg(); }
    catch (e) { check(false, "559p the earlier day threw: " + String(e && e.stack || e).split("\n")[0]); }
  }
  if (!ONLY || ONLY === "559h") {
    try { await pressLeg(); }
    catch (e) { check(false, "559h the press threw: " + String(e && e.stack || e).split("\n")[0]); }
  }
  if (!ONLY || ONLY === "559s") {
    try { shellLeg(); }
    catch (e) { check(false, "559s the shell token threw: " + String(e && e.stack || e).split("\n")[0]); }
  }
  if (!ONLY) {
    copyPlants({
      root: ROOT, self: SELF, label: "stats-span", onlyVar: "SPAN_ONLY",
      plants: [{ mark: "span-559-omit", leg: "559o", rel: "src/studio.mjs",
        line: "    if (false) { /* plant:span-559-omit */" }],
      check, skip,
    });
  }
  process.stdout.write("stats-span " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " plants off" : "") + "\n");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + "\n");
  if (process.argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "stats-span");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write(String(e && e.stack || e) + "\n");
  try { dropScratch(SCRATCH, "stats-span"); } catch { /* the verdict is the throw */ }
  process.exit(1);
});
