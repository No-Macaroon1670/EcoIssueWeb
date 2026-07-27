# Environmental issue web

An interactive relationship map of 79 environmental issues, 23 solution levers and
394 directed links. Every arrow carries a verb, so a path reads as a sentence:
*fossil fuel dependence **drives** greenhouse gas emissions, which **intensifies**
the greenhouse effect, which **causes** global temperature rise, which **thaws**
permafrost*.

**Live:** <https://no-macaroon1670.github.io/EcoIssueWeb/>

## Running it locally

No build step, no dependencies, no network calls — plain scripts and a canvas. Any
static file server will do:

```bash
python -m http.server 4186
```

Then open <http://localhost:4186>. Opening `index.html` directly off the filesystem
also works.

## What's in it

- **Six categories**, colour-coded: climate & atmosphere, pollution & toxics, water &
  oceans, biodiversity & ecosystems, land/soil/food, people & health.
- **Verb-labelled arrows.** Solid with a filled head = one issue drives another.
  Dashed with an open chevron = one issue *suppresses* another. The dashed ones are
  mostly tradeoffs rather than good news — air conditioning prevents heat deaths and
  adds warming; industrial agriculture limits hunger and degrades the soil it depends
  on; cleaning up sulphate aerosols improves health and unmasks warming. Those
  tensions are the most interesting thing on the map.
- **Click any circle** for a summary, what it drives, what drives it, and what
  genuinely helps. Relation rows are clickable, so you can walk a causal chain.
- **A solutions layer**, off by default. 23 levers drawn as hollow rings in the
  colour of the domain they act on. They mostly emit dashed suppressing arrows, and
  several also emit an ordinary solid one, because most real levers charge for
  themselves somewhere: renewables need mined metal, nuclear makes waste, carbon
  pricing lands on the people least able to absorb it. Levers also depend on each
  other — electrification *requires* renewables, since electrifying onto a coal-heavy
  grid relocates emissions rather than removing them.
- **Search that knows synonyms.** "carbon dioxide", "CO2" and "N2O" all find
  greenhouse gas emissions; "hurricane" finds tropical cyclones; "heat pump" finds
  electrification even while the solutions layer is off. Roughly 600 keywords across
  the nodes, and the result row shows which term matched.
- **Detected clusters.** Louvain community detection on the undirected weighted
  projection, colourable as an alternative to categories. It runs over issues only,
  so the communities do not shift when the solutions layer is toggled; each lever
  inherits the cluster of whatever it acts on most heavily.
- **Locale assessment.** Pick a place (or describe your own area) to see which issues
  are most relevant there and why, plus a search link for local organisations.
- **Table view** for the same data without colour or position, and a keyboard path
  (`/` to search, `Esc` to deselect).

## Design decisions worth knowing

**The palette is computed, not chosen.** A node-link graph puts any category beside
any other, so the six hues were validated on the *all-pairs* pairlist (not the easier
adjacent-pairs one) with the dataviz skill's `validate_palette.js`. Both modes pass
every gate: worst CVD ΔE 11.8 light / 10.5 dark against an 8.0 target, worst
normal-vision ΔE 21.5 / 15.8 against a 15.0 hard floor, and all six clear 3:1 contrast
against their surface. The hexes live in one place, `data/schema.js` — **changing any
of them invalidates that run, so re-validate before shipping a new colour.** Six is
not an arbitrary number: at these constraints seven hues only pass if you accept neon
chroma, which looks alarming in a graph.

**Clustering runs on link structure, and the weights are editorial.** Each link has a
weight from 1 to 3 estimating how tightly the two issues are discussed together. That
is a hand-assigned judgement, *not* a measured co-mention count from a corpus. The
clusters it produces (modularity ≈ 0.41) are substantive and cut across the
categories — a carbon core, a heat-and-air-quality-to-health cluster, an
agriculture-and-soil cluster, a waste-and-toxics-to-injustice cluster, a
water-scarcity-to-displacement cluster, and a habitat cluster — but they reflect the
weights, so treat them as a reading of this dataset rather than a finding about the
literature. Swapping in real co-occurrence counts would make the result meaningful in
a stronger sense, and nothing else would have to change.

**Labels drove the layout, not the other way round.** Two things had to be solved:

