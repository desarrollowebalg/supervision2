# Contexto Activo

## Fecha de ultima actualizacion

2026-07-23

## Responsable sugerido

documentation-agent

## Objetivo actual

Dejar consolidado el flujo operativo de atencion de incidencias en `supervision`, incluyendo comentarios, cambio de estatus, bloqueo de acciones terminales, exportacion PDF del seguimiento y sincronizacion del catalogo para evitar desfases al regresar al panel.

## Estado actual

El ultimo avance confirmado del proyecto se concentra en `src/pages/supervision/DetalleIncidencia.js` y en la coherencia del regreso al catalogo de `supervision`:

- `DetalleIncidencia` ya muestra el estatus actual de la incidencia desde `reports/incidence` junto a la etiqueta `Seguimiento:`.
- El boton `Atender incidencia` ya abre un modal funcional con:
  - numero de incidencia
  - resumen relevante
  - `CommentBox` abierto listo para captura
  - selector de accion con `TIP = 3`, `4` y `2`
  - botones `Cancelar` y `Guardar y atender incidencia`
- El guardado de atencion ya consume `/apis_me/supervision/incidenceAct/<idi>/<tip>/` con `obs` en body JSON y ya refresca historial y estatus al responder correctamente.
- El boton de guardado en el modal ya se deshabilita durante el proceso y se muestran notificaciones UIkit segun el resultado.
- `CommentBox` ya puede operar sin depender del clic previo mediante atributos de apertura programatica, manteniendo intacto el flujo tradicional por clic.
- El historial lateral ya reutiliza el mismo estilo visual para comentarios y timeline, evitando mezcla de componentes visuales distintos.
- Cuando la incidencia queda en estatus terminal o no editable:
  - `Atender incidencia` deja de estar disponible
  - la captura de comentarios se bloquea en la UI
  - el usuario ya no puede abrir ni guardar nuevos comentarios sobre la incidencia cerrada o finalizada
- Se agrego un boton `PDF` que abre una nueva pestaña con un documento imprimible del seguimiento:
  - evidencia/origen
  - resumen de incidencia
  - historial completo
- Cuando se agrega comentario o se atiende la incidencia, frontend ya dispara un refresco en segundo plano del catalogo de `supervision` para reducir el desfase al volver a la vista anterior.

## Alcance confirmado

- Mantener `ID_USUARIO` como fuente de verdad desde `session_context`.
- Enviar `item` como `PDI` hacia la API externa.
- Enviar `ide` como `EVD` hacia la API externa.
- Exponer al frontend solo el JSON util de `body`, sin envolver `statusCode` en la respuesta local final.
- Mantener `incidenceAct` operativo con `USU`, `IDI`, `OBS` y `TIP`.
- Mantener `tip = 1` para comentarios en el flujo de comentarios y habilitar tambien `TIP = 3`, `4` y `2` para el flujo de atencion desde modal.
- Mantener `obs` en body JSON como contrato vigente para texto libre en `PUT`.
- Evitar depender solo del TTL del catalogo cuando la propia vista ya conoce que hubo una mutacion de la incidencia.

## Decisiones vigentes

- El archivo fuente de verdad para continuidad sigue siendo `notas/contexto/CONTEXTO_ACTIVO.md`.
- El contexto activo debe reflejar el ultimo frente real del proyecto, aunque el detalle historico siga viviendo en `notas/contexto/historial/`.
- Para `supervision/leer`, el contrato vigente es que el frontend lea `data.ID`.
- `apiSupervision.class.php` ya soporta `execution.type = "api"` con `curl`, serializacion JSON y parseo configurable de respuesta externa.
- Para `incidenceAct`, el contrato vigente ya usa `obs` en body JSON y deja `idi` y `tip` como parametros de ruta.
- Los comentarios visibles en la columna derecha y los comentarios desplegables del off-canvas salen de la misma fuente `reports/history`, filtrando `ESTATUS = ATENDIDO`.
- `reports/incidence` queda como fuente de verdad para pintar el estatus actual en el header del detalle.
- Los estatus terminales para atencion son `RECHAZADA (4)` y `CERRADA (2)`, por lo que el boton `Atender incidencia` no debe quedar operativo en esos casos.
- Los estatus que bloquean nuevos comentarios desde la UI son `APROBADA (3)`, `RECHAZADA (4)` y `CERRADA (2)`.
- El refresco del catalogo de `supervision` despues de comentar o atender debe ejecutarse en segundo plano con `forceRefresh`, usando el contexto de seleccion con el que se abrio el detalle.
- La nota de historial base mas reciente para este frente pasa a ser `notas/contexto/historial/2026-07-23-cierre-supervision-atencion-estado-cache-pdf.md`.

