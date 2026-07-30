/* Directed links: source --verb--> target.
 *
 * w = editorial estimate of how tightly the two issues are discussed together
 * (1 loose .. 3 near-inseparable). This is a hand-assigned judgement, NOT a
 * measured co-mention count from a corpus -- the clustering below is only as
 * good as these weights, and the UI says so.
 *
 * Verbs in ECO.negativeVerbs (reduces / prevents / limits / buffers / slows /
 * absorbs / shields) mark a SUPPRESSING influence and render dashed with an
 * open arrowhead. Most of those edges are genuine tradeoffs rather than good
 * news -- the note explains each one.
 */
(function (E) {
  const l = E.l.bind(E);

  /* ── The core causal spine ──────────────────────────────────────────────── */
  l('fossil-fuels', 'drives', 'ghg-emissions', 3);
  l('ghg-emissions', 'intensifies', 'greenhouse-effect', 3);
  l('greenhouse-effect', 'causes', 'warming', 3);
  l('methane', 'intensifies', 'greenhouse-effect', 3,
    'Roughly 80x the heat-trapping power of CO2 over 20 years, but gone within a decade.');
  l('ghg-emissions', 'causes', 'acidification', 3,
    'About a quarter of emitted CO2 dissolves into the sea, forming carbonic acid.');

  /* ── Fossil fuels & energy ──────────────────────────────────────────────── */
  l('fossil-fuels', 'causes', 'air-pollution', 3);
  l('fossil-fuels', 'releases', 'methane', 3, 'Leaks from wells, pipelines and coal mines.');
  l('fossil-fuels', 'releases', 'heavy-metals', 2, 'Coal combustion is a leading source of airborne mercury.');
  l('fossil-fuels', 'causes', 'oil-spills', 2);
  l('fossil-fuels', 'supplies', 'plastic', 2, 'Almost all plastic is made from oil and gas feedstock.');
  l('fossil-fuels', 'drives', 'mining', 1);
  l('fossil-fuels', 'reduces', 'energy-poverty', 2,
    'The honest tension: fossil energy has powered most of the world\'s gains in energy access, and any transition has to keep delivering that.');
  l('cooling-demand', 'increases', 'ghg-emissions', 2);
  l('cooling-demand', 'prevents', 'heat-mortality', 2,
    'The central adaptation trap: air conditioning saves lives now while its power draw and refrigerant leaks add warming later.');
  l('energy-poverty', 'drives', 'indoor-air', 3);
  l('energy-poverty', 'drives', 'deforestation', 1, 'Fuelwood and charcoal demand where no alternative is affordable.');
  l('energy-poverty', 'increases', 'heat-mortality', 2, 'No affordable cooling during heat events.');
  l('energy-poverty', 'worsens', 'env-injustice', 2,
    'The households with the worst indoor air and the least cooling are the same ones facing the highest energy cost as a share of income.');

  /* ── Warming's physical consequences ────────────────────────────────────── */
  l('warming', 'increases', 'heatwaves', 3);
  l('warming', 'increases', 'drought', 2);
  l('warming', 'increases', 'wildfire', 2);
  l('warming', 'drives', 'rainfall-shift', 2);
  l('warming', 'intensifies', 'cyclones', 2);
  l('warming', 'accelerates', 'ice-loss', 3);
  l('warming', 'thaws', 'permafrost', 3);
  l('warming', 'raises', 'sea-level', 3);
  l('warming', 'drives', 'ocean-warming', 3);
  l('warming', 'weakens', 'amoc', 2);
  l('warming', 'weakens', 'carbon-sinks', 2);
  l('warming', 'increases', 'cooling-demand', 2);
  l('warming', 'expands', 'vector-disease', 2);
  l('warming', 'increases', 'ozone-smog', 1, 'Ozone forms faster in heat, so the same pollution yields more smog.');
  l('warming', 'fuels', 'climate-anxiety', 1);

  /* ── Ice, feedbacks & circulation ───────────────────────────────────────── */
  l('ice-loss', 'raises', 'sea-level', 3);
  l('ice-loss', 'triggers', 'albedo', 2);
  l('ice-loss', 'causes', 'glacier-water', 3);
  l('albedo', 'amplifies', 'warming', 3, 'A self-reinforcing loop: less ice means more absorbed heat means less ice.');
  l('permafrost', 'releases', 'ghg-emissions', 3,
    'Frozen ground holds roughly twice the carbon now in the atmosphere.');
  l('carbon-sinks', 'amplifies', 'warming', 2,
    'Land and ocean currently absorb about half of emissions; weaker sinks mean the same emissions warm more.');
  l('amoc', 'disrupts', 'rainfall-shift', 2);
  l('air-pollution', 'accelerates', 'ice-loss', 2, 'Soot darkens snow and ice, so it absorbs more sunlight.');
  l('air-pollution', 'shields', 'warming', 2,
    'Sulphate aerosols reflect sunlight and have masked part of the warming already caused. Cleaning the air is unambiguously good for health, and it reveals warming that was always there.');

  /* ── Ocean ──────────────────────────────────────────────────────────────── */
  l('ocean-warming', 'causes', 'coral-bleaching', 3);
  l('ocean-warming', 'kills', 'kelp-seagrass', 2);
  l('ocean-warming', 'worsens', 'dead-zones', 2, 'Warm water holds less oxygen and resists mixing.');
  l('ocean-warming', 'fuels', 'cyclones', 2);
  l('ocean-warming', 'raises', 'sea-level', 2, 'Thermal expansion accounts for a large share of observed rise.');
  l('ocean-warming', 'threatens', 'food-insecurity', 1, 'Fish stocks shift poleward, away from the communities that depend on them.');
  l('acidification', 'weakens', 'coral-bleaching', 2,
    'Lower pH undermines the ability to build the calcium carbonate skeleton in the first place.');
  l('acidification', 'threatens', 'extinction', 1,
    'Anything building a calcium carbonate shell — pteropods, oysters, coccolithophores — has to spend more energy to do it in more acidic water, and some cannot.');
  l('sea-level', 'drives', 'salinization', 3);
  l('sea-level', 'drowns', 'wetland-loss', 2, 'Coastal wetlands are squeezed between rising water and hard development.');
  l('sea-level', 'forces', 'displacement', 3);

  /* ── Weather hazards → people ───────────────────────────────────────────── */
  l('heatwaves', 'causes', 'heat-mortality', 3);
  l('heatwaves', 'drives', 'cooling-demand', 3);
  l('heatwaves', 'increases', 'wildfire', 2);
  l('heatwaves', 'worsens', 'drought', 2, 'Hotter air pulls more moisture out of soil and plants.');
  l('heatwaves', 'increases', 'ozone-smog', 2);
  l('heatwaves', 'worsens', 'climate-anxiety', 1,
    'Heat is independently associated with worse mental health outcomes, separately from any worry about what it signifies.');
  l('heatwaves', 'threatens', 'food-insecurity', 1, 'Heat during flowering can cut staple yields sharply.');
  l('cyclones', 'forces', 'displacement', 3);
  l('cyclones', 'worsens', 'climate-anxiety', 2,
    'Disaster survivors show elevated PTSD, depression and anxiety, and repeated exposure compounds it.');
  l('cyclones', 'threatens', 'food-insecurity', 1,
    'Standing crops flattened in hours, and on small islands the port the rest of the food arrives through is often damaged in the same storm.');
  l('cyclones', 'causes', 'waterborne', 1, 'Flooding mixes sewage into drinking water.');
  l('cyclones', 'causes', 'rainfall-shift', 2,
    'Note the direction. Rainfall patterns do not brew cyclones — that needs warm sea surface and low wind shear — but in cyclone basins the storms are the dominant source of extreme rainfall totals, and they now carry more water and move more slowly.');
  l('drought', 'increases', 'wildfire', 3);
  l('drought', 'causes', 'water-scarcity', 3);
  l('drought', 'drives', 'food-insecurity', 3,
    'Rain-fed farming simply fails. After conflict, this is the largest single driver of acute food crises.');
  l('drought', 'accelerates', 'desertification', 3);
  l('drought', 'accelerates', 'groundwater', 2, 'When rain fails, pumping increases.');
  l('drought', 'drives', 'displacement', 2);
  l('drought', 'worsens', 'resource-conflict', 2,
    'A failed season pushes herders onto cropland and neighbours onto the same well. Scarcity rarely starts a war, but it reliably sharpens a dispute that already exists.');
  l('wildfire', 'causes', 'air-pollution', 3, 'Smoke can harm people thousands of kilometres downwind.');
  l('wildfire', 'worsens', 'respiratory', 2,
    'Smoke PM2.5 appears to be more inflammatory per microgram than traffic particulate, and it arrives in week-long doses.');
  l('wildfire', 'releases', 'ghg-emissions', 2);
  l('wildfire', 'causes', 'habitat-loss', 2);
  l('wildfire', 'increases', 'soil-erosion', 2, 'Bare, water-repellent burnt ground erodes badly in the first rains.');
  l('wildfire', 'weakens', 'carbon-sinks', 2);
  l('rainfall-shift', 'drives', 'drought', 3,
    'The supply side of drought. The map already had the demand side — thirstier air pulling moisture out of soil — but a rainfall deficit is what the word means first.');
  l('rainfall-shift', 'worsens', 'water-scarcity', 2,
    'The same annual total delivered in fewer, heavier bursts mostly runs off — storage built for the old pattern cannot catch it.');
  l('rainfall-shift', 'increases', 'soil-erosion', 2);
  l('rainfall-shift', 'causes', 'waterborne', 2);
  l('rainfall-shift', 'threatens', 'food-insecurity', 2,
    'Planting calendars were built around a rainfall pattern that is now moving under them.');
  l('rainfall-shift', 'flushes', 'nutrient-runoff', 2);
  l('rainfall-shift', 'contaminates', 'unsafe-water', 1,
    'Heavy rain overwhelms combined sewers, which then discharge into the water people drink from downstream.');

  /* ── Water ──────────────────────────────────────────────────────────────── */
  l('glacier-water', 'worsens', 'water-scarcity', 2,
    'Losing the ice means losing the timing: the water arrives in spring melt instead of through the dry season when it is needed.');
  l('glacier-water', 'worsens', 'resource-conflict', 1,
    'Glacier-fed basins almost all cross borders, and upstream storage decisions are felt downstream immediately.');
  l('glacier-water', 'threatens', 'food-insecurity', 1,
    'Dry-season irrigation across the Indo-Gangetic plain runs on water that spent the winter as mountain ice.');
  l('water-scarcity', 'drives', 'groundwater', 3);
  l('water-scarcity', 'threatens', 'food-insecurity', 2,
    'Irrigation is the first allocation cut when water is short, and irrigated land grows a disproportionate share of the world\'s calories.');
  l('water-scarcity', 'worsens', 'resource-conflict', 2,
    'Most large river basins cross a border and many have no binding allocation agreement, so shortage becomes a negotiation with no referee.');
  l('water-scarcity', 'worsens', 'unsafe-water', 2,
    'When the safe source runs dry people switch to an unsafe one, and less dilution concentrates whatever is already in the water.');
  l('groundwater', 'drives', 'salinization', 2, 'Over-pumping near a coast pulls seawater into the aquifer.');
  l('groundwater', 'raises', 'sea-level', 1, 'Water pumped from aquifers ultimately ends up in the ocean.');
  l('groundwater', 'threatens', 'food-insecurity', 2,
    'A large share of irrigated food is grown on groundwater, and the aquifers under the Punjab, the North China Plain and the Ogallala are all being drawn down faster than they refill.');
  l('salinization', 'causes', 'land-degradation', 2);
  l('salinization', 'threatens', 'food-insecurity', 2,
    'Salinized ground loses yield more or less permanently — leaching it back is slow, expensive and needs the fresh water that is already short.');
  l('salinization', 'contaminates', 'unsafe-water', 2);
  l('salinization', 'forces', 'displacement', 2);
  l('dams', 'fragments', 'habitat-loss', 2);
  l('dams', 'drives', 'extinction', 2, 'Blocked migration routes are a leading cause of freshwater species decline.');
  l('dams', 'starves', 'wetland-loss', 2, 'Trapped sediment stops deltas rebuilding themselves.');
  l('dams', 'releases', 'methane', 1, 'Reservoirs flooding vegetation in warm regions can emit substantially.');
  l('dams', 'forces', 'displacement', 2);
  l('dams', 'buffers', 'water-scarcity', 2,
    'Storage is genuinely why dams get built: they move water from the wet season to the dry one.');
  l('dams', 'reduces', 'ghg-emissions', 1, 'Hydropower displaces fossil generation.');
  l('unsafe-water', 'causes', 'waterborne', 3);
  l('unsafe-water', 'worsens', 'env-injustice', 2,
    'Informal settlements sit outside the piped network, so the people with least money pay most per litre — to vendors, in time, or in illness.');
  l('nutrient-runoff', 'causes', 'dead-zones', 3,
    'Nutrients feed the bloom, the bloom dies, and its decay strips the oxygen. This is the whole mechanism — dead zones are not caused by contaminated drinking water, which runs the other way as a human outcome.');
  l('thermal-pollution', 'worsens', 'dead-zones', 2,
    'Warm water holds less dissolved oxygen, so a thermal plume pushes an already-stressed basin further toward hypoxia.');
  l('thermal-pollution', 'threatens', 'extinction', 1,
    'A warmed outfall reshuffles which species can hold a stretch of river, and intake screens kill fish and larvae outright.');
  l('heatwaves', 'worsens', 'thermal-pollution', 1,
    'Hot summers push discharge temperatures past permit limits, which is why French and US thermal plants derate or shut down in heatwaves.');
  l('fossil-fuels', 'causes', 'thermal-pollution', 2, 'Coal and gas plants are steam-cycle too, and there are far more of them.');
  l('nutrient-runoff', 'contaminates', 'unsafe-water', 2);
  l('nutrient-runoff', 'kills', 'kelp-seagrass', 2, 'Murky, nutrient-rich water stops light reaching the seabed.');
  l('nutrient-runoff', 'worsens', 'coral-bleaching', 2,
    'Nutrient-loaded water lowers the heat threshold at which coral bleaches, and feeds the algae that colonise it afterwards.');
  l('nutrient-runoff', 'worsens', 'acidification', 1, 'Decaying blooms release CO2, acidifying coastal water further.');
  l('dead-zones', 'threatens', 'food-insecurity', 1,
    'Hypoxic water kills or drives off the bottom-dwelling species that coastal fisheries are built on — the Gulf of Mexico shrimp grounds are the standing example.');
  l('dead-zones', 'drives', 'extinction', 1,
    'Sessile bottom life cannot swim away from an oxygen crash, so hypoxia clears whole benthic communities.');

  /* ── Agriculture & land ─────────────────────────────────────────────────── */
  l('industrial-ag', 'drives', 'nutrient-runoff', 3);
  l('industrial-ag', 'drives', 'pesticides', 3);
  l('industrial-ag', 'drives', 'soil-erosion', 3);
  l('industrial-ag', 'degrades', 'soil-life', 3);
  l('industrial-ag', 'drives', 'monoculture', 3);
  l('industrial-ag', 'drives', 'habitat-loss', 3);
  l('industrial-ag', 'depletes', 'water-scarcity', 2, 'Agriculture takes roughly 70% of all freshwater withdrawals.');
  l('industrial-ag', 'depletes', 'groundwater', 2);
  l('industrial-ag', 'releases', 'ghg-emissions', 2, 'Fertiliser manufacture, nitrous oxide from soils, and machinery.');
  l('industrial-ag', 'drives', 'deforestation', 2);
  l('industrial-ag', 'limits', 'food-insecurity', 2,
    'The uncomfortable half of the ledger: industrial agriculture is why food is cheap and abundant. Reform has to preserve that.');
  l('livestock', 'drives', 'deforestation', 3, 'Cattle pasture is the single largest driver of tropical forest clearing.');
  l('livestock', 'releases', 'methane', 3);
  l('livestock', 'causes', 'land-degradation', 2);
  l('livestock', 'drives', 'nutrient-runoff', 2);
  l('livestock', 'depletes', 'water-scarcity', 2);
  l('livestock', 'drives', 'pharma-residues', 2, 'Routine antibiotic use in intensive operations.');
  l('livestock', 'drives', 'habitat-loss', 2);
  l('livestock', 'releases', 'ghg-emissions', 2);
  l('monoculture', 'harms', 'pollinators', 2, 'A monoculture offers a two-week glut and then nothing.');
  l('monoculture', 'increases', 'pesticides', 2);
  l('monoculture', 'degrades', 'soil-life', 2);
  l('monoculture', 'threatens', 'food-insecurity', 1, 'Genetic uniformity means one new disease can hit a whole region at once.');
  l('pesticides', 'harms', 'pollinators', 3,
    'Neonicotinoids are systemic, so the insecticide is in the pollen and nectar rather than only on the surface, and sub-lethal doses wreck navigation and foraging.');
  l('pesticides', 'drives', 'insect-decline', 3);
  l('pesticides', 'degrades', 'soil-life', 2);
  l('pesticides', 'contaminates', 'unsafe-water', 2);
  l('pesticides', 'worsens', 'env-injustice', 2, 'Exposure falls overwhelmingly on farmworkers and nearby communities.');
  l('pesticides', 'limits', 'food-insecurity', 1,
    'Pesticides do protect yields — which is why "just ban them" is not a serious policy on its own.');
  l('soil-erosion', 'causes', 'land-degradation', 3);
  l('soil-erosion', 'threatens', 'food-insecurity', 2,
    'Yield tracks topsoil depth fairly directly, and topsoil is being lost far faster than it forms.');
  l('soil-erosion', 'smothers', 'coral-bleaching', 1, 'Sediment plumes stress reefs already weakened by heat.');
  l('soil-erosion', 'weakens', 'carbon-sinks', 1);
  l('soil-life', 'increases', 'soil-erosion', 2, 'Without fungal networks and roots, soil loses the structure that holds it together.');
  l('soil-life', 'causes', 'land-degradation', 2);
  l('land-degradation', 'accelerates', 'desertification', 2);
  l('land-degradation', 'drives', 'food-insecurity', 3,
    'The cumulative endpoint of the others: land that no longer grows what it used to, and needs bought inputs to produce anything.');
  l('land-degradation', 'forces', 'displacement', 2);
  l('desertification', 'forces', 'displacement', 2);
  l('desertification', 'worsens', 'resource-conflict', 2,
    'As the grazing margin retreats, herders and farmers end up claiming the same ground — the Sahel pattern.');
  l('desertification', 'drives', 'food-insecurity', 2,
    'Dryland farming and herding have the least buffer of any livelihood against a season that does not arrive.');
  l('desertification', 'increases', 'air-pollution', 1, 'Dust from degraded land travels continental distances.');
  l('food-waste', 'releases', 'methane', 3, 'Food rotting without oxygen in landfill is a major methane source.');
  l('food-waste', 'drives', 'landfill-waste', 2);
  l('food-waste', 'releases', 'ghg-emissions', 2, 'Estimated at 8-10% of global emissions once production is counted.');
  l('food-waste', 'drives', 'habitat-loss', 1, 'Land cleared to grow food nobody eats.');
  l('urban-sprawl', 'drives', 'habitat-loss', 3);
  l('urban-sprawl', 'releases', 'ghg-emissions', 2, 'Low density locks in car dependence for decades.');
  l('urban-sprawl', 'causes', 'air-pollution', 2);
  l('urban-sprawl', 'drives', 'light-pollution', 2);
  l('urban-sprawl', 'drives', 'noise-pollution', 2);
  l('urban-sprawl', 'causes', 'land-degradation', 2, 'Sealed soil stops absorbing water and stops functioning as soil.');
  l('mining', 'releases', 'heavy-metals', 3);
  l('mining', 'causes', 'habitat-loss', 2);
  l('mining', 'depletes', 'water-scarcity', 2);
  l('mining', 'drives', 'deforestation', 1, 'Access roads open previously unreachable forest.');
  l('mining', 'worsens', 'env-injustice', 2, 'Frequently on Indigenous land, often without meaningful consent.');
  l('mining', 'causes', 'land-degradation', 2);
  l('mining', 'contaminates', 'unsafe-water', 2, 'Acid drainage from tailings can persist for centuries.');
  l('mining', 'causes', 'air-pollution', 1, 'Smelter sulphur dioxide, and dust off haul roads and tailings.');
  l('mining', 'reduces', 'ghg-emissions', 1,
    'The transition\'s own dependency: copper, lithium and nickel are what a low-carbon grid is built from.');

  /* ── Ecosystems ─────────────────────────────────────────────────────────── */
  l('deforestation', 'causes', 'habitat-loss', 3);
  l('deforestation', 'releases', 'ghg-emissions', 3);
  l('deforestation', 'drives', 'extinction', 3);
  l('deforestation', 'increases', 'soil-erosion', 3);
  l('deforestation', 'weakens', 'carbon-sinks', 3);
  l('deforestation', 'disrupts', 'rainfall-shift', 2, 'Large forests generate much of their own rainfall; clearing them dries the region.');
  l('deforestation', 'causes', 'land-degradation', 2);
  l('deforestation', 'expands', 'vector-disease', 1, 'Forest edges bring people, mosquitoes and wildlife into contact.');
  l('deforestation', 'enables', 'wildlife-trade', 1, 'Logging roads are trafficking routes.');
  l('habitat-loss', 'drives', 'extinction', 3);
  l('habitat-loss', 'harms', 'pollinators', 2,
    'Most wild bees nest in bare ground or dead stems within a few hundred metres of forage, so tidy, fragmented landscapes remove the nesting site and the flowers together.');
  l('habitat-loss', 'drives', 'insect-decline', 2);
  l('habitat-loss', 'enables', 'invasives', 1, 'Disturbed ground is where introduced species establish first.');
  l('wetland-loss', 'increases', 'displacement', 2, 'Removing the natural surge buffer makes storms costlier to survive.');
  l('wetland-loss', 'releases', 'ghg-emissions', 2, 'Drained peat and cleared mangrove release centuries of stored carbon.');
  l('wetland-loss', 'drives', 'extinction', 2);
  l('wetland-loss', 'worsens', 'dead-zones', 2, 'Wetlands were intercepting the nutrients before they reached the sea.');
  l('wetland-loss', 'threatens', 'food-insecurity', 1, 'Most commercial fish species use wetlands as nurseries.');
  l('pollinators', 'threatens', 'food-insecurity', 2,
    'Roughly a third of global crop volume depends on animal pollination.');
  l('insect-decline', 'drives', 'extinction', 2, 'Insects are the food supply for most birds, bats and freshwater fish.');
  l('insect-decline', 'threatens', 'food-insecurity', 1,
    'Distinct from pollination: insects are also the biological pest control and the decomposition that soil fertility runs on.');
  l('light-pollution', 'drives', 'insect-decline', 2);
  l('light-pollution', 'drives', 'extinction', 1,
    'Fatal disorientation at scale: fledgling seabirds and turtle hatchlings head for the light instead of the sea, and migrating birds collide with lit towers.');
  l('noise-pollution', 'drives', 'extinction', 1, 'Ocean noise masks the communication whales rely on across distance.');
  l('noise-pollution', 'worsens', 'respiratory', 2, 'Chronic noise is associated with hypertension and heart disease.');
  l('overfishing', 'drives', 'extinction', 2);
  l('overfishing', 'threatens', 'food-insecurity', 2,
    'Fish is the main animal protein for billions of people, and the stocks fished hardest are often the ones they depend on directly.');
  l('overfishing', 'worsens', 'coral-bleaching', 2, 'Removing herbivores lets algae take over a weakened reef.');
  l('overfishing', 'drives', 'kelp-seagrass', 2, 'Losing predators lets urchins strip kelp forests to barrens.');
  l('overfishing', 'causes', 'habitat-loss', 2, 'Bottom trawling flattens seabed structure.');
  l('invasives', 'drives', 'extinction', 3);
  l('invasives', 'causes', 'habitat-loss', 1);
  l('invasives', 'threatens', 'food-insecurity', 1,
    'Fall armyworm across African maize, locust outbreaks, and water hyacinth choking the inland fisheries people eat from.');
  l('invasives', 'harms', 'pollinators', 1,
    'Introduced parasites and diseases spread from managed hives into wild populations, and invasive plants can monopolise pollinator visits.');
  l('wildlife-trade', 'drives', 'extinction', 3);
  l('wildlife-trade', 'spreads', 'invasives', 1);
  l('coral-bleaching', 'drives', 'extinction', 2);
  l('coral-bleaching', 'threatens', 'food-insecurity', 2,
    'Reef fisheries are a primary protein source across the tropics, and a bleached reef supports a small fraction of the fish a living one does.');
  l('coral-bleaching', 'increases', 'displacement', 1, 'Reefs break waves; without them, coastlines erode faster.');
  l('kelp-seagrass', 'weakens', 'carbon-sinks', 1);
  l('kelp-seagrass', 'drives', 'extinction', 1,
    'An urchin barren holds a fraction of the species a kelp forest does, and the loss is of the structure itself rather than of any one animal.');

  /* Extinction is terminal for a species but not for the system, so it needs
   * downstream edges — without them the map's central biodiversity outcome affects
   * nothing. Both below are specific mechanisms, not "biodiversity loss is bad". */
  l('extinction', 'weakens', 'carbon-sinks', 2,
    'The empty-forest effect: lose the large frugivores and nobody disperses the large-seeded hardwoods, so a structurally intact forest slowly stores less carbon.');
  l('extinction', 'threatens', 'food-insecurity', 1,
    'Crop wild relatives are the gene pool breeders draw on for drought and disease resistance, and they cannot be recovered once gone.');

  /* ── Consumption & waste ────────────────────────────────────────────────── */
  l('overconsumption', 'drives', 'ghg-emissions', 3);
  l('overconsumption', 'drives', 'plastic', 3);
  l('overconsumption', 'drives', 'ewaste', 3);
  l('overconsumption', 'drives', 'mining', 3);
  l('overconsumption', 'drives', 'landfill-waste', 3);
  l('overconsumption', 'drives', 'microplastics', 2, 'Synthetic textiles shed fibres every wash.');
  l('overconsumption', 'drives', 'deforestation', 1);
  l('plastic', 'fragments into', 'microplastics', 3);
  l('plastic', 'drives', 'landfill-waste', 2);
  l('plastic', 'threatens', 'extinction', 1,
    'Entanglement and gut blockage in seabirds, turtles and cetaceans — a mortality effect on individuals rather than a driver of whole-species loss.');
  l('plastic', 'releases', 'ghg-emissions', 1, 'Production and incineration both emit.');
  l('microplastics', 'threatens', 'extinction', 1,
    'The weakest claim on this map, kept deliberately weak: laboratory harm to filter feeders and larvae is established, population-level effects in the wild are not.');
  l('microplastics', 'degrades', 'soil-life', 1);
  l('pfas', 'contaminates', 'unsafe-water', 3);
  l('pfas', 'worsens', 'env-injustice', 2,
    'Contamination clusters around military bases, airports and fluorochemical plants, and the water systems least able to afford treatment are the ones that get it.');
  l('heavy-metals', 'contaminates', 'unsafe-water', 3);
  l('heavy-metals', 'worsens', 'env-injustice', 3, 'Lead exposure tracks poverty and housing age almost exactly.');
  l('heavy-metals', 'threatens', 'extinction', 1,
    'Metals biomagnify up the food chain, so the top predators carry the dose — mercury in large fish, lead in raptors and waterfowl.');
  l('ewaste', 'releases', 'heavy-metals', 3, 'Burning plastic off wiring to reach the copper releases dioxins and metals.');
  l('ewaste', 'worsens', 'env-injustice', 2,
    'The dismantling happens where labour is cheapest and protective equipment rarest, often by hand and often by children.');
  l('ewaste', 'drives', 'landfill-waste', 2);
  l('ewaste', 'drives', 'mining', 2, 'Metal not recovered has to be dug up again.');
  l('landfill-waste', 'releases', 'methane', 3);
  l('landfill-waste', 'contaminates', 'unsafe-water', 2);
  l('landfill-waste', 'causes', 'air-pollution', 2, 'Open burning produces some of the most toxic smoke there is.');
  l('landfill-waste', 'worsens', 'env-injustice', 2,
    'Siting follows the path of least political resistance, which is the most reliably documented pattern in the whole environmental justice literature.');
  l('oil-spills', 'threatens', 'extinction', 1,
    'A single spill can take out most of a local breeding population, which matters most where the species only breeds there.');
  l('oil-spills', 'causes', 'wetland-loss', 2);
  l('oil-spills', 'contaminates', 'unsafe-water', 1);
  l('pharma-residues', 'threatens', 'extinction', 1, 'Diclofenac residues collapsed South Asian vulture populations.');
  l('pharma-residues', 'contaminates', 'unsafe-water', 2);
  l('pharma-residues', 'worsens', 'waterborne', 1, 'Environmental antibiotic residues help drive resistance.');

  /* ── Air & health ───────────────────────────────────────────────────────── */
  l('air-pollution', 'causes', 'respiratory', 3);
  l('air-pollution', 'feeds', 'ozone-smog', 2);
  l('air-pollution', 'worsens', 'env-injustice', 2,
    'Exposure tracks proximity to highways, ports and industry, and that is what the cheapest housing is next to.');
  l('air-pollution', 'threatens', 'food-insecurity', 1,
    'Haze cuts the sunlight reaching the crop — a different mechanism from ozone, which damages the plant tissue directly.');
  l('ozone-smog', 'worsens', 'respiratory', 3,
    'Ozone is directly corrosive to airway tissue, which is why asthma admissions track afternoon peaks rather than daily averages.');
  l('ozone-smog', 'threatens', 'food-insecurity', 1, 'Ozone measurably cuts wheat, rice and soy yields.');
  l('indoor-air', 'causes', 'respiratory', 3);
  l('indoor-air', 'worsens', 'env-injustice', 2, 'The burden falls mainly on women and young children.');

  /* ── Human consequences chaining onward ─────────────────────────────────── */
  l('displacement', 'worsens', 'resource-conflict', 2,
    'Arrival concentrates demand for land, water and work in places that had no spare, and rarely with any settled claim to it.');
  l('displacement', 'worsens', 'food-insecurity', 1,
    'People who move lose the land, the tools and the seed they farmed with, and rarely get them back.');
  l('displacement', 'worsens', 'climate-anxiety', 1,
    'Losing a place, not just a house — solastalgia is the term for grief at the loss of somewhere you belonged to.');
  l('displacement', 'worsens', 'waterborne', 1, 'Camps and informal settlements are where cholera outbreaks start.');
  l('resource-conflict', 'worsens', 'food-insecurity', 2,
    'Conflict is the leading driver of acute food crises worldwide, ahead of drought — it blocks planting, harvest and delivery at once.');
  l('resource-conflict', 'forces', 'displacement', 2);
  l('food-insecurity', 'forces', 'displacement', 2);
  l('food-insecurity', 'worsens', 'resource-conflict', 1,
    'Food price spikes have repeatedly preceded unrest, though the causal weight sits with governance and the price is the trigger rather than the cause.');
  l('env-injustice', 'concentrates', 'respiratory', 2);
  l('env-injustice', 'concentrates', 'heat-mortality', 2, 'The hottest neighbourhoods are reliably the least shaded and least wealthy.');
  l('env-injustice', 'worsens', 'climate-anxiety', 1,
    'Distress is sharper where people can see the harm arriving and know the decision was made somewhere they had no vote.');
  l('heat-mortality', 'worsens', 'climate-anxiety', 1,
    'Deaths that were preventable, among neighbours, tend to land differently from a statistic.');
  l('vector-disease', 'worsens', 'food-insecurity', 1,
    'Malaria transmission peaks in the farming season, taking labour out of the fields at exactly the wrong weeks.');
  l('waterborne', 'worsens', 'food-insecurity', 1, 'Repeated childhood diarrhoeal disease causes lasting malnutrition.');

})(window.ECO);
