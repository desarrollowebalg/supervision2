# Gu?a de Build y Deploy

## Build

```bash
npm run build
npm run preview
```

Salida esperada en `dist/`:
- `js/login.[hash].js`
- `js/inicio.[hash].js`
- `assets/*.css`
- `manifest.json`
- `manifest.webmanifest`
- `sw.js`

## Entradas Vite actuales

En `vite.config.js`:
- `src/pages/login/main.js`
- `src/pages/inicio/main.js`

## Integraci?n PHP

`vite.php` resuelve assets desde `dist/manifest.json`.

Entradas que deben usarse en backend:
- Login: `loadVite('src/pages/login/main.js')`
- Inicio: `loadVite('src/pages/inicio/main.js')`

## Flujo de navegaci?n

1. `/login/default` carga login.
2. Login exitoso redirige a `/inicio/default`.
3. SPA navega con hash (`#/inicio`, `#/formularios`, `#/formularios/:indicator`, `#/tareas`, etc).

## Validaciones r?pidas

```bash
npm run build
rg -n "src/pages/login/main.js|src/pages/inicio/main.js" -S *.php modules src
```

## Deploy

1. Ejecutar `npm run build`.
2. Publicar carpeta `dist/` completa.
3. Verificar que `manifest.webmanifest` y `sw.js` sean accesibles.
4. Probar login e inicio en entorno real.

