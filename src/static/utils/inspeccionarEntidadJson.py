import json
from pathlib import Path

# Igual que en el validador: partimos de src/static/utils
BASE_DIR = Path(__file__).resolve().parents[1]  # -> src/static
DATA_PATH = BASE_DIR / "data" / "entidades.json"


def main():
    with DATA_PATH.open("r", encoding="utf-8") as f:
        datos = json.load(f)

    total = len(datos)
    print(f"Hay {total} entidades en {DATA_PATH}.\n")

    while True:
        raw = input(f"Introduce un índice entre 0 y {total-1} (o 'q' para salir): ").strip()
        if raw.lower() == "q":
            break

        if not raw.isdigit():
            print("Índice no válido, escribe un número o 'q'.\n")
            continue

        idx = int(raw)
        if idx < 0 or idx >= total:
            print("Fuera de rango, prueba otro.\n")
            continue

        ent = datos[idx]
        print("\n--- Entidad ---")
        print("IDX:", idx)
        print("id:", ent.get("id"))
        print("name:", ent.get("name"))

        locs = ent.get("locations", [])
        if locs:
            loc0 = locs[0]
            print("locations[0].source_url:", loc0.get("source_url"))
        else:
            print("locations: []")

        ver = ent.get("verification", {})
        print("verification.source_urls:", ver.get("source_urls"))
        print("----------------\n")


if __name__ == "__main__":
    main()