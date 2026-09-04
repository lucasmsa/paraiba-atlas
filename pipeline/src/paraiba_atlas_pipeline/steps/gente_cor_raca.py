"""Censo 2022 population by cor ou raça per município, IBGE SIDRA 9605.

Variable 1000093 is the percentage of the município's own total, so the five groups
sum to 100 within each município and no denominator has to be supplied here.
"""
import json
from pathlib import Path

from ..manifest import write_json
from ..metrics import emit_metric
from ..paths import OUT_DIR
from ..sidra import sidra_url, sidra_values

TABLE = 9605
PERCENT_OF_TOTAL = 1000093
PERIOD = "2022"

BRANCA = 2776
PRETA = 2777
PARDA = 2779

SOURCE = "IBGE, Censo Demográfico 2022 (SIDRA 9605), cor ou raça autodeclarada"


def _annotate(path: str, extra: dict) -> None:
    """emit_metric writes the standard payload; these fields are specific to this layer."""
    target = Path(OUT_DIR / path)
    payload = json.loads(target.read_text())
    payload.update(extra)
    write_json(path, payload)


def _share(name: str, category: int) -> dict[str, float]:
    values, _ = sidra_values(name, TABLE, PERCENT_OF_TOTAL, PERIOD, f"86[{category}]")
    return values


def run() -> None:
    pop, _ = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, PERIOD)

    preta = _share("sidra_9605_preta_2022_pb.json", PRETA)
    parda = _share("sidra_9605_parda_2022_pb.json", PARDA)
    branca = _share("sidra_9605_branca_2022_pb.json", BRANCA)

    negra = {cod: round(preta[cod] + parda[cod], 2) for cod in preta if cod in parda}
    negra_url = sidra_url(TABLE, PERCENT_OF_TOTAL, PERIOD, f"86[{PRETA},{PARDA}]")

    emit_metric(
        layer_id="gente.cor_preta_parda", path="gente/cor_preta_parda.json",
        label="População preta e parda", unit="% da população", year=2022,
        source=SOURCE, source_url=negra_url,
        values=negra, meso_method="pop_weighted_mean", weights=pop, higher_is="neutral",
    )
    _annotate("gente/cor_preta_parda.json", {
        "note": (
            "Soma de quem se declarou preto e de quem se declarou pardo, que é como a "
            "estatística brasileira costuma medir a população negra. O dado é de "
            "autodeclaração: a pessoa escolhe a própria classificação no questionário do "
            "Censo, e a resposta muda com o tempo e com o contexto. Não é uma medida "
            "biológica nem uma classificação atribuída pelo recenseador."
        ),
        "componentes": {"preta": preta, "parda": parda},
    })

    emit_metric(
        layer_id="gente.cor_branca", path="gente/cor_branca.json",
        label="População branca", unit="% da população", year=2022,
        source=SOURCE, source_url=sidra_url(TABLE, PERCENT_OF_TOTAL, PERIOD, f"86[{BRANCA}]"),
        values=branca, meso_method="pop_weighted_mean", weights=pop, higher_is="neutral",
    )
    _annotate("gente/cor_branca.json", {
        "note": (
            "Percentual de quem se declarou branco no Censo de 2022. É autodeclaração, "
            "não classificação atribuída. As cinco categorias do Censo (branca, preta, "
            "amarela, parda e indígena) somam 100% dentro de cada município."
        ),
    })

    highest = max(negra, key=negra.get)
    lowest = min(negra, key=negra.get)
    print(f"cor/raça: {len(negra)} municípios; preta+parda de {negra[lowest]:.1f}% a {negra[highest]:.1f}%")
