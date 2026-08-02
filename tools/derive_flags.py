"""Prototype: derive region flags from open data instead of assigning them by hand.

    python tools/derive_flags.py

Scope is deliberately small. It runs on a 14-place sample and only on flags needing no
geospatial stack ("Tier A"), because the question right now is whether algorithmic
assignment agrees with the hand-assigned data well enough to trust -- not to repopulate
anything. The regional hierarchy is being restructured next, which will change what a
"place" is, so bulk derivation waits for that.

What this does NOT do is remove judgement. It replaces 124 per-place decisions with one
threshold per flag. That is a large gain in consistency and reviewability, not an
elimination of choice, and every threshold is a named constant below so it can be
argued with.

Output is a disagreement report. A disagreement is not automatically an error in the
hand data -- some are errors in the rule, which is the point. `highlat` deliberately
uses capital-city latitude, a proxy known to be wrong for Canada (Ottawa sits at 45N
while most of the country is far north). If the report does not flag Canada, the report
is broken.

Data: World Bank Indicators API bulk CSV, one zip per indicator covering every country,
cached under tools/wb-cache/. Per-country queries were tried first and are the wrong
shape -- 84 requests for 14 countries, and the API throttles hard enough to stall.
Fertiliser and land-use series are FAO data republished by the World Bank.

Known measurement caveats, both visible in the sample:
  * AG.CON.FERT.ZS is per hectare of ARABLE land, so pastoral economies read absurdly
    high -- Ireland 896 kg/ha against the Netherlands' 238, which inverts the truth
    about which is the more intensive system. Guarded with an arable-share floor below,
    but the honest fix is a per-agricultural-hectare measure.
  * Mineral rents as % of GDP is an economic proxy for `mining`. Mining land area from
    Maus et al. 2022 (PANGAEA, CC BY-SA 4.0) is the physical measure and ships a
    per-country summary; it should replace this before any full run.
"""
import csv
import io
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "wb-cache")
REGIONS = os.path.join(HERE, os.pardir, "data", "regions.js")

# A spread rather than a random draw: the pair the locale audit found indistinguishable
# (Ireland/Uruguay), the two thinnest places (Austria/Switzerland), the heterogeneous
# giants that motivate the hierarchy work (USA/China/Brazil/Canada), and places whose
# profile rests on one dominant feature (Zambia, Mongolia, Chile, Egypt, Bangladesh).
SAMPLE = {
    "Ireland": "IRL", "Uruguay": "URY", "Netherlands": "NLD", "Austria": "AUT",
    "Switzerland": "CHE", "United States": "USA", "China": "CHN", "Brazil": "BRA",
    "Egypt": "EGY", "Zambia": "ZMB", "Chile": "CHL", "Mongolia": "MNG",
    "Bangladesh": "BGD", "Canada": "CAN",
}

INDICATORS = {
    "fertiliser": "AG.CON.FERT.ZS",        # kg per hectare of arable land
    "arable_pct": "AG.LND.ARBL.ZS",        # arable land, % of land area
    "agri_pct": "AG.LND.AGRI.ZS",          # agricultural land incl. pasture, % of land
    "largest_city": "EN.URB.LCTY",         # population in largest city
    "mineral_rents": "NY.GDP.MINR.RT.ZS",  # mineral rents, % of GDP
}

# One judgement per flag instead of one per place.
#
# Two axes, deliberately: fertiliser per arable hectare says how INTENSIVE the farming
# is, agricultural land share says whether farming is EXTENSIVE enough to shape the
# place. The first version gated extent on *arable* share and got 8 of 14 wrong,
# because arable share measures how much of a country is not desert, tundra or forest
# rather than how hard it farms -- it rejected Ireland (6% arable, all pasture),
# Brazil (7%) and China (11.5%, missing a 12% floor by half a point).
T_FERTILISER = 100.0   # kg/ha arable -- separates high-input from extensive systems
T_AGRI_PCT = 15.0      # % land area under agriculture incl. pasture
T_LARGEST_CITY = 5e6   # people in the largest urban agglomeration
T_MINERAL_RENTS = 2.0  # % of GDP
T_HIGHLAT = 50.0       # degrees; capital latitude, a knowingly weak proxy

# Capital-city latitude, from the World Bank country endpoint. Inlined for the sample so
# the prototype needs no second network source; the full run should take it from
# Natural Earth polygon centroids, or better, a population-weighted centroid.
CAPITAL_LAT = {
    "IRL": 53.3, "URY": -34.9, "NLD": 52.4, "AUT": 48.2, "CHE": 46.9, "USA": 38.9,
    "CHN": 40.0, "BRA": -15.8, "EGY": 30.1, "ZMB": -15.4, "CHL": -33.5, "MNG": 47.9,
    "BGD": 23.7, "CAN": 45.4,
}

LANDLOCKED = {"AUT", "CHE", "MNG", "ZMB"}
SIDS = set()   # none in this sample

DERIVABLE = {"agriculture", "megacity", "mining", "highlat", "landlocked",
             "coastal", "sids"}


