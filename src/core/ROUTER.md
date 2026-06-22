# Router - Documentación Completa

## Visión General

Sistema de routing mejorado para SPAs con soporte completo para:

- ✅ Parámetros de ruta dinámicos (`:id`, `:slug`)
- ✅ Navigation guards (globales y por ruta)
- ✅ Query strings
- ✅ Lazy loading de componentes
- ✅ Navegación avanzada (replace, state)
- ✅ Eventos de navegación personalizados
- ✅ Manejo de errores y 404

---

## Inicialización

### Básica

```javascript
import { initRouter } from './core/router.js';

const container = document.querySelector('#app-content');
initRouter(container);
```

### Con Opciones

```javascript
import { initRouter } from './core/router.js';

const container = document.querySelector('#app-content');

initRouter(container, {
  // Guard global - se ejecuta antes de cada navegación
  beforeEach: async (context) => {
    console.log('Navegando a:', context.path);
    
    // Retornar false cancela la navegación
    // Retornar string redirige a esa ruta
    // Retornar true o nada continúa normalmente
    return true;
  },
  
  // Handler personalizado para rutas no encontradas
  notFound: (container, path) => {
    container.innerHTML = `
      <h1>Oops!</h1>
      <p>La página ${path} no existe</p>
      <a href="/">Volver al inicio</a>
    `;
  }
});
```

---

## Registro de Rutas

### Rutas Estáticas

```javascript
import { registerRoute } from './core/router.js';
import Dashboard from './pages/Dashboard.js';
import Profile from './pages/Profile.js';

// Ruta simple
registerRoute('/dashboard', Dashboard);
registerRoute('/profile', Profile);
```

### Rutas con Parámetros

```javascript
import UserDetail from './pages/UserDetail.js';
import PostView from './pages/PostView.js';

// Un parámetro
registerRoute('/user/:id', UserDetail);

// Múltiples parámetros
registerRoute('/post/:category/:slug', PostView);

// Los parámetros estarán disponibles en el componente
```

### Rutas con Guards

```javascript
import { registerRoute, requireAuth } from './core/router.js';
import AdminPanel from './pages/AdminPanel.js';

// Guard de autenticación
registerRoute('/admin', AdminPanel, {
  beforeEnter: requireAuth('/login')
});

// Guard personalizado
registerRoute('/settings', Settings, {
  beforeEnter: async (context) => {
    const user = getUserState();
    
    if (!user.emailVerified) {
      return '/verify-email';  // Redirigir
    }
    
    return true;  // Continuar
  }
});
```

### Rutas con Metadata

```javascript
registerRoute('/admin/users', AdminUsers, {
  meta: {
    requiresAuth: true,
    roles: ['admin', 'superadmin'],
    title: 'Gestión de Usuarios'
  }
});

// La metadata está disponible en context.meta
```

### Rutas con Lazy Loading

```javascript
// Lazy loading - el componente se carga solo cuando se accede a la ruta
registerRoute('/reports', async () => {
  return await import('./pages/Reports.js');
});

registerRoute('/analytics', async () => {
  const module = await import('./pages/Analytics.js');
  return module.default;
});
```

**Ventajas:**
- Reduce el bundle inicial
- Componentes se cargan bajo demanda
- Mejor performance inicial

---

## Navegación

### Navegación Básica

```javascript
import { navigate } from './core/router.js';

// Navegar a una ruta
navigate('/dashboard');

// Con parámetros
navigate('/user/123');

// Con query strings
navigate('/search?q=javascript&page=2');
```

### Navegación Avanzada

```javascript
import { navigate } from './core/router.js';

// Replace - no agrega a historial
navigate('/dashboard', { replace: true });

// Con estado personalizado
navigate('/profile', {
  state: { from: 'settings', scrollPosition: 100 }
});

// El estado es accesible en el componente vía context.state
```

### Navegación desde HTML

```javascript
// En el componente
render(container) {
  container.innerHTML = `
    <button data-route="/dashboard">Ir a Dashboard</button>
    <a href="/profile" class="nav-link">Mi Perfil</a>
  `;
  
  this.bindEvents(container);
}

bindEvents(container) {
  // Navegación con botones
  container.querySelectorAll('[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(btn.dataset.route);
    });
  });
  
  // Navegación con links
  container.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.getAttribute('href'));
    });
  });
}
```

---

## Componentes

### Estructura Básica

