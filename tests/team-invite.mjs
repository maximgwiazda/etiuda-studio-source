/* A DESK JOINS BY AN INVITATION STUDIO MADE, OR BY ITSELF WHERE THE LEAD SAYS SO (board 885, S2).
 *
 *     node tests/team-invite.mjs [--keep]
 *
 * THE CLAIM. An invitation made here (src/invite.mjs makeInvite, for the team src/studio.mjs inviteTarget names) is the
 * blob the pinned desk shell reads, its check code is the one the desk asks for, a leading nought included, and the desk's
 * request that proves it is let in by the watch's admission (watchAdmit) with nobody pressing anything, auto-admit off,
 * the invitation then spent (Claude alpha's ruling of 2026-10-13 11:30: the lead's issuing it is the consent). A proof under
 * another secret, an invitation spent, withdrawn, expired, another team's or never made here is never let in unattended,
 * auto-admit on or off, writes nothing, and says why; one invitation lets one desk in. A request that names no invitation
 * keeps the lead's press, the six-digit code, unless the lead's auto-admit is on, which lets it in with nobody present,
 * leaves one whose kind it does not name, and waits where the signing key does not open. The six-digit code is the door
 * it was: a request whose invitation was withdrawn is still let in by its code, and that door writes no label. And the
 * Desks screen shows it all.
 *
 * THE DESKS ARE THE PINNED ENGINE'S OWN SHELL (engine/pinned/shell/main.js), run in bare node under a stub electron over the
 * folder Studio publishes to, as tests/team-join.mjs runs them. A request no shell would write (a proof under another
 * secret, another team's invitation, a kind no desk says) is written here with node's own crypto and the pinned join rule.
 * The shell's half, the book of invitations it opens, the clipboard, the watch and the page seeing no secret, is
 * tests/shell-guards.mjs section 17.
 *
 * fd7a to fd7c, A LEAD WITH MANY PEOPLE TO INVITE (Argon's first-day review, F7; Max's ruling of 2026-11-01 01:27, a batch of
 * single-use links): Copy and make another keeps the cover open for the next person; a list of names, one a line, makes one
 * invitation each through the same verb, each listed beside its person's name with its own Copy, nothing widened; a refusal
 * part way keeps the names not yet invited. The page alone, on the stand-in. Their plants run in a scratch copy
 * (tests/plant-copy.mjs), each child running its leg alone (TEAM_INVITE_ONLY).
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-invite");
const EXPECTED = 43; /* 45 less ti44 and ti12, retired with the code door (P2) */
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.TEAM_INVITE_ONLY || "";
const NL = String.fromCharCode(10);
const PASS = "a passphrase for the lead's key in this gate";
const DAY = 24 * 60 * 60 * 1000;
const nodeRequire = createRequire(import.meta.url);

/* ETIUDA_PLANTS=off (a merge's area run) skips the plant leg ti43 and counts it toward EXPECTED; the release profile runs
   with plants on, so ti43 still runs there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + NL);
}
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); }
}
const throwsOn = async (fn) => { try { await fn(); return ""; } catch (e) { return String(e && e.message || e); } };
/* A call outside a leg that throws is an answer the legs after it read as wrong, never a run that stops. */
const safe = (p, dflt) => Promise.resolve(p).catch((e) => Object.assign({ threw: String(e && e.message || e) }, dflt || {}));
const NONE = { admitted: [], refused: [], spent: [], skipped: [], opened: [], requests: [] };
/* A leg's facts, said on stderr where the leg is red, so a red names what moved. */
const facts = (name, f) => { const ok = Object.keys(f).every(k => f[k] === true); if (!ok) process.stderr.write("  " + name + " " + JSON.stringify(f) + NL); return ok; };

/* One desk: the pinned shell evaluated afresh over its own user-data folder, its safeStorage a reversible stand-in. */
function loadDesk(app, ud) {
  const noop = () => {}, invoke = {}, said = [];
  const inert = new Proxy(function () {}, { get: () => inert, set: () => true, apply: () => undefined });
  const electron = {
    app: { getPath: () => ud, setPath: noop, requestSingleInstanceLock: () => false, quit: noop, on: noop, getVersion: () => "0.0.0",
           whenReady: () => new Promise(noop), commandLine: { appendSwitch: noop } },
    ipcMain: { on: noop, handle: (ch, fn) => { invoke[ch] = fn; } },
    BrowserWindow: inert, Menu: inert, dialog: inert, net: inert, protocol: inert, session: inert, shell: inert,
    screen: inert, systemPreferences: inert, nativeTheme: { themeSource: "system" },
    safeStorage: { isEncryptionAvailable: () => true,
      encryptString: s => Buffer.from(Buffer.from(String(s), "utf8").map(b => b ^ 0x5a)),
      decryptString: b => Buffer.from(Buffer.from(b).map(x => x ^ 0x5a)).toString("utf8") },
  };
  const src = fs.readFileSync(path.join(app, "shell", "main.js"), "utf8");
  process.env.XDG_CURRENT_DESKTOP = "GNOME"; /* so the shell's Linux keyring switch stays out, on any machine */
  new Function("require", "__dirname", "__filename", "module", "exports", "console", src)(
    n => (n === "electron" ? electron : nodeRequire(n)), path.join(app, "shell"), path.join(app, "shell", "main.js"),
    { exports: {} }, {}, { log: s => said.push(String(s)), error: s => said.push(String(s)), warn: noop });
  const event = { sender: { id: 1, once: noop }, senderFrame: { parent: null, url: "file:///C:/lab/engine/etiuda.html" } };
  /* A desk on a folder team reads the local mirror its syncer keeps (board 945). From this pin, catalogFolder() is that
     mirror while the desk is still joining (shell/main.js, plant mirror-while-joining), not only after it has joined.
     No syncer runs here, so before each ask the share is copied into the mirror, invites/ included, which is where the
     opening and a refusal now are. */
  const primeMirror = () => {
    let share = "";
    try {
      const desk = JSON.parse(fs.readFileSync(path.join(ud, "desk.json"), "utf8"));
      share = desk && desk.keys && typeof desk.keys.eCatalogFolder === "string" ? desk.keys.eCatalogFolder : "";
    } catch { share = ""; }
    if (!share) return;
    let teamId = "";
    try {
      const team = JSON.parse(fs.readFileSync(path.join(share, "etiuda-team.json"), "utf8"));
      teamId = typeof team.id === "string" ? team.id : "";
    } catch { teamId = ""; }
    if (!teamId) return;
    const copy = (from, to) => {
      fs.mkdirSync(to, { recursive: true });
      for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
        const src = path.join(from, ent.name), dst = path.join(to, ent.name);
        if (ent.isDirectory()) copy(src, dst);
        else if (ent.isFile()) fs.copyFileSync(src, dst);
      }
    };
    copy(share, path.join(ud, "folder-mirror", teamId));
  };
  const ask = (ch, ...a) => { primeMirror(); return Promise.resolve(invoke[ch](event, ...a)); };
  /* The catalog read after a join uses the same mirror. The copy above has already brought the share across. */
  const mirror = (teamId, share) => {
    const into = path.join(ud, "folder-mirror", String(teamId));
    fs.mkdirSync(into, { recursive: true });
    for (const n of fs.readdirSync(share)) {
      const from = path.join(share, n);
      if (fs.statSync(from).isFile()) fs.copyFileSync(from, path.join(into, n));
    }
  };
  const readSynced = (name, teamId, share) => { mirror(teamId, share); return ask("etiuda:catalog-read", name); };
  return { ud, ask, said, mirror, readSynced, join: (op, file, name, check) => ask("etiuda:team-join", op, file, name, check) };
}

