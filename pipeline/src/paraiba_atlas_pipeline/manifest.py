"""manifest.json is the contract between pipeline and app: one entry per emitted layer."""
import json
from datetime import datetime, timezone

from .paths import OUT_DIR

MANIFEST = OUT_DIR / "manifest.json"


def record(layer_id: str, **entry) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {"layers": {}}
    manifest["generated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    manifest["layers"][layer_id] = entry
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))


def write_json(relative_path: str, payload) -> None:
    target = OUT_DIR / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
