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
const DETAIL_STATUS_META_BY_CODE = {
  L: { code: 'L', label: 'Leida' },
  A: { code: 'A', label: 'Atendida' },
  C: { code: 'C', label: 'Cerrada' },
  AP: { code: 'AP', label: 'Aprobada' },
  R: { code: 'R', label: 'Rechazada' },
  RE: { code: 'RE', label: 'Reasignada' },
  NL_NVL: { code: 'NL_NVL', label: 'No leida *' },
  NL: { code: 'NL', label: 'No leida' },
  X: { code: 'X', label: 'Abierta' }
};

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

function normalizeDetalleNivelValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
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
    IDI: String(row?.IDI || '0').trim() || '0',
    IDR: String(row?.IDR || '').trim(),
    NVL: normalizeDetalleNivelValue(row?.NVL)
  };
}

function buildIncidenciasContextKey(baseContextKey, date) {
  return `${baseContextKey}:fecha_${date}`;
}

function buildDetalleCatalogKey(date) {
  return `detalle_${String(date || '').trim()}`;
}

function buildDetalleNivelCatalogKey(date) {
  return `detalle_nivel_${String(date || '').trim()}`;
}

function buildDetalleContextKey(baseContextKey, { fechaInicio, fechaFin, usuario }) {
  return `${baseContextKey}:semana_${fechaInicio}_${fechaFin}:usuario_${usuario}`;
}

