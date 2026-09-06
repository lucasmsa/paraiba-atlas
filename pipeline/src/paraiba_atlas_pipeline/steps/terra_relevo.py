"""Real topography for Paraíba: hypsometric bands and contour lines, from the AWS Terrain Tiles DEM.

The atlas already loads these same tiles for 3D relief, so the elevation shown on the map and
the elevation behind these layers come from one source. Terrarium encoding packs metres into
RGB as (R * 256 + G + B / 256) - 32768.
"""
import io
import math

import geopandas as gpd
import matplotlib
import numpy as np
import rasterio.features
from affine import Affine
from PIL import Image
from scipy.ndimage import gaussian_filter
from shapely.geometry import LineString, shape

from ..geo import class_shares, clip_to_state, state_outline
from ..manifest import record, write_json
from ..paths import RAW_DIR
from ..provenance import fetch

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402  (backend must be set first)

ZOOM = 11
TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
LICENSE = "AWS Terrain Tiles, public domain / CC-BY per source (SRTM, ASTER, NED and others)"
TILE_PX = 256
EARTH_HALF = 20037508.342789244

# Bands follow Paraíba's own physiography rather than a generic ramp: the coastal tabuleiros,
# the Agreste transition, the Borborema plateau where Campina Grande sits near 550 m, and the
# serras above it. See the printed distribution for the share each one holds.
BANDS = [
    (-100, 100, "0 a 100 m"),
    (100, 200, "100 a 200 m"),
    (200, 300, "200 a 300 m"),
    (300, 500, "300 a 500 m"),
    (500, 700, "500 a 700 m"),
    (700, 900, "700 a 900 m"),
    (900, 9000, "acima de 900 m"),
]
CONTOUR_INTERVAL = 100
INDEX_EVERY = 500

MIN_BAND_KM2 = 1.5
MIN_CONTOUR_M = 800
SMOOTH_SIGMA = 2.0


def _tile_x(lon: float, z: int) -> int:
    return int((lon + 180.0) / 360.0 * (2**z))


def _tile_y(lat: float, z: int) -> int:
    rad = math.radians(lat)
    return int((1.0 - math.log(math.tan(rad) + 1 / math.cos(rad)) / math.pi) / 2.0 * (2**z))


def tile_range(bounds: tuple[float, float, float, float], z: int) -> tuple[int, int, int, int]:
    west, south, east, north = bounds
    return _tile_x(west, z), _tile_y(north, z), _tile_x(east, z), _tile_y(south, z)


def _decode(path) -> np.ndarray:
    rgb = np.asarray(Image.open(io.BytesIO(path.read_bytes())).convert("RGB")).astype(np.float32)
    return (rgb[:, :, 0] * 256.0 + rgb[:, :, 1] + rgb[:, :, 2] / 256.0) - 32768.0


def mosaic(bounds: tuple[float, float, float, float]) -> tuple[np.ndarray, Affine]:
    x0, y0, x1, y1 = tile_range(bounds, ZOOM)
    columns, rows = x1 - x0 + 1, y1 - y0 + 1
    grid = np.zeros((rows * TILE_PX, columns * TILE_PX), dtype=np.float32)

    total = columns * rows
    for index, (tile_x, tile_y) in enumerate(((x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)), start=1):
        (RAW_DIR / "terrarium" / str(ZOOM) / str(tile_x)).mkdir(parents=True, exist_ok=True)
        path = fetch(f"terrarium/{ZOOM}/{tile_x}/{tile_y}.png", TILES.format(z=ZOOM, x=tile_x, y=tile_y), license=LICENSE)
        row, column = (tile_y - y0) * TILE_PX, (tile_x - x0) * TILE_PX
        grid[row:row + TILE_PX, column:column + TILE_PX] = _decode(path)
        if index % 60 == 0 or index == total:
            print(f"  tiles {index}/{total}")

    span = 2 * EARTH_HALF / (2**ZOOM)
    pixel = span / TILE_PX
    transform = Affine(pixel, 0, -EARTH_HALF + x0 * span, 0, -pixel, EARTH_HALF - y0 * span)
    return grid, transform


def band_polygons(elevation: np.ndarray, transform: Affine) -> gpd.GeoDataFrame:
    labels = np.full(elevation.shape, -1, dtype=np.int16)
    for index, (low, high, _) in enumerate(BANDS):
        labels[(elevation >= low) & (elevation < high)] = index

    rows = []
    for geometry, value in rasterio.features.shapes(labels, mask=labels >= 0, transform=transform, connectivity=4):
        rows.append({"faixa": BANDS[int(value)][2], "ordem": int(value), "geometry": shape(geometry)})
    gdf = gpd.GeoDataFrame(rows, geometry="geometry", crs="EPSG:3857").to_crs("EPSG:4326")
    return gdf


