# Análisis del módulo Supervisión

Fecha de referencia: 2026-07-14

## Propósito de esta nota

Describir cómo funciona actualmente el módulo `supervision` en el frontend, qué piezas lo componen, cómo fluye la información y hasta dónde llega la implementación a la fecha.

Esta nota busca reflejar el estado real actual del código, no una versión ideal o futura.

## Ubicación principal del módulo

Ruta principal:

- `#/supervision`

Orquestador de página:

- `src/pages/supervision/supervision.js`

## Qué hace hoy el módulo

Actualmente el módulo de Supervisión resuelve este flujo:

1. Monta una vista de 2 paneles.
2. Carga una configuración externa de sidebar por cliente.
3. Permite seleccionar una fecha.
4. Consulta incidencias resumidas para esa fecha.
5. Agrupa esas incidencias por nivel configurado.
6. Muestra en el panel izquierdo un listado de usuarios por nivel.
7. Al seleccionar un usuario, carga en el panel derecho el detalle de incidencias de ese usuario para la semana correspondiente.
8. Permite filtrar, ordenar, paginar y abrir una ruta separada de detalle de incidencia.

## Estructura funcional actual

El módulo está partido en 5 capas principales.

### 1. Configuración externa del sidebar

Archivos:

- `doctosSupervision/<clienteId>/supervision-sidebar.json`
- `doctosSupervision/1/supervision-sidebar.json`

Responsabilidad:

- definir la estructura declarativa del panel izquierdo
- declarar niveles visibles
- ordenar paneles
- definir colores, títulos y comportamiento base del panel de herramientas

Importante:

- este JSON no contiene runtime vivo
- no guarda incidencias, contadores, errores ni estados de carga

## 2. Carga y normalización de la configuración

Archivos:

- `src/pages/supervision/services/supervision-sidebar-config.service.js`
- `src/pages/supervision/services/supervision-sidebar-config.normalizer.js`
- `src/pages/supervision/config/supervision-sidebar.defaults.js`
- `src/pages/supervision/config/supervision-detail.registry.js`

Responsabilidades actuales:

- resolver el cliente activo
- construir la ruta del JSON
- hacer fallback cuando el archivo no existe
- normalizar el contrato antes de renderizar

### Resolución de cliente

Hoy el cliente se resuelve así:

1. si se pasa `workspaceId` explícito, se usa
2. si no, se intenta leer `sessionStorage.ci`
3. `ci` se decodifica con `atob`
4. si falla o no existe, se usa fallback técnico a `"1"`

### Fallback actual

Si el JSON del cliente no existe:

- no se rompe la página
- se usa `DEFAULT_SUPERVISION_SIDEBAR_FALLBACK_CONFIG`
- se mantiene `Herramientas`
- se deja solo el panel `Nivel 0`

## 3. Render del sidebar izquierdo

Archivos:

- `src/components/supervision-sidebar/supervision-sidebar.js`
- `src/components/supervision-sidebar/supervision-query-panel.js`
- `src/components/supervision-sidebar/supervision-accordion-item.js`
- `src/components/supervision-sidebar/supervision-sidebar.dom.js`
- `src/components/supervision-sidebar/supervision-user-summary-card.js`

Responsabilidades:

- construir el acordeón UIkit
- mostrar el panel `Herramientas`
- mostrar los paneles por nivel
- reservar IDs y nodos de DOM para el runtime
- renderizar tarjetas resumen por usuario

### Panel de herramientas

El panel superior contiene:

- input de fecha
- texto guía
- nodo para mensajes del módulo

Comportamiento actual:

- si `fetchOnInitialLoad` está activo, carga al entrar
- si `fetchOnChange` está activo, recarga al cambiar la fecha

### Paneles por nivel

Cada panel configurable representa un nivel de incidencia.

El título visible se arma con:

- `label`
- `meta.subtitle`
- `meta.slaLabel`

Hoy el helper `buildSupervisionPanelTitle(panel)` los concatena con `→`.

### Tarjeta resumen por usuario

Cada usuario dentro de un panel muestra:

- foto o iniciales
- nombre
- pendientes
- no leídos
- leídos

Cada tarjeta deja disponible por `data-*`:

- `userId`
- `userName`
- `panelId`
- `detailSlot`
- `panelTitle`
- `photoUrl`

Eso permite que el controlador del sidebar notifique la selección sin acoplarse al detalle derecho.

## 4. Runtime del sidebar

Archivo:

- `src/components/supervision-sidebar/supervision-sidebar.controller.js`

Este archivo es el runtime principal del panel izquierdo.

### Qué hace al iniciar

1. Toma referencias reales del DOM.
2. Si el input de fecha está vacío, asigna la fecha de hoy.
3. Registra listeners de cambio de fecha.
4. Registra listener de selección de usuario.
5. Si la configuración lo permite, dispara la primera carga.

### Qué hace al refrescar

Método principal:

- `refreshAll({ selectedDate })`

