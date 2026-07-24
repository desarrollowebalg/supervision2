import { apisMeGet } from './client.js';
import { storageService } from '../storage.service.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import {
  buildMissingUserSyncResult,
  getSessionCatalogContext
} from './session-catalog-context.service.js';

const MAX_DAYS_SESSION_KEY = 'maxdays';
const CONF_FORMS_SESSION_KEY = 'confForms';
const DEFAULT_MAX_DAYS = 7;
const USERS_CACHE_TTL_MS = 30 * 60 * 1000;
const USERS_CATALOG_KEY = 'usuarios';

function normalizeMaxDaysValue(payload) {
  if (Array.isArray(payload) && payload.length) {
    return normalizeMaxDaysValue(payload[0]);
  }

  if (payload && typeof payload === 'object') {
    const raw =
      payload.DIAS_MAX_DESCARGA ??
      payload.dias_max_descarga ??
      payload.maxdays ??
      payload.MAXDAYS;

    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.trunc(parsed);
    }
  }

  return DEFAULT_MAX_DAYS;
}

export async function fetchAndStoreMaxDays() {
  const response = await apisMeGet('usuarios/maxdays/');
  const data = Array.isArray(response?.data) ? response.data : [];
  const maxdays = normalizeMaxDaysValue(data);
  storageService.setSessionItem(MAX_DAYS_SESSION_KEY, maxdays);
  return maxdays;
}

export function getStoredMaxDays() {
  const stored = storageService.getSessionItem(MAX_DAYS_SESSION_KEY);
  const parsed = Number(stored);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.trunc(parsed);
  }
  return DEFAULT_MAX_DAYS;
}

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

  if (Array.isArray(payload?.users)) {
    return payload.users;
  }

  return [];
}

async function fetchUsersList() {
  const response = await apisMeGet('usuarios/listar/');
  return extractList(response?.data);
}

function findFormsConfig(payload) {
  const rows = extractList(payload);
  return rows.find((row) => String(row?.NOMBRE_CONF || '').toUpperCase() === 'FORMULARIOS') || null;
}

export async function fetchAndStoreFormsConfig() {
  const response = await apisMeGet('usuarios/conf/');
  const confForms = findFormsConfig(response?.data);

  if (confForms) {
    storageService.setSessionItem(CONF_FORMS_SESSION_KEY, confForms);
    return confForms;
  }

  storageService.removeSessionItem(CONF_FORMS_SESSION_KEY);
  return null;
}

export async function syncClientUsers() {
  const { contextKey, hasStableIdentity, userId } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: USERS_CATALOG_KEY,
      contextKey
    });
    console.info('[usuarios] sync skipped (missing user.id)');
    return buildMissingUserSyncResult(cached?.data);
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: USERS_CATALOG_KEY,
    contextKey,
    ttlMs: USERS_CACHE_TTL_MS,
    forceRefresh: true,
    fetcher: async () => fetchUsersList()
  });

  console.info(`[usuarios] sync executed (user.id=${userId})`);
  return {
    skipped: false,
    reason: null,
    data: Array.isArray(result?.data) ? result.data : []
  };
}
