# Data sources

Every file under `pipeline/data/raw` is fetched and cited, with a
`*.provenance.json` sidecar recording the URL, the fetch time and the license.
Raw files are gitignored; the emitted contract under `app/public/data` is
committed, and `manifest.json` carries the source, URL, year and row count for
every layer the app can render.

The one hand-entered dataset is the climbing crag index, marked `editorial` in
the manifest.

## Reproducing

```
cd pipeline
uv sync
uv run atlas                 # every step, in dependency order
uv run atlas boundaries      # or one step at a time
uv run atlas geologia solos  # or several
```

`boundaries` must run first: it writes the município index that every metric
step reads to compute mesorregião aggregates.

Steps are idempotent. Anything already in `pipeline/data/raw` is reused rather
than refetched, so a rerun costs no network calls. Delete a raw file to force a
refresh of that source.

## Per-layer sources

| Step | Layer | Source | Year |
| --- | --- | --- | --- |
| `boundaries` | Municípios, mesorregiões | IBGE malhas territoriais and localidades API | 2022 |
| `geologia` | Geologia | SGB, litoestratigrafia 1:1.000.000, ArcGIS REST | 2004 |
| `solos` | Solos | Embrapa, mapa exploratório de solos da Paraíba 1:500.000, WFS | 1972 |
| `aquiferos` | Aquíferos | SGB, Mapa Hidrogeológico da Paraíba, ArcGIS REST | fetch year |
| `geossitios` | Geossítios | SGB GEOSSIT, public record pages | fetch year |
| `picos` | Picos e serras | OpenStreetMap via Overpass | fetch year |
| `escalada` | Escalada | Editorial index; names from the Guia de Escalada na Paraíba, coordinates from escaladas.com.br and OSM | 2023 |
| `acudes` | Açudes | Register from AESA SEIRA API `/reservatorio`; volumes and history from ANA SAR | 2013 to date |
| `chuvas` | Postos de chuva | AESA SEIRA API, `/posto-sudene` | fetch year |
| `clima` | Clima | Open-Meteo historical archive (ERA5) on an H3 grid | 2014-2023 |
| `saneamento` | Rede de água, rede de esgoto | SINISA 2024, Ministério das Cidades | 2024 |
| `populacao` | População | IBGE Censo 2022, SIDRA 4709 | 2022 |
| `renda` | Renda per capita | IBGE Censo 2022, SIDRA 10295 | 2022 |
| `moradores` | Moradores por domicílio | IBGE Censo 2022, SIDRA 9922 | 2022 |
| `idade` | Idade mediana, envelhecimento | IBGE Censo 2022, SIDRA 9756 | 2022 |

Full sourcing rationale, including sources that were evaluated and rejected,
is in [ADR 0003](adr/0003-data-sourcing.md). Refresh rules are in
[ADR 0004](adr/0004-refresh-policy.md).

## Known gaps

These are recorded here so nobody re-investigates them. Each was checked with
live requests.

- **AESA's own volume endpoints.** SEIRA returns 401 on every volume and
  history path for anonymous requests (`/periodos`, `/periodo`,
  `/monitoramento`, `/volume`, `/estacao`), and the public table it replaced
  stopped updating in 2017. Volumes come from ANA's SAR instead, so this is a
  closed dead end rather than a gap in the atlas.
- **SAR access paths that do not work**, so nobody retries them: `/sar0/Nordeste`
  renders client-side and its `Nordeste/CarregaMapa` POST returns 500 without
  session state, `/sar0/Medicao/ExportarExcel` returns 500, and dados.gov.br's
  API returns 401. There is no bulk query, so the fetch is one request per
  reservoir.
- **Rainfall readings.** Same API, same restriction. The layer shows where
  measurement happens, not how much fell.
- **Rent and property prices.** The 2022 census published no rent value; none of
  its 1,388 aggregates mentions `aluguel`. Housing rests on census conditions,
  plus a price index that covers João Pessoa alone.
- **Climbing routes.** theCrag's API is closed to non-commercial applications
  and its data is CC BY-NC-SA. OpenBeta lists 8 climbs in all of Brazil, and
  OpenStreetMap has 4 unnamed climbing features in the state. Route counts wait
  on the printed guide.
- **Three crags without coordinates.** Pedra do Cordeiro, Almas Gêmeas and
  Pedra das Chaminés are named by the guide's authors but have no published
  coordinate in OSM, Nominatim, Wikidata or escaladas.com.br. They ship without
  geometry rather than with a guessed point.
- **Two soil classes without a confirmed modern name.** PE and SM cannot be
  correlated to SiBCS from the 1972 legend alone. Both say so in the legend.
- **Open-Meteo quota.** The climate step makes one request per H3 cell across
  ten years and five variables, and the hourly cap allows roughly 39 cells per
  window. It resumes from cache, so it needs several windows on a cold start.
