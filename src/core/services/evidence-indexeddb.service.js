import catalogIndexedDbService from './catalog-indexeddb.service.js';
import { getUserState } from '../store.js';

const EVIDENCE_CATALOG_KEY = 'evidence';
const PENDING_CATALOG_KEY = 'pending_to_send';
const PENDING_PHOTOS_CATALOG_KEY = 'pending_photos';
const LONG_TTL_MS = 3650 * 24 * 60 * 60 * 1000;

function getContextKey() {
  const user = getUserState();
  const userId = user?.id || 'anon';
  const userName = user?.usuario || 'unknown';
  return `user_${String(userId)}:${String(userName)}`;
}

async function appendRecord(catalogKey, record) {
  const contextKey = getContextKey();
  const current = await catalogIndexedDbService.getCatalog({ catalogKey, contextKey });
  const list = Array.isArray(current?.data) ? current.data : [];
  const next = [...list, record];

  await catalogIndexedDbService.saveCatalog({
    catalogKey,
    contextKey,
    data: next,
    ttlMs: LONG_TTL_MS
  });
}

export async function saveEvidenceRecord(record) {
  await appendRecord(EVIDENCE_CATALOG_KEY, record);
}

export async function savePendingToSendRecord(record) {
  await appendRecord(PENDING_CATALOG_KEY, record);
}

export async function savePendingPhotoRecord(record) {
  await appendRecord(PENDING_PHOTOS_CATALOG_KEY, record);
}

export function buildPendingPhotoRecord({
  formRef = {},
  questionRef = {},
  fieldType = '',
  assetMeta = {},
  status = 'PENDING'
} = {}) {
  const nowIso = new Date().toISOString();
  return {
    formRef: formRef && typeof formRef === 'object' ? formRef : {},
    questionRef: questionRef && typeof questionRef === 'object' ? questionRef : {},
    fieldType: String(fieldType || ''),
    assetMeta: assetMeta && typeof assetMeta === 'object' ? assetMeta : {},
    status: String(status || 'PENDING'),
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

export async function getEvidenceRecords() {
  const contextKey = getContextKey();
  const catalog = await catalogIndexedDbService.getCatalog({
    catalogKey: EVIDENCE_CATALOG_KEY,
    contextKey
  });

  return Array.isArray(catalog?.data) ? catalog.data : [];
}

export async function updateEvidenceRecordAt(index, patch = {}) {
  const contextKey = getContextKey();
  const catalog = await catalogIndexedDbService.getCatalog({
    catalogKey: EVIDENCE_CATALOG_KEY,
    contextKey
  });
  const list = Array.isArray(catalog?.data) ? [...catalog.data] : [];
  if (index < 0 || index >= list.length) {
    return false;
  }

  const current = list[index] && typeof list[index] === 'object' ? list[index] : {};
  list[index] = {
    ...current,
    ...patch
  };

  await catalogIndexedDbService.saveCatalog({
    catalogKey: EVIDENCE_CATALOG_KEY,
    contextKey,
    data: list,
    ttlMs: LONG_TTL_MS
  });

  return true;
}
