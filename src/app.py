#Imports
#Flask: Main web framework
#json: Used to load the local JSON dataset
#os: Used to build platform-independent file paths

from flask import Flask, jsonify, render_template
import json
import os
#Application Initialization
#Creates the Flask application instance.
app = Flask(__name__)

#Base Directory Resolution
#Determines the absolute path of the directory containing the application file.
#This ensures that file paths work correctly regardless of where the app is run from.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
#JSON Path Construction
#Builds the path to the JSON file containing the dataset of entities.
JSON_PATH = os.path.join(
    BASE_DIR,
    "static",
    "data",
    "entidades.json"
)
#Home Page
#Defines the route for the home page ("/") and renders the "index.html" template when accessed.
@app.route("/")
def home():
    return render_template("index.html")
    
#Map Page
#Defines the route for the map page ("/mapa") and renders the "mapa.html" template when accessed.
@app.route("/mapa")
def mapa():
    return render_template("mapa.html")

#API Endpoint for Entities
#Opens the JSON file using UTF-8 encoding
#Loads its contents into a Python object
#Serializes and returns it as a Flask JSON response
@app.route("/api/entidades")
def obtener_entidades():

    with open(JSON_PATH, "r", encoding="utf-8") as file:
        datos = json.load(file)

    return jsonify(datos)
#Statistics Page
#Defines the route for the statistics page ("/estadisticas") and renders the "estadisticas.html" template when accessed.
@app.route("/estadisticas")
def estadisticas():
    return render_template("estadisticas.html")



if __name__ == "__main__":
    app.run(debug=True)