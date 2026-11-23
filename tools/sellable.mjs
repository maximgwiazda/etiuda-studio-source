/* WHETHER A BUILD CAN BE SOLD, asked by tools/release.mjs and held by tests/sellable.mjs; the
 * engine's tools/sellable.mjs in Studio's shape, with the one question the desk has no reason to
 * ask: whether this build can check a licence at all.
 *
 * The release sequence proves that a build is what the tree says. None of it asked whether the
 * build can be put in front of a customer, so an installer carrying no vendor key (every paid
 * licence read as `nokey`, every publish refused for want of a licence), a licence page naming no seller,
 * or an unsigned or badly signed installer all went through every gate green (the code-pass
 * survey of 2026-09-27, findings 13, 28, 29 and 30). These functions ask. They are kept apart from
 * tools/release.mjs because that file builds a scratch home and runs gates when it is loaded.
 *
 * A CUSTOMER BUILD AND A PREVIEW ARE TOLD APART BY THE VERSION, package.json's, which is what the
 * customer sees: the installer's file name, the version on Studio's own screen, Add or remove
 * programs. A bare x.y.z with a major of 1 or more is a customer's; a prerelease part or a major
 * of 0 (0.1.0 today, semver's "initial development") is a preview. A preview packages as it always
 * has and the release prints what would stop it as a customer's. `--customer` asks the customer's
 * questions of any version, which is how the refusal is rehearsed on a preview tree; nothing
 * turns them off for a customer version.
 *
 * What a customer build must be, each a reason it is refused:
 *   - a customer's version, by the rule above;
 *   - carrying the vendor's public key where a PACKAGED build reads it, asked of src/licence.mjs's
 *     own contextFor with packaged true, so that what is judged is what an installed copy uses;
 *   - a licence page with no bracketed placeholder left in it;
 *   - a sign-in client id for Microsoft and for Google in the table an installed copy offers (src/licence-client.mjs
 *     SIGN_IN_PROVIDERS), since a Studio nobody signed in to does nothing, and one offered no sign-in can never be signed in to;
 *   - signed: the builder configured with a certificate before the build, and after it the
 *     installer and the program both reading Authenticode Valid with a timestamp.
 * A PREVIEW with a certificate configured must come out Valid too, since a signing that was asked
 * for and failed is a fault whoever the build is for. A preview with none is not asked. */
import { execFileSync } from "node:child_process";
import { closeSync, existsSync, lstatSync, openSync, readdirSync, readFileSync, readSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

/** Is this version a customer's? Bare x.y.z, major 1 or more. */
export function customerVersion(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ""));
  return !!m && Number(m[1]) >= 1;
}

/** Why this version cannot be sold, or nothing. */
export function versionProblems(version) {
  const v = String(version || "");
  const m = /^(\d+)\.(\d+)\.(\d+)(.*)$/.exec(v);
  if (!m) return ["the version " + JSON.stringify(v) + " is not x.y.z"];
  if (m[4]) return ["the version " + v + " carries a prerelease or build part (" + m[4] + "), which marks a preview"];
  if (Number(m[1]) < 1) return ["the version " + v + " has major 0, which marks a preview"];
  return [];
}

/* THE VENDOR KEY A PACKAGED BUILD WILL USE, asked of the module that uses it: src/licence.mjs's
   contextFor with `packaged` true, which is the branch an installed copy takes and which honours
   nothing a caller or the environment hands in. Reading the constant as text would judge a line;
   this judges the answer. A module that cannot be loaded is a reason, not a pass. */
export async function packagedVendorKey(licenceModule) {
  try {
    const mod = await import(pathToFileURL(licenceModule).href);
    if (typeof mod.contextFor !== "function") return { error: licenceModule + " exports no contextFor" };
    return { key: mod.contextFor({}, {}, true, null).trustedKey };
  } catch (e) {
    return { error: licenceModule + " could not be loaded: " + String(e && e.message || e).split("\n")[0] };
  }
}

