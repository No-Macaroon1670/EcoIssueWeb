/* Newer contested topics. These sit in existing categories rather than getting a
 * new colour: the palette is validated at six hues and a seventh cannot clear the
 * colourblind gates without going neon. Placement notes are in each summary. */
(function (E) {
  const n = E.n.bind(E);

  n('data-centres', 'Data centres & AI compute', 'climate',
    'Data centres consumed on the order of 1.5% of global electricity in 2024, and demand is climbing fast as AI training and inference scale. The honest picture is mixed: for two decades the sector absorbed enormous growth in workload with only modest growth in energy, because efficiency improved in step. Those gains have not stopped — chips, cooling and model architectures all keep improving — but current projections suggest they are no longer fast enough to offset demand growth, and the new load is landing on specific local grids all at once. Water use varies more than the coverage suggests: evaporative cooling consumes a great deal, while air-cooled, closed-loop and reclaimed-water sites consume little directly, and a substantial share of the real total is upstream in power generation rather than at the building.',
    ['Judge providers on hourly-matched clean power, not annual renewable certificates that let a coal-fired hour count as green',
     'Support siting rules that require new large loads to bring their own generation rather than consume existing headroom',
     'Push for mandatory reporting of energy and water use per site — most of this debate is conducted without data',
     'At an individual level this is not a meaningful personal footprint item; the leverage is procurement and planning policy'],
    { exp: [['arid', 'high', 'Evaporative cooling competes directly with scarce water.'],
            ['megacity', 'elevated', 'New load concentrates on grids that are already constrained.']],
      drv: [['high', 'Hosts most hyperscale capacity and most of the demand for it.'],
            ['upper', 'The fastest growth in new build.']] },
    'data centre energy water use policy'),

  n('geoengineering', 'Solar geoengineering', 'climate',
    'Proposals to cool the planet by reflecting sunlight, most prominently by injecting aerosols into the stratosphere. It would act fast, and its direct deployment cost looks small next to the damages it is meant to avoid — which is exactly what makes it dangerous, because that arithmetic ignores monitoring, governance, compensation and the commitment to keep going for a century. It treats temperature while leaving CO2 and therefore ocean acidification untouched, its effects on regional rainfall would be unequal and are genuinely uncertain in sign and location, and stopping abruptly after decades of deployment would produce very rapid warming. No comprehensive binding regime governs deployment by a country that decided to act alone.',
    ['Support governance and research transparency now rather than after someone attempts deployment',
     'Resist framing that treats this as an alternative to emissions cuts — it addresses a symptom, not the cause',
     'Be equally sceptical of blanket research bans, which concede the field to unaccountable actors'],
    { exp: [['monsoon', 'high', 'Monsoon-dependent regions are among the most sensitive to any change in regional rainfall.'],
            ['equatorial', 'elevated', 'Tropical regions bear the most modelled downside with the least say in deployment.']] },
    'solar geoengineering governance research'),

  /* Carbon offsetting lives in solutions.js, not here. It is an instrument someone
   * chooses to deploy, and it was already shaped like a lever — a suppressing edge to
   * the thing it targets plus a cost edge — while being typed as an issue. */

  n('nuclear-waste', 'Spent fuel & radioactive waste', 'pollution',
    'The custody half of nuclear power; the generating case for it sits on the lever of the same name. The physical volumes are small — a country\'s entire high-level inventory fits in a warehouse — but spent fuel stays radiologically hazardous over timescales from thousands to hundreds of thousands of years, even as its heat output and activity fall steeply in the first centuries. Lower-level wastes decay to background far sooner, and lumping the classes together is most of what makes the public argument unmanageable. After seventy years of commercial generation no repository has yet begun final disposal: Finland\'s Onkalo completed trial operations and is expected to be the first, in 2026. Almost everywhere else, spent fuel is still in pools and dry casks at the reactors that made it.',
    ['Distinguish waste classes before judging a proposal — high-level spent fuel and low-level contaminated equipment are not the same problem',
     'Support long-term repository siting with genuine community consent rather than indefinite on-site storage',
     'Judge new-build proposals on cost and delivery schedule, which are where most projects actually fail'],
    { exp: [['mining', 'elevated', 'Uranium mining and milling leave long-lived contamination.'],
            ['coastal', 'elevated', 'Many reactors are coastal for cooling, which ties them to sea level and surge.']],
      drv: [['high', 'Holds most of the existing fleet and most of the accumulated waste.']] },
    'nuclear waste repository policy'),

  n('battery-waste', 'Battery waste & recycling', 'pollution',
    'The transition runs on batteries, and the first large EV and grid-storage fleets are now reaching end of life. Industrial processes can recover most of the valuable material, but that is not the same as recycling being solved: collection, safe transport, chemistry-specific processing, output purity and the economics of doing it at all are the live constraints, and capacity is well behind the volumes arriving. Loose cells in ordinary waste streams are already a serious fire hazard for collection trucks and sorting halls. Clean recovered lithium, cobalt and nickel substitute directly for primary material, which makes this a supply question as much as a waste one — though with demand growing this fast, recycling slows mining rather than replacing it. Solar panels and turbine blades are the smaller, slower streams behind it.',
    ['Never put loose cells or battery-containing devices in kerbside bins — they start fires',
     'Support extended producer responsibility so end-of-life cost sits with the manufacturer',
     'Back second-life storage where it stacks up: a pack below automotive spec often has years of stationary use left, though testing, repackaging and fire control decide whether reuse or straight recycling is the better call',
     'When you meet "but renewables make waste" as an argument, check the comparison — it is usually against nothing rather than against coal'],
    { exp: [['mining', 'elevated', 'Recovery capacity tends to get built where extraction and refining already are.']],
      drv: [['high', 'First to deploy at scale and first to face the retirement wave.'],
            ['upper', 'Dominant in cell manufacturing and in recycling capacity.']] },
    'battery recycling second life storage'),

  n('deep-sea-mining', 'Deep-sea mining', 'water',
    'Proposals to harvest metal-rich nodules from the abyssal plain, pitched as a lower-impact source of the manganese, nickel, copper and cobalt the energy transition is projected to need. That projection is the softest part of the case: lithium iron phosphate cells use no nickel or cobalt and have taken a large share of the market, sodium-ion may cut lithium demand in stationary storage, and recycling supply grows as the first fleets retire. Whether seabed metal would displace land mining or simply add to total supply is unresolved. The ecology is firmer ground: the seabed involved is among the least-studied habitats on Earth, the nodules are themselves the hard surface much of the life there depends on, and they take millions of years to form. Tracks from an experimental clearance in the 1970s remained visible with measurably altered biology four decades on. Several states and a number of major manufacturers have backed a moratorium pending evidence.',
    ['Support the precautionary moratorium until baseline ecology is actually characterised',
     'Push battery chemistries and recycling that reduce the demand this is meant to serve',
     'Watch the International Seabed Authority\'s rulemaking; this is being decided in a venue almost nobody follows'],
    /* No coastal exposure entry. Plumes, noise and discharge do travel beyond the
     * collector track, but the licence areas are abyssal and thousands of kilometres
     * offshore, and the exposure vocabulary only has "high" and "elevated" — neither
     * honestly describes an effect nobody has quantified. */
    { exp: [['sids', 'elevated', 'Several Pacific states are sponsoring or contesting licences in their waters.']],
      drv: [['high', 'The demand for the metals sits in high-income manufacturing.'],
            ['upper', 'Refining and processing capacity.']] },
    'deep sea mining moratorium seabed');

})(window.ECO);
