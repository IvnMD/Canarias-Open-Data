# 📋 Gestión del Proyecto: Issues y GitHub Projects

Para coordinar el desarrollo sin necesidad de reuniones constantes, el equipo utiliza el sistema de gestión de tareas nativo de GitHub.

---

## 1. Las Issues (Tareas)

Una **Issue** representa cualquier unidad de trabajo pendiente: una nueva característica, un error detectado, una tarea de investigación o una mejora en la documentación.

### Ciclo de vida de una Issue

1. **Creación:** Cualquier miembro del equipo que detecte una necesidad abre una Issue. El título debe ser directo (ej. *«Actualizar coordenadas del Ayuntamiento de Arona»*) y el cuerpo debe detallar el objetivo.
2. **Asignación (Assignees):** Una tarea **debe tener un único responsable asignado**. Si no tiene nadie asignado, está libre para que cualquiera la reclame. Nunca se trabaja en algo que ya tiene un compañero asignado.
3. **Etiquetado (Labels):** Se utilizan etiquetas para categorizar visualmente la tarea:
   - `enhancement` → nueva funcionalidad o mejora
   - `bug` → error detectado que hay que corregir
   - `documentation` → tarea de redacción o actualización de docs
4. **Cierre Automático:** Al abrir un Pull Request relacionado, incluye la palabra clave `Closes #número_de_issue` en la descripción. Cuando el PR se fusione en `main`, la Issue se cerrará automáticamente.

---

## 2. El Project Board (Tablero Kanban)

El **Project Board** ofrece una vista global del estado del desarrollo. Se configura con formato *Board* y cuatro columnas que representan el flujo de trabajo.

---

### 📥 1. Todo (Por hacer)

- Contiene todas las Issues aprobadas por el equipo que aún nadie ha empezado.
- Las tareas se ordenan de arriba a abajo por prioridad.

---

### ⚙️ 2. In Progress (En curso)

- Cuando un desarrollador se asigna una Issue y crea su rama en Git, mueve la tarjeta a esta columna.
- Permite al resto saber en tiempo real en qué trabaja cada miembro.
- **Buena práctica:** no tener más de una o dos tareas simultáneas aquí.

---

### 👀 3. In Review (En revisión)

- Una vez terminado el código y abierto el Pull Request, la tarjeta se mueve a esta columna.
- Indica a los compañeros que hay código esperando revisión antes de poder continuar.

---

### ✅ 4. Done (Terminado)

- Cuando el PR se fusiona con `main`, las tarjetas se desplazan automáticamente aquí.
- Sirve como histórico del trabajo completado con éxito.

---

## 3. Resumen Visual del Flujo

```
Issue creada → [Todo] → (asignación + rama) → [In Progress] → (PR abierto) → [In Review] → (merge) → [Done]
```
