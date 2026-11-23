/* THE PASSPHRASE'S STRENGTH, AND THE GROUP POLICY TEMPLATE FOR THE IT DEPARTMENT: node tests/strength-and-policy.mjs.
 *
 * Sense pass findings 31 and 17. Finding 31 as Maxim ruled it on 2026-10-16 07:09: "Let's go with D. We need to treat
 * leads as adults. And not every usecase requires the same security measure. It's up to the lead/manager with Studio to
 * decide the security measure, sometimes "kot" is indeed the most appropriate passphrase." So nothing refuses a chosen
 * passphrase but an empty one, as before; the cover shows its strength as it is typed.
 *
 * Node only, no window. What it holds:
 *   1  the strength: ui/strength.js measures weak, fair and strong, the page reads that one measure and keeps no copy, and
 *      each first try is weak by its own rule, a repeated word with a character added and "P@ssw0rd123" among them (1a);
 *      the backup copy (1b) and the command line's new key (1c) refuse only an empty passphrase, and make says the
 *      strength once on stderr in the cover's words, from the same file, never the passphrase (1c); a key file made under
 *      a weak one opens with it (1d); nothing refuses a chosen passphrase on its strength, and the shell's backup reads the
 *      passphrase only to hand it to backupKey (1e); the cover says the strength under the field as it is typed, in
 *      English and in Polish, sends what was typed at one press, and the passphrase stays in its field: not in the page's
 *      state, the console or the cover (1f).
 *   2  the template: the pin carries the engine's shell/policy (2a); Save the template writes the ADMX and each ADML as
 *      the pin holds them, offering LeadKey alone, with the lead's whole key as the
 *      box's default (2b); a folder with no team led from here writes nothing (2c); Copy the values gives the
 *      registry key and LeadKey (2d); the Desks screen's row and its two presses (2e); the shell's two channels (2f);
 *      Studio's Windows installer carries the template (2g).
 *
 * 2b ASSERTS WHAT THE PIN SHIPS ONCE IT IS MOVED to the engine's merge of policy-ship, which takes Etiuda Studio's pair
 * out of the template; at a pin before that merge it is red, by design, naming the pair. A Studio folder that is not a
 * Windows path (a Linux lead's) gives no template at all (2h), so on Linux 2b and 2d hold that refusal instead.
 *
 * PROVED BY MAKING IT FAIL: each leg was reddened by a plant put in from outside and taken out again by sha256, named in
 * the lead engineer's report of 2026-10-16.
 *
 * Exit 0 when every check holds, 1 when any fails, 78 when the suite did not complete.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { clearScratch, dropScratch } from "./scratch.mjs";
import OffWindows from "./off-windows.cjs";
import { olderFolderTeam } from "./older-folder-team.mjs"; /* the folder team is made by the fixture, not by Studio (the folder team's removal) */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "strength-and-policy");
const EXPECTED = 14;
const NL = String.fromCharCode(10);
const WIN = process.platform === "win32";
const SENTENCE = "the blue kettle sings at dawn";
const SAID = { weak: "Strength: weak", fair: "Strength: fair", strong: "Strength: strong" };
const NO_TEAM = "There is no team here led from this Studio, so there is nothing to give the IT department.";

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
/* A skip is not a pass: it is said and counted toward EXPECTED. Only sp2i uses it, off Windows (tests/off-windows.cjs). */
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + NL); }
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); }
}
const throwsOn = async (fn) => { try { await fn(); return null; } catch (e) { return e || new Error("thrown"); } };
const vault = { seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t)).reverse().toString("hex")),
  open: (b) => Buffer.from(String(Buffer.from(b)).slice(7), "hex").reverse().toString() };
const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m])
  .replace(/\s+/g, " ").trim();
