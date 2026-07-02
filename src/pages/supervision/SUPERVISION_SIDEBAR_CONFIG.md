# Supervisión - Sidebar configurable

Fecha de referencia: 2026-07-02

## Propósito

Este documento describe la arquitectura actual del sidebar de `supervision` y su relación con el panel derecho.

Objetivo actual:

- mantener `supervision.js` como orquestador liviano
- resolver la configuración del sidebar por cliente
- separar render estático, runtime del sidebar y detalle derecho
- conservar el layout base de 2 paneles

## Estado actual

La página ya no concentra todo el runtime en `supervision.js`.

Ahora la arquitectura está separada en estas capas:

1. resolución de configuración por cliente
2. normalización del contrato
3. render estático del sidebar
4. runtime del sidebar
5. componente desacoplado del panel derecho
6. view model para distribución de incidencias

## Archivos involucrados

### Configuración externa

- `doctosSupervision/<ID_CLIENTE>/supervision-sidebar.json`

### Orquestación de página

- `src/pages/supervision/supervision.js`

### Servicios de lectura, defaults y normalización

- `src/pages/supervision/services/supervision-sidebar-config.service.js`
- `src/pages/supervision/services/supervision-sidebar-config.normalizer.js`
- `src/pages/supervision/config/supervision-sidebar.defaults.js`
- `src/pages/supervision/config/supervision-detail.registry.js`

### Render compartido del sidebar

- `src/components/supervision-sidebar/supervision-sidebar.js`
- `src/components/supervision-sidebar/supervision-query-panel.js`
- `src/components/supervision-sidebar/supervision-accordion-item.js`

### Runtime y referencias del sidebar

- `src/components/supervision-sidebar/supervision-sidebar.controller.js`
- `src/components/supervision-sidebar/supervision-sidebar.dom.js`
- `src/components/supervision-sidebar/supervision-user-summary-card.js`
- `src/pages/supervision/services/supervision-sidebar.viewmodel.js`

### Panel derecho desacoplado

- `src/components/supervision-detail/supervision-detail-panel.js`

## Flujo completo actual

### Fase 1. Resolución del cliente activo

Archivo:

- `src/pages/supervision/services/supervision-sidebar-config.service.js`

Responsabilidad:

- leer `ci` desde `sessionStorage`
- decodificar `ci` desde base64
- usar el valor decodificado como `ID_CLIENTE`

Regla actual:

- si se recibe un `workspaceId` explícito, se usa ese valor
- si no se recibe, se intenta resolver desde `sessionStorage.ci`
- si `ci` no existe o es inválido, se usa fallback técnico a `workspaceId = "1"`

### Fase 2. Lectura del archivo de configuración

Archivo:

- `src/pages/supervision/services/supervision-sidebar-config.service.js`

Responsabilidad:

- construir la ruta `/doctosSupervision/<ID_CLIENTE>/supervision-sidebar.json`
- leer el JSON con `fetch`
- enviarlo al normalizador

### Fase 3. Fallback cuando el archivo no existe

Archivo:

- `src/pages/supervision/config/supervision-sidebar.defaults.js`

Responsabilidad:

- exponer defaults completos
- exponer fallback reducido para clientes sin archivo

Fallback actual:

- conserva el panel `Herramientas`
- deja un único panel de nivel con `id: "0"`

### Fase 4. Normalización del contrato

Archivo:

- `src/pages/supervision/services/supervision-sidebar-config.normalizer.js`

Responsabilidad:

- validar forma mínima del objeto
- completar defaults faltantes
- asegurar que `queryPanel` siempre exista
- filtrar paneles inválidos
- descartar duplicados por `id`
- ordenar `panels` por `order`
- validar `detailSlot` contra el registry

Salida:

- un objeto limpio y estable listo para render

### Fase 5. Render estático del sidebar

Archivos:

- `src/components/supervision-sidebar/supervision-sidebar.js`
- `src/components/supervision-sidebar/supervision-query-panel.js`
- `src/components/supervision-sidebar/supervision-accordion-item.js`

Responsabilidad:

- construir el acordeón UIkit
- pintar el panel `Herramientas`
- pintar los paneles configurables
- preservar IDs de DOM compatibles con el runtime

### Fase 6. Runtime del sidebar

Archivo:

- `src/components/supervision-sidebar/supervision-sidebar.controller.js`

Responsabilidad:

- inicializar listeners
- resolver fecha inicial
- ejecutar carga inicial si `fetchOnInitialLoad = true`
- refrescar al cambiar la fecha si `fetchOnChange = true`
- coordinar fetch de incidencias y usuarios
- resetear y repintar contadores, listas y mensajes
- emitir selección de usuario hacia la página

API actual del controlador:

- `init()`
- `refreshAll({ selectedDate })`
- `updatePanels(viewModel)`
- `setLoading(isLoading)`
- `setMessage(message)`
- `destroy()`

