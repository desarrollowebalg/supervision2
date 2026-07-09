import { navigate } from '../core/router.js';
import { logoutApp } from '../core/services/authService.js';
import { connectivityService } from '../core/services/connectivity.service.js';
import { storageService } from '../core/services/storage.service.js';
import { themeService } from '../core/services/theme.service.js';
import { getUserState, setUser } from '../core/store.js';
import { syncAllCatalogs } from '../core/services/apis-me/catalog-sync.service.js';

import '../components/header-component.js';
import '../components/sidebar-menu-component.js';

const OFFLINE_ACCENT_COLOR = '#9ca3af';
const SIDEBAR_COLLAPSE_STORAGE_KEY = 'sidebarCollapsed';

function getStoredSidebarCollapsed() {
  const storedValue = storageService.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
  if (storedValue === true || storedValue === 'true') {
    return true;
  }
  if (storedValue === false || storedValue === 'false') {
    return false;
  }
  return false;
}

function ensureOfflineLayoutStyles() {
  if (document.getElementById('inicio-layout-offline-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'inicio-layout-offline-styles';
  style.textContent = `
    .inicio-shell.is-offline sidebar-menu-component [data-role='brand-avatar'] user-avatar-enhanced {
      background: ${OFFLINE_ACCENT_COLOR};
      border-radius: 12px;
    }
  `;
  document.head.appendChild(style);
}

function ensureGlobalSyncOverlayStyles() {
  if (document.getElementById('global-sync-overlay-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'global-sync-overlay-styles';
  style.textContent = `
    .global-sync-overlay {
      position: fixed;
      inset: 0;
      z-index: 12000;
      background: var(--app-overlay);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .global-sync-overlay__card {
      width: min(28rem, 92vw);
      border-radius: 12px;
      background: var(--app-surface-elevated);
      color: var(--app-text);
      border: 1px solid var(--app-border);
      box-shadow: var(--app-shadow-soft);
      padding: 1rem 1.1rem;
      text-align: center;
    }

    .global-sync-overlay__card .uk-text-meta {
      color: var(--app-text-muted) !important;
    }
  `;
  document.head.appendChild(style);
}

function showGlobalSyncOverlay(options = {}) {
  ensureGlobalSyncOverlayStyles();
  const currentOverlay = document.getElementById('globalSyncOverlay');
  if (currentOverlay) {
    const titleNode = currentOverlay.querySelector('[data-global-overlay-title]');
    const messageNode = currentOverlay.querySelector('[data-global-overlay-message]');
    if (titleNode) {
      titleNode.textContent = options.title || 'Sincronizando datos';
    }
    if (messageNode) {
      messageNode.textContent = options.message || 'Estamos descargando catalogos disponibles.';
    }
    return;
  }

  const title = options.title || 'Sincronizando datos';
  const message = options.message || 'Estamos descargando catalogos disponibles.';
  const overlay = document.createElement('div');
  overlay.id = 'globalSyncOverlay';
  overlay.className = 'global-sync-overlay';
  overlay.innerHTML = `
    <div class="global-sync-overlay__card uk-card uk-card-default uk-card-body">
      <div class="uk-flex uk-flex-center uk-margin-small-bottom"><div uk-spinner></div></div>
      <h3 class="uk-card-title uk-margin-small-bottom" data-global-overlay-title>${title}</h3>
      <p class="uk-margin-remove uk-text-meta" data-global-overlay-message>${message}</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

function hideGlobalSyncOverlay() {
  document.getElementById('globalSyncOverlay')?.remove();
}

function showUiNotice({ message, status = 'primary' }) {
  if (window.UIkit?.notification) {
    window.UIkit.notification({ message, status, pos: 'top-center', timeout: 2500 });
    return;
  }
  window.alert(message);
}

export function renderInicioLayout(container, options = {}) {
  const {
    title = '',
    description = '',
    contentHtml = ''
  } = options;

  const userState = getUserState();
  container.innerHTML = `
    <div class="inicio-shell" id="inicioShell">      
      <div class="inicio-body uk-flex">
        <aside class="inicio-sidebar" id="inicioSidebar">
          <sidebar-menu-component collapsed="false"></sidebar-menu-component>
        </aside>

        <main class="inicio-main">
          <header-component
            nombre-cliente="SVG - Supervisión"
            razon-social="BD Dynamics"
            nombre-usuario="${userState.nombre_completo || userState.usuario || 'Usuario'}"
            rol-usuario="${userState.usuario ? userState.usuario : ''}"
            avatar-url="${userState.foto_perfil || 'https://app.movilizandome.net/public/images/userDesc.png'}"
            notificaciones-count="3">
          </header-component>
          <section class="inicio-main-content uk-padding-small">
            <div class="uk-container uk-container-expand uk-width-1-1 background-app">
              <div class="uk-card uk-card-body uk-width-1-1 uk-padding-remove-left uk-padding-remove-right inicio-padding-card">
                <h1 class="uk-card-title">${title}</h1>
                ${description ? `<p>${description}</p>` : ''}
                ${contentHtml}
              </div>
            </div>
          </section>
        </main>
      </div>

      <div class="inicio-overlay" id="inicioOverlay"></div>
    </div>
  `;

  bindInicioLayoutEvents(container);
}

export function bindInicioLayoutEvents(container) {
  ensureOfflineLayoutStyles();
  if (typeof container._cleanupConnectivitySubscription === 'function') {
    container._cleanupConnectivitySubscription();
    container._cleanupConnectivitySubscription = null;
  }

  const shell = container.querySelector('#inicioShell');
  const overlay = container.querySelector('#inicioOverlay');
  const sidebarComponent = container.querySelector('sidebar-menu-component');
  const header = container.querySelector('header-component');

  const closeSidebar = () => shell?.classList.remove('is-sidebar-open');
  const toggleSidebar = () => shell?.classList.toggle('is-sidebar-open');
  const mqDesktop = window.matchMedia('(min-width: 1200px)');
  let isLoggingOut = false;
  const clearBrowserStorage = () => {
    const themePreference = themeService.getPreference();
    window.localStorage.clear();
    window.sessionStorage.clear();
    if (themePreference !== 'system') {
      themeService.setPreference(themePreference);
    } else {
      themeService.clearStoredPreference();
    }
  };
  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    isLoggingOut = true;
    closeSidebar();
    showGlobalSyncOverlay({
      title: 'Cerrando sesion',
      message: 'Estamos cerrando tu sesion. Espera un momento...'
    });

    try {
      await logoutApp();
    } catch (error) {
      // El cierre remoto puede fallar en red inestable; se prioriza salida local.
      console.warn('No fue posible cerrar sesión en servidor, se fuerza salida local.', error);
    } finally {
      setUser(null);
      clearBrowserStorage();
      window.location.href = '/login/default';
    }
  };

  const syncConnectivityState = (isOnline) => {
    const isOffline = !isOnline;
    shell?.classList.toggle('is-offline', isOffline);
    if (header) {
      header.setAttribute('offline', isOffline ? 'true' : 'false');
    }
  };

  const syncSidebarState = (collapsed) => {
    if (!mqDesktop.matches) {
      shell?.classList.remove('is-sidebar-collapsed');
      return;
    }
    shell?.classList.toggle('is-sidebar-collapsed', !!collapsed);
  };

  const initialCollapsed = getStoredSidebarCollapsed();
  if (sidebarComponent) {
    sidebarComponent.setAttribute('collapsed', initialCollapsed ? 'true' : 'false');
  }
  syncSidebarState(initialCollapsed);

  container.querySelectorAll('[data-route]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const path = link.getAttribute('data-route');
      closeSidebar();
      navigate(path);
    });
  });

  overlay?.addEventListener('click', closeSidebar);

  header?.addEventListener('menu-toggle-click', () => {
    if (mqDesktop.matches) {
      return;
    }
    toggleSidebar();
  });

  header?.addEventListener('user-menu-click', (e) => {
    console.log('Usuario menu clicked:', e.detail);
  });

  header?.addEventListener('user-profile-click', () => {
    closeSidebar();
    navigate('/profile');
  });

  header?.addEventListener('user-logout-click', async () => {
    await handleLogout();
  });

  header?.addEventListener('notifications-click', (e) => {
    console.log('Notificaciones clicked:', e.detail);
  });

  header?.addEventListener('settings-click', () => {
    closeSidebar();
    navigate('/settings');
  });

  header?.addEventListener('user-settings-click', () => {
    closeSidebar();
    navigate('/settings');
  });

  sidebarComponent?.addEventListener('sidebar-collapsed-change', (event) => {
    if (!mqDesktop.matches && sidebarComponent) {
      sidebarComponent.setAttribute('collapsed', 'false');
      syncSidebarState(false);
      return;
    }
    syncSidebarState(event.detail?.collapsed);
  });

  sidebarComponent?.addEventListener('sidebar-logout-click', async () => {
    await handleLogout();
  });

  sidebarComponent?.addEventListener('sidebar-close-click', closeSidebar);

  sidebarComponent?.addEventListener('sidebar-manual-sync-click', async () => {
    if (connectivityService.getIsOffline()) {
      showUiNotice({
        message: 'No hay conexion a internet. No se puede sincronizar en este momento.',
        status: 'warning'
      });
      return;
    }

    closeSidebar();
    showGlobalSyncOverlay();
    try {
      await syncAllCatalogs({ refreshMaxDays: true });
      showUiNotice({
        message: 'Datos sincronizados correctamente.',
        status: 'success'
      });
    } catch (error) {
      showUiNotice({
        message: 'No fue posible sincronizar los datos.',
        status: 'danger'
      });
    } finally {
      hideGlobalSyncOverlay();
    }
  });

  sidebarComponent?.addEventListener('sidebar-theme-toggle-click', () => {
    const nextTheme = themeService.toggleTheme();
    showUiNotice({
      message: `Tema ${nextTheme === 'dark' ? 'oscuro' : 'claro'} activado.`,
      status: 'primary'
    });
  });

  const syncViewportState = () => {
    if (mqDesktop.matches) {
      closeSidebar();
      const desktopCollapsed = getStoredSidebarCollapsed();
      if (sidebarComponent) {
        sidebarComponent.setAttribute('collapsed', desktopCollapsed ? 'true' : 'false');
      }
      syncSidebarState(desktopCollapsed);
    } else if (sidebarComponent) {
      // En móvil/tablet el menú se usa como drawer, no colapsado.
      sidebarComponent.setAttribute('collapsed', 'false');
      syncSidebarState(false);
    }
  };
  syncViewportState();
  container._cleanupConnectivitySubscription = connectivityService.subscribe(syncConnectivityState);

  if (mqDesktop.addEventListener) {
    mqDesktop.addEventListener('change', syncViewportState);
  } else {
    mqDesktop.addListener(syncViewportState);
  }
}
