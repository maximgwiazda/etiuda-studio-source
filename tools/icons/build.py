"""Builds the icon set: one SVG per icon, index.md and sheet.html, in this folder.
Run: python build.py   (no network, no browser, writes only beside itself)."""
import math, os, re, sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
NS = "http://www.w3.org/2000/svg"
STROKE = ('fill="none" stroke="currentColor" stroke-width="1.75" '
          'stroke-linecap="round" stroke-linejoin="round"')

def P(d): return '<path d="%s"/>' % d
def R(x, y, w, h): return '<rect x="%s" y="%s" width="%s" height="%s" rx="2"/>' % (x, y, w, h)
def C(cx, cy, r): return '<circle cx="%s" cy="%s" r="%s"/>' % (cx, cy, r)
def DOT(cx, cy, r): return '<circle cx="%s" cy="%s" r="%s" fill="currentColor" stroke="none"/>' % (cx, cy, r)
def FILL(d): return '<path d="%s" fill="currentColor" stroke="none"/>' % d

def f(v): return ("%.2f" % v).rstrip("0").rstrip(".")

def gear(n=8, ro=8.5, ri=6.25, cx=12.5, cy=12.5):
    pts = []
    step = 2 * math.pi / n
    wt = step / 2 * 0.55
    wo = wt * 0.62
    for i in range(n):
        a = i * step - math.pi / 2
        for ang, r in ((a - wt, ri), (a - wo, ro), (a + wo, ro), (a + wt, ri)):
            pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return "M" + "L".join(f(x) + " " + f(y) for x, y in pts) + "z"

def star(cx=12.5, cy=12.5, ro=8.5, ri=3.8):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        r = ro if i % 2 == 0 else ri
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return "M" + "L".join(f(x) + " " + f(y) for x, y in pts) + "z"

# Shared pieces.
FOLDER = "M4.5 18.5v-11a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2z"
FILE = "M14.5 4.5h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9zM14.5 4.5v5h5"
BOX = "M8.5 8.5h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2"
TRAY = "M4.5 15.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
LINES = "M4.5 6.5h16M4.5 11.5h6M4.5 16.5h6"
LID = R(4.5, 4.5, 16, 5)
BIN = "M6.5 9.5v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9"
COPYBACK = "M8.5 8.5v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"
CIRCLE = C(12.5, 12.5, 8)

