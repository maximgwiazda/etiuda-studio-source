"use strict";
/* WHAT AN ORGANISATION SET FOR THE AI SERVICE IN GROUP POLICY (board 992). Studio's shell asks Windows' reg tool, at its fixed
 * system path and on Windows alone, for the values of one key, HKLM\SOFTWARE\Policies\Etiuda, the key the desk reads its team
 * values from; src/customer-ai.mjs's aiPolicyFrom reads the four of them that are Studio's (AiProvider, AiEndpoint, AiModel,
 * AiKey) out of the text and passes over the rest. The one call reads and changes nothing, and asks for no subkey; where the
 * key is absent, the tool fails or the platform is another, the answer is "", which is no policy. tests/no-model.mjs 13 holds
 * this file to its exact statements: it is the fifth exception to claim 3. */
const { execFileSync } = require("node:child_process");
const REG_TOOL = "C:\\Windows\\System32\\reg.exe";
function aiPolicyText() { if (process.platform !== "win32") return "";
  try {
    return execFileSync(REG_TOOL, ["query", "HKLM\\SOFTWARE\\Policies\\Etiuda"], { windowsHide: true, timeout: 5000, encoding: "utf8", maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } catch { return ""; }
}
module.exports = { aiPolicyText };
