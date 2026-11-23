/* EVERY FILE THE INSTALLER PUTS ON DISK THAT WINDOWS RUNS AS CODE IS SIGNED, AND READ BACK; the engine's
 * tests/sign-all.mjs in Studio's shape, which carries no helper of its own and no model runtime.
 *
 *   node tests/sign-all.mjs            exit code is the number of failed checks, capped at 63
 *
 * A publisher rule (AppLocker, Application Control) allows or refuses each program and library
 * by its own signature, so one unsigned DLL beside a signed Etiuda Studio.exe is a program that does
 * not start. Nothing here packages, signs or asks Windows anything. What each leg holds:
 *   1  electron-builder's own code, given the real electron-builder.js and a certificate, hands its signer
 *      every PE file of an app laid out as Electron's dist and the config's extra resources lay it out,
 *      except those its maker already signed, which the config's afterExtract door keeps from it: a
 *      Microsoft-signed DLL is never handed; with no certificate the door reads nothing; with
 *      plant:sign-exts lifted the unsigned DLLs go unsigned, with plant:sign-keep the maker's go to the signer
 *   2  the signature gate (tools/sellable.mjs signatureVerdict) given that app reads every one of those
 *      files back through its replaceable reader: one unsigned DLL, top-level or nested, is named; all
 *      ours passes, and a DLL Microsoft signed passes beside them; one signed by a publisher not on the
 *      makers' list is named; a program Valid under a maker is refused, and where the configuration names our
 *      publisher (publisherName, a subject, a thumbprint, the eSigner record) the program is held to it; a preview with no certificate is not asked, as ever; a PE file under another
 *      name is read and a text file opening MZ is not; a file the reader leaves unanswered is refused;
 *      with plant:sign-walk, plant:sign-unread, plant:sign-header, plant:sign-unsigned or
 *      plant:sign-publisher lifted, the fault each catches passes
 *   3  tools/release.mjs gives the gate the unpacked app
 *
 * The expected values below were written from the rule in tools/sellable.mjs before any run. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { signatureVerdict, peFiles, SIGNING_VARS, signIo, MAKERS, ourPublisher } from '../tools/sellable.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* Off in a merge's area run, which runs no planted fault. */
const PLANTS = process.env.ETIUDA_PLANTS !== 'off';
const require = createRequire(import.meta.url);
/* The floor: every leg below runs, or the file says it did not complete. */
const EXPECTED = 17;

let asserted = 0, failed = 0;
const notRun = [];
function check(ok, line) {
  asserted++;
  if (ok) console.log('  ok   ' + line);
  else { failed++; console.log('  FAIL ' + line); }
}
function skip(why, legs) { for (let i = 0; i < legs; i++) notRun.push(why); console.log('  NOT RUN ' + why); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-sign-all-'));
const J = JSON.stringify;
const EXE = 'Etiuda Studio.exe';
const rel = (dir, f) => path.relative(dir, f).replace(/\\/g, '/');
/* The smallest file Windows would take for a PE image: MZ, the offset at 60, PE and two zero bytes there. */
const PE = () => { const b = Buffer.alloc(128); b.write('MZ', 0, 'latin1'); b.writeUInt32LE(64, 60); b.write('PE\0\0', 64, 'latin1'); return b; };
const put = (file, bytes) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); return file; };

/* THE REAL electron-builder.js, or a copy of its text with one plant lifted, evaluated with every variable that adds a
   route or a resource cleared, so nothing on the desk running this changes what is read and no keyring is asked. */
const BUILDER = path.join(ROOT, 'electron-builder.js');
const BUILDER_TEXT = fs.readFileSync(BUILDER, 'utf8');
const QUIET = SIGNING_VARS.concat(['CSC_KEY_PASSWORD', 'WIN_CSC_KEY_PASSWORD', 'ETIUDA_GOOGLE_CLIENT_SECRET', 'ETIUDA_PACK_TEST_SERVICE',
  'ETIUDA_PACK_SELLER_ADDRESS']);
