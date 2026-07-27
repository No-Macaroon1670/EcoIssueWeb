/* Louvain community detection.
 *
 * The graph is directed, but influence between two issues makes them "discussed
 * together" regardless of which way the arrow points, so clustering runs on the
 * undirected weighted projection (weights summed over both directions).
 *
 * Returns { of: {nodeId: communityIndex}, count, modularity, sizes }.
 * Communities are renumbered largest-first so colour assignment is stable.
 */
window.ECO_CLUSTER = (function () {

  function project(nodeIds, links) {
    const index = new Map(nodeIds.map((id, i) => [id, i]));
    const adj = nodeIds.map(() => new Map());
    for (const link of links) {
      const a = index.get(link.source), b = index.get(link.target);
      if (a === undefined || b === undefined || a === b) continue;
      adj[a].set(b, (adj[a].get(b) || 0) + link.w);
      adj[b].set(a, (adj[b].get(a) || 0) + link.w);
    }
    return { index, adj };
  }

  /** One Louvain level: greedy local moving until no single move improves Q. */
  function localMoving(adj, selfLoop, resolution) {
    const n = adj.length;
    const k = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let sum = 2 * selfLoop[i];
      adj[i].forEach(w => { sum += w; });
      k[i] = sum;
    }
    let m2 = 0;
    for (let i = 0; i < n; i++) m2 += k[i];
    const comm = new Int32Array(n);
    for (let i = 0; i < n; i++) comm[i] = i;
    if (m2 === 0) return { comm, moved: false };

    const commTot = Float64Array.from(k);
    let anyMove = false, moved = true, pass = 0;

    while (moved && pass < 60) {
      moved = false; pass++;
      for (let i = 0; i < n; i++) {
        const from = comm[i];
        const wTo = new Map();
        adj[i].forEach((w, j) => {
          const c = comm[j];
          wTo.set(c, (wTo.get(c) || 0) + w);
        });

        commTot[from] -= k[i];                       // pull i out of its community
        let bestC = from;
        let bestGain = (wTo.get(from) || 0) - resolution * commTot[from] * k[i] / m2;
        wTo.forEach((w, c) => {
          if (c === from) return;
          const gain = w - resolution * commTot[c] * k[i] / m2;
          if (gain > bestGain + 1e-12) { bestGain = gain; bestC = c; }
        });
        commTot[bestC] += k[i];                      // and put it back somewhere
        comm[i] = bestC;
        if (bestC !== from) { moved = true; anyMove = true; }
      }
    }
    return { comm, moved: anyMove };
  }

  /** Collapse each community into a single super-node. */
  function aggregate(adj, selfLoop, comm) {
    const remap = new Map();
    for (let i = 0; i < comm.length; i++) {
      if (!remap.has(comm[i])) remap.set(comm[i], remap.size);
    }
    const size = remap.size;
    const newAdj = Array.from({ length: size }, () => new Map());
    const newSelf = new Float64Array(size);

    for (let i = 0; i < comm.length; i++) {
      const ci = remap.get(comm[i]);
      newSelf[ci] += selfLoop[i];
      adj[i].forEach((w, j) => {
        const cj = remap.get(comm[j]);
        if (ci === cj) newSelf[ci] += w / 2;         // each internal edge seen twice
        else newAdj[ci].set(cj, (newAdj[ci].get(cj) || 0) + w);
      });
    }
    return { adj: newAdj, selfLoop: newSelf, remap };
  }

  function modularity(adj, membership, resolution) {
    const n = adj.length;
    const k = new Float64Array(n);
    for (let i = 0; i < n; i++) adj[i].forEach(w => { k[i] += w; });
    let m2 = 0;
    for (let i = 0; i < n; i++) m2 += k[i];
    if (m2 === 0) return 0;

    const inside = new Map(), total = new Map();
    for (let i = 0; i < n; i++) {
      const c = membership[i];
      total.set(c, (total.get(c) || 0) + k[i]);
      adj[i].forEach((w, j) => {
        if (membership[j] === c) inside.set(c, (inside.get(c) || 0) + w);
      });
    }
    let q = 0;
    total.forEach((tot, c) => {
      q += (inside.get(c) || 0) / m2 - resolution * (tot / m2) ** 2;
    });
    return q;
  }

  function run(nodeIds, links, resolution) {
    resolution = resolution == null ? 1 : resolution;
    const { index, adj: baseAdj } = project(nodeIds, links);

    // membership[i] tracks the original node i through every aggregation level
    let membership = new Int32Array(nodeIds.length);
    for (let i = 0; i < nodeIds.length; i++) membership[i] = i;

    let adj = baseAdj;
    let selfLoop = new Float64Array(nodeIds.length);

    for (let level = 0; level < 12; level++) {
      const { comm, moved } = localMoving(adj, selfLoop, resolution);
      const agg = aggregate(adj, selfLoop, comm);
      for (let i = 0; i < membership.length; i++) {
        membership[i] = agg.remap.get(comm[membership[i]]);
      }
      if (!moved || agg.adj.length === adj.length) break;
      adj = agg.adj;
      selfLoop = agg.selfLoop;
    }

    // renumber largest community first
    const counts = new Map();
    for (const c of membership) counts.set(c, (counts.get(c) || 0) + 1);
    const order = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    const rank = new Map(order.map(([c], i) => [c, i]));

    const of = {};
    nodeIds.forEach((id, i) => { of[id] = rank.get(membership[i]); });

    const finalMembership = nodeIds.map(id => of[id]);
    return {
      of,
      count: order.length,
      sizes: order.map(([, n]) => n),
      modularity: modularity(baseAdj, finalMembership, resolution)
    };
  }

  return { run };
})();
