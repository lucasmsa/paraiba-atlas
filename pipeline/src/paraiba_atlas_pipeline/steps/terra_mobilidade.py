"""Mobility in Paraíba from OpenStreetMap via Overpass (ODbL): highways, the CBTU rail line, bus terminals.

Three layers with very different reliability, which is why they ship as three files rather
than one:

Highways are trustworthy. Federal (BR) and state (PB) routes in Brazil are mapped
thoroughly, and the ref tag is consistent enough to dissolve thousands of way fragments
into one feature per highway.

The CBTU line is a single 30 km commuter railway. Note it runs Santa Rita to Cabedelo
through João Pessoa, not João Pessoa to Cabedelo: Santa Rita is the western terminus.

Bus terminals are contributor-driven and patchy, and they mix intercity rodoviárias with
urban bus terminals because OSM tags both amenity=bus_station. More importantly, no
Paraíba bus operator publishes a GTFS feed, so no route or schedule data exists anywhere:
this shows terminals as buildings, never as a network.
"""
import json
import re
from collections import Counter
from datetime import date
from urllib.parse import urlencode

import geopandas as gpd
import requests
from shapely.geometry import LineString
from shapely.ops import linemerge

from ..manifest import record, write_json
from ..provenance import fetch
from .gente_escolas_pontos import MunicipioLocator

MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
LICENSE = "ODbL 1.0 (OpenStreetMap contributors)"
AREA_CRS = "EPSG:31985"  # SIRGAS 2000 / UTM 25S

RODOVIAS_QUERY = (
    '[out:json][timeout:280];'
    'area["ISO3166-2"="BR-PB"]->.pb;'
    'way["highway"~"^(motorway|trunk|primary|secondary)$"]["ref"](area.pb);'
    'out geom;'
)
FERROVIA_QUERY = (
    '[out:json][timeout:180];'
    'area["ISO3166-2"="BR-PB"]->.pb;'
    'rel["route"="light_rail"]["operator"~"CBTU",i](area.pb)->.r;'
    '.r out geom;'
    'node(r.r:"stop")->.s;'
    '.s out;'
)
RODOVIARIAS_QUERY = (
    '[out:json][timeout:180];'
    'area["ISO3166-2"="BR-PB"]->.pb;'
    '('
    'node["amenity"="bus_station"](area.pb);'
    'way["amenity"="bus_station"](area.pb);'
    'relation["amenity"="bus_station"](area.pb);'
    ');'
    'out tags center;'
)

# ~22 m. Highways are read at state scale, where that is invisible, and it cuts the
# dissolved file from 2.6 MB to 0.38 MB.
SIMPLIFY_TOLERANCE_DEG = 0.0002
REF_PATTERN = re.compile(r"^(BR|PB)-\d+$")


def overpass(name: str, query: str) -> tuple[dict, str]:
    for mirror in MIRRORS:
        url = f"{mirror}?{urlencode({'data': query})}"
        try:
            return json.loads(fetch(name, url, license=LICENSE, timeout=400).read_text()), url
        except (requests.HTTPError, requests.Timeout, json.JSONDecodeError) as error:
            print(f"overpass mirror failed: {mirror}: {error}")
    raise RuntimeError(f"every Overpass mirror failed for {name}")


def osm_timestamp(payload: dict) -> str | None:
    return payload.get("osm3s", {}).get("timestamp_osm_base")


def normalized_refs(raw: str) -> list[str]:
    """"PB - 306" and "BR-230;PB-004" both occur; keep only Paraíba's own BR and PB routes."""
    refs = []
    for token in re.split(r"[;,]", raw):
        candidate = re.sub(r"\s*-\s*", "-", token.strip()).upper()
        if REF_PATTERN.match(candidate):
            refs.append(candidate)
    return refs


def center_of(element: dict) -> tuple[float, float] | None:
    if element.get("lat") is not None and element.get("lon") is not None:
        return element["lon"], element["lat"]
    center = element.get("center")
    return (center["lon"], center["lat"]) if center else None


def rodovias() -> dict:
    payload, url = overpass("osm_overpass_rodovias_pb.json", RODOVIAS_QUERY)

    rows = []
    skipped_refs: Counter = Counter()
    for element in payload["elements"]:
        geometry = element.get("geometry") or []
        if len(geometry) < 2:
            continue
        tags = element.get("tags", {})
        raw_ref = tags.get("ref", "")
        refs = normalized_refs(raw_ref)
        if not refs:
            skipped_refs[raw_ref] += 1
            continue
        line = LineString([(point["lon"], point["lat"]) for point in geometry])
        for ref in refs:
            rows.append({
                "ref": ref,
                "jurisdicao": "federal" if ref.startswith("BR") else "estadual",
                "tipo": tags.get("highway"),
                "geometry": line,
            })

    segments = gpd.GeoDataFrame(rows, geometry="geometry", crs="EPSG:4326")
    dissolved = segments.dissolve(by="ref", aggfunc={"jurisdicao": "first", "tipo": "first"}).reset_index()
    dissolved["geometry"] = dissolved.geometry.apply(lambda geom: linemerge(geom) if geom.geom_type == "MultiLineString" else geom)
    dissolved["km"] = (dissolved.to_crs(AREA_CRS).length / 1000).round(1)
    dissolved["geometry"] = dissolved.geometry.simplify(SIMPLIFY_TOLERANCE_DEG, preserve_topology=False)

    write_json("terra/rodovias.geojson", json.loads(dissolved.to_json(drop_id=True)))
    by_jurisdiction = dissolved.groupby("jurisdicao")["km"].agg(["count", "sum"])
    record(
        "terra.rodovias",
        source="OpenStreetMap via Overpass API (highway com ref BR ou PB)",
        source_url=url,
        year=date.today().year,
        year_note=(
            f"Dados do OSM em {osm_timestamp(payload)}. Cada rodovia é uma feição só, "
            f"unindo os {len(segments)} trechos que o OSM registra separadamente. "
            "Trechos de rodovias de estados vizinhos que cruzam a fronteira ficam de fora."
        ),
        rows=len(dissolved),
        path="terra/rodovias.geojson",
        license=LICENSE,
    )
    print(f"rodovias: {len(dissolved)} rodovias de {len(segments)} trechos")
    print(f"  {by_jurisdiction.to_dict()}")
    print(f"  refs descartados (fora de BR/PB): {sum(skipped_refs.values())} trechos, {len(skipped_refs)} refs distintos")
    return {"features": len(dissolved), "by_jurisdiction": by_jurisdiction.to_dict()}


