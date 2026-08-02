"""Derive the climate flags from Koppen-Geiger, without a geospatial stack.

    python tools/derive_climate.py

Five flags come out of one dataset, which is the best ratio in the whole flag list:
arid, monsoon, equatorial, medclimate and boreal. Each is a rule over the fraction of a
country's land falling in particular Koppen classes.

Method. The usual way to do this is a zonal statistic with rasterio and geopandas,
neither of which is installed and both of which are heavy. Instead: read the classified
GeoTIFF with tifffile as a plain array, lay a regular sampling grid over each country's
bounding box, keep the points that fall inside the polygon by ray casting in numpy, and
read the class at those points. That gives class fractions directly.

The approximation is that sampling on a lat/lon grid over-weights high latitudes, since
a degree of longitude is narrower near the poles. Each sample is therefore weighted by
cos(latitude), which is the standard correction and recovers area-proportional fractions
closely enough for a threshold.

Koppen data: Beck et al. 2023, 1 km, CC BY 4.0, from gloh2o.org. Country outlines:
Natural Earth 110m admin-0, public domain.
"""
import io
import json
import os
import re
import sys
import zipfile

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
GEO = os.path.join(HERE, "geo-cache")
# The single grid actually used, extracted from the 130 MB source bundle. Committed at
# 217 KB; the bundle itself is gitignored, both because it is over GitHub's 100 MB file
# limit and because 71 of its 72 GeoTIFFs are future SSP scenarios and resolutions this
# does not read.
KOPPEN_TIF = os.path.join(GEO, "koppen_geiger_0p1_1991_2020.tif")
KOPPEN_ZIP = os.path.join(GEO, "koppen_geiger_tif.zip")
NE = os.path.join(GEO, "ne_110m_admin_0_countries.geojson")
REGIONS = os.path.join(HERE, os.pardir, "data", "regions.js")
SUBREGIONS = os.path.join(HERE, os.pardir, "data", "subregions.js")

# Koppen-Geiger class numbering as published with the V3 maps.
CLASS = {
    1: "Af", 2: "Am", 3: "Aw", 4: "BWh", 5: "BWk", 6: "BSh", 7: "BSk",
    8: "Csa", 9: "Csb", 10: "Csc", 11: "Cwa", 12: "Cwb", 13: "Cwc",
    14: "Cfa", 15: "Cfb", 16: "Cfc", 17: "Dsa", 18: "Dsb", 19: "Dsc", 20: "Dsd",
    21: "Dwa", 22: "Dwb", 23: "Dwc", 24: "Dwd", 25: "Dfa", 26: "Dfb", 27: "Dfc",
    28: "Dfd", 29: "ET", 30: "EF",
}

# Which classes count towards each flag, and how much of a country has to be in them.
#
# `monsoon` is deliberately absent. Koppen cannot express it: a monsoon is a seasonal
# reversal of circulation, not a climate class. The obvious encoding, Am/Aw/Cwa, scores
# 100% for Ghana, 95% for Cuba and 94% for Zambia -- tropical savanna across Africa, the
# Caribbean and South America, none of it monsoon -- while China reads 12%, Pakistan 3%
# and South Korea 18%. It is wrong in both directions at once. Am alone fails the same
# way. The hand assignment encodes real knowledge of the Asian and West African monsoon
# systems that this dataset simply does not carry, so it stands.
RULES = {
    # B is the desert and steppe group. 30% missed the United States at 24%, India 26%
    # and Spain 21%, all of which have large drylands inside larger countries.
    "arid":       (("BWh", "BWk", "BSh", "BSk"), 0.20),
    # Af and Am only. Aw is tropical savanna, which has a marked dry season and so is
    # not the "persistent heat and humidity" this flag describes.
    "equatorial": (("Af", "Am"), 0.25),
    # Cs is Mediterranean by definition, but a national fraction cannot see it: the real
    # Mediterranean regions are small slices of large countries -- California is 4% of
    # the United States, the Western Cape 2% of South Africa. Dropping the threshold to
    # catch them admits Afghanistan, Iran, Iraq and Uzbekistan on mountain Csa fringes,
    # which are not the fire-and-drought archetype at all. 0.15 is chosen for precision
    # instead: at this level there are no false positives, and the countries it misses
    # are misses for a reason worth naming rather than errors worth silencing.
    "medclimate": (("Csa", "Csb", "Csc"), 0.15),
    # Subarctic continental only. Including tundra (ET/EF) pulled in Switzerland at 38%,
    # which is alpine tundra at altitude rather than the boreal-and-permafrost belt the
    # flag means, and Iceland at 92%, which has neither boreal forest nor real permafrost.
    "boreal":     (("Dfc", "Dfd", "Dwc", "Dwd"), 0.15),
}

SAMPLE_STEP = 0.25   # degrees between sample points; ~28 km at the equator
MIN_SAMPLES = 12     # below this a country is too small for the grid to describe


