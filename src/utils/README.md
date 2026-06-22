# Utilidades - Documentación

## Visión General

Directorio de utilidades compartidas y helpers reutilizables en toda la aplicación.

---

## Archivos

### guards.js

**Propósito:** Guards personalizados para protección de rutas en el router.

**Guards Disponibles:**

#### `requireEmailVerified(redirectPath)`

Requiere que el usuario tenga su email verificado.

```javascript
import { requireEmailVerified } from '../utils/guards.js';
import { registerRoute } from '../core/router.js';

registerRoute('/settings', Settings, {
  beforeEnter: requireEmailVerified('/verify-email')
});
```

**Parámetros:**
- `redirectPath` (String, default: '/verify-email') - Ruta de redirección si el email no está verificado

---

#### `requirePermissions(permissions, redirectPath)`

Requiere que el usuario tenga permisos específicos.

```javascript
import { requirePermissions } from '../utils/guards.js';

registerRoute('/admin/users', AdminUsers, {
  beforeEnter: requirePermissions(['users.read', 'users.write'], '/forbidden')
});
```

**Parámetros:**
- `permissions` (Array<String>) - Lista de permisos requeridos
- `redirectPath` (String, default: '/forbidden') - Ruta de redirección si no tiene permisos

---

#### `requireSubscription(redirectPath)`

Requiere que el usuario tenga una suscripción activa.

```javascript
import { requireSubscription } from '../utils/guards.js';

registerRoute('/premium', PremiumContent, {
  beforeEnter: requireSubscription('/subscribe')
});
```

**Parámetros:**
- `redirectPath` (String, default: '/subscribe') - Ruta de redirección si no tiene suscripción

---

#### `combineGuards(guards)`

Combina múltiples guards que se ejecutarán en orden.

```javascript
import { combineGuards, requireEmailVerified } from '../utils/guards.js';
import { requireAuth } from '../core/router.js';

registerRoute('/profile/edit', ProfileEdit, {
  beforeEnter: combineGuards([
    requireAuth('/login'),
    requireEmailVerified('/verify-email')
  ])
});
```

**Parámetros:**
- `guards` (Array<Function>) - Array de guards a ejecutar en secuencia

**Comportamiento:**
- Si algún guard retorna `false` o una ruta, se detiene la ejecución
- Los guards se ejecutan en el orden del array
- Útil para aplicar múltiples validaciones

---

#### `requireDevelopmentMode()`

Solo permite acceso en modo desarrollo.

```javascript
import { requireDevelopmentMode } from '../utils/guards.js';

registerRoute('/debug', DebugPanel, {
  beforeEnter: requireDevelopmentMode()
});
```

**Uso:** Rutas de debugging o testing que solo deben estar disponibles en desarrollo.

---

#### `requireRateLimit(maxRequests, timeWindow, redirectPath)`

Verifica rate limiting para prevenir abuso.

```javascript
import { requireRateLimit } from '../utils/guards.js';

registerRoute('/api-intensive', ApiIntensive, {
  beforeEnter: requireRateLimit(10, 60000, '/rate-limit-exceeded')
});
```

**Parámetros:**
- `maxRequests` (Number, default: 10) - Máximo de requests permitidos
- `timeWindow` (Number, default: 60000) - Ventana de tiempo en milisegundos
- `redirectPath` (String, default: '/rate-limit') - Ruta de redirección si excede el límite

**Ejemplo:** 10 requests por minuto

---

#### `requireOwnership(getOwnerId, redirectPath)`

Verifica que el usuario sea el propietario del recurso.

```javascript
import { requireOwnership } from '../utils/guards.js';
import api from '../core/services/api.js';

registerRoute('/profile/:userId/edit', ProfileEdit, {
  beforeEnter: requireOwnership(
    async (context) => {
      const response = await api(`/users/${context.params.userId}`);
      return response.data.id;
    },
    '/forbidden'
  )
});
```

**Parámetros:**
- `getOwnerId` (Function) - Función async que retorna el ID del propietario basado en el contexto
- `redirectPath` (String, default: '/forbidden') - Ruta de redirección si no es el propietario

---

## Ejemplos de Uso

### Ejemplo 1: Guard Simple

```javascript
import { registerRoute } from '../core/router.js';
import { requireEmailVerified } from '../utils/guards.js';
import Settings from '../pages/Settings.js';

registerRoute('/settings', Settings, {
  beforeEnter: requireEmailVerified()
});
```

### Ejemplo 2: Guards Combinados

```javascript
import { combineGuards, requireEmailVerified, requireSubscription } from '../utils/guards.js';
import { requireAuth } from '../core/router.js';

registerRoute('/premium/content', PremiumContent, {
  beforeEnter: combineGuards([
    requireAuth('/login'),
    requireEmailVerified('/verify-email'),
    requireSubscription('/subscribe')
  ])
});
```

