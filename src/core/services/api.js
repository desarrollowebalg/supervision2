import { handleSessionExpired, isSessionExpiredPayload } from './session-expiration.service.js';

function isAuthEndpoint(url = '') {
  const normalized = String(url || '');
  return normalized.includes('/login/login') || normalized.includes('/login/validarUsuario');
}

export async function api(url, options = {}) {
  try {
    const response = await fetch(url, {
      credentials: 'include', // importante para sesiones PHP
      ...options
    });

    if ((response.status === 401 || response.status === 403) && !isAuthEndpoint(url)) {
      await handleSessionExpired('HTTP_AUTH');
      return {
        success: false,
        code: 'SESSION_EXPIRED',
        message: 'Sesion expirada'
      };
    }

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    const responseText = await response.text();

    if (!contentType.includes('application/json')) {
      const looksLikeRedirectToLogin = response.redirected && String(response.url || '').includes('/login/default');
      const looksLikeHtml = responseText.includes('<!DOCTYPE html') || responseText.includes('<html');
      if ((looksLikeRedirectToLogin || looksLikeHtml) && !isAuthEndpoint(url)) {
        await handleSessionExpired('NON_JSON_AUTH');
        return {
          success: false,
          code: 'SESSION_EXPIRED',
          message: 'Sesion expirada'
        };
      }
    }

    let data = null;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      if (!isAuthEndpoint(url)) {
        const looksLikeRedirectToLogin = response.redirected && String(response.url || '').includes('/login/default');
        if (looksLikeRedirectToLogin) {
          await handleSessionExpired('PARSE_REDIRECT');
          return {
            success: false,
            code: 'SESSION_EXPIRED',
            message: 'Sesion expirada'
          };
        }
      }

      throw parseError;
    }

    if (!isAuthEndpoint(url) && isSessionExpiredPayload(data)) {
      await handleSessionExpired('JSON_PAYLOAD_AUTH');
      return {
        ...data,
        success: false
      };
    }

    return data;

  } catch (error) {
    console.error('API error:', error);    
    return {
      success: false,
      message: 'Error de conexión'
    };
  }
}
