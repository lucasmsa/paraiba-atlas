"""ERA5 climate normals (2014-2023) on an H3 grid over Paraíba, via the Open-Meteo historical archive."""
import json
import time
from collections import defaultdict
from statistics import mean

import h3
import requests
from shapely.geometry import shape
from shapely.ops import unary_union

from ..manifest import record, write_json
from ..paths import OUT_DIR, RAW_DIR
from ..provenance import fetch

RESOLUTION = 5
START, END = "2014-01-01", "2023-12-31"
PERIOD = "2014-2023"
DAILY = "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,sunshine_duration"
ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
LICENSE = "Open-Meteo, CC BY 4.0 (ERA5: Copernicus Climate Change Service)"
VARIABLES = {
    "tmax": "°C, média das máximas diárias",
    "tmin": "°C, média das mínimas diárias",
    "tmean": "°C, média diária",
    "precip": "mm, total mensal médio",
    "sun": "horas de sol por dia, média",
}
PAUSE_SECONDS = 1.0
MINUTE_BACKOFF_SECONDS = (30, 60, 120)


class QuotaExhausted(RuntimeError):
    """Open-Meteo's hourly or daily budget is spent; the cache keeps what was fetched, re-run later."""


def state_cells() -> list[str]:
    features = json.loads((OUT_DIR / "geo" / "municipios.geojson").read_text())["features"]
    outline = unary_union([shape(f["geometry"]) for f in features])
    return sorted(h3.geo_to_cells(outline, RESOLUTION))


def archive_url(lat: float, lng: float) -> str:
    return (f"{ARCHIVE}?latitude={lat:.4f}&longitude={lng:.4f}&start_date={START}&end_date={END}"
            f"&daily={DAILY}&timezone=America%2FFortaleza")


def _limit_reason(error: requests.HTTPError) -> str:
    try:
        return error.response.json().get("reason", "")
    except ValueError:
        return error.response.text[:120]


def fetch_cell(cell: str) -> dict:
    lat, lng = h3.cell_to_latlng(cell)
    (RAW_DIR / "open_meteo").mkdir(parents=True, exist_ok=True)
    for attempt, backoff in enumerate((*MINUTE_BACKOFF_SECONDS, None)):
        try:
            path = fetch(f"open_meteo/{cell}.json", archive_url(lat, lng), license=LICENSE)
            return json.loads(path.read_text())
        except requests.HTTPError as error:
            if error.response.status_code != 429:
                raise
            reason = _limit_reason(error)
            if "Minutely" not in reason or backoff is None:
                raise QuotaExhausted(reason) from error
            print(f"  429 on {cell} ({reason}), waiting {backoff}s (attempt {attempt + 1})")
            time.sleep(backoff)
    raise RuntimeError("unreachable")


def cached(cell: str) -> bool:
    return (RAW_DIR / "open_meteo" / f"{cell}.json").exists()


def month_of(day: str) -> int:
    return int(day[5:7])


def monthly_normals(daily: dict) -> dict[str, list[float]]:
    days = daily["time"]
    per_month = {key: defaultdict(list) for key in ("tmax", "tmin", "tmean", "sun")}
    precip_by_year_month = defaultdict(float)
    series = {
        "tmax": daily["temperature_2m_max"], "tmin": daily["temperature_2m_min"], "tmean": daily["temperature_2m_mean"],
        "sun": daily["sunshine_duration"], "precip": daily["precipitation_sum"],
    }
    for i, day in enumerate(days):
        month = month_of(day)
        for key in ("tmax", "tmin", "tmean"):
            if series[key][i] is not None:
                per_month[key][month].append(series[key][i])
        if series["sun"][i] is not None:
            per_month["sun"][month].append(series["sun"][i] / 3600)
        if series["precip"][i] is not None:
            precip_by_year_month[(day[:4], month)] += series["precip"][i]

    normals = {key: [round(mean(per_month[key][m]), 1) for m in range(1, 13)] for key in per_month}
    monthly_totals = defaultdict(list)
    for (_, month), total in precip_by_year_month.items():
        monthly_totals[month].append(total)
    normals["precip"] = [round(mean(monthly_totals[m]), 1) for m in range(1, 13)]
    return normals


def state_means(cells: dict[str, dict[str, list[float]]]) -> dict[str, list[float]]:
    return {key: [round(mean(c[key][m] for c in cells.values()), 1) for m in range(12)] for key in VARIABLES}


def run() -> None:
    cells = state_cells()
    print(f"clima: {len(cells)} células H3 res {RESOLUTION}")
    pending = [c for c in cells if not cached(c)]
    print(f"clima: {len(cells) - len(pending)} em cache, {len(pending)} a buscar", flush=True)
    normals = {}
    for i, cell in enumerate(cells):
        was_cached = cached(cell)
        try:
            payload = fetch_cell(cell)
        except QuotaExhausted as quota:
            done = sum(1 for c in cells if cached(c))
            raise SystemExit(f"clima: cota da Open-Meteo esgotada ({quota}); {done}/{len(cells)} células em cache, "
                             f"nada emitido. Rode o passo de novo na próxima hora.") from None
        normals[cell] = monthly_normals(payload["daily"])
        if not was_cached:
            time.sleep(PAUSE_SECONDS)
        if (i + 1) % 25 == 0:
            print(f"  {i + 1}/{len(cells)}", flush=True)
    output = {
        "res": RESOLUTION, "period": PERIOD,
        "source": "Open-Meteo Historical Weather API (ERA5), normais 2014-2023",
        "source_url": archive_url(*h3.cell_to_latlng(cells[0])),
        "variables": VARIABLES,
        "state": state_means(normals),
        "cells": normals,
    }
    write_json("agua/clima.json", output)
    record("agua.clima", source=output["source"], source_url=ARCHIVE, year=2023, rows=len(cells), path="agua/clima.json")
    print(f"clima: escrito {len(normals)} células")
