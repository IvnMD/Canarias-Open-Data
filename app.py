from flask import Flask, jsonify, render_template
import json
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

JSON_PATH = os.path.join(
    BASE_DIR,
    "static",
    "data",
    "entidades.json"
)

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/entidades")
def obtener_entidades():

    with open(JSON_PATH, "r", encoding="utf-8") as file:
        datos = json.load(file)

    return jsonify(datos)


if __name__ == "__main__":
    app.run(debug=True)