## Archivos clave

- `apis_me/supervision/index.php`
- `apis_me/supervision/actions.php`
- `apis_me/supervision/apiSupervision.class.php`
- `src/core/services/apis-me/incidencias.service.js`
- `src/core/services/apis-me/supervision.service.js`
- `src/core/services/apis-me/reports.service.js`
- `src/components/comentarios/CommentBox.js`
- `src/components/comentarios/comment-history-item.js`
- `src/components/supervision-detail/supervision-detail-panel.js`
- `src/pages/supervision/DetalleIncidencia.js`
- `notas/contexto/historial/2026-07-23-cierre-supervision-atencion-estado-cache-pdf.md`
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

1. Validar en flujo completo que el regreso al panel de `supervision` ya refleje el cambio sin esperar el TTL normal del catalogo.
2. Confirmar visualmente si el formato imprimible del boton `PDF` cubre la necesidad operativa o si despues se requiere generacion binaria real.
3. Revisar si hay otros puntos del frontend que permitan mutar incidencia y que tambien deban disparar sincronizacion en segundo plano.
4. Limpiar o centralizar cualquier log temporal restante si reaparece durante nuevas iteraciones del flujo.

## Actualizacion de sesion 2026-07-22 - atencion de incidencia, estatus, PDF y sincronizacion del catalogo

- Se habilito en `src/pages/supervision/DetalleIncidencia.js` el flujo completo de `Atender incidencia` mediante un modal UIkit con comentario, selector de accion y envio a `incidenceAct`.
- Se agrego soporte frontend para `TIP = 3` (`Aprobar`), `TIP = 4` (`Rechazar`) y `TIP = 2` (`Cerrar`) sin afectar el flujo existente de comentarios con `TIP = 1`.
- Se fortalecio `src/components/comentarios/CommentBox.js` para:
  - abrirse programaticamente sin clic previo
  - ocultar acciones cuando se usa embebido en otros flujos
  - exponer helpers de lectura, limpieza, foco y reset del texto
- Se corrigio el flujo del modal de atencion para que el submit realmente localice sus referencias internas y ejecute el `PUT` al presionar `Guardar y atender incidencia`.
- Se ajusto el cierre y reapertura del modal para que no quede bloqueado despues de una interaccion previa.
- Se eliminaron los logs de depuracion una vez confirmado el flujo exitoso con respuesta `200`.
- El header de `DetalleIncidencia` ahora muestra el estatus actual de la incidencia a la derecha de `Seguimiento: <idi>`.
- Se agrego el boton `PDF`, que abre una nueva pestaña con una vista imprimible del seguimiento completo sin bloquear la pestaña operativa actual.
- Se definio que `Atender incidencia` queda deshabilitado cuando la incidencia ya esta en estatus terminal `2` o `4`.
- Se definio que la captura de comentarios queda bloqueada cuando la incidencia esta en `3`, `4` o `2`, para evitar mutaciones no permitidas sobre incidencias terminadas.
- `src/components/comentarios/comment-history-item.js` y el historial del detalle quedaron alineados visualmente para que comentarios y timeline no mezclen estilos distintos.
- Desde `src/components/supervision-detail/supervision-detail-panel.js` ahora se envia a la ruta de detalle el contexto de seleccion necesario para poder refrescar el catalogo correcto al volver.
- `DetalleIncidencia` ahora ejecuta refresco en segundo plano de:
  - `getIncidenciasDetalle(..., { forceRefresh: true })`
  - `getIncidenciasByDate(..., { forceRefresh: true })`
  despues de guardar comentario o atender la incidencia.
