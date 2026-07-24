import { apisMeGet } from './client.js';
import { storageService } from '../storage.service.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import {
  buildMissingUserSyncResult,
  getSessionCatalogContext
} from './session-catalog-context.service.js';

function normalizeHeaderEntry(entry = {}) {
  return {
    ID_RES_CUESTIONARIO: Number(entry?.ID_RES_CUESTIONARIO ?? 0),
    ID_CUESTIONARIO: Number(entry?.ID_CUESTIONARIO ?? 0),
    FECHA: String(entry?.FECHA || '').trim(),
    LATITUD: String(entry?.LATITUD || '').trim(),
    LONGITUD: String(entry?.LONGITUD || '').trim(),
    BATERIA: Number(entry?.BATERIA ?? 0),
    FECHA_INICIO_CAPTURA: String(entry?.FECHA_INICIO_CAPTURA || '').trim(),
    FECHA_RECEPCION: String(entry?.FECHA_RECEPCION || '').trim(),
    COD_USER: String(entry?.COD_USER || '').trim(),
    USUARIO: String(entry?.USUARIO || '').trim(),
    NOMBRE_COMPLETO: String(entry?.NOMBRE_COMPLETO || '').trim(),
    URL_FOTO_PERFIL: String(entry?.URL_FOTO_PERFIL || '').trim(),
    CLV_GEO: String(entry?.CLV_GEO || '').trim(),
    DESCRIPCION: String(entry?.DESCRIPCION || '').trim(),
    ITEM_NUMBER: String(entry?.ITEM_NUMBER || '').trim()
  };
}

function normalizeDetailEntry(entry = {}) {
  return {
    ID_PREGUNTA: Number(entry?.ID_PREGUNTA ?? 0),
    ID_RES_CUESTIONARIO: Number(entry?.ID_RES_CUESTIONARIO ?? 0),
    ITEM_NUMBER: String(entry?.ITEM_NUMBER || '').trim(),
    DESCRIPCION: String(entry?.DESCRIPCION || '').trim(),
    RESPUESTA: String(entry?.RESPUESTA || '').trim()
  };
}

export async function getEvidenceReport(ide) {
  const safeIde = String(ide || '').trim();
  if (!/^\d+$/.test(safeIde)) {
    throw new Error('Identificador de evidencia invalido');
  }

  const response = await apisMeGet(`reports/evidence/${encodeURIComponent(safeIde)}/`);
  if (!response?.success) {
    throw new Error(String(response?.message || 'No fue posible consultar la evidencia'));
  }

  const headerRows = Array.isArray(response?.data?.header)
    ? response.data.header.map(normalizeHeaderEntry)
    : [];
  const detailRows = Array.isArray(response?.data?.detail)
    ? response.data.detail.map(normalizeDetailEntry)
    : [];

  return {
    header: headerRows[0] || null,
    detail: detailRows
  };
}

function normalizeHistoryEntry(entry = {}) {
  return {
    ID: Number(entry?.ID ?? 0),
    FECHA: String(entry?.FECHA || '').trim(),
    ID_INC: Number(entry?.ID_INC ?? entry?.IDI ?? 0),
    ESTATUS: String(entry?.ESTATUS || '').trim(),
    USUARIO: String(entry?.USUARIO || '').trim(),
    COMENTARIOS: String(entry?.COMENTARIOS || '').trim()
  };
}

function normalizeIncidentEntry(entry = {}) {
  return {
    ID: Number(entry?.ID ?? 0),
    CREADA_POR: Number(entry?.CREADA_POR ?? 0),
    ID_ESTATUS: Number(entry?.ID_ESTATUS ?? 0),
    ID_TIPO_INC: Number(entry?.ID_TIPO_INC ?? 0),
    ID_OBJECT_MAP: String(entry?.ID_OBJECT_MAP || '').trim(),
    ID_EVIDENCIA: Number(entry?.ID_EVIDENCIA ?? 0),
    NIVEL: Number(entry?.NIVEL ?? 0)
  };
}

export async function getIncidentReport(inc) {
  const safeInc = String(inc || '').trim();
  if (!/^\d+$/.test(safeInc)) {
    throw new Error('Identificador de incidencia invalido');
  }

  const response = await apisMeGet(`reports/incidence/${encodeURIComponent(safeInc)}/`);
  if (!response?.success) {
    throw new Error(String(response?.message || 'No fue posible consultar la incidencia'));
  }

  const rows = Array.isArray(response?.data)
    ? response.data.map(normalizeIncidentEntry)
    : [];

  return rows[0] || null;
}

export async function getHistoryReport(inc) {
  const safeInc = String(inc || '').trim();
  if (!/^\d+$/.test(safeInc)) {
    throw new Error('Identificador de incidencia invalido');
  }

  const response = await apisMeGet(`reports/history/${encodeURIComponent(safeInc)}/`);
  if (!response?.success) {
    throw new Error(String(response?.message || 'No fue posible consultar el historial'));
  }

  return Array.isArray(response?.data)
    ? response.data.map(normalizeHistoryEntry)
    : [];
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentWeekDateRange(baseDate = new Date()) {
  const safeBaseDate = baseDate instanceof Date ? new Date(baseDate.getTime()) : new Date(baseDate);
  if (Number.isNaN(safeBaseDate.getTime())) {
    throw new Error('Fecha base invalida');
  }

  const dayOfWeek = safeBaseDate.getDay();
  const offsetToMonday = (dayOfWeek + 6) % 7;

  const startDate = new Date(safeBaseDate.getFullYear(), safeBaseDate.getMonth(), safeBaseDate.getDate() - offsetToMonday);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);

  return {
    startDate: formatLocalDate(startDate),
    endDate: formatLocalDate(endDate)
  };
}

