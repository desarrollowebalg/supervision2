import '../../core/bootstrap.js';
import '../../styles/global.css';

import { initApp } from '../../core/bootstrap.js';
import { getUserState } from '../../core/store.js';

import { 
  initRouter, 
  registerRoute, 
  navigate, 
  requireAuth,
  requireRole 
} from '../../core/router.js';

// import { requireEmailVerified, combineGuards } from '../../utils/guards.js';

// import App from './App.js';
// import Inicio from '../../pages/Inicio.js';
// import Dashboard from '../../pages/Dashboard.js';

// Inicializar PWA
import '../../utils/pwa-register.js';

await initApp();

const user = getUserState();
console.log('Usuario actual:', user);

if (!user.isAuthenticated) {
  window.location.href = '/login/default';
} else {
  const container = document.querySelector("#appMain");
  const app = new App();
  app.render(container);

  const content = document.querySelector("#appContent");
  
  // Registrar rutas
  registerRoute('/inicio', Inicio, {
    meta: {
      title: 'Inicio',
      requiresAuth: true
    }
  });

  registerRoute('/dashboard', Dashboard, {
    meta: {
      title: 'Dashboard',
      requiresAuth: true
    }
  });

  registerRoute('/usuarios', async () => {
    return await import('../../pages/Users.js');
  }, {
    beforeEnter: requireAuth('/login'),
    meta: {
      title: 'Usuarios',
      requiresAuth: true
    }
  });

  registerRoute('/user/:id', async () => {
    return await import('../../pages/UserDetail.js');
  }, {
    beforeEnter: requireAuth('/login'),
    meta: {
      title: 'Detalles de Usuario',
      requiresAuth: true
    }
  });

  registerRoute('/search', async () => {
    return await import('../../pages/SearchResults.js');
  }, {
    meta: {
      title: 'Búsqueda'
    }
  });

  initRouter(content, {
    beforeEach: async (context) => {
      console.log('[Router] Navegando a:', context.path);
      
      if (context.meta.title) {
        document.title = `${context.meta.title} - Mi Aplicación`;
      }
      
      window.scrollTo(0, 0);
      
      return true;
    },
    notFound: (container, path) => {
      container.innerHTML = `
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

  // Navegación inicial con hash routing
  // URL: /app/default/OTU0#/dashboard
  const hash = window.location.hash.slice(1); // Quitar el #
  
  if (!hash || hash === '') {
    // Si no hay hash, navegar a inicio (esto establece el hash #/inicio)
    console.log('[App] No hay hash, navegando a /inicio');
    navigate('/inicio', { replace: true });
  } else {
    // Si hay hash, renderizar esa ruta
    console.log('[App] Cargando ruta desde hash:', hash);
    const { render } = await import('../../core/router.js');
    render(hash);
  }
}