1. *Label collisions cannot be fixed with forces.* Label boxes are wide, so a node
   gets large competing pushes from many neighbours, hits the speed clamp, and freezes
   mid-jitter. `layout.declutter()` instead moves positions directly by a share of
   each overlap — a position-based projection pass — which converges in a few hundred
   iterations. A weak pull back toward each group's anchor keeps it from unravelling
   the structure.
2. *Label type is a fixed 11.5px on screen while the layout reserves space in world
   units.* Those only agree at one zoom, so the layout **commits** to the zoom the
   map opens at and reserves for exactly that. Chasing the fit scale in a feedback
   loop diverges instead of converging: inflating the reserved boxes grows the world,
   which lowers the fit scale, which demands more inflation.

That commitment gives the map two modes. Below 85 visible nodes it opens at 0.8 with
**every** label placed and guaranteed collision-free. Above 85 — which is what turning
on the solutions layer does — reserving a full label box per node would grow the world
until the whole graph shrank to a third of usable size, so it reserves only the labels
drawn at overview, opens at 0.75, and the rest appear past 1.9× where circle spacing is
wide enough to hold them. Label budget is allocated *per group*, not globally: ranking
all nodes by degree leaves the levers unnamed, because a lever has far fewer links than
a hub issue like global temperature rise.

The group anchors are sized to their contents rather than a fixed radius, so adjacent
groups sit about one group-diameter apart — and the ring sizing and the declutter pass
share one label policy, or the groups get laid out too tight to ever separate. The
anchor pull-back inside declutter also tapers off after the first third of the passes;
left running to the end it exactly cancels the separation and the solve stalls with
overlaps outstanding.

**268 links over 73 nodes is a hairball at full strength**, so the resting edge state
is deliberately faint and interaction supplies the detail: hovering isolates a node
and its neighbours, and the "Show links" control drops to the closer-coupled subsets.

## Honest limits

- **The locale model is coarse by construction.** A country gets physical-geography
  flags plus a World-Bank-style income group; issues declare which flags raise
  exposure. Every line of output traces to one flag and one rule, which makes it
  transparent but crude — a single national profile fits a large, varied country
  badly. A few subnational entries are included and you can build a custom profile.
- **Income-group contribution is a generalisation, not a footprint.** "Upper-middle
  income" covers both China and Maldives; the sidebar says so where it matters.
- **Nothing leaves the machine.** The "find local organisations" button is an ordinary
  link to a Google search that opens only when you click it.
- **The newer topics are argued, not settled.** Data centres, solar geoengineering,
  offset integrity, nuclear waste, clean-tech waste and deep-sea mining are all live
  disputes, and the summaries try to state the strongest version of each side rather
  than pick a winner — including where an argument is usually made in bad faith, as
  with clean-tech waste being compared against nothing rather than against coal.
- **Quantities are stated loosely on purpose** ("millions of premature deaths a year",
  "roughly a third") where the precise figure is contested or revised often, and the
  genuinely uncertain items say so — insect-decline magnitude and AMOC weakening both
  carry explicit uncertainty language rather than a confident number.

## Files

| Path | What it holds |
|---|---|
| `data/schema.js` | registry, category definitions, **the validated palette** |
| `data/nodes-a.js` | climate, pollution, water issues |
| `data/nodes-b.js` | biodiversity, land, people issues |
| `data/nodes-c.js` | newer contested topics (data centres, geoengineering, deep-sea mining…) |
| `data/solutions.js` | the 23 solution levers |
| `data/links.js` | the core directed, verb-labelled links |
| `data/links-c.js` | links for the newer issues and the whole solutions layer |
| `data/keywords.js` | search synonyms — chemicals, place names, plain-language terms |
| `data/regions.js` | ~120 place profiles and the geography-flag vocabulary |
| `src/cluster.js` | Louvain community detection + modularity |
| `src/layout.js` | force simulation and the declutter projection pass |
| `src/graph.js` | canvas renderer and pointer interaction |
| `src/locale.js` | the locale rules engine |
| `src/panel.js` | detail-panel and table-view markup |
| `src/app.js` | state, controls, label measurement, animation loop |

## Possible next steps

- Replace the editorial link weights with measured co-occurrence from a real corpus,
  which would turn the clustering into an actual finding.
- Add citations per node, so each summary is traceable.
- Let people save a walked path ("show me how mining reaches food insecurity") as a
  shareable trail.
- Per-issue local data where an open API exists — air quality and flood-zone lookups
  are the two most tractable.
