# Configuración del sidebar de supervisión - Cliente 1

Fecha de referencia: 2026-07-02

## Archivo principal

- `doctosSupervision/1/supervision-sidebar.json`

Este archivo define la estructura declarativa del panel izquierdo de `supervision` para el cliente `1`.

No contiene runtime vivo.

No contiene:

- pendientes reales
- incidencias reales
- fecha seleccionada actual
- estado de carga
- errores de consulta

## Contexto actual de resolución

La página `supervision` ya no toma el cliente de forma fija.

Flujo actual:

1. leer `ci` desde `sessionStorage`
2. decodificar `ci` desde base64
3. usar el valor decodificado como `ID_CLIENTE`
4. intentar cargar `/doctosSupervision/<ID_CLIENTE>/supervision-sidebar.json`
5. si no existe el archivo, usar fallback reducido

Este README documenta el caso del cliente `1`, pero el mismo contrato aplica para cualquier carpeta:

- `doctosSupervision/<ID_CLIENTE>/supervision-sidebar.json`

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
- valor esperado en esta carpeta: `"1"`

### `schemaVersion`

- tipo: `number`
- propósito: versiona el contrato del archivo
- valor actual: `1`

### `accordion`

Bloque de configuración global del acordeón.

#### `accordion.multipleOpen`

- tipo: `boolean`
- propósito: indica si UIkit permite abrir varios paneles al mismo tiempo

### `queryPanel`

Bloque del primer panel del acordeón.

Representa el panel visual llamado `Herramientas`.

#### `queryPanel.id`

- tipo: `string`
- propósito: clave técnica estable del panel superior

#### `queryPanel.enabled`

- tipo: `boolean`
- propósito: permite mostrar u ocultar el panel superior

#### `queryPanel.label`

- tipo: `string`
- propósito: texto visible del título del panel

#### `queryPanel.icon`

- tipo: `string`
- propósito: nombre del icono UIkit usado en el título

#### `queryPanel.accordion.initialOpen`

- tipo: `boolean`
- propósito: define si el panel aparece abierto al cargar

#### `queryPanel.controls.date.enabled`

- tipo: `boolean`
- propósito: habilita el control de fecha

#### `queryPanel.controls.date.required`

- tipo: `boolean`
- propósito: marca el input de fecha como obligatorio

#### `queryPanel.controls.date.defaultStrategy`

- tipo: `string`
- propósito: declara cómo se resolverá la fecha inicial
- valor operativo actual esperado: `"today"`

#### `queryPanel.behavior.fetchOnInitialLoad`

- tipo: `boolean`
- propósito: indica si al cargar la vista debe ejecutarse el refresh inicial

#### `queryPanel.behavior.fetchOnChange`

- tipo: `boolean`
- propósito: indica si al cambiar la fecha debe recargarse el sidebar

#### `queryPanel.summary.helperText`

- tipo: `string`
- propósito: texto guía del panel de herramientas

### `panels`

Arreglo de niveles configurables del sidebar.

Cada entrada representa un `li` del acordeón debajo de `Herramientas`.

## Campos de cada panel

### `id`

- tipo: `string`
- propósito: clave técnica estable del panel

### `label`

- tipo: `string`
- propósito: nombre principal visible del panel

### `indicatorTone`

- tipo: `string`
- propósito: semántica del color
- uso actual: informativo y contractual

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
- propósito: clave lógica del tipo de detalle asociado
- valor actual admitido: `"incidents-list"`

### `dataSourceKey`

- tipo: `string`
- propósito: clave lógica del origen de datos por nivel

### `meta.subtitle`

- tipo: `string`
- propósito: texto complementario del panel

### `meta.slaLabel`

- tipo: `string`
- propósito: etiqueta de SLA visible en el texto compuesto del panel

## Mapeo actual del cliente 1

### Nivel 4

- `id: "4"`
- `label: "Nivel 4: Crítico"`
- `indicatorColor: "#ff2d2d"`
- `dataSourceKey: "severity-4"`

### Nivel 3

- `id: "3"`
- `label: "Nivel 3: Relevante"`
- `indicatorColor: "#ff7a00"`
- `dataSourceKey: "severity-3"`

### Nivel 2

- `id: "2"`
- `label: "Nivel 2: Importante"`
- `indicatorColor: "#ffe600"`
- `dataSourceKey: "severity-2"`

### Nivel 1

- `id: "1"`
- `label: "Nivel 1: Operativo"`
- `indicatorColor: "#2bdc00"`
- `dataSourceKey: "severity-1"`

### Nivel 0

- `id: "0"`
- `label: "Nivel 0: Informativo"`
- `indicatorColor: "#f1f1f1"`
- `dataSourceKey: "severity-0"`

## Qué pasa si el cliente no tiene archivo

Cuando no existe `/doctosSupervision/<ID_CLIENTE>/supervision-sidebar.json`, el sistema no rompe la página.

En su lugar:

- conserva el panel `Herramientas`
- usa un fallback reducido
- deja un único panel con `id: "0"`

Ese fallback se define en:

- `src/pages/supervision/config/supervision-sidebar.defaults.js`

## Fases por donde pasa este archivo

### 1. Resolución de cliente y lectura física

Lo consume:

- `src/pages/supervision/services/supervision-sidebar-config.service.js`

Responsabilidad:

- resolver `ID_CLIENTE` desde `sessionStorage.ci`
- construir la ruta `/doctosSupervision/<ID_CLIENTE>/supervision-sidebar.json`
- leer el archivo con `fetch`
- aplicar fallback si la lectura falla

### 2. Normalización

Lo consume:

- `src/pages/supervision/services/supervision-sidebar-config.normalizer.js`

Responsabilidad:

- completar campos faltantes
- asegurar defaults
- eliminar duplicados por `id`
- ordenar `panels`
- validar `detailSlot`

### 3. Composición visual

Lo consume:

- `src/components/supervision-sidebar/supervision-sidebar.js`

Responsabilidad:

- convertir el objeto normalizado en un acordeón UIkit

### 4. Runtime del sidebar

Lo consume:

- `src/components/supervision-sidebar/supervision-sidebar.controller.js`

Responsabilidad:

- reaccionar a la fecha
- refrescar datos
- pintar listas y contadores
- emitir selección de usuario

### 5. Integración en la página

Lo consume:

- `src/pages/supervision/supervision.js`

Responsabilidad:

- insertar el sidebar en el panel izquierdo
- coordinarlo con el panel derecho

## Regla de mantenimiento

Si el cambio buscado es solo:

- color
- orden
- nombre visible
- visibilidad

la modificación debe hacerse primero en este archivo, no en `supervision.js`.

Si el cambio es de comportamiento:

- refresh
- mensajes
- listeners
- carga de incidencias

la revisión debe ir primero a:

- `src/components/supervision-sidebar/supervision-sidebar.controller.js`
