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
- **Two pruning sliders.** "Strongest links only" keeps the top N% of links; "minimum
  connections" drops nodes below a degree floor, so the keystone structure emerges —
  at a floor of 10 you are left with 15 nodes, led by food insecurity, temperature
  rise, species extinction and greenhouse gas emissions.
- **Local focus.** With a place selected, fade everything that does not feed its
  top-ranked issues.
- **Feedback loops.** 50 of them up to six steps, 40 reinforcing and 10 balancing.
  Turn on highlighting and every issue on a loop gets an outer ring; open an issue
  and each loop is written out as the sentence it is, clickable to trace on the map.
- **Two weight sources.** Link weights can come from my judgement or from three
  months of English Wikipedia reader navigation, and the clustering re-runs against
  whichever is active. See "Whose distances?" below — they disagree a lot.
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

## Loops and hierarchy

These two are one feature, because "root cause" is only meaningful in a graph without
cycles and this graph is full of them. `src/loops.js` therefore does it in the only
order that works: enumerate the cycles, condense each strongly-connected component,
layer the acyclic remainder, and refuse to assign a position to anything still inside
a loop.

**Loop polarity** follows the systems-dynamics convention — count the suppressing
edges in the cycle. Even (including zero) means every step amplifies the next all the
way round: a **reinforcing** loop that runs away. Odd means the loop turns back on
itself: a **balancing** loop that self-corrects. Greenhouse gases → greenhouse effect
→ temperature rise → permafrost thaw → greenhouse gases is reinforcing. Temperature
rise → wildfire → air pollution → *shields* → temperature rise is balancing, and so is
temperature rise ↔ solar geoengineering. Every balancing loop in the map routes
through one of those two suppressing edges, which is worth knowing: this system has
very few brakes.

Cycles are capped at six steps and enumerated once each (canonical entry at the
lowest-ranked node). The cap is not just performance — the count grows exponentially,
and a nine-step loop is not something a reader can hold in their head.

**The causal hierarchy is computed but not currently shown.** `src/loops.js` still
produces it and the notes below still describe it, but the root/mechanism/symptom
colour mode has been withdrawn pending better definitions — the categories were doing
more asserting than the underlying analysis supports. Loops are unaffected, since they
rest on cycle detection rather than on the hierarchy.

Of 79 issues, 13 are root causes,
31 mechanisms, 2 symptoms — and **33 sit inside one 27-node tangle** spanning the
whole climate–water–land system, where cause and effect genuinely cannot be ordered.
Those get grey and a label saying so, not a fabricated rank. The 13 roots are all
upstream human activities (overconsumption, industrial farming, data centres,
overfishing, urban sprawl); the 2 symptoms are terminal human outcomes (heart and lung
disease, climate anxiety). Levers are excluded from the analysis entirely — including
them would make every intervention an in-degree-zero "root cause", which is exactly
backwards.

**Cluster naming** uses each cluster's most *internally* connected member rather than
its highest-degree one. Global degree names a cluster after whichever hub landed in it
— food insecurity has 31 links and would title anything it joined — while internal
degree picks the node whose connections actually sit inside the group. Only the colour
runs out at six hues; every cluster is named, greys included.

## Whose distances? (the weight sources)

The original weights were mine: a 1–3 judgement per link about how tightly two issues
are discussed together. `tools/clickstream.py` adds a second, independent source —
**English Wikipedia reader navigation** for 2026-04 through 2026-06. If someone reading
*Permafrost* clicks through to *Atmospheric methane*, that is a revealed adjacency in a
real person's head rather than an asserted one. Two signals per pair: direct clicks
between the articles, and cosine similarity of their reader *neighbourhoods* (the
articles people arrive from and leave to), log-damped so a few enormous pages don't
dominate every vector.

**They disagree, and that is the finding.** Correlation between the two weightings is
only **r = 0.34** on the 300 links where readers supply a signal. Louvain over reader
weights returns 7 communities at modularity 0.51, against 8 at 0.41 for mine, and the
partitions match at **ARI 0.36** — well above chance, nowhere near the same map.

That is not an artifact of sparsity. Reader weights zero out 88 links that nobody
navigates, which mechanically raises modularity, so the pipeline was re-run keeping my
weights for those 88 and reweighting only the 300 measured links: **Q = 0.50, ARI =
0.30**. The divergence survives the control, so it comes from the reweighting itself.

Where they part company is legible:

- **Light and noise pollution** leave the pollution cluster and join biodiversity —
  readers meet them as ecological problems, not as chemical ones.
- **Data centres** group with mining, e-waste and materials rather than with emissions.
- **Air quality** breaks out as its own tight cluster (PM2.5, ozone, respiratory
  disease, household air) instead of sitting inside the climate story.
- **Water scarcity** merges with agriculture and soil rather than with displacement.
- Readers barely connect things I scored 3: *overconsumption → plastic waste* and
  *PFAS → unsafe water* record no navigation at all, while *temperature rise →
  wildfire* draws 615 clicks against my 2.

**Known limits.** The dump only includes links clicked more than ten times a month, so
niche articles are under-covered — stacking three months cut the no-signal links from
151 to 88, and more months would cut it further. 22 of 102 nodes map to a *broad* or
*proxy* article rather than an exact one, and one (clean-tech end-of-life waste) has no
usable article at all and keeps my weights. Wikipedia readers are not the public.
Graph geometry deliberately does **not** change with the source, so switching is a
clean A/B on colour and clustering alone.

Regenerate with `python tools/clickstream.py fetch && ... extract && ... build`. The
484 MB dumps are gitignored; the derived weights are committed.

**Clustering runs on link structure, and the default weights are editorial.** Each link
has a weight from 1 to 3 estimating how tightly the two issues are discussed together.
That is a hand-assigned judgement, *not* a measured co-mention count from a corpus. The
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

## Honest limits

- **The locale model is coarse by construction.** A country gets physical-geography
  flags plus a World-Bank-style income group; issues declare which flags raise
  exposure. Every line of output traces to one flag and one rule, which makes it
  transparent but crude — a single national profile fits a large, varied country
  badly. A few subnational entries are included and you can build a custom profile.
  Ties are broken by how *distinctive* a matching flag is (almost every big place is a
  `megacity`, so matching on it says little), which is why the Great Lakes list leads
  with dead zones and invasives rather than whatever sorts first alphabetically.
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
| `data/weights-clickstream.js` | **generated** — reader-navigation weights + the article mapping |
| `tools/wiki_titles.py` | node → Wikipedia article mapping, with a live validator |
| `tools/clickstream.py` | fetch / extract / build the reader-navigation weights |
| `data/regions.js` | ~120 place profiles and the geography-flag vocabulary |
| `src/cluster.js` | Louvain community detection + modularity |
| `src/loops.js` | cycle enumeration, SCC condensation, causal-role layering |
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
