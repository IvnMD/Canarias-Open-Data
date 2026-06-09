"""
machineValidator.py
-------------------
Validates and updates the `machine_readable` field of each portal in entidades.json
based on the formats declared in the `formats` field.

Usage:
    python machineValidator.py [--dry-run]

Options:
    --dry-run   Show changes that would be applied without modifying the file.

Output:
    - Prints a summary of updated portals.
    - Overwrites entidades.json with corrected values (unless --dry-run).
"""

import json
import argparse
from pathlib import Path

# ---------------------------------------------------------------------------
# Formats considered machine-readable
# Derived from the analysis of entidades.json catalogue (2026-06)
# ---------------------------------------------------------------------------
MR_FORMATS: set[str] = {
    # Tabular
    "CSV", "JSON", "XML", "XLSX", "XLS", "XLSM", "ODS", "TSV",
    # Structured geospatial
    "GEOJSON", "KML", "SHP", "GML", "GPKG", "GDB",
    # Linked Data / Semantic
    "RDF", "RDF-XML", "N3", "TURTLE",
    # Statistical / Transport
    "PC-AXIS", "GTFS",
    # Other structured
    "NETCDF",
}

# Aliases to normalise name variants found in the catalogue
FORMAT_ALIASES: dict[str, str] = {
    "PC-AXIS (.PX)": "PC-AXIS",
    "SHAPEFILE (SHP)": "SHP",
    "GPKG (GEOPACKAGE)": "GPKG",
    "WMS (ESTÁNDAR OGC)": "WMS",
    "WFS (ESTÁNDAR OGC)": "WFS",
    "WCS (ESTÁNDAR OGC)": "WCS",
    "RINEX (PARA GNSS)": "RINEX",
    "DEM (MODELOS DE ELEVACIÓN)": "DEM",
}


def normalize_format(fmt: str) -> str:
    """Normalise a format string to uppercase and resolve known aliases."""
    upper = fmt.strip().upper()
    return FORMAT_ALIASES.get(upper, upper)


def is_machine_readable(formats: list[str]) -> bool:
    """Return True if at least one format in the list is machine-readable."""
    return any(normalize_format(f) in MR_FORMATS for f in formats)


def validate(data: list[dict], dry_run: bool = False) -> int:
    """
    Iterate over all entities and portals and fix the `machine_readable` field.
    Returns the number of portals that were (or would be) modified.
    """
    changes = 0
    for entity in data:
        for portal in entity.get("portals", []):
            formats = portal.get("formats", [])
            expected = is_machine_readable(formats)
            current = portal.get("machine_readable")

            if current != expected:
                status = "DRY-RUN" if dry_run else "UPDATED"
                print(
                    f"[{status}] {entity['id']} / {portal['id']}: "
                    f"machine_readable {current!r} -> {expected!r}  "
                    f"(formats: {formats})"
                )
                if not dry_run:
                    portal["machine_readable"] = expected
                changes += 1

    return changes


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate machine_readable field in entidades.json")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show changes without modifying the file",
    )
    args = parser.parse_args()

    json_path = Path(__file__).parent.parent / "data" / "entidades.json"
    if not json_path.exists():
        print(f"ERROR: File not found: {json_path}")
        return

    with json_path.open(encoding="utf-8") as fh:
        data = json.load(fh)

    changes = validate(data, dry_run=args.dry_run)

    if not args.dry_run and changes > 0:
        with json_path.open("w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        print(f"\n✅ {changes} portal(s) updated in {json_path.name}")
    elif args.dry_run:
        print(f"\n🔍 Dry-run: {changes} portal(s) would be modified.")
    else:
        print("✅ Everything is correct, no changes needed.")


if __name__ == "__main__":
    main()