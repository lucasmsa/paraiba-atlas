"""ArcGIS REST MapServer queries as GeoJSON, fetched through provenance so every chunk has a sidecar."""
import json
from urllib.parse import urlencode

from .provenance import fetch

PARAIBA_BBOX = "-38.9,-8.4,-34.7,-5.9"


def _query_url(layer_url: str, params: dict) -> str:
    return f"{layer_url}/query?{urlencode(params, safe=',:')}"


def object_ids_in_bbox(layer_url: str, name: str, license: str) -> list[int]:
    url = _query_url(layer_url, {
        "geometry": PARAIBA_BBOX, "geometryType": "esriGeometryEnvelope", "inSR": 4326,
        "spatialRel": "esriSpatialRelIntersects", "returnIdsOnly": "true", "f": "json",
    })
    payload = json.loads(fetch(name, url, license=license).read_text())
    return sorted(payload["objectIds"])


def features_by_ids(layer_url: str, name_prefix: str, ids: list[int], out_fields: str, license: str, chunk: int = 150) -> list[dict]:
    features = []
    for i in range(0, len(ids), chunk):
        batch = ids[i:i + chunk]
        url = _query_url(layer_url, {"objectIds": ",".join(map(str, batch)), "outFields": out_fields, "outSR": 4326, "f": "geojson"})
        payload = json.loads(fetch(f"{name_prefix}_{i // chunk:02d}.geojson", url, license=license, timeout=300).read_text())
        features.extend(payload["features"])
    return features


def features_paged(layer_url: str, name_prefix: str, out_fields: str, license: str, page: int = 1000) -> list[dict]:
    features, offset = [], 0
    while True:
        url = _query_url(layer_url, {"where": "1=1", "outFields": out_fields, "outSR": 4326, "resultOffset": offset, "resultRecordCount": page, "f": "geojson"})
        payload = json.loads(fetch(f"{name_prefix}_{offset // page:02d}.geojson", url, license=license, timeout=300).read_text())
        features.extend(payload["features"])
        if not payload.get("exceededTransferLimit") or not payload["features"]:
            return features
        offset += page
