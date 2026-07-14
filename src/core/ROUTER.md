# Router SPA

Documentación del router real usado por la app en:

- `src/core/router.js`

## Qué resuelve hoy

- hash routing (`#/ruta`)
- parámetros dinámicos (`:indicator`, `:taskId`, `:ide`)
- query strings dentro del hash
- guards globales y por ruta
- metadata por ruta
- lazy loading opcional
- `404` y error de carga
- destrucción de la instancia previa si implementa `destroy()`

## Flujo real de inicialización

La inicialización actual vive en:

- `src/pages/inicio/main.js`

Secuencia:

1. `initApp()` hidrata sesión y tema.
2. Se registra cada ruta con `registerRoute(...)`.
3. Se llama `initRouter(content, { beforeEach, notFound })`.
4. Si no existe hash, se navega a `/inicio`.
5. Si existe hash, se llama `render(hashActual)`.

## API disponible

### `initRouter(container, options?)`

Inicializa el router en el contenedor raíz.

Opciones soportadas:

- `beforeEach(context)`
- `notFound(root, path)`

### `registerRoute(path, Component, options?)`

Registra una ruta.

Opciones:

- `beforeEnter`
- `meta`

### `navigate(path, options?)`

Navega a una ruta hash.

Opciones:

- `replace`
- `state`

### `render(path, state?)`

Renderiza manualmente una ruta.

### `getQueryParams(path?)`

Obtiene query params desde el hash actual o desde un path dado.

### `getCurrentPath()`

Devuelve el path actual del hash.

### Helpers exportados

- `requireAuth(redirectPath = '/login')`
- `requireRole(roles = [], redirectPath = '/unauthorized')`

Nota:

- En la app actual, la protección principal de sesión se hace con el `beforeEach` global de `src/pages/inicio/main.js`, que valida contra PHP usando `getUser()`.

## Ejemplo real de registro de rutas

```js
import { initRouter, registerRoute, navigate, render } from '../../core/router.js';

import Inicio from '../Inicio.js';
import Formularios from '../formularios/formularios.js';
import FormEvidencia from '../formularios/form-evidencia.js';
import Tareas from '../tareas/Tareas.js';

registerRoute('/inicio', Inicio, {
  meta: { title: 'Inicio', requiresAuth: true }
});

registerRoute('/formularios', Formularios, {
  meta: { title: 'Formularios', requiresAuth: true }
});

registerRoute('/formularios/:indicator', FormEvidencia, {
  meta: { title: 'Detalle de formulario', requiresAuth: true }
});

registerRoute('/tareas', Tareas, {
  meta: { title: 'Tareas', requiresAuth: true }
});
```

## Contexto que recibe cada página

El router construye este contexto:

```js
{
  path,
  fullPath,
  params,
  query,
  state,
  meta
}
```

Uso típico:

```js
export default class MiPagina {
  static instancia = null;

  constructor(context = {}) {
    if (MiPagina.instancia) {
      return MiPagina.instancia;
    }

    this.context = context;
    MiPagina.instancia = this;
  }

  render(container, params = {}, query = {}) {
    container.innerHTML = `
      <h1>${params.id || 'Sin parámetro'}</h1>
      <p>Filtro: ${query.filter || 'ninguno'}</p>
    `;
  }
}
```

## Parámetros y query strings

Ejemplos reales de patrones activos:

- `/formularios/:indicator`
- `/tareas/:taskId`
- `/detalle-incidencia/:ide`

Ejemplo de URL:

```text
/inicio/default#/formularios/QST164127?clv=11770&source=task
```

Resultado esperado:

- `params.indicator === 'QST164127'`
- `query.clv === '11770'`
- `query.source === 'task'`

## Navegación

### Navegación básica

```js
import { navigate } from '../../core/router.js';

navigate('/formularios');
navigate('/tareas/12345');
navigate('/formularios/QST164127?clv=11770');
```

### Con replace

```js
navigate('/inicio', { replace: true });
```

### Con state

```js
navigate('/supervision', {
  state: { selectedDate: '2026-07-14' }
});
```

## Navegación desde HTML

Patrón usado en la app:

```html
<a href="#/tareas" data-route="/tareas">Ir a tareas</a>
```

Luego la vista o layout enlaza los clicks para llamar `navigate(...)`.

Referencia:

- `src/pages/inicio-layout.js`

## Guard global actual

La app usa un `beforeEach` global con esta responsabilidad:

- revisar `meta.requiresAuth`
- consultar `getUser()`
- confirmar sesión válida en PHP
- ejecutar `handleSessionExpired(...)` si falla
- actualizar `document.title`
- hacer `window.scrollTo(0, 0)`

Esto evita confiar solo en `store.js` o `sessionStorage`.

## Lazy loading

El router sí soporta componentes lazy:

```js
registerRoute('/reporte', async () => {
  const module = await import('../reportes/Reporte.js');
  return module.default;
});
```

Si el componente es lazy:

- muestra spinner temporal
- luego instancia el componente cargado

## `destroy()`

Antes de renderizar una nueva página, el router destruye la instancia previa si existe:

```js
destroy() {
  // limpiar listeners, timers o suscripciones
}
```

Es importante implementarlo si la vista deja efectos colgando.

## Errores y `404`

- Si la ruta no existe, se ejecuta `notFound(...)` o fallback interno.
- Si falla la carga/render, el router muestra un bloque de error.

## Referencias relacionadas

- `src/pages/inicio/main.js`
- `src/pages/README.md`
- `notas/COMO_CREAR_PAGINA_DESDE_CERO.md`
