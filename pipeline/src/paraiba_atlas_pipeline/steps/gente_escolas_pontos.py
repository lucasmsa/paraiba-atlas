"""School points from OpenStreetMap (amenity=school) inside Paraíba, via Overpass (ODbL).

INEP is not usable as a point source: the Censo Escolar microdata carries no coordinate
column at all (426 columns in the 2024 release, none of them latitude or longitude), and
the catálogo de escolas and geolocalização download paths both return 404. OSM is the
only reachable source, and the atlas already uses it for peaks.

The trade is coverage. OSM is contributor-driven, so this is emphatically not a census:
an absent point means nobody mapped that school, not that no school exists. Counts per
município are emitted alongside the points so the unevenness is measurable rather than
merely disclosed.

The unevenness does not follow urbanization, which is worth stating because the obvious
assumption is wrong. João Pessoa and Campina Grande hold 21.6% of the points but 31.5%
of the state's population, so per capita they are mapped less thoroughly than the median
município that has any points at all. The real pattern is that individual contributors
mapped particular municípios exhaustively while 71 municípios have no school at all.
"""
import json
from collections import Counter
from datetime import date
from urllib.parse import urlencode

import requests
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

from ..manifest import record, write_json
from ..paths import OUT_DIR

MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
QUERY = (
    '[out:json][timeout:180];'
    'area["ISO3166-2"="BR-PB"]->.pb;'
    '('
    'node["amenity"="school"](area.pb);'
    'way["amenity"="school"](area.pb);'
    'relation["amenity"="school"](area.pb);'
    ');'
    'out tags center;'
)
LICENSE = "ODbL 1.0 (OpenStreetMap contributors)"
MUNICIPIOS = OUT_DIR / "geo" / "municipios.geojson"

# Município polygons are simplified to ~100 m, so a school on a boundary or a beachfront
# can land just outside its own município. Snap those to the nearest polygon within this
# distance rather than discarding a real school over a smoothing artifact.
SNAP_TOLERANCE_DEG = 0.01


def fetch_payload() -> tuple[dict, str]:
    from ..provenance import fetch

    for mirror in MIRRORS:
        url = f"{mirror}?{urlencode({'data': QUERY})}"
        try:
            return json.loads(fetch("osm_overpass_escolas_pb.json", url, license=LICENSE, timeout=300).read_text()), url
        except (requests.HTTPError, requests.Timeout, json.JSONDecodeError) as error:
            print(f"overpass mirror failed: {mirror}: {error}")
    raise RuntimeError("every Overpass mirror failed")


def coordinates(element: dict) -> tuple[float, float] | None:
    if "lat" in element and "lon" in element:
        return element["lon"], element["lat"]
    center = element.get("center")
    if center:
        return center["lon"], center["lat"]
    return None


class MunicipioLocator:
    """Point-in-polygon against the 223 municípios, with a snap for boundary artifacts."""

    def __init__(self) -> None:
        collection = json.loads(MUNICIPIOS.read_text())
        self.records = [(f["properties"]["cod"], f["properties"]["nome"], shape(f["geometry"])) for f in collection["features"]]
        self.tree = STRtree([geometry for _, _, geometry in self.records])

    def locate(self, lon: float, lat: float) -> tuple[str, str, bool] | None:
        point = Point(lon, lat)
        for index in self.tree.query(point):
            cod, nome, geometry = self.records[index]
            if geometry.contains(point):
                return cod, nome, False

        nearest = self.tree.nearest(point)
        cod, nome, geometry = self.records[nearest]
        if geometry.distance(point) <= SNAP_TOLERANCE_DEG:
            return cod, nome, True
        return None


def school_properties(element: dict, cod: str, nome_municipio: str) -> dict:
    tags = element.get("tags", {})
    return {
        "osm_id": element["id"],
        "osm_type": element["type"],
        "nome": tags.get("name"),
        "operador": tags.get("operator"),
        "operador_tipo": tags.get("operator:type"),
        "nivel": tags.get("isced:level") or tags.get("school:level") or tags.get("education"),
        "municipio_cod": cod,
        "municipio": nome_municipio,
    }


def run() -> None:
    payload, used_url = fetch_payload()
    locator = MunicipioLocator()

    features: list[dict] = []
    without_coordinates = 0
    outside = 0
    snapped = 0

    for element in payload["elements"]:
        point = coordinates(element)
        if point is None:
            without_coordinates += 1
            continue
        lon, lat = point
        located = locator.locate(lon, lat)
        if located is None:
            outside += 1
            continue
        cod, nome_municipio, was_snapped = located
        snapped += was_snapped
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": school_properties(element, cod, nome_municipio),
        })

    write_json("gente/escolas.geojson", {"type": "FeatureCollection", "features": features})

    by_municipio = Counter(f["properties"]["municipio"] for f in features)
    write_json("gente/escolas_por_municipio.json", {
        "total": len(features),
        "municipios_com_ponto": len(by_municipio),
        "contagem": dict(by_municipio.most_common()),
    })

    named = sum(1 for f in features if f["properties"]["nome"])
    public = sum(1 for f in features if (f["properties"]["operador_tipo"] or "").lower() in {"public", "government"})
    osm_timestamp = payload.get("osm3s", {}).get("timestamp_osm_base")

    record(
        "gente.escolas",
        source="OpenStreetMap via Overpass API (amenity=school)",
        source_url=used_url,
        year=date.today().year,
        year_note=(
            f"Dados do OSM em {osm_timestamp}. O mapeamento do OSM é feito por voluntários, "
            "então esta camada não é um censo escolar: a ausência de um ponto significa que "
            f"ninguém mapeou aquela escola, não que ela não exista. Só {len(by_municipio)} dos "
            f"223 municípios têm ao menos uma escola mapeada, e os {223 - len(by_municipio)} "
            "restantes reúnem 13% da população do estado. A falha não segue o tamanho da cidade: "
            "João Pessoa e Campina Grande somam 21,6% dos pontos para 31,5% da população, ou seja, "
            "estão menos mapeadas por habitante que o município mediano que tem algum ponto. "
            "Use a camada para ver onde há escolas, nunca para contar quantas existem."
        ),
        rows=len(features),
        path="gente/escolas.geojson",
        license=LICENSE,
        named=named,
        municipios_com_ponto=len(by_municipio),
    )

    top = by_municipio.most_common(5)
    print(f"escolas: {len(features)} pontos, {named} com nome, {public} públicas declaradas")
    print(f"  municípios com ao menos um ponto: {len(by_municipio)} de 223")
    print(f"  sem coordenada: {without_coordinates}, fora da Paraíba: {outside}, ajustados à borda: {snapped}")
    print(f"  maiores: {top}")
