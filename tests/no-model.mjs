/* NOTHING IN THE SHIPPED PACKAGE CAN CALL A MODEL BUT THE CUSTOMER'S OWN. Enterprise pack item 3, and Maxim's ruling of
 * 2026-09-28 13:19 that "Etiuda's own code calls no model", read by him again on 2026-11-11 18:44: "Etiuda own code calling
 * no model was about not implementing a model such as Jev or Claude out of the box. But we made plans for allowing customers
 * bring in their own API to Studio", and at 18:59: "it's supposed to be a general capability for adding API from any one
 * frontier model out there". So Studio ships no model and no key, and the one way a model is reached is the service the
 * person or their organisation's Group Policy configured (board 992): src/customer-ai.mjs builds the request, src/wire.cjs's
 * AI door sends it to the configured endpoint alone, and claims 2, 4, 11, 13 and 14 hold that and nothing more.
 *
 *     node tests/no-model.mjs
 *
 * WHAT IS SCANNED IS WHAT A CUSTOMER GETS, and it is read out of electron-builder.js's own
 * allowlist rather than named here, so a file added to the package is scanned the day it is
 * added. Each entry is either one file or `folder/**`; an entry of any other shape, or a folder
 * that is not on disk, stops the run (exit 78, NO VERDICT) rather than being skipped, because a
 * scan that read nothing has proved nothing. `engine/pinned/**` is fetched by
 * tools/engine-fetch.mjs, so that has to have run.
 *
 * THE CLAIMS, each a question asked of the bytes:
 *
 *   1  no file of Studio's own is a provider module (a basename containing "provider")
 *   2  no shipped file, the pinned engine's included, carries a model vendor's endpoint or the
 *      header names such an endpoint wants (the two things a client cannot be written without), but on the lines claim 14
 *      holds in src/customer-ai.mjs and AI_HEADERS' one statement in src/wire.cjs, each standing exactly once
 *   3  no file of Studio's own, the files of claims 8, 10, 11, 12 and 13 apart, reaches a network or starts a program: no fetch call (the word in a
 *      sentence is not one), no http, https, http2, net, tls, dgram, dns or child_process module
 *      named in ANY form (`from "x"`, `import("x")`, `require("x")`, with or without `node:`, a
 *      subpath such as dns/promises included), no XMLHttpRequest, WebSocket, EventSource or
 *      electron net; and none of the five doors found around those on 2026-10-01 (board 836): Electron's
 *      utilityProcess, shell.openExternal but for Studio's one maker link at its fixed address and its one release page
 *      (board 991: the kept version note's page on etiuda.dev, admitted again by src/update-note.mjs releasePage) and its one
 *      sign-in page (board 980, stage 2: a sign-in provider's page, admitted by src/wire.cjs identityAuthorize) and its one Buy (board 1020:
 *      the provider's portal or the team's order page, built by src/buy-path.cjs buyAddress from the kept state), Module._load,
 *      a native binding, a worker given code to eval, or a module name joined from strings. The `command` provider that used to be here ran a program the customer
 *      named, which is a model call by another door, so a shipped file that starts a program is
 *      read as a model path until somebody says why it is not. UNSEEN, on purpose: an aliased
 *      fetch (`const send = fetch; send(u)`) is deliberate evasion, and reading for it would
 *      cost false positives on prose. OUTSIDE THE SCAN, and written down so the boundary is not implicit (the test
 *      architect's C1, 2026-11-01 14:21): this claim reads Studio's own files, not engine/pinned. The one worker given code
 *      to eval a running Studio held, the pinned engine's folder syncer, went with Studio's shared-folder syncer (A-S5)
 *   4  no file of Studio's own ships a key or keeps one where it should not: no literal of a vendor key's shape anywhere,
 *      not the old provider settings file's kind, and no "AI key" or "API key" wording or api_key field outside the AI
 *      service's own files (KEY_FILES: its module, its door, the shell that seals the key, the bridge, the page and its
 *      words). That the key is kept only sealed is tests/customer-ai.mjs's, which seals one and reads the file back
 *   5  the scanner is proved on planted faults, one per claim and one per form of a specifier:
 *      each is found in a file made for it, and the same scan of the clean stand-ins finds
 *      nothing, so a green run means the patterns work and not that they match nothing
 *   6  a CLOSED WORLD for packages (numbered last so that 1 to 5 keep the numbers reports cite):
 *      Studio declares no production `dependencies` (nor `optionalDependencies`), so a file of
 *      Studio's own may import only a relative path, a `node:` module, `electron` or a `file:`
 *      URL, and package.json must keep both fields empty. This needs no list of vendor SDKs to
 *      keep current: an SDK, however named, is a specifier outside the world
 *   7  the pinned engine files the package ships, its exclusions honoured, reach no network and
 *      start no program, the engine's lint pair excepted until the engine moves its lint out of tests/,
 *      the proxy reader of claim 8, and the proxy module of claim 15
 *   8  the ONE exception to claims 3 and 7 (the ruling of 2026-10-01 20:36): the pinned engine's
 *      shell/win-proxy.cjs, which Studio's shell runs and the package ships, may start
 *      Windows' reg tool at its fixed system path, asking for three keys, each once a read: machine policy,
 *      then either the user's or the machine's Internet Settings and Connections. Claim 3 does not
 *      read that file, claim 8 does, with its comments taken out as claim 15 reads its own, and it holds the file to the
 *      exact statements that make the exception: the one require of child_process naming its two functions, the path, the
 *      keys, the one call of each with its arguments and options (the read before Chromium starts, which waits, and the read
 *      again, which does not, the same query of the same keys; engine 96463644), each call's options passed through the
 *      engine's reg guard naming that very function (engine 9619e6e6), and the one export. Anything else in the file that
 *      starts a program, reaches a network, names either function or exports is claim 8, and the same text in any other
 *      file is claim 3
 *   9  what Studio's own code reads of the pinned engine at run time, the package carries (board
 *      865): every pinned path it names survives the allowlist, and in a lab holding only what the
 *      allowlist ships, every getter of src/engine.mjs runs. Not a model claim; it is here because
 *      this is the file that reads the allowlist, and claim 7 is its other half
 *  10  the SECOND exception to claim 3 (the ruling of 2026-10-08 15:27): Studio's own src/keyring-bus.cjs may start
 *      dbus-send at its fixed system path, on Linux alone, asking the session bus three fixed questions about the keyring
 *      that read and change nothing. Held as claim 8 holds its file: the one require, the path, the platform test as the
 *      function's first statement, the one call and its options, each of the three questions and the one export, exactly
 *      once; anything else there that starts a program, asks the bus, exports or reaches a network is claim 10, and the
 *      same text in any other file is claim 3
 *  11  the THIRD exception to claim 3 (board 900, relay slice 1; the relay ruled by Maxim 2026-10-15 10:59 to 11:00): Studio's
 *      one door to the network, src/wire.cjs (CLAUDE.md), may call the relay at https://etiuda.dev/relay/v1/,
 *      and open the relay's socket at the same path, which a development tree alone may move with ETIUDA_RELAY_ORIGIN to
 *      another https address on etiuda.dev of the form /<name>/v1/ (staging's, Claude alpha's ruling of 2026-10-26), and, in a
 *      test service build alone (its asar's test service fields accepted by src/signin-lab.cjs), call and open the socket of
 *      staging's relay at https://etiuda.dev/relay-staging/v1/ beside the relay (Max, 2026-11-13 10:26: "yes, of course Studio
 *      may reach the test relay in tests builds"), an ordinary build reaching what it did before (11bf), and,
 *      since board 936 S6, POST to the licence service by a route's name
 *      under its one address (LICENCE_ORIGIN, https://etiuda.dev/licence/v1/), which a development tree alone may move with
 *      ETIUDA_LICENCE_ORIGIN by the same rule (Claude alpha's ruling
 *      on the test architect's C5), and, since board 991 (Max's ruling of 2026-10-06 22:07: "Each program reads a small
 *      signed version note (form B) from etiuda.dev"), GET Studio's own version note at that address's note/studio, with no
 *      body and no argument, its answer read to NOTE_MAX bytes and no further; an installed copy ignores either variable,
 *      and, since board 980 stage 2 (Max, 2026-11-11 22:14: "I agree!", to sign-in as the only way to hold a paid seat), admit
 *      a sign-in provider's page for the browser and POST its token request only at IDENTITY_HOSTS' fixed hosts, https, in
 *      canonical form, with no port, user or fragment, the token request with no query, a form of at most IDENTITY_MAX_SEND
 *      bytes and an answer read to IDENTITY_MAX_BYTES, and listen on 127.0.0.1 alone at a port the system picks for the one
 *      GET of "/" the browser brings back, closed once answered or after LOOPBACK_WAIT_MS;
 *      and every one of these calls goes through Chromium's request with a company proxy's sign-in listener (claim 15's
 *      module), and the relay's socket through the proxy Chromium names for its address, as a tunnel to that same address;
 *      and nothing else is reached. Held as claims 8 and 10
 *      hold theirs: the one require of electron naming one module, the fixed addresses, each override's one statement with
 *      its installed-copy test and its shape, relayAdmitted (a URL only when its resolved protocol, host and path begin
 *      with that door's one path, with no port, user, query or fragment, and with no "." or ".." segment in the URL as
 *      given), each refusal (that judgement for a relay URL, anything not a route's name) as the first statement before
 *      its call, the three calls of the one bounded call, its byte cap, and that call's one fetch with its options (no
 *      redirect followed, nothing cached, its abort signal) through the proxy module's request with its sign-in listener or
 *      Electron's fetch where the runtime has no request, the one require of the proxy module, the one socket with its
 *      opening told, reached through the proxy module only after the address is judged and only with Chromium's resolver, the system's certificate
 *      roots merged into the runtime's bundle as the file loads (board 989), and the one export, each exactly once; anything
 *      else there that reaches a network, names another address, calls the bounded call again, reads another variable,
 *      requires, imports, evaluates or exports is claim 11, and the same text in any other file is claim 3
 *  12  the FOURTH exception to claim 3 (board 945, item 4; the test architect, 2026-10-29 19:51; board 955, condition 2):
 *      Studio's own src/sync-roots.cjs may start Windows' reg tool at its fixed system path, on Windows alone, asking the
 *      engine's six fixed reads (the two machine-wide DriveFS keys among them, query only), which share one five-second
 *      deadline, list a folder's names for the pin's driveSeen, and export the io readSyncRecords takes and that listing.
 *      Off Windows it starts nothing and that io names no root. Held as claim 10 holds its file: the one child_process
 *      require naming execFileSync, the fs require, the path, the platform test as the function's first statement, the one
 *      deadline, the six reads, the one call, the one listing and the one export, each exactly once. A seventh read,
 *      another key or verb however it is built, a second listing, or anything else there that starts a program is claim
 *      12, and the same text in any other file is claim 3
 *  13  the FIFTH exception to claim 3 (board 992, the customer's own AI service): Studio's own src/ai-policy.cjs may start
 *      Windows' reg tool at its fixed system path, on Windows alone, for one read of HKLM\SOFTWARE\Policies\Etiuda's own
 *      values, and export the one function. Held as claim 12 holds its file; another key, a subkey, another verb, a second
 *      call or anything else there that starts a program is claim 13, and the same text in any other file is claim 3
 *  14  THE ONE ADDRESS (board 992): a request to an AI service goes only to the endpoint the person or the policy configured
 *      for the service they chose, or that service's own published address where they named none. Held three ways. In
 *      src/customer-ai.mjs a vendor's address stands only on its own service's line of PROVIDERS, each line, the routes and
 *      the version header word for word and once, the one builder hands endpointFor's address and nothing else, the door is
 *      called once with the builder's request, and no other address (no "://") is written there; in shell/main.js the door
 *      is handed to aiAsk once, and no other file of Studio's own names it. And at run time, through the real src/wire.cjs
 *      with Electron's net stood in: each service, configured with an address, reaches that address alone; with none, its
 *      own published one alone and never another service's; an address the door must refuse sends nothing. A copy of the
 *      module whose builder takes another service's address is the control that the run-time reading has teeth
 *  15  the SIXTH exception, to claim 7 (a large company's proxy that asks for a sign-in, and the relay's socket behind one):
 *      the pinned engine's shell/proxy-net.cjs, which src/wire.cjs alone requires and the package ships, may open Chromium's
 *      request for the address it is handed with a sign-in listener that answers a proxy alone, and for the relay's socket
 *      ask the resolver it is handed which proxy the address goes through, connect to that proxy, ask it to CONNECT to the
 *      socket's own host and port, and open TLS and the socket inside; where Chromium's answer names several, the next is
 *      tried only when one cannot be reached, in Chromium's order, as Chromium's own fallback does (engine ba430728), and a
 *      lookup that fails, is late or names nothing is no route at all (engine d4caa7d2). Held as claim 8 holds its file, read
 *      with its comments taken out, since the engine's own sentences name what it replaces: the requires, the one request with
 *      its options, the one listener and its proxy-only test, the one resolver call and what carries its answer to the walk
 *      (no route for a failed lookup, the list from that answer alone, the walk over it), the one connect to the proxy, the one
 *      tunnel to the socket's host from an entry of that list, the one TLS with its certificate checked (nothing there turns
 *      the check off), the direct socket handed in, and the one export, each exactly once; anything else there
 *      that reaches a network, requires, connects, resolves or exports is claim 15, and naming the module in any file of
 *      Studio's own but src/wire.cjs is claim 3
 *  16  the SEVENTH exception, to claim 3 (the harness proxy planting hook): Studio's own src/win-proxy-plant.cjs may
 *      stand in node:child_process's execFileSync and execFile with marked stand-ins while loading win-proxy.cjs fresh,
 *      in an unpackaged harness launch alone, and never call either real function. Held as claim 8 holds its file, with
 *      its comments taken out; anything else there that starts a program, touches child_process, lifts the refusal or
 *      reaches a network is claim 16, and the same text in any other file is claim 3
 *
 * NOT CLAIMED: a key setting worded so that claim 4 does not read it ("Model key", "Klucz API",
 * `store.modelKey`). Such a setting still needs claim 3's network or claim 6's package to reach a
 * model, so it is read through those and not by guessing words.
 *
 * HOW THE COUNTS ARE TAKEN. "N files" is the number of files the allowlist expanded to, read as
 * UTF-8, listed by walking each `folder/**` entry recursively; "own" is the files whose path
 * does not start with engine/pinned/. A pattern hit is counted once per file per claim. A
 * "specifier" is the quoted string after `from`, after `import` (side-effect form), inside
 * `import(` or inside `require(`.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { jsWithoutComments } from "./source-text.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const PINNED = "engine/pinned/";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function noVerdict(why) {
  process.stdout.write("no-model: " + asserted + " assertion(s), NO VERDICT, " + why + "\n");
  process.exit(78);
}

/* ---- the patterns ------------------------------------------------------------------------- */

const ENDPOINT = /api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis\.com|api\.x\.ai|api\.mistral\.ai|api\.cohere\.(ai|com)|openrouter\.ai|x-api-key|x-goog-api-key|anthropic-version|\/v1\/messages|chat\/completions/i;
const NODE_NET = "http|https|http2|net|tls|dgram|dns|child_process";
/* a module named in any form: after from, import, import( or require(, quoted, with or without
   node:, with an optional subpath */
const NAMED_MODULE = new RegExp("(?:\\bfrom\\s*|\\bimport\\s*\\(?\\s*|\\brequire\\(\\s*)[\"'`](?:node:)?(?:"
  + NODE_NET + ")(?:/[^\"'`]*)?[\"'`]");