```javascript
export default class MiComponente {
  constructor(context = {}) {
    // context contiene: path, params, query, state, meta
    this.context = context;
  }

  render(container, params = {}, query = {}) {
    container.innerHTML = `
      <h1>Usuario: ${params.id || 'N/A'}</h1>
      <p>Filtro: ${query.filter || 'ninguno'}</p>
    `;
  }
  
  destroy() {
    // Limpieza de recursos
  }
}
```

### Acceso a Parámetros de Ruta

```javascript
// Ruta registrada: /user/:id
export default class UserDetail {
  constructor(context) {
    this.userId = context.params.id;
  }

  render(container) {
    container.innerHTML = `
      <h1>Detalles del Usuario ${this.userId}</h1>
    `;
    
    this.loadUserData(this.userId);
  }
  
  async loadUserData(id) {
    const response = await api(`/users/${id}`);
    // Actualizar UI...
  }
}
```

### Acceso a Query Strings

```javascript
import { getQueryParams } from './core/router.js';

export default class SearchResults {
  constructor(context) {
    this.query = context.query.q || '';
    this.page = parseInt(context.query.page) || 1;
  }

  render(container) {
    container.innerHTML = `
      <h1>Resultados para: "${this.query}"</h1>
      <p>Página ${this.page}</p>
    `;
    
    this.loadResults();
  }
  
  async loadResults() {
    const params = getQueryParams();
    const response = await api(`/search?q=${params.q}&page=${params.page}`);
    // Renderizar resultados...
  }
}
```

### Acceso al Estado de Navegación

```javascript
export default class Profile {
  constructor(context) {
    // Estado pasado desde la navegación anterior
    this.fromPage = context.state?.from || 'unknown';
    this.scrollPosition = context.state?.scrollPosition || 0;
  }

  render(container) {
    container.innerHTML = `
      <h1>Perfil</h1>
      <p>Viniste desde: ${this.fromPage}</p>
    `;
    
    // Restaurar scroll si es necesario
    setTimeout(() => {
      window.scrollTo(0, this.scrollPosition);
    }, 0);
  }
}
```

---

## Navigation Guards

### Guard Global (beforeEach)

Se ejecuta antes de **todas** las navegaciones:

```javascript
initRouter(container, {
  beforeEach: async (context) => {
    // Logging
    console.log(`[Router] ${context.path}`);
    
    // Validar autenticación global
    if (context.meta.requiresAuth) {
      const user = getUserState();
      if (!user) {
        return '/login';  // Redirigir
      }
    }
    
    // Actualizar título de página
    document.title = context.meta.title || 'Mi App';
    
    return true;  // Continuar
  }
});
```

### Guard por Ruta (beforeEnter)

Se ejecuta solo para esa ruta específica:

```javascript
registerRoute('/admin', AdminPanel, {
  beforeEnter: async (context) => {
    const user = getUserState();
    
    // Validar rol
    if (!['admin', 'superadmin'].includes(user?.role)) {
      return '/unauthorized';
    }
    
    // Validar permisos adicionales
    const hasPermission = await checkPermission(user.id, 'admin.access');
    if (!hasPermission) {
      return '/forbidden';
    }
    
    return true;
  }
});
```

### Helpers de Guards

#### requireAuth

```javascript
import { requireAuth } from './core/router.js';

// Redirige a /login si no hay usuario
registerRoute('/dashboard', Dashboard, {
  beforeEnter: requireAuth()
});

// Redirige a ruta personalizada
registerRoute('/profile', Profile, {
  beforeEnter: requireAuth('/signin')
});
```

#### requireRole

```javascript
import { requireRole } from './core/router.js';

// Solo usuarios con rol admin o moderator
registerRoute('/admin', AdminPanel, {
  beforeEnter: requireRole(['admin', 'moderator'])
});

// Redirige a ruta personalizada si no tiene el rol
registerRoute('/superadmin', SuperAdmin, {
  beforeEnter: requireRole(['superadmin'], '/access-denied')
});
```

#### Guards Personalizados

```javascript
// helpers/guards.js
export function requireEmailVerified(redirectPath = '/verify-email') {
  return async (context) => {
    const user = getUserState();
    
    if (!user?.emailVerified) {
      return redirectPath;
    }
    
    return true;
  };
}

export function requireSubscription(redirectPath = '/subscribe') {
  return async (context) => {
    const user = getUserState();
    
    if (!user?.subscription || user.subscription.status !== 'active') {
      return redirectPath;
    }
    
    return true;
  };
}

// Uso
import { requireEmailVerified, requireSubscription } from './helpers/guards.js';

registerRoute('/premium-content', PremiumContent, {
  beforeEnter: async (context) => {
    // Combinar múltiples guards
    let result = await requireAuth()(context);
    if (result !== true) return result;
    
    result = await requireEmailVerified()(context);
    if (result !== true) return result;
    
    result = await requireSubscription()(context);
    return result;
  }
});
```

