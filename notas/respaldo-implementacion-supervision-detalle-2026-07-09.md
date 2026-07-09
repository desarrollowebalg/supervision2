# Respaldo de Implementación

Fecha: 2026-07-09  
Proyecto: `supervision2`  
Tema: Integración del detalle de incidencias en `supervision`

## Contexto

Se continuó la construcción del panel derecho del módulo `supervision` para que, al seleccionar un usuario desde el sidebar izquierdo, se consulte y renderice el detalle semanal de incidencias.

El flujo quedó dividido en dos partes:

1. Preparación y enriquecimiento de la respuesta del endpoint backend.
2. Consumo frontend con tabla, cache local y estadística visible.

## Endpoint involucrado

Ruta:

`/apis_me/incidencias/detalle/<fechaInicio>/<fechaFin>/<usuario>/`

### Comportamiento implementado en backend

El endpoint ahora procesa la respuesta externa y regresa una estructura simplificada y lista para frontend:

```json
{
  "status": 200,
  "success": true,
  "message": "OK",
  "data": {
    "estadistica": [],
    "incidencias": []
  }
}
```

### Transformaciones aplicadas por incidencia

Cada registro de `body` se enriquece con:

- `STT_DESC`
  - descripción legible del estatus a partir de `STT`
- `IDE`
  - valor obtenido desde `IDR`, tomando solo la parte previa a `|`
- `TURNO`
  - calculado desde `HORA`

### Reglas de estatus

Mapeo actual:

- `0` -> `L` -> `Leída`
- `1` -> `A` -> `Atendida`
- `2` -> `C` -> `Cerrada`
- `3` -> `AP` -> `Aprobada`
- `4` -> `R` -> `Rechazada`
- `5` -> `RE` -> `Reasignada`
- `-1` -> `NL_NVL` -> `No leída *`
- `null`, `undefined` o `""` -> `X` -> `Abierta`
- valor desconocido -> se conserva como código dinámico y se etiqueta como `Desconocido (<valor>)`

### Reglas de turno

- `T1`: 06:00:00 a 13:59:59
- `T2`: 14:00:00 a 21:59:59
- `T3`: 22:00:00 a 05:59:59

### Estadística

La respuesta de `estadistica` quedó como arreglo de objetos, no como objeto plano por llaves fijas.

Esto se decidió para:

- evitar acoplamiento rígido en frontend
- permitir nuevos estatus sin rehacer el contrato
- facilitar tabs, badges y filtros posteriores

## Frontend involucrado

### Archivos principales

- `src/core/services/apis-me/incidencias.service.js`
- `src/components/supervision-detail/supervision-detail-panel.js`
- `src/pages/supervision/supervision.js`
- `src/pages/inicio/main.js`
- `src/pages/supervision/DetalleIncidencia.js`

## Comportamiento implementado en frontend

### Selección de usuario

Cuando se da clic en un usuario desde el sidebar:

- se toma `fechaInicio` y `fechaFin` desde `sessionStorage`
- se usa el `userId` del elemento seleccionado
- se consulta el endpoint de detalle
- se muestra el resultado en el panel derecho

### Estructura visual del panel derecho

El panel conserva arriba:

- origen del clic
- tarjeta del usuario
- avatar
- fecha seleccionada

Debajo de eso se agregó:

- bloque de estadística
- aviso de cache cuando aplica
- tabla de incidencias

## Tabla de incidencias

Encabezados implementados:

- `Fecha`
- `Hora`
- `Punto de revisión`
- `Descripción`
- `Estado`
- `Turno`
- `Acciones`

### Reglas visuales

- `Fecha` se muestra en formato `dd/mm/aa`
- `Punto de revisión` usa `PDR`
- `Descripción` usa `OBS`
- `PDR` y `OBS` se recortan visualmente cuando el texto es largo
- `Estado` usa `STT_DESC`
- `Acciones` incluye:
  - botón para abrir la página `detalle-incidencia`
  - enlace PDF hacia:
    - `https://app.movilizandome.net/modules/rEvidencia/Reporte_pdf.php?id=<IDE>`

### Comportamientos implementados

- ordenamiento por columna, excepto `Acciones`
- buscador general
- buscador por columna
- selector de columnas visibles
- paginación de 30 en 30
- contador visible tipo:
  - `Registros: 1-30 / 59`

### Columna oculta por defecto

- `Punto de revisión` queda oculta al inicio
- puede mostrarse desde el selector de columnas

## Nueva página creada

Se agregó la ruta:

- `#/detalle-incidencia/:ide`

Archivo:

- `src/pages/supervision/DetalleIncidencia.js`

Estado actual:

- es una página placeholder
- al dar clic en `Ver detalle`:
  - muestra aviso
  - navega a esta nueva página

## Cache local del detalle

Se agregó cache local con IndexedDB usando el servicio base del proyecto.

### Regla de almacenamiento

El detalle se guarda en un catálogo con nombre:

- `detalle_<fecha>`

El `contextKey` considera:

- usuario autenticado
- `fechaInicio`
- `fechaFin`
- `usuario` seleccionado

### Reglas de vigencia

#### Si la consulta corresponde al día actual

- vigencia máxima: 5 minutos
- se muestra aviso informativo indicando que la información puede actualizarse
- no existe actualización automática

Mensaje acordado:

- primero se notifica
- no se refresca solo

#### Si la consulta corresponde a una semana anterior

- primero se consulta cache
- si existe cache, se reutiliza antes de llamar al API
- vigencia práctica de largo plazo para consulta histórica

## Ajuste al servicio de catálogos

Se amplió `catalog-indexeddb.service.js` para que no solo guarde arreglos, sino también payloads completos.

Esto fue necesario porque el detalle necesita persistir:

- `estadistica`
- `incidencias`

en un solo objeto.

## Ajuste visual de estadística

La estadística visible del panel derecho quedó con estas reglas:

- siempre aparece primero un elemento `Todas`
- `Todas` suma el total de incidencias
- después solo se muestran estatus con `total > 0`
- no se renderizan estatus con valor `0`

Ejemplo:

- si solo hay incidencias `Aprobada`
  - se muestra `Todas`
  - se muestra `Aprobada`
  - no se muestran los demás estados en cero

## Validación realizada

Para cambios en `src/` se ejecutó:

- `npm run build`

Resultado:

- compilación exitosa

Para cambios en PHP del endpoint se validó además:

- `php -l apis_me/incidencias/apiIncidencias.class.php`
- `php -l apis_me/incidencias/index.php`

Resultado:

- sin errores de sintaxis

## Estado actual

Quedó listo:

- endpoint enriquecido de detalle
- tabla funcional en `supervision`
- estadística visible
- navegación a página placeholder de incidencia
- cache local por fecha/semana/usuario
- aviso de vigencia para consultas del día actual

## Siguiente fase sugerida

Pendiente natural para continuar:

1. Convertir los bloques de estadística en filtros activos sobre la tabla.
2. Construir la página real `detalle-incidencia`.
3. Definir si el aviso de vigencia de 5 minutos debe ofrecer botón manual de refresco.

