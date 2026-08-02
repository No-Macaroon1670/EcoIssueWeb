"""Derive region flags from open data instead of assigning them by hand.

    python tools/derive_flags.py

Runs over all 101 countries in data/regions.js, on the flags that need no geospatial
stack ("Tier A"): agriculture, coastal, highlat, landlocked, megacity, mining, sids.
Subnational regions are out of reach -- the join is on ISO3 and country-level series
have no subnational breakdown -- and the remaining flags (arid, monsoon, boreal,
medclimate, equatorial, reef, tropicalforest, freshwater, freezethaw, glacierfed,
lowlying, cyclone) need raster sources.

Agreement with the hand data is 242/254. The twelve disagreements are all deliberate
overrides, listed and justified in the header of data/regions.js. They are kept as
live disagreements rather than suppressed here, so each one has to keep earning itself
every time this runs.

What this does NOT do is remove judgement. It replaces a per-place decision for every
country with one threshold per flag. That is a large gain in consistency and
reviewability, not an elimination of choice, and every threshold is a named constant
below so it can be argued with.

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
import json
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "wb-cache")
REGIONS = os.path.join(HERE, os.pardir, "data", "regions.js")

# Every country in the hierarchy. The 14-place sample this replaced did its job: it
# found that fertiliser needed an agricultural rather than arable denominator, that
# capital latitude was unusable, and that mineral rents could not see American or
# Chinese mining. Those are fixed, so the run is now worth doing at full width.

INDICATORS = {
    "fertiliser": "AG.CON.FERT.ZS",        # kg per hectare of arable land
    "arable_pct": "AG.LND.ARBL.ZS",        # arable land, % of land area
    "agri_pct": "AG.LND.AGRI.ZS",          # agricultural land incl. pasture, % of land
    "largest_city": "EN.URB.LCTY",         # population in largest city
    "land_area": "AG.LND.TOTL.K2",         # land area, sq km -- denominator for mining
}

GEO = os.path.join(HERE, "geo-cache")
# Physical mining land area per country -- open cuts, tailings dams, waste rock dumps
# and processing infrastructure. Maus et al. 2022, PANGAEA, CC BY-SA 4.0. Replaces
# mineral rents as % of GDP, which read 0.1% for the United States and 0.5% for China
# though both are among the largest miners on earth.
MAUS = os.path.join(GEO, "global_mining_area_per_country_v2.csv")
# Natural Earth 1:110m admin-0 polygons, public domain. Used only for latitude, which
# is all the capital-city proxy was ever standing in for.
NE = os.path.join(GEO, "ne_110m_admin_0_countries.geojson")

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
# Cropland dominance qualifies on its own. Ukraine farms 56% of its land area as arable
# at a moderate 65 kg/ha, and on an intensity-only rule stops counting as an agricultural
# landscape -- but habitat loss, monoculture and soil degradation, which is what this
# flag feeds, follow how much of a country is under the plough as much as how hard.
#
# Measured on ARABLE share, not agricultural share. The first attempt used the latter
# at 65% and was plainly wrong: FAO counts permanent meadow and pasture, so it admitted
# Mongolia (72% "agricultural", 38 kg/ha), Kazakhstan (79%, 4 kg/ha) and Somalia (70%,
# 1 kg/ha), which are open rangeland rather than farming. Arable share is the measure
# that means cropland.
T_ARABLE_DOMINANT = 40.0
T_LARGEST_CITY = 5e6   # people in the largest urban agglomeration

# Mining passes on either axis. Absolute area alone misses Zambia and Papua New Guinea,
# where mining is small in world terms and enormous locally; share alone misses the
# United States and China, where it is the reverse. An OR is what the flag means.
T_MINING_KM2 = 250.0    # sq km of mining land use
# Share was 0.0004 on the 14-place sample and proved far too loose at full width: it
# admitted South Korea at 0.040% and Portugal at 0.044%, neither of which is a mining
# country, and would have put the flag on roughly half the world. 0.001 keeps the cases
# the absolute threshold misses -- Guyana 1.13%, Myanmar 0.33%, Jamaica 0.24% -- without
# diluting a flag that only earns its place by being selective.
T_MINING_SHARE = 0.001

# Median vertex latitude of the country polygon, replacing capital-city latitude. The
# threshold is 58 rather than the 50 the old flag label advertised, because the flag
# means Arctic amplification -- warming two to four times the global rate -- and Ireland
# at 53 and the Netherlands at 52 clear 50 without being remotely subarctic. At 58,
# Canada (median 69), Norway (70), Finland (66) and Russia (62) pass and those two do not.
T_HIGHLAT = 58.0

# The standard landlocked list. Not derivable from the polygons -- sharing a border
# with a lake or an inland sea is not the same as a coastline, and Kazakhstan on the
# Caspian is the case that breaks any naive test.
LANDLOCKED = {
    "AFG", "AND", "ARM", "AUT", "AZE", "BLR", "BOL", "BWA", "BFA", "BDI", "CAF",
    "TCD", "CZE", "SWZ", "ETH", "HUN", "KAZ", "KGZ", "LAO", "LSO", "LIE", "LUX",
    "MWI", "MLI", "MDA", "MNG", "NPL", "NER", "MKD", "PRY", "RWA", "SMR", "SRB",
    "SVK", "SSD", "CHE", "TJK", "TKM", "UGA", "UZB", "VAT", "ZMB", "ZWE",
}

# UN small island developing states. Included knowing it is a political list rather
# than a physical archetype -- it counts Singapore, Papua New Guinea and Guyana, none
# of which match "little high ground, thin aquifers, import dependence" the way an
# atoll does. Disagreements against the hand data are expected here and are judged
# rather than adopted.
SIDS = {
    "ATG", "BHS", "BRB", "BLZ", "CPV", "COM", "CUB", "DMA", "DOM", "FJI", "GRD",
    "GNB", "GUY", "HTI", "JAM", "KIR", "MDV", "MHL", "FSM", "NRU", "PLW", "PNG",
    "WSM", "STP", "SGP", "SYC", "SLB", "KNA", "LCA", "VCT", "SUR", "TLS", "TON",
    "TTO", "TUV", "VUT", "PRI",
}

DERIVABLE = {"agriculture", "megacity", "mining", "highlat", "landlocked",
             "coastal", "sids"}


RECENT_YEARS = 5


def load_indicator(code):
    """Median of the last RECENT_YEARS non-empty values per ISO3.

    Median, not latest. These flags describe a structural archetype, and the latest
    single year makes them track shocks instead. Hungary ran 151, 146, 163, 165 kg/ha
    of fertiliser through 2021, then 108 and 90 as the 2022 gas crisis hit ammonia
    production -- on a latest-value rule it stops being an intensive-agriculture country
    because of one year of energy prices. Ukraine shows the same shape from the war,
    65-78 through 2021 then 56 and 43.

    Ukraine still fails the threshold on the median, which is the right answer for a
    different reason: it farms a lot of land at genuinely moderate input. The median
    only removes the shock, it does not invent an archetype.
    """
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
        vals = []
        for i in range(4, min(len(r), len(header))):
            if r[i].strip():
                try:
                    vals.append((header[i], float(r[i])))
                except ValueError:
                    pass
        if not vals:
            continue
        window = vals[-RECENT_YEARS:]
        nums = sorted(v for _, v in window)
        med = nums[len(nums) // 2] if len(nums) % 2 else (nums[len(nums)//2 - 1] + nums[len(nums)//2]) / 2
        out[r[1]] = (med, f"{window[0][0]}-{window[-1][0]}")
    return out


def mining_area():
    """{iso3: sq km of mining land use} from the Maus et al. per-country summary."""
    if not os.path.exists(MAUS):
        return {}
    with open(MAUS, encoding="utf-8") as fh:
        return {r["ISO3_CODE"]: float(r["AREA"]) for r in csv.DictReader(fh)}


def median_latitude():
    """{iso3: median latitude of the country's polygon vertices}.

    Median rather than mean because a handful of remote islands should not drag a
    country north, and vertex-based rather than area-weighted because true area
    weighting needs a projection library this deliberately avoids. Good enough for a
    threshold
    that only has to separate subarctic from temperate.
    """
    if not os.path.exists(NE):
        return {}
    with open(NE, encoding="utf-8") as fh:
        gj = json.load(fh)
    out = {}
    for feat in gj["features"]:
        lats = []

        def walk(coords):
            if isinstance(coords[0], (int, float)):
                lats.append(coords[1])
            else:
                for c in coords:
                    walk(c)

        if not feat.get("geometry"):
            continue
        walk(feat["geometry"]["coordinates"])
        if not lats:
            continue
        lats.sort()
        props = feat["properties"]
        iso = props.get("ADM0_A3") or props.get("ISO_A3")
        if iso and iso != "-99":
            out[iso] = lats[len(lats) // 2]
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

    mining = mining_area()
    latitude = median_latitude()
    for label, d, path in (("Maus mining area", mining, MAUS),
                           ("Natural Earth latitude", latitude, NE)):
        if not d:
            print(f"missing {label}: {path}\n", file=sys.stderr)

    hand = hand_assigned()
    targets = {n: v[0] for n, v in sorted(hand.items()) if v[0]}
    noiso = [n for n, v in hand.items() if not v[0]]
    if noiso:
        print("no ISO3, skipped: " + ", ".join(noiso) + "\n", file=sys.stderr)

    rows, agree, hand_only, data_only = [], 0, 0, 0

    for name, iso in targets.items():
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
            intensive = fert[0] >= T_FERTILISER and agri[0] >= T_AGRI_PCT
            dominant = bool(arable) and arable[0] >= T_ARABLE_DOMINANT
            if intensive or dominant:
                got.add("agriculture")
            why["agriculture"] = (f"{fert[0]:.0f} kg/ha intensity, "
                                  f"{agri[0]:.0f}% of land farmed"
                                  + (" [extent]" if dominant and not intensive else ""))

        city = data["largest_city"].get(iso)
        if city:
            cont["largest_city_m"] = round(city[0] / 1e6, 2)
            if city[0] >= T_LARGEST_CITY:
                got.add("megacity")
            why["megacity"] = f"largest city {city[0]/1e6:.1f}M"

        km2 = mining.get(iso)
        land = data["land_area"].get(iso)
        if km2 is not None:
            cont["mining_km2"] = round(km2, 1)
            share = km2 / land[0] if land and land[0] else None
            if share is not None:
                cont["mining_share_pct"] = round(share * 100, 4)
            if km2 >= T_MINING_KM2 or (share is not None and share >= T_MINING_SHARE):
                got.add("mining")
            why["mining"] = (f"{km2:.0f} km2 mined"
                             + (f", {share*100:.3f}% of land" if share is not None else ""))

        lat = latitude.get(iso)
        if lat is not None:
            cont["median_lat"] = round(lat, 1)
            if abs(lat) >= T_HIGHLAT:
                got.add("highlat")
            why["highlat"] = f"median latitude {lat:.0f} deg"

        got.add("landlocked" if iso in LANDLOCKED else "coastal")
        if iso in SIDS:
            got.add("sids")

        want = hand.get(name, ("", set()))[1] & DERIVABLE
        rows.append((name, cont, got, want, why))
        agree += len(got & want)
        hand_only += len(want - got)
        data_only += len(got - want)

    total = agree + hand_only + data_only
    print(f"{len(targets)} countries, Tier A flags "
          f"({', '.join(sorted(DERIVABLE))})")
    print(f"agree {agree} / {total}  ({100*agree/total:.0f}%)   "
          f"hand-only {hand_only}   data-only {data_only}\n")

    # Per flag, because the flags fail in different ways and a single number hides that.
    print(f"{'flag':14}{'agree':>7}{'hand only':>11}{'data only':>11}")
    print("-" * 43)
    for f in sorted(DERIVABLE):
        a = sum(1 for _, _, got, want, _ in rows if (f in got) == (f in want) and f in got)
        h = sum(1 for _, _, got, want, _ in rows if f in want and f not in got)
        d = sum(1 for _, _, got, want, _ in rows if f in got and f not in want)
        print(f"{f:14}{a:>7}{h:>11}{d:>11}")

    for f in sorted(DERIVABLE):
        bad = [(n, "hand only" if f in want else "data only", why.get(f, "no measure"))
               for n, cont, got, want, why in rows if (f in want) != (f in got)]
        if not bad:
            continue
        print(f"\n{f} -- {len(bad)} disagreement(s)")
        for n, side, reason in sorted(bad, key=lambda x: (x[1], x[0])):
            print(f"  {n[:28]:30}{side:11}{reason}")


if __name__ == "__main__":
    sys.exit(main())
