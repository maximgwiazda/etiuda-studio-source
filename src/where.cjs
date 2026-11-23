"use strict";
/* WHERE A FOLDER IS, as far as its path says: on a client's synced folder, on a share, or on the system disk. Two questions asked in
 * two places (src/studio.mjs for what a catalog's folder says about itself, shell/main.js through src/root-hold.cjs for whether a
 * projects folder can be shared), so the answer is one function. CommonJS for the shell; studio.mjs imports it.
 */
const fs = require("node:fs");
const path = require("node:path");

/* A drive letter other than the system's may be a share Windows has mapped, which Studio cannot tell apart without asking
   another program, so it says nothing about it rather than "this computer only". Elsewhere every absolute path is the disk's. */
function onSystemDisk(at, env) {
  if (!/^[a-z]:/i.test(path.resolve(at))) return true;
  const sys = String((env && env.SystemDrive) || "C:").slice(0, 2).toLowerCase();
  return path.resolve(at).slice(0, 2).toLowerCase() === sys;
}
function cloudOf(at, env) {
  const e = env || {}, low = (p) => path.resolve(String(p)).toLowerCase().replace(/[\\/]+$/, "") + path.sep;
  const under = (root) => !!root && low(at).startsWith(low(root));
  const biz = e.OneDriveCommercial || "";
  if (biz && under(biz)) return "onedrive";
  if (under(e.OneDriveConsumer) || under(e.OneDrive)) return "onedrive";
  /* A LIBRARY THE CLIENT SYNCS sits one folder down in a folder named for its tenant, beside the client's own, and is named
     "<site> - <library>": the tenant's folder itself, and a folder of the person's own that carries the tenant's name,
     are not one. Any tenant: the first by OneDriveCommercial, another by its own "OneDrive - <tenant>" folder beside it. */
  const homeDir = biz ? path.dirname(path.resolve(biz)) : e.USERPROFILE ? path.resolve(String(e.USERPROFILE)) : "";
  if (homeDir) {
    const rel = path.relative(homeDir, path.resolve(String(at))).split(/[\\/]/);
    if (rel.length >= 2 && rel[0] && rel[0] !== ".." && !path.isAbsolute(rel[0]) && / - /.test(rel[1])) {
      const tenant = rel[0], first = biz ? path.basename(biz).replace(/^OneDrive - /i, "") : "";
      let other = false;
      try { other = fs.statSync(path.join(homeDir, "OneDrive - " + tenant)).isDirectory(); } catch { other = false; }
      if ((first && first !== path.basename(biz) && first.toLowerCase() === tenant.toLowerCase()) || other) return "sharepoint";
    }
  }
  if (/[\\/]OneDrive( - [^\\/]+)?([\\/]|$)/i.test(at)) return "onedrive";
  if (/[\\/]Dropbox( \([^\\/)]+\))?([\\/]|$)/i.test(at)) return "dropbox";
  if (/[\\/]Google Drive([\\/]|$)/i.test(at) || /^[a-z]:[\\/](My Drive|Shared drives|Mój dysk|Dyski współdzielone)([\\/]|$)/i.test(path.resolve(String(at))))
    return "gdrive";
  return "";
}

module.exports = { cloudOf, onSystemDisk };
