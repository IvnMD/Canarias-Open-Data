# Practicas-DAM-Datos-Abiertos

Este proyecto recopila, estructura y presenta información sobre organismos públicos canarios que publican datos abiertos, incluyendo administraciones autonómicas, cabildos, ayuntamientos, organismos estadísticos, entidades geoespaciales y empresas públicas.

La aplicación genera automáticamente una web estática a partir de un fichero JSON centralizado, permitiendo explorar entidades, tecnologías, formatos, APIs y tipologías de datasets publicados en Canarias.

---

# Objetivos

El proyecto busca:

- Mapear el ecosistema open data de Canarias
- Centralizar información dispersa sobre portales públicos
- Facilitar la exploración de datasets y APIs
- Visualizar el estado de madurez tecnológica del ecosistema
- Crear una base reutilizable para investigación y transparencia pública
- Generar una web estática portable y fácilmente desplegable

---

# Qué incluye

## Inventario de entidades públicas

El repositorio documenta organismos que publican datos abiertos en Canarias, incluyendo:

### Administración autonómica
- Gobierno de Canarias
- Consejerías
- Organismos dependientes

### Cabildos insulares
- Tenerife
- Gran Canaria
- Lanzarote
- Fuerteventura
- La Palma
- La Gomera
- El Hierro

### Ayuntamientos
- Santa Cruz de Tenerife
- Las Palmas de Gran Canaria
- Arona
- Otros municipios con iniciativas open data

### Organismos especializados
- ISTAC
- Grafcan
- Puertos
- Aeropuertos
- Universidades públicas

### Sector público empresarial
- Empresas públicas
- Entidades instrumentales
- Sociedades mercantiles públicas

---

# Información recopilada

Cada entidad incluye información estructurada sobre:

- Nombre oficial
- Isla
- Tipo de organismo
- URL del portal open data
- API pública disponible
- Tecnología utilizada
- Número aproximado de datasets
- Formatos soportados
- Licencias de uso
- Categorías temáticas
- Coordenadas geográficas
- Fecha de actualización

---

# Temáticas de datos

El proyecto clasifica datasets en categorías como:

- Turismo
- Medio ambiente
- Demografía
- Movilidad
- Transporte
- Urbanismo
- Cartografía
- Economía
- Salud
- Cultura
- Educación
- Administración pública

---

# Tecnologías detectadas

El repositorio también analiza las tecnologías utilizadas por los portales de datos abiertos canarios:

## Plataformas
- CKAN
- ArcGIS Open Data
- Socrata
- Soluciones custom

## APIs y estándares
- REST
- OData
- OGC WMS/WFS
- INSPIRE
- DCAT
- SPARQL

## Formatos
- CSV
- JSON
- GeoJSON
- XML
- KML
- XLSX

---

# Arquitectura del proyecto

```text
proyecto/
│
├── src/
│   │
│   ├── app.py
│   │
│   ├── templates/
│   │   └── index.html
│   │
│   ├── static/
│      ├── css/
│      │   └── style.css
│      │
│      ├── js/
│      │   └── app.js
│      │
│      ├── img/
│      │
│      └── data/
│         └── entidades.json
│    
├── README.md
├── .gitignore
├── venv/
└── run.py
```

---

# Fuente de verdad: `entidades.json`

Toda la información del proyecto se centraliza en `entidades.json`.

El fichero contiene un array de entidades con estructura normalizada:

```json

{
  "id": "string",
  "name": "string",
  "alternate_names": ["string"],
  "entity_kind": "gobierno_autonomico | cabildo | ayuntamiento | organismo | empresa_publica",
  "scope": "autonomico | insular | municipal | estatal | europeo",
  "parent_entity_id": "string|null",
  "islands": ["Todas",
      "Gran Canaria",
      "Tenerife",
      "Lanzarote",
      "Fuerteventura",
      "La Palma",
      "La Gomera",
      "El Hierro",
      "La Graciosa"],
  "description": "string",
  "locations": [
    {
      "kind": "headquarters | office | delegated_office",
      "address": "string",
      "postal_code": "string|null",
      "municipality": "string|null",
      "island": "string|null",
      "coordinates": {
        "lat": 0.0,
        "lon": 0.0
      },
      "source_url": "string"
    }
  ],
  "portals": [
    {
      "id": "string",
      "kind": "open_data | transparencia | estadistica | geoespacial | agregador",
      "name": "string",
      "url": "string",
      "portal_status": "active | archived | provisional | unknown",
      "technology": ["CKAN", "ArcGIS", "Custom"],
      "standards": ["DCAT", "INSPIRE", "OGC"],
      "formats": ["CSV", "JSON", "GeoJSON"],
      "topics": ["turismo", "demografia", "medio_ambiente"],
      "machine_readable": true,
      "has_api": true,
      "apis": [
        {
          "name": "string",
          "url": "string",
          "type": "REST | CKAN API | OGC WMS | OGC WFS | SPARQL | other",
          "documentation_url": "string|null"
        }
      ],
      "dataset_count": 0,
      "dataset_count_note": "string|null",
      "last_updated": "YYYY-MM|null",
      "license_summary": "string|null",
      "licenses": [
        {
          "id": "cc-by-4.0",
          "name": "CC BY 4.0",
          "url": "https://creativecommons.org/licenses/by/4.0/",
          "count": 0
        }
      ]
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

# Generación de la web estática

La web se genera automáticamente mediante `generar_web.py`.

El script:

- Lee `entidades.json`
- Procesa los datos
- Genera un `index.html` autocontenido
- Inserta CSS y JavaScript embebidos
- Construye visualizaciones y filtros dinámicos

---

# Características de la web

## Exploración interactiva
- Buscador global
- Filtros por isla
- Filtros por tecnología
- Filtros por tipo de entidad
- Filtros por temática

## Visualización
- Tarjetas por entidad
- Mapa interactivo con Leaflet
- Gráficos estadísticos con Chart.js
- Contadores automáticos

## Diseño
- Responsive mobile-first
- Modo claro/oscuro
- Inspirado en Nexus Design System
- Paleta beige cálida con acento teal `#01696f`

