"""Families in poverty per município, from CadÚnico via the MI Social service (MDS).

MI Social is a Solr endpoint that answers a plain GET with JSON, one document per
município per month. Its `codigo_ibge` is the 6-digit code, so it is joined to the
atlas by the first six digits of the 7-digit IBGE code.

CadÚnico counts families that enrolled in the federal social registry, not every poor
family. The denominator is Censo 2022 households, so the metric reads as "registered
families in poverty per 100 households", which is comparable across municípios.
"""
import json
from pathlib import Path

from ..manifest import write_json
from ..metrics import emit_metric
from ..paths import OUT_DIR
from ..provenance import fetch
from ..sidra import sidra_values

MISOCIAL = "https://aplicacoes.mds.gov.br/sagi/servicos/misocial"
LICENSE = "MDS open data (Ministério do Desenvolvimento Social)"

# Newest month where every Paraíba município carries CadÚnico figures. Later months
# exist as empty shells, so a blind "latest" would silently emit nothing.
PERIOD = "202608"

FIELDS = ",".join([
    "codigo_ibge",
    "cadun_qtd_familias_cadastradas_i",
    "cadun_qtde_fam_sit_pobreza_s",
    "cadun_qtde_fam_sit_extrema_pobreza_s",
    "cadun_qtd_familias_cadastradas_rfpc_ate_meio_sm_i",
])

DOMICILIOS = "sidra_9929_domicilios_total_2022_pb.json"


def _annotate(path: str, extra: dict) -> None:
    """emit_metric writes the standard payload; these fields are specific to this layer."""
    target = Path(OUT_DIR / path)
    payload = json.loads(target.read_text())
    payload.update(extra)
    write_json(path, payload)


def _number(raw) -> float:
    """MI Social types some counts as strings and omits absent ones."""
    if raw in (None, ""):
        return 0.0
    return float(raw)


def cadunico_url() -> str:
    return f"{MISOCIAL}?q=codigo_ibge:25*&fq=anomes_s:{PERIOD}&fl={FIELDS}&rows=500&wt=json"


def cadunico_by_municipio() -> dict[str, dict]:
    path = fetch(f"misocial_cadunico_{PERIOD}_pb.json", cadunico_url(), license=LICENSE)
    docs = json.loads(path.read_text())["response"]["docs"]
    return {str(doc["codigo_ibge"]): doc for doc in docs}


def run() -> None:
    docs = cadunico_by_municipio()
    households, _ = sidra_values(DOMICILIOS, 9929, 381, "2022", "63[95826]|1986[73103]|1988[73108]")

    poor_families: dict[str, float] = {}
    rate: dict[str, float] = {}
    registered: dict[str, float] = {}
    for cod, total_households in households.items():
        doc = docs.get(cod[:6])
        if not doc or not total_households:
            continue
        poor = _number(doc.get("cadun_qtde_fam_sit_pobreza_s")) + _number(doc.get("cadun_qtde_fam_sit_extrema_pobreza_s"))
        poor_families[cod] = poor
        registered[cod] = _number(doc.get("cadun_qtd_familias_cadastradas_i"))
        rate[cod] = round(100 * poor / total_households, 2)

    emit_metric(
        layer_id="gente.pobreza", path="gente/pobreza.json",
        label="Famílias em pobreza no CadÚnico", unit="por 100 domicílios", year=2026,
        source=f"MDS, CadÚnico via MI Social, situação de pobreza e extrema pobreza, {PERIOD[:4]}-{PERIOD[4:]}; domicílios do Censo 2022",
        source_url=cadunico_url(),
        values=rate, meso_method="pop_weighted_mean", weights=households, higher_is="worse",
    )
    _annotate("gente/pobreza.json", {
        "note": (
            "Famílias registradas no CadÚnico em situação de pobreza ou de extrema pobreza, "
            "divididas pelo total de domicílios do município no Censo de 2022. O CadÚnico é "
            "um cadastro, não um censo: conta quem se inscreveu para acessar programas "
            "sociais, e quem nunca procurou o CRAS não aparece. Por isso o número mede "
            "pobreza registrada, e municípios com busca ativa mais organizada tendem a "
            "registrar mais. O denominador é do Censo, o numerador é do cadastro, então a "
            "razão não é uma taxa de pobreza no sentido estatístico. Um município pode "
            "passar de 100: no CadÚnico uma \"família\" é a unidade que recebe benefício, e "
            "mais de uma pode dividir o mesmo domicílio, além de o cadastro acumular "
            "registros desatualizados. Em Juarez Távora são 3.888 famílias cadastradas para "
            "2.796 domicílios do Censo."
        ),
        "familias_pobres": {cod: int(value) for cod, value in poor_families.items()},
        "familias_cadastradas": {cod: int(value) for cod, value in registered.items()},
        "domicilios_censo": {cod: int(households[cod]) for cod in rate},
        "periodo_cadunico": PERIOD,
    })

    top = max(rate, key=rate.get)
    bottom = min(rate, key=rate.get)
    print(f"pobreza: {len(rate)} municípios; de {rate[bottom]:.1f} a {rate[top]:.1f} famílias pobres por 100 domicílios")
