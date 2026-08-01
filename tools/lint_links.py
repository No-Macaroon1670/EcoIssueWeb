"""Guard against the failure modes that produced overbroad or broken edges.

    python tools/lint_links.py

Three hard checks, all exit 1 so this can sit in a pre-commit hook (see
tools/pre-commit, installed with tools/install-hooks.ps1):

1. A vague verb must be accompanied by a stated mechanism. Some verbs carry their own:
   "PFAS *contaminates* unsafe water" is one step and needs no gloss. But "plastic
   *threatens* extinction" explains nothing -- the verb is a placeholder, and it
   usually compresses three or four steps that were never thought through. Food
   insecurity accumulated twenty such edges before anyone noticed, which is how it
   became the highest-degree node in the map.

2. Every endpoint must name a real node. A typo'd id otherwise passes silently here,
   gets dropped at runtime by app.js with a console.error nobody reads, and the edge
   just disappears from the graph.

3. Every verb must be declared, either in schema.js negativeVerbs or in DRIVING below.
   Polarity is carried by exact string membership in negativeVerbs, so an undeclared
   verb is not an error anywhere -- it silently renders as a solid driving arrow. A
   suppressing verb that misses the list therefore inverts the claim on screen while
   reading correctly in source, which is the single worst failure this data can have:
   `acidification weakens coral-bleaching` drew a driving arrow for months on exactly
   that basis. Adding a verb is fine; adding one without deciding its polarity is not.

It also reports in-degree concentration as a soft warning, since a hub accumulating
many weakly-justified inbound edges is the shape of the first problem forming again.
"""
import pathlib
import re
import sys
from collections import Counter

import linkdata

# Driving verbs, declared so that a NEW verb has to be classified on the way in rather
# than defaulting to "solid arrow" by omission. This list is descriptive, not a style
# guide: every entry is a verb the data already uses. Adding to it is a one-line
# decision, which is the point -- the decision just has to be made consciously.
DRIVING = {
    "drives", "worsens", "causes", "threatens", "releases", "increases",
    "contaminates", "forces", "enables", "accelerates", "intensifies", "raises",
    "depletes", "disrupts", "expands", "fuels", "amplifies", "concentrates",
    "supplies", "thaws", "triggers", "drowns", "flushes", "fragments",
    "fragments into", "starves", "smothers", "spreads", "feeds", "requires",
}

SCHEMA = pathlib.Path(__file__).resolve().parent.parent / "data" / "schema.js"


def negative_verbs():
    """Read the suppressing set from schema.js so the linter cannot drift from the app.

    Hard-coding a copy here would defeat the check: the two lists would disagree and
    the linter would bless exactly the edges the renderer gets wrong.
    """
    text = SCHEMA.read_text(encoding="utf-8")
    m = re.search(r"negativeVerbs:\s*\[(.*?)\]", text, re.S)
    if not m:
        sys.exit("could not find negativeVerbs in data/schema.js")
    return set(re.findall(r"'([^']+)'", m.group(1)))

# Verbs that name a placeholder rather than a mechanism. Kept to verbs that actually
# occur in the data -- guarding against words nobody writes is dead weight, and it
# hides real gaps: `harms` was missing here while three unnoted `harms` edges passed.
VAGUE = {"threatens", "worsens", "harms"}

# A hub is only interesting once it has enough inbound edges to be a hub. Without a
# floor, any node with two unexplained links flags alongside genuine concentrations.
WATCH_MIN_INDEGREE = 8

links, labels = linkdata.load()
name = lambda node: labels.get(node, node)

NEGATIVE = negative_verbs()
DECLARED = NEGATIVE | DRIVING

vague = [l for l in links if l["verb"] in VAGUE and not l["note"]]
dangling = [(l, end) for l in links for end in (l["s"], l["t"]) if end not in labels]
undeclared = [l for l in links if l["verb"] not in DECLARED]

print(f"{len(links)} links, {sum(1 for l in links if not l['note'])} without a note")
print(f"{len(vague)} using a vague verb with no stated mechanism")
print(f"{len(dangling)} referencing an unknown node")
print(f"{len(undeclared)} using an undeclared verb "
      f"({len(NEGATIVE)} suppressing / {len(DRIVING)} driving declared)\n")

for l in vague:
    print(f"  VAGUE  {l['file']}  {name(l['s'])} --{l['verb']}--> {name(l['t'])}")
for l, end in dangling:
    print(f"  UNKNOWN NODE  {l['file']}  '{end}' in "
          f"{l['s']} --{l['verb']}--> {l['t']}")
for l in undeclared:
    print(f"  UNDECLARED VERB  {l['file']}  '{l['verb']}' in "
          f"{name(l['s'])} --{l['verb']}--> {name(l['t'])}\n"
          f"    would render as a solid driving arrow. If it suppresses, add it to\n"
          f"    negativeVerbs in data/schema.js; if it drives, add it to DRIVING here.")

indeg = Counter(l["t"] for l in links)
weak = Counter(l["t"] for l in links if not l["note"])
print("highest in-degree targets (unexplained / total):")
for node, total in indeg.most_common(6):
    watch = total >= WATCH_MIN_INDEGREE and weak[node] > total / 2
    print(f"  {name(node):28} {weak[node]:2} / {total:2}{'  <-- watch' if watch else ''}")

failures = len(vague) + len(dangling) + len(undeclared)
if failures:
    print(f"\n{failures} problem(s): add a mechanism, fix the id, or remove the link.")
    sys.exit(1)
print("\nclean")
