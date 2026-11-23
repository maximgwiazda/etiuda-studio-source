import "./reg-stand-on.mjs";
import "./licensed-env.mjs"; /* a publish with no licence refuses since fold 87 (S-2): the stand publishes as a paying lead */
/* A MEMBER'S DESK READING A CATALOG STUDIO PUBLISHED FROM AN IMPORT (board class B, the grew drop).
 *
 * Not a leg: tests/catalog-use.mjs 890sq calls it. It makes Studio's two import starts (copy-import, landCatalog; a teammate's desk
 * file by hand, upgradeLand), publishes each as a team's catalog, then loads the PINNED desk's own shell/main.js in this process
 * (the pattern of tests/team-join.mjs, a stand-in for Electron, the team file in the desk's relay mirror) as a
 * member of a team that lists that catalog, hands it the edition and reports what the desk judges.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile, readKeyFile, unlockKey } from "../src/sign.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PINNED = path.join(ROOT, "engine", "pinned");
const nodeRequire = createRequire(import.meta.url);
const PASS = "a passphrase for the lead's key in this gate";
const CARD = "The quay lamp is wrapped for the crossing.";
const EXPOSE = ["wrapTeamKey", "offerFile", "teamUse", "askSignedBytes", "signedSha", "teamListedDoc", "chainListed",
  "branchGate", "idListedHere", "lineageOf", "deskDocNow", "catalogDocIn", "privateHere", "catalogMarkedPrivate"];
const J = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const pubHex = (k) => k.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");

/* What Studio makes of the two starts, each published once, unsealed, signed by `keyAt`'s key. Returns the published editions. */
export async function publishedFromImports(scratch, S, keyAt, open) {
  const D = Engine.deskRules();
  const EN = [{ code: "en", name: "English" }];
  const root = path.join(scratch, "projects"), share0 = path.join(scratch, "share0");
  fs.mkdirSync(root, { recursive: true }); fs.mkdirSync(share0, { recursive: true });
  const O = await S.newProject(root, "Quay source", EN);
  const sh = await S.addTag(O.dir, "shelf", { en: "General" });
  await S.addCard(O.dir, (sh.tag || sh).id, "Lamp", CARD);
  const oPub = await S.publishProject(O.dir, { folder: share0, notes: "o", key: keyAt, passphrase: PASS });
  const oEd = J(oPub.ec);
  const out = {};
  const publish = async (tag, dir) => {
    const share = path.join(scratch, "pub-" + tag); fs.mkdirSync(share, { recursive: true });
    const r = await S.publishProject(dir, { folder: share, key: keyAt, passphrase: PASS, notes: tag, now: "2026-11-19T10:00:00.000Z" });
    const ed = J(path.join(r.archive, "catalog.ec"));
    const at = path.join(scratch, "edition-" + tag + ".ec");
    fs.copyFileSync(path.join(r.archive, "catalog.ec"), at);
    return { id: ed.id, grew: ed.grew || null, at };
  };
  /* (a) copy-import: a member's desk copy of O, landed as a new project */
  const dk = crypto.generateKeyPairSync("ed25519");
  const copy = JSON.parse(JSON.stringify(oEd)); delete copy.sig;
  copy.id = "mira-ab12cd34"; copy.rev = 1;
  copy.grew = { id: oEd.id, rev: oEd.rev, sha: D.signedSha(oEd) };
  copy.desk = { id: "d-" + "1".repeat(16), key: pubHex(dk.publicKey), box: "00".repeat(32) };
  const a = await S.landCatalog(root, copy, path.join(scratch, "tmp-copy"), { title: "Mira copy", desk: "Mira", lang: "en" });
  out.copyImport = await publish("copy-import", a.dir);
  /* (b) a teammate's genuine desk file imported by hand */
  const tk = crypto.generateKeyPairSync("ed25519");
  const tpub = pubHex(tk.publicKey), did = D.branchIdOf(tpub);
  const g = JSON.parse(JSON.stringify(oEd)); delete g.sig; delete g.hash;
  g.id = did + "-0a1b2c3d"; g.rev = 1; g.grew = { id: oEd.id, rev: oEd.rev, sha: D.signedSha(oEd) };
  g.desk = { id: did, key: tpub, box: "00".repeat(32) };
  g.sig = { alg: "Ed25519", keyId: did };
  g.sig.value = crypto.sign(null, D.branchSignedBytes(g), tk.privateKey).toString("hex");
  const f = path.join(scratch, "teammate-desk.ec"); fs.writeFileSync(f, JSON.stringify(g, null, 1));
  const b = await S.upgradeLand(root, f, "Teammate desk file");
  out.upgradeLand = await publish("upgrade-land", b.dir);
  return out;
}

