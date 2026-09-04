"""SGB Mapa Hidrogeológico do Estado da Paraíba, ArcGIS REST MapServer: Hidrogeologia (layer 4) and Domínio Hidrolitológico (layer 5)."""
import json
import re
from datetime import date

from ..arcgis import features_paged
from ..geo import class_shares, clip_to_state, features_to_gdf, gdf_to_geojson
from ..manifest import record, write_json
from ..paths import PIPELINE_ROOT
from ..provenance import fetch

SERVICE = "https://geoportal.sgb.gov.br/server/rest/services/hidrologia/Mapa_Midrogeologico_Paraiba/MapServer"
LICENSE = "SGB/CPRM open geoscience data (GeoSGB)"
HIDRO_FIELDS = "sgl_ue_afl,nom_ue_afl,l_ue_afl,u_hl_afl,u_he_afl,q_he_afl,prod_he_afl,cl_he_afl,grau_frat,e_int,cls_style"
YEAR_NOTE = "service JSON states no publication year; year is the fetch year"


def legendas() -> dict:
    return json.loads((PIPELINE_ROOT / "data" / "legendas.json").read_text())


def produtividade_labels(present: set[str], source: dict) -> dict[str, dict]:
    """PROD_HE_AFL stores a class code, not a flow rate; the bands come from the SGB cartography manual."""
    return {code: source[code] for code in sorted(present) if code in source}


def dominio_labels(values: set[str], source: dict) -> dict[str, dict]:
    """Domain values arrive either as the bare code (Fr) or spelled out with it (Fraturada (Fr))."""
    labels = {}
    for value in sorted(values):
        match = re.search(r"\((\w+)\)\s*$", value)
        code = match.group(1) if match else value
        if code in source:
            labels[value] = source[code]
    return labels


def run() -> None:
    service = json.loads(fetch("sgb_hidro_pb_service.json", f"{SERVICE}?f=json", license=LICENSE).read_text())
    ids = {layer["name"]: layer["id"] for layer in service["layers"]}
    year = date.today().year
    legend = legendas()

    hidro = features_paged(f"{SERVICE}/{ids['Hidrogeologia']}", "sgb_hidro_pb_hidrogeologia", HIDRO_FIELDS, LICENSE)
    gdf = clip_to_state(features_to_gdf(hidro), tolerance=0.002)
    gdf["dominio"] = gdf["cls_style"].fillna("").str.extract(r"\)\s*(\w+)")[0].fillna("sem classe")
    write_json("geo/terra/aquiferos.geojson", gdf_to_geojson(gdf))
    write_json("geo/terra/aquiferos_classes.json", {
        "unidade": class_shares(gdf, "nom_ue_afl"),
        "dominio": class_shares(gdf, "dominio"),
        "produtividade": class_shares(gdf, "prod_he_afl"),
        "labels": {
            "produtividade": produtividade_labels(set(gdf["prod_he_afl"].dropna().astype(str)), legend["aquiferos_produtividade"]),
            "dominio": dominio_labels(set(gdf["dominio"].dropna()), legend["dominios"]),
        },
        "nota_produtividade": legend["aquiferos_produtividade"]["_nota"],
    })
    record("terra.aquiferos", source="SGB, Mapa Hidrogeológico do Estado da Paraíba, Hidrogeologia", source_url=f"{SERVICE}/{ids['Hidrogeologia']}",
           year=year, year_note=YEAR_NOTE, rows=len(gdf), path="geo/terra/aquiferos.geojson")

    dom = features_paged(f"{SERVICE}/{ids['Domínio Hidrolitológico']}", "sgb_hidro_pb_dominios", "u_hl_afl", LICENSE)
    gdom = clip_to_state(features_to_gdf(dom), tolerance=0.002)
    gdom = gdom.rename(columns={"u_hl_afl": "dominio"})
    write_json("geo/terra/dominios_hidro.geojson", gdf_to_geojson(gdom))
    write_json("geo/terra/dominios_hidro_classes.json", {
        "dominio": class_shares(gdom, "dominio"),
        "labels": {"dominio": dominio_labels(set(gdom["dominio"].dropna()), legend["dominios"])},
    })
    record("terra.dominios_hidro", source="SGB, Mapa Hidrogeológico do Estado da Paraíba, Domínio Hidrolitológico",
           source_url=f"{SERVICE}/{ids['Domínio Hidrolitológico']}", year=year, year_note=YEAR_NOTE, rows=len(gdom), path="geo/terra/dominios_hidro.geojson")
    print(f"aquiferos: {len(gdf)} polígonos, {gdf['nom_ue_afl'].nunique()} unidades, "
          f"produtividade {sorted(set(gdf['prod_he_afl'].dropna().astype(str)))}; dominios: {len(gdom)} polígonos")