---

# Tecnologías utilizadas

## Backend de generación
- Python 3.9+

## Frontend generado
- HTML5
- CSS3
- JavaScript vanilla

## Librerías CDN
- Leaflet.js
- Chart.js

---

# Instalación

Clona el repositorio:

```bash
git clone https://github.com/usuario/open-data-canarias.git
cd open-data-canarias
```

---

# 📚 Documentación del equipo
- [Guía de contribución](./CONTRIBUTING.md)
- [Gestión de tareas](./GESTION_PROYECTO.md)

---
# Uso

Generar la web:

Para que el servidor funciones habra que seguir los siguientes pasos.

1.instalar Pip si no lo tienes.
```bash
sudo apt install python3 python-pip
```  
2.Instalar flask.
```bash
sudo apt install python3 python-flask
```
3.instalar flask en el proyecto.
```bash
Pip install flask
```
despues seria iniciar la web con.

```bash
python run.py 
```

Abrir localmente:

```bash
open index.html
```

o simplemente abrir el fichero en el navegador.

---

## 🐳 Ejecución con Docker

Además de la ejecución local con Python y Flask, el proyecto puede levantarse con Docker usando la configuración incluida en la carpeta `docker/`.

### Requisitos previos

- Docker instalado
- Docker Compose (v2 o superior)

### Construir la imagen

Desde la carpeta `docker/`:

```bash
cd docker
docker compose build
```

Esto creará la imagen `docker-web` a partir del código de `src/` y `run.py`.

### Ejecutar la aplicación

```bash
cd docker
docker compose up
```

Una vez levantado el contenedor, la aplicación estará disponible en:

- Web: `http://localhost:8000/`
- API de entidades: `http://localhost:8000/api/entidades`

El servidor Flask se ejecuta dentro del contenedor en el puerto 5000 y se expone hacia el host en el puerto 8000.

### Actualizar los datos

El fichero `src/static/data/entidades.json` se monta dentro del contenedor como volumen de solo lectura.  
Esto significa que puedes editar `entidades.json` en tu máquina y ver los cambios al recargar el navegador, sin necesidad de reconstruir la imagen:

- Ruta en el host: `src/static/data/entidades.json`
- Ruta dentro del contenedor: `/app/src/static/data/entidades.json`

Si cambias la estructura de datos o el código Python, entonces sí debes volver a construir la imagen:

```bash
cd docker
docker compose down
docker compose build
docker compose up
```

### Parar los contenedores

```bash
cd docker
docker compose down
```

---

# Actualizar datos

1. Editar `entidades.json`
2. Añadir nuevas entidades manteniendo el schema
3. Regenerar la web:

```bash
python generar_web.py
```

---

# API

El servidor Flask expone los siguientes endpoints REST.

## `GET /api/entidades`

Devuelve la lista de entidades en formato JSON.  
Todos los parámetros son **opcionales y combinables**. Si no hay coincidencias devuelve `[]`.

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `island` | string | Filtra por isla (coincidencia en la lista `islands`) | `?island=Tenerife` |
| `kind` | string | Filtra por tipo de entidad (`entitykind`) | `?kind=cabildo` |
| `scope` | string | Filtra por ámbito administrativo | `?scope=insular` |
| `topic` | string | Filtra por temática (coincidencia parcial, case-insensitive) | `?topic=turismo` |
| `has_api` | `true`/`false` | Filtra por presencia de API declarada | `?has_api=true` |

### Ejemplos

```bash
# Todos los ayuntamientos de Gran Canaria
GET /api/entidades?island=Gran+Canaria&kind=ayuntamiento

# Entidades con API que publican datos de turismo
GET /api/entidades?topic=turismo&has_api=true

# Cabildos de ámbito insular
GET /api/entidades?kind=cabildo&scope=insular
```

## `GET /api/stats`

Devuelve un resumen agregado de KPIs del catálogo, calculado en servidor.

```json
{
  "total_entidades": 24,
  "total_portales": 31,
  "total_datasets": 4820,
  "con_api": 12,
  "machine_readable_pct": 78,
  "por_tipo": { "cabildo": 8, "ayuntamiento": 6 },
  "por_isla": { "Tenerife": 9, "Gran Canaria": 8 }
}
```

---

# Publicación en GitHub Pages

## Opción rápida

1. Subir el repositorio a GitHub
2. Ir a:

```text
Settings → Pages
```

3. Seleccionar:
- Branch: `main`
- Folder: `/root`

4. Guardar

GitHub Pages publicará automáticamente `index.html`.

---

# Fuentes de información

El proyecto prioriza fuentes oficiales:

- datos.gob.es
- gobcan.es
- istac.es
- grafcan.es
- cabildos insulares
- ayuntamientos
- portales institucionales

---

# Principios del proyecto

- Open Data
- Transparencia pública
- Reutilización de información
- Interoperabilidad
- Minimalismo técnico
- Portabilidad
- Web estática sin backend

---

# Roadmap

Posibles mejoras futuras:

- Integración automática con APIs
- Validación de disponibilidad de datasets
- Exportación DCAT
- Índice de madurez open data
- Métricas comparativas entre islas
- Históricos de datasets
- Automatización CI/CD
- Sincronización periódica

---

# Compatibilidad

## Python
- 3.9+

## Navegadores
- Chrome
- Firefox
- Safari
- Edge

---

# Licencia

GPL-3.0 license
