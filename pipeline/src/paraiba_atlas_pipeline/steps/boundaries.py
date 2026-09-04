"""IBGE municipal and mesorregião boundaries for Paraíba (UF 25), keyed by 7-digit IBGE code."""
import json

import geopandas as gpd
from shapely.geometry import box, mapping

from ..manifest import record, write_json
from ..provenance import fetch

UF = "25"
MALHAS = "https://servicodados.ibge.gov.br/api/v3/malhas/estados/{uf}?formato=application/vnd.geo+json&qualidade={q}&intrarregiao={level}"
LOCALIDADES = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios"
LICENSE = "IBGE open data (Lei 12.527/2011, dados abertos)"


def municipio_index() -> dict[str, dict]:
    path = fetch("ibge_municipios_pb.json", LOCALIDADES.format(uf=UF), license=LICENSE)
    rows = json.loads(path.read_text())
    index = {}
    for row in rows:
        meso = row["microrregiao"]["mesorregiao"]
        index[str(row["id"])] = {"nome": row["nome"], "meso": str(meso["id"]), "meso_nome": meso["nome"]}
    return index


def run() -> None:
    index = municipio_index()

    muni_path = fetch("ibge_malha_municipios_pb.geojson", MALHAS.format(uf=UF, q="intermediaria", level="municipio"), license=LICENSE)
    munis = gpd.read_file(muni_path)
    munis["cod"] = munis["codarea"].astype(str)
    munis["nome"] = munis["cod"].map(lambda c: index[c]["nome"])
    munis["meso"] = munis["cod"].map(lambda c: index[c]["meso"])
    munis = munis[["cod", "nome", "meso", "geometry"]]
    munis["geometry"] = munis.geometry.simplify(0.001, preserve_topology=True)
    write_json("geo/municipios.geojson", json.loads(munis.to_json(drop_id=True)))
    record("geo.municipios", source="IBGE malhas municipais 2022", source_url=MALHAS.format(uf=UF, q="intermediaria", level="municipio"), year=2022, rows=len(munis))

    meso_path = fetch("ibge_malha_mesorregioes_pb.geojson", MALHAS.format(uf=UF, q="intermediaria", level="mesorregiao"), license=LICENSE)
    mesos = gpd.read_file(meso_path)
    mesos["cod"] = mesos["codarea"].astype(str)
    meso_names = {v["meso"]: v["meso_nome"] for v in index.values()}
    mesos["nome"] = mesos["cod"].map(meso_names)
    mesos = mesos[["cod", "nome", "geometry"]]
    mesos["geometry"] = mesos.geometry.simplify(0.001, preserve_topology=True)
    write_json("geo/mesorregioes.geojson", json.loads(mesos.to_json(drop_id=True)))
    record("geo.mesorregioes", source="IBGE malhas 2022, mesorregiões", source_url=MALHAS.format(uf=UF, q="intermediaria", level="mesorregiao"), year=2022, rows=len(mesos))

    labels = mesos.copy()
    labels["geometry"] = mesos.geometry.representative_point()
    write_json("geo/mesorregioes_labels.geojson", json.loads(labels.to_json(drop_id=True)))

    state = mesos.geometry.union_all().buffer(0)
    mask = box(-60, -25, -25, 5).difference(state)
    write_json("geo/mask.geojson", {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": mapping(mask)}]})

    write_json("geo/municipios_index.json", index)
    print(f"municípios: {len(munis)}  mesorregiões: {len(mesos)}  {sorted(meso_names.values())}")
