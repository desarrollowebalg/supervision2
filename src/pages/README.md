# Páginas SPA

Este directorio contiene las páginas activas de la aplicación y sus bases compartidas.

## Entrypoints

- `src/pages/login/main.js`: login y acceso inicial.
- `src/pages/inicio/main.js`: shell post-login, registro de rutas y guard global.

## Registro real de rutas

Fuente de verdad:

- `src/pages/inicio/main.js`

Rutas actuales:

- `#/inicio` -> `src/pages/Inicio.js`
- `#/profile` -> `src/pages/profile/Profile.js`
- `#/settings` -> `src/pages/settings.js`
- `#/formularios` -> `src/pages/formularios/formularios.js`
- `#/formularios/:indicator` -> `src/pages/formularios/form-evidencia.js`
- `#/cuadrantes` -> `src/pages/cuadrantes/Cuadrantes.js`
- `#/puntos-interes` -> `src/pages/puntosInteres/PuntosInteres.js`
- `#/supervision` -> `src/pages/supervision/supervision.js`
- `#/detalle-incidencia/:ide` -> `src/pages/supervision/DetalleIncidencia.js`
- `#/tareas` -> `src/pages/tareas/Tareas.js`
- `#/tareas/:taskId` -> `src/pages/tareas/TareaDetalle.js`
- `#/timeline` -> `src/pages/evidencias/Timeline.js`

## Guard de sesión

La SPA no confía solo en estado local.

- Las rutas privadas se registran con `meta.requiresAuth: true`.
- El `beforeEach` global de `src/pages/inicio/main.js` valida sesión real contra PHP usando `getUser()`.
- Si la sesión expiró:
  - limpia estado de usuario
  - ejecuta `handleSessionExpired(...)`
  - redirige a `/login/default`

## Layout compartido

- `src/pages/inicio-layout.js` centraliza shell, header, sidebar y eventos comunes.
- Las páginas autenticadas deben mantener consistencia con este layout.

## Patrón base para páginas de listado

Cuando una vista comparta este patrón:

- título
- subtítulo
- buscador
- barra de columnas
- lista

debe reutilizar:

- `src/pages/shared/catalog-list-page.base.js`

Referencias activas:

- `src/pages/puntosInteres/PuntosInteres.js`
- `src/pages/formularios/formularios.js`

Guías:

- `src/pages/shared/CATALOG_LIST_PAGE_FLOW.md`
- `notas/COMO_CREAR_PAGINA_DESDE_CERO.md`

## Cómo crear una página nueva

Guía operativa completa:

- `notas/COMO_CREAR_PAGINA_DESDE_CERO.md`

Esa nota cubre:

- decisión de patrón
- clase base Singleton
- registro de ruta
- conexión con sidebar o vista origen
- casos especiales como `supervision`
- validación final

## Convención de clase de página

Base recomendada:

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

## Formularios

### Resolución de detalle

- Ruta: `#/formularios/:indicator`
- Prioridad de `CLV`:
  1. query param `clv`
  2. catálogo local `ITEM_NUMBER -> CLV`

### Renderer modular

- Orquestador:
  - `src/pages/formularios/schema-renderer/schema-form.renderer.js`
- Componentes por tipo:
  - `src/pages/formularios/schema-renderer/components/`

### Reglas de evidencia

- `photo`, `gallery`, `signature` siguen siendo preguntas del formulario.
- Se suben primero a `save-photos`.
- En `save-text` solo viaja la referencia S3 persistida.

## Tareas

Cuando un formulario viene de tareas (`source=task`):

1. Se envía `save-text`.
2. Si regresa `ID_RC`, se ejecuta:
   - `/apis_me/tareas/close/<ID_TAREA>/<CLV_CAPTURA>/<ESTATUS>/<ID_RC>/`
3. Se actualizan catálogos locales.
4. Se redirige a `#/tareas`.

Referencia detallada:

- `src/pages/tareas/README.md`

## Supervisión

El sidebar izquierdo no es hardcoded por página para cambios declarativos.

- Configuración por cliente:
  - `doctosSupervision/<clienteId>/supervision-sidebar.json`
- Servicio de lectura:
  - `src/pages/supervision/services/supervision-sidebar-config.service.js`
- Normalización:
  - `src/pages/supervision/services/supervision-sidebar-config.normalizer.js`

Referencias:

- `src/pages/supervision/SUPERVISION_SIDEBAR_CONFIG.md`
- `doctosSupervision/1/README.md`
