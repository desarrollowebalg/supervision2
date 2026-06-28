# Supervisión - Sidebar configurable

Fecha de referencia: 2026-06-28

## Propósito

Este documento describe la primera fase del refactor del panel izquierdo de `supervision`.

Objetivo actual:

- sacar la estructura del sidebar de `supervision.js`
- leerla desde configuración externa por cliente
- normalizarla antes de renderizar
- mantener el mismo layout visual base

Fuera de alcance en esta fase:

- consulta real de incidencias por fecha
- recarga por cambio de fecha
- conteos reales de pendientes
- detalle dinámico real por panel
- edición del schema desde UI de configuración

## Archivos involucrados

### Configuración externa

- `doctosSupervision/1/supervision-sidebar.json`

### Orquestación de página

- `src/pages/supervision/supervision.js`

### Servicios de lectura y normalización

- `src/pages/supervision/services/supervision-sidebar-config.service.js`
- `src/pages/supervision/services/supervision-sidebar-config.normalizer.js`

### Contratos internos

- `src/pages/supervision/config/supervision-sidebar.defaults.js`
- `src/pages/supervision/config/supervision-detail.registry.js`

### Componentes compartidos

- `src/components/supervision-sidebar/supervision-sidebar.js`
- `src/components/supervision-sidebar/supervision-query-panel.js`
- `src/components/supervision-sidebar/supervision-accordion-item.js`

## Flujo completo hasta pintar en pantalla

La configuración pasa por estas fases:

### Fase 1. Fuente de configuración por cliente

Archivo:

- `doctosSupervision/1/supervision-sidebar.json`

Responsabilidad:

- declarar la estructura visible del sidebar izquierdo
- definir `queryPanel`
- definir el orden y metadatos de `panels`

### Fase 2. Resolución de la ruta física

Archivo:

- `src/pages/supervision/services/supervision-sidebar-config.service.js`

Responsabilidad:

- resolver la ruta `/doctosSupervision/1/supervision-sidebar.json`
- leer el JSON con `fetch`
- entregar el contenido al normalizador
- aplicar fallback a defaults si la carga falla

Observación:

- en esta fase el cliente está fijo en `1`
- la resolución dinámica de cliente queda para una fase posterior

### Fase 3. Normalización del contrato

Archivo:

- `src/pages/supervision/services/supervision-sidebar-config.normalizer.js`

Responsabilidad:

- validar forma mínima del objeto
- completar defaults faltantes
- asegurar que `queryPanel` siempre exista
- filtrar paneles inválidos
- descartar duplicados por `id`
- ordenar `panels` por `order`
- asegurar que `detailSlot` exista en el registry

Salida:

- un objeto limpio, estable y listo para render

La salida del normalizador no incluye runtime vivo.

No incluye todavía:

- `pendingCount`
- `records`
- `selectedDate`
- `isLoading`
- `error`
- `activePanelId`

### Fase 4. Render del sidebar compartido

Archivo:

- `src/components/supervision-sidebar/supervision-sidebar.js`

Responsabilidad:

- construir el `<ul class="uk-accordion">`
- renderizar `queryPanel`
- iterar `panels`
- delegar cada bloque a su componente correspondiente

### Fase 5. Render del panel de consulta

Archivo:

- `src/components/supervision-sidebar/supervision-query-panel.js`

Responsabilidad:

- pintar el primer `li` del acordeón
- renderizar el título "Herramientas"
- renderizar el icono `calendar`
- renderizar el control `date`
- renderizar el texto helper
- preservar IDs ya existentes del DOM

IDs preservados:

- `loaderGralSupNiveles`
- `datePickerMapHot`
- `heatmapTitle`
- `weekInfo`
- `msgContentsPanels`
- `idSupervisorSeleccionado`
- `contenedorSupervisioresSup_v0`
- `user-list-supervisores`

### Fase 6. Render de cada nivel configurable

Archivo:

- `src/components/supervision-sidebar/supervision-accordion-item.js`

Responsabilidad:

- pintar cada `li` configurable
- usar `indicatorColor` como color visual del indicador
- armar el texto visible con `label + subtitle + slaLabel`
- renderizar el badge `Pendientes: 0`
- dejar el contenedor interno listo para datos futuros

IDs preservados por compatibilidad:

- `user-list-4`
- `user-list-3`
- `user-list-2`
- `user-list-1`
- `user-list`
- `pendientes-user-list-4`
- `pendientes-user-list-3`
- `pendientes-user-list-2`
- `pendientes-user-list-1`
- `pendientes-user-list`
- `user-count`

### Fase 7. Integración en la página

Archivo:

- `src/pages/supervision/supervision.js`

Responsabilidad:

- mantener el layout de 2 columnas
- dejar el panel derecho intacto
- cargar la configuración normalizada
- insertar el sidebar ya construido en el panel izquierdo

## Responsabilidades por capa

### `supervision-sidebar.json`

Define:

- estructura visible
- orden de paneles
- color del indicador
- etiquetas y metadatos del panel
- flags de apertura y visibilidad

No define:

- HTML
- imports
- clases CSS arbitrarias
- runtime de incidencias
- lógica de fetch

### `supervision-sidebar-config.service.js`

Define:

- cómo se obtiene la configuración

No define:

- reglas de render
- lógica de layout
- detalle por panel

### `supervision-sidebar-config.normalizer.js`

Define:

- reglas de saneamiento y defaults

No define:

- datos de negocio vivos
- comportamiento de consulta real

### `supervision-sidebar.js`

Define:

- composición visual del acordeón

No define:

- origen de la configuración
- fetch de datos

## Contrato actual del objeto normalizado

La salida esperada tiene esta forma lógica:

```json
{
  "workspaceId": "1",
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

## Registry actual de detalle

Archivo:

- `src/pages/supervision/config/supervision-detail.registry.js`

Estado actual:

- solo registra `incidents-list`

Uso en esta fase:

- validar que el `detailSlot` configurado sea aceptado

No monta todavía:

- componentes de detalle reales

## Criterio de mantenimiento

Si cambia alguno de estos elementos:

- `label`
- `indicatorColor`
- `order`
- `enabled`

el sidebar debe cambiar sin tocar `src/pages/supervision/supervision.js`.

## Siguiente fase prevista

La siguiente fase deberá conectar:

- fecha inicial del `queryPanel`
- fetch inicial por fecha
- recarga al cambiar la fecha
- distribución de incidencias por `dataSourceKey`
- runtime real de `pendingCount`