function parseJsonIfPossible(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return value;
  }
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'si' || normalized === 'sí';
}

function extractIncidenceFormsConfigEntries(configValue) {
  const parsedValue = parseJsonIfPossible(configValue);
  if (Array.isArray(parsedValue)) {
    return parsedValue;
  }

  if (parsedValue && typeof parsedValue === 'object') {
    if (Array.isArray(parsedValue.forms)) {
      return parsedValue.forms;
    }
    if (Array.isArray(parsedValue.FORMULARIOS)) {
      return parsedValue.FORMULARIOS;
    }
    return Object.values(parsedValue).filter((entry) => entry && typeof entry === 'object');
  }

  return [];
}

export function getIncidenceFormIdFromSessionConfig() {
  const confForms = storageService.getSessionItem('confForms');
  const entries = extractIncidenceFormsConfigEntries(confForms?.VALOR);

  const matchedForm = entries.find((entry) => normalizeBoolean(entry?.FORM_INCIDENCIA));
  const rawId = matchedForm?.IDFORM ?? matchedForm?.ID_FORM ?? matchedForm?.idForm ?? matchedForm?.idform;
  const parsedId = Number(rawId);

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error('No fue posible resolver el formulario de incidencias desde confForms');
  }

  return Math.trunc(parsedId);
}

function firstNonEmptyValue(entry = {}, keys = []) {
  for (const key of keys) {
    const value = entry?.[key];
    if (value === null || value === undefined) {
      continue;
    }

    const normalized = String(value).trim();
    if (normalized !== '') {
      return normalized;
    }
  }

  return '';
}

function normalizeWeekEvidenceEntry(entry = {}) {
  const id = firstNonEmptyValue(entry, [
    'ID',
    'IDRC',
    'ID_RES_CUESTIONARIO',
    'ID_INC',
    'IDI',
    'FOLIO'
  ]);

  const title = firstNonEmptyValue(entry, [
    'DESCRIPCION',
    'FORMULARIO',
    'NOMBRE',
    'TITULO',
    'ITEM_NUMBER',
    'ID_OBJECT_MAP',
    'ID'
  ]) || 'Incidencia';

  const status = firstNonEmptyValue(entry, [
    'ESTATUS',
    'STATUS',
    'STT_DESC',
    'ESTADO'
  ]);

  const occurredAt = firstNonEmptyValue(entry, [
    'FECHA',
    'FECHA_RECEPCION',
    'FECHA_INICIO_CAPTURA',
    'FECHA_CAPTURA',
    'FEC_REG',
    'FEC_CAP'
  ]);

  const userName = firstNonEmptyValue(entry, [
    'NOMBRE_COMPLETO',
    'USUARIO',
    'COD_USER',
    'CREADA_POR'
  ]);

  const summary = firstNonEmptyValue(entry, [
    'OBS',
    'OBSERVACIONES',
    'COMENTARIOS',
    'RESPUESTA',
    'RESUMEN'
  ]);

  return {
    id,
    title,
    status,
    occurredAt,
    userName,
    summary,
    raw: entry
  };
}

const WEEKLY_INCIDENCES_CATALOG_KEY = 'incidencias_weekly_timeline';
const WEEKLY_INCIDENCES_CACHE_TTL_MS = 30 * 60 * 1000;

async function fetchWeeklyIncidencesReport(baseDate = new Date()) {
  const { startDate, endDate } = getCurrentWeekDateRange(baseDate);
  const formId = getIncidenceFormIdFromSessionConfig();

  const response = await apisMeGet(
    `reports/evidencesWeek/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}/${encodeURIComponent(String(formId))}/`
  );

  if (!response?.success) {
    throw new Error(String(response?.message || 'No fue posible consultar las incidencias de la semana'));
  }

  const rows = Array.isArray(response?.data) ? response.data : [];

  return {
    startDate,
    endDate,
    formId,
    items: rows.map(normalizeWeekEvidenceEntry)
  };
}

export async function syncWeeklyIncidencesCatalog(baseDate = new Date()) {
  const { contextKey, hasStableIdentity, userId } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: WEEKLY_INCIDENCES_CATALOG_KEY,
      contextKey
    });
    console.info('[reports:evidencesWeek] sync skipped (missing user.id)');
    return buildMissingUserSyncResult(cached?.data);
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: WEEKLY_INCIDENCES_CATALOG_KEY,
    contextKey,
    ttlMs: WEEKLY_INCIDENCES_CACHE_TTL_MS,
    forceRefresh: true,
    fetcher: async () => fetchWeeklyIncidencesReport(baseDate)
  });

  console.info(`[reports:evidencesWeek] sync executed (user.id=${userId})`);
  return {
    skipped: false,
    reason: null,
    data: result?.data || null
  };
}

export async function getWeeklyIncidencesCatalogFromLocal() {
  const { contextKey } = getSessionCatalogContext();
  const cached = await catalogIndexedDbService.getCatalog({
    catalogKey: WEEKLY_INCIDENCES_CATALOG_KEY,
    contextKey
  });

  return cached?.data || null;
}

export async function getWeeklyIncidencesReport(baseDate = new Date()) {
  const { contextKey, hasStableIdentity } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    return getWeeklyIncidencesCatalogFromLocal();
  }

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: WEEKLY_INCIDENCES_CATALOG_KEY,
    contextKey,
    ttlMs: WEEKLY_INCIDENCES_CACHE_TTL_MS,
    fetcher: async () => fetchWeeklyIncidencesReport(baseDate)
  });

  return result?.data || null;
}
