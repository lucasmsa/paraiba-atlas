"""Run pipeline steps by name: `uv run atlas [step ...]`, or with no arguments to run all in order."""
import sys

from .steps import (
    agua_acudes,
    agua_chuvas,
    agua_clima,
    agua_saneamento,
    boundaries,
    gente_crime,
    gente_saude,
    idade,
    moradores,
    populacao,
    renda,
    terra_aquiferos,
    terra_escalada,
    terra_geologia,
    terra_geossitios,
    terra_picos,
    terra_solos,
)

# boundaries first: every metric step reads the município index it writes.
STEPS = {
    "boundaries": boundaries.run,
    "geologia": terra_geologia.run,
    "solos": terra_solos.run,
    "aquiferos": terra_aquiferos.run,
    "geossitios": terra_geossitios.run,
    "picos": terra_picos.run,
    "escalada": terra_escalada.run,
    "acudes": agua_acudes.run,
    "chuvas": agua_chuvas.run,
    "clima": agua_clima.run,
    "saneamento": agua_saneamento.run,
    "populacao": populacao.run,
    "renda": renda.run,
    "moradores": moradores.run,
    "idade": idade.run,
    "crime": gente_crime.run,
    "saude": gente_saude.run,
}


def main() -> None:
    names = sys.argv[1:] or list(STEPS)
    unknown = [name for name in names if name not in STEPS]
    if unknown:
        raise SystemExit(f"unknown step(s): {', '.join(unknown)}\navailable: {', '.join(STEPS)}")
    for name in names:
        print(f"== {name}")
        STEPS[name]()
