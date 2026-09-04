# Atlas da Paraíba

An interactive atlas of the 223 municípios of Paraíba, Brazil, read through
three pillars: **Terra** (rock, soil, relief and what was built on them),
**Água** (rain, reservoirs and sanitation) and **Gente** (who lives here, and
what school, health and the economy show).

Modelled on [CaliVibe](https://github.com/trekhleb/cali-vibe), but the layers
that matter here are different. California asks about housing cost. Paraíba
asks whether there is water.

## What it shows

Thirty-two layers, each with a card in plain Portuguese saying what it is, why
it matters, how to read its colors, and where it came from.

A few that carry the state's story:

- **Domínio hidrogeológico.** Fractured crystalline rock covers 86% of the
  state's area and holds water only in its cracks, so a well there depends on
  hitting a fracture. That single fact explains why the interior is supplied by
  reservoir and pipeline rather than by groundwater.
- **Açudes.** 131 reservoirs sized by capacity and colored by how full they are,
  with a monthly series behind each one. The state currently sits near half its
  capacity, and the Sertão reads orange while the coast reads teal.
- **Solos.** The only statewide soil survey is Embrapa's from 1972, whose codes
  predate the current Brazilian classification. Every class carries its modern
  name, the original legend, and a sentence about what that soil is like to
  stand on. The two classes that cannot be correlated say so.
- **IDEB.** The median score falls from 5.2 in the early school years to 4.3 in
  the later ones, and 209 of the 217 municípios scored in both bands get worse.
  The drop inside a município is usually larger than the gap between neighbours.

## How it is built

A Python pipeline fetches every source, writes a provenance sidecar beside each
raw file, and emits GeoJSON and per-metric JSON plus a `manifest.json` that
carries the source, URL, year and row count for every layer. The React app only
renders what it was given: it never joins, aggregates or fetches from an agency.

```
pipeline/   uv, geopandas, pandas, h3   ->  app/public/data/
app/        React, TypeScript, Vite, MapLibre GL, Tailwind
docs/adr/   the decisions, and why
```

Reproducing the dataset:

```
cd pipeline && uv sync
uv run atlas              # every step in dependency order
uv run atlas geologia     # or one at a time
```

Running the app:

```
cd app && pnpm install && pnpm dev
```

## What it does not show, and why

Every gap here was checked with live requests. The evidence is in
[docs/SOURCES.md](docs/SOURCES.md) so the dead ends stay dead.

- The 2022 census published no rent value, so housing appears by tenure rather
  than price.
- The national school census publishes no school coordinates at all, so school
  points come from OpenStreetMap and are uneven: 71 municípios have none.
- The federal police occurrence portal is offline, so violence is measured from
  the mortality registry, which at município level is more reliable anyway.
- The state water agency gates reservoir volumes and rainfall readings behind
  authentication. Volumes come from the national agency instead; rainfall
  readings have no public source, so that layer shows where measurement
  happens, not how much fell.

Where a município has no data, the map hatches it and says "sem dados". Nothing
is interpolated to fill a hole.

## Design

The chrome follows the *cordel* chapbook idiom of the Brazilian Northeast:
grained paper, heavy ink borders, hard shadows, woodcut display type. That
stays on the chrome. Data surfaces are flat and every text pair clears WCAG AA,
because a texture under a choropleth is a lie about the data.

Decisions and their reasoning are in [docs/adr](docs/adr).

---

*For informational purposes. Data may be incomplete or out of date, and every
layer states the year of its source.*
