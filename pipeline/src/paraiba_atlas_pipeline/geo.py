"""Shared vector helpers: state outline, clip, simplify, area shares. Every Terra polygon layer goes through here."""
import json
from collections import defaultdict

import geopandas as gpd
from shapely.geometry import shape

from .paths import OUT_DIR

AREA_CRS = "EPSG:31985"  # SIRGAS 2000 / UTM 25S, covers Paraíba


def state_outline() -> gpd.GeoSeries:
    munis = gpd.read_file(OUT_DIR / "geo" / "municipios.geojson")
    return gpd.GeoSeries([munis.union_all()], crs="EPSG:4326")


def features_to_gdf(features: list[dict], crs: str = "EPSG:4326") -> gpd.GeoDataFrame:
    rows = [{**f.get("properties", {}), "geometry": shape(f["geometry"])} for f in features if f.get("geometry")]
    return gpd.GeoDataFrame(rows, geometry="geometry", crs=crs)


def clip_to_state(gdf: gpd.GeoDataFrame, tolerance: float) -> gpd.GeoDataFrame:
    outline = state_outline()
    clipped = gpd.clip(gdf, outline)
    clipped = clipped[~clipped.geometry.is_empty]
    clipped["geometry"] = clipped.geometry.simplify(tolerance, preserve_topology=True)
    clipped = clipped[~clipped.geometry.is_empty]
    clipped["area_km2"] = clipped.to_crs(AREA_CRS).area / 1e6
    return clipped.reset_index(drop=True)


def class_shares(gdf: gpd.GeoDataFrame, column: str) -> list[dict]:
    total = float(gdf["area_km2"].sum())
    counts: dict = defaultdict(lambda: {"count": 0, "area_km2": 0.0})
    for value, area in zip(gdf[column].fillna("sem classe"), gdf["area_km2"]):
        counts[value]["count"] += 1
        counts[value]["area_km2"] += float(area)
    return sorted(
        [{"value": k, "count": v["count"], "area_km2": round(v["area_km2"], 1), "share": round(v["area_km2"] / total, 4)} for k, v in counts.items()],
        key=lambda row: -row["area_km2"],
    )


def _round_coords(coords, precision: int):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], precision), round(coords[1], precision)]
    return [_round_coords(c, precision) for c in coords]


def gdf_to_geojson(gdf: gpd.GeoDataFrame, precision: int = 5) -> dict:
    collection = json.loads(gdf.to_json(drop_id=True, to_wgs84=True))
    for feature in collection["features"]:
        geometry = feature["geometry"]
        if geometry:
            geometry["coordinates"] = _round_coords(geometry["coordinates"], precision)
        feature["properties"] = {k: (round(v, 2) if isinstance(v, float) else v) for k, v in feature["properties"].items()}
    return collection
