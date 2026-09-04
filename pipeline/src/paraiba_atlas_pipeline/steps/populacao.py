"""Censo 2022 resident population per município, IBGE SIDRA aggregate 4709 variable 93."""
from ..metrics import emit_metric
from ..sidra import sidra_values


def run() -> None:
    values, url = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, "2022")
    emit_metric(layer_id="gente.populacao", path="gente/populacao.json", label="População residente", unit="pessoas",
                year=2022, source="IBGE, Censo Demográfico 2022 (SIDRA 4709)", source_url=url,
                values=values, meso_method="sum")
    print(f"população: {len(values)} municípios, total {int(sum(values.values())):,}")
