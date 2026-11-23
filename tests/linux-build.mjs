/* THE UBUNTU BUILD'S OWN PARTS, held in node: no build, no window.
 *
 *     node tests/linux-build.mjs
 *
 * The .deb and the AppImage come from two things this tree adds for Linux (2026-10-04), and each
 * can go wrong without a build saying so:
 *   1  tools/ico-png.mjs slices the menu icons out of packaging/etiuda-studio.ico. A slice at the
 *      wrong offset is still bytes, and a Linux menu shows a broken picture or none; so every entry
 *      is held to the PNG header's own width, and a bitmap entry is refused rather than passed on.
 *   2  electron-builder.js reads --linux off the command line. A Windows build must see the config
 *      it always saw: no linux keys in the packaged package.json, the same targets; a Linux build
 *      must get desktopName (the window's WM_CLASS), the public homepage in place of this private
 *      repository's address, and no update feed.
 *   3  the spelling dictionaries (2026-10-06): the Linux block copies them into resources/dictionaries and the
 *      Windows block copies nothing but the Group Policy template (2026-10-15); the pin in tools/dictionaries.mjs names the two files shell/main.js copies;
 *      the fetch writes only bytes of the pinned hash, keeps a whole file without asking and refuses without
 *      writing when no source has them; and the check names a missing file and one with other bytes. A planted
 *      getter stands in for the web, so nothing here reaches the network.
 * Linux's process table, which the launch gate's teardown reads to reach Electron's zygotes, is held
 * by tests/shell-launch.mjs 6a, a window suite; this file opens none and reads nothing of the door's.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import os from "node:os";
import { icoPngs } from "../tools/ico-png.mjs";
import { FILES, dictionaryProblems, fetchDictionaries, sourcesOf } from "../tools/dictionaries.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const require = createRequire(import.meta.url);
const EXPECTED = 16;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* ---- 1. THE ICONS ------------------------------------------------------------------------------ */
const ico = fs.readFileSync(path.join(ROOT, "packaging", "etiuda-studio.ico"));
const pngs = icoPngs(ico);
/* A PNG's width is the four bytes after "IHDR", which sits at byte 12; the entry's own size must agree. */
const widthOf = b => b.readUInt32BE(16);
check(pngs.length === 15 && pngs.every(p => widthOf(p.bytes) === p.size && p.bytes.readUInt32BE(20) === p.size),
  "1a every entry of packaging/etiuda-studio.ico comes out as a PNG whose own header says the size it is filed under: "
  + JSON.stringify(pngs.map(p => [p.size, widthOf(p.bytes)])));
check(pngs.map(p => p.size).join() === "256,128,96,80,72,64,60,48,40,36,32,30,24,20,16",
  "1b largest first, the fifteen sizes the Windows icon carries: " + pngs.map(p => p.size).join());
check(pngs.every(p => ico.indexOf(p.bytes) > 0),
  "1c each picture is the icon's own bytes, found whole inside the .ico, nothing redrawn");
/* The control: the same icon with its 16px entry's first image byte turned from a PNG's to a bitmap's. */
const bent = Buffer.from(ico), at16 = bent.readUInt32LE(6 + 12);
bent[at16] = 0x28;
let said = "";
try { icoPngs(bent); } catch (e) { said = String(e && e.message); }
check(/entry 0 \(16px\) is not a PNG/.test(said),
  "1d CONTROL: an entry that is a bitmap rather than a PNG is refused, naming it: " + JSON.stringify(said));
let notIco = "";
try { icoPngs(Buffer.from("not an icon")); } catch (e) { notIco = String(e && e.message); }
check(/not an \.ico file/.test(notIco), "1e and a file that is no icon at all is refused: " + JSON.stringify(notIco));

/* ---- 2. THE CONFIG, AS EACH BUILD READS IT ----------------------------------------------------- */
function configWith(argv) {
  const at = require.resolve("../electron-builder.js"), was = process.argv;
  delete require.cache[at];
  process.argv = was.slice(0, 2).concat(argv);
  try { return JSON.parse(JSON.stringify(require(at))); }
  finally { process.argv = was; delete require.cache[at]; }
}
const win = configWith(["--win"]), linux = configWith(["--linux"]);
check(JSON.stringify(Object.keys(win.extraMetadata)) === '["released"]',
  "2a a Windows build's packaged package.json gains only the release day, as before the Ubuntu build: "
  + JSON.stringify(win.extraMetadata));
check(linux.extraMetadata.desktopName === "etiuda-studio.desktop" && linux.extraMetadata.homepage === "https://etiuda.dev"
      && linux.extraMetadata.released === win.extraMetadata.released && linux.linux.syncDesktopName === true,
  "2b a Linux build's gains the desktop name its window's class follows and the product's public site as homepage: "
  + JSON.stringify(linux.extraMetadata));