### Fase 7. View model del sidebar

Archivo:

- `src/pages/supervision/services/supervision-sidebar.viewmodel.js`

Responsabilidad:

- enriquecer incidencias con datos de usuario
- agrupar incidencias por panel
- calcular conteos y pendientes
- entregar una estructura lista para render

Salida lógica:

- `panelId`
- `detailSlot`
- `count`
- `pendingTotal`
- `records`

### Fase 8. Panel derecho desacoplado

Archivo:

- `src/components/supervision-detail/supervision-detail-panel.js`

Responsabilidad:

- renderizar el contenedor del lado derecho
- manejar estados base del detalle
- mostrar `empty state`
- mostrar selección de usuario

API actual:

- `init()`
- `showEmptyState()`
- `showLoading()`
- `showSelection({ userId, userName, selectedDate })`
- `destroy()`

### Fase 9. Orquestación final de la página

Archivo:

- `src/pages/supervision/supervision.js`

Responsabilidad:

- montar layout de 2 columnas
- cargar la configuración del sidebar
- insertar sidebar y detail panel
- inicializar el runtime del sidebar
- reenviar la selección del sidebar al panel derecho

## Responsabilidades por capa

### `supervision.js`

Define:

- composición general de la página
- inicialización de sidebar y detail panel
- coordinación entre panel izquierdo y derecho

No define:

- fetch directo de incidencias
- mapeo de registros por panel
- listeners internos del sidebar

### `supervision-sidebar-config.service.js`

Define:

- cómo se resuelve el cliente activo
- cómo se construye la ruta del JSON
- cuándo cae a fallback

No define:

- reglas de render
- lógica del panel derecho

### `supervision-sidebar-config.normalizer.js`

Define:

- reglas de saneamiento y defaults

No define:

- runtime de incidencias
- estado visual vivo

### `supervision-sidebar.controller.js`

Define:

- runtime del panel izquierdo

No define:

- layout de página
- detalle funcional complejo del lado derecho

### `supervision-detail-panel.js`

Define:

- estados base del lado derecho

No define:

- consulta compleja de detalle por usuario
- resolución avanzada por `detailSlot`

## Contrato lógico del objeto normalizado

```json
{
  "workspaceId": "768",
  "schemaVersion": 1,
  "accordion": {
    "multipleOpen": true
  },
  "queryPanel": {
    "id": "query",
    "enabled": true,
    "label": "Herramientas",
    "icon": "calendar",
    "accordion": {
      "initialOpen": true
    },
    "controls": {
      "date": {
        "enabled": true,
        "required": true,
        "defaultStrategy": "today",
        "min": null,
        "max": null
      }
    },
    "behavior": {
      "fetchOnInitialLoad": true,
      "fetchOnChange": true
    },
    "summary": {
      "helperText": "Selecciona una fecha para ver la semana correspondiente."
    }
  },
  "panels": []
}
```

## Defaults importantes

Archivo:

- `src/pages/supervision/config/supervision-sidebar.defaults.js`

Defaults base:

- `workspaceId = "1"`
- `schemaVersion = 1`
- `accordion.multipleOpen = true`
- `queryPanel.label = "Herramientas"`
- `queryPanel.icon = "calendar"`
- `queryPanel.accordion.initialOpen = true`
- `queryPanel.controls.date.enabled = true`
- `queryPanel.controls.date.required = true`
- `queryPanel.controls.date.defaultStrategy = "today"`
- `queryPanel.behavior.fetchOnInitialLoad = true`
- `queryPanel.behavior.fetchOnChange = true`
- `panel.enabled = true`
- `panel.initialOpen = false`
- `panel.detailSlot = "incidents-list"`

Fallback reducido:

- conserva `queryPanel`
- deja solo el panel `id = "0"`

## Registry actual de detalle

Archivo:

- `src/pages/supervision/config/supervision-detail.registry.js`

Estado actual:

- solo registra `incidents-list`

Uso actual:

- validar que el `detailSlot` configurado sea aceptado

## Criterio de mantenimiento

Si cambia alguno de estos elementos:

- `label`
- `indicatorColor`
- `order`
- `enabled`

el primer lugar a revisar debe ser:

- `doctosSupervision/<ID_CLIENTE>/supervision-sidebar.json`

Si el cambio es de comportamiento del panel izquierdo, revisar:

- `src/components/supervision-sidebar/supervision-sidebar.controller.js`

Si el cambio es del panel derecho, revisar:

- `src/components/supervision-detail/supervision-detail-panel.js`

## Estado de crecimiento previsto

La base actual ya soporta:

- configuración dinámica por cliente
- fallback cuando no existe archivo del cliente
- runtime desacoplado del sidebar
- panel derecho desacoplado

Una siguiente fase puede conectar:

- detalle real por usuario
- resolución funcional por `detailSlot`
- refresco programado del sidebar
- actualización parcial de contadores o paneles
