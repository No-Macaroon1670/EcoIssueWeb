"""Guard against the failure modes that produced overbroad or broken edges.

    python tools/lint_links.py

Two hard checks, both exit 1 so this can sit in a pre-commit hook (see
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

It also reports in-degree concentration as a soft warning, since a hub accumulating
many weakly-justified inbound edges is the shape of the first problem forming again.
"""
import sys
from collections import Counter

import linkdata

# Verbs that name a placeholder rather than a mechanism. Kept to verbs that actually
# occur in the data -- guarding against words nobody writes is dead weight, and it
# hides real gaps: `harms` was missing here while three unnoted `harms` edges passed.
VAGUE = {"threatens", "worsens", "harms"}

# A hub is only interesting once it has enough inbound edges to be a hub. Without a
# floor, any node with two unexplained links flags alongside genuine concentrations.
WATCH_MIN_INDEGREE = 8

links, labels = linkdata.load()
name = lambda node: labels.get(node, node)

vague = [l for l in links if l["verb"] in VAGUE and not l["note"]]
dangling = [(l, end) for l in links for end in (l["s"], l["t"]) if end not in labels]

print(f"{len(links)} links, {sum(1 for l in links if not l['note'])} without a note")
print(f"{len(vague)} using a vague verb with no stated mechanism")
print(f"{len(dangling)} referencing an unknown node\n")

for l in vague:
    print(f"  VAGUE  {l['file']}  {name(l['s'])} --{l['verb']}--> {name(l['t'])}")
for l, end in dangling:
    print(f"  UNKNOWN NODE  {l['file']}  '{end}' in "
          f"{l['s']} --{l['verb']}--> {l['t']}")

indeg = Counter(l["t"] for l in links)
weak = Counter(l["t"] for l in links if not l["note"])
print("highest in-degree targets (unexplained / total):")
for node, total in indeg.most_common(6):
    watch = total >= WATCH_MIN_INDEGREE and weak[node] > total / 2
    print(f"  {name(node):28} {weak[node]:2} / {total:2}{'  <-- watch' if watch else ''}")

failures = len(vague) + len(dangling)
if failures:
    print(f"\n{failures} problem(s): add a mechanism, fix the id, or remove the link.")
    sys.exit(1)
print("\nclean")
