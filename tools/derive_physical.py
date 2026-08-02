"""Derive the physical flags: lowlying, freezethaw, tropicalforest, cyclone.

    python tools/derive_physical.py

The last batch, and the most mixed in method, because unlike the climate flags these do
not share a source. Each one is whatever measures it best. Agreement is 81%.

  lowlying        World Bank EN.POP.EL5M.ZS, on two axes. Share alone drops China at
                  4.1% and India at 1.9%, which are 58 and 27 million people below 5 m;
                  an absolute count alone drops Tuvalu. It is a population measure
                  rather than a topographic one, which is right -- the flag is about
                  people near sea level, not about land that happens to be flat.
  freezethaw     Koppen. The flag means winters crossing zero repeatedly, which is
                  mid-latitude, so it is NOT simply "cold": the continuously frozen
                  subarctic and polar classes are excluded on purpose. Ground that
                  freezes in autumn and thaws in spring cycles once.
  tropicalforest  Koppen humid-tropical share (Af/Am) alone. Gating on present forest
                  cover was tried and is backwards -- it rejected Haiti at 12% forest,
                  Uganda at 11% and Madagascar at 21%, which carry this flag precisely
                  because they are frontiers that already lost most of it. Cover
                  measures what survived, not what is at stake.
  cyclone         IBTrACS since 1980, filtered to hurricane strength before counting.
                  Unfiltered it is not a basin measure at all: IBTrACS records the whole
                  lifecycle, so post-tropical remnants put Canada on 119 storms and
                  Ireland on 17.

`reef` was attempted and abandoned. Natural Earth's 10m reefs layer is cartographic
rather than a distribution -- 5,823 vertices worldwide -- and it puts the nearest reef
to Kenya at 1,148 km and Tanzania at 1,173 km, both of which have fringing reefs along
their entire coast. The real source is UNEP-WCMC WCMC008, which needs a registered
download and a geospatial stack.

`glacierfed` and `freshwater` are not attempted. Glacier-fed needs to know which rivers
drain which glaciers into which countries -- Pakistan's dependence on the Indus is not
visible from glacier area inside Pakistan. Freshwater needs a hydrographic basin and
lake database to define a great lake or a big river. Both are real work rather than a
missing download. All three stay hand-assigned, noted in data/regions.js.
"""
import csv
import io
import json
import math
import os
import re
import sys
import zipfile

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
GEO = os.path.join(HERE, "geo-cache")
WB = os.path.join(HERE, "wb-cache")
REGIONS = os.path.join(HERE, os.pardir, "data", "regions.js")
NE = os.path.join(GEO, "ne_110m_admin_0_countries.geojson")
REEFS = os.path.join(GEO, "ne_10m_reefs.geojson")
TRACKS = os.path.join(GEO, "ibtracs.since1980.list.v04r01.csv")
STORM_COUNTS = os.path.join(GEO, "cyclone_storm_counts.csv")
KOPPEN_TIF = os.path.join(GEO, "koppen_geiger_0p1_1991_2020.tif")

CLASS = {
    1: "Af", 2: "Am", 3: "Aw", 4: "BWh", 5: "BWk", 6: "BSh", 7: "BSk",
    8: "Csa", 9: "Csb", 10: "Csc", 11: "Cwa", 12: "Cwb", 13: "Cwc",
    14: "Cfa", 15: "Cfb", 16: "Cfc", 17: "Dsa", 18: "Dsb", 19: "Dsc", 20: "Dsd",
    21: "Dwa", 22: "Dwb", 23: "Dwc", 24: "Dwd", 25: "Dfa", 26: "Dfb", 27: "Dfc",
    28: "Dfd", 29: "ET", 30: "EF",
}

# Freeze-thaw: continental and cold-temperate classes with a real winter but not a
# permanent one. Dfc/Dfd/Dwc/Dwd and the polar classes are excluded on purpose -- they
# freeze in autumn and thaw in spring, one cycle, which is not what damages roads and
# pipes. Csb/Cfb are excluded as mild oceanic.
FREEZETHAW_CLASSES = ("Dfa", "Dfb", "Dsa", "Dsb", "Dwa", "Dwb", "Dsc")
# The humid tropical forest biome. Aw is savanna and is deliberately not here.
HUMID_TROPICAL = ("Af", "Am")

# lowlying passes on either axis. A share alone drops China at 4.1% and India at 1.9%,
# which are 58 and 27 million people below 5 m -- more exposed population than every
# small island state combined. An absolute count alone drops Tuvalu.
T_LOWLYING_PCT = 5.0
T_LOWLYING_ABS = 5e6      # people below 5 m

