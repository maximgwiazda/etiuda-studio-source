"""THE CONTROL FOR THE AGGREGATE VIEWS' LEGS (M2, spec 3.9). Four mutations, each the code as it
would be without one rule the views are built on, run against tests/stats-screen.mjs one at a
time and restored in a finally. A leg that stays green under its own mutation is a sentence, not
a gate.

    python tools/stats-control.py

TWO OF THE FOUR ARE THE POINT. The screen and the command line read ONE module, so a wrong
definition moves both doors together and the two-door legs go on passing: only the legs that
count the same figures a second time, from the files, inside the leg, can catch it. M1 and M2
are those wrong definitions, and what they redden - and what they do not - is the argument for
writing that arithmetic out rather than calling viewsOf twice.

Kept rather than thrown away, as tools/ring-control.py is: the next person to change viewsOf
runs this before believing the gate. It edits src/stats.mjs and ui/app.js in place and restores
both whatever happens, including on Ctrl-C, because the copies live in memory and the finally is
the only writer.

Expected, on the tree this was written against:

    M1 the age rule dropped                   5d, 5g
    M2 one desk's use is not a use            5d, 5f
    M3 the screen drops a column              5b
    M4 the screen says nothing of the desks   5h

Since board 891's C3 (2026-10-16) the leg reads live answers, sealed to the lead's box, and keeps
these leg names; M2 and M3 were moved to the code as it stands (periodUse and viewTable), and the
reds above have not been measured on it since. The leg opens a window, so this runs only with
ETIUDA_WINDOWS set to the day's date in its environment, as any window run does.
"""
import io, os, re, subprocess, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # the tree this script is in
STATS = os.path.join(ROOT, "src", "stats.mjs")
APP = os.path.join(ROOT, "ui", "app.js")


def read(p):
    return io.open(p, encoding="utf-8", newline="").read()


def write(p, s):
    io.open(p, "w", encoding="utf-8", newline="").write(s)


def one(text, a, b):
    assert text.count(a) == 1, "anchor matched %d times: %r" % (text.count(a), a[:60])
    return text.replace(a, b)


MUTATIONS = [
    ("M1 the age rule dropped: every unused card is rotting, however new", STATS,
     lambda s: one(s, "if (!win.from || !f || !f.date || f.date > win.from) { notJudged += 1; return; }",
                   "if (!win.from || !f || !f.date) { notJudged += 1; return; }")),
    ("M2 one desk's single use counted as no use: a silent desk votes", STATS,
     lambda s: one(s, "if (!id || ((c && c.n) | 0) <= 0) return;",
                   "if (!id || ((c && c.n) | 0) <= 1) return;")),
    ("M3 the screen drops the last column of a view's head", APP,
     lambda s: one(s, '+ b.head.map((h) => "<th>" + esc(headWord(h)) + "</th>").join("") + "</tr>"',
                   '+ b.head.slice(0, -1).map((h) => "<th>" + esc(headWord(h)) + "</th>").join("")'
                   ' + "</tr>"')),
    ("M4 the screen says nothing about how many desks answered", APP,
     lambda s: one(s, 'const knows = esc(T("Desks that answered:',
                   'const knows = "" && esc(T("Desks that answered:')),
]

LEG = re.compile(r"^\s+(ok|FAIL)\s+(\S+)", re.M)


def run():
    r = subprocess.run(["node", "tests/stats-screen.mjs"], cwd=ROOT,
                       capture_output=True, text=True)
    out = (r.stdout or "") + (r.stderr or "")
    legs = LEG.findall(out)
    red = [name for kind, name in legs if kind == "FAIL"]
    tally = [l for l in out.split("\n") if l.startswith("stats-screen")]
    return r.returncode, red, len(legs), (tally[0].strip() if tally else "NO TALLY LINE")


def main():
    keep = {STATS: read(STATS), APP: read(APP)}
    t0 = time.time()
    try:
        code, red, n, tally = run()
        print("baseline: exit %d, %d legs, %d red  |  %s" % (code, n, len(red), tally))
        assert code == 0 and not red, "the baseline is not green; fix that first"
        for name, path, mutate in MUTATIONS:
            write(path, mutate(keep[path]))
            code, red, n, tally = run()
            print("%-62s exit %d  red %d of %d: %s"
                  % (name, code, len(red), n, ", ".join(red) or "NOTHING"))
            write(path, keep[path])
    finally:
        for p, s in keep.items():
            write(p, s)
    print("restored in %.1f s" % (time.time() - t0))


main()
