import { apisMeGet } from './client.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import {
  buildMissingUserSyncResult,
  getSessionCatalogContext
} from './session-catalog-context.service.js';

const INCIDENCIAS_CATALOG_KEY = 'resumensup';
const INCIDENCIAS_CACHE_TTL_MS = 2 * 60 * 1000;
const INCIDENCIAS_HISTORICAL_CACHE_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const INCIDENCIAS_DETALLE_CURRENT_TTL_MS = 30 * 60 * 1000;
const INCIDENCIAS_DETALLE_TODAY_TTL_MS = 5 * 60 * 1000;
const INCIDENCIAS_DETALLE_HISTORICAL_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

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

function normalizeStatisticEntry(entry) {
  return {
    code: String(entry?.code || '').trim(),
    label: String(entry?.label || '').trim(),
    total: Number(entry?.total ?? 0)
  };
}

function normalizeDetalleIncidencia(row) {
  return {
    ...row,
    FECHA: String(row?.FECHA || '').trim(),
    HORA: String(row?.HORA || '').trim(),
    PDR: String(row?.PDR || '').trim(),
    OBS: String(row?.OBS || '').trim(),
    STT: row?.STT ?? null,
    STT_DESC: String(row?.STT_DESC || '').trim(),
    TURNO: String(row?.TURNO || '').trim(),
    IDE: String(row?.IDE || '').trim(),
    IDR: String(row?.IDR || '').trim()
  };
}

function buildIncidenciasContextKey(baseContextKey, date) {
  return `${baseContextKey}:fecha_${date}`;
}

function buildDetalleCatalogKey(date) {
  return `detalle_${String(date || '').trim()}`;
}

function buildDetalleContextKey(baseContextKey, { fechaInicio, fechaFin, usuario }) {
  return `${baseContextKey}:semana_${fechaInicio}_${fechaFin}:usuario_${usuario}`;
}

function getTodayDateValue() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function isHistoricalDate(date) {
  return String(date || '') < getTodayDateValue();
}

function createDateFromIso(isoDate) {
  const safeValue = String(isoDate || '').trim();
  const match = safeValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
}

function getCurrentWeekStartValue() {
  const today = createDateFromIso(getTodayDateValue());
  if (!today) {
    return getTodayDateValue();
  }

  const dayOfWeek = today.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  return [
    monday.getFullYear(),
    String(monday.getMonth() + 1).padStart(2, '0'),
    String(monday.getDate()).padStart(2, '0')
  ].join('-');
}

function isHistoricalWeek(fechaFin) {
  return String(fechaFin || '').trim() < getCurrentWeekStartValue();
}

function normalizeDetallePayload(payload) {
  return {
    estadistica: Array.isArray(payload?.estadistica)
      ? payload.estadistica.map(normalizeStatisticEntry)
      : [],
    incidencias: Array.isArray(payload?.incidencias)
      ? payload.incidencias.map(normalizeDetalleIncidencia)
      : []
  };
}

export async function fetchIncidenciasByDate(date) {
  const safeDate = String(date || '').trim();
  if (!safeDate) {
    return [];
  }

  const response = await apisMeGet(`incidencias/listar/${encodeURIComponent(safeDate)}/`);
  return normalizeIncidenciasList(response);
}

export async function fetchIncidenciasDetalle({ fechaInicio, fechaFin, usuario }) {
  const safeFechaInicio = String(fechaInicio || '').trim();
  const safeFechaFin = String(fechaFin || '').trim();
  const safeUsuario = String(usuario || '').trim();

  if (!safeFechaInicio || !safeFechaFin || !safeUsuario) {
    return {
      estadistica: [],
      incidencias: []
    };
  }

  const response = await apisMeGet(
    `incidencias/detalle/${encodeURIComponent(safeFechaInicio)}/${encodeURIComponent(safeFechaFin)}/${encodeURIComponent(safeUsuario)}/`
  );

  return normalizeDetallePayload(response?.data);
}

export async function getIncidenciasDetalle({
  fechaInicio,
  fechaFin,
  usuario,
  selectedDate = '',
  forceRefresh = false
}) {
  const safeFechaInicio = String(fechaInicio || '').trim();
  const safeFechaFin = String(fechaFin || '').trim();
  const safeUsuario = String(usuario || '').trim();
  const safeSelectedDate = String(selectedDate || '').trim();
  const catalogDate = safeSelectedDate || safeFechaInicio;
  const isTodaySelection = catalogDate === getTodayDateValue();
  const historicalWeek = isHistoricalWeek(safeFechaFin);

  if (!safeFechaInicio || !safeFechaFin || !safeUsuario) {
    return {
      estadistica: [],
      incidencias: [],
      source: 'empty',
      stale: false,
      cacheNotice: null
    };
  }

  const { contextKey, hasStableIdentity } = getSessionCatalogContext();
  const catalogKey = buildDetalleCatalogKey(catalogDate);
  const catalogContextKey = buildDetalleContextKey(contextKey, {
    fechaInicio: safeFechaInicio,
    fechaFin: safeFechaFin,
    usuario: safeUsuario
  });

  const cacheNotice = isTodaySelection
    ? 'La información consultada corresponde a hoy y puede actualizarse. Esta vista usa una vigencia máxima de 5 minutos, pero no se actualizará automáticamente; primero se te notificará.'
    : null;

  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey,
      contextKey: catalogContextKey
    });

    return {
      ...normalizeDetallePayload(cached?.data),
      ...buildMissingUserSyncResult(cached?.data),
      source: cached ? 'cache' : 'empty',
      stale: Boolean(cached) && Number(cached.expiresAt || 0) <= Date.now(),
      cacheNotice
    };
  }

  if (historicalWeek && !forceRefresh) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey,
      contextKey: catalogContextKey
    });

    if (cached) {
      return {
        ...normalizeDetallePayload(cached?.data),
        source: 'cache',
        stale: false,
        cacheNotice
      };
    }
  }

  const ttlMs = historicalWeek
    ? INCIDENCIAS_DETALLE_HISTORICAL_TTL_MS
    : (isTodaySelection ? INCIDENCIAS_DETALLE_TODAY_TTL_MS : INCIDENCIAS_DETALLE_CURRENT_TTL_MS);

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey,
    contextKey: catalogContextKey,
    ttlMs,
    forceRefresh,
    fetcher: async () => fetchIncidenciasDetalle({
      fechaInicio: safeFechaInicio,
      fechaFin: safeFechaFin,
      usuario: safeUsuario
    })
  });

  return {
    ...normalizeDetallePayload(result?.data),
    source: result?.source || 'network',
    stale: Boolean(result?.stale),
    cacheNotice
  };
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
