# Configuración PWA

## Estado actual

La PWA se genera con `vite-plugin-pwa` y el registro runtime se hace con vanilla JS en:
- `src/utils/pwa-register.js` (usa `navigator.serviceWorker`)

## Archivos relevantes

- `vite.config.js` (plugin PWA, manifest, workbox)
- `src/utils/pwa-register.js` (registro SW)
- `modules/login/template/default.dwt` (meta tags y manifest)
- `modules/inicio/template/default.dwt` (meta tags y manifest)

## Entradas SPA actuales

- `src/pages/login/main.js`
- `src/pages/inicio/main.js`

## Build PWA

```bash
npm run build
```

Genera:
- `dist/sw.js`
- `dist/manifest.webmanifest`
- `dist/workbox-*.js`

## Requisitos de instalación

- HTTPS en producción
- Manifest válido
- Service worker activo
- Iconos configurados en `public/images/icons`

## Verificación

1. DevTools -> Application -> Manifest.
2. DevTools -> Application -> Service Workers.
3. Lighthouse PWA audit.

## Nota

Si cambias rutas o entrypoints, actualiza también las cargas PHP (`loadVite(...)`) y vuelve a generar build.
