"""Generate c() entries for every country the map draws but has no profile for.

    python tools/suggest_places.py > /tmp/new_places.txt

The world map greys out any country without a profile, and 95 of them were grey. Writing
those by hand would be roughly 1,400 flag decisions. Instead this reuses the three
derivation tools already in the repo, so 15 of the 19 flags come from data:

  coastal, landlocked, sids, highlat, agriculture, megacity, mining   derive_flags
  arid, boreal, equatorial, medclimate                                derive_climate
  lowlying, freezethaw, tropicalforest, cyclone                       derive_physical

The remaining four -- monsoon, reef, glacierfed, freshwater -- have no derivation and
are left off. They have to be added by hand where they apply, and the omission is
visible rather than silent: a new country simply lacks them until someone looks.

Output is c() lines grouped by continent, ready to paste into data/regions.js. It is a
suggestion, not an edit: nothing here writes to the data file, because a generated
profile for 95 countries deserves reading before it lands.
"""
import csv
import io
import json
import os
import re
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import derive_flags as DF          # noqa: E402
import derive_climate as DC        # noqa: E402
import derive_physical as DP       # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
NE = os.path.join(HERE, "geo-cache", "ne_110m_admin_0_countries.geojson")
WORLD = os.path.join(HERE, os.pardir, "data", "world.js")
REGIONS = os.path.join(HERE, os.pardir, "data", "regions.js")

# No permanent civilian population -- research stations, military bases, or fewer than
# a hundred residents. These stay grey on the map on purpose: the panel asks how the
# issues land where you live, and inventing a profile for somewhere nobody lives would
# be filling in the picture rather than the data.
UNINHABITED = {"ATF", "SGS", "PCN", "IOT"}

INCOME_MAP = {"High income": "high", "Upper middle income": "upper",
              "Lower middle income": "lower", "Low income": "low"}

# Natural Earth abbreviates for label space and uses a few non-ISO codes of its own.
# A picker needs the name someone would look for.
NAME_FIX = {
    "Central African Rep.": "Central African Republic", "Eq. Guinea": "Equatorial Guinea",
    "S. Sudan": "South Sudan", "W. Sahara": "Western Sahara", "N. Cyprus": "Northern Cyprus",
    "Bosnia and Herz.": "Bosnia and Herzegovina", "Dem. Rep. Congo": "DR Congo",
    "Solomon Is.": "Solomon Islands", "Fr. Polynesia": "French Polynesia",
    "N. Mariana Is.": "Northern Mariana Islands", "Cook Is.": "Cook Islands",
    "Faeroe Is.": "Faroe Islands", "Turks and Caicos Is.": "Turks and Caicos Islands",
    "St. Pierre and Miquelon": "Saint Pierre and Miquelon",
    "Br. Indian Ocean Ter.": "British Indian Ocean Territory",
    "Côte d'Ivoire": "Ivory Coast",   # also avoids an apostrophe in a JS string literal
}

# Natural Earth's own codes for places without a settled ISO3, which the standard
# landlocked list does not carry.
EXTRA_LANDLOCKED = {"SDS", "KOS"}     # South Sudan, Kosovo

# UN SIDS members that are not small islands. The same political-vs-physical mismatch
# already documented for Singapore, Guyana and Papua New Guinea in data/regions.js.
NOT_SIDS = {"GNB", "BLZ", "SUR", "GUY", "PNG", "SGP", "TLS"}


def world_data():
    text = open(WORLD, encoding="utf-8").read()
    start = text.index("{", text.index("ECO_WORLD"))
    return json.loads(text[start:text.rindex("}") + 1])


def have_isos():
    text = open(REGIONS, encoding="utf-8").read()
    out = set(re.findall(r"c\('[^']+',\s*'(\w{3})'", text))
    names = world_data()["names"]
    for m in re.finditer(r"g\('[^']+',\s*'\w+',\s*\[[^\]]*\],\s*\[([^\]]*)\]\)", text):
        for nm in re.findall(r"'([^']+)'", m.group(1)):
            if nm in names:
                out.add(names[nm])
    return out


def income_and_region():
    """{iso3: (income key, World Bank region)} from any indicator zip's metadata file."""
    for name in os.listdir(DF.CACHE):
        if not name.endswith(".zip"):
            continue
        with zipfile.ZipFile(os.path.join(DF.CACHE, name)) as z:
            meta = [n for n in z.namelist() if n.startswith("Metadata_Country")]
            if not meta:
                continue
            rows = list(csv.DictReader(
                io.StringIO(z.read(meta[0]).decode("utf-8-sig"))))
        out = {}
        for r in rows:
            iso = r.get("Country Code")
            inc = INCOME_MAP.get((r.get("IncomeGroup") or "").strip())
            if iso and inc:
                out[iso] = (inc, (r.get("Region") or "").strip())
        if out:
            return out
    return {}


CONTINENT = {
    "Africa": "Africa", "Asia": "Asia", "Europe": "Europe",
    "North America": "Americas", "South America": "Americas",
    "Oceania": "Oceania", "Seven seas (open ocean)": "Small island states",
}


