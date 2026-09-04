"""Health access and infant mortality per município, from DataSUS TabNet (CNES, SIM and SINASC).

TabNet is a Win32 CGI that expects latin-1 form encoding and answers a POST with an HTML page
carrying a link to a generated CSV. Both hops are cached with a provenance sidecar.
"""
import csv
import io
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import requests

from ..manifest import write_json
from ..metrics import emit_metric
from ..paths import OUT_DIR, RAW_DIR
from ..sidra import sidra_values

TABNET = "http://tabnet.datasus.gov.br"
LICENSE = "DataSUS open data (Ministério da Saúde)"

CNES_DEF = "cnes/cnv/estabpb.def"
SIM_DEF = "sim/cnv/inf10pb.def"
SINASC_DEF = "sinasc/cnv/nvpb.def"

# SIM and SINASC are summed over this window. Most Paraíba municípios record only a few dozen
# births a year, so a single year swings wildly on one or two deaths.
YEARS = (2019, 2020, 2021, 2022, 2023)

# Establishments a resident can actually walk into for primary, urgent or hospital care.
# "Consultório isolado" is excluded on purpose: it is a single private practice, often one
# dentist, and it counts in the hundreds in the larger cities while saying nothing about
# public health access. Pharmacies, mobile units, labs, and administrative or regulatory
# registrations are excluded for the same reason.
CARE_TYPES = {
    "POSTO DE SAUDE",
    "CENTRO DE SAUDE/UNIDADE BASICA",
    "UNIDADE DE SAUDE DA FAMILIA",
    "POLICLINICA",
    "HOSPITAL GERAL",
    "HOSPITAL ESPECIALIZADO",
    "UNIDADE MISTA",
    "PRONTO SOCORRO GERAL",
    "PRONTO SOCORRO ESPECIALIZADO",
    "PRONTO ATENDIMENTO",
    "CENTRO DE ATENCAO PSICOSSOCIAL",
}

_session = requests.Session()
_session.headers["User-Agent"] = "paraiba-atlas-pipeline (+https://github.com/lucasmsa/paraiba-atlas)"


def _latin1_body(pairs: list[tuple[str, str]]) -> bytes:
    encoded = "&".join(f"{quote(k, encoding='latin-1')}={quote(v, encoding='latin-1')}" for k, v in pairs)
    return encoded.encode("latin-1")


def tabnet_csv(name: str, def_path: str, pairs: list[tuple[str, str]], *, refresh: bool = False) -> str:
    """POST a TabNet query, follow the generated CSV, and cache it with a provenance sidecar."""
    target = RAW_DIR / name
    if target.exists() and not refresh:
        return target.read_text(encoding="latin-1")

    url = f"{TABNET}/cgi/tabcgi.exe?{def_path}"
    page = _session.post(url, data=_latin1_body(pairs), headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=180)
    page.raise_for_status()
    html = page.content.decode("latin-1")
    match = re.search(r"(/csv/[A-Za-z0-9_.]+\.csv)", html)
    if not match:
        raise RuntimeError(f"TabNet returned no CSV for {def_path}: {html[-300:]}")

    csv_response = _session.get(TABNET + match.group(1), timeout=180)
    csv_response.raise_for_status()
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    target.write_bytes(csv_response.content)
    sidecar = target.with_suffix(target.suffix + ".provenance.json")
    sidecar.write_text(json.dumps({
        "url": url,
        "query": dict(pairs),
        "generated_csv": TABNET + match.group(1),
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "bytes": len(csv_response.content),
        "license": LICENSE,
    }, ensure_ascii=False, indent=2))
    return csv_response.content.decode("latin-1")


def _code_lookup() -> dict[str, str]:
    """TabNet prints the 6-digit IBGE code; the rest of the atlas keys on the 7-digit one."""
    index = json.loads((OUT_DIR / "geo" / "municipios_index.json").read_text())
    return {code[:6]: code for code in index}


def _parse_table(text: str) -> tuple[list[str], list[list[str]]]:
    """TabNet CSV: three title lines, a quoted header, data rows, then a footnote block."""
    lines = text.splitlines()
    start = next(i for i, line in enumerate(lines) if line.startswith('"Município"'))
    header = next(csv.reader([lines[start]], delimiter=";"))
    rows = []
    for line in lines[start + 1:]:
        if not line.startswith('"'):
            break
        row = next(csv.reader([line], delimiter=";"))
        if row[0].startswith("TOTAL"):
            continue
        rows.append(row)
    return header, rows


def _number(cell: str) -> float:
    cell = cell.strip()
    return 0.0 if cell in {"-", "", "..."} else float(cell.replace(".", "").replace(",", "."))


def _municipio_totals(text: str, keep: set[str] | None) -> dict[str, float]:
    header, rows = _parse_table(text)
    lookup = _code_lookup()
    wanted = [i for i, name in enumerate(header) if keep is None or name.strip() in keep] if keep else None
    totals: dict[str, float] = {}
    for row in rows:
        code6 = row[0].strip('"').split()[0]
        cod = lookup.get(code6)
        if not cod:
            continue
        if keep is None:
            totals[cod] = _number(row[1])
        else:
            totals[cod] = sum(_number(row[i]) for i in wanted if i < len(row))
    return totals


