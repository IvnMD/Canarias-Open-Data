import urllib.request

urls = [
    "https://datos.canarias.es/catalogos/general/catalog/gobcan.rdf",
    "https://datos.canarias.es/catalogos/estadisticas/dcat/catalog.rdf",
    "https://opendata.sitcan.es/catalog.rdf",
]

for url in urls:
    print(f"\n{'='*60}")
    print(f"URL: {url}")
    print('='*60)
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/rdf+xml"})
        with urllib.request.urlopen(req, timeout=120) as r:
            content = r.read().decode("utf-8")
            total = len(content)
            print(f"Tamaño total: {total} chars ({total/1024:.1f} KB)")
            print("\n--- INICIO (3000 chars) ---")
            print(content[:3000])
            print("\n--- MITAD ---")
            mid = total // 2
            print(content[mid:mid+1000])
            print("\n--- FINAL (1000 chars) ---")
            print(content[-1000:])
    except Exception as e:
        print(f"ERROR: {e}")