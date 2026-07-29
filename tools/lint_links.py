"""Guard against the failure mode that produced overbroad edges.

    python tools/lint_links.py

Some verbs carry their own mechanism. "PFAS *contaminates* unsafe water" is one step
and needs no gloss. But "plastic *threatens* extinction" explains nothing: the verb is
a placeholder, and it usually compresses three or four steps that were never thought
through. Food insecurity accumulated twenty such edges before anyone noticed, which is
how it became the highest-degree node in the map.

So the rule is narrow: a vague verb must be accompanied by a stated mechanism. Exit 1
if any edge fails, so it can sit in a pre-commit hook.

It also reports in-degree concentration, since a node collecting a large number of
weakly-justified inbound edges is the shape of the same problem forming again.
"""
import os, re, sys
from collections import Counter

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

# verbs that name a placeholder rather than a mechanism
VAGUE = {"threatens", "worsens", "affects", "impacts", "influences"}

LINK = re.compile(
    r"\bl\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*(,)?")


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as fh:
        return fh.read()


links, labels = [], {}
for f in ("links.js", "links-c.js"):
    for m in LINK.finditer(read(f)):
        links.append({"s": m.group(1), "verb": m.group(2), "t": m.group(3),
                      "w": int(m.group(4)), "note": bool(m.group(5)), "file": f})
for f in ("nodes-a.js", "nodes-b.js", "nodes-c.js", "solutions.js"):
    for m in re.finditer(r"\b[ns]\(\s*'([^']+)'\s*,\s*'([^']+)'", read(f)):
        labels[m.group(1)] = m.group(2)

fail = [l for l in links if l["verb"] in VAGUE and not l["note"]]

print(f"{len(links)} links, {sum(1 for l in links if not l['note'])} without a note")
print(f"{len(fail)} using a vague verb with no stated mechanism\n")

for l in fail:
    print(f"  FAIL  {l['file']}  {labels.get(l['s'], l['s'])} "
          f"--{l['verb']}--> {labels.get(l['t'], l['t'])}")

indeg = Counter(l["t"] for l in links)
weak = Counter(l["t"] for l in links if not l["note"])
print("highest in-degree targets (unexplained / total):")
for node, total in indeg.most_common(6):
    flag = "  <-- watch" if weak[node] > total / 2 else ""
    print(f"  {labels.get(node, node):28} {weak[node]:2} / {total:2}{flag}")

if fail:
    print(f"\n{len(fail)} link(s) need a mechanism or removal.")
    sys.exit(1)
print("\nclean")
