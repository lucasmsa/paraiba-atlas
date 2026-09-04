"""OpenStreetMap peaks (natural=peak) inside Paraíba via Overpass API (ODbL)."""
import json
from datetime import date

import requests
from urllib.parse import urlencode

from ..manifest import record, write_json
from ..provenance import fetch

MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
QUERY = '[out:json][timeout:120];area["ISO3166-2"="BR-PB"]->.pb;node["natural"="peak"](area.pb);out;'
LICENSE = "ODbL 1.0 (OpenStreetMap contributors)"


def parse_elevation(raw: str | None) -> float | None:
    if not raw:
        return None
    try:
        return float(raw.replace(",", ".").replace("m", "").strip())
    except ValueError:
        return None


def run() -> None:
    payload, used = None, None
    for mirror in MIRRORS:
        url = f"{mirror}?{urlencode({'data': QUERY})}"
        try:
            payload = json.loads(fetch("osm_overpass_peaks_pb.json", url, license=LICENSE, timeout=300).read_text())
            used = mirror
            break
        except (requests.HTTPError, json.JSONDecodeError) as error:
            print(f"overpass mirror failed: {mirror}: {error}")
    if payload is None:
        raise RuntimeError("every Overpass mirror failed")
    features = []
    for element in payload["elements"]:
        tags = element.get("tags", {})
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [element["lon"], element["lat"]]},
            "properties": {
                "osm_id": element["id"], "nome": tags.get("name"), "ele": parse_elevation(tags.get("ele")),
                "prominence": parse_elevation(tags.get("prominence")), "wikipedia": tags.get("wikipedia"), "wikidata": tags.get("wikidata"),
            },
        })
    write_json("geo/terra/picos.geojson", {"type": "FeatureCollection", "features": features})
    named = sum(1 for f in features if f["properties"]["nome"])
    with_ele = sum(1 for f in features if f["properties"]["ele"] is not None)
    record("terra.picos", source="OpenStreetMap via Overpass API", source_url=used, year=date.today().year,
           year_note=f"OSM data as of {payload['osm3s']['timestamp_osm_base']}", rows=len(features), path="geo/terra/picos.geojson")
    jabre = [f["properties"] for f in features if (f["properties"]["nome"] or "").lower() == "pico do jabre"]
    print(f"picos: {len(features)} nodes, {named} named, {with_ele} with ele; Pico do Jabre nodes: {len(jabre)} {jabre[:1]}")
