"""Generate data/subregions.js: real outlines for subnational regions.

    python tools/build_subregions.py

Each region is defined as a set of admin-1 units, and the generated file keeps every
unit's rings separately rather than computing a polygon union. Binding them as one
clickable group in the map gets the same result without a union algorithm, and keeping
the internal borders visible is arguably more honest anyway -- it shows what the region
is actually made of.

Fidelity is deliberately traded for tractability. The Pantanal is not Mato Grosso do
Sul, the Murray-Darling Basin is not four states, and the Cerrado spills past Goias. But
a state boundary is a real line in the right place, which a rectangle never was: the
Western Ghats box had to include the dry Deccan interior behind the range, and Kerala's
box could not avoid the rain shadow. Named units get that much closer for free.

Natural Earth 1:110m has no admin-1 layer, and 1:50m carries only nine countries -- but
those nine happen to include all eight this project subdivides. Scotland, Northern
England and the Ruhr are not covered and keep their bounding boxes, so the map and the
derivation both have to handle either representation.

Licensing note: Natural Earth admin-0 is unambiguously public domain, but admin-1 is the
one theme partly informed by GADM, which forbids commercial use. Natural Earth's own
guidance is to drop the affected attribute columns. This keeps geometry, the ISO
subdivision code and nothing else, which is that guidance followed rather than ignored.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "geo-cache", "ne_50m_admin_1_states_provinces.geojson")
OUT = os.path.join(HERE, os.pardir, "data", "subregions.js")

PRECISION = 2
MIN_RING_POINTS = 4
MIN_RING_SPAN = 0.25   # finer than the world map: these are drawn zoomed in
SIMPLIFY_TOL = 0.05    # degrees, roughly 5 km -- sub-pixel at single-country zoom

# region name -> ISO 3166-2 subdivision codes. Matched on code, not name, because the
# names carry accents (Quebec, Goias, Para) that encode inconsistently.
REGIONS = {
    # Canada
    'Atlantic Canada': ['CA-NB', 'CA-NS', 'CA-PE', 'CA-NL'],
    'British Columbia, Canada': ['CA-BC'],
    'Northern Canada': ['CA-YT', 'CA-NT', 'CA-NU'],
    'Ontario, Canada': ['CA-ON'],
    'Prairies, Canada': ['CA-AB', 'CA-SK', 'CA-MB'],
    'Quebec, Canada': ['CA-QC'],
    # Australia. The Murray-Darling is a basin, not a set of states; these four are the
    # states it drains, which overstates it westward into arid South Australia.
    'Murray-Darling Basin, Australia': ['AU-NSW', 'AU-VIC', 'AU-ACT', 'AU-SA'],
    'Queensland, Australia': ['AU-QLD'],
    'Tasmania, Australia': ['AU-TAS'],
    'Top End, Australia': ['AU-NT'],
    'Western Australia': ['AU-WA'],
    # Brazil. Pantanal is the weakest fit here: the wetland is a fraction of Mato Grosso
    # do Sul, but using that one state at least keeps it out of the Cerrado's units.
    'Amazonia, Brazil': ['BR-AM', 'BR-PA', 'BR-AC', 'BR-RO', 'BR-RR', 'BR-AP'],
    'Atlantic Coast, Brazil': ['BR-SP', 'BR-RJ', 'BR-ES', 'BR-PR', 'BR-SC', 'BR-RS'],
    'Cerrado, Brazil': ['BR-GO', 'BR-DF', 'BR-TO', 'BR-MT', 'BR-MG'],
    'Northeast Sertao, Brazil': ['BR-BA', 'BR-PE', 'BR-CE', 'BR-PI', 'BR-MA',
                                 'BR-RN', 'BR-PB', 'BR-AL', 'BR-SE'],
    'Pantanal, Brazil': ['BR-MS'],
    # India
    'Deccan Plateau, India': ['IN-KA', 'IN-TG', 'IN-AP', 'IN-MH'],
    'Indo-Gangetic Plain, India': ['IN-UP', 'IN-BR', 'IN-HR', 'IN-DL', 'IN-UT'],
    'Punjab, India': ['IN-PB', 'IN-CH'],
    'Rajasthan, India': ['IN-RJ'],
    'Western Ghats & Kerala, India': ['IN-KL', 'IN-GA'],
    'West Bengal & Sundarbans, India': ['IN-WB'],
    # China
    'Inner Mongolia, China': ['CN-NM'],
    'North China Plain, China': ['CN-HE', 'CN-SD', 'CN-HA', 'CN-BJ', 'CN-TJ'],
    'Northeast China': ['CN-HL', 'CN-JL', 'CN-LN'],
    'Pearl River Delta, China': ['CN-GD'],
    'Tibetan Plateau, China': ['CN-XZ', 'CN-QH'],
    'Xinjiang, China': ['CN-XJ'],
    'Yangtze Delta, China': ['CN-JS', 'CN-SH', 'CN-ZJ'],
    # Indonesia
    'Java, Indonesia': ['ID-JB', 'ID-JT', 'ID-JI', 'ID-BT', 'ID-JK', 'ID-YO'],
    'Kalimantan, Indonesia': ['ID-KB', 'ID-KS', 'ID-KT', 'ID-KI'],
    'Papua, Indonesia': ['ID-PA', 'ID-PB'],
    'Sulawesi, Indonesia': ['ID-SR', 'ID-SN', 'ID-ST', 'ID-SG', 'ID-SA', 'ID-GO'],
    'Sumatra, Indonesia': ['ID-AC', 'ID-SU', 'ID-SB', 'ID-RI', 'ID-JA', 'ID-SS',
                           'ID-BE', 'ID-LA', 'ID-BB', 'ID-KR'],
    # Russia. Split at the Urals and then by federal-district logic; Sakha is put in
    # Siberia rather than the Far East, which is arguable either way.
    'European Russia': ['RU-MOW', 'RU-MOS', 'RU-SPE', 'RU-LEN', 'RU-BEL', 'RU-BRY',
                        'RU-IVA', 'RU-KLU', 'RU-KOS', 'RU-KRS', 'RU-LIP', 'RU-NGR',
                        'RU-NIZ', 'RU-ORL', 'RU-PNZ', 'RU-PSK', 'RU-RYA', 'RU-SAM',
                        'RU-SAR', 'RU-SMO', 'RU-TAM', 'RU-TUL', 'RU-TVE', 'RU-ULY',
                        'RU-VLA', 'RU-VGG', 'RU-VOR', 'RU-YAR', 'RU-VLG', 'RU-KIR',
                        'RU-TA', 'RU-CU', 'RU-ME', 'RU-MO', 'RU-UD', 'RU-BA',
                        'RU-ORE', 'RU-KDA', 'RU-ROS', 'RU-AST', 'RU-KL', 'RU-STA',
                        'RU-AD', 'RU-KB', 'RU-KC', 'RU-SE', 'RU-IN', 'RU-CE',
                        'RU-DA', 'RU-KGD'],
    'Russian Arctic': ['RU-MUR', 'RU-NEN', 'RU-YAN', 'RU-CHU', 'RU-ARK', 'RU-KO'],
    'Russian Far East': ['RU-PRI', 'RU-KHA', 'RU-AMU', 'RU-SAK', 'RU-KAM',
                         'RU-MAG', 'RU-YEV'],
    'Siberia, Russia': ['RU-KYA', 'RU-IRK', 'RU-NVS', 'RU-OMS', 'RU-TOM', 'RU-KEM',
                        'RU-ALT', 'RU-AL', 'RU-TY', 'RU-BU', 'RU-ZAB', 'RU-KK',
                        'RU-SA', 'RU-TYU', 'RU-KHM', 'RU-SVE', 'RU-CHE', 'RU-KGN',
                        'RU-PER'],
    # United States
    'Alaska, USA': ['US-AK'],
    'California, USA': ['US-CA'],
    'Florida, USA': ['US-FL'],
    'Great Lakes, USA': ['US-MI', 'US-WI', 'US-IL', 'US-IN', 'US-OH', 'US-MN'],
    'Great Plains, USA': ['US-ND', 'US-SD', 'US-NE', 'US-KS', 'US-OK', 'US-MT',
                          'US-WY', 'US-CO'],
    'New York, USA': ['US-NY'],
    'Texas, USA': ['US-TX'],
}


def rings_of(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"][0]]
    return [poly[0] for poly in geom["coordinates"]]


def simplify(pts, tol):
    """Douglas-Peucker, iterative so a long coastline cannot blow the stack.

    Rounding alone left 54,000 points and a 784 KB file. These outlines are only ever
    drawn zoomed to one country, where a 5 km tolerance is well under a pixel.
    """
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        x1, y1 = pts[i]
        x2, y2 = pts[j]
        dx, dy = x2 - x1, y2 - y1
        norm = (dx * dx + dy * dy) ** 0.5
        best, bi = -1.0, -1
        for k in range(i + 1, j):
            x0, y0 = pts[k]
            d = (abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / norm) if norm else \
                ((x0 - x1) ** 2 + (y0 - y1) ** 2) ** 0.5
            if d > best:
                best, bi = d, k
        if best > tol:
            keep[bi] = True
            stack.append((i, bi))
            stack.append((bi, j))
    return [p for p, k in zip(pts, keep) if k]


def clean(ring):
    out, last = [], None
    for pt in ring:
        p = [round(pt[0], PRECISION), round(pt[1], PRECISION)]
        if p != last:
            out.append(p)
            last = p
    out = simplify(out, SIMPLIFY_TOL)
    if len(out) < MIN_RING_POINTS:
        return None
    xs = [p[0] for p in out]
    ys = [p[1] for p in out]
    if max(xs) - min(xs) < MIN_RING_SPAN and max(ys) - min(ys) < MIN_RING_SPAN:
        return None
    return out


def main():
    with open(SRC, encoding="utf-8") as fh:
        gj = json.load(fh)

    by_code = {}
    for f in gj["features"]:
        code = f["properties"].get("iso_3166_2")
        if code and f.get("geometry"):
            by_code.setdefault(code, []).extend(rings_of(f["geometry"]))

    out, missing = {}, []
    for region, codes in REGIONS.items():
        rings = []
        for c in codes:
            if c not in by_code:
                missing.append(f"{region} <- {c}")
                continue
            rings.extend(r for r in (clean(r) for r in by_code[c]) if r)
        if rings:
            out[region] = rings

    body = json.dumps(out, separators=(",", ":"), ensure_ascii=False)
    header = ("/* GENERATED by tools/build_subregions.py -- do not edit by hand.\n"
              " * Natural Earth 1:50m admin-1, geometry and nothing else (see the\n"
              " * builder for the licensing reason). Region name -> list of rings,\n"
              " * one region being several admin-1 units kept separate rather than\n"
              " * unioned. lon/lat, 2 decimals. */\n")
    with open(OUT, "w", encoding="utf-8", newline="") as fh:
        fh.write(header + "window.ECO_SUBREGIONS = " + body + ";\n")

    pts = sum(len(r) for v in out.values() for r in v)
    print(f"{len(out)}/{len(REGIONS)} regions, "
          f"{sum(len(v) for v in out.values())} rings, {pts} points "
          f"-> {os.path.getsize(OUT)/1024:.0f} KB")
    if missing:
        print("unmatched codes:", *missing, sep="\n  ")


if __name__ == "__main__":
    main()
