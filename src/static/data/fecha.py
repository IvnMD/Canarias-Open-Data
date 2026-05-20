"""
=========================================================
Open Data Canarias
Metadata Updater Script (UPDATED PATH HANDLING)
=========================================================
"""

import json
import requests
import os
from datetime import datetime


# =========================================================
# CONFIGURATION
# =========================================================

# Base directory of this script (prevents path errors)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the JSON file (always relative to script location)
JSON_FILE = os.path.join(BASE_DIR, "entidades.json")

# HTTP request timeout (seconds)
TIMEOUT = 10


# =========================================================
# LOAD JSON FILE
# =========================================================

def load_entities():
    """
    Loads entidades.json into memory.
    """
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# =========================================================
# SAVE JSON FILE
# =========================================================

def save_entities(data):
    """
    Saves updated entities back to entidades.json.
    """
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            indent=2,
            ensure_ascii=False
        )


# =========================================================
# DETECT CKAN API URL
# =========================================================

def build_ckan_api_url(portal_url):
    portal_url = portal_url.rstrip("/")
    return f"{portal_url}/api/3/action/package_search?rows=1"


# =========================================================
# FETCH LAST MODIFIED DATE
# =========================================================

def fetch_last_updated(portal_url):
    try:
        api_url = build_ckan_api_url(portal_url)
        print(f"🔍 Fetching: {api_url}")

        response = requests.get(api_url, timeout=TIMEOUT)
        response.raise_for_status()

        data = response.json()

        results = data.get("result", {}).get("results", [])

        if not results:
            print("⚠️ No datasets found")
            return None

        first_dataset = results[0]
        last_modified = first_dataset.get("metadata_modified")

        if not last_modified:
            print("⚠️ metadata_modified missing")
            return None

        try:
            parsed_date = datetime.fromisoformat(last_modified.replace("Z", ""))
            return parsed_date.strftime("%Y-%m-%d")
        except Exception:
            return last_modified

    except requests.RequestException as e:
        print(f"❌ Request error: {e}")
        return None

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None


# =========================================================
# PROCESS ALL ENTITIES
# =========================================================

def update_entities():
    entities = load_entities()
    total_updated = 0

    for entity in entities:
        entity_name = entity.get("name", "Unknown Entity")

        print("\n================================================")
        print(f"🏛️ Entity: {entity_name}")
        print("================================================")

        for portal in entity.get("portals", []):
            portal_name = portal.get("name", "Unnamed Portal")
            portal_url = portal.get("url")

            if not portal_url:
                print(f"⚠️ {portal_name}: Missing URL")
                continue

            print(f"\n🌐 Portal: {portal_name}")

            last_updated = fetch_last_updated(portal_url)

            if last_updated:
                portal["last_updated"] = last_updated
                total_updated += 1
                print(f"✅ Updated: {last_updated}")
            else:
                portal["last_updated"] = None
                print("⚠️ Could not retrieve date")

    save_entities(entities)

    print("\n================================================")
    print("🎉 UPDATE COMPLETE")
    print("================================================")
    print(f"Updated portals: {total_updated}")


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    update_entities()
