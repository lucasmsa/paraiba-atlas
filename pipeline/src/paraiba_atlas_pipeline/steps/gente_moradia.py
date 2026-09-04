"""Censo 2022 housing tenure per município, IBGE SIDRA 9929.

This is the atlas's stand-in for property prices: the 2022 census published no rent
value at município level, so tenure is the housing signal that exists everywhere.

Variable 1000381 is the percentage of the município's own households, and the two
"número de moradores" classifications are pinned to their totals so the result is not
a cross-tab.
"""
import json
from pathlib import Path

from ..manifest import write_json
from ..metrics import emit_metric
from ..paths import OUT_DIR
from ..sidra import sidra_url, sidra_values

TABLE = 9929
PERCENT_OF_TOTAL = 1000381
COUNT = 381
PERIOD = "2022"

PROPRIO = 73554
ALUGADO = 1055
CEDIDO = 73553
TOTAL_OCUPACAO = 95826

# Both "number of residents" breakdowns pinned to Total, so only tenure varies.
MORADORES_TOTAIS = "1986[73103]|1988[73108]"

SOURCE = "IBGE, Censo Demográfico 2022 (SIDRA 9929), condição de ocupação do domicílio"


def _annotate(path: str, extra: dict) -> None:
    """emit_metric writes the standard payload; these fields are specific to this layer."""
    target = Path(OUT_DIR / path)
    payload = json.loads(target.read_text())
    payload.update(extra)
    write_json(path, payload)


def _tenure(name: str, category: int, variable: int = PERCENT_OF_TOTAL) -> dict[str, float]:
    values, _ = sidra_values(name, TABLE, variable, PERIOD, f"63[{category}]|{MORADORES_TOTAIS}")
    return values


def run() -> None:
    proprio = _tenure("sidra_9929_proprio_2022_pb.json", PROPRIO)
    alugado = _tenure("sidra_9929_alugado_2022_pb.json", ALUGADO)
    cedido = _tenure("sidra_9929_cedido_2022_pb.json", CEDIDO)
    domicilios = _tenure("sidra_9929_domicilios_total_2022_pb.json", TOTAL_OCUPACAO, COUNT)

    emit_metric(
        layer_id="gente.moradia_propria", path="gente/moradia_propria.json",
        label="Domicílios próprios", unit="% dos domicílios", year=2022,
        source=SOURCE, source_url=sidra_url(TABLE, PERCENT_OF_TOTAL, PERIOD, f"63[{PROPRIO}]|{MORADORES_TOTAIS}"),
        values=proprio, meso_method="pop_weighted_mean", weights=domicilios, higher_is="neutral",
    )
    _annotate("gente/moradia_propria.json", {
        "note": (
            "Domicílio próprio de algum morador, já pago ou ainda pagando. Ter casa própria "
            "não é automaticamente melhor: no interior a proporção é alta porque a casa foi "
            "herdada ou construída no terreno da família, e um imóvel próprio sem mercado "
            "que o compre não vira dinheiro nem permite mudar de cidade. Leia junto do "
            "percentual alugado, que é onde existe mercado imobiliário de fato. Este é o "
            "dado de moradia que substitui preço de imóvel no atlas: o Censo de 2022 não "
            "publicou valor de aluguel por município."
        ),
        "alugado": alugado,
        "cedido": cedido,
        "domicilios": {cod: int(value) for cod, value in domicilios.items()},
    })

    emit_metric(
        layer_id="gente.moradia_alugada", path="gente/moradia_alugada.json",
        label="Domicílios alugados", unit="% dos domicílios", year=2022,
        source=SOURCE, source_url=sidra_url(TABLE, PERCENT_OF_TOTAL, PERIOD, f"63[{ALUGADO}]|{MORADORES_TOTAIS}"),
        values=alugado, meso_method="pop_weighted_mean", weights=domicilios, higher_is="neutral",
    )
    _annotate("gente/moradia_alugada.json", {
        "note": (
            "Percentual de domicílios alugados. É o melhor sinal disponível de onde existe "
            "mercado imobiliário: aluguel alto em proporção indica cidade que recebe gente "
            "de fora, com estudante, trabalhador transferido e imóvel tratado como negócio. "
            "O Censo de 2022 não publicou quanto se paga, apenas quantos pagam."
        ),
    })

    top = max(proprio, key=proprio.get)
    bottom = min(proprio, key=proprio.get)
    print(f"moradia: {len(proprio)} municípios; próprios de {proprio[bottom]:.1f}% a {proprio[top]:.1f}%")
