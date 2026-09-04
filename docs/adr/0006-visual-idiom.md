# Cordel/xilogravura idiom for the chrome; data encodings stay flat and WCAG AA

Status: accepted (2026-09-03)

## Context

A techy dashboard idiom does not fit the subject. The woodcut chapbook tradition (cordel, xilogravura) is Paraíba's own graphic language. The risk is legibility: texture and heavy strokes fight choropleth ramps and small labels.

## Decision

Four candidates were rendered on real sidebar content (the Geologia card and its seven-era legend) and compared side by side. "Folheto de cordel" was chosen over a restrained woodcut, a modern atlas and a slab-stamp variant.

- Chrome uses the chapbook idiom: paper ground `#f3e8d2` carrying an SVG grain, ink `#17120e`, 3px ink borders, 6px hard drop shadows, pillar tabs with a cut corner, Ultra for display and Spectral for body. One accent per pillar: Terra `#8a4b12`, Água `#1e5f66`, Gente `#9b2f1f`. Applies to headers, pillar tabs, layer lists, layer cards, panels, tooltips and the compare table.
- The grain is chrome-only, applied through a `cordel-papel` class. It never sits under or over a data surface.
- Data encodings (choropleth ramps, point sizes, sparklines, legends, tables) use flat, untextured colors from perceptually ordered ramps. No texture or ornament under or over data.
- Contrast meets WCAG AA: 4.5:1 for body text, 3:1 for large text and UI. Measured on the shipped palette, the weakest pair is Terra on paper at 5.58:1; every other pair is higher, and inverted tabs match their accent's ratio. Every clickable has `cursor: pointer`.
- When idiom and legibility conflict, legibility wins.
- The idiom is piloted on the about page and one pillar header before it is applied everywhere.

## Consequences

- Ultra has one weight and no italic, so it stays on headings and short labels. Spectral carries all running text and supplies the italic used for uncertainty notes.
- Map labels keep the base style's own face rather than Ultra, which is unreadable at label sizes.
- The hard shadow marks the active layer row and every raised panel, so activity is legible without relying on color alone.
