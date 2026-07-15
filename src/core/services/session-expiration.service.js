import { setUser } from '../store.js';
import { buildCurrentHashRoute, buildLoginRedirectUrl, savePostLoginRedirect } from './post-login-redirect.service.js';

const ACTIVE_FORM_PREFIX = 'forms_active_';
const ACTIVE_FORM_POINTER_KEY = 'forms_active_current';
const LOGOUT_FLAG = '__sessionLogoutInProgress';

function clearSensitiveLocalState() {
  const keysToRemove = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    if (key === ACTIVE_FORM_POINTER_KEY || key.startsWith(ACTIVE_FORM_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  window.sessionStorage.clear();
  setUser(null);
}

function shouldSkipSessionRedirect(currentPath) {
  return currentPath.startsWith('/login');
}

export async function handleSessionExpired(reason = 'SESSION_EXPIRED') {
  if (window[LOGOUT_FLAG]) {
    return;
  }

  const currentPath = window.location.pathname || '';
  if (shouldSkipSessionRedirect(currentPath)) {
    return;
  }

  window[LOGOUT_FLAG] = true;
  const currentHashRoute = buildCurrentHashRoute();

  try {
    clearSensitiveLocalState();
    if (currentHashRoute) {
      savePostLoginRedirect(currentHashRoute, { source: reason });
    }

    const message = 'Tu sesion expiro. Vuelve a iniciar sesion.';
    if (typeof window.UIkit?.modal?.alert === 'function') {
      await window.UIkit.modal.alert(message);
    } else {
      window.alert(message);
    }
  } finally {
    window.location.href = currentHashRoute
      ? buildLoginRedirectUrl(currentHashRoute)
      : '/login/default';
  }
}

export function isSessionExpiredPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const code = String(payload.code || '').trim().toUpperCase();
  if (code === 'SESSION_EXPIRED') {
    return true;
  }

  const message = String(payload.message || payload.error || '').toLowerCase();
  if (message.includes('session') && (message.includes('expir') || message.includes('invalid'))) {
    return true;
  }

  return false;
}
