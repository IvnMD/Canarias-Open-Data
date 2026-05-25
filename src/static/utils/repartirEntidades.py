import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]  # -> src/static
DATA_PATH = BASE_DIR / "data" / "entidades.json"


PROGRAMADORES = ["Ivan", "JP", "Yasier"]


def calcular_score(ent):
    kind = ent.get("entity_kind")

    portals = ent.get("portals", [])
    portal_kinds = {p.get("kind") for p in portals or []}
    has_api = any(p.get("has_api") for p in portals or [])

    # Score 5: muy difícil (estructuralmente raro)
    if not portals or not portal_kinds or portal_kinds == {"other"}:
        return 5

    # Score 4: empresa pública
    if kind == "empresa_publica":
        return 4

    # Score 1: muy fácil (organismos grandes con open_data/estadistica + API)
    if kind in ("gobierno_autonomico", "organismo") and (
        {"open_data", "estadistica"} & portal_kinds
    ) and has_api:
        return 1

    # Score 2: fácil (cabildos o portales de datos geoespaciales/estadísticos sin API)
    if kind in ("cabildo",) or ({"open_data", "geoespacial", "estadistica"} & portal_kinds):
        return 2

    # Score 3: media por defecto (ayuntamientos y resto)
    return 3


def repartir(entidades):
    # Calcula score y ordena por score DESC (primero las difíciles)
    scored = [
        {
            "id": e.get("id"),
            "name": e.get("name"),
            "score": calcular_score(e),
        }
        for e in entidades
    ]
    scored.sort(key=lambda x: x["score"], reverse=True)

    # Inicializar cestas por programador
    cestas = {p: {"total_score": 0, "items": []} for p in PROGRAMADORES}

    # Estrategia greedy: asignar cada entidad al que tenga menos score acumulado
    for item in scored:
        # elegir programador con menor total_score
        asignado = min(cestas.keys(), key=lambda p: cestas[p]["total_score"])
        cestas[asignado]["items"].append(item)
        cestas[asignado]["total_score"] += item["score"]

    return cestas


def main():
    with DATA_PATH.open("r", encoding="utf-8") as f:
        entidades = json.load(f)

    cestas = repartir(entidades)

    print(f"Total entidades: {len(entidades)}\n")
    for prog in PROGRAMADORES:
        info = cestas[prog]
        print(f"=== {prog} ===")
        print(f"Total entidades: {len(info['items'])}")
        print(f"Suma de dificultad: {info['total_score']}")
        print("Listado:")
        for item in info["items"]:
            print(f"  - ({item['score']}) {item['id']} – {item['name']}")
        print()


if __name__ == "__main__":
    main()