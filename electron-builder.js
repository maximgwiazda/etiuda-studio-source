// Packaging: the shell, the interface, the modules and the pinned engine become a Windows
// installer, the same shape as the engine's.
//
//   npm run package        the installer, into ../etiuda-studio-dist or $ETIUDA_STUDIO_DIST
//   npm run package:dir    the unpacked app only, no installer, for a quick look
//
// electron-builder finds this file by name. CommonJS because package.json declares no module
// type, and a .js config rather than a .yml one because two values have to be read rather than
// written: where the output goes, and where the icon comes from.
"use strict";
const fs = require("node:fs");
const path = require("node:path");

// THE VERSION IS package.json's, unlike the engine's. The engine keeps E_VERSION in a module
// because the running page shows it and package.json stays at 0.0.0; Studio has one version in
// one place, so there is nothing here to reconcile. The refusal below is the whole guard: a
// packaged 0.0.0 would install and run and be indistinguishable from a real build afterwards.
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
const version = String(pkg.version || "");
if (!/^\d+\.\d+\.\d+/.test(version) || version.indexOf("0.0.0") === 0)
  throw new Error("package.json version is " + JSON.stringify(version) + ", which is not a version to ship");

// THE DAY THIS BUILD WAS RELEASED, fixed here and read back by src/licence.mjs out of the packaged
// package.json, which is the only copy that carries it. A licence carries the versions released
// before its updates end and refuses a later one (board 745), so this date is the build's half of
// that comparison and must not move after packaging; today's date at run time never enters it.
// ETIUDA_STUDIO_RELEASED names the day when a release is packaged on another; anything that is
// not a date refuses, because a build that could not be compared would slip past the lock.
const releasedEnv = process.env.ETIUDA_STUDIO_RELEASED;
if (releasedEnv != null && !/^\d{4}-\d{2}-\d{2}$/.test(releasedEnv))
  throw new Error("ETIUDA_STUDIO_RELEASED is " + JSON.stringify(releasedEnv) + ", which is not a YYYY-MM-DD date");
// The packaging machine's own calendar day, not UTC's: a build made at one in the morning in
// Warsaw was released that day, and the cover says the date a person would.
const now = new Date();
const released = releasedEnv || now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0")
  + "-" + String(now.getDate()).padStart(2, "0");

// An absolute path is local to one machine. The default is a SIBLING of this checkout rather
// than dist/ inside it, so that nothing an installer build writes can ever be picked up by the
// content scan, by a gate walking the tree, or by the allowlist below; ETIUDA_STUDIO_DIST moves
// it elsewhere.
// A LINUX BUILD is one electron-builder was asked for with --linux, which tools/package.mjs passes on
// a Linux machine. Read from the command line rather than from a variable so that a bare
// `electron-builder --linux` is the same build; a Windows build, and every test that requires this
// file, sees false and the config it always saw.
const LINUX_BUILD = process.argv.indexOf("--linux") > -1;

// WHAT A LINUX BUILD ADDS TO THE PACKAGED package.json. desktopName: Electron reads it there to set
// the window's WM_CLASS, which must match the .desktop file's name for a dock to put the window
// under the menu entry's icon. homepage: a .deb refuses to build without one, and the default is
// read from the git remote, which would print this private repository's address into the package
// a customer installs; the product's own site is the address meant for a customer. license: the
// control file's License line, which otherwise reads "unknown"; the terms are the EULA (board 491).
const LINUX_METADATA = { desktopName: "etiuda-studio.desktop", homepage: "https://etiuda.dev",
  license: "LicenseRef-Etiuda-EULA" };

const output = process.env.ETIUDA_STUDIO_DIST || path.resolve(__dirname, "..", "etiuda-studio-dist");

// GOOGLE'S CLIENT SECRET (tools/signin-secret.cjs): copied into resources only when ETIUDA_GOOGLE_CLIENT_SECRET is set for the
// packaging command, written by beforePack below; unset, both desks' resources are as before. Its value is never in this tree.
const signinSecret = require("./tools/signin-secret.cjs");
const SIGNIN_SECRET = signinSecret.signinSecretResources(process.env, output);
// THE TEST SERVICE BUILD (tools/test-service.cjs): only where ETIUDA_PACK_TEST_SERVICE names a lab file for the packaging command.
const testService = require("./tools/test-service.cjs");
// THE SELLER'S ADDRESS (tools/seller-address.cjs): only where ETIUDA_PACK_SELLER_ADDRESS names its private file for the packaging command.
const sellerAddress = require("./tools/seller-address.cjs");

