/* THE TEST SERVICE BUILD (tools/test-service.cjs): with ETIUDA_PACK_TEST_SERVICE naming a sign-in lab file, the package signs in
 * against that service, draws its band on every pane and dialog and carries "Test Service" in its names, version and app id unchanged;
 * without it, the ordinary build. Bare node: nothing packaged, no window, no secret read (a secret-shaped value is built from pieces).
 * Every guard line carries a plant tag, shown red put in another form in a temp copy; tests/release.mjs 14a-14d drives the release.
 * ts9: Studio's relay under the switch (Max, 2026-11-13 10:26: "yes, of course Studio may reach the test relay in tests builds"): a
 * team made or moved to the relay in a test service build is made on staging's relay, and every record of a team already held keeps
 * its own; tests/no-model.mjs 11be to 11bg hold what the wire reaches, and tests/relay-studio.mjs rts1 an ordinary build holding a
 * staging team.
 *     node tests/test-service.mjs        exit code 1 on any failed check */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const TS = require(path.join(ROOT, "tools", "test-service.cjs"));
const LAB = require(path.join(ROOT, "src", "signin-lab.cjs"));
const SHELL = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
const APP = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
const INDEX = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
const LANG = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
const PACKAGE = fs.readFileSync(path.join(ROOT, "tools", "package.mjs"), "utf8");
const LABSRC = fs.readFileSync(path.join(ROOT, "src", "signin-lab.cjs"), "utf8");
const EXPECTED = 28;

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
/* A plant's proof, `proof` an async function so nothing is planted under ETIUDA_PLANTS=off, where it is counted as skipped. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
async function plantCheck(proof, line) {
  if (PLANTS_OFF) { skipped++; process.stdout.write("  skip " + line.split(" ")[0] + " (ETIUDA_PLANTS=off)\n"); return; }
  let ok = false;
  try { ok = !!(await proof()); } catch (e) { line += " (" + e.message + ")"; }
  check(ok, line);
}
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-test-service-"));
const SECRET = ["GOCSPX", "standin", "0123456789abcdef"].join("-");
const LAB_SECRET = ["lab", "secret", "1"].join("-");
const STAGING = "https://etiuda.dev/licence-staging/v1/";
const FILE = { service: STAGING, clientIds: { microsoft: "11111111-2222-3333-4444-555555555555", google: "1234567890-abcdefghij.apps.googleusercontent.com" },
  root: "ab".repeat(32) };
const write = (name, text) => { const f = path.join(TMP, name); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); return f; };
const lift = (src, tag, to) => src.split("\n").map(l => l.indexOf("plant:" + tag + " ") >= 0 || l.indexOf("plant:" + tag + "*") >= 0 ? to : l).join("\n");

try {
  /* ---- ts1, the pack's reader is the packaged Studio's own, and only its fields are packed ----------------------------- */
  const labText = JSON.stringify(Object.assign({ note: "kept out", order: "https://etiuda.dev" }, FILE));
  const fields = TS.testServiceFields(labText, LAB.labOf, SECRET);
  check(Object.keys(fields).sort().join() === "clientIds,root,service" && JSON.stringify(LAB.labOf(JSON.stringify(fields))) === JSON.stringify(Object.assign({}, LAB.labOf(labText), { order: null })),
    "ts1a the fields packed are the lab file's Studio reads, its order page aside (a build carries none, board 1020), and nothing else, read as the file is read: " + Object.keys(fields).join(","));
  const refused = ["{", "[]", JSON.stringify({ clientIds: FILE.clientIds }), JSON.stringify(Object.assign({}, FILE, { service: "https://example.com/licence/v1/" })),
    JSON.stringify(Object.assign({}, FILE, { clientIds: { apple: "x" } }))]
    .map(t => { try { TS.testServiceFields(t, LAB.labOf, SECRET); return "taken"; } catch (e) { return /refuses/.test(e.message) ? "refused" : e.message; } });
  check(refused.every(r => r === "refused"), "ts1b a lab file Studio's reader refuses stops the pack, five shapes: " + refused.join(","));
  const withSecret = JSON.stringify(Object.assign({}, FILE, { provider: { id: "lab", clientId: "lab-client-1", clientSecret: LAB_SECRET,
    issuer: "http://127.0.0.1:4567", authorize: "http://127.0.0.1:4567/authorize", token: "http://127.0.0.1:4567/token", scope: "openid" } }));
  const holdsGoogle = JSON.stringify(Object.assign({}, FILE, { clientIds: { google: SECRET } }));
  const said = t => { try { TS.testServiceFields(t, LAB.labOf, SECRET); return "taken"; } catch (e) { return e.message; } };
  const s1 = said(withSecret), s2 = said(holdsGoogle);
  check(/client secret/.test(s1) && /Google's client secret/.test(s2) && [s1, s2].every(m => m.indexOf(LAB_SECRET) < 0 && m.indexOf(SECRET) < 0),
    "ts1c a provider's client secret, or Google's secret anywhere in what would be packed, stops the pack, naming no value");
  const tsSrc = fs.readFileSync(path.join(ROOT, "tools", "test-service.cjs"), "utf8");
  await plantCheck(() => {
    const plantedSecret = lift(tsSrc, "ts-secret", "  void 0; /* plant:ts-secret */");
    const P = require(write("p1/tools/test-service.cjs", plantedSecret));
    let took = false;
    try { P.testServiceFields(holdsGoogle, LAB.labOf, SECRET); took = true; } catch { took = false; }
    return plantedSecret !== tsSrc && took;
  }, "ts1d with plant:ts-secret put in another form, a file holding Google's secret is packed, so ts1c has teeth");

  /* ---- ts2, the config: unset, the same object; set, the names and the fields in extraMetadata ------------------------- */
  const cfgOf = env => {
    const r = spawnSync(process.execPath, ["-e", "process.stdout.write(JSON.stringify(require(process.argv[1])))", path.join(ROOT, "electron-builder.js")],
      { cwd: ROOT, env: Object.assign({}, process.env, { ETIUDA_PACK_TEST_SERVICE: "", ETIUDA_GOOGLE_CLIENT_SECRET: "", ETIUDA_STUDIO_DIST: TMP }, env), encoding: "utf8" });
    try { return JSON.parse(r.stdout); } catch { return { error: String(r.stderr).slice(0, 300) }; }
  };
  const plain = cfgOf({}), tested = cfgOf({ ETIUDA_PACK_TEST_SERVICE: write("lab.json", labText) });
  const base = { productName: "Etiuda Studio" };
  const loose = c => [].concat((c.win || {}).extraResources || [], (c.linux || {}).extraResources || []).some(r => /test-service/.test(String(r.to)));
  check(plain.productName === "Etiuda Studio" && plain.executableName === undefined && plain.nsis.artifactName === "etiuda-studio-${version}-setup.${ext}"
    && plain.nsis.shortcutName === "Etiuda Studio" && plain.nsis.uninstallDisplayName === "Etiuda Studio" && plain.extraMetadata[TS.TEST_SERVICE_KEY] === undefined
    && !loose(plain) && TS.testServiceConfig(base, {}) === base,
    "ts2a without the variable the config is the ordinary one: Etiuda Studio, etiuda-studio-${version}-setup, no test service fields, the very object");
  const { [TS.TEST_SERVICE_KEY]: packed, ...restMeta } = tested.extraMetadata || {};
  check(tested.productName === "Etiuda Studio Test Service" && tested.executableName === "Etiuda Studio"
    && tested.nsis.artifactName === "Etiuda-Studio-Test-Service-${version}-Setup.${ext}" && tested.nsis.shortcutName === "Etiuda Studio Test Service"
    && tested.nsis.uninstallDisplayName === "Etiuda Studio Test Service" && tested.appId === plain.appId
    && JSON.stringify(restMeta) === JSON.stringify(plain.extraMetadata) && JSON.stringify(packed) === JSON.stringify(fields)
    && !loose(tested) && JSON.stringify(tested.files) === JSON.stringify(plain.files),
    "ts2b with it: \"Etiuda Studio Test Service\" and Etiuda-Studio-Test-Service-<version>-Setup.exe, the program still Etiuda Studio.exe, the same app id "
    + tested.appId + ", the version from package.json untouched, the fields in extraMetadata (packed into the asar's package.json), nothing beside the asar");
  await plantCheck(() => {
    const plantedDefault = lift(tsSrc, "ts-default", "  void 0; /* plant:ts-default */");
    const D = require(write("p2/tools/test-service.cjs", plantedDefault));
    let named = false;
    try { named = D.testServiceConfig({ productName: "Etiuda Studio", win: {}, nsis: {} }, {}).productName === "Etiuda Studio Test Service"; } catch { named = true; }
    return plantedDefault !== tsSrc && named;
  }, "ts2c with plant:ts-default put in another form, the build without the variable is no longer the ordinary one, so ts2a has teeth");

  /* ---- ts3, the step before packing and the summary read back from the asar ------------------------------------------- */
  const absent = TS.testServiceStep({}, ROOT, "win32");
  const present = TS.testServiceStep({ ETIUDA_PACK_TEST_SERVICE: write("lab2.json", labText), ETIUDA_GOOGLE_CLIENT_SECRET: SECRET }, ROOT, "win32");
  check(absent === "Test service: absent" && present === "Test service: present, " + STAGING && present.indexOf(SECRET) < 0,
    "ts3a unset, the step says absent; set, present with the service, never the secret");
  const stops = [
    () => TS.testServiceStep({ ETIUDA_PACK_TEST_SERVICE: write("bad.json", "{\"service\":\"https://example.com/\"}") }, ROOT, "win32"),
    () => TS.testServiceStep({ ETIUDA_PACK_TEST_SERVICE: write("lab3.json", labText) }, ROOT, "linux"),
    () => TS.testServiceStep({ ETIUDA_PACK_TEST_SERVICE: path.join(TMP, "nowhere.json") }, ROOT, "win32"),
  ].map(f => { try { f(); return "went on"; } catch (e) { return e.message; } });
  check(/refuses/.test(stops[0]) && /Windows only/.test(stops[1]) && /no file/.test(stops[2]),
    "ts3b a refused file, a Linux pack and a missing file each stop the pack: " + stops.map(s => s.slice(0, 40)).join(" | "));
  const asarLib = require("@electron/asar");
  const pack = async (name, pkg) => {
    const src = path.join(TMP, name + "-src"), res = path.join(TMP, name, "resources");
    fs.mkdirSync(path.join(src, "src"), { recursive: true }); fs.mkdirSync(res, { recursive: true });
    fs.writeFileSync(path.join(src, "src", "stand-in.cjs"), "// a stand-in\n".repeat(50));
    fs.writeFileSync(path.join(src, "package.json"), JSON.stringify(pkg));
    await asarLib.createPackage(src, path.join(res, "app.asar"));
    fs.writeFileSync(path.join(res, "test-service.json"), JSON.stringify(FILE));
    return res;
  };
  const withFields = await pack("with", { name: "etiuda-studio", [TS.TEST_SERVICE_KEY]: fields }), without = await pack("without", { name: "etiuda-studio" });
  check(TS.testServiceSummary(withFields) === "Test service: present, " + STAGING && TS.testServiceSummary(without) === "Test service: absent"
    && JSON.stringify(TS.asarPackage(path.join(withFields, "app.asar"))[TS.TEST_SERVICE_KEY]) === JSON.stringify(fields)
    && /testServiceSummary\(resDir\)/.test(PACKAGE) && /!!testServiceGiven\(process\.env\) !== \/present\/\.test\(serviceSaid\)/.test(PACKAGE),
    "ts3c the package step reads the fields back from the asar @electron/asar packed, a loose file beside it counting for nothing, and refuses a package that disagrees with the variable");

  /* ---- ts4, Studio takes the asar's fields, packaged alone, whole or not at all; a file beside the asar never read ---------- */
  /* Each layout: resources/app.asar/package.json (with or without the fields) and a well-formed test-service.json, its own root,
     planted beside the asar; Studio's module runs from resources/app.asar/src. */
  const PLANTED_ROOT = "cd".repeat(32);
  const layout = (name, pkgFields) => {
    const res = path.join(TMP, "lay-" + name, "resources");
    write(path.relative(TMP, path.join(res, "app.asar", "package.json")), JSON.stringify(Object.assign({ name: "etiuda-studio" },
      pkgFields === undefined ? {} : { [TS.TEST_SERVICE_KEY]: pkgFields })));
    fs.mkdirSync(path.join(res, "app.asar", "src"), { recursive: true });
    write(path.relative(TMP, path.join(res, "test-service.json")), JSON.stringify(Object.assign({}, FILE, { service: "https://etiuda.dev/licence-planted/v1/", root: PLANTED_ROOT })));
    return path.join(res, "app.asar", "src");
  };
  const run = (fn, packaged, dir) => {
    const reads = [], errs = [], was = process.stderr.write;
    process.stderr.write = (t) => { errs.push(String(t)); return true; };
    let got;
    try { got = fn(packaged, dir, f => { reads.push(f); return fs.readFileSync(f, "utf8"); }); } finally { process.stderr.write = was; }
    return { got, reads, errs };
  };
  const nearLoose = r => r.reads.some(f => /test-service\.json$/.test(f));
  const good = layout("good", fields), bad = layout("bad", { service: "https://example.com/licence/v1/" }), none = layout("none");
  const g = run(LAB.testServiceNow, true, good), b = run(LAB.testServiceNow, true, bad), n = run(LAB.testServiceNow, true, none), dev = run(LAB.testServiceNow, false, good);
  check(!!g.got && g.got.service === STAGING && g.got.clientIds.google === FILE.clientIds.google && g.got.root === FILE.root && g.errs.length === 0 && !nearLoose(g)
    && LAB.TEST_SERVICE_KEY === TS.TEST_SERVICE_KEY,
    "ts4a packaged with the fields in the asar's package.json: the lab taken from them (their service, client ids and root), not from the planted file beside the asar");
  check(n.got === null && n.errs.length === 0 && !nearLoose(n) && b.got === null && b.errs.length === 1 && /refused/.test(b.errs[0]) && dev.got === null && dev.reads.length === 0,
    "ts4b an ordinary package with a well-formed file, root " + PLANTED_ROOT.slice(0, 6) + "..., planted beside its asar stays ordinary: no lab, so no band, the shipped"
    + " service and root alone, a certificate under the planted root unjudged by it; malformed fields are said once; a development Studio reads nothing");
  check(/\nconst lab = testService \|\| labNow\(process\.env, PACKAGED, /.test(LABSRC) && LAB.testService === false && LAB.lab === null
    && /trustedKey: o\.trustedKey \|\| \(lab && lab\.root\) \|\| /.test(fs.readFileSync(path.join(ROOT, "src", "licence.mjs"), "utf8")),
    "ts4c the root a certificate is judged under comes from the lab alone (src/licence.mjs), the test service's lab stands in for the variable's only where taken, and here there is none");
  await plantCheck(() => {
    const plantedPkg = lift(LABSRC, "ts-packaged", "  if (!/[\\\\/]app\\.asar[\\\\/]/i.test(String(dir || \"\"))) return null; /* plant:ts-packaged */");
    const plantedAsar = lift(LABSRC, "ts-asar", "  try { fields = JSON.parse(read(require(\"node:path\").join(String(dir), \"..\", \"..\", \"test-service.json\"))); } catch { return null; }");
    const plantedTake = lift(LABSRC, "ts-take", "  if (false) return null; /* plant:ts-take */");
    const L1 = require(write("p3/src/signin-lab.cjs", plantedPkg)), L2 = require(write("p4/src/signin-lab.cjs", plantedTake)), L3 = require(write("p7/src/signin-lab.cjs", plantedAsar));
    const r1 = run(L1.testServiceNow, false, good), r2 = run(L2.testServiceNow, true, bad), r3 = run(L3.testServiceNow, true, none);
    return plantedPkg !== LABSRC && plantedTake !== LABSRC && plantedAsar !== LABSRC && !!r1.got && !!r2.got && !!r2.got.refused && !!r3.got && r3.got.root === PLANTED_ROOT;
  }, "ts4d with plant:ts-packaged put in another form a development Studio takes the fields, with plant:ts-take refused fields are taken, and with plant:ts-asar reading the loose file the planted root is taken");

  /* ---- ts5, the page is told, and the band is drawn only then ---------------------------------------------------------- */
  const hostAt = SHELL.indexOf('answer("studio:host"'), hostEnd = SHELL.indexOf("\n}));", hostAt);
  check(/\n  \.\.\.\(require\(path\.join\(ROOT, "src", "signin-lab\.cjs"\)\)\.testService === true \? \{ testService: true \} : \{\}\), \/\* plant:ts-host \*\//.test(SHELL.slice(hostAt, hostEnd))
    && /\n    if \(h\.testService === true\) testServiceBand\(document\); \/\* plant:ts-band \*\//.test(APP) && (SHELL.match(/testService: true/g) || []).length === 1,
    "ts5a the shell tells the page testService only in a test service build, and boot draws the band only on true");
  const fnAt = APP.indexOf("  function testServiceBand(doc) {"), fnEnd = APP.indexOf("\n  function paintBand() {", fnAt);
  const bandFns = fnAt < 0 || fnEnd < 0 ? "" : APP.slice(fnAt, fnEnd);
  const drawn = (() => {
    try {
      const all = [], body = { children: [{ tagName: "SECTION" }], classes: new Set(), get firstChild() { return this.children[0]; },
        insertBefore(nd, ref) { this.children.splice(Math.max(0, this.children.indexOf(ref)), 0, nd); all.push(nd); return nd; } };
      body.classList = { add: c => body.classes.add(c) };
      const doc = { body, createElement: t => ({ tagName: t, id: "", attrs: {}, textContent: "", setAttribute(k, v) { this.attrs[k] = v; } }),
        getElementById: id => all.find(x => x.id === id) || null };
      const f = new Function("$", "T", bandFns + "\nreturn testServiceBand;")(() => null, s => "T(" + s + ")");
      const el = f(doc), again = f(doc);
      return { ok: !!el && again === null && body.children[0] === el && el.id === "sTestBand" && body.classes.has("s-test-service"), text: el && el.textContent };
    } catch (e) { return { ok: false, text: e.message }; }
  })();
  check(drawn.ok && drawn.text === "T(Test service)" && /\n    onScreen\("chrome"\);\n    paintTestBand\(\);/.test(APP),
    "ts5b the mark (once the band, the owner's word of 2026-11-20) is the body's first child, once, in the copywriter's words through T(), and every paint gives it the language again: " + drawn.text);
  const pl = /"Test service": "([^"]+)"/.exec(LANG);
  check(!!pl && pl[1] === "Usługa testowa", "ts5c the Polish is held");
  /* The mark's place (the owner's word of 2026-11-20: the orange bar goes, a small corner mark at most): fixed in the bottom right
     corner, dim, catching no pointer, and the band's old room is nothing, so the screen and the scrim keep their whole height. */
  const mark = cssIn => {
    const css = cssIn.replace(/\/\*[\s\S]*?\*\//g, "");
    const m = /#sTestBand\{([^{}]*)\}/.exec(css), b = m ? m[1] : "";
    return !!m && /position:fixed/.test(b) && /right:10px/.test(b) && /bottom:6px/.test(b) && /pointer-events:none/.test(b)
      && /background:none/.test(b) && /font-size:10px/.test(b) && !/app-region:drag/.test(b) && /body\.s-test-service\{--s-tb-h:0px\}/.test(css);
  };
  const css = INDEX.slice(0, INDEX.indexOf("</style>"));
  check(mark(css), "ts5d the test service mark sits fixed in the bottom right corner, small, without a background, catching no pointer, and takes no room");
  await plantCheck(() => !mark(css.replace(/(#sTestBand{[^{}]*)pointer-events:none;/, "$1")) && !mark(css.replace("--s-tb-h:0px", "--s-tb-h:24px")),
    "ts5e with the mark catching the pointer, or the band's old room given back, ts5d's reading goes red");

  /* ---- ts6, tools/sellable.mjs refuses the variable, the asar's fields and a loose file; each refusal planted --------------- */
  const S = await import(pathToFileURL(path.join(ROOT, "tools", "sellable.mjs")).href);
  const sres = path.join(TMP, "sell-res"), sclean = path.join(TMP, "sell-clean");
  write("sell-res/test-service.json", "{}\n"); fs.mkdirSync(sclean, { recursive: true });
  const saidS = S.testServiceProblems({ resources: sres, env: { ETIUDA_PACK_TEST_SERVICE: "x" } });
  const saidA = S.testServiceProblems({ resources: withFields }), saidW = S.testServiceProblems({ resources: without });
  check(saidS.length === 2 && S.testServiceProblems({ resources: sclean, env: { ETIUDA_PACK_TEST_SERVICE: "" } }).length === 0
    && saidA.some(l => /carries the test service fields/.test(l)) && !saidW.some(l => /carries the test service fields/.test(l)),
    "ts6a the variable, a loose file and an asar carrying the fields are each refused; an empty variable, a clean package and an asar without them are not");
  await plantCheck(async () => {
    const sellSrc = fs.readFileSync(path.join(ROOT, "tools", "sellable.mjs"), "utf8");
    const at = (dir, text) => { const f = write(dir + "/sellable.mjs", text); for (const m of ["test-service.cjs", "esigner.cjs"]) fs.copyFileSync(path.join(ROOT, "tools", m), path.join(TMP, dir, m)); return f; };
    const pf = at("p5", lift(sellSrc, "sell-ts-file", "    if (false) out.push(\"\"); /* plant:sell-ts-file */"));
    const pv = at("p6", lift(sellSrc, "sell-ts-var", "    void 0; /* plant:sell-ts-var */"));
    const pa = at("p8", lift(sellSrc, "sell-ts-asar", "    void pkg; /* plant:sell-ts-asar */"));
    const SF = await import(pathToFileURL(pf).href), SV = await import(pathToFileURL(pv).href), SA = await import(pathToFileURL(pa).href);
    return SF.testServiceProblems({ resources: sres }).length === 0 && SV.testServiceProblems({ env: { ETIUDA_PACK_TEST_SERVICE: "x" } }).length === 0
      && !SA.testServiceProblems({ resources: withFields }).some(l => /carries the test service fields/.test(l));
  }, "ts6b with plant:sell-ts-file, plant:sell-ts-var and plant:sell-ts-asar each put in another form, the loose file, the variable and the asar's fields each go unrefused");
  /* The release profile: this tree's own package, in the folder electron-builder.js writes to, carries no test service file. */
  if (process.env.ETIUDA_PROFILE === "release" || process.env.ETIUDA_PROFILE === "nightly") {
    const own = path.join(path.resolve(process.env.ETIUDA_STUDIO_DIST || path.resolve(ROOT, "..", "etiuda-studio-dist")), "win-unpacked", "resources");
    const ownSaid = S.testServiceProblems({ resources: own });
    check(ownSaid.length === 0, "ts6c the release profile finds no test service package in " + own + (ownSaid.length ? ": " + ownSaid.join("; ") : ""));
  } else check(true, "ts6c outside the release profile, this tree's own package is not read (ETIUDA_PROFILE is not release or nightly)");

  /* ---- ts9, Studio's relay under the switch ------------------------------------------------------------------------------ */
  /* src/relay.mjs as loaded from `srcDir`, its src/wire.cjs fresh and src/signin-lab.cjs answered as a test service build (testing) or
     an ordinary one: {made, fallback}, the addresses NEW_TEAMS_URL and RELAY_URL hold. ETIUDA_RELAY_ORIGIN is unset for the load. */
  let relayLoads = 0;
  const relayOf = async (srcDir, testing) => {
    const labAt = path.join(srcDir, "signin-lab.cjs"), wireAt = path.join(srcDir, "wire.cjs"), was = process.env.ETIUDA_RELAY_ORIGIN;
    const real = require(labAt), saved = require.cache[require.resolve(labAt)];
    delete process.env.ETIUDA_RELAY_ORIGIN;
    delete require.cache[require.resolve(wireAt)];
    require.cache[require.resolve(labAt)] = { id: labAt, filename: labAt, loaded: true, children: [], exports: Object.assign({}, real, { lab: null, testService: testing }) };
    try {
      const R = await import(pathToFileURL(path.join(srcDir, "relay.mjs")).href + "?ts9=" + (++relayLoads));
      return { made: R.NEW_TEAMS_URL, fallback: R.RELAY_URL };
    } finally {
      require.cache[require.resolve(labAt)] = saved;
      delete require.cache[require.resolve(wireAt)];
      if (was === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = was;
    }
  };
  const LIVE_RELAY = "https://etiuda.dev/relay/v1", STAGING_RELAY = "https://etiuda.dev/relay-staging/v1";
  const relayRight = (ts, plainBuild) => ts.made === STAGING_RELAY && ts.fallback === LIVE_RELAY && plainBuild.made === LIVE_RELAY && plainBuild.fallback === LIVE_RELAY;
  const tsBuild = await relayOf(path.join(ROOT, "src"), true), plainBuild = await relayOf(path.join(ROOT, "src"), false);
  check(relayRight(tsBuild, plainBuild),
    "ts9a a test service build makes its new teams on staging's relay and keeps the relay as the fallback of a record naming none; an ordinary"
    + " build makes them on the relay: test service " + tsBuild.made + " | " + tsBuild.fallback + ", ordinary " + plainBuild.made + " | " + plainBuild.fallback);
  /* The shell: the two places a team is made on the relay take NEW_TEAMS_URL, and every other mention of RELAY_URL is the
     fallback of a record that names no address. */
  const shellRight = (src) => {
    const line = (tag) => src.split("\n").find((l) => l.indexOf("plant:" + tag + " ") >= 0) || "";
    const made = line("rs926-keep").indexOf("K.keepRelay(at, teamId, rt, Rl.NEW_TEAMS_URL);") >= 0
      && line("rts-start").indexOf("teamId, rt, url: Rl.NEW_TEAMS_URL,") >= 0
      && src.split("Rl.NEW_TEAMS_URL").length - 1 === 2;
    const all = src.split("Rl.RELAY_URL").length - 1, fallbacks = (src.match(/(?:\|\| Rl\.RELAY_URL\b|relayRowUrl\(r, Rl\.RELAY_URL\))/g) || []).length;
    return { ok: made && all === fallbacks && all === 2, made, all, fallbacks };
  };
  const sh = shellRight(SHELL);
  check(sh.ok, "ts9b shell/main.js makes a team on the relay at NEW_TEAMS_URL in its 2 places, and names RELAY_URL only as the"
    + " fallback of a record naming no address: made " + sh.made
    + ", RELAY_URL " + sh.all + " of which fallbacks " + sh.fallbacks);
  await plantCheck(async () => {
    const lab = path.join(TMP, "ts9-src");
    fs.cpSync(path.join(ROOT, "src"), path.join(lab, "src"), { recursive: true });
    fs.cpSync(path.join(ROOT, "engine", "pinned"), path.join(lab, "engine", "pinned"), { recursive: true });
    const relaySrc = fs.readFileSync(path.join(ROOT, "src", "relay.mjs"), "utf8"), wireSrc = fs.readFileSync(path.join(ROOT, "src", "wire.cjs"), "utf8");
    const clean = [await relayOf(path.join(lab, "src"), true), await relayOf(path.join(lab, "src"), false)];
    fs.writeFileSync(path.join(lab, "src", "relay.mjs"), lift(relaySrc, "rts-new-teams", "const NEW_TEAMS_URL = RELAY_ORIGIN.replace(/\\/$/, \"\");"));
    const pNew = [await relayOf(path.join(lab, "src"), true), await relayOf(path.join(lab, "src"), false)];
    fs.writeFileSync(path.join(lab, "src", "relay.mjs"), relaySrc);
    fs.writeFileSync(path.join(lab, "src", "wire.cjs"), lift(wireSrc, "wire-testing", "TESTING = true;"));
    const pOn = [await relayOf(path.join(lab, "src"), true), await relayOf(path.join(lab, "src"), false)];
    return relayRight(clean[0], clean[1]) && !relayRight(pNew[0], pNew[1]) && !relayRight(pOn[0], pOn[1]);
  }, "ts9c with plant:rts-new-teams put in another form a test service build makes its teams on the relay, and with plant:wire-testing an"
    + " ordinary build makes them on staging's, the copy unplanted answering as ts9a does, so ts9a has teeth");
  await plantCheck(async () => {
    const reds = [["rts-start", "      r = await thread.call(\"startRelayTeam\", String(dir || \"\"), { key, passphrase: await keySecret(), teamId, rt, url: Rl.RELAY_URL,"]]
      .map(([tag, to]) => shellRight(lift(SHELL, tag, to)).ok);
    return reds.every((ok) => ok === false);
  }, "ts9d with plant:rts-start put in another form (the relay's address in place of where new teams are made), ts9b goes red");
} catch (e) {
  failed++;
  process.stderr.write("  FAIL " + String(e && e.stack || e).split("\n").slice(0, 3).join(" | ") + "\n");
} finally {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* said below */ }
  check(!fs.existsSync(TMP), "ts7 the temp folder is gone");
}
check(asserted + 1 + skipped >= EXPECTED, "ts8 every leg ran or was skipped under ETIUDA_PLANTS=off: " + (asserted + 1) + " ran, " + skipped + " skipped, of " + EXPECTED);
process.stdout.write("#counts checks=" + asserted + " failures=" + failed + " skipped=" + skipped + "\n");
process.stdout.write("test-service: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
