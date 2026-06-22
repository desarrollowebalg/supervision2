# Inicio Rápido PWA

## 1. Build

```bash
npm run build
npm run preview
```

## 2. Verifica archivos generados

```bash
ls dist/sw.js dist/manifest.webmanifest dist/manifest.json
```

## 3. Confirma entrypoints actuales

- `src/pages/login/main.js`
- `src/pages/inicio/main.js`

## 4. Verifica plantillas PHP

- `modules/login/default.php` usa `loadVite('src/pages/login/main.js')`
- `modules/inicio/default.php` usa `loadVite('src/pages/inicio/main.js')`

## 5. Requisitos PWA

- HTTPS en producción
- Íconos en `public/images/icons/`
- Service worker registrado

## 6. Checklist breve

- Login carga correctamente en `/login/default`
- Login exitoso redirige a `/inicio/default`
- Rutas hash funcionan (`#/inicio`, `#/dashboard`)
- Instalación PWA disponible en navegador compatible
