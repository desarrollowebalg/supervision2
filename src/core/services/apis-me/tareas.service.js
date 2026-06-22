import { apisMeGet } from './client.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import { getStoredMaxDays } from './usuarios.service.js';
import {
  buildMissingUserSyncResult,
  getSessionCatalogContext
} from './session-catalog-context.service.js';

const TASKS_CACHE_TTL_MS = 30 * 60 * 1000;
const TASKS_CATALOG_KEY = 'tareas';

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

  if (Array.isArray(payload?.tasks)) {
    return payload.tasks;
  }

  return [];
}

async function fetchTasksByMaxDays(maxdays) {
  const safeMaxDays = Number(maxdays) > 0 ? Number(maxdays) : getStoredMaxDays();
  const response = await apisMeGet(`tareas/listar/${Math.trunc(safeMaxDays)}/`);
  return extractList(response?.data);
}

export async function getAssignedTasks() {
  const { contextKey, hasStableIdentity } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: TASKS_CATALOG_KEY,
      contextKey
    });
    return Array.isArray(cached?.data) ? cached.data : [];
  }

  const maxdays = getStoredMaxDays();

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: TASKS_CATALOG_KEY,
    contextKey,
    ttlMs: TASKS_CACHE_TTL_MS,
    fetcher: async () => fetchTasksByMaxDays(maxdays)
  });

  return Array.isArray(result?.data) ? result.data : [];
}

export async function syncAssignedTasks({ maxdays } = {}) {
  const { contextKey, hasStableIdentity, userId } = getSessionCatalogContext();
  if (!hasStableIdentity) {
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: TASKS_CATALOG_KEY,
      contextKey
    });
    console.info('[tareas] sync skipped (missing user.id)');
    return buildMissingUserSyncResult(cached?.data);
  }

  const effectiveMaxDays = Number(maxdays) > 0 ? Number(maxdays) : getStoredMaxDays();

  const result = await catalogIndexedDbService.getOrSyncCatalog({
    catalogKey: TASKS_CATALOG_KEY,
    contextKey,
    ttlMs: TASKS_CACHE_TTL_MS,
    forceRefresh: true,
    fetcher: async () => fetchTasksByMaxDays(effectiveMaxDays)
  });

  console.info(`[tareas] sync executed (user.id=${userId})`);
  return {
    skipped: false,
    reason: null,
    data: Array.isArray(result?.data) ? result.data : []
  };
}

export async function getAssignedTasksFromLocal() {
  const { contextKey } = getSessionCatalogContext();
  const cached = await catalogIndexedDbService.getCatalog({
    catalogKey: TASKS_CATALOG_KEY,
    contextKey
  });

  return Array.isArray(cached?.data) ? cached.data : [];
}

export async function updateTaskStatus({ taskClvCaptura, statusId, latitud, longitud }) {
  const normalizedTaskClvCaptura = Number(taskClvCaptura);
  const normalizedStatusId = Number(statusId);
  const normalizedLatitud = Number(latitud);
  const normalizedLongitud = Number(longitud);

  if (!Number.isFinite(normalizedTaskClvCaptura) || normalizedTaskClvCaptura <= 0) {
    throw new Error('taskClvCaptura invalido');
  }

  if (!Number.isFinite(normalizedStatusId) || normalizedStatusId <= 0) {
    throw new Error('statusId invalido');
  }

  if (!Number.isFinite(normalizedLatitud)) {
    throw new Error('latitud invalida');
  }

  if (!Number.isFinite(normalizedLongitud)) {
    throw new Error('longitud invalida');
  }

  const response = await apisMeGet(
    `tareas/updateStatus/${Math.trunc(normalizedTaskClvCaptura)}/${Math.trunc(normalizedStatusId)}/${encodeURIComponent(String(normalizedLatitud))}/${encodeURIComponent(String(normalizedLongitud))}/`
  );
  const statusCode = Number(response?.data?.status ?? response?.status ?? 0);
  const success = Boolean(response?.data?.success) || statusCode === 200;
  if (!success) {
    throw new Error(response?.data?.message || 'No fue posible actualizar el estatus');
  }

  return response;
}

export async function closeTask({ taskId, taskClvCaptura, statusId, idrc, latitud, longitud }) {
  const normalizedTaskId = Number(taskId);
  const normalizedTaskClvCaptura = Number(taskClvCaptura);
  const normalizedStatusId = Number(statusId);
  const normalizedIdrc = String(idrc || '').trim();
  const normalizedLatitud = Number(latitud);
  const normalizedLongitud = Number(longitud);

  if (!Number.isFinite(normalizedTaskId) || normalizedTaskId <= 0) {
    throw new Error('taskId invalido');
  }

  if (!Number.isFinite(normalizedTaskClvCaptura) || normalizedTaskClvCaptura <= 0) {
    throw new Error('taskClvCaptura invalido');
  }

  if (!Number.isFinite(normalizedStatusId) || normalizedStatusId <= 0) {
    throw new Error('statusId invalido');
  }

  if (!normalizedIdrc) {
    throw new Error('idrc invalido');
  }

  if (!Number.isFinite(normalizedLatitud)) {
    throw new Error('latitud invalida');
  }

  if (!Number.isFinite(normalizedLongitud)) {
    throw new Error('longitud invalida');
  }

  const encodedIdrc = encodeURIComponent(normalizedIdrc);
  const response = await apisMeGet(
    `tareas/close/${Math.trunc(normalizedTaskId)}/${Math.trunc(normalizedTaskClvCaptura)}/${Math.trunc(normalizedStatusId)}/${encodedIdrc}/${encodeURIComponent(String(normalizedLatitud))}/${encodeURIComponent(String(normalizedLongitud))}/`
  );
  const statusCode = Number(response?.data?.status ?? response?.status ?? 0);
  const success = Boolean(response?.data?.success) || statusCode === 200;
  if (!success) {
    throw new Error(response?.data?.message || 'No fue posible cerrar la tarea');
  }

  return response;
}

export async function patchTaskStatusInLocalCatalog({ taskId, statusId, statusText }) {
  const normalizedTaskId = String(taskId ?? '');
  if (!normalizedTaskId) {
    return;
  }

  const { contextKey } = getSessionCatalogContext();
  const cached = await catalogIndexedDbService.getCatalog({
    catalogKey: TASKS_CATALOG_KEY,
    contextKey
  });

  if (!Array.isArray(cached?.data) || !cached.data.length) {
    return;
  }

  const nextData = cached.data.map((task) => {
    if (String(task?.ID_TAREA ?? '') !== normalizedTaskId) {
      return task;
    }

    return {
      ...task,
      ID_STATUS: Number(statusId) || task?.ID_STATUS,
      ESTATUS: String(statusText || task?.ESTATUS || '')
    };
  });

  await catalogIndexedDbService.saveCatalog({
    catalogKey: TASKS_CATALOG_KEY,
    contextKey,
    data: nextData,
    ttlMs: TASKS_CACHE_TTL_MS
  });
}