/** Why this key cannot check a licence, or nothing. An Ed25519 public key is 32 bytes, written
 *  as 64 hex characters (the header of src/licence.mjs says so); all zeros is a placeholder. */
export function vendorKeyProblems(read) {
  if (!read || read.error) return ["the vendor key cannot be read: " + (read ? read.error : "nothing was asked")];
  const k = read.key;
  if (k == null) return ["no vendor key is embedded (EMBEDDED_VENDOR_ROOT_KEY is null), so a packaged build reads every"
    + " licence as nokey, so no licence is read and nothing publishes"];
  if (typeof k !== "string" || !/^[0-9a-f]{64}$/i.test(k)) return ["the embedded vendor key is not 64 hex characters: "
    + JSON.stringify(String(k).slice(0, 80))];
  if (/^0+$/.test(k)) return ["the embedded vendor key is all zeros, which is a placeholder"];
  return [];
}

/* THE SIGN-IN AN INSTALLED COPY OFFERS (the test architect, 2026-11-22, on Claude alpha's rule that no production build ships
   without its client ids): the table src/licence-client.mjs ships, SIGN_IN_PROVIDERS, read from the module itself and never its
   lab-filled PROVIDERS_NOW, so a sign-in lab file or a test service's ids in the release's environment cannot pass a build whose
   installed copy offers nothing. As shipped today both ids are empty: an installed Studio draws no sign-in door, and the gate refuses
   every project act of a Studio nobody signed in to, so a customer could do nothing at all. A module that cannot be loaded is a
   reason, not a pass. */
export const SIGN_IN_NEEDED = ["microsoft", "google"];
export async function packagedSignIn(clientModule) {
  try {
    const mod = await import(pathToFileURL(clientModule).href);
    if (!Array.isArray(mod.SIGN_IN_PROVIDERS)) return { error: clientModule + " exports no SIGN_IN_PROVIDERS" };
    const ids = {};
    for (const p of mod.SIGN_IN_PROVIDERS) if (p && typeof p.id === "string") ids[p.id] = typeof p.clientId === "string" ? p.clientId : "";
    return { ids };
  } catch (e) {
    return { error: clientModule + " could not be loaded: " + String(e && e.message || e).split("\n")[0] };
  }
}
/** Why an installed copy could not be signed in to, or nothing. */
export function signInProblems(read) {
  if (!read || read.error) return ["the sign-in providers cannot be read: " + (read ? read.error : "nothing was asked")];
  const out = [];
  for (const id of SIGN_IN_NEEDED) {
    const v = read.ids ? read.ids[id] : undefined;
    const said = id + " has no sign-in client id in SIGN_IN_PROVIDERS, so an installed Studio offers no " + id + " sign-in, and a Studio nobody signed in to does nothing";
    if (typeof v !== "string" || !v.trim()) out.push(said); /* plant:sell-signin-id */
  }
  return out;
}

/* THE LICENCE PAGES ARE FOUND AS THE BUILDER FINDS THEM, by name in buildResources: license.txt,
   eula.txt and license_<lang>.txt, in any of the three kinds app-builder-lib reads. */
const PAGE = /^(license|eula)(_[a-z]{2}(_[a-z]{2})?)?\.(txt|rtf|html)$/i;
export function licencePages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => PAGE.test(f)).sort().map(f => join(dir, f));
}

/* A PLACEHOLDER IS A BRACKETED SPAN ON ONE LINE, the shape the drafter used for every term left
   open. The licence prose has no other square bracket. */
const HOLE = /\[[^\]\r\n]*\]/g;
export function placeholders(text) {
  const out = [];
  String(text).split(/\r?\n/).forEach((line, i) => {
    const found = line.match(HOLE);
    if (found) for (const f of found) out.push({ line: i + 1, text: f });
  });
  return out;
}

/** Why the licence pages in `dir` cannot go to a customer, or nothing. No page is a reason. */
export function licenceProblems(dir) {
  const pages = licencePages(dir);
  if (!pages.length) return ["no licence page in " + dir + ", so the installer would show none and this check read nothing"];
  const out = [];
  for (const p of pages) {
    const holes = placeholders(readFileSync(p, "utf8"));
    if (holes.length) out.push(p.replace(/\\/g, "/").split("/").pop() + " still carries "
      + holes.length + " placeholder(s): " + holes.map(h => "line " + h.line + " " + h.text).join(", "));
  }
  return out;
}

