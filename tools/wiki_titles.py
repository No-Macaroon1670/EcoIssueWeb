"""Node id -> English Wikipedia article, plus a validator.

Every title here is a judgement call, and some are worse than others: a few nodes
(clean-tech end-of-life waste, methane leak detection) have no single well-trafficked
article, and a few map to a broader concept than the node means. `validate` resolves
redirects against the live API so the mapping stays honest, and the generated weights
file records the match quality so the app can show it.

  python tools/wiki_titles.py validate
"""
import json, sys, urllib.parse, urllib.request

API = "https://en.wikipedia.org/w/api.php"
UA = "eco-web-clickstream/1.0 (https://github.com/No-Macaroon1670/EcoIssueWeb)"

# 'exact'  - the article is about this issue
# 'broad'  - the article is a superset; co-navigation will be noisier
# 'proxy'  - deliberate stand-in, the closest well-trafficked page
TITLES = {
    # ── climate & atmosphere ──────────────────────────────────────────────────
    'fossil-fuels':        ('Fossil fuel', 'exact'),
    'ghg-emissions':       ('Greenhouse gas emissions', 'exact'),
    'methane':             ('Atmospheric methane', 'exact'),
    'cooling-demand':      ('Air conditioning', 'proxy'),
    'greenhouse-effect':   ('Greenhouse effect', 'exact'),
    'warming':             ('Climate change', 'exact'),
    'heatwaves':           ('Heat wave', 'exact'),
    'drought':             ('Drought', 'exact'),
    'wildfire':            ('Wildfire', 'exact'),
    'rainfall-shift':      ('Extreme weather', 'broad'),
    'cyclones':            ('Tropical cyclone', 'exact'),
    'sea-level':           ('Sea level rise', 'exact'),
    'ice-loss':            ('Retreat of glaciers since 1850', 'exact'),
    'albedo':              ('Albedo', 'broad'),
    'permafrost':          ('Permafrost', 'exact'),
    'carbon-sinks':        ('Carbon sink', 'exact'),
    'amoc':                ('Atlantic meridional overturning circulation', 'exact'),
    'data-centres':        ('Data center', 'broad'),
    'geoengineering':      ('Solar radiation modification', 'exact'),
    'carbon-offsets':      ('Carbon offset', 'exact'),

    # ── pollution & toxics ────────────────────────────────────────────────────
    'overconsumption':     ('Overconsumption', 'exact'),
    'plastic':             ('Plastic pollution', 'exact'),
    'microplastics':       ('Microplastics', 'exact'),
    'pfas':                ('Per- and polyfluoroalkyl substances', 'exact'),
    'heavy-metals':        ('Heavy metals', 'broad'),
    'air-pollution':       ('Air pollution', 'exact'),
    'ozone-smog':          ('Smog', 'proxy'),
    'nutrient-runoff':     ('Eutrophication', 'exact'),
    'pesticides':          ('Pesticide', 'exact'),
    'ewaste':              ('Electronic waste', 'exact'),
    'oil-spills':          ('Oil spill', 'exact'),
    'pharma-residues':     ('Antimicrobial resistance', 'proxy'),
    'landfill-waste':      ('Landfill', 'exact'),
    'light-pollution':     ('Light pollution', 'exact'),
    'noise-pollution':     ('Noise pollution', 'exact'),
    'nuclear-waste':       ('Radioactive waste', 'exact'),
    # no single article covers panels + blades + EV batteries reaching end of life.
    # Forcing a proxy would inject noise, so this node keeps its editorial weights.
    'cleantech-waste':     (None, 'unmapped'),

    # ── water & oceans ────────────────────────────────────────────────────────
    'water-scarcity':      ('Water scarcity', 'exact'),
    'groundwater':         ('Overdrafting', 'exact'),
    'unsafe-water':        ('Sanitation', 'broad'),
    'salinization':        ('Saltwater intrusion', 'exact'),
    'glacier-water':       ('Meltwater', 'broad'),
    'dams':                ('Dam', 'broad'),
    'ocean-warming':       ('Marine heatwave', 'exact'),
    'acidification':       ('Ocean acidification', 'exact'),
    'dead-zones':          ('Dead zone (ecology)', 'exact'),
    'deep-sea-mining':     ('Deep sea mining', 'exact'),

    # ── biodiversity & ecosystems ─────────────────────────────────────────────
    'habitat-loss':        ('Habitat destruction', 'exact'),
    'deforestation':       ('Deforestation', 'exact'),
    'wetland-loss':        ('Wetland', 'broad'),
    'extinction':          ('Holocene extinction', 'exact'),
    'pollinators':         ('Pollinator decline', 'exact'),
    'insect-decline':      ('Decline in insect populations', 'exact'),
    'soil-life':           ('Soil biology', 'exact'),
    'overfishing':         ('Overfishing', 'exact'),
    'coral-bleaching':     ('Coral bleaching', 'exact'),
    'kelp-seagrass':       ('Kelp forest', 'proxy'),
    'invasives':           ('Invasive species', 'exact'),
    'wildlife-trade':      ('Wildlife trade', 'exact'),

    # ── land, soil & food ─────────────────────────────────────────────────────
    'industrial-ag':       ('Intensive farming', 'exact'),
    'livestock':           ('Livestock', 'broad'),
    'monoculture':         ('Monoculture', 'exact'),
    'soil-erosion':        ('Soil erosion', 'exact'),
    'land-degradation':    ('Land degradation', 'exact'),
    'desertification':     ('Desertification', 'exact'),
    'food-insecurity':     ('Food security', 'exact'),
    'food-waste':          ('Food loss and waste', 'exact'),
    'urban-sprawl':        ('Urban sprawl', 'exact'),
    'mining':              ('Mining', 'broad'),

    # ── people & health ───────────────────────────────────────────────────────
    'respiratory':         ('Asthma', 'proxy'),
    'indoor-air':          ('Indoor air quality', 'exact'),
    'heat-mortality':      ('Hyperthermia', 'proxy'),
    'vector-disease':      ('Vector (epidemiology)', 'exact'),
    'waterborne':          ('Waterborne diseases', 'exact'),
    'displacement':        ('Environmental migrant', 'exact'),
    'env-injustice':       ('Environmental justice', 'exact'),
    'energy-poverty':      ('Energy poverty', 'exact'),
    'resource-conflict':   ('Water conflict', 'proxy'),
    'climate-anxiety':     ('Eco-anxiety', 'exact'),

    # ── solution levers ───────────────────────────────────────────────────────
    'renewables':          ('Renewable energy', 'exact'),
    'grid-storage':        ('Grid energy storage', 'exact'),
    'electrification':     ('Electrification', 'broad'),
    'nuclear-power':       ('Nuclear power', 'exact'),
    'efficiency-buildings': ('Efficient energy use', 'broad'),
    'methane-repair':      ('Fugitive gas emissions', 'proxy'),
    'carbon-pricing':      ('Carbon price', 'exact'),
    'circular-economy':    ('Circular economy', 'exact'),
    'product-standards':   ('Right to repair', 'exact'),
    'new-materials':       ('Bioplastic', 'proxy'),
    'organics-diversion':  ('Compost', 'exact'),
    'regen-ag':            ('Regenerative agriculture', 'exact'),
    'agroforestry':        ('Agroforestry', 'exact'),
    'diet-shift':          ('Plant-based diet', 'exact'),
    'transit-density':     ('Public transport', 'broad'),
    'protected-areas':     ('Protected area', 'exact'),
    'coastal-restoration': ('Mangrove restoration', 'exact'),
    'fisheries-mgmt':      ('Marine protected area', 'exact'),
    'water-efficiency':    ('Water conservation', 'exact'),
    'wastewater-upgrade':  ('Wastewater treatment', 'exact'),
    'clean-cooking':       ('Clean cooking', 'exact'),
    'urban-greening':      ('Urban forest', 'exact'),
    'early-warning':       ('Early warning system', 'exact'),
}


