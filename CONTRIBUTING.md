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

Ejemplo:

```bash
git checkout -b feature/normalizar-formatos
```

### 3. Confirmar cambios con sentido

Realiza commits atómicos (cambios pequeños y lógicos). Los mensajes deben ser claros y explicar qué hace el cambio:

```bash
git add entidades.json
git commit -m "Normalizar las etiquetas de formatos a mayúsculas"
```

### 4. Publicar la rama y solicitar revisión

Sube la rama a GitHub cuando la tarea esté terminada y probada:

```bash
git push origin feature/normalizar-formatos
```

### 5. Revisión por Pares (Pull Request)

1. Abre el Pull Request en la interfaz web de GitHub.
2. Asigna al menos a un compañero del equipo como revisor.
3. **Queda prohibido fusionar (merge) el propio PR** sin que un compañero haya aprobado los cambios.
4. Tras la fusión, elimina la rama tanto en GitHub como en tu entorno local.

---

## 🧹 Limpieza tras el Merge

Una vez fusionado el PR, ejecuta en tu terminal:

```bash
git checkout main
git pull origin main
git branch -d feature/normalizar-formatos
```

---

## ⚠️ Resolución de Conflictos

Si dos personas modifican las mismas líneas de un archivo, Git bloqueará el merge y avisará del conflicto. La resolución **no es automática**: los desarrolladores implicados deben revisar juntos qué versión es la correcta, editar el archivo manualmente, guardar y hacer el commit de resolución.

La mejor prevención es coordinarse a través del Project Board para que nunca dos personas trabajen en los mismos archivos a la vez.
