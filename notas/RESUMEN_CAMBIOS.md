# Resumen de Cambios

## Fecha

2026-05-04

## Refactor aplicado

Se migró la arquitectura frontend en `src` desde estructura modular a estructura por páginas vanilla JS.

### Cambios principales

1. Se eliminó `src/modules/`.
2. Nuevos entrypoints:
- `src/pages/login/main.js`
- `src/pages/inicio/main.js`
3. Login reescrito en `src/pages/login/LoginPage.js`.
4. Login exitoso ahora redirige a `/inicio/default`.
5. Se creó módulo backend `modules/inicio/` para sustituir el flujo anterior de app.
6. Registro PWA runtime migrado a vanilla JS (`navigator.serviceWorker`) en `src/utils/pwa-register.js`.
7. `vite.config.js` actualizado para entradas `login` e `inicio`.

## Compatibilidad

- Se mantiene integración PHP + SPA hash routing.
- Se mantiene generación PWA por Vite en build.

## Verificación ejecutada

- `npm run build` completado sin errores.
- Se generaron correctamente `sw.js` y `manifest.webmanifest`.
