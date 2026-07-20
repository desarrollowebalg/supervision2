# Contexto Activo

## Fecha de ultima actualizacion

2026-07-20

## Responsable sugerido

api-action-agent

## Objetivo actual

Dejar operativo el flujo `supervision/leer` para que el frontend pueda obtener desde el endpoint local el identificador de incidencia creado por la API externa y usar `data.ID` en el siguiente paso funcional.

## Estado actual

El ultimo avance confirmado del proyecto ya no es documental sino tecnico sobre el modulo `apis_me/supervision`:

- Se creo el modulo `apis_me/supervision/` con estructura estandar:
  - `.htaccess`
  - `index.php`
  - `actions.php`
  - `apiSupervision.class.php`
- Existe una accion minima `ping` para validar disponibilidad del modulo.
- La accion declarativa `leer` ya esta implementada en `apis_me/supervision/actions.php`.
- La ruta operativa vigente es `/apis_me/supervision/leer/<ide>/<item>/`.
- El endpoint local devuelve directamente la llave `body` parseada como JSON para consumo simple desde frontend.

La ultima verificacion remota confirmada el lunes 20 de julio de 2026 devolvio correctamente un identificador de incidencia desde el proveedor externo.

## Alcance confirmado

- Mantener `ID_USUARIO` como fuente de verdad desde `session_context`.
- Enviar `item` como `PDI` hacia la API externa.
- Enviar `ide` como `EVD` hacia la API externa.
- Exponer al frontend solo el JSON util de `body`, sin envolver `statusCode` en la respuesta local final.
- Dejar el modulo listo para que el siguiente trabajo conecte el consumidor frontend.

## Decisiones vigentes

- El archivo fuente de verdad para continuidad sigue siendo `notas/contexto/CONTEXTO_ACTIVO.md`.
- El contexto activo debe reflejar el ultimo frente real del proyecto, aunque el detalle historico siga viviendo en `notas/contexto/historial/`.
- Para `supervision/leer`, el contrato vigente es que el frontend lea `data.ID`.
- `apiSupervision.class.php` ya soporta `execution.type = "api"` con `curl`, serializacion JSON y parseo configurable de respuesta externa.
- La nota de historial base para este contexto es `notas/contexto/historial/2026-07-20-supervision-leer-api-externa.md`.

## Archivos clave

- `apis_me/supervision/index.php`
- `apis_me/supervision/actions.php`
- `apis_me/supervision/apiSupervision.class.php`
- `notas/contexto/historial/2026-07-20-supervision-leer-api-externa.md`
- `notas/contexto/CONTEXTO_ACTIVO.md`
- `AGENTS.md`

## Estado operativo del proyecto que conviene recordar

- Frontend principal: Vanilla JS + Vite + UIkit.
- Entrypoints activos: `src/pages/login/main.js` y `src/pages/inicio/main.js`.
- Flujo base: `/login/default` -> `/inicio/default`.
- La SPA usa hash routing y valida rutas privadas contra PHP con `getUser()`.
- Los servicios reutilizables viven en `src/core/services/`.
- El almacenamiento oficial de catalogos en frontend es IndexedDB con Dexie.
- El sidebar de `supervision` ya esta desacoplado y configurado por cliente mediante `doctosSupervision/<clienteId>/supervision-sidebar.json`.

## Pendientes inmediatos

1. Conectar el frontend consumidor de `supervision/leer`.
2. Usar `data.ID` como identificador de incidencia creada en el flujo que dispare la lectura.
3. Ejecutar validacion local de PHP cuando el entorno disponga de `php`.
4. Actualizar este contexto al cierre de la siguiente tarea tecnica relacionada.

## Riesgos o bloqueos

- En esta sesion no hay `php` disponible para ejecutar `php -l`.
- Si el frontend asume la envoltura completa del proveedor externo, fallara porque el endpoint local ahora expone directamente `body`.
- Cualquier cambio posterior en el contrato de la API externa requerira revisar el parseo en `apiSupervision.class.php`.

## Validacion pendiente

- Ejecutar `php -l apis_me/supervision/actions.php`.
- Ejecutar `php -l apis_me/supervision/apiSupervision.class.php`.
- Validar el consumidor frontend una vez que se conecte al endpoint local.

