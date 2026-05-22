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


# Local entry point

if __name__ == "__main__":
    # Local development entry point (not used in production Docker images).
    app.run(host="0.0.0.0", port=5000, debug=True)