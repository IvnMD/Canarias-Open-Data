# Practicas-DAM-Datos-Abiertos

Este proyecto recopila, estructura y presenta información sobre organismos públicos canarios que publican datos abiertos o información de transparencia, incluyendo administraciones autonómicas, los 7 cabildos, los 88 municipios de Canarias, organismos estadísticos y geoespaciales, entidades estatales con datos relevantes para las islas, y portales de referencia europeos.

La aplicación genera automáticamente una web dinámica a partir de un fichero JSON centralizado (`entidades.json`), permitiendo explorar entidades, tecnologías, formatos, APIs y tipologías de datasets publicados en Canarias.

---

# Objetivos

El proyecto busca:

- Mapear el ecosistema completo de datos abiertos y transparencia de Canarias
- Centralizar información dispersa sobre portales públicos canarios
- Facilitar la exploración de datasets, APIs y portales de transparencia
- Visualizar el estado de madurez tecnológica del ecosistema
- Crear una base reutilizable para investigación y transparencia pública
- Generar una aplicación Flask portable y fácilmente desplegable

---

# Qué incluye

## Cobertura del catálogo

El catálogo documenta el ecosistema completo de publicación de datos públicos en Canarias, incluyendo entidades de ámbito autonómico, insular, municipal, estatal y europeo relevantes para las islas.

### Administración autonómica

- Gobierno de Canarias — Portal de Datos Abiertos (`datos.canarias.es`)
- Portal de Gobierno Abierto del Gobierno de Canarias
- ISTAC — Instituto Canario de Estadística (21.755+ datasets, APIs eDatos)
- GRAFCAN / SITCAN — Sistema de Información Territorial de Canarias
- Comisionado de Transparencia y Acceso a la Información Pública de Canarias

### Cabildos insulares

Los 7 cabildos de Canarias, con sus portales de datos abiertos y de transparencia:

- Cabildo de Tenerife
- Cabildo de Gran Canaria — IDE Gran Canaria
- Cabildo de Lanzarote
- Cabildo de Fuerteventura
- Cabildo Insular de La Palma
- Cabildo de La Gomera
- Cabildo de El Hierro

### Ayuntamientos

Los **88 municipios de Canarias**, con documentación de sus portales de transparencia, sedes electrónicas y, donde existen, portales de datos abiertos reutilizables.

Municipios con portal de datos abiertos destacado:

- Las Palmas de Gran Canaria — CKAN (`datosabiertos.laspalmasgc.es`)
- Santa Cruz de Tenerife — CKAN (`santacruzdetenerife.es/opendata`)
- Arona — CKAN (`opendataarona`)

Resto de municipios: portal de transparencia activa conforme a la Ley 12/2014 de Canarias y/o Ley 19/2013 estatal.

### Organismos y entidades estatales

Fuentes con datos desagregados por Canarias o relevantes para el ecosistema insular:

- SEPE — Paro registrado y contratos por provincia canaria
- AENA — Estadísticas de los 8 aeropuertos canarios
- Autoridad Portuaria de Santa Cruz de Tenerife — CKAN (69 datasets)
- Policía Nacional — Estadísticas de criminalidad por CC.AA.
- Ministerio de Justicia — Estadística judicial con datos de Canarias

### Portales de referencia

- OpenStreetMap — Islas Canarias (Overpass API, ODbL)
- European Data Portal (`data.europa.eu`) — datasets federados de Canarias

> **Nota:** No todas las entidades disponen de portal de datos abiertos reutilizables. Muchos ayuntamientos publican únicamente portales de transparencia con documentos PDF o HTML. Esta distinción queda reflejada en el campo `portal.kind` de cada entidad.

---

# Información recopilada

Cada entidad incluye información estructurada sobre:

- Nombre oficial y denominaciones alternativas
- Isla(s) y ámbito administrativo (`scope`)
- Tipo de organismo (`entity_kind`) y entidad padre
- Portales asociados: datos abiertos, transparencia, estadística, geoespacial
- URL, tecnología y estado de cada portal
- API pública disponible y endpoints documentados
- Número aproximado de datasets y formatos soportados
- Licencias de uso
- Categorías temáticas
- Coordenadas geográficas de la sede
- Fecha de última verificación y fuentes
- Nivel de confianza del dato (`verified` / `estimated` / `inferred` / `pending`)

---

# Temáticas de datos

El proyecto clasifica datasets en categorías como:

- Turismo
- Medio ambiente
- Demografía
- Movilidad y transporte
- Urbanismo y territorio
- Cartografía y geoespacial
- Economía y hacienda
- Salud
- Cultura y deporte
- Educación
- Empleo
- Administración pública y transparencia
- Seguridad
- Energía
- Ciencia y tecnología

---

# Tecnologías detectadas

## Plataformas de portal

- CKAN (Gobierno de Canarias, Tenerife, Las Palmas GC, La Palma Smart Open, AP Tenerife…)
- ArcGIS Hub / ArcGIS Online (Open Data La Palma, IDE Gran Canaria)
- Portales propios / custom (Lanzarote, Comisionado de Transparencia…)
- STA / Gestiona — sede electrónica municipal (mayoría de ayuntamientos)
- eDatos ISTAC — infraestructura estadística propia

