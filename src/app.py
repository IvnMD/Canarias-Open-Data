import os
import json
from flask import Flask, jsonify, render_template, request

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
    Return the entities catalog as JSON, with optional query-param filters.

    All parameters are optional and combinable.
    Returns an empty list (not an error) when no entities match.

    Query parameters
    ----------------
    island   : str  -- Filter by island name (e.g. "Tenerife", "Gran Canaria").
                       Matches if the value is present in the entity's ``islands`` list.
    kind     : str  -- Filter by entity kind (e.g. "cabildo", "ayuntamiento").
                       Exact match against ``entitykind``.
    scope    : str  -- Filter by administrative scope (e.g. "insular", "municipal").
                       Exact match against ``scope``.
    topic    : str  -- Filter by topic (e.g. "turismo", "medio_ambiente").
                       Case-insensitive partial match against the ``topics`` list
                       of every portal the entity has.
    has_api  : bool -- "true" returns only entities with at least one API declared.
                       "false" returns only entities without any API.
    """
    entidades = load_entities()

    island  = request.args.get("island",  "").strip()
    kind    = request.args.get("kind",    "").strip()
    scope   = request.args.get("scope",   "").strip()
    topic   = request.args.get("topic",   "").strip().lower()
    has_api = request.args.get("has_api", "").strip().lower()

    def entity_has_api(e):
        return any(
            p.get("hasapi") is True or bool(p.get("apis"))
            for p in e.get("portals", [])
        )

    def entity_has_topic(e, topic_query):
        for p in e.get("portals", []):
            for t in p.get("topics", []):
                if topic_query in t.lower():
                    return True
        return False

    result = entidades

    if island:
        result = [e for e in result if island in e.get("islands", [])]

    if kind:
        result = [e for e in result if e.get("entitykind", "") == kind]

    if scope:
        result = [e for e in result if e.get("scope", "") == scope]

    if topic:
        result = [e for e in result if entity_has_topic(e, topic)]

    if has_api == "true":
        result = [e for e in result if entity_has_api(e)]
    elif has_api == "false":
        result = [e for e in result if not entity_has_api(e)]

    return jsonify(result)


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

    total_portales = sum(len(e.get("portals", [])) for e in entidades)

    total_datasets = 0
    for e in entidades:
        for p in e.get("portals", []):
            count = p.get("datasetcount")
            if isinstance(count, (int, float)) and count:
                total_datasets += int(count)

    con_api = sum(
        1 for e in entidades
        if any(
            p.get("hasapi") is True or bool(p.get("apis"))
            for p in e.get("portals", [])
        )
    )

    MACHINE_READABLE = {"CSV", "JSON", "GEOJSON", "XML", "XLSX", "ODS", "RDF"}
    portales_total = total_portales or 1
    portales_mr = sum(
        1 for e in entidades
        for p in e.get("portals", [])
        if any(f.upper() in MACHINE_READABLE for f in p.get("formats", []))
    )
    machine_readable_pct = round((portales_mr / portales_total) * 100)

    por_tipo = {}
    for e in entidades:
        kind = e.get("entitykind", "desconocido")
        por_tipo[kind] = por_tipo.get(kind, 0) + 1

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
    app.run(host="0.0.0.0", port=5000, debug=True)