function config(text, out, cert) {
  const was = {};
  for (const k of QUIET.concat(['ETIUDA_STUDIO_DIST'])) { was[k] = process.env[k]; delete process.env[k]; }
  process.env.ETIUDA_STUDIO_DIST = out;
  if (cert) process.env.ETIUDA_CERT = 'C:/nowhere/etiuda.pfx';
  try {
    const m = { exports: {} };
    new Function('require', '__dirname', 'module', 'exports', text)(createRequire(BUILDER), ROOT, m, m.exports);
    return m.exports;
  } finally { for (const [k, v] of Object.entries(was)) { if (v == null) delete process.env[k]; else process.env[k] = v; } }
}
const lift = (marker, line) => {
  const t = BUILDER_TEXT.split('\n').map(l => l.includes('plant:' + marker) ? line + ' /* plant:' + marker + ' */' : l).join('\n');
  return t === BUILDER_TEXT ? null : t;
};

/* electron-builder's own Windows packager, as tests/sellable.mjs reads it. */
const ABL = path.join(ROOT, 'node_modules', 'app-builder-lib', 'package.json');
let EB = null, ebMissing = '';
if (fs.existsSync(ABL)) {
  try {
    const abl = createRequire(ABL);
    abl('app-builder-lib');
    EB = { ...abl('./out/winPackager.js'), ...abl('./out/fileMatcher.js') };
    for (const k of ['WinPackager', 'getFileMatchers', 'copyFiles'])
      if (!EB[k]) throw new Error('app-builder-lib no longer exports ' + k + ' where this leg reads it');
    for (const k of ['signApp', 'createTransformerForExtraFiles', 'shouldSignFile'])
      if (typeof EB.WinPackager.prototype[k] !== 'function') throw new Error('WinPackager no longer has ' + k);
  } catch (e) { EB = null; ebMissing = String(e.message).split('\n')[0]; }
}

/* WHILE electron-builder's code runs, nothing may start a process or reach a network: each such call throws and is
   counted, and every leg in 1 requires the count to be nought. */