## APIs y estándares

- REST / CKAN Action API
- OGC WMS / WFS / WCS
- SPARQL
- DCAT-AP 2.1.1
- INSPIRE
- NTRIP (red GNSS GRAFCAN)

## Formatos más frecuentes

- CSV, JSON, GeoJSON, XML
- KML, KMZ, SHP, GPKG, GML
- XLSX, ODS, PDF
- PC-Axis (.px) — estadísticas ISTAC
- GTFS — transporte público

---

# Arquitectura del proyecto

```text
proyecto/
├── src/
│   ├── app.py                        # Flask: rutas web + API REST
│   ├── templates/
│   │   ├── index.html                # Vista principal — catálogo de entidades
│   │   ├── mapa.html                 # Vista mapa interactivo (Leaflet)
│   │   ├── estadisticas.html         # Vista estadísticas (Chart.js)
│   │   └── acerca.html               # Vista metodología y documentación
│   └── static/
│       ├── assets/                   # Logo SVG y otros recursos
│       ├── css/
│       │   ├── tokens.css            # Variables de tema (light + dark)
│       │   ├── base.css              # Reset y layout base
│       │   ├── components.css        # Componentes compartidos
│       │   └── pages/
│       │       ├── acerca.css
│       │       ├── estadisticas.css
│       │       └── mapa.css
│       ├── js/
│       │   └── app.js                # Lógica del buscador principal
│       ├── utils/
│       │   ├── validadorJson.py      # Valida entidades.json contra el schema
│       │   ├── machineValidator.py   # Comprueba formatos machine-readable
│       │   ├── inspeccionarEntidadJson.py  # Inspección y diagnóstico del catálogo
│       │   ├── repartirEntidades.py  # Distribuye entidades por dificultad para validar.
│       │   └── rdf.py                # Exportación RDF del catálogo
│       └── data/
│           ├── entidades.json        # Fuente de verdad del catálogo
│           ├── entidades.schema.json # JSON Schema 2020-12 (referencia normativa)
│           └── fecha.py              # Script actualización last_updated (CKAN APIs)
│
├── docker/                           # Configuración Docker dev/prod
├── .github/                          # Workflows CI/CD, templates issues y PRs
├── tests/                            # Tests pytest
├── run.py
└── README.md
```

---

## Scripts de utilidad (`src/static/utils/`)

| Script | Función |
|---|---|
| `validadorJson.py` | Valida `entidades.json` contra `entidades.schema.json` |
| `machineValidator.py` | Comprueba qué portales tienen formatos machine-readable |
| `inspeccionarEntidadJson.py` | Diagnóstico y estadísticas del catálogo |
| `repartirEntidades.py` | Distribuye entidades por isla y tipo para revisión |
| `rdf.py` | Exporta el catálogo en formato RDF |

Ejecutar desde la raíz del proyecto:

```bash
python src/static/utils/validadorJson.py
```

# Fuente de verdad: `entidades.json`

Toda la información del proyecto se centraliza en `src/static/data/entidades.json`.

El schema oficial está definido en `entidades.schema.json` (JSON Schema 2020-12).

**Campos obligatorios por entidad:** `id` · `name` · `entity_kind` · `scope` · `islands` · `description` · `verification`

```json
{
  "id": "string",
  "name": "string",
  "entity_kind": "gobierno_autonomico | cabildo | ayuntamiento | organismo | empresa_publica",
  "scope": "autonomico | insular | municipal | estatal | europeo",
  "parent_entity_id": "string|null",
  "islands": ["Todas", "Gran Canaria", "Tenerife", "..."],
  "description": "string",
  "portals": [
    {
      "id": "string",
      "kind": "open_data | transparencia | estadistica | geoespacial | agregador | other",
      "url": "string",
      "technology": ["CKAN"],
      "has_api": true,
      "machine_readable": true,
      "last_checked": "YYYY-MM"
    }
  ],
  "verification": {
    "status": "verified | estimated | inferred | pending",
    "last_checked": "YYYY-MM",
    "source_urls": ["string"]
  },
  "notes": "string|null"
}
```

---

# Instalación y uso

## Instalación local

```bash
git clone https://github.com/IvnMD/Practicas-DAM-Datos-Abiertos.git
cd Practicas-DAM-Datos-Abiertos
pip install flask
python run.py
```

Abre en el navegador: `http://localhost:5000`

---

## Ejecución con Docker

```bash
cd docker
docker compose build
docker compose up
```

Disponible en:

- Web: `http://localhost:8000/`
- API entidades: `http://localhost:8000/api/entidades`
- API stats: `http://localhost:8000/api/stats`

El fichero `entidades.json` se monta como volumen — edita y recarga sin reconstruir.

```bash
cd docker && docker compose down
```

---

## API REST

La aplicación expone una API REST ligera servida por Flask.  
URL base (local): `http://localhost:5000` · Docker: `http://localhost:8000`

---

### `GET /api/entidades`

