"""SINISA 2024 municipal water and sewer coverage (Ministério das Cidades), from the published result spreadsheets."""
import io
import zipfile

import pandas as pd

from ..metrics import emit_metric
from ..provenance import fetch
from ..sidra import sidra_values

AGUA_ZIP = "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa/resultados-sinisa/SINISA_Resultados_Ref2024.zip"
ESGOTO_ZIP = "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa/resultados-sinisa/SINISA_ESGOTO_Planilhas_2024.zip"
LICENSE = "Governo Federal open data"


def sheet_from_zip(zip_path, name_fragment: str, header_row: int) -> pd.DataFrame:
    with zipfile.ZipFile(zip_path) as archive:
        member = next(n for n in archive.namelist() if name_fragment in n and n.endswith(".xlsx"))
        with archive.open(member) as handle:
            workbook = pd.ExcelFile(io.BytesIO(handle.read()))
            sheet = next(name for name in workbook.sheet_names if name.startswith("Indicadores"))
            return workbook.parse(sheet, header=header_row)


def coverage_column(frame: pd.DataFrame, fragment: str) -> str:
    return next(c for c in frame.columns if isinstance(c, str) and fragment in c)


def pb_values(frame: pd.DataFrame, fragment: str) -> dict[str, float]:
    code_col = next(c for c in frame.columns if isinstance(c, str) and "IBGE" in c)
    col = coverage_column(frame, fragment)
    pb = frame[frame["UF"].astype(str).str.strip() == "PB"]
    series = pd.to_numeric(pb[col], errors="coerce")
    return {str(int(code)): float(v) for code, v in zip(pb[code_col], series) if pd.notna(v) and pd.notna(code)}


def run() -> None:
    pop, _ = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, "2022")
    agua = sheet_from_zip(fetch("sinisa_2024_resultados.zip", AGUA_ZIP, license=LICENSE), "AGUA_Indicadores_Base Municipal", 9)
    agua_values = pb_values(agua, "Atendimento da população total com rede de abastecimento de água")
    emit_metric(layer_id="agua.rede_agua", path="agua/rede_agua.json", label="Atendimento por rede de água", unit="% da população",
                year=2024, source="Ministério das Cidades, SINISA 2024 (água, base municipal)", source_url=AGUA_ZIP,
                values=agua_values, meso_method="pop_weighted_mean", weights=pop, higher_is="better")
    esgoto = sheet_from_zip(fetch("sinisa_2024_esgoto.zip", ESGOTO_ZIP, license=LICENSE), "ESGOTO_Indicadores_Base Municipal", 8)
    esgoto_values = pb_values(esgoto, "Atendimento da população total com rede coletora de esgoto")
    emit_metric(layer_id="agua.rede_esgoto", path="agua/rede_esgoto.json", label="Atendimento por rede de esgoto", unit="% da população",
                year=2024, source="Ministério das Cidades, SINISA 2024 (esgoto, base municipal)", source_url=ESGOTO_ZIP,
                values=esgoto_values, meso_method="pop_weighted_mean", weights=pop, higher_is="better")
    print(f"saneamento: água {len(agua_values)} municípios, esgoto {len(esgoto_values)} municípios")