---

## Utilidades

### getCurrentPath()

```javascript
import { getCurrentPath } from './core/router.js';

const path = getCurrentPath();
console.log(path);  // '/dashboard' (sin query strings)
```

### getQueryParams()

```javascript
import { getQueryParams } from './core/router.js';

// URL: /search?q=javascript&page=2&sort=date
const params = getQueryParams();
console.log(params);
// { q: 'javascript', page: '2', sort: 'date' }
```

---

## Eventos

### router:navigation

Evento emitido en cada navegación:

```javascript
window.addEventListener('router:navigation', (event) => {
  const { path, state, replace } = event.detail;
  
  console.log('Navegación a:', path);
  console.log('Es replace:', replace);
  console.log('Estado:', state);
  
  // Analytics tracking
  trackPageView(path);
  
  // Scroll to top
  window.scrollTo(0, 0);
});
```

---

## Ejemplos Completos

### Ejemplo 1: Aplicación Básica

```javascript
// main.js
import { initRouter, registerRoute, navigate } from './core/router.js';
import Home from './pages/Home.js';
import About from './pages/About.js';
import Contact from './pages/Contact.js';

const container = document.querySelector('#app');

// Inicializar
initRouter(container);

// Registrar rutas
registerRoute('/', Home);
registerRoute('/about', About);
registerRoute('/contact', Contact);

// Navegación inicial se hace automáticamente
```

### Ejemplo 2: Con Autenticación

```javascript
// main.js
import { initRouter, registerRoute, requireAuth } from './core/router.js';
import { getUserState } from './core/store.js';
import Dashboard from './pages/Dashboard.js';
import Profile from './pages/Profile.js';
import Login from './pages/Login.js';

const container = document.querySelector('#app');

initRouter(container, {
  beforeEach: async (context) => {
    // Verificar auth en rutas protegidas
    if (context.meta.requiresAuth) {
      const user = getUserState();
      if (!user) {
        return '/login';
      }
    }
    return true;
  }
});

// Rutas públicas
registerRoute('/login', Login);

// Rutas protegidas
registerRoute('/dashboard', Dashboard, {
  meta: { requiresAuth: true }
});

registerRoute('/profile', Profile, {
  beforeEnter: requireAuth('/login')
});
```

### Ejemplo 3: Con Parámetros y Lazy Loading

```javascript
// main.js
import { initRouter, registerRoute } from './core/router.js';
import UserList from './pages/UserList.js';

const container = document.querySelector('#app');
initRouter(container);

// Lista de usuarios
registerRoute('/users', UserList);

// Detalle de usuario (lazy loaded)
registerRoute('/users/:id', async () => {
  return await import('./pages/UserDetail.js');
});

// Post con categoría y slug
registerRoute('/blog/:category/:slug', async () => {
  return await import('./pages/PostView.js');
});
```

```javascript
// pages/UserDetail.js
export default class UserDetail {
  constructor(context) {
    this.userId = context.params.id;
  }

  render(container) {
    container.innerHTML = `
      <div id="user-${this.userId}">
        <div uk-spinner></div>
      </div>
    `;
    
    this.loadUser();
  }

  async loadUser() {
    const response = await api(`/users/${this.userId}`);
    
    const userDiv = document.getElementById(`user-${this.userId}`);
    userDiv.innerHTML = `
      <h1>${response.data.name}</h1>
      <p>${response.data.email}</p>
    `;
  }
}
```

### Ejemplo 4: Con Query Strings

```javascript
// Ruta: /products?category=electronics&sort=price&order=asc
import { getQueryParams } from './core/router.js';

export default class ProductList {
  constructor(context) {
    this.category = context.query.category || 'all';
    this.sort = context.query.sort || 'name';
    this.order = context.query.order || 'asc';
  }

  render(container) {
    container.innerHTML = `
      <h1>Productos - ${this.category}</h1>
      <div class="filters">
        <select id="category">...</select>
        <select id="sort">...</select>
      </div>
      <div id="products"></div>
    `;
    
    this.bindEvents(container);
    this.loadProducts();
  }

  bindEvents(container) {
    container.querySelector('#category').addEventListener('change', (e) => {
      const params = getQueryParams();
      params.category = e.target.value;
      
      const queryString = new URLSearchParams(params).toString();
      navigate(`/products?${queryString}`);
    });
  }

  async loadProducts() {
    const response = await api(`/products?category=${this.category}&sort=${this.sort}&order=${this.order}`);
    // Renderizar productos...
  }
}
```

