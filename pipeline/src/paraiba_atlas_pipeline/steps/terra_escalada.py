"""Editorial crag index for the climbing layer.

Paraíba has no open climbing database: theCrag's API is closed to non-commercial use and its data is
CC BY-NC-SA, OpenStreetMap carries four unnamed climbing features in the whole state, and the only
complete source is the printed Guia de Escalada na Paraíba (Timotheo e Falcão, 2023). So the crag
names come from what the guide's authors publish, and each coordinate is cited per crag in
data/editorial/escalada.json. A crag whose coordinate cannot be sourced ships without geometry.
Every point is checked against the município it claims, so a wrong hit is dropped rather than mapped.
"""
import json

from shapely.geometry import Point, shape

from ..manifest import record, write_json
from ..paths import OUT_DIR, PIPELINE_ROOT

EDITORIAL = PIPELINE_ROOT / "data" / "editorial" / "escalada.json"
MUNICIPIOS = OUT_DIR / "geo" / "municipios.geojson"


def municipio_shapes() -> list[tuple[str, str, object]]:
    collection = json.loads(MUNICIPIOS.read_text())
    return [(f["properties"]["cod"], f["properties"]["nome"], shape(f["geometry"])) for f in collection["features"]]


def locate(lon: float, lat: float, shapes: list[tuple[str, str, object]]) -> tuple[str, str] | None:
    point = Point(lon, lat)
    for cod, nome, geometry in shapes:
        if geometry.contains(point):
            return cod, nome
    return None


def run() -> None:
    editorial = json.loads(EDITORIAL.read_text())
    shapes = municipio_shapes()
    features: list[dict] = []
    placed: list[str] = []
    unplaced: list[str] = []
    rejected: list[str] = []

    for crag in editorial["crags"]:
        properties = {
            "nome": crag["nome"],
            "municipio": crag["municipio"],
            "municipio_cod": None,
            "vias": None,
            "estilos": None,
            "graduacao": None,
            "geocodificado": False,
            "fonte_coordenada": crag["fonte_coordenada"],
            "precisao": crag["precisao"],
        }

        if crag["lon"] is None or crag["lat"] is None:
            unplaced.append(crag["nome"])
            features.append({"type": "Feature", "properties": properties, "geometry": None})
            continue

        hit = locate(crag["lon"], crag["lat"], shapes)
        if hit is None or (crag["municipio"] and hit[1] != crag["municipio"]):
            found = hit[1] if hit else "fora da Paraíba"
            rejected.append(f"{crag['nome']} (esperado {crag['municipio']}, caiu em {found})")
            features.append({"type": "Feature", "properties": properties, "geometry": None})
            continue

        properties["municipio_cod"] = hit[0]
        properties["municipio"] = hit[1]
        properties["geocodificado"] = True
        placed.append(crag["nome"])
        features.append({
            "type": "Feature",
            "properties": properties,
            "geometry": {"type": "Point", "coordinates": [crag["lon"], crag["lat"]]},
        })

    write_json("terra/escalada.geojson", {"type": "FeatureCollection", "features": features})
    record(
        "terra.escalada",
        source="Índice editorial a partir do Guia de Escalada na Paraíba (Timotheo e Falcão, 2023); coordenadas de escaladas.com.br, OpenStreetMap e literatura, citadas por setor",
        source_url="https://escaladanaparaiba.com.br/",
        year=2023,
        rows=len(features),
        editorial=True,
        year_note=f"{len(placed)} de {len(features)} setores com coordenada verificada; os demais aguardam o guia impresso",
    )
    print(f"escalada: {len(features)} setores, {len(placed)} localizados")
    print(f"  sem coordenada: {unplaced}")
    if rejected:
        print(f"  rejeitados na conferência de município: {rejected}")