def load_koppen():
    """Return (array, source name) for the 0.1-degree 1991-2020 classification."""
    # PIL rather than tifffile: these GeoTIFFs are LZW-compressed, which tifffile can
    # only decode with the optional imagecodecs package. PIL is built against libtiff
    # here and reads them directly. Neither reads the geotransform, which does not
    # matter -- the grid is a plain equirectangular -180..180 by 90..-90, so pixel
    # coordinates follow from the array shape alone.
    # Read to bytes and hand PIL a BytesIO rather than the path. Opening these
    # LZW-compressed TIFFs by filename hard-crashes the interpreter in this build --
    # no traceback, exit code 9 -- because that route goes through libtiff, while the
    # in-memory route uses PIL's own decoder. The bytes are identical either way.
    from PIL import Image
    if os.path.exists(KOPPEN_TIF):
        with open(KOPPEN_TIF, "rb") as fh:
            arr = np.array(Image.open(io.BytesIO(fh.read())))
        return arr, os.path.basename(KOPPEN_TIF)
    if not os.path.exists(KOPPEN_ZIP):
        sys.exit(f"missing {KOPPEN_TIF}\n"
                 f"  and no source bundle at {KOPPEN_ZIP}\n"
                 f"  fetch: https://ndownloader.figshare.com/files/61012822 "
                 f"(Beck et al. 2023, CC BY 4.0)")
    with zipfile.ZipFile(KOPPEN_ZIP) as z:
        # 0.1 degree from the 1991-2020 observed period. The bundle also ships 1.0 and
        # 0.5 degree grids, too coarse to describe a small country, and a 1 km grid whose
        # extra detail is wasted on a whole-country fraction. Future SSP scenarios are in
        # here too and are deliberately not used: these flags describe the present.
        want = "1991_2020/koppen_geiger_0p1.tif"
        names = [n for n in z.namelist() if n.endswith(".tif")]
        name = want if want in names else min(
            (n for n in names if "1991_2020" in n),
            key=lambda n: z.getinfo(n).file_size)
        with z.open(name) as fh:
            arr = np.array(Image.open(io.BytesIO(fh.read())))
    if arr.ndim == 3:
        arr = arr[..., 0]
    return arr, name


def inside(lons, lats, rings):
    """Ray-casting point-in-polygon over a whole grid at once.

    A point is inside the polygon if it is inside the outer ring an odd number of
    times; holes flip it back out, which the parity rule handles for free.
    """
    hit = np.zeros(lons.shape, dtype=bool)
    for ring in rings:
        px = np.asarray([p[0] for p in ring])
        py = np.asarray([p[1] for p in ring])
        qx, qy = np.roll(px, -1), np.roll(py, -1)
        for x1, y1, x2, y2 in zip(px, py, qx, qy):
            if y1 == y2:
                continue
            crosses = ((y1 > lats) != (y2 > lats))
            xint = x1 + (lats - y1) * (x2 - x1) / (y2 - y1)
            hit ^= crosses & (lons < xint)
    return hit


def rings_of(geom):
    if geom["type"] == "Polygon":
        return list(geom["coordinates"])
    out = []
    for poly in geom["coordinates"]:
        out.extend(poly)
    return out


def fractions(arr, geom, bbox=None):
    """cos-latitude-weighted Koppen class fractions inside a polygon, optionally clipped.

    `bbox` restricts sampling to a [west, south, east, north] window, which is how
    subnational regions are handled: a box alone would spill Siberia into Mongolia and
    Texas into the Gulf, so the box is intersected with the parent country's polygon
    and only points satisfying both are kept. The box therefore only has to be roughly
    right, which is the whole reason it is affordable to hand-write 48 of them.
    """
    rings = rings_of(geom)
    xs = [p[0] for r in rings for p in r]
    ys = [p[1] for r in rings for p in r]
    lon0, lon1, lat0, lat1 = min(xs), max(xs), min(ys), max(ys)
    if bbox:
        bw, bs, be, bn = bbox
        lon0, lon1 = max(lon0, bw), min(lon1, be)
        lat0, lat1 = max(lat0, bs), min(lat1, bn)
        if lon0 >= lon1 or lat0 >= lat1:
            return {}, 0

    step = SAMPLE_STEP
    for _ in range(4):   # shrink the step until the country has enough points in it
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
        return {}, 0

    plon, plat = L[mask], A[mask]
    h, w = arr.shape
    col = np.clip(((plon + 180.0) / 360.0 * w).astype(int), 0, w - 1)
    row = np.clip(((90.0 - plat) / 180.0 * h).astype(int), 0, h - 1)
    vals = arr[row, col]
    wgt = np.cos(np.radians(plat))

    good = vals > 0
    vals, wgt = vals[good], wgt[good]
    total = wgt.sum()
    if not total:
        return {}, 0
    out = {}
    for v in np.unique(vals):
        out[CLASS.get(int(v), str(int(v)))] = float(wgt[vals == v].sum() / total)
    return out, int(good.sum())