/* THE VARIABLES THAT DECIDE WHETHER A BUILD SIGNS, listed here and nowhere else: the ten that pick a
   route (electron-builder's own certificate links included) and the two passwords a key is opened with. */
export const SIGNING_VARS = ["ETIUDA_CERT", "ETIUDA_CERT_SHA1", "ETIUDA_CERT_SUBJECT", "ETIUDA_SIGNING_ENDPOINT",
  "ETIUDA_SIGNING_ACCOUNT", "ETIUDA_SIGNING_PROFILE", "ETIUDA_SIGNING_PUBLISHER", "CSC_LINK", "WIN_CSC_LINK", "ETIUDA_SIGN"];
export const KEY_PASSWORD_VARS = ["CSC_KEY_PASSWORD", "WIN_CSC_KEY_PASSWORD"];
/** `env` less those twelve, so a build a gate makes never signs, asks for a token's PIN or signs in to Azure or SSL.com.
 *  Names match case-insensitively on Windows, where the child reads them that way. */
export function withoutSigning(env = process.env) {
  const drop = new Set(SIGNING_VARS.concat(KEY_PASSWORD_VARS).map(k => k.toUpperCase()));
  const same = process.platform === "win32" ? k => k.toUpperCase() : k => k;
  const out = {};
  for (const k of Object.keys(env)) if (!drop.has(same(k))) out[k] = env[k];
  return out;
}

/* IS SIGNING CONFIGURED: true for every route electron-builder signs with and for nothing else, which
   tests/sellable.mjs holds against electron-builder's own code. A .pfx, a store certificate by
   thumbprint or subject (a token's), a sign hook, a certificate link (win.cscLink, then WIN_CSC_LINK,
   then CSC_LINK, an empty one shadowing the next), or Artifact Signing with the four fields its
   schema requires, which then wins over the rest; signExecutable false signs nothing. */
const ARTIFACT_NEEDS = ["endpoint", "codeSigningAccountName", "certificateProfileName", "publisherName"];
export function signingConfigured(win, env = process.env) {
  const w = win || {};
  if (w.signExecutable === false) return false;
  const az = w.azureSignOptions;
  if (az != null) return ARTIFACT_NEEDS.every(k => typeof az[k] === "string" && az[k] !== "");
  const st = w.signtoolOptions || {};
  const first = (a, b) => (a != null ? a : b);
  return !!(st.certificateFile || st.certificateSha1 || st.certificateSubjectName || st.sign
    || first(w.cscLink, first(env.WIN_CSC_LINK, env.CSC_LINK)));
}
const NO_ROUTE = "no certificate is configured (none of ETIUDA_CERT, ETIUDA_CERT_SHA1, ETIUDA_CERT_SUBJECT"
  + ", ETIUDA_SIGNING_* or ETIUDA_SIGN is set), so the installer would be unsigned";

/* WHAT WINDOWS SAYS OF A FILE: the Authenticode status, and whether a timestamp countersigns it.
   One PowerShell for every file. Off Windows: null, and the caller says NOT RUN. */
export function readAuthenticode(files) {
  if (process.platform !== "win32") return null;
  const q = f => "'" + String(f).replace(/'/g, "''") + "'";
  const script = "foreach ($f in @(" + files.map(q).join(",") + ")) { $s = Get-AuthenticodeSignature -LiteralPath $f; "
    + "[string]$s.Status + [char]9 + [string]([bool]$s.TimeStamperCertificate) + [char]9 + $f + [char]9 + [string]$s.SignerCertificate.Subject"
    + " + [char]9 + [string]$s.SignerCertificate.Thumbprint }";
  const out = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script],
    { encoding: "utf8", windowsHide: true, timeout: 120000 });
  const rows = out.split(/\r?\n/).filter(Boolean).map(l => {
    const [status, ts, file, subject, thumbprint] = l.split("\t");
    return { file, status: status.trim(), timestamped: ts.trim() === "True", subject: (subject || "").trim(), thumbprint: (thumbprint || "").trim().toUpperCase() };
  });
  if (rows.length !== files.length) throw new Error("Authenticode answered for " + rows.length + " of " + files.length + " file(s)");
  return rows;
}