/* The pinned desk, loaded over its own user-data folder; returns its handles. */
function loadDesk(app, ud) {
  const noop = () => {}, on = {}, invoke = {}, sent = [];
  const inert = new Proxy(function () {}, { get: () => inert, set: () => true, apply: () => undefined });
  const electron = {
    app: { getPath: () => ud, setPath: noop, requestSingleInstanceLock: () => false, quit: noop, on: noop, getVersion: () => "0.0.0",
      whenReady: () => new Promise(noop), commandLine: { appendSwitch: noop } },
    ipcMain: { on: (ch, fn) => { on[ch] = fn; }, handle: (ch, fn) => { invoke[ch] = fn; } },
    BrowserWindow: inert, Menu: inert, dialog: inert, net: inert, protocol: inert, session: inert, shell: inert,
    screen: inert, systemPreferences: inert, nativeTheme: { themeSource: "system" },
    safeStorage: { isEncryptionAvailable: () => true,
      encryptString: s => Buffer.from(Buffer.from(String(s), "utf8").map(b => b ^ 0x5a)),
      decryptString: b => Buffer.from(Buffer.from(b).map(x => x ^ 0x5a)).toString("utf8") },
  };
  const src = fs.readFileSync(path.join(app, "shell", "main.js"), "utf8");
  process.env.XDG_CURRENT_DESKTOP = "GNOME";
  const api = new Function("require", "__dirname", "__filename", "module", "exports", "console",
    src + "\nreturn { loadedNow: () => loadedText, " + EXPOSE.map(n => n + ": typeof " + n + " === 'undefined' ? undefined : " + n).join(", ") + " };")(
    n => (n === "electron" ? electron : nodeRequire(n)), path.join(app, "shell"), path.join(app, "shell", "main.js"),
    { exports: {} }, {}, { log: noop, error: noop, warn: noop, info: noop });
  const event = { sender: { id: 1, once: noop }, senderFrame: { parent: null, url: "file:///C:/lab/engine/etiuda.html" } };
  const win = { isDestroyed: () => false, webContents: { send: (...a) => sent.push(a) } };
  return {
    api, win, sent,
    ask: (ch, ...a) => Promise.resolve(invoke[ch](event, ...a)),
    sync: (ch, ...a) => { const ev = Object.assign({ returnValue: undefined }, event); if (on[ch]) on[ch](ev, ...a); return ev.returnValue; },
  };
}

