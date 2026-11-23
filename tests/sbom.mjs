/* THE SOFTWARE BILL OF MATERIALS, one leg per claim tools/sbom.mjs could get wrong (enterprise
 * pack item 8).
 *
 *     node tests/sbom.mjs [--keep]
 *
 * Claims, each driven through the tool's own command line, the outermost caller:
 *   1  on this tree: the SBOM is CycloneDX, names Studio at package.json's version, Electron at
 *      the version package.json pins AND node_modules/electron/dist/version says, the engine at
 *      tools/engine-pin, and no devDependency; its npm set equals the one npm's own lockfile
 *      derives, walked by a second implementation here
 *   2  a dependency ADDED to package.json appears, with every package it pulls in, at the
 *      versions the lockfile records; the same tree without the addition lists none of them
 *   3  a synthetic tree with frozen expected versions: nested and scoped packages, a
 *      devDependency and its own dependency absent, an optional dependency not installed absent,
 *      and the same optional dependency installed listed with its own
 *   4  a declared dependency that is not installed refuses and writes no file
 *   5  given the packaged app, what is inside app.asar is held against the list both ways: an
 *      extra package, a missing package and a different engine pin each refuse; and no folder of
 *      the build machine goes into the document
 *   6  given the installer, its SHA-256 is carried as the distribution's hash, against a frozen
 *      literal from sha256sum
 *
 * No release runs here, and nothing reaches the network. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dropScratch } from "./scratch.mjs";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TOOL = path.join(ROOT, "tools", "sbom.mjs");
const KEEP = process.argv.indexOf("--keep") > -1;
const EXPECTED = 24;
const require = createRequire(import.meta.url);

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function finish() {
  tidy();
  check(asserted + 1 === EXPECTED, "9 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
  /* No #counts line, for tests/release.mjs's reason: this runs inside npm test, one result line. */
  process.stdout.write("sbom-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

const JUNCTIONS = [];
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-sbom-"));
function lab(name) { const d = path.join(SCRATCH, name); fs.mkdirSync(d, { recursive: true }); return d; }
function put(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof body === "string" ? body : JSON.stringify(body, null, 2) + "\n");
}
function run(argv) {
  const r = spawnSync(process.execPath, [TOOL].concat(argv), { encoding: "utf8", timeout: 60000 });
  return { status: r.status, out: String(r.stdout || "") + String(r.stderr || "") };
}
function bomAt(file) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return null; } }
/* The npm packages a BOM lists, as name@version, sorted: Electron counted apart. */
function npmSet(bom) {
  return ((bom && bom.components) || []).filter(c => /^pkg:npm\//.test(c.purl || "") && c.name !== "electron")
    .map(c => (c.group ? c.group + "/" : "") + c.name + "@" + c.version).sort();
}
function comp(bom, name) { return ((bom && bom.components) || []).find(c => c.name === name) || null; }

/* THE SECOND IMPLEMENTATION: npm's own record of what it resolved, walked from package.json's
   production dependencies with node's lookup (the nearest node_modules first, then each parent),
   over package-lock.json's paths rather than the disk. Written here, apart from the tool, so the
   two agree only if both are right. */
function lockClosure(pkg, lock) {
  const P = lock.packages || {};
  const out = new Set();
  const seen = new Set();
  function find(from, name) {
    let at = from;
    for (;;) {
      const cand = (at ? at + "/" : "") + "node_modules/" + name;
      if (P[cand]) return cand;
      if (!at) return null;
      const i = at.lastIndexOf("/node_modules/");
      at = i < 0 ? "" : at.slice(0, i);
    }
  }
  function visit(from, deps) {
    for (const name of Object.keys(deps || {})) {
      const p = find(from, name);
      if (!p || seen.has(p)) continue;
      seen.add(p);
      out.add(name + "@" + P[p].version);
      visit(p, Object.assign({}, P[p].dependencies, P[p].optionalDependencies));
    }
  }
  visit("", Object.assign({}, pkg.dependencies, pkg.optionalDependencies));
  return [...out].sort();
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const lock = JSON.parse(fs.readFileSync(path.join(ROOT, "package-lock.json"), "utf8"));
const PIN = (/^ENGINE_PIN=([0-9a-f]{40})\s*$/m.exec(fs.readFileSync(path.join(ROOT, "tools", "engine-pin"), "utf8")) || [])[1] || "";

async function main() {
  check(fs.existsSync(TOOL), "0 the tool is there: " + TOOL);
  if (!fs.existsSync(TOOL)) finish();

  /* ---- 1. THIS TREE ------------------------------------------------------------------------ */
  const out1 = path.join(lab("tree"), "tree.cdx.json");
  const r1 = run(["--root", ROOT, "--out", out1]);
  const b1 = bomAt(out1);
  check(r1.status === 0 && !!b1 && b1.bomFormat === "CycloneDX" && b1.specVersion === "1.5"
    && /^urn:uuid:[0-9a-f-]{36}$/.test(b1.serialNumber || ""),
    "1a the tree gives a CycloneDX 1.5 document, exit " + r1.status
    + (r1.status ? "; " + r1.out.trim().split(/\r?\n/).slice(-2).join(" | ") : ""));
  const mc = b1 && b1.metadata && b1.metadata.component;
  check(!!mc && mc.name === pkg.name && mc.version === pkg.version && mc.type === "application",
    "1b the subject is " + JSON.stringify(mc && [mc.name, mc.version, mc.type]) + " against package.json's "
    + JSON.stringify([pkg.name, pkg.version]));
  /* Electron's version from two places the tool does not read: the pin package.json declares,
     and the version file inside the Electron that npm unpacked. Both must be the SBOM's. */
  const declared = (pkg.devDependencies || {}).electron || "";
  const distVersion = fs.readFileSync(path.join(ROOT, "node_modules", "electron", "dist", "version"), "utf8").trim();
  const e1 = comp(b1, "electron");
  check(/^\d+\.\d+\.\d+$/.test(declared) && !!e1 && e1.version === declared && e1.version === distVersion
    && e1.purl === "pkg:npm/electron@" + declared && e1.scope === "required",
    "1c Electron is listed at " + JSON.stringify(e1 && e1.version) + " against package.json's exact pin "
    + JSON.stringify(declared) + " and node_modules/electron/dist/version " + JSON.stringify(distVersion));
  const eng = comp(b1, "etiuda-engine");
  check(PIN.length === 40 && !!eng && eng.version === PIN,
    "1d the embedded engine is listed at " + JSON.stringify(eng && eng.version) + " against tools/engine-pin "
    + JSON.stringify(PIN));
  const devNames = Object.keys(pkg.devDependencies || {}).filter(n => n !== "electron");
  const devListed = devNames.filter(n => ((b1 && b1.components) || []).some(c => (c.group ? c.group + "/" : "") + c.name === n));
  check(devNames.length >= 3 && devListed.length === 0,
    "1e none of the " + devNames.length + " devDependencies but Electron is listed ("
    + JSON.stringify(devListed) + " listed of " + JSON.stringify(devNames) + ")");
  const want1 = lockClosure(pkg, lock);
  check(JSON.stringify(npmSet(b1)) === JSON.stringify(want1),
    "1f the npm packages listed, " + JSON.stringify(npmSet(b1)) + ", are the lockfile's production closure "
    + JSON.stringify(want1));

  /* ---- 2. A DEPENDENCY ADDED TO package.json APPEARS ---------------------------------------- */
  /* The real package.json, and the real node_modules through a junction, so the walk is over
     what npm actually installed; the addition is a package already installed as a dev tool, so
     no install and no network is needed. @electron/asar is chosen because it pulls in others. */
  const ADD = "@electron/asar";
  function realLab(name, extra) {
    const d = lab(name);
    const p = JSON.parse(JSON.stringify(pkg));
    if (extra) p.dependencies = Object.assign({}, p.dependencies, extra);
    put(path.join(d, "package.json"), p);
    put(path.join(d, "engine", "pinned", ".engine-pin.json"), { pin: PIN, count: 0, files: [] });
    /* A junction on Windows; elsewhere there are none, and a symbolic link is the same walk for the reader. */
    if (process.platform === "win32")
      execFileSync("cmd.exe", ["/d", "/c", "mklink", "/J", path.join(d, "node_modules"), path.join(ROOT, "node_modules")],
        { stdio: "ignore", windowsHide: true });
    else fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(d, "node_modules"), "dir");
    JUNCTIONS.push(path.join(d, "node_modules"));
    return { d, p };
  }
  const before = realLab("real-before", null);
  const after = realLab("real-after", { [ADD]: lock.packages["node_modules/" + ADD].version });
  const r2a = run(["--root", before.d, "--out", path.join(before.d, "bom.json")]);
  const r2b = run(["--root", after.d, "--out", path.join(after.d, "bom.json")]);
  const b2a = bomAt(path.join(before.d, "bom.json")), b2b = bomAt(path.join(after.d, "bom.json"));
  const want2 = lockClosure(after.p, lock);
  const asarV = lock.packages["node_modules/" + ADD].version;
  check(r2a.status === 0 && !!b2a && !npmSet(b2a).some(s => s.indexOf(ADD + "@") === 0),
    "2a without the addition, " + ADD + " is not listed (exit " + r2a.status + ", " + npmSet(b2a).length + " npm package(s))");
  check(r2b.status === 0 && npmSet(b2b).indexOf(ADD + "@" + asarV) > -1,
    "2b with " + ADD + " added to dependencies it is listed at " + asarV + ", the lockfile's version (exit "
    + r2b.status + (r2b.status ? "; " + r2b.out.trim().split(/\r?\n/).slice(-1)[0] : "") + ")");
  check(want2.length >= 4 && JSON.stringify(npmSet(b2b)) === JSON.stringify(want2),
    "2c and so is everything it pulls in: " + npmSet(b2b).length + " package(s) listed against the lockfile's "
    + want2.length + " (" + want2.join(", ") + ")");
  const top = b2b && (b2b.dependencies || []).find(d => d.ref === (mc && mc["bom-ref"]) || d.ref === (b2b.metadata.component || {})["bom-ref"]);
  const asarNode = b2b && (b2b.dependencies || []).find(d => d.ref === "pkg:npm/%40electron/asar@" + asarV);
  const asarDeps = Object.keys(lock.packages["node_modules/" + ADD].dependencies || {}).sort();
  check(!!top && top.dependsOn.indexOf("pkg:npm/%40electron/asar@" + asarV) > -1
    && !!asarNode && asarNode.dependsOn.map(r => /^pkg:npm\/([^@]+)@/.exec(r)[1]).sort().join(",") === asarDeps.join(","),
    "2d the graph says Studio depends on " + ADD + " and " + ADD + " on " + JSON.stringify(asarNode && asarNode.dependsOn)
    + ", against the lockfile's " + JSON.stringify(asarDeps));

  /* ---- 3. A SYNTHETIC TREE, THE EXPECTED LIST WRITTEN BEFORE THE TOOL RAN ------------------ */
  const syn = lab("synthetic");
  function synTree(d, extraDeps) {
    put(path.join(d, "package.json"), { name: "etiuda-studio", version: "7.8.9",
      dependencies: Object.assign({ alpha: "^1.0.0", "@sc/beta": "2.x" }, extraDeps || {}),
      optionalDependencies: { gamma: "*" },
      devDependencies: { delta: "1.0.0", electron: "9.9.9" } });
    put(path.join(d, "engine", "pinned", ".engine-pin.json"), { pin: "c".repeat(40), count: 0, files: [] });
    const nm = path.join(d, "node_modules");
    put(path.join(nm, "alpha", "package.json"), { name: "alpha", version: "1.2.3", license: "MIT", dependencies: { shared: "^1.0.0" } });
    put(path.join(nm, "alpha", "node_modules", "shared", "package.json"), { name: "shared", version: "1.5.0", license: "ISC" });
    put(path.join(nm, "alpha", "lib", "package.json"), { type: "module" });
    put(path.join(nm, "@sc", "beta", "package.json"), { name: "@sc/beta", version: "2.0.1", license: "(MIT OR Apache-2.0)", dependencies: { shared: "^2.0.0" } });
    put(path.join(nm, "shared", "package.json"), { name: "shared", version: "2.0.0", license: "ISC" });
    put(path.join(nm, "delta", "package.json"), { name: "delta", version: "1.0.0", dependencies: { epsilon: "3" } });
    put(path.join(nm, "epsilon", "package.json"), { name: "epsilon", version: "3.0.0" });
    put(path.join(nm, "electron", "package.json"), { name: "electron", version: "9.9.9", license: "MIT" });
  }
  synTree(syn);
  const r3 = run(["--root", syn, "--out", path.join(syn, "bom.json")]);
  const b3 = bomAt(path.join(syn, "bom.json"));
  const WANT3 = ["@sc/beta@2.0.1", "alpha@1.2.3", "shared@1.5.0", "shared@2.0.0"];
  check(r3.status === 0 && JSON.stringify(npmSet(b3)) === JSON.stringify(WANT3),
    "3a the synthetic tree lists " + JSON.stringify(npmSet(b3)) + " against the frozen " + JSON.stringify(WANT3)
    + ": nested and scoped kept, delta (dev), epsilon (dev's own) and gamma (optional, not installed) absent; exit " + r3.status);
  const e3 = comp(b3, "electron");
  check(!!e3 && e3.version === "9.9.9" && (comp(b3, "etiuda-engine") || {}).version === "c".repeat(40)
    && ((b3 && b3.metadata.component) || {}).version === "7.8.9",
    "3b Electron 9.9.9, the engine at cccc..., Studio 7.8.9, all the synthetic tree's");
  const alphaEdge = b3 && (b3.dependencies || []).find(d => d.ref === "pkg:npm/alpha@1.2.3");
  const betaEdge = b3 && (b3.dependencies || []).find(d => d.ref === "pkg:npm/%40sc/beta@2.0.1");
  check(!!alphaEdge && alphaEdge.dependsOn.join() === "pkg:npm/shared@1.5.0"
    && !!betaEdge && betaEdge.dependsOn.join() === "pkg:npm/shared@2.0.0",
    "3c each package depends on the copy node would load: alpha on " + JSON.stringify(alphaEdge && alphaEdge.dependsOn)
    + " (its nested 1.5.0), @sc/beta on " + JSON.stringify(betaEdge && betaEdge.dependsOn) + " (the top-level 2.0.0)");
  const beta = comp(b3, "beta"), alpha = comp(b3, "alpha");
  check(!!beta && beta.group === "@sc" && JSON.stringify(beta.licenses) === JSON.stringify([{ expression: "(MIT OR Apache-2.0)" }])
    && !!alpha && JSON.stringify(alpha.licenses) === JSON.stringify([{ license: { id: "MIT" } }]),
    "3d licences carried from each package.json: alpha " + JSON.stringify(alpha && alpha.licenses) + ", @sc/beta "
    + JSON.stringify(beta && beta.licenses));

  /* 3e AN OPTIONAL DEPENDENCY THAT IS INSTALLED IS LISTED, with its own dependency (board 819). Every
     arm above has gamma declared and absent, so a tool that never walked optionalDependencies at all
     passed the whole file (the test architect's plant of 2026-09-29, on the engine's copy of this
     test, which has the same arms). The same tree with gamma on the disk, and the expected list
     written here before the tool ran. */
  const synOpt = lab("synthetic-optional");
  synTree(synOpt);
  put(path.join(synOpt, "node_modules", "gamma", "package.json"), { name: "gamma", version: "0.4.0", license: "MIT", dependencies: { theta: "1" } });
  put(path.join(synOpt, "node_modules", "theta", "package.json"), { name: "theta", version: "1.0.0", license: "ISC" });
  const r3e = run(["--root", synOpt, "--out", path.join(synOpt, "bom.json")]);
  const b3e = bomAt(path.join(synOpt, "bom.json"));
  const WANT3E = ["@sc/beta@2.0.1", "alpha@1.2.3", "gamma@0.4.0", "shared@1.5.0", "shared@2.0.0", "theta@1.0.0"];
  const top3e = b3e && (b3e.dependencies || []).find(d => d.ref === (b3e.metadata.component || {})["bom-ref"]);
  check(r3e.status === 0 && JSON.stringify(npmSet(b3e)) === JSON.stringify(WANT3E)
    && !!top3e && top3e.dependsOn.indexOf("pkg:npm/gamma@0.4.0") > -1,
    "3e with the optional gamma installed it is listed, and theta with it: " + JSON.stringify(npmSet(b3e))
    + " against the frozen " + JSON.stringify(WANT3E) + ", Studio depending on gamma "
    + !!(top3e && top3e.dependsOn.indexOf("pkg:npm/gamma@0.4.0") > -1) + "; exit " + r3e.status);

  /* ---- 4. DECLARED AND NOT INSTALLED REFUSES ----------------------------------------------- */
  const miss = lab("missing");
  synTree(miss, { zeta: "1.0.0" });
  const r4 = run(["--root", miss, "--out", path.join(miss, "bom.json")]);
  check(r4.status === 1 && /zeta/.test(r4.out) && !fs.existsSync(path.join(miss, "bom.json")),
    "4 a dependency declared and not installed refuses, exit " + r4.status + ", names it ("
    + /zeta/.test(r4.out) + "), and writes no file (" + !fs.existsSync(path.join(miss, "bom.json")) + ")");

  /* ---- 5. THE PACKAGED APP IS HELD AGAINST THE LIST ---------------------------------------- */
  /* The asar is made by Electron's own @electron/asar and read back by the tool's own reader. The
     base arm packs exactly the synthetic tree's production packages (and alpha's lib/package.json,
     which is not a package); each mutant changes one thing. */
  const asar = require("@electron/asar");
  async function app(name, mutate) {
    const src = lab(name + "-src");
    const nm = path.join(syn, "node_modules");
    put(path.join(src, "package.json"), { name: "etiuda-studio", version: "7.8.9" });
    put(path.join(src, "engine", "pinned", ".engine-pin.json"), { pin: "c".repeat(40), count: 0, files: [] });
    for (const rel of ["alpha/package.json", "alpha/lib/package.json", "alpha/node_modules/shared/package.json",
                       "@sc/beta/package.json", "shared/package.json"])
      put(path.join(src, "node_modules", rel), fs.readFileSync(path.join(nm, rel), "utf8"));
    if (mutate) mutate(src);
    const unpacked = lab(name + "-win-unpacked");
    fs.mkdirSync(path.join(unpacked, "resources"), { recursive: true });
    await asar.createPackage(src, path.join(unpacked, "resources", "app.asar"));
    return unpacked;
  }
  const appOk = await app("app-ok");
  const r5a = run(["--root", syn, "--app", appOk, "--out", path.join(syn, "bom-app.json")]);
  const b5a = bomAt(path.join(syn, "bom-app.json"));
  check(r5a.status === 0 && JSON.stringify(npmSet(b5a)) === JSON.stringify(WANT3),
    "5a the packaged app holding exactly the list passes, exit " + r5a.status
    + (r5a.status ? "; " + r5a.out.trim().split(/\r?\n/).slice(-1)[0] : ""));
  /* 5e the document travels to customers, so no folder of the build machine goes into it: the
     text is searched for the home folder and the lab, in both slash forms and JSON-escaped. */
  const b5aText = fs.existsSync(path.join(syn, "bom-app.json")) ? fs.readFileSync(path.join(syn, "bom-app.json"), "utf8") : "";
  const homes = [os.homedir(), SCRATCH].flatMap(p => [p, p.replace(/\\/g, "/"), JSON.stringify(p).slice(1, -1)]);
  const leaked = homes.filter(h => b5aText.toLowerCase().indexOf(h.toLowerCase()) > -1);
  check(!!b5aText && leaked.length === 0 && /held against the packaged app/.test(b5aText),
    "5e no build-machine folder is in the document (" + leaked.length + " of " + homes.length
    + " forms of the home and the lab found), and it says it was held against the packaged app");
  const appExtra = await app("app-extra", s => put(path.join(s, "node_modules", "kappa", "package.json"), { name: "kappa", version: "1.0.0" }));
  const r5b = run(["--root", syn, "--app", appExtra, "--out", path.join(syn, "bom-extra.json")]);
  check(r5b.status === 1 && /kappa@1\.0\.0/.test(r5b.out) && !fs.existsSync(path.join(syn, "bom-extra.json")),
    "5b a package in the asar the list lacks refuses and names kappa@1.0.0, exit " + r5b.status);
  const appLess = await app("app-less", s => fs.rmSync(path.join(s, "node_modules", "@sc"), { recursive: true, force: true }));
  const r5c = run(["--root", syn, "--app", appLess, "--out", path.join(syn, "bom-less.json")]);
  check(r5c.status === 1 && /@sc\/beta@2\.0\.1/.test(r5c.out) && !fs.existsSync(path.join(syn, "bom-less.json")),
    "5c a listed package the asar lacks refuses and names @sc/beta@2.0.1, exit " + r5c.status);
  const appPin = await app("app-pin", s => put(path.join(s, "engine", "pinned", ".engine-pin.json"), { pin: "d".repeat(40), count: 0, files: [] }));
  const r5d = run(["--root", syn, "--app", appPin, "--out", path.join(syn, "bom-pin.json")]);
  check(r5d.status === 1 && /engine/i.test(r5d.out) && /d{40}/.test(r5d.out) && !fs.existsSync(path.join(syn, "bom-pin.json")),
    "5d an engine pin in the asar that is not the tree's refuses and names it, exit " + r5d.status);

  /* ---- 6. THE INSTALLER'S HASH --------------------------------------------------------------- */
  /* printf 'stub-installer' | sha256sum, the fourteen bytes tests/release.mjs's stub writes. */
  const STUB_SHA256 = "37604a24d2a6fbd9e2bcfc6c6afd4d56a2a33e72cbacf4f50ec822ee7c8561d6";
  const exe = path.join(syn, "etiuda-studio-7.8.9-setup.exe");
  fs.writeFileSync(exe, "stub-installer");
  const r6 = run(["--root", syn, "--installer", exe, "--out", path.join(syn, "bom-exe.json")]);
  const b6 = bomAt(path.join(syn, "bom-exe.json"));
  const dist = ((b6 && b6.metadata.component.externalReferences) || []).find(x => x.type === "distribution");
  check(r6.status === 0 && !!dist && dist.url === "etiuda-studio-7.8.9-setup.exe"
    && JSON.stringify(dist.hashes) === JSON.stringify([{ alg: "SHA-256", content: STUB_SHA256 }]),
    "6 the installer is named as the distribution with its SHA-256: " + JSON.stringify(dist) + " against " + STUB_SHA256);

  finish();
}

/* THE JUNCTIONS GO FIRST, by rmdir (unlink for a Linux symbolic link), which removes a junction and never what it points at: a
   recursive removal that followed one would take the real node_modules with it. */
function tidy() {
  for (const j of JUNCTIONS) if (fs.existsSync(j)) {
    /* Off Windows the link is a symbolic one, and unlink takes the link and never what it points at. */
    if (process.platform === "win32") spawnSync("cmd.exe", ["/d", "/c", "rmdir", j], { stdio: "ignore", windowsHide: true });
    else fs.unlinkSync(j);
  }
  if (JUNCTIONS.some(j => fs.existsSync(j))) { process.stdout.write("  a junction stayed; the scratch stays at " + SCRATCH + "\n"); return; }
  /* A SCRATCH STILL HELD IS SAID, not swallowed (board 801): tests/scratch.mjs retries and then names it. */
  if (!KEEP) dropScratch(SCRATCH, "sbom");
  else process.stdout.write("--keep: " + SCRATCH + "\n");
}

main().catch(e => { check(false, "the suite threw: " + (e && e.stack || e)); finish(); });
