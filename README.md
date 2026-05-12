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
/
├── entidades.json
├── generar_web.py
├── index.html
├── README.md
└── assets/
```

---

# Fuente de verdad: `entidades.json`

Toda la información del proyecto se centraliza en `entidades.json`.

El fichero contiene un array de entidades con estructura normalizada:

```json
{
  "id": "cabildo_tenerife",
  "nombre": "Cabildo de Tenerife",
  "tipo": "cabildo",
  "isla": "Tenerife",
  "portal_url": "https://...",
  "api_url": "https://...",
  "tecnologia_portal": "CKAN",
  "tipos_datos": ["turismo", "movilidad"],
  "formatos": ["CSV", "JSON"],
  "num_datasets": 120,
  "licencia": "CC BY 4.0",
  "ultimo_actualizado": "2026-05",
  "descripcion": "Portal de datos abiertos del Cabildo de Tenerife",
  "coordenadas": {
    "lat": 28.4636,
    "lon": -16.2518
  }
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

# Uso

Generar la web:

```bash
python generar_web.py --output index.html
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