Pasos actuales:

1. valida fecha
2. sincroniza el valor visible del input
3. actualiza el rango semanal en sesión
4. muestra loader del panel izquierdo
5. limpia listas y badges previos
6. ejecuta en paralelo:
   - `getIncidenciasByDate(safeDate)`
   - `syncClientUsers()`
7. enriquece incidencias con foto de usuario
8. construye el view model por panel
9. repinta listas, pendientes y contadores

### Qué guarda en sesión

Servicio usado:

- `src/core/services/supervision-date-range.service.js`

Claves actuales en `sessionStorage`:

- `fechaActualSupervision`
- `fechaInicio`
- `fechaFin`

El rango semanal se calcula tomando lunes como inicio y domingo como fin.

## 5. View model del sidebar

Archivo:

- `src/pages/supervision/services/supervision-sidebar.viewmodel.js`

Responsabilidades actuales:

- ordenar incidencias por fecha descendente
- resolver a qué panel pertenece cada incidencia según `NIVEL`
- enriquecer con `URL_FOTO_PERFIL`
- calcular:
  - total de registros por panel
  - suma de pendientes (`NO_LEIDOS`)
  - listado final para render

### Mapeo de nivel a panel

Si el panel existe con ID numérico, usa ese ID.

Si no, conserva compatibilidad con IDs legacy:

- `4 -> critical`
- `3 -> relevant`
- `2 -> important`
- `1 -> operational`
- `0 -> informative`

Esto muestra que el módulo ya contempla compatibilidad con una etapa anterior del sidebar.

## Panel derecho de detalle

Archivo principal:

- `src/components/supervision-detail/supervision-detail-panel.js`

Responsabilidad:

- mostrar el detalle de incidencias del usuario seleccionado

## Flujo del detalle derecho

Cuando se selecciona un usuario desde el panel izquierdo:

1. `supervision-sidebar.controller.js` arma un objeto `selection`
2. `supervision.js` recibe ese evento con `onUserSelect`
3. `supervision.js` llama `detailPanel.showSelection(selection)`
4. el panel derecho carga datos y repinta su tabla

Además, `supervision.js` emite:

- `window.dispatchEvent(new CustomEvent('supervision:user-selected', ...))`

Eso deja un hook global disponible para extensiones futuras.

## Qué muestra hoy el panel derecho

Hoy el detalle derecho sí está funcional y no es solo placeholder.

Incluye:

- tarjeta del usuario seleccionado
- fecha seleccionada
- badge visual de origen por nivel
- estadísticas por estatus
- aviso de caché cuando aplica
- buscador general
- filtros por columna
- filtros multiselección para estado y turno
- selección de columnas visibles
- ordenamiento por columna
- paginación
- acción para abrir PDF
- acción para abrir ruta separada de detalle

## Obtención de detalle de incidencias

Servicio usado:

- `src/core/services/apis-me/incidencias.service.js`

Método principal:

- `getIncidenciasDetalle({ fechaInicio, fechaFin, usuario, nivel, selectedDate, forceRefresh })`

El detalle usa:

- rango semanal desde `sessionStorage`
- usuario seleccionado
- nivel del panel seleccionado

### Endpoint base del detalle

La llamada base sale de:

- `fetchIncidenciasDetalle({ fechaInicio, fechaFin, usuario })`

Ruta consumida:

- `incidencias/detalle/<fechaInicio>/<fechaFin>/<usuario>/`

Después de eso, el frontend filtra localmente por `nivel` cuando aplica.

## Estrategia de caché actual

El módulo ya tiene una estrategia de caché importante y forma parte real de su funcionamiento.

### Resumen por fecha

Método:

- `getIncidenciasByDate(date)`

Catalog key:

- `resumensup`

TTL actual:

- fecha actual: `2 minutos`
- fecha histórica: prácticamente permanente (`10 años`)

### Detalle por usuario

Se cachea por:

- fecha/rango
- usuario
- y una derivación adicional por nivel cuando aplica

TTL actual:

- detalle de hoy: `5 minutos`
- detalle semana actual no histórica: `30 minutos`
- detalle histórico: prácticamente permanente (`10 años`)

### Regla de identidad

La caché depende de `getSessionCatalogContext()`.

Si no existe identidad estable de usuario:

- no se fuerza sincronización de red en los casos protegidos por esa regla
- se privilegia lectura de caché disponible

Esto mantiene alineación con la política general del proyecto para catálogos frontend.

## Estadísticas y filtros del detalle

El panel derecho construye estadísticas por estatus a partir de la carga de incidencias del usuario.

Estatus soportados actualmente:

- `NL`
- `NL_NVL`
- `L`
- `A`
- `AP`
- `C`
- `R`
- `RE`
- `X`

Además:

- normaliza alias de etiquetas
- permite activar una estadística para filtrar visualmente la tabla
- soporta búsqueda general y filtros puntuales