def contour_lines(elevation: np.ndarray, transform: Affine) -> gpd.GeoDataFrame:
    height, width = elevation.shape
    xs = transform.c + (np.arange(width) + 0.5) * transform.a
    ys = transform.f + (np.arange(height) + 0.5) * transform.e
    levels = list(range(CONTOUR_INTERVAL, int(np.nanmax(elevation)) + CONTOUR_INTERVAL, CONTOUR_INTERVAL))

    figure = plt.figure()
    contours = plt.contour(xs, ys, elevation, levels=levels)
    rows = []
    for level, segments in zip(contours.levels, contours.allsegs):
        for segment in segments:
            if len(segment) < 3:
                continue
            line = LineString(segment)
            if line.length < MIN_CONTOUR_M:
                continue
            rows.append({"cota": int(level), "indice": int(level) % INDEX_EVERY == 0, "geometry": line})
    plt.close(figure)

    return gpd.GeoDataFrame(rows, geometry="geometry", crs="EPSG:3857").to_crs("EPSG:4326")


def _report_distribution(elevation: np.ndarray, inside: np.ndarray) -> None:
    values = elevation[inside]
    print(f"  elevação dentro da PB: min {values.min():.0f} m, max {values.max():.0f} m, mediana {np.median(values):.0f} m")
    for low, high, label in BANDS:
        share = float(((values >= low) & (values < high)).mean())
        print(f"    {label:>16}: {share * 100:5.1f}% dos pixels")


def run() -> None:
    outline = state_outline()
    bounds = tuple(outline.total_bounds)
    elevation, transform = mosaic(bounds)

    inside = rasterio.features.geometry_mask(
        [g.__geo_interface__ for g in outline.to_crs("EPSG:3857").geometry],
        out_shape=elevation.shape, transform=transform, invert=True,
    )
    _report_distribution(elevation, inside)
    peak = np.unravel_index(np.argmax(np.where(inside, elevation, -9999)), elevation.shape)
    peak_x, peak_y = transform * (peak[1] + 0.5, peak[0] + 0.5)
    peak_point = gpd.GeoSeries.from_xy([peak_x], [peak_y], crs="EPSG:3857").to_crs("EPSG:4326")[0]
    print(f"  ponto mais alto: {elevation[peak]:.0f} m em {peak_point.y:.4f}, {peak_point.x:.4f}")

    smoothed = gaussian_filter(elevation, sigma=SMOOTH_SIGMA)

    bands = clip_to_state(band_polygons(smoothed, transform), tolerance=0.0015)
    bands = bands[bands["area_km2"] >= MIN_BAND_KM2].sort_values("ordem").reset_index(drop=True)
    write_json("geo/terra/hipsometria.geojson", _geojson(bands, ["faixa", "ordem", "area_km2"]))
    write_json("geo/terra/hipsometria_classes.json", {"faixa": class_shares(bands, "faixa")})
    record("terra.hipsometria", source=f"AWS Terrain Tiles (terrarium), zoom {ZOOM}, ~76 m/px",
           source_url=TILES.format(z=ZOOM, x="{x}", y="{y}"), year=2026,
           year_note="O mosaico não declara ano; combina SRTM, ASTER e outras fontes. O ano é o da coleta.",
           rows=len(bands), path="geo/terra/hipsometria.geojson")

    contours = gpd.clip(contour_lines(smoothed, transform), outline)
    contours = contours[~contours.geometry.is_empty]
    contours["geometry"] = contours.geometry.simplify(0.0012, preserve_topology=False)
    contours = contours[~contours.geometry.is_empty].reset_index(drop=True)
    write_json("geo/terra/curvas_nivel.geojson", _geojson(contours, ["cota", "indice"]))
    record("terra.curvas_nivel", source=f"AWS Terrain Tiles (terrarium), zoom {ZOOM}, ~76 m/px",
           source_url=TILES.format(z=ZOOM, x="{x}", y="{y}"), year=2026,
           year_note=f"Curvas geradas a cada {CONTOUR_INTERVAL} m a partir do modelo de elevação.",
           rows=len(contours), path="geo/terra/curvas_nivel.geojson")

    print(f"hipsometria: {len(bands)} polígonos em {len(BANDS)} faixas")
    print(f"curvas de nível: {len(contours)} linhas de {CONTOUR_INTERVAL} em {CONTOUR_INTERVAL} m")


def _geojson(gdf: gpd.GeoDataFrame, columns: list[str], precision: int = 5) -> dict:
    from ..geo import _round_coords
    import json

    slim = gdf[[*columns, "geometry"]]
    collection = json.loads(slim.to_json(drop_id=True, to_wgs84=True))
    for feature in collection["features"]:
        geometry = feature["geometry"]
        if geometry:
            geometry["coordinates"] = _round_coords(geometry["coordinates"], precision)
        feature["properties"] = {k: (round(v, 1) if isinstance(v, float) else v) for k, v in feature["properties"].items()}
    return collection
