# Didactic by construction: one layer to start, capped stacking, self-explaining layer cards, templated summaries

Status: accepted (2026-09-03)

## Context

About twenty layers from a dozen agencies. The reader is not assumed to know what IDEB, IDHM, a mesorregião or an açude is. Overload is the failure mode: a map with everything on is a map that says nothing.

## Decision

- First open: 3D terrain, the four mesorregiões outlined, one sentence introducing the coast-to-Sertão axis, and the three pillar tabs. No other layer is on.
- At most one choropleth, one point layer and terrain at once. Selecting a new fill replaces the previous one. Point layers (açudes, escolas, geossítios, escalada) are one type at a time. The legend never shows more than two encodings.
- Every active layer shows a card: o que é, por que importa, fonte e ano, como ler as cores. Plain Portuguese, one paragraph, every acronym expanded at first use. Cards are authored content committed to the repo, written before the layer ships, never generated.
- Per-município summaries are templated from the numbers: rank, percentile, comparison to the state median, one line per pillar. Every sentence traces to a value in the contract. No generated prose.
- Compare mode across municípios and mesorregiões, sortable, color-coded best and worst. Full URL state for layer, metric, month, selection and camera. Favorites in localStorage.

## Consequences

- Layer cards are a content deliverable, about twenty cards, and part of each layer's definition of done.
- "Açudes over chuvas" and "escalada over geologia" remain possible reads; free stacking is not.
- Templates need a state-median and percentile field per metric in the contract, computed by the pipeline.
