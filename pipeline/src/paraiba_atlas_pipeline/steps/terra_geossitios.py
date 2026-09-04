"""SGB GEOSSIT geosite inventory: public listing filtered to UF PB, then one record page per geosite, parsed from HTML."""
import html
import re
import time
from datetime import date

from ..manifest import record, write_json
from ..provenance import fetch

BASE = "https://www.sgb.gov.br"
LISTING = BASE + "/geossit/geossitios/buscar/page:{page}/sort:Cidade.id_uf/direction:asc"
RECORD = BASE + "/geossit/geossitios/ver/{id}"
LICENSE = "SGB GEOSSIT public records"
LISTING_PAGES = 24

LABELS = {
    "nome": "Nome do Sítio:", "municipio": "Município:", "latitude": "Latitude:", "longitude": "Longitude:", "datum": "Datum:",
    "classificacao": "Classificação temática principal:", "classificacao_secundaria": "Classificação temática secundária:",
    "enquadramento": "Enquadramento Geológico Geral:", "tempo_geologico": "Unidade do Tempo Geológico (Eon, Era ou Período):",
    "rocha": "Rocha Predominante:", "relevancia": "Relevância:", "valor_cientifico": "Valor Científico:",
    "valor_educativo": "Valor Educativo:", "valor_turistico": "Valor Turístico:", "risco_degradacao": "Risco de Degradação:",
    "fragilidade": "Fragilidade", "acesso": "Acesso:",
}
NUMERIC = {"valor_cientifico", "valor_educativo", "valor_turistico", "risco_degradacao"}


def text_lines(raw_html: str) -> list[str]:
    stripped = re.sub(r"<script.*?</script>|<style.*?</style>", "", raw_html, flags=re.S)
    stripped = re.sub(r"<[^>]+>", "\n", stripped)
    return [re.sub(r"\s+", " ", line).strip() for line in html.unescape(stripped).splitlines() if line.strip()]


def value_after(lines: list[str], label: str) -> str | None:
    for i, line in enumerate(lines):
        if line == label and i + 1 < len(lines):
            following = lines[i + 1]
            return None if following in LABELS.values() or following.endswith(":") else following
    return None


def parse_record(raw_html: str) -> dict:
    lines = text_lines(raw_html)
    parsed = {key: value_after(lines, label) for key, label in LABELS.items()}
    for key in NUMERIC:
        match = re.match(r"\s*(\d+)", parsed[key] or "")
        parsed[key] = int(match.group(1)) if match else None
    for key in ("latitude", "longitude"):
        try:
            parsed[key] = float(parsed[key]) if parsed[key] else None
        except ValueError:
            parsed[key] = None
    return parsed


def pb_ids_from_listing() -> dict[int, dict]:
    found = {}
    for page in range(1, LISTING_PAGES + 1):
        raw = fetch(f"geossit_listing_{page:02d}.html", LISTING.format(page=page), license=LICENSE).read_text(encoding="utf-8", errors="replace")
        for row in re.findall(r"<tr[^>]*>(.*?)</tr>", raw, flags=re.S):
            cells = [re.sub(r"<[^>]+>", "", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)]
            link = re.search(r"/geossit/geossitios/ver/(\d+)", row)
            if link and len(cells) >= 5 and cells[4] == "PB":
                found[int(link.group(1))] = {"nome_lista": cells[1], "nota": cells[2], "municipio_lista": cells[3]}
    return found


def run() -> None:
    listing = pb_ids_from_listing()
    features, failed_fields = [], {}
    for geossit_id, row in sorted(listing.items()):
        raw_path = fetch(f"geossit_record_{geossit_id}.html", RECORD.format(id=geossit_id), license=LICENSE)
        parsed = parse_record(raw_path.read_text(encoding="utf-8", errors="replace"))
        for key, value in parsed.items():
            if value is None:
                failed_fields[key] = failed_fields.get(key, 0) + 1
        if parsed["latitude"] is None or parsed["longitude"] is None:
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [parsed["longitude"], parsed["latitude"]]},
            "properties": {"geossit_id": geossit_id, "url": RECORD.format(id=geossit_id), **row, **{k: v for k, v in parsed.items() if k not in ("latitude", "longitude")}},
        })
        time.sleep(1)
    write_json("geo/terra/geossitios.geojson", {"type": "FeatureCollection", "features": features})
    record("terra.geossitios", source="SGB GEOSSIT, inventário de geossítios", source_url=BASE + "/geossit/", year=date.today().year,
           year_note="records carry their own 'Última alteração' date; year is the fetch year", rows=len(features), path="geo/terra/geossitios.geojson")
    print(f"geossitios: {len(listing)} PB ids in listing, {len(features)} with coordinates; fields missing (count of records): {failed_fields}")