/* THE FILES WINDOWS RUNS AS CODE, which a publisher rule allows or refuses one by one: every file under `dir` named as a
   program or a library Windows or Node loads (.exe, .dll, .node), and any other that opens with a PE header (MZ, then
   PE at the offset it names). A file whose header cannot be read is taken as one, so it is asked about rather than
   passed over. Links are not followed. Sorted, full paths. The engine's tools/sellable.mjs holds the same. */
const PE_NAME = /\.(exe|dll|node)$/i;
export function isPeFile(file) {
  if (PE_NAME.test(file)) return true;
  let fd = null;
  try {
    fd = openSync(file, "r");
    const head = Buffer.alloc(64);
    if (readSync(fd, head, 0, 64, 0) < 64 || head.readUInt16LE(0) !== 0x5a4d) return false;
    const sig = Buffer.alloc(4);
    return readSync(fd, sig, 0, 4, head.readUInt32LE(60)) === 4 && sig.readUInt32LE(0) === 0x4550; /* plant:sign-header */
  } catch { return true; } finally { if (fd !== null) closeSync(fd); }
}
export function peFiles(dir) {
  const out = [];
  const walk = at => {
    for (const name of readdirSync(at)) {
      const full = join(at, name), st = lstatSync(full);
      if (st.isDirectory()) walk(full);
      else if (st.isFile() && isPeFile(full)) out.push(full);
    }
  };
  walk(dir);
  return out.sort();
}

/** Why these readings fail when a signature is required, or nothing. A reading carrying a `label`, its path inside the
 *  app, is named by it, and any other by its file's name. */
const nameOf = r => r.label || String(r.file).replace(/\\/g, "/").split("/").pop();
export function signatureProblems(readings, required) {
  if (!required) return [];
  const out = [];
  for (const r of readings) {
    if (r.status !== "Valid") out.push(nameOf(r) + " reads Authenticode " + r.status + ", not Valid"); /* plant:sign-unsigned */
    else if (!r.timestamped) out.push(nameOf(r) + " is signed with no timestamp, so its signature dies with the certificate");
  }
  return out;
}

/* THE MAKERS WHOSE OWN SIGNATURE A SHIPPED FILE KEEPS, by the organisation (O=) of the certificate that signed it. The
   gate takes a file Valid under one of them as theirs; any other file must carry our publisher's signature. The engine's
   tools/sellable.mjs holds the same list. */
export const MAKERS = [{ name: "Microsoft", organisation: "Microsoft Corporation" }];
export function organisationOf(subject) {
  const m = /(?:^|,\s*)O=(?:"([^"]*)"|([^,]*))/.exec(String(subject || ""));
  return m ? (m[1] !== undefined ? m[1] : m[2]).trim() : "";
}
export function makerOf(reading) {
  const o = organisationOf(reading && reading.subject);
  return MAKERS.find(m => m.organisation === o) || null;
}

/* WHAT THE BUILD SIGNS: each file electron-builder hands its signer, except one that already reads Valid, which keeps its
   maker's signature (the gate then holds that maker to MAKERS). Put on the packager's signIf, the one door every route and
   every file passes through: the program, the extra resources, the installer and the uninstaller. Nothing is read while
   no certificate is configured. `signIo` is replaceable so a leg can say what Windows would. */
