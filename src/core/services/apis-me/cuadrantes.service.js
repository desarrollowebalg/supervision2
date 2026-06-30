import { apisMeGet } from './client.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import {
  buildMissingUserSyncResult,
  getSessionCatalogContext
} from './session-catalog-context.service.js';

const CUADRANTES_CACHE_TTL_MS = 30 * 60 * 1000;
const CUADRANTES_CATALOG_KEY = 'cuadrantes';

function extractList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.body)) {
    return payload.body;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.cuadrantes)) {
    return payload.cuadrantes;
  }

  return [];
}

async function fetchCuadrantesList() {
  const response = await apisMeGet('cuadrantes/listar/');
  return extractList(response?.data);
}

export async function getClientCuadrantes() {
  const { contextKey, hasStableIdentity } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: CUADRANTES_CATALOG_KEY,
      contextKey
    });
    return Array.isArray(cached?.data) ? cached.data : [];
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: CUADRANTES_CATALOG_KEY,
    contextKey,
    ttlMs: CUADRANTES_CACHE_TTL_MS,
    fetcher: async () => fetchCuadrantesList()
  });

  return Array.isArray(result?.data) ? result.data : [];
}

export async function syncClientCuadrantes() {
  const { contextKey, hasStableIdentity, userId } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: CUADRANTES_CATALOG_KEY,
      contextKey
    });
    console.info('[cuadrantes] sync skipped (missing user.id)');
    return buildMissingUserSyncResult(cached?.data);
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: CUADRANTES_CATALOG_KEY,
    contextKey,
    ttlMs: CUADRANTES_CACHE_TTL_MS,
    forceRefresh: true,
    fetcher: async () => fetchCuadrantesList()
  });

  console.info(`[cuadrantes] sync executed (user.id=${userId})`);
  return {
    skipped: false,
    reason: null,
    data: Array.isArray(result?.data) ? result.data : []
  };
}
