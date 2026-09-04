"""Municipal economy: PIB per capita (IBGE), IDHM (Atlas Brasil via Ipeadata) and broadband access (Anatel)."""
import io
import json
import zipfile
from pathlib import Path

import pandas as pd

from ..manifest import write_json
from ..metrics import emit_metric
from ..paths import OUT_DIR, RAW_DIR
from ..provenance import fetch
from ..sidra import sidra_values

PIB_ZIP = "https://ftp.ibge.gov.br/Pib_Municipios/2022_2023/base/base_de_dados_2010_2023_xlsx.zip"
PIB_YEAR = 2023
IPEA_IDHM = "http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='ADH_IDHM')"
IDHM_YEAR = 2010
ANATEL_ZIP = "https://www.anatel.gov.br/dadosabertos/paineis_de_dados/acessos/acessos_banda_larga_fixa.zip"

UF_PB = 25


def _annotate(path: str, extra: dict) -> None:
    target = Path(OUT_DIR / path)
    payload = json.loads(target.read_text())
    payload.update(extra)
    write_json(path, payload)


def pib_per_capita() -> None:
    """IBGE publishes PIB per capita directly; SIDRA carries only the total, so the base file is the source."""
    path = fetch("ibge_pib_municipios_2010_2023.zip", PIB_ZIP, license="IBGE open data")
    with zipfile.ZipFile(path) as archive:
        member = next(n for n in archive.namelist() if n.endswith(".xlsx"))
        frame = pd.read_excel(io.BytesIO(archive.read(member)))

    per_capita_col = next(c for c in frame.columns if "per capita" in str(c))
    total_col = next(c for c in frame.columns if str(c).startswith("Produto Interno Bruto,"))
    pb = frame[(frame["Código da Unidade da Federação"] == UF_PB) & (frame["Ano"] == PIB_YEAR)]

    values = {str(int(cod)): round(float(v), 2) for cod, v in zip(pb["Código do Município"], pb[per_capita_col]) if pd.notna(v)}
    pop, _ = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, "2022")
    emit_metric(
        layer_id="gente.pib_per_capita", path="gente/pib_per_capita.json",
        label="PIB per capita", unit="R$ por ano", year=PIB_YEAR,
        source=f"IBGE, Produto Interno Bruto dos Municípios {PIB_YEAR}",
        source_url=PIB_ZIP, values=values, meso_method="pop_weighted_mean", weights=pop, higher_is="better",
    )
    semiarido = {str(int(c)): (str(s).strip() == "Sim") for c, s in zip(pb["Código do Município"], pb["Semiárido"])}
    _annotate("gente/pib_per_capita.json", {
        "note": (
            "Mede produção, "
            "não o dinheiro que fica com quem mora ali: uma cidade pequena com uma fábrica grande, "
            "uma usina ou royalties aparece no topo sem que a renda das famílias acompanhe. Para "
            "essa outra pergunta, veja a camada de renda domiciliar per capita."
        ),
        "pib_total_mil_reais": {str(int(c)): round(float(v), 3) for c, v in zip(pb["Código do Município"], pb[total_col]) if pd.notna(v)},
        "semiarido": semiarido,
    })
    print(f"pib per capita: {len(values)} municípios, {sum(semiarido.values())} no semiárido")


def idhm() -> None:
    """Municipal IDHM exists only for census years; the 2012+ Atlas series is PNAD, which stops at state level."""
    path = fetch("ipeadata_idhm_municipios.json", IPEA_IDHM, license="Ipeadata open data")
    rows = json.loads(path.read_text())["value"]
    values = {
        row["TERCODIGO"]: float(row["VALVALOR"])
        for row in rows
        if row["NIVNOME"] == "Municípios" and row["TERCODIGO"].startswith(str(UF_PB)) and row["VALDATA"][:4] == str(IDHM_YEAR)
    }
    pop, _ = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, "2022")
    emit_metric(
        layer_id="gente.idhm", path="gente/idhm.json",
        label="IDHM", unit="índice de 0 a 1", year=IDHM_YEAR,
        source=f"Atlas do Desenvolvimento Humano no Brasil (PNUD, Ipea e FJP), Censo {IDHM_YEAR}, via Ipeadata",
        source_url=IPEA_IDHM, values=values, meso_method="pop_weighted_mean", weights=pop, higher_is="better",
    )
    _annotate("gente/idhm.json", {
        "note": (
            f"É de {IDHM_YEAR} porque o "
            "índice municipal só é calculado com dados de Censo, e o Atlas ainda não publicou a versão "
            "do Censo de 2022. A série anual mais recente do Atlas vem da PNAD, que é uma pesquisa por "
            "amostra e não desce ao nível de município. Leia como retrato de 2010, não de hoje."
        ),
    })
    print(f"idhm: {len(values)} municípios, ano {IDHM_YEAR}")


DENSITY_MEMBER = "Densidade_Banda_Larga_Fixa.csv"
DENSITY_MONTHS = 6


def banda_larga() -> None:
    """Anatel publishes its own density, so the accesses files (1 GB per year) are not parsed."""
    path = RAW_DIR / "anatel_banda_larga_fixa.zip"
    if not path.exists():
        print("banda larga: arquivo da Anatel ausente, camada não emitida")
        return
    with zipfile.ZipFile(path) as archive:
        with archive.open(DENSITY_MEMBER) as handle:
            frame = pd.read_csv(io.TextIOWrapper(handle, encoding="utf-8-sig"), sep=";", decimal=",", low_memory=False)

    pb = frame[(frame["UF"] == "PB") & (frame["Nível Geográfico Densidade"] == "Municipio")].copy()
    pb["periodo"] = pb["Ano"] * 100 + pb["Mês"]
    window = sorted(pb["periodo"].unique())[-DENSITY_MONTHS:]
    # A single month swings wildly when one provider reports late or against the wrong código:
    # Água Branca reads 9.6 in June and 70.5 in July. The median over six months drops the spikes.
    median = pb[pb["periodo"].isin(window)].groupby("Código IBGE")["Densidade"].median()

    values = {str(int(code)): round(float(value), 2) for code, value in median.items()}
    pop, _ = sidra_values("sidra_4709_populacao_2022_pb.json", 4709, 93, "2022")
    latest = int(max(window))
    emit_metric(
        layer_id="gente.banda_larga", path="gente/banda_larga.json",
        label="Banda larga fixa", unit="acessos por 100 habitantes", year=latest // 100,
        source=f"Anatel, densidade de banda larga fixa, mediana de {DENSITY_MONTHS} meses até {latest % 100}/{latest // 100}",
        source_url=ANATEL_ZIP, values=values, meso_method="pop_weighted_mean", weights=pop, higher_is="better",
    )
    _annotate("gente/banda_larga.json", {
        "note": (
            "É a mediana dos últimos seis meses. "
            "Conta assinaturas, não pessoas conectadas: uma casa com um contrato pode ter cinco "
            "moradores, e um comércio pode ter vários. No interior a internet costuma chegar por "
            "celular ou rádio, que não entram nesta conta, então valor baixo significa pouca rede "
            "fixa, não necessariamente ninguém on-line. A mediana de seis meses é usada porque um "
            "único mês oscila demais quando uma operadora reporta com atraso."
        ),
        "janela": [int(p) for p in window],
    })
    print(f"banda larga: {len(values)} municípios, mediana de {DENSITY_MONTHS} meses até {latest}")


def run() -> None:
    pib_per_capita()
    idhm()
    banda_larga()
