# Formularios - Temas de Color Externos

El listado de formularios (`src/pages/formularios/formularios.js`) carga una configuracion externa de temas desde:

- `/config/form-themes.json`

Objetivo:
- Permitir ajustar colores sin recompilar frontend.
- Relacionar `form.TEMA` con `ID_TEMA`.

Regla de aplicacion:
- Fondo del item: `BARRA`
- Color de texto del item: `LETRA`

Contrato minimo del JSON:

```json
{
  "temas": [
    {
      "ID_TEMA": 1,
      "BARRA": "#0B3E6F",
      "LETRA": "#FFFFFF",
      "GRADIENTE": "linear-gradient(135deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.06) 35%, rgba(0,0,0,.14) 100%)"
    }
  ]
}
```

Notas:
- Si el archivo no existe, falla parseo, o un tema es invalido, la vista usa estilos por defecto.
- El loader usa `cache: 'no-store'` para reflejar cambios del archivo externo tras recarga.

## Flujo de Envios de Formularios

La vista de detalle `#/formularios/:indicator` funciona sobre `src/pages/formularios/form-evidencia.js` y el renderer modular en `schema-renderer/`.

### Resolucion de formulario

1. Se toma `clv` del query param en hash (`#/formularios/:indicator?clv=...`).
2. Si no existe `clv`, se resuelve desde catalogo local (`ITEM_NUMBER -> CLV`).
3. Se consulta schema con:
   - `GET /apis_me/form-engine/index.php?idformulario=<CLV>`

### Envio de evidencias visuales

Los tipos `photo`, `gallery` y `signature` se suben al momento de captura:

- Endpoint: `POST /apis_me/evidences/save-photos`
- Resultado esperado: referencia S3 (`s3Name` o equivalente)
- Valor final de respuesta de pregunta: referencia S3 persistida

Regla obligatoria:
- No usar base64 en `save-text` para `photo`, `gallery` y `signature`.
- En `save-text` solo viaja la referencia S3 ya persistida.

### Envio de respuestas del formulario

Una vez completado el formulario:

- Endpoint: `POST /apis_me/evidences/save-text`
- Debe incluir todas las respuestas del formulario, incluidas `photo`, `gallery` y `signature` como referencia S3.

### Flujo cuando el formulario viene de tareas

Si el formulario se abrio con `source=task` en query:

1. Se envia evidencia por `save-text`.
2. Si el backend responde `idrc`, se cierra tarea con:
   - `GET /apis_me/tareas/close/<ID_TAREA>/<CLV_CAPTURA>/<ESTATUS>/<ID_RC>/`
3. Se actualiza el catalogo local de tareas.
4. Se registra tarea terminada en catalogo local `task_completed`.
5. Se sincroniza listado de tareas del usuario.
6. Redireccion final: `#/tareas`.

## Sesion y proteccion de rutas (actual)

- Las rutas privadas en app (`#/inicio`, `#/formularios`, `#/formularios/:indicator`, `#/tareas`, etc.) se validan por guard global contra sesion PHP (`getUser`).
- Si la sesion expira durante navegacion o consumo de API:
  - se muestra aviso al usuario,
  - se limpia estado sensible local (usuario + formulario activo),
  - se redirige a `/login/default`.
- El endpoint de schema (`/apis_me/form-engine/index.php`) requiere sesion valida y responde contrato uniforme de sesion expirada cuando no existe.

## Cambios de UX en captura de formulario

- Salida de formulario activo:
  - solo pide confirmacion al salir si existen respuestas capturadas,
  - si no hay respuestas, permite salir sin confirmacion.
- Secciones de registros (modal de `Nueva captura`):
  - previenen duplicados por `clave + descripcion`,
  - si hay duplicado, no agrega item y muestra error con clave detectada.
- Boton eliminar/editar de item:
  - el click funciona en toda el area del boton, incluyendo el icono.

## Cambios de fuentes y estilos

- Se privilegia tipografia y utilidades de UIkit (`uk-text-*`) sobre tamanos inline.
- Se removieron overrides tipograficos globales no necesarios para respetar base UIkit.
- Se mantienen estilos custom solo cuando son necesarios para comportamiento visual puntual.
