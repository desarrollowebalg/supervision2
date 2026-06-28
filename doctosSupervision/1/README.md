# Configuración del sidebar de supervisión - Cliente 1

Fecha de referencia: 2026-06-28

## Archivo principal

- `doctosSupervision/1/supervision-sidebar.json`

Este archivo define la estructura del panel izquierdo de `supervision` para el cliente `1`.

No contiene runtime vivo.

No contiene:

- pendientes reales
- incidencias reales
- fecha seleccionada actual
- estado de carga
- errores de consulta

## Estructura general

```json
{
  "workspaceId": "1",
  "schemaVersion": 1,
  "accordion": {},
  "queryPanel": {},
  "panels": []
}
```

## Descripción campo por campo

### `workspaceId`

- tipo: `string`
- propósito: identifica la carpeta/cliente dueño de la configuración
- valor actual: `"1"`

### `schemaVersion`

- tipo: `number`
- propósito: versiona el contrato del archivo
- valor actual: `1`

### `accordion`

Bloque de configuración global del acordeón.

#### `accordion.multipleOpen`

- tipo: `boolean`
- propósito: indica si UIkit permite abrir varios paneles al mismo tiempo
- valor actual: `true`

### `queryPanel`

Bloque del primer panel del acordeón.

Representa el panel visual llamado "Herramientas".

#### `queryPanel.id`

- tipo: `string`
- propósito: clave técnica estable del panel superior
- valor actual: `"query"`

#### `queryPanel.enabled`

- tipo: `boolean`
- propósito: permite mostrar u ocultar el panel superior
- valor actual: `true`

#### `queryPanel.label`

- tipo: `string`
- propósito: texto visible del título del panel
- valor actual: `"Herramientas"`

#### `queryPanel.icon`

- tipo: `string`
- propósito: nombre del icono UIkit usado en el título
- valor actual: `"calendar"`

#### `queryPanel.accordion.initialOpen`

- tipo: `boolean`
- propósito: define si el panel aparece abierto al cargar
- valor actual: `true`

#### `queryPanel.controls`

Bloque de controles del panel de consulta.

#### `queryPanel.controls.date.enabled`

- tipo: `boolean`
- propósito: habilita el control de fecha
- valor actual: `true`

#### `queryPanel.controls.date.required`

- tipo: `boolean`
- propósito: marca el input de fecha como obligatorio
- valor actual: `true`

#### `queryPanel.controls.date.defaultStrategy`

- tipo: `string`
- propósito: declara cómo se resolverá la fecha inicial
- valor actual: `"today"`

Nota:

- en esta fase el valor solo se documenta y se normaliza
- la resolución operativa real se conecta en la siguiente fase

#### `queryPanel.behavior.fetchOnInitialLoad`

- tipo: `boolean`
- propósito: declara que la fecha inicial deberá disparar consulta al cargar la vista
- valor actual: `true`

#### `queryPanel.behavior.fetchOnChange`

- tipo: `boolean`
- propósito: declara que cambiar la fecha deberá disparar nueva consulta
- valor actual: `true`

#### `queryPanel.summary.helperText`

- tipo: `string`
- propósito: texto guía que se muestra debajo del control
- valor actual: `"Selecciona una fecha para ver la semana correspondiente."`

### `panels`

Arreglo de niveles configurables del sidebar.

Cada entrada representa un `li` del acordeón bajo el panel "Herramientas".

## Campos de cada panel

### `id`

- tipo: `string`
- propósito: clave técnica estable
- uso: sirve para identificar el panel y mapear IDs de DOM compatibles

### `label`

- tipo: `string`
- propósito: nombre principal visible del panel

### `indicatorTone`

- tipo: `string`
- propósito: semántica del color
- uso actual: informativo y de contrato

### `indicatorColor`

- tipo: `string`
- propósito: color final del indicador circular visible

### `order`

- tipo: `number`
- propósito: orden visual del panel

### `enabled`

- tipo: `boolean`
- propósito: mostrar u ocultar el panel

### `initialOpen`

- tipo: `boolean`
- propósito: indicar si inicia abierto

### `detailSlot`

- tipo: `string`
- propósito: clave lógica del tipo de detalle que colgará del panel
- valor actual usado: `"incidents-list"`

### `dataSourceKey`

- tipo: `string`
- propósito: clave lógica del origen de datos futuro
- uso previsto: repartir incidencias por nivel

### `meta.subtitle`

- tipo: `string`
- propósito: texto complementario del panel

### `meta.slaLabel`

- tipo: `string`
- propósito: etiqueta de SLA visible en el texto compuesto del panel

## Mapeo actual de niveles

### Nivel 4

- `id: "critical"`
- `label: "Nivel 4: Crítico"`
- `indicatorColor: "#ff2d2d"`
- `dataSourceKey: "severity-4"`

### Nivel 3

- `id: "relevant"`
- `label: "Nivel 3: Relevante"`
- `indicatorColor: "#ff7a00"`
- `dataSourceKey: "severity-3"`

### Nivel 2

- `id: "important"`
- `label: "Nivel 2: Importante"`
- `indicatorColor: "#ffe600"`
- `dataSourceKey: "severity-2"`

### Nivel 1

- `id: "operational"`
- `label: "Nivel 1: Operativo"`
- `indicatorColor: "#2bdc00"`
- `dataSourceKey: "severity-1"`

### Nivel 0

- `id: "informative"`
- `label: "Nivel 0: Informativo"`
- `indicatorColor: "#f1f1f1"`
- `dataSourceKey: "severity-0"`

## Fases por donde pasa este archivo

### 1. Lectura física

Lo consume:

- `src/pages/supervision/services/supervision-sidebar-config.service.js`

Responsabilidad:

- leer el archivo desde `/doctosSupervision/1/supervision-sidebar.json`

### 2. Normalización

Lo consume:

- `src/pages/supervision/services/supervision-sidebar-config.normalizer.js`

Responsabilidad:

- completar campos faltantes
- asegurar defaults
- eliminar duplicados por `id`
- ordenar `panels`

### 3. Composición del sidebar

Lo consume:

- `src/components/supervision-sidebar/supervision-sidebar.js`

Responsabilidad:

- convertir el objeto ya normalizado en el acordeón UIkit

### 4. Pintado del panel de consulta

Lo consume:

- `src/components/supervision-sidebar/supervision-query-panel.js`

Responsabilidad:

- pintar el bloque "Herramientas"
- renderizar el `datePickerMapHot`

### 5. Pintado de paneles de nivel

Lo consume:

- `src/components/supervision-sidebar/supervision-accordion-item.js`

Responsabilidad:

- pintar cada nivel
- aplicar `indicatorColor`
- dejar badge `Pendientes: 0`

### 6. Integración final en la página

Lo consume:

- `src/pages/supervision/supervision.js`

Responsabilidad:

- insertar el sidebar en el panel izquierdo del layout de supervisión

## Regla de mantenimiento

Si el cambio buscado es solo:

- color
- orden
- nombre visible
- visibilidad

la modificación debe hacerse primero en este archivo, no en `supervision.js`.

