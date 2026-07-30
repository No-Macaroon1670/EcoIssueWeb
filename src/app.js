/* Wiring: state, controls, and the animation loop. */
(function () {
  const E = window.ECO;
  const R = window.ECO_REGIONS;
  const byId = new Map(E.nodes.map(n => [n.id, n]));

  /* ── validate the data before anything renders ───────────────────────────── */
  const badLinks = E.links.filter(l => !byId.has(l.source) || !byId.has(l.target));
  if (badLinks.length) {
    console.error('links referencing unknown nodes:', badLinks);
    E.links = E.links.filter(l => byId.has(l.source) && byId.has(l.target));
  }

  /* ── derived indices ─────────────────────────────────────────────────────── */
  const outgoing = new Map(E.nodes.map(n => [n.id, []]));
  const incoming = new Map(E.nodes.map(n => [n.id, []]));
  E.links.forEach(l => {
    outgoing.get(l.source).push({ link: l, other: byId.get(l.target) });
    incoming.get(l.target).push({ link: l, other: byId.get(l.source) });
  });

  E.nodes.forEach(n => {
    const weight = [...outgoing.get(n.id), ...incoming.get(n.id)].reduce((s, r) => s + r.link.w, 0);
    n.weight = weight;
    n.r = 9.5 + 2.55 * Math.sqrt(weight);
  });

  /* On-canvas labels for the nodes whose full name is too long to sit under a
   * circle without crowding its neighbours. The panel always shows the full name. */
  const SHORT = {
    'fossil-fuels': 'Fossil fuels', 'ghg-emissions': 'GHG emissions',
    'methane': 'Methane leaks', 'cooling-demand': 'Cooling demand',
    'greenhouse-effect': 'Greenhouse effect', 'warming': 'Temperature rise',
    'rainfall-shift': 'Rainfall shifts', 'cyclones': 'Tropical cyclones',
    'ice-loss': 'Glacier & ice loss', 'albedo': 'Ice–albedo', 'carbon-sinks': 'Carbon sinks',
    'amoc': 'Ocean circulation', 'overconsumption': 'Overconsumption',
    'pfas': 'PFAS', 'heavy-metals': 'Heavy metals', 'air-pollution': 'Air pollution',
    'battery-waste': 'Battery waste',
    'pesticides': 'Pesticides', 'ewaste': 'E-waste', 'oil-spills': 'Oil spills',
    'pharma-residues': 'Pharma residues', 'landfill-waste': 'Landfill & waste',
    'water-scarcity': 'Water scarcity', 'unsafe-water': 'Unsafe water',
    'salinization': 'Salinization', 'glacier-water': 'Glacier-fed water',
    'dams': 'Dams & barriers', 'ocean-warming': 'Ocean warming',
    'acidification': 'Acidification', 'dead-zones': 'Dead zones',
    'thermal-pollution': 'Thermal pollution',
    'habitat-loss': 'Habitat loss', 'wetland-loss': 'Wetland loss',
    'kelp-seagrass': 'Kelp & seagrass', 'wildlife-trade': 'Wildlife trade',
    'soil-life': 'Soil biodiversity', 'industrial-ag': 'Industrial farming',
    'monoculture': 'Monoculture', 'food-waste': 'Food waste',
    'mining': 'Mining', 'respiratory': 'Heart & lung disease',
    'indoor-air': 'Indoor air', 'heat-mortality': 'Heat deaths',
    'vector-disease': 'Vector-borne disease', 'waterborne': 'Water-borne illness',
    'displacement': 'Displacement', 'env-injustice': 'Environmental injustice',
    'resource-conflict': 'Resource conflict', 'climate-anxiety': 'Climate anxiety'
  };

  /* Wrap once, up front: the layout needs label extents to keep them from
   * colliding, and the renderer needs the same lines to draw. */
  const LABEL_WIDTH = 96, LINE_HEIGHT = 13;
  /* Past this many visible nodes the whole graph no longer fits at a readable
   * size, so it becomes a pannable map opened at a fixed working zoom. */
  const DENSE_ABOVE = 85, DENSE_VIEW = 0.75, OPEN_VIEW = 0.8;
  (function measureLabels() {
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = '600 11.5px system-ui, -apple-system, "Segoe UI", sans-serif';
    E.nodes.forEach(n => {
      n.short = SHORT[n.id] || n.label;
      const lines = [];
      let line = '';
      for (const word of n.short.split(' ')) {
        const trial = line ? line + ' ' + word : word;
        if (probe.measureText(trial).width > LABEL_WIDTH && line) { lines.push(line); line = word; }
        else line = trial;
      }
      if (line) lines.push(line);
      n.lines = lines.slice(0, 3);
      n.lw = Math.max(...n.lines.map(l => probe.measureText(l).width));
      n.lh = n.lines.length * LINE_HEIGHT + 5;
    });
  })();

  /* ── weight sources ──────────────────────────────────────────────────────── */

  /* Editorial weights are my judgement. The clickstream weights are derived from
   * three months of English Wikipedia reader navigation (see tools/clickstream.py).
   * They disagree, and the disagreement is the interesting part, so both ship. */
  const CS = window.ECO_CLICKSTREAM || null;
  const csByPair = new Map();
  if (CS) CS.links.forEach(r => csByPair.set(r.s + '\t' + r.t, r));

  function csRow(link) { return csByPair.get(link.source + '\t' + link.target) || null; }

  /* A link with no Wikipedia article on one end has no reader evidence, so it falls
   * back to my judgement — but the two scales are not commensurate. Editorial weights
   * run 1..3 while measured reader weights sit near 0.17, so handing an unmapped link
   * its raw editorial 2 made it stronger than 90% of everything actually measured.
   * Clean-tech waste, whose links are ALL unmapped, ended up titling the largest
   * reader cluster purely for lack of data. The fallback is therefore quantile-mapped:
   * the editorial weight keeps its rank, expressed on the reader scale. */
  const fallbackScale = (() => {
    let editorialSorted = null, measuredSorted = null;
    return w => {
      if (!editorialSorted) {
        editorialSorted = E.links.map(l => l.w).sort((a, b) => a - b);
        measuredSorted = CS
          ? CS.links.filter(r => r.status === 'measured').map(r => r.w).sort((a, b) => a - b)
          : [];
      }
      if (!measuredSorted.length) return w;
      const rank = editorialSorted.indexOf(w) / Math.max(1, editorialSorted.length - 1);
      return measuredSorted[Math.round(rank * (measuredSorted.length - 1))];
    };
  })();

  function weightOf(link, source) {
    if ((source || state.weights) === 'editorial') return link.w;
    const row = csRow(link);
    if (row && row.w != null) return row.w;
    return fallbackScale(link.w);
  }

  /* Raw weights are not comparable across sources: editorial runs 1..3 while reader
   * weights cluster near 0.15. An absolute threshold that means "most links" for one
   * means "almost none" for the other, so everything downstream — filtering, edge
   * width, edge alpha — works off each link's RANK within the active source instead. */
  const strengthCache = {};
  function strengthTable(source) {
    if (!strengthCache[source]) {
      const sorted = E.links.map(l => weightOf(l, source)).sort((a, b) => a - b);
      const table = new Map();
      E.links.forEach(l => {
        const w = weightOf(l, source);
        // fraction of links this one is at least as strong as
        let lo = 0, hi = sorted.length;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < w) lo = mid + 1; else hi = mid; }
        table.set(l, sorted.length > 1 ? lo / (sorted.length - 1) : 1);
      });
      strengthCache[source] = table;
    }
    return strengthCache[source];
  }
  function strengthOf(link) { return strengthTable(state.weights).get(link) || 0; }

  /* Clustering runs over issues only, so the communities do not shift when the
   * solutions layer is toggled. Each lever then inherits the cluster of whatever
   * it acts on most heavily. */
  const issues = E.nodes.filter(n => n.kind !== 'solution');
  const solutions = E.nodes.filter(n => n.kind === 'solution');
  const issueIds = new Set(issues.map(n => n.id));
  const issueLinks = E.links.filter(l => issueIds.has(l.source) && issueIds.has(l.target));

  function clusterFor(source) {
    const weighted = issueLinks.map(l => ({
      source: l.source, target: l.target, w: weightOf(l, source)
    }));
    return window.ECO_CLUSTER.run(issues.map(n => n.id), weighted, 1);
  }

  /* ── feedback loops & causal hierarchy ───────────────────────────────────── */

  /* Run on issues only. Levers are interventions, not links in the causal chain:
   * including them would make every one of them an in-degree-zero "root cause",
   * which is exactly the wrong reading. */
  const graphAnalysis = window.ECO_LOOPS.analyse(issues, issueLinks, { maxLen: 6 });
  const loopSets = {
    nodes: new Set(graphAnalysis.loopNodes.keys()),
    links: graphAnalysis.loopLinks
  };
  /* graphAnalysis also carries a root/mechanism/symptom layering. It is deliberately
   * not surfaced: the definitions need more work before the map asserts them. The
   * loop findings below are independent of it and do stand up. */

  /** Loops passing through a node, shortest first. */
  function loopsThrough(id) {
    return graphAnalysis.loops.filter(c => c.nodes.includes(id));
  }

  const clusterCache = {};
  let clusters = null;
  const clusterMembers = new Map();
  const clusterLabel = new Map();

  function applyClusters(source) {
    if (!clusterCache[source]) {
      const run = clusterFor(source);
      // levers inherit the cluster of whatever they act on most heavily
      solutions.forEach(sol => {
        const tally = new Map();
        outgoing.get(sol.id).forEach(({ link, other }) => {
          const c = run.of[other.id];
          if (c != null) tally.set(c, (tally.get(c) || 0) + weightOf(link, source));
        });
        const best = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
        run.of[sol.id] = best ? best[0] : 0;
      });
      clusterCache[source] = run;
    }
    clusters = clusterCache[source];

    clusterMembers.clear();
    E.nodes.forEach(n => {
      const c = clusters.of[n.id];
      if (!clusterMembers.has(c)) clusterMembers.set(c, []);
      clusterMembers.get(c).push(n);
    });
    /* Name each cluster after its most *internally* connected member, not its
     * highest-degree one. Global degree names a cluster after whichever hub happened
     * to land in it — food insecurity has 31 links and would title any cluster it
     * joined — whereas internal degree picks the node whose connections actually sit
     * inside the group, which is what makes it characteristic. Short labels keep the
     * legend to one line where possible. */
    clusterLabel.clear();
    clusterMembers.forEach((members, c) => {
      const inside = new Set(members.map(m => m.id));
      const internal = new Map(members.map(m => [m.id, 0]));
      E.links.forEach(l => {
        if (!inside.has(l.source) || !inside.has(l.target)) return;
        const w = weightOf(l, source);
        internal.set(l.source, internal.get(l.source) + w);
        internal.set(l.target, internal.get(l.target) + w);
      });
      const rep = members.slice().sort((a, b) =>
        (internal.get(b.id) - internal.get(a.id)) || (b.weight - a.weight))[0];
      clusterLabel.set(c, rep.short || rep.label);
    });
  }

  /* How much do the two weight sources actually disagree about the communities?
   * Adjusted Rand index over the issue nodes: 1 = identical partitions, 0 = no
   * better than chance agreement. */
  function adjustedRand(aOf, bOf, ids) {
    const table = new Map(), aCount = new Map(), bCount = new Map();
    ids.forEach(id => {
      const key = aOf[id] + ',' + bOf[id];
      table.set(key, (table.get(key) || 0) + 1);
      aCount.set(aOf[id], (aCount.get(aOf[id]) || 0) + 1);
      bCount.set(bOf[id], (bCount.get(bOf[id]) || 0) + 1);
    });
    const c2 = n => (n * (n - 1)) / 2;
    const sum = m => [...m.values()].reduce((s, n) => s + c2(n), 0);
    const index = sum(table), sa = sum(aCount), sb = sum(bCount);
    const total = c2(ids.length);
    const expected = (sa * sb) / total;
    const max = (sa + sb) / 2;
    return max === expected ? 0 : (index - expected) / (max - expected);
  }

  /* ── state ───────────────────────────────────────────────────────────────── */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('eco.' + key); return v === null ? fallback : JSON.parse(v); }
      catch (err) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('eco.' + key, JSON.stringify(value)); } catch (err) { /* private mode */ }
    }
  };

  const state = {
    theme: store.get('theme', 'auto'),
    colourBy: store.get('colourBy', 'cat'),
    group: store.get('group', true),
    verbs: store.get('verbs', false),
    hiddenGroups: new Set(),
    linkKeep: store.get('linkKeep', 1),      // fraction of links kept, strongest first
    minDegree: store.get('minDegree', 0),
    localFocus: false,
    solutions: store.get('solutions', false),
    weights: CS ? store.get('weights', 'editorial') : 'editorial',
    loops: store.get('loops', false),
    tracedLoop: null,
    place: store.get('place', ''),
    custom: store.get('custom', { income: 'high', flags: [] }),
    tableOpen: false
  };

  /* ── theme & colour ──────────────────────────────────────────────────────── */
  const CAT_KEYS = Object.keys(E.cats);

  function activeMode() {
    if (state.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.theme;
  }

  function applyTheme() {
    const root = document.documentElement;
    if (state.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', state.theme);

    const mode = activeMode();
    CAT_KEYS.forEach(key => root.style.setProperty('--cat-' + key, E.cats[key][mode]));
    document.getElementById('btn-theme').textContent =
      'Theme: ' + (state.theme === 'auto' ? 'auto' : state.theme);
    if (graph) graph.refreshTheme();
  }

  function catColour(key) { return E.cats[key][activeMode()]; }

  /* Clusters reuse the same six validated hues as generic slots; anything past
   * the sixth folds into a muted "other" rather than inventing a seventh hue. */
  function clusterColour(index) {
    if (index < CAT_KEYS.length) return catColour(CAT_KEYS[index]);
    return getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#898781';
  }

  function mutedColour() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--text-muted').trim() || '#898781';
  }

  function colourOf(node) {
    return state.colourBy === 'cat'
      ? catColour(node.cat)
      : clusterColour(clusters.of[node.id]);
  }

  /* Colour key drives the legend and hiding; group key drives layout anchoring.
   * They differ for levers, which take their domain's hue but cluster together on
   * screen so the solutions layer reads as a layer. */
  function colourKeyOf(node) {
    if (state.colourBy === 'cat') return node.cat;
    return clusters ? clusters.of[node.id] : node.cat;   // clusters land after boot
  }

  function groupKeyOf(node) {
    return node.kind === 'solution' ? '__levers__' : colourKeyOf(node);
  }

  /* Every cluster gets a name, including the ones past the sixth. Only the COLOUR
   * runs out at six — the palette is validated at six hues and a seventh cannot
   * clear the colourblind gates — so those fold to grey. Labelling them "Other (7)"
   * as well threw away the one thing that made them legible, and the number read
   * like an index when it was actually a member count already shown alongside. */
  function groupTitle(key) {
    if (key === '__levers__') return 'Responses & levers';
    if (state.colourBy === 'cat') return E.cats[key].label;
    const index = Number(key);
    return `C${index + 1} · ${clusterLabel.get(index)}`;
  }

  /* Base visibility: the category legend and the solutions layer. Degree pruning
   * builds on top of this rather than replacing it. */
  function baseVisible(node) {
    if (node.kind === 'solution' && !state.solutions) return false;
    return !state.hiddenGroups.has(String(colourKeyOf(node)));
  }

  /* One pass, in a fixed order, so the result is explainable:
   *   1. drop links below the strength cutoff
   *   2. count each node's surviving links
   *   3. drop nodes under the degree floor
   *   4. drop links that just lost an endpoint
   * Deliberately not iterated to a fixpoint — cascading removals would let one
   * slider notch cause an avalanche, which is impossible to reason about. */
  let visibleNodes = new Set(), visibleLinks = new Set();

  function recomputeVisibility() {
    const eligible = E.links.filter(l =>
      baseVisible(byId.get(l.source)) && baseVisible(byId.get(l.target)));

    /* Take the strongest N outright rather than thresholding on a percentile.
     * Editorial weights have only three distinct values, so a percentile cutoff
     * jumps in huge steps and the slider lies about what it is showing — 60% and
     * 30% both landed on the same 70 links. Top-N always matches the label. */
    const key = l => l.source + '\t' + l.target;
    const ranked = eligible.slice().sort((x, y) =>
      weightOf(y) - weightOf(x) || key(x).localeCompare(key(y)));
    const passing = ranked.slice(0, Math.max(1, Math.round(state.linkKeep * ranked.length)));

    const degree = new Map();
    passing.forEach(l => {
      degree.set(l.source, (degree.get(l.source) || 0) + 1);
      degree.set(l.target, (degree.get(l.target) || 0) + 1);
    });

    visibleNodes = new Set(E.nodes
      .filter(n => baseVisible(n) && (degree.get(n.id) || 0) >= state.minDegree)
      .map(n => n.id));
    visibleLinks = new Set(passing
      .filter(l => visibleNodes.has(l.source) && visibleNodes.has(l.target))
      .map(l => l.source + '\t' + l.target));

    const linksNote = document.getElementById('links-note');
    if (linksNote) {
      linksNote.textContent = `${visibleLinks.size} of ${eligible.length} links shown` +
        (state.weights === 'readers' ? ', ranked by reader navigation' : '');
    }
    const degreeNote = document.getElementById('degree-note');
    if (degreeNote) {
      const hidden = E.nodes.filter(baseVisible).length - visibleNodes.size;
      degreeNote.textContent = state.minDegree === 0
        ? 'Showing every node.'
        : `${visibleNodes.size} keystone nodes; ${hidden} pruned for having fewer than ${state.minDegree}.`;
    }
  }

  function nodeVisible(node) { return visibleNodes.has(node.id); }
  function linkVisible(link) { return visibleLinks.has(link.source + '\t' + link.target); }

  /* ── graph & layout ──────────────────────────────────────────────────────── */
  const canvas = document.getElementById('graph');
  const detail = document.getElementById('detail');
  let graph = null;

  const layout = window.ECO_LAYOUT.create(E.nodes, E.links);

  graph = window.ECO_GRAPH.create(canvas, {
    nodes: E.nodes,
    links: E.links,
    colourOf,
    onSelect: node => { renderDetail(node); syncSearchSelection(node); },
    onHover: () => {},
    onDrag: () => layout.reheat(0.35)
  });
  recomputeVisibility();
  graph.setVisibility(nodeVisible);
  graph.setLinkFilter(linkVisible);
  graph.setStrengthOf(strengthOf);
  layout.setActive(nodeVisible);

  function applyGrouping() {
    if (!state.group) { layout.setGroups(null); return; }
    const groups = new Map();
    E.nodes.filter(nodeVisible).forEach(n => {
      const key = groupKeyOf(n);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n);
    });
    layout.setGroups(groups);
    layout.reheat(0.9);
  }

  /* Which labels survive the thinned overview.
   *
   * Allocated per group rather than globally: ranking all nodes by degree and
   * taking the top 40% leaves the levers almost entirely unnamed, because a lever
   * has far fewer links than a hub issue like global temperature rise. Every group
   * keeps its own best-connected share, so no region of the map goes anonymous. */
  function refreshLabelPriority() {
    E.nodes.forEach(n => { n.labelPriority = false; });
    const shown = E.nodes.filter(nodeVisible);
    const dense = shown.length > DENSE_ABOVE;

    const groups = new Map();
    shown.forEach(n => {
      const key = String(groupKeyOf(n));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n);
    });
    groups.forEach(members => {
      members.sort((a, b) => b.weight - a.weight);
      const keep = dense ? Math.max(3, Math.round(members.length * 0.42)) : members.length;
      members.slice(0, keep).forEach(n => { n.labelPriority = true; });
    });
  }

  function updateGroupLabels() {
    if (!state.group) { graph.setGroupLabels([]); return; }
    const acc = new Map();
    E.nodes.forEach(n => {
      if (!nodeVisible(n)) return;
      const key = groupKeyOf(n);
      const g = acc.get(key) || { x: 0, y: 0, n: 0, minY: Infinity };
      g.x += n.x; g.y += n.y; g.n++;
      g.minY = Math.min(g.minY, n.y - n.r);
      acc.set(key, g);
    });
    const labels = [];
    acc.forEach((g, key) => {
      labels.push({ text: groupTitle(key), x: g.x / g.n, y: g.minY - 26 });
    });
    graph.setGroupLabels(labels);
  }

  /* ── detail panel ────────────────────────────────────────────────────────── */
  function profile() {
    if (state.place === '__custom__') {
      return { name: 'my area', income: state.custom.income, flags: state.custom.flags };
    }
    return R.PLACES.find(p => p.name === state.place) || null;
  }

  function panelContext() {
    return {
      colourOf,
      colourOfCat: catColour,
      clusterName: node => groupTitleForCluster(clusters.of[node.id]),
      outgoing: id => outgoing.get(id),
      incoming: id => incoming.get(id),
      weightOf: link => weightOf(link),
      inLoop: node => node.kind !== 'solution' && loopSets.nodes.has(node.id),
      /* Loops are indexed against the global list so the panel can hand an index
       * straight back for tracing. */
      loopsThrough: node => (node.kind === 'solution' ? [] :
        loopsThrough(node.id).map(loop => ({
          index: graphAnalysis.loops.indexOf(loop),
          polarity: loop.polarity,
          steps: loop.links.map((l, i) => ({
            from: byId.get(loop.nodes[i]).short || byId.get(loop.nodes[i]).label,
            verb: l.verb
          }))
        }))),
      /* When the reader source is active, say what it is actually based on — a
       * weight derived from 40 clicks should not look like one derived from 600. */
      evidence: link => {
        if (state.weights !== 'readers' || !CS) return null;
        const row = csRow(link);
        if (!row) return null;
        if (row.status === 'unmapped') return 'no article · my weight kept';
        if (row.status === 'no-signal') return 'no reader navigation';
        return row.direct
          ? `${row.direct.toLocaleString()} clicks`
          : 'shared context only';
      },
      profile: profile(),
      issueCount: issues.length,
      solutionCount: solutions.length,
      linkCount: E.links.length
    };
  }

  function groupTitleForCluster(index) {
    return `Cluster ${index + 1} · ${clusterLabel.get(index)}`;
  }

  function renderDetail(node) {
    state.tableOpen = false;
    clearTrace();
    document.getElementById('btn-table').classList.remove('active');
    detail.innerHTML = node
      ? window.ECO_PANEL.renderNode(node, panelContext())
      : window.ECO_PANEL.renderEmpty(panelContext());
    detail.scrollTop = 0;
  }

  function openTable() {
    state.tableOpen = true;
    document.getElementById('btn-table').classList.add('active');
    detail.innerHTML = window.ECO_PANEL.renderTable(panelContext());
    detail.scrollTop = 0;
  }

  detail.addEventListener('click', ev => {
    const clamped = ev.target.closest('.rel-note.clamp');
    if (clamped) { clamped.classList.toggle('open'); return; }

    const loopRow = ev.target.closest('[data-loop]');
    if (loopRow) {
      const index = Number(loopRow.dataset.loop);
      if (state.tracedLoop === index) clearTrace(); else traceLoop(index);
      return;
    }
    const target = ev.target.closest('[data-goto]');
    if (!target) return;
    const node = byId.get(target.dataset.goto);
    if (!node) return;
    focusNode(node);
  });

  function focusNode(node) {
    if (!nodeVisible(node)) {
      if (node.kind === 'solution' && !state.solutions) {
        document.getElementById('opt-solutions').checked = true;
        document.getElementById('opt-solutions').dispatchEvent(new Event('change'));
      }
      state.hiddenGroups.delete(String(colourKeyOf(node)));
      buildLegend();
      recomputeVisibility();
    }
    if (!visibleNodes.has(node.id)) {   // pruned by a slider — relax it rather than
      state.minDegree = 0;              // silently select something invisible
      sliderDegree.value = '0';
      state.linkKeep = 1;
      sliderLinks.value = '100';
      afterFilterChange();
    }
    graph.select(node);
    graph.centreOn(node);
  }

  /* ── legend ──────────────────────────────────────────────────────────────── */
  const legendEl = document.getElementById('legend');

  function legendEntries() {
    const counts = id => E.nodes.filter(n =>
      (state.solutions || n.kind !== 'solution') && String(colourKeyOf(n)) === String(id)).length;
    if (state.colourBy === 'cat') {
      return CAT_KEYS.map(key => ({
        key, label: E.cats[key].label, colour: catColour(key), count: counts(key)
      }));
    }
    return [...clusterMembers.keys()].sort((a, b) => a - b).map(index => ({
      key: String(index),
      label: groupTitle(index),
      colour: clusterColour(index),
      count: counts(index)
    }));
  }

  function buildLegend() {
    document.getElementById('legend-title').textContent =
      state.colourBy === 'cat' ? 'Categories' : 'Detected clusters';
    legendEl.innerHTML = legendEntries().map(entry => {
      const on = !state.hiddenGroups.has(entry.key);
      return `<li><label class="${on ? '' : 'off'}">
        <input type="checkbox" data-group="${entry.key}" ${on ? 'checked' : ''}>
        <span class="swatch" style="background:${entry.colour}"></span>
        <span>${entry.label}</span>
        <span class="count">${entry.count}</span>
      </label></li>`;
    }).join('');
  }

  legendEl.addEventListener('change', ev => {
    const key = ev.target.dataset.group;
    if (key === undefined) return;
    if (ev.target.checked) state.hiddenGroups.delete(key);
    else state.hiddenGroups.add(key);
    buildLegend();
    afterFilterChange();
    layout.reheat(0.4);
  });

  /* ── search ──────────────────────────────────────────────────────────────── */
  const searchInput = document.getElementById('search');
  const searchResults = document.getElementById('search-results');
  let searchMatches = [];

  /* Rank by how direct the match is, and remember *why* a node matched so the
   * result row can show it — searching "carbon dioxide" should visibly explain
   * why it returned greenhouse gas emissions. */
  function scoreNode(node, q) {
    const label = node.label.toLowerCase();
    const terms = E.keywords[node.id] || [];
    if (label === q) return { rank: 0 };
    if (label.startsWith(q)) return { rank: 1 };
    // an exact keyword hit beats a mid-word label match: "co2" means this node
    if (terms.includes(q)) return { rank: 2, hint: q };
    if (label.includes(q)) return { rank: 3 };
    if ((node.short || '').toLowerCase().includes(q)) return { rank: 4 };
    // ids carry names the label does not: "electrification", "amoc", "pfas"
    if (node.id.replace(/-/g, ' ').includes(q)) return { rank: 4 };

    let best = null;
    for (const term of terms) {
      if (term.startsWith(q)) { best = { rank: 5, hint: term }; break; }
      if (term.includes(q) && !best) best = { rank: 6, hint: term };
    }
    if (best) return best;

    if (E.cats[node.cat].label.toLowerCase().includes(q)) return { rank: 7 };
    if (node.summary.toLowerCase().includes(q)) return { rank: 8, hint: 'in summary' };
    return null;
  }

  function runSearch() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) { searchResults.hidden = true; searchMatches = []; return; }

    // deliberately not filtered to visible nodes: picking a hidden one reveals it,
    // so a lever stays findable while the solutions layer is off
    searchMatches = E.nodes
      .map(node => ({ node, ...(scoreNode(node, q) || {}) }))
      .filter(row => row.rank !== undefined)
      .sort((a, b) => a.rank - b.rank || b.node.weight - a.node.weight)
      .slice(0, 9);

    if (!searchMatches.length) {
      searchResults.innerHTML = '<li><span class="empty-note" style="padding:6px 7px">No match</span></li>';
      searchResults.hidden = false;
      return;
    }
    searchResults.innerHTML = searchMatches.map((row, i) => `
      <li><button data-pick="${row.node.id}" class="${i === 0 ? 'active' : ''}">
        <span class="swatch ${row.node.kind === 'solution' ? 'ring' : ''}"
              style="${row.node.kind === 'solution' ? 'border-color' : 'background'}:${colourOf(row.node)}"></span>
        <span>${row.node.label}</span>
        ${row.hint ? `<span class="hit">${row.hint}</span>` : ''}
      </button></li>`).join('');
    searchResults.hidden = false;
  }

  searchInput.addEventListener('input', runSearch);
  searchInput.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && searchMatches.length) {
      ev.preventDefault();
      pick(searchMatches[0].node);
    } else if (ev.key === 'Escape') {
      searchInput.value = '';
      searchResults.hidden = true;
    }
  });
  searchResults.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-pick]');
    if (btn) pick(byId.get(btn.dataset.pick));
  });
  document.addEventListener('click', ev => {
    if (!ev.target.closest('.search-wrap')) searchResults.hidden = true;
  });

  function pick(node) {
    searchResults.hidden = true;
    searchInput.value = node.label;
    focusNode(node);
  }

  function syncSearchSelection(node) {
    if (!node) searchInput.value = '';
  }

  /* ── place / locale ──────────────────────────────────────────────────────── */
  const placeSelect = document.getElementById('place');
  const customBox = document.getElementById('custom-profile');
  const localTop = document.getElementById('local-top');

  R.PLACES.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name;
    placeSelect.appendChild(opt);
  });
  placeSelect.value = state.place;

  const incomeSelect = document.getElementById('custom-income');
  Object.entries(R.INCOME).forEach(([key, label]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label;
    incomeSelect.appendChild(opt);
  });
  incomeSelect.value = state.custom.income;

  document.getElementById('custom-flags').innerHTML = Object.entries(R.FLAGS).map(([key, f]) =>
    `<label title="${f.hint}"><input type="checkbox" data-flag="${key}"
       ${state.custom.flags.includes(key) ? 'checked' : ''}><span>${f.label}</span></label>`).join('');

  /* Local focus: the place's top-ranked issues, plus what most drives them.
   *
   * Following *every* upstream edge two hops pulls in 78 of 102 nodes — with a
   * 27-node strongly-connected core, "ancestors of" quickly means "everything", and
   * highlighting everything is the same as highlighting nothing. So it walks only
   * the two strongest drivers of each issue, which lands at roughly a quarter of the
   * map across places as different as Maldives, the Great Lakes and Mongolia. */
  const FOCUS_SEEDS = 8, FOCUS_HOPS = 2, FOCUS_DRIVERS = 2;
  const localFocusWrap = document.getElementById('local-focus-wrap');
  const optLocalFocus = document.getElementById('opt-local-focus');

  function localFocusSet() {
    const p = profile();
    if (!p) return null;
    const { exposed } = window.ECO_LOCALE.assess(E.nodes, E.links, p);
    const seed = exposed.slice(0, FOCUS_SEEDS).map(r => r.node.id)
      .filter(id => visibleNodes.has(id));
    if (!seed.length) return null;

    const set = new Set(seed);
    let frontier = seed;
    for (let hop = 0; hop < FOCUS_HOPS; hop++) {
      const next = [];
      frontier.forEach(id => {
        incoming.get(id)
          .filter(({ link, other }) => visibleNodes.has(other.id) && linkVisible(link))
          .sort((a, b) => weightOf(b.link) - weightOf(a.link))
          .slice(0, FOCUS_DRIVERS)
          .forEach(({ other }) => {
            if (!set.has(other.id)) { set.add(other.id); next.push(other.id); }
          });
      });
      frontier = next;
    }
    return set;
  }

  function refreshLocalFocus() {
    const on = state.localFocus && profile();
    graph.setContext(on ? localFocusSet() : null);
  }

  optLocalFocus.addEventListener('change', () => {
    state.localFocus = optLocalFocus.checked;
    refreshLocalFocus();
  });

  function renderLocalTop() {
    const p = profile();
    if (!p) { localTop.innerHTML = ''; return; }
    const { exposed, contributing } = window.ECO_LOCALE.assess(E.nodes, E.links, p);
    const top = exposed.slice(0, 8);
    localTop.innerHTML = `
      <h4>Most exposed in ${p.name}</h4>
      ${top.length ? top.map((row, i) => `
        <button data-goto="${row.node.id}">
          <span class="rank">${i + 1}</span>
          <span class="swatch" style="background:${colourOf(row.node)}"></span>
          <span>${row.node.label}</span>
        </button>`).join('')
        : '<p class="empty-note">No exposure flags matched.</p>'}
      <h4>Typical drivers at ${R.INCOME[p.income].toLowerCase()}</h4>
      <p class="empty-note">An income-group generalisation, not ${p.name}'s own footprint.</p>
      ${contributing.slice(0, 5).map(row => `
        <button data-goto="${row.node.id}">
          <span class="rank">·</span>
          <span class="swatch" style="background:${colourOf(row.node)}"></span>
          <span>${row.node.label}</span>
        </button>`).join('') || '<p class="empty-note">No contribution rules matched.</p>'}`;
  }

  localTop.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-goto]');
    if (btn) focusNode(byId.get(btn.dataset.goto));
  });

  function onPlaceChange() {
    state.place = placeSelect.value;
    store.set('place', state.place);
    customBox.hidden = state.place !== '__custom__';
    localFocusWrap.hidden = !profile();
    if (!profile()) { state.localFocus = false; optLocalFocus.checked = false; }
    refreshLocalFocus();
    renderLocalTop();
    const selected = graph.selected();
    if (state.tableOpen) openTable(); else renderDetail(selected);
  }

  placeSelect.addEventListener('change', onPlaceChange);
  incomeSelect.addEventListener('change', () => {
    state.custom.income = incomeSelect.value;
    store.set('custom', state.custom);
    onPlaceChange();
  });
  document.getElementById('custom-flags').addEventListener('change', ev => {
    const flag = ev.target.dataset.flag;
    if (!flag) return;
    const flags = new Set(state.custom.flags);
    if (ev.target.checked) flags.add(flag); else flags.delete(flag);
    state.custom.flags = [...flags];
    store.set('custom', state.custom);
    onPlaceChange();
  });

  /* ── controls ────────────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-colour]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.colourBy = btn.dataset.colour;
      store.set('colourBy', state.colourBy);
      state.hiddenGroups.clear();
      document.querySelectorAll('[data-colour]').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-checked', String(on));
      });
      buildLegend();
      afterFilterChange();
      applyGrouping();
      renderLocalTop();
      if (state.tableOpen) openTable(); else renderDetail(graph.selected());
    });
  });

  function describeWeights() {
    const note = document.getElementById('weights-note');
    if (!CS) { note.textContent = 'Clickstream weights unavailable.'; return; }
    if (state.weights === 'editorial') {
      note.textContent = 'Hand-assigned by me. Honest, but one person’s judgement.';
      return;
    }
    const counts = { measured: 0, 'no-signal': 0, unmapped: 0 };
    CS.links.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    const ari = adjustedRand(clusterCache.editorial.of, clusterCache.readers.of,
                             issues.map(n => n.id));
    note.textContent =
      `English Wikipedia navigation, ${CS.months.join(' + ')}. ${counts.measured} of ` +
      `${CS.links.length} links measured, ${counts['no-signal']} with no recorded ` +
      `navigation, ${counts.unmapped} with no article. Clusters vs my weights: ` +
      `ARI ${ari.toFixed(2)}.`;
  }

  function setWeightSource(next) {
    state.weights = next;
    store.set('weights', next);
    document.querySelectorAll('[data-weights]').forEach(b => {
      const on = b.dataset.weights === next;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', String(on));
    });
    applyClusters(next);
    buildLegend();
    afterFilterChange();          // link ranks are per-source, so the filter moves
    describeWeights();
    const extra = clusters.count > CAT_KEYS.length
      ? ` The palette is validated at six hues, so anything past C${CAT_KEYS.length} shares a muted grey.`
      : '';
    document.getElementById('cluster-note').textContent =
      `${clusters.count} clusters found by Louvain modularity (Q = ` +
      `${clusters.modularity.toFixed(2)}) on link structure.` + extra;
    if (state.colourBy === 'cluster') applyGrouping();
    renderLocalTop();
    if (state.tableOpen) openTable(); else renderDetail(graph.selected());
  }

  document.querySelectorAll('[data-weights]').forEach(btn => {
    btn.addEventListener('click', () => setWeightSource(btn.dataset.weights));
  });

  /* Both sliders are pure view filters: no reheat, no relayout. Nodes keep their
   * positions as neighbours disappear, so the keystone structure emerges in place
   * instead of the whole map lurching on every notch. */
  const sliderLinks = document.getElementById('slider-links');
  const sliderDegree = document.getElementById('slider-degree');
  sliderLinks.value = String(Math.round(state.linkKeep * 100));
  sliderDegree.value = String(state.minDegree);

  function afterFilterChange() {
    recomputeVisibility();
    refreshLocalFocus();
  }

  sliderLinks.addEventListener('input', () => {
    state.linkKeep = Number(sliderLinks.value) / 100;
    afterFilterChange();
  });
  sliderLinks.addEventListener('change', () => store.set('linkKeep', state.linkKeep));

  sliderDegree.addEventListener('input', () => {
    state.minDegree = Number(sliderDegree.value);
    afterFilterChange();
  });
  sliderDegree.addEventListener('change', () => store.set('minDegree', state.minDegree));

  const optLoops = document.getElementById('opt-loops');
  optLoops.checked = state.loops;

  function applyLoopHighlight() {
    graph.setLoopSets(state.loops ? loopSets : null);
    const reinforcing = graphAnalysis.loops.filter(c => c.polarity === 'reinforcing').length;
    document.getElementById('loop-note').textContent = state.loops
      ? `${graphAnalysis.loops.length} loops up to 6 steps — ${reinforcing} reinforcing, ` +
        `${graphAnalysis.loops.length - reinforcing} balancing. ${loopSets.nodes.size} issues sit on one.`
      : '';
  }

  optLoops.addEventListener('change', () => {
    state.loops = optLoops.checked;
    store.set('loops', state.loops);
    if (!state.loops) clearTrace();
    applyLoopHighlight();
  });

  function clearTrace() {
    state.tracedLoop = null;
    graph.setTrace(null);
    document.querySelectorAll('.loop-row.active').forEach(el => el.classList.remove('active'));
  }

  function traceLoop(index) {
    const loop = graphAnalysis.loops[index];
    if (!loop) return;
    state.tracedLoop = index;
    graph.setTrace({
      nodes: new Set(loop.nodes),
      links: new Set(loop.links.map(l => l.source + '\t' + l.target))
    });
    document.querySelectorAll('.loop-row').forEach(el =>
      el.classList.toggle('active', Number(el.dataset.loop) === index));
  }

  const optGroup = document.getElementById('opt-group');
  const optVerbs = document.getElementById('opt-verbs');
  const optSolutions = document.getElementById('opt-solutions');
  optGroup.checked = state.group;
  optVerbs.checked = state.verbs;
  optSolutions.checked = state.solutions;

  optSolutions.addEventListener('change', () => {
    state.solutions = optSolutions.checked;
    store.set('solutions', state.solutions);
    document.getElementById('key-lever').hidden = !state.solutions;
    if (!state.solutions && graph.selected() && graph.selected().kind === 'solution') {
      graph.select(null);
    }
    buildLegend();
    relayout();
    if (state.tableOpen) openTable(); else renderDetail(graph.selected());
  });

  optGroup.addEventListener('change', () => {
    state.group = optGroup.checked;
    store.set('group', state.group);
    applyGrouping();
    layout.reheat(0.85);
  });
  optVerbs.addEventListener('change', () => {
    state.verbs = optVerbs.checked;
    store.set('verbs', state.verbs);
    graph.setShowAllVerbs(state.verbs);
  });

  document.getElementById('btn-zoom-in').addEventListener('click', () =>
    graph.zoomBy(1.25, canvas.clientWidth / 2, canvas.clientHeight / 2));
  document.getElementById('btn-zoom-out').addEventListener('click', () =>
    graph.zoomBy(1 / 1.25, canvas.clientWidth / 2, canvas.clientHeight / 2));
  document.getElementById('btn-fit').addEventListener('click', () => graph.fit());

  document.getElementById('btn-table').addEventListener('click', () => {
    if (state.tableOpen) renderDetail(graph.selected());
    else openTable();
  });

  document.getElementById('btn-theme').addEventListener('click', () => {
    const order = ['auto', 'light', 'dark'];
    state.theme = order[(order.indexOf(state.theme) + 1) % order.length];
    store.set('theme', state.theme);
    applyTheme();
    buildLegend();
    renderLocalTop();
    if (state.tableOpen) openTable(); else renderDetail(graph.selected());
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.theme === 'auto') { applyTheme(); buildLegend(); renderLocalTop(); }
  });

  document.addEventListener('keydown', ev => {
    if (ev.key === '/' && document.activeElement !== searchInput) {
      ev.preventDefault();
      searchInput.focus();
      searchInput.select();
    } else if (ev.key === 'Escape') {
      if (graph.selected()) graph.select(null);
    }
  });

  window.addEventListener('resize', () => { graph.resize(); });

  /* ── boot ────────────────────────────────────────────────────────────────── */
  applyTheme();
  // both partitions are needed up front so the ARI comparison can be reported
  applyClusters('editorial');
  if (CS) applyClusters('readers');
  applyClusters(state.weights);
  buildLegend();
  graph.setShowAllVerbs(state.verbs);
  applyLoopHighlight();
  document.getElementById('key-lever').hidden = !state.solutions;
  customBox.hidden = state.place !== '__custom__';
  localFocusWrap.hidden = !profile();
  renderLocalTop();
  renderDetail(null);

  setWeightSource(state.weights);

  graph.resize();

  /* Settle, then declutter, before the first paint so nothing visibly explodes.
   * declutter() separates boxes that enclose circle *and* label, sized for 11.5px
   * type at 1:1 — so no label can touch another label or another circle at any
   * zoom of 1.0 or above, which is exactly when every label is drawn. */
  /* Reserving a full label box for every node guarantees a clean map at 1:1, and
   * costs world area proportional to the node count. Below ~85 nodes that is
   * affordable. With the solutions layer on it is not — the world would grow until
   * the whole graph shrank to a third of usable size — so the dense case reserves
   * boxes only for the labels actually drawn at overview, and the rest of the
   * labels wait for a deeper zoom, where circle spacing is wide enough for them. */
  function relayout() {
    recomputeVisibility();
    refreshLabelPriority();

    const visible = E.nodes.filter(nodeVisible).length;
    const isDense = visible > DENSE_ABOVE;
    layout.setLabelPolicy({
      scale: 1 / (isDense ? DENSE_VIEW : OPEN_VIEW),
      labelled: isDense ? (n => n.labelPriority) : (() => true)
    });

    applyGrouping();
    layout.reheat(1);
    for (let i = 0; i < 600; i++) layout.step();

    /* Label type is a fixed 11.5px on screen while the layout reserves world units,
     * so the two only agree at one zoom. Chasing the fit scale in a feedback loop
     * diverges — inflating the boxes grows the world, which lowers the scale, which
     * demands more inflation — so instead we *commit* to the zoom the map will open
     * at and reserve for exactly that. */
    const target = isDense ? DENSE_VIEW : OPEN_VIEW;
    const left = layout.declutter(600);
    if (left) console.warn(`${left} label boxes still overlap after declutter`);

    // sparse: every label is clean at the opening zoom. dense: only the drawn ones,
    // and the rest wait for a zoom where circle spacing can hold a label.
    graph.setLabelAllScale(isDense ? 1.9 : target);
    graph.fit();
    if (graph.view.scale < target) graph.setView(target);
  }
  relayout();

  let settled = true;
  (function frame() {
    const moving = layout.step();
    if (moving) settled = false;
    if (!moving && !settled) { settled = true; layout.declutter(250); }
    updateGroupLabels();
    graph.draw();
    requestAnimationFrame(frame);
  })();
})();