# name: (group, use, compromise, mode, [elements])   mode: stroke | fill
ICONS = [
 # Chrome
 ("menu", "Chrome", "opens the band's menu", "", "s", [P("M4.5 7.5h16M4.5 12.5h16M4.5 17.5h16")]),
 ("settings", "Chrome", "opens Settings", "eight teeth; a gear thins at 16 px", "s", [P(gear()), C(12.5, 12.5, 2.75)]),
 ("home", "Chrome", "the home tab (Overview, Library or Team)", "a house; none of its three places' glyphs, so the tab names its kind", "s", [P("M5 11.5L12.5 5l7.5 6.5"), P("M7 10v8.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V10"), P("M11 19.5v-4.5h3v4.5")]),
 ("maintenance", "Chrome", "the Maintenance tab", "a wrench, so it stops sharing Settings' gear", "s", [P("M12.57 13.8A5.5 5.5 0 0 0 20.05 6.32L18.08 8.29L15.96 6.17L17.93 4.2A5.5 5.5 0 0 0 10.45 11.68L4.94 17.19A1.5 1.5 0 0 0 7.06 19.31Z")]),
 ("search", "Chrome", "the search field", "", "s", [C(11, 11, 6.5), P("M15.6 15.6L20.5 20.5")]),
 ("close", "Chrome", "closes a cover, tab or window", "", "s", [P("M6.5 6.5l12 12M18.5 6.5l-12 12")]),
 ("back", "Chrome", "goes back a step", "", "s", [P("M20.5 12.5h-16M10.5 6.5l-6 6 6 6")]),
 ("forward", "Chrome", "goes forward a step", "", "s", [P("M4.5 12.5h16M14.5 6.5l6 6-6 6")]),
 ("chevron-up", "Chrome", "folds a section", "", "s", [P("M6.5 15.5l6-6 6 6")]),
 ("chevron-down", "Chrome", "unfolds a section, opens a select", "", "s", [P("M6.5 9.5l6 6 6-6")]),
 ("chevron-left", "Chrome", "previous page or pane", "", "s", [P("M15.5 6.5l-6 6 6 6")]),
 ("chevron-right", "Chrome", "next page or pane", "", "s", [P("M9.5 6.5l6 6-6 6")]),
 ("more", "Chrome", "the overflow menu of a row", "solid dots", "s", [DOT(6.5, 12.5, 1.5), DOT(12.5, 12.5, 1.5), DOT(18.5, 12.5, 1.5)]),
 ("expand", "Chrome", "grows a pane to fill the window", "", "s", [P("M14.5 4.5h6v6M20.5 4.5l-6 6M10.5 20.5h-6v-6M4.5 20.5l6-6")]),
 ("collapse", "Chrome", "shrinks a pane back", "", "s", [P("M14.5 4.5v6h6M14.5 10.5l6-6M10.5 20.5v-6h-6M10.5 14.5l-6 6")]),
 ("drag-handle", "Chrome", "grip for reordering a row", "solid dots", "s", [DOT(9.5, 6.5, 1.25), DOT(15.5, 6.5, 1.25), DOT(9.5, 12.5, 1.25), DOT(15.5, 12.5, 1.25), DOT(9.5, 18.5, 1.25), DOT(15.5, 18.5, 1.25)]),
 ("external-link", "Chrome", "opens outside the app", "", "s", [P("M10.5 6.5h-4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14.5 4.5h6v6M20.5 4.5l-8 8")]),
 ("help", "Chrome", "opens help", "", "s", [CIRCLE, P("M9.75 10a2.75 2.75 0 1 1 3.85 2.5c-.75.35-1.1.9-1.1 1.7v.3M12.5 17.5h.01")]),
 ("info", "Chrome", "a neutral notice", "", "s", [CIRCLE, P("M12.5 11.5v5M12.5 8.5h.01")]),
 ("warning", "Chrome", "a notice that needs care", "", "s", [P("M12.5 4.5l8 15h-16zM12.5 10.5v3.5M12.5 17h.01")]),
 ("error", "Chrome", "a notice that something failed", "", "s", [CIRCLE, P("M9.5 9.5l6 6M15.5 9.5l-6 6")]),
 ("success", "Chrome", "a notice that something landed", "", "s", [CIRCLE, P("M8.5 12.75l2.75 2.75L16.5 10.25")]),
 ("loading", "Chrome", "spinner while work runs", "three quarters of a ring; the app spins it", "s", [P("M12.5 4.5a8 8 0 1 1-8 8")]),
 # Theme
 ("theme-light", "Theme", "switch to the light theme", "", "s", [C(12.5, 12.5, 3.25), P("M12.5 4v2M12.5 19v2M4 12.5h2M19 12.5h2M6.49 6.49l1.41 1.41M17.1 17.1l1.41 1.41M6.49 18.51l1.41-1.41M17.1 7.9l1.41-1.41")]),
 ("theme-dark", "Theme", "switch to the dark theme", "", "s", [P("M12.5 4.5a5.6 5.6 0 0 0 8 8 8 8 0 1 1-8-8z")]),
 ("theme-system", "Theme", "follow the system theme, Settings only", "a half-filled disc rather than sun and moon in one", "s", [FILL("M12.5 4.5a8 8 0 0 0 0 16z"), CIRCLE]),
 # Project
 ("new-project", "Project", "New project", "", "s", [P(FOLDER), P("M12.5 10.5v6M9.5 13.5h6")]),
 ("open-project", "Project", "Open a folder", "flap corners are stroke joins, not the set's radius", "s", [P("M4.5 18.5v-11a2 2 0 0 1 2-2h4l2 2h5a2 2 0 0 1 2 2v3"), P("M4.5 18.5l2.5-6h13.5l-2.5 6z")]),
 ("rename", "Project", "rename a project, tab or tag", "a text cursor; no pencil, that is edit", "s", [P("M15.5 4.5h-1a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1M9.5 4.5h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-1")]),
 ("delete", "Project", "Delete, Delete card", "", "s", [P("M4.5 7.5h16M9.5 7.5v-1.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v1.5M6.5 7.5l.8 11.3a2 2 0 0 0 2 1.7h6.4a2 2 0 0 0 2-1.7l.8-11.3M10.5 11.5v5M14.5 11.5v5")]),
 ("folder", "Project", "a folder on disk", "", "s", [P(FOLDER)]),
 ("file", "Project", "a file on disk", "", "s", [P(FILE)]),
 ("catalog", "Project", "the catalog itself", "a closed book", "s", [P("M5.5 18.5v-12a2 2 0 0 1 2-2h12v16h-12a2 2 0 0 1 0-4h12")]),
 ("archive", "Project", "the Archive, Put away", "", "s", [LID, P(BIN), P("M10.5 13.5h4")]),
 ("restore", "Project", "bring an edition or project back", "", "s", [LID, P(BIN), P("M12.5 18.5v-6M9.5 15.5l3-3 3 3")]),
 ("history", "Project", "revisions over time", "", "s", [P("M4.5 12.5a8 8 0 1 0 8-8c-2.4 0-4.6 1-6.2 2.7L4.5 9M4.5 4.5v4.5h4.5M12.5 8.5v4l2.5 1.5")]),
 # Authoring
 ("cards", "Authoring", "the Cards section", "", "s", [R(4.5, 9.5, 14, 11), P("M7.5 6.5h11a2 2 0 0 1 2 2v9")]),
 ("card", "Authoring", "one reply card", "", "s", [R(4.5, 6.5, 16, 12), P("M8.5 10.5h5M8.5 14.5h8")]),
 ("intents", "Authoring", "the Intents section", "", "s", [P("M4.5 10.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5l-3 3v-3a2 2 0 0 1-2-2zM9.5 8.5v-2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2")]),
 ("intent", "Authoring", "one intent clause", "", "s", [P("M4.5 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-4 4v-4a2 2 0 0 1-2-2z")]),
 ("facts", "Authoring", "Quick facts", "a bulleted list", "s", [P("M5.5 7.5h.01M5.5 12.5h.01M5.5 17.5h.01M9.5 7.5h11M9.5 12.5h11M9.5 17.5h11")]),
 ("tags", "Authoring", "tags of any kind", "", "s", [P("M4.5 4.5h7l9 9-5 5-11-11zM8.5 8.5h.01")]),
 ("categories", "Authoring", "the Categories section", "two items on a shelf", "s", [P("M4.5 18.5h16M6.5 18.5v-7a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v7M13.5 18.5v-11a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v11")]),
 ("edit", "Authoring", "edit a card or tag", "", "s", [P("M4.5 20.5l4-1 11-11-3-3-11 11zM13.5 8.5l3 3")]),
 ("copy", "Authoring", "copy to the clipboard", "", "s", [R(4.5, 8.5, 12, 12), P(COPYBACK)]),
 ("paste", "Authoring", "paste from the clipboard", "", "s", [R(5.5, 6.5, 14, 14), P("M9.5 8.5v-2.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v2.5z")]),
 ("cut", "Authoring", "cut to the clipboard", "", "s", [C(7.5, 7.5, 3), C(7.5, 17.5, 3), P("M20.5 4.5L9.6 15.4M20.5 20.5l-6-6M9.6 9.6l2.9 2.9")]),
 ("undo", "Authoring", "undo the last edit", "", "s", [P("M9.5 15.5l-5-5 5-5M4.5 10.5h10a5 5 0 0 1 0 10h-4")]),
 ("redo", "Authoring", "redo an undone edit", "", "s", [P("M15.5 15.5l5-5-5-5M20.5 10.5h-10a5 5 0 0 0 0 10h4")]),
 ("duplicate", "Authoring", "Duplicate a card", "", "s", [R(4.5, 8.5, 12, 12), P(COPYBACK), P("M10.5 11.5v6M7.5 14.5h6")]),
 ("move-up", "Authoring", "move a row up", "", "s", [P("M12.5 20.5v-16M6.5 10.5l6-6 6 6")]),
 ("move-down", "Authoring", "move a row down", "", "s", [P("M12.5 4.5v16M6.5 14.5l6 6 6-6")]),
 ("add", "Authoring", "New card, intent, category", "", "s", [P("M12.5 5.5v14M5.5 12.5h14")]),
 ("remove", "Authoring", "take one item out of a list", "", "s", [P("M5.5 12.5h14")]),
 ("filter", "Authoring", "narrow a list", "", "s", [P("M4.5 5.5h16l-6 7v6l-4 2v-8z")]),
 ("sort", "Authoring", "change a list's order", "", "s", [P("M8.5 20.5v-16M4.5 8.5l4-4 4 4M16.5 4.5v16M12.5 16.5l4 4 4-4")]),
 ("pin", "Authoring", "keep a card at the top", "", "s", [P("M9.5 4.5h6v5l3 3v4h-12v-4l3-3zM12.5 16.5v4")]),
 ("favourite", "Authoring", "mark a card as a favourite", "solid", "f", [FILL(star())]),
 ("language-en", "Authoring", "the English column or toggle", "letters drawn as strokes, not text", "s", [P("M10.5 6.5h-6v12h6M4.5 12.5h5M13.5 18.5v-12l7 12v-12")]),
 ("language-pl", "Authoring", "the Polish column or toggle", "letters drawn as strokes, not text", "s", [P("M5.5 18.5v-12h4a3 3 0 0 1 0 6h-4M14.5 6.5v12h6")]),
 ("translate", "Authoring", "write the other language", "an A with two arrows", "s", [P("M4.5 19.5l4-10 4 10M6 15.5h5M14.5 8.5h6M18.5 6.5l2 2-2 2M20.5 15.5h-6M16.5 13.5l-2 2 2 2")]),
 ("placeholder", "Authoring", "a {slot} in a body", "braces round a dot", "s", [P("M9.5 4.5a2.5 2.5 0 0 0-2.5 2.5v3a2.5 2.5 0 0 1-2.5 2.5 2.5 2.5 0 0 1 2.5 2.5v3a2.5 2.5 0 0 0 2.5 2.5M15.5 4.5a2.5 2.5 0 0 1 2.5 2.5v3a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5v3a2.5 2.5 0 0 1-2.5 2.5M12.5 12.5h.01")]),
 ("alternative", "Authoring", "one of several wordings", "a fork", "s", [P("M4.5 12.5h4c3 0 3-5 6-5h6M8.5 12.5c3 0 3 5 6 5h6")]),
 ("note", "Authoring", "a note on a card or edition", "", "s", [P("M4.5 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8l-6 6h-8a2 2 0 0 1-2-2zM20.5 14.5h-4a2 2 0 0 0-2 2v4")]),
 # Import and review
 ("import", "Import and review", "Import a file, Import catalog", "", "s", [P(BOX), P("M12.5 4.5v10M8.5 10.5l4 4 4-4")]),
 ("export", "Import and review", "Export an edition", "", "s", [P(BOX), P("M12.5 14.5v-10M8.5 8.5l4-4 4 4")]),
 ("csv", "Import and review", "a CSV file", "a table, no letters", "s", [R(4.5, 4.5, 16, 16), P("M4.5 9.5h16M10.5 9.5v11")]),
 ("review", "Import and review", "review a proposal", "", "s", [P("M4.5 12.5c2-4 5-6 8-6s6 2 8 6c-2 4-5 6-8 6s-6-2-8-6z"), C(12.5, 12.5, 2.5)]),
 ("proposal", "Import and review", "a file an agent dropped in", "a page with an arrow entering", "s", [P("M15.5 4.5h-5a2 2 0 0 0-2 2v2M8.5 16.5v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9zM15.5 4.5v5h5M4.5 12.5h8M10.5 10.5l2 2-2 2")]),
 ("accept", "Import and review", "Accept a change", "", "s", [P("M4.5 13.5l5 5 11-11")]),
 ("reject", "Import and review", "Reject a change", "a barred circle, since close owns the cross", "s", [CIRCLE, P("M6.84 6.84l11.32 11.32")]),
 ("diff", "Import and review", "What changes, was and becomes", "", "s", [P("M12.5 4.5v8M8.5 8.5h8M8.5 17.5h8")]),
 ("merge", "Import and review", "Land the accepted changes", "", "s", [C(6.5, 6.5, 2.5), C(18.5, 17.5, 2.5), P("M6.5 20.5v-11a8 8 0 0 0 8 8h1.5")]),
 ("awaiting", "Import and review", "second language not yet written", "an empty card with an ellipsis", "s", [R(4.5, 6.5, 16, 12), P("M8.5 12.5h.01M12.5 12.5h.01M16.5 12.5h.01")]),
 ("lint", "Import and review", "the Lint section", "", "s", [P(LINES), P("M12.5 15.5l3 3 5-5")]),
 ("lint-warning", "Import and review", "a lint warning row", "", "s", [P(LINES), P("M16.5 10l4 7.5h-8zM16.5 13v2")]),
 ("lint-error", "Import and review", "a lint error row", "", "s", [P(LINES), C(16.5, 15.5, 4.5), P("M14.5 13.5l4 4M18.5 13.5l-4 4")]),
 # Publish and channel
 ("publish", "Publish and channel", "Publish rev N", "", "s", [P("M20.5 4.5L4.5 11.5l7 2.5 2.5 7zM20.5 4.5L11.5 14")]),
 ("edition", "Publish and channel", "one published edition", "a page with a bookmark", "s", [R(5.5, 4.5, 14, 16), P("M9.5 4.5v7l2.5-2 2.5 2v-7")]),
 ("desk", "Publish and channel", "one desk that reads the share", "", "s", [R(4.5, 5.5, 16, 10), P("M12.5 15.5v4M8.5 19.5h8")]),
 ("desks", "Publish and channel", "the desks together", "", "s", [R(4.5, 8.5, 12, 8), P("M10.5 16.5v4M7.5 20.5h6M8.5 8.5v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2")]),
 ("statistics", "Publish and channel", "the Statistics section", "", "s", [P("M4.5 4.5v16h16M9.5 16.5v-4M13.5 16.5v-8M17.5 16.5v-6")]),
 ("request", "Publish and channel", "Ask for statistics", "an envelope", "s", [R(4.5, 6.5, 16, 12), P("M4.5 8.5l8 5.5 8-5.5")]),
 ("sync", "Publish and channel", "two-way sync with the share", "", "s", [P("M4.5 12.5a8 8 0 0 1 8-8c2.6 0 5 1 6.8 2.8L20.5 9M20.5 4.5v4.5h-4.5M20.5 12.5a8 8 0 0 1-8 8c-2.6 0-5-1-6.8-2.8L4.5 16M4.5 20.5v-4.5h4.5")]),
 ("refresh", "Publish and channel", "read the folder again", "", "s", [P("M20.5 12.5a8 8 0 1 1-2.3-5.7L20.5 9M20.5 4.5v4.5h-4.5")]),
 ("period", "Publish and channel", "the span a count covers", "no arrow heads, too small at 16 px", "s", [P("M4.5 6.5v12M20.5 6.5v12M4.5 12.5h16")]),
 ("calendar", "Publish and channel", "a date", "", "s", [R(4.5, 6.5, 16, 14), P("M4.5 11.5h16M8.5 4.5v4M16.5 4.5v4")]),
 ("clock", "Publish and channel", "a time", "", "s", [CIRCLE, P("M12.5 8.5v4l2.5 1.5")]),
 ("download", "Publish and channel", "save a copy to disk", "", "s", [P(TRAY), P("M12.5 4.5v11M8.5 11.5l4 4 4-4")]),
 ("upload", "Publish and channel", "send a file up", "", "s", [P(TRAY), P("M12.5 15.5v-11M8.5 8.5l4-4 4 4")]),
 ("eject", "Publish and channel", "unload the catalog", "", "s", [P("M12.5 4.5l7 9h-14zM5.5 18.5h14")]),
 ("load", "Publish and channel", "load a catalog", "", "s", [P("M9.5 4.5h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9M4.5 12.5h10M11.5 9.5l3 3-3 3")]),
 ("replace", "Publish and channel", "Replace catalog?", "a two-arrow loop", "s", [P("M17.5 4.5l3 3-3 3M4.5 11.5v-2a2 2 0 0 1 2-2h14M7.5 20.5l-3-3 3-3M20.5 13.5v2a2 2 0 0 1-2 2h-14")]),
 # Trust
 ("lock", "Trust", "locked, read only", "", "s", [R(5.5, 11.5, 14, 9), P("M8.5 11.5v-3a4 4 0 0 1 8 0v3")]),
 ("unlock", "Trust", "unlocked", "", "s", [R(5.5, 11.5, 14, 9), P("M8.5 11.5v-3a4 4 0 0 1 7.7-1.5")]),
 ("key", "Trust", "a key or secret", "", "s", [C(7.5, 17.5, 3), P("M9.6 15.4L20.5 4.5M17.5 7.5l2 2M14.5 10.5l2 2")]),
 ("licence", "Trust", "the desk licence", "a rosette", "s", [C(12.5, 9.5, 5), P("M9.5 13.5l-1.5 7 4.5-2.5 4.5 2.5-1.5-7")]),
 ("signed", "Trust", "a signed edition", "a page with a signature", "s", [P(FILE), P("M8.5 16.5c1.5-3 2.5-3 3.5 0s2 3 3.5 0")]),
 ("verified", "Trust", "a verified signature", "", "s", [P("M12.5 4.5l7 2.5v5.5c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5v-5.5zM9.5 12.5l2 2 4-4")]),
 ("user", "Trust", "a person", "", "s", [C(12.5, 8.5, 3.5), P("M5.5 20.5v-1.5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1.5")]),
 # For the desk app too
 ("change", "Desk", "the Change... button", "two opposed arrows", "s", [P("M4.5 8.5h16M17.5 5.5l3 3-3 3M20.5 16.5h-16M7.5 13.5l-3 3 3 3")]),
 ("chevron-retreat", "Desk", "hides the overflowing buttons", "", "s", [P("M11.5 6.5l-6 6 6 6M18.5 6.5l-6 6 6 6")]),
 ("keyboard", "Desk", "keyboard settings", "", "s", [R(4.5, 6.5, 16, 12), P("M8.5 10.5h.01M12.5 10.5h.01M16.5 10.5h.01M8.5 14.5h8")]),
 ("shortcut", "Desk", "a keyboard shortcut", "a key cap with a bolt", "s", [R(4.5, 5.5, 16, 13), P("M13.5 8.5l-3.5 4.5h5l-3.5 4.5")]),
]

