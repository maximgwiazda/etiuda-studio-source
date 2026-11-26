/* STUDIO'S SIGNING KEY WITHOUT A PASSPHRASE, ITS BACKUP DISC AND REVIEW'S RING: node tests/studio-key.mjs.
 *
 * The rulings (the office's record of 2026-10-07): 20:42, the key kept by the operating system under the lead's own
 * sign-in, a passphrase only on an optional backup copy, Make a signing key in Settings and on the Desks screen (K1 with
 * K2); 20:45, G1, a small disc before a key's four groups that says whose; 21:10 and 21:38 to 22:18, the backup disc; 21:12,
 * Review rings once when its count rises; 21:19, Claudia's three findings (restore first on a new computer, one backup copy
 * brings the team key back too, the passphrase fields leave the covers).
 *
 * Node only, no window. What it holds:
 *   1  the library: a key file the operating system keeps opens only with the secret its vault opened, never with another
 *      key's, and says so; a backup copy is a passphrase file of the same key; the team's recovery copy opens with the
 *      signing key (P2), and a new epoch wraps it again under the key with nothing asked; a new team over another key's.
 *   2  the page, on tests/page-stand-in.mjs: the Settings row in its states, the key's two covers, the corner's backup disc
 *      and its ring, Review's single ring, and the G1 disc.
 *   3  the sheet: the disc's look as decided (L3, glyph C at 20 px), the ring ported from the desk, and the corner's room.
 *   4  the first key (the sense pass of 2026-10-14, finding 9): the cover says a publish with no key makes one and signs, or
 *      names the key a team at the folder trusts with Restore first; the landing after the key is made nudges towards a
 *      backup copy once; the Desks screen offers Sealed with no key where Sealed makes it. The shell's half is
 *      tests/shell-guards.mjs 19.
 * The shell's half (the vault, the secret handed to the thread, the backup and the restore) is tests/shell-guards.mjs 2q to
 * 2t; the Desks screen's is tests/team-desks.mjs 4. Window legs that read this: tests/settings-screen.mjs, tests/polish.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { olderFolderTeam } from "./older-folder-team.mjs"; /* the folder team is made by the fixture, not by Studio (the folder team's removal) */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "studio-key");
const EXPECTED = 29;
const NL = String.fromCharCode(10);
const NB = new RegExp(String.fromCharCode(160), "g");
const PASS = "a passphrase for this gate's backup copy";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); }
}
const throwsOn = async (fn) => { try { await fn(); return ""; } catch (e) { return String(e && e.message || e); } };
/* 2q's four spellings of a secret: the text handed in, its upper case, and the bytes as base64 and base64url. A hex secret's
   bytes are the key; any other secret's bytes are its own utf8. An empty spelling is not a hit. */
const spellingsOf = (secret) => {
  const s = String(secret == null ? "" : secret);
  const asHex = /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0;
  const bytes = Buffer.from(s, asHex ? "hex" : "utf8");
  return [s, s.toUpperCase(), bytes.toString("base64"), bytes.toString("base64url")];
};
const carries = (secret, text) => spellingsOf(secret).filter((x) => x && String(text).indexOf(x) >= 0).length;
/* The vault stood in, as the shell's safeStorage: a seal that is no spelling of what it sealed. */
const vault = { seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t)).reverse().toString("hex")),
  open: (b) => Buffer.from(String(Buffer.from(b)).slice(7), "hex").reverse().toString() };
