"""Reservoir volumes from ANA's SAR (Sistema de Acompanhamento de Reservatórios).

SEIRA publishes the reservoir register but answers 401 for every volume
resource, so the fill level comes from ANA instead. SAR serves a plain HTML
table over GET with no token or cookie, one reservoir per request, so a full
pass is 126 requests. Every response is cached before it is parsed.

SAR has no bulk query and no working export: /sar0/Nordeste renders client
side, its CarregaMapa POST and Medicao/ExportarExcel both answer 500 without
session state, and dados.gov.br answers 401. One GET per reservoir is the only
public path.
"""
import html
import json
import re
import time
import unicodedata
from dataclasses import dataclass
from datetime import date, datetime, timezone

import requests

from ..paths import RAW_DIR

BASE = "https://www.ana.gov.br/sar0"
MEDICAO = f"{BASE}/Medicao"
ESTADO_PB = 16
SAR_DIR = RAW_DIR / "sar"
# SAR asserts no licence; cite the agency and the retrieval date instead.
CITATION = "ANA/SAR, consultado em {date}"

_session = requests.Session()
_session.headers.update({
    "User-Agent": "paraiba-atlas-pipeline (+https://github.com/lucasmsa/paraiba-atlas)",
    "Accept": "text/html,application/xhtml+xml",
})

_TAG = re.compile(r"<[^>]+>")
_ROW = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S)
_CELL = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.S)
_OPTION = re.compile(r"<option value=[\"']([^\"']*)[\"'][^>]*>(.*?)</option>", re.S)
_SELECT = re.compile(r"id=[\"']dropDownListReservatorios[\"'].*?</select>", re.S)


@dataclass(frozen=True)
class Measurement:
    dia: date
    capacidade_hm3: float | None
    cota_m: float | None
    volume_hm3: float | None
    percentual: float | None


def normalize(name: str) -> str:
    """Fold to ASCII uppercase letters and digits so SAR and SEIRA names can be compared."""
    stripped = unicodedata.normalize("NFKD", name)
    ascii_only = "".join(c for c in stripped if not unicodedata.combining(c))
    return re.sub(r"[^A-Z0-9]", "", ascii_only.upper())


def _decimal(text: str) -> float | None:
    """SAR writes numbers with a comma decimal separator and a dot thousands separator."""
    cleaned = text.strip().replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _cells(row_html: str) -> list[str]:
    return [html.unescape(_TAG.sub("", cell)).strip() for cell in _CELL.findall(row_html)]


def _write_provenance(path, url: str) -> None:
    sidecar = path.with_suffix(path.suffix + ".provenance.json")
    sidecar.write_text(json.dumps({
        "url": url,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "bytes": path.stat().st_size,
        "license": "não declarada; ANA, órgão federal",
    }, ensure_ascii=False, indent=2))


def cached_get(name: str, url: str, *, retries: int = 4, timeout: int = 120, pause: float = 1.2) -> str:
    """Fetch a SAR page, writing the raw body to disk before anything parses it."""
    SAR_DIR.mkdir(parents=True, exist_ok=True)
    cache = SAR_DIR / name
    if cache.exists():
        return cache.read_text(encoding="utf-8", errors="replace")

    delay = 5.0
    for attempt in range(retries):
        try:
            response = _session.get(url, timeout=timeout)
            if response.status_code == 429 or response.status_code >= 500:
                raise requests.HTTPError(f"{response.status_code} {url}")
            response.raise_for_status()
            response.encoding = response.encoding or "utf-8"
            cache.write_text(response.text, encoding="utf-8")
            _write_provenance(cache, url)
            time.sleep(pause)
            return response.text
        except (requests.Timeout, requests.ConnectionError, requests.HTTPError):
            if attempt == retries - 1:
                raise RuntimeError(f"SAR unreachable after {retries} attempts: {url}")
            time.sleep(delay)
            delay *= 2
    raise RuntimeError(f"SAR unreachable: {url}")


def reservoirs(uf: str = "PB") -> list[tuple[str, str]]:
    """Reservoir ids and names for one state, read from the form's own dropdown."""
    page = cached_get("medicao_form.html", MEDICAO)
    select = _SELECT.search(page)
    if not select:
        raise RuntimeError("SAR reservoir dropdown not found; the form markup changed")
    suffix = f"({uf})"
    found = []
    for value, label in _OPTION.findall(select.group(0)):
        text = html.unescape(_TAG.sub("", label)).strip()
        if value and text.endswith(suffix):
            found.append((value, text[: -len(suffix)].strip()))
    return found


def series(reservoir_id: str, since: date, until: date) -> list[Measurement]:
    """Daily measurements for one reservoir over a date range, oldest first."""
    url = (
        f"{MEDICAO}?dropDownListEstados={ESTADO_PB}"
        f"&dropDownListReservatorios={reservoir_id}"
        f"&dataInicial={since:%d/%m/%Y}&dataFinal={until:%d/%m/%Y}&button=Buscar"
    )
    page = cached_get(f"medicao_{reservoir_id}.html", url)

    rows = []
    for row_html in _ROW.findall(page):
        cells = _cells(row_html)
        if len(cells) != 7 or cells[0] == "Estado":
            continue
        try:
            dia = datetime.strptime(cells[6], "%d/%m/%Y").date()
        except ValueError:
            continue
        rows.append(Measurement(dia, _decimal(cells[2]), _decimal(cells[3]), _decimal(cells[4]), _decimal(cells[5])))
    rows.sort(key=lambda m: m.dia)
    return rows


def monthly(rows: list[Measurement], until: date, months: int = 12) -> list[dict]:
    """Last reading of each of the `months` calendar months ending at `until`, oldest first.

    Months without a reading carry null. Small reservoirs are gauged irregularly,
    so compressing the gaps away would draw a sparkline whose points sit years
    apart while looking evenly spaced.
    """
    buckets: dict[str, Measurement] = {}
    for row in rows:
        if row.percentual is not None:
            buckets[f"{row.dia:%Y-%m}"] = row

    keys = []
    year, month = until.year, until.month
    for _ in range(months):
        keys.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            year, month = year - 1, 12
    keys.reverse()

    return [
        {
            "mes": key,
            "volume_hm3": buckets[key].volume_hm3 if key in buckets else None,
            "percentual": buckets[key].percentual if key in buckets else None,
        }
        for key in keys
    ]


def latest(rows: list[Measurement]) -> Measurement | None:
    for row in reversed(rows):
        if row.percentual is not None:
            return row
    return None


def collect(since: date, until: date) -> dict[str, dict]:
    """Every Paraíba reservoir keyed by normalized name, with its current reading and monthly series."""
    result = {}
    for reservoir_id, name in reservoirs():
        rows = series(reservoir_id, since, until)
        current = latest(rows)
        result[normalize(name)] = {
            "sar_id": reservoir_id,
            "sar_nome": name,
            "capacidade_hm3": current.capacidade_hm3 if current else None,
            "volume_hm3": current.volume_hm3 if current else None,
            "percentual": current.percentual if current else None,
            "data_volume": current.dia.isoformat() if current else None,
            "serie_mensal": monthly(rows, until),
            "leituras": len(rows),
            "primeira_leitura": rows[0].dia.isoformat() if rows else None,
        }
    return result
