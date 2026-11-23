/* A CATALOG'S NUMBER IS ITS REV, AND NO STRING A PERSON READS SAYS EPOCH (pivot plan item 10, approved 2026-10-15).
 *
 *     node tests/rev-words.mjs
 *
 * Maxim, 2026-10-15 01:13: "I prefer rev (revision)." Every string Studio can show that names a catalog's version number
 * calls it a rev; an edition's date stays where it names a dated edition; and the team key's generation, the epoch, is
 * engine terrain and never a person's word, so a screen says what it means for the lead, or nothing.
 *
 * The scan of every shown string for the words themselves (rw1, and rw2 its controls) was retired on 2026-11-11 (Max
 * 18:54, Claude α's ruling 19:10): it could go red only when a word was chosen on purpose.
 *
 *   rw3  the Desks screen says what the team key means for the lead, in English and in Polish, and no epoch: held, made
 *        new when a member was removed, or not held by this Studio
 *   rw4  a desk's catalog in use reads as a rev where it is the lead's catalog changed at the desk, and as its dated
 *        edition where it is one published here, in both languages
 *
 * Each check is planted red first: the child runs that one check against the planted source and must print PLANT-RED,
 * and the source is put back by its sha256 before the next plant. The green run is this process.
 *
 * Node only, no window. Exit 0 when every check holds, 1 when any fails.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { plantText } from "./plant-copy.mjs";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
/* Set before the first plant. The child runs from this copy, so its ROOT is the copy. */
let tree = null;
const ONLY = process.env.REV_WORDS_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";

function no(id, why) {
  console.error(id + " " + why);
  return false;
}

const ENT = { "&#39;": "'", "&quot;": "\"", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
function textOf(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m])
    .replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

async function desksText(lang, o) {
  const { loadPage } = await import("./page-stand-in.mjs");
  const home = loadPage({ api: {}, uiLang: lang });
  const P = home.page;
  P.S.open = { dir: "C:\\harbour", editions: [], name: "Harbour tide" };
  P.S.screen = "projects";
  P.S.home = "team";
  P.S.teamDir = "C:\\harbour";
  P.S.lang = "en";
  P.S.desks = Object.assign({
    folder: "C:\\share", file: "ours", signing: "lead-key", inside: false, keyHeld: true, canKeep: true,
    requests: [], invites: [], keyOpens: true, autoAdmit: false,
    team: { id: "t-0f1e2d3c4b5a6978", epoch: 3, sealed: true, lists: true, exportsSealed: false, relay: true, roster: [
      { id: "k-0a1b2c3d4e5f6071", name: "Pier desk", own: "", key: "0a1b2c3d4e5f6071", admitted: true, kind: "desk", door: "code" }] },
    uses: [],
  }, o || {});
  P.paintMain();
  return textOf(home.node("#main").innerHTML);
}

async function checkRw3() {
  const team = (epoch) => ({ team: { id: "t-0f1e2d3c4b5a6978", epoch, sealed: true, lists: true, exportsSealed: false, relay: true, roster: [] } });
  const said = {
    renewed: await desksText("en"), first: await desksText("en", team(1)), missing: await desksText("en", { keyHeld: false }),
    plRenewed: await desksText("pl"), plMissing: await desksText("pl", { keyHeld: false }),
  };
  const ok = /Team key held by this Studio; made new when a member was removed/.test(said.renewed)
    && /Team key held by this Studio(?!;)/.test(said.first)
    && /Team key not held by this Studio/.test(said.missing)
    && /This Studio does not hold the team's current key, so a sealed publish waits for it\./.test(said.missing)
    && /Klucz zespołu jest w tym Studiu; wymieniony po usunięciu członka zespołu/.test(said.plRenewed)
    && /Klucz zespołu tego klucza nie ma w tym Studiu/.test(said.plMissing)
    && !Object.keys(said).some((k) => /epoch|epok/i.test(said[k]));
  if (!ok) return no("rw3", JSON.stringify(Object.fromEntries(Object.entries(said).map(([k, v]) => {
    const at = v.search(/Team key|Klucz zespołu/);
    return [k, v.slice(Math.max(0, at - 10), at + 120)];
  }))));
  return true;
}

