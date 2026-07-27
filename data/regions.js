/* Coarse locale profiles for the "how does this land where I live" panel.
 *
 * This is deliberately a rules-of-thumb archetype model, not a downscaled
 * projection. A country gets a set of physical-geography flags plus a World-Bank-
 * style income group; issues declare which flags and income groups raise exposure
 * or contribution. Big, diverse countries are poorly served by one profile, so a
 * few subnational entries are included and users can build a custom profile.
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
    highlat:        { label: 'High latitude (>50 deg)',    hint: 'Warming two to four times the global rate' },
    glacierfed:     { label: 'Glacier or snowmelt rivers', hint: 'Dry-season water stored as mountain ice' },
    medclimate:     { label: 'Mediterranean climate',      hint: 'Hot dry summers; the classic fire-and-drought pattern' },
    equatorial:     { label: 'Equatorial / humid tropics', hint: 'Persistent heat and humidity, year-round disease season' },
    reef:           { label: 'Coral reefs offshore',       hint: 'Reef fisheries, tourism and wave protection at stake' },
    tropicalforest: { label: 'Tropical forest',            hint: 'Deforestation frontier and biodiversity hotspot' },
    landlocked:     { label: 'Landlocked',                 hint: 'Dependent on upstream neighbours for water' },
    megacity:       { label: 'Very large city',            hint: 'Heat islands, traffic pollution, unequal exposure' },
    mining:         { label: 'Mining region',              hint: 'Extraction, tailings and water contamination' },
    freshwater:     { label: 'Great lakes & big rivers',   hint: 'Inland freshwater: farm runoff, algal blooms, aquatic invasives' },
    freezethaw:     { label: 'Freeze–thaw winters',        hint: 'Winters crossing 0°C repeatedly — roads, pipes and foundations' }
  };

  const INCOME = {
    high:  'High income',
    upper: 'Upper-middle income',
    lower: 'Lower-middle income',
    low:   'Low income'
  };

  const PLACES = [];
  const r = (name, income, flags) => PLACES.push({ name, income, flags });

  /* ── Africa ─────────────────────────────────────────────────────────────── */
  r('Algeria', 'upper', ['coastal', 'arid', 'medclimate']);
  r('Angola', 'lower', ['coastal', 'arid', 'tropicalforest', 'mining']);
  r('Chad', 'low', ['landlocked', 'arid']);
  r('Democratic Republic of the Congo', 'low', ['tropicalforest', 'equatorial', 'mining']);
  r('Egypt', 'lower', ['coastal', 'lowlying', 'arid', 'megacity']);
  r('Ethiopia', 'low', ['landlocked', 'arid']);
  r('Ghana', 'lower', ['coastal', 'equatorial', 'tropicalforest', 'mining']);
  r('Kenya', 'lower', ['coastal', 'arid', 'equatorial', 'reef', 'freshwater']);
  r('Madagascar', 'low', ['coastal', 'cyclone', 'reef', 'tropicalforest']);
  r('Mali', 'low', ['landlocked', 'arid']);
  r('Morocco', 'lower', ['coastal', 'arid', 'medclimate']);
  r('Mozambique', 'low', ['coastal', 'cyclone', 'lowlying', 'reef', 'tropicalforest']);
  r('Niger', 'low', ['landlocked', 'arid']);
  r('Nigeria', 'lower', ['coastal', 'lowlying', 'megacity', 'tropicalforest', 'equatorial', 'mining']);
  r('Senegal', 'lower', ['coastal', 'arid', 'lowlying']);
  r('Somalia', 'low', ['coastal', 'arid']);
  r('South Africa', 'upper', ['coastal', 'arid', 'medclimate', 'mining', 'megacity']);
  r('Sudan', 'low', ['coastal', 'arid']);
  r('Tanzania', 'lower', ['coastal', 'reef', 'equatorial', 'arid', 'freshwater']);
  r('Tunisia', 'lower', ['coastal', 'arid', 'medclimate']);
  r('Uganda', 'low', ['landlocked', 'equatorial', 'tropicalforest', 'freshwater']);
  r('Zambia', 'low', ['landlocked', 'arid', 'mining']);

  /* ── Asia ───────────────────────────────────────────────────────────────── */
  r('Afghanistan', 'low', ['landlocked', 'arid', 'glacierfed']);
  r('Bangladesh', 'lower', ['coastal', 'lowlying', 'monsoon', 'cyclone', 'megacity']);
  r('Cambodia', 'lower', ['coastal', 'monsoon', 'lowlying', 'tropicalforest']);
  r('China', 'upper', ['coastal', 'lowlying', 'monsoon', 'arid', 'glacierfed', 'megacity', 'mining', 'cyclone', 'freshwater']);
  r('Hong Kong', 'high', ['coastal', 'cyclone', 'megacity']);
  r('India', 'lower', ['coastal', 'lowlying', 'monsoon', 'arid', 'glacierfed', 'megacity', 'reef', 'cyclone']);
  r('Indonesia', 'lower', ['coastal', 'equatorial', 'tropicalforest', 'reef', 'megacity', 'lowlying', 'mining']);
  r('Iran', 'lower', ['arid', 'coastal', 'megacity', 'glacierfed']);
  r('Iraq', 'upper', ['arid', 'lowlying', 'coastal']);
  r('Israel', 'high', ['coastal', 'arid', 'medclimate']);
  r('Japan', 'high', ['coastal', 'cyclone', 'megacity']);
  r('Kazakhstan', 'upper', ['landlocked', 'arid', 'mining']);
  r('Malaysia', 'upper', ['coastal', 'equatorial', 'tropicalforest', 'reef', 'lowlying']);
  r('Mongolia', 'lower', ['landlocked', 'arid', 'boreal', 'mining']);
  r('Myanmar', 'lower', ['coastal', 'lowlying', 'monsoon', 'cyclone', 'tropicalforest']);
  r('Nepal', 'lower', ['landlocked', 'glacierfed', 'monsoon']);
  r('Pakistan', 'lower', ['coastal', 'arid', 'monsoon', 'glacierfed', 'megacity', 'cyclone']);
  r('Philippines', 'lower', ['coastal', 'cyclone', 'reef', 'equatorial', 'megacity', 'lowlying', 'tropicalforest']);
  r('Russia', 'upper', ['boreal', 'highlat', 'coastal', 'mining', 'arid', 'freshwater', 'freezethaw']);
  r('Saudi Arabia', 'high', ['arid', 'coastal', 'reef']);
  r('Singapore', 'high', ['coastal', 'equatorial', 'lowlying', 'megacity']);
  r('South Korea', 'high', ['coastal', 'megacity', 'monsoon']);
  r('Sri Lanka', 'lower', ['coastal', 'reef', 'monsoon', 'equatorial']);
  r('Taiwan', 'high', ['coastal', 'cyclone', 'megacity']);
  r('Thailand', 'upper', ['coastal', 'lowlying', 'monsoon', 'reef', 'megacity', 'tropicalforest', 'cyclone']);
  r('Turkey', 'upper', ['coastal', 'medclimate', 'arid', 'megacity']);
  r('United Arab Emirates', 'high', ['arid', 'coastal', 'reef', 'megacity']);
  r('Uzbekistan', 'lower', ['landlocked', 'arid', 'glacierfed']);
  r('Vietnam', 'lower', ['coastal', 'lowlying', 'cyclone', 'monsoon', 'megacity', 'tropicalforest']);

  /* ── Europe ─────────────────────────────────────────────────────────────── */
  r('Austria', 'high', ['landlocked', 'glacierfed']);
  r('Belgium', 'high', ['coastal', 'lowlying']);
  r('Czechia', 'high', ['landlocked', 'mining', 'freshwater', 'freezethaw']);
  r('Denmark', 'high', ['coastal', 'lowlying']);
  r('Finland', 'high', ['coastal', 'boreal', 'highlat']);
  r('France', 'high', ['coastal', 'medclimate', 'megacity', 'glacierfed']);
  r('Germany', 'high', ['coastal', 'lowlying', 'megacity', 'freshwater', 'freezethaw']);
  r('Greece', 'high', ['coastal', 'medclimate', 'arid']);
  r('Hungary', 'high', ['landlocked', 'freshwater', 'freezethaw']);
  r('Iceland', 'high', ['coastal', 'highlat', 'glacierfed']);
  r('Ireland', 'high', ['coastal']);
  r('Italy', 'high', ['coastal', 'medclimate', 'glacierfed', 'megacity']);
  r('Netherlands', 'high', ['coastal', 'lowlying', 'megacity', 'freshwater']);
  r('Norway', 'high', ['coastal', 'boreal', 'highlat', 'glacierfed']);
  r('Poland', 'high', ['coastal', 'lowlying', 'mining', 'freshwater', 'freezethaw']);
  r('Portugal', 'high', ['coastal', 'medclimate']);
  r('Romania', 'high', ['coastal', 'lowlying']);
  r('Spain', 'high', ['coastal', 'medclimate', 'arid']);
  r('Sweden', 'high', ['coastal', 'boreal', 'highlat']);
  r('Switzerland', 'high', ['landlocked', 'glacierfed']);
  r('Ukraine', 'lower', ['coastal', 'lowlying', 'freshwater', 'freezethaw']);
  r('United Kingdom', 'high', ['coastal', 'lowlying', 'megacity']);

  /* ── Americas ───────────────────────────────────────────────────────────── */
  r('Argentina', 'upper', ['coastal', 'arid', 'glacierfed', 'medclimate']);
  r('Bolivia', 'lower', ['landlocked', 'arid', 'glacierfed', 'tropicalforest', 'mining']);
  r('Brazil', 'upper', ['coastal', 'equatorial', 'tropicalforest', 'megacity', 'mining', 'arid']);
  r('Canada', 'high', ['coastal', 'boreal', 'highlat', 'glacierfed', 'mining', 'freshwater', 'freezethaw']);
  r('Chile', 'high', ['coastal', 'arid', 'medclimate', 'glacierfed', 'mining']);
  r('Colombia', 'upper', ['coastal', 'equatorial', 'tropicalforest', 'glacierfed', 'reef', 'megacity', 'mining']);
  r('Costa Rica', 'upper', ['coastal', 'tropicalforest', 'equatorial', 'reef']);
  r('Ecuador', 'upper', ['coastal', 'equatorial', 'tropicalforest', 'glacierfed', 'reef']);
  r('Guatemala', 'lower', ['coastal', 'cyclone', 'tropicalforest', 'reef', 'equatorial']);
  r('Guyana', 'upper', ['coastal', 'lowlying', 'tropicalforest', 'equatorial']);
  r('Honduras', 'lower', ['coastal', 'cyclone', 'tropicalforest', 'reef', 'equatorial']);
  r('Mexico', 'upper', ['coastal', 'arid', 'cyclone', 'reef', 'megacity', 'tropicalforest']);
  r('Nicaragua', 'lower', ['coastal', 'cyclone', 'tropicalforest', 'reef', 'equatorial']);
  r('Panama', 'upper', ['coastal', 'tropicalforest', 'equatorial', 'reef', 'lowlying']);
  r('Paraguay', 'upper', ['landlocked', 'arid']);
  r('Peru', 'upper', ['coastal', 'arid', 'glacierfed', 'tropicalforest', 'mining', 'equatorial']);
  r('United States', 'high', ['coastal', 'lowlying', 'cyclone', 'arid', 'medclimate', 'megacity', 'glacierfed', 'mining', 'boreal', 'reef', 'freshwater', 'freezethaw']);
  r('Uruguay', 'high', ['coastal']);
  r('Venezuela', 'upper', ['coastal', 'tropicalforest', 'equatorial', 'mining']);

  /* ── Caribbean & Pacific small island states ────────────────────────────── */
  r('Bahamas', 'high', ['sids', 'coastal', 'lowlying', 'cyclone', 'reef']);
  r('Barbados', 'high', ['sids', 'coastal', 'cyclone', 'reef']);
  r('Cuba', 'upper', ['sids', 'coastal', 'cyclone', 'reef']);
  r('Dominican Republic', 'upper', ['sids', 'coastal', 'cyclone', 'reef']);
  r('Fiji', 'upper', ['sids', 'coastal', 'cyclone', 'reef', 'equatorial']);
  r('Haiti', 'low', ['sids', 'coastal', 'cyclone', 'tropicalforest']);
  r('Jamaica', 'upper', ['sids', 'coastal', 'cyclone', 'reef']);
  r('Kiribati', 'lower', ['sids', 'coastal', 'lowlying', 'reef', 'equatorial']);
  r('Maldives', 'upper', ['sids', 'coastal', 'lowlying', 'reef', 'equatorial']);
  r('Marshall Islands', 'upper', ['sids', 'coastal', 'lowlying', 'reef']);
  r('Papua New Guinea', 'lower', ['coastal', 'equatorial', 'tropicalforest', 'reef', 'mining']);
  r('Puerto Rico', 'high', ['sids', 'coastal', 'cyclone', 'reef']);
  r('Samoa', 'lower', ['sids', 'coastal', 'cyclone', 'reef', 'equatorial']);
  r('Solomon Islands', 'lower', ['sids', 'coastal', 'lowlying', 'reef', 'equatorial']);
  r('Trinidad and Tobago', 'high', ['sids', 'coastal', 'reef', 'mining']);
  r('Tuvalu', 'lower', ['sids', 'coastal', 'lowlying', 'reef', 'equatorial']);
  r('Vanuatu', 'lower', ['sids', 'coastal', 'cyclone', 'reef', 'equatorial']);

  /* ── Oceania ────────────────────────────────────────────────────────────── */
  r('Australia', 'high', ['coastal', 'arid', 'medclimate', 'reef', 'cyclone', 'mining']);
  r('New Zealand', 'high', ['coastal', 'glacierfed', 'medclimate']);

  /* ── Subnational entries for places a single national profile fits badly ── */
  /* Temperate inland industrial belts — the Great Lakes, the Rhine–Ruhr, the
   * English north. Not coastal, not arid, not boreal, and badly served by a
   * national profile: their signature problems are farm runoff into lakes,
   * aquatic invasives, legacy industrial sediment and freeze–thaw damage. */
  r('Great Lakes, USA', 'high', ['freshwater', 'freezethaw', 'megacity', 'mining']);
  r('Ontario, Canada', 'high', ['freshwater', 'freezethaw', 'megacity']);
  r('Ruhr, Germany', 'high', ['freshwater', 'freezethaw', 'megacity', 'mining']);
  r('Northern England, UK', 'high', ['freshwater', 'freezethaw', 'coastal', 'mining']);

  r('Alaska, USA', 'high', ['coastal', 'boreal', 'highlat', 'glacierfed', 'mining']);
  r('California, USA', 'high', ['coastal', 'medclimate', 'arid', 'megacity', 'glacierfed']);
  r('Florida, USA', 'high', ['coastal', 'lowlying', 'cyclone', 'reef', 'megacity']);
  r('New York, USA', 'high', ['coastal', 'lowlying', 'megacity']);
  r('Texas, USA', 'high', ['coastal', 'arid', 'cyclone', 'megacity', 'mining']);
  r('England, UK', 'high', ['coastal', 'lowlying', 'megacity']);
  r('Scotland, UK', 'high', ['coastal', 'highlat']);
  r('Queensland, Australia', 'high', ['coastal', 'reef', 'cyclone', 'arid', 'mining']);
  r('British Columbia, Canada', 'high', ['coastal', 'boreal', 'glacierfed', 'medclimate', 'mining']);

  PLACES.sort((a, b) => a.name.localeCompare(b.name));
  return { FLAGS, INCOME, PLACES };
})();
