"""Embrapa Solos, Mapa exploratório de reconhecimento de solos do Estado da Paraíba (1972, 1:500.000), GeoInfo WFS."""
import json

from ..geo import class_shares, clip_to_state, features_to_gdf, gdf_to_geojson
from ..manifest import record, write_json
from ..paths import PIPELINE_ROOT
from ..provenance import fetch

URL = ("https://geoinfo.dados.embrapa.br/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature"
       "&typename=geonode%3Asolos_paraiba_wgs84_1&outputFormat=json&srs=EPSG%3A4326")
LICENSE = "Embrapa GeoInfo (license field empty on the dataset page)"
LABEL_FIELDS = ("sibcs", "legenda_1972", "explicacao", "confirmado", "ressalva", "fonte")


def soil_order(legenda: str) -> str:
    return legenda.split(" - ", 1)[0].strip() if legenda else "sem classe"


def soil_labels(present: set[str]) -> dict[str, dict]:
    """The 1972 legend names predate SiBCS, so each class carries its modern name and a plain-Portuguese gloss."""
    legendas = json.loads((PIPELINE_ROOT / "data" / "legendas.json").read_text())["solos"]
    return {
        classe: {field: legendas[classe][field] for field in LABEL_FIELDS if field in legendas[classe]}
        for classe in sorted(present)
        if classe in legendas
    }


def run() -> None:
    payload = json.loads(fetch("embrapa_solos_paraiba.geojson", URL, license=LICENSE, timeout=300).read_text())
    gdf = features_to_gdf(payload["features"])
    gdf["classe"] = gdf["legenda"].map(soil_order)
    gdf["descricao"] = gdf["legenda"].map(lambda l: l.split(" - ", 1)[1].strip() if l and " - " in l else l)
    gdf = clip_to_state(gdf[["solos", "textura", "rotulo", "legenda", "classe", "descricao", "geometry"]], tolerance=0.001)
    write_json("geo/terra/solos.geojson", gdf_to_geojson(gdf))

    present = set(gdf["classe"].dropna())
    labels = soil_labels(present)
    write_json("geo/terra/solos_classes.json", {
        "classe": class_shares(gdf, "classe"),
        "textura": class_shares(gdf, "textura"),
        "labels": labels,
    })
    record("terra.solos", source="Embrapa Solos, Mapa exploratório de reconhecimento de solos da Paraíba (1972)", source_url=URL, year=1972,
           rows=len(gdf), path="geo/terra/solos.geojson")
    missing = sorted(present - set(labels))
    print(f"solos: {len(gdf)} polígonos, {len(present)} classes, {len(labels)} com nome SiBCS"
          + (f"; sem legenda: {missing}" if missing else ""))
