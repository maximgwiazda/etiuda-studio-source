"use strict";
/* HARNESS-ONLY PLANTED PROXY ANSWERS (2026-11-16): when launched from an unpackaged tree by a harness
 * with STUDIO_PROXY_PLANT naming a JSON file ({ answers: { <reg key>: <reg stdout | null> } }),
 * answers the pinned win-proxy.cjs from that file alone through marked stand-ins on node:child_process
 * (Symbol.for("etiuda.reg-stand")), never starting reg.exe, and throws on any unanswered query.
 * In a packaged Studio or outside a harness launch, opens no file and delegates straight to the pinned reader. */
const fs = require("node:fs");

const REG_TOOL = "C:\\Windows\\System32\\reg.exe";
const STAND = Symbol.for("etiuda.reg-stand");
const WIN_PROXY_SPEC = "../engine/pinned/shell/win-proxy.cjs";

function packagedHere(dir) {
  if (/[\\/]app\.asar([\\/]|$)/i.test(String(dir || ""))) return true;
  try {
    const e = require("electron");
    if (e && typeof e === "object" && e.app && e.app.isPackaged === true) return true;
  } catch { /* plain node */ }
  return false;
}

function readPlantedAnswers(file) {
  const raw = fs.readFileSync(String(file), "utf8");
  const doc = JSON.parse(raw);
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error("win-proxy-plant: planted file must be a JSON object");
  }
  const answers = doc.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    throw new Error("win-proxy-plant: planted file must hold an answers object");
  }
  const out = Object.create(null);
  for (const key of Object.keys(answers)) {
    const v = answers[key];
    if (v !== null && typeof v !== "string") {
      throw new Error("win-proxy-plant: answer for " + JSON.stringify(key) + " must be a string or null");
    }
    out[key] = v;
  }
  return out;
}

/** Chromium start-up proxy switches: from the planted file when allowed, else from the pinned reader. */
function startupProxySwitches(opts) {
  const o = opts || {};
  const plantFile = typeof o.plantFile === "string" ? o.plantFile : "";
  const isPackaged = Boolean(o.packaged) || packagedHere(__dirname); /* plant:proxy-plant-packaged */
  const isHarness = Boolean(o.harness); /* plant:proxy-plant-harness */
  if (isPackaged || !isHarness || !plantFile) return typeof o.fallback === "function" ? o.fallback() : require("../engine/pinned/shell/win-proxy.cjs").windowsProxySwitches();
  const answers = readPlantedAnswers(plantFile); /* plant:proxy-plant-unread */
  const cp = require("node:child_process");
  const at = require.resolve(WIN_PROXY_SPEC);
  let refused = null;
  const answer = (file, argv) => {
    const key = Array.isArray(argv) && argv.length === 2 && argv[0] === "query" ? argv[1] : null;
    if (file !== REG_TOOL || key === null || !Object.prototype.hasOwnProperty.call(answers, key)) {
      const err = new Error("win-proxy-plant: not a planted query: " + JSON.stringify([file, argv]));
      if (!refused) refused = err;
      throw err;
    }
    return answers[key];
  };
  const missing = () => Object.assign(
    new Error("ERROR: The system was unable to find the specified registry key or value."),
    { status: 1, code: 1 }
  );
  const standIn = {
    execFileSync: (file, argv) => { const t = answer(file, argv); if (t === null) throw missing(); return t; },
    execFile: (file, argv, opt, cb) => {
      const done = typeof opt === "function" ? opt : cb;
      let t;
      try { t = answer(file, argv); } catch (e) { if (typeof done === "function") done(e, "", ""); return {}; }
      if (t === null) { if (typeof done === "function") done(missing(), "", ""); } else if (typeof done === "function") done(null, t, "");
      return {};
    },
  };
  standIn.execFileSync[STAND] = true;
  standIn.execFile[STAND] = true;
  const savedCp = { execFileSync: cp.execFileSync, execFile: cp.execFile };
  const cached = require.cache[at];
  delete require.cache[at];
  let switches;
  try {
    cp.execFileSync = standIn.execFileSync;
    cp.execFile = standIn.execFile;
    switches = require(at).windowsProxySwitches();
  } finally {
    cp.execFileSync = savedCp.execFileSync;
    cp.execFile = savedCp.execFile;
    if (cached) require.cache[at] = cached; else delete require.cache[at];
  }
  if (refused) throw refused; /* plant:proxy-plant-unanswered */
  return switches;
}

module.exports = { startupProxySwitches, readPlantedAnswers };
