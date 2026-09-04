"""SGB (Serviço Geológico do Brasil) lithostratigraphic units, 1:1.000.000 [2004], ArcGIS REST MapServer, clipped to Paraíba."""
from ..arcgis import features_by_ids, object_ids_in_bbox
from ..geo import class_shares, clip_to_state, features_to_gdf, gdf_to_geojson
from ..manifest import record, write_json

LAYER = "https://geoportal.sgb.gov.br/server/rest/services/geologia/litoestratigrafia_1000000/MapServer/0"
FIELDS = "SIGLA,NOME,LITOTIPOS,AMBIENTE_TECTONICO,ERA_MIN,ERA_MAX,IDADE_MIN,IDADE_MAX,LEGENDA"
LICENSE = "SGB/CPRM open geoscience data (GeoSGB)"


def run() -> None:
    ids = object_ids_in_bbox(LAYER, "sgb_lito_1M_pb_ids.json", LICENSE)
    features = features_by_ids(LAYER, "sgb_lito_1M_pb", ids, FIELDS, LICENSE)
    gdf = clip_to_state(features_to_gdf(features), tolerance=0.0015)
    gdf["ERA_MAX"] = gdf["ERA_MAX"].fillna("sem era")
    write_json("geo/terra/geologia.geojson", gdf_to_geojson(gdf))
    write_json("geo/terra/geologia_classes.json", {
        "era_max": class_shares(gdf, "ERA_MAX"),
        "unidades": class_shares(gdf, "NOME"),
    })
    record("terra.geologia", source="SGB, Unidades litoestratigráficas 1:1.000.000 (2004)", source_url=LAYER, year=2004,
           rows=len(gdf), path="geo/terra/geologia.geojson")
    print(f"geologia: {len(ids)} ids fetched, {len(gdf)} polygons after clip, {gdf['NOME'].nunique()} unidades, eras {sorted(gdf['ERA_MAX'].unique())}")
