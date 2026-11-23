"use strict";
/* WHO THE SHELL ANSWERS: the top frame of Studio's own page, ui/index.html, and nothing else.
 * The address is compared as a path rather than as text, so the percent-encoding Chromium gives
 * a profile with a space or a Polish letter in it, and the drive letter's case, cannot tell two
 * spellings of the one file apart. CommonJS so that shell/main.js can require it.
 */
const path = require("node:path");
const { fileURLToPath } = require("node:url");

/** `frame` is an IPC event's senderFrame, `page` the absolute path of ui/index.html. */
function ownFrame(frame, page) {
  try {
    if (!frame || frame.parent !== null) return false;
    const u = new URL(String(frame.url || ""));
    if (u.protocol !== "file:") return false;
    u.search = ""; u.hash = "";
    const at = path.resolve(fileURLToPath(u)), want = path.resolve(page);
    return process.platform === "win32" ? at.toLowerCase() === want.toLowerCase() : at === want;
  } catch { return false; }
}

module.exports = { ownFrame };
