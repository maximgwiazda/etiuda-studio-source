/* THE WATCH OVER THE FOLDERS THIS STUDIO LEADS, STAT FIRST (board 885, S2).
 *
 *     import { folderStamp, WATCH_MS } from "./src/team-watch.mjs";
 *
 * The shell looks at every team it leads on focus and every WATCH_MS, so a desk's request is seen, and auto-admit lets it
 * in, while no screen is open (shell/main.js teamWatch). Nothing runs more often than that, and nothing reads a folder
 * that has not changed: a folder's stamp is made of stats alone, the stat of its desks/ folder, of each request under it
 * and of the team file and the file of openings beside them, and the list of desks under desks/ is read again only where
 * that folder's own stat moved. Only a stamp that differs from the last one acted on sends the watch into the folder.
 *
 * A request replaced inside a desk's own folder does not move desks/'s stat, which is why each request is stat'ed by
 * name: on NTFS and SMB a folder's time moves when an entry is added, removed or renamed in it, and not when a file two
 * levels down is written. The same is true of in-use.ec, catalog-answer.ec and stats.estat: a write of any
 * of them is a change this stamp has to show, or the five-minute pass would never see what a desk loaded. */
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";

const WATCH_MS = 5 * 60 * 1000;
const DESK_ID = /^k-[0-9a-f]{16}$/;
/* A working copy a desk sealed to the lead's box (board 962, stage 3), named as src/catalog-use.mjs COPY_FILE names it. */
const COPY_FILE = /^.+-([0-9a-f]{8})[.]ec$/;
let BESIDE = null;   /* the team file's name and the file of openings', the pinned engine's, read once */

/* A file's or folder's stat as text: its time to the millisecond and its size, "-" where it is not there, "?" where the
   stat failed otherwise (an unreachable share, read again only once it answers). */
function statOf(at) {
  try { const s = fs.statSync(at); return Math.round(s.mtimeMs) + ":" + s.size; }
  catch (e) { return e && e.code === "ENOENT" ? "-" : "?"; }
}

/* A desk folder's working copies, each by name and stat: a copy is named for its catalog and not for a fixed file, so the desk's
   folder is listed, one read per desk, beside the stats; "-" where there is none. */
function copiesOf(dir) {
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => COPY_FILE.test(n)).sort(); } catch (e) { return e && e.code === "ENOENT" ? "-" : "?"; }
  return names.length ? names.map(n => n + "=" + statOf(path.join(dir, n))).join(",") : "-";
}

/** The folder's stamp, from stats alone. `memo` (a Map the caller keeps) holds per folder the desks/ folder's stat and the
 *  desk ids last listed under it; the list is read again only where that stat moved, or where no list is held. */
function folderStamp(folder, memo) {
  const root = path.resolve(String(folder || ".")), desks = path.join(root, "desks");
  const dirAt = statOf(desks);
  let m = memo && memo.get(root);
  if (!m || m.dirAt !== dirAt) {
    let ids = [];
    if (dirAt !== "-" && dirAt !== "?") {
      try { ids = fs.readdirSync(desks).filter(n => DESK_ID.test(n)).sort(); } catch { ids = null; }
    }
    m = { dirAt, ids: ids || [] };
    if (memo && ids) memo.set(root, m);
  }
  if (!BESIDE) BESIDE = [Engine.teamRules().V2_TEAM_FILE, Engine.joinRules().JOINS_NAME];
  const deskStat = (id) => [id + "=" + statOf(path.join(desks, id, "join.json")),
    id + ":use=" + statOf(path.join(desks, id, "in-use.ec")), /* plant:txcu-890sm */
    id + ":answer=" + statOf(path.join(desks, id, "catalog-answer.ec")),
    id + ":stats=" + statOf(path.join(desks, id, "stats.estat")),
    /* A desk's seat certificate (board 980; src/desk-seat.mjs), rewritten at each new certificate, is read at the look it moves. */
    id + ":seat=" + statOf(path.join(desks, id, "seat.json")), /* plant:s3-seat-stamp */
    id + ":copies=" + copiesOf(path.join(desks, id))].join("|"); /* plant:s3-st-copy-stamp */
  return [dirAt].concat(m.ids.map(deskStat),
    BESIDE.map(n => n + "=" + statOf(path.join(root, n)))).join("|");
}

/** THE ROOT EDITIONS' STAMP (board 974, C2, the test architect's E1): each *.ec in the folder itself, by name, time and size. A
 *  newer edition this lead's other Studio sealed at the old key number changes neither the team file nor the desks, so the
 *  watch reads this beside folderStamp for a sealed team and seals it again at that look rather than the next start. The
 *  folder is listed again only where its own stat moved (a file renamed into it), so a quiet look lists nothing; each edition
 *  named is a stat. The folder's own stat is not in the stamp, so a write of another root file changes nothing here. */
function editionStamp(folder, memo) {
  const root = path.resolve(String(folder || ".")), at = statOf(root), k = "ec:" + root;
  let m = memo && memo.get(k);
  if (!m || m.at !== at) {
    let names = [];
    if (at !== "-" && at !== "?") {
      try { names = fs.readdirSync(root).filter(n => /\.ec$/i.test(n)).sort(); } catch { names = null; }
    }
    m = { at, names: names || [] };
    if (memo && names) memo.set(k, m);
  }
  return m.names.map(n => n + "=" + statOf(path.join(root, n))).join("|");
}

export { folderStamp, editionStamp, WATCH_MS };
