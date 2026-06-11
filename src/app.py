import os
import json
from flask import Flask, jsonify, render_template, request
from flask.json.provider import DefaultJSONProvider

DefaultJSONProvider.sort_keys = False

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

# Absolute path to the entities catalog
ENTIDADES_JSON = os.path.join(DATA_DIR, "entidades.json")

# In-memory cache: populated on first request, reused on subsequent ones.
# Restart the process to reload the file after an update.
_entities_cache = None


def load_entities():
    """
    Load the entities catalog from entidades.json.

    The result is cached in memory after the first load so that subsequent
    requests do not hit the filesystem.  Restart the process to pick up
    changes to the JSON file.

    Returns an empty list and logs an error if the file is missing or
    malformed, so the app degrades gracefully instead of returning HTTP 500.
    """
    global _entities_cache
    if _entities_cache is None:
        try:
            with open(ENTIDADES_JSON, "r", encoding="utf-8") as f:
                _entities_cache = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as exc:
            app.logger.error("Could not load entidades.json: %s", exc)
            return []
    return _entities_cache


# HTML views

@app.route("/")
def home():
    """Main landing page for the catalog explorer."""
    return render_template("index.html")


@app.route("/mapa")
def mapa():
    """Map view showing all entities with coordinates."""
    return render_template("mapa.html")


@app.route("/estadisticas")
def estadisticas():
    """Summary view with charts and aggregate statistics."""
    return render_template("estadisticas.html")


@app.route("/acerca")
def acerca():
    """Informational page about methodology, sources and catalog schema."""
    return render_template("acerca.html")


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
                       Exact match against ``entity_kind``.
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
        """Return True if the entity has at least one portal with an API."""
        return any(
            # Fixed: JSON field is "has_api", not "hasapi"
            p.get("has_api") is True or bool(p.get("apis"))
            for p in e.get("portals", [])
        )

    def entity_has_topic(e, topic_query):
        """Return True if any portal topic contains the query string."""
        for p in e.get("portals", []):
            for t in p.get("topics", []):
                if topic_query in t.lower():
                    return True
        return False

    result = entidades

    if island:
        result = [e for e in result if island in e.get("islands", [])]

    if kind:
        # Fixed: JSON field is "entity_kind", not "entitykind"
        result = [e for e in result if e.get("entity_kind", "") == kind]

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
    Lightweight endpoint returning aggregated KPIs for the statistics page.

    Computing aggregates server-side avoids processing the full JSON payload
    in the browser on every page load.

    Returns a JSON object with the following fields
    -----------------------------------------------
    total_entidades      (int)  : total number of entities in the catalog
    total_portales       (int)  : total number of portals across all entities
    total_datasets       (int)  : sum of dataset_count for local-scope entities
                                  (entities with scope "estatal" or "europeo" are
                                  excluded to avoid inflating the Canarian figure)
    con_api              (int)  : entities with at least one API declared
    machine_readable_pct (int)  : percentage of portals with machine-readable formats
    por_tipo             (dict) : entity count grouped by entity_kind
    por_isla             (dict) : entity count grouped by island
    """
    entidades = load_entities()

    total_entidades = len(entidades)

    total_portales = sum(len(e.get("portals", [])) for e in entidades)

    # Exclude state-level and European entities to keep the dataset count
    # representative of the Canarian open-data ecosystem.
    LOCAL_SCOPES = {"autonomico", "insular", "municipal"}
    total_datasets = 0
    for e in entidades:
        if e.get("scope") not in LOCAL_SCOPES:
            continue
        for p in e.get("portals", []):
            # Fixed: JSON field is "dataset_count", not "datasetcount"
            count = p.get("dataset_count")
            if isinstance(count, (int, float)) and count:
                total_datasets += int(count)

    con_api = sum(
        1 for e in entidades
        if any(
            # Fixed: JSON field is "has_api", not "hasapi"
            p.get("has_api") is True or bool(p.get("apis"))
            for p in e.get("portals", [])
        )
    )

    # Formats considered machine-readable for the MR percentage KPI
    MACHINE_READABLE = {"CSV", "JSON", "GEOJSON", "XML", "XLSX", "ODS", "RDF"}

    portales_mr = sum(
        1 for e in entidades
        for p in e.get("portals", [])
        if any(f.upper() in MACHINE_READABLE for f in p.get("formats", []))
    )
    # Guard against an empty catalog; return 0 instead of dividing by 1
    machine_readable_pct = (
        round((portales_mr / total_portales) * 100) if total_portales else 0
    )

    # Distribution by entity_kind
    por_tipo = {}
    for e in entidades:
        # Fixed: JSON field is "entity_kind", not "entitykind"
        kind = e.get("entity_kind", "unknown")
        por_tipo[kind] = por_tipo.get(kind, 0) + 1

    # Distribution by island
    # Note: entities covering all islands are counted once per island entry,
    # so the sum of por_isla values will exceed total_entidades.
    por_isla = {}
    for e in entidades:
        for isla in e.get("islands", []):
            por_isla[isla] = por_isla.get(isla, 0) + 1

    return jsonify({
        "total_entidades":       total_entidades,
        "total_portales":        total_portales,
        "total_datasets":        total_datasets,
        "con_api":               con_api,
        "machine_readable_pct":  machine_readable_pct,
        "por_tipo":              por_tipo,
        "por_isla":              por_isla,
    })


# Local entry point

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)