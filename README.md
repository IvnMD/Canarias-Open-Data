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
  "id": "string (único, slug)",
  "name": "string (nombre oficial completo)",
  "type": "enum: gobierno_autonomico | organismo_especializado | organismo_especializado_geoespacial | cabildo | ayuntamiento | empresa_publica",
  "islands": ["string"] (ej: ["Todas"] o ["Tenerife", "Gran Canaria"]),
  
  "portal": {
    "url": "string (URL principal del portal)",
    "technology": "string (CKAN | CKAN+OGC | eDatos | Custom | etc.)"
  },
  
  "apis": [
    {
      "name": "string",
      "url": "string",
      "type": "enum: REST | OGC | SOAP | SPARQL | NTRIP | Catálogo",
      "description": "string",
      "access": "enum: Público | Con api-key | Restringido | Híbrido",
      "documentation": "string (URL)"
    }
  ],
  
  "data": {
    "categories": ["string"],
    "formats": ["string"],
    "count": "number | null",
    "count_note": "string | null (si hay aclaraciones)"
  },
  
  "licenses": [
    {
      "type": "string (nombre de licencia)",
      "count": "number | null",
      "url": "string | null"
    }
  ],
  "license_predominant": "string",
  
  "metadata": {
    "last_updated": "string (YYYY-MM)",
    "update_frequency": "string (diaria | semanal | mensual | anual | variable | tiempo_real)",
    "legal_basis": "string | null (leyes/normativa aplicable)"
  },
  
  "organization": {
    "parent_organization": "string | null",
    "publishers": ["string"] (quién publica qué)
  },
  
  "infrastructure": {
    "main_services": ["string"],
    "tools": ["string"],
    "compliance": ["string (INSPIRE | DCAT | OGC | SISC | etc.)"]
  },
  
  "geographic": {
    "coordinates": {
      "lat": "number | null",
      "lon": "number | null"
    },
    "coverage": "string | null (ej: 'Todas las islas')"
  },
  
  "description": "string (resumen ejecutivo)"
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

# Actualizar datos

1. Editar `entidades.json`
2. Añadir nuevas entidades manteniendo el schema
3. Regenerar la web:

```bash
python generar_web.py
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
