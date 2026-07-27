/* Force-directed layout, tuned for ~70 nodes.
 *
 * Pair repulsion is O(n^2), which at this size costs less than a Barnes-Hut tree
 * would. Anchors are the interesting part: pulling each node gently toward its
 * group centroid puts position to work as a second identity channel, so the map
 * stays readable even for someone who cannot separate two of the hues.
 */
window.ECO_LAYOUT = (function () {

  function create(nodes, links, opts) {
    const cfg = Object.assign({
      repulsion: 7000,
      springLength: 130,
      springStrength: 0.044,
      centerPull: 0.0018,
      anchorPull: 0.020,
      damping: 0.87,
      maxSpeed: 20,
      // Each node occupies its circle *plus* the wrapped label underneath it, so
      // collision resolves label boxes rather than circles. Without this, labels
      // overlap neighbouring circles even when no two circles touch.
      padX: 26,
      padY: 12,
      relax: 0.55        // share of each overlap removed per declutter pass
    }, opts || {});

    const byId = new Map(nodes.map(n => [n.id, n]));
    const edges = links
      .map(l => ({ a: byId.get(l.source), b: byId.get(l.target), w: l.w }))
      .filter(e => e.a && e.b);

    // deterministic scatter so the same data always opens the same way
    let seed = 12345;
    const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      const rad = 120 + rand() * 260;
      n.x = Math.cos(a) * rad;
      n.y = Math.sin(a) * rad;
      n.vx = n.vy = 0;
      n.fixed = false;
    });

    let alpha = 1;
    let anchors = new Map();     // groupKey -> {x, y}
    let anchorOf = null;         // node -> groupKey, or null to disable
    let active = () => true;     // hidden nodes must not distort the visible layout
    let labelScale = 1;          // how much label room to reserve, vs 11.5px at 1:1
    let labelled = () => true;   // which nodes get label room at all

    const api = {
      alpha: () => alpha,
      reheat(a) { alpha = Math.max(alpha, a == null ? 0.85 : a); },

      /** Only nodes passing this take part in the simulation and in declutter. */
      setActive(fn) { active = fn || (() => true); },

      /* Ring sizing and declutter must agree about how much label room is being
       * reserved, or the groups are laid out too tight to ever separate. */
      setLabelPolicy(opts) {
        labelScale = (opts && opts.scale) || 1;
        labelled = (opts && opts.labelled) || (() => true);
      },

      /** groups: Map(groupKey -> node[]) laid out on a ring, or null for free layout. */
      setGroups(groups) {
        if (!groups) { anchorOf = null; anchors = new Map(); return; }
        const keys = [...groups.keys()];

        /* Size the ring to the content. A fixed radius either overlaps the groups
         * or scatters them across empty space; what matters is that adjacent group
         * centres sit about one group-diameter apart, so chord = 2R sin(pi/k). */
        let groupRadius = 0;
        groups.forEach(members => {
          const area = members.reduce((sum, n) => {
            const lw = labelled(n) ? (n.lw || 0) * labelScale : 0;
            const lh = labelled(n) ? (n.lh || 0) * labelScale : 0;
            return sum + (Math.max(2 * n.r, lw) + cfg.padX) * (2 * n.r + lh + cfg.padY);
          }, 0);
          groupRadius = Math.max(groupRadius, Math.sqrt(area * 1.25 / Math.PI));
        });
        const radius = keys.length <= 1 ? 0
          : Math.max(groupRadius, groupRadius / Math.sin(Math.PI / keys.length) * 0.82);
        anchors = new Map();
        // slightly elliptical: stages are wider than they are tall
        keys.forEach((key, i) => {
          const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2;
          anchors.set(key, { x: Math.cos(a) * radius * 1.24, y: Math.sin(a) * radius * 0.94 });
        });
        anchorOf = new Map();
        groups.forEach((members, key) => members.forEach(n => anchorOf.set(n, key)));
      },

      /* Position-based separation of circle + label boxes.
       *
       * Solving this with forces does not work: the boxes are wide, so a node
       * receives large competing pushes from many neighbours at once, gets speed
       * clamped, and freezes mid-jitter. Moving positions directly by a share of
       * each overlap converges in a few hundred passes instead, and a weak pull
       * back toward the group anchor keeps it from unravelling the structure.
       * Returns the number of overlapping pairs still outstanding. */
      declutter(iterations, opts) {
        const scale = (opts && opts.labelScale) || labelScale;
        const has = (opts && opts.labelled) || labelled;
        const lwOf = n => (has(n) ? (n.lw || 0) * scale : 0);
        const lhOf = n => (has(n) ? (n.lh || 0) * scale : 0);

        let remaining = 0;
        const live = nodes.filter(active);
        for (let pass = 0; pass < iterations; pass++) {
          remaining = 0;
          for (let i = 0; i < live.length; i++) {
            const a = live[i];
            for (let j = i + 1; j < live.length; j++) {
              const b = live[j];
              const ahw = Math.max(a.r, lwOf(a) / 2) + cfg.padX / 2;
              const bhw = Math.max(b.r, lwOf(b) / 2) + cfg.padX / 2;
              const dx = b.x - a.x;
              const overlapX = (ahw + bhw) - Math.abs(dx);
              if (overlapX <= 0) continue;

              const aHalfH = a.r + lhOf(a) / 2 + cfg.padY / 2;
              const bHalfH = b.r + lhOf(b) / 2 + cfg.padY / 2;
              const dy = (b.y + lhOf(b) / 2) - (a.y + lhOf(a) / 2);
              const overlapY = (aHalfH + bHalfH) - Math.abs(dy);
              if (overlapY <= 0) continue;

              remaining++;
              const aMoves = !a.fixed, bMoves = !b.fixed;
              if (!aMoves && !bMoves) continue;
              const share = aMoves && bMoves ? 0.5 : 1;

              if (overlapX < overlapY) {
                const shift = overlapX * cfg.relax * share * (dx >= 0 ? 1 : -1);
                if (aMoves) a.x -= shift;
                if (bMoves) b.x += shift;
              } else {
                const shift = overlapY * cfg.relax * share * (dy >= 0 ? 1 : -1);
                if (aMoves) a.y -= shift;
                if (bMoves) b.y += shift;
              }
            }
          }
          if (!remaining) break;

          /* Ease back toward the group centre — but only for the first stretch of
           * passes. Left running to the end it exactly cancels the separation and
           * the solve stalls with overlaps still outstanding; tapering it off lets
           * the group re-form early and then finish cleanly. */
          if (anchorOf && pass < iterations * 0.35) {
            for (const n of live) {
              if (n.fixed) continue;
              const anchor = anchors.get(anchorOf.get(n));
              if (!anchor) continue;
              n.x += (anchor.x - n.x) * 0.012;
              n.y += (anchor.y - n.y) * 0.012;
            }
          }
        }
        for (const n of live) { n.vx = 0; n.vy = 0; }

        /* Recount without moving anything, and without the padding the solve aims
         * for — `remaining` above is what the final pass *found* before resolving
         * it, and the padding target is comfort rather than correctness. What is
         * returned is therefore the number of pairs that genuinely still collide. */
        let outstanding = 0;
        for (let i = 0; i < live.length; i++) {
          const a = live[i];
          for (let j = i + 1; j < live.length; j++) {
            const b = live[j];
            const ahw = Math.max(a.r, lwOf(a) / 2);
            const bhw = Math.max(b.r, lwOf(b) / 2);
            if ((ahw + bhw) - Math.abs(b.x - a.x) <= 0) continue;
            const aHalfH = a.r + lhOf(a) / 2;
            const bHalfH = b.r + lhOf(b) / 2;
            const dy = (b.y + lhOf(b) / 2) - (a.y + lhOf(a) / 2);
            if ((aHalfH + bHalfH) - Math.abs(dy) > 0) outstanding++;
          }
        }
        return outstanding;
      },

      step() {
        if (alpha < 0.008) return false;
        const live = nodes.filter(active);

        for (const n of live) { n.fx = 0; n.fy = 0; }

        for (let i = 0; i < live.length; i++) {
          const a = live[i];
          for (let j = i + 1; j < live.length; j++) {
            const b = live[j];
            let dx = b.x - a.x, dy = b.y - a.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < 1) { dx = (i - j) * 0.7 + 0.1; dy = 0.3; d2 = dx * dx + dy * dy; }
            const d = Math.sqrt(d2);
            const rep = cfg.repulsion / d2;
            const ux = dx / d, uy = dy / d;
            a.fx -= ux * rep; a.fy -= uy * rep;
            b.fx += ux * rep; b.fy += uy * rep;

            // gentle circle collision; label boxes are handled by declutter()
            const minGap = a.r + b.r + 14;
            if (d < minGap) {
              const push = (minGap - d) * 0.4;
              a.fx -= ux * push; a.fy -= uy * push;
              b.fx += ux * push; b.fy += uy * push;
            }
          }
        }

        for (const e of edges) {
          if (!active(e.a) || !active(e.b)) continue;
          const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          const rest = cfg.springLength + e.a.r + e.b.r - 28;
          const f = (d - rest) * cfg.springStrength * (0.55 + e.w * 0.3);
          const ux = dx / d, uy = dy / d;
          e.a.fx += ux * f; e.a.fy += uy * f;
          e.b.fx -= ux * f; e.b.fy -= uy * f;
        }

        for (const n of live) {
          n.fx -= n.x * cfg.centerPull;
          n.fy -= n.y * cfg.centerPull;
          if (anchorOf) {
            const anchor = anchors.get(anchorOf.get(n));
            if (anchor) {
              n.fx += (anchor.x - n.x) * cfg.anchorPull;
              n.fy += (anchor.y - n.y) * cfg.anchorPull;
            }
          }
        }

        for (const n of live) {
          if (n.fixed) { n.vx = n.vy = 0; continue; }
          n.vx = (n.vx + n.fx * alpha) * cfg.damping;
          n.vy = (n.vy + n.fy * alpha) * cfg.damping;
          const speed = Math.hypot(n.vx, n.vy);
          if (speed > cfg.maxSpeed) {
            n.vx *= cfg.maxSpeed / speed;
            n.vy *= cfg.maxSpeed / speed;
          }
          n.x += n.vx;
          n.y += n.vy;
        }

        alpha *= 0.985;
        return true;
      }
    };

    return api;
  }

  return { create };
})();