def api(params):
    params = dict(params, format="json", formatversion="2")
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.load(resp)


def validate():
    """Resolve every title, following redirects, and report anything that misses."""
    names = [t for t, _ in TITLES.values() if t]
    resolved, missing, redirected = {}, [], []

    for i in range(0, len(names), 40):
        batch = names[i:i + 40]
        data = api({"action": "query", "titles": "|".join(batch), "redirects": 1})
        q = data["query"]
        for r in q.get("redirects", []):
            redirected.append((r["from"], r["to"]))
        for page in q["pages"]:
            if page.get("missing"):
                missing.append(page["title"])
            else:
                resolved[page["title"]] = page["title"]

    redirect_map = {a: b for a, b in redirected}
    final = {}
    for node, (title, quality) in TITLES.items():
        if not title:
            final[node] = {"title": None, "quality": quality,
                           "redirected_from": None, "missing": False}
            continue
        target = redirect_map.get(title, title)
        final[node] = {"title": target, "quality": quality,
                       "redirected_from": title if target != title else None,
                       "missing": target in missing or title in missing}

    print(f"{len(TITLES)} nodes mapped\n")
    if redirected:
        print("redirects resolved:")
        for a, b in sorted(redirected):
            print(f"  {a}  ->  {b}")
    if missing:
        print("\nMISSING ARTICLES (fix these):")
        for m in sorted(missing):
            nodes = [n for n, v in TITLES.items() if v[0] == m]
            print(f"  {m}   (node: {', '.join(nodes)})")
    else:
        print("\nno missing articles")

    counts = {}
    for v in final.values():
        counts[v["quality"]] = counts.get(v["quality"], 0) + 1
    print("\nmatch quality:", counts)

    with open("tools/wiki_map.json", "w", encoding="utf-8") as fh:
        json.dump(final, fh, indent=1, ensure_ascii=False)
    print("wrote tools/wiki_map.json")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "validate":
        validate()
    else:
        print(__doc__)
