# Static atlas: React + MapLibre client, Python pipeline, one JSON contract, no backend

Status: accepted (2026-09-03)

## Context

The atlas shows about twenty layers for the 223 municípios of Paraíba, sourced from a dozen Brazilian agencies. Every source except reservoir volumes and rainfall changes on a yearly or slower cycle. Nothing needs per-user state on a server. Hosting cost should be zero and the dataset must be reproducible from commands.

## Decision

- App: React, TypeScript, Vite, MapLibre GL JS, Tailwind. Deployed to GitHub Pages. Interface in pt-BR only.
- Pipeline: Python (geopandas, pandas, h3) under `pipeline/`. It reads shapefiles, CSVs and API responses and writes GeoJSON/JSON to `app/public/data/`, plus a `manifest.json` listing every layer's source, year, row count and generation timestamp.
- The app renders what the pipeline emitted. No joins, aggregation or scraping happen in the browser. Mesorregião aggregates, ranks and percentiles are precomputed.
- Provenance: every raw file under `pipeline/data/raw` has a sibling `*.provenance.json` (URL, fetched-at, license). Nothing is hand-typed except the climbing crag index, which is marked editorial in the manifest.
- No backend. Favorites live in localStorage. Cross-device favorites and community-submitted crags or corrections were considered and deferred; either would be the first reason to add a server.
- Large polygon layers (geology, soils, aquifers) are simplified in the pipeline. If a layer still exceeds a few MB, it ships as PMTiles served from the same static host rather than as GeoJSON.

Rejected: Phoenix LiveView (a server for a site with no server-side work, and every map interaction would cross a socket), a TypeScript pipeline (shapefile dissolve and simplify tooling is weaker than GDAL/geopandas), client-side fetches of AESA pages (CORS, no history, breaks when the site changes).

## Consequences

- Two languages in the repo, one data contract between them. The manifest is the contract.
- Reproducing the dataset is a fixed set of pipeline commands documented in `docs/SOURCES.md`.
- Refresh of the two live layers is handled by CI, see ADR 0004.
