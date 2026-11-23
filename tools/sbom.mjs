/* The software bill of materials for a Studio release, CycloneDX 1.5 JSON (enterprise pack item 8).
 *
 *     node tools/sbom.mjs --out <file> [--root <dir>] [--app <win-unpacked>] [--installer <exe>]
 *
 * WHAT IS LISTED, and where each version is read. Nothing here reaches the network.
 *   - Studio itself, the subject, at package.json's version.
 *   - Electron, the runtime every build carries, at the version of the Electron npm installed in
 *     node_modules/electron, which is the one electron-builder packages. It is a devDependency by
 *     electron-builder's convention and is listed anyway, because it ships.
 *   - The engine, embedded under engine/pinned, at the commit its .engine-pin.json records.
 *   - Every PRODUCTION npm package: package.json's dependencies and optionalDependencies, and
 *     theirs, walked through node_modules with node's own lookup (the nearest node_modules first,
 *     then each parent up to the root), at the version each installed package.json states. A
 *     devDependency is never followed. An optional dependency that is not installed is skipped;
 *     a required one that is not installed REFUSES, because a list that silently lacks it is the
 *     failure an SBOM exists to prevent.
 *
 * --app NAMES THE PACKAGED APP, and then the list is held against what is actually inside its
 * resources/app.asar, both ways: every node_modules/<name>/package.json in the archive must be a
 * listed package at the same version, every listed package must be in the archive, and the
 * engine pin in the archive must be the tree's. Any difference refuses. The archive's header is
 * read here directly (the Pickle-framed JSON at its head), so the check needs no devDependency
 * and a release copied into a lab runs it unchanged. tools/release.mjs passes --app.
 *
 * --installer names the installer, and its SHA-256 goes into the document as the distribution's
 * hash, so the SBOM and the file it describes can be matched without trusting a file name.
 *
 * Exit 0 with the file written; 1 on a refusal, with nothing written; 2 on a usage error. */
import { readFileSync, writeFileSync, existsSync, openSync, readSync, closeSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HERE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export class SbomRefusal extends Error {}

function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }

function purlOf(name, version) {
  return "pkg:npm/" + (name[0] === "@" ? "%40" + name.slice(1) : name) + "@" + version;
}