def svg(mode, els):
    attrs = STROKE if mode == "s" else 'fill="currentColor"'
    return '<svg xmlns="%s" viewBox="0 0 24 24" %s>%s</svg>\n' % (NS, attrs, "".join(els))

# --- checks -------------------------------------------------------------------------------
NUM = r"-?\d*\.?\d+"
def path_points(d):
    """Endpoints of every command (control points ignored), for a margin check."""
    pts, cur, start = [], (0.0, 0.0), (0.0, 0.0)
    for cmd, arg in re.findall(r"([MmLlHhVvCcSsAaZz])([^MmLlHhVvCcSsAaZz]*)", d):
        nums = [float(x) for x in re.findall(NUM, arg)]
        rel = cmd.islower()
        c = cmd.upper()
        if c == "Z":
            cur = start; continue
        if c == "H":
            for x in nums:
                cur = (cur[0] + x if rel else x, cur[1]); pts.append(cur)
        elif c == "V":
            for y in nums:
                cur = (cur[0], cur[1] + y if rel else y); pts.append(cur)
        else:
            n = {"M": 2, "L": 2, "C": 6, "S": 4, "A": 7}[c]
            for i in range(0, len(nums), n):
                x, y = nums[i + n - 2], nums[i + n - 1]
                cur = (cur[0] + x, cur[1] + y) if rel else (x, y)
                pts.append(cur)
                if c == "M" and i == 0: start = cur
    return pts

