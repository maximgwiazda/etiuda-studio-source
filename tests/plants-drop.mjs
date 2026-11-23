/* The plants copy is removed when the phase ends, and a tree with no repository is still copied.
 *
 *     node tests/plants-drop.mjs
 *
 * Four legs. pd1: after the phase, no folder for that label remains in the temporary folder,
 * and the checkout's node_modules listing is the same. pd2: a copy made without .git still
 * comes back with src/, shell/ and ui/ at the same sha256. pd3: a failure after mkdtemp
 * leaves no folder. pd4: a foreign plants-drop- folder in the temporary folder leaves pd1
 * and pd3 green. Each plant breaks one line of tests/plants-tree.mjs in the copy.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { plantsTree, dropPlantsTree, treeSha } from "./plants-tree.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.PLANTS_DROP_ONLY || "";
const PARENT = process.env.PLANTS_DROP_PARENT || fs.mkdtempSync(path.join(os.tmpdir(), "plants-drop-run-"));

let tree = null;

const SAY = {
  pd1: "no plants copy remains in the temporary folder and the checkout node_modules listing is unchanged",
  pd2: "a history-less copy still yields src/, shell/ and ui/ with the same sha256",
  pd3: "a failure after mkdtemp leaves no plants folder",
  pd4: "a foreign plants-drop- folder in the temporary folder leaves pd1 and pd3 green",
};

const PLANTS = [
  ["pd1", "tests/plants-tree.mjs", "fs.rmSync(copy, { recursive: true, force: true });", "void copy;"],
  ["pd2", "tests/plants-tree.mjs", "walkCopy(root, copy);", "void root;"],
  ["pd3", "tests/plants-tree.mjs", "dropPlantsTree(copy, root);", "void copy;"],
];

function labelled(prefix) {
  return fs.readdirSync(PARENT).filter((name) => name.startsWith(prefix)).sort();
}

function moduleNames(root) {
  const dir = path.join(root, "node_modules");
  try { return fs.readdirSync(dir).sort(); }
  catch (e) {
    if (e && e.code === "ENOENT") return [];
    throw e;
  }
}

function withCeiling(dir, fn) {
  const ceiling = process.env.GIT_CEILING_DIRECTORIES;
  process.env.GIT_CEILING_DIRECTORIES = dir;
  try { return fn(); }
  finally {
    if (ceiling === undefined) delete process.env.GIT_CEILING_DIRECTORIES;
    else process.env.GIT_CEILING_DIRECTORIES = ceiling;
  }
}

/* A history-less export: the tree, without .git, and without the modules junction or scratch. */
function copyWithoutGit(from, to) {
  fs.cpSync(from, to, {
    recursive: true,
    filter(src) {
      if (src === from) return true;
      const base = path.basename(src);
      if (base === ".git" || base === "node_modules" || base === "scratch") return false;
      if (base.startsWith(".")) {
        try { if (fs.lstatSync(src).isDirectory()) return false; }
        catch { return false; }
      }
      return true;
    },
  });
}

function checkPd1() {
  const prefix = "plants-drop-left-plants-";
  const beforeDirs = labelled(prefix);
  const beforeNm = moduleNames(ROOT);
  let copy = null;
  try {
    copy = plantsTree(ROOT, "plants-drop-left", PARENT);
  } finally {
    dropPlantsTree(copy, ROOT);
  }
  const afterDirs = labelled(prefix);
  const afterNm = moduleNames(ROOT);
  return beforeDirs.join("\n") === afterDirs.join("\n")
    && afterDirs.length === 0
    && beforeNm.join("\n") === afterNm.join("\n")
    && beforeNm.length > 0;
}

function checkPd2() {
  const scratch = fs.mkdtempSync(path.join(PARENT, "plants-drop-src-"));
  let copy = null;
  let ok = false;
  try {
    copyWithoutGit(ROOT, scratch);
    ok = withCeiling(scratch, () => {
      const want = treeSha(scratch);
      copy = plantsTree(scratch, "plants-drop-walk", PARENT);
      const got = treeSha(copy);
      const has = ["src", "shell", "ui"].every((dir) => fs.existsSync(path.join(copy, dir)));
      return has && got === want && want.length === 64;
    });
  } catch (e) {
    console.error(e && e.stack || e);
    ok = false;
  } finally {
    dropPlantsTree(copy, ROOT);
    dropPlantsTree(scratch, ROOT);
  }
  return ok;
}

function checkPd3() {
  const prefix = "plants-drop-fail-plants-";
  const before = labelled(prefix);
  const empty = fs.mkdtempSync(path.join(PARENT, "plants-drop-empty-"));
  let threw = false;
  try {
    withCeiling(empty, () => {
      try { plantsTree(empty, "plants-drop-fail", PARENT); }
      catch { threw = true; }
    });
  } finally {
    dropPlantsTree(empty, ROOT);
  }
  const after = labelled(prefix);
  return threw && before.join("\n") === after.join("\n") && after.length === 0;
}

