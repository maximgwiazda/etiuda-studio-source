/* WHETHER A BUILD CAN BE SOLD: tools/sellable.mjs, on planted inputs.
 *
 *     node tests/sellable.mjs
 *
 * Nothing here packages anything. tests/release.mjs 11a-11e drives tools/release.mjs asking these
 * questions in a lab; this file holds the answers themselves, each refusal on a fault planted for
 * it and each pass on the same input with the fault taken out:
 *   1  which version is a customer's, and why one is not
 *   2  the vendor key a PACKAGED build uses, asked of src/licence.mjs's own contextFor: the real
 *      module answers, a planted key is read back, a key handed in through the environment is
 *      NOT (that is the development branch, and a packaged build ignores it), and a null, short,
 *      zero or unloadable key is each a reason
 *   3  a licence page with a bracketed placeholder is refused, one without is not, and no page at
 *      all is refused rather than read as clean
 *   4  signing is read out of the real electron-builder.js: each environment's route, the refusals,
 *      and signingConfigured against electron-builder's own code
 *   5  when a signature is required only Valid with a timestamp passes; a preview with no
 *      certificate is not asked at all, as before this gate existed
 *   6  what Windows says of a signed tool, of a copy with one byte changed and of an unsigned
 *      program, and the signature gate's body on those files
 *   8  the program names its maker: package.json carries the author electron-builder reads, so
 *      the packaged program stops naming Electron's default
 *   9  the builds the gates make when given no installer run tools/package.mjs without the twelve
 *      signing variables, listed once in tools/sellable.mjs, and the release keeps its own
 *  10  the eSigner route (tools/esigner.cjs), its effects replaced: unset it gives no block, the hook is handed each file once,
 *      the account's values reach the tool only through an argument file, the exit code is not the answer, and a demo-signed
 *      build is never released
 * The expected values were written from the rule in tools/sellable.mjs before any run. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { customerVersion, versionProblems, packagedVendorKey, vendorKeyProblems, placeholders, licencePages,
         licenceProblems, signingConfigured, signatureProblems, readAuthenticode, signatureVerdict,
         beforeBuild, packagedSignIn, signInProblems, SIGNING_VARS, KEY_PASSWORD_VARS, withoutSigning } from "../tools/sellable.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
/* The floor: every leg below runs or is counted NOT RUN, or the tally says so. */
const EXPECTED = 58;

let asserted = 0, failed = 0, notRun = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(why, legs) { notRun += legs; process.stdout.write("  NOT RUN " + why + "\n"); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-sellable-"));
const HEX = "0123456789abcdef".repeat(4);
const LICENCE = path.join(ROOT, "src", "licence.mjs");
const REAL_LICENCE = fs.readFileSync(LICENCE, "utf8");
const KEY_LINE = /const EMBEDDED_VENDOR_ROOT_KEY = [^;\n]*;/;
/* A copy of the real module with its key line planted, beside a sign.mjs that re-exports the real
   one, so the copy's own import resolves and nothing else about it differs. */
function plantedModule(name, keyText) {
  const dir = path.join(TMP, name, "src");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "licence.mjs"), REAL_LICENCE.replace(KEY_LINE, "const EMBEDDED_VENDOR_ROOT_KEY = " + keyText + ";"));
  fs.writeFileSync(path.join(dir, "sign.mjs"), "export * from " + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href) + ";\n");
  return path.join(dir, "licence.mjs");
}
const EN = fs.readFileSync(path.join(ROOT, "packaging", "license_en.txt"), "utf8");
const FILLED = EN.replace(/\[[^\]\r\n]*\]/g, "Example Trading");
const HOLED = FILLED.replace(/\n/, "\n[Seller's legal name], [registered address]\n");
function pages(name, files) {
  const dir = path.join(TMP, name);
  fs.mkdirSync(dir, { recursive: true });
  for (const [f, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), text);
  return dir;
}

