import '../../core/bootstrap.js';
import '../../styles/global.css';
import '../../utils/pwa-register.js';

import { initApp } from '../../core/bootstrap.js';
import { getUserState, setUser } from '../../core/store.js';
import { getUser } from '../../core/services/authService.js';
import { buildLoginRedirectUrl, savePostLoginRedirect } from '../../core/services/post-login-redirect.service.js';
import { handleSessionExpired } from '../../core/services/session-expiration.service.js';
import { initRouter, registerRoute, navigate, render } from '../../core/router.js';

import Inicio from '../Inicio.js';
import Dashboard from '../dashboard/Dashboard.js';
import Profile from '../profile/Profile.js';
import Settings from '../settings.js';
import Formularios from '../formularios/formularios.js';
import FormEvidencia from '../formularios/form-evidencia.js';
import Cuadrantes from '../cuadrantes/Cuadrantes.js';
import PuntosInteres from '../puntosInteres/PuntosInteres.js';
import Supervision from '../supervision/supervision.js';
import DetalleIncidencia from '../supervision/DetalleIncidencia.js';
import Tareas from '../tareas/Tareas.js';
import TareaDetalle from '../tareas/TareaDetalle.js';
import Timeline from '../evidencias/Timeline.js';

function hasSessionUserIdentity(sessionCheck) {
  const payloads = [
    sessionCheck,
    sessionCheck?.user,
    sessionCheck?.data
  ];

  return payloads.some((payload) => Boolean(
    payload?.id
    || payload?.ID_USUARIO
    || payload?.user
    || payload?.usuario
  ));
}

await initApp();

const user = getUserState();
const requestedHashPath = window.location.hash.slice(1);

if (!user.isAuthenticated) {
  if (requestedHashPath) {
    savePostLoginRedirect(requestedHashPath, { source: 'app-entry' });
    window.location.href = buildLoginRedirectUrl(requestedHashPath);
  } else {
    window.location.href = '/login/default';
  }
} else {
  const container = document.querySelector('#appMain');
  container.className = 'app-layout';
  container.innerHTML = '<main class="app-content" id="appContent"></main>';

  const content = document.querySelector('#appContent');

  registerRoute('/inicio', Inicio, { meta: { title: 'Inicio', requiresAuth: true } });
  registerRoute('/dashboard', Dashboard, { meta: { title: 'Dashboard', requiresAuth: true } });
  registerRoute('/profile', Profile, { meta: { title: 'Perfil de usuario', requiresAuth: true } });
  registerRoute('/settings', Settings, { meta: { title: 'Configuración', requiresAuth: true } });
  registerRoute('/formularios', Formularios, { meta: { title: 'Formularios', requiresAuth: true } });
  registerRoute('/formularios/:indicator', FormEvidencia, { meta: { title: 'Detalle de formulario', requiresAuth: true } });
  registerRoute('/cuadrantes', Cuadrantes, { meta: { title: 'Cuadrantes', requiresAuth: true } });
  registerRoute('/puntos-interes', PuntosInteres, { meta: { title: 'Puntos de interés', requiresAuth: true } });
  registerRoute('/supervision', Supervision, { meta: { title: 'Supervisión', requiresAuth: true } });
  registerRoute('/supervision/detalle/:ide/:idi', DetalleIncidencia, { meta: { title: 'Detalle de incidencia', requiresAuth: true } });
  registerRoute('/supervision/detalle/:ide/:idi/', DetalleIncidencia, { meta: { title: 'Detalle de incidencia', requiresAuth: true } });
  registerRoute('/tareas', Tareas, { meta: { title: 'Tareas', requiresAuth: true } });
  registerRoute('/tareas/:taskId', TareaDetalle, { meta: { title: 'tarea-detalle', requiresAuth: true } });
  registerRoute('/timeline', Timeline, { meta: { title: 'Timeline', requiresAuth: true } });

  initRouter(content, {
    beforeEach: async (context) => {
      if (context?.meta?.requiresAuth) {
        const sessionCheck = await getUser();
        const sessionValid = Boolean(sessionCheck?.success) && hasSessionUserIdentity(sessionCheck);

        if (!sessionValid) {
          setUser(null);
          await handleSessionExpired('ROUTE_GUARD');
          return false;
        }
      }

      document.title = `${context.meta.title || 'Inicio'} - Movilizandome`;
      window.scrollTo(0, 0);
      return true;
    },
    notFound: (root, path) => {
      root.innerHTML = `
        <div class="uk-container uk-margin-top">
          <div class="uk-alert-warning" uk-alert>
            <h2>404 - Página no encontrada</h2>
            <p>La ruta <code>${path}</code> no existe.</p>
            <button class="uk-button uk-button-default" onclick="window.history.back()">
              <span uk-icon="arrow-left"></span> Volver
            </button>
          </div>
        </div>
      `;
    }
  });

  const hash = window.location.hash.slice(1);
  if (!hash) {
    navigate('/inicio', { replace: true });
  } else {
    render(hash);
  }
}
