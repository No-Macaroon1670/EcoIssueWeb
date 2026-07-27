/* Locale assessment.
 *
 * Deliberately a transparent rules engine rather than a model: every line of
 * output can be traced to one flag on the place and one declared rule on the
 * issue. That makes it honest about being coarse -- the panel says so too.
 */
window.ECO_LOCALE = (function () {
  const R = window.ECO_REGIONS;

  /* How distinctive is a flag? Almost every big place is a `megacity`, so matching
   * on it says little; `freshwater` or `sids` picks out a much smaller set and says
   * a lot. Used to break score ties, so a place's list leads with what is
   * characteristic of it rather than with whatever sorts first alphabetically. */
  const FREQ = (() => {
    const counts = {};
    R.PLACES.forEach(p => {
      p.flags.forEach(f => { counts[f] = (counts[f] || 0) + 1; });
      counts[p.income] = (counts[p.income] || 0) + 1;
    });
    return counts;
  })();
  const TOTAL = R.PLACES.length;
  function specificity(token) {
    return Math.log(TOTAL / (FREQ[token] || 1)) / Math.log(TOTAL);
  }

  function tokenLabel(token) {
    if (R.FLAGS[token]) return R.FLAGS[token].label;
    if (R.INCOME[token]) return R.INCOME[token];
    return token;
  }

  function matches(token, profile) {
    return profile.flags.includes(token) || token === profile.income;
  }

  /** Exposure + contribution for one issue in one place. */
  function forNode(node, profile) {
    const exposure = [];
    for (const [token, level, why] of (node.local.exp || [])) {
      if (matches(token, profile)) exposure.push({ token, label: tokenLabel(token), level, why });
    }
    const drivers = [];
    for (const [income, why] of (node.local.drv || [])) {
      if (income === profile.income) drivers.push({ label: R.INCOME[income], why });
    }
    const level = exposure.some(e => e.level === 'high') ? 'high'
      : exposure.length ? 'elevated' : 'general';
    return {
      level, exposure, drivers,
      score: exposure.reduce((s, e) => s + (e.level === 'high' ? 3 : 1.5), 0),
      specificity: exposure.reduce((s, e) => Math.max(s, specificity(e.token)), 0)
    };
  }

  /** Rank every issue for a place. */
  function assess(nodes, links, profile) {
    const outDegree = new Map(nodes.map(n => [n.id, 0]));
    links.forEach(l => outDegree.set(l.source, (outDegree.get(l.source) || 0) + l.w));

    const rows = nodes.map(node => ({ node, ...forNode(node, profile) }));
    const exposed = rows
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score
        || b.specificity - a.specificity
        || a.node.label.localeCompare(b.node.label));
    const contributing = rows
      .filter(r => r.drivers.length)
      .sort((a, b) => outDegree.get(b.node.id) - outDegree.get(a.node.id));
    return { exposed, contributing };
  }

  /** A search the user chooses to run; nothing is sent anywhere until they click. */
  function orgSearchUrl(node, placeName) {
    const q = `${node.search} organisation OR charity OR nonprofit "${placeName}"`;
    return 'https://www.google.com/search?q=' + encodeURIComponent(q);
  }

  return { assess, forNode, orgSearchUrl, tokenLabel };
})();
