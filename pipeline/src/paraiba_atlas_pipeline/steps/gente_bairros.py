"""Censo 2022 bairros for João Pessoa and Campina Grande, the only two Paraíba cities the atlas reads below município level.

IBGE publishes census results already aggregated to bairro, so no tract crosswalk is needed.
"""
import json
import zipfile

import geopandas as gpd
import pandas as pd

from ..manifest import record, write_json
from ..metrics import _quantile_breaks
from ..provenance import fetch

MALHA = (
    "https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/"
    "malhas_de_setores_censitarios__divisoes_intramunicipais/censo_2022/bairros/shp/UF/PB_bairros_CD2022.zip"
)
AGREGADOS = (
    "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/"
    "Agregados_por_Bairro_csv/Agregados_por_bairros_basico_BR_20260520.zip"
)
DICIONARIO = (
    "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/"
    "dicionario_de_dados_agregados_por_setores_censitarios_20260520.xlsx"
)
LICENSE = "IBGE open data (Lei 12.527/2011, dados abertos)"
YEAR = 2022

# Only these two municípios have a bairro division the census reports against.
CIDADES = {"2507507": "João Pessoa", "2504009": "Campina Grande"}

# Column meanings are quoted from the IBGE data dictionary sheet "Dicionário Básico".
POPULACAO = "v0001"
DOM_PARTICULARES = "v0003"
MEDIA_MORADORES = "v0005"
DOM_OCUPADOS = "v0007"
DOM_USO_OCASIONAL = "v0008"
DOM_VAGOS = "v0009"


def _numeric(frame: pd.DataFrame, column: str) -> pd.Series:
    """IBGE writes decimals with a comma and uses a bare dot for a suppressed value."""
    return pd.to_numeric(frame[column].str.replace(",", ".", regex=False), errors="coerce")