def ferrovia() -> dict:
    payload, url = overpass("osm_overpass_ferrovia_pb.json", FERROVIA_QUERY)

    relations = [element for element in payload["elements"] if element["type"] == "relation"]
    stop_nodes = [element for element in payload["elements"] if element["type"] == "node"]

    # The two relations are the same track in opposite directions; one carries the geometry.
    lines = []
    for member in (relations[0].get("members", []) if relations else []):
        geometry = member.get("geometry") or []
        if member["type"] == "way" and len(geometry) >= 2:
            lines.append(LineString([(point["lon"], point["lat"]) for point in geometry]))
    merged = linemerge(lines) if lines else None

    features = []
    if merged is not None:
        features.append({
            "type": "Feature",
            "geometry": json.loads(gpd.GeoSeries([merged], crs="EPSG:4326").to_json())["features"][0]["geometry"],
            "properties": {
                "tipo": "linha",
                "nome": relations[0]["tags"].get("name"),
                "operador": relations[0]["tags"].get("operator"),
                "rede": relations[0]["tags"].get("network"),
            },
        })

    seen_stations: set[str] = set()
    for node in sorted(stop_nodes, key=lambda element: element["id"]):
        name = node.get("tags", {}).get("name")
        if not name or name in seen_stations:
            continue
        seen_stations.add(name)
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [node["lon"], node["lat"]]},
            "properties": {"tipo": "estacao", "nome": name, "osm_id": node["id"]},
        })

    write_json("terra/ferrovia.geojson", {"type": "FeatureCollection", "features": features})
    km = round(gpd.GeoSeries([merged], crs="EPSG:4326").to_crs(AREA_CRS).length.iloc[0] / 1000, 1) if merged is not None else 0.0
    record(
        "terra.ferrovia",
        source="OpenStreetMap via Overpass API (rota CBTU)",
        source_url=url,
        year=date.today().year,
        year_note=(
            f"Dados do OSM em {osm_timestamp(payload)}. É a única ferrovia de passageiros "
            "em operação na Paraíba: liga Santa Rita a Cabedelo passando por João Pessoa. "
            "Os ramais de carga da Transnordestina e as estações desativadas do interior "
            "não entram nesta camada."
        ),
        rows=len(features),
        path="terra/ferrovia.geojson",
        license=LICENSE,
        km=km,
        estacoes=len(seen_stations),
    )
    print(f"ferrovia: linha de {km} km, {len(seen_stations)} estações, {len(relations)} relações de rota")
    return {"km": km, "stations": len(seen_stations)}


def rodoviarias() -> dict:
    payload, url = overpass("osm_overpass_rodoviarias_pb.json", RODOVIARIAS_QUERY)
    locator = MunicipioLocator()

    features = []
    outside = 0
    for element in payload["elements"]:
        point = center_of(element)
        if point is None:
            continue
        lon, lat = point
        located = locator.locate(lon, lat)
        if located is None:
            outside += 1
            continue
        cod, municipio, _ = located
        tags = element.get("tags", {})
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "osm_id": element["id"],
                "osm_type": element["type"],
                "nome": tags.get("name"),
                "operador": tags.get("operator"),
                "municipio_cod": cod,
                "municipio": municipio,
            },
        })

    write_json("terra/rodoviarias.geojson", {"type": "FeatureCollection", "features": features})
    by_municipio = Counter(feature["properties"]["municipio"] for feature in features)
    named = sum(1 for feature in features if feature["properties"]["nome"])
    record(
        "terra.rodoviarias",
        source="OpenStreetMap via Overpass API (amenity=bus_station)",
        source_url=url,
        year=date.today().year,
        year_note=(
            f"Dados do OSM em {osm_timestamp(payload)}. Nenhuma empresa de ônibus da Paraíba "
            "publica GTFS, o formato aberto de horários e itinerários, então não existe dado "
            "de linha nem de horário em lugar nenhum: esta camada mostra terminais como "
            "construções, nunca como rede. O mapeamento é voluntário e desigual: apenas "
            f"{len(by_municipio)} dos 223 municípios têm algum terminal mapeado, e a camada "
            "mistura rodoviárias intermunicipais com terminais de ônibus urbano, porque o OSM "
            "usa a mesma etiqueta para os dois."
        ),
        rows=len(features),
        path="terra/rodoviarias.geojson",
        license=LICENSE,
        municipios_com_terminal=len(by_municipio),
    )
    print(f"rodoviárias: {len(features)} terminais, {named} com nome, em {len(by_municipio)} municípios (fora do estado: {outside})")
    return {"terminals": len(features), "municipios": len(by_municipio)}


def run() -> None:
    rodovias()
    ferrovia()
    rodoviarias()