function licencesOf(p) {
  const l = typeof p.license === "string" ? p.license.trim()
    : (p.license && typeof p.license.type === "string" ? p.license.type.trim() : "");
  if (!l) return undefined;
  if (/\s(OR|AND|WITH)\s/.test(l) || /^\(/.test(l)) return [{ expression: l }];
  if (/^[A-Za-z0-9.+-]+$/.test(l)) return [{ license: { id: l } }];
  return [{ license: { name: l } }];
}

/* Node's lookup, bounded by the root: from a package's own folder upward, skipping folders that
   are themselves called node_modules, never above the root. */
function lookup(root, fromDir, name) {
  let dir = fromDir;
  for (;;) {
    if (basename(dir) !== "node_modules") {
      const at = join(dir, "node_modules", ...name.split("/"));
      if (existsSync(join(at, "package.json"))) return at;
    }
    if (resolve(dir) === resolve(root)) return null;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/** The production packages of the tree at `root`: [{ name, version, purl, licenses, dependsOn }]. */
export function productionPackages(root) {
  const pkg = readJson(join(root, "package.json"));
  const byPath = new Map();          // folder -> purl
  const comps = new Map();           // purl -> component
  const missing = [];
  function walk(fromDir, deps, optional, who) {
    const refs = [];
    const names = Object.keys(deps || {}).concat(Object.keys(optional || {}).filter(n => !(deps || {})[n]));
    for (const name of names.sort()) {
      const at = lookup(root, fromDir, name);
      if (!at) {
        if (!(optional && name in optional) || (deps && name in deps)) missing.push(name + " (wanted by " + who + ")");
        continue;
      }
      let ref = byPath.get(at);
      if (!ref) {
        const p = readJson(join(at, "package.json"));
        ref = purlOf(p.name || name, String(p.version));
        byPath.set(at, ref);
        if (!comps.has(ref)) {
          const nm = p.name || name;
          const c = { type: "library", "bom-ref": ref, name: nm, version: String(p.version), scope: "required", purl: ref };
          if (nm[0] === "@") { c.group = nm.split("/")[0]; c.name = nm.split("/").slice(1).join("/"); }
          const lic = licencesOf(p);
          if (lic) c.licenses = lic;
          comps.set(ref, { component: c, dependsOn: new Set() });
        }
        /* Every FOLDER is walked, not every name@version: two copies of one version in two
           places can resolve their own dependencies to different nested copies. */
        const sub = walk(at, p.dependencies, p.optionalDependencies, (p.name || name) + "@" + p.version);
        for (const r of sub) comps.get(ref).dependsOn.add(r);
      }
      refs.push(ref);
    }
    return refs;
  }
  const direct = walk(root, pkg.dependencies, pkg.optionalDependencies, "package.json");
  if (missing.length) throw new SbomRefusal("declared and not installed, so what ships cannot be listed: " + missing.join(", "));
  return { pkg, direct, comps };
}

/* THE ARCHIVE'S HEADER. An asar begins with two Pickles: the first holds one uint32, the size of
   the second; the second holds the header as a length-prefixed JSON string. File bytes start
   after both, at each entry's offset; an entry marked unpacked lives in app.asar.unpacked. */
function readAsar(file, want) {
  const fd = openSync(file, "r");
  try {
    const head = Buffer.alloc(16);
    readSync(fd, head, 0, 16, 0);
    const headerSize = head.readUInt32LE(4);
    const strLen = head.readInt32LE(12);
    const json = Buffer.alloc(strLen);
    readSync(fd, json, 0, strLen, 16);
    const header = JSON.parse(json.toString("utf8"));
    const base = 8 + headerSize;
    const files = [];
    (function walk(node, at) {
      for (const [name, e] of Object.entries(node.files || {})) {
        const p = at ? at + "/" + name : name;
        if (e.files) walk(e, p);
        else if (!e.link) files.push({ path: p, entry: e });
      }
    })(header, "");
    function read(f) {
      if (f.entry.unpacked) return readFileSync(join(file + ".unpacked", ...f.path.split("/")));
      const b = Buffer.alloc(f.entry.size);
      readSync(fd, b, 0, f.entry.size, base + Number(f.entry.offset));
      return b;
    }
    return files.filter(f => want(f.path)).map(f => ({ path: f.path, bytes: read(f) }));
  } finally { closeSync(fd); }
}

/* A package's own manifest: node_modules/<name>/package.json or node_modules/@scope/<name>/
   package.json at any depth. A package.json deeper inside a package (lib/package.json saying
   only "type": "module") is not a package and is not counted. */
function isManifest(p) {
  const s = p.split("/");
  if (s[s.length - 1] !== "package.json") return false;
  if (s.length >= 3 && s[s.length - 3] === "node_modules" && s[s.length - 2][0] !== "@") return true;
  return s.length >= 4 && s[s.length - 4] === "node_modules" && s[s.length - 3][0] === "@";
}
const PIN_IN_APP = "engine/pinned/.engine-pin.json";

/** What the packaged app carries: its npm packages as name@version, and its engine pin. */
export function packagedApp(appDir) {
  const asar = join(appDir, "resources", "app.asar");
  if (!existsSync(asar)) throw new SbomRefusal("no packaged app to hold the list against: " + asar);
  const got = readAsar(asar, p => p === PIN_IN_APP || isManifest(p));
  const pinFile = got.find(f => f.path === PIN_IN_APP);
  const packages = got.filter(f => f.path !== PIN_IN_APP)
    .map(f => { const p = JSON.parse(f.bytes.toString("utf8")); return p.name + "@" + p.version; });
  return { asar, packages: [...new Set(packages)].sort(), pin: pinFile ? JSON.parse(pinFile.bytes.toString("utf8")).pin : "" };
}

/** The document. Refuses by throwing SbomRefusal. */
export function sbomOf({ root, app, installer, now }) {
  root = resolve(root || HERE_ROOT);
  const { pkg, direct, comps } = productionPackages(root);

  const ePkgFile = join(root, "node_modules", "electron", "package.json");
  if (!existsSync(ePkgFile)) throw new SbomRefusal("no Electron installed at " + ePkgFile + ", so the runtime's version is unknown");
  const ePkg = readJson(ePkgFile);
  const eRef = purlOf("electron", String(ePkg.version));
  const electron = { type: "framework", "bom-ref": eRef, name: "electron", version: String(ePkg.version), scope: "required",
    purl: eRef, description: "The runtime every build carries: Chromium, Node.js and V8" };
  const eLic = licencesOf(ePkg);
  if (eLic) electron.licenses = eLic;

  const pinFile = join(root, "engine", "pinned", ".engine-pin.json");
  if (!existsSync(pinFile)) throw new SbomRefusal("no engine at " + pinFile + "; fetch it with node tools/engine-fetch.mjs");
  const pin = String(readJson(pinFile).pin || "");
  if (!/^[0-9a-f]{40}$/.test(pin)) throw new SbomRefusal("the engine pin in " + pinFile + " is not a commit: " + JSON.stringify(pin));
  const engRef = "etiuda-engine@" + pin;
  const engine = { type: "library", "bom-ref": engRef, name: "etiuda-engine", version: pin, scope: "required",
    description: "The Etiuda engine at this commit, embedded under engine/pinned" };

  const listed = [...comps.values()].map(c => (c.component.group ? c.component.group + "/" : "")
    + c.component.name + "@" + c.component.version).sort();
  /* No absolute path goes into the document: it travels to customers, and the build machine's
     folders are nobody's business. The console and a refusal name them. */
  let source = "package.json and node_modules of the source tree";
  if (app) {
    const got = packagedApp(resolve(app));
    const extra = got.packages.filter(p => listed.indexOf(p) < 0);
    const lacking = listed.filter(p => got.packages.indexOf(p) < 0);
    const said = [];
    if (extra.length) said.push("in the packaged app and not listed: " + extra.join(", "));
    if (lacking.length) said.push("listed and not in the packaged app: " + lacking.join(", "));
    if (got.pin !== pin) said.push("the packaged app's engine is at " + JSON.stringify(got.pin) + " and the tree's at " + pin);
    if (said.length) throw new SbomRefusal("the list is not what shipped (" + got.asar + "): " + said.join("; "));
    source += ", held against the packaged app's resources/app.asar";
  }

  const appRef = pkg.name + "@" + pkg.version;
  const subject = { type: "application", "bom-ref": appRef, name: pkg.name, version: String(pkg.version) };
  if (installer) {
    const exe = resolve(installer);
    subject.externalReferences = [{ type: "distribution", url: basename(exe),
      hashes: [{ alg: "SHA-256", content: createHash("sha256").update(readFileSync(exe)).digest("hex") }] }];
  }

  const npm = [...comps.values()].sort((a, b) => a.component.purl < b.component.purl ? -1 : 1);
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: "urn:uuid:" + randomUUID(),
    version: 1,
    metadata: {
      timestamp: (now || new Date()).toISOString(),
      tools: { components: [{ type: "application", name: "etiuda-studio tools/sbom.mjs" }] },
      component: subject,
      properties: [{ name: "etiuda:sbom:source", value: source },
                   { name: "etiuda:sbom:scope", value: "production dependencies only; devDependencies are build tools and do not ship, Electron excepted" }],
    },
    components: [electron, engine].concat(npm.map(c => c.component)),
    dependencies: [{ ref: appRef, dependsOn: [...new Set(direct)].sort().concat([eRef, engRef]) },
                   { ref: eRef, dependsOn: [] }, { ref: engRef, dependsOn: [] }]
      .concat(npm.map(c => ({ ref: c.component["bom-ref"], dependsOn: [...c.dependsOn].sort() }))),
  };
}

/** Writes the document; returns { file, bytes, sha256, components, electron, pin, npm }. */
export function writeSbom(opts) {
  const bom = sbomOf(opts);
  const text = JSON.stringify(bom, null, 2) + "\n";
  const file = resolve(opts.out);
  writeFileSync(file, text, "utf8");
  const bytes = readFileSync(file);
  return { file, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
           components: bom.components.length, electron: bom.components[0].version,
           pin: bom.components[1].version, npm: bom.components.length - 2 };
}

const invoked = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invoked) {
  const argv = process.argv.slice(2);
  const arg = n => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : undefined; };
  const out = arg("--out");
  if (!out) { console.error("usage: node tools/sbom.mjs --out <file> [--root <dir>] [--app <win-unpacked>] [--installer <exe>]"); process.exit(2); }
  try {
    const r = writeSbom({ root: arg("--root"), app: arg("--app"), installer: arg("--installer"), out });
    console.log("sbom: " + r.file + "  " + r.bytes + " bytes, sha256 " + r.sha256 + ", " + r.components
      + " component(s): Electron " + r.electron + ", the engine at " + r.pin.slice(0, 7) + ", " + r.npm + " npm package(s)");
  } catch (e) {
    if (!(e instanceof SbomRefusal)) throw e;
    console.error("sbom: REFUSED, nothing written: " + e.message);
    process.exit(1);
  }
}
