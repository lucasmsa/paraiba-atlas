"""One metric file per indicator: values keyed by município code plus the derived fields the app never computes."""
import json
import statistics

from .manifest import record, write_json
from .paths import OUT_DIR


def _quantile_breaks(values: list[float], bins: int = 5) -> list[float]:
    """Distinct edges only: when many municípios share a value, repeated edges would
    render as empty ranges like "up to 0" sitting above "0 to 10"."""
    ordered = sorted(values)
    edges = [ordered[min(len(ordered) - 1, round(i * len(ordered) / bins))] for i in range(1, bins)]
    return sorted(set(edges))


def _meso_aggregate(values: dict[str, float], index: dict[str, dict], method: str, weights: dict[str, float] | None) -> dict[str, float]:
    groups: dict[str, list[tuple[float, float]]] = {}
    for cod, value in values.items():
        weight = 1.0 if weights is None else weights.get(cod, 0.0)
        groups.setdefault(index[cod]["meso"], []).append((value, weight))
    if method == "sum":
        return {meso: sum(v for v, _ in pairs) for meso, pairs in groups.items()}
    return {meso: sum(v * w for v, w in pairs) / sum(w for _, w in pairs) for meso, pairs in groups.items() if sum(w for _, w in pairs) > 0}


def emit_metric(*, layer_id: str, path: str, label: str, unit: str, year: int, source: str, source_url: str,
                values: dict[str, float], meso_method: str, weights: dict[str, float] | None = None,
                higher_is: str = "neutral") -> None:
    index = json.loads((OUT_DIR / "geo" / "municipios_index.json").read_text())
    ordered = sorted(values.items(), key=lambda kv: kv[1], reverse=True)
    n = len(ordered)
    rank = {cod: i + 1 for i, (cod, _) in enumerate(ordered)}
    percentile = {cod: round(100 * (n - r) / (n - 1)) for cod, r in rank.items()}
    payload = {
        "id": layer_id, "label": label, "unit": unit, "year": year, "source": source, "source_url": source_url,
        "n": n, "higher_is": higher_is,
        "min": min(values.values()),
        "max": max(values.values()),
        "state_median": statistics.median(values.values()),
        "state_total": sum(values.values()) if meso_method == "sum" else None,
        "breaks": _quantile_breaks(list(values.values())),
        "values": values, "rank": rank, "percentile": percentile,
        "meso": _meso_aggregate(values, index, meso_method, weights), "meso_method": meso_method,
    }
    write_json(path, payload)
    record(layer_id, source=source, source_url=source_url, year=year, rows=n, path=path)
