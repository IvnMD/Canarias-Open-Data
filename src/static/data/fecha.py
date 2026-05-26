# Open Data Canarias — Universal API Metadata Updater (Simplified Version)

"""
=========================================================
Open Data Canarias
Universal API Metadata Updater (SIMPLIFIED VERSION)
=========================================================
"""

import json
import requests
import os
from datetime import datetime


# =========================================================
# CONFIG
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, "entidades.json")
TIMEOUT = 10


# =========================================================
# LOAD / SAVE
# =========================================================


def load_entities():
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        return json.load(f)



def save_entities(data):
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# =========================================================
# SAFE HTTP / JSON
# =========================================================


def safe_get(url):
    headers = {
        "User-Agent": "OpenData-API-Checker/1.0",
        "Accept": "application/json"
    }
    return requests.get(url, headers=headers, timeout=TIMEOUT)



def safe_json(response):
    try:
        if not response or not response.text:
            return None

        if "application/json" not in response.headers.get("Content-Type", ""):
            return None

        return response.json()
    except ValueError:
        return None


# =========================================================
# API DETECTION
# =========================================================


def is_ckan_action(url):
    try:
        r = safe_get(url.rstrip("/") + "/api/3/action/site_read")
        data = safe_json(r)
        return r.status_code == 200 and data and data.get("success") is True
    except Exception:
        return False



def is_ckan_rest(url):
    try:
        r = safe_get(url.rstrip("/") + "/api/rest/package")
        data = safe_json(r)
        return r.status_code == 200 and isinstance(data, list)
    except Exception:
        return False



def is_socrata(url):
    try:
        r = safe_get(url.rstrip("/") + "/api/views")
        data = safe_json(r)
        return r.status_code == 200 and isinstance(data, list)
    except Exception:
        return False



def is_arcgis(url):
    try:
        r = safe_get(url.rstrip("/") + "/api/search/v1")
        data = safe_json(r)
        return r.status_code == 200 and data and "results" in data
    except Exception:
        return False


# =========================================================
# MAIN PROCESS
# =========================================================


def update_entities():
    entities = load_entities()
    updated = 0

    # Fecha actual de ejecución
    today = datetime.now().strftime("%Y-%m-%d")

    for entity in entities:
        print("\n================================================")
        print(f"🏛️ Entity: {entity.get('name', 'Unknown')}")
        print("================================================")

        for portal in entity.get("portals", []):
            name = portal.get("name", "Unnamed portal")
            url = portal.get("url")

            print(f"\n🌐 Portal: {name}")

            if not url:
                print("⚠️ Missing URL")
                continue

            try:
                if is_ckan_action(url):
                    portal["api_type"] = "CKAN_ACTION"
                    portal["last_updated"] = today

                elif is_ckan_rest(url):
                    portal["api_type"] = "CKAN_REST"
                    portal["last_updated"] = today

                elif is_socrata(url):
                    portal["api_type"] = "SOCRATA"
                    portal["last_updated"] = today

                elif is_arcgis(url):
                    portal["api_type"] = "ARCGIS"
                    portal["last_updated"] = today

                else:
                    portal["api_type"] = "UNKNOWN"
                    portal["last_updated"] = None

                if portal["last_updated"]:
                    updated += 1
                    print(f"✅ {portal['api_type']} | {portal['last_updated']}")
                else:
                    print(f"⚠️ {portal['api_type']} | No API detected")

            except Exception as e:
                print(f"❌ Unexpected error: {e}")
                portal["api_type"] = "ERROR"
                portal["last_updated"] = None

    save_entities(entities)

    print("\n================================================")
    print("🎉 UPDATE COMPLETE")
    print("================================================")
    print(f"Portals updated: {updated}")


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    update_entities()
