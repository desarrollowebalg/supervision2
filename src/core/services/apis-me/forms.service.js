import { apisMeGet } from './client.js';
import { storageService } from '../storage.service.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import {
  buildMissingUserSyncResult,
  getSessionCatalogContext
} from './session-catalog-context.service.js';

const FORMS_CACHE_KEY = 'forms_list_cache_v1';
const FORMS_CACHE_TTL_MS = 30 * 60 * 1000;
const FORMS_CATALOG_KEY = 'formularios';

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

  if (Array.isArray(payload?.forms)) {
    return payload.forms;
  }

  return [];
}

export async function getAssignedForms() {
  const { contextKey, hasStableIdentity } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: FORMS_CATALOG_KEY,
      contextKey
    });
    return Array.isArray(cached?.data) ? cached.data : [];
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: FORMS_CATALOG_KEY,
    contextKey,
    ttlMs: FORMS_CACHE_TTL_MS,
    fetcher: async () => {
      const response = await apisMeGet('forms/list/');
      return extractList(response);
    }
  });

  return Array.isArray(result?.data) ? result.data : [];
}

export async function syncAssignedForms() {
  storageService.removeItem(FORMS_CACHE_KEY);
  const { contextKey, hasStableIdentity, userId } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: FORMS_CATALOG_KEY,
      contextKey
    });
    console.info('[forms] sync skipped (missing user.id)');
    return buildMissingUserSyncResult(cached?.data);
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: FORMS_CATALOG_KEY,
    contextKey,
    ttlMs: FORMS_CACHE_TTL_MS,
    forceRefresh: true,
    fetcher: async () => {
      const response = await apisMeGet('forms/list/');
      return extractList(response);
    }
  });

  console.info(`[forms] sync executed (user.id=${userId})`);
  return {
    skipped: false,
    reason: null,
    data: Array.isArray(result?.data) ? result.data : []
  };
}

export async function getCachedFormByIndicator(indicator) {
  const { contextKey } = getSessionCatalogContext();
  const cache = await catalogIndexedDbService.getCatalog({
    catalogKey: FORMS_CATALOG_KEY,
    contextKey
  });
  const list = Array.isArray(cache?.data) ? cache.data : [];
  return list.find((form) => String(form?.ITEM_NUMBER || '') === String(indicator || '')) || null;
}