- La razon de este refresco es evitar el desfase provocado por el cache IndexedDB con TTL cuando el usuario vuelve inmediatamente a la vista anterior.

## Actualizacion de sesion 2026-07-22 - comentarios reales y separacion visual del historial

- Se ajusto `apis_me/supervision/index.php` para aceptar `PUT`, `OPTIONS`, `Content-Type: application/json` y lectura uniforme de `php://input`.
- La accion `incidenceAct` en `apis_me/supervision/actions.php` dejo de recibir `obs` por ruta y ahora lo recibe desde body JSON con `source = body`.
- Se agrego `apisMePut()` en `src/core/services/apis-me/client.js`.
- Se agrego `updateIncidentComment()` en `src/core/services/apis-me/supervision.service.js`.
- `src/components/comentarios/CommentBox.js` ahora conserva el texto mientras guarda, muestra estado de guardado y error, y solo limpia el textarea cuando el `PUT` responde correctamente.
- `src/pages/supervision/DetalleIncidencia.js` ya escucha `comment-saved` y guarda comentarios reales contra `/apis_me/supervision/incidenceAct/<idi>/<tip>/`.
- Para el flujo actual de comentarios, frontend envia `tip = 1` al guardar desde `DetalleIncidencia`.
- Se creo el web component reutilizable `src/components/comentarios/comment-history-item.js` para mostrar comentarios con una UI mas ligera.
- La columna derecha de `DetalleIncidencia` ahora muestra:
  - `CommentBox`
  - lista de comentarios recientes filtrados por `ESTATUS = ATENDIDO`
- El off-canvas de historial mantiene visibles por defecto solo las otras acciones y agrega un enlace `Mostrar comentarios de atencion` para desplegar tambien los registros `ATENDIDO` sin sobrecargar la vista inicial.
- Tanto comentarios como historial se siguen ordenando de la fecha mas reciente a la mas antigua.
- Validacion funcional reportada por usuario el miercoles 22 de julio de 2026:
  - guardado de comentarios funcionando sin problema
- Validacion automatica pendiente en este entorno:
  - no fue posible ejecutar `npm run build` porque `npm` no esta disponible en la sesion actual
  - no fue posible ejecutar `php -l` porque `php` no esta disponible en la sesion actual

## Actualizacion de sesion 2026-07-21 - detalle con generacion de incidencia

- Se conecto el frontend de `src/pages/supervision/DetalleIncidencia.js` al endpoint local `/apis_me/supervision/leer/<ide>/<item>/` mediante el nuevo servicio `src/core/services/apis-me/supervision.service.js`.
- Cuando la ruta entra como `#/supervision/detalle/:ide/0/`, la vista ahora:
  - muestra `Generando incidencia...`
  - carga evidencia primero
  - extrae `ID_RES_CUESTIONARIO` y `ITEM_NUMBER`
  - llama `supervision/leer`
  - reemplaza la ruta con `#/supervision/detalle/:ide/:idi/` usando el `ID` devuelto por la API
- Mientras `idi = 0`, el historial no se consulta y el bloque de comentarios queda temporalmente deshabilitado con mensajes de espera o error.
- Se adopto la estrategia SPA de reemplazo de hash sin `hard refresh`, aprovechando el rerender natural del router actual.
- Validacion ejecutada: `npm run build` el martes 21 de julio de 2026.

## Actualizacion de sesion 2026-07-21 - accion supervision/incidenceAct

- Se agrego la accion declarativa `incidenceAct` en `apis_me/supervision/actions.php`.
- La ruta operativa queda `/apis_me/supervision/incidenceAct/<idi>/<obs>/<tip>/`.
- `idi` se valida por ruta y se hidrata hacia `idIncidencia`.
- `obs` se valida por ruta y se hidrata hacia `observaciones`.
- `tip` se valida por ruta y se hidrata hacia `tipoAtencion`.
- `ID_CLIENTE` e `ID_USUARIO` se mantienen como fuente de verdad desde `session_context`.
- La accion usa `execution.type = "api"` con metodo HTTP `PUT` hacia `https://ktw6p76syh.execute-api.us-east-1.amazonaws.com/DEV/Supervision/Incidencias/Actualizaciones`.
- El payload configurado hacia la API externa queda con el contrato:
  - `USU` desde sesion
  - `IDI` desde parametro de ruta
  - `OBS` desde parametro de ruta
  - `TIP` desde parametro de ruta
