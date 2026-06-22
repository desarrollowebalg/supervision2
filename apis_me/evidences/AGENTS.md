# AGENTS.md - evidences

## Proposito
Documentar el contrato tecnico del modulo `apis_me/evidences` para envio de respuestas de formulario y referencias de fotos/firma.

## Endpoints del modulo
- `POST /apis_me/evidences/save-text`
- `POST /apis_me/evidences/save-photos`

## Regla funcional principal
- `photo`, `gallery` y `signature` son preguntas del formulario.
- Cada captura se envia primero por `save-photos` para obtener `s3Name`.
- El valor de respuesta final de esas preguntas debe ser el `s3Name`.
- En `save-text` se deben enviar todas las respuestas del formulario, incluyendo esos campos visuales con su referencia S3.
- `save-text` no debe recibir base64 para `photo`, `gallery`, `signature`.

## Contrato minimo esperado para save-photos
- Entrada:
  - `formRef`
  - `savedAt`
  - `gps`
  - `photos` (lista de capturas; happy path actual usa 1 captura por request)
- Salida:
  - `s3Name` (nombre/referencia de objeto en S3)
  - `fieldName` (opcional para trazabilidad por pregunta)
  - `statusCode`/estado

## Compatibilidad y evolucion
- Mantener `save-text` y `save-photos` separados por responsabilidad.
- Cualquier cambio de shape de respuesta en `save-photos` debe mantener o versionar `s3Name` para no romper frontend.
- Si se agrega flujo offline (`pending_photos`), preservar la regla: respuesta final en `save-text` = referencia S3.

## Integracion con cierre de tareas
- Cuando `save-text` responde un `ID_RC` valido y el formulario corresponde a flujo de tarea, frontend debe llamar:
  - `GET /apis_me/tareas/close/<ID_TAREA>/<CLV_CAPTURA>/<ESTATUS>/<ID_RC>/`
- El `ID_RC` devuelto por evidencias es el valor que debe enviarse como `ID_RC` en `close`.
- `ID_USUARIO` no forma parte de la ruta `close`; se resuelve en backend desde `session_context`.