def subregion_shapes():
    """{region name: [ring, ...]} from the generated admin-1 outlines.

    Where a region has real outlines, they replace the bounding-box-and-clip entirely:
    sampling inside the union of its admin-1 units is both more accurate and simpler
    than intersecting a rectangle with a country. The three regions Natural Earth has
    no admin-1 coverage for keep the box path.
    """
    if not os.path.exists(SUBREGIONS):
        return {}
    text = open(SUBREGIONS, encoding="utf-8").read()
    start = text.index("{", text.index("ECO_SUBREGIONS"))
    return json.loads(text[start:text.rindex("}") + 1])


def hand_assigned():
    """Countries keyed by ISO3, and subnational regions keyed by name with their box."""
    text = open(REGIONS, encoding="utf-8").read()
    countries, subs = {}, []
    for m in re.finditer(r"c\('([^']+)',\s*'(\w*)',\s*'\w+',\s*\[([^\]]*)\]\)", text):
        name, iso, raw = m.groups()
        if iso:
            countries[iso] = (name, set(re.findall(r"'([^']+)'", raw)))
    for m in re.finditer(
            r"s\('([^']+)',\s*'([^']+)',\s*\[([^\]]*)\],\s*\[([^\]]*)\]\)", text):
        name, parent, raw, box = m.groups()
        subs.append((name, parent,
                     set(re.findall(r"'([^']+)'", raw)),
                     [float(v) for v in box.split(",")] if box.strip() else None))
    return countries, subs


def main():
    arr, name = load_koppen()
    print(f"koppen grid {arr.shape} from {os.path.basename(name)}\n")

    with open(NE, encoding="utf-8") as fh:
        gj = json.load(fh)
    geoms = {}
    for f in gj["features"]:
        p = f["properties"]
        iso = p.get("ADM0_A3") or p.get("ISO_A3")
        if f.get("geometry") and iso and iso != "-99":
            geoms[iso] = f["geometry"]

    countries, subs = hand_assigned()
    iso_of = {nm: iso for iso, (nm, _) in countries.items()}

    shapes = subregion_shapes()
    targets = [(nm, geoms.get(iso), None, want)
               for iso, (nm, want) in sorted(countries.items(), key=lambda kv: kv[1][0])]
    # Subnational regions use their own admin-1 outlines where those exist, and
    # otherwise fall back to the parent's polygon clipped to a bounding box.
    for nm, parent, want, box in sorted(subs):
        if nm in shapes and shapes[nm]:
            targets.append((nm, {"type": "Polygon", "coordinates": shapes[nm]}, None, want))
        else:
            targets.append((nm, geoms.get(iso_of.get(parent)), box, want))

    rows, agree, hand_only, data_only = [], 0, 0, 0
    for nm, geom, box, want_all in targets:
        if geom is None:
            continue
        frac, n = fractions(arr, geom, box)
        if not frac:
            continue
        got = set()
        why = {}
        for flag, (classes, thresh) in RULES.items():
            share = sum(frac.get(c, 0.0) for c in classes)
            why[flag] = f"{share*100:.0f}% {'/'.join(classes[:3])}"
            if share >= thresh:
                got.add(flag)
        want = want_all & set(RULES)
        rows.append((nm, got, want, why, n))
        agree += len(got & want)
        hand_only += len(want - got)
        data_only += len(got - want)

    total = agree + hand_only + data_only
    print(f"{len(rows)} places (countries + subnational), climate flags ({', '.join(sorted(RULES))})")
    print(f"agree {agree} / {total}  ({100*agree/total:.0f}%)   "
          f"hand-only {hand_only}   data-only {data_only}\n")
    print(f"{'flag':13}{'agree':>7}{'hand only':>11}{'data only':>11}")
    print("-" * 42)
    for f in sorted(RULES):
        a = sum(1 for _, got, want, _, _ in rows if f in got and f in want)
        h = sum(1 for _, got, want, _, _ in rows if f in want and f not in got)
        d = sum(1 for _, got, want, _, _ in rows if f in got and f not in want)
        print(f"{f:13}{a:>7}{h:>11}{d:>11}")

    for f in sorted(RULES):
        bad = [(nm, "hand only" if f in want else "data only", why[f])
               for nm, got, want, why, _ in rows if (f in want) != (f in got)]
        if not bad:
            continue
        print(f"\n{f} -- {len(bad)} disagreement(s)")
        for nm, side, reason in sorted(bad, key=lambda x: (x[1], x[0])):
            print(f"  {nm[:28]:30}{side:11}{reason}")


if __name__ == "__main__":
    sys.exit(main())
