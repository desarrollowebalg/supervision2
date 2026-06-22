## Refresco automático post-sincronización de catálogos

### Resumen
- Implementar un mecanismo central para avisar que `Descargar datos` terminó y qué catálogos cambiaron.
- Refrescar automáticamente solo vistas seguras de listado: `#/tareas`, `#/formularios`, `#/puntos-interes` y `#/inicio`.
- En vistas de detalle con trabajo en curso, no recargar automáticamente; mostrar aviso con opción explícita para recargar.

### Cambios de implementación
- Crear un servicio Singleton de notificación de sync en `D:\www\esqueleto\src\core\services\` con interfaz mínima:
  - `subscribe(callback)`
  - `notifySyncCompleted(payload)`
  - `isSafeListRoute(path)` o equivalente interno
- Ajustar `D:\www\esqueleto\src\core\services\apis-me\catalog-sync.service.js` o el handler de `sidebar-manual-sync-click` para emitir un evento al terminar `syncAllCatalogs`, incluyendo:
  - catálogo(s) afectados
  - fecha/hora de sync
  - ruta activa al momento del aviso
- Hacer que las páginas de listado se suscriban y se recarguen solo si están activas y el sync afecta su catálogo:
  - `Tareas` → `loadTasks(container, { localOnly: true })`
  - `Formularios` → `loadForms(container)`
  - `PuntosInteres` → `loadPdis(container)`
  - `Inicio` → re-render o refresh dirigido de widgets/listados dependientes
- Añadir `destroy()` en estas páginas para limpiar suscripciones; hoy el router ya intenta llamar `destroy()`, pero estas vistas no lo implementan.
- En detalles como `D:\www\esqueleto\src\pages\tareas\TareaDetalle.js` y `D:\www\esqueleto\src\pages\formularios\form-evidencia.js`, suscribirse solo para mostrar un aviso tipo UIkit:
  - mensaje: hay datos nuevos disponibles
  - acción: botón/enlace “Recargar vista”
  - sin recarga automática para no perder contexto o captura activa

### Interfaces y comportamiento
- Payload sugerido del evento de sync:
  - `catalogs: string[]`
  - `source: 'manual-sync' | 'post-login' | 'other'`
  - `completedAt: string`
- Regla de refresco:
  - si la ruta activa es un listado seguro y depende de alguno de los catálogos sincronizados, refrescar en segundo plano
  - si la ruta activa es detalle, solo avisar
- No forzar navegación, no hacer `F5`, y no reusar `hashchange` como mecanismo de actualización.

### Pruebas y validación
- En `#/tareas`: abrir la vista, ejecutar `Descargar datos`, confirmar que cambia el listado sin salir y volver.
- En `#/formularios` y `#/puntos-interes`: mismo caso, confirmando refresh automático del listado.
- En `#/inicio`: confirmar actualización de widgets dependientes de formularios/tareas si aplican.
- En `#/formularios/:indicator` y `#/tareas/:taskId`: ejecutar sync y validar que aparece aviso de datos nuevos sin perder estado actual.
- Validación mínima técnica: `npm run build` si el cambio queda dentro de `src/`.

### Supuestos
- V1 queda limitada a refresco de listados seguros; no intenta rehidratar formularios activos ni detalles complejos.
- El botón `Descargar datos` sigue usando el flujo actual de `syncAllCatalogs`; solo se agrega la capa de notificación/reactividad.
- Se prioriza recarga desde cache local recién sincronizada, no una segunda llamada remota por vista.
