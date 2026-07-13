# Respaldo de Ajustes en Supervision

Fecha: 2026-07-10
Agente responsable: `documentation-agent`

## Objetivo general

Se trabajó sobre la vista de supervisión para mejorar:

- layout y distribución vertical de la página
- comportamiento de scroll entre contenedor principal, sidebar y panel derecho
- visualización y filtrado de estadísticas tipo tabs
- color descriptivo por estatus en la tabla
- filtrado del detalle por nivel `NVL`
- navegación hacia detalle de incidencia y regreso por historial

## Archivos principales tocados

- `src/pages/supervision/supervision.js`
- `src/components/supervision-detail/supervision-detail-panel.js`
- `src/core/services/apis-me/incidencias.service.js`
- `src/pages/supervision/DetalleIncidencia.js`

## Resumen por bloque

### 1. Ajuste de layout de supervision

Se ajustó `.supervision2-page` para subir visualmente el contenido sin modificar el contenedor padre de `inicio`.

También se redefinió la altura útil de la vista para que:

- el sidebar izquierdo no crezca con el contenido derecho
- el panel derecho tenga su propio scroll
- la página use mejor el viewport disponible

### 2. Corrección de doble scroll

Se bloqueó el `scroll` principal de `.inicio-main-content` únicamente mientras la vista de supervisión está activa.

Con esto:

- desaparece la doble barra de scroll en desktop
- el scroll se concentra en los paneles internos
- en mobile se respeta el flujo vertical normal

### 3. Hover de tabla compatible con tema

Se reemplazó el hover claro heredado de UIkit por un hover basado en tokens del tema.

Resultado:

- funciona mejor en `light`
- funciona mejor en `dark`
- no depende del amarillo claro por defecto

### 4. Estadística tipo tabs

La estadística superior del panel derecho se transformó visualmente en tabs discretos, sin ser tabs funcionales de UIkit.

Colores usados:

- `Todas`: azul
- `No leída` y `No leída *`: naranja
- `Leída`: gris
- `Atendida`: verde azulado
- `Aprobada`: verde
- `Cerrada`: gris azulado
- `Rechazada`: rojo
- `Reasignada`: morado

### 5. Filtro por clic en tabs de estadística

Se conectó el clic de cada tab con el filtrado real de la tabla.

Comportamiento:

- por defecto queda activa `Todas`
- al dar clic en un estatus, la tabla muestra solo registros de ese estatus
- `Limpiar filtros` regresa el filtro de estatus a `Todas`

### 6. Color descriptivo en badge de estado dentro de la tabla

Se aplicó la misma paleta de colores al badge de `Estado` en cada fila de la tabla.

Esto hace que la tabla sea más descriptiva visualmente y consistente con la estadística superior.

### 7. Filtro del detalle por nivel `NVL`

Se detectó que el detalle del endpoint:

- `/apis_me/incidencias/detalle/<fechaInicio>/<fechaFin>/<usuario>/`

devuelve registros mezclados por nivel y que la separación correcta debe hacerse con la llave `NVL`.

Se implementó el siguiente comportamiento:

- al dar clic en un usuario desde un panel del sidebar, se toma el `panelId` como nivel seleccionado
- el servicio de detalle filtra solo los registros cuyo `NVL` coincide con ese nivel
- la estadística del panel derecho se recompone únicamente con esos registros filtrados

### 8. Catálogo derivado por nivel

Además del detalle base por usuario/semana, ahora se genera un catálogo derivado por nivel.

Estrategia:

- se conserva el catálogo base del detalle completo
- desde ese detalle se genera un catálogo derivado filtrado por `NVL`
- el catálogo derivado usa la misma vigencia del detalle base

Reglas:

- si la fecha consultada es hoy, la vigencia es de 5 minutos
- si la consulta es histórica, se trata como caché fría

### 9. Navegación a detalle de incidencia

Se detectó que el acceso a `Ver detalle` se había roto porque el botón quedó convertido en un enlace incorrecto con `href` directo al `IDE`, en lugar de usar la ruta del router.

Se corrigió para que vuelva a navegar por:

- `/detalle-incidencia/:ide`

Además:

- la navegación ya vuelve a registrar la URL en el historial
- se manda `state` con la ruta de origen
- la vista `DetalleIncidencia` ahora incluye botón de regreso
- el regreso usa `window.history.back()` cuando hay historial
- si no hay historial, hace fallback a `/supervision` o a la ruta origen guardada

## Estado actual

La vista de supervisión quedó funcional en estos puntos:

- layout más compacto
- scroll controlado por panel
- tabs de estadística con filtro real
- badges de estado con color
- detalle filtrado por nivel `NVL`
- navegación al detalle con historial y regreso

## Validación realizada

Después de cada bloque importante se ejecutó:

- `npm run build`

Resultado:

- compilación correcta
- sin errores de build en los cambios aplicados

## Nota importante

La ruta `src/pages/supervision/DetalleIncidencia.js` sigue siendo una pantalla base o placeholder del flujo de detalle.

Es decir:

- la navegación ya funciona
- el historial ya funciona
- pero la vista final del detalle completo aún está pendiente de implementación funcional si se requiere mostrar información real de la incidencia
