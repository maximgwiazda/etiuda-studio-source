"use strict";
/* THE RECORDS A FOLDER'S PLACE IS READ FROM (board 945, item 4; board 955, condition 2). The one program this
   file starts is Windows' reg tool at its fixed system path, on Windows alone, asking the engine's six fixed
   reads, which share one five-second deadline and change nothing. Off Windows it starts nothing and the io it
   returns names no root. Its one other read is a folder's listing, which the pin's driveSeen asks of it to find
   Drive's roots (src/engine.mjs driveLook). tests/no-model.mjs 12 holds this file to that shape. CommonJS, so
   the place slice can require it. The parsing is the shell's liveSyncIo, kept here because that function is
   not sliced: it carries the program. */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const REG_TOOL = "C:\\Windows\\System32\\reg.exe";

/** The io readSyncRecords takes: {env, reg, subkeys, readFile, drives}. Off Windows, empty. */
function syncIo() {
  if (process.platform !== "win32") return { env: {}, reg: function () { return ""; }, subkeys: function () { return []; }, readFile: function () { return ""; } };
  if (syncIo.cached) return syncIo.cached;
  /* A read the deadline cut short is reused for a minute, so a slow registry is not asked again at every lookup. */
  let held = false;
  held = !!(syncIo.partial && (Date.now() - syncIo.partialAt) < 60000); /* plant:r13-roots-soon */
  if (held) return syncIo.partial;
  const env = process.env || {};
  const values = {};
  const sub = {};
  const seenChild = {};
  function regText(buf) {
    const b = Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf == null ? "" : buf));
    let text;
    if (b.length >= 2 && b[0] === 0xFF && b[1] === 0xFE) text = b.slice(2).toString("utf16le");
    else if (b.length >= 4 && b[1] === 0 && b[3] === 0) text = b.toString("utf16le");
    else text = b.toString("utf8");
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    return text;
  }
  function hive(line) {
    const cu = "HKEY_CURRENT_USER\\", lm = "HKEY_LOCAL_MACHINE\\", hkcu = "HKCU\\", hklm = "HKLM\\";
    let s = String(line || "").trim();
    if (s.indexOf(cu) === 0) s = "HKCU:\\" + s.slice(cu.length);
    else if (s.indexOf(lm) === 0) s = "HKLM:\\" + s.slice(lm.length);
    else if (s.indexOf(hkcu) === 0) s = "HKCU:\\" + s.slice(hkcu.length);
    else if (s.indexOf(hklm) === 0) s = "HKLM:\\" + s.slice(hklm.length);
    return s;
  }
  function addChild(parent, name) {
    if (!parent || !name) return;
    const childKey = parent + "\n" + name;
    if (seenChild[childKey]) return;
    seenChild[childKey] = 1;
    if (!sub[parent]) sub[parent] = [];
    sub[parent].push(name);
  }
  function absorb(buf) {
    const lines = regText(buf).replace(/\r/g, "").split("\n");
    let key = "";
    const valueLine = /^[ \t]+(\S+)[ \t]+REG_\w+[ \t]+(.*?)[ \t]*$/;
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw.trim()) continue;
      if (raw.indexOf("ERROR:") === 0) continue;
      if (raw.indexOf("End of search") === 0) continue;
      const found = valueLine.exec(raw);
      if (found && key) {
        values[(key + "|" + found[1]).toLowerCase()] = found[2];
        continue;
      }
      const mapped = hive(raw);
      if (mapped.indexOf("HKCU:") === 0 || mapped.indexOf("HKLM:") === 0) {
        key = mapped;
        const cut = mapped.lastIndexOf("\\");
        if (cut > 0) addChild(mapped.slice(0, cut), mapped.slice(cut + 1));
      }
    }
  }
  const deadline = Date.now() + 5000;
  const queries = [
    ["query", "HKCU\\Software\\Microsoft\\OneDrive\\Accounts", "/s", "/v", "UserFolder"],
    ["query", "HKCU\\Software\\Google\\DriveFS", "/s", "/v", "DefaultMountPoint"],
    ["query", "HKLM\\SOFTWARE\\Policies\\Google\\DriveFS", "/s", "/v", "DefaultMountPoint"],
    ["query", "HKLM\\SOFTWARE\\Google\\DriveFS", "/s", "/v", "DefaultMountPoint"],
    ["query", "HKLM\\SOFTWARE\\WOW6432Node\\Google\\DriveFS", "/s", "/v", "DefaultMountPoint"],
    ["query", "HKCU\\Network", "/s", "/v", "RemotePath"]
  ];
  let whole = true;
  for (let i = 0; i < queries.length; i++) {
    const left = deadline - Date.now();
    if (left < 1) { whole = false; break; }
    try {
      /* A missing key exits non-zero and names itself on stderr. That line is not a fault. */
      absorb(execFileSync(REG_TOOL, queries[i], { windowsHide: true, timeout: left, encoding: "buffer", maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }));
    } catch (e) { /* a missing key is an empty record; a read the deadline cut leaves the records partial */ if (e && e.code === "ETIMEDOUT") whole = false; }
  }
  const io = {
    env: {
      APPDATA: env.APPDATA, LOCALAPPDATA: env.LOCALAPPDATA,
      OneDrive: env.OneDrive, OneDriveConsumer: env.OneDriveConsumer, OneDriveCommercial: env.OneDriveCommercial,
      USERPROFILE: env.USERPROFILE, USERNAME: env.USERNAME, HOMEDRIVE: env.HOMEDRIVE, HOMEPATH: env.HOMEPATH,
      SystemDrive: env.SystemDrive, PUBLIC: env.PUBLIC
    },
    reg: function (key, name) { return values[(String(key) + "|" + String(name)).toLowerCase()] || ""; },
    drives: function () { return syncIo.drives || []; },
    subkeys: function (key) { return sub[String(key)] ? sub[String(key)].slice() : []; },
    readFile: function (p) { try { return fs.readFileSync(p, "utf8"); } catch (e) { return ""; } }
  };
  /* Kept for the life of the process only when every read answered. A partial one is kept for a minute, then read again. */
  if (!whole) {
    syncIo.partial = io;
    syncIo.partialAt = Date.now();
    return io; /* plant:r13-roots-whole */
  }
  syncIo.partial = null;
  syncIo.cached = io;
  return io;
}

/** A folder's names, the one listing driveSeen asks for; src/engine.mjs driveLook asks it one folder at a time. */
function dirList(dir) {
  return fs.promises.readdir(dir);
}

module.exports = { syncIo, dirList };