/* The vault the shell keeps invitations under, stood in: reversible, and never the secret's own spelling. */
const VAULT = { available: () => true,
  seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t), "utf8").reverse().toString("hex"), "utf8"),
  open: (b) => { const t = Buffer.from(b).toString("utf8"); if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8"); } };

/* ---- fd7: many people to invite, the page alone ---------------------------------------------------------------------- */
const FD7_RELAY = "C:\\data\\relay\\0123456789abcdef0123456789abcdef", FD7_SHARE = "C:\\share";
const FD7_DESKS = (invites, folder) => ({ error: null, folder: folder || FD7_RELAY, id: "lamp-shop", mark: null,
  signing: "studio-0123456789abcdef", file: "ours", reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [],
  autoAdmit: false, keyOpens: true, inviteName: "Mira Lantern", invites,
  team: { id: "t-0123456789abcdef", epoch: 1, sealed: true, lists: true, exportsSealed: true, roster: [] } });
const FD7_PROJECT = { dir: "C:/Projects/lamps", name: "Lamps", editions: [], counts: { cards: 0, intents: 0, cats: 0, rv: 0 },
  lint: { errors: 0, warnings: 0, notes: 0, suggestions: 0 }, draft: { langs: [{ code: "en" }], cards: [], rules: [] },
  project: { id: "p-0123456789abcdef", title: "Lamps", rev: 0, folder: null, fileName: "lamps.ec" } };
const FD7_TEXT = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
/** A page over a shell that makes invitations as studio:invite-make answers: the screen with every invitation made so far. `relay`
 *  false makes folder invitations, each with a check code; `refuseAt` refuses that call (1 is the first). */
async function fd7Page(lang, o) {
  const opt = o || {}, calls = [], made = [], place = opt.relay === false ? FD7_SHARE : FD7_RELAY;
  const { loadPage } = await import("./page-stand-in.mjs");
  const api = {
    desks: async () => JSON.parse(JSON.stringify(FD7_DESKS(made, place))),
    inviteMake: async (...a) => {
      calls.push(["inviteMake", ...a]);
      if (opt.refuseAt === calls.filter((c) => c[0] === "inviteMake").length) return { error: "No invitation was made.", said: { frame: "No invitation was made.", vars: {} } };
      const n = made.length, id = (n.toString(16) + "0123456789abcdef").slice(0, 16);
      made.push(opt.relay === false
        ? { id, name: a[1], person: a[2], made: "2026-11-01T08:00:00.000Z", expires: "2026-11-08T08:00:00.000Z", code: "0491" + n, relay: false }
        : { id, name: a[1], person: a[2], made: "2026-11-01T08:00:00.000Z", expires: "2026-11-08T08:00:00.000Z", code: "", relay: true, registered: true });
      return Object.assign(JSON.parse(JSON.stringify(FD7_DESKS(made, place))), { invited: id });
    },
  };
  const home = loadPage({ api: new Proxy(api, { get: (t, k) => (k in t ? t[k] : async (...a) => { calls.push([String(k), ...a]); return null; }) }), uiLang: lang });
  const P = home.page;
  Object.assign(P.S, { open: JSON.parse(JSON.stringify(FD7_PROJECT)), screen: "projects", home: "team", teamDir: FD7_PROJECT.dir, lang: "en", host: { tour: { offered: true } } });
  await P.desksLoad();
  P.ACTS["invite-new"]();
  home.node("#inviteName").value = "Mira Lantern";   /* the field as the cover fills it from the screen; the stand-in keeps no value */
  return { P, home, calls, made };
}
const FD7 = {
  async fd7a() {
    const { P, home, calls } = await fd7Page("en");
    home.node("#invitePerson").value = "Ada";
    await P.ACTS["do-invite-another"]();
    const dlg = home.node("#dlg").innerHTML;
    const first = calls.filter((c) => c[0] === "inviteMake");
    const open = P.S.cover === "team" && P.S.teamWant === "invite" && /id="invitePerson" maxlength="120" value=""/.test(dlg)
      && /id="inviteName" maxlength="120" value="Mira Lantern"/.test(dlg) && /data-invite-note/.test(dlg)
      && FD7_TEXT(dlg).indexOf("The link is on the clipboard. Send it through your organisation's own mail or chat.") >= 0
      && /<button class="btn" data-act="do-invite-another">Copy and make another<\/button>/.test(dlg);
    home.node("#invitePerson").value = "Bo";
    await P.ACTS["do-invite"]();
    const all = calls.filter((c) => c[0] === "inviteMake");
    check(first.length === 1 && first[0][3] === "Ada" && open && all.length === 2 && all[1][3] === "Bo" && P.S.cover === null,
      "fd7a Copy and make another makes one invitation and keeps the cover open for the next person, the lead's name kept, the person's"
      + " field empty and the clipboard said; Make the invitation then closes it as before: " + JSON.stringify({ made: all.map((c) => c[3]), open, cover: P.S.cover }));
  },
  async fd7b() {
    const seen = {};
    for (const lang of ["en", "pl"]) {
      const { P, home, calls } = await fd7Page(lang);
      const T = P.T;
      const dlg = home.node("#dlg").innerHTML;
      const offered = /id="inviteMany"/.test(dlg) && dlg.indexOf(T("One name a line. Each gets an invitation of its own, and each link works once.")) >= 0
        && dlg.indexOf('data-act="do-invite-batch">' + T("Make an invitation for each name") + "</button>") >= 0;
      home.node("#inviteMany").value = "  Ada Quay\n\nBo Lantern  \nCyra\n";
      await P.ACTS["do-invite-batch"]();
      const makes = calls.filter((c) => c[0] === "inviteMake"), others = calls.filter((c) => c[0] !== "inviteMake");
      const main = home.node("#main").innerHTML, t = FD7_TEXT(main);
      const each = ["Ada Quay", "Bo Lantern", "Cyra"].every((n, i) => makes[i] && makes[i][1] === FD7_PROJECT.dir && makes[i][2] === "Mira Lantern"
        && makes[i][3] === n && makes[i].length === 4);
      const rows = (main.match(/data-invite="/g) || []).length === 3 && (main.match(/data-act="invite-copy" data-id=/g) || []).length === 3
        && ["Ada Quay", "Bo Lantern", "Cyra"].every((n) => t.indexOf(n + " " + T("Made {WHEN}", { WHEN: "" }).trim()) >= 0);
      const done = t.indexOf(FD7_TEXT(T("Invitations made: {N}, one for each name. Each link works once.", { N: 3 }))) >= 0;
      seen[lang] = { offered, each: each && makes.length === 3, nothingElse: others.length === 0, closed: P.S.cover === null, rows, done,
        polish: lang === "en" || T("Make an invitation for each name") !== "Make an invitation for each name" };
    }
    const bad = [];
    for (const l of Object.keys(seen)) for (const k of Object.keys(seen[l])) if (seen[l][k] !== true) bad.push(l + " " + k);
    check(bad.length === 0,
      "fd7b a list of names, one a line, makes one single-use invitation each through the same verb and nothing else, closes the cover"
      + " and says how many, and the Desks screen lists each beside its person with its own Copy,"
      + " in English and Polish: " + (bad.length ? "failing " + JSON.stringify(bad) : "every part holds"));
  },
  async fd7c() {
    const { P, home, calls } = await fd7Page("en", { refuseAt: 2 });
    home.node("#inviteMany").value = "Ada Quay\nBo Lantern\nCyra";
    await P.ACTS["do-invite-batch"]();
    const makes = calls.filter((c) => c[0] === "inviteMake");
    const dlg = home.node("#dlg").innerHTML;
    check(makes.length === 2 && P.S.cover === "team" && !!P.S.err && P.S.inviteMany === "Bo Lantern\nCyra"
      && /<textarea class="ta" id="inviteMany"[^>]*>Bo Lantern\nCyra<\/textarea>/.test(dlg)
      && FD7_TEXT(dlg).indexOf("Invitations made: 1, one for each name. Each link works once.") >= 0,
      "fd7c a refusal part way keeps the cover open on the names not yet invited, says the refusal and how many were made, so a second"
      + " press invites nobody twice: " + JSON.stringify({ calls: makes.length, left: P.S.inviteMany, cover: P.S.cover }));
  },
};
const FD7_PLANTS = [
  { mark: "fd7-keep", leg: "fd7a", rel: "ui/app.js", line: "    if (false) {" },
  { mark: "fd7-each", leg: "fd7b", rel: "ui/app.js", line: "        const r = await API.inviteMake(dir, S.inviteName, names.join(\", \"));" },
  { mark: "fd7-batch-btn", leg: "fd7b", rel: "ui/app.js", line: "        + \"</div></div>\"" },
];

async function main(argv) {
  if (ONLY) {
    if (FD7[ONLY]) { try { await FD7[ONLY](); } catch (e) { check(false, ONLY + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); } }
    else check(false, "unknown leg " + ONLY);
    process.stdout.write("#counts checks=" + asserted + " failed=" + failed + NL);
    process.exit(failed ? 1 : 0);
  }
  clearScratch(SCRATCH);
  const SHARE = path.join(SCRATCH, "share"), SHARE2 = path.join(SCRATCH, "share-two"), APP = path.join(SCRATCH, "app");
  const HOME = path.join(SCRATCH, "projects"), UD = path.join(SCRATCH, "studio-profile");
  [SHARE, SHARE2, HOME, UD].forEach(d => fs.mkdirSync(d, { recursive: true }));
  fs.cpSync(path.join(ROOT, "engine", "pinned", "shell"), path.join(APP, "shell"), { recursive: true });
  const newDesk = (name, folder) => {
    const ud = path.join(SCRATCH, "desk-" + name);
    fs.mkdirSync(ud, { recursive: true });
    fs.writeFileSync(path.join(ud, "desk.json"),
      JSON.stringify({ kind: "etiuda-desk", schema: 1, keys: { eCatalogFolder: folder || SCRATCH, eUiLang: "en" } }), "utf8");
    return loadDesk(APP, ud);
  };

  let J = null, T = null, S = null, I = null, K = null, Jn = null;
  try {
    J = Engine.joinRules(); T = await import("../src/team.mjs"); S = await import("../src/studio.mjs");
    I = await import("../src/invite.mjs"); K = await import("../src/team-store.mjs"); Jn = await import("../src/join.mjs");
  } catch (e) { process.stderr.write(String(e && e.stack || e) + NL); }

  /* ---- ti1: the rules are the pin's, and a pin lacking any of them is refused ----------------------------------- */
  await leg("ti1 memberProof, inviteIdOf and the desk's inviteRead are sliced from the pinned shell, and a pin"
    + " lacking any one of them is refused naming it", async () => {
    const text = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
    const names = ["function memberProof(", "function inviteIdOf(", "function inviteRead("];
    const refused = names.map(m => {
      try { Engine.inviteRulesFrom(text.replace(m, m.replace("(", "Gone(")), "a cut copy"); return false; }
      catch (e) { return String(e && e.message).indexOf(JSON.stringify(m)) >= 0; }
    });
    const R = Engine.inviteRules();
    return facts("ti1", { from: R.from === "the pinned engine", refused: refused.every(Boolean),
      fns: ["memberProof", "inviteIdOf", "inviteRead"].every(n => typeof R[n] === "function") });
  });

  /* ---- the lead's team at the share, sealed, with its key kept, and a sealed catalog ------------------------------ */
  const keyAt = path.join(SCRATCH, "lead-key.json"), lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + NL);
  const K1 = crypto.randomBytes(32);
  let team = T.newTeam({ catalogs: ["lamp-shop"], lead: { keyId: lead.keyId, public: lead.public } });
  /* On the relay (was: a team kept for a shared folder, which Studio no longer admits at; the folder team's removal). */
  team = T.withChannel(team, { kind: "relay", rt: "6b".repeat(16), url: "https://etiuda.dev" }, { format: 1, kind: "etiuda-ring", keys: [] });
  team.sealed = true;
  team = (await T.writeTeam(SHARE, team, { key: keyAt, passphrase: PASS })).team;
  const CATALOG = JSON.stringify({ format: 2, kind: "etiuda-catalog", id: "lamp-shop", rev: 1, name: "Lamp Shop", date: "2026-02-01",
    langs: [{ code: "en", label: "EN" }], tags: [{ id: "t-op", kind: "shelf", label: { en: "Openers" } }],
    cards: [{ id: "c-warm", shelf: "t-op", bodyShape: "plain", title: { en: "Warm opening" }, body: { en: "Good day." } }] }, null, 1) + NL;
  fs.writeFileSync(path.join(SHARE, "lamps.ec"), JSON.stringify(Engine.sealRules().sealCatalog(K1, team.id, 1, CATALOG)));
  const made = await S.newProject(HOME, "Lamp Shop", ["en"]);
  const PROJ = made && made.dir ? made.dir : made;
  S.setPublishFolder(PROJ, SHARE);
  const TEAMS = K.teamsFile(UD);
  K.keepTeamKey(TEAMS, VAULT, team.id, 1, K1);
  K.chooseSealed(TEAMS, team.id, true, SHARE, team);
  const keys = () => K.teamKeysOf(TEAMS, VAULT);
  const P0 = Engine.inviteRules();
  const book = () => K.inviteBookOf(TEAMS, VAULT);
  const held = async () => (await T.heldTeam(SHARE, { key: keyAt })).team;
  const teamBytes = () => fs.readFileSync(T.teamPath(SHARE), "utf8");
  /* The invitation fixture, as a relay invitation (P2: it was a folder invitation, whose yes asked a check code Studio no longer makes and
     which the engine no longer reads): the team, the lead and the secret the lead's invitation holds, and the built-in relay's address with an
     id, a token and an invitation id of the fixture's own. A yes to it asks for no code. */
  const makeFolderInvite = (target, name, secret, now) => {
    const t = target || {}, leadObj = t.lead || {};
    const relay = { rt: crypto.randomBytes(16).toString("hex"), url: "https://etiuda.dev/relay/v1",
      token: crypto.randomBytes(32).toString("hex"), inv: crypto.randomBytes(16).toString("hex") };
    const doc = {
      team: String(t.team || ""), relay,
      lead: { keyId: String(leadObj.keyId || ""), public: String(leadObj.public || ""), name: I.shownName(name) },
      secret: String(secret || ""),
    };
    const blob = I.INVITE_PREFIX + Buffer.from(JSON.stringify(doc), "utf8").toString("base64url");
    const Ir = Engine.inviteRules();
    const at = new Date(now == null ? Date.now() : now);
    return {
      blob, link: "", id: Ir.inviteIdOf(doc.secret), rt: relay.rt,
      name: doc.lead.name, made: at.toISOString(), expires: new Date(at.getTime() + I.INVITE_DAYS * DAY).toISOString(),
    };
  };
  /* A desk takes an invitation by its yes, which writes its request in the desk's own mirror of the relay's team; the relay would carry
     the request to the lead's share, so the leg does, where the lead's watch reads it. */
  const take = async (D, me, inv, name) => {
    const r = await safe(D.ask("etiuda:team-join", "invite", inv.blob, name));
    const from = path.join(D.ud, "relay", inv.rt, "desks", me.id, "join.json");
    if (fs.existsSync(from)) {
      const to = path.join(SHARE, "desks", me.id, "join.json");
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
    return r;
  };
  const invite = async (name, now, proj) => {
    const target = await S.inviteTarget(proj || PROJ, keyAt);
    const secret = I.newSecret(), m = makeFolderInvite(target, name, secret, now == null ? Date.now() : now);
    K.keepInvite(TEAMS, VAULT, target.team, { id: m.id, secret, made: m.made, expires: m.expires, name: m.name });
    return Object.assign(m, { secret, target });
  };
  /* What the shell does with an admission's answer (shell/main.js tookAdmission): each invitation used is spent. */
  const took = (r, teamId) => { (r.spent || []).forEach(x => K.endInvite(TEAMS, teamId, x.invite, "spent", x.desk)); return r; };
  /* What the shell's watch does when it sees the folder move (shell/main.js watchOnce): the thread's watchAdmit, nobody
     present, then the answer taken as the shell takes it. */
  const watchBy = async (secret) => took(await safe((async () => S.watchAdmit(SHARE, keyAt, secret === undefined ? PASS : secret,
    { teamKeys: keys(), invites: book(), teamsFile: TEAMS, now: Date.now() }))(), NONE), team.id);
  const listed = async () => S.desksFor(PROJ, keyAt, { invites: book() });
  const rowOf = (r, id) => (r.requests || []).find(x => x.id === id);

  const A = await invite("Mira Lantern");

  /* ---- ti3: made here, taken by the real desk with that code, let in by its proof ---------------------------------- */
  const D1 = newDesk("one"), me1 = await D1.ask("etiuda:branch-identity", true);
  const took1 = await take(D1, me1, A, "Ewa N.");
  const req1 = await safe((async () => JSON.parse(fs.readFileSync(path.join(SHARE, "desks", me1.id, "join.json"), "utf8")))(), { desk: {} });
  const list1 = await safe(listed(), NONE);
  await leg("ti3 an invitation made in Studio is taken by the pinned desk shell: the request carries the"
    + " invitation's id and a proof, never the secret, and is listed by the desk's name as a desk asking by invitation, its"
    + " invitation valid", async () => {
    const r = rowOf(list1, me1.id) || {};
    return facts("ti3", { waiting: !!took1.join && took1.join.state === "waiting", id: !!req1.invite && req1.invite.id === A.id,
      proof: !!req1.invite && req1.invite.proof === Engine.inviteRules().memberProof(A.secret, req1.commit),
      noSecret: JSON.stringify(req1).indexOf(A.secret) < 0, kind: req1.desk.kind === "desk",
      row: r.name === "Ewa N." && r.kind === "desk" && r.door === "invitation" && r.invite === "valid" });
  });
  const joinsBefore = fs.existsSync(path.join(SHARE, J.JOINS_NAME));
  const in1 = await watchBy();
  const t1 = await safe(held(), { roster: [] }), e1 = t1 && (t1.roster || []).find(e => e.desk.id === me1.id);
  const s1 = await safe(D1.join("state")), r1 = await safe(D1.readSynced("lamps.ec", team.id, SHARE));
  await leg("ti4 with nobody pressing anything, the watch's admission lets that desk in by its proof, with"
    + " no code and no opening: its entry wraps the team key for the epoch and says it came by that invitation, the"
    + " invitation is spent, and the desk opens the sealed catalog", async () => facts("ti4", {
    admitted: in1.admitted.join() === me1.id && !(in1.skipped || []).length && !!in1.written,
    entry: !!e1 && !!e1.wrap && e1.wrap.epoch === 1 && e1.door === "invitation" && e1.invite === A.id && e1.desk.kind === "desk",
    noOpening: !joinsBefore && !fs.existsSync(path.join(SHARE, J.JOINS_NAME)),
    spent: (K.invitesOf(TEAMS, team.id).find(i => i.id === A.id) || {}).state === "spent" && !(book()[A.id] || {}).secret,
    /* The desk's own side (it joined and opened the catalog from the share) is no longer held here: the team file names the relay now, and a
       desk reads a relay team through the relay (was: joined: !!s1.joined, reads: !!r1 && r1.text === CATALOG.trim()); ti37 holds the relay. */
    listedOff: !rowOf(await listed(), me1.id) }));

  /* ---- ti5 to ti10: each never let in unattended, and nothing written ---------------------------------------------- */
  /* The watch's admission with no request waiting that should go in: nothing is let in, the request is left with its reason,
     and neither the team file nor an invitation moves. */
  const refusedAs = async (id, why) => {
    const before = teamBytes(), was = JSON.stringify(K.invitesOf(TEAMS, team.id));
    const off = await watchBy();
    const said = (r) => ((r.skipped || []).find(x => x.id === id) || {}).why;
    return { r: off, ok: !off.threw && off.admitted.length === 0 && said(off) === why
      && teamBytes() === before && JSON.stringify(K.invitesOf(TEAMS, team.id)) === was && !off.written,
      row: (rowOf(await listed(), id) || {}).invite };
  };
  /* A request naming an invitation already spent (review 14's carve, studio-invite-spend): the first pass leaves it out, says
     spent and refuses it in the file of openings the lead signs, the team file and the invitations unmoved; from then on it is
     asked no more and listed no more, its desk reading its request refused. */
  const spentRefused = async (id) => {
    const before = teamBytes(), was = JSON.stringify(K.invitesOf(TEAMS, team.id));
    const off = await watchBy(), second = await watchBy();
    const said = (r) => ((r.skipped || []).find(x => x.id === id) || {}).why;
    let opening = null;
    try {
      const req = JSON.parse(fs.readFileSync(path.join(SHARE, "desks", id, "join.json"), "utf8"));
      opening = J.joinOpening(JSON.parse(fs.readFileSync(path.join(SHARE, J.JOINS_NAME), "utf8")), team.id, id, req.commit, [lead.public]);
    } catch { opening = null; }
    const shown = K.noticesOf(TEAMS, team.id).filter((n) => n.desk === id);
    return { ok: !off.threw && !second.threw && off.admitted.length === 0 && second.admitted.length === 0 && said(off) === "spent" && said(second) === undefined
      && teamBytes() === before && JSON.stringify(K.invitesOf(TEAMS, team.id)) === was && !off.written && !second.written
      && !!opening && opening.refused === true && !rowOf(await listed(), id)
      && shown.length === 1 && !!shown[0].at && !!shown[0].invite };
  };
  /* A request no desk shell would write, from a desk of the leg's own, genuine under the pinned join rule. */
  const forger = (o) => {
    const k = crypto.generateKeyPairSync("ed25519"), raw = (x) => x.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    const pub = raw(k.publicKey), id = J.branchIdOf(pub), box = raw(crypto.generateKeyPairSync("x25519").publicKey);
    const nonce = crypto.randomBytes(32).toString("hex"), commit = J.joinCommit(o.team || team.id, pub, box, nonce);
    const desk = { id, key: pub, box, name: o.name || "Forged desk" };
    if (o.kind) desk.kind = o.kind;
    const doc = { format: 1, kind: J.JOIN_KIND, team: o.team || team.id, desk, date: "2026-10-13T09:00:00.000Z", commit };
    if (o.invite) doc.invite = o.invite(commit);
    doc.sig = { alg: "Ed25519", keyId: id };
    doc.sig.value = crypto.sign(null, J.joinSignedBytes(doc), k.privateKey).toString("hex");
    fs.mkdirSync(path.join(o.share || SHARE, "desks", id), { recursive: true });
    fs.writeFileSync(path.join(o.share || SHARE, "desks", id, "join.json"), JSON.stringify(doc));
    return { id, doc };
  };
  const B = await invite("Mira Lantern");
  const P = Engine.inviteRules();
  const fProof = forger({ invite: (c) => ({ id: B.id, proof: P.memberProof(I.newSecret(), c) }) });
  await leg("ti5 a request naming a live invitation of this team with a proof made under another secret is never let in"
    + " unattended, auto-admit off or on, writes nothing and says the proof", async () => {
    const x = await refusedAs(fProof.id, "proof");
    return facts("ti5", { refused: x.ok, row: x.row === "proof", genuine: J.joinGenuine(fProof.doc, fProof.id) });
  });
  const D2 = newDesk("two"), me2 = await D2.ask("etiuda:branch-identity", true);
  await take(D2, me2, A, "Piotr S.");
  await leg("ti6 the same invitation taken by a second desk, its proof valid for that desk's own request, is never let in"
    + " unattended: the invitation is spent, and the request is refused and listed no more", async () => {
    const req = JSON.parse(fs.readFileSync(path.join(SHARE, "desks", me2.id, "join.json"), "utf8"));
    const x = await spentRefused(me2.id);
    return facts("ti6", { refused: x.ok, ownProof: req.invite.proof === P.memberProof(A.secret, req.commit) });
  });
  const W = await invite("Mira Lantern");
  const D3 = newDesk("three"), me3 = await D3.ask("etiuda:branch-identity", true);
  await take(D3, me3, W, "Ola");
  const wasLive = (book()[W.id] || {}).state;
  K.endInvite(TEAMS, team.id, W.id, "withdrawn");
  await leg("ti7 an invitation withdrawn after its desk took it is never let in unattended, writes nothing and says withdrawn;"
    + " the request stays listed (P2: and no longer \"asking, its code's door open\", the code door is gone)", async () => {
    const x = await refusedAs(me3.id, "withdrawn");
    const row = rowOf(await listed(), me3.id) || {};
    return facts("ti7", { live: wasLive === "live", refused: x.ok, row: row.invite === "withdrawn" && !!row.id,
      secretGone: !(book()[W.id] || {}).secret });
  });
  const X = await invite("Mira Lantern", Date.now() - 8 * DAY);
  const D4 = newDesk("four"), me4 = await D4.ask("etiuda:branch-identity", true);
  await take(D4, me4, X, "Tomasz W.");
  await leg("ti8 an invitation past its seven days is never let in unattended, though its desk took it and its proof is good:"
    + " it writes nothing and says expired", async () => {
    const x = await refusedAs(me4.id, "expired");
    return facts("ti8", { refused: x.ok, row: x.row === "expired", days: Date.parse(X.expires) - Date.parse(X.made) === 7 * DAY,
      past: Date.parse(X.expires) < Date.now() });
  });
  /* Another team this Studio leads, at another folder, and a request at this one naming that team's invitation. */
  const made2 = await S.newProject(HOME, "Lamp Shop Two", ["en"]);
  const PROJ2 = made2 && made2.dir ? made2.dir : made2;
  S.setPublishFolder(PROJ2, SHARE2);
  let team2 = T.newTeam({ catalogs: ["lamp-shop"], lead: { keyId: lead.keyId, public: lead.public } });
  team2 = T.withChannel(team2, { kind: "relay", rt: "6c".repeat(16), url: "https://etiuda.dev" }, { format: 1, kind: "etiuda-ring", keys: [] });
  team2.sealed = true;
  team2 = (await T.writeTeam(SHARE2, team2, { key: keyAt, passphrase: PASS })).team;
  const Y = await invite("Mira Lantern", null, PROJ2);
  const fOther = forger({ invite: (c) => ({ id: Y.id, proof: P.memberProof(Y.secret, c) }) });
  const fNone = forger({ invite: (c) => ({ id: crypto.randomBytes(8).toString("hex"), proof: P.memberProof(I.newSecret(), c) }) });
  await leg("ti9 a request at this team's folder naming another team's invitation, its proof made with that invitation's own"
    + " secret, is never let in unattended and says another team; one naming no invitation this Studio made says unknown", async () => {
    const x = await refusedAs(fOther.id, "other"), y = await refusedAs(fNone.id, "unknown");
    return facts("ti9", { other: x.ok && x.row === "other" && Y.target.team === team2.id, unknown: y.ok && y.row === "unknown" });
  });
  /* The shell marks an invitation spent after the thread writes; where that mark is lost, the roster still holds it. */
  const Z = await invite("Mira Lantern");
  const D5 = newDesk("five"), me5 = await D5.ask("etiuda:branch-identity", true);
  await take(D5, me5, Z, "Iga");
  const in5 = await safe((async () => S.watchAdmit(SHARE, keyAt, PASS, { teamKeys: keys(), invites: book() }))(), NONE);
  const D6 = newDesk("six"), me6 = await D6.ask("etiuda:branch-identity", true);
  await take(D6, me6, Z, "Adam");
  await leg("ti10 an invitation that let a desk in is spent by the roster itself where teams.json still calls it live: a second"
    + " desk taking it is refused as spent", async () => {
    const x = await spentRefused(me6.id);
    return facts("ti10", { first: in5.admitted.join() === me5.id, stillLive: (book()[Z.id] || {}).state === "live", refused: x.ok });
  });
  await leg("ti11 two desks that took one invitation, seen in one run of the watch: neither is let in and neither is"
    + " refused, and both stay listed for the lead", async () => {
    const V = await invite("Mira Lantern");
    const Da = newDesk("seven"), ma = await Da.ask("etiuda:branch-identity", true);
    const Db = newDesk("eight"), mb = await Db.ask("etiuda:branch-identity", true);
    await take(Da, ma, V, "Kuba");
    await take(Db, mb, V, "Lena");
    const r = await watchBy();
    const t = await held();
    const rows = await listed();
    const why = (id) => ((r.skipped || []).find(x => x.id === id) || {}).why;
    return facts("ti11", { none: r.admitted.length === 0 && why(ma.id) === "tie" && why(mb.id) === "tie",
      listed: !!rowOf(rows, ma.id) && !!rowOf(rows, mb.id) && rowOf(rows, ma.id).tied === true && rowOf(rows, mb.id).tied === true,
      roster: t.roster.filter(e => e.invite === V.id).length === 0,
      live: (K.invitesOf(TEAMS, team.id).find(i => i.id === V.id) || {}).state === "live" });
  });

  /* RETIRED, P2 (no code is typed and the six-digit door is gone): ti44, "in a tie the invitation's five-digit code admits neither desk, and each desk's own six-digit code, read after its opening, admits that desk alone"; and ti12, "the six-digit door is unchanged: the desk whose invitation was withdrawn is opened, answers, and is let in by the code it shows, and that door writes no door or invitation label on its entry". A tie on a relay team cannot arise, since a relay invitation's token is spent by one desk; the watch's refusal of a tie (ti11) stays. */
  /* ---- ti28, ti13: the watch's admission without automatic joining --------------------------------------------------- */
  /* The request is forged, not asked by a desk: the desk's Ask no longer writes one at a folder (the folder join is gone from the
     engine since fold 131, P2), so a request that names no invitation is the fixture's to write, as ti5 writes its. The
     comparison it held, the watch leaving it as it was, is the same. Was: a desk ("nine") asking through etiuda:team-join "ask". */
  const me9 = forger({ name: "Nela" });
  const fStudio = forger({ kind: "studio", name: "Branch office" });
  const before9 = teamBytes();
  const plainOff = await safe((async () => S.watchAdmit(SHARE, keyAt, PASS, { teamKeys: keys(), invites: book() }))(), NONE);
  await leg("ti28 the watch's admission leaves a request that names no invitation asking, as it was (it has no code door now; the lead refuses it or leaves it)",
    async () => facts("ti28", { ran: !plainOff.threw && !plainOff.needKey,
    none: plainOff.admitted.length === 0 && !plainOff.written, same: teamBytes() === before9,
    still: !!rowOf(await listed(), me9.id) }));
  const wait9 = await safe((async () => S.watchAdmit(SHARE, keyAt, "", { teamKeys: keys(), invites: book() }))(), NONE);
  await leg("ti13 with the signing key not open, the watch lets nobody in and writes nothing, and says it waits for the key",
    async () => facts("ti13", { needKey: wait9.needKey === true, none: wait9.admitted.length === 0 && !wait9.written,
      same: teamBytes() === before9, still: !!rowOf(await listed(), me9.id) }));

  /* ---- ti17 to ti19: what the invitation is made of -------------------------------------------------------------- */
  const SAMPLE_RELAY = { rt: "00".repeat(16), url: "https://relay.etiuda.test/relay/v1", token: "11".repeat(32), inv: "22".repeat(16) };
  await leg("ti17 an invitation requires a relay channel and refuses one the desk would read otherwise: missing relay refuses,"
    + " a bad relay URL is refused naming it, and the name is cut to what the desk's reader shows", async () => {
    const tgt = await S.inviteTarget(PROJ, keyAt);
    const noRelay = await throwsOn(() => I.makeInvite(tgt, "x", I.newSecret(), Date.now()));
    const badRelay = Object.assign({}, SAMPLE_RELAY, { url: "not-an-https-url/trailing." });
    const said = await throwsOn(() => I.makeInvite(tgt, "x", I.newSecret(), Date.now(), undefined, badRelay));
    const hidden = "Mira" + String.fromCharCode(0x202e) + " Lantern" + String.fromCharCode(9) + "x".repeat(200);
    const m = I.makeInvite(tgt, hidden, I.newSecret(), Date.now(), undefined, SAMPLE_RELAY);
    const back = P.inviteRead(m.blob, process.platform !== "win32");
    return facts("ti17", { noRelay: /nobody can be invited/.test(noRelay),
      refused: /would read .* differently from how it is written here/.test(said) && said.indexOf("trailing.") >= 0,
      name: !!back && back.lead.name === m.name && m.name.length <= 120 && m.name.indexOf(String.fromCharCode(0x202e)) < 0 && /^Mira Lantern x/.test(m.name) });
  });
  await leg("ti18 an invitation needs a team this Studio leads: a project whose folder holds none, or one another key leads, is"
    + " refused before anything is made", async () => {
    const made3 = await S.newProject(HOME, "No Team", ["en"]);
    const PROJ3 = made3 && made3.dir ? made3.dir : made3, SHARE3 = path.join(SCRATCH, "share-three");
    fs.mkdirSync(SHARE3, { recursive: true });
    S.setPublishFolder(PROJ3, SHARE3);
    const none = await throwsOn(() => S.inviteTarget(PROJ3, keyAt));
    const other = await makeKeyFile({ passphrase: PASS }), otherAt = path.join(SCRATCH, "other-key.json");
    fs.writeFileSync(otherAt, JSON.stringify(other, null, 1) + NL);
    const theirs = await throwsOn(() => S.inviteTarget(PROJ, otherAt));
    return /nobody can be invited/.test(none) && /nobody can be invited/.test(theirs);
  });
  await leg("ti19 teams.json keeps an invitation's secret sealed, never in its own spelling, and an ended one loses it", async () => {
    const text = fs.readFileSync(TEAMS, "utf8");
    const spelt = (hex) => { const b = Buffer.from(hex, "hex"); return [hex, hex.toUpperCase(), b.toString("base64"), b.toString("base64url")]; };
    const all = [A, B, W, X, Y, Z].map(x => x.secret);
    /* An ended invitation's record is read in the file itself: the book opens a live one's secret alone, so it cannot see one
       an end left behind. */
    const kept = (JSON.parse(text).teams[team.id] || {}).invites || {};
    return facts("ti19", { sealed: all.every(s => spelt(s).every(x => text.indexOf(x) < 0)),
      liveOpens: (book()[B.id] || {}).secret === B.secret && typeof (kept[B.id] || {}).secret === "string",
      endedGone: [A.id, W.id].every(id => !!kept[id] && kept[id].state !== "live" && kept[id].secret === undefined) });
  });

  /* ---- ti29 to ti31: the watch reads the book again, a removal ends the invitation, a studio's proof is let in -------- */
  await leg("ti29 a withdraw that lands after the book was read and before the write is skipped: the watch is handed that"
    + " earlier book, the file already calls the invitation withdrawn, and nobody is let in and nothing is written", async () => {
    const made = await invite("Mira Lantern");
    const f = forger({ name: "Late withdraw", invite: (c) => ({ id: made.id, proof: P.memberProof(made.secret, c) }) });
    const stale = book();
    K.endInvite(TEAMS, team.id, made.id, "withdrawn");
    const before = teamBytes();
    const r = await safe((async () => S.watchAdmit(SHARE, keyAt, PASS,
      { teamKeys: keys(), invites: stale, teamsFile: TEAMS }))(), NONE);
    const why = ((r.skipped || []).find((x) => x.id === f.id) || {}).why;
    const on = ((await safe(held(), { roster: [] })).roster || []).some((e) => e.desk && e.desk.id === f.id);
    return facts("ti29", { wasLive: (stale[made.id] || {}).state === "live" && !!(stale[made.id] || {}).secret,
      file: (K.invitesOf(TEAMS, team.id).find((i) => i.id === made.id) || {}).state === "withdrawn",
      skipped: !r.threw && r.admitted.length === 0 && why === "withdrawn" && !r.written && !on && teamBytes() === before });
  });
  await leg("ti31 a request of kind studio that proves a live invitation is let in by that invitation"
    + " and the invitation is spent: the kind is a label on the roster and not a reason to wait", async () => {
    const made = await invite("Mira Lantern");
    const f = forger({ kind: "studio", name: "Field studio",
      invite: (c) => ({ id: made.id, proof: P.memberProof(made.secret, c) }) });
    const r = await watchBy();
    const e = ((await safe(held(), { roster: [] })).roster || []).find((x) => x.desk && x.desk.id === f.id);
    return facts("ti31", { admitted: !r.threw && r.admitted.indexOf(f.id) >= 0,
      entry: !!e && e.desk.kind === "studio" && e.door === "invitation" && e.invite === made.id && !!e.wrap,
      spent: (K.invitesOf(TEAMS, team.id).find((i) => i.id === made.id) || {}).state === "spent",
      left: r.admitted.indexOf(fStudio.id) < 0 });
  });
  await leg("ti30 removing the only desk an invitation let in, while the book still calls that invitation live, ends it"
    + " before the new epoch is kept: the same secret does not let another desk onto that epoch, and the shell marks the"
    + " invitation spent before it treats the write as kept", async () => {
    const made = await invite("Mira Lantern");
    const holder = forger({ name: "First holder", invite: (c) => ({ id: made.id, proof: P.memberProof(made.secret, c) }) });
    const first = await safe((async () => S.watchAdmit(SHARE, keyAt, PASS,
      { teamKeys: keys(), invites: book() }))(), NONE);
    const liveAfter = (book()[made.id] || {}).state === "live" && !!(book()[made.id] || {}).secret;
    const removed = await S.removeMember(PROJ, keyAt, team.id, holder.id, PASS,
      { confirm: true, teamKeys: keys(), teamsFile: TEAMS });
    if (removed && removed.teamKey) K.keepTeamKey(TEAMS, VAULT, team.id, removed.epoch, removed.teamKey);
    const other = forger({ name: "Second holder", invite: (c) => ({ id: made.id, proof: P.memberProof(made.secret, c) }) });
    const again = await safe((async () => S.watchAdmit(SHARE, keyAt, PASS,
      { teamKeys: keys(), invites: book(), teamsFile: TEAMS }))(), NONE);
    const why = ((again.skipped || []).find((x) => x.id === other.id) || {}).why;
    const on = ((await safe(held(), { roster: [] })).roster || []).some((e) => e.desk && e.desk.id === other.id);
    const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const body = shell.slice(shell.indexOf('answer("studio:member-remove"'), shell.indexOf('answer("studio:', shell.indexOf('answer("studio:member-remove"') + 30));
    const worker = fs.readFileSync(path.join(ROOT, "src", "studio.mjs"), "utf8");
    const fn = worker.slice(worker.indexOf("async function removeMember("), worker.indexOf("export { listProjects"));
    const helperAt = worker.indexOf("async function sealAfterTeam(");
    const helper = helperAt < 0 ? "" : worker.slice(helperAt, worker.indexOf("async function moveEpoch(", helperAt));
    return facts("ti30", {
      first: first.admitted.length === 1 && first.admitted[0] === holder.id && liveAfter,
      ended: removed.endedInvite === made.id
        && (K.invitesOf(TEAMS, team.id).find((i) => i.id === made.id) || {}).state === "spent"
        && !(book()[made.id] || {}).secret,
      refused: !again.threw && again.admitted.indexOf(other.id) < 0 && why === "spent" && !again.written && !on,
      shell: body.indexOf("teamsFile:") >= 0 && body.indexOf(".endInvite(") >= 0
        && body.indexOf(".endInvite(") < body.indexOf("keepWritten("),
      /* The team write lives in sealAfterTeam, which a removal calls after the invitation ends, and that helper writes
         the team file before it seals an edition again. */
      worker: fn.indexOf("endInvite(") >= 0 && helper.indexOf("writeTeam(") >= 0
        && fn.indexOf("endInvite(") < fn.indexOf("sealAfterTeam(")
        && helper.indexOf("writeTeam(") < helper.indexOf("sealCatalog(") });
  });
  await leg("ti32 removing a desk an invitation let in, by a caller that names no teamsFile, throws a plain fault before"
    + " anything is written: the share and teams.json are byte for byte as they were, and the desk is still on the team", async () => {
    const made = await invite("Mira Lantern");
    const holder = forger({ name: "Third holder", invite: (c) => ({ id: made.id, proof: P.memberProof(made.secret, c) }) });
    const first = await safe((async () => S.watchAdmit(SHARE, keyAt, PASS,
      { teamKeys: keys(), invites: book() }))(), NONE);
    const files = (dir) => fs.readdirSync(dir, { recursive: true }).map(String).sort()
      .filter((n) => fs.statSync(path.join(dir, n)).isFile()).map((n) => n + NL + fs.readFileSync(path.join(dir, n), "utf8")).join(NL);
    const share = files(SHARE), teams = fs.readFileSync(TEAMS, "utf8");
    const err = await S.removeMember(PROJ, keyAt, team.id, holder.id, PASS, { confirm: true, teamKeys: keys() })
      .then(() => null, (e) => e);
    const on = ((await safe(held(), { roster: [] })).roster || []).some((e) => e.desk && e.desk.id === holder.id);
    const ok = facts("ti32", { first: first.admitted.indexOf(holder.id) >= 0,
      thrown: !!err && typeof err.message === "string" && !err.said && err.message.indexOf("teamsFile") >= 0,
      unwritten: files(SHARE) === share && fs.readFileSync(TEAMS, "utf8") === teams && on });
    /* Taken off as the shell takes it off, so the legs after this one meet the team ti30 leaves. */
    const removed = await safe(S.removeMember(PROJ, keyAt, team.id, holder.id, PASS,
      { confirm: true, teamKeys: keys(), teamsFile: TEAMS }), {});
    if (removed && removed.teamKey) K.keepTeamKey(TEAMS, VAULT, team.id, removed.epoch, removed.teamKey);
    return ok && removed.endedInvite === made.id;
  });

  await leg("ti27 the name a request gives is listed without the characters that turn or hide text, as the desk's reader holds"
    + " a lead's name, so the lead reads what the desk is called before letting it in", async () => {
    const turned = "Ewa " + String.fromCharCode(0x202e) + "N." + String.fromCharCode(0x200b);
    const f = forger({ name: turned });
    const row = rowOf(await listed(), f.id) || {};
    return facts("ti27", { genuine: J.joinGenuine(f.doc, f.id) && f.doc.desk.name === turned, shown: row.name === "Ewa N." });
  });

  /* ---- ti20 to ti26: the Desks screen, as the page paints it -------------------------------------------------------- */
  const { loadPage } = await import("./page-stand-in.mjs");
  const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
  const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]).replace(/\s+/g, " ").trim();
  const asked = [];
  const ASKV = { id: "k-9b12e0040c71b2e4", name: "Ola", key: "9b12e004" + "0".repeat(56), asked: "2026-10-04T09:20:00.000Z", state: "asks",
    kind: "desk", door: "invitation", invite: "valid" };
  const ASKX = Object.assign({}, ASKV, { id: "k-3f9a0c71b2e4d856", name: "Iga", invite: "expired" });
  const ASKP = Object.assign({}, ASKV, { id: "k-81d0e6a4c95b7f13", name: "Ada", door: "folder", invite: "" });
  const RELAY_DIR = "C:\\data\\relay\\" + "0".repeat(32);
  const page = (o) => Object.assign({ error: null, folder: "C:\\share", id: "lamp-shop", mark: null, signing: lead.keyId, file: "ours",
    reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [], keyOpens: true, inviteName: "Mira Lantern",
    invites: [{ id: "0123456789abcdef", name: "Mira Lantern", made: "2026-10-13T08:00:00.000Z", expires: "2026-10-20T08:00:00.000Z", code: "", relay: true, registered: true }],
    team: { id: team.id, epoch: 1, sealed: true, lists: true, exportsSealed: true, relay: true, roster: [
      { id: "k-e5c80a17b2e4d856", name: "Ewa's desk", own: "", key: "e5c80a17b2e4d856", admitted: true, kind: "desk", door: "invitation" },
      { id: "k-7d0355e1c95b7f13", name: "Anna", own: "", key: "7d0355e1c95b7f13", admitted: true, kind: "desk", door: "auto" },
      { id: "k-1d0355e1c95b7f13", name: "Ola K.", own: "", key: "1d0355e1c95b7f13", admitted: true, kind: "desk", door: "code" }] } }, o || {});
  let answer = page();
  const api = {
    desks: async (d) => { asked.push(["desks", d]); return JSON.parse(JSON.stringify(answer)); },
    inviteMake: async (...a) => { asked.push(["inviteMake", ...a]); return JSON.parse(JSON.stringify(Object.assign(page({ folder: RELAY_DIR }), { invited: "0123456789abcdef" }))); },
    inviteCopy: async (...a) => { asked.push(["inviteCopy", ...a]); return JSON.parse(JSON.stringify(page({ folder: RELAY_DIR }))); },
    inviteCancel: async (...a) => { asked.push(["inviteCancel", ...a]); return JSON.parse(JSON.stringify(page({ folder: RELAY_DIR, invites: [] }))); },
  };
  const home = loadPage({ api, uiLang: "en" });
  const Pg = home.page;
  const open = JSON.parse(JSON.stringify(await S.openProject(PROJ)));
  Object.assign(Pg.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
  const mainHtml = () => home.node("#main").innerHTML;
  await leg("ti20 the screen keeps two lists, the desks asking to join before the members, each row with its kind and how it"
    + " came: by invitation, a request in the folder, let in by itself, or a request and its code", async () => {
    answer = page({ requests: [ASKV, ASKP] });
    await Pg.desksLoad();
    const h = mainHtml(), t = text(h);
    const a = t.indexOf("Asking to join"), m = t.indexOf("Members"), ola = t.indexOf("Ola asked"), ewa = t.indexOf("Ewa's desk");
    return facts("ti20", { order: a >= 0 && ola > a && m > ola && ewa > m,
      labels: /Ola asked 2026-10-04 09:20 Desk, by invitation/.test(t) && /Ada asked 2026-10-04 09:20 Desk, by request in the folder/.test(t)
        && /e5c8 0a17 b2e4 d856 admitted Desk, by invitation/.test(t) && /7d03 55e1 c95b 7f13 admitted Desk, joined automatically/.test(t)
        && /1d03 55e1 c95b 7f13 admitted Desk, by request in the folder/.test(t) });
  });
  await leg("ti21 a request whose invitation checks out offers no press, no Admit, no code field and no Open, only that its"
    + " invitation checks out and, with the signing key shut, that it joins by itself once the key opens; one whose"
    + " invitation has expired says so; the plain request offers Refuse alone (P2: the code's door is gone)", async () => {
    answer = page({ keyOpens: false, requests: [ASKV] });
    await Pg.desksLoad();
    const shut = text(mainHtml());
    answer = page({ requests: [ASKV, ASKX, ASKP] });
    await Pg.desksLoad();
    const h = mainHtml(), t = text(h);
    return facts("ti21", { noPress: h.indexOf('data-id="' + ASKV.id + '"') > 0 && !/invite-admit/.test(h) && h.indexOf('data-code="' + ASKV.id + '"') < 0
        && h.indexOf('data-act="desk-open" data-id="' + ASKV.id + '"') < 0 && h.indexOf('data-act="desk-admit" data-id="' + ASKV.id + '"') < 0,
      joins: /Ola asked .*? Its invitation checks out\./.test(t) && !/Joins by itself once/.test(t)
        && /Its invitation checks out\. Joins by itself once this Studio.s signing key opens\./.test(shut),
      expired: /Its invitation has expired\./.test(t) && h.indexOf('data-act="desk-open"') < 0
        && h.indexOf('data-act="invite-admit" data-id="' + ASKX.id + '"') < 0,
      plain: h.indexOf('data-act="desk-open"') < 0 && h.indexOf('data-act="desk-refuse" data-id="' + ASKP.id + '"') > 0 && h.indexOf('data-act="invite-admit" data-id="' + ASKP.id + '"') < 0 });
  });
  await leg("ti22 a desk let in by its invitation stands among the members as by invitation, with Remove to undo it, and the"
    + " page holds no act that lets a desk in by its invitation", async () => {
    answer = page();
    await Pg.desksLoad();
    const h = mainHtml(), t = text(h);
    return facts("ti22", { member: /Ewa's desk e5c8 0a17 b2e4 d856 admitted Desk, by invitation/.test(t)
        && h.indexOf('data-act="member-remove" data-id="k-e5c80a17b2e4d856"') > 0,
      noAct: !Object.prototype.hasOwnProperty.call(Pg.ACTS, "invite-admit") });
  });
  await leg("ti23 on a relay team, live invitations show Copy link, Copy as text and Cancel; Invite"
    + " opens a cover asking only the lead's name, whose press sends that name and says the link is on the clipboard", async () => {
    answer = page({ folder: RELAY_DIR });
    await Pg.desksLoad();
    const h = mainHtml(), t = text(h);
    const listed0 = /Made 2026-10-13/.test(t) && /Valid until 2026-10-20/.test(t)
      && h.indexOf('data-act="invite-copy" data-id="0123456789abcdef"') > 0
      && h.indexOf('data-act="invite-cancel" data-id="0123456789abcdef"') > 0 && /data-act="invite-new"/.test(h);
    Pg.ACTS["invite-new"]();
    const dlg = home.node("#dlg").innerHTML;
    const cover = Pg.S.cover === "team" && /id="inviteName"/.test(dlg) && /value="Mira Lantern"/.test(dlg) && /data-act="do-invite"/.test(dlg)
      && !/type="password"/.test(dlg);
    const n = asked.length;
    await Pg.ACTS["do-invite"]();
    const sent = asked.slice(n).find(a => a[0] === "inviteMake");
    return facts("ti23", { listed: listed0, cover, sent: !!sent && sent[1] === open.dir && sent.length === 4 && typeof sent[2] === "string" && typeof sent[3] === "string",
      said: Pg.S.cover === null && /The link is on the clipboard\./.test(text(mainHtml())) });
  });
  await leg("ti24 Copy and Cancel send the invitation's id alone", async () => {
    const n = asked.length;
    await Pg.ACTS["invite-copy"]({ getAttribute: () => "0123456789abcdef" });
    await Pg.ACTS["invite-cancel"]({ getAttribute: () => "0123456789abcdef" });
    const got = asked.slice(n);
    return facts("ti24", { copy: got.some(a => a[0] === "inviteCopy" && a[1] === open.dir && a[2] === "0123456789abcdef" && a.length === 3),
      cancel: got.some(a => a[0] === "inviteCancel" && a[1] === open.dir && a[2] === "0123456789abcdef" && a[3] === false),
      gone: !/Made 2026-10-13/.test(text(mainHtml())) });
  });
  await leg("ti26 on a Polish desk the words are Polish and none is left in English", async () => {
    const pl = loadPage({ api, uiLang: "pl" }), Q2 = pl.page;
    Object.assign(Q2.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    answer = page({ folder: RELAY_DIR, requests: [ASKV, ASKX] });
    await Q2.desksLoad();
    const t = text(pl.node("#main").innerHTML);
    return facts("ti26", { polish: /Prośby o dołączenie/.test(t) && /Członkowie/.test(t) && /Zaproszenia/.test(t) && /z zaproszenia/.test(t)
        && /To zaproszenie wygasło\./.test(t) && /Ważne do/.test(t),
      noEnglish: !/Asking to join|Members|Invitations|by invitation|Valid until|has expired|checks out/.test(t) });
  });

  /* ---- ti33, ti34: the person's name, in the book only, and the relay row in both languages (slice 3, item 7) ------- */
  await leg("ti33 the person's name is kept in this Studio's invitation book and is not in the invitation document", async () => {
    const target = await S.inviteTarget(PROJ, keyAt);
    const secret = I.newSecret();
    const m = I.makeInvite(target, "Mira Lantern", secret, Date.now(), undefined, SAMPLE_RELAY);
    K.keepInvite(TEAMS, VAULT, target.team, { id: m.id, secret, made: m.made, expires: m.expires, name: m.name, person: "Piotr Quay" });
    const row = K.invitesOf(TEAMS, target.team).find((i) => i.id === m.id) || {};
    const doc = JSON.parse(Buffer.from(m.blob.slice("etiuda-join:".length), "base64url").toString("utf8"));
    const link = typeof m.link === "string" ? m.link : "";
    const bookHas = row.person === "Piotr Quay";
    const notInLink = doc.person === undefined && JSON.stringify(doc).indexOf("Piotr Quay") < 0 && link.indexOf("Piotr") < 0;
    return facts("ti33", { bookHas, notInLink });
  });
  await leg("ti34 a relay invitation's row names the person, when it was made, when it ends, the relay's first use and the"
    + " desk's own name, in English and in Polish, and shows no check code", async () => {
    const usedAt = Date.parse("2026-10-18T14:05:00.000Z");
    answer = page({ invites: [{ id: "0123456789abcdef", name: "Mira Lantern", person: "Piotr Quay",
      made: "2026-10-13T08:00:00.000Z", expires: "2026-10-20T08:00:00.000Z", code: "04913",
      relay: true, used: usedAt, deskName: "Desk Nine" }] });
    const when = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}";
    const en = loadPage({ api, uiLang: "en" });
    Object.assign(en.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    await en.page.desksLoad();
    const te = text(en.node("#main").innerHTML);
    const enOk = /Piotr Quay/.test(te) && new RegExp("Made " + when).test(te) && new RegExp("Valid until " + when).test(te)
      && new RegExp("The relay says it was first used at " + when).test(te)
      && /The teammate's own name: Desk Nine/.test(te) && te.indexOf("04913") < 0;
    const pl = loadPage({ api, uiLang: "pl" });
    Object.assign(pl.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    await pl.page.desksLoad();
    const tp = text(pl.node("#main").innerHTML);
    const plOk = /Piotr Quay/.test(tp) && new RegExp("Wystawione " + when).test(tp) && new RegExp("Ważne do " + when).test(tp)
      && /Według przekaźnika pierwsze użycie:/.test(tp) && /Nazwa podana przez członka zespołu: Desk Nine/.test(tp)
      && !/The relay says|The desk's own name|check code|Made |Valid until/.test(tp);
    return facts("ti34", { enOk, plOk });
  });
  await leg("ti35 on a relay team with no invitation open the Desks pane shows the relay invitation sentence, no Automatic joining switch, and W3's sentence; a folder team shows neither Invitations nor Automatic joining", async () => {
    const relayMirror = "C:\\data\\relay\\0123456789abcdef0123456789abcdef";
    answer = page({ folder: relayMirror, invites: [] });
    const en = loadPage({ api, uiLang: "en" });
    Object.assign(en.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    await en.page.desksLoad();
    const te = text(en.node("#main").innerHTML);

    const pl = loadPage({ api, uiLang: "pl" });
    Object.assign(pl.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    await pl.page.desksLoad();
    const tp = text(pl.node("#main").innerHTML);

    answer = page({ folder: "C:\\share", invites: [] });
    const enFolder = loadPage({ api, uiLang: "en" });
    Object.assign(enFolder.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    await enFolder.page.desksLoad();
    const tf = text(enFolder.node("#main").innerHTML);

    const w3En = "On the relay a teammate joins only with an invitation. It is let in by itself once this Studio sees its request; a request without an invitation is never let in.";
    const w3Pl = "Przez przekaźnik do zespołu dołącza się tylko z zaproszeniem. Wpuszczenie następuje samo, gdy to Studio zobaczy prośbę; prośba bez zaproszenia nigdy nie zostanie przyjęta.";

    const relayEnOk = te.includes("Each invitation lets one teammate in, until the time beside it.")
      && !te.includes("When someone pastes it, read them its check code.")
      && !te.includes("Automatic joining")
      && !/data-act="team-auto"/.test(en.node("#main").innerHTML)
      && te.includes(w3En);

    const relayPlOk = !tp.includes("Samoczynne dołączanie")
      && !/data-act="team-auto"/.test(pl.node("#main").innerHTML)
      && tp.includes(w3Pl);

    const folderOk = !tf.includes("Invitations")
      && !/data-act="invite-new"/.test(enFolder.node("#main").innerHTML)
      && !tf.includes("Automatic joining")
      && !/data-act="team-auto"/.test(enFolder.node("#main").innerHTML)
      && !tf.includes(w3En);

    return facts("ti35", { relayEnOk, relayPlOk, folderOk });
  });

  /* ---- the lead's book in the team file (board 945 item 8) ------------------------------------------------------- */
  let Lead = null;
  try { Lead = await import("../src/lead-book.mjs"); } catch { Lead = null; }
  const askJoin = (share, teamId, inv) => {
    const Jr = Engine.joinRules();
    const k = crypto.generateKeyPairSync("ed25519");
    const raw = (x) => x.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    const pub = raw(k.publicKey), id = Jr.branchIdOf(pub), box = raw(crypto.generateKeyPairSync("x25519").publicKey);
    const commit = Jr.joinCommit(teamId, pub, box, crypto.randomBytes(32).toString("hex"));
    const doc = { format: 1, kind: Jr.JOIN_KIND, team: teamId, desk: { id, key: pub, box, name: "Second desk", kind: "desk" },
      date: "2026-10-29T09:00:00.000Z", commit };
    if (inv) doc.invite = { id: inv.id, proof: Engine.inviteRules().memberProof(inv.secret, commit) };
    doc.sig = { alg: "Ed25519", keyId: id };
    doc.sig.value = crypto.sign(null, Jr.joinSignedBytes(doc), k.privateKey).toString("hex");
    fs.mkdirSync(path.join(share, "desks", id), { recursive: true });
    fs.writeFileSync(path.join(share, "desks", id, "join.json"), JSON.stringify(doc));
    return id;
  };
  const freshTeam = async (dir) => {
    fs.mkdirSync(dir, { recursive: true });
    const id = "t-" + crypto.randomBytes(8).toString("hex"), key = crypto.randomBytes(32);
    let madeTeam = T.newTeam({ id, catalogs: ["lamp-shop"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true });
    madeTeam = T.withRecovery(madeTeam, key, T.recoveryOf(keyAt, PASS));
    madeTeam = (await T.writeTeam(dir, madeTeam, { key: keyAt, passphrase: PASS })).team;
    return { id, key, team: madeTeam, dir };
  };
  const keepMade = (file, teamId, dir) => {
    const target = { team: teamId, folder: dir, lead: { keyId: lead.keyId, public: lead.public } };
    const secret = I.newSecret(), madeInv = makeFolderInvite(target, "Mira Lantern", secret, Date.now());
    K.keepInvite(file, VAULT, teamId, { id: madeInv.id, secret, made: madeInv.made, expires: madeInv.expires, name: madeInv.name });
    return { secret, made: madeInv };
  };

  await leg("ti36 an invitation made on one Studio is kept by another after it reads the team file on a folder, and that folder admits nobody (was: and admitted by it; ti37 holds the relay's)", async () => {
    if (!Lead) return false;
    const dir = path.join(SCRATCH, "f8-folder"), udA = path.join(SCRATCH, "f8-a"), udB = path.join(SCRATCH, "f8-b");
    fs.mkdirSync(udA, { recursive: true }); fs.mkdirSync(udB, { recursive: true });
    const made = await freshTeam(dir), fileA = K.teamsFile(udA), fileB = K.teamsFile(udB);
    K.keepTeamKey(fileA, VAULT, made.id, 1, made.key);
    K.chooseSealed(fileA, made.id, true, dir, made.team);
    const inv = keepMade(fileA, made.id, dir);
    const heldA = await T.heldTeam(dir, { key: keyAt });
    const wrote = await Lead.publishLeadBook({ folder: dir, team: heldA.team, keyFile: keyAt, secret: PASS,
      teamsFile: fileA, vault: VAULT, teamKey: made.key, now: Date.now() });
    const text = fs.readFileSync(T.teamPath(dir), "utf8");
    K.keepTeamKey(fileB, VAULT, made.id, 1, made.key);
    const read = await T.readTeam(dir);
    await Lead.absorbLeadBook({ team: read.team, keyFile: keyAt, secret: PASS, teamsFile: fileB, vault: VAULT, folder: dir, now: Date.now() });
    const book = K.inviteBookOf(fileB, VAULT);
    const desk = askJoin(dir, made.id, { id: inv.made.id, secret: book[inv.made.id] && book[inv.made.id].secret });
    const admitted = await S.watchAdmit(dir, keyAt, PASS, { teamKeys: K.teamKeysOf(fileB, VAULT), invites: book, teamsFile: fileB });
    const f = { rev: wrote.team.rev > made.team.rev, sealed: text.indexOf(inv.secret) < 0 && text.indexOf("leadBook") >= 0,
      secret: book[inv.made.id] && book[inv.made.id].secret === inv.secret, admitted: admitted.admitted.length === 0 && admitted.reason === "folder" && !!desk };
    return facts("ti36", f);
  });

  await leg("ti37 an invitation made on one Studio is admitted by another after the relay stand-in carries the team file", async () => {
    if (!Lead) return false;
    const { relayWorld, makeVault, placeGrant, GRANT_ROOTS } = await import("./relay-lab.mjs");
    const Relay = await import("../src/relay.mjs");
    const world = await relayWorld();
    const lab = path.join(SCRATCH, "f8-relay"), ud = path.join(lab, "a-ud"), udB = path.join(lab, "b-ud");
    fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(udB, { recursive: true });
    const keyFile = path.join(ud, "key.json");
    fs.copyFileSync(keyAt, keyFile);
    placeGrant(keyFile, lead.public);
    const vault = makeVault(), teamsFile = K.teamsFile(ud), rt = Relay.relayId();
    const teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32);
    K.keepTeamKey(teamsFile, vault, teamId, 1, teamKey);
    const mirror = K.keepRelay(teamsFile, teamId, rt, Relay.RELAY_URL);
    let relayTeam = T.newTeam({ id: teamId, catalogs: ["lamp-shop"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true });
    relayTeam = T.withChannel(relayTeam, { kind: "relay", rt, url: Relay.RELAY_URL }, { format: 1, kind: "etiuda-ring", keys: [] });
    relayTeam = T.withRecovery(relayTeam, teamKey, T.recoveryOf(keyFile, PASS));
    fs.mkdirSync(mirror, { recursive: true });
    relayTeam = (await T.writeTeam(mirror, relayTeam, { key: keyFile, passphrase: PASS })).team;
    const invSecret = I.newSecret();
    const relayInv = Relay.relayInvite(invSecret);
    const madeInv = I.makeInvite({ team: teamId, folder: mirror, lead: { keyId: lead.keyId, public: lead.public } }, "Mira Lantern", invSecret, Date.now(),
      undefined, { rt, url: Relay.RELAY_URL, token: relayInv.token, inv: relayInv.inv });
    K.keepInvite(teamsFile, vault, teamId, { id: madeInv.id, secret: invSecret, made: madeInv.made, expires: madeInv.expires,
      name: madeInv.name, person: "Quay", relay: relayInv });
    const heldA = await T.heldTeam(mirror, { key: keyFile });
    const beforeRev = heldA.team.rev;
    await Lead.publishLeadBook({ folder: mirror, team: heldA.team, keyFile, secret: PASS, teamsFile, vault, teamKey, now: Date.now() });
    const transport = world.transport("f8a");
    const runner = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile, vault, keyFile, secret: () => PASS,
      request: transport.request, connect: transport.connect, watch: false, pollMs: 1e9 });
    let runnerB = null;
    try {
      await runner.sync(); await runner.idle();
      const bKey = path.join(udB, "key.json");
      fs.copyFileSync(keyFile, bKey);
      placeGrant(bKey, lead.public);
      const bFile = K.teamsFile(udB);
      K.keepTeamKey(bFile, vault, teamId, 1, teamKey);
      const bMirror = K.keepRelay(bFile, teamId, rt, Relay.RELAY_URL);
      fs.mkdirSync(bMirror, { recursive: true });
      const transportB = world.transport("f8b");
      runnerB = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile: bFile, vault, keyFile: bKey, secret: () => PASS,
        request: transportB.request, connect: transportB.connect, watch: false, pollMs: 1e9 });
      await runnerB.sync(); await runnerB.idle();
      const carried = fs.existsSync(path.join(bMirror, "etiuda-team.json")) ? fs.readFileSync(path.join(bMirror, "etiuda-team.json"), "utf8") : "";
      /* The stand-in's bucket keeps the bytes it was given, which are not the team file in the clear. What B reads is
         the file its own runner stored, and a bucket object that holds the invitation secret in the clear fails the leg. */
      for (const obj of world.R.bucket.objects.values()) {
        const blob = Buffer.from(obj).toString("utf8");
        if (blob.indexOf(invSecret) >= 0) return facts("ti37", { clear: false });
      }
      if (!carried) return facts("ti37", { carried: false });
      const read = await T.readTeam(bMirror);
      await Lead.absorbLeadBook({ team: read.team, keyFile: bKey, secret: PASS, teamsFile: bFile, vault, folder: bMirror, now: Date.now() });
      const book = K.inviteBookOf(bFile, vault);
      const got = book[madeInv.id] && book[madeInv.id].secret;
      const desk = got ? askJoin(bMirror, teamId, { id: madeInv.id, secret: got }) : "";
      const admitted = got ? await S.watchAdmit(bMirror, bKey, PASS, { teamKeys: K.teamKeysOf(bFile, vault), invites: book, teamsFile: bFile }) : { admitted: [] };
      const onRelay = K.relayInvitesOf(bFile, vault, teamId).find((row) => row.id === madeInv.id);
      return facts("ti37", { carriedBook: carried.indexOf("leadBook") >= 0 && carried.indexOf(teamId) >= 0,
        secret: got === invSecret && carried.indexOf(invSecret) < 0,
        rev: read.team && read.team.rev > beforeRev, token: !!(onRelay && onRelay.token === relayInv.token),
        admitted: admitted.admitted.join() === desk });
    } finally {
      try { await runner.stop(); } catch { /* already down */ }
      if (runnerB) { try { await runnerB.stop(); } catch { /* already down */ } }
    }
  });

  await leg("ti38 a withdrawal is not undone by an older live record, and the older computer takes the withdrawal", async () => {
    if (!Lead) return false;
    const dir = path.join(SCRATCH, "f8-withdraw"), udA = path.join(SCRATCH, "f8-wa"), udB = path.join(SCRATCH, "f8-wb");
    fs.mkdirSync(udA, { recursive: true }); fs.mkdirSync(udB, { recursive: true });
    const made = await freshTeam(dir), fileA = K.teamsFile(udA), fileB = K.teamsFile(udB);
    K.keepTeamKey(fileA, VAULT, made.id, 1, made.key); K.keepTeamKey(fileB, VAULT, made.id, 1, made.key);
    const inv = keepMade(fileA, made.id, dir);
    let heldA = await T.heldTeam(dir, { key: keyAt });
    await Lead.publishLeadBook({ folder: dir, team: heldA.team, keyFile: keyAt, secret: PASS, teamsFile: fileA, vault: VAULT, teamKey: made.key, now: Date.now() });
    let read = await T.readTeam(dir);
    await Lead.absorbLeadBook({ team: read.team, keyFile: keyAt, secret: PASS, teamsFile: fileB, vault: VAULT, folder: dir, now: Date.now() });
    const older = JSON.parse(JSON.stringify(read.team));
    K.endInvite(fileA, made.id, inv.made.id, "withdrawn");
    heldA = await T.heldTeam(dir, { key: keyAt });
    await Lead.publishLeadBook({ folder: dir, team: heldA.team, keyFile: keyAt, secret: PASS, teamsFile: fileA, vault: VAULT, teamKey: made.key, now: Date.now() });
    read = await T.readTeam(dir);
    await Lead.absorbLeadBook({ team: read.team, keyFile: keyAt, secret: PASS, teamsFile: fileB, vault: VAULT, folder: dir, now: Date.now() });
    const bState = (K.invitesOf(fileB, made.id).find((row) => row.id === inv.made.id) || {}).state;
    await Lead.absorbLeadBook({ team: older, keyFile: keyAt, secret: PASS, teamsFile: fileA, vault: VAULT, folder: dir, now: Date.now() });
    const aState = (K.invitesOf(fileA, made.id).find((row) => row.id === inv.made.id) || {}).state;
    return facts("ti38", { b: bState === "withdrawn", a: aState === "withdrawn" });
  });

  await leg("ti40 a team file with a recovery copy and no lead book changes nothing, and the team key still opens", async () => {
    if (!Lead) return false;
    const dir = path.join(SCRATCH, "f8-old"), udB = path.join(SCRATCH, "f8-old-b");
    fs.mkdirSync(udB, { recursive: true });
    const made = await freshTeam(dir), fileB = K.teamsFile(udB);
    K.keepTeamKey(fileB, VAULT, made.id, 1, made.key);
    const inv = keepMade(fileB, made.id, dir);
    const before = JSON.stringify(K.invitesOf(fileB, made.id));
    const read = await T.readTeam(dir);
    const opened = T.openRecovery(read.team, T.recoveryOf(keyAt, PASS));
    const applied = await Lead.absorbLeadBook({ team: read.team, keyFile: keyAt, secret: PASS, teamsFile: fileB, vault: VAULT, folder: dir, now: Date.now() });
    const after = JSON.stringify(K.invitesOf(fileB, made.id));
    return facts("ti40", { key: !!(opened && opened.equals(made.key)), noBook: !read.team.leadBook,
      same: before === after && (K.invitesOf(fileB, made.id).find((row) => row.id === inv.made.id) || {}).state === "live",
      opened: applied.opened === true && applied.book === false });
  });

  await leg("ti41 two computers that each made an invitation keep both, and a handled id and an unopened copy unite", async () => {
    if (!Lead) return false;
    const dir = path.join(SCRATCH, "f8-both"), udA = path.join(SCRATCH, "f8-ba"), udB = path.join(SCRATCH, "f8-bb");
    fs.mkdirSync(udA, { recursive: true }); fs.mkdirSync(udB, { recursive: true });
    const made = await freshTeam(dir), fileA = K.teamsFile(udA), fileB = K.teamsFile(udB);
    K.keepTeamKey(fileA, VAULT, made.id, 1, made.key); K.keepTeamKey(fileB, VAULT, made.id, 1, made.key);
    const invA = keepMade(fileA, made.id, dir);
    const ledgerA = { desks: {}, done: { "ask-a": true }, unopened: { "ask-u": { sha256: "ab".repeat(32), desk: "k-" + "cd".repeat(8) } } };
    let heldA = await T.heldTeam(dir, { key: keyAt });
    await Lead.publishLeadBook({ folder: dir, team: heldA.team, keyFile: keyAt, secret: PASS, teamsFile: fileA, vault: VAULT,
      teamKey: made.key, ledger: ledgerA, now: Date.now() });
    const read = await T.readTeam(dir);
    const ledgerB = { desks: {}, done: { "ask-b": true }, unopened: {} };
    await Lead.absorbLeadBook({ team: read.team, keyFile: keyAt, secret: PASS, teamsFile: fileB, vault: VAULT, folder: dir, ledger: ledgerB, now: Date.now() });
    const invB = keepMade(fileB, made.id, dir);
    const heldB = await T.heldTeam(dir, { key: keyAt });
    await Lead.publishLeadBook({ folder: dir, team: heldB.team, keyFile: keyAt, secret: PASS, teamsFile: fileB, vault: VAULT,
      teamKey: made.key, ledger: ledgerB, now: Date.now() });
    const again = await T.readTeam(dir);
    await Lead.absorbLeadBook({ team: again.team, keyFile: keyAt, secret: PASS, teamsFile: fileA, vault: VAULT, folder: dir, ledger: ledgerA, now: Date.now() });
    const idsA = K.invitesOf(fileA, made.id).map((row) => row.id).sort();
    const idsB = K.invitesOf(fileB, made.id).map((row) => row.id).sort();
    const want = [invA.made.id, invB.made.id].sort();
    const book = Lead.openLeadBook(again.team, T.recoveryOf(keyAt, PASS));
    return facts("ti41", { both: idsA.join() === want.join() && idsB.join() === want.join(),
      done: ledgerA.done["ask-a"] === true && ledgerA.done["ask-b"] === true && ledgerB.done["ask-a"] === true && ledgerB.done["ask-b"] === true,
      unopened: ledgerB.unopened["ask-u"] && ledgerB.unopened["ask-u"].sha256 === "ab".repeat(32),
      carried: book && book.handled.indexOf("ask-a") >= 0 && book.handled.indexOf("ask-b") >= 0 });
  });

  await leg("ti42 the sealed book keeps 64 invitations, 64 removals and 256 handled ids, dropping expired then spent then withdrawn then the oldest live, the oldest removal, and handled ids before unopened copies", async () => {
    if (!Lead) return false;
    const now = Date.parse("2026-10-29T12:00:00.000Z"), live = [], invites = {};
    for (let n = 0; n < 65; n++) {
      const id = n.toString(16).padStart(16, "0");
      live.push(id);
      invites[id] = { made: new Date(now - (65 - n) * 1000).toISOString(), expires: "2026-11-05T12:00:00.000Z", state: "live", secret: "ab".repeat(16) };
    }
    invites["ee".repeat(8)] = { made: "2026-10-01T00:00:00.000Z", expires: "2026-10-08T00:00:00.000Z", state: "live" };
    invites["ss".repeat(8)] = { made: "2026-10-02T00:00:00.000Z", expires: "2026-11-01T00:00:00.000Z", state: "spent" };
    invites["ww".repeat(8)] = { made: "2026-10-03T00:00:00.000Z", expires: "2026-11-01T00:00:00.000Z", state: "withdrawn" };
    const removed = {};
    for (let n = 0; n < 65; n++) removed["k-" + n.toString(16).padStart(16, "0")] = { key: "cd".repeat(32), at: n, epoch: 2, files: {} };
    const handled = [], unopened = [];
    for (let n = 0; n < 200; n++) handled.push("h" + String(n).padStart(4, "0"));
    for (let n = 0; n < 80; n++) unopened.push({ id: "u" + String(n).padStart(4, "0"), sha256: "ef".repeat(32) });
    const shaped = Lead.shapeBook({ v: 1, invites, removed, handled, unopened }, now);
    const few = [], many = [];
    for (let n = 0; n < 10; n++) few.push("h" + String(n).padStart(4, "0"));
    for (let n = 0; n < 260; n++) many.push({ id: "u" + String(n).padStart(4, "0"), sha256: "ef".repeat(32) });
    const spilled = Lead.shapeBook({ v: 1, invites: {}, removed: {}, handled: few, unopened: many }, now);
    const ids = Object.keys(shaped.invites);
    return facts("ti42", { invites: ids.length === Lead.MAX_INVITES && ids.indexOf("ee".repeat(8)) < 0 && ids.indexOf("ss".repeat(8)) < 0
      && ids.indexOf("ww".repeat(8)) < 0 && ids.indexOf(live[0]) < 0 && ids.indexOf(live[64]) >= 0,
      removed: Object.keys(shaped.removed).length === Lead.MAX_REMOVED && !shaped.removed["k-" + "0".padStart(16, "0")]
        && !!shaped.removed["k-" + (64).toString(16).padStart(16, "0")],
      handled: shaped.handled.length === 176 && shaped.handled[0] === "h0024" && shaped.unopened.length === 80
        && shaped.unopened[0].id === "u0000",
      unopened: spilled.handled.length === 0 && spilled.unopened.length === 256 && spilled.unopened[0].id === "u0004" });
  });

  if (PLANTS_OFF) skip("ti43 removing the seal line on a scratch copy of the book leaves the invitation unreadable, and the checkout's file is unchanged (ETIUDA_PLANTS=off)");
  else await leg("ti43 removing the seal line on a scratch copy of the book leaves the invitation unreadable, and the checkout's file is unchanged", async () => {
    if (!Lead) return false;
    const srcPath = path.join(ROOT, "src", "lead-book.mjs");
    const before = crypto.createHash("sha256").update(fs.readFileSync(srcPath)).digest("hex");
    const src = fs.readFileSync(srcPath, "utf8");
    const cut = src.replace(/\r?\n[^\n]*plant:f8-seal[^\n]*/g, "\n");
    if (cut === src || cut.indexOf("plant:f8-seal") >= 0) return facts("ti43", { marked: false });
    const rewritten = cut.replace(/from "(\.\/[^"]+)"/g, (m, rel) => "from " + JSON.stringify(pathToFileURL(path.resolve(path.join(ROOT, "src"), rel)).href));
    const at = path.join(SCRATCH, "lead-book-cut.mjs");
    fs.writeFileSync(at, rewritten);
    const bad = await import(pathToFileURL(at).href);
    const dir = path.join(SCRATCH, "f8-plant"), udA = path.join(SCRATCH, "f8-pa"), udB = path.join(SCRATCH, "f8-pb");
    fs.mkdirSync(udA, { recursive: true }); fs.mkdirSync(udB, { recursive: true });
    const made = await freshTeam(dir), fileA = K.teamsFile(udA), fileB = K.teamsFile(udB);
    K.keepTeamKey(fileA, VAULT, made.id, 1, made.key); K.keepTeamKey(fileB, VAULT, made.id, 1, made.key);
    const inv = keepMade(fileA, made.id, dir);
    const heldA = await T.heldTeam(dir, { key: keyAt });
    const payload = { v: 1, invites: { [inv.made.id]: { made: inv.made.made, expires: inv.made.expires,
      state: "live", secret: inv.secret, name: "Mira Lantern" } }, removed: {}, handled: [], unopened: [] };
    bad.sealLeadBook(heldA.team, T.recoveryOf(keyAt, PASS), payload);
    await T.writeTeam(dir, heldA.team, { key: keyAt, passphrase: PASS });
    const read = await T.readTeam(dir);
    const opened = Lead.openLeadBook(read.team, T.recoveryOf(keyAt, PASS));
    await Lead.absorbLeadBook({ team: read.team, keyFile: keyAt, secret: PASS, teamsFile: fileB, vault: VAULT, folder: dir, now: Date.now() });
    const book = K.inviteBookOf(fileB, VAULT);
    const desk = askJoin(dir, made.id, { id: inv.made.id, secret: inv.secret });
    const admitted = await S.watchAdmit(dir, keyAt, PASS, { teamKeys: K.teamKeysOf(fileB, VAULT), invites: book, teamsFile: fileB });
    const after = crypto.createHash("sha256").update(fs.readFileSync(srcPath)).digest("hex");
    return facts("ti43", { dark: opened === null && !book[inv.made.id], notAdmitted: admitted.admitted.indexOf(desk) < 0, same: before === after });
  });

  for (const id of Object.keys(FD7)) {
    try { await FD7[id](); } catch (e) { check(false, id + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); }
  }
  copyPlants({ root: ROOT, self: SELF, label: "team-invite", onlyVar: "TEAM_INVITE_ONLY", plants: FD7_PLANTS, check, skip });

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "tests/team-invite.mjs");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
  if (asserted + skipped < EXPECTED) { process.stdout.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + NL); process.exit(78); }
  process.stdout.write("team-invite  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write("team-invite: " + (e && e.stack || e) + NL);
  process.exit(2);
});
