# AGENTS.md - schema-renderer (formularios)

## Proposito
Definir el contrato tecnico del renderer de schema de formularios para mantener compatibilidad, modularidad y facilidad de extension.

## Alcance actual (v1)
Este renderer consume el schema de:
- `GET /apis_me/form-engine/index.php?idformulario=<CLV>`

Renderiza campos desde:
- `schema.form.fields`

Ignora en UI y registra en consola:
- `schema.unsupported`

## Arquitectura actual
1. Orquestacion desde pagina detalle:
- `src/pages/formularios/form-evidencia.js`
- Resuelve `CLV` desde query `clv` o fallback por cache.

2. Servicio de consulta schema:
- `src/core/services/apis-me/form-engine.service.js`
- Funcion: `getFormSchemaByClv(clv)`

3. Renderer central:
- `src/pages/formularios/schema-renderer/schema-form.renderer.js`
- Funcion: `renderSchemaForm(schema, mountNode, options?)`
- Registro: `fieldComponentRegistry`

4. Componentes por tipo:
- `components/*.component.js`
- Contrato por componente: `render(field, contextOptions) => string`

5. Utilidades compartidas:
- `field-render-context.js`
- Helpers: `escapeHtml`, `boolAttr`, `toFieldProps`, `renderFieldWrapper`, `normalizeOptions`

## Tipos soportados hoy
- `text`
- `date`
- `time`
- `number`
- `select`
- `multi-select`
- `radio`
- `separator`
- `textarea`
- `autocomplete`
- `geo-select`
- `signature`
- `gallery`
- `photo`

## Reglas de render
1. UI base
- Mantener estructura UIkit (`uk-form-stacked`, `uk-input`, `uk-select`, `uk-textarea`, etc).

2. Props funcionales
- `required`: aplica atributo `required`.
- `disabled`: respeta bloqueo por campo.
- `default`: usa valor inicial cuando exista.
- `options`: aplica en `select`, `multi-select`, `radio`, `autocomplete`.
- `maxLength`: aplica en `textarea` cuando sea numerico valido.

3. Modo de lectura/captura
- `options.readOnlyMode === true`: bloquea captura global.
- `options.readOnlyMode === false`: habilita captura, respetando `props.disabled`.

4. Boton de accion
- `options.showSubmitButton !== false`: muestra boton `Enviar` al final.

## Guia para agregar nuevos tipos
Cuando backend agregue un nuevo tipo en `form-engine`, seguir este flujo:

1. Confirmar contrato backend
- Tipo final esperado en `field.type`.
- Shape de `field.props`.
- Ejemplo real del payload del endpoint.

2. Crear componente nuevo
- Archivo: `components/<tipo>-field.component.js`
- Exportar: `render<Tipo>Field(field, contextOptions)`
- Usar helpers de `field-render-context.js`.

3. Registrar en factory
- Editar `schema-form.renderer.js`.
- Agregar entrada en `fieldComponentRegistry`.

4. Definir fallback seguro
- Si props opcionales faltan, usar defaults no rompientes.
- Nunca lanzar error por valores nulos del schema.

5. Verificacion minima
- Abrir un formulario real que incluya el tipo.
- Confirmar render, required/disabled/default y estabilidad sin errores.

## Reglas de compatibilidad
- No mezclar logica de negocio en los componentes de campo.
- No mover consultas HTTP al renderer (solo render).
- Mantener componentes pequenos y enfocados por tipo.
- No romper los tipos ya soportados al agregar uno nuevo.

## Captura, persistencia y salida (actual)

### Referencia de formulario activo
- `form-evidencia.js` registra el formulario activo por `indicator + CLV`.
- Se guarda referencia, `schema`, timestamps y respuestas en `localStorage` con clave por formulario.
- Si hay respuestas y el usuario abandona el formulario, se solicita confirmacion de salida.
- Si confirma salida, se limpia el registro local del formulario activo.

### Persistencia por campo
- El renderer hidrata valores guardados al montar el formulario.
- Cada `focusout` y `change` persiste estado inmediato del formulario activo.
- El submit tambien persiste antes de construir payloads.

### Separacion de payloads
- `payloadTexto` incluye campos no visuales y se envia por `save-text`.
- `photo`, `gallery` y `signature` se envian en captura inmediata por `save-photos`.
- El valor serializado final por campo visual es referencia S3 (`s3Name`) en `input hidden`.

### Ajustes de componentes visuales
- `photo` y `gallery` muestran preview local inmediata y permiten volver a capturar/seleccionar.
- `signature` conserva `Limpiar`, sube al finalizar trazo y permite reintento manual.
- Cada campo visual expone estado no bloqueante: `idle`, `uploading`, `uploaded`, `error`.
- Cambios en estos tipos disparan evento `change` para autosave global.

### Reglas de secciones de registros (`index-marker`)
- Los botones `editar` y `eliminar` deben responder al click en toda el area del boton (incluyendo iconos internos).
- Validacion anti-duplicado al agregar captura:
  - comparar `clave + descripcion` usando campos del payload.
  - si hay duplicado, no agregar item.
  - mostrar error al usuario indicando la clave duplicada detectada.

### Regla de respuestas visuales (`photo`, `gallery`, `signature`)
- Son preguntas del formulario y deben participar en `save-text`.
- Flujo por campo:
  1. Captura/seleccion/dibujo.
  2. Subida inmediata a `save-photos`.
  3. Recepcion de `s3Name`.
  4. Persistencia de `s3Name` en `input hidden`.
- En submit final (`save-text`), el valor enviado para esos campos es `s3Name`.

## Reglas de estilo y UI
- Mantener base UIkit para tipografia y textos (`uk-text-*`).
- Evitar `font-size` inline en render de preguntas cuando UIkit cubre el caso.
- CSS personalizado solo para comportamientos o presentacion no cubierta por utilidades UIkit.
