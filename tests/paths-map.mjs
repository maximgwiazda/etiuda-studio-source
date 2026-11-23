/* THE PATHS MAP (board 814, step 11, S3c).
 *
 *     node tests/paths-map.mjs [--keep]
 *
 * The map from one card as ui/app.js lays it out (pathsModel: columns, arrows, places, caps, the cards that end a path),
 * where paths start (the index and the rail's number), the team's arrows read from a real statistics answer through
 * statsFor, and the acts: the editor's door, a link made from a card's dot, an arrow taken off, a team arrow adopted or
 * dismissed, the arrow keys. Every link change is read back from the draft on disk; a dismissal from project.json, with
 * the draft's bytes untouched. Markup and arithmetic only, on tests/page-stand-in.mjs: how it looks, the drag itself and
 * the scroll are Maxim's to judge.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { newTeam, withDesk, writeTeam } from "../src/team.mjs";
import { jsonText } from "../src/plain-json.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "paths-map");
const EXPECTED = 48;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null }));
const refusalOf = async (p) => { try { await p; return null; } catch (e) { return e; } };
const fold = (s) => String(s).replace(/ /g, " ");
const PLAIN = "Thank you for writing. Have a lovely day.";

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects"), share = path.join(SCRATCH, "share");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "Paths map", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const draftAt = path.join(dir, DRAFT_FILE), projAt = path.join(dir, "project.json");
  const onDisk = (id) => JSON.parse(fs.readFileSync(draftAt, "utf8")).cards.find(c => c.id === id);
  const diskNext = (id) => ((onDisk(id) || {}).next || []).map(e => e.to);
  const shelf = ((await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag).id;
  const id = {};
  const names = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "z"].concat([1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => "y" + n))
    .concat(["p", "q", "r", "s"]);
  for (const k of names) id[k] = (await S.addCard(dir, shelf, "Card " + k.toUpperCase(), PLAIN)).card.id;
  await S.saveCard(dir, id.a, { title: { pl: "Karta A po polsku" } });
  const links = { a: ["b", "c", "d"], b: ["e"], c: ["e", "f"], e: ["g"], g: ["h"], f: ["a"], i: ["a"],
    z: ["y1", "y2", "y3", "y4", "y5", "y6", "y7", "y8", "y9"], p: ["q"], q: ["p"] };
  for (const k of Object.keys(links)) await S.saveCard(dir, id[k], { next: links[k].map(x => id[x]) });
  await S.retireCard(dir, id.r);
  const back = {};
  Object.keys(id).forEach(k => { back[id[k]] = k; });
  const ks = (list) => list.map(x => back[x] || x).join(",");

  const calls = [];
  const api = {};
  for (const k of ["saveCard", "dismissPair", "dismissEnd", "statsFor"])
    api[k] = (...a) => { calls.push([k, a.slice(1)]); return wire(S[k](...a)); };
  api.stats = (d) => api.statsFor(d);
  const home = loadPage({ api, uiLang: "en" });
  const P = home.page;
  const open = await wire(S.openProject(dir));
  Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en", sel: id.a, stats: null });
  const PM = P.PM;

  try {
    /* ---- 1. THE MAP FROM ONE CARD ------------------------------------------------------------------ */

    let m = P.pathsModel(id.a);
    const colOf = (n) => ks(Object.values(m.nodes).filter(x => x.col === n).sort((u, v) => u.row - v.row).map(x => x.id));
    /* WALK THE MAP (board 862): two columns on, and no column of the cards that lead in, whose work the trail does. */
    check(colOf(0) === "a" && colOf(1) === "b,c,d" && colOf(2) === "e,f" && colOf(3) === "" && colOf(-1) === ""
          && !m.nodes[id.g] && !m.nodes[id.i] && m.nodes[id.e].hidden === 1,
      "pm1a the map runs left to right from the card, each card's links in its own order, two columns on; the third step"
      + " is a + on the card it starts from, and the cards that lead in are not drawn: "
      + JSON.stringify([colOf(-1), colOf(0), colOf(1), colOf(2), colOf(3), m.nodes[id.e].hidden]));
    const arr = m.arrows.map(a => back[a.from] + ">" + back[a.to] + (a.back ? "^" : "")).sort().join(" ");
    check(arr === "a>b a>c a>d b>e c>e c>f f>a^" && Object.keys(m.nodes).length === 6,
      "pm1b each card is drawn once: two links to one card are two arrows to it, and a link back to the start is an"
      + " arrow back, which is how a loop shows: " + arr);
    const endsMap = ks(Object.values(m.nodes).filter(x => x.ends).map(x => x.id));
    const lint = await S.lintProject(dir);
    const endsLint = lint.rows.filter(r => r.kind === "ends").map(r => r.card).sort().join(",");
    const endsPage = P.S.open.draft.cards.filter(c => P.pmEnds(c)).map(c => c.id).sort().join(",");
    check(endsMap === "d" && endsPage === endsLint && endsLint.split(",").length === 11,
      "pm1c a card that ends a path wears the mark on the map, and the page's rule names the same cards as the Lint"
      + " list's path-ends rows, over the whole catalog: map " + endsMap + ", " + endsLint.split(",").length + " in both");
    const mz = P.pathsModel(id.z);
    check(Object.values(mz.nodes).filter(x => x.col === 1).length === PM.col && mz.stubs.length === 1
          && mz.stubs[0].n === 9 - PM.col && mz.nodes[id.z].hidden === 9 - PM.col
          && /3 more cards/.test(fold(P.pathsCanvasHtml(mz))),
      "pm1d a column holds " + PM.col + " cards and says how many more there are, and the card they come from carries the"
      + " same number as its +: " + JSON.stringify(mz.stubs));
    const same = Object.values(m.nodes);
    const overlap = same.some(u => same.some(v => u !== v && Math.abs(u.x - v.x) < PM.w + PM.gx
      && Math.abs(u.y - v.y) < PM.h + PM.gy));
    const lowest = PM.pad + 3 * PM.h + 2 * PM.gy;
    check(!overlap && m.nodes[id.a].x === PM.pad && m.nodes[id.b].x === PM.pad + PM.w + PM.gx
          && m.width === PM.pad * 2 + 3 * PM.w + 2 * PM.gx + PM.inset && m.height === lowest + PM.gy + PM.pad
          && Math.abs((m.nodes[id.a].y + PM.h / 2) - (m.nodes[id.c].y + PM.h / 2)) < 1e-9,
      "pm1e no two cards overlap, a column is one card and one gap wide, the canvas is as big as its columns and"
      + " tallest column, and room for the arrow back's lane and corridor, and a column is centred on the tallest, so"
      + " the card sits level with the middle of its next: " + JSON.stringify([m.width, m.height]));
    /* AN ARROW BACK NEVER RUNS BEHIND A CARD (Claude alpha's proposal of 2026-10-07 00:43, on the hook Maxim marked): the
       route's every point, sampled along its runs and corners, lies outside every card, and it comes into its card at
       the right edge under the middle. The same-column case is planted on the page's copy alone (B linked on to C, both
       in the second column), never written. CONTROL: the curve the map drew before, for the same two arrows, passes
       behind a card, so the sampling can see the fault it rules out. */
    const pathPts = (d) => {
      const t = d.trim().split(/\s+/), pts = [];
      let i = 0, cur = null;
      while (i < t.length) {
        const c = t[i++];
        if (c === "M" || c === "L") { const p = [+t[i++], +t[i++]]; if (cur && c === "L") for (let s = 1; s <= 20; s++) pts.push([cur[0] + (p[0] - cur[0]) * s / 20, cur[1] + (p[1] - cur[1]) * s / 20]); else pts.push(p); cur = p; }
        else if (c === "Q") { const q = [+t[i++], +t[i++]], p = [+t[i++], +t[i++]]; for (let s = 1; s <= 10; s++) { const u = s / 10; pts.push([(1 - u) * (1 - u) * cur[0] + 2 * (1 - u) * u * q[0] + u * u * p[0], (1 - u) * (1 - u) * cur[1] + 2 * (1 - u) * u * q[1] + u * u * p[1]]); } cur = p; }
        else if (c === "C") { const a1 = [+t[i++], +t[i++]], a2 = [+t[i++], +t[i++]], p = [+t[i++], +t[i++]]; for (let s = 1; s <= 40; s++) { const u = s / 40, v = 1 - u; pts.push([v * v * v * cur[0] + 3 * v * v * u * a1[0] + 3 * v * u * u * a2[0] + u * u * u * p[0], v * v * v * cur[1] + 3 * v * v * u * a1[1] + 3 * v * u * u * a2[1] + u * u * u * p[1]]); } cur = p; }
        else throw new Error("path word " + c);
      }
      return pts;
    };
    const behind = (mm, d) => pathPts(d).some(([x, y]) => Object.values(mm.nodes).some(n => x > n.x + 1 && x < n.x + PM.w - 1
      && y > n.y + 1 && y < n.y + PM.h - 1));
    const oldCurve = (mm, a) => { const f = mm.nodes[a.from], t = mm.nodes[a.to], sx = f.x + PM.w, sy = f.y + PM.h / 2;
      return ["M", sx, sy, "C", sx + PM.gx, sy + PM.h, t.x - PM.gx, t.y + PM.h * 1.5, t.x, t.y + PM.h / 2].join(" "); };
    const bWas = P.cardById(id.b).next;
    P.cardById(id.b).next = [{ to: id.e }, { to: id.c }];
    const ms = P.pathsModel(id.a);
    P.cardById(id.b).next = bWas;
    const backs = [m.arrows.find(a => a.from === id.f && a.to === id.a), ms.arrows.find(a => a.from === id.b && a.to === id.c)];
    const clear = backs.map((a, k) => { const mm = k ? ms : m, t = mm.nodes[a.to], end = pathPts(a.d).pop();
      return !!a && a.back && !behind(mm, a.d) && end[0] === t.x + PM.w && end[1] > t.y + PM.h / 2 && end[1] < t.y + PM.h; });
    const oldBehind = backs.map((a, k) => behind(k ? ms : m, oldCurve(k ? ms : m, a)));
    /* A DENSE GAP, planted on the page's copy alone (the test architect's read of 2026-10-07): a card (Y1) with five next
       cards, each leading on to one more card and back to Y1, and that card back to Y1 too, asks ten lanes of the gap
       right of Y1. At a fixed 9 px step two of the ten ran behind a next card. */
    const fanX = ["y2", "y3", "y4", "y5", "y6"], fanY = ["y7", "y8", "y9", "s", "d"];
    const fanWas = ["y1"].concat(fanX, fanY).map(k => [k, P.cardById(id[k]).next]);
    P.cardById(id.y1).next = fanX.map(k => ({ to: id[k] }));
    fanX.forEach((k, i) => { P.cardById(id[k]).next = [{ to: id[fanY[i]] }, { to: id.y1 }]; });
    fanY.forEach((k) => { P.cardById(id[k]).next = [{ to: id.y1 }]; });
    const mh = P.pathsModel(id.y1);
    fanWas.forEach(([k, was]) => { P.cardById(id[k]).next = was; });
    const fanBacks = mh.arrows.filter(a => a.back);
    const fanBehind = fanBacks.filter(a => behind(mh, a.d)).length;
    check(clear.every(Boolean) && oldBehind.every(Boolean) && ms.nodes[id.b].col === ms.nodes[id.c].col
          && fanBacks.length === 10 && fanBehind === 0,
      "pm1g an arrow back, across columns (F to A) and within one (B to C, planted), runs beside and under the cards and"
      + " never behind one, into its card's right edge under the dot, and so do all ten of a fan of five next cards"
      + " (planted); the curve it replaced ran behind a card both times: "
      + JSON.stringify({ clear, oldBehind, fan: [fanBacks.length, fanBehind] }));
    const lone = P.pathsModel(id.s);
    check(lone && Object.keys(lone.nodes).length === 1 && lone.arrows.length === 0 && P.pathsModel("c-nowhere") === null,
      "pm1f CONTROL: a card with no links and none to it is a map of one card and no arrow; a card not here is no map");

    /* ---- 2. WHERE PATHS START ---------------------------------------------------------------------- */

    check(ks(P.pathsStarts().map(c => c.id)) === "i,z,p" && P.pathsReach(id.i) === 8,
      "pm2a paths start at each card that links on and that nothing links to, then at the first card of a loop nothing"
      + " leads into, and a path from I reaches eight cards: " + ks(P.pathsStarts().map(c => c.id)) + ", " + P.pathsReach(id.i));
    P.paintRail();
    const rail = home.node("#rail").innerHTML;
    const rows = [...rail.matchAll(/data-v="([a-z]+)"/g)].map(x => x[1]);
    check(/data-v="paths"[^]*?<span class="num">3<\/span>/.test(rail)
          && rows.indexOf("paths") === rows.indexOf("categories") + 1 && rows.indexOf("facts") === rows.indexOf("paths") + 1,
      "pm2b the rail has a Paths row between Categories and Quick facts, counting the three paths: " + rows.join(","));
    P.S.section = "paths";
    P.paintMain();
    const index = home.node("#main").innerHTML;
    const listed = [...index.matchAll(/<tr data-act="paths-show" data-id="([^"]+)"/g)].map(x => x[1]);
    P.S.q = "card y";
    P.paintMain();
    const found = [...home.node("#main").innerHTML.matchAll(/<tr data-act="paths-show" data-id="([^"]+)"/g)].map(x => x[1]);
    P.S.q = "";
    check(ks(listed) === "i,z,p" && /8 cards/.test(fold(index)) && found.length === 9,
      "pm2c with no card chosen the section is the index of where paths start, each with how many cards it leads to;"
      + " words in the search box find any card by its title: " + ks(listed) + "; " + found.length + " for card y");

    /* ---- 3. THE TEAM'S ARROWS, FROM A STATISTICS ANSWER ------------------------------------------- */

    fs.mkdirSync(share, { recursive: true });
    const PASS = "paths-map-gate";
    const keyAt = path.join(SCRATCH, "lead-key.json");
    const keyFile = await makeKeyFile({ passphrase: PASS });
    fs.writeFileSync(keyAt, JSON.stringify(keyFile, null, 1) + "\n");
    /* A real Ed25519 desk key from a fixed seed, its id the one it makes, so the answer is signed inside the seal as a
       desk signs it and the lead's Studio counts it (board 891's C1). */
    const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
    const deskPriv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, Buffer.alloc(32, 0x5e)]), format: "der", type: "pkcs8" });
    const deskKey = crypto.createPublicKey(deskPriv).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    const deskId = "k-" + crypto.createHash("sha256").update(Buffer.from(deskKey, "hex")).digest("hex").slice(0, 16);
    let rosterTeam = newTeam({ catalogs: ["paths-map"], lead: { keyId: keyFile.keyId, public: keyFile.public } });
    rosterTeam = withDesk(rosterTeam, {
      id: deskId, key: deskKey, box: crypto.randomBytes(32).toString("hex"),
    }, "Lamp desk");
    const wrote = await writeTeam(share, rosterTeam, { key: keyAt, passphrase: PASS });
    const pairs = [[id.a, id.h, 40], [id.a, id.b, 10], [id.a, id.c, 2], [id.b, id.e, 1], [id.a, id.y1, 5], [id.a, id.y2, 3]];
    const inner = {
      format: 1, kind: "etiuda-statistics", desk: "dtest-one", engine: "2.0.0-dev",
      period: { from: "2026-09-01", to: "2026-09-30" }, sync: "2026-09-30 13:00",
      cards: [{ id: id.a, n: 3 }], intents: [], misses: 0, langs: { en: 3 },
      pairs: pairs.map(([from, to, n]) => ({ from, to, n })), catalog: { id: "paths-map", rev: 1 }, hash: "djb2:0" };
    inner.sig = { alg: "Ed25519", keyId: deskId };
    inner.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(inner), deskPriv).toString("hex");
    const env = Engine.statsRules().sealStatsLead(wrote.team.lead.box, wrote.team.id, wrote.team.lead.keyId, deskId, JSON.stringify(inner));
    fs.mkdirSync(path.join(share, "desks", deskId), { recursive: true });
    fs.writeFileSync(path.join(share, "desks", deskId, "stats.estat"), jsonText(env));
    const proj = JSON.parse(fs.readFileSync(projAt, "utf8"));
    proj.folder = share;
    fs.writeFileSync(projAt, JSON.stringify(proj, null, 2) + "\n");
    /* rolling-30 of 30 September 2026 is this answer's declared period, so the span counts it. */
    const spanNow = new Date(2026, 8, 30, 12, 0, 0);
    api.statsFor = (d) => wire(S.statsFor(d, { key: keyAt, passphrase: PASS, now: spanNow }));
    api.stats = (d) => api.statsFor(d);
    P.S.stats = await api.statsFor(dir);
    m = P.pathsModel(id.a);
    const team = m.arrows.filter(a => a.team).map(a => back[a.to] + ":" + a.n).join(",");
    const w = (f, t) => (m.arrows.find(a => a.from === id[f] && a.to === id[t]) || {}).w;
    check(team === "h:40,y1:5" && m.arrows.filter(a => a.team && a.from === id.a).length === PM.team,
      "pm3a the team's totals that are not links are dotted arrows, the " + PM.team + " most travelled from a card, read"
      + " through statsFor from a desk's answer: " + team);
    check(w("a", "h") === 6 && w("a", "b") === 3.8 && w("a", "c") === 2.5 && w("b", "e") === 2.2 && w("a", "d") === 2,
      "pm3b an arrow is as thick as the team's total along it, the most travelled on the map at 6, and a link the team"
      + " never took at 2: " + JSON.stringify([w("a", "h"), w("a", "b"), w("a", "c"), w("b", "e"), w("a", "d")]));
    P.pm().root = id.a; P.pm().sel = { from: id.a, to: id.h }; P.pm().panel = true;
    let panel = fold(P.pathsPanelHtml(m));
    const teamPanel = /The team: 40 times, 67% of the copies after this card\./.test(panel)
      && /data-act="paths-adopt"/.test(panel) && /data-act="paths-dismiss"/.test(panel) && !/paths-unlink/.test(panel);
    P.pm().sel = { from: id.a, to: id.b };
    panel = fold(P.pathsPanelHtml(m));
    check(teamPanel && /The team: 10 times, 17% of the copies after this card\./.test(panel) && /data-act="paths-unlink"/.test(panel)
          && !/paths-adopt/.test(panel),
      "pm3c a chosen team arrow offers Link them and Dismiss with the team's share, a chosen link offers Take the link off");
    P.paintPaths();
    const withTeam = fold(home.node("#main").innerHTML);
    check(/Thickness shows how often the team went this way, 2026-09-01 to 2026-09-30\./.test(withTeam)
          && /the team&#39;s copies, not yet a link/.test(withTeam) && /40×/.test(withTeam),
      "pm3d the map says what thickness means over the period the desks declared, and keys the dotted arrow");
    const statsWas = P.S.stats;
    P.S.stats = null;
    const bare = P.pathsModel(id.a);
    P.paintPaths();
    const noTeam = fold(home.node("#main").innerHTML);
    P.S.stats = statsWas;
    check(bare.arrows.every(a => !a.team && a.w === 2) && !/Thickness/.test(noTeam) && !/not yet a link/.test(noTeam)
          && /The first card opens its panel\./.test(noTeam),
      "pm3e CONTROL: with no statistics read the map is the catalog's links alone, all one weight, and says nothing about"
      + " thickness");

    /* ---- 4. THE ACTS ------------------------------------------------------------------------------- */

    P.pm().root = id.a; P.pm().sel = { id: id.a }; P.S.q = "card z";
    P.paintPaths();
    const searched = home.node("#main").innerHTML;
    P.S.q = "";
    P.paintPaths();
    check(/<tr data-act="paths-show" data-id="/.test(searched) && searched.indexOf(id.z) > 0 && P.pm().root === id.a
          && /Paths from the card: Karta A po polsku|Paths from the card: Card A/.test(home.node("#main").innerHTML),
      "pm2d words typed on a map search for another card's map, and the map comes back as it was when the box is emptied");
    const el = (attrs) => ({ getAttribute: (k) => (k in attrs ? attrs[k] : null) });
    P.S.section = "cards";
    const door = /<button class="btn sm cn-door"([^>]*)>/.exec(P.nextHtml(P.cardById(id.c)));
    check(door && /data-act="paths-show"/.test(door[1]) && /data-id="([^"]+)"/.exec(door[1])[1] === id.c
          && !/disabled/.test(door[1]),
      "pm4a the editor's door to the Paths map is open and names its card");
    await P.ACTS["paths-show"](el({ "data-id": id.c }));
    check(P.S.section === "paths" && P.pm().root === id.c && P.S.sel === id.c && P.pm().sel.id === id.c
          && /Paths from the card: Card C/.test(home.node("#main").innerHTML),
      "pm4b pressed, it opens the map at that card with the card chosen");
    P.ACTS["paths-link"](el({ "data-id": id.d }));
    const linking = P.pm().link;
    P.ACTS["paths-pick"](el({ "data-id": id.g }));
    await P.flush();
    check(linking === id.d && P.pm().link === null && ks(diskNext(id.d)) === "g" && ks(P.cardById(id.d).next.map(e => e.to)) === "g",
      "pm4c a card's dot pressed and then another card links the first to the second, on the page and in the file");
    const cannot = [P.pathsLink(id.d, id.d), P.pathsLink(id.d, id.g), P.pathsLink(id.d, id.r), P.pathsLink(id.d, "c-nowhere")];
    await P.flush();
    check(cannot.every(x => x === false) && ks(diskNext(id.d)) === "g",
      "pm4d CONTROL: no link to the card itself, to one already linked, to a retired card or to one not here");
    P.ACTS["paths-arrow"](el({ "data-from": id.c, "data-to": id.e }));
    P.ACTS["paths-unlink"](el({ "data-from": id.c, "data-to": id.e }));
    await P.flush();
    check(ks(diskNext(id.c)) === "f" && P.pm().sel.id === id.c,
      "pm4e a chosen arrow taken off leaves the card's other links as they were: " + ks(diskNext(id.c)));
    P.ACTS["paths-adopt"](el({ "data-from": id.a, "data-to": id.h }));
    await P.flush();
    check(ks(diskNext(id.a)) === "b,c,d,h" && !P.pathsModel(id.a).arrows.some(a => a.team && a.to === id.h),
      "pm4f a team arrow adopted is a link at the end of the card's list, and is no longer dotted: " + ks(diskNext(id.a)));
    const draftSha = sha(draftAt);
    await P.ACTS["paths-dismiss"](el({ "data-from": id.a, "data-to": id.y1 }));
    const kept = JSON.parse(fs.readFileSync(projAt, "utf8")).notPaths;
    const again = await api.statsFor(dir);
    check(JSON.stringify(kept) === JSON.stringify([{ from: id.a, to: id.y1 }]) && sha(draftAt) === draftSha
          && JSON.stringify(again.notPaths) === JSON.stringify(kept)
          && P.pathsModel(id.a).arrows.filter(a => a.team).map(a => back[a.to]).join(",") === "y2",
      "pm4g Dismiss is kept in project.json and the draft's bytes are untouched; the statistics answer carries it, and"
      + " the next most travelled arrow takes its place: " + JSON.stringify(kept && kept.map(x => ks([x.from, x.to]))));
    const noCard = await refusalOf(S.dismissPair(dir, id.a, "c-nowhere"));
    check(noCard && /no card "c-nowhere" in this catalog/.test(noCard.message)
          && JSON.stringify(JSON.parse(fs.readFileSync(projAt, "utf8")).notPaths) === JSON.stringify(kept),
      "pm4h CONTROL: a dismissal naming a card not here is refused with the catalog's own sentence, and nothing is kept");
    m = P.pathsModel(id.a);
    const walk = [["a", "ArrowRight"], ["a", "ArrowLeft"], ["b", "ArrowDown"], ["b", "ArrowUp"], ["e", "ArrowLeft"],
      ["a", "Enter"]].map(([k, key]) => back[P.pathsWalk(m, id[k], key)] || "-").join(",");
    check(walk === "d,-,c,-,c,-",
      "pm4i the arrow keys move to the nearest card in the next column, the one below, the nearest in the column before;"
      + " nothing past an edge: " + walk);
    P.pm().root = id.a; P.pm().sel = { id: id.a };
    const node = { getAttribute: (k) => (k === "data-id" ? id.a : null) };
    node.closest = (s) => (s === ".pm-node" ? node : null);
    const key = (target, k) => ({ target, key: k, altKey: false, ctrlKey: false, metaKey: false,
      preventDefault() { this.prevented = true; } });
    const moved = P.pathsKey(key(node, "ArrowRight"));
    P.ACTS["paths-link"](el({ "data-id": id.b }));
    const esc = key(node, "Escape");
    const stopped = P.pathsKey(esc);
    check(moved === "walk" && P.pm().sel.id === id.d && P.S.sel === id.d && stopped === "stop" && esc.prevented
          && P.pm().link === null,
      "pm4j a walk chooses the card it lands on, and Escape stops a link being made");
    P.pm().root = id.a; P.pm().sel = { id: id.a }; P.S.sel = id.a;
    P.paintPaths();
    P.ACTS["next-remove"](el({ "data-i": String(P.cardById(id.a).next.map(e => e.to).indexOf(id.h)) }));
    const canvas = home.node("#pmCanvas").outerHTML;
    await P.flush();
    check(ks(diskNext(id.a)) === "b,c,d"
          && canvas.indexOf('data-from="' + id.a + '" data-to="' + id.h + '" data-team="1"') >= 0
          && canvas.indexOf('data-from="' + id.a + '" data-to="' + id.b + '" data-team=""') >= 0,
      "pm4l a link taken off in the panel's Next list is redrawn on the canvas at once, here as the team's dotted arrow"
      + " it was before it was adopted");
    P.ACTS["paths-edit"](el({ "data-id": id.f }));
    check(P.S.section === "cards" && P.S.sel === id.f,
      "pm4k Open in the editor goes to the cards with that card open");
    /* THE PANEL'S NEXT LIST EDITS THE CARD IT SHOWS. The panel paints the editor's Next field for the map's chosen card,
       and every act of that field finds its card through S.sel; two ways of changing the chosen card left S.sel behind
       (the read of S3c). Each clause presses the panel's row-0 remove and reads both cards back from the disk. */
    const panelNow = () => { const h = home.node("#main").innerHTML, at = h.indexOf('id="pmPanel"'); return at < 0 ? "" : h.slice(at); };
    const shows = (c) => panelNow().indexOf('data-act="paths-edit" data-id="' + c + '"') >= 0;
    const row0 = () => /data-act="next-remove" data-i="0"/.test(panelNow());
    P.pathsLink(id.c, id.e);
    await P.flush();
    await P.ACTS["paths-show"](el({ "data-id": id.a }));
    P.ACTS["paths-arrow"](el({ "data-from": id.c, "data-to": id.e }));
    P.ACTS["paths-unlink"](el({ "data-from": id.c, "data-to": id.e }));
    await P.flush();
    const shown1 = shows(id.c) && row0();
    const a1 = ks(diskNext(id.a));
    P.ACTS["next-remove"](el({ "data-i": "0" }));
    await P.flush();
    const one = [a1, ks(diskNext(id.a)), ks(diskNext(id.c))];
    const unlinked = shown1 && one[0] === "b,c,d" && one[1] === "b,c,d" && one[2] === "";
    await P.ACTS["paths-show"](el({ "data-id": id.a }));
    P.ACTS.section(el({ "data-v": "cards" }));
    P.ACTS.pick(el({ "data-id": id.z }));
    P.pm().panel = true;   /* the panel as asked for before the trip to Cards (Walk the map: it opens on demand) */
    P.ACTS.section(el({ "data-v": "paths" }));
    const shown2 = P.S.section === "paths" && shows(id.a) && row0();
    const a2 = ks(diskNext(id.a));
    P.ACTS["next-remove"](el({ "data-i": "0" }));
    await P.flush();
    const two = [a2, ks(diskNext(id.a)), ks(diskNext(id.z))];
    const returned = shown2 && two[0] === "b,c,d" && two[1] === "c,d" && two[2] === "y1,y2,y3,y4,y5,y6,y7,y8,y9";
    check(unlinked && returned,
      "pm4m the panel's Next list edits the card it shows: after an arrow taken off, the row-0 remove takes F off C and"
      + " leaves A whole (" + (unlinked ? "ok" : "FAIL") + " " + JSON.stringify(one) + "); after Cards, Z chosen and the"
      + " rail back, it takes B off A and leaves Z whole (" + (returned ? "ok" : "FAIL") + " " + JSON.stringify(two) + ")");

    /* ---- 6. WALK THE MAP (board 862) ------------------------------------------------------------------
       A press on a next card walks on to it; the card left goes into the trail, whose crumbs and Backspace step back;
       the first card's press opens and shuts its panel; Escape shuts it; a link being made still takes the press. Read
       from the page's state and markup; a press is the act on a card's element, as the page's one handler hands it. */
    const mainNow = () => fold(home.node("#main").innerHTML);
    const trailNow = () => { const h = mainNow(), at = h.indexOf('id="pmTrail"'); return at < 0 ? "" : h.slice(at, h.indexOf("</nav>", at)); };
    const panelShown = () => /id="pmPanel"(?! hidden)/.test(mainNow()) && !/id="pmPanel" hidden/.test(mainNow());
    const nodeEl = (k) => { const n = { getAttribute: (a) => (a === "data-id" ? id[k] : null) }; n.closest = (s) => (s === ".pm-node" ? n : null); return n; };
    await P.ACTS["paths-show"](el({ "data-id": id.a }));
    const opened = [P.pm().root === id.a, P.pm().trail.length === 0, !panelShown()];
    P.ACTS["paths-pick"](el({ "data-id": id.c }));
    const w1 = [P.pm().root, P.pm().trail.slice(), P.S.sel, panelShown()];
    const crumb = /<button class="cr" data-act="paths-back" data-i="0"[^>]*>Card A<\/button>/.test(trailNow())
      && /<span class="cr here" aria-current="step">Card C<\/span>/.test(trailNow());
    /* the panel opens on a card with nothing after it (paths-next-hop, pm8a): C has nothing after it, which pm4m proves,
       so the expectation is fixed here rather than read back from the card; pm6b holds the shut panel on F, which has */
    check(opened.every(Boolean) && w1[0] === id.c && ks(w1[1]) === "a" && w1[2] === id.c && w1[3] === true && crumb
          && /Paths from the card: Card C/.test(mainNow()),
      "pm6a a map opens with no trail and its panel shut; a press on a next card walks on to it, the card left becomes a"
      + " crumb that steps back, and the panel stays shut unless the card has nothing after it (pm8a): " + JSON.stringify([opened, ks([w1[0]]), ks(w1[1])]));
    P.ACTS["paths-pick"](el({ "data-id": id.f }));
    const w2 = ks(P.pm().trail) + ">" + ks([P.pm().root]), fShut = !panelShown();
    const kd = (target, k) => ({ target, key: k, altKey: false, ctrlKey: false, metaKey: false, preventDefault() { this.prevented = true; } });
    const field = { tagName: "INPUT", closest: () => null };
    const typed = P.pathsKey(kd(field, "Backspace"));
    const typedStill = ks(P.pm().trail) + ">" + ks([P.pm().root]);
    const placesWere = P.S.places;
    P.S.places = { list: [] };
    const under = P.pathsKey(kd(nodeEl("f"), "Backspace"));
    const underStill = ks(P.pm().trail) + ">" + ks([P.pm().root]);
    P.S.places = placesWere;
    const bs = kd(nodeEl("f"), "Backspace");
    const stepped = P.pathsKey(bs);
    const afterBs = ks(P.pm().trail) + ">" + ks([P.pm().root]);
    check(w2 === "a,c>f" && fShut && typed === "" && typedStill === "a,c>f" && under === "" && underStill === "a,c>f" && stepped === "back"
          && bs.prevented && afterBs === "a>c",
      "pm6b a walk on to F, which has cards after it, leaves the panel shut though C's was open; Backspace steps back one"
      + " crumb; CONTROL: in a field it is the field's, and under the places overlay the places', and the walk stays where it"
      + " was: " + JSON.stringify([w2, fShut, typed, typedStill, under, underStill, stepped, afterBs]));
    P.ACTS["paths-pick"](el({ "data-id": id.f }));
    P.ACTS["paths-back"](el({ "data-i": "0" }));
    check(P.pm().root === id.a && P.pm().trail.length === 0 && P.S.sel === id.a && /Paths from the card: Card A/.test(mainNow()),
      "pm6c a crumb pressed goes back to its card, and the crumbs after it come off the trail");
    P.ACTS["paths-pick"](el({ "data-id": id.a }));
    const rootOpen = panelShown() && /data-act="paths-edit" data-id="/.test(mainNow());
    P.ACTS["paths-pick"](el({ "data-id": id.a }));
    const rootShut = !panelShown();
    P.ACTS["paths-pick"](el({ "data-id": id.a }));
    const esc2 = kd(nodeEl("a"), "Escape");
    const shut = P.pathsKey(esc2);
    const escShut = shut === "shut" && esc2.prevented && !panelShown() && P.pm().root === id.a;
    P.ACTS["paths-arrow"](el({ "data-from": id.a, "data-to": id.c }));
    const arrowOpen = panelShown() && /data-act="paths-unlink"/.test(mainNow());
    check(rootOpen && rootShut && escShut && arrowOpen,
      "pm6d the first card's press opens its panel and a second press shuts it, Escape shuts it, an arrow's press opens"
      + " it on that arrow: " + JSON.stringify([rootOpen, rootShut, escShut, arrowOpen]));
    const plus = el({ "data-id": id.f });
    plus.closest = (s) => (s === "#pmCanvas" ? {} : null);
    P.ACTS["paths-pick"](el({ "data-id": id.c }));
    P.ACTS["paths-show"](plus);
    const byPlus = ks(P.pm().trail) + ">" + ks([P.pm().root]);
    P.ACTS["paths-index"]();
    await P.ACTS["paths-show"](el({ "data-id": id.c }));
    const byRow = ks(P.pm().trail) + ">" + ks([P.pm().root]);
    check(byPlus === "a,c>f" && byRow === ">c",
      "pm6e a card's + on the map walks on to it like a press; a row of the index opens a fresh map with no trail: "
      + JSON.stringify([byPlus, byRow]));
    P.ACTS["paths-link"](el({ "data-id": id.c }));
    P.ACTS["paths-pick"](el({ "data-id": id.d }));
    await P.flush();
    check(P.pm().root === id.c && P.pm().trail.length === 0 && ks(diskNext(id.c)).split(",").indexOf("d") >= 0
          && P.pm().sel.from === id.c && P.pm().sel.to === id.d && panelShown(),
      "pm6f CONTROL: while a link is being made a press on a card links to it and does not walk, and the panel opens on"
      + " the new link: " + ks(diskNext(id.c)));

    const lone6 = P.pathsModel(id.s), withNext = P.pathsModel(id.a);
    const tile6 = fold(P.pathsCanvasHtml(lone6));
    check(lone6.end && lone6.end.x === PM.pad + PM.w + PM.gx && lone6.end.y === lone6.nodes[id.s].y
          && lone6.width === lone6.end.x + PM.w + PM.pad
          && /<button class="pm-end" data-act="paths-add-next" data-id="[^"]+"[^>]*>[^]*?Add the next card<\/button>/.test(tile6)
          && !withNext.end && !/class="pm-end"/.test(fold(P.pathsCanvasHtml(withNext))),
      "pm6g a card with nothing after it has the tile beside it, the press that adds its next card (paths-next-hop), in the column its"
      + " next cards would take; CONTROL: a card with next cards has none");

    /* ---- 7. A NEW PATH, FROM A PROJECT WITH NONE ------------------------------------------------------------------
       Maxim, 2026-10-12 12:33: "we need to make sure it's possible to easy set different create different card paths from
       within Paths screen in Studio, even if no paths were set initially". A second project of four cards and no link is
       opened on the page; every link is read back from its draft on disk. */
    {
      const made2 = await S.newProject(root, "No paths", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
      const dir2 = made2.dir;
      const shelf2 = ((await S.addTag(dir2, "shelf", { en: "General", pl: "Ogolne" })).tag).id;
      const n2 = {};
      for (const k of ["k", "l", "m", "n"]) n2[k] = (await S.addCard(dir2, shelf2, "Fresh " + k.toUpperCase(), PLAIN)).card.id;
      const disk2 = (k) => ((JSON.parse(fs.readFileSync(path.join(dir2, DRAFT_FILE), "utf8")).cards.find(c => c.id === n2[k]) || {}).next || [])
        .map(e => e.to).join(",");
      const offeredNow = () => [...fold(home.node("#main").innerHTML).matchAll(/data-act="paths-new-start" data-id="([^"]+)"/g)].map(x => x[1]).join(",");
      const keep = { open: P.S.open, section: P.S.section, sel: P.S.sel, paths: P.S.paths, q: P.S.q, nextPick: P.S.nextPick };
      Object.assign(P.S, { open: await wire(S.openProject(dir2)), section: "paths", paths: null, q: "", nextPick: null });
      P.paint();
      const noPaths = fold(home.node("#main").innerHTML);
      check(P.pathsStarts().length === 0 && /<h1>Paths<\/h1><button class="btn sm" data-act="paths-new">[^]*?New path<\/button>/.test(noPaths)
            && /Paths appear here once a card leads to another\./.test(noPaths),
        "pm7a a project with no path shows New path beside the screen's title, above the line saying where paths appear");
      await P.ACTS["paths-new"]();
      /* THE SECOND CARD OFFERED IS PRESSED each time (the test architect's read of 2026-10-12), so the map that opens is
         shown to be the pressed card's and not the first row's. */
      const offered = offeredNow(), pressed = offered.split(",")[1];
      await P.ACTS["paths-new-start"](el({ "data-id": pressed }));
      const opened = P.S.section === "paths" && P.pm().root === n2.l && P.pm().panel === true && !!P.S.nextPick
        && P.S.nextPick.id === n2.l && /id="nextFind"/.test(fold(home.node("#main").innerHTML)) && !P.S.pathsNew;
      await P.ACTS["next-add"](el({ "data-id": n2.k }));
      await P.flush();
      check(offered === [n2.k, n2.l, n2.m, n2.n].join(",") && pressed === n2.l && opened && disk2("l") === n2.k && disk2("k") === "",
        "pm7b New path offers the cards, and the one chosen opens its map with the panel open and the Next field's finder"
        + " ready; the card chosen there is written to the draft as the path's first link: "
        + JSON.stringify({ offered: offered.split(",").length, opened, link: disk2("l") === n2.k }));
      P.ACTS["paths-index"]();
      await P.ACTS["paths-new"]();
      const offered2 = offeredNow(), pressed2 = offered2.split(",")[1];
      await P.ACTS["paths-new-start"](el({ "data-id": pressed2 }));
      await P.ACTS["next-add"](el({ "data-id": n2.m }));
      await P.flush();
      P.ACTS["paths-index"]();
      const starts2 = P.pathsStarts().map(c => c.id).join(",");
      check(offered2 === [n2.m, n2.n, n2.k, n2.l].join(",") && pressed2 === n2.n && starts2 === [n2.l, n2.n].join(",")
            && disk2("n") === n2.m && disk2("m") === ""
            && /data-act="paths-new"/.test(fold(home.node("#main").innerHTML)),
        "pm7c a second, different path is made the same way, and the index lists both and keeps New path; with nothing"
        + " typed the finder offers the cards on no path first: " + JSON.stringify({ starts: starts2.split(",").length }));
      Object.assign(P.S, keep);
    }

    /* ---- 8. THE NEXT HOP AND A PATH'S ENDS (paths-next-hop, paths-terminus-noise; the Studio batch of 2026-10-12) ------
       A third project: U links to V, and W and X link to nothing. Every link is read back from its draft on disk. */
    {
      const made3 = await S.newProject(root, "Hops", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
      const dir3 = made3.dir;
      const shelf3 = ((await S.addTag(dir3, "shelf", { en: "General", pl: "Ogolne" })).tag).id;
      const n3 = {};
      for (const k of ["u", "v", "w", "x"]) n3[k] = (await S.addCard(dir3, shelf3, "Hop " + k.toUpperCase(), PLAIN)).card.id;
      await S.saveCard(dir3, n3.u, { next: [n3.v] });
      const disk3 = (k) => ((JSON.parse(fs.readFileSync(path.join(dir3, DRAFT_FILE), "utf8")).cards.find(c => c.id === n3[k]) || {}).next || [])
        .map(e => e.to).join(",");
      const keep = { open: P.S.open, section: P.S.section, sel: P.S.sel, paths: P.S.paths, q: P.S.q, nextPick: P.S.nextPick };
      Object.assign(P.S, { open: await wire(S.openProject(dir3)), section: "cards", paths: null, q: "", nextPick: null });
      await P.ACTS["paths-show"](el({ "data-id": n3.u }));
      P.ACTS["paths-pick"](el({ "data-id": n3.v }));
      check(P.pm().root === n3.v && P.pm().panel === true && !!P.S.nextPick && P.S.nextPick.id === n3.v
            && /id="nextFind"/.test(fold(home.node("#main").innerHTML)) && /Shift\+Enter adds the card and carries the path on from it\./.test(fold(home.node("#main").innerHTML)),
        "pm8a walking on to a card with nothing after it opens its panel with the Next field's finder ready, which says Shift+Enter adds the card and carries the path on");
      P.S.nextPick = null; P.pm().panel = false; P.paintPaths();
      const tileV = fold(P.pathsCanvasHtml(P.pathsModel(n3.v)));
      P.ACTS["paths-add-next"](el({ "data-id": n3.v }));
      check(/<button class="pm-end" data-act="paths-add-next" data-id="/.test(tileV) && !!P.S.nextPick && P.S.nextPick.id === n3.v
            && P.pm().panel === true,
        "pm8b the end tile beside a card with nothing after it is a press that opens that card's finder");
      const offeredV = P.__get("nextFound")(P.cardById(n3.v), "").map(c => c.id);
      P.S.nextPick.at = 1;
      const said = P.__get("nextKey")({ target: { id: "nextFind", closest: () => null }, key: "Enter", shiftKey: true, preventDefault() {} });
      await P.flush();
      check(offeredV[1] === n3.w && said === "walk-on" && disk3("v") === n3.w && P.pm().root === n3.w
            && P.pm().trail.slice(-1)[0] === n3.v && P.S.nextPick && P.S.nextPick.id === n3.w,
        "pm8c Shift+Enter in the finder adds the card it stands on and walks on to it, whose own finder then opens: "
        + JSON.stringify({ said, link: disk3("v") === n3.w, root: P.pm().root === n3.w }));
      const lint3 = await S.lintProject(dir3);
      check(lint3.suggestions === 0 && lint3.ends === 1 && lint3.rows.filter(r => r.kind === "ends").map(r => r.card).join(",") === n3.w,
        "pm8d a path's end is listed and kept out of the count: suggestions " + lint3.suggestions + ", ends " + lint3.ends);
      P.ACTS["paths-back"](el({ "data-i": "0" }));
      const headU = fold(home.node("#main").innerHTML);
      const marked = await P.ACTS["paths-ends-meant"]();
      await P.flush();
      const meant = JSON.parse(fs.readFileSync(path.join(dir3, "project.json"), "utf8")).endsMeant || {};
      const lint3b = await S.lintProject(dir3);
      check(P.pm().root === n3.u && /data-act="paths-ends-meant"/.test(headU) && marked === 1 && Object.keys(meant).join(",") === n3.w
            && lint3b.ends === 0 && !P.pmEnds(P.cardById(n3.w)),
        "pm8e one press on the map marks every end it shows as meant, in project.json, and the end leaves the list: "
        + JSON.stringify({ marked, meant: Object.keys(meant).length, ends: lint3b.ends }));
      const hadNew = /data-act="paths-new"/.test(fold(home.node("#main").innerHTML));
      await P.ACTS["paths-new"]();
      check(hadNew && P.pm().root === null && !!P.S.pathsNew && /id="pathsNewFind"/.test(fold(home.node("#main").innerHTML)),
        "pm8f New path stands on the map's head too, and opens the index with its finder");
      Object.assign(P.S, keep);
    }

    /* ---- 5. WIRING AND WORDS ------------------------------------------------------------------------ */

    const main = read("shell", "main.js"), preload = read("shell", "preload.js"), app = read("ui", "app.js"), lang = read("ui", "lang.js");
    const handler = /answer\("studio:pair-not-path"[^]*?thread\.call\("dismissPair"[,)]/.test(main);
    const offered = /dismissPair:\s*\([^)]*\)\s*=>\s*ipcRenderer\.invoke\("studio:pair-not-path"/.test(preload);
    check(typeof S.dismissPair === "function" && handler && offered && app.indexOf("API.dismissPair(") >= 0
          && main.split('answer("studio:pair-not-path"').length === 2,
      "pm5a the dismissal is exported, answered on one channel through the worker, offered by the preload and called by the page");
    const WORDS = ["Paths", "Paths from the card: {TITLE}", "the team's copies, not yet a link", "terminus",
      "Drag from a card's dot onto another card to link them.", "onto a card to link", "Arrow", "The team also copied",
      "link in the catalog", "Link them", "The team: {TIMES}, {P}% of the copies after this card.",
      "Walked so far", "Press a card, or Enter, to walk on; Backspace steps back.", "The first card opens its panel.",
      "Linked in the draft; the desks have it from the next edition.", "Terminus: nothing comes next on the path.",
      "Thickness shows how often the team went this way.",
      "Thickness shows how often the team went this way, {FROM} to {TO}.", "Click the card it should lead to. Esc cancels.",
      "Link this card to another", "Show the paths from this card", "Take the link off", "Open in the editor", "Starts at",
      "Leads to", "Paths appear here once a card leads to another.", "{N} more card", "{N} more cards", "New path",
      "Find the card the path starts from", "Add the next card", "Confirm these termini", "Shift+Enter adds the card and carries the path on from it."];
    const missing = WORDS.filter(x => lang.indexOf(JSON.stringify(x) + ":") < 0 || app.indexOf(JSON.stringify(x)) < 0);
    check(missing.length === 0 && /\n {4}paths: \[\],/.test(lang) && /function paintPaths\(\) \{\n {4}onScreen\("paths"\);/.test(app)
          && lang.indexOf('"The Paths map is still being built."') < 0,
      "pm5b every word the map paints is asked for by the page and has its Polish, the map is a screen of its own that"
      + " can turn Polish, and the held door's reason is gone: " + JSON.stringify(missing));
    const pl = loadPage({ api, uiLang: "pl" });
    /* set and not the stand-in's force, which skips the per-screen readiness this leg is about */
    pl.sandbox.STUDIO_T.set("pl");
    Object.assign(pl.page.S, { open: P.S.open, screen: "project", section: "paths", lang: "en", sel: id.a, uiLang: "pl",
      stats: P.S.stats });
    pl.page.pm().root = id.a; pl.page.pm().sel = { id: id.a }; pl.page.pm().panel = true; pl.page.pm().trail = [id.f];
    pl.page.paintPaths();
    const plMain = fold(pl.node("#main").innerHTML);
    check(/Ścieżki od karty: Card A/.test(plMain) && /Następne karty/.test(plMain) && /Zespół kopiował też/.test(plMain)
          && /Przebyta droga/.test(plMain) && /<kbd>Backspace<\/kbd> cofa o krok/.test(plMain)
          && !/Paths from|Next cards|The team also|Drag from|Walked so far|walk on/.test(plMain),
      "pm5c the map and its panel turn Polish whole with the screen");
  } catch (e) {
    check(false, "the legs stopped after " + asserted + " checks: " + (e && e.stack || e));
  }

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "paths-map");
  const ok = failed === 0 && asserted === EXPECTED;
  console.log("RESULT: " + (ok ? "ok" : "FAIL") + " checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  process.exit(ok ? 0 : 1);
}

main(process.argv.slice(2)).catch((e) => { console.error(e && e.stack || e); process.exit(2); });
