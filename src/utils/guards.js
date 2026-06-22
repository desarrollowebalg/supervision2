/**
 * Guards personalizados para protección de rutas
 */

import { getUserState } from '../core/store.js';
import { api } from '../core/services/api.js';

/**
 * Guard que requiere email verificado
 * @param {String} redirectPath - Ruta de redirección si el email no está verificado
 * @returns {Function} Guard function
 */
export function requireEmailVerified(redirectPath = '/verify-email') {
  return async (context) => {
    const user = getUserState();
    
    if (!user.isAuthenticated) {
      return '/login';
    }
    
    if (!user.emailVerified) {
      return redirectPath;
    }
    
    return true;
  };
}

/**
 * Guard que requiere permisos específicos
 * @param {Array} permissions - Lista de permisos requeridos
 * @param {String} redirectPath - Ruta de redirección si no tiene permisos
 * @returns {Function} Guard function
 */
export function requirePermissions(permissions = [], redirectPath = '/forbidden') {
  return async (context) => {
    const user = getUserState();
    
    if (!user.isAuthenticated) {
      return '/login';
    }
    
    try {
      const response = await api('/api/user/permissions');
      
      if (!response.success) {
        return redirectPath;
      }
      
      const userPermissions = response.data.permissions || [];
      const hasAllPermissions = permissions.every(p => userPermissions.includes(p));
      
      if (!hasAllPermissions) {
        return redirectPath;
      }
      
      return true;
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return redirectPath;
    }
  };
}

/**
 * Guard que requiere suscripción activa
 * @param {String} redirectPath - Ruta de redirección si no tiene suscripción
 * @returns {Function} Guard function
 */
export function requireSubscription(redirectPath = '/subscribe') {
  return async (context) => {
    const user = getUserState();
    
    if (!user.isAuthenticated) {
      return '/login';
    }
    
    if (!user.subscription || user.subscription.status !== 'active') {
      return redirectPath;
    }
    
    return true;
  };
}

/**
 * Guard combinado que permite encadenar múltiples guards
 * @param {Array<Function>} guards - Array de guards a ejecutar en orden
 * @returns {Function} Guard function
 */
export function combineGuards(guards = []) {
  return async (context) => {
    for (const guard of guards) {
      const result = await guard(context);
      
      // Si algún guard retorna false o una ruta, detener y retornar ese resultado
      if (result !== true) {
        return result;
      }
    }
    
    return true;
  };
}

/**
 * Guard que solo permite acceso en modo desarrollo
 * @returns {Function} Guard function
 */
export function requireDevelopmentMode() {
  return async (context) => {
    const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      return '/';
    }
    
    return true;
  };
}

/**
 * Guard que verifica rate limiting
 * @param {Number} maxRequests - Máximo de requests permitidos
 * @param {Number} timeWindow - Ventana de tiempo en ms
 * @param {String} redirectPath - Ruta de redirección si excede el límite
 * @returns {Function} Guard function
 */
export function requireRateLimit(maxRequests = 10, timeWindow = 60000, redirectPath = '/rate-limit') {
  const requests = new Map();
  
  return async (context) => {
    const user = getUserState();
    const userId = user?.id || 'anonymous';
    const now = Date.now();
    
    if (!requests.has(userId)) {
      requests.set(userId, []);
    }
    
    const userRequests = requests.get(userId);
    
    // Limpiar requests antiguos
    const validRequests = userRequests.filter(timestamp => now - timestamp < timeWindow);
    
    if (validRequests.length >= maxRequests) {
      return redirectPath;
    }
    
    validRequests.push(now);
    requests.set(userId, validRequests);
    
    return true;
  };
}

/**
 * Guard que verifica si el usuario es el propietario del recurso
 * @param {Function} getOwnerId - Función que retorna el ID del propietario basado en el contexto
 * @param {String} redirectPath - Ruta de redirección si no es el propietario
 * @returns {Function} Guard function
 */
export function requireOwnership(getOwnerId, redirectPath = '/forbidden') {
  return async (context) => {
    const user = getUserState();
    
    if (!user.isAuthenticated) {
      return '/login';
    }
    
    try {
      const ownerId = await getOwnerId(context);
      
      if (user.id !== ownerId) {
        return redirectPath;
      }
      
      return true;
    } catch (error) {
      console.error('Error al verificar ownership:', error);
      return redirectPath;
    }
  };
}
