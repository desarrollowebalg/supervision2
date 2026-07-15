import { storageService } from './storage.service.js';

const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';
const DEFAULT_TTL_MS = 30 * 60 * 1000;

function normalizeAppRoute(path) {
  const rawValue = String(path || '').trim();
  if (!rawValue) {
    return '';
  }

  if (rawValue.startsWith('http://') || rawValue.startsWith('https://') || rawValue.startsWith('//')) {
    return '';
  }

  let normalized = rawValue.startsWith('#') ? rawValue.slice(1) : rawValue;

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  return normalized;
}

function isSafeAppRoute(path) {
  const normalized = normalizeAppRoute(path);

  if (!normalized || !normalized.startsWith('/')) {
    return false;
  }

  return !normalized.startsWith('/login');
}

function isExpired(payload) {
  const createdAt = Number(payload?.createdAt || 0);
  if (!createdAt) {
    return true;
  }

  return Date.now() - createdAt > DEFAULT_TTL_MS;
}

function savePostLoginRedirect(path, options = {}) {
  const normalizedPath = normalizeAppRoute(path);
  if (!isSafeAppRoute(normalizedPath)) {
    return false;
  }

  storageService.setSessionItem(POST_LOGIN_REDIRECT_KEY, {
    path: normalizedPath,
    source: options.source || 'auth-guard',
    createdAt: Date.now()
  });

  return true;
}

function getPostLoginRedirect() {
  const payload = storageService.getSessionItem(POST_LOGIN_REDIRECT_KEY);
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (!isSafeAppRoute(payload.path) || isExpired(payload)) {
    storageService.removeSessionItem(POST_LOGIN_REDIRECT_KEY);
    return null;
  }

  return payload;
}

function clearPostLoginRedirect() {
  storageService.removeSessionItem(POST_LOGIN_REDIRECT_KEY);
}

function consumePostLoginRedirect() {
  const payload = getPostLoginRedirect();
  clearPostLoginRedirect();
  return payload?.path || '';
}

function buildCurrentHashRoute() {
  const hash = String(window.location.hash || '').trim();
  if (!hash || hash === '#') {
    return '';
  }

  return normalizeAppRoute(hash.slice(1));
}

function getPostLoginRedirectFromUrl(url = window.location.href) {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    return normalizeAppRoute(parsedUrl.searchParams.get('returnTo') || '');
  } catch (error) {
    return '';
  }
}

function buildLoginRedirectUrl(path = '', basePath = '/login/default') {
  const normalizedPath = normalizeAppRoute(path);
  if (!isSafeAppRoute(normalizedPath)) {
    return basePath;
  }

  const loginUrl = new URL(basePath, window.location.origin);
  loginUrl.searchParams.set('returnTo', normalizedPath);
  return `${loginUrl.pathname}${loginUrl.search}`;
}

export {
  POST_LOGIN_REDIRECT_KEY,
  buildCurrentHashRoute,
  buildLoginRedirectUrl,
  clearPostLoginRedirect,
  consumePostLoginRedirect,
  getPostLoginRedirect,
  getPostLoginRedirectFromUrl,
  isSafeAppRoute,
  normalizeAppRoute,
  savePostLoginRedirect
};
