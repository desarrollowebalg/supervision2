# Contexto Activo

## Fecha de ultima actualizacion

2026-07-17

## Responsable sugerido

documentation-agent

## Objetivo actual

Formalizar un mecanismo documental de continuidad entre interacciones para que el proyecto mantenga un contexto operativo unico, facil de consultar y facil de actualizar sin depender de memoria conversacional.

## Estado actual

El repositorio ya tiene una base documental util y alineada con el trabajo asistido por IA:

- `AGENTS.md` define reglas operativas globales, agentes y validaciones.
- `agents/README.md` aclara que los agentes son contratos operativos y que no existe un cargador automatico de `agents/*.md`.
- `notas/BUILD.md` mantiene la validacion minima y el flujo de build/deploy.
- existen notas operativas por tema, en especial para `supervision`, formularios, tareas y arquitectura frontend.

Hoy no existe una convencion formal unica para continuidad de contexto entre sesiones. Hay documentacion suficiente para reconstruir estado, pero esta distribuida en varios `.md` y no hay un archivo activo unico que resuma objetivo, decisiones, pendientes y siguiente paso.

## Alcance confirmado

- Crear una base documental para continuidad usando archivos Markdown.
- Mantener la solucion dentro de `notas/` y alineada con `AGENTS.md`.
- No asumir automatizacion inexistente dentro del proyecto.
- Usar este contexto como apoyo operativo y no como sustituto de documentacion tecnica especializada.

## Decisiones vigentes

- El archivo fuente de verdad para continuidad sera `notas/contexto/CONTEXTO_ACTIVO.md`.
- La estructura vivira dentro de `notas/contexto/` para respetar la regla del proyecto de concentrar notas operativas en `notas/`.
- Se separa contexto activo de historial para evitar mezclar estado vigente con registro historico.
- La continuidad se implementa primero como convencion documental formal, no como loader automatico, porque hoy el repo no tiene mecanismo nativo para inyectar un `.md` en cada interaccion.
- La regla de uso debe quedar documentada tambien en `AGENTS.md` para que forme parte del flujo operativo oficial.
- Las frases operativas acordadas para esta convencion son:
  - `continuemos desde el contexto activo`
  - `actualiza el contexto al final`
  - `cierra con historial`

## Archivos clave

- `AGENTS.md`
- `agents/README.md`
- `agents/documentation-agent.md`
- `notas/BUILD.md`
- `notas/contexto/README.md`
- `notas/contexto/PLANTILLA_CONTEXTO.md`
- `src/pages/README.md`
- `src/core/services/README.md`
- `src/pages/supervision/SUPERVISION_SIDEBAR_CONFIG.md`
- `notas/supervision/DEEP_LINK_RETORNO_LOGIN_2026-07-15.md`

## Estado operativo del proyecto que conviene recordar

- Frontend principal: Vanilla JS + Vite + UIkit.
- Entrypoints activos: `src/pages/login/main.js` y `src/pages/inicio/main.js`.
- Flujo base: `/login/default` -> `/inicio/default`.
- La SPA usa hash routing y valida rutas privadas contra PHP con `getUser()`.
- Los servicios reutilizables viven en `src/core/services/`.
- El almacenamiento oficial de catalogos en frontend es IndexedDB con Dexie.
- Formularios, tareas y evidencias ya tienen reglas operativas especificas documentadas.
- El sidebar de `supervision` ya esta desacoplado y configurado por cliente mediante `doctosSupervision/<clienteId>/supervision-sidebar.json`.

## Pendientes inmediatos

1. Confirmar que la estructura `notas/contexto/` cubra bien la necesidad real de continuidad entre sesiones.
2. Ajustar `AGENTS.md` para formalizar la lectura y actualizacion de `CONTEXTO_ACTIVO.md`.
3. Empezar a usar este archivo como punto de arranque en las siguientes tareas documentales o tecnicas.
4. Si la practica funciona, definir despues si hace falta una automatizacion externa o un bootstrap mas fuerte.

## Riesgos o bloqueos

- El proyecto no cuenta hoy con un cargador automatico que lea este contexto al iniciar cada interaccion.
- Si el archivo no se mantiene actualizado, pierde valor rapidamente y se vuelve otra nota obsoleta.
- Puede duplicar informacion si no se conserva como resumen operativo y se intenta mover aqui todo el detalle tecnico.
- El contenido debe seguir alineado con el codigo real para no contradecir `AGENTS.md`, `BUILD.md` o la implementacion vigente.

## Validacion pendiente

- Verificar que la estructura y nombres de archivo queden alineados con la politica de notas del proyecto.
- Confirmar que `AGENTS.md` refleje la nueva regla de continuidad.
- En cambios futuros dentro de `src/`, seguir ejecutando `npm run build` como minimo, segun `notas/BUILD.md`.

## Siguiente paso recomendado

Usar `notas/contexto/CONTEXTO_ACTIVO.md` como referencia inicial en la siguiente tarea real del proyecto y actualizarlo al cierre para validar que la convencion sea practica.

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

## Historial relacionado

- `notas/contexto/historial/2026-07-17-seguimiento-detalle-incidencia.md`
- `notas/supervision/DEEP_LINK_RETORNO_LOGIN_2026-07-15.md`
- `src/pages/supervision/SUPERVISION_SIDEBAR_CONFIG.md`
- `notas/RESUMEN_CAMBIOS.md`
