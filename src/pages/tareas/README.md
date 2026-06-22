# Tareas - Flujo de Funcionamiento y Envio

Este documento describe como funciona el modulo de tareas en frontend y como se envia la informacion hacia backend.

## Vistas y servicios principales

- Vista listado: `src/pages/tareas/Tareas.js`
- Vista detalle: `src/pages/tareas/TareaDetalle.js`
- Cierre desde formulario: `src/pages/formularios/form-evidencia.js`
- Servicio API de tareas: `src/core/services/apis-me/tareas.service.js`
- Estado local de tarea activa: `src/core/services/apis-me/task-active.service.js`
- Catalogo local de tareas terminadas: `src/core/services/apis-me/task-completed.service.js`

## Catalogos locales involucrados

- `tareas`: listado base de tareas del usuario.
- `task_active`: tarea actualmente activa/en progreso.
- `task_completed`: tareas cerradas localmente (historico local de terminadas).
- `task_status_state`: transiciones locales de estado para UX y continuidad.

Todos estos catalogos usan IndexedDB mediante `catalog-indexeddb.service.js`.

## Endpoints usados por tareas

### 1) Listado de tareas

- Endpoint: `GET /apis_me/tareas/listar/<maxdays>/`
- Uso: obtener/sincronizar tareas asignadas al usuario en sesion.

### 2) Cambio de estado intermedio

- Endpoint: `GET /apis_me/tareas/updateStatus/<CLV_CAPTURA>/<ESTATUS>/`
- Uso: transiciones operativas (`salida`, `arribo`, `inicio de operaciones`).

### 3) Cierre de tarea con evidencia

- Endpoint: `GET /apis_me/tareas/close/<ID_TAREA>/<CLV_CAPTURA>/<ESTATUS>/<ID_RC>/`
- Orden de parametros (obligatorio):
1. `ID_TAREA`
2. `CLV_CAPTURA`
3. `ESTATUS`
4. `ID_RC`

Nota:
- `ID_USUARIO` no viaja en ruta. Se toma del `session_context` del modulo `tareas`.

## Flujo operativo completo

1. Usuario entra a `#/tareas`.
2. Se carga/sincroniza catalogo `tareas`.
3. En `#/tareas/:taskId`, usuario ejecuta transiciones con `updateStatus`.
4. Usuario abre formulario asociado (`#/formularios/:indicator?...&source=task`).
5. Formulario envia respuestas:
   - Visuales (`photo`, `gallery`, `signature`) primero a `save-photos`.
   - Respuesta final completa a `save-text` con referencias S3.
6. Si `save-text` responde `idrc`, se invoca `close` con:
   - `/apis_me/tareas/close/<ID_TAREA>/<CLV_CAPTURA>/<ESTATUS>/<ID_RC>/`
7. Tras cierre exitoso:
   - Se actualiza estado local en catalogo `tareas`.
   - Se registra la tarea en `task_completed`.
   - Se limpia estado activo en `task_active` al marcar estatus 3.
   - Se ejecuta sincronizacion forzada del listado de tareas.
8. Se redirige a `#/tareas` para reiniciar ciclo operativo.

## Reglas de envio importantes

- En `save-text` deben viajar todas las respuestas del formulario.
- `photo`, `gallery`, `signature` deben viajar como referencia S3 persistida.
- No enviar base64 de esos tipos en `save-text`.
- El `close` solo se considera correcto cuando existe `ID_RC` (`idrc`) del envio de evidencia.