### Ejemplo 3: Guard Personalizado en el Archivo

```javascript
// En tu archivo de rutas
import { registerRoute } from '../core/router.js';
import { getUserState } from '../core/store.js';

registerRoute('/special', SpecialPage, {
  beforeEnter: async (context) => {
    const user = getUserState();
    
    // Lógica personalizada
    if (!user.specialAccess) {
      return '/no-access';
    }
    
    // Verificación asíncrona
    const response = await api('/check-access');
    if (!response.success) {
      return '/error';
    }
    
    return true;
  }
});
```

### Ejemplo 4: Guard con Permisos Complejos

```javascript
import { requirePermissions } from '../utils/guards.js';

registerRoute('/admin/analytics', Analytics, {
  beforeEnter: requirePermissions(
    ['analytics.view', 'analytics.export'],
    '/insufficient-permissions'
  )
});
```

---

## Crear Guards Personalizados

### Template de Guard

```javascript
/**
 * Guard personalizado de ejemplo
 * @param {*} param - Parámetro de configuración
 * @returns {Function} Guard function
 */
export function myCustomGuard(param) {
  return async (context) => {
    // context contiene: path, params, query, state, meta
    
    // Realizar validaciones
    const isValid = await someValidation(context, param);
    
    if (!isValid) {
      return '/redirect-path';  // Redirigir
    }
    
    return true;  // Continuar
  };
}
```

### Ejemplo: Guard de Horario

```javascript
export function requireBusinessHours(redirectPath = '/closed') {
  return async (context) => {
    const now = new Date();
    const hour = now.getHours();
    
    // Solo permitir entre 9 AM y 6 PM
    if (hour < 9 || hour >= 18) {
      return redirectPath;
    }
    
    return true;
  };
}

// Uso
registerRoute('/support-chat', SupportChat, {
  beforeEnter: requireBusinessHours('/outside-hours')
});
```

---

## Mejores Prácticas

### 1. Retornar Valores Correctos

```javascript
// ✅ Correcto
beforeEnter: async (context) => {
  if (invalid) return '/redirect';  // Redirigir
  return true;                      // Continuar
}

// ❌ Incorrecto
beforeEnter: async (context) => {
  if (invalid) navigate('/redirect');  // Causa navegación doble
  return;                              // Undefined = continuar
}
```

### 2. Usar combineGuards para Múltiples Validaciones

```javascript
// ✅ Correcto - Fácil de leer y mantener
beforeEnter: combineGuards([
  requireAuth(),
  requireEmailVerified(),
  requireSubscription()
])

// ❌ Evitar - Guard anidado complejo
beforeEnter: async (context) => {
  if (!user) return '/login';
  if (!user.emailVerified) return '/verify';
  if (!user.subscription) return '/subscribe';
  return true;
}
```

### 3. Manejar Errores Apropiadamente

```javascript
export function myGuard() {
  return async (context) => {
    try {
      const result = await api('/check');
      return result.success ? true : '/error';
    } catch (error) {
      console.error('Error en guard:', error);
      return '/error';  // No dejar pasar en caso de error
    }
  };
}
```

### 4. Guards Reutilizables

```javascript
// helpers/guards.js - Centralizar guards comunes
export const authGuard = requireAuth('/login');
export const emailGuard = requireEmailVerified('/verify');
export const adminGuard = requireRole(['admin'], '/unauthorized');

// Uso en múltiples rutas
import { authGuard, emailGuard } from '../helpers/guards.js';

registerRoute('/settings', Settings, { beforeEnter: authGuard });
registerRoute('/profile', Profile, { beforeEnter: combineGuards([authGuard, emailGuard]) });
```

---

## Utilidades Futuras

Este directorio está preparado para recibir más utilidades según sea necesario:

### validators.js (Futuro)

Validaciones de datos reutilizables:

```javascript
// Ejemplo de estructura futura
export function validateEmail(email) { ... }
export function validatePhone(phone) { ... }
export function validatePassword(password) { ... }
```

### formatters.js (Futuro)

Formateo de datos:

```javascript
// Ejemplo de estructura futura
export function formatDate(date) { ... }
export function formatCurrency(amount) { ... }
export function formatFileSize(bytes) { ... }
```

### dom.js (Futuro)

Helpers de DOM:

```javascript
// Ejemplo de estructura futura
export function debounce(fn, delay) { ... }
export function throttle(fn, limit) { ... }
export function createElement(tag, attrs, children) { ... }
```

---

## Convenciones

1. **Naming:** camelCase para funciones, PascalCase para clases
2. **Exports:** Named exports preferidos sobre default export
3. **Documentación:** JSDoc para todas las funciones exportadas
4. **Testing:** Cada utilidad debe ser testeable de forma aislada
5. **Dependencies:** Minimizar dependencias externas

---

**Actualizado:** Fase 2 - 20 de abril de 2026
