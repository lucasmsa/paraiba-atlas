"""Censo 2022 mean monthly household income per capita (R$), SIDRA 10295 variable 13431, totals of sex, cor/raça and situação."""
from ..metrics import emit_metric
from ..sidra import sidra_values


def run() -> None:
    values, url = sidra_values("sidra_10295_renda_percapita_2022_pb.json", 10295, 13431, "2022", "2[6794]|86[95251]|58[95253]")
    pop, _ = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, "2022")
    emit_metric(layer_id="gente.renda_per_capita", path="gente/renda_per_capita.json",
                label="Renda domiciliar per capita", unit="R$ por mês", year=2022,
                source="IBGE, Censo Demográfico 2022 (SIDRA 10295)", source_url=url,
                values=values, meso_method="pop_weighted_mean", weights=pop, higher_is="better")
    print(f"renda: {len(values)} municípios, mediana R$ {sorted(values.values())[len(values)//2]:.0f}")
