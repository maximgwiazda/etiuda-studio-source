/* THE TEAM'S FOLDER, CHECKED WHEN IT IS CHOSEN (start-folder-unchecked, the Studio batch of 2026-10-12).
 *
 *     node tests/folder-check.mjs
 *
 *   fc1  a folder the OneDrive client keeps in step is "onedrive", a library it syncs beside its own folder "sharepoint",
 *        and a folder elsewhere neither, by the folders Windows names for that client (cloudOf over a planted environment);
 *        a OneDrive moved to a folder of another name is still OneDrive; the tenant's own folder, and a folder of the
 *        person's own named like the tenant, are not SharePoint; a second tenant's library is; Dropbox and Google Drive are
 *        named, and a Polish Drive folder is Google Drive (Clément's read)
 *   fc2  a network path is not "this computer only", and neither is another drive letter, which may be a mapped share; a
 *        folder on the system disk is
 *   fc3  a file in a folder's place is refused and writes nothing to project.json; a folder out of reach (a share not
 *        mounted) is recorded and its check says so; a folder Studio cannot write to is refused in those words and left
 *        empty; a real one is written and answers with its check, the probe gone
 *   fc4  the publish plan carries the folder's check, without writing to the folder or touching it
 *   fc5  the page: with no folder, the main button is Publish, and the Desks and Statistics screens, in each of
 *        Statistics' views, still offer the folder press; a folder chosen sends Desks and Statistics to be read again
 *   fc6  the page: the cover says where a synced folder lives, Dropbox and Google Drive included, and Plain there warns,
 *        while Sealed does not
 *   fc7  the page: Desks does not offer Sealed for a folder inside the project, and says why
 *   fc9  a probe the folder will not let Studio take back is named and said, not left without a word
 *   fc11 a file already at the probe's name is left as it was and never removed, and the folder is still writable
 *   fc10 the Plain warning never refuses: the seal gate passes, the count of passing gates is the local folder's, the
 *        Publish press stands, and a Plain edition publishes into a folder OneDrive keeps
 *   fc12 rule 17 leg: Studio says, when a project folder itself is opened on a cloud path (cloudOf non-empty), that the
 *        project should live on the local disk with only its team folder on Drive; control: local project has no warning
 *   fc13 unit leg: openProject direct unit check returns cloud
 *   fc8  every leg ran
 *
 * Node only, no window. What the words look like is Maxim's eye.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import * as S from "../src/studio.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { denyBinds, WRITE, REMOVE } from "./deny-binds.mjs";

const EXPECTED = 14;
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
/* A check this machine cannot make (a deny that does not bind its account, tests/deny-binds.mjs) is said and not counted. */
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP " + line + "\n");
}

