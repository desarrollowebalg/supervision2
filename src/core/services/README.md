# Servicios Core

`src/core/services/` concentra servicios reutilizables del frontend.

Regla vigente:

- cualquier acceso reutilizable a APIs del navegador debe centralizarse aquí
- la implementación debe favorecer patrón Singleton
- la capa de vista consume servicios; no duplica listeners o chequeos transversales por archivo

## Mapa real de servicios

### Infraestructura base

- `api.js`
  - cliente HTTP compartido
  - envío con credenciales y normalización de respuestas/error

- `authService.js`
  - `validarUsername`
  - `login`
  - `logoutApp`
  - `getUser`

- `storage.service.js`
  - acceso central a `localStorage` y `sessionStorage`

- `session-expiration.service.js`
  - flujo central de sesión expirada
  - evita loops y limpia estado sensible

- `theme.service.js`
  - preferencia de tema
  - sincronización light/dark

- `connectivity.service.js`
  - estado online/offline y suscripción centralizada

- `geolocation.service.js`
  - acceso reusable a geolocalización

### Persistencia local

- `catalog-indexeddb.service.js`
  - base oficial de catálogos con IndexedDB + Dexie

- `evidence-indexeddb.service.js`
  - almacenamiento local relacionado con evidencias

### Servicios frontend de soporte funcional

- `photo-upload.service.js`
  - subida inmediata de evidencias visuales

- `form-themes.service.js`
  - lectura de `/config/form-themes.json`

- `supervision-date-range.service.js`
  - resolución de rangos/fechas para supervisión

## Servicios `apis-me`

Subdirectorio:

- `src/core/services/apis-me/`

Aquí vive la integración modular con backend y catálogos del dominio.

Archivos actuales:

- `client.js`
- `catalog-sync.service.js`
- `session-catalog-context.service.js`
- `payloads.service.js`
- `forms.service.js`
- `form-engine.service.js`
- `evidences.service.js`
- `tareas.service.js`
- `task-active.service.js`
- `task-completed.service.js`
- `task-status-state.service.js`
- `pdis.service.js`
- `cuadrantes.service.js`
- `incidencias.service.js`
- `usuarios.service.js`
- `entidad.service.js`

## Reglas operativas importantes

### Catálogos

- el almacenamiento local oficial es IndexedDB con Dexie
- lectura preferente: cache-first
- actualización remota: `forceRefresh` cuando aplique
- si no existe `user.id`, no se debe sincronizar por red

Referencia:

- `src/core/services/apis-me/CATALOG_STORAGE_INDEXEDDB.md`

### APIs del navegador

Antes de usar directamente:

- `navigator.onLine`
- `localStorage`
- `sessionStorage`
- geolocalización
- permisos

validar si ya existe servicio compartido. Si no existe y el comportamiento es reutilizable, crearlo aquí primero.

### Formularios

- el acceso al schema debe pasar por servicios y renderer modular
- las evidencias visuales se suben primero y luego su referencia S3 viaja en `save-text`

### Sesión

- la sesión real la valida PHP
- `getUser()` es la referencia para guardas y verificación de autenticación

## Cuándo crear un servicio nuevo

Crea un servicio en `src/core/services/` o `src/core/services/apis-me/` cuando:

- la lógica se reutiliza en más de una vista
- encapsula una API del navegador o un endpoint del backend
- requiere persistencia local compartida
- evita listeners/chequeos duplicados

No lo crees cuando:

- la lógica es estrictamente visual y local a una sola página
- no existe potencial real de reutilización
