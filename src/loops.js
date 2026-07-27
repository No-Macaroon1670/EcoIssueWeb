/* Feedback loops and causal hierarchy.
 *
 * These two belong together. "Root cause" is only meaningful in a graph without
 * cycles, and this graph is full of them -- greenhouse gases warm the planet, which
 * thaws permafrost, which releases greenhouse gases. So the order is: find the
 * cycles, condense each strongly-connected component to a single super-node, layer
 * the acyclic remainder, and be explicit that nodes inside a loop have no fixed
 * position in the chain.
 *
 * Loop polarity follows the systems-dynamics convention: count the suppressing
 * edges in the cycle. Even (including zero) means each step amplifies the next all
 * the way round -- a REINFORCING loop that runs away. Odd means the loop turns back
 * on itself -- a BALANCING loop that self-corrects.
 */
window.ECO_LOOPS = (function () {

  const isNegative = verb => window.ECO.negativeVerbs.includes(verb);

  /** Tarjan's strongly-connected components, iterative to avoid stack limits. */
  function scc(ids, adj) {
    const index = new Map(), low = new Map(), onStack = new Set();
    const stack = [], comps = [];
    let counter = 0;

    for (const root of ids) {
      if (index.has(root)) continue;
      const work = [[root, 0]];
      while (work.length) {
        const frame = work[work.length - 1];
        const [v, pi] = frame;
        if (pi === 0) {
          index.set(v, counter); low.set(v, counter); counter++;
          stack.push(v); onStack.add(v);
        }
        const edges = adj.get(v) || [];
        if (pi < edges.length) {
          frame[1]++;
          const w = edges[pi].target;
          if (!index.has(w)) work.push([w, 0]);
          else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
        } else {
          if (low.get(v) === index.get(v)) {
            const comp = [];
            let w;
            do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== v);
            comps.push(comp);
          }
          work.pop();
          if (work.length) {
            const parent = work[work.length - 1][0];
            low.set(parent, Math.min(low.get(parent), low.get(v)));
          }
        }
      }
    }
    return comps;
  }

  /* Enumerate simple cycles up to maxLen. Each cycle is emitted once by requiring
   * its lowest-ranked node to be the entry point. The length cap matters: the
   * number of simple cycles grows exponentially, and a 9-step loop is not something
   * a reader can hold in their head anyway. */
  function findCycles(ids, adj, opts) {
    const maxLen = (opts && opts.maxLen) || 6;
    const maxCycles = (opts && opts.maxCycles) || 1200;
    const rank = new Map(ids.map((id, i) => [id, i]));
    const cycles = [];
    let truncated = false;

    for (const start of ids) {
      if (cycles.length >= maxCycles) { truncated = true; break; }
      const startRank = rank.get(start);
      const path = [start];
      const pathLinks = [];
      const onPath = new Set([start]);

      (function walk(v) {
        if (cycles.length >= maxCycles) { truncated = true; return; }
        for (const edge of adj.get(v) || []) {
          const w = edge.target;
          if (w === start) {
            if (path.length >= 2) {
              cycles.push({
                nodes: path.slice(),
                links: pathLinks.concat([edge.link])
              });
            }
            continue;
          }
          if (rank.get(w) < startRank || onPath.has(w)) continue;
          if (path.length >= maxLen) continue;
          path.push(w); pathLinks.push(edge.link); onPath.add(w);
          walk(w);
          path.pop(); pathLinks.pop(); onPath.delete(w);
        }
      })(start);
    }

    cycles.forEach(c => {
      const negatives = c.links.filter(l => isNegative(l.verb)).length;
      c.negatives = negatives;
      c.polarity = negatives % 2 === 0 ? 'reinforcing' : 'balancing';
      c.length = c.nodes.length;
    });
    // shortest first: a 3-step loop is a far stronger claim than a 6-step one
    cycles.sort((a, b) => a.length - b.length);
    return { cycles, truncated };
  }

  /**
   * analyse({nodes, links}) ->
   *   loops         all simple cycles found, shortest first
   *   loopNodes     Map nodeId -> cycle count
   *   loopLinks     Set of "src\ttgt" keys that lie on at least one cycle
   *   cores         multi-node SCCs, i.e. genuinely tangled regions
   *   coreOf        Map nodeId -> core index, for nodes inside a multi-node SCC
   *   tier          Map nodeId -> 'root' | 'mechanism' | 'symptom' | 'loop'
   *   depth         Map nodeId -> longest-path distance from a root (condensed)
   */
  function analyse(nodes, links, opts) {
    const ids = nodes.map(n => n.id);
    const idSet = new Set(ids);
    const adj = new Map(ids.map(id => [id, []]));
    const rev = new Map(ids.map(id => [id, []]));
    for (const link of links) {
      if (!idSet.has(link.source) || !idSet.has(link.target)) continue;
      adj.get(link.source).push({ target: link.target, link });
      rev.get(link.target).push({ target: link.source, link });
    }

    const { cycles, truncated } = findCycles(ids, adj, opts);

    const loopNodes = new Map();
    const loopLinks = new Set();
    for (const c of cycles) {
      c.nodes.forEach(id => loopNodes.set(id, (loopNodes.get(id) || 0) + 1));
      c.links.forEach(l => loopLinks.add(l.source + '\t' + l.target));
    }

    // ── condense, then layer ────────────────────────────────────────────────
    const comps = scc(ids, adj);
    const compOf = new Map();
    comps.forEach((comp, i) => comp.forEach(id => compOf.set(id, i)));
    const cores = comps.filter(c => c.length > 1);
    const coreOf = new Map();
    cores.forEach((comp, i) => comp.forEach(id => coreOf.set(id, i)));

    const cAdj = comps.map(() => new Set());
    const cIn = comps.map(() => new Set());
    for (const link of links) {
      if (!idSet.has(link.source) || !idSet.has(link.target)) continue;
      const a = compOf.get(link.source), b = compOf.get(link.target);
      if (a !== b) { cAdj[a].add(b); cIn[b].add(a); }
    }

    // longest-path depth over the condensation (a DAG by construction)
    const order = [];
    const indeg = cIn.map(s => s.size);
    const queue = indeg.map((d, i) => (d === 0 ? i : -1)).filter(i => i >= 0);
    while (queue.length) {
      const c = queue.shift();
      order.push(c);
      for (const nxt of cAdj[c]) if (--indeg[nxt] === 0) queue.push(nxt);
    }
    const cDepth = comps.map(() => 0);
    for (const c of order) {
      for (const nxt of cAdj[c]) cDepth[nxt] = Math.max(cDepth[nxt], cDepth[c] + 1);
    }

    const tier = new Map(), depth = new Map();
    comps.forEach((comp, i) => {
      const isRoot = cIn[i].size === 0;
      const isLeaf = cAdj[i].size === 0;
      comp.forEach(id => {
        depth.set(id, cDepth[i]);
        tier.set(id, comp.length > 1 ? 'loop'
          : isRoot ? 'root'
          : isLeaf ? 'symptom'
          : 'mechanism');
      });
    });

    return {
      loops: cycles, truncated, loopNodes, loopLinks,
      cores, coreOf, tier, depth,
      maxDepth: Math.max(0, ...cDepth)
    };
  }

  return { analyse, TIERS: ['root', 'mechanism', 'symptom', 'loop'] };
})();
