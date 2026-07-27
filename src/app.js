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
    'pesticides': 'Pesticides', 'ewaste': 'E-waste', 'oil-spills': 'Oil spills',
    'pharma-residues': 'Pharma residues', 'landfill-waste': 'Landfill & waste',
    'water-scarcity': 'Water scarcity', 'unsafe-water': 'Unsafe water',
    'salinization': 'Salinization', 'glacier-water': 'Glacier-fed water',
    'dams': 'Dams & barriers', 'ocean-warming': 'Ocean warming',
    'acidification': 'Acidification', 'dead-zones': 'Dead zones',
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

  /* Clustering runs over issues only, so the communities do not shift when the
   * solutions layer is toggled. Each lever then inherits the cluster of whatever
   * it acts on most heavily. */
  const issues = E.nodes.filter(n => n.kind !== 'solution');
  const solutions = E.nodes.filter(n => n.kind === 'solution');
  const issueIds = new Set(issues.map(n => n.id));
  const clusters = window.ECO_CLUSTER.run(
    issues.map(n => n.id),
    E.links.filter(l => issueIds.has(l.source) && issueIds.has(l.target)),
    1
  );
  solutions.forEach(sol => {
    const tally = new Map();
    outgoing.get(sol.id).forEach(({ link, other }) => {
      const c = clusters.of[other.id];
      if (c != null) tally.set(c, (tally.get(c) || 0) + link.w);
    });
    const best = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    clusters.of[sol.id] = best ? best[0] : 0;
  });

  const clusterMembers = new Map();
  E.nodes.forEach(n => {
    const c = clusters.of[n.id];
    if (!clusterMembers.has(c)) clusterMembers.set(c, []);
    clusterMembers.get(c).push(n);
  });
  const clusterLabel = new Map();
  clusterMembers.forEach((members, c) => {
    const top = members.slice().sort((a, b) => b.weight - a.weight)[0];
    clusterLabel.set(c, top.label);
  });

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
    minWeight: store.get('minWeight', 1),
    solutions: store.get('solutions', false),
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

  function colourOf(node) {
    return state.colourBy === 'cat' ? catColour(node.cat) : clusterColour(clusters.of[node.id]);
  }

  /* Colour key drives the legend and hiding; group key drives layout anchoring.
   * They differ for levers, which take their domain's hue but cluster together on
   * screen so the solutions layer reads as a layer. */
  function colourKeyOf(node) {
    return state.colourBy === 'cat' ? node.cat : clusters.of[node.id];
  }

  function groupKeyOf(node) {
    return node.kind === 'solution' ? '__levers__' : colourKeyOf(node);
  }

  function groupTitle(key) {
    if (key === '__levers__') return 'Responses & levers';
    if (state.colourBy === 'cat') return E.cats[key].label;
    const index = Number(key);
    return index < CAT_KEYS.length
      ? `C${index + 1} · ${clusterLabel.get(index)}`
      : `Other (${clusterMembers.get(index).length})`;
  }

  function nodeVisible(node) {
    if (node.kind === 'solution' && !state.solutions) return false;
    return !state.hiddenGroups.has(String(colourKeyOf(node)));
  }

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
  graph.setVisibility(nodeVisible);
  graph.setLinkFilter(link => link.w >= state.minWeight);
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
      profile: profile(),
      issueCount: issues.length,
      solutionCount: solutions.length,
      linkCount: E.links.length
    };
  }

  function groupTitleForCluster(index) {
    return index < CAT_KEYS.length
      ? `Cluster ${index + 1} · ${clusterLabel.get(index)}`
      : 'Small cluster';
  }

  function renderDetail(node) {
    state.tableOpen = false;
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
      applyGrouping();
      renderLocalTop();
      if (state.tableOpen) openTable(); else renderDetail(graph.selected());
    });
  });

  document.querySelectorAll('[data-weight]').forEach(btn => {
    const value = Number(btn.dataset.weight);
    if (value === state.minWeight) {
      document.querySelectorAll('[data-weight]').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-checked', String(b === btn));
      });
    }
    btn.addEventListener('click', () => {
      state.minWeight = value;
      store.set('minWeight', value);
      document.querySelectorAll('[data-weight]').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-checked', String(on));
      });
    });
  });

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
  buildLegend();
  graph.setShowAllVerbs(state.verbs);
  document.getElementById('key-lever').hidden = !state.solutions;
  customBox.hidden = state.place !== '__custom__';
  renderLocalTop();
  renderDetail(null);

  document.getElementById('cluster-note').textContent =
    `${clusters.count} clusters found by Louvain modularity (Q = ${clusters.modularity.toFixed(2)}) on link structure.`;

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
