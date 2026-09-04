# Official open sources per layer; theCrag for climbing until the guide index exists; census housing conditions plus verified rent, no scraping

Status: accepted (2026-09-03)

## Context

CaliVibe's layers map onto Brazilian agencies for everything except housing prices and transit. Paraíba adds water (AESA monitors 126 reservoirs and a rain-gauge network) and geology (SGB publishes the state geologic map and a scored geosite inventory). Climbing data is thin: theCrag has a Paraíba area, OpenBeta lists 8 climbs for all of Brazil, and the only complete source is the printed Guia de Escalada na Paraíba (Timotheo and Falcão, 2023: 440 routes, 36 mountains, 8 municípios), with no online database.

## Decision

Only official or openly licensed sources. Each layer records its source and year in the manifest. A layer whose source cannot be confirmed ships as absent, never approximated.

Terra

| Layer | Source | Cadence |
| --- | --- | --- |
| Município and mesorregião boundaries | IBGE malhas API (2022) | frozen |
| Bairros JP and CG | IBGE Censo 2022 bairro shapefile for PB (257 bairros; João Pessoa 64, Campina Grande 60) and census tracts carrying CD_BAIRRO, so the crosswalk is built in | frozen |
| Geologia | SGB (Serviço Geológico do Brasil) lithostratigraphy 1:1.000.000 via the geoportal ArcGIS REST query (GeoJSON, fields SIGLA, NOME, LITOTIPOS, ERA, IDADE). GeoSGB shapefile downloads sit behind a login and have no static URL | frozen |
| Solos | Embrapa GeoInfo, mapa exploratório de reconhecimento de solos da Paraíba (1:500.000, 1972, 320 polygons) via WFS GeoJSON. ZAPE is Pernambuco's zoning and does not cover Paraíba | frozen |
| Aquíferos | SGB ArcGIS REST: Mapa Hidrogeológico da Paraíba service (524 aquifer polygons, domínio hidrolitológico, well density) and SIAGAS wells (19,548 in PB, paginated query) | frozen |
| Geossítios | SGB GEOSSIT public record pages (31 PB geosites: Sousa 11, Cabaceiras 7, Boa Vista 5, others 8), parsed at one request per second: name, coordinates, lithology, scientific/educational/tourist scores, fragility. GeossitWeb export requires a login | frozen |
| Picos | OpenStreetMap natural=peak via Overpass, elevation checked against terrain tiles | frozen |
| Relevo 3D | AWS Terrain Tiles (Terrarium) for MapLibre terrain and hillshade | tiles |
| Escalada | Hand-entered crag index, marked editorial: the 8 crags named publicly by the guide's authors, geocoded against the município polygons and rejected if a coordinate falls outside its município. Route counts, styles and grades stay empty until they are read off the printed guide. theCrag rejected after a live check: its API is closed to non-commercial applications (a key requires a signed agreement) and its data is CC BY-NC-SA. OpenStreetMap rejected: 4 unnamed climbing features in the whole state | editorial |
| Mobilidade | OpenStreetMap via Overpass: federal and state highways (BR-230, BR-101, BR-104, BR-361, BR-412, PB roads), the CBTU João Pessoa to Cabedelo line and stations, bus terminals | frozen |

Água

| Layer | Source | Cadence |
| --- | --- | --- |
| Açudes | Two sources joined. AESA's SEIRA JSON API gives the register: 186 reservoirs, 131 monitored, with coordinates and IBGE município code. ANA's SAR (Sistema de Acompanhamento de Reservatórios, www.ana.gov.br/sar0/Medicao) gives the volumes: 126 Paraíba reservoirs, daily readings from 2013 to today, capacity, cota, volume in hm3 and percent full, over plain GET with no auth | weekly |
| Chuvas | AESA SEIRA API: 181 SUDENE rain posts with coordinates and a pluviometria query per post and date range | weekly |
| Clima | Open-Meteo (ERA5) monthly temperature, precipitation and sunshine duration on an H3 grid, 10-year normals. NSRDB is US-only and does not apply | frozen |
| Saneamento | SINISA 2024 (national sanitation information system, Ministério das Cidades) municipal spreadsheets: water indicators for 214 PB municípios, sewer indicators for 74 | frozen |

