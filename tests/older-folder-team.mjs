/* A TEAM KEPT FOR A SHARED FOLDER, AS AN OLDER STUDIO LEFT IT (the folder team's removal, Max, 2026-11-22 15:37: "remove it, burn it with fire").
 *
 *     import { olderFolderTeam } from "./older-folder-team.mjs";
 *     const made = await olderFolderTeam(dir, { key, passphrase, teamId, teamKeys });
 *
 * Studio makes no team at a plain folder any more (setTeamSealed refuses one, tests/team-seal.mjs fh4), but the legs that hold what Studio
 * still does with a team it keeps for a folder (choose, leave, read, refuse) need one to stand in the folder. This writes what setTeamSealed
 * wrote when it made a new team there: the signed team file, sealed, listing the project's catalog with nobody on the roster, with the
 * recovery copy where `teamKeys` holds the key, and the project's seal mark. It answers {folder, created, team, written} as that verb did.
 *
 * `o.relay` puts the team on the relay instead (the file names a relay, as a team started there does), for the legs whose subject is what
 * Studio does with a relay team. With `o.teamsFile` it also keeps the team in that teams file with its folder, as the shell's seal did, and
 * with `o.relay` the entry names the relay (the folder then stands for the mirror, as the watch reads it).
 * It is a fixture and nothing Studio runs. */
import fs from "node:fs";
import path from "node:path";
import { newTeam, writeTeam, withRecovery, recoveryOf, withChannel } from "../src/team.mjs";
import { chooseSealed } from "../src/team-store.mjs";
import { readKeyFile } from "../src/sign.mjs";

const RELAY = { rt: "9b".repeat(16), url: "https://etiuda.dev" };

export async function olderFolderTeam(dir, o) {
  const opts = o || {}, home = path.resolve(dir);
  const projectAt = path.join(home, "project.json");
  const project = JSON.parse(fs.readFileSync(projectAt, "utf8"));
  const folder = path.resolve(String(project.folder));
  const draftName = typeof project.draft === "string" && project.draft ? project.draft : "draft.json";
  const catalog = String(JSON.parse(fs.readFileSync(path.join(home, draftName), "utf8")).id);
  const key = readKeyFile(opts.key);
  let team = newTeam({ id: opts.teamId, catalogs: [catalog], lead: { keyId: key.keyId, public: key.public }, sealed: true, exportsSealed: true });
  if (opts.relay) team = withChannel(team, Object.assign({ kind: "relay" }, RELAY), { format: 1, kind: "etiuda-ring", keys: [] });
  const teamKey = opts.teamKeys && opts.teamKeys[team.id] && opts.teamKeys[team.id][team.epoch];
  if (teamKey) team = withRecovery(team, teamKey, recoveryOf(opts.key, opts.passphrase));
  const written = (await writeTeam(folder, team, { key: opts.key, passphrase: opts.passphrase })).team;
  fs.writeFileSync(projectAt, JSON.stringify(Object.assign({}, project, { sealedTeam: written.id }), null, 1) + "\n");
  if (opts.teamsFile) {
    chooseSealed(opts.teamsFile, written.id, true, folder, written);
    if (opts.relay) {
      const doc = JSON.parse(fs.readFileSync(opts.teamsFile, "utf8").replace(/^﻿/, ""));
      doc.teams[written.id].relay = Object.assign({}, RELAY);
      fs.writeFileSync(opts.teamsFile, JSON.stringify(doc, null, 1) + "\n");
    }
  }
  return { folder, created: true, written: JSON.parse(JSON.stringify(written)),
    team: { id: written.id, epoch: written.epoch, catalogs: 1, sealed: true, lists: true, exportsSealed: true, recovery: written.recovery !== undefined } };
}
