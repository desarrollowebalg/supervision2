import { apisMeGet } from './client.js';
import { storageService } from '../storage.service.js';

const MAX_DAYS_SESSION_KEY = 'maxdays';
const DEFAULT_MAX_DAYS = 7;

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

