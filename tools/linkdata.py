"""Single parser for the app's link and node data files.

Both tools/clickstream.py and tools/lint_links.py need the same three things out of
data/: the link list, the node labels, and the set of valid node ids. They used to
regex it separately with a hardcoded filename tuple each, which meant adding a
links-d.js silently desynced them. Files are discovered by glob here so there is
nothing to keep in sync.
"""
import glob, os, re

DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

# l(source, verb, target, weight [, note]) -- weight is matched as [\d.]+ rather than
# \d+ so a fractional weight is not silently truncated to its integer part, which also
# used to break note detection by leaving the '.' where the comma was expected.
LINK = re.compile(
    r"\bl\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*([\d.]+)\s*"
    r"(?:,\s*'((?:[^'\\]|\\.)*)')?")

# n(id, label, ...) for issues, s(id, label, ...) for solution levers
NODE = re.compile(r"\b[ns]\(\s*'([^']+)'\s*,\s*'([^']+)'")

# A note has to say something. These pass the "is there a fifth argument" test while
# carrying no mechanism, so they are treated as absent.
PLACEHOLDER = {"", ".", "-", "tbd", "todo", "fixme", "n/a", "?"}
MIN_NOTE = 20


def _files(pattern):
    return sorted(glob.glob(os.path.join(DATA, pattern)))


def _read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def load():
    """-> (links, labels). Each link is a dict with s, verb, t, w, note, file."""
    links = []
    for path in _files("links*.js"):
        name = os.path.basename(path)
        for m in LINK.finditer(_read(path)):
            note = m.group(5)
            substantive = bool(note) and note.strip().lower() not in PLACEHOLDER \
                and len(note.strip()) >= MIN_NOTE
            weight = float(m.group(4))
            links.append({
                "s": m.group(1), "verb": m.group(2), "t": m.group(3),
                "w": int(weight) if weight.is_integer() else weight,
                "note": substantive, "note_text": note or "", "file": name,
            })

    labels = {}
    for path in _files("nodes*.js") + _files("solutions*.js"):
        for m in NODE.finditer(_read(path)):
            labels[m.group(1)] = m.group(2)
    return links, labels
