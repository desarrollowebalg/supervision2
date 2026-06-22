/**
 * Router mejorado con Hash Routing (#)
 * Compatible con arquitectura PHP híbrida
 * 
 * Soporte para:
 * - Hash routing (#/ruta)
 * - Parámetros de ruta (:id, :slug)
 * - Navigation guards (beforeEnter, beforeEach)
 * - Query strings
 * - Lazy loading de componentes
 * - Botones atrás/adelante
 */

const routes = [];
let root = null;
let currentInstance = null;
let globalBeforeEach = null;
let notFoundHandler = null;

/**
 * Inicializa el router en un contenedor específico
 * @param {HTMLElement} container - Contenedor donde se renderizarán las rutas
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.beforeEach - Guard global que se ejecuta antes de cada navegación
 * @param {Function} options.notFound - Handler personalizado para rutas no encontradas
 */
export function initRouter(container, options = {}) {
  root = container;
  
  if (options.beforeEach) {
    globalBeforeEach = options.beforeEach;
  }
  
  if (options.notFound) {
    notFoundHandler = options.notFound;
  }

  // Soporta botón atrás/adelante con hash routing
  window.addEventListener('hashchange', () => {
    const path = getHashPath();
    render(path);
  });

  // NO renderizar aquí - se hace manualmente desde main.js
  // Esto permite control sobre la carga inicial
}

/**
 * Registra una ruta con su componente asociado
 * @param {String} path - Path de la ruta (puede incluir parámetros como /user/:id)
 * @param {Function|Class} Component - Componente o función async que retorna componente
 * @param {Object} options - Opciones de la ruta
 * @param {Function} options.beforeEnter - Guard específico de esta ruta
 * @param {Object} options.meta - Metadata adicional de la ruta
 */
export function registerRoute(path, Component, options = {}) {
  routes.push({
    path,
    pattern: pathToRegex(path),
    Component,
    beforeEnter: options.beforeEnter,
    meta: options.meta || {}
  });
}

/**
 * Navega a una ruta específica usando hash routing
 * @param {String} path - Path destino (ej: '/dashboard')
 * @param {Object} options - Opciones de navegación
 * @param {Boolean} options.replace - Reemplazar hash actual (no agrega al historial)
 * @param {Object} options.state - Estado adicional (almacenado en sessionStorage)
 */
export function navigate(path, options = {}) {
  const state = options.state || {};
  
  // Guardar estado en sessionStorage si existe
  if (Object.keys(state).length > 0) {
    sessionStorage.setItem(`router_state_${path}`, JSON.stringify(state));
  }
  
  // Cambiar el hash (esto dispara hashchange automáticamente)
  if (options.replace) {
    window.location.replace(`#${path}`);
  } else {
    window.location.hash = path;
  }
  
  // Emitir evento personalizado para hooks externos
  window.dispatchEvent(new CustomEvent('router:navigation', {
    detail: { path, state, replace: options.replace }
  }));
}

/**
 * Obtiene parámetros de query string de la URL actual
 * @returns {Object} Objeto con los parámetros de query
 */
export function getQueryParams(path = '') {
  const queryString = String(path || '').includes('?')
    ? String(path).split('?')[1]
    : window.location.search.slice(1);
  const searchParams = new URLSearchParams(queryString);
  const params = {};
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Obtiene el path actual desde el hash
 * @returns {String} Path actual
 */
export function getCurrentPath() {
  return getHashPath();
}

/**
 * Extrae el path del hash de la URL
 * @returns {String} Path extraído del hash o '/inicio' por defecto
 */
function getHashPath() {
  const hash = window.location.hash.slice(1); // Quitar el #
  return hash || '/inicio';
}

/**
 * Convierte un path con parámetros a expresión regular
 * @param {String} path - Path con parámetros (ej: /user/:id)
 * @returns {Object} Objeto con regex y nombres de parámetros
 */
function pathToRegex(path) {
  const paramNames = [];
  
  // Convertir :param a grupos de captura
  const regexPattern = path
    .replace(/\//g, '\\/')
    .replace(/:([^\/]+)/g, (match, paramName) => {
      paramNames.push(paramName);
      return '([^\\/]+)';
    });
  
  return {
    regex: new RegExp(`^${regexPattern}$`),
    paramNames
  };
}

/**
 * Encuentra la ruta que coincide con el path dado
 * @param {String} path - Path a buscar
 * @returns {Object|null} Objeto con la ruta y parámetros extraídos
 */
function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.pattern.regex);
    
    if (match) {
      const params = {};
      route.pattern.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      
      return {
        route,
        params
      };
    }
  }
  
  return null;
}

/**
 * Renderiza una ruta específica
 * @param {String} path - Path a renderizar
 * @param {Object} state - Estado de navegación (opcional)
 */
