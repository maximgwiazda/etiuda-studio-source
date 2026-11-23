/* A scratch copy for a plants phase. The copy holds a junction to the checkout's node_modules.
   dropPlantsTree removes that junction first, checks the checkout's node_modules still lists the
   same entries, and only then removes the copy. It never deletes through the junction. Where
   git ls-files fails because there is no repository, the copy is made by walking the tree. */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function moduleNames(dir) {
  try {
    return fs.readdirSync(dir).sort();
  } catch (e) {
    if (e && e.code === "ENOENT") return null;
    throw e;
  }
}

function sameNames(a, b) {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function linkGone(link) {
  try {
    fs.lstatSync(link);
    return false;
  } catch (e) {
    return !!(e && e.code === "ENOENT");
  }
}

/* Junction first. A recursive remove while the junction stands would follow it into the checkout. */
export function dropPlantsTree(copy, root) {
  if (!copy || !root) return;
  let copyStat;
  try {
    copyStat = fs.lstatSync(copy);
  } catch (e) {
    if (e && e.code === "ENOENT") return;
    process.stderr.write("dropPlantsTree: cannot stat " + copy + ": " + ((e && e.message) || e) + "; removed nothing\n");
    return;
  }
  if (!copyStat.isDirectory()) {
    process.stderr.write("dropPlantsTree: " + copy + " is not a directory; removed nothing\n");
    return;
  }
  const modules = path.join(root, "node_modules");
  let before;
  try {
    before = moduleNames(modules);
  } catch (e) {
    process.stderr.write("dropPlantsTree: cannot list " + modules + ": " + ((e && e.message) || e) + "; removed nothing\n");
    return;
  }
  const link = path.join(copy, "node_modules");
  let linkStat = null;
  try {
    linkStat = fs.lstatSync(link);
  } catch (e) {
    if (!(e && e.code === "ENOENT")) {
      process.stderr.write("dropPlantsTree: cannot stat " + link + ": " + ((e && e.message) || e) + "; removed nothing\n");
      return;
    }
  }
  if (linkStat) {
    let gone = false;
    const tried = [];
    try {
      fs.unlinkSync(link);
      gone = linkGone(link);
    } catch (e) {
      tried.push("unlink " + ((e && e.code) || e));
    }
    if (!gone) {
      try {
        fs.rmdirSync(link);
        gone = linkGone(link);
      } catch (e) {
        tried.push("rmdir " + ((e && e.code) || e));
      }
    }
    if (!gone) {
      process.stderr.write("dropPlantsTree: could not remove the junction " + link
        + (tried.length ? " (" + tried.join("; ") + ")" : "") + "; removed nothing\n");
      return;
    }
    let after;
    try {
      after = moduleNames(modules);
    } catch (e) {
      process.stderr.write("dropPlantsTree: cannot list " + modules + " after removing the junction: "
        + ((e && e.message) || e) + "; removed nothing further\n");
      return;
    }
    if (!sameNames(before, after)) {
      process.stderr.write("dropPlantsTree: " + modules + " changed while the junction was removed; removed nothing further\n");
      return;
    }
  }
  try {
    fs.rmSync(copy, { recursive: true, force: true });
  } catch (e) {
    process.stderr.write("dropPlantsTree: could not remove " + copy + ": " + ((e && e.message) || e) + "\n");
  }
}

function walkCopy(root, copy) {
  function walk(curr, rel) {
    for (const ent of fs.readdirSync(curr, { withFileTypes: true })) {
      /* A junction is a symbolic link here. Following one would copy the checkout's modules. */
      if (ent.isSymbolicLink()) continue;
      const relPath = rel ? rel + "/" + ent.name : ent.name;
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === "scratch" || ent.name.startsWith(".")) continue;
        walk(path.join(curr, ent.name), relPath);
        continue;
      }
      if (!ent.isFile()) continue;
      const to = path.join(copy, relPath);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(path.join(curr, ent.name), to);
    }
  }
  walk(root, "");
}

function noRepository(listed) {
  if (!listed || listed.status === 0) return false;
  const err = String((listed.stderr) || "") + String((listed.error) || "");
  return /not a git repository/i.test(err);
}

export function plantsTree(root, label, base = os.tmpdir()) {
  const copy = fs.mkdtempSync(path.join(base, label + "-plants-"));
  try {
    const listed = spawnSync("git", ["ls-files", "-z"], { cwd: root });
    if (noRepository(listed)) {
      walkCopy(root, copy);
    } else if (!listed.stdout || listed.status !== 0) {
      throw new Error("git ls-files failed in " + root + ": " + String(listed.stderr || listed.error || ""));
    } else {
      const names = String(listed.stdout).split("\0").filter((rel) => rel.length > 0);
      for (const rel of names) {
        const from = path.join(root, rel);
        const to = path.join(copy, rel);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(from, to);
      }
    }
    const pinnedTo = path.join(copy, "engine", "pinned");
    fs.mkdirSync(path.dirname(pinnedTo), { recursive: true });
    fs.cpSync(path.join(root, "engine", "pinned"), pinnedTo, { recursive: true });
    const nm = path.join(root, "node_modules");
    if (fs.existsSync(nm)) fs.symlinkSync(nm, path.join(copy, "node_modules"), "junction");
    return copy;
  } catch (err) {
    dropPlantsTree(copy, root);
    throw err;
  }
}

export function treeSha(root) {
  const h = crypto.createHash("sha256");
  const files = [];
  for (const dir of ["src", "shell", "ui"]) {
    const dpath = path.join(root, dir);
    if (!fs.existsSync(dpath)) continue;
    function walk(curr, rel) {
      const entries = fs.readdirSync(curr, { withFileTypes: true });
      for (const ent of entries) {
        const entPath = path.join(curr, ent.name);
        const relPath = path.join(rel, ent.name).replace(/\\/g, "/");
        if (ent.isDirectory()) walk(entPath, relPath);
        else if (ent.isFile()) files.push({ relPath, fullPath: entPath });
      }
    }
    walk(dpath, dir);
  }
  files.sort((a, b) => a.relPath.localeCompare(b.relPath));
  for (const f of files) {
    h.update(f.relPath + "\0");
    h.update(fs.readFileSync(f.fullPath));
  }
  return h.digest("hex");
}
