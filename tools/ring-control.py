"""THE CONTROL FOR THE RING'S LEGS (board 605). Five mutations, each the code as it would be
without one rule the item names, run against tests/catalog-sig.mjs one at a time and restored in
a finally. A leg that stays green under its own mutation is a sentence, not a gate.

    python tools/ring-control.py

Kept rather than thrown away: the next person to change src/ring.mjs runs this before believing
the gate. It edits src/ring.mjs and src/publish.mjs in place and restores both whatever happens,
including on Ctrl-C, because the copies live in memory and the finally is the only writer.

It is a python script in a node tree for the reason tools/icons/build.py is: it rewrites a file
in place and restores it, and a language whose file handling reads the same forwards and
backwards is the one to do that in."""
import io, os, re, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # the tree this script is in
RING = os.path.join(ROOT, "src", "ring.mjs")
PUBLISH = os.path.join(ROOT, "src", "publish.mjs")


def read(p):
    return io.open(p, encoding="utf-8", newline="").read()


def write(p, s):
    io.open(p, "w", encoding="utf-8", newline="").write(s)


def one(text, a, b):
    assert text.count(a) == 1, "anchor matched %d times: %r" % (text.count(a), a[:60])
    return text.replace(a, b)


MUTATIONS = [
    ("M1 merging replaces rather than appends: a second key for a catalog takes the first out",
     RING,
     lambda s: one(s, "  keys.push(entry);",
                   "  doc.keys = keys.filter(e => !(e && String(e.catalog) === entry.catalog));\n"
                   "  doc.keys.push(entry);\n  const keysX = doc.keys; void keysX;")),
    ("M2 the entry is a bag rather than a binding: no catalog on it",
     RING,
     lambda s: one(s, '  const entry = { catalog: id, keyId: String(read.keyId),',
                   '  const entry = { keyId: String(read.keyId),')),
    ("M3 an unreadable ring is treated as no ring: the file is written over",
     RING,
     lambda s: one(s, '''    throw new Error("the ring at " + at + " is not JSON: " + e.message + "; it has not been"
      + " touched. Move it aside yourself if you mean to start again");''',
                   "    return null;")),
    ("M4 the key file's wrapped private half rides along in the entry",
     RING,
     lambda s: one(s, "  if (note != null && String(note).trim()) entry.note = String(note).trim();",
                   "  entry.private = String((read.doc || {}).private || '');\n"
                   "  if (note != null && String(note).trim()) entry.note = String(note).trim();")),
    ("M5 an unsigned publish writes a ring too, naming a key nothing carries",
     PUBLISH,
     lambda s: one(s, "  const ring = ringEntry ? addToRing(ringAt, ringEntry) : null;",
                   "  const ring = addToRing(ringAt, ringEntry || { catalog: catalog.id,\n"
                   "    keyId: 'studio-' + '0'.repeat(16), alg: 'Ed25519', public: 'c'.repeat(64) });")),
]

LEG = re.compile(r"^\s+(ok|FAIL)\s+(\S+)", re.M)


def run():
    r = subprocess.run([sys.executable and "node", "tests/catalog-sig.mjs"], cwd=ROOT,
                       capture_output=True, text=True)
    out = (r.stdout or "") + (r.returncode and (r.stderr or "") or (r.stderr or ""))
    legs = LEG.findall(out)
    red = [name for kind, name in legs if kind == "FAIL"]
    tally = [l for l in out.split("\n") if l.startswith("catalog-sig:")]
    return r.returncode, red, len(legs), (tally[0] if tally else "NO TALLY LINE")


def main():
    keep = {RING: read(RING), PUBLISH: read(PUBLISH)}
    t0 = time.time()
    try:
        code, red, n, tally = run()
        print("baseline: exit %d, %d legs, %d red  |  %s" % (code, n, len(red), tally))
        assert code == 0 and not red, "the baseline is not green; fix that first"
        for name, path, mutate in MUTATIONS:
            write(path, mutate(keep[path]))
            code, red, n, tally = run()
            print("%-78s exit %d  red %2d of %d: %s"
                  % (name, code, len(red), n, ", ".join(red) or "NOTHING"))
            write(path, keep[path])
    finally:
        for p, s in keep.items():
            write(p, s)
    print("restored in %.1f s" % (time.time() - t0))


main()
