# Pages Docs Index - Formularios y Tareas

Indice rapido para la documentacion funcional de formularios, envios y tareas.

## Formularios

- Documento: `src/pages/formularios/README.md`
- Incluye:
  - Resolucion de `CLV`
  - Flujo `save-photos` y `save-text`
  - Regla de referencias S3 para `photo`, `gallery`, `signature`
  - Cierre de tareas cuando el formulario viene de `source=task`

## Tareas

- Documento: `src/pages/tareas/README.md`
- Incluye:
  - Flujo completo de tareas (listado -> detalle -> formulario -> cierre)
  - Endpoint de cierre y orden de parametros
  - Catalogos locales involucrados (`tareas`, `task_active`, `task_completed`, `task_status_state`)
  - Sincronizacion posterior a cierre y redireccion a `#/tareas`
