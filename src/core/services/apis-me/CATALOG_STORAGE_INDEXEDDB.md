# Catalog Storage with IndexedDB (Dexie)

## ES - Objetivo
Estandarizar el almacenamiento local de catalogos (ejemplo: `formularios`) usando IndexedDB mediante un servicio centralizado.

Implementacion actual:
- Servicio base: `src/core/services/catalog-indexeddb.service.js`
- Integracion de formularios: `src/core/services/apis-me/forms.service.js`

## EN - Objective
Standardize local catalog storage (example: `formularios`) using IndexedDB through a centralized service.

Current implementation:
- Base service: `src/core/services/catalog-indexeddb.service.js`
- Forms integration: `src/core/services/apis-me/forms.service.js`

## ES - Base de datos y tablas
- DB name: `appLiteSup`
- Tabla `catalogs`:
  - `id`, `catalogKey`, `contextKey`, `data`, `version`, `updatedAt`, `expiresAt`
- Tabla `syncMeta`:
  - `id`, `catalogKey`, `contextKey`, `lastSyncAt`, `etag`, `hash`

`id` recomendado:
- `${catalogKey}:${contextKey}`

## EN - Database and tables
- DB name: `appLiteSup`
- `catalogs` table:
  - `id`, `catalogKey`, `contextKey`, `data`, `version`, `updatedAt`, `expiresAt`
- `syncMeta` table:
  - `id`, `catalogKey`, `contextKey`, `lastSyncAt`, `etag`, `hash`

Recommended `id`:
- `${catalogKey}:${contextKey}`

## ES - Flujo de consulta (cache-first)
1. Resolver `contextKey` del usuario actual.
2. Si no existe `user.id` estable, leer solo cache local y no llamar API.
3. Si existe `user.id`, consultar cache local con `getOrSyncCatalog`.
4. Si hay cache vigente (`expiresAt > now`), regresar datos locales.
5. Si no hay cache o expiro, llamar API (`fetcher`), guardar y regresar datos de red.
6. Si API falla y existe cache previa, regresar `stale-cache`.

Funcion usada en formularios:
- `getAssignedForms()`

## EN - Read flow (cache-first)
1. Resolve `contextKey` from current user.
2. If there is no stable `user.id`, read only local cache and skip API calls.
3. If a stable `user.id` exists, read local cache with `getOrSyncCatalog`.
4. If cache is fresh (`expiresAt > now`), return local data.
5. If cache is missing or expired, call API (`fetcher`), persist, and return network data.
6. If API fails and old cache exists, return `stale-cache`.

Function currently used in forms:
- `getAssignedForms()`

## ES - Flujo de actualizacion (sync)
1. Validar identidad estable (`user.id`).
2. Si falta `user.id`, omitir red y regresar resultado `skipped` con datos locales disponibles.
3. Si existe `user.id`, forzar sincronizacion manual con `forceRefresh: true`.
4. Ignorar vigencia actual de cache.
5. Consultar API.
6. Reescribir `catalogs` y `syncMeta` en transaccion.
7. Regresar datos actualizados.

Funcion usada en formularios:
- `syncAssignedForms()`

## EN - Update flow (sync)
1. Validate stable identity (`user.id`).
2. If `user.id` is missing, skip network and return a `skipped` result with available local data.
3. If `user.id` exists, force manual sync with `forceRefresh: true`.
4. Ignore current cache freshness.
5. Call API.
6. Rewrite `catalogs` and `syncMeta` in one transaction.
7. Return updated data.

Function currently used in forms:
- `syncAssignedForms()`

## ES - Contrato minimo de uso
Ejemplo base:

```js
const result = await catalogIndexedDbService.getOrSyncCatalog({
  catalogKey: 'formularios',
  contextKey,
  ttlMs: 30 * 60 * 1000,
  forceRefresh: false,
  fetcher: async () => {
    const response = await apisMeGet('forms/list/');
    return extractList(response);
  }
});
```

Respuesta:
- `result.data`: arreglo del catalogo
- `result.source`: `cache` | `network` | `stale-cache`
- `result.stale`: `true` o `false`

## EN - Minimum usage contract
Base example:

```js
const result = await catalogIndexedDbService.getOrSyncCatalog({
  catalogKey: 'formularios',
  contextKey,
  ttlMs: 30 * 60 * 1000,
  forceRefresh: false,
  fetcher: async () => {
    const response = await apisMeGet('forms/list/');
    return extractList(response);
  }
});
```

Response:
- `result.data`: catalog array
- `result.source`: `cache` | `network` | `stale-cache`
- `result.stale`: `true` or `false`

Resultados de sync cuando falta identidad estable:
- `skipped: true`
- `reason: 'missing_user_id'`
- `data` (o `payloads`/`payloadsTasks` segun catalogo): datos locales disponibles

Sync results when stable identity is missing:
- `skipped: true`
- `reason: 'missing_user_id'`
- `data` (or `payloads`/`payloadsTasks` depending on catalog): available local data

## ES - Politica de contexto de sesion
- Servicio comun de contexto: `src/core/services/apis-me/session-catalog-context.service.js`.
- Campos: `contextKey`, `hasStableIdentity`, `userId`, `userName`.
- `hasStableIdentity` (basado en `user.id`) es el gate obligatorio para sincronizacion remota.

## EN - Session context policy
- Shared context service: `src/core/services/apis-me/session-catalog-context.service.js`.
- Fields: `contextKey`, `hasStableIdentity`, `userId`, `userName`.
- `hasStableIdentity` (derived from `user.id`) is the mandatory gate for remote sync.

## ES - Higiene de cache anonima
- Antes de sincronizar catalogos con identidad estable, limpiar entradas `user_anon:*`.
- Servicio base: `catalog-indexeddb.service.js`, metodo `clearAnonCatalogEntries`.
- Catalogos sincronizados actualmente: `formularios`, `tareas`, `pdis`, `payloads`, `payloadsTasks`.

## EN - Anonymous cache hygiene
- Before syncing catalogs with stable identity, clear `user_anon:*` entries.
- Base service: `catalog-indexeddb.service.js`, method `clearAnonCatalogEntries`.
- Currently synced catalogs: `formularios`, `tareas`, `pdis`, `payloads`, `payloadsTasks`.

## ES - Reglas para nuevos catalogos
- Reutilizar `catalog-indexeddb.service.js`; no duplicar implementaciones por pagina.
- Definir `catalogKey` unico por catalogo.
- Definir `contextKey` para evitar mezcla de datos entre usuarios/clientes.
- No sincronizar contra red con `user.id` ausente; permitir solo lectura local.
- Centralizar `fetcher` en servicio de capa `src/core/services/apis-me/`.
- Evitar acceso directo a IndexedDB desde componentes o vistas.

## EN - Rules for new catalogs
- Reuse `catalog-indexeddb.service.js`; do not duplicate storage logic per page.
- Define a unique `catalogKey` per catalog.
- Define a `contextKey` to avoid cross-user/client data mixing.
- Do not sync to network when `user.id` is missing; allow local reads only.
- Centralize `fetcher` in `src/core/services/apis-me/` service layer.
- Avoid direct IndexedDB access from components or views.