function checkPd4() {
  const foreign = fs.mkdtempSync(path.join(os.tmpdir(), "plants-drop-foreign-"));
  const foreignLeft = fs.mkdtempSync(path.join(os.tmpdir(), "plants-drop-left-plants-foreign-"));
  const foreignFail = fs.mkdtempSync(path.join(os.tmpdir(), "plants-drop-fail-plants-foreign-"));
  const decoy = path.join(os.tmpdir(), "plants-drop-src-decoy");
  fs.mkdirSync(decoy, { recursive: true });
  let pd1Ok = false;
  let pd3Ok = false;
  let decoyUntouched = false;
  try {
    pd1Ok = checkPd1();
    pd3Ok = checkPd3();
    decoyUntouched = fs.existsSync(decoy);
  } finally {
    try { fs.rmSync(decoy, { recursive: true, force: true }); } catch {}
    dropPlantsTree(foreign, ROOT);
    dropPlantsTree(foreignLeft, ROOT);
    dropPlantsTree(foreignFail, ROOT);
  }
  return pd1Ok && pd3Ok && decoyUntouched;
}

const CHECKS = { pd1: checkPd1, pd2: checkPd2, pd3: checkPd3, pd4: checkPd4 };

function plantOnce(id, rel, from, to) {
  const file = path.join(tree, rel);
  const was = fs.readFileSync(file);
  const text = was.toString("utf8");
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(id + " plant matches " + n + " in " + rel);
  const childParent = fs.mkdtempSync(path.join(PARENT, "plant-" + id + "-"));
  let child = null;
  try {
    fs.writeFileSync(file, text.replace(from, to), "utf8");
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
      cwd: tree,
      env: Object.assign({}, process.env, {
        PLANTS_DROP_ONLY: id,
        PLANTS_DROP_PARENT: childParent,
        TMPDIR: childParent,
        TEMP: childParent,
        TMP: childParent,
      }),
      encoding: "utf8",
      timeout: 180000,
    });
  } finally {
    fs.writeFileSync(file, was);
    if (!was.equals(fs.readFileSync(file))) throw new Error(id + " restore mismatch in " + rel);
    dropPlantsTree(childParent, ROOT);
  }
  const out = String((child && child.stdout) || "");
  const red = !!(child && child.status === 1 && out.includes("PLANT-RED"));
  const failLine = out.split(/\r?\n/).find((line) => line.startsWith("FAIL "));
  if (!red) {
    console.error(id + " plant in " + rel + " did not bite status=" + (child && child.status));
    console.error(out + String((child && child.stderr) || ""));
  }
  return { red, failLine: failLine || "" };
}

async function main() {
  const before = treeSha(ROOT);
  let red = 0;
  let held = false;
  try {
    tree = plantsTree(ROOT, "plants-drop", PARENT);
    fs.copyFileSync(SELF, path.join(tree, path.relative(ROOT, SELF)));
    for (const [id, rel, from, to] of PLANTS) {
      const planted = plantOnce(id, rel, from, to);
      console.log((planted.red ? "plant " : "PLANT FAIL ") + id + " " + rel + (planted.red ? " red" : "")
        + (planted.failLine ? " | " + planted.failLine : ""));
      if (planted.red) red++;
    }
    held = treeSha(ROOT) === before;
    console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
  } finally {
    dropPlantsTree(tree, ROOT);
  }
  let n = 0;
  for (const id of Object.keys(CHECKS)) {
    let ok = false;
    try { ok = CHECKS[id](); }
    catch (e) { console.error(id + " " + (e && e.stack || e)); ok = false; }
    console.log((ok ? "ok   " : "FAIL ") + id + " " + SAY[id]);
    if (ok) n++;
  }
  const all = Object.keys(CHECKS).length + 1;
  const passed = n + (held ? 1 : 0);
  console.log("#counts checks=" + all + " failed=" + (all - passed) + " plants=" + PLANTS.length + " red=" + red);
  console.log("plants-drop " + passed + "/" + all + ", plants " + red + "/" + PLANTS.length + " red");
  dropPlantsTree(PARENT, ROOT);
  process.exit(passed === all && red === PLANTS.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  Promise.resolve().then(fn).catch((e) => { console.error(e && e.stack || e); return false; }).then((ok) => {
    if (!ok) console.log("FAIL " + (SAY[ONLY] || ONLY));
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    if (!process.env.PLANTS_DROP_PARENT) {
      try { dropPlantsTree(PARENT, ROOT); } catch {}
    }
    process.exit(ok ? 0 : 1);
  });
} else {
  main().catch((e) => {
    console.error(e && e.stack || e);
    try { dropPlantsTree(tree, ROOT); } catch { /* the verdict is the error above */ }
    try { dropPlantsTree(PARENT, ROOT); } catch {}
    process.exit(1);
  });
}
