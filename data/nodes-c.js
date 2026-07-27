/* Newer contested topics. These sit in existing categories rather than getting a
 * new colour: the palette is validated at six hues and a seventh cannot clear the
 * colourblind gates without going neon. Placement notes are in each summary. */
(function (E) {
  const n = E.n.bind(E);

  n('data-centres', 'Data centres & AI compute', 'climate',
    'Data centres consumed on the order of 1.5% of global electricity in 2024, and demand is climbing fast as AI training and inference scale. The honest picture is mixed: the sector has absorbed enormous growth in workload with modest growth in energy because efficiency improved in step, but that slack is largely spent, and the new load is landing on specific local grids all at once. Large sites also draw significant water for cooling, often in places that are already short of it.',
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
    'Proposals to cool the planet by reflecting sunlight, most prominently by injecting aerosols into the stratosphere. It is plausibly cheap and fast-acting, which is exactly what makes it dangerous: it treats temperature while leaving ocean acidification untouched, its effects on regional rainfall would be unequal and contested, and stopping abruptly after decades of deployment would produce very rapid warming. There is no governance regime for a technology one country could deploy unilaterally.',
    ['Support governance and research transparency now rather than after someone attempts deployment',
     'Resist framing that treats this as an alternative to emissions cuts — it addresses a symptom, not the cause',
     'Be equally sceptical of blanket research bans, which concede the field to unaccountable actors'],
    { exp: [['monsoon', 'high', 'Modelled rainfall disruption is largest over monsoon regions.'],
            ['equatorial', 'elevated', 'Tropical regions bear the most modelled downside with the least say in deployment.']] },
    'solar geoengineering governance research'),

  n('carbon-offsets', 'Offset & net-zero claims', 'climate',
    'Carbon credits let a buyer pay for a reduction elsewhere instead of cutting their own emissions. The mechanism is sound in principle and has been badly executed in practice: repeated investigations have found forest credits claiming avoided deforestation that was never going to happen, and permanence is undermined every time a credited forest burns. The deeper problem is that offsets substitute for cuts, which is why "net zero" claims deserve to be read closely.',
    ['Treat "carbon neutral" labels as a prompt to ask what was actually reduced, not as a verified fact',
     'Prefer removals with durable storage over avoidance credits, and prefer direct cuts over both',
     'Support disclosure rules that separate a company\'s own reductions from its purchased credits',
     'Back regulation of offset quality; voluntary standards have repeatedly failed this market'],
    { drv: [['high', 'The main buyers of credits and the main source of net-zero claims.']] },
    'carbon offset integrity greenwashing'),

  n('nuclear-waste', 'Nuclear power & waste', 'pollution',
    'Nuclear generation is among the lowest-carbon electricity sources and has a very low death rate per unit of energy, including accidents. It also produces waste that stays hazardous for tens of thousands of years, and after seventy years only Finland has an operating deep geological repository. Public argument tends to collapse into either "too dangerous" or "obviously the answer" when the real questions are cost, construction time and long-term custody.',
    ['Judge proposals on cost and delivery schedule, which are where most projects actually fail',
     'Support long-term repository siting with genuine community consent rather than indefinite on-site storage',
     'Keep existing safe reactors running where the alternative is fossil generation — early closures have reliably raised emissions'],
    { exp: [['mining', 'elevated', 'Uranium mining and milling leave long-lived contamination.'],
            ['coastal', 'elevated', 'Many reactors are coastal for cooling, which ties them to sea level and surge.']],
      drv: [['high', 'Holds most of the existing fleet and most of the accumulated waste.']] },
    'nuclear waste repository policy'),

  n('cleantech-waste', 'Clean-tech end-of-life waste', 'pollution',
    'Solar panels, wind turbine blades and EV batteries all reach end of life eventually, and the volumes are about to rise sharply as the first large deployments age out. Blades are hard to recycle because the composites are designed not to come apart, and battery recycling is technically solved but not yet built at scale. This is a real problem and a favourite bad-faith argument: the waste per unit of energy is far smaller than the fossil alternative it replaced.',
    ['Support extended producer responsibility so end-of-life cost sits with the manufacturer from the start',
     'Back battery recycling and second-life storage capacity now, ahead of the volume arriving',
     'Push for design-for-disassembly requirements in procurement',
     'When you meet this as an argument against renewables, check the comparison being made — it is usually against nothing rather than against coal'],
    { drv: [['high', 'First to deploy at scale and first to face the retirement wave.'],
            ['upper', 'Dominant in manufacturing and increasingly in installed base.']] },
    'solar panel wind blade battery recycling'),

  n('deep-sea-mining', 'Deep-sea mining', 'water',
    'Proposals to harvest metal-rich nodules from the abyssal plain, pitched as a lower-impact source of the nickel and cobalt the energy transition needs. The seabed involved is among the least-studied habitats on Earth, the nodules themselves are the habitat for much of the life there, and recovery from disturbance appears to take decades to centuries. Several states and a number of major manufacturers have backed a moratorium pending evidence.',
    ['Support the precautionary moratorium until baseline ecology is actually characterised',
     'Push battery chemistries and recycling that reduce the demand this is meant to serve',
     'Watch the International Seabed Authority\'s rulemaking; this is being decided in a venue almost nobody follows'],
    { exp: [['sids', 'elevated', 'Several Pacific states are sponsoring or contesting licences in their waters.'],
            ['coastal', 'elevated', 'Sediment plumes and fisheries effects would not stay in the licence area.']],
      drv: [['high', 'The demand for the metals sits in high-income manufacturing.'],
            ['upper', 'Refining and processing capacity.']] },
    'deep sea mining moratorium seabed');

})(window.ECO);
