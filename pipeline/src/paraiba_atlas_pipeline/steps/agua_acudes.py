"""AESA reservoirs from the SEIRA API (seira.aesa.pb.gov.br/api): capacity, location and município.

SEIRA is undocumented, gzip-only, and throttles this IP for hours at a time, so
every response is cached to disk before it is parsed and a run that finds a
cache never touches the network. The volume-history resources
(/periodos, /reservatorio/{id}/periodos, /estacao) all answer 401 to an
anonymous caller, so only the reservoir register is public.

This module also carries the shared SEIRA client used by `agua_chuvas`.
"""
import json
import time
from datetime import date, datetime, timezone

import requests

from ..manifest import record, write_json
from ..paths import RAW_DIR

API = "https://seira.aesa.pb.gov.br/api"
LICENSE = "AESA public data, terms not stated"
SEIRA_DIR = RAW_DIR / "seira"

_session = requests.Session()
_session.headers.update({
    "User-Agent": "paraiba-atlas-pipeline (+https://github.com/lucasmsa/paraiba-atlas)",
    "Accept-Encoding": "gzip, deflate",
})


class SeiraUnavailable(RuntimeError):
    """SEIRA refused or dropped the connection after every retry."""


class SeiraForbidden(RuntimeError):
    """SEIRA requires authentication for this resource."""


def _write_provenance(cache_path, url: str) -> None:
    sidecar = cache_path.with_suffix(cache_path.suffix + ".provenance.json")
    sidecar.write_text(json.dumps({
        "url": url,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "bytes": cache_path.stat().st_size,
        "license": LICENSE,
    }, ensure_ascii=False, indent=2))


def fetch(path: str, *, name: str | None = None, retries: int = 5, timeout: int = 180, refresh: bool = False):
    """Return parsed JSON for an API path, caching the raw body under data/raw/seira."""
    SEIRA_DIR.mkdir(parents=True, exist_ok=True)
    cache = SEIRA_DIR / (name or f"{path.replace('/', '_')}.json")
    if cache.exists() and not refresh:
        return json.loads(cache.read_text())

    url = f"{API}/{path}"
    delay = 8
    for attempt in range(retries):
        try:
            response = _session.get(url, timeout=timeout)
            if response.status_code in (401, 403):
                raise SeiraForbidden(f"{response.status_code} {url}")
            if response.status_code == 429 or response.status_code >= 500:
                raise requests.HTTPError(f"{response.status_code} {url}")
            response.raise_for_status()
            cache.write_bytes(response.content)
            _write_provenance(cache, url)
            return json.loads(cache.read_text())
        except (requests.Timeout, requests.ConnectionError, requests.HTTPError):
            if attempt == retries - 1:
                raise SeiraUnavailable(f"SEIRA unreachable after {retries} attempts: {url}")
            time.sleep(delay)
            delay *= 2


def embedded(payload, key: str) -> list[dict]:
    """SEIRA is Spring Data REST, so collections arrive wrapped in _embedded."""
    if isinstance(payload, list):
        return payload
    return payload.get("_embedded", {}).get(key, [])


def volume_by_reservoir() -> dict[int, dict]:
    """Current volume per reservoir, empty when SEIRA exposes no public volume resource."""
    for path, name in (("reservatorio/filtros-reservatorios", "filtros-reservatorios.json"),
                       ("reservatorio/search", "reservatorio_search.json")):
        try:
            payload = fetch(path, name=name, retries=2, timeout=30)
        except (SeiraUnavailable, SeiraForbidden):
            continue
        rows = payload if isinstance(payload, list) else embedded(payload, "reservatorio")
        volumes = {}
        for row in rows:
            if not isinstance(row, dict):
                continue
            reservoir_id = row.get("id") or row.get("idReservatorio")
            volume = row.get("volumeAtual") or row.get("volume")
            percent = row.get("percentual") or row.get("percentualVolume")
            if reservoir_id is not None and (volume is not None or percent is not None):
                volumes[reservoir_id] = {"volume_m3": volume, "percentual": percent, "data": row.get("data")}
        if volumes:
            return volumes
    return {}


def run() -> None:
    payload = fetch("reservatorio", name="reservatorio.json")
    reservoirs = [r for r in embedded(payload, "reservatorio") if r.get("possuiMonitoramento")]
    volumes = volume_by_reservoir()

    features = []
    for reservoir in reservoirs:
        if reservoir.get("latitude") is None or reservoir.get("longitude") is None:
            continue
        municipio = reservoir.get("municipio") or {}
        bacia = reservoir.get("bacia") or {}
        volume = volumes.get(reservoir["id"], {})
        capacity = reservoir.get("capacidade")
        current = volume.get("volume_m3")
        percent = volume.get("percentual")
        if percent is None and current is not None and capacity:
            percent = round(100 * current / capacity, 1)
        features.append({
            "type": "Feature",
            "properties": {
                "id": reservoir["id"],
                "nome": reservoir["nome"],
                "capacidade_m3": capacity,
                "municipio_cod": str(municipio.get("geocodigo")) if municipio.get("geocodigo") else None,
                "municipio": municipio.get("nome"),
                "bacia": bacia.get("nome"),
                "volume_m3": current,
                "percentual": percent,
                "data_volume": volume.get("data"),
            },
            "geometry": {"type": "Point", "coordinates": [reservoir["longitude"], reservoir["latitude"]]},
        })

    write_json("agua/acudes.geojson", {"type": "FeatureCollection", "features": features})
    with_volume = sum(1 for f in features if f["properties"]["percentual"] is not None)
    record(
        "agua.acudes",
        source="AESA, SEIRA (reservatórios monitorados)",
        source_url=f"{API}/reservatorio",
        year=date.today().year,
        year_note="SEIRA publishes no reference year; year is the fetch year",
        rows=len(features),
        refreshed_at=date.today().isoformat(),
        with_volume=with_volume,
        volume_note=None if with_volume else "Volume atual e histórico exigem autenticação no SEIRA; só o cadastro é público.",
    )
    print(f"açudes: {len(features)} monitorados, {with_volume} com volume atual")
