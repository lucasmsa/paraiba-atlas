"""Censo 2022 mean residents per occupied household, SIDRA 9922 variable 5930."""
from ..metrics import emit_metric
from ..sidra import sidra_values


def run() -> None:
    values, url = sidra_values("sidra_9922_moradores_por_domicilio_2022_pb.json", 9922, 5930, "2022")
    pop, _ = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, "2022")
    emit_metric(layer_id="gente.moradores_por_domicilio", path="gente/moradores_por_domicilio.json",
                label="Moradores por domicílio", unit="pessoas por domicílio", year=2022,
                source="IBGE, Censo Demográfico 2022 (SIDRA 9922)", source_url=url,
                values=values, meso_method="pop_weighted_mean", weights=pop)
    print(f"moradores: {len(values)} municípios")