export async function render(path, state = {}) {
  // Recuperar estado de sessionStorage si no se proporciona
  if (Object.keys(state).length === 0) {
    const savedState = sessionStorage.getItem(`router_state_${path}`);
    if (savedState) {
      state = JSON.parse(savedState);
    }
  }
  
  // Limpiar query string para match de ruta
  const cleanPath = path.split('?')[0];
  const matched = matchRoute(cleanPath);
  
  if (!matched) {
    renderNotFound(path);
    return;
  }
  
  const { route, params } = matched;
  const query = getQueryParams(path);
  
  // Preparar contexto de navegación
  const navigationContext = {
    path: cleanPath,
    fullPath: path,
    params,
    query,
    state,
    meta: route.meta
  };
  
  // Ejecutar guard global
  if (globalBeforeEach) {
    const shouldContinue = await executeGuard(globalBeforeEach, navigationContext);
    if (!shouldContinue) return;
  }
  
  // Ejecutar guard específico de ruta
  if (route.beforeEnter) {
    const shouldContinue = await executeGuard(route.beforeEnter, navigationContext);
    if (!shouldContinue) return;
  }
  
  // Destruir instancia anterior si existe
  if (currentInstance && typeof currentInstance.destroy === 'function') {
    currentInstance.destroy();
  }
  
  // Mostrar loading si es componente lazy
  if (typeof route.Component === 'function' && route.Component.constructor.name === 'AsyncFunction') {
    showLoading();
  }
  
  try {
    // Cargar componente (puede ser lazy loaded)
    let Component = route.Component;
    
    if (typeof Component === 'function' && Component.constructor.name === 'AsyncFunction') {
      const module = await Component();
      Component = module.default || module;
    }
    
    // Instanciar y renderizar
    currentInstance = new Component(navigationContext);
    currentInstance.render(root, params, query);
    
    hideLoading();
  } catch (error) {
    console.error('Error al cargar componente:', error);
    renderError(error);
  }
}

/**
 * Ejecuta un guard y retorna si debe continuar
 * @param {Function} guard - Función guard
 * @param {Object} context - Contexto de navegación
 * @returns {Promise<Boolean>} True si debe continuar, false si debe cancelar
 */
async function executeGuard(guard, context) {
  try {
    const result = await guard(context);
    
    // Si retorna false, cancelar navegación
    if (result === false) {
      return false;
    }
    
    // Si retorna string, redirigir a esa ruta
    if (typeof result === 'string') {
      navigate(result);
      return false;
    }
    
    // Por defecto, continuar
    return true;
  } catch (error) {
    console.error('Error en navigation guard:', error);
    return false;
  }
}

/**
 * Renderiza página 404
 */
function renderNotFound(path) {
  if (notFoundHandler) {
    notFoundHandler(root, path);
  } else {
    root.innerHTML = `
      <div class="uk-alert-danger" uk-alert>
        <h2>404 - Página no encontrada</h2>
        <p>La ruta <code>${path}</code> no existe.</p>
      </div>
    `;
  }
}

/**
 * Renderiza página de error
 */
function renderError(error) {
  root.innerHTML = `
    <div class="uk-alert-danger" uk-alert>
      <h2>Error al cargar la página</h2>
      <p>${error.message}</p>
    </div>
  `;
}

/**
 * Muestra indicador de loading
 */
function showLoading() {
  const loader = document.createElement('div');
  loader.id = 'router-loader';
  loader.className = 'uk-text-center uk-margin-large-top';
  loader.innerHTML = '<div uk-spinner="ratio: 2"></div>';
  root.innerHTML = '';
  root.appendChild(loader);
}

/**
 * Oculta indicador de loading
 */
function hideLoading() {
  const loader = document.getElementById('router-loader');
  if (loader) {
    loader.remove();
  }
}

/**
 * Helper: Crea un guard que requiere autenticación
 * @param {String} redirectPath - Path de redirección si no está autenticado
 * @returns {Function} Guard function
 */
export function requireAuth(redirectPath = '/login') {
  return async (context) => {
    const { getUserState } = await import('./store.js');
    const user = getUserState();
    
    if (!user.isAuthenticated) {
      return redirectPath;
    }
    
    return true;
  };
}

/**
 * Helper: Crea un guard que requiere roles específicos
 * @param {Array} roles - Roles permitidos
 * @param {String} redirectPath - Path de redirección si no tiene el rol
 * @returns {Function} Guard function
 */
export function requireRole(roles = [], redirectPath = '/unauthorized') {
  return async (context) => {
    const { getUserState } = await import('./store.js');
    const user = getUserState();
    
    if (!user.isAuthenticated) {
      return '/login';
    }
    
    if (roles.length && !roles.includes(user.role)) {
      return redirectPath;
    }
    
    return true;
  };
}
