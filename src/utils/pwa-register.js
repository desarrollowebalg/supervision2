/**
 * Registro PWA en vanilla JS.
 * Vite PWA sigue generando `sw.js` y `manifest.webmanifest`.
 */

export function initPWA(options = {}) {
  const {
    onNeedRefresh = null,
    onOfflineReady = null,
    onRegistered = null,
    onRegisterError = null
  } = options;

  if (!('serviceWorker' in navigator)) {
    return null;
  }

  let refreshing = false;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      onRegistered?.(registration);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              if (onNeedRefresh) {
                onNeedRefresh(() => window.location.reload());
              }
            } else {
              onOfflineReady?.();
            }
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      setInterval(() => registration.update(), 60 * 60 * 1000);
    } catch (error) {
      console.error('[PWA] Error al registrar Service Worker:', error);
      onRegisterError?.(error);
    }
  });

  return true;
}

if (import.meta.env.PROD) {
  initPWA();
}