## Siguiente paso recomendado

Implementar o revisar el consumidor frontend de `/apis_me/supervision/leer/<ide>/<item>/` para que tome `data.ID` y continúe el flujo de incidencia.

## Actualizacion de sesion 2026-07-17

- Se ajusto `apis_me/reports/actions.php` para que la accion `evidence` pase `ID_CLIENTE` desde `session_context` hacia el query de cabecera.
- Se extendio `apis_me/reports/apiReports.class.php` para que `composed_query` soporte `header_bindings` y `detail_bindings`, manteniendo compatibilidad con el esquema previo basado en `bindings`.
- Motivo: el query de cabecera de evidencia ahora filtra `ADM_GEOREFERENCIAS.ID_CLIENTE`, pero el detalle sigue requiriendo solo `ID_RES_CUESTIONARIO`.
- Validacion local prevista: `php -l apis_me/reports/actions.php` y `php -l apis_me/reports/apiReports.class.php`.

## Actualizacion de sesion 2026-07-17 - seguimiento de evidencia

- Se preparo `src/pages/supervision/DetalleIncidencia.js` para consumir `/apis_me/reports/evidence/<ide>/` y mostrar el layout de seguimiento en dos columnas con evidencia al 60 por ciento.
- La columna de evidencia ahora pinta fecha y hora, tarjeta de usuario con `user-avatar-enhanced`, ubicacion/equipo, descripcion multilinea basada en `OBS` y el valor actual de `FT1`.
- Se agrego `src/core/services/apis-me/reports.service.js` para centralizar el consumo de `reports/evidence`.
- Se ajusto `apis_me/reports/actions.php` para que `detail` siga usando la tabla dinamica por cliente y exponga `ITEM_NUMBER` y `DESCRIPCION`, necesarios para resolver `OBS` y `FT1` desde frontend.

## Actualizacion de sesion 2026-07-17 - tema y UIkit en seguimiento

- Se ajusto `src/pages/supervision/DetalleIncidencia.js` para que el panel de seguimiento soporte `light/dark` usando tokens globales `--app-*`.
- La base visual del panel quedo alineada con UIkit usando `uk-card-default`, `uk-grid`, `uk-button`, `uk-text-meta`, `uk-card-title` y encabezados `uk-h*`, evitando depender de `uk-card-secondary`.
- El CSS custom restante queda solo como complemento para layout 60/40, superficies por tema y espaciado especifico del bloque de evidencia.
- Validacion ejecutada: `npm run build`.

## Actualizacion de sesion 2026-07-17 - galeria FT1

- Se actualizo `src/pages/supervision/DetalleIncidencia.js` para resolver `FT1` como imagen real usando la base `https://imagenes.movilizandome.net/`.
- La seccion `Fotografias` ahora renderiza una imagen clicable con UIkit usando `uk-lightbox`, `uk-inline` y `data-caption`, manteniendo soporte `light/dark`.
- Se agrego manejo de estado vacio cuando la evidencia no tenga fotografia disponible.
- Validacion ejecutada: `npm run build`.

## Actualizacion de sesion 2026-07-18 - accion reports/incidence

- Se agrego la accion declarativa `incidence` en `apis_me/reports/actions.php`.
- La ruta operativa queda `/apis_me/reports/incidence/<inc>/`.
- `inc` se valida como entero por ruta y se hidrata hacia la propiedad `idIncidencia`.
- `ID_CLIENTE` e `ID_USUARIO` se mantienen como fuente de verdad desde `session_context`.
- El query a `ADM_INCIDENCIAS` quedo parametrizado con `ID` e `ID_CLIENTE`, evitando SQL inline con nombres de variables en el `WHERE`.

## Actualizacion de sesion 2026-07-19 - historial off-canvas en detalle de incidencia