const unxml = (s) => String(s).replace(/&lt;|&gt;|&amp;/g, (m) => ENT[m]);
/* The handler of one channel in shell/main.js, from its answer( to the next. */
const handler = (src, channel) => {
  const at = src.indexOf('answer("' + channel + '"');
  if (at < 0) return "";
  const next = src.indexOf("\nanswer(", at + 1);
  return src.slice(at, next < 0 ? src.length : next);
};
/* Every .js, .mjs and .cjs file under a folder of the tree. */
const sources = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((d) => d.isDirectory()
  ? sources(path.join(dir, d.name)) : /\.(m|c)?js$/.test(d.name) ? [path.join(dir, d.name)] : []);

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const Sg = await import("../src/sign.mjs");
  const T = await import("../src/team.mjs");
  const S = await import("../src/studio.mjs");
  const Engine = await import("../src/engine.mjs");
  const { loadPage } = await import("./page-stand-in.mjs");

  /* The lead's key as the operating system keeps it, and its secret, made outside every leg. */
  let pair = {}, secret = "";
  const keyAt = path.join(SCRATCH, "signing-key.json");
  try {
    pair = await Sg.makePair();
    fs.writeFileSync(keyAt, JSON.stringify(Sg.osFile(pair, vault.seal(pair.der)), null, 1) + NL);
    secret = vault.open(Buffer.from(Sg.readKeyFile(keyAt).doc.private, "base64"));
  } catch (e) { process.stderr.write("  setup: " + String(e && e.message || e).slice(0, 160) + NL); }

  /* The project the page and the template legs read, publishing to a share whose name an XML text must escape. */
  const SHARE = path.join(SCRATCH, "R&D's share"), HOME = path.join(SCRATCH, "projects");
  fs.mkdirSync(SHARE, { recursive: true });
  const proj = (await S.newProject(HOME, "Policy gate", ["en"])).dir;
  S.setPublishFolder(proj, SHARE);
  const open = JSON.parse(JSON.stringify(await S.openProject(proj)));
  const made = () => ({ file: "C:\\ud\\signing-key.json", name: "signing-key.json", keyId: "studio-9a3a782d7f8ff25b",
    public: "", print: "9a3a782d7f8ff25b", kept: "os", backup: null, admitted: 0, problem: null });

  /* ---- 1. the strength -------------------------------------------------------------------------------------------- */
  const M = createRequire(import.meta.url)("../ui/strength.js");
  await leg("sp1a the measure, ui/strength.js's and the page's alike: nothing for an empty field, weak for \"kot\" and for"
    + " each first try by its own rule (fewer than five characters, a word repeated with a character added, a keyboard"
    + " walk, the commonest words among digits, \"P@ssw0rd123\" with its stand-ins read back), fair for a short mixed one,"
    + " strong for a sentence and a long random one; ui/app.js holds no measure of its own", async () => {
    const home = loadPage({ api: {}, uiLang: "en" }), K = home.sandbox.STUDIO_STRENGTH && home.sandbox.STUDIO_STRENGTH.keyStrength;
    const rows = ["", "kot", "kwpfwkfpkpwfkfwp", "horsehorsehorse1", "lamplamplamplamplamplampX", "qwertyuiopasdfgh",
      "123Password456789", "P@ssw0rd123", "Kotek1234", SENTENCE, "Kot śpi na ciepłym parapecie", "Xk#9vQ!2mRt$7w"];
    /* Each first try would read strong on its bits alone, so only its own rule makes it weak (the plants of 2026-10-16). */
    const want = ["", "weak", "weak", "weak", "weak", "weak", "weak", "weak", "fair", "strong", "strong", "strong"];
    const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
    return typeof K === "function" && rows.every((p, i) => M.keyStrength(p) === want[i] && K(p) === want[i])
      && !/function keyStrength\(|WALKS = \[|STAND_INS/.test(app) && /window\.STUDIO_STRENGTH/.test(app);
  });
  const copyAt = path.join(SCRATCH, "backup", "key-copy.json");
  fs.mkdirSync(path.dirname(copyAt), { recursive: true });
  await leg("sp1b a backup copy takes the passphrase the lead chose, \"kot\" included, and opens with it; only an empty one"
    + " is refused, as before, and writes nothing", async () => {
    const none = await throwsOn(() => S.backupKey(copyAt, keyAt, secret, ""));
    const nothing = !fs.existsSync(copyAt);
    const done = await S.backupKey(copyAt, keyAt, secret, "kot"), opened = S.openBackup(copyAt, "kot");
    return !!none && /needs a passphrase/.test(none.message) && nothing && done.keyId === pair.keyId && opened.der === pair.der;
  });
  await leg("sp1c a key made at the command line takes \"kot\": makeKeyFile makes it and tools/sign.mjs make exits 0 with a"
    + " key file that opens with it, then says on stderr, once and after the key, \"Strength: weak\" in the cover's words,"
    + " and for a sentence \"Strength: strong\", never the passphrase, by requiring ui/strength.js; only an empty"
    + " passphrase exits 2, writing nothing and saying no strength", async () => {
    const lib = await Sg.makeKeyFile({ passphrase: "kot" });
    const outWeak = path.join(SCRATCH, "cli", "first.json"), outStrong = path.join(SCRATCH, "cli", "second.json");
    const outNone = path.join(SCRATCH, "cli", "none.json");
    const run = (out, pass) => spawnSync(process.execPath, [path.join(ROOT, "tools", "sign.mjs"), "make", "--out", out],
      { cwd: ROOT, encoding: "utf8", env: Object.assign({}, process.env, { STUDIO_KEY_PASSPHRASE: pass }) });
    const weak = run(outWeak, "kot"), strong = run(outStrong, SENTENCE), none = run(outNone, "");
    const read = fs.existsSync(outWeak) ? Sg.readKeyFile(outWeak) : null;
    const said = (r) => String(r.stderr).split(/\r?\n/).filter((l) => /Strength/.test(l));
    const cli = fs.readFileSync(path.join(ROOT, "tools", "sign.mjs"), "utf8");
    return !!Sg.unlockKey(lib, "kot") && weak.status === 0 && !!read && !!Sg.unlockKey(read, "kot")
      && JSON.stringify(said(weak)) === JSON.stringify(["sign  " + SAID.weak])
      && strong.status === 0 && JSON.stringify(said(strong)) === JSON.stringify(["sign  " + SAID.strong])
      && (strong.stdout + strong.stderr).indexOf(SENTENCE) < 0 && /wrote /.test(weak.stdout)
      && none.status === 2 && /needs a passphrase/.test(none.stderr) && said(none).length === 0 && !fs.existsSync(outNone)
      && cli.indexOf('createRequire(import.meta.url)("../ui/strength.js")') > 0 && !/function keyStrength\(|WALKS = \[|STAND_INS/.test(cli);
  });
  await leg("sp1d a copy and a key file made before, under passphrases the floor of 2026-10-15 would have refused, still open"
    + " with them", async () => {
    const oldCopy = path.join(SCRATCH, "backup", "old-copy.json"), oldKey = path.join(SCRATCH, "cli", "old-key.json");
    fs.mkdirSync(path.dirname(oldKey), { recursive: true });
    fs.writeFileSync(oldCopy, JSON.stringify(Sg.passphraseFile(pair, "passwordpassword"), null, 1) + NL);
    const other = await Sg.makePair();
    fs.writeFileSync(oldKey, JSON.stringify(Sg.passphraseFile(other, "qwertyuiopasdfgh"), null, 1) + NL);
    const read = S.readBackup(oldCopy), opened = S.openBackup(oldCopy, "passwordpassword");
    return read.keyId === pair.keyId && opened.der === pair.der && !!Sg.unlockKey(Sg.readKeyFile(oldKey), "qwertyuiopasdfgh");
  });
  await leg("sp1e nothing refuses a chosen passphrase on its strength: no floor in src, shell, tools or ui, and the shell's"
    + " key-backup reads the passphrase only to hand it to backupKey, after its save dialog: the word stands in its handler"
    + " twice, as the parameter and as backupKey's argument before the relay and epoch rows", async () => {
    const floor = ["src", "shell", "tools", "ui"].flatMap(sources)
      .filter((f) => /passphraseFloor|passphraseChosen|FLOOR_LENGTH|too short or too obvious/.test(fs.readFileSync(path.join(ROOT, f), "utf8")));
    const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"), from = main.indexOf('answer("studio:key-backup"');
    const h = from < 0 ? "" : main.slice(from, main.indexOf("\n}));", from) + 5);
    const uses = [...h.matchAll(/\bpassphrase\b/g)].map((m) => m.index);
    const params = h.indexOf("async (e, passphrase, title, kind) =>"), call = h.indexOf('thread.call("backupKey"');
    const callText = call < 0 ? "" : h.slice(call, h.indexOf(");", call) + 2);
    return floor.length === 0 && uses.length === 2 && uses[0] === params + "async (e, ".length
      && call > h.indexOf("await pick(") && h.indexOf("await pick(") > 0
      && /, String\(passphrase \|\| ""\),\s*\{ relays: await relayRows\(\), epochs: await epochRows\(\), member: await memberRows\(\), people: peopleRows\(\) \}\);$/.test(callText)
      && uses[1] === call + callText.indexOf("String(passphrase") + "String(".length;
  });
  /* Every string a value holds, through objects and arrays, each object once: the page's state read whole. */
  const stringsOf = (v, seen = new Set()) => {
    if (typeof v === "string") return [v];
    if (!v || typeof v !== "object" || seen.has(v)) return [];
    seen.add(v);
    return Object.keys(v).flatMap((k) => [k].concat(stringsOf(v[k], seen)));
  };
  await leg("sp1f the backup cover says the strength under the first field as it is typed, in place, in English and in"
    + " Polish, nothing for an empty field and nothing on the restore cover; Save the copy… sends what was typed at one"
    + " press; and a throwaway passphrase stays in its field, typed and saved: in no string of the page's state, no console"
    + " call and no cover's markup", async () => {
    const seen = {}, LOUD = ["log", "info", "warn", "error", "debug", "trace"], heard = [], was = {};
    LOUD.forEach((k) => { was[k] = console[k]; console[k] = (...a) => { heard.push(a.map(String).join(" ")); }; });
    try {
      for (const lang of ["en", "pl"]) {
        const asked = [], secretWord = "quill-ember-" + crypto.randomBytes(6).toString("hex");
        const api = { keyBackup: async (...a) => { asked.push(a); return { error: null, file: "E:\\k.json", signing: made() }; } };
        const home = loadPage({ api, uiLang: lang }), P = home.page, Tp = P.__get("T");
        Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en", host: { signing: made() } });
        P.ACTS["key-backup"]();
        const cover = home.node("#dlg").innerHTML;
        const field = home.node("#keyPass"), box = home.node("#keyStrength");
        field.id = "keyPass";
        const type = (v) => { field.value = v; home.doc.heard.filter((x) => x.type === "input").forEach((x) => x.fn({ target: field })); return box.innerHTML; };
        const said = { kot: type("kot"), fair: type("Kotek1234"), strong: type(SENTENCE), none: type("") };
        const rebuilt = home.node("#dlg").innerHTML === cover;
        const nowhere = () => stringsOf(P.S).every((s) => s.indexOf(secretWord) < 0) && heard.every((s) => s.indexOf(secretWord) < 0)
          && home.node("#dlg").innerHTML.indexOf(secretWord) < 0 && box.innerHTML.indexOf(secretWord) < 0;
        type(secretWord);
        const typed = nowhere();
        home.node("#keyPass2").value = secretWord;
        await P.ACTS["do-key-backup"]();
        const closed = P.S.cover === null, saved = nowhere(), emptied = field.value === "" && home.node("#keyPass2").value === "";
        P.S.keyCopy = { file: "E:\\k.json", print: "9a3a782d7f8ff25b" }; P.S.keyWant = "restore"; P.S.cover = "key"; P.paint();
        const restore = home.node("#dlg").innerHTML;
        seen[lang] = /id="keyPass"[^>]*><span class="n" id="keyStrength" aria-live="polite"><\/span><\/div>/.test(cover)
          && cover.indexOf('id="keyStrength"') < cover.indexOf('id="keyPass2"') && rebuilt
          && said.kot === Tp(SAID.weak) && said.fair === Tp(SAID.fair) && said.strong === Tp(SAID.strong) && said.none === ""
          && (lang === "en" || Tp(SAID.weak) !== SAID.weak) && !/keyStrength/.test(restore) && restore.indexOf(secretWord) < 0
          && asked.length === 1 && asked[0][0] === secretWord && closed && typed && saved && emptied;
      }
    } finally { LOUD.forEach((k) => { console[k] = was[k]; }); }
    return seen.en && seen.pl;
  });

  /* ---- 2. the template --------------------------------------------------------------------------------------------- */
  const PIN = path.join(ROOT, "engine", "pinned", "shell", "policy");
  const pinned = (rel) => fs.readFileSync(path.join(PIN, ...rel.split("/")), "utf8");
  await leg("sp2a the pin carries the engine's Group Policy template: the module list names shell/policy/, and the one door"
    + " reads the ADMX and its English and Polish ADML as the pin holds them", async () => {
    const list = fs.readFileSync(path.join(ROOT, "tools", "engine-modules.txt"), "utf8").split(/\r?\n/).map((l) => l.trim());
    const t = Engine.policyTemplate();
    return list.indexOf("shell/policy/") >= 0 && t.admx === pinned("etiuda.admx")
      && JSON.stringify(Object.keys(t.adml).sort()) === JSON.stringify(["en-US", "pl-PL"])
      && t.adml["en-US"] === pinned("en-US/etiuda.adml") && t.adml["pl-PL"] === pinned("pl-PL/etiuda.adml");
  });
  const TID = "t-" + crypto.randomBytes(8).toString("hex"), K1 = crypto.randomBytes(32);
  await olderFolderTeam(proj, { key: keyAt, passphrase: secret, teamId: TID, teamKeys: { [TID]: { 1: K1 } }, relay: true }); /* on the relay: the Team screen holds a team at a folder with one line */
  const leadPublic = ((await T.readTeam(SHARE)).team || { lead: {} }).lead.public;
  const OUT = path.join(SCRATCH, "for IT");
  const box = (adml, id) => (adml.match(new RegExp('<textBox refId="' + id + '">[\\s\\S]*?</textBox>')) || [""])[0];
  /* What the pinned ADMX offers, said in sp2b's line, so a red at a pin before the move names the pair it still carries. */
  let pinnedAdmx = "";
  try { pinnedAdmx = pinned("etiuda.admx"); } catch { pinnedAdmx = ""; }
  const offersOf = (admx) => "offers " + ((admx.match(/<policy name="[^"]*"/g) || []).map((m) => m.slice(14, -1)).join(",") || "nothing")
    + " under " + ((admx.match(/<category name="[^"]*"/g) || []).map((m) => m.slice(16, -1)).join(",") || "nothing");
  /* THE TEMPLATE IS THE ENGINE'S, ONE FOR BOTH APPS (engine fold 43, decisions 10 and 11): Studio writes the pin's bytes and
     fills the team's two boxes alone. The harm to guard is Studio's own AI service handed to IT, so this Studio has one
     configured, with a distinctive key, endpoint and model, where Studio keeps them (ai-service.json and ai-key.json beside its
     settings, here the leg's projects folder and scratch), and none of the three may reach a written file (the test
     architect's rule of 2026-11-12). */
  const AI_KEY = "sk-sp2b-" + crypto.randomBytes(12).toString("hex"), AI_ENDPOINT = "https://ai-sp2b-" + crypto.randomBytes(4).toString("hex") + ".example.org/v1";
  const AI_MODEL = "sp2b-model-" + crypto.randomBytes(4).toString("hex");
  for (const at of [HOME, SCRATCH]) {
    fs.mkdirSync(at, { recursive: true });
    fs.writeFileSync(path.join(at, "ai-service.json"), JSON.stringify({ provider: "openai", endpoint: AI_ENDPOINT, model: AI_MODEL }), "utf8");
    fs.writeFileSync(path.join(at, "ai-key.json"), JSON.stringify({ kind: "etiuda-studio-ai-key", endpoint: AI_ENDPOINT, key: AI_KEY }), "utf8");
  }
  const leaks = (text) => [AI_KEY, AI_ENDPOINT, AI_MODEL].filter((s) => text.indexOf(s) > -1);
  const admlOk = (got, lang) => {
    const values = (got.match(/<defaultValue>[^<]*<\/defaultValue>/g) || []).map((d) => unxml(d.slice(14, -15)));
    const folderBox = box(got, "TeamFolderBox"), keyBox = box(got, "LeadKeyBox");
    const stripped = got.replace(/\r?\n[ \t]*<defaultValue>[^<]*<\/defaultValue>/g, "");
    return values.length === 1 && stripped === pinned(lang + "/etiuda.adml") && leaks(got).length === 0
      && !/<defaultValue>/.test(folderBox)
      && /<\/label>\r?\n[ \t]*<defaultValue>[^<]*<\/defaultValue>\r?\n[ \t]*<\/textBox>/.test(keyBox)
      && (keyBox.match(/<defaultValue>([^<]*)</) || [])[1] === leadPublic;
  };
  await leg("sp2b Save the template writes etiuda.admx and each language's etiuda.adml as a PolicyDefinitions folder holds"
    + " them: the ADMX the pin's bytes and the pin's offering, each ADML the pin's with one default in LeadKeyBox"
    + " alone, after its label, the lead's whole key as the team file holds it,"
    + " and none of this Studio's own AI key, endpoint or model in any of the three; the pin's ADMX " + offersOf(pinnedAdmx), async () => {
    const r = await S.savePolicy(proj, OUT, keyAt);
    const files = r.files.slice().sort().join(",");
    const admx = fs.readFileSync(path.join(OUT, "etiuda.admx"), "utf8");
    const adml = { "en-US": fs.readFileSync(path.join(OUT, "en-US", "etiuda.adml"), "utf8"),
      "pl-PL": fs.readFileSync(path.join(OUT, "pl-PL", "etiuda.adml"), "utf8") };
    const okLang = ["en-US", "pl-PL"].every((lang) => admlOk(adml[lang], lang));
    /* Each way the harm could come back, made in memory on the written English ADML; ETIUDA_PLANTS=off makes neither. */
    let planted = true;
    if (process.env.ETIUDA_PLANTS !== "off") {
      const en = adml["en-US"];
      const intoKeyBox = en.replace(/(<textBox refId="AiKeyBox">\r?\n[ \t]*<label>[^<]*<\/label>)/, "$1\n          <defaultValue>" + AI_KEY + "</defaultValue>");
      const intoText = en.replace("</resources>", "<!-- " + AI_KEY + " --></resources>");
      planted = intoKeyBox !== en && intoText !== en && !admlOk(intoKeyBox, "en-US") && !admlOk(intoText, "en-US");
    }
    return r.folder === path.resolve(OUT) && files === "en-US/etiuda.adml,etiuda.admx,pl-PL/etiuda.adml"
      && admx === pinned("etiuda.admx") && leaks(admx).length === 0
      && /^[0-9a-f]{64}$/.test(leadPublic) && leadPublic === pair.public && okLang && planted;
  });
  await leg("sp2c a project whose folder holds no team led from this Studio saves nothing and copies nothing, and says so",
    async () => {
    const lone = (await S.newProject(HOME, "Policy gate two", ["en"])).dir, empty = path.join(SCRATCH, "empty share");
    fs.mkdirSync(empty, { recursive: true });
    S.setPublishFolder(lone, empty);
    const out = path.join(SCRATCH, "not for IT");
    const saved = await throwsOn(() => S.savePolicy(lone, out, keyAt)), copied = await throwsOn(() => S.policyValues(lone, keyAt));
    return !!saved && saved.said && saved.said.frame === NO_TEAM && !!copied && copied.said && copied.said.frame === NO_TEAM
      && !fs.existsSync(out);
  });
  await leg("sp2d Copy the values gives the registry key the desk reads, then the lead's whole key by LeadKey", async () => {
    const eol = WIN ? "\r\n" : "\n";
    const r = await S.policyValues(proj, keyAt);
    return r.text === ["HKEY_LOCAL_MACHINE\\Software\\Policies\\Etiuda", "LeadKey = " + leadPublic].join(eol) + eol;
  });
  await leg("sp2e the Desks screen offers For your IT department where this Studio leads the team, with Save the template…"
    + " and Copy the values, in English and in Polish; each press asks the shell with the project and says what came of it;"
    + " a cancel says nothing; with no team of its own here there is no row", async () => {
    const page = (o) => Object.assign({ error: null, folder: "C:\\share", id: "lamp-shop", mark: null, signing: pair.keyId, file: "ours",
      reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [], autoAdmit: false, keyOpens: true, invites: [],
      team: { id: TID, epoch: 1, sealed: true, lists: true, exportsSealed: true, relay: true, roster: [], leadPrint: "9a3a782d7f8ff25b" } }, o || {});
    const facts = {};
    for (const lang of ["en", "pl"]) {
      const asked = [];
      let answer = page(), saveAnswer = { error: null, folder: "E:\\For IT", files: [] };
      const api = {
        desks: async () => JSON.parse(JSON.stringify(answer)),
        policySave: async (...a) => { asked.push(["save", ...a]); return saveAnswer; },
        policyCopy: async (...a) => { asked.push(["copy", ...a]); return { error: null, copied: true }; },
      };
      const home = loadPage({ api, uiLang: lang }), P = home.page, Tp = P.__get("T");
      Object.assign(P.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
      await P.desksLoad();
      const h = home.node("#main").innerHTML, t = text(h);
      const row = t.indexOf(Tp("For your IT department") + " " + Tp("A Group Policy template carrying this team's lead key, so every desk it reaches trusts this lead and no other.")
        + " " + Tp("Save the template…") + " " + Tp("Copy the values")) >= 0 && /data-act="policy-save"/.test(h) && /data-act="policy-copy"/.test(h);
      await P.ACTS["policy-save"]();
      const saved = text(home.node("#main").innerHTML).indexOf(Tp("The template is in {FOLDER}, laid out as a PolicyDefinitions folder holds it.", { FOLDER: "E:\\For IT" })) >= 0;
      P.S.dkNote = null; saveAnswer = { canceled: true };
      await P.ACTS["policy-save"]();
      const quiet = !P.S.dkNote && !P.S.err;
      await P.ACTS["policy-copy"]();
      const copied = text(home.node("#main").innerHTML).indexOf(Tp("This team's lead key is on the clipboard.")) >= 0;
      answer = page({ file: "theirs", team: null });
      await P.desksLoad();
      const none = !/data-it|policy-save|policy-copy/.test(home.node("#main").innerHTML);
      facts[lang] = row && saved && quiet && copied && none && (lang === "en" || Tp("For your IT department") !== "For your IT department")
        && JSON.stringify(asked) === JSON.stringify([["save", open.dir, Tp("Where to save the Group Policy template")],
          ["save", open.dir, Tp("Where to save the Group Policy template")], ["copy", open.dir]]);
    }
    return facts.en && facts.pl;
  });
  await leg("sp2f the shell's two channels: the preload passes the project and the dialog's title, the save asks a folder"
    + " with the page's title, with STUDIO_TEST_POLICY in its place under the harness, and has the thread save into it;"
    + " the copy puts the thread's values on the clipboard", async () => {
    const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"), pre = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
    const save = handler(main, "studio:policy-save"), copy = handler(main, "studio:policy-copy");
    return pre.indexOf('policySave: (dir, title) => ipcRenderer.invoke("studio:policy-save", dir, title),') > 0
      && pre.indexOf('policyCopy: (dir) => ipcRenderer.invoke("studio:policy-copy", dir),') > 0
      && /testOnly\("STUDIO_TEST_POLICY"\)/.test(save) && /await pick\("open", [^;]*title: String\(title \|\| ""\),\s*properties: \["openDirectory", "createDirectory"\]/.test(save)
      && save.indexOf('thread.call("savePolicy", projectDir(dir), String(folder), await keyFileNow(), withHere())') > save.indexOf("await pick(")
      && copy.indexOf('thread.call("policyValues", projectDir(dir), await keyFileNow(), withHere())') > 0
      && copy.indexOf("clipboard.writeText(String(r.text))") > copy.indexOf('"policyValues"');
  });
  await leg("sp2g Studio's Windows installer carries the template beside the program, the pinned shell/policy copied to"
    + " resources/policy, and the asar the same bytes for the row", async () => {
    const cfg = createRequire(import.meta.url)(path.join(ROOT, "electron-builder.js"));
    const sets = [].concat((cfg.win && cfg.win.extraResources) || []);
    const policy = sets.filter((s) => s && path.resolve(ROOT, String(s.from || "")) === PIN);
    const files = cfg.files || [];
    return policy.length === 1 && policy[0].to === "policy" && policy[0].filter === undefined
      && files.indexOf("engine/pinned/**") >= 0 && !files.some((f) => /^!.*policy/.test(String(f)))
      && fs.existsSync(path.join(PIN, "etiuda.admx"));
  });
  const rTID = "t-" + crypto.randomBytes(8).toString("hex"), rRT = crypto.randomBytes(16).toString("hex");
  const relayProj = (await S.newProject(HOME, "Policy relay project", ["en"])).dir;
  const rMirror = path.join(SCRATCH, "relay-mirror", rRT);
  await S.startRelayTeam(relayProj, {
    key: keyAt,
    passphrase: secret,
    teamId: rTID,
    mirror: rMirror,
    rt: rRT,
    url: "https://relay.etiuda.test/relay/v1",
    teamKeys: { [rTID]: { 1: crypto.randomBytes(32) } },
  });
  const OUT_RELAY = path.join(SCRATCH, "for IT relay");
  /* sp2i stands aside off Windows (Claude gamma's Linux sweep, 2026-11-14): it holds the Group Policy template and registry lines
     Studio gives the IT department for a relay team, which only a Windows desk reads; off Windows the desk reads no policy
     (sp2b and sp2d hold what Studio does there for a folder team). A Linux policy channel is a ruling first. */
  const sp2iAside = OffWindows.standAside("sp2i",
    "the Group Policy template and registry lines are read by a Windows desk alone, and off Windows the desk reads no policy");
  if (sp2iAside) skip(sp2iAside);
  else await leg("sp2i on a relay team, Studio does not write TeamFolder for Group Policy: savePolicy fills defaultValue for"
    + " LeadKey alone and policyValues gives the LeadKey registry line alone, with no lead mirror path", async () => {
    const rSaved = await S.savePolicy(relayProj, OUT_RELAY, keyAt);
    const rCopied = await S.policyValues(relayProj, keyAt);
    const admx = fs.readFileSync(path.join(OUT_RELAY, "etiuda.admx"), "utf8");
    const enAdml = fs.readFileSync(path.join(OUT_RELAY, "en-US", "etiuda.adml"), "utf8");
    const plAdml = fs.readFileSync(path.join(OUT_RELAY, "pl-PL", "etiuda.adml"), "utf8");
    const folderBoxEn = box(enAdml, "TeamFolderBox"), keyBoxEn = box(enAdml, "LeadKeyBox");
    const folderBoxPl = box(plAdml, "TeamFolderBox"), keyBoxPl = box(plAdml, "LeadKeyBox");
    const noFolderDefault = !/<defaultValue>/.test(folderBoxEn) && !/<defaultValue>/.test(folderBoxPl);
    const keyDefault = (keyBoxEn.match(/<defaultValue>([^<]*)<\/defaultValue>/) || [])[1] === leadPublic
      && (keyBoxPl.match(/<defaultValue>([^<]*)<\/defaultValue>/) || [])[1] === leadPublic;
    const noMirror = !enAdml.includes(rMirror) && !plAdml.includes(rMirror) && !rCopied.text.includes(rMirror)
      && !rCopied.text.includes("TeamFolder");
    const expectedReg = ["HKEY_LOCAL_MACHINE\\Software\\Policies\\Etiuda", "LeadKey = " + leadPublic].join("\r\n") + "\r\n";
    return noFolderDefault && keyDefault && noMirror && rCopied.text === expectedReg
      && rSaved.folder === path.resolve(OUT_RELAY) && admx === pinned("etiuda.admx");
  });

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "strength-and-policy");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
  if (asserted + skipped !== EXPECTED) { process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL); return 78; }
  process.stdout.write("strength-and-policy  " + asserted + " assertion(s), " + (skipped ? skipped + " skipped, " : "") + failed + " failure(s)" + NL);
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then((c) => process.exit(c), (e) => {
  process.stderr.write(String(e && e.stack || e) + NL); process.exit(2);
});