export const signIo = { read: files => readAuthenticode(files), log: line => console.log(line) };
export function keepMakersSignatures(packager) {
  if (!packager || typeof packager.signIf !== "function" || packager.signIf.keepsMakers) return false;
  const signIf = packager.signIf.bind(packager);
  const door = async file => {
    if (signingConfigured(packager.platformSpecificBuildOptions)) {
      let r = null;
      try { r = (signIo.read([file]) || [])[0] || null; } catch { r = null; }
      if (r && r.status === "Valid") { /* plant:sign-keep */
        signIo.log("  kept its maker's signature (" + (organisationOf(r.subject) || r.subject || "unnamed") + "): " + file);
        return false;
      }
    }
    return signIf(file);
  };
  door.keepsMakers = true;
  packager.signIf = door;
  return true;
}

/* OUR PUBLISHER WHERE THE CONFIGURATION NAMES IT: Artifact Signing"s publisherName or a store certificate"s subject (a part
   of the signer"s subject, as signtool"s /n takes it), a store certificate"s thumbprint, or the eSigner account"s certificate,
   which its hook records beside each file it signs in <dist>/.esigner/signings.jsonl. Null where nothing names it (a .pfx). */
export function ourPublisher(win, dist) {
  const w = win || {}, az = w.azureSignOptions || {}, st = w.signtoolOptions || {};
  if (az.publisherName) return { subject: String(az.publisherName), what: az.publisherName + " (Artifact Signing's publisherName)" };
  if (st.certificateSubjectName) return { subject: String(st.certificateSubjectName), what: st.certificateSubjectName + " (the certificate subject configured)" };
  if (st.certificateSha1) return { thumbprints: [String(st.certificateSha1).toUpperCase()], what: "the certificate " + String(st.certificateSha1).toUpperCase() + " configured" };
  const at = dist ? join(dist, ".esigner", "signings.jsonl") : "";
  if (!at || !existsSync(at)) return null;
  const prints = [...new Set(readFileSync(at, "utf8").split(/\r?\n/).filter(Boolean)
    .map(l => { try { return String(JSON.parse(l).thumbprint || "").toUpperCase(); } catch { return ""; } }).filter(Boolean))];
  return prints.length ? { thumbprints: prints, what: "the eSigner account's certificate " + prints.join(" or ") } : null;
}
function signedByNamed(r, named) {
  return named.subject ? String(r.subject || "").toLowerCase().includes(named.subject.toLowerCase())
    : named.thumbprints.includes(String(r.thumbprint || "").toUpperCase());
}

/* A BUILD SIGNED BY SSL.com"S DEMO CERTIFICATE (tools/esigner.cjs, ETIUDA_SIGN=esigner-demo) is never released, preview or
   customer: refused where the variable is set for the release, and wherever a file read carries the demo certificate's subject. */
const ESIGNER = createRequire(import.meta.url)("./esigner.cjs");
export function demoSigningProblems({ env, readings } = {}) {
  const out = [];
  if (env && ESIGNER.given(env) === "esigner-demo") out.push(ESIGNER.SIGN_VAR + " is esigner-demo, which signs with SSL.com's demo certificate, and no demo-signed build is released"); /* plant:sell-demo-var */
  for (const r of readings || []) if (ESIGNER.DEMO_SUBJECT.test(r.subject || "")) out.push(nameOf(r) + " is signed by SSL.com's demo certificate, which is never released"); /* plant:sell-demo-subject */
  return out;
}

/* THE SIGNATURE, asked by the package gate after the installer and its bill of materials: the
   installer and the program inside it, since a customer meets both. Required of a customer build
   and of any build with a certificate configured; a preview with none is not asked at all, which
   is what every Studio release did before 2026-09-27, when it had no signature gate. Given `app`,
   the unpacked folder the installer carries, every file in it Windows runs as code (peFiles) is read
   too and held to the same rule, each named by its path inside the app. Returns true or the reason. */
