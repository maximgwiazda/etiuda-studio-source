"use strict";
/* WHETHER A KEYRING ANSWERS ON LINUX'S SESSION BUS, asked before Chromium starts so that libsecret is named only where a
   keyring already runs unlocked. The one program it starts is dbus-send at its fixed system path, on Linux alone, asking
   three fixed questions that read and change nothing; tests/no-model.mjs 10 holds this file to exactly that shape, so a
   second program, question, argument or platform is a change to that claim first. CommonJS, so the shell can require it. */
const { execFileSync } = require("node:child_process");

const BUS_TOOL = "/usr/bin/dbus-send";

/** Whether a secret service already running (asking whether its name has an owner starts nothing) has a default collection
 *  that is unlocked. Asking libsecret for one that is not running starts gnome-keyring by D-Bus activation, which raised a
 *  prompt for a new keyring's password and held the program; a locked one would ask to be unlocked. Off Linux, false. */
function keyringAnswers() {
  if (process.platform !== "linux") return false;
  const ask = (dest, at, method, ...args) => {
    try {
      return String(execFileSync(BUS_TOOL, ["--session", "--print-reply=literal", "--reply-timeout=1500", "--dest=" + dest, at, method].concat(args),
        { encoding: "utf8", timeout: 3000, windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }));
    } catch { return ""; }
  };
  if (!/^\s*boolean true\s*$/.test(ask("org.freedesktop.DBus", "/org/freedesktop/DBus", "org.freedesktop.DBus.NameHasOwner", "string:org.freedesktop.secrets"))) return false;
  const at = ask("org.freedesktop.secrets", "/org/freedesktop/secrets", "org.freedesktop.Secret.Service.ReadAlias", "string:default").trim();
  if (!/^\/org\/freedesktop\/secrets\/[A-Za-z0-9_/]+$/.test(at)) return false;
  return /^\s*variant\s+boolean false\s*$/.test(ask("org.freedesktop.secrets", at, "org.freedesktop.DBus.Properties.Get",
    "string:org.freedesktop.Secret.Collection", "string:Locked"));
}

module.exports = { keyringAnswers };