const ESCAPES = [];
async function sealed(run) {
  const SEAL = [[require('node:child_process'), 'child_process', ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']],
    [require('node:http'), 'http', ['request', 'get']], [require('node:https'), 'https', ['request', 'get']],
    [require('node:net'), 'net', ['connect', 'createConnection']], [globalThis, 'globalThis', ['fetch']]];
  const put = [];
  for (const [obj, label, names] of SEAL) for (const n of names) {
    const was = Object.getOwnPropertyDescriptor(obj, n);
    if (!was) continue;
    put.push([obj, n, was]);
    Object.defineProperty(obj, n, { configurable: true, writable: true, value: function () { ESCAPES.push(label + '.' + n); throw new Error('sealed: ' + label + '.' + n); } });
  }
  try { return await run(); } finally { for (const [obj, n, was] of put.reverse()) Object.defineProperty(obj, n, was); }
}

/* AN APP LAID OUT AS THE BUILD LAYS IT OUT, into `app`: Electron's dist at the top (each file of it under its own name,
   electron.exe as Etiuda Studio.exe, a PE stub where the real file is one), then the config's extra resources copied by
   electron-builder's own copier into resources/. Returns the files electron-builder handed its signer, relative to `app`. */
const DIST = path.join(ROOT, 'node_modules', 'electron', 'dist');
/* The door asks Windows through signIo, which here answers MICROSOFT's names Valid under Microsoft and every other file
   NotSigned; build() also returns how many readings the door asked for. */
const MS_SUBJECT = 'CN=Microsoft Windows, O=Microsoft Corporation, L=Redmond, S=Washington, C=US';
const MICROSOFT = ['d3dcompiler_47.dll', 'dxil.dll'];
const atSignTime = files => files.map(f => MICROSOFT.includes(path.basename(f))
  ? { file: f, status: 'Valid', timestamped: true, subject: MS_SUBJECT } : { file: f, status: 'NotSigned', timestamped: false, subject: '' });
async function build(name, text, { cert = true, door = null } = {}) {
  const out = path.join(TMP, name + '-out'), app = path.join(out, 'win-unpacked');
  const cfg = config(text, out, cert);
  for (const f of fs.readdirSync(DIST)) {
    const at = path.join(DIST, f);
    if (!fs.statSync(at).isFile()) continue;
    const fd = fs.openSync(at, 'r'), head = Buffer.alloc(2);
    try { fs.readSync(fd, head, 0, 2, 0); } finally { fs.closeSync(fd); }
    put(path.join(app, f === 'electron.exe' ? EXE : f), head.toString('latin1') === 'MZ' ? PE() : 'not code');
  }
  put(path.join(app, 'resources', 'app.asar'), 'an archive, not code');
  const handed = [];
  const stub = Object.create(EB.WinPackager.prototype);
  Object.assign(stub, { platformSpecificBuildOptions: cfg.win, info: { config: cfg },
    appInfo: { productFilename: 'Etiuda Studio' },
    signIf: async f => { handed.push(f); return true; },
    signAndEditResources: async function (f) { await this.signIf(f); } });
  let reads = 0;
  const io = { ...signIo };
  signIo.read = files => { reads += files.length; return atSignTime(files); };
  signIo.log = () => {};
  try {
    if (door) door(stub); else if (typeof cfg.afterExtract === 'function') await cfg.afterExtract({ packager: stub, electronPlatformName: 'win32', appOutDir: app });
  await sealed(async () => {
    const matchers = EB.getFileMatchers(cfg, 'extraResources', path.join(app, 'resources'),
      { macroExpander: s => s, customBuildOptions: cfg.win, globalOutDir: out, defaultSrc: ROOT }) || [];
    for (const m of matchers) m.computeParsedPatterns([], ROOT);
    await EB.copyFiles(matchers, stub.createTransformerForExtraFiles({ appOutDir: app }));
    await stub.signApp({ appOutDir: app }, true);
  });
  } finally { Object.assign(signIo, io); }
  return { app, out, reads, signed: [...new Set(handed.map(f => rel(app, f)))].sort(), pe: peFiles(app).map(f => rel(app, f)) };
}

try {
  /* ---- 1. the build signs every PE file ----------------------------------------------------------------------- */
  let real = null;
  /* The build lays the app out from Electron's own dist, which off Windows holds no Etiuda Studio.exe and no DLL to sign; the gate's
     half below then reads a smaller app of the same shape, so it runs everywhere (Claude gamma's Linux sweep, 2026-11-14). */
  const aside1 = require('./off-windows.cjs').standAside('1a-1d', 'electron-builder lays out a Windows app only from Windows\'s Electron dist, which this platform does not have');
  if (aside1) skip(aside1, 4);
  else if (!EB) {
    if (ebMissing) check(false, '1a-1d electron-builder\'s own code could not be read: ' + ebMissing);
    else skip('1a-1d need app-builder-lib in node_modules to ask electron-builder itself', 4);
  } else if (!fs.existsSync(DIST)) skip('1a-1d need Electron\'s dist in node_modules to lay the app out as it ships', 4);
  else {
    real = await build('real', BUILDER_TEXT);
    const isMs = f => MICROSOFT.includes(path.basename(f));
    const unsigned = real.pe.filter(f => !isMs(f) && !real.signed.includes(f)), msHanded = real.signed.filter(isMs);
    const top = real.pe.filter(f => /^[^/]+\.dll$/i.test(f));
    check(!unsigned.length && !msHanded.length && real.signed.every(f => real.pe.includes(f)) && top.some(f => !isMs(f)) && top.some(isMs)
      && real.pe.includes(EXE) && real.reads === real.pe.length
      && fs.existsSync(path.join(real.app, 'resources', 'policy', 'etiuda.admx')) && ESCAPES.length === 0,
      '1a electron-builder, given the real electron-builder.js and a certificate, hands its signer ' + real.signed.length + ' of the ' + real.pe.length
      + ' PE files the gate\'s walk finds, each read once at the door (' + real.reads + '), ' + real.pe.filter(isMs).length
      + ' of them signed by their maker and to be kept from it, the policy template copied beside them, nothing escaping the seal ('
      + ESCAPES.length + '): signed ' + real.signed.join(', ') + (unsigned.length ? '; NOT HANDED: ' + unsigned.join(', ') : '')
      + (msHanded.length ? '; MICROSOFT\'S HANDED: ' + msHanded.join(', ') : ''));
    const bare = await build('no-cert', BUILDER_TEXT, { cert: false });
    check(bare.reads === 0 && J(bare.signed) === J(bare.pe) && ESCAPES.length === 0,
      '1b with no certificate configured the door asks Windows nothing (' + bare.reads + ' reading(s)) and passes every file on, as before: '
      + bare.signed.length + ' of ' + bare.pe.length);
    if (!PLANTS) skip('1c and 1d, plant:sign-exts and plant:sign-keep lifted (ETIUDA_PLANTS=off)', 2);
    else {
      const noExts = lift('sign-exts', ''), a = noExts && await build('no-exts', noExts);
      const la = a ? a.pe.filter(f => !isMs(f) && !a.signed.includes(f)) : null;
      check(!!la && J(la) === J(top.filter(f => !isMs(f))) && ESCAPES.length === 0,
        '1c with plant:sign-exts lifted, every unsigned DLL goes unsigned and the program is still signed: ' + J(la));
      const keepText = fs.readFileSync(path.join(ROOT, 'tools', 'sellable.mjs'), 'utf8');
      const keepLift = keepText.split('\n').map(l => l.includes('plant:sign-keep') ? '      if (false) { /* plant:sign-keep */' : l).join('\n');
      for (const f of ['test-service.cjs', 'esigner.cjs']) fs.copyFileSync(path.join(ROOT, 'tools', f), path.join(TMP, f));
      fs.writeFileSync(path.join(TMP, 'sellable-sign-keep.mjs'), keepLift);
      const pKeep = await import(pathToFileURL(path.join(TMP, 'sellable-sign-keep.mjs')).href);
      pKeep.signIo.read = atSignTime; pKeep.signIo.log = () => {};
      const k = await build('keep-lifted', BUILDER_TEXT, { door: stub => pKeep.keepMakersSignatures(stub) });
      check(keepLift !== keepText && k.signed.filter(isMs).length === k.pe.filter(isMs).length && k.pe.filter(isMs).length > 0,
        '1d with plant:sign-keep lifted, every DLL Microsoft signed goes to the signer: ' + J(k.signed.filter(isMs)));
    }
  }

  /* ---- 2. the gate reads every one back ---------------------------------------------------------------------- */
  /* The app above where it was built, else a smaller one of the same shape; then an installer beside it. */
  const app = real ? real.app : path.join(TMP, 'small', 'win-unpacked');
  if (!real) {
    for (const f of [EXE, 'ffmpeg.dll']) put(path.join(app, f), PE());
    put(path.join(app, 'resources', 'app.asar'), 'an archive, not code');
  }
  const setup = put(path.join(path.dirname(app), 'etiuda-studio-9.9.9-setup.exe'), PE());
  const program = path.join(app, EXE);
  put(path.join(app, 'resources', 'helper.bin'), PE());
  put(path.join(app, 'resources', 'addon', 'native.node'), PE());
  put(path.join(app, 'resources', 'notes.txt'), 'MZ is how this note begins, and it is not code');
  const CERT = { signtoolOptions: { certificateFile: 'C:/nowhere/etiuda.pfx' } };
  /* A reader that answers each file as `say` says, by its path inside the app, and records what it was asked. */
  const reader = (say, asked) => files => { asked.push(...files); return files.map(f => ({ file: f, subject: 'CN=Example Publisher', ...(say(rel(app, f)) || { status: 'Valid', timestamped: true }) })); };
  const run = (mod, opts) => { const asked = [], log = [];
    const v = mod.signatureVerdict({ setup, program, app, customer: true, win: {}, log: s => log.push(s), ...opts, read: reader(opts.say || (() => null), asked) });
    return { v, asked: asked.map(f => path.isAbsolute(f) && !rel(app, f).startsWith('..') ? rel(app, f) : path.basename(f)), log }; };
  const SELL = { signatureVerdict };
  const walk = peFiles(app).map(f => rel(app, f));
  const dll = walk.find(f => /^[^/]+\.dll$/i.test(f)) || 'ffmpeg.dll';
  const nested = 'resources/addon/native.node';

  const red = run(SELL, { say: f => f === dll ? { status: 'NotSigned', timestamped: false } : null });
  check(typeof red.v === 'string' && red.v === dll + ' reads Authenticode NotSigned, not Valid',
    '2a a customer build with one unsigned DLL among signed files is stopped naming it: ' + red.v);
  const deep = run(SELL, { say: f => f === nested ? { status: 'Valid', timestamped: false } : null });
  check(typeof deep.v === 'string' && deep.v === nested + ' is signed with no timestamp, so its signature dies with the certificate',
    '2b a nested library, signed with no timestamp, is named by its path inside the app: ' + deep.v);
  const green = run(SELL, {});
  const wantAsked = ['etiuda-studio-9.9.9-setup.exe'].concat(walk).sort();
  check(green.v === true && J(green.asked.slice().sort()) === J(wantAsked) && walk.includes('resources/helper.bin') && !walk.includes('resources/notes.txt')
    && !walk.includes('resources/app.asar'),
    '2c with every file Valid and timestamped it passes, having asked of the installer and the app\'s ' + walk.length + ' PE files and nothing'
    + ' else (a PE named helper.bin read, a note opening MZ and the archive not): ' + green.asked.length + ' asked');
  const preview = run(SELL, { customer: false, say: () => ({ status: 'NotSigned', timestamped: false }) });
  check(preview.v === true && preview.asked.length === 0 && preview.log.some(s => /the signature is not asked: a preview with no certificate/.test(s)),
    '2d a preview with no certificate is not asked, as every Studio preview was not, and its reader is never called');
  const withCert = run(SELL, { customer: false, win: CERT, say: f => f === dll ? { status: 'NotSigned', timestamped: false } : null });
  check(typeof withCert.v === 'string' && withCert.v.startsWith(dll + ' reads Authenticode NotSigned'),
    '2e a preview WITH a certificate configured and one DLL unsigned is stopped as a customer build is: ' + withCert.v);
  const lostOne = signatureVerdict({ setup, program, app, customer: true, win: {}, log: () => {},
    read: files => reader(() => null, [])(files.filter(f => !f.endsWith(dll))) });
  check(lostOne === dll + ' was not read, so its signature is not known',
    '2f a file the reader gave no answer for is refused, not passed: ' + lostOne);
  const gone = signatureVerdict({ setup, program, app: path.join(TMP, 'no-such'), customer: true, win: {}, read: () => [], log: () => {} });
  check(typeof gone === 'string' && /no-such is not there/.test(gone), '2g an app folder that is not there is a stop, not a pass: ' + gone);
  /* 2j, OURS IS NEVER A MAKER: a program read Valid under Microsoft, every file beside it Microsoft's too, made the
     makers' list everybody's publisher; it is refused, naming the maker. */
  const allMs = run(SELL, { say: () => ({ status: 'Valid', timestamped: true, subject: MS_SUBJECT }) });
  check(allMs.v === 'the program is signed by Microsoft Corporation, a maker, not by us',
    '2j a program read Valid under a maker\'s signature is refused, every file beside it a maker\'s too: ' + allMs.v);
  /* 2k, OURS IS THE ONE THE CONFIGURATION NAMES, where it names one: Artifact Signing's publisherName, a store certificate's
     subject or thumbprint, the eSigner account's certificate from the hook's own record; a .pfx names none. */
  const DIST2 = path.join(TMP, 'named-dist');
  put(path.join(DIST2, '.esigner', 'signings.jsonl'), JSON.stringify({ file: 'Etiuda.exe', ms: 1, status: 'Valid', thumbprint: 'ab'.repeat(20) }) + '\n');
  const names = [ourPublisher({ azureSignOptions: { publisherName: 'Example Publisher' } }), ourPublisher({ signtoolOptions: { certificateSubjectName: 'Example Publisher' } }),
    ourPublisher({ signtoolOptions: { certificateSha1: 'ab'.repeat(20) } }), ourPublisher({ signtoolOptions: { sign: () => {} } }, DIST2),
    ourPublisher({ signtoolOptions: { certificateFile: 'C:/nowhere/etiuda.pfx' } }, path.join(TMP, 'no-dist'))];
  const AB = { thumbprint: 'AB'.repeat(20) }, CD = { thumbprint: 'CD'.repeat(20) };
  const byName = run(SELL, { ours: names[0] }), notName = run(SELL, { ours: { subject: 'Another Publisher', what: 'Another Publisher (the configuration)' } });
  const byPrint = run(SELL, { ours: names[3], say: () => ({ status: 'Valid', timestamped: true, ...AB }) });
  const notPrint = run(SELL, { ours: names[3], say: () => ({ status: 'Valid', timestamped: true, ...CD }) });
  const fromWin = run(SELL, { win: { azureSignOptions: { endpoint: 'e', codeSigningAccountName: 'a', certificateProfileName: 'p', publisherName: 'Another Publisher' } } });
  check(names[0].subject === 'Example Publisher' && names[1].subject === 'Example Publisher' && J(names[2].thumbprints) === J(['AB'.repeat(20)])
    && J(names[3].thumbprints) === J(['AB'.repeat(20)]) && names[4] === null
    && byName.v === true && notName.v === 'the program is signed by CN=Example Publisher, not by Another Publisher (the configuration)'
    && byPrint.v === true && typeof notPrint.v === 'string' && /^the program is signed by CN=Example Publisher, not by the eSigner account's certificate ABAB/.test(notPrint.v)
    && typeof fromWin.v === 'string' && /not by Another Publisher \(Artifact Signing's publisherName\)/.test(fromWin.v),
    '2k where the configuration names our publisher (publisherName, a subject, a thumbprint, the eSigner record) the program is held to it, and a'
    + ' .pfx names none: ' + J([notName.v, notPrint.v, fromWin.v]));
  const VENDOR = 'CN=Example Vendor, O=Example Vendor Ltd, C=GB';
  const ms = run(SELL, { say: f => f === dll ? { status: 'Valid', timestamped: true, subject: MS_SUBJECT } : null });
  const stranger = run(SELL, { say: f => f === dll ? { status: 'Valid', timestamped: true, subject: VENDOR } : null });
  check(ms.v === true && MAKERS.some(m => m.organisation === 'Microsoft Corporation')
    && stranger.v === dll + ' is signed by Example Vendor Ltd, neither our publisher nor a maker on the list (Microsoft)',
    '2i a DLL Microsoft signed passes beside our files, and one Valid under a publisher not on the makers\' list is stopped naming it: ' + stranger.v);

  /* 2h, THE PLANTS: tools/sellable.mjs copied with each plant line put in another form and imported beside the modules
     it requires; each lets through the fault its leg above refuses. */
  if (!PLANTS) skip('2h, plant:sign-walk, plant:sign-unread, plant:sign-header, plant:sign-unsigned and plant:sign-publisher lifted (ETIUDA_PLANTS=off)', 1);
  else {
    const sellText = fs.readFileSync(path.join(ROOT, 'tools', 'sellable.mjs'), 'utf8');
    const PLANTED = path.join(TMP, 'planted');
    fs.mkdirSync(PLANTED, { recursive: true });
    for (const f of ['esigner.cjs', 'test-service.cjs']) fs.copyFileSync(path.join(ROOT, 'tools', f), path.join(PLANTED, f));
    const planted = async (marker, line) => {
      const t = sellText.split('\n').map(l => l.includes('plant:' + marker) ? line + ' /* plant:' + marker + ' */' : l).join('\n');
      if (t === sellText) return null;
      const at = path.join(PLANTED, 'sellable-' + marker + '.mjs');
      fs.writeFileSync(at, t);
      return import(pathToFileURL(at).href);
    };
    const pWalk = await planted('sign-walk', '  void 0;');
    const pUnread = await planted('sign-unread', '  const unread = [];');
    const pHeader = await planted('sign-header', '    return false;');
    const wRed = pWalk && run(pWalk, { say: f => f === dll ? { status: 'NotSigned', timestamped: false } : null });
    const uRed = pUnread && pUnread.signatureVerdict({ setup, program, app, customer: true, win: {}, log: () => {},
      read: files => reader(() => null, [])(files.filter(f => !f.endsWith(dll))) });
    const hAsked = pHeader && run(pHeader, {}).asked;
    const pUnsigned = await planted('sign-unsigned', "    if (r.status !== 'Valid') continue;");
    const pPublisher = await planted('sign-publisher', '  const foreign = []; void own;');
    const sRed = pUnsigned && run(pUnsigned, { say: f => f === dll ? { status: 'NotSigned', timestamped: false } : null });
    const vRed = pPublisher && run(pPublisher, { say: f => f === dll ? { status: 'Valid', timestamped: true, subject: 'CN=Example Vendor, O=Example Vendor Ltd' } : null });
    const pOwnMaker = await planted('sign-own-maker', '  const ownMaker = [];');
    const pOwnNamed = await planted('sign-own-named', '  const ownNamed = [];');
    const mRed = pOwnMaker && run(pOwnMaker, { say: () => ({ status: 'Valid', timestamped: true, subject: MS_SUBJECT }) });
    const nRed = pOwnNamed && run(pOwnNamed, { ours: { subject: 'Another Publisher', what: 'Another Publisher' } });
    check(!!wRed && wRed.v === true && !!pUnread && uRed === true && !!hAsked && !hAsked.includes('resources/helper.bin') && hAsked.includes(nested)
      && !!sRed && sRed.v === true && !!vRed && vRed.v === true && !!mRed && mRed.v === true && !!nRed && nRed.v === true,
      '2h with plant:sign-walk lifted the unsigned DLL passes (' + (wRed && wRed.v) + '), with plant:sign-unread lifted the unanswered file passes ('
      + uRed + '), with plant:sign-header lifted a PE under another name is not read, with plant:sign-unsigned lifted an unsigned DLL passes ('
      + (sRed && sRed.v) + '), with plant:sign-publisher lifted a stranger\'s DLL passes (' + (vRed && vRed.v) + '), with plant:sign-own-maker'
      + ' lifted a program Microsoft signed passes (' + (mRed && mRed.v) + '), and with plant:sign-own-named lifted a program not by the named publisher'
      + ' passes (' + (nRed && nRed.v) + ')');
  }

  /* ---- 3. the release asks the gate of the unpacked app --------------------------------------------------------- */
  const relText = fs.readFileSync(path.join(ROOT, 'tools', 'release.mjs'), 'utf8');
  check(/signatureVerdict\(\{ setup: judged\.setup, program: PACKAGED_EXE, app: join\(DIST, "win-unpacked"\),\r?\n\s+customer: SELL\.customer, win: builderWin, ours: ourPublisher\(builderWin, DIST\) \}/.test(relText),
    '3a tools/release.mjs gives the signature gate the unpacked app, win-unpacked, beside the installer and the program');
} catch (e) {
  failed++;
  console.log('  FAIL ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | '));
} finally {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* reported below */ }
  check(!fs.existsSync(TMP), '4a the temp folder is gone');
}

console.log('#counts checks=' + asserted + ' failed=' + failed + ' notRun=' + notRun.length + ' expected=' + EXPECTED);
if (asserted + notRun.length < EXPECTED) {
  console.log('SUITE DID NOT COMPLETE: ' + asserted + ' of ' + EXPECTED + ' checks ran');
  process.exit(78);
}
console.log(failed ? '  RESULT: FAIL ' + failed + ' of ' + asserted : '  RESULT: ok ' + asserted + ' check(s)');
process.exit(Math.min(failed, 63));
