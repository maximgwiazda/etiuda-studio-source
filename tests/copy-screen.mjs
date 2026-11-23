/* The Desks row for a teammate's working copies (board 962, stage 3). The page runs on the stand-in.
 * A row paints the heading, one line a copy, the mark and Import; a locked box paints the locked line and no copy;
 * a row that carries neither field paints neither. Import calls copyImport with that desk and that ref.
 *
 * gate-kind: node
 *
 *     node tests/copy-screen.mjs
 */
import { loadPage } from "./page-stand-in.mjs";

const NB = String.fromCharCode(160);
const ENT = { "&#39;": "'", "&quot;": "\"", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
const DIR = "C:/projects/harbour";
const COPIES = "k-0123456789abcdef";
const LOCKED = "k-fedcba9876543210";
const QUIET = "k-0011223344556677";
const UNREAD = "k-abcdef0123456789";
const HEAD = {
  en: "Copies of unlisted catalogs on this desk",
  pl: "Kopie katalogów spoza listy na tym stanowisku",
};
const MARK = { en: "not proposed", pl: "bez propozycji" };
const BUTTON = { en: "Import as a new catalog", pl: "Importuj jako nowy katalog" };
const TIP = {
  en: "Makes a new catalog from this copy. Nothing that is already here changes, and the teammate is not told.",
  pl: "Tworzy z tej kopii nowy katalog. Nic, co już tu jest, się nie zmienia, a członek zespołu nie dostaje powiadomienia.",
};
const LOCKED_LINE = {
  en: "This desk keeps copies of unlisted catalogs, but they cannot be opened on this computer, so nothing of them is shown.",
  pl: "To stanowisko przechowuje kopie katalogów spoza listy, ale na tym komputerze nie da się ich otworzyć, więc nic z nich nie jest pokazane.",
};
const GONE = {
  en: "This copy can no longer be read here, so nothing was imported. The desk may have changed or withdrawn it since.",
  pl: "Tej kopii nie da się już tutaj odczytać, więc nic nie zaimportowano. Stanowisko mogło ją od tego czasu zmienić albo wycofać.",
};
const DONE = { en: "The catalog was imported as a new one.", pl: "Katalog zaimportowano jako nowy." };
const UNREAD_LINE = {
  en: "Studio could not open this teammate's catalog file, so which catalog it uses is not known.",
  pl: "Studio nie mogło otworzyć pliku katalogu tego członka zespołu, więc nie wiadomo, którego katalogu używa.",
};

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const flat = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m])
  .replace(new RegExp(NB, "g"), " ").replace(/\s+/g, " ").trim();
const times = (html, needle) => String(html).split(needle).length - 1;
function rowHtml(html, name) {
  const at = String(html).indexOf('data-name="' + name + '"');
  if (at < 0) return "";
  const end = String(html).indexOf("</tr>", at);
  return String(html).slice(at, end < 0 ? String(html).length : end);
}
function member(id, name, extra) {
  return Object.assign({ id, name, kind: "", importable: false, waiting: false }, extra || {});
}
function roster() {
  return [
    member(COPIES, "Quay", { copies: [
      { ref: "north-a1b2c3d4", title: "North quay", rev: 2, edition: "2026-04-02" },
      { ref: "south-b2c3d4e5", title: "South shed", rev: 4, edition: "" },
    ] }),
    member(LOCKED, "Lock", { copiesLocked: true, copies: [
      { ref: "hidden-c3d4e5f6", title: "Hidden quay", rev: 1, edition: "2026-01-01" },
    ] }),
    member(QUIET, "Quiet", { kind: "edition", n: "2026-04-02", rev: 3, title: "Harbour" }),
    member(UNREAD, "Bent", { unread: true, copies: [
      { ref: "bent-d4e5f6a7", title: "Bent copy", rev: 1, edition: "" },
    ] }),
  ];
}
function desksOf(uses) {
  return {
    folder: "C:/share", file: "ours", signing: "lead-key", inside: false, keyHeld: true, canKeep: true,
    requests: [], invites: [], keyOpens: true, autoAdmit: false,
    team: {
      id: "t-0123456789abcdef", relay: true, epoch: 1, sealed: true, lists: true, exportsSealed: false, /* relay: the share stands for the relay mirror, since a team not on the relay shows only the held-folder line */
      roster: uses.map((u) => ({
        id: u.id, name: u.name, own: "", key: String(u.id).slice(2), admitted: true, kind: "desk", door: "code",
      })),
    },
    uses,
  };
}
function openOf() {
  return {
    dir: DIR, name: "Harbour", editions: [],
    counts: { cards: 0, intents: 0, cats: 0 },
    lint: { errors: 0, warnings: 0 },
    draft: { cards: [], tags: [], langs: [{ code: "en", name: "English" }] },
    project: { rev: 1 },
    awaiting: [],
  };
}
function paint(lang, uses) {
  const home = loadPage({ api: {}, uiLang: lang });
  const P = home.page;
  P.S.open = openOf();
  P.S.screen = "projects";
  P.S.home = "team";
  P.S.teamDir = DIR;
  P.S.desks = desksOf(uses);
  P.paintDesks();
  const html = home.node("#main").innerHTML;
  P.S.screen = "project";
  P.S.section = "stats";
  P.S.stats = { folder: "C:/share", uses, head: [], rows: [], refused: [] };
  P.paintStats();
  return { html, text: flat(html), stats: home.node("#main").innerHTML, page: P };
}
const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]) });