T_FREEZETHAW = 0.25       # share of land in cycling-winter classes

# tropicalforest is measured as biome, not as current forest cover. Gating on cover was
# backwards: it rejected Haiti at 12% forest, Uganda at 11% and Madagascar at 21%, which
# carry the flag precisely because they are deforestation frontiers that already lost
# most of it. Present forest cover measures what survived, not what is at stake.
# 0.25 was tried and is worse: agreement fell from 20 to 14 as it dropped
# Haiti, Uganda and Madagascar, the deforestation frontiers this flag is for.
T_HUMID_TROPICAL = 0.15

# Storms are filtered to hurricane strength before counting. Unfiltered, IBTrACS
# includes every stage of a storm's life including post-tropical remnants, which put
# Canada on 119 storms and Ireland on 17 -- both real weather, neither a cyclone basin.
T_CYCLONE_TRACKS = 12
T_CYCLONE_KM = 250.0
T_CYCLONE_KT = 64.0       # hurricane / typhoon force

SAMPLE_STEP = 0.25
MIN_SAMPLES = 12


def load_koppen():
    from PIL import Image
    with open(KOPPEN_TIF, "rb") as fh:
        return np.array(Image.open(io.BytesIO(fh.read())))


def load_indicator(code, years=5):
    """Median of the last `years` non-empty values per ISO3, as in derive_flags.py."""
    path = os.path.join(WB, code + ".zip")
    if not os.path.exists(path):
        return {}
    with zipfile.ZipFile(path) as z:
        name = next(n for n in z.namelist() if n.startswith("API_"))
        rows = list(csv.reader(io.StringIO(z.read(name).decode("utf-8-sig"))))
    header, out = rows[4], {}
    for r in rows[5:]:
        if len(r) < 5:
            continue
        vals = []
        for i in range(4, min(len(r), len(header))):
            if r[i].strip():
                try:
                    vals.append(float(r[i]))
                except ValueError:
                    pass
        if vals:
            w = sorted(vals[-years:])
            out[r[1]] = w[len(w) // 2]
    return out


def rings_of(geom):
    if geom["type"] == "Polygon":
        return list(geom["coordinates"])
    out = []
    for poly in geom["coordinates"]:
        out.extend(poly)
    return out


def inside(lons, lats, rings):
    hit = np.zeros(lons.shape, dtype=bool)
    for ring in rings:
        px = np.asarray([p[0] for p in ring])
        py = np.asarray([p[1] for p in ring])
        qx, qy = np.roll(px, -1), np.roll(py, -1)
        for x1, y1, x2, y2 in zip(px, py, qx, qy):
            if y1 == y2:
                continue
            crosses = (y1 > lats) != (y2 > lats)
            xint = x1 + (lats - y1) * (x2 - x1) / (y2 - y1)
            hit ^= crosses & (lons < xint)
    return hit


def koppen_fractions(arr, geom):
    rings = rings_of(geom)
    xs = [p[0] for r in rings for p in r]
    ys = [p[1] for r in rings for p in r]
    lon0, lon1, lat0, lat1 = min(xs), max(xs), min(ys), max(ys)
    step = SAMPLE_STEP
    for _ in range(4):
        gl = np.arange(lon0, lon1 + step, step)
        ga = np.arange(lat0, lat1 + step, step)
        if gl.size * ga.size > 4_000_000:
            break
        L, A = np.meshgrid(gl, ga)
        mask = inside(L, A, rings)
        if mask.sum() >= MIN_SAMPLES:
            break
        step /= 3
    if mask.sum() == 0:
        return {}
    plon, plat = L[mask], A[mask]
    h, w = arr.shape
    col = np.clip(((plon + 180.0) / 360.0 * w).astype(int), 0, w - 1)
    row = np.clip(((90.0 - plat) / 180.0 * h).astype(int), 0, h - 1)
    vals = arr[row, col]
    wgt = np.cos(np.radians(plat))
    good = vals > 0
    vals, wgt = vals[good], wgt[good]
    if not wgt.sum():
        return {}
    return {CLASS.get(int(v), str(int(v))): float(wgt[vals == v].sum() / wgt.sum())
            for v in np.unique(vals)}


def coast_points(geom, stride=3):
    """Thinned polygon vertices, standing in for the coastline."""
    pts = []
    for ring in rings_of(geom):
        pts.extend(ring[::stride])
    return np.asarray(pts) if pts else np.zeros((0, 2))


def min_km(pts, targets):
    """Smallest great-circle distance from any point in `pts` to any in `targets`."""
    if len(pts) == 0 or len(targets) == 0:
        return math.inf
    lo1 = np.radians(pts[:, 0])[:, None]
    la1 = np.radians(pts[:, 1])[:, None]
    lo2 = np.radians(targets[:, 0])[None, :]
    la2 = np.radians(targets[:, 1])[None, :]
    d = np.sin((la2 - la1) / 2) ** 2 + np.cos(la1) * np.cos(la2) * np.sin((lo2 - lo1) / 2) ** 2
    return float(6371.0 * 2 * np.arcsin(np.sqrt(np.clip(d, 0, 1))).min())


def load_reefs():
    if not os.path.exists(REEFS):
        return np.zeros((0, 2))
    with open(REEFS, encoding="utf-8") as fh:
        gj = json.load(fh)
    pts = []
    for f in gj["features"]:
        g = f.get("geometry")
        if not g:
            continue
        def walk(c):
            if isinstance(c[0], (int, float)):
                pts.append(c[:2])
            else:
                for x in c:
                    walk(x)
        walk(g["coordinates"])
    return np.asarray(pts[::2]) if pts else np.zeros((0, 2))


def cached_storm_counts():
    """{iso3: distinct hurricane-strength storms within reach} from the committed CSV.

    The IBTrACS source is 143 MB, over GitHub's file limit, so the derived per-country
    counts are committed instead -- the same trade as extracting one grid from the
    Koppen bundle. Delete the CSV and re-download the source to recompute.
    """
    if not os.path.exists(STORM_COUNTS):
        return {}
    with open(STORM_COUNTS, encoding="utf-8") as fh:
        return {r["ISO3"]: int(r["STORMS"]) for r in csv.DictReader(fh)}


def load_tracks():
    """Fixes at hurricane strength or above, as (points, storm ids).

    Filtering by wind is what makes this measure a cyclone basin rather than a storm
    track. IBTrACS records the whole lifecycle, so an Atlantic hurricane that decays
    into a post-tropical low over Newfoundland still contributes fixes there.
    """
    if not os.path.exists(TRACKS):
        return np.zeros((0, 2)), np.zeros(0, dtype=object)
    lons, lats, sids = [], [], []
    with open(TRACKS, encoding="utf-8", errors="replace") as fh:
        rd = csv.reader(fh)
        header = next(rd)
        next(rd, None)                      # units row
        i_sid, i_lat, i_lon = (header.index(k) for k in ("SID", "LAT", "LON"))
        wind_cols = [header.index(c) for c in ("USA_WIND", "WMO_WIND") if c in header]
        need = max(i_sid, i_lat, i_lon, *(wind_cols or [0]))
        for row in rd:
            if len(row) <= need:
                continue
            wind = None
            for c in wind_cols:
                try:
                    wind = float(row[c]); break
                except ValueError:
                    continue
            if wind is None or wind < T_CYCLONE_KT:
                continue
            try:
                la, lo = float(row[i_lat]), float(row[i_lon])
            except ValueError:
                continue
            lons.append(lo); lats.append(la); sids.append(row[i_sid])
    pts = np.column_stack([np.asarray(lons), np.asarray(lats)]) if lons else np.zeros((0, 2))
    return pts, np.asarray(sids, dtype=object)


def hand_assigned():
    text = open(REGIONS, encoding="utf-8").read()
    out = {}
    for m in re.finditer(r"c\('([^']+)',\s*'(\w*)',\s*'\w+',\s*\[([^\]]*)\]\)", text):
        name, iso, raw = m.groups()
        if iso:
            out[iso] = (name, set(re.findall(r"'([^']+)'", raw)))
    return out


FLAGS = ("lowlying", "freezethaw", "tropicalforest", "cyclone")


def main():
    arr = load_koppen()
    below5 = load_indicator("EN.POP.EL5M.ZS")
    pop = load_indicator("SP.POP.TOTL")
    forest = load_indicator("AG.LND.FRST.ZS")
    storms = cached_storm_counts()
    if storms:
        tpts, tsid = np.zeros((0, 2)), np.zeros(0, dtype=object)
        print(f"cyclone: cached counts for {len(storms)} countries\n")
    else:
        tpts, tsid = load_tracks()
        print(f"cyclone: {len(tpts)} hurricane-strength fixes from IBTrACS\n")

    with open(NE, encoding="utf-8") as fh:
        gj = json.load(fh)
    geoms = {}
    for f in gj["features"]:
        p = f["properties"]
        iso = p.get("ADM0_A3") or p.get("ISO_A3")
        if f.get("geometry") and iso and iso != "-99":
            geoms[iso] = f["geometry"]

    hand = hand_assigned()
    rows, agree, hand_only, data_only = [], 0, 0, 0
    for iso, (nm, want_all) in sorted(hand.items(), key=lambda kv: kv[1][0]):
        if iso not in geoms:
            continue
        frac = koppen_fractions(arr, geoms[iso])
        if not frac:
            continue
        got, why = set(), {}

        pop5 = below5.get(iso)
        tot = pop.get(iso)
        if pop5 is not None:
            abs5 = pop5 / 100.0 * tot if tot else None
            why["lowlying"] = (f"{pop5:.1f}% below 5 m"
                               + (f" = {abs5/1e6:.1f}M" if abs5 else ""))
            if pop5 >= T_LOWLYING_PCT or (abs5 and abs5 >= T_LOWLYING_ABS):
                got.add("lowlying")

        ft = sum(frac.get(c, 0.0) for c in FREEZETHAW_CLASSES)
        why["freezethaw"] = f"{ft*100:.0f}% cycling-winter classes"
        if ft >= T_FREEZETHAW:
            got.add("freezethaw")

        humid = sum(frac.get(c, 0.0) for c in HUMID_TROPICAL)
        fpct = forest.get(iso)
        why["tropicalforest"] = (f"{humid*100:.0f}% humid tropical"
                                 + (f", {fpct:.0f}% forest left" if fpct is not None else ""))
        if humid >= T_HUMID_TROPICAL:
            got.add("tropicalforest")

        cp = coast_points(geoms[iso])
        n = storms.get(iso)
        if n is None and len(tpts):
            near = min_km_mask(cp, tpts, T_CYCLONE_KM)
            n = len(set(tsid[near])) if near.any() else 0
        if n is not None:
            why["cyclone"] = f"{n} storms within {T_CYCLONE_KM:.0f} km since 1980"
            if n >= T_CYCLONE_TRACKS:
                got.add("cyclone")

        want = want_all & set(FLAGS)
        rows.append((nm, got, want, why))
        agree += len(got & want)
        hand_only += len(want - got)
        data_only += len(got - want)

    total = agree + hand_only + data_only
    print(f"{len(rows)} countries, physical flags ({', '.join(FLAGS)})")
    print(f"agree {agree} / {total}  ({100*agree/total:.0f}%)   "
          f"hand-only {hand_only}   data-only {data_only}\n")
    print(f"{'flag':16}{'agree':>7}{'hand only':>11}{'data only':>11}")
    print("-" * 45)
    for f in FLAGS:
        a = sum(1 for _, got, want, _ in rows if f in got and f in want)
        h = sum(1 for _, got, want, _ in rows if f in want and f not in got)
        d = sum(1 for _, got, want, _ in rows if f in got and f not in want)
        print(f"{f:16}{a:>7}{h:>11}{d:>11}")

    for f in FLAGS:
        bad = [(nm, "hand only" if f in want else "data only", why.get(f, "no measure"))
               for nm, got, want, why in rows if (f in want) != (f in got)]
        if not bad:
            continue
        print(f"\n{f} -- {len(bad)} disagreement(s)")
        for nm, side, reason in sorted(bad, key=lambda x: (x[1], x[0])):
            print(f"  {nm[:28]:30}{side:11}{reason}")


def min_km_mask(pts, targets, km):
    """Boolean mask over `targets`: within `km` of any point in `pts`.

    Chunked over targets because the full pairwise matrix for a large country against
    every cyclone fix is tens of millions of doubles.
    """
    if len(pts) == 0 or len(targets) == 0:
        return np.zeros(len(targets), dtype=bool)
    out = np.zeros(len(targets), dtype=bool)
    la1 = np.radians(pts[:, 1])[:, None]
    lo1 = np.radians(pts[:, 0])[:, None]
    step = max(1, 4_000_000 // max(1, len(pts)))
    for i in range(0, len(targets), step):
        chunk = targets[i:i + step]
        la2 = np.radians(chunk[:, 1])[None, :]
        lo2 = np.radians(chunk[:, 0])[None, :]
        d = (np.sin((la2 - la1) / 2) ** 2
             + np.cos(la1) * np.cos(la2) * np.sin((lo2 - lo1) / 2) ** 2)
        dist = 6371.0 * 2 * np.arcsin(np.sqrt(np.clip(d, 0, 1)))
        out[i:i + step] = (dist <= km).any(axis=0)
    return out


if __name__ == "__main__":
    sys.exit(main())
