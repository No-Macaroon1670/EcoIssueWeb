/* Map picker for the locale panel.
 *
 * Two levels, matching the region hierarchy. The world view shows every country; the
 * ones this project has a profile for are filled, the rest are inert. Clicking a country
 * that has subnational regions drills into it rather than selecting it.
 *
 * Projection is Equal Earth (Savric, Patterson & Jenny 2018) -- a closed-form equal-area
 * projection, about ten lines of arithmetic and no lookup tables. Equirectangular would
 * have been simpler still, and wrong for this: it inflates Russia and Canada enormously,
 * and this map is a picker for a tool about environmental exposure, where making high
 * latitudes look several times their real size is exactly the wrong thumb on the scale.
 *
 * Subnational regions are groups of administrative units, drawn as one <g> per region so
 * a region made of several provinces is a single click target without needing the
 * polygons unioned. Internal borders stay visible, which shows what a region is made of.
 *
 * The drilled view has no national outline behind the regions. It used to, from 1:110m
 * admin-0, while the regions come from 1:50m admin-1 -- different generalisations that
 * cannot register against each other, and around disputed borders they disagree outright.
 * Now that the regions tile their country completely, their union is the outline, drawn
 * from one consistent source.
 */
window.ECO_MAP = (function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ── Equal Earth ─────────────────────────────────────────────────────────── */
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
  const M = Math.sqrt(3) / 2;

  function project(lon, lat) {
    const phi = lat * Math.PI / 180;
    const lam = lon * Math.PI / 180;
    const t = Math.asin(M * Math.sin(phi));
    const t2 = t * t, t6 = t2 * t2 * t2;
    const x = lam * Math.cos(t) /
      (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
    const y = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
    return [x, -y];                       // SVG y grows downward
  }

  /* World extent is measured from the geometry actually drawn, not from the projection's
   * theoretical -180..180 by 90..-90. Those differ enough to see: with Antarctica
   * dropped and sub-degree islands filtered out by the build, the theoretical frame left
   * 2.3 times as much empty ocean on the west edge as the east, and nearly twice as much
   * below the land as above it. The map read as sitting high and to the right -- centred
   * on the projection rather than on its content. Fitting the drawn shapes centres what
   * a reader is actually looking at. */
  const WORLD = (() => {
    const W = window.ECO_WORLD;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const note = (lon, lat) => {
      const [x, y] = project(lon, lat);
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    };
    for (const iso in W.shapes) {
      for (const ring of W.shapes[iso]) {
        let lo = 180, hi = -180;
        for (const p of ring) { if (p[0] < lo) lo = p[0]; if (p[0] > hi) hi = p[0]; }
        if (hi - lo > 180) continue;       // same guard drawWorld applies
        for (const p of ring) note(p[0], p[1]);
      }
    }
    for (const iso in (W.points || {})) note(W.points[iso][0], W.points[iso][1]);
    return { x0, x1, y0, y1 };
  })();

  function pathOf(rings) {
    let d = '';
    for (const ring of rings) {
      /* A ring spanning more than half the globe has been split across the
       * antimeridian by the source and stitched back by rounding; drawing it would
       * streak a band across the map. */
      let lo = 180, hi = -180;
      for (const p of ring) { if (p[0] < lo) lo = p[0]; if (p[0] > hi) hi = p[0]; }
      if (hi - lo > 180) continue;
      for (let i = 0; i < ring.length; i++) {
        const [x, y] = project(ring[i][0], ring[i][1]);
        d += (i ? 'L' : 'M') + x.toFixed(4) + ' ' + y.toFixed(4);
      }
      d += 'Z';
    }
    return d;
  }

  /* data/subregions.js is 347 KB and only the map needs it, so it is injected on first
   * open rather than shipped in the initial page load. If the fetch fails, drilling is
   * simply unavailable and clicking a country selects it whole. */
  let dataPromise = null;
  function ensureData() {
    if (window.ECO_SUBREGIONS) return Promise.resolve();
    if (!dataPromise) {
      dataPromise = new Promise(resolve => {
        const s = document.createElement('script');
        s.src = 'data/subregions.js';
        s.onload = s.onerror = () => resolve();
        document.head.appendChild(s);
      });
    }
    return dataPromise;
  }

  function el(name, attrs) {
    const node = document.createElementNS(SVG_NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function create(opts) {
    const R = window.ECO_REGIONS;
    const W = window.ECO_WORLD;
    const mount = opts.mount;
    const onPick = opts.onPick || function () {};

    /* iso3 -> the place a click on that country should select. Merged groups claim
     * every member's iso, which is why build_world.py emits a name index. */
    const placeOf = {};
    R.PLACES.forEach(p => {
      if (p.iso) placeOf[p.iso] = p;
      if (p.members) {
        p.members.forEach(nm => {
          const iso = W.names[nm];
          if (iso) placeOf[iso] = p;
        });
      }
    });
    const childrenOf = name => R.PLACES.filter(p => p.parent === name);

    let drilled = null;                    // country place we are zoomed into, or null
    const svg = el('svg', { class: 'eco-map', role: 'group' });
    const label = document.createElement('p');
    label.className = 'eco-map-label';
    mount.appendChild(svg);
    mount.appendChild(label);

    function viewBox(box) {
      const pad = 0.04 * (box.x1 - box.x0);
      svg.setAttribute('viewBox',
        `${box.x0 - pad} ${box.y0 - pad} ${box.x1 - box.x0 + 2 * pad} ${box.y1 - box.y0 + 2 * pad}`);
    }

    function drawWorld(selectedName) {
      svg.textContent = '';
      viewBox(WORLD);
      for (const iso in W.shapes) {
        const place = placeOf[iso];
        const d = pathOf(W.shapes[iso]);
        if (!d) continue;
        const kids = place ? childrenOf(place.name).length : 0;
        const node = el('path', {
          d,
          class: 'eco-map-country'
            + (place ? ' has-place' : ' no-place')
            + (place && place.name === selectedName ? ' is-selected' : '')
            + (kids ? ' has-kids' : ''),
        });
        if (place) {
          node.setAttribute('tabindex', '0');
          node.setAttribute('role', 'button');
          const t = el('title', {});
          t.textContent = place.name + (kids ? ` — ${kids} regions` : '');
          node.appendChild(t);
          const act = () => (kids ? drill(place) : onPick(place.name));
          node.addEventListener('click', act);
          node.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
          });
        }
        svg.appendChild(node);
      }

      /* Micro-states, drawn last so their dots sit above neighbouring coastlines.
       * Without these the Maldives, Tuvalu, Barbados and Singapore are simply absent
       * from a map used to pick a place -- and small island states are the constituency
       * this whole locale feature exists for. */
      for (const iso in (W.points || {})) {
        const place = placeOf[iso];
        if (!place) continue;
        const [x, y] = project(W.points[iso][0], W.points[iso][1]);
        const dot = el('circle', {
          cx: x.toFixed(4), cy: y.toFixed(4), r: 0.035,
          class: 'eco-map-dot' + (place.name === selectedName ? ' is-selected' : ''),
          tabindex: '0', role: 'button',
        });
        const t = el('title', {});
        t.textContent = place.name + ' (too small to draw at this scale)';
        dot.appendChild(t);
        const act = () => onPick(place.name);
        dot.addEventListener('click', act);
        dot.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
        });
        svg.appendChild(dot);
      }

      drilled = null;
      label.textContent = 'Click a country. Outlined countries divide into regions; '
        + 'dots are states too small to draw at this scale.';
    }

    function drill(place) {
      const SUB0 = window.ECO_SUBREGIONS || {};
      const kids = childrenOf(place.name).filter(k => (SUB0[k.name] || []).length);
      if (!kids.length) return drawWorld(place.name);
      drilled = place;
      svg.textContent = '';

      /* Frame on the regions themselves, not on the 110m country shape. Those are
       * different datasets and do not agree, so framing on one while drawing the other
       * left the drawing off-centre inside its own frame. */
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      kids.forEach(k => SUB0[k.name].forEach(r => r.forEach(([lon, lat]) => {
        const [x, y] = project(lon, lat);
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      })));
      viewBox({ x0, x1, y0, y1 });

      /* No national outline behind the regions. It came from 1:110m admin-0 while the
       * regions come from 1:50m admin-1, so the two are generalised differently and
       * cannot register against each other -- and where a border is disputed they
       * disagree outright, most visibly around Jammu and Kashmir, which admin-1 includes
       * and the 110m India outline does not. The regions now tile their country
       * completely, so their union IS the outline, drawn from one consistent source. */
      const SUB = window.ECO_SUBREGIONS || {};
      childrenOf(place.name).forEach(kid => {
        const shape = SUB[kid.name];
        if (!shape || !shape.length) return;
        /* One <g> per region holding every constituent unit, so a region made of three
         * provinces is a single click target without needing the polygons unioned.
         * Internal borders stay visible, which shows what it is made of. */
        const node = el('g', { class: 'eco-map-region', tabindex: '0', role: 'button' });
        shape.forEach(ring => node.appendChild(el('path', { d: pathOf([ring]) })));
        const t = el('title', {});
        t.textContent = kid.name;
        node.appendChild(t);
        const act = () => onPick(kid.name);
        node.addEventListener('click', act);
        node.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
        });
        svg.appendChild(node);
      });

      /* The country itself stays selectable, but as a button rather than a clickable
       * outline. The outline was the 110m national shape, which is the geometry just
       * removed for disagreeing with the regions; with the regions tiling the country
       * there is no spare area left to click anyway. */
      label.textContent = '';
      const whole = document.createElement('button');
      whole.type = 'button';
      whole.className = 'linkish';
      whole.textContent = 'Use ' + place.name + ' as a whole';
      whole.addEventListener('click', () => onPick(place.name));
      const hint = document.createElement('span');
      hint.textContent = ' — or click a region, or the background to go back. Regions '
        + 'are groups of states and provinces, so they approximate their subject '
        + 'rather than matching it.';
      label.appendChild(whole);
      label.appendChild(hint);
    }

    /* Going back: clicking the SVG background. The regions now tile the country, so
     * the background is genuinely empty space rather than the country's own fill. */
    svg.addEventListener('click', e => {
      if (!drilled) return;
      if (e.target === svg) {
        drawWorld(null);
      }
    });

    return {
      show(selectedName) {
        const render = () => {
          if (selectedName) {
            const p = R.PLACES.find(x => x.name === selectedName);
            if (p && p.parent) {
              const parent = R.PLACES.find(x => x.name === p.parent);
              if (parent) return drill(parent);
            }
          }
          drawWorld(selectedName);
        };
        render();                     // draw immediately from what is already loaded
        ensureData().then(() => {     // redraw once the outlines arrive
          if (drilled) drill(drilled);
        });
      },
      isDrilled: () => !!drilled,
    };
  }

  return { create, project };
})();
