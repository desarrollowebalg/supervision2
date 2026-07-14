# Frontend `src/`

Arquitectura frontend actual basada en:

- Vanilla JavaScript con ES Modules
- Vite
- UIkit CSS como base obligatoria de UI
- SPA con hash routing montada dentro de `/inicio/default`

## Estructura real

```text
src/
├── components/                  # Web Components y piezas reutilizables
├── core/
│   ├── bootstrap.js             # Hidratación inicial de sesión/tema
│   ├── router.js                # Router hash de la SPA
│   ├── store.js                 # Estado global simple del usuario
│   └── services/                # Servicios singleton y acceso a APIs
├── pages/
│   ├── login/                   # Entry/login page
│   ├── inicio/                  # Entry de la SPA post-login
│   ├── formularios/
│   ├── supervision/
│   ├── tareas/
│   ├── puntosInteres/
│   ├── cuadrantes/
│   ├── evidencias/
│   └── shared/                  # Bases compartidas de páginas
├── styles/                      # Tokens y estilos globales
└── utils/                       # Utilidades de runtime
```

## Flujo general de aplicación

1. Usuario entra a `/login/default`.
2. PHP resuelve el entrypoint `src/pages/login/main.js`.
3. Si el login es exitoso, se redirige a `/inicio/default`.
4. `src/pages/inicio/main.js` inicializa la shell SPA.
5. Dentro de `/inicio/default`, la navegación continúa vía hash: `#/inicio`, `#/formularios`, `#/supervision`, etc.

## Entrypoints activos

- `src/pages/login/main.js`
- `src/pages/inicio/main.js`

## Rutas activas registradas hoy

Archivo de referencia:

- `src/pages/inicio/main.js`

Rutas:

- `#/inicio`
- `#/profile`
- `#/settings`
- `#/formularios`
- `#/formularios/:indicator`
- `#/cuadrantes`
- `#/puntos-interes`
- `#/supervision`
- `#/detalle-incidencia/:ide`
- `#/tareas`
- `#/tareas/:taskId`
- `#/timeline`

## Layout base

- `src/pages/inicio-layout.js` monta la shell autenticada:
  - `header-component`
  - `sidebar-menu-component`
  - contenedor principal de contenido
- Las páginas autenticadas deben apoyarse en esta shell directa o indirectamente.

## Convenciones vigentes

### UI

- Todo layout nuevo debe partir de clases `uk-*`.
- Priorizar componentes y utilidades UIkit antes que CSS custom.
- Evitar `style=""`, convenciones de otros frameworks y `!important` salvo compatibilidad puntual documentada.

### Clases de frontend

- Las clases nuevas o modificadas deben seguir patrón Singleton.
- La forma habitual de página sigue `constructor()` + `render(container, params, query)` y `destroy()` opcional.

### Servicios y APIs del navegador

- Toda API del navegador reutilizable debe centralizarse en `src/core/services/`.
- Ejemplos activos:
  - `connectivity.service.js`
  - `storage.service.js`
  - `theme.service.js`
  - `geolocation.service.js`

### Catálogos frontend

- El almacenamiento local oficial es IndexedDB con Dexie.
- Base obligatoria:
  - `src/core/services/catalog-indexeddb.service.js`
- Referencia principal:
  - `src/core/services/apis-me/forms.service.js`

## Patrones de páginas

### Página general

- Crear clase en `src/pages/<modulo>/<Pagina>.js`
- Registrar ruta en `src/pages/inicio/main.js`
- Conectar navegación desde sidebar o vista origen según aplique

### Página tipo listado

Si la vista comparte patrón:

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
- `notas/COMO_CREAR_PAGINA_DESDE_CERO.md`

## Módulos especiales

### Formularios

- `#/formularios/:indicator` resuelve `CLV` por query `clv` o catálogo local.
- El schema renderer vive en:
  - `src/pages/formularios/schema-renderer/schema-form.renderer.js`
  - `src/pages/formularios/schema-renderer/components/`

### Supervisión

- El sidebar de `supervision` depende de configuración externa por cliente:
  - `doctosSupervision/<clienteId>/supervision-sidebar.json`
- Si un cambio es solo de nombre, color, orden o visibilidad del sidebar, se modifica primero el JSON del cliente, no la página.

## Validación mínima

Si se toca `src/`, ejecutar al menos:

```bash
npm run build
```
