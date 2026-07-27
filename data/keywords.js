/* Extra search terms per node: the chemicals, synonyms, place names and plain-
 * language phrasings people actually type. Searching "carbon dioxide", "CO2" or
 * "N2O" should all land on greenhouse gas emissions. */
(function (E) {
  const k = E.k.bind(E);

  /* Climate & atmosphere */
  k('fossil-fuels', ['coal', 'oil', 'petroleum', 'natural gas', 'lng', 'diesel', 'petrol', 'gasoline', 'drilling', 'fracking', 'refinery', 'combustion']);
  k('ghg-emissions', ['carbon dioxide', 'co2', 'methane', 'ch4', 'nitrous oxide', 'n2o', 'greenhouse gases', 'carbon', 'carbon footprint', 'emissions', 'fluorinated gases', 'hfcs', 'carbon pollution', 'net zero']);
  k('methane', ['ch4', 'natural gas', 'fugitive emissions', 'flaring', 'venting', 'biogas', 'landfill gas']);
  k('cooling-demand', ['air conditioning', 'air con', 'ac', 'refrigerant', 'hfc', 'freon', 'montreal protocol', 'kigali', 'fridge']);
  k('greenhouse-effect', ['radiative forcing', 'heat trapping', 'infrared', 'blanket', 'tyndall', 'arrhenius']);
  k('warming', ['global warming', 'climate change', 'global heating', '1.5 degrees', 'temperature anomaly', 'paris agreement']);
  k('heatwaves', ['heat wave', 'wet bulb', 'extreme temperature', 'heat dome', 'record heat']);
  k('drought', ['dry spell', 'megadrought', 'rainfall failure', 'flash drought', 'aridity']);
  k('wildfire', ['bushfire', 'forest fire', 'fire season', 'wildfire smoke', 'prescribed burn', 'megafire']);
  k('rainfall-shift', ['flood', 'flooding', 'extreme rain', 'precipitation', 'atmospheric river', 'monsoon', 'cloudburst', 'stormwater']);
  k('cyclones', ['hurricane', 'typhoon', 'tropical storm', 'storm surge', 'saffir simpson', 'rapid intensification']);
  k('sea-level', ['sea level', 'inundation', 'coastal flooding', 'king tide', 'subsidence']);
  k('ice-loss', ['glacier', 'glaciers', 'ice sheet', 'greenland', 'antarctica', 'sea ice', 'melting', 'ice melt', 'calving']);
  k('albedo', ['reflectivity', 'arctic amplification', 'ice albedo', 'snow cover', 'feedback loop']);
  k('permafrost', ['tundra', 'frozen ground', 'arctic carbon', 'thermokarst', 'siberia', 'methane bomb']);
  k('carbon-sinks', ['carbon sink', 'sequestration', 'carbon uptake', 'land sink', 'ocean sink']);
  k('amoc', ['amoc', 'gulf stream', 'thermohaline', 'ocean current', 'overturning', 'tipping point']);
  k('data-centres', ['data center', 'data centre', 'ai', 'artificial intelligence', 'compute', 'server farm', 'cloud', 'gpu', 'training run', 'bitcoin', 'crypto', 'cryptocurrency', 'mining rig', 'hyperscale']);
  k('geoengineering', ['solar radiation management', 'srm', 'stratospheric aerosol injection', 'sai', 'albedo modification', 'cloud brightening', 'termination shock', 'solar geoengineering']);
  k('carbon-offsets', ['offset', 'offsets', 'carbon credit', 'rec', 'greenwashing', 'net zero claim', 'redd', 'voluntary carbon market', 'additionality', 'carbon neutral']);

  /* Pollution & toxics */
  k('overconsumption', ['fast fashion', 'consumerism', 'shopping', 'textiles', 'clothing', 'shein', 'black friday', 'material footprint', 'planned obsolescence']);
  k('plastic', ['single use', 'packaging', 'bottles', 'bags', 'polymer', 'polyethylene', 'pet', 'styrofoam', 'plastic treaty']);
  k('microplastics', ['microfibres', 'microfibers', 'nurdles', 'tyre wear', 'tire wear', 'microbeads', 'nanoplastics']);
  k('pfas', ['forever chemicals', 'pfoa', 'pfos', 'teflon', 'non-stick', 'nonstick', 'firefighting foam', 'afff', 'fluorinated', 'gore-tex', 'scotchgard']);
  k('heavy-metals', ['lead', 'mercury', 'cadmium', 'arsenic', 'chromium', 'flint', 'lead pipes', 'methylmercury']);
  k('air-pollution', ['pm2.5', 'pm25', 'particulate', 'particulates', 'smog', 'soot', 'black carbon', 'nox', 'so2', 'air quality', 'aqi', 'haze']);
  k('ozone-smog', ['ozone', 'o3', 'tropospheric ozone', 'smog', 'nox', 'voc', 'photochemical']);
  k('nutrient-runoff', ['fertiliser', 'fertilizer', 'nitrogen', 'phosphorus', 'algal bloom', 'algae', 'eutrophication', 'manure', 'slurry', 'haber bosch']);
  k('pesticides', ['neonicotinoids', 'neonics', 'glyphosate', 'roundup', 'herbicide', 'insecticide', 'ddt', 'atrazine', 'spraying']);
  k('ewaste', ['electronic waste', 'e-waste', 'phones', 'laptops', 'batteries', 'weee', 'agbogbloshie', 'right to repair']);
  k('oil-spills', ['tanker', 'pipeline leak', 'bilge', 'crude', 'deepwater horizon', 'exxon valdez', 'dispersant']);
  k('pharma-residues', ['antibiotics', 'amr', 'antimicrobial resistance', 'superbugs', 'hormones', 'endocrine disruptors', 'diclofenac', 'contraceptive']);
  k('landfill-waste', ['garbage', 'trash', 'rubbish', 'dump', 'tip', 'incineration', 'open burning', 'leachate', 'waste']);
  k('light-pollution', ['sky glow', 'skyglow', 'dark sky', 'led', 'streetlight', 'stargazing', 'artificial light at night']);
  k('noise-pollution', ['noise', 'sonar', 'shipping noise', 'traffic noise', 'aircraft noise', 'decibels']);
  k('nuclear-waste', ['nuclear', 'radioactive', 'spent fuel', 'reactor', 'chernobyl', 'fukushima', 'yucca', 'uranium', 'deep geological repository']);
  k('cleantech-waste', ['solar panel waste', 'turbine blade', 'wind blade', 'battery waste', 'ev battery', 'photovoltaic recycling', 'end of life']);

  /* Water & oceans */
  k('water-scarcity', ['water stress', 'water shortage', 'day zero', 'water security', 'thirst']);
  k('groundwater', ['aquifer', 'well', 'borehole', 'water table', 'subsidence', 'ogallala', 'tube well', 'over-abstraction']);
  k('unsafe-water', ['sanitation', 'wash', 'sewage', 'drinking water', 'toilets', 'open defecation', 'water treatment']);
  k('salinization', ['saltwater intrusion', 'salinity', 'brackish', 'salt', 'saline soil']);
  k('glacier-water', ['snowmelt', 'meltwater', 'himalaya', 'andes', 'water tower', 'third pole', 'snowpack']);
  k('dams', ['hydropower', 'hydroelectric', 'reservoir', 'weir', 'barrage', 'three gorges', 'fish ladder', 'dam removal']);
  k('ocean-warming', ['marine heatwave', 'sea surface temperature', 'the blob', 'ocean heat content', 'coral heat stress']);
  k('acidification', ['ph', 'carbonic acid', 'calcification', 'shells', 'aragonite', 'oyster', 'pteropod']);
  k('dead-zones', ['hypoxia', 'anoxia', 'oxygen minimum', 'gulf of mexico', 'baltic', 'fish kill']);
  k('deep-sea-mining', ['seabed mining', 'polymetallic nodules', 'clarion clipperton', 'isa', 'manganese nodules', 'abyssal', 'hydrothermal vents']);

  /* Biodiversity & ecosystems */
  k('habitat-loss', ['fragmentation', 'land conversion', 'development', 'wildlife corridor', 'edge effect']);
  k('deforestation', ['logging', 'forest clearing', 'amazon', 'rainforest', 'palm oil', 'soy', 'timber', 'slash and burn', 'congo basin', 'eudr']);
  k('wetland-loss', ['mangrove', 'marsh', 'peatland', 'bog', 'swamp', 'drainage', 'saltmarsh', 'ramsar', 'blue carbon']);
  k('extinction', ['species loss', 'endangered', 'biodiversity loss', 'red list', 'sixth extinction', 'defaunation', 'iucn']);
  k('pollinators', ['bees', 'honeybee', 'bumblebee', 'butterflies', 'pollination', 'colony collapse', 'hoverfly']);
  k('insect-decline', ['insects', 'bugs', 'invertebrates', 'windscreen phenomenon', 'entomofauna', 'moths']);
  k('soil-life', ['soil microbes', 'mycorrhizal', 'fungi', 'earthworms', 'soil health', 'soil carbon', 'rhizosphere']);
  k('overfishing', ['trawling', 'bottom trawling', 'bycatch', 'fish stocks', 'iuu', 'illegal fishing', 'quota', 'cod collapse']);
  k('coral-bleaching', ['reef', 'corals', 'great barrier reef', 'zooxanthellae', 'bleaching event']);
  k('kelp-seagrass', ['kelp', 'seagrass', 'urchin barrens', 'seaweed', 'posidonia', 'kelp forest']);
  k('invasives', ['invasive species', 'alien species', 'ballast water', 'non-native', 'lionfish', 'zebra mussel', 'knotweed', 'biosecurity']);
  k('wildlife-trade', ['poaching', 'ivory', 'trafficking', 'bushmeat', 'cites', 'rhino horn', 'pangolin', 'exotic pets']);

  /* Land, soil & food */
  k('industrial-ag', ['farming', 'agriculture', 'agribusiness', 'intensive farming', 'cafo', 'farm subsidies', 'green revolution']);
  k('livestock', ['cattle', 'beef', 'meat', 'dairy', 'cows', 'ranching', 'grazing', 'feedlot', 'enteric fermentation']);
  k('monoculture', ['crop diversity', 'seed', 'cultivar', 'cavendish banana', 'panama disease', 'genetic uniformity', 'seed bank']);
  k('soil-erosion', ['topsoil', 'gully', 'tillage', 'dust bowl', 'sediment', 'runoff']);
  k('land-degradation', ['degraded land', 'soil loss', 'land restoration', 'compaction']);
  k('desertification', ['drylands', 'sahel', 'great green wall', 'arid', 'sand', 'dust storm', 'unccd']);
  k('food-insecurity', ['hunger', 'famine', 'malnutrition', 'food prices', 'starvation', 'food access']);
  k('food-waste', ['leftovers', 'spoilage', 'expiry', 'best before', 'use by', 'cold chain', 'gleaning']);
  k('urban-sprawl', ['cities', 'zoning', 'suburbs', 'car dependence', 'parking minimums', 'greenfield', 'density', 'impervious surface']);
  k('mining', ['lithium', 'cobalt', 'copper', 'nickel', 'rare earths', 'critical minerals', 'tailings', 'extraction', 'quarry', 'sand mining']);

  /* People & health */
  k('respiratory', ['asthma', 'copd', 'lung cancer', 'heart attack', 'stroke', 'cardiovascular', 'bronchitis']);
  k('indoor-air', ['cookstove', 'charcoal', 'firewood', 'household air', 'clean cooking', 'lpg', 'kerosene']);
  k('heat-mortality', ['heat stroke', 'heat death', 'hyperthermia', 'excess deaths', 'heat exhaustion']);
  k('vector-disease', ['malaria', 'dengue', 'ticks', 'lyme', 'mosquito', 'zika', 'chikungunya', 'aedes', 'west nile']);
  k('waterborne', ['cholera', 'diarrhoea', 'diarrhea', 'typhoid', 'dysentery', 'rotavirus', 'giardia']);
  k('displacement', ['climate refugees', 'migration', 'relocation', 'managed retreat', 'internally displaced', 'idp']);
  k('env-injustice', ['environmental racism', 'equity', 'frontline communities', 'cumulative impact', 'cancer alley', 'redlining', 'nimby']);
  k('energy-poverty', ['electricity access', 'fuel poverty', 'blackouts', 'off-grid', 'sdg7', 'load shedding']);
  k('resource-conflict', ['water wars', 'transboundary', 'land disputes', 'nile', 'grand ethiopian renaissance dam', 'herder farmer']);
  k('climate-anxiety', ['eco anxiety', 'doomism', 'solastalgia', 'mental health', 'burnout', 'grief']);

  /* Solutions */
  k('renewables', ['solar', 'wind', 'photovoltaic', 'pv', 'offshore wind', 'clean energy', 'green energy']);
  k('electrification', ['ev', 'electric vehicle', 'heat pump', 'induction', 'electric car', 'battery']);
  k('grid-storage', ['battery storage', 'grid', 'transmission', 'pumped hydro', 'demand response', 'interconnector', 'curtailment']);
  k('nuclear-power', ['nuclear', 'reactor', 'smr', 'fission', 'baseload', 'atomic']);
  k('efficiency-buildings', ['insulation', 'retrofit', 'passive house', 'building code', 'double glazing', 'weatherisation', 'draught proofing']);
  k('transit-density', ['public transport', 'transit', 'cycling', 'walkability', 'upzoning', 'fifteen minute city', 'rail']);
  k('methane-repair', ['leak detection', 'ldar', 'satellite monitoring', 'methanesat', 'flaring ban']);
  k('circular-economy', ['recycling', 'reuse', 'repair', 'refill', 'deposit return', 'zero waste', 'reduce reuse recycle', 'second hand']);
  k('new-materials', ['bioplastics', 'mycelium', 'green steel', 'low carbon cement', 'mass timber', 'clt', 'substitution', 'alternative materials']);
  k('product-standards', ['right to repair', 'ecodesign', 'extended producer responsibility', 'epr', 'durability', 'spare parts']);
  k('organics-diversion', ['composting', 'anaerobic digestion', 'food scraps', 'green bin', 'biogas']);
  k('regen-ag', ['regenerative agriculture', 'cover crops', 'no till', 'crop rotation', 'conservation agriculture', 'soil carbon']);
  k('agroforestry', ['hedgerows', 'silvopasture', 'shade trees', 'windbreaks', 'fmnr', 'alley cropping']);
  k('diet-shift', ['plant based', 'vegan', 'vegetarian', 'meat reduction', 'flexitarian', 'alternative protein', 'legumes']);
  k('protected-areas', ['national park', 'rewilding', 'thirty by thirty', '30x30', 'indigenous land', 'conservation', 'reserve']);
  k('coastal-restoration', ['mangrove restoration', 'saltmarsh', 'peat rewetting', 'living shoreline', 'blue carbon', 'oyster reef']);
  k('fisheries-mgmt', ['marine protected area', 'mpa', 'quota', 'no take zone', 'subsidy reform', 'catch limits']);
  k('water-efficiency', ['drip irrigation', 'water pricing', 'leak repair', 'greywater', 'rainwater harvesting', 'metering']);
  k('wastewater-upgrade', ['sewage treatment', 'tertiary treatment', 'sewer separation', 'constructed wetland', 'nutrient removal']);
  k('clean-cooking', ['lpg', 'improved cookstove', 'induction', 'electric cooking', 'biogas stove']);
  k('carbon-pricing', ['carbon tax', 'emissions trading', 'ets', 'cap and trade', 'subsidy reform', 'border adjustment', 'cbam']);
  k('urban-greening', ['street trees', 'urban canopy', 'green roof', 'cool roof', 'shade', 'depaving', 'rain garden']);
  k('early-warning', ['heat action plan', 'cooling centre', 'flood warning', 'evacuation', 'preparedness', 'early warnings for all']);

})(window.ECO);
