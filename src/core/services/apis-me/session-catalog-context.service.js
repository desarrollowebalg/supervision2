import { getUserState } from '../../store.js';

export function getSessionCatalogContext() {
  const user = getUserState();
  const userId = user?.id ?? null;
  const userName = user?.usuario || 'unknown';
  const hasStableIdentity = Boolean(userId);
  const normalizedUserId = hasStableIdentity ? String(userId) : 'anon';
  const contextKey = `user_${normalizedUserId}:${String(userName)}`;

  return {
    contextKey,
    hasStableIdentity,
    userId: hasStableIdentity ? String(userId) : null,
    userName: String(userName)
  };
}

export function buildMissingUserSyncResult(data = []) {
  return {
    skipped: true,
    reason: 'missing_user_id',
    data: Array.isArray(data) ? data : []
  };
}
