import { apisMeGet } from './client.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import {
  buildMissingUserSyncResult,
  getSessionCatalogContext
} from './session-catalog-context.service.js';

const PDIS_CACHE_TTL_MS = 30 * 60 * 1000;
const PDIS_CATALOG_KEY = 'pdis';

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

  if (Array.isArray(payload?.pdis)) {
    return payload.pdis;
  }

  return [];
}

async function fetchPdisList() {
  const response = await apisMeGet('pdi_v3/listar/');
  return extractList(response?.data);
}

export async function getAssignedPdis() {
  const { contextKey, hasStableIdentity } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: PDIS_CATALOG_KEY,
      contextKey
    });
    return Array.isArray(cached?.data) ? cached.data : [];
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: PDIS_CATALOG_KEY,
    contextKey,
    ttlMs: PDIS_CACHE_TTL_MS,
    fetcher: async () => fetchPdisList()
  });

  return Array.isArray(result?.data) ? result.data : [];
}

export async function syncAssignedPdis() {
  const { contextKey, hasStableIdentity, userId } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: PDIS_CATALOG_KEY,
      contextKey
    });
    console.info('[pdis] sync skipped (missing user.id)');
    return buildMissingUserSyncResult(cached?.data);
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: PDIS_CATALOG_KEY,
    contextKey,
    ttlMs: PDIS_CACHE_TTL_MS,
    forceRefresh: true,
    fetcher: async () => fetchPdisList()
  });

  console.info(`[pdis] sync executed (user.id=${userId})`);
  return {
    skipped: false,
    reason: null,
    data: Array.isArray(result?.data) ? result.data : []
  };
}

export async function getAssignedPdisFromLocal() {
  const { contextKey } = getSessionCatalogContext();
  const cached = await catalogIndexedDbService.getCatalog({
    catalogKey: PDIS_CATALOG_KEY,
    contextKey
  });

  return Array.isArray(cached?.data) ? cached.data : [];
}