def check(name, text):
    problems = []
    if len(text.encode()) > 1536: problems.append("over 1.5 KB")
    root = ET.fromstring(text)  # raises on bad XML
    if root.tag != "{%s}svg" % NS: problems.append("root is not svg")
    for el in root.iter():
        tag = el.tag.split("}")[1]
        if tag in ("text", "image", "script", "use", "style"): problems.append("has " + tag)
        if "id" in el.attrib: problems.append("has an id")
        for k, v in el.attrib.items():
            if k in ("fill", "stroke") and v not in ("none", "currentColor"): problems.append("colour " + v)
    lo, hi = 2 + 0.875, 22 - 0.875
    for el in root.iter():
        tag = el.tag.split("}")[1]
        pts = []
        if tag == "path": pts = path_points(el.get("d"))
        elif tag == "rect":
            x, y, w, h = (float(el.get(k)) for k in ("x", "y", "width", "height"))
            pts = [(x, y), (x + w, y + h)]
        elif tag == "circle":
            cx, cy, r = (float(el.get(k)) for k in ("cx", "cy", "r"))
            pts = [(cx - r, cy - r), (cx + r, cy + r)]
        for x, y in pts:
            if not (lo - 0.01 <= x <= hi + 0.01 and lo - 0.01 <= y <= hi + 0.01):
                problems.append("point (%s,%s) outside the 2-unit margin" % (f(x), f(y))); break
    return problems

