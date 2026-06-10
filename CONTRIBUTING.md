# 🗺️ Guía de Contribución y Flujo de Trabajo (Git Flow)

Este documento establece las normas del equipo para mantener la estabilidad del proyecto y evitar conflictos de código.

---

## 📌 La Regla de Oro

La rama `main` debe permanecer siempre estable. **Nadie realiza commits directos sobre `main`.** Todo cambio pasa por una rama de funcionalidad y una revisión de código.

---

## 🔄 Ciclo de Desarrollo Diario

### 1. Sincronizar el entorno local

Antes de comenzar cualquier tarea, asegúrate de tener la última versión aprobada por el equipo:

```bash
git checkout main
git pull origin main
```

### 2. Crear una rama descriptiva

Crea una rama orientada a una tarea específica utilizando minúsculas y guiones:

| Prefijo | Uso |
|---|---|
| `feature/` | Nueva funcionalidad |
| `bugfix/` | Corrección de errores |
| `docs/` | Documentación |
| `data/` | Añadir o actualizar entidades en `entidades.json` |
| `refactor/` | Refactorización sin cambio de comportamiento |

Ejemplo:

```bash
git checkout -b data/añadir-cabildo-lanzarote
git checkout -b feature/filtro-api-formatos
```

### 3. Confirmar cambios con sentido

Realiza commits atómicos (cambios pequeños y lógicos). Si el commit está relacionado con un issue, inclúyelo al inicio del mensaje:

```bash
git commit -m " Añadir entidad Cabildo de Lanzarote"
git commit -m " Eliminar duplicado ISTAC"
```

### 4. Validar antes de publicar

Si has modificado `entidades.json`, ejecuta los validadores antes de hacer push:

```bash
# 1. Valida el JSON contra el schema oficial
python3 src/static/utils/validadorJson.py

# 2. Comprueba qué cambiaría en machine_readable sin modificar nada
python3 src/static/utils/machineValidator.py --dry-run

# 3. Aplica las correcciones si el resultado es correcto
python3 src/static/utils/machineValidator.py
```

### 5. Publicar la rama y solicitar revisión

Sube la rama a GitHub cuando la tarea esté terminada y probada:

```bash
git push origin data/añadir-cabildo-lanzarote
```

### 6. Revisión por Pares (Pull Request)

1. Abre el Pull Request en la interfaz web de GitHub usando la plantilla proporcionada.
2. Vincula el issue correspondiente con `Closes #ID` en la descripción para automatizar el Kanban.
3. Asigna al menos a un compañero del equipo como revisor.
4. **Queda prohibido fusionar (merge) el propio PR** sin que un compañero haya aprobado los cambios.
5. Tras la fusión, elimina la rama tanto en GitHub como en tu entorno local.

---

## 🛠️ Scripts de utilidad

Todos los scripts se encuentran en `src/static/utils/` y deben ejecutarse desde la raíz del proyecto.

| Script | Uso |
|---|---|
| `validadorJson.py` | Valida `entidades.json` contra `entidades.schema.json` |
| `machineValidator.py` | Calcula y corrige el campo `machine_readable` en todos los portales. Admite `--dry-run` |
| `inspeccionarEntidadJson.py` | Herramienta interactiva para inspeccionar una entidad por su índice numérico |
| `rdf.py` | Genera la exportación RDF del catálogo |
| `repartirEntidades.py` | Reparte entidades pendientes entre los miembros del equipo |

Ejemplo de inspección de una entidad por índice:

```bash
python3 src/static/utils/inspeccionarEntidadJson.py
# Introduce un índice entre 0 y N-1 (o 'q' para salir)
```

---

## 📋 Checklist antes de abrir un PR

- [ ] `entidades.json` cumple el schema (`entidades.schema.json`) — verificado con `validadorJson.py`
- [ ] Ejecutado `machineValidator.py` y aplicados los cambios
- [ ] Ningún campo obligatorio (`id`, `name`, `entity_kind`, `scope`, `islands`, `description`, `verification`) está vacío o ausente
- [ ] Las fechas usan formato `YYYY-MM` (ej. `"2026-06"`)
- [ ] No se han subido credenciales, claves ni archivos temporales
- [ ] El PR está vinculado al issue con `Closes #ID`

---

## 📂 Cómo añadir una entidad al catálogo

1. Localiza o crea la entidad en `src/static/data/entidades.json`
2. Sigue el schema definido en `src/static/data/entidades.schema.json`
3. Rellena al mínimo los campos obligatorios: `id`, `name`, `entity_kind`, `scope`, `islands`, `description` y `verification`
4. Indica siempre la fuente en `verification.source_urls` y la fecha en `verification.last_checked`
5. Si el dato no está disponible, usa `null` explícitamente — nunca rellenes con valores supuestos
6. Ejecuta `validadorJson.py` y `machineValidator.py` antes de hacer commit

---

## 🧹 Limpieza tras el Merge

Una vez fusionado el PR, ejecuta en tu terminal:

```bash
git checkout main
git pull origin main
git branch -d data/añadir-cabildo-lanzarote
```

---

## ⚠️ Resolución de Conflictos

Si dos personas modifican las mismas líneas de un archivo, Git bloqueará el merge y avisará del conflicto. La resolución **no es automática**: los desarrolladores implicados deben revisar juntos qué versión es la correcta, editar el archivo manualmente, guardar y hacer el commit de resolución.

> `entidades.json` es especialmente propenso a conflictos por ser un único archivo grande. La mejor prevención es coordinarse a través del Project Board para no trabajar en las mismas entidades simultáneamente.
