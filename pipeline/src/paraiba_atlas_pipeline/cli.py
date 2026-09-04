import sys

from .steps import agua_acudes, agua_saneamento, boundaries, idade, moradores, populacao, renda, terra_escalada

STEPS = {
    "boundaries": boundaries.run,
    "populacao": populacao.run,
    "renda": renda.run,
    "moradores": moradores.run,
    "idade": idade.run,
    "escalada": terra_escalada.run,
    "saneamento": agua_saneamento.run,
    "acudes": agua_acudes.run,
}


def main() -> None:
    names = sys.argv[1:] or list(STEPS)
    for name in names:
        print(f"== {name}")
        STEPS[name]()
