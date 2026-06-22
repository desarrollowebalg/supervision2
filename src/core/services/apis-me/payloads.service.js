import { apisMeGet } from './client.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import { getStoredMaxDays } from './usuarios.service.js';
import {
  buildMissingUserSyncResult,
  getSessionCatalogContext
} from './session-catalog-context.service.js';

const PAYLOADS_CACHE_TTL_MS = 30 * 60 * 1000;
const PAYLOADS_CATALOG_KEY = 'payloads';
const PAYLOADS_TASKS_CATALOG_KEY = 'payloadsTasks';

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

  if (Array.isArray(payload?.payloads)) {
    return payload.payloads;
  }

  return [];
}

function isSuccessfulResponse(response) {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if (response.success === true) {
    return true;
  }

  return Number(response.status) === 200;
}

async function requestCatalogList(paths = []) {
  let lastError = null;

  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    const response = await apisMeGet(path);
    if (isSuccessfulResponse(response)) {
      return extractList(response?.data);
    }

    lastError = new Error(response?.message || `No fue posible sincronizar ${path}`);
  }

  throw lastError || new Error('No fue posible sincronizar catalogo');
}

function normalizeQuestionId(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

async function fetchPayloadsList() {
  return requestCatalogList([
    'payloads/list/',
    'payloads/getPayloads/'
  ]);
}

async function fetchPayloadsTasksByMaxDays(maxdays) {
  const safeMaxDays = Number(maxdays) > 0 ? Number(maxdays) : getStoredMaxDays();
  const normalizedMaxDays = Math.trunc(safeMaxDays);

  return requestCatalogList([
    `payloads/tasks/${normalizedMaxDays}/`,
    `payloads/payloadsTasks/${normalizedMaxDays}/`
  ]);
}

export async function syncPayloadsCatalogs({ maxdays } = {}) {
  const { contextKey, hasStableIdentity, userId } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const [payloadsCached, payloadsTasksCached] = await Promise.all([
      catalogIndexedDbService.getCatalog({
        catalogKey: PAYLOADS_CATALOG_KEY,
        contextKey
      }),
      catalogIndexedDbService.getCatalog({
        catalogKey: PAYLOADS_TASKS_CATALOG_KEY,
        contextKey
      })
    ]);

    console.info('[payloads] sync skipped (missing user.id)');
    return {
      ...buildMissingUserSyncResult(),
      payloads: Array.isArray(payloadsCached?.data) ? payloadsCached.data : [],
      payloadsTasks: Array.isArray(payloadsTasksCached?.data) ? payloadsTasksCached.data : []
    };
  }

  const effectiveMaxDays = Number(maxdays) > 0 ? Number(maxdays) : getStoredMaxDays();

  const [payloadsResult, payloadsTasksResult] = await Promise.all([
    catalogIndexedDbService.getOrSyncCatalog({
      catalogKey: PAYLOADS_CATALOG_KEY,
      contextKey,
      ttlMs: PAYLOADS_CACHE_TTL_MS,
      forceRefresh: true,
      fetcher: async () => fetchPayloadsList()
    }),
    catalogIndexedDbService.getOrSyncCatalog({
      catalogKey: PAYLOADS_TASKS_CATALOG_KEY,
      contextKey,
      ttlMs: PAYLOADS_CACHE_TTL_MS,
      forceRefresh: true,
      fetcher: async () => fetchPayloadsTasksByMaxDays(effectiveMaxDays)
    })
  ]);

  console.info(`[payloads] sync executed (user.id=${userId})`);
  return {
    skipped: false,
    reason: null,
    payloads: Array.isArray(payloadsResult?.data) ? payloadsResult.data : [],
    payloadsTasks: Array.isArray(payloadsTasksResult?.data) ? payloadsTasksResult.data : []
  };
}

export async function getPayloadsCatalogFromLocal() {
  const { contextKey } = getSessionCatalogContext();
  const cached = await catalogIndexedDbService.getCatalog({
    catalogKey: PAYLOADS_CATALOG_KEY,
    contextKey
  });

  return Array.isArray(cached?.data) ? cached.data : [];
}

export async function getPayloadsByFormQuestionId(questionId) {
  const normalizedQuestionId = normalizeQuestionId(questionId);
  if (!normalizedQuestionId) {
    return [];
  }

  const list = await getPayloadsCatalogFromLocal();
  return list.filter((item) => normalizeQuestionId(item?.ID_CUESTIONARIO) === normalizedQuestionId);
}
