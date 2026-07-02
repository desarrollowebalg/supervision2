# Revisar arquitectura del sidebar

> revisa la página [supervision.js](src/pages/supervision/supervision.js) y antes de hacer nada dime como está en este momento la arquitectura para armar el componente del sidebar

<details><summary>4 previous messages</summary>

> `frontend-agent`. Voy a revisar `src/pages/supervision/supervision.js` y los archivos que hoy participan en el sidebar para describirte la arquitectura actual antes de proponer o tocar nada.
>
> <details><summary>Ran 4 commands</summary>
>
> - Ran `Get-Content -Path 'src/pages/supervision/supervision.js'`
> - Ran `Get-Content -Path 'src/pages/supervision/SUPERVISION_SIDEBAR_CONFIG.md'`
> - Ran `Get-ChildItem -Path 'src/components/supervision-sidebar' -Recurse | Select-Object FullName`
> - Ran `rg -n "supervision-sidebar-config|supervision-sidebar|queryPanel|panels" src doctosSupervision`
>
> </details>
>
> Ya ubiqué la ruta completa: `supervision.js` no arma el sidebar “a mano”; hoy carga una configuración externa, la normaliza y delega el render a componentes compartidos. Voy a abrir esas piezas para decirte exactamente qué hace cada capa y dónde sigue viviendo el runtime.
>
> <details><summary>Ran 8 commands</summary>
>
> - Ran `Get-Content -Path 'src/pages/supervision/services/supervision-sidebar-config.normalizer.js'`
> - Ran `Get-Content -Path 'src/pages/supervision/config/supervision-sidebar.defaults.js'`
> - Ran `Get-Content -Path 'src/components/supervision-sidebar/supervision-sidebar.js'`
> - Ran `Get-Content -Path 'src/pages/supervision/services/supervision-sidebar-config.service.js'`
> - Ran `Get-Content -Path 'doctosSupervision/1/supervision-sidebar.json'`
> - Ran `Get-Content -Path 'src/components/supervision-sidebar/supervision-query-panel.js'`
> - Ran `Get-Content -Path 'src/pages/supervision/config/supervision-detail.registry.js'`
> - Ran `Get-Content -Path 'src/components/supervision-sidebar/supervision-accordion-item.js'`
>
> </details>
</details>

`frontend-agent`.

Hoy el sidebar de `supervision` está armado con una arquitectura en 4 capas, no embebido directamente en [supervision.js](/D:/www/supervision2/src/pages/supervision/supervision.js:1):

1. Configuración externa por cliente
   Vive en [supervision-sidebar.json](/D:/www/supervision2/doctosSupervision/1/supervision-sidebar.json:1). Ahí se define el contrato declarativo del sidebar: `workspaceId`, `accordion`, `queryPanel` y `panels`. Si cambias label, color, orden o visibilidad, en principio debe cambiarse aquí primero.

2. Carga y normalización
   [supervision-sidebar-config.service.js](/D:/www/supervision2/src/pages/supervision/services/supervision-sidebar-config.service.js:1) resuelve la ruta `/doctosSupervision/1/supervision-sidebar.json`, hace `fetch` y si falla cae a defaults.
   Luego [supervision-sidebar-config.normalizer.js](/D:/www/supervision2/src/pages/supervision/services/supervision-sidebar-config.normalizer.js:1) sanea el objeto: completa defaults, valida `queryPanel`, descarta paneles inválidos o duplicados, ordena por `order` y valida `detailSlot` contra [supervision-detail.registry.js](/D:/www/supervision2/src/pages/supervision/config/supervision-detail.registry.js:1).

3. Render compartido del sidebar
   [supervision-sidebar.js](/D:/www/supervision2/src/components/supervision-sidebar/supervision-sidebar.js:1) compone el `<ul class="uk-accordion">`.
   Delega en:
   - [supervision-query-panel.js](/D:/www/supervision2/src/components/supervision-sidebar/supervision-query-panel.js:1) para el bloque de herramientas y fecha.
   - [supervision-accordion-item.js](/D:/www/supervision2/src/components/supervision-sidebar/supervision-accordion-item.js:1) para cada panel/nivel.

   Esta capa genera HTML del sidebar y preserva IDs de DOM que luego usa el runtime.

4. Runtime en la página
   [supervision.js](/D:/www/supervision2/src/pages/supervision/supervision.js:1) sigue siendo el orquestador. Hace tres cosas:
   - carga la config normalizada con `loadSupervisionSidebarConfig()`,
   - inserta `renderSupervisionSidebar(sidebarConfig)` dentro del layout izquierdo,
   - conecta comportamiento vivo: listeners del date picker, fetch de incidencias, agrupación por nivel, llenado de listas, badges, loader y selección de usuario.

En otras palabras: la estructura visual del sidebar ya está desacoplada y configurada externamente, pero el estado vivo y la lógica de negocio todavía siguen dentro de `supervision.js`.

Punto importante del estado actual: aunque la documentación dice “fase 1” y habla de dejar el runtime para después, el código actual ya sí tiene runtime real en `supervision.js`: carga incidencias por fecha, sincroniza usuarios, distribuye registros por panel y actualiza el DOM del sidebar. Si quieres, el siguiente paso es mapear qué parte conviene extraer primero para que el sidebar quede realmente componente + runtime separado.