---

## Migración desde Router Anterior

### Cambios Necesarios

**Antes:**
```javascript
registerRoute('/dashboard', Dashboard);
```

**Después:**
```javascript
// Si no usas parámetros, guards o lazy loading, funciona igual
registerRoute('/dashboard', Dashboard);

// Componentes ahora reciben context en constructor
export default class Dashboard {
  constructor(context) {  // ← NUEVO
    this.context = context;
  }
  
  render(container, params, query) {  // ← params y query opcionales
    // ...
  }
}
```

### Compatibilidad

El router es **retrocompatible**. Componentes antiguos sin constructor con context seguirán funcionando:

```javascript
// Esto sigue funcionando
export default class OldComponent {
  render(container) {
    container.innerHTML = '<h1>Funciona</h1>';
  }
}
```

---

## Mejores Prácticas

### 1. Usar Lazy Loading para Rutas Grandes

```javascript
// ❌ Evitar
import HeavyComponent from './pages/HeavyComponent.js';
registerRoute('/heavy', HeavyComponent);

// ✅ Mejor
registerRoute('/heavy', async () => {
  return await import('./pages/HeavyComponent.js');
});
```

### 2. Centralizar Guards Comunes

```javascript
// helpers/guards.js
export const requireAuth = requireAuth('/login');
export const requireAdmin = requireRole(['admin'], '/unauthorized');

// Uso
import { requireAuth, requireAdmin } from './helpers/guards.js';
```

### 3. Implementar destroy() en Componentes

```javascript
export default class MyComponent {
  render(container) {
    this.intervalId = setInterval(() => {
      // ...
    }, 1000);
  }
  
  destroy() {
    // ✅ Limpiar recursos
    clearInterval(this.intervalId);
  }
}
```

### 4. Usar Metadata para Configuración

```javascript
registerRoute('/admin', AdminPanel, {
  meta: {
    title: 'Panel de Administración',
    requiresAuth: true,
    roles: ['admin'],
    layout: 'admin-layout'
  }
});

// Usar en beforeEach
initRouter(container, {
  beforeEach: (context) => {
    document.title = context.meta.title || 'Mi App';
    return true;
  }
});
```

---

## Troubleshooting

### Los parámetros no se extraen correctamente

Verifica que el formato del path coincida:

```javascript
// ✅ Correcto
registerRoute('/user/:id', UserDetail);
navigate('/user/123');  // params.id = '123'

// ❌ Incorrecto
registerRoute('/user/:id', UserDetail);
navigate('/user');  // No match, 404
```

### El componente no se actualiza

Asegúrate de que el componente sea una clase nueva cada vez o implemente lógica de actualización:

```javascript
export default class MyComponent {
  constructor(context) {
    this.params = context.params;
  }
  
  render(container, params) {
    // Usar params pasado por parámetro, no this.params
    // El router instancia nuevo componente en cada navegación
  }
}
```

### Lazy loading no muestra spinner

El spinner de UIKit se muestra automáticamente. Verifica que UIKit esté cargado:

```javascript
import 'uikit/dist/js/uikit.min.js';
```

### Guard no cancela navegación

Verifica que retornes `false` o una ruta string:

```javascript
// ❌ No cancela
beforeEnter: (context) => {
  if (!user) {
    navigate('/login');  // Causa loop
  }
}

// ✅ Cancela y redirige
beforeEnter: (context) => {
  if (!user) {
    return '/login';  // Correcto
  }
  return true;
}
```

---

## API Reference

### Funciones Exportadas

- `initRouter(container, options)` - Inicializa el router
- `registerRoute(path, Component, options)` - Registra una ruta
- `navigate(path, options)` - Navega a una ruta
- `getQueryParams()` - Obtiene query parameters
- `getCurrentPath()` - Obtiene path actual
- `requireAuth(redirectPath)` - Helper guard de autenticación
- `requireRole(roles, redirectPath)` - Helper guard de roles

### Contexto de Navegación

```typescript
{
  path: string,         // Path limpio sin query
  fullPath: string,     // Path completo con query
  params: object,       // Parámetros de ruta extraídos
  query: object,        // Query parameters
  state: object,        // Estado de navegación
  meta: object          // Metadata de la ruta
}
```

---

**Actualizado:** Fase 2 - 20 de abril de 2026
