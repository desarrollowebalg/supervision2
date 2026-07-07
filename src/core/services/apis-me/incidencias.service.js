import { apisMeGet } from './client.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import {
  buildMissingUserSyncResult,
  getSessionCatalogContext
} from './session-catalog-context.service.js';

const INCIDENCIAS_CATALOG_KEY = 'resumensup';
const INCIDENCIAS_CACHE_TTL_MS = 2 * 60 * 1000;
const INCIDENCIAS_HISTORICAL_CACHE_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

function extractBodyRows(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((entry) => {
    if (Array.isArray(entry?.body)) {
      return entry.body;
    }

    return [];
  });
}

export function normalizeIncidenciasList(response) {
  return extractBodyRows(response?.data).map((row) => ({
    FECHA: row?.FECHA || '',
    NIVEL: Number(row?.NIVEL ?? 0),
    TOTAL: Number(row?.TOTAL ?? 0),
    LEIDOS: Number(row?.LEIDOS ?? 0),
    USUARIO: row?.USUARIO || '',
    NO_LEIDOS: Number(row?.NO_LEIDOS ?? 0),
    ID_USUARIO: Number(row?.ID_USUARIO ?? 0)
  }));
}

function buildIncidenciasContextKey(baseContextKey, date) {
  return `${baseContextKey}:fecha_${date}`;
}

function getTodayDateValue() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function isHistoricalDate(date) {
  return String(date || '') < getTodayDateValue();
}

export async function fetchIncidenciasByDate(date) {
  const safeDate = String(date || '').trim();
  if (!safeDate) {
    return [];
  }

  const response = await apisMeGet(`incidencias/listar/${encodeURIComponent(safeDate)}/`);
  return normalizeIncidenciasList(response);
}

export async function getIncidenciasByDate(date, { forceRefresh = false } = {}) {
  const safeDate = String(date || '').trim();
  if (!safeDate) {
    return {
      data: [],
      source: 'empty',
      stale: false
    };
  }

  const { contextKey, hasStableIdentity } = getSessionCatalogContext();
  const catalogContextKey = buildIncidenciasContextKey(contextKey, safeDate);
  const isHistorical = isHistoricalDate(safeDate);

  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: INCIDENCIAS_CATALOG_KEY,
      contextKey: catalogContextKey
    });

    return {
      ...buildMissingUserSyncResult(cached?.data),
      source: cached ? 'cache' : 'empty',
      stale: Boolean(cached) && Number(cached.expiresAt || 0) <= Date.now()
    };
  }

  if (isHistorical && !forceRefresh) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: INCIDENCIAS_CATALOG_KEY,
      contextKey: catalogContextKey
    });

    if (cached) {
      return {
        data: Array.isArray(cached.data) ? cached.data : [],
        source: 'cache',
        stale: false
      };
    }
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: INCIDENCIAS_CATALOG_KEY,
    contextKey: catalogContextKey,
    ttlMs: isHistorical ? INCIDENCIAS_HISTORICAL_CACHE_TTL_MS : INCIDENCIAS_CACHE_TTL_MS,
    forceRefresh,
    fetcher: async () => fetchIncidenciasByDate(safeDate)
  });

  return {
    ...result,
    data: Array.isArray(result?.data) ? result.data : []
  };
}