def _establishments() -> tuple[dict[str, float], str, str]:
    period = "stpb2607.dbf"
    text = tabnet_csv("datasus_cnes_estab_pb.csv", CNES_DEF, [
        ("Linha", "Município"),
        ("Coluna", "Tipo_de_Estabelecimento"),
        ("Incremento", "Quantidade"),
        ("Arquivos", period),
        ("SMunicípio", "TODAS_AS_CATEGORIAS__"),
        ("STipo_de_Estabelecimento", "TODAS_AS_CATEGORIAS__"),
        ("formato", "table"),
        ("mostre", "Mostra"),
    ])
    header, _ = _parse_table(text)
    present = {name.strip() for name in header}
    missing = CARE_TYPES - present
    if missing:
        print(f"  aviso: tipos ausentes no CNES deste mês: {sorted(missing)}")
    return _municipio_totals(text, CARE_TYPES), f"{TABNET}/cgi/tabcgi.exe?{CNES_DEF}", period


def _yearly_counts(name: str, def_path: str, increment: str, file_prefix: str) -> dict[str, float]:
    pairs = [("Linha", "Município"), ("Coluna", "--Não-Ativa--"), ("Incremento", increment)]
    pairs += [("Arquivos", f"{file_prefix}{str(year)[2:]}.dbf") for year in YEARS]
    pairs += [("SMunicípio", "TODAS_AS_CATEGORIAS__"), ("formato", "table"), ("mostre", "Mostra")]
    return _municipio_totals(tabnet_csv(name, def_path, pairs), None)


def run() -> None:
    pop, _ = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, "2022")

    establishments, cnes_url, period = _establishments()
    per_10k = {cod: round(10000 * count / pop[cod], 2) for cod, count in establishments.items() if pop.get(cod)}
    emit_metric(
        layer_id="gente.saude_estabelecimentos", path="gente/saude_estabelecimentos.json",
        label="Estabelecimentos de saúde", unit="por 10 mil habitantes", year=2026,
        source="Ministério da Saúde, CNES (atenção primária, urgência e hospitalar), julho de 2026",
        source_url=cnes_url, values=per_10k, meso_method="pop_weighted_mean", weights=pop, higher_is="better",
    )
    _annotate("gente/saude_estabelecimentos.json", {
        "note": (
            "Conta só os estabelecimentos onde uma pessoa é atendida: postos de saúde, unidades básicas e "
            "de saúde da família, policlínicas, hospitais, unidades mistas, prontos-socorros, prontos-"
            "atendimentos e CAPS. Consultórios isolados, farmácias, laboratórios, unidades móveis e "
            "registros administrativos ficam de fora, porque inflam a conta nas cidades grandes sem "
            "significar mais acesso. O denominador é a população do Censo de 2022."
        ),
        "tipos_incluidos": sorted(CARE_TYPES),
        "arquivo_cnes": period,
    })
    print(f"saúde: {len(per_10k)} municípios, {int(sum(establishments.values()))} estabelecimentos de atendimento")

    deaths = _yearly_counts("datasus_sim_obitos_infantis_pb.csv", SIM_DEF, "Óbitos_p/Residênc", "infpb")
    births = _yearly_counts("datasus_sinasc_nascidos_vivos_pb.csv", SINASC_DEF, "Nascim_p/resid.mãe", "nvpb")
    rate = {
        cod: round(1000 * deaths.get(cod, 0.0) / births[cod], 2)
        for cod in births
        if births[cod] >= 1
    }
    window = f"{YEARS[0]}-{YEARS[-1]}"
    emit_metric(
        layer_id="gente.mortalidade_infantil", path="gente/mortalidade_infantil.json",
        label="Mortalidade infantil", unit="óbitos por mil nascidos vivos", year=YEARS[-1],
        source=f"Ministério da Saúde, SIM e SINASC, óbitos de menores de 1 ano por nascidos vivos, {window}",
        source_url=f"{TABNET}/cgi/tabcgi.exe?{SIM_DEF}", values=rate,
        meso_method="pop_weighted_mean", weights=births, higher_is="worse",
    )
    _annotate("gente/mortalidade_infantil.json", {
        "note": (
            f"Soma dos óbitos de menores de 1 ano dividida pelos nascidos vivos de {window}, ambos por "
            "residência da mãe. O período é de cinco anos de propósito: a maioria dos municípios "
            "paraibanos registra poucas dezenas de nascimentos por ano, e num município pequeno um "
            "único óbito a mais muda a taxa em vários pontos. Mesmo somando cinco anos, os municípios "
            "com menos nascimentos continuam instáveis, então compare com cuidado quem tem pouca gente."
        ),
        "janela": window,
        "nascidos_vivos": {cod: int(value) for cod, value in births.items()},
        "obitos_infantis": {cod: int(deaths.get(cod, 0)) for cod in births},
    })
    total_rate = 1000 * sum(deaths.values()) / sum(births.values())
    print(f"mortalidade infantil: {len(rate)} municípios, taxa estadual {total_rate:.1f} por mil ({window})")


def _annotate(path: str, extra: dict) -> None:
    """emit_metric writes the standard payload; these fields are specific to this layer."""
    target = Path(OUT_DIR / path)
    payload = json.loads(target.read_text())
    payload.update(extra)
    write_json(path, payload)