/* The desk, a member of a team that lists `edition.id`, handed the edition: what it judges. */
export async function deskReads(scratch, tag, edition, keyAt, open) {
  const V2 = Engine.sigRules();
  const lab = path.join(scratch, "lab-" + tag), app = path.join(lab, "app");
  fs.mkdirSync(lab, { recursive: true });
  fs.cpSync(path.join(PINNED, "shell"), path.join(app, "shell"), { recursive: true });
  const ud = path.join(lab, "ud"); fs.mkdirSync(ud, { recursive: true });
  const LEAD = { keyId: open.keyId, public: open.public };
  /* A TEAM WORKS OVER THE RELAY ONLY (engine fold 131: no folder is read as a team). A desk that follows one is written as an invitation
     leaves it: desk.json pins the lead, names the relay and shows the team with the relay's mirror, <userData>/relay/<token>, as its
     folder; the signed team file, which carries the team's ring, is in that mirror. Was: the team file and a ring file in a shared folder,
     carried to the desk by the folder syncer, which a desk no longer runs for a team. */
  const team = "t-" + crypto.randomBytes(8).toString("hex"), key = crypto.randomBytes(32);
  const rt = crypto.createHash("sha256").update("relay-token\n" + team).digest("hex").slice(0, 32);
  const mirror = path.join(ud, "relay", rt);
  fs.mkdirSync(mirror, { recursive: true });
  fs.writeFileSync(path.join(ud, "desk.json"), JSON.stringify({ kind: "etiuda-desk", schema: 1,
    keys: { eCatalogFolder: path.join(lab, "own"), eUiLang: "en", eAgent: "North desk" },
    teamPins: { [team]: LEAD }, teamPinFrom: { [team]: "invite" },
    teamChannel: { [team]: { kind: "relay", rt, url: "https://etiuda.dev/relay/v1" } },
    teamShown: { [team]: { folder: mirror, relay: "etiuda.dev" } } }), "utf8");
  fs.mkdirSync(path.join(lab, "own"), { recursive: true });
  const D = loadDesk(app, ud);
  const leadBox = crypto.generateKeyPairSync("x25519");
  const sign = (doc) => {
    const o = JSON.parse(JSON.stringify(doc)); delete o.sig;
    o.sig = { alg: "Ed25519", keyId: LEAD.keyId };
    o.sig.value = crypto.sign(null, Buffer.from(V2.v2SignedBytes(o)), open.privateKey).toString("hex");
    return o;
  };
  const put = (name, t) => fs.writeFileSync(path.join(mirror, name), typeof t === "string" ? t : JSON.stringify(t), "utf8");
  const me = await D.ask("etiuda:branch-identity", true);
  const SWITCH = { format: 1, on: true, by: "Quay lead", at: "2026-11-01T09:00:00.000Z" };
  put("etiuda-team.json", JSON.stringify(sign({
    format: 1, kind: "etiuda-team", id: team, catalogs: [edition.id], lead: Object.assign({}, LEAD, { box: pubHex(leadBox.publicKey) }),
    sealed: true, exportsSealed: false, epoch: 1, content: SWITCH,
    channel: { kind: "relay", rt, url: "https://etiuda.dev/relay/v1" },
    ring: { format: 1, kind: "etiuda-ring", keys: [{ catalog: edition.id, keyId: LEAD.keyId, alg: "Ed25519", public: LEAD.public }] },
    roster: [{ desk: { id: me.id, key: me.key, box: me.box }, wrap: D.api.wrapTeamKey(key, me.box, team, 1, me.id) }],
  }), null, 1) + "\n");
  D.ask("etiuda:team-join", "content-said", team, SWITCH.at);
  D.sync("etiuda:catalog");
  const text = fs.readFileSync(edition.at, "utf8");
  const held = path.join(lab, "held"); fs.mkdirSync(held, { recursive: true });
  fs.writeFileSync(path.join(held, "held.ec"), text, "utf8");
  D.api.offerFile(D.win, path.join(held, "held.ec"));
  const off = D.sent.filter(a => a[0] === "etiuda:catalog-file").pop();
  const pin = D.api.signedSha(JSON.parse(off ? off[1] : text));
  D.sync("etiuda:catalog-taken", pin);
  const A = D.api, use = A.teamUse(), ed = JSON.parse(text), dd = A.deskDocNow();
  const loaded = A.loadedNow();
  let pasteText = "";
  try { pasteText = loaded ? JSON.parse(loaded).cards.map(c => (c.body && c.body.en) || "").join("|") : ""; } catch { pasteText = ""; }
  const gate = dd ? A.branchGate(dd) : null;
  return {
    member: !!use.member, listsId: Array.isArray(use.catalogs) && use.catalogs.indexOf(ed.id) >= 0,
    lineage: A.lineageOf(ed), chainListed: A.chainListed(ed, use.catalogs), teamListedDoc: A.teamListedDoc(ed, use),
    deskDocLineage: dd ? A.lineageOf(dd) : null, deskDocListed: dd ? A.teamListedDoc(dd, use) : null,
    gate, travels: !!gate && !gate.box && !gate.hold && !gate.none,
    idListedHere: A.idListedHere(ed.id), privateOffered: !A.idListedHere(ed.id),
    inUse: !!loaded, pasteText,
  };
}

export async function lead(scratch) {
  const keyAt = path.join(scratch, "lead-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const open = unlockKey(readKeyFile(keyAt), PASS);
  try { const L = await import("./relay-lab.mjs"); L.placeGrant(keyAt, open.public); } catch { /* a publish without a grant says so */ }
  return { keyAt, open };
}
export { CARD };