export function signatureVerdict({ setup, program, app, customer, win, ours, read = readAuthenticode, log = console.log }) {
  const required = !!customer || signingConfigured(win);
  if (!required) { log("  the signature is not asked: a preview with no certificate configured"); return true; }
  const files = [setup, program];
  const missing = files.concat(app === undefined ? [] : [app]).filter(f => !f || !existsSync(f));
  if (missing.length) return "nothing to read the signature of: " + missing.join(", ") + " is not there";
  if (app) files.push(...peFiles(app).filter(f => resolve(f) !== resolve(program))); /* plant:sign-walk */
  const label = f => app && !relative(app, f).startsWith("..") ? relative(app, f).replace(/\\/g, "/") : "";
  const read0 = read(files);
  if (!read0) return "NOT RUN: not Windows, so no signature can be read, and this build requires one";
  const readings = read0.map(r => ({ ...r, label: label(r.file) || undefined }));
  for (const r of readings) log("  Authenticode: " + r.status + (r.timestamped ? ", timestamped" : "") + "  " + r.file);
  /* A file the reader gave no answer for is a reading lost, not a pass. */
  const answered = new Set(readings.map(r => resolve(String(r.file))));
  const unread = files.filter(f => !answered.has(resolve(f))).map(f => (label(f) || nameOf({ file: f })) + " was not read, so its signature is not known"); /* plant:sign-unread */
  /* OURS is the publisher that signed the program (else the installer); every other Valid file is ours or a maker's. */
  const own = readings.find(r => r.file === program && r.status === "Valid") || readings.find(r => r.file === setup && r.status === "Valid");
  /* OURS is never a maker, and where the configuration names our publisher it is that one. */
  const whose = r => (r.file === program ? "the program" : "the installer") + " is signed by " + (organisationOf(r.subject) || r.subject || "an unnamed publisher");
  const ownMaker = required && own && makerOf(own) ? [whose(own) + ", a maker, not by us"] : []; /* plant:sign-own-maker */
  const named = ours === undefined ? ourPublisher(win) : ours;
  const ownNamed = required && own && named && !makerOf(own) && !signedByNamed(own, named) ? [whose(own) + ", not by " + named.what] : []; /* plant:sign-own-named */
  const foreign = required && own ? readings.filter(r => r.status === "Valid" && r.subject !== own.subject && !makerOf(r)) : []; /* plant:sign-publisher */
  const strangers = foreign.map(r => nameOf(r) + " is signed by " + (organisationOf(r.subject) || r.subject || "an unnamed publisher")
    + ", neither our publisher nor a maker on the list (" + MAKERS.map(m => m.name).join(", ") + ")");
  const problems = unread.concat(ownMaker, ownNamed, signatureProblems(readings, required), strangers, demoSigningProblems({ readings }));
  return problems.length ? problems.join("; ") : true;
}

/** The questions asked before a build. `problems` is filled for a preview too. */
export async function beforeBuild({ version, customer, licenceDir, licenceModule, clientModule, win }) {
  const asCustomer = !!customer || customerVersion(version);
  const client = clientModule || join(resolve(licenceModule, ".."), "licence-client.mjs");
  const problems = []
    .concat(versionProblems(version))
    .concat(vendorKeyProblems(await packagedVendorKey(licenceModule)))
    .concat(signInProblems(await packagedSignIn(client))) /* plant:sell-signin-asked */
    .concat(licenceProblems(licenceDir))
    .concat(signingConfigured(win) ? [] : [NO_ROUTE]);
  return { customer: asCustomer, problems };
}

/* THE TEST SERVICE BUILD (tools/test-service.cjs) is never sold and never released, preview or customer: refused where its
   variable is set for the release, where a package's asar carries its fields, and where a file of its name lies beside the asar. */
export const TEST_SERVICE_VAR = "ETIUDA_PACK_TEST_SERVICE";
export const TEST_SERVICE_FILE = "test-service.json";
export function testServiceProblems({ env, resources } = {}) {
  const out = [];
  if (env && typeof env[TEST_SERVICE_VAR] === "string" && env[TEST_SERVICE_VAR] !== "")
    out.push(TEST_SERVICE_VAR + " is set, which makes a test service build, and no test service build is released"); /* plant:sell-ts-var */
  for (const dir of [].concat(resources || [])) {
    if (existsSync(join(dir, TEST_SERVICE_FILE))) out.push(join(dir, TEST_SERVICE_FILE) + " is in the package, so it is a test service build, which is never released"); /* plant:sell-ts-file */
    const pkg = createRequire(import.meta.url)("./test-service.cjs").asarPackage(join(dir, "app.asar"));
    if (pkg && pkg.etiudaTestService !== undefined) out.push(join(dir, "app.asar") + " carries the test service fields, so it is a test service build, which is never released"); /* plant:sell-ts-asar */
  }
  return out;
}

