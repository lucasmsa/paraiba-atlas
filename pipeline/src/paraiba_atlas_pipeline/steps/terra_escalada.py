"""Editorial crag index for the climbing layer; coordinates geocoded once through OpenStreetMap Nominatim (ODbL)."""
import json
import time

import requests

from ..manifest import record, write_json
from ..paths import PIPELINE_ROOT, RAW_DIR

EDITORIAL = PIPELINE_ROOT / "data" / "editorial" / "escalada.json"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "paraiba-atlas-pipeline (+https://github.com/lucasmsa/paraiba-atlas)"}


def geocode(query: str, cache: dict) -> tuple[float, float] | None:
    if query in cache:
        return tuple(cache[query]) if cache[query] else None
    response = requests.get(NOMINATIM, params={"q": query, "format": "json", "limit": 1, "countrycodes": "br"}, headers=HEADERS, timeout=30)
    response.raise_for_status()
    hits = response.json()
    cache[query] = [float(hits[0]["lon"]), float(hits[0]["lat"])] if hits else None
    time.sleep(1.1)
    return tuple(cache[query]) if cache[query] else None


def run() -> None:
    editorial = json.loads(EDITORIAL.read_text())
    cache_path = RAW_DIR / "nominatim_escalada.json"
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    features = []
    for crag in editorial["crags"]:
        coords = geocode(crag["query"], cache) if crag["query"] else None
        if coords is None:
            continue
        features.append({
            "type": "Feature",
            "properties": {"nome": crag["nome"], "municipio": crag["municipio"], "vias": crag.get("vias"), "estilos": crag.get("estilos"), "graduacao": crag.get("graduacao"), "geocodificado": True},
            "geometry": {"type": "Point", "coordinates": list(coords)},
        })
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1))
    write_json("terra/escalada.geojson", {"type": "FeatureCollection", "features": features})
    record("terra.escalada", source="Índice editorial a partir do Guia de Escalada na Paraíba (Timotheo e Falcão, 2023); coordenadas OpenStreetMap Nominatim",
           source_url="https://escaladanaparaiba.com.br/", year=2023, rows=len(features), editorial=True)
    skipped = [c["nome"] for c in editorial["crags"] if not c["query"]]
    print(f"escalada: {len(features)} crags geocoded; sem localização ainda: {skipped}")
