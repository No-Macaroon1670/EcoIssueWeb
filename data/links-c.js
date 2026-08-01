/* Links for the newer issues and for the whole solutions layer.
 *
 * Solutions mostly emit suppressing verbs (dashed, open chevron). Several also
 * emit an ordinary driving link, because most real levers cost something
 * somewhere — renewables need mined metal, nuclear makes waste, carbon pricing
 * lands on the people least able to absorb it. Those edges are the point.
 */
(function (E) {
  const l = E.l.bind(E);

  /* ── Newer issues ───────────────────────────────────────────────────────── */
  l('data-centres', 'drives', 'ghg-emissions', 2,
    'Weaker than it looks at first. The emissions are the grid\'s, not the building\'s, so the answer depends on where and when the load lands and whether new clean generation arrives with it. The IEA expects renewables to meet close to half the additional data-centre demand to 2030, with gas and coal supplying much of the rest.');
  l('data-centres', 'depletes', 'water-scarcity', 2,
    'Evaporative cooling consumes real water and is often sited where water is already short, but the range across sites is enormous — closed-loop, air-cooled and reclaimed-water designs use far less, and some of the total sits upstream in power generation rather than at the building.');
  l('data-centres', 'drives', 'mining', 2, 'Chips, servers and the copper to connect them.');
  l('data-centres', 'drives', 'ewaste', 2, 'Server refresh cycles are short.');
  l('data-centres', 'drives', 'fossil-fuels', 2,
    'The pathway that actually matters. Load arriving faster than clean generation can be added keeps existing fossil plants running, and has deferred coal retirements outright in several markets.');
  l('data-centres', 'causes', 'air-pollution', 1,
    'The direct but minor path: backup diesel generators tested monthly, and on-site gas turbines at a handful of sites. Most of the air-quality effect runs indirectly, through the grid.');
  l('data-centres', 'drives', 'noise-pollution', 2,
    'The most consistent local complaint by some distance — chillers and fan walls run every hour of the year, and the tone carries further than the volume suggests.');
  l('data-centres', 'worsens', 'energy-poverty', 1, 'Contested: large new loads can raise system costs that land on all bill-payers.');

  l('warming', 'drives', 'geoengineering', 2, 'The pressure to attempt it grows with every year of missed targets.');
  l('geoengineering', 'shields', 'warming', 3,
    'It would work, and that is the problem: it masks temperature while leaving CO2, and therefore ocean acidification, untouched.');
  l('geoengineering', 'disrupts', 'rainfall-shift', 2,
    'The most serious regional objection, and an uncertain one. Models agree that reflecting sunlight would alter the hydrological cycle unevenly, and monsoon regions come up repeatedly, but the sign and size of the regional effect depend on the method, the amount and the deployment pattern. There is no single agreed map of who loses rain.');
  l('geoengineering', 'worsens', 'resource-conflict', 1,
    'No comprehensive binding regime governs deployment of a technology one state could attempt alone. Existing instruments touch parts of it — non-binding decisions under the Convention on Biological Diversity, and ozone and environmental law that may apply by analogy — but authorisation, liability, monitoring and termination are all unaddressed.');

  l('carbon-offsets', 'limits', 'ghg-emissions', 1, 'Only where the credit represents a reduction that would not have happened anyway. Many do not.');
  l('carbon-offsets', 'enables', 'fossil-fuels', 2, 'The core critique: a credible-sounding offset removes the pressure to cut at source.');

  l('nuclear-power', 'causes', 'nuclear-waste', 3, 'The unavoidable ledger entry: very low carbon, and custody measured in millennia.');
  /* Uranium mining hangs off nuclear-power, below, not off nuclear-waste. Fuel demand
   * is what opens a mine; spent fuel is what comes out the other end. The old
   * nuclear-waste -> mining edge had the causal arrow running backwards through time. */
  l('nuclear-waste', 'worsens', 'env-injustice', 2,
    'Uranium extraction, milling, weapons testing and waste storage have repeatedly landed on Indigenous and politically marginalised communities. Repository siting is where this is being consciously reversed: the Finnish and Canadian processes are built around demonstrated host-community consent, which is a real break from the earlier record rather than a restatement of it.');
  /* No nuclear-waste -> unsafe-water edge. A reactor's routine effect on water is
   * thermal, not contaminative, and "unsafe water" here is a human drinking-water and
   * sanitation node. The genuine contamination pathway is uranium mining and milling,
   * which already reaches unsafe water through the mining node. */
  l('nuclear-power', 'causes', 'thermal-pollution', 2,
    'Once-through cooling returns the water warmer, which is the everyday water impact of any steam-cycle plant.');

  l('battery-waste', 'drives', 'landfill-waste', 2);
  l('battery-waste', 'releases', 'heavy-metals', 2,
    'Cobalt, nickel and — from the separate and much older lead-acid stream — lead. Lithium itself is not a heavy metal and is not the toxicity concern; the lithium-ion hazard is the corrosive electrolyte and the fires that damaged cells start in collection trucks and sorting halls.');
  l('battery-waste', 'drives', 'mining', 2,
    'The other half of the ledger: metal not recovered has to be dug up again.');

  l('deep-sea-mining', 'threatens', 'extinction', 1,
    'Deliberately weaker than the habitat edge below. Nodule-dependent species may well have ranges small enough that clearing a licence area removes them entirely, but abyssal species distributions are barely described, so the risk cannot be quantified. The uncertainty runs both ways: extinctions here could happen without anyone recording them.');
  l('deep-sea-mining', 'causes', 'habitat-loss', 3,
    'The strong claim, and the one worth arguing from. The nodules are the hard substrate much of the life down there grows on, and they form over millions of years. Tracks from an experimental clearance in the 1970s were still visible with measurably altered biology four decades later, with only partial recovery among mobile and sediment-dwelling animals.');
  /* No deep-sea-mining -> mining edge. The industry's central pitch is that seabed
   * metal substitutes for land extraction; it could equally add to total supply, lower
   * prices and raise demand. An edge asserts a sign, and this one has none that the
   * evidence supports, so the argument belongs in the node summary instead. */

  /* ── Energy levers ──────────────────────────────────────────────────────── */
  l('renewables', 'displaces', 'fossil-fuels', 3);
  l('renewables', 'reduces', 'ghg-emissions', 3);
  l('renewables', 'reduces', 'air-pollution', 2);
  l('renewables', 'reduces', 'energy-poverty', 2, 'Distributed solar reaches remote areas faster than grid extension.');
  l('renewables', 'drives', 'mining', 2, 'The material cost of the transition, and a real one.');
  l('renewables', 'drives', 'battery-waste', 1, 'Indirectly, through the grid storage that variable generation needs.');
  l('grid-storage', 'enables', 'renewables', 3,
    'One of the things that decides how far variable generation can go, not the only one. Transmission, interconnection across weather systems, flexible demand and dispatchable low-carbon plant all buy the same flexibility, and the cheapest mix differs by grid.');
  l('grid-storage', 'drives', 'mining', 2);
  l('electrification', 'requires', 'renewables', 3,
    'The conditional that gets dropped: electrifying onto a coal-heavy grid moves the emissions rather than removing them. What it strictly requires is low-emission electricity — nuclear, hydro and geothermal serve as well, which is why they appear as their own levers — but renewables are where almost all the new supply is being built.');
  l('electrification', 'displaces', 'fossil-fuels', 3);
  l('electrification', 'reduces', 'air-pollution', 3, 'Removes combustion from the street and from the kitchen.');
  l('electrification', 'reduces', 'noise-pollution', 1);
  l('electrification', 'drives', 'mining', 2);
  l('electrification', 'drives', 'battery-waste', 3, 'Every electric vehicle eventually becomes a battery to deal with.');
  l('electrification', 'drives', 'deep-sea-mining', 1, 'Battery metal demand is the case being made for opening the seabed.');
  l('nuclear-power', 'drives', 'mining', 1,
    'Fuel demand is what opens a uranium mine, and milling leaves long-lived tailings behind at the extraction site.');
  l('nuclear-power', 'displaces', 'fossil-fuels', 2);
  l('nuclear-power', 'reduces', 'ghg-emissions', 2);
  l('nuclear-power', 'reduces', 'air-pollution', 1);
  l('efficiency-buildings', 'enables', 'electrification', 2, 'Insulate first and the heat pump you need is smaller and cheaper.');
  l('efficiency-buildings', 'reduces', 'ghg-emissions', 2);
  l('efficiency-buildings', 'cuts', 'cooling-demand', 3);
  l('efficiency-buildings', 'reduces', 'energy-poverty', 2, 'The cheapest cure for fuel poverty is a home that holds its heat.');
  l('efficiency-buildings', 'prevents', 'heat-mortality', 2);
  l('methane-repair', 'cuts', 'methane', 3, 'Often at negative net cost, because the escaping gas is saleable.');
  l('carbon-pricing', 'reduces', 'ghg-emissions', 2,
    'Conditional on design rather than automatic. Most schemes in force price too little of an economy at too low a level to move much; the ones that have cut emissions measurably combined a real price with broad coverage, few exemptions, and credible signals that the price would keep rising.');
  l('carbon-pricing', 'reduces', 'fossil-fuels', 2);
  l('carbon-pricing', 'enables', 'renewables', 2);
  l('carbon-pricing', 'enables', 'carbon-offsets', 1, 'Compliance markets create the demand that the credit quality problem then rides on.');
  l('carbon-pricing', 'worsens', 'energy-poverty', 1,
    'Without visible redistribution it is regressive, unpopular, and then repealed — which is how climate policy loses years.');

  /* ── Materials & waste levers ───────────────────────────────────────────── */
  l('circular-economy', 'reduces', 'mining', 3,
    'A tonne of clean recovered metal substitutes for a tonne of primary metal, which is the strong version of the claim. The system-level version is weaker: collection losses, imperfect yields and demand still growing fast mean recycling slows the growth of mining rather than closing mines.');
  l('circular-economy', 'reduces', 'ewaste', 3);
  l('circular-economy', 'reduces', 'landfill-waste', 3);
  l('circular-economy', 'reduces', 'plastic', 2);
  l('circular-economy', 'reduces', 'overconsumption', 2);
  l('circular-economy', 'reduces', 'battery-waste', 3, 'Recovery is the supply that grows as the first fleets age out.');
  l('circular-economy', 'reduces', 'deep-sea-mining', 2, 'Recovery is the supply that grows as the first fleets age out.');
  l('product-standards', 'enables', 'circular-economy', 3, 'Repair is only possible if the product was designed to come apart.');
  l('product-standards', 'reduces', 'ewaste', 3);
  l('product-standards', 'reduces', 'overconsumption', 2);
  l('product-standards', 'reduces', 'battery-waste', 2, 'Replaceable packs and design-for-disassembly decide whether recovery is even possible.');
  l('new-materials', 'reduces', 'ghg-emissions', 2, 'Cement and steel need different chemistry, not just cleaner electricity.');
  l('new-materials', 'reduces', 'plastic', 2);
  l('new-materials', 'reduces', 'microplastics', 2);
  l('new-materials', 'reduces', 'mining', 1);
  l('organics-diversion', 'cuts', 'methane', 3);
  l('organics-diversion', 'reduces', 'landfill-waste', 3);
  l('organics-diversion', 'reduces', 'soil-biodiversity-loss', 2, 'Compost returns carbon and structure to soil that tillage stripped out.');

  /* ── Land & food levers ─────────────────────────────────────────────────── */
  l('regen-ag', 'reduces', 'soil-erosion', 3);
  l('regen-ag', 'reduces', 'soil-biodiversity-loss', 3);
  l('regen-ag', 'reduces', 'nutrient-runoff', 2);
  l('regen-ag', 'reduces', 'pesticides', 2);
  l('regen-ag', 'reduces', 'land-degradation', 2);
  l('regen-ag', 'absorbs', 'ghg-emissions', 1, 'Soil-carbon claims are frequently overstated; the erosion and water benefits are not.');
  l('agroforestry', 'reduces', 'soil-erosion', 2);
  l('agroforestry', 'reduces', 'desertification', 2);
  l('agroforestry', 'reduces', 'land-degradation', 2);
  l('agroforestry', 'reduces', 'pollinator-decline', 2, 'Field-margin flower resources are what wild pollinators actually need.');
  l('agroforestry', 'absorbs', 'ghg-emissions', 2);
  l('diet-shift', 'reduces', 'livestock', 3);
  l('diet-shift', 'reduces', 'deforestation', 2, 'Pasture is the largest single driver of tropical clearing.');
  l('diet-shift', 'cuts', 'methane', 2);
  l('diet-shift', 'reduces', 'water-scarcity', 1);
  l('diet-shift', 'reduces', 'nutrient-runoff', 1);
  l('transit-density', 'reduces', 'urban-sprawl', 3);
  l('transit-density', 'reduces', 'air-pollution', 2);
  l('transit-density', 'reduces', 'ghg-emissions', 2);
  l('transit-density', 'limits', 'habitat-loss', 2, 'Density is a biodiversity policy as much as a transport one.');
  l('transit-density', 'reduces', 'noise-pollution', 1);
  l('transit-density', 'reduces', 'microplastics', 1, 'Tyre wear is a leading source, and it scales with distance driven.');

  /* ── Nature & water levers ──────────────────────────────────────────────── */
  l('protected-areas', 'prevents', 'habitat-loss', 3);
  l('protected-areas', 'reduces', 'extinction', 3);
  l('protected-areas', 'reduces', 'deforestation', 2);
  l('protected-areas', 'reduces', 'wildlife-trade', 1);
  l('protected-areas', 'absorbs', 'ghg-emissions', 1);
  l('coastal-restoration', 'reduces', 'wetland-loss', 3);
  l('coastal-restoration', 'prevents', 'displacement', 2, 'Mangroves measurably cut surge damage, so fewer people are forced out.');
  l('coastal-restoration', 'reduces', 'dead-zones', 2, 'Wetlands intercept the nutrients before they reach the sea.');
  l('coastal-restoration', 'absorbs', 'ghg-emissions', 2, 'Rewetting peat is among the cheapest large-scale reductions available.');
  l('fisheries-mgmt', 'reduces', 'overfishing', 3);
  l('fisheries-mgmt', 'reduces', 'extinction', 2);
  l('fisheries-mgmt', 'reduces', 'kelp-seagrass-loss', 2, 'Predator recovery is what stops urchins stripping kelp to barrens.');
  l('fisheries-mgmt', 'reduces', 'coral-bleaching', 1, 'Herbivore recovery decides whether a heat-stressed reef comes back.');
  l('fisheries-mgmt', 'limits', 'food-insecurity', 2, 'Restraint measurably raises long-run catch — this is the clearest such case here.');
  l('water-efficiency', 'reduces', 'water-scarcity', 3);
  l('water-efficiency', 'reduces', 'groundwater-depletion', 3);
  l('water-efficiency', 'reduces', 'salinization', 2);
  l('water-efficiency', 'limits', 'food-insecurity', 1,
    'More crop per drop — but only where allocation is also capped, or the saved water just irrigates more land.');
  l('wastewater-upgrade', 'reduces', 'unsafe-water', 3);
  l('wastewater-upgrade', 'prevents', 'waterborne', 3);
  l('wastewater-upgrade', 'reduces', 'nutrient-runoff', 2);
  l('wastewater-upgrade', 'reduces', 'dead-zones', 2);
  l('wastewater-upgrade', 'reduces', 'pharma-residues', 2,
    'Ozonation and activated carbon do remove most pharmaceutical residues, and Switzerland has made that stage mandatory at larger plants — this is an upgrade with a demonstrated result.');
  l('wastewater-upgrade', 'reduces', 'pfas', 1,
    'The weakest edge on this lever, and restored deliberately: it is the same shape as the pharmaceutical one above, where an ordinary plant does little and a deliberate treatment stage does a lot. Activated carbon and ion exchange do cut what reaches the river. They do not destroy anything — the carbon-fluorine bond survives, so the PFAS moves into sludge or a concentrated residual and the disposal problem goes with it.');

  /* ── People levers ──────────────────────────────────────────────────────── */
  l('clean-cooking', 'reduces', 'indoor-air', 3);
  l('clean-cooking', 'prevents', 'respiratory', 2);
  l('clean-cooking', 'reduces', 'energy-poverty', 2);
  l('clean-cooking', 'reduces', 'deforestation', 1, 'Fuelwood and charcoal demand falls with it.');
  l('urban-greening', 'reduces', 'heat-mortality', 2,
    'Shade and evapotranspiration cut exposure, and the effect is largest where canopy is targeted at the neighbourhoods that have least of it. It lowers the risk rather than removing it: during a severe event, cooling access, housing quality, health care and someone checking on people still decide who dies.');
  l('urban-greening', 'reduces', 'heatwaves', 2, 'Shade and evapotranspiration cut the urban heat island directly.');
  l('urban-greening', 'reduces', 'env-injustice', 2, 'Canopy cover maps onto income almost exactly, so planting order is an equity decision.');
  l('urban-greening', 'buffers', 'rainfall-shift', 1, 'Permeable ground absorbs peaks that sealed surfaces turn into flash floods.');
  l('urban-greening', 'reduces', 'air-pollution', 1);
  l('early-warning', 'prevents', 'heat-mortality', 3);
  l('early-warning', 'prevents', 'waterborne', 1);
  l('early-warning', 'limits', 'displacement', 1,
    'Overstated in the original phrasing. Warning gets people out alive and turns a disaster into an evacuation, but it does not save the house, the land or the livelihood — whether displacement becomes permanent is decided by what is left to return to, not by the warning.');

})(window.ECO);