const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m])
  .replace(/\s+/g, " ").trim();

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const Sg = await import("../src/sign.mjs");
  const T = await import("../src/team.mjs");
  const S = await import("../src/studio.mjs");

  /* ---- 1. the library ------------------------------------------------------------------------------------------- */
  /* Made here, outside any leg, so a tree without these functions fails each leg below rather than the file. */
  let pair = {}, other = {}, secret = "";
  const keyAt = path.join(SCRATCH, "signing-key.json");
  try {
    pair = await Sg.makePair(); other = await Sg.makePair();
    fs.writeFileSync(keyAt, JSON.stringify(Sg.osFile(pair, vault.seal(pair.der)), null, 1) + NL);
    secret = vault.open(Buffer.from(Sg.readKeyFile(keyAt).doc.private, "base64"));
  } catch (e) { process.stderr.write("  setup: " + String(e && e.message || e).slice(0, 160) + NL); }
  await leg("sk1a a key the operating system keeps is read as such, opens with the secret its vault opened and with no other"
    + " key's, and that refusal carries none of the other key's four spellings; it refuses an empty one, a secret that is not"
    + " a key, and one that is not hex, each in the sentence that says the sign-in does not hold it, with none of that"
    + " secret's four spellings in it", async () => {
    const read = Sg.readKeyFile(keyAt), open = Sg.unlockKey(read, secret);
    const notKey = "ab".repeat(48), plainSecret = "not a key!";
    const otherKey = await throwsOn(() => Sg.unlockKey(read, other.der)), none = await throwsOn(() => Sg.unlockKey(read, ""));
    const refused = await throwsOn(() => Sg.unlockKey(read, notKey));
    const plainRefusal = await throwsOn(() => Sg.unlockKey(read, plainSecret));
    const text0 = fs.readFileSync(keyAt, "utf8");
    return read.kept === "os" && open.public === pair.public && open.keyId === pair.keyId && /public half is not/.test(otherKey)
      && carries(other.der, otherKey) === 0
      && /sign-in on this computer does not hold it/.test(none)
      && /sign-in on this computer does not hold it/.test(refused) && carries(notKey, refused) === 0
      && /sign-in on this computer does not hold it/.test(plainRefusal) && carries(plainSecret, plainRefusal) === 0
      && text0.indexOf(pair.der) < 0
      && text0.indexOf(Buffer.from(pair.der, "hex").toString("base64")) < 0;
  });
  const copyAt = path.join(SCRATCH, "backup", "key-copy.json");
  fs.mkdirSync(path.dirname(copyAt), { recursive: true });
  await leg("sk1b a backup copy is the key's own passphrase file: read for its key with no passphrase, opened by it to the same"
    + " key, refused by another; a copy asked with no passphrase writes nothing, and a key file is no backup copy", async () => {
    const none = await throwsOn(() => S.backupKey(copyAt, keyAt, secret, ""));
    const nothing = !fs.existsSync(copyAt);
    const done = await S.backupKey(copyAt, keyAt, secret, PASS);
    const read = S.readBackup(copyAt), opened = S.openBackup(copyAt, PASS);
    const wrong = await throwsOn(() => S.openBackup(copyAt, PASS + " not"));
    const notCopy = await throwsOn(() => S.readBackup(keyAt));
    return /needs a passphrase/.test(none) && nothing && done.keyId === pair.keyId && read.print === done.print
      && /^[0-9a-f]{16}$/.test(read.print) && opened.der === pair.der && opened.public === pair.public
      && /does not open this copy/.test(wrong) && /is not such a copy/.test(notCopy) && Sg.readKeyFile(copyAt).kept === "passphrase";
  });
  await leg("sk1c the key's print is the 16 hex every desk compares, the same from the key file and from its backup copy", async () => {
    const sign = S.signingKey(keyAt);
    return sign.print === S.readBackup(copyAt).print && sign.kept === "os" && ("studio-" + sign.print) === Sg.keyIdFor(pair.public);
  });

  /* P2: the recovery copy under the signing key, and a new epoch asking nothing. */
  const SHARE = path.join(SCRATCH, "share"), HOME = path.join(SCRATCH, "projects");
  fs.mkdirSync(SHARE, { recursive: true });
  const proj = (await S.newProject(HOME, "Key gate", ["en"])).dir;
  S.setPublishFolder(proj, SHARE);
  const TID = "t-" + crypto.randomBytes(8).toString("hex"), K1 = crypto.randomBytes(32);
  await leg("sk1d P2: the switch writes the team's recovery copy under the signing key, which opens it to the team key; a"
    + " passphrase-wrapped copy of the same key opens it too, and another key does not", async () => {
    await olderFolderTeam(proj, { key: keyAt, passphrase: secret, teamId: TID, teamKeys: { [TID]: { 1: K1 } } });
    const team = (await T.heldTeam(SHARE, { key: keyAt })).team;
    const viaKey = T.openRecovery(team, T.recoveryOf(keyAt, secret)), viaCopy = T.openRecovery(team, T.recoveryOf(copyAt, PASS));
    const otherAt = path.join(SCRATCH, "other-key.json");
    fs.writeFileSync(otherAt, JSON.stringify(Sg.osFile(other, vault.seal(other.der))) + NL);
    const viaOther = T.openRecovery(team, T.recoveryOf(otherAt, other.der));
    return !!team && team.recovery !== undefined && !!viaKey && viaKey.equals(K1) && !!viaCopy && viaCopy.equals(K1) && viaOther === null;
  });
  await leg("sk1e removing a desk asks for nothing: a new epoch takes the signing key's secret, wraps the recovery copy again"
    + " under it, and that copy opens to the new epoch's key (red without the secret)", async () => {
    const team = (await T.heldTeam(SHARE, { key: keyAt })).team;
    const without = await throwsOn(() => T.newEpoch(team, { key: keyAt }));
    const next = await T.newEpoch(team, { key: keyAt, secret });
    const back = T.openRecovery(next.team, T.recoveryOf(keyAt, secret));
    return /wraps again under the signing key/.test(without) && next.team.epoch === 2 && !!back && back.equals(next.teamKey);
  });
  await leg("sk1f a Studio holding the signing key but not the team key gets it back from the recovery copy, and nothing where"
    + " it holds it already", async () => {
    const back = await S.teamKeyBack(proj, keyAt, secret, {}), held = await S.teamKeyBack(proj, keyAt, secret, { teamKeys: { [TID]: { 1: K1 } } });
    return !!back && back.id === TID && Buffer.from(back.key).equals(K1) && back.sealed === true && held === null;
  });
  await leg("sk1g K8's cost at a folder: with Fresh the switch is refused and writes nothing, over a whole team another key leads as over this"
    + " Studio's own; the folder's facts name the key its team trusts (was: with Fresh it wrote a new team over the other key's; a team at a folder is no longer written)", async () => {
    const otherShare = path.join(SCRATCH, "share-other"), otherAt = path.join(SCRATCH, "other-key.json");
    fs.mkdirSync(otherShare, { recursive: true });
    const p2 = (await S.newProject(HOME, "Key gate two", ["en"])).dir;
    S.setPublishFolder(p2, otherShare);
    const OT = "t-" + crypto.randomBytes(8).toString("hex");
    await olderFolderTeam(p2, { key: otherAt, passphrase: other.der, teamId: OT });
    const facts = await S.teamFacts(p2, { key: keyAt });
    const plain = await throwsOn(() => S.setTeamSealed(p2, true, { key: keyAt, passphrase: secret, teamId: "t-" + crypto.randomBytes(8).toString("hex") }));
    const NT = "t-" + crypto.randomBytes(8).toString("hex");
    const fresh = await throwsOn(() => S.setTeamSealed(p2, true, { key: keyAt, passphrase: secret, teamId: NT, fresh: true }));
    const now = (await T.heldTeam(otherShare, { key: otherAt })).team;
    const overOwn = await throwsOn(() => S.setTeamSealed(p2, true, { key: keyAt, passphrase: secret, teamId: "t-" + crypto.randomBytes(8).toString("hex"), fresh: true }));
    return facts.file === "theirs" && facts.lead === Sg.keyIdFor(other.public).slice(7) && /is not this Studio's own/.test(plain)
      && /makes a team on the Etiuda relay, not in a shared folder/.test(fresh) && !!now && now.id === OT && now.lead.public !== pair.public
      /* No team of this Studio's is at the folder to fresh over (was: the one Fresh had just written, refused with "is this Studio's own"), so the same sentence. */
      && /makes a team on the Etiuda relay, not in a shared folder/.test(overOwn);
  });

  /* ---- 2. the page ----------------------------------------------------------------------------------------------- */
  const { loadPage } = await import("./page-stand-in.mjs");
  const asked = [];
  let keyAnswer = null;
  const api = {
    keyMake: async () => { asked.push(["keyMake"]); return keyAnswer; },
    keyBackup: async (...a) => { asked.push(["keyBackup", ...a]); return keyAnswer; },
    keyRestorePick: async (...a) => { asked.push(["keyRestorePick", ...a]); return { error: null, file: "E:\\copy.json", print: "9a3a782d7f8ff25b" }; },
    keyRestore: async (...a) => { asked.push(["keyRestore", ...a]); return keyAnswer; },
    reveal: async (d) => { asked.push(["reveal", d]); return { error: null }; },
  };
  const home = loadPage({ api, uiLang: "en" }), P = home.page;
  Object.assign(P.S, { open: JSON.parse(JSON.stringify(await S.openProject(proj))), screen: "project", section: "cards", lang: "en" });
  const made = (o) => Object.assign({ file: "C:\\ud\\signing-key.json", name: "signing-key.json", keyId: "studio-9a3a782d7f8ff25b",
    public: "", print: "9a3a782d7f8ff25b", kept: "os", backup: null, admitted: 0, problem: null }, o || {});
  const row = (sign) => { P.S.host = { signing: sign }; return P.signingRowHtml(); };
  await leg("sk2a Settings with no key: no signing key yet, Restore a backup… beside Make a signing key, which is the solid one,"
    + " and one line on what the key is for", async () => {
    const h = row({ keyId: "", problem: null, file: "", name: "" });
    return /no signing key yet Restore a backup… Make a signing key The team trusts what Studio signs with it\./.test(text(h))
      && /class="btn sm solid" data-act="key-make"/.test(h) && /data-act="key-restore"/.test(h) && !/type="password"/.test(h);
  });
  await leg("sk2b Settings with the key: its four groups after Studio's disc, Show the file, and the two quiet lines, the second"
    + " offering a backup copy until one is made and then saying where and when, or that the key came from one", async () => {
    const a = row(made()), b = row(made({ backup: { keyId: "studio-9a3a782d7f8ff25b", made: "2026-10-08", where: "E:\\" } }));
    const c = row(made({ backup: { keyId: "studio-9a3a782d7f8ff25b", made: "2026-10-08", where: "E:\\", restored: true } }));
    return /9a3a 782d 7f8f f25b Show the file Set this key aside and make a new one Made\. This computer keeps it under your sign-in, so nothing asks for a passphrase\. A backup copy brings it to another computer\. Make a backup copy…/.test(text(a))
      && /class="kdisc" role="img" aria-label="Studio&#39;s signing key"/.test(a) && /data-act="key-backup"/.test(a) && /data-act="key-aside"/.test(a)
      && /A backup copy is in E:\\, made 2026-10-08\. Make another…/.test(text(b))
      && /Restored\. This computer keeps it under your sign-in\./.test(text(c)) && !/studio-9a3a/.test(a);
  });
  await leg("sk2c a key file that will not read says so in the row, and one that opens with a passphrase offers to restore it"
    + " once", async () => {
    const bad = row({ keyId: "", problem: "x", name: "signing-key.json" }), old = row(made({ kept: "passphrase" }));
    return /signing-key\.json is not a signing key this Studio can read/.test(text(bad)) && !/key-make/.test(bad)
      && /It opens with a passphrase\. Restore it once and this computer keeps it\. Restore a backup…/.test(text(old));
  });
  await leg("sk2d Make a signing key asks the shell once and the row shows what came back", async () => {
    P.S.host = { signing: { keyId: "", problem: null } };
    keyAnswer = made({ error: null });
    P.S.screen = "settings";
    await P.ACTS["key-make"]();
    P.S.screen = "project";
    return asked.filter((a) => a[0] === "keyMake").length === 1 && P.S.host.signing.keyId === "studio-9a3a782d7f8ff25b";
  });
  await leg("sk2e the backup cover asks the passphrase twice and says where the copy goes; two that differ, or none, send"
    + " nothing and say so, the fields emptied; two alike are sent and the cover closes on the answer", async () => {
    P.S.host = { signing: made() };
    P.ACTS["key-backup"]();
    const dlg = home.node("#dlg").innerHTML;
    home.node("#keyPass").value = "one"; home.node("#keyPass2").value = "two";
    await P.ACTS["do-key-backup"]();
    const differ = text(home.node("#dlg").innerHTML), quiet = !asked.some((a) => a[0] === "keyBackup");
    const emptied = home.node("#keyPass").value === "" && home.node("#keyPass2").value === "";
    home.node("#keyPass").value = "the same"; home.node("#keyPass2").value = "the same";
    keyAnswer = { error: null, file: "E:\\k.json", signing: made({ backup: { keyId: "studio-9a3a782d7f8ff25b", made: "2026-10-08", where: "E:\\" } }) };
    await P.ACTS["do-key-backup"]();
    const sent = asked.find((a) => a[0] === "keyBackup");
    return P.S.cover === null && /id="keyPass"/.test(dlg) && /id="keyPass2"/.test(dlg) && /data-act="do-key-backup"/.test(dlg)
      && /a USB stick, or a drive someone you trust can reach/.test(text(dlg))
      && /The two passphrases differ, so nothing was kept\./.test(differ) && quiet && emptied
      && !!sent && sent[1] === "the same" && !!P.S.host.signing.backup;
  });
  await leg("sk2f Restore a backup… picks the copy first and shows its key after Studio's disc before anything is typed, naming"
    + " the team that already trusts it; the passphrase is sent once with the file the pick answered", async () => {
    P.S.host = { signing: { keyId: "", problem: null } };
    P.S.desks = { folder: "S:\\Support", lead: "9a3a782d7f8ff25b" };
    await P.ACTS["key-restore"]();
    const dlg = home.node("#dlg").innerHTML;
    home.node("#keyPass").value = "its words";
    keyAnswer = made({ error: null, backup: { keyId: "studio-9a3a782d7f8ff25b", made: "2026-10-08", where: "E:\\", restored: true } });
    await P.ACTS["do-key-restore"]();
    const sent = asked.find((a) => a[0] === "keyRestore");
    P.S.desks = null;
    return P.S.cover === null && /E:\\copy\.json/.test(text(dlg)) && /9a3a 782d 7f8f f25b/.test(text(dlg))
      && /The key the team in S:\\Support already trusts\./.test(text(dlg)) && /aria-label="Studio&#39;s signing key"/.test(dlg)
      && !!sent && sent[1] === "E:\\copy.json" && sent[2] === "its words" && home.node("#keyPass").value === "";
  });

  /* The corner. The stand-in's classList records nothing, so the discs and the body are given ones that do; the three that
     come and go wear q, as ui/index.html writes them. */
  const classes = (el) => { const set = new Set(["#discBackup", "#discReview"].indexOf(el.__sel) >= 0 ? ["q"] : []); el.classList = { add: (...c) => c.forEach((x) => set.add(x)),
    remove: (...c) => c.forEach((x) => set.delete(x)), toggle: (c, on) => { if (on === undefined ? !set.has(c) : on) set.add(c); else set.delete(c); },
    contains: (c) => set.has(c) }; el.ringed = 0; const add = el.classList.add; el.classList.add = (...c) => { if (c.indexOf("nudge") >= 0) el.ringed++; add(...c); };
    return set; };
  const bd = home.node("#discBackup"), rv = home.node("#discReview"), body = home.doc.body;
  const bdSet = classes(bd), rvSet = classes(rv), bodySet = classes(body);
  classes(home.node("#discNew"));
  const corner = (sign, waiting, dir) => {
    P.S.host = { signing: sign };
    Object.assign(P.S, { screen: "project", wiz: null, open: { dir: dir || "D1" }, rv: { list: waiting == null ? [] : [{ ok: true, pending: waiting }] } });
    P.paintDiscs();
  };
  await leg("sk2g the backup disc is there only while the key kept here has no backup copy and a desk is admitted, and the"
    + " corner widens with it", async () => {
    corner(made({ admitted: 0 }));
    const noDesk = bdSet.has("on");
    corner(made({ admitted: 1 }));
    const on = bdSet.has("on") && bodySet.has("bd-on") && bd.getAttribute("aria-label") === "Make a backup copy of the signing key"
      && /viewBox="0 0 24 24"/.test(bd.innerHTML) && /stroke-width="1.4"/.test(bd.innerHTML);
    corner(made({ admitted: 1, backup: { keyId: "studio-9a3a782d7f8ff25b" } }));
    const gone = !bdSet.has("on") && !bodySet.has("bd-on");
    corner(made({ admitted: 1, kept: "passphrase" }));
    const old = bdSet.has("on");
    corner({ keyId: "", problem: null, admitted: 2 });
    return !noDesk && on && gone && !old && !bdSet.has("on");
  });
  /* BOARD 994 (the product designer's choice of 2026-11-12 07:36): the round + covered "Invite a teammate…" on the Team screen at
     some scroll positions. The screen's right padding is now as wide as the discs standing, counted to the leftmost one shown;
     red on 5016b500 (no count on body, no gutter in the sheet). */
  await leg("sk2g2 the Team screen's right padding clears the corner's discs as they stand: New card with Publish and Import, Review with them, the"
    + " backup disc beyond, and none outside a project", async () => {
    const at = () => body.getAttribute("data-discs");
    corner(made({ admitted: 0 }));
    const one = at() === "3";
    corner(made({ admitted: 0 }), 2);
    const two = at() === "4";
    corner(made({ admitted: 1 }));
    const three = at() === "5";
    Object.assign(P.S, { screen: "projects" });
    P.paintDiscs();
    const none = at() == null;
    const sheet = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
    const room = (n) => { const m = new RegExp('body\\[data-discs="' + n + '"\\]\\{--disc-room:([0-9]+)px\\}').exec(sheet); return m ? Number(m[1]) : null; };
    /* 22 px from the window's edge, 44 px a disc with 10 px between, and a 12 px gap before the screen's words. */
    const sized = [3, 4, 5].every((n) => room(n) === 22 + 44 * n + 10 * (n - 1) + 12);
    const gutter = /#main > \.pad\.desks-screen\{padding-right:max\(var\(--app-pad\),var\(--disc-room,0px\)\)\}/.test(sheet);
    const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
    const screen = app.indexOf("'<div class=\"pad desks-screen\"><h1>' + esc(T(\"Team\"))") >= 0;
    const f = { one, two, three, none, sized, gutter, screen };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("sk2g2 " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });
  await leg("sk2h it rings three times when it arrives with the first admission and again at each later one while it stands,"
    + " and not when the corner is first painted", async () => {
    bd.ringed = 0;
    const fresh = loadPage({ api, uiLang: "en" }), Q = fresh.page, b2 = fresh.node("#discBackup"), s2 = classes(b2);
    classes(fresh.doc.body); classes(fresh.node("#discReview")); classes(fresh.node("#discNew"));
    const paint = (n) => { Q.S.host = { signing: made({ admitted: n }) }; Object.assign(Q.S, { screen: "project", wiz: null, open: { dir: "D1" }, rv: { list: [] } }); Q.paintDiscs(); };
    paint(2);
    const atFirst = b2.ringed;
    paint(2);
    const unchanged = b2.ringed;
    paint(3);
    const rose = b2.ringed;
    const zero = loadPage({ api, uiLang: "en" }), Z = zero.page, b3 = zero.node("#discBackup"), s3 = classes(b3);
    classes(zero.doc.body); classes(zero.node("#discReview")); classes(zero.node("#discNew"));
    const pz = (n) => { Z.S.host = { signing: made({ admitted: n }) }; Object.assign(Z.S, { screen: "project", wiz: null, open: { dir: "D1" }, rv: { list: [] } }); Z.paintDiscs(); };
    pz(0); pz(1);
    return atFirst === 0 && unchanged === 0 && rose === 1 && s2.has("nudge") && !s2.has("once") && b3.ringed === 1 && s3.has("on");
  });
  await leg("sk2i Review rings once when its count rises on the same tab, never at the tab's first read, on a fall or on a move"
    + " to another tab; New card never rings", async () => {
    const fresh = loadPage({ api, uiLang: "en" }), Q = fresh.page, r2 = fresh.node("#discReview"), set2 = classes(r2);
    const nw = fresh.node("#discNew");
    classes(fresh.doc.body); classes(fresh.node("#discBackup")); classes(nw);
    const p = (n, dir) => { Q.S.host = { signing: { keyId: "" } }; Object.assign(Q.S, { screen: "project", wiz: null, open: { dir }, rv: { list: [{ ok: true, pending: n }] } }); Q.paintDiscs(); };
    p(1, "A"); const first = r2.ringed;
    p(3, "A"); const rose = r2.ringed;
    p(2, "A"); const fell = r2.ringed;
    p(5, "B"); const moved = r2.ringed;
    return first === 0 && rose === 1 && set2.has("once") && fell === 1 && moved === 1 && nw.ringed === 0;
  });
  /* ---- the review door's one count (the rail's Review row and the Review disc) ----------------------------------------
     What waits on the lead, by kind: two rows of a teammate's file and one of another catalog's (a decided file counts
     nothing), a model's draft, the two findings that wait (an error and a warning; a suggestion, a path's end and an
     awaiting language do not), and the request ready for its code (one still to open and one its invitation lets in do
     not): seven. Red before the door, where the disc counted the inbox's three rows and the rail said "2 files".
     P2: the request ready for its code is no card of the Review stack now (a desk is let in by its invitation or by the lead's own adding, and
     no code is typed), so six wait, and the requests the Desks screen lists are still read on the way in. */
  const doorOpen = JSON.parse(JSON.stringify(await S.openProject(proj)));
  doorOpen.lint = { errors: 1, warnings: 1, awaiting: 1, suggestions: 1, ends: 1, rows: [
    { severity: "error", what: "e", where: "", card: "c-one", go: null, why: "card 1 (\"One\"): e" },
    { severity: "warning", what: "w", where: "", card: "c-two", go: null, why: "card 2 (\"Two\"): w" },
    { severity: "awaiting", lang: "pl", cards: 2, what: "a", where: "", card: null, go: null, why: "" },
    { severity: "suggestion", kind: "commitment", what: "s", where: "", card: "c-one", go: null, why: "s" },
    { severity: "suggestion", kind: "ends", what: "t", where: "", card: "c-two", go: null, why: "t" }] };
  const doorList = { inbox: "D:\\inbox", proposals: [
    { name: "desk-four.ec", file: "D:\\inbox\\desk-four.ec", ok: true, pending: 2, desk: { id: "k-4", name: "Desk four" } },
    { name: "other.ec", file: "D:\\inbox\\other.ec", ok: true, pending: 1, foreign: true },
    { name: "done.ec", file: "D:\\inbox\\done.ec", ok: true, pending: 0 },
    { name: "broken.ec", file: "D:\\inbox\\broken.ec", ok: false, pending: 0 }] };
  const doorDesks = { error: null, folder: "S:\\Team", requests: [
    { id: "k-3f9a0c71b2e4d856", name: "Ready", state: "ready", kind: "desk", asked: "2026-11-15T09:00:00Z" },
    { id: "k-81d0e6a4c95b7f13", name: "Asks", state: "asks", kind: "desk", asked: "2026-11-15T09:00:00Z" },
    { id: "k-1111222233334444", name: "Invited", state: "ready", invite: "valid", kind: "desk", asked: "2026-11-15T09:00:00Z" }] };
  const doorDrafts = { error: null, drafts: [{ id: "d-1", job: "new", fields: { title: { en: "A drafted card" } } }] };
  const doorApi = Object.assign({}, api, {
    proposals: async () => JSON.parse(JSON.stringify(doorList)),
    desks: async () => JSON.parse(JSON.stringify(doorDesks)),
    aiDrafts: async () => JSON.parse(JSON.stringify(doorDrafts)),
  });
  /* The corner and the rail as a project open with everything read, on a page built from `source`. */
  const doorRead = (source) => {
    const pg = loadPage({ api: doorApi, uiLang: "en", source }), Q = pg.page;
    ["#discBackup", "#discReview", "#discNew"].forEach((s) => classes(pg.node(s)));
    classes(pg.doc.body);
    Object.assign(Q.S, { open: JSON.parse(JSON.stringify(doorOpen)), screen: "project", section: "cards", lang: "en", wiz: null,
      host: { signing: { keyId: "" } }, ai: { provider: "stand-in" }, aiDrafts: { dir: doorOpen.dir, drafts: doorDrafts.drafts },
      desks: JSON.parse(JSON.stringify(doorDesks)), rv: Q.rvState(JSON.parse(JSON.stringify(doorList))) });
    Q.paintRail(); Q.paintDiscs();
    const rv = pg.node("#discReview"), rail = pg.node("#rail").innerHTML;
    const row = (/<a[^>]*data-v="proposals"[^>]*><span class="rl">([^]*?)<\/span><span class="num">([^<]*)</.exec(rail) || []);
    let gather = null;
    try { gather = Q.__get("reviewWaiting")(); } catch (e) { gather = null; }
    return { n: (/<b class="dn">([^<]*)<\/b>/.exec(rv.innerHTML) || [])[1], title: String(rv.title).replace(NB, " "), on: rv.classList.contains("on"),
      label: String(row[1] || "").replace(/<[^>]*>/g, ""), num: row[2], gather };
  };
  const doorHolds = (d) => d.n === "6" && d.title === "Review: 6" && d.on && d.label === "Review" && d.num === "6";
  await leg("sk2k the Review disc and the rail's Review row say one number, everything that waits: a teammate's two rows, another"
    + " catalog's one, a model's draft, an error and a warning (P2: and no longer a request ready for its code); not a suggestion, a path's"
    + " end, an awaiting language, a decided or unreadable file, or any request", async () => {
    const d = doorRead();
    const kinds = (d.gather || []).map((x) => x.kind + ":" + (Array.isArray(x.rows) ? x.rows.length : x.n)).sort().join(",");
    const ok = doorHolds(d) && kinds === "check:1,check:1,import:1,model:1,team:2";
    if (!ok) process.stderr.write("       sk2k " + JSON.stringify({ n: d.n, title: d.title, on: d.on, label: d.label, num: d.num, kinds }) + NL);
    return ok;
  });
  await leg("sk2l the count is there when a project opens, before the Team screen is visited: the inbox, the drafts and the"
    + " requests are each read on the way in and the corner and the rail follow each, with no ring for a first read (P2: six, the requests count nothing)", async () => {
    const pg = loadPage({ api: doorApi, uiLang: "en" }), Q = pg.page, rv = pg.node("#discReview");
    classes(rv);
    ["#discBackup", "#discNew"].forEach((s) => classes(pg.node(s)));
    classes(pg.doc.body);
    Object.assign(Q.S, { host: { signing: { keyId: "" }, tour: { offered: true } }, ai: { provider: "stand-in" }, lang: "en" });
    Q.landOn(JSON.parse(JSON.stringify(doorOpen)));
    for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
    const num = pg.node('#rail a[data-v="proposals"] .num').textContent;
    const ok = /<b class="dn">6<\/b>/.test(rv.innerHTML) && String(rv.title).replace(NB, " ") === "Review: 6" && num === "6" && rv.ringed === 0
      && Q.S.section === "cards";
    if (!ok) process.stderr.write("       sk2l " + JSON.stringify({ dn: rv.innerHTML.slice(-30), title: rv.title, num, ringed: rv.ringed }) + NL);
    return ok;
  });
  /* EACH KIND IS ONE LINE OF THE GATHERING, and the rail's row one line of the rail: each lifted in a page built from a
     rewritten copy turns sk2k's claim false. Under ETIUDA_PLANTS=off the copies are not built and the claim is checked. */
  await leg("sk2m the door's guards are proved on their failure: without the drafts, the findings or the rail's"
    + " Review row (door-model, door-check, door-rail; P2: door-join, the requests', went with the code door) the count no longer holds", async () => {
    if (process.env.ETIUDA_PLANTS === "off") return doorHolds(doorRead());
    const src = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
    const left = ["door-model", "door-check", "door-rail"].map((tag) => {
      const mark = "/* plant:" + tag + " */", lines = src.split(NL), at = lines.findIndex((l) => l.indexOf(mark) >= 0);
      if (at < 0 || lines.filter((l) => l.indexOf(mark) >= 0).length !== 1) return tag + " unmarked";
      lines.splice(at, 1);
      return doorHolds(doorRead(lines.join(NL))) ? tag + " held" : "";
    }).filter(Boolean);
    if (left.length) process.stderr.write("       sk2m " + left.join(", ") + NL);
    return !left.length;
  });
  await leg("sk2j G1: a desk's key wears the cobalt disc with the desk glyph, Studio's the violet one with the key, each named"
    + " for a screen reader, the groups in fours", async () => {
    const d = P.keyHtml("desk", "3f9a0c71b2e4d856"), s = P.keyHtml("studio", "87ad0879ac3e9ff6");
    return /class="kdisc desk" role="img" aria-label="A teammate&#39;s key"/.test(d) && />3f9a 0c71 b2e4 d856</.test(d)
      && /class="kdisc" role="img" aria-label="Studio&#39;s signing key"/.test(s) && />87ad 0879 ac3e 9ff6</.test(s)
      && /M7\.5|cx="7\.5"/.test(s) && d.indexOf('cx="7.5"') < 0;
  });

  /* ---- 3. the sheet ---------------------------------------------------------------------------------------------- */
  const sheet = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8"), glyphAt = path.join(ROOT, "tools", "icons", "backup.svg");
  const glyph = fs.existsSync(glyphAt) ? fs.readFileSync(glyphAt, "utf8") : "";
  await leg("sk3a the backup disc as decided: L3's tint and edge in the key's violet, glyph C at 20 px with its line at 1.4, and"
    + " the disc first in the corner's row, where a press opens the backup cover; the bulk accept disc is gone", async () => {
    const at = sheet.indexOf('id="discBackup"'), rv = sheet.indexOf('id="discReview"');
    return /#discBackup\{background:color-mix\(in srgb,#7c3aed 13%,var\(--panel\)\);\s*border:1px solid color-mix\(in srgb,#7c3aed 42%,var\(--panel\)\);color:var\(--mark\)\}/.test(sheet)
      && /#discBackup \.ic\{width:20px;height:20px\}/.test(sheet) && /stroke-width="1\.4"/.test(glyph)
      && /<circle cx="10\.34" cy="14\.66" r="2\.6"\/>/.test(glyph) && at > 0 && at < rv && sheet.indexOf('id="discAccept"') < 0
      && /<button type="button" class="disc q" id="discBackup" data-act="key-backup"/.test(sheet);
  });
  await leg("sk3b the ring is the desk's nudge ported: three rings of --m-nudge, Review's once, off under reduced motion; and"
    + " the card acts and the bulk bar keep 282 px clear while the disc shows", async () => {
    return /\.disc\.nudge::after\{[^}]*animation:fabNudge var\(--m-nudge\) ease-out 3 both/.test(sheet)
      && /\.disc\.nudge\.once::after\{animation-iteration-count:1\}/.test(sheet)
      && /@media \(prefers-reduced-motion:reduce\)\{ \.disc\.nudge::after\{animation:none;display:none\} \}/.test(sheet)
      && /body\.bd-on \.row2\.acts\{padding-right:282px\}/.test(sheet) && /body\.bd-on \.bulk\{padding-right:calc\(var\(--app-pad\) \+ 282px\)\}/.test(sheet);
  });

  /* ---- 4. the first key on the page (the sense pass of 2026-10-14, finding 9) ------------------------------------- */
  /* Maxim, 2026-10-13 15:51: "Etiuda is meant to empower and enhance, not limit and cage." The lead should not have to find
     Settings for the desks to see their own lead's editions as updates. The shell's half is tests/shell-guards.mjs 19. */
  const plan0 = JSON.parse(JSON.stringify(await S.publishPlan(proj)));
  const planWith = (signing) => Object.assign({}, plan0, { lint: Object.assign({}, plan0.lint, { errors: 0, warnings: 0, rows: [] }), signing });
  const signGate = (Q, signing) => { Q.S.plan = planWith(signing); Q.S.planDesks = null;
    return (/data-gate="sign">([^]*?)<\/div><\/div>/.exec(Q.coverHtml()) || [])[1] || ""; };
  await leg("sk4a the cover's signature: with no key and nothing at the folder trusting another, Signed and that publishing"
    + " makes the key; where the folder's team trusts another, Unsigned, that key in fours after Studio's disc and Restore"
    + " first, with no Make; CONTROL: the residual no-key case keeps its line", async () => {
    P.S.host = { signing: { keyId: "", problem: null } };
    const makes = signGate(P, { keyId: "", print: "", opens: false, unreadable: false, makes: true });
    const theirs = signGate(P, { keyId: "", print: "", opens: false, unreadable: false, restore: "9a3a782d7f8ff25b" });
    const none = signGate(P, { keyId: "", print: "", opens: false, unreadable: false });
    return /^Signed/.test(text(makes)) && /Publishing makes this Studio's signing key and signs the edition with it/.test(text(makes))
      && !/key-make|key-restore/.test(makes)
      && /^Unsigned/.test(text(theirs)) && /The team trusts the signing key 9a3a 782d 7f8f f25b ?, and it is not on this computer\./.test(text(theirs))
      && /class="kdisc" role="img" aria-label="Studio&#39;s signing key"/.test(theirs)
      /* MOVED (board 1016, item 5): old, Restore first and no Make drawn here; new, no press of the key's at all, one link to Settings' Signing key. */
      && !/data-act="key-restore"|data-act="key-make"/.test(theirs) && /data-act="key-settings">[^<]*(<[^>]*>)*Signing key settings/.test(theirs)
      && /^Unsigned/.test(text(none)) && /There is no signing key yet: one is made from the Menu, under Settings, then Signing key\./.test(text(none));
  });
  /* The press driven whole, as tests/publish-press.mjs drives it, over a shell stood in by its replies. */
  const landed = [];
  const pressApi = Object.assign({}, api, {
    publish: async (d, o) => { landed.push(o); return landed.length === 1
      ? { error: null, rev: 2, edition: "2026-10-15", ec: "S:\\Support\\gate.ec", folder: "S:\\Support", keyNudge: true, signing: made() }
      : { error: null, rev: 3, edition: "2026-10-15a", ec: "S:\\Support\\gate.ec", folder: "S:\\Support" }; },
    open: async (d) => JSON.parse(JSON.stringify(await S.openProject(d))),
    projects: async () => ({ error: null, projects: [] }),
    tabs: async () => ({ error: null }),
  });
  const pg = loadPage({ api: pressApi, uiLang: "en" }), Q = pg.page;
  const press = async () => {
    Object.assign(Q.S, { open: JSON.parse(JSON.stringify(await S.openProject(proj))), screen: "project", section: "cards", lang: "en",
      tabs: [{ dir: proj, name: "Key gate", rev: 1 }], cover: "publish", plan: planWith({ keyId: "", print: "", opens: false, makes: true }), planDesks: null });
    pg.doc.absent = new Set(["#override", "#fileName"]);
    await Q.ACTS["do-publish"]();
    return { said: pg.node("#pressedKey").textContent, hidden: pg.node("#pressedKey").hidden, button: pg.node("#pressedBackup").hidden,
             label: pg.node("#pressedBackup").innerHTML };
  };
  await leg("sk4b the nudge: the landing after the publish that made the key says so in the bubble and offers a backup copy,"
    + " the page takes the key the shell answered, and the next landing says nothing of it", async () => {
    Q.S.host = { signing: { keyId: "", problem: null }, tour: { offered: true } };
    const first = await press();
    const took = Q.S.host.signing.keyId === "studio-9a3a782d7f8ff25b";
    const second = await press();
    return landed.length === 2 && first.hidden === false && first.button === false
      && /^Studio made its signing key, and signs every edition with it from now on\. A backup copy brings it to another computer\.$/.test(first.said)
      && /Make a backup copy…/.test(first.label) && took
      && second.hidden === true && second.button === true && second.said === "";
  });
  await leg("sk4c the bubble's backup press closes the bubble and opens the backup copy's cover", async () => {
    Q.S.host = { signing: made(), tour: { offered: true } };
    pg.node("#pressed").hidden = false;
    Q.ACTS["pressed-backup"]();
    return pg.node("#pressed").hidden === true && Q.S.cover === "key" && Q.S.keyWant === "backup";
  });
  /* The Desks screen with no key: the switch where Sealed would make the key, the old row where something else is in the way. */
  let deskAnswer = null, sealAnswer = null;
  const dk = loadPage({ api: Object.assign({}, api, { desks: async () => JSON.parse(JSON.stringify(deskAnswer)),
    teamSealed: async () => JSON.parse(JSON.stringify(sealAnswer)), teamRelay: async () => JSON.parse(JSON.stringify(sealAnswer)) }), uiLang: "en" }), D = dk.page;
  const noKey = (o) => Object.assign({ error: null, folder: "S:\\Support", id: "c", mark: null, signing: "", file: "none", reason: "",
    inside: false, keyHeld: false, canKeep: true, restorable: null, requests: [], team: null }, o || {});
  /* MOVED 2026-11-26 (Max, findings 29, 31 and 32: a team is made on its own, and the Publishing switch is retired). Was: with no key and nothing at the
     folder trusting another the Desks screen offered Sealed, whose press made the key and took the one the shell answered, and a team kept for the
     folder kept the old row. Now the screen of a catalog with no team file offers Make a team and makes no key itself: the shell refuses the press, in
     the key's sentence, until Settings has made one. */
  await leg("sk4d the Desks screen with no key and no team file offers Make a team on its own and makes no key itself; CONTROL: a team file this Studio does not lead keeps its own row", async () => {
    Object.assign(D.S, { open: JSON.parse(JSON.stringify(await S.openProject(proj))), screen: "projects", home: "team", teamDir: proj, lang: "en",
      host: { signing: { keyId: "", problem: null } } });
    deskAnswer = noKey();
    await D.desksLoad();
    const open = dk.node("#main").innerHTML;
    deskAnswer = noKey({ file: "theirs", lead: "9a3a782d7f8ff25b" });
    await D.desksLoad();
    const theirs = dk.node("#main").innerHTML;
    deskAnswer = noKey();
    await D.desksLoad();
    return /data-act="team-new"/.test(open) && /data-no-team/.test(open) && !/data-act="key-make"/.test(open) && !/data-act="team-seal"/.test(open)
      && !/data-no-team/.test(theirs) && /9a3a 782d 7f8f f25b/.test(text(theirs));
  });

  await leg("sk4e leg d: Desks screen with file theirs: when no old key held, team-handover is not offered; when old key held, it is offered; confirmation shows exact copywriter words (folder without paid time, relay with)", async () => {
    D.S.host = { signing: made() };
    deskAnswer = { error: null, folder: "S:\\Support", id: "c", mark: null, signing: "studio-9a3a782d7f8ff25b", file: "theirs", lead: "1122 3344 5566 7788", canHandover: false, team: null };
    await D.desksLoad();
    const withoutOld = dk.node("#main").innerHTML;
    const noOffer = !/data-act="team-handover"/.test(withoutOld) && !/data-act="team-fresh"/.test(withoutOld);

    deskAnswer = { error: null, folder: "S:\\Support", id: "c", mark: null, signing: "studio-9a3a782d7f8ff25b", file: "theirs", lead: "1122 3344 5566 7788", canHandover: true, team: null };
    await D.desksLoad();
    const withOld = dk.node("#main").innerHTML;
    const hasOffer = /data-act="team-handover"/.test(withOld) && /Hand the team to the new signing key/.test(text(withOld));

    /* Test confirmation modal for folder team (no paid time clause) */
    D.ACTS["team-handover"]();
    const folderDlg = dk.node("#dlg").innerHTML;
    const folderText = text(folderDlg);
    const folderHasTitle = /Hand the team to the new signing key\?/.test(folderText);
    const folderNoPaid = folderText.indexOf("keeps its paid time") < 0;
    const folderHasBody = /The team moves to this Studio's new signing key\. Studio signs the handover with the old key/.test(folderText);
    const folderHasButtons = /data-act="do-team-handover"/.test(folderDlg) && /Hand over/.test(folderText) && /data-act="cancel"/.test(folderDlg);

    /* Test confirmation modal for relay team (keeps its paid time clause) */
    deskAnswer = { error: null, folder: "S:\\Support", id: "c", mark: null, signing: "studio-9a3a782d7f8ff25b", file: "theirs", lead: "1122 3344 5566 7788", canHandover: true, relay: true, team: null };
    await D.desksLoad();
    D.ACTS["team-handover"]();
    const relayDlg = dk.node("#dlg").innerHTML;
    const relayText = text(relayDlg);
    const relayHasPaid = /The team moves to this Studio's new signing key and keeps its paid time\./.test(relayText);

    /* Test Polish translations */
    const dkPl = loadPage({ api: Object.assign({}, api, { desks: async () => JSON.parse(JSON.stringify(deskAnswer)) }), uiLang: "pl" });
    const Dpl = dkPl.page;
    Object.assign(Dpl.S, { open: JSON.parse(JSON.stringify(await S.openProject(proj))), screen: "projects", home: "team", teamDir: proj, lang: "pl", host: { signing: made() } });
    deskAnswer = { error: null, folder: "S:\\Support", id: "c", mark: null, signing: "studio-9a3a782d7f8ff25b", file: "theirs", lead: "1122 3344 5566 7788", canHandover: true, team: null };
    await Dpl.desksLoad();
    const plMain = dkPl.node("#main").innerHTML;
    const plOffer = /data-act="team-handover"/.test(plMain) && /Przekaż zespół nowemu kluczowi podpisu/.test(text(plMain));
    Dpl.ACTS["team-handover"]();
    const plFolderDlg = text(dkPl.node("#dlg").innerHTML);
    const plFolderOk = /Przekazać zespół nowemu kluczowi podpisu\?/.test(plFolderDlg)
      && /Zespół przejdzie pod nowy klucz podpisu tego Studia\. Studio podpisze przekazanie/.test(plFolderDlg)
      && plFolderDlg.indexOf("i zachowa opłacony czas") < 0;

    deskAnswer = { error: null, folder: "S:\\Support", id: "c", mark: null, signing: "studio-9a3a782d7f8ff25b", file: "theirs", lead: "1122 3344 5566 7788", canHandover: true, relay: true, team: null };
    await Dpl.desksLoad();
    Dpl.ACTS["team-handover"]();
    const plRelayDlg = text(dkPl.node("#dlg").innerHTML);
    const plRelayOk = /Zespół przejdzie pod nowy klucz podpisu tego Studia i zachowa opłacony czas\./.test(plRelayDlg);

    return noOffer && hasOffer && folderHasTitle && folderNoPaid && folderHasBody && folderHasButtons && relayHasPaid && plOffer && plFolderOk && plRelayOk;
  });

  /* THE HANDOVER ASKS WHY (Max's ruling of 2026-11-01 06:13), in the copywriter's words of 2026-11-01. A copy of the page with
     the press's own refusal of no reason lifted (plant:lb-page-why) hands over with none, so the leg turns; under
     ETIUDA_PLANTS=off that half is not run and the claim is still checked. */
  await leg("sk4l the handover cover asks why the team is moving, in English and in Polish: Hand over waits for a choice, each choice"
    + " shows its own line, and the press hands the choice to the shell", async () => {
    const theirs = { error: null, folder: "S:\\Support", id: "c", mark: null, signing: "studio-9a3a782d7f8ff25b", file: "theirs", lead: "1122 3344 5566 7788", canHandover: true, team: null };
    const run = async (lang, source) => {
      const calls = [];
      const pg = loadPage({ api: Object.assign({}, api, { desks: async () => JSON.parse(JSON.stringify(theirs)),
        teamHandover: async (...a) => { calls.push(a); return { ok: true }; } }), uiLang: lang, source });
      const Pg = pg.page;
      Object.assign(Pg.S, { open: JSON.parse(JSON.stringify(await S.openProject(proj))), screen: "projects", home: "team", teamDir: proj, lang, host: { signing: made() } });
      await Pg.desksLoad();
      Pg.ACTS["team-handover"]();
      const first = pg.node("#dlg").innerHTML;
      await Pg.ACTS["do-team-handover"]();
      const early = calls.length;
      Pg.ACTS["handover-why"]({ getAttribute: (k) => (k === "data-v" ? "new-computer" : null) });
      const one = pg.node("#dlg").innerHTML;
      Pg.ACTS["handover-why"]({ getAttribute: (k) => (k === "data-v" ? "other-hands" : null) });
      const two = pg.node("#dlg").innerHTML;
      await Pg.ACTS["do-team-handover"]();
      return { first, one, two, early, calls };
    };
    const en = await run("en");
    const pl = await run("pl");
    const has = (html, words) => text(html).indexOf(words) >= 0;
    const L1 = "The old key is safe and the team simply moves on. Every teammate follows on its own, those switched off at the time included.";
    const L2 = "Studio guards the team's keys anew, so once they next change, the old key opens nothing published after that. A teammate switched off across the handover and that change will need a new invitation, and Studio names each one. The old key can still sign, so if it is surely in other hands, a new team is the safe way.";
    const L1P = "Stary klucz jest bezpieczny, a zespół po prostu przechodzi dalej. Każdy członek zespołu sam za nim podąży, również ci, których komputery są w tym czasie wyłączone.";
    const L2P = "Studio zabezpieczy klucze zespołu od nowa, więc gdy następnym razem się zmienią, stary klucz nie otworzy niczego, co zostanie opublikowane potem. Członek zespołu wyłączony w czasie przekazania i tej zmiany będzie potrzebował nowego zaproszenia, a Studio wskaże każde z nazwy. Stary klucz nadal może jednak podpisywać, więc jeśli na pewno jest w cudzych rękach, bezpieczną drogą jest nowy zespół.";
    const ok = {
      enAsk: has(en.first, "Why is the team moving to the new key?") && has(en.first, "A new computer") && has(en.first, "The old key may be in other hands"),
      enWaits: /data-act="do-team-handover" disabled/.test(en.first) && en.early === 0 && !has(en.first, L1) && !has(en.first, L2),
      enLines: has(en.one, L1) && !has(en.one, L2) && has(en.two, L2) && !has(en.two, L1) && !/data-act="do-team-handover" disabled/.test(en.two),
      enPress: en.calls.length === 1 && en.calls[0][1] === "other-hands",
      plAsk: has(pl.first, "Dlaczego zespół przechodzi pod nowy klucz?") && has(pl.first, "Nowy komputer") && has(pl.first, "Stary klucz mógł trafić w cudze ręce"),
      plLines: has(pl.one, L1P) && has(pl.two, L2P) && pl.early === 0 && pl.calls.length === 1 && pl.calls[0][1] === "other-hands",
      noLeadBox: !/lead box|lead's box/i.test(text(en.two)),
    };
    let turned = true;
    if (process.env.ETIUDA_PLANTS !== "off") {
      const src = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8"), mark = "      if (!why) return; /* plant:lb-page-why */\n";
      turned = src.split(mark).length === 2 && (await run("en", src.replace(mark, ""))).early === 1;
    }
    if (!Object.keys(ok).every((k) => ok[k]) || !turned) process.stderr.write("       sk4l " + JSON.stringify(ok) + " turned " + turned + NL);
    return Object.keys(ok).every((k) => ok[k]) && turned;
  });

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "studio-key");
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + NL);
  if (asserted !== EXPECTED) { process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran" + NL); return 78; }
  process.stdout.write("studio-key  " + asserted + " assertion(s), " + failed + " failure(s)" + NL);
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then((c) => process.exit(c), (e) => {
  process.stderr.write(String(e && e.stack || e) + NL); process.exit(2);
});
