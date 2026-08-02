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
 * Subnational regions are drawn as their bounding boxes clipped to the parent country's
 * outline -- an SVG clipPath doing on screen precisely what tools/derive_climate.py does
 * numerically. That keeps the picture honest about what the data actually is: these are
 * boxes, not surveyed boundaries, and they look like boxes.
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

  /** A lon/lat box as a projected polygon: Equal Earth bends straight lines, so the
   *  edges are sampled rather than drawn corner to corner. */
  function boxPath(bbox, steps = 24) {
    const [w, s, e, n] = bbox;
    const pts = [];
    for (let i = 0; i <= steps; i++) pts.push([w + (e - w) * i / steps, n]);
    for (let i = 0; i <= steps; i++) pts.push([e, n + (s - n) * i / steps]);
    for (let i = 0; i <= steps; i++) pts.push([e + (w - e) * i / steps, s]);
    for (let i = 0; i <= steps; i++) pts.push([w, s + (n - s) * i / steps]);
    return pathOf([pts]);
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

    function boundsOfBbox(bbox) {
      const [w, s, e, n] = bbox;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let i = 0; i <= 12; i++) {
        for (const [lon, lat] of [[w + (e - w) * i / 12, s], [w + (e - w) * i / 12, n],
                                  [w, s + (n - s) * i / 12], [e, s + (n - s) * i / 12]]) {
          const [x, y] = project(lon, lat);
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      return { x0, x1, y0, y1 };
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
      drilled = place;
      svg.textContent = '';
      const rings = W.shapes[place.iso];
      if (!rings) return drawWorld(null);

      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      rings.forEach(r => r.forEach(([lon, lat]) => {
        const [x, y] = project(lon, lat);
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }));
      viewBox({ x0, x1, y0, y1 });

      const clipId = 'eco-clip-' + place.iso;
      const defs = el('defs', {});
      const clip = el('clipPath', { id: clipId });
      clip.appendChild(el('path', { d: pathOf(rings) }));
      defs.appendChild(clip);
      svg.appendChild(defs);

      svg.appendChild(el('path', { d: pathOf(rings), class: 'eco-map-parent' }));

      childrenOf(place.name).forEach(kid => {
        if (!kid.bbox || kid.bbox.length !== 4) return;
        const node = el('path', {
          d: boxPath(kid.bbox),
          class: 'eco-map-region',
          'clip-path': `url(#${clipId})`,
          tabindex: '0',
          role: 'button',
        });
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

      /* The country itself stays selectable: someone looking at Canada may want
       * Canada rather than one of its six regions. */
      const whole = el('path', { d: pathOf(rings), class: 'eco-map-whole', tabindex: '0' });
      const wt = el('title', {});
      wt.textContent = place.name + ' as a whole';
      whole.appendChild(wt);
      whole.addEventListener('click', () => onPick(place.name));
      svg.appendChild(whole);

      label.textContent = place.name + ' — click a region, its outline for the whole '
        + 'country, or anywhere else to go back. Regions are bounding boxes, not borders.';
    }

    /* Going back: the SVG background, and also the parent country's own fill. Without
     * the second case the label's "anywhere else" is a lie -- the fill covers most of
     * the drilled view, and clicking it did nothing. */
    svg.addEventListener('click', e => {
      if (!drilled) return;
      if (e.target === svg || e.target.classList.contains('eco-map-parent')) {
        drawWorld(null);
      }
    });

    return {
      show(selectedName) {
        if (selectedName) {
          const p = R.PLACES.find(x => x.name === selectedName);
          if (p && p.parent) {
            const parent = R.PLACES.find(x => x.name === p.parent);
            if (parent) return drill(parent);
          }
        }
        drawWorld(selectedName);
      },
      isDrilled: () => !!drilled,
    };
  }

  return { create, project };
})();
