# Data sources

Every value in `pipeline/data/raw` is fetched and cited. Machine-readable provenance
sits next to each dataset (`*.provenance.json`). The one hand-entered dataset is the
climbing crag index, marked editorial in `manifest.json`.

Per-layer sources, cadence and open verification items are in
[ADR 0003](adr/0003-data-sourcing.md). Refresh rules are in
[ADR 0004](adr/0004-refresh-policy.md).

Reproduction commands are added here as each pipeline step lands.

## Verified 2026-09-03

- IBGE malhas and SIDRA aggregates APIs: documented at servicodados.ibge.gov.br.
- AESA legacy volume pages (site2) list 126 reservoirs but stopped updating in 2017. The live system is the SEIRA JSON API: 186 reservoirs, 131 monitored, 181 rain posts. Undocumented and throttled.
- SGB GEOSSIT record pages are public (31 in PB); GeossitWeb export needs a login.
- SGB geologic map and hydrogeology are reachable through the geoportal ArcGIS REST services without a token; shapefile downloads need a login.
- Embrapa GeoInfo serves the 1972 Paraíba exploratory soil map over WFS. ZAPE covers Pernambuco, not Paraíba.
- theCrag API is closed to non-commercial apps and its data is CC BY-NC-SA. Not usable.
- IBGE Censo 2022 published no rent value. Bairro shapefiles exist for João Pessoa (64) and Campina Grande (60).
- SINISA 2024 spreadsheets: 214 PB municípios for water, 74 for sewer.
- OpenBeta: 8 climbs in Brazil. Rejected.
- Guia de Escalada na Paraíba (2023): 440 routes, 36 mountains, 8 municípios, printed only.
