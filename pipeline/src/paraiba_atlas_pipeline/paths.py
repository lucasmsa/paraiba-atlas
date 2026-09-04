from pathlib import Path

PIPELINE_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = PIPELINE_ROOT.parent
RAW_DIR = PIPELINE_ROOT / "data" / "raw"
OUT_DIR = REPO_ROOT / "app" / "public" / "data"
