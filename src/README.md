# Frontend - Directorio src/

Arquitectura frontend basada en **Vanilla JavaScript (ES Modules)**, **Vite** y **UIKit**.

## Estructura

```text
src/
├── core/
│   ├── bootstrap.js
│   ├── router.js
│   ├── store.js
│   ├── ui.js
│   └── services/
├── pages/
│   ├── login/
│   │   ├── main.js
│   │   ├── LoginPage.js
│   │   └── login.css
│   ├── inicio/
│   │   └── main.js
│   ├── Inicio.js
│   ├── Dashboard.js
│   ├── Users.js
│   ├── UserDetail.js
│   └── SearchResults.js
├── components/
├── styles/
└── utils/
```

## Flujo de aplicación

1. Usuario entra a `/login/default`.
2. PHP carga el entrypoint `src/pages/login/main.js`.
3. Login valida usuario y autentica contra backend.
4. Si el login es correcto, redirige a `/inicio/default`.
5. `src/pages/inicio/main.js` monta el shell SPA y router hash (`#/inicio`, `#/dashboard`, etc).

## Routing

- Base híbrida PHP + SPA hash routing.
- Ejemplo URL: `/inicio/default#/dashboard`.
- Registro de rutas en `src/pages/inicio/main.js`.
- Las rutas privadas (`meta.requiresAuth`) se validan en guard global contra sesion PHP (via `getUser`), no solo por estado local.
- Si la sesion expira durante navegacion, se activa flujo central: aviso, limpieza de estado sensible y redireccion a `/login/default`.

## Estado y servicios

- `src/core/store.js`: estado global simple (usuario).
- `src/core/services/authService.js`: login/logout/getUser.
- `src/core/services/api.js`: wrapper de `fetch` con credenciales de sesión.
- `src/core/services/session-expiration.service.js`: manejo centralizado de sesion expirada (evita loops y limpia estado local sensible).
- `src/core/services/storage.service.js`: utilidades local/session storage.

## PWA

- La generación del service worker/manifest sigue en `vite-plugin-pwa`.
- El registro en runtime se hace con vanilla JS en `src/utils/pwa-register.js` usando `navigator.serviceWorker`.

## Build

```bash
npm run dev
npm run build
```

Entradas en `vite.config.js`:

- `login`: `src/pages/login/main.js`
- `inicio`: `src/pages/inicio/main.js`

## Convenciones

- Componentes/páginas: clases ES6 con `render(container)`.
- Navegación programática: `navigate('/ruta')`.
- Lazy loading para páginas secundarias cuando conviene.
- Estilos globales en `src/styles`, estilos de feature junto a su página.
- Base visual y tipografica debe apoyarse en UIkit (`uk-*`), minimizando `font-size` inline y overrides tipograficos globales.
