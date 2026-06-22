# Servicios - Documentación

## Estructura Actual

La aplicación utiliza una arquitectura de servicios en dos niveles:

### 1. Servicios Core (`src/core/services/`)

**Propósito:** Servicios de infraestructura y utilidades base que son transversales a toda la aplicación.

**Ubicación:** `src/core/services/`

**Servicios actuales:**

- **`api.js`** - Cliente HTTP genérico (wrapper de fetch)
  - Manejo de peticiones HTTP (GET, POST, PUT, DELETE)
  - Configuración de headers
  - Manejo básico de errores de red
  - Base para todos los servicios que consumen APIs

- **`authService.js`** - Servicios de autenticación
  - `login(username, password)` - Iniciar sesión
  - `logout()` - Cerrar sesión
  - `getUser()` - Obtener datos del usuario actual
  - Integración con el store de usuario

- **`storage.service.js`** - Abstracción de almacenamiento local
  - Implementación Singleton
  - API dual: localStorage + sessionStorage
  - `setItem()`, `getItem()`, `removeItem()`, `clear()`
  - `setSessionItem()`, `getSessionItem()`, etc.

**Características:**
- ✅ No dependen de lógica de negocio específica
- ✅ Reutilizables en cualquier módulo
- ✅ Abstracciones de bajo nivel

### 2. Servicios de Dominio (`src/services/`) - FUTURO

**Propósito:** Servicios específicos de lógica de negocio y dominios de la aplicación.

**Ubicación:** `src/services/` (se creará cuando sea necesario)

**Ejemplos de servicios futuros:**

- `userService.js` - Lógica de negocio de usuarios
  - CRUD de usuarios
  - Validaciones específicas de usuarios
  - Transformación de datos de usuario

- `notificationService.js` - Gestión de notificaciones
  - Envío de notificaciones
  - Historial de notificaciones
  - Preferencias de notificación

- `dashboardService.js` - Lógica del dashboard
  - Obtención de métricas
  - Cálculos y agregaciones
  - Integración de datos de múltiples fuentes

**Características futuras:**
- ⏳ Encapsulan lógica de negocio específica
- ⏳ Pueden usar servicios core como dependencias
- ⏳ Específicos a features/módulos de la aplicación

## Diferencias Clave

| Aspecto | Core Services | Domain Services |
|---------|--------------|-----------------|
| **Ubicación** | `src/core/services/` | `src/services/` |
| **Propósito** | Infraestructura base | Lógica de negocio |
| **Dependencias** | Ninguna o mínimas | Pueden usar core services |
| **Ejemplos** | HTTP, Auth, Storage | Users, Products, Orders |
| **Reutilización** | En toda la aplicación | En módulos específicos |
| **Abstracción** | Bajo nivel (técnica) | Alto nivel (negocio) |

## Patrones de Uso

### Uso de Servicios Core

```javascript
// Desde cualquier componente o módulo
import api from '../../core/services/api.js';
import { login, logout } from '../../core/services/authService.js';
import StorageService from '../../core/services/storage.service.js';

// Uso directo
const response = await api('/endpoint', { method: 'POST', body: data });
await login(username, password);
StorageService.getInstance().setItem('key', 'value');
```

### Uso de Servicios de Dominio (Futuro)

```javascript
// En componentes que necesitan lógica de negocio
import UserService from '../../services/userService.js';
import NotificationService from '../../services/notificationService.js';

// Los servicios de dominio internamente usan servicios core
const users = await UserService.getAllUsers(); // Usa api.js internamente
await NotificationService.send('mensaje'); // Usa api.js + lógica específica
```

## Cuándo Crear un Servicio de Dominio

Crea un servicio de dominio cuando:

- ✅ Hay lógica de negocio compleja que se repite en múltiples componentes
- ✅ Necesitas transformar o validar datos de manera específica para un dominio
- ✅ Hay múltiples endpoints API relacionados a una entidad/feature
- ✅ Quieres centralizar la lógica para facilitar testing

**NO** crear un servicio de dominio si:

- ❌ La lógica es muy simple (una sola llamada API sin transformación)
- ❌ Se usa en un solo lugar (mantenerlo en el componente)
- ❌ Es infraestructura genérica (debería ir en core services)

## Ejemplo de Implementación

### Servicio Core (Actual)

```javascript
// src/core/services/api.js
export default async function api(endpoint, options = {}) {
  const baseUrl = 'http://localhost';
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
    
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Error de conexión' };
  }
}
```

### Servicio de Dominio (Ejemplo Futuro)

```javascript
// src/services/userService.js (FUTURO)
import api from '../core/services/api.js';

class UserService {
  async getAllUsers() {
    const response = await api('/api/users');
    
    // Lógica de negocio: transformar datos
    if (response.success) {
      return response.data.map(user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        isActive: user.status === 'active'
      }));
    }
    
    throw new Error('Error al obtener usuarios');
  }
  
  async createUser(userData) {
    // Validaciones de negocio
    this.validateUserData(userData);
    
    const formData = new FormData();
    formData.append('name', userData.name);
    formData.append('email', userData.email);
    
    return await api('/api/users', {
      method: 'POST',
      body: formData
    });
  }
  
  validateUserData(data) {
    if (!data.email.includes('@')) {
      throw new Error('Email inválido');
    }
    // Más validaciones específicas...
  }
}

export default new UserService(); // Singleton
```

## Migración de Lógica

A medida que la aplicación crezca, considera mover lógica de componentes a servicios de dominio:

**Antes (lógica en componente):**
```javascript
// En Dashboard.js
async loadData() {
  const response = await api('/api/dashboard/stats');
  this.stats = response.data;
  this.calculatePercentages(); // Lógica de negocio en componente
}
```

**Después (lógica en servicio):**
```javascript
// En services/dashboardService.js
async getStats() {
  const response = await api('/api/dashboard/stats');
  return this.calculatePercentages(response.data);
}

// En Dashboard.js
async loadData() {
  this.stats = await DashboardService.getStats(); // Componente más limpio
}
```

## Convenciones

1. **Nombres de archivo:** camelCase con sufijo "Service" (ej: `userService.js`)
2. **Export:** Preferir singleton para servicios stateless
3. **Errores:** Lanzar errores específicos, no retornar booleanos
4. **Async:** Todos los métodos que llamen APIs deben ser async
5. **Documentación:** JSDoc para métodos públicos

## Notas

- Los servicios core **NO DEBEN** importar servicios de dominio
- Los servicios de dominio **PUEDEN** importar servicios core
- Los componentes **PUEDEN** importar cualquier servicio
- Evitar dependencias circulares entre servicios de dominio