/* A CUSTOMER BUILD REQUIRES A GREEN RELEASE PROFILE (regimen rule 4, decision 2026-11-05 11:43).
 * Whatever reaches a customer (a customer's or a pilot's installer, a tag, a live deploy)
 * ships only from a tree whose release profile is green on that same tree, with no red of
 * class hold. A test build for Maxim alone needs no release profile, and no tool refuses it.
 *
 * No grace for a stale record: a different tree is not the same tree. The regimen's test-only
 * inheritance is left out here: a customer build requires a direct whole-profile summary
 * for git rev-parse HEAD^{tree}. */
export function releaseProfileProblems({ runs, tree }) {
  if (!tree) return ["cannot determine git tree: git rev-parse HEAD^{tree} returned empty; run node tools/gate-run.mjs release"];
  if (!runs || !existsSync(runs)) {
    return ["no release profile summary found for git tree " + tree
      + " (regimen rule 4, decision 2026-11-05 11:43); run node tools/gate-run.mjs release"];
  }

  const files = readdirSync(runs).filter(f => f.startsWith("profile-") && f.endsWith(".json")).sort();
  const summaries = [];
  for (const f of files) {
    try {
      const parsed = JSON.parse(readFileSync(join(runs, f), "utf8"));
      if (parsed && parsed.kind === "profile") summaries.push(parsed);
    } catch (e) {
      /* a malformed or partial summary file is skipped */
    }
  }

  const matching = summaries.filter(s => s.gitTree === tree);
  if (!matching.length) {
    const otherTrees = [...new Set(summaries.map(s => s.gitTree).filter(Boolean))];
    const mentionOthers = otherTrees.length ? " (found summary for " + otherTrees.join(", ") + ")" : "";
    return ["no release profile summary found for git tree " + tree + mentionOthers
      + " (regimen rule 4, decision 2026-11-05 11:43); run node tools/gate-run.mjs release"];
  }

  /* The newest summary for this tree by its own time, not by file name: names sort by profile first. */
  matching.sort((x, y) => String(x.time || "").localeCompare(String(y.time || "")));
  const newest = matching[matching.length - 1];

  /* 1. Whole profile coverage: gates run must cover the profile gates */
  const runCount = Number(newest.gatesRunCount != null ? newest.gatesRunCount
    : (Array.isArray(newest.gatesRun) ? newest.gatesRun.length : 0));
  const profileCount = Number(newest.profileGatesCount != null ? newest.profileGatesCount
    : (Array.isArray(newest.profileGates) ? newest.profileGates.length : 0));
  /* A summary that lists no profile cannot show it covered the profile. */
  if (profileCount === 0 || runCount < profileCount) {
    return ["release profile summary for git tree " + tree + " does not cover the whole profile ("
      + runCount + " of " + profileCount + " gate(s) run) (regimen rule 4, decision 2026-11-05 11:43); run node tools/gate-run.mjs release"];
  }

  /* 2. No red of class hold */
  const reds = Array.isArray(newest.reds) ? newest.reds : [];
  const holdReds = reds.filter(r => r.class !== "warn");
  const holdsRedCount = Number(newest.holdsRed != null ? newest.holdsRed : holdReds.length);
  if (holdsRedCount > 0 || holdReds.length > 0) {
    const names = holdReds.map(r => r.gate || r.cmd || "unknown").filter(Boolean);
    const detail = names.length ? " (" + names.join(", ") + ")" : "";
    return ["release profile summary for git tree " + tree + " has " + (holdsRedCount || holdReds.length)
      + " red(s) of class hold" + detail + " (regimen rule 4, decision 2026-11-05 11:43); run node tools/gate-run.mjs release"];
  }

  return [];
}

