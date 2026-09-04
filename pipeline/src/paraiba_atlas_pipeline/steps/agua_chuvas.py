"""AESA rain posts from the SEIRA API: the SUDENE gauge network with converted coordinates.

Posts encode latitude and longitude as DDMM in the southern and western
hemispheres, so 731.0 means 7 degrees 31 minutes south. Every converted point
is checked against the state outline and dropped if it falls outside Paraíba.
"""
from datetime import date

import geopandas as gpd
from shapely.geometry import Point

from ..manifest import record, write_json
from ..paths import OUT_DIR
from .agua_acudes import API, SeiraForbidden, SeiraUnavailable, embedded, fetch


def ddmm_to_degrees(value: float | None, sign: int) -> float | None:
    """SEIRA writes 0.0 when a post has no surveyed coordinate, which is not a real position."""
    if not value:
        return None
    degrees, minutes = divmod(abs(value), 100)
    return sign * (degrees + minutes / 60)


def state_outline():
    municipios = gpd.read_file(OUT_DIR / "geo" / "municipios.geojson")
    return municipios.geometry.union_all().buffer(0.02)


def precipitation_by_post() -> dict[int, dict]:
    """Recent rainfall per post, empty when SEIRA exposes no public pluviometria resource."""
    try:
        payload = fetch("pluviometria", name="pluviometria.json", retries=2, timeout=30)
    except (SeiraUnavailable, SeiraForbidden):
        return {}
    rows = payload if isinstance(payload, list) else embedded(payload, "pluviometria")
    readings = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        post_id = row.get("idPostoSudene") or row.get("id")
        value = row.get("valor") or row.get("precipitacao")
        if post_id is not None and value is not None:
            readings[post_id] = {"mm": value, "data": row.get("data")}
    return readings


def run() -> None:
    payload = fetch("posto-sudene", name="posto-sudene.json")
    posts = embedded(payload, "postoSudene") or embedded(payload, "posto-sudene") or (payload if isinstance(payload, list) else [])
    readings = precipitation_by_post()
    outline = state_outline()

    features, missing_coord, outside_state = [], [], []
    for post in posts:
        lat = ddmm_to_degrees(post.get("latitude"), -1)
        lon = ddmm_to_degrees(post.get("longitude"), -1)
        if lat is None or lon is None:
            missing_coord.append(post.get("nome"))
            continue
        if not outline.contains(Point(lon, lat)):
            outside_state.append(post.get("nome"))
            continue
        reading = readings.get(post["id"], {})
        features.append({
            "type": "Feature",
            "properties": {
                "id": post["id"],
                "nome": (post.get("nome") or "").title(),
                "codigo": post.get("codigo"),
                "altitude_m": post.get("altitude"),
                "chuva_mm": reading.get("mm"),
                "data_chuva": reading.get("data"),
            },
            "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]},
        })

    write_json("agua/postos_chuva.geojson", {"type": "FeatureCollection", "features": features})
    with_rain = sum(1 for f in features if f["properties"]["chuva_mm"] is not None)
    record(
        "agua.postos_chuva",
        source="AESA, SEIRA (rede pluviométrica SUDENE)",
        source_url=f"{API}/posto-sudene",
        year=date.today().year,
        year_note="SEIRA publishes no reference year; year is the fetch year",
        rows=len(features),
        refreshed_at=date.today().isoformat(),
        with_rain=with_rain,
        sem_coordenada=len(missing_coord),
        fora_do_estado=len(outside_state),
        rain_note=None if with_rain else "Leituras de chuva exigem autenticação no SEIRA; só o cadastro dos postos é público.",
    )
    print(f"postos de chuva: {len(features)} mapeados, {len(missing_coord)} sem coordenada, {len(outside_state)} fora do estado, {with_rain} com leitura")
    if missing_coord:
        print(f"  sem coordenada no SEIRA: {', '.join(str(n) for n in missing_coord)}")
    if outside_state:
        print(f"  fora da Paraíba: {', '.join(str(n) for n in outside_state)}")
