"""IBGE SIDRA aggregates API (v3): one call returns one variable for every município of a state."""
import json

from .provenance import fetch

BASE = "https://servicodados.ibge.gov.br/api/v3/agregados/{table}/periodos/{period}/variaveis/{variable}?localidades=N6[N3[25]]"
LICENSE = "IBGE open data"
MISSING = {"-", "...", "X", "..", ""}


def sidra_url(table: int, variable: int, period: str, classification: str | None = None) -> str:
    url = BASE.format(table=table, variable=variable, period=period)
    return f"{url}&classificacao={classification}" if classification else url


def sidra_values(name: str, table: int, variable: int, period: str, classification: str | None = None) -> tuple[dict[str, float], str]:
    url = sidra_url(table, variable, period, classification)
    path = fetch(name, url, license=LICENSE)
    payload = json.loads(path.read_text())
    values = {}
    for serie in payload[0]["resultados"][0]["series"]:
        raw = serie["serie"][period]
        if raw not in MISSING:
            values[str(serie["localidade"]["id"])] = float(raw)
    return values, url
