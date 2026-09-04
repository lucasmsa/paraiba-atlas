"""AESA reservoirs from the SEIRA API (seira.aesa.pb.gov.br/api): capacity, location, município, and per-reservoir volume history."""
import json
import time
from datetime import date

import requests

from ..manifest import record, write_json
from ..paths import RAW_DIR

API = "https://seira.aesa.pb.gov.br/api"
LICENSE = "AESA public data, terms not stated"
_session = requests.Session()
_session.headers["User-Agent"] = "paraiba-atlas-pipeline (+https://github.com/lucasmsa/paraiba-atlas)"


def get_json(path: str, *, retries: int = 4, timeout: int = 60):
    url = f"{API}/{path}"
    delay = 5
    for attempt in range(retries):
        try:
            response = _session.get(url, timeout=timeout)
            if response.status_code == 429 or response.status_code >= 500:
                raise requests.HTTPError(f"{response.status_code} {url}")
            response.raise_for_status()
            return response.json()
        except (requests.Timeout, requests.ConnectionError, requests.HTTPError) as error:
            if attempt == retries - 1:
                raise RuntimeError(f"SEIRA unreachable after {retries} attempts: {url}") from error
            time.sleep(delay)
            delay *= 2


def monitored_reservoirs() -> list[dict]:
    cache = RAW_DIR / "seira" / "reservatorio.json"
    if cache.exists():
        payload = json.loads(cache.read_text())
    else:
        payload = get_json("reservatorio")
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(payload, ensure_ascii=False))
        cache.with_suffix(".json.provenance.json").write_text(json.dumps({"url": f"{API}/reservatorio", "fetched_at": date.today().isoformat(), "license": LICENSE}))
    items = payload.get("_embedded", {}).get("reservatorio", payload if isinstance(payload, list) else [])
    return [r for r in items if r.get("possuiMonitoramento")]


def history(reservoir_id: int) -> list[dict]:
    cache = RAW_DIR / "seira" / f"periodos_{reservoir_id}.json"
    if cache.exists():
        return json.loads(cache.read_text())
    payload = get_json(f"reservatorio/{reservoir_id}/periodos")
    items = payload.get("_embedded", {}).get("periodos", payload if isinstance(payload, list) else [])
    cache.write_text(json.dumps(items, ensure_ascii=False))
    time.sleep(1.5)
    return items


def run() -> None:
    reservoirs = monitored_reservoirs()
    features = []
    for r in reservoirs:
        features.append({
            "type": "Feature",
            "properties": {
                "id": r["id"], "nome": r["nome"], "capacidade_m3": r.get("capacidade"),
                "municipio_cod": (r.get("municipio") or {}).get("geocodigo"), "municipio": (r.get("municipio") or {}).get("nome"),
                "bacia": (r.get("bacia") or {}).get("nome"),
            },
            "geometry": {"type": "Point", "coordinates": [r["longitude"], r["latitude"]]},
        })
    write_json("agua/acudes.geojson", {"type": "FeatureCollection", "features": features})
    record("agua.acudes", source="AESA, SEIRA (reservatórios monitorados)", source_url=f"{API}/reservatorio", year=date.today().year,
           rows=len(features), refreshed_at=date.today().isoformat())
    print(f"açudes: {len(features)} monitorados; history step pending until the periodos schema is confirmed")
