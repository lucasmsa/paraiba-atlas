"""Censo 2022 median age and ageing index per município, SIDRA 9756 variables 10613 and 9175, cor/raça total (86[95251])."""
from ..metrics import emit_metric
from ..sidra import sidra_values


def run() -> None:
    pop, _ = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, "2022")
    mediana, url = sidra_values("sidra_9756_idade_mediana_2022_pb.json", 9756, 10613, "2022", "86[95251]")
    emit_metric(layer_id="gente.idade_mediana", path="gente/idade_mediana.json", label="Idade mediana", unit="anos", year=2022,
                source="IBGE, Censo Demográfico 2022 (SIDRA 9756)", source_url=url,
                values=mediana, meso_method="pop_weighted_mean", weights=pop)
    envelhecimento, url = sidra_values("sidra_9756_envelhecimento_2022_pb.json", 9756, 9175, "2022", "86[95251]")
    emit_metric(layer_id="gente.envelhecimento", path="gente/envelhecimento.json", label="Índice de envelhecimento", unit="idosos por 100 crianças", year=2022,
                source="IBGE, Censo Demográfico 2022 (SIDRA 9756)", source_url=url,
                values=envelhecimento, meso_method="pop_weighted_mean", weights=pop)
    print(f"idade: mediana {len(mediana)} municípios, envelhecimento {len(envelhecimento)}")
