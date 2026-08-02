/* Coarse locale profiles for the "how does this land where I live" panel.
 *
 * A rules-of-thumb archetype model, not a downscaled projection. A place carries
 * physical-geography flags plus a World-Bank-style income group; issues declare which
 * flags and income groups raise exposure or contribution.
 *
 * Three levels, continent -> country -> subnational:
 *
 *   c(name, iso3, income, flags)          a country. iso3 is the join key for
 *                                         tools/derive_flags.py; '' where the place is
 *                                         not a World Bank reporting economy.
 *   s(name, parent, flags)                a subnational region. Inherits its parent's
 *                                         income. Geometry comes from data/subregions.js.
 *   g(name, income, flags, members)       several countries the model cannot tell
 *                                         apart, folded into one named entry.
 *
 * Subnational regions exist for the eight countries big or varied enough that a single
 * profile is misleading, and they TILE those countries completely -- every admin-1 unit
 * belongs to exactly one region. tools/build_subregions.py maps each region to a set of
 * ISO 3166-2 subdivisions and generates the outlines; both the map and
 * tools/derive_climate.py use them.
 *
 * Complete coverage matters for more than tidiness. While the tiling was partial, the
 * map had to draw a national outline behind the regions to make the holes legible -- and
 * that outline came from 1:110m admin-0 while the regions come from 1:50m admin-1. Two
 * generalisations of different vintage cannot register against each other, and around
 * disputed borders they disagree outright, most visibly at Jammu and Kashmir, which
 * admin-1 includes and the 110m India outline does not. With the tiling complete the
 * union of the regions IS the outline, from one consistent source, and the mismatched
 * layer is gone. Bounding boxes went with it.
 *
 * Regions are roughly admin-1 scale but named for the environmental unit rather than the
 * administrative one, so a group of provinces approximates its subject rather than
 * matching it: the Pantanal is a fraction of Mato Grosso do Sul, the Murray-Darling is a
 * basin and not five states. A provincial border is still a real line in the right place,
 * which a rectangle never was, and switching corrected two readings the boxes had wrong.
 * The North China Plain went from 4% to 20% desert and steppe and regained `arid`;
 * European Russia went from 31% to 3% subarctic and lost `boreal`, its northern taiga
 * having correctly moved to the Russian Arctic.
 *
 * Scotland, Northern England and the Ruhr are gone. Natural Earth has no admin-1 for the
 * United Kingdom or Germany at 1:50m, so those countries cannot be tiled, and a partial
 * subnational level is the thing being removed. Both remain selectable as countries.
 *
 * The economic flags are still hand-assigned below country level: derive_flags.py joins
 * on ISO3 and World Bank series have no subnational breakdown.
 *
 * Deliberate overrides -- places where the derivation disagrees and the hand value
 * stands. Kept here rather than silenced in the tool, so the report keeps reporting
 * them and each one has to stay justified:
 *
 *   Netherlands / megacity   The World Bank's "population in largest city" reads 1.2M
 *   Germany / megacity       for Amsterdam and 3.6M for Berlin, and so votes no for
 *                            both. The Randstad is about 8M and the Rhine-Ruhr about
 *                            11M; a single-largest-city measure cannot see a polycentric
 *                            conurbation. Italy and the UAE were removed rather than
 *                            kept, because neither has a comparable second structure --
 *                            they were simply under the threshold.
 *   Taiwan / megacity        Not a World Bank reporting economy, so there is no series
 *                            at all. Taipei's metropolitan area is around 7M.
 *   Egypt / agriculture      533 kg/ha of fertiliser on 4% of the land area, so the
 *   Canada / agriculture     extent gate rejects both. The Nile Valley and the Prairies
 *                            are intensive agriculture; the countries are mostly desert
 *                            and boreal forest. A country-level extent test cannot
 *                            represent a concentrated farming belt inside an empty
 *                            country, and a user picking "Canada" should still see
 *                            agricultural issues.
 *   Iceland / agriculture    The reverse error: the derivation says yes at 126 kg/ha,
 *                            but that is fertiliser per hectare of ARABLE land and
 *                            Iceland's arable base is about 1%. The intensity measure
 *                            inflates for any country that is mostly pasture. Rejected.
 *   Nigeria / mining         Maus measures mining land use and cannot see oil and gas.
 *   PNG / mining             Nigeria maps 25 km2 against a petroleum industry that
 *   Trinidad / mining        dominates the Niger Delta; Trinidad is the same story;
 *                            Papua New Guinea's 77 km2 understates Ok Tedi and Porgera,
 *                            which are notorious precisely for riverine tailings.
 *   Guyana, PNG, Singapore   UN SIDS membership is a political list, not the physical
 *     / sids                 archetype this flag encodes -- little high ground, thin
 *                            aquifers, import dependence. None of the three matches it.
 *
 * Climate flags (tools/derive_climate.py, Koppen-Geiger) agree at 80%, lower than the
 * economic ones, and they fail in one characteristic way: a national fraction cannot
 * see a climate zone concentrated in part of a country. Every override below is that
 * same problem or its mirror.
 *
 *   medclimate               Nine countries carry it that Koppen scores below 15%:
 *     (9 countries)          the United States 4%, Australia 2%, South Africa 2%,
 *                            Chile 14%, France 7%. California, the Western Cape and
 *                            the Perth and Adelaide belts are real Mediterranean
 *                            regions and small slices of large countries. Lowering the
 *                            threshold to catch them admits Afghanistan, Iran, Iraq and
 *                            Uzbekistan on mountain Csa fringes, which are not the
 *                            fire-and-drought archetype. Kept at high precision, and
 *                            these nine are misses rather than errors.
 *   Peru, Tanzania / arid    15% and 12% desert or steppe. The Peruvian coastal desert
 *                            is hyper-arid and the reason the flag is there; it is just
 *                            a narrow strip of a large country.
 *   Nigeria, Uganda          8% and 17% Af/Am. Southern Nigeria and the Lake Victoria
 *     / equatorial           basin are humid tropics inside countries that are mostly
 *                            savanna.
 *   Austria, Switzerland,    Rejected data-only. All three score 18-21% in subarctic
 *     Iceland / boreal       Dfc, which in the Alps is altitude rather than latitude,
 *                            and in Iceland is oceanic subpolar. None has the boreal
 *                            forest and permafrost the flag means.
 *   United States / boreal   12%, just under the threshold, and that 12% is Alaska.
 *   Tibetan Plateau 16%      Under the arid threshold because Koppen classes the
 *     / arid                 plateau largely as tundra rather than as cold desert.
 *                            Xizang and Qinghai are among the driest inhabited places
 *                            on earth.
 *   Sichuan Basin 17%        Sichuan reaches west onto the Tibetan plateau fringe, which
 *     / boreal               is subarctic by altitude rather than latitude. The basin
 *                            itself is humid subtropical. Same confound as the Alps.
 *   Prairies, Canada 42%     The clearest cost of using administrative units: Alberta,
 *     / boreal               Saskatchewan and Manitoba run hundreds of kilometres north
 *                            of any prairie, into real boreal forest. The region means
 *                            the agricultural south, so the flag is still refused --
 *                            but the gap is now the provinces' fault rather than a
 *                            threshold artefact, and it is wider than it was.
 *   Western Australia        4% Csa/Csb. The southwest corner around Perth is a real
 *     / medclimate           Mediterranean zone and a recognised biodiversity hotspot;
 *                            it is a small corner of a very large state.
 *   Prairies, Canada         15.7% subarctic, half a point over the threshold, against
 *     / boreal               72% Dfb which is the farmland itself. Rejected: the flag
 *                            means frozen ground, peat and boreal forest, and the
 *                            agricultural Prairies have none of them. Accepting it put
 *                            permafrost thaw at the top of a wheat region's issue list.
 *
 * `monsoon` is not derived at all. A monsoon is a seasonal reversal of circulation, not
 * a Koppen class. The obvious encoding scores 100% for Ghana, 95% for Cuba and 94% for
 * Zambia while giving China 12% and Pakistan 3% -- wrong in both directions at once.
 *
 * Physical flags (tools/derive_physical.py) agree at 81% across lowlying, freezethaw,
 * tropicalforest and cyclone. Overrides:
 *
 *   Iceland, Norway,         Rejected data-only on lowlying. All three score over 5% of
 *     Sweden / lowlying      population below 5 m, but that is fjord and archipelago
 *                            settlement on hard rock, not a low-lying plain -- Iceland's
 *                            12% is 40,000 people. The flag means delta exposure.
 *   Germany 19%,             Just under the freeze-thaw threshold. Both have winters
 *     Switzerland 24%        that cross zero repeatedly; they are mostly classed as
 *     / freezethaw           mild oceanic Cfb, which the rule excludes by design.
 *   Canada / cyclone         25 hurricane-strength storms within 250 km since 1980,
 *                            which is real -- Juan and Fiona both struck Nova Scotia --
 *                            but Canada is not a tropical cyclone basin.
 *   Pakistan / cyclone       Only 5 storms, below the threshold. Arabian Sea cyclones
 *                            are rare and catastrophic when they land; frequency is the
 *                            wrong axis for a country with Karachi on that coast.
 *   Mexico, Mozambique,      Kept on tropicalforest below the humid-tropical threshold.
 *     Nigeria, Madagascar    Their forest is real and under pressure; the Koppen share
 *     / tropicalforest       is diluted by savanna and dryland elsewhere in the country.
 *
 * Three flags are not derived and stay entirely hand-assigned. `reef` was attempted:
 * Natural Earth's reefs layer is cartographic rather than a distribution and puts the
 * nearest reef to Kenya at 1,148 km, so it was abandoned in favour of the hand values.
 * `glacierfed` would need to know which rivers drain which glaciers into which country,
 * which glacier area alone cannot say. `freshwater` would need a hydrographic basin and
 * lake database.
 */