> pregunta ¿consideras que está es una forma considerando que quiera incrementar el funcionamiento a futuro?

Sí, pero solo a medias.

Para crecer a futuro, la parte buena es que ya separaron bastante bien la estructura declarativa del sidebar del runtime:

- La configuración visible vive fuera de [supervision.js](/D:/www/supervision2/src/pages/supervision/supervision.js:1).
- Hay una capa de carga y otra de normalización.
- El render del acordeón ya está dividido en componentes pequeños.

Eso sí es una base razonable para escalar cambios de presentación, orden, labels, colores y alta/baja de paneles sin tocar la página principal.

El problema es que el comportamiento real todavía está demasiado concentrado en [supervision.js](/D:/www/supervision2/src/pages/supervision/supervision.js:1). Ahí mismo vive:

- la carga inicial
- los listeners
- el fetch de incidencias
- la sincronización de usuarios
- la distribución por nivel
- la actualización manual del DOM
- el evento de selección

Entonces, si quieres “incrementar el funcionamiento” de verdad, esta arquitectura hoy te sirve bien para crecer en configuración visual, pero no tanto para crecer en complejidad funcional. Conforme agregues filtros, nuevos tipos de panel, detalle real por `detailSlot`, estados de selección, refresh parciales o distintas fuentes de datos, `supervision.js` se va a volver el cuello de botella.

Mi conclusión práctica: como base está bien orientada, pero todavía no está cerrada como arquitectura escalable. Le falta una segunda extracción:

- un runtime/controller del sidebar
- una capa de mapeo de datos por panel
- un registro real de `detailSlot` con comportamiento, no solo validación
- menos dependencia de IDs manuales y `innerHTML`
- separar “configuración”, “estado” y “render”

Si quieres, el siguiente paso útil no sería rediseñar todo, sino decirte exactamente cuál sería la refactorización mínima para dejarla lista para crecer sin romper el flujo actual.

> explicame que consideras como una refactorización en este momento

En este momento, “refactorización” aquí no sería rediseñar la pantalla ni cambiar el comportamiento funcional. Sería reorganizar el código actual para que haga lo mismo, pero quede preparado para crecer sin que [supervision.js](/D:/www/supervision2/src/pages/supervision/supervision.js:1) siga absorbiendo toda la lógica.

Concretamente, yo lo entiendo así:

1. Separar responsabilidades que hoy están mezcladas en `supervision.js`
- render de layout
- carga de configuración
- manejo de estado del sidebar
- fetch de datos
- mapeo de incidencias por nivel
- actualización de DOM
- selección de usuario

2. Sacar el runtime del sidebar a una pieza propia
Por ejemplo un controlador o servicio tipo:
- `supervision-sidebar.runtime.js`
- o `supervision-sidebar.controller.js`

Esa pieza se encargaría de:
- inicializar listeners
- resolver fecha activa
- cargar incidencias
- resetear paneles
- pintar resultados
- emitir eventos de selección

Y `supervision.js` quedaría más como orquestador de página, no como dueño de todos los detalles.

3. Separar datos transformados de render
Hoy `loadIncidenciasForSelectedDate()` trae datos y de inmediato los mete al DOM. Refactorizar aquí sería meter una capa intermedia, algo como:
- `groupIncidenciasByPanel(records, config)`
- `buildSidebarViewModel(records, usersCatalog, config)`

Así el render consume una estructura ya lista, en vez de que toda la inteligencia viva dispersa en métodos que manipulan HTML.

4. Formalizar el contrato de cada panel
Hoy existe `detailSlot`, pero en la práctica solo se valida contra un registry simple. Refactorizar sería hacer que ese registry ya no solo “valide”, sino que defina comportamiento:
- cómo renderiza ese panel
- qué tipo de detalle abre
- qué datos necesita
- qué componente lo consume

Eso permitiría que en el futuro no todos los paneles dependan de la misma lógica rígida.

5. Reducir acoplamiento a IDs manuales
Ahora mucho del runtime depende de `querySelector('#user-list-4')`, `#pendientes-user-list-3`, etc. Eso funciona, pero escala mal. Refactorizar sería centralizar esas referencias o encapsularlas por panel, para no tener el DOM “regado” como contrato principal.

6. Mantener el resultado visible igual
Ese punto es importante: una refactorización en este momento no debería cambiar flujo, UX ni contrato funcional. Debería dejar la página comportándose igual, pero con una base más clara para luego agregar:
- nuevos filtros
- nuevos paneles
- distintos `detailSlot`
- nuevas fuentes de datos
- estados de selección o refresh más finos

Dicho corto: para mí aquí refactorizar es mover de una página monolítica con runtime embebido a una arquitectura donde `config`, `estado`, `transformación de datos` y `render` queden separados, sin cambiar todavía lo que el usuario ve o hace. Si quieres, te lo puedo aterrizar al repo con una propuesta exacta de archivos y qué sacaría de `supervision.js` primero.
