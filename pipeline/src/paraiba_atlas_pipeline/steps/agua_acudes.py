"""Paraíba reservoirs: the register from AESA's SEIRA, the fill level from ANA's SAR.

SEIRA is undocumented, gzip-only, and throttles this IP for hours at a time, so
every response is cached to disk before it is parsed and a run that finds a
cache never touches the network. The volume-history resources
(/periodos, /reservatorio/{id}/periodos, /estacao) all answer 401 to an
anonymous caller, so only the reservoir register is public. Volumes therefore
come from ANA's SAR (see `agua_sar`), matched to the register by name.

This module also carries the shared SEIRA client used by `agua_chuvas`.
"""
import json
import re
import time
from datetime import date, datetime, timezone

import requests

from ..manifest import record, write_json
from ..paths import RAW_DIR
from . import agua_sar

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


_PARENTHETICAL = re.compile(r"\(([^)]*)\)")
_PARTICLES = {"DE", "DA", "DO", "DAS", "DOS", "E"}

# AESA names the reservoir after the town, Coremas; ANA uses the older spelling
# of the river, Curema. Both list it at 744.14 hm³, which is what confirms they
# are the same body of water rather than a coincidence of similar names.
_SPELLING_ALIASES = {"COREMAS": "CUREMA", "CUREMA": "COREMAS"}

SAR_WINDOW_MONTHS = 14


def _without_particles(nome: str) -> str:
    """Drop Portuguese connectives, which the two registers include inconsistently.

    SEIRA writes "Riacho de Santo Antônio" where SAR writes "RIACHO SANTO
    ANTONIO", and "Felismina Queiroz" against SAR's "FELISMINA DE QUEIROZ".
    """
    words = re.split(r"[\s]+", nome)
    kept = [w for w in words if agua_sar.normalize(w) not in _PARTICLES]
    return " ".join(kept)


def name_aliases(nome: str) -> list[str]:
    """Normalized forms a reservoir may be listed under, most specific first.

    The registers also disagree on parentheticals: SEIRA writes "Acauã
    (Argemiro de Figueiredo)" where SAR writes "ACAUÃ", so the parenthetical
    has to be both stripped and tried on its own.
    """
    inner = _PARENTHETICAL.findall(nome)
    without = _PARENTHETICAL.sub("", nome)
    candidates = [nome, without, *inner]
    candidates += [_without_particles(c) for c in list(candidates)]

    seen = []
    for candidate in candidates:
        key = agua_sar.normalize(candidate)
        if key and key not in seen:
            seen.append(key)
    for key in list(seen):
        alias = _SPELLING_ALIASES.get(key)
        if alias and alias not in seen:
            seen.append(alias)
    return seen


def match_sar(reservoirs: list[dict], sar_data: dict[str, dict]) -> tuple[dict[int, dict], set[str]]:
    """Pair each SEIRA reservoir with its SAR entry, returning the pairs and the unmatched SAR keys.

    Names are matched, not coordinates: SAR's public measurement page carries no
    position, so the register's coordinates are the only ones available.
    """
    index: dict[str, str] = {}
    for key, entry in sar_data.items():
        for alias in name_aliases(entry["sar_nome"]):
            index.setdefault(alias, key)

    matched: dict[int, dict] = {}
    used: set[str] = set()
    for reservoir in reservoirs:
        for alias in name_aliases(reservoir["nome"]):
            key = index.get(alias)
            if key and key not in used:
                matched[reservoir["id"]] = sar_data[key]
                used.add(key)
                break
    return matched, set(sar_data) - used


def sar_window() -> tuple[date, date]:
    until = date.today()
    year, month = until.year, until.month - SAR_WINDOW_MONTHS
    while month <= 0:
        year, month = year - 1, month + 12
    return date(year, month, 1), until


def run() -> None:
    payload = fetch("reservatorio", name="reservatorio.json")
    reservoirs = [r for r in embedded(payload, "reservatorio") if r.get("possuiMonitoramento")]
    volumes = volume_by_reservoir()

    since, until = sar_window()
    sar_data = agua_sar.collect(since, until)
    sar_by_id, sar_unmatched = match_sar(reservoirs, sar_data)

    features = []
    for reservoir in reservoirs:
        if reservoir.get("latitude") is None or reservoir.get("longitude") is None:
            continue
        municipio = reservoir.get("municipio") or {}
        bacia = reservoir.get("bacia") or {}
        sar = sar_by_id.get(reservoir["id"], {})
        seira_capacity_hm3 = (reservoir.get("capacidade") or 0) / 1e6 or None

        # SAR reports capacity in the same row as the volume it measured, so taking
        # both from SAR keeps volume, capacity and percent internally consistent.
        # SEIRA's capacity only fills in where SAR has no reading.
        capacity_hm3 = sar.get("capacidade_hm3") or seira_capacity_hm3
        capacity_source = "ANA/SAR" if sar.get("capacidade_hm3") else ("AESA/SEIRA" if seira_capacity_hm3 else None)

        features.append({
            "type": "Feature",
            "properties": {
                "id": reservoir["id"],
                "nome": reservoir["nome"],
                # Both units: the map sizes circles off m³, the panel reads hm³.
                "capacidade_m3": round(capacity_hm3 * 1e6) if capacity_hm3 else None,
                "capacidade_hm3": round(capacity_hm3, 2) if capacity_hm3 else None,
                "capacidade_fonte": capacity_source,
                "municipio_cod": str(municipio.get("geocodigo")) if municipio.get("geocodigo") else None,
                "municipio": municipio.get("nome"),
                "bacia": bacia.get("nome"),
                "volume_hm3": sar.get("volume_hm3"),
                "percentual": sar.get("percentual"),
                "data_volume": sar.get("data_volume"),
                "serie_mensal": sar.get("serie_mensal"),
            },
            "geometry": {"type": "Point", "coordinates": [reservoir["longitude"], reservoir["latitude"]]},
        })

    write_json("agua/acudes.geojson", {"type": "FeatureCollection", "features": features})

    with_volume = sum(1 for f in features if f["properties"]["percentual"] is not None)
    with_series = sum(
        1 for f in features
        if sum(1 for m in (f["properties"]["serie_mensal"] or []) if m["percentual"] is not None) >= 6
    )
    stored = sum(f["properties"]["volume_hm3"] or 0 for f in features if f["properties"]["percentual"] is not None)
    installed = sum(f["properties"]["capacidade_hm3"] or 0 for f in features if f["properties"]["percentual"] is not None)

    record(
        "agua.acudes",
        source="AESA/SEIRA (cadastro) e ANA/SAR (volumes)",
        source_url="https://www.ana.gov.br/sar0/Medicao",
        year=date.today().year,
        year_note="Nenhuma das fontes declara ano de referência; o ano é o da coleta",
        rows=len(features),
        refreshed_at=date.today().isoformat(),
        with_volume=with_volume,
        capacity_authority="ANA/SAR onde há leitura, pois o SAR publica capacidade e volume na mesma linha; AESA/SEIRA preenche o resto",
        volume_note=(
            "Volume e histórico vêm do SAR da ANA, que não declara licença: citar a agência e a data de consulta. "
            "O SEIRA da AESA exige autenticação para volume, então dele vem só o cadastro."
        ),
    )
    print(
        f"açudes: {len(features)} no mapa, {with_volume} com volume atual, {with_series} com série mensal usável; "
        f"{len(sar_unmatched)} reservatórios do SAR sem par no SEIRA; "
        f"estoque {stored:.0f}/{installed:.0f} hm³ ({100 * stored / installed:.1f}%)"
    )