Gente

| Layer | Source | Cadence |
| --- | --- | --- |
| Censo | IBGE Censo 2022 via SIDRA aggregates API: population (4709), age groups (9514), cor/raça (9605), mean household income per capita (10295), tenure (9929), residents per household (9922), internet (9936). Water and sewer are not in any município-level census table and come from SINISA | frozen |
| Pobreza | CadÚnico (Ministério do Desenvolvimento Social): families below the poverty line per município | frozen |
| Preços de moradia | FipeZap price per m² for João Pessoa as a time series. Censo 2022 published no rent value (none of the 1,388 census aggregates carries aluguel). No listing scraping | frozen |
| Criminalidade | Homicide rate from SIM (Sistema de Informações sobre Mortalidade) read directly from DataSUS TabNet, external-causes table, CID-10 group X85-Y09. SINESP dropped: dados.mj.gov.br refuses connections on every path including its CKAN API, and the dados.gov.br mirror serves an empty shell. Atlas da Violência dropped as intermediary: IPEA's API returns 404 on every path | frozen |
| Escolas | IDEB per município, anos iniciais and anos finais of the rede pública, from INEP. School points from OpenStreetMap via Overpass, because the Censo Escolar microdata carries no coordinate column at all and INEP's catálogo de escolas and geolocalização paths both 404 | frozen |
| Saúde | DataSUS CNES establishments per 10k inhabitants; SIM/SINASC infant mortality | frozen |
| Economia e conectividade | IBGE PIB dos Municípios; Anatel broadband and mobile coverage; IDHM (Atlas Brasil) | frozen |

Climbing: the crag index is metadata only (name, município, coordinates, route count, styles, grade range, link to the guide), no route topos. Every coordinate records which source produced it and at what precision, and a crag that cannot be placed ships without geometry rather than with a guessed point. OpenBeta rejected for coverage (8 climbs in all of Brazil).

Soils: the 1972 legend predates SiBCS, the Brazilian soil classification system adopted in 1999, so every class carries its modern name, the original legend string and a plain-Portuguese explanation. The correlation is sourced to the SiBCS 5th edition rather than inferred. Two of 22 classes cannot be correlated from the legend alone and are marked unconfirmed with the reason shown in the legend.

Schools: the point layer changed source mid-build. This ADR originally assumed Censo Escolar carried coordinates; it does not, in any year checked. OpenStreetMap is the only reachable source, and it is contributor-driven rather than a census, so coverage is uneven and denser in the two big cities. The layer says so, and absence of a point is not evidence of absence of a school.

Aquifer productivity: the SGB service stores a class code, not a flow rate. The bands come from CPRM's Manual de Cartografia Hidrogeológica. Paraíba uses only classes 3 to 6, and 96% of the state's area sits below 10 m3/h.

Housing: CaliVibe's median home value has no official equivalent outside João Pessoa. Census housing conditions carry the layer statewide; FipeZap adds price for the one city with an official series.

## Consequences

- Spikes run 2026-09-03 with live calls settled the open items: rent is absent from the census, bairro geometry exists, theCrag is closed, SIAGAS and the geologic map are reachable through ArcGIS REST, AESA has a JSON API.
- SEIRA supplies the register, ANA's SAR supplies the volumes. SEIRA's own volume and history endpoints return 401 for anonymous requests, verified across five paths, and the public table it replaced stopped updating in 2017, so SEIRA alone cannot answer how full a reservoir is.
- SAR has no bulk query, so the volume fetch is one request per reservoir. Raw responses are cached before parsing, so a later outage costs nothing.
- SAR asserts no licence on its pages. It is cited as ANA/SAR with the retrieval date rather than under a claimed licence.
- Human-readable source list and reproduction commands live in `docs/SOURCES.md`.
