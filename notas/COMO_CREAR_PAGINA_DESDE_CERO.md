# Cómo crear una página desde cero

Fecha de referencia: 2026-07-14

Esta nota documenta el flujo real para crear una página nueva en el frontend actual y conectarla a la navegación.

Aplica para páginas dentro de `src/`.

## 1. Elegir el tipo de página

Antes de escribir código, decidir si la vista será:

### A. Página general

Úsala cuando la vista no siga el patrón de listado compartido.

Ejemplos:

- `src/pages/Inicio.js`
- `src/pages/supervision/supervision.js`
- `src/pages/tareas/TareaDetalle.js`

### B. Página de listado

Si comparte este patrón:

- título
- subtítulo
- buscador
- barra de columnas
- lista

entonces debe reutilizar:

- `src/pages/shared/catalog-list-page.base.js`

Referencias:

- `src/pages/puntosInteres/PuntosInteres.js`
- `src/pages/formularios/formularios.js`
- `src/pages/shared/CATALOG_LIST_PAGE_FLOW.md`

## 2. Crear el archivo de página

Ubicación recomendada:

- `src/pages/<modulo>/<Pagina>.js`

Si la página no pertenece a un submódulo claro, puede vivir directamente en `src/pages/`.

## 3. Seguir la convención de clase

Las clases nuevas o modificadas deben usar patrón Singleton.

Base mínima:

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
    container.innerHTML = '<div>Contenido</div>';
  }

  destroy() {
    // opcional
  }
}
```

Notas:

- `context`, `params` y `query` los entrega el router.
- `destroy()` se usa si la vista deja listeners, timers o suscripciones.

## 4. Montar la vista con la shell correcta

Las páginas autenticadas viven dentro de la shell iniciada en:

- `src/pages/inicio/main.js`

La composición visual base está en:

- `src/pages/inicio-layout.js`

Para páginas normales, la práctica recomendada es renderizar contenido dentro de esa shell o apoyarte en una base compartida que ya la use.

## 5. Respetar la base visual UIkit

Reglas obligatorias:

- comenzar por clases `uk-*`
- priorizar `uk-card`, `uk-button`, `uk-input`, `uk-text-*`, `uk-heading-*`
- evitar `style=""` para presentación si UIkit ya cubre el caso
- no mezclar clases de otros frameworks CSS

Si hace falta CSS custom:

- debe complementar UIkit
- debe existir una razón técnica breve si UIkit no cubre el caso

## 6. Si necesitas datos o APIs del navegador

Antes de resolverlo dentro de la página:

### Backend o catálogos

Revisar si ya existe servicio en:

- `src/core/services/apis-me/`

Si no existe y será reutilizable, crear uno ahí.

### APIs del navegador

Revisar si ya existe servicio en:

- `src/core/services/`

Ejemplos ya centralizados:

- `connectivity.service.js`
- `storage.service.js`
- `theme.service.js`
- `geolocation.service.js`

No duplicar listeners o chequeos transversales dentro de varias páginas.

## 7. Registrar la ruta

Archivo de alta de rutas:

- `src/pages/inicio/main.js`

Pasos:

1. Importar la nueva página.
2. Registrar la ruta con `registerRoute(...)`.
3. Definir `meta.title`.
4. Marcar `meta.requiresAuth: true` si es privada.

Ejemplo:

```js
import MiPagina from '../miModulo/MiPagina.js';

registerRoute('/mi-pagina', MiPagina, {
  meta: { title: 'Mi página', requiresAuth: true }
});
```

## 8. Conectarla al menú o a la navegación

Registrar la ruta no la hace visible automáticamente.

### Opción A. Sidebar principal de la app

Archivo:

- `src/components/sidebar-menu-component.js`

Agregar un item en `get items()`:

```js
{ path: '/mi-pagina', label: 'Mi página', icon: 'list' }
```

Esto aplica para las entradas principales del menú izquierdo de la app.

### Opción B. Acceso desde Inicio u otra página

Puedes agregar un acceso con `data-route` en la vista origen.

Referencia:

- `src/pages/Inicio.js`

Ejemplo:

```html
<a href="#/mi-pagina" data-route="/mi-pagina">Ir a mi página</a>
```

### Opción C. Navegación programática

Usar:

```js
import { navigate } from '../../core/router.js';

navigate('/mi-pagina');
```

## 9. Caso especial: páginas tipo listado

Si la vista es un listado, no partir desde cero visualmente.

Debes extender:

- `src/pages/shared/catalog-list-page.base.js`

Esa base ya resuelve:

- layout coherente con la app
- buscador responsive
- cabecera de columnas
- lista mobile/desktop
- hover ligado a tokens globales

Guía específica:

- `src/pages/shared/CATALOG_LIST_PAGE_FLOW.md`

## 10. Caso especial: supervisión

Si el cambio afecta el sidebar de `supervision`:

- la estructura declarativa vive en `doctosSupervision/<clienteId>/supervision-sidebar.json`
- si solo cambias nombre, color, orden o visibilidad, primero cambia el JSON del cliente
- no edites la página para cambios que pertenecen a la configuración declarativa

Referencias:

- `src/pages/supervision/SUPERVISION_SIDEBAR_CONFIG.md`
- `doctosSupervision/1/README.md`

## 11. Checklist mínimo antes de darla por lista

1. La clase usa patrón Singleton.
2. La UI parte de clases `uk-*`.
3. Si era listado, reutiliza `CatalogListPageBase`.
4. La ruta está registrada en `src/pages/inicio/main.js`.
5. La página es accesible desde sidebar, Inicio o navegación programática según el flujo esperado.
6. Si consume servicios compartidos, la lógica reusable vive en `src/core/services/` o `src/core/services/apis-me/`.
7. Si tocaste `src/`, ejecutaste `npm run build`.

## 12. Referencias rápidas

- Shell SPA: `src/pages/inicio/main.js`
- Layout autenticado: `src/pages/inicio-layout.js`
- Router: `src/core/router.js`
- Doc del router: `src/core/ROUTER.md`
- Páginas: `src/pages/README.md`
- Flujo de listados: `src/pages/shared/CATALOG_LIST_PAGE_FLOW.md`