def load_indicator(code):
    """Latest non-empty value per ISO3 from a cached World Bank bulk CSV zip."""
    path = os.path.join(CACHE, code + ".zip")
    if not os.path.exists(path):
        return None
    with zipfile.ZipFile(path) as z:
        name = next(n for n in z.namelist() if n.startswith("API_"))
        rows = list(csv.reader(io.StringIO(z.read(name).decode("utf-8-sig"))))
    header = rows[4]
    out = {}
    for r in rows[5:]:
        if len(r) < 5:
            continue
        vals = [(header[i], r[i]) for i in range(4, min(len(r), len(header)))
                if r[i].strip()]
        if vals:
            year, v = vals[-1]
            try:
                out[r[1]] = (float(v), year)
            except ValueError:
                pass
    return out


def hand_assigned():
    """Country rows from data/regions.js as {name: (iso3, flags)}.

    Reads the ISO code straight out of the hierarchy, which is why it is stored there:
    the join key for every open dataset keyed by country lives in one place, and a
    country added to the map is automatically in scope for derivation. Only c() rows
    are read -- merged groups have no single ISO, and subnational regions are out of
    reach of country-level series entirely.
    """
    text = open(REGIONS, encoding="utf-8").read()
    out = {}
    for m in re.finditer(r"c\('([^']+)',\s*'(\w*)',\s*'(\w+)',\s*\[([^\]]*)\]\)", text):
        name, iso, _income, raw = m.groups()
        out[name] = (iso, set(re.findall(r"'([^']+)'", raw)))
    return out


def main():
    data, absent = {}, []
    for key, code in INDICATORS.items():
        d = load_indicator(code)
        if d is None:
            absent.append(code)
        data[key] = d or {}
    if absent:
        print("missing from tools/wb-cache/ (download still running?): "
              + ", ".join(absent) + "\n", file=sys.stderr)

    hand = hand_assigned()
    unknown = [n for n in SAMPLE if n not in hand]
    if unknown:
        print("not in data/regions.js (renamed or merged away?): "
              + ", ".join(unknown) + "\n", file=sys.stderr)
    mismatched = [f"{n}: sample={i} regions.js={hand[n][0]}"
                  for n, i in SAMPLE.items() if n in hand and hand[n][0] != i]
    if mismatched:
        print("ISO mismatch: " + "; ".join(mismatched) + "\n", file=sys.stderr)

    rows, agree, hand_only, data_only = [], 0, 0, 0

    for name, iso in SAMPLE.items():
        cont, got, why = {}, set(), {}

        fert = data["fertiliser"].get(iso)
        arable = data["arable_pct"].get(iso)
        agri = data["agri_pct"].get(iso)
        if fert:
            cont["fert_kg_ha"] = round(fert[0], 1)
        if arable:
            cont["arable_pct"] = round(arable[0], 1)
        if agri:
            cont["agri_pct"] = round(agri[0], 1)
        if fert and agri:
            if fert[0] >= T_FERTILISER and agri[0] >= T_AGRI_PCT:
                got.add("agriculture")
            why["agriculture"] = (f"{fert[0]:.0f} kg/ha intensity, "
                                  f"{agri[0]:.0f}% of land farmed")

        city = data["largest_city"].get(iso)
        if city:
            cont["largest_city_m"] = round(city[0] / 1e6, 2)
            if city[0] >= T_LARGEST_CITY:
                got.add("megacity")
            why["megacity"] = f"largest city {city[0]/1e6:.1f}M"

        rents = data["mineral_rents"].get(iso)
        if rents:
            cont["mineral_rents_pct"] = round(rents[0], 2)
            if rents[0] >= T_MINERAL_RENTS:
                got.add("mining")
            why["mining"] = f"mineral rents {rents[0]:.1f}% of GDP"

        lat = CAPITAL_LAT.get(iso)
        if lat is not None:
            cont["capital_lat"] = lat
            if abs(lat) >= T_HIGHLAT:
                got.add("highlat")
            why["highlat"] = f"capital at {lat:.0f} deg"

        got.add("landlocked" if iso in LANDLOCKED else "coastal")
        if iso in SIDS:
            got.add("sids")

        want = hand.get(name, ("", set()))[1] & DERIVABLE
        rows.append((name, cont, got, want, why))
        agree += len(got & want)
        hand_only += len(want - got)
        data_only += len(got - want)

    print(f"{len(SAMPLE)} places, Tier A only ({', '.join(sorted(DERIVABLE))})\n")
    print(f"{'place':15}{'derived':42}{'hand only':20}{'data only'}")
    print("-" * 100)
    for name, cont, got, want, why in rows:
        print(f"{name:15}{','.join(sorted(got))[:41]:42}"
              f"{','.join(sorted(want - got))[:19]:20}{','.join(sorted(got - want))}")

    total = agree + hand_only + data_only
    print(f"\nagree {agree} / {total}   hand-only {hand_only}   data-only {data_only}")

    print("\ndisagreements")
    for name, cont, got, want, why in rows:
        for f in sorted(want ^ got):
            side = "hand only" if f in want else "data only"
            print(f"  {name:14} {f:12} {side:10} {why.get(f, 'no measure')}")

    print("\ncontinuous values kept (the booleans above are a thresholded view)")
    for name, cont, got, want, why in rows:
        print(f"  {name:14} " + "  ".join(f"{k}={v}" for k, v in cont.items()))


if __name__ == "__main__":
    sys.exit(main())
