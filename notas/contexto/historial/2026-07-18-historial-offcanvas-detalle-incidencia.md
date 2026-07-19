# Historial off-canvas en detalle de incidencia

## Fecha

2026-07-19

## Resumen

Se avanzo la integracion visual del historial de incidencia dentro de la vista `src/pages/supervision/DetalleIncidencia.js`, usando un `uk-offcanvas` lateral derecho disparado por el boton `Ver historial`.

## Cambios realizados

- Se agrego el boton `Ver historial` junto al boton de regreso en la cabecera del detalle.
- Se integro un `uk-offcanvas` con `flip: true; overlay: true` para mostrar el historial desde el lado derecho.
- Se preparo una fuente demo local en la pagina mientras la API real de historial aun no existe.
- El off-canvas se simplifico para mostrar todos los registros en una sola linea de tiempo, sin separar por `ESTATUS`.
- El orden de visualizacion queda descendente por `FECHA`, mostrando primero el evento mas reciente.
- Para enriquecer nombre completo y foto se consulta el catalogo `usuarios` desde IndexedDB usando el `contextKey` de sesion, con fallback al usuario autenticado o al username del registro.
- Se reutilizo `src/components/historial/historial-component.js` como renderer de cada evento timeline.

## Ajustes al componente de historial

- Se adapto `src/components/historial/historial-component.js` al esquema de tema actual `light/dark`.
- Se sustituyeron dependencias visuales heredadas por tokens `--app-*`.
- Se dejo fallback visual de avatar cuando no exista fotografia.
- Se protegio el registro del custom element para evitar conflictos por redefinicion.
- Se mantuvo el colapsado/expandido del comentario largo.

## Estado funcional al cierre

- El timeline del historial ya puede abrirse visualmente desde `DetalleIncidencia`.
- El timeline aun trabaja con datos demo.
- La caja de comentarios del costado derecho se mantiene activa solo como UI local y aun no esta conectada a una API.

## Siguiente paso sugerido

Crear la API real del historial de incidencia y reemplazar la fuente demo local por consumo real en `DetalleIncidencia.js`, conservando el timeline unificado dentro del off-canvas.