def main():
    W = world_data()
    have = have_isos()
    isoname = {v: k for k, v in W["names"].items()}

    with open(NE, encoding="utf-8") as fh:
        gj = json.load(fh)
    props, geoms = {}, {}
    for f in gj["features"]:
        p = f["properties"]
        iso = p.get("ADM0_A3") or p.get("ISO_A3")
        if iso and f.get("geometry"):
            props[iso] = p
            geoms[iso] = f["geometry"]

    targets = [i for i in list(W["shapes"]) + list(W.get("points", {}))
               if i not in have and i not in UNINHABITED]

    inc = income_and_region()
    arr, _src = DC.load_koppen()
    below5 = DP.load_indicator("EN.POP.EL5M.ZS")
    pop = DP.load_indicator("SP.POP.TOTL")
    forest = DP.load_indicator("AG.LND.FRST.ZS")
    storms = DP.cached_storm_counts()
    fert = DF.load_indicator("AG.CON.FERT.ZS")
    arable = DF.load_indicator("AG.LND.ARBL.ZS")
    agri = DF.load_indicator("AG.LND.AGRI.ZS")
    city = DF.load_indicator("EN.URB.LCTY")
    land = DF.load_indicator("AG.LND.TOTL.K2")
    mining = DF.mining_area()
    lat = DF.median_latitude()

    by_continent, undocumented = {}, []
    for iso in sorted(targets):
        flags = []
        landlocked = iso in DF.LANDLOCKED or iso in EXTRA_LANDLOCKED
        flags.append("landlocked" if landlocked else "coastal")
        if iso in DF.SIDS and iso not in NOT_SIDS:
            flags.append("sids")
        if iso in lat and abs(lat[iso]) >= DF.T_HIGHLAT:
            flags.append("highlat")

        f, a, g = fert.get(iso), arable.get(iso), agri.get(iso)
        if f and g:
            if ((f[0] >= DF.T_FERTILISER and g[0] >= DF.T_AGRI_PCT)
                    or (a and a[0] >= DF.T_ARABLE_DOMINANT)):
                flags.append("agriculture")
        c = city.get(iso)
        if c and c[0] >= DF.T_LARGEST_CITY:
            flags.append("megacity")
        km2, ld = mining.get(iso), land.get(iso)
        if km2 is not None:
            share = km2 / ld[0] if ld and ld[0] else None
            if km2 >= DF.T_MINING_KM2 or (share and share >= DF.T_MINING_SHARE):
                flags.append("mining")

        if iso in geoms:
            frac = DC.fractions(arr, geoms[iso])[0]
            for flag, (classes, thresh) in DC.RULES.items():
                if sum(frac.get(k, 0.0) for k in classes) >= thresh:
                    flags.append(flag)
            ft = sum(frac.get(k, 0.0) for k in DP.FREEZETHAW_CLASSES)
            if ft >= DP.T_FREEZETHAW:
                flags.append("freezethaw")
            humid = sum(frac.get(k, 0.0) for k in DP.HUMID_TROPICAL)
            if humid >= DP.T_HUMID_TROPICAL:
                flags.append("tropicalforest")

        # derive_physical.load_indicator returns bare floats; derive_flags returns
        # (value, year-range) tuples. Same name, different shape -- worth the care.
        p5, tot = below5.get(iso), pop.get(iso)
        if p5 is not None:
            abs5 = p5 / 100.0 * tot if tot else None
            if p5 >= DP.T_LOWLYING_PCT or (abs5 and abs5 >= DP.T_LOWLYING_ABS):
                flags.append("lowlying")
        if storms.get(iso, 0) >= DP.T_CYCLONE_TRACKS:
            flags.append("cyclone")

        raw = (props.get(iso, {}).get("NAME") or isoname.get(iso) or iso)
        name = NAME_FIX.get(raw, raw)
        if "'" in name:
            raise SystemExit(f"apostrophe in name would break the JS literal: {name}")
        income, _ = inc.get(iso, (None, None))
        if income is None:
            income = "lower"
            undocumented.append(f"{name} ({iso})")
        cont = CONTINENT.get(props.get(iso, {}).get("CONTINENT"), "Small island states")
        seen, ordered = set(), []
        for x in flags:
            if x not in seen:
                seen.add(x)
                ordered.append(x)
        by_continent.setdefault(cont, []).append(
            (name, iso, income, ordered))

    for cont in ["Africa", "Asia", "Europe", "Americas", "Small island states", "Oceania"]:
        rows = sorted(by_continent.get(cont, []))
        if not rows:
            continue
        print(f"\n  /* ── {cont} ── new ── */")
        for name, iso, income, flags in rows:
            fl = ", ".join(f"'{x}'" for x in flags)
            print(f"  c('{name}', '{iso}', '{income}', [{fl}]);")

    print(f"\n/* {sum(len(v) for v in by_continent.values())} countries. "
          f"monsoon, reef, glacierfed and freshwater are NOT derivable and are absent "
          f"from every line above. */", file=sys.stderr)
    if undocumented:
        print(f"/* no World Bank income group, defaulted to lower-middle: "
              f"{', '.join(undocumented)} */", file=sys.stderr)


if __name__ == "__main__":
    main()
