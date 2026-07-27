/* Shared registry + category definitions.
 *
 * Palette: six categorical hues, validated with the dataviz skill's
 * validate_palette.js on the ALL-PAIRS pairlist (a node-link graph can put any
 * category beside any other, so adjacent-pair validation is not enough).
 * Both modes pass every gate:
 *   light (surface #fcfcfb): worst CVD dE 11.8, worst normal-vision dE 21.5, all >= 3:1
 *   dark  (surface #17181a): worst CVD dE 10.5, worst normal-vision dE 15.8, all >= 3:1
 * Changing any hex below invalidates that run -- re-validate before shipping.
 */
window.ECO = {
  nodes: [],
  links: [],
  cats: {
    climate:   { label: 'Climate & atmosphere',      light: '#e26728', dark: '#ad4506' },
    pollution: { label: 'Pollution & toxics',        light: '#921d6d', dark: '#d25ca7' },
    water:     { label: 'Water & oceans',            light: '#12a282', dark: '#087d64' },
    bio:       { label: 'Biodiversity & ecosystems', light: '#2b6000', dark: '#59a42a' },
    land:      { label: 'Land, soil & food',         light: '#9579ee', dark: '#6f51c2' },
    people:    { label: 'People & health',           light: '#0053ad', dark: '#3e8df2' }
  },

  /* Verbs that describe a *suppressing* influence. Edges using these are drawn
   * dashed with an open arrowhead so polarity survives without reading the label. */
  negativeVerbs: ['reduces', 'prevents', 'limits', 'buffers', 'slows', 'absorbs', 'shields'],

  /** Register a node. */
  n(id, label, cat, summary, mitigations, local, search) {
    this.nodes.push({
      id, label, cat, summary,
      mitigations: mitigations || [],
      local: local || {},
      search: search || label
    });
  },

  /** Register a directed link. w = editorial estimate of how tightly the pair is
   *  discussed together (1 loose .. 3 near-inseparable); feeds the clustering. */
  l(source, verb, target, w, note) {
    this.links.push({ source, target, verb, w: w || 1, note: note || '' });
  }
};