// THE SIGNING HOOK, the engine's unchanged: one route or none, chosen by which variables are set.
// With none the block is absent and electron-builder packages unsigned. No route holds a secret
// here: a .pfx's password is WIN_CSC_KEY_PASSWORD, read by electron-builder itself so it stays out
// of a process listing; a token keeps its key and asks for its own PIN; Artifact Signing signs in
// through Azure's own credentials. Two routes at once, or half of one, refuses.
// ETIUDA_SIGN=esigner reads its account from the Windows keyring as it signs (tools/esigner.cjs).
const SIGN_TIMESTAMP = { signingHashAlgorithms: ["sha256"], rfc3161TimeStampServer: "http://timestamp.digicert.com" };
const ARTIFACT = { endpoint: "ETIUDA_SIGNING_ENDPOINT", codeSigningAccountName: "ETIUDA_SIGNING_ACCOUNT",
  certificateProfileName: "ETIUDA_SIGNING_PROFILE", publisherName: "ETIUDA_SIGNING_PUBLISHER" };
const given = name => process.env[name] || "";
const cert = given("ETIUDA_CERT"), sha1 = given("ETIUDA_CERT_SHA1"), subject = given("ETIUDA_CERT_SUBJECT");
const artifact = Object.values(ARTIFACT).filter(given);
const esigner = require("./tools/esigner.cjs");
const esignerKind = esigner.mode(process.env);
const routes = [cert && "ETIUDA_CERT", (sha1 || subject) && "ETIUDA_CERT_SHA1 or ETIUDA_CERT_SUBJECT",
  artifact.length && "ETIUDA_SIGNING_*", esignerKind && esigner.SIGN_VAR].filter(Boolean);
if (routes.length > 1) throw new Error("signing: " + routes.join(" and ") + " are set; set one route or none");
if (artifact.length && artifact.length < 4)
  throw new Error("signing: Artifact Signing needs " + Object.values(ARTIFACT).filter(n => !given(n)).join(", ") + " too");
const signing = cert ? { signtoolOptions: { certificateFile: cert, ...SIGN_TIMESTAMP } }
  : sha1 || subject ? { signtoolOptions: { ...(sha1 && { certificateSha1: sha1 }), ...(subject && { certificateSubjectName: subject }), ...SIGN_TIMESTAMP } }
  : artifact.length ? { azureSignOptions: Object.fromEntries(Object.entries(ARTIFACT).map(([key, name]) => [key, given(name)])) }
  : esigner.esignerSigning(process.env, __dirname, output) || {};

// THE INSTALL'S OWN LIST, etiuda-files.ini at the root of the program's folder: every file the package holds at its size, written by
// the pinned engine's shell/install-files.cjs, as the desk's own build writes it. From engine 22d3af9c the installer hooks Studio
// includes read it three ways (an update swaps in a stage only when every listed file is there at its size, moves back whatever
// the older copy's list does not name, and drops a copy set aside by its list), so a Studio built against such a pin without it
// would have every update refused as short. A pin whose installer reads the list with no writer fetched refuses the build; a pin
// that predates the list writes nothing, since nothing would read it. tests/studio-installer-mends.mjs sm1 holds it.
const LIST_NAME = "etiuda-files.ini";
function installList(context, pinned) {
  if (context.electronPlatformName !== "win32") return "";
  const at = pinned || path.join(__dirname, "engine", "pinned");
  const writer = path.join(at, "shell", "install-files.cjs");
  if (!fs.existsSync(writer)) {
    let hooks = "";
    try { hooks = fs.readFileSync(path.join(at, ".installer-hooks.nsh"), "utf8"); } catch { /* no cut, nothing reads a list */ }
    if (hooks.indexOf(LIST_NAME) > -1)
      throw new Error(LIST_NAME + ": the pinned installer reads it and " + writer + " is not fetched; tools/engine-modules.txt lacks shell/install-files.cjs");
    return "";
  }
  const n = require(writer).writeManifest(context.appOutDir);
  console.log(LIST_NAME + ": " + n + " files listed");
  return n;
}

