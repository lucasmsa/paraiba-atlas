"""Homicides per município from the Ministry of Health mortality registry (SIM), read through DataSUS TabNet.

TabNet's external-causes table (sim/cnv/ext10pb.def) breaks deaths by residence into CID-10
groups, one of which is X85-Y09 Agressões. That is the same series the Atlas da Violência
republishes, taken here from the registry itself rather than from the republication.
"""
import html
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from ..manifest import write_json
from ..metrics import emit_metric
from ..paths import OUT_DIR, RAW_DIR
from ..sidra import sidra_values

TABNET = "http://tabnet.datasus.gov.br/cgi/tabcgi.exe?sim/cnv/ext10pb.def"
LICENSE = "DataSUS open data (Ministério da Saúde)"
YEAR = 2024  # 2025 onward is flagged preliminary on the TabNet form
AGGRESSION_COLUMN = "X85-Y09"
MISSING_CELL = "-"

# TabNet needs every filter present and set to "all" or it silently returns an empty table.
FILTERS = [
    "SMunicípio", "SRegião_de_Saúde_(CIR)", "SMacrorregião_de_Saúde", "SDivisão_administ_estadual",
    "SMicrorregião_IBGE", "SRegião_Metropolitana_-_RIDE", "SGrande_Grupo_CID10", "SGrupo_CID10",
    "SCategoria_CID10", "SFaixa_Etária", "SSexo",
]


def fetch_table(year: int) -> str:
    """POST the TabNet query, caching the response with a provenance sidecar like provenance.fetch does."""
    target = RAW_DIR / f"datasus_tabnet_agressoes_pb_{year}.html"
    if target.exists():
        return target.read_text(encoding="latin-1")

    params = [
        ("Linha", "Município"),
        ("Coluna", "Grande_Grupo_CID10"),
        ("Incremento", "Óbitos_p/Residênc"),
        ("Arquivos", f"extpb{year % 100:02d}.dbf"),
        *[(name, "TODAS_AS_CATEGORIAS__") for name in FILTERS],
        ("formato", "table"),
        ("mostre", "sim"),
    ]
    body = urllib.parse.urlencode(params, encoding="latin-1", errors="replace").encode()
    request = urllib.request.Request(TABNET, data=body, headers={"User-Agent": "paraiba-atlas-pipeline"})
    with urllib.request.urlopen(request, timeout=180) as response:
        raw = response.read()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    target.write_bytes(raw)
    target.with_suffix(".html.provenance.json").write_text(json.dumps({
        "url": TABNET,
        "method": "POST",
        "params": dict(params),
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "bytes": len(raw),
        "license": LICENSE,
    }, ensure_ascii=False, indent=2))
    return raw.decode("latin-1")


def strip_tags(cell: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", cell)).strip()


def cell_number(raw: str) -> int:
    return 0 if raw == MISSING_CELL else int(raw.replace(".", ""))


def aggression_cell_index(page: str) -> int:
    """Headers include the table caption, so anchor on the Município header rather than counting from zero."""
    headers = [strip_tags(h) for h in re.findall(r"<TH[^>]*>(.*?)(?=<TH|</TR|$)", page, re.S | re.I)]
    labels = [header.split("\n")[0].strip() for header in headers]
    if "Município" not in labels:
        raise RuntimeError(f"TabNet table has no Município header; headers were {labels}")
    origin = labels.index("Município")
    for index, label in enumerate(labels):
        if label.startswith(AGGRESSION_COLUMN):
            return index - origin
    raise RuntimeError(f"TabNet table has no {AGGRESSION_COLUMN} column; headers were {labels}")


def parse_counts(page: str) -> tuple[dict[str, int], int]:
    """Rows read '250010 AGUA BRANCA' plus one cell per CID-10 group. A dash means zero.

    Also returns TabNet's own TOTAL row so the parse can be checked against it.
    """
    column = aggression_cell_index(page)
    body = page[page.upper().find("</THEAD>"):]
    counts: dict[str, int] = {}
    reported_total = None
    for block in re.split(r"<TR[^>]*>", body, flags=re.I)[1:]:
        cells = [strip_tags(cell) for cell in re.split(r"<TD[^>]*>", block, flags=re.I)[1:]]
        if len(cells) <= column:
            continue
        if cells[0].upper().startswith("TOTAL"):
            reported_total = cell_number(cells[column])
            continue
        match = re.match(r"^(\d{6})\s", cells[0])
        if match:
            counts[match.group(1)] = cell_number(cells[column])
    if reported_total is None:
        raise RuntimeError("TabNet table has no TOTAL row to check the parse against")
    return counts, reported_total


def run() -> None:
    page = fetch_table(YEAR)
    by_short_code, reported_total = parse_counts(page)

    index = json.loads((OUT_DIR / "geo" / "municipios_index.json").read_text())
    population, pop_url = sidra_values(f"sidra_6579_populacao_estimada_{YEAR}_pb.json", 6579, 9324, str(YEAR))

    # TabNet keys municípios by the 6-digit code, which is the IBGE code without its check digit.
    # A município absent from the table had no external-cause deaths at all, so its homicides are zero.
    counts = {cod: by_short_code.get(cod[:6], 0) for cod in index}
    unmatched = set(by_short_code) - {cod[:6] for cod in index}
    if unmatched:
        raise RuntimeError(f"TabNet returned códigos absent from the IBGE index: {sorted(unmatched)}")

    # The gap is deaths TabNet could not attribute to a município, which no per-município rate can carry.
    unattributed = reported_total - sum(counts.values())
    if not 0 <= unattributed <= reported_total * 0.05:
        raise RuntimeError(f"parsed {sum(counts.values())} homicides against a TabNet total of {reported_total}")

    rates = {cod: round(100_000 * count / population[cod], 2) for cod, count in counts.items() if population.get(cod)}

    emit_metric(
        layer_id="gente.homicidios", path="gente/homicidios.json",
        label="Homicídios", unit="por 100 mil habitantes", year=YEAR,
        source=f"Ministério da Saúde, Sistema de Informações sobre Mortalidade (SIM), agressões X85-Y09, óbitos por residência; população estimada IBGE {YEAR}",
        source_url=TABNET,
        values=rates, meso_method="pop_weighted_mean", weights=population, higher_is="worse",
    )

    payload = json.loads((OUT_DIR / "gente" / "homicidios.json").read_text())
    payload["counts"] = counts
    payload["count_unit"] = "óbitos por agressão"
    payload["state_count"] = sum(counts.values())
    payload["state_count_reported"] = reported_total
    payload["unattributed_deaths"] = unattributed
    payload["population_source_url"] = pop_url
    payload["note"] = (
        "A taxa é por 100 mil habitantes, e em município pequeno esse número é instável: "
        "onde moram 5 mil pessoas, um único homicídio já vale 20 por 100 mil. Leia a taxa "
        "junto do número absoluto de óbitos, que aparece na ficha do município, e desconfie "
        "de posições extremas em municípios de pouca gente."
    )
    write_json("gente/homicidios.json", payload)

    with_deaths = sum(1 for count in counts.values() if count)
    print(f"homicídios {YEAR}: {payload['state_count']} óbitos atribuídos a município (TabNet informa {reported_total}, {unattributed} sem município)")
    print(f"  {with_deaths} de {len(counts)} municípios com ao menos um homicídio")
    print("sinesp: dados.mj.gov.br não respondeu; métrica de ocorrências criminais não foi emitida")