def _emit(*, layer_id: str, path: str, label: str, unit: str, values: dict[str, float], higher_is: str,
          source: str, source_url: str, note: str | None = None) -> None:
    ordered = sorted(values.values())
    payload = {
        "id": layer_id,
        "label": label,
        "unit": unit,
        "year": YEAR,
        "source": source,
        "source_url": source_url,
        "n": len(values),
        "higher_is": higher_is,
        "median": ordered[len(ordered) // 2],
        "breaks": _quantile_breaks(ordered),
        "values": values,
    }
    if note:
        payload["note"] = note
    write_json(path, payload)
    record(layer_id, source=source, source_url=source_url, year=YEAR, rows=len(values), path=path)


def _polygons() -> gpd.GeoDataFrame:
    path = fetch("ibge_bairros_pb_2022.zip", MALHA, license=LICENSE)
    bairros = gpd.read_file(f"zip://{path}")
    bairros = bairros[bairros["CD_MUN"].astype(str).isin(CIDADES)].copy()
    bairros["cod"] = bairros["CD_BAIRRO"].astype(str)
    bairros["nome"] = bairros["NM_BAIRRO"]
    bairros["municipio_cod"] = bairros["CD_MUN"].astype(str)
    bairros["municipio"] = bairros["municipio_cod"].map(CIDADES)
    bairros = bairros.to_crs(4326)
    # Bairros are small, so this keeps roughly 10 m of detail rather than the 100 m used for municípios.
    bairros["geometry"] = bairros.geometry.simplify(0.0001, preserve_topology=True)
    return bairros[["cod", "nome", "municipio_cod", "municipio", "geometry"]]


def _aggregates() -> pd.DataFrame:
    path = fetch("ibge_agregados_bairros_basico.zip", AGREGADOS, license=LICENSE)
    with zipfile.ZipFile(path) as archive:
        member = next(name for name in archive.namelist() if name.lower().endswith(".csv"))
        with archive.open(member) as handle:
            frame = pd.read_csv(handle, sep=";", encoding="latin-1", dtype=str)
    frame = frame[frame["CD_MUN"].isin(CIDADES)].copy()
    frame["cod"] = frame["CD_BAIRRO"].astype(str)
    return frame


def run() -> None:
    bairros = _polygons()
    write_json("geo/bairros.geojson", json.loads(bairros.to_json(drop_id=True)))
    record("geo.bairros", source="IBGE, malha de bairros do Censo 2022", source_url=MALHA, year=YEAR,
           rows=len(bairros), path="geo/bairros.geojson")

    frame = _aggregates()
    areas = bairros.set_index("cod").to_crs(31984).geometry.area / 1e6

    populacao = _numeric(frame, POPULACAO)
    particulares = _numeric(frame, DOM_PARTICULARES)
    sem_morador = _numeric(frame, DOM_USO_OCASIONAL) + _numeric(frame, DOM_VAGOS)

    def keyed(series: pd.Series) -> dict[str, float]:
        return {cod: round(float(v), 2) for cod, v in zip(frame["cod"], series) if pd.notna(v)}

    _emit(layer_id="bairros.populacao", path="gente/bairros/populacao.json",
          label="População", unit="pessoas", values=keyed(populacao), higher_is="neutral",
          source="IBGE, Censo 2022, agregados por bairro (V0001)", source_url=AGREGADOS,
          note="Bairro é uma divisão do perímetro urbano, então os bairros não cobrem o município "
               "inteiro: 80% da área de João Pessoa e apenas 16% da de Campina Grande. Somar os "
               "bairros dá 830.789 pessoas em João Pessoa contra 833.932 do município, e 389.428 em "
               "Campina Grande contra 419.379. A diferença é quem mora na zona rural, fora de "
               "qualquer bairro, e é por isso que ela é grande em Campina Grande.")

    densidade = pd.Series([populacao.iloc[i] / areas.get(frame["cod"].iloc[i], float("nan"))
                           for i in range(len(frame))], index=frame.index)
    _emit(layer_id="bairros.densidade", path="gente/bairros/densidade.json",
          label="Densidade", unit="pessoas por km²", values=keyed(densidade), higher_is="neutral",
          source="IBGE, Censo 2022, agregados por bairro (V0001) sobre a área do polígono", source_url=AGREGADOS,
          note="A área vem do próprio polígono do bairro, projetado em SIRGAS 2000 UTM 24S. Bairros que "
               "incluem mata, praia ou açude aparecem menos densos do que a parte habitada realmente é.")

    _emit(layer_id="bairros.moradores_por_domicilio", path="gente/bairros/moradores_por_domicilio.json",
          label="Moradores por domicílio", unit="pessoas por domicílio",
          values=keyed(_numeric(frame, MEDIA_MORADORES)), higher_is="neutral",
          source="IBGE, Censo 2022, agregados por bairro (V0005)", source_url=AGREGADOS)

    vazios = (sem_morador / particulares * 100).where(particulares > 0)
    _emit(layer_id="bairros.domicilios_sem_morador", path="gente/bairros/domicilios_sem_morador.json",
          label="Domicílios sem morador", unit="% dos domicílios particulares",
          values=keyed(vazios), higher_is="neutral",
          source="IBGE, Censo 2022, agregados por bairro (V0008 e V0009 sobre V0003)", source_url=AGREGADOS,
          note="Soma os domicílios de uso ocasional, que são a casa de praia ou de veraneio, com os "
               "permanentes vagos. Nos bairros de orla a maior parte é uso ocasional: apartamento fechado "
               "fora da temporada, não abandono.")

    ocupados = keyed(_numeric(frame, DOM_OCUPADOS))
    print(f"bairros: {len(bairros)} polígonos ({', '.join(f'{n} {c}' for c, n in bairros['municipio'].value_counts().items())})")
    print(f"  métricas: população, densidade, moradores por domicílio, domicílios sem morador ({len(ocupados)} bairros)")