Devuelve el catálogo completo de entidades como array JSON.  
Todos los parámetros son opcionales y combinables entre sí.

| Parámetro | Tipo | Descripción | Valores válidos |
|-----------|------|-------------|-----------------|
| `island` | `string` | Filtra por isla. Coincidencia exacta con el campo `islands`. | `Tenerife` · `Gran Canaria` · `La Palma` · `Lanzarote` · `Fuerteventura` · `La Gomera` · `El Hierro` · `La Graciosa` · `Todas` |
| `kind` | `string` | Filtra por tipo de entidad. Coincidencia exacta. | `cabildo` · `ayuntamiento` · `organismo` · `gobierno_autonomico` · `empresa_publica` |
| `scope` | `string` | Filtra por ámbito administrativo. Coincidencia exacta. | `autonomico` · `insular` · `municipal` · `estatal` · `europeo` |
| `topic` | `string` | Búsqueda parcial sin distinción de mayúsculas contra `topics` de cada portal. | Libre — ej. `turismo`, `medio_ambiente` |
| `has_api` | `boolean` | `true` → solo entidades con al menos una API declarada. `false` → sin ninguna. | `true` · `false` |

**Ejemplos**

```bash
# Todas las entidades
curl http://localhost:5000/api/entidades

# Cabildos de Tenerife
curl "http://localhost:5000/api/entidades?island=Tenerife&kind=cabildo"

# Ayuntamientos con datos de turismo que tengan API
curl "http://localhost:5000/api/entidades?scope=municipal&topic=turismo&has_api=true"

# Entidades sin ninguna API
curl "http://localhost:5000/api/entidades?has_api=false"
```

Devuelve `[]` cuando ninguna entidad coincide con los filtros — nunca devuelve error por falta de resultados.

---

### `GET /api/stats`

Devuelve KPIs agregados del catálogo. No admite parámetros.

```bash
curl http://localhost:5000/api/stats
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total_entidades` | `int` | Número total de entidades en el catálogo |
| `total_portales` | `int` | Número total de portales entre todas las entidades |
| `total_datasets` | `int` | Suma de `dataset_count` de todos los portales |
| `con_api` | `int` | Entidades con al menos una API declarada |
| `machine_readable_pct` | `int` | Porcentaje de portales con formatos legibles por máquina |
| `por_tipo` | `object` | Distribución de entidades por `entity_kind` |
| `por_isla` | `object` | Distribución de entidades por isla |

**Ejemplo de respuesta**

```json
{
  "total_entidades": 228,
  "total_portales": 348,
  "total_datasets": 58063,
  "con_api": 83,
  "machine_readable_pct": 34,
  "por_tipo": {
    "ayuntamiento": 87,
    "cabildo": 7,
    "empresa_publica": 37,
    "gobierno_autonomico": 2,
    "organismo": 95
  },
  "por_isla": {
    "Tenerife": 49,
    "Gran Canaria": 55,
    "La Palma": 28,
    "Fuerteventura": 22,
    "Lanzarote": 19,
    "El Hierro": 20,
    "La Gomera": 20,
    "La Graciosa": 10,
    "Todas": 93
  }
}
```

> Los valores reflejan el estado actual de `entidades.json` en tiempo de ejecución.

---

# Actualizar el catálogo

1. Editar `src/static/data/entidades.json` cumpliendo el schema
2. Campos obligatorios en cada entidad nueva: `id`, `name`, `entity_kind`, `scope`, `islands`, `description`, `verification`
3. Indicar siempre `verification.status`, `verification.last_checked` (formato `YYYY-MM`) y `verification.source_urls`
4. Para actualizar `last_updated` consultando las APIs CKAN:

```bash
python src/static/data/fecha.py
```

---

# Características de la web

- `/` — Catálogo principal con tarjetas y filtros
- `/mapa` — Mapa interactivo (Leaflet)
- `/estadisticas` — Gráficos y KPIs (Chart.js)
- Responsive mobile-first · Modo claro/oscuro · Paleta teal `#01696f`

---

# Tecnologías utilizadas

| Capa | Tecnología |
|------|------------|
| Backend | Python 3.9+ · Flask · Jinja2 |
| Frontend | HTML5 · CSS3 · JavaScript vanilla |
| Mapas | Leaflet.js (CDN) |
| Gráficos | Chart.js (CDN) |
| Datos | JSON (sin base de datos) |
| CI/CD | GitHub Actions |
| Contenedores | Docker · Docker Compose |
| Tests | pytest |

---

# Roadmap

- Integración automática con APIs CKAN para sincronizar `dataset_count`
- Validación automática de disponibilidad de portales
- Exportación DCAT-AP del catálogo completo
- Métricas comparativas entre islas
- Ampliar cobertura de empresas públicas y universidades
- Añadir las mas de 1.000 empresas que publican datos de transparencia en Canarias (datos de <https://transparenciacanarias.org/>)

---

# Documentación del equipo

- [Guía de contribución](./CONTRIBUTING.md)
- [Gestión de tareas](./GESTION_PROYECTO.md)

---

# Licencia

GPL-3.0 license
