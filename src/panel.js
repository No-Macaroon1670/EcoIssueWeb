/* HTML for the detail panel and the table view. */
window.ECO_PANEL = (function () {

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isNegative = verb => window.ECO.negativeVerbs.includes(verb);

  function swatch(node, ctx) {
    return `<span class="swatch" style="background:${ctx.colourOf(node)}"></span>`;
  }

  function relationList(rows, ctx, direction) {
    if (!rows.length) return `<p class="empty-note">Nothing recorded ${direction === 'out' ? 'downstream' : 'upstream'}.</p>`;
    return `<ul class="rel-list">` + rows.map(({ link, other }) => `
      <li class="${isNegative(link.verb) ? 'neg' : ''}">
        <button class="rel" data-goto="${esc(other.id)}">
          <span class="verb">${esc(link.verb)}</span>
          ${swatch(other, ctx)}<span class="rel-label">${esc(other.label)}</span>
        </button>
        ${link.note ? `<p class="rel-note">${esc(link.note)}</p>` : ''}
      </li>`).join('') + `</ul>`;
  }

  function localeBlock(node, ctx) {
    if (!ctx.profile) {
      return `<section class="block">
        <h3>Where you are</h3>
        <p class="empty-note">Choose a place in the sidebar to see how this issue lands there.</p>
      </section>`;
    }
    const a = window.ECO_LOCALE.forNode(node, ctx.profile);
    const levelText = { high: 'High relevance here', elevated: 'Elevated relevance here', general: 'No specific local flag' }[a.level];

    const reasons = a.exposure.length
      ? `<ul class="reason-list">` + a.exposure.map(e => `
          <li><span class="tag ${e.level === 'high' ? 'tag-high' : ''}">${esc(e.label)}</span> ${esc(e.why)}</li>`).join('') + `</ul>`
      : `<p class="empty-note">None of this issue's exposure rules match ${esc(ctx.profile.name)}. That means the map has no specific flag for it here — not that it is irrelevant.</p>`;

    const drivers = a.drivers.length
      ? `<div class="driver"><h4>Contribution</h4>` + a.drivers.map(d =>
          `<p><span class="tag">${esc(d.label)}</span> ${esc(d.why)}</p>`).join('') + `</div>`
      : '';

    return `<section class="block">
      <h3>In ${esc(ctx.profile.name)}</h3>
      <p class="level level-${a.level}">${levelText}</p>
      ${reasons}
      ${drivers}
      <a class="search-link" href="${esc(window.ECO_LOCALE.orgSearchUrl(node, ctx.profile.name))}"
         target="_blank" rel="noopener noreferrer">
        Search for groups working on this near ${esc(ctx.profile.name)} &rarr;
      </a>
      <p class="caveat">Coarse archetype matching, not a local projection. It compares this issue's exposure rules against
        ${esc(ctx.profile.name)}'s geography and income group — useful for orientation, no substitute for local assessment.</p>
    </section>`;
  }

  function renderNode(node, ctx) {
    const out = ctx.outgoing(node.id);
    const inc = ctx.incoming(node.id);
    const cat = window.ECO.cats[node.cat];

    return `
      <div class="panel-head">
        <div class="chips">
          <span class="chip" style="--chip:${ctx.colourOf(node)}">${esc(cat.label)}</span>
          <span class="chip chip-plain">${esc(ctx.clusterName(node))}</span>
        </div>
        <h2>${esc(node.label)}</h2>
      </div>
      <p class="summary">${esc(node.summary)}</p>

      <section class="block">
        <h3>This affects <span class="count">${out.length}</span></h3>
        ${relationList(out, ctx, 'out')}
      </section>

      <section class="block">
        <h3>Driven by <span class="count">${inc.length}</span></h3>
        ${relationList(inc, ctx, 'in')}
      </section>

      ${node.mitigations.length ? `<section class="block">
        <h3>What actually helps</h3>
        <ul class="mit-list">${node.mitigations.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
      </section>` : ''}

      ${localeBlock(node, ctx)}
    `;
  }

  function renderEmpty(ctx) {
    const cats = Object.entries(window.ECO.cats).map(([key, c]) =>
      `<li><span class="swatch" style="background:${ctx.colourOfCat(key)}"></span>${esc(c.label)}</li>`).join('');
    return `
      <div class="panel-head"><h2>Environmental issue web</h2></div>
      <p class="summary">${ctx.nodeCount} issues, ${ctx.linkCount} directed links. Every arrow carries a verb, so a
        path through the map reads as a sentence: <em>fossil fuel dependence drives greenhouse gas emissions,
        which intensifies the greenhouse effect, which causes global temperature rise</em>.</p>
      <section class="block">
        <h3>Click any circle</h3>
        <p class="body">You get a summary, what it drives, what drives it, and what genuinely helps. Hovering
          isolates a node and its neighbours; dragging pins a node in place and double-clicking releases it.</p>
      </section>
      <section class="block">
        <h3>Reading the arrows</h3>
        <ul class="key-list">
          <li><span class="key-line solid"></span> solid, filled head — one issue <em>drives</em> another</li>
          <li><span class="key-line dashed"></span> dashed, open head — one issue <em>suppresses</em> another</li>
        </ul>
        <p class="body">The dashed ones are mostly tradeoffs rather than good news: air conditioning prevents heat
          deaths <em>and</em> adds warming; industrial agriculture limits hunger <em>and</em> degrades the soil it
          depends on. Those tensions are where the difficult decisions actually live.</p>
      </section>
      <section class="block">
        <h3>Categories</h3>
        <ul class="key-list swatch-list">${cats}</ul>
      </section>`;
  }

  function renderTable(ctx) {
    const nodeRows = window.ECO.nodes.slice()
      .sort((a, b) => a.cat.localeCompare(b.cat) || a.label.localeCompare(b.label))
      .map(n => `<tr>
        <td>${swatch(n, ctx)}<button class="link-btn" data-goto="${esc(n.id)}">${esc(n.label)}</button></td>
        <td>${esc(window.ECO.cats[n.cat].label)}</td>
        <td>${esc(ctx.clusterName(n))}</td>
        <td class="num">${ctx.outgoing(n.id).length}</td>
        <td class="num">${ctx.incoming(n.id).length}</td>
      </tr>`).join('');

    const byId = new Map(window.ECO.nodes.map(n => [n.id, n]));
    const linkRows = window.ECO.links.map(l => `<tr>
        <td>${esc(byId.get(l.source).label)}</td>
        <td class="${isNegative(l.verb) ? 'verb-neg' : 'verb-pos'}">${esc(l.verb)}</td>
        <td>${esc(byId.get(l.target).label)}</td>
        <td class="num">${l.w}</td>
      </tr>`).join('');

    return `
      <div class="panel-head"><h2>Table view</h2></div>
      <p class="summary">The same data without relying on colour or position.</p>
      <section class="block">
        <h3>Issues <span class="count">${window.ECO.nodes.length}</span></h3>
        <div class="table-scroll"><table>
          <thead><tr><th>Issue</th><th>Category</th><th>Cluster</th><th class="num">Affects</th><th class="num">Driven by</th></tr></thead>
          <tbody>${nodeRows}</tbody>
        </table></div>
      </section>
      <section class="block">
        <h3>Links <span class="count">${window.ECO.links.length}</span></h3>
        <div class="table-scroll"><table>
          <thead><tr><th>From</th><th>Verb</th><th>To</th><th class="num">Weight</th></tr></thead>
          <tbody>${linkRows}</tbody>
        </table></div>
      </section>`;
  }

  return { renderNode, renderEmpty, renderTable };
})();
