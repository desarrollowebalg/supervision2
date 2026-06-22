import { api } from '../api.js';

const APIS_ME_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8091/apis_me'
  : '/apis_me';

function normalizePath(path) {
  return String(path || '').replace(/^\/+/, '');
}

export async function apisMeGet(path) {
  const cleanPath = normalizePath(path);
  return api(`${APIS_ME_BASE_URL}/${cleanPath}`);
}

export async function apisMePost(path, body = {}) {
  const cleanPath = normalizePath(path);
  return api(`${APIS_ME_BASE_URL}/${cleanPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body ?? {})
  });
}