const NETWORK = [
  /\bfetch\(/, /\.fetch\b/, /\bawait\s+fetch\b/, NAMED_MODULE,
  new RegExp("node:(?:" + NODE_NET + ")\\b"),
  /\bXMLHttpRequest\b/, /\bnew\s+WebSocket\b/, /\bEventSource\b/, /\bnet\.(request|fetch)\b/,
  /\bsendBeacon\b/,
  /* THE FIVE OLD BLIND SPOTS (board 836, measured 2026-10-01): a program started through Electron's utilityProcess or
     shell.openExternal, a module loaded by Module._load or a native binding, a worker given code to eval, and a module
     name built by joining strings (a file: URL or a relative path joined to its rest excepted, which can name no
     built-in module), which no pattern above can read. Studio's one openExternal, its maker link to a fixed address,
     is taken out of shell/main.js before these are read (claim3Text). */
  /\butilityProcess\b/, /\bopenExternal\b/, /\b_load\s*\(/, /\b_linkedBinding\b/, /\bprocess\s*\.\s*binding\s*\(/,
  /* the pinned proxy module (claim 15) reaches a network for whoever requires it: src/wire.cjs alone does */
  /proxy-net(?:\.cjs)?["'`]/,
  /\bdlopen\b/, /\beval\s*:\s*(?:true|!0|1)\b/, /(?:\b(?:require|import)|\))\s*\(\s*["'`](?!file:|\.{1,2}\/)[^"'`\n]*["'`]\s*\+/,
];
const KEYSETTING = /\bAI key\b|\bAPI key\b|\bapi[_-]?key\b/i;
const PROVIDER_KIND = /etiuda-studio-provider/i;
/* A key's own shape, as the vendors print them (OpenAI and Anthropic "sk-", xAI "xai-", Google "AIza", Groq "gsk_"): a key
   written into a shipped file is a key shipped, whatever the file. */
const VENDOR_KEY = /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}|\bxai-[A-Za-z0-9]{20,}|\bAIza[0-9A-Za-z_-]{35}\b|\bgsk_[A-Za-z0-9]{20,}/;
/* The AI service's own files, where its key may be named: its module, its door, the shell that seals it, the bridge, the
   page and its words. */
const KEY_FILES = ["src/customer-ai.mjs", "src/wire.cjs", "shell/main.js", "shell/preload.js", "ui/app.js", "ui/lang.js"];

/* every specifier a file names: `import x from "s"`, `export * from "s"`, `import "s"`,
   `import("s")`, `require("s")`. A bare `import "s"` counts only at the start of a statement, so the
   word import at the end of a string is not read as one */
const SPECIFIER = /(?:\b(?:import|export)\b[^;"'`()]{0,300}?\bfrom\s*|\bimport\s*\(\s*|\brequire\(\s*|(?:^|[;}])[ \t]*import[ \t]*)["'`]([^"'`\n]+)["'`]/gm;
const allowedSpecifier = s => /^\.{1,2}\//.test(s) || s.indexOf("node:") === 0 || s === "electron"
  || s === "original-fs" || s.indexOf("file:") === 0;
function outsiders(text) {
  const bad = [];
  for (const m of text.matchAll(SPECIFIER)) if (!allowedSpecifier(m[1])) bad.push(m[1]);
  return bad;
}
/** The problems in package.json's text: a production dependencies field that is not empty. */
function depsProblems(text) {
  let j; try { j = JSON.parse(text); } catch (e) { return ["package.json is not JSON"]; }
  return ["dependencies", "optionalDependencies"]
    .filter(k => j[k] !== undefined
      && !(j[k] && typeof j[k] === "object" && !Array.isArray(j[k]) && Object.keys(j[k]).length === 0))
    .map(k => k + " is not empty");
}

/* THE ONE EXCEPTION (claim 8): this file, its comments taken out (jsWithoutComments), and these statements, whitespace
   collapsed, each exactly once. Taken out, nothing in the file may still name the module, either function, the path or
   the keys, start another program, load another way, export, or match a claim 3 pattern. The second function (engine
   96463644) is the same reg query of the same keys without waiting; its one call is held as the first one is, and each
   call's options go through the engine's reg guard naming the function that runs them (engine 9619e6e6), so a call past
   the guard is a statement missing. */
const EXCEPTION_FILE = "engine/pinned/shell/win-proxy.cjs";
const EXCEPTION_STATEMENTS = [
  'const { execFile, execFileSync } = require("node:child_process");',
  'const REG_TOOL = "C:\\\\Windows\\\\System32\\\\reg.exe";',
  'const POLICY_KEY = "HKLM\\\\Software\\\\Policies\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Internet Settings";',
  'const USER_KEY = "HKCU\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Internet Settings";',
  'const USER_CONN_KEY = "HKCU\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Internet Settings\\\\Connections";',
  'const MACHINE_KEY = "HKLM\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Internet Settings";',
  'const MACHINE_CONN_KEY = "HKLM\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Internet Settings\\\\Connections";',
  'execFileSync(REG_TOOL, ["query", key], regOpts(execFileSync, { encoding: "utf8", windowsHide: true, timeout: 5000 }))',
  'execFile(REG_TOOL, ["query", key], regOpts(execFile, { encoding: "utf8", windowsHide: true, timeout: 5000 }), (e, out) => {',
  'module.exports = { proxySwitchesFrom, windowsProxySwitches, windowsProxyChange, proxyConfigOf, regOpts, STAND };',
];
const squash = s => s.replace(/\s+/g, " ");
const ELSEWHERE = [/child_process/, /\bexecFileSync\b/, /\bexecFile\b/, /\bREG_TOOL\b/, /\bexports\b/,
  /["'`](?:HK(?:CU|LM|U|CR|CC)|HKEY_[A-Z_]+):?\\\\[^"'`]/,
  /(?<![.\w])(?:spawn|spawnSync|exec|execSync|execFile|fork)\s*\(/,
  /\bimport\s*\(/, /\bcreateRequire\b/, /\beval\s*\(/, /\bnew\s+Function\b/, /\bprocess\s*\.\s*(?:binding|dlopen)\b/, /\bshell\s*:/];
/* THE SECOND EXCEPTION (claim 10), held the same way: the statements below each exactly once, and nothing left beside them
   that names the module, the function, the tool, asks the bus another question or starts a program. */
const BUS_FILE = "src/keyring-bus.cjs";
const BUS_STATEMENTS = [
  'const { execFileSync } = require("node:child_process");',
  'const BUS_TOOL = "/usr/bin/dbus-send";',
  'function keyringAnswers() { if (process.platform !== "linux") return false;',
  'execFileSync(BUS_TOOL, ["--session", "--print-reply=literal", "--reply-timeout=1500", "--dest=" + dest, at, method].concat(args), { encoding: "utf8", timeout: 3000, windowsHide: true, stdio: ["ignore", "pipe", "ignore"] })',
  'ask("org.freedesktop.DBus", "/org/freedesktop/DBus", "org.freedesktop.DBus.NameHasOwner", "string:org.freedesktop.secrets")',
  'ask("org.freedesktop.secrets", "/org/freedesktop/secrets", "org.freedesktop.Secret.Service.ReadAlias", "string:default")',
  'ask("org.freedesktop.secrets", at, "org.freedesktop.DBus.Properties.Get", "string:org.freedesktop.Secret.Collection", "string:Locked")',
  'module.exports = { keyringAnswers };',
];
const BUS_ELSEWHERE = [/child_process/, /\bexecFileSync\b/, /\bBUS_TOOL\b/, /\bask\s*\(/, /\borg\.freedesktop\./, /\bprocess\s*\.\s*platform\b/,
  /(?<![.\w])(?:spawn|spawnSync|exec|execSync|execFile|fork)\s*\(/, /\bimport\s*\(/, /\bcreateRequire\b/, /\beval\s*\(/, /\bnew\s+Function\b/,
  /\bprocess\s*\.\s*(?:binding|dlopen)\b/, /\bshell\s*:/, /\bexports\b/];
/* THE THIRD EXCEPTION (claim 11), held the same way: Studio's one door to the network, the relay at one fixed address and the
   licence service by a route's name under one (board 936 S6). */
const WIRE_FILE = "src/wire.cjs";
const WIRE_STATEMENTS = [
  'let loadedNet = null;',
  'try { const electron = require("electron"); electronSeen = true; loadedNet = electron.net; packagedDoor = !!(electron.app && electron.app.isPackaged === true); } catch {',
  /* board 989: the system's roots join the runtime's bundle, once, for the socket; nothing else of that module */
  'try { const tls = require("node:tls"); tls.setDefaultCACertificates([...new Set([...tls.getCACertificates("default"), ...tls.getCACertificates("system")])]); } catch {',
  'const LICENCE_ORIGIN = "https://etiuda.dev/licence/v1/";',
  /* the sign-in lab (src/signin-lab.cjs, null installed): its service before the override, and its provider's two addresses alone
     beside the fixed hosts (tests/signin-lab.mjs holds what the module takes; 2026-11-12) */
  'try { LAB = require("./signin-lab.cjs").lab; } catch {',
  /* the test service build's relay (Max, 2026-11-13 10:26): the switch is signin-lab's own testService, the address fixed */
  'let TESTING = false;',
  'try { TESTING = require("./signin-lab.cjs").testService === true; } catch {',
  'const LICENCE_AT = LAB && LAB.service ? LAB.service : !/[\\\\/]app\\.asar([\\\\/]|$)/i.test(__dirname) && /^https:\\/\\/etiuda\\.dev\\/[a-z][a-z0-9-]{0,40}\\/v1\\/$/.test(String(process.env.ETIUDA_LICENCE_ORIGIN || "")) ? String(process.env.ETIUDA_LICENCE_ORIGIN) : LICENCE_ORIGIN;',
  'function labAdmitted(parsed, raw, withQuery) { if (!LAB || !LAB.provider || parsed.href !== raw || parsed.username !== "" || parsed.password !== "" || parsed.hash !== "") return false; return withQuery ? parsed.origin + parsed.pathname === LAB.provider.authorize : parsed.search === "" && raw === LAB.provider.token; }',
  'const LICENCE_ROUTE = /^[a-z]+(?:\\/[a-z]+)?$/;',
  'const RELAY_ORIGIN = !/[\\\\/]app\\.asar([\\\\/]|$)/i.test(__dirname) && /^https:\\/\\/etiuda\\.dev\\/[a-z][a-z0-9-]{0,40}\\/v1\\/$/.test(String(process.env.ETIUDA_RELAY_ORIGIN || "")) ? String(process.env.ETIUDA_RELAY_ORIGIN) : "https://etiuda.dev/relay/v1/";',
  'const RELAY_SOCKET = "wss://" + RELAY_ORIGIN.slice("https://".length);',
  'const RELAY_TEST = TESTING ? "https://etiuda.dev/relay-staging/v1/" : "";',
  'const RELAY_TEST_SOCKET = RELAY_TEST ? "wss://" + RELAY_TEST.slice("https://".length) : "";',
  'const AI_ROUTE = /^[a-z]+(?:\\/[a-z]+)?$/;',
  'const AI_HEADERS = ["content-type", "authorization", "api-key", "x-api-key", "anthropic-version", "x-goog-api-key"];',
  'const AI_WAIT_MS = 180000;',
  'const AI_MAX_SEND = 2097152;',
  'const AI_MAX_BYTES = 4194304;',
  "function aiAdmitted(endpoint) { const raw = String(endpoint); let parsed = null; try { parsed = new URL(raw); } catch (err) { return false; } if (parsed.protocol !== \"https:\" || parsed.username !== \"\" || parsed.password !== \"\" || parsed.search !== \"\" || parsed.hash !== \"\") return false; if (!parsed.hostname || !/\\/$/.test(parsed.pathname) || /%2e/i.test(raw)) return false; return parsed.href === raw; }",
  'async function customerAiRequest(endpoint, route, headers, body) { if (!aiAdmitted(endpoint) || !AI_ROUTE.test(String(route)) || !headers || typeof headers !== "object" || Object.keys(headers).some((h) => AI_HEADERS.indexOf(h) < 0) || !Buffer.isBuffer(body) || body.length > AI_MAX_SEND) throw new Error(',
  'return bounded("the AI service", "POST", String(endpoint) + String(route), headers, body, AI_WAIT_MS, AI_MAX_BYTES);',
  "function relayAdmitted(url, origin) { const raw = String(url); let parsed = null; try { parsed = new URL(raw); } catch (err) { return false; } if (parsed.username !== \"\" || parsed.password !== \"\" || parsed.port !== \"\" || parsed.search !== \"\" || parsed.hash !== \"\") return false; const built = parsed.protocol + \"//\" + parsed.hostname + parsed.pathname; if (built.indexOf(origin) !== 0) return false; const given = raw.split(\"#\", 1)[0].split(\"?\", 1)[0]; const segments = []; let piece = \"\"; for (let i = 0; i < given.length; i++) { const ch = given[i]; if (ch === \"/\" || ch === \"\\\\\") { segments.push(piece); piece = \"\"; } else piece += ch; } segments.push(piece); for (let j = 0; j < segments.length; j++) { const decoded = segments[j].replace(/%2e/gi, \".\"); if (decoded === \".\" || decoded === \"..\") return false; } return true; }",
  'async function relayRequest(method, url, headers, body) { if (!relayAdmitted(url, RELAY_ORIGIN) && !(RELAY_TEST && relayAdmitted(url, RELAY_TEST))) throw new Error(',
  'return bounded("the relay", method, url, headers, body);',
  'async function licenceRequest(route, body) { if (!LICENCE_ROUTE.test(String(route))) throw new Error(',
  'return bounded("the licence service", "POST", LICENCE_AT + String(route), { "content-type": "application/json" }, body);',
  'const NOTE_MAX = 1024;',
  'async function licenceNote() { return bounded("the licence service", "GET", LICENCE_AT + "note/studio", {}, null, 0, NOTE_MAX); }',
  'async function bounded(what, method, url, headers, body, wait, cap) {',
  'if (cap && size > cap) { stop.abort(); throw new Error(what + " answered more than " + cap + " bytes"); }',
  'const res = await bound(wireFetch(String(url), { method: String(method), headers: headers, body: body || undefined, redirect: "error", cache: "no-store", credentials: "omit", signal: stop.signal }));',
  /* a company proxy (claim 15's module): every call is Chromium's request with the proxy's sign-in listener, Electron's fetch only
     where the runtime has no request; the socket asks the proxy Chromium's resolver names, after the address is judged.
     An installed copy whose module did not load does not open the door (proxyDoorShut); a development copy still does. */
  'let proxyNet = null;',
  'try { proxyNet = require("../engine/pinned/shell/proxy-net.cjs"); } catch {',
  'if (!proxyNet && proxyDoorShut()) return Promise.reject(new Error(proxyGap));',
  'if (!proxyNet && proxyDoorShut()) return null;',
  'let loadedSession = null;',
  'try { loadedSession = require("electron").session; } catch {',
  'const asker = proxyNet ? proxyNet.proxyAsker({ ask: (info) => (proxyAsk ? proxyAsk(info) : null), say: (line) => { if (proxySay) proxySay(line); } }) : null;',
  'function proxyAsking(ask, say) { proxyAsk = typeof ask === "function" ? ask : null; proxySay = typeof say === "function" ? say : null; }',
  'function wireFetch(url, init) {',
  'if (asker && typeof loadedNet.request === "function") return proxyNet.fetchThrough(loadedNet, url, init, asker.forRequest());',
  'return loadedNet.fetch(url, init); }',
  'function relayConnect(url, headers, on) { if (!(relayAdmitted(url, RELAY_SOCKET) || (RELAY_TEST_SOCKET && relayAdmitted(url, RELAY_TEST_SOCKET))) || typeof WebSocket !== "function") return null;',
  'const chosen = proxySession(); if (asker && chosen) return proxyNet.proxiedConnect(String(url), headers, on, { resolve: (u) => chosen.resolveProxy(u), direct: relaySocket, asker: asker });',
  'return relaySocket(String(url), headers, on); }',
  'function proxySession() { try { const s = loadedSession && loadedSession.defaultSession; return s && typeof s.resolveProxy === "function" ? s : null; } catch { return null; } }',
  'function relaySocket(url, headers, on) {',
  'const ws = new WebSocket(String(url), { headers: headers });',
  'ws.onopen = () => { if (typeof on.open === "function") on.open(); };',
  /* board 980, stage 2: the sign-in services at their fixed hosts, the page the browser opens, the token request through the
     one bounded call with its cap, and the loopback on 127.0.0.1 at a port the system picks, listening until the GET of "/" carrying the sign-in's state */
  'const IDENTITY_HOSTS = ["login.microsoftonline.com", "accounts.google.com", "oauth2.googleapis.com"];',
  'const IDENTITY_MAX_SEND = 16384;',
  'const IDENTITY_MAX_BYTES = 262144;',
  'const LOOPBACK_WAIT_MS = 300000;',
  'const http = require("node:http");',
  'function identityAdmitted(url, withQuery) { const raw = String(url); let parsed = null; try { parsed = new URL(raw); } catch (err) { return false; } if (labAdmitted(parsed, raw, withQuery)) return true; if (parsed.protocol !== "https:" || parsed.username !== "" || parsed.password !== "" || parsed.port !== "" || parsed.hash !== "" || (!withQuery && parsed.search !== "")) return false; if (IDENTITY_HOSTS.indexOf(parsed.hostname) < 0 || /%2e/i.test(raw)) return false; return parsed.href === raw; }',
  'function identityAuthorize(url) { return identityAdmitted(url, true) ? String(url) : ""; }',
  'async function identityRequest(url, form) { if (!identityAdmitted(url, false) || !Buffer.isBuffer(form) || form.length > IDENTITY_MAX_SEND) throw new Error(',
  'return bounded("the sign-in service", "POST", String(url), { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, form, 0, IDENTITY_MAX_BYTES);',
  'const server = http.createServer((req, res) => {',
  'if (ended || req.method !== "GET" || where !== "/") { res.writeHead(404, { connection: "close" }); res.end(); return; }',
  'server.listen(0, "127.0.0.1", () => {',
  'module.exports = { relayRequest, relayConnect, licenceRequest, licenceNote, customerAiRequest, identityAuthorize, identityRequest, identityListen, proxyAsking, LICENCE_ORIGIN, RELAY_ORIGIN, RELAY_TEST, NOTE_MAX, IDENTITY_HOSTS };',
];
/* THE FOURTH EXCEPTION (claim 12), held the same way: the statements below each exactly once, and nothing left beside them
   that starts a program, asks the registry another read, or uses another verb. */
const SYNC_FILE = "src/sync-roots.cjs";
const SYNC_STATEMENTS = [
  'const { execFileSync } = require("node:child_process");',
  'const fs = require("node:fs");',
  'const REG_TOOL = "C:\\\\Windows\\\\System32\\\\reg.exe";',
  'function syncIo() { if (process.platform !== "win32") return { env: {}, reg: function () { return ""; }, subkeys: function () { return []; }, readFile: function () { return ""; } };',
  'const deadline = Date.now() + 5000;',
  '["query", "HKCU\\\\Software\\\\Microsoft\\\\OneDrive\\\\Accounts", "/s", "/v", "UserFolder"],',
  '["query", "HKCU\\\\Software\\\\Google\\\\DriveFS", "/s", "/v", "DefaultMountPoint"],',
  '["query", "HKLM\\\\SOFTWARE\\\\Policies\\\\Google\\\\DriveFS", "/s", "/v", "DefaultMountPoint"],',
  '["query", "HKLM\\\\SOFTWARE\\\\Google\\\\DriveFS", "/s", "/v", "DefaultMountPoint"],',
  '["query", "HKLM\\\\SOFTWARE\\\\WOW6432Node\\\\Google\\\\DriveFS", "/s", "/v", "DefaultMountPoint"],',
  '["query", "HKCU\\\\Network", "/s", "/v", "RemotePath"]',
  'execFileSync(REG_TOOL, queries[i], { windowsHide: true, timeout: left, encoding: "buffer", maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] })',
  'fs.readFileSync(p, "utf8")',
  'fs.promises.readdir(dir)',
  'module.exports = { syncIo, dirList };',
];
/* Beside the statements, a registry path naming more than its hive, or one of reg's verbs as a word of its own, is another
   key or another verb asked however it is built (a list changed in place, a verb held in a variable): the hive names
   hive() maps ("HKCU\\", "HKEY_CURRENT_USER\\") end at the backslash and are not read as either. */
const SYNC_ELSEWHERE = [/child_process/, /\bexecFileSync\b/, /\bREG_TOOL\b/, /\bnode:fs\b/, /\brequire\s*\(/, /\bprocess\s*\.\s*platform\b/,
  /\["query"/, /\["(?:add|delete|export|import|copy|save|restore|flags|unload)"/,
  /["'`](?:HK(?:CU|LM|U|CR|CC)|HKEY_[A-Z_]+):?\\\\[^"'`]/, /["'`](?:query|add|delete|export|import|copy|save|restore|load|unload|flags|compare)["'`]/i, /* plant:nm12-key */
  /(?<![.\w])(?:spawn|spawnSync|exec|execSync|execFile|fork)\s*\(/, /\bimport\s*\(/, /\bcreateRequire\b/, /\beval\s*\(/, /\bnew\s+Function\b/,
  /\bprocess\s*\.\s*(?:binding|dlopen)\b/, /\bshell\s*:/, /\bexports\b/, /powershell|pwsh|cmd\.exe|dbus-send|reg\.exe/,
  /Date\.now\(\) \+ 5000/,
  /\bfs\s*(?:\.|\[)/]; /* plant:nm12-fs: the one fs member held is the readFile above; any other use of fs is claim 12 (the test architect's C1, 2026-10-29 23:44) */
const WIRE_ELSEWHERE = [/child_process/, /\bnet\b\s*\./, /\bloadedNet\b/, /\bWebSocket\b/, /\bwss?:\/\//, /\bhttps?:\/\//, /\brequire\s*\(/, /\bimport\b/,
  /\bcreateRequire\b/, /\beval\s*\(/, /\bnew\s+Function\b/, /\bprocess\s*\.\s*(?:binding|dlopen)\b/, /\bexports\b/, /\bglobalThis\b/,
  /\bredirect\s*:/, /\bAI_(?:ROUTE|HEADERS|WAIT_MS|MAX_SEND|MAX_BYTES)\s*=/, /\baiAdmitted\b/,
  /\bIDENTITY_(?:HOSTS|MAX_SEND|MAX_BYTES)\s*=/, /\bLOOPBACK_WAIT_MS\s*=/, /\bidentityAdmitted\b/, /\bhttp\s*\./, /\bcreateServer\b/, /\.listen\s*\(/, /\bcap\s*&&/, /\bRELAY_(?:ORIGIN|SOCKET|TEST|TEST_SOCKET)\s*=/, /\bTESTING\s*=/, /\bLICENCE_(?:ORIGIN|AT|ROUTE)\s*=/, /\bbounded\s*\(/, /\btls\s*\./, /\bsetDefaultCACertificates\b/, /\bprocess\s*\.\s*env\b/, /(?<![.\w])(?:spawn|spawnSync|exec|execSync|execFile|fork)\s*\(/, /\bshell\s*:/,
  /\bproxyNet\b/, /\bloadedSession\b/, /\basker\b/, /\bwireFetch\b/, /\brelaySocket\b/, /\bproxySession\b/, /\bresolveProxy\b/, /\bfetchThrough\b/, /\bproxiedConnect\b/, /\.tunnel\b/];
/* THE SIXTH EXCEPTION (claim 15), to claim 7: the pinned engine's proxy module, read with its comments taken out (jsWithoutComments),
   since its own sentences name Electron's fetch it rebuilds. Each statement exactly once; the rest reaches nothing. */
const PROXY_FILE = "engine/pinned/shell/proxy-net.cjs";
const PROXY_STATEMENTS = [
  'const net = require("node:net");',
  'const tls = require("node:tls");',
  'const crypto = require("node:crypto");',
  'if (!authInfo || authInfo.isProxy !== true) return finish(null);',
  'r = electronNet.request({ method: req.method, url: req.url, origin, credentials: req.credentials === "same-origin" && !origin ? "include" : req.credentials, cache: req.cache, referrerPolicy: req.referrerPolicy, redirect: req.redirect });',
  'r.on("login", (authInfo, callback) => { if (typeof login === "function") login(authInfo, callback); else callback(); });',
  'const { Readable } = require("node:stream");',
  'function tunnel(proxy, target, answer, o) {',
  'const sock = (opts.connect || net.connect)({ host: proxy.host, port: proxy.port });',
  'const at = target.host + ":" + target.port;',
  /* The one resolver call (engine d4caa7d2: a failed, late or empty lookup is no route, never DIRECT), and what carries its
     answer to the walk: nothing but Chromium's answer or no route enters the list, and each proxy tunnelled to is an entry of
     it, in Chromium's order (engine ba430728). */
  'const NO_ROUTE = "";',
  'const waits = [Promise.resolve().then(() => opts.resolve("https://" + u.host + u.pathname)).then(a => (typeof a === "string" ? a : NO_ROUTE), () => NO_ROUTE)];',
  'waits.push(new Promise(r => { bound = setTimeout(() => r(NO_ROUTE), opts.resolveWaitMs || RESOLVE_WAIT_MS); if (bound.unref) bound.unref(); }));',
  'const answer = await Promise.race(waits);',
  'const list = parseProxyList(answer);',
  'for (const hop of list) {',
  'inner = opts.direct(url, headers, handlers);',
  'const port = Number(u.port) || 443;',
  'try { sock = await tunnel(hop, { host: u.hostname, port }, opts.asker ? opts.asker.heldFor(hop.host, hop.port) : null, opts); first = hop; break; }',
  'const secure = (opts.tlsConnect || (s => tls.connect({ socket: s, servername: u.hostname, ALPNProtocols: ["http/1.1"] })))(sock);',
  'module.exports = { parseProxyList, proxyAsker, fetchThrough, tunnel, webSocketOver, proxiedConnect, ASK_WAIT_MS, DECLINE_MS };',
];
const PROXY_ELSEWHERE = [/child_process/, /\brequire\s*\(/, /\bnet\s*\./, /\btls\s*\./, /\.request\s*\(/, /\.connect\b/, /\btunnel\s*\(/,
  /\bopts\s*\.\s*(?:resolve|direct)\b/, /\bisProxy\b/, /\bhttps?:\/\//, /\bwss?:\/\//, /\bprocess\s*\.\s*env\b/, /\bexports\b/,
  /(?<![.\w])(?:spawn|spawnSync|exec|execSync|execFile|fork)\s*\(/, /\bimport\s*\(/, /\bcreateRequire\b/, /\beval\s*\(/, /\bnew\s+Function\b/,
  /\bprocess\s*\.\s*(?:binding|dlopen)\b/, /\bglobalThis\b/, /\brejectUnauthorized\b/, /\bcheckServerIdentity\b/,
  /* beside the held statements: the race given another answer, no route used again, the walk's list or an entry changed in
     place (engine ba430728's walk). The word "waits" in the module's sentences is not a use, so only its uses are read. */
  /\bwaits\s*(?:[.[,)]|=(?!=))/, /\bNO_ROUTE\b/, /\blist\s*(?:\[|\.\s*(?:push|unshift|splice|fill|copyWithin)\b)/, /\bhop\s*\.\s*(?:host|port|type)\s*=(?!=)/];
/* THE FIFTH EXCEPTION (claim 13), held as claim 12 holds its file: the one read of the policy key the AI service's settings
   come from (board 992). */
const PLANT_FILE = "src/win-proxy-plant.cjs";
const PLANT_STATEMENTS = [
  'const isPackaged = Boolean(o.packaged) || packagedHere(__dirname);',
  'const isHarness = Boolean(o.harness);',
  'if (isPackaged || !isHarness || !plantFile) return typeof o.fallback === "function" ? o.fallback() : require("../engine/pinned/shell/win-proxy.cjs").windowsProxySwitches();',
  'const cp = require("node:child_process");',
  'const standIn = {',
  'execFileSync: (file, argv) => { const t = answer(file, argv); if (t === null) throw missing(); return t; },',
  'execFile: (file, argv, opt, cb) => {',
  'standIn.execFileSync[STAND] = true;',
  'standIn.execFile[STAND] = true;',
  'const savedCp = { execFileSync: cp.execFileSync, execFile: cp.execFile };',
  'cp.execFileSync = standIn.execFileSync;',
  'cp.execFile = standIn.execFile;',
  'cp.execFileSync = savedCp.execFileSync;',
  'cp.execFile = savedCp.execFile;',
  'if (refused) throw refused;',
  'module.exports = { startupProxySwitches, readPlantedAnswers };',
];
const PLANT_ELSEWHERE = [/child_process/, /\bexecFileSync\b/, /\bexecFile\b/, /\bcp\b/, /\bsavedCp\b/, /\bstandIn\b/,
  /(?<![.\w])(?:spawn|spawnSync|exec|execSync|execFile|fork)\s*\(/, /\bimport\s*\(/, /\bcreateRequire\b/, /\beval\s*\(/,
  /\bnew\s+Function\b/, /\bprocess\s*\.\s*(?:binding|dlopen)\b/, /\bshell\s*:/, /\bexports\b/];
const POLICY_FILE = "src/ai-policy.cjs";
const POLICY_STATEMENTS = [
  'const { execFileSync } = require("node:child_process");',
  'const REG_TOOL = "C:\\\\Windows\\\\System32\\\\reg.exe";',
  'function aiPolicyText() { if (process.platform !== "win32") return "";',
  'return execFileSync(REG_TOOL, ["query", "HKLM\\\\SOFTWARE\\\\Policies\\\\Etiuda"], { windowsHide: true, timeout: 5000, encoding: "utf8", maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });',
  'module.exports = { aiPolicyText };',
];
const POLICY_ELSEWHERE = [/child_process/, /\bexecFileSync\b/, /\bREG_TOOL\b/, /\brequire\s*\(/, /\bprocess\s*\.\s*platform\b/,
  /["'`](?:HK(?:CU|LM|U|CR|CC)|HKEY_[A-Z_]+):?\\\\/, /["'`](?:query|add|delete|export|import|copy|save|restore|load|unload|flags|compare)["'`]/i,
  /["'`]\/(?:s|v|ve|f|t|d|se|z|reg:\d+)["'`]/i,
  /(?<![.\w])(?:spawn|spawnSync|exec|execSync|execFile|fork)\s*\(/, /\bimport\s*\(/, /\bcreateRequire\b/, /\beval\s*\(/, /\bnew\s+Function\b/,
  /\bprocess\s*\.\s*(?:binding|dlopen)\b/, /\bshell\s*:/, /\bexports\b/, /powershell|pwsh|cmd\.exe|dbus-send|reg\.exe/, /\bfs\b/];
/* THE ONE ADDRESS (claim 14). In src/customer-ai.mjs, these word for word and once each: the services' lines (a vendor's
   address stands only on its own), the routes and the version header, the builder's answer and the one call of the door. */
const AI_FILE = "src/customer-ai.mjs";
const AI_STATEMENTS = [
  'openai: Object.freeze({ protocol: "chat", auth: "authorization", endpoint: "https://api.openai.com/v1/" }),',
  'anthropic: Object.freeze({ protocol: "messages", auth: "x-api-key", endpoint: "https://api.anthropic.com/v1/" }),',
  'google: Object.freeze({ protocol: "interactions", auth: "x-goog-api-key", endpoint: "https://generativelanguage.googleapis.com/v1/" }),',
  'azure: Object.freeze({ protocol: "chat", auth: "api-key", endpoint: "" }),',
  'compatible: Object.freeze({ protocol: "chat", auth: "authorization", endpoint: "" }),',
  'const CHAT_ROUTE = "chat/completions";',
  'const MESSAGES_ROUTE = "messages";',
  'const MESSAGES_VERSION = ["anthropic-version", "2026-10-21"];',
  'const INTERACTIONS_ROUTE = "interactions";',
  'return { endpoint: endpointFor(config), route, headers, body: Buffer.from(JSON.stringify(doc), "utf8") };',
  'try { res = await door(req.endpoint, req.route, req.headers, req.body); }',
];
/* Beside them: no address, no vendor's host, no second call of the door, no other address handed by the builder. */
const AI_ELSEWHERE = [/:\/\//, /\bdoor\s*\(/,/\.(?:com|ai|dev|net|io|org)\//i,
  /openai\.com|anthropic\.com|googleapis|azure\.com|\bx\.ai\b|mistral\.ai|cohere\.|openrouter/i];
/* In shell/main.js the door is handed to aiAsk in this one statement, and no other file of Studio's own names it. */
const AI_HANDED = "return { ask: C.aiAsk({ provider: cfg.provider, endpoint: cfg.endpoint, model: cfg.model, key, keyAway: cfg.keyAway }, wire.customerAiRequest, job), refusal: null };";
/* NOTHING IS SENT BUT ON THE LEAD'S ACT (Maxim, 2026-11-11 19:07: "Nothing leaves the computer by default"). In shell/main.js
   the AI service's section runs from its head to the quiet check's; aiAskNow, which makes the one ask, is named nowhere
   outside it, is called inside it only from the channels the page opens (after the first answer("studio:ai-), and the
   section starts nothing by itself: no timer, no app event, no message the page sends without awaiting an answer. A
   function defined after the channels and called from elsewhere on a timer would pass this reading: it reads the section,
   not every path into it, and the page's channels are the lead's acts (stage 3 and 4 open them only on a press). */
const AI_SECTION = ["/* THE CUSTOMER'S OWN AI SERVICE (board 992;", "/* THE QUIET CHECK."];
const AI_UNASKED = /\bsetTimeout\b|\bsetInterval\b|\bsetImmediate\b|\bqueueMicrotask\b|\bapp\s*\.\s*(?:on|once|whenReady)\b|\bhear\s*\(|\bpowerMonitor\b/;
function askedOnlyByAct(text) {
  const at = text.indexOf(AI_SECTION[0]), end = at < 0 ? -1 : text.indexOf(AI_SECTION[1], at);
  if (at < 0 || end < 0 || text.split(AI_SECTION[0]).length !== 2) return ["the AI section's head or end not found once"];
  const inside = text.slice(at, end), outside = text.slice(0, at) + text.slice(end);
  const bad = [];
  if (/\baiAskNow\b/.test(outside)) bad.push("aiAskNow named outside the AI section");
  if (AI_UNASKED.test(inside)) bad.push("the AI section starts something by itself: " + inside.match(AI_UNASKED)[0]);
  const first = inside.indexOf('answer("studio:ai-');
  for (const m of inside.matchAll(/(?<!function\s)\baiAskNow\s*\(/g)) if (first < 0 || m.index < first) bad.push("aiAskNow called before the channels");
  return bad;
}
/** Claim 14's problems in one file of Studio's own. */
function addressProblems(f) {
  if (f.rel === AI_FILE) return exceptionProblems(f.text, AI_STATEMENTS, AI_ELSEWHERE);
  if (f.rel === WIRE_FILE) return [];
  const n = (f.text.match(/\bcustomerAiRequest\b/g) || []).length;
  if (f.rel === "shell/main.js") {
    if (n === 0) return /\baiAskNow\b/.test(f.text) ? ["aiAskNow without the door"] : [];
    return n === 1 && squash(f.text).split(AI_HANDED).length === 2 ? askedOnlyByAct(f.text) : [n + " naming(s) of the door"];
  }
  return n ? [n + " naming(s) of the door"] : [];
}
/* Claim 2 reads a file with the lines claim 14 and claim 11 hold taken out, each only where it stands exactly once, so a
   vendor's address or header anywhere else, or a held line changed or written twice, is still claim 2. */
const AI_HEADERS_HELD = 'const AI_HEADERS = ["content-type", "authorization", "api-key", "x-api-key", "anthropic-version", "x-goog-api-key"];';
function claim2Text(f) {
  const held = f.rel === AI_FILE ? AI_STATEMENTS.slice(0, 9) : f.rel === WIRE_FILE ? [AI_HEADERS_HELD] : [];
  if (!held.length) return f.text;
  let t = squash(f.text);
  for (const h of held) { if (t.split(h).length !== 2) return f.text; t = t.split(h).join(" "); }
  return t;
}

/** The problems in an exception file's text: what is missing, repeated or added beside the exact statements. */
function exceptionProblems(text, statements = EXCEPTION_STATEMENTS, elsewhere = ELSEWHERE) {
  const bad = [];
  let rest = squash(text);
  for (const s of statements) {
    const n = rest.split(s).length - 1;
    if (n !== 1) bad.push(n + " of " + s.slice(0, 40));
    rest = rest.split(s).join(" ");
  }
  for (const re of elsewhere) if (re.test(rest)) bad.push("also " + re);
  if (NETWORK.some(re => re.test(rest))) bad.push("a network pattern");
  return bad;
}

/* THE MAKER LINK (shell/main.js): Studio's one openExternal opens its maker's page at a fixed address. Its two
   statements are taken out of shell/main.js before claim 3 reads it, each only where it stands exactly once, so a
   second call, another address, or the call in any other file is claim 3. */
const MAKER = ['const STARDUST_URL = "https://stardustcore.com";', "shell.openExternal(STARDUST_URL);"];
/* THE RELEASE PAGE (board 991), held the same way: the one openExternal of the offered version's page, whose address is the kept
   note's, verified under the root and admitted again by src/update-note.mjs releasePage (https://etiuda.dev/ and nothing else). */
const RELEASE = ['const page = U.releasePage(U.offerOf(readUpdateState(), runningVersion(), Date.now(), "studio", L.trustedKeyNow()));',
  "if (page) shell.openExternal(page);"];
/* THE SIGN-IN PAGE (board 980, stage 2), held the same way: the one openExternal of a sign-in provider's page, opened only as
   src/wire.cjs identityAuthorize answers it (https at one of IDENTITY_HOSTS, canonical, and "" for anything else), and the
   opening awaited so a browser that will not open is said at once (the join; the test architect's small edit). */
const SIGNIN = ["const authorize = wire.identityAuthorize(url);", "try { await shell.openExternal(authorize); } catch { return false; }"];
/* BUY (board 1020), held the same way: the one openExternal of Buy, whose address src/buy-path.cjs buyAddress builds from the service
   state alone: the provider's portal where it is Stripe's own login link, the team's order page (https on etiuda.dev, unset in builds)
   with the person's code after "#code=", or "" (tests/studio-buy-path.mjs sbuy2 holds what it answers). A new open, so the Head of Core
   decides it (CLAUDE.md, Max 2026-11-22 08:37); this gate names it first. */
const BUY_OPEN = ["const buy = BUY.buyAddress(readServiceState(), ORDER_ORIGIN, managedHere(), recoveryLang());", "if (buy) shell.openExternal(buy);"];
const BUY_SHAPES = ["const PORTAL = /^https:\\/\\/billing\\.stripe\\.com\\/p\\/login\\/(?:test_)?[A-Za-z0-9]{8,64}$/;",
  "const ORDER_ORIGIN = /^https:\\/\\/(?:[a-z0-9-]+\\.)*etiuda\\.dev$/;",
  'const ORDER_PATHS = Object.freeze({ en: "/en/order/team/", pl: "/pl/zamowienie/zespol/" });'];
function claim3Text(f) {
  if (f.rel !== "shell/main.js") return f.text;
  let t = f.text;
  for (const group of [MAKER, RELEASE, SIGNIN, BUY_OPEN]) {
    if (!group.every(m => t.split(m).length === 2)) continue;
    for (const m of group) t = t.split(m).join(" ");
  }
  return t;
}

/** The problems in a set of files, as "claim path" strings. `files` is [{ rel, text }]. */
function scan(files) {
  const out = [];
  for (const f of files) {
    const own = f.rel.indexOf(PINNED) !== 0;
    if (own && /provider/i.test(path.basename(f.rel))) out.push("1 " + f.rel);
    if (ENDPOINT.test(claim2Text(f))) out.push("2 " + f.rel);
    if (f.rel === EXCEPTION_FILE) { if (exceptionProblems(jsWithoutComments(f.text)).length) out.push("8 " + f.rel); }
    else if (f.rel === BUS_FILE) { if (exceptionProblems(f.text, BUS_STATEMENTS, BUS_ELSEWHERE).length) out.push("10 " + f.rel); }
    else if (f.rel === WIRE_FILE) { if (exceptionProblems(f.text, WIRE_STATEMENTS, WIRE_ELSEWHERE).length) out.push("11 " + f.rel); }
    else if (f.rel === SYNC_FILE) { if (exceptionProblems(f.text, SYNC_STATEMENTS, SYNC_ELSEWHERE).length) out.push("12 " + f.rel); }
    else if (f.rel === POLICY_FILE) { if (exceptionProblems(f.text, POLICY_STATEMENTS, POLICY_ELSEWHERE).length) out.push("13 " + f.rel); }
    else if (f.rel === PROXY_FILE) { if (exceptionProblems(jsWithoutComments(f.text), PROXY_STATEMENTS, PROXY_ELSEWHERE).length) out.push("15 " + f.rel); }
    else if (f.rel === PLANT_FILE) { if (exceptionProblems(jsWithoutComments(f.text), PLANT_STATEMENTS, PLANT_ELSEWHERE).length) out.push("16 " + f.rel); }
    else if (own && NETWORK.some(re => re.test(claim3Text(f)))) out.push("3 " + f.rel);
    if (own && (VENDOR_KEY.test(f.text) || PROVIDER_KIND.test(f.text) || (KEY_FILES.indexOf(f.rel) < 0 && KEYSETTING.test(f.text))))
      out.push("4 " + f.rel);
    if (own && addressProblems(f).length) out.push("14 " + f.rel);
    if (own && outsiders(f.text).length) out.push("6 " + f.rel);
    if (f.rel === "package.json" && depsProblems(f.text).length) out.push("6 " + f.rel);
  }
  return out;
}

/* ---- what ships --------------------------------------------------------------------------- */

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const at = path.join(dir, e.name);
    if (e.isDirectory()) walk(at, acc); else acc.push(at);
  }
  return acc;
}

function shippedFiles() {
  const cfg = require(path.join(ROOT, "electron-builder.js"));
  const entries = Array.isArray(cfg.files) ? cfg.files : null;
  if (!entries) noVerdict("electron-builder.js has no files allowlist to read");
  const out = [];
  for (const e of entries) {
    if (e.indexOf("!") === 0) continue;               /* an exclusion only ever removes files */
    if (/\*\*$/.test(e)) {
      const dir = path.join(ROOT, e.slice(0, -3));
      if (!fs.existsSync(dir))
        noVerdict(JSON.stringify(e) + " names a folder that is not on disk"
          + (e.indexOf(PINNED) === 0 ? " (run node tools/engine-fetch.mjs)" : ""));
      walk(dir, []).forEach(p => out.push(p));
    } else if (e.indexOf("*") < 0) {
      const at = path.join(ROOT, e);
      if (!fs.existsSync(at)) noVerdict(JSON.stringify(e) + " names a file that is not on disk");
      out.push(at);
    } else noVerdict(JSON.stringify(e) + " is an allowlist entry this gate cannot expand");
  }
  return out.map(p => ({ rel: path.relative(ROOT, p).split(path.sep).join("/"),
                         text: fs.readFileSync(p, "utf8") }));
}

/* Where a freshly loaded src/wire.cjs sends a relay call, electron's net answered by a stand-in that records the address.
   `at` is the file (the tree, or a copy whose __dirname sits inside app.asar). `origin` is ETIUDA_RELAY_ORIGIN, or unset. */
async function relayDoor(at, origin) {
  const Module = require("node:module"), load = Module._load, was = process.env.ETIUDA_RELAY_ORIGIN, seen = [];
  const electron = { net: { fetch: async (url) => { seen.push(String(url)); return { status: 200, headers: { get: () => null },
    body: new ReadableStream({ start(c) { c.close(); } }) }; } } };
  if (origin === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = origin;
  const RealWS = globalThis.WebSocket, sockets = [];
  globalThis.WebSocket = function (url) { sockets.push(String(url)); this.readyState = 0; };
  Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
  const PROD = "https://etiuda.dev/relay/v1/teams", STAGING = "https://etiuda.dev/relay-staging/v1/teams";
  try {
    delete require.cache[require.resolve(at)];
    const wire = require(at);
    const ask = async (url) => {
      try { await wire.relayRequest("POST", url, {}, Buffer.from("{}")); return seen[seen.length - 1] === url ? "sent" : "other"; }
      catch (e) { return /reaches the relay at/.test(String(e && e.message)) ? "refused" : "other"; }
    };
    const toStaging = await ask(STAGING), toProd = await ask(PROD);
    const open = (url) => { const n = sockets.length, s = wire.relayConnect(url, {}, { message() {}, close() {} }); return s ? sockets[n] || "open" : null; };
    return { toStaging, toProd, sockStaging: open("wss://etiuda.dev/relay-staging/v1/t/x/socket"), sockProd: open("wss://etiuda.dev/relay/v1/t/x/socket") };
  } finally {
    Module._load = load;
    globalThis.WebSocket = RealWS;
    try { delete require.cache[require.resolve(at)]; } catch { /* already gone */ }
    if (was === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = was;
  }
}

/* What an ordinary build reaches through the relay's two doors, of REACH_PROBES (claim 11, 11bf), and what a test service build
   does (11be). Each probe is "POST <url>" through relayRequest or "socket <url>" through relayConnect. */
const REACH_PROBES = ["POST https://etiuda.dev/relay/v1/teams", "POST https://etiuda.dev/relay-staging/v1/teams", "POST https://etiuda.dev/relay-other/v1/teams",
  "POST https://example.com/relay/v1/teams", "socket wss://etiuda.dev/relay/v1/t/x/socket", "socket wss://etiuda.dev/relay-staging/v1/t/x/socket",
  "socket wss://etiuda.dev/relay-other/v1/t/x/socket"];
const ORDINARY_REACH = ["POST https://etiuda.dev/relay/v1/teams", "socket wss://etiuda.dev/relay/v1/t/x/socket"];
const TEST_REACH = ["POST https://etiuda.dev/relay/v1/teams", "POST https://etiuda.dev/relay-staging/v1/teams", "socket wss://etiuda.dev/relay/v1/t/x/socket",
  "socket wss://etiuda.dev/relay-staging/v1/t/x/socket"];
/* A copy of src/wire.cjs and src/signin-lab.cjs inside <root>/<name>/resources/app.asar/src/, its package.json carrying `fields`
   as etiudaTestService where given, and `loose` written as test-service.json beside the asar where given. Answers the wire's path. */
function reachCopy(root, name, fields, loose) {
  const asar = path.join(root, name, "resources", "app.asar");
  fs.mkdirSync(path.join(asar, "src"), { recursive: true });
  for (const f of ["wire.cjs", "signin-lab.cjs"]) fs.copyFileSync(path.join(ROOT, "src", f), path.join(asar, "src", f));
  fs.writeFileSync(path.join(asar, "package.json"), JSON.stringify(Object.assign({ name: "etiuda-studio" }, fields === undefined ? {} : { etiudaTestService: fields })));
  if (loose !== undefined) fs.writeFileSync(path.join(asar, "..", "test-service.json"), JSON.stringify(loose));
  return path.join(asar, "src", "wire.cjs");
}
/* The probes a freshly loaded wire at `at` lets through, electron's net and the socket stood in, `env` set for the load and
   ETIUDA_RELAY_ORIGIN and ETIUDA_SIGNIN_LAB unset otherwise; `lab` is the signin-lab.cjs it loads, cleared before and after. */
async function reachOf(at, env, lab) {
  const Module = require("node:module"), load = Module._load, names = ["ETIUDA_RELAY_ORIGIN", "ETIUDA_SIGNIN_LAB"], was = {}, seen = [];
  const electron = { net: { fetch: async (url) => { seen.push(String(url)); return { status: 200, headers: { get: () => null },
    body: new ReadableStream({ start(c) { c.close(); } }) }; } } };
  for (const n of names) { was[n] = process.env[n]; if (env[n] === undefined) delete process.env[n]; else process.env[n] = env[n]; }
  const RealWS = globalThis.WebSocket, sockets = [];
  globalThis.WebSocket = function (url) { sockets.push(String(url)); this.readyState = 0; };
  Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
  const labAt = lab || path.join(path.dirname(at), "signin-lab.cjs");
  const forget = () => { for (const f of [at, labAt]) { try { delete require.cache[require.resolve(f)]; } catch { /* not loaded */ } } };
  try {
    forget();
    const wire = require(at), got = [];
    for (const p of REACH_PROBES) {
      const [kind, url] = p.split(" ");
      if (kind === "POST") {
        try { await wire.relayRequest("POST", url, {}, Buffer.from("{}")); if (seen[seen.length - 1] === url) got.push(p); } catch { /* refused */ }
      } else {
        const n = sockets.length;
        if (wire.relayConnect(url, {}, { message() {}, close() {} }) && sockets[n] === url) got.push(p);
      }
    }
    return got;
  } finally {
    Module._load = load;
    globalThis.WebSocket = RealWS;
    forget();
    for (const n of names) { if (was[n] === undefined) delete process.env[n]; else process.env[n] = was[n]; }
  }
}

async function main() {
  const files = shippedFiles();
  const own = files.filter(f => f.rel.indexOf(PINNED) !== 0);
  const rels = files.map(f => f.rel);
  check(files.length > 100 && own.length > 30 && rels.includes("src/studio.mjs")
        && rels.includes("shell/main.js") && rels.includes("ui/app.js"),
    "0  the scan read " + files.length + " shipped files, " + own.length + " of Studio's own"
    + " (the allowlist expanded and read as UTF-8), including shell/main.js, ui/app.js and"
    + " src/studio.mjs");

  const found = scan(files);
  const byClaim = n => found.filter(s => s.indexOf(n + " ") === 0).map(s => s.slice(String(n).length + 1));
  const say = n => byClaim(n).length ? " (found in " + byClaim(n).join(", ") + ")" : "";

  /* CLAIM 2 IS ABOUT WHAT SHIPS, so it passes over a file the package leaves out (the test architect's (b), 2026-11-12): the
     desk's own model module, shell/desk-ai.cjs, is fetched because the pinned desk shell requires it in the legs, and it ships
     with the engine, not with Studio. A "!" entry is trusted to drop a file only because 7a holds that no positive files entry
     follows the exclusions. Claims 1 and 3 to 6 keep reading the whole set, exclusions ignored, and 7b's control with them. */
  const outs = require(path.join(ROOT, "electron-builder.js")).files.filter(e => e.indexOf("!") === 0).map(e => e.slice(1));
  const leftOut = rel => outs.some(e => /\*\*$/.test(e) ? rel.indexOf(e.slice(0, -2)) === 0 : rel === e);
  const passedOver = byClaim(2).filter(r => leftOut(r));

  check(byClaim(1).length === 0, "1  no shipped file of Studio's own is a provider module" + say(1));
  check(byClaim(2).filter(r => !leftOut(r)).length === 0,
    "2  no shipped file carries a model endpoint or its header names"
    + (byClaim(2).filter(r => !leftOut(r)).length ? " (found in " + byClaim(2).filter(r => !leftOut(r)).join(", ") + ")" : "")
    + (passedOver.length ? " (left out by the package: " + passedOver.join(", ") + ")" : ""));
  check(leftOut("engine/pinned/shell/desk-ai.cjs") && !leftOut("engine/pinned/shell/main-not-excluded.js") && !leftOut("src/studio.mjs"),
    "2b the package's exclusions claim 2 passes over are exact: the desk's model module is left out, and a pinned file not named and Studio's own src/studio.mjs are not");
  check(byClaim(3).length === 0,
    "3  no shipped file of Studio's own, but the ones claims 8, 10, 11 and 12 hold, reaches a network or starts a program" + say(3));
  check(byClaim(4).length === 0,
    "4  no shipped file of Studio's own holds an API-key setting" + say(4));
  check(byClaim(14).length === 0,
    "14 a request to an AI service is built for the configured address alone and the door is named only where it is held" + say(14));
  check(byClaim(6).length === 0,
    "6  no production dependencies, and no shipped file of Studio's own imports outside a relative"
    + " path, node:, electron or file:" + say(6));

  /* ---- 5. the scanner, on planted faults --------------------------------------------------- */

  const plant = (rel, text) => [{ rel, text }];
  const clean = plant("src/clean.mjs", "export const x = 1; // reads a file, sends nothing\n");
  check(scan(clean).length === 0, "5a a clean stand-in is found clean");
  check(scan(plant("src/provider.mjs", "export {};\n")).join() === "1 src/provider.mjs",
    "5b a module named provider is claim 1");
  check(scan(plant("src/a.mjs", 'const U = "https://api.anthropic.com/v1/messages";\n')).join()
        === "2 src/a.mjs", "5c a vendor endpoint is claim 2");
  check(scan(plant("engine/pinned/src/a.js", 'h["x-api-key"] = 1;\n')).join()
        === "2 engine/pinned/src/a.js", "5d the same header in the pinned engine is claim 2 there");
  check(scan(plant("src/a.mjs", "const r = await fetch(u);\n")).join() === "3 src/a.mjs",
    "5e a fetch call is claim 3");
  check(scan(plant("src/a.mjs", 'import { spawn } from "node:child_process";\n')).join()
        === "3 src/a.mjs", "5f starting a program is claim 3");
  check(scan(plant("shell/a.js", 'const https = require("https");\n')).join() === "3 shell/a.js,6 shell/a.js",
    "5g an https module is claim 3");
  check(scan(plant("ui/a.js", 'row(T("AI key"), "Later");\n')).join() === "4 ui/a.js",
    "5h an AI key row is claim 4");
  check(scan(plant("src/a.mjs", 'const KIND = "etiuda-studio-provider";\n')).join() === "4 src/a.mjs",
    "5i the provider settings file's kind is claim 4");

  /* every form a network or process module can be named in: bare, node:, dynamic, require, a
     subpath. A bare name is also outside the closed world (claim 6), so both are expected. */
  const hits = (rel, text) => scan(plant(rel, text)).join();
  check(hits("src/a.mjs", 'import https from "https";\n') === "3 src/a.mjs,6 src/a.mjs",
    '5j import from a bare "https" is claim 3 (and outside the closed world)');
  check(hits("src/a.mjs", 'import { spawnSync } from "child_process";\n') === "3 src/a.mjs,6 src/a.mjs",
    '5k import from a bare "child_process" is claim 3 (and outside the closed world)');
  check(hits("src/a.mjs", 'const h = await import("https");\n') === "3 src/a.mjs,6 src/a.mjs",
    '5l a dynamic import of a bare "https" is claim 3');
  check(hits("src/a.mjs", 'const h = await import("node:https");\n') === "3 src/a.mjs",
    '5m a dynamic import of "node:https" is claim 3');
  check(hits("src/a.mjs", 'const c = require("child_process");\n') === "3 src/a.mjs,6 src/a.mjs",
    '5n require of a bare "child_process" is claim 3');
  check(hits("shell/a.js", 'const c = require("node:child_process");\n') === "3 shell/a.js",
    '5o require of "node:child_process" is claim 3');
  check(hits("src/a.mjs", 'import { lookup } from "node:dns/promises";\n') === "3 src/a.mjs",
    '5p a subpath of a network module (node:dns/promises) is claim 3');
  check(hits("src/a.mjs", "import net from 'net';\n") === "3 src/a.mjs,6 src/a.mjs",
    '5q a single-quoted bare "net" is claim 3');
  check(hits("src/a.mjs", 'import http2 from "node:http2";\nimport tls from "node:tls";\n')
        === "3 src/a.mjs", "5r node:http2 and node:tls are claim 3");
  /* Electron's own original-fs (the fs that reads an .asar as a file, which a walk of an installed copy needs) is a
     built-in of the shell, like electron itself: inside the closed world. Only that exact name: a subpath or a longer
     name is still outside it. */
  check(hits("shell/a.js", 'const fs = require("original-fs");\n') === "",
    '5z4 Electron\'s own "original-fs" is inside the closed world');
  check(hits("shell/a.js", 'const x = require("original-fs-extra");\n') === "6 shell/a.js"
        && hits("shell/a.js", 'const x = require("original-fs/x");\n') === "6 shell/a.js",
    "5z5 a longer name or a subpath of original-fs is still outside the closed world");
  check(hits("src/a.mjs", 'const s = "https"; // a word, not a module\nexport { s };\n') === "",
    "5s the word https as a plain string is not claim 3");
  /* the five old blind spots (board 836), each claim 3 in a file of Studio's own */
  check(hits("shell/a.js", 'const { utilityProcess } = require("electron");\nutilityProcess.fork(p);\n') === "3 shell/a.js",
    "5t a program started through utilityProcess is claim 3");
  check(hits("shell/a.js", 'const { shell } = require("electron");\nshell.openExternal(u);\n') === "3 shell/a.js",
    "5u an openExternal outside the maker link is claim 3");
  check(hits("src/a.mjs", 'const m = require("node:module")._load("child_" + "process");\n') === "3 src/a.mjs",
    "5v a module loaded by Module._load, its name split, is claim 3");
  check(hits("src/a.mjs", 'const b = process._linkedBinding("x");\n') === "3 src/a.mjs",
    "5w a native binding is claim 3");
  check(hits("src/a.mjs", 'import { Worker } from "node:worker_threads";\nnew Worker(code, { eval: true });\n') === "3 src/a.mjs",
    "5x a worker given code to eval is claim 3");
  check(hits("src/a.mjs", 'const c = require("child_" + "process");\n') === "3 src/a.mjs,6 src/a.mjs",
    "5y a module name split by joining strings is claim 3 (and its first half outside the closed world)");
  const maker = 'const STARDUST_URL = "https://stardustcore.com";\nhear("studio:maker", () => { shell.openExternal(STARDUST_URL); });\n';
  check(hits("shell/main.js", maker) === "" && hits("shell/main.js", maker.replace("stardustcore.com", "example.com")) === "3 shell/main.js"
        && hits("shell/main.js", maker + "shell.openExternal(STARDUST_URL);\n") === "3 shell/main.js" && hits("shell/other.js", maker) === "3 shell/other.js",
    "5z the maker link is clean only as it stands: in shell/main.js, at its fixed address, once; another address, a second call or another file is claim 3");
  const release = RELEASE[0] + "\n" + RELEASE[1] + "\n";
  check(hits("shell/main.js", release) === "" && hits("shell/main.js", maker + release) === ""
        && hits("shell/main.js", release.replace("U.releasePage(", "(")) === "3 shell/main.js"
        && hits("shell/main.js", release.replace("shell.openExternal(page)", "shell.openExternal(u)")) === "3 shell/main.js"
        && hits("shell/main.js", release + "shell.openExternal(page);\n") === "3 shell/main.js" && hits("shell/other.js", release) === "3 shell/other.js",
    "5z2 the release page is clean only as it stands (board 991): in shell/main.js, through releasePage, once; the address taken"
    + " around releasePage, another argument, a second call or another file is claim 3");
  const signinOpen = SIGNIN[0] + "\n" + SIGNIN[1] + "\n";
  check(hits("shell/main.js", signinOpen) === "" && hits("shell/main.js", maker + release + signinOpen) === ""
        && hits("shell/main.js", signinOpen.replace("wire.identityAuthorize(url)", "url")) === "3 shell/main.js"
        && hits("shell/main.js", signinOpen.replace("shell.openExternal(authorize)", "shell.openExternal(url)")) === "3 shell/main.js"
        && hits("shell/main.js", signinOpen + "shell.openExternal(authorize);\n") === "3 shell/main.js" && hits("shell/other.js", signinOpen) === "3 shell/other.js",
    "5z3 the sign-in page is clean only as it stands (board 980): in shell/main.js, through identityAuthorize, once; the address taken"
    + " around identityAuthorize, another argument, a second call or another file is claim 3");
  const buyOpen = BUY_OPEN[0] + "\n" + BUY_OPEN[1] + "\n";
  check(hits("shell/main.js", buyOpen) === "" && hits("shell/main.js", maker + release + signinOpen + buyOpen) === ""
        && hits("shell/main.js", buyOpen.replace("BUY.buyAddress(readServiceState(), ORDER_ORIGIN, managedHere(), recoveryLang())", "url")) === "3 shell/main.js"
        && hits("shell/main.js", buyOpen.replace("shell.openExternal(buy)", "shell.openExternal(url)")) === "3 shell/main.js"
        && hits("shell/main.js", buyOpen + "shell.openExternal(buy);\n") === "3 shell/main.js" && hits("shell/other.js", buyOpen) === "3 shell/other.js",
    "5z4 Buy is clean only as it stands (board 1020): in shell/main.js, through buyAddress over the kept state, once; the address taken"
    + " around buyAddress, another argument, a second call or another file is claim 3");

  /* Buy's two shapes (board 1020, Claude alpha's condition 1 on the open): src/buy-path.cjs, which alone builds the address 5z4 opens,
     holds the provider's portal to Stripe's own login link and the order page to https on etiuda.dev with a plain path, each statement
     exactly once; a widened one, here planted in a copy of the text, is refused. */
  const buyText = fs.readFileSync(path.join(ROOT, "src", "buy-path.cjs"), "utf8");
  const shapesHeld = (t) => BUY_SHAPES.every((x) => t.split(x).length === 2);
  check(shapesHeld(buyText) && !shapesHeld(buyText.replace(BUY_SHAPES[0], BUY_SHAPES[0].replace("billing\\.stripe\\.com", "[a-z.]+")))
      && !shapesHeld(buyText.replace(BUY_SHAPES[1], BUY_SHAPES[1].replace("etiuda\\.dev", "[a-z.]+"))),
    "5z5 Buy opens only its two shapes (board 1020): src/buy-path.cjs holds Stripe's portal login link, https on etiuda.dev as the order"
    + " origin and the team page's two paths, each once; another host, planted in a copy, is not held");

  /* ---- 6. the closed world, on planted faults ---------------------------------------------- */

  check(hits("src/a.mjs", 'import Anthropic from "@anthropic-ai/sdk";\nexport const c = new Anthropic();\n')
        === "6 src/a.mjs", "6a an SDK import is outside the closed world");
  check(hits("src/a.mjs", 'import OpenAI from "openai";\n') === "6 src/a.mjs",
    "6b an unscoped package import is outside the closed world");
  check(hits("src/a.mjs", 'const m = await import("@google/generative-ai");\n') === "6 src/a.mjs",
    "6c a dynamic import of a package is outside the closed world");
  check(hits("shell/a.js", 'const g = require("ai");\n') === "6 shell/a.js",
    "6d a require of a package is outside the closed world");
  check(hits("src/a.mjs", 'export * from "some-package";\n') === "6 src/a.mjs",
    "6e a re-export from a package is outside the closed world");
  check(hits("src/a.mjs", 'import "some-package/register";\n') === "6 src/a.mjs",
    "6f a side-effect import of a package is outside the closed world");
  check(hits("src/a.mjs", 'import {\n  a,\n  b,\n} from "pkg";\n') === "6 src/a.mjs",
    "6g a multi-line import from a package is outside the closed world");
  check(hits("src/a.mjs", 'import fs from "fs";\n') === "6 src/a.mjs",
    '6h a bare node built-in (no node:) is outside the world too: Studio writes node: everywhere');
  check(hits("shell/a.js", 'import a from "./a.mjs";\nimport b from "../src/b.mjs";\n'
        + 'import c from "node:fs";\nconst { app } = require("electron");\n'
        + 'const m = await import("file:///" + p);\nconst r = require("node:path");\n') === "",
    "6i the allowed forms (relative, node:, electron, file:) are clean");
  const pkg = obj => scan([{ rel: "package.json", text: JSON.stringify(obj) }]).join();
  check(pkg({ name: "x", devDependencies: { electron: "1" } }) === "", "6j devDependencies alone are clean");
  check(pkg({ name: "x", dependencies: {} }) === "", "6k an empty dependencies field is clean");
  check(pkg({ name: "x", dependencies: { "@anthropic-ai/sdk": "0.99.0" } }) === "6 package.json",
    "6l a non-empty dependencies is claim 6");
  check(pkg({ name: "x", optionalDependencies: { openai: "1" } }) === "6 package.json",
    "6m a non-empty optionalDependencies is claim 6");
  check(scan([{ rel: "package.json", text: "{ not json" }]).join() === "6 package.json",
    "6n a package.json that is not JSON is claim 6, not a pass");

  /* ---- 7. what the pinned engine still brings into the package ------------------------------
     Claim 3's node-side patterns (a network or process module, electron net; not the page's fetch)
     over the pinned files the allowlist ships, its `!` entries honoured, which claims 1 to 6 do not. The one pair left is the engine's lint (tests/test.js requires
     tests/engine.js), which src/engine.mjs loads until the engine carries its lint outside tests/; beside it the proxy reader, held by claim 8. */
  const cfg = require(path.join(ROOT, "electron-builder.js"));
  const out = cfg.files.filter(e => e.indexOf("!") === 0).map(e => e.slice(1));
  const dropped = rel => out.some(e => /\*\*$/.test(e) ? rel.indexOf(e.slice(0, -2)) === 0 : rel === e);
  const NODE_SIDE = [NAMED_MODULE, new RegExp("node:(?:" + NODE_NET + ")\\b"), /\bnet\.(request|fetch)\b/];
  const net = fs => fs.filter(f => f.rel.indexOf(PINNED) === 0 && NODE_SIDE.some(re => re.test(f.text))).map(f => f.rel).sort();
  const LINT_PAIR = ["engine/pinned/tests/engine.js", "engine/pinned/tests/test.js"];
  const shipped = net(files.filter(f => !dropped(f.rel))), unfiltered = net(files);
  /* electron-builder reads the list in order, so a positive entry after the first exclusion can put a file back. */
  const firstOut = cfg.files.findIndex(e => e.indexOf("!") === 0);
  const backAfter = cfg.files.slice(firstOut < 0 ? cfg.files.length : firstOut).filter(e => e.indexOf("!") !== 0);
  check(JSON.stringify(shipped) === JSON.stringify(LINT_PAIR.concat([EXCEPTION_FILE, PROXY_FILE]).sort()) && firstOut > -1 && backAfter.length === 0,
    "7a the pinned files the package ships that reach a network or start a program are the lint's pair, claim 8's reader and claim 15's proxy module alone: "
    + JSON.stringify(shipped) + ", and no positive files entry follows the exclusions ("
    + (firstOut < 0 ? "there are none" : JSON.stringify(backAfter)) + ")");
  check(unfiltered.length > shipped.length && unfiltered.indexOf("engine/pinned/shell/main.js") > -1,
    "7b CONTROL: the same scan with the exclusions ignored finds " + unfiltered.length + " file(s), the pinned"
    + " shell among them, so 7a reads the exclusions rather than an empty folder");

  /* ---- 8. the one exception, held to its exact shape -------------------------------------------
     The shipped file must stand, and each way of widening it, made on that very text, must be found:
     one planted fault per way, so a green run means the exception is narrow and not that the scan is blind. */
  const winProxy = files.find(f => f.rel === EXCEPTION_FILE);
  const real = winProxy ? winProxy.text : "";
  const realSaid = exceptionProblems(jsWithoutComments(real));
  check(!!winProxy && scan([{ rel: EXCEPTION_FILE, text: real }]).length === 0 && byClaim(8).length === 0,
    "8a the shipped " + EXCEPTION_FILE + " is in the package and holds the exception's exact shape: the one require of child_process"
    + " naming its two functions, the path, the keys, the one call of each with its options through the reg guard, and the one export"
    + (winProxy ? "" : " (NOT FOUND)") + (realSaid.length ? " (problems: " + realSaid.join("; ") + ")" : ""));
  const planted = (id, why, edit) => {
    const text = edit(real), got = scan([{ rel: EXCEPTION_FILE, text }]).join();
    check(!!winProxy && text !== real && got === "8 " + EXCEPTION_FILE, id + " " + why + " is claim 8: " + (got || "found clean"));
  };
  planted("8b", "a key widened to a subkey", t => t.replace('Internet Settings\\\\Connections"', 'Internet Settings\\\\Connections\\\\Extra"'));
  planted("8c", "a second argument asking the tool for more than the key", t => t.replace('["query", key]', '["query", key, "/s"]'));
  planted("8d", "the tool named without its fixed path", t => t.replace('"C:\\\\Windows\\\\System32\\\\reg.exe"', '"reg"'));
  planted("8e", "a second call, to write", t => t + '\nexecFileSync(REG_TOOL, ["add", key]);\n');
  planted("8f", "a shell for the call", t => t.replace("windowsHide: true", "windowsHide: true, shell: true"));
  planted("8g", "a second handle on the module, held whole", t => t + '\nconst cp = require("node:child_process");\ncp.spawn("x");\n');
  planted("8h", "a third function taken from the module", t => t.replace("{ execFile, execFileSync }", "{ execFile, execFileSync, spawnSync }"));
  planted("8i", "a network call beside it", t => t + "\nconst r = await fetch(u);\n");
  planted("8j", "the module loaded another way", t => t + '\nconst m = await import("node:child_process");\n');
  planted("8k", "the require twice", t => t + '\nconst { execFile, execFileSync } = require("node:child_process");\n');
  planted("8l", "an option of the call dropped", t => t.replace("windowsHide: true, ", ""));
  /* The read again without waiting (engine 96463644) runs the same query of the same keys: each way its call could ask for
     more, run something else or slip the reg guard is planted on that call, and so are the ways it could be handed out. */
  const LATER = 'execFile(REG_TOOL, ["query", key], regOpts(execFile, { encoding: "utf8", windowsHide: true, timeout: 5000 })';
  const later = (edit) => t => t.replace(LATER, edit(LATER));
  planted("8n", "the read again starting another program", later(s => s.replace("execFile(REG_TOOL,", 'execFile("C:\\\\Windows\\\\System32\\\\cmd.exe",')));
  planted("8o", "the read again asking the tool for more than the key", later(s => s.replace('["query", key]', '["query", key, "/s"]')));
  planted("8p", "a shell for the read again", later(s => s.replace("windowsHide: true", "windowsHide: true, shell: true")));
  planted("8q", "the read again past the reg guard", later(s => s.replace("regOpts(execFile, ", "(")));
  planted("8r", "the waiting read past the reg guard", t => t.replace("regOpts(execFileSync, ", "("));
  planted("8s", "a second call without waiting, to write", t => t + '\nexecFile(REG_TOOL, ["add", key], () => {});\n');
  planted("8t", "the second function handed out", t => t.replace("regOpts, STAND };", "regOpts, STAND, execFile };"));
  planted("8u", "a second export", t => t + "\nmodule.exports.run = execFile;\n");
  planted("8v", "the second function under another name", t => t + '\nconst run = execFile;\nrun("C:\\\\Windows\\\\System32\\\\cmd.exe", []);\n');
  check(!!winProxy && scan([{ rel: "src/other.cjs", text: real }]).join() === "3 src/other.cjs",
    "8m the exception's own text in any other file is claim 3: the exception is the one path, not the text");

  /* ---- 10. the second exception, held to its exact shape ----------------------------------------
     Numbered after 9 so that 9 keeps its number. The ways it could widen, each planted on the shipped text: another
     program, another argument shape, another question, a second call, or a platform other than Linux. */
  const busFile = files.find(f => f.rel === BUS_FILE);
  const busReal = busFile ? busFile.text : "";
  const busSaid = exceptionProblems(busReal, BUS_STATEMENTS, BUS_ELSEWHERE);
  check(!!busFile && scan([{ rel: BUS_FILE, text: busReal }]).length === 0 && byClaim(10).length === 0,
    "10a the shipped " + BUS_FILE + " is in the package and holds the exception's exact shape: the one require of child_process"
    + " naming one function, the tool's fixed path, Linux alone, the one call and its options, and the three questions"
    + (busFile ? "" : " (NOT FOUND)") + (busSaid.length ? " (problems: " + busSaid.join("; ") + ")" : ""));
  const widened = (id, why, edit) => {
    const text = edit(busReal), got = scan([{ rel: BUS_FILE, text }]).join();
    check(!!busFile && text !== busReal && got === "10 " + BUS_FILE, id + " " + why + " is claim 10: " + (got || "found clean"));
  };
  widened("10b", "another program at the fixed path", t => t.replace('"/usr/bin/dbus-send"', '"/usr/bin/gdbus"'));
  widened("10c", "the tool named without its fixed path", t => t.replace('"/usr/bin/dbus-send"', '"dbus-send"'));
  widened("10d", "the Linux test taken out", t => t.replace('if (process.platform !== "linux") return false;', ""));
  widened("10e", "another platform let in beside Linux", t => t.replace('if (process.platform !== "linux") return false;',
    'if (process.platform !== "linux" && process.platform !== "win32") return false;'));
  widened("10f", "the system bus in place of the session's", t => t.replace('"--session"', '"--system"'));
  widened("10g", "an argument added to every call", t => t.replace(".concat(args)", '.concat(args, ["--type=method_call"])'));
  widened("10h", "a question that changes something in place of a read", t => t.replace("org.freedesktop.Secret.Service.ReadAlias", "org.freedesktop.Secret.Service.Unlock"));
  widened("10i", "a fourth question", t => t.replace("module.exports", 'ask("org.freedesktop.secrets", "/org/freedesktop/secrets", "org.freedesktop.Secret.Service.CreateCollection");\nmodule.exports'));
  widened("10j", "a second call of the tool", t => t + '\nexecFileSync(BUS_TOOL, ["--session", "--dest=org.freedesktop.secrets"]);\n');
  widened("10k", "a shell for the call", t => t.replace("windowsHide: true", "windowsHide: true, shell: true"));
  widened("10l", "a second handle on the module, held whole", t => t + '\nconst cp = require("node:child_process");\ncp.spawn("x");\n');
  widened("10m", "a network call beside it", t => t + "\nconst r = await fetch(u);\n");
  widened("10o", "the Linux test moved below the first question, so the program starts off Linux", t => t
    .replace('if (process.platform !== "linux") return false;', "")
    .replace('"string:org.freedesktop.secrets"))) return false;', '"string:org.freedesktop.secrets"))) return false; if (process.platform !== "linux") return false;'));
  widened("10p", "the asking function handed out beside the answer", t => t.replace("module.exports = { keyringAnswers };", "module.exports = { keyringAnswers, ask };"));
  check(!!busFile && scan([{ rel: "src/other.cjs", text: busReal }]).join() === "3 src/other.cjs"
    && scan([{ rel: "shell/main.js", text: busReal }]).join() === "3 shell/main.js",
    "10n the exception's own text in any other file, Studio's shell included, is claim 3: the exception is the one path, not the text");

  /* ---- 11. the third exception, held to its exact shape -----------------------------------------
     Numbered after 10. The ways Studio's one door could widen, each planted on the shipped text: another address, a
     refusal taken out, a second call or socket, a redirect followed, another module, a fetch of the runtime's own, or
     more handed out. */
  const wireFile = files.find(f => f.rel === WIRE_FILE);
  const wireReal = wireFile ? wireFile.text : "";
  const wireSaid = exceptionProblems(wireReal, WIRE_STATEMENTS, WIRE_ELSEWHERE);
  check(!!wireFile && scan([{ rel: WIRE_FILE, text: wireReal }]).length === 0 && byClaim(11).length === 0,
    "11a the shipped " + WIRE_FILE + " is in the package and holds the exception's exact shape: the one require of electron,"
    + " the relay's address and its socket, the licence service's one, the two overrides a development tree alone may take, each"
    + " refusal before its call, the one bounded call's three callers, its byte cap and its one fetch with its options, the one socket with its opening told, the system's roots merged once, and"
    + " the one export" + (wireFile ? "" : " (NOT FOUND)") + (wireSaid.length ? " (problems: " + wireSaid.join("; ") + ")" : ""));
  const opened = (id, why, edit) => {
    const text = edit(wireReal), got = scan([{ rel: WIRE_FILE, text }]).join();
    check(!!wireFile && text !== wireReal && got === "11 " + WIRE_FILE, id + " " + why + " is claim 11: " + (got || "found clean"));
  };
  opened("11b", "another address in place of the relay's", t => t.replace('"https://etiuda.dev/relay/v1/"', '"https://example.com/"'));
  opened("11c", "the address widened to the whole host", t => t.replace('"https://etiuda.dev/relay/v1/"', '"https://etiuda.dev/"'));
  opened("11d", "the refusal of another address taken out of the call", t => t.replace("if (!relayAdmitted(url, RELAY_ORIGIN) && !(RELAY_TEST && relayAdmitted(url, RELAY_TEST))) throw new Error(", "if (false) throw new Error("));
  opened("11e", "the refusal of another socket address taken out", t => t.replace("!(relayAdmitted(url, RELAY_SOCKET) || (RELAY_TEST_SOCKET && relayAdmitted(url, RELAY_TEST_SOCKET))) || ", ""));
  opened("11f", "a redirect followed", t => t.replace('redirect: "error"', 'redirect: "follow"'));
  opened("11g", "a second call", t => t + "\nloadedNet.fetch(u);\n");
  opened("11g2", "a second call through a handle of the old name", t => t + "\nnet.fetch(u);\n");
  opened("11ad", "electron's request beside the one fetch", t => t + "\nloadedNet.request(u);\n");
  opened("11h", "the runtime's own fetch beside it", t => t + "\nconst r = await fetch(u);\n");
  opened("11i", "another network module required", t => t + '\nconst https = require("node:https");\n');
  opened("11j", "a second socket", t => t + "\nconst w = new WebSocket(u);\n");
  opened("11k", "more handed out", t => t.replace("NOTE_MAX, IDENTITY_HOSTS };", "NOTE_MAX, IDENTITY_HOSTS, net };"));
  opened("11m", "the relay override honoured in an installed copy", t => t.replace('const RELAY_ORIGIN = !/[\\\\/]app\\.asar([\\\\/]|$)/i.test(__dirname) && ', "const RELAY_ORIGIN = "));
  opened("11l", "a second address beside the relay's", t => t + '\nconst OTHER = "https://example.com/";\n');
  /* The test service build's relay (Max, 2026-11-13 10:26): taken only under the switch, at its one fixed address. */
  opened("11az", "staging's relay taken without the test service fields", t => t.replace('const RELAY_TEST = TESTING ? "https://etiuda.dev/relay-staging/v1/" : "";', 'const RELAY_TEST = "https://etiuda.dev/relay-staging/v1/";'));
  opened("11ba", "the test relay's address read from a variable", t => t.replace('TESTING ? "https://etiuda.dev/relay-staging/v1/" : ""', 'TESTING ? String(process.env.ETIUDA_TEST_RELAY || "") : ""'));
  opened("11bb", "the switch taken from any sign-in lab, a development one included", t => t.replace('TESTING = require("./signin-lab.cjs").testService === true;', 'TESTING = !!require("./signin-lab.cjs").lab;'));
  opened("11bc", "another relay in place of staging's under the switch", t => t.replace('"https://etiuda.dev/relay-staging/v1/" : ""', '"https://etiuda.dev/relay-other/v1/" : ""'));
  opened("11bd", "the switch turned on a second time", t => t + "\nTESTING = true;\n");
  /* The licence service's door (board 936 S6): its address, its route check, its override and the one bounded call. */
  opened("11o", "another address in place of the licence service's", t => t.replace('"https://etiuda.dev/licence/v1/"', '"https://example.com/licence/v1/"'));
  opened("11p", "the route check taken out of the licence call", t => t.replace("if (!LICENCE_ROUTE.test(String(route))) throw new Error(", "if (false) throw new Error("));
  opened("11q", "a whole address handed in in place of a route's name", t => t.replace("LICENCE_AT + String(route),", "String(route),"));
  opened("11r", "the override honoured in an installed copy", t => t.replace('const LICENCE_AT = LAB && LAB.service ? LAB.service : !/[\\\\/]app\\.asar([\\\\/]|$)/i.test(__dirname) && ', "const LICENCE_AT = LAB && LAB.service ? LAB.service : "));
  opened("11r2", "the sign-in lab's door widened to any address on 127.0.0.1", t => t.replace("return withQuery ? parsed.origin + parsed.pathname === LAB.provider.authorize : parsed.search === \"\" && raw === LAB.provider.token;", "return parsed.hostname === \"127.0.0.1\";"));
  opened("11r3", "the sign-in lab's door taking an address without a lab provider", t => t.replace("if (!LAB || !LAB.provider || parsed.href", "if (parsed.href"));
  opened("11s", "the override taking any address", t => t.replace('/^https:\\/\\/etiuda\\.dev\\/[a-z][a-z0-9-]{0,40}\\/v1\\/$/.test(', "/./.test("));
  opened("11t", "the bounded call made a fourth time", t => t + '\nbounded("x", "GET", u, {}, null);\n');
  /* The version note's door (board 991): its one route, its cap, and nothing of the caller's in it. */
  opened("11ai", "the note asked at another route", t => t.replace('LICENCE_AT + "note/studio"', 'LICENCE_AT + "note/desk"'));
  opened("11aj", "the note's cap taken out", t => t.replace('if (cap && size > cap) { stop.abort(); throw new Error(what + " answered more than " + cap + " bytes"); }', ""));
  opened("11ak", "the note's cap widened", t => t.replace("const NOTE_MAX = 1024;", "const NOTE_MAX = 1048576;"));
  opened("11al", "an argument handed into the note's address", t => t.replace("async function licenceNote() {", "async function licenceNote(app) {").replace('LICENCE_AT + "note/studio"', 'LICENCE_AT + "note/" + app'));
  opened("11u", "a second variable read beside the override", t => t + "\nconst AT = process.env.OTHER;\n");
  opened("11v", "the override taking another host than etiuda.dev", t => t.replace('\\/etiuda\\.dev\\/[a-z]', '\\/[a-z0-9.-]+\\/[a-z]'));
  /* A company proxy (claim 15's module): every call keeps the sign-in listener, the socket keeps Chromium's resolver and its own
     address, and the module is reached for nothing else. */
  opened("11bh", "the sign-in listener taken off the one fetch", t => t.replace("init, asker.forRequest());", "init, null);"));
  opened("11bi", "a second call through the proxy module", t => t + '\nproxyNet.fetchThrough(loadedNet, "https://example.com/", {}, null);\n');
  opened("11bj", "the socket's proxy taken from another resolver than Chromium's", t => t.replace("resolve: (u) => chosen.resolveProxy(u),", 'resolve: () => "PROXY example.com:8080",'));
  opened("11bk", "a tunnel of its own through the proxy module", t => t + '\nproxyNet.tunnel({ host: "example.com", port: 8080 }, { host: "example.com", port: 443 });\n');
  opened("11bl", "the proxy module required from another place", t => t.replace('require("../engine/pinned/shell/proxy-net.cjs")', 'require("./proxy-net.cjs")'));
  opened("11bm", "the runtime's socket opened a second way", t => t + '\nrelaySocket("wss://example.com/", {}, {});\n');
  check(scan([{ rel: "shell/a.cjs", text: 'const p = require("../engine/pinned/shell/proxy-net.cjs");\n' }]).join() === "3 shell/a.cjs"
    && scan([{ rel: "ui/a.js", text: 'import("../engine/pinned/shell/proxy-net.cjs");\n' }]).join() === "3 ui/a.js",
    "11bn the proxy module named in any other file of Studio's own is claim 3: src/wire.cjs is its one door");
  /* The system's roots (board 989): the merge takes the bundle and the store and nothing else, and its module does nothing more. */
  opened("11ae", "a root of its own handed to the merge", t => t.replace('...tls.getCACertificates("system")])])', '...tls.getCACertificates("system")]), "x"])'));
  opened("11af", "the module that merges the roots used for anything else", t => t + '\nconst s = require("node:tls"); s.connect(443, "example.com");\n');
  opened("11ag", "the merge made a second time", t => t + "\nsetDefaultCACertificates([]);\n");
  /* Since board 992 the door's text also names the AI service's headers, its key header and its own door, so in another file
     it is claims 2, 4 and 14 beside claim 3 (the shell is one of KEY_FILES, so not 4 there). */
  const wireElse = scan([{ rel: "src/other.cjs", text: wireReal }]).join(), wireShell = scan([{ rel: "shell/main.js", text: wireReal }]).join();
  check(!!wireFile && wireElse === "2 src/other.cjs,3 src/other.cjs,4 src/other.cjs,14 src/other.cjs"
    && wireShell === "2 shell/main.js,3 shell/main.js,14 shell/main.js",
    "11n the exception's own text in any other file, Studio's shell included, is claim 3 (and claims 2, 4 and 14 for the AI door's"
    + " headers and name): the exception is the one path, not the text: " + wireElse + " | " + wireShell);

  /* The relay's address (Claude alpha, 2026-10-26): outside app.asar, ETIUDA_RELAY_ORIGIN of the licence's shape moves every
     relay call and its socket; inside app.asar, and for any other value, the production address stands. */
  const STAGING_ORIGIN = "https://etiuda.dev/relay-staging/v1/";
  const wireTree = path.join(ROOT, "src", "wire.cjs");
  const doorA = await relayDoor(wireTree, STAGING_ORIGIN);
  check(doorA.toStaging === "sent" && doorA.toProd === "refused" && !!doorA.sockStaging && !doorA.sockProd,
    "11w with ETIUDA_RELAY_ORIGIN set to staging, outside app.asar, a call to that origin is sent and one to /relay/v1/ is refused,"
    + " and the socket follows: " + [doorA.toStaging, doorA.toProd, doorA.sockStaging ? "socket-staging" : "no-socket-staging", doorA.sockProd ? "socket-prod" : "no-socket-prod"].join(" "));
  const asarCopy = path.join(os.tmpdir(), "studio-relay-asar-" + process.pid, "resources", "app.asar", "src", "wire.cjs");
  fs.mkdirSync(path.dirname(asarCopy), { recursive: true });
  fs.copyFileSync(wireTree, asarCopy);
  const doorTree = await relayDoor(wireTree, STAGING_ORIGIN), doorAsar = await relayDoor(asarCopy, STAGING_ORIGIN);
  check(doorTree.toStaging === "sent" && doorTree.toProd === "refused" && doorAsar.toStaging === "refused" && doorAsar.toProd === "sent"
    && !!doorAsar.sockProd && !doorAsar.sockStaging,
    "11x the same value is ignored when the file sits inside app.asar, so only /relay/v1/ is reached: tree "
    + doorTree.toStaging + "/" + doorTree.toProd + ", installed " + doorAsar.toStaging + "/" + doorAsar.toProd
    + (doorAsar.sockProd ? " socket-prod" : " no-socket-prod") + (doorAsar.sockStaging ? " socket-staging" : " no-socket-staging"));
  const malformed = ["http://etiuda.dev/relay-staging/v1/", "https://example.com/relay-staging/v1/", "https://etiuda.dev/relay-staging/",
    "https://etiuda.dev/relay-staging/v1/extra", "https://etiuda.dev/Relay-staging/v1/"];
  const malformedGot = [];
  for (const v of malformed) { const d = await relayDoor(wireTree, v); malformedGot.push(d.toStaging + "/" + d.toProd); }
  const goodShape = await relayDoor(wireTree, STAGING_ORIGIN);
  check(goodShape.toStaging === "sent" && malformedGot.every((g) => g === "refused/sent"),
    "11y a value that is not https on etiuda.dev of the form /<name>/v1/ is ignored, and one that is of that form is not: valid "
    + goodShape.toStaging + "; " + malformed.map((v, i) => v + " -> " + malformedGot[i]).join("; "));
  /* No door sends the session's credentials (the desk's relay request likewise): every call goes through bounded, and each door
     is called once here with electron's net stood in, recording what the call asked of Chromium beside its bytes. */
  const credsDir = fs.mkdtempSync(path.join(os.tmpdir(), "studio-wire-creds-"));
  try {
    const credsOf = async (at) => {
      const Module = require("node:module"), load = Module._load, seen = {}, was = process.env.ETIUDA_SIGNIN_LAB;
      let door = "";
      const electron = { net: { fetch: async (url, init) => { seen[door] = init ? String(init.credentials) : "no init";
        return { status: 200, headers: { get: () => null }, body: new ReadableStream({ start(c) { c.close(); } }) }; } } };
      delete process.env.ETIUDA_SIGNIN_LAB;
      Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
      const forget = () => { for (const f of [at, path.join(path.dirname(at), "signin-lab.cjs")]) { try { delete require.cache[require.resolve(f)]; } catch { /* not loaded */ } } };
      try {
        forget();
        const wire = require(at);
        const doors = [["relay", () => wire.relayRequest("POST", "https://etiuda.dev/relay/v1/teams", {}, Buffer.from("{}"))],
          ["licence", () => wire.licenceRequest("check", Buffer.from("{}"))], ["note", () => wire.licenceNote()],
          ["sign-in token", () => wire.identityRequest("https://oauth2.googleapis.com/token", Buffer.from("grant_type=refresh_token"))],
          ["AI service", () => wire.customerAiRequest("https://ai.example.test/v1/", "chat/completions", { "content-type": "application/json" }, Buffer.from("{}"))]];
        for (const [name, call] of doors) { door = name; seen[name] = "not sent"; try { await call(); } catch (e) { seen[name] = "threw " + (e && e.message); } }
        return seen;
      } finally { Module._load = load; forget(); if (was === undefined) delete process.env.ETIUDA_SIGNIN_LAB; else process.env.ETIUDA_SIGNIN_LAB = was; }
    };
    const real = await credsOf(wireTree);
    const realSaid = Object.entries(real).map(([k, v]) => k + ":" + v).join(", ");
    check(Object.keys(real).length === 5 && Object.values(real).every((v) => v === "omit"),
      "11cr every door of src/wire.cjs asks Chromium for no credentials (credentials \"omit\"), so no cookie a host set rides a call: " + realSaid);
    if (process.env.ETIUDA_PLANTS === "off") process.stdout.write("  SKIP 11cs lifting plant:wire-omit (ETIUDA_PLANTS=off)\n");
    else {
      const MARK = "/* plant:wire-omit */", wireText = fs.readFileSync(wireTree, "utf8");
      const planted = wireText.split("\n").map((l) => (l.indexOf(MARK) >= 0 ? l.replace('credentials: "omit", ', "") : l)).join("\n");
      fs.copyFileSync(path.join(ROOT, "src", "signin-lab.cjs"), path.join(credsDir, "signin-lab.cjs"));
      fs.writeFileSync(path.join(credsDir, "wire.cjs"), planted);
      const lifted = planted !== wireText ? await credsOf(path.join(credsDir, "wire.cjs")) : null;
      check(!!lifted && Object.values(lifted).every((v) => v === "undefined"),
        "11cs lifting plant:wire-omit sends every door with no credentials asked, which Chromium reads as its default: "
        + (lifted ? Object.entries(lifted).map(([k, v]) => k + ":" + v).join(", ") : "the plant's line was not found"));
    }
  } finally { fs.rmSync(credsDir, { recursive: true, force: true }); }
  let teamNamed = "", teamKept = "", madeErr = "";
  const wantUrl = "https://etiuda.dev/relay-staging/v1", keptUrl = "https://etiuda.dev/relay/v1";
  const wasOrigin = process.env.ETIUDA_RELAY_ORIGIN;
  process.env.ETIUDA_RELAY_ORIGIN = STAGING_ORIGIN;
  try { delete require.cache[require.resolve(wireTree)]; } catch { /* not loaded */ }
  const madeDir = fs.mkdtempSync(path.join(os.tmpdir(), "studio-relay-team-"));
  try {
    const Relay = await import(pathToFileURL(path.join(ROOT, "src", "relay.mjs")).href + "?nm11z=" + process.pid);
    const { makeKeyFile } = await import("../src/sign.mjs");
    const { newTeam, withChannel, writeTeam, readTeam } = await import("../src/team.mjs");
    const keyAt = path.join(madeDir, "key.json");
    const lead = await makeKeyFile({ passphrase: "harbour-lamp-passphrase" });
    fs.writeFileSync(keyAt, JSON.stringify(lead) + "\n");
    const ring = { format: 1, kind: "etiuda-ring", keys: [] };
    const writeOne = async (folder, url) => {
      fs.mkdirSync(folder, { recursive: true });
      const id = "t-" + Relay.relayId().slice(0, 16);
      let team = newTeam({ id, catalogs: ["harbour-lamps"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true });
      team = withChannel(team, { kind: "relay", rt: Relay.relayId(), url }, ring);
      await writeTeam(folder, team, { key: keyAt, passphrase: "harbour-lamp-passphrase" });
      const back = await readTeam(folder);
      return back.team && back.team.channel ? back.team.channel.url : "";
    };
    teamNamed = await writeOne(path.join(madeDir, "new"), Relay.RELAY_URL);
    teamKept = await writeOne(path.join(madeDir, "old"), keptUrl);
  } catch (e) { madeErr = String(e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e); }
  finally {
    if (wasOrigin === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = wasOrigin;
    try { delete require.cache[require.resolve(wireTree)]; } catch { /* already gone */ }
    fs.rmSync(madeDir, { recursive: true, force: true });
  }
  check(!madeErr && teamNamed === wantUrl && teamKept === keptUrl,
    "11z a team made under the override names that address, without the shape's trailing slash, and a team file written with the"
    + " production address keeps it: " + (madeErr || teamNamed + " | " + teamKept));

  /* A ".." after the relay's path resolves somewhere else. The installed copy, inside app.asar, must refuse it at both
     doors, refuse the same path written with %2e%2e, and still send a plain good URL. */
  async function doorAt(at, requestUrl, socketUrl) {
    const Module = require("node:module"), load = Module._load, was = process.env.ETIUDA_RELAY_ORIGIN, seen = [];
    const electron = { net: { fetch: async (url) => { seen.push(String(url)); return { status: 200, headers: { get: () => null },
      body: new ReadableStream({ start(c) { c.close(); } }) }; } } };
    delete process.env.ETIUDA_RELAY_ORIGIN;
    const RealWS = globalThis.WebSocket, sockets = [];
    globalThis.WebSocket = function (url) { sockets.push(String(url)); this.readyState = 0; };
    Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
    try {
      delete require.cache[require.resolve(at)];
      const wire = require(at);
      let requestGot = "other";
      try {
        await wire.relayRequest("POST", requestUrl, {}, Buffer.from("{}"));
        requestGot = seen[seen.length - 1] === requestUrl ? "sent" : "other";
      } catch (e) { requestGot = /reaches the relay at/.test(String(e && e.message)) ? "refused" : "other"; }
      const n = sockets.length;
      const opened = wire.relayConnect(socketUrl, {}, { message() {}, close() {} });
      return { requestGot, socketGot: opened ? (sockets[n] || "open") : null };
    } finally {
      Module._load = load;
      globalThis.WebSocket = RealWS;
      try { delete require.cache[require.resolve(at)]; } catch { /* already gone */ }
      if (was === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = was;
    }
  }
  const asarDoor = path.join(os.tmpdir(), "studio-relay-door-" + process.pid, "resources", "app.asar", "src", "wire.cjs");
  fs.mkdirSync(path.dirname(asarDoor), { recursive: true });
  fs.copyFileSync(wireTree, asarDoor);
  const dotDot = "https://etiuda.dev/relay/v1/../relay-staging/v1/teams";
  const dotSock = "wss://etiuda.dev/relay/v1/../relay-staging/v1/t/x/socket";
  const encoded = "https://etiuda.dev/relay/v1/%2e%2e/relay-staging/v1/teams";
  const encodedSock = "wss://etiuda.dev/relay/v1/%2e%2e/relay-staging/v1/t/x/socket";
  const goodUrl = "https://etiuda.dev/relay/v1/teams";
  const goodSock = "wss://etiuda.dev/relay/v1/t/x/socket";
  const doorDot = await doorAt(asarDoor, dotDot, dotSock);
  check(doorDot.requestGot === "refused" && !doorDot.socketGot,
    "11aa a dot-dot URL is refused at the request door and at the socket door from inside app.asar: "
    + doorDot.requestGot + (doorDot.socketGot ? " socket-open" : " no-socket"));
  const doorEnc = await doorAt(asarDoor, encoded, encodedSock);
  check(doorEnc.requestGot === "refused" && !doorEnc.socketGot,
    "11ab the same URL with %2e%2e is refused at both doors from inside app.asar: "
    + doorEnc.requestGot + (doorEnc.socketGot ? " socket-open" : " no-socket"));
  const doorGood = await doorAt(asarDoor, goodUrl, goodSock);
  check(doorGood.requestGot === "sent" && doorGood.socketGot === goodSock,
    "11ac a plain good URL is still sent from inside app.asar, and its socket opens: "
    + doorGood.requestGot + " " + (doorGood.socketGot || "no-socket"));

  /* THE TEST SERVICE BUILD'S RELAY, at run time (Max, 2026-11-13 10:26). A copy of src/wire.cjs and the real src/signin-lab.cjs
     inside a stand-in app.asar whose package.json carries the test service fields, as tools/test-service.cjs packs them, reaches
     staging's relay and the relay; every other build, installed or not, reaches the relay alone, which is what it reached before
     this exception was widened: 11bf prints that list and holds it to ORDINARY_REACH. */
  const reachRoot = fs.mkdtempSync(path.join(os.tmpdir(), "studio-relay-reach-"));
  try {
    const fieldsOk = { service: "https://etiuda.dev/licence-staging/v1/" }, fieldsRefused = { service: "https://example.com/licence/v1/" };
    const testBuild = await reachOf(reachCopy(reachRoot, "ts", fieldsOk), { ETIUDA_RELAY_ORIGIN: "https://etiuda.dev/relay-other/v1/" });
    check(testBuild.join() === TEST_REACH.join(),
      "11be a test service build (its asar's fields accepted) calls and opens the socket of staging's relay beside the relay, and"
      + " nothing else, ETIUDA_RELAY_ORIGIN set to another name ignored: " + testBuild.join(" | "));
    const ordinary = {
      "installed, no fields": await reachOf(reachCopy(reachRoot, "plain", undefined), {}),
      "installed, fields refused": await reachOf(reachCopy(reachRoot, "refused", fieldsRefused), {}),
      "installed, a loose test-service.json beside the asar": await reachOf(reachCopy(reachRoot, "loose", undefined, fieldsOk), {}),
      "development tree": await reachOf(wireTree, {}),
    };
    const off = Object.keys(ordinary).filter((k) => ordinary[k].join() !== ORDINARY_REACH.join());
    check(off.length === 0, "11bf an ordinary build's list of calls is unchanged, the relay alone (" + ORDINARY_REACH.join(" | ") + "), in each of "
      + Object.keys(ordinary).length + " builds: " + Object.keys(ordinary).map((k) => k + ": " + ordinary[k].join(" | ")).join("; ")
      + (off.length ? "; DIFFERENT: " + off.join(", ") : ""));
    const labFile = path.join(reachRoot, "lab.json");
    fs.writeFileSync(labFile, JSON.stringify(fieldsOk));
    const devLab = await reachOf(wireTree, { ETIUDA_SIGNIN_LAB: labFile }, path.join(ROOT, "src", "signin-lab.cjs"));
    check(devLab.join() === ORDINARY_REACH.join(),
      "11bg a development Studio given the same fields as a sign-in lab file reaches the relay alone, so only a package's own asar"
      + " turns staging's relay on: " + devLab.join(" | "));
  } finally { fs.rmSync(reachRoot, { recursive: true, force: true }); }

  /* ---- 15. the sixth exception, to claim 7: the pinned proxy module, held to its exact shape ----------
     Numbered last so 12 to 14 keep their numbers; it sits here beside its door. Each widening is planted on the shipped text. */
  const proxyFile = files.find(f => f.rel === PROXY_FILE);
  const proxyReal = proxyFile ? proxyFile.text : "";
  const proxySaid = exceptionProblems(jsWithoutComments(proxyReal), PROXY_STATEMENTS, PROXY_ELSEWHERE);
  check(!!proxyFile && scan([{ rel: PROXY_FILE, text: proxyReal }]).length === 0 && byClaim(15).length === 0,
    "15a the shipped " + PROXY_FILE + " is in the package and holds the exception's exact shape: its requires, the one request with its"
    + " options and its proxy-only listener, the one resolver call and its answer alone carried to the walk, the one connect to the"
    + " proxy, the one tunnel to the socket's own host through an entry of that answer, the one TLS and the one export" + (proxyFile ? "" : " (NOT FOUND)") + (proxySaid.length ? " (problems: " + proxySaid.join("; ") + ")" : ""));
  const widenedProxy = (id, why, edit) => {
    const text = edit(proxyReal), got = scan([{ rel: PROXY_FILE, text }]).join();
    check(!!proxyFile && text !== proxyReal && got === "15 " + PROXY_FILE, id + " " + why + " is claim 15: " + (got || "found clean"));
  };
  widenedProxy("15b", "a fetch beside the request", t => t + '\nfetch("https://example.com/");\n');
  widenedProxy("15c", "another network module", t => t + '\nconst h = require("node:https");\n');
  widenedProxy("15d", "the listener answering a server that is not a proxy", t => t.replace("authInfo.isProxy !== true", "authInfo.isProxy === undefined"));
  widenedProxy("15e", "the socket's proxy asked for another address", t => t.replace('opts.resolve("https://" + u.host + u.pathname)', 'opts.resolve("https://example.com/")'));
  widenedProxy("15f", "the tunnel to another host than the socket's", t => t.replace("{ host: u.hostname, port }", '{ host: "example.com", port }'));
  widenedProxy("15g", "a second connection", t => t + '\nnet.connect(443, "example.com");\n');
  widenedProxy("15h", "more handed out", t => t.replace("ASK_WAIT_MS, DECLINE_MS };", "ASK_WAIT_MS, DECLINE_MS, net };"));
  widenedProxy("15j", "the TLS inside the tunnel with its certificate check turned off", t => t.replace('ALPNProtocols: ["http/1.1"] })', 'ALPNProtocols: ["http/1.1"], rejectUnauthorized: false })'));
  /* The walk over Chromium's answer (engine ba430728, d4caa7d2): a proxy Chromium did not name, however it enters the walk. */
  widenedProxy("15k", "a proxy of its own put into the walk", t => t.replace("parseProxyList(answer)", 'parseProxyList(answer + "; PROXY 192.0.2.1:8080")'));
  widenedProxy("15l", "a failed lookup naming a proxy", t => t.replace('const NO_ROUTE = "";', 'const NO_ROUTE = "PROXY 192.0.2.1:8080";'));
  widenedProxy("15m", "a late lookup naming a proxy", t => t.replace("r(NO_ROUTE)", 'r("PROXY 192.0.2.1:8080")'));
  widenedProxy("15n", "the walk's list changed in place", t => t.replace("for (const hop of list) {", 'list.unshift({ type: "PROXY", host: "192.0.2.1", port: 8080 });\n    for (const hop of list) {'));
  widenedProxy("15o", "an entry's host changed before its tunnel", t => t.replace("const at = proxyKey(hop.host, hop.port);", 'hop.host = "192.0.2.1";\n      const at = proxyKey(hop.host, hop.port);'));
  widenedProxy("15p", "the walk over a list of its own", t => t.replace("for (const hop of list) {", 'for (const hop of [{ type: "PROXY", host: "192.0.2.1", port: 8080 }]) {'));
  widenedProxy("15q", "a third answer in the race", t => t.replace("const answer = await Promise.race(waits);", 'waits.push(Promise.resolve("PROXY 192.0.2.1:8080"));\n    const answer = await Promise.race(waits);'));
  check(!!proxyFile && scan([{ rel: "src/other.cjs", text: proxyReal }]).join().indexOf("3 src/other.cjs") > -1,
    "15i the module's own text in a file of Studio's own is claim 3: the exception is the pinned path, not the text");

  /* ---- 16. the seventh exception, held to its exact shape --------------------------------------- */
  const plantFile = files.find(f => f.rel === PLANT_FILE);
  const plantReal = plantFile ? plantFile.text : "";
  const plantSaid = exceptionProblems(jsWithoutComments(plantReal), PLANT_STATEMENTS, PLANT_ELSEWHERE);
  check(!!plantFile && scan([{ rel: PLANT_FILE, text: plantReal }]).length === 0 && byClaim(16).length === 0,
    "16a the shipped " + PLANT_FILE + " is in the package and holds the exception's exact shape: the packaged and harness refusals,"
    + " the marked stand-in on child_process and its restore, and the one export"
    + (plantFile ? "" : " (NOT FOUND)") + (plantSaid.length ? " (problems: " + plantSaid.join("; ") + ")" : ""));
  const widenedPlant = (id, why, edit) => {
    const text = edit(plantReal), got = scan([{ rel: PLANT_FILE, text }]).join();
    check(!!plantFile && text !== plantReal && got === "16 " + PLANT_FILE, id + " " + why + " is claim 16: " + (got || "found clean"));
  };
  widenedPlant("16b", "calling the real execFileSync", t => t.replace("module.exports", 'savedCp.execFileSync("cmd.exe");\nmodule.exports'));
  widenedPlant("16c", "lifting the packaged refusal", t => t.replace("const isPackaged = Boolean(o.packaged) || packagedHere(__dirname);", "const isPackaged = false;"));
  widenedPlant("16d", "a spawnSync call", t => t.replace("module.exports", 'cp.spawnSync("cmd.exe");\nmodule.exports'));
  check(!!plantFile && scan([{ rel: "src/other.cjs", text: plantReal }]).join() === "3 src/other.cjs",
    "16e the exception's own text in any other file is claim 3: the exception is the one path, not the text");

  /* ---- 12. the fourth exception, held to its exact shape ---------------------------------------
     The reg reads a shipped Studio uses for a folder's place. A fifth read, or a verb other than the four
     fixed ones, is the widening the ruling names; the other plants keep a second program from passing quietly. */
  const syncFile = files.find(f => f.rel === SYNC_FILE);
  const syncReal = syncFile ? syncFile.text : "";
  const syncSaid = exceptionProblems(syncReal, SYNC_STATEMENTS, SYNC_ELSEWHERE);
  check(!!syncFile && scan([{ rel: SYNC_FILE, text: syncReal }]).length === 0 && byClaim(12).length === 0,
    "12a the shipped " + SYNC_FILE + " is in the package and holds the exception's exact shape: the one require of child_process"
    + " naming execFileSync, the reg tool's fixed path, Windows alone as the function's first statement, one five-second"
    + " deadline, the engine's six reads, the one call, the one listing and the one export"
    + (syncFile ? "" : " (NOT FOUND)") + (syncSaid.length ? " (problems: " + syncSaid.join("; ") + ")" : ""));
  const rooted = (id, why, edit) => {
    const text = edit(syncReal), got = scan([{ rel: SYNC_FILE, text }]).join();
    check(!!syncFile && text !== syncReal && got === "12 " + SYNC_FILE, id + " " + why + " is claim 12: " + (got || "found clean"));
  };
  rooted("12b", "a fifth query", t => t.replace(
    '["query", "HKCU\\\\Network", "/s", "/v", "RemotePath"]',
    '["query", "HKCU\\\\Network", "/s", "/v", "RemotePath"],\n    ["query", "HKCU\\\\Software\\\\Elsewhere", "/v", "Elsewhere"]'));
  rooted("12c", "an add verb", t => t.replace(
    '["query", "HKCU\\\\Network", "/s", "/v", "RemotePath"]',
    '["query", "HKCU\\\\Network", "/s", "/v", "RemotePath"],\n    ["add", "HKCU\\\\Network", "/s", "/v", "RemotePath"]'));
  rooted("12d", "the Windows test taken out", t => t.replace(
    'if (process.platform !== "win32") return { env: {}, reg: function () { return ""; }, subkeys: function () { return []; }, readFile: function () { return ""; } };',
    ""));
  rooted("12e", "the deadline widened", t => t.replace("Date.now() + 5000", "Date.now() + 20000"));
  rooted("12f", "a second call of the tool", t => t + '\nexecFileSync(REG_TOOL, ["query", "HKCU\\\\Software"]);\n');
  rooted("12g", "a shell for the call", t => t.replace("windowsHide: true", "windowsHide: true, shell: true"));
  rooted("12h", "another program at the fixed path", t => t.replace('"C:\\\\Windows\\\\System32\\\\reg.exe"', '"C:\\\\Windows\\\\System32\\\\cmd.exe"'));
  /* The four lists left word for word, and another key or verb asked by changing one in place before the call. */
  rooted("12j", "another key, by a list changed in place", t => t.replace("  for (let i = 0; i < queries.length; i++) {",
    '  queries[3][1] = "HKCU\\\\Software\\\\Elsewhere";\n  for (let i = 0; i < queries.length; i++) {'));
  rooted("12k", "another verb, held in a variable", t => t.replace("  for (let i = 0; i < queries.length; i++) {",
    '  const verb = "add";\n  queries[3][0] = verb;\n  for (let i = 0; i < queries.length; i++) {'));
  rooted("12l", "a write through the one fs it holds", t => t.replace("  syncIo.cached = io;",
    '  fs.writeFileSync("x.txt", "x");\n  syncIo.cached = io;'));
  rooted("12m", "a second read through fs", t => t.replace("  syncIo.cached = io;",
    '  fs.readFileSync("x.txt", "utf8");\n  syncIo.cached = io;'));
  /* Board 955, condition 2: the two machine-wide DriveFS reads and the one listing, each held as the four were. */
  const machineDrive = ['    ["query", "HKLM\\\\SOFTWARE\\\\Google\\\\DriveFS", "/s", "/v", "DefaultMountPoint"],\n',
    '    ["query", "HKLM\\\\SOFTWARE\\\\WOW6432Node\\\\Google\\\\DriveFS", "/s", "/v", "DefaultMountPoint"],\n'];
  rooted("12n", "the machine-wide DriveFS reads taken out", t => machineDrive.reduce((x, line) => x.replace(line, ""), t));
  rooted("12o", "a write to the machine-wide DriveFS key", t => t.replace(machineDrive[0],
    machineDrive[0] + '    ["add", "HKLM\\\\SOFTWARE\\\\Google\\\\DriveFS", "/v", "DefaultMountPoint", "/d", "G"],\n'));
  rooted("12p", "a second listing", t => t.replace("  syncIo.cached = io;", '  fs.promises.readdir("C:\\\\");\n  syncIo.cached = io;'));
  rooted("12q", "the listing made synchronous", t => t.replace("fs.promises.readdir(dir)", "fs.readdirSync(dir)"));
  {
    /* An ordinary place, OneDrive's, a mapped letter's or the user's own Drive key, is read through the four reads it was
       read through before, word for word and in their order; the two DriveFS keys under HKLM are the only reads added. */
    const before = ['["query", "HKCU\\\\Software\\\\Microsoft\\\\OneDrive\\\\Accounts", "/s", "/v", "UserFolder"]',
      '["query", "HKCU\\\\Software\\\\Google\\\\DriveFS", "/s", "/v", "DefaultMountPoint"]',
      '["query", "HKLM\\\\SOFTWARE\\\\Policies\\\\Google\\\\DriveFS", "/s", "/v", "DefaultMountPoint"]',
      '["query", "HKCU\\\\Network", "/s", "/v", "RemotePath"]'];
    const asked = syncReal.match(/\["query",[^\]]*\]/g) || [];
    const added = asked.filter(q => before.indexOf(q) < 0);
    const ordinary = asked.filter(q => before.indexOf(q) >= 0);
    check(!!syncFile && JSON.stringify(ordinary) === JSON.stringify(before) && added.length === 2
        && added.every(q => /^\["query", "HKLM\\\\SOFTWARE\\\\(?:WOW6432Node\\\\)?Google\\\\DriveFS", "\/s", "\/v", "DefaultMountPoint"\]$/.test(q)),
      "12r an ordinary place's four reads are unchanged, word for word and in order, and the only reads added are the two"
      + " machine-wide DriveFS queries: ordinary " + ordinary.length + ", added " + JSON.stringify(added));
  }
  check(!!syncFile && scan([{ rel: "src/other.cjs", text: syncReal }]).join() === "3 src/other.cjs"
    && scan([{ rel: "shell/main.js", text: syncReal }]).join() === "3 shell/main.js",
    "12i the exception's own text in any other file, Studio's shell included, is claim 3: the exception is the one path, not the text");

  /* ---- 11, the AI door (board 992): each way it could widen, planted on the shipped text ---------------------------- */
  {
    const text = wireReal.replace('"x-goog-api-key"];', '"x-goog-api-key", "cookie"];'), got = scan([{ rel: WIRE_FILE, text }]).join();
    check(text !== wireReal && got === "2 " + WIRE_FILE + ",11 " + WIRE_FILE,
      "11ae a header beyond the AI service's named ones is claim 11, and claim 2 reads the vendor headers the changed line names: " + (got || "found clean"));
  }
  opened("11af", "the AI door's refusal taken out", t => t.replace("if (!aiAdmitted(endpoint) || ", "if (false && !aiAdmitted(endpoint) || "));
  opened("11ag", "plain http admitted for the AI service", t => t.replace('if (parsed.protocol !== "https:" || parsed.username', 'if (parsed.protocol === "ftp:" || parsed.username'));
  opened("11ah", "the answer's size cap taken off", t => t.replace("if (cap && size > cap) {", "if (false) {"));
  opened("11ai", "a longer wait for the AI service", t => t.replace("const AI_WAIT_MS = 180000;", "const AI_WAIT_MS = 1800000;"));
  opened("11aj", "the AI door handed a whole address in place of a route's name", t => t.replace("String(endpoint) + String(route), headers, body, AI_WAIT_MS", "String(route), headers, body, AI_WAIT_MS"));
  /* ---- 11, the sign-in door (board 980, stage 2): each way it could widen, planted on the shipped text ------------------- */
  opened("11am", "a fourth host beside the sign-in services'", t => t.replace('"oauth2.googleapis.com"];', '"oauth2.googleapis.com", "example.com"];'));
  opened("11an", "the host check taken out of the sign-in door", t => t.replace("if (IDENTITY_HOSTS.indexOf(parsed.hostname) < 0 || /%2e/i.test(raw)) return false;", "if (/%2e/i.test(raw)) return false;"));
  opened("11ao", "plain http admitted for a sign-in service", t => t.replace('parsed.protocol !== "https:" || parsed.username !== "" || parsed.password !== "" || parsed.port !== ""', 'parsed.protocol === "ftp:" || parsed.username !== "" || parsed.password !== "" || parsed.port !== ""'));
  opened("11ap", "a query let into the token request", t => t.replace("if (!identityAdmitted(url, false) ||", "if (!identityAdmitted(url, true) ||"));
  opened("11aq", "the token answer's cap taken off", t => t.replace("form, 0, IDENTITY_MAX_BYTES);", "form, 0, 0);"));
  opened("11ar", "the token form's bound widened", t => t.replace("const IDENTITY_MAX_SEND = 16384;", "const IDENTITY_MAX_SEND = 16777216;"));
  opened("11as", "the loopback listening on every interface", t => t.replace('server.listen(0, "127.0.0.1",', 'server.listen(0, "0.0.0.0",'));
  opened("11at", "a fixed port for the loopback", t => t.replace('server.listen(0, "127.0.0.1",', 'server.listen(8080, "127.0.0.1",'));
  opened("11au", "a second listener", t => t + "\nhttp.createServer(() => {}).listen(0);\n");
  opened("11av", "a request through the http module", t => t + "\nhttp.get(u);\n");
  opened("11aw", "the loopback answering every path", t => t.replace('req.method !== "GET" || where !== "/")', 'req.method !== "GET")'));
  opened("11ax", "a longer wait at the loopback", t => t.replace("const LOOPBACK_WAIT_MS = 300000;", "const LOOPBACK_WAIT_MS = 3000000;"));
  opened("11ay", "the sign-in page admitted without the door's judgement", t => t.replace('function identityAuthorize(url) { return identityAdmitted(url, true) ? String(url) : ""; }', 'function identityAuthorize(url) { return String(url); }'));

  /* ---- 13. the fifth exception, held to its exact shape ---------------------------------------- */
  const policyFile = files.find(f => f.rel === POLICY_FILE);
  const policyReal = policyFile ? policyFile.text : "";
  const policySaid = exceptionProblems(policyReal, POLICY_STATEMENTS, POLICY_ELSEWHERE);
  check(!!policyFile && scan([{ rel: POLICY_FILE, text: policyReal }]).length === 0 && byClaim(13).length === 0,
    "13a the shipped " + POLICY_FILE + " is in the package and holds the exception's exact shape: the one require of child_process"
    + " naming execFileSync, the reg tool's fixed path, Windows alone as the function's first statement, the one read of the"
    + " policy key and the one export" + (policyFile ? "" : " (NOT FOUND)") + (policySaid.length ? " (problems: " + policySaid.join("; ") + ")" : ""));
  const widenedPolicy = (id, why, edit) => {
    const text = edit(policyReal), got = scan([{ rel: POLICY_FILE, text }]).join();
    check(!!policyFile && text !== policyReal && got === "13 " + POLICY_FILE, id + " " + why + " is claim 13: " + (got || "found clean"));
  };
  widenedPolicy("13b", "the export verb, which writes a file", t => t.replace('["query", "HKLM', '["export", "HKLM'));
  widenedPolicy("13c", "the subkeys asked too", t => t.replace('Policies\\\\Etiuda"]', 'Policies\\\\Etiuda", "/s"]'));
  widenedPolicy("13d", "another key", t => t.replace("Policies\\\\Etiuda", "Policies\\\\Microsoft"));
  widenedPolicy("13e", "the Windows test taken out", t => t.replace('if (process.platform !== "win32") return "";', ""));
  widenedPolicy("13f", "a second call of the tool", t => t.replace("module.exports", 'execFileSync(REG_TOOL, ["add", "HKCU\\\\Software\\\\X"]);\nmodule.exports'));
  widenedPolicy("13g", "a shell for the call", t => t.replace("windowsHide: true", "windowsHide: true, shell: true"));
  widenedPolicy("13h", "another program at the fixed path", t => t.replace("System32\\\\reg.exe", "System32\\\\cmd.exe"));
  check(!!policyFile && scan([{ rel: "src/other.cjs", text: policyReal }]).join() === "3 src/other.cjs",
    "13i the exception's own text in any other file is claim 3: the exception is the one path, not the text");

  /* ---- 14. the one address ---------------------------------------------------------------------
     The held reading on the shipped text and its plants, then the run time: the real src/wire.cjs with Electron's net stood in
     by one that records each address and answers as the service would, and src/customer-ai.mjs's aiAsk, the pipeline's one ask. */
  const aiFile = files.find(f => f.rel === AI_FILE), mainFile = files.find(f => f.rel === "shell/main.js");
  const aiReal = aiFile ? aiFile.text : "", mainReal = mainFile ? mainFile.text : "";
  const aiSaid = exceptionProblems(aiReal, AI_STATEMENTS, AI_ELSEWHERE);
  check(!!aiFile && scan([{ rel: AI_FILE, text: aiReal }]).length === 0 && squash(mainReal).split(AI_HANDED).length === 2,
    "14a the shipped " + AI_FILE + " holds the services' lines, the routes, the version header, the builder's one address and the"
    + " door's one call, and shell/main.js hands the door to aiAsk once" + (aiFile ? "" : " (NOT FOUND)")
    + (aiSaid.length ? " (problems: " + aiSaid.join("; ") + ")" : ""));
  const moved = (id, why, rel, base, edit, want) => {
    const text = edit(base), got = scan([{ rel, text }]).join();
    check(text !== base && got === want, id + " " + why + " is " + want + ": " + (got || "found clean"));
  };
  moved("14b", "one service's line given another's host", AI_FILE, aiReal,
    t => t.replace('auth: "x-api-key", endpoint: "https://api.anthropic.com/v1/"', 'auth: "x-api-key", endpoint: "https://api.openai.com/v1/"'), "2 " + AI_FILE + ",14 " + AI_FILE);
  moved("14c", "a vendor's host written beside the lines", AI_FILE, aiReal,
    t => t + '\nconst ALSO = "https://api.anthropic.com/v1/";\n', "2 " + AI_FILE + ",14 " + AI_FILE);
  moved("14o", "Google's key header written beside the lines", AI_FILE, aiReal,
    t => t + '\nconst ALSO = "x-goog-api-key";\n', "2 " + AI_FILE);
  moved("14d", "an address of no vendor written beside the lines", AI_FILE, aiReal,
    t => t + '\nconst ALSO = "https://collector.example.test/";\n', "14 " + AI_FILE);
  moved("14e", "the builder answering another address", AI_FILE, aiReal,
    t => t.replace("return { endpoint: endpointFor(config), route,", "return { endpoint: PROVIDERS.openai.endpoint, route,"), "14 " + AI_FILE);
  moved("14f", "the door called a second time", AI_FILE, aiReal,
    t => t + "\nexport const again = (door) => door(\"x\", \"y\", {}, null);\n", "14 " + AI_FILE);
  moved("14g", "the door handed out a second time in the shell", "shell/main.js", mainReal,
    t => t + "\nconst other = wire.customerAiRequest;\n", "14 shell/main.js");
  check(scan(plant("src/a.mjs", "export const d = wire.customerAiRequest;\n")).join() === "14 src/a.mjs",
    "14h the door named in any other file of Studio's own is claim 14");
  /* Nothing is sent but on the lead's act: the shell's AI section asks only from the page's channels. */
  moved("14l", "a timer in the AI section that asks by itself", "shell/main.js", mainReal,
    t => t.replace('answer("studio:ai-settings"', 'setTimeout(() => aiAskNow("test"), 60000);\nanswer("studio:ai-settings"'), "14 shell/main.js");
  moved("14m", "an ask made as the section loads, before the channels", "shell/main.js", mainReal,
    t => t.replace("async function aiShown()", 'aiAskNow("test");\nasync function aiShown()'), "14 shell/main.js");
  moved("14n", "an ask from outside the AI section", "shell/main.js", mainReal,
    t => t + '\napp.whenReady().then(() => aiAskNow("import"));\n', "14 shell/main.js");
  /* THE PAGE ASKS ONLY ON THE LEAD'S PRESS (the test architect, 2026-11-11, on Argon's finding 8 of the 992 review): the
     shell holds the ask to its channels, and the page must call each of the two channels that send, the job's Send and the
     connection test, exactly once and inside the act its button runs. A second caller (a paint, a timer, another act)
     would send without the press. */
  const PAGE_SENDS = [["API.aiJobSend(", '"ai-send": async'], ["API.aiTest(", '"ai-test": async']];
  const pageSendProblems = (text) => {
    const bad = [];
    for (const [call, act] of PAGE_SENDS) {
      const n = text.split(call).length - 1;
      if (n !== 1) { bad.push(call + " " + n + " time(s)"); continue; }
      const at = text.indexOf(act), next = at < 0 ? -1 : text.indexOf('\n    "', at + act.length);
      const where = text.indexOf(call);
      if (at < 0 || next < 0 || where < at || where > next) bad.push(call + " outside " + act);
    }
    return bad;
  };
  const uiFile = files.find(f => f.rel === "ui/app.js"), uiReal = uiFile ? uiFile.text : "";
  const pageReal = pageSendProblems(uiReal);
  const pageTwice = pageSendProblems(uiReal + '\nfunction paintAgain() { API.aiJobSend(S.open.dir, "language", "", "", "", ""); }\n');
  const pageMoved = pageSendProblems(uiReal.replace("const r = await API.aiTest();", "const r = null;")
    + '\nsetTimeout(async () => { const r = await API.aiTest(); }, 60000);\n');
  check(!!uiFile && pageReal.length === 0 && pageTwice.length === 1 && pageMoved.length === 1,
    "14p the page calls the job's Send and the connection test once each, inside the act its button runs; a second caller,"
    + " or the call moved out of its act, is caught (CONTROL): real " + (pageReal.join("; ") || "clean")
    + ", second caller " + (pageTwice.join("; ") || "MISSED") + ", moved " + (pageMoved.join("; ") || "MISSED"));
  check(scan(plant("ui/app.js", 'row(T("API key"));\n')).join() === "" && scan(plant("src/a.mjs", 'row(T("API key"));\n')).join() === "4 src/a.mjs"
    && scan(plant("ui/lang.js", 'const K = "sk-ant-' + "a".repeat(30) + '";\n')).join() === "4 ui/lang.js",
    "4a the key's own wording stands in the AI service's files alone, and a vendor key's shape is claim 4 in any file, those included");

  /* The run time. `modUrl` is the module to drive (the tree's, or the control's copy). */
  async function aiReached(modUrl) {
    const Module = require("node:module"), load = Module._load, seen = [];
    const answers = { "chat/completions": '{"choices":[{"index":0,"message":{"role":"assistant","content":"ok"},"finish_reason":"stop"}]}',
      messages: '{"type":"message","role":"assistant","content":[{"type":"text","text":"ok"}],"stop_reason":"end_turn"}',
      interactions: '{"object":"interaction","status":"completed","steps":[{"type":"model_output","content":[{"type":"text","text":"ok"}]}]}' };
    const electron = { net: { fetch: async (url) => {
      seen.push(String(url));
      const route = /chat\/completions$/.test(String(url)) ? "chat/completions" : /\/interactions$/.test(String(url)) ? "interactions" : "messages";
      const bytes = new TextEncoder().encode(answers[route]);
      return { status: 200, headers: { get: () => null }, body: new ReadableStream({ start(c) { c.enqueue(bytes); c.close(); } }) };
    } } };
    Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
    const wireAt = path.join(ROOT, "src", "wire.cjs");
    try {
      delete require.cache[require.resolve(wireAt)];
      const wire = require(wireAt);
      const C = await import(modUrl);
      const GIVEN = "https://gateway.example.test/ai/v1/";
      const rows = [];
      for (const id of Object.keys(C.PROVIDERS)) {
        const own = C.PROVIDERS[id].endpoint, others = Object.keys(C.PROVIDERS).map(k => C.PROVIDERS[k].endpoint).filter(e => e && e !== own);
        let n = seen.length;
        const a = await C.aiAsk({ provider: id, endpoint: GIVEN, model: "m", key: "k" }, wire.customerAiRequest, "test")({ prompt: "p", body: "b" });
        const given = seen.slice(n);
        n = seen.length;
        const b = await C.aiAsk({ provider: id, endpoint: "", model: "m", key: "k" }, wire.customerAiRequest, "test")({ prompt: "p", body: "b" });
        const bare = seen.slice(n);
        const okGiven = a.ok && given.length === 1 && given[0].indexOf(GIVEN) === 0;
        const okBare = own ? b.ok && bare.length === 1 && bare[0].indexOf(own) === 0 && !others.some(e => bare[0].indexOf(e) === 0)
          : !b.ok && bare.length === 0;
        rows.push({ id, ok: okGiven && okBare, given: given.join(" "), bare: bare.join(" ") || "(nothing sent)" });
      }
      /* What the door refuses sends nothing, whoever calls it. */
      const body = Buffer.from("{}"), n0 = seen.length, refused = [];
      const bad = [["http://gateway.example.test/v1/", "messages", {}], ["https://u:p@gateway.example.test/v1/", "messages", {}],
        ["https://gateway.example.test/v1/?x=1", "messages", {}], ["https://gateway.example.test/v1/%2e%2e/x/", "messages", {}],
        ["https://gateway.example.test/v1", "messages", {}], ["https://GATEWAY.example.test/v1/", "messages", {}],
        ["https://gateway.example.test/v1/", "../x", {}], ["https://gateway.example.test/v1/", "messages", { cookie: "c" }]];
      for (const [e, r, h] of bad) { try { await wire.customerAiRequest(e, r, h, body); refused.push("SENT " + e); } catch { refused.push("refused"); } }
      return { rows, refusedAll: refused.every(x => x === "refused") && seen.length === n0, refused };
    } finally {
      Module._load = load;
      try { delete require.cache[require.resolve(wireAt)]; } catch { /* already gone */ }
    }
  }
  const run = await aiReached(pathToFileURL(path.join(ROOT, "src", "customer-ai.mjs")).href + "?nm14=" + process.pid);
  check(run.rows.length === 5 && run.rows.every(r => r.ok),
    "14i through the real door, each service reaches the address configured for it alone, and with none its own published"
    + " address alone or, having none, nothing: " + run.rows.map(r => r.id + (r.ok ? "" : " WRONG") + " [" + r.given + " | " + r.bare + "]").join("; "));
  check(run.refusedAll,
    "14j the door refuses, sending nothing, an http address, a user, a query, a %2e segment, a path not ending in /, a host not"
    + " in canonical form, a route that is not a name and a header it does not name: " + run.refused.join(", "));
  /* The control: the module copied beside its one import, its builder made to answer OpenAI's address whatever is configured. */
  const ctl = fs.mkdtempSync(path.join(os.tmpdir(), "studio-ai-control-"));
  try {
    fs.copyFileSync(path.join(ROOT, "src", "refusal.mjs"), path.join(ctl, "refusal.mjs"));
    fs.writeFileSync(path.join(ctl, "customer-ai.mjs"), aiReal.replace("return { endpoint: endpointFor(config), route,", "return { endpoint: PROVIDERS.openai.endpoint, route,"));
    const bent = await aiReached(pathToFileURL(path.join(ctl, "customer-ai.mjs")).href);
    const wrong = bent.rows.filter(r => !r.ok).map(r => r.id);
    check(wrong.length === 5,
      "14k CONTROL: a builder that answers OpenAI's address whatever is configured is found wrong for every service by 14i's"
      + " reading: " + (wrong.join(", ") || "none found"));
  } finally { fs.rmSync(ctl, { recursive: true, force: true }); }

  /* ---- 9. what the product reads of the pinned engine, the package carries -------------------
     Board 865: from 2026-10-04 src/engine.mjs read the pinned shell at run time for four rules while
     the allowlist left it out, and every window leg runs the tree, where the shell is, so none saw it.
     9a names each pinned path Studio's own code reads, in the two forms it has (an at() call's literal
     parts in src/engine.mjs, the one door; a quoted engine/pinned/ path in src/, shell/ or ui/, which is
     how the page imports a pinned module) and holds each to the allowlist; 9b holds the door shut: no
     other route to the pinned folder in Studio's own code. 9c builds the package's layout in a lab and
     runs every getter src/engine.mjs exports there; 9d takes each at() path out of that lab alone and
     wants a getter to refuse it, so 9c reads the lab's absences and 9a names nothing nobody reads.
     A comment naming such a path is read as a read: that errs red, never green. */
  const ownCode = files.filter(f => /^(src|shell|ui)\//.test(f.rel) && /\.(mjs|cjs|js|html)$/.test(f.rel));
  const door = ownCode.find(f => f.rel === "src/engine.mjs");
  const reads = new Map(), unreadable = [];
  const AT_CALL = /(?<![.\w])(?<!function )at\(([^()]*)\)/g;
  for (const m of (door ? door.text : "").matchAll(AT_CALL)) {
    const parts = m[1].trim() ? m[1].split(",").map(s => s.trim()) : [];
    if (!parts.length || parts.some(s => !/^"[^"]+"$/.test(s))) { unreadable.push("at(" + m[1] + ")"); continue; }
    reads.set(PINNED + parts.map(s => s.slice(1, -1)).join("/"), "src/engine.mjs at()");
  }
  for (const f of ownCode)
    for (const m of f.text.matchAll(/["'`](?:\.\.\/)*engine\/pinned\/([^"'`*]+)["'`]/g))
      if (!reads.has(PINNED + m[1])) reads.set(PINNED + m[1], f.rel);
  const named = [...reads.keys()].sort();
  const notShipped = named.filter(r => dropped(r) || !fs.existsSync(path.join(ROOT, r)));
  check(!!door && named.length > 5 && notShipped.length === 0 && unreadable.length === 0,
    "9a every pinned path Studio's own code reads is shipped and on disk: " + named.length + " named ("
    + named.map(r => r.slice(PINNED.length)).join(", ") + ")"
    + (notShipped.length ? "; NOT SHIPPED: " + notShipped.join(", ") : "")
    + (unreadable.length ? "; an at() call this leg cannot read: " + unreadable.join(", ") : ""));
  /* The door: PINNED as a value is used by at() and the export alone, and no other file of Studio's
     own builds a path through a "pinned" segment or takes Engine.PINNED. */
  const pinnedUses = door ? (door.text.match(/[(,]\s*PINNED\b|\bPINNED\s*[,)]/g) || []).length : 0;
  const otherRoutes = ownCode.filter(f => f !== door
    && (/["'`]pinned["'`]/.test(f.text) || /\bEngine\s*\.\s*PINNED\b/.test(f.text))).map(f => f.rel);
  check(pinnedUses === 2 && otherRoutes.length === 0,
    "9b the door is the only route to the pinned folder: PINNED used as a value " + pinnedUses
    + " time(s) in src/engine.mjs (at() and the export), other files building a pinned path: "
    + (otherRoutes.length ? otherRoutes.join(", ") : "none"));

  /* The lab: package.json, src/ and engine/pinned/ as the allowlist ships them, byte for byte. */
  const lab = fs.mkdtempSync(path.join(os.tmpdir(), "studio-shipped-"));
  let imports = 0;
  const getters = async () => {
    for (const k of Object.keys(require.cache)) if (k.indexOf(lab) === 0) delete require.cache[k];
    const E = await import(pathToFileURL(path.join(lab, "src", "engine.mjs")).href + "?lab=" + (++imports));
    const names = Object.keys(E).filter(k => typeof E[k] === "function" && !/From$/.test(k)).sort();
    const refused = [];
    for (const k of names) {
      try { await E[k](); } catch (e) { refused.push({ k, why: String(e && e.message || e).split(lab).join("<lab>") }); }
    }
    return { E, names, refused };
  };
  try {
    for (const f of files) {
      if (dropped(f.rel) || !(f.rel === "package.json" || /^src\//.test(f.rel) || f.rel.indexOf(PINNED) === 0)) continue;
      fs.mkdirSync(path.dirname(path.join(lab, f.rel)), { recursive: true });
      fs.copyFileSync(path.join(ROOT, f.rel), path.join(lab, f.rel));
    }
    const all = await getters();
    check(path.resolve(all.E.ROOT) === path.resolve(lab) && all.names.length > 15 && all.refused.length === 0,
      "9c in a lab holding only what the allowlist ships, every getter src/engine.mjs exports runs: "
      + (all.names.length - all.refused.length) + " of " + all.names.length
      + (all.refused.length ? "; REFUSED " + all.refused.map(r => r.k + " (" + r.why.slice(0, 120) + ")").join("; ") : ""));
    const atPaths = named.filter(r => reads.get(r) === "src/engine.mjs at()" && fs.existsSync(path.join(lab, r)));
    const blind = [];
    for (const r of atPaths) {
      const p = path.join(lab, r);
      fs.renameSync(p, p + ".gone");
      const one = await getters();
      fs.renameSync(p + ".gone", p);
      if (!one.refused.some(x => x.why.indexOf(r.split("/").pop()) > -1)) blind.push(r.slice(PINNED.length));
    }
    check(atPaths.length > 5 && blind.length === 0,
      "9d CONTROL: each of the " + atPaths.length + " at() paths the lab holds, taken out alone, makes a getter"
      + " refuse it, so 9c reads the lab's absences" + (blind.length ? "; NO GETTER REFUSED: " + blind.join(", ") : ""));
  } finally { fs.rmSync(lab, { recursive: true, force: true }); }

  process.stdout.write("no-model: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

await main();
