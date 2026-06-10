## Descripción
Explica brevemente qué cambios introduces y por qué.  
Si este PR resuelve una tarea del proyecto, referencia el issue usando palabras clave para automatizar el Kanban:

- `Closes #ID`
- `Fixes #ID`
- `Resolves #ID`

Ejemplo: `Closes #12`  
Esto moverá automáticamente el issue en el proyecto y lo cerrará al fusionar el PR.

## Proyecto y Automatización
Si este PR está asociado a un proyecto de GitHub, asegúrate de que el issue correspondiente está añadido al proyecto.  
GitHub moverá automáticamente el issue en el tablero si:

- El PR está vinculado al issue  
- El issue pertenece al proyecto  
- El proyecto tiene reglas automáticas activadas  

## Tipo de Cambio
- [ ]  Nueva funcionalidad (feature)
- [ ]  Corrección de errores (bugfix)
- [ ]  Refactorización o limpieza de código
- [ ]  Documentación

## Lista de Verificación (Checklist)
- [ ] El código funciona correctamente en mi entorno local.
- [ ] He probado los cambios (ej. ejecución de `generar_web.py` sin errores).
- [ ] El archivo `entidades.json` sigue el esquema oficial si ha sido modificado.
- [ ] No he subido credenciales, claves ni archivos temporales.
- [ ] He vinculado este PR al issue correspondiente usando `Closes #ID`.

## Capturas de Pantalla (Opcional)
Si el cambio afecta a la interfaz visual de la web estática, adjunta aquí una captura del resultado.
