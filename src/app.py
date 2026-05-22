import os
import json
from flask import Flask, jsonify, render_template

# Application factory and configuration

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)


# Data paths and utilities

# Base directory for this module (points to src/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Directory where JSON data files are stored
DATA_DIR = os.path.join(BASE_DIR, "static", "data")
# Absolute path to the entidades.json file
ENTIDADES_JSON = os.path.join(DATA_DIR, "entidades.json")


def load_entities():
    """
    Load the entities catalog from entidades.json.

    Uses an absolute path derived from this module, so it works
    both in local development and inside a Docker container.
    """
    with open(ENTIDADES_JSON, "r", encoding="utf-8") as f:
        return json.load(f)



# HTML views

@app.route("/")
def home():
    """
    Main landing page for the catalog explorer.
    """
    # The frontend loads entity data via the /api/entidades endpoint.
    return render_template("index.html")


@app.route("/mapa")
def mapa():
    """
    Map view showing all entities with coordinates.
    """
    return render_template("mapa.html")


@app.route("/estadisticas")
def estadisticas():
    """
    Summary view with charts and aggregate statistics.
    """
    return render_template("estadisticas.html")


# REST API

@app.route("/api/entidades")
def api_entidades():
    """
    Return the full list of entities as JSON.

    This endpoint is consumed by the frontend to power filters and visualizations.
    """
    entidades = load_entities()
    return jsonify(entidades)


@app.route("/api/stats")
def api_stats():
    """
    Endpoint ligero con KPIs agregados del catálogo.

    Calcula en servidor para que la página de estadísticas
    cargue el resumen sin procesar el JSON completo en cliente.

    Returns:
        JSON con los siguientes campos:
        - total_entidades (int)
        - total_portales (int)
        - total_datasets (int)
        - con_api (int): entidades con al menos una API declarada
        - machine_readable_pct (int): % portales con formatos legibles por máquina
        - por_tipo (dict): distribución por entitykind
        - por_isla (dict): distribución por isla
    """
    entidades = load_entities()

    total_entidades = len(entidades)

    # Total de portales (una entidad puede tener varios)
    total_portales = sum(len(e.get("portals", [])) for e in entidades)

    # Total datasets sumando datasetcount de cada portal
    total_datasets = 0
    for e in entidades:
        for p in e.get("portals", []):
            count = p.get("datasetcount")
            if isinstance(count, (int, float)) and count:
                total_datasets += int(count)

    # Entidades con al menos una API declarada
    con_api = sum(
        1 for e in entidades
        if any(
            p.get("hasapi") is True or bool(p.get("apis"))
            for p in e.get("portals", [])
        )
    )

    # % portales con formatos machine-readable
    MACHINE_READABLE = {"CSV", "JSON", "GEOJSON", "XML", "XLSX", "ODS", "RDF"}
    portales_total = total_portales or 1
    portales_mr = sum(
        1 for e in entidades
        for p in e.get("portals", [])
        if any(f.upper() in MACHINE_READABLE for f in p.get("formats", []))
    )
    machine_readable_pct = round((portales_mr / portales_total) * 100)

    # Distribución por tipo de entidad
    por_tipo = {}
    for e in entidades:
        kind = e.get("entitykind", "desconocido")
        por_tipo[kind] = por_tipo.get(kind, 0) + 1

    # Distribución por isla (una entidad puede estar en varias islas)
    por_isla = {}
    for e in entidades:
        for isla in e.get("islands", []):
            por_isla[isla] = por_isla.get(isla, 0) + 1

    return jsonify({
        "total_entidades":      total_entidades,
        "total_portales":       total_portales,
        "total_datasets":       total_datasets,
        "con_api":              con_api,
        "machine_readable_pct": machine_readable_pct,
        "por_tipo":             por_tipo,
        "por_isla":             por_isla,
    })


# Local entry point

if __name__ == "__main__":
    # Local development entry point (not used in production Docker images).
    app.run(host="0.0.0.0", port=5000, debug=True)