async function checkRw4() {
  const rows = [
    { id: "k-0a1b2c3d4e5f6071", name: "Pier desk", kind: "own", n: "4", asOf: "2026-04-02T08:15:00.000Z", importable: true },
    { id: "k-1b2c3d4e5f607182", name: "Dock desk", kind: "edition", n: "2026-04-02b", asOf: "2026-04-02T08:15:00.000Z" },
  ];
  const roster = rows.map((r) => ({ id: r.id, name: r.name, own: "", key: r.id.slice(2), admitted: true, kind: "desk", door: "code" }));
  const o = { uses: rows, team: { id: "t-0f1e2d3c4b5a6978", epoch: 1, sealed: true, lists: true, exportsSealed: false, relay: true, roster } };
  const en = await desksText("en", o), pl = await desksText("pl", o);
  const ok = en.includes("changed at the desk, from rev 4") && en.includes("edition 2026-04-02b, published here")
    && pl.includes("zmieniony na stanowisku, na podstawie wersji 4") && pl.includes("wydanie 2026-04-02b, opublikowane tutaj")
    && !/edition 4|wydanie 4/.test(en + pl);
  if (!ok) return no("rw4", JSON.stringify({ en: en.slice(en.indexOf("Pier desk"), en.indexOf("Pier desk") + 160),
    pl: pl.slice(pl.indexOf("Pier desk"), pl.indexOf("Pier desk") + 160) }));
  return true;
}

const CHECKS = { rw3: checkRw3, rw4: checkRw4 };

/* Each plant puts one old wording back. */
const PLANTS = [
  ["rw3", "ui/app.js", 't.epoch > 1 ? T("held by this Studio; made new when a member was removed") : T("held by this Studio"))',
    'T("epoch {N}", { N: t.epoch }))'],
  ["rw4", "ui/app.js", 'T("changed at the desk, from rev {N}", { N: revText(u.n || "", u.dated) })', 'T("edition {N}, changed at the desk", { N: u.n || "" })'],
  ["rw3", "ui/lang.js", '"held by this Studio; made new when a member was removed": "jest w tym Studiu; wymieniony po usunięciu członka zespołu",',
    '"held by this Studio; made new when a member was removed": "jest w tym Studiu; epoka {N}",'],
];

function plantOnce(id, rel, from, to) {
  const file = path.join(tree, rel);
  const buf = fs.readFileSync(file);
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const text = buf.toString("utf8");
  const next = plantText(text, from, to, rel);
  let child = null;
  try {
    fs.writeFileSync(file, next, "utf8");
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
      cwd: tree, env: Object.assign({}, process.env, { REV_WORDS_ONLY: id, ETIUDA_PLANTS: "off" }), encoding: "utf8", timeout: 90000,
    });
  } finally {
    fs.writeFileSync(file, buf);
    const back = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    if (back !== sha) throw new Error(id + " restore mismatch in " + rel);
  }
  const red = !!(child && child.status === 1 && String(child.stdout || "").includes("PLANT-RED"));
  if (!red) {
    console.error(id + " plant in " + rel + " did not bite status=" + (child && child.status));
    console.error(String(child && child.stdout || "") + String(child && child.stderr || ""));
  }
  return red;
}

async function main() {
  const legs = Object.keys(CHECKS);
  /* ETIUDA_PLANTS=off (a merge's area run) skips the plants phase and counts it as the one check it is. */
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy, and the checkout's sha256 is unchanged after it (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    let red = 0;
    let held = false;
    try {
      tree = plantsTree(ROOT, "rev-words");
      for (const [id, rel, from, to] of PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + " " + rel + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
    } finally {
      dropPlantsTree(tree, ROOT);
    }
    if (red !== PLANTS.length || !held) process.exit(1);
  }
  let n = 0;
  for (const id of legs) {
    let ok = false;
    try { ok = await CHECKS[id](); }
    catch (e) { console.error(id + " " + (e && e.stack || e)); ok = false; }
    console.log((ok ? "ok   " : "FAIL ") + id);
    if (ok) n++;
  }
  console.log("#counts checks=" + (legs.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (legs.length - n) + " expected=" + (legs.length + 1));
  console.log("rev-words " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (legs.length + 1) + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  process.exit(n === legs.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  Promise.resolve(fn()).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  }).catch((e) => { console.error(e && e.stack || e); process.exit(2); });
} else {
  main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
}