function buildDetalleNivelContextKey(baseContextKey, { fechaInicio, fechaFin, usuario, nivel }) {
  return `${baseContextKey}:semana_${fechaInicio}_${fechaFin}:usuario_${usuario}:nivel_${nivel}`;
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

function resolveDetalleStatusMeta(rawStatus, statusLabel = '') {
  const safeStatus = String(rawStatus ?? '').trim();
  const safeLabel = String(statusLabel || '').trim();
  const normalizedLabel = safeLabel
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  const knownStatuses = {
    '0': DETAIL_STATUS_META_BY_CODE.L,
    '1': DETAIL_STATUS_META_BY_CODE.A,
    '2': DETAIL_STATUS_META_BY_CODE.C,
    '3': DETAIL_STATUS_META_BY_CODE.AP,
    '4': DETAIL_STATUS_META_BY_CODE.R,
    '5': DETAIL_STATUS_META_BY_CODE.RE,
    '-1': DETAIL_STATUS_META_BY_CODE.NL_NVL,
    NL: DETAIL_STATUS_META_BY_CODE.NL,
    L: DETAIL_STATUS_META_BY_CODE.L,
    A: DETAIL_STATUS_META_BY_CODE.A,
    C: DETAIL_STATUS_META_BY_CODE.C,
    AP: DETAIL_STATUS_META_BY_CODE.AP,
    R: DETAIL_STATUS_META_BY_CODE.R,
    RE: DETAIL_STATUS_META_BY_CODE.RE,
    NL_NVL: DETAIL_STATUS_META_BY_CODE.NL_NVL,
    X: DETAIL_STATUS_META_BY_CODE.X
  };
  const labelAliases = {
    LEIDA: DETAIL_STATUS_META_BY_CODE.L,
    ATENDIDA: DETAIL_STATUS_META_BY_CODE.A,
    CERRADA: DETAIL_STATUS_META_BY_CODE.C,
    APROBADA: DETAIL_STATUS_META_BY_CODE.AP,
    RECHAZADA: DETAIL_STATUS_META_BY_CODE.R,
    REASIGNADA: DETAIL_STATUS_META_BY_CODE.RE,
    NO_LEIDA: DETAIL_STATUS_META_BY_CODE.NL,
    NO_LEIDA_: DETAIL_STATUS_META_BY_CODE.NL_NVL,
    ABIERTA: DETAIL_STATUS_META_BY_CODE.X
  };

  if (knownStatuses[safeStatus]) {
    return knownStatuses[safeStatus];
  }

  if (labelAliases[normalizedLabel]) {
    return labelAliases[normalizedLabel];
  }

  return {
    code: safeStatus || 'X',
    label: safeLabel || 'Abierta'
  };
}

function buildDetalleStatistics(records = []) {
  const statisticsMap = new Map([
    ['NL', { ...DETAIL_STATUS_META_BY_CODE.NL, total: 0 }],
    ['L', { ...DETAIL_STATUS_META_BY_CODE.L, total: 0 }],
    ['A', { ...DETAIL_STATUS_META_BY_CODE.A, total: 0 }],
    ['C', { ...DETAIL_STATUS_META_BY_CODE.C, total: 0 }],
    ['AP', { ...DETAIL_STATUS_META_BY_CODE.AP, total: 0 }],
    ['R', { ...DETAIL_STATUS_META_BY_CODE.R, total: 0 }],
    ['RE', { ...DETAIL_STATUS_META_BY_CODE.RE, total: 0 }],
    ['NL_NVL', { ...DETAIL_STATUS_META_BY_CODE.NL_NVL, total: 0 }],
    ['X', { ...DETAIL_STATUS_META_BY_CODE.X, total: 0 }]
  ]);

  (Array.isArray(records) ? records : []).forEach((record) => {
    const statusMeta = resolveDetalleStatusMeta(record?.STT, record?.STT_DESC);
    const current = statisticsMap.get(statusMeta.code) || {
      code: statusMeta.code,
      label: statusMeta.label,
      total: 0
    };
    current.total += 1;
    statisticsMap.set(statusMeta.code, current);
  });

  return Array.from(statisticsMap.values());
}

function filterDetallePayloadByNivel(payload, nivel) {
  const normalizedNivel = normalizeDetalleNivelValue(nivel);
  if (normalizedNivel === null) {
    return normalizeDetallePayload(payload);
  }

  const normalizedPayload = normalizeDetallePayload(payload);
  const filteredIncidencias = normalizedPayload.incidencias.filter((record) => (
    normalizeDetalleNivelValue(record?.NVL) === normalizedNivel
  ));

  return {
    estadistica: buildDetalleStatistics(filteredIncidencias),
    incidencias: filteredIncidencias
  };
}

function resolveDetalleTtlMs({ historicalWeek, isTodaySelection }) {
  if (historicalWeek) {
    return INCIDENCIAS_DETALLE_HISTORICAL_TTL_MS;
  }

  return isTodaySelection ? INCIDENCIAS_DETALLE_TODAY_TTL_MS : INCIDENCIAS_DETALLE_CURRENT_TTL_MS;
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
  nivel = null,
  selectedDate = '',
  forceRefresh = false
}) {
  const safeFechaInicio = String(fechaInicio || '').trim();
  const safeFechaFin = String(fechaFin || '').trim();
  const safeUsuario = String(usuario || '').trim();
  const safeNivel = normalizeDetalleNivelValue(nivel);
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
  const baseCatalogKey = buildDetalleCatalogKey(catalogDate);
  const baseCatalogContextKey = buildDetalleContextKey(contextKey, {
    fechaInicio: safeFechaInicio,
    fechaFin: safeFechaFin,
    usuario: safeUsuario
  });
  const derivedCatalogKey = buildDetalleNivelCatalogKey(catalogDate);
  const derivedCatalogContextKey = safeNivel === null
    ? null
    : buildDetalleNivelContextKey(contextKey, {
        fechaInicio: safeFechaInicio,
        fechaFin: safeFechaFin,
        usuario: safeUsuario,
        nivel: safeNivel
      });

  const cacheNotice = isTodaySelection
    ? 'La información consultada corresponde a hoy y puede actualizarse.'
    : null;
  const ttlMs = resolveDetalleTtlMs({ historicalWeek, isTodaySelection });

  const saveDerivedCatalog = async (payload) => {
    if (safeNivel === null || !derivedCatalogContextKey) {
      return;
    }

    await catalogIndexedDbService.saveCatalog({
      catalogKey: derivedCatalogKey,
      contextKey: derivedCatalogContextKey,
      data: payload,
      ttlMs
    });
  };

  const buildResponse = (payload, source, stale = false, extra = {}) => ({
    ...normalizeDetallePayload(payload),
    source,
    stale,
    cacheNotice,
    ...extra
  });

  const getBaseCatalog = async () => {
    if (!hasStableIdentity) {
      const cached = await catalogIndexedDbService.getCatalog({
        catalogKey: baseCatalogKey,
        contextKey: baseCatalogContextKey
      });

      return {
        payload: normalizeDetallePayload(cached?.data),
        source: cached ? 'cache' : 'empty',
        stale: Boolean(cached) && Number(cached.expiresAt || 0) <= Date.now(),
        cachedData: cached?.data || null
      };
    }

    if (historicalWeek && !forceRefresh) {
      const cached = await catalogIndexedDbService.getCatalog({
        catalogKey: baseCatalogKey,
        contextKey: baseCatalogContextKey
      });

      if (cached) {
        return {
          payload: normalizeDetallePayload(cached.data),
          source: 'cache',
          stale: false,
          cachedData: cached.data
        };
      }
    }

    const result = await catalogIndexedDbService.getOrSyncCatalog({
      catalogKey: baseCatalogKey,
      contextKey: baseCatalogContextKey,
      ttlMs,
      forceRefresh,
      fetcher: async () => fetchIncidenciasDetalle({
        fechaInicio: safeFechaInicio,
        fechaFin: safeFechaFin,
        usuario: safeUsuario
      })
    });

    return {
      payload: normalizeDetallePayload(result?.data),
      source: result?.source || 'network',
      stale: Boolean(result?.stale),
      cachedData: result?.data || null
    };
  };

  const getDerivedFromBase = async () => {
    const baseResult = await getBaseCatalog();
    const derivedPayload = filterDetallePayloadByNivel(baseResult.payload, safeNivel);
    await saveDerivedCatalog(derivedPayload);
    return buildResponse(derivedPayload, baseResult.source, baseResult.stale);
  };

  if (safeNivel !== null && derivedCatalogContextKey) {
    const cachedDerived = await catalogIndexedDbService.getCatalog({
      catalogKey: derivedCatalogKey,
      contextKey: derivedCatalogContextKey
    });
    const isDerivedFresh = Boolean(cachedDerived) && Number(cachedDerived.expiresAt || 0) > Date.now();

    if (!forceRefresh && cachedDerived && (isDerivedFresh || historicalWeek || !hasStableIdentity)) {
      const baseMissingUserMeta = !hasStableIdentity
        ? buildMissingUserSyncResult(cachedDerived.data)
        : {};
      return {
        ...buildResponse(cachedDerived.data, 'cache', !isDerivedFresh && !historicalWeek),
        ...baseMissingUserMeta
      };
    }
  }

  if (historicalWeek && !forceRefresh) {
    if (safeNivel !== null) {
      return getDerivedFromBase();
    }
  }

  if (!hasStableIdentity) {
    if (safeNivel !== null) {
      const response = await getDerivedFromBase();
      return {
        ...response,
        ...buildMissingUserSyncResult(response)
      };
    }

    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: baseCatalogKey,
      contextKey: baseCatalogContextKey
    });

    return {
      ...buildResponse(cached?.data, cached ? 'cache' : 'empty', Boolean(cached) && Number(cached.expiresAt || 0) <= Date.now()),
      ...buildMissingUserSyncResult(cached?.data)
    };
  }

  if (safeNivel !== null) {
    return getDerivedFromBase();
  }

  const baseResult = await getBaseCatalog();
  return buildResponse(baseResult.payload, baseResult.source, baseResult.stale);
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
