# apis_me - Contratos Operativos

Documentacion base de los modulos API usados por frontend.

## Modulos clave en este flujo

- `forms`
- `form-engine`
- `evidences`
- `tareas`

## Flujo integrado (formularios + tareas)

1. Frontend obtiene formularios:
   - `GET /apis_me/forms/list/`
2. Frontend obtiene schema por `CLV`:
   - `GET /apis_me/form-engine/index.php?idformulario=<CLV>`
3. Evidencias visuales (`photo`, `gallery`, `signature`) se suben primero:
   - `POST /apis_me/evidences/save-photos`
4. Respuestas completas del formulario se envian:
   - `POST /apis_me/evidences/save-text`
5. Si el formulario viene del flujo de tarea y existe `ID_RC`, se cierra tarea:
   - `GET /apis_me/tareas/close/<ID_TAREA>/<CLV_CAPTURA>/<ESTATUS>/<ID_RC>/`

## Reglas de session_context

- Los modulos que lo declaran (`forms`, `evidences`, `tareas`) toman `ID_CLIENTE` y `ID_USUARIO` desde sesion.
- `ID_USUARIO` no debe duplicarse como parametro de ruta cuando ya exista en `session_context`.

## Contrato de sesion expirada (estandar)

- Para endpoints protegidos por sesion, cuando la sesion no exista o sea invalida:
  - HTTP `401` (o `403` cuando aplique por politica de autorizacion).
  - JSON:
    - `success: false`
    - `code: "SESSION_EXPIRED"`
    - `message: "Session expired"` (o equivalente estable)

Implementado en esta iteracion:
- `apis_me/form-engine/index.php` (guard de sesion obligatorio).

Pendiente (deuda tecnica documentada):
- `apis_me/vistaPreviaQST/index.php`
- `apis_me/pdi/index.php`
- `apis_me/analiticsALG/index.php`

## Regla de evidencias multimedia

- `photo`, `gallery`, `signature` siguen siendo preguntas del formulario.
- `save-text` debe incluir todas las respuestas.
- Para esos tipos multimedia, `save-text` solo debe incluir referencia S3 persistida (no base64).