- Se agrego el boton `Ver historial` a la derecha del regreso en `src/pages/supervision/DetalleIncidencia.js`.
- El boton abre un `uk-offcanvas` del lado derecho usando `flip: true; overlay: true`, alineado con el patron oficial de UIkit.
- El off-canvas quedo preparado con datos demo mientras se implementa la API real de historial.
- La data demo se separa por `ESTATUS`: `ATENDIDO` se pinta como comentarios y el resto como historial.
- Tanto historial como comentarios se ordenan por `FECHA` descendente para mostrar primero el registro mas reciente.
- Para enriquecer nombre y foto del usuario se consulta el catalogo local `usuarios` desde IndexedDB usando el `contextKey` de sesion; si no existe entrada, se usa fallback al usuario autenticado o al `USUARIO` del registro.
- `src/components/historial/historial-component.js` se ajusto para tema actual `light/dark`, fallback visual de avatar, escape de contenido y registro seguro del custom element.

## Actualizacion de sesion 2026-07-19 - timeline unificado en off-canvas

- Se simplifico el `uk-offcanvas` de historial en `src/pages/supervision/DetalleIncidencia.js` para mostrar todos los registros en una sola linea de tiempo.
- Ya no se hace separacion visual por `ESTATUS`; todo el dataset demo se pinta con `historial-component` en orden descendente por `FECHA`.
- La caja de comentarios del costado derecho se mantiene sin cambios y queda pendiente de conectarse a su futura API especifica.

## Actualizacion de sesion 2026-07-19 - reports/history conectado a API real

- Se agrego la accion declarativa `history` en `apis_me/reports/actions.php`.
- La ruta operativa queda `/apis_me/reports/history/<inc>/`.
- `inc` se valida por ruta y se hidrata hacia `idIncidencia`.
- `ID_USUARIO` se mantiene como fuente de verdad desde `session_context` y se envia a la API externa como `USU`.
- El parametro `inc` se envia a la API externa como `IDI`.
- `apis_me/reports/apiReports.class.php` se extendio para soportar `execution.type = "api"` mediante `curl`, payload JSON y extraccion selectiva de `response_data_key`.
- Para esta accion, la respuesta publica del modulo expone solo el contenido de la llave `body` del proveedor externo.
- Se agrego `getHistoryReport()` en `src/core/services/apis-me/reports.service.js`.
- `src/pages/supervision/DetalleIncidencia.js` dejo de usar `HISTORY_DEMO` y ahora consume `reports/history/<inc>/` para poblar el `uk-offcanvas`.
- Verificacion remota ejecutada con `USU = 954` e `IDI = 30430`: la API externa respondio `statusCode: 200` con un arreglo en `body` que coincide con los registros demo usados previamente.
- Validacion local pendiente en este entorno: no fue posible ejecutar `php -l` ni `npm run build` porque `php` y `npm` no estan disponibles en la sesion actual.

## Actualizacion de sesion 2026-07-20 - supervision/leer hacia API externa

- Se agrego la accion declarativa `leer` en `apis_me/supervision/actions.php`.
- La ruta operativa queda `/apis_me/supervision/leer/<ide>/<item>/`.
- `ide` se valida por ruta y se hidrata hacia `idEvidencia`.
- `item` se valida por ruta y se hidrata hacia `itemNumber`.
- `ID_USUARIO` se mantiene como fuente de verdad desde `session_context` y se envia a la API externa como `USU`.
- `itemNumber` se envia a la API externa como `PDI`.
- `idEvidencia` se envia a la API externa como `EVD`.
- `apis_me/supervision/apiSupervision.class.php` se extendio para soportar `execution.type = "api"` mediante `curl`, payload JSON y parseo configurable de llaves JSON en la respuesta externa.
- Para `leer`, el modulo devuelve directamente la llave `body` ya parseada como JSON, de modo que `ID` quede disponible de forma inmediata para el frontend sin envolver `statusCode`.
- Verificacion remota ejecutada el lunes 20 de julio de 2026 con `USU = 36925`, `PDI = M2512225537-434` y `EVD = 67433043`: la API externa respondio `{"statusCode":200,"body":{"ID":2894}}`.
- Validacion local pendiente en este entorno: no fue posible ejecutar `php -l` porque `php` no esta disponible en la sesion actual.

## Historial relacionado

- `notas/contexto/historial/2026-07-17-seguimiento-detalle-incidencia.md`
- `notas/supervision/DEEP_LINK_RETORNO_LOGIN_2026-07-15.md`
- `src/pages/supervision/SUPERVISION_SIDEBAR_CONFIG.md`
- `notas/RESUMEN_CAMBIOS.md`
