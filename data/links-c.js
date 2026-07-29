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
  l('data-centres', 'drives', 'ghg-emissions', 3);
  l('data-centres', 'depletes', 'water-scarcity', 2, 'Evaporative cooling, often sited where water is already short.');
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
  l('geoengineering', 'disrupts', 'rainfall-shift', 2, 'Modelled monsoon disruption is the most serious regional objection.');
  l('geoengineering', 'worsens', 'resource-conflict', 1, 'No governance regime exists for a technology one state could deploy alone.');

  l('carbon-offsets', 'limits', 'ghg-emissions', 1, 'Only where the credit represents a reduction that would not have happened anyway. Many do not.');
  l('carbon-offsets', 'enables', 'fossil-fuels', 2, 'The core critique: a credible-sounding offset removes the pressure to cut at source.');

  l('nuclear-power', 'causes', 'nuclear-waste', 3, 'The unavoidable ledger entry: very low carbon, and custody measured in millennia.');
  l('nuclear-waste', 'drives', 'mining', 1, 'Uranium extraction and milling.');
  l('nuclear-waste', 'worsens', 'env-injustice', 2, 'Siting has repeatedly landed on communities with the least power to refuse.');
  /* No nuclear-waste -> unsafe-water edge. A reactor's routine effect on water is
   * thermal, not contaminative, and "unsafe water" here is a human drinking-water and
   * sanitation node. The genuine contamination pathway is uranium mining and milling,
   * which already reaches unsafe water through the mining node. */
  l('nuclear-power', 'causes', 'thermal-pollution', 2,
    'Once-through cooling returns the water warmer, which is the everyday water impact of any steam-cycle plant.');

  l('battery-waste', 'drives', 'landfill-waste', 2);
  l('battery-waste', 'releases', 'heavy-metals', 2,
    'Lithium, cobalt, nickel and lead, plus the fires that loose cells start in waste facilities.');
  l('battery-waste', 'drives', 'mining', 2,
    'The other half of the ledger: metal not recovered has to be dug up again.');

  l('deep-sea-mining', 'threatens', 'extinction', 2, 'The nodules are themselves the habitat for much of the life down there.');
  l('deep-sea-mining', 'causes', 'habitat-loss', 2, 'Recovery from disturbance appears to take decades to centuries.');
  l('deep-sea-mining', 'reduces', 'mining', 1, 'The pitch is that it substitutes for land extraction. Whether it would add to it instead is unsettled.');

  /* ── Energy levers ──────────────────────────────────────────────────────── */
  l('renewables', 'displaces', 'fossil-fuels', 3);
  l('renewables', 'reduces', 'ghg-emissions', 3);
  l('renewables', 'reduces', 'air-pollution', 2);
  l('renewables', 'reduces', 'energy-poverty', 2, 'Distributed solar reaches remote areas faster than grid extension.');
  l('renewables', 'drives', 'mining', 2, 'The material cost of the transition, and a real one.');
  l('renewables', 'drives', 'battery-waste', 1, 'Indirectly, through the grid storage that variable generation needs.');
  l('grid-storage', 'enables', 'renewables', 3, 'This is what decides how far variable generation can actually go.');
  l('grid-storage', 'drives', 'mining', 2);
  l('electrification', 'requires', 'renewables', 3,
    'The conditional that gets dropped: electrifying onto a coal-heavy grid moves the emissions rather than removing them.');
  l('electrification', 'displaces', 'fossil-fuels', 3);
  l('electrification', 'reduces', 'air-pollution', 3, 'Removes combustion from the street and from the kitchen.');
  l('electrification', 'reduces', 'noise-pollution', 1);
  l('electrification', 'drives', 'mining', 2);
  l('electrification', 'drives', 'battery-waste', 3, 'Every electric vehicle eventually becomes a battery to deal with.');
  l('electrification', 'drives', 'deep-sea-mining', 1, 'Battery metal demand is the case being made for opening the seabed.');
  l('nuclear-power', 'displaces', 'fossil-fuels', 2);
  l('nuclear-power', 'reduces', 'ghg-emissions', 2);
  l('nuclear-power', 'reduces', 'air-pollution', 1);
  l('efficiency-buildings', 'enables', 'electrification', 2, 'Insulate first and the heat pump you need is smaller and cheaper.');
  l('efficiency-buildings', 'reduces', 'ghg-emissions', 2);
  l('efficiency-buildings', 'cuts', 'cooling-demand', 3);
  l('efficiency-buildings', 'reduces', 'energy-poverty', 2, 'The cheapest cure for fuel poverty is a home that holds its heat.');
  l('efficiency-buildings', 'prevents', 'heat-mortality', 2);
  l('methane-repair', 'cuts', 'methane', 3, 'Often at negative net cost, because the escaping gas is saleable.');
  l('carbon-pricing', 'reduces', 'ghg-emissions', 3);
  l('carbon-pricing', 'reduces', 'fossil-fuels', 2);
  l('carbon-pricing', 'enables', 'renewables', 2);
  l('carbon-pricing', 'enables', 'carbon-offsets', 1, 'Compliance markets create the demand that the credit quality problem then rides on.');
  l('carbon-pricing', 'worsens', 'energy-poverty', 1,
    'Without visible redistribution it is regressive, unpopular, and then repealed — which is how climate policy loses years.');

  /* ── Materials & waste levers ───────────────────────────────────────────── */
  l('circular-economy', 'reduces', 'mining', 3, 'Recovered metal displaces mined metal close to one for one.');
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
  l('organics-diversion', 'reduces', 'soil-life', 2, 'Compost returns carbon and structure to soil that tillage stripped out.');

  /* ── Land & food levers ─────────────────────────────────────────────────── */
  l('regen-ag', 'reduces', 'soil-erosion', 3);
  l('regen-ag', 'reduces', 'soil-life', 3);
  l('regen-ag', 'reduces', 'nutrient-runoff', 2);
  l('regen-ag', 'reduces', 'pesticides', 2);
  l('regen-ag', 'reduces', 'land-degradation', 2);
  l('regen-ag', 'absorbs', 'ghg-emissions', 1, 'Soil-carbon claims are frequently overstated; the erosion and water benefits are not.');
  l('agroforestry', 'reduces', 'soil-erosion', 2);
  l('agroforestry', 'reduces', 'desertification', 2);
  l('agroforestry', 'reduces', 'land-degradation', 2);
  l('agroforestry', 'reduces', 'pollinators', 2, 'Field-margin flower resources are what wild pollinators actually need.');
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
  l('fisheries-mgmt', 'reduces', 'kelp-seagrass', 2, 'Predator recovery is what stops urchins stripping kelp to barrens.');
  l('fisheries-mgmt', 'reduces', 'coral-bleaching', 1, 'Herbivore recovery decides whether a heat-stressed reef comes back.');
  l('fisheries-mgmt', 'limits', 'food-insecurity', 2, 'Restraint measurably raises long-run catch — this is the clearest such case here.');
  l('water-efficiency', 'reduces', 'water-scarcity', 3);
  l('water-efficiency', 'reduces', 'groundwater', 3);
  l('water-efficiency', 'reduces', 'salinization', 2);
  l('water-efficiency', 'limits', 'food-insecurity', 1,
    'More crop per drop — but only where allocation is also capped, or the saved water just irrigates more land.');
  l('wastewater-upgrade', 'reduces', 'unsafe-water', 3);
  l('wastewater-upgrade', 'prevents', 'waterborne', 3);
  l('wastewater-upgrade', 'reduces', 'nutrient-runoff', 2);
  l('wastewater-upgrade', 'reduces', 'dead-zones', 2);
  l('wastewater-upgrade', 'reduces', 'pharma-residues', 2);
  l('wastewater-upgrade', 'reduces', 'pfas', 1);

  /* ── People levers ──────────────────────────────────────────────────────── */
  l('clean-cooking', 'reduces', 'indoor-air', 3);
  l('clean-cooking', 'prevents', 'respiratory', 2);
  l('clean-cooking', 'reduces', 'energy-poverty', 2);
  l('clean-cooking', 'reduces', 'deforestation', 1, 'Fuelwood and charcoal demand falls with it.');
  l('urban-greening', 'prevents', 'heat-mortality', 3);
  l('urban-greening', 'reduces', 'heatwaves', 2, 'Shade and evapotranspiration cut the urban heat island directly.');
  l('urban-greening', 'reduces', 'env-injustice', 2, 'Canopy cover maps onto income almost exactly, so planting order is an equity decision.');
  l('urban-greening', 'buffers', 'rainfall-shift', 1, 'Permeable ground absorbs peaks that sealed surfaces turn into flash floods.');
  l('urban-greening', 'reduces', 'air-pollution', 1);
  l('early-warning', 'prevents', 'heat-mortality', 3);
  l('early-warning', 'prevents', 'waterborne', 1);
  l('early-warning', 'prevents', 'displacement', 1, 'Warning converts a hazard into an evacuation rather than a permanent loss.');

})(window.ECO);