window.ECO_REGIONS = (function () {
  const FLAGS = {
    coastal:        { label: 'Has a coastline',            hint: 'Sea level, storm surge, coastal erosion, marine issues' },
    sids:           { label: 'Small island state',         hint: 'Little high ground, thin aquifers, import dependence' },
    lowlying:       { label: 'Low-lying / delta',          hint: 'Large population close to sea level; slow drainage' },
    cyclone:        { label: 'Tropical cyclone basin',     hint: 'Roughly 5-30 degrees latitude over warm water' },
    arid:           { label: 'Dryland / arid',             hint: 'Structural water scarcity and degradation risk' },
    monsoon:        { label: 'Monsoon rainfall',           hint: 'Highly seasonal rain; failure is immediately felt' },
    boreal:         { label: 'Boreal / permafrost',        hint: 'Frozen ground, peat and boreal forest' },
    highlat:        { label: 'Subarctic / high latitude',  hint: 'Warming two to four times the global rate; roughly 58 degrees and poleward' },
    glacierfed:     { label: 'Glacier or snowmelt rivers', hint: 'Dry-season water stored as mountain ice' },
    medclimate:     { label: 'Mediterranean climate',      hint: 'Hot dry summers; the classic fire-and-drought pattern' },
    equatorial:     { label: 'Equatorial / humid tropics', hint: 'Persistent heat and humidity, year-round disease season' },
    reef:           { label: 'Coral reefs offshore',       hint: 'Reef fisheries, tourism and wave protection at stake' },
    tropicalforest: { label: 'Tropical forest',            hint: 'Deforestation frontier and biodiversity hotspot' },
    landlocked:     { label: 'Landlocked',                 hint: 'Dependent on upstream neighbours for water' },
    megacity:       { label: 'Very large city',            hint: 'Heat islands, traffic pollution, unequal exposure' },
    mining:         { label: 'Mining region',              hint: 'Extraction, tailings and water contamination' },
    freshwater:     { label: 'Great lakes & big rivers',   hint: 'Inland freshwater: farm runoff, algal blooms, aquatic invasives' },
    freezethaw:     { label: 'Freeze-thaw winters',        hint: 'Winters crossing 0C repeatedly - roads, pipes and foundations' },
    agriculture:    { label: 'Intensive agriculture',      hint: 'High-input farming: fertiliser, pesticides, irrigation, simplified landscapes' }
  };

  const INCOME = {
    high:  'High income',
    upper: 'Upper-middle income',
    lower: 'Lower-middle income',
    low:   'Low income'
  };

  const REGIONS = ['Africa', 'Asia', 'Europe', 'Americas', 'Small island states', 'Oceania'];

  const PLACES = [];
  let CURRENT = null;
  const region = name => { CURRENT = name; };
  const c = (name, iso, income, flags) =>
    PLACES.push({ name, iso, income, flags, region: CURRENT, parent: null, members: null });
  const g = (name, income, flags, members) =>
    PLACES.push({ name, iso: '', income, flags, region: CURRENT, parent: null, members });
  const s = (name, parent, flags) => {
    const p = PLACES.find(x => x.name === parent);
    if (!p) throw new Error('subnational region names a missing parent: ' + parent);
    PLACES.push({ name, iso: '', income: p.income, flags, region: p.region,
                  parent, members: null });
  };


  /* ── Africa ─────────────────────────────────────────────────── */
  region('Africa');
  c('Algeria', 'DZA', 'upper', ['coastal', 'arid', 'medclimate']);
  c('Angola', 'AGO', 'lower', ['coastal', 'arid', 'tropicalforest', 'mining', 'megacity']);
  c('Democratic Republic of the Congo', 'COD', 'low', ['tropicalforest', 'equatorial', 'mining', 'coastal', 'megacity']);
  c('Egypt', 'EGY', 'lower', ['coastal', 'lowlying', 'arid', 'megacity', 'agriculture']);
  c('Ghana', 'GHA', 'lower', ['coastal', 'tropicalforest', 'mining']);
  c('Kenya', 'KEN', 'lower', ['coastal', 'arid', 'reef', 'freshwater', 'megacity']);
  c('Madagascar', 'MDG', 'low', ['coastal', 'cyclone', 'reef', 'tropicalforest']);
  c('Morocco', 'MAR', 'lower', ['coastal', 'arid', 'medclimate', 'mining']);
  c('Mozambique', 'MOZ', 'low', ['coastal', 'cyclone', 'lowlying', 'reef', 'tropicalforest', 'arid']);
  c('Nigeria', 'NGA', 'lower', ['coastal', 'lowlying', 'megacity', 'tropicalforest', 'equatorial', 'mining', 'agriculture', 'arid']);
  g('Sahel & Horn of Africa', 'low', ['landlocked', 'arid'], ['Chad', 'Ethiopia', 'Mali', 'Niger']);
  c('Senegal', 'SEN', 'lower', ['coastal', 'arid', 'lowlying']);
  c('Somalia', 'SOM', 'low', ['coastal', 'arid']);
  c('South Africa', 'ZAF', 'upper', ['coastal', 'arid', 'medclimate', 'mining', 'megacity']);
  c('Sudan', 'SDN', 'low', ['coastal', 'arid', 'megacity']);
  c('Tanzania', 'TZA', 'lower', ['coastal', 'reef', 'arid', 'freshwater', 'megacity']);
  c('Tunisia', 'TUN', 'lower', ['coastal', 'arid', 'medclimate', 'lowlying']);
  c('Uganda', 'UGA', 'low', ['landlocked', 'equatorial', 'tropicalforest', 'freshwater']);
  c('Zambia', 'ZMB', 'low', ['landlocked', 'mining']);

  /* ── Asia ─────────────────────────────────────────────────── */
  region('Asia');
  c('Afghanistan', 'AFG', 'low', ['landlocked', 'arid', 'glacierfed', 'freezethaw']);
  c('Bangladesh', 'BGD', 'lower', ['coastal', 'lowlying', 'monsoon', 'cyclone', 'megacity', 'agriculture']);
  c('Cambodia', 'KHM', 'lower', ['coastal', 'monsoon', 'lowlying', 'tropicalforest', 'cyclone']);
  c('China', 'CHN', 'upper', ['coastal', 'lowlying', 'monsoon', 'arid', 'glacierfed', 'megacity', 'mining', 'cyclone', 'freshwater', 'agriculture']);
  c('Hong Kong', 'HKG', 'high', ['coastal', 'cyclone', 'megacity']);
  c('India', 'IND', 'lower', ['coastal', 'lowlying', 'monsoon', 'arid', 'glacierfed', 'megacity', 'reef', 'cyclone', 'agriculture', 'mining']);
  c('Indonesia', 'IDN', 'lower', ['coastal', 'equatorial', 'tropicalforest', 'reef', 'megacity', 'lowlying', 'mining', 'agriculture']);
  c('Iran', 'IRN', 'lower', ['arid', 'coastal', 'megacity', 'glacierfed', 'mining']);
  c('Iraq', 'IRQ', 'upper', ['arid', 'lowlying', 'coastal', 'megacity']);
  c('Israel', 'ISR', 'high', ['coastal', 'arid', 'medclimate', 'agriculture', 'mining']);
  c('Japan', 'JPN', 'high', ['coastal', 'cyclone', 'megacity', 'lowlying', 'freezethaw']);
  c('Kazakhstan', 'KAZ', 'upper', ['landlocked', 'arid', 'mining', 'freezethaw']);
  c('Malaysia', 'MYS', 'upper', ['coastal', 'equatorial', 'tropicalforest', 'reef', 'lowlying', 'agriculture', 'megacity']);
  c('Mongolia', 'MNG', 'lower', ['landlocked', 'arid', 'boreal', 'mining']);
  c('Myanmar', 'MMR', 'lower', ['coastal', 'lowlying', 'monsoon', 'cyclone', 'tropicalforest', 'megacity', 'mining']);
  c('Nepal', 'NPL', 'lower', ['landlocked', 'glacierfed', 'monsoon']);
  c('Pakistan', 'PAK', 'lower', ['coastal', 'arid', 'monsoon', 'glacierfed', 'megacity', 'cyclone', 'agriculture']);
  c('Philippines', 'PHL', 'lower', ['coastal', 'cyclone', 'reef', 'equatorial', 'megacity', 'lowlying', 'tropicalforest', 'agriculture', 'mining']);
  c('Russia', 'RUS', 'upper', ['boreal', 'highlat', 'coastal', 'mining', 'freshwater', 'freezethaw', 'megacity']);
  c('Saudi Arabia', 'SAU', 'high', ['arid', 'coastal', 'reef', 'agriculture', 'megacity']);
  c('Singapore', 'SGP', 'high', ['coastal', 'equatorial', 'lowlying', 'megacity']);
  c('South Korea', 'KOR', 'high', ['coastal', 'megacity', 'monsoon', 'agriculture', 'freezethaw', 'cyclone']);
  c('Sri Lanka', 'LKA', 'lower', ['coastal', 'reef', 'monsoon', 'equatorial', 'agriculture', 'tropicalforest']);
  c('Taiwan', 'TWN', 'high', ['coastal', 'cyclone', 'megacity']);
  c('Thailand', 'THA', 'upper', ['coastal', 'lowlying', 'monsoon', 'reef', 'megacity', 'tropicalforest', 'cyclone', 'agriculture']);
  c('Turkey', 'TUR', 'upper', ['coastal', 'medclimate', 'megacity', 'agriculture', 'mining', 'freezethaw']);
  c('United Arab Emirates', 'ARE', 'high', ['arid', 'coastal', 'reef', 'lowlying']);
  c('Uzbekistan', 'UZB', 'lower', ['landlocked', 'arid', 'glacierfed', 'agriculture', 'mining']);
  c('Vietnam', 'VNM', 'lower', ['coastal', 'lowlying', 'cyclone', 'monsoon', 'megacity', 'tropicalforest', 'agriculture', 'mining']);

  /* ── Europe ─────────────────────────────────────────────────── */
  region('Europe');
  c('Austria', 'AUT', 'high', ['landlocked', 'glacierfed', 'freezethaw', 'freshwater', 'agriculture']);
  c('Belgium', 'BEL', 'high', ['coastal', 'lowlying', 'agriculture']);
  c('Czechia', 'CZE', 'high', ['landlocked', 'mining', 'freshwater', 'freezethaw', 'agriculture']);
  c('Denmark', 'DNK', 'high', ['coastal', 'lowlying', 'agriculture']);
  c('Finland', 'FIN', 'high', ['coastal', 'boreal', 'highlat', 'freezethaw']);
  c('France', 'FRA', 'high', ['coastal', 'medclimate', 'megacity', 'glacierfed', 'agriculture']);
  c('Germany', 'DEU', 'high', ['coastal', 'lowlying', 'megacity', 'freshwater', 'freezethaw', 'agriculture', 'mining']);
  c('Greece', 'GRC', 'high', ['coastal', 'medclimate', 'agriculture', 'mining', 'lowlying']);
  c('Hungary', 'HUN', 'high', ['landlocked', 'freshwater', 'freezethaw', 'agriculture']);
  c('Iceland', 'ISL', 'high', ['coastal', 'highlat', 'glacierfed']);
  c('Ireland', 'IRL', 'high', ['coastal', 'agriculture']);
  c('Italy', 'ITA', 'high', ['coastal', 'medclimate', 'glacierfed', 'agriculture']);
  c('Netherlands', 'NLD', 'high', ['coastal', 'lowlying', 'megacity', 'freshwater', 'agriculture']);
  c('Norway', 'NOR', 'high', ['coastal', 'boreal', 'highlat', 'glacierfed']);
  c('Poland', 'POL', 'high', ['coastal', 'lowlying', 'mining', 'freshwater', 'freezethaw', 'agriculture']);
  c('Portugal', 'PRT', 'high', ['coastal', 'medclimate', 'agriculture']);
  c('Romania', 'ROU', 'high', ['coastal', 'lowlying', 'freezethaw']);
  c('Spain', 'ESP', 'high', ['coastal', 'medclimate', 'arid', 'agriculture', 'megacity', 'mining']);
  c('Sweden', 'SWE', 'high', ['coastal', 'boreal', 'highlat', 'freezethaw']);
  c('Switzerland', 'CHE', 'high', ['landlocked', 'glacierfed', 'freezethaw', 'agriculture']);
  c('Ukraine', 'UKR', 'lower', ['coastal', 'lowlying', 'freshwater', 'freezethaw', 'agriculture', 'mining']);
  c('United Kingdom', 'GBR', 'high', ['coastal', 'lowlying', 'megacity', 'agriculture']);

  /* ── Americas ─────────────────────────────────────────────────── */
  region('Americas');
  c('Argentina', 'ARG', 'upper', ['coastal', 'arid', 'glacierfed', 'medclimate', 'megacity', 'mining']);
  c('Bolivia', 'BOL', 'lower', ['landlocked', 'arid', 'glacierfed', 'tropicalforest', 'mining']);
  c('Brazil', 'BRA', 'upper', ['coastal', 'equatorial', 'tropicalforest', 'megacity', 'mining', 'agriculture']);
  c('Canada', 'CAN', 'high', ['coastal', 'boreal', 'highlat', 'glacierfed', 'mining', 'freshwater', 'freezethaw', 'agriculture', 'megacity']);
  g('Central America', 'lower', ['coastal', 'cyclone', 'tropicalforest', 'reef', 'equatorial'], ['Guatemala', 'Honduras', 'Nicaragua']);
  c('Chile', 'CHL', 'high', ['coastal', 'arid', 'medclimate', 'glacierfed', 'mining', 'megacity']);
  c('Colombia', 'COL', 'upper', ['coastal', 'equatorial', 'tropicalforest', 'glacierfed', 'reef', 'megacity', 'mining', 'agriculture']);
  c('Costa Rica', 'CRI', 'upper', ['coastal', 'tropicalforest', 'equatorial', 'reef', 'agriculture']);
  c('Ecuador', 'ECU', 'upper', ['coastal', 'equatorial', 'tropicalforest', 'glacierfed', 'reef', 'agriculture', 'lowlying']);
  c('Guyana', 'GUY', 'upper', ['coastal', 'lowlying', 'tropicalforest', 'equatorial', 'mining']);
  c('Mexico', 'MEX', 'upper', ['coastal', 'arid', 'cyclone', 'reef', 'megacity', 'tropicalforest', 'mining']);
  c('Panama', 'PAN', 'upper', ['coastal', 'tropicalforest', 'equatorial', 'reef', 'lowlying']);
  c('Paraguay', 'PRY', 'upper', ['landlocked', 'arid', 'agriculture']);
  c('Peru', 'PER', 'upper', ['coastal', 'arid', 'glacierfed', 'tropicalforest', 'mining', 'equatorial', 'agriculture', 'megacity']);
  c('United States', 'USA', 'high', ['coastal', 'lowlying', 'cyclone', 'arid', 'medclimate', 'megacity', 'glacierfed', 'mining', 'boreal', 'reef', 'freshwater', 'freezethaw', 'agriculture']);
  c('Uruguay', 'URY', 'high', ['coastal', 'agriculture']);
  c('Venezuela', 'VEN', 'upper', ['coastal', 'tropicalforest', 'equatorial', 'mining']);

  /* ── Small island states ─────────────────────────────────────────────────── */
  region('Small island states');
  c('Bahamas', 'BHS', 'high', ['sids', 'coastal', 'lowlying', 'cyclone', 'reef', 'equatorial', 'tropicalforest']);
  c('Barbados', 'BRB', 'high', ['sids', 'coastal', 'cyclone', 'reef']);
  c('Cuba', 'CUB', 'upper', ['sids', 'coastal', 'cyclone', 'reef', 'mining']);
  c('Dominican Republic', 'DOM', 'upper', ['sids', 'coastal', 'cyclone', 'reef', 'agriculture', 'equatorial', 'tropicalforest']);
  c('Fiji', 'FJI', 'upper', ['sids', 'coastal', 'cyclone', 'reef', 'equatorial', 'lowlying', 'tropicalforest']);
  c('Haiti', 'HTI', 'low', ['sids', 'coastal', 'cyclone', 'tropicalforest', 'equatorial']);
  c('Jamaica', 'JAM', 'upper', ['sids', 'coastal', 'cyclone', 'reef', 'mining', 'equatorial', 'lowlying', 'tropicalforest']);
  c('Maldives', 'MDV', 'upper', ['sids', 'coastal', 'lowlying', 'reef', 'equatorial']);
  c('Marshall Islands', 'MHL', 'upper', ['sids', 'coastal', 'lowlying', 'reef']);
  g('Pacific atoll states', 'lower', ['sids', 'coastal', 'lowlying', 'reef', 'equatorial'], ['Kiribati', 'Solomon Islands', 'Tuvalu']);
  c('Papua New Guinea', 'PNG', 'lower', ['coastal', 'equatorial', 'tropicalforest', 'reef', 'mining', 'lowlying']);
  c('Puerto Rico', 'PRI', 'high', ['sids', 'coastal', 'cyclone', 'reef', 'equatorial', 'lowlying', 'tropicalforest']);
  c('Samoa', 'WSM', 'lower', ['sids', 'coastal', 'cyclone', 'reef', 'equatorial']);
  c('Trinidad and Tobago', 'TTO', 'high', ['sids', 'coastal', 'reef', 'mining', 'equatorial', 'tropicalforest']);
  c('Vanuatu', 'VUT', 'lower', ['sids', 'coastal', 'cyclone', 'reef', 'equatorial', 'lowlying', 'tropicalforest']);

  /* ── Oceania ─────────────────────────────────────────────────── */
  region('Oceania');
  c('Australia', 'AUS', 'high', ['coastal', 'arid', 'medclimate', 'reef', 'cyclone', 'mining', 'agriculture', 'megacity']);
  c('New Zealand', 'NZL', 'high', ['coastal', 'glacierfed', 'medclimate', 'agriculture']);

  /* ── Subnational regions ────────────────────────────────────────────────────
   * The eight countries where one national profile is actively misleading, plus
   * three legacy entries retained because they differ from their parent.
   *
   * The derivation run gave the empirical argument for these: Egypt farms at
   * 533 kg/ha and Canada at 133, but only 4% and 6% of their land area is farmed,
   * so both failed a national extent test. The Nile Valley and the Prairies are
   * intensive agriculture; Egypt and Canada as wholes are desert and boreal forest.
   * A national flag can only be wrong in one direction or the other.
   *
   * Flags here are hand-assigned and provisional -- see the header note. */

  /* United States */
  s('Alaska, USA', 'United States', ['coastal', 'boreal', 'highlat', 'glacierfed', 'mining']);
  s('California, USA', 'United States', ['coastal', 'medclimate', 'arid', 'megacity', 'glacierfed', 'agriculture']);
  s('Florida, USA', 'United States', ['coastal', 'lowlying', 'cyclone', 'reef', 'megacity']);
  s('Great Lakes, USA', 'United States', ['freshwater', 'freezethaw', 'megacity', 'mining', 'agriculture']);
  s('Great Plains, USA', 'United States', ['arid', 'agriculture', 'freezethaw']);
  s('Hawaii, USA', 'United States', ['coastal', 'reef', 'tropicalforest', 'cyclone', 'equatorial']);
  s('New York, USA', 'United States', ['coastal', 'lowlying', 'megacity', 'freezethaw']);
  s('Mid-Atlantic, USA', 'United States', ['coastal', 'freezethaw', 'megacity', 'lowlying', 'mining', 'agriculture']);
  s('New England, USA', 'United States', ['coastal', 'freezethaw']);
  s('Pacific Northwest, USA', 'United States', ['coastal', 'medclimate', 'freshwater', 'agriculture', 'glacierfed', 'arid']);
  s('Southeast, USA', 'United States', ['coastal', 'cyclone', 'agriculture', 'lowlying']);
  s('Southwest, USA', 'United States', ['arid', 'mining', 'megacity']);
  s('Texas, USA', 'United States', ['coastal', 'arid', 'cyclone', 'megacity', 'mining', 'agriculture']);

  /* China */
  s('Inner Mongolia, China', 'China', ['landlocked', 'arid', 'mining']);
  s('Loess Plateau, China', 'China', ['arid', 'agriculture', 'mining', 'freshwater', 'freezethaw']);
  s('Middle Yangtze, China', 'China', ['freshwater', 'agriculture', 'megacity', 'lowlying']);
  s('North China Plain, China', 'China', ['agriculture', 'megacity', 'freshwater', 'arid']);
  s('Northeast China', 'China', ['freezethaw', 'agriculture', 'mining', 'freshwater']);
  s('Pearl River Delta, China', 'China', ['coastal', 'lowlying', 'megacity', 'cyclone']);
  s('Sichuan Basin, China', 'China', ['agriculture', 'megacity', 'freshwater']);
  s('Southeast coast, China', 'China', ['coastal', 'cyclone', 'megacity']);
  s('Tibetan Plateau, China', 'China', ['landlocked', 'glacierfed', 'arid']);
  s('Xinjiang, China', 'China', ['landlocked', 'arid', 'mining', 'glacierfed']);
  s('Yangtze Delta, China', 'China', ['coastal', 'lowlying', 'megacity', 'freshwater', 'agriculture', 'cyclone']);
  s('Yunnan-Guizhou Plateau, China', 'China', ['tropicalforest', 'mining', 'monsoon']);

  /* Brazil */
  s('Amazonia, Brazil', 'Brazil', ['tropicalforest', 'equatorial', 'freshwater', 'mining']);
  s('Atlantic Coast, Brazil', 'Brazil', ['coastal', 'megacity', 'agriculture']);
  s('Cerrado, Brazil', 'Brazil', ['tropicalforest', 'agriculture', 'freshwater']);
  s('Northeast Sertao, Brazil', 'Brazil', ['coastal', 'arid']);
  s('Pantanal, Brazil', 'Brazil', ['freshwater', 'tropicalforest']);

  /* Russia */
  s('European Russia', 'Russia', ['freshwater', 'freezethaw', 'megacity', 'agriculture']);
  s('Russian Arctic', 'Russia', ['coastal', 'boreal', 'highlat', 'freezethaw']);
  s('Russian Far East', 'Russia', ['coastal', 'boreal', 'highlat', 'mining', 'freezethaw']);
  s('Siberia, Russia', 'Russia', ['boreal', 'highlat', 'mining', 'freshwater', 'freezethaw']);

  /* India */
  s('Central India', 'India', ['tropicalforest', 'mining', 'agriculture', 'monsoon']);
  s('Deccan Plateau, India', 'India', ['arid', 'monsoon', 'agriculture']);
  s('Gujarat & Kachchh, India', 'India', ['coastal', 'arid', 'agriculture', 'mining', 'megacity']);
  s('Indian Himalaya', 'India', ['glacierfed', 'freezethaw', 'monsoon']);
  s('Indian Ocean islands', 'India', ['coastal', 'sids', 'reef', 'equatorial', 'cyclone', 'lowlying', 'tropicalforest']);
  s('Indo-Gangetic Plain, India', 'India', ['monsoon', 'agriculture', 'megacity', 'freshwater', 'glacierfed']);
  s('Northeast India', 'India', ['monsoon', 'tropicalforest', 'freshwater']);
  s('Odisha & east coast, India', 'India', ['coastal', 'cyclone', 'monsoon', 'mining', 'lowlying']);
  s('Punjab, India', 'India', ['agriculture', 'monsoon', 'glacierfed', 'landlocked', 'arid']);
  s('Rajasthan, India', 'India', ['arid', 'landlocked', 'agriculture']);
  s('Tamil Nadu & Coromandel, India', 'India', ['coastal', 'cyclone', 'monsoon', 'megacity', 'agriculture', 'reef']);
  s('West Bengal & Sundarbans, India', 'India', ['coastal', 'lowlying', 'monsoon', 'cyclone', 'megacity']);
  s('Western Ghats & Kerala, India', 'India', ['coastal', 'monsoon', 'tropicalforest', 'equatorial', 'reef']);

  /* Canada */
  s('Atlantic Canada', 'Canada', ['coastal', 'boreal', 'freezethaw']);
  s('British Columbia, Canada', 'Canada', ['coastal', 'boreal', 'glacierfed', 'mining']);
  s('Northern Canada', 'Canada', ['coastal', 'boreal', 'highlat', 'glacierfed', 'mining', 'freezethaw']);
  s('Ontario, Canada', 'Canada', ['freshwater', 'freezethaw', 'megacity', 'agriculture', 'boreal']);
  s('Prairies, Canada', 'Canada', ['agriculture', 'freezethaw', 'mining', 'landlocked']);
  s('Quebec, Canada', 'Canada', ['coastal', 'boreal', 'freshwater', 'freezethaw']);

  /* Australia */
  s('Murray-Darling Basin, Australia', 'Australia', ['arid', 'agriculture', 'freshwater', 'landlocked']);
  s('Queensland, Australia', 'Australia', ['coastal', 'reef', 'cyclone', 'arid', 'mining', 'agriculture']);
  s('Tasmania, Australia', 'Australia', ['coastal']);
  s('Top End, Australia', 'Australia', ['coastal', 'arid', 'cyclone', 'tropicalforest', 'mining']);
  s('Western Australia', 'Australia', ['coastal', 'arid', 'medclimate', 'mining']);

  /* Indonesia */
  s('Java, Indonesia', 'Indonesia', ['coastal', 'equatorial', 'megacity', 'lowlying', 'agriculture']);
  s('Kalimantan, Indonesia', 'Indonesia', ['coastal', 'equatorial', 'tropicalforest', 'mining']);
  s('Lesser Sunda & Maluku, Indonesia', 'Indonesia', ['coastal', 'equatorial', 'reef', 'tropicalforest', 'sids']);
  s('Papua, Indonesia', 'Indonesia', ['coastal', 'equatorial', 'tropicalforest', 'mining', 'reef']);
  s('Sulawesi, Indonesia', 'Indonesia', ['coastal', 'equatorial', 'tropicalforest', 'reef', 'mining']);
  s('Sumatra, Indonesia', 'Indonesia', ['coastal', 'equatorial', 'tropicalforest', 'mining']);

  PLACES.sort((a, b) => a.name.localeCompare(b.name));

  /* Tree for the picker and, later, the map: continent -> country -> subnational. */
  function tree() {
    return REGIONS.map(name => ({
      name,
      children: PLACES.filter(p => p.region === name && !p.parent)
        .map(country => ({
          place: country,
          children: PLACES.filter(p => p.parent === country.name)
        }))
    })).filter(r => r.children.length);
  }

  return { FLAGS, INCOME, REGIONS, PLACES, tree };
})();
