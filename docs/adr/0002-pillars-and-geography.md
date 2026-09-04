# Three pillars (Terra, Água, Gente); município is the atom, mesorregiões aggregate, bairros only for census layers in João Pessoa and Campina Grande

Status: accepted (2026-09-03)

## Context

No single question defines the project. The wanted layers span geology and climbing, water and drought, and living standards. A flat list of twenty toggles is CaliVibe's shape and reads as a dashboard. Every source joins at município level; below that only census tracts exist, and only census data joins to them.

## Decision

- The sidebar is organized in three pillars:
  - Terra: geologia, solos, aquíferos, relevo 3D, picos, geossítios, escalada, mobilidade.
  - Água: açudes, chuvas, clima (temperatura, precipitação, insolação), saneamento.
  - Gente: censo (população, idade, cor/raça, renda, pobreza), moradia (condições e preços), criminalidade, escolas, saúde, economia e conectividade.
- Município (223, IBGE malha 2022, keyed by the 7-digit IBGE code) is the unit for every choropleth and every table row.
- The four mesorregiões (Mata Paraibana, Agreste, Borborema, Sertão) are precomputed aggregates selectable in compare mode: sums for counts, population-weighted means for rates and indices. They also frame the opening view.
- Bairros exist only for João Pessoa and Campina Grande and only for census layers, built from 2022 census tracts aggregated to official bairro polygons. They render when zoomed into either city. Crime, schools, health, economy and water stay municipal.
- Mobilidade (rodovias, the CBTU line and its stations, rodoviárias) sits inside Terra as the physical network rather than as a fourth pillar.

## Consequences

- Every dataset must carry the IBGE município code before it enters the contract.
- Bairro layers need a tract-to-bairro crosswalk; IBGE's 2022 bairro geometry for both cities is a spike item (ADR 0003).
- Compare tables mixing município and mesorregião rows label the aggregation method on the aggregate rows.