# --- outputs ------------------------------------------------------------------------------
def main():
    names = [i[0] for i in ICONS]
    assert len(names) == len(set(names)), "duplicate name"
    bad = 0
    files = {}
    for name, group, use, note, mode, els in ICONS:
        text = svg(mode, els)
        probs = check(name, text)
        if probs:
            bad += 1; print(name, ";".join(probs))
        files[name] = text
        with open(os.path.join(HERE, name + ".svg"), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
    # index.md
    lines = ["# Icon index", "",
             "One line per icon: name, its use, and any compromise. %d icons." % len(ICONS), ""]
    group = None
    for name, g, use, note, mode, els in ICONS:
        if g != group:
            group = g; lines += ["## " + g, ""]
        lines.append("- `%s`: %s.%s" % (name, use, (" Compromise: %s." % note) if note else ""))
    lines.append("")
    with open(os.path.join(HERE, "index.md"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines))
    # sheet.html
    def block(theme, bg, ink, dim):
        cells = []
        for name, g, use, note, mode, els in ICONS:
            inner = files[name].strip()
            cells.append('<div class="c"><div class="r">'
                         + "".join('<span class="s%d">%s</span>' % (s, inner) for s in (16, 20, 24))
                         + '</div><div class="n">%s</div></div>' % name)
        return ('<section class="%s" style="background:%s;color:%s"><h2 style="color:%s">%s</h2>'
                '<div class="g">%s</div></section>' % (theme, bg, ink, dim, theme, "".join(cells)))
    html = ("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Icon sheet</title>"
            "<style>"
            "body{margin:0;font:12px/1.4 'Segoe UI Variable Text','Segoe UI',system-ui,sans-serif}"
            "section{padding:20px 24px}h2{margin:0 0 14px;font:600 11px sans-serif;letter-spacing:.7px;"
            "text-transform:uppercase}"
            ".g{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px 8px}"
            ".c{padding:8px 6px;border-radius:8px}"
            ".r{display:flex;align-items:flex-end;gap:10px;height:28px}"
            ".r span{display:block;line-height:0}"
            ".s16 svg{width:16px;height:16px}.s20 svg{width:20px;height:20px}.s24 svg{width:24px;height:24px}"
            ".n{margin-top:6px;font-family:ui-monospace,Consolas,monospace;font-size:11px;opacity:.75;"
            "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
            "</style></head><body>"
            + block("light", "#f7f8fa", "#0f172a", "#475569")
            + block("dark", "#0f1013", "#e3e6ea", "#8f98a6")
            + "</body></html>\n")
    with open(os.path.join(HERE, "sheet.html"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(html)
    sizes = [len(files[n].encode()) for n in names]
    print("icons %d, faults %d, largest %d bytes, smallest %d bytes" % (len(ICONS), bad, max(sizes), min(sizes)))
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
