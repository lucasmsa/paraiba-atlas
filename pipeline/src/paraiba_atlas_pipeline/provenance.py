"""Fetch a URL into data/raw with a sidecar *.provenance.json. Nothing is hand-typed."""
import json
from datetime import datetime, timezone
from pathlib import Path

import requests

from .paths import RAW_DIR

_session = requests.Session()
_session.headers["User-Agent"] = "paraiba-atlas-pipeline (+https://github.com/lucasmsa/paraiba-atlas)"


def fetch(name: str, url: str, *, license: str, refresh: bool = False, timeout: int = 120) -> Path:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    target = RAW_DIR / name
    if target.exists() and not refresh:
        return target
    response = _session.get(url, timeout=timeout)
    response.raise_for_status()
    target.write_bytes(response.content)
    sidecar = target.with_suffix(target.suffix + ".provenance.json")
    sidecar.write_text(json.dumps({
        "url": url,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "bytes": len(response.content),
        "license": license,
    }, ensure_ascii=False, indent=2))
    return target
