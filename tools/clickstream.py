"""Derive link weights from Wikipedia reader navigation.

    python tools/clickstream.py fetch      # download the monthly dumps (~484 MB each)
    python tools/clickstream.py extract    # scan each dump -> small per-month cache
    python tools/clickstream.py build      # combine caches -> data/weights-clickstream.js

Why this source: the editorial weights in links.js are my judgement about how tightly
two issues are discussed together. The clickstream is *behavioural* -- if a reader on
"Permafrost" clicks through to "Atmospheric methane", that is a revealed adjacency in
a real person's head. Not expert opinion, not a survey; just where attention goes.

Two signals per pair:

  direct     clicks between the two articles, either direction. Strong evidence, but
             sparse -- most of our pairs are not directly linked on Wikipedia.

  context    cosine similarity of the two articles' neighbourhoods, i.e. the weighted
             set of articles readers arrive from and leave to. Two issues can share
             reader context without a direct link, which is much of what we want.
             Counts are log-damped first or a few huge articles dominate every vector.

MONTHS matters more than it looks. The dump only includes links clicked more than ten
times in the month, so a single month leaves niche articles (Energy poverty, Saltwater
intrusion) with almost no recorded navigation and therefore no measurable similarity
to anything. Stacking months lifts those links over the threshold.
"""
import gzip, json, math, os, sys, urllib.request
from collections import defaultdict

MONTHS = ["2026-06", "2026-05", "2026-04"]
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def dump_url(month):
    return (f"https://dumps.wikimedia.org/other/clickstream/{month}/"
            f"clickstream-enwiki-{month}.tsv.gz")


def dump_path(month):
    return os.path.join(HERE, f"clickstream-enwiki-{month}.tsv.gz")


def cache_path(month):
    return os.path.join(HERE, f"cache-{month}.json")


def fetch():
    for month in MONTHS:
        path = dump_path(month)
        if os.path.exists(path):
            print(f"have {os.path.basename(path)} ({os.path.getsize(path):,} bytes)")
            continue
        print(f"downloading {dump_url(month)}")
        req = urllib.request.Request(dump_url(month),
                                     headers={"User-Agent": "eco-web-clickstream/1.0"})
        with urllib.request.urlopen(req, timeout=180) as r, open(path, "wb") as out:
            total = int(r.headers.get("Content-Length", 0))
            done = 0
            while True:
                chunk = r.read(1 << 22)
                if not chunk:
                    break
                out.write(chunk)
                done += len(chunk)
            print(f"  saved {done:,} bytes")


def load_map():
    with open(os.path.join(HERE, "wiki_map.json"), encoding="utf-8") as fh:
        wmap = json.load(fh)
    title_to_node = {info["title"].replace(" ", "_"): node
                     for node, info in wmap.items() if info["title"]}
    return wmap, title_to_node


def extract():
    """One pass per dump; keep only rows touching our articles."""
    wmap, title_to_node = load_map()
    ours = set(title_to_node)

    for month in MONTHS:
        if os.path.exists(cache_path(month)):
            print(f"cache exists for {month}, skipping")
            continue
        if not os.path.exists(dump_path(month)):
            print(f"no dump for {month}, run fetch first")
            continue

        direct = defaultdict(int)
        neighbourhood = defaultdict(lambda: defaultdict(int))
        rows = kept = 0
        with gzip.open(dump_path(month), "rt", encoding="utf-8", errors="replace") as fh:
            for line in fh:
                rows += 1
                parts = line.rstrip("\n").split("\t")
                if len(parts) != 4:
                    continue
                prev, curr, kind, n = parts
                if kind != "link" or prev.startswith("other-"):
                    continue
                a_in, b_in = prev in ours, curr in ours
                if not (a_in or b_in):
                    continue
                kept += 1
                n = int(n)
                if a_in and b_in:
                    na, nb = title_to_node[prev], title_to_node[curr]
                    if na != nb:
                        direct["\t".join(sorted((na, nb)))] += n
                if a_in:
                    neighbourhood[title_to_node[prev]][curr] += n
                if b_in:
                    neighbourhood[title_to_node[curr]][prev] += n

        with open(cache_path(month), "w", encoding="utf-8") as fh:
            json.dump({"direct": dict(direct),
                       "neighbourhood": {k: dict(v) for k, v in neighbourhood.items()}},
                      fh, ensure_ascii=False)
        print(f"{month}: scanned {rows:,} rows, kept {kept:,}, "
              f"{len(direct)} direct pairs, {len(neighbourhood)} articles seen")


def combine():
    """Sum the per-month caches into one direct-count map and one neighbourhood map."""
    direct = defaultdict(int)
    neighbourhood = defaultdict(lambda: defaultdict(int))
    used = []
    for month in MONTHS:
        if not os.path.exists(cache_path(month)):
            continue
        used.append(month)
        with open(cache_path(month), encoding="utf-8") as fh:
            data = json.load(fh)
        for k, v in data["direct"].items():
            direct[k] += v
        for node, vec in data["neighbourhood"].items():
            for article, n in vec.items():
                neighbourhood[node][article] += n
    return used, direct, neighbourhood


def cosine(va, vb):
    if len(va) > len(vb):
        va, vb = vb, va
    dot = sum(w * vb[k] for k, w in va.items() if k in vb)
    if not dot:
        return 0.0
    na = math.sqrt(sum(w * w for w in va.values()))
    nb = math.sqrt(sum(w * w for w in vb.values()))
    return dot / (na * nb) if na and nb else 0.0