function shown(lang) {
  const page = paint(lang, roster());
  const quay = rowHtml(page.html, "Quay");
  const lock = rowHtml(page.html, "Lock");
  const quiet = rowHtml(page.html, "Quiet");
  const bent = rowHtml(page.html, "Bent");
  const other = lang === "pl" ? "en" : "pl";
  const line = lang === "pl"
    ? ["North quay, wer. 2, wydanie 2026-04-02", "South shed, wer. 4", "Bent copy, wer. 1"]
    : ["North quay, rev 2, edition 2026-04-02", "South shed, rev 4", "Bent copy, rev 1"];
  check(page.text.includes(HEAD[lang]) && !page.text.includes(HEAD[other])
    && times(page.text, HEAD[lang]) === 2,
    "962s3a " + lang + " the heading is on each row that has copies, and not the other language");
  check(line.every((s) => page.text.includes(s)) && times(flat(quay), MARK[lang]) === 2
    && flat(quay).includes(line[0]) && flat(quay).includes(line[1]),
    "962s3a " + lang + " each copy is one line, with its mark");
  check(times(quay, 'data-act="copy-import"') === 2
    && quay.includes('data-act="copy-import" data-id="' + COPIES + '" data-ref="north-a1b2c3d4"')
    && quay.includes('data-act="copy-import" data-id="' + COPIES + '" data-ref="south-b2c3d4e5"')
    && times(quay, BUTTON[lang]) === 2 && times(quay, TIP[lang]) === 2
    && quay.includes('class="btn sm"') && quay.includes('class="chip"'),
    "962s3a " + lang + " each line has Import for that desk and that ref, with the tooltip");
  check(flat(bent).includes(UNREAD_LINE[lang]) && flat(bent).includes(line[2])
    && bent.includes('data-ref="bent-d4e5f6a7"') && times(bent, MARK[lang]) === 1,
    "962s3a " + lang + " a row whose catalog file did not open still shows its copy");
  check(flat(lock).includes(LOCKED_LINE[lang]) && !lock.includes(HEAD[lang]) && !lock.includes("Hidden quay")
    && !lock.includes("copy-import") && !lock.includes(MARK[lang]),
    "962s3b " + lang + " a locked box shows the locked line and no copy");
  check(!quiet.includes(HEAD[lang]) && !quiet.includes(LOCKED_LINE[lang]) && !quiet.includes("copy-import")
    && !quiet.includes(MARK[lang]),
    "962s3c " + lang + " a row that carries no copies and no locked mark shows neither the copies nor the locked line");
  check(!page.stats.includes(HEAD[lang]) && !page.stats.includes(MARK[lang]) && !page.stats.includes("copy-import")
    && !page.stats.includes(LOCKED_LINE[lang]),
    "962s3c " + lang + " the statistics block shows none of the copy lines");
  return page;
}

async function press(lang, answer) {
  const calls = [];
  const home = loadPage({
    api: {
      copyImport: (dir, desk, ref) => { calls.push([dir, desk, ref]); return Promise.resolve(answer); },
      /* An import re-reads the library, so the new catalog is listed at once (sense D, a4aa74c7). */
      projects: () => { calls.push(["projects"]); return Promise.resolve({ error: null, root: "C:\Catalogs", made: true, projects: [] }); },
    },
    uiLang: lang,
  });
  const P = home.page;
  P.S.open = openOf();
  P.S.screen = "projects";
  P.S.home = "team";
  P.S.teamDir = DIR;
  P.S.desks = desksOf(roster());
  const act = P.ACTS["copy-import"];
  if (typeof act !== "function") return { calls, missing: true, html: "", text: "", note: null };
  await act(el({ "data-id": COPIES, "data-ref": "north-a1b2c3d4" }));
  const html = home.node("#main").innerHTML;
  return { calls, missing: false, html, text: flat(html), note: P.S.dkNote };
}

async function main() {
  shown("en");
  shown("pl");
  const off = paint("en", [member(QUIET, "Quiet", { kind: "edition", n: "2026-04-02", rev: 3, title: "Harbour" })]);
  check(!off.html.includes(HEAD.en) && !off.html.includes(LOCKED_LINE.en) && !off.html.includes("copy-import")
    && !off.html.includes(MARK.en),
    "962s3c with no copies the Desks screen shows neither heading, line, mark nor locked line");

  const ok = await press("en", { landed: "North quay", error: null });
  check(!ok.missing && JSON.stringify(ok.calls) === JSON.stringify([[DIR, COPIES, "north-a1b2c3d4"], ["projects"]])
    && ok.text.includes(DONE.en),
    "962s3d Import calls copyImport with that desk and that ref, re-reads the library, and says the catalog was imported");
  const okPl = await press("pl", { landed: "North quay", error: null });
  check(!okPl.missing && okPl.text.includes(DONE.pl) && !okPl.text.includes(DONE.en),
    "962s3d the same sentence in Polish");

  const no = await press("en", { error: GONE.en, said: { frame: GONE.en, vars: {} } });
  check(!no.missing && no.html.includes('class="dashed"') && no.text.includes(GONE.en) && !no.text.includes(DONE.en),
    "962s3e a refused import says the copy can no longer be read");
  const noPl = await press("pl", { error: GONE.en, said: { frame: GONE.en, vars: {} } });
  check(!noPl.missing && noPl.text.includes(GONE.pl) && !noPl.text.includes(GONE.en),
    "962s3e the same refusal in Polish");

  process.stdout.write("copy-screen " + asserted + " checks, " + failed + " failed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write("copy-screen threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
});
