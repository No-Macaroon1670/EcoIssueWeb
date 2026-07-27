/* The solutions layer: levers rather than problems.
 *
 * Rendered as hollow rings so they read as a different *class* of thing, coloured
 * by the domain they act in — composite encoding, so no seventh hue is needed.
 * Their outgoing links are mostly suppressing (dashed), but several also carry an
 * ordinary driving link, because most real levers cost something somewhere.
 */
(function (E) {
  const s = E.s.bind(E);

  /* ── Energy & emissions ─────────────────────────────────────────────────── */

  s('renewables', 'Renewable electricity', 'climate',
    'Solar and wind are now the cheapest new generation across most of the world, which is why deployment keeps outrunning forecasts. The remaining problem is not cost but shape: output varies, so the value of each additional unit falls unless storage, transmission and flexible demand grow alongside it.',
    ['The bottleneck is usually grid connection queues and permitting, not panels',
     'Pair any deployment target with a transmission plan or the last third gets curtailed',
     'It genuinely does increase mining demand — that is a reason to build recycling capacity, not a reason to burn coal'],
    'renewable energy solar wind'),

  s('grid-storage', 'Storage & grid flexibility', 'climate',
    'Batteries, pumped hydro, interconnectors and demand response, which together turn variable generation into firm supply. This is the piece that decides how far renewables can actually go, and it is currently the least glamorous and most under-built part of the transition.',
    ['Cheap flexibility often beats expensive storage — shifting when demand happens is the first move',
     'Support transmission build-out; it is the single largest physical constraint in most grids',
     'Watch for storage being counted twice, as both capacity and emissions reduction'],
    'grid storage batteries transmission'),

  s('electrification', 'Electrifying heat & transport', 'climate',
    'Heat pumps and electric vehicles replace combustion with electricity, and both are far more efficient than what they replace — a heat pump moves several units of heat per unit of electricity. The catch is the one that gets skipped: electrifying onto a coal-heavy grid relocates the emissions rather than removing them.',
    ['Sequence matters: insulate first, then size the heat pump, or you pay for capacity you did not need',
     'It only fully pays off as the grid decarbonises, which is why it depends on renewables',
     'Battery demand is real; smaller vehicles and better recycling both shrink it'],
    'heat pump electric vehicle electrification'),

  s('nuclear-power', 'Nuclear generation', 'climate',
    'Very low-carbon, very reliable, and very hard to build on time and on budget. Where existing plants close early the gap has reliably been filled by fossil generation, which makes keeping safe reactors running a different question from building new ones.',
    ['Cost and schedule are where projects fail, not safety statistics',
     'Long-term waste custody remains genuinely unresolved almost everywhere',
     'Judge new build against what would actually get built instead, on the same timeline'],
    'nuclear power generation'),

  s('efficiency-buildings', 'Building efficiency & retrofit', 'climate',
    'Insulation, airtightness, glazing and better standards for new construction. The cheapest unit of energy is the one never needed, and retrofit does double duty: it cuts bills and emissions, and it makes homes survivable in both cold snaps and heatwaves.',
    ['Retrofit is slow and disruptive; the constraint is skilled installers, not technology',
     'Build standards for new construction are almost free by comparison — the cost is political, not financial',
     'Target the worst housing first: that is where the health and fuel-poverty gains concentrate'],
    'building retrofit insulation efficiency'),

  s('methane-repair', 'Methane leak detection & repair', 'climate',
    'Finding and fixing leaks across oil and gas infrastructure, often at negative net cost because the escaping gas is saleable. Satellite monitoring has made large leaks visible and attributable, which removes the old excuse that nobody could tell.',
    ['Among the cheapest available emissions reductions, and the fastest to act on temperature',
     'It requires enforcement — voluntary programmes have consistently under-detected',
     'It does nothing about the emissions from burning the gas, which remain the larger share'],
    'methane leak detection repair'),

  s('carbon-pricing', 'Carbon pricing & subsidy reform', 'climate',
    'Putting a price on emissions and removing the subsidies that currently discount them. Economically the cleanest instrument available, and politically the most fragile — carbon prices that hit household bills without visible compensation have repeatedly been reversed.',
    ['Redistribute the revenue visibly, or the policy gets repealed and sets the field back years',
     'Fossil subsidy removal is the same lever pulled from the other end, and is often easier',
     'Border adjustments matter, or production simply relocates'],
    'carbon pricing tax subsidy reform'),

  /* ── Materials & waste ──────────────────────────────────────────────────── */

  s('circular-economy', 'Reuse, repair & recycling', 'pollution',
    'Keeping material in use instead of extracting it again. The order matters and is usually inverted in public messaging: refusing and reusing beat repairing, which beats recycling, which is the weakest of the options and the one most heavily promoted by the industries that benefit from it.',
    ['Recovered metal displaces mined metal roughly one for one — this is where the biggest wins are',
     'Recycling rates are a poor metric; material actually kept in service is the real one',
     'It needs product design to cooperate, which is why standards come first'],
    'circular economy reuse repair recycling'),

  s('product-standards', 'Durability & repair standards', 'pollution',
    'Right-to-repair rules, minimum lifespans, spare-part availability and extended producer responsibility, which puts end-of-life cost back on the manufacturer. This is the policy layer that makes the circular economy physically possible rather than merely aspirational.',
    ['Producer responsibility works best when the fee scales with how hard the product is to recycle',
     'Spare parts and repair manuals matter more than recyclability labels',
     'It is fought hard, and it works — this is one of the clearer policy wins available'],
    'right to repair producer responsibility standards'),

  s('new-materials', 'Substitute & low-carbon materials', 'pollution',
    'Green steel, low-clinker cement, mass timber and bio-based replacements for problem plastics. Cement and steel alone are a large share of industrial emissions, and neither can be electrified away — they need different chemistry, not just cleaner power.',
    ['Beware substitutions that move the problem — some bioplastics need industrial composting that does not exist locally',
     'Procurement rules are the fastest lever: public construction can create the market on its own',
     'Mass timber only counts as storage if the forest is actually managed for regrowth'],
    'green steel low carbon cement materials'),

  s('organics-diversion', 'Composting & organics diversion', 'pollution',
    'Keeping food and garden waste out of landfill, where it decomposes without oxygen and generates methane. Composting or digesting it instead produces far less methane and returns carbon and structure to soil.',
    ['This is the highest-return household waste behaviour by a wide margin',
     'Kerbside organics collection outperforms any amount of individual encouragement',
     'Anaerobic digestion captures the methane as usable gas rather than losing it'],
    'composting organics collection food scraps'),

  /* ── Land & food ────────────────────────────────────────────────────────── */

  s('regen-ag', 'Regenerative & conservation farming', 'land',
    'Cover crops, reduced tillage, rotations and integrating livestock — practices that keep soil covered and living roots in the ground. Soil-carbon claims are frequently overstated and hard to verify, but the erosion, water-holding and input-reduction benefits are well established and worth it on their own.',
    ['Treat soil-carbon offset claims sceptically; treat the erosion and water benefits as real',
     'Yields can dip during transition, which is exactly why transition support decides adoption',
     'Cover cropping is the single highest-leverage practice if only one changes'],
    'regenerative agriculture cover crops no till'),

  s('agroforestry', 'Agroforestry & hedgerows', 'land',
    'Trees and shrubs integrated into farmland — shelterbelts, hedgerows, silvopasture, shade trees over coffee and cocoa. It is one of the few interventions that improves yields, biodiversity, soil and carbon storage simultaneously, which is why it survives where imported tree-planting schemes fail.',
    ['Farmer-managed natural regeneration is cheaper and survives far better than planting seedlings',
     'The benefits take years to arrive, so tenure security largely determines uptake',
     'Hedgerows are the version that works at temperate field scale'],
    'agroforestry hedgerows silvopasture'),

  s('diet-shift', 'Shifting diets from ruminants', 'land',
    'Reducing beef and dairy specifically, which are far more land- and emissions-intensive than any other food. The gap between meats is much larger than the gap between diets that do or do not include chicken, so the useful advice is narrower than "eat less meat".',
    ['Institutional catering shifts far more volume than individual pledges',
     'Substitute rather than subtract — defaults and menu design outperform persuasion',
     'Cutting beef and dairy captures most of the benefit without requiring anyone to go vegan'],
    'plant based diet meat reduction'),

  s('transit-density', 'Transit & compact cities', 'land',
    'Building homes near frequent transit and letting people live without a car. It is simultaneously a climate policy, a habitat policy, an air quality policy and a housing policy, which is unusual, and it is decided almost entirely at the level of local zoning hearings.',
    ['Removing parking minimums is often the highest-leverage single change',
     'Frequency is what makes transit used; coverage without frequency does not',
     'The environmental case and the housing affordability case point the same way here'],
    'public transit density upzoning walkability'),

  /* ── Nature & water ─────────────────────────────────────────────────────── */

  s('protected-areas', 'Protection & restoration', 'bio',
    'Protecting intact ecosystems and restoring degraded ones, including the 30-by-30 target. The evidence is consistent that protection works when it is funded and enforced, and that Indigenous-managed land performs as well as or better than formal reserves.',
    ['Protecting intact habitat beats restoring cleared habitat by a wide margin — restoration is slower and rarely complete',
     '"Paper parks" with no funding or enforcement do very little; the budget line is the policy',
     'Support Indigenous land tenure, which is empirically among the most effective forest protection there is'],
    'protected areas rewilding conservation 30x30'),

  s('coastal-restoration', 'Coastal & wetland restoration', 'bio',
    'Replanting mangroves, restoring saltmarsh and seagrass, and rewetting drained peat. Among the highest-return interventions available: it stores carbon densely, measurably reduces storm surge damage, filters nutrients and rebuilds fish nurseries at the same time.',
    ['Rewetting peat is one of the cheapest large-scale emissions reductions anywhere',
     'Mangrove replanting fails when it ignores hydrology — restore the water flow first',
     'The storm-protection value alone usually justifies the cost before carbon is counted'],
    'mangrove restoration peatland rewetting saltmarsh'),

  s('fisheries-mgmt', 'Fisheries management & MPAs', 'bio',
    'Catch limits, gear restrictions, no-take zones and ending the subsidies that keep unprofitable fleets at sea. Fisheries are the clearest case anywhere on this map where restraint measurably increases long-run yield, and where recovery is fast when rules are actually enforced.',
    ['Well-enforced no-take zones repopulate the water around them — this is well documented',
     'Subsidy reform is the lever with the largest effect and the least public attention',
     'Enforcement capacity, not regulation on paper, is what separates recovery from collapse'],
    'fisheries management marine protected area'),

  s('water-efficiency', 'Irrigation efficiency & pricing', 'water',
    'Drip irrigation, leak repair, metering and water priced closer to what it is worth. Agriculture takes roughly 70% of withdrawals, so household campaigns alone cannot close a serious gap.',
    ['Efficiency can backfire: cheaper water per hectare often expands irrigated area unless allocation is capped too',
     'Metering is the precondition for everything else — unmeasured aquifers are almost always over-drawn',
     'Fix distribution leaks first; that water is lost before anyone chooses to use it'],
    'irrigation efficiency water pricing metering'),

  s('wastewater-upgrade', 'Wastewater treatment upgrades', 'water',
    'Sewer separation, secondary and tertiary treatment, and processes that actually remove micropollutants. The engineering has been understood for over a century; the gap is capital and governance, which is why this is a spending decision more than a technical one.',
    ['Sewer separation stops the raw discharges that heavy rain currently causes',
     'Constructed wetlands are a cheap polishing step where land is available',
     'Micropollutant removal needs a deliberate treatment stage — conventional plants do not do it'],
    'wastewater treatment sewage upgrade'),

  /* ── People ─────────────────────────────────────────────────────────────── */

  s('clean-cooking', 'Clean cooking access', 'people',
    'Replacing wood, charcoal and dung with LPG, electricity or genuinely improved stoves. Among the highest health returns per dollar in development spending, and it reduces both the soot that warms the Arctic and the fuelwood demand that clears forest.',
    ['Stove programmes fail when fuel cost or supply is unreliable — the fuel matters more than the stove',
     'The health benefit lands mainly on women and young children',
     'Electric cooking is now viable in far more places than the standard assumption allows'],
    'clean cooking stoves LPG access'),

  s('urban-greening', 'Urban trees & shade', 'people',
    'Street trees, parks, green and cool roofs, and removing pavement. Shade cuts perceived temperature dramatically, and canopy cover maps onto income so precisely that planting priority is itself an equity decision.',
    ['Plant the hottest, least-shaded, least-wealthy neighbourhoods first',
     'Trees need a watering budget for the first years or the planting is theatre',
     'Shade at street level beats canopy statistics — where the shade falls is what matters'],
    'urban trees canopy cool roofs shade'),

  s('early-warning', 'Early warning & heat plans', 'people',
    'Forecast-based alerts, heat action plans, cooling centres and evacuation systems. Cheap relative to almost anything else here, and the intervention that most reliably converts a hazard into a non-event.',
    ['Warnings only work if paired with somewhere to go and someone checking on isolated people',
     'Heat action plans have measurably cut deaths in the cities that have adopted them',
     'The last mile — reaching people without phones or language access — is where these usually fail'],
    'early warning heat action plan preparedness');

})(window.ECO);
