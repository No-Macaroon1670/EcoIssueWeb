/* Canvas renderer + pointer interaction for the issue web. */
window.ECO_GRAPH = (function () {

  const TAU = Math.PI * 2;
  // Zoom at which the thinned overview gives way to every label. The layout sets
  // it, because it is the layout that knows how much room it managed to reserve.
  let LABEL_ALL_SCALE = 1.0;

  function create(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const nodes = opts.nodes;
    const links = opts.links;
    const byId = new Map(nodes.map(n => [n.id, n]));

    // Directed pairs that also exist in reverse get mirrored curvature so the two
    // arrows do not sit on top of each other.
    const pairSeen = new Set(links.map(l => l.source + '|' + l.target));
    links.forEach(l => {
      const reciprocal = pairSeen.has(l.target + '|' + l.source);
      l._curve = reciprocal ? (l.source < l.target ? 0.17 : -0.17) : 0.10;
      l._a = byId.get(l.source);
      l._b = byId.get(l.target);
    });

    const neighbours = new Map(nodes.map(n => [n.id, new Set()]));
    links.forEach(l => {
      neighbours.get(l.source).add(l.target);
      neighbours.get(l.target).add(l.source);
    });

    const view = { scale: 0.8, tx: 0, ty: 0 };
    let width = 0, height = 0, dpr = 1;
    let hovered = null, selected = null, dragging = null, panning = null;
    let isVisible = () => true;
    let linkVisible = () => true;
    let strengthOf = () => 0.5;   // link rank in 0..1 within the active weight source
    let showAllVerbs = false;
    let loopNodes = null, loopLinks = null;   // emphasis when loop highlighting is on
    let trace = null;                          // {nodes:Set, links:Set} for one loop
    let context = null;                        // local-focus set; dims everything else
    let groupLabels = [];        // [{text, x, y}] drawn faintly behind everything
    let theme = readTheme();

    function readTheme() {
      const s = getComputedStyle(document.documentElement);
      const get = (name, fallback) => (s.getPropertyValue(name).trim() || fallback);
      return {
        surface: get('--surface-1', '#fcfcfb'),
        ink: get('--text-primary', '#0b0b0b'),
        ink2: get('--text-secondary', '#52514e'),
        muted: get('--text-muted', '#898781'),
        edge: get('--edge', 'rgba(11,11,11,0.30)'),
        edgeStrong: get('--edge-strong', 'rgba(11,11,11,0.65)')
      };
    }

    function toScreen(x, y) {
      return [x * view.scale + view.tx, y * view.scale + view.ty];
    }
    function toWorld(sx, sy) {
      return [(sx - view.tx) / view.scale, (sy - view.ty) / view.scale];
    }

    function visible(n) { return isVisible(n); }

    /* Neighbours reachable by a link that is currently drawn, so the highlight
     * never implies a connection the view is hiding. */
    function linkKey(link) { return link.source + '\t' + link.target; }

    function focusSet() {
      if (trace) return trace.nodes;            // a traced loop outranks hover
      const anchor = selected || hovered;
      if (!anchor) return null;
      const set = new Set([anchor.id]);
      for (const link of links) {
        if (!linkVisible(link)) continue;
        if (link.source === anchor.id) set.add(link.target);
        else if (link.target === anchor.id) set.add(link.source);
      }
      return set;
    }

    /* ── geometry ─────────────────────────────────────────────────────────── */

    function control(link) {
      const a = link._a, b = link._b;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y;
      return [mx - dy * link._curve, my + dx * link._curve];
    }

    function pointAt(link, t) {
      const [cx, cy] = control(link);
      const a = link._a, b = link._b;
      const u = 1 - t;
      return [
        u * u * a.x + 2 * u * t * cx + t * t * b.x,
        u * u * a.y + 2 * u * t * cy + t * t * b.y
      ];
    }

    /** t values where the curve clears each node's circle. */
    function trim(link) {
      const a = link._a, b = link._b;
      let t0 = 0, t1 = 1;
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        const [px, py] = pointAt(link, t);
        if (Math.hypot(px - a.x, py - a.y) >= a.r + 2) { t0 = t; break; }
      }
      for (let i = 0; i <= 28; i++) {
        const t = 1 - i / 28;
        const [px, py] = pointAt(link, t);
        if (Math.hypot(px - b.x, py - b.y) >= b.r + 8) { t1 = t; break; }
      }
      return t0 < t1 ? [t0, t1] : [0.45, 0.55];
    }

    /* ── drawing ──────────────────────────────────────────────────────────── */

    function drawEdge(link, alpha, emphasis) {
      const negative = window.ECO.negativeVerbs.includes(link.verb);
      const [t0, t1] = trim(link);
      const steps = 18;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = emphasis ? theme.edgeStrong : theme.edge;
      ctx.lineWidth = (emphasis ? 2 : 1.2) * (0.5 + strengthOf(link) * 1.0);
      ctx.lineCap = 'round';
      if (negative) ctx.setLineDash([6 * view.scale, 5 * view.scale]);

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const [wx, wy] = pointAt(link, t0 + (t1 - t0) * (i / steps));
        const [sx, sy] = toScreen(wx, wy);
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // arrowhead at the target end
      const [ex, ey] = toScreen(...pointAt(link, t1));
      const [bx, by] = toScreen(...pointAt(link, Math.max(t0, t1 - 0.06)));
      const ang = Math.atan2(ey - by, ex - bx);
      const size = (negative ? 9 : 8.5) * Math.min(1.35, Math.max(0.75, view.scale));
      const spread = negative ? 0.52 : 0.42;

      ctx.translate(ex, ey);
      ctx.rotate(ang);
      if (negative) {
        // open chevron: reads as "damps" rather than "drives"
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(-size, -size * spread);
        ctx.lineTo(0, 0);
        ctx.lineTo(-size, size * spread);
        ctx.stroke();
      } else {
        ctx.fillStyle = emphasis ? theme.edgeStrong : theme.edge;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size * spread);
        ctx.lineTo(-size * 0.72, 0);
        ctx.lineTo(-size, size * spread);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawVerb(link, alpha) {
      const [t0, t1] = trim(link);
      const [wx, wy] = pointAt(link, (t0 + t1) / 2);
      const [sx, sy] = toScreen(wx, wy);
      const [ax, ay] = toScreen(...pointAt(link, t0));
      const [bx, by] = toScreen(...pointAt(link, t1));
      let ang = Math.atan2(by - ay, bx - ax);
      if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;   // keep text upright

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(sx, sy);
      ctx.rotate(ang);
      ctx.font = '600 10.5px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = theme.surface;                                // halo, per mark specs
      ctx.strokeText(link.verb, 0, -1);
      ctx.fillStyle = theme.ink2;
      ctx.fillText(link.verb, 0, -1);
      ctx.restore();
    }

    function drawNode(node, alpha, isFocus) {
      const [sx, sy] = toScreen(node.x, node.y);
      const r = node.r * view.scale;
      const colour = opts.colourOf(node);

      ctx.save();
      ctx.globalAlpha = alpha;

      if (node.kind === 'solution') {
        /* Levers read as a different class of thing, not a seventh category: hollow
         * ring, hue still carrying the domain it acts in. Composite encoding, so the
         * palette stays at its six validated hues. */
        const ring = Math.max(3.5, r * 0.30);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, TAU);
        ctx.fillStyle = theme.surface;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, r - ring / 2, 0, TAU);
        ctx.lineWidth = ring;
        ctx.strokeStyle = colour;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, TAU);
        ctx.fillStyle = colour;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, TAU);
      ctx.lineWidth = 2;                          // 2px surface ring on overlapping marks
      ctx.strokeStyle = theme.surface;
      ctx.stroke();

      // a node that sits on a feedback loop gets an outer ink ring: "this one
      // feeds back into itself somewhere"
      if (loopNodes && loopNodes.has(node.id)) {
        ctx.beginPath();
        ctx.arc(sx, sy, r + 3.5, 0, TAU);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = theme.ink2;
        ctx.stroke();
      }

      if (node === selected || (isFocus && node === hovered)) {
        ctx.beginPath();
        ctx.arc(sx, sy, r + (loopNodes && loopNodes.has(node.id) ? 7 : 4), 0, TAU);
        ctx.lineWidth = node === selected ? 2.5 : 1.5;
        ctx.strokeStyle = theme.ink;
        ctx.stroke();
      }
      if (node.pinned) {
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(2, r * 0.16), 0, TAU);
        ctx.fillStyle = theme.surface;
        ctx.fill();
      }
      ctx.restore();
    }

    function drawNodeLabel(node, alpha) {
      const [sx, sy] = toScreen(node.x, node.y);
      const r = node.r * view.scale;
      const lines = node.lines || [node.label];
      const lineHeight = 13;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '600 11.5px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = theme.surface;
      ctx.fillStyle = theme.ink;
      let y = sy + r + 5;
      for (const line of lines) {
        ctx.strokeText(line, sx, y);
        ctx.fillText(line, sx, y);
        y += lineHeight;
      }
      ctx.restore();
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const focus = focusSet();
      const shown = nodes.filter(visible);

      // group captions sit behind the graph so they never fight with the marks
      ctx.save();
      ctx.font = '600 13px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = theme.muted;
      ctx.globalAlpha = focus ? 0.22 : 0.42;
      for (const g of groupLabels) {
        const [sx, sy] = toScreen(g.x, g.y);
        ctx.fillText(g.text.toUpperCase(), sx, sy);
      }
      ctx.restore();

      /* A traced loop is a set of specific directed edges, so membership is tested
       * per edge. Testing "both endpoints in the focus set" would light up chords
       * across the loop as though they were part of it. */
      const inFocusOf = link => trace
        ? trace.links.has(linkKey(link))
        : focus && focus.has(link.source) && focus.has(link.target);

      /* Nearly 400 links is a hairball at full strength, so the resting state is
       * deliberately faint. Rather than one flat alpha for every edge, resting
       * opacity tracks the link's rank: the weakest half sinks toward the surface
       * and the strongest stand out, which separates the structure without hiding
       * anything. (--edge is itself ~34% opaque, so these multiply down further.) */
      for (const link of links) {
        if (!visible(link._a) || !visible(link._b) || !linkVisible(link)) continue;
        const inFocus = inFocusOf(link);
        const looped = loopLinks && loopLinks.has(linkKey(link));
        const resting = 0.16 + strengthOf(link) * 0.46;
        let alpha = focus ? (inFocus ? 0.95 : 0.07) : (looped ? 0.9 : resting);
        if (!focus && context && !(context.has(link.source) && context.has(link.target))) {
          alpha *= 0.22;                      // outside the local-focus set
        }
        drawEdge(link, alpha, !!inFocus || (!focus && !!looped));
      }

      for (const link of links) {
        if (!visible(link._a) || !visible(link._b) || !linkVisible(link)) continue;
        const inFocus = inFocusOf(link);
        if (inFocus || (showAllVerbs && !focus && view.scale > 0.5)) {
          drawVerb(link, inFocus ? 1 : 0.75);
        }
      }

      for (const node of shown) {
        const dim = focus ? !focus.has(node.id) : (context && !context.has(node.id));
        drawNode(node, dim ? 0.16 : 1, !!focus);
      }
      /* Label thinning, as a map does it. Every label cannot fit at overview zoom
       * — the layout only reserves enough room for the high-degree ones there —
       * so the rest appear on zoom-in, on hover, or in the table view. */
      for (const node of shown) {
        const inFocus = focus && focus.has(node.id);
        if (focus && !inFocus && view.scale < 1.15) continue;
        const outOfContext = !focus && context && !context.has(node.id);
        if (outOfContext && view.scale < 1.15) continue;
        const show = inFocus || view.scale >= LABEL_ALL_SCALE || node.labelPriority;
        if (!show) continue;
        drawNodeLabel(node, (focus && !inFocus) || outOfContext ? 0.2 : 1);
      }
    }

    /* ── viewport ─────────────────────────────────────────────────────────── */

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    function fit(padding) {
      const shown = nodes.filter(visible);
      if (!shown.length) return;
      // bound the label boxes, not just the circles, or edge labels get clipped
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of shown) {
        const hw = Math.max(n.r, (n.lw || 0) / 2);
        minX = Math.min(minX, n.x - hw); maxX = Math.max(maxX, n.x + hw);
        minY = Math.min(minY, n.y - n.r); maxY = Math.max(maxY, n.y + n.r + (n.lh || 34));
      }
      const pad = padding == null ? 26 : padding;
      const scale = Math.min(
        (width - pad * 2) / Math.max(1, maxX - minX),
        (height - pad * 2) / Math.max(1, maxY - minY)
      );
      view.scale = Math.max(0.28, Math.min(1.5, scale));
      view.tx = width / 2 - ((minX + maxX) / 2) * view.scale;
      view.ty = height / 2 - ((minY + maxY) / 2) * view.scale;
    }

    /** Centre the visible graph at an explicit zoom, for maps too big to fit. */
    function setView(scale) {
      const shown = nodes.filter(visible);
      if (!shown.length) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of shown) {
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      }
      view.scale = scale;
      view.tx = width / 2 - ((minX + maxX) / 2) * scale;
      view.ty = height / 2 - ((minY + maxY) / 2) * scale;
    }

    function zoomBy(factor, cx, cy) {
      const next = Math.max(0.25, Math.min(3.2, view.scale * factor));
      const [wx, wy] = toWorld(cx, cy);
      view.scale = next;
      view.tx = cx - wx * view.scale;
      view.ty = cy - wy * view.scale;
    }

    function hitTest(sx, sy) {
      let best = null, bestDist = Infinity;
      for (const n of nodes) {
        if (!visible(n)) continue;
        const [nx, ny] = toScreen(n.x, n.y);
        const d = Math.hypot(sx - nx, sy - ny);
        if (d <= n.r * view.scale + 5 && d < bestDist) { best = n; bestDist = d; }
      }
      return best;
    }

    /* ── pointer handling ─────────────────────────────────────────────────── */

    function localPoint(ev) {
      const rect = canvas.getBoundingClientRect();
      return [ev.clientX - rect.left, ev.clientY - rect.top];
    }

    canvas.addEventListener('pointerdown', ev => {
      const [sx, sy] = localPoint(ev);
      const hit = hitTest(sx, sy);
      canvas.setPointerCapture(ev.pointerId);
      if (hit) {
        dragging = { node: hit, moved: false, wasPinned: hit.pinned };
        hit.fixed = true;
      } else {
        panning = { sx, sy, tx: view.tx, ty: view.ty };
      }
    });

    canvas.addEventListener('pointermove', ev => {
      const [sx, sy] = localPoint(ev);
      if (dragging) {
        const [wx, wy] = toWorld(sx, sy);
        if (Math.hypot(wx - dragging.node.x, wy - dragging.node.y) > 1.5) dragging.moved = true;
        dragging.node.x = wx; dragging.node.y = wy;
        dragging.node.vx = dragging.node.vy = 0;
        opts.onDrag && opts.onDrag();
        return;
      }
      if (panning) {
        view.tx = panning.tx + (sx - panning.sx);
        view.ty = panning.ty + (sy - panning.sy);
        return;
      }
      const hit = hitTest(sx, sy);
      if (hit !== hovered) {
        hovered = hit;
        canvas.style.cursor = hit ? 'pointer' : 'grab';
        opts.onHover && opts.onHover(hit);
      }
    });

    function endPointer(ev) {
      if (dragging) {
        const node = dragging.node;
        if (!dragging.moved) {
          node.fixed = dragging.wasPinned || false;
          api.select(node === selected ? null : node);
        } else {
          node.pinned = true;
          node.fixed = true;
        }
      }
      dragging = null;
      panning = null;
      if (canvas.hasPointerCapture && ev && canvas.hasPointerCapture(ev.pointerId)) {
        canvas.releasePointerCapture(ev.pointerId);
      }
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);

    canvas.addEventListener('dblclick', ev => {
      const [sx, sy] = localPoint(ev);
      const hit = hitTest(sx, sy);
      if (hit) { hit.pinned = false; hit.fixed = false; opts.onDrag && opts.onDrag(); }
    });

    canvas.addEventListener('wheel', ev => {
      ev.preventDefault();
      const [sx, sy] = localPoint(ev);
      zoomBy(ev.deltaY < 0 ? 1.12 : 1 / 1.12, sx, sy);
    }, { passive: false });

    const api = {
      draw, resize, fit, setView, zoomBy, view,
      nodeAt: hitTest,
      refreshTheme() { theme = readTheme(); },
      setVisibility(fn) { isVisible = fn || (() => true); },
      setLinkFilter(fn) { linkVisible = fn || (() => true); },
      setStrengthOf(fn) { strengthOf = fn || (() => 0.5); },
      /** sets = {nodes:Set, links:Set} to emphasise loop members, or null for off. */
      setLoopSets(sets) {
        loopNodes = sets ? sets.nodes : null;
        loopLinks = sets ? sets.links : null;
      },
      /** trace = {nodes:Set, links:Set} for one loop, or null to clear. */
      setTrace(t) { trace = t || null; },
      /** context = Set of node ids to keep bright when nothing is hovered. */
      setContext(set) { context = set || null; },
      tracing: () => !!trace,
      setLabelAllScale(v) { LABEL_ALL_SCALE = v; },
      setShowAllVerbs(on) { showAllVerbs = on; },
      setGroupLabels(list) { groupLabels = list || []; },
      selected: () => selected,
      hovered: () => hovered,
      select(node) {
        selected = node || null;
        opts.onSelect && opts.onSelect(selected);
      },
      centreOn(node) {
        view.tx = width / 2 - node.x * view.scale;
        view.ty = height / 2 - node.y * view.scale;
      },
      neighboursOf(id) { return neighbours.get(id); }
    };
    return api;
  }

  return { create };
})();