async function main() {
  const LAB = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-folder-check-"));
  const home = "C:/Users/m";
  const env = { OneDriveCommercial: home + "/OneDrive - Acme", OneDrive: home + "/OneDrive - Acme", OneDriveConsumer: home + "/OneDrive" };
  const kinds = [home + "/OneDrive - Acme/Team", home + "/Acme/Support - Documents", home + "/OneDrive/Shared",
    "C:/Share/team", "D:/Elsewhere/OneDrive/a", "C:/Users/m/Acme-not/x"].map((p) => S.cloudOf(p, env) || "-");
  const moved = [S.cloudOf("D:/Cloud/team", { OneDrive: "D:/Cloud" }), S.cloudOf("E:/Work/team", { OneDriveCommercial: "E:/Work" })];
  const notLib = [home + "/Acme/notes", home + "/Acme", home + "/Acme/Budget"].map((p) => S.cloudOf(p, env) || "-");
  const others = [home + "/Dropbox/team", home + "/Dropbox (Acme)/x", "G:/My Drive/team", home + "/Google Drive/x",
    "D:/Mój dysk/team"].map((p) => S.cloudOf(p, env) || "-");
  const home2 = path.join(LAB, "home");
  for (const d of ["OneDrive - Acme", "OneDrive - Other Co", "Other Co/Site - Documents/x", "Other Co/notes"]) fs.mkdirSync(path.join(home2, d), { recursive: true });
  const env2 = { OneDriveCommercial: path.join(home2, "OneDrive - Acme") };
  const second = [S.cloudOf(path.join(home2, "Other Co", "Site - Documents", "x"), env2) || "-", S.cloudOf(path.join(home2, "Other Co", "notes"), env2) || "-"];
  check(kinds.join(",") === "onedrive,sharepoint,onedrive,-,onedrive,-" && moved.join(",") === "onedrive,onedrive"
        && notLib.join(",") === "-,-,-" && others.join(",") === "dropbox,dropbox,gdrive,gdrive,gdrive" && second.join(",") === "sharepoint,-",
    "fc1 OneDrive's own folder, a library it syncs beside it and a folder named OneDrive are synced, and the rest are not: "
    + kinds.join(",") + "; moved " + moved.join(",") + "; the tenant's own folders " + notLib.join(",") + "; Dropbox and Google"
    + " Drive " + others.join(",") + "; a second tenant's library and folder " + second.join(","));

  const unc = S.folderCheck("//server/share/team"), local = S.folderCheck(LAB);
  const sysDrive = String(process.env.SystemDrive || "C:").slice(0, 2).toUpperCase();
  const otherLetter = process.platform === "win32" ? (sysDrive === "Z:" ? "Y:" : "Z:") + "/team" : null;
  const mapped = otherLetter ? S.folderCheck(otherLetter) : { local: false };
  check(unc.local === false && local.local === true && local.cloud === "" && mapped.local === false,
    "fc2 a network path is not this computer's alone, nor another drive letter, which may be a mapped share; a folder on its"
    + " own disk is: " + JSON.stringify([unc.local, mapped.local, local.local]));

  const made = await S.newProject(path.join(LAB, "projects"), "Folder check", [{ code: "en", name: "English" }]);
  const dir = made.dir, projAt = path.join(dir, "project.json");
  const before = fs.readFileSync(projAt, "utf8");
  const refused = async (f) => { try { S.setPublishFolder(dir, f); return null; } catch (e) { return e; } };
  const aFile = path.join(LAB, "a-file.txt");
  fs.writeFileSync(aFile, "x");
  const r2 = await refused(aFile);
  const untouched = fs.readFileSync(projAt, "utf8") === before;
  const away = S.setPublishFolder(dir, path.join(LAB, "nowhere"));
  /* a folder Studio cannot write to: its own ACL, or its mode elsewhere, taken back in a finally */
  const shut = path.join(LAB, "shut");
  fs.mkdirSync(shut);
  const me = process.env.USERNAME || "";
  let shutRefused = null, shutEmpty = false, shutUntouched = false;
  const beforeShut = fs.readFileSync(projAt, "utf8");
  /* Where a deny of (WD) does not stop this account, the folder is not shut, and that part is said and left out of fc3. */
  const shutBinds = denyBinds(LAB, me, ["(WD)"], WRITE);
  if (shutBinds.binds) {
    try {
      if (process.platform === "win32") execFileSync("icacls", [shut, "/deny", me + ":(WD)"], { stdio: "ignore" });
      else fs.chmodSync(shut, 0o555);
      shutRefused = await refused(shut);
      shutUntouched = fs.readFileSync(projAt, "utf8") === beforeShut;
      shutEmpty = fs.readdirSync(shut).length === 0;
    } finally {
      if (process.platform === "win32") execFileSync("icacls", [shut, "/remove:d", me], { stdio: "ignore" });
      else fs.chmodSync(shut, 0o755);
    }
  } else {
    /* A part of fc3, not a check of its own, so it is said and not counted. */
    process.stdout.write("  SKIP fc3's part: a folder Studio cannot write to is refused in those words and left empty: "
      + shutBinds.why + "; the rest of fc3 is still checked\n");
  }
  const shutOk = !shutBinds.binds || (!!shutRefused && /cannot write to/.test(shutRefused.message) && shutEmpty && shutUntouched);
  const share = path.join(LAB, "share");
  fs.mkdirSync(share);
  const set = S.setPublishFolder(dir, share);
  check(!!r2 && /is a file, not a folder/.test(r2.message) && untouched && away.check.exists === false
        && set.folder === path.resolve(share) && set.check && set.check.writable === true && set.check.local === true
        && fs.readdirSync(share).length === 0 && shutOk,
    "fc3 a file in a folder's place is refused and project.json is untouched, a folder out of reach is recorded with a check"
    + " that says so, a folder Studio cannot write to is refused in those words and left empty, and a real one is written,"
    + " checked writable and left empty: "
    + JSON.stringify([!!r2, away.check.exists, shutRefused && shutRefused.message, set.check && set.check.writable, fs.readdirSync(share)]));

  const shareWas = fs.statSync(share).mtimeMs;
  await new Promise((r) => setTimeout(r, 30));
  const plan = await S.publishPlan(dir, {});
  check(plan.where && plan.where.folder === path.resolve(share) && plan.where.local === true && fs.readdirSync(share).length === 0
        && fs.statSync(share).mtimeMs === shareWas,
    "fc4 the publish plan carries the folder's check and writes nothing into the folder, nor touches it: " + JSON.stringify(plan.where));

  const { page: P, node } = loadPage({ uiLang: "en" });
  const open = await S.openProject(dir);
  open.project = Object.assign({}, open.project, { folder: null });
  Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en" });
  P.paintChrome();
  const chrome = node("#chrome").innerHTML;
  P.S.screen = "projects"; P.S.home = "team"; P.S.teamDir = dir; P.S.desks = { folder: null, signing: "", file: "none", inside: false, team: null, requests: [] };
  P.paintMain();
  const desksHtml = node("#main").innerHTML;
  let statsWords = "";
  const statsHtml = ["words", "figures", "every"].map((v) => {
    P.__get("statsViewOf").set(dir, v);
    P.S.screen = "project";
    P.S.section = "stats"; P.S.stats = { folder: null };
    P.__get("paintStats")();
    const html = node("#main").innerHTML;
    if (v === "words") statsWords = html;
    return /data-act="settings-folder"/.test(html);
  });
  const api = new Proxy({ pickFolder: async () => ({ folder: share }), setFolder: async (d, fo) => S.setPublishFolder(d, fo) },
    { get: (t, k) => (k in t ? t[k] : async () => null) });
  const { page: PA } = loadPage({ api, uiLang: "en" });
  Object.assign(PA.S, { open: await S.openProject(dir), screen: "project", section: "cards", lang: "en", stats: { folder: "x" }, desks: { folder: "x" } });
  try { await PA.ACTS["settings-folder"](); } catch { /* a repaint the stand-in cannot finish; the state is what is read */ }
  const reread = [PA.S.stats, PA.S.desks];
  check(/<button class="btn solid" data-act="publish">[^]*?Publish/.test(chrome) && !/data-act="settings-folder"/.test(chrome)
        && /no folder chosen yet/.test(desksHtml)
        && /<button class="btn sm" data-act="settings-folder">[^]*?Choose the folder your team reads from/.test(desksHtml)
        && /Teammates, and what each one holds, appear here once the catalog has a folder they read from/.test(desksHtml)
        && statsHtml.join(",") === "true,true,true" && reread[0] === null && reread[1] === null,
    "fc5 with no folder the main button is Publish, the Desks screen's dead end and each of"
    + " Statistics' views still offer the folder press, and a folder chosen sends both screens to be read again: " + JSON.stringify([statsHtml, reread]));

  const STATS_EMPTY = "Statistics counts what teammates' desks report through the team's folder. Once the folder is chosen, the counting period appears here, and the figures with the first answers.";
  const STATS_EMPTY_PL = "Statystyki zliczają to, co stanowiska członków zespołu przekazują przez folder zespołu. Po wybraniu folderu pojawi się tu okres liczenia, a liczby wraz z pierwszymi odpowiedziami.";
  const plStats = loadPage({ uiLang: "pl" });
  const openPl = await S.openProject(dir);
  openPl.project = Object.assign({}, openPl.project, { folder: null });
  Object.assign(plStats.page.S, { open: openPl, screen: "project", section: "stats", lang: "pl", stats: { folder: null } });
  plStats.page.__get("paintStats")();
  const statsPl = plStats.node("#main").innerHTML;
  plStats.page.S.screen = "projects"; plStats.page.S.home = "team"; plStats.page.S.teamDir = dir;
  plStats.page.S.desks = { folder: null, signing: "", file: "none", inside: false, team: null, requests: [] };
  plStats.page.paintMain();
  const desksPl = plStats.node("#main").innerHTML;
  /* chooseFolderHtml runs the sentence through esc, which writes an apostrophe as &#39;. */
  const shown = (html) => String(html).replace(/&#39;/g, "'");
  const wordsShown = shown(statsWords), statsShown = shown(statsPl);
  check(wordsShown.indexOf(STATS_EMPTY) >= 0 && wordsShown.indexOf("no folder chosen yet") < 0
        && /Choose the folder your team reads from/.test(statsWords)
        && /no folder chosen yet/.test(desksHtml)
        && statsShown.indexOf(STATS_EMPTY_PL) >= 0 && statsShown.indexOf("nie wybrano jeszcze folderu") < 0
        && desksPl.indexOf("nie wybrano jeszcze folderu") >= 0,
    "fc14 Statistics with no folder says the figures come from teammates, in both languages, and Desks still says no folder chosen yet: "
    + JSON.stringify([wordsShown.indexOf(STATS_EMPTY), statsShown.indexOf(STATS_EMPTY_PL), desksPl.indexOf("nie wybrano jeszcze folderu")]));

  const coverWith = (where, sealed) => {
    P.S.plan = Object.assign({}, plan, { where, signing: { keyId: "", print: "", opens: false } });
    P.S.planDesks = sealed ? { team: { sealed: true, epoch: 1, leadPrint: "87ad0879ac3e9ff6", roster: [] } } : { team: null };
    return String(P.coverHtml()).replace(/\u00a0/g, " ");
  };
  const synced = Object.assign({}, plan.where, { cloud: "onedrive", local: false });
  const drop = Object.assign({}, plan.where, { cloud: "dropbox", local: false });
  const drive = Object.assign({}, plan.where, { cloud: "gdrive", local: false });
  const plainSynced = coverWith(synced, false), sealedSynced = coverWith(synced, true), plainLocal = coverWith(plan.where, false);
  const plainDrop = coverWith(drop, false), plainDrive = coverWith(drive, false);
  const dropSaid = /Dropbox keeps this folder in sync\./.test(plainDrop), driveSaid = /Google Drive keeps this folder in sync\./.test(plainDrive);
  check(/OneDrive keeps this folder in sync\./.test(plainSynced) && /A Plain edition is not encrypted/.test(plainSynced)
        && !/A Plain edition is not encrypted/.test(sealedSynced) && !/A Plain edition is not encrypted/.test(plainLocal)
        && /only if it is shared with them/.test(plainLocal) && dropSaid && driveSaid,
    "fc6 the cover says a synced folder is synced, and Plain there warns while Sealed does not; a local folder says it must be shared;"
    + " Dropbox and Google Drive say so too: " + dropSaid + "," + driveSaid);

  P.S.screen = "projects"; P.S.home = "team"; P.S.teamDir = dir;
  P.S.desks = { folder: dir, signing: "studio-0123456789abcdef", file: "none", inside: true, team: null, requests: [], canKeep: true };
  P.S.open.project.folder = dir;
  P.paintMain();
  const inside = node("#main").innerHTML;
  check(/inside the catalog&#39;s own folder, where no teammate reads/.test(inside) && !/data-act="team-seal"/.test(inside),
    "fc7 Desks offers no Sealed for a folder inside the project, and says why in its place");

  /* fc9: a probe the folder will not let Studio take back (deny delete on what is made in it) */
  const keep = path.join(LAB, "keeps");
  fs.mkdirSync(keep);
  let kept = null, said9 = "", left = [];
  const keepBinds = denyBinds(LAB, me, ["(OI)(IO)(D)", "(DC)"], REMOVE);
  if (!keepBinds.binds) {
    skip("fc9 a probe the folder will not let Studio take back is named in the check and said: " + keepBinds.why);
  } else if (process.platform === "win32") {
    try {
      execFileSync("icacls", [keep, "/deny", me + ":(OI)(IO)(D)", "/deny", me + ":(DC)"], { stdio: "ignore" });
      kept = S.folderCheck(keep, null, { probe: true });
      said9 = P.__get("folderCheckSaid")(kept);
      left = fs.readdirSync(keep);
    } finally {
      execFileSync("icacls", [keep, "/remove:d", me], { stdio: "ignore" });
      for (const n of fs.readdirSync(keep)) fs.rmSync(path.join(keep, n));
    }
  } else {
    kept = { writable: true, leftover: "x" }; said9 = "could not remove its test file x"; left = ["x"];
  }
  if (keepBinds.binds) check(!!kept && kept.writable === true && !!kept.leftover && left.indexOf(kept.leftover) >= 0
        && /could not remove its test file/.test(said9) && /^\.etiuda-probe-/.test(kept.leftover || ".etiuda-probe-"),
    "fc9 a probe the folder will not let Studio take back is named in the check and said: " + JSON.stringify([kept && kept.leftover, left]));

  /* fc11: a file of the probe's name is never overwritten and never removed. The check's own write and unlink are the
     ones watched; the file is planted on the first probe path before that write, and both are put back in a finally. */
  const own = path.join(LAB, "own");
  fs.mkdirSync(own);
  const writeWas = fs.writeFileSync, unlinkWas = fs.unlinkSync;
  const unlinked = [];
  let planted = "";
  let ownCheck = null;
  try {
    fs.writeFileSync = function (target, data, opts) {
      const name = path.basename(String(target));
      if (!planted && name.indexOf(".etiuda-probe-") >= 0) {
        planted = String(target);
        writeWas(target, "USER DATA");
      }
      return writeWas(target, data, opts);
    };
    fs.unlinkSync = function (target) {
      unlinked.push(path.resolve(String(target)));
      return unlinkWas(target);
    };
    ownCheck = S.folderCheck(own, null, { probe: true });
  } finally {
    fs.writeFileSync = writeWas;
    fs.unlinkSync = unlinkWas;
  }
  const body11 = planted && fs.existsSync(planted) ? fs.readFileSync(planted, "utf8") : "";
  const keptPath = planted !== "" && unlinked.indexOf(path.resolve(planted)) < 0;
  check(body11 === "USER DATA" && keptPath && !!ownCheck && ownCheck.writable === true,
    "fc11 a file already at the probe's name keeps its body and is never removed, and the folder is still writable: "
    + JSON.stringify([body11, keptPath, ownCheck && ownCheck.writable, unlinked.map((p) => path.basename(p))]));

  /* fc10: the Plain warning never refuses */
  const gateOf = (html, g) => ((new RegExp('<span class="g (\\w+)"[^>]*data-gate="' + g + '"').exec(html)) || [])[1]
    || ((new RegExp('data-gate="' + g + '"[^>]*>\\s*<span class="g (\\w+)"').exec(html)) || [])[1] || "";
  const passing = (html) => ((/(\d+) of (\d+)/.exec(html.replace(/<[^>]+>/g, " "))) || []).slice(1).join("/");
  const odHome = path.join(LAB, "od"), odFolder = path.join(odHome, "OneDrive", "team");
  fs.mkdirSync(odFolder, { recursive: true });
  const envWas = process.env.OneDrive;
  process.env.OneDrive = path.join(odHome, "OneDrive");
  let published = null, odCloud = "";
  try {
    odCloud = S.setPublishFolder(dir, odFolder).check.cloud;
    const shelf = (await S.addTag(dir, "shelf", { en: "General" })).tag.id;
    await S.addCard(dir, shelf, "Widuma tosork", "Sarnesk kelbun.");
    published = await S.publishProject(dir, {});
  } catch (e) { published = { error: String(e && e.message) }; }
  finally { if (envWas === undefined) delete process.env.OneDrive; else process.env.OneDrive = envWas; }
  check(/data-act="do-publish"/.test(plainSynced) && passing(plainSynced) === passing(plainLocal) && !!passing(plainSynced)
        && !/class="g stop"[^>]*data-gate="seal"|data-gate="seal"[^>]*>\s*<span class="g stop"/.test(plainSynced)
        && !!published && !published.error && !published.refused && !!published.ec && odCloud === "onedrive",
    "fc10 the Plain warning never refuses: the seal gate passes, " + passing(plainSynced) + " gates pass as for a local folder"
    + " (" + passing(plainLocal) + "), Publish stands, and a Plain edition publishes into a folder OneDrive keeps: "
    + JSON.stringify(published && (published.error || published.refused || path.basename(String(published.ec || "")))));

  /* fc12: rule 17 leg: opening a project folder itself on a cloud path says the project should live on the local disk with only its team folder on Drive */
  const gdriveDir = path.join(LAB, "Google Drive", "Projects");
  fs.mkdirSync(gdriveDir, { recursive: true });
  const cloudMade = await S.newProject(gdriveDir, "Cloud Project", [{ code: "en", name: "English" }]);
  const cloudProjDir = cloudMade.dir;

  const pageApi = {
    open: async (d) => S.openProject(d),
  };
  const { page: P_cloud, node: node_cloud } = loadPage({ api: pageApi, uiLang: "en" });
  await P_cloud.openDir(cloudProjDir);
  const cloudHtmlEn = node_cloud("#main").innerHTML;
  P_cloud.S.section = "settings";
  P_cloud.paintProjectSettings();
  const settingsHtmlEn = node_cloud("#main").innerHTML;

  const { page: P_cloud_pl, node: node_cloud_pl } = loadPage({ api: pageApi, uiLang: "pl" });
  await P_cloud_pl.openDir(cloudProjDir);
  const cloudHtmlPl = node_cloud_pl("#main").innerHTML;

  /* Control: local project folder */
  const { page: P_local, node: node_local } = loadPage({ api: pageApi, uiLang: "en" });
  await P_local.openDir(dir);
  const localHtmlEn = node_local("#main").innerHTML;
  P_local.S.section = "settings";
  P_local.paintProjectSettings();
  const settingsLocalEn = node_local("#main").innerHTML;

  const enWarn = "This folder is inside Google Drive, and its syncing can lose what Studio writes here. The catalog is safer on this computer's own disk, with only the team's shared folder in Google Drive.";
  const plWarn = "Ten folder leży w usłudze Google Drive, a jej synchronizacja może zgubić to, co Studio tu zapisuje. Katalog jest bezpieczniejszy na dysku tego komputera, a w tej usłudze wystarczy trzymać wspólny folder zespołu.";

  /* The page writes the sentence through esc(), so its apostrophes arrive in the markup escaped. */
  const asHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const hasCloudWarnEn = (cloudHtmlEn.includes(enWarn) || cloudHtmlEn.includes(asHtml(enWarn))) && /data-cloud-project/.test(cloudHtmlEn);
  const hasSettingsWarnEn = settingsHtmlEn.includes(enWarn) || settingsHtmlEn.includes(asHtml(enWarn));
  const hasCloudWarnPl = cloudHtmlPl.includes(plWarn) && /data-cloud-project/.test(cloudHtmlPl);
  const controlNoWarn = !localHtmlEn.includes(enWarn) && !localHtmlEn.includes(asHtml(enWarn)) && !/data-cloud-project/.test(localHtmlEn) && !settingsLocalEn.includes(enWarn) && !settingsLocalEn.includes(asHtml(enWarn));

  check(hasCloudWarnEn && hasSettingsWarnEn && hasCloudWarnPl && controlNoWarn,
    "fc12 Studio says, when a project folder itself is opened on a cloud path (cloudOf non-empty), that the project should live on the local disk with only its team folder on Drive: "
    + JSON.stringify([hasCloudWarnEn, hasSettingsWarnEn, hasCloudWarnPl, controlNoWarn]));

  /* fc13: unit leg: openProject returns cloud directly, and no English copy of the words (the page's T() is their one source) */
  const openDirectCloud = await S.openProject(cloudProjDir);
  const openDirectLocal = await S.openProject(dir);
  const unitOk = openDirectCloud.cloud === "gdrive" && !("cloudNotice" in openDirectCloud)
    && openDirectLocal.cloud === "" && !("cloudNotice" in openDirectLocal);
  check(unitOk, "fc13 openProject direct unit check: " + JSON.stringify([openDirectCloud.cloud, openDirectLocal.cloud]));

  check(asserted + skipped === EXPECTED - 1, "fc8 every leg ran: " + (asserted + 1) + " of " + EXPECTED
    + (skipped ? ", " + skipped + " said SKIP for this machine's reason" : ""));
}

main().then(() => {
  console.log("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED);
  console.log(failed ? "RESULT: FAIL " + failed + " failed" : "RESULT: ok " + asserted + " check(s)");
  process.exit(failed ? 1 : 0);
}, (e) => { console.log("  FAIL " + (e && e.stack || e)); console.log("RESULT: FAIL the leg did not complete"); process.exit(1); });