module.exports = sellerAddress.sellerConfig(testService.testServiceConfig({
  // A DIFFERENT appId FROM THE ENGINE'S app.etiuda.desktop, on purpose. The two products install
  // side by side on one machine, and NSIS derives the uninstall registry key and the per-user
  // install folder from this; sharing it would make installing one uninstall the other.
  appId: "app.etiuda.studio",
  productName: "Etiuda Studio",
  copyright: "Copyright (c) 2026 Maxim Gwiazda",
  directories: { output, buildResources: "packaging" },
  // Three keys only in a Linux build, so the Windows build's packaged package.json is the bytes it
  // always was (LINUX_METADATA above).
  extraMetadata: { released, ...(LINUX_BUILD ? LINUX_METADATA : {}) },
  // An allowlist, the same discipline as the engine's. What a customer's machine gets is the
  // shell, the interface, the modules and the pinned engine's own bytes; the harness, the tools
  // and the fixtures stay out. engine/pinned/ is fetched by tools/engine-fetch.mjs and is not in
  // this repository at all, so tools/package.mjs fetches it before electron-builder runs and
  // refuses if it is absent: without it every lint and every publish throws at the first click.
  files: [
    "package.json",
    "shell/main.js", "shell/preload.js",
    // The installer's licence page, inside the program too: the About's "Read the licence" reads it
    // off this disk (src/studio.mjs agreementText), since the agreement promises no connection.
    "packaging/license_en.txt", "packaging/license_pl.txt",
    // The application icon and tray badge icons for trayIcon and closeHeld (board 969).
    "packaging/etiuda-studio.ico",
    "packaging/tray/**",
    "ui/**",
    "src/**",
    // The bytes every signed request to the licence service covers (board 936 S6): Studio builds them from the very file the
    // service's Worker builds them from, so the two cannot drift; nothing else of service/ ships.
    "service/licence/requests.mjs",
    "engine/pinned/**",
    // The desk's shell and the converter's selftest are read by tests and tools alone, and each
    // names child_process; the product runs the shell's declarations it needs from
    // engine/pinned/.shell-slices.js, cut at the fetch (src/engine.mjs, board 865). The shell's
    // win-proxy.cjs, page-watch.cjs and tray.cjs ship, since Studio's shell runs them as they stand, and proxy-net.cjs, which src/wire.cjs runs.
    // clip-suggest.cjs, desk-reset.cjs, desk-ai.cjs and sync/ are required by the desk's shell and are not read here. The installer hooks
    // cut is for the NSIS build, not for the running program. tests/no-model.mjs 7 holds what the
    // package still carries that names child_process, and 9 that it carries every pinned path the
    // product reads.
    "!engine/pinned/shell/main.js",
    "!engine/pinned/shell/installer.nsh",
    "!engine/pinned/shell/installer/**",
    "!engine/pinned/shell/*/readme.txt",
    "!engine/pinned/shell/clip-suggest.cjs",
    "!engine/pinned/shell/desk-reset.cjs",
    "!engine/pinned/shell/desk-ai.cjs",
    "!engine/pinned/shell/sync/**",
    "!engine/pinned/.installer-hooks.nsh",
    // The install's list writer is the build's (installList above), never the program's.
    "!engine/pinned/shell/install-files.cjs",
    "!engine/pinned/tools/catalog-v2/selftest.mjs",
    // The relay itself (board 900) is fetched for the relay legs to run in memory and is the server's, not Studio's:
    // only its message bytes, relay/core.cjs, ship, for the lead-signed calls src/relay.mjs makes.
    "!engine/pinned/relay/worker.mjs",
    "!engine/pinned/relay/team.cjs",
    "!engine/pinned/relay/test/**",
    // The samples the licence service and the desk are both held to (tools/engine-modules.txt): read by the legs alone.
    "!engine/pinned/tests/card-flag-vectors.json",
    "!engine/pinned/tests/door-relays.json",
    "!engine/pinned/tests/signin-answers.json",
  ],
  // `engine/pinned/**` DOES take the dotfile .engine-pin.json, which is the shipped app's record
  // of which engine commit its bytes are; 141 entries go in and that is one of them, read back
  // by tests/installer.mjs leg 2d. Written down because the first reading said it was absent and
  // that reading was wrong: @electron/asar's extractFile wants path.sep separators, and a
  // forward-slash path deeper than two segments answers "was not found in this archive" for a
  // file that is plainly there. An absence is the cheapest wrong finding there is.
  asar: true,
  // THE FUSES, flipped in Etiuda Studio.exe before it is signed and read back by tools/package.mjs.
  // Off: running the binary as plain node, NODE_OPTIONS and the --inspect switches, each a way to
  // run any script under the program's own name or attach to its main process. On: app.asar is
  // held to the hash electron-builder embeds in the exe, nothing but that asar is loaded, and cookies on disk are
  // encrypted under Local State's key (DPAPI on Windows), so a cookie store dies with Local State, and with the fuse
  // turned off. The file protocol's extra privileges are left as Electron ships them, since the page is a file.
  electronFuses: {
    runAsNode: false,
    enableCookieEncryption: true, /* plant:fuse-cookie */
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true,
  },
  win: {
    target: [{ target: "nsis", arch: ["x64"] }],
    // THE BARE MARK IN VIOLET, NO TILE. Both products once shared one white mark, so only a
    // tile told two taskbar apps apart. Maxim ruled that no Etiuda mark sits on a tile: the
    // mark itself is inked, and the product is that ink. packaging/etiuda-studio.ico is a
    // copy of studio/etiuda-app.ico, never edited in place. tests/installer.mjs leg 0d holds
    // the copy byte for byte. Leg 0e reads the 256 entry's ink; leg 0f reads the engine icon.
    icon: "packaging/etiuda-studio.ico",
    // THE DESK'S GROUP POLICY TEMPLATE beside the program, resources/policy holding the pinned engine's etiuda.admx and
    // its ADML in each language, as the desk's own installer carries it (sense pass finding 17). The Desks screen saves a
    // copy filled in for the team (src/studio.mjs savePolicy) from the same pinned bytes inside the asar. Windows only.
    extraResources: [{ from: "engine/pinned/shell/policy", to: "policy" }, ...SIGNIN_SECRET],
    // EVERY LIBRARY SIGNED AS THE PROGRAM IS: Electron's DLLs beside the exe, each of which a publisher rule judges on
    // its own, and any Node addon (tests/sign-all.mjs); afterExtract below spares one its maker signed.
    signExts: [".dll", ".node"], /* plant:sign-exts */
    ...signing,
  },
  // The template patches tools/package.mjs applies, applied and read back here too, so an electron-builder run started
  // another way cannot build the installer from unpatched templates.
  // A FILE ITS MAKER SIGNED KEEPS THAT SIGNATURE: the packager's one signing door is narrowed before anything is copied or
  // signed (tools/sellable.mjs keepMakersSignatures), whichever route signs.
  afterExtract: async context => {
    if (context.electronPlatformName !== "win32") return;
    (await import(require("node:url").pathToFileURL(path.join(__dirname, "tools", "sellable.mjs")).href)).keepMakersSignatures(context.packager);
  },
  // THE INSTALL'S OWN LIST (installList above), written again once the folder is signed and its resources edited, so every size is
  // the one the installer extracts; afterPack's stands only where nothing signs or edits after it. electron-builder calls afterSign
  // on Windows even unsigned, since it always edits the program's resources.
  afterPack: async context => installList(context),
  afterSign: async context => installList(context),
  beforePack: async context => {
    const plat = context.electronPlatformName;
    if (plat === "win32") {
      const { applyNsisPatches, verifyNsisPatches } = require("./tools/patch-nsis.cjs");
      applyNsisPatches();
      const status = verifyNsisPatches();
      if (!status.applied) throw new Error("NSIS template patches not applied: " + JSON.stringify(status));
    }
    if (plat === "linux" || plat === "win32") {
      console.log(signinSecret.signinSecretStep(process.env, output));
      console.log(testService.testServiceStep(process.env, __dirname, plat));
      console.log(sellerAddress.sellerStep(process.env, module.exports.directories.buildResources));
    }
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    // THE DESK'S HOOKS THROUGH THE PIN, not a copy (sense pass item 41): the licence page
    // once on an all-users install, InstallLocation written, the updater's setup copy taken back.
    // packaging/installer-pages.nsh includes the five-hook cut of that pinned file, not the file
    // itself, and then Studio's welcome page. The pin is not edited, and tests/installer-writes.mjs
    // leg 1e still reads both.
    include: "installer-pages.nsh",
    // Frame 0 of the turning sidebar and header. The uninstaller's sidebar is the same still.
    // No icon key is set in this block.
    installerSidebar: "installer/installerSidebar.bmp",
    uninstallerSidebar: "installer/installerSidebar.bmp",
    installerHeader: "installer/installerHeader.bmp",
    artifactName: "etiuda-studio-${version}-setup.${ext}",
    shortcutName: "Etiuda Studio",
    uninstallDisplayName: "Etiuda Studio",
    // NO elevate.exe IN THE INSTALL. electron-builder copies it to resources\ for electron-updater's per-machine updates,
    // and Studio has no electron-updater; the all-users route elevates through the UAC plug-in, and the per-user copy's
    // uninstaller runs through UAC_AsUser_Call (packaging/installer-pages.nsh). perMachine true would override this.
    packElevateHelper: false,
    // THE LICENCE PAGE IS NAMED BY NO KEY HERE, AND THAT IS WHAT MAKES IT BILINGUAL. Board 491
    // put one End-User Licence over both products (Maxim, 2026-09-18) and it is written in
    // English and Polish; app-builder-lib picks license_<lang>.txt out of buildResources BY THE
    // INSTALLER'S OWN LANGUAGE, but only after looking for a `license` key and for a plain
    // license.txt or eula.txt, either of which would send every language the same page. So
    // packaging/ holds license_en.txt and license_pl.txt and nothing called license.txt, and
    // tests/licence.mjs asks app-builder-lib's own resolver rather than restating the rule.
    // Each file carries a UTF-8 BOM already: that path converts a licence file by writing the
    // BOM INTO it, and these are tracked, so a build would otherwise dirty the working tree.
  },
  // THE UBUNTU BUILD, a .deb and an AppImage, as ruled 2026-09-22 (board 633): `npm run package` on
  // a Linux machine, or `node tools/package.mjs --linux`. Nothing above changes for it, and nothing
  // here is read by a Windows build: electron-builder takes this block only under --linux.
  //   The .deb installs to /opt/Etiuda Studio/ and links /usr/bin/etiuda-studio. Its post-install
  // script is electron-builder's own, and on an Ubuntu with AppArmor it writes the profile under
  // /etc/apparmor.d/etiuda-studio that carries `userns,`, without which 24.04 refuses the sandbox
  // the user namespace it needs (research-analyst-2026-09-20-b, section 3, trap 3).
  //   The AppImage is one file and needs FUSE on the customer's machine, `libfuse2t64` on 24.04; it
  // carries no AppArmor profile of its own, so on 24.04 it runs only where one is installed for it.
  //   NO SIGNING. Linux checks no signature on a .deb or an AppImage at install; signing on this
  // platform means signing an apt repository, which is a later step (the same report, section 2).
  //   The icon is a PNG drawn out of packaging/etiuda-studio.ico by tools/package.mjs at build time
  // and written outside this tree, so no derived picture is committed beside the one it came from.
  linux: {
    target: [{ target: "deb", arch: ["x64"] }, { target: "AppImage", arch: ["x64"] }],
    executableName: "etiuda-studio",
    // desktopName is load-bearing: it names the .desktop file and Electron reads it back to set the
    // window's WM_CLASS, which is how a dock puts the window under the menu entry's icon.
    syncDesktopName: true,
    category: "Office",
    synopsis: "Build a catalog, lint it, publish it to a folder desks read",
    description: "Etiuda Studio is the program a catalog's owner uses: build a catalog, lint it, publish it to a folder the desks read.",
    maintainer: "Maxim Gwiazda",
    vendor: "Maxim Gwiazda",
    artifactName: "etiuda-studio-${version}-${arch}.${ext}",
    // NOTHING HERE SENDS ANYTHING (CLAUDE.md), so no update feed: without this electron-builder reads
    // the git remote and writes resources/app-update.yml naming this private repository as one.
    publish: null,
    ...(process.env.ETIUDA_STUDIO_LINUX_ICONS ? { icon: process.env.ETIUDA_STUDIO_LINUX_ICONS } : {}),
    // THE SPELLING DICTIONARIES, Linux only: fetched by hash into the output folder by tools/package.mjs before
    // packing (tools/dictionaries.mjs), and copied whole into resources/dictionaries, outside the asar, where the
    // shell finds them by process.resourcesPath. Windows checks spelling with its own checker (shell/main.js).
    extraResources: [{ from: path.join(output, ".dictionaries"), to: "dictionaries" }, ...SIGNIN_SECRET],
  },
  // THE NSIS THAT COMPILES THE INSTALLER. Without this key electron-builder 26 uses its legacy NSIS 3.04, whose stub,
  // written into every installer and uninstaller, lets a standard user on the machine become SYSTEM while either runs as
  // SYSTEM (CVE-2023-37378, CVE-2025-43715, CVE-2026-42171). "1.2.1" is app-builder-lib's bundle of NSIS 3.12, the first
  // release with all three fixed, its makensis, plug-ins and stubs in one archive pinned by SHA-256 in app-builder-lib.
  // tests/install-plan-selftest.mjs 15a reads the pin, tests/nsis-compile.mjs the version the compiler prints.
  toolsets: { nsis: "1.2.1" },
  deb: {
    // electron-builder's own list (libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6, xdg-utils,
    // libatspi2.0-0, libuuid1, libsecret-1-0) is the default and is kept; libsecret is what lets
    // safeStorage seal a team key on this desktop rather than fall back to a fixed password.
    packageCategory: "misc",
    priority: "optional",
  },
  // NO fileAssociations. The engine claims .ec because a catalog is the desk's document; Studio
  // edits projects and publishes .ec files, and two apps claiming one extension is a fight the
  // customer sees. If Studio is ever to own .ec, the engine has to give it up in the same change.
}, process.env, __dirname), process.env, __dirname, output);