const strip = c => { const o = Object.assign({}, c); delete o.extraMetadata; return JSON.stringify(o); };
check(strip(win) === strip(linux) && JSON.stringify(win.win.target) === '[{"target":"nsis","arch":["x64"]}]',
  "2c CONTROL: but for that one key the two read the same config, the Windows target still the NSIS installer alone");
check(linux.linux.publish === null && JSON.stringify(linux.linux.target.map(t => t.target)) === '["deb","AppImage"]'
      && linux.linux.executableName === "etiuda-studio",
  "2d the Linux targets are a .deb and an AppImage running etiuda-studio, with no update feed: "
  + JSON.stringify([linux.linux.target.map(t => t.target), linux.linux.publish]));
check(!/github\.com/i.test(JSON.stringify(linux)),
  "2e and nothing in the config a Linux build reads names a repository's address");

/* ---- 3. THE SPELLING DICTIONARIES ------------------------------------------------------------- */
const output = process.env.ETIUDA_STUDIO_DIST || path.resolve(ROOT, "..", "etiuda-studio-dist");
check(JSON.stringify(linux.linux.extraResources) === JSON.stringify([{ from: path.join(output, ".dictionaries"), to: "dictionaries" }])
      && win.extraResources === undefined && win.nsis.extraResources === undefined
      && JSON.stringify(win.win.extraResources) === JSON.stringify([{ from: "engine/pinned/shell/policy", to: "policy" }]),
  "3a the Linux block copies the output folder's .dictionaries into resources/dictionaries, and the Windows block copies"
  + " the Group Policy template alone (tests/strength-and-policy.mjs sp2g): " + JSON.stringify(linux.linux.extraResources)
  + " " + JSON.stringify(win.win.extraResources));
const shellFiles = (/files: (\[[^\]]*\])/.exec(fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8")) || [])[1] || "";
check(shellFiles === JSON.stringify(FILES.filter(f => /\.bdic$/.test(f.name)).map(f => f.name)).replace(/,/g, ", ")
      && FILES.length === 5 && FILES.every(f => /^[0-9a-f]{64}$/.test(f.sha256)),
  "3b the pin's two dictionaries are the two files shell/main.js copies, in Chromium's casing, and every pinned file has its"
  + " sha256: " + shellFiles);
const LAB = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-linux-build-"));
try {
  const sha = b => createHash("sha256").update(b).digest("hex");
  const SYN = [{ name: "xx-XX-1-0.bdic", text: "planted dictionary" }, { name: "README_xx.txt", text: "planted notice" }]
    .map(f => ({ name: f.name, size: f.text.length, sha256: sha(Buffer.from(f.text)), text: f.text }));
  const served = {};
  for (const f of SYN) served[sourcesOf(f.name)[0].url] = Buffer.from(Buffer.from(f.text).toString("base64"));
  let asked = 0;
  const get = async u => { asked++; if (served[u]) return served[u]; throw new Error(u + " answered 404"); };
  const into = path.join(LAB, "fetched");
  const first = await fetchDictionaries(into, { files: SYN, get, notice: "planted NOTICE" });
  const second = await fetchDictionaries(into, { files: SYN, get, notice: "planted NOTICE" });
  check(first.fetched.length === 2 && SYN.every(f => fs.readFileSync(path.join(into, f.name), "utf8") === f.text)
        && second.kept.length === 2 && asked === 2,
    "3c the fetch writes each file whose bytes are the pinned hash, and a second fetch keeps them without asking: "
    + JSON.stringify([first, second, asked]));
  const wrong = path.join(LAB, "wrong");
  let said = "";
  try { await fetchDictionaries(wrong, { files: SYN, notice: "n", get: async () => Buffer.from(Buffer.from("other bytes").toString("base64")) }); }
  catch (e) { said = String(e && e.message); }
  check(/no pinned copy of xx-XX-1-0\.bdic/.test(said) && fs.readdirSync(wrong).length === 0,
    "3d bytes of another hash from every source are refused and nothing is written: " + JSON.stringify(said.slice(0, 120)));
  fs.writeFileSync(path.join(into, "README_xx.txt"), "planted noticE");
  fs.rmSync(path.join(into, "xx-XX-1-0.bdic"));
  const bad = dictionaryProblems(into, SYN, "planted NOTICE");
  check(bad.length === 2 && /xx-XX-1-0\.bdic is missing/.test(bad[0]) && /README_xx\.txt is not the pinned file/.test(bad[1])
        && dictionaryProblems(path.join(LAB, "nowhere"), SYN, "n").length === 1,
    "3e the check names a missing file and one with other bytes, and refuses a folder that is not there: " + JSON.stringify(bad));
} finally { fs.rmSync(LAB, { recursive: true, force: true }); }

check(asserted + 1 === EXPECTED, "9 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
process.stdout.write("linux-build: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
