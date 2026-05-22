import json
from pathlib import Path
from jsonschema import Draft202012Validator

BASE_DIR = Path(__file__).resolve().parents[1]   # src/static
SCHEMA_PATH = BASE_DIR / "data" / "entidades.schema.json"
DATA_PATH = BASE_DIR / "data" / "entidades.json"

with SCHEMA_PATH.open("r", encoding="utf-8") as f:
    schema = json.load(f)

with DATA_PATH.open("r", encoding="utf-8") as f:
    data = json.load(f)

validator = Draft202012Validator(schema)
errors = sorted(validator.iter_errors(data), key=lambda e: list(e.path))

if not errors:
    print("JSON válido")
else:
    print(f"Se encontraron {len(errors)} errores:")
    for i, error in enumerate(errors[:20], 1):
        ruta = "".join(f"[{p}]" if isinstance(p, int) else f".{p}" for p in error.path)
        print(f"{i}. Ruta: {ruta or 'raíz'}")
        print(f"   Error: {error.message}")