def read_links():
    """Pull (source, target, verb, editorial weight) out of the app's own data files."""
    import re
    links = []
    for name in ("links.js", "links-c.js"):
        with open(os.path.join(ROOT, "data", name), encoding="utf-8") as fh:
            for m in re.finditer(
                    r"\bl\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)", fh.read()):
                links.append((m.group(1), m.group(3), m.group(2), int(m.group(4))))
    return links


def build():
    wmap, _ = load_map()
    used, direct, neighbourhood = combine()
    if not used:
        print("no caches; run fetch then extract")
        return
    print(f"months combined: {', '.join(used)}")

    sizes = sorted(len(v) for v in neighbourhood.values())
    print(f"neighbourhood size: min={sizes[0]} p25={sizes[len(sizes)//4]} "
          f"median={sizes[len(sizes)//2]} p90={sizes[int(len(sizes)*0.9)]} max={sizes[-1]}")
    thin = [n for n, v in neighbourhood.items() if len(v) < 5]
    if thin:
        print(f"{len(thin)} articles with fewer than 5 recorded neighbours: "
              f"{', '.join(sorted(thin)[:8])}{' ...' if len(thin) > 8 else ''}")

    damped = {node: {k: math.log1p(v) for k, v in vec.items()}
              for node, vec in neighbourhood.items()}

    links = read_links()
    rows, unmapped, nosignal = [], 0, 0
    for src, tgt, verb, editorial in links:
        mapped = bool(wmap.get(src, {}).get("title") and wmap.get(tgt, {}).get("title"))
        if not mapped:
            rows.append({"s": src, "t": tgt, "w": None, "direct": 0,
                         "context": 0.0, "status": "unmapped"})
            unmapped += 1
            continue
        d = direct.get("\t".join(sorted((src, tgt))), 0)
        ctx = cosine(damped.get(src, {}), damped.get(tgt, {}))
        status = "measured" if (d or ctx) else "no-signal"
        if status == "no-signal":
            nosignal += 1
        rows.append({"s": src, "t": tgt, "w": None, "direct": d,
                     "context": ctx, "status": status})

    d_vals = sorted(r["direct"] for r in rows if r["direct"] > 0)
    c_vals = sorted(r["context"] for r in rows if r["context"] > 0)
    d95 = d_vals[int(len(d_vals) * 0.95)] if d_vals else 1
    c95 = c_vals[int(len(c_vals) * 0.95)] if c_vals else 1
    print(f"95th percentile: direct={d95:,} clicks, context={c95:.3f} cosine")

    for r in rows:
        if r["status"] == "measured":
            dn = min(1.0, r["direct"] / d95) if d95 else 0.0
            cn = min(1.0, r["context"] / c95) if c95 else 0.0
            r["w"] = round(max(0.15, 3.0 * (0.65 * dn + 0.35 * cn)), 3)
        elif r["status"] == "no-signal":
            r["w"] = 0.1        # readers do not connect these; not the same as unmapped

    payload = {
        "months": used,
        "source": dump_url(used[0]).rsplit("/", 2)[0],
        "links": [{"s": r["s"], "t": r["t"], "w": r["w"], "direct": r["direct"],
                   "context": round(r["context"], 4), "status": r["status"]} for r in rows],
        "map": {k: {"title": v["title"], "quality": v["quality"]} for k, v in wmap.items()},
    }
    out = os.path.join(ROOT, "data", "weights-clickstream.js")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("/* GENERATED by tools/clickstream.py -- do not edit by hand.\n"
                 f" * English Wikipedia reader navigation, months: {', '.join(used)}.\n"
                 " * status: measured  = readers navigate between these\n"
                 " *         no-signal = both articles exist, no recorded navigation\n"
                 " *         unmapped  = an endpoint has no Wikipedia article (editorial w kept) */\n")
        fh.write("window.ECO_CLICKSTREAM = ")
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")
    print(f"wrote {out}")

    measured = [r for r in rows if r["status"] == "measured"]
    print(f"\n{len(links)} links: {len(measured)} measured, {nosignal} no-signal, "
          f"{unmapped} unmapped")

    ed = {(s, t): w for s, t, _, w in links}
    pairs = [(ed[(r['s'], r['t'])], r["w"]) for r in measured]
    n = len(pairs)
    mx = sum(a for a, _ in pairs) / n
    my = sum(b for _, b in pairs) / n
    cov = sum((a - mx) * (b - my) for a, b in pairs)
    sx = math.sqrt(sum((a - mx) ** 2 for a, _ in pairs))
    sy = math.sqrt(sum((b - my) ** 2 for _, b in pairs))
    print(f"correlation with editorial weights (measured only): r = {cov / (sx * sy):.3f}")

    print("\nreaders connect these far less than I did:")
    for r in sorted(measured, key=lambda r: ed[(r['s'], r['t'])] - r["w"], reverse=True)[:6]:
        print(f"  {r['s']:20} -> {r['t']:20} mine {ed[(r['s'], r['t'])]}  "
              f"readers {r['w']:.2f}  ({r['direct']:,} clicks)")
    print("\nreaders connect these far more than I did:")
    for r in sorted(measured, key=lambda r: r["w"] - ed[(r['s'], r['t'])], reverse=True)[:6]:
        print(f"  {r['s']:20} -> {r['t']:20} mine {ed[(r['s'], r['t'])]}  "
              f"readers {r['w']:.2f}  ({r['direct']:,} clicks)")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "fetch":
        fetch()
    elif cmd == "extract":
        extract()
    elif cmd == "build":
        build()
    else:
        print(__doc__)