- Se ajusto `apis_me/supervision/index.php` para aplicar `rawurldecode` a parametros de tipo `string`, permitiendo comentarios codificados en URL para `obs`.
- Se extendio `apis_me/supervision/apiSupervision.class.php` con las propiedades `idIncidencia`, `observaciones` y `tipoAtencion`.
- Validacion ejecutada el martes 21 de julio de 2026:
  - `php -l apis_me/supervision/actions.php`
  - `php -l apis_me/supervision/apiSupervision.class.php`
  - `php -l apis_me/supervision/index.php`

## Actualizacion de sesion 2026-07-21 - recomendacion para observaciones en PUT

- Se reviso el contrato de `incidenceAct` para el parametro `obs`, que hoy viaja como segmento de ruta.
- Se dejo asentado que esta implementacion actual funciona solo como solucion temporal cuando frontend envie `obs` con `encodeURIComponent(...)`.
- La recomendacion vigente es migrar `obs` a `body` JSON y dejar en ruta solo identificadores estables como `idi` y `tip`.
- Motivo: `obs` es texto libre y puede incluir acentos, espacios, signos, diagonales, `#`, `?`, comillas o saltos de linea, lo que vuelve fragil el uso de URL como contenedor principal.
- Si frontend mantiene el contrato actual por ruta, debe codificar el texto con `encodeURIComponent(obs)` antes de invocar `PUT /apis_me/supervision/incidenceAct/<idi>/<obs>/<tip>/`.

## Riesgos o bloqueos

- Si el frontend asume la envoltura completa del proveedor externo, fallara porque el endpoint local ahora expone directamente `body`.
- Cualquier cambio posterior en el contrato de la API externa requerira revisar el parseo en `apiSupervision.class.php`.
- Los otros consumidores futuros de `incidenceAct` deberan seguir enviando `tip` por ruta segun su accion especifica; hoy el detalle ya usa `tip = 1`, `2`, `3` y `4`.
- El flujo de refresco en segundo plano depende de que el detalle haya recibido contexto suficiente de seleccion al ser abierto desde el panel de `supervision`.
- El boton `PDF` genera una vista imprimible HTML en nueva pestaña; si despues se requiere un PDF binario exacto, habra que cambiar la estrategia.

## Validacion pendiente

- Validar manualmente el retorno inmediato al panel de `supervision` tras comentar y tras atender una incidencia para confirmar que el refresh en segundo plano elimino el desfase.
- Revisar visualmente el contenido del `PDF` con diferentes incidencias para confirmar que evidencia, resumen e historial cubren el caso operativo.
- Confirmar si el bloqueo de comentarios para estatus `3`, `4` y `2` coincide exactamente con la regla de negocio final.

## Siguiente paso recomendado

Validar punta a punta el regreso desde `DetalleIncidencia` hacia `supervision` para confirmar que la sincronizacion en segundo plano deja consistente el catalogo y definir si el mismo patron debe extenderse a otros catalogos mutables del modulo.

## Actualizacion de sesion 2026-07-23 - cierre con historial

- Se deja como estado operativo vigente el frente de `DetalleIncidencia` con comentarios reales, modal de atencion, bloqueo de acciones terminales, boton `PDF` y refresco en segundo plano del catalogo de `supervision`.
- No se registran cambios adicionales de codigo en esta sesion; el cierre se hace para consolidar continuidad documental y dejar el siguiente paso claramente acotado.
- La validacion pendiente se mantiene igual:
  - confirmar en flujo real el regreso inmediato al panel sin desfase por TTL
  - revisar si la vista imprimible actual del boton `PDF` es suficiente o si despues se requerira PDF binario real
  - detectar otros puntos de mutacion de incidencias que deban disparar `forceRefresh`
- La nota de historial de cierre para esta continuidad queda en `notas/contexto/historial/2026-07-23-cierre-supervision-atencion-estado-cache-pdf.md`.

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