## Ruta secundaria de detalle de incidencia

Ruta:

- `#/detalle-incidencia/:ide`

Archivo:

- `src/pages/supervision/DetalleIncidencia.js`

Estado actual:

- existe como destino de navegación desde la tabla del panel derecho
- hoy funciona principalmente como pantalla de transición y retorno
- todavía no muestra el detalle completo de la incidencia

Esto significa que el flujo ya permite “entrar” al detalle puntual, pero esa vista aún está en una fase base.

## Composición visual de la página

Archivo:

- `src/pages/supervision/supervision.js`

Responsabilidades visuales actuales:

- monta layout de 2 columnas
- oculta el título estándar del card padre
- bloquea el scroll principal del contenedor
- sincroniza la altura visible disponible
- aplica estilos locales del módulo

Observación real:

- la página hace varios ajustes de layout directamente para que el módulo se comporte como una pantalla de trabajo completa dentro del shell
- aquí todavía existe una pequeña mezcla entre responsabilidad visual y orquestación

## Alcance real logrado hasta hoy

A la fecha, el módulo ya resuelve de forma funcional:

- sidebar configurable por cliente
- carga dinámica de configuración externa
- normalización y fallback del contrato
- consulta de incidencias resumidas por fecha
- agrupación por niveles
- selección de usuario por nivel
- carga de detalle por usuario y semana
- filtros, ordenamiento y paginación en el panel derecho
- caché para resumen y detalle
- navegación a ruta secundaria de detalle

## Límites o partes aún parciales

### 1. Ruta `DetalleIncidencia`

La ruta existe, pero todavía no implementa el detalle completo final.

### 2. Registro de detalles

Hoy el registry de detalle solo acepta:

- `incidents-list`

Archivo:

- `src/pages/supervision/config/supervision-detail.registry.js`

Eso significa que la arquitectura ya está pensada para soportar distintos tipos de detalle, pero todavía solo hay uno implementado.

### 3. Configuración declarativa con contenido resumido

El JSON del cliente 1 contiene metadatos muy cortos en `subtitle` y `slaLabel`:

- `R`
- `S`
- `C`

Eso no rompe el sistema, pero hoy limita la expresividad del título visible del acordeón respecto a los defaults más descriptivos.

### 4. Acoplamiento visual en `supervision.js`

El módulo ya está bastante separado por capas, pero `supervision.js` aún conserva decisiones de layout y sincronización visual que en una fase posterior podrían moverse a una capa más especializada.

## Flujo resumido extremo a extremo

1. Usuario entra a `#/supervision`.
2. `supervision.js` carga configuración del sidebar.
3. Se renderiza shell de 2 paneles.
4. El controlador del sidebar inicializa fecha y listeners.
5. Se calcula y guarda el rango semanal en sesión.
6. Se consultan incidencias resumidas por fecha y usuarios del cliente.
7. Se construyen paneles con conteos, pendientes y usuarios.
8. Usuario selecciona un supervisor.
9. El panel derecho consulta detalle semanal de incidencias de ese usuario.
10. El usuario puede filtrar, ordenar, paginar o abrir la ruta secundaria de detalle.

## Archivos clave para mantenimiento

### Página y orquestación

- `src/pages/supervision/supervision.js`
- `src/pages/supervision/DetalleIncidencia.js`

### Configuración y contrato

- `doctosSupervision/1/supervision-sidebar.json`
- `src/pages/supervision/services/supervision-sidebar-config.service.js`
- `src/pages/supervision/services/supervision-sidebar-config.normalizer.js`
- `src/pages/supervision/config/supervision-sidebar.defaults.js`

### Sidebar

- `src/components/supervision-sidebar/supervision-sidebar.js`
- `src/components/supervision-sidebar/supervision-query-panel.js`
- `src/components/supervision-sidebar/supervision-accordion-item.js`
- `src/components/supervision-sidebar/supervision-sidebar.controller.js`
- `src/components/supervision-sidebar/supervision-sidebar.dom.js`
- `src/components/supervision-sidebar/supervision-user-summary-card.js`

### View model y soporte

- `src/pages/supervision/services/supervision-sidebar.viewmodel.js`
- `src/core/services/supervision-date-range.service.js`

### Datos

- `src/core/services/apis-me/incidencias.service.js`
- `src/core/services/apis-me/usuarios.service.js`
- `src/core/services/catalog-indexeddb.service.js`

## Conclusión operativa

El módulo Supervisión ya no está en fase de maqueta.

Hoy funciona como una pantalla operativa compuesta por:

- configuración externa por cliente
- runtime de sidebar por fecha y nivel
- detalle por usuario con herramientas reales de consulta
- persistencia/caché para evitar recargas innecesarias

La parte más claramente pendiente es la profundización del detalle individual de incidencia en la ruta `#/detalle-incidencia/:ide`, mientras que el resto del flujo principal de consulta y exploración ya está implementado y operando sobre una arquitectura modular.
