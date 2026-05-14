import json
from pathlib import Path
from jsonschema import Draft202012Validator

base = Path(__file__).resolve().parent
schema_path = base / "entidades.schema.json"
data_path = base / "entidades.json"

with schema_path.open("r", encoding="utf-8") as f:
    schema = json.load(f)

with data_path.open("r", encoding="utf-8") as f:
    data = json.load(f)

validator = Draft202012Validator(schema)
errors = sorted(validator.iter_errors(data), key=lambda e: list(e.path))

if not errors:
    print("JSON válido")
else:
    print(f"Se encontraron {len(errors)} errores:\n")
    for i, error in enumerate(errors[:20], 1):
        ruta = "$"
        for p in error.path:
            if isinstance(p, int):
                ruta += f"[{p}]"
            else:
                ruta += f".{p}"
        print(f"{i}. Ruta: {ruta}")
        print(f"   Error: {error.message}\n")