try {
  /* ---- 1. the version --------------------------------------------------------------------- */
  const VERSIONS = { "1.0.0": true, "2.3.4": true, "0.1.0": false, "0.9.9": false, "1.0.0-rc.1": false,
                     "1.0.0+7": false, "1.0": false, "": false };
  const wrong = Object.keys(VERSIONS).filter(v => customerVersion(v) !== VERSIONS[v]);
  check(!wrong.length, "1a a customer's version is a bare x.y.z with a major of 1 or more, over "
    + Object.keys(VERSIONS).length + " versions" + (wrong.length ? "; wrong for " + wrong.join(", ") : ""));
  const why = v => versionProblems(v).length;
  check(why("1.0.0") === 0 && why("0.1.0") === 1 && why("1.0.0-rc.1") === 1 && why("1.0") === 1,
    "1b a sellable version gives no reason and each preview shape gives one");

  /* ---- 2. the vendor key, asked of the module ---------------------------------------------- */
  check(KEY_LINE.test(REAL_LICENCE), "2a the key line the plants below replace is in src/licence.mjs");
  const real = await packagedVendorKey(LICENCE);
  check(!real.error && "key" in real, "2b the real src/licence.mjs loads and its contextFor answers for a"
    + " packaged build: " + (real.error || JSON.stringify(real.key)));
  const withKey = await packagedVendorKey(plantedModule("with-key", JSON.stringify(HEX)));
  check(withKey.key === HEX && vendorKeyProblems(withKey).length === 0,
    "2c a module with a key planted is read back as that key, and it is no reason: " + JSON.stringify(withKey));
  const was = process.env.STUDIO_VENDOR_KEY;
  process.env.STUDIO_VENDOR_KEY = HEX;
  let leaked;
  try { leaked = await packagedVendorKey(plantedModule("null-with-env", "null")); }
  finally { if (was == null) delete process.env.STUDIO_VENDOR_KEY; else process.env.STUDIO_VENDOR_KEY = was; }
  const nullWhy = vendorKeyProblems(leaked);
  check(leaked.key === null && nullWhy.length === 1 && /nokey/.test(nullWhy[0]) && /nothing publishes/.test(nullWhy[0]),
    "2d a null key stays null with STUDIO_VENDOR_KEY set, since a packaged build ignores the environment,"
    + " and is refused saying what the customer would meet: " + JSON.stringify(nullWhy));
  const shortWhy = vendorKeyProblems(await packagedVendorKey(plantedModule("short", JSON.stringify("abc123"))));
  const zeroWhy = vendorKeyProblems({ key: "0".repeat(64) });
  check(shortWhy.length === 1 && /64 hex/.test(shortWhy[0]) && zeroWhy.length === 1 && /zeros/.test(zeroWhy[0]),
    "2e a key that is not 64 hex characters, and one of all zeros, are each refused");
  const broken = path.join(TMP, "broken.mjs");
  fs.writeFileSync(broken, "throw new Error(\"planted\");\n");
  const bare = path.join(TMP, "bare.mjs");
  fs.writeFileSync(bare, "export const x = 1;\n");
  const b1 = vendorKeyProblems(await packagedVendorKey(broken)), b2 = vendorKeyProblems(await packagedVendorKey(bare));
  check(b1.length === 1 && /could not be loaded/.test(b1[0]) && b2.length === 1 && /no contextFor/.test(b2[0]),
    "2f a module that will not load, and one with no contextFor, are reasons rather than passes");

  /* ---- 2s. the sign-in an installed copy offers (the test architect, 2026-11-22) ------------- */
  const realSign = await packagedSignIn(path.join(ROOT, "src", "licence-client.mjs"));
  check(!realSign.error && realSign.ids && "microsoft" in realSign.ids && "google" in realSign.ids,
    "2s1 the real src/licence-client.mjs loads and its shipped table names Microsoft and Google: " + (realSign.error || JSON.stringify(Object.keys(realSign.ids || {}))));
  const provs = (ms, g) => {
    const f = path.join(TMP, "providers-" + (ms ? "m" : "") + (g ? "g" : "") + ".mjs");
    fs.writeFileSync(f, "export const SIGN_IN_PROVIDERS = " + JSON.stringify([{ id: "microsoft", clientId: ms }, { id: "google", clientId: g }]) + ";\n");
    return f;
  };
  const both = signInProblems(await packagedSignIn(provs("11111111-2222-3333-4444-555555555555", "1234567890-abc.apps.googleusercontent.com")));
  const none = signInProblems(await packagedSignIn(provs("", "")));
  const msOnly = signInProblems(await packagedSignIn(provs("11111111-2222-3333-4444-555555555555", "")));
  check(both.length === 0 && none.length === 2 && msOnly.length === 1 && /^google /.test(msOnly[0]) && /does nothing/.test(none[0]),
    "2s2 a table with both ids gives no reason, one with neither gives two, and one without Google's names Google: " + JSON.stringify([both.length, none.length, msOnly]));
  const sBroken = signInProblems(await packagedSignIn(broken)), sBare = signInProblems(await packagedSignIn(bare));
  check(sBroken.length === 1 && /could not be loaded/.test(sBroken[0]) && sBare.length === 1 && /no SIGN_IN_PROVIDERS/.test(sBare[0]),
    "2s3 a module that will not load, and one with no SIGN_IN_PROVIDERS, are reasons rather than passes");
  /* 2s's teeth: plant:sell-signin-id lifted lets a table with neither id through, and plant:sell-signin-asked lifted leaves the release's
     own question unasked, so this tree's missing ids stop nothing. Planted faults, so not run under ETIUDA_PLANTS=off. */
  if (process.env.ETIUDA_PLANTS === "off") skip("2s-plant, plant:sell-signin-id and plant:sell-signin-asked lifted (ETIUDA_PLANTS=off)", 1);
  else {
    const sellText = fs.readFileSync(path.join(ROOT, "tools", "sellable.mjs"), "utf8");
    const liftS = (marker, line) => {
      const t = sellText.split("\n").map(l => l.includes("plant:" + marker) ? line + " /* plant:" + marker + " */" : l).join("\n");
      const at = path.join(TMP, "sellable-" + marker + ".mjs");
      fs.writeFileSync(at, t);
      return t === sellText ? null : at;
    };
    for (const f of ["esigner.cjs", "test-service.cjs"]) fs.copyFileSync(path.join(ROOT, "tools", f), path.join(TMP, f));
    const idAt = liftS("sell-signin-id", "    void 0;"), askAt = liftS("sell-signin-asked", "    .concat([])");
    const pi = idAt && await import(pathToFileURL(idAt).href), pa = askAt && await import(pathToFileURL(askAt).href);
    const noneLifted = pi ? pi.signInProblems(await pi.packagedSignIn(provs("", ""))) : null;
    const asked = pa ? await pa.beforeBuild({ version: "1.0.0", customer: true, licenceDir: path.join(ROOT, "packaging"), licenceModule: LICENCE,
      clientModule: provs("", ""), win: {} }) : null;
    check(!!noneLifted && noneLifted.length === 0 && !!asked && !asked.problems.some(p => /sign-in client id/.test(p)),
      "2s-plant with plant:sell-signin-id and plant:sell-signin-asked lifted each let a build with no client ids through, so 2s has teeth");
  }

  /* ---- 3. the licence page ------------------------------------------------------------------ */
  const holes = placeholders(HOLED);
  check(holes.length === 2 && holes[0].line === 2 && holes[0].text === "[Seller's legal name]",
    "3a a planted placeholder line is found by line and text: " + JSON.stringify(holes));
  const redL = licenceProblems(pages("holed", { "license_en.txt": HOLED, "license_pl.txt": FILLED }));
  const greenL = licenceProblems(pages("filled", { "license_en.txt": FILLED, "license_pl.txt": FILLED }));
  check(redL.length === 1 && /license_en\.txt/.test(redL[0]) && greenL.length === 0,
    "3b the page carrying it is refused by name and the same pages filled pass: " + redL.length + " against " + greenL.length);
  check(licenceProblems(pages("empty", { "readme.md": "x" })).length === 1,
    "3c a folder with no licence page is refused, not read as clean");
  const found = licencePages(pages("names", { "license_en.txt": "a", "LICENSE_PL.TXT": "b", "eula.txt": "c",
    "license-notes.md": "e", "licence_en.txt": "f" })).map(f => path.basename(f));
  check(found.join(",") === "LICENSE_PL.TXT,eula.txt,license_en.txt",
    "3d the pages are the names the builder reads, in any case, and nothing else: " + found.join(","));

  /* ---- 4. signing, as the real electron-builder.js configures it ---------------------------- */
  /* Every variable that picks a route is cleared around each reading, so one set on the desk
     running this changes nothing here. */
  const builder = path.join(ROOT, "electron-builder.js");
  const winWith = vars => {
    const was = {};
    for (const k of SIGNING_VARS) { was[k] = process.env[k]; delete process.env[k]; }
    Object.assign(process.env, vars || {});
    delete require.cache[require.resolve(builder)];
    try { return require(builder).win; }
    finally {
      for (const k of SIGNING_VARS) { if (was[k] == null) delete process.env[k]; else process.env[k] = was[k]; }
      delete require.cache[require.resolve(builder)];
    }
  };
  const PFX = "C:/nowhere/etiuda.pfx", THUMB = "0123456789abcdef0123456789abcdef01234567", WHO = "Example Publisher";
  const AZ = { ETIUDA_SIGNING_ENDPOINT: "https://weu.codesigning.azure.net", ETIUDA_SIGNING_ACCOUNT: "exampleaccount",
    ETIUDA_SIGNING_PROFILE: "exampleprofile", ETIUDA_SIGNING_PUBLISHER: WHO };
  const routeOf = w => JSON.stringify({ signtoolOptions: w.signtoolOptions, azureSignOptions: w.azureSignOptions });
  const unsignedWin = winWith(null), pfxWin = winWith({ ETIUDA_CERT: PFX });
  const PFX_BEFORE = { signtoolOptions: { certificateFile: PFX, signingHashAlgorithms: ["sha256"],
    rfc3161TimeStampServer: "http://timestamp.digicert.com" } };
  check(routeOf(unsignedWin) === "{}" && !signingConfigured(unsignedWin, {}) && signingConfigured(pfxWin, {})
    && routeOf(pfxWin) === JSON.stringify(PFX_BEFORE),
    "4a the real builder with no signing variable signs nothing, and with ETIUDA_CERT set signs from the .pfx by"
    + " the block it always did, key for key: " + routeOf(pfxWin));

  /* ELECTRON-BUILDER'S OWN ANSWER to "would this sign", asked of its code rather than restated: the
     schema it validates a configuration against, then WinPackager's signIf on a stub packager whose
     signtool run and PowerShell are replaced, so nothing is signed, installed or read from the real
     certificate store; the store it is shown holds one planted certificate. The one line restated is
     the constructor's choice of Artifact Signing whenever azureSignOptions is present. */
  const ABL = path.join(ROOT, "node_modules", "app-builder-lib", "package.json");
  let EB = null, ebMissing = "";
  if (fs.existsSync(ABL)) {
    try {
      const abl = createRequire(ABL);
      abl("app-builder-lib");   /* the index first: winPackager.js loaded alone meets a class cycle */
      EB = { ...abl("./out/winPackager.js"), ...abl("./out/codeSign/windowsSignToolManager.js"),
             ...abl("./out/codeSign/windowsSignAzureManager.js"), ...abl("./out/util/config/config.js"),
             util: abl("builder-util") };
      for (const k of ["WinPackager", "WindowsSignToolManager", "WindowsSignAzureManager", "validateConfiguration"])
        if (!EB[k]) throw new Error("app-builder-lib no longer exports " + k + " where this leg reads it");
      /* The Artifact Signing signer is run only while its one way out is the packager's vm, which is
         the stub below: it must never reach Azure, or a sign-in, from this desk. */
      if (!/this\.packager\.vm\.value/.test(String(EB.WindowsSignAzureManager.prototype.signFile)))
        throw new Error("the Artifact Signing signer no longer reaches PowerShell only through the packager's vm, so it is not run here");
    } catch (e) { EB = null; ebMissing = String(e.message).split("\n")[0]; }
  }
  const STORE = [{ Subject: "CN=" + WHO, Thumbprint: THUMB.toUpperCase(),
    PSParentPath: "Microsoft.PowerShell.Security\\Certificate::CurrentUser\\My" }];
  const LINK_VARS = ["CSC_LINK", "WIN_CSC_LINK", "CSC_KEY_PASSWORD", "WIN_CSC_KEY_PASSWORD"];
  /* THE SIGNER IS SEALED WHILE IT RUNS. The check on its source text asks whether the vm is named, not
     whether it is the only way out: a signer that also starts a process, opens a connection or fetches
     would be run here against the real profile. So while signIf runs, everything that starts a process
     or reaches a network throws and is counted in ESCAPES, which 4b requires to be empty. The objects
     are CommonJS, and electron-builder looks its calls up at call time, so replacing them reaches it. */
  const ESCAPES = [];
  const SEALED = [["child_process", require("node:child_process"), ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]],
    ["http", require("node:http"), ["request", "get"]], ["https", require("node:https"), ["request", "get"]],
    ["net", require("node:net"), ["connect", "createConnection"]], ["net.Socket.prototype", require("node:net").Socket.prototype, ["connect"]],
    ["tls", require("node:tls"), ["connect"]],
    ["dns", require("node:dns"), ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "reverse"]],
    ["dns.promises", require("node:dns").promises, ["lookup", "resolve", "resolve4", "resolve6"]], ["globalThis", globalThis, ["fetch"]]];
  async function whileSealed(run) {
    const put = [];
    for (const [label, obj, names] of SEALED) for (const n of names) {
      const was = Object.getOwnPropertyDescriptor(obj, n);
      if (!was) continue;
      put.push([obj, n, was]);
      Object.defineProperty(obj, n, { configurable: true, writable: true, value: function () {
        ESCAPES.push(label + "." + n);
        throw new Error("sealed: " + label + "." + n + " was called while the signer ran");
      } });
    }
    try { return await run(); }
    finally { for (const [obj, n, was] of put.reverse()) Object.defineProperty(obj, n, was); }
  }
  async function wouldSign(win, env = {}) {
    const was = {};
    for (const k of LINK_VARS) { was[k] = process.env[k]; delete process.env[k]; if (env[k] != null) process.env[k] = env[k]; }
    const stream = EB.util.log.stream;
    EB.util.log.stream = { write: () => true };   /* its own progress lines, not this file's */
    const calls = [];
    try {
      try { await EB.validateConfiguration({ win }, { isEnabled: false }); }
      catch (e) { return { signs: false, calls, why: "the schema refuses it" }; }
      const vm = { powershellCommand: { value: Promise.resolve("powershell.exe") }, toVmFile: f => f,
        exec: async (ps, args) => { calls.push(args.join(" ")); return JSON.stringify(STORE); } };
      const stub = Object.create(EB.WinPackager.prototype);
      Object.assign(stub, { platformSpecificBuildOptions: win, signingQueue: Promise.resolve(true),
        info: { config: {}, debugLogger: { isEnabled: false }, getWorkspaceRoot: async () => ROOT },
        appInfo: { productName: "Etiuda Studio", computePackageUrl: async () => null, type: "app" },
        vm: { value: Promise.resolve(vm) } });
      const manager = win.azureSignOptions != null ? new EB.WindowsSignAzureManager(stub) : new EB.WindowsSignToolManager(stub);
      if (manager instanceof EB.WindowsSignToolManager) manager.doSign = async () => {};
      stub.signingManager = { value: Promise.resolve(manager) };
      try { return { signs: !!(await whileSealed(() => stub.signIf(path.join(TMP, "etiuda-studio-setup.exe")))), calls }; }
      catch (e) { return { signs: false, calls, why: "it throws: " + String(e.message).slice(0, 80) }; }
    } finally {
      EB.util.log.stream = stream;
      for (const k of LINK_VARS) { if (was[k] == null) delete process.env[k]; else process.env[k] = was[k]; }
    }
  }

  if (!EB) {
    if (ebMissing) check(false, "4b-4e electron-builder's own code could not be read: " + ebMissing);
    else skip("4b-4e need app-builder-lib in node_modules to ask electron-builder itself", 4);
  } else {
    /* 4b: each environment picks its route, the block passes electron-builder's schema, and its own
       signing path signs with it; Artifact Signing's values reach the command it would run. */
    const ST = w => w.signtoolOptions || {}, AO = w => w.azureSignOptions || {};
    const ROUTES = [
      ["none", {}, w => !w.signtoolOptions && !w.azureSignOptions, false],
      [".pfx", { ETIUDA_CERT: PFX }, w => ST(w).certificateFile === PFX && !w.azureSignOptions, true],
      ["thumbprint", { ETIUDA_CERT_SHA1: THUMB }, w => ST(w).certificateSha1 === THUMB
        && !ST(w).certificateFile && !ST(w).certificateSubjectName && !w.azureSignOptions, true],
      ["subject", { ETIUDA_CERT_SUBJECT: WHO }, w => ST(w).certificateSubjectName === WHO
        && !ST(w).certificateFile && !ST(w).certificateSha1 && !w.azureSignOptions, true],
      ["thumbprint and subject", { ETIUDA_CERT_SHA1: THUMB, ETIUDA_CERT_SUBJECT: WHO }, w => ST(w).certificateSha1 === THUMB
        && ST(w).certificateSubjectName === WHO && !ST(w).certificateFile && !w.azureSignOptions, true],
      ["Artifact Signing", AZ, w => !w.signtoolOptions && AO(w).endpoint === AZ.ETIUDA_SIGNING_ENDPOINT
        && AO(w).codeSigningAccountName === AZ.ETIUDA_SIGNING_ACCOUNT
        && AO(w).certificateProfileName === AZ.ETIUDA_SIGNING_PROFILE
        && AO(w).publisherName === WHO, true],
    ];
    const wrongRoute = [];
    for (const [name, vars, shape, signs] of ROUTES) {
      const w = winWith(vars), eb = await wouldSign(w);
      const timestamped = !w.signtoolOptions || w.signtoolOptions.rfc3161TimeStampServer === "http://timestamp.digicert.com";
      const reached = name !== "Artifact Signing" || (eb.calls.length === 1 && / -Command Invoke-TrustedSigning /.test(eb.calls[0])
        && ["ETIUDA_SIGNING_ENDPOINT", "ETIUDA_SIGNING_ACCOUNT", "ETIUDA_SIGNING_PROFILE"].every(k => eb.calls[0].includes("'" + AZ[k] + "'")));
      if (!shape(w) || eb.signs !== signs || signingConfigured(w, {}) !== signs || !timestamped || !reached)
        wrongRoute.push(name + " (" + routeOf(w) + ", electron-builder " + eb.signs + (eb.why ? ", " + eb.why : "") + ")");
    }
    check(!wrongRoute.length && ESCAPES.length === 0, "4b each of " + ROUTES.length + " environments picks its route, which electron-builder's"
      + " schema accepts and its signing path signs with (none signs nothing), and the signer, sealed while it ran, started no process and"
      + " reached no network (" + ESCAPES.length + " escape(s))" + (wrongRoute.length ? "; wrong: " + wrongRoute.join("; ") : "")
      + (ESCAPES.length ? "; it reached for " + [...new Set(ESCAPES)].join(", ") : ""));

    /* 4c: two routes at once, or Artifact Signing short of a field, refuses by name. */
    const refusal = vars => { try { winWith(vars); return ""; } catch (e) { return String(e.message); } };
    const { ETIUDA_SIGNING_PUBLISHER: _publisher, ...AZ_THREE } = AZ;
    const r1 = refusal({ ETIUDA_CERT: PFX, ETIUDA_CERT_SHA1: THUMB }), r2 = refusal({ ETIUDA_CERT: PFX, ...AZ });
    const r3 = refusal({ ETIUDA_CERT_SUBJECT: WHO, ...AZ }), r4 = refusal(AZ_THREE);
    check(/ETIUDA_CERT and ETIUDA_CERT_SHA1/.test(r1) && /ETIUDA_CERT and ETIUDA_SIGNING_\*/.test(r2)
      && /ETIUDA_CERT_SUBJECT and ETIUDA_SIGNING_\*/.test(r3) && /needs ETIUDA_SIGNING_PUBLISHER too$/.test(r4),
      "4c two routes at once refuse naming both, and Artifact Signing short of one field names it: " + JSON.stringify([r1, r2, r3, r4]));

    /* 4d: signingConfigured says what electron-builder does, on planted blocks: the rehearsal's five
       first, then those that decide "and nothing else" and the certificate links it reads itself. */
    const LINK = path.join(TMP, "planted.pfx");
    fs.writeFileSync(LINK, "not a certificate");
    const TS = { signingHashAlgorithms: ["sha256"], rfc3161TimeStampServer: "http://timestamp.digicert.com" };
    const AZ_BLOCK = { endpoint: AZ.ETIUDA_SIGNING_ENDPOINT, codeSigningAccountName: "a", certificateProfileName: "p", publisherName: WHO };
    const PLANTED = [
      ["pfx", { signtoolOptions: { certificateFile: PFX, ...TS } }],
      ["azure", { azureSignOptions: AZ_BLOCK }],
      ["sha1", { signtoolOptions: { certificateSha1: THUMB, ...TS } }],
      ["subject", { signtoolOptions: { certificateSubjectName: WHO, ...TS } }],
      ["none", {}],
      ["azure short of three fields", { azureSignOptions: { endpoint: "x" } }],
      ["win.certificateFile", { certificateFile: PFX }],
      ["win.sign", { sign: "./sign.js" }],
      ["a timestamp alone", { signtoolOptions: TS }],
      ["pfx with signExecutable false", { signtoolOptions: { certificateFile: PFX, ...TS }, signExecutable: false }],
      ["win.cscLink", { cscLink: LINK }],
      ["a sign hook", { signtoolOptions: { sign: async () => {} } }],
      ["none, CSC_LINK set", {}, { CSC_LINK: LINK }],
      ["none, WIN_CSC_LINK set", {}, { WIN_CSC_LINK: LINK }],
      ["none, WIN_CSC_LINK empty over CSC_LINK", {}, { WIN_CSC_LINK: "", CSC_LINK: LINK }],
      ["win.cscLink empty over CSC_LINK", { cscLink: "" }, { CSC_LINK: LINK }],
    ];
    const told = [];
    for (const [name, win, env] of PLANTED) told.push([name, signingConfigured(win, env || {}), (await wouldSign(win, env)).signs]);
    const differ = told.filter(t => t[1] !== t[2]);
    check(!differ.length && told.filter(t => t[2]).length === 8,
      "4d signingConfigured agrees with electron-builder on " + (told.length - differ.length) + " of " + told.length
      + " planted blocks, 8 of which it signs with: " + told.slice(0, 5).map(t => t[0] + " " + t[1]).join(", ")
      + (differ.length ? "; DIFFER on " + differ.map(t => t[0] + " (ours " + t[1] + ", electron-builder " + t[2] + ")").join(", ") : ""));

    /* 4e, the control: the function as it stood before the token routes, judged by the same table,
       differs exactly where the rehearsal found it did among its five. */
    const BEFORE = win => { const w = win || {}, st = w.signtoolOptions || {};
      return !!(st.certificateFile || st.sign || w.azureSignOptions || w.certificateFile || w.sign); };
    const before = told.slice(0, 5).filter((t, i) => BEFORE(PLANTED[i][1]) !== t[2]).map(t => t[0]);
    check(before.join(",") === "sha1,subject",
      "4e control: the function as it stood differs from electron-builder among the five on " + (before.join(", ") || "nothing"));

    /* 4f and 4g, THE SEAL'S OWN TEETH: two planted future signers, each still naming the packager's vm so
       that the source-text check passes, swapped onto the real prototype for one run each. F1 also starts a
       process; F4 also opens an HTTPS connection and swallows the refusal, so it still signs and only the
       count sees it. Counters set up under the seal count what the planted code itself got through, and both
       must read nought. The control is the same wrapper with no escape in it, which records nothing. */
    {
      const proto = EB.WindowsSignAzureManager.prototype, real = proto.signFile;
      const cp = require("node:child_process"), net = require("node:net"), https = require("node:https");
      let flag = false, started = 0, connected = 0;
      const exec = cp.execFileSync, conn = net.Socket.prototype.connect;
      cp.execFileSync = function () { if (flag) started++; return exec.apply(this, arguments); };
      net.Socket.prototype.connect = function () { if (flag) connected++; return conn.apply(this, arguments); };
      const trial = async act => {
        const mark = ESCAPES.length;
        started = 0; connected = 0;
        proto.signFile = async function (...a) { /* this.packager.vm.value */ flag = true; try { act(); } finally { flag = false; } return real.apply(this, a); };
        try { const r = await wouldSign(winWith(AZ)); return { r, seen: ESCAPES.splice(mark), started, connected }; }
        finally { proto.signFile = real; }
      };
      let f1, f4, none;
      try {
        f1 = await trial(() => cp.execFileSync(process.execPath, ["-e", ""]));
        f4 = await trial(() => { try { https.get("https://signer.invalid/", () => {}).on("error", () => {}); } catch (e) { /* swallowed, as a signer might */ } });
        none = await trial(() => {});
      } finally { cp.execFileSync = exec; net.Socket.prototype.connect = conn; }
      check(f1.seen.includes("child_process.execFileSync") && f1.started === 0 && f1.r.signs === false,
        "4f a planted signer that names the vm and also starts a process is caught by the seal: it reached for " + JSON.stringify([...new Set(f1.seen)])
        + ", started " + f1.started + " process(es), and its run failed (signs " + f1.r.signs + ")");
      check(f4.seen.includes("https.get") && f4.connected === 0 && f4.r.signs === true && none.seen.length === 0 && none.r.signs === true,
        "4g a planted signer that names the vm and also opens an HTTPS connection, swallowing the refusal, is caught by the count alone: it reached for "
        + JSON.stringify([...new Set(f4.seen)]) + ", made " + f4.connected + " connection(s) and still signed (" + f4.r.signs + "); CONTROL: the same wrapper with no escape"
        + " records " + none.seen.length + " and signs (" + none.r.signs + ")");
    }
  }

  /* ---- 5. the judgement of a reading --------------------------------------------------------- */
  const r = (status, timestamped) => ({ file: "C:/d/etiuda-studio-9.9.9-setup.exe", status, timestamped });
  const BAD = ["HashMismatch", "NotTrusted", "UnknownError", "NotSigned"];
  const missed = BAD.filter(s => signatureProblems([r(s, true)], true).length !== 1);
  check(signatureProblems([r("Valid", true)], true).length === 0 && !missed.length,
    "5a required: Valid with a timestamp passes and each of " + BAD.join(", ") + " is refused" + (missed.length ? "; passed " + missed.join(", ") : ""));
  const noTs = signatureProblems([r("Valid", false)], true);
  check(noTs.length === 1 && /timestamp/.test(noTs[0]), "5b required: Valid with no timestamp is refused and says why");
  check(signatureProblems([r("Valid", true), r("HashMismatch", true)], true).length === 1,
    "5c every file is judged, not only the first");
  const said = [];
  const nothing = signatureVerdict({ setup: path.join(TMP, "none.exe"), program: path.join(TMP, "none2.exe"),
    customer: false, win: {}, read: () => { throw new Error("read"); }, log: s => said.push(s) });
  check(nothing === true && /not asked/.test(said.join(" ")),
    "5d a preview with no certificate is not asked at all, not even whether the files are there, as before this gate");
  const off = signatureVerdict({ setup: LICENCE, program: LICENCE, customer: true, win: {}, read: () => null, log: () => {} });
  check(typeof off === "string" && /^NOT RUN/.test(off), "5e with no reading, a build that requires a signature stops NOT RUN: " + off);

  /* ---- 6. what Windows says, and the gate's body ------------------------------------------ */
  const SIGNED = path.join(ROOT, "node_modules", "@electron", "windows-sign", "vendor", "signtool.exe");
  const UNSIGNED = path.join(ROOT, "node_modules", "electron", "dist", "electron.exe");
  if (process.platform !== "win32") skip("6a-6g need Windows to answer for a signature", 7);
  else if (!fs.existsSync(SIGNED) || !fs.existsSync(UNSIGNED)) skip("6a-6g need " + SIGNED + " and " + UNSIGNED, 7);
  else {
    const bent = path.join(TMP, "signtool-bent.exe");
    const bytes = fs.readFileSync(SIGNED);
    bytes[bytes.length >> 1] ^= 0xff;
    fs.writeFileSync(bent, bytes);
    const read = readAuthenticode([SIGNED, bent, UNSIGNED]);
    check(read[0].status === "Valid" && read[0].timestamped && read[1].status === "HashMismatch" && read[2].status === "NotSigned",
      "6a Windows reads a signed tool Valid and timestamped, a copy with one byte changed HashMismatch, and Electron's"
      + " own unsigned program NotSigned: " + read.map(x => x.status + (x.timestamped ? "+ts" : "")).join(", "));
    const quiet = [];
    const verdict = (setup, program, customer, win) => signatureVerdict({ setup, program, customer, win: win || {}, log: s => quiet.push(s) });
    const CERT = { signtoolOptions: { certificateFile: "C:/nowhere/etiuda.pfx" } };
    const v1 = verdict(bent, SIGNED, true);
    check(typeof v1 === "string" && /signtool-bent\.exe reads Authenticode HashMismatch/.test(v1),
      "6b a customer build whose installer is mismatched is stopped by name: " + v1);
    const v2 = verdict(SIGNED, bent, true);
    check(typeof v2 === "string" && /signtool-bent\.exe/.test(v2), "6c and one whose PROGRAM is mismatched under a good installer: " + v2);
    const v3 = verdict(UNSIGNED, UNSIGNED, false, CERT);
    check(typeof v3 === "string" && /NotSigned, not Valid/.test(v3), "6d a preview WITH a certificate configured that came out unsigned is stopped: " + v3);
    check(verdict(UNSIGNED, UNSIGNED, false) === true, "6e the same preview with no certificate passes, unasked");
    const vMaker = verdict(SIGNED, SIGNED, true);
    check(vMaker === "the program is signed by Microsoft Corporation, a maker, not by us",
      "6f a customer build whose installer and program read Valid and timestamped, as Windows reads this Microsoft-signed tool, is"
      + " refused as a maker's program, not ours (a pass on our own signature is tests/sign-all.mjs 2c): " + vMaker);
    const v6 = verdict(SIGNED, path.join(TMP, "no-such", "Etiuda Studio.exe"), true);
    check(typeof v6 === "string" && /is not there/.test(v6), "6g a required program that is not there is a stop, not a pass: " + v6);
  }

  /* ---- 8. who the program says made it (board 828, rehearsal line 10) ------------------------- */
  /* electron-builder names the maker from package.json's `author` and, with none, Electron's own
     default stands: Etiuda Studio.exe read CompanyName "GitHub, Inc." and the installer's was empty,
     with the warning "author is missed in the package.json". The value is the desk's, "Maxim Gwiazda",
     until the business form changes (ruling of 2026-09-30 03:01); it is frozen here as a literal, so
     the day it changes this leg is edited by the one who changes it. What is asked is electron-builder's
     OWN reader, the one that raises the warning and feeds the company name, not a pattern over the
     file: 8b is the same reader over the same file with the author taken out, so that 8a cannot pass
     by reading nothing. The packaged exe's CompanyName itself is read from a packaged run. */
  const { readPackageJson } = require("app-builder-lib/out/util/packageMetadata");
  const made = await readPackageJson(path.join(ROOT, "package.json"));
  check(!!made.author && made.author.name === "Maxim Gwiazda",
    "8a electron-builder's own reader finds this tree's package.json author " + JSON.stringify(made.author)
    + ", which its company name is taken from, against \"Maxim Gwiazda\"");
  const noAuthor = path.join(TMP, "no-author");
  fs.mkdirSync(noAuthor, { recursive: true });
  const withoutAuthor = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  delete withoutAuthor.author;
  fs.writeFileSync(path.join(noAuthor, "package.json"), JSON.stringify(withoutAuthor));
  const unmade = await readPackageJson(path.join(noAuthor, "package.json"));
  check(unmade.author == null && unmade.name === made.name,
    "8b the same reader over the same file with the author taken out finds none (" + JSON.stringify(unmade.author)
    + "), which is the case electron-builder warns of and Electron's default fills");

  /* ---- 9. A BUILD THE HARNESS MAKES SIGNS NOTHING (board 827, item A) ----------------------------
     electron-builder signs a --dir build too, and a token route asks for a PIN in a window nobody
     sees where Artifact Signing installs a module and signs in. The two builds the gates make when
     given no installer (tests/installer.mjs, tests/update-install.mjs) run tools/package.mjs with
     withoutSigning() from tools/sellable.mjs, its OWN copy of the helper because the pinned engine's
     harness predates it. Each site's own text is cut out of its file and run against a stand-in
     tools/package.mjs that records which of the twelve variables it was handed, with all twelve set
     in this process; 9d is the control with the whole environment. The pinned harness is not
     consulted: nothing here reaches it. */
  {
    const cp = require("node:child_process");
    /* THE TWELVE NAMES, WRITTEN OUT HERE ON PURPOSE and not read from the list under test: the legs below
       plant these, and the stand-in records against these, so a name the exported list loses is still
       looked for. 9a compares the two. */
    const VARS = ["ETIUDA_CERT", "ETIUDA_CERT_SHA1", "ETIUDA_CERT_SUBJECT", "ETIUDA_SIGNING_ENDPOINT", "ETIUDA_SIGNING_ACCOUNT",
      "ETIUDA_SIGNING_PROFILE", "ETIUDA_SIGNING_PUBLISHER", "CSC_LINK", "WIN_CSC_LINK", "CSC_KEY_PASSWORD", "WIN_CSC_KEY_PASSWORD", "ETIUDA_SIGN"];
    const exported = SIGNING_VARS.concat(KEY_PASSWORD_VARS);
    const was = {};
    for (const k of VARS) { was[k] = process.env[k]; process.env[k] = "planted-" + k; }
    const wasSetup = process.env.ETIUDA_STUDIO_SETUP_EXE;
    delete process.env.ETIUDA_STUDIO_SETUP_EXE;
    try {
      const env = withoutSigning(process.env);
      check(VARS.every(k => !(k in env)) && VARS.every(k => process.env[k] === "planted-" + k)
            && (env.PATH || env.Path) === (process.env.PATH || process.env.Path)
            && exported.slice().sort().join() === VARS.slice().sort().join(),
        "9a the exported list is exactly the twelve names written out above (" + (exported.filter(k => VARS.indexOf(k) < 0).map(k => "extra " + k)
        .concat(VARS.filter(k => exported.indexOf(k) < 0).map(k => "missing " + k)).join(", ") || "no difference") + "), and withoutSigning() drops all "
        + VARS.length + " of them from an environment that holds them, keeps the rest (PATH) and leaves process.env itself alone: "
        + VARS.filter(k => k in env).length + " left");
      const upper = withoutSigning({ csc_link: "x", Path: "p", KEEP_ME: "y" });
      check(upper.KEEP_ME === "y" && ("csc_link" in upper) === (process.platform !== "win32"),
        "9b CONTROL: the rest is kept, and on Windows a name in other case (csc_link) is dropped as the child would read it, elsewhere it is"
        + " another variable and stays: " + JSON.stringify(Object.keys(upper)));

      const lab = path.join(TMP, "unsigned-lab"), rec = path.join(lab, "recorded.json");
      fs.mkdirSync(path.join(lab, "tools"), { recursive: true });
      fs.writeFileSync(path.join(lab, "tools", "package.mjs"), [
        'import fs from "node:fs";', "const names = " + JSON.stringify(VARS) + ".map(n => n.toUpperCase());",
        "fs.writeFileSync(" + JSON.stringify(rec) + ", JSON.stringify(Object.keys(process.env).filter(k => names.indexOf(k.toUpperCase()) > -1)));", ""].join("\n"));
      const inLab = (cmd, args, opts) => cp.spawnSync(cmd, args, Object.assign({}, opts, { cwd: lab }));
      const text = f => fs.readFileSync(path.join(ROOT, "tests", f), "utf8");
      const cut = (f, from, to) => { const t = text(f), a = t.indexOf(from), b = t.indexOf(to, a); return a < 0 || b < 0 ? "" : t.slice(a, b); };
      const fnAt = (f, head) => { const t = text(f), a = t.indexOf(head); return a < 0 ? "" : t.slice(a, t.indexOf("\n}\n", a) + 3); };
      const SITES = [
        ["installer.mjs", () => cut("installer.mjs", 'let setup = process.env.ETIUDA_STUDIO_SETUP_EXE || "";', "check(!!setup && fs.existsSync(setup), \"0a"),
         t => new Function("process", "spawnSync", "ROOT", "note", "withoutSigning", t + "\nreturn setup;")(process, inLab, ROOT, () => {}, withoutSigning)],
        ["update-install.mjs", () => fnAt("update-install.mjs", "function newSetup() {"),
         t => new Function("process", "spawnSync", "ROOT", "DRY", "withoutSigning", t + "\nreturn newSetup();")(process, inLab, ROOT, false, withoutSigning)],
      ];
      const reach = (site, swap) => { fs.rmSync(rec, { force: true });
        let t = site[1]();
        if (!t) return "not found";
        if (swap) t = t.split("withoutSigning()").join("process.env");
        try { site[2](t); } catch (e) { /* the stand-in builds no installer */ }
        return fs.existsSync(rec) ? JSON.parse(fs.readFileSync(rec, "utf8")) : null; };
      const got = SITES.map(s => [s[0], reach(s, false)]);
      check(got.every(g => Array.isArray(g[1]) && g[1].length === 0),
        "9c each of the two builds, cut out of its file and run with all " + VARS.length + " signing variables set, reaches tools/package.mjs and"
        + " hands it none of them: " + got.map(g => g[0] + " " + (Array.isArray(g[1]) ? g[1].length + " of " + VARS.length : g[1] === null ? "never reached it" : g[1])).join(", "));
      const old = SITES.map(s => [s[0], reach(s, true)]);
      check(old.every(g => Array.isArray(g[1]) && g[1].length === VARS.length),
        "9d CONTROL: the same two with the whole environment handed over, which is what they did, record all " + VARS.length + " each, so the stand-in"
        + " is looking and 9c is the helper's doing: " + old.map(g => g[0] + " " + (Array.isArray(g[1]) ? g[1].length : g[1])).join(", "));
      const given = path.join(lab, "given-setup.exe");
      fs.writeFileSync(given, "x");
      process.env.ETIUDA_STUDIO_SETUP_EXE = given;
      const none = SITES.map(s => [s[0], reach(s, false)]);
      delete process.env.ETIUDA_STUDIO_SETUP_EXE;
      check(none.every(g => g[1] === null),
        "9e and a launch handed ETIUDA_STUDIO_SETUP_EXE builds nothing, so it reaches no package.mjs at all: "
        + none.map(g => g[0] + " " + (g[1] === null ? "built nothing" : JSON.stringify(g[1]))).join(", "));

      /* One list, and the release and the package tool keep their own environment (text of both). */
      const listed = ["tests", "tools"].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => /\.m?js$/.test(f)).map(f => d + "/" + f))
        .filter(f => /["']ETIUDA_SIGNING_PROFILE["'],\s*["']ETIUDA_SIGNING_PUBLISHER["']/.test(fs.readFileSync(path.join(ROOT, f), "utf8")));
      const kept = ["release.mjs", "package.mjs"].map(f => fs.readFileSync(path.join(ROOT, "tools", f), "utf8"));
      check(listed.join() === "tests/sellable.mjs,tools/sellable.mjs" && kept.every(t => !/withoutSigning/.test(t)),
        "9f the list of signing variables is written in " + JSON.stringify(listed) + " over tests/ and tools/, which is the exported one and 9's own fixed"
        + " oracle and no third, and tools/release.mjs and"
        + " tools/package.mjs do not scrub their own environment, which must keep the route (read from the text of all three)");
    } finally {
      for (const k of VARS) { if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k]; }
      if (wasSetup === undefined) delete process.env.ETIUDA_STUDIO_SETUP_EXE; else process.env.ETIUDA_STUDIO_SETUP_EXE = wasSetup;
    }
  }

  /* ---- 10. the eSigner route (tools/esigner.cjs) ---------------------------------------------------------------------- */
  /* Its effects are replaced for every leg here (ES.io), so nothing is started, read from the keyring or reached. */
  const ES = require(path.join(ROOT, 'tools', 'esigner.cjs'));
  /* A planted fault is not run under ETIUDA_PLANTS=off (a merge's area run): it is skipped by name and counted. */
  const PLANTS_OFF = process.env.ETIUDA_PLANTS === 'off';
  const IO = { ...ES.io };
  const U16 = s => Buffer.from(s, 'utf16le').toString('base64');
  /* Planted values, the password holding what an argument file must escape: a hash, a quote and a backslash. */
  const VAL = { username: 'planted-user', password: 'pl#nted"pa\\ss', 'credential-id': 'planted-credential', 'totp-secret': 'plantedTotpSecret+/=' };
  const THUMB10 = 'AB'.repeat(20), WHO10 = 'CN=Example Publisher';
  const calls10 = [], logs10 = [];
  let readBack = null;
  const TEMP10 = path.join(TMP, 'es-temp');
  fs.mkdirSync(TEMP10, { recursive: true });
  const fakeIo = {
    /* python-keyring's layout after storing the four in order: the last under the service, the rest under name@service. */
    readCredentials: targets => targets.map(t => t === ES.KEYRING_SERVICE ? ['totp-secret', U16(VAL['totp-secret'])]
      : /^(username|password|credential-id)@/.test(t) ? [t.split('@')[0], U16(VAL[t.split('@')[0]])] : null),
    run: (file, args, opts) => {
      const at = args.find(a => a[0] === '@'), arg = k => (args.find(a => a.startsWith(k + '=')) || '').slice(k.length + 1);
      calls10.push({ file, args, env: opts.env, argText: at && fs.existsSync(at.slice(1)) ? fs.readFileSync(at.slice(1), 'utf8') : null, argFile: at && at.slice(1) });
      if (args.includes('sign') && !process.env.ES_PLANT_NO_OUTPUT)
        fs.writeFileSync(path.join(arg('-output_dir_path'), path.basename(arg('-input_file_path'))), 'signed by the planted tool');
      return { status: 0, stdout: 'Code signed successfully', stderr: '' };
    },
    leaf: () => ({ thumbprint: THUMB10, subject: WHO10 }),
    readSignature: () => readBack || { status: 'Valid', timestamped: true, thumbprint: THUMB10, subject: WHO10 },
    /* A temporary folder of the legs' own, so the session's sweep (10j) never reaches the desk's real one. */
    tmp: () => TEMP10,
    now: (() => { let n = 0; return () => (n += 1000); })(),
    log: line => logs10.push(line),
  };
  Object.assign(ES.io, fakeIo);
  /* A planted CodeSignTool folder, pinned for these legs by its own files' hashes; 10f puts the real pins back on a copy. */
  const TOOL_ROOT = path.join(TMP, 'es-root', 'tree'), TOOL_AT = path.join(TMP, 'es-root', 'tools-external', ES.TOOL.folder);
  const realPins = { ...ES.TOOL.sha256 };
  for (const rel of [ES.TOOL.jar, ES.TOOL.java, 'conf/code_sign_tool.properties']) {
    fs.mkdirSync(path.dirname(path.join(TOOL_AT, rel)), { recursive: true });
    fs.writeFileSync(path.join(TOOL_AT, rel), 'planted ' + rel + '\n');
  }
  fs.mkdirSync(TOOL_ROOT, { recursive: true });
  for (const rel of Object.keys(ES.TOOL.sha256))
    ES.TOOL.sha256[rel] = require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(TOOL_AT, rel))).digest('hex');
  const OUT10 = path.join(TMP, 'es-dist');
  const target = name => { const f = path.join(TMP, name); fs.writeFileSync(f, 'unsigned ' + name); return f; };
  const hookFor = kind => ES.esignerSigning({ ETIUDA_SIGN: kind }, TOOL_ROOT, OUT10).signtoolOptions.sign;
  const thrown = async run => { try { await run(); return ''; } catch (e) { return String(e.message); } };
  try {
    /* 10a: unset, electron-builder.js takes no block from the route; set, the block is the hook alone, sha256 once a file. */
    const unset10 = winWith(null), set10 = winWith({ ETIUDA_SIGN: 'esigner' }), st10 = set10.signtoolOptions || {};
    check(routeOf(unset10) === '{}' && typeof st10.sign === 'function' && JSON.stringify(st10.signingHashAlgorithms) === '["sha256"]'
      && Object.keys(st10).length === 2 && !set10.azureSignOptions && signingConfigured(set10, {}) && !signingConfigured(unset10, {}),
      '10a with ETIUDA_SIGN unset the real builder takes no block from the route and signs nothing; set to esigner its block is the hook'
      + ' alone, sha256 once a file');
    /* 10a's teeth, a planted fault and so not run under ETIUDA_PLANTS=off: plant:esigner-default lifted on the same module hands
       the unset build a block. */
    if (PLANTS_OFF) skip('10a-plant, plant:esigner-default lifted (ETIUDA_PLANTS=off)', 1);
    else {
      const esText = fs.readFileSync(path.join(ROOT, 'tools', 'esigner.cjs'), 'utf8');
      const esLift = esText.split('\n').map(l => /plant:esigner-default/.test(l) ? '  if (!kind) return { signtoolOptions: { signingHashAlgorithms: ["sha256"] } }; /* plant:esigner-default */' : l).join('\n');
      const esWas = ES.esignerSigning;
      const planted10 = new Function('require', '__dirname', 'module', esLift + '\nreturn module.exports;')(require, path.join(ROOT, 'tools'), { exports: {} });
      ES.esignerSigning = planted10.esignerSigning;
      let unsetPlanted;
      try { unsetPlanted = winWith(null); } finally { ES.esignerSigning = esWas; }
      check(esLift !== esText && routeOf(unsetPlanted) !== '{}',
        '10a-plant with plant:esigner-default lifted the unset build would carry a block (' + routeOf(unsetPlanted) + '), so 10a has teeth');
    }

    /* 10b: two routes at once, or a value the route does not know, refuse by name. */
    const refusal10 = vars => { try { winWith(vars); return ''; } catch (e) { return String(e.message); } };
    const e1 = refusal10({ ETIUDA_SIGN: 'esigner', ETIUDA_CERT: PFX }), e2 = refusal10({ ETIUDA_SIGN: 'esigner-demo', ...AZ });
    const e3 = refusal10({ ETIUDA_SIGN: 'esigner-live' });
    check(/ETIUDA_CERT and ETIUDA_SIGN are set/.test(e1) && /ETIUDA_SIGNING_\* and ETIUDA_SIGN are set/.test(e2) && /takes esigner or esigner-demo$/.test(e3),
      '10b ETIUDA_SIGN beside another route refuses naming both, and a value it does not know names the two it takes: ' + JSON.stringify([e1, e2, e3]));

    /* 10c: electron-builder's own signing path, sealed, hands the hook each file once; the file then holds what the tool wrote,
       read back where it stands; the session asked for the account's certificate once. */
    if (!EB) skip('10c needs app-builder-lib in node_modules to ask electron-builder itself', 1);
    else {
      const mark = ESCAPES.length, signsAt = calls10.length;
      const block = { signtoolOptions: { sign: hookFor('esigner'), signingHashAlgorithms: ['sha256'] } };
      const eb10 = await wouldSign(block);
      const setupAt = path.join(TMP, 'etiuda-studio-setup.exe');
      const made = calls10.slice(signsAt);
      check(eb10.signs === true && ESCAPES.length === mark && made.map(c => c.args[3]).join() === 'get_certs,sign'
        && made[1].args.includes('-input_file_path=' + setupAt) && logs10.length === 1 && /signing 1 of this build/.test(logs10[0]),
        '10c electron-builder\'s signing path, sealed, hands the hook the file once (sha256 alone), which asks CodeSignTool for the'
        + ' account\'s certificate once and signs once, nothing escaping the seal: ' + made.map(c => c.args[3]).join(', ') + (eb10.why ? ' (' + eb10.why + ')' : ''));
    }

    /* 10d: the four values never on a command line or in an environment; each call's argument file held them, escaped for
       picocli, and was gone once the call returned. */
    const before10 = calls10.length;
    const f10 = target('probe-d.exe');
    await hookFor('esigner')({ path: f10 });
    const d10 = calls10.slice(before10), secrets = Object.values(VAL);
    const onLine = d10.some(c => c.args.some(a => secrets.some(s => a.includes(s))));
    const inEnv = d10.some(c => Object.values(c.env || {}).some(v => secrets.some(s => String(v).includes(s))));
    const escaped = d10.every(c => c.argText && c.argText.includes('-password\n"pl#nted\\"pa\\\\ss"\n') && c.argText.includes('-username\n"planted-user"\n'))
      && d10[1].argText.includes('-totp_secret\n"plantedTotpSecret+/="\n') && !d10[0].argText.includes('-totp_secret');
    check(!onLine && !inEnv && escaped && d10.every(c => !fs.existsSync(c.argFile)) && fs.readFileSync(f10, 'utf8') === 'signed by the planted tool',
      '10d no value is on a command line (' + onLine + ') or in an environment (' + inEnv + '); each call\'s argument file held them quoted,'
      + ' the hash, quote and backslash escaped (' + escaped + '), the TOTP secret only for sign, and every file was gone after its call');

    /* 10e: the exit code is not the answer. A file read back unsigned, untimestamped, by another certificate, or (for the live
       account) chained to no trusted root stops the build; the demo account's untrusted chain is its expected reading. */
    const refusals = [];
    for (const [name, reading, kind] of [['NotSigned', { status: 'NotSigned', timestamped: false, thumbprint: '', subject: '' }, 'esigner'],
      ['no timestamp', { status: 'Valid', timestamped: false, thumbprint: THUMB10, subject: WHO10 }, 'esigner'],
      ['another certificate', { status: 'Valid', timestamped: true, thumbprint: 'CD'.repeat(20), subject: WHO10 }, 'esigner'],
      ['UnknownError, live', { status: 'UnknownError', timestamped: true, thumbprint: THUMB10, subject: WHO10 }, 'esigner']]) {
      readBack = reading;
      refusals.push([name, await thrown(() => hookFor(kind)({ path: target('probe-e.exe') }))]);
    }
    readBack = null;
    process.env.ES_PLANT_NO_OUTPUT = '1';
    refusals.push(['exit 0, no file', await thrown(() => hookFor('esigner')({ path: target('probe-e.exe') }))]);
    delete process.env.ES_PLANT_NO_OUTPUT;
    const demoLeaf = ES.io.leaf;
    ES.io.leaf = () => ({ thumbprint: THUMB10, subject: 'C=US\nOU=Cloud Signing Demo\nO=Esigner LLC' });
    readBack = { status: 'UnknownError', timestamped: true, thumbprint: THUMB10, subject: 'OU=Cloud Signing Demo, O=Esigner LLC' };
    const demoOk = await thrown(() => hookFor('esigner-demo')({ path: target('probe-e.exe') }));
    const demoAsLive = await thrown(() => hookFor('esigner')({ path: target('probe-e.exe') }));
    ES.io.leaf = demoLeaf;
    readBack = null;
    const liveAsDemo = await thrown(() => hookFor('esigner-demo')({ path: target('probe-e.exe') }));
    check(refusals.every(r => /^signing: /.test(r[1])) && /reads Authenticode NotSigned/.test(refusals[0][1]) && /has no timestamp/.test(refusals[1][1])
      && /is signed by CDCD/.test(refusals[2][1]) && /reads Authenticode UnknownError/.test(refusals[3][1]) && /wrote no/.test(refusals[4][1])
      && demoOk === '' && /certificate is the demo one/.test(demoAsLive) && /certificate is not the demo one/.test(liveAsDemo),
      '10e with the tool saying success every time, the build stops on ' + refusals.map(r => r[0] + (r[1] ? '' : ' (PASSED)')).join(', ')
      + '; the demo account\'s untrusted chain passes as demo, and the demo certificate under esigner, or another under esigner-demo, stops the session');

    /* 10f: the keyring read by python-keyring's rule (10d read all four), a missing name named and no value printed; and the tool
       found only where its pinned files match, so a changed byte under the real pins is refused. */
    const realRead = ES.io.readCredentials;
    ES.io.readCredentials = targets => targets.map(t => /^password@/.test(t) ? null : fakeIo.readCredentials([t])[0]);
    const short = await thrown(() => ES.fromKeyring());
    ES.io.readCredentials = realRead;
    const got = ES.fromKeyring();
    Object.assign(ES.TOOL.sha256, realPins);
    const pin = await thrown(() => ES.findTool(TOOL_ROOT));
    check(JSON.stringify(got) === JSON.stringify(VAL) && /holds no password;/.test(short) && !secrets.some(s => short.includes(s))
      && /is not the pinned CodeSignTool file/.test(pin),
      '10f the keyring\'s four come back by python-keyring\'s rule, one missing is named with no value shown (' + short + '), and a tool folder'
      + ' whose files are not the pinned ones is refused (' + pin.split(' (')[0] + ')');

    /* 10g: a demo-signed build is never released: the variable, and a file carrying the demo certificate's subject even where
       Windows read it Valid; plant:sell-demo-var and plant:sell-demo-subject lifted each let it through. */
    const SELL10 = await import(pathToFileURL(path.join(ROOT, 'tools', 'sellable.mjs')).href);
    const demoRead = [{ file: 'C:/x/etiuda-setup.exe', status: 'Valid', timestamped: true, subject: 'CN=Esigner LLC, OU=Cloud Signing Demo, O=Esigner LLC' }];
    const fineRead = [{ file: 'C:/x/etiuda-setup.exe', status: 'Valid', timestamped: true, subject: WHO10 }];
    const asks = typeof SELL10.demoSigningProblems === 'function';
    const v10 = signatureVerdict({ setup: LICENCE, program: LICENCE, customer: false, win: { signtoolOptions: { sign: () => {} } }, read: () => demoRead, log: () => {} });
    const v10ok = signatureVerdict({ setup: LICENCE, program: LICENCE, customer: true, win: {}, read: files => files.map(f => ({ ...fineRead[0], file: f })), log: () => {} });
    check(asks && SELL10.demoSigningProblems({ env: { ETIUDA_SIGN: 'esigner-demo' } }).length === 1 && SELL10.demoSigningProblems({ env: { ETIUDA_SIGN: 'esigner' } }).length === 0
      && typeof v10 === 'string' && /etiuda-setup\.exe is signed by SSL\.com's demo certificate/.test(v10) && v10ok === true,
      '10g a demo-signed build is refused by the variable and, read Valid or not, by the demo certificate\'s subject (' + v10 + '), and a real'
      + ' subject passes');
    /* 10g's teeth, planted faults and so not run under ETIUDA_PLANTS=off. */
    if (PLANTS_OFF) skip('10g-plant, plant:sell-demo-var and plant:sell-demo-subject lifted (ETIUDA_PLANTS=off)', 1);
    else {
      const sellText = fs.readFileSync(path.join(ROOT, 'tools', 'sellable.mjs'), 'utf8');
      const lift10 = (marker, line) => {
        const t = sellText.split('\n').map(l => l.includes('plant:' + marker) ? line + ' /* plant:' + marker + ' */' : l).join('\n');
        const at = path.join(TMP, 'sellable-' + marker + '.mjs');
        fs.writeFileSync(at, t);
        return t === sellText ? null : at;
      };
      for (const f of ['esigner.cjs', 'test-service.cjs']) fs.copyFileSync(path.join(ROOT, 'tools', f), path.join(TMP, f));
      const varAt10 = lift10('sell-demo-var', '  void 0;'), subjAt10 = lift10('sell-demo-subject', '  void 0;');
      const pv = varAt10 && await import(pathToFileURL(varAt10).href), ps = subjAt10 && await import(pathToFileURL(subjAt10).href);
      check(pv && pv.demoSigningProblems({ env: { ETIUDA_SIGN: 'esigner-demo' } }).length === 0 && ps && ps.demoSigningProblems({ readings: demoRead }).length === 0,
        '10g-plant with plant:sell-demo-var and plant:sell-demo-subject lifted each let a demo-signed build through, so 10g has teeth');
    }
    /* 10h, structure: the release refuses the variable as gate sellable, beside the test service build (tests/release.mjs drives
       that gate in a lab for the test service variable). */
    const relText = fs.readFileSync(path.join(ROOT, 'tools', 'release.mjs'), 'utf8');
    check(relText.includes('const DEMO_SIGNED_SAID = demoSigningProblems({ env: process.env }); /* plant:release-demo-var */')
      && relText.includes('.concat(TEST_SERVICE_SAID, DEMO_SIGNED_SAID)'),
      '10h tools/release.mjs asks demoSigningProblems of its own environment and judges it in gate sellable beside the test service build');
    /* 10j: a packaging command killed mid-call leaves its argument folder behind; the next session removes this tool's own
       stale folders by their exact prefix, and nothing else in the temporary folder, which here is a planted one. */
    const TMP_ROOT = path.join(TMP, 'es-tmp'), hourAgo = new Date(Date.now() - 3600000);
    fs.mkdirSync(TMP_ROOT, { recursive: true });
    const plant = (name, dir, old) => {
      const at = path.join(TMP_ROOT, name);
      if (dir) { fs.mkdirSync(at, { recursive: true }); fs.writeFileSync(path.join(at, 'args'), '-password\n"planted"\n'); }
      else fs.writeFileSync(at, 'x');
      if (old) fs.utimesSync(at, hourAgo, hourAgo);
      return at;
    };
    const stale = plant('etiuda-esigner-stale1', true, true);
    const keep = [plant('etiuda-esigner-fresh1', true, false), plant('etiuda-esigner-file', false, true),
      plant('etiuda-esignerx-stale', true, true), plant('etiuda-sellable-stale', true, true), plant('xetiuda-esigner-stale', true, true)];
    for (const rel of Object.keys(ES.TOOL.sha256))   /* 10f put the real pins back */
      ES.TOOL.sha256[rel] = require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(TOOL_AT, rel))).digest('hex');
    const tmpWas = ES.io.tmp;
    ES.io.tmp = () => TMP_ROOT;
    try { await hookFor('esigner')({ path: target('probe-j.exe') }); } finally { ES.io.tmp = tmpWas; }
    const left = fs.readdirSync(TMP_ROOT).sort();
    check(!fs.existsSync(stale) && keep.every(k => fs.existsSync(k)) && left.length === keep.length,
      '10j a stale etiuda-esigner- folder holding an argument file is gone once the next session starts, while a fresh folder of'
      + ' that prefix, a stale file of it, stale folders of other names and the session\'s own spent folders are as they should be: '
      + JSON.stringify(left));

    /* 10k: each build's eSigner record begins empty. One an earlier build left in the same output folder, under another
       certificate, is set aside beside it when the next session opens, so the release's ourPublisher reads this build's alone. */
    const oldRecord = JSON.stringify({ file: 'Etiuda.exe', ms: 1, status: 'Valid', thumbprint: 'CD'.repeat(20) }) + '\n';
    const recordIn = out => { fs.mkdirSync(path.join(out, '.esigner'), { recursive: true }); fs.writeFileSync(path.join(out, '.esigner', 'signings.jsonl'), oldRecord); return out; };
    const OUTK = recordIn(path.join(TMP, 'es-dist-k'));
    await ES.esignerSigning({ ETIUDA_SIGN: 'esigner' }, TOOL_ROOT, OUTK).signtoolOptions.sign({ path: target('probe-k.exe') });
    const setAside = fs.readdirSync(path.join(OUTK, '.esigner')).filter(f => /^signings-.+\.jsonl$/.test(f));
    const namedK = SELL10.ourPublisher({ signtoolOptions: { sign: () => {} } }, OUTK);
    check(!!namedK && JSON.stringify(namedK.thumbprints) === JSON.stringify([THUMB10]) && setAside.length === 1
      && fs.readFileSync(path.join(OUTK, '.esigner', setAside[0]), 'utf8') === oldRecord,
      '10k a new build\'s eSigner record begins empty: the earlier build\'s, under another certificate, is set aside beside it as '
      + setAside.join(', ') + ', and the release accepts only ' + (namedK ? namedK.thumbprints.join(', ') : 'nothing'));
    /* 10l, the plant, so not run under ETIUDA_PLANTS=off: the hook's copy with plant:esigner-fresh-record lifted keeps the earlier
       record, and its certificate passes. */
    if (PLANTS_OFF) skip('10l, plant:esigner-fresh-record lifted (ETIUDA_PLANTS=off)', 1);
    else {
      const esTextK = fs.readFileSync(path.join(ROOT, 'tools', 'esigner.cjs'), 'utf8');
      const esLiftK = esTextK.split('\n').map(l => l.includes('plant:esigner-fresh-record') ? '  void record; /* plant:esigner-fresh-record */' : l).join('\n');
      const ESK = new Function('require', '__dirname', 'module', esLiftK + '\nreturn module.exports;')(require, path.join(ROOT, 'tools'), { exports: {} });
      Object.assign(ESK.io, fakeIo);
      Object.assign(ESK.TOOL.sha256, ES.TOOL.sha256);
      const OUTL = recordIn(path.join(TMP, 'es-dist-l'));
      await ESK.esignerSigning({ ETIUDA_SIGN: 'esigner' }, TOOL_ROOT, OUTL).signtoolOptions.sign({ path: target('probe-l.exe') });
      const namedL = SELL10.ourPublisher({ signtoolOptions: { sign: () => {} } }, OUTL);
      check(esLiftK !== esTextK && !!namedL && namedL.thumbprints.includes('CD'.repeat(20)),
        '10l with plant:esigner-fresh-record lifted on a copy of the hook, the earlier build\'s certificate is accepted beside this one: '
        + (namedL ? namedL.thumbprints.join(', ') : 'nothing'));
    }
  } finally {
    Object.assign(ES.io, IO);
    Object.assign(ES.TOOL.sha256, realPins);
  }

  /* This tree as it stands, through the function the release calls, printed rather than asserted
     so that nothing here reddens the day the key, the seller or the certificate arrives. */
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const tree = await beforeBuild({ version: pkg.version, customer: false, licenceDir: path.join(ROOT, "packaging"),
    licenceModule: LICENCE, win: winWith(Object.fromEntries(SIGNING_VARS.filter(k => process.env[k] != null).map(k => [k, process.env[k]]))) });
  process.stdout.write("  info this tree (" + pkg.version + ") is " + (tree.customer ? "a CUSTOMER build" : "a preview")
    + ", and as a customer build it would stop on " + tree.problems.length + ": " + tree.problems.join("; ") + "\n");
} catch (e) {
  failed++;
  process.stderr.write("  FAIL " + String(e && e.stack || e).split("\n").slice(0, 3).join(" | ") + "\n");
} finally {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* reported below */ }
  check(!fs.existsSync(TMP), "7a the temp folder is gone");
}

check(asserted + 1 + notRun >= EXPECTED, "7b every leg ran or was counted NOT RUN: " + (asserted + 1) + " ran, "
  + notRun + " not run, of " + EXPECTED);
process.stdout.write("#counts sellableChecks=" + asserted + " sellableFailures=" + failed + " sellableNotRun=" + notRun + "\n");
process.stdout.write("sellable